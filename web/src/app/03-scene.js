/* ---------- three.js scene ---------- */
const canvas=$('c');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('err').style.display='grid';return;}
let PR=Math.min(2,window.devicePixelRatio||1);renderer.setPixelRatio(PR);
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
const RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const V3=THREE.Vector3,lc=h=>new THREE.Color(h).convertSRGBToLinear();
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,1,0.5,900);
/* lights: room (hemi + window sun) and the tank lamp (spot, the only shadow caster) */
const hemi=new THREE.HemisphereLight(lc(0xffe9cf),lc(0x4a3424),0.55);scene.add(hemi);
const amb=new THREE.AmbientLight(lc(0x8090b0),0.04);scene.add(amb);
const sun=new THREE.DirectionalLight(lc(0xffe0b8),0.55);sun.position.set(-40,70,50);scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight(lc(0xbcd2ff),0.12);fill.position.set(40,25,-50);scene.add(fill);
const lamp=new THREE.SpotLight(0xffffff,0,0,0.95,0.5,1);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-0.0006;lamp.shadow.camera.near=1;
scene.add(lamp);scene.add(lamp.target);
const C_LAMP=lc(0xfff1dc),C_PLANT=lc(0xffe6f2),C_MOON=lc(0x6f8cff);
const BG_DAY=new THREE.Color(0x5e4330),BG_NIGHT=new THREE.Color(0x222a3a);scene.background=BG_DAY.clone();scene.fog=new THREE.Fog(0x5e4330,150,330);
const ENV={room:1,lamp:0,mode:-1,envDay:lc(0x8a6a50),envNight:lc(0x050608)};

/* shared shader uniforms (time, in-tank water volume, caustics, sway) */
const U={uTime:{value:0},uTint:{value:1},uBMin:{value:new V3()},uBMax:{value:new V3()},uWCol:{value:lc(0x2e7f8a)},uWDen:{value:0.02},uWL:{value:1},uCaus:{value:0},uSway:{value:1}};
const NC_HEAD=`uniform float uTime,uTint,uWDen,uWL,uCaus,uSway;uniform vec3 uBMin,uBMax,uWCol;varying vec3 vWPos;\n`;
const NC_FRAGFN=`
vec3 ncTint(vec3 c){if(uTint<0.5)return c;vec3 ro=cameraPosition;vec3 d=vWPos-ro;float L=length(d);d/=L;vec3 inv=1.0/(d+vec3(1e-6));
 vec3 t0=(uBMin-ro)*inv,t1=(uBMax-ro)*inv;vec3 tn=min(t0,t1),tf=max(t0,t1);
 float a=max(max(tn.x,tn.y),max(tn.z,0.0)),b=min(min(tf.x,tf.y),min(tf.z,L));float f=1.0-exp(-max(0.0,b-a)*uWDen);
 return mix(c,uWCol*uWL,f);}
float ncCaus(vec2 q,float t){vec2 p=q*0.3-250.0;vec2 i=p;float c=1.0;for(int n=0;n<3;n++){float tt=t*0.5*(1.0-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
 c+=1.0/length(vec2(p.x/(sin(i.x+tt)/0.005),p.y/(cos(i.y+tt)/0.005)));}c/=3.0;c=1.17-pow(c,1.4);return pow(abs(c),7.0);}
`;
const SHRIMP_V=`attribute float aPart;attribute float aS;attribute float aW;attribute vec4 iAnim;varying float vPart,vS,vRili,vSel;
float ncAng(){float wc=clamp((0.6-aS)/0.6,0.0,1.0);wc*=wc;float ph=uTime+iAnim.x;return (iAnim.z*1.1+iAnim.w*0.14*sin(ph*10.0)+0.035*sin(ph*1.7))*wc;}
vec2 ncRot(vec2 q,float a){q-=vec2(-0.05,0.1);float c=cos(a),s=sin(a);return vec2(q.x*c-q.y*s,q.x*s+q.y*c)+vec2(-0.05,0.1);}
`;
/* patch a built-in material: water depth tint, caustics, plant sway, shrimp animation */
function patchMat(mat,o){o=o||{};const tint=o.tint!==false;const key='nc'+(tint?1:0)+(o.caus?1:0)+(o.sway?1:0)+(o.shrimp?1:0)+(o.noflip?1:0);
  const amt=new V3().fromArray(o.sway||[0,0,0]);
  mat.onBeforeCompile=sh=>{for(const k in U)sh.uniforms[k]=U[k];sh.uniforms.uAmt={value:amt};
    let v=NC_HEAD+'uniform vec3 uAmt;\n'+(o.caus?'varying vec3 vWN;\n':'')+(o.shrimp?SHRIMP_V:'')+sh.vertexShader;
    let f=NC_HEAD+(o.caus?'varying vec3 vWN;\n':'')+(o.shrimp?'varying float vPart,vS,vRili,vSel;\n':'')+NC_FRAGFN+sh.fragmentShader;
    if(o.shrimp){
      v=v.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n{float a=ncAng();objectNormal.xy=ncRot(objectNormal.xy+vec2(-0.05,0.1),a)-vec2(-0.05,0.1);}');
      v=v.replace('#include <begin_vertex>',`vec3 transformed=vec3(position);{float ph=uTime+iAnim.x;float act=iAnim.w;
        vPart=aPart;vS=aS;vSel=step(1.5,iAnim.y);vRili=iAnim.y-2.0*vSel;
        if(aPart>1.5&&aPart<2.5)transformed.x+=aW*0.13*sin(ph*(7.0+act*16.0)+aS*22.0)*(0.35+act);
        else if(aPart>2.5&&aPart<3.5)transformed.x+=aW*0.12*sin(ph*9.0+aS*30.0)*act;
        else if(aPart>3.5&&aPart<4.5){float w2=aW*aW;transformed.y+=w2*0.22*sin(ph*1.9+position.z*2.0);transformed.z+=w2*0.28*sin(ph*1.3+sign(position.z)*1.7);}
        transformed.xy=ncRot(transformed.xy,ncAng());}`);
      f=f.replace('#include <color_fragment>',`#include <color_fragment>
        {float mid=vRili*smoothstep(0.24,0.31,vS)*(1.0-smoothstep(0.56,0.63,vS));vec3 clr=vec3(0.6,0.58,0.53);
        diffuseColor.rgb=mix(diffuseColor.rgb,clr,mid*0.92);
        if(vPart>4.5)diffuseColor.rgb=vec3(0.004);else if(vPart>3.5)diffuseColor.rgb=mix(diffuseColor.rgb,clr,0.3);else if(vPart>1.5)diffuseColor.rgb=mix(diffuseColor.rgb,clr,0.18);}`);
      f=f.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*0.07+vSel*vec3(0.35,0.28,0.1)*(0.55+0.45*sin(uTime*5.0));');
    }
    v=v.replace('#include <project_vertex>',`vec4 mvPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;
#endif
${o.sway?`{float hh=mix(max(0.0,mvPosition.y-uAmt.y),1.0,uAmt.z);float a=uAmt.x*uSway*hh;mvPosition.x+=a*sin(uTime*0.9+mvPosition.y*0.25+mvPosition.z*0.3);mvPosition.z+=a*0.6*sin(uTime*0.7+mvPosition.y*0.2+mvPosition.x*0.25+1.3);}`:''}
${o.caus?`{vec3 nw=objectNormal;
#ifdef USE_INSTANCING
nw=mat3(instanceMatrix)*nw;
#endif
vWN=normalize(mat3(modelMatrix)*nw);}`:''}
vWPos=(modelMatrix*mvPosition).xyz;mvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;`);
    if(o.noflip)f=f.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);');
    f=f.replace('#include <tonemapping_fragment>',(o.caus?`if(uCaus>0.001){float up=smoothstep(0.15,0.9,vWN.y)*step(vWPos.y,uBMax.y);gl_FragColor.rgb+=diffuseColor.rgb*ncCaus(vWPos.xz,uTime)*uCaus*up;}\n`:'')+(tint?'gl_FragColor.rgb=ncTint(gl_FragColor.rgb);\n':'')+'#include <tonemapping_fragment>');
    sh.vertexShader=v;sh.fragmentShader=f;};
  mat.customProgramCacheKey=()=>key;mat.keep=true;return mat;}

/* procedural textures */
function cvs(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const WOOD=(function(){const t=cvs(512,512,(x)=>{const r=rng(11);
  for(let i=0;i<4;i++){const y0=i*128;const t=r();x.fillStyle=`rgb(${Math.round(178+t*16)},${Math.round(124+t*12)},${Math.round(80+t*8)})`;x.fillRect(0,y0,512,128);
    for(let k=0;k<80;k++){const yy=y0+4+r()*120,amp=1+r()*3,ph=r()*6;x.strokeStyle=`rgba(${95+r()*30|0},${58+r()*20|0},${30+r()*14|0},${(0.06+r()*0.14).toFixed(3)})`;x.lineWidth=0.6+r()*1.8;
      x.beginPath();x.moveTo(0,yy);for(let xx=0;xx<=512;xx+=24)x.lineTo(xx,yy+Math.sin(xx*0.011+ph)*amp);x.stroke();}
    if(r()<0.7){const kx=r()*512,ky=y0+20+r()*88;const gr=x.createRadialGradient(kx,ky,1,kx,ky,14);gr.addColorStop(0,'rgba(80,45,20,.55)');gr.addColorStop(1,'rgba(80,45,20,0)');x.fillStyle=gr;x.beginPath();x.ellipse(kx,ky,16,7,0,0,6.3);x.fill();}
    x.fillStyle='rgba(55,32,16,.6)';x.fillRect(0,y0,512,2.5);x.fillRect(r()*512,y0,2.5,128);}});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);return t;})();
const TEX={};
function gravelTex(){if(TEX.gravel)return TEX.gravel;const t=cvs(512,512,(x,w,h)=>{const r=rng(5);x.fillStyle='#2a2420';x.fillRect(0,0,w,h);
  const pal=[[92,80,68],[120,104,86],[70,62,55],[140,124,104],[60,52,46],[104,88,70],[150,140,126],[84,70,58]];
  for(let i=0;i<2600;i++){const px=r()*w,py=r()*h,s=3+r()*7,c=pal[r()*pal.length|0],k=0.75+r()*0.4,a=r()*3;
    for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const X=px+ox,Y=py+oy;if(X<-12||X>w+12||Y<-12||Y>h+12)continue;
      x.fillStyle=`rgba(0,0,0,.45)`;x.beginPath();x.ellipse(X+1.2,Y+1.4,s,s*0.75,a,0,6.3);x.fill();
      x.fillStyle=`rgb(${c[0]*k|0},${c[1]*k|0},${c[2]*k|0})`;x.beginPath();x.ellipse(X,Y,s,s*0.75,a,0,6.3);x.fill();
      x.fillStyle='rgba(255,245,225,.16)';x.beginPath();x.ellipse(X-s*0.3,Y-s*0.3,s*0.45,s*0.3,a,0,6.3);x.fill();}}});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return TEX.gravel=t;}
// Taban dokuları: tür başına renk paleti ve tane boyu (çakıl ve Walstad toprağı aynı çakıl kapağını kullanır)
const SUBTEX={sand:{base:'#bda67c',n:9000,s:[1.2,2.6],pal:[[214,196,160],[196,176,138],[230,216,186],[176,158,124],[204,190,168]],shade:.25,hl:.12},
  aqua:{base:'#140d08',n:3200,s:[3,5],pal:[[46,32,22],[34,24,17],[58,42,30],[28,20,14],[70,50,34]],shade:.5,hl:.1,round:1}};
function subTex(kind){if(!SUBTEX[kind])return gravelTex();const key='sub_'+kind;if(TEX[key])return TEX[key];const P=SUBTEX[kind];
  const t=cvs(512,512,(x,w,h)=>{const r=rng(kind.length*13+3);x.fillStyle=P.base;x.fillRect(0,0,w,h);
    for(let i=0;i<P.n;i++){const px=r()*w,py=r()*h,sz=P.s[0]+r()*(P.s[1]-P.s[0]),c=P.pal[r()*P.pal.length|0],k=0.85+r()*0.25,a=r()*3,e=P.round?1:0.65+r()*0.3;
      for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const X=px+ox,Y=py+oy;if(X<-8||X>w+8||Y<-8||Y>h+8)continue;
        x.fillStyle=`rgba(0,0,0,${P.shade})`;x.beginPath();x.ellipse(X+0.8,Y+1,sz,sz*e,a,0,6.3);x.fill();
        x.fillStyle=`rgb(${Math.min(255,c[0]*k)|0},${Math.min(255,c[1]*k)|0},${Math.min(255,c[2]*k)|0})`;x.beginPath();x.ellipse(X,Y,sz,sz*e,a,0,6.3);x.fill();
        x.fillStyle=`rgba(255,250,235,${P.hl})`;x.beginPath();x.ellipse(X-sz*0.3,Y-sz*0.3,sz*0.4,sz*0.28,a,0,6.3);x.fill();}}});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return TEX[key]=t;}
