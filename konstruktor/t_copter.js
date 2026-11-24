/* =====================================================================
   MULTIKOPTER (4 / 6 / 8 motorli dron)
   Fizik model (taxminiy, ±15–25%):
     tortish  T = 0.006·(rpm/1000)²·D^3.5·√(P/D)·kB·(ρ/ρ0)   [g, D va P dyuymda]
     quvvat   W = 4.6e-5·(rpm/1000)³·D⁴·(P/D)·kP·(ρ/ρ0)
     yuklangan rpm ≈ KV·V·0.82; motor maks quvvati ≈ 0.3·d²·h (stator, mm)
   Koeffitsientlar ommabop 3"/5"/7" sinov natijalariga moslangan.
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,lihv:3.8,liion:3.6,life:3.2},FULL={lipo:4.2,lihv:4.35,liion:4.2,life:3.6},DENS={lipo:.026,lihv:.025,liion:.0145,life:.034},CMAX={lipo:150,lihv:150,liion:15,life:30};
const CHEM={lipo:'LiPo',lihv:'LiHV',liion:'Li-ion',life:'LiFePO4'};
const KB={2:.82,3:1,4:1.12},KP={2:.8,3:1,4:1.15};
const DIRN=['Old','Old-o\'ng',"O'ng",'Orqa-o\'ng','Orqa',"Orqa-chap",'Chap','Old-chap'];
const angName=a=>DIRN[Math.round(((a%360)+360)%360/45)%8];

function motorLayout(f){const n=+f.arms,R=f.wb/2,L=[];
 if(n===4){let P;
  if(f.shape==='H')P={2:[f.wb*.3,-f.wb*.4],1:[f.wb*.3,f.wb*.4],3:[-f.wb*.3,f.wb*.4],4:[-f.wb*.3,-f.wb*.4]};
  else if(f.shape==='DC')P={2:[R*.88,-R*.47],1:[R*.6,R*.8],3:[-R*.6,R*.8],4:[-R*.88,-R*.47]};
  else{const s=R*Math.SQRT1_2;P={1:[s,s],2:[s,-s],3:[-s,s],4:[-s,-s]}}
  // Betaflight Quad X tartibi: M1 orqa-o'ng, M2 old-o'ng, M3 orqa-chap, M4 old-chap ("props in": 1,4 — CW; 2,3 — CCW)
  const dir={1:'CW',2:'CCW',3:'CCW',4:'CW'};
  for(let i=1;i<=4;i++){const[x,z]=P[i],a=Math.atan2(x,-z)/DEG;L.push({i,x,z,a,name:angName(a),dir:dir[i]})}}
 else{const off=n===6?30:22.5;
  // 6/8 motor: old-o'ngdan soat yo'nalishida raqamlanadi, aylanish yo'nalishi navbatma-navbat.
  for(let k=0;k<n;k++){const a=off+k*360/n;L.push({i:k+1,x:Math.sin(a*DEG)*R,z:-Math.cos(a*DEG)*R,a,name:angName(a),dir:k%2?'CCW':'CW'})}}
 return L}

const T={id:'copter',name:'Multikopter (dron)',ic:'🚁',desc:"4, 6 yoki 8 motorli dron: FPV, kino, uzoq masofa, yuk tashish.",
 defPreset:'free5',defPurpose:'freestyle',
 purposes:{freestyle:{t:'Freestyle',twr:[6,14],note:"Akrobatika: kuchli zaxira va tez javob kerak"},racing:{t:'Poyga',twr:[9,20],note:'Maksimal tezlanish, yengil va kuchli'},
  cinematic:{t:'Kino / silliq suratga olish',twr:[3,7],note:"Silliq parvoz; og'irroq kamera ko'tariladi"},longrange:{t:'Uzoq masofa',twr:[2.5,6],note:'Samaradorlik va parvoz vaqti muhim'},
  cargo:{t:'Yuk tashish',twr:[2,4],note:"TWR 2:1 dan past bo'lsa boshqaruv qiyinlashadi"}},
 colors:{frame:'#e8eaee',stand:'#d32f2f',motor:'#d32f2f',prop:'#ff9800',cam:'#1d1d1f',bat:'#1565c0',ant:'#ffd600',led:'#00e5ff'},
 paint:[['frame','Ramka (lak rangi)'],['stand','Stoykalar'],['motor','Motor qo\'ng\'irog\'i'],['prop','Parraklar'],['cam','Kamera'],['bat','Batareya o\'rami'],['ant','Antennalar'],['led','LED chiroq']],
 spec:{
  frame:{t:'Ramka',ic:'🔲',g:'frame',f:[
   {k:'arms',l:'Motorlar soni',type:'sel',o:{4:'4 — kvadrokopter',6:'6 — geksakopter',8:'8 — oktokopter'},g:'arms'},
   {k:'shape',l:'Shakl (4 motorli)',type:'sel',o:{X:'X — simmetrik',H:'H — keng korpus',DC:'Deadcat — kamera oldi ochiq'},g:'shape'},
   {k:'wb',l:'Motorlar orasi (diagonal)',min:90,max:900,step:5,u:'mm',g:'wb'},
   {k:'aw',l:"Qo'l kengligi",min:6,max:30,step:1,u:'mm'},
   {k:'at',l:"Qo'l qalinligi",min:2,max:8,step:.5,u:'mm',g:'arm'},
   {k:'bl',l:'Korpus uzunligi',min:50,max:220,step:2,u:'mm'},
   {k:'bw',l:'Korpus kengligi',min:28,max:140,step:1,u:'mm'},
   {k:'sh',l:'Plastinalar orasidagi balandlik',min:16,max:50,step:1,u:'mm',g:'standoff'},
   {k:'mat',l:'Material',type:'sel',o:{carbon:'Karbon tola',alu:'Alyuminiy',plastic:'Plastik (3D bosma)'},g:'material'},
   {k:'stack',l:"Stek o'rni (teshiklar oralig'i)",type:'sel',o:{'20':'20×20 mm','30.5':'30.5×30.5 mm'},g:'stack'}]},
  motor:{t:'Motorlar',ic:'⚙️',g:'motor',f:[
   {k:'d',l:'Stator diametri',min:8,max:60,step:1,u:'mm',g:'stator'},{k:'h',l:'Stator balandligi',min:3,max:20,step:.5,u:'mm',g:'stator'},
   {k:'kv',l:'KV — 1 voltga aylanish/daqiqa',min:100,max:8000,step:50,u:'KV',g:'kv'}]},
  prop:{t:'Parraklar',ic:'🌀',g:'prop',f:[
   {k:'d',l:'Diametr',min:2,max:24,step:.1,u:'"',g:'propd'},{k:'p',l:'Qadam (pitch)',min:1.5,max:12,step:.1,u:'"',g:'pitch'},
   {k:'b',l:'Parraklar soni',type:'sel',o:{2:'2 ta',3:'3 ta',4:'4 ta'},g:'blades'},{k:'mat',l:'Material',type:'sel',o:{pc:'Polikarbonat (egiluvchan)',cf:'Karbon (qattiq, yengil)'}}]},
  esc:{t:'ESC (tezlik regulyatori)',ic:'⚡',g:'esc',f:[
   {k:'a',l:'Doimiy tok (har motor)',min:6,max:120,step:1,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{4:'4S gacha',6:'6S gacha',8:'8S gacha',12:'12S gacha'}},
   {k:'size',l:"O'lcham",type:'sel',o:{'20':'20×20','30.5':'30.5×30.5'},g:'stack'},{k:'proto',l:'Protokol',type:'sel',o:{dshot600:'DShot600 (raqamli)',dshot300:'DShot300',pwm:'PWM (eski, analog)'},g:'dshot'}]},
  fc:{t:'Parvoz kontrolleri',ic:'🧠',g:'fc',f:[
   {k:'mcu',l:'Protsessor',type:'sel',o:{F4:'F4 — 4 UART',F7:'F7 — 6 UART',H7:'H7 — 8 UART'},g:'mcu'},{k:'size',l:"O'lcham",type:'sel',o:{'20':'20×20','30.5':'30.5×30.5'},g:'stack'},
   {k:'baro',l:'Barometr (balandlikni ushlash)',type:'bool',g:'baro'},{k:'bb',l:'Blackbox xotira',type:'bool',g:'blackbox'}]},
  vid:{t:'Video tizimi',ic:'📷',g:'vtx',f:[
   {k:'type',l:'Turi',type:'sel',o:{analog:'Analog — kam kechikish, arzon',digital:'Raqamli HD — tiniq tasvir',none:"Yo'q (faqat ko'z bilan boshqarish)"},g:'vtx'},
   {k:'tilt',l:'Kamera burchagi',min:0,max:60,step:1,u:'°',g:'tilt'},{k:'fov',l:"Ko'rish burchagi (FOV)",min:90,max:170,step:5,u:'°'},{k:'mw',l:'Uzatish quvvati',min:25,max:1000,step:25,u:'mW',g:'mw'}]},
  rx:{t:'Radio qabul qilgich',ic:'📡',g:'rx',f:[{k:'band',l:'Chastota',type:'sel',o:{'2.4':'2.4 GHz — tez, kichik antenna','915':"915 MHz — uzoq, to'siqdan o'tadi"},g:'band'}]},
  extra:{t:"Qo'shimcha",ic:'➕',f:[{k:'gps',l:'GPS (uyga qaytish, joylashuv)',type:'bool',g:'gps'},{k:'led',l:'LED chiroqlar',type:'bool',g:'led'},{k:'buz',l:'Buzzer (yo\'qolsa topish)',type:'bool',g:'buzzer'},{k:'pay',l:"Qo'shimcha yuk (kamera, sensor)",min:0,max:5000,step:10,u:'g',g:'payload'}]},
  bat:{t:'Batareya',ic:'🔋',g:'battery',f:[
   {k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo — yuqori tok',lihv:'LiHV — yuqori kuchlanish',liion:'Li-ion — yengil, uzoq, past tok',life:'LiFePO4 — xavfsiz, og\'ir'},g:'chem'},
   {k:'cells',l:'Yacheykalar (S)',min:1,max:12,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:150,max:22000,step:50,u:'mAh',g:'mah'},{k:'c',l:'Razryad reytingi',min:5,max:150,step:5,u:'C',g:'crating'}]}},
 presets:{
  mini3:{name:'3" yengil cinewhoop-lite',desc:"Xona va yaqin masofa, 250 g dan yengil",p:{frame:{arms:4,shape:'X',wb:130,aw:9,at:3,bl:64,bw:32,sh:20,mat:'carbon',stack:'20'},motor:{d:14,h:4,kv:3800},prop:{d:3,p:1.8,b:3,mat:'pc'},
   esc:{a:30,cells:4,size:'20',proto:'dshot600'},fc:{mcu:'F4',size:'20',baro:false,bb:false},vid:{type:'analog',tilt:15,fov:150,mw:200},rx:{band:'2.4'},extra:{gps:false,led:true,buz:true,pay:0},bat:{chem:'lipo',cells:4,mah:650,c:75}}},
  free5:{name:'5" freestyle',desc:'Eng ommabop FPV o\'lcham',p:{frame:{arms:4,shape:'X',wb:225,aw:13,at:5,bl:96,bw:44,sh:30,mat:'carbon',stack:'30.5'},motor:{d:22,h:7,kv:1950},prop:{d:5.1,p:3.6,b:3,mat:'pc'},
   esc:{a:45,cells:6,size:'30.5',proto:'dshot600'},fc:{mcu:'F7',size:'30.5',baro:false,bb:true},vid:{type:'digital',tilt:30,fov:150,mw:500},rx:{band:'2.4'},extra:{gps:false,led:false,buz:true,pay:0},bat:{chem:'lipo',cells:6,mah:1100,c:120}}},
  lr7:{name:'7" uzoq masofa',desc:'Li-ion bilan 15+ daqiqa',p:{frame:{arms:4,shape:'X',wb:300,aw:15,at:5.5,bl:115,bw:48,sh:32,mat:'carbon',stack:'30.5'},motor:{d:28,h:6.5,kv:1300},prop:{d:7,p:4,b:3,mat:'pc'},
   esc:{a:45,cells:6,size:'30.5',proto:'dshot300'},fc:{mcu:'H7',size:'30.5',baro:true,bb:true},vid:{type:'digital',tilt:20,fov:140,mw:1000},rx:{band:'915'},extra:{gps:true,led:false,buz:true,pay:0},bat:{chem:'liion',cells:6,mah:4000,c:10}}},
  cine10:{name:'10" kino / yuk geksakopter',desc:"6 motor, katta kamera ko'taradi",p:{frame:{arms:6,shape:'X',wb:620,aw:22,at:6,bl:160,bw:110,sh:40,mat:'carbon',stack:'30.5'},motor:{d:35,h:12,kv:600},prop:{d:13,p:5.5,b:2,mat:'cf'},
   esc:{a:40,cells:6,size:'30.5',proto:'dshot300'},fc:{mcu:'H7',size:'30.5',baro:true,bb:true},vid:{type:'digital',tilt:10,fov:120,mw:700},rx:{band:'915'},extra:{gps:true,led:true,buz:true,pay:900},bat:{chem:'lipo',cells:6,mah:8000,c:25}}}},
 steps:[
  {id:'frame',t:'Ramka',ic:'🔲',cats:['frame'],slots:B=>['frame'],intro:"Ramka — dronning skeleti. Avval o'lcham va shaklni loyihalang: motorlar orasidagi masofa qaysi parrak sig'ishini belgilaydi."},
  {id:'motors',t:'Motorlar',ic:'⚙️',cats:['motor'],slots:B=>arr(+B.p.frame.arms,i=>'mot'+i),intro:"Motorlarni qo'llarning uchiga o'rnating. Stator kattaligi — kuch, KV — tezlik. Katta parrakka past KV, kichigiga yuqori KV kerak."},
  {id:'stack',t:'Elektronika steki',ic:'🧠',cats:['esc','fc'],slots:B=>['soft','esc','fc'],intro:"Stek ikki qavat: pastda ESC (motorlarga quvvat beradi), tepada parvoz kontrolleri (dronning miyasi). Tebranishni kamaytirish uchun rezina amortizatorlarga qo'yiladi."},
  {id:'avionics',t:'Kamera va aloqa',ic:'📡',cats:['vid','rx','extra'],slots:B=>[...(B.p.vid.type!=='none'?['cam','vtx']:[]),'rx',...(B.p.extra.led?['led']:[]),...(B.p.extra.buz?['buz']:[])],intro:"Kamera — uchuvchining ko'zi, VTX — tasvirni ko'zoynakka uzatadi, qabul qilgich — pultdan buyruq oladi."},
  {id:'wiring',kind:'wiring',t:'Kavsharlash (simlar)',ic:'🔌',intro:"Har bir simni to'g'ri kontaktga ulang. Xato ulangan sim sinovda muammo chiqaradi — xuddi haqiqiy hayotdagidek."},
  {id:'power',t:'Yopish va batareya',ic:'🔋',cats:['bat'],slots:B=>['top',...(B.p.extra.gps?['gps']:[]),'strap','bat'],intro:"Yuqori plastina stekni yopadi. Batareya tasma bilan mahkamlanadi — parvozda uchib ketmasligi kerak."},
  {id:'props',kind:'props',t:'Parraklar',ic:'🌀',cats:['prop'],slots:B=>arr(+B.p.frame.arms,i=>'prop'+i),intro:"Har bir motor ma'lum yo'nalishda aylanadi. Parrak shu yo'nalishga mos (CW yoki CCW) bo'lishi shart, aks holda dron ko'tarilmay ag'dariladi."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'🎨'},
  {id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'📊'},
  {id:'test',kind:'test',t:'Sinov parvozi',ic:'🚀'},
  {id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'🧾'}],
 req:{'mot#':'frame',soft:'frame',esc:'soft',fc:'esc',cam:'frame',vtx:'fc',rx:'fc',led:'frame',buz:'fc',top:'fc',gps:'top',strap:'top',bat:'strap','prop#':'mot#'},
 propSlot:/^prop(\d+)$/,
};
const arr=(n,f)=>Array.from({length:n},(_,i)=>f(i+1));

T.derive=B=>{const p=B.p,f=p.frame,n=+f.arms,m=p.motor,pr=p.prop,ba=p.bat,e=p.esc,mot=motorLayout(f);
 const dens={carbon:1.6,alu:2.7,plastic:1.25}[f.mat],str={carbon:1,alu:.55,plastic:.18}[f.mat];
 const armL=mot.map(q=>Math.max(10,Math.hypot(q.x,q.z)-Math.min(f.bl,f.bw)*.25));
 let minAdj=1e9;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)minAdj=Math.min(minAdj,Math.hypot(mot[i].x-mot[j].x,mot[i].z-mot[j].z));
 const maxProp=(minAdj*.85-4)/25.4;
 const wFrame=armL.reduce((s,L)=>s+L*f.aw*f.at,0)/1000*dens+f.bl*f.bw*2.5/1000*dens+2*(f.bl*.35*f.sh*2)/1000*dens+4*f.sh*.06+5+(n-4)*2;
 const wTop=f.bl*.85*f.bw*.85*2/1000*dens;
 const strength=f.aw*f.at*f.at*str/(armL.reduce((a,b)=>a+b,0)/n)*(f.wb>400?f.wb/400:1)/(f.wb>400?1.6:1);
 const wMot=.0097*m.d*m.d*m.h+2,Pm=.3*m.d*m.d*m.h;
 const wProp=.0564*pr.d*pr.d*pr.b*(pr.mat==='cf'?.85:1)+.6;
 const cmax=Math.min(ba.c,CMAX[ba.chem]),Vn=ba.cells*NOM[ba.chem],V=Vn*.92;
 const wBat=ba.cells*ba.mah*DENS[ba.chem]+ba.cells*2+6;
 const wEsc=(3+e.a*.18)*n/4,wFc=f.stack==='20'?5:7.5,uarts={F4:4,F7:6,H7:8}[p.fc.mcu];
 const wVid={analog:11,digital:36,none:0}[p.vid.type]+(p.vid.mw>600?4:0),wRx=p.rx.band==='915'?2.5:1.5;
 const wExt=(p.extra.gps?10:0)+(p.extra.led?4:0)+(p.extra.buz?3:0)+4+15+(n-4)*3;
 const AUW=wFrame+wTop+n*(wMot+wProp)+wEsc+wFc+wVid+wRx+wExt+wBat+(+p.extra.pay||0);
 const rf=airDensity(B.env.alt,B.env.temp)/RHO0;
 const Tf=r=>.006*Math.pow(r/1000,2)*Math.pow(pr.d,3.5)*Math.sqrt(pr.p/pr.d)*KB[pr.b]*rf, Pf=r=>4.6e-5*Math.pow(r/1000,3)*Math.pow(pr.d,4)*(pr.p/pr.d)*KP[pr.b]*rf;
 const rpmMax=m.kv*V*.82;let overload=Pf(rpmMax)/Pm,rpm=rpmMax;if(overload>1)rpm=rpmMax*Math.pow(1/overload,1/3);
 const Tm=Tf(rpm),Pmot=Pf(rpm)/.8,Imot=Pmot/V,Itot=n*Imot+1.5;
 const TWR=n*Tm/AUW,canHover=Tm*n>AUW;
 const rpmH=canHover?rpm*Math.sqrt(AUW/n/Tm):rpm,PH=n*Pf(rpmH)/.75*1.6+5,IH=PH/V,hoverThr=rpmH/rpm;
 const capAh=ba.mah/1000;
 const tHover=canHover?capAh*.8/IH*60:0,tMix=canHover?capAh*.8/(IH*1.6)*60:0,tAgg=capAh*.8/(Itot*.55)*60;
 const tip=rpm/60*Math.PI*pr.d*.0254,vTop=rpm*pr.p*.0254/60*.75*3.6;
 const batMaxA=capAh*cmax;
 const rpmOpt=230*60/(Math.PI*pr.d*.0254),kvOpt=rpmOpt/(V*.82);
 const table=[10,20,30,40,50,60,70,80,90,100].map(t=>{const r=rpm*t/100,th=Tf(r)*n,pw=n*Pf(r)/.8;return{t,thrust:th,watt:pw,amp:pw/V+1.5,eff:pw>0?th/pw:0}});
 const parts=[['Ramka',wFrame+wTop],['Motorlar',n*wMot],['Parraklar',n*wProp],['ESC',wEsc],['Parvoz kontrolleri',wFc],['Video',wVid],['Qabul qilgich',wRx],["Simlar, vintlar, qo'shimcha",wExt],['Batareya',wBat],["Foydali yuk",+p.extra.pay||0]];
 return{n,mot,maxProp,minAdj,armL,strength,wFrame,wTop,wMot,Pm,wProp,wBat,wEsc,wFc,uarts,wVid,AUW,rf,rpmMax,rpm,overload,Tm,Pmot,Imot,Itot,TWR,canHover,hoverThr,IH,PH,
  tHover,tMix,tAgg,tip,vTop,batMaxA,cmax,V,Vn,Vfull:ba.cells*FULL[ba.chem],kvOpt,table,parts,
  payload:Math.max(0,n*Tm/2-AUW),gw:canHover?AUW/PH:0,batDims:batDims(wBat,ba)}};
function batDims(w,ba){const vol=w/2.05*1000,l=clamp(45+ba.mah/45,40,190),wd=clamp(26+ba.mah/250,24,90),h=clamp(vol/(l*wd),6,90);return[wd/10,h/10,l/10]}

T.metrics=(B,D)=>[
 {l:"Umumiy og'irlik",v:fmt(D.AUW)+' g',lvl:D.AUW<250?'ok':''},
 {l:'Tortish kuchi',v:fmt(D.Tm*D.n)+' g'},
 {l:"Tortish/og'irlik",v:fmt(D.TWR,1)+' : 1',lvl:D.TWR<1.6?'bad':D.TWR<2.5?'warn':'ok'},
 {l:'Muallaq gaz',v:D.canHover?fmt(D.hoverThr*100)+' %':'—',lvl:!D.canHover||D.hoverThr>.6?'bad':D.hoverThr>.5?'warn':'ok'},
 {l:'Parvoz vaqti',v:D.canHover?fmt(D.tMix,1)+' daq':'—'},
 {l:'Maks. tok',v:fmt(D.Itot)+' A',lvl:D.Itot>D.batMaxA?'warn':''}];

T.issues=(B,D)=>{const p=B.p,L=[],add=(lvl,t,why)=>L.push({lvl,t,why}),f=p.frame;
 if(p.prop.d>D.maxProp+.05)add('bad',`Parrak ramkaga sig'maydi (${fmt(p.prop.d,1)}" > ${fmt(D.maxProp,1)}")`,"Qo'shni parraklar bir-biriga tegib sinadi. Kichikroq parrak oling yoki motorlar orasini kattalashtiring.");
 else if(p.prop.d<D.maxProp-1.6)add('warn',`Parrak ramkaga nisbatan kichik (${fmt(p.prop.d,1)}" / ${fmt(D.maxProp,1)}" sig'adi)`,"Katta parrak samaraliroq: bir xil tortishni kamroq tok bilan beradi. Ramka imkon bersa kattaroq parrak oling.");
 if(D.strength<.9)add('bad',"Qo'llar juda zaif — birinchi zarbada sinadi","Qo'l mustahkamligi kenglik × qalinlik² ga bog'liq. Qalinlikni oshiring yoki karbon tanlang.");
 else if(D.strength<1.6)add('warn',"Qo'llar zaif — qattiq qo'nishda sinishi mumkin",`Mustahkamlik indeksi ${fmt(D.strength,1)} (tavsiya ≥ 1.6).`);
 if(p.esc.size!==f.stack)add('bad',`ESC o'lchami (${p.esc.size}) ramkadagi stek o'rniga (${f.stack}) mos emas`,"Montaj teshiklari to'g'ri kelmaydi — vintlab bo'lmaydi.");
 if(p.fc.size!==p.esc.size)add('bad',"Parvoz kontrolleri va ESC o'lchami har xil","Stek bir xil o'lchamdagi platalardan yig'iladi va 8-pinli kabel bilan ulanadi.");
 if(p.bat.cells>+p.esc.cells)add('bad',`Batareya ${p.bat.cells}S, ESC esa ${p.esc.cells}S gacha`,"ESC tranzistorlari bu kuchlanishga chidamaydi va birinchi ulashda kuyadi.");
 if(D.overload>1.4)add('bad',`Motor ${fmt(D.overload*100)}% yuklanadi — kuyadi`,"KV × kuchlanish juda yuqori yoki parrak juda katta. KV ni pasaytiring, kichikroq parrak yoki kamroq S oling.");
 else if(D.overload>1.1)add('warn',`Motor ${fmt(D.overload*100)}% yuklanadi — qiziydi`,"Uzoq to'liq gazda motor chulg'ami qizib ketadi.");
 if(D.Imot>p.esc.a*1.1)add('bad',`Motor toki ${fmt(D.Imot)} A, ESC esa ${p.esc.a} A`,"ESC tokdan kuyadi. Kamida 20% zaxirali ESC oling.");else if(D.Imot>p.esc.a*.9)add('warn',`ESC toki chegarada (${fmt(D.Imot)} / ${p.esc.a} A)`,'Zaxira 20% dan kam — issiq kunda xavfli.');
 if(D.Itot>D.batMaxA*1.6)add('bad',`Batareya ${fmt(D.batMaxA)} A beradi, kerak ${fmt(D.Itot)} A`,"Kuchlanish keskin tushadi, batareya qizib shishadi. Yuqori C yoki katta sig'imli batareya oling.");
 else if(D.Itot>D.batMaxA)add('warn',`Batareya to'liq gazda yetishmaydi (${fmt(D.batMaxA)} / ${fmt(D.Itot)} A)`,"To'liq gazda kuchlanish pasayadi (voltage sag).");
 if(p.bat.chem==='liion'&&B.purpose!=='longrange'&&B.purpose!=='cargo')add('warn','Li-ion akrobatika uchun mos emas',"Li-ion yengil va sig'imli, lekin katta tok bera olmaydi — uzoq masofa uchun yaxshi.");
 if(!D.canHover)add('bad',"Dron ko'tarila olmaydi","Tortish kuchi og'irlikdan kam. Motor/parrakni kuchaytiring yoki yengillashtiring.");
 else if(D.TWR<1.6)add('bad',`Tortish/og'irlik ${fmt(D.TWR,1)} — boshqarib bo'lmaydi`,"Manyovr uchun kamida 2:1 kerak.");
 else{const pu=T.purposes[B.purpose];if(pu&&D.TWR<pu.twr[0])add('warn',`${pu.t} uchun tortish kam (${fmt(D.TWR,1)}, tavsiya ${pu.twr[0]}–${pu.twr[1]})`,pu.note);
  if(pu&&D.TWR>pu.twr[1]*1.3)add('warn',`${pu.t} uchun juda kuchli (${fmt(D.TWR,1)})`,"Ortiqcha quvvat og'irlik va tok sarfi; boshqarish keskin bo'ladi.")}
 if(D.canHover&&D.hoverThr>.5)add('warn',`Muallaq turish gazi ${fmt(D.hoverThr*100)}%`,"Tajribali quruvchilar ≤ 50% ni tavsiya qiladi — boshqaruv uchun zaxira kerak.");
 if(D.tip>300)add('warn',`Parrak uchi tezligi ${fmt(D.tip)} m/s`,"Tovush tezligiga yaqin: shovqin kuchayadi, samaradorlik tushadi.");
 if(Math.abs(p.motor.kv-D.kvOpt)/D.kvOpt>.35)add('info',`KV maslahati: shu parrak va ${p.bat.cells}S uchun ~${fmt(D.kvOpt*.85,-2)}–${fmt(D.kvOpt*1.15,-2)} KV`,"Parrak uchi ~230 m/s bo'ladigan aylanish — samaradorlik va kuch balansi.");
 const need=(1)+(p.vid.type!=='none'?1:0)+(p.extra.gps?1:0);if(need>D.uarts)add('bad',`UART yetishmaydi (${need} kerak, ${D.uarts} bor)`,"Har bir qabul qilgich, VTX boshqaruvi va GPS alohida UART portiga ulanadi.");
 if(p.esc.proto==='pwm')add('warn','PWM protokoli eskirgan',"DShot raqamli va kalibrovka talab qilmaydi; zamonaviy FC'lar DShot ishlatadi.");
 if(p.vid.type==='analog'&&p.vid.mw>600)add('info',"Uzatgich quvvati ko'p mamlakatlarda cheklangan","Mahalliy radio qoidalarini tekshiring; kuchli VTX qiziydi.");
 if(p.extra.pay>0&&D.TWR<2.2&&D.canHover)add('warn',"Yuk bilan zaxira kam",`Yana ko'tara oladigan yuk (TWR 2:1 da): ~${fmt(D.payload)} g.`);
 if(D.AUW<250)add('ok',`${fmt(D.AUW)} g — 250 g dan yengil`,"Ko'p mamlakatlarda 250 g gacha dronlarga yengilroq qoidalar qo'llanadi (mahalliy qonunni tekshiring).");
 if(+f.arms>4)add('info',"6/8 motorli sxema tartibi",`Bu konstruktorda motorlar old-o'ngdan soat yo'nalishida raqamlangan. Betaflight/ArduPilot'da tartib boshqacha bo'lishi mumkin — sozlashda "Motors" bo'limida tekshiring.`);
 return L};

// ---------------- simlar sxemasi ----------------
T.wiring=B=>{const p=B.p,D=T.derive(B),n=D.n,boards=[],comps=[];
 const ESC={id:'esc',label:`4-in-1 ESC`.replace('4',n>4?n:4),x:230,y:220,w:220,h:200,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:300,y:420,l:'+'},{id:'VBAT-',t:'gnd',x:370,y:420,l:'−'}]};
 for(const q of D.mot){const a=q.a*DEG,dx=Math.sin(a),dz=-Math.cos(a),s=Math.min(110/Math.abs(dx||1e-6),100/Math.abs(dz||1e-6));
  ESC.pads.push({id:'M'+q.i,t:'motor',x:340+dx*s*.92,y:320+dz*s*.92,l:'M'+q.i})}
 boards.push(ESC);
 boards.push({id:'fc',label:'Parvoz kontrolleri ('+p.fc.mcu+')',x:600,y:220,w:220,h:200,need:'fc',pads:[
  {id:'ESC',t:'esc',x:600,y:320,l:'ESC'},{id:'5V',t:'5v',x:625,y:220,l:'5V'},{id:'GND',t:'gnd',x:660,y:220,l:'G'},{id:'9V',t:'9v',x:695,y:220,l:'9V'},{id:'CAM',t:'sig',x:730,y:220,l:'CAM'},{id:'VTX',t:'sig',x:765,y:220,l:'VTX'},{id:'LED',t:'sig',x:800,y:220,l:'LED'},
  ...[1,2,3].flatMap((u,k)=>[{id:'TX'+u,t:'tx',x:820,y:250+k*60,l:'T'+u},{id:'RX'+u,t:'rx',x:820,y:280+k*60,l:'R'+u}]),
  {id:'5V_2',t:'5v',x:630,y:420,l:'5V'},{id:'GND_2',t:'gnd',x:670,y:420,l:'G'},{id:'BZ-',t:'sig',x:710,y:420,l:'BZ−'},{id:'GND_3',t:'gnd',x:750,y:420,l:'G'},{id:'SDA',t:'sig',x:790,y:420,l:'SDA'}]});
 const G=['GND','GND_2','GND_3'],P5=['5V','5V_2'];
 for(const q of D.mot){const a=q.a*DEG;comps.push({id:'mot'+q.i,label:q.name+' motor',x:340+Math.sin(a)*240,y:320-Math.cos(a)*235,need:'mot'+q.i,
  wires:[{id:'m'+q.i,l:'3 sim',col:'#c58a3a',kind:'motor',ok:['M'+q.i],w:4}]})}
 comps.push({id:'xt60',label:'XT60 quvvat kabeli',x:280,y:600,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]});
 comps.push({id:'cap',label:'Kondensator 1000µF',x:420,y:600,need:'esc',opt:true,wires:[{id:'cap+',l:'+ (uzun oyoq)',col:'#9e9e9e',kind:'cap+',ok:['VBAT+']},{id:'cap-',l:'− (chiziqli)',col:'#555',kind:'cap-',ok:['VBAT-']}]});
 comps.push({id:'escfc',label:'8-pin kabel',x:520,y:520,need:'fc',wires:[{id:'escfc',l:'ESC↔FC',col:'#f5f5f5',kind:'plug',ok:['ESC'],w:3}]});
 comps.push({id:'rx',label:'Qabul qilgich',x:930,y:90,need:'rx',wires:[{id:'rx5',l:'5V',col:'#e53935',kind:'p5',ok:P5},{id:'rxg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'rxtx',l:'TX',col:'#43a047',kind:'tx',uart:'rx'},{id:'rxrx',l:'RX',col:'#fafafa',kind:'rx',uart:'rx'}]});
 if(p.vid.type==='analog'){
  comps.push({id:'cam',label:'Analog kamera',x:930,y:230,need:'cam',wires:[{id:'cam5',l:'5V',col:'#e53935',kind:'p5t',ok:P5},{id:'camg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'camv',l:'VIDEO',col:'#fdd835',kind:'sig',ok:['CAM']}]});
  comps.push({id:'vtx',label:'Analog VTX',x:930,y:380,need:'vtx',wires:[{id:'vtxp',l:'9V',col:'#e53935',kind:'p9',ok:['9V']},{id:'vtxg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'vtxv',l:'VIDEO',col:'#fdd835',kind:'sig',ok:['VTX']},{id:'vtxs',l:'SmartAudio',col:'#90caf9',kind:'sa',uart:'vtx'}]})}
 else if(p.vid.type==='digital')comps.push({id:'vtx',label:'Raqamli havo moduli',x:930,y:300,need:'vtx',wires:[{id:'dvp',l:'9V',col:'#e53935',kind:'p9',ok:['9V']},{id:'dvg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'dvtx',l:'TX',col:'#43a047',kind:'tx',uart:'vtx'},{id:'dvrx',l:'RX',col:'#fafafa',kind:'rx',uart:'vtx'}]});
 if(p.extra.gps)comps.push({id:'gps',label:'GPS moduli',x:930,y:520,need:'gps',wires:[{id:'gp5',l:'5V',col:'#e53935',kind:'p5',ok:P5},{id:'gpg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'gptx',l:'TX',col:'#43a047',kind:'tx',uart:'gps'},{id:'gprx',l:'RX',col:'#fafafa',kind:'rx',uart:'gps'}]});
 if(p.extra.led)comps.push({id:'led',label:'LED lenta',x:690,y:600,need:'led',wires:[{id:'ld5',l:'5V',col:'#e53935',kind:'p5',ok:P5},{id:'ldg',l:'GND',col:'#222',kind:'gnd',ok:G},{id:'ldd',l:'DIN',col:'#26c6da',kind:'sig',ok:['LED']}]});
 if(p.extra.buz)comps.push({id:'buz',label:'Buzzer',x:840,y:600,need:'buz',wires:[{id:'bz+',l:'+',col:'#e53935',kind:'p5',ok:P5},{id:'bz-',l:'−',col:'#222',kind:'sig',ok:['BZ-']}]});
 return{boards,comps,hint:"Motor raqamlari (Betaflight Quad X): M1 — orqa-o'ng, M2 — old-o'ng, M3 — orqa-chap, M4 — old-chap. Qurilmaning TX simi kontrollerning RX kontaktiga ulanadi (va aksincha)."}};

// ---------------- 3D model ----------------
T.build=(B,D,ctx)=>{const p=B.p,f=p.frame,c=B.col,u=v=>v/10;
 const fm=mMat(f.mat,f.mat==='carbon'?'#ffffff':c.frame,B.fin),fmCol=f.mat==='carbon'?mCarbon(c.frame):fm;
 const bt=.25,armY=u(f.at)/2,motY=u(f.at),topY=bt+u(f.sh),stk=f.stack==='20'?2.6:3.65;
 // ramka
 {const g=new THREE.Group();g.add(rbox(u(f.bw),bt,u(f.bl),.5,fmCol,0,0,0));
  D.mot.forEach((q,k)=>{const L=Math.hypot(q.x,q.z),a=Math.atan2(q.x,q.z),arm=rbox(u(f.aw),u(f.at),u(L),u(f.aw)*.45,fmCol);arm.position.set(u(q.x)/2,0,u(q.z)/2);arm.rotation.y=a;g.add(arm);
   const tip=cyl(u(f.aw)*.75,u(f.aw)*.75,u(f.at),fmCol,u(q.x),armY,u(q.z),28);g.add(tip)});
  for(const s of[-1,1])g.add(rbox(.2,u(f.sh),3.2,.3,fmCol,s*(stk/2+.9),bt,-u(f.bl)/2+2));
  for(const[x,z]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(cyl(.28,.28,u(f.sh),mMetal(c.stand,.35),x*(u(f.bw)/2-.55),bt+u(f.sh)/2,z*(u(f.bl)/2-.6),12));
  ctx.add('frame',g,[0,0,0])}
 // motorlar
 const mR=u(p.motor.d/2+3),mH=u(p.motor.h+6);
 for(const q of D.mot){const g=new THREE.Group();g.position.set(u(q.x),motY,u(q.z));
  g.add(cyl(mR*.92,mR*.92,.25,mMetal('#2a2d33',.4),0,.12,0,32));
  g.add(cyl(u(p.motor.d/2),u(p.motor.d/2),u(p.motor.h),mCopper(),0,.3+u(p.motor.h)/2,0,32));
  const bell=cyl(mR,mR*.97,mH,mPaint(c.motor,'metal'),0,.35+mH/2,0,40);g.add(bell);
  g.add(cyl(mR*.55,mR*.55,.06,mMetal('#111',.5),0,.36+mH,0,24));
  g.add(cyl(.2,.2,.9,mMetal('#d0d4da',.2),0,.4+mH+.4,0,12));g.add(cyl(.42,.42,.35,mMetal('#9aa',.3),0,.4+mH+.75,0,6));
  ctx.add('mot'+q.i,g,[0,2.5,0])}
 // parraklar
 const pR=p.prop.d*1.27,pY=motY+.4+mH+.55;
 for(const q of D.mot){const dir=B.dirs[q.i]||q.dir,g=new THREE.Group();g.position.set(u(q.x),pY,u(q.z));const pm=p.prop.mat==='cf'?mCarbon('#ffffff'):MAT('prop'+c.prop,()=>new THREE.MeshPhysicalMaterial({color:c.prop,roughness:.35,transmission:.25,thickness:.3,clearcoat:.6,transparent:true,opacity:.92}));
  g.add(cyl(.55,.55,.5,pm,0,0,0,16));
  for(let k=0;k<+p.prop.b;k++){const bl=new THREE.Mesh(bladeGeo(pR,p.prop.d,p.prop.p),pm);bl.castShadow=true;const h=new THREE.Group();h.rotation.y=k/p.prop.b*Math.PI*2;bl.rotation.x=(dir==='CW'?-1:1)*Math.atan(p.prop.p/(Math.PI*p.prop.d*.75))*.8;if(dir==='CW')bl.scale.z=-1;h.add(bl);g.add(h)}
  g.userData.dir=dir;const o=ctx.add('prop'+q.i,g,[0,7,0]);if(o&&ctx.inst('prop'+q.i))ctx.spin(g,dir==='CW'?-1:1)}
 // ESC va FC steki
 const sy=bt+.3,brd=(lab,col,y)=>{const g=new THREE.Group();g.add(rbox(stk,.16,stk,.2,mPCB(col,lab),0,y,0));return g};
 {const g=new THREE.Group();for(const[x,z]of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(cyl(.22,.22,.5,mRubber('#7b1fa2'),x*stk*.42,sy+.15,z*stk*.42,10));g.add(cyl(.12,.12,1.8,mPlastic('#222'),x*stk*.42,sy+.9,z*stk*.42,8))}ctx.add('soft',g,[0,1,0])}
 {const g=brd(`ESC ${p.esc.a}A`,'#121212',sy+.45);for(let k=0;k<D.n*2;k++){const a=k/(D.n*2)*Math.PI*2;g.add(box(.42,.14,.42,mPlastic('#0a0a0a',.4),Math.cos(a)*stk*.3,sy+.6,Math.sin(a)*stk*.3))}
  g.add(box(.9,.14,.9,mPlastic('#1a1a1a',.3),0,sy+.6,0));for(const q of D.mot){const a=q.a*DEG;g.add(box(.5,.05,.3,mGold(),Math.sin(a)*stk*.45,sy+.55,-Math.cos(a)*stk*.45))}
  ctx.add('esc',g,[0,2,0])}
 {const g=brd(`FC ${p.fc.mcu}`,'#0d2a4a',sy+1.45);g.add(box(.9,.12,.9,mPlastic('#111',.25),0,sy+1.58,0));g.add(box(.8,.3,.5,mMetal('#c0c4c9'),stk/2-.2,sy+1.65,0));g.add(sph(.08,mGlow('#2196f3'),-.8,sy+1.6,-.8));
  if(p.fc.baro)g.add(box(.35,.2,.35,mMetal('#aaa'),.8,sy+1.6,.7));ctx.add('fc',g,[0,4,0])}
 // video
 if(p.vid.type!=='none'){const cs=p.vid.type==='digital'?2.1:1.9,g=new THREE.Group();g.position.set(0,bt+u(f.sh)/2+.2,-u(f.bl)/2+1.6);g.rotation.x=p.vid.tilt*DEG;
  g.add(rbox(cs,cs,cs,.25,mPaint(c.cam,'satin'),0,-cs/2,0));g.add(cyl(.75,.85,1.1,mPlastic('#111',.3),0,0,-cs/2-.45).rotateX(Math.PI/2));
  const lens=cyl(.55,.55,.08,mGlass(),0,0,-cs/2-1.03);lens.rotation.x=Math.PI/2;g.add(lens);ctx.add('cam',g,[0,0,-5]);
  const v=new THREE.Group();
  if(p.vid.type==='digital'){v.add(rbox(3,1,3,.3,mMetal('#5a5f66',.45),0,sy+2.2,0));for(let k=-4;k<=4;k++)v.add(box(.08,.5,2.6,mMetal('#6a7078',.4),k*.32,sy+2.95,0))}
  else v.add(rbox(2,.18,2,.2,mPCB('#1b1b1b','VTX'),0,sy+2.2,u(f.bl)/2-2.2));
  for(const s of(p.vid.type==='digital'?[-1,1]:[0])){const a=cyl(.18,.18,5,mPlastic(c.ant,.5),s*1.2,topY+2.2,u(f.bl)/2+.8,10);a.rotation.x=.55;a.rotation.z=s*.3;v.add(a)}
  ctx.add('vtx',v,[0,6,0])}
 {const g=new THREE.Group();g.add(rbox(1,.15,1.4,.12,mPCB('#203020','RX'),stk/2+.8,sy+1.3,stk/2+.4));
  for(const s of[-1,1]){const a=cyl(.06,.06,p.rx.band==='915'?6:3.2,mPlastic('#111'),s*1.6,bt+1.4,u(f.bl)/2+1.6,6);a.rotation.z=s*1.1;a.rotation.x=.4;g.add(a)}ctx.add('rx',g,[2,4,3])}
 if(p.extra.led){const g=new THREE.Group();for(const q of D.mot){if(q.z<=0)continue;const L=Math.hypot(q.x,q.z),s=box(.6,.12,u(L)*.6,mGlow(c.led));s.position.set(u(q.x)*.55,-.08,u(q.z)*.55);s.rotation.y=Math.atan2(q.x,q.z);g.add(s)}ctx.add('led',g,[0,-2,0])}
 if(p.extra.buz)ctx.add('buz',cyl(.6,.6,.6,mPlastic('#111',.4),-stk/2-.8,sy+1.2,stk/2),[-2,3,2]);
 ctx.add('top',rbox(u(f.bw)*.85,.2,u(f.bl)*.85,.4,fmCol,0,topY,0),[0,9,0]);
 if(p.extra.gps){const g=new THREE.Group();g.add(cyl(.12,.12,4,mPlastic('#333'),0,topY+2,u(f.bl)*.35,8));g.add(rbox(2.4,.7,2.4,.6,mPlastic('#202020',.4),0,topY+4.2,u(f.bl)*.35));g.add(box(1.6,.05,1.6,mPlastic('#c9a227',.4),0,topY+4.58,u(f.bl)*.35));ctx.add('gps',g,[0,12,0])}
 const[bw,bh,bl]=D.batDims;
 {const g=new THREE.Group();g.add(box(1.6,.12,bl+1.5,mPlastic('#111',.8),0,topY+.18,0));g.add(box(1.6,.05,bl*.8,mPlastic('#222',.9),0,topY+.26,0));
  const s=box(1.5,.1,bw*2.2+bh*2+1,mPlastic('#202020',.7),0,topY+.15,0);s.rotation.y=Math.PI/2;g.add(s);ctx.add('strap',g,[0,10,0])}
 {const g=new THREE.Group(),wm=new THREE.MeshStandardMaterial({map:wrapTex(c.bat,[`${p.bat.cells}S ${p.bat.mah}mAh`,`${p.bat.c}C · ${CHEM[p.bat.chem]}`,`${fmt(D.Vn,1)} V nominal`]),roughness:.4,metalness:.05});
  g.add(rbox(bw,bh,bl,.3,wm,0,topY+.3+bh/2,0));g.add(box(.4,.4,2.5,mPlastic('#e53935'),.2,topY+.5,bl/2+1.2));g.add(box(.4,.4,2.5,mPlastic('#222'),-.2,topY+.5,bl/2+1.2));
  g.add(rbox(1.6,.8,1.2,.15,mPlastic('#f9a825',.4),0,topY+.6,bl/2+2.8));
  const bal=box(1.2,.2,.6,mPlastic('#f5f5f5'),0,topY+.3+bh,bl/2-.2);g.add(bal);ctx.add('bat',g,[0,14,0])}
 // ulangan simlar (3D)
 const W=B.wires;
 if(ctx.inst('esc'))for(const q of D.mot){if(!W['m'+q.i]||!ctx.inst('mot'+q.i))continue;const to=W['m'+q.i].slice(1),t=D.mot.find(o=>o.i==to)||q,a=t.a*DEG,ex=Math.sin(a)*stk*.45,ez=-Math.cos(a)*stk*.45;
  ['#c58a3a','#b0702a','#d39a4a'].forEach((col,k)=>{const o=(k-1)*.18,px=-Math.cos(Math.atan2(q.x,q.z))*o,pz=Math.sin(Math.atan2(q.x,q.z))*o;
   ctx.deco(wireMesh([[u(q.x)+px,motY+.25,u(q.z)+pz],[u(q.x)*.55+px,motY+.15,u(q.z)*.55+pz],[ex+px*.5,sy+.6,ez+pz*.5]],col,.07))})}
 if(ctx.inst('esc')&&W['bat+']){ctx.deco(wireMesh([[.2,sy+.5,stk/2-.3],[.3,sy+.3,u(f.bl)/2],[.3,bt+.2,u(f.bl)/2+3.5]],W['bat+']==='VBAT+'?'#e53935':'#e53935',.18));
  ctx.deco(wireMesh([[-.2,sy+.5,stk/2-.3],[-.3,sy+.3,u(f.bl)/2],[-.3,bt+.2,u(f.bl)/2+3.5]],'#222',.18));
  const xt=rbox(1.6,.8,1.2,.15,mPlastic('#f9a825',.4),0,bt+.4,u(f.bl)/2+4.2);xt.userData.label='xt60';ctx.deco(xt)}
 if(ctx.inst('esc')&&W['cap+']){const cp=cyl(.5,.5,2.2,mPlastic('#1c1c1c',.3),0,bt+.5,u(f.bl)/2+1.6,16);cp.rotation.z=Math.PI/2;cp.userData.label='cap';ctx.deco(cp)}
 if(ctx.inst('fc')&&W.escfc)ctx.deco(wireMesh([[stk/2-.4,sy+.6,0],[stk/2+.2,sy+1,0],[stk/2-.4,sy+1.45,0]],'#eeeeee',.12));
 // parrak yo'nalishi ko'rsatkichlari (parraklar bosqichida)
 if(ctx.step==='props')for(const q of D.mot){const want=B.rev?(q.dir==='CW'?'CCW':'CW'):q.dir,col=want==='CW'?'#42a5f5':'#ff9800';
  const ar=new THREE.Mesh(new THREE.TorusGeometry(pR*.55,.12,6,32,Math.PI*1.4),mGlow(col));ar.rotation.x=-Math.PI/2;ar.position.set(u(q.x),pY+1.4,u(q.z));if(want==='CW')ar.scale.y=-1;ar.userData.dispose=true;ctx.deco(ar);
  const tipA=(want==='CW'?-1:1)*Math.PI*1.4,cone=new THREE.Mesh(new THREE.ConeGeometry(.35,.9,10),mGlow(col));cone.position.set(u(q.x)+Math.cos(tipA)*pR*.55,pY+1.4,u(q.z)-Math.sin(tipA)*pR*.55*(want==='CW'?-1:1));
  cone.rotation.z=Math.PI/2;cone.rotation.y=(want==='CW'?1:-1)*(Math.PI*1.4)+(want==='CW'?Math.PI:0);cone.userData.dispose=true;ctx.deco(cone)}
};
function bladeGeo(R,D,P){return GEO(`blade${R.toFixed(2)},${P}`,()=>{const s=new THREE.Shape(),w=Math.max(.5,R*.24);s.moveTo(.4,-w*.25);s.bezierCurveTo(R*.3,-w*.75,R*.75,-w*.55,R,-w*.08);s.quadraticCurveTo(R*1.01,w*.15,R*.92,w*.22);s.bezierCurveTo(R*.6,w*.45,R*.3,w*.6,.4,w*.3);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1,curveSegments:10});g.rotateX(-Math.PI/2);g.translate(0,.05,0);return g})}

// yorliqlar uchun slot → lug'at kaliti
T.labels={frame:'frame',top:'plate',soft:'softmount',esc:'esc',fc:'fc',cam:'cam',vtx:'vtx',rx:'rx',led:'led',buz:'buzzer',gps:'gps',strap:'strap',bat:'battery','mot#':'motor','prop#':'prop'};

// ---------------- detallar ro'yxati (BOM) ----------------
T.bom=(B,D)=>{const p=B.p,n=D.n;return[
 ['frame',`Ramka ${p.frame.wb} mm ${{X:'X',H:'H',DC:'Deadcat'}[p.frame.shape]}, ${n} qo'l`,`${p.frame.mat==='carbon'?'Karbon':p.frame.mat==='alu'?'Alyuminiy':'Plastik'}, qo'l ${p.frame.aw}×${p.frame.at} mm`,1,D.wFrame+D.wTop],
 ['motor',`Motor ${p.motor.d}${String(p.motor.h).padStart(2,'0').replace('.','')} ${p.motor.kv}KV`,`Stator ${p.motor.d}×${p.motor.h} mm, maks ~${fmt(D.Pm)} W`,n,D.wMot],
 ['prop',`Parrak ${p.prop.d}×${p.prop.p}×${p.prop.b}`,`${p.prop.mat==='cf'?'Karbon':'Polikarbonat'}; ${n/2} CW + ${n/2} CCW`,n,D.wProp],
 ['esc',`${n>4?n+'-in-1':'4-in-1'} ESC ${p.esc.a}A ${p.esc.cells}S`,`${p.esc.size}×${p.esc.size}, ${p.esc.proto.toUpperCase()}`,1,D.wEsc],
 ['fc',`Parvoz kontrolleri ${p.fc.mcu}`,`${p.fc.size}×${p.fc.size}, ${D.uarts} UART${p.fc.baro?', barometr':''}${p.fc.bb?', blackbox':''}`,1,D.wFc],
 ...(p.vid.type!=='none'?[['vtx',p.vid.type==='digital'?'Raqamli HD kamera + havo moduli':'Analog kamera + VTX',`${p.vid.mw} mW, FOV ${p.vid.fov}°`,1,D.wVid]]:[]),
 ['rx',`Qabul qilgich ${p.rx.band} GHz`.replace('915 GHz','915 MHz'),'ExpressLRS yoki shunga o\'xshash',1,p.rx.band==='915'?2.5:1.5],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C ${CHEM[p.bat.chem]}`,`${fmt(D.Vn,1)} V nominal, ${fmt(D.Vfull,1)} V to'liq`,1,D.wBat],
 ...(p.extra.gps?[['gps','GPS moduli','M10 turidagi, kompas bilan',1,10]]:[]),...(p.extra.led?[['led','LED lenta (WS2812)','5V',1,4]]:[]),...(p.extra.buz?[['buzzer','Buzzer','5V',1,3]]:[]),
 ['cap','Kondensator 1000µF 35V (6S uchun 50V)','Kuchlanish sakrashlaridan himoya',1,4],['xt60','XT60 kabel, simlar, vintlar, tasma','14–12 AWG quvvat simi',1,15]]};

// ---------------- Betaflight namunaviy sozlamasi ----------------
T.cli=(B,W)=>{const p=B.p,L=['# Namunaviy Betaflight CLI — simlaringizga qarab yaratildi. Kiritishdan oldin tekshiring!'];const fn={};
 for(const[dev,mask]of[['rx',64],['vtx',p.vid.type==='digital'?1:2048],['gps',2]]){const u=W.uart[dev];if(u)fn[u]=(fn[u]||0)|mask}
 for(const u in fn)L.push(`serial ${u-1} ${fn[u]} 115200 57600 0 115200`);
 L.push(`set motor_pwm_protocol = ${{dshot600:'DSHOT600',dshot300:'DSHOT300',pwm:'PWM'}[p.esc.proto]}`);
 if(p.esc.proto!=='pwm')L.push('set dshot_bidir = ON','set motor_poles = 14');
 if(B.rev)L.push('set yaw_motors_reversed = ON');if(p.extra.gps)L.push('feature GPS');if(p.extra.led)L.push('feature LED_STRIP');
 if(p.vid.type==='digital')L.push('set osd_displayport_device = MSP','set displayport_msp_serial = '+(W.uart.vtx?W.uart.vtx-1:'?'));
 L.push(`set vbat_max_cell_voltage = ${Math.round(FULL[p.bat.chem]*100)}`,`set vbat_min_cell_voltage = ${p.bat.chem==='liion'?280:330}`,'save');return L.join('\n')};
regType(T);
})();
