/* ================= keyboard ================= */
addEventListener('keydown',e=>{if(e.target&&/input|textarea|select/i.test(e.target.tagName))return;
  if(e.key==='Escape'){if(ui.pop)closePop();else if(ui.modal)closeModal();else if(selId){selId=null;renderSel();}else{ui.tool='look';renderDock();}return;}
  if(e.key===' '){e.preventDefault();speed=speed?0:(S.speed||1);if(speed)S.speed=speed;renderHUD();return;}
  if(/^[0-9]$/.test(e.key)){const i=(+e.key+9)%10;if(HOTKEYS[i])useTool(HOTKEYS[i]);}});

/* ================= layout ================= */
function layoutSoon(){layoutT=0.05;}
function vis(el){return el&&el.getClientRects().length>0;}
function measure(){let hudB=0;for(const el of document.querySelectorAll('#hud .pill,#hud .ibtn,#hud #alert,#hudM .pill,#hudM .rbtn,#hudM .alertB'))if(vis(el)&&!el.hidden){const r=el.getBoundingClientRect();if(r.bottom>hudB)hudB=r.bottom;}
  let dTop=innerHeight;for(const id of['dock','nav'])if(vis($(id)))dTop=Math.min(dTop,$(id).getBoundingClientRect().top);
  document.documentElement.style.setProperty('--hudB',hudB+'px');document.documentElement.style.setProperty('--dockH',(innerHeight-dTop)+'px');
  const avail=Math.max(120,dTop-hudB-16);LAY.frac=avail/innerHeight;LAY.off=-((hudB)-(innerHeight-dTop))/2;
  if(!userZoom)cam.r=fitR();}

/* ================= boot ================= */
let last=performance.now(),uiT=0,saveT=0;const last0=last;let woodRe=0;
const IDLE_MS=10000,IDLE_GAP=1000/24,COVER_GAP=1000/12,SIM_BUDGET_MS=8;
let running=true,rafId=0,lastInput=last,covered=false,coverDirty=true,renders=0,readySent=false,fontsOk=false,stressPrev={},stressCool=-1e9;
for(const ev of['pointerdown','pointermove','touchstart','wheel','keydown'])addEventListener(ev,()=>{lastInput=performance.now();},{capture:true,passive:true});

// Ekranı tamamen kaplayan bir pencere açıkken 3B sahneyi çizmeye gerek yok.
function checkCovered(){coverDirty=false;const m=$('modal');if(!m||m.hidden){covered=false;return;}
  const r=m.getBoundingClientRect();covered=r.width>=innerWidth-24&&r.top<=Math.max(64,innerHeight*0.08)&&r.bottom>=innerHeight*0.9;}
try{new MutationObserver(()=>{coverDirty=true;}).observe($('modal'),{attributes:true,attributeFilter:['hidden','class','style']});}catch(e){}
addEventListener('resize',()=>{coverDirty=true;});

// Stres uyarısı yok: oyun hızı kendiliğinden düşmez, oyuncu durumu kendisi fark eder.
function checkStress(){}

function stepSim(dt){if(speed<=0||titleOn)return;acc+=dt*speed;
  // Sabit adım sınırı yerine zaman bütçesi: yavaş cihazda kare düşmesin, kalan saatler sonraki kareye kalsın.
  const dl=performance.now()+SIM_BUDGET_MS;while(acc>=1){SIM.stepHour(S);acc-=1;if(performance.now()>dl)break;}
  if(acc>4)acc=4;checkStress();}

function frame(now){rafId=requestAnimationFrame(frame);
  if(coverDirty)checkCovered();
  // Boştayken (duraklatılmış ya da 10 sn dokunulmamış) ~24 fps, tam ekran pencere altında hiç çizim yok.
  const idle=speed===0||now-lastInput>IDLE_MS,gap=covered?COVER_GAP:idle?IDLE_GAP:0;
  if(gap&&now-last<gap-2)return;
  const dt=Math.min(0.1,Math.max(0,(now-last)/1000));last=now;
  stepSim(dt);
  if(layoutT>0){layoutT-=dt;if(layoutT<=0)measure();}
  if(!covered){
    if(!woodRe&&now-last0>600){woodRe=1;WOOD.needsUpdate=true;}
    if(titleOn&&!(typeof RM!=='undefined'&&RM.matches))cam.th+=dt*0.06;// menü arkasında sahne yavaşça döner
    updateScene(dt,now/1000);
    renderer.render(scene,camera);renders++;
    if(!readySent&&fontsOk){readySent=true;window.__ncReady=true;nativePost({t:'ready'});}
  }
  audioTick();
  uiT-=dt;if(uiT<=0){uiT=0.5;coverDirty=true;renderHUD();flushLog();if(ui.modal&&performance.now()-ui.touch>1500)renderModal();if(!ui.modal)renderSel();}
  saveT-=dt;if(saveT<=0){saveT=30;save();}
}
// Duraklat = çizimi durdur + sesi askıya al. Oyuncunun hız ayarına dokunmaz.
function gamePause(){if(!running)return;running=false;cancelAnimationFrame(rafId);rafId=0;audioPause();}
function gameResume(){if(running)return;running=true;last=performance.now();lastInput=last;coverDirty=true;audioResume();rafId=requestAnimationFrame(frame);}
// WebGL bağlamı kaybolursa: kaydet, sonra WebView'i (native) ya da sayfayı yeniden kur.
function onContextLost(){try{save();}catch(e){}hardReload();}
$('c').addEventListener('webglcontextlost',e=>{e.preventDefault();onContextLost();});
window.__nc={save:()=>save(),pause:gamePause,resume:gameResume,stats:()=>({running,renders,covered,speed,saveBlocked})};
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();gamePause();}else gameResume();});
addEventListener('pagehide',()=>{save();});

// Okunamayan kayıt: üzerine yazma; yedeği yükle ya da bilerek yeni oyuna başla.
function showRecover(){const bak=getBackup(),okBak=!!(bak&&parseSave(bak));const d=document.createElement('div');d.id='ncRecover';d.setAttribute('role','alertdialog');d.setAttribute('aria-labelledby','ncRecT');
  d.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:rgba(43,33,24,.55)';
  d.innerHTML=`<div style="max-width:420px;background:var(--paper);color:var(--ink);border:3px solid var(--line);border-radius:22px;padding:18px 18px 16px">
  <h2 id="ncRecT" style="margin:0 0 8px;font-size:20px">${esc(t('boot.recTitle'))}</h2>
  <p style="margin:0 0 6px">${esc(t('boot.recBody'))}</p>
  <p style="margin:0 0 14px;color:var(--muted)">${esc(t(okBak?'boot.recBak':'boot.recNoBak'))}</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${okBak?`<button class="btn" data-r="bak" style="min-height:44px">${esc(t('boot.loadBak'))}</button>`:''}<button class="btn" data-r="new" style="min-height:44px${okBak?';background:var(--chip);color:var(--ink)':''}">${esc(t('boot.newGame'))}</button></div></div>`;
  d.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!b)return;sfx.tap();
    if(b.dataset.r==='bak'){saveBlocked=false;try{localStorage.setItem(SAVE,bak);}catch(_){}hardReload();return;}
    saveBlocked=false;saveBroken=null;d.remove();save();openModal('help');});
  document.body.appendChild(d);}

if(saveBroken){speed=0;showRecover();}else showTitle();
resize();renderHUD();measure();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fontsOk=true;hudCache='';renderHUD();measure();},()=>{fontsOk=true;});else fontsOk=true;
rafId=requestAnimationFrame(frame);
