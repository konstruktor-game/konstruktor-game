/* =====================================================================
   1) MASLAHATCHI — loyiha parametrlarini avtomatik yaxshilash.
      Tanlangan detallarning (motor, parrak, batareya…) parametrlarini o'zgartirib,
      saytning o'z hisob-kitoblari (T.derive / T.issues) bo'yicha eng yaxshi 3 variantni topadi.
   2) STL EKSPORT — 360° ko'rishdagi detalni 3D printer uchun .stl faylga (mm) saqlash.
   ===================================================================== */
'use strict';
(()=>{
const TUNE={copter:['motor','prop','esc','bat'],plane:['motor','prop','esc','bat','wing'],car:['motor','gear','esc','bat','wheel'],boat:['motor','prop','shaft','esc','bat'],robot:['motor','wheel','drv','bat'],heli:['motor','gear','rotor','tail','bat','esc','servo'],rocket:['nose','fins','motor','recov'],tank:['motor','gear','track','esc','bat']};
const GOAL={
 heli:(D,B)=>Math.min(D.tHov,15)*(B.purpose==='scale'?3:1.5)+Math.min(D.twr,3)*(B.purpose==='scale'?3:8)-Math.abs(D.tip-150)*.05,
 rocket:(D,B)=>(B.purpose==='safe'?Math.min(D.ap,350)/25-Math.abs(D.vDesc-4.5)*3:Math.min(D.ap,1500)/40)-Math.abs(D.stab-1.5)*8-Math.abs(D.vEj)*.25,
 tank:(D,B)=>Math.min(D.climb,45)*.4+Math.min(D.v*3.6,10)*1.5+Math.min(D.tRun,40)*.3-Math.abs(D.LB-1.5)*8,
 copter:(D,B)=>Math.min(D.tMix,30)*4+Math.min(D.TWR,B.purpose==='race'||B.purpose==='freestyle'?10:6)*3,
 plane:(D)=>Math.min(D.tCruise,45)-D.Vs*1.2+Math.min(D.TWR,1.2)*10,
 car:(D)=>Math.min(D.vTop*3.6,90)*.5+Math.min(D.tRun,30)*.6,
 boat:(D,B)=>Math.min(D.vTop*3.6,100)*(B.purpose==='speed'?.6:.2)+Math.min(D.tRun,40)*(B.purpose==='speed'?.4:1),
 robot:(D,B)=>Math.min(D.tRun,240)*.04-(B.purpose==='line'?Math.abs(D.v-.35)*30:B.purpose==='avoid'?Math.abs(D.v-.45)*20:-D.v*8)};
const GOALTXT={heli:'muallaq turish va tortish zaxirasi',rocket:"apogey, barqarorlik va xavfsiz qo'nish",tank:'qiyalikka chiqish, tezlik va burilish',copter:'parvoz vaqti va tortish zaxirasi',plane:'sayr vaqti va sekin uchish',car:'tezlik va haydash vaqti',boat:'tezlik va suzish vaqti',robot:'ishlash vaqti va maqsadga mos tezlik'};
function score(B){const T=TYPES[B.type];let D;try{D=T.derive(B)}catch(e){return null}
 for(const k in D)if(typeof D[k]==='number'&&!isFinite(D[k]))return null;
 const I=T.issues(B,D),bad=I.filter(i=>i.lvl==='bad').length,warn=I.filter(i=>i.lvl==='warn').length;
 return{s:GOAL[B.type](D,B)-bad*60-warn*6,bad,warn,D}}
function fieldsOf(T,type){const L=[];for(const c of TUNE[type]||[])if(T.spec[c])for(const f of T.spec[c].f)L.push([c,f]);return L}
function mutate(p,F){const q=JSON.parse(JSON.stringify(p)),n=1+Math.floor(Math.random()*3);
 for(let i=0;i<n;i++){const[c,f]=F[Math.floor(Math.random()*F.length)];
  if(f.type==='sel'){const o=Object.keys(f.o);let v=o[Math.floor(Math.random()*o.length)];const cur=q[c][f.k];q[c][f.k]=typeof cur==='number'?+v:v}
  else if(f.type==='bool'){if(Math.random()<.3)q[c][f.k]=!q[c][f.k]}
  else{const span=(f.max-f.min),cur=q[c][f.k],d=(Math.random()<.5?-1:1)*Math.max(f.step,span*(Math.random()<.7?.05:.2)*Math.random());q[c][f.k]=clamp(Math.round((cur+d)/f.step)*f.step,f.min,f.max);q[c][f.k]=+q[c][f.k].toFixed(3)}}
 return q}
// natijaga ta'sir qilmaydigan o'zgarishlarni qaytarish (masalan, cho'tkasiz motorda «o'ramlar» soni)
function prune(base,v){for(const c in v.p)for(const k in v.p[c]){if(JSON.stringify(base.p[c]&&base.p[c][k])===JSON.stringify(v.p[c][k]))continue;
  const q=JSON.parse(JSON.stringify(v.p));q[c][k]=base.p[c][k];const r=score(Object.assign({},base,{p:q}));if(r&&r.s>=v.s-.05){v.p=q;v.s=Math.max(v.s,r.s);v.bad=r.bad;v.warn=r.warn;v.D=r.D}}}
function diff(T,a,b){const L=[];for(const c in b)for(const k in b[c])if(JSON.stringify(a[c]&&a[c][k])!==JSON.stringify(b[c][k])){const f=T.spec[c]&&T.spec[c].f.find(x=>x.k===k);if(!f)continue;
 const show=v=>f.type==='sel'?f.o[v]:f.type==='bool'?(v?'ha':"yo'q"):fmt(v,f.step<1?1:0)+' '+(f.u||'');L.push(`${T.spec[c].t}: ${f.l} — ${show(a[c][k])} → ${show(b[c][k])}`)}return L}
let RES=null,running=false;
function run(done){if(running)return;running=true;const T=TYPES[B.type],F=fieldsOf(T,B.type),base=JSON.parse(JSON.stringify(B)),s0=score(base);if(!F.length||!s0){running=false;done([]);return}
 const pool=[];let iter=0;const N=1800,starts=6;let cur=null;
 const step=()=>{const t0=performance.now();while(iter<N&&performance.now()-t0<25){if(iter%(N/starts)===0)cur={p:base.p,s:s0.s};
   const cand=Object.assign({},base,{p:mutate(cur.p,F)}),r=score(cand);iter++;if(!r)continue;if(r.s>=cur.s){cur={p:cand.p,s:r.s};pool.push({p:cand.p,s:r.s,bad:r.bad,warn:r.warn,D:r.D})}}
  if(iter<N){setTimeout(step,0);return}
  pool.sort((a,b)=>b.s-a.s);const out=[],seen=new Set();for(const v of pool){if(v.s<=s0.s+.5)break;if(v.bad>s0.bad)continue;prune(base,v);const d=diff(T,base.p,v.p);if(!d.length)continue;const key=d.join('|');if(seen.has(key))continue;if(out.some(o=>Math.abs(o.s-v.s)<1))continue;seen.add(key);v.diff=d;out.push(v);if(out.length===3)break}
  running=false;done(out,s0)};
 step()}
function html(){if(!TUNE[B.type])return'';return`<div class="card" id="advCard"><h3><i class=i-bulb></i> Maslahatchi</h3>
 <p class="note">Motor, parrak, batareya va boshqa detallarning parametrlarini ming martadan ko'p sinab ko'rib, <b>${GOALTXT[B.type]}</b> bo'yicha eng yaxshi 3 variantni taklif qiladi. Xatolar soni ham hisobga olinadi. Qaysi parametr nima uchun o'zgarganini o'rganing.</p>
 <div class="row" style="margin:8px 0"><button class="btn pri" id="advRun"><i class=i-search></i> Variantlarni topish</button></div><div id="advOut"></div></div>`}
function render(out,s0){const el=document.getElementById('advOut');if(!el)return;const T=TYPES[B.type];
 if(!out.length){el.innerHTML=`<div class="iss ok"><b>${IC('ok')} Loyihangiz tanlangan maqsad uchun allaqachon yaxshi</b><span>Sezilarli yaxshiroq variant topilmadi.</span></div>`;return}
 RES=out;el.innerHTML=out.map((v,i)=>{const M=T.metrics(Object.assign({},B,{p:v.p}),v.D).slice(0,4);
  return`<div class="card" style="background:var(--p2);margin:8px 0"><h3>${i+1}-variant <small style="color:var(--mu);font-weight:400">· ${v.bad?v.bad+' xato, ':''}${v.warn} ogohlantirish</small></h3>
  <div class="grid2" style="margin-bottom:6px">${M.map(m=>`<div class="kv"><small>${esc(m.l)}</small><b>${esc(m.v)}</b></div>`).join('')}</div>
  <ul style="margin:4px 0 8px 18px;font-size:12px;color:var(--tx2)">${v.diff.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>
  <button class="btn" data-adv="${i}"><i class=i-ok></i> Shu variantni qo'llash</button></div>`}).join('');
 el.querySelectorAll('[data-adv]').forEach(b=>b.onclick=()=>{const v=RES[+b.dataset.adv];pushUndo();for(const c in v.p)B.p[c]=Object.assign({},v.p[c]);commit();toast(`<i class=i-ok></i> Variant qo'llandi — o'zgarishlarni bekor qilish uchun «Orqaga» tugmasi`)})}
function bind(P){const b=P.querySelector('#advRun');if(!b)return;b.onclick=()=>{b.disabled=true;b.innerHTML=`<i class=i-search></i> Hisoblanmoqda…`;run((out,s0)=>{b.disabled=false;b.innerHTML=`<i class=i-search></i> Qayta qidirish`;render(out,s0)})}}

// ---------- STL eksport (ikkilik format, millimetrda) ----------
function exportSTL(obj,name){obj.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(obj.matrixWorld).invert(),tris=[],a=new V3(),b=new V3(),c=new V3(),m=new THREE.Matrix4();
 obj.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.geometry||!o.visible)return;const mat=o.material;if(mat&&mat.transparent&&mat.opacity<.3)return;
  const g=o.geometry,P=g.attributes.position;if(!P)return;m.multiplyMatrices(inv,o.matrixWorld);const I=g.index?g.index.array:null,n=I?I.length:P.count;
  for(let i=0;i<n;i+=3){const i0=I?I[i]:i,i1=I?I[i+1]:i+1,i2=I?I[i+2]:i+2;a.fromBufferAttribute(P,i0).applyMatrix4(m);b.fromBufferAttribute(P,i1).applyMatrix4(m);c.fromBufferAttribute(P,i2).applyMatrix4(m);
   if(m.determinant()<0)tris.push([a.clone(),c.clone(),b.clone()]);else tris.push([a.clone(),b.clone(),c.clone()])}});
 if(!tris.length){toast("Bu detalda eksport qilinadigan geometriya yo'q");return}
 const buf=new ArrayBuffer(84+tris.length*50),dv=new DataView(buf),hdr=`Konstruktor: ${name} (mm)`;for(let i=0;i<80;i++)dv.setUint8(i,i<hdr.length?hdr.charCodeAt(i)&127:32);dv.setUint32(80,tris.length,true);
 const S=10,nrm=new V3(),e1=new V3(),e2=new V3();let off=84;
 for(const[p0,p1,p2]of tris){e1.subVectors(p1,p0);e2.subVectors(p2,p0);nrm.crossVectors(e1,e2).normalize();
  // three.js: Y — yuqori; 3D printer dasturlari: Z — yuqori
  const w=v=>{dv.setFloat32(off,v.x*S,true);dv.setFloat32(off+4,-v.z*S,true);dv.setFloat32(off+8,v.y*S,true);off+=12};w(nrm.multiplyScalar(1/S));w(p0);w(p1);w(p2);dv.setUint16(off,0,true);off+=2}
 const url=URL.createObjectURL(new Blob([buf],{type:'model/stl'})),el=document.createElement('a');el.href=url;el.download=name.replace(/[^a-z0-9а-я'-]+/gi,'_')+'.stl';el.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 const bb=new THREE.Box3();for(const t of tris)for(const p of t)bb.expandByPoint(p);const s=bb.getSize(new V3()).multiplyScalar(S);
 toast(`<i class=i-download></i> STL saqlandi: ${tris.length} uchburchak, ${fmt(s.x)}×${fmt(s.z)}×${fmt(s.y)} mm`,2600)}
window.ADV={html,bind,run,score};window.STLX={exportSTL};
})();
// ---------- 3D o'lchagich: ikki nuqta orasidagi masofa (mm) ----------
(()=>{const R={active:false,pts:[],grp:null,lbl:null,raf:0};
 const btn=document.createElement('button');btn.className='vt';btn.id='tRuler';btn.title="Modelda ikki nuqtani bosing — orasidagi masofa millimetrda";btn.innerHTML=`${IC('ruler')}<span>O'lchash</span>`;
 const ref=document.getElementById('tXray');if(ref)ref.after(btn);
 const mk=()=>{R.grp=new THREE.Group();scene.add(R.grp);R.lbl=document.createElement('div');R.lbl.className='fLbls';$('view').appendChild(R.lbl)};
 function clear(){R.pts=[];if(R.grp){scene.remove(R.grp);R.grp.traverse(o=>{if(o.geometry)o.geometry.dispose()})}R.grp=null;if(R.lbl)R.lbl.remove();R.lbl=null}
 function toggle(on){R.active=on==null?!R.active:on;btn.classList.toggle('on',R.active);clear();cancelAnimationFrame(R.raf);if(R.active){mk();loop();setHint("O'lchash: modelda birinchi nuqtani bosing")}else setHint()}
 function pick(e){const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const root=(window.FORGE&&FORGE.active)?null:model;if(!root)return;const h=ray.intersectObject(root,true).find(x=>x.object.visible&&!(x.object.material&&x.object.material===ghostMat));if(!h)return;
  if(R.pts.length>=2){clear();mk()}R.pts.push(h.point.clone());snd('click');
  const dot=new THREE.Mesh(new THREE.SphereGeometry(Math.max(.15,(model.userData.size||20)*.008),12,8),new THREE.MeshBasicMaterial({color:'#ffb020',depthTest:false}));dot.renderOrder=10;dot.position.copy(h.point);R.grp.add(dot);
  if(R.pts.length===2){const g=new THREE.BufferGeometry().setFromPoints(R.pts),ln=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#ffb020',depthTest:false}));ln.renderOrder=10;R.grp.add(ln);
   const d=R.pts[0].distanceTo(R.pts[1])*10,dx=Math.abs(R.pts[0].x-R.pts[1].x)*10,dy=Math.abs(R.pts[0].y-R.pts[1].y)*10,dz=Math.abs(R.pts[0].z-R.pts[1].z)*10;setHint(`Masofa: ${fmt(d,1)} mm  (X ${fmt(dx,1)} · Y ${fmt(dy,1)} · Z ${fmt(dz,1)} mm). Yana bosing — yangi o'lchov.`)}
  else setHint("O'lchash: ikkinchi nuqtani bosing")}
 function loop(){if(!R.active)return;R.raf=requestAnimationFrame(loop);if(!R.lbl)return;if(R.pts.length<2){R.lbl.innerHTML='';return}
  const r=$('view').getBoundingClientRect(),v=R.pts[0].clone().add(R.pts[1]).multiplyScalar(.5);if(explode>.01){}v.project(camera);
  R.lbl.innerHTML=v.z<1?`<div class="fLbl next" style="left:${(v.x+1)/2*r.width}px;top:${(1-v.y)/2*r.height}px">${fmt(R.pts[0].distanceTo(R.pts[1])*10,1)} mm</div>`:''}
 btn.onclick=()=>{snd('click');toggle()};window.RULER={get active(){return R.active},pick,toggle};})();
