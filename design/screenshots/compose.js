// raw/ → out/<dil>/<cihaz>-<n>-<sahne>.png  (App Store tam piksel boyutları)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const cap=JSON.parse(fs.readFileSync(__dirname+'/captions.json','utf8'));
const vd='/home/user/neocaridina/web/vendor/';
// Oyunun kendi fontları (fonts.css) gömülür: başlık Zilla Slab, metin M PLUS Rounded 1c
const ff=fs.readFileSync(vd+'fonts.css','utf8').replace(/url\((fonts\/[^)]+)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(vd+f).toString('base64')})`);
const SIZE={iphone:[1320,2868],ipad:[2064,2752]};const ORDER=['title','tank','codex','water','orders','night'];
(async()=>{const b=await chromium.launch();
for(const dev of ['iphone','ipad'])for(const lang of ['tr','en','nl']){const [W,H]=SIZE[dev];fs.mkdirSync(`${__dirname}/out/${lang}`,{recursive:true});
 const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
 for(const [i,sc] of ORDER.entries()){const f=`${__dirname}/raw/${dev}-${lang}-${sc}.png`;if(!fs.existsSync(f))continue;
  const img='data:image/png;base64,'+fs.readFileSync(f).toString('base64');const [t1,t2]=cap[sc][lang];
  const top=dev==='iphone'?470:400,shotH=H-top-(dev==='iphone'?90:80);
  await p.setContent(`<html><head><style>${ff}html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{background:linear-gradient(180deg,#2b7f86 0%,#348f8f ${top-40}px,#f7f3ea ${top-40}px,#efe8da 100%);font-family:'M PLUS Rounded 1c'}
  .w{position:absolute;left:0;right:0;top:calc(${top-40}px - 2px);height:46px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 16' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L120 0 L120 6 C 110 2, 105 12, 90 8 S 60 0, 45 8 S 15 1, 0 9Z' fill='%23348f8f'/%3E%3C/svg%3E") 0 0/480px 46px repeat-x}
  .b{position:absolute;border-radius:50%;border:4px solid rgba(255,255,255,.5)}
  .c{position:absolute;left:0;right:0;top:0;height:${top}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${dev==='iphone'?80:160}px;box-sizing:border-box}
  h1{margin:0;font:600 ${dev==='iphone'?100:108}px/1.05 'Zilla Slab';color:#fff;font-variant-numeric:lining-nums}
  p{margin:${dev==='iphone'?26:22}px 0 0;font:700 ${dev==='iphone'?48:52}px/1.25 'M PLUS Rounded 1c';color:#f3d58a}
  .s{position:absolute;left:50%;top:${top}px;height:${shotH}px;transform:translateX(-50%);border-radius:${dev==='iphone'?64:44}px;overflow:hidden;box-shadow:0 30px 70px rgba(16,30,28,.35),0 0 0 12px #fffdf8,0 0 0 13px rgba(34,48,42,.15)}
  .s img{height:100%;display:block}</style></head><body><div class="w"></div><div class="b" style="width:26px;height:26px;right:14%;top:5%"></div><div class="b" style="width:16px;height:16px;right:10%;top:9%"></div><div class="c"><h1>${t1}</h1><p>${t2}</p></div><div class="s"><img src="${img}"></div></body></html>`);
  await p.waitForTimeout(150);await p.screenshot({path:`${__dirname}/out/${lang}/${dev}-${i+1}-${sc}.png`});}
 await p.close();}
await b.close();})();
