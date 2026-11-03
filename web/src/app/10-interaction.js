/* ================= canvas taps ================= */
const rc=new THREE.Raycaster(),ndc=new THREE.Vector2(),gPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-3.2),gHit=new THREE.Vector3();
function groundHit(x,y){ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);rc.setFromCamera(ndc,camera);if(!rc.ray.intersectPlane(gPlane,gHit))return null;
  if(Math.abs(gHit.x)>G.W/2-0.8||Math.abs(gHit.z)>G.D/2-0.8)return null;return gHit.clone();}
function objHit(x,y){ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);rc.setFromCamera(ndc,camera);const hs=rc.intersectObjects(hitList,false);if(!hs.length)return null;
  const f=hs.find(q=>q.object.userData.hit!=='glass');return f?{k:f.object.userData.hit,d:f.distance}:{k:'tank',d:hs[0].distance};}
function pickObj(x,y){const h=objHit(x,y);return h?h.k:null;}
// Ekipman (filtre, ısıtıcı, lamba...) doğrudan dokunulduğunda, yakında yüzen bir karidese değil ekipmana gider.
// Karides yalnızca ekipmanın önündeyse (ışın önce ona çarpıyorsa) seçilir.
const EQ_HIT=new Set(['filter','air','heater','thermo','fan','feeder','light']);
function onTap(x,y){const tool=ui.tool;if(tool==='look'){const hadPop=ui.pop;
    const oh=objHit(x,y),eq=oh&&EQ_HIT.has(oh.k)?oh:null,sr=shrimpRay(x,y);
    if(sr&&(!eq||sr.d<eq.d)){selectShrimp(sr.b);closePop();return;}
    if(eq){if(hadPop==='ctx'&&ui.ctx===eq.k){closePop();return;}openCtx(eq.k);return;}
    if(pickAt(x,y)){closePop();return;}
    const rp=typeof roomPick==='function'?roomPick(x,y):null;if(rp){closePop();if(rp.tank!=null&&rp.tank!==S.cur){switchTank(rp.tank-S.cur);sfx.tap();}else if(rp.slot!=null){ui.sub.shop='tanks';openModal('shop');ui.sub.shop='tanks';renderModal(false);}return;}const k=pickObj(x,y);if(k){if(hadPop==='ctx'&&ui.ctx===k){closePop();return;}openCtx(k);}else closePop();return;}
  if(ui.pop)closePop();
  const p=groundHit(x,y);if(!p){toast(t('tool.tapInside'),'warn');return;}const tk=T(),A=SIM.act;let r;
  if(tool==='food'||tool==='powder'){r=A.feed(S,tk,tool);if(r.ok){tk.foodSpot=[clamp(p.x/G.W,-0.45,0.45),clamp(p.z/G.D,-0.45,0.45)];syncT=0;for(const[,b]of SH)if(Math.random()<0.7)newTarget(b,tk);}}
  else if(tool==='leaf'){r=A.leaf(S,tk);if(r.ok){const i=tk.leaves.length-1;if(G.leafPos[i])G.leafPos[i]=[p.x,p.z,Math.random()*6];sig='';}}
  res(r);afterAct();renderDock();}

/* ================= selected shrimp card ================= */
let selHTML='';
function renderSel(){const card=$('selCard');const tk=T();const s=selId&&tk.shrimp.find(x=>x.id===selId);
  if(!s||ui.modal){card.hidden=true;selHTML='';if(!s)selId=null;return;}
  const k=SIM.keyOf(s),st=SIM.stage(s),p=SIM.price(S,s),m=SIM.morphOf(s);
  const stage=t(st==='adult'?'card.adult':st==='juv'?'card.juv':'card.baby');
  const lin=s.pa?t('card.lineage',{id:s.id,g:s.gen,ma:s.pa[0],pa:s.pa[1]}):t('card.lineageShop',{id:s.id,g:s.gen});
  card.hidden=false;const html=`<div class="top"><div class="th"><img data-th="${shrimpKey(m,SIM.isRili(s),s.grade)}" alt=""></div><div style="flex:1;min-width:0"><div class="nm">${SIM.keyName(k)} ${s.sex==='F'?'♀':'♂'}</div><div class="muted">${esc(lin)}</div></div><button class="x sm" data-c="x" aria-label="${esc(t('hud.close'))}">${ic('x')}</button></div>
  <div class="kv"><span>${t('card.quality')}</span><b>${SIM.num(s.grade,2)} ${SIM.gradeName(s.grade)}</b><span>${t('card.age')}</span><b>${t('card.ageVal',{n:Math.floor(s.age),stage})}</b>
  <span>${t('card.health')}</span><b class="s${s.health>70?0:s.health>40?1:2}">${t('hud.pct',{p:Math.round(s.health)})}</b><span>${t('card.value')}</span><b>${st==='baby'?t('card.noSale'):SIM.eur(p)}</b></div>
  ${s.ber?`<p style="margin:0 0 8px">${t('card.berried',{n:Math.max(0,Math.ceil(21-s.bt))})}</p>`:''}
  <div class="row">${s.dna?`<span class="tg">${t('card.genes',{c:s.c.join('/'),p:s.p.join('/')})}</span>`:`<button class="btn ghost sm" data-c="dna">${t('card.dna',{price:'€2'})}</button>`}
  ${st!=='baby'?`<button class="btn sm" data-c="sell">${t('card.sell',{price:SIM.eur(p)})}</button>`:''}</div>`;
  // Yalnızca içerik değişince yeniden çiz: basılı durum, odak ve küçük resim korunur.
  if(html!==selHTML){selHTML=html;card.innerHTML=html;fillThumbs(card);}}
