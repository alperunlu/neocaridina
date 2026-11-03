// Ekran görüntüsü kaydı: renkli, kalabalık, bitkili bir ana tank + ikinci tank, siparişler, koleksiyon.
const fs=require('fs');global.localStorage={getItem:()=>null,setItem(){}};global.navigator={language:'en'};global.document={documentElement:{}};
const root='/home/user/neocaridina/web/src/';
const i18n=fs.readFileSync(root+'i18n.js','utf8')+fs.readdirSync(root+'i18n').map(f=>fs.readFileSync(root+'i18n/'+f,'utf8')).join('\n');
let x=11;const M=Object.create(Math);M.random=()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648};
const SIM=new Function('Math',i18n+'\n'+fs.readFileSync(root+'sim.js','utf8')+';return SIM')(M);
const s=SIM.newGame();s.money=50000;s.inv.food=500;s.inv.test=50;s.inv.bact=5;s.inv.leaf=20;
const A=SIM.act;const t1=s.tanks[0];A.buySub(s,t1,'soil');A.top(s,t1,'tap');A.buyDecor(s,t1,'spider');A.buyDecor(s,t1,'tubes');A.setBg(s,t1,'green');t1.gear.heater=true;A.buyEq(s,t1,'light','plant');A.buyEq(s,t1,'filter','hob');t1.eq.photo=12;
A.bact(s,t1);for(let d=0;d<12;d++){A.feed(s,t1,'food');for(let h=0;h<24;h++)SIM.stepHour(s);}
for(const k of ['moss','anub','horn','frog'])for(let i=0;i<4;i++)A.buyPlant(s,t1,k);
A.buyTank(s,35);const t2=s.tanks[1];A.buySub(s,t2,'gravel');A.top(s,t2,'tap');A.buyEq(s,t2,'filter','sponge');t2.gear.air=true;t2.gear.heater=true;A.buyEq(s,t2,'light','basic');t2.A=0.4;t2.N=1.1;t2.cyc=true;
for(const [i,o] of SIM.OFFERS.entries())if(o.k!=='yabani')A.buyShrimp(s,t1,i,4);
A.buySnail(s,t1,'ner');A.buySnail(s,t1,'ner');
for(let d=0;d<75;d++){for(const t of s.tanks){let n=SIM.recFood(t);while(n-->0)A.feed(s,t,'food');if(d%5===0)A.wc(s,t,0.3,'tap');if(d%8===0)A.rinse(s,t);if(t.level<0.92)A.top(s,t,'tap');if(d%6===0)A.test(s,t);if(d%14===0)A.trim(s,t);}
  for(let h=0;h<24;h++)SIM.stepHour(s);}
A.test(s,t1);A.test(s,t2);s.flags.begun=1;s.speed=1;s.msq=[];s.log=s.log.slice(0,6);
s.t=Math.floor(s.t/24)*24+11;// gündüz 11:00
fs.writeFileSync(__dirname+'/save-day.json',JSON.stringify(s));
const n=JSON.parse(JSON.stringify(s));n.t=Math.floor(s.t/24)*24+19.6;fs.writeFileSync(__dirname+'/save-night.json',JSON.stringify(n));
console.log('tanks',s.tanks.map(t=>t.shrimp.length),'found',Object.keys(s.found).length,'orders',s.orders.length,'ms',Object.keys(s.ms).length,'day',Math.floor(s.t/24),'colors',[...new Set(t1.shrimp.map(SIM.morphOf))].join(','));
