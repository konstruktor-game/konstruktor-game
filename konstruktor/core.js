/* =====================================================================
   Konstruktor — umumiy yadro: yordamchilar, ovoz, 3D ustaxona, materiallar,
   slot (o'rnatish) tizimi, kamera boshqaruvi, simlarni tekshirish, holat va saqlash.
   Birliklar: 3D da 1 birlik = 1 sm. Og'irlik — gramm.
   ===================================================================== */
'use strict';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a);
const fmt=(n,d=0)=>{n=isFinite(n)?Number(n):0;if(d<0){const k=Math.pow(10,-d);n=Math.round(n/k)*k;d=0}return n.toLocaleString('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:d})};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const V3=THREE.Vector3,DEG=Math.PI/180;
const TYPES={};               // loyiha turlari (multikopter, samolyot, mashina) shu yerga ro'yxatdan o'tadi
const regType=t=>{TYPES[t.id]=t};

// ---------------- havo zichligi (balandlik va harorat) ----------------
// Tortish va ko'tarish kuchi havo zichligiga proporsional: tog'da va issiqda kuch kamayadi.
function airDensity(alt=0,temp=20){const T=temp+273.15,p=101325*Math.pow(Math.max(.05,1-2.25577e-5*alt),5.25588);return p/(287.05*T)}
const RHO0=1.225;

// ---------------- ovoz ----------------
let AC=null,hum=null;
function audioInit(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
addEventListener('pointerdown',audioInit);addEventListener('keydown',audioInit);
function snd(t,v=1){if(!AC||window.MUTE)return;const n=AC.currentTime;
 if(t==='screw'||t==='solder'||t==='boom'){const len=t==='boom'?1.2:t==='solder'?.35:.12,b=AC.createBuffer(1,Math.floor(AC.sampleRate*len),AC.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,t==='boom'?3:1.5)*(t==='screw'?(Math.sin(i/30)>0?1:.3):1);
  const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type=t==='solder'?'highpass':'lowpass';f.frequency.value=t==='solder'?3000:t==='boom'?500:1800;
  const g=AC.createGain();g.gain.value=(t==='boom'?.8:.18)*v;s.connect(f).connect(g).connect(AC.destination);s.start();return}
 const c={click:['sine',700,900,.05,.05],ok:['triangle',520,1040,.25,.12],err:['square',300,120,.25,.08],place:['sine',300,180,.12,.15],flip:['triangle',900,600,.08,.06]}[t];if(!c)return;
 const o=AC.createOscillator(),g=AC.createGain();o.type=c[0];o.connect(g).connect(AC.destination);o.frequency.setValueAtTime(c[1],n);o.frequency.exponentialRampToValueAtTime(c[2],n+c[3]);
 g.gain.setValueAtTime(c[4]*v,n);g.gain.exponentialRampToValueAtTime(.001,n+c[3]);o.start(n);o.stop(n+c[3]+.02)}
function humSet(on,f=0){if(!AC)return;if(!hum){const o=AC.createOscillator(),o2=AC.createOscillator(),fl=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o2.type='triangle';fl.type='lowpass';fl.frequency.value=900;g.gain.value=0;
  o.connect(fl);o2.connect(fl);fl.connect(g).connect(AC.destination);o.start();o2.start();hum={o,o2,fl,g}}
 const t=AC.currentTime;hum.g.gain.setTargetAtTime(on&&!window.MUTE?.035:0,t,.08);hum.o.frequency.setTargetAtTime(60+f*420,t,.06);hum.o2.frequency.setTargetAtTime(121+f*840,t,.06);hum.fl.frequency.setTargetAtTime(600+f*2600,t,.1)}

// ---------------- renderer ----------------
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.outputColorSpace=THREE.SRGBColorSpace;
const MAXANI=renderer.capabilities.getMaxAnisotropy();
let dynScale=1,simCam=null;
function resize(){const el=$('view');if(!el)return;const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)*dynScale);renderer.setSize(w,h,false);
 for(const c of[camera,simCam])if(c){c.aspect=w/h;c.updateProjectionMatrix()}}

// ---------------- teksturalar ----------------
const texCache={};
function ctex(key,w,h,draw,rep){if(texCache[key])return texCache[key];const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=MAXANI;if(rep)t.repeat.set(rep[0],rep[1]);return texCache[key]=t}
// karbon tola (twill to'qima)
const carbonTex=ctex('carbon',256,256,(g,w,h)=>{g.fillStyle='#0d0d0f';g.fillRect(0,0,w,h);const s=16;
 for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){const k=((x/s+y/s)>>1)%2===0,gr=k?g.createLinearGradient(x,y,x+s,y):g.createLinearGradient(x,y,x,y+s);
  gr.addColorStop(0,'#1b1c20');gr.addColorStop(.5,'#3a3c44');gr.addColorStop(1,'#16171a');g.fillStyle=gr;g.fillRect(x+.5,y+.5,s-1,s-1)}},[.32,.32]);
