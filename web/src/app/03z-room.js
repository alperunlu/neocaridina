/* ================= karides odası (A) ================= */
// Tanklar duvar önündeki tek sıra uzun rafta yan yana durur (üstte raf yok, üstten bakış açık). Seçili tank tam ayrıntıyla
// sahnenin merkezinde (0,0,0) çizilir; raf ve diğer tanklar ona göre konumlanır. Diğer tanklar sade
// birer kopya: cam, taban, su, lamba ışığı ve renkli karides noktaları. Bir kopyaya dokununca o tanka geçilir.
const ROOM={COLW:76,on:false,key:'',proxies:[],lamps:[]};
const roomG=new THREE.Group();scene.add(roomG);
const RM_MAT={
  wall:new THREE.MeshLambertMaterial({color:lc(0xdfe7dc)}),
  board:patchMat(new THREE.MeshStandardMaterial({map:WOOD,color:lc(0xb08a64),roughness:0.85}),{}),
  post:new THREE.MeshStandardMaterial({color:lc(0x3a4246),roughness:0.5,metalness:0.4}),
  glass:new THREE.MeshStandardMaterial({color:lc(0xcfeee9),transparent:true,opacity:0.16,roughness:0.1,depthWrite:false}),
  water:new THREE.MeshStandardMaterial({color:lc(0x2e7f8a),transparent:true,opacity:0.32,roughness:0.2,depthWrite:false}),
  lampBar:new THREE.MeshStandardMaterial({color:lc(0x1d2224),roughness:0.6}),
  dot:new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.4})
};
for(const k in RM_MAT)RM_MAT[k].keep=true;
const SUBCOL={gravel:0x3b342e,sand:0xcbb68a,aqua:0x1a120c,soil:0x3b342e};
function slotPos(i){return new V3(i*ROOM.COLW,0,0);}
function roomKey(){return [S.cur,S.tanks.length,typeof SIM.maxTanks==='function'?SIM.maxTanks(S):0,...S.tanks.map(t=>[t.id,t.vol,t.sub,t.bg,Math.round(t.level*10),t.eq.light,t.eq.filter,Object.keys(t.decor||{}).join(''),Object.values(t.plants||{}).map(v=>Math.round(v*3)).join(','),Math.min(40,t.shrimp.length)].join(':'))].join('|');}
function buildRoom(){disposeTree(roomG);roomG.clear();ROOM.proxies=[];ROOM.lamps=[];
  // Raf, açılmış tüm yerler kadar uzundur; tank alınmamış yerler boş raf olarak kalır.
  const maxT=typeof SIM.maxTanks==='function'?SIM.maxTanks(S):S.tanks.length;
  const n=Math.max(1,S.tanks.length,maxT),cur=slotPos(S.cur),off=cur.clone().negate(),wid=n*ROOM.COLW;
  const x0=off.x-ROOM.COLW/2,x1=off.x+wid-ROOM.COLW/2;
  const b=new THREE.Mesh(new THREE.BoxGeometry(wid+6,2.4,46),RM_MAT.board);b.position.set((x0+x1)/2,off.y-1.2,0);b.receiveShadow=true;roomG.add(b);
  for(let k=0;k<=n;k++){const x=k===0?x0:k===n?x1:x0+k*ROOM.COLW;for(const z of[-21,21]){const p=new THREE.Mesh(new THREE.BoxGeometry(2,70,2),RM_MAT.post);p.position.set(x,off.y-37.4,z);roomG.add(p);}}
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(1600,700),RM_MAT.wall);wall.position.set((x0+x1)/2,off.y+150,-60);roomG.add(wall);
  floor.position.y=off.y-70;
  for(let i=0;i<S.tanks.length;i++){if(i===S.cur)continue;const g=tankProxy(S.tanks[i],i);g.position.copy(slotPos(i).add(off));roomG.add(g);ROOM.proxies.push(g);}
  ROOM.key=roomKey();renderer.shadowMap.needsUpdate=true;}
