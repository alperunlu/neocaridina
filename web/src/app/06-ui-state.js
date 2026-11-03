/* ================= UI state & helpers ================= */
// Eski/eksik kayıtları her durumda güncel yapıya getir (idempotent)
if(typeof SIM.migrate==='function')SIM.migrate(S);
const ui={ctx:null,modal:null,sub:{shop:'shrimp',book:'goals'},group:null,flt:'all',sel:new Set(),qty:{},touch:0,resetArm:0,tool:'look',pop:null,confirm:null,msig:''};
// Sayı/para biçimi I18N.locale'a göre (Intl önbelleği dile göre anahtarlanır). € her dilde.
// fmt.money(12068.57) -> tr "€12.068,57", en "€12,068.57", nl "€ 12.068,57"; fmt.hud: €1.000 üstünde kuruş yok.
const fmt=(function(){const C={};
  const nf=(k,o)=>{const id=I18N.locale+'|'+k;if(!C[id])C[id]=new Intl.NumberFormat(I18N.locale,o);return C[id];};
  const neg=s=>s.replace(/-/g,'\u2212');
  const cur=(v,d)=>{v=+v||0;v=Math.round(v*100)/100;if(Object.is(v,-0))v=0;
    try{return neg(nf('c'+d,{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(v));}catch(e){return SIM.eur(v);}};
  const num=(v,d)=>{d=d==null?0:d;v=+v;if(!isFinite(v))v=0;
    try{return neg(nf('n'+d,{minimumFractionDigits:d,maximumFractionDigits:d}).format(v));}catch(e){return SIM.num(v,d);}};
  return{money:v=>cur(v,2),hud:v=>cur(v,Math.abs(+v||0)>=1000?0:2),num,
    pct:v=>{try{return nf('p',{style:'percent',maximumFractionDigits:0}).format(+v||0);}catch(e){return Math.round((+v||0)*100)+'%';}}};})();
const touchDev=()=>{try{return matchMedia('(hover:none),(pointer:coarse)').matches}catch(e){return false}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sw=k=>{const[m,r]=k.split('_');return `<span class="sw" style="--c:${SIM.MORPH[m].hex}" data-r="${r?1:0}"></span>`;};
const dayOf=t=>Math.floor(t/24)+1;
const hh=t=>String(Math.floor(t%24)).padStart(2,'0')+':00';
const fmtT=h=>t('ui.dayTime',{d:dayOf(h),h:hh(h)});
const ago=h=>h<1?t('ui.justNow'):h<24?t('ui.hoursAgo',{n:Math.floor(h)}):t('ui.daysAgo',{n:Math.floor(h/24)});
function season(h){const ph=((dayOf(h)-25)%120+120)%120;return t('ui.season.'+['summer','autumn','winter','spring'][Math.floor(ph/30)]);}
const yearOf=t=>Math.floor((dayOf(t)-1)/120)+1;
const money=v=>`<span class="price"><span class="coin">€</span>${fmt.num(v,2)}</span>`;
const tags=a=>`<div class="tags">${a.filter(Boolean).map(x=>Array.isArray(x)?`<span class="tg ${x[1]}">${x[0]}</span>`:`<span class="tg">${x}</span>`).join('')}</div>`;
const img=k=>`<div class="img"><img data-th="${k}" alt=""></div>`;
function buyBtn(a,data,price,label,dis){if(dis)return `<button class="btn sm" disabled>${dis}</button>`;
  if(S.money+1e-9<price)return `<button class="btn sm" disabled>${t('shop.noMoney')}</button>`;return `<button class="btn sm" data-a="${a}" ${data}>${label||t('shop.buy')}</button>`;}
// o.btn: kartın tamamı dokunulabilir bir <button>
function card(o){const tg=o.btn?'button':'div';return `<${tg} class="card${o.cls?' '+o.cls:''}"${o.btn?' type="button" style="text-align:left;width:100%"':''}${o.attr?' '+o.attr:''}>${img(o.img)}<h4>${o.title}</h4>${o.desc?`<p>${o.desc}</p>`:''}${o.tags?tags(o.tags):''}${o.foot!=null?`<div class="foot">${o.foot}</div>`:''}</${tg}>`;}

const PADS={
  pH:{n:'pH',st:[[6,'#e8b64c'],[6.8,'#e79a45'],[7.2,'#e3793c'],[7.8,'#d9573a'],[8.4,'#c43a3f']],f:v=>fmt.num(v,1),ok:v=>v>=6.6&&v<=7.8?0:v>=6.3&&v<=8.1?1:2},
  GH:{n:'GH',st:[[0,'#6f9b86'],[4,'#8d8ea3'],[7,'#9b77a8'],[14,'#8a4f9a'],[21,'#6d2f86']],f:v=>fmt.num(v,1),ok:v=>v>=5&&v<=10?0:v>=4&&v<=14?1:2},
  KH:{n:'KH',st:[[0,'#e9d25f'],[3,'#b9c96a'],[6,'#7fb07d'],[10,'#4c9b8f'],[20,'#2d7a86']],f:v=>fmt.num(v,1),ok:v=>v>=1&&v<=8?0:v<=12?1:2},
  NH3:{n:'NH₃',st:[[0,'#f3e27a'],[0.25,'#d7dc6a'],[0.5,'#b3cf63'],[1,'#7fb85e'],[3,'#3f8f5a']],f:v=>fmt.num(v,2),ok:v=>v<=0.05?0:v<=0.2?1:2},
  NO2:{n:'NO₂',st:[[0,'#f6f3ea'],[0.5,'#f2d9e6'],[1,'#e6a9cf'],[3,'#c96aac'],[10,'#9b3a8a']],f:v=>fmt.num(v,2),ok:v=>v<=0.05?0:v<=0.25?1:2},
  NO3:{n:'NO₃',st:[[0,'#f6f3ea'],[10,'#f3d6dc'],[25,'#eaa8bb'],[50,'#d8699a'],[100,'#b1306f']],f:v=>fmt.num(v,0),ok:v=>v<=20?0:v<=40?1:2}
};
function lerpHex(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const r=Math.round((A>>16)+((B>>16)-(A>>16))*t),g=Math.round((A>>8&255)+((B>>8&255)-(A>>8&255))*t),bl=Math.round((A&255)+((B&255)-(A&255))*t);return `rgb(${r},${g},${bl})`;}
function padColor(k,v){const st=PADS[k].st;if(v<=st[0][0])return st[0][1];for(let i=1;i<st.length;i++)if(v<=st[i][0])return lerpHex(st[i-1][1],st[i][1],(v-st[i-1][0])/(st[i][0]-st[i-1][0]));return st[st.length-1][1];}
function pad(k,v){const P=PADS[k];if(v==null)return `<div class="pad"><i style="background:#ece4d2"></i><b>${P.n}</b><span>–</span></div>`;
  return `<div class="pad"><i style="background:${padColor(k,v)}"></i><b>${P.n}</b><span class="s${P.ok(v)}">${P.f(v)}</span></div>`;}
// Önerilen yem (porsiyon, günde bir kez). Dipte hâlâ yem varsa 0 döner.
const recFood=tk=>SIM.recFood(tk);
// Dipte kalan yem ve dünkü artık yem endeksi -> [metin, durum 0-2, durum metni]
function leftover(tk){const p=(tk.food+tk.powder)/20,wi=tk.wi||0;
  return[p<0.05?t('tank.lo.none'):t('tank.lo.portions',{n:fmt.num(p,p<1?1:0)}),wi>1.6?2:wi>1.1?1:0,t(wi>1.6?'tank.lo.over':wi>1.1?'tank.lo.bitOver':'tank.lo.good')];}
// Stres nedeni: sim kodu (cold, heat, ammonia, …, shock) ya da eski Türkçe ad -> sözlük anahtarı; ad SIM.causeName'den
const RSN={'so\u011fuk':'cold','s\u0131cakl\u0131k':'heat','amonyak':'ammonia','nitrit':'nitrite','nitrat':'nitrate','pH':'ph','GH':'gh','oksijen':'oxygen','kalabal\u0131k':'crowd','a\u00e7l\u0131k':'hunger','ani de\u011fi\u015fim':'change'};
const reasonKey=r=>{r=RSN[r]||String(r||'').toLowerCase();return r==='shock'?'change':r;};
const causeTxt=(raw,k)=>typeof SIM.causeName==='function'?SIM.causeName(raw):t('tank.reason.'+k);

function observations(tk){
  const o=[];const sc=tk.vol/20;const tested=tk.test&&S.t-tk.test.t<30;const ob=(k,p)=>t('tank.obs.'+k,p);
  if(S.ev.out>0)o.push(['bad',ob('outage')]);
  if(!tk.eq.filter)o.push(['bad',ob('noFilter')]);
  else if(tk.eq.filter==='sponge'&&!tk.gear.air)o.push(['bad',ob('spongeNoAir')]);
  if(!tk.shrimp.length&&!SIM.cycled(tk))o.push(['warn',ob('uncycled')]);
  if(tk.shrimp.length&&!SIM.cycled(tk)&&!(tk.test&&S.t-tk.test.t<24))o.push(['warn',ob('newWithShrimp')]);
  if(tk.shrimp.length){
    if(tk.stress>0.8){const raw=tk.reasons[0]?tk.reasons[0][0]:'',r=reasonKey(raw);
      if(['oxygen','hunger','crowd','change'].includes(r))o.push(['bad',ob('see.'+r)]);
      else if(r==='heat'||r==='cold')o.push(['bad',tk.gear.thermo?ob(r==='cold'?'tooCold':'tooHot'):ob('unrestNoThermo')]);
      else o.push(['bad',tested&&r?ob('unrestTested',{r:causeTxt(raw,r)}):ob('unrestTest')]);}
    else if(tk.sat<0.35)o.push(['warn',ob('hungry')]);
    const ber=tk.shrimp.filter(s=>s.ber).length;if(ber)o.push(['good',ob('berried',{n:ber})]);
    if(tk.babies>0&&tk.running&&tk.eq.filter&&!SIM.FILTERS[tk.eq.filter].safe&&!tk.gear.guard)o.push(['warn',ob('intake')]);
    if(tk.babies>5&&tk.plants.moss<0.5*sc)o.push(['warn',ob('noMoss')]);
    if(tk.shrimp.length>tk.vol*5)o.push(['warn',ob('crowded')]);
    if((tk.fload||0)>0.9)o.push([tk.fload>1.05?'bad':'warn',ob('fload',{p:fmt.pct(tk.fload)})]);
    if((tk.wi||0)>1.6)o.push(['warn',ob('rotFood')]);
  }
  if(tk.NH3>0.3||tk.NO2>0.4)o.push(['warn',ob('cloudy')]);
  if(tk.algae>0.45)o.push(['warn',ob('algae')]);
  if(tk.level<0.88)o.push(['warn',ob('level',{p:fmt.pct(tk.level)})]);
  if(tk.eq.filter&&tk.flow<0.6)o.push(['warn',ob('flow')]);
  for(const k in SIM.PLANTS)if(tk.plants[k]>SIM.PLANTS[k].cap*sc*0.9){o.push(['warn',ob('overgrown')]);break;}
  if(tk.plan>=1)o.push(['bad',ob('planaria')]);
  if(tk.snails.ram>tk.vol*1.5)o.push(['warn',ob('snails')]);
  if(!o.length)o.push(['good',ob('allGood')]);
  return o;
}

