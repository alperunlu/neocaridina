/* ================= thumbnails (mini 3D renders for cards) ================= */
const TM=(()=>{const m=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r},o||{}));
  const t={plastic:m(0xf3efe6,0.5),dark:m(0x2a2b2e,0.75),sponge:m(0x2e2e30,1,{flatShading:true}),
    jar:new THREE.MeshPhongMaterial({color:0xf4efe2,transparent:true,opacity:0.5,shininess:90,depthWrite:false}),
    glass:new THREE.MeshPhongMaterial({color:0xcfeef2,transparent:true,opacity:0.22,shininess:100,depthWrite:false,side:THREE.DoubleSide}),
    coil:m(0x7a3a1a,0.5,{emissive:0xff6a2a,emissiveIntensity:0.7}),lampW:m(0x444444,0.4,{emissive:0xfff3d6,emissiveIntensity:1}),lampP:m(0x444444,0.4,{emissive:0xffcfe8,emissiveIntensity:1}),
    silver:m(0xc3c7cb,0.35,{metalness:0.35}),purple:m(0x8a55b8,0.5),green:m(0x5aa449,0.5),blue:m(0x5a8fd8,0.45),orange:m(0xe98a2c,0.5),
    amber:new THREE.MeshPhongMaterial({color:0x9a5a1e,transparent:true,opacity:0.88,shininess:80}),water:new THREE.MeshPhongMaterial({color:0x8fd0e0,transparent:true,opacity:0.55}),
    strip:m(0xfaf7ee,0.6),red:m(0xd9483b,0.5),yellow:m(0xe8c24a,0.5),pink:m(0xe58fb8,0.5),mossG:m(0x4f7d2c,1,{flatShading:true}),mossL:m(0x6b9a36,1,{flatShading:true}),
    soil:m(0x3a2f27,1,{flatShading:true}),lock:m(0x4a3f33,0.95),shadow:new THREE.MeshBasicMaterial({color:0x5a3b20,transparent:true,opacity:0.16,depthWrite:false})};
  for(const k in t){const m=t[k];m.keep=true;if(m.color)m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();if(m.specular)m.specular.convertSRGBToLinear();}return t;})();
let TR=null;const THUMB=new Map();
const TW=320,THH=240,SS=2;
function thumbR(){if(TR!==null)return TR;
  try{const c=document.createElement('canvas');c.width=TW;c.height=THH;const ctx=c.getContext('2d');
    const big=document.createElement('canvas');big.width=TW*SS;big.height=THH*SS;const bctx=big.getContext('2d');
    const rt=new THREE.WebGLRenderTarget(TW*SS,THH*SS,{samples:0});rt.texture.encoding=THREE.sRGBEncoding;
    const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(lc(0xfff3e2),lc(0x7a5a3e),0.75));
    const d=new THREE.DirectionalLight(lc(0xfff1dc),1.15);d.position.set(-3,8,6);sc.add(d);const d2=new THREE.DirectionalLight(lc(0xcfe0ff),0.45);d2.position.set(6,3,-5);sc.add(d2);
    TR={sc,cm:new THREE.PerspectiveCamera(26,4/3,0.1,500),c,ctx,big,bctx,rt,buf:new Uint8Array(TW*SS*THH*SS*4),img:bctx.createImageData(TW*SS,THH*SS)};}catch(e){TR=false;}
  return TR;}
