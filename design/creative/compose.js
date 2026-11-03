// App Store header (3840×1646) ve search results (2400×1600) görselleri.
// Oyunun 3D sahnesi (render.js ile arayüzsüz yakalanır) + oyunun pencere başlıklarındaki gibi
// su rengi şerit ve dalgalı alt kenar. Fontlar oyunun kendisinden: başlık Zilla Slab, metin M PLUS Rounded 1c.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const {shrimpSVG}=require(path.join(__dirname,'..','shrimp.js'));
const vd=path.join(__dirname,'..','..','web','vendor')+'/';
const ff=fs.readFileSync(vd+'fonts.css','utf8').replace(/url\((fonts\/[^)]+)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(vd+f).toString('base64')})`);
const b64=f=>'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,f)).toString('base64');
const logo=id=>`<svg viewBox="80 60 960 700" xmlns="http://www.w3.org/2000/svg">${shrimpSVG({id})}</svg>`;
// dalga: oyundaki .mh::after ile aynı çizgi, ters çevrilmiş (şerit üstte, sahne altta)
const wave=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 16' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L120 0 L120 6 C 110 2, 105 12, 90 8 S 60 0, 45 8 S 15 1, 0 9Z' fill='%23348f8f'/%3E%3C/svg%3E")`;
const page=({W,H,img,band,wh,body})=>`<html><head><meta charset="utf-8"><style>${ff}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#22302a}
.i{position:absolute;left:0;right:0;bottom:0;top:${band-20}px;background:url(${img}) 50% 22%/cover no-repeat}
.v{position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 60%,rgba(0,0,0,0) 60%,rgba(16,30,28,.35) 100%)}
.band{position:absolute;left:0;right:0;top:0;height:${band}px;background:linear-gradient(180deg,#2b7f86 0%,#348f8f 100%)}
.wave{position:absolute;left:0;right:0;top:${band-2}px;height:${wh}px;background:${wave} 0 0/${wh*10}px ${wh}px repeat-x;filter:drop-shadow(0 ${wh/4}px ${wh/2}px rgba(16,30,28,.18))}
.bub{position:absolute;border-radius:50%;border:${Math.round(wh/7)}px solid rgba(255,255,255,.5)}
h1,p{margin:0;font-variant-numeric:lining-nums}
</style></head><body><div class="i"></div><div class="v"></div><div class="band"></div><div class="wave"></div>${body}</body></html>`;
(async()=>{const b=await chromium.launch();
 const shot=async(W,H,html,out)=>{const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});await p.setContent(html);
   await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);await p.screenshot({path:path.join(__dirname,out),type:'png'});await p.close();};
 // Header: logo + oyun adı ortada (Apple kenarları cihaza göre kırpabilir)
 {const W=3840,H=1646,band=470;
  await shot(W,H,page({W,H,img:b64('raw-header.png'),band,wh:90,body:`
   <div style="position:absolute;left:50%;top:0;height:${band}px;transform:translateX(-50%);display:flex;align-items:center;gap:56px">
    <div style="width:330px;height:240px;filter:drop-shadow(0 10px 22px rgba(16,30,28,.35))">${logo('h')}</div>
    <div><h1 style="font:600 210px/0.95 'Zilla Slab';color:#fff">Neocaridina</h1>
     <p style="margin:14px 0 0 6px;font:800 84px/1 'M PLUS Rounded 1c';color:#f3d58a">Shrimp Farm</p></div></div>
   <div class="bub" style="width:44px;height:44px;left:70%;top:80px"></div><div class="bub" style="width:26px;height:26px;left:72.5%;top:150px"></div>
   <div class="bub" style="width:30px;height:30px;left:27%;top:120px"></div>`}),'header-en.png');}
 // Search results: kısa slogan
 {const W=2400,H=1600,band=440;
  await shot(W,H,page({W,H,img:b64('raw-search2.png'),band,wh:70,body:`
   <div style="position:absolute;left:0;right:0;top:0;height:${band}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    <h1 style="font:600 150px/1.02 'Zilla Slab';color:#fff">Breed every colour</h1>
    <p style="margin-top:26px;font:800 66px/1.2 'M PLUS Rounded 1c';color:#f3d58a">Build, cycle and grow your shrimp farm</p></div>
   <div class="bub" style="width:34px;height:34px;left:86%;top:70px"></div><div class="bub" style="width:20px;height:20px;left:89%;top:128px"></div>`}),'search-en.png');}
 await b.close();})();
