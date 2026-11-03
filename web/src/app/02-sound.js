/* ---------- sound ----------
   Tamamen prosedürel ses: hiç dosya yok.
   master (kompresör) <- sfx | amb | mus (+ ortak reverb).
   API: beep(f,d,type,v,delay), sfx.*, audioGet/audioSet, audioTick(dt), audioPause/audioResume, hap(kind). */
let AC=null,soundOn=S.sound!==false;
const AUD_DEF={master:0.8,sfx:0.8,amb:0.45,mus:0.22};
(function(){const a=S.audio&&typeof S.audio==='object'?S.audio:null,o={};
  for(const k in AUD_DEF){const v=a&&+a[k];o[k]=a&&isFinite(v)?clamp(v,0,1):AUD_DEF[k];}
  if(!a&&S.sound===false)o.master=0;S.audio=o;})();
try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(e){}

let AUD=null,audioPaused=false,soundWas=soundOn;
const midi=n=>440*Math.pow(2,(n-69)/12);
function audioGet(k){if(!(k in AUD_DEF))return 0;if(k==='master'&&!soundOn)return 0;return S.audio[k];}
function audioSet(k,v){if(!(k in AUD_DEF))return;v=clamp(+v||0,0,1);S.audio[k]=v;
  if(k==='master'){soundOn=v>0;S.sound=soundOn;soundWas=soundOn;}applyGains();}
function masterLevel(){return soundOn?S.audio.master:0;}
function applyGains(){if(!AUD)return;const t=AC.currentTime,A=S.audio;
  AUD.master.gain.setTargetAtTime(masterLevel(),t,0.05);AUD.sfx.gain.setTargetAtTime(A.sfx*1.6,t,0.05);
  AUD.mus.gain.setTargetAtTime(A.mus,t,0.3);}

