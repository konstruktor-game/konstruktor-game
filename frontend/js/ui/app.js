/* =====================================================================
   Konstruktor — interfeys: bosqichlar, detal loyihalash paneli, o'rnatish,
   simlar sxemasi, tekshiruv, sinov, detallar ro'yxati, 360° ko'rish, saqlash/ulashish.
   ===================================================================== */
'use strict';
const isTouch=matchMedia('(pointer:coarse)').matches;
let T=null,D=null,stepIdx=0,showLabels=true,showWireStatus=false,propTool='CW',insp=null,rebuildTimer=null,lastEdit=0;

// ---------------- yordamchi UI ----------------
function toast(t,ms=1800){const d=document.createElement('div');d.className='toast';d.innerHTML=t;document.body.appendChild(d);setTimeout(()=>d.remove(),ms)}
function openModal(html,wide){const b=$('mbox');b.style.maxWidth=wide?'980px':'760px';b.innerHTML='<button class="mclose" id="mClose" aria-label="Yopish"><i class=i-x></i></button>'+html;$('modal').classList.remove('hidden');$('mClose').onclick=closeModal}
function closeModal(){$('modal').classList.add('hidden');$('mbox').innerHTML=''}
$('modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal')closeModal()});
let popEl=null;function pop(el,key){closePop();const g=GLOSS[key];if(!g)return;popEl=document.createElement('div');popEl.className='pop';
 popEl.innerHTML=`<b>${esc(g.n)}</b> <small style="color:var(--mu)">${esc(g.en)}</small><p><i class=i-pin></i> ${esc(g.w)}</p><p><i class=i-help></i> <b style="font-size:12px;color:var(--tx)">Nima uchun:</b> ${esc(g.y)}</p><p><i class=i-ok></i> <b style="font-size:12px;color:var(--tx)">Qanday tanlash:</b> ${esc(g.h)}</p>`;
 document.body.appendChild(popEl);const r=el.getBoundingClientRect();popEl.style.left=clamp(r.left-150,8,innerWidth-330)+'px';popEl.style.top=clamp(r.bottom+6,8,innerHeight-popEl.offsetHeight-8)+'px'}
function closePop(){if(popEl){popEl.remove();popEl=null}}
addEventListener('pointerdown',e=>{if(popEl&&!popEl.contains(e.target)&&!e.target.classList.contains('q'))closePop()});
const step=()=>T.steps[stepIdx];
const glossName=k=>GLOSS[k]?GLOSS[k].n:k;
function beginEdit(){const n=performance.now();if(n-lastEdit>900)pushUndo();lastEdit=n}

// ---------------- loyiha ----------------
function setProject(b,keepCam){if((window.FORGE&&FORGE.active))FORGE.cancel(true);B=migrate(b);T=TYPES[B.type];stepIdx=B.step||0;undoStack.length=0;redoStack.length=0;insp=null;simStop();window.XRAY=false;$('tXray').classList.remove('on');
 renderHeader();goStep(stepIdx,true);if(!keepCam)setTimeout(()=>fitCamera(model.userData.size),30)}
function activeSlots(){const s=step();return s.slots?s.slots(B):[]}
function rebuild(){const r=buildModel(B,activeSlots(),step().id);D=r.D;if(insp)model.visible=false;labelsCache=null;for(const id in lblPool)lblPool[id].style.display='none';renderMetrics();renderSteps()}
function scheduleRebuild(panelToo){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{rebuild();saveLocal();if(panelToo)renderPanel();else refreshLive()},70)}
function commit(){saveLocal();rebuild();renderPanel()}

// ---------------- sarlavha ----------------
function renderHeader(){$('typeSw').innerHTML=Object.values(TYPES).map(t=>`<button data-t="${t.id}" class="${t.id===B.type?'on':''}" title="${esc(t.desc)}">${IC(t.ic)} <span class="hide-s">${esc(t.name.split(' (')[0])}</span></button>`).join('');
 $('typeSw').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.t!==B.type)newDialog(b.dataset.t)});$('pName').value=B.name}
$('pName').oninput=e=>{B.name=e.target.value.slice(0,60);saveLocal()};
$('bUndo').onclick=undo;$('bRedo').onclick=redo;
function undo(){if(!undoStack.length)return toast("Bekor qilinadigan amal yo'q");redoStack.push(JSON.stringify(B));const b=JSON.parse(undoStack.pop());B=migrate(b);T=TYPES[B.type];renderHeader();commit();snd('click')}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(B));B=migrate(JSON.parse(redoStack.pop()));T=TYPES[B.type];renderHeader();commit();snd('click')}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
 if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();e.shiftKey?redo():undo()}else if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();redo()}
 else if(e.code==='Escape'){if(insp)exitInspect();closeModal();closePop()}});
$('bMute').onclick=()=>{window.MUTE=!window.MUTE;$('bMute').innerHTML=IC(window.MUTE?'mute':'volume');try{localStorage.setItem('konstruktor.mute',window.MUTE?'1':'')}catch(e){}};

// ---------------- bosqichlar ----------------
function stepStatus(s){if(s.kind==='wiring'){const W=wcheck(B);return{done:W.total>0&&W.complete&&!Object.values(W.st).includes('bad')&&!W.fatal.length,pg:W.total?`${W.connected}/${W.total}`:''}}
 if(s.slots){const L=s.slots(B),n=L.filter(x=>B.inst[x]).length;return{done:L.length>0&&n===L.length,pg:L.length?`${n}/${L.length}`:''}}
 if(s.kind==='check'){const I=T.issues(B,D||T.derive(B)),built=T.steps.every(x=>!x.slots||x.kind==='paint'||x.slots(B).every(y=>B.inst[y]));return{done:built&&!I.some(i=>i.lvl==='bad'),pg:''}}
 if(s.kind==='test')return{done:!!(B.passed&&B.passed[B.type]),pg:''};return{done:false,pg:''}}
function renderSteps(){const sts=T.steps.map(stepStatus),dn=sts.filter(x=>x.done).length;$('steps').innerHTML=`<div class="stHead">${esc(T.name)}</div><div class="stProg" title="${dn} / ${T.steps.length} bosqich"><i style="width:${dn/T.steps.length*100}%"></i></div>`+T.steps.map((s,i)=>{const st=sts[i];
 return `<button class="st ${i===stepIdx?'on':''} ${st.done?'done':''}" data-i="${i}" title="${esc(s.t)}"><span class="n">${st.done?IC('check'):i+1}</span><span>${IC(s.ic)} ${esc(s.t)}</span><span class="pg">${st.pg}</span></button>`}).join('');
 $('steps').querySelectorAll('.st').forEach(b=>b.onclick=()=>{snd('click');goStep(+b.dataset.i)})}
function goStep(i,first){if(insp)exitInspect(true);if(window.RULER&&RULER.active)RULER.toggle(false);if((window.FORGE&&FORGE.active))FORGE.cancel(true);stepIdx=clamp(i,0,T.steps.length-1);B.step=stepIdx;saveLocal();const s=step();
 if(s.kind!=='test')simStop();showWireStatus=false;
 $('wires').classList.toggle('hidden',s.kind!=='wiring');$('hud').classList.toggle('hidden',s.kind!=='test');$('vtools').classList.toggle('hidden',s.kind==='wiring');
 rebuild();renderPanel();if(s.kind==='wiring')renderWires();if(s.kind==='test')startSim();else $('simStart').classList.add('hidden');
 setHint();$('panel').scrollTop=0}
function setHint(t){const s=step(),h=$('hint');if(t){h.innerHTML=esc(t);h.classList.remove('hidden');return}
 if((window.FORGE&&FORGE.active)){h.innerHTML=FORGE.hint();h.classList.remove('hidden');return}
 if(insp){h.innerHTML=`<i class=i-orbit></i> 360° ko'rish: ${glossName(insp.label)} — sichqoncha bilan aylantiring, g'ildirak bilan yaqinlashtiring`;return}
 if(s.kind==='wiring'){h.innerHTML="<i class=i-plug></i> Sim uchini (doiracha) sudrab kerakli kontaktga olib boring";return}
 if(s.kind==='test'){h.classList.add('hidden');return}h.classList.remove('hidden');
 const L=activeSlots(),next=L.filter(x=>!B.inst[x]&&slotAvailable(B,T,x));
 h.innerHTML=next.length?`<i class=i-pointer></i> Yonib turgan joyni bosing — detalni qismlardan yasash: ${[...new Set(next.map(x=>glossName(slotLabel(T,x))))].join(', ')}`:L.length?"<i class=i-ok></i> Bu bosqich yig'ildi. Parametrlarni o'zgartirsangiz model darhol yangilanadi.":"<i class=i-mouse></i> Sichqoncha bilan aylantiring, g'ildirak bilan yaqinlashtiring. Detalni bosing — ma'lumot va 360° ko'rish."}

// ---------------- ko'rsatkichlar paneli ----------------
function renderMetrics(){$('metrics').innerHTML=T.metrics(B,D).map(m=>`<div class="mt ${m.lvl||''}"><small>${esc(m.l)}</small><b>${esc(m.v)}</b></div>`).join('')}

