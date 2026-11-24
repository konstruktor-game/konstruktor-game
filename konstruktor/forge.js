/* =====================================================================
   YASASH STOLI: har bir detal qismlardan yig'iladi.
   Arvoh (shaffof) joyni bosganda detal bir zumda o'rnatilmaydi — u ichki va ustki qismlarga
   ajralib stolga yoyiladi. Foydalanuvchi qismlarni bittalab joyiga qo'yadi:
   ichkaridagi qism (masalan, stator) uni yopadigan qismdan (rotor qo'ng'irog'i) oldin qo'yilishi shart.
   Hammasi joyiga tushgach, tayyor detal modelga o'rnatiladi.
   ===================================================================== */
'use strict';
(()=>{
const ordOf=o=>{for(let p=o;p;p=p.parent)if(p.userData&&p.userData.o!=null)return p.userData.o;return null};
const st=document.createElement('style');st.textContent=`
.fLbls{position:absolute;inset:0;pointer-events:none;z-index:4}
.fLbl{position:absolute;transform:translate(-50%,-100%);background:rgba(13,18,26,.86);border:1px solid var(--ln2);color:var(--tx);font-size:11px;font-weight:600;padding:3px 7px;border-radius:7px;white-space:nowrap}
.fLbl.done{border-color:rgba(47,207,122,.5);color:#bff3d6}.fLbl.next{border-color:var(--ac);color:#ffe3a6}.fLbl.lock{opacity:.7}
.fList{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.fItem{display:flex;align-items:center;gap:9px;text-align:left;padding:8px 10px;border-radius:10px;background:var(--p2);border:1px solid var(--ln);width:100%}
.fItem:hover{border-color:var(--ac)}.fItem .n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;background:var(--p4);flex:none}
.fItem.done{opacity:.75}.fItem.done .n{background:var(--ok);color:#06210f}.fItem.next .n{background:var(--ac);color:#1a1200}
.fItem b{font-size:12.5px;display:block}.fItem small{color:var(--mu);font-size:11px}
.fProg{height:6px;border-radius:4px;background:var(--p3);overflow:hidden;margin:6px 0 2px}.fProg i{display:block;height:100%;background:var(--ac);transition:width .3s}
.spark line{animation:spk .45s ease-out forwards}.spark .flash{animation:fl .35s ease-out forwards}.spark .smoke{opacity:0;animation:smk 1.8s ease-out forwards}
@keyframes spk{0%{opacity:1;stroke-dasharray:0 60}60%{opacity:1;stroke-dasharray:60 0}100%{opacity:0}}
@keyframes fl{0%{opacity:1;transform-origin:center;r:4}100%{opacity:0;r:26}}
@keyframes smk{0%{opacity:.75;transform:translateY(0) scale(.6)}100%{opacity:0;transform:translateY(-70px) scale(2.2)}}
.hintPad{animation:hp 1s ease-in-out 3}@keyframes hp{50%{stroke:#ffb020;stroke-width:6}}`;document.head.appendChild(st);

// ---- qism nomlari: avval geometriya turi, keyin material bo'yicha ----
const GEON=[['bell',"Rotor qo'ng'irog'i (ichida magnitlar)"],['tire','Shina'],['pblade','Parrak qanotlari'],['gear',"Tishli g'ildirak"],['spring','Prujina (amortizator)'],['grom','Rezina amortizatorlar'],
 ['hole','Montaj teshiklari (halqalar)'],['spin','Spinner (burun qalpoqchasi)'],['wing','Qanot (profil)'],['bead','Beadlock halqa va boltlar'],['towhook','Tortish ilgaklari'],['flare',"G'ildirak qanoti kengaytmalari"]];
const MATN=[['burnt','Kuygan qism'],['pcbm','Elektron plata'],['cu',"Mis o'ramlar (chulg'am)"],['au','Oltin qoplamali kontaktlar'],['glass','Shaffof qism (oyna)'],['canopy','Shaffof qopqoq'],['bglass','Shaffof qopqoq'],['carglass','Oynalar'],['acr','Akril plastina'],
 ['gl','Chiroqlar (LED)'],['cf','Karbon tola qism'],['rb','Rezina qism'],['m#','Metall qismlar (vint, val, korpus)'],['pl#','Plastik qism'],['p#',"Bo'yalgan korpus"],['ds','Korpus'],['escshr','Termo-qobiq'],['cgband','Belgi']];
function pieceName(o){for(let p=o;p;p=p.parent)if(p.userData&&p.userData.n)return p.userData.n;
 if(o.geometry&&o.geometry.type==='TubeGeometry')return'Simlar (kabellar)';
 const gk=o.geometry&&o.geometry.userData&&o.geometry.userData.k||'';for(const[k,n]of GEON)if(gk.startsWith(k))return n;
 const m=Array.isArray(o.material)?o.material[0]:o.material,mk=m&&m.userData&&m.userData.k||'';for(const[k,n]of MATN)if(mk.startsWith(k))return n;
 if(m&&m.map)return"Yorliqli qobiq";if(m&&m.transparent)return'Shaffof qism';return'Asosiy qism'}

const F={active:false,slot:null,pieces:[],root:null,pr:null,ghost:null,lbl:null,raf:0,hoverId:-1};
function start(slot){if(F.active)cancel(true);const D0=T.derive(B);let obj=null;
 const ctx={B,D:D0,step:'inspect',inst:()=>true,add(s,o){if(s===slot&&!obj)obj=o;return o},deco(){},spin(){}};T.build(B,D0,ctx);
 if(!obj){install(slot);return}
 closePop();F.slot=slot;F.label=slotLabel(T,slot);F.root=new THREE.Group();scene.add(F.root);const w=new THREE.Group();F.root.add(w);w.add(obj);F.root.updateMatrixWorld(true);
 const bb=new THREE.Box3().setFromObject(obj),c=bb.getCenter(new V3()),sz=bb.getSize(new V3());w.position.set(-c.x,-bb.min.y,-c.z);F.root.updateMatrixWorld(true);
 F.size=Math.max(sz.x,sz.y,sz.z,1);
 // arvoh: tayyor detal qayerda bo'lishi
 F.ghost=obj.clone(true);F.ghost.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=false;o.receiveShadow=false}});w.add(F.ghost);
 // qismlarga ajratish
 const meshes=[];obj.traverse(o=>{if(o.isMesh)meshes.push(o)});const by=new Map();for(const m of meshes){const n=pieceName(m);if(!by.has(n))by.set(n,[]);by.get(n).push(m)}
 F.pr=new THREE.Group();F.root.add(F.pr);let pieces=[...by.entries()].map(([name,ms])=>{const P=new THREE.Group();P.userData.label='__piece';F.pr.add(P);F.root.updateMatrixWorld(true);for(const m of ms)P.attach(m);
  const b=new THREE.Box3().setFromObject(P),s3=b.getSize(new V3()),os=ms.map(ordOf).filter(v=>v!=null);return{name,P,box:b,c:b.getCenter(new V3()),vol:Math.max(1e-4,s3.x*s3.y*s3.z),placed:false,ord:os.length?Math.min(...os):null}});
 // juda ko'p mayda qism bo'lsa — eng kichiklarini birlashtirish
 pieces.sort((a,b)=>b.vol-a.vol);while(pieces.length>9){const a=pieces.pop(),b=pieces[pieces.length-1];F.root.updateMatrixWorld(true);[...a.P.children].forEach(ch=>b.P.attach(ch));F.pr.remove(a.P);
  b.name=b.name.startsWith('Mayda')?b.name:"Mayda detallar (vint, ulagich…)";b.box.union(a.box);if(a.ord!=null)b.ord=b.ord==null?a.ord:Math.min(b.ord,a.ord);b.c=b.box.getCenter(new V3());const s3=b.box.getSize(new V3());b.vol=s3.x*s3.y*s3.z}
 w.remove(obj);
 // ichki qism avval: kichik qism kattasining qutisi ichida bo'lsa — uni yopib qo'yadi
 pieces.forEach((a,i)=>{a.id=i;a.P.userData.pid=i;a.before=[]});
 for(const a of pieces)for(const b of pieces){if(a===b)continue;if(a.ord!=null&&b.ord!=null){if(a.ord<b.ord)b.before.push(a.id);continue}if(b.vol<a.vol*1.3)continue;if(!b.box.containsPoint(a.c))continue;const I=a.box.clone().intersect(b.box),is=I.getSize(new V3());if(is.x*is.y*is.z/a.vol>.6)b.before.push(a.id)}
 // stolga yoyish: aylana bo'ylab, ichki qismlar oldinda (kameraga yaqin)
 const order=[...pieces].sort((a,b)=>a.before.length-b.before.length||a.vol-b.vol),n=order.length;
 order.forEach((p,i)=>{const a=Math.PI/2+(i-(n-1)/2)*Math.min(.7,Math.PI*1.6/Math.max(1,n)),sz3=p.box.getSize(new V3()),rho=F.size*.75+Math.max(sz3.x,sz3.z)*.6+1.5;
  const to=new V3(Math.cos(a)*rho,0,Math.sin(a)*rho),dy=-p.box.min.y;p.off=new V3(to.x-p.c.x,dy,to.z-p.c.z);p.P.position.copy(p.off)});
 F.pieces=pieces;
 // stol
 const tb=new THREE.Mesh(new THREE.CylinderGeometry(F.size*1.9+4,F.size*1.9+4,.4,64),MAT('ftable',()=>new THREE.MeshStandardMaterial({color:'#2b313a',roughness:.85,metalness:.1})));tb.position.y=-.21;tb.receiveShadow=true;tb.userData.dispose=true;F.root.add(tb);
 if(model)model.visible=false;$('tExplode').classList.add('hidden');
 orb.tg.set(0,Math.min(F.size*.25,6),F.size*.35);orb.tr=Math.max(F.size*3.3,18);orb.ph=.95;orb.auto=false;
 F.lbl=document.createElement('div');F.lbl.className='fLbls';$('view').appendChild(F.lbl);
 F.active=true;F.done=false;snd('click');renderPanel();setHint();loop();
 if(F.pieces.length===1)toast(`<i class=i-info></i> ${esc(glossName(F.label))} bitta yaxlit qismdan iborat — uni joyiga qo'ying`,2400)}