function makeImpulse(sec,decay){const n=Math.floor(AC.sampleRate*sec),b=AC.createBuffer(2,n,AC.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
// Kesintisiz döngü için sonu başa çapraz geçişli kahverengi gürültü.
function makeBrown(sec){const sr=AC.sampleRate,n=Math.floor(sr*sec),F=Math.floor(sr*0.5),raw=new Float32Array(n+F);let l=0;
  for(let i=0;i<n+F;i++){l=(l+0.02*(Math.random()*2-1))/1.02;raw[i]=l*3.5;}
  const b=AC.createBuffer(1,n,sr),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=raw[i];
  for(let i=0;i<F;i++){const x=i/F;d[i]=raw[i]*x+raw[n+i]*(1-x);}return b;}
function ensureAC(){if(AC)return AC;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  try{AC=new C();}catch(e){return null}
  try{const comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=0.005;comp.release.value=0.25;
    comp.connect(AC.destination);
    const G=v=>{const g=AC.createGain();g.gain.value=v;return g;};
    const master=G(masterLevel());master.connect(comp);
    const sfxB=G(S.audio.sfx*1.6),amb=G(0),mus=G(S.audio.mus),rev=AC.createConvolver(),revG=G(0.55);
    sfxB.connect(master);amb.connect(master);mus.connect(master);rev.buffer=makeImpulse(2.6,2.8);rev.connect(revG).connect(master);
    const send=G(0.25);sfxB.connect(send).connect(rev);const mSend=G(0.9);mus.connect(mSend).connect(rev);
    // Ortam: döngülü kahverengi gürültü -> yavaşça gezinen alçak geçiren (filtre uğultusu)
    const water=AC.createBufferSource();water.buffer=makeBrown(6);water.loop=true;
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;lp.Q.value=0.7;
    const lfo=AC.createOscillator(),lfoG=G(140);lfo.frequency.value=0.07;lfo.connect(lfoG).connect(lp.frequency);
    const waterG=G(0);water.connect(lp).connect(waterG).connect(amb);
    const hum=AC.createOscillator(),hum2=AC.createOscillator(),humG=G(0);hum.frequency.value=100;hum2.frequency.value=200.6;
    const h2=G(0.35);hum.connect(humG);hum2.connect(h2).connect(humG);humG.connect(amb);
    const bubF=AC.createBiquadFilter();bubF.type='bandpass';bubF.frequency.value=900;bubF.Q.value=1.2;const bubG=G(0);bubF.connect(bubG).connect(amb);
    water.start();lfo.start();hum.start();hum2.start();
    AUD={comp,master,sfx:sfxB,amb,mus,rev,waterG,humG,bubF,bubG,nextBub:0,nextPad:0,nextPluck:0,chord:0};
    AC.onstatechange=()=>{if(AC.state!=='running'&&!audioPaused&&!document.hidden)AC.resume().catch(()=>{});};
  }catch(e){AUD=null;}
  return AC;}
// iOS: AudioContext ancak bir dokunuşla açılır; kesintiden (arama, Siri) sonra da yeniden dokunuş gerekir.
function audioUnlock(){if(audioPaused)return;if(!ensureAC())return;if(AC.state!=='running')AC.resume().catch(()=>{});}
for(const ev of['touchend','pointerup','click','keydown'])addEventListener(ev,audioUnlock,{capture:true,passive:true});
function audioPause(){audioPaused=true;if(AC&&AC.state==='running')AC.suspend().catch(()=>{});}
function audioResume(){audioPaused=false;if(AC&&AC.state!=='running')AC.resume().catch(()=>{});}

function sfxDest(){return AUD?AUD.sfx:AC.destination;}
function beep(f,d,type,v,delay,dest){if(!soundOn||!AC||AC.state!=='running')return;try{const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v||0.05,t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g).connect(dest||sfxDest());o.start(t);o.stop(t+d+0.03);return o;}catch(e){}}
function sweep(f0,f1,d,type,v,delay){const o=beep(f0,d,type,v,delay);if(o)o.frequency.exponentialRampToValueAtTime(f1,AC.currentTime+(delay||0)+d*0.8);}
function noiseHit(d,freq,v,delay){if(!soundOn||!AC||AC.state!=='running')return;try{const t=AC.currentTime+(delay||0),n=Math.floor(AC.sampleRate*d);
  const b=AC.createBuffer(1,n,AC.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=freq;f.Q.value=2;g.gain.value=v;
  s.connect(f).connect(g).connect(sfxDest());s.start(t);}catch(e){}}

/* ---------- haptics (native köprü) ---------- */
let hapT=0;
function hap(kind){if(S.haptics===false)return;const n=performance.now();if(n-hapT<40)return;hapT=n;nativePost({t:'hap',k:kind||'tap'});}

const PENTA=[0,3,5,7,10];
const sfx={
  coin(){beep(988,0.08,'triangle',0.05);beep(1480,0.16,'triangle',0.05,0.07);hap('coin');},
  plop(){sweep(520,240,0.12,'sine',0.06);beep(260,0.1,'sine',0.035,0.05);hap('soft');},
  bad(){beep(311,0.16,'square',0.022);beep(233,0.28,'square',0.022,0.12);noiseHit(0.08,300,0.04);hap('bad');},
  tap(){noiseHit(0.025,2400,0.05);beep(760,0.035,'sine',0.02);hap('tap');},
  ui(){sfx.tap();},
  error(){sfx.bad();},
  sale(){[1047,1319,1568,2093].forEach((f,i)=>beep(f,0.18,'triangle',0.04,i*0.06));noiseHit(0.05,5000,0.03,0.02);noiseHit(0.05,6000,0.025,0.14);hap('coin');},
  birth(){[0,4,7,12].forEach((s,i)=>sweep(midi(72+s)*0.9,midi(72+s),0.22,'sine',0.035,i*0.09));hap('soft');},
  discover(){const r=67;[0,4,7,12,16].forEach((s,i)=>beep(midi(r+s),0.35,'triangle',0.04,i*0.09));
    [0,4,7].forEach(s=>{beep(midi(r+12+s),1.4,'sine',0.03,0.5);beep(midi(r+s)*1.003,1.4,'triangle',0.02,0.5);});hap('good');},
};

/* ---------- ortam + müzik zamanlayıcı (kare döngüsünden çağrılır) ---------- */
function curGear(){try{const tk=T();const pw=!(S.ev&&S.ev.out>0);return{air:!!(tk.gear&&tk.gear.air)&&pw,run:!!tk.running&&pw,pw};}catch(e){return{air:false,run:false,pw:true};}}
function isNight(){const h=((S.t%24)+24)%24;return h>=21||h<7;}
function audioTick(){if(!AUD||AC.state!=='running')return;const t=AC.currentTime,A=S.audio;
  if(soundOn&&!soundWas&&S.audio.master<=0.001)S.audio.master=AUD_DEF.master;
  if(soundOn!==soundWas){soundWas=soundOn;applyGains();}
  if(!masterLevel())return;
  const g=curGear(),night=isNight()?0.5:1,amb=A.amb*night;
  AUD.amb.gain.setTargetAtTime(amb,t,0.5);
  AUD.waterG.gain.setTargetAtTime(g.run?0.16:0.06,t,0.8);
  AUD.humG.gain.setTargetAtTime(g.run?0.012:0,t,0.8);
  AUD.bubG.gain.setTargetAtTime(g.air?0.5:0,t,0.3);
  // Kabarcık: hava motoru ve elektrik varsa rastgele kısa "blup"lar
  if(g.air&&amb>0){if(AUD.nextBub<t)AUD.nextBub=t+0.05;
    while(AUD.nextBub<t+0.3){const s=AUD.nextBub,o=AC.createOscillator(),k=AC.createGain(),f=500+Math.random()*900;
      o.frequency.setValueAtTime(f,s);o.frequency.exponentialRampToValueAtTime(f*2.2,s+0.045);
      k.gain.setValueAtTime(0.0001,s);k.gain.linearRampToValueAtTime(0.05+Math.random()*0.05,s+0.004);k.gain.exponentialRampToValueAtTime(0.0001,s+0.06);
      o.connect(k).connect(AUD.bubF);o.start(s);o.stop(s+0.08);AUD.nextBub=s+0.06+Math.random()*(Math.random()<0.2?0.9:0.25);}}
  // Müzik: yavaş pentatonik ped + seyrek çekme notalar, reverb'e gönderilir
  if(A.mus>0){const root=57;
    if(AUD.nextPad<t+0.5){const s=Math.max(t+0.1,AUD.nextPad),dur=9;AUD.chord=(AUD.chord+1+Math.floor(Math.random()*3))%5;
      const deg=[0,2,4].map(i=>PENTA[(AUD.chord+i)%5]+(AUD.chord+i>=5?12:0));
      const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const pg=AC.createGain();
      pg.gain.setValueAtTime(0.0001,s);pg.gain.linearRampToValueAtTime(0.045,s+3);pg.gain.setValueAtTime(0.045,s+dur-2.5);pg.gain.linearRampToValueAtTime(0.0001,s+dur+1);
      f.connect(pg).connect(AUD.mus);
      for(const d of deg)for(const det of[-6,6]){const o=AC.createOscillator();o.type='triangle';o.frequency.value=midi(root+d);o.detune.value=det;o.connect(f);o.start(s);o.stop(s+dur+1.2);}
      AUD.nextPad=s+dur-1.5;}
    if(AUD.nextPluck<t+0.3){const s=Math.max(t+0.05,AUD.nextPluck);if(Math.random()<0.7){const n=root+12+PENTA[Math.floor(Math.random()*5)]+(Math.random()<0.3?12:0);
        const o=AC.createOscillator(),k=AC.createGain();o.type='sine';o.frequency.value=midi(n);
        k.gain.setValueAtTime(0.0001,s);k.gain.linearRampToValueAtTime(0.03,s+0.01);k.gain.exponentialRampToValueAtTime(0.0001,s+1.6);
        o.connect(k).connect(AUD.mus);o.start(s);o.stop(s+1.7);}
      AUD.nextPluck=s+1.5+Math.random()*3.5;}}
}
