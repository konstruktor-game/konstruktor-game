/* =====================================================================
   SIM VA BATAREYA QO'LLANMASI
   Loyihaning hisoblangan toklari bo'yicha: har bir ulanish uchun sim yo'g'onligi (AWG, silikon izolyatsiya),
   ulagich turi va batareya tanlash (kerakli C reyting, sig'im, xavfsizlik).
   Silikon sim uchun qisqa muddatli ruxsat etilgan tok (taxminiy): kichik qiymatlar xavfsizlik zaxirasi bilan.
   ===================================================================== */
'use strict';
const GUIDE=(()=>{
const AWG=[[30,1],[28,1.5],[26,2.5],[24,3.5],[22,6],[20,10],[18,16],[16,22],[14,32],[12,45],[10,60],[8,90]];
const MM2={30:.05,28:.08,26:.13,24:.2,22:.33,20:.52,18:.82,16:1.3,14:2.1,12:3.3,10:5.3,8:8.4};
function pickAwg(I){for(const[a,max]of AWG)if(max>=I*1.2)return a;return 8}
const conn=I=>I<=3?'JST-PH 2.0':I<=10?'JST-RCY (BEC)':I<=30?'XT30':I<=60?'XT60':I<=90?'XT90':'AS150 / 8 mm';
// turi bo'yicha: asosiy (batareya) tok, bitta motor toki, motorlar soni
function currents(B,D){const t=B.type;switch(t){
 case'copter':return{main:D.Itot,mot:D.Imot,n:D.n,why:'barcha motorlar to\'liq gazda'};
 case'plane':return{main:D.Itot,mot:D.Imot,n:1};
 case'car':return{main:D.Ipk,mot:D.Ipk,n:1,why:'tezlanishdagi cho\'qqi'};
 case'boat':return{main:D.Imax,mot:D.Imax,n:1};
 case'heli':return{main:D.Imax,mot:D.Imax,n:1};
 case'robot':return{main:D.Ist*2+.2,mot:D.Ist,n:2,why:'motorlar ishga tushish (stall) toki'};
 case'tank':return{main:D.Ist*2+.3,mot:D.Ist,n:2,why:'joyida burilishdagi cho\'qqi'};
 case'lab':return{main:D.total/1000,mot:0,n:0,why:'barcha komponentlar birga'};
 case'free':return{main:Math.max(D.Ipk||0,D.I||0),mot:D.motors&&D.motors.length?(D.Ipk||D.I)/D.motors.length:0,n:D.motors?D.motors.length:0};
 case'rocket':return{main:2,mot:0,n:0,why:"o't oldirgich impulsi (≈1 s)"}}return{main:0,mot:0,n:0}}
function rows(B,D){const C=currents(B,D),R=[],I=C.main||0;
 if(B.type==='rocket'){R.push(["O't oldirgich → uchirish pulti",'2 A (1 s)','22–24 AWG, uzunligi 5–10 m (xavfsiz masofa)','Timsoh qisqichlar']);return R}
 if(B.type==='lab'){R.push(['Komponentlar → Arduino',`${fmt(I*1000)} mA`,'Jumper simlar 22–24 AWG (Dupont)','Dupont erkak-erkak']);R.push(['USB / quvvat',`${fmt(I*1000)} mA`,'USB kabel (≤ 500 mA)','USB-B / USB-C']);return R}
 if(I>0)R.push(['Batareya → ESC / drayver (asosiy)',`${fmt(I,1)} A`,`${pickAwg(I)} AWG (${String(MM2[pickAwg(I)]).replace('.',',')} mm²) silikon`,conn(I)]);
 if(C.mot>0)R.push([C.n>1?`Har bir motor (${C.n} ta)`:'Motor simlari',`${fmt(C.mot,1)} A`,`${pickAwg(C.mot)} AWG silikon`,C.mot>20?'Kavsharlash yoki 3,5–4 mm "banan"':C.mot>5?'Kavsharlash yoki 2–3,5 mm "banan"':'Kavsharlash / JST']);
 R.push(['Servo va qabul qilgich (signal + 5 V)','≤ 1 A','26 AWG (3 tolali servo kabel)','JST / Futaba / Dupont']);
 if(['copter','plane','boat','heli','car','tank'].includes(B.type))R.push(['UART / video / datchiklar','≤ 0,5 A','28–30 AWG','JST-SH 1.0 / kavsharlash']);
 if(B.p&&B.p.bat&&B.p.bat.cells>1&&!['robot','lab'].includes(B.type))R.push(['Balans ulagichi (zaryadlash)','≤ 1 A','26 AWG',`JST-XH ${(+B.p.bat.cells||0)+1}-pin`]);
 return R}
function battery(B,D){const p=B.p&&B.p.bat,C=currents(B,D),I=C.main||0,L=[];
 if(B.type==='rocket'){return`<p class="note">Raketada bortda batareya yo'q. Uchirish pulti uchun: 12 V qo'rg'oshin-kislotali yoki 3S LiPo, kalit va o'chirgich bilan.</p>`}
 if(B.type==='lab')return`<p class="note">USB (5 V, 500 mA) yetadi. Servo ko'p bo'lsa — alohida 5 V / 2 A manba va GND larni umumlashtiring.</p>`;
 if(B.type==='free'){const b=(B.p.free.items||[]).find(o=>o.kind==='battery');return b?`<p class="note">Tanlangan batareya bilan o'rtacha tok ${fmt(D.I,2)} A, cho'qqi ${fmt(D.Ipk||D.I,1)} A. ${D.imax&&(D.Ipk||0)>D.imax?'<b style="color:var(--warn)">Batareya cho\'qqi tokni bermaydi</b> — kattaroq LiPo oling.':'Batareya yetarli.'}</p>`:`<p class="note">Loyihaga batareya qo'shing.</p>`}
 if(!p)return'';
 const mah=+p.mah||0,cap=mah/1000,needC=cap?I*1.3/cap:0,hasC=p.c!=null,chem=p.chem||p.kind||'';
 L.push(['Hozirgi',`${p.cells?p.cells+'S ':''}${mah} mAh${hasC?' '+p.c+'C':''}${chem?' · '+String(chem).toUpperCase():''}`]);
 L.push(['Cho\'qqi tok',`${fmt(I,1)} A${C.why?' ('+C.why+')':''}`]);
 if(hasC){const giv=cap*p.c;L.push(['Batareya beradi',`${fmt(giv)} A ${giv>=I*1.1?IC('ok'):IC('warn')}`]);L.push(['Kerakli C reyting',`≥ ${fmt(Math.ceil(needC/5)*5)}C (${mah} mAh uchun)`])}
 if(D.V)L.push(['Kuchlanish',`${fmt(D.V,1)} V (yuk ostida)`]);
 const tips=chem==='liion'?"Li-ion: yengil va uzoq ishlaydi, lekin katta tok bermaydi (≈10–20 A). Agressiv parvoz/haydash uchun LiPo afzal.":chem==='nimh'?"NiMH: xavfsiz, arzon, og'ir. Ishlash kuchlanishi 1,2 V/element.":"LiPo: 3,0 V dan pastga tushirmang, 1C da balans zaryadlovchi bilan zaryadlang, saqlash kuchlanishi 3,8 V/element, olovga chidamli sumkada saqlang.";
 return`<div class="info" style="border:0">${L.map(([a,b])=>`<span>${esc(a)}</span><b>${b}</b>`).join('')}</div><p class="note" style="margin-top:6px">${esc(tips)}</p>`}
function html(){if(!TYPES[B.type])return'';const D=TYPES[B.type].derive(B),R=rows(B,D);
 return`<div class="card"><h3>${IC('plug')} Qaysi sim va ulagich kerak</h3><table style="margin:4px 0 8px"><tr><th>Ulanish</th><th class="n">Tok</th><th>Sim</th><th>Ulagich</th></tr>${R.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</table>
 <p class="note">Silikon izolyatsiyali sim — egiluvchan va kavsharlashda erimaydi. AWG raqami qancha kichik bo'lsa, sim shuncha yo'g'on. Qizil — plus, qora — minus.</p></div>
 <div class="card"><h3>${IC('battery')} Batareya tanlash</h3>${battery(B,D)}</div>`}
return{html,rows,currents}})();window.GUIDE=GUIDE;
