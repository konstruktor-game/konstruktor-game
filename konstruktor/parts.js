/* =====================================================================
   Real detallar kutubxonasi — haqiqiy o'lchamlar va standartlar asosida.
   Barcha o'lchamlar santimetrda (1 birlik = 1 sm), mm qiymatlar /10 qilinadi.
   ===================================================================== */
'use strict';
const NOMV={lipo:3.7,lihv:3.8,liion:3.6,life:3.2};

// ---- batareya o'lchami ----
// LiPo/LiHV/LiFePO4 — yassi (pouch) yacheykalar ustma-ust; hajm energiya zichligidan (LiPo ≈ 0,27 Wh/sm³).
// Li-ion — 21700 silindr yacheykalar (Ø21 × 70 mm, ~4500 mAh); parallel soni sig'imdan hisoblanadi.
function realBat(cells,mah,chem,hard){
 if(chem==='liion'){const par=Math.max(1,Math.ceil(mah/4500)),n=cells*par,cols=Math.ceil(n/2);return{kind:'cyl',par,n,rows:2,cols,w:cols*2.15,h:2*2.15,l:7.2}}
 const Wh=cells*NOMV[chem]*mah/1000,dens={lipo:.27,lihv:.29,life:.2}[chem]||.27,vol=Wh/dens*1000;
 const cellT=clamp(3.6+Math.sqrt(mah)*.11,3,14),h=cells*cellT+(hard?3:1.5),ratio=hard?2.9:2.15,area=vol/h,w=Math.sqrt(area/ratio),l=w*ratio;
 return{kind:'pouch',w:w/10,h:h/10,l:l/10,cellT:cellT/10}}
// batareya: uzunligi z bo'ylab, pastki qirrasi y=0 da; qizil/qora quvvat simlari, oq balans ulagichi
function mkBattery(cells,mah,chem,col,labels,opt={}){const d=realBat(cells,mah,chem,opt.hard),g=new THREE.Group();
 if(d.kind==='cyl'){const cm=MAT('liion',()=>new THREE.MeshStandardMaterial({color:'#2e7d32',roughness:.35,metalness:.1}));
  for(let r=0;r<d.rows;r++)for(let c=0;c<d.cols;c++){const x=(c-(d.cols-1)/2)*2.15,y=1.075+r*2.15,cy=cyl(1.05,1.05,7,cm,x,y,0,24);cy.rotation.x=Math.PI/2;g.add(cy);
   const cap=cyl(.6,.6,.08,mMetal('#cfd8dc'),x,y,3.54,16);cap.rotation.x=Math.PI/2;g.add(cap)}
  g.add(box(d.w+.1,d.h+.1,7.4,MAT('shrink'+col,()=>new THREE.MeshPhysicalMaterial({color:col,transparent:true,opacity:.35,roughness:.3,clearcoat:.6})),0,d.h/2,0))}
 else{const wm=new THREE.MeshStandardMaterial({map:wrapTex(col,labels),roughness:opt.hard?.3:.45,metalness:.05});g.add(box(d.w,d.h,d.l,wm,0,d.h/2,0));
  if(!opt.hard)for(let k=1;k<cells;k++)g.add(box(d.w+.02,.02,d.l*.98,mPlastic('#000',.6),0,k*d.cellT+.075,0))}
 const L=d.kind==='cyl'?7.2:d.l,awg=opt.awg||12,wr=({10:.2,12:.165,14:.13,16:.105}[awg]||.15);
 for(const[s,c]of[[.25,'#d32f2f'],[-.25,'#1b1b1b']])g.add(wireMesh([[s,d.h*.35,L/2-.2],[s,d.h*.3,L/2+1.5],[s*.6,d.h*.4,L/2+(opt.lead||4)]],c,wr));
 const xt=mkXT60(true);xt.position.set(0,d.h*.4,L/2+(opt.lead||4)+.8);g.add(xt);
 // balans ulagichi (JST-XH): yacheykalar soni + 1 ta sim
 for(let k=0;k<=cells;k++){const x=(k-cells/2)*.12;g.add(wireMesh([[x,d.h-.05,L/2-.4],[x,d.h+.3,L/2+.3],[x*.8,d.h+.2,L/2+1.6]],k===0?'#1b1b1b':k===cells?'#d32f2f':'#e8e8e8',.035))}
 g.add(box(cells*.25+.3,.45,.6,mPlastic('#f5f5f5',.5),0,d.h+.2,L/2+1.9));
 g.userData.dims=d;return g}
