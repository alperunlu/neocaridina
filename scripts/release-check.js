// EAS'a build göndermeden önce yerelde, ücretsiz hazırlık kontrolü.
// Kullanım: npm run release:check   (Playwright gerekiyorsa NODE_PATH=/opt/node22/lib/node_modules)
// Her adım ✓/✗ yazar; bir ✗ varsa 1 ile çıkar.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, '..');
const sh = (cmd) => execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
let failed = 0;
const step = (name, fn) => {
  try { const note = fn(); console.log(`✓ ${name}${note ? ' — ' + note : ''}`); }
  catch (e) { failed++; console.log(`✗ ${name}\n    ${String(e.stdout || e.message).trim().split('\n').slice(-6).join('\n    ')}`); }
};

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;

step('Giriş noktası registerRootComponent çağırıyor', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const entry = fs.readFileSync(path.join(root, pkg.main), 'utf8');
  if (!/registerRootComponent\(/.test(entry)) throw new Error(`${pkg.main} registerRootComponent çağırmıyor`);
});

step('app.json temel alanlar', () => {
  const miss = [];
  if (!app.ios || !app.ios.bundleIdentifier) miss.push('ios.bundleIdentifier');
  if (!/^\d+\.\d+\.\d+$/.test(app.version || '')) miss.push('version (x.y.z)');
  if (!app.ios || !app.ios.privacyManifests) miss.push('ios.privacyManifests');
  if (!(app.ios && app.ios.config && app.ios.config.usesNonExemptEncryption === false)) miss.push('ios.config.usesNonExemptEncryption=false');
  if (miss.length) throw new Error('eksik: ' + miss.join(', '));
  return `${app.ios.bundleIdentifier} v${app.version}`;
});

step('app.json içindeki dosyalar git\'te', () => {
  const tracked = new Set(sh('git ls-files').split('\n'));
  const refs = JSON.stringify(app).match(/"\.\/[^"]+"/g) || [];
  const missing = refs.map((r) => r.slice(3, -1)).filter((p) => !tracked.has(p));
  if (missing.length) throw new Error('git\'te değil: ' + missing.join(', '));
  return refs.length + ' dosya';
});

step('İkon 1024×1024, alfa kanalsız', () => {
  const b = fs.readFileSync(path.join(root, app.icon));
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20), colorType = b[25];
  if (w !== 1024 || h !== 1024) throw new Error(`${w}×${h}`);
  if (colorType === 4 || colorType === 6) throw new Error('PNG alfa kanalı içeriyor (App Store reddeder)');
});

step('Çeviriler eksiksiz (npm run i18n)', () => sh('node scripts/i18n-check.js').trim().split('\n').pop());

step('game-html.js kaynaklarla güncel', () => {
  sh('node scripts/build-web.js');
  const diff = sh('git status --porcelain game-html.js').trim();
  if (diff) throw new Error('game-html.js yeniden üretildi ve değişti: commit et (EAS de build sırasında yeniden üretir)');
});

step('Çevrimdışı duman testi', () => sh('node scripts/smoke.js').trim().split('\n').length + ' görünüm');

const out = path.join(os.tmpdir(), 'expo-release-check');
step('expo export (iOS üretim bundle\'ı)', () => {
  fs.rmSync(out, { recursive: true, force: true });
  sh(`npx expo export --platform ios --output-dir ${out}`);
  const dir = path.join(out, '_expo', 'static', 'js', 'ios');
  const hbc = fs.readdirSync(dir).find((f) => f.endsWith('.hbc'));
  const buf = fs.readFileSync(path.join(dir, hbc));
  // Hermes ASCII olmayan dizgeleri UTF-16 saklar: iki kodlamayı da ara.
  const has = (s) => buf.includes(Buffer.from(s, 'latin1')) || buf.includes(Buffer.from(s, 'utf16le'));
  if (!has('registerRootComponent')) throw new Error('bundle registerRootComponent içermiyor');
  for (const bad of ['fonts.googleapis.com', 'cdnjs.cloudflare.com']) if (has(bad)) throw new Error('bundle uzak kaynak içeriyor: ' + bad);
  return `${hbc} ${(buf.length / 1048576).toFixed(1)} MB`;
});

step('Çalışma ağacı temiz', () => {
  const s = sh('git status --porcelain').trim();
  if (s) throw new Error('commit edilmemiş değişiklik var:\n' + s);
});

console.log(failed ? `\n${failed} kontrol başarısız. Build göndermeden önce düzelt.` : '\nHazır: npx eas build --platform ios --profile production');
process.exit(failed ? 1 : 0);
