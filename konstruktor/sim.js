/* =====================================================================
   SINOV STENDI: yig'ilgan qurilmani virtual maydonda sinash.
   Barcha qiymatlar (og'irlik, tortish, tok, sekin uchish tezligi, uzatma) loyihadan olinadi;
   simlardagi xatolar va mos kelmasliklar sinovda haqiqiy oqibat beradi.
   Birliklar: metr, kilogramm, soniya.
   ===================================================================== */
'use strict';
const simScene=new THREE.Scene();
simCam=new THREE.PerspectiveCamera(70,1,.03,3000);
let SIM=null;
(()=>{ // ochiq maydon
 simScene.fog=new THREE.Fog('#c9d9e6',120,900);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{top:{value:new THREE.Color('#3b78c4')},bot:{value:new THREE.Color('#cfe0ee')},sd:{value:new V3(.4,.75,.3).normalize()}},
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 top;uniform vec3 bot;uniform vec3 sd;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=max(d.y,0.);vec3 c=mix(bot,top,pow(h,.5));float s=max(dot(d,sd),0.);c+=vec3(1.,.95,.85)*(pow(s,600.)*4.+pow(s,12.)*.25);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`}));sky.userData.sky=true;simScene.add(sky);
 const hl=new THREE.HemisphereLight('#dbe9ff','#4a5a3a',.6);simScene.add(hl);
 const sun=new THREE.DirectionalLight('#fff2dc',2.6);sun.position.set(80,150,60);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:400});sun.shadow.bias=-.0004;simScene.add(sun,sun.target);simScene.userData.sun=sun;
 const grass=ctex('simgrass',256,256,(g,w,h)=>{g.fillStyle='#5c7b3d';g.fillRect(0,0,w,h);for(let i=0;i<220;i++){const x=rnd(0,w),y=rnd(0,h),r=rnd(6,30),gr=g.createRadialGradient(x,y,0,x,y,r),c=['72,96,48','104,124,64','118,112,70'][i%3];gr.addColorStop(0,`rgba(${c},.35)`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  for(let i=0;i<6000;i++){g.fillStyle=Math.random()<.5?`rgba(36,60,24,${rnd(.1,.35)})`:`rgba(150,175,95,${rnd(.08,.22)})`;g.fillRect(rnd(0,w),rnd(0,h),rnd(.6,1.4),rnd(2,4))}},[600,600]);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({map:grass,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;simScene.add(ground);
 const asphalt=ctex('asph',128,128,(g,w,h)=>{g.fillStyle='#3d4045';g.fillRect(0,0,w,h);for(let i=0;i<1500;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},255,${rnd(0,.07)})`;g.fillRect(rnd(0,w),rnd(0,h),1.5,1.5)}},[4,40]);
 const rw=new THREE.Mesh(new THREE.PlaneGeometry(14,160),new THREE.MeshStandardMaterial({map:asphalt,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2}));rw.rotation.x=-Math.PI/2;rw.position.set(0,.01,-60);rw.receiveShadow=true;simScene.add(rw);
 for(let z=-135;z<15;z+=10){const l=new THREE.Mesh(new THREE.PlaneGeometry(.3,4),new THREE.MeshBasicMaterial({color:'#e8e8e8'}));l.rotation.x=-Math.PI/2;l.position.set(0,.02,z);simScene.add(l)}
 const pad=new THREE.Mesh(new THREE.CircleGeometry(2.2,40),new THREE.MeshStandardMaterial({color:'#8d9096',roughness:.8,polygonOffset:true,polygonOffsetFactor:-3}));pad.rotation.x=-Math.PI/2;pad.position.set(0,.015,6);simScene.add(pad);
 const H=new THREE.Mesh(new THREE.RingGeometry(1.6,1.9,40),new THREE.MeshBasicMaterial({color:'#ff9800'}));H.rotation.x=-Math.PI/2;H.position.set(0,.02,6);simScene.add(H);
 // FPV darvozalari
 const gm=new THREE.MeshStandardMaterial({color:'#ff5722',roughness:.6});[[0,4,-25],[12,5,-50],[-10,6,-75],[0,3,-100]].forEach(([x,y,z],i)=>{const g=new THREE.Mesh(new THREE.TorusGeometry(2.2,.15,10,40),gm);g.position.set(x,y,z);g.castShadow=true;simScene.add(g);
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,y-2.2,8),new THREE.MeshStandardMaterial({color:'#333'}));p.position.set(x,(y-2.2)/2,z);simScene.add(p)});
 // mashina uchun konuslar va tramplin
 const cm=new THREE.MeshStandardMaterial({color:'#ff6d00',roughness:.6});for(let i=0;i<14;i++){const a=i/14*Math.PI*2,c=new THREE.Mesh(new THREE.ConeGeometry(.18,.45,14),cm);c.position.set(28+Math.cos(a)*12,.22,18+Math.sin(a)*7);c.castShadow=true;simScene.add(c)}
 const ramp=new THREE.Mesh(new THREE.BoxGeometry(3,.6,4),new THREE.MeshStandardMaterial({color:'#8d6e63',roughness:.9}));ramp.position.set(-22,.15,10);ramp.rotation.x=-.16;ramp.castShadow=true;ramp.receiveShadow=true;simScene.add(ramp);simScene.userData.ramp=ramp;
 // daraxtlar
 const tg=new THREE.ConeGeometry(2.4,7,10).translate(0,5,0),tk=new THREE.CylinderGeometry(.25,.35,2,8).translate(0,1,0),N=160,iT=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({color:'#2f4a2b',roughness:.9}),N),iK=new THREE.InstancedMesh(tk,new THREE.MeshStandardMaterial({color:'#4a3a2c'}),N),mx=new THREE.Matrix4();
 for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,r=rnd(110,400),s=rnd(.8,1.8);mx.makeScale(s,s*rnd(.9,1.3),s).setPosition(Math.cos(a)*r,0,Math.sin(a)*r);iT.setMatrixAt(i,mx);iK.setMatrixAt(i,mx)}iT.castShadow=true;simScene.add(iT,iK);
})();