function thumbRender(R){const oc=renderer.getClearColor(new THREE.Color()),oa=renderer.getClearAlpha();
  // thumbnails sit at the origin, inside the tank's water box: switch off tint/caustics/sway while rendering
  const keep=[U.uTint.value,U.uCaus.value,U.uSway.value,U.uTime.value];U.uTint.value=0;U.uCaus.value=0;U.uSway.value=0;U.uTime.value=0;
  const w=TW*SS,h=THH*SS,row=w*4;
  try{renderer.setRenderTarget(R.rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(R.sc,R.cm);
    renderer.readRenderTargetPixels(R.rt,0,0,w,h,R.buf);}
  finally{renderer.setRenderTarget(null);renderer.setClearColor(oc,oa);U.uTint.value=keep[0];U.uCaus.value=keep[1];U.uSway.value=keep[2];U.uTime.value=keep[3];}
  const d=R.img.data,b=R.buf;for(let y=0;y<h;y++){const src=(h-1-y)*row,dst=y*row;for(let i=0;i<row;i+=4){const a=b[src+i+3];
    if(a>0&&a<255){d[dst+i]=Math.min(255,b[src+i]*255/a);d[dst+i+1]=Math.min(255,b[src+i+1]*255/a);d[dst+i+2]=Math.min(255,b[src+i+2]*255/a);}else{d[dst+i]=b[src+i];d[dst+i+1]=b[src+i+1];d[dst+i+2]=b[src+i+2];}d[dst+i+3]=a;}}
  R.bctx.putImageData(R.img,0,0);R.ctx.clearRect(0,0,TW,THH);R.ctx.imageSmoothingEnabled=true;if('imageSmoothingQuality'in R.ctx)R.ctx.imageSmoothingQuality='high';
  R.ctx.drawImage(R.big,0,0,TW,THH);return R.c.toDataURL('image/png');}
const CYL=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||18),BOX=(x,y,z)=>new THREE.BoxGeometry(x,y,z),SPH=(r,a,b,...q)=>new THREE.SphereGeometry(r,a||18,b||12,...q);
function put(g,geo,m,p,r,s){const o=new THREE.Mesh(geo,m);if(p)o.position.set(p[0],p[1],p[2]);if(r)o.rotation.set(r[0],r[1],r[2]);if(s)o.scale.set(s[0],s[1],s[2]);g.add(o);return o;}
function fakeShrimp(m,rili,g){const pair=Object.keys(SIM.COMBO).find(k=>SIM.COMBO[k]===m)||'WW';return{c:[pair[0],pair[1]],p:rili?['r','r']:['S','S'],grade:g,sex:'F'};}
function bottle(g,body,cap,x,h,r){put(g,CYL(r,r,h,22),body,[x,h/2,0]);put(g,SPH(r,22,10,0,6.283,0,1.5708),body,[x,h,0],null,[1,0.45,1]);put(g,CYL(r*0.42,r*0.42,r*0.7,16),body,[x,h+r*0.6,0]);put(g,CYL(r*0.5,r*0.5,r*0.6,16),cap,[x,h+r*1.15,0]);}
function thumbModel(key){
  const g=new THREE.Group();const[k,a,b,c]=key.split(':');const rnd=rng(key.length*97+key.charCodeAt(key.length-1));
  if(k==='s'||k==='lock'){const rili=b==='1'&&k!=='lock';const col=k==='lock'?lc(0x4a3f33):shrimpColor(fakeShrimp(a,rili,(+c||3)/6));
    const o=shrimpThumbMesh(col,rili);o.position.set(0,0,0);o.rotation.set(0.05,-0.25,0);o.scale.set(3,3,3);g.add(o);return g;}
  if(k==='f'){
    if(a==='sponge'){put(g,CYL(2.4,2.6,0.6),TM.dark,[0,0.3,0]);put(g,CYL(1.9,1.9,5.4,22),TM.sponge,[0,3.3,0]);put(g,CYL(0.34,0.34,6,10),TM.plastic,[0,8.9,0]);put(g,CYL(0.34,0.34,1.8,10),TM.plastic,[0.7,12,0],[0,0,-1]);}
    else if(a==='hob'){put(g,BOX(6,7,3.2),TM.dark,[0,5,0]);put(g,BOX(6,0.8,2.6),TM.dark,[0,8.1,2.4]);put(g,BOX(4.5,0.3,1.8),TM.plastic,[0,7.7,3.6]);put(g,CYL(0.45,0.45,8.5,12),TM.plastic,[-1.8,3.9,3.6]);put(g,CYL(0.75,0.75,1.5,14),TM.dark,[-1.8,0.1,3.6]);}
    else{put(g,CYL(3,3,9,26),TM.dark,[0,4.5,0]);put(g,CYL(3.25,3.25,1.4,26),TM.silver,[0,9.6,0]);put(g,new THREE.TorusGeometry(2,0.28,8,24,Math.PI),TM.dark,[0,10.2,0]);
      put(g,CYL(0.32,0.32,5,10),TM.plastic,[1.2,12.4,0],[0,0,-0.25]);put(g,CYL(0.32,0.32,5,10),TM.plastic,[-1.2,12.4,0],[0,0,0.25]);}}
  else if(k==='l'){const bar=a==='plant'?TM.silver:TM.dark;put(g,BOX(16,1,3.6),bar,[0,4.6,0]);put(g,BOX(15,0.14,2.9),a==='plant'?TM.lampP:TM.lampW,[0,4.05,0]);
    for(const s of[-1,1]){put(g,CYL(0.16,0.16,4.2,8),TM.silver,[s*7.4,2.2,0]);put(g,BOX(1,0.3,1.4),TM.dark,[s*7.4,0.15,0]);}}
  else if(k==='g'){
    if(a==='air'){put(g,BOX(4,2,2.6),TM.plastic,[0,1.2,0]);for(const x of[-1.5,1.5])for(const z of[-1,1])put(g,CYL(0.25,0.25,0.3,8),TM.dark,[x,0.15,z]);put(g,CYL(0.2,0.2,0.8,8),TM.dark,[1.6,2.5,0.6]);
      put(g,new THREE.TorusGeometry(1.4,0.12,8,32),TM.jar,[3.2,0.2,0.6],[Math.PI/2,0,0]);put(g,CYL(0.5,0.5,0.8,12),TM.soil,[4.6,0.4,0.6]);}
    else if(a==='heater'){put(g,CYL(0.8,0.8,10,20),TM.jar,[0,5.2,0]);put(g,CYL(0.42,0.42,8,12),TM.coil,[0,5,0]);put(g,CYL(0.95,0.95,1.6,18),TM.dark,[0,11,0]);put(g,CYL(0.5,0.5,0.5,14),TM.red,[0,12,0]);
      for(const y of[3,8])put(g,SPH(0.45),TM.jar,[0,y,-0.95],null,[1,1,0.5]);g.rotation.z=0.18;}
    else if(a==='fan'){put(g,BOX(5,4.5,1.2),TM.dark,[0,3.3,0]);const h=new THREE.Group();h.position.set(0,3.3,0.7);for(let i=0;i<3;i++)put(h,BOX(0.8,3.4,0.1),TM.silver,[0,0,0],[0,0,i*2.094]);put(h,CYL(0.5,0.5,0.3,14),TM.dark,[0,0,0.05],[Math.PI/2,0,0]);g.add(h);
      put(g,BOX(1.6,1.6,3),TM.dark,[0,0.8,-0.9]);g.rotation.y=-0.35;}
    else if(a==='thermo'){put(g,BOX(1,7,0.3),TM.strip,[0,3.5,0]);put(g,BOX(0.22,5.2,0.36),TM.red,[0,3.8,0]);put(g,SPH(0.38),TM.red,[0,1,0]);for(let i=0;i<9;i++)put(g,BOX(0.3,0.05,0.34),TM.dark,[0.3,1.8+i*0.6,0]);g.rotation.z=0.25;}
    else if(a==='tdsm'){put(g,BOX(1.6,7,1),TM.plastic,[0,3.9,0]);put(g,BOX(1.2,1.6,0.1),TM.dark,[0,5.4,0.52]);put(g,CYL(0.22,0.22,0.1,10),TM.blue,[0,3.9,0.52],[Math.PI/2,0,0]);put(g,BOX(1.64,1.5,1.04),TM.blue,[0,0.75,0]);g.rotation.z=-0.3;}
    else if(a==='lid'){put(g,BOX(12,0.35,7),TM.jar,[0,2,0]);put(g,BOX(12.2,0.5,0.5),TM.dark,[0,2,3.6]);put(g,BOX(12.2,0.5,0.5),TM.dark,[0,2,-3.6]);put(g,BOX(2.2,0.6,0.9),TM.dark,[0,2.45,0]);g.rotation.set(0.45,-0.35,0);}
    else if(a==='guard'){put(g,CYL(1.2,1.2,2.8,20),TM.sponge,[0,1.4,0]);put(g,CYL(0.45,0.45,3,12),TM.plastic,[0,4,0]);}
    else{put(g,BOX(4,3,3.2),TM.plastic,[0,1.5,0]);put(g,CYL(1.25,1.25,3.6,22),TM.jar,[0,3.6,0],[0,0,Math.PI/2]);for(let i=0;i<9;i++)put(g,CYL(0.18,0.18,0.6,6),M.pellet,[(rnd()-0.5)*2.6,3.1+rnd()*0.5,(rnd()-0.5)*1],[rnd()*3,rnd()*3,0]);
      put(g,BOX(1.2,0.8,0.1),TM.dark,[0,1.8,1.62]);}}
  else if(k==='sub'){const m=subMat(a);put(g,CYL(5,5.4,2.4,28),TM.dark,[0,1.2,0]);const top=new THREE.Mesh(new THREE.CircleGeometry(4.9,28),m);top.rotation.x=-Math.PI/2;top.position.y=2.42;
    const cg=top.geometry,n=cg.attributes.position.count,cl=[];for(let i=0;i<n;i++)cl.push(1,1,1);cg.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.add(top);g.rotation.x=0.25;}
  else if(k==='dec'){if(a==='dragon'){for(let i=0;i<3;i++){const r=1.6+i*0.5;const gg=rockGeo(r,rng(30+i));gg.scale(1,1.3,0.8);put(g,gg,decMat('dragon'),[-2.6+i*2.6,r*0.6,0]);}}
    else if(a==='tubes'){for(const[ox,oy]of[[-1.1,0],[1.1,0],[0,1.8]])put(g,new THREE.CylinderGeometry(0.9,0.9,4.2,16,1,true),decMat('tube'),[ox,0.9+oy,0],[0,0.5,Math.PI/2]);}
    else{for(let b=0;b<6;b++){const an=-1.2+b*0.48;const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(Math.sin(an)*2.5,Math.cos(an)*2.4,0.3),new THREE.Vector3(Math.sin(an)*5,Math.cos(an)*4.6,(b%2-0.5))]);put(g,taperTube(cv,10,0.32,6,t=>1-0.8*t,0.05),decMat('spider'),[0,0,0]);}}}
  else if(k==='bg'){const pm=new THREE.MeshBasicMaterial({map:bgTex(a),toneMapped:false});put(g,new THREE.PlaneGeometry(13,9),pm,[0,4.5,0]);put(g,BOX(13.4,0.5,0.6),TM.dark,[0,0,0.2]);}
  else if(k==='soil'){put(g,CYL(5,5.4,2.6,28),TM.soil,[0,1.3,0]);for(let i=0;i<46;i++){const t=rnd()*6.283,r=Math.sqrt(rnd())*4.6;put(g,SPH(0.32+rnd()*0.3),rnd()<0.5?TM.silver:TM.plastic,[Math.cos(t)*r,2.75+rnd()*0.15,Math.sin(t)*r],null,[1,0.6,1]);}}
  else if(k==='ro'){put(g,BOX(9.5,8.6,0.4),TM.plastic,[0,4.3,-1.3]);[-3,0,3].forEach((x,i)=>{put(g,CYL(1.1,1.1,6.6,20),i===1?TM.blue:TM.plastic,[x,3.9,0]);put(g,CYL(1.2,1.2,0.6,20),TM.silver,[x,7.5,0]);});
    put(g,new THREE.TorusGeometry(1.5,0.12,8,20,Math.PI),TM.jar,[-1.5,8,0]);put(g,new THREE.TorusGeometry(1.5,0.12,8,20,Math.PI),TM.jar,[1.5,8,0]);}
  else if(k==='p'){
    if(a==='moss'||a==='anub'){put(g,rockGeo(2.2,rng(7)),MK.rock,[0,0.7,0],[0,0.5,0]);}
    if(a==='moss'){for(let i=0;i<34;i++){const t=rnd()*6.283,r=rnd()*2.4;put(g,new THREE.IcosahedronGeometry(0.45+rnd()*0.45,0),rnd()<0.5?TM.mossG:TM.mossL,[Math.cos(t)*r,1.9+rnd()*0.7-r*0.25,Math.sin(t)*r*0.8],[rnd()*3,rnd()*3,rnd()*3],[1,0.7,1]);}}
    else if(a==='anub'){for(let i=0;i<8;i++){const t=i*0.8+rnd()*0.3;const L=new THREE.Group();L.position.set(0,1.8,0);L.rotation.set(0,-t,0.35+rnd()*0.4);put(L,ANUB_GEO,M.anub,[0,0,0],null,[1.3,1.3,1.3]);g.add(L);}}
    else if(a==='horn'){put(g,SPH(2.6,18,8,0,6.283,0,1.5708),TM.soil,[0,0,0],null,[1,0.3,1]);for(const[bx,bz,h]of[[-0.8,0,8.5],[0.6,0.5,7],[0.3,-0.7,9.5]]){put(g,CYL(0.06,0.08,h,5),M.horn,[bx,h/2,bz]);
      for(let w=0;w<h/0.8;w++)for(let j=0;j<6;j++){const t=j/6*6.283+w*0.5;put(g,new THREE.ConeGeometry(0.08,1.1,3),M.horn,[bx+Math.cos(t)*0.48,w*0.8+0.5,bz+Math.sin(t)*0.48],[0,-t,-1]);}}}
    else{put(g,CYL(4,3.6,0.9,30),TM.jar,[0,0.45,0]);put(g,CYL(3.8,3.8,0.2,30),TM.water,[0,0.75,0]);for(let i=0;i<8;i++){const t=rnd()*6.283,r=rnd()*2.6,s=0.6+rnd()*0.5;put(g,FROG_GEO,M.frog,[Math.cos(t)*r,0.88,Math.sin(t)*r],[0,rnd()*6,0],[s,s,s]);}}}
  else if(k==='sn'){
    if(a==='ram'){put(g,new THREE.TorusGeometry(0.9,0.55,12,26),M.ram,[0,1.45,0],[0,0.4,0]);put(g,SPH(0.5),M.ram,[0.2,0.35,0.9],null,[2.2,0.55,0.9]);put(g,CYL(0.05,0.05,0.8,5),M.ram,[1.2,0.7,1.2],[0.5,0,-0.8]);}
    else{put(g,SPH(1.25,22,12,0,6.283,0,1.5708),M.ner,[0,0.2,0],null,[1,0.75,1]);for(const y of[0.45,0.75])put(g,new THREE.TorusGeometry(1.05-(y-0.45),0.06,6,30),TM.yellow,[0,y,0],[Math.PI/2,0,0]);put(g,SPH(0.8),TM.lock,[0.3,0.15,0.5],null,[1.9,0.35,1]);}}
  else if(k==='c'){
    if(a==='food'||a==='powder'){put(g,CYL(1.6,1.6,3.2,24),TM.jar,[0,1.6,0]);put(g,CYL(1.45,1.45,2.3,24),a==='food'?M.pellet:M.powder,[0,1.2,0]);put(g,CYL(1.7,1.7,0.6,24),a==='food'?TM.orange:TM.green,[0,3.5,0]);
      if(a==='food')for(let i=0;i<12;i++)put(g,CYL(0.2,0.2,0.8,6),M.pellet,[2.8+(rnd()-0.5)*1.6,0.2,(rnd()-0.5)*1.8],[Math.PI/2,rnd()*3,0]);else put(g,SPH(1.1,16,8),M.powder,[2.9,0,0.3],null,[1,0.35,1]);}
    else if(a==='test'){put(g,CYL(0.9,0.9,4.2,20),TM.plastic,[-1.2,2.1,0]);put(g,CYL(0.98,0.98,0.8,20),TM.red,[-1.2,4.4,0]);
      [TM.yellow,TM.purple,TM.pink].forEach((m,i)=>{const s=new THREE.Group();s.position.set(1+i*0.9,0.05+i*0.02,0.4-i*0.3);s.rotation.set(-Math.PI/2,0,0.3-i*0.25);put(s,BOX(0.55,5,0.05),TM.strip,[0,0,0]);[TM.yellow,TM.purple,TM.green,TM.pink,m].forEach((pm,j)=>put(s,BOX(0.45,0.45,0.08),pm,[0,-1.9+j*0.6,0.01]));g.add(s);});}
    else if(a==='remin'){bottle(g,TM.plastic,TM.purple,0,3.6,1.3);put(g,CYL(1.33,1.33,1.4,22),TM.purple,[0,1.8,0]);}
    else if(a==='bact'){bottle(g,TM.amber,TM.green,0,3.6,1.2);put(g,CYL(1.23,1.23,1.4,22),TM.plastic,[0,1.8,0]);}
    else if(a==='leaf'){put(g,LEAF_GEO,M.leaf,[-2.5,0.15,0],[0,0.3,0],[1.1,1,1.1]);put(g,LEAF_GEO,M.leaf,[-1.2,0.5,1.4],[0.15,-0.5,0.1]);}
    else{put(g,CYL(0.8,0.8,2.2,20),TM.jar,[0,1.1,0]);put(g,CYL(0.7,0.7,1.6,20),TM.blue,[0,0.8,0]);put(g,CYL(0.4,0.4,0.6,12),TM.dark,[0,2.5,0]);put(g,SPH(0.45),TM.dark,[0,3.1,0],null,[1,1.3,1]);}}
  else if(k==='t'){const d=SIM.TANKS[a].dims.map(v=>v/6);const[W,H,D]=[d[0],d[2],d[1]];
    const bx=BOX(W,H,D);put(g,bx,TM.glass,[0,H/2,0]);const e=new THREE.LineSegments(new THREE.EdgesGeometry(bx),new THREE.LineBasicMaterial({color:0x6f8f94}));e.position.y=H/2;g.add(e);
    put(g,BOX(W-0.1,0.5,D-0.1),TM.soil,[0,0.25,0]);put(g,BOX(W-0.1,H*0.78,D-0.1),TM.water,[0,0.5+H*0.39,0]);
    put(g,new THREE.DodecahedronGeometry(0.5,0),M.rock,[W*0.2,0.7,0]);for(let i=0;i<3;i++)put(g,new THREE.ConeGeometry(0.2,2+i*0.5,5),M.horn,[-W*0.3+i*0.35,1.4,-D*0.2]);}
  return g;}
