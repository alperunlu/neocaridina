/* ============ SIMULATION (DOM-free) ============ */
const SIM=(function(){
'use strict';
const R=Math.random,clamp=(v,a,b)=>v<a?a:v>b?b:v,pick=a=>a[(R()*a.length)|0];
const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*v)};
const r2=v=>Math.round(v*100)/100;
const ADULT=45,BABY=14;
const ALLELES=['R','Y','B','K','W'];
const MORPH={
  yabani:{hex:'#8a7556',v:0.8},
  kirmizi:{hex:'#d42a2a',v:2.2},
  sari:{hex:'#f3c11c',v:2.8},
  mavi:{hex:'#1e63d6',v:4},
  siyah:{hex:'#26262e',v:4},
  turuncu:{hex:'#f27812',v:7},
  cikolata:{hex:'#6a3a1c',v:7},
  yesil:{hex:'#3e9d3a',v:9},
  bordo:{hex:'#7d1231',v:9},
  gece:{hex:'#1c2f7c',v:11},
  mor:{hex:'#7c3fbd',v:16}
};
const COMBO={RR:'kirmizi',YY:'sari',BB:'mavi',KK:'siyah',WW:'yabani',RY:'turuncu',BY:'yesil',BR:'mor',KR:'bordo',BK:'gece',KY:'cikolata'};
const LETTER={kirmizi:'R',sari:'Y',mavi:'B',siyah:'K',yabani:'W'};
const FILTERS={
  sponge:{price:12,bio:1.0,aer:0.3,safe:true},
  hob:{price:32,bio:1.6,aer:0.6,safe:false},
  canister:{price:85,bio:2.6,aer:0.3,safe:false}
};
const LIGHTS={
  basic:{price:15,L:0.55},
  plant:{price:42,L:1}
};
const GEAR={
  air:{price:10},
  heater:{price:18},
  fan:{price:16},
  thermo:{price:3},
  tdsm:{price:12},
  guard:{price:4},
  feeder:{price:25},
  lid:{price:8}
};
// Tabanlar: fiyat (20 L için), bitki büyüme çarpanı, amonyak salımı (ilk haftalar), besin, ömür (gün; 0 = tükenmez).
// aqua: pH/KH düşürür; sand: filtre daha az tıkanır.
const SUBS={
  gravel:{price:8,plant:1,leach:0,nut:0,life:0},
  sand:{price:8,plant:0.85,leach:0,nut:0,life:0,clog:0.75},
  aqua:{price:18,plant:1.6,leach:0.05,half:12,nut:0.25,life:365,acid:1},
  soil:{price:12,plant:2,leach:0.03,half:14,nut:0.35,life:150}
};
// Dekor: saklanma (yavrular, deri değiştirme), biyofilm, tanen.
const DECOR={
  tubes:{price:4,cover:0.2,molt:0.3},
  spider:{price:8,cover:0.08,bio:0.35,tan:0.0002}
};
const BGS={deep:{price:0},black:{price:4},green:{price:6},stone:{price:8}};
const decSum=(tk,f)=>{let v=0;for(const k in tk.decor||{})if(tk.decor[k]&&DECOR[k])v+=DECOR[k][f]||0;return v;};
const PLANTS={
  moss:{price:6,cap:4,g:0.0016,val:2.5,up:150},
  anub:{price:9,cap:3,g:0.0006,val:4,up:150},
  horn:{price:5,cap:5,g:0.006,val:1.2,up:250},
  frog:{price:5,cap:4,g:0.005,val:1,up:250}
};
const CONS={
  food:{price:6,qty:50},
  powder:{price:7,qty:30},
  test:{price:15,qty:20},
  remin:{price:10,qty:20},
  bact:{price:8,qty:1},
  leaf:{price:3,qty:5},
  med:{price:12,qty:1}
};
const TANKS={20:{price:30,dims:[36,25,26]},35:{price:50,dims:[45,28,30]},60:{price:85,dims:[60,32,33]}};
const UPG={
  klima:{price:350},
  rack:{price:300},
  vitrin:{price:500}
};
const PARENTS={turuncu:['kirmizi','sari'],yesil:['mavi','sari'],mor:['kirmizi','mavi'],bordo:['kirmizi','siyah'],gece:['mavi','siyah'],cikolata:['siyah','sari']};
// Yaklaşık amonyak üretimi: yetişkin başına saatte (dışkı + çürüyen yem + detritus)
const NH_PER=0.0075,WFLOOR=8;
const OFFERS=[
  {k:'yabani',g:0.25},{k:'kirmizi',g:0.42},{k:'kirmizi',g:0.72},{k:'kirmizi',g:0.5,r:1},
  {k:'sari',g:0.42},{k:'sari',g:0.7},{k:'mavi',g:0.45},{k:'mavi',g:0.68},{k:'mavi',g:0.5,r:1},{k:'siyah',g:0.45}
];
const TAP={GH:10,KH:7,min:290,NO3:4};
// Görünen adlar: n/d/u alanları dile göre metin döndüren getter'lardır (dil değişince yeniden çizim doğru olur).
const tt=(k,p)=>I18N.t(k,p);
const getters=(tbl,pre,fields)=>{for(const k in tbl)for(const f of fields)
  Object.defineProperty(tbl[k],f,{get:f==='n'?()=>tt(pre+k):f==='u'?function(){return tt(pre+k+'.u',{n:this.qty});}:()=>tt(pre+k+'.'+f),enumerable:true,configurable:true});};
getters(MORPH,'morph.',['n']);getters(FILTERS,'eq.',['n','d']);getters(LIGHTS,'eq.',['n','d']);getters(GEAR,'eq.',['n','d']);getters(SUBS,'sub.',['n','d']);getters(DECOR,'dec.',['n','d']);getters(BGS,'bg.',['n']);
getters(PLANTS,'plant.',['n','d']);getters(CONS,'cons.',['n','u']);getters(UPG,'upg.',['n','d']);
// Melez tarifi: "Kırmızı × Sarı" (renk adları dile göre)
const RECIPE={};for(const k in PARENTS)Object.defineProperty(RECIPE,k,{get:()=>MORPH[PARENTS[k][0]].n+' × '+MORPH[PARENTS[k][1]].n,enumerable:true});

const morphOf=s=>COMBO[[s.c[0],s.c[1]].sort().join('')]||'yabani';
const isRili=s=>s.p[0]==='r'&&s.p[1]==='r';
const keyOf=s=>morphOf(s)+(isRili(s)?'_r':'');
const keyName=k=>{const[m,r]=k.split('_');return MORPH[m].n+(r?' Rili':'')};
const gradeName=g=>tt(g<0.3?'grade.low':g<0.55?'grade.sakura':g<0.8?'grade.fire':'grade.painted');
const stageName=st=>tt('stage.'+st);
const stage=s=>s.age<BABY?'baby':s.age<ADULT?'juv':'adult';
const sizeOf=s=>Math.min(1,0.14+s.age/65*0.86);
const tds=tk=>tk.min+tk.NO3*0.8+tk.tan*30;
// Döngülenmiş tank: bakteri kolonisi kurulu. Kurulduktan sonra yemden kaynaklı küçük amonyak dalgalanmaları döngüyü bozmaz.
const cycled=tk=>tk.level>0.5&&!!tk.cyc&&tk.NH3<0.25&&tk.NO2<0.3;
const bioCapOf=(type,vol,pf)=>(type?FILTERS[type].bio*(0.6+0.4*vol/20):surfCap(vol,pf==null?1:pf))+0.12;
// Filtresiz tankta yüzey biyofilmi: tank hacmi ve bitki doluluğuyla ölçeklenir (dolu bitkide sünger filtrenin ~yarısı).
function surfCap(vol,pf){return 0.5*(0.6+0.4*vol/20)*(0.25+0.75*clamp(pf,0,1));}
// Bitki doluluğu (0-1): dört türün kapasiteye oranı ortalaması.
function plantFrac(tk){const sc=tk.vol/20;let f=0;for(const k in PLANTS)f+=Math.min(1,(tk.plants[k]||0)/(PLANTS[k].cap*sc))/4;return f;}
// Filtrenin rahatça taşıyabileceği yetişkin karides sayısı (akış zayıflığı payıyla)
const filterCap=(type,vol,pf)=>Math.floor((type?bioCapOf(type,vol):surfCap(vol,pf==null?0:pf)+0.12)*0.7/NH_PER/5)*5;
// Koloni filtrenin taşıyabileceği kadar ürer; bakımsız tank kendini sınırlar.
const popCap=tk=>Math.min(tk.vol*5.5,Math.max(tk.vol*1.5,filterCap(tk.eq.filter,tk.vol,plantFrac(tk))));
const stressAlert=tk=>!!(tk&&tk.shrimp.length&&(tk.stress>1.3||(tk.fload||0)>1.05));
const maxTanks=S=>6+(S.up&&S.up.rack?2:0);
// Türkçe ek: "Tank 2" -> "Tank 2'ye" (yönelme) / "Tank 2'yi" (belirtme); diğer dillerde ad aynen döner.
const suf=(name,c)=>I18N.lang==='tr'?I18N.trSuf(name,c):String(name);
// Sayı biçimi dile göre (tr-TR / en-IE / nl-NL); biçimleyiciler yerel ayar başına bir kez kurulur. Para birimi her dilde €.
const NF={};
function num(v,d){d=d==null?0:d;v=+v;if(!isFinite(v))v=0;const loc=I18N.locale||'en-IE',k=loc+'|'+d;
  try{if(!NF[k])NF[k]=new Intl.NumberFormat(loc,{minimumFractionDigits:d,maximumFractionDigits:d});return NF[k].format(v).replace('-','−');}
  catch(e){const sep=loc==='en-IE'?[',','.']:['.',','],s=Math.abs(v).toFixed(d).split('.');return(v<0?'−':'')+s[0].replace(/\B(?=(\d{3})+(?!\d))/g,sep[0])+(s[1]?sep[1]+s[1]:'');}}