// XT60: korpus 15,8 × 8,2 × 16 mm, sariq neylon, ikkita oltin rangli kontakt
function mkXT60(male){const g=new THREE.Group();g.add(rbox(1.58,.82,1.6,.12,mPlastic('#f9a825',.45),0,0,0));
 for(const s of[-.38,.38]){const p=cyl(male?.18:.22,male?.18:.22,.5,mGold(),s,0,.95,14);p.rotation.x=Math.PI/2;g.add(p)}return g}
// elektrolitik kondensator: ≤4S 470µF 35V (Ø10×16), 6S 1000µF 50V (Ø12,5×25); oq chiziq — minus tomoni
function mkCap(cells){const big=cells>=5,r=big?.625:.5,h=big?2.5:1.6,g=new THREE.Group(),b=cyl(r,r,h,mPlastic('#1c1c1c',.3),0,0,0,24);b.rotation.z=Math.PI/2;g.add(b);
 const st=new THREE.Mesh(new THREE.CylinderGeometry(r+.005,r+.005,h*.98,24,1,true,-.35,.7),mPlastic('#e0e0e0',.4));st.rotation.z=Math.PI/2;g.add(st);
 const top=cyl(r*.95,r*.95,.04,mMetal('#9e9e9e'),h/2+.01,0,0,24);top.rotation.z=Math.PI/2;g.add(top);
 g.userData.spec=big?'1000µF 50V':'470µF 35V';return g}
// M3/M2 vint qalpoqchasi (button head) — olti qirrali chuqurcha bilan
function mkScrew(dmm=3,col='#c0c4c9'){const g=new THREE.Group(),r=dmm*.095;g.add(cyl(r,r*.92,dmm*.055,mMetal(col,.3),0,dmm*.0275,0,16));g.add(cyl(r*.42,r*.42,.02,mPlastic('#111',.6),0,dmm*.055+.005,0,6));return g}