// ---------- O'lchamlar: modelning umumiy eni, uzunligi, balandligi (chizma kabi o'lcham chiziqlari) ----------
// Model birligi: 1 = 1 sm. Uzunlik avtomatik birlikda: ≥ 1 m — metr, ≥ 10 sm — santimetr, aks holda millimetr.
const fmtLen=mm=>mm>=1000?`${fmt(mm/1000,2)} m`:mm>=100?`${fmt(mm/10,1)} sm`:`${fmt(mm,0)} mm`;
function objSize(o){const bb=new THREE.Box3();o.updateMatrixWorld(true);o.traverse(m=>{if(m.isMesh&&m.visible&&!(m.material&&(m.material===ghostMat||(m.material.transparent&&m.material.opacity<.3))))bb.expandByObject(m)});return bb}
(()=>{const D={on:false,grp:null,lbl:null,raf:0,bb:null,k:0};
 const btn=document.createElement('button');btn.className='vt';btn.id='tDims';btn.title="Modelning eni, uzunligi va balandligini chizmadagidek ko'rsatadi (m / sm)";btn.innerHTML=`${IC('ruler')}<span>O'lchamlar</span>`;
 const ref=document.getElementById('tRuler')||document.getElementById('tXray');if(ref)ref.after(btn);
 const names=()=>({plane:['Qanot yoyilishi','Uzunligi'],copter:['Eni (parraklar bilan)','Uzunligi'],heli:['Eni','Rotor bilan uzunligi'],rocket:['Diametri','Diametri']}[B.type]||['Eni','Uzunligi']);
 function clear(){if(D.grp){scene.remove(D.grp);D.grp.traverse(o=>{if(o.geometry)o.geometry.dispose()})}D.grp=null;if(D.lbl)D.lbl.remove();D.lbl=null;D.bb=null}
 function draw(){if(D.grp){scene.remove(D.grp);D.grp.traverse(o=>{if(o.geometry)o.geometry.dispose()})}D.grp=new THREE.Group();scene.add(D.grp);if(!model)return;
  const bb=objSize(model);if(bb.isEmpty())return;D.bb=bb;const s=bb.getSize(new V3()),off=Math.max(1.5,Math.max(s.x,s.z)*.08),y0=bb.min.y+.05,
   mat=new THREE.LineBasicMaterial({color:'#ffb020',depthTest:false,transparent:true,opacity:.95}),mat2=new THREE.LineBasicMaterial({color:'#ffb020',depthTest:false,transparent:true,opacity:.45}),
   L=(pts,m=mat)=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p=>new V3(...p))),m);l.renderOrder=11;D.grp.add(l)},t=off*.35,
   dim=(a,b,ext,dir)=>{L([a,b]);for(const p of[a,b]){L([p.map((v,i)=>v-ext[i]*off*.9),p.map((v,i)=>v+ext[i]*t)],mat2);L([p.map((v,i)=>v-dir[i]*t-ext[i]*t*.6),p.map((v,i)=>v+dir[i]*t+ext[i]*t*.6)])}};
  // eni (X) — old tomonda, uzunlik (Z) — o'ng tomonda, balandlik (Y) — o'ng-old burchakda
  dim([bb.min.x,y0,bb.min.z-off],[bb.max.x,y0,bb.min.z-off],[0,0,1],[0,0,0]);
  dim([bb.max.x+off,y0,bb.min.z],[bb.max.x+off,y0,bb.max.z],[-1,0,0],[0,0,0]);
  dim([bb.max.x+off,bb.min.y,bb.min.z-off],[bb.max.x+off,bb.max.y,bb.min.z-off],[0,0,0],[0,0,0]);
  D.pts=[[new V3((bb.min.x+bb.max.x)/2,y0,bb.min.z-off),names()[0],s.x],[new V3(bb.max.x+off,y0,(bb.min.z+bb.max.z)/2),names()[1],s.z],[new V3(bb.max.x+off,(bb.min.y+bb.max.y)/2,bb.min.z-off),'Balandligi',s.y]]}
 function loop(){if(!D.on)return;D.raf=requestAnimationFrame(loop);if(++D.k%30===1)draw();if(!D.lbl||!D.pts)return;
  const r=$('view').getBoundingClientRect();let h='';for(const[p,n,v]of D.pts){const q=p.clone().project(camera);if(q.z<1)h+=`<div class="fLbl next dimL" style="left:${(q.x+1)/2*r.width}px;top:${(1-q.y)/2*r.height}px"><small>${n}</small> ${fmtLen(v*10)}</div>`}D.lbl.innerHTML=h}
 function toggle(on){D.on=on==null?!D.on:on;btn.classList.toggle('on',D.on);cancelAnimationFrame(D.raf);clear();if(D.on){D.lbl=document.createElement('div');D.lbl.className='fLbls';$('view').appendChild(D.lbl);D.k=0;loop()}}
 btn.onclick=()=>{snd('click');toggle()};window.DIMS={toggle,get on(){return D.on}};
 const st=document.createElement('style');st.textContent='.dimL small{color:var(--mu);font-weight:500;margin-right:4px}.tipSz{display:block;margin-top:4px;color:#ffd58a;font-weight:600;font-size:11.5px}';document.head.appendChild(st)})();