const eur=v=>{v=Math.round((+v||0)*100)/100;return(v<0?'−':'')+'€'+num(Math.abs(v),2);};

/* Günlük kayıtları {k: anahtar, p: parametreler} olarak saklanır; metin gösterimde güncel dilde üretilir.
   Parametre değerleri: düz metin/sayı ya da {t:anahtar,p:{...}} (çeviri), {kn:'kirmizi_r'} (renk adı), {eur:12} (para),
   {list:[...]} (virgülle birleştirilir). Eski kayıtlarda yalnızca msg (Türkçe metin) vardır. */
function rv(v){if(v==null||typeof v!=='object')return v;
  if(Array.isArray(v.list))return v.list.map(rv).join(', ');
  if(v.kn)return MORPH[v.kn.split('_')[0]]?keyName(v.kn):v.kn;if(v.eur!=null)return eur(v.eur);
  if(v.t)return tt(v.t,rp(v.p));return '';}
function rp(p){if(!p)return p;const o={};for(const a in p)o[a]=rv(p[a]);return o;}
function logText(e){if(!e)return '';return e.k?tt(e.k,rp(e.p)):(e.msg||'');}
// msg: eski kodun okuduğu alan; yeni kayıtlarda kaydedilmeyen (non-enumerable) bir getter.
function liveMsg(e){if(e&&e.k&&!Object.getOwnPropertyDescriptor(e,'msg'))Object.defineProperty(e,'msg',{get(){return logText(this);},enumerable:false,configurable:true});return e;}
function log(S,k,p,kind){S.log.unshift(liveMsg({id:S.lid++,t:S.t,k,p:p||{},kind:kind||'info'}));if(S.log.length>60)S.log.length=60;}
// Müşteri adı: siparişte wk (anahtar) saklanır; who getter'ı güncel dilde döndürür (kaydedilmez).
function liveWho(o){if(o&&o.wk&&!Object.getOwnPropertyDescriptor(o,'who'))Object.defineProperty(o,'who',{get(){return tt(this.wk);},enumerable:false,configurable:true});return o;}
const whoName=o=>o?(o.wk?tt(o.wk):o.who||''):'';
const whoP=o=>o.wk?{t:o.wk}:(o.who||'');
// Stres/kayıp neden kodları; eski kayıtlardaki Türkçe kodlar da tanınır (kaçışlı yazım, denetleyici için).
const OLDCAUSE={'so\u011fuk':'cold','s\u0131cakl\u0131k':'heat','amonyak':'ammonia','nitrit':'nitrite','nitrat':'nitrate','oksijen':'oxygen',
  'kalabal\u0131k':'crowd','a\u00e7l\u0131k':'hunger','ani de\u011fi\u015fim':'shock','stres':'stress','ya\u015fl\u0131l\u0131k':'old',
  'deri de\u011fi\u015ftirme':'molt','yavru kayb\u0131':'baby','yumurta d\u00fc\u015f\u00fcrme':'eggs'};
const causeName=c=>tt('cause.'+(OLDCAUSE[c]||c));
// Sıcak/soğuk dalgası oda sıcaklığını hafifçe değiştirir. Fan sıcak dalgayı, ısıtıcı soğuk dalgayı tamamen karşılar.
function waveDelta(S,raw){const w=(S.ev.heat>0?2.5:0)-(S.ev.cold>0?2.5:0);return raw||!(S.up&&S.up.klima)?w:w*0.2;}
function roomTemp(S){const d=S.t/24,h=S.t%24;const r=21+3.6*Math.sin(6.2831853*(d-10)/120)+1.1*Math.sin(6.2831853*(h-9)/24)+waveDelta(S,true);
  return S.up&&S.up.klima?23+(r-23)*0.2:r;}

