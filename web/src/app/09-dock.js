/* ================= top menu ================= */
// Etiketler dil değişince yeniden kurulur (relocalize → build*); dinleyiciler kapsayıcıda olduğu için korunur.
const MENU=[['shop','basket'],['orders','clip'],['shrimp','shrimp'],['tank','drop'],['book','book'],['settings','gear']];
function buildMenu(){$('menu').innerHTML=MENU.map(([k,i])=>`<button class="ibtn" data-m="${k}"${k==='help'?' id="helpBtn"':''}>${ic(i)}${t('nav.'+k)}${k==='orders'?'<span class="badge" id="obadge" hidden></span>':''}</button>`).join('');}
buildMenu();
$('menu').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;sfx.tap();if(b.dataset.m==='shrimp'&&ui.modal!=='shrimp')ui.group=null;openModal(b.dataset.m);});
function renderMenu(){document.querySelectorAll('#menu .ibtn').forEach(b=>{const on=b.dataset.m===ui.modal;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(typeof renderNav==='function')renderNav();}

$('tPrev').innerHTML=ic('left');$('tNext').innerHTML=ic('right');
function buildSpeed(){$('speed').innerHTML=[[0,'pause','hud.pause'],[1,'p1','hud.speed1'],[4,'p2','hud.speed4'],[12,'p3','hud.speed12']].map(([s,i,k])=>{const l=esc(t(k));return `<button data-s="${s}" aria-label="${l}" aria-pressed="false" title="${l}">${ic(i)}</button>`;}).join('');}
buildSpeed();

/* ================= dock (tools) ================= */
// n: görünen kısa ad (dile göre, getter; yumuşak tiresiz), hint: ipucu metni.
const TOOLS=[
  {id:'look',i:'look',mode:1,hint:()=>t('tool.look.hint')},
  {id:'food',i:'food',mode:1,inv:'food',hint:()=>t('tool.food.hint',{n:recFood(T())})},
  {id:'powder',i:'powder',mode:1,inv:'powder',hint:()=>t('tool.powder.hint')},
  {id:'leaf',i:'leaf',mode:1,inv:'leaf',hint:()=>t('tool.leaf.hint')},
  {id:'test',i:'test',inv:'test'},
  {id:'wc',i:'wc'},
  {id:'top',i:'top'},
  {id:'glass',i:'glass'},
  {id:'rinse',i:'rinse'},
  {id:'trim',i:'trim'},
  {id:'bact',i:'bact',inv:'bact'},
  {id:'remin',i:'remin',inv:'remin'},
  {id:'med',i:'med',inv:'med'},
];
for(const o of TOOLS)Object.defineProperty(o,'n',{get(){return plain(t('tool.'+this.id));},enumerable:true});
// Dock dışı ama useTool ile çağrılabilen eylemler (bakım menüsü, bağlam penceresi, kamera düğmeleri)
const XTOOLS={autofeed:{id:'autofeed',inv:'food'},values:{id:'values'},side:{id:'side'},topv:{id:'topv'},under:{id:'under'},room:{id:'room'}};
const HOTKEYS=['look','food','powder','leaf','test','wc','top','glass','rinse','trim'];
function buildDock(){$('dock').innerHTML=TOOLS.map(o=>{if(!o)return '<span class="dsep"></span>';const hk=HOTKEYS.indexOf(o.id);
  return `<button class="tool" data-t="${o.id}" title="${esc(o.n)}" aria-pressed="false">${hk>=0?`<span class="k" aria-hidden="true">${(hk+1)%10}</span>`:''}${ic(o.i)}${esc(t('tool.'+o.id))}${o.inv?`<span class="n" data-n="${o.inv}"></span>`:''}</button>`;}).join('');}
buildDock();
$('dock').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)useTool(b.dataset.t);});
function renderDock(){document.querySelectorAll('#dock .tool').forEach(b=>{const o=TOOLS.find(x=>x&&x.id===b.dataset.t);const on=b.dataset.t===ui.tool||b.dataset.t===ui.pop;b.classList.toggle('on',on);
    if(b.getAttribute('aria-pressed')!==String(on))b.setAttribute('aria-pressed',String(on));
    if(o&&o.inv){const n=S.inv[o.inv]|0;const el=b.querySelector('.n');if(el.textContent!==String(n))el.textContent=n;const em=n<1;b.classList.toggle('empty',em);
      const lab=em?t('dock.empty',{tool:o.n}):t('dock.count',{tool:o.n,n});if(b.getAttribute('aria-label')!==lab)b.setAttribute('aria-label',lab);}});
  const o=TOOLS.find(x=>x&&x.id===ui.tool);const h=$('hint');const txt=ui.pop||ui.tool==='look'?'':(o&&o.hint?o.hint():'');h.hidden=!txt;
  if(txt){const html=ic('glass')+`<span>${esc(txt)}</span>`+(ui.tool!=='look'?`<button class="btn amber sm" data-done="1">${esc(t('dock.done'))}</button>`:'');if(h.innerHTML!==html)h.innerHTML=html;}
  renderNav();}