function pcbTex(base,label){return ctex('pcb'+base+label,256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
 g.strokeStyle='rgba(200,150,70,.35)';g.lineWidth=2;for(let i=0;i<40;i++){g.beginPath();let x=rnd(0,w),y=rnd(0,h);g.moveTo(x,y);for(let k=0;k<3;k++){if(Math.random()<.5)x+=rnd(-60,60);else y+=rnd(-60,60);g.lineTo(x,y)}g.stroke()}
 g.fillStyle='rgba(220,180,90,.8)';for(let i=0;i<60;i++)g.fillRect(rnd(0,w),rnd(0,h),3,3);
 g.fillStyle='rgba(255,255,255,.85)';g.font='bold 18px monospace';g.fillText(label,14,h-16);g.font='10px monospace';g.fillText('REV 2.1',w-60,18);
 g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.strokeRect(8,8,w-16,h-16)})}
// ustaxona gilami (o'lchov to'ri, 1 katak = 1 sm)
const matTex=ctex('mat',512,512,(g,w,h)=>{g.fillStyle='#1c4f43';g.fillRect(0,0,w,h);
 for(let i=0;i<=w;i+=16){g.strokeStyle=i%80===0?'rgba(255,255,255,.28)':'rgba(255,255,255,.1)';g.lineWidth=i%80===0?1.5:1;g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.moveTo(0,i);g.lineTo(w,i);g.stroke()}
 for(let i=0;i<4000;i++){g.fillStyle=`rgba(0,0,0,${rnd(0,.06)})`;g.fillRect(rnd(0,w),rnd(0,h),2,2)}});
function wrapTex(col,lines){return ctex('wrap'+col+lines.join('|'),256,128,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle='rgba(255,255,255,.92)';g.font='bold 30px sans-serif';g.fillText(lines[0]||'',14,48);g.font='bold 20px sans-serif';g.fillText(lines[1]||'',14,82);g.font='14px sans-serif';g.fillText(lines[2]||'',14,108);
 g.fillStyle='rgba(255,255,255,.6)';g.fillRect(w-40,14,24,24)})}