// ---- cho'tkasiz outrunner motor ----
// qo'ng'iroq diametri ≈ stator + 6 mm; balandlik ≈ stator + 6,5 mm; 6 ta shamollatish to'sinchasi; o'q (M5 yoki M3) va neylon gayka
function mkMotor(sd,sh,col){const g=new THREE.Group(),R=(sd+6)/20,H=(sh+6.5)/10,base=.28,dark=mMetal('#26292e',.45);
 g.add(cyl(R*.95,R*.98,base,dark,0,base/2,0,40));
 for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;g.add(cyl(.13,.13,.02,mPlastic('#0a0a0a'),Math.cos(a)*R*.55,0,Math.sin(a)*R*.55,10))}
 const st=cyl(sd/20,sd/20,sh/10,mCopper(),0,base+.06+sh/20,0,36);g.add(st);
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2,t=box(.06,sh/10+.02,sd/20*.25,mPlastic('#3a2a1a',.6));t.position.set(Math.cos(a)*sd/20*.9,base+.06+sh/20,Math.sin(a)*sd/20*.9);t.rotation.y=-a;g.add(t)}
 const bellM=mPaint(col,'metal'),y0=base+.06,prof=[new THREE.Vector2(R*.93,0),new THREE.Vector2(R,0),new THREE.Vector2(R,H*.92),new THREE.Vector2(R*.96,H),new THREE.Vector2(R*.74,H),new THREE.Vector2(R*.74,H*.86),new THREE.Vector2(R*.93,H*.86)];
 const bell=new THREE.Mesh(GEO(`bell${R.toFixed(2)},${H.toFixed(2)}`,()=>new THREE.LatheGeometry(prof,48)),bellM);bell.position.y=y0;bell.castShadow=true;g.add(bell);
 g.add(cyl(R*.995,R*.995,H*.22,mPlastic('#141414',.5),0,y0+H*.13,0,48));
 const sh5=sd>=18?.25:.15;g.add(cyl(sh5*1.6,sh5*1.6,.25,bellM,0,y0+H-.05,0,20));
 for(let k=0;k<6;k++){const a=k/6*Math.PI*2,s=box(R*.6,.12,.22,bellM);s.position.set(Math.cos(a)*R*.42,y0+H-.06,Math.sin(a)*R*.42);s.rotation.y=-a;g.add(s)}
 g.add(cyl(sh5,sh5,.95,mMetal('#d5d9de',.18),0,y0+H+.4,0,14));
 g.add(cyl(sh5*1.9,sh5*1.9,sh5*1.7,mMetal('#a7aeb6',.3),0,y0+H+.9,0,6));g.add(cyl(sh5*1.3,sh5*1.3,.06,mPlastic('#1e5bd8',.5),0,y0+H+.9+sh5*.86,0,16));
 g.userData.h=y0+H;g.userData.top=y0+H+.6;g.userData.R=R;return g}

// ---- parrak qanoti: haqiqiy buralish bilan ----
// har bir radiusda qanot burchagi θ(r) = atan(P / 2πr): ildizda katta, uchida kichik (bir xil qadam).
// vatar ildizdan ~35% gacha kengayadi, keyin uchiga qarab ingichkalashadi; qalinligi uchiga qarab kamayadi.
// qanot +X bo'ylab, CCW (tepadan) aylanadi: oldingi qirrasi −Z tomonda va yuqoriroq.
function propBladeGeo(R,Pin,blades,hubR){return GEO(`pblade${R.toFixed(2)},${Pin},${blades},${hubR.toFixed(2)}`,()=>{
 const N=18,M=9,P=Pin*2.54,pos=[],idx=[],cmax=R*(blades>=3?.27:blades===2?.19:.24);
 for(let i=0;i<=N;i++){const t=i/N,r=hubR*.85+(R-hubR*.85)*t,shape=t<.35?.55+.45*Math.sin(t/.35*Math.PI/2):1-.6*Math.pow((t-.35)/.65,1.5),tip=t>.92?Math.sqrt(Math.max(.02,(1-t)/.08))*.7+.3:1,chord=cmax*shape*tip;
  const th=Math.atan(P/(2*Math.PI*Math.max(r,.4))),cs=Math.cos(th),sn=Math.sin(th),thick=chord*(.16-.1*t),ring=[];
  for(let j=0;j<M;j++){const s=j/(M-1);ring.push([s,1])}for(let j=M-1;j>=0;j--){const s=j/(M-1);ring.push([s,-1])}
  for(const[s,side]of ring){const cz=(s-.32)*chord,yt=thick*1.35*Math.sqrt(s)*(1-s),cam=.045*chord*Math.sin(Math.PI*s),y=cam+side*yt*(side>0?1:.55);
   pos.push(r,y*cs-cz*sn,y*sn+cz*cs)}}
 const K=2*M;for(let i=0;i<N;i++)for(let k=0;k<K;k++){const a=i*K+k,b=i*K+(k+1)%K,c=(i+1)*K+k,d=(i+1)*K+(k+1)%K;idx.push(a,c,b,b,c,d)}
 const tc=pos.length/3;let sx=0,sy=0,sz=0;for(let k=0;k<K;k++){sx+=pos[(N*K+k)*3];sy+=pos[(N*K+k)*3+1];sz+=pos[(N*K+k)*3+2]}pos.push(sx/K,sy/K,sz/K);for(let k=0;k<K;k++)idx.push(N*K+k,N*K+(k+1)%K,tc);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g})}