const NAV=[['shop','basket'],['orders','clip'],['care','drop'],['shrimp','shrimp'],['book','book']];
function buildNav(){$('nav').innerHTML=NAV.map(([k,i])=>`<button class="nb${k==='care'?' care':''}" data-n="${k}">${ic(i)}${t('nav.'+k)}${k==='orders'?'<span class="badge" hidden></span>':''}</button>`).join('');}
buildNav();
$('nav').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;sfx.tap();const k=b.dataset.n;
  if(k==='care'){if(ui.modal)closeModal();if(ui.tool!=='look'){ui.tool='look';}togglePop('tray');return;}
  closePop();if(k==='shrimp'&&ui.modal!=='shrimp')ui.group=null;openModal(k);});
function renderNav(){document.querySelectorAll('#nav .nb').forEach(b=>{const k=b.dataset.n;const on=k==='care'?(ui.pop==='tray'||ui.pop==='wc'||ui.pop==='med'||ui.tool!=='look'):k===ui.modal;b.classList.toggle('on',on);
    if(k==='care'){if(b.getAttribute('aria-expanded')!==String(on))b.setAttribute('aria-expanded',String(on));}else if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const nb=document.querySelector('#nav .badge');if(nb){const ready=S.orders.some(o=>haveFor(o)>=o.qty);nb.hidden=!S.orders.length;nb.textContent=S.orders.length;nb.classList.toggle('ok',ready);}}
$('hint').addEventListener('click',e=>{if(e.target.closest('[data-done]')){ui.tool='look';sfx.tap();renderDock();}});
// Stoğu bitmiş bir sarf malzemesine dokunmak ölü bir düğme yerine mağazada o ürünü açar.
function shopFor(inv){closePop();if(ui.tool!=='look'){ui.tool='look';renderDock();}ui.sub.shop='cons';ui.modal=null;openModal('shop');
  const C=SIM.CONS&&SIM.CONS[inv];toast(t('dock.outOf',{item:C?C.n:t('dock.thisItem')}),'warn');
  const i=Object.keys(SIM.CONS||{}).indexOf(inv);
  setTimeout(()=>{const el=document.querySelector(`#mBody [data-a="buyC"][data-k="${inv}"]`);const c=el?el.closest('.card'):i>=0?document.querySelectorAll('#mBody .grid .card')[i]:null;
    if(c){ui.touch=performance.now();c.scrollIntoView({block:'center',behavior:'smooth'});c.classList.add('flash');}},60);}
function outOf(inv){return !!inv&&!!S.inv&&(S.inv[inv]|0)<1;}
function useTool(id){const tl=TOOLS.find(x=>x&&x.id===id)||XTOOLS[id];if(!tl)return;const tk=T(),A=SIM.act;sfx.tap();
  if(outOf(tl.inv)){shopFor(tl.inv);return;}
  if(tl.mode){ui.tool=id;if(id!=='look'){selId=null;renderSel();}closePop();renderDock();layoutSoon();return;}
  switch(id){
    case 'test':{const r=A.test(S,tk);res(r);if(r.ok){ui.modal=null;openModal('tank');}break;}
    case 'wc':case 'med':togglePop(id);return;
    case 'top':res(A.top(S,tk,S.src));break;
    case 'glass':res(A.glass(S,tk));break;
    case 'rinse':res(A.rinse(S,tk));break;
    case 'trim':res(A.trim(S,tk),true);break;
    case 'bact':res(A.bact(S,tk));break;
    case 'remin':res(A.remin(S,tk));break;
    case 'values':ui.modal=null;openModal('tank');return;
    case 'autofeed':{const n=recFood(tk);let r;if(!n){toast(t(tk.shrimp.length||SIM.cycled(tk)?'tool.autofed0':'tool.autofedWait'),'');closePop();renderDock();return;}for(let i=0;i<n;i++){r=A.feed(S,tk,'food');if(!r.ok)break;}if(r&&r.ok)r.msg=t('tool.autofed',{n});res(r);syncT=0;break;}
    case 'side':camPreset(1.42,0);return;
    case 'topv':camPreset(0.42,0);return;
    case 'under':camUnder();return;
    case 'room':camRoom();return;
  }
  closePop();afterAct();renderDock();}
function togglePop(id){if(ui.pop===id){closePop();return;}ui.pop=id;selId=null;renderSel();renderPop();renderDock();}
function closePop(){if(!ui.pop)return;ui.pop=null;$('pop').hidden=true;renderDock();}
const MOBQ=matchMedia('(max-width:819px),(max-height:560px)');
const isMob=()=>MOBQ.matches;
const CTXI={filter:'rinse',air:'bact',heater:'therm',fan:'therm',light:'sun',thermo:'therm',plants:'leaf',feeder:'food',tank:'drop'};
function tb(a,label,icon,inv,noCount){const n0=inv?(S.inv[inv]|0):null,n=noCount?null:n0;return `<button class="tb${n0===0?' empty':''}" data-p="${a}"${inv?` data-inv="${inv}"`:''}${n0===0?` aria-label="${esc(t('dock.empty',{tool:plain(label)}))}"`:''}>${ic(icon)}${label}${n!=null?`<span class="n">${n}</span>`:''}</button>`;}
function stepper(a,val){return `<div class="stepr"><button data-p="${a}" data-d="-1" aria-label="${esc(t('tool.dec'))}">−</button><b style="min-width:58px">${val}</b><button data-p="${a}" data-d="1" aria-label="${esc(t('tool.inc'))}">+</button></div>`;}
function ctxHTML(k){const tk=T(),thermo=tk.gear.thermo,F=tk.eq.filter&&SIM.FILTERS[tk.eq.filter];
  const head=(h,i)=>`<div class="ctxh">${ic(i)}<h4 style="margin:0">${h}</h4></div>`;const close=`<button class="btn ghost" data-p="x">${t('tool.close')}</button>`;
  const flow=t('tool.flow.'+(!F?'none':tk.flow>0.7?'strong':tk.flow>0.5?'medium':'weak'));
  const room=t('tool.room',{v:degC(SIM.roomTemp(S))});
  switch(k){
    case 'filter':return head(F?F.n:t('tool.filter'),'rinse')+`<div class="kv2"><span class="tg ${tk.flow>0.7?'good':tk.flow>0.5?'warn':'bad'}">${t('tool.flow',{f:flow})}</span>${F&&!F.safe?`<span class="tg ${tk.gear.guard?'good':'warn'}">${t(tk.gear.guard?'tool.guardOn':'tool.guardOff')}</span>`:''}${tk.eq.filter==='sponge'&&!tk.gear.air?`<span class="tg bad">${t('tool.noAir')}</span>`:''}</div><p>${t('tool.rinseInfo')}</p><div class="row"><button class="btn" data-p="rinse">${t('tool.rinseBtn')}</button>${close}</div>`;
    case 'air':return head(t('tool.air'),'bact')+`<p>${t('tool.airInfo')}</p><div class="row">${close}</div>`;
    case 'heater':case 'fan':return head(t(k==='heater'?'tool.heater':'tool.fan'),'therm')+`<div class="kv2"><span class="tg">${t('tool.water',{v:thermo?degC(tk.T):t('tool.noThermo')})}</span><span class="tg">${room}</span></div><p>${t(tk.gear.heater&&tk.gear.fan?'tool.tempBoth':'tool.tempOne')}</p><div class="row">${stepper('temp',tk.eq.set+' °C')}${close}</div>`;
    case 'light':return head(SIM.LIGHTS[tk.eq.light]?SIM.LIGHTS[tk.eq.light].n:t('tool.light'),'sun')+`<p>${t('tool.lightInfo')}</p><div class="row">${stepper('photo',t('tool.hours',{n:tk.eq.photo}))}${close}</div>`;
    case 'thermo':return head(t('tool.thermo'),'therm')+`<div class="kv2"><span class="tg ${tk.T>=20&&tk.T<=26?'good':tk.T>=18&&tk.T<=28?'warn':'bad'}">${t('tool.water',{v:degC(tk.T)})}</span><span class="tg">${room}</span></div><div class="row"><button class="btn amber" data-p="values">${t('tool.allValues')}</button>${close}</div>`;
    case 'feeder':return head(t('tool.feeder'),'food')+`<p>${t('tool.feederInfo',{n:S.inv.food|0})}</p><div class="row">${close}</div>`;
    case 'plants':{const sc=tk.vol/20;const pl=Object.keys(SIM.PLANTS).filter(q=>tk.plants[q]>0.01);const full=pl.some(q=>tk.plants[q]>SIM.PLANTS[q].cap*sc*0.6);
      return head(t('tool.plants'),'leaf')+pl.map(q=>{const f=tk.plants[q]/(SIM.PLANTS[q].cap*sc);return `<div class="eqrow"><div class="grow">${SIM.PLANTS[q].n}<div class="bar"><i style="width:${Math.min(100,f*100)}%;background:${f>0.9?'var(--amber)':'var(--green)'}"></i></div></div><b>${t('hud.pct',{p:Math.round(f*100)})}</b></div>`}).join('')+
      `<div class="row" style="margin-top:8px"><button class="btn" data-p="trim" ${full?'':'disabled'}>${t(full?'tool.trimSell':'tool.trimNotYet')}</button>${close}</div>`;}
    default:{const alg=tk.algae<0.15?['tool.glassClean','good']:tk.algae<0.45?['tool.glassSome','warn']:['tool.glassAlgae','bad'];
      return head(tk.name+' · '+tk.vol+' L','drop')+`<div class="kv2"><span class="tg ${alg[1]}">${t(alg[0])}</span><span class="tg ${tk.level>0.9?'good':tk.level>0.8?'warn':'bad'}">${t('tool.level',{p:Math.round(tk.level*100)})}</span></div>
      <div class="trow">${tb('glass',t('tool.wipe'),'glass')}${tb('top',t('tool.topUp'),'top')}${tb('wcOpen',t('tool.change'),'wc')}${tb('test',t('tool.testIt'),'test','test')}</div>`;}
  }}
function renderPop(){const p=$('pop');if(!ui.pop){p.hidden=true;return;}p.hidden=false;
  const cancel=`<button class="btn ghost" data-p="x">${t('tool.cancel')}</button>`;
  if(ui.pop==='wc')p.innerHTML=`<h4>${t('tool.wcTitle')}</h4><p>${t('tool.wcInfo',{v:degC(SIM.roomTemp(S))})}</p>
    ${S.ro?`<div class="seg" style="margin-bottom:8px"><button data-p="src" data-v="tap" class="${S.src==='tap'?'on':''}">${t('tool.tap')}</button><button data-p="src" data-v="ro" class="${S.src==='ro'?'on':''}">${t('tool.ro')}</button></div>`:''}
    <div class="row">${[0.1,0.25,0.5].map(f=>`<button class="btn" data-p="wc" data-f="${f}">${t('hud.pct',{p:Math.round(f*100)})}</button>`).join('')}${cancel}</div>`;
  else if(ui.pop==='med')p.innerHTML=`<h4>${t('tool.medTitle')}</h4><p>${t('tool.medInfo',{n:S.inv.med|0})}</p><div class="row"><button class="btn red" data-p="med">${t('tool.use')}</button>${cancel}</div>`;
  else if(ui.pop==='tray')p.innerHTML=`<div class="tray">
    <div class="tgrp"><small>${t('tool.trayFeed')}</small><div class="trow">${tb('t:food',t('tool.food'),'food','food')}${tb('t:powder',t('tool.babyFood'),'powder','powder')}${tb('t:leaf',t('tool.leaf'),'leaf','leaf')}${tb('t:auto',t('tool.suggested'),'auto','food',1)}</div></div>
    <div class="tgrp"><small>${t('tool.trayWater')}</small><div class="trow">${tb('test',t('tool.testIt'),'test','test')}${tb('wcOpen',t('tool.change'),'wc')}${tb('top',t('tool.topUp'),'top')}${tb('values',t('tool.values'),'values')}</div></div>
    <div class="tgrp"><small>${t('tool.traySupp')}</small><div class="trow">${tb('bact',t('tool.bact'),'bact','bact')}${tb('remin',t('tool.remin'),'remin','remin')}${tb('medOpen',t('tool.med'),'med','med')}</div></div>
    <p class="muted" style="margin:0">${t('tool.trayTip')}</p></div>`;
  else p.innerHTML=ctxHTML(ui.ctx);}
function openCtx(k){ui.ctx=k;ui.pop='ctx';selId=null;renderSel();renderPop();renderDock();sfx.tap();}
$('pop').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b||b.disabled)return;const d=b.dataset,tk=T(),A=SIM.act;
  if(d.inv&&outOf(d.inv)){sfx.tap();shopFor(d.inv);return;}
  if(d.p.startsWith('t:')){closePop();useTool(d.p.slice(2)==='auto'?'autofeed':d.p.slice(2));return;}
  switch(d.p){
    case 'src':S.src=d.v;renderPop();return;
    case 'temp':res(A.temp(S,tk,+d.d));renderPop();afterAct();return;
    case 'photo':res(A.photo(S,tk,+d.d));renderPop();afterAct();return;
    case 'wcOpen':ui.pop='wc';renderPop();renderDock();return;
    case 'medOpen':ui.pop='med';renderPop();renderDock();return;
    case 'wc':res(A.wc(S,tk,+d.f,S.src));break;
    case 'med':res(A.med(S,tk));break;
    case 'rinse':res(A.rinse(S,tk));break;
    case 'trim':res(A.trim(S,tk),true);break;
    case 'glass':res(A.glass(S,tk));break;
    case 'top':res(A.top(S,tk,S.src));break;
    case 'bact':res(A.bact(S,tk));afterAct();renderPop();return;
    case 'remin':res(A.remin(S,tk));afterAct();renderPop();return;
    case 'test':closePop();useTool('test');return;
    case 'values':closePop();useTool('values');return;
    case 'side':case 'topv':closePop();useTool(d.p);return;
  }
  closePop();afterAct();});