// Modelni faqat o'rnatilgan detallar bilan qurish (sinov uchun)
function buildStatic(B){const T=TYPES[B.type],D=T.derive(B),g=new THREE.Group(),sp=[];
 const ctx={B,D,step:'test',inst:s=>!!B.inst[s],add(slot,o){if(B.inst[slot]){g.add(o);o.userData.slot=slot;return o}return null},deco(o){g.add(o);return o},spin(o,d){sp.push({o,d});return o}};
 T.build(B,D,ctx);g.userData.spinners=sp;return{g,D}}

const KEYS={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;KEYS[e.code]=true;if(SIM&&SIM.on&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>KEYS[e.code]=false);addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false});
const STK={l:{x:0,y:0},r:{x:0,y:0}};

// Sinov oldidan tekshiruv: nima ishlaydi, nima ishlamaydi va nima uchun
function preflight(B){const T=TYPES[B.type],D=T.derive(B),WC=wcheck(B),miss=[];
 for(const s of T.steps)if(s.slots&&s.kind!=='paint')for(const sl of s.slots(B))if(!B.inst[sl])miss.push(slotLabel(T,sl));
 const r={T,D,WC,miss,fatal:WC.fatal.slice(),notes:[],ok:true};
 if(miss.length){r.ok=false;r.block=`Yig'ish tugallanmagan: ${[...new Set(miss)].map(k=>GLOSS[k]?GLOSS[k].n:k).join(', ')} o'rnatilmagan.`;return r}
 if(!WC.works.xt60&&!r.fatal.length){r.ok=false;r.block="Batareya kabeli ESC ga to'g'ri ulanmagan — quvvat yo'q.";return r}
 return r}

