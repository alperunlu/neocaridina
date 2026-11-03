/* ================= toasts ================= */
// toast(msg, kind, {action:[label, fn], ms}) — en fazla 2 görünür, dokununca kapanır.
function toast(msg,kind,opt){if(!msg)return null;
  if(kind==='ms'){if(drainMs())return null;kind='good';}
  const el=document.createElement('div');el.className='toast '+(kind||'');el.setAttribute('role',kind==='bad'?'alert':'status');el.style.pointerEvents='auto';
  el.innerHTML=ic(kind==='bad'?'heart':kind==='warn'?'help':kind==='good'?'star':kind==='joy'?'egg':'shrimp',kind==='good'?'fill:#f6c552;stroke:#b27d0e':'')+`<span>${esc(msg)}</span>`+
    (opt&&opt.action?`<button type="button" class="btn sm amber" data-undo="1" style="margin-left:4px">${esc(opt.action[0])}</button>`:'');
  const box=$('toasts');box.appendChild(el);
  while(box.children.length>2){const o=[...box.children].find(x=>x!==el&&!x.querySelector('[data-undo]'))||box.firstChild;o.remove();}
  let tm=0;const kill=()=>{clearTimeout(tm);el.remove();};tm=setTimeout(kill,(opt&&opt.ms)||(kind==='bad'?5200:3400));
  el.addEventListener('click',e=>{if(opt&&opt.action&&e.target.closest('[data-undo]'))opt.action[1]();kill();});
  return el;}
function res(r,good){if(!r)return;if(r.ok){if(r.msg)toast(r.msg,good?'good':'');if(good)sfx.coin();else if(r.msg)sfx.plop();}else if(r.msg){toast(r.msg,'bad');sfx.bad();}}
function afterAct(){SIM.checkMs(S);renderHUD();if(ui.modal)renderModal(true);renderSel();save();drainMs();}
// Tamamlanan hedefleri kutla (celebrate/hap başka parçalarda; yoksa toast)
function drainMs(){if(!S.msq||!S.msq.length)return false;const q=S.msq.splice(0);
  for(const id of q){const m=SIM.MS.find(x=>x.id===id);if(!m)continue;
    if(typeof celebrate==='function')celebrate(m.n,t('toast.goalReward',{r:fmt.money(m.r)}));else toast(t('toast.goalDone',{name:m.n,r:fmt.money(m.r)}),'good');
    if(typeof moneyFloat==='function')moneyFloat(m.r);}
  if(typeof hap==='function')hap('good');(sfx.discover||sfx.coin)();return true;}
// Satış + 4 sn "Geri al". Seçili karides kartı da bunu çağırır.
function sellShrimp(ids,tk){tk=tk||T();const r=SIM.act.sell(S,tk,ids);
  if(!r.ok){res(r);return r;}
  (sfx.sale||sfx.coin)();if(typeof moneyFloat==='function')moneyFloat(r.sum);
  const u=r.undo;toast(t('toast.sold',{n:r.n,sum:fmt.money(r.sum)}),'good',{action:[t('ui.undo'),()=>{const b=SIM.act.unsell(S,u);res(b);afterAct();}],ms:4000});
  ids.forEach(id=>ui.sel.delete(id));afterAct();return r;}
function sellTankUndo(){const r=SIM.act.sellTank(S,S.cur);if(!r.ok){res(r);return;}
  sfx.coin();const u=r.undo;
  toast(r.msg,'good',{action:[t('ui.undo'),()=>{const b=SIM.act.unsellTank(S,u);res(b);if(b.ok){S.cur=u.i;if(typeof switchTank==='function')switchTank(0);}afterAct();}],ms:4000});
  if(typeof switchTank==='function')switchTank(0);}