// ---------------- materiallar ----------------
const matCache={};
const MAT=(k,f)=>matCache[k]||(matCache[k]=f());
// sirt turi: yaltiroq / mat / metall / atlas — rang tanlashda ishlatiladi
const FIN={gloss:{r:.32,m:.05,cc:.8},matte:{r:.75,m:0,cc:0},metal:{r:.3,m:.85,cc:.2},satin:{r:.5,m:.1,cc:.35}};
function mPaint(col,fin='gloss'){const f=FIN[fin]||FIN.gloss;return MAT('p'+col+fin,()=>new THREE.MeshPhysicalMaterial({color:col,roughness:f.r,metalness:f.m,clearcoat:f.cc,clearcoatRoughness:.25}))}
function mCarbon(tint='#ffffff'){return MAT('cf'+tint,()=>new THREE.MeshPhysicalMaterial({map:carbonTex,color:tint,roughness:.42,metalness:.15,clearcoat:.9,clearcoatRoughness:.18}))}
const mMetal=(col='#b0b6bf',r=.28)=>MAT('m'+col+r,()=>new THREE.MeshStandardMaterial({color:col,roughness:r,metalness:.95}));
const mPlastic=(col,r=.55)=>MAT('pl'+col+r,()=>new THREE.MeshStandardMaterial({color:col,roughness:r,metalness:0}));
const mRubber=(col='#151515')=>MAT('rb'+col,()=>new THREE.MeshStandardMaterial({color:col,roughness:.92,metalness:0}));
const mCopper=()=>MAT('cu',()=>new THREE.MeshStandardMaterial({color:'#c97a3a',roughness:.35,metalness:1}));
const mGold=()=>MAT('au',()=>new THREE.MeshStandardMaterial({color:'#e0b050',roughness:.3,metalness:1}));
const mPCB=(base,label)=>MAT('pcbm'+base+label,()=>new THREE.MeshStandardMaterial({map:pcbTex(base,label),roughness:.45,metalness:.2}));
const mGlow=col=>MAT('gl'+col,()=>new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2.2,roughness:.4}));
const mGlass=()=>MAT('glass',()=>new THREE.MeshPhysicalMaterial({color:'#0a1220',roughness:.05,metalness:.2,clearcoat:1,clearcoatRoughness:.02}));
function mMat(kind,col,fin){if(kind==='carbon')return mCarbon(col);if(kind==='alu')return mMetal(col,.35);if(kind==='plastic')return mPlastic(col,.6);if(kind==='wood')return mPlastic(col,.8);return mPaint(col,fin)}

// ---------------- geometriya yordamchilari ----------------
const geoCache={};const GEO=(k,f)=>geoCache[k]||(geoCache[k]=f());
function mesh(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
const box=(w,h,d,mat,x,y,z)=>mesh(GEO(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),mat,x,y,z);
const cyl=(rt,rb,h,mat,x,y,z,seg=24)=>mesh(GEO(`c${rt},${rb},${h},${seg}`,()=>new THREE.CylinderGeometry(rt,rb,h,seg)),mat,x,y,z);
const sph=(r,mat,x,y,z)=>mesh(GEO('s'+r,()=>new THREE.SphereGeometry(r,20,14)),mat,x,y,z);
// yumaloq burchakli quti (plastinalar va korpuslar realistik ko'rinishi uchun)
function rbox(w,h,d,r,mat,x=0,y=0,z=0){r=Math.max(.01,Math.min(r,w/2-.01,d/2-.01));const k=`rb${w},${h},${d},${r}`;
 const g=GEO(k,()=>{const s=new THREE.Shape(),x0=-w/2,z0=-d/2;s.moveTo(x0+r,z0);s.lineTo(x0+w-r,z0);s.quadraticCurveTo(x0+w,z0,x0+w,z0+r);s.lineTo(x0+w,z0+d-r);s.quadraticCurveTo(x0+w,z0+d,x0+w-r,z0+d);
  s.lineTo(x0+r,z0+d);s.quadraticCurveTo(x0,z0+d,x0,z0+d-r);s.lineTo(x0,z0+r);s.quadraticCurveTo(x0,z0,x0+r,z0);
  const bv=Math.min(.06,h/4,r/2),e=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,curveSegments:6});e.rotateX(Math.PI/2);e.translate(0,h/2,0);return e});
 return mesh(g,mat,x,y,z)}
