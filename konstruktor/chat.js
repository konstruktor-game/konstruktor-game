/* =====================================================================
   SAVOL-JAVOB YORDAMCHISI
   1) Server sozlangan bo'lsa (KONS_AI_CHAT=1 + anthropic paketi) — savol loyiha konteksti bilan
      /api/chat ga yuboriladi va Claude javob beradi.
   2) Aks holda brauzerning o'zida javob beriladi: lug'at (GLOSS), joriy loyihaning hisob-kitoblari,
      xatolar ro'yxati va bosqich ko'rsatmalari asosida. Hech narsa o'ylab topilmaydi.
   ===================================================================== */
'use strict';
(()=>{
const css=`.chatFab{position:fixed;right:16px;bottom:16px;z-index:55;display:flex;align-items:center;gap:7px;background:var(--ac);color:#1a1200;font-weight:700;padding:10px 15px;border-radius:24px;box-shadow:var(--sh)}
.chatFab i{width:17px;height:17px}
.chatBox{position:fixed;right:16px;bottom:16px;z-index:56;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 90px));background:var(--p1);border:1px solid var(--ln2);border-radius:var(--r);box-shadow:var(--sh);display:flex;flex-direction:column;overflow:hidden}
.chatHd{display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--ln);background:var(--p2)}
.chatHd b{flex:1;font-size:13.5px}.chatHd small{color:var(--mu);font-size:11px;display:block;font-weight:400}
.chatHd button{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--tx2)}.chatHd button:hover{background:var(--p3)}
.chatLog{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px}
.cm{max-width:88%;padding:8px 11px;border-radius:12px;font-size:12.8px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
.cm.u{align-self:flex-end;background:var(--ac-soft);border:1px solid rgba(255,176,32,.35)}
.cm.a{align-self:flex-start;background:var(--p3);border:1px solid var(--ln)}
.cm.a b{color:var(--ac)}.cm .src{display:block;margin-top:6px;color:var(--mu);font-size:10.8px}
.chatSug{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}
.chatSug button{font-size:11.5px;padding:5px 9px;border-radius:14px;background:var(--p3);border:1px solid var(--ln2);color:var(--tx2)}.chatSug button:hover{border-color:var(--ac)}
.chatIn{display:flex;gap:7px;padding:10px;border-top:1px solid var(--ln)}
.chatIn textarea{flex:1;resize:none;height:42px!important;min-height:0!important;max-height:110px;width:auto!important;background:var(--bg2);border:1px solid var(--ln2);border-radius:10px;padding:10px;font:12.8px/1.45 Inter,'Segoe UI',system-ui,sans-serif}
.chatIn textarea:focus{outline:none;border-color:var(--ac)}
.chatIn button{width:42px;height:42px;align-self:flex-end;border-radius:10px;background:var(--ac);color:#1a1200;display:grid;place-items:center}.chatIn button:disabled{opacity:.5}
.typing{display:inline-flex;gap:4px}.typing i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:tb 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes tb{0%,100%{opacity:.3}50%{opacity:1}}
@media (max-width:520px){.chatFab span{display:none}.chatFab{padding:11px}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const fab=document.createElement('button');fab.className='chatFab';fab.title='Savol berish — yordamchi';fab.innerHTML=`${IC('help')}<span>Savol berish</span>`;document.body.appendChild(fab);
const box=document.createElement('div');box.className='chatBox hidden';box.setAttribute('role','dialog');box.setAttribute('aria-label','Yordamchi');
box.innerHTML=`<div class="chatHd">${IC('help')}<b>Yordamchi<small id="chatMode">Lug'at va loyiha hisob-kitoblari asosida</small></b><button id="chatClr" title="Suhbatni tozalash">${IC('undo')}</button><button id="chatX" title="Yopish">${IC('x')}</button></div>
 <div class="chatLog" id="chatLog"></div><div class="chatSug" id="chatSug"></div>
 <div class="chatIn"><textarea id="chatQ" placeholder="Masalan: KV nima? Nega dronim ag'dariladi?" maxlength="1200"></textarea><button id="chatSend" title="Yuborish">${IC('right')}</button></div>`;
document.body.appendChild(box);
const $c=id=>box.querySelector('#'+id),log=$c('chatLog'),hist=[];let ai=null,busy=false;

const norm=s=>String(s||'').toLowerCase().replace(/[‘’ʼ`ʻ']/g,"'").replace(/[^a-z0-9а-яёўқғҳ'\s.-]/gi,' ');
const STOP=new Set(['nima','nega','qanday','qaysi','uchun','bu','va','ham','men','meni','mening','kerak','qilish','qilsa','bilan','haqida','degani','nimaga','qanaqa','bormi','edi','emas','yoki','the','what','is','how','a','of','to']);
const words=s=>norm(s).split(/\s+/).filter(w=>w.length>1&&!STOP.has(w));
const stem=w=>w.replace(/(lari|larni|larga|ning|dagi|ni|ga|da|dan|lar|i)$/,'');
function glossHits(q){const W=words(q).map(stem).filter(w=>w.length>1);if(!W.length)return[];const R=[];
 for(const[k,g]of Object.entries(GLOSS)){const name=norm(g.n+' '+g.en+' '+k),body=norm(g.w);let s=0;
  for(const w of W){if(name.split(/[\s()/.-]+/).some(t=>t===w||t.startsWith(w)&&w.length>2))s+=5;else if(name.includes(w)&&w.length>2)s+=3;else if(body.includes(w)&&w.length>3)s+=.6}
  if(s>=3)R.push([s,k,g])}
 return R.sort((a,b)=>b[0]-a[0]).slice(0,2)}
const cur=()=>{try{const T=TYPES[B.type],D=T.derive(B);return{T,D,step:T.steps[B.step||0]||T.steps[0]}}catch(e){return null}};
function localAnswer(q){const n=norm(q),c=cur(),out=[];
 const wantIss=/(xato|muammo|kamchilik|nega|nimaga|ishlamay|ag'dar|kuy|qiz|tekshir|yomon|sabab|nosoz)/.test(n),wantNext=/(keyingi|qayerdan|boshla|nima qil|qanday yig|qadam|bosqich)/.test(n),wantNum=/(tezlik|og'irlik|vaqt|tok|kuchlanish|necha|qancha|tortish|quvvat|hisob)/.test(n);
 const hits=glossHits(q);
 for(const[,k,g]of hits)out.push(`<b>${esc(g.n)}</b> (${esc(g.en)}) — ${esc(g.w)}\nNima uchun kerak: ${esc(g.y)}\nQanday tanlash: ${esc(g.h)}`);
 if(c&&wantIss){const L=c.T.issues(B,c.D),W=wcheck(B),F=[...W.fatal.map(f=>({lvl:'bad',t:f.t,why:f.why})),...L].filter(i=>i.lvl!=='info').slice(0,5);
  out.push(F.length?`Loyihangizdagi muammolar:\n${F.map(i=>`• <b>${esc(i.t)}</b>${i.why?' — '+esc(i.why):''}`).join('\n')}`:"Loyihangiz hisob-kitoblarida jiddiy muammo topilmadi. Agar sinovda biror narsa ishlamasa, «Ulash» bosqichida «Tekshirish» tugmasini bosing — simlar xatosi ko'rsatiladi.")}
 if(c&&wantNum){const M=c.T.metrics(B,c.D);out.push(`Hozirgi loyiha (${esc(B.name)}):\n${M.map(m=>`• ${esc(m.l)}: <b>${esc(m.v)}</b>`).join('\n')}`)}
 if(c&&wantNext){const s=c.step;out.push(`Hozir «${esc(s.t)}» bosqichidasiz.${s.intro?'\n'+esc(s.intro):''}\nYuqoridagi raqamli bosqichlar bo'yicha ketma-ket yuring: avval parametrlarni o'zingiz belgilang, so'ng arvoh (shaffof) detalni bosib o'rnating.`)}
 if(!out.length)return`Bu savolga brauzerdagi lug'atdan aniq javob topa olmadim. Detal yoki tushuncha nomini yozib ko'ring (masalan: «ESC», «C reyting», «PWM», «og'irlik markazi»), yoki «loyihamda qanday xato bor?» deb so'rang.${ai===false?'\n\n<span class="src">Kengaytirilgan AI javoblar serverda yoqilmagan.</span>':''}`;
 return out.join('\n\n')+`<span class="src">Manba: sayt lug'ati va loyihangiz hisob-kitoblari</span>`}

function add(role,html){const d=document.createElement('div');d.className='cm '+(role==='user'?'u':'a');d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function sugg(){const c=cur(),L=['Loyihamda qanday xato bor?','Keyingi qadam nima?','KV nima?','C reyting nima?'];
 if(c){if(B.type==='robot')L.splice(2,2,'PWM nima?','Umumiy GND nima uchun kerak?');else if(B.type==='plane')L.splice(2,2,"Og'irlik markazi qayerda bo'lishi kerak?",'Dihedral nima?');else if(B.type==='boat')L.splice(2,2,'Glissirlash nima?','Suv bilan sovutish nima uchun kerak?')}
 $c('chatSug').innerHTML=L.map(s=>`<button>${esc(s)}</button>`).join('');$c('chatSug').querySelectorAll('button').forEach(b=>b.onclick=()=>ask(b.textContent))}
function ctxObj(){const c=cur();if(!c)return{};return{tur:c.T.name,loyiha:B.name,bosqich:c.step.t,maqsad:B.purpose,parametrlar:B.p,korsatkichlar:c.T.metrics(B,c.D).map(m=>m.l+': '+m.v),muammolar:c.T.issues(B,c.D).map(i=>i.t)}}
async function serverAsk(q){if(!NET.base||ai===false)return null;const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),70000);
 try{const r=await fetch(NET.base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q,ctx:ctxObj(),history:hist.slice(-8)}),signal:ctl.signal});const j=await r.json().catch(()=>({}));
  if(j.offline){ai=false;setMode();return null}if(j.ok&&j.answer)return j.answer;if(j.error)return'Xato: '+j.error;return null}catch(e){return null}finally{clearTimeout(to)}}
