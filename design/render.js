// SVG → PNG (tam piksel). Kullanım: node render.js giriş.svg çıkış.png genişlik yükseklik [şeffaf]
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [inp,out,w,h,tr]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w,height:+h}});
await p.setContent(`<html><body style="margin:0;background:${tr?'transparent':'#000'}">${fs.readFileSync(inp,'utf8').replace(/width="\d+" height="\d+"/,`width="${w}" height="${h}"`)}</body></html>`);
await p.screenshot({path:out,omitBackground:!!tr,clip:{x:0,y:0,width:+w,height:+h}});await b.close();})();