$('selCard').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const tk=T();const s=tk.shrimp.find(x=>x.id===selId);
  if(b.dataset.c==='x')selId=null;else if(s&&b.dataset.c==='dna')res(SIM.act.dna(S,s));else if(s&&b.dataset.c==='sell'){if(typeof sellShrimp==='function')sellShrimp([s.id]);else res(SIM.act.sell(S,tk,[s.id]),true);selId=null;}
  renderSel();renderHUD();save();});


/* ================= native feel, modal chrome, a11y ================= */
// iOS WebKit yalnızca bir touchstart dinleyicisi varken :active uygular (basılı durum için).
document.addEventListener('touchstart',()=>{},{passive:true});
// Çift dokunuşla yakınlaştırma ve uzun basma menüsü yok; iki parmak hareketi yalnızca tuvalde.
document.addEventListener('gesturestart',e=>{if(e.target!==canvas)e.preventDefault();});
document.addEventListener('contextmenu',e=>{if(!(e.target.closest&&e.target.closest('input,textarea')))e.preventDefault();});

// Modal açılıp kapanınca: gövde sınıfı (perde, alttan kayan sayfa), VoiceOver için odak taşıma, ilk açılışta duraklamayı kaldırma.
(function(){
  const m=$('modal'),title=$('mTitle'),scrim=$('scrim');let wasOpen=!m.hidden,prevFocus=null,lastTitle='',firstRun=typeof fresh!=='undefined'&&fresh,openKind=null;
  const focusTitle=()=>{try{title.focus({preventScroll:true});}catch(e){}};
  function sync(){const open=!m.hidden;document.body.classList.toggle('modal-open',open);
    if(open){openKind=ui.modal||openKind;
      if(!wasOpen){const a=document.activeElement;prevFocus=a&&a!==document.body&&!m.contains(a)?a:null;m.classList.remove('drag');m.style.transform='';}
      const t=title.textContent;if(!wasOpen||t!==lastTitle){lastTitle=t;focusTitle();}}
    else if(wasOpen){lastTitle='';
      const shown=e=>e&&document.contains(e)&&e.getClientRects().length;
      // Dokunmatikte düğmeler odak almaz: önceki odak yoksa pencereyi açan menü düğmesine dön.
      const opener=openKind&&[...document.querySelectorAll(`#nav [data-n="${openKind}"],#menu [data-m="${openKind}"]`)].find(shown);
      const back=shown(prevFocus)?prevFocus:opener||null;prevFocus=null;
      if(back){try{back.focus({preventScroll:true});}catch(e){}}else if(m.contains(document.activeElement))document.activeElement.blur();
      // İlk açılışta yardım penceresi X ile kapatılırsa oyun duraklamış kalmasın.
      if(firstRun&&openKind==='help'&&speed===0){speed=S.speed||1;S.speed=speed;renderHUD();}
      if(openKind==='help')firstRun=false;openKind=null;
      if(typeof layoutSoon==='function')layoutSoon();}
    wasOpen=open;}
  new MutationObserver(sync).observe(m,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{if(!m.hidden)sync();}).observe(title,{childList:true,characterData:true,subtree:true});
  sync();
  scrim.addEventListener('click',()=>{if(ui.modal)closeModal();});

  // Telefonda alttan kayan sayfa: başlığı aşağı sürükleyerek kapat.
  const head=m.querySelector('.mh');let y0=null,dy=0,pid=null;
  head.addEventListener('pointerdown',e=>{if(!isMob()||e.target.closest('button'))return;y0=e.clientY;dy=0;pid=e.pointerId;try{head.setPointerCapture(pid);}catch(_){}m.classList.add('drag');});
  head.addEventListener('pointermove',e=>{if(y0==null||e.pointerId!==pid)return;dy=Math.max(0,e.clientY-y0);m.style.transform=`translateY(${dy}px)`;});
  const end=e=>{if(y0==null||(e&&e.pointerId!==pid))return;y0=null;m.classList.remove('drag');
    if(dy>90){m.style.transform='';closeModal();}else m.style.transform='';dy=0;};
  head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
})();
