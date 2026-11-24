/* =====================================================================
   ARDUINO ROBOT (2 g'ildirakli differensial yuritma)
     motor aylanishi   rpm ≈ rpm_nom · Vm / V_nom · 0,8 (yuk ostida)
     tezlik            v = rpm · π · D / 60
     drayver yo'qotishi: L298N ≈ 2 V (bipolyar), TB6612 / DRV8833 ≈ 0,2 V (MOSFET)
   ===================================================================== */
(()=>{
const MOT={tt:{n:'TT reduktorli motor (plastik, 1:48)',w:29,irun:.17,ist:1.5,tq:160,col:'#f2c200'},n20:{n:"N20 metall reduktorli mikromotor",w:10,irun:.08,ist:.75,tq:180,col:'#b8bec6'},jga25:{n:'JGA25-370 metall reduktorli motor',w:95,irun:.25,ist:2.6,tq:1120,col:'#b8bec6'}};
const DRV={l298n:{n:'L298N (ikki kanalli H-ko\'prik)',drop:2,cont:2,peak:3,vmax:46,w:26,q:.036,en:true,v5:true},tb6612:{n:'TB6612FNG',drop:.2,cont:1.2,peak:3.2,vmax:13.5,w:3,q:.002,en:true},drv8833:{n:'DRV8833',drop:.2,cont:1.5,peak:2,vmax:10.8,w:2,q:.002,en:false}};
const MCU={uno:{n:'Arduino Uno R3',logic:5,w:25,i:.05,pwm:[3,5,6,9,10,11]},nano:{n:'Arduino Nano',logic:5,w:7,i:.03,pwm:[3,5,6,9,10,11]},esp32:{n:'ESP32 DevKit (Wi-Fi/Bluetooth)',logic:3.3,w:10,i:.12}};
const BAT={aa4:{n:'4×AA (alkalin)',v:5.6,ri:.6,w:4*23+15,mah:2000,imax:1.5},aa6:{n:'6×AA (alkalin)',v:8.4,ri:.9,w:6*23+20,mah:2000,imax:1.5},li2:{n:'2×18650 Li-ion',v:7.4,ri:.1,w:2*46+20,mah:2600,imax:8},lipo2:{n:'LiPo 2S',v:7.4,ri:.04,w:0,mah:1300,imax:30}};
const T={id:'robot',name:'Arduino robot',ic:'robot',desc:"G'ildirakli robot: Arduino, drayver va sensorlar, avtomatik yaratilgan kod.",defPreset:'avoider',defPurpose:'avoid',
 purposes:{avoid:{t:"To'siqdan qochish",note:'HC-SR04 sensori kerak'},line:{t:"Chiziq bo'ylab yurish",note:'2 ta IQ chiziq sensori kerak'},learn:{t:"O'rganish / qo'lda",note:'Klaviatura yoki Bluetooth bilan'}},
 colors:{chassis:'#7fc8ff',motor:'#f2c200',rim:'#f2c200',tire:'#1a1a1a',accent:'#ff5722'},
 paint:[['chassis','Shassi plastinasi'],['motor','Motor reduktori'],['rim',"G'ildirak diski"],['tire','Shina'],['accent','Sensor qopqog\'i']],
 spec:{
  chassis:{t:'Shassi',ic:'frame',g:'rchassis',f:[{k:'len',l:'Uzunligi',min:110,max:260,step:5,u:'mm'},{k:'wid',l:'Eni',min:90,max:200,step:5,u:'mm'},{k:'th',l:'Qalinligi',min:2,max:5,step:.5,u:'mm'},
   {k:'mat',l:'Material',type:'sel',o:{acrylic:'Akril (shaffof)',pla:'PLA (3D bosma)',alu:'Alyuminiy'},g:'material'},{k:'deck2',l:'Ikkinchi qavat (tirgaklar bilan)',type:'bool'}]},
  motor:{t:'Reduktorli motorlar (2 ta)',ic:'motor',g:'gearmotor',f:[{k:'kind',l:'Turi',type:'sel',o:Object.fromEntries(Object.entries(MOT).map(([k,v])=>[k,v.n]))},{k:'rpm',l:'Aylanish (nominal kuchlanishda)',min:50,max:600,step:10,u:'rpm'},{k:'vr',l:'Nominal kuchlanish',type:'sel',o:{3:'3 V',6:'6 V',12:'12 V'}}]},
  wheel:{t:"G'ildiraklar",ic:'wheel',g:'wheel',f:[{k:'d',l:'Diametri',min:30,max:100,step:1,u:'mm'},{k:'w',l:'Eni',min:8,max:30,step:1,u:'mm'},{k:'tire',l:'Shina',type:'sel',o:{rubber:'Rezina (yaxshi tutadi)',plastic:'Plastik (sirpanadi)'}}]},
  caster:{t:'Sharikli tayanch',ic:'dot',g:'caster',f:[{k:'d',l:'Sharik diametri',min:8,max:25,step:1,u:'mm'},{k:'mat',l:'Sharik',type:'sel',o:{steel:"Po'lat",plastic:'Plastik'}}]},
  mcu:{t:'Mikrokontroller',ic:'chip',g:'mcu',f:[{k:'kind',l:'Plata',type:'sel',o:Object.fromEntries(Object.entries(MCU).map(([k,v])=>[k,v.n]))}]},
  drv:{t:'Motor drayveri',ic:'bolt',g:'driver',f:[{k:'kind',l:'Mikrosxema',type:'sel',o:Object.fromEntries(Object.entries(DRV).map(([k,v])=>[k,v.n]))}]},
  sens:{t:'Sensorlar',ic:'target',g:'ultrasonic',f:[{k:'us',l:'Ultratovush HC-SR04',type:'bool',g:'ultrasonic'},{k:'line',l:'Chiziq sensorlari (2 ta TCRT5000)',type:'bool',g:'linesens'},{k:'gap',l:'Chiziq sensorlari orasidagi masofa',min:10,max:60,step:1,u:'mm'},{k:'div',l:"ECHO uchun kuchlanish bo'lgich (1k/2k)",type:'bool'}]},
  bat:{t:'Batareya',ic:'battery',g:'holder',f:[{k:'kind',l:'Turi',type:'sel',o:Object.fromEntries(Object.entries(BAT).map(([k,v])=>[k,v.n]))},{k:'mah',l:"Sig'im",min:500,max:5000,step:100,u:'mAh',g:'mah'},{k:'sw',l:"O'chirgich",type:'sel',o:{rocker:'Klavishali (2 A)',slide:'Surma (0,5 A)'},g:'switch'}]}},
 presets:{
  avoider:{name:"To'siqdan qochuvchi robot",desc:'Uno + L298N + TT motorlar + HC-SR04',purpose:'avoid',p:{chassis:{len:200,wid:140,th:3,mat:'acrylic',deck2:false},motor:{kind:'tt',rpm:200,vr:6},wheel:{d:65,w:26,tire:'rubber'},caster:{d:15,mat:'steel'},mcu:{kind:'uno'},drv:{kind:'l298n'},sens:{us:true,line:false,gap:30,div:false},bat:{kind:'li2',mah:2600,sw:'rocker'}}},
  liner:{name:"Chiziq bo'ylab yuruvchi",desc:'Nano + TB6612 + N20 + 2 IQ sensor',purpose:'line',p:{chassis:{len:150,wid:120,th:3,mat:'pla',deck2:false},motor:{kind:'n20',rpm:200,vr:6},wheel:{d:42,w:16,tire:'rubber'},caster:{d:10,mat:'steel'},mcu:{kind:'nano'},drv:{kind:'tb6612'},sens:{us:false,line:true,gap:30,div:false},bat:{kind:'lipo2',mah:850,sw:'rocker'}}},
  esp:{name:'ESP32 Wi-Fi robot',desc:'ESP32 + DRV8833 + N20, ikki qavatli',purpose:'learn',p:{chassis:{len:170,wid:130,th:3,mat:'acrylic',deck2:true},motor:{kind:'n20',rpm:200,vr:6},wheel:{d:48,w:18,tire:'rubber'},caster:{d:12,mat:'steel'},mcu:{kind:'esp32'},drv:{kind:'drv8833'},sens:{us:true,line:false,gap:30,div:true},bat:{kind:'li2',mah:2600,sw:'rocker'}}}},
 steps:[
  {id:'chassis',t:'Shassi',ic:'frame',cats:['chassis'],slots:()=>['chassis'],intro:"Shassi — barcha detallar mahkamlanadigan plastina. Uzunligi va eni robot qanchalik barqaror va epchil bo'lishini belgilaydi."},
  {id:'drive',t:"Motorlar va g'ildiraklar",ic:'motor',cats:['motor','wheel','caster'],slots:()=>['motL','motR','wL','wR','caster'],intro:"Ikki motor alohida boshqariladi (differensial yuritma): bir xil tezlik — to'g'ri yuradi, har xil — buriladi. Uchinchi tayanch — sharik."},
  {id:'brain',t:'Arduino va drayver',ic:'chip',cats:['mcu','drv'],slots:()=>['mcu','drv'],intro:"Arduino pini atigi ~20 mA beradi — motorni to'g'ridan-to'g'ri aylantira olmaydi. Drayver (H-ko'prik) kichik signal bilan katta tokni boshqaradi va yo'nalishni almashtiradi."},
  {id:'sensors',t:'Sensorlar',ic:'target',cats:['sens'],slots:B=>[B.p.sens.us&&'us',B.p.sens.line&&'line'].filter(Boolean),intro:"Sensorlar robotning 'ko'zi': HC-SR04 masofani tovush aks-sadosi bilan o'lchaydi, IQ sensorlar poldagi qora chiziqni ko'radi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"Asosiy qoida: barcha GND lar bitta umumiy nuqtaga ulanadi. ENA/ENB — PWM pinlarga (Uno'da ~ belgili: 3, 5, 6, 9, 10, 11)."},
  {id:'battery',t:"Batareya va o'chirgich",ic:'battery',cats:['bat'],slots:()=>['bat','sw'],intro:"Motorlar va Arduino bitta batareyadan ishlaydi. Motor ishga tushganda kuchlanish pasayadi — Arduino qayta yuklanmasligi uchun zaxira kerak."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Maydonda sinov',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar va Arduino kodi",ic:'list'}],
 req:{motL:'chassis',motR:'chassis',wL:'motL',wR:'motR',caster:'chassis',mcu:'chassis',drv:'chassis',us:'chassis',line:'chassis',bat:'chassis',sw:'bat'},
 labels:{chassis:'rchassis',motL:'gearmotor',motR:'gearmotor',wL:'wheel',wR:'wheel',caster:'caster',mcu:'mcu',drv:'driver',us:'ultrasonic',line:'linesens',bat:'holder',sw:'switch'}};

T.derive=B=>{const p=B.p,M=MOT[p.motor.kind],Dv=DRV[p.drv.kind],U=MCU[p.mcu.kind],Bt=BAT[p.bat.kind],vr=+p.motor.vr;
 const mah=p.bat.mah,cap=mah/1000;
 const wCh=p.chassis.len/10*p.chassis.wid/10*p.chassis.th/10*{acrylic:1.19,pla:.9,alu:2.7}[p.chassis.mat]*(p.chassis.deck2?1.8:1)+(p.chassis.deck2?10:0),wMot=M.w,wWh=p.wheel.d*p.wheel.w*.012+4,wCas=p.caster.d*p.caster.d*(p.caster.mat==='steel'?.04:.012)+5,
  wSens=(p.sens.us?9+4:0)+(p.sens.line?7:0),wBat=p.bat.kind==='lipo2'?mah*.026*2+12:Bt.w*(p.bat.kind.startsWith('aa')?1:mah/2600*.6+.4),wWire=18;
 const AUW=wCh+2*wMot+2*wWh+wCas+U.w+Dv.w+wSens+wBat+wWire+(p.bat.sw==='rocker'?4:2);
 // kuchlanish: ichki qarshilik va drayver yo'qotishi bilan
 const Irun1=M.irun*(1+AUW/600),Ibase=U.i+Dv.q+(p.sens.us?.015:0)+(p.sens.line?.04:0),Iavg=2*Irun1+Ibase,Vb=Bt.v-Iavg*Bt.ri,Vm=Math.max(0,Vb-Dv.drop),k=Vm/vr;
 const rpm=p.motor.rpm*k*.8,v=rpm*Math.PI*p.wheel.d/1000/60,Ist=M.ist*k,IstAll=2*Ist+Ibase,VbStart=Bt.v-IstAll*Bt.ri;
 const tq=M.tq/p.motor.rpm*k,force=2*tq*9.81/100/(p.wheel.d/2000)*(p.wheel.tire==='rubber'?1:.6),acc=force/(AUW/1000),grip=(p.wheel.tire==='rubber'?.9:.45)*9.81*.7;
 const tRun=cap*.75/Iavg*60*(p.bat.kind.startsWith('aa')?.8:1),track=(p.chassis.wid+p.wheel.w)/1000;
 const area=p.chassis.len*p.chassis.wid*(p.chassis.deck2?1.8:1),need=(p.mcu.kind==='uno'?69*53:p.mcu.kind==='nano'?45*18:52*28)+(p.drv.kind==='l298n'?43*43:22*20)+(p.bat.kind==='aa6'?60*58:p.bat.kind==='aa4'?62*58:p.bat.kind==='li2'?77*41:70*35)+(p.motor.kind==='tt'?2*70*22:p.motor.kind==='jga25'?2*60*25:0);
 const stop=v*v/(2*Math.min(Math.max(acc,.5),grip))+v*.06;
 return{AUW,wCh,wMot,wWh,wCas,wSens,wBat,Vb,Vm,VbStart,k,rpm,v,vTop:v,Ist,Irun1,Iavg,tRun,acc:Math.min(acc,grip),track,fit:need/area,stop,V:Vb,Vn:Bt.v,
  parts:[['Shassi',wCh],['Motorlar',2*wMot],["G'ildiraklar",2*wWh+wCas],['Arduino',U.w],['Drayver',Dv.w],['Sensorlar',wSens],['Batareya',wBat],['Simlar va boshqa',wWire+4]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>{const vm=Vm*t/100,sp=p.motor.rpm*vm/vr*.8*Math.PI*p.wheel.d/1000/60,ia=2*M.irun*(1+AUW/600)*t/100+Ibase,pw=ia*Vb;return{t,thrust:sp*3.6,watt:pw,amp:ia,eff:pw>0?sp*3.6/pw*100:0}})}};
T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW)+' g'},{l:'Tezlik',v:fmt(D.v*100)+' sm/s'},{l:'Motor kuchlanishi',v:fmt(D.Vm,1)+' V',lvl:D.k>1.35||D.k<.55?'bad':D.k<.75?'warn':'ok'},{l:'Ishlash vaqti',v:fmt(D.tRun)+' daq'},{l:"Tormoz yo'li",v:fmt(D.stop*100)+' sm',lvl:D.stop>.18?'warn':'ok'},{l:'Joylashuv',v:fmt(D.fit*100)+' %',lvl:D.fit>.95?'bad':D.fit>.8?'warn':'ok'}];
T.wextra=B=>{const w=B.wires;return{revL:w.mLa==='OUT2'&&w.mLb==='OUT1',revR:w.mRa==='OUT4'&&w.mRb==='OUT3'}};
const pinNum=pid=>pid?(/^A\d/.test(pid)?pid:pid.replace(/^[DG]/,'')):null;
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y}),Dv=DRV[p.drv.kind],U=MCU[p.mcu.kind],Bt=BAT[p.bat.kind],w=B.wires;
 if(D.k>1.35)add('bad',`Motorlar ortiqcha kuchlanishda: ${fmt(D.Vm,1)} V (nominal ${p.motor.vr} V)`,"Cho'tkalar tez yeyiladi, motor qiziydi. Nominali yuqoriroq motor yoki pastroq kuchlanish tanlang.");
 else if(D.k<.55)add('bad',`Motorlarga kuchlanish yetmaydi: ${fmt(D.Vm,1)} V`,p.drv.kind==='l298n'?"L298N o'zida ~2 V yo'qotadi. TB6612 yoki DRV8833 drayver oling, yoki batareyani kuchaytiring.":"Batareya kuchlanishi past.");
 else if(D.k<.75)add('warn',`Motorlar sust: ${fmt(D.Vm,1)} V`,p.drv.kind==='l298n'?"L298N ~2 V yo'qotadi — MOSFET drayver (TB6612) samaraliroq.":"");
 if(Bt.v>Dv.vmax)add('bad',`Drayver kuyadi: batareya ${fmt(Bt.v,1)} V, ${Dv.n.split(' ')[0]} maks. ${Dv.vmax} V`,'Kuchliroq drayver yoki kamroq element oling.');
 if(D.Irun1>Dv.cont)add('bad',`Drayver toki yetmaydi (${fmt(D.Irun1,2)} / ${Dv.cont} A)`,'Kuchliroq drayver kerak.');
 if(D.Ist>Dv.peak)add('warn',`Ishga tushishda tok ${fmt(D.Ist,1)} A — drayver cho'qqisi ${Dv.peak} A`,"Keskin start va to'xtashda drayver himoyaga o'tadi. Tezlikni PWM bilan asta oshiring.");
 if(D.VbStart<(U.logic===5?6.6:4.5)&&w.mcuP==='VIN')add('warn',`Motorlar ishga tushganda kuchlanish ${fmt(D.VbStart,1)} V gacha tushadi`,`Arduino VIN ga kamida ~7 V kerak — aks holda u qayta yuklanib qoladi. ${p.bat.kind.startsWith('aa')?'AA batareyalarning ichki qarshiligi katta: 18650 yoki LiPo yaxshiroq.':'Batareyani kuchaytiring.'}`);
 if(Bt.v>12&&w.mcuP==='VIN')add('warn','VIN ga 12 V dan yuqori','Arduino stabilizatori qiziydi.');
 if(w.mcuP==='5V'&&Bt.v>5.5)add('bad',`Batareya (${fmt(Bt.v,1)} V) Arduino 5V piniga ulangan — plata kuyadi`,"5V pini stabilizatordan keyin turadi. Batareya faqat VIN ga ulanadi.");
 if(B.inst.mcu&&B.inst.drv&&!w.mcuG)add('bad','Umumiy GND yo\'q',"Arduino GND batareya minusiga ulanmagan. Signal kuchlanishi GND ga nisbatan o'lchanadi — drayver buyruqlarni tushunmaydi.");
 if(p.sens.us&&U.logic<5&&!p.sens.div)add('warn',"HC-SR04 ECHO (5 V) ESP32 ga to'g'ridan-to'g'ri ulangan","ESP32 pinlari 3,3 V ga mo'ljallangan. 1 kΩ / 2 kΩ kuchlanish bo'lgichini qo'shing.");
 if(p.sens.line&&p.sens.gap<26)add('warn',`Chiziq sensorlari juda yaqin (${p.sens.gap} mm)`,"Chiziq eni ~25 mm: ikkala sensor ham bir vaqtda chiziqni ko'radi va robot qayerga burilishni bilmaydi. Masofani 30–40 mm qiling.");
 if(p.sens.line&&p.sens.gap>50)add('warn',`Chiziq sensorlari juda uzoq (${p.sens.gap} mm)`,"Keskin burilishda chiziq ikki sensor orasidan chiqib ketadi.");
 if(B.purpose==='avoid'&&!p.sens.us)add('bad',"Ultratovush sensori yo'q","To'siqdan qochish uchun HC-SR04 kerak.");
 if(B.purpose==='line'&&!p.sens.line)add('bad',"Chiziq sensorlari yo'q","Chiziq bo'ylab yurish uchun 2 ta IQ sensor kerak.");
 if(B.purpose==='line'&&D.v>.6)add('warn',`Chiziq uchun juda tez (${fmt(D.v*100)} sm/s)`,"Burilishda chiziqdan chiqib ketadi. Sekinroq motor yoki kichikroq g'ildirak oling (0,2–0,5 m/s).");
 if(B.purpose==='avoid'&&D.stop>.18)add('warn',`Tormoz yo'li ${fmt(D.stop*100)} sm`,"Robot 20 sm masofada to'xtashga ulgurmaydi. Sekinroq yuring.");
 if(D.fit>.95)add('bad',`Detallar shassiga sig'maydi (${fmt(D.fit*100)} %)`,"Kattaroq shassi yoki ikkinchi qavat oling.");else if(D.fit>.8)add('warn',`Shassi tig'iz (${fmt(D.fit*100)} %)`,'Simlar uchun joy qolmaydi.');
 if(p.bat.sw==='slide'&&2*D.Ist>.5)add('warn',"Surma o'chirgich kuchsiz",`Ishga tushish toki ~${fmt(2*D.Ist,1)} A — 0,5 A li o'chirgich kuyadi. Klavishali (2 A) oling.`);
 if(p.caster.d/2+3<p.wheel.d/2*.35)add('info','Sharikli tayanch past',"Sharik balandligi g'ildirak o'qiga mos kelmasa robot oldinga qiyshayadi — tirgak (spacer) qo'shiladi.");
 if(U.pwm&&B.inst.drv){for(const id of Dv.en?['ena','enb']:['in1','in2','in3','in4']){const n=+pinNum(w[id]);if(w[id]&&!U.pwm.includes(n))add('warn',`${id.toUpperCase()} ${w[id]} — PWM pin emas`,`Tezlikni boshqarish uchun PWM pin kerak (${U.pwm.join(', ')}).`)}}
 return L};