// Diğer tankların eksiksiz ama hafif kopyası: siyah çerçeve, gerçek taban ve arka plan dokusu, su, bitkiler,
// dekor, filtre, lamba ve renkli karidesler.
const RM_GEO={shrimp:new THREE.SphereGeometry(0.55,8,6)};RM_GEO.shrimp.keep=true;
const RM_M={};function rmMat(k,mk){return RM_M[k]||(RM_M[k]=Object.assign(mk(),{keep:true}));}
function tankProxy(tk,i){const[W,D,H]=SIM.TANKS[tk.vol].dims,g=new THREE.Group();g.userData.tankIdx=i;const rnd=rng(tk.seed+3);
  const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.userData.tankIdx=i;g.add(m);return m;};
  const rim=rmMat('rim',()=>new THREE.MeshStandardMaterial({color:lc(0x1d2224),roughness:0.5}));
  // çerçeve (alt ve üst kenar)
  for(const y of[0.4,H-0.4]){add(new THREE.BoxGeometry(W+0.6,0.8,0.8),rim,0,y,D/2);add(new THREE.BoxGeometry(W+0.6,0.8,0.8),rim,0,y,-D/2);
    add(new THREE.BoxGeometry(0.8,0.8,D),rim,W/2,y,0);add(new THREE.BoxGeometry(0.8,0.8,D),rim,-W/2,y,0);}
  // arka plan
  const bgm=rmMat('bg_'+(tk.bg||'deep'),()=>new THREE.MeshBasicMaterial({map:bgTex(tk.bg),color:0xdddddd}));add(new THREE.PlaneGeometry(W-0.8,H-1),bgm,0,H/2,-D/2+0.45);
  if(tk.sub){const sm=rmMat('sub_'+tk.sub,()=>{const m=subMat(tk.sub);return new THREE.MeshStandardMaterial({map:m.map||null,color:m.map?0xffffff:lc(SUBCOL[tk.sub]||0x3b342e),roughness:1});});
    add(new THREE.BoxGeometry(W-0.8,3.2,D-0.8),sm,0,1.6,0);}
  const wl=tk.level>0.05?(H-2)*tk.level:0;
  if(wl>3){add(new THREE.BoxGeometry(W-0.9,wl-3.2,D-0.9),RM_MAT.water,0,3.2+(wl-3.2)/2,0);
    const surf=add(new THREE.PlaneGeometry(W-0.9,D-0.9),rmMat('surf',()=>new THREE.MeshStandardMaterial({color:lc(0x9fd8d4),transparent:true,opacity:0.35,roughness:0.05,depthWrite:false})),0,wl,0);surf.rotation.x=-Math.PI/2;}
  // bitkiler
  const pl=tk.plants||{};const green=rmMat('moss',()=>new THREE.MeshStandardMaterial({color:lc(0x3f7a2e),roughness:0.9})),green2=rmMat('stem',()=>new THREE.MeshStandardMaterial({color:lc(0x5c9a3a),roughness:0.8})),
    anub=rmMat('anub',()=>new THREE.MeshStandardMaterial({color:lc(0x2d5e2a),roughness:0.5}));
  const top=Math.max(6,wl-2);
  for(let k=0;k<Math.min(10,Math.round((pl.moss||0)*3));k++){const m=add(new THREE.SphereGeometry(1.4+rnd()*1.4,7,5),green,(rnd()-0.5)*(W-6),3.4,(rnd()-0.5)*(D-6));m.scale.y=0.5;}
  for(let k=0;k<Math.min(10,Math.round((pl.horn||0)*3));k++){const h=Math.min(top-4,6+rnd()*(H*0.55));if(h<2)break;const c=add(new THREE.CylinderGeometry(0.9,1.3,h,6),green2,(rnd()-0.5)*(W-8),3.2+h/2,-D/2+3+rnd()*(D*0.4));}
  for(let k=0;k<Math.min(6,Math.round((pl.anub||0)*2));k++){const c=add(new THREE.ConeGeometry(2.2,4+rnd()*3,5),anub,(rnd()-0.5)*(W-8),5.5,(rnd()-0.5)*(D-8));c.scale.z=0.5;}
  if(pl.frog&&wl>3)for(let k=0;k<Math.min(8,Math.round(pl.frog*3));k++){const f=add(new THREE.CircleGeometry(1,8),green2,(rnd()-0.5)*(W-4),wl-0.05,(rnd()-0.5)*(D-4));f.rotation.x=-Math.PI/2;}
  // dekor
  const dec=tk.decor||{};if(dec.spider){const w=rmMat('wood',()=>new THREE.MeshStandardMaterial({color:lc(0x6b4a2c),roughness:0.9}));
    for(let k=0;k<4;k++){const br=add(new THREE.CylinderGeometry(0.35,0.6,9+rnd()*6,5),w,(rnd()-0.5)*8,8,(rnd()-0.5)*6);br.rotation.z=(rnd()-0.5)*1.4;br.rotation.x=(rnd()-0.5)*0.6;}}
  if(dec.tubes){const c=rmMat('tube',()=>new THREE.MeshStandardMaterial({color:lc(0xb5673d),roughness:0.8}));for(let k=0;k<3;k++){const t=add(new THREE.CylinderGeometry(0.9,0.9,4,8,1,true),c,W*0.22+k*2.1,4.2,D*0.12);t.rotation.z=Math.PI/2;}}
  // filtre ve lamba
  if(tk.eq.filter){const fm=rmMat('sponge',()=>new THREE.MeshStandardMaterial({color:lc(0x2a2e30),roughness:1}));const fh=Math.max(6,Math.min(H-4,wl>3?wl-2:H*0.6));
    add(new THREE.CylinderGeometry(2,2,fh,10),fm,W/2-3.4,3.2+fh/2,-D/2+3.4);add(new THREE.CylinderGeometry(0.4,0.4,H-fh-2,6),rim,W/2-3.4,3.2+fh+(H-fh-2)/2,-D/2+3.4);}
  // karidesler
  const ns=Math.min(40,tk.shrimp.length);if(ns&&wl>3){const dm=new THREE.InstancedMesh(RM_GEO.shrimp,RM_MAT.dot,ns);const r2=rng(tk.seed+9),o=new THREE.Object3D(),c=new THREE.Color();
    for(let k=0;k<ns;k++){const s=tk.shrimp[k];o.position.set((r2()-0.5)*(W-5),3.8+r2()*Math.max(0.5,wl-7)*0.3,(r2()-0.5)*(D-5));o.rotation.set(0,r2()*6.3,0);const sz=s.age!=null&&s.age<20?0.6:1;o.scale.set(1.8*sz,0.75*sz,0.8*sz);o.updateMatrix();dm.setMatrixAt(k,o.matrix);
      c.set(SIM.MORPH[SIM.morphOf(s)].hex).convertSRGBToLinear();dm.setColorAt(k,c);}
    dm.userData.tankIdx=i;g.add(dm);}
  const gl=add(new THREE.BoxGeometry(W,H,D),RM_MAT.glass,0,H/2,0);gl.renderOrder=5;
  if(tk.eq.light){add(new THREE.BoxGeometry(W-1,1.1,6),RM_MAT.lampBar,0,H+4.5,0);for(const x of[-W/2+3,W/2-3])add(new THREE.CylinderGeometry(0.25,0.25,4,5),RM_MAT.lampBar,x,H+2.2,0);
    const glow=add(new THREE.PlaneGeometry(W-2,4.4),new THREE.MeshBasicMaterial({color:0xfff1dc,toneMapped:false}),0,H+3.9,0);glow.rotation.x=Math.PI/2;ROOM.lamps.push([glow,tk]);}
  return g;}
