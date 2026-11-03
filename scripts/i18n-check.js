// Çeviri denetimi:
// 1) Her anahtar tr, en ve nl'de var mı, yer tutucular ({ad}) aynı mı?
// 2) Kaynakta (sözlükler hariç) Türkçeye özgü harf içeren metin kaldı mı? (yorumlar hariç, sezgisel)
// Kullanım: node scripts/i18n-check.js   — sorun varsa 1 ile çıkar.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'web', 'src');
const read = (p) => fs.readFileSync(p, 'utf8');
global.localStorage = { getItem: () => null, setItem() {} };
global.navigator = { language: 'tr-TR' };
global.document = { documentElement: {} };

const dictDir = path.join(src, 'i18n');
const files = fs.existsSync(dictDir) ? fs.readdirSync(dictDir).filter((f) => f.endsWith('.js')).sort() : [];
const I18N = new Function(read(path.join(src, 'i18n.js')) + '\n' + files.map((f) => read(path.join(dictDir, f))).join('\n') + '\nreturn I18N;')();
const D = I18N.dict;

let problems = 0;
const report = (m) => { problems++; console.log(m); };
const holders = (s) => (typeof s === 'string' ? (s.match(/\{\w+(?::\w+)?\}/g) || []).map((h) => h.replace(/:\w+\}/, '}')).sort().join(',') : '(fn)');

const all = new Set([...Object.keys(D.tr), ...Object.keys(D.en), ...Object.keys(D.nl)].map((k) => k.replace(/_one$/, '')));
for (const k of all) {
  for (const l of ['tr', 'en', 'nl']) if (D[l][k] == null) report(`eksik [${l}] ${k}`);
  const h = ['tr', 'en', 'nl'].filter((l) => D[l][k] != null).map((l) => [l, holders(D[l][k])]);
  if (new Set(h.map((x) => x[1])).size > 1) report(`yer tutucu farkı ${k}: ${h.map((x) => x.join('=')).join(' ')}`);
}

// Kaynak tarama
const TR = /[ğüşöçıİĞÜŞÖÇ]/;
const strip = (code, html) => (html ? code.replace(/<!--[\s\S]*?-->/g, '') : code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1'));
const scan = (file) => {
  const html = file.endsWith('.html');
  strip(read(file), html).split('\n').forEach((line, i) => { if (TR.test(line)) report(`Türkçe metin ${path.relative(path.join(__dirname, '..'), file)}:${i + 1}: ${line.trim().slice(0, 110)}`); });
};
const walk = (d) => fs.readdirSync(d).forEach((f) => {
  const p = path.join(d, f);
  if (fs.statSync(p).isDirectory()) { if (f !== 'i18n') walk(p); } else if (/\.(js|html)$/.test(f) && f !== 'i18n.js') scan(p);
});
walk(src);

console.log(`${all.size} anahtar, ${problems} sorun`);
process.exit(problems ? 1 : 0);