function blockers(p){return p.before.map(i=>F.pieces[i]).filter(q=>!q.placed)}
function place(p){if(!p||p.placed||p.moving)return;const bl=blockers(p);
 if(bl.length){snd('err');toast(`<i class=i-warn></i> Avval ichkaridagi qismni qo'ying: ${esc(bl.map(q=>q.name).join(', '))} — «${esc(p.name)}» uni yopib qo'yadi`,3000);return}
 p.moving={t:0,t0:performance.now(),from:p.P.position.clone()};snd('place')}
function pick(e){if(F.done)return;const o=pickAt(e,F.pr);if(!o)return;let q=o;while(q&&q.userData.pid===undefined)q=q.parent;if(q)place(F.pieces[q.userData.pid])}
function hover(e){const o=pickAt(e,F.pr);let q=o;while(q&&q.userData.pid===undefined)q=q.parent;const id=q?q.userData.pid:-1;renderer.domElement.style.cursor=id>=0&&!F.pieces[id].placed?'pointer':'';if(id!==F.hoverId){F.hoverId=id;setHint()}}
function loop(){if(!F.active)return;F.raf=requestAnimationFrame(loop);let moved=false;
 for(const p of F.pieces){if(!p.moving)continue;moved=true;const m=p.moving;m.t=Math.min(1,(performance.now()-m.t0)/550);const e=1-Math.pow(1-m.t,3);p.P.position.lerpVectors(m.from,new V3(),e);p.P.position.y+=Math.sin(Math.PI*m.t)*Math.max(2,F.size*.35);
  if(m.t>=1){p.P.position.set(0,0,0);p.moving=null;p.placed=true;snd('screw');renderPanel();setHint();if(F.pieces.every(x=>x.placed))finish()}}
 // qism nomlari (yorliqlar)
 const r=$('view').getBoundingClientRect(),v=new V3();let h='';const nx=nextPiece();
 for(const p of F.pieces){if(p.placed&&!F.done)continue;const b=new THREE.Box3().setFromObject(p.P);if(b.isEmpty())continue;v.set((b.min.x+b.max.x)/2,b.max.y+.4,(b.min.z+b.max.z)/2).project(camera);if(v.z>1)continue;
  const x=(v.x+1)/2*r.width,y=(1-v.y)/2*r.height,cl=p.placed?'done':p===nx?'next':blockers(p).length?'lock':'';h+=`<div class="fLbl ${cl}" style="left:${x}px;top:${y}px">${esc(p.name)}</div>`}
 if(F.lbl)F.lbl.innerHTML=h}
