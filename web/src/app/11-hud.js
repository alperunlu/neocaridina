/* ================= HUD ================= */
let hudCache='',hudCacheM='';
const RMQ=matchMedia('(prefers-reduced-motion: reduce)');
// Para metni: fmt.hud (1000 üstünde kuruşsuz, dile göre) ya da fmt.money, yoksa SIM.eur.
function moneyTxt(v){if(typeof fmt!=='undefined'&&fmt&&typeof (fmt.hud||fmt.money)==='function'){try{const m=String((fmt.hud||fmt.money)(v)).replace(/€/g,'').trim();if(m)return m;}catch(e){}}return SIM.eur(v).replace(/€/g,'').trim();}
/* ---- para sayacı: değişince ~400 ms'de akar ---- */
const MT={shown:S.money,from:S.money,to:null,t0:0,raf:0,ext:0};
function paintMoney(v){const m=moneyTxt(v);const a=$('money');if(a.textContent!==m)a.textContent=m;document.querySelectorAll('.jMoney').forEach(e=>{if(e.textContent!==m)e.textContent=m;});}
function moneyStep(now){const k=Math.min(1,(now-MT.t0)/400),e=1-Math.pow(1-k,3);MT.shown=MT.from+(MT.to-MT.from)*e;
  paintMoney(k<1?Math.round(MT.shown*100)/100:MT.to);if(k<1)MT.raf=requestAnimationFrame(moneyStep);else{MT.raf=0;MT.shown=MT.to;}}
function syncMoney(){const v=S.money;if(v===MT.to)return;
  if(MT.to==null){MT.to=MT.shown=MT.from=v;paintMoney(v);return;}
  const d=v-MT.to;if(Math.abs(d)>=0.005&&performance.now()-MT.ext>800)moneyFloat(d,true);
  MT.from=MT.shown;MT.to=v;MT.t0=performance.now();
  if(RMQ.matches||document.hidden){if(MT.raf)cancelAnimationFrame(MT.raf);MT.raf=0;MT.shown=v;paintMoney(v);return;}
  if(!MT.raf)MT.raf=requestAnimationFrame(moneyStep);}
// "+€32" yazısı para hapına doğru yükselir; harcamada kırmızı ve aşağı düşer.
// Başka izler doğrudan çağırabilir; o zaman HUD aynı değişim için ikinci bir yazı çıkarmaz.
function moneyFloat(delta,auto){delta=+delta;if(!delta||!isFinite(delta))return;if(!auto)MT.ext=performance.now();
  const pill=[...document.querySelectorAll('#moneyPill,.mMoney')].find(e=>e.getClientRects().length);if(!pill)return;
  const r=pill.getBoundingClientRect(),el=document.createElement('div');el.className='mFloat '+(delta<0?'neg':'pos');el.setAttribute('aria-hidden','true');
  el.textContent=(delta<0?'−':'+')+'€'+moneyTxt(Math.abs(delta));el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.bottom+(delta<0?2:10))+'px';
  document.body.appendChild(el);setTimeout(()=>el.remove(),1300);
  pill.classList.remove('bumpU','bumpD');void pill.offsetWidth;pill.classList.add(delta<0?'bumpD':'bumpU');}
/* ---- kutlama: konfeti + başlık kartı, ~2,5 sn, dokununca kapanır ---- */
const CQ=[];let celeOn=false,celeT=0,celeOut=false;
function celebrate(title,sub){CQ.push([title,sub]);if(!celeOn)celeNext();}
function celeNext(){const box=$('cele'),it=CQ.shift();if(!it){celeOn=false;return;}celeOn=true;celeOut=false;
  box.querySelector('h3').textContent=it[0]||t('hud.celeTitle');const p=box.querySelector('p');p.textContent=it[1]||'';p.hidden=!it[1];
  box.querySelector('.cbI').innerHTML=ic('star');box.classList.remove('out');box.hidden=false;
  // sfx.discover (platform) çalar ve hap('good') tetikler; yoksa titreşim + basit jingle.
  try{if(sfx&&typeof sfx.discover==='function')sfx.discover();else{if(typeof hap==='function')hap('good');if(sfx&&typeof sfx.coin==='function')sfx.coin();}}catch(e){}
  if(!RMQ.matches)confetti(box.querySelector('canvas'));
  clearTimeout(celeT);celeT=setTimeout(celeDone,2500);}
function celeDone(){const box=$('cele');if(box.hidden||celeOut)return;celeOut=true;clearTimeout(celeT);box.classList.add('out');
  setTimeout(()=>{box.hidden=true;box.classList.remove('out');celeNext();},RMQ.matches?0:240);}