// to'liq parrak: markaziy vtulka (Ø ≈ 12 mm, 5 mm teshik) + qanotlar; dir 'CW' — oyna aksi
function mkProp(Din,Pin,blades,mat,col,dir){const g=new THREE.Group(),R=Din*1.27,hubR=.42+Din*.035,pm=mat==='cf'?MAT('propcf',()=>new THREE.MeshPhysicalMaterial({map:carbonTex,roughness:.35,metalness:.2,clearcoat:.8,side:THREE.DoubleSide})):
  MAT('prop'+col,()=>new THREE.MeshPhysicalMaterial({color:col,roughness:.32,transmission:.2,thickness:.2,clearcoat:.6,transparent:true,opacity:.93,side:THREE.DoubleSide}));
 g.add(cyl(hubR,hubR,.75,pm,0,0,0,24));g.add(cyl(.27,.27,.77,mPlastic('#111',.5),0,0,0,16));
 const geo=propBladeGeo(R,Pin,+blades,hubR);for(let k=0;k<+blades;k++){const m=new THREE.Mesh(geo,pm);m.castShadow=true;m.rotation.y=k/blades*Math.PI*2;g.add(m)}
 if(dir==='CW')g.scale.z=-1;g.userData.R=R;return g}

// ---- bosma plata (PCB) ----
// s — plata o'lchami (sm); teshiklar 20×20 yoki 30.5×30.5; kind: esc | fc | vtx
function mkBoard(s,base,label,kind,opt={}){const g=new THREE.Group(),t=.16;g.add(box(s,t,s,mPCB(base,label),0,0,0));
 const hp=(s-.55)/2;for(const[x,z]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const r=new THREE.Mesh(GEO('hole',()=>new THREE.TorusGeometry(.2,.06,6,20)),mGold());r.rotation.x=Math.PI/2;r.position.set(x*hp,t/2+.01,z*hp);g.add(r)}
 const blk=mPlastic('#0b0b0b',.35),y=t/2;
 if(kind==='esc'){for(const a of opt.angles||[45,135,225,315]){const ar=a*DEG,dx=Math.sin(ar),dz=-Math.cos(ar),px=-dz,pz=dx;
   for(let k=0;k<6;k++){const off=(k%3-1)*.42,row=k<3?.95:.55;g.add(box(.33,.1,.33,blk,dx*s*.5*row/1.25*1+px*off,y+.05,dz*s*.5*row/1.25+pz*off))}
   for(let k=-1;k<=1;k++)g.add(box(.22,.04,.3,mGold(),dx*s*.44+px*k*.3,y+.02,dz*s*.44+pz*k*.3))}
  g.add(box(.45,.08,.45,blk,0,y+.04,0));g.add(box(.6,.05,.5,mGold(),-.45,y+.02,s/2-.35));g.add(box(.6,.05,.5,mGold(),.45,y+.02,s/2-.35));g.add(box(.9,.3,.45,mPlastic('#f5f5f5',.5),s/2-.35,y+.15,0))}
 if(kind==='fc'){g.add(box(.78,.05,.78,mPlastic('#8a8f96',.4),0,y+.025,0));g.add(box(.7,.1,.7,blk,0,y+.07,0));g.add(box(.3,.08,.3,blk,.75,y+.04,-.6));g.add(box(.5,.08,.4,blk,-.7,y+.04,.7));
  g.add(rbox(.9,.32,.75,.12,mMetal('#c9ced4',.25),s/2-.3,y+.16,0));g.add(box(.3,.15,.3,mMetal('#bbb'),-.9,y+.08,-.9));g.add(sph(.07,mGlow('#2196f3'),-1.1,y+.06,-.4));g.add(sph(.07,mGlow('#4caf50'),-1.1,y+.06,-.2));
  if(opt.baro)g.add(box(.25,.12,.25,mMetal('#9ea4aa'),.9,y+.06,.8));
  for(let k=-3;k<=3;k++)for(const sgn of[-1,1])g.add(box(.16,.03,.12,mGold(),k*.38,y+.015,sgn*(s/2-.18)));g.add(box(.9,.3,.42,mPlastic('#f5f5f5',.5),-s/2+.35,y+.15,0))}
 if(kind==='vtx'){g.add(box(s*.6,.25,s*.6,mMetal('#b0b6bf',.35),0,y+.13,0));const c=cyl(.22,.22,.3,mGold(),s/2-.3,y+.15,-s/2+.4,12);g.add(c)}
 return g}

