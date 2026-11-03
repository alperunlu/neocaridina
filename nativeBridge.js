// WebView'e sayfa yüklenmeden önce enjekte edilen depolama köprüsü.
//
// Oyun HTML'i adressiz (about:blank) yüklendiği için iOS WKWebView'de
// localStorage hiç çalışmayabilir (erişim SecurityError fırlatır) ya da
// sayfayla birlikte silinebilir. Bu yüzden oyunun gördüğü localStorage'ı
// tamamen bizim nesnemizle değiştiriyoruz: veriler bellekte tutulur, her
// yazma native tarafa mesajla iletilir ve AsyncStorage'a kaydedilir.
// Açılışta AsyncStorage'daki tüm 'neokarides' anahtarları buraya geri verilir.

export const SAVE_KEY = 'neokarides_v1';
export const KEY_PREFIX = 'neokarides';

export function storageBridge(data, backup) {
  return `
(function(){
  var KEY=${JSON.stringify(SAVE_KEY)};
  var data=${JSON.stringify(data || {})};
  window.__ncBackup=${JSON.stringify(backup == null ? null : backup)};
  function post(o){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
  var has=function(k){return Object.prototype.hasOwnProperty.call(data,k)};
  var store={
    getItem:function(k){k=String(k);return has(k)?data[k]:null},
    setItem:function(k,v){k=String(k);v=String(v);data[k]=v;post(k===KEY?{t:'set',v:v}:{t:'kv',k:k,v:v})},
    removeItem:function(k){k=String(k);if(!has(k))return;delete data[k];post(k===KEY?{t:'rm'}:{t:'kvrm',k:k})},
    clear:function(){for(var k in data)this.removeItem(k)},
    key:function(i){return Object.keys(data)[i]||null},
    get length(){return Object.keys(data).length}
  };
  window.__ncStore=store;
  var ok=false;
  try{Object.defineProperty(window,'localStorage',{value:store,configurable:true,enumerable:true});ok=window.localStorage===store}catch(e){}
  if(!ok){
    // Olmazsa en azından gerçek localStorage'ın yöntemlerini yönlendir.
    try{var P=Storage.prototype;['getItem','setItem','removeItem','clear','key'].forEach(function(m){var f=store[m];P[m]=function(){return f.apply(store,arguments)}})}catch(e){}
  }
})();
true;
`;
}