function simStart(B){const pf=preflight(B);simStop();
 const{g,D}=buildStatic(B);const S={B,T:pf.T,D,pf,on:true,obj:new THREE.Group(),pos:new V3(),vel:new V3(),q:new THREE.Quaternion(),yaw:0,pitch:0,roll:0,w:new V3(),thr:0,armed:false,
  used:0,t:0,maxV:0,maxH:0,minV:99,status:'',fail:null,cam:'chase',burnT:0,heat:0,smoke:[],log:[],flipT:0,landed:true,steer:0,spd:0};
 g.scale.setScalar(.01);S.obj.add(g);S.model=g;simScene.add(S.obj);SIM=S;
 if(B.type==='copter'){S.pos.set(0,0,6)}else if(B.type==='plane'){S.pos.set(0,0,10);S.yaw=0}else{S.pos.set(28,0,6);S.yaw=Math.PI/2}
 const bb=new THREE.Box3().setFromObject(g);S.groundOff=-bb.min.y;S.size=Math.max(bb.getSize(new V3()).length(),.2);
 // sinov natijalarini oldindan aniqlash
 const WC=pf.WC,ex=WC.extra||{};S.ok=pf.ok&&!pf.fatal.length;
 if(B.type==='copter'){S.link=WC.works.rx;S.escLink=WC.works.escfc;S.video=B.p.vid.type==='none'?null:(WC.works.cam!==false&&WC.works.vtx);
  const wrongMotor=D.mot.some(q=>B.wires['m'+q.i]!=='M'+q.i),wrongProp=D.mot.some(q=>{const want=B.rev?(q.dir==='CW'?'CCW':'CW'):q.dir;return(B.dirs[q.i]||q.dir)!==want});
  S.flip=wrongMotor?'motor':wrongProp?'prop':null}
 else{S.link=WC.works.escsig&&WC.works.xt60;S.rev=!!ex.motorReversed;
  if(B.type==='plane'){const ch=id=>B.wires['w'+id];S.ctl={ail:[ch('svA1'),ch('svA2')],elev:B.p.tail.type==='vtail'?[ch('svV1'),ch('svV2')]:[ch('svE')],rud:B.p.tail.type==='vtail'?[ch('svV1'),ch('svV2')]:[ch('svR')]}}
  else S.ctl={steer:B.wires.wservo}}
 S.status=!pf.ok?pf.block:pf.fatal.length?pf.fatal[0].t:'Tayyor. "Ishga tushirish" ni bosing.';
 placeObj(S);return S}
function simStop(){if(SIM){simScene.remove(SIM.obj);for(const s of SIM.smoke)simScene.remove(s.m);SIM=null;humSet(false)}}
function placeObj(S){S.obj.position.copy(S.pos);S.obj.position.y+=S.groundOff;S.obj.quaternion.setFromEuler(new THREE.Euler(S.pitch,S.yaw,S.roll,'YXZ'))}
function simArm(){const S=SIM;if(!S)return;if(!S.pf.ok){S.status=S.pf.block;snd('err');return}
 if(S.pf.fatal.length){const f=S.pf.fatal[0];S.fail={t:f.t,why:f.why};puff(S,6,'#222');snd('boom',.6);humSet(false);return}
 if(S.B.type==='copter'){if(!S.link){S.status="Pult bilan aloqa yo'q — qabul qilgich ulanmagan yoki TX/RX almashgan. Dron ARM bo'lmaydi.";snd('err');return}
  if(!S.escLink){S.status="Kontroller ESC ga ulanmagan (8-pin kabel) — motorlar aylanmaydi.";snd('err');return}}
 else if(!S.link){S.status=S.B.type==='car'?"ESC signal kabeli CH2 ga ulanmagan — qabul qilgich quvvatsiz (BEC) va gaz ishlamaydi.":"ESC signal kabeli CH3 ga ulanmagan — qabul qilgich quvvatsiz (BEC), motor ishlamaydi.";snd('err');return}
 S.armed=true;S.status=S.B.type==='copter'?"ARM. W — gaz, A/D — burilish, strelkalar — egilish":S.B.type==='plane'?"W — gaz. Uchish yo'lagida tezlik oling, ↓ bilan burunni ko'taring":"W/S — gaz/tormoz, A/D — rul";snd('ok')}