// ---- kameralar ----
// micro FPV kamera: korpus 19×19 mm, M8 linza, oldida himoya halqasi; tilt — tepaga burilish
function mkCamera(size,col,digital){const g=new THREE.Group(),s=size/10;g.add(rbox(s,s,s*.95,s*.15,mPaint(col,'satin'),0,0,0));
 g.add(rbox(s*1.02,s*.4,.12,.08,mMetal('#2a2a2a',.4),0,0,-s*.48));
 const ln=cyl(.45,.5,1.05,mPlastic('#121212',.3),0,0,-s*.48-.5);ln.rotation.x=Math.PI/2;g.add(ln);const hood=cyl(.55,.5,.25,mPlastic('#1a1a1a',.4),0,0,-s*.48-1.05);hood.rotation.x=Math.PI/2;g.add(hood);
 const gl=cyl(.38,.38,.02,mGlass(),0,0,-s*.48-1.17);gl.rotation.x=Math.PI/2;g.add(gl);
 for(const x of[-1,1]){const sc=mkScrew(2,'#1a1a1a');sc.rotation.z=x*Math.PI/2;sc.position.set(x*s/2,0,0);g.add(sc)}
 if(digital)g.add(wireMesh([[0,-s*.2,s*.45],[0,-s*.6,s*1.2],[0,-s*.3,s*2]],'#222',.06));return g}

// ---- servo ----
// micro 9g: 23×12,2×22,5 mm, quloqlar 32 mm; standart: 40×20×37 mm, quloqlar 54 mm; oq shox (horn)
function mkServo(kind,col='#1565c0'){const S=kind==='std'?{w:4,d:2,h:3.7,ear:5.4,eh:2.6}:{w:2.3,d:1.22,h:2.25,ear:3.2,eh:1.6},g=new THREE.Group(),m=mPlastic(col,.35);
 g.add(rbox(S.w,S.h,S.d,.08,m,0,S.h/2,0));g.add(box(S.ear,.22,S.d,m,0,S.eh,0));g.add(rbox(S.w*.9,S.h*.12,S.d*.95,.1,m,0,S.h+S.h*.06,0));
 const gx=S.w/2-S.d/2;g.add(cyl(S.d*.32,S.d*.32,S.h*.12,m,gx,S.h+S.h*.12,0,20));
 const horn=new THREE.Group();horn.position.set(gx,S.h+S.h*.2,0);horn.add(cyl(S.d*.24,S.d*.24,.12,mPlastic('#f5f5f5',.5),0,0,0,18));horn.add(box(S.w*.75,.1,S.d*.22,mPlastic('#f5f5f5',.5),-S.w*.3,0,0));g.add(horn);
 for(const[c,o]of[['#5d4037',-.08],['#d32f2f',0],['#ff9800',.08]])g.add(wireMesh([[-S.w/2,S.h*.25,o],[-S.w/2-.6,S.h*.2,o],[-S.w/2-1.2,S.h*.3,o]],c,.035));
 g.userData.S=S;g.userData.horn=horn;g.userData.hornX=gx;return g}