// ---------- Klaviatura yorliqlari va "Tugmalar" qo'llanmasi ----------
// Har bir ko'rish tugmasiga harf biriktiriladi (tugma ustida ko'rinadi), "?" — barcha tugmalar ro'yxati.
(()=>{const KEYS=[['KeyE','tExplode','E','Ajratish — detallarni bir-biridan uzoqlashtiradi'],['KeyL','tLabels','L','Nomlar — har detal ustida nomi'],['KeyX','tXray','X',"Ichini ko'rish — kuzov shaffof bo'ladi"],
  ['KeyM','tRuler','M',"O'lchash — ikki nuqta orasidagi masofa"],['KeyD','tDims','D',"O'lchamlar — eni, uzunligi, balandligi (m / sm)"],['KeyF','tFit','F','Markazlash — modelni ekranga sig\'diradi'],['KeyR','tAuto','R','Aylanish — model sekin aylanadi'],['KeyS','tShot','S','Rasm — PNG sifatida saqlash'],
  ['BracketRight','bNext',']','Keyingi bosqich'],['BracketLeft','bPrev','[','Oldingi bosqich']],
  OTHER=[['Ctrl + Z','Bekor qilish'],['Ctrl + Y','Qaytarish'],['Esc',"Oynani yopish / 360° ko'rishdan chiqish"],['Sichqoncha chap','Aylantirish, detalni tanlash'],['Sichqoncha o\'ng / Shift','Surish'],['G\'ildirakcha','Yaqinlashtirish'],['?','Shu ro\'yxat'],['G / R / S','Erkin konstruktor (Blender kabi): surish / burish / o\'lcham'],['X / Y / Z (G, R, S dan keyin)','Faqat shu o\'q bo\'yicha; raqam yozsangiz — aniq qiymat'],['Enter / Esc','Tasdiqlash / bekor qilish'],['Shift + D','Nusxa olib, darhol surish'],['Numpad 1 / 3 / 7','Old / o\'ng / tepa (Ctrl bilan — orqa / chap)'],['Numpad .','Tanlangan detalga yaqinlashish'],['F12','Yuqori sifatli render (PNG)']];
 for(const[,id,k]of KEYS){const b=document.getElementById(id);if(b&&b.classList.contains('vt')&&!b.querySelector('kbd'))b.insertAdjacentHTML('beforeend',`<kbd class="vk">${k}</kbd>`);if(b&&!/\(/.test(b.title||''))b.title=(b.title||'')+` (${k})`}
 const st=document.createElement('style');st.textContent=`.vt{position:relative}.vk{margin-left:auto;padding:0 5px;min-width:16px;height:16px;line-height:16px;border-radius:4px;border:1px solid var(--ln2);color:var(--mu);font:600 10px/16px ui-monospace,Consolas,monospace;text-align:center;opacity:.8}
 .vt.on .vk{color:inherit;border-color:currentColor}.kbList{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;align-items:center;font-size:13px}.kbList kbd{justify-self:start;padding:2px 8px;border-radius:6px;border:1px solid var(--ln2);background:var(--bg2,#11161e);font:600 12px ui-monospace,Consolas,monospace;color:var(--tx);white-space:nowrap}
 .kbList h4{grid-column:1/-1;margin:8px 0 0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu)}`;document.head.appendChild(st);
 function help(){openModal(`<h2>${IC('keyboard')} Tugmalar va klaviatura</h2><p class="note">Har bir tugmaning vazifasi. Harfni bossangiz ham ishlaydi.</p><div class="kbList"><h4>Ko'rish oynasi</h4>${KEYS.map(([,,k,t])=>`<kbd>${esc(k)}</kbd><span>${esc(t)}</span>`).join('')}<h4>Umumiy</h4>${OTHER.map(([k,t])=>`<kbd>${esc(k)}</kbd><span>${esc(t)}</span>`).join('')}</div>`)}
 addEventListener('keydown',e=>{const t=e.target;if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable||e.ctrlKey||e.metaKey||e.altKey)return;
  if(typeof SIM!=='undefined'&&SIM&&SIM.on)return;if(e.key==='?'){e.preventDefault();help();return}
  const k=KEYS.find(x=>x[0]===e.code);if(!k)return;const b=document.getElementById(k[1]);if(b&&!b.disabled&&b.offsetParent!==null){e.preventDefault();b.click()}});
 const hb=document.createElement('button');hb.className='hb';hb.id='bKeys';hb.title='Tugmalar va klaviatura yorliqlari (?)';hb.innerHTML=`${IC('keyboard')}<span>Tugmalar</span>`;const m=document.getElementById('bMute');if(m)m.before(hb);hb.onclick=()=>{snd('click');help()};window.KEYHELP=help})();
