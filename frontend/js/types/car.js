/* =====================================================================
   RC MASHINA (buggy, monster truck, crawler, shosse)
     motor rpm ≈ KV·V·0.9 ; g'ildirak rpm = motor rpm / (spur/pinion · ichki uzatma)
     kerakli quvvat P(v) = (Crr·m·g + ½·ρ·CdA·v²)·v / 0.75
     ag'darilish barqarorligi = koleya / (2 · og'irlik markazi balandligi)
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,liion:3.6},DENS={lipo:.026,liion:.0145},CMAX={lipo:150,liion:15};
const TIRE={slick:{n:'Silliq (asfalt)',road:.95,dirt:.35},pin:{n:"Mayda tishli (aralash)",road:.75,dirt:.75},terrain:{n:"Katta tishli (yo'ltanlamas)",road:.6,dirt:.9}};
const KIND={buggy:{n:'Buggy',crr:.04,stab:[1,1.3],use:.15},truck:{n:'Monster truck',crr:.045,stab:[.85,1.1],use:.18},crawler:{n:'Crawler (toshlarga chiqish)',crr:.07,stab:[.7,.9],use:.04},onroad:{n:'Shosse (asfalt)',crr:.02,stab:[1,1.3],use:.15}};
const T={id:'car',name:'RC mashina',ic:'car',desc:"Buggy, monster truck, crawler yoki shosse mashinasi.",defPreset:'buggy',defPurpose:'basher',
 purposes:{basher:{t:"Har qanday yo'lda o'ynash",note:'Chidamlilik va kuch'},race:{t:'Poyga',note:'Yengillik va tezlanish'},crawler:{t:'Toshlarga chiqish',note:"Past tezlik, katta moment, yuqori klirens"},speed:{t:'Tezlik rekordi',note:'Uzun uzatma, aerodinamika, yaxshi sovutish'}},
 colors:{body:'#9c1c1c',body2:'#e6e8ea',chassis:'#2b2f36',rim:'#d0d4da',tire:'#1a1a1a',motor:'#1565c0',spring:'#ffc107',bat:'#2e7d32'},
 paint:[['body','Kuzov asosiy rangi'],['body2','Kuzov ikkinchi rangi'],['chassis','Shassi'],['rim',"G'ildirak diski"],['tire','Shina'],['motor','Motor'],['spring','Prujinalar'],['bat','Batareya']],
 spec:{
  chassis:{t:'Shassi',ic:'chassis',g:'chassis',f:[{k:'kind',l:'Turi',type:'sel',o:Object.fromEntries(Object.entries(KIND).map(([k,v])=>[k,v.n]))},
   {k:'wb',l:"G'ildiraklar orasi (bo'yiga)",min:120,max:500,step:5,u:'mm'},{k:'track',l:'Koleya (eniga)',min:100,max:450,step:5,u:'mm'},{k:'clear',l:'Klirens (yerdan balandlik)',min:5,max:120,step:1,u:'mm'},
   {k:'drive',l:'Yuritma',type:'sel',o:{'4wd':"4×4 (to'liq)",'2wd':'2×4 (orqa)'}},{k:'body',l:'Kuzov turi',type:'sel',o:{jeep:'Jip (SUV)',pickup:'Pikap / monster truck',buggy:'Buggy (sport)',sedan:'Sedan (shosse)'},g:'body'},{k:'mat',l:'Material',type:'sel',o:{alu:'Alyuminiy',plastic:'Kompozit plastik',carbon:'Karbon'},g:'material'}]},
  motor:{t:'Motor',ic:'motor',g:'motor',f:[{k:'type',l:'Turi',type:'sel',o:{bl:"Cho'tkasiz (brushless)",br:"Cho'tkali (brushed)"},g:'brushed'},{k:'kv',l:"KV (cho'tkasiz)",min:800,max:8000,step:50,u:'KV',g:'kv'},{k:'turns',l:"O'ramlar (cho'tkali)",min:10,max:80,step:1,u:'T',g:'brushed'},
   {k:'d',l:'Korpus diametri',min:24,max:60,step:1,u:'mm'},{k:'len',l:'Korpus uzunligi',min:30,max:100,step:1,u:'mm'}]},
  gear:{t:'Uzatma',ic:'gear',g:'gear',f:[{k:'pin',l:'Pinion tishlari',min:8,max:50,step:1,u:'T',g:'gear'},{k:'spur',l:'Spur tishlari',min:30,max:120,step:1,u:'T',g:'gear'},{k:'int',l:'Ichki uzatma',min:1,max:40,step:.1,u:':1'}]},
  wheel:{t:"G'ildiraklar",ic:'wheel',g:'wheel',f:[{k:'d',l:'Diametr',min:40,max:220,step:1,u:'mm'},{k:'w',l:'Kenglik',min:15,max:100,step:1,u:'mm'},{k:'tire',l:'Shina',type:'sel',o:Object.fromEntries(Object.entries(TIRE).map(([k,v])=>[k,v.n]))}]},
  esc:{t:'ESC',ic:'bolt',g:'esc',f:[{k:'a',l:'Tok',min:10,max:250,step:5,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{2:'2S',3:'3S',4:'4S',6:'6S',8:'8S'}},{k:'bec',l:'BEC',type:'sel',o:{6:'6 V',7.4:'7.4 V'},g:'bec'}]},
  servo:{t:'Rul servosi',ic:'servo',g:'servo',f:[{k:'tq',l:'Moment',min:2,max:40,step:.5,u:'kg·sm',g:'servo'}]},
  rx:{t:'Qabul qilgich',ic:'antenna',g:'rx',f:[{k:'ch',l:'Kanallar',type:'sel',o:{3:'3 kanal',4:'4 kanal'},g:'channel'}]},
  bat:{t:'Batareya',ic:'battery',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',liion:'Li-ion'},g:'chem'},{k:'cells',l:'Yacheykalar',min:1,max:8,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:500,max:10000,step:100,u:'mAh',g:'mah'},{k:'c',l:'C reyting',min:5,max:150,step:5,u:'C',g:'crating'}]}},
 presets:{
  buggy:{name:'1/10 buggy 4×4',desc:"Har qanday yo'l, tez va chidamli",purpose:'basher',p:{chassis:{kind:'buggy',wb:280,track:250,clear:30,drive:'4wd',mat:'plastic',body:'jeep'},motor:{type:'bl',kv:3300,turns:27,d:36,len:50},gear:{pin:18,spur:46,int:2.6},wheel:{d:85,w:40,tire:'pin'},esc:{a:80,cells:3,bec:6},servo:{tq:9},rx:{ch:3},bat:{chem:'lipo',cells:2,mah:5000,c:50}}},
  monster:{name:'1/10 monster truck',desc:"Katta g'ildirak, sakrash va to'siqlar",purpose:'basher',p:{chassis:{kind:'truck',wb:330,track:300,clear:65,drive:'4wd',mat:'plastic',body:'pickup'},motor:{type:'bl',kv:2400,turns:27,d:40,len:60},gear:{pin:15,spur:52,int:2.6},wheel:{d:150,w:65,tire:'terrain'},esc:{a:100,cells:4,bec:6},servo:{tq:15},rx:{ch:3},bat:{chem:'lipo',cells:3,mah:5000,c:50}}},
  crawler:{name:'1/10 crawler',desc:'Toshlarga sekin, ishonchli chiqadi',purpose:'crawler',p:{chassis:{kind:'crawler',wb:313,track:250,clear:70,drive:'4wd',mat:'alu',body:'jeep'},motor:{type:'br',kv:1000,turns:35,d:36,len:50},gear:{pin:11,spur:56,int:9},wheel:{d:115,w:45,tire:'terrain'},esc:{a:40,cells:3,bec:7.4},servo:{tq:25},rx:{ch:4},bat:{chem:'lipo',cells:2,mah:3200,c:30}}},
  onroad:{name:'1/10 shosse (touring)',desc:'Asfaltda yuqori tezlik',purpose:'race',p:{chassis:{kind:'onroad',wb:257,track:190,clear:6,drive:'4wd',mat:'carbon',body:'sedan'},motor:{type:'bl',kv:4500,turns:27,d:36,len:50},gear:{pin:28,spur:80,int:1.9},wheel:{d:64,w:26,tire:'slick'},esc:{a:120,cells:2,bec:6},servo:{tq:10},rx:{ch:3},bat:{chem:'lipo',cells:2,mah:5000,c:100}}}},
 steps:[
  {id:'chassis',t:'Shassi va osma',ic:'chassis',cats:['chassis'],slots:()=>['chassis'],intro:"Shassi — mashinaning asosi. Koleya (eni) qanchalik keng va og'irlik markazi past bo'lsa, burilishda shunchalik kam ag'dariladi."},
  {id:'drive',t:'Motor va uzatma',ic:'motor',cats:['motor','gear'],slots:()=>['mot1','gear'],intro:"Uzatma soni (spur/pinion × ichki) — tezlik va kuch o'rtasidagi tanlov. Uzun uzatma motorni qizdiradi."},
  {id:'wheels',t:"G'ildiraklar",ic:'wheel',cats:['wheel'],slots:()=>['wheel1','wheel2','wheel3','wheel4'],intro:"Katta g'ildirak — tezroq va to'siqdan oson o'tadi, lekin motorga og'irroq yuk."},
  {id:'elec',t:'ESC, servo, qabul qilgich',ic:'bolt',cats:['esc','servo','rx'],slots:()=>['esc','servo','rx'],intro:"ESC motorni boshqaradi va BEC orqali qabul qilgich hamda servoni quvvatlaydi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"Mashina pultida: CH1 — rul (servo), CH2 — gaz (ESC). Batareya qutblariga ehtiyot bo'ling."},
  {id:'battery',t:'Batareya',ic:'battery',cats:['bat'],slots:()=>['bat'],intro:"Batareya shassining o'rtasiga, iloji boricha pastga — og'irlik markazini pasaytirish uchun."},
  {id:'paint',kind:'paint',t:'Kuzov va rang',ic:'palette',slots:()=>['body']},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Sinov haydash',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{mot1:'chassis',gear:'mot1','wheel#':'chassis',esc:'chassis',servo:'chassis',rx:'esc',bat:'esc',body:'bat'},
 labels:{chassis:'chassis',mot1:'motor',gear:'gear','wheel#':'wheel',esc:'esc',servo:'servo',rx:'rx',bat:'battery',body:'body'}};

T.derive=B=>{const p=B.p,ch=p.chassis,m=p.motor,g=p.gear,wh=p.wheel,ba=p.bat;
 const mf={alu:1.2,plastic:1,carbon:.85}[ch.mat];
 const wCh=ch.wb*ch.track*.006*mf+60,wWheel=wh.d*wh.w*.012+8,wMot=.0029*m.d*m.d*m.len+(m.type==='br'?-10:0),Pm=(m.type==='bl'?.012:.0055)*m.d*m.d*m.len;
 const wEsc=40+p.esc.a*.3,wServo=30+p.servo.tq*1.5,wBody=60+ch.wb*.25,Vn=ba.cells*NOM[ba.chem],V=Vn*.93,wBat=ba.cells*ba.mah*DENS[ba.chem]+ba.cells*3+12;
 const AUW=wCh+4*wWheel+wMot+wEsc+wServo+12+wBody+wBat+25,mkg=AUW/1000,rho=airDensity(B.env.alt,B.env.temp);
 const kv=m.type==='bl'?m.kv:56000/m.turns,rpm=kv*V*.9,ratio=g.spur/g.pin*g.int,wrpm=rpm/ratio,vGear=wrpm*Math.PI*wh.d/1000/60*.92;
 const crr=KIND[ch.kind].crr,CdA=(ch.track/1000)*((ch.clear+wh.d*.6)/1000+.06)*.8;
 const Pneed=v=>(crr*mkg*9.81+.5*rho*CdA*v*v)*v/.75;
 let vPow=vGear;if(Pneed(vGear)>Pm){let lo=0,hi=vGear;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(Pneed(mid)>Pm)hi=mid;else lo=mid}vPow=lo}
 const vTop=Math.min(vGear,vPow),load=Pneed(vGear)/Pm;
 const grip=Math.max(TIRE[wh.tire].road,TIRE[wh.tire].dirt*.9),driveF=ch.drive==='4wd'?1:.55,Fgrip=grip*mkg*9.81*driveF,Fpow=Pm*.75/4;
 const torqueWheel=Pm*.75/Math.max(1,rpm*2*Math.PI/60)*ratio*.9,Fmot=torqueWheel/(wh.d/2000);
 const F=Math.min(Fgrip,Fmot,Fpow*3),acc=Math.max(.1,F/mkg-crr*9.81),t30=8.33/acc+(vTop<8.33?99:0);
 const Ipk=Pm*.6/V,Iavg=KIND[ch.kind].use*Pm/V+.5,capAh=ba.mah/1000,tRun=capAh*.8/Iavg*60;
 const cgH=ch.clear+wh.d*.35+15,stab=ch.track/(2*cgH),servoNeed=mkg*(wh.d/100)*1.6+2,cmax=Math.min(ba.c,CMAX[ba.chem]);
 return{AUW,wCh,wWheel,wMot,Pm,wEsc,wServo,wBody,wBat,V,Vn,kv,rpm,ratio,vGear,vPow,vTop,load,acc,t30,Ipk,Iavg,tRun,cgH,stab,servoNeed,cmax,batMaxA:capAh*cmax,grip,
  parts:[['Shassi va osma',wCh],["G'ildiraklar",4*wWheel],['Motor',wMot],['ESC',wEsc],['Servo',wServo],['Kuzov',wBody],['Batareya',wBat],["Simlar va boshqalar",37]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>{const v=vTop*t/100,pw=Math.min(Pm,Pneed(v));return{t,thrust:v*3.6,watt:pw,amp:pw/V+.5,eff:pw>0?v*3.6/pw*100:0}})}};

T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW/1000,2)+' kg'},{l:'Maks. tezlik',v:fmt(D.vTop*3.6)+' km/soat'},{l:'0→30 km/soat',v:D.t30>50?'—':fmt(D.t30,1)+' s'},
 {l:'Motor yuklamasi',v:fmt(D.load*100)+' %',lvl:D.load>1.4?'bad':D.load>1?'warn':'ok'},{l:'Barqarorlik',v:fmt(D.stab,2),lvl:D.stab<KIND[B.p.chassis.kind].stab[0]?'bad':D.stab<KIND[B.p.chassis.kind].stab[1]?'warn':'ok'},{l:'Haydash vaqti',v:fmt(D.tRun)+' daq'}];

T.issues=(B,D)=>{const p=B.p,L=[],add=(lvl,t,why)=>L.push({lvl,t,why});
 if(D.load>1.4)add('bad',`Uzatma juda uzun — motor kuyadi (${fmt(D.load*100)}%)`,`Motor ${fmt(D.vGear*3.6)} km/soat ga yetishga harakat qiladi, lekin quvvat faqat ${fmt(D.vPow*3.6)} km/soat ga yetadi. Pinionni ${Math.max(8,Math.round(p.gear.pin/D.load))}T gacha kichraytiring.`);
 else if(D.load>1)add('warn',`Motor qiziydi (${fmt(D.load*100)}%)`,"Pinionni 1–3 tishga kichraytiring yoki sovutgich qo'ying. Motor harorati 70 °C dan oshmasin.");
 if(p.motor.type==='br'&&D.V>8.6)add('warn',"Cho'tkali motor uchun kuchlanish yuqori",`Ko'pchilik cho'tkali motorlar 2S (7.4 V) uchun; ${p.bat.cells}S da cho'tkalar tez yeyiladi.`);
 if(p.bat.cells>+p.esc.cells)add('bad',`Batareya ${p.bat.cells}S, ESC ${p.esc.cells}S gacha`,'ESC birinchi ulashdayoq kuyadi.');
 if(D.Ipk>p.esc.a*1.2)add('bad',`ESC toki yetmaydi (${fmt(D.Ipk)} / ${p.esc.a} A)`,'Kuchliroq ESC oling.');else if(D.Ipk>p.esc.a*.9)add('warn',`ESC chegarada (${fmt(D.Ipk)} / ${p.esc.a} A)`,'');
 if(D.Ipk>D.batMaxA)add('warn',`Batareya toki yetmaydi (${fmt(D.batMaxA)} / ${fmt(D.Ipk)} A)`,'Yuqori C reyting kerak.');
 if(p.servo.tq<D.servoNeed)add('bad',`Rul servosi kuchsiz (${p.servo.tq} < ${fmt(D.servoNeed,1)} kg·sm)`,"G'ildiraklar to'liq burilmaydi, servo tishlari sinadi.");
 const sb=KIND[p.chassis.kind].stab;if(D.stab<sb[0])add('bad',`Burilishda ag'dariladi (barqarorlik ${fmt(D.stab,2)})`,"Koleyani kengaytiring, klirensni yoki g'ildirak diametrini kamaytiring.");else if(D.stab<sb[1])add('warn',`Ag'darilishga moyil (${fmt(D.stab,2)})`,'Keskin burilishlarda tezlikni kamaytiring.');
 if(p.chassis.kind==='crawler'&&p.chassis.clear<40)add('warn',"Crawler uchun klirens past","Toshlarga ilinib qoladi; 50 mm+ tavsiya.");
 if(p.chassis.kind==='crawler'&&D.ratio<20)add('warn','Crawler uchun uzatma kam',"Sekin va aniq harakat uchun 30:1 dan katta umumiy uzatma kerak.");
 if(p.chassis.kind==='onroad'&&p.wheel.tire!=='slick')add('info','Asfalt uchun silliq shina yaxshiroq',"Silliq shina asfaltda eng yaxshi yopishadi.");
 if(p.wheel.d>p.chassis.wb*.6)add('warn',"G'ildirak shassiga nisbatan juda katta",'Burilishda kuzovga tegishi mumkin.');
 if(D.vTop*3.6>80)add('info',`Maks. tezlik ${fmt(D.vTop*3.6)} km/soat`,"Yuqori tezlikda yaxshi sovutish va metall tishli g'ildiraklar kerak.");
 return L};

T.wiring=B=>{const p=B.p,bl=p.motor.type==='bl',boards=[],comps=[];
 boards.push({id:'esc',label:`ESC ${p.esc.a}A`,x:260,y:230,w:200,h:170,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:310,y:400,l:'+'},{id:'VBAT-',t:'gnd',x:380,y:400,l:'−'},
  ...(bl?[{id:'A',t:'motor',x:290,y:230,l:'A'},{id:'B',t:'motor',x:360,y:230,l:'B'},{id:'C',t:'motor',x:430,y:230,l:'C'}]:[{id:'M+',t:'motor',x:310,y:230,l:'M+'},{id:'M-',t:'motor',x:410,y:230,l:'M−'}])]});
 boards.push({id:'rx',label:`Qabul qilgich (${p.rx.ch} kanal)`,x:600,y:230,w:180,h:170,need:'rx',pads:Array.from({length:+p.rx.ch},(_,i)=>({id:'CH'+(i+1),t:'ch',x:600,y:250+i*(130/(p.rx.ch-1)),l:'CH'+(i+1)}))});
 comps.push({id:'mot1',label:bl?"Cho'tkasiz motor":"Cho'tkali motor",x:360,y:90,need:'mot1',wires:bl?[{id:'ma',l:'a',col:'#c58a3a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mb',l:'b',col:'#b0702a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mc',l:'c',col:'#d39a4a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3}]
  :[{id:'ma',l:'+',col:'#e53935',kind:'motor',ok:['M+'],w:3},{id:'mb',l:'−',col:'#222',kind:'motor',ok:['M-'],w:3}]});
 comps.push({id:'xt60',label:'Batareya kabeli',x:340,y:590,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]});
 comps.push({id:'escsig',label:'ESC signal (BEC)',x:520,y:520,need:'esc',wires:[{id:'escsig',l:'gaz',col:'#ff9800',kind:'servo',ok:['CH2'],w:3}]});
 comps.push({id:'servo',label:'Rul servosi',x:920,y:200,need:'servo',wires:[{id:'wservo',l:'servo',col:'#ff9800',kind:'servo',ok:['CH1'],w:3}]});
 return{boards,comps,hint:"Mashina pultlarida standart: CH1 — rul, CH2 — gaz. ESC signal kabeli qabul qilgichni ham quvvatlaydi (BEC). Cho'tkasiz motorning 3 simini istalgan tartibda ulash mumkin — yo'nalish teskari bo'lsa ikkitasini almashtiriladi."}};
T.wextra=B=>{const w=B.wires;if(B.p.motor.type==='br')return{motorReversed:w.ma==='M-'&&w.mb==='M+'};const o=[w.ma,w.mb,w.mc];if(o.some(x=>!x)||new Set(o).size<3)return{};const i=o.map(x=>'ABC'.indexOf(x));let n=0;for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(i[a]>i[b])n++;return{motorReversed:n%2===1}};

T.build=(B,D,ctx)=>{const p=B.p,ch=p.chassis,wh=p.wheel,c=B.col,u=v=>v/10,X=!!window.XRAY;
 // kuzov balandligi ichidagi eng baland detalga (ESC ventilyatori ~3 sm) va g'ildirakka qarab tanlanadi
 const BH={onroad:4.6,buggy:4.8,truck:5.6,crawler:6.2}[ch.kind];
 const R=u(wh.d)/2,W=u(wh.w),hx=u(ch.track)/2,hz=u(ch.wb)/2,plateY=Math.max(.6,u(ch.clear));
 const cm=mMat(ch.mat==='carbon'?'carbon':ch.mat==='alu'?'alu':'plastic',c.chassis,'satin'),dark=mPlastic('#232323',.55);
 const Hl=Math.max(BH,R*1.15),towerY=Math.min(R+u(ch.clear)*.6+2.4,plateY+.4+Hl*.72);
 // shassi: asosiy plastina, oldi/orqa reduktor qutilari, pastki richaglar, amortizatorlar (spiral prujina), kardan vali
 {const g=new THREE.Group();g.add(rbox(u(ch.track)*.55,.35,u(ch.wb)*1.15,.8,cm,0,plateY,0));
  for(const sz of[-1,1]){g.add(rbox(u(ch.track)*.36,2.2,2.8,.4,dark,0,R,sz*hz));
   const tower=rbox(u(ch.track)*.7,.4,1.2,.2,mMetal('#4a5058',.4),0,towerY,sz*(hz-1.6));g.add(tower);
   for(const sx of[-1,1]){const arm=new THREE.Group();arm.position.set(sx*u(ch.track)*.17,R-.5,sz*hz);
     const L=hx-u(ch.track)*.17-.6;arm.add(rbox(L,.45,2.6,.3,dark,sx*L/2,0,0));arm.add(cyl(.2,.2,3,mMetal('#b0b6bf'),sx*.2,0,0,10).rotateX(Math.PI/2));g.add(arm);
     g.add(rbox(1,1.6,1.6,.2,dark,sx*(hx-.9),R,sz*hz));
     const sh=new THREE.Group(),bot=new V3(sx*(hx-1.6),R-.2,sz*(hz-1)),top=new V3(sx*u(ch.track)*.3,towerY,sz*(hz-1.6)),len=bot.distanceTo(top);
     sh.position.copy(bot);sh.quaternion.setFromUnitVectors(new V3(0,1,0),top.clone().sub(bot).normalize());
     sh.add(cyl(.6,.6,len*.55,mMetal('#9aa3ad',.25),0,len*.62,0,20));sh.add(cyl(.18,.18,len*.6,mMetal('#e0e4e8',.15),0,len*.3,0,10));
     sh.add(new THREE.Mesh(springGeo(.72,7,len*.62,.09),mPaint(c.spring,'gloss')).translateY(len*.12));sh.add(cyl(.35,.35,.5,mMetal('#666'),0,.2,0,10));g.add(sh)}}
  const drv=cyl(.28,.28,u(ch.wb)*.85,mMetal('#bbb',.25),0,R-.2,0,12);drv.rotation.x=Math.PI/2;g.add(drv);
  ctx.add('chassis',g,[0,0,0])}
 // g'ildiraklar: protektorli shina, disk, 12 mm olti qirrali vtulka
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz],k)=>{const g=mkWheel(wh.d,wh.w,wh.tire,c.rim,c.tire);if(sx<0)g.rotation.y=Math.PI;g.position.set(sx*(hx+W/2-.2),R,sz*hz);ctx.add('wheel'+(k+1),g,[sx*4,0,0])});
 // motor (cho'tkasiz yoki cho'tkali), sovutgich qanotchalari, simlar
 const mR=u(p.motor.d)/2,mL=u(p.motor.len),mx=-u(ch.track)*.1,my=plateY+.35+mR,mz=u(ch.wb)*.18;
 {const g=new THREE.Group();g.position.set(mx,my,mz);const can=cyl(mR,mR,mL,mPaint(c.motor,'metal'),0,0,0,36);can.rotation.z=Math.PI/2;g.add(can);
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2,f=box(mL*.75,.08,mR*.42,mMetal('#90a4ae',.3));f.position.set(-mL*.05,Math.cos(a)*(mR+.18),Math.sin(a)*(mR+.18));f.rotation.x=a;g.add(f)}
  const end=cyl(mR*.86,mR*.86,.35,mMetal('#333'),-mL/2-.17,0,0,28);end.rotation.z=Math.PI/2;g.add(end);
  const sft=cyl(.16,.16,1.4,mMetal('#ddd',.2),mL/2+.6,0,0,10);sft.rotation.z=Math.PI/2;g.add(sft);
  for(const[k,col]of p.motor.type==='bl'?[[-.35,'#1c1c1c'],[0,'#1c1c1c'],[.35,'#1c1c1c']]:[[-.25,'#d32f2f'],[.25,'#1b1b1b']])g.add(wireMesh([[-mL/2-.3,k,mR*.3],[-mL/2-1.5,k+.3,mR],[-mL/2-2.5,k+.6,mR*2]],col,.09));
  ctx.add('mot1',g,[0,4,0])}
 // uzatma: pinion va spur modul 0,6 (32P) — markazlar orasi = m·(z₁+z₂)/2
 {const g=new THREE.Group(),m=.6,rp=m*p.gear.pin/20,rs=m*p.gear.spur/20,gx=mx+mL/2+.9;
  const pin=new THREE.Mesh(gearGeo(p.gear.pin,m,6),mMetal('#cfd8dc',.25));pin.rotation.y=Math.PI/2;pin.position.set(gx,my,mz);pin.castShadow=true;g.add(pin);
  const sp=new THREE.Mesh(gearGeo(p.gear.spur,m,4),mPlastic('#263238',.45));sp.rotation.y=Math.PI/2;sp.position.set(gx+.1,my,mz+rp+rs);sp.rotation.x=Math.PI/p.gear.spur;sp.castShadow=true;g.add(sp);
  g.add(cyl(rs*.3,rs*.3,.6,mMetal('#999'),gx+.4,my,mz+rp+rs,16).rotateZ(Math.PI/2));ctx.add('gear',g,[3,3,0])}
 // ESC: radiator, ventilyator, o'chirib-yoqish kaliti
 {const g=new THREE.Group(),ex=u(ch.track)*.15,ez=u(ch.wb)*.08;g.add(rbox(3.6,2,4.2,.35,mPlastic('#1e1e1e',.4),ex,plateY+1.2,ez));
  for(let k=-6;k<=6;k++)g.add(box(.08,.5,3.6,mMetal('#5d636b',.4),ex+k*.26,plateY+2.45,ez));const fan=cyl(1.2,1.2,.35,mPlastic('#37474f',.5),ex,plateY+2.85,ez,24);g.add(fan);
  for(let k=0;k<7;k++){const b=box(1,.05,.32,mPlastic('#263238'),ex,plateY+3.05,ez);b.rotation.y=k/7*Math.PI*2;g.add(b)}
  g.add(rbox(1.2,.8,.7,.15,mPlastic('#111'),ex+2.4,plateY+.8,ez-1.4));g.add(box(.3,.25,.4,mPlastic('#e53935'),ex+2.4,plateY+1.3,ez-1.4));ctx.add('esc',g,[3,5,0])}
 // rul servosi (standart 40×20×37 mm) va rul tortqichi
 {const g=new THREE.Group(),sv=mkServo('std','#1565c0'),sx=u(ch.track)*.08,sz=-hz*.55;sv.rotation.x=Math.PI/2;sv.position.set(sx,plateY+1.2,sz-1.85);g.add(sv);
  // servo yotqizilgan (real 1/10 shassidagidek), shox oldinga qaragan; rul tortqichi g'ildirak tirgagigacha
  g.add(wireMesh([[sx+1.3,plateY+1.2,sz-4.2],[hx*.45,R+.2,-hz+.6],[hx-1,R,-hz+.3]],'#c0c4c9',.1));g.add(wireMesh([[sx+1.3,plateY+1.2,sz-4.2],[-hx*.45,R+.2,-hz+.6],[-hx+1,R,-hz+.3]],'#c0c4c9',.1));ctx.add('servo',g,[0,4,-2])}
 ctx.add('rx',(()=>{const g=new THREE.Group(),x=-u(ch.track)*.12,y=plateY+.7,z=-hz*.35;g.add(rbox(2.6,1.2,3.4,.3,mPlastic('#202020',.4),x,y,z));for(let k=0;k<+p.rx.ch;k++)g.add(box(.25,.25,1.4,mPlastic('#111'),x-.8+k*.5,y+.7,z));
  g.add(cyl(.06,.06,8,mPlastic('#111'),x,y+4.5,z-1.2,6));g.add(cyl(.22,.22,1,mPlastic('#333'),x,y+.9,z-1.2,10));return g})(),[-2,5,0]);
 // batareya: qattiq korpusli LiPo (hardcase), shassi o'rtasida pastda
 {const g=mkBattery(p.bat.cells,p.bat.mah,p.bat.chem,c.bat,[`${p.bat.cells}S ${p.bat.mah}mAh`,`${p.bat.c}C hardcase`,`${fmt(D.Vn,1)} V`],{hard:true,awg:12,lead:3});g.position.set(u(ch.track)*.02,plateY+.2,-hz*.05);ctx.add('bat',g,[0,8,0])}
 // kuzov: haqiqiy avtomobil kuzovlari kabi — yon profil (silueti) chiziladi, g'ildirak arkalari kesiladi,
 // keyin kenglik bo'yicha yumaloq qirrali qilib cho'ziladi (polikarbonat qobiq). Ustiga kabina (oynalar bilan),
 // faralar, panjara, bamper, oynalar, eshik chiziqlari qo'shiladi. Proporsiyalar g'ildirak radiusiga (R) bog'langan.
 {const g=new THREE.Group(),bs=ch.body||'jeep',bm=X?MAT('xrb'+c.body,()=>new THREE.MeshPhysicalMaterial({color:c.body,transparent:true,opacity:.2,depthWrite:false})):mPaint(c.body,B.fin),bm2=mPaint(c.body2,B.fin),
   gl=MAT('carglass',()=>new THREE.MeshPhysicalMaterial({color:'#0b1117',roughness:.04,metalness:.4,clearcoat:1,transparent:true,opacity:.88})),blk=mPlastic('#17191c',.75),chr=mMetal('#c9ced4',.18),seam=mPlastic('#0a0a0a',.6),
   ST={jeep:{ovF:.55,ovR:.75,w:'in',yb:.7,lo:[[0,.95,.12],[0,1.9,.18],[.025,1.98,.12],[.36,2.04,.08],[1,2.04,.14],[1,.95,.12]],gh:[.36,.405,.975,1],roof:3.32,ghw:.92,rr:.22,win:2},
    pickup:{ovF:.55,ovR:.9,w:'in',yb:.7,lo:[[0,.95,.12],[0,1.9,.18],[.025,1.98,.12],[.34,2.04,.08],[1,2.04,.14],[1,.95,.12]],gh:[.34,.385,.6,.625],roof:3.3,ghw:.92,rr:.22,win:1},
    sedan:{ovF:1,ovR:1.1,w:'out',yb:.45,lo:[[0,.8,.3],[0,1.22,.35],[.07,1.5,.45],[.34,1.76,.4],[.86,1.86,.35],[1,1.8,.2],[1,.8,.3]],gh:[.3,.48,.7,.87],roof:2.72,ghw:.8,rr:.55,win:2},
    buggy:{ovF:.95,ovR:.8,w:'out',yb:.5,lo:[[0,.85,.3],[0,1.08,.3],[.27,1.62,.45],[.72,1.78,.3],[1,1.62,.2],[1,.85,.3]],gh:[.21,.39,.6,.76],roof:2.55,ghw:.64,rr:.6,win:1}}[bs]||null;
  const S=ST||{ovF:.55,ovR:.75,w:'in',yb:.7,lo:[[0,.95,.12],[0,1.9,.18],[.36,2.04,.08],[1,2.04,.14],[1,.95,.12]],gh:[.36,.405,.975,1],roof:3.3,ghw:.92,rr:.22,win:2};
  const ra=R*1.1,zf=-hz-ra-R*S.ovF,zr=hz+ra+R*S.ovR,L=zr-zf,Z=t=>zf+t*L,yb=Math.max(plateY+.25,R*S.yb),
   Wd=S.w==='in'?u(ch.track)*.86:2*(hx+W*.78),bev=Math.min(.45,R*.09);
  // yumaloqlangan ko'pburchakdan (z,y,r) Shape — har burchak kvadratik egri bilan silliqlanadi
  const shapeOf=pts=>{const s=new THREE.Shape(),n=pts.length,P=pts.map(([z,y,r])=>({x:-z,y,r}));let first=true;
   for(let i=0;i<n;i++){const v=P[i],a=P[(i+n-1)%n],b=P[(i+1)%n];
    if(!v.r){first?s.moveTo(v.x,v.y):s.lineTo(v.x,v.y);first=false;continue}
    const la=Math.hypot(a.x-v.x,a.y-v.y),lb=Math.hypot(b.x-v.x,b.y-v.y),d=Math.min(v.r,la*.45,lb*.45),
     p1={x:v.x+(a.x-v.x)/la*d,y:v.y+(a.y-v.y)/la*d},p2={x:v.x+(b.x-v.x)/lb*d,y:v.y+(b.y-v.y)/lb*d};
    first?s.moveTo(p1.x,p1.y):s.lineTo(p1.x,p1.y);first=false;s.quadraticCurveTo(v.x,v.y,p2.x,p2.y)}
   s.closePath();return s};
  const extr=(pts,width,mat,b=bev,x=0)=>{const geo=new THREE.ExtrudeGeometry(shapeOf(pts),{depth:Math.max(.05,width-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:b>0?4:0,curveSegments:10});
   geo.translate(0,0,-Math.max(.05,width-2*b)/2);geo.rotateY(Math.PI/2);const m=new THREE.Mesh(geo,mat);m.position.x=x;m.castShadow=true;m.receiveShadow=true;m.userData.dispose=true;return m};
  // pastki korpus: yuqori silueti + pastki chiziq, har bir g'ildirak ustida arka (orqadan oldinga)
  const lo=S.lo.map(([t,y,r],i)=>[Z(t),(i===0||i===S.lo.length-1)?Math.max(R*y,yb+R*.18):R*y,R*r]),arch=zc=>{const a0=Math.asin(clamp((yb-R)/ra,-.95,.95)),A=[];for(let k=0;k<=14;k++){const a=a0+(Math.PI-2*a0)*k/14;A.push([zc+ra*Math.cos(a),R+ra*Math.sin(a),0])}return A};
  const body=[...lo,[zr-R*.25,yb,R*.15],...arch(hz),...arch(-hz),[zf+R*.25,yb,R*.15]];
  g.add(extr(body,Wd,bm));
  // kabina (oynali qism): to'rtta tayanch nuqta — old oyna osti, tom oldi, tom orqasi, orqa oyna osti
  const up=S.lo.slice(1,-1),hAt=t=>{for(let i=0;i<up.length-1;i++){const[a,ya]=up[i],[b,yb2]=up[i+1];if(t>=a&&t<=b)return R*(ya+(yb2-ya)*(b>a?(t-a)/(b-a):0))}return R*up[up.length-1][1]};
  const belt=R*up.reduce((m,r)=>Math.max(m,r[1]),0),roof=R*S.roof,[tb0,tt0,tt1,tb1]=S.gh.map(Z),b0=hAt(S.gh[0])-.12,b1=hAt(S.gh[3])-.12,ghW=Wd*S.ghw,bl=Math.max(b0,b1),hh=roof-bl;
  g.add(extr([[tb0,b0,0],[tt0,roof,R*S.rr],[tt1,roof,R*S.rr],[tb1,b1,0]],ghW,bm,Math.min(.5,R*.12)));
  // yon oynalar: kabina siluetidan ustun (pillar) qalinligida ichkariga surilgan; jip/sedanda o'rtada B-ustun
  const pw=Math.max(.3,hh*.13),y1=bl+hh*.14,y2=roof-hh*.13,fe=y=>tb0+(tt0-tb0)*(y-b0)/(roof-b0)+pw,re=y=>tb1-(tb1-tt1)*(y-b1)/(roof-b1)-pw,
   winShape=(a,b)=>new THREE.Shape([new THREE.Vector2(-a(y1),y1),new THREE.Vector2(-a(y2),y2),new THREE.Vector2(-b(y2),y2),new THREE.Vector2(-b(y1),y1)]);
  const wins=S.win===2?[[fe,y=>(fe(y)+re(y))/2-pw*.45],[y=>(fe(y)+re(y))/2+pw*.45,re]]:[[fe,re]];
  for(const[a,b]of wins){const geo=new THREE.ExtrudeGeometry(winShape(a,b),{depth:.06,bevelEnabled:false});geo.rotateY(Math.PI/2);
   for(const sx of[-1,1]){const m=new THREE.Mesh(geo,gl);m.position.x=sx*(ghW/2+.03)-(sx<0?.06:0);m.userData.dispose=true;g.add(m)}}
  // old va orqa oyna: kabinaning qiya yuzalariga parallel shisha
  for(const[zA,zB,front,yA]of[[tb0,tt0,1,b0],[tb1,tt1,0,b1]]){const dz=zB-zA,dy=roof-yA,len=Math.hypot(dz,dy),nz=front?-dy/len:dy/len,ny=front?dz/len:-dz/len,off=Math.min(.5,R*.12)+.05,
   p=box(ghW*.84,len*.74,.06,gl,0,yA+dy/2+ny*off,(zA+zB)/2+nz*off);p.rotation.x=Math.atan2(dz,dy);g.add(p)}
  // eshik chiziqlari va tutqichlar
  const doorZ=S.win===2?[tb0+R*.15,(tb0+tb1)/2,tb1-R*.1]:[tb0+R*.15,tb1-R*.1];
  for(const sx of[-1,1]){for(const z of doorZ)g.add(box(.05,(belt-yb)*.72,.06,seam,sx*(Wd/2+.01),yb+(belt-yb)*.5,z));
   for(let k=0;k<doorZ.length-1;k++)g.add(box(.1,.14,R*.38,chr,sx*(Wd/2+.04),belt-(belt-yb)*.22,doorZ[k+1]-R*.45));
   // yon ko'zgu
   const mz=tb0+R*.35,mx=sx*(ghW/2+R*.32);g.add(box(R*.36,.06,.06,blk,sx*(ghW/2+R*.14),belt+R*.18,mz));g.add(box(R*.14,R*.26,R*.36,bs==='sedan'||bs==='buggy'?bm:blk,mx,belt+R*.22,mz))}
  const fz=zf-bev-.03,rz=zr+bev+.03;
  if(bs==='jeep'||bs==='pickup'||!ST){
   // panjara (7 tirqish), dumaloq faralar xrom halqa bilan, burilish chiroqlari
   const gy=R*1.42;g.add(box(Wd*.56,R*.62,.14,blk,0,gy,fz));for(let k=-3;k<=3;k++)g.add(box(Wd*.045,R*.5,.1,mPlastic('#030303',.5),k*Wd*.075,gy,fz-.08));
   for(const sx of[-1,1]){const rim=cyl(R*.24,R*.24,.22,chr,sx*Wd*.38,gy,fz-.05,28);rim.rotation.x=Math.PI/2;g.add(rim);const ln=cyl(R*.18,R*.18,.06,mGlow('#fffbe6'),sx*Wd*.38,gy,fz-.17,28);ln.rotation.x=Math.PI/2;g.add(ln);
    g.add(box(R*.26,R*.12,.1,mGlow('#ff9800'),sx*Wd*.38,R*1.08,fz-.05))}
   // po'lat bamperlar, qizil tortish ilgaklari, ostona himoyasi
   const by=Math.max(yb+R*.1,R*.95);g.add(rbox(Wd*1.08,R*.34,R*.5,.12,blk,0,by,fz-R*.28));g.add(rbox(Wd*1.04,R*.34,R*.45,.12,blk,0,by,rz+R*.25));
   for(const sx of[-1,1]){const th=new THREE.Mesh(GEO('towhook',()=>new THREE.TorusGeometry(.32,.09,8,16)),mPaint('#c62828','gloss'));th.position.set(sx*Wd*.3,by,fz-R*.56);th.castShadow=true;g.add(th);
    g.add(box(.4,.4,(hz-ra)*2*.9,mMetal('#26292d',.45),sx*(Wd/2+.2),yb+.1,0));
    g.add(box(R*.2,R*.42,.1,mGlow('#b71c1c'),sx*Wd*.4,R*1.55,rz))}
   // qanot kengaytmalari (fender flare): kuzov yonidan g'ildirak ustiga chiqadi
   const fw=Math.max(.5,(hx+W/2-.2)-Wd/2+W*.15);
   for(const zc of[-hz,hz])for(const sx of[-1,1]){const fl=new THREE.Mesh(GEO(`flr${ra.toFixed(2)}`,()=>new THREE.TorusGeometry(ra+.15,.35,8,28,Math.PI)),blk);fl.rotation.y=Math.PI/2;fl.scale.z=fw/.7;fl.position.set(sx*(Wd/2+fw/2-.1),R,zc);fl.castShadow=true;g.add(fl)}
   // tom: ochiq rangli qopqoq, bagajnik va LED panel
   g.add(rbox(ghW*.96,.18,(tt1-tt0)*.98,.08,bm2,0,roof+.1,(tt0+tt1)/2));
   for(const sx of[-1,1])g.add(box(.16,.16,(tt1-tt0)*.8,mMetal('#2a2d31',.4),sx*ghW*.4,roof+.42,(tt0+tt1)/2));for(let k=0;k<4;k++)g.add(box(ghW*.82,.1,.14,mMetal('#2a2d31',.4),0,roof+.42,tt0+(tt1-tt0)*(.12+k*.25)));
   g.add(box(ghW*.7,R*.13,R*.16,blk,0,roof+.6,tt0+R*.2));g.add(box(ghW*.64,R*.08,.05,mGlow('#fff7d6'),0,roof+.6,tt0+R*.1));
   if(bs==='pickup'){const bz0=tb1+R*.25,bz1=zr-R*.1;g.add(box(Wd*.86,.08,bz1-bz0,blk,0,belt+.04,(bz0+bz1)/2));
    const rb=wireMesh([[-ghW*.42,belt,bz0+R*.3],[-ghW*.42,roof*.97,bz0+R*.3],[ghW*.42,roof*.97,bz0+R*.3],[ghW*.42,belt,bz0+R*.3]],'#1c1c1c',.2);g.add(rb)}
   else{const sp=mkWheel(wh.d*.9,wh.w*.85,wh.tire,c.rim,c.tire);sp.rotation.y=Math.PI/2;sp.position.set(0,R*1.5,rz+u(wh.w)*.45+.3);g.add(sp)}}
  else{
   // sedan / buggy: qiya faralar, pastki havo olgich, orqa chiroq chizig'i va spoyler/qanot
   for(const sx of[-1,1]){const hl=box(Wd*.2,R*.1,R*.55,mGlow('#eef6ff'),sx*Wd*.3,R*1.36,zf+R*.42);hl.rotation.x=-.42;g.add(hl);
    g.add(box(Wd*.18,R*.12,.1,mGlow('#b71c1c'),sx*Wd*.3,R*1.6,rz-.02))}
   g.add(box(Wd*.5,R*.2,.1,blk,0,R*.98,fz));g.add(box(Wd*.86,R*.12,.6,blk,0,yb+R*.2,fz-.1));
   if(bs==='sedan'){g.add(box(Wd*.86,.12,R*.55,bm2,0,R*1.86+R*.38,zr-R*.45));for(const sx of[-1,1])g.add(box(.12,R*.38,R*.35,bm2,sx*Wd*.36,R*1.86+R*.18,zr-R*.45))}
   else{const wy=roof+R*.35;g.add(rbox(Wd*1.02,.2,R*.95,.08,bm2,0,wy,zr-R*.35));for(const sx of[-1,1]){g.add(box(.16,wy-R*1.6,R*.4,bm2,sx*Wd*.3,(wy+R*1.6)/2,zr-R*.35));g.add(box(.12,R*.5,R*.95,bm2,sx*Wd*.51,wy+R*.2,zr-R*.35))}}}
  ctx.add('body',g,[0,12,0])}};

T.bom=(B,D)=>{const p=B.p;return[
 ['chassis',`Shassi ${KIND[p.chassis.kind].n}`,`${p.chassis.wb}×${p.chassis.track} mm, ${p.chassis.drive.toUpperCase()}`,1,D.wCh],
 ['motor',p.motor.type==='bl'?`Cho'tkasiz motor ${p.motor.kv}KV`:`Cho'tkali motor ${p.motor.turns}T`,`${p.motor.d}×${p.motor.len} mm, ~${fmt(D.Pm)} W`,1,D.wMot],
 ['gear',`Pinion ${p.gear.pin}T + spur ${p.gear.spur}T`,`Umumiy uzatma ${fmt(D.ratio,1)}:1`,1,25],['wheel',`G'ildirak ${p.wheel.d}×${p.wheel.w} mm`,TIRE[p.wheel.tire].n,4,D.wWheel],
 ['esc',`ESC ${p.esc.a}A`,`${p.esc.cells}S gacha, BEC ${p.esc.bec} V`,1,D.wEsc],['servo',`Rul servosi ${p.servo.tq} kg·sm`,'',1,D.wServo],['rx',`Qabul qilgich ${p.rx.ch} kanal`,'',1,12],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C`,'',1,D.wBat],['body','Kuzov (polikarbonat) + 4 ta R-klips',`Ichidan bo'yaladi, 0,75–1 mm`,1,D.wBody],
 ['screw','Vintlar M3 (shassi, motor, servo)','M3×8 ×20, M3×12 ×6, pinion uchun M3 shtift vint ×1',1,0],
 ['wire','Silikon sim 12 AWG, Deans/XT60 ulagich','Batareya — ESC',1,0]]};
regType(T);
})();