// ---------------- detal loyihalash paneli ----------------
function fieldHTML(cat,f){const v=B.p[cat][f.k],q=f.g&&GLOSS[f.g]?`<button class="q" data-g="${f.g}" title="Bu nima?">?</button>`:'';
 if(f.type==='sel')return`<div class="fld"><div class="fl"><span>${esc(f.l)}</span>${q}</div><select data-c="${cat}" data-k="${f.k}">${Object.entries(f.o).map(([k,l])=>`<option value="${esc(k)}" ${String(v)===String(k)?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
 if(f.type==='bool')return`<div class="tg"><span>${esc(f.l)} ${q}</span><button class="sw ${v?'on':''}" data-c="${cat}" data-k="${f.k}" role="switch" aria-checked="${!!v}"></button></div>`;
 return`<div class="fld"><div class="fl"><span>${esc(f.l)}</span>${q}<b><span data-vl="${cat}.${f.k}">${fmt(v,f.step<1?1:0)}</span> ${esc(f.u||'')}</b></div><div class="rg"><input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-c="${cat}" data-k="${f.k}"><input type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-c="${cat}" data-k="${f.k}"></div></div>`}
function catCard(cat){const S=T.spec[cat],presets=Object.entries(T.presets);
 return`<div class="card" data-card="${cat}"><h3>${S.ic?IC(S.ic):''} ${esc(S.t)} ${S.g?`<button class="q" data-g="${S.g}">?</button>`:''}<span class="sp"></span><button class="chip" data-i360="${cat}" title="Detalni 360° ko'rish"><i class=i-orbit></i> 360°</button></h3>
 <div class="chips">${presets.map(([id,p])=>`<button class="chip" data-pre="${id}" data-c="${cat}" title="${esc(p.desc)}">${esc(p.name)}</button>`).join('')}</div>
 ${S.f.map(f=>fieldHTML(cat,f)).join('')}<div class="info" data-info="${cat}">${catInfo(cat)}</div></div>`}
// har bir detal uchun hisoblangan qiymatlar (o'rganish uchun)
const GND=t=>!['copter','plane','heli','rocket'].includes(t);
function catInfo(cat){const d=D,p=B.p,R=[];const a=(l,v)=>R.push(`<span>${esc(l)}</span><b>${v}</b>`);
 if(T.catInfo){T.catInfo(cat,d,p,a);return R.join('')}
 if(B.type==='copter'){
  if(cat==='frame'){a("Sig'adigan parrak",`≤ ${fmt(d.maxProp,1)}"`);a("Ramka og'irligi",fmt(d.wFrame+d.wTop)+' g');a('Mustahkamlik',`${fmt(d.strength,1)} ${d.strength<.9?'<i class=i-bad></i>':d.strength<1.6?'<i class=i-warn></i>':'<i class=i-ok></i>'}`);a("Qo'l uzunligi",fmt(d.armL[0])+' mm')}
  if(cat==='motor'){a("Og'irligi",fmt(d.wMot,1)+' g × '+d.n);a('Maks. quvvat',fmt(d.Pm)+' W');a('Aylanish (yuklangan)',fmt(d.rpm,-2)+' rpm');a('Yuklama',`${fmt(d.overload*100)} % ${d.overload>1.4?'<i class=i-bad></i>':d.overload>1.1?'<i class=i-warn></i>':'<i class=i-ok></i>'}`);a('Tavsiya KV',`${fmt(d.kvOpt*.85,-2)}–${fmt(d.kvOpt*1.15,-2)}`);a('Bitta motor toki',fmt(d.Imot)+' A')}
  if(cat==='prop'){a('Bitta parrak tortishi',fmt(d.Tm)+' g');a('Uch tezligi',fmt(d.tip)+' m/s');a("Og'irligi",fmt(d.wProp,1)+' g');a('Ramkaga sig\'adi',p.prop.d<=d.maxProp+.05?'<i class=i-ok></i> ha':'<i class=i-bad></i> yo\'q')}
  if(cat==='esc'){a('Motor toki / ESC',`${fmt(d.Imot)} / ${p.esc.a} A`);a("Og'irligi",fmt(d.wEsc)+' g')}
  if(cat==='fc'){a('UART portlar',d.uarts);a("Og'irligi",fmt(d.wFc,1)+' g')}
  if(cat==='vid'||cat==='rx'||cat==='extra'){a("Video og'irligi",fmt(d.wVid)+' g');a('Foydali yuk zaxirasi',fmt(d.payload)+' g')}
  if(cat==='bat'){a('Kuchlanish',`${fmt(d.Vn,1)} V (to'liq ${fmt(d.Vfull,1)})`);a("Og'irligi",fmt(d.wBat)+' g');a('Maks. tok',fmt(d.batMaxA)+' A');a('Energiya',fmt(p.bat.mah/1000*d.Vn,1)+' Wh')}}
 else if(B.type==='plane'){
  if(cat==='fuse'||cat==='wing'||cat==='tail'){a('Qanot maydoni',fmt(d.Sdm,1)+' dm²');a('Nisbat (AR)',fmt(d.AR,1));a('Sekin uchish',fmt(d.Vs*3.6)+' km/soat');a('Dum hajmi Vh',fmt(d.Vh,2));a("Qanot og'irligi",fmt(d.wWing)+' g')}
  if(cat==='motor'||cat==='prop'){a('Statik tortish',fmt(d.Tst)+' g');a('Yuklama',fmt(d.overload*100)+' %');a('Qadam tezligi',fmt(d.pitchSpd*3.6)+' km/soat');a('Motor toki',fmt(d.Imot)+' A')}
  if(cat==='esc'||cat==='rx'){a('Motor toki / ESC',`${fmt(d.Imot)} / ${p.esc.a} A`)}
  if(cat==='servo'){a('Kerakli moment',fmt(d.servoNeed,1)+' kg·sm');a("Bitta servo og'irligi",fmt(d.wServo,1)+' g')}
  if(cat==='bat'){a("Og'irlik markazi",fmt(d.cgPct)+' % vatar');a('Tavsiya','25–33 %');a("Batareya og'irligi",fmt(d.wBat)+' g');a('Parvoz (sayr)',fmt(d.tCruise,1)+' daq')}}
 else{
  if(cat==='chassis'){a("Shassi og'irligi",fmt(d.wCh)+' g');a('Barqarorlik',fmt(d.stab,2));a('CG balandligi',fmt(d.cgH)+' mm')}
  if(cat==='motor'||cat==='gear'){a('Umumiy uzatma',fmt(d.ratio,1)+':1');a('Uzatma bo\'yicha tezlik',fmt(d.vGear*3.6)+' km/soat');a('Quvvat yetadigan',fmt(d.vPow*3.6)+' km/soat');a('Motor yuklamasi',fmt(d.load*100)+' %');a('Maks. quvvat',fmt(d.Pm)+' W')}
  if(cat==='wheel'){a("G'ildirak og'irligi",fmt(d.wWheel)+' g');a('Yopishish',fmt(d.grip,2))}
  if(cat==='esc'||cat==='servo'||cat==='rx'){a('Cho\'qqi tok / ESC',`${fmt(d.Ipk)} / ${p.esc.a} A`);a('Kerakli servo',fmt(d.servoNeed,1)+' kg·sm')}
  if(cat==='bat'){a('Kuchlanish',fmt(d.Vn,1)+' V');a('Haydash vaqti',fmt(d.tRun)+' daq')}}
 return R.join('')}
function refreshLive(){for(const el of document.querySelectorAll('[data-info]'))el.innerHTML=catInfo(el.dataset.info);const is=$('stepIssues');if(is)is.innerHTML=issuesHTML(true)}
function issuesHTML(short){let L=T.issues(B,D);if(short)L=L.filter(i=>i.lvl==='bad'||i.lvl==='warn').slice(0,4);
 if(!L.length)return short?'<div class="iss ok"><b><i class=i-ok></i> Muammo topilmadi</b></div>':'';return L.map(i=>`<div class="iss ${i.lvl}"><b>${IC({bad:'bad',warn:'warn',ok:'ok',info:'info'}[i.lvl])} ${esc(i.t)}</b>${i.why?`<span>${esc(i.why)}</span>`:''}</div>`).join('')}
function slotsHTML(){const L=activeSlots();if(!L.length)return'';const ins=L.filter(x=>B.inst[x]).length;
 return`<div class="card"><h3><i class=i-wrench></i> O'rnatish <span class="sp"></span><small style="color:var(--mu)">${ins}/${L.length}</small></h3>
 <div class="slots">${L.map(x=>{const ok=B.inst[x],nx=!ok&&slotAvailable(B,T,x),k=slotLabel(T,x),num=(x.match(/\d+$/)||[''])[0];return`<span class="sl ${ok?'ok':nx?'next':''}">${ok?'<i class=i-check></i>':nx?'○':'<i class=i-lock></i>'} ${esc(glossName(k))}${num&&L.length>1?' '+num:''}</span>`}).join('')}</div>
 <p style="font-size:12.5px;color:var(--mu);margin-bottom:8px">3D ko'rinishda yonib turgan (ko'k) detalni bosing. <i class=i-lock></i> — avval boshqa detal o'rnatilishi kerak.</p>
 <div class="row" style="margin-bottom:8px"><button class="btn" id="bRemove"><i class=i-back></i> Olib tashlash</button></div></div>`}
function navHTML(){return`<div class="nav noprint"><button class="btn" id="bPrev" ${stepIdx?'':'disabled'}><i class=i-left></i> Oldingi</button><button class="btn pri" id="bNext" ${stepIdx<T.steps.length-1?'':'disabled'}>Keyingi <i class=i-right></i></button></div>`}

function renderPanel(){const s=step(),P=$('panel');closePop();
 if(insp){P.innerHTML=inspectHTML();bindPanel();return}
 if((window.FORGE&&FORGE.active)){P.innerHTML=FORGE.panel();FORGE.bind(P);return}
 let h=`<h2>${IC(s.ic)} ${esc(s.t)}</h2>${s.intro?`<p class="intro">${esc(s.intro)}</p>`:''}`;
 if(s.kind==='wiring')h+=wiringPanel();
 else if(s.kind==='paint')h+=paintPanel()+slotsHTML();
 else if(s.kind==='check')h+=checkPanel();
 else if(s.kind==='test')h+=testPanel();
 else if(s.kind==='bom')h+=bomPanel();
 else{if(s.kind==='props')h+=propsTools();h+=(s.cats||[]).map(catCard).join('')+slotsHTML()+`<h3 style="font-size:13px;font-weight:600;margin:6px 0 6px"><i class=i-warn></i> Tekshiruv natijasi</h3><div id="stepIssues">${issuesHTML(true)}</div>`}
 P.innerHTML=h+navHTML();bindPanel()}
function bindPanel(){const P=$('panel');
 P.querySelectorAll('.q').forEach(b=>b.onclick=e=>{e.stopPropagation();pop(b,b.dataset.g)});
 P.querySelectorAll('input[type=range][data-c],input[type=number][data-c]').forEach(inp=>{inp.oninput=()=>{const c=inp.dataset.c,k=inp.dataset.k,f=T.spec[c].f.find(x=>x.k===k);let v=+inp.value;if(!isFinite(v))return;v=clamp(v,f.min,f.max);beginEdit();B.p[c][k]=v;
  P.querySelectorAll(`[data-c="${c}"][data-k="${k}"]`).forEach(o=>{if(o!==inp&&o.tagName==='INPUT')o.value=v});const vl=P.querySelector(`[data-vl="${c}.${k}"]`);if(vl)vl.textContent=fmt(v,f.step<1?1:0);scheduleRebuild(false)};
  inp.onchange=()=>scheduleRebuild(true)});
 P.querySelectorAll('select[data-c]').forEach(sel=>sel.onchange=()=>{const c=sel.dataset.c,k=sel.dataset.k,old=B.p[c][k];pushUndo();B.p[c][k]=typeof old==='number'?+sel.value:sel.value;cleanup();commit()});
 P.querySelectorAll('.sw[data-c]').forEach(b=>b.onclick=()=>{pushUndo();B.p[b.dataset.c][b.dataset.k]=!B.p[b.dataset.c][b.dataset.k];cleanup();commit()});
 P.querySelectorAll('[data-pre]').forEach(b=>b.onclick=()=>{pushUndo();B.p[b.dataset.c]=cloneB(T.presets[b.dataset.pre].p[b.dataset.c]);cleanup();commit();toast(`${esc(T.spec[b.dataset.c].t)}: «${esc(T.presets[b.dataset.pre].name)}» qiymatlari olindi`)});
 P.querySelectorAll('[data-i360]').forEach(b=>b.onclick=()=>{const L=(step().slots?step().slots(B):[]),cat=b.dataset.i360,want={frame:'frame',motor:'mot1',prop:'prop1',esc:'esc',fc:'fc',vid:'cam',rx:'rx',bat:'bat',extra:'gps',fuse:'fuse',wing:'wing',tail:'tail',servo:'svA1',chassis:'chassis',gear:'gear',wheel:'wheel1'}[cat];enterInspect(want||L[0])});
 const g=id=>P.querySelector('#'+id);
 if(g('bPrev'))g('bPrev').onclick=()=>{snd('click');goStep(stepIdx-1)};if(g('bNext'))g('bNext').onclick=()=>{snd('click');goStep(stepIdx+1)};
 if(g('bRemove'))g('bRemove').onclick=()=>removeStep();
 if(g('bBack360'))g('bBack360').onclick=()=>exitInspect();
 if(g('bStl'))g('bStl').onclick=()=>{if(insp&&insp.turn&&window.STLX)STLX.exportSTL(insp.turn.children[0],(GLOSS[insp.label]||{n:insp.label}).n)};
 if(!insp)bindKind(P)}
// parametr o'zgarganda keraksiz bo'lib qolgan o'rnatish/simlarni tozalash
function cleanup(){const all=new Set();for(const s of T.steps)if(s.slots)for(const x of s.slots(B))all.add(x);for(const k in B.inst)if(!all.has(k))delete B.inst[k];
 let ch=true;while(ch){ch=false;for(const k in B.inst)if(!slotAvailable(B,T,k)){delete B.inst[k];ch=true}}
 const W=T.wiring(B),ids=new Set(),pads=new Set();for(const c of W.comps)for(const w of c.wires)ids.add(w.id);for(const b of W.boards)for(const p of b.pads)pads.add(p.id);
 for(const k in B.wires)if(!ids.has(k)||!pads.has(B.wires[k]))delete B.wires[k];
 if(B.type==='copter')for(const k in B.dirs)if(+k>+B.p.frame.arms)delete B.dirs[k]}

// ---------------- o'rnatish ----------------
function correctDir(i){const q=D.mot.find(m=>m.i==i);if(!q)return'CW';return B.rev?(q.dir==='CW'?'CCW':'CW'):q.dir}
function install(slot,quiet){if(B.inst[slot])return;if(!quiet)pushUndo();const m=slot.match(T.propSlot||/^$/);if(m&&B.type==='copter')B.dirs[m[1]]=propTool;B.inst[slot]=true;
 if(!quiet){snd('screw');rebuild();animateDrop(slot);saveLocal();renderPanel();setHint();const L=activeSlots();if(L.every(x=>B.inst[x])){snd('ok');toast("<i class=i-ok></i> Bosqich yig'ildi")}}}
function autoInstall(){pushUndo();const L=activeSlots();for(let k=0;k<L.length+1;k++)for(const x of L)if(!B.inst[x]&&slotAvailable(B,T,x)){const m=x.match(T.propSlot||/^$/);if(m&&B.type==='copter')B.dirs[m[1]]=correctDir(m[1]);B.inst[x]=true}
 snd('screw');commit();setHint();for(const x of L)animateDrop(x)}
function removeStep(){pushUndo();for(const x of activeSlots())delete B.inst[x];cleanup();snd('place');commit();setHint()}

// ---------------- 3D: bosish va sichqoncha ostidagi ma'lumot ----------------
function onPick(e){if(step().kind==='wiring'||step().kind==='test')return;closePop();if(window.RULER&&RULER.active){RULER.pick(e);return}if((window.FORGE&&FORGE.active)){FORGE.pick(e);return}
 if(insp)return;const o=pickAt(e,model);if(!o)return;const slot=o.userData.slot;
 if(o.userData.ghost){if(window.FORGE)FORGE.start(slot);else install(slot);return}
 if(o.userData.burnt||(B.burnt&&B.burnt[slot])){showBurntCard(e,slot);return}
 if(step().kind==='props'&&slot&&/^prop\d+$/.test(slot)){pushUndo();const i=slot.slice(4);B.dirs[i]=(B.dirs[i]||correctDir(i))==='CW'?'CCW':'CW';snd('flip');commit();return}
 const key=o.userData.label;if(key){const g=GLOSS[key];showPartCard(e,key,slot)}}
function replacePart(slot){pushUndo();if(B.burnt)delete B.burnt[slot];delete B.inst[slot];for(const k in B.wires){}const i=T.steps.findIndex(s=>s.slots&&s.slots(B).includes(slot));saveLocal();if(i>=0)goStep(i);else commit();toast(`<i class=i-wrench></i> Kuygan detal olib tashlandi — yangisini yasab o'rnating`,2600)}
function showBurntCard(e,slot){closePop();const nm=glossName(slotLabel(T,slot));popEl=document.createElement('div');popEl.className='pop';
 popEl.innerHTML=`<b><i class=i-flame></i> ${esc(nm)} kuygan</b><p>Qisqa tutashuv yoki noto'g'ri kuchlanish detalni ishdan chiqardi. Simlarni to'g'rilash yetmaydi — detalni yangidan yasab o'rnatish kerak.</p><div class="row" style="margin-top:8px"><button class="btn pri" id="pRepl"><i class=i-wrench></i> Yangisini yasash</button></div>`;
 document.body.appendChild(popEl);popEl.style.left=clamp(e.clientX+10,8,innerWidth-330)+'px';popEl.style.top=clamp(e.clientY+10,8,innerHeight-popEl.offsetHeight-8)+'px';popEl.querySelector('#pRepl').onclick=()=>{closePop();replacePart(slot)}}
function showPartCard(e,key,slot){closePop();const g=GLOSS[key]||{n:key,w:'',y:'',h:''};popEl=document.createElement('div');popEl.className='pop';
 popEl.innerHTML=`<b>${esc(g.n)}</b><p>${esc(g.w)}</p><p><b style="font-size:12px;color:var(--tx)">Nima uchun:</b> ${esc(g.y)}</p>${slot?`<div class="row" style="margin-top:8px"><button class="btn pri" id="p360"><i class=i-orbit></i> 360° ko'rish</button></div>`:''}`;
 document.body.appendChild(popEl);popEl.style.left=clamp(e.clientX+10,8,innerWidth-330)+'px';popEl.style.top=clamp(e.clientY+10,8,innerHeight-popEl.offsetHeight-8)+'px';
 const b=popEl.querySelector('#p360');if(b)b.onclick=()=>{closePop();enterInspect(slot)}}
let hoverT=0;function onHover(e){const tip=$('tip');if((window.FORGE&&FORGE.active)){tip.classList.add('hidden');if(e)FORGE.hover(e);return}if(!e||insp||step().kind==='wiring'||step().kind==='test'){tip.classList.add('hidden');return}
 const n=performance.now();if(n-hoverT<60)return;hoverT=n;const o=pickAt(e,model);if(!o){tip.classList.add('hidden');renderer.domElement.style.cursor='';return}
 const key=o.userData.label,g=GLOSS[key]||{n:key,w:''},r=$('view').getBoundingClientRect();
 tip.innerHTML=o.userData.ghost?`<b><i class=i-pointer></i> O'rnatish: ${esc(g.n)}</b>${esc(g.w)}`:step().kind==='props'&&/^prop/.test(o.userData.slot||'')?`<b>${esc(g.n)} — ${esc(B.dirs[o.userData.slot.slice(4)]||'')}</b>Bosing — yo'nalishini almashtirish`:`<b>${esc(g.n)}</b>${esc(g.w)}<br><small style="color:var(--mu)">Bosing — batafsil va 360°</small>`;
 tip.style.left=clamp(e.clientX-r.left+14,4,r.width-270)+'px';tip.style.top=clamp(e.clientY-r.top+14,4,r.height-90)+'px';tip.classList.remove('hidden');renderer.domElement.style.cursor='pointer'}

// ---------------- detal nomlari (yorliqlar) ----------------
let labelsCache=null,labelTick=0;const lblPool={};
function updateLabels(){const box=$('labels');if(!showLabels||insp||(window.FORGE&&FORGE.active)||step().kind==='wiring'||step().kind==='test'||!model){box.style.display='none';return}box.style.display='';
 if(!labelsCache){labelsCache=[];const seen=new Set();const add=(o,key,id)=>{if(seen.has(key))return;seen.add(key);const bb=new THREE.Box3().setFromObject(o);if(bb.isEmpty())return;labelsCache.push({o,key,id,top:new V3((bb.min.x+bb.max.x)/2,bb.max.y,(bb.min.z+bb.max.z)/2)})};
  for(const s in modelObjs)add(modelObjs[s],modelObjs[s].userData.label,s);model.children.forEach((o,i)=>{if(o.userData.label&&!o.userData.slot)add(o,o.userData.label,'d'+i)})}
 const r=$('view').getBoundingClientRect(),used=new Set(),v=new V3(),placed=[];
 for(const L of labelsCache){v.copy(L.top);if(explode>.01)v.addScaledVector(L.o.userData.ex||new V3(),explode);v.y+=.6;v.project(camera);if(v.z>1)continue;
  // ustma-ust tushadigan yorliqlarni yashiramiz (o'qilishi uchun)
  const txt=glossName(L.key),x=(v.x*.5+.5)*r.width,y=(-v.y*.5+.5)*r.height,w=txt.length*6.6+18;if(placed.some(q=>Math.abs(q.x-x)<(q.w+w)/2&&Math.abs(q.y-y)<22))continue;placed.push({x,y,w});
  let el=lblPool[L.id];if(!el){el=lblPool[L.id]=document.createElement('div');el.className='lbl';box.appendChild(el)}el.textContent=txt;el.style.left=x+'px';el.style.top=y+'px';el.style.display='';used.add(L.id)}
 for(const id in lblPool)if(!used.has(id))lblPool[id].style.display='none'}

// ---------------- 360° ko'rish ----------------
let inspGroup=null;
function enterInspect(slot){if(!slot)return;if((window.FORGE&&FORGE.active))FORGE.cancel(true);const D0=T.derive(B);let obj=null;
 const ctx={B,D:D0,step:'inspect',inst:()=>true,add(s,o){if(s===slot&&!obj)obj=o;return o},deco(){},spin(){}};T.build(B,D0,ctx);if(!obj){toast("Bu detal hozirgi sozlamada yo'q");return}
 if(inspGroup)scene.remove(inspGroup);inspGroup=new THREE.Group();const bb=new THREE.Box3().setFromObject(obj),c=bb.getCenter(new V3()),sz=bb.getSize(new V3());
 obj.position.sub(c);const w=new THREE.Group();w.add(obj);w.position.y=sz.y/2+Math.max(.5,sz.y*.2);inspGroup.add(w);
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(sz.x,sz.z)*.75,Math.max(sz.x,sz.z)*.8,Math.max(.3,sz.y*.08),48),mMetal('#30363f',.5));ped.position.y=Math.max(.15,sz.y*.04);ped.receiveShadow=true;inspGroup.add(ped);
 scene.add(inspGroup);insp={slot,label:slotLabel(T,slot),size:Math.max(sz.x,sz.y,sz.z),turn:w};if(model)model.visible=false;
 orb.tg.set(0,w.position.y,0);orb.tr=Math.max(insp.size*2.6,8);orb.ph=1.1;$('tExplode').classList.add('hidden');renderPanel();setHint();snd('click')}