// ---------- Ko'rinish tugmalari (Tinkercad ViewCube kabi): old, orqa, chap, o'ng, tepa, 3D — yumshoq o'tish bilan ----------
(()=>{const V=[['front','Old',-Math.PI/2,1.5,'1'],['right',"O'ng",0,1.5,'2'],['back','Orqa',Math.PI/2,1.5,'3'],['left','Chap',Math.PI,1.5,'4'],['top','Tepa',-Math.PI/2,.13,'5'],['iso','3D',-Math.PI/4,1.05,'0']];
 const box=document.createElement('div');box.className='vcube';box.innerHTML=V.map(([id,n,,,k])=>`<button data-vc="${id}" title="${n} tomondan ko'rish (${k})">${n}</button>`).join('');
 const view=document.getElementById('view');if(view)view.appendChild(box);let anim=null;
 function go(id){const v=V.find(x=>x[0]===id);if(!v)return;orb.auto=false;const t=document.getElementById('tAuto');if(t)t.classList.remove('on');
  let th=v[2];const cur=orb.th;while(th-cur>Math.PI)th-=Math.PI*2;while(cur-th>Math.PI)th+=Math.PI*2;anim={th0:cur,ph0:orb.ph,th,ph:v[3],t:0};
  box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.vc===id));snd('click')}
 (function tick(){requestAnimationFrame(tick);if(!anim)return;anim.t=Math.min(1,anim.t+.06);const e=1-Math.pow(1-anim.t,3);orb.th=anim.th0+(anim.th-anim.th0)*e;orb.ph=anim.ph0+(anim.ph-anim.ph0)*e;orb.idle=0;if(anim.t>=1)anim=null})();
 box.addEventListener('click',e=>{const b=e.target.closest('[data-vc]');if(b)go(b.dataset.vc)});
 addEventListener('keydown',e=>{const t=e.target;if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||e.metaKey||e.altKey)return;if(typeof SIM!=='undefined'&&SIM&&SIM.on)return;
  if(e.ctrlKey&&!/^Numpad/.test(e.code))return;if(/^Numpad[0137]$/.test(e.code)){const id={Numpad1:'front',Numpad3:'right',Numpad7:'top',Numpad0:'iso'}[e.code],alt={front:'back',right:'left'}[id];e.preventDefault();go(e.ctrlKey&&alt?alt:id);return}
  const v=V.find(x=>x[4]===e.key);if(v){e.preventDefault();go(v[0])}});
 // tanlov bekor bo'lsin — foydalanuvchi o'zi aylantirganda
 if(view)view.addEventListener('pointerdown',()=>{if(!anim)box.querySelectorAll('button.on').forEach(b=>b.classList.remove('on'))});
 const st=document.createElement('style');st.textContent=`.vcube{position:absolute;left:12px;bottom:12px;z-index:5;display:flex;gap:2px;padding:3px;border-radius:10px;background:rgba(12,16,22,.72);border:1px solid var(--ln);backdrop-filter:blur(8px)}
 .vcube button{padding:5px 9px;border-radius:7px;font-size:11.5px;font-weight:600;color:var(--tx2);transition:background .15s,color .15s}.vcube button:hover{background:var(--p3);color:var(--tx)}.vcube button.on{background:var(--ac-soft);color:var(--ac)}
 @media (max-width:760px){.vcube{left:8px;bottom:8px}.vcube button{padding:4px 6px;font-size:10.5px}}`;document.head.appendChild(st);window.VCUBE={go}})();
