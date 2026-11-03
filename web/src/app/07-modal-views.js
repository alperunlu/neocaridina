/* ================= modal views ================= */
function vConfirm(){const c=ui.confirm;if(!c)return '';
  return `<div class="banner" role="alertdialog" aria-label="${t('ui.confirm')}"><p style="margin:0 0 8px">${c.msg}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${c.btns.map(([l,k,cls],i)=>`<button type="button" class="btn sm ${cls||''}" data-a="cf" data-k="${i}">${l}</button>`).join('')}</div></div>`;}
// Boş tank rehberi: taban → su → döngü (mağaza ve su ekranında gösterilir)
function setupSteps(tk){const eqOk=!!tk.eq.filter&&!!tk.eq.light;if(tk.level>0.05&&tk.sub&&eqOk)return '';const st=[[!!tk.sub,'sub'],[tk.level>0.05,'fill'],[eqOk,'eq'],[false,'cycle']];
  return `<div class="banner setup"><b>${t('setup.title',{tank:esc(tk.name)})}</b><ol class="steps" style="margin:8px 0 0">${st.map(([d,k])=>`<li${d?' style="opacity:.6"':''}><b>${d?'✓ ':''}${t('setup.'+k)}</b> ${t('setup.'+k+'.d')}</li>`).join('')}</ol>
  ${tk.sub&&tk.level<0.05?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-a="fill" data-src="tap">${t('setup.fillTap')}</button>${S.ro?`<button class="btn ghost" data-a="fill" data-src="ro">${t('setup.fillRo')}</button>`:''}</div>`:''}
  ${!tk.sub&&ui.modal!=='shop'?`<div style="margin-top:8px"><button class="btn amber" data-a="goSetup">${t('setup.pick')}</button></div>`:''}
  ${tk.sub&&!eqOk&&!(ui.modal==='shop'&&ui.sub.shop==='eq')?`<div style="margin-top:8px"><button class="btn amber" data-a="goEq">${t('setup.pickEq')}</button></div>`:''}</div>`;}
function vShop(){
  const tk=T(),sub=ui.sub.shop,buy=t('shop.buy'),inst=t('shop.installed');
  let h=`<div class="cats" role="tablist">${[['setup','look'],['shrimp','shrimp'],['eq','rinse'],['live','leaf'],['cons','food'],['tanks','plus']].map(([v,i])=>`<button class="cat ${sub===v?'on':''}" role="tab" aria-selected="${sub===v}" data-a="sub" data-v="${v}">${ic(i)}${t('shop.tab.'+v)}</button>`).join('')}</div>`;
  const cards=[];
  if(sub==='shrimp'){
    if(SIM.canRescue(S))h+=`<div class="banner">${t('shop.rescue')} <button class="btn sm amber" data-a="rescue">${t('shop.rescueBtn')}</button></div>`;
    if(!SIM.cycled(tk))h+=`<div class="banner">${t('shop.uncycled',{tank:esc(tk.name)})}</div>`;
    SIM.OFFERS.forEach((o,i)=>{const k=o.k+(o.r?'_r':''),q=ui.qty[i]||5,p=SIM.offerPrice(o);
      cards.push(card({img:shrimpKey(o.k,o.r,o.g),title:SIM.keyName(k),desc:o.k==='yabani'?t('shop.wildDesc'):t('shop.offerDesc',{price:fmt.money(p)}),
        tags:[SIM.gradeName(o.g),o.r?['Rili','good']:t('shop.plain'),t('shop.adult')],
        foot:`<div class="stepr"><button data-a="qty" data-i="${i}" data-d="-1" aria-label="${t('ui.less')}">−</button><b aria-live="polite">${q}</b><button data-a="qty" data-i="${i}" data-d="1" aria-label="${t('ui.more')}">+</button></div>${money(p*q)}<div style="width:100%;display:flex;justify-content:flex-end">${buyBtn('buyS',`data-i="${i}"`,p*q,t('shop.buyN',{n:q}))}</div>`}));});
  }else if(sub==='setup'){
    // Kurulum: taban (yalnızca karidessiz tanka), dekor, arka plan. Kurulum adımları mağazada sürekli gösterilmez;
    // yalnızca ilk açılışta bir kez açılır pencere olarak çıkar (bkz. openModal).
    if(tk.sub&&tk.level<0.05)h+=`<h3 class="shH">${t('setup.fill')}</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 2px 6px"><button class="btn" data-a="fill" data-src="tap">${t('setup.fillTap')}</button>${S.ro?`<button class="btn ghost" data-a="fill" data-src="ro">${t('setup.fillRo')}</button>`:''}</div>`;
    const st={gravel:[['neutral','good']],sand:['lessClog','slowPlants'],aqua:[['fastPlants','good'],'lowPH',['ammonia','warn']],soil:[['walstad','good'],['fastPlants','good'],['ammonia','warn']]};
    const tg=x=>Array.isArray(x)?[t('shop.tag.'+x[0]),x[1]]:t('shop.tag.'+x);
    h+=`<h3 class="shH">${t('shop.subH')}</h3><p class="muted shP">${t(tk.shrimp.length?'shop.subLocked':'shop.subNote',{tank:esc(tk.name)})}</p>`;
    const sc2=[];for(const k in SIM.SUBS){const B=SIM.SUBS[k],on=tk.sub===k,p=SIM.subPrice(tk,k);
      const tags=(st[k]||[]).map(tg);if(on&&B.life)tags.push(t('shop.soilLeft',{p:fmt.pct(tk.subLeft||0)}));
      sc2.push(card({img:'sub:'+k,title:B.n,desc:B.d,tags,foot:`${money(p)}${buyBtn('buySub',`data-k="${k}"`,p,on?t('shop.change'):buy,on&&!(B.life&&tk.subLeft<0.5)?t('shop.set'):(tk.shrimp.length?t('shop.locked'):''))}`}));}
    h+=`<div class="grid">${sc2.join('')}</div><h3 class="shH">${t('shop.decH')}</h3>`;
    const dt={tubes:[['moltSafe','good'],'hide'],spider:['biofilm','tannin']};
    const dc=[];for(const k in SIM.DECOR){const D=SIM.DECOR[k];dc.push(card({img:'dec:'+k,title:D.n,desc:D.d,tags:(dt[k]||[]).map(tg),foot:`${money(D.price)}${buyBtn('buyDec',`data-k="${k}"`,D.price,buy,tk.decor&&tk.decor[k]?t('shop.installed'):'')}`}));}
    h+=`<div class="grid">${dc.join('')}</div><h3 class="shH">${t('shop.bgH')}</h3>`;
    const bc=[];for(const k in SIM.BGS){const B=SIM.BGS[k],own=!B.price||(S.bgs&&S.bgs[k]),on=(tk.bg||'deep')===k;
      bc.push(card({img:'bg:'+k,title:B.n,desc:null,tags:[own?t('shop.owned'):t('shop.allTanksOnce')],foot:`${own?'':money(B.price)}${buyBtn('setBg',`data-k="${k}"`,own?0:B.price,own?t('shop.use'):buy,on?t('shop.set'):'')}`}));}
    h+=`<div class="grid">${bc.join('')}</div>`;
    return h;
  }else if(sub==='eq'){
    for(const k in SIM.FILTERS){const it=SIM.FILTERS[k],on=tk.eq.filter===k;cards.push(card({img:'f:'+k,title:it.n,desc:it.d,tags:[t('shop.filterCap',{n:SIM.filterCap(k,tk.vol),vol:tk.vol}),it.safe?[t('shop.babySafe'),'good']:[t('shop.intake'),'warn']],foot:`${money(it.price)}${buyBtn('buyEq',`data-slot="filter" data-type="${k}"`,it.price-(tk.eq.filter&&!on?SIM.FILTERS[tk.eq.filter].price*0.5:0),buy,on?inst:'')}`}));}
    for(const k in SIM.LIGHTS){const it=SIM.LIGHTS[k],on=tk.eq.light===k;cards.push(card({img:'l:'+k,title:it.n,desc:it.d,tags:[t('shop.lightPct',{p:fmt.pct(it.L)}),t('shop.timer')],foot:`${money(it.price)}${buyBtn('buyEq',`data-slot="light" data-type="${k}"`,it.price,buy,on?inst:'')}`}));}
    const gt={air:['oxygen'],heater:['temp'],fan:['hot'],thermo:['measure'],tdsm:['measure'],guard:['babySafety'],feeder:['auto','daily10'],lid:['evap']};
    for(const k in SIM.GEAR){const it=SIM.GEAR[k];cards.push(card({img:'g:'+k,title:it.n,desc:it.d,tags:(gt[k]||[]).map(x=>t('shop.tag.'+x)),foot:`${money(it.price)}${buyBtn('buyEq',`data-slot="${k}"`,it.price,buy,tk.gear[k]?inst:'')}`}));}
    cards.push(card({img:'ro',title:t('shop.ro'),desc:t('shop.roDesc'),tags:[t('shop.tag.allTanks'),[t('shop.tag.wc'),'good']],foot:`${money(110)}${buyBtn('buyRO','',110,buy,S.ro?t('shop.set'):'')}`}));
  }else if(sub==='live'){
    const pt={moss:['hide','slow'],anub:['easy','vslow'],horn:[['nitrate','good'],'fast'],frog:['floats','algae']};
    const tg=x=>Array.isArray(x)?[t('shop.tag.'+x[0]),x[1]]:t('shop.tag.'+x);
    for(const k in SIM.PLANTS){const P=SIM.PLANTS[k],full=tk.plants[k]>P.cap*tk.vol/20*0.85;cards.push(card({img:'p:'+k,title:P.n,desc:P.d,tags:(pt[k]||[]).map(tg),foot:`${money(P.price)}${buyBtn('buyP',`data-k="${k}"`,P.price,buy,full?t('shop.enough'):'')}`}));}
    cards.push(card({img:'sn:ram',title:t('shop.ram'),desc:t('shop.ramDesc'),tags:[t('shop.tag.cleaner'),[t('shop.tag.breeds'),'warn']],foot:`${money(4)}${buyBtn('buySn','data-k="ram"',4)}`}));
    cards.push(card({img:'sn:ner',title:t('shop.ner'),desc:t('shop.nerDesc'),tags:[t('shop.tag.glass'),t('shop.tag.noBreed')],foot:`${money(4)}${buyBtn('buySn','data-k="ner"',4)}`}));
  }else if(sub==='cons'){
    const ct={food:'daily',powder:'babies',test:'six',remin:'gh',bact:'cycle',leaf:'tannin',med:['killsSnails','bad']};
    for(const k in SIM.CONS){const c=SIM.CONS[k],x=ct[k];cards.push(card({img:'c:'+k,title:`${c.n} (${c.qty} ${c.u})`,desc:null,tags:[t('shop.have',{n:S.inv[k]}),x?(Array.isArray(x)?[t('shop.ct.'+x[0]),x[1]]:t('shop.ct.'+x)):''],foot:`${money(c.price)}${buyBtn('buyC',`data-k="${k}"`,c.price)}`}));}
  }else{
    const mx=SIM.maxTanks(S),full=S.tanks.length>=mx;
    for(const v of[20,35,60]){const d=SIM.TANKS[v].dims;cards.push(card({img:'t:'+v,title:t('shop.tankTitle',{n:v}),desc:t('shop.tankDesc'),tags:[`${d[0]}×${d[1]}×${d[2]} cm`,t('shop.tankRoom',{n:v*5})],foot:`${money(SIM.TANKS[v].price)}${buyBtn('buyT',`data-v="${v}"`,SIM.TANKS[v].price,buy,full?t('shop.tankSlots',{n:S.tanks.length,max:mx}):'')}`}));}
    const ups=Object.keys(SIM.UPG).map(k=>{const u=SIM.UPG[k],have=S.up[k];
      return `<div class="eqrow"><div class="grow">${u.n} ${have?`<span class="tg good">${t('shop.set')}</span>`:''}<small>${u.d}</small></div>${have?'':`${money(u.price)} ${buyBtn('buyU',`data-k="${k}"`,u.price,t('shop.install'),'')}`}</div>`;}).join('');
    return h+`<div class="grid">${cards.join('')}</div><p class="muted" style="margin-top:12px">${t('shop.slots',{n:S.tanks.length,max:mx})} ${mx<8&&!S.up.rack?t('shop.slotsRack'):''} ${t('shop.slotsWhy')}</p>
      <div class="panel" style="margin-top:12px"><h3>${t('shop.upgrades')}</h3>${ups}</div>`;
  }
  return h+`<div class="grid shop-${sub}">${cards.join('')}</div>`+(sub==='live'?`<p class="muted" style="margin-top:12px">${t('shop.plantNote')}</p>`:'')+(sub==='shrimp'?`<p class="muted" style="margin-top:12px">${t('shop.shrimpNote')}</p>`:'');
}
function haveFor(o){let n=0;for(const tk of S.tanks)for(const s of tk.shrimp)if(SIM.orderMatch(o,s))n++;return n;}
function boughtFor(o){let n=0;for(const tk of S.tanks)for(const s of tk.shrimp)if(s.bought&&SIM.orderMatch(o,s,1))n++;return n;}
// Siparişler = mesajlar: her sipariş bir müşterinin mesaj dizisi; isteği poşet kartında.
const AVC=['#62e3d2','#ffd98a','#ff9f8f','#9fc8ff','#c6a8ff','#9be38f'];
function whoParts(o){const w=typeof SIM.whoName==='function'?SIM.whoName(o):(o.who||'');const m=/^(.*?)\s*\(([^)]*)\)\s*$/.exec(w);return m?[m[1],m[2]]:[w,''];}
function bagSVG(hex,rili,n){let fish='';for(let i=0;i<Math.min(3,n);i++){const x=18+i*12,y=50+(i%2)*12;
  fish+=`<g transform="translate(${x} ${y}) scale(.48)"><path d="M0 10C6 0 26 0 34 8C30 16 10 18 0 10Z" fill="${hex}"/>${rili?'<path d="M12 4C16 3 20 3 22 5C20 10 14 10 12 9Z" fill="#fff"/>':''}<circle cx="31" cy="8" r="2" fill="#111"/></g>`;}
  return `<svg class="bag" viewBox="0 0 70 84" aria-hidden="true"><path d="M18 12C30 18 40 18 52 12L60 70C60 80 10 80 10 70Z" fill="rgba(98,227,210,.28)" stroke="rgba(15,49,56,.25)" stroke-width="1.6"/>
  <path d="M22 6L48 6L44 13L26 13Z" fill="#ff5a47"/><path d="M14 34C30 30 40 36 57 32" stroke="rgba(255,255,255,.85)" stroke-width="1.5" fill="none"/>${fish}</svg>`;}