function exitInspect(silent){if(!insp)return;if(inspGroup){scene.remove(inspGroup);inspGroup=null}insp=null;if(model)model.visible=true;$('tExplode').classList.remove('hidden');fitCamera(model.userData.size);if(!silent){renderPanel();setHint()}}
function inspectHTML(){const g=GLOSS[insp.label]||{n:insp.label,en:'',w:'',y:'',h:''};const cat=Object.keys(T.spec).find(c=>T.spec[c].g===insp.label||(insp.label==='battery'&&c==='bat'));
 return`<h2><i class=i-orbit></i> ${esc(g.n)}</h2><p class="intro">${esc(g.en)} — sichqoncha bilan aylantiring, g'ildirak bilan yaqinlashtiring, Shift + sudrash bilan suring.</p>
 <div class="card"><p><i class=i-pin></i> ${esc(g.w)}</p><p style="margin-top:6px"><i class=i-help></i> <b>Nima uchun:</b> ${esc(g.y)}</p><p style="margin:6px 0 8px"><i class=i-ok></i> <b>Qanday tanlash:</b> ${esc(g.h)}</p></div>
 ${cat?`<div class="card"><h3><i class=i-ruler></i> Hozirgi parametrlar</h3><div class="info" style="border:0">${T.spec[cat].f.map(f=>`<span>${esc(f.l)}</span><b>${f.type==='sel'?esc(f.o[B.p[cat][f.k]]):f.type==='bool'?(B.p[cat][f.k]?'ha':"yo'q"):fmt(B.p[cat][f.k],f.step<1?1:0)+' '+esc(f.u||'')}</b>`).join('')}${catInfo(cat)}</div></div>`:''}
 <div class="row"><button class="btn pri" id="bBack360"><i class=i-back></i> Yig'ishga qaytish</button><button class="btn" id="bStl" title="3D printer uchun: millimetrda, Z — yuqori"><i class=i-printer></i> STL (3D bosma)</button></div>`}

// ---------------- parraklar bosqichi ----------------
function propsTools(){return`<div class="card"><h3><i class=i-prop></i> Parrak yo'nalishi <button class="q" data-g="cwccw">?</button></h3>
 <p style="font-size:12.5px;color:#c4cee0;margin-bottom:8px">Har bir motor ustidagi rangli strelka uning aylanish yo'nalishini ko'rsatadi: <b style="color:#42a5f5">ko'k — CW</b>, <b style="color:#ff9800">to'q sariq — CCW</b>. Avval parrak turini tanlang, so'ng motorni bosing. O'rnatilgan parrakni bossangiz, yo'nalishi almashadi.</p>
 <div class="row" style="margin-bottom:8px"><button class="btn ${propTool==='CW'?'pri':''}" data-tool="CW"><i class=i-cw></i> CW parrak</button><button class="btn ${propTool==='CCW'?'pri':''}" data-tool="CCW"><i class=i-ccw></i> CCW parrak</button></div>
 <div class="tg"><span>Motor yo'nalishi teskari ("props out") <button class="q" data-g="cwccw">?</button></span><button class="sw ${B.rev?'on':''}" id="swRev"></button></div></div>`}
function bindKind(P){P.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{propTool=b.dataset.tool;snd('click');renderPanel()});
 const r=P.querySelector('#swRev');if(r)r.onclick=()=>{pushUndo();B.rev=!B.rev;commit()};
 if(step().kind==='wiring')bindWiringPanel(P);if(step().kind==='paint')bindPaint(P);if(step().kind==='check')bindCheck(P);if(step().kind==='test')bindTest(P);if(step().kind==='bom')bindBom(P)}

// ---------------- simlar (kavsharlash) ----------------
const SVGNS='http://www.w3.org/2000/svg';
function wiringPanel(){const W=wcheck(B);const legend=[['#e53935','Quvvat (+, 5V, 9V)'],['#222','GND (minus, yer)'],['#43a047','TX — uzatish'],['#fafafa','RX — qabul'],['#fdd835','Video'],['#c58a3a','Motor fazalari'],['#ff9800','Servo / signal']];
 return`<div class="card"><h3><i class=i-clipboard></i> Holat</h3><div class="grid2"><div class="kv"><small>Ulangan</small><b>${W.connected} / ${W.total}</b></div><div class="kv"><small>To'g'ri</small><b>${showWireStatus?W.correct+' / '+W.total:'?'}</b></div></div>
 <p style="font-size:12.5px;color:#c4cee0;margin:10px 0">${esc(W.W.hint)}</p>
 <div class="leg" style="margin-bottom:10px">${legend.map(([c,l])=>`<span><i style="background:${c};border:1px solid #666"></i>${l}</span>`).join('')}</div>
 <div class="row" style="margin-bottom:8px"><button class="btn pri" id="bWCheck"><i class=i-search></i> Tekshirish</button><button class="btn" id="bWSolve"><i class=i-bulb></i> Maslahat (1 ta sim)</button></div>
 <div class="row" style="margin-bottom:8px"><button class="btn" id="bWClear"><i class=i-scissors></i> Hammasini uzish</button><button class="btn" data-g2="solder"><i class=i-flame></i> Kavsharlash qoidalari</button></div></div>
 ${burntHTML()}<div id="wRes">${showWireStatus?wireResults(W):''}</div>`}