T.wiring=B=>{const p=B.p,U=MCU[p.mcu.kind],Dv=DRV[p.drv.kind],esp=p.mcu.kind==='esp32';
 const dig=esp?['G13','G12','G14','G27','G26','G25','G33','G32','G23','G22','G21','G19','G18','G5','G4','G15']:['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'];
 const inOnly=esp?['G34','G35','G36','G39']:['A0','A1','A2','A3'],out=dig,pwm=esp?dig:dig.filter(x=>U.pwm.includes(+x.slice(1)));
 const lab=x=>esp?x.replace('G','IO'):(U.pwm&&U.pwm.includes(+x.slice(1))?'~'+x:x);
 const left=[...dig,...inOnly],n=left.length,sp=500/(n-1);
 const mcuB={id:'mcu',label:U.n,x:620,y:70,w:250,h:520,need:'mcu',pads:[...left.map((x,i)=>({id:x,t:'sig',x:620,y:80+i*sp,l:lab(x),title:inOnly.includes(x)?(esp?'Faqat kirish (input-only) pini':'Analog kirish'):(pwm.includes(x)?'Raqamli pin, PWM bor':'Raqamli pin')})),
  {id:'5V',t:'5v',x:870,y:120,l:'5V',title:'5 V chiqish (stabilizatordan keyin)'},{id:'3V3',t:'5v',x:870,y:180,l:'3V3',title:'3,3 V chiqish'},{id:'VIN',t:'9v',x:870,y:250,l:'VIN',title:'VIN — tashqi quvvat kirishi (7–12 V)'},
  {id:'GND1',t:'gnd',x:870,y:340,l:'GND'},{id:'GND2',t:'gnd',x:870,y:400,l:'GND'},{id:'GND3',t:'gnd',x:870,y:460,l:'GND'}]};
 const drvB={id:'drv',label:Dv.n.split(' (')[0],x:150,y:250,w:250,h:180,need:'drv',pads:[{id:'OUT1',t:'motor',x:180,y:250,l:Dv.en&&p.drv.kind==='l298n'?'OUT1':'A01'},{id:'OUT2',t:'motor',x:230,y:250,l:p.drv.kind==='l298n'?'OUT2':'A02'},{id:'OUT3',t:'motor',x:320,y:250,l:p.drv.kind==='l298n'?'OUT3':'B01'},{id:'OUT4',t:'motor',x:370,y:250,l:p.drv.kind==='l298n'?'OUT4':'B02'},
  {id:'VM',t:'vbat',x:200,y:430,l:'VM +',title:'Motor quvvati (batareya +)'},{id:'DGND',t:'gnd',x:270,y:430,l:'GND'}]};
 const sig=(id,l,ok,col='#fdd835')=>({id,l,col,kind:'sig',ok,grp:'pin',w:2.5});
 const enL=p.drv.kind==='tb6612'?['PWMA','AIN1','AIN2','BIN1','BIN2','PWMB']:['ENA','IN1','IN2','IN3','IN4','ENB'];
 const comps=[
  {id:'motL',label:'Chap motor',x:200,y:120,need:'motL',wires:[{id:'mLa',l:'+',col:'#e53935',kind:'motor',ok:['OUT1','OUT2'],grp:'mL',w:3},{id:'mLb',l:'−',col:'#222',kind:'motor',ok:['OUT2','OUT1'],grp:'mL',w:3}]},
  {id:'motR',label:"O'ng motor",x:360,y:120,need:'motR',wires:[{id:'mRa',l:'+',col:'#e53935',kind:'motor',ok:['OUT3','OUT4'],grp:'mR',w:3},{id:'mRb',l:'−',col:'#222',kind:'motor',ok:['OUT4','OUT3'],grp:'mR',w:3}]},
  {id:'xt60',label:'Batareya (o\'chirgich orqali)',x:230,y:580,need:'drv',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VM'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['DGND'],w:4}]},
  {id:'mcupwr',label:'Arduino quvvati',x:470,y:600,need:'mcu',wires:[{id:'mcuP',l:'+',col:'#e53935',kind:'vraw',ok:['VIN'],w:3},{id:'mcuG',l:'GND',col:'#222',kind:'gnd',ok:['GND1','GND2','GND3'],w:3}]},
  {id:'drvsig',label:'Drayver boshqaruvi',x:480,y:340,need:'drv',wires:Dv.en?[sig('ena',enL[0],pwm,'#ff9800'),sig('in1',enL[1],out),sig('in2',enL[2],out),sig('in3',enL[3],out),sig('in4',enL[4],out),sig('enb',enL[5],pwm,'#ff9800')]
   :[sig('in1','IN1',pwm),sig('in2','IN2',pwm),sig('in3','IN3',pwm),sig('in4','IN4',pwm)]}];
 if(p.sens.us)comps.push({id:'us',label:'HC-SR04',x:470,y:90,need:'us',wires:[{id:'usV',l:'VCC',col:'#e53935',kind:'p5',ok:['5V'],w:2.5},{id:'usG',l:'GND',col:'#222',kind:'gnd',ok:['GND1','GND2','GND3'],w:2.5},sig('trig','TRIG',out,'#43a047'),sig('echo','ECHO',[...out,...inOnly],'#e0e0e0')]});
 if(p.sens.line)comps.push({id:'line',label:'Chiziq sensorlari',x:470,y:480,need:'line',wires:[{id:'lnV',l:'VCC',col:'#e53935',kind:'p5',ok:['5V','3V3'],w:2.5},{id:'lnG',l:'GND',col:'#222',kind:'gnd',ok:['GND1','GND2','GND3'],w:2.5},sig('lnL','L',[...inOnly,...out],'#90caf9'),sig('lnR','R',[...inOnly,...out],'#90caf9')]});
 return{boards:[drvB,mcuB],comps,hint:`Umumiy GND: Arduino GND va batareya minusi bir-biriga ulanadi. ${Dv.en?'ENA/ENB — PWM pinlarga (tezlik), IN1–IN4 — istalgan raqamli pinga (yo\'nalish).':'DRV8833 da EN yo\'q: IN1–IN4 ning hammasi PWM pinlarga.'} Motor simlari teskari ulansa, o'sha g'ildirak orqaga aylanadi.`}};

// ---------- 3D model (sm) ----------
T.build=(B,D,ctx)=>{const p=B.p,c=B.col,X=!!window.XRAY,M=MOT[p.motor.kind],L=p.chassis.len/10,W=p.chassis.wid/10,th=p.chassis.th/10,R=p.wheel.d/20,ww=p.wheel.w/10;
 const motH=p.motor.kind==='tt'?2.25:p.motor.kind==='jga25'?2.5:1.0,axY=R,plY=axY+motH/2+.15,top=plY+th,zAx=L*.18,deck=p.chassis.deck2?3:0;
 const plMat=X?MAT('xrr',()=>new THREE.MeshPhysicalMaterial({color:c.chassis,transparent:true,opacity:.2,depthWrite:false})):p.chassis.mat==='acrylic'?MAT('acr'+c.chassis,()=>new THREE.MeshPhysicalMaterial({color:c.chassis,roughness:.08,metalness:0,transmission:.6,thickness:.3,transparent:true,opacity:.75,clearcoat:1})):p.chassis.mat==='alu'?mMetal(c.chassis,.35):mPlastic(c.chassis,.6);
 const brass=mMetal('#c9a227',.3),blk=mPlastic('#111',.45),hdr=mPlastic('#0d0d0d',.4);
 // shassi: yumaloq burchakli plastina, montaj teshiklari, ikkinchi qavat va latun tirgaklar
 {const g=new THREE.Group();g.add(rbox(W,th,L,Math.min(W,L)*.18,plMat,0,plY+th/2,0));
  for(const sx of[-1,1])for(const sz of[-.4,-.1,.2,.42]){const h=cyl(.16,.16,th+.02,mPlastic('#0a0a0a',.8),sx*W*.38,plY+th/2,sz*L,12);g.add(h)}
  if(deck){g.add(rbox(W*.92,th,L*.7,Math.min(W,L)*.16,plMat,0,top+deck+th/2,-L*.05));for(const sx of[-1,1])for(const sz of[-.35,.25])g.add(cyl(.28,.28,deck,brass,sx*W*.36,top+deck/2,sz*L-L*.05,6))}
  ctx.add('chassis',g,[0,0,0])}
 // reduktorli motorlar (shassi ostida), kronshteyn bilan
 const motor=(s)=>{const g=new THREE.Group(),mc=mPlastic(c.motor,.5),can=mMetal('#c4c9cf',.25);
  if(p.motor.kind==='tt'){const bx=s*(W/2-2.9);g.add(box(5.4,2.25,1.9,mc,bx,axY,zAx));const mm=cyl(1,1,2.1,can,bx-s*3.6,axY,zAx,24);mm.rotation.z=Math.PI/2;g.add(mm);g.add(box(.5,.3,.5,mPlastic('#fafafa',.5),bx+s*2.9,axY,zAx));
   g.add(box(.25,.25,.25,mCopper(),bx-s*4.7,axY+.5,zAx));g.add(box(.25,.25,.25,mCopper(),bx-s*4.7,axY-.5,zAx))}
  else if(p.motor.kind==='n20'){const bx=s*(W/2-.8);g.add(box(.9,1.0,1.2,mMetal('#d4d8dd',.25),bx,axY,zAx));const mm=cyl(.6,.6,1.5,can,bx-s*1.2,axY,zAx,20);mm.rotation.z=Math.PI/2;g.add(mm);
   g.add(box(1.4,.2,1.8,mMetal('#30343a',.4),bx-s*.6,axY+.65,zAx));const sh=cyl(.15,.15,.9,mMetal('#eee',.2),bx+s*.9,axY,zAx,10);sh.rotation.z=Math.PI/2;g.add(sh)}
  else{const bx=s*(W/2-3.2);const mm=cyl(1.25,1.25,6,mMetal('#c4c9cf',.25),bx,axY,zAx,28);mm.rotation.z=Math.PI/2;g.add(mm);g.add(box(1.2,2.6,2.6,mMetal('#9aa3ad',.3),bx+s*3.3,axY,zAx));g.add(box(.4,2.6,3.2,mMetal('#30343a',.4),bx+s*2.4,axY+.3,zAx))}
  g.add(wireMesh([[s*(W/2-5),axY+.6,zAx],[s*W*.2,plY-.2,zAx-.5],[s*W*.15,top+.4,L*.28]],s<0?'#e53935':'#222',.06));return g};
 ctx.add('motL',motor(-1),[-4,-2,0]);ctx.add('motR',motor(1),[4,-2,0]);
 for(const[s,id]of[[-1,'wL'],[1,'wR']]){const wh=mkWheel(p.wheel.d,p.wheel.w,p.wheel.tire==='rubber'?'terrain':'slick',c.rim,c.tire);wh.position.set(s*(W/2+ww/2+.35),axY,zAx);if(s<0)wh.rotation.y=Math.PI;ctx.add(id,wh,[s*5,0,0])}
 // sharikli tayanch: korpus, latun tirgak, po'lat sharik
 {const g=new THREE.Group(),r=p.caster.d/20,cz=-L*.38,h=plY-2*r;g.add(sph(r,p.caster.mat==='steel'?mMetal('#e3e6ea',.08):mPlastic('#f5f5f5',.3),0,r,cz));g.add(cyl(r*1.25,r*1.1,r*1.2,blk,0,r*1.6,cz,20));
  if(h>r*2.2)g.add(cyl(.3,.3,h-r*1.6,brass,0,r*2.2+(h-r*2.2)/2,cz,6));ctx.add('caster',g,[0,-3,0])}
 // mikrokontroller platasi
 const mcuY=deck?top+deck+th:top,mz=deck?-L*.05:-L*.12;
 {const g=new THREE.Group(),k=p.mcu.kind;g.position.set(0,mcuY+.5,mz);
  if(k==='uno'){const pw=5.34,pl=6.86;g.add(box(pw,.16,pl,mPCB('#00798c','UNO'),0,0,0));g.add(box(.9,.4,3.5,blk,0,.25,.2));for(const sx of[-1,1])g.add(box(.26,.85,sx<0?4.2:3.4,hdr,sx*(pw/2-.25),.5,-.4));
   g.add(box(1.2,1.1,1.6,mMetal('#c9ced4',.25),-pw*.27,.6,pl/2-.6));g.add(box(.9,1.1,1.4,blk,pw*.3,.6,pl/2-.6));g.add(box(.5,.3,.5,mPlastic('#ddd',.4),pw*.35,.2,-pl*.38));g.add(sph(.08,mGlow('#4caf50'),-pw*.3,.12,-pl*.3));
   for(const sx of[-1,1])for(const sz of[-1,1])g.add(cyl(.2,.2,.5,brass,sx*pw*.4,-.3,sz*pl*.42,6))}
  else if(k==='nano'){g.add(box(1.8,.16,4.5,mPCB('#1565c0','NANO'),0,0,0));for(const sx of[-1,1])g.add(box(.25,.85,4,hdr,sx*.76,.5,0));g.add(box(.8,.2,.8,blk,0,.15,0));g.add(box(.8,.4,.9,mMetal('#c9ced4',.25),0,.25,2.1));g.add(box(4,.3,2.6,mPlastic('#fafafa',.6),0,-.35,0))}
  else{g.add(box(2.8,.16,5.15,mPCB('#1b1b1b','ESP32'),0,0,0));g.add(box(1.8,.32,1.6,mMetal('#c9ced4',.2),0,.25,-1.4));g.add(box(1.8,.06,.6,mPlastic('#111'),0,.1,-2.35));for(const sx of[-1,1])g.add(box(.25,.85,4.6,hdr,sx*1.2,.5,.2));g.add(box(.8,.4,.9,mMetal('#c9ced4',.25),0,.25,2.4));g.add(sph(.07,mGlow('#e53935'),.6,.12,1.6))}
  ctx.add('mcu',g,[0,6,0])}
 // drayver
 {const g=new THREE.Group(),k=p.drv.kind;g.position.set(0,top+.45,L*.27);
  if(k==='l298n'){g.add(box(4.3,.16,4.3,mPCB('#c62828','L298N'),0,0,0));const hs=new THREE.Group();hs.add(box(2.4,.4,1.6,blk,0,.3,0));for(let i=0;i<7;i++)hs.add(box(.12,2.2,1.6,blk,-1.08+i*.36,1.5,0));hs.position.z=-.6;g.add(hs);
   for(const[x,z,n]of[[-1.75,-.6,2],[1.75,-.6,2],[0,1.75,3]]){const t=box(n===3?2.4:.9,.95,n===3?.9:1.6,mPlastic('#1e5fbf',.5),x,.55,z);g.add(t)}g.add(box(1.8,.85,.26,hdr,.8,.5,.9))}
  else{const col=k==='tb6612'?'#5e35b1':'#1565c0',s2=k==='tb6612'?2.03:1.8;g.add(box(s2,.16,2.03,mPCB(col,k==='tb6612'?'TB6612':'8833'),0,0,0));g.add(box(.6,.12,.5,blk,0,.12,0));for(const sx of[-1,1])g.add(box(.25,.85,1.9,hdr,sx*(s2/2-.2),.5,0));g.add(box(s2+1,.3,2.8,mPlastic('#fafafa',.6),0,-.3,0))}
  // rangli jumper simlar Arduinoga
  const cols=['#ff9800','#fdd835','#43a047','#1e88e5','#8e24aa','#e53935'];cols.forEach((cl,i)=>g.add(wireMesh([[-1+i*.4,.9,-1],[-1+i*.35,2+i*.15,-(L*.27-mz)/2],[-.9+i*.3,mcuY-top+1,-(L*.27-mz)+2.6]],cl,.05)));
  ctx.add('drv',g,[0,5,4])}
 // HC-SR04: oldingi qirrada, "ko'zlari" oldinga qaragan; kronshteyn
 if(p.sens.us){const g=new THREE.Group();g.position.set(0,top+1.6,-L/2+.2);g.add(box(4.5,2,.16,mPCB('#1565c0','HC-SR04'),0,0,0));
  for(const sx of[-1,1]){const tr=cyl(.8,.8,1.2,mMetal('#c4c9cf',.25),sx*1.3,0,-.65,28);tr.rotation.x=Math.PI/2;g.add(tr);const ms=cyl(.62,.62,.05,mPlastic('#1a1a1a',.9),sx*1.3,0,-1.27,28);ms.rotation.x=Math.PI/2;g.add(ms)}
  g.add(box(.5,.4,.3,mMetal('#d4d8dd',.2),0,.6,-.2));g.add(box(1,.25,.85,hdr,0,-1,.4));g.add(box(5,.3,1.2,mPlastic(c.accent,.5),0,-1.25,.4));ctx.add('us',g,[0,2,-5])}
 // IQ chiziq sensorlari: oldingi qism ostida, polga qaragan
 if(p.sens.line){const g=new THREE.Group(),gap=p.sens.gap/10;for(const sx of[-1,1]){const s=new THREE.Group();s.position.set(sx*gap/2,plY-.9,-L*.42);s.add(box(1.4,.16,3.2,mPCB('#1565c0','TCRT'),0,0,0));
   s.add(cyl(.25,.25,.5,mPlastic('#111',.3),-.25,-.35,-1.1,12));s.add(cyl(.25,.25,.5,mPlastic('#cfe8ff',.2),.25,-.35,-1.1,12));s.add(box(.4,.4,.4,mPlastic('#1e5fbf',.5),0,.2,.5));s.add(cyl(.2,.2,.9,brass,0,.5,0,6));g.add(s)}ctx.add('line',g,[0,-3,-3])}
 // batareya
 {const g=new THREE.Group(),k=p.bat.kind,by=deck?top:top,bz=deck?-L*.05:L*.02;g.position.set(0,by,bz);
  if(k==='aa4'||k==='aa6'){const n=k==='aa4'?4:6,cols2=k==='aa4'?4:3,rows=k==='aa4'?1:2;g.add(box(cols2*1.45+.4,1.55,rows*5.3+.4,blk,0,.78,0));
   for(let i=0;i<n;i++){const col=i%cols2,row=Math.floor(i/cols2),cy=cyl(.7,.7,4.9,mPaint(i%2?'#c62828':'#1b1b1b','satin'),(col-(cols2-1)/2)*1.45,1.1,(row-(rows-1)/2)*5.3,20);cy.rotation.x=Math.PI/2;g.add(cy)}}
  else if(k==='li2'){g.add(box(4.1,1.2,7.7,blk,0,.6,0));for(const sx of[-1,1]){const cy=cyl(.9,.9,6.5,mPaint('#1e88e5','satin'),sx*1,1.05,0,24);cy.rotation.x=Math.PI/2;g.add(cy)}}
  else{const bt=mkBattery(2,p.bat.mah,'lipo','#263238',[`2S ${p.bat.mah}mAh`,'7.4V','']);g.add(bt)}
  g.add(wireMesh([[.4,.9,3],[.6,1.5,L*.15],[.5,.6,L*.25-bz+L*.02]],'#e53935',.08));g.add(wireMesh([[-.4,.9,3],[-.6,1.4,L*.15],[-.3,.6,L*.25-bz+L*.02]],'#222',.08));ctx.add('bat',g,[0,6,0])}
 {const g=new THREE.Group(),sx=W/2-.9;g.add(box(1.3,.9,.8,blk,sx,top+.45,L*.4));g.add(box(.9,.35,.5,mPlastic(p.bat.sw==='rocker'?'#d32f2f':'#eeeeee',.4),sx,top+1,L*.4));ctx.add('sw',g,[3,3,0])}};

// ---------- hisob, panel matnlari ----------
T.catInfo=(cat,d,p,a)=>{
 if(cat==='chassis'){a("Shassi og'irligi",fmt(d.wCh)+' g');a('Joylashuv',fmt(d.fit*100)+' %');a('Koleya',fmt(d.track*1000)+' mm')}
 if(cat==='motor'||cat==='wheel'){a('Motor kuchlanishi',fmt(d.Vm,1)+' V');a('Aylanish (yuk ostida)',fmt(d.rpm)+' rpm');a('Tezlik',fmt(d.v*100)+' sm/s');a('Tezlanish',fmt(d.acc,1)+' m/s²');a('Ishga tushish toki',fmt(d.Ist,2)+' A × 2')}
 if(cat==='caster'){a('Sharik balandligi',fmt(p.caster.d)+' mm');a("G'ildirak o'qi",fmt(p.wheel.d/2)+' mm')}
 if(cat==='mcu'||cat==='drv'){a('Mantiq kuchlanishi',MCU[p.mcu.kind].logic+' V');a("Drayver yo'qotishi",DRV[p.drv.kind].drop+' V');a('Motor toki / drayver',`${fmt(d.Irun1,2)} / ${DRV[p.drv.kind].cont} A`)}
 if(cat==='sens'){a("Tormoz yo'li",fmt(d.stop*100)+' sm');a('Tezlik',fmt(d.v*100)+' sm/s')}
 if(cat==='bat'){a('Kuchlanish (yuk ostida)',fmt(d.Vb,1)+' V');a('Startda',fmt(d.VbStart,1)+' V');a("O'rtacha tok",fmt(d.Iavg,2)+' A');a('Ishlash vaqti',fmt(d.tRun)+' daq')}};
T.ext=D=>[['Tezlik',fmt(D.v*100)+' sm/s'],['Tezlanish',fmt(D.acc,1)+' m/s²'],["O'rtacha tok",fmt(D.Iavg,2)+' A'],['Startdagi kuchlanish',fmt(D.VbStart,1)+' V'],["Tormoz yo'li",fmt(D.stop*100)+' sm'],['Koleya',fmt(D.track*1000)+' mm']];
T.startTitle="Sinov maydoniga tayyor";
T.startNote="Robot 5×5 m fanera maydonda, qora chiziq va to'siqlar bor. Rejimni tanlang: qo'lda yoki Arduino dasturi bilan avtonom.";
T.linkMsg=()=>"Drayver boshqaruv simlari ulanmagan — Arduino motorlarni boshqara olmaydi.";
T.armMsg=S=>({manual:"W/S — oldinga/orqaga, A/D — burilish",avoid:"Avtonom: robot to'siqlarni o'zi aylanib o'tadi",line:"Avtonom: robot qora chiziq bo'ylab yuradi"}[S.mode]||'');
T.camMin=.55;T.camMinY=.18;T.pilotCam=[0,0,0];
T.simInit=(S,B,WC,ex)=>{S.pos.set(ARENA.x,0,ARENA.z+ARENA.line);S.yaw=Math.PI/2;T.pilotCam=[ARENA.x+2.2,1.5,ARENA.z+2.6];
 const w=WC.works,iss=T.issues(B,S.D);S.link=w.drvsig&&w.xt60;S.mcuOk=w.mcupwr&&!iss.some(i=>/kuyadi/.test(i.t)&&i.lvl==='bad');S.gndOk=!!B.wires.mcuG;S.usOk=B.p.sens.us&&w.us;S.lineOk=B.p.sens.line&&w.line;
 S.revL=!!ex.revL;S.revR=!!ex.revR;S.vL=0;S.vR=0;S.ai={st:'fwd',t:0,dir:1,last:0};S.wh={};S.model.traverse(o=>{if(o.userData.slot==='wL')S.wh.L=o;if(o.userData.slot==='wR')S.wh.R=o})};
function rayDist(x,z,dx,dz,max){let best=max;for(const o of ARENA.obs){let t0=-1e9,t1=1e9;for(const[p,d,lo,hi]of[[x,dx,o.x-o.hw,o.x+o.hw],[z,dz,o.z-o.hd,o.z+o.hd]]){if(Math.abs(d)<1e-9){if(p<lo||p>hi){t0=1e9;break}}else{let a=(lo-p)/d,b=(hi-p)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b)}}if(t0<=t1&&t0>0&&t0<best)best=t0}return best}
T.simTick=(S,dt,I,{soc})=>{const B=S.B,D=S.D,p=B.p,sag=.85+.15*soc;let cL=0,cR=0;
 const dir=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw)),right=new V3(-dir.z,0,dir.x),hl=p.chassis.len/2000;
 const run=S.armed&&soc>0&&S.mcuOk&&S.gndOk;
 if(S.armed&&!S.gndOk&&!S.gMsg){S.gMsg=1;S.status="Motorlar qimirlamayapti: Arduino GND batareya minusiga ulanmagan (umumiy GND yo'q)."}
 if(S.armed&&!S.mcuOk&&!S.mMsg){S.mMsg=1;S.status="Arduino yoqilmadi: quvvat simi noto'g'ri ulangan yoki plata kuygan."}
 if(run){if(S.mode==='manual'){const f=clamp((I.thrUp||KEYS.ArrowUp?1:0)-(I.thrDn||KEYS.ArrowDown?1:0)+(-STK.l.y),-1,1),t=clamp((KEYS.KeyA||KEYS.ArrowLeft?1:0)-(KEYS.KeyD||KEYS.ArrowRight?1:0)+(-STK.r.x),-1,1);cL=clamp(f-t*.7,-1,1);cR=clamp(f+t*.7,-1,1)}
  else if(S.mode==='avoid'){if(!S.usOk){if(!S.uMsg){S.uMsg=1;S.status="HC-SR04 ishlamayapti (o'rnatilmagan yoki simlari noto'g'ri) — avtonom rejim mumkin emas."}}
   else{const sx=S.pos.x+dir.x*hl,sz=S.pos.z+dir.z*hl,dist=Math.min(rayDist(sx,sz,dir.x,dir.z,4),rayDist(sx+right.x*.03,sz+right.z*.03,dir.x,dir.z,4));S.ai.t-=dt;
    if((S.ai.last-=dt)<=0){S.ai.last=.4;S.status=`HC-SR04: ${dist>=4?'> 400':fmt(dist*100)} sm · ${S.ai.st==='fwd'?'oldinga':S.ai.st==='back'?'orqaga':'burilmoqda'}`}
    if(S.ai.st==='fwd'){cL=cR=.75;if(dist<.22){S.ai.st='back';S.ai.t=.35}}
    else if(S.ai.st==='back'){cL=cR=-.6;if(S.ai.t<=0){S.ai.st='turn';S.ai.t=rnd(.35,.7);S.ai.dir=Math.random()<.5?1:-1}}
    else{cL=.6*S.ai.dir;cR=-.6*S.ai.dir;if(S.ai.t<=0)S.ai.st='fwd'}}}
  else if(S.mode==='line'){if(!S.lineOk){if(!S.lMsg){S.lMsg=1;S.status="Chiziq sensorlari ishlamayapti (o'rnatilmagan yoki simlari noto'g'ri)."}}
   else{const g2=p.sens.gap/2000,fx=S.pos.x+dir.x*hl*.85,fz=S.pos.z+dir.z*hl*.85,on=(ox,oz)=>Math.abs(Math.hypot(ox-ARENA.x,oz-ARENA.z)-ARENA.line)<.0125;
    const sL=on(fx-right.x*g2,fz-right.z*g2),sR=on(fx+right.x*g2,fz+right.z*g2),base=.55;
    if(sL&&!sR){cL=0;cR=base;S.ai.dir=1}else if(sR&&!sL){cL=base;cR=0;S.ai.dir=-1}else if(sL&&sR){cL=cR=base*.6}else{cL=cR=base;if(S.ai.lost>.25){cL=S.ai.dir>0?-.2:base;cR=S.ai.dir>0?base:-.2}}
    S.ai.lost=(!sL&&!sR)?(S.ai.lost||0)+dt:0;if((S.ai.last-=dt)<=0){S.ai.last=.3;S.status=`IQ sensorlar: chap ${sL?'QORA':'oq'} · o'ng ${sR?'QORA':'oq'}`}}}}
 if(S.revL)cL=-cL;if(S.revR)cR=-cR;
 if(S.armed&&(S.revL||S.revR)&&(cL||cR)&&!S.revMsg){S.revMsg=1;S.status=`${S.revL&&S.revR?'Ikkala':S.revL?'Chap':"O'ng"} motor teskari aylanmoqda — simlarini (+ va −) almashtiring.`}
 const vmax=D.v*sag,tc=Math.min(1,dt/.12);S.vL+=(cL*vmax-S.vL)*tc;S.vR+=(cR*vmax-S.vR)*tc;
 const v=(S.vL+S.vR)/2,w=(S.vR-S.vL)/D.track;S.yaw+=w*dt;S.vel.copy(dir).multiplyScalar(v);S.pos.addScaledVector(S.vel,dt);
 // to'qnashuv: robot aylanasi va to'siqlar (devorlar ham)
 const rr=Math.hypot(p.chassis.len,p.chassis.wid)/2000*.85;for(const o of ARENA.obs){const cx=clamp(S.pos.x,o.x-o.hw,o.x+o.hw),cz=clamp(S.pos.z,o.z-o.hd,o.z+o.hd),dx=S.pos.x-cx,dz=S.pos.z-cz,dd=Math.hypot(dx,dz);
  if(dd<rr){const nx=dd>1e-6?dx/dd:-dir.x,nz=dd>1e-6?dz/dd:-dir.z;S.pos.x=cx+nx*rr;S.pos.z=cz+nz*rr;if(Math.abs(v)>.15&&!S.bump){S.bump=1;setTimeout(()=>{if(SIM)SIM.bump=0},1500);snd('err');if(S.mode==='manual')S.status="To'siqqa urildi."}}}
 S.pos.y=0;S.pitch=clamp(-(cL+cR)*.01,-.03,.03);S.roll=0;
 const da=dt/(p.wheel.d/2000);if(S.wh.L)S.wh.L.rotation.x-=S.vL*da;if(S.wh.R)S.wh.R.rotation.x-=S.vR*da;
 const I_A=S.armed?D.Irun1*(Math.abs(cL)+Math.abs(cR))+.08:.05;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.amp=I_A;S.volt=D.Vb*sag;
 if(soc<=0&&S.armed){S.armed=false;S.status='Batareya tugadi.'}
 humSet(S.armed&&(Math.abs(S.vL)+Math.abs(S.vR))>.01,Math.min(1,(Math.abs(cL)+Math.abs(cR))/2)*.6)};