async function ask(q){q=String(q||'').trim();if(!q||busy)return;busy=true;$c('chatSend').disabled=true;$c('chatQ').value='';add('user',esc(q));
 const wait=add('a','<span class="typing"><i></i><i></i><i></i></span>');let ans=await serverAsk(q),html;
 if(ans!=null){html=esc(ans).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')+'<span class="src">Javob: Claude (AI) — muhim qarorlarda hisob-kitobni tekshiring</span>'}else{ans=localAnswer(q);html=ans}
 wait.innerHTML=html;hist.push({role:'user',text:q},{role:'assistant',text:wait.textContent});log.scrollTop=log.scrollHeight;busy=false;$c('chatSend').disabled=false}
function setMode(){$c('chatMode').textContent=ai?"Claude AI + loyiha hisob-kitoblari":"Lug'at va loyiha hisob-kitoblari asosida"}
async function open(){box.classList.remove('hidden');fab.classList.add('hidden');sugg();
 if(!log.children.length)add('a',"Salom! Detal, tushuncha yoki loyihangiz haqida so'rang. Masalan: «ESC nima?», «nega sinovda ag'darildi?», «keyingi qadam nima?»");
 if(ai===null&&NET.base){try{const r=await fetch(NET.base+'/api/chat');const j=await r.json();ai=!!j.ai}catch(e){ai=false}setMode()}
 setTimeout(()=>$c('chatQ').focus(),50)}
fab.onclick=open;$c('chatX').onclick=()=>{box.classList.add('hidden');fab.classList.remove('hidden')};
$c('chatClr').onclick=()=>{log.innerHTML='';hist.length=0;open()};
$c('chatSend').onclick=()=>ask($c('chatQ').value);
$c('chatQ').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask($c('chatQ').value)}});
// sinov bosqichida (joystiklar va HUD bilan) tugma xalaqit bermasin
setInterval(()=>{const c=cur(),t=c&&c.step.kind==='test';fab.style.display=t&&box.classList.contains('hidden')?'none':''},700);
window.KCHAT={open,ask,localAnswer};
})();