function newTank(S,vol){
  const t=roomTemp(S);
  return{id:S.nid++,name:'Tank '+(S.tanks.length+1),vol,level:0,T:t,GH:TAP.GH,KH:TAP.KH,min:TAP.min,NH3:0,NO2:0,NO3:TAP.NO3,
    A:0.01,N:0.01,flow:1,food:0,powder:0,det:0,algae:0.04,bio:0.2,tan:0,plan:0,sat:0.8,shock:0,O2:8,pH:7.3,TDS:TAP.min,
    heating:false,cooling:false,lit:false,running:false,aer:0,stress:0,reasons:[],adults:0,babies:0,count:0,
    eq:{filter:null,light:null,set:24,photo:8},gear:{},plants:{moss:0,anub:0,horn:0,frog:0},snails:{ram:0,ner:0},
    sub:null,subAge:0,subLeft:0,decor:{},bg:'deep',leaves:[],shrimp:[],test:null,foodSpot:[0,0],waste:0,wi:0,fload:0,cyc:false,deaths:{},warnAt:-999,fwarnAt:-999,alertT:-999,seed:(R()*1e9)|0};
}
function mk(S,o){
  const m=COMBO[[o.c[0],o.c[1]].sort().join('')]||'yabani';
  const s={id:S.nid++,sex:o.sex||(R()<0.5?'F':'M'),age:o.age||0,c:o.c,p:o.p,grade:o.grade,gen:o.gen||0,pa:o.pa||null,
    health:o.health==null?92:o.health,hard:clamp(1.1-0.25*o.grade+gauss()*0.08+(m==='yabani'?0.25:0),0.6,1.6),
    molt:R()*8,life:320+R()*160,ber:0,bt:0,fa:null,dna:false};
  if(o.bought)s.bought=true;return s;
}
const FLAGS=()=>({begun:0,tested:0,bought:0,fed:0,rescue:0,firstOrder:0,sub:0,filled:0});
function newGame(){
  const S={v:2,money:120,t:8,nid:1,lid:1,tanks:[],inv:{food:20,powder:0,test:3,remin:0,bact:1,leaf:0,med:0},ro:false,
    demand:{},orders:[],found:{},bred:{},log:[],stats:{sold:0,earned:0,born:0,died:0,spent:0,orders:0,bestG:0},ev:{out:0,heat:0,cold:0},cur:0,src:'tap',speed:1,rep:0,
    up:{},ms:{},msq:[],flags:FLAGS(),haptics:true,alertT:-999};
  const t=newTank(S,20);S.tanks.push(t);
  for(const k in MORPH)S.demand[k]=1;
  log(S,'log.newGame',{tank:t.name},'info');
  return S;
}
// Eski kayıtları (v1) güncel yapıya taşır; v2 üzerinde tekrar çalıştırmak zararsızdır.
function migrate(s){
  if(!s||typeof s!=='object'||!Array.isArray(s.tanks))return s;
  const d=(o,k,v)=>{if(o[k]==null||(typeof v==='number'&&!isFinite(o[k])))o[k]=v;};
  const was=s.v||1;
  d(s,'money',0);d(s,'t',8);d(s,'nid',1);d(s,'lid',1);d(s,'rep',0);d(s,'cur',0);d(s,'src','tap');d(s,'speed',1);d(s,'ro',false);d(s,'alertT',-999);if(s.ev)s.ev.out=0;
  d(s,'inv',{});for(const k in CONS)d(s.inv,k,0);
  d(s,'demand',{});for(const k in MORPH)d(s.demand,k,1);
  d(s,'orders',[]);d(s,'found',{});d(s,'bred',{});d(s,'log',[]);d(s,'ev',{});d(s.ev,'out',0);d(s.ev,'heat',0);d(s.ev,'cold',0);
  d(s,'stats',{});for(const k of['sold','earned','born','died','spent','orders','bestG'])d(s.stats,k,0);
  d(s,'up',{});d(s,'ms',{});if(!Array.isArray(s.msq))s.msq=[];
  if(s.flags&&s.flags.firstOrder==null&&s.flags.bought)s.flags.firstOrder=1;
  d(s,'flags',FLAGS());const F0=FLAGS();for(const k in F0)d(s.flags,k,0);
  if(was<2){s.flags.begun=1;s.flags.tested=1;s.flags.bought=1;s.flags.fed=1;}
  d(s,'haptics',true);
  // Taban, dekor ve arka plan (eski kayıtlarda tank zaten kurulu: çakıl ya da toprak).
  for(const tk of s.tanks){if(tk.sub===undefined){tk.sub=tk.soil>0.02?'soil':'gravel';tk.subLeft=tk.soil>0.02?tk.soil:1;tk.subAge=tk.soilAge||0;}delete tk.soil;delete tk.soilAge;
    if(tk.sub&&!SUBS[tk.sub]){tk.sub='gravel';tk.subLeft=1;}d(tk,'subAge',0);d(tk,'subLeft',1);d(tk,'decor',{});if(tk.decor.dragon)delete tk.decor.dragon;d(tk,'bg','deep');}
  for(const tk of s.tanks){d(tk,'waste',0);d(tk,'wi',0);d(tk,'fload',0);d(tk,'warnAt',-999);d(tk,'fwarnAt',-999);d(tk,'alertT',-999);d(tk,'deaths',{});
    if(tk.cyc==null)tk.cyc=tk.A>0.12&&tk.N>0.3;if(!tk.cyc&&tk.level>0.5&&tk.A>0.08&&tk.N>0.2)tk.cyc=true;if(!Array.isArray(tk.shrimp))tk.shrimp=[];if(!Array.isArray(tk.leaves))tk.leaves=[];
    for(const sh of tk.shrimp){if(was<2&&sh.bought==null&&!sh.pa&&!sh.gen)sh.bought=true;
      if(!sh.bought&&sh.grade>s.stats.bestG)s.stats.bestG=sh.grade;}}
  if(was<2)for(const k in s.found)if(s.found[k]&&/_r$|turuncu|yesil|mor|bordo|gece|cikolata/.test(k))s.bred[k]=1;
  s.orders=s.orders.filter(o=>o&&MORPH[o.m]);s.orders.forEach(liveWho);
  s.log=s.log.filter(e=>e&&typeof e==='object');s.log.forEach(liveMsg);
  for(const tk of s.tanks){const nd={};for(const k in tk.deaths){const c=OLDCAUSE[k]||k;nd[c]=(nd[c]||0)+tk.deaths[k];}tk.deaths=nd;}
  if(was<2)checkMs(s,true);
  s.v=2;return s;
}

function price(S,s){
  const st=stage(s);if(st==='baby')return 0;
  const m=morphOf(s);let p=MORPH[m].v*(0.45+1.4*s.grade)*(isRili(s)?1.6:1)*(s.sex==='M'?0.7:1);
  if(st==='juv')p*=0.55;if(s.health<50)p*=0.6;if(S.up&&S.up.vitrin)p*=1.1;
  return r2(p*(S.demand[m]||1));
}
const offerPrice=o=>r2(MORPH[o.k].v*(0.45+1.4*o.g)*(o.r?1.6:1)*0.85*1.75);

function envStress(tk){
  let s=0;const r=[];const add=(v,w)=>{if(v>0.05){s+=v;r.push([w,v]);}};
  // Neden kodları (cause.* anahtarları): cold heat ammonia nitrite nitrate pH GH oxygen crowd hunger shock
  add(tk.T<14.5?(14.5-tk.T)*0.35:0,'cold');
  add(tk.T>28?(tk.T-28)*0.8+(tk.T>31?(tk.T-31)*2.5:0):0,'heat');
  add(Math.max(0,tk.NH3-0.1)*14,'ammonia');
  add(Math.max(0,tk.NO2-0.1)*9,'nitrite');
  add(Math.max(0,tk.NO3-40)*0.03,'nitrate');
  add(tk.pH<6.3?(6.3-tk.pH)*3:tk.pH>8.1?(tk.pH-8.1)*3:0,'pH');
  add(tk.GH<4?(4-tk.GH)*0.9:tk.GH>15?(tk.GH-15)*0.16:0,'GH');
  add(tk.O2<4.3?(4.3-tk.O2)*1.6:0,'oxygen');
  const crowd=tk.shrimp.length/(tk.vol*6);add(crowd>1?(crowd-1)*2.5:0,'crowd');
  if(tk.shrimp.length)add(tk.sat<0.3?(0.3-tk.sat)*3:0,'hunger');
  add(tk.shock,'shock');
  tk.stress=s;tk.reasons=r.sort((a,b)=>b[1]-a[1]);
}
function kill(S,tk,i,why){
  const s=tk.shrimp[i];tk.shrimp.splice(i,1);const z=sizeOf(s);
  tk.det+=z*3;tk.NH3+=z*0.08/(tk.vol*tk.level);// ölü çoğunlukla yavaş çözünen atığa döner; ani amonyak zinciri olmasın
  tk.deaths[why]=(tk.deaths[why]||0)+1;S.stats.died++;
}
function discover(S,k,bonus){
  if(S.found[k])return;S.found[k]=1;
  if(bonus){const[m,r]=k.split('_');const b=Math.round(MORPH[m].v*5*(r?2:1));S.money+=b;S.stats.earned+=b;
    log(S,'log.discover',{kind:{kn:k},money:{eur:b}},'good');}
}
function hatch(S,tk,m){
  const f=m.fa;m.ber=0;m.fa=null;m.bt=0;if(!f)return;
  let n=Math.round((7+R()*13)*(0.5+0.5*m.health/100)*(0.6+0.4*tk.sat));
  n=Math.max(0,Math.min(n,Math.floor(popCap(tk)*1.1-tk.shrimp.length)));
  for(let i=0;i<n;i++){
    const c=[pick(m.c),pick(f.c)],p=[pick(m.p),pick(f.p)];
    if(R()<0.004)c[R()<0.5?0:1]=pick(ALLELES);
    const b=mk(S,{c,p,grade:clamp((m.grade+f.grade)/2+gauss()*0.07,0,1),age:0,gen:Math.max(m.gen,f.gen)+1,pa:[m.id,f.id]});
    tk.shrimp.push(b);const k=keyOf(b);discover(S,k,true);if(S.bred)S.bred[k]=1;if(b.grade>(S.stats.bestG||0))S.stats.bestG=b.grade;
  }
  S.stats.born+=n;
  if(n)log(S,'log.hatch',{tank:tk.name,kind:{kn:keyOf(m)},n,ti:S.tanks.indexOf(tk)},'joy');
}