function burntHTML(){const L=Object.keys(B.burnt||{}).filter(k=>B.burnt[k]&&B.inst[k]);if(!L.length)return'';
 return`<div class="card" style="border-color:rgba(255,93,93,.45)"><h3><i class=i-flame></i> Kuygan detallar</h3>${L.map(k=>`<div class="iss bad"><b>${esc(glossName(slotLabel(T,k)))}</b><span>Tutashuvdan kuydi — simni to'g'rilash yetmaydi, detalni almashtiring.</span><button class="btn" data-replace="${esc(k)}" style="margin-top:6px"><i class=i-wrench></i> Yangisini yasash</button></div>`).join('')}</div>`}
// bitta noto'g'ri yoki ulanmagan sim uchun to'g'ri kontaktni ko'rsatish (o'zi ulamaydi)
function wireHint(){const W=wcheck(B);for(const c of W.comps)for(const w of c.wires){const st=W.st[w.id];if(st==='ok'||st==='warn'||st==='opt'||w.uart)continue;const pid=(w.ok||[])[0];if(!pid)continue;
  const pad=W.W.boards.flatMap(b=>b.pads.map(p=>Object.assign({bl:b.label},p))).find(p=>p.id===pid);snd('click');
  toast(`<i class=i-bulb></i> ${esc(c.label)}: «${esc(w.l)}» simi → ${esc(pad?pad.bl+', '+pad.l:pid)} kontakti`,3500);const el=document.querySelector(`#wires [data-pad="${CSS.escape(pid)}"] circle`);if(el){el.setAttribute('filter','url(#gl)');el.classList.add('hintPad');setTimeout(()=>el.classList.remove('hintPad'),3500)}return}
 const uw=W.comps.flatMap(c=>c.wires.filter(w=>w.uart&&W.st[w.id]!=='ok').map(w=>[c,w]))[0];if(uw){toast(`<i class=i-bulb></i> ${esc(uw[0].label)}: TX simi kontrollerning RX iga, RX simi TX iga (bir xil raqamli UART)`,3500);return}
 toast("<i class=i-ok></i> Barcha simlar to'g'ri ulangan")}
function wireResults(W){const L=[...W.fatal.map(f=>({lvl:'bad',t:f.t,why:f.why,ic:'bolt'})),...W.issues];const miss=[];
 for(const c of W.comps)for(const w of c.wires)if(W.st[w.id]==='miss')miss.push(`${c.label}: ${w.l}`);else if(W.st[w.id]==='bad'&&!L.some(i=>i.t.includes(c.label)))L.push({lvl:'bad',t:`${c.label}: «${w.l}» simi noto'g'ri kontaktda (${B.wires[w.id]})`,why:W.why[w.id]||''});
 if(miss.length)L.push({lvl:'warn',t:`Ulanmagan: ${miss.length} ta sim`,why:miss.join(' · ')});
 if(B.type==='copter'&&!B.wires['cap+']&&B.p.bat.cells>=5)L.push({lvl:'warn',t:'Kondensator ulanmagan',why:"5S–6S da kuchlanish sakrashlari ESC ni kuydirishi mumkin. 1000µF kondensatorni VBAT kontaktlariga ulang."});
 if(!L.length)L.push({lvl:'ok',t:"Barcha simlar to'g'ri ulangan!",why:"Endi keyingi bosqichga o'tishingiz mumkin."});
 return L.map(i=>`<div class="iss ${i.lvl}"><b>${IC(i.ic||{bad:'bad',warn:'warn',ok:'ok',info:'info'}[i.lvl])} ${esc(i.t)}</b>${i.why?`<span>${esc(i.why)}</span>`:''}</div>`).join('')}
function bindWiringPanel(P){const g=id=>P.querySelector('#'+id);
 g('bWCheck').onclick=()=>{showWireStatus=true;const W=wcheck(B);snd(W.fatal.length||Object.values(W.st).includes('bad')?'err':'ok');renderPanel();renderWires()};
 g('bWSolve').onclick=()=>wireHint(P);
 const _solveAll=()=>{pushUndo();const W=wcheck(B),used={};for(const c of W.comps)for(const w of c.wires){if(w.uart){continue}const ok=w.ok||[];let pad=ok.find(p=>!(w.grp&&used[w.grp+p]))||ok[0];if(pad){B.wires[w.id]=pad;if(w.grp)used[w.grp+pad]=1}}
  let u=1;const dev={};for(const c of W.comps)for(const w of c.wires)if(w.uart){if(!dev[w.uart])dev[w.uart]=u++;B.wires[w.id]=(w.kind==='tx'?'RX':'TX')+dev[w.uart]}
  showWireStatus=true;snd('solder');commit();renderWires()};window.__solveAll=_solveAll;
 P.querySelectorAll('[data-replace]').forEach(b=>b.onclick=()=>replacePart(b.dataset.replace));
 g('bWClear').onclick=()=>{pushUndo();B.wires={};snd('place');commit();renderWires()};
 P.querySelector('[data-g2]').onclick=e=>pop(e.target,'solder')}