function confetti(cv){const dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const x=cv.getContext('2d');if(!x)return;x.setTransform(dpr,0,0,dpr,0,0);
  const C=['#f6c552','#e46a4f','#5aa449','#6fb7e0','#f7a8c0','#b08bd4','#fff4de'],P=[],n=W<600?90:150,v0=Math.min(W,H)/70;
  for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*2.1,v=v0*(0.9+Math.random()*1.3);
    P.push({x:W/2+(Math.random()-.5)*80,y:H*.46,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,r:Math.random()*6.28,vr:(Math.random()-.5)*.35,w:7+Math.random()*6,h:4+Math.random()*4,c:C[i%C.length],o:Math.random()<.28});}
  const t0=performance.now();let last=t0;
  (function f(now){const box=$('cele');if(box.hidden){x.clearRect(0,0,W,H);return;}const dt=Math.min(3,(now-last)/16.7),age=now-t0;last=now;x.clearRect(0,0,W,H);
    x.globalAlpha=age>1800?Math.max(0,1-(age-1800)/600):1;
    for(const q of P){q.vy+=0.28*dt;q.vx*=Math.pow(.982,dt);q.vy*=Math.pow(.985,dt);q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=q.vr*dt;
      x.fillStyle=q.c;if(q.o){x.beginPath();x.arc(q.x,q.y,q.h*.6,0,6.283);x.fill();}
      else{x.save();x.translate(q.x,q.y);x.rotate(q.r);x.fillRect(-q.w/2,-q.h/2,q.w,q.h*Math.abs(Math.cos(q.r*1.7)));x.restore();}}
    if(age<2400)requestAnimationFrame(f);else x.clearRect(0,0,W,H);})(t0);}
$('cele').addEventListener('click',celeDone);

function renderHUD(){const tk=T();
  syncMoney();
  const hr=S.t%24,day=hr>=6&&hr<20;
  const rt=SIM.num(SIM.roomTemp(S),0)+'°';const wx=S.ev.out>0?[ic('bolt'),t('hud.wx.out'),'⚡']:S.ev.heat>0?[ic('therm'),t('hud.wx.heat'),rt]:S.ev.cold>0?[ic('therm'),t('hud.wx.cold'),rt]:[ic('therm'),t('hud.wx.room'),rt];
  const key=[I18N.lang,dayOf(S.t),hr,wx[1]+wx[2],speed,tk.id,tk.name,tk.shrimp.length,S.tanks.length].join('|');
  if(key!==hudCache){hudCache=key;
    $('dIcon').innerHTML=ic(day?'sun':'moon',day?'':'color:#6f7fb8');
    $('day').textContent=t('hud.day',{n:dayOf(S.t)});$('dsub').innerHTML=`${season(S.t)} · ${hh(S.t)}<span class="yr"> · ${t('hud.year',{n:yearOf(S.t)})}</span>`;
    $('wx').innerHTML=wx[0]+`<span><span class="w1">${wx[1]} · </span>${wx[2]}</span>`;$('wx').classList.toggle('ev',S.ev.out>0||S.ev.heat>0||S.ev.cold>0);$('wx').title=wx[1]+': '+wx[2];
    document.querySelectorAll('#speed button').forEach(b=>{const on=+b.dataset.s===speed;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
    $('tankName').textContent=t('hud.tank',{tank:tk.name,vol:tk.vol,n:tk.shrimp.length});
    $('tPrev').style.display=$('tNext').style.display=S.tanks.length>1?'':'none';$('tankPill').classList.toggle('one',S.tanks.length<2);}
  // Uyarı/alarm yok: suyun ve karideslerin durumunu oyuncu kendisi keşfeder (test, tank paneli).
  if(key!==hudCacheM){hudCacheM=key;
    document.querySelectorAll('.jDIcon').forEach(e=>e.innerHTML=ic(day?'sun':'moon',day?'':'color:#6f7fb8'));
    document.querySelectorAll('.jDay').forEach(e=>e.textContent=t('hud.day',{n:dayOf(S.t)}));
    document.querySelectorAll('.jTime').forEach(e=>e.textContent=`${hh(S.t)} · ${S.ev.out>0?'⚡ '+t('hud.wx.outShort'):S.ev.heat>0?'🔥 '+rt:S.ev.cold>0?'❄ '+rt:rt}`);
    document.querySelectorAll('.jTank').forEach(e=>e.textContent=t('hud.tankShort',{tank:tk.name,n:tk.shrimp.length}));
    document.querySelectorAll('.jPrev,.jNext').forEach(e=>e.style.display=S.tanks.length>1?'':'none');
    $('spdP').innerHTML=ic(speed?'pause':'p1');$('spdP').classList.toggle('on',!speed);$('spdP').setAttribute('aria-label',t(speed?'hud.pause':'hud.resume'));
    $('spdC').textContent=(S.speed||1)+'×';$('spdC').setAttribute('aria-label',t('hud.speedCycle',{s:S.speed||1}));
    const paused=speed===0;document.querySelectorAll('.pauseChip').forEach(e=>{if(e.hidden===paused)e.hidden=!paused;});}
  const ob=$('obadge');const ready=S.orders.some(o=>haveFor(o)>=o.qty);ob.hidden=!S.orders.length;ob.textContent=S.orders.length;ob.classList.toggle('ok',ready);
  renderDock();}
$('speed').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;speed=+b.dataset.s;if(speed)S.speed=speed;sfx.tap();renderHUD();});
function switchTank(d){S.cur=(S.cur+d+S.tanks.length)%S.tanks.length;selId=null;if(ui.pop==='ctx')closePop();ui.group=null;ui.sel.clear();userZoom=false;renderHUD();renderSel();if(ui.modal)renderModal(false);}
$('tPrev').addEventListener('click',()=>switchTank(-1));$('tNext').addEventListener('click',()=>switchTank(1));
document.querySelectorAll('.jPrev').forEach(e=>{e.innerHTML=ic('left');e.addEventListener('click',()=>switchTank(-1));});
document.querySelectorAll('.jNext').forEach(e=>{e.innerHTML=ic('right');e.addEventListener('click',()=>switchTank(1));});