const puffTex=ctex('puff',64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
function puff(S,n,col){for(let i=0;i<n;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:col,transparent:true,opacity:.7,depthWrite:false}));m.scale.setScalar(.25);m.position.copy(S.obj.position).add(new V3(rnd(-.1,.1),rnd(0,.1),rnd(-.1,.1)));simScene.add(m);S.smoke.push({m,v:new V3(rnd(-.3,.3),rnd(.6,1.4),rnd(-.3,.3)),t:rnd(1.5,3)})}}
function crash(S,why){if(S.fail)return;S.fail={t:'Halokat!',why};S.armed=false;snd('boom',.5);puff(S,10,'#555');humSet(false)}

function inputs(){const k=KEYS;return{thrUp:k.KeyW||k.ShiftLeft,thrDn:k.KeyS||k.ControlLeft,yaw:(k.KeyA?1:0)-(k.KeyD?1:0)+(-STK.l.x),pitch:(k.ArrowUp?1:0)-(k.ArrowDown?1:0)+(-STK.r.y),roll:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0)+STK.r.x,stickThr:STK.l.y}}

function T_pitch(S){return Math.max(5,S.D.rpm*S.B.p.prop.p*.0254/60*Math.max(S.thr,.05))}
function simTick(dt){const S=SIM;if(!S)return;dt=Math.min(dt,.033);const B=S.B,D=S.D,I=inputs(),rho=airDensity(B.env.alt,B.env.temp);
 for(let i=S.smoke.length-1;i>=0;i--){const s=S.smoke[i];s.t-=dt;s.m.position.addScaledVector(s.v,dt);s.m.scale.multiplyScalar(1+dt*.5);s.m.material.opacity=Math.max(0,s.t/3*.7);if(s.t<=0){simScene.remove(s.m);S.smoke.splice(i,1)}}
 if(S.fail&&S.burnT<3){S.burnT+=dt;if(Math.random()<.3)puff(S,1,'#333')}
 const g=9.81;
 if(B.type==='copter'){const m=D.AUW/1000,Tmax=D.n*D.Tm/1000*g,soc=1-S.used/B.p.bat.mah;
  if(S.armed){if(I.stickThr!==0)S.thr=clamp(-I.stickThr*.5+.5,0,1);else S.thr=clamp(S.thr+((I.thrUp?1:0)-(I.thrDn?1:0))*dt*.4,0,1)}else S.thr=Math.max(0,S.thr-dt);
  const sag=.82+.18*clamp(soc,0,1),upNow=new V3(0,1,0).applyQuaternion(S.obj.quaternion),vAx=Math.max(0,S.vel.dot(upNow)),vP=T_pitch(S),unload=clamp(1-vAx/(vP*1.15),0,1),T=S.armed&&soc>0?Tmax*S.thr*S.thr*sag*unload:0;
  if(S.armed&&D.overload>1.4&&S.thr>.7){S.heat+=dt;if(S.heat>5&&!S.motorDead){S.motorDead=true;S.status="Motor qizib kuydi! (motor juda yuklangan edi)";puff(S,8,'#444');snd('err')}}
  const tgtR=clamp(I.roll,-1,1)*35*DEG,tgtP=-clamp(I.pitch,-1,1)*35*DEG;
  if(!S.landed||T>m*g*.3){S.roll+=(tgtR-S.roll)*Math.min(1,dt*8);S.pitch+=(tgtP-S.pitch)*Math.min(1,dt*8);S.yaw+=clamp(I.yaw,-1,1)*3.2*dt}
  if(S.flip&&T>m*g*.5&&S.armed){S.flipT+=dt;S.roll+=dt*14*(S.flip==='prop'?1:-1);if(S.flipT>.15&&!S.flipMsg){S.flipMsg=1;S.status=S.flip==='prop'?"Dron ag'darildi: parrak aylanish yo'nalishiga mos emas (CW/CCW).":"Dron ag'darildi: motor simlari noto'g'ri ESC kontaktlariga ulangan (motor tartibi)."}}
  if(S.motorDead){S.roll+=dt*6;S.yaw+=dt*8}
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(S.pitch,S.yaw,S.roll,'YXZ')),up=new V3(0,1,0).applyQuaternion(q);
  const kd=.5*rho*.012*Math.pow(B.p.frame.wb/225,2)+.004;
  const acc=up.multiplyScalar(T/m).add(new V3(0,-g,0)).addScaledVector(S.vel,-kd*S.vel.length()/m);
  S.vel.addScaledVector(acc,dt);S.pos.addScaledVector(S.vel,dt);
  const I_A=S.armed?D.n*D.Imot*Math.pow(S.thr,3)+1.5:.4;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.amp=I_A;S.volt=D.V*sag;
  if(S.pos.y<=0){if(S.vel.y<-4.5||(Math.abs(S.roll)>1.2&&!S.landed))crash(S,`Yerga ${fmt(-S.vel.y,1)} m/s tezlikda urildi.`);S.pos.y=0;S.vel.multiplyScalar(.3);S.vel.y=Math.max(0,S.vel.y);S.landed=true;if(Math.abs(S.roll)>1)S.roll=Math.sign(S.roll)*Math.PI/2}else S.landed=false;
  if(soc<=0&&S.armed){S.status='Batareya tugadi — motorlar to\'xtadi.';S.armed=false}else if(soc<.2&&S.armed)S.status='Batareya kam — qo\'nish vaqti!';
  humSet(S.armed,S.thr);for(const s of S.model.userData.spinners)s.o.rotation.y+=dt*(S.armed?S.thr*80+8:0)*s.d}
 else if(B.type==='plane'){const p=B.p,m=D.AUW/1000,soc=1-S.used/p.bat.mah,Sm=D.S/1e4,AR=D.AR,CLmax={clarky:1.25,semi:1.1,sym:.95,flat:.85}[p.wing.foil];
  if(S.armed)S.thr=clamp(S.thr+((I.thrUp?1:0)-(I.thrDn?1:0))*dt*.5,0,1);
  const sag=.85+.15*clamp(soc,0,1);let thrust=S.armed&&soc>0?D.Tst/1000*g*S.thr*S.thr*sag*(S.rev?-.35:1)*clamp(1-S.vel.length()/(D.pitchSpd*1.1||1),0,1):0;
  const fwd=new V3(0,0,-1).applyQuaternion(S.q),upv=new V3(0,1,0).applyQuaternion(S.q),rgt=new V3(1,0,0).applyQuaternion(S.q);
  const V=S.vel.length(),vdir=V>.1?S.vel.clone().normalize():fwd.clone();
  const alpha=V>1?Math.asin(clamp(-vdir.dot(upv),-1,1)):0,stall=Math.abs(alpha)>15*DEG;
  const CL=stall?Math.sign(alpha)*CLmax*.55:clamp(alpha*5.2+.25,-CLmax,CLmax),qd=.5*rho*V*V;
  const L=qd*Sm*CL,Dr=qd*Sm*(.035+CL*CL/(Math.PI*.8*AR));
  const liftDir=V>.5?new V3().crossVectors(new V3().crossVectors(vdir,upv),vdir).normalize():upv;
  const F=new V3().addScaledVector(fwd,thrust).addScaledVector(liftDir,L).addScaledVector(vdir,-Dr).add(new V3(0,-m*g,0));
  // boshqaruv yuzalari: qaysi kanalga ulangan bo'lsa, o'sha buyruqni oladi
  const chCmd={CH1:clamp(I.roll,-1,1),CH2:clamp(I.pitch,-1,1)*-1,CH4:clamp(I.yaw,-1,1)*-1,CH5:clamp(I.roll,-1,1),CH6:clamp(I.roll,-1,1),CH3:0},cmd=a=>{const L=a.filter(Boolean);return L.length?L.reduce((s,c)=>s+(chCmd[c]||0),0)/L.length:0};
  const eff=clamp(V/(D.Vs*1.2),0,1.6),ail=cmd(S.ctl.ail),el=p.tail.type==='vtail'?cmd(S.ctl.elev):cmd(S.ctl.elev),rd=cmd(S.ctl.rud);
  const cgUnst=D.cgPct>36?(D.cgPct-36)*.25:0;
  S.w.x+=(-el*2.2*eff-S.w.x*3)*dt+(V>3&&!S.onGround?-alpha*2.5*clamp(D.Vh/.45,.3,1.5)*eff+cgUnst*alpha*3:0)*dt*4;
  S.w.z+=(-ail*3.2*eff-S.w.z*4)*dt;S.w.y+=(rd*1.2*eff-S.w.y*3)*dt;
  if(V>3&&!S.onGround){const side=vdir.dot(rgt);S.w.y+=-side*2*dt*eff;const bank=Math.asin(clamp(rgt.y,-1,1));S.w.z+=-bank*.25*(p.wing.dih/5)*dt}
  const dq=new THREE.Quaternion().setFromEuler(new THREE.Euler(S.w.x*dt,S.w.y*dt,S.w.z*dt,'YXZ'));S.q.multiply(dq).normalize();
  S.vel.addScaledVector(F,dt/m);S.pos.addScaledVector(S.vel,dt);
  S.onGround=false;if(S.pos.y<=0){const vy=S.vel.y,lvl=Math.abs(upv.y);if(vy<-3.5||lvl<.75||fwd.y<-.35)crash(S,`Yerga urildi (${fmt(-vy,1)} m/s, ${upv.y<.75?'qanot qiyshiq':'burun pastda'}).`);
   S.pos.y=0;S.vel.y=Math.max(0,S.vel.y);S.onGround=true;const f=S.thr>.05?.03:.25;S.vel.multiplyScalar(1-f*dt*3);
   const e=new THREE.Euler().setFromQuaternion(S.q,'YXZ');e.z*=.8;e.x=Math.max(e.x,-.05);S.q.setFromEuler(e);S.w.z*=.5}
  if(S.rev&&S.armed&&S.thr>.3&&!S.revMsg){S.revMsg=1;S.status="Samolyot oldinga yurmayapti: motor teskari aylanmoqda. Motorning istalgan ikki simini almashtiring."}
  if(stall&&V>2&&!S.onGround&&!S.stallMsg){S.stallMsg=1;setTimeout(()=>{if(SIM)SIM.stallMsg=0},2500);S.status=`STALL! Tezlik ${fmt(V*3.6)} km/soat — sekin uchish chegarasidan past (${fmt(D.Vs*3.6)}).`}
  const I_A=S.armed?D.Imot*Math.pow(S.thr,3)+.8:.3;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.amp=I_A;S.volt=D.V*sag;
  if(soc<=0&&S.armed){S.armed=false;S.status='Batareya tugadi — sirpanib qo\'nish kerak.'}
  humSet(S.armed,S.thr);for(const s of S.model.userData.spinners)s.o.rotation.y+=dt*(S.armed?S.thr*90:0);
  const e=new THREE.Euler().setFromQuaternion(S.q,'YXZ');S.yaw=e.y;S.pitch=e.x;S.roll=e.z}
 else{const p=B.p,m=D.AUW/1000,soc=1-S.used/p.bat.mah,sag=.85+.15*clamp(soc,0,1);
  let thr=0;if(S.armed&&soc>0)thr=(I.thrUp||KEYS.ArrowUp?1:0)-(I.thrDn||KEYS.ArrowDown?1:0)+(-STK.l.y);thr=clamp(thr,-1,1);if(S.rev)thr=-thr;
  const steerIn=clamp((KEYS.KeyA||KEYS.ArrowLeft?1:0)-(KEYS.KeyD||KEYS.ArrowRight?1:0)+(-STK.r.x),-1,1);
  const steer=S.ctl.steer==='CH1'?steerIn:S.ctl.steer==='CH2'?-thr:0;S.steer+=(steer*.5-S.steer)*Math.min(1,dt*8);
  const grip=D.grip,Fmax=Math.min(grip*m*g*(p.chassis.drive==='4wd'?1:.55),D.Pm*.75/Math.max(1.5,Math.abs(S.spd)));
  let F=0;if(S.heat>8){F=0;if(!S.hotMsg){S.hotMsg=1;S.status="Motor qizib himoyaga o'tdi (uzatma juda uzun). Pinionni kichraytiring.";puff(S,6,'#666')}}
  else if(thr>0)F=S.spd>=-.2?thr*Fmax*sag:m*g*grip;else if(thr<0)F=S.spd>.3?thr*m*g*grip:thr*Fmax*.5;
  if(Math.abs(thr)>.8&&D.load>1)S.heat+=dt*(D.load-.6);else S.heat=Math.max(0,S.heat-dt*.5);
  const crr=.04*g*m*Math.sign(S.spd),drag=.5*rho*.03*S.spd*Math.abs(S.spd);S.spd+=(F-crr-drag)/m*dt;if(Math.abs(S.spd)<.05&&thr===0)S.spd=0;S.spd=clamp(S.spd,-D.vTop*.5,D.vTop);
  const wb=p.chassis.wb/1000,yawRate=S.spd/wb*Math.tan(S.steer),latA=Math.abs(S.spd*yawRate);let slip=1;if(latA>grip*g){slip=grip*g/latA}
  const latEff=Math.min(latA,grip*g);if(latEff>D.stab*g*1.05&&!S.fail){S.roll=Math.sign(yawRate)*.4;crash(S,`Burilishda ag'darildi: yon tezlanish ${fmt(latEff/g,2)}g, barqarorlik ${fmt(D.stab,2)}. Shina yopishishi ag'darilish chegarasidan katta — koleyani kengaytiring yoki og'irlik markazini pasaytiring.`)}
  if(latA>grip*g*1.05&&!S.slideMsg&&!S.fail){S.slideMsg=1;setTimeout(()=>{if(SIM)SIM.slideMsg=0},2500);S.status='Shinalar sirpanmoqda — tezlikni kamaytiring.'}
  S.yaw+=yawRate*slip*dt;const dir=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw));S.vel.copy(dir).multiplyScalar(S.spd);
  if(!S.landed||S.pos.y>0){S.vel.y=(S.vy||0)}S.pos.addScaledVector(S.vel,dt);
  const rp=simScene.userData.ramp,rl=rp.position;if(Math.abs(S.pos.x-rl.x)<1.5&&S.pos.z>rl.z-2&&S.pos.z<rl.z+2&&S.pos.y<.5){S.pos.y=clamp((rl.z+2-S.pos.z)/4*.6,0,.6);S.vy=Math.max(S.vy||0,Math.abs(S.spd)*.16)}
  else{S.vy=(S.vy||0)-g*dt;S.pos.y+=S.vy*dt;if(S.pos.y<=0){if((S.vy||0)<-6)crash(S,'Juda baland sakrashdan qattiq qo\'ndi.');S.pos.y=0;S.vy=0}}
  S.pitch=S.pos.y>0?clamp(-(S.vy||0)*.05,-.4,.4):0;if(!S.fail)S.roll=clamp(-Math.min(latA,grip*g)*Math.sign(yawRate)*.004,-.15,.15);
  const I_A=S.armed?Math.abs(F*Math.abs(S.spd))/.75/D.V+.5:.2;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.amp=I_A;S.volt=D.V*sag;
  if(soc<=0&&S.armed){S.armed=false;S.status='Batareya tugadi.'}
  if(S.rev&&thr!==0&&!S.revMsg&&S.armed){S.revMsg=1;S.status="Mashina teskari yurmoqda: motor yo'nalishi teskari. ESC'da yo'nalishni o'zgartiring yoki ikki simni almashtiring."}
  if(S.ctl.steer!=='CH1'&&!S.steerMsg&&S.armed&&(steerIn!==0||thr!==0)){S.steerMsg=1;S.status=S.ctl.steer==='CH2'?"Rul gaz bilan birga buriladi: servo CH2 ga ulangan (CH1 bo'lishi kerak).":"Rul ishlamayapti: servo CH1 ga ulanmagan."}
  humSet(S.armed&&Math.abs(S.spd)>.1,Math.min(1,Math.abs(S.spd)/Math.max(1,D.vTop)));
  }
 S.t+=dt;const sp=S.vel.length();S.maxV=Math.max(S.maxV,sp);S.maxH=Math.max(S.maxH,S.pos.y);if(S.volt)S.minV=Math.min(S.minV,S.volt);
 if(Math.hypot(S.pos.x,S.pos.z)>600){S.pos.multiplyScalar(600/Math.hypot(S.pos.x,S.pos.z))}
 if(B.type!=='plane'){S.obj.position.copy(S.pos);S.obj.position.y+=S.groundOff;S.obj.quaternion.setFromEuler(new THREE.Euler(S.pitch,S.yaw,S.roll,'YXZ'))}
 else{S.obj.position.copy(S.pos);S.obj.position.y+=S.groundOff;S.obj.quaternion.copy(S.q)}
 // kamera
 const sun=simScene.userData.sun;sun.position.copy(S.obj.position).add(new V3(40,80,30));sun.target.position.copy(S.obj.position);
 const fwd=new V3(0,0,-1).applyQuaternion(S.obj.quaternion),dist=Math.max(1.2,S.size*3.2);
 if(S.cam==='fpv'&&B.type==='copter'){if(S.video===false){simCam.position.set(0,-50,0);simCam.lookAt(0,-60,0)}else{const tilt=B.p.vid.tilt*DEG;simCam.position.copy(S.obj.position).addScaledVector(fwd,S.size*.25);
  simCam.quaternion.copy(S.obj.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(1,0,0),tilt));if(simCam.fov!==B.p.vid.fov*.6){simCam.fov=clamp(B.p.vid.fov*.6,60,110);simCam.updateProjectionMatrix()}}}
 else if(S.cam==='pilot'){simCam.position.set(B.type==='car'?20:3,1.7,B.type==='car'?2:14);simCam.lookAt(S.obj.position);if(simCam.fov!==55){simCam.fov=55;simCam.updateProjectionMatrix()}}
 else{const flat=new V3(fwd.x,0,fwd.z);if(flat.lengthSq()<1e-4)flat.set(0,0,-1);flat.normalize();const want=S.obj.position.clone().addScaledVector(flat,-dist).add(new V3(0,dist*.42,0));
  simCam.position.lerp(want,Math.min(1,dt*4));simCam.lookAt(S.obj.position.clone().add(new V3(0,S.size*.2,0)));if(simCam.fov!==65){simCam.fov=65;simCam.updateProjectionMatrix()}}
 const sky=simScene.children.find(o=>o.userData.sky);sky.position.copy(simCam.position)}