// ---------- Shablon rasmlari: har bir shablon haqiqiy 3D modeldan chiziladi (bir marta, keyin xotirada) ----------
(()=>{const cache={},q=[];let busy=false;
 const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1.6,.1,4000),hl=new THREE.HemisphereLight('#e8eeff','#2a2f36',.9),dl=new THREE.DirectionalLight('#ffffff',2.2);dl.position.set(40,80,-30);sc.add(hl,dl);
 const fl=new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.28,depthWrite:false}));fl.rotation.x=-Math.PI/2;sc.add(fl);
 function render(type,pid){const T=TYPES[type];if(!T||!T.presets[pid])return null;const b=newProject(type,pid);for(const s of T.steps)if(s.slots)for(const x of s.slots(b))b.inst[x]=true;
  if(type==='free')for(const o of (b.p.free&&b.p.free.items)||[])if(o.goal){Object.assign(o,o.goal);o.placed=true}
  const g=new THREE.Group(),D=T.derive(b),keepB=B;B=b;try{T.build(b,D,{B:b,D,step:'preview',inst:()=>true,add(s,o){g.add(o);return o},deco(o){g.add(o);return o},spin(o){return o}})}catch(e){B=keepB;return null}B=keepB;
  sc.add(g);const bb=new THREE.Box3().setFromObject(g);if(bb.isEmpty()){sc.remove(g);return null}g.position.y-=Math.min(0,bb.min.y);bb.setFromObject(g);
  const c=bb.getCenter(new V3()),s=bb.getSize(new V3()),R=Math.max(s.x*.9,s.y*1.25,s.z*.9)*.85+1;fl.scale.setScalar(Math.max(s.x,s.z)*.7);fl.position.set(c.x,.01,c.z);
  cam.position.set(c.x+R*1.5,c.y+R*.95,c.z-R*1.65);cam.lookAt(c);sc.environment=scene.environment;
  const W=renderer.domElement.width,H=renderer.domElement.height;cam.aspect=W/H;cam.updateProjectionMatrix();const bg=scene.background;sc.background=new THREE.Color('#161c26');
  renderer.render(sc,cam);const cv=document.createElement('canvas');cv.width=320;cv.height=200;const x=cv.getContext('2d'),r=Math.max(320/W,200/H),w=W*r,h=H*r;x.drawImage(renderer.domElement,(320-w)/2,(200-h)/2,w,h);
  sc.remove(g);g.traverse(o=>{if(o.userData&&o.userData.dispose&&o.geometry)o.geometry.dispose()});return cv.toDataURL('image/jpeg',.82)}
 function pump(){if(busy)return;const el=q.shift();if(!el)return;busy=true;setTimeout(()=>{const k=el.dataset.th;if(!cache[k]){const[t,p]=k.split(':');cache[k]=render(t,p)||'none'}
  if(cache[k]!=='none'&&el.isConnected){el.style.backgroundImage=`url(${cache[k]})`;el.classList.add('on')}busy=false;setTimeout(pump,10)},0)}
 function fill(){document.querySelectorAll('[data-th]').forEach(el=>{const k=el.dataset.th;if(cache[k]&&cache[k]!=='none'){el.style.backgroundImage=`url(${cache[k]})`;el.classList.add('on')}else q.push(el)});pump()}
 const st=document.createElement('style');st.textContent=`.tcard.tpre{padding-top:8px}.tthumb{height:112px;margin:-2px -4px 8px;border-radius:9px;background:#161c26 center/cover no-repeat;position:relative;overflow:hidden;opacity:.35;transition:opacity .35s,transform .35s}
 .tthumb:after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.07) 50%,transparent 70%);background-size:200% 100%;animation:thsh 1.2s linear infinite}.tthumb.on{opacity:1}.tthumb.on:after{display:none}
 .tcard.tpre:hover .tthumb{transform:scale(1.04)}@keyframes thsh{from{background-position:120% 0}to{background-position:-80% 0}}`;document.head.appendChild(st);window.PREVIEW={fill,render}})();

