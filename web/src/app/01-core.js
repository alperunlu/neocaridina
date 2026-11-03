'use strict';
// Statik HTML metinleri (data-i18n*) ilk çizimden önce seçili dile çevrilir; WebGL hata metni de dahil.
try{I18N.apply(document);}catch(e){}
if(!window.THREE){document.getElementById('err').style.display='grid';return;}
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const eur=SIM.eur;
// Yumuşak tireler (\u00AD) yalnızca görünür etiket içindir; aria/title için temizlenir.
const plain=s=>String(s).replace(/\u00AD/g,'');
// Sıcaklık: ondalık ayırıcı dile göre (SIM.num).
const degC=(v,d)=>SIM.num(v,d==null?1:d)+' °C';

/* ---------- native köprüsü ---------- */
const NATIVE=!!window.ReactNativeWebView;
function nativePost(m){try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}

/* ---------- kayıt ---------- */
const SAVE='neokarides_v1',SAVE_BAK=SAVE+'_bak',SAVE_BAD=SAVE+'_bad';
let saveBlocked=false,saveBroken=null,lastSaved=null,bakAt=0;
// Kaydı çözer, doğrular ve SIM.migrate ile günceller; geçersizse null döner.
function parseSave(j){try{let s=JSON.parse(j);if(!s||!(s.v===1||s.v===2))return null;
  if(typeof SIM.migrate==='function')s=SIM.migrate(s)||s;
  if(!(s&&s.tanks&&s.tanks.length))return null;
  if(s.rep==null)s.rep=0;if(s.stats&&s.stats.orders==null)s.stats.orders=0;return s;}catch(e){return null}}
function load(){let j=null;try{j=localStorage.getItem(SAVE);}catch(e){}
  if(!j)return null;const s=parseSave(j);if(s){lastSaved=j;return s;}
  // Okunamayan kaydın üzerine asla yazma: kenara al, kurtarma yolunu göster.
  saveBroken=j;saveBlocked=true;
  try{localStorage.setItem(SAVE_BAD,j);}catch(e){}nativePost({t:'bad',v:j});
  return null;}
function getBackup(){if(typeof window.__ncBackup==='string'&&window.__ncBackup)return window.__ncBackup;
  if(NATIVE)return null;try{return localStorage.getItem(SAVE_BAK);}catch(e){return null}}
function save(){if(saveBlocked)return false;let j;try{j=JSON.stringify(S);}catch(e){return false}
  if(j===lastSaved)return false;
  try{localStorage.setItem(SAVE,j);}catch(e){return false}
  // Tarayıcıda yedeği burada döndür (native tarafta App.js yapıyor).
  if(!NATIVE&&lastSaved){const n=Date.now();if(n-bakAt>=60000){bakAt=n;try{localStorage.setItem(SAVE_BAK,lastSaved);}catch(e){}}}
  lastSaved=j;return true;}
// WebView'i (native) ya da sayfayı (tarayıcı) yeniden yükler; kayıt köprüde güncel kalır.
function hardReload(){if(NATIVE)nativePost({t:'reload'});else location.reload();}

let S=load();const fresh=!S;if(!S)S=SIM.newGame();
if(!(S.cur>=0&&S.cur<S.tanks.length))S.cur=0;
let speed=[0,1,4,12].includes(S.speed)?S.speed:1,acc=0;
const T=()=>S.tanks[S.cur];