function tankHour(S,tk,h,room,power){
  // Boş tank (su yok): sadece cam oda sıcaklığına yaklaşır.
  if(tk.level<0.05){tk.T+=(room-tk.T)*0.2;tk.stress=0;tk.reasons=[];tk.lit=false;tk.running=false;return;}
  let V=tk.vol*tk.level;const sc=tk.vol/20;const SB=tk.sub?SUBS[tk.sub]:null,left=tk.subLeft||0;
  const F=tk.eq.filter?FILTERS[tk.eq.filter]:null;
  const running=!!F&&power&&(tk.eq.filter!=='sponge'||!!tk.gear.air);tk.running=running;
  const lit=!!tk.eq.light&&power&&h>=9&&h<9+tk.eq.photo;tk.lit=lit;
  const Lraw=lit?LIGHTS[tk.eq.light].L:0;
  const Leff=Lraw*(1-Math.min(0.45,tk.plants.frog/(PLANTS.frog.cap*sc)*0.45));
  // temperature
  const wv=waveDelta(S),rm=(wv>0&&tk.gear.fan)||(wv<0&&tk.gear.heater)?room-wv:room;
  let target=rm+(lit?0.4:0);tk.heating=false;tk.cooling=false;
  if(power&&tk.gear.heater&&target<tk.eq.set){target=Math.min(tk.eq.set,rm+12);tk.heating=tk.T<tk.eq.set-0.05;}
  if(power&&tk.gear.fan&&tk.T>tk.eq.set+0.4){target=Math.min(target,Math.max(tk.eq.set,target-3.5));tk.cooling=true;}
  tk.T+=(target-tk.T)*0.1*Math.pow(20/tk.vol,0.35);
  // filter
  if(running)tk.flow=Math.max(0.3,tk.flow-0.0011*(1+Math.min(3,tk.det/(40*sc)))*(SB&&SB.clog||1));
  if(running&&tk.flow<0.55&&tk.flow+0.0011*(1+Math.min(3,tk.det/(40*sc)))>=0.55)log(S,'log.clog',{tank:tk.name});
  const aer=Math.min(1,(running?F.aer*(0.4+0.6*tk.flow):0)+(power&&tk.gear.air?0.45:0));tk.aer=aer;
  // Filtresiz tankta bakteriler yüzeylerde durgun suda çalışır; takılı ama çalışmayan filtre (elektrik yok) çok zayıf kalır.
  const bioCap=bioCapOf(tk.eq.filter,tk.vol,plantFrac(tk)),proc=running?0.5+0.5*tk.flow:tk.eq.filter?0.3:0.85;
  // census
  let adults=0,load=0,dem=0,babies=0;const males=[];
  for(const s of tk.shrimp){const z=sizeOf(s);load+=z;dem+=0.07*z;if(s.age>=ADULT){adults++;if(s.sex==='M')males.push(s);}else if(s.age<BABY)babies++;}
  load+=tk.snails.ram*0.35+tk.snails.ner*0.6;
  tk.adults=adults;tk.babies=babies;tk.count=tk.shrimp.length;tk.dem=dem;
  // eating
  const need=dem+tk.snails.ram*0.02+tk.snails.ner*0.012;let got=0;
  const eat=(k,a)=>{const x=Math.min(tk[k],a);tk[k]-=x;got+=x;};
  eat('food',need);if(got<need)eat('powder',need-got);
  if(got<need){const c=25*sc,x=Math.min(tk.bio*c,need-got);tk.bio-=x/c;got+=x;}
  if(got<need){const c=12*sc,x=Math.min(tk.algae*c,(need-got)*0.6);tk.algae-=x/c;got+=x;}
  tk.sat=clamp(tk.sat+((need>0?got/need:1)-tk.sat)*0.03,0,1);
  // decay and nitrogen
  const dec=tk.food*0.035+tk.powder*0.05;tk.food-=tk.food*0.035;tk.powder-=tk.powder*0.05;tk.waste+=dec;
  tk.det+=dec*0.5+load*0.004;const minz=tk.det*0.004;tk.det-=minz;
  // Toprak taban: ilk haftalarda amonyak salar (yarı ömür ~10 gün), sonra yavaşça tükenir (~5 ay).
  let leach=0;if(SB){tk.subAge=(tk.subAge||0)+1;if(SB.leach&&left>0)leach=SB.leach*sc*Math.exp(-tk.subAge/(24*SB.half));if(SB.life)tk.subLeft=Math.max(0,left-1/(24*SB.life));}
  const prod=load*0.006+dec*0.035+minz*0.15+leach;
  let nh3=tk.NH3*V+prod,no2=tk.NO2*V,no3=tk.NO3*V;
  const avA=nh3,cA=Math.min(nh3,tk.A*proc);nh3-=cA;no2+=cA*2.7;
  const avN=no2,cN=Math.min(no2,tk.N*proc);no2-=cN;no3+=cN*1.35;
  tk.A=clamp(tk.A+0.035*tk.A*avA/(avA+0.3)-0.002*tk.A,F?0.008:0.004,bioCap);
  tk.N=clamp(tk.N+0.03*tk.N*avN/(avN+0.6)-0.002*tk.N,F?0.008:0.004,bioCap*2.7);
  if(tk.A>=0.12&&tk.N>=0.3)tk.cyc=true;
  // Kurulmuş koloni besinsiz kalınca ölmez, dinlenir: su olduğu sürece döngü korunur (yalnızca tank boşaltılınca/taban değişince sıfırlanır).
  if(tk.cyc&&tk.level>0.05){tk.A=Math.max(tk.A,Math.min(0.12,bioCap));tk.N=Math.max(tk.N,Math.min(0.3,bioCap*2.7));}
  tk.fload=(tk.fload||0)+(prod/(bioCap*proc)-(tk.fload||0))*0.04;
  // plants
  const soil=SB&&SB.nut?left:0,nut=Math.min(1,(no3/V)/12+(nh3/V)*4+0.12+(SB?SB.nut:0)*soil),pmul=SB?(SB.life?1+(SB.plant-1)*left:SB.plant):0.7;
  let upt=0,pfrac=0,pmass=0;
  for(const k in PLANTS){const P=PLANTS[k],m=tk.plants[k];if(m<=0)continue;const cap=P.cap*sc;pmass+=m;pfrac+=Math.min(1,m/cap)/4;
    // Büyüme toprakla ikiye katlanır; olgun bitki büyümese de besin çeker, gece de az miktarda.
    const L=k==='frog'?Lraw:Leff,base=m*P.g*P.up*nut;
    if(lit){const g=m*P.g*(0.4+L)*nut*Math.max(0,1-m/cap)*pmul;tk.plants[k]=m+g;upt+=g*P.up+base*(0.4+L)*0.4+m*0.02;}
    else upt+=base*0.08;
    if(m>cap*0.97)tk.det+=m*0.003;}
  const fromNH=Math.min(nh3,upt/3.6);nh3-=fromNH;no3=Math.max(0,no3-(upt-fromNH*3.6));
  // algae, biofilm, tannin
  const aN=Math.min(1.6,(no3/V)/15+(nh3/V)*3+0.08);
  const ag=Leff*0.0065*aN*(1-Math.min(0.75,pfrac*1.3));
  const gz=(tk.snails.ner*0.0012+tk.snails.ram*0.00025+adults*0.00003)/sc;
  tk.algae=clamp(tk.algae+ag*(1-tk.algae)-gz*Math.min(1,tk.algae*4),0,1);
  tk.bio=clamp(tk.bio+0.005*(1+tk.leaves.length*0.25)*(0.5+pfrac+decSum(tk,'bio')),0,1);
  tk.tan=clamp(tk.tan+(tk.leaves.length*0.0005+decSum(tk,'tan'))/sc-tk.tan*0.002,0,1);
  // Aktif toprak KH'yi tüketir (pH düşer).
  if(SB&&SB.acid&&left>0)tk.KH=Math.max(1,tk.KH-0.004*left);
  // oxygen
  const sat=14.4-0.35*tk.T+0.0035*tk.T*tk.T;
  tk.O2=clamp(sat*((tk.gear.lid?0.6:0.64)+0.36*aer)+(lit?pmass*0.22:-pmass*0.03)/sc-load*0.02/sc-tk.det*0.002/sc,0.5,sat*1.15);
  // hardness
  tk.KH=Math.max(0,tk.KH-cA/V*0.06);
  const gl=load*0.00002/sc;tk.GH=Math.max(0,tk.GH-gl);tk.min=Math.max(5,tk.min-gl*9);
  // evaporation
  const ev=0.00026*(lit?1.3:0.8)*Math.max(0.5,tk.T/24)*(tk.gear.lid?0.25:1),L0=tk.level;
  tk.level=Math.max(0.5,tk.level-ev);const cf=L0/tk.level;tk.GH*=cf;tk.KH*=cf;tk.min*=cf;
  if(tk.level<0.75&&L0>=0.75&&tk.shrimp.length)log(S,'log.level',{tank:tk.name});
  V=tk.vol*tk.level;
  tk.NH3=Math.max(0,nh3/V);tk.NO2=Math.max(0,no2/V);tk.NO3=Math.max(0,no3/V);
  tk.pH=clamp(6.1+0.26*Math.pow(tk.KH,0.8)+(lit?0.12:0)-tk.tan*0.5-(SB&&SB.acid?0.45*left:0),5.6,8.4);
  tk.TDS=tds(tk);tk.shock*=0.9;
  envStress(tk);
  // shrimp life
  const safe=!running||F.safe||!!tk.gear.guard;
  const cover=Math.min(1,tk.plants.moss/(PLANTS.moss.cap*sc)*1.4+tk.leaves.length*0.05+decSum(tk,'cover'));
  const st=tk.stress*(1-tk.tan*0.25);
  const top=tk.reasons[0]?tk.reasons[0][0]:'stress';
  for(let i=tk.shrimp.length-1;i>=0;i--){
    const s=tk.shrimp[i];s.age+=1/24;
    const ss=st/s.hard;
    s.health=Math.min(100,s.health+(ss<1?(1-ss)*0.9:-Math.min(1.5,Math.pow(ss-1,1.3)*0.55+0.04)));// saatte en fazla 1,5 sağlık: oyuncuya müdahale süresi kalır
    if(s.health<=0||(s.health<25&&R()<0.01)){kill(S,tk,i,top);continue;}
    if(s.age>s.life){kill(S,tk,i,'old');continue;}
    s.molt-=1/24;
    if(s.molt<=0){s.molt=5+sizeOf(s)*9+R()*3;
      const risk=((tk.GH<4?(4-tk.GH)*0.07:0)+(tk.GH>16?0.03:0)+tk.shock*0.1+(s.health<40?0.05:0))*(1-decSum(tk,'molt'));
      if(R()<risk){kill(S,tk,i,'molt');continue;}}
    if(s.age<BABY){let p=0;if(!safe)p+=0.0035;p+=Math.min(0.02,tk.plan*0.0012);if(tk.sat<0.4)p+=0.002;p*=1-0.7*cover;
      if(R()<p){kill(S,tk,i,'baby');continue;}}
    if(s.ber){s.bt+=(0.6+0.5*clamp((tk.T-18)/8,0,1))/24;
      if(st>3&&R()<0.008){s.ber=0;s.fa=null;s.bt=0;tk.deaths.eggs=(tk.deaths.eggs||0)+1;}
      else if(s.bt>=21)hatch(S,tk,s);}
    else if(h===21&&s.sex==='F'&&s.age>=ADULT&&males.length&&s.health>55&&tk.sat>0.35&&tk.T>=19&&tk.T<=29&&tk.shrimp.length<popCap(tk)){
      const opt=1-Math.min(1,Math.abs(tk.T-25)/7);
      if(R()<(0.05+0.1*opt)*(st<1?1:0.3)){const f=pick(males);s.ber=1;s.bt=0;s.fa={c:f.c.slice(),p:f.p.slice(),grade:f.grade,gen:f.gen,id:f.id};
        // küçük ödül: bir tankta en fazla üç günde bir 'yumurta taşıyor' haberi
        if(S.t-(tk.berT||-999)>72){tk.berT=S.t;log(S,'log.berried',{tank:tk.name,ti:S.tanks.indexOf(tk)},'joy');}}}
  }
  // autofeeder
  if(h===10&&power&&tk.gear.feeder&&tk.shrimp.length){const n=recFood(tk);if(n>0&&S.inv.food>=n){S.inv.food-=n;tk.food+=20*n;tk.foodSpot=[(R()-0.5)*0.6,(R()-0.5)*0.4];}}
}

