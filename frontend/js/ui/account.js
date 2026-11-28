/* =====================================================================
   HISOB: kirish / ro'yxatdan o'tish oynasi va hisob paneli
   - Tablar: Kirish | Ro'yxatdan o'tish; maydonlar yozish paytida tekshiriladi (server qoidalari bilan bir xil)
   - Parol kuchi ko'rsatkichi, parolni ko'rsatish, Caps Lock ogohlantirishi, takroriy parol
   - Hisob paneli: profil, loyihalar soni, parolni o'zgartirish, barcha qurilmalardan chiqish, hisobni o'chirish
   API: /api/login, /api/register, /api/me, /api/logout, /api/logout-all, /api/password, /api/account/delete
   ===================================================================== */
'use strict';
(()=>{
const USER_RE=/^[A-Za-z0-9_.-]{3,24}$/,MAXP=128;
// eng ko'p uchraydigan parollar — server ham (Django CommonPasswordValidator) ularni rad etadi
const COMMON=['12345678','123456789','1234567890','password','qwertyui','qwerty123','11111111','00000000','iloveyou','password1','abcd1234','asdfghjk','87654321','qwer1234','1q2w3e4r','parol123','salom123'];
function strength(p,user){if(!p)return{s:0,t:'',c:''};let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
 const bad=p.length<8?'Kamida 8 belgi':/^\d+$/.test(p)?"Faqat raqamdan iborat bo'lmasin":COMMON.includes(p.toLowerCase())?'Juda keng tarqalgan parol':user&&p.toLowerCase().includes(user.toLowerCase())&&user.length>=3?"Parolda foydalanuvchi nomi bo'lmasin":p.length>MAXP?`${MAXP} belgidan oshmasin`:'';
 if(bad)return{s:Math.min(s,1),t:bad,c:'bad',bad:true};const lv=Math.min(4,Math.max(1,s-1));return{s:lv,t:['','Zaif','O\'rtacha','Yaxshi','Kuchli'][lv],c:['','bad','warn','ok','ok'][lv]}}
const eye=id=>`<button type="button" class="acEye" data-eye="${id}" title="Parolni ko'rsatish / yashirish" aria-label="Parolni ko'rsatish">${IC('eye')}</button>`;
const meter=id=>`<div class="acMeter" id="${id}"><i></i><i></i><i></i><i></i><span></span></div>`;
const fmtDate=s=>{if(!s)return'—';try{return new Date(s).toLocaleDateString('uz-UZ',{year:'numeric',month:'long',day:'numeric'})}catch(e){return s.slice(0,10)}};
function bindEyes(){document.querySelectorAll('[data-eye]').forEach(b=>b.onclick=()=>{const i=document.getElementById(b.dataset.eye);if(!i)return;i.type=i.type==='password'?'text':'password';b.classList.toggle('on',i.type==='text');i.focus()})}
function bindCaps(ids,warnId){const w=document.getElementById(warnId);for(const id of ids){const i=document.getElementById(id);if(!i)continue;const f=e=>{if(w&&e.getModifierState)w.hidden=!e.getModifierState('CapsLock')};i.addEventListener('keyup',f);i.addEventListener('keydown',f)}}
function setMeter(id,r){const m=document.getElementById(id);if(!m)return;m.className='acMeter '+(r.c||'');m.querySelectorAll('i').forEach((x,k)=>x.classList.toggle('f',k<r.s));m.querySelector('span').textContent=r.t||''}
function busy(btn,on,label){if(!btn)return;btn.disabled=on;if(on){btn.dataset.l=btn.innerHTML;btn.innerHTML=`<span class="acSpin"></span>${label||'Kuting…'}`}else if(btn.dataset.l)btn.innerHTML=btn.dataset.l}

// ---------------- kirish / ro'yxatdan o'tish ----------------
function offline(){openModal(`<h2>${IC('user')} Hisob</h2><div class="acOff">${IC('warn')}<div><b>Server bilan aloqa yo'q</b><p>Loyihalaringiz hozircha shu brauzerda saqlanyapti. Server ishga tushgach qayta ulaning.</p></div></div>
 <button class="btn pri" id="acRetry">${IC('orbit')} Qayta ulanish</button>`);$('acRetry').onclick=async()=>{busy($('acRetry'),true,'Ulanmoqda…');await NET.init();if(NET.online){toast(`${IC('ok')} Server ulandi`);NET.user?panel():authDialog()}else{busy($('acRetry'),false);toast('Server topilmadi')}}}
function authDialog(after,mode){if(!NET.online)return offline();let tab=mode==='reg'?'reg':'in';
 const draw=()=>{openModal(`<div class="acWrap"><div class="acHead"><div class="acLogo">${IC('user')}</div><div><h2>${tab==='in'?'Hisobga kirish':"Ro'yxatdan o'tish"}</h2><p>Loyihalaringizni serverda saqlash, havola bilan ulashish va galereyaga qo'yish uchun. Email kerak emas.</p></div></div>
  <div class="acTabs" role="tablist"><button role="tab" data-at="in" class="${tab==='in'?'on':''}">Kirish</button><button role="tab" data-at="reg" class="${tab==='reg'?'on':''}">Ro'yxatdan o'tish</button></div>
  <form id="acForm" autocomplete="on" novalidate>
   <label class="acF"><span>Foydalanuvchi nomi</span><div class="acIn">${IC('user')}<input id="aU" maxlength="24" autocomplete="username" spellcheck="false" placeholder="masalan: ali_2010" required></div><small id="aUh" class="acHint">${tab==='reg'?'3–24 belgi: lotin harflari, raqam, _ . -':''}</small></label>
   <label class="acF"><span>Parol</span><div class="acIn">${IC('lock')}<input id="aP" type="password" maxlength="${MAXP}" autocomplete="${tab==='in'?'current-password':'new-password'}" placeholder="${tab==='in'?'Parolingiz':'Kamida 8 belgi'}" required>${eye('aP')}</div>${tab==='reg'?meter('aM'):''}</label>
   ${tab==='reg'?`<label class="acF"><span>Parolni takrorlang</span><div class="acIn">${IC('lock')}<input id="aP2" type="password" maxlength="${MAXP}" autocomplete="new-password" placeholder="Xuddi shu parol" required>${eye('aP2')}</div><small id="aP2h" class="acHint"></small></label>`:''}
   <div class="acCaps" id="aCaps" hidden>${IC('warn')} Caps Lock yoqilgan</div>
   <div class="acErr" id="aE" role="alert"></div>
   <button class="btn pri acGo" id="aGo" type="submit">${tab==='in'?`${IC('right')} Kirish`:`${IC('ok')} Hisob yaratish`}</button>
  </form>
  <p class="acFoot">${IC('lock')} Parol serverda shifrlangan (PBKDF2) holda saqlanadi — uni hech kim, hatto administrator ham ko'ra olmaydi. ${tab==='in'?`Hisobingiz yo'qmi? <a href="#" data-at="reg">Ro'yxatdan o'ting</a>`:`Hisobingiz bormi? <a href="#" data-at="in">Kiring</a>`}</p></div>`);
  document.querySelectorAll('[data-at]').forEach(b=>b.onclick=e=>{e.preventDefault();const u=$('aU').value;tab=b.dataset.at;draw();$('aU').value=u;validate();(u?$('aP'):$('aU')).focus()});
  bindEyes();bindCaps(['aP','aP2'],'aCaps');
  const validate=()=>{const u=$('aU').value.trim(),p=$('aP').value,reg=tab==='reg';let ok=!!u&&!!p;
   if(reg){const uh=$('aUh'),uok=USER_RE.test(u);uh.className='acHint '+(u?uok?'ok':'bad':'');uh.innerHTML=!u?'3–24 belgi: lotin harflari, raqam, _ . -':uok?`${IC('ok')} Nom qoidaga mos`:/[^A-Za-z0-9_.-]/.test(u)?"Faqat lotin harflari, raqam va _ . - (bo'sh joy va o'zbekcha ʻ belgilarisiz)":u.length<3?'Kamida 3 belgi':'24 belgidan oshmasin';
    const r=strength(p,u);setMeter('aM',r);const p2=$('aP2').value,h2=$('aP2h');h2.className='acHint '+(p2?p2===p?'ok':'bad':'');h2.innerHTML=!p2?'':p2===p?`${IC('ok')} Parollar mos`:'Parollar mos emas';ok=uok&&!r.bad&&p2===p}
   $('aGo').disabled=!ok;return ok};
  ['aU','aP','aP2'].forEach(id=>{const i=$(id);if(i)i.oninput=()=>{$('aE').textContent='';validate()}});validate();setTimeout(()=>$('aU').focus(),30);
  $('acForm').onsubmit=async e=>{e.preventDefault();if(!validate())return;const btn=$('aGo'),reg=tab==='reg';busy(btn,true,reg?'Yaratilmoqda…':'Tekshirilmoqda…');
   const r=await NET.req(reg?'/api/register':'/api/login',{method:'POST',body:{username:$('aU').value.trim(),password:$('aP').value}});busy(btn,false);
   if(!r.ok){$('aE').innerHTML=`${IC('warn')} ${esc(r.error||'Xato')}`;if(r.status===409){$('aUh').className='acHint bad';$('aUh').textContent="Bu nom band — boshqasini tanlang yoki «Kirish» ga o'ting"}$('acForm').classList.remove('shake');void $('acForm').offsetWidth;$('acForm').classList.add('shake');snd('err');return}
   NET.setToken(r.token);NET.user=r.user;accUI();closeModal();snd('ok');toast(`${IC('ok')} ${reg?'Hisob yaratildi':'Xush kelibsiz'}, ${esc(r.user.username)}!`);if(after)after()}};
 draw()}
window.authDialog=authDialog;

// ---------------- hisob paneli ----------------
async function panel(){const u0=NET.user;if(!u0)return authDialog();
 const draw=u=>{const ini=(u.username[0]||'?').toUpperCase();openModal(`<div class="acWrap acPanel">
  <div class="acProf"><div class="acAva">${esc(ini)}</div><div class="acWho"><h2>${esc(u.username)}</h2><p>Ro'yxatdan o'tgan: ${fmtDate(u.joined)}${u.last_login?` · Oxirgi kirish: ${fmtDate(u.last_login)}`:''}</p></div></div>
  <div class="acStats"><div><b>${u.builds??'—'}</b><span>Saqlangan loyiha</span></div><div><b>${u.public??'—'}</b><span>Galereyada</span></div><div><b>${(u.builds??0)-(u.public??0)}</b><span>Shaxsiy</span></div></div>
  <div class="row acActs"><button class="btn pri" id="acMine">${IC('folder')} Mening loyihalarim</button><button class="btn" id="acSave">${IC('save')} Joriy loyihani saqlash</button></div>
  <details class="acSec" id="acPw"><summary>${IC('lock')} Parolni o'zgartirish</summary><form id="acPwF" novalidate>
   <label class="acF"><span>Joriy parol</span><div class="acIn">${IC('lock')}<input id="pO" type="password" autocomplete="current-password" maxlength="${MAXP}">${eye('pO')}</div></label>
   <label class="acF"><span>Yangi parol</span><div class="acIn">${IC('lock')}<input id="pN" type="password" autocomplete="new-password" maxlength="${MAXP}" placeholder="Kamida 8 belgi">${eye('pN')}</div>${meter('pM')}</label>
   <label class="acF"><span>Yangi parolni takrorlang</span><div class="acIn">${IC('lock')}<input id="pN2" type="password" autocomplete="new-password" maxlength="${MAXP}">${eye('pN2')}</div><small id="pN2h" class="acHint"></small></label>
   <div class="acCaps" id="pCaps" hidden>${IC('warn')} Caps Lock yoqilgan</div><div class="acErr" id="pE" role="alert"></div>
   <button class="btn pri" id="pGo" type="submit">${IC('ok')} Parolni yangilash</button><p class="acFoot">Parol o'zgargach, boshqa barcha qurilmalardagi kirishlar bekor bo'ladi.</p></form></details>
  <details class="acSec"><summary>${IC('globe')} Qurilmalar</summary><p class="note">Boshqa kompyuter yoki telefonda kirgan bo'lsangiz va u yerda chiqishni unutgan bo'lsangiz — barcha qurilmalardan chiqing.</p><button class="btn" id="acAll">${IC('x')} Barcha qurilmalardan chiqish</button></details>
  <details class="acSec acDanger"><summary>${IC('warn')} Hisobni o'chirish</summary><p class="note">Hisob va undagi <b>barcha ${u.builds??''} ta loyiha</b> butunlay o'chadi, qaytarib bo'lmaydi. Brauzerdagi joriy loyiha saqlanib qoladi.</p>
   <label class="acF"><span>Tasdiqlash uchun foydalanuvchi nomingizni yozing: <b>${esc(u.username)}</b></span><div class="acIn">${IC('user')}<input id="dU" autocomplete="off" spellcheck="false"></div></label>
   <label class="acF"><span>Parol</span><div class="acIn">${IC('lock')}<input id="dP" type="password" autocomplete="current-password">${eye('dP')}</div></label><div class="acErr" id="dE" role="alert"></div>
   <button class="btn danger" id="dGo" disabled>${IC('x')} Hisobni butunlay o'chirish</button></details>
  <div class="acBottom"><button class="btn" id="acOut">${IC('back')} Chiqish</button></div></div>`);
  bindEyes();bindCaps(['pO','pN','pN2'],'pCaps');
  $('acMine').onclick=()=>{closeModal();$('bGallery').click();setTimeout(()=>{const b=document.querySelector('[data-gt="mine"]');if(b)b.click()},60)};
  $('acSave').onclick=()=>{closeModal();$('bShare').click()};
  const pv=()=>{const n=$('pN').value,n2=$('pN2').value,r=strength(n,u.username);setMeter('pM',r);const h=$('pN2h');h.className='acHint '+(n2?n2===n?'ok':'bad':'');h.innerHTML=!n2?'':n2===n?`${IC('ok')} Parollar mos`:'Parollar mos emas';
   const same=n&&n===$('pO').value;if(same){setMeter('pM',{s:1,t:'Yangi parol eskisidan farq qilsin',c:'bad'})}$('pGo').disabled=!($('pO').value&&!r.bad&&n2===n&&!same);return!$('pGo').disabled};
  ['pO','pN','pN2'].forEach(id=>$(id).oninput=()=>{$('pE').textContent='';pv()});pv();
  $('acPwF').onsubmit=async e=>{e.preventDefault();if(!pv())return;busy($('pGo'),true,'Yangilanmoqda…');const r=await NET.req('/api/password',{method:'POST',body:{old:$('pO').value,new:$('pN').value}});busy($('pGo'),false);
   if(!r.ok){$('pE').innerHTML=`${IC('warn')} ${esc(r.status===404?"Server hali bu imkoniyatni qo'llamaydi — serverni yangilang":r.error||'Xato')}`;snd('err');return}
   NET.setToken(r.token);if(r.user)NET.user=r.user;snd('ok');toast(`${IC('ok')} Parol yangilandi. Boshqa qurilmalardagi kirishlar bekor qilindi.`,3200);draw(NET.user)};
  $('acAll').onclick=async()=>{busy($('acAll'),true);const r=await NET.req('/api/logout-all',{method:'POST'});busy($('acAll'),false);
   if(!r.ok){toast(esc(r.status===404?"Server hali bu imkoniyatni qo'llamaydi":r.error||'Xato'));return}NET.setToken(null);NET.user=null;accUI();closeModal();toast(`${IC('ok')} Barcha qurilmalardan chiqildi${r.count?` (${r.count} ta sessiya)`:''}`,2800)};
  const dv=()=>{$('dGo').disabled=!($('dU').value.trim()===u.username&&$('dP').value)};$('dU').oninput=dv;$('dP').oninput=()=>{$('dE').textContent='';dv()};
  $('dGo').onclick=async()=>{busy($('dGo'),true,"O'chirilmoqda…");const r=await NET.req('/api/account/delete',{method:'POST',body:{password:$('dP').value}});busy($('dGo'),false);
   if(!r.ok){$('dE').innerHTML=`${IC('warn')} ${esc(r.status===404?"Server hali bu imkoniyatni qo'llamaydi":r.error||'Xato')}`;snd('err');return}NET.setToken(null);NET.user=null;accUI();closeModal();toast("Hisob o'chirildi",2600)};
  $('acOut').onclick=async()=>{busy($('acOut'),true);await NET.req('/api/logout',{method:'POST'});NET.setToken(null);NET.user=null;accUI();closeModal();toast('Hisobdan chiqdingiz')}};
 draw(u0);const r=await NET.req('/api/me');if(r.ok&&r.user){NET.user=r.user;if(document.querySelector('.acPanel'))draw(r.user)}else if(r.status===401){NET.setToken(null);NET.user=null;accUI();authDialog()}}
window.ACCOUNT={panel,authDialog};
$('bAcc').onclick=()=>{snd('click');if(!NET.online)return offline();NET.user?panel():authDialog()};

// ---------------- stillar ----------------
const st=document.createElement('style');st.textContent=`
.acWrap{max-width:460px;margin:0 auto}.acHead{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}.acHead h2{margin:0 0 3px}.acHead p{color:var(--mu);font-size:12.5px;line-height:1.5}
.acLogo{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--ac-soft);color:var(--ac);border:1px solid var(--ln2)}.acLogo i{width:20px;height:20px}
.acTabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:12px;background:var(--bg2);border:1px solid var(--ln);margin-bottom:14px}
.acTabs button{padding:8px;border-radius:9px;font-weight:600;font-size:13px;color:var(--mu);transition:background .15s,color .15s}.acTabs button.on{background:var(--p3);color:var(--tx);box-shadow:inset 0 0 0 1px var(--ln2)}.acTabs button:hover:not(.on){color:var(--tx2)}
.acF{display:block;margin-bottom:11px}.acF>span{display:block;font-size:12px;font-weight:600;color:var(--tx2);margin-bottom:5px}
.acIn{display:flex;align-items:center;gap:8px;padding:0 6px 0 11px;border-radius:10px;background:var(--bg2);border:1px solid var(--ln2);transition:border-color .15s,box-shadow .15s}
.acIn:focus-within{border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-soft)}.acIn>i{width:15px;height:15px;color:var(--mu);flex:none}
.acIn input{flex:1;min-width:0;background:none;border:0;outline:0;padding:10px 0;font-size:13.5px;color:var(--tx)}.acIn input::placeholder{color:var(--mu);opacity:.75}
.acEye{flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--mu)}.acEye:hover{background:var(--p3);color:var(--tx)}.acEye.on{color:var(--ac)}.acEye i{width:16px;height:16px}
.acHint{display:block;min-height:16px;margin-top:4px;font-size:11.5px;color:var(--mu)}.acHint.ok{color:var(--ok)}.acHint.bad{color:var(--bad)}.acHint i{width:12px;height:12px;vertical-align:-2px}
.acMeter{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:4px;align-items:center;margin-top:6px}.acMeter i{height:4px;border-radius:3px;background:var(--p4);transition:background .2s}
.acMeter span{font-size:11px;font-weight:600;color:var(--mu);min-width:92px;text-align:right}.acMeter.bad i.f{background:var(--bad)}.acMeter.warn i.f{background:var(--warn)}.acMeter.ok i.f{background:var(--ok)}
.acMeter.bad span{color:var(--bad)}.acMeter.warn span{color:var(--warn)}.acMeter.ok span{color:var(--ok)}
.acCaps{font-size:12px;color:var(--warn);margin:-4px 0 8px}.acCaps i{width:13px;height:13px;vertical-align:-2px}
.acErr{min-height:18px;font-size:12.5px;font-weight:600;color:var(--bad);margin-bottom:8px}.acErr i{width:14px;height:14px;vertical-align:-2px}
.acGo{width:100%;padding:11px;font-size:13.5px}.btn:disabled{opacity:.45;cursor:not-allowed;filter:saturate(.6)}
.acFoot{margin-top:12px;font-size:11.5px;color:var(--mu);line-height:1.55}.acFoot i{width:12px;height:12px;vertical-align:-2px}.acFoot a{color:var(--ac);font-weight:600}
.acSpin{width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;display:inline-block;animation:acs .7s linear infinite;margin-right:4px;vertical-align:-2px}@keyframes acs{to{transform:rotate(360deg)}}
.shake{animation:acsh .38s}@keyframes acsh{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.acOff{display:flex;gap:10px;padding:12px;border-radius:12px;border:1px solid rgba(255,176,32,.35);background:rgba(255,176,32,.08);margin:12px 0}.acOff>i{width:20px;height:20px;color:var(--warn);flex:none}.acOff p{color:var(--tx2);font-size:12.5px;margin-top:3px}
.acProf{display:flex;gap:14px;align-items:center;margin-bottom:14px}.acAva{flex:none;width:56px;height:56px;border-radius:16px;display:grid;place-items:center;font-size:24px;font-weight:700;color:#04121a;background:linear-gradient(135deg,var(--ac),var(--ac2))}
.acWho h2{margin:0}.acWho p{color:var(--mu);font-size:12px;margin-top:2px}
.acStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.acStats div{padding:10px;border-radius:11px;background:var(--p2);border:1px solid var(--ln);text-align:center}.acStats b{display:block;font-size:19px}.acStats span{font-size:11px;color:var(--mu)}
.acActs{margin-bottom:12px}.acActs .btn{flex:1}
.acSec{border:1px solid var(--ln);border-radius:12px;padding:0 12px;margin-bottom:8px;background:var(--p2)}.acSec summary{cursor:pointer;padding:11px 0;font-weight:600;font-size:13px;list-style:none;display:flex;align-items:center;gap:8px}.acSec summary::-webkit-details-marker{display:none}
.acSec summary:after{content:'';margin-left:auto;width:7px;height:7px;border-right:2px solid var(--mu);border-bottom:2px solid var(--mu);transform:rotate(45deg);transition:transform .2s}.acSec[open] summary:after{transform:rotate(-135deg)}.acSec[open]{padding-bottom:12px}.acSec summary i{width:15px;height:15px}
.acDanger{border-color:rgba(255,93,93,.3)}.acDanger summary{color:#ff8a8a}.acBottom{display:flex;justify-content:flex-end;margin-top:12px}
:root[data-ui=studio] .acAva{color:#fff}`;document.head.appendChild(st);
})();