// ---- tishli g'ildirak (modul m, z tish) ----
// bo'luvchi radius r = m·z/2; tish uchi r + m, asosi r − 1,25m; qalinlik — mm
function gearGeo(z,m,wmm){return GEO(`gear${z},${m},${wmm}`,()=>{const r=m*z/2/10,ra=r+m/10,rf=r-1.25*m/10,s=new THREE.Shape();
 for(let i=0;i<z;i++){const a0=i/z*Math.PI*2,da=Math.PI*2/z,p=(a,rr)=>[Math.cos(a)*rr,Math.sin(a)*rr];
  const pts=[p(a0,rf),p(a0+da*.12,rf),p(a0+da*.3,ra),p(a0+da*.5,ra),p(a0+da*.68,rf),p(a0+da,rf)];pts.forEach(([x,y],k)=>i===0&&k===0?s.moveTo(x,y):s.lineTo(x,y))}
 const hole=new THREE.Path();hole.absarc(0,0,Math.min(r*.35,.25),0,Math.PI*2,true);s.holes.push(hole);
 const g=new THREE.ExtrudeGeometry(s,{depth:wmm/10,bevelEnabled:false,curveSegments:4});g.translate(0,0,-wmm/20);return g})}

// ---- spiral prujina (amortizator) ----
function springGeo(R,coils,len,wr){return GEO(`spring${R},${coils},${len},${wr}`,()=>{const pts=[];const N=coils*24;for(let i=0;i<=N;i++){const a=i/24*Math.PI*2;pts.push(new V3(Math.cos(a)*R,i/N*len,Math.sin(a)*R))}
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N*2,wr,6,false)})}

// ---- g'ildirak: shina profili (lathe) + protektor bo'rtiqlari + disk ----
// o'q X bo'ylab. tire: slick | pin | terrain
function mkWheel(Dmm,Wmm,tire,rimCol,tireCol){const g=new THREE.Group(),R=Dmm/20,W=Wmm/10,rr=R*.62,tm=mRubber(tireCol),side=W*.22;
 const p2=[new THREE.Vector2(rr,-W/2),new THREE.Vector2(R-side,-W/2),new THREE.Vector2(R-side*.25,-W/2+side*.4),new THREE.Vector2(R,-W/2+side),new THREE.Vector2(R,W/2-side),new THREE.Vector2(R-side*.25,W/2-side*.4),new THREE.Vector2(R-side,W/2),new THREE.Vector2(rr,W/2)];
 const tg=new THREE.Mesh(GEO(`tire${R.toFixed(2)},${W.toFixed(2)}`,()=>new THREE.LatheGeometry(p2,48)),tm);tg.rotation.z=Math.PI/2;tg.castShadow=true;g.add(tg);
 if(tire!=='slick'){const big=tire==='terrain',n=big?18:36,lug=GEO(`lug${big},${R.toFixed(2)},${W.toFixed(2)}`,()=>new THREE.BoxGeometry(big?W*.42:W*.16,big?R*.09:R*.05,big?R*.22:R*.08)),im=new THREE.InstancedMesh(lug,tm,n*2),mx=new THREE.Matrix4(),q=new THREE.Quaternion();
  for(let i=0;i<n;i++)for(const sd of[-1,1]){const a=(i+(sd>0?.5:0))/n*Math.PI*2;q.setFromAxisAngle(new V3(1,0,0),a);mx.compose(new V3(sd*W*(big?.24:.22),Math.cos(a)*(R+(big?R*.03:R*.015)),Math.sin(a)*(R+(big?R*.03:R*.015))),q,new V3(1,1,1));im.setMatrixAt(i*2+(sd>0?1:0),mx)}
  im.castShadow=true;g.add(im)}
 const rm=mPaint(rimCol,'metal');const dish=cyl(rr,rr,W*.92,rm,0,0,0,32);dish.rotation.z=Math.PI/2;g.add(dish);
 const face=cyl(rr*.9,rr*.9,.08,mPlastic('#111',.5),W*.47,0,0,32);face.rotation.z=Math.PI/2;g.add(face);
 for(let k=0;k<5;k++){const a=k/5*Math.PI*2,sp=box(.12,rr*.85,rr*.22,rm);sp.position.set(W*.5,Math.cos(a)*rr*.45,Math.sin(a)*rr*.45);sp.rotation.x=a;g.add(sp)}
 const hub=cyl(rr*.22,rr*.22,.15,mMetal('#9aa'),W*.52,0,0,6);hub.rotation.z=Math.PI/2;g.add(hub);
 // beadlock halqa: shinani diskka siqib turuvchi tashqi halqa va 12 ta bolt
 const ring=new THREE.Mesh(GEO('bead'+rr.toFixed(2),()=>new THREE.TorusGeometry(rr*.93,rr*.07,6,36)),mMetal('#2b2e33',.35));ring.rotation.y=Math.PI/2;ring.position.x=W*.49;g.add(ring);
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2,b=cyl(rr*.035,rr*.035,.12,mMetal('#d0d4da',.2),W*.53,Math.cos(a)*rr*.93,Math.sin(a)*rr*.93,6);b.rotation.z=Math.PI/2;g.add(b)}
 g.userData.R=R;return g}