// Önerilen günlük yem (porsiyon): koloninin bir günlük ihtiyacı; dipte yem varken 0.
function demOf(tk){let d=0;for(const s of tk.shrimp)d+=0.07*sizeOf(s);return d+tk.snails.ram*0.02+tk.snails.ner*0.012;}
// Karidessiz tank: döngü bitmediyse bakterileri beslemek için günde bir porsiyon (dipte yem yoksa), döngü bittiyse yem gerekmez.
function recFood(tk){if(!tk.shrimp.length)return tk.level>0.05&&!cycled(tk)&&tk.food<10?1:0;const day=demOf(tk)*24,left=tk.food+tk.powder;
  if(left>day*0.25)return 0;return Math.max(1,Math.round((day-left)/20));}
// Müşteriler: sözlükte who.0 … who.12 (kişi adları aynı kalır, yer/etiketler çevrilir)
const WHO_N=13;
// Yalnızca oyuncunun bildiği renkler; "stretch" = ulaşılabilir bir melez için uzun süreli sipariş
function newOrder(S,stretch){
  const has=k=>S.found[k]||S.found[k+'_r'];
  if(stretch){const c=Object.keys(PARENTS).filter(k=>!has(k)&&PARENTS[k].some(has));if(!c.length)return null;
    const m=pick(c),qty=3+((R()*3)|0),minG=0.3;
    return{id:S.nid++,m,rili:false,minG,qty,stretch:true,pay:Math.round(MORPH[m].v*(0.45+1.4*0.35)*0.85*qty*2.6),until:S.t+24*(90+((R()*30)|0)),wk:'who.'+((R()*WHO_N)|0)};}
  const pool=Object.keys(MORPH).filter(k=>k!=='yabani'&&has(k));if(!pool.length)return null;
  const m=pick(pool),rili=!!S.found[m+'_r']&&R()<0.35;
  let best=0;for(const tk of S.tanks)for(const s of tk.shrimp)if(morphOf(s)===m&&s.grade>best)best=s.grade;
  const opts=[0.3,0.4,0.5,0.6,0.7].filter(g=>g<=Math.max(0.3,best+0.08));
  const minG=pick(opts),qty=2+((R()*5)|0);
  const unit=MORPH[m].v*(0.45+1.4*(minG+0.05))*(rili?1.6:1)*0.85;
  return{id:S.nid++,m,rili,minG,qty,pay:Math.round(unit*qty*1.9),until:S.t+24*(12+((R()*14)|0)),wk:'who.'+((R()*WHO_N)|0)};
}
/* ---------- milestones ---------- */
const nColors=S=>Object.keys(MORPH).filter(k=>S.found[k]||S.found[k+'_r']).length;
const nShrimp=S=>S.tanks.reduce((a,t)=>a+t.shrimp.length,0);
const MS=[
  // Döngü hedefi: test temiz VE bakteri kolonisi gerçekten kurulmuş olmalı (yeni, boş tankın sıfır değerleri sayılmaz)
  {id:'cycle',r:10,p:S=>S.tanks.some(t=>t.test&&cycled(t)&&t.test.NH3<=0.05&&t.test.NO2<=0.05)?1:0},
  {id:'hatch',r:15,p:S=>Math.min(1,S.stats.born)},
  {id:'sale',r:10,p:S=>Math.min(1,S.stats.sold)},
  {id:'order',r:20,p:S=>Math.min(1,S.stats.orders)},
  {id:'tank2',r:15,p:S=>Math.min(1,(S.tanks.length-1))},
  {id:'pop50',r:30,p:S=>Math.min(1,nShrimp(S)/50)},
  {id:'hybrid',r:40,p:S=>Object.keys(PARENTS).some(k=>S.bred[k]||S.bred[k+'_r'])?1:0},
  {id:'rili',r:30,p:S=>Object.keys(S.bred).some(k=>/_r$/.test(k))?1:0},
  {id:'col5',r:50,p:S=>Math.min(1,nColors(S)/5)},
  {id:'grade',r:60,p:S=>Math.min(1,(S.stats.bestG||0)/0.8)},
  {id:'orders10',r:120,p:S=>Math.min(1,S.stats.orders/10)},
  {id:'earn',r:100,p:S=>Math.min(1,S.stats.earned/1000)},
  {id:'col11',r:300,p:S=>Math.min(1,nColors(S)/11)}
];
for(const m of MS)Object.defineProperties(m,{n:{get:()=>tt('ms.'+m.id),enumerable:true},d:{get:()=>tt('ms.'+m.id+'.d'),enumerable:true}});
function checkMs(S,silent){if(!S.ms)S.ms={};if(!S.msq)S.msq=[];const out=[];
  for(const m of MS){if(S.ms[m.id])continue;let p=0;try{p=m.p(S)}catch(e){p=0}if(p<1)continue;
    S.ms[m.id]=S.t||1;if(silent)continue;S.money=r2(S.money+m.r);S.stats.earned+=m.r;S.msq.push(m.id);out.push(m);
    log(S,'log.ms',{goal:{t:'ms.'+m.id},money:{eur:m.r}},'ms');}
  return out;}