// sim (kabel): nuqtalar orqali silliq trubka
function wireMesh(pts,col,r=.08){const c=new THREE.CatmullRomCurve3(pts.map(p=>p.isVector3?p:new V3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(c,Math.max(8,pts.length*8),r,6,false),mPlastic(col,.4));m.castShadow=true;m.userData.dispose=true;return m}

// ---------------- ustaxona sahnasi ----------------
const scene=new THREE.Scene();scene.background=new THREE.Color('#0e1219');scene.fog=new THREE.Fog('#0e1219',300,1200);
const camera=new THREE.PerspectiveCamera(38,1,.5,4000);
{ // studiya muhit xaritasi (metall va lak yaltirashi uchun)
 const es=new THREE.Scene();es.background=new THREE.Color('#202630');
 const pan=(c,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);es.add(m)};
 pan('#ffffff',0,12,0,14,1,8);pan('#cfe0ff',-14,5,-4,1,6,10);pan('#ffe2c4',14,4,2,1,5,8);pan('#2c3a2f',0,-8,0,40,1,40);pan('#8aa0c0',0,4,-15,20,6,1);
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(es,.03).texture;pm.dispose()}
const hemi=new THREE.HemisphereLight('#dfe8ff','#283028',.35);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff3e6',2.4);key.position.set(60,140,80);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:10,far:600});key.shadow.bias=-.0005;key.shadow.normalBias=.02;scene.add(key,key.target);
const rim=new THREE.DirectionalLight('#9fc3ff',1.1);rim.position.set(-90,60,-110);scene.add(rim);
const table=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),new THREE.MeshStandardMaterial({map:matTex,roughness:.9}));table.rotation.x=-Math.PI/2;table.receiveShadow=true;scene.add(table);
matTex.repeat.set(50,50);

// ---------------- kamera boshqaruvi (aylantirish, surish, yaqinlashtirish) ----------------
const orb={th:.7,ph:1.0,r:60,tr:60,tg:new V3(0,4,0),auto:true,idle:0};
function camUpdate(dt){if(orb.auto&&orb.idle>6)orb.th+=dt*.1;orb.idle+=dt;orb.r+=(orb.tr-orb.r)*Math.min(1,dt*6);
 camera.position.set(orb.tg.x+orb.r*Math.sin(orb.ph)*Math.cos(orb.th),orb.tg.y+orb.r*Math.cos(orb.ph),orb.tg.z+orb.r*Math.sin(orb.ph)*Math.sin(orb.th));camera.lookAt(orb.tg)}
function fitCamera(size){orb.tr=clamp(size*1.9+12,28,900);orb.tg.set(0,Math.min(size*.1,14),0)}
const ptrs=new Map();let pinch0=0,downAt=null;
function bindOrbit(el,onPick,onHover){
 el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);downAt=[e.clientX,e.clientY,performance.now()];orb.idle=0;
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1])}});
 el.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p){onHover&&onHover(e);return}orb.idle=0;
  if(ptrs.size===2){ptrs.set(e.pointerId,[e.clientX,e.clientY]);const[a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch0&&d>0){orb.tr=clamp(orb.tr*pinch0/d,15,900);pinch0=d}return}
  const dx=e.clientX-p[0],dy=e.clientY-p[1];ptrs.set(e.pointerId,[e.clientX,e.clientY]);
  if(e.buttons===2||e.shiftKey){const r=new V3().subVectors(camera.position,orb.tg).normalize(),right=new V3().crossVectors(r,camera.up).normalize(),up=new V3().crossVectors(right,r);
   orb.tg.addScaledVector(right,dx*orb.r*.0016).addScaledVector(up,dy*orb.r*.0016)}
  else{orb.th+=dx*.007;orb.ph=clamp(orb.ph-dy*.007,.12,1.52)}});
 const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;if(downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])<6&&performance.now()-downAt[2]<600)onPick(e);downAt=null};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);downAt=null});
 el.addEventListener('pointerleave',e=>{onHover&&onHover(null)});
 el.addEventListener('wheel',e=>{e.preventDefault();orb.idle=0;orb.tr=clamp(orb.tr*(1+e.deltaY*.0012),15,900)},{passive:false});
 el.addEventListener('contextmenu',e=>e.preventDefault())}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pickAt(e,root){if(!root)return null;const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const hits=ray.intersectObject(root,true);for(const h of hits){let o=h.object;while(o&&!o.userData.slot&&!o.userData.label)o=o.parent;if(o)return o}return null}

