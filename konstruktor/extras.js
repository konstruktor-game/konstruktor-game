/* =====================================================================
   1) MASLAHATCHI — loyiha parametrlarini avtomatik yaxshilash.
      Tanlangan detallarning (motor, parrak, batareya…) parametrlarini o'zgartirib,
      saytning o'z hisob-kitoblari (T.derive / T.issues) bo'yicha eng yaxshi 3 variantni topadi.
   2) STL EKSPORT — 360° ko'rishdagi detalni 3D printer uchun .stl faylga (mm) saqlash.
   ===================================================================== */
'use strict';
(()=>{
const TUNE={copter:['motor','prop','esc','bat'],plane:['motor','prop','esc','bat','wing'],car:['motor','gear','esc','bat','wheel'],boat:['motor','prop','shaft','esc','bat'],robot:['motor','wheel','drv','bat']};
const GOAL={
 copter:(D,B)=>Math.min(D.tMix,30)*4+Math.min(D.TWR,B.purpose==='race'||B.purpose==='freestyle'?10:6)*3,
 plane:(D)=>Math.min(D.tCruise,45)-D.Vs*1.2+Math.min(D.TWR,1.2)*10,
 car:(D)=>Math.min(D.vTop*3.6,90)*.5+Math.min(D.tRun,30)*.6,
 boat:(D,B)=>Math.min(D.vTop*3.6,100)*(B.purpose==='speed'?.6:.2)+Math.min(D.tRun,40)*(B.purpose==='speed'?.4:1),
 robot:(D,B)=>Math.min(D.tRun,240)*.04-(B.purpose==='line'?Math.abs(D.v-.35)*30:B.purpose==='avoid'?Math.abs(D.v-.45)*20:-D.v*8)};
const GOALTXT={copter:'parvoz vaqti va tortish zaxirasi',plane:'sayr vaqti va sekin uchish',car:'tezlik va haydash vaqti',boat:'tezlik va suzish vaqti',robot:'ishlash vaqti va maqsadga mos tezlik'};
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
