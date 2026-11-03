// Oyunun gerçek 3D sahnesini UI olmadan, istenen piksel boyutunda yakalar.
const {chromium}=require('playwright');const fs=require('fs');
const [w,h,dpr,out,zoom,drag,dy]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],+(process.argv[6]||5),+(process.argv[7]||0),+(process.argv[8]||0)];
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr});
await c.addInitScript(sv=>{localStorage.setItem('neokarides_lang','en');localStorage.setItem('neokarides_v1',sv);},fs.readFileSync(__dirname+'/save-day.json','utf8'));
const p=await c.newPage();p.setDefaultTimeout(180000);await c.route(/^https?:/,r=>r.abort());await p.goto('file:///home/user/neocaridina/dist/game.html');await p.waitForTimeout(2500);
await p.click('#title [data-t="load"]');await p.waitForTimeout(1200);
await p.addStyleTag({content:'#hud,#hudM,#dockWrap,#toasts,#selCard,#cele,#title,#scrim,#modal{display:none!important}'});
await p.evaluate(()=>dispatchEvent(new Event('resize')));await p.waitForTimeout(800);
const box={x:w/2,y:h*0.55};await p.mouse.move(box.x,box.y);
if(drag||dy){await p.mouse.down();await p.mouse.move(box.x+drag,box.y+dy,{steps:12});await p.mouse.up();await p.waitForTimeout(1500);}
for(let i=0;i<zoom;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(50);}
await p.waitForTimeout(3500);await p.screenshot({path:out});await b.close();})();