// ---------------- slot (o'rnatish) tizimi ----------------
// Turi model qurishda ctx.add(slot, obj, ex) chaqiradi. O'rnatilgan detal — oddiy,
// navbatdagi o'rnatiladigan detal — yarim shaffof "arvoh" ko'rinishida chiqadi va bosilganda o'rnatiladi.
const ghostMat=new THREE.MeshBasicMaterial({color:'#5cc8ff',transparent:true,opacity:.3,depthWrite:false});
const ghostEdge=new THREE.LineBasicMaterial({color:'#9fe0ff',transparent:true,opacity:.55});
let model=null,modelObjs={},modelGhosts=[],explode=0,explodeT=0,dropAnim=[],spinners=[];
const slotKey=s=>s.replace(/\d+$/,'#');
function slotReq(T,slot){const r=T.req&&(T.req[slot]||T.req[slotKey(slot)]);if(!r)return[];const num=(slot.match(/\d+$/)||[''])[0];return(Array.isArray(r)?r:[r]).map(x=>x.replace('#',num))}
function slotAvailable(B,T,slot){return slotReq(T,slot).every(r=>B.inst[r])}
function slotLabel(T,slot){return(T.labels&&(T.labels[slot]||T.labels[slotKey(slot)]))||slot}
function buildModel(B,activeSlots,step){
 if(model){scene.remove(model);model.traverse(o=>{if(o.userData.dispose&&o.geometry)o.geometry.dispose()})}
 model=new THREE.Group();modelObjs={};modelGhosts=[];spinners=[];
 const T=TYPES[B.type],D=T.derive(B);
 const ctx={B,D,step,
  inst:s=>!!B.inst[s],
  add(slot,obj,ex=[0,0,0]){obj.userData.slot=slot;obj.userData.label=slotLabel(T,slot);obj.userData.base=obj.position.clone();obj.userData.ex=new V3(...ex);
   if(B.inst[slot]){model.add(obj);modelObjs[slot]=obj;return obj}
   if(activeSlots&&activeSlots.includes(slot)&&slotAvailable(B,T,slot)){obj.userData.ghost=true;
    obj.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=false;o.receiveShadow=false;const eg=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,30),ghostEdge);eg.userData.dispose=true;o.add(eg)}});
    model.add(obj);modelGhosts.push(obj);return obj}
   return null},
  deco(obj){model.add(obj);return obj},
  spin(obj,dir){spinners.push({o:obj,d:dir});return obj}};
 T.build(B,D,ctx);
 scene.add(model);
 const bb=new THREE.Box3().setFromObject(model),sz=bb.isEmpty()?new V3(20,10,20):bb.getSize(new V3());model.userData.size=Math.max(sz.x,sz.z,sz.y*1.5,12);
 return{model,D}}
function animateDrop(slot){const o=modelObjs[slot];if(!o)return;dropAnim.push({o,t:0,from:o.userData.base.y+Math.max(6,(model.userData.size||20)*.25)})}
function modelTick(dt,time){
 explode+=(explodeT-explode)*Math.min(1,dt*5);
 for(const s in modelObjs){const o=modelObjs[s];if(!dropAnim.some(a=>a.o===o))o.position.copy(o.userData.base).addScaledVector(o.userData.ex,explode)}
 for(const o of modelGhosts)o.position.copy(o.userData.base).addScaledVector(o.userData.ex,explode);ghostMat.opacity=.2+.15*Math.sin(time*4);
 for(let i=dropAnim.length-1;i>=0;i--){const a=dropAnim[i];a.t+=dt*2.6;const k=Math.min(1,a.t),e=1-Math.pow(1-k,3);a.o.position.copy(a.o.userData.base).addScaledVector(a.o.userData.ex,explode);a.o.position.y=lerp(a.from,a.o.position.y,e);if(k>=1)dropAnim.splice(i,1)}
 for(const s of spinners){if(s.o.userData.spinZ)s.o.rotation.z+=dt*(window.SPIN_SPEED||1.2)*s.d;else s.o.rotation.y+=dt*(window.SPIN_SPEED||1.2)*s.d}}