// ---------- F12 — yuqori sifatli render (Blender dagi kabi): 2,5 baravar aniqlik, yordamchi chiziqlarsiz, PNG ---------
(()=>{function render(){const pr=renderer.getPixelRatio(),hid=[];scene.traverse(o=>{if(o.visible&&o.renderOrder>=11&&o.renderOrder<=25){o.visible=false;hid.push(o)}});
  const lb=document.querySelectorAll('.fLbls');lb.forEach(e=>e.style.visibility='hidden');
  try{const el=$('view'),w=el.clientWidth,h=el.clientHeight,k=Math.min(3,4096/Math.max(w,h));renderer.setPixelRatio(k);renderer.setSize(w,h,false);renderFrame();
   const c=renderer.domElement,o=document.createElement('canvas');o.width=c.width;o.height=c.height;const g=o.getContext('2d');g.drawImage(c,0,0);
   const fs=Math.round(o.height*.022);g.font=`600 ${fs}px Inter,Segoe UI,Arial`;g.fillStyle='rgba(255,255,255,.55)';g.textAlign='right';g.fillText(`Konstruktor · ${(B&&B.name)||(TYPES[B.type]||{}).name||''}`,o.width-fs,o.height-fs);
   o.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='konstruktor-render.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast(`${IC('image')} Render saqlandi: ${o.width}×${o.height} px`,2400)},'image/png')}
  finally{renderer.setPixelRatio(pr);resize();hid.forEach(o=>o.visible=true);lb.forEach(e=>e.style.visibility='')}snd('ok')}
 addEventListener('keydown',e=>{if(e.key==='F12'&&!e.ctrlKey&&!e.shiftKey){const t=e.target;if(t.tagName==='INPUT'||t.tagName==='TEXTAREA')return;e.preventDefault();render()}});window.HIRENDER=render})();