function daily(S){
  const day=Math.floor(S.t/24)+1;
  for(const k in S.demand)S.demand[k]=clamp(S.demand[k]+(1-S.demand[k])*0.08+(R()-0.5)*0.06,0.4,1.6);
  if(S.ev.heat<=0&&S.ev.cold<=0){const se=Math.sin(6.2831853*(day-10)/120);
    if(se>0.4&&R()<0.02){S.ev.heat=48;log(S,'log.heat',null);}
    else if(se<-0.4&&R()<0.02){S.ev.cold=48;log(S,'log.cold',null);}}
  if(R()<0.06){const k=pick(Object.keys(MORPH));S.demand[k]=Math.min(1.6,S.demand[k]+0.4);log(S,'log.demand',{color:{kn:k}},'good');}
  for(const o of S.orders)if(o.until<=S.t)log(S,'log.missed',{who:whoP(o)});
  S.orders=S.orders.filter(o=>o.until>S.t);
  const reg=S.orders.filter(o=>!o.stretch).length;
  if(reg<3&&R()<0.45){const o=newOrder(S);if(o)S.orders.push(liveWho(o));}
  if(day>20&&!S.orders.some(o=>o.stretch)&&R()<0.05){const o=newOrder(S,true);if(o){S.orders.push(liveWho(o));log(S,'log.stretch',{who:whoP(o),color:{kn:o.m},n:Math.round((o.until-S.t)/24)},'good');}}
  if(S.flags&&!S.flags.rescue&&S.money<7&&!nShrimp(S)){S.flags.rescue=1;log(S,'log.rescue',null,'good');}
  for(const tk of S.tanks){
    const sc=tk.vol/20,dm=tk.dem||0,wi=Math.min(3,tk.waste/Math.max(WFLOOR*sc,dm*24*0.4));tk.wi=wi;tk.waste=0;
    if(tk.snails.ram>=2)tk.snails.ram=Math.min(Math.round(tk.vol*2.5),tk.snails.ram+Math.floor(tk.snails.ram*0.06*wi+(wi>0.3&&R()<0.3?1:0)));
    if(tk.snails.ram>0&&wi<0.1&&R()<0.15)tk.snails.ram--;
    if(tk.plan>0){tk.plan=Math.min(tk.vol*2,tk.plan*(1+0.12*(wi-1.1)));if(tk.plan<0.3)tk.plan=0;}
    else if(wi>1.8&&R()<0.03)tk.plan=0.5;
    tk.leaves=tk.leaves.map(a=>a+1).filter(a=>{if(a>25){tk.det+=2;return false}return true});
    const d=Object.entries(tk.deaths);
    if(d.length){const n=d.reduce((a,b)=>a+b[1],0);
      log(S,'log.losses',{tank:tk.name,n,list:{list:d.map(([k,v])=>({t:'log.lossItem',p:{cause:{t:'cause.'+(OLDCAUSE[k]||k)},n:v}}))}});tk.deaths={};}  // yalnızca günlüğe yazılır, bildirim çıkmaz
  }
}
function stepHour(S){
  S.t+=1;const h=S.t%24,room=roomTemp(S),power=S.ev.out<=0;
  if(S.ev.out>0){S.ev.out--;if(S.ev.out===0)log(S,'log.power',null,'good');}
  if(S.ev.heat>0)S.ev.heat--;if(S.ev.cold>0)S.ev.cold--;
  for(const tk of S.tanks)tankHour(S,tk,h,room,power);
  if(h===0)daily(S);
  if(h%3===0)checkMs(S);
}