function thumb(key){if(THUMB.has(key))return THUMB.get(key);const R=thumbR();let url='';
  if(R){const o=thumbModel(key);R.sc.add(o);o.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(o);const cn=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3());
    const isS=key[0]==='s'||key.startsWith('lock');if(isS){box.setFromCenterAndSize(new THREE.Vector3(-0.3,-0.3,0.1),new THREE.Vector3(9.5,3.4,3));box.getCenter(cn);box.getSize(sz);}const sh=new THREE.Mesh(new THREE.CircleGeometry(Math.max(sz.x,sz.z)*(isS?0.3:0.48),32),TM.shadow);if(isS)sh.scale.set(1.25,0.55,1);sh.rotation.x=-Math.PI/2;sh.position.set(cn.x,isS?-2.0:box.min.y+0.02,cn.z);R.sc.add(sh);
    const rad=sz.length()/2;const dist=rad/Math.sin(THREE.MathUtils.degToRad(13))*(isS?0.95:0.9);const dir=isS?new THREE.Vector3(0.15,0.55,1).normalize():new THREE.Vector3(0.5,0.55,1).normalize();
    R.cm.position.copy(cn).addScaledVector(dir,dist);R.cm.near=dist/30;R.cm.far=dist*4;R.cm.updateProjectionMatrix();R.cm.lookAt(cn);
    try{url=thumbRender(R);}catch(e){url='';}
    R.sc.remove(o);R.sc.remove(sh);sh.geometry.dispose();disposeTree(o);}
  THUMB.set(key,url);return url;}
const shrimpKey=(m,rili,g)=>`s:${m}:${rili?1:0}:${Math.round(clamp(g,0,1)*6)}`;
function fillThumbs(root){root.querySelectorAll('img[data-th]').forEach(i=>{const u=thumb(i.dataset.th);if(u&&i.getAttribute('src')!==u)i.src=u;});}