$('gearBtn').innerHTML=ic('gear');$('gearBtn').addEventListener('click',()=>{sfx.tap();closePop();openModal('settings');});
$('spdP').addEventListener('click',()=>{sfx.tap();speed=speed?0:(S.speed||1);if(speed)S.speed=speed;renderHUD();});
$('spdC').addEventListener('click',()=>{sfx.tap();const seq=[1,4,12];const cur=S.speed||1;S.speed=seq[(seq.indexOf(cur)+1)%3];speed=S.speed;renderHUD();});
document.querySelectorAll('.pauseChip').forEach(e=>e.addEventListener('click',()=>{sfx.tap();speed=S.speed||1;S.speed=speed;renderHUD();}));
// Kamera görünümleri (eskiden dock'taydı): tank hapının yanında küçük bir düğme çifti.
document.querySelectorAll('.camPill [data-cam]').forEach(b=>{b.innerHTML=ic(b.dataset.cam);b.addEventListener('click',()=>useTool(b.dataset.cam));});

let lastLog=S.log.length?S.log[0].id:0;
function flushLog(){const fresh=S.log.filter(l=>l.id>lastLog).reverse();if(fresh.length){lastLog=S.log[0].id;
  let joy=false;for(const l of fresh.slice(-3)){if(l.kind==='info')continue;
    // küçük ödüller: yavru ve yumurta haberleri yumuşak bir ses ve kabarcık patlamasıyla gelir
    if(l.kind==='joy'){toast(l.msg,'joy');if(!joy){sfx.birth();joy=true;}if(l.p&&l.p.ti===S.cur&&typeof joyBurst==='function')joyBurst();continue;}
    toast(l.msg,l.kind);if(l.kind==='good')sfx.coin();else if(l.kind==='bad')sfx.bad();}}}

/* ---- dil değişimi ----
   relocalize(): I18N.setLang(l) sonrası çağrılır; her an güvenle çağrılabilir.
   Statik HTML'i (data-i18n*) yeniden uygular, menü/hız/dock/alt gezinti etiketlerini yeniden kurar,
   HUD, seçili karides kartı ve açık bakım penceresini önbellekleri sıfırlayarak yeniden çizer. */
function relocalize(){
  try{I18N.apply(document);}catch(e){}
  try{buildMenu();buildSpeed();buildDock();buildNav();}catch(e){}
  hudCache='';hudCacheM='';selHTML='';
  const h=$('hint');if(h)h.innerHTML='';
  try{renderMenu();renderHUD();renderSel();if(ui.pop)renderPop();if(ui.modal&&typeof renderModal==='function')renderModal(false);}catch(e){}
  if(typeof layoutSoon==='function')layoutSoon();}
window.relocalize=relocalize;