/* ---------- actions ---------- */
const ok=m=>({ok:true,msg:m}),er=m=>({ok:false,msg:m});
function spend(S,c){c=Math.max(0,c);if(S.money+1e-9<c)return false;S.money=r2(S.money-c);S.stats.spent+=c;return true;}
function mixWater(tk,f,w,T){
  const oT=tk.T,oD=tds(tk),mx=(a,b)=>a*(1-f)+b*f;
  tk.T=mx(tk.T,T);tk.GH=mx(tk.GH,w.GH);tk.KH=mx(tk.KH,w.KH);tk.min=mx(tk.min,w.min);
  tk.NH3*=1-f;tk.NO2*=1-f;tk.NO3=mx(tk.NO3,w.NO3);tk.tan*=1-f;
  tk.TDS=tds(tk);tk.shock+=Math.abs(tk.T-oT)*0.3+Math.abs(tk.TDS-oD)/Math.max(60,oD)*2;
}
const A={
  feed(S,tk,k){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv[k]<1)return er(tt('act.outOf',{item:CONS[k].n}));S.inv[k]--;if(S.flags)S.flags.fed=1;
    if(k==='food')tk.food+=20;else tk.powder+=20;tk.foodSpot=[(R()-0.5)*0.6,(R()-0.5)*0.4];
    return ok(tt(k==='food'?'act.fed':'act.fedPowder'));},
  wc(S,tk,pct,src){if(tk.level<0.05)return er(tt('act.noWater'));
    const f=1-(1-pct)*tk.level;let w,name;
    if(src==='ro'&&S.ro){const doses=Math.max(1,Math.round(tk.vol*f/10));
      if(S.inv.remin>=doses){S.inv.remin-=doses;w={GH:7,KH:2,min:170,NO3:0};name=tt('act.srcRoMin',{n:doses});}
      else{w={GH:0.3,KH:0.2,min:8,NO3:0};name=tt('act.srcRoPure');}}
    else{w=TAP;name=tt('act.srcTap');}
    mixWater(tk,f,w,roomTemp(S));tk.level=1;tk.det*=Math.max(0,1-pct*1.6);tk.plan*=1-pct*0.3;tk.food*=1-pct*0.5;
    return ok(tt('act.wc',{pct:Math.round(pct*100),src:name}));},
  top(S,tk,src){
    // İlk doldurma: önce taban gerekir; RO seçilirse GH+ ile hazırlanır (su değişimi gibi).
    if(tk.level<0.05){if(!tk.sub)return er(tt('act.needSub'));let w,ro=false;
      if(src==='ro'&&S.ro){const d=Math.max(1,Math.round(tk.vol/10));if(S.inv.remin>=d){S.inv.remin-=d;w={GH:7,KH:2,min:170,NO3:0};}else w={GH:0.3,KH:0.2,min:8,NO3:0};ro=true;}else w=TAP;
      Object.assign(tk,{level:1,T:roomTemp(S),GH:w.GH,KH:w.KH,min:w.min,NO3:w.NO3,NH3:0,NO2:0,food:0,powder:0,det:0,flow:1,shock:0});tk.TDS=tds(tk);
      if(S.flags)S.flags.filled=1;return ok(tt('act.filled',{tank:tk.name,src:tt(ro?'act.srcRo':'act.srcTap')}));}
    const f=1-tk.level;if(f<0.01)return er(tt('act.topFull'));
    const w=(src==='ro'&&S.ro)?{GH:0,KH:0,min:5,NO3:0}:TAP;
    const oT=tk.T,mx=(a,b)=>a*(1-f)+b*f;tk.T=mx(tk.T,roomTemp(S));tk.GH=mx(tk.GH,w.GH);tk.KH=mx(tk.KH,w.KH);tk.min=mx(tk.min,w.min);tk.NO3=mx(tk.NO3,w.NO3);
    tk.NH3*=1-f;tk.NO2*=1-f;tk.shock+=Math.abs(tk.T-oT)*0.35;tk.level=1;tk.TDS=tds(tk);
    return ok(tt('act.top',{src:tt((src==='ro'&&S.ro)?'act.srcRo':'act.srcTap')}));},
  glass(S,tk){if(tk.algae<0.05)return er(tt('act.glassClean'));tk.algae*=0.25;tk.det+=1;return ok(tt('act.glass'));},
  rinse(S,tk){if(!tk.eq.filter)return er(tt('act.noFilter'));tk.flow=1;tk.A*=0.88;tk.N*=0.88;tk.det*=0.8;return ok(tt('act.rinse'));},
  trim(S,tk){let g=0;const sc=tk.vol/20;for(const k in PLANTS){const cap=PLANTS[k].cap*sc,m=tk.plants[k];if(m>cap*0.6){const cut=m-cap*0.5;tk.plants[k]=cap*0.5;g+=cut*PLANTS[k].val;}}
    if(!g)return er(tt('act.trimNone'));g=r2(g);S.money+=g;S.stats.earned+=g;return ok(tt('act.trim',{money:eur(g)}));},
  leaf(S,tk){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv.leaf<1)return er(tt('act.noLeaf'));if(tk.leaves.length>=6)return er(tt('act.leafFull'));S.inv.leaf--;tk.leaves.push(0);return ok(tt('act.leaf'));},
  remin(S,tk){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv.remin<1)return er(tt('act.noRemin'));S.inv.remin--;const k=20/(tk.vol*tk.level);
    tk.GH+=1.2*k;tk.KH+=0.4*k;tk.min+=25*k;tk.shock+=0.12;tk.TDS=tds(tk);return ok(tt('act.remin'));},
  bact(S,tk){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv.bact<1)return er(tt('act.noBact'));S.inv.bact--;const cap=bioCapOf(tk.eq.filter,tk.vol);
    tk.A=Math.min(cap,tk.A+0.1);tk.N=Math.min(cap*2.7,tk.N+0.26);return ok(tt('act.bact'));},
  med(S,tk){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv.med<1)return er(tt('act.noMed'));S.inv.med--;const had=tk.snails.ram+tk.snails.ner;tk.plan=0;tk.snails.ram=0;tk.snails.ner=0;tk.shock+=0.4;
    return ok(tt(had?'act.medSnails':'act.med'));},
  test(S,tk){if(tk.level<0.05)return er(tt('act.noWater'));if(S.inv.test<1)return er(tt('act.noTest'));S.inv.test--;if(S.flags)S.flags.tested=1;
    tk.test={pH:tk.pH,GH:tk.GH,KH:tk.KH,NH3:tk.NH3,NO2:tk.NO2,NO3:tk.NO3,t:S.t};return ok(tt('act.test'));},
  temp(S,tk,d){if(!tk.gear.heater&&!tk.gear.fan)return er(tt('act.needTemp'));tk.eq.set=clamp(tk.eq.set+d,18,30);return ok('');},
  photo(S,tk,d){if(!tk.eq.light)return er(tt('act.noLight'));tk.eq.photo=clamp(tk.eq.photo+d,4,12);return ok('');},
  buyEq(S,tk,slot,type){
    let item,old=null;
    if(slot==='filter'){item=FILTERS[type];if(tk.eq.filter===type)return er(tt('act.filterOn'));old=tk.eq.filter&&FILTERS[tk.eq.filter];}
    else if(slot==='light'){item=LIGHTS[type];if(tk.eq.light===type)return er(tt('act.lightOn'));old=tk.eq.light&&LIGHTS[tk.eq.light];}
    else{item=GEAR[slot];if(tk.gear[slot])return er(tt('act.gearOn'));}
    const refund=old?r2(old.price*0.5):0,cost=r2(item.price-refund);
    if(!spend(S,cost))return er(tt('act.noMoney'));if(cost<0){S.money=r2(S.money-cost);S.stats.earned-=cost;}
    if(slot==='filter'){const had=!!tk.eq.filter;tk.eq.filter=type;tk.flow=1;if(had){tk.A*=0.45;tk.N*=0.45;}}
    else if(slot==='light')tk.eq.light=type;else tk.gear[slot]=true;
    return ok(tt('act.fitted',{item:item.n,tank:tk.name})+(refund?tt('act.oldSold',{money:eur(refund)}):''));},
  sellEq(S,tk,slot){let item;
    if(slot==='filter')item=tk.eq.filter&&FILTERS[tk.eq.filter];else if(slot==='light')item=tk.eq.light&&LIGHTS[tk.eq.light];else item=tk.gear[slot]&&GEAR[slot];
    if(!item)return er(tt('act.notFitted'));
    if(slot==='filter')tk.eq.filter=null;else if(slot==='light')tk.eq.light=null;else delete tk.gear[slot];
    const v=r2(item.price*0.5);S.money=r2(S.money+v);S.stats.earned+=v;
    return ok(tt('act.eqSold',{item:item.n,money:eur(v)})+(slot==='filter'&&tk.shrimp.length?tt('act.noFilterWarn'):''));},
  buyPlant(S,tk,k){const P=PLANTS[k];if(tk.plants[k]>P.cap*tk.vol/20*0.85)return er(tt('act.plantFull'));
    if(!spend(S,P.price))return er(tt('act.noMoney'));tk.plants[k]+=1;if(tk.plan===0&&R()<0.07)tk.plan=0.5;return ok(tt('act.added',{item:P.n}));},
  // Taban: yalnızca karidessiz tanka serilir; su varsa boşaltılır (bakteriler yarıya iner).
  buySub(S,tk,k){const B=SUBS[k];if(!B)return er('');if(tk.shrimp.length)return er(tt('act.subEmpty'));if(tk.sub===k&&(tk.subLeft>0.5||!B.life))return er(tt('act.subHas'));
    const c=r2(B.price*tk.vol/20);if(!spend(S,c))return er(tt('act.noMoney'));const drained=tk.level>0.05;
    if(drained){tk.level=0;tk.A=Math.max(0.01,tk.A*0.5);tk.N=Math.max(0.01,tk.N*0.5);tk.cyc=false;tk.NH3=tk.NO2=0;}
    tk.sub=k;tk.subAge=0;tk.subLeft=1;if(S.flags)S.flags.sub=1;return ok(tt(drained?'act.subDrained':'act.subDone',{item:B.n,tank:tk.name}));},
  buySoil(S,tk){return A.buySub(S,tk,'soil');},
  buyDecor(S,tk,k){const D=DECOR[k];if(!D)return er('');if(tk.decor&&tk.decor[k])return er(tt('act.decHas'));if(!spend(S,D.price))return er(tt('act.noMoney'));
    tk.decor=tk.decor||{};tk.decor[k]=true;return ok(tt('act.added',{item:D.n}));},
  setBg(S,tk,k){const B=BGS[k];if(!B)return er('');if(tk.bg===k)return er(tt('act.bgHas'));if(B.price&&!(S.bgs&&S.bgs[k])){if(!spend(S,B.price))return er(tt('act.noMoney'));S.bgs=S.bgs||{};S.bgs[k]=1;}
    tk.bg=k;return ok(tt('act.bgSet',{item:B.n}));},
  buySnail(S,tk,k){if(tk.level<0.05)return er(tt('act.noWater'));if(k==='ram'){if(!spend(S,4))return er(tt('act.noMoney'));tk.snails.ram+=3;return ok(tt('act.ram'));}
    if(!spend(S,4))return er(tt('act.noMoney'));tk.snails.ner+=1;return ok(tt('act.ner'));},
  buyCons(S,k){const c=CONS[k];if(!spend(S,c.price))return er(tt('act.noMoney'));S.inv[k]+=c.qty;return ok(tt('act.bought',{item:c.n,n:c.qty,unit:c.u}));},
  buyTank(S,vol){const mx=maxTanks(S);if(S.tanks.length>=mx)return er(mx>=8?tt('act.noRoom'):tt('act.tankLimit',{n:mx}));if(!spend(S,TANKS[vol].price))return er(tt('act.noMoney'));
    const t=newTank(S,vol);S.tanks.push(t);return ok(tt('act.tankBuilt',{vol,tank:t.name}));},
  sellTank(S,i){if(S.tanks.length<2)return er(tt('act.lastTank'));const tk=S.tanks[i];if(tk.shrimp.length)return er(tt('act.tankNotEmpty'));
    let v=TANKS[tk.vol].price;if(tk.eq.filter)v+=FILTERS[tk.eq.filter].price;if(tk.eq.light)v+=LIGHTS[tk.eq.light].price;for(const g in tk.gear)if(tk.gear[g])v+=GEAR[g].price;
    v=r2(v*0.5);S.money=r2(S.money+v);S.stats.earned+=v;S.tanks.splice(i,1);S.tanks.forEach((t,j)=>t.name='Tank '+(j+1));S.cur=Math.min(S.cur,S.tanks.length-1);
    const r=ok(tt('act.tankSold',{money:eur(v)}));r.undo={tank:tk,i,v};return r;},
  unsellTank(S,u){if(!u||!u.tank||S.money+1e-9<u.v)return er(tt('act.undoFail'));S.money=r2(S.money-u.v);S.stats.earned-=u.v;
    S.tanks.splice(Math.min(u.i,S.tanks.length),0,u.tank);S.tanks.forEach((t,j)=>t.name='Tank '+(j+1));return ok(tt('act.tankBack'));},
  buyUp(S,k){const u=UPG[k];if(!u)return er('');if(S.up[k])return er(tt('act.upOwned'));
    if(!spend(S,u.price))return er(tt('act.noMoney'));S.up[k]=1;return ok(tt('act.upBuilt',{item:u.n}));},
  rescue(S,tk){if(!S.flags||S.flags.rescue!==1)return er('');S.flags.rescue=2;
    for(const sex of['F','M']){const s=mk(S,{sex,c:['W',pick(['R','Y','B','K','W'])],p:['S',R()<0.2?'r':'S'],grade:0.25+R()*0.05,age:55+R()*10,gen:0,bought:true});tk.shrimp.push(s);discover(S,keyOf(s),false);}
    S.inv.food=Math.max(S.inv.food,5);return ok(tt('act.rescue',{tank:tk.name}));},
  buyRO(S){if(S.ro)return er(tt('act.roOwned'));if(!spend(S,110))return er(tt('act.noMoney'));S.ro=true;S.src='ro';return ok(tt('act.ro'));},
  buyShrimp(S,tk,oi,qty){if(tk.level<0.05)return er(tt('act.noWater'));const o=OFFERS[oi],c=r2(offerPrice(o)*qty);if(!spend(S,c))return er(tt('act.noMoney'));if(S.flags)S.flags.bought=1;
    const L=LETTER[o.k];
    for(let i=0;i<qty;i++){
      const c2=o.k==='yabani'?['W',R()<0.5?pick(['R','Y','B','K']):'W']:[L,L];
      const p=o.r?['r','r']:['S',R()<(o.k==='yabani'?0.2:0.25)?'r':'S'];
      const s=mk(S,{c:c2,p,grade:clamp(o.g+gauss()*0.05,0,1),age:50+R()*40,gen:0,bought:true});
      s.health=Math.max(5,90-Math.abs(tk.T-23)*1.5-Math.abs(tds(tk)-220)/220*25);
      tk.shrimp.push(s);discover(S,keyOf(s),false);}
    // İlk alımdan sonra komşudan kolay bir ilk sipariş gelir; mağaza karidesi de sayılır.
    if(S.flags&&!S.flags.firstOrder&&o.k!=='yabani'){S.flags.firstOrder=1;
      S.orders.push(liveWho({id:S.nid++,m:o.k,rili:!!o.r,minG:0,qty:1,pay:Math.round(offerPrice(o)*1.6),until:S.t+24*30,wk:'who.ayse',first:true}));}
    return ok(tt('act.shrimpBought',{n:qty,kind:keyName(o.k+(o.r?'_r':'')),tank:tk.name}));},
  sell(S,tk,ids){let sum=0,n=0;const set=new Set(ids),gone=[],dem=Object.assign({},S.demand);
    for(let i=tk.shrimp.length-1;i>=0;i--){const s=tk.shrimp[i];if(!set.has(s.id))continue;const p=price(S,s);if(p<=0)continue;
      sum+=p;n++;tk.shrimp.splice(i,1);gone.push([i,s]);const m=morphOf(s);S.demand[m]=Math.max(0.4,S.demand[m]*0.985);}
    if(!n)return er(tt('act.noneSellable'));sum=r2(sum);S.money=r2(S.money+sum);S.stats.sold+=n;S.stats.earned+=sum;
    const r=ok(tt('act.sold',{n,money:eur(sum)}));r.n=n;r.sum=sum;r.undo={tk:tk.id,gone,sum,n,dem};return r;},
  unsell(S,u){const tk=u&&S.tanks.find(t=>t.id===u.tk);if(!tk||S.money+1e-9<u.sum)return er(tt('act.undoFail'));
    for(const[i,s]of u.gone.slice().reverse())tk.shrimp.splice(Math.min(i,tk.shrimp.length),0,s);
    S.money=r2(S.money-u.sum);S.stats.sold-=u.n;S.stats.earned-=u.sum;S.demand=u.dem;return ok(tt('act.unsold',{n:u.n}));},
  move(S,from,to,ids){if(from===to)return er('');const set=new Set(ids);let n=0;const dT=Math.abs(from.T-to.T),dD=Math.abs(tds(from)-tds(to))/Math.max(80,tds(to));
    for(let i=from.shrimp.length-1;i>=0;i--){const s=from.shrimp[i];if(!set.has(s.id))continue;from.shrimp.splice(i,1);s.health=Math.max(3,s.health-(dT*1.2+dD*20));to.shrimp.push(s);n++;}
    return ok(tt('act.moved',{n,tank:to.name})+((dT>2||dD>0.25)?tt('act.movedStress',{n}):''));},
  dna(S,s){if(s.dna)return er('');if(!spend(S,2))return er(tt('act.noMoney'));s.dna=true;return ok(tt('act.dna'));},
  fulfill(S,oid){const o=S.orders.find(x=>x.id===oid);if(!o)return er('');
    const c=[];let nb=0;for(const tk of S.tanks)for(const s of tk.shrimp)if(orderMatch(o,s))c.push([tk,s]);else if(s.bought&&orderMatch(o,s,1))nb++;
    if(c.length<o.qty)return er(tt('act.orderShort',{have:c.length,need:o.qty})+(nb?tt('act.orderBought',{n:nb}):''));
    c.sort((a,b)=>(a[1].ber-b[1].ber)||(a[1].grade-b[1].grade));
    for(const[tk,s]of c.slice(0,o.qty)){const i=tk.shrimp.indexOf(s);if(i>=0)tk.shrimp.splice(i,1);}
    S.money=r2(S.money+o.pay);S.stats.earned+=o.pay;S.stats.sold+=o.qty;S.stats.orders=(S.stats.orders||0)+1;S.orders=S.orders.filter(x=>x!==o);
    return ok(tt('act.delivered',{money:eur(o.pay)}));}
};
// any=1: mağaza karideslerini de say (yalnızca açıklama için)
const orderMatch=(o,s,any)=>(any||o.first||!s.bought)&&morphOf(s)===o.m&&isRili(s)===!!o.rili&&s.grade>=o.minG&&s.age>=ADULT&&s.health>=50;
const canRescue=S=>!!(S.flags&&S.flags.rescue===1);

return{MORPH,COMBO,RECIPE,logText,whoName,causeName,stageName,FILTERS,LIGHTS,GEAR,PLANTS,CONS,TANKS,OFFERS,UPG,PARENTS,MS,ADULT,BABY,
  newGame,migrate,stepHour,roomTemp,morphOf,isRili,keyOf,keyName,gradeName,stage,sizeOf,price,offerPrice,tds,cycled,orderMatch,act:A,eur,num,suf,
  plantFrac,SUBS,DECOR,BGS,subPrice:(tk,k)=>r2(SUBS[k].price*tk.vol/20),recFood,bioCap:bioCapOf,filterCap,stressAlert,maxTanks,checkMs,canRescue,nShrimp};
})();