// ---------- detallar ro'yxati va Arduino kodi ----------
T.bom=(B,D)=>{const p=B.p,M=MOT[p.motor.kind];return[['rchassis',`Shassi ${p.chassis.len}×${p.chassis.wid}×${p.chassis.th} mm`,{acrylic:'Akril',pla:'PLA',alu:'Alyuminiy'}[p.chassis.mat]+(p.chassis.deck2?', 2 qavat + 4 latun tirgak M3×30':''),1,D.wCh],
 ['gearmotor',`${M.n}, ${p.motor.rpm} rpm @ ${p.motor.vr} V`,'Kronshteyn va M3 vintlar bilan',2,D.wMot],['wheel',`G'ildirak Ø${p.wheel.d}×${p.wheel.w} mm`,p.wheel.tire==='rubber'?'Rezina shina':'Plastik',2,D.wWh],['caster',`Sharikli tayanch Ø${p.caster.d} mm`,p.caster.mat==='steel'?"Po'lat sharik":'Plastik sharik',1,D.wCas],
 ['mcu',MCU[p.mcu.kind].n,'USB kabel bilan',1,MCU[p.mcu.kind].w],['driver',DRV[p.drv.kind].n,'',1,DRV[p.drv.kind].w],
 ...(p.sens.us?[['ultrasonic','HC-SR04 ultratovush sensori + kronshteyn',p.sens.div?"1 kΩ + 2 kΩ rezistor (ECHO bo'lgich)":'',1,13]]:[]),...(p.sens.line?[['linesens','TCRT5000 IQ chiziq sensori moduli',`Oraliq ${p.sens.gap} mm`,2,3.5]]:[]),
 ['holder',`${BAT[p.bat.kind].n} ${p.bat.mah} mAh`,p.bat.kind==='lipo2'?'XT30 ulagich bilan':'Ushlagich bilan',1,D.wBat],['switch',p.bat.sw==='rocker'?"Klavishali o'chirgich 2 A":"Surma o'chirgich",'',1,3],
 ['wire','Jumper simlar (ota-ona) 20 sm × 20, M3 vint va gaykalar','',1,18]]};