function renderWires(){const box=$('wires');if(step().kind!=='wiring'){box.innerHTML='';return}const W=wcheck(B),pads={};
 let s=`<svg viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid meet" xmlns="${SVGNS}"><defs><linearGradient id="pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16261c"/><stop offset="1" stop-color="#0c1610"/></linearGradient>
 <filter id="gl"><feGaussianBlur stdDeviation="2.5"/></filter></defs>`;
 for(const b of W.W.boards){const on=!!B.inst[b.need],bu=on&&B.burnt&&B.burnt[b.need];s+=`<g opacity="${on?1:.35}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="14" fill="${bu?'#2a120c':'url(#pcb)'}" stroke="${bu?'#ff5d5d':on?'#3d6b4c':'#444'}" stroke-width="2"/>${bu?`<text x="${b.x+b.w/2}" y="${b.y+b.h/2+26}" text-anchor="middle" fill="#ff8a80" font-size="12" font-weight="700">KUYDI — almashtiring</text>`:''}
  <text x="${b.x+b.w/2}" y="${b.y+b.h/2+5}" text-anchor="middle" fill="#cfe8d6" font-size="15" font-weight="700">${esc(b.label)}</text>${on?'':`<text x="${b.x+b.w/2}" y="${b.y+b.h/2+26}" text-anchor="middle" fill="#ff9b9b" font-size="12">o'rnatilmagan</text>`}`;
  for(const p of b.pads){if(on)pads[p.id]=p;const col={vbat:'#e53935',gnd:'#666',['5v']:'#ef5350',['9v']:'#ff7043',tx:'#43a047',rx:'#e0e0e0',motor:'#c58a3a',ch:'#ff9800',esc:'#90caf9',sig:'#fdd835'}[p.t]||'#e0b050';
   const lx=p.x<=b.x+1?p.x-12:p.x>=b.x+b.w-1?p.x+12:p.x,ly=p.y<=b.y+1?p.y-14:p.y>=b.y+b.h-1?p.y+22:p.y+4,an=p.x<=b.x+1?'end':p.x>=b.x+b.w-1?'start':'middle';
   s+=`<g class="pad" data-pad="${p.id}"><circle cx="${p.x}" cy="${p.y}" r="10" fill="#d9b25a" stroke="${col}" stroke-width="3"/><circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#6b5320"/><text x="${lx}" y="${ly}" text-anchor="${an}" fill="#ffe9b0" font-size="11.5" font-weight="700">${esc(p.l)}</text><title>${esc(padTitle(p))}</title></g>`}
  s+='</g>'}
 let wiresSvg='',ends='';
 for(const c of W.W.comps){const on=!!B.inst[c.need];const tb=W.W.boards.find(b=>c.wires.some(w=>(w.ok||[]).some(x=>b.pads.some(p=>p.id===x))))||W.W.boards[W.W.boards.length-1],cx=tb.x+tb.w/2,cy=tb.y+tb.h/2;
  let dx=cx-c.x,dy=cy-c.y;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;const bw=136,bh=34,ax=c.x+dx*(Math.abs(dx)>Math.abs(dy)?bw/2:bh/2/Math.max(.3,Math.abs(dy))*Math.abs(dy)),ay=c.y+dy*(Math.abs(dy)>=Math.abs(dx)?bh/2:bh/2*Math.abs(dy));
  s+=`<g opacity="${on?1:.3}"><rect x="${c.x-bw/2}" y="${c.y-bh/2}" width="${bw}" height="${bh}" rx="9" fill="${on&&B.burnt&&B.burnt[c.need]?'#2a120c':'#1d2a40'}" stroke="${on&&B.burnt&&B.burnt[c.need]?'#ff5d5d':'#3a4f73'}"/><text x="${c.x}" y="${c.y+5}" text-anchor="middle" fill="#e7edf7" font-size="12" font-weight="700">${esc(c.label.length>20?c.label.slice(0,19)+'…':c.label)}</text><title>${esc(c.label)}</title></g>`;
  if(!on)continue;const n=c.wires.length;
  c.wires.forEach((w,k)=>{const off=(k-(n-1)/2)*15,px=-dy*off,py=dx*off,a=[ax+px,ay+py],pid=B.wires[w.id],pad=pid&&pads[pid],rest=[ax+px+dx*46,ay+py+dy*46],e=pad?[pad.x,pad.y]:rest;
   const st=W.st[w.id],col=showWireStatus&&st==='bad'?'#ff3b3b':w.col;
   wiresSvg+=`<path data-wp="${w.id}" d="${wpath(a,e)}" fill="none" stroke="${col}" stroke-width="${(w.w||2.5)+1}" stroke-linecap="round" opacity="${pad?.95:.75}" ${showWireStatus&&st==='bad'?'stroke-dasharray="7 5"':''}/>`;
   ends+=`<g class="wend" data-w="${w.id}" data-ax="${a[0]}" data-ay="${a[1]}" data-rx="${rest[0]}" data-ry="${rest[1]}"><circle cx="${e[0]}" cy="${e[1]}" r="${pad?7:9}" fill="${w.col}" stroke="${showWireStatus?(st==='ok'?'#2ecc71':st==='warn'?'#ffb020':st==='bad'?'#ff3b3b':'#fff'):'#fff'}" stroke-width="2.5"/>${pad?'':`<text x="${e[0]}" y="${e[1]-13}" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700">${esc(w.l)}</text>`}<title>${esc(c.label+' — '+w.l)}</title></g>`})}
 s+=wiresSvg+ends+'</svg>';box.innerHTML=s;bindWireDrag(box.querySelector('svg'),pads)}
function padTitle(p){if(p.title)return p.title+` · ${p.id}`;return{vbat:'Batareya plusi (+)',gnd:'GND — minus / yer',['5v']:'5 V quvvat chiqishi',['9v']:'9 V quvvat chiqishi (VTX uchun)',tx:'UART TX — kontroller uzatadi (qurilmaning RX iga)',rx:'UART RX — kontroller qabul qiladi (qurilmaning TX idan)',motor:'Motor fazasi',ch:'Qabul qilgich kanali (signal + quvvat)',esc:'ESC ulagichi (8-pin)',sig:'Signal kontakti'}[p.t]+` · ${p.id}`}
function wpath(a,e){const mx=(a[0]+e[0])/2;return`M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${e[1]} ${e[0]},${e[1]}`}
function bindWireDrag(svg,pads){let drag=null;const toSvg=ev=>{const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())};
 svg.addEventListener('pointerdown',ev=>{const g=ev.target.closest('.wend');if(!g)return;ev.preventDefault();svg.setPointerCapture(ev.pointerId);drag={g,id:g.dataset.w,a:[+g.dataset.ax,+g.dataset.ay],path:svg.querySelector(`[data-wp="${CSS.escape(g.dataset.w)}"]`)};audioInit()});
 svg.addEventListener('pointermove',ev=>{if(!drag)return;const p=toSvg(ev);const c=drag.g.querySelector('circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);const t=drag.g.querySelector('text');if(t){t.setAttribute('x',p.x);t.setAttribute('y',p.y-13)}
  if(drag.path)drag.path.setAttribute('d',wpath(drag.a,[p.x,p.y]));svg.querySelectorAll('.pad circle:first-child').forEach(o=>o.removeAttribute('filter'));const near=nearPad(p,pads);if(near){const el=svg.querySelector(`[data-pad="${CSS.escape(near.id)}"] circle`);if(el)el.setAttribute('filter','url(#gl)')}});
 const end=ev=>{if(!drag)return;const p=toSvg(ev),near=nearPad(p,pads),id=drag.id;drag=null;pushUndo();const before=new Set(wcheck(B).fatal.map(f=>f.k+'|'+f.w));if(near){B.wires[id]=near.id;snd('solder')}else{delete B.wires[id];snd('place')}
  const nf=near?wcheck(B).fatal.filter(f=>!before.has(f.k+'|'+f.w)&&f.w===id):[];
  if(nf.length){B.burnt=B.burnt||{};for(const f of nf)if(f.slot&&B.inst[f.slot])B.burnt[f.slot]=true;showWireStatus=true}
  saveLocal();renderWires();scheduleRebuild(true);
  if(nf.length){const f=nf[0],nm=f.slot?glossName(slotLabel(T,f.slot)):'';sparkAt(near.x,near.y);snd('boom',.45);setTimeout(()=>snd('err'),250);toast(`<i class=i-flame></i> ${esc(f.t)}${nm?' — '+esc(nm)+' kuydi':''}`,3800)}};
 svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end)}
// uchqun va tutun (SVG animatsiya) — qisqa tutashuv joyida
function sparkAt(x,y){const svg=document.querySelector('#wires svg');if(!svg)return;const g=document.createElementNS(SVGNS,'g');g.setAttribute('class','spark');
 let h='';for(let i=0;i<14;i++){const a=i/14*Math.PI*2+Math.random()*.3,l=18+Math.random()*26;h+=`<line x1="${x}" y1="${y}" x2="${x+Math.cos(a)*l}" y2="${y+Math.sin(a)*l}" stroke="${i%3?'#ffd54f':'#fff'}" stroke-width="${1.5+Math.random()*2}" stroke-linecap="round"/>`}
 h+=`<circle cx="${x}" cy="${y}" r="16" fill="#fff59d" class="flash"/>`;for(let i=0;i<5;i++)h+=`<circle cx="${x+(Math.random()-.5)*18}" cy="${y}" r="${7+Math.random()*7}" fill="#555" class="smoke" style="animation-delay:${i*.12}s"/>`;
 g.innerHTML=h;svg.appendChild(g);setTimeout(()=>g.remove(),2200)}
function nearPad(p,pads){let best=null,bd=26;for(const id in pads){const q=pads[id],d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=q}}return best}

// ---------------- dizayn ----------------
function paintPanel(){return`<div class="card"><h3><i class=i-palette></i> Ranglar</h3>${T.paint.map(([k,l])=>`<div class="tg"><span>${esc(l)}</span><input type="color" data-col="${k}" value="${B.col[k]}" style="width:54px;height:30px;border:0;background:none"></div>`).join('')}
 <div class="fld" style="margin-top:8px"><div class="fl"><span>Sirt turi</span></div><select id="selFin">${Object.entries({gloss:'Yaltiroq lak',matte:'Mat',metal:'Metallik',satin:'Atlas (yarim mat)'}).map(([k,l])=>`<option value="${k}" ${B.fin===k?'selected':''}>${l}</option>`).join('')}</select></div>
 <div class="row" style="margin:8px 0"><button class="btn" id="bRandCol"><i class=i-dice></i> Tasodifiy ranglar</button><button class="btn" id="bResetCol"><i class=i-ccw></i> Standart</button></div></div>
 <div class="card"><h3><i class=i-target></i> Maqsad</h3><select id="selPurp">${Object.entries(T.purposes).map(([k,v])=>`<option value="${k}" ${B.purpose===k?'selected':''}>${esc(v.t)}</option>`).join('')}</select><p style="font-size:12.5px;color:var(--mu);margin:6px 0">${esc(T.purposes[B.purpose].note)}</p></div>`}
function bindPaint(P){P.querySelectorAll('[data-col]').forEach(i=>{i.oninput=()=>{beginEdit();B.col[i.dataset.col]=i.value;scheduleRebuild(false)}});
 P.querySelector('#selFin').onchange=e=>{pushUndo();B.fin=e.target.value;commit()};P.querySelector('#selPurp').onchange=e=>{pushUndo();B.purpose=e.target.value;commit()};
 P.querySelector('#bRandCol').onclick=()=>{pushUndo();for(const[k]of T.paint)B.col[k]=new THREE.Color().setHSL(Math.random(),.5+Math.random()*.4,.35+Math.random()*.3).getStyle().replace(/rgb\((\d+),(\d+),(\d+)\)/,(m,r,g,b)=>'#'+[r,g,b].map(x=>(+x).toString(16).padStart(2,'0')).join(''));
  if(!/^#/.test(B.col[T.paint[0][0]]))for(const[k]of T.paint)B.col[k]='#'+new THREE.Color(B.col[k]).getHexString();commit();snd('click')};
 P.querySelector('#bResetCol').onclick=()=>{pushUndo();B.col=cloneB(T.colors);commit()}}

// ---------------- tekshiruv va hisob-kitob ----------------
function checkPanel(){const W=wcheck(B),I=T.issues(B,D),bad=I.filter(i=>i.lvl==='bad').length+W.fatal.length,warn=I.filter(i=>i.lvl==='warn').length;
 const cols=['#4aa3ff','#ffb020','#2ecc71','#ff5a5a','#b06bff','#26c6da','#ff7043','#9ccc65','#8d6e63','#78909c'],tot=D.parts.reduce((s,p)=>s+p[1],0)||1;
 const ext=T.ext?T.ext(D,B):B.type==='copter'?[["Muallaq turish",fmt(D.tHover,1)+' daq'],['Aralash uchish',fmt(D.tMix,1)+' daq'],["Agressiv (to'liq gaz)",fmt(D.tAgg,1)+' daq'],['Maks. tezlik (taxm.)',fmt(D.vTop)+' km/soat'],['Samaradorlik (hover)',fmt(D.gw,1)+' g/W'],["Qo'shimcha yuk (2:1)",fmt(D.payload)+' g']]
  :B.type==='plane'?[["Sayr tezligi",fmt(D.Vc*3.6)+' km/soat'],['Maks. tezlik',fmt(D.Vmax*3.6)+' km/soat'],['Sifat (L/D)',fmt(D.LD,1)],["To'liq gazda vaqt",fmt(D.tFull,1)+' daq'],['Statik tortish',fmt(D.Tst)+' g'],['Dum hajmi',fmt(D.Vh,2)]]
  :[["Uzatma",fmt(D.ratio,1)+':1'],['Uzatma bo\'yicha tezlik',fmt(D.vGear*3.6)+' km/soat'],['Cho\'qqi tok',fmt(D.Ipk)+' A'],['Tezlanish',fmt(D.acc/9.81,2)+' g'],['Barqarorlik',fmt(D.stab,2)],['Kerakli servo',fmt(D.servoNeed,1)+' kg·sm']];
 return`<div class="card"><h3>${bad?'<i class=i-bad></i> Tayyor emas':warn?'<i class=i-warn></i> Ishlaydi, lekin kamchiliklar bor':'<i class=i-ok></i> Hammasi joyida'}</h3><p style="font-size:13px;color:#c4cee0;margin-bottom:8px">${bad} ta jiddiy xato, ${warn} ta ogohlantirish.</p></div>
 <div class="card"><h3><i class=i-chart></i> Asosiy ko'rsatkichlar</h3><div class="grid2" style="margin-bottom:8px">${[...T.metrics(B,D).map(m=>[m.l,m.v]),...ext].map(([l,v])=>`<div class="kv"><small>${esc(l)}</small><b>${esc(v)}</b></div>`).join('')}</div></div>
 <div class="card"><h3><i class=i-scale></i> Og'irlik taqsimoti</h3><div class="bar">${D.parts.filter(p=>p[1]>0).map((p,i)=>`<i style="width:${p[1]/tot*100}%;background:${cols[i%10]}" title="${esc(p[0])}: ${fmt(p[1])} g"></i>`).join('')}</div>
 <div class="leg" style="margin-bottom:8px">${D.parts.filter(p=>p[1]>0).map((p,i)=>`<span><i style="background:${cols[i%10]}"></i>${esc(p[0])} ${fmt(p[1])} g</span>`).join('')}</div></div>
 <div class="card"><h3><i class=i-chart></i> ${T.chart?esc(T.chart.title):(GND(B.type)?'Tezlik va tok':'Tortish va tok')+" — gaz bo'yicha"}</h3><canvas id="chart" width="720" height="380" style="width:100%;height:auto;background:var(--bg);border-radius:8px"></canvas>
 <table style="margin:8px 0"><tr>${(T.chart?T.chart.cols:['Gaz',GND(B.type)?'Tezlik, km/soat':'Tortish, g','Tok, A','Quvvat, W',GND(B.type)?'km/soat / 100W':'g/W']).map((h,i)=>`<th${i?' class="n"':''}>${esc(h)}</th>`).join('')}</tr>
 ${D.table.map(r=>`<tr><td>${r.t}%</td><td class="n">${fmt(r.thrust)}</td><td class="n">${fmt(r.amp,1)}</td><td class="n">${fmt(r.watt)}</td><td class="n">${fmt(r.eff,1)}</td></tr>`).join('')}</table></div>
 <div class="card"><h3><i class=i-globe></i> Muhit sharoiti <button class="q" data-g="twr">?</button></h3><div class="grid2"><div class="fld"><div class="fl"><span>Balandlik (dengizdan), m</span></div><input class="inp" type="number" id="envAlt" min="0" max="5000" step="50" value="${B.env.alt}"></div>
 <div class="fld"><div class="fl"><span>Harorat, °C</span></div><input class="inp" type="number" id="envTemp" min="-30" max="50" step="1" value="${B.env.temp}"></div></div>
 <p style="font-size:12px;color:var(--mu);margin-bottom:8px">Havo zichligi: ${fmt(airDensity(B.env.alt,B.env.temp),3)} kg/m³ (dengiz sathida 1.225). Tog'da va issiqda havo siyrak — tortish kamayadi.</p></div>
 ${window.ADV?ADV.html():''}
 <h3 style="font-size:13px;font-weight:600;margin:6px 0 6px"><i class=i-search></i> Batafsil tekshiruv</h3>
 ${W.fatal.map(f=>`<div class="iss bad"><b><i class=i-bolt></i> ${esc(f.t)}</b><span>${esc(f.why)}</span></div>`).join('')}${W.complete?'':`<div class="iss warn"><b><i class=i-plug></i> Simlar to'liq ulanmagan (${W.connected}/${W.total})</b><span>Kavsharlash bosqichiga qayting.</span></div>`}
 ${issuesHTML(false)}<p style="font-size:11.5px;color:var(--mu);margin-top:10px"><i class=i-info></i> Hisob-kitoblar taxminiy (±15–25%): ommabop detallarning sinov natijalariga moslangan formulalar asosida. Haqiqiy detal sotib olishdan oldin ishlab chiqaruvchining sinov jadvallarini tekshiring.</p>`}
function bindCheck(P){const a=P.querySelector('#envAlt'),t=P.querySelector('#envTemp');const ch=()=>{pushUndo();B.env.alt=clamp(+a.value||0,0,5000);B.env.temp=clamp(+t.value||20,-30,50);commit()};a.onchange=ch;t.onchange=ch;drawChart();if(window.ADV)ADV.bind(P)}
function drawChart(){const c=$('chart');if(!c)return;const g=c.getContext('2d'),W=c.width,H=c.height,L=50,R=W-50,Tp=20,Bt=H-40,rows=D.table,mx=Math.max(...rows.map(r=>r.thrust))*1.1||1,ma=Math.max(...rows.map(r=>r.amp))*1.1||1;
 g.clearRect(0,0,W,H);g.font='13px Segoe UI';g.strokeStyle='rgba(255,255,255,.08)';g.fillStyle='#8e9bb3';
 for(let i=0;i<=5;i++){const y=Bt-(Bt-Tp)*i/5;g.beginPath();g.moveTo(L,y);g.lineTo(R,y);g.stroke();g.textAlign='right';g.fillText(fmt(mx*i/5),L-6,y+4);g.textAlign='left';g.fillText(fmt(ma*i/5),R+6,y+4)}
 g.textAlign='center';for(const r of rows)g.fillText(T.chart&&T.chart.xf?T.chart.xf(r):r.t+'%',L+(R-L)*r.t/100,Bt+18);
 const line=(k,m,col)=>{g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.moveTo(L,Bt);rows.forEach(r=>g.lineTo(L+(R-L)*r.t/100,Bt-(Bt-Tp)*r[k]/m));g.stroke()};
 line('thrust',mx,'#4aa3ff');line('amp',ma,'#ffb020');g.fillStyle='#4aa3ff';g.textAlign='left';g.fillText(T.chart?T.chart.l1:GND(B.type)?'■ Tezlik (km/soat)':'■ Tortish (g)',L,14);g.fillStyle='#ffb020';g.fillText(T.chart?T.chart.l2:'■ Tok (A)',L+170,14)}

// ---------------- sinov ----------------
// boshqaruv tugmalari — turiga va rejimga qarab
const CTRL={copter:{easy:[['W','Yuqoriga ko\'tarilish'],['S','Pastga tushish'],['A D','O\'z o\'qi atrofida burilish'],['↑ ↓','Oldinga / orqaga uchish'],['← →','Chapga / o\'ngga uchish']],
  manual:[['W S','Gazni oshirish / kamaytirish (qo\'yib yuborilsa ham saqlanadi)'],['A D','O\'z o\'qi atrofida burilish'],['↑ ↓ ← →','Egilish — tezlikni o\'zingiz to\'xtatasiz']]},
 plane:{easy:[['W S','Gazni oshirish / kamaytirish'],['↑','Burun tepaga (ko\'tarilish)'],['↓','Burun pastga'],['← →','Yonboshlab burilish (eleronlar)'],['A D','Yo\'nalish ruli']]},
 car:{easy:[['W ↑','Gaz'],['S ↓','Tormoz, so\'ng orqaga'],['A D ← →','Rul']]},
 boat:{easy:[['W ↑','Gaz (oldinga)'],['S ↓','Orqaga / sekinlash'],['A D ← →','Rul — faqat harakatda buradi']]},
 heli:{easy:[['W','Ko\'tarilish (collective)'],['S','Pasayish'],['↑ ↓ ← →','Egilish (cyclic) — uchish yo\'nalishi'],['A D','Dum — burilish']],manual:[['W S','Collective — qo\'yib yuborilsa saqlanadi'],['↑ ↓ ← →','Cyclic'],['A D','Dum']]},
 rocket:{easy:[['W / bo\'sh joy','Uchirish (3 s ortga sanash)']]},
 lab:{easy:[["Bo'sh joy / B",'Tugmani bosish'],['← →','Potensiometrni burash'],['—','Kod «Kod va detallar» bosqichida tahrirlanadi']]},
 tank:{easy:[['W ↑','Oldinga'],['S ↓','Orqaga'],['A D','Burilish (joyida ham)'],['Q E','Minorani burish']]},
 robot:{code:[['W A S D X','Kodga Serial orqali buyruq yuboriladi (MODE_MANUAL uchun)'],['—','Robot siz yozgan Arduino kodi bilan yuradi']],manual:[['W ↑','Oldinga'],['S ↓','Orqaga'],['A D ← →','Joyida burilish (g\'ildiraklar qarama-qarshi)']],avoid:[['—','Robot o\'zi yuradi: HC-SR04 to\'siqni ko\'rsa, orqaga chekinib buriladi']],line:[['—','Robot o\'zi yuradi: ikki IQ sensor qora chiziqni kuzatadi']]}};
const MODES={copter:[['easy','Oson','Balandlik va joyni o\'zi ushlaydi — boshlovchilar uchun'],['manual','Qo\'lda','Gaz to\'liq sizda — haqiqiy FPV dron kabi']],heli:[['easy','Oson','Balandlikni o\'zi ushlaydi'],['manual','Qo\'lda','Collective to\'liq sizda']],
 plane:[['easy','Barqaror','Qo\'yib yuborilsa o\'zi tekislanadi'],['manual','Qo\'lda','Hech qanday yordamsiz']],
 robot:[['code','Arduino kodi','Siz yozgan (yoki avtomatik) kod simulyatorda bajariladi'],['manual','Qo\'lda','Klaviatura bilan boshqarasiz'],['avoid','To\'siqdan qochish','Arduino dasturi: HC-SR04 bilan avtonom yurish'],['line','Chiziq bo\'ylab','Arduino dasturi: ikki IQ sensor bilan qora chiziqni kuzatish']]};
const simMode=()=>{const M=MODES[B.type],m=window.SIM_MODE;return M?(M.some(x=>x[0]===m)?m:M[0][0]):'easy'};
function ctrlHTML(){const C=CTRL[B.type]||{},L=C[simMode()]||C.easy||C.manual||[];return`<div class="keys">${L.map(([k,t])=>`<div><span>${k.split(' ').map(x=>`<kbd>${esc(x)}</kbd>`).join(' ')}</span><em>${esc(t)}</em></div>`).join('')}${isTouch?'<div><span>Joystiklar</span><em>Chap — gaz va burilish, o\'ng — yo\'nalish</em></div>':''}</div>`}
function modeHTML(){const M=MODES[B.type];if(!M)return'';return`<div class="seg">${M.map(([k,l,t])=>`<button data-mode="${k}" class="${simMode()===k?'on':''}" title="${esc(t)}">${esc(l)}</button>`).join('')}</div><p class="note">${esc(M.find(m=>m[0]===simMode())[2])}</p>`}
function fixStep(pf){if(pf.miss&&pf.miss.length)return T.steps.findIndex(s=>s.slots&&s.kind!=='paint'&&s.slots(B).some(x=>!B.inst[x]));return T.steps.findIndex(s=>s.kind==='wiring')}
function testPanel(){const pf=preflight(B);
 const items=[];if(!pf.ok)items.push({lvl:'bad',t:pf.block});for(const f of pf.fatal)items.push({lvl:'bad',t:f.t,why:f.why,ic:'bolt'});
 if(pf.ok&&!pf.fatal.length)items.push({lvl:'ok',t:"Yig'ish tugallangan — sinovga tayyor",why:"Simlar yoki parraklardagi xatolar sinovda o'zini ko'rsatadi — xuddi haqiqiy hayotdagidek."});
 return`${items.map(i=>`<div class="iss ${i.lvl}"><b>${IC(i.ic||{bad:'bad',ok:'ok'}[i.lvl])} ${esc(i.t)}</b>${i.why?`<span>${esc(i.why)}</span>`:''}</div>`).join('')}
 <div class="card"><h3><i class=i-gamepad></i> Boshqaruv</h3>${modeHTML()}${ctrlHTML()}
 <div class="row" style="margin:10px 0 8px"><button class="btn pri" id="bArm"><i class=i-play></i> Boshlash</button><button class="btn" id="bReset"><i class=i-ccw></i> Qaytadan</button></div>
 <div class="tg" style="margin-bottom:4px"><span>Kamera</span></div><div class="seg">${[['chase','Orqadan'],...(B.type==='copter'?[['fpv','FPV kamera']]:[]),['pilot','Yerdan']].map(([k,l])=>`<button data-cam="${k}" class="${(SIM&&SIM.cam||'chase')===k?'on':''}">${l}</button>`).join('')}</div></div>
 <div class="card"><h3><i class=i-gauge></i> Natijalar</h3><div class="grid2" id="telem" style="margin-bottom:8px"></div></div>`}
function bindTest(P){P.querySelector('#bArm').onclick=()=>{audioInit();simArm();updateHud(true)};P.querySelector('#bReset').onclick=()=>{startSim();snd('click')};
 P.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>{if(SIM){SIM.cam=b.dataset.cam;snd('click');P.querySelectorAll('[data-cam]').forEach(x=>x.classList.toggle('on',x===b))}});
 P.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{window.SIM_MODE=b.dataset.mode;if(SIM)SIM.mode=window.SIM_MODE;snd('click');renderPanel();renderStartCard()})}
// sinov oldidan ekrandagi karta: nima qilish kerak, qaysi tugmalar, katta "Boshlash"
function renderStartCard(){const el=$('simStart'),S=SIM;if(!S||S.armed||S.fail||step().kind!=='test'){el.classList.add('hidden');return}const pf=S.pf;
 if(!pf.ok){el.innerHTML=`<div class="simCard"><h3><i class=i-warn></i> Sinovni boshlab bo'lmaydi</h3><p class="note">${esc(pf.block)}</p><div class="row" style="margin-top:10px"><button class="btn pri" id="ovFix"><i class=i-wrench></i> Tuzatishga o'tish</button></div></div>`;
  el.classList.remove('hidden');$('ovFix').onclick=()=>goStep(Math.max(0,fixStep(pf)));return}
 el.innerHTML=`<div class="simCard"><h3><i class=i-rocket></i> ${T.startTitle||(GND(B.type)?'Sinov haydashga tayyor':'Sinov parvoziga tayyor')}</h3>
  <p class="note">${T.startNote?T.startNote:B.type==='copter'?"Dron qo'nish maydonchasida turibdi. Boshlang, so'ng <b>W</b> ni bosib turing — dron ko'tariladi.":B.type==='plane'?"Samolyot uchish yo'lagida. <b>W</b> bilan to'liq gaz bering, tezlik yig'ilgach <b>↑</b> bilan burunni ko'taring.":"Mashina konuslar oldida. <b>W</b> — oldinga, <b>A/D</b> — rul."}</p>
  ${modeHTML()}${ctrlHTML()}<button class="btn pri big" id="ovStart"><i class=i-play></i> Boshlash</button></div>`;
 el.classList.remove('hidden');el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{window.SIM_MODE=b.dataset.mode;S.mode=window.SIM_MODE;snd('click');renderStartCard();renderPanel()});
 $('ovStart').onclick=()=>{audioInit();simArm();el.classList.add('hidden');updateHud(true)}}
function startSim(){simStart(B);$('hudFail').classList.add('hidden');resize();$('stL').classList.toggle('hidden',!isTouch);$('stR').classList.toggle('hidden',!isTouch);renderStartCard();updateHud(true)}
let hudT=0;function updateHud(force){const S=SIM;if(!S)return;const n=performance.now();if(!force&&n-hudT<150)return;hudT=n;const soc=S.B.p.bat?clamp(1-S.used/S.B.p.bat.mah,0,1):1,sp=S.vel.length()*3.6;
 const MM=(MODES[S.B.type]||[]).find(x=>x[0]===S.mode),mode=MM?`<div class="hm">${esc(MM[1])} rejim</div>`:'';
 $('hudL').innerHTML=`<div class="hs ${S.armed?'on':''}"><i></i>${S.armed?'Ishlayapti':"To'xtagan"}</div>${mode}${S.T.noSpeed?'':`<div>Tezlik <b>${fmt(sp)}</b> km/soat</div>`}${!GND(S.B.type)?`<div>Balandlik <b>${fmt(S.pos.y,1)}</b> m</div>`:''}
  ${S.B.p.bat?`<div>Batareya <b>${fmt(soc*100)}%</b> · ${fmt(S.volt||S.D.V,1)} V</div><div class="batbar"><i style="width:${soc*100}%;background:${soc<.2?'#ff5a5a':soc<.4?'#ffb020':'#2ecc71'}"></i></div><div>Vaqt <b>${mmss(S.t)}</b> · ${fmt(S.amp||0,1)} A</div>`:`<div>Holat <b>${esc({run:'Kod ishlamoqda',pad:'Sterjenda',count:'Ortga sanash',burn:'Dvigatel yonmoqda',coast:'Inersiya',chute:'Parashyutda',ballistic:'Erkin tushish',landed:"Qo'ndi"}[S.st]||'—')}</b></div><div>Vaqt <b>${mmss(S.t)}</b></div>`}`;
 $('hudMsg').textContent=S.status;$('hudMsg').classList.toggle('hidden',!S.status);
 const tl=$('telem');if(tl)tl.innerHTML=[['Maks. tezlik',fmt(S.maxV*3.6)+' km/soat'],['Maks. balandlik',fmt(S.maxH,1)+' m'],['Sarflangan',fmt(S.used)+' mAh'],['Min. kuchlanish',S.minV<99?fmt(S.minV,1)+' V':'—']].map(([l,v])=>`<div class="kv"><small>${l}</small><b>${v}</b></div>`).join('');
 if(S.fail&&$('hudFail').classList.contains('hidden')){$('hudFail').innerHTML=`<div><h3><i class=i-explode></i> ${esc(S.fail.t)}</h3><p style="color:#c4cee0;margin-bottom:12px">${esc(S.fail.why)}</p><button class="btn pri" id="bFailR"><i class=i-ccw></i> Qaytadan</button></div>`;$('hudFail').classList.remove('hidden');$('bFailR').onclick=()=>startSim()}
 if(S.armed&&!S.fail&&S.t>15&&(GND(S.B.type)?S.maxV>Math.min(3,S.D.vTop*.4):S.maxH>2)&&!(B.passed&&B.passed[B.type])){B.passed=Object.assign(B.passed||{},{[B.type]:true});saveLocal();renderSteps();toast('<i class=i-trophy></i> Sinov muvaffaqiyatli o\'tdi!')}}
const mmss=v=>{v=Math.max(0,Math.round(v));return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')};
function bindStick(id,st){const el=$(id),k=el.querySelector('i');let pid=null;const mv=e=>{const r=el.getBoundingClientRect(),R=r.width/2;let x=(e.clientX-r.left-R)/R,y=(e.clientY-r.top-R)/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}st.x=x;st.y=y;k.style.transform=`translate(${x*R*.6}px,${y*R*.6}px)`};
 el.addEventListener('pointerdown',e=>{pid=e.pointerId;el.setPointerCapture(pid);mv(e)});el.addEventListener('pointermove',e=>{if(e.pointerId===pid)mv(e)});
 const up=e=>{if(e.pointerId!==pid)return;pid=null;st.x=0;if(id==='stR')st.y=0;k.style.transform=id==='stL'?`translate(0px,${st.y*el.clientWidth/2*.6}px)`:''};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}
bindStick('stL',STK.l);bindStick('stR',STK.r);

// ---------------- detallar ro'yxati (BOM) ----------------
function bomPanel(){const L=T.bom(B,D),cur=B.cur||"so'm";let tw=0,tp=0;
 const rows=L.map(([k,n,s,q,w],i)=>{const pr=+(B.prices[k+i]||0);tw+=q*w;tp+=q*pr;return`<tr><td><b>${esc(n)}</b><br><small style="color:var(--mu)">${esc(s)}</small></td><td class="n">${q}</td><td class="n">${fmt(q*w)} g</td><td class="n noprint"><input class="inp" type="number" min="0" step="any" data-price="${k+i}" value="${pr||''}" placeholder="narx" style="width:90px;padding:4px"></td></tr>`}).join('');
 const guide=T.steps.filter(s=>s.intro&&s.kind!=='paint').map((s,i)=>`<li><b>${esc(s.t)}.</b> ${esc(s.intro)}</li>`).join('');
 return`<div class="card"><h3><i class=i-list></i> Detallar ro'yxati</h3><table><tr><th>Detal</th><th class="n">Soni</th><th class="n">Og'irlik</th><th class="n noprint">Narxi (1 dona)</th></tr>${rows}
 <tr><th>Jami</th><th></th><th class="n">${fmt(tw)} g</th><th class="n">${fmt(tp)} ${esc(cur)}</th></tr></table>
 <div class="tg noprint" style="margin-top:8px"><span>Valyuta</span><input class="inp" id="curInp" value="${esc(cur)}" style="max-width:110px"></div><div class="row noprint" style="margin:8px 0"><button class="btn" id="bPrint"><i class=i-printer></i> PDF</button><button class="btn" id="bCsv"><i class=i-download></i> CSV</button><button class="btn" id="bCopy"><i class=i-clipboard></i> Nusxa</button></div></div>
 ${T.code?`<div class="card"><h3><i class=i-terminal></i> ${esc(T.codeTitle||'Dastur kodi')}</h3><p class="note">Kod sizning simlaringiz va parametrlaringiz asosida yaratildi. Arduino IDE ga nusxalab, platangizga yuklang.</p><textarea id="codeTxt" spellcheck="false" style="min-height:340px;font-family:'JetBrains Mono',monospace;font-size:12px;tab-size:2">${esc(B.code||T.code(B,D,wcheck(B)))}</textarea>
 <div id="codeRes" class="note" style="margin:6px 0">${B.code?"Siz tahrirlagan kod. Sinovda aynan shu kod ishlaydi.":"Avtomatik yaratilgan kod — uni o'zgartirishingiz mumkin."}</div>
 <div class="row" style="margin:8px 0;flex-wrap:wrap"><button class="btn pri" id="bCodeRun"><i class=i-play></i> Simulyatsiyada ishga tushirish</button><button class="btn" id="bCodeCheck"><i class=i-ok></i> Tekshirish</button><button class="btn" id="bCodeReset"><i class=i-ccw></i> Asl kod</button><button class="btn" id="bCodeCopy"><i class=i-clipboard></i> Nusxa</button><button class="btn" id="bCodeDl"><i class=i-download></i> .ino</button></div></div>`:''}
 ${T.cli?`<div class="card"><h3><i class=i-terminal></i> Betaflight sozlamasi (namuna)</h3><textarea id="cliTxt" readonly>${esc(T.cli(B,wcheck(B)))}</textarea><div class="row" style="margin:8px 0"><button class="btn" id="bCliCopy"><i class=i-clipboard></i> Nusxa olish</button></div></div>`:''}
 <div class="card"><h3><i class=i-tools></i> Yig'ish qo'llanmasi</h3><ol style="margin:0 0 8px 18px;font-size:13px;line-height:1.6">${guide}</ol>
 <p style="font-size:12.5px;color:#c4cee0;margin-bottom:8px"><i class=i-flame></i> <b>Xavfsizlik:</b> birinchi ulashda batareya o'rniga "smoke stopper" (saqlagich) ishlating; ulashdan oldin multimetr bilan + va − orasida qisqa tutashuv yo'qligini tekshiring; sinovda parraklarni yechib qo'ying.</p></div>
 <div class="card"><h3><i class=i-note></i> Eslatmalar</h3><textarea id="notes" placeholder="O'z eslatmalaringiz: do'kon, buyurtma, sozlash...">${esc(B.notes||'')}</textarea><div style="height:8px"></div></div>`}
function bindBom(P){P.querySelectorAll('[data-price]').forEach(i=>i.onchange=()=>{B.prices[i.dataset.price]=Math.max(0,+i.value||0);saveLocal();renderPanel()});
 P.querySelector('#curInp').onchange=e=>{B.cur=e.target.value.slice(0,8);saveLocal();renderPanel()};P.querySelector('#notes').oninput=e=>{B.notes=e.target.value.slice(0,5000);saveLocal()};
 P.querySelector('#bPrint').onclick=()=>print();
 const txt=()=>T.bom(B,D).map(([k,n,s,q,w],i)=>[n,s,q,Math.round(q*w),+(B.prices[k+i]||0)]);
 P.querySelector('#bCsv').onclick=()=>{const rows=[['Detal','Tavsif','Soni',"Og'irlik (g)",'Narx']].concat(txt());download(B.name+'.csv','﻿'+rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(';')).join('\n'),'text/csv')};
 P.querySelector('#bCopy').onclick=()=>copyText(B.name+'\n'+txt().map(r=>`• ${r[0]} ×${r[2]} — ${r[1]}`).join('\n'));
 const cc=P.querySelector('#bCliCopy');if(cc)cc.onclick=()=>copyText($('cliTxt').value);
 const ct=P.querySelector('#codeTxt');if(ct&&window.ARD){let tm=0;ct.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const p=ct.selectionStart;ct.setRangeText('  ',p,ct.selectionEnd,'end')}});
  ct.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{B.code=ct.value;saveLocal();const r=ARD.compile(ct.value);$('codeRes').innerHTML=r.ok?"<span style='color:var(--ok)'>"+IC('ok')+" Kod to'g'ri — saqlandi.</span>":"<span style='color:var(--bad)'>"+IC('bad')+' '+esc(r.err)+'</span>'},500)};
  P.querySelector('#bCodeCheck').onclick=()=>{const r=ARD.compile(ct.value);snd(r.ok?'ok':'err');$('codeRes').innerHTML=r.ok?"<span style='color:var(--ok)'>"+IC('ok')+" Xato yo'q: kod simulyatorda ishlaydi.</span>":"<span style='color:var(--bad)'>"+IC('bad')+' '+esc(r.err)+'</span>'};
  P.querySelector('#bCodeReset').onclick=()=>{pushUndo();delete B.code;saveLocal();renderPanel();toast("<i class=i-ccw></i> Avtomatik kodga qaytarildi")};
  P.querySelector('#bCodeRun').onclick=()=>{B.code=ct.value;saveLocal();const r=ARD.compile(ct.value);if(!r.ok){snd('err');$('codeRes').innerHTML="<span style='color:var(--bad)'>"+esc(r.err)+'</span>';return}window.SIM_MODE='code';goStep(T.steps.findIndex(s=>s.kind==='test'))}}
 const kc=P.querySelector('#bCodeCopy');if(kc)kc.onclick=()=>copyText($('codeTxt').value);
 const kd=P.querySelector('#bCodeDl');if(kd)kd.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([$('codeTxt').value],{type:'text/plain'}));a.download=(B.name||'robot').replace(/[^a-z0-9]+/gi,'_')+'.ino';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name.replace(/[\\/:*?"<>|]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function copyText(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('<i class=i-clipboard></i> Nusxa olindi')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('<i class=i-clipboard></i> Nusxa olindi')}catch(e){}ta.remove()})}

// ---------------- yangi loyiha, lug'at ----------------
function newDialog(type){let sel=type||B.type;const draw=()=>{const Tt=TYPES[sel];openModal(`<h2><i class=i-plus></i> Yangi loyiha</h2><p style="color:var(--mu)">Nima yasaymiz? Keyin shablonni tanlang — barcha detallarni o'zingiz o'zgartira olasiz.</p>
 <div class="tcards">${Object.values(TYPES).map(t=>`<button class="tcard ${t.id===sel?'on':''}" data-nt="${t.id}"><div class="ic">${IC(t.ic)}</div><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div>
 <h3 style="margin-top:6px">${IC(Tt.ic)} Shablon</h3><div class="tcards">${Object.entries(Tt.presets).map(([id,p])=>`<button class="tcard" data-np="${id}"><b>${esc(p.name)}</b><span>${esc(p.desc)}</span></button>`).join('')}</div>
 <p style="font-size:12px;color:var(--mu)">Joriy loyiha brauzerda saqlanadi; serverga saqlash uchun «Saqlash / ulashish» dan foydalaning.</p>`,true);
 document.querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>{sel=b.dataset.nt;draw()});
 document.querySelectorAll('[data-np]').forEach(b=>b.onclick=()=>{closeModal();setProject(newProject(sel,b.dataset.np));snd('ok')})};draw()}
$('bNew').onclick=()=>newDialog();
$('bGloss').onclick=()=>{const draw=q=>{q=(q||'').toLowerCase();const L=Object.entries(GLOSS).filter(([k,g])=>!q||(g.n+g.en+g.w).toLowerCase().includes(q));
 $('glList').innerHTML=L.map(([k,g])=>`<div class="gl"><b>${esc(g.n)}</b> <small>${esc(g.en)}</small><p><i class=i-pin></i> ${esc(g.w)}</p><p><i class=i-help></i> ${esc(g.y)}</p><p><i class=i-ok></i> ${esc(g.h)}</p></div>`).join('')||'<p>Topilmadi</p>'};
 openModal(`<h2><i class=i-book></i> Lug'at — detallar va tushunchalar</h2><p style="color:var(--mu);margin-bottom:10px">${Object.keys(GLOSS).length} ta atama: nima ekani, nima uchun kerakligi va qanday tanlash.</p><input class="inp" id="glQ" placeholder="Qidirish: motor, KV, servo..." autofocus><div id="glList"></div>`);
 draw();$('glQ').oninput=e=>draw(e.target.value)};

// ---------------- 3D asboblar ----------------
$('tExplode').onclick=()=>{explodeT=explodeT?0:1;$('tExplode').classList.toggle('on',!!explodeT);snd('click')};
$('tLabels').onclick=()=>{showLabels=!showLabels;$('tLabels').classList.toggle('on',showLabels)};
$('tXray').onclick=()=>{window.XRAY=!window.XRAY;$('tXray').classList.toggle('on',window.XRAY);rebuild()};
$('tFit').onclick=()=>{if(insp){orb.tg.set(0,insp.turn.position.y,0);orb.tr=insp.size*2.6}else fitCamera(model.userData.size)};
$('tAuto').onclick=()=>{orb.auto=!orb.auto;$('tAuto').classList.toggle('on',orb.auto)};
$('tShot').onclick=()=>{renderFrame();const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download=(B.name||'konstruktor').replace(/[\\/:*?"<>|]/g,'_')+'.png';a.click()};

// ---------------- server (Django): akkaunt, saqlash, ulashish, galereya ----------------
const NET={base:null,token:null,user:null,online:false,
 async req(path,opt={}){if(!this.base&&path!=='/api/ping')return{ok:false,status:0,error:"Server bilan aloqa yo'q"};const h={'Content-Type':'application/json'};if(this.token)h.Authorization='Token '+this.token;
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(this.base+path,{method:opt.method||'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined,signal:ctl.signal});let j={};try{j=await r.json()}catch(e){}return Object.assign({status:r.status},j)}
  catch(e){return{status:0,ok:false,error:"Server bilan aloqa yo'q"}}finally{clearTimeout(to)}},
 async init(){try{this.token=localStorage.getItem('konstruktor.token')}catch(e){}
  // API manzili: config.js dagi KONS_API (Render) → sayt ochilgan domen → lokal ishlab chiqish serveri
  const c=[],cfg=String(window.KONS_API||'').trim().replace(/\/+$/,'');if(cfg)c.push(cfg);else{if(location.protocol.startsWith('http'))c.push(location.origin);if(/^(localhost|127\.0\.0\.1|)$/.test(location.hostname))c.push('http://127.0.0.1:8001')}
  for(const b of[...new Set(c)]){this.base=b;const r=await this.req('/api/ping');if(r.ok&&r.name==='konstruktor'){this.online=true;break}}
  if(!this.online)this.base=null;else if(this.token){const r=await this.req('/api/me');if(r.ok)this.user=r.user;else if(r.status===401)this.setToken(null)}accUI()},
 setToken(t){this.token=t;try{t?localStorage.setItem('konstruktor.token',t):localStorage.removeItem('konstruktor.token')}catch(e){}}};
function accUI(){$('accName').textContent=NET.user?NET.user.username:NET.online?'Kirish':'Oflayn'}
$('bAcc').onclick=()=>{if(!NET.online)return openModal(`<h2><i class=i-user></i> Akkaunt</h2><p style="color:#c4cee0;margin:10px 0">Server bilan aloqa yo'q. Loyihalar brauzerda saqlanyapti. Serverni ishga tushirish: <b>backend\\start.bat</b> <i class=i-right></i> <b>http://127.0.0.1:8001</b></p><button class="btn" id="bRetry"><i class=i-orbit></i> Qayta ulanish</button>`),$('bRetry').onclick=async()=>{await NET.init();closeModal();toast(NET.online?'<i class=i-ok></i> Server ulandi':"Server topilmadi")};
 if(NET.user)return openModal(`<h2><i class=i-user></i> ${esc(NET.user.username)}</h2><p style="color:var(--mu);margin:8px 0">Saqlangan loyihalaringiz: «Galereya» <i class=i-right></i> «Mening loyihalarim».</p><button class="btn danger" id="bLogout">Chiqish</button>`),$('bLogout').onclick=async()=>{await NET.req('/api/logout',{method:'POST'});NET.setToken(null);NET.user=null;accUI();closeModal();toast('Chiqdingiz')};
 authDialog()};
function authDialog(after){openModal(`<h2><i class=i-user></i> Kirish yoki ro'yxatdan o'tish</h2><p style="color:var(--mu);margin-bottom:10px">Loyihalaringizni serverda saqlash, havola bilan ulashish va galereyaga qo'yish uchun.</p>
 <input class="inp" id="aU" maxlength="24" placeholder="Foydalanuvchi nomi" autocomplete="username" style="margin-bottom:8px"><input class="inp" id="aP" type="password" placeholder="Parol (kamida 8 belgi)" autocomplete="current-password" style="margin-bottom:8px">
 <div id="aE" style="color:var(--bad);font-weight:700;min-height:22px"></div><div class="row"><button class="btn pri" id="aIn">Kirish</button><button class="btn" id="aReg">Ro'yxatdan o'tish</button></div>`);
 const go=async reg=>{$('aE').textContent='…';const r=await NET.req(reg?'/api/register':'/api/login',{method:'POST',body:{username:$('aU').value.trim(),password:$('aP').value}});
  if(!r.ok){$('aE').textContent=r.error||'Xato';return}NET.setToken(r.token);NET.user=r.user;accUI();closeModal();toast('Xush kelibsiz, '+esc(r.user.username)+'!');if(after)after()};
 $('aIn').onclick=()=>go(false);$('aReg').onclick=()=>go(true);$('aP').onkeydown=e=>{if(e.key==='Enter')go(false)}}
function thumb(){renderFrame();const s=renderer.domElement,c=document.createElement('canvas');c.width=360;c.height=225;const g=c.getContext('2d'),r=Math.max(c.width/s.width,c.height/s.height),w=s.width*r,h=s.height*r;g.drawImage(s,(c.width-w)/2,(c.height-h)/2,w,h);return c.toDataURL('image/jpeg',.72)}
function summary(){return T.metrics(B,D).slice(0,4).map(m=>m.l+': '+m.v).join(' · ').slice(0,200)}
$('bShare').onclick=()=>{const link=B.id&&NET.base?NET.base+'/?b='+B.id:'';
 openModal(`<h2><i class=i-link></i> Saqlash va ulashish</h2>
 <div class="card" style="margin-top:10px"><h3><i class=i-cloud></i> Serverga saqlash</h3>${NET.online?`<div class="tg"><span>Galereyada hammaga ko'rinsin</span><button class="sw ${B.pub?'on':''}" id="swPub"></button></div>
  <div class="row" style="margin:8px 0"><button class="btn pri" id="bSave"><i class=i-save></i> ${B.id?'Yangilash':'Saqlash'}</button></div>${link?`<input class="inp" readonly value="${esc(link)}" id="lnk"><div class="row" style="margin:8px 0"><button class="btn" id="bCopyL"><i class=i-clipboard></i> Havolani nusxalash</button></div>`:''}`
  :`<p style="color:#c4cee0;margin-bottom:8px">Server ulanmagan — quyidagi fayl orqali ulashing.</p>`}</div>
 <div class="card"><h3><i class=i-folder></i> Fayl</h3><p style="font-size:12.5px;color:var(--mu);margin-bottom:8px">Loyihani .json fayl sifatida yuklab oling va boshqa kompyuterda oching.</p><div class="row" style="margin-bottom:8px"><button class="btn" id="bExp"><i class=i-download></i> Yuklab olish</button><label class="btn" style="cursor:pointer"><i class=i-upload></i> Fayldan ochish<input type="file" id="fImp" accept=".json,application/json" hidden></label></div></div>`);
 const sp=$('swPub');if(sp)sp.onclick=()=>{B.pub=!B.pub;sp.classList.toggle('on',B.pub);saveLocal()};
 const sv=$('bSave');if(sv)sv.onclick=async()=>{if(!NET.user)return authDialog(()=>$('bShare').onclick());sv.disabled=true;sv.textContent='…';
  const body={name:B.name||'Nomsiz loyiha',type:B.type,public:!!B.pub,data:B,summary:summary(),thumb:thumb()};
  let r=B.id?await NET.req('/api/builds/'+B.id,{method:'PUT',body}):{status:404};if(r.status===404||r.status===403)r=await NET.req('/api/builds',{method:'POST',body});
  if(!r.ok){toast('<i class=i-bad></i> '+esc(r.error||'Saqlab bo\'lmadi'));sv.disabled=false;sv.textContent='<i class=i-save></i> Saqlash';return}B.id=r.build.slug;saveLocal();snd('ok');toast('<i class=i-ok></i> Saqlandi');$('bShare').onclick()};
 const cl=$('bCopyL');if(cl)cl.onclick=()=>copyText($('lnk').value);
 $('bExp').onclick=()=>download((B.name||'loyiha')+'.konstruktor.json',JSON.stringify(B,null,1),'application/json');
 $('fImp').onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.size>200000)return toast('Fayl juda katta');const rd=new FileReader();rd.onload=()=>{try{const b=JSON.parse(rd.result);if(!b||b.v!==2||!TYPES[b.type])throw 0;b.id=null;closeModal();setProject(b);toast('<i class=i-ok></i> Loyiha ochildi')}catch(x){toast("<i class=i-bad></i> Fayl formati noto'g'ri")}};rd.readAsText(f)}};
$('bGallery').onclick=async()=>{if(!NET.online)return openModal(`<h2><i class=i-image></i> Galereya</h2><p style="color:#c4cee0;margin-top:10px">Galereya uchun server kerak: <b>backend\\start.bat</b> <i class=i-right></i> <b>http://127.0.0.1:8001</b></p>`);
 let tab='all',tp='';const draw=async()=>{openModal(`<h2><i class=i-image></i> Galereya</h2><div class="row" style="margin:10px 0"><button class="btn ${tab==='all'?'pri':''}" data-gt="all"><i class=i-globe></i> Hammaning loyihalari</button>${NET.user?`<button class="btn ${tab==='mine'?'pri':''}" data-gt="mine"><i class=i-user></i> Mening loyihalarim</button>`:''}</div>
  <div class="chips">${[['','Barchasi',''],...Object.values(TYPES).map(t=>[t.id,t.name.split(' (')[0],t.ic])].map(([k,l,ic])=>`<button class="chip ${tp===k?'on':''}" data-gf="${k}">${ic?IC(ic)+' ':''}${esc(l)}</button>`).join('')}</div><div class="tcards" id="gList"><p>Yuklanmoqda…</p></div>`,true);
  document.querySelectorAll('[data-gt]').forEach(b=>b.onclick=()=>{tab=b.dataset.gt;draw()});document.querySelectorAll('[data-gf]').forEach(b=>b.onclick=()=>{tp=b.dataset.gf;draw()});
  const r=await NET.req(tab==='mine'?'/api/builds':'/api/gallery'+(tp?'?type='+tp:''));const el=$('gList');if(!el)return;
  if(!r.ok){el.innerHTML=`<p>${esc(r.error||'Xato')}</p>`;return}const L=(r.builds||[]).filter(b=>!tp||b.type===tp);
  el.innerHTML=L.map(b=>`<button class="tcard" data-slug="${esc(b.slug)}">${b.thumb?`<img src="${esc(b.thumb)}" alt="" style="width:100%;border-radius:8px;aspect-ratio:16/10;object-fit:cover;margin-bottom:6px">`:''}<b>${TYPES[b.type]?IC(TYPES[b.type].ic):''} ${esc(b.name)}</b><span>${esc(b.author)} · ${esc(b.summary||'')}</span>${tab==='mine'?`<span style="display:block;margin-top:4px">${b.public?'<i class=i-globe></i> ochiq':'<i class=i-lock></i> shaxsiy'}</span>`:''}</button>`).join('')||"<p>Hali loyiha yo'q — birinchi bo'ling!</p>";
  el.querySelectorAll('[data-slug]').forEach(x=>x.onclick=()=>openShared(x.dataset.slug))};draw()};
async function openShared(slug){const r=await NET.req('/api/builds/'+encodeURIComponent(slug));if(!r.ok){toast('<i class=i-bad></i> '+esc(r.error||'Topilmadi'));return}
 const b=r.build.data;if(!b||!TYPES[b.type]){toast("<i class=i-bad></i> Loyiha ma'lumoti buzilgan");return}b.id=r.build.mine?r.build.slug:null;closeModal();setProject(b);toast(r.build.mine?'<i class=i-ok></i> Loyihangiz ochildi':`<i class=i-ok></i> «${esc(r.build.name)}» (${esc(r.build.author)}) nusxasi ochildi`)}

// ---------------- asosiy sikl ----------------
let lastT=performance.now(),fpsT=0,fpsN=0;
function renderFrame(){if(step()&&step().kind==='test'&&SIM)renderer.render(simScene,simCam);else renderer.render(scene,camera)}
function loop(t){const raw=Math.max(0,(t-lastT)/1000),dt=Math.min(.05,raw);lastT=t;
 if(raw<.25){fpsT+=raw;fpsN++;if(fpsT>2.5){const fps=fpsN/fpsT;if(fps<38&&dynScale>.55){dynScale*=.85;resize()}else if(fps>57&&dynScale<1){dynScale=Math.min(1,dynScale*1.08);resize()}fpsT=fpsN=0}}
 if(step().kind==='test'&&SIM){if(!SIM.fail||SIM.burnT<3)simTick(dt);updateHud()}
 else{modelTick(dt,t/1000);if(insp)insp.turn.rotation.y+=orb.auto?dt*.5:0;camUpdate(dt);key.position.set(orb.tg.x+60,orb.tg.y+140,orb.tg.z+80);key.target.position.copy(orb.tg);
  }
 if(++labelTick%3===0)updateLabels();
 renderFrame();requestAnimationFrame(loop)}

// ---------------- ishga tushirish ----------------
(function init(){$('view').prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D ko\'rinish');
 new ResizeObserver(()=>resize()).observe($('view'));resize();bindOrbit(renderer.domElement,onPick,onHover);
 try{window.MUTE=localStorage.getItem('konstruktor.mute')==='1';$('bMute').innerHTML=IC(window.MUTE?'mute':'volume')}catch(e){}
 const saved=loadLocal();setProject(saved||newProject('copter'));
 requestAnimationFrame(loop);
 NET.init().then(()=>{const slug=new URLSearchParams(location.search).get('b');if(slug&&NET.online)openShared(slug)});
 if(!saved)setTimeout(()=>newDialog('copter'),600);
 window.__k={get B(){return B},get D(){return D},T:()=>T,goStep,install,autoInstall,wcheck,get SIM(){return SIM},simArm,NET,enterInspect,exitInspect,setProject,newProject};
})();
