/* ================= açılış menüsü ================= */
// Uygulama doğrudan oyuna atlamaz: önce menü (Oyunu yükle, Yeni oyun, Nasıl oynanır, Ayarlar).
// Menü açıkken simülasyon durur, sahne arkada yavaşça döner.
let titleOn=false,howPage=0;
const HOW=[['bact','cycle'],['test','water'],['food','feed'],['egg','breed'],['basket','sell'],['look','controls']];
const hasSave=()=>!saveBroken&&!!(S&&S.flags&&S.flags.begun);
function titleSave(){const b=document.querySelector('#title [data-t="load"]');const ok=hasSave();b.disabled=!ok;b.classList.toggle('go',ok);document.querySelector('#title [data-t="new"]').classList.toggle('go',!ok);
  $('tSave').textContent=ok?t('title.saveInfo',{day:t('hud.day',{n:dayOf(S.t)}),money:fmt.money(S.money),n:S.tanks.reduce((a,tk)=>a+tk.shrimp.length,0)}):t('title.noSave');}
function titlePanel(id){for(const p of['tMain','tConfirm','tHow'])$(p).hidden=p!==id;
  const f=$(id).querySelector('.tBtn:not(:disabled),.tBack');if(f)try{f.focus({preventScroll:true});}catch(e){}}
function renderHow(){const [i,k]=HOW[howPage];
  $('tHowBody').innerHTML=`<h3>${ic(i)}${esc(t('how.'+k+'.t'))}</h3><ul>${t('how.'+k+'.b').split('\n').map(l=>`<li>${l}</li>`).join('')}</ul>`;
  $('tPage').textContent=`${howPage+1}/${HOW.length}`;
  document.querySelector('#title [data-t="prev"]').disabled=howPage===0;
  $('tNextL').textContent=t(howPage===HOW.length-1?'title.done':'title.next');$('tHowBody').scrollTop=0;}
function showTitle(){save();titleOn=true;closePop&&closePop();selId=null;if(typeof renderSel==='function')renderSel();
  I18N.apply($('title'));titleSave();$('tFoot').textContent=t('title.foot',{v:'1.0.0'});
  document.body.classList.add('titleOn');const el=$('title');el.classList.remove('out');el.hidden=false;titlePanel('tMain');}
function hideTitle(then){const el=$('title');el.classList.add('out');titleOn=false;document.body.classList.remove('titleOn');
  setTimeout(()=>{el.hidden=true;el.classList.remove('out');if(then)then();},280);
  hudCache='';renderHUD();renderDock&&renderDock();layoutSoon();}
function titleNew(){resetGame();speed=0;hideTitle(()=>openModal('help'));}
$('title').querySelector('.tMark').innerHTML=LOGO;
$('title').querySelector('.tBack').innerHTML=ic('left');
$('title').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b||b.disabled)return;sfx.tap();
  switch(b.dataset.t){
    case 'load':hideTitle();break;
    case 'new':if(hasSave())titlePanel('tConfirm');else titleNew();break;
    case 'newOk':titleNew();break;
    case 'how':howPage=0;renderHow();titlePanel('tHow');break;
    case 'prev':if(howPage>0){howPage--;renderHow();}break;
    case 'next':if(howPage<HOW.length-1){howPage++;renderHow();}else titlePanel('tMain');break;
    case 'opts':openModal('settings');break;
    case 'back':titlePanel('tMain');break;}});
// Dil değişince menü metinleri de yenilensin.
if(typeof relocalize==='function'){const rl=relocalize;relocalize=function(){rl.apply(this,arguments);if(titleOn){I18N.apply($('title'));titleSave();$('tFoot').textContent=t('title.foot',{v:'1.0.0'});if(!$('tHow').hidden)renderHow();}};window.relocalize=relocalize;}
