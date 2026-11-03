// Ortak karides çizimi (ikon, açılış ekranı, mağaza görselleri). SVG parçası döndürür; tuval ~1024 birim.
function shrimpSVG(o){o=o||{};const C=o.color||'#e3392c',D=o.dark||'#8f1a14',L=o.light||'#ff9a7a';const id=o.id||'k';
  // karın: karapasın arkasından kuyruğa yumuşak bir yay (kuadratik Bezier üzerinde örnekleme)
  const P0=[500,470],P1=[330,470],P2=[245,660];
  const B=(t)=>[(1-t)*(1-t)*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)*(1-t)*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]];
  const Bd=(t)=>{const x=2*(1-t)*(P1[0]-P0[0])+2*t*(P2[0]-P1[0]),y=2*(1-t)*(P1[1]-P0[1])+2*t*(P2[1]-P1[1]);const l=Math.hypot(x,y);return[x/l,y/l];};
  const W=(t)=>92*(1-t)+34*t+Math.sin(t*Math.PI)*10;
  const up=[],dn=[];const K=40;for(let i=0;i<=K;i++){const t=i/K,[x,y]=B(t),[dx,dy]=Bd(t),nx=-dy,ny=dx,w=W(t);up.push([x+nx*w,y+ny*w*1.0]);dn.push([x-nx*w*0.95,y-ny*w*0.95]);}
  const f=p=>p.map(v=>v.toFixed(1)).join(' ');
  const body='M'+f(up[0])+' '+up.slice(1).map(p=>'L'+f(p)).join(' ')+' '+dn.reverse().map(p=>'L'+f(p)).join(' ')+'Z';
  let s=`<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L}"/><stop offset=".42" stop-color="${C}"/><stop offset="1" stop-color="${D}"/></linearGradient>
  <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  // antenler
  s+=`<g fill="none" stroke="${D}" stroke-linecap="round"><path d="M706 400 C 810 310, 880 240, 975 110" stroke-width="8"/><path d="M712 410 C 830 370, 920 360, 1005 300" stroke-width="7"/><path d="M700 420 C 760 440, 795 480, 820 535" stroke-width="6"/><path d="M690 425 C 735 460, 750 500, 760 545" stroke-width="5" opacity=".8"/></g>`;
  // yürüme bacakları
  s+=`<g stroke="${D}" stroke-width="10" stroke-linecap="round" fill="none">`;for(let i=0;i<5;i++){const x=650-i*36;s+=`<path d="M${x} 505 q ${14-i*3} 58 ${-6-i*5} 112"/>`;}s+=`</g>`;
  // yüzgeç bacakları
  s+=`<g stroke="${C}" stroke-width="12" stroke-linecap="round">`;for(const t of[0.12,0.3,0.48,0.64]){const[x,y]=B(t),[dx,dy]=Bd(t),w=W(t);const bx=x+dy*w*0.9,by=y-dx*w*0.9;s+=`<path d="M${bx.toFixed(0)} ${by.toFixed(0)} l ${(-dy*0+dx*-8).toFixed(0)} ${(46-t*30).toFixed(0)}"/>`;}s+=`</g>`;
  // kuyruk yelpazesi
  const[tx,ty]=B(1),[ddx,ddy]=Bd(1),ang=Math.atan2(ddy,ddx)*57.3-90;
  s+=`<g transform="translate(${tx.toFixed(0)} ${ty.toFixed(0)}) rotate(${ang.toFixed(0)})">`;for(const[a,l]of[[-46,92],[-20,112],[6,118],[30,104],[52,84]])s+=`<path d="M0 0 C ${-26} ${l*0.35}, ${-22} ${l*0.9}, 0 ${l} C ${22} ${l*0.9}, ${26} ${l*0.35}, 0 0 Z" transform="rotate(${a})" fill="${C}" stroke="${D}" stroke-width="6" stroke-linejoin="round"/>`;s+=`</g>`;
  // karın gövdesi
  s+=`<path d="${body}" fill="url(#${id}b)" stroke="${D}" stroke-width="8" stroke-linejoin="round"/>`;
  // segment çizgileri
  s+=`<g stroke="${D}" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round">`;for(const t of[0.18,0.36,0.53,0.69,0.84]){const[x,y]=B(t),[dx,dy]=Bd(t),w=W(t)*0.92;const ax=x-dy*w,ay=y+dx*w,bx=x+dy*w,by=y-dx*w;s+=`<path d="M${ax.toFixed(0)} ${ay.toFixed(0)} Q ${(x+dx*18).toFixed(0)} ${(y+dy*18).toFixed(0)} ${bx.toFixed(0)} ${by.toFixed(0)}"/>`;}s+=`</g>`;
  // karapas
  s+=`<path d="M470 382 C 530 318, 665 318, 722 380 C 748 408, 740 458, 702 482 C 640 524, 525 532, 468 494 C 428 466, 432 414, 470 382 Z" fill="url(#${id}b)" stroke="${D}" stroke-width="8"/>`;
  // rostrum
  s+=`<path d="M708 373 L 812 350 L 716 402 Z" fill="${C}" stroke="${D}" stroke-width="6" stroke-linejoin="round"/>`;
  // sırt parlaklığı
  s+=`<ellipse cx="575" cy="372" rx="115" ry="34" fill="url(#${id}h)"/><path d="M${f(B(0.05))} Q ${f(B(0.35).map((v,i)=>v+(i?-62:-10)))} ${f(B(0.7).map((v,i)=>v+(i?-30:-34)))}" stroke="#fff" stroke-opacity=".35" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  // göz
  s+=`<circle cx="692" cy="394" r="27" fill="#1b0e0a"/><circle cx="701" cy="385" r="9" fill="#fff"/>`;
  return s;}
module.exports={shrimpSVG};