const SUBMAT={};function subMat(kind){const k=SUBTEX[kind]?kind:'gravel';if(k==='gravel')return MK.soil;if(SUBMAT[k])return SUBMAT[k];
  const m=patchMat(new THREE.MeshStandardMaterial({map:subTex(k),vertexColors:true,roughness:0.95}),{caus:true});m.keep=true;return SUBMAT[k]=m;}
// Arka plan dokuları
function bgTex(kind){if(!kind||kind==='deep')return panelTex();const key='bg_'+kind;if(TEX[key])return TEX[key];let t;
  if(kind==='black')t=cvs(4,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#16191a');g.addColorStop(1,'#020303');x.fillStyle=g;x.fillRect(0,0,w,h);});
  else if(kind==='green')t=cvs(512,256,(x,w,h)=>{const r=rng(41);const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3d6b3a');g.addColorStop(0.5,'#1d3d1f');g.addColorStop(1,'#0a1a0c');x.fillStyle=g;x.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){const bx=r()*w,bh=h*(0.35+r()*0.6),bw=4+r()*10;x.fillStyle=`rgba(${20+r()*30|0},${50+r()*50|0},${20+r()*20|0},${0.35+r()*0.4})`;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+(r()-0.5)*40,h-bh*0.6,bx+(r()-0.5)*30,h-bh);x.lineTo(bx+bw,h-bh+6);x.quadraticCurveTo(bx+bw+(r()-0.5)*30,h-bh*0.5,bx+bw,h);x.fill();}});
  else t=cvs(512,256,(x,w,h)=>{const r=rng(77);x.fillStyle='#3a3530';x.fillRect(0,0,w,h);
    for(let row=0,y=0;y<h;row++){const rh=26+r()*18;let xx=-(row%2)*30;while(xx<w){const sw=40+r()*50,v=60+r()*50|0;x.fillStyle=`rgb(${v+8},${v},${v-8})`;
      x.beginPath();if(x.roundRect)x.roundRect(xx+2,y+2,sw-4,rh-4,6);else x.rect(xx+2,y+2,sw-4,rh-4);x.fill();x.fillStyle='rgba(255,255,255,.08)';x.fillRect(xx+5,y+4,sw-12,3);xx+=sw;}y+=rh;}
    const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,.15)');g.addColorStop(1,'rgba(0,0,0,.65)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  return TEX[key]=t;}
function strataTex(){if(TEX.strata)return TEX.strata;const t=cvs(256,256,(x,w,h)=>{const r=rng(9);const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#4a3e33');g.addColorStop(0.5,'#2c241e');g.addColorStop(1,'#1c1714');x.fillStyle=g;x.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){const px=r()*w,py=r()*h,s=1+r()*4,v=60+r()*90|0;x.fillStyle=`rgba(${v},${v*0.88|0},${v*0.75|0},.8)`;x.beginPath();x.ellipse(px,py,s,s*0.7,r()*3,0,6.3);x.fill();if(px<8||px>w-8){x.beginPath();x.ellipse(px+(px<8?w:-w),py,s,s*0.7,0,0,6.3);x.fill();}}});
  t.wrapS=THREE.RepeatWrapping;return TEX.strata=t;}
function barkTex(){if(TEX.bark)return TEX.bark;const t=cvs(256,128,(x,w,h)=>{const r=rng(3);x.fillStyle='#4a3020';x.fillRect(0,0,w,h);
  for(let i=0;i<160;i++){const y=r()*h,l=40+r()*160,x0=r()*w,v=r();x.strokeStyle=v<0.5?`rgba(25,14,8,${0.3+r()*0.4})`:`rgba(140,100,70,${0.15+r()*0.25})`;x.lineWidth=0.8+r()*2.5;x.beginPath();x.moveTo(x0,y);
    for(let k=0;k<=l;k+=16)x.lineTo((x0+k)%w,y+Math.sin(k*0.05+i)*2);x.stroke();}});t.wrapS=t.wrapT=THREE.RepeatWrapping;return TEX.bark=t;}
function mossTex(){if(TEX.moss)return TEX.moss;const t=cvs(256,256,(x,w,h)=>{const r=rng(21);
  const frond=(px,py,ang,len,d)=>{if(d>4||len<3)return;const ex=px+Math.cos(ang)*len,ey=py+Math.sin(ang)*len;const g=110+r()*90|0;x.strokeStyle=`rgb(${g*0.45|0},${g},${g*0.3|0})`;x.lineWidth=Math.max(0.8,3-d*0.6);
    x.beginPath();x.moveTo(px,py);x.lineTo(ex,ey);x.stroke();const n=2+(r()*2|0);for(let k=0;k<n;k++){const tt=0.3+r()*0.7;frond(px+(ex-px)*tt,py+(ey-py)*tt,ang+(r()<0.5?-1:1)*(0.5+r()*0.6),len*0.55,d+1);}};
  for(let i=0;i<46;i++)frond(30+r()*196,250,-Math.PI/2+(r()-0.5)*1.6,50+r()*70,0);});t.encoding=THREE.sRGBEncoding;return TEX.moss=t;}
function blobTex(){if(TEX.blob)return TEX.blob;const t=cvs(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.75)');g.addColorStop(0.5,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});return TEX.blob=t;}
function panelTex(){if(TEX.panel)return TEX.panel;const t=cvs(4,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d5961');g.addColorStop(0.35,'#0e3439');g.addColorStop(0.75,'#071a1e');g.addColorStop(1,'#030708');x.fillStyle=g;x.fillRect(0,0,w,h);});return TEX.panel=t;}
function nerTex(){if(TEX.ner)return TEX.ner;const t=cvs(128,64,(x,w,h)=>{x.fillStyle='#c79a2c';x.fillRect(0,0,w,h);x.strokeStyle='#20160c';x.lineWidth=3.5;for(let i=-8;i<16;i++){x.beginPath();x.moveTo(i*9,0);x.bezierCurveTo(i*9+8,20,i*9-4,40,i*9+10,h);x.stroke();}});return TEX.ner=t;}

const floor=new THREE.Mesh(new THREE.PlaneGeometry(700,700),patchMat(new THREE.MeshLambertMaterial({map:WOOD,color:lc(0xe9dccb)})));
floor.rotation.x=-Math.PI/2;floor.position.y=-0.02;scene.add(floor);
const deskMat=new THREE.Mesh(new THREE.PlaneGeometry(1,1),patchMat(new THREE.MeshStandardMaterial({color:lc(0x2e2a26),roughness:0.95})));deskMat.rotation.x=-Math.PI/2;deskMat.position.y=0.01;deskMat.receiveShadow=true;scene.add(deskMat);

const tankG=new THREE.Group();scene.add(tankG);
let decorG=new THREE.Group();tankG.add(decorG);
const shrimpG=new THREE.Group();scene.add(shrimpG);
const snailG=new THREE.Group();scene.add(snailG);

const G={W:36,D:25,H:26,ph:0,wTop:24};
function groundY(x,z){return 2.2+(-z/G.D+0.5)*2+0.35*Math.sin(x*0.33+G.ph)+0.28*Math.cos(z*0.45+x*0.17);}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const HITMAT=new THREE.MeshBasicMaterial({visible:false});HITMAT.keep=true;
function hitbox(w,h,d,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),HITMAT);m.position.set(x,y,z);decorG.add(m);}
function tagFrom(g,n,k){for(let i=n;i<g.children.length;i++)g.children[i].traverse(o=>{if(o.isMesh)o.userData.hit=k;});}
let hitList=[];function refreshHits(){hitList=[];tankG.traverse(o=>{if(o.isMesh&&o.userData.hit)hitList.push(o);});}
function disposeTree(o){o.traverse(c=>{if(c.geometry&&!c.geometry.keep)c.geometry.dispose();if(c.material&&!c.material.keep){(Array.isArray(c.material)?c.material:[c.material]).forEach(m=>{if(!m.keep)m.dispose()})}});}
function mergeGeos(gs){const out=new THREE.BufferGeometry();const names=['position','normal','uv','color'].filter(n=>gs.every(g=>g.attributes[n]));
  const arr={};names.forEach(n=>arr[n]=[]);const idx=[];let off=0;
  for(const g of gs){const c=g.attributes.position.count;names.forEach(n=>{const a=g.attributes[n].array;for(let i=0;i<a.length;i++)arr[n].push(a[i]);});
    if(g.index){const ia=g.index.array;for(let i=0;i<ia.length;i++)idx.push(ia[i]+off);}else for(let i=0;i<c;i++)idx.push(off+i);off+=c;g.dispose();}
  names.forEach(n=>out.setAttribute(n,new THREE.Float32BufferAttribute(arr[n],n==='uv'?2:3)));out.setIndex(idx);out.computeBoundingSphere();return out;}

/* classic materials (also used by thumbnails), colours authored in sRGB */
const M={
  wood:new THREE.MeshStandardMaterial({color:0x6b4a2f,roughness:0.8}),
  drift:new THREE.MeshStandardMaterial({color:0x5a3d26,roughness:0.95,flatShading:true}),
  rock:new THREE.MeshStandardMaterial({color:0x7d8285,roughness:0.9,flatShading:true}),
  anub:new THREE.MeshStandardMaterial({color:0x2c5e2b,roughness:0.45,side:THREE.DoubleSide}),
  horn:new THREE.MeshStandardMaterial({color:0x5aa63d,roughness:0.7}),
  frog:new THREE.MeshStandardMaterial({color:0x6fb24a,roughness:0.35,side:THREE.DoubleSide}),
  leaf:new THREE.MeshStandardMaterial({color:0x6e4220,roughness:0.9,side:THREE.DoubleSide}),
  black:new THREE.MeshStandardMaterial({color:0x1e2124,roughness:0.9}),
  gray:new THREE.MeshStandardMaterial({color:0x8d949a,roughness:0.5}),
  tube:new THREE.MeshPhongMaterial({color:0xddeeee,transparent:true,opacity:0.3,depthWrite:false,shininess:90}),
  heater:new THREE.MeshStandardMaterial({color:0x553322,emissive:0xff5a1f,emissiveIntensity:0}),
  lamp:new THREE.MeshStandardMaterial({color:0x222629,emissive:0xfff4dd,emissiveIntensity:0}),
  white:new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:0.6}),
  red:new THREE.MeshStandardMaterial({color:0xcc2a2a}),
  bubble:new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:0.45,shininess:120,depthWrite:false}),
  pellet:new THREE.MeshStandardMaterial({color:0x6b3f1c,roughness:0.8}),
  powder:new THREE.MeshStandardMaterial({color:0xc9a66b,roughness:1}),
  ram:new THREE.MeshStandardMaterial({color:0x9a3b24,roughness:0.45}),
  ner:new THREE.MeshStandardMaterial({color:0x3b3a1c,roughness:0.5}),
  plan:new THREE.MeshStandardMaterial({color:0xf1ece0,roughness:0.8}),
  ring:new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,depthTest:false,toneMapped:false})
};
for(const k in M){const m=M[k];m.keep=true;if(m.color)m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();if(m.specular)m.specular.convertSRGBToLinear();
  if(k!=='ring'&&k!=='lamp')patchMat(m,k==='horn'?{sway:[0.02,3,0]}:k==='anub'?{sway:[0.008,3,0]}:k==='drift'||k==='rock'?{caus:true}:{});}
/* in-tank materials */
const MK={
  soil:patchMat(new THREE.MeshStandardMaterial({map:gravelTex(),vertexColors:true,roughness:0.95}),{caus:true}),
  soilSide:patchMat(new THREE.MeshStandardMaterial({map:strataTex(),roughness:1}),{}),
  pebble:patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.7,flatShading:true}),{caus:true}),
  rock:patchMat(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:0.85,flatShading:true}),{caus:true}),
  drift:patchMat(new THREE.MeshStandardMaterial({map:barkTex(),color:lc(0xb08a70),roughness:0.9}),{caus:true}),
  moss:patchMat(new THREE.MeshStandardMaterial({map:mossTex(),alphaTest:0.45,side:THREE.DoubleSide,roughness:1}),{sway:[0.05,0,1],noflip:true}),
  hornS:patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.6}),{sway:[0.02,3,0]}),
  anubL:patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.32,side:THREE.DoubleSide}),{sway:[0.008,3,0]}),
  root:patchMat(new THREE.MeshStandardMaterial({color:lc(0xd8cfb4),roughness:0.8}),{}),
  sponge:patchMat(new THREE.MeshStandardMaterial({color:lc(0x26282a),roughness:1,flatShading:true}),{}),
  panel:patchMat(new THREE.MeshLambertMaterial({map:panelTex()}),{}),
  edge:patchMat(new THREE.MeshStandardMaterial({color:lc(0x8fcfbd),transparent:true,opacity:0.5,roughness:0.12,depthWrite:false}),{}),
  sil:patchMat(new THREE.MeshStandardMaterial({color:lc(0x16191a),transparent:true,opacity:0.7,roughness:0.4}),{}),
  ner:patchMat(new THREE.MeshStandardMaterial({map:nerTex(),roughness:0.35}),{}),
  blob:new THREE.MeshBasicMaterial({map:blobTex(),transparent:true,depthWrite:false,color:0x000000,opacity:0.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false}),
  meniscus:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),
  lampFace:new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})
};
for(const k in MK)MK[k].keep=true;

