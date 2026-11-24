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
const T={id:'plane',name:'Qanotli samolyot',ic:'plane',desc:"Radio boshqariladigan samolyot: trener, planer, tezyurar.",defPreset:'trainer',defPurpose:'trainer',
 purposes:{trainer:{t:'Boshlovchi (trener)',twr:[.5,.9],note:'Sekin va barqaror uchish'},sport:{t:'Sport / akrobatika',twr:[.8,1.4],note:"Kuchli dvigatel, o'rtacha qanot yuklamasi"},glider:{t:'Motorli planer',twr:[.35,.7],note:'Uzun qanot, past yuklama, uzoq parvoz'},fpv:{t:'FPV / uzoq masofa',twr:[.5,.9],note:'Samaradorlik va barqarorlik'}},
 colors:{fuse:'#eceff2',wing:'#eceff2',tail:'#eceff2',accent:'#b8402f',motor:'#30343a',prop:'#1e1e1e',canopy:'#1b2a3a',bat:'#2e7d32'},
 paint:[['fuse','Fuzelyaj'],['wing','Qanot'],['tail','Dum'],['accent','Boshqaruv yuzalari'],['canopy','Kabina'],['motor','Motor'],['prop','Parrak'],['bat','Batareya']],
 spec:{
  fuse:{t:'Fuzelyaj',ic:'plane',g:'fuse',f:[{k:'len',l:'Uzunligi',min:40,max:200,step:1,u:'sm'},{k:'w',l:'Kengligi',min:4,max:20,step:.5,u:'sm'},{k:'mount',l:'Motor joyi',type:'sel',o:{tractor:'Oldinda (tortuvchi)',pusher:'Orqada (itaruvchi)'}},{k:'mat',l:'Material',type:'sel',o:{foam:'Ko\'pik (EPO/EPP)',balsa:'Balza yog\'och',carbon:'Kompozit/karbon'},g:'material'}]},
  wing:{t:'Qanot',ic:'wing',g:'wing',f:[{k:'span',l:'Qanot uzunligi',min:40,max:300,step:1,u:'sm',g:'span'},{k:'chord',l:'Vatar (kenglik)',min:8,max:45,step:.5,u:'sm',g:'chord'},
   {k:'foil',l:'Profil',type:'sel',o:{clarky:'Clark-Y (barqaror)',semi:'Yarim simmetrik (sport)',sym:'Simmetrik (akrobatika)',flat:'Yassi plastina (oddiy)'},g:'airfoil'},{k:'dih',l:'Dihedral',min:0,max:12,step:.5,u:'°',g:'dihedral'},{k:'pos',l:"Qanot joyi (burundan)",min:15,max:45,step:1,u:'%'}]},
  tail:{t:'Dum',ic:'tail',g:'tail',f:[{k:'type',l:'Turi',type:'sel',o:{conv:'Oddiy (T + vertikal)',vtail:'V-dum'}},{k:'area',l:'Gorizontal stab maydoni',min:10,max:40,step:1,u:'% qanot',g:'tail'}]},
  motor:{t:'Motor',ic:'motor',g:'motor',f:[{k:'d',l:'Stator diametri',min:10,max:60,step:1,u:'mm',g:'stator'},{k:'h',l:'Stator balandligi',min:4,max:30,step:.5,u:'mm',g:'stator'},{k:'kv',l:'KV',min:300,max:4000,step:10,u:'KV',g:'kv'}]},
  prop:{t:'Parrak',ic:'prop',g:'prop',f:[{k:'d',l:'Diametr',min:4,max:18,step:.5,u:'"',g:'propd'},{k:'p',l:'Qadam',min:2,max:12,step:.5,u:'"',g:'pitch'},{k:'b',l:'Parraklar soni',type:'sel',o:{2:'2 ta',3:'3 ta'},g:'blades'}]},
  esc:{t:'ESC',ic:'bolt',g:'esc',f:[{k:'a',l:'Tok',min:6,max:120,step:1,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{3:'3S gacha',4:'4S gacha',6:'6S gacha'}},{k:'bec',l:'BEC kuchlanishi',type:'sel',o:{5:'5 V',6:'6 V'},g:'bec'}]},
  servo:{t:'Servolar',ic:'servo',g:'servo',f:[{k:'tq',l:'Moment',min:1,max:25,step:.5,u:'kg·sm',g:'servo'}]},
  rx:{t:'Qabul qilgich',ic:'antenna',g:'rx',f:[{k:'ch',l:'Kanallar',type:'sel',o:{6:'6 kanal',8:'8 kanal'},g:'channel'}]},
  bat:{t:'Batareya',ic:'battery',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',lihv:'LiHV',liion:'Li-ion',life:'LiFePO4'},g:'chem'},{k:'cells',l:'Yacheykalar',min:1,max:6,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:300,max:8000,step:50,u:'mAh',g:'mah'},{k:'c',l:'C reyting',min:5,max:100,step:5,u:'C',g:'crating'},{k:'pos',l:"Joyi (burundan)",min:2,max:100,step:.5,u:'sm',g:'cg'}]}},
 presets:{
  trainer:{name:'Boshlovchi trener 120 sm',desc:'Yuqori qanot, sekin va barqaror',purpose:'trainer',p:{fuse:{len:90,w:8,mount:'tractor',mat:'foam'},wing:{span:120,chord:20,foil:'clarky',dih:4,pos:25},tail:{type:'conv',area:22},motor:{d:28,h:12,kv:1100},prop:{d:9,p:5,b:2},esc:{a:30,cells:4,bec:5},servo:{tq:2.5},rx:{ch:6},bat:{chem:'lipo',cells:3,mah:2200,c:30,pos:25}}},
  glider:{name:'Motorli planer 200 sm',desc:'Termiklarda uzoq uchadi',purpose:'glider',p:{fuse:{len:115,w:6,mount:'tractor',mat:'foam'},wing:{span:200,chord:17,foil:'clarky',dih:6,pos:24},tail:{type:'vtail',area:16},motor:{d:28,h:10,kv:1000},prop:{d:10,p:6,b:2},esc:{a:30,cells:4,bec:5},servo:{tq:3},rx:{ch:6},bat:{chem:'lipo',cells:3,mah:2200,c:30,pos:24.5}}},
  sport:{name:'Sport akrobat 100 sm',desc:'Simmetrik profil, kuchli motor',purpose:'sport',p:{fuse:{len:95,w:9,mount:'tractor',mat:'balsa'},wing:{span:100,chord:24,foil:'sym',dih:0,pos:27},tail:{type:'conv',area:26},motor:{d:35,h:12,kv:900},prop:{d:11,p:5.5,b:2},esc:{a:50,cells:4,bec:6},servo:{tq:4},rx:{ch:8},bat:{chem:'lipo',cells:4,mah:2200,c:45,pos:39}}}},
 steps:[
  {id:'airframe',t:'Fuzelyaj, qanot, dum',ic:'plane',cats:['fuse','wing','tail'],slots:()=>['fuse','wing','tail'],intro:"Avval tana, so'ng qanot va dum. Qanot maydoni — sekin uchish tezligining asosi; dum — barqarorlik."},
  {id:'power',t:'Motor va ESC',ic:'motor',cats:['motor','esc'],slots:()=>['mot1','esc'],intro:"Samolyot motoriga katta parrak va past KV — samarali tortish. ESC ichidagi BEC qabul qilgich va servolarni ta'minlaydi."},
  {id:'servos',t:'Servolar',ic:'servo',cats:['servo'],slots:B=>B.p.tail.type==='vtail'?['svA1','svA2','svV1','svV2']:['svA1','svA2','svE','svR'],intro:"Har bir boshqaruv yuzasiga bitta servo: 2 ta eleron, balandlik ruli va yo'nalish ruli (yoki V-dumda 2 ta)."},
  {id:'radio',t:'Qabul qilgich',ic:'antenna',cats:['rx'],slots:()=>['rx'],intro:"Qabul qilgich pult buyruqlarini servolar va ESC ga yetkazadi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"Servo ulagichlarini to'g'ri kanallarga ulang. Standart: CH1 eleron, CH2 balandlik, CH3 gaz (ESC), CH4 yo'nalish."},
  {id:'battery',t:"Batareya va og'irlik markazi",ic:'battery',cats:['bat'],slots:()=>['bat'],intro:"Batareyani shunday joylashtiringki, og'irlik markazi (CG) qanot vatarining 25–33% ida bo'lsin. Yashil chiziqlarga qarang."},
  {id:'prop',t:'Parrak',ic:'prop',cats:['prop'],slots:()=>['prop1'],intro:"Parrak motor yo'nalishiga qarab o'rnatiladi; raqamlar yozilgan tomoni oldinga qaraydi."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Sinov parvozi',ic:'rocket'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{wing:'fuse',tail:'fuse',mot1:'fuse',esc:'mot1',svA1:'wing',svA2:'wing',svE:'tail',svR:'tail',svV1:'tail',svV2:'tail',rx:'fuse',bat:'esc',prop1:'mot1'},
 labels:{fuse:'fuse',wing:'wing',tail:'tail',mot1:'motor',prop1:'prop',esc:'esc',rx:'rx',bat:'battery',svA1:'aileron',svA2:'aileron',svE:'elevator',svR:'rudder',svV1:'servo',svV2:'servo'}};

T.derive=B=>{const p=B.p,fu=p.fuse,w=p.wing,m=p.motor,pr=p.prop,ba=p.bat;
 const S=w.span*w.chord,Sdm=S/100,Sm=S/1e4,AR=w.span/w.chord,St=S*p.tail.area/100;
 const wWing=S*AREAL[fu.mat]*(1+w.span/600),wFuse=fu.len*fu.w*.12*(fu.mat==='carbon'?1.3:1),wTail=St*AREAL[fu.mat]*.8+(p.tail.type==='conv'?St*.25*AREAL[fu.mat]:0);
 const wMot=.0097*m.d*m.d*m.h+4,Pm=.3*m.d*m.d*m.h,wProp=.06*pr.d*pr.d*pr.b*.6+2;
 const cmax=Math.min(ba.c,CMAX[ba.chem]),Vn=ba.cells*NOM[ba.chem],V=Vn*.93,wBat=ba.cells*ba.mah*DENS[ba.chem]+ba.cells*2+6;
 const wEsc=6+p.esc.a*.45,nS=4,wServo=4+p.servo.tq*2.6,wRx=p.rx.ch==8?9:6,wMisc=5+8+4+3+30+6+fu.len*.1;
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
 const Pc=Math.max(mkg*9.81/LD*Vc/.35,Pf(rpm*.5)/.82),Ic=Pc/V+.6,capAh=ba.mah/1000,tCruise=capAh*.8/Ic*60,tFull=capAh*.8/Itot*60;
 const lt=(tailX-4)-(LE+w.chord*.25),Vh=St*lt/(S*w.chord);
 const servoNeed=.25*Math.pow(w.chord/10,2)*(w.span/100)*Math.pow(Math.max(Vmax,10)/15,2)+.4;
 const table=[10,20,30,40,50,60,70,80,90,100].map(t=>{const r=rpm*t/100,th=Tf(r),pw=Pf(r)/.82;return{t,thrust:th,watt:pw,amp:pw/V+.8,eff:pw>0?th/pw:0}});
 return{S,Sdm,AR,St,LE,AUW,CG,cgPct,batShift,items,wBat,wMot,wProp,wEsc,wServo,wWing,wFuse,wTail,Pm,overload,rpm,Tst,Imot,Itot,TWR,Vs,WL,pitchSpd,Vmax,Vc,LD,tCruise,tFull,Vh,servoNeed,V,Vn,cmax,batMaxA:capAh*cmax,table,
  parts:items.map(i=>[i[0],i[1]])}};

T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW)+' g'},{l:'Qanot yuklamasi',v:fmt(D.WL,1)+' g/dm²',lvl:D.WL>80?'bad':D.WL>50?'warn':'ok'},{l:'Sekin uchish',v:fmt(D.Vs*3.6)+' km/soat',lvl:D.Vs>16?'warn':'ok'},
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
 if(D.Vmax<D.Vs*1.8)add('warn',"Tezlik zaxirasi kam",`Maks. tezlik (${fmt(D.Vmax*3.6)} km/soat) sekin uchish tezligiga yaqin. Qadami kattaroq parrak oling.`);
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
 const z0=-fu.len/2,zAt=x=>z0+x,fh=fu.w*1.15,baseY=fh/2+6,acc=mPaint(c.accent,B.fin),white=mPlastic('#f5f5f5',.45);
 // fuzelyaj, kabina, 3 mm po'lat simli shassi va ko'pik g'ildiraklar
 {const g=new THREE.Group();
  // fuzelyaj: burundan dumgacha silliq kesimlar (burun yumaloq, eng keng joyi qanot oldida, dum tomon ingichkalashadi)
  g.add(loft([[0,.25,.28,0],[.015,.6,.62,0],[.05,.88,.9,0],[.13,1,1,0],[.34,1,1,0],[.52,.78,.74,.07],[.72,.46,.46,.15],[.9,.28,.3,.19],[1,.16,.2,.2]].map(([t,ww,hh,yo])=>[zAt(t*fu.len),fu.w*ww,fh*hh,baseY+yo*fh]),shell(c.fuse),2.7));
  // kabina: shaffof qopqoq, fuzelyaj ustida qanot oldida
  const LEc=fu.len*w.pos/100,cz=t=>zAt(LEc-fu.len*.17+t*fu.len*.19);
  g.add(loft([[cz(0),fu.w*.3,fh*.06,baseY+fh*.47],[cz(.25),fu.w*.74,fh*.5,baseY+fh*.52],[cz(.65),fu.w*.8,fh*.56,baseY+fh*.52],[cz(1),fu.w*.6,fh*.1,baseY+fh*.48]],MAT('canopy'+c.canopy,()=>new THREE.MeshPhysicalMaterial({color:c.canopy,roughness:.04,metalness:.2,clearcoat:1,transparent:true,opacity:.62,depthWrite:false})),2.2));
  const gz=zAt(fu.len*w.pos/100-2),gy=baseY-fh/2;
  for(const s of[-1,1]){g.add(wireMesh([[s*fu.w*.3,gy,gz],[s*fu.w*.9,gy-2.5,gz-.5],[s*fu.w*1.5,2.75,gz-.8]],'#b0b6bf',.15));const wh=mkWheel(55,18,'slick','#e0e0e0','#2b2b2b');wh.position.set(s*(fu.w*1.5+.9),2.75,gz-.8);g.add(wh)}
  g.add(wireMesh([[0,gy+fh*.3,zAt(fu.len-6)],[0,baseY-fh/2-1.2,zAt(fu.len-4)]],'#b0b6bf',.08));const tw=mkWheel(25,8,'slick','#e0e0e0','#2b2b2b');tw.position.set(0,1.25+.2,zAt(fu.len-3.6));g.add(tw);
  ctx.add('fuse',g,[0,0,0])}
 const LEz=zAt(D.LE),wy=baseY+fh/2+.3,thick=w.chord*({clarky:.12,semi:.12,sym:.12,flat:.035}[w.foil]);
 // qanot: haqiqiy profil (NACA qalinlik taqsimoti) bilan, eleronlar, boshqaruv shoxchalari va sharnirlar
 {const g=new THREE.Group(),half=w.span/2;const shp=foilShape(w.chord,thick,w.foil),geo=GEO(`wing${w.chord},${thick},${half},${w.foil}`,()=>new THREE.ExtrudeGeometry(shp,{depth:half,bevelEnabled:false,curveSegments:16}));
  for(const s of[-1,1]){const h=new THREE.Group();h.position.set(0,wy,LEz);h.rotation.z=s*w.dih*DEG;const mg=new THREE.Group();if(s>0)mg.scale.x=-1;const m=mesh(geo,shell(c.wing));m.rotation.y=-Math.PI/2;mg.add(m);h.add(mg);
   h.add(box(half*.42,Math.max(.12,thick*.16),w.chord*.2,acc,s*half*.72,thick*.08,w.chord*.9));h.add(box(half*.42,.03,.06,mPlastic('#2a2a2a',.6),s*half*.72,thick*.14,w.chord*.8));
   for(const k of[.55,.72,.89])h.add(box(.8,.05,.6,white,s*half*k,thick*.3,w.chord*.78));
   h.add(box(.08,.9,.7,white,s*half*.62,thick*.5,w.chord*.83));g.add(h)}
  ctx.add('wing',g,[0,10,0])}
 // dum: stabilizator, kil, balandlik va yo'nalish rullari, shoxchalar
 const St=D.St,cT=Math.sqrt(St/3.2),sT=St/cT,ty=baseY+fh*.15,tz=zAt(fu.len-cT*.6);
 {const g=new THREE.Group();
  // stabilizator va kil — simmetrik profilli (9%) yuzalar; harakatlanuvchi qismlari (rul) boshqa rangda
  if(p.tail.type==='conv'){const hs=foilSurface(sT,cT*.72,shell(c.tail));hs.position.set(0,ty,tz-cT*.14);g.add(hs);g.add(box(sT*.92,.14,cT*.28,acc,0,ty,tz+cT*.37));g.add(box(.08,.9,.7,white,.8,ty-.5,tz+cT*.4));
   const fin=foilSurface(cT*1.1,cT*.75,shell(c.tail));fin.rotation.z=Math.PI/2;fin.position.set(0,ty+cT*.55,tz-cT*.12);g.add(fin);g.add(box(.14,cT*.95,cT*.26,acc,0,ty+cT*.55,tz+cT*.38));g.add(box(.9,.08,.7,white,.5,ty+cT*.3,tz+cT*.45))}
  else for(const s of[-1,1]){const v=new THREE.Group();v.position.set(0,ty,tz);v.rotation.z=s*(Math.PI/2-35*DEG);const f=foilSurface(sT*.62,cT*.74,shell(c.tail));f.rotation.z=Math.PI/2;f.position.set(0,sT*.31,-cT*.13);v.add(f);v.add(box(.14,sT*.5,cT*.26,acc,0,sT*.3,cT*.38));g.add(v)}
  ctx.add('tail',g,[0,6,8])}
 // motor: fanera firewall'ga X-mount bilan; parrak haqiqiy buralishli
 const tr=fu.mount==='tractor',mot=mkMotor(p.motor.d,p.motor.h,c.motor),mTop=mot.userData.top,my=tr?baseY:wy+mot.userData.R+1.4,mz=tr?zAt(-.2):zAt(D.LE+w.chord+2.5);
 {const g=new THREE.Group();g.position.set(0,my,mz);g.rotation.x=tr?-Math.PI/2:Math.PI/2;g.add(box(fu.w*.9,.4,fu.w*.9,mPlastic('#b08a5a',.8),0,-.25,0));for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;g.add(box(.35,.15,mot.userData.R*1.3,mMetal('#30343a'),Math.cos(a)*mot.userData.R*.55,-.02,Math.sin(a)*mot.userData.R*.55).rotateY(-a))}
  g.add(mot);if(!tr)g.add(box(.6,mot.userData.R+1.4,1.2,mPlastic('#333'),0,-.8,-mot.userData.R-.7));ctx.add('mot1',g,[0,0,tr?-6:6])}
 {const g=new THREE.Group();g.position.set(0,my,mz+(tr?-1:1)*(mTop+.2));g.rotation.x=tr?-Math.PI/2:Math.PI/2;const pr=mkProp(p.prop.d,p.prop.p,+p.prop.b,'pc',c.prop,'CCW');g.add(pr);
  const sp=new THREE.Mesh(GEO('spin',()=>new THREE.ConeGeometry(1.1,2.4,28)),mPaint(c.accent,'gloss'));sp.position.y=1.3;g.add(sp);
  const o=ctx.add('prop1',g,[0,0,tr?-10:10]);if(o&&ctx.inst('prop1'))ctx.spin(pr,1)}
 // ESC (termo-qobiqli), qabul qilgich (antenna simi bilan)
 {const g=new THREE.Group(),ez=tr?zAt(8):zAt(D.LE+w.chord-2);g.add(rbox(2.5,.9,4.5,.35,MAT('escshr',()=>new THREE.MeshPhysicalMaterial({color:'#1e40af',roughness:.35,clearcoat:.5})),0,baseY-.3,ez));
  for(const[k,col]of[[-.5,'#1c1c1c'],[0,'#1c1c1c'],[.5,'#1c1c1c']])g.add(wireMesh([[k*.5,baseY-.3,ez-2.25],[k*.4,baseY,ez-3.5]],col,.07));
  for(const[s,col]of[[.4,'#d32f2f'],[-.4,'#1b1b1b']])g.add(wireMesh([[s,baseY-.3,ez+2.25],[s,baseY-.5,ez+3.6]],col,.1));ctx.add('esc',g,[3,6,0])}
 {const g=new THREE.Group(),rz=zAt(D.LE+3);g.add(rbox(2.2,1.2,4,.25,mPlastic('#202020',.4),0,baseY-.2,rz));for(let k=0;k<+p.rx.ch;k++)g.add(box(1.6,.25,.22,mPlastic('#111',.5),0,baseY+.5,rz-1.7+k*.5));
  g.add(wireMesh([[0,baseY+.4,rz+2],[0,baseY+1.5,rz+6],[0,baseY+1.2,rz+12]],'#111',.03));ctx.add('rx',g,[-3,7,0])}
 // servolar: 9 g mikro servo, 1,2 mm tortqich (push-rod) boshqaruv shoxchasigacha
 const svs=p.tail.type==='vtail'?['svA1','svA2','svV1','svV2']:['svA1','svA2','svE','svR'],kind=p.servo.tq>6?'std':'micro';
 svs.forEach((id,k)=>{const g=new THREE.Group(),sv=mkServo(kind,'#1565c0');let pos,to;
  if(k<2){const s=k?1:-1,x=s*w.span*.3;pos=new V3(x,wy+Math.tan(w.dih*DEG)*Math.abs(x)-.2,LEz+w.chord*.55);sv.rotation.y=s>0?Math.PI:0;to=new V3(s*w.span*.31,wy+Math.tan(w.dih*DEG)*w.span*.31+.5,LEz+w.chord*.83)}
  else{pos=new V3((k%2?1:-1)*1.3,baseY-fh*.4,zAt(D.LE+w.chord*.95));sv.rotation.y=Math.PI/2;to=new V3((k%2?.5:.8),ty+(k===3?cT*.3:-.4),tz+cT*.45)}
  sv.position.copy(pos);g.add(sv);g.add(wireMesh([[pos.x,pos.y+sv.userData.S.h+.3,pos.z],[(pos.x+to.x)/2,(pos.y+to.y)/2+.3,(pos.z+to.z)/2],[to.x,to.y,to.z]],'#c0c4c9',.06));ctx.add(id,g,[0,4,0])});
 // batareya (real o'lcham)
 {const g=mkBattery(p.bat.cells,p.bat.mah,p.bat.chem,c.bat,[`${p.bat.cells}S ${p.bat.mah}mAh`,`${p.bat.c}C ${CHEM[p.bat.chem]}`,`${fmt(D.Vn,1)} V`],{awg:14,lead:3});const d=g.userData.dims;g.position.set(0,baseY-fh/2+.25,zAt(p.bat.pos));
  const k=Math.min(1,fu.w*.85/d.w,fh*.75/d.h);if(k<1)g.scale.set(k,k,1);ctx.add('bat',g,[0,9,0])}
 // og'irlik markazi ko'rsatkichi
 if(ctx.inst('wing')&&(ctx.step==='battery'||ctx.step==='check')){const cgz=zAt(D.CG),okA=zAt(D.LE+w.chord*.25),okB=zAt(D.LE+w.chord*.33);
  const band=box(w.span*.16,.05,okB-okA,mGlow('#2ecc71'),0,wy+thick+.1,(okA+okB)/2);band.material=MAT('cgband',()=>new THREE.MeshBasicMaterial({color:'#2ecc71',transparent:true,opacity:.45,depthWrite:false}));band.userData.label='cg';ctx.deco(band);
  const ok=D.cgPct>=22&&D.cgPct<=34,cone=new THREE.Mesh(new THREE.ConeGeometry(1.2,3,16),mGlow(ok?'#2ecc71':'#ff5252'));cone.rotation.x=Math.PI;cone.position.set(0,wy+thick+3.5,cgz);cone.userData.label='cg';cone.userData.dispose=true;ctx.deco(cone)}};
function foilShape(c,t,k){const s=new THREE.Shape(),N=18;const yt=x=>5*t*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x*x*x-.1036*x*x*x*x);const cam=k==='clarky'?.04:k==='semi'?.02:0;
 const yc=x=>cam*c*(x<.4?(2*.4*x-x*x)/.16:((1-.8)+2*.4*x-x*x)/.36);
 for(let i=0;i<=N;i++){const x=1-i/N;s[i?'lineTo':'moveTo'](x*c,yc(x)+yt(x)*c/c)}for(let i=1;i<=N;i++){const x=i/N;s.lineTo(x*c,yc(x)-yt(x))}
 // x vatar bo'yicha (z o'qiga aylantiriladi), y — qalinlik
 const pts=s.getPoints(),sh=new THREE.Shape(pts.map(q=>new THREE.Vector2(q.x,q.y)));return sh}