// Her karede: gerekirse odayı yeniden kur, diğer tankların lamba ışığını güncelle, oda görünümünde sisi uzat.
function updateRoom(){if(ROOM.key!==roomKey())buildRoom();
  for(const[glow,tk]of ROOM.lamps)glow.material.color.setScalar(tk.lit?1:0.12);
  const far=Math.max(330,cam.r+260);if(scene.fog.far!==far){scene.fog.far=far;scene.fog.near=Math.max(150,cam.r+40);}}
// Oda görünümü: tüm rafı gösterir; tekrar basınca seçili tanka döner.
function camRoom(){if(ROOM.on){roomExit();return;}ROOM.on=true;
  // Bütün raf (boş yerler dahil) sığarsa hepsi gösterilir; dar ekranda en fazla 3 yer sığdırılır ve raf parmakla sağa sola kaydırılır.
  const maxT=typeof SIM.maxTanks==='function'?SIM.maxTanks(S):S.tanks.length,n=Math.max(1,S.tanks.length,maxT),c=slotPos(S.cur).negate();
  const vf=camera.fov*Math.PI/360,hf=Math.atan(Math.tan(vf)*camera.aspect),hh=40;
  const fitN=k=>Math.max(hh/Math.tan(vf),(k*ROOM.COLW/2+6)/Math.tan(hf))*1.08+30;
  let k=n;while(k>Math.min(n,3)&&fitN(k)>620)k--;
  ROOM.minX=c.x+(k-1)*ROOM.COLW/2;ROOM.maxX=c.x+(n-1)*ROOM.COLW-(k-1)*ROOM.COLW/2;
  ROOM.tgt=new V3(clamp(c.x+S.cur*ROOM.COLW,ROOM.minX,ROOM.maxX),16,0);
  camGoal={ph:1.25,th:0};userZoom=true;cam.zr=fitN(k);cam.vth=cam.vph=0;layoutSoon();}
// Oda görünümünde sürükleme rafı kaydırır (döndürmez).
function roomPan(dx){if(!ROOM.on||!ROOM.tgt)return false;const wpp=2*cam.r*Math.tan(camera.fov*Math.PI/360)/Math.max(1,innerHeight);
  ROOM.tgt.x=clamp(ROOM.tgt.x-dx*wpp,ROOM.minX,ROOM.maxX);return true;}
function roomExit(){ROOM.on=false;ROOM.tgt=null;cam.tgt.set(0,G.H*0.36,0);camPreset(1.12,0.35);}
// Odadaki bir tanka dokunma
function roomPick(x,y){if(!ROOM.proxies.length)return null;pickN.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);pickRC.setFromCamera(pickN,camera);
  const hs=pickRC.intersectObjects(ROOM.proxies,true);if(!hs.length)return null;let o=hs[0].object;while(o&&o.userData.tankIdx==null)o=o.parent;
  return o?{tank:o.userData.tankIdx}:null;}
window.__ncRoom={pick:(x,y)=>roomPick(x,y)};// test ve hata ayıklama için