// ---------------- simlarni tekshirish (barcha turlar uchun umumiy) ----------------
// Kontakt turlari: vbat, gnd, 5v, 9v, tx, rx, sig, motor, esc, ch.
// Sim turlari: bat+/bat-, cap+/cap-, p5 (faqat 5V), p5t (5–36V), p9 (9V), gnd, tx, rx, sa (SmartAudio), sig, motor, plug, servo.
const PWR=['bat+','cap+','p5','p5t','p9'],GNDK=['bat-','cap-','gnd'],PWRPAD=['vbat','5v','9v'];
function wcheck(B){const T=TYPES[B.type],W=T.wiring(B),pads={};
 for(const b of W.boards)if(B.inst[b.need])for(const p of b.pads)pads[p.id]=Object.assign({board:b.id},p);
 const st={},why={},issues=[],fatal=[],burned=new Set(),works={},uart={},add=(lvl,t,y)=>issues.push({lvl,t,why:y});
 let total=0,connected=0,correct=0;
 const comps=W.comps.filter(c=>B.inst[c.need]);
 // UART qurilmalar uchun port raqami
 const uartUse={};
 for(const c of comps){for(const w of c.wires){total+=c.opt?0:1;const pid=B.wires[w.id],pad=pid&&pads[pid];
  if(!pad){st[w.id]=c.opt?'opt':'miss';continue}connected++;
  const t=pad.t,k=w.kind;let s='ok',msg='';
  if(PWR.includes(k)&&t==='gnd'){s='bad';if(k==='bat+'){fatal.push({k:'polarity',t:'Batareya qutblari teskari!',why:"Plus simi minus kontaktga ulangan — ulash bilan ESC kuyadi. Qizil sim doim + ga."})}
   else if(k==='cap+')fatal.push({k:'cap',t:'Kondensator teskari ulangan',why:"Elektrolitik kondensatorning uzun oyog'i (+) plusga ulanadi. Teskari ulansa qizib portlaydi."});
   else fatal.push({k:'short',t:`Qisqa tutashuv: ${c.label} quvvat simi GND ga ulangan`,why:"Plus va minus to'g'ridan-to'g'ri tutashadi — kontroller kuyadi."})}
  else if(GNDK.includes(k)&&PWRPAD.includes(t)){s='bad';if(k==='bat-')fatal.push({k:'polarity',t:'Batareya qutblari teskari!',why:"Minus simi plus kontaktga ulangan."});
   else if(k==='cap-')fatal.push({k:'cap',t:'Kondensator teskari ulangan',why:"Chiziqli (−) oyoq minusga ulanadi."});
   else fatal.push({k:'short',t:`Qisqa tutashuv: ${c.label} GND simi quvvat kontaktiga ulangan`,why:"GND faqat GND (G) kontaktlariga ulanadi."})}
  else if(k==='p5'&&(t==='9v'||t==='vbat')){s='bad';burned.add(c.id);add('bad',`${c.label} kuyadi: 5V qurilma ${pid} ga ulangan`,"Bu qurilma faqat 5 V ga mo'ljallangan.")}
  else if(k==='p5t'){if(!(t==='5v'||t==='9v')){s='bad';msg='5–9 V kontakt kerak'}}
  else if(k==='p9'&&t==='5v'){s='warn';add('warn',`${c.label} 5V dan quvvatlanmoqda`,"9V kerak: past kuchlanishda VTX qayta yuklanadi yoki kuchsiz ishlaydi.")}
  else if(k==='tx'||k==='rx'||k==='sa'){const want=k==='tx'?'rx':'tx';if(t!==want){s='bad';msg=t===k?'TX/RX almashib ketgan':'UART kontakt emas';
    if(t===k)add('bad',`${c.label}: ${w.l} simi ${pid} ga — TX va RX almashgan`,"Qurilmaning TX (uzatish) simi kontrollerning RX (qabul) kontaktiga ulanadi — xuddi telefon trubkasidagi og'iz va quloq kabi.")}
   else{const n=+pid.replace(/\D/g,'');(uartUse[w.uart]=uartUse[w.uart]||[]).push({w,n,k})}}
  else if(w.ok&&!w.ok.includes(pid)){s='bad'}
  st[w.id]=s;if(msg)why[w.id]=msg}}
 // UART juftligi va to'qnashuvi
 const portOwner={};
 for(const dev in uartUse){const L=uartUse[dev],ns=[...new Set(L.map(x=>x.n))];
  if(ns.length>1){for(const x of L)st[x.w.id]='bad';add('bad',`${dev.toUpperCase()}: TX va RX har xil UART ga ulangan (${ns.join(' va ')})`,"Bitta qurilmaning ikkala simi bir xil raqamli UART ga ulanadi (masalan T2 va R2).");continue}
  const n=ns[0];if(portOwner[n]){for(const x of L)st[x.w.id]='bad';add('bad',`UART${n} ikki qurilmada band`,"Har bir qurilmaga alohida UART kerak.");continue}portOwner[n]=dev;uart[dev]=n}
 // bir guruhdagi simlar turli kontaktlarda bo'lishi kerak (motor fazalari, V-dum)
 const grp={};for(const c of comps)for(const w of c.wires)if(w.grp&&B.wires[w.id])(grp[w.grp]=grp[w.grp]||[]).push(w);
 for(const g in grp){const seen={};for(const w of grp[g]){const p=B.wires[w.id];if(seen[p]){st[w.id]='bad';st[seen[p].id]='bad';add('bad',g==='mot'?"Ikkita motor simi bitta kontaktda":"Ikkita servo bitta kanalda","Har bir sim o'z kontaktiga ulanadi.")}else seen[p]=w}}
 for(const c of comps){const ok=c.wires.every(w=>st[w.id]==='ok'||st[w.id]==='warn'||st[w.id]==='opt');works[c.id]=ok&&!burned.has(c.id);
  for(const w of c.wires)if(st[w.id]==='ok'||st[w.id]==='warn')correct++}
 const complete=comps.every(c=>c.opt||c.wires.every(w=>B.wires[w.id]));
 const capOk=works.cap&&B.wires['cap+'];
 const extra=T.wextra?T.wextra(B):{};
 return{W,st,why,issues,fatal,burned,works,uart,complete,total,connected,correct,capOk,extra,comps}}