T.bom=(B,D)=>{const p=B.p,sv=4;return[
 ['fuse',`Fuzelyaj ${p.fuse.len} sm`,{foam:'EPO ko\'pik',balsa:'Balza',carbon:'Kompozit'}[p.fuse.mat],1,D.wFuse],['wing',`Qanot ${p.wing.span}×${p.wing.chord} sm`,`${{clarky:'Clark-Y',semi:'Yarim simmetrik',sym:'Simmetrik',flat:'Yassi'}[p.wing.foil]}, ${p.wing.dih}° dihedral`,1,D.wWing],
 ['tail',p.tail.type==='vtail'?'V-dum':'Oddiy dum',`Stab ${p.tail.area}% qanot`,1,D.wTail],['motor',`Motor ${p.motor.d}${p.motor.h} ${p.motor.kv}KV`,`maks ~${fmt(D.Pm)} W`,1,D.wMot],
 ['prop',`Parrak ${p.prop.d}×${p.prop.p}`,`${p.prop.b} qanotli`,1,D.wProp],['esc',`ESC ${p.esc.a}A`,`${p.esc.cells}S gacha, BEC ${p.esc.bec}V`,1,D.wEsc],
 ['servo',`Servo ${p.servo.tq} kg·sm`,'Metall tishli tavsiya',sv,D.wServo],['rx',`Qabul qilgich ${p.rx.ch} kanal`,'',1,p.rx.ch==8?9:6],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C`,CHEM[p.bat.chem],1,D.wBat],['xt60','XT60 ulagich + silikon sim 14 AWG','Batareya — ESC',1,5],
 ['rod',`Tortqich (push-rod) Ø1,2 mm po'lat sim + Z-bukilish`,'Har servoga 1 ta',4,2],['horn','Boshqaruv shoxchasi (control horn)','Neylon, vintli',4,1],
 ['hinge','Sharnirlar (CA yoki plyonka)','Eleron va rullar uchun',10,.3],['gear',`Shassi: Ø3 mm po'lat sim + 55 mm ko'pik g'ildirak ×2, dum g'ildiragi 25 mm`,'',1,30],
 ['strap','Velcro (batareya uchun) + servo uzaytirgich simlar','',1,6+p.fuse.len*.1]]};
regType(T);
})();