function vOrders(){
  if(!S.orders.length)return `<div class="inbox empty"><div class="msg">${t('orders.emptyText')}</div></div>`+vMarket();
  if(!S.orders.some(o=>o.id===ui.ord))ui.ord=S.orders[0].id;
  const o=S.orders.find(x=>x.id===ui.ord);
  let h=`<div class="inbox"><div class="threads" role="tablist">${S.orders.map((x,i)=>{const[nm]=whoParts(x);const on=x.id===o.id;
    return `<button class="th${on?' on':''}" role="tab" aria-selected="${on}" data-a="ord" data-id="${x.id}"><span class="av" style="background:${AVC[x.id%AVC.length]}">${esc(nm.slice(0,1))}</span>${esc(nm)}</button>`;}).join('')}</div>`;
  const k=o.m+(o.rili?'_r':''),kind=SIM.keyName(k),have=haveFor(o),nb=have<o.qty?boughtFor(o):0,dl=Math.max(0,Math.ceil((o.until-S.t)/24)),[nm,pl]=whoParts(o);
  const text=o.first?t('msg.first',{kind}):o.stretch?t('msg.stretch',{kind,recipe:SIM.RECIPE[o.m]||''}):t('msg.ask.'+(o.id%3),{n:o.qty,kind,grade:SIM.gradeName(o.minG)});
  h+=`<div class="who"><span class="av" style="background:${AVC[o.id%AVC.length]}">${esc(nm.slice(0,1))}</span><div><b>${esc(nm)}</b><small>${esc(pl)}${pl?' · ':''}${dl<=1?t('orders.lastDay'):t('orders.daysLeft',{n:dl})}</small></div></div>
  <div class="msg">${esc(text)}</div>
  <div class="req">${bagSVG(SIM.MORPH[o.m].hex,o.rili,o.qty)}<div class="rq"><h4>${t('orders.want',{n:o.qty,kind})}</h4>
    <div class="tags"><span class="tg">${t('orders.minGrade',{grade:SIM.gradeName(o.minG)})}</span><span class="tg">${t('orders.adultOk')}</span><span class="tg ${have>=o.qty?'good':'bad'}">${t('orders.haveOf',{have,n:o.qty})}</span></div>
    <div class="pay">${money(o.pay)}${o.stretch?`<span class="tg warn">${t('orders.stretch',{recipe:SIM.RECIPE[o.m]||''})}</span>`:''}</div></div></div>
  ${nb?`<p class="muted hintl">${t('orders.bought',{n:nb})}</p>`:''}
  <button class="btn ship" data-a="ful" data-id="${o.id}" ${have>=o.qty?'':'disabled'}>${have>=o.qty?t('orders.ship'):t('orders.notReady',{have,n:o.qty})}</button></div>`;
  return h+vMarket();
}
function vMarket(){let h=`<h3 class="shH">${t('orders.market')}</h3><p class="muted shP">${t('orders.marketText',{m:fmt.pct(0.3),j:fmt.pct(0.45),rili:fmt.num(1.6,1)})}</p><div class="mk">`;
  for(const k in SIM.MORPH){const d=S.demand[k];const p=SIM.MORPH[k].v*(0.45+1.4*0.45)*d;
    h+=`<div class="mki">${sw(k)}<div class="grow">${SIM.MORPH[k].n}<small class="${d>1.05?'s0':d<0.95?'s2':''}">${d>1.05?'▲':d<0.95?'▼':'•'} ${fmt.pct(d)}</small></div><b>${fmt.money(p)}</b></div>`;}
  return h+'</div>';}
