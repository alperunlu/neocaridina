// web/src/* -> game-html.js (Expo WebView için tek parça, çevrimdışı HTML)
//            -> dist/game.html (tarayıcıda test için aynı dosya)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'web', 'src');
const vendor = path.join(root, 'web', 'vendor');
const read = (p) => fs.readFileSync(p, 'utf8');
const inlineJs = (s) => s.replace(/<\/script/gi, '<\\/script');

const fontCss = read(path.join(vendor, 'fonts.css')).replace(/url\((fonts\/[^)]+)\)/g, (_, rel) => {
  const b64 = fs.readFileSync(path.join(vendor, rel)).toString('base64');
  return `url(data:font/woff2;base64,${b64})`;
});

// app/ altındaki dosyalar sırayla tek bir IIFE içinde birleşir (ortak kapsam).
const appDir = path.join(src, 'app');
const app = fs.readdirSync(appDir).filter((f) => f.endsWith('.js')).sort().map((f) => read(path.join(appDir, f))).join('');

// Çeviri çekirdeği ve sözlükler sim'den önce yüklenir (sim de t() kullanır).
const dictDir = path.join(src, 'i18n');
const dicts = fs.existsSync(dictDir) ? fs.readdirSync(dictDir).filter((f) => f.endsWith('.js')).sort().map((f) => read(path.join(dictDir, f))).join('\n') : '';
const i18n = read(path.join(src, 'i18n.js')) + '\n' + dicts;

const html = [
  read(path.join(src, 'head.html')),
  `<style>${fontCss}</style>\n<style>\n${read(path.join(src, 'styles.css'))}</style>\n</head>\n<body>\n`,
  read(path.join(src, 'body.html')),
  `\n<script>${inlineJs(read(path.join(vendor, 'three.min.js')))}</script>\n`,
  `\n<script id="i18n">\n${inlineJs(i18n)}</script>\n`,
  `\n<script id="sim">\n${inlineJs(read(path.join(src, 'sim.js')))}</script>\n`,
  `\n<script id="app">\n(function(){\n${inlineJs(app)}})();\n</script>\n</body>\n</html>\n`,
].join('');

if (/(src|href)=["']https?:/i.test(html)) throw new Error('Uzak kaynak bulundu; her şey yerel olmalı');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'game.html'), html);
fs.writeFileSync(path.join(root, 'game-html.js'), 'module.exports = ' + JSON.stringify(html) + ';\n');
console.log('game-html.js yazıldı:', (html.length / 1024).toFixed(0), 'KB');