/* glass: thin fresnel panes; algae patches */
const GLASS=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,
  uniforms:{uAlg:{value:0},uAlgC:{value:lc(0x4f7a2a)},uEnv:{value:new THREE.Color()},uLampCol:{value:new THREE.Color()},uLampY:{value:30},uHW:{value:18}},
  vertexShader:`varying vec3 vWP;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uAlg,uLampY,uHW;uniform vec3 uAlgC,uEnv,uLampCol;varying vec3 vWP;varying vec3 vN;
  void main(){vec3 v=normalize(cameraPosition-vWP);vec3 n=normalize(vN);float fr=pow(1.0-abs(dot(n,v)),3.0);
   vec3 col=mix(vec3(0.5,0.7,0.68),uEnv*1.3+0.04,0.55);float a=0.03+0.42*fr;
   vec3 r=reflect(-v,n);float sp=0.0;if(r.y>0.05){float s=(uLampY-vWP.y)/r.y;vec3 h=vWP+r*s;sp=smoothstep(4.5,2.0,abs(h.z))*smoothstep(uHW+2.0,uHW-1.0,abs(h.x));}
   float nz=0.5+0.5*sin(vWP.x*0.55+sin(vWP.y*0.43)*2.0)*sin(vWP.y*0.5+vWP.z*0.37+1.0);float al=clamp(uAlg*(0.55+0.9*nz)*(1.2-0.5*clamp(vWP.y/30.0,0.0,1.0)),0.0,1.0);
   col=mix(col,uAlgC*(0.4+uEnv*2.0+uLampCol*0.5),al);a=mix(a,0.85,al*0.85);
   col+=uLampCol*sp*0.5;a+=sp*0.18*min(1.0,length(uLampCol));
   gl_FragColor=vec4(col,clamp(a,0.0,0.94));
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});GLASS.keep=true;
/* animated water surface: summed-sine normals, fresnel room reflection, lamp-strip specular */
const WATER=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{uTime:U.uTime,uWCol:U.uWCol,uWL:U.uWL,uEnv:GLASS.uniforms.uEnv,uLampCol:GLASS.uniforms.uLampCol,uLampY:GLASS.uniforms.uLampY,uHW:GLASS.uniforms.uHW,uAgit:{value:1}},
  vertexShader:`varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uTime,uWL,uLampY,uHW,uAgit;uniform vec3 uWCol,uEnv,uLampCol;varying vec3 vWP;
  vec2 wv(vec2 p,vec2 d,float k,float a,float s){float ph=dot(p,d)*k+uTime*s;return d*(a*k*cos(ph));}
  void main(){vec2 p=vWP.xz;vec2 g=wv(p,vec2(0.8,0.6),0.9,0.05,1.3)+wv(p,vec2(-0.6,0.8),1.4,0.03,1.7)+wv(p,vec2(0.2,-0.98),2.3,0.016,2.4)+wv(p,vec2(-0.9,-0.3),3.7,0.008,3.1);
   vec3 v=normalize(cameraPosition-vWP);g*=uAgit*mix(0.35,1.0,abs(v.y));vec3 n=normalize(vec3(-g.x,1.0,-g.y));bool up=gl_FrontFacing;if(!up)n=-n;
   float ndv=max(dot(n,v),0.0);float fr=min(0.7,0.02+0.98*pow(1.0-ndv,5.0));vec3 r=reflect(-v,n);float sp=0.0;
   if(r.y>0.02){float s=(uLampY-vWP.y)/r.y;vec3 h=vWP+r*s;sp=smoothstep(3.6,2.2,abs(h.z))*smoothstep(uHW+1.0,uHW-1.5,abs(h.x));}
   vec3 body=uWCol*uWL*0.55;vec3 col;float a;
   if(up){col=mix(body,uEnv*1.1+uWCol*uWL*0.25,fr)+uLampCol*sp*0.55;a=0.2+0.6*fr+sp*0.22;}
   else{float tir=smoothstep(0.55,0.3,ndv);col=mix(body*1.4,uWCol*uWL*1.1+0.02,tir)+uLampCol*sp*0.5;a=0.35+0.45*tir;}
   gl_FragColor=vec4(col,clamp(a,0.0,0.92));
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});WATER.keep=true;
/* drifting suspended specks */
const SPECK=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:U.uTime,uBMin:U.uBMin,uBMax:U.uBMax,uWL:U.uWL,uPx:{value:PR},uA:{value:0.5}},
  vertexShader:`attribute float aSeed;uniform float uTime,uPx;uniform vec3 uBMin,uBMax;varying float vF;
  void main(){vec3 p=position;float t=uTime;p.x=fract(p.x+0.012*sin(t*0.13+aSeed*6.0)+t*0.0015*(aSeed-0.5));p.y=fract(p.y+t*0.005*(aSeed-0.35));p.z=fract(p.z+0.012*cos(t*0.11+aSeed*4.0));
   vec3 w=mix(uBMin+vec3(0.5,1.8,0.5),uBMax-vec3(0.5,0.3,0.5),p);vec4 mv=viewMatrix*vec4(w,1.0);gl_Position=projectionMatrix*mv;
   gl_PointSize=uPx*(0.5+aSeed)*26.0/max(1.0,-mv.z);vF=0.4+0.6*fract(aSeed*7.3+t*0.05);}`,
  fragmentShader:`uniform float uWL,uA;varying float vF;void main(){vec2 c=gl_PointCoord-0.5;float a=smoothstep(0.5,0.05,length(c));gl_FragColor=vec4(vec3(1.0,0.96,0.86)*uWL*0.6,a*uA*vF);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});SPECK.keep=true;
const VIGN=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uK:{value:0.35}},
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:'uniform float uK;varying vec2 vU;void main(){vec2 d=vU-0.5;float v=smoothstep(0.32,0.9,length(d*vec2(1.0,1.2)));gl_FragColor=vec4(0.0,0.0,0.0,v*uK);}'}));
VIGN.frustumCulled=false;VIGN.renderOrder=999;scene.add(VIGN);

let joyT=0;const joyE=[];function joyBurst(){joyT=3.5;}
let waterMesh,glassMesh,edgeMesh,menMesh,speckPts,bubbles,pellets,powders,frogMesh,fanBlades,emitters=[],sig='',builtFor=-1;

/* ---------- geometry helpers ---------- */
function noise3(rnd){const K=[];for(let i=0;i<7;i++)K.push([(rnd()-0.5)*4,(rnd()-0.5)*4,(rnd()-0.5)*4,rnd()*6.28,1/(1+i*0.6)]);
  return(x,y,z)=>{let s=0;for(const k of K)s+=Math.sin(x*k[0]+y*k[1]+z*k[2]+k[3])*k[4];return s/2.4;};}
function rockGeo(r,rnd){const g=new THREE.IcosahedronGeometry(1,2);const n=noise3(rnd);const p=g.attributes.position;const cols=[];const c=new THREE.Color();const tone=rnd();
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const d=1+0.22*n(x*1.3,y*1.3,z*1.3)+0.06*n(x*4,y*4,z*4);p.setXYZ(i,x*d*r*1.25,Math.max(-0.35,y)*d*r*0.75,z*d*r);
    const band=0.82+0.12*Math.sin(y*7+n(x*2,y*2,z*2)*3)+0.08*n(x*6,y*6,z*6);c.setRGB(0.15*band,0.155*band,0.15*band+0.012*tone);if(y>0.55)c.multiplyScalar(1.12);cols.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();return g;}
function taperTube(curve,seg,rad,radial,taper,rough){const g=new THREE.TubeGeometry(curve,seg,rad,radial,false);const p=g.attributes.position;const P=new V3(),Q=new V3();
  for(let k=0;k<p.count;k++){const i=Math.floor(k/(radial+1)),j=k%(radial+1);const t=i/seg;curve.getPointAt(t,P);Q.fromBufferAttribute(p,k).sub(P);
    const bark=1+(rough||0)*(Math.sin(j*2.3+i*0.9)*0.5+Math.sin(i*2.7+j*0.4)*0.5);Q.multiplyScalar(taper(t)*bark);p.setXYZ(k,P.x+Q.x,P.y+Q.y,P.z+Q.z);}
  g.computeVertexNormals();return g;}
function leafGeo(L,Wd,droop,pet){const nu=10,nv=4,pos=[],idx=[];
  for(let i=0;i<=nu;i++){const u=i/nu;const w=Wd*Math.pow(Math.sin(Math.PI*Math.min(1,Math.pow(u,0.8))),0.85);
    for(let j=0;j<=nv;j++){const v=j/nv*2-1;pos.push(pet+u*L,-droop*L*u*u+0.12*Wd*Math.abs(v),v*w);}}
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  if(!pet)return g;const st=new THREE.CylinderGeometry(0.05,0.07,pet,4);st.rotateZ(-Math.PI/2);st.translate(pet/2,0,0);st.deleteAttribute('uv');g.deleteAttribute('uv');return mergeGeos([g,st]);}
const LEAF_GEO=leafGeo(5,1.4,0.02,0);LEAF_GEO.keep=true;
const ANUB_GEO=leafGeo(2.2,0.62,0.18,0.9);ANUB_GEO.keep=true;
const FROG_GEO=(function(){const g=new THREE.CircleGeometry(1,20,0.32,Math.PI*2-0.64);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,0.14*(x*x+z*z));}g.computeVertexNormals();return g;})();FROG_GEO.keep=true;

/* ---------- tank build ---------- */
function substrateGeo(W,D,rnd){const sg=new THREE.PlaneGeometry(W-0.3,D-0.3,48,28);sg.rotateX(-Math.PI/2);
  const p=sg.attributes.position,uv=sg.attributes.uv,cols=[];const c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,groundY(x,z));uv.setXY(i,x/9,z/9);const v=0.8+rnd()*0.3;c.setRGB(v,v*0.97,v*0.92);cols.push(c.r,c.g,c.b);}
  sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));sg.computeVertexNormals();return sg;}
function skirtGeo(W,D){const hw=W/2-0.15,hd=D/2-0.15,pts=[];const n=48,m=28;
  for(let i=0;i<=n;i++)pts.push([-hw+2*hw*i/n,hd]);for(let i=1;i<=m;i++)pts.push([hw,hd-2*hd*i/m]);for(let i=1;i<=n;i++)pts.push([hw-2*hw*i/n,-hd]);for(let i=1;i<=m;i++)pts.push([-hw,-hd+2*hd*i/m]);
  const pos=[],uv=[],idx=[];let L=0;for(let i=0;i<pts.length;i++){const[x,z]=pts[i];if(i)L+=Math.hypot(x-pts[i-1][0],z-pts[i-1][1]);const y=groundY(x,z);pos.push(x,y,z,x,0,z);uv.push(L/12,y/12,L/12,0);}
  for(let i=0;i<pts.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+2,a+1,a+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function glassEdges(W,H,D){const t=0.45,bs=[];const add=(sx,sy,sz,x,y,z)=>{const b=new THREE.BoxGeometry(sx,sy,sz);b.translate(x,y,z);bs.push(b);};
  for(const sx of[-1,1])for(const sz of[-1,1])add(t,H,t,sx*W/2,H/2,sz*D/2);
  for(const y of[0,H]){for(const sz of[-1,1])add(W,t,t,0,y,sz*D/2);for(const sx of[-1,1])add(t,t,D,sx*W/2,y,0);}return mergeGeos(bs);}
function siliconeGeo(W,H,D){const r=0.2,bs=[];const ix=W/2-0.42,iz=D/2-0.42;
  for(const sx of[-1,1])for(const sz of[-1,1]){const c=new THREE.CylinderGeometry(r,r,H-0.6,5);c.translate(sx*ix,H/2,sz*iz);bs.push(c);}
  for(const sz of[-1,1]){const c=new THREE.CylinderGeometry(r,r,W-0.8,5);c.rotateZ(Math.PI/2);c.translate(0,0.45,sz*iz);bs.push(c);}
  for(const sx of[-1,1]){const c=new THREE.CylinderGeometry(r,r,D-0.8,5);c.rotateX(Math.PI/2);c.translate(sx*ix,0.45,0);bs.push(c);}
  bs.forEach(b=>b.deleteAttribute('uv'));return mergeGeos(bs);}
function meniscusGeo(W,D){const hw=W/2-0.3,hd=D/2-0.3,pos=[],col=[],idx=[];const pts=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd],[-hw,-hd]];const rows=[[-0.3,0],[0,0.5],[0.1,0]];
  for(let s=0;s<4;s++){const[a,b]=[pts[s],pts[s+1]];const base=pos.length/3;for(const[x,z]of[a,b])for(const[y,k]of rows){pos.push(x,y,z);col.push(k*0.85,k,k);}
    idx.push(base,base+3,base+1,base+1,base+3,base+4,base+1,base+4,base+2,base+2,base+4,base+5);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);return g;}

// Tankın yeniden kurulmasını gerektiren durum: taban, su var/yok, arka plan, dekor
function tankKey(tk){return[tk.sub,tk.level>0.05,tk.bg,Object.keys(tk.decor||{}).filter(k=>tk.decor[k]).sort().join()].join('|');}
const DECMAT={};function decMat(k){if(DECMAT[k])return DECMAT[k];let m;
  if(k==='dragon')m=patchMat(new THREE.MeshStandardMaterial({color:lc(0xc4793a),vertexColors:true,roughness:0.95,flatShading:true}),{caus:true});
  else if(k==='tube')m=patchMat(new THREE.MeshStandardMaterial({color:lc(0xa5532e),roughness:0.8,side:THREE.DoubleSide}),{caus:true});
  else m=patchMat(new THREE.MeshStandardMaterial({map:barkTex(),color:lc(0xd8b98e),roughness:0.9}),{caus:true});
  m.keep=true;return DECMAT[k]=m;}
function buildDecorItems(tk,W,D,rnd){const dec=tk.decor||{};
  if(dec.dragon){const gs=[];for(let i=0;i<4;i++){const r=1.2+rnd()*1.6;const x=-W*0.3+i*1.9+(rnd()-0.5),z=D*0.12+(rnd()-0.5)*3;const g=rockGeo(r,rnd);g.scale(1,1.25+rnd()*0.4,0.8);g.rotateY(rnd()*3);g.translate(x,groundY(x,z)+r*0.45,z);gs.push(g);
      G.rocks.push([x,groundY(x,z)+r*0.9,z,r]);for(let j=0;j<4;j++)G.anchors.push([x+(rnd()-0.5)*r,groundY(x,z)+r*1.1,z+(rnd()-0.5)*r*0.6]);}
    const m=new THREE.Mesh(mergeGeos(gs),decMat('dragon'));m.castShadow=m.receiveShadow=true;tankG.add(m);}
  if(dec.tubes){const gs=[];const bx=W*0.28,bz=D*0.2;const spots=[[-1.1,0],[1.1,0],[0,1.8]];
    for(const[ox,oy]of spots){const g=new THREE.CylinderGeometry(0.9,0.9,4.2,14,1,true);g.rotateZ(Math.PI/2);g.rotateY(0.5);g.translate(bx+ox,groundY(bx,bz)+0.85+oy,bz);gs.push(g);}
    const m=new THREE.Mesh(mergeGeos(gs),decMat('tube'));m.castShadow=m.receiveShadow=true;tankG.add(m);}
  if(dec.spider){const parts=[];const ox=-W*0.05,oz=-D*0.22;
    for(let b=0;b<7;b++){const a=-1.3+b*0.42+(rnd()-0.5)*0.2;const len=6+rnd()*6;const pts=[new V3(ox,groundY(ox,oz)+0.4,oz)];
      for(let k=1;k<=4;k++){const t=k/4;pts.push(new V3(ox+Math.sin(a)*len*t+(rnd()-0.5),groundY(ox,oz)+0.4+Math.cos(a)*len*t*0.9+(rnd()-0.5)*0.6,oz+(rnd()-0.5)*2*t));}
      const cv=new THREE.CatmullRomCurve3(pts);parts.push(taperTube(cv,14,0.38,6,t=>1-0.8*t,0.06));for(let j=0;j<3;j++){const q=cv.getPointAt(0.3+rnd()*0.6);G.anchors.push([q.x,q.y+0.3,q.z]);}}
    const m=new THREE.Mesh(mergeGeos(parts),decMat('spider'));m.castShadow=m.receiveShadow=true;tankG.add(m);}}
function buildTank(tk){
  disposeTree(tankG);tankG.clear();decorG=new THREE.Group();tankG.add(decorG);
  const[W,D,H]=SIM.TANKS[tk.vol].dims;Object.assign(G,{W,D,H,ph:(tk.seed%100)/10});
  const rnd=rng(tk.seed);
  deskMat.scale.set(W+4,D+4,1);
  const box=new THREE.BoxGeometry(W,H,D);box.translate(0,H/2,0);
  glassMesh=new THREE.Mesh(box,GLASS);glassMesh.renderOrder=5;glassMesh.userData.hit='glass';tankG.add(glassMesh);
  edgeMesh=new THREE.Mesh(glassEdges(W,H,D),MK.edge);edgeMesh.renderOrder=6;tankG.add(edgeMesh);
  const sil=new THREE.Mesh(siliconeGeo(W,H,D),MK.sil);sil.renderOrder=1;tankG.add(sil);
  MK.panel.map=bgTex(tk.bg);MK.panel.needsUpdate=true;
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(W-0.3,H-0.3),MK.panel);panel.position.set(0,H/2,-D/2-0.08);tankG.add(panel);
  const wg=new THREE.PlaneGeometry(W-0.6,D-0.6,1,1);wg.rotateX(-Math.PI/2);
  waterMesh=new THREE.Mesh(wg,WATER);waterMesh.renderOrder=3;tankG.add(waterMesh);
  menMesh=new THREE.Mesh(meniscusGeo(W,D),MK.meniscus);menMesh.renderOrder=4;tankG.add(menMesh);
  const n1=tankG.children.length;
  // substrate: gravel top, strata skirt, instanced pebbles (only once a substrate is laid)
  G.anchors=[];G.rocks=[];G.tkey=tankKey(tk);
  if(tk.sub){
  const sub=new THREE.Mesh(substrateGeo(W,D,rnd),subMat(tk.sub));sub.receiveShadow=true;sub.castShadow=true;tankG.add(sub);
  const sk=new THREE.Mesh(skirtGeo(W,D),MK.soilSide);sk.castShadow=true;tankG.add(sk);
  const np=tk.sub==='aqua'?0:Math.round(W*D/(tk.sub==='sand'?20:7));const pg=new THREE.DodecahedronGeometry(1,0);const peb=new THREE.InstancedMesh(pg,MK.pebble,np);const tmp=new THREE.Object3D(),col=new THREE.Color();
  for(let i=0;i<np;i++){const x=(rnd()-0.5)*(W-1.2),z=(rnd()-0.5)*(D-1.2),s=0.18+Math.pow(rnd(),2.5)*0.55;tmp.position.set(x,groundY(x,z)-s*0.2,z);tmp.rotation.set(rnd()*3,rnd()*3,rnd()*3);tmp.scale.set(s*1.2,s*0.7,s);tmp.updateMatrix();peb.setMatrixAt(i,tmp.matrix);
    const v=0.05+rnd()*0.16;col.setRGB(v*1.05,v,v*0.9);if(rnd()<0.2)col.setRGB(v*1.25,v*0.95,v*0.65);
    if(tk.sub==='sand'){const c=0.3+rnd()*0.25;col.setRGB(c,c*0.9,c*0.75);}peb.setColorAt(i,col);}
  peb.frustumCulled=false;peb.receiveShadow=true;tankG.add(peb);
  // hardscape: tapered driftwood tubes + noise rocks
  const dx=-W*0.12,dz=-D*0.08;const woods=[];
  const branches=[[0,0,W*0.55,0.2,0.9],[W*0.1,-D*0.1,W*0.32,-0.6,0.6],[-W*0.12,D*0.05,W*0.28,0.9,0.5]];
  for(const[bx,bz,len,ang,r]of branches){const x=dx+bx,z=dz+bz;const ca=Math.cos(-ang),sa=Math.sin(-ang);const pts=[];
    for(let k=0;k<=5;k++){const t=k/5-0.5;const px=x+ca*t*len+(rnd()-0.5)*1.2*-sa,pz=z+sa*t*len+(rnd()-0.5)*1.2*ca;pts.push(new V3(px,groundY(px,pz)+r*0.75+(t+0.5)*len*0.28+(rnd()-0.5)*0.5,pz));}
    const cv=new THREE.CatmullRomCurve3(pts);woods.push(taperTube(cv,28,r,8,t=>1.15-0.6*t,0.08));
    const tp=cv.getPointAt(0.55),dir=cv.getTangentAt(0.55);const tw=new THREE.CatmullRomCurve3([tp,tp.clone().add(new V3(-dir.z*2+dir.x,1.6,dir.x*2+dir.z)),tp.clone().add(new V3(-dir.z*3.5+dir.x*2,3.4+rnd(),dir.x*3.5+dir.z*2))]);
    woods.push(taperTube(tw,10,r*0.45,6,t=>1-0.75*t,0.05));
    for(let i=0;i<14;i++){const t=0.05+rnd()*0.9;const q=cv.getPointAt(t);G.anchors.push([q.x+(rnd()-0.5)*1.2,q.y+r*0.6+rnd()*0.4,q.z+(rnd()-0.5)*1.2]);}}
  const wm=new THREE.Mesh(mergeGeos(woods),MK.drift);wm.castShadow=wm.receiveShadow=true;MK.drift.map.repeat.set(3,1);tankG.add(wm);
  const rgs=[];
  for(let i=0;i<3;i++){const r=1.8+rnd()*1.8;const x=W*(0.12+i*0.13),z=D*(0.08-i*0.12);const g=rockGeo(r,rnd);g.rotateY(rnd()*3);g.translate(x,groundY(x,z)+r*0.32,z);rgs.push(g);
    G.rocks.push([x,groundY(x,z)+r*0.6,z,r]);for(let j=0;j<6;j++)G.anchors.push([x+(rnd()-0.5)*r*1.4,groundY(x,z)+r*0.7,z+(rnd()-0.5)*r]);}
  const rm=new THREE.Mesh(mergeGeos(rgs),MK.rock);rm.castShadow=rm.receiveShadow=true;tankG.add(rm);
  buildDecorItems(tk,W,D,rnd);
  }
  tagFrom(tankG,n1,'tank');
  G.anchors.sort(()=>rnd()-0.5);
  G.hornBase=[];for(let i=0;i<10;i++){const x=-W/2+4+rnd()*W*0.35,z=-D/2+2+rnd()*4;G.hornBase.push([x,z,rnd()]);}
  G.frogPos=[];for(let i=0;i<40;i++)G.frogPos.push([(rnd()-0.5)*(W-3),(rnd()-0.5)*(D-3),0.5+rnd()*0.6,rnd()*6]);
  G.leafPos=[];for(let i=0;i<6;i++)G.leafPos.push([(rnd()-0.5)*(W-6),D*(rnd()*0.4),rnd()*6]);
  // bubbles, pellets, specks
  bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(0.2,8,6),M.bubble,40);bubbles.renderOrder=4;bubbles.count=0;bubbles.frustumCulled=false;tankG.add(bubbles);
  bubbles.userData.y=new Float32Array(40).map(()=>Math.random()*H);bubbles.userData.o=new Float32Array(80).map(()=>Math.random()-0.5);
  pellets=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2,0.2,0.9,6),M.pellet,16);pellets.count=0;pellets.frustumCulled=false;tankG.add(pellets);
  powders=new THREE.InstancedMesh(new THREE.SphereGeometry(0.12,4,3),M.powder,24);powders.count=0;powders.frustumCulled=false;tankG.add(powders);
  const NSP=150,sp=new Float32Array(NSP*3),sd=new Float32Array(NSP);for(let i=0;i<NSP;i++){sp[i*3]=Math.random();sp[i*3+1]=Math.random();sp[i*3+2]=Math.random();sd[i]=Math.random();}
  const spg=new THREE.BufferGeometry();spg.setAttribute('position',new THREE.BufferAttribute(sp,3));spg.setAttribute('aSeed',new THREE.BufferAttribute(sd,1));
  speckPts=new THREE.Points(spg,SPECK);speckPts.frustumCulled=false;speckPts.renderOrder=2;tankG.add(speckPts);
  // lamp spot: covers the substrate, spills a little onto the desk
  const hd=Math.hypot(W/2,D/2);lamp.position.set(0,H+3.9,0);lamp.target.position.set(0,0,0);lamp.angle=Math.min(1.2,Math.atan(hd/(H+1.5))*1.3);lamp.penumbra=0.55;
  lamp.shadow.camera.far=(H+6)*1.7;lamp.shadow.camera.updateProjectionMatrix();
  GLASS.uniforms.uLampY.value=H+4;GLASS.uniforms.uHW.value=W/2-1;
  // camera
  if(typeof ROOM!=='undefined'&&ROOM.on){ROOM.on=false;ROOM.tgt=null;}cam.tgt.set(0,H*0.36,0);fitKey='';if(builtFor!==tk.id&&!userZoom)cam.r=fitR();
  builtFor=tk.id;sig='';renderer.shadowMap.needsUpdate=true;
}

function tankSig(tk){const p=tk.plants;return[tk.id,tk.eq.filter,tk.eq.light,Object.keys(tk.gear).filter(k=>tk.gear[k]).sort().join(),
  Math.round(p.moss*6),Math.round(p.anub*5),Math.round(p.horn*3),Math.round(p.frog*6),tk.leaves.length].join('|');}

function buildDecor(tk){
  disposeTree(decorG);decorG.clear();emitters=[];fanBlades=null;frogMesh=null;
  const{W,D,H}=G;const sc=tk.vol/20;const rnd=rng(tk.seed+7);const wTop=H-2;
  const tmp=new THREE.Object3D();const col=new THREE.Color();
  let tgK=null,tgN=0;const TG=k=>{if(tgK)tagFrom(decorG,tgN,tgK);tgK=k;tgN=decorG.children.length;};
  TG('plants');
  // moss: alpha-tested crossed cards
  const nm=Math.min(G.anchors.length*3,Math.round(tk.plants.moss*16));
  if(nm>0){if(!TEX.mossGeo){const cs=[];for(let k=0;k<3;k++){const p=new THREE.PlaneGeometry(1.7,1.1);p.translate(0,0.4,0);p.rotateY(k*Math.PI/3);cs.push(p);}const h=new THREE.PlaneGeometry(1.6,1.6);h.rotateX(-Math.PI/2);h.translate(0,0.3,0);cs.push(h);
      const g=mergeGeos(cs);const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);g.keep=true;TEX.mossGeo=g;}
    const mm=new THREE.InstancedMesh(TEX.mossGeo,MK.moss,nm);
    for(let i=0;i<nm;i++){const a=G.anchors[i%G.anchors.length];const k=Math.floor(i/G.anchors.length);
      tmp.position.set(a[0]+(rnd()-0.5)*1.2*(k+1),a[1]+(rnd()-0.4)*0.5-0.2,a[2]+(rnd()-0.5)*1.2*(k+1));tmp.rotation.set((rnd()-0.5)*0.5,rnd()*3,(rnd()-0.5)*0.5);
      const s=0.9+rnd()*0.9;tmp.scale.set(s,s*0.8,s);tmp.updateMatrix();mm.setMatrixAt(i,tmp.matrix);
      col.setHSL(0.25+rnd()*0.06,0.55,0.32+rnd()*0.14).convertSRGBToLinear();mm.setColorAt(i,col);}
    mm.frustumCulled=false;decorG.add(mm);}
  // anubias: glossy leaves with petioles in a rosette on the first rock
  const na=Math.round(tk.plants.anub*6);
  if(na>0&&G.rocks.length){const r=G.rocks[0];const am=new THREE.InstancedMesh(ANUB_GEO,MK.anubL,na*2);let n=0;
    for(let i=0;i<na*2;i++){const ang=i*2.4+rnd()*0.4;const s=0.75+rnd()*0.55;
      tmp.position.set(r[0]+Math.cos(ang)*0.5,r[1]+0.3+rnd()*0.5,r[2]+Math.sin(ang)*0.5);
      tmp.rotation.set((rnd()-0.5)*0.3,-ang,0.35+rnd()*0.6);tmp.scale.set(s,s,s);tmp.updateMatrix();am.setMatrixAt(n,tmp.matrix);
      col.setHSL(0.31+rnd()*0.03,0.5,0.2+rnd()*0.07).convertSRGBToLinear();am.setColorAt(n++,col);}
    am.frustumCulled=false;decorG.add(am);}
  // hornwort: instanced stems + whorled needles, lighter at the tips
  const ns=Math.min(10,Math.ceil(tk.plants.horn*1.8));
  if(ns>0){const hh=Math.min(wTop-1,6+tk.plants.horn/sc*3.6);const step=0.55,per=Math.ceil(hh/step+1)*7;
    const sg=new THREE.CylinderGeometry(0.05,0.07,1,5);sg.translate(0,0.5,0);const stems=new THREE.InstancedMesh(sg,MK.hornS,ns);
    const ng=new THREE.ConeGeometry(0.045,1.05,3);ng.translate(0,0.52,0);const hm=new THREE.InstancedMesh(ng,MK.hornS,ns*per);let n=0;
    for(let s=0;s<ns;s++){const[bx,bz,ph]=G.hornBase[s];const h=hh*(0.7+ph*0.3);const gy=groundY(bx,bz)-0.3;
      tmp.position.set(bx,gy,bz);tmp.rotation.set(0,0,0);tmp.scale.set(1,h,1);tmp.updateMatrix();stems.setMatrixAt(s,tmp.matrix);col.setRGB(0.07,0.2,0.04);stems.setColorAt(s,col);
      hitbox(2.2,h,2.2,bx,gy+h/2,bz);
      for(let w=0;w*step<h&&n<ns*per-7;w++){const u=w*step/h;for(let j=0;j<7;j++){const a=j/7*6.283+w*0.7;
        tmp.position.set(bx,gy+w*step+0.3,bz);tmp.rotation.set(0,-a,-(0.75+0.45*u));const sz=0.75+0.35*Math.sin(Math.PI*Math.min(1,u*1.3));tmp.scale.set(1,sz,1);tmp.updateMatrix();hm.setMatrixAt(n,tmp.matrix);
        col.setHSL(0.27,0.6,0.16+0.2*u+rnd()*0.04).convertSRGBToLinear();hm.setColorAt(n++,col);}}}
    hm.count=n;stems.frustumCulled=hm.frustumCulled=false;decorG.add(stems);decorG.add(hm);}
  // frogbit: notched floating leaves with dangling roots
  const nf=Math.min(40,Math.round(tk.plants.frog*9));
  if(nf>0){frogMesh=new THREE.Group();const fl=new THREE.InstancedMesh(FROG_GEO,M.frog,nf);const rg=new THREE.CylinderGeometry(0.03,0.012,1,3);rg.translate(0,-0.5,0);const ro=new THREE.InstancedMesh(rg,MK.root,nf*3);
    for(let i=0;i<nf;i++){const f=G.frogPos[i];tmp.position.set(f[0],0,f[1]);tmp.rotation.set(0,f[3],0);tmp.scale.set(f[2],f[2],f[2]);tmp.updateMatrix();fl.setMatrixAt(i,tmp.matrix);
      col.setHSL(0.25+rnd()*0.04,0.5,0.4+rnd()*0.1).convertSRGBToLinear();fl.setColorAt(i,col);
      for(let k=0;k<3;k++){tmp.position.set(f[0]+(rnd()-0.5)*0.3,-0.05,f[1]+(rnd()-0.5)*0.3);tmp.rotation.set((rnd()-0.5)*0.3,0,(rnd()-0.5)*0.3);tmp.scale.set(1,0.8+rnd()*1.6*f[2],1);tmp.updateMatrix();ro.setMatrixAt(i*3+k,tmp.matrix);}}
    fl.frustumCulled=ro.frustumCulled=false;frogMesh.add(fl);frogMesh.add(ro);frogMesh.position.y=G.wTop+0.04;decorG.add(frogMesh);}
  TG('tank');
  // catappa leaves
  tk.leaves.forEach((a,i)=>{const p=G.leafPos[i];if(!p)return;const l=new THREE.Mesh(LEAF_GEO,M.leaf);l.rotation.set((rnd()-0.5)*0.1,p[2],(rnd()-0.5)*0.1);l.position.set(p[0]-Math.cos(p[2])*2.5,groundY(p[0],p[1])+0.25,p[1]+Math.sin(p[2])*2.5);decorG.add(l);});
  // equipment
  const back=-D/2+2.6;
  TG('filter');
  if(tk.eq.filter==='sponge'){const x=-W/2+3.2,z=back,gy=groundY(x,z);
    const sg=new THREE.CylinderGeometry(1.7,1.7,6,14,6);const nz=noise3(rng(4));const p=sg.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i);const d=1+0.05*nz(X*3,Y*3,Z*3);p.setXYZ(i,X*d,Y,Z*d);}sg.computeVertexNormals();
    const sp=new THREE.Mesh(sg,MK.sponge);sp.position.set(x,gy+3,z);decorG.add(sp);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2,0.5,16),M.black);base.position.set(x,gy+0.2,z);decorG.add(base);hitbox(5,9,5,x,gy+4.5,z);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,wTop-gy-5,8),M.tube);tube.position.set(x,gy+6+(wTop-gy-6)/2,z);decorG.add(tube);
    if(tk.gear.air)emitters.push([x,z,gy+6,0.3]);}
  TG('air');
  if(tk.gear.air&&tk.eq.filter!=='sponge'){const x=W/2-5,z=back,gy=groundY(x,z);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.8,10),M.gray);st.position.set(x,gy+0.4,z);decorG.add(st);emitters.push([x,z,gy+0.8,1.2]);}
  TG('filter');
  if(tk.eq.filter==='hob'){const x=W/2-8;
    const bx=new THREE.Mesh(new THREE.BoxGeometry(7,H*0.45,4),M.black);bx.position.set(x,H-H*0.2,-D/2-2.1);decorG.add(bx);
    const it=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,H-6,8),M.tube);it.position.set(x-2,(H-6)/2+4,-D/2+1.4);decorG.add(it);hitbox(5,H-2,5,x-2,H/2,-D/2+2);
    if(tk.gear.guard){const g=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,2.2,10),MK.sponge);g.position.set(x-2,4.5,-D/2+1.4);decorG.add(g);}}
  TG('filter');
  if(tk.eq.filter==='canister'){const x=W/2-3;
    const cb=new THREE.Mesh(new THREE.CylinderGeometry(4,4,14,16),M.black);cb.position.set(W/2+7,7,-D/2+4);decorG.add(cb);
    const it=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,H-6,8),M.tube);it.position.set(x,(H-6)/2+4,-D/2+1.4);decorG.add(it);hitbox(5,H-2,5,x,H/2,-D/2+2);
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,W*0.5,8),M.tube);bar.rotation.z=Math.PI/2;bar.position.set(0,wTop-2.5,-D/2+1.2);decorG.add(bar);
    if(tk.gear.guard){const g=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,2.2,10),MK.sponge);g.position.set(x,4.5,-D/2+1.4);decorG.add(g);}}
  TG('heater');
  if(tk.gear.heater){const x=W/2-2,z=back+1;const gl=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,13,10),M.tube);gl.position.set(x,4.5+6.5,z);decorG.add(gl);
    const coil=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,10,8),M.heater);coil.position.set(x,4.5+6,z);decorG.add(coil);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,1.6,12),M.black);cap.position.set(x,4.5+13.2,z);decorG.add(cap);hitbox(4.5,15,4.5,x,11,z);}
  TG('thermo');
  if(tk.gear.thermo){const t=new THREE.Mesh(new THREE.BoxGeometry(0.4,6,0.25),M.white);t.position.set(-W/2+0.8,H*0.55,D/2-0.4);decorG.add(t);
    const r=new THREE.Mesh(new THREE.BoxGeometry(0.15,3.5,0.3),M.red);r.position.set(-W/2+0.8,H*0.5,D/2-0.35);decorG.add(r);hitbox(3.5,9,3,-W/2+1.2,H*0.55,D/2-0.8);}
  TG('fan');
  if(tk.gear.fan){const f=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(5,4.5,1.2),M.black);f.add(b);
    fanBlades=new THREE.Group();for(let i=0;i<3;i++){const bl=new THREE.Mesh(new THREE.BoxGeometry(0.7,3.4,0.1),M.gray);bl.rotation.z=i*2.094;fanBlades.add(bl);}
    fanBlades.position.z=0.7;f.add(fanBlades);f.position.set(W/2-5,H+2.6,D/2-1);f.rotation.x=-0.5;decorG.add(f);hitbox(7,7,4,W/2-5,H+2.6,D/2-1);}
  TG('feeder');
  if(tk.gear.feeder){const fd=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),M.gray);fd.position.set(-W*0.1,H+1.5,-D/2+2.5);decorG.add(fd);}
  TG('light');
  let lampParts=[];
  if(tk.eq.light){const L=new THREE.Mesh(new THREE.BoxGeometry(W-1,1.1,6),tk.eq.light==='plant'?M.gray:M.black);L.position.set(0,H+4.5,0);decorG.add(L);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(W-2,4.4),M.lamp);face.rotation.x=Math.PI/2;face.position.set(0,H+3.93,0);decorG.add(face);lampParts.push(L,face);
    for(const s of[-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,4.5,6),M.gray);leg.position.set(s*(W/2-1),H+2.25,0);decorG.add(leg);lampParts.push(leg);}hitbox(W,4,9,0,H+4.5,0);}
  TG(null);
  decorG.traverse(o=>{if(o.isMesh&&o.material&&o.material.visible!==false&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;}});
  for(const o of lampParts)o.castShadow=false;
  refreshHits();
  sig=tankSig(tk);renderer.shadowMap.needsUpdate=true;
}

/* ---------- shrimp: one swept body, instanced ---------- */
function shrimpGeometry(){
  const P=[],N=[],A=[],SS=[],WW=[],I=[];
  const push=(g,part,f)=>{const b=P.length/3,p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);N.push(n.getX(i),n.getY(i),n.getZ(i));const r=f(x,y,z,i);A.push(part);SS.push(r[0]);WW.push(r[1]);}
    if(g.index)for(let i=0;i<g.index.count;i++)I.push(b+g.index.getX(i));else for(let i=0;i<p.count;i++)I.push(b+i);g.dispose();};
  const X0=-1.45,LEN=2.65;
  const TB=[[0,.1,.03],[.08,.16,.08],[.2,.23,.15],[.35,.29,.2],[.5,.33,.2],[.6,.38,.18],[.7,.42,.17],[.82,.41,.17],[.92,.33,.17],[.97,.22,.18],[1,.05,.19]];
  const prof=s=>{let i=0;while(i<TB.length-2&&TB[i+1][0]<s)i++;const a=TB[i],b=TB[i+1];let t=clamp((s-a[0])/(b[0]-a[0]),0,1);t=t*t*(3-2*t);return[a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
  const NS=48,NA=10;const bp=[],bi=[];
  for(let i=0;i<=NS;i++){const s=i/NS;let[h,yc]=prof(s);if(s>0.04&&s<0.58){const u=((s-0.04)/0.09)%1;h*=0.955+0.08*u;}const w=h*(s<0.58?0.66:0.76);
    for(let j=0;j<=NA;j++){const a=j/NA*Math.PI*2,sa=Math.sin(a),ca=Math.cos(a);bp.push(X0+LEN*s,yc+h*sa*(sa<0?0.7:1),w*ca);}}
  for(let i=0;i<NS;i++)for(let j=0;j<NA;j++){const a=i*(NA+1)+j,b=a+NA+1;bi.push(a,b,a+1,b,b+1,a+1);}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));body.setIndex(bi);body.computeVertexNormals();
  const bn=body.attributes.normal;for(let i=0;i<=NS;i++){const a=i*(NA+1),b=a+NA;const x=(bn.getX(a)+bn.getX(b))/2,y=(bn.getY(a)+bn.getY(b))/2,z=(bn.getZ(a)+bn.getZ(b))/2;bn.setXYZ(a,x,y,z);bn.setXYZ(b,x,y,z);}
  push(body,0,(x)=>[(x-X0)/LEN,0]);
  for(const[ry,len,wd,sz]of[[0,0.48,0.1,0],[0.3,0.44,0.12,0.04],[-0.3,0.44,0.12,-0.04],[0.6,0.38,0.1,0.05],[-0.6,0.38,0.1,-0.05]]){
    const g=new THREE.SphereGeometry(1,8,4);g.scale(len,0.03,wd);g.translate(-len*0.85,0,0);g.rotateY(ry);g.translate(X0+0.1,0.04,sz);push(g,1,(x)=>[0,clamp((X0-x)/0.5,0,1)]);}
  {const g=new THREE.ConeGeometry(0.045,0.55,5);g.rotateZ(-Math.PI/2+0.12);g.translate(X0+LEN+0.18,0.23,0);push(g,0,()=>[1,0]);}
  for(const sg of[-1,1]){const e=new THREE.SphereGeometry(0.085,8,6);e.translate(X0+LEN-0.13,0.26,sg*0.16);push(e,5,()=>[1,0]);
    const c=new THREE.CatmullRomCurve3([new V3(1.1,.22,.05*sg),new V3(1.6,.42,.2*sg),new V3(2.2,.52,.5*sg),new V3(2.8,.45,.95*sg),new V3(3.15,.3,1.5*sg)]);
    push(new THREE.TubeGeometry(c,16,0.018,3,false),4,(x,y,z,i)=>[1,Math.floor(i/4)/16]);
    const c2=new THREE.CatmullRomCurve3([new V3(1.12,.25,.03*sg),new V3(1.45,.37,.1*sg),new V3(1.78,.37,.21*sg)]);
    push(new THREE.TubeGeometry(c2,8,0.013,3,false),4,(x,y,z,i)=>[1,Math.floor(i/4)/16]);
    for(let k=0;k<5;k++){const s=0.64+k*0.075,x=X0+LEN*s;const[h,yc]=prof(s);const top=yc-h*0.5;const L=0.62+k*0.03;
      const g=new THREE.CylinderGeometry(0.013,0.024,L,4);g.translate(0,-L/2,0);g.rotateX(-sg*0.6);g.rotateZ((k-2)*0.16);g.translate(x,top,sg*h*0.45);push(g,3,(X,Y)=>[s,clamp((top-Y)/L,0,1)]);}
    for(let k=0;k<5;k++){const s=0.12+k*0.085,x=X0+LEN*s;const[h,yc]=prof(s);const top=yc-h*0.6;
      const g=new THREE.SphereGeometry(0.075,5,3);g.scale(0.7,1.5,0.3);g.translate(0,-0.09,0);g.rotateX(-sg*0.25);g.translate(x,top,sg*0.07);push(g,2,(X,Y)=>[s,clamp((top-Y)/0.26,0,1)]);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('aPart',new THREE.Float32BufferAttribute(A,1));g.setAttribute('aS',new THREE.Float32BufferAttribute(SS,1));g.setAttribute('aW',new THREE.Float32BufferAttribute(WW,1));g.setIndex(I);
  g.computeBoundingSphere();g.computeBoundingBox();return g;}
const GEO_SHRIMP=shrimpGeometry();GEO_SHRIMP.keep=true;
function shrimpGeoView(n){const g=new THREE.BufferGeometry();for(const k of['position','normal','aPart','aS','aW'])g.setAttribute(k,GEO_SHRIMP.attributes[k]);g.setIndex(GEO_SHRIMP.index);
  g.boundingSphere=GEO_SHRIMP.boundingSphere;g.boundingBox=GEO_SHRIMP.boundingBox;const a=new THREE.InstancedBufferAttribute(new Float32Array(n*4),4);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute('iAnim',a);g.keep=true;return g;}
const MAT_SHRIMP=patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.36,metalness:0}),{shrimp:true});
const eggParts=[];for(let i=0;i<18;i++){const e=new THREE.SphereGeometry(0.075,6,4);e.translate(-0.78+(i%9)*0.07,-0.08-(i%2)*0.05,(i<9?-1:1)*0.085);e.deleteAttribute('uv');eggParts.push(e);}
const GEO_EGG=mergeGeos(eggParts);GEO_EGG.keep=true;
const MAT_EGG=patchMat(new THREE.MeshStandardMaterial({color:lc(0xd9b43a),roughness:0.35,emissive:lc(0x3a2a00)}),{});
const MAT_EYE=M.black;
const PALE=new THREE.Color(0xd8cfbd);const colCache={};
function shrimpColor(s){const m=SIM.morphOf(s);const g=clamp(s.grade*(s.sex==='M'?0.72:1),0,1);const b=Math.round(g*6);const key=m+b;
  if(colCache[key])return colCache[key];const c=PALE.clone().lerp(new THREE.Color(SIM.MORPH[m].hex),0.5+0.5*b/6).convertSRGBToLinear();return colCache[key]=c;}
/* a single-instance shrimp mesh for thumbnails (same geometry and material as the tank) */
let TSH=null;
function shrimpThumbMesh(col,rili){if(!TSH){TSH=new THREE.InstancedMesh(shrimpGeoView(1),MAT_SHRIMP,1);TSH.setMatrixAt(0,new THREE.Matrix4());TSH.setColorAt(0,new THREE.Color());TSH.frustumCulled=false;}
  TSH.setColorAt(0,col);TSH.instanceColor.needsUpdate=true;const a=TSH.geometry.attributes.iAnim;a.setXYZW(0,0.6,rili?1:0,0.02,0);a.needsUpdate=true;return TSH;}

const SCAP=160;
const shrimpI=new THREE.InstancedMesh(shrimpGeoView(SCAP),MAT_SHRIMP,SCAP);shrimpI.setColorAt(0,new THREE.Color());shrimpI.count=0;shrimpI.frustumCulled=false;shrimpG.add(shrimpI);
const eggI=new THREE.InstancedMesh(GEO_EGG,MAT_EGG,SCAP);eggI.count=0;eggI.frustumCulled=false;shrimpG.add(eggI);
const blobI=new THREE.InstancedMesh((()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})(),MK.blob,SCAP+60);blobI.count=0;blobI.frustumCulled=false;blobI.renderOrder=1;shrimpG.add(blobI);
const instIds=[];

const SH=new Map();let shrimpIndex=new Map();
function spawnPos(){return[(Math.random()-0.5)*(G.W-5),(Math.random()-0.5)*(G.D-5)];}
function syncShrimp(tk){
  shrimpIndex=new Map();const vis=tk.shrimp.slice(0,SCAP);for(const s of vis)shrimpIndex.set(s.id,s);
  for(const[id]of SH)if(!shrimpIndex.has(id))SH.delete(id);
  for(const s of vis){let b=SH.get(s.id);
    if(!b){let[x,z]=spawnPos();if(s.age<1&&s.pa){const mom=SH.get(s.pa[0]);if(mom){x=mom.x+(Math.random()-0.5)*2;z=mom.z+(Math.random()-0.5)*2;}}
      b={id:s.id,x,z,y:groundY(x,z),vx:0,vz:0,sp:0,hd:Math.random()*6.28,tx:x,tz:z,mode:'walk',tm:0,sy:0,ph:Math.random()*10,curl:0,act:0,pitch:0,dart:0};
      SH.set(s.id,b);newTarget(b,tk);}
    b.col=shrimpColor(s);b.rili=SIM.isRili(s);b.ber=!!s.ber;b.sz=SIM.sizeOf(s)*1.6*(s.sex==='F'?1.08:0.95);}
}
function clearShrimp(){SH.clear();shrimpI.count=eggI.count=0;}
function newTarget(b,tk){
  if(tk.food+tk.powder>2&&Math.random()<0.6){b.tx=tk.foodSpot[0]*G.W+(Math.random()-0.5)*3;b.tz=tk.foodSpot[1]*G.D+(Math.random()-0.5)*3;}
  else{const r=4+Math.random()*8,a=Math.random()*6.28;b.tx=b.x+Math.cos(a)*r;b.tz=b.z+Math.sin(a)*r;}
  b.tx=clamp(b.tx,-G.W/2+1.5,G.W/2-1.5);b.tz=clamp(b.tz,-G.D/2+1.5,G.D/2-1.5);
}
function angLerp(a,b,t){let d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t;}
function angDiff(a,b){return((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;}
const tmpO=new THREE.Object3D();
function updateShrimp(dt,tk,time){
  const stressy=tk.stress>1.2,wTop=G.wTop,ia=shrimpI.geometry.attributes.iAnim.array;let n=0,ne=0;instIds.length=0;
  for(const[,b]of SH){const s=shrimpIndex.get(b.id);if(!s)continue;const z=b.sz;
    const gY=groundY(b.x,b.z)+0.4*z;b.tm-=dt;
    const dx=b.tx-b.x,dz=b.tz-b.z,dist=Math.hypot(dx,dz);let want=0,turn=4,actT=0,curlT=0.03,pitchT=0;
    if(b.mode==='graze'){if(b.tm<=0){b.mode='walk';newTarget(b,tk);}b.y+=(gY-b.y)*Math.min(1,dt*4);actT=0.15;pitchT=-0.12+0.1*Math.sin(time*9+b.ph);}
    else if(b.mode==='walk'){if(dist<0.4){b.mode='graze';b.tm=1.5+Math.random()*4;}
      else{want=1.3*z*Math.min(1,dist/1.6);b.hd=angLerp(b.hd,Math.atan2(-dz,dx),Math.min(1,dt*turn));want*=Math.max(0.1,Math.cos(angDiff(b.hd,Math.atan2(-dz,dx))));actT=0.6;}
      b.y+=(gY-b.y)*Math.min(1,dt*6);
      if(Math.random()<(stressy?0.25:0.015)*dt){b.mode='swim';b.sy=Math.min(wTop-1,gY+3+Math.random()*(wTop-gY-4));newTarget(b,tk);}
      else if(Math.random()<(stressy?0.08:0.006)*dt){b.mode='dart';b.dart=0.45;b.sp=-11*z;b.curl=1;b.sy=Math.min(wTop-1.5,b.y+1.5+Math.random()*3);}}
    else if(b.mode==='swim'){if(dist>0.4){want=4.5*z;b.hd=angLerp(b.hd,Math.atan2(-dz,dx),Math.min(1,dt*3));want*=Math.max(0.2,Math.cos(angDiff(b.hd,Math.atan2(-dz,dx))));}
      b.y+=(b.sy-b.y)*Math.min(1,dt*1.6);actT=1;pitchT=clamp((b.sy-b.y)*0.08,-0.3,0.3);if(dist<0.5&&Math.abs(b.y-b.sy)<0.5)b.mode='fall';}
    else if(b.mode==='dart'){b.dart-=dt;b.y+=(b.sy-b.y)*Math.min(1,dt*3);curlT=0.3;actT=0.4;if(b.dart<=0){b.mode='fall';}}
    else if(b.mode==='fall'){b.y-=1.6*dt;actT=0.25;want=0.3*z;if(b.y<=gY){b.y=gY;b.mode='walk';newTarget(b,tk);}}
    if(b.mode==='dart')b.sp*=Math.exp(-dt*5);else b.sp+=clamp(want-b.sp,-5*z*dt,3*z*dt);
    b.x+=Math.cos(b.hd)*b.sp*dt;b.z-=Math.sin(b.hd)*b.sp*dt;
    if(Math.abs(b.x)>G.W/2-1.2||Math.abs(b.z)>G.D/2-1.2){b.x=clamp(b.x,-G.W/2+1.2,G.W/2-1.2);b.z=clamp(b.z,-G.D/2+1.2,G.D/2-1.2);if(b.mode==='walk')newTarget(b,tk);}
    if(b.y<gY-0.01&&b.mode!=='fall')b.y=gY;
    b.curl+=(curlT-b.curl)*Math.min(1,dt*(b.curl>curlT?4:8));b.act+=(actT-b.act)*Math.min(1,dt*3);
    if(b.mode==='walk'||b.mode==='graze'){const fx=Math.cos(b.hd),fz=-Math.sin(b.hd);pitchT+=Math.atan2(groundY(b.x+fx,b.z+fz)-groundY(b.x-fx,b.z-fz),2);}
    b.pitch+=(pitchT-b.pitch)*Math.min(1,dt*5);
    tmpO.position.set(b.x,b.y,b.z);tmpO.rotation.set(0,b.hd,b.pitch);tmpO.scale.setScalar(z);tmpO.updateMatrix();
    shrimpI.setMatrixAt(n,tmpO.matrix);shrimpI.setColorAt(n,b.col);
    ia[n*4]=b.ph;ia[n*4+1]=(b.rili?1:0)+(b.id===selId?2:0);ia[n*4+2]=b.curl;ia[n*4+3]=b.act;
    if(b.ber&&s.sex==='F')eggI.setMatrixAt(ne++,tmpO.matrix);
    const gy=groundY(b.x,b.z),hgt=Math.max(0,b.y-gy),bs=z*(2.2+hgt*0.12);tmpO.position.set(b.x-0.2*Math.cos(b.hd)*z,gy+0.06,b.z+0.2*Math.sin(b.hd)*z);tmpO.rotation.set(0,b.hd,0);tmpO.scale.set(bs*1.5/(1+hgt*0.05),1,bs*0.6/(1+hgt*0.05));tmpO.updateMatrix();blobI.setMatrixAt(n,tmpO.matrix);
    instIds[n++]=b.id;}
  shrimpI.count=n;eggI.count=ne;blobI.count=n;
  shrimpI.instanceMatrix.needsUpdate=true;if(shrimpI.instanceColor)shrimpI.instanceColor.needsUpdate=true;shrimpI.geometry.attributes.iAnim.needsUpdate=true;eggI.instanceMatrix.needsUpdate=true;
}

/* ---------- snails, planaria (instanced, shared geometry) ---------- */
const RAM_GEO=(function(){const pts=[];for(let i=0;i<=40;i++){const t=i/40,a=t*Math.PI*3.4,R=0.08+0.32*t;pts.push(new V3(Math.cos(a)*R,Math.sin(a)*R,(1-t)*0.12));}
  const g=taperTube(new THREE.CatmullRomCurve3(pts),48,0.26,8,t=>0.25+0.75*t,0);g.translate(0,0.5,0);const foot=new THREE.SphereGeometry(0.3,8,5);foot.scale(1.6,0.45,0.7);foot.translate(0.25,0.12,0);
  g.deleteAttribute('uv');foot.deleteAttribute('uv');const m=mergeGeos([g,foot]);m.keep=true;return m;})();
const NER_GEO=(function(){const g=new THREE.SphereGeometry(0.65,14,7,0,6.283,0,1.5708);g.scale(1,0.8,0.85);g.keep=true;return g;})();
const ramI=new THREE.InstancedMesh(RAM_GEO,M.ram,36),nerI=new THREE.InstancedMesh(NER_GEO,MK.ner,12),planI=new THREE.InstancedMesh(new THREE.SphereGeometry(0.2,6,4),M.plan,24);
for(const m of[ramI,nerI,planI]){m.count=0;m.frustumCulled=false;snailG.add(m);}
const SN=[];let planP=[];
function syncSnails(tk){
  const want={ram:Math.min(36,tk.snails.ram),ner:Math.min(12,tk.snails.ner)};
  for(const type of['ram','ner']){let have=SN.filter(s=>s.type===type);
    while(have.length>want[type]){const s=have.pop();SN.splice(SN.indexOf(s),1);}
    while(have.length<want[type]){const[x,z]=spawnPos();const s={type,x,z,hd:Math.random()*6.28,t:Math.random()*20};SN.push(s);have.push(s);}}
  const np=Math.min(24,Math.floor(tk.plan*2));
  if(planP.length!==np){while(planP.length>np)planP.pop();while(planP.length<np)planP.push([(Math.random()-0.5)*(G.W-3),3+Math.random()*(G.wTop-6),Math.random()*3]);
    planP.forEach((p,i)=>{tmpO.position.set(p[0],p[1],G.D/2-0.35);tmpO.rotation.set(0,0,p[2]);tmpO.scale.set(3,1,0.5);tmpO.updateMatrix();planI.setMatrixAt(i,tmpO.matrix);});planI.count=np;planI.instanceMatrix.needsUpdate=true;}
}
function clearSnails(){SN.length=0;planP=[];ramI.count=nerI.count=planI.count=0;}
function updateSnails(dt){let nr=0,nn=0,nb=blobI.count;
  for(const s of SN){s.t-=dt;if(s.t<0){s.hd+=(Math.random()-0.5)*2;s.t=3+Math.random()*6;}
    s.x=clamp(s.x+Math.cos(s.hd)*0.25*dt,-G.W/2+1,G.W/2-1);s.z=clamp(s.z-Math.sin(s.hd)*0.25*dt,-G.D/2+1,G.D/2-1);
    const gy=groundY(s.x,s.z);tmpO.position.set(s.x,gy+(s.type==='ram'?0.05:0),s.z);tmpO.rotation.set(0,s.hd,0);tmpO.scale.setScalar(1);tmpO.updateMatrix();
    if(s.type==='ram')ramI.setMatrixAt(nr++,tmpO.matrix);else nerI.setMatrixAt(nn++,tmpO.matrix);
    if(nb<blobI.instanceMatrix.count){tmpO.position.y=gy+0.06;tmpO.scale.set(1.6,1,1.3);tmpO.updateMatrix();blobI.setMatrixAt(nb++,tmpO.matrix);}}
  ramI.count=nr;nerI.count=nn;blobI.count=nb;ramI.instanceMatrix.needsUpdate=nerI.instanceMatrix.needsUpdate=true;blobI.instanceMatrix.needsUpdate=true;}

/* selection ring */
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,0.07,6,32),M.ring);ring.rotation.x=Math.PI/2;ring.renderOrder=10;ring.visible=false;scene.add(ring);

/* ---------- camera orbit ---------- */
const cam={th:0.35,ph:1.12,r:78,zr:78,tgt:new V3(0,11,0),off:0,vth:0,vph:0,sth:0,sph:0,idle:0,sway:0};let userZoom=false,camGoal=null;const LAY={frac:0.7,off:0};let layoutT=0;
function camPreset(ph,th){if(ROOM.on){ROOM.on=false;ROOM.tgt=null;cam.tgt.set(0,G.H*0.36,0);}camGoal={ph,th};userZoom=false;cam.vth=cam.vph=0;layoutSoon();}
// Su içi: karides hizasında, camın hemen önünde (rMin içeri girmeyi engeller). Tekrar basınca varsayılan görünüme döner.
function camUnder(){const under=userZoom&&Math.abs(cam.ph-1.47)<0.06&&cam.zr<=rMin(cam.th,cam.ph)+1;
  if(under){camPreset(1.12,0.35);return;}if(ROOM.on){ROOM.on=false;ROOM.tgt=null;cam.tgt.set(0,G.H*0.36,0);}camGoal={ph:1.47,th:cam.th};userZoom=true;cam.zr=0;cam.vth=cam.vph=0;layoutSoon();}
const camF=new THREE.PerspectiveCamera(42,1,0.5,900),fitP=new V3(),fitD=new V3();let fitKey='',fitVal=80;
function camDir(th,ph,o){return o.set(Math.sin(ph)*Math.sin(th),Math.cos(ph),Math.sin(ph)*Math.cos(th));}
function rMin(th,ph){camDir(th,ph,fitD);const t=cam.tgt;const hx=G.W/2+1.5,hz=G.D/2+1.5,y0=-1,y1=G.H+7;let te=1e9;
  if(fitD.x>1e-4)te=Math.min(te,(hx-t.x)/fitD.x);else if(fitD.x<-1e-4)te=Math.min(te,(-hx-t.x)/fitD.x);
  if(fitD.z>1e-4)te=Math.min(te,(hz-t.z)/fitD.z);else if(fitD.z<-1e-4)te=Math.min(te,(-hz-t.z)/fitD.z);
  if(fitD.y>1e-4)te=Math.min(te,(y1-t.y)/fitD.y);else if(fitD.y<-1e-4)te=Math.min(te,(y0-t.y)/fitD.y);return te+2;}
// Uzaklık dönüş açısından bağımsızdır: tank her yönden çevrildiğinde ekrana sığacak en büyük uzaklık seçilir,
// böylece köşeye ya da yana dönünce kamera kendiliğinden yaklaşmaz/uzaklaşmaz.
function fitR(){const a=innerWidth/Math.max(1,innerHeight),f=clamp(LAY.frac,0.45,1),ph=camGoal?camGoal.ph:cam.ph;
  const key=[a.toFixed(3),f.toFixed(3),ph.toFixed(2),G.W,G.H,G.D,cam.tgt.y].join();if(key===fitKey)return fitVal;
  let best=20;for(let k=0;k<8;k++)best=Math.max(best,fitAt(a,f,ph,k*Math.PI/8));
  fitKey=key;return fitVal=clamp(best,20,400);}
function fitAt(a,f,ph,th){
  camF.aspect=a;camF.updateProjectionMatrix();camDir(th,ph,fitD);const d=fitD.clone();const hw=G.W/2+0.6,hd=G.D/2+0.6,top=G.H+(T().eq.light?5.6:1);
  const fits=r=>{camF.position.copy(cam.tgt).addScaledVector(d,r);camF.lookAt(cam.tgt);camF.updateMatrixWorld();
    for(let i=0;i<8;i++){fitP.set(i&1?hw:-hw,i&2?top:0,i&4?hd:-hd).applyMatrix4(camF.matrixWorldInverse);if(fitP.z>-1)return false;fitP.applyMatrix4(camF.projectionMatrix);
      if(Math.abs(fitP.x)>0.97||Math.abs(fitP.y)>f*0.96)return false;}return true;};
  let lo=5,hi=700;for(let it=0;it<22;it++){const r=(lo+hi)/2;if(fits(r))hi=r;else lo=r;}
  return Math.max(hi,rMin(th,ph));}
function placeCam(){const{tgt,r}=cam;const th=cam.th+cam.sth,ph=clamp(cam.ph+cam.sph,0.3,1.55);camera.position.set(tgt.x+r*Math.sin(ph)*Math.sin(th),tgt.y+r*Math.cos(ph),tgt.z+r*Math.sin(ph)*Math.cos(th));camera.lookAt(tgt);}
const ptrs=new Map();let drag=null,pinch=null;
canvas.addEventListener('pointerdown',e=>{try{canvas.setPointerCapture(e.pointerId)}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cam.idle=0;cam.vth=cam.vph=0;
  if(ptrs.size===1)drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:0,t:performance.now(),vth:0,vph:0};
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),r:cam.r};drag=null;}});
canvas.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cam.idle=0;
  if(pinch&&ptrs.size===2){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);cam.zr=clamp(pinch.r*pinch.d/Math.max(20,d),rMin(cam.th,cam.ph),ROOM.on?760:320);userZoom=true;return;}
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y,now=performance.now(),dtm=Math.max(8,now-drag.t)/1000;drag.x=e.clientX;drag.y=e.clientY;drag.t=now;drag.moved+=Math.abs(dx)+Math.abs(dy);
    if(typeof roomPan==='function'&&roomPan(dx))return;
    const dth=-dx*0.006,dph=-dy*0.005;cam.th+=dth;cam.ph=clamp(cam.ph+dph,0.35,1.52);camGoal=null;
    drag.vth=drag.vth*0.5+0.5*dth/dtm;drag.vph=drag.vph*0.5+0.5*dph/dtm;}});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(drag&&ptrs.size===0){if(drag.moved<8)onTap(e.clientX,e.clientY);else if(performance.now()-drag.t<90&&!RM.matches){cam.vth=clamp(drag.vth,-5,5);cam.vph=clamp(drag.vph,-3,3);}}
  if(ptrs.size<2)pinch=null;if(ptrs.size===0)drag=null;}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.idle=0;cam.zr=clamp(cam.r*(1+Math.sign(e.deltaY)*0.1),rMin(cam.th,cam.ph),ROOM.on?760:320);userZoom=true;},{passive:false});

let selId=null;
const pickRC=new THREE.Raycaster(),pickN=new THREE.Vector2();
// Karideslere doğrudan isabet eden ışın (en yakın isabet ve uzaklığı)
function shrimpRay(cx,cy){if(!shrimpI.count)return null;pickN.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);pickRC.setFromCamera(pickN,camera);const hs=pickRC.intersectObject(shrimpI,false);
  if(!hs.length||hs[0].instanceId==null)return null;const b=SH.get(instIds[hs[0].instanceId]);return b?{b,d:hs[0].distance}:null;}
function selectShrimp(b){selId=b?b.id:null;if(b)sfx.tap();renderSel();return !!b;}
function pickAt(cx,cy){let best=null;
  if(shrimpI.count){pickN.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);pickRC.setFromCamera(pickN,camera);const hs=pickRC.intersectObject(shrimpI,false);
    if(hs.length&&hs[0].instanceId!=null){const id=instIds[hs[0].instanceId];best=SH.get(id)||null;}}
  if(!best){const v=new V3();let bd=34;
    for(const[,b]of SH){v.set(b.x,b.y,b.z).project(camera);if(v.z>1)continue;const x=(v.x+1)/2*innerWidth,y=(1-v.y)/2*innerHeight;const d=Math.hypot(x-cx,y-cy);if(d<bd){bd=d;best=b;}}}
  selId=best?best.id:null;if(best)sfx.tap();renderSel();return !!best;}

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();SPECK.uniforms.uPx.value=PR*h/800;fitKey='';layoutSoon();}
addEventListener('resize',resize);

/* ---------- per-frame visual state ---------- */
const cA=lc(0x2e7f8a),cTan=lc(0x8a5a1c),cCloud=lc(0xa9b8b0);
/* adaptive pixel ratio: 2 -> 1.5 when the display rate stays low while we are actually rendering.
   Own rAF chain, since the boot loop deliberately throttles idle/covered frames. */
const PF={t:0,n:0,slow:0,lt:0,ren:false};
(function(){function f(t){if(PF.lt&&PF.ren){const d=t-PF.lt;if(d<250){PF.t+=d;PF.n++;}}PF.lt=t;PF.ren=false;
  if(PF.n>=90){if(PF.t/PF.n>24&&PR>1.5){if(++PF.slow>=2){PR=1.5;renderer.setPixelRatio(PR);resize();}}else PF.slow=0;PF.t=PF.n=0;}
  if(PR>1.5)requestAnimationFrame(f);}if(PR>1.5)requestAnimationFrame(f);})();
let syncT=0;
// Gece de oda zifiri karanlık olmaz: loş, mavimsi bir ay ışığı kalır.
const NIGHT_K=0.3;function roomK(h){if(h>=8&&h<19)return 1;if(h>=19&&h<22.5)return 1-(1-NIGHT_K)*(h-19)/3.5;if(h>=6.5&&h<8)return NIGHT_K+(1-NIGHT_K)*(h-6.5)/1.5;return NIGHT_K;}
function updWater(tk){const tan=Math.min(0.8,tk.tan*1.2),cloud=Math.min(0.5,Math.max(0,tk.NH3-0.3)*0.5+(tk.det>30*tk.vol/20?0.15:0));
  U.uWCol.value.copy(cA).lerp(cTan,tan).lerp(cCloud,cloud);U.uWDen.value=0.016+tk.tan*0.05+cloud*0.06+Math.min(0.02,tk.det/(400*tk.vol/20)*0.1);
  GLASS.uniforms.uAlg.value=Math.min(1,tk.algae*1.25);SPECK.uniforms.uA.value=0.45+cloud;
  WATER.uniforms.uAgit.value=(tk.eq.filter?0.8:0.4)+(tk.gear.air?0.5:0)+(tk.eq.filter==='canister'?0.3:0);U.uSway.value=(RM.matches?0.3:1)*(tk.eq.filter?1:0.5);}
function updateScene(dt,time){
  const tk=T();
  if(builtFor!==tk.id||G.tkey!==tankKey(tk)){clearShrimp();clearSnails();buildTank(tk);}
  if(sig==='')buildDecor(tk);
  syncT-=dt;if(syncT<=0){syncT=0.4;if(tankSig(tk)!==sig)buildDecor(tk);syncShrimp(tk);syncSnails(tk);updPellets(tk);updWater(tk);}
  U.uTime.value=time;
  PF.ren=true;
  // room day/night + tank lamp
  const hr=(S.t+acc)%24,power=S.ev.out<=0;const k2=Math.min(1,dt*2);
  ENV.room+=(roomK(hr)-ENV.room)*k2;
  const mode=tk.lit?(tk.eq.light==='plant'?2:1):(tk.eq.light&&power&&ENV.room<0.4?3:0);
  if(mode!==ENV.mode){ENV.mode=mode;lamp.color.copy(mode===3?C_MOON:mode===2?C_PLANT:C_LAMP);M.lamp.emissive.copy(mode===3?C_MOON:mode===2?C_PLANT:C_LAMP);M.lamp.emissiveIntensity=mode===3?0.25:mode?1.3:0;}
  const lampT=[0,1.35,1.55,0.55][mode];ENV.lamp+=(lampT-ENV.lamp)*Math.min(1,dt*3);
  lamp.intensity=ENV.lamp;hemi.intensity=0.1+0.44*ENV.room;sun.intensity=0.55*ENV.room;fill.intensity=0.12*ENV.room;
  const bgK=ENV.room;if(Math.abs(bgK-(ENV.bgK||-1))>0.002){ENV.bgK=bgK;scene.background.copy(BG_NIGHT).lerp(BG_DAY,bgK);scene.fog.color.copy(scene.background);
    GLASS.uniforms.uEnv.value.copy(ENV.envNight).lerp(ENV.envDay,bgK);VIGN.material.uniforms.uK.value=0.5-0.2*bgK;}
  const lampK=mode===3?0.45:1;GLASS.uniforms.uLampCol.value.copy(lamp.color).multiplyScalar(ENV.lamp*lampK);
  U.uWL.value=0.05+ENV.lamp*0.5*lampK+ENV.room*0.28;U.uCaus.value=ENV.lamp*(mode===3?0.15:0.4);
  M.heater.emissiveIntensity=tk.heating&&power?0.9+0.2*Math.sin(time*3):0;
  if(fanBlades&&tk.cooling&&power)fanBlades.rotation.z+=dt*25;
  G.wTop=(G.H-2)*tk.level;
  U.uBMin.value.set(-G.W/2+0.25,0,-G.D/2+0.25);U.uBMax.value.set(G.W/2-0.25,G.wTop,G.D/2-0.25);
  const wet=tk.level>0.05;waterMesh.visible=menMesh.visible=speckPts.visible=wet;
  waterMesh.position.y=G.wTop;menMesh.position.y=G.wTop;if(frogMesh)frogMesh.position.y=G.wTop+0.04;
  // bubbles (+ yavru/yumurta haberinde birkaç saniyelik kabarcık patlaması, karideslerin arasından)
  if(joyT>0){joyT-=dt;if(!joyE.length||Math.random()<dt*3){const arr=[...SH.values()];if(arr.length){const b=arr[(Math.random()*arr.length)|0];joyE.push([b.x,b.z,b.y,0.8]);if(joyE.length>3)joyE.shift();}}}else if(joyE.length)joyE.length=0;
  const emit=joyE.length?emitters.concat(joyE):emitters;
  if(emit.length&&tk.level>0.05){const n=emit.length*20;bubbles.count=Math.min(40,n);const yy=bubbles.userData.y,oo=bubbles.userData.o;
    for(let i=0;i<bubbles.count;i++){const e=emit[i%emit.length];yy[i]+=dt*(6+(i%5));if(yy[i]>G.wTop||yy[i]<e[2])yy[i]=e[2]+Math.random()*0.5;
      tmpO.position.set(e[0]+oo[i*2]*e[3]+Math.sin(time*4+i)*0.12,yy[i],e[1]+oo[i*2+1]*e[3]);tmpO.rotation.set(0,0,0);const s=0.6+(i%4)*0.25;tmpO.scale.set(s,s,s);tmpO.updateMatrix();bubbles.setMatrixAt(i,tmpO.matrix);}
    bubbles.instanceMatrix.needsUpdate=true;}else bubbles.count=0;
  updateShrimp(dt,tk,time);updateSnails(dt);
  const sb=selId&&SH.get(selId);ring.visible=!!sb;if(sb){ring.position.set(sb.x,sb.y-0.3,sb.z);ring.rotation.z+=dt;const s=0.8+SIM.sizeOf(shrimpIndex.get(selId)||{age:60});ring.scale.setScalar(s);}
  // camera: preset tween, inertia, eased zoom, idle sway, no entering the tank
  const rmo=RM.matches;
  if(camGoal){const k=rmo?1:Math.min(1,dt*5);cam.ph+=(camGoal.ph-cam.ph)*k;cam.th=angLerp(cam.th,camGoal.th,k);if(Math.abs(camGoal.ph-cam.ph)<0.002&&Math.abs(angDiff(cam.th,camGoal.th))<0.002)camGoal=null;}
  if(!drag&&(cam.vth||cam.vph)){cam.th+=cam.vth*dt;cam.ph=clamp(cam.ph+cam.vph*dt,0.35,1.52);const d=Math.exp(-dt*4.5);cam.vth*=d;cam.vph*=d;if(Math.abs(cam.vth)+Math.abs(cam.vph)<0.01)cam.vth=cam.vph=0;}
  const rm=rMin(cam.th,cam.ph);if(userZoom)cam.zr=Math.min(cam.zr,ROOM.on?760:320);
  const rG=Math.max(userZoom?cam.zr:fitR(),rm);cam.r+=(rG-cam.r)*(rmo?1:Math.min(1,dt*8));if(cam.r<rm)cam.r=rm;
  cam.idle+=dt;cam.sway+=((cam.idle>6&&!camGoal&&!rmo&&!drag?1:0)-cam.sway)*Math.min(1,dt*0.5);cam.sth=cam.sway*0.05*Math.sin(time*0.13);cam.sph=cam.sway*0.015*Math.sin(time*0.09+1);
  const offT=clamp(LAY.off,-innerHeight*0.22,innerHeight*0.22);cam.off+=(offT-cam.off)*Math.min(1,dt*6);
  if(Math.abs(cam.off)>0.5)camera.setViewOffset(innerWidth,innerHeight,0,cam.off,innerWidth,innerHeight);else camera.clearViewOffset();
  updateRoom();if(ROOM.on&&ROOM.tgt)cam.tgt.lerp(ROOM.tgt,rmo?1:Math.min(1,dt*4));
  placeCam();
}
function updPellets(tk){
  const fx=tk.foodSpot[0]*G.W,fz=tk.foodSpot[1]*G.D;
  const n=Math.min(16,Math.ceil(tk.food/2.5));pellets.count=n;
  for(let i=0;i<n;i++){const a=i*2.39,r=0.4+(i%5)*0.35;const x=fx+Math.cos(a)*r,z=fz+Math.sin(a)*r;tmpO.position.set(x,groundY(x,z)+0.2,z);tmpO.rotation.set(Math.PI/2,a,0);tmpO.scale.set(1,1,1);tmpO.updateMatrix();pellets.setMatrixAt(i,tmpO.matrix);}
  pellets.instanceMatrix.needsUpdate=true;
  const m=Math.min(24,Math.ceil(tk.powder));powders.count=m;
  for(let i=0;i<m;i++){const a=i*1.7,r=0.3+(i%7)*0.4;const x=fx+Math.cos(a)*r,z=fz+Math.sin(a)*r;tmpO.position.set(x,groundY(x,z)+0.1,z);tmpO.rotation.set(0,0,0);tmpO.scale.set(1,1,1);tmpO.updateMatrix();powders.setMatrixAt(i,tmpO.matrix);}
  powders.instanceMatrix.needsUpdate=true;
}
window.__ncScene={cam:()=>({r:cam.r,th:cam.th,ph:cam.ph,user:userZoom}),info:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,pr:PR,progs:renderer.info.programs.length}),dbg:()=>({n:shrimpI.count,col:shrimpI.instanceColor&&Array.from(shrimpI.instanceColor.array.slice(0,9)),anim:Array.from(shrimpI.geometry.attributes.iAnim.array.slice(0,8)),parts:Array.from(new Set(GEO_SHRIMP.attributes.aPart.array))})};