function groupsOf(tk){const g={};for(const s of tk.shrimp){const k=SIM.keyOf(s);const o=g[k]||(g[k]={k,n:0,F:0,M:0,juv:0,baby:0,ber:0,gs:0,val:0});
  o.n++;const st=SIM.stage(s);if(st==='adult')o[s.sex]++;else o[st]++;if(s.ber)o.ber++;o.gs+=s.grade;o.val+=SIM.price(S,s);}
  return Object.values(g).sort((a,b)=>b.n-a.n);}
function vShrimp(){
  const tk=T();
  if(!tk.shrimp.length)return `<div class="panel" style="text-align:center;max-width:420px;margin:10px auto"><h3>${t('shrimp.emptyTitle',{tank:esc(tk.name)})}</h3><p class="muted">${t('shrimp.emptyText')}</p><button class="btn amber" data-a="goShop">${t('shrimp.goShop')}</button></div>`;
  if(!ui.group||!tk.shrimp.some(s=>SIM.keyOf(s)===ui.group)){ui.group=null;
    return `<div class="grid">${groupsOf(tk).map(o=>{const[m,r]=o.k.split('_');return card({btn:1,cls:'tap',attr:`data-a="grp" data-k="${o.k}" aria-label="${t('shrimp.groupAria',{name:SIM.keyName(o.k),n:o.n})}"`,img:shrimpKey(m,!!r,o.gs/o.n),title:`${SIM.keyName(o.k)} <span class="muted">×${o.n}</span>`,
      desc:t('shrimp.avg',{g:fmt.num(o.gs/o.n,2),grade:SIM.gradeName(o.gs/o.n)}),tags:[`♀ ${o.F}`,`♂ ${o.M}`,o.juv?t('shrimp.juvN',{n:o.juv}):'',o.baby?t('shrimp.babyN',{n:o.baby}):'',o.ber?[`🥚 ${o.ber}`,'warn']:''],foot:`${money(o.val)}<span class="btn sm ghost" aria-hidden="true">${t('shrimp.open')}</span>`});}).join('')}</div>`+
      (tk.shrimp.length>160?`<p class="muted" style="margin-top:10px">${t('shrimp.scene160')}</p>`:'');}
  const all=tk.shrimp.filter(s=>SIM.keyOf(s)===ui.group);const f=ui.flt;
  const list=all.filter(s=>f==='all'||(f==='F'&&s.sex==='F'&&SIM.stage(s)==='adult')||(f==='M'&&s.sex==='M'&&SIM.stage(s)==='adult')||(f==='juv'&&SIM.stage(s)!=='adult')).sort((a,b)=>b.grade-a.grade);
  for(const id of[...ui.sel])if(!tk.shrimp.some(s=>s.id===id))ui.sel.delete(id);
  let sum=0;for(const s of tk.shrimp)if(ui.sel.has(s.id))sum+=SIM.price(S,s);
  let h=`<div class="backrow"><button class="cat" data-a="back">${ic('left')}${t('shrimp.groups')}</button>${sw(ui.group)}<b>${SIM.keyName(ui.group)}</b></div>
  <div class="cats" role="tablist">${[['all','all'],['F','female'],['M','male'],['juv','young']].map(([v,l])=>`<button class="cat ${f===v?'on':''}" role="tab" aria-selected="${f===v}" data-a="flt" data-v="${v}">${t('shrimp.flt.'+l)}</button>`).join('')}</div>`;
  const rowBtn='display:flex;align-items:center;gap:10px;flex:1;min-width:0;border:0;background:none;padding:0;margin:0;text-align:left;color:inherit;font:inherit';
  h+=list.slice(0,150).map(s=>{const st=SIM.stage(s),p=SIM.price(S,s),on=ui.sel.has(s.id),baby=st==='baby';
    return `<div class="li tap ${on?'on':''}"><button type="button" data-a="tog" data-id="${s.id}" role="checkbox" aria-checked="${on}" ${baby?`disabled aria-label="${t('shrimp.babyAria')}"`:''} style="${rowBtn}"><span class="chk ${baby?'off':''}" aria-hidden="true">${on?'✓':''}</span>
    <div class="grow"><div class="t">${s.sex==='F'?'♀':'♂'} #${s.id} <span class="muted">F${s.gen}</span> ${s.ber?`<span class="tg warn">🥚 ${t('shrimp.daysShort',{n:Math.max(0,Math.ceil(21-s.bt))})}</span>`:''} ${s.bought?`<span class="tg">${t('shrimp.store')}</span>`:''} ${s.dna?`<span class="tg">${s.c.join('/')} ${s.p.join('/')}</span>`:''}</div>
    <div class="d">${t('shrimp.line',{g:fmt.num(s.grade,2),grade:SIM.gradeName(s.grade),n:Math.floor(s.age),hp:fmt.pct(s.health/100)})}</div></div>
    <b style="white-space:nowrap">${baby?t('shrimp.baby'):fmt.money(p)}</b></button>${s.dna?'':`<button class="btn ghost sm" data-a="dna" data-id="${s.id}" aria-label="${t('shrimp.dnaAria',{id:s.id,price:fmt.money(2)})}">${t('shrimp.dna',{price:fmt.money(2).replace(/[.,]00$/,'')})}</button>`}</div>`}).join('');
  if(list.length>150)h+=`<p class="muted">${t('shrimp.first150')}</p>`;
  const others=S.tanks.map((x,i)=>[x,i]).filter(([x])=>x!==tk);
  h+=`<div class="selbar"><span class="grow">${t('shrimp.selected',{n:`<b>${ui.sel.size}</b>`})} · ${money(sum)}</span>
   <button class="btn ghost sm" data-a="selLow">${t('shrimp.selLow')}</button><button class="btn ghost sm" data-a="selNone">${t('shrimp.clear')}</button>
   <button class="btn sm" data-a="sell" ${ui.sel.size?'':'disabled'}>${t('ui.sell')}</button>
   ${others.map(([x,i])=>`<button class="btn amber sm" data-a="move" data-to="${i}" ${ui.sel.size?'':'disabled'}>${t('shrimp.moveTo',{tank:esc(x.name)})}</button>`).join('')}</div>`;
  return h;
}
function vTank(){
  const tk=T(),sc=tk.vol/20,ts=tk.test;
  const eq=[];if(tk.eq.filter)eq.push(['filter',SIM.FILTERS[tk.eq.filter]]);if(tk.eq.light)eq.push(['light',SIM.LIGHTS[tk.eq.light]]);for(const g in tk.gear)if(tk.gear[g])eq.push([g,SIM.GEAR[g]]);
  const pl=Object.keys(SIM.PLANTS).filter(k=>tk.plants[k]>0.01);
  const fl=tk.fload||0,lo=leftover(tk),cap=SIM.filterCap(tk.eq.filter,tk.vol,SIM.plantFrac(tk)),nm=t('tank.notMeasured'),none=t('tank.none'),rf=recFood(tk);
  if(tk.level<0.05)return setupSteps(tk);
  return `<div class="cols"><div>
   <div class="panel"><h3>${t('tank.strip')}</h3><div class="strip">${['pH','GH','KH','NH3','NO2','NO3'].map(k=>pad(k,ts?ts[k]:null)).join('')}</div>
    <p class="muted" style="margin:8px 0 0">${ts?t('tank.lastTest',{ago:ago(S.t-ts.t)}):t('tank.noTest')} ${t('tank.strips',{n:S.inv.test})}</p>
    <div class="gauges">
     <div class="g"><span>${t('tank.temp')}</span><b class="${tk.gear.thermo?'s'+((tk.T>=20&&tk.T<=26)?0:(tk.T>=18&&tk.T<=28)?1:2):'muted'}">${tk.gear.thermo?fmt.num(tk.T,1)+' °C':nm}</b></div>
     <div class="g"><span>TDS</span><b class="${tk.gear.tdsm?'s'+((tk.TDS>=150&&tk.TDS<=280)?0:(tk.TDS>=100&&tk.TDS<=380)?1:2):'muted'}">${tk.gear.tdsm?fmt.num(tk.TDS)+' ppm':nm}</b></div>
     <div class="g"><span>${t('tank.level')}</span><b class="s${tk.level>0.9?0:tk.level>0.8?1:2}">${fmt.pct(tk.level)}</b></div>
     <div class="g"><span>${t('tank.flow')}</span><b class="s${!tk.eq.filter?2:tk.flow>0.7?0:tk.flow>0.5?1:2}">${!tk.eq.filter?none:t(tk.flow>0.7?'tank.flow.strong':tk.flow>0.5?'tank.flow.mid':'tank.flow.weak')}</b></div>
     <div class="g"><span>${t('tank.load')}</span><b class="s${!tk.eq.filter?2:fl<0.75?0:fl<1?1:2}">${tk.eq.filter?fmt.pct(fl):none}</b></div>
     <div class="g"><span>${t('tank.floorFood')}</span><b class="s${lo[1]}">${lo[0]}</b></div>
    </div>
    <p class="muted" style="margin:8px 0 0">${t(tk.eq.filter?'tank.capNote':'tank.capSurf',{n:cap})} ${tk.sub&&SIM.SUBS[tk.sub].life?t('tank.soilNote',{p:fmt.pct(tk.subLeft||0)})+' ':''}${t('tank.leftover',{v:`<b class="s${lo[1]}">${lo[2]}</b>`})} ${rf?t('tank.feedRec',{n:rf}):t('tank.feedNone')}</p></div>
   <div class="panel"><h3>${t('tank.obs')}</h3><ul class="notes">${observations(tk).map(([k,m])=>`<li class="${k}">${esc(m)}</li>`).join('')}</ul></div>
   <div class="panel"><h3>${t('tank.wc')}</h3>
    ${S.ro?`<div class="seg" style="margin-bottom:8px"><button data-a="src" data-v="tap" class="${S.src==='tap'?'on':''}" aria-pressed="${S.src==='tap'}">${t('tank.tap')}</button><button data-a="src" data-v="ro" class="${S.src==='ro'?'on':''}" aria-pressed="${S.src==='ro'}">${t('tank.roMin')}</button></div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${[0.1,0.25,0.5].map(f=>`<button class="btn" data-a="wc" data-f="${f}">${fmt.pct(f)}</button>`).join('')}<button class="btn ghost" data-a="top">${t('tank.topUp')}</button></div>
    <p class="muted" style="margin:8px 0 0">${t('tank.wcNote',{temp:fmt.num(SIM.roomTemp(S),1)})}</p></div>
  </div><div>
   <div class="panel"><h3>${t('tank.settings')}</h3>
    <div class="step"><span>${t('tank.target')}</span><div class="stepr"><button data-a="temp" data-d="-1" aria-label="${t('tank.tempDown')}">−</button><b style="min-width:56px">${tk.eq.set} °C</b><button data-a="temp" data-d="1" aria-label="${t('tank.tempUp')}">+</button></div></div>
    <div class="step"><span>${t('tank.photo')}</span><div class="stepr"><button data-a="photo" data-d="-1" aria-label="${t('tank.photoDown')}">−</button><b style="min-width:56px">${t('tank.hours',{n:tk.eq.photo})}</b><button data-a="photo" data-d="1" aria-label="${t('tank.photoUp')}">+</button></div></div></div>
   <div class="panel"><h3>${t('tank.equipment')}</h3>${eq.length?eq.map(([slot,it])=>`<div class="eqrow"><div class="grow">${it.n}<small>${it.d}</small></div><button class="btn ghost sm" data-a="sellEq" data-slot="${slot}">${t('tank.sellFor',{price:fmt.money(it.price*0.5)})}</button></div>`).join(''):`<p class="muted">${t('tank.noEquipment')}</p>`}</div>
   <div class="panel"><h3>${t('tank.plants')}</h3>${pl.length?pl.map(k=>{const P=SIM.PLANTS[k],cap=P.cap*sc,f=tk.plants[k]/cap;return `<div class="eqrow"><div class="grow">${P.n}<div class="bar"><i style="width:${Math.min(100,f*100)}%;background:${f>0.9?'var(--amber)':'var(--green)'}"></i></div></div><b>${fmt.pct(f)}</b></div>`}).join(''):`<p class="muted">${t('tank.noPlants')}</p>`}
    ${tk.snails.ram||tk.snails.ner?`<p style="margin:8px 0 0">Ramshorn: <b>${tk.snails.ram}</b> · ${t('tank.nerite')}: <b>${tk.snails.ner}</b></p>`:''}</div>
   ${S.tanks.length>1?`<div class="panel"><h3>${t('tank.sellTank')}</h3><p class="muted" style="margin:0 0 8px">${t('tank.sellTankNote')}</p><button class="btn red sm" data-a="sellTank">${t('tank.sellTankBtn',{tank:esc(tk.name)})}</button></div>`:''}
  </div></div>`;
}
function vGoals(){
  const done=SIM.MS.filter(m=>S.ms[m.id]).length,mx=SIM.maxTanks(S);
  let h=`<p class="muted" style="margin-top:-4px">${t('book.goalsHead',{done,n:SIM.MS.length})} ${t('book.slots',{n:S.tanks.length,max:mx})}.</p><div role="list">`;
  for(const m of SIM.MS){const ok=!!S.ms[m.id];let p=0;try{p=ok?1:Math.max(0,Math.min(1,m.p(S)))}catch(e){}
    h+=`<div class="eqrow" role="listitem"><div class="grow"><b>${ok?'✓ ':''}${m.n}</b><small>${m.d}</small>${ok?'':`<div class="bar" role="progressbar" aria-valuenow="${Math.round(p*100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.round(p*100)}%"></i></div>`}</div><b class="${ok?'s0':'muted'}" style="white-space:nowrap">${ok?t('book.claimed'):fmt.money(m.r)}</b></div>`;}
  return h+'</div>';
}
const logMsg=e=>typeof SIM.logText==='function'?SIM.logText(e):e.msg;
function vBook(){
  const sub=ui.sub.book;
  let h=`<div class="cats" role="tablist">${[['goals','star'],['codex','shrimp'],['stats','values'],['log','book']].map(([v,i])=>`<button class="cat ${sub===v?'on':''}" role="tab" aria-selected="${sub===v}" data-a="bsub" data-v="${v}">${ic(i)}${t('book.tab.'+v)}</button>`).join('')}</div>`;
  if(sub==='goals')h+=vGoals();
  else if(sub==='codex'){const keys=[];for(const k in SIM.MORPH){keys.push(k);keys.push(k+'_r');}const n=keys.filter(k=>S.found[k]).length;
    h+=`<p class="muted" style="margin-top:-4px">${t('book.codexHead',{n,max:keys.length})}</p><div class="grid sm">`;
    for(const k of keys){const f=S.found[k];const[m,r]=k.split('_');
      h+=card({cls:f?'':'lock',img:f?shrimpKey(m,!!r,0.62):'lock:x:'+(r?1:0),title:f?SIM.keyName(k):'???',tags:[f?(SIM.RECIPE[m]||t('book.pure')):t('book.unknown')]});}
    h+='</div>';}
  else if(sub==='stats'){const st=[['born',fmt.num(S.stats.born)],['died',fmt.num(S.stats.died)],['sold',fmt.num(S.stats.sold)],['earned',fmt.money(S.stats.earned)],['spent',fmt.money(S.stats.spent)],['tanks',`${S.tanks.length} / ${SIM.maxTanks(S)}`],['orders',fmt.num(S.stats.orders||0)],['best',fmt.num(S.stats.bestG||0,2)]];
    h+=`<div class="stats">${st.map(([a,b])=>`<div class="stat"><small>${t('book.stat.'+a)}</small><b>${b}</b></div>`).join('')}</div>`;}
  else h+=`<ul class="log">${S.log.slice(0,50).map(l=>`<li${l.kind==='joy'?' class="joy"':''}><time>${fmtT(l.t)}</time>${l.kind==='joy'?ic('egg'):''}${esc(logMsg(l))}</li>`).join('')}</ul>`;
  return h;
}
const AUDIO=['master','sfx','amb','mus'];
function vSettings(){
  const au=typeof audioGet==='function'&&typeof audioSet==='function';
  const hap=S.haptics!==false,onOff=v=>t(v?'settings.on':'settings.off');
  return `<div class="panel" style="max-width:520px">
  <div class="step" style="flex-wrap:wrap"><span id="langLbl">${t('settings.lang')}</span><div class="seg" role="group" aria-labelledby="langLbl" style="display:flex;flex-wrap:nowrap;flex:1 1 260px;max-width:340px">${I18N.LANGS.map(l=>`<button type="button" data-a="lang" data-v="${l}" lang="${l}" class="${I18N.lang===l?'on':''}" aria-pressed="${I18N.lang===l}" style="flex:1;padding:5px 6px">${I18N.NAMES[l]}</button>`).join('')}</div></div>
  ${au?AUDIO.map(k=>{let v=0;try{v=Math.round((+audioGet(k)||0)*100)}catch(e){}return `<div class="step"><label for="vol_${k}">${t('settings.vol.'+k)}</label><input type="range" id="vol_${k}" min="0" max="100" step="5" value="${v}" data-vol="${k}" style="width:min(220px,55%);accent-color:var(--green)"></div>`;}).join('')
     :`<div class="step"><span>${t('settings.sfx')}</span><button class="btn ${soundOn?'':'ghost'} sm" data-a="sound" aria-pressed="${soundOn}">${onOff(soundOn)}</button></div>`}
  <div class="step"><span>${t('settings.haptics')}</span><button class="btn ${hap?'':'ghost'} sm" data-a="hapt" aria-pressed="${hap}">${onOff(hap)}</button></div>
  ${typeof titleOn!=='undefined'&&titleOn?'':`<div class="step"><span>${t('settings.howTo')}</span><button class="btn ghost sm" data-a="help">${t('settings.show')}</button></div>`}
  ${touchDev()?'':`<div class="step"><span>${t('settings.keys')}</span><span class="muted">${t('settings.keysText')}</span></div>`}
  ${typeof titleOn!=='undefined'&&titleOn?'':`<div class="step"><span>${t('title.menuRow')}</span><button class="btn sm" data-a="menu">${t('title.toMenu')}</button></div>`}
  ${typeof titleOn!=='undefined'&&titleOn?'':`<div class="step"><span>${t('settings.progress')}</span><button class="btn red sm" data-a="reset">${t(Date.now()-ui.resetArm<4000?'settings.resetSure':'settings.reset')}</button></div>`}</div>
  <p class="muted" style="margin-top:12px">${t('settings.autosave')}</p>`;
}
function vHelp(){
  const F=S.flags||{},cyc=S.tanks.some(SIM.cycled),ready=S.tanks.some(x=>x.sub&&x.level>0.05),st=[[ready,'setup'],[cyc,'cycle'],[F.tested&&cyc,'test'],[F.bought,'buy'],[F.fed&&F.bought,'feed']];
  return `<p style="margin:0 0 10px">${t('help.intro')}</p>
  <ol class="steps">${st.map(([d,k])=>`<li${d?' style="opacity:.6"':''}><b>${d?'✓ ':''}${t('help.'+k)}.</b> ${t('help.'+k+'Text')}</li>`).join('')}</ol>
  <p class="muted" style="margin:6px 0 12px">${t('help.note')}</p>
  <div style="display:flex;justify-content:flex-end"><button class="btn amber" data-a="start" style="font-size:16px;padding:10px 22px">${t(F.begun?'help.continue':'help.start')}</button></div>`;
}
// Başlık ve alt başlık her çizimde o anki dilde hesaplanır.
const MODALS={
  shop:{t:()=>t('shop.title'),i:'basket',v:vShop,s:()=>t('shop.sub',{money:fmt.money(S.money),tank:T().name})},
  orders:{t:()=>t('orders.title'),i:'clip',v:vOrders,s:()=>t('orders.sub')},
  shrimp:{t:()=>t('shrimp.title'),i:'shrimp',v:vShrimp,s:()=>t('shrimp.sub',{tank:T().name,n:T().shrimp.length})},
  tank:{t:()=>t('tank.title'),i:'drop',v:vTank,s:()=>t('tank.sub',{tank:T().name,vol:T().vol})},
  book:{t:()=>t('book.title'),i:'book',v:vBook,s:()=>t('book.sub')},
  settings:{t:()=>t('settings.title'),i:'gear',v:vSettings,s:()=>''},
  help:{t:()=>t('help.title'),i:'shrimp',v:vHelp,s:()=>t('help.sub')}
};
// Ucuz durum imzası: modal yalnızca gösterdiği şey değiştiğinde yeniden kurulur.
function modalSig(){const tk=T(),k=ui.modal,day=Math.floor(S.t/24);
  const b=[k,I18N.lang,S.cur,tk.id,ui.confirm?ui.confirm.id:'',Math.round(S.money*100)];
  switch(k){
    case 'shop':b.push(ui.sub.shop,tk.sub,tk.level>0.05,JSON.stringify(tk.decor||{}),tk.bg,JSON.stringify(S.bgs||{}),tk.shrimp.length>0,JSON.stringify(ui.qty),JSON.stringify(S.inv),tk.eq.filter,tk.eq.light,Object.keys(tk.gear).join(),SIM.cycled(tk),S.tanks.length,S.ro,Math.floor(S.rep||0),JSON.stringify(S.up),S.flags&&S.flags.rescue,Object.values(tk.plants).map(v=>Math.round(v*4)).join());break;
    case 'orders':b.push(ui.ord,day,S.orders.map(o=>o.id+':'+haveFor(o)).join());break;
    case 'shrimp':{let ber=0,dna=0;for(const s of tk.shrimp){ber+=s.ber;dna+=s.dna?1:0;}b.push(day,tk.shrimp.length,ui.group,ui.flt,[...ui.sel].join(),ber,dna,S.tanks.length);break;}
    case 'tank':b.push(tk.sub,tk.level>0.05,tk.test&&tk.test.t,S.inv.test,Math.round(tk.T),Math.round(tk.TDS/5),Math.round(tk.level*100),Math.round(tk.flow*10),Math.round((tk.fload||0)*100),leftover(tk).join(),recFood(tk),observations(tk).map(o=>o[1]).join(),
      tk.eq.filter,tk.eq.light,Object.keys(tk.gear).join(),tk.eq.set,tk.eq.photo,Object.values(tk.plants).map(v=>Math.round(v*20)).join(),tk.snails.ram,tk.snails.ner,S.src,S.ro,Math.round(SIM.roomTemp(S)),S.tanks.length);break;
    case 'book':b.push(ui.sub.book,S.log.length&&S.log[0].id,JSON.stringify(S.stats),Object.keys(S.found).length,Object.keys(S.ms||{}).length,S.tanks.length,ui.sub.book==='goals'?SIM.nShrimp(S):'');break;
    case 'settings':b.push(soundOn,S.haptics,Date.now()-ui.resetArm<4000);break;
    case 'help':b.push(JSON.stringify(S.flags));break;
  }
  return b.join('|');}
function renderModal(keep){const m=ui.modal&&MODALS[ui.modal];if(!m)return;
  const sig=modalSig();if(keep===undefined&&sig===ui.msig)return;ui.msig=sig;
  const b=$('mBody');const st=b.scrollTop;
  const ae=document.activeElement,fk=ae&&b.contains(ae)&&ae.dataset?['a','id','i','k','v','slot','type','d','vol'].map(x=>ae.dataset[x]||'').join('|'):null;
  b.innerHTML=vConfirm()+m.v();fillThumbs(b);b.scrollTop=keep===false?0:st;$('mTitle').textContent=typeof m.t==='function'?m.t():m.t;$('mSub').textContent=m.s();$('mIcon').innerHTML=ic(m.i);
  if(fk)for(const el of b.querySelectorAll('button,input'))if(['a','id','i','k','v','slot','type','d','vol'].map(x=>el.dataset[x]||'').join('|')===fk){try{el.focus({preventScroll:true})}catch(e){}break;}
  if(typeof drainMs==='function')drainMs();}
function startGame(){if(S.flags)S.flags.begun=1;if(typeof speed!=='undefined'&&speed===0){speed=S.speed||1;S.speed=speed;}if(typeof renderHUD==='function')renderHUD();}
function openModal(k){if(ui.modal===k){closeModal();return;}$('modal').dataset.k=k;if(k==='shop'&&(!T().sub||T().level<0.05))ui.sub.shop='setup';else if(k==='shop'&&!(T().eq.filter&&T().eq.light))ui.sub.shop='eq';if(ui.modal==='help'&&S.flags&&!S.flags.begun)startGame();
  ui.modal=k;ui.confirm=null;ui.msig='';selId=null;renderSel();closePop();$('modal').hidden=false;
  // İlk oyunda mağaza ilk kez açıldığında kurulum adımları bir kez gösterilir; sonra bir daha çıkmaz.
  if(k==='shop'&&S.flags&&!S.flags.setupTip){S.flags.setupTip=1;const st=setupSteps(T());if(st)ui.confirm={id:Date.now(),msg:st.replace(/^<div class="banner setup">|<\/div>$/g,''),btns:[[t('setup.ok'),'y','',()=>{}]]};}
  renderModal(false);renderMenu();}
function closeModal(){const was=ui.modal;ui.modal=null;ui.confirm=null;ui.msig='';$('modal').hidden=true;renderMenu();
  if(was==='help'&&S.flags&&!S.flags.begun)startGame();}
$('mX').innerHTML=ic('x');$('mX').addEventListener('click',closeModal);
$('mBody').addEventListener('pointerdown',()=>{ui.touch=performance.now();});
$('mBody').addEventListener('scroll',()=>{ui.touch=performance.now();},{passive:true});