// ---------------- holat, tarix (bekor qilish), saqlash ----------------
const LS_KEY='konstruktor.v2';
let B=null;const undoStack=[],redoStack=[];
function cloneB(b){return JSON.parse(JSON.stringify(b))}
function pushUndo(){undoStack.push(JSON.stringify(B));if(undoStack.length>80)undoStack.shift();redoStack.length=0}
function newProject(type,preset){const T=TYPES[type],pid=preset&&T.presets[preset]?preset:T.defPreset,pr=T.presets[pid];
 return{v:2,type,name:pr.name,preset:pid,p:cloneB(pr.p),inst:{},wires:{},dirs:{},rev:false,col:cloneB(T.colors),fin:'gloss',
  env:{alt:0,temp:20},purpose:pr.purpose||T.defPurpose,prices:{},notes:'',step:0,id:null,pub:false,savedAt:Date.now()}}
function saveLocal(){try{B.savedAt=Date.now();localStorage.setItem(LS_KEY,JSON.stringify(B))}catch(e){}}
function loadLocal(){try{const b=JSON.parse(localStorage.getItem(LS_KEY));if(b&&b.v===2&&TYPES[b.type])return migrate(b)}catch(e){}return null}
// yangi parametrlar qo'shilganda eski loyihalar buzilmasligi uchun shablondan to'ldiramiz
function migrate(b){const T=TYPES[b.type],pr=T.presets[b.preset]||T.presets[T.defPreset];b.p=b.p||{};
 for(const c in pr.p){b.p[c]=Object.assign({},pr.p[c],b.p[c]||{})}b.col=Object.assign({},T.colors,b.col||{});b.env=b.env||{alt:0,temp:20};b.purpose=b.purpose||T.defPurpose;
 b.prices=b.prices||{};b.inst=b.inst||{};b.wires=b.wires||{};b.dirs=b.dirs||{};b.step=clamp(+b.step||0,0,T.steps.length-1);return b}