T.codeTitle='Arduino kodi (avtomatik yaratildi)';
T.code=(B,D,WC)=>{const p=B.p,w=B.wires,en=DRV[p.drv.kind].en,esp=p.mcu.kind==='esp32',pn=id=>pinNum(w[id])||'/* ulanmagan */ -1',mode=B.purpose==='line'?'LINE':B.purpose==='avoid'?'AVOID':'MANUAL',L=[];
 const o=s=>L.push(s);
 o(`// ${B.name} — Konstruktor tomonidan yaratilgan`);o(`// Plata: ${MCU[p.mcu.kind].n} · Drayver: ${DRV[p.drv.kind].n}`);o(`// Motorlar: ${MOT[p.motor.kind].n}, g'ildirak ${p.wheel.d} mm`);o('');
 o(`#define MODE_${mode}   // MODE_AVOID | MODE_LINE | MODE_MANUAL`);o('');
 if(en){o(`const int ENA = ${pn('ena')};   // chap motor tezligi (PWM)`);o(`const int IN1 = ${pn('in1')};`);o(`const int IN2 = ${pn('in2')};`);o(`const int IN3 = ${pn('in3')};`);o(`const int IN4 = ${pn('in4')};`);o(`const int ENB = ${pn('enb')};   // o'ng motor tezligi (PWM)`)}
 else{o(`const int AIN1 = ${pn('in1')}, AIN2 = ${pn('in2')};   // chap motor (ikkalasi PWM)`);o(`const int BIN1 = ${pn('in3')}, BIN2 = ${pn('in4')};   // o'ng motor`)}
 if(p.sens.us){o(`const int TRIG = ${pn('trig')};`);o(`const int ECHO = ${pn('echo')};${esp&&!p.sens.div?'   // DIQQAT: ESP32 uchun 1k/2k bo\'lgich kerak':''}`)}
 if(p.sens.line){o(`const int LINE_L = ${pn('lnL')};`);o(`const int LINE_R = ${pn('lnR')};`)}
 o('');o(`const int SPEED = ${Math.round(clamp(B.purpose==='line'?.55:.75,0,1)*255)};   // 0..255`);o(`const int STOP_CM = 20;`);o('');
 o('// chap va o\'ng motor: -255..255 (manfiy — orqaga)');o('void drive(int l, int r) {');
 if(en){o('  digitalWrite(IN1, l >= 0); digitalWrite(IN2, l < 0);');o('  digitalWrite(IN3, r >= 0); digitalWrite(IN4, r < 0);');o('  analogWrite(ENA, abs(l)); analogWrite(ENB, abs(r));')}
 else{o('  if (l >= 0) { analogWrite(AIN1, l); analogWrite(AIN2, 0); } else { analogWrite(AIN1, 0); analogWrite(AIN2, -l); }');o('  if (r >= 0) { analogWrite(BIN1, r); analogWrite(BIN2, 0); } else { analogWrite(BIN1, 0); analogWrite(BIN2, -r); }')}
 o('}');o('');
 if(p.sens.us){o('long distanceCm() {');o('  digitalWrite(TRIG, LOW);  delayMicroseconds(2);');o('  digitalWrite(TRIG, HIGH); delayMicroseconds(10);');o('  digitalWrite(TRIG, LOW);');o('  long us = pulseIn(ECHO, HIGH, 25000);   // 25 ms ≈ 4 m');o('  return us == 0 ? 400 : us / 58;        // tovush 2 tomonga: 29 µs/sm × 2');o('}');o('')}
 o('void setup() {');o('  Serial.begin(115200);');o(en?'  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);\n  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);':'  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT); pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);');
 if(p.sens.us)o('  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);');if(p.sens.line)o('  pinMode(LINE_L, INPUT); pinMode(LINE_R, INPUT);');o('  drive(0, 0);');o('  delay(1000);   // yoqilgandan keyin 1 s kutish');o('}');o('');
 o('void loop() {');
 o('#if defined(MODE_AVOID)');if(p.sens.us){o('  long d = distanceCm();');o('  if (d < STOP_CM) {');o('    drive(-SPEED, -SPEED); delay(350);        // orqaga chekinish');o('    if (random(2)) drive(SPEED, -SPEED); else drive(-SPEED, SPEED);');o('    delay(random(350, 700));                  // tasodifiy tomonga burilish');o('  } else {');o('    drive(SPEED, SPEED);');o('  }');o('  delay(30);')}else o('  // HC-SR04 o\'rnatilmagan');
 o('#elif defined(MODE_LINE)');if(p.sens.line){o('  bool l = digitalRead(LINE_L);   // TCRT5000: qora = 1');o('  bool r = digitalRead(LINE_R);');o('  if (l && !r)      drive(0, SPEED);        // chiziq chapda — chapga');o('  else if (r && !l) drive(SPEED, 0);        // chiziq o\'ngda — o\'ngga');o('  else              drive(SPEED, SPEED);    // chiziq o\'rtada');}else o('  // chiziq sensorlari o\'rnatilmagan');
 o('#else');o('  // Serial orqali: w a s d x (Bluetooth modul HC-05 ham shunday ishlaydi)');o('  if (Serial.available()) {');o('    char c = Serial.read();');o("    if (c == 'w') drive(SPEED, SPEED);");o("    if (c == 's') drive(-SPEED, -SPEED);");o("    if (c == 'a') drive(-SPEED, SPEED);");o("    if (c == 'd') drive(SPEED, -SPEED);");o("    if (c == 'x') drive(0, 0);");o('  }');o('#endif');o('}');
 const miss=['in1','in2','in3','in4',...(en?['ena','enb']:[]),...(p.sens.us?['trig','echo']:[]),...(p.sens.line?['lnL','lnR']:[])].filter(k=>!w[k]);
 if(miss.length)L.unshift(`// DIQQAT: ${miss.length} ta pin hali ulanmagan (${miss.join(', ')}). "Ulash" bosqichida simlarni ulang.`);
 return L.join('\n')};
regType(T);
})();
