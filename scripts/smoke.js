// Offline duman testi: dist/game.html'i ağ kapalıyken headless Chromium'da açar.
// Kullanım: node scripts/smoke.js [çıktı-klasörü]
// JS hatası, dış istek ya da WebGL hata ekranı varsa 1 ile çıkar.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const out = process.argv[2] || path.join(__dirname, '..', 'dist', 'shots');
fs.mkdirSync(out, { recursive: true });
const file = 'file://' + path.join(__dirname, '..', 'dist', 'game.html');

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let failed = false;
  for (const [name, vp] of [['phone', { width: 390, height: 844 }], ['tablet', { width: 1024, height: 1366 }], ['landscape', { width: 844, height: 390 }]]) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
    page.on('request', (r) => { if (!/^(file|data|about|blob):/.test(r.url())) external.push(r.url()); });
    await ctx.route(/^https?:/, (r) => r.abort());
    await page.goto(file);
    await page.waitForTimeout(3000);
    // Açılış penceresini kapatıp tankın kendisini de çek
    await page.screenshot({ path: path.join(out, `${name}-0.png`) });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${name}-1.png`) });
    const errVisible = await page.$eval('#err', (e) => getComputedStyle(e).display !== 'none');
    console.log(name, { errors, external, errVisible });
    if (errors.length || external.length || errVisible) failed = true;
    await ctx.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
