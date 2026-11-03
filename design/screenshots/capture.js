// Gerçek oyun durumlarını yakalar: raw/<cihaz>-<dil>-<sahne>.png
const {chromium}=require('playwright');const fs=require('fs');
const DEV={iphone:{vp:{width:390,height:844},dpr:3},ipad:{vp:{width:1024,height:1366},dpr:2}};
const dev=process.argv[2],langs=(process.argv[3]||'tr,en,nl').split(','),only=process.argv[4]?process.argv[4].split(','):null;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});fs.mkdirSync(__dirname+'/raw',{recursive:true});
for(const lang of langs){
 const run=async(save,scene,fn,tries=2)=>{if(only&&!only.includes(scene))return;try{await run1(save,scene,fn);}catch(e){if(tries>1){process.stderr.write('retry '+scene+' ');return run(save,scene,fn,tries-1);}throw e;}};
 const run1=async(save,scene,fn)=>{const c=await b.newContext({viewport:DEV[dev].vp,deviceScaleFactor:DEV[dev].dpr,hasTouch:true});
  await c.addInitScript(([l,sv])=>{localStorage.setItem('neokarides_lang',l);localStorage.setItem('neokarides_v1',sv);},[lang,fs.readFileSync(__dirname+'/'+save,'utf8')]);
  const p=await c.newPage();await c.route(/^https?:/,r=>r.abort());await p.goto('file:///home/user/neocaridina/dist/game.html');await p.waitForTimeout(2500);
  await fn(p);await p.screenshot({path:`${__dirname}/raw/${dev}-${lang}-${scene}.png`});await c.close();process.stderr.write(scene+' ');};
 const load=async p=>{await p.$eval('#title [data-t="load"]',e=>e.click());await p.waitForTimeout(1200);
   await p.evaluate(()=>{document.querySelectorAll('#toasts > *').forEach(e=>e.remove());const h=document.getElementById('hint');if(h)h.style.visibility='hidden';});};
 const zoom=async(p,n)=>{const box=await p.locator('#c').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height*0.55);for(let i=0;i<n;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(40);}await p.waitForTimeout(1500);};
 const open=async(p,k)=>{const ph=await p.evaluate(()=>getComputedStyle(document.getElementById('nav')).display!=='none');
   if(ph&&k==='tank'){await p.click('#nav [data-n="care"]');await p.waitForTimeout(400);await p.click('#pop [data-p="values"]');}
   else await p.click(ph?`#nav [data-n="${k}"]`:`#menu [data-m="${k}"]`);await p.waitForTimeout(900);};
 await run('save-day.json','title',async p=>{await p.waitForTimeout(800);});
 await run('save-day.json','tank',async p=>{await load(p);await zoom(p,dev==='ipad'?2:1);});
 await run('save-day.json','codex',async p=>{await load(p);await open(p,'book');await p.click('#mBody [data-a="bsub"][data-v="codex"]');await p.waitForTimeout(1500);});
 await run('save-day.json','water',async p=>{await load(p);await open(p,'tank');await p.waitForTimeout(600);});
 await run('save-day.json','orders',async p=>{await load(p);await open(p,'orders');});
 await run('save-night.json','night',async p=>{await load(p);await zoom(p,1);await p.waitForTimeout(1200);});
}
await b.close();})();