function confirmAsk(msg,btns){ui.confirm={id:Date.now(),msg,btns};renderModal(true);}
function buyShrimpSafe(tk,i){const q=ui.qty[i]||5,A=SIM.act;
  if(SIM.cycled(tk)){res(A.buyShrimp(S,tk,i,q));return;}
  const need=S.inv.bact<1;
  confirmAsk(t('shop.uncycledAsk',{tank:esc(tk.name)})+(need?' '+t('shop.bactCost',{price:fmt.money(SIM.CONS.bact.price)}):''),
    [[t(need?'shop.bactBuyAdd':'shop.bactAdd'),'bact','amber',()=>{if(S.inv.bact<1){const b=A.buyCons(S,'bact');if(!b.ok){res(b);return;}}const r1=A.bact(S,tk);if(!r1.ok){res(r1);return;}const r=A.buyShrimp(S,tk,i,q);if(r.ok)r.msg=t('toast.bactAdded')+' '+r.msg;res(r);}],
     [t('shop.buyAnyway'),'anyway','ghost',()=>res(A.buyShrimp(S,tk,i,q))],[t('ui.cancel'),'no','ghost',()=>{}]]);}

/* ================= modal actions ================= */
$('mBody').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const d=b.dataset,tk=T(),A=SIM.act;
  switch(d.a){
    case 'cf':{const c=ui.confirm;ui.confirm=null;if(c&&c.btns[+d.k])c.btns[+d.k][3]();break;}
    case 'wc':res(A.wc(S,tk,+d.f,S.src));break;
    case 'top':res(A.top(S,tk,S.src));break;
    case 'src':S.src=d.v;break;
    case 'temp':res(A.temp(S,tk,+d.d));break;
    case 'photo':res(A.photo(S,tk,+d.d));break;
    case 'sellEq':{const slot=d.slot;if(slot==='filter'&&tk.shrimp.length){confirmAsk(t('tank.sellFilterAsk'),[[t('ui.sell'),'y','red',()=>res(A.sellEq(S,tk,slot),true)],[t('ui.cancel'),'n','ghost',()=>{}]]);return;}
      res(A.sellEq(S,tk,slot),true);break;}
    case 'sellTank':{if(tk.shrimp.length){res(A.sellTank(S,S.cur));break;}
      confirmAsk(t('tank.sellTankAsk',{tank:esc(tk.name)}),[[t('ui.sell'),'y','red',sellTankUndo],[t('ui.cancel'),'n','ghost',()=>{}]]);return;}
    case 'goShop':ui.sub.shop='shrimp';ui.modal=null;openModal('shop');return;
    case 'grp':ui.group=d.k;ui.flt='all';ui.sel.clear();renderModal(false);return;
    case 'back':ui.group=null;ui.sel.clear();renderModal(false);return;
    case 'flt':ui.flt=d.v;break;
    case 'tog':{const id=+d.id;const s=tk.shrimp.find(x=>x.id===id);if(!s||SIM.stage(s)==='baby')return;ui.sel.has(id)?ui.sel.delete(id):ui.sel.add(id);sfx.tap();break;}
    case 'selNone':ui.sel.clear();break;
    case 'selLow':{const l=tk.shrimp.filter(s=>SIM.keyOf(s)===ui.group&&SIM.stage(s)!=='baby'&&!s.ber).sort((a,b)=>a.grade-b.grade);ui.sel=new Set(l.slice(0,Math.floor(l.length/2)).map(s=>s.id));break;}
    case 'sell':sellShrimp([...ui.sel],tk);ui.sel.clear();return;
    case 'move':res(A.move(S,tk,S.tanks[+d.to],[...ui.sel]));ui.sel.clear();break;
    case 'dna':{const s=tk.shrimp.find(x=>x.id===+d.id);if(s)res(A.dna(S,s));break;}
    case 'sub':ui.sub.shop=d.v;renderModal(false);return;
    case 'bsub':ui.sub.book=d.v;renderModal(false);return;
    case 'qty':ui.qty[d.i]=clamp((ui.qty[d.i]||5)+(+d.d),1,20);break;
    case 'buyS':buyShrimpSafe(tk,+d.i);if(ui.confirm)return;break;
    case 'rescue':res(A.rescue(S,tk),true);break;
    case 'buyEq':res(A.buyEq(S,tk,d.slot,d.type));break;
    case 'buyRO':res(A.buyRO(S));break;
    case 'buyU':res(A.buyUp(S,d.k),true);break;
    case 'buyP':res(A.buyPlant(S,tk,d.k));break;
    case 'buySub':res(A.buySub(S,tk,d.k));if(typeof builtFor!=='undefined')builtFor=-1;break;
    case 'buyDec':res(A.buyDecor(S,tk,d.k));break;
    case 'setBg':res(A.setBg(S,tk,d.k));if(typeof builtFor!=='undefined')builtFor=-1;break;
    case 'fill':res(A.top(S,tk,d.src==='ro'?'ro':'tap'));if(typeof builtFor!=='undefined')builtFor=-1;break;
    case 'goSetup':ui.sub.shop='setup';ui.modal=null;openModal('shop');return;
    case 'goEq':ui.sub.shop='eq';ui.modal=null;openModal('shop');ui.sub.shop='eq';renderModal(false);return;
    case 'buySn':res(A.buySnail(S,tk,d.k));break;
    case 'buyC':res(A.buyCons(S,d.k));break;
    case 'buyT':{const r=A.buyTank(S,+d.v);res(r);if(r.ok)switchTank(S.tanks.length-1-S.cur);break;}
    case 'ful':res(A.fulfill(S,+d.id),true);break;
    case 'ord':ui.ord=+d.id;renderModal(false);return;
    case 'sound':soundOn=!soundOn;S.sound=soundOn;break;
    case 'hapt':S.haptics=S.haptics===false;if(S.haptics&&typeof hap==='function')hap('soft');break;
    case 'help':ui.modal=null;openModal('help');return;
    case 'lang':if(d.v!==I18N.lang){I18N.setLang(d.v);if(typeof relocalize==='function'){try{relocalize();}catch(_){}}renderModal(true);}return;
    case 'start':closeModal();startGame();return;
    case 'reset':if(Date.now()-ui.resetArm<4000){resetGame();closeModal();if(typeof speed!=='undefined')speed=0;openModal('help');return;}else ui.resetArm=Date.now();break;
    case 'menu':closeModal();if(typeof showTitle==='function')showTitle();return;
  }
  afterAct();
});
// Ses kaydırıcıları: sürüklerken modal yeniden kurulmaz (imzada yoklar).
$('mBody').addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset||!el.dataset.vol)return;ui.touch=performance.now();
  if(typeof audioSet==='function'){try{audioSet(el.dataset.vol,(+el.value||0)/100)}catch(_){}}});
$('mBody').addEventListener('change',e=>{const el=e.target;if(el&&el.dataset&&el.dataset.vol){save();if(el.dataset.vol!=='mus'&&el.dataset.vol!=='amb')sfx.tap();}});
// Yeni oyun: kaydı sil, sahneyi ve seçimleri sıfırla (Ayarlar ve açılış menüsü kullanır).
function resetGame(){try{localStorage.removeItem(SAVE)}catch(_){}lastSaved=null;
  // Ses, titreşim gibi tercihler yeni oyuna taşınır.
  const keep={audio:S.audio,sound:S.sound,haptics:S.haptics};S=SIM.newGame();for(const k in keep)if(keep[k]!==undefined)S[k]=keep[k];if(typeof builtFor!=='undefined')builtFor=-1;if(typeof clearShrimp==='function')clearShrimp();if(typeof clearSnails==='function')clearSnails();
  ui.resetArm=0;lastLog=0;ui.group=null;ui.sel.clear();if(typeof speed!=='undefined')speed=S.speed||1;save();}
