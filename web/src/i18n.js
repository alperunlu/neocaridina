/* ============ I18N (TR / EN / NL) ============
   Sözlükler web/src/i18n/*.js içinde I18N.add({tr:{...},en:{...},nl:{...}}) ile eklenir.
   t('anahtar', {n:3, tank:'Tank 1'}) → metin.
   - {ad} parametreyi yazar; {ad:hal} Türkçede ek ekler (dat, acc, loc, abl, gen), diğer dillerde aynen yazar.
   - n===1 ise önce 'anahtar_one' aranır (İngilizce/Hollandaca tekil).
   - Eksik anahtar: önce İngilizce, sonra Türkçe, en son anahtarın kendisi. */
const I18N=(function(){
  const LANGS=['tr','en','nl'],LOCALE={tr:'tr-TR',en:'en-IE',nl:'nl-NL'},NAMES={tr:'Türkçe',en:'English',nl:'Nederlands'};
  const D={tr:{},en:{},nl:{}},KEY='neokarides_lang';
  const pick=l=>{l=String(l||'').toLowerCase().slice(0,2);return LANGS.includes(l)?l:null;};
  let lang=null;
  try{lang=pick(localStorage.getItem(KEY));}catch(e){}
  if(!lang){const ls=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]);for(const l of ls){lang=pick(l);if(lang)break;}}
  if(!lang)lang='en';
  // Türkçe hal eki: ünlü uyumu, kaynaştırma ve sertleşme. Sayılar okunuşlarına göre ek alır (Tank 2'ye, 3'ü, 40'ta).
  const NUMW=['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'],TENW=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];
  function spoken(w){const m=/(\d+)$/.exec(w);if(!m)return w;const d=m[1];
    if(/000$/.test(d))return 'bin';if(/00$/.test(d))return 'yüz';const u=+d.slice(-1),te=d.length>1?+d.slice(-2,-1):0;return u?NUMW[u]:(te?TENW[te]:'sıfır');}
  function trSuf(w,c){w=String(w);if(!c)return w;
    const sp=spoken(w).toLocaleLowerCase('tr'),vs=sp.match(/[aeıioöuü]/g),v=vs?vs[vs.length-1]:'e';
    const back='aıou'.includes(v),round='oöuü'.includes(v),i4=back?(round?'u':'ı'):(round?'ü':'i'),a2=back?'a':'e';
    const ve=/[aeıioöuü]$/.test(sp),hard=/[çfhkpsşt]$/.test(sp),sep=/\d$/.test(w)||/^[A-ZÇĞİÖŞÜ]/.test(w)?"'":'';
    switch(c){
      case 'dat':return w+sep+(ve?'y':'')+a2;
      case 'acc':return w+sep+(ve?'y':'')+i4;
      case 'gen':return w+sep+(ve?'n':'')+i4+'n';
      case 'loc':return w+sep+(hard?'t':'d')+a2;
      case 'abl':return w+sep+(hard?'t':'d')+a2+'n';
      default:return w;}
  }
  function fmtParam(v,c){if(v==null)return '';if(c&&lang==='tr')return trSuf(v,c);return String(v);}
  function lookup(k,n){
    for(const l of [lang,'en','tr']){const d=D[l];if(!d)continue;
      if(n===1&&d[k+'_one']!=null)return d[k+'_one'];if(d[k]!=null)return d[k];}
    return null;
  }
  function t(k,p){
    const n=p&&typeof p.n==='number'?p.n:undefined;let s=lookup(k,n);
    if(s==null){if(I18N.debug)console.warn('i18n eksik:',k);return k;}
    if(typeof s==='function')return s(p||{});
    return p?s.replace(/\{(\w+)(?::(\w+))?\}/g,(m,a,c)=>a in p?fmtParam(p[a],c):m):s;
  }
  function add(dict){for(const l in dict){if(!D[l])D[l]={};Object.assign(D[l],dict[l]);}}
  function setLang(l){l=pick(l);if(!l)return lang;lang=l;try{localStorage.setItem(KEY,l);}catch(e){}
    document.documentElement.lang=l;return lang;}
  // Statik HTML: data-i18n="anahtar" (metin), data-i18n-aria="anahtar" (aria-label), data-i18n-title="anahtar"
  function apply(root){root=root||document;
    root.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n);});
    root.querySelectorAll('[data-i18n-html]').forEach(e=>{e.innerHTML=t(e.dataset.i18nHtml);});
    root.querySelectorAll('[data-i18n-aria]').forEach(e=>{e.setAttribute('aria-label',t(e.dataset.i18nAria));});
    root.querySelectorAll('[data-i18n-title]').forEach(e=>{e.setAttribute('title',t(e.dataset.i18nTitle));});}
  try{document.documentElement.lang=lang;}catch(e){}
  return {t,add,apply,setLang,trSuf,LANGS,NAMES,
    get lang(){return lang;},get locale(){return LOCALE[lang];},dict:D,debug:false};
})();
const t=I18N.t;