function nextPiece(){return F.pieces.filter(p=>!p.placed&&!p.moving&&!blockers(p).length).sort((a,b)=>(a.ord==null?99:a.ord)-(b.ord==null?99:b.ord)||a.vol-b.vol)[0]}
function finish(){F.done=true;if(F.ghost)F.ghost.visible=false;snd('ok');toast(`<i class=i-ok></i> ${esc(glossName(F.label))} tayyor — modelga o'rnatildi`,2200);const slot=F.slot;setTimeout(()=>{if(F.slot!==slot)return;cleanup();install(slot)},650)}
function cleanup(){cancelAnimationFrame(F.raf);if(F.root){scene.remove(F.root);F.root.traverse(o=>{if(o.userData.dispose&&o.geometry)o.geometry.dispose()})}if(F.lbl)F.lbl.remove();
 F.root=F.pr=F.ghost=F.lbl=null;F.pieces=[];F.active=false;F.slot=null;F.hoverId=-1;if(model)model.visible=true;$('tExplode').classList.remove('hidden');renderer.domElement.style.cursor=''}
function cancel(silent){if(!F.active)return;cleanup();if(model)fitCamera(model.userData.size||20);if(!silent){renderPanel();setHint();snd('place')}}
function panel(){const g=GLOSS[F.label]||{n:F.label,en:'',w:''},n=F.pieces.length,done=F.pieces.filter(p=>p.placed).length,nx=nextPiece();
 const cat=Object.keys(T.spec).find(c=>T.spec[c].g===F.label||(F.label==='battery'&&c==='bat'));
 return`<h2><i class=i-wrench></i> Yasash: ${esc(g.n)}</h2><p class="intro">${esc(g.w)} Detal ${n} qismdan iborat. Qismni stolda yoki ro'yxatda bosing — u joyiga tushadi. Ichkaridagi qismlar birinchi: tashqi qism ularni yopib qo'yadi.</p>
 <div class="card"><h3><i class=i-layers></i> Qismlar · ${done} / ${n}</h3><div class="fProg"><i style="width:${done/n*100}%"></i></div>
 <div class="fList">${F.pieces.map((p,i)=>{const bl=blockers(p),cl=p.placed?'done':p===nx?'next':'';return`<button class="fItem ${cl}" data-fp="${i}"><span class="n">${p.placed?IC('ok'):i+1}</span><span><b>${esc(p.name)}</b><small>${p.placed?'joyida':bl.length?'avval: '+esc(bl.map(q=>q.name).join(', ')):p===nx?'keyingi — shuni qo\'ying':'qo\'yish mumkin'}</small></span></button>`}).join('')}</div></div>
 ${cat?`<div class="card"><h3><i class=i-ruler></i> Siz belgilagan o'lchamlar</h3><div class="info" style="border:0">${T.spec[cat].f.map(f=>`<span>${esc(f.l)}</span><b>${f.type==='sel'?esc(f.o[B.p[cat][f.k]]):f.type==='bool'?(B.p[cat][f.k]?'ha':"yo'q"):fmt(B.p[cat][f.k],f.step<1?1:0)+' '+esc(f.u||'')}</b>`).join('')}</div><p class="note">O'lchamni o'zgartirish uchun yasashni bekor qilib, bosqich panelida parametrlarni tahrirlang.</p></div>`:''}
 <div class="row"><button class="btn" id="fCancel"><i class=i-back></i> Bekor qilish</button></div>`}
function bind(P){P.querySelectorAll('[data-fp]').forEach(b=>b.onclick=()=>place(F.pieces[+b.dataset.fp]));const c=P.querySelector('#fCancel');if(c)c.onclick=()=>cancel()}
function hint(){const h=F.hoverId>=0&&F.pieces[F.hoverId],nx=nextPiece(),done=F.pieces.filter(p=>p.placed).length;
 return h?`<i class=i-pointer></i> ${esc(h.name)}${h.placed?' — joyida':blockers(h).length?' — avval: '+esc(blockers(h).map(q=>q.name).join(', ')):' — bosing, joyiga qo\'yiladi'}`
  :`<i class=i-wrench></i> ${esc(glossName(F.label))}: qismlarni bittalab joyiga qo'ying (${done}/${F.pieces.length})${nx?' · keyingisi: '+esc(nx.name):''}`}
window.FORGE={get active(){return F.active},start,pick,hover,cancel,panel,bind,hint,_F:F,place};
})();
