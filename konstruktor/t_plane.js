/* =====================================================================
   QANOTLI SAMOLYOT (RC)
   Asosiy formulalar:
     sekin uchish tezligi  Vs = √(2·m·g / (ρ·S·CLmax))
     qanot yuklamasi       WL = m / S  (g/dm²)
     og'irlik markazi      CG = Σ(mᵢ·xᵢ)/Σmᵢ, tavsiya: vatarning 25–33 %
     dum hajmi koeff.      Vh = Sₜ·lₜ / (S·c), tavsiya 0.35–0.6
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,lihv:3.8,liion:3.6,life:3.2},DENS={lipo:.026,lihv:.025,liion:.0145,life:.034},CMAX={lipo:150,lihv:150,liion:15,life:30},CHEM={lipo:'LiPo',lihv:'LiHV',liion:'Li-ion',life:'LiFePO4'};
const CL={clarky:1.25,semi:1.1,sym:.95,flat:.85},LDF={clarky:1,semi:.95,sym:.85,flat:.75},AREAL={foam:.06,balsa:.05,carbon:.045},STR={foam:.6,balsa:.8,carbon:1};
const T={id:'plane',name:'Qanotli samolyot',ic:'✈️',desc:"Radio boshqariladigan samolyot: trener, planer, tezyurar.",defPreset:'trainer',defPurpose:'trainer',
 purposes:{trainer:{t:'Boshlovchi (trener)',twr:[.5,.9],note:'Sekin va barqaror uchish'},sport:{t:'Sport / akrobatika',twr:[.8,1.4],note:"Kuchli dvigatel, o'rtacha qanot yuklamasi"},glider:{t:'Motorli planer',twr:[.35,.7],note:'Uzun qanot, past yuklama, uzoq parvoz'},fpv:{t:'FPV / uzoq masofa',twr:[.5,.9],note:'Samaradorlik va barqarorlik'}},
 colors:{fuse:'#f5f5f5',wing:'#f5f5f5',tail:'#f5f5f5',accent:'#e53935',motor:'#333333',prop:'#202020',canopy:'#1a237e',bat:'#2e7d32'},
 paint:[['fuse','Fuzelyaj'],['wing','Qanot'],['tail','Dum'],['accent','Boshqaruv yuzalari'],['canopy','Kabina'],['motor','Motor'],['prop','Parrak'],['bat','Batareya']],
 spec:{
  fuse:{t:'Fuzelyaj',ic:'🛩️',g:'fuse',f:[{k:'len',l:'Uzunligi',min:40,max:200,step:1,u:'sm'},{k:'w',l:'Kengligi',min:4,max:20,step:.5,u:'sm'},{k:'mount',l:'Motor joyi',type:'sel',o:{tractor:'Oldinda (tortuvchi)',pusher:'Orqada (itaruvchi)'}},{k:'mat',l:'Material',type:'sel',o:{foam:'Ko\'pik (EPO/EPP)',balsa:'Balza yog\'och',carbon:'Kompozit/karbon'},g:'material'}]},
  wing:{t:'Qanot',ic:'🪽',g:'wing',f:[{k:'span',l:'Qanot uzunligi',min:40,max:300,step:1,u:'sm',g:'span'},{k:'chord',l:'Vatar (kenglik)',min:8,max:45,step:.5,u:'sm',g:'chord'},
   {k:'foil',l:'Profil',type:'sel',o:{clarky:'Clark-Y (barqaror)',semi:'Yarim simmetrik (sport)',sym:'Simmetrik (akrobatika)',flat:'Yassi plastina (oddiy)'},g:'airfoil'},{k:'dih',l:'Dihedral',min:0,max:12,step:.5,u:'°',g:'dihedral'},{k:'pos',l:"Qanot joyi (burundan)",min:15,max:45,step:1,u:'%'}]},
  tail:{t:'Dum',ic:'🔺',g:'tail',f:[{k:'type',l:'Turi',type:'sel',o:{conv:'Oddiy (T + vertikal)',vtail:'V-dum'}},{k:'area',l:'Gorizontal stab maydoni',min:10,max:40,step:1,u:'% qanot',g:'tail'}]},
  motor:{t:'Motor',ic:'⚙️',g:'motor',f:[{k:'d',l:'Stator diametri',min:10,max:60,step:1,u:'mm',g:'stator'},{k:'h',l:'Stator balandligi',min:4,max:30,step:.5,u:'mm',g:'stator'},{k:'kv',l:'KV',min:300,max:4000,step:10,u:'KV',g:'kv'}]},
  prop:{t:'Parrak',ic:'🌀',g:'prop',f:[{k:'d',l:'Diametr',min:4,max:18,step:.5,u:'"',g:'propd'},{k:'p',l:'Qadam',min:2,max:12,step:.5,u:'"',g:'pitch'},{k:'b',l:'Parraklar soni',type:'sel',o:{2:'2 ta',3:'3 ta'},g:'blades'}]},
  esc:{t:'ESC',ic:'⚡',g:'esc',f:[{k:'a',l:'Tok',min:6,max:120,step:1,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{3:'3S gacha',4:'4S gacha',6:'6S gacha'}},{k:'bec',l:'BEC kuchlanishi',type:'sel',o:{5:'5 V',6:'6 V'},g:'bec'}]},
  servo:{t:'Servolar',ic:'🦾',g:'servo',f:[{k:'tq',l:'Moment',min:1,max:25,step:.5,u:'kg·sm',g:'servo'}]},
  rx:{t:'Qabul qilgich',ic:'📡',g:'rx',f:[{k:'ch',l:'Kanallar',type:'sel',o:{6:'6 kanal',8:'8 kanal'},g:'channel'}]},
  bat:{t:'Batareya',ic:'🔋',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',lihv:'LiHV',liion:'Li-ion',life:'LiFePO4'},g:'chem'},{k:'cells',l:'Yacheykalar',min:1,max:6,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:300,max:8000,step:50,u:'mAh',g:'mah'},{k:'c',l:'C reyting',min:5,max:100,step:5,u:'C',g:'crating'},{k:'pos',l:"Joyi (burundan)",min:2,max:100,step:.5,u:'sm',g:'cg'}]}},
 presets:{
  trainer:{name:'Boshlovchi trener 120 sm',desc:'Yuqori qanot, sekin va barqaror',p:{fuse:{len:90,w:8,mount:'tractor',mat:'foam'},wing:{span:120,chord:20,foil:'clarky',dih:4,pos:25},tail:{type:'conv',area:22},motor:{d:28,h:12,kv:1100},prop:{d:9,p:5,b:2},esc:{a:30,cells:4,bec:5},servo:{tq:1.8},rx:{ch:6},bat:{chem:'lipo',cells:3,mah:2200,c:30,pos:14}}},
  glider:{name:'Motorli planer 200 sm',desc:'Termiklarda uzoq uchadi',p:{fuse:{len:115,w:6,mount:'tractor',mat:'foam'},wing:{span:200,chord:17,foil:'clarky',dih:6,pos:24},tail:{type:'vtail',area:16},motor:{d:28,h:10,kv:1000},prop:{d:10,p:6,b:2},esc:{a:30,cells:4,bec:5},servo:{tq:2},rx:{ch:6},bat:{chem:'lipo',cells:3,mah:2200,c:30,pos:12}}},
  sport:{name:'Sport akrobat 100 sm',desc:'Simmetrik profil, kuchli motor',p:{fuse:{len:95,w:9,mount:'tractor',mat:'balsa'},wing:{span:100,chord:24,foil:'sym',dih:0,pos:27},tail:{type:'conv',area:26},motor:{d:35,h:12,kv:900},prop:{d:11,p:5.5,b:2},esc:{a:50,cells:4,bec:6},servo:{tq:4},rx:{ch:8},bat:{chem:'lipo',cells:4,mah:2200,c:45,pos:13}}}},
 steps:[
  {id:'airframe',t:'Fuzelyaj, qanot, dum',ic:'🛩️',cats:['fuse','wing','tail'],slots:()=>['fuse','wing','tail'],intro:"Avval tana, so'ng qanot va dum. Qanot maydoni — sekin uchish tezligining asosi; dum — barqarorlik."},
  {id:'power',t:'Motor va ESC',ic:'⚙️',cats:['motor','esc'],slots:()=>['mot1','esc'],intro:"Samolyot motoriga katta parrak va past KV — samarali tortish. ESC ichidagi BEC qabul qilgich va servolarni ta'minlaydi."},
  {id:'servos',t:'Servolar',ic:'🦾',cats:['servo'],slots:B=>B.p.tail.type==='vtail'?['svA1','svA2','svV1','svV2']:['svA1','svA2','svE','svR'],intro:"Har bir boshqaruv yuzasiga bitta servo: 2 ta eleron, balandlik ruli va yo'nalish ruli (yoki V-dumda 2 ta)."},
  {id:'radio',t:'Qabul qilgich',ic:'📡',cats:['rx'],slots:()=>['rx'],intro:"Qabul qilgich pult buyruqlarini servolar va ESC ga yetkazadi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'🔌',intro:"Servo ulagichlarini to'g'ri kanallarga ulang. Standart: CH1 eleron, CH2 balandlik, CH3 gaz (ESC), CH4 yo'nalish."},
  {id:'battery',t:"Batareya va og'irlik markazi",ic:'🔋',cats:['bat'],slots:()=>['bat'],intro:"Batareyani shunday joylashtiringki, og'irlik markazi (CG) qanot vatarining 25–33% ida bo'lsin. Yashil chiziqlarga qarang."},
  {id:'prop',t:'Parrak',ic:'🌀',cats:['prop'],slots:()=>['prop1'],intro:"Parrak motor yo'nalishiga qarab o'rnatiladi; raqamlar yozilgan tomoni oldinga qaraydi."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'🎨'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'📊'},{id:'test',kind:'test',t:'Sinov parvozi',ic:'🚀'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'🧾'}],
 req:{wing:'fuse',tail:'fuse',mot1:'fuse',esc:'mot1',svA1:'wing',svA2:'wing',svE:'tail',svR:'tail',svV1:'tail',svV2:'tail',rx:'fuse',bat:'esc',prop1:'mot1'},
 labels:{fuse:'fuse',wing:'wing',tail:'tail',mot1:'motor',prop1:'prop',esc:'esc',rx:'rx',bat:'battery',svA1:'aileron',svA2:'aileron',svE:'elevator',svR:'rudder',svV1:'servo',svV2:'servo'}};

T.derive=B=>{const p=B.p,fu=p.fuse,w=p.wing,m=p.motor,pr=p.prop,ba=p.bat;
 const S=w.span*w.chord,Sdm=S/100,Sm=S/1e4,AR=w.span/w.chord,St=S*p.tail.area/100;
 const wWing=S*AREAL[fu.mat]*(1+w.span/600),wFuse=fu.len*fu.w*.12*(fu.mat==='carbon'?1.3:1),wTail=St*AREAL[fu.mat]*.8+(p.tail.type==='conv'?St*.25*AREAL[fu.mat]:0);
 const wMot=.0097*m.d*m.d*m.h+4,Pm=.3*m.d*m.d*m.h,wProp=.06*pr.d*pr.d*pr.b*.6+2;
 const cmax=Math.min(ba.c,CMAX[ba.chem]),Vn=ba.cells*NOM[ba.chem],V=Vn*.93,wBat=ba.cells*ba.mah*DENS[ba.chem]+ba.cells*2+6;
 const wEsc=6+p.esc.a*.45,nS=4,wServo=4+p.servo.tq*2.6,wRx=p.rx.ch==8?9:6,wMisc=12+fu.len*.15;
 const items=[];const pos=(name,mass,x)=>items.push([name,mass,x]);
 const LE=fu.len*w.pos/100,tailX=fu.len-6;
 const motX=fu.mount==='tractor'?2:LE+w.chord+4;
 pos('Fuzelyaj',wFuse,fu.len*.42);pos('Qanot',wWing,LE+w.chord*.42);pos('Dum',wTail,tailX);pos('Motor',wMot,motX);pos('Parrak',wProp,fu.mount==='tractor'?0:motX+2);
 pos('ESC',wEsc,fu.mount==='tractor'?8:LE+w.chord);pos('Servolar (eleron)',wServo*2,LE+w.chord*.5);pos('Servolar (dum)',wServo*2,fu.mount==='tractor'?LE+w.chord*.9:LE*.6);
 pos('Qabul qilgich',wRx,LE+2);pos('Batareya',wBat,ba.pos);pos("Simlar, vintlar",wMisc,fu.len*.4);
 const AUW=items.reduce((s,i)=>s+i[1],0),CG=items.reduce((s,i)=>s+i[1]*i[2],0)/AUW,cgPct=(CG-LE)/w.chord*100;
 const batShift=(29-cgPct)*w.chord/100*AUW/wBat;
 const rho=airDensity(B.env.alt,B.env.temp),rf=rho/RHO0;
 const Tf=r=>.006*Math.pow(r/1000,2)*Math.pow(pr.d,3.5)*Math.sqrt(pr.p/pr.d)*(pr.b==3?1.1:1)*rf*.95,Pf=r=>4.6e-5*Math.pow(r/1000,3)*Math.pow(pr.d,4)*(pr.p/pr.d)*(pr.b==3?1.12:1)*rf;
 const rpmMax=m.kv*V*.85;let overload=Pf(rpmMax)/Pm,rpm=rpmMax;if(overload>1)rpm=rpmMax*Math.pow(1/overload,1/3);
 const Tst=Tf(rpm),Pw=Pf(rpm)/.82,Imot=Pw/V,Itot=Imot+.8,TWR=Tst/AUW;
 const mkg=AUW/1000,Vs=Math.sqrt(2*mkg*9.81/(rho*Sm*CL[w.foil])),WL=AUW/Sdm;
 const pitchSpd=rpm*pr.p*.0254/60,Vmax=pitchSpd*.8,LD=clamp(3+AR*.9,5,16)*LDF[w.foil],Vc=Math.min(Math.max(Vs*1.5,Vs+3),Vmax*.85||Vs*1.5);
 const Pc=mkg*9.81/LD*Vc/.5,Ic=Pc/V+.6,capAh=ba.mah/1000,tCruise=capAh*.8/Ic*60,tFull=capAh*.8/Itot*60;
 const lt=(tailX-4)-(LE+w.chord*.25),Vh=St*lt/(S*w.chord);
 const servoNeed=.25*Math.pow(w.chord/10,2)*(w.span/100)*Math.pow(Math.max(Vmax,10)/15,2)+.4;
 const table=[10,20,30,40,50,60,70,80,90,100].map(t=>{const r=rpm*t/100,th=Tf(r),pw=Pf(r)/.82;return{t,thrust:th,watt:pw,amp:pw/V+.8,eff:pw>0?th/pw:0}});
 return{S,Sdm,AR,St,LE,AUW,CG,cgPct,batShift,items,wBat,wMot,wProp,wEsc,wServo,wWing,wFuse,wTail,Pm,overload,rpm,Tst,Imot,Itot,TWR,Vs,WL,pitchSpd,Vmax,Vc,LD,tCruise,tFull,Vh,servoNeed,V,Vn,cmax,batMaxA:capAh*cmax,table,
  parts:items.map(i=>[i[0],i[1]]),batDims:[clamp(Math.sqrt(wBat/2.05*1000/clamp(55+ba.mah/40,50,160))/10*1.2,2,9),clamp(Math.sqrt(wBat/2.05*1000/clamp(55+ba.mah/40,50,160))/10*.8,1.5,7),clamp(55+ba.mah/40,50,160)/10]}};

T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW)+' g'},{l:'Qanot yuklamasi',v:fmt(D.WL,1)+' g/dm²',lvl:D.WL>80?'bad':D.WL>50?'warn':'ok'},{l:'Sekin uchish',v:fmt(D.Vs*3.6)+' km/s',lvl:D.Vs>16?'warn':'ok'},
 {l:"Tortish/og'irlik",v:fmt(D.TWR,2),lvl:D.TWR<.3?'bad':D.TWR<.5?'warn':'ok'},{l:"Og'irlik markazi",v:fmt(D.cgPct)+' %',lvl:D.cgPct>36||D.cgPct<15?'bad':D.cgPct>33||D.cgPct<22?'warn':'ok'},{l:'Parvoz vaqti',v:fmt(D.tCruise,1)+' daq'}];

T.issues=(B,D)=>{const p=B.p,L=[],add=(lvl,t,why)=>L.push({lvl,t,why});
 if(D.cgPct>36)add('bad',`Og'irlik markazi juda orqada (${fmt(D.cgPct)}%)`,`Samolyot boshqarib bo'lmaydigan darajada beqaror. Batareyani ~${fmt(Math.abs(D.batShift),1)} sm ${D.batShift<0?'oldinga':'orqaga'} suring.`);
 else if(D.cgPct>33)add('warn',`CG orqaroq (${fmt(D.cgPct)}%)`,`Sezgir va beqaror. Batareyani ~${fmt(Math.abs(D.batShift),1)} sm oldinga suring.`);
 else if(D.cgPct<15)add('bad',`Burun juda og'ir (CG ${fmt(D.cgPct)}%)`,`Balandlik ruli yetmaydi, qo'nish qiyin. Batareyani ~${fmt(Math.abs(D.batShift),1)} sm orqaga suring.`);
 else if(D.cgPct<22)add('warn',`Burun og'irroq (CG ${fmt(D.cgPct)}%)`,'Barqaror, lekin sekin uchish tezligi oshadi.');
 else add('ok',`Og'irlik markazi to'g'ri (${fmt(D.cgPct)}%)`,'Tavsiya oralig\'i: 25–33%.');
 if(D.TWR<.3)add('bad',`Tortish juda kam (${fmt(D.TWR,2)})`,"Samolyot ko'tarila olmaydi. Kamida 0.5:1 kerak (qo'ldan uchirish uchun).");else if(D.TWR<.5)add('warn',`Tortish kam (${fmt(D.TWR,2)})`,"Qo'ldan uchirish qiyin bo'ladi.");
 if(D.WL>80)add('bad',`Qanot yuklamasi juda yuqori (${fmt(D.WL)} g/dm²)`,"Juda tez uchish kerak; qo'ldan uchirib bo'lmaydi. Qanotni kattalashtiring yoki yengillashtiring.");else if(D.WL>50)add('warn',`Qanot yuklamasi yuqori (${fmt(D.WL)} g/dm²)`,'Boshlovchilar uchun 20–40 g/dm² qulay.');
 if(D.Vh<.3)add('warn',`Dum kichik (Vh = ${fmt(D.Vh,2)})`,"Pitch bo'yicha beqarorlik. Dum maydonini yoki fuzelyaj uzunligini oshiring (tavsiya 0.35–0.6).");
 if(D.AR<4)add('warn',`Qanot nisbati past (AR ${fmt(D.AR,1)})`,'Kalta va keng qanot samarasiz; uzunroq qanot parvoz vaqtini oshiradi.');
 if(p.servo.tq<D.servoNeed)add('bad',`Servo kuchsiz (${p.servo.tq} < ${fmt(D.servoNeed,1)} kg·sm)`,"Yuqori tezlikda yuzalar havo bosimiga dosh berolmaydi (flatter xavfi).");
 if(D.overload>1.4)add('bad',`Motor ${fmt(D.overload*100)}% yuklanadi — kuyadi`,'Parrakni kichraytiring yoki KV ni pasaytiring.');else if(D.overload>1.1)add('warn',`Motor ${fmt(D.overload*100)}% yuklanadi`,"To'liq gazni qisqa ishlating.");
 if(D.Imot>p.esc.a*1.1)add('bad',`ESC toki yetmaydi (${fmt(D.Imot)} / ${p.esc.a} A)`,'Kamida 20% zaxira kerak.');else if(D.Imot>p.esc.a*.9)add('warn',`ESC chegarada (${fmt(D.Imot)} / ${p.esc.a} A)`,'');
 if(p.bat.cells>+p.esc.cells)add('bad',`Batareya ${p.bat.cells}S, ESC ${p.esc.cells}S gacha`,'ESC kuyadi.');
 if(D.Itot>D.batMaxA)add('warn',`Batareya toki yetmaydi (${fmt(D.batMaxA)} / ${fmt(D.Itot)} A)`,'Yuqori C reyting tanlang.');
 if(D.Vmax<D.Vs*1.8)add('warn',"Tezlik zaxirasi kam",`Maks. tezlik (${fmt(D.Vmax*3.6)} km/s) sekin uchish tezligiga yaqin. Qadami kattaroq parrak oling.`);
 const pu=T.purposes[B.purpose];if(pu&&D.TWR<pu.twr[0])add('warn',`${pu.t} uchun tortish kam`,pu.note);
 add('info','Motor yo\'nalishini sinovda tekshiring',"3 ta motor simidan istalgan ikkitasini almashtirish aylanish yo'nalishini teskari qiladi.");
 return L};

T.wiring=B=>{const p=B.p,v=p.tail.type==='vtail',chs=+p.rx.ch,boards=[],comps=[];
 boards.push({id:'esc',label:`ESC ${p.esc.a}A`,x:260,y:230,w:200,h:170,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:310,y:400,l:'+'},{id:'VBAT-',t:'gnd',x:380,y:400,l:'−'},{id:'A',t:'motor',x:290,y:230,l:'A'},{id:'B',t:'motor',x:360,y:230,l:'B'},{id:'C',t:'motor',x:430,y:230,l:'C'}]});
 boards.push({id:'rx',label:`Qabul qilgich (${chs} kanal)`,x:600,y:200,w:200,h:240,need:'rx',pads:Array.from({length:chs},(_,i)=>({id:'CH'+(i+1),t:'ch',x:600,y:225+i*(200/(chs-1||1)),l:'CH'+(i+1)}))});
 comps.push({id:'mot1',label:'Motor',x:360,y:90,need:'mot1',wires:[{id:'ma',l:'a',col:'#c58a3a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mb',l:'b',col:'#b0702a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mc',l:'c',col:'#d39a4a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3}]});
 comps.push({id:'xt60',label:'Batareya kabeli',x:340,y:590,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]});
 comps.push({id:'escsig',label:'ESC signal (BEC)',x:500,y:500,need:'esc',wires:[{id:'escsig',l:'gaz',col:'#ff9800',kind:'servo',ok:['CH3'],w:3}]});
 const sv=v?[['svA1','Chap eleron',['CH1','CH5','CH6'],'ail'],['svA2',"O'ng eleron",['CH1','CH5','CH6'],'ail'],['svV1','V-dum chap',['CH2','CH4'],'vt'],['svV2',"V-dum o'ng",['CH2','CH4'],'vt']]
  :[['svA1','Chap eleron',['CH1','CH5','CH6'],null],['svA2',"O'ng eleron",['CH1','CH5','CH6'],null],['svE','Balandlik ruli',['CH2'],null],['svR',"Yo'nalish ruli",['CH4'],null]];
 sv.forEach(([id,l,ok,grp],k)=>comps.push({id,label:l+' servosi',x:930,y:110+k*130,need:id,wires:[{id:'w'+id,l:'servo',col:'#ff9800',kind:'servo',ok,grp:grp==='vt'?'vt':undefined,w:3}]}));
 return{boards,comps,hint:"Standart AETR tartibi: CH1 eleron, CH2 balandlik, CH3 gaz (ESC), CH4 yo'nalish. Ikkala eleron bitta CH1 ga Y-kabel bilan yoki CH1 va CH5/CH6 ga ulanadi. V-dum servolari CH2 va CH4 ga ulanib, pultda V-dum aralashmasi yoqiladi. ESC signal kabeli qabul qilgichni ham quvvatlaydi (BEC)."}};
// motor simlari tartibi aylanish yo'nalishini belgilaydi
T.wextra=(B)=>{const w=B.wires,ord=[w.ma,w.mb,w.mc];if(ord.some(x=>!x)||new Set(ord).size<3)return{};const idx=ord.map(x=>'ABC'.indexOf(x));let inv=0;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(idx[i]>idx[j])inv++;return{motorReversed:inv%2===1}};

T.build=(B,D,ctx)=>{const p=B.p,fu=p.fuse,w=p.wing,c=B.col,X=!!window.XRAY;
 const shell=(col)=>X?MAT('xr'+col,()=>new THREE.MeshPhysicalMaterial({color:col,transparent:true,opacity:.22,roughness:.3,depthWrite:false})):mMat(fu.mat==='carbon'?'paint':fu.mat==='balsa'?'wood':'paint',col,fu.mat==='foam'?'matte':B.fin);
 const z0=-fu.len/2,zAt=x=>z0+x,fh=fu.w*1.15,baseY=fh/2+6;
 {const g=new THREE.Group();const front=fu.len*.62;g.add(rbox(fu.w,fh,front,fu.w*.35,shell(c.fuse),0,baseY-fh/2,zAt(front/2)));
  const boom=cyl(fu.w*.22,fu.w*.38,fu.len-front,shell(c.fuse),0,baseY+fh*.15,zAt(front+(fu.len-front)/2),16);boom.rotation.x=Math.PI/2;g.add(boom);
  const nose=sph(fu.w*.55,shell(c.fuse),0,baseY,zAt(1.5));nose.scale.set(1,1.05,.8);g.add(nose);
  const can=sph(fu.w*.48,mPaint(c.canopy,'gloss'),0,baseY+fh/2,zAt(fu.len*w.pos/100-fu.w*.6));can.scale.set(.9,.55,2.4);g.add(can);
  for(const s of[-1,1]){const l=cyl(.25,.25,8,mMetal('#c0c4c9'),s*fu.w*.9,3.8,zAt(fu.len*w.pos/100-2),8);l.rotation.z=s*.5;g.add(l);const wh=cyl(2,2,1,mRubber(),s*fu.w*1.6+s*.5,1.8,zAt(fu.len*w.pos/100-2),20);wh.rotation.z=Math.PI/2;g.add(wh)}
  const tw=cyl(1,1,.6,mRubber(),0,baseY-fh/2-.9,zAt(fu.len-3),14);tw.rotation.z=Math.PI/2;g.add(tw);ctx.add('fuse',g,[0,0,0])}
 const LEz=zAt(D.LE),wy=baseY+fh/2+.3;
 {const g=new THREE.Group(),half=w.span/2,thick=w.chord*({clarky:.12,semi:.12,sym:.12,flat:.035}[w.foil]);
  const shp=foilShape(w.chord,thick,w.foil),geo=GEO(`wing${w.chord},${thick},${half},${w.foil}`,()=>{const ge=new THREE.ExtrudeGeometry(shp,{depth:half,bevelEnabled:false,curveSegments:16});return ge});
  for(const s of[-1,1]){const h=new THREE.Group();h.position.set(0,wy,LEz);h.rotation.z=s*w.dih*DEG;const m=mesh(geo,shell(c.wing));m.rotation.y=s>0?Math.PI/2:-Math.PI/2;if(s<0){m.scale.z=1}h.add(m);
   const ail=box(half*.42,thick*.35,w.chord*.22,mPaint(c.accent,B.fin),s*half*.72,thick*.15,w.chord*.89);h.add(ail);g.add(h)}
  ctx.add('wing',g,[0,10,0])}
 {const g=new THREE.Group(),St=D.St,cT=Math.sqrt(St/3.2),sT=St/cT,ty=baseY+fh*.15,tz=zAt(fu.len-cT*.6);
  if(p.tail.type==='conv'){g.add(rbox(sT,.5,cT,cT*.2,shell(c.tail),0,ty,tz));g.add(box(sT*.9,.45,cT*.3,mPaint(c.accent,B.fin),0,ty,tz+cT*.55));
   const fin=rbox(.5,cT*1.1,cT,cT*.15,shell(c.tail),0,ty+cT*.55,tz);fin.rotation.z=0;g.add(fin);g.add(box(.45,cT*.9,cT*.3,mPaint(c.accent,B.fin),0,ty+cT*.55,tz+cT*.6))}
  else for(const s of[-1,1]){const v=new THREE.Group();v.position.set(0,ty,tz);v.rotation.z=s*(Math.PI/2-35*DEG);const pl=rbox(.5,sT*.62,cT,cT*.15,shell(c.tail),0,sT*.31,0);v.add(pl);v.add(box(.45,sT*.5,cT*.3,mPaint(c.accent,B.fin),0,sT*.3,cT*.55));g.add(v)}
  ctx.add('tail',g,[0,6,8])}
 const tr=fu.mount==='tractor',mR=(p.motor.d/2+3)/10,mH=(p.motor.h+6)/10,mz=tr?zAt(-mH/2-.6):zAt(D.LE+w.chord+3),my=tr?baseY:wy+mR+1.2;
 {const g=new THREE.Group();g.position.set(0,my,mz);const b=cyl(mR,mR,mH,mPaint(c.motor,'metal'),0,0,0,32);b.rotation.x=Math.PI/2;g.add(b);const s=cyl(.2,.2,1.4,mMetal('#ccc'),0,0,tr?-mH/2-.6:mH/2+.6,10);s.rotation.x=Math.PI/2;g.add(s);
  if(!tr){g.add(box(.6,mR+1.2,1.2,mPlastic('#333'),0,-mR-.4,0))}ctx.add('mot1',g,[0,0,tr?-6:6])}
 {const g=new THREE.Group();g.position.set(0,my,mz+(tr?-mH/2-1.2:mH/2+1.2));const pm=mPlastic(c.prop,.4),R=p.prop.d*1.27;g.add(cyl(.7,.7,.8,pm).rotateX(Math.PI/2));
  const sp=new THREE.Mesh(new THREE.ConeGeometry(.9,2.2,20),mPaint(c.accent,'gloss'));sp.rotation.x=tr?-Math.PI/2:Math.PI/2;sp.position.z=tr?-1.2:1.2;g.add(sp);
  for(let k=0;k<+p.prop.b;k++){const h=new THREE.Group();h.rotation.z=k/p.prop.b*Math.PI*2;const bl=new THREE.Mesh(bladeGeoP(R),pm);bl.castShadow=true;bl.rotation.y=.25;h.add(bl);g.add(h)}
  const o=ctx.add('prop1',g,[0,0,tr?-10:10]);if(o&&ctx.inst('prop1')){o.userData.spinZ=true;ctx.spin(o,1)}}
 ctx.add('esc',rbox(2.2,1,4.5,.3,mPlastic('#1e3a8a',.4),0,baseY-.2,tr?zAt(9):zAt(D.LE+w.chord-1)),[3,6,0]);
 ctx.add('rx',rbox(2,.8,3,.3,mPlastic('#222',.4),0,baseY-.2,zAt(D.LE+3)),[-3,7,0]);
 const svs=p.tail.type==='vtail'?['svA1','svA2','svV1','svV2']:['svA1','svA2','svE','svR'];
 svs.forEach((id,k)=>{const sv=new THREE.Group();let x,y,z;if(k<2){x=(k?1:-1)*w.span*.3;y=wy+Math.tan(w.dih*DEG)*w.span*.3+.6;z=LEz+w.chord*.6}else{x=(k%2?1:-1)*1.2;y=baseY-.2;z=zAt(D.LE+w.chord*.95)}
  sv.add(rbox(1.2,1.1,2.2,.15,mPlastic('#1565c0',.35),x,y,z));sv.add(cyl(.12,.12,.6,mMetal('#eee'),x,y+.75,z-.5,8));ctx.add(id,sv,[0,4,0])});
 const[bw,bh,bl]=D.batDims;{const g=new THREE.Group(),wm=new THREE.MeshStandardMaterial({map:wrapTex(c.bat,[`${p.bat.cells}S ${p.bat.mah}`,`${p.bat.c}C ${CHEM[p.bat.chem]}`,'']),roughness:.4});
  g.add(rbox(Math.min(bw,fu.w*.8),Math.min(bh,fh*.7),bl,.3,wm,0,baseY-fh*.3,zAt(p.bat.pos)));ctx.add('bat',g,[0,9,0])}
 // og'irlik markazi ko'rsatkichi
 if(ctx.inst('wing')){const cgz=zAt(D.CG),okA=zAt(D.LE+w.chord*.25),okB=zAt(D.LE+w.chord*.33);
  const band=box(w.span*.16,.05,okB-okA,mGlow('#2ecc71'),0,wy+w.chord*.13,(okA+okB)/2);band.material=MAT('cgband',()=>new THREE.MeshBasicMaterial({color:'#2ecc71',transparent:true,opacity:.45,depthWrite:false}));band.userData.label='cg';ctx.deco(band);
  const ok=D.cgPct>=22&&D.cgPct<=34,cone=new THREE.Mesh(new THREE.ConeGeometry(1.2,3,16),mGlow(ok?'#2ecc71':'#ff5252'));cone.rotation.x=Math.PI;cone.position.set(0,wy+w.chord*.13+3.5,cgz);cone.userData.label='cg';cone.userData.dispose=true;ctx.deco(cone)}};
function foilShape(c,t,k){const s=new THREE.Shape(),N=18;const yt=x=>5*t*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x*x*x-.1036*x*x*x*x);const cam=k==='clarky'?.04:k==='semi'?.02:0;
 const yc=x=>cam*c*(x<.4?(2*.4*x-x*x)/.16:((1-.8)+2*.4*x-x*x)/.36);
 for(let i=0;i<=N;i++){const x=1-i/N;s[i?'lineTo':'moveTo'](x*c,yc(x)+yt(x)*c/c)}for(let i=1;i<=N;i++){const x=i/N;s.lineTo(x*c,yc(x)-yt(x))}
 // x vatar bo'yicha (z o'qiga aylantiriladi), y — qalinlik
 const pts=s.getPoints(),sh=new THREE.Shape(pts.map(q=>new THREE.Vector2(q.x,q.y)));return sh}
function bladeGeoP(R){return GEO('pblade'+R.toFixed(2),()=>{const s=new THREE.Shape(),w=Math.max(.8,R*.16);s.moveTo(.6,-w*.3);s.bezierCurveTo(R*.4,-w*.7,R*.8,-w*.5,R,-w*.1);s.quadraticCurveTo(R*1.01,w*.2,R*.9,w*.25);s.bezierCurveTo(R*.5,w*.5,R*.3,w*.5,.6,w*.3);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false,curveSegments:10});return g})}

T.bom=(B,D)=>{const p=B.p,sv=4;return[
 ['fuse',`Fuzelyaj ${p.fuse.len} sm`,{foam:'EPO ko\'pik',balsa:'Balza',carbon:'Kompozit'}[p.fuse.mat],1,D.wFuse],['wing',`Qanot ${p.wing.span}×${p.wing.chord} sm`,`${{clarky:'Clark-Y',semi:'Yarim simmetrik',sym:'Simmetrik',flat:'Yassi'}[p.wing.foil]}, ${p.wing.dih}° dihedral`,1,D.wWing],
 ['tail',p.tail.type==='vtail'?'V-dum':'Oddiy dum',`Stab ${p.tail.area}% qanot`,1,D.wTail],['motor',`Motor ${p.motor.d}${p.motor.h} ${p.motor.kv}KV`,`maks ~${fmt(D.Pm)} W`,1,D.wMot],
 ['prop',`Parrak ${p.prop.d}×${p.prop.p}`,`${p.prop.b} qanotli`,1,D.wProp],['esc',`ESC ${p.esc.a}A`,`${p.esc.cells}S gacha, BEC ${p.esc.bec}V`,1,D.wEsc],
 ['servo',`Servo ${p.servo.tq} kg·sm`,'Metall tishli tavsiya',sv,D.wServo],['rx',`Qabul qilgich ${p.rx.ch} kanal`,'',1,p.rx.ch==8?9:6],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C`,CHEM[p.bat.chem],1,D.wBat],['xt60',"Simlar, ulagichlar, tortqichlar (push-rod)",'',1,12+p.fuse.len*.15]]};
regType(T);
})();
