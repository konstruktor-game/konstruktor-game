/* =====================================================================
   O'QUV MARKAZI
   1) Topshiriqlar — har bir tur uchun muhandislik vazifalari. Shart saytning o'z hisob-kitoblari
      (T.derive / T.issues) bo'yicha avtomatik tekshiriladi; bajarilganlari saqlanadi.
   2) Bilim testi — lug'atdan 10 ta savol: atama ↔ ta'rif.
   ===================================================================== */
'use strict';
(()=>{
const st=document.createElement('style');st.textContent='.fItem.bad{border-color:var(--bad);background:rgba(255,93,93,.08)}#lBody .fItem.done{opacity:1;border-color:var(--ok);background:rgba(47,207,122,.08)}#lBody .fItem span{font-size:12.5px}';document.head.appendChild(st);
const noBad=(B,D,I)=>!I.some(i=>i.lvl==='bad');
const TASKS={
 copter:[['c1',"250 g dan yengil dron",'Ro\'yxatdan o\'tkazish talab etilmaydigan engil dron: og\'irlik < 250 g, xatosiz.',(B,D,I)=>D.AUW<250&&noBad(B,D,I)],
  ['c2','10 daqiqa muallaq turish','Muallaq turish vaqti ≥ 10 daqiqa, tortish/og\'irlik ≥ 3.',(B,D,I)=>D.tHover>=10&&D.TWR>=3&&noBad(B,D,I)],
  ['c3','Poyga droni','Tortish/og\'irlik ≥ 10 va hech qanday ogohlantirishsiz.',(B,D,I)=>D.TWR>=10&&!I.some(i=>i.lvl==='bad'||i.lvl==='warn')],
  ['c4',"Yuk tashuvchi",'Qo\'shimcha yuk ko\'tarish zaxirasi ≥ 1500 g.',(B,D,I)=>D.payload>=1500&&noBad(B,D,I)]],
 plane:[['p1','Sekin trener','Sekin uchish tezligi ≤ 20 km/soat, og\'irlik markazi to\'g\'ri.',(B,D,I)=>D.Vs*3.6<=20&&D.cgPct>=25&&D.cgPct<=33&&noBad(B,D,I)],
  ['p2','Uzoq parvoz','Sayr rejimida ≥ 30 daqiqa uchish.',(B,D,I)=>D.tCruise>=30&&noBad(B,D,I)],['p3','Tezkor samolyot','Maksimal tezlik ≥ 100 km/soat.',(B,D,I)=>D.Vmax*3.6>=100&&noBad(B,D,I)]],
 car:[['m1','50 km/soat','Maksimal tezlik ≥ 50 km/soat, xatosiz.',(B,D,I)=>D.vTop*3.6>=50&&noBad(B,D,I)],['m2',"Ag'darilmaydigan",'Barqarorlik ≥ 1,5 (keskin burilishda ag\'darilmaydi).',(B,D,I)=>D.stab>=1.5&&noBad(B,D,I)],
  ['m3','Uzoq haydash','Haydash vaqti ≥ 20 daqiqa.',(B,D,I)=>D.tRun>=20&&noBad(B,D,I)]],
 boat:[['k1','Glissirlovchi kater','Kater glissirlashga chiqsin va xatosiz bo\'lsin.',(B,D,I)=>D.planes&&noBad(B,D,I)],['k2','70 km/soat','Maksimal tezlik ≥ 70 km/soat.',(B,D,I)=>D.vTop*3.6>=70&&noBad(B,D,I)],
  ['k3','Uzoq sayr','Suzish vaqti ≥ 15 daqiqa.',(B,D,I)=>D.tRun>=15&&noBad(B,D,I)]],
 robot:[['r1',"Chiziq kuzatuvchi",'Chiziq sensorlari bor, tezlik 0,2–0,5 m/s, xatosiz.',(B,D,I)=>B.p.sens.line&&D.v>=.2&&D.v<=.5&&noBad(B,D,I)],['r2','Ikki soat ishlash','Ishlash vaqti ≥ 120 daqiqa.',(B,D,I)=>D.tRun>=120&&noBad(B,D,I)],
  ['r3','ESP32 robot','ESP32 plata, HC-SR04 bilan to\'g\'ri kuchlanish bo\'lgich.',(B,D,I)=>B.p.mcu.kind==='esp32'&&B.p.sens.us&&B.p.sens.div&&noBad(B,D,I)]],
 heli:[['h1','Barqaror vertolyot','Tortish/og\'irlik ≥ 2, pichoq uchi 120–190 m/s.',(B,D,I)=>D.twr>=2&&D.tip>=120&&D.tip<=190&&noBad(B,D,I)],['h2','Uzoq muallaq','Muallaq turish ≥ 8 daqiqa.',(B,D,I)=>D.tHov>=8&&noBad(B,D,I)]],
 rocket:[['k1','Ideal barqarorlik','Barqarorlik 1–2 kalibr, qo\'nish ≤ 6 m/s, xatosiz.',(B,D,I)=>D.stab>=1&&D.stab<=2&&D.vDesc<=6&&noBad(B,D,I)],['k2','500 metr','Apogey ≥ 500 m, parashyut apogeyga yaqin ochiladi (|v| ≤ 10 m/s).',(B,D,I)=>D.ap>=500&&Math.abs(D.vEj)<=10&&noBad(B,D,I)],
  ['k3','Kichik dvigatel bilan 200 m','C yoki kichikroq dvigatel bilan apogey ≥ 200 m.',(B,D,I)=>/^[ABC]/.test(B.p.motor.cls)&&D.ap>=200&&noBad(B,D,I)]],
 tank:[['t1','Tog\' tanki','Qiyalikka chiqish ≥ 35°, L/B 1,2–1,8.',(B,D,I)=>D.climb>=35&&D.LB>=1.2&&D.LB<=1.8&&noBad(B,D,I)],['t2','Tezkor gusenitsa','Tezlik ≥ 6 km/soat, xatosiz.',(B,D,I)=>D.v*3.6>=6&&noBad(B,D,I)]]};
const LS='konstruktor.tasks';const load=()=>{try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return{}}},save=o=>{try{localStorage.setItem(LS,JSON.stringify(o))}catch(e){}};
function evalTasks(){const T=TYPES[B.type],D=T.derive(B),I=T.issues(B,D),W=wcheck(B);I.push(...W.fatal.map(f=>({lvl:'bad',t:f.t})));const done=load();let nw=0;
 const L=(TASKS[B.type]||[]).map(([id,t,d,fn])=>{let ok=false;try{ok=!!fn(B,D,I)}catch(e){}const key=B.type+':'+id;if(ok&&!done[key]){done[key]=Date.now();nw++}return{id,t,d,ok,was:!!done[key]}});if(nw)save(done);return{L,nw}}
function tasksHTML(){const{L,nw}=evalTasks(),all=load(),total=Object.values(TASKS).flat().length,got=Object.keys(all).length;
 return`<p class="note">Topshiriq bajarilgani loyihangiz parametrlari va hisob-kitoblari bo'yicha avtomatik tekshiriladi. Parametrlarni o'zgartiring — natija darhol yangilanadi. Jami: <b>${got} / ${total}</b> bajarilgan.</p>
 <h3 style="margin:12px 0 8px">${IC(TYPES[B.type].ic)} ${esc(TYPES[B.type].name)}</h3>${L.map(x=>`<div class="iss ${x.ok?'ok':x.was?'info':'warn'}"><b>${IC(x.ok?'ok':x.was?'trophy':'target')} ${esc(x.t)}</b><span>${esc(x.d)}${x.ok?' — hozirgi loyiha shartni bajaradi.':x.was?' — avval bajarilgan.':''}</span></div>`).join('')||'<p class="note">Bu tur uchun topshiriqlar tez orada.</p>'}
 <h3 style="margin:14px 0 8px">Boshqa turlar</h3><div class="chips">${Object.entries(TASKS).filter(([t])=>t!==B.type).map(([t,L])=>`<span class="chip">${IC(TYPES[t].ic)} ${esc(TYPES[t].name)}: ${L.filter(x=>all[t+':'+x[0]]).length}/${L.length}</span>`).join('')}</div>${nw?`<p class="note" style="color:var(--ok)">${IC('trophy')} Yangi topshiriq bajarildi!</p>`:''}`}
// ---- bilim testi ----
let Q=null;
function newQuiz(){const keys=Object.keys(GLOSS).filter(k=>GLOSS[k].w&&GLOSS[k].w.length>15),pick=[];while(pick.length<10&&pick.length<keys.length){const k=keys[Math.floor(Math.random()*keys.length)];if(!pick.includes(k))pick.push(k)}
 Q={i:0,score:0,items:pick.map(k=>{const mode=Math.random()<.5?'def':'term',wrong=[];while(wrong.length<3){const w=keys[Math.floor(Math.random()*keys.length)];if(w!==k&&!wrong.includes(w)&&GLOSS[w].n!==GLOSS[k].n)wrong.push(w)}const opts=[k,...wrong].sort(()=>Math.random()-.5);return{k,mode,opts}}),ans:null}}
function quizHTML(){if(!Q)newQuiz();if(Q.i>=Q.items.length){const p=Q.score/Q.items.length;return`<div class="card" style="text-align:center"><h3 style="justify-content:center">${IC('trophy')} Natija: ${Q.score} / ${Q.items.length}</h3><p class="note">${p>=.9?"A'lo! Siz detallarni yaxshi bilasiz.":p>=.6?"Yaxshi. Lug'atda xato javoblarni qayta o'qing.":"Lug'at bo'limini o'qib, qayta urinib ko'ring."}</p><div class="row" style="justify-content:center;margin-top:10px"><button class="btn pri" id="qNew">${IC('cw')} Yangi test</button></div></div>`}
 const it=Q.items[Q.i],g=GLOSS[it.k];const q=it.mode==='def'?`«<b>${esc(g.n)}</b>» nima?`:`Qaysi detal yoki tushuncha: «${esc(g.w)}»`;
 return`<div class="fProg"><i style="width:${Q.i/Q.items.length*100}%"></i></div><p class="note">${Q.i+1}-savol / ${Q.items.length} · To'g'ri: ${Q.score}</p><div class="card"><p style="font-size:14px;margin-bottom:10px">${q}</p><div class="fList">${it.opts.map(k=>{const o=GLOSS[k],cls=Q.ans==null?'':k===it.k?'done':k===Q.ans?'bad':'';return`<button class="fItem ${cls}" data-qa="${esc(k)}" ${Q.ans!=null?'disabled':''}><span>${esc(it.mode==='def'?o.w:o.n)}</span></button>`}).join('')}</div>
 ${Q.ans!=null?`<p class="note" style="margin-top:8px">${Q.ans===it.k?IC('ok')+" To'g'ri!":IC('bad')+' Noto\'g\'ri. To\'g\'ri javob: <b>'+esc(g.n)+'</b>'} — ${esc(g.y)}</p><div class="row" style="margin-top:8px"><button class="btn pri" id="qNext">${IC('right')} Keyingi</button></div>`:''}</div>`}
let tab='tasks';
function render(){const b=document.getElementById('lBody');if(!b)return;b.innerHTML=tab==='tasks'?tasksHTML():quizHTML();document.querySelectorAll('[data-ltab]').forEach(x=>x.classList.toggle('on',x.dataset.ltab===tab));
 b.querySelectorAll('[data-qa]').forEach(x=>x.onclick=()=>{if(Q.ans!=null)return;Q.ans=x.dataset.qa;if(Q.ans===Q.items[Q.i].k){Q.score++;snd('ok')}else snd('err');render()});
 const n=b.querySelector('#qNext');if(n)n.onclick=()=>{Q.i++;Q.ans=null;render()};const nq=b.querySelector('#qNew');if(nq)nq.onclick=()=>{newQuiz();render()}}
function open(t){tab=t||tab;openModal(`<h2 style="display:flex;align-items:center;gap:8px">${IC('trophy')} O'quv markazi</h2><div class="seg" style="max-width:360px"><button data-ltab="tasks">Topshiriqlar</button><button data-ltab="quiz">Bilim testi</button></div><div id="lBody"></div>`);
 document.querySelectorAll('[data-ltab]').forEach(x=>x.onclick=()=>{tab=x.dataset.ltab;if(tab==='quiz'&&(!Q||Q.i>=Q.items.length))newQuiz();snd('click');render()});render()}
// sarlavhaga tugma
const hb=document.createElement('button');hb.className='hb';hb.id='bLearn';hb.title="Topshiriqlar va bilim testi";hb.innerHTML=`${IC('trophy')} <span class="hide-s">O'quv markazi</span>`;const ref=document.getElementById('bGloss');if(ref)ref.after(hb);hb.onclick=()=>open();
// loyiha o'zgarganda yangi bajarilgan topshiriqni bildirish
let last='';setInterval(()=>{try{if(!B||!TASKS[B.type])return;const sig=JSON.stringify(B.p)+B.type;if(sig===last)return;last=sig;const{L,nw}=evalTasks();if(nw){const x=L.find(y=>y.ok);toast(`${IC('trophy')} Topshiriq bajarildi: ${esc(x?x.t:'')}`,3000);snd('ok')}}catch(e){}},1500);
window.LEARN={open,evalTasks,TASKS};
})();
// ---- birinchi tashrif: xush kelibsiz oynasi (ixcham, professional uslub) ----
(()=>{const st=document.createElement('style');st.textContent=`
.w3{padding:2px 4px 0}
.w3Top{display:flex;align-items:center;gap:12px;padding-right:36px;margin-bottom:14px}
.w3Top img{width:36px;height:36px;border-radius:9px;background:var(--p2);border:1px solid var(--ln);padding:5px}
.w3Top small{display:block;font-size:11px;color:var(--mu);letter-spacing:.06em;text-transform:uppercase}
.w3Top h2{font-size:19px;font-weight:600;letter-spacing:-.01em;margin:0;display:block}
.w3Lead{color:var(--tx2);font-size:13.5px;line-height:1.6;margin:0 0 16px;max-width:640px}
.w3Flow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--ln);border-radius:12px;overflow:hidden;margin-bottom:18px}
.w3Flow div{padding:11px 12px;border-right:1px solid var(--ln);background:var(--p2)}.w3Flow div:last-child{border-right:0}
.w3Flow b{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;margin-bottom:3px}.w3Flow b em{font-style:normal;font-size:11px;color:var(--mu);font-variant-numeric:tabular-nums}
.w3Flow span{display:block;font-size:11.5px;color:var(--mu);line-height:1.45}
.w3Sec{font-size:11px;font-weight:600;color:var(--mu);letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px}
.w3List{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.w3List button{min-width:0}
.w3List button{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 11px;border-radius:10px;background:transparent;border:1px solid var(--ln);transition:background .15s,border-color .15s}
.w3List button:hover{background:var(--p2);border-color:var(--ln2)}.w3List button:hover .w3Go{opacity:1;transform:none}
.w3Ic{flex:none;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--p3);color:var(--tx2)}.w3Ic i{width:17px;height:17px}
.w3List b{display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.w3List small{display:block;font-size:11px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.w3List span.t{min-width:0;flex:1}.w3Go{color:var(--mu);opacity:0;transform:translateX(-3px);transition:.15s}.w3Go i{width:14px;height:14px}
.w3Foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:12px;border-top:1px solid var(--ln);font-size:11.5px;color:var(--mu)}
@media (max-width:760px){.w3List{grid-template-columns:repeat(2,minmax(0,1fr))}.w3Flow{grid-template-columns:repeat(2,minmax(0,1fr))}.w3Flow div:nth-child(2){border-right:0}.w3Flow div:nth-child(-n+2){border-bottom:1px solid var(--ln)}}
@media (max-width:540px){.w3List{grid-template-columns:1fr}.w3Go{opacity:.6;transform:none}}`;document.head.appendChild(st);
 const SUB={copter:'FPV, kino, yuk tashuvchi',plane:'Trener, planer, akrobat',car:'Buggy, monster truck, crawler',boat:'Deep-V, katamaran',robot:'Arduino, sensorlar, kod',heli:'450 / 700 klass, FBL',rocket:'A–G dvigatel, parashyut',tank:'Gusenitsa, minora',lab:'LED, servo, LCD, kod',free:"Istalgan narsa: ventilyator, fonar, mashina…"};
 function welcome(){const T=Object.values(TYPES);
  openModal(`<div class="w3"><div class="w3Top"><img src="img/logo-mark-64.png" alt=""><div><small>Konstruktor</small><h2>Qurilmani o'zingiz loyihalang va sinang</h2></div></div>
  <p class="w3Lead">Har bir detalning o'lchamini tanlaysiz, uni qismlardan yig'asiz, simlarini ulaysiz va virtual sinovdan o'tkazasiz. Tortish, tok, og'irlik va barqarorlik real fizika formulalari bilan hisoblanadi.</p>
  <div class="w3Flow">${[['Loyihalash','Detal parametrlari: o\'lcham, material, quvvat'],['Yasash','Detalni ichki va ustki qismlardan yig\'ish'],['Ulash','Simlar; xato ulanish detalni kuydiradi'],['Sinov','Virtual maydonda natijani tekshirish']].map(([t,d],i)=>`<div><b><em>0${i+1}</em>${t}</b><span>${d}</span></div>`).join('')}</div>
  <div class="w3Sec">Qurilma turini tanlang</div><div class="w3List">${T.map(t=>`<button data-wt="${t.id}"><span class="w3Ic">${IC(t.ic)}</span><span class="t"><b>${esc(t.name)}</b><small>${esc(SUB[t.id]||'')}</small></span><span class="w3Go">${IC('right')}</span></button>`).join('')}</div>
  <div class="w3Foot"><span>Savollar uchun — pastki o'ng burchakdagi yordamchi. Topshiriqlar va test — sarlavhadagi «O'quv markazi».</span><button class="btn" id="w3Later">Yopish</button></div></div>`,true);
  document.querySelectorAll('[data-wt]').forEach(b=>b.onclick=()=>{closeModal();setProject(newProject(b.dataset.wt));snd('ok')});const l=document.getElementById('w3Later');if(l)l.onclick=closeModal;try{localStorage.setItem('konstruktor.seen','1')}catch(e){}}
 let seen=null;try{seen=localStorage.getItem('konstruktor.seen')}catch(e){}if(!seen)setTimeout(welcome,600);window.LEARN.welcome=welcome})();