// ---- silliq qobiq (loft): ketma-ket ko'ndalang kesimlar orqali — fuzelyaj, kabina, kuzov ----
// st: [{z,w,h,y}] (z o'sib boradi); kesim — superellips: n=2 ellips, n>2 yumaloq to'rtburchak
function loftGeo(st,n=2.6,seg=40){const pos=[],uv=[],idx=[],ring=seg+1;
 st.forEach((s,i)=>{for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);pos.push(s.w/2*Math.sign(ca)*Math.pow(Math.abs(ca),2/n),s.y+s.h/2*Math.sign(sa)*Math.pow(Math.abs(sa),2/n),s.z);uv.push(j/seg,i/(st.length-1))}});
 for(let i=0;i<st.length-1;i++)for(let j=0;j<seg;j++){const a=i*ring+j,b=a+1,c=a+ring,d=c+1;idx.push(a,b,c,b,d,c)}
 for(const[i,first]of[[0,true],[st.length-1,false]]){const s=st[i],ci=pos.length/3;pos.push(0,s.y,s.z);uv.push(.5,first?0:1);for(let j=0;j<seg;j++){const a=i*ring+j;first?idx.push(ci,a+1,a):idx.push(ci,a,a+1)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
// st jadvalini qulay yozish: [[z, w, h, y], ...] → loft mesh
function loft(rows,mat,n,seg){const m=new THREE.Mesh(loftGeo(rows.map(([z,w,h,y])=>({z,w,h,y})),n,seg),mat);m.castShadow=true;m.receiveShadow=true;m.userData.dispose=true;return m}
// yupqa simmetrik profilli yuza (stabilizator, kil): x bo'ylab "span", z bo'ylab vatar (oldingi qirra −z da)
function foilSurface(span,chord,mat){const t=chord*.09,s=new THREE.Shape(),N=16,yt=x=>5*t*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x*x*x-.1036*x*x*x*x);
 for(let i=0;i<=N;i++){const x=1-i/N;s[i?'lineTo':'moveTo'](x*chord,yt(x))}for(let i=1;i<=N;i++){const x=i/N;s.lineTo(x*chord,-yt(x))}
 const g=new THREE.ExtrudeGeometry(s,{depth:span,bevelEnabled:false,curveSegments:8});g.rotateY(-Math.PI/2);g.translate(span/2,0,-chord/2);const m=new THREE.Mesh(g,mat);m.castShadow=true;m.userData.dispose=true;return m}
