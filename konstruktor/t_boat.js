/* =====================================================================
   RC KATER (tezyurar qayiq: V-korpus yoki katamaran)
     parrak qadam tezligi  v = rpm · P / 60, sirpanish ~25 %
     glissirlash (planing) chegarasi ≈ 1,5·√(g·L)
     kerakli quvvat (glissirlashda)  P ≈ m·g·v / (L/D ≈ 5) / 0,6
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,liion:3.6},DENS={lipo:.026,liion:.0145},CMAX={lipo:150,liion:15};
const HULL={vhull:{n:'Chuqur V-korpus (deep-V)',ld:5,stab:1},cat:{n:'Katamaran (ikki korpusli)',ld:6.5,stab:1.6},mono:{n:'Yassi tubli (sayr qayig\'i)',ld:3.5,stab:1.2}};
const T={id:'boat',name:'RC kater',ic:'boat',desc:"Tezyurar qayiq: V-korpus, katamaran yoki sayr qayig'i.",defPreset:'deepv',defPurpose:'speed',
 purposes:{speed:{t:'Tezlik',note:'Glissirlash va suv sovutish shart'},sport:{t:'Sayr / sport',note:'Barqarorlik va uzoq suzish'}},
 colors:{hull:'#f2f4f6',deck:'#1565c0',accent:'#ff6d00',motor:'#30343a',prop:'#c9a227',bat:'#2e7d32'},
 paint:[['hull','Korpus'],['deck','Paluba qopqog\'i'],['accent','Chiziqlar'],['motor','Motor'],['prop','Parrak (bronza)'],['bat','Batareya']],
 spec:{
  hull:{t:'Korpus',ic:'boat',g:'hull',f:[{k:'kind',l:'Turi',type:'sel',o:Object.fromEntries(Object.entries(HULL).map(([k,v])=>[k,v.n]))},
   {k:'len',l:'Uzunligi',min:40,max:150,step:1,u:'sm'},{k:'beam',l:'Eni',min:10,max:45,step:.5,u:'sm'},{k:'dead',l:"Tub burchagi (deadrise)",min:5,max:25,step:1,u:'°',g:'deadrise'},
   {k:'mat',l:'Material',type:'sel',o:{glass:'Shisha tola (fiberglass)',abs:'ABS plastik',wood:"Fanera"},g:'material'}]},
  motor:{t:'Motor',ic:'motor',g:'motor',f:[{k:'kv',l:'KV',min:800,max:6000,step:50,u:'KV',g:'kv'},{k:'d',l:'Korpus diametri',min:28,max:56,step:1,u:'mm'},{k:'len',l:'Korpus uzunligi',min:30,max:100,step:1,u:'mm'},{k:'cool',l:'Suv bilan sovutish (gilza)',type:'bool',g:'watercool'}]},
  prop:{t:'Suv parragi',ic:'prop',g:'boatprop',f:[{k:'d',l:'Diametr',min:25,max:80,step:1,u:'mm'},{k:'pr',l:'Qadam/diametr nisbati',min:1,max:2.2,step:.05,u:'P/D',g:'pitch'},{k:'b',l:'Parraklar soni',type:'sel',o:{2:'2 ta',3:'3 ta'},g:'blades'}]},
  shaft:{t:'Val va kronshteyn',ic:'wrench',g:'flexshaft',f:[{k:'d',l:'Val diametri',type:'sel',o:{'3.18':'3,18 mm (1/8")','4.76':'4,76 mm (3/16")','6.35':'6,35 mm (1/4")'}},{k:'ang',l:'Val qiyaligi',min:5,max:18,step:1,u:'°'},{k:'strut',l:'Kronshteyn balandligi',min:10,max:40,step:1,u:'mm',g:'strut'}]},
  rudder:{t:'Rul (suv)',ic:'servo',g:'rudder',f:[{k:'h',l:'Balandligi',min:20,max:90,step:1,u:'mm'},{k:'c',l:'Kengligi (vatar)',min:12,max:50,step:1,u:'mm'},{k:'pickup',l:'Suv olgich (sovutish uchun)',type:'bool',g:'watercool'}]},
  hatch:{t:'Qopqoq (luk)',ic:'boat',g:'hatch',f:[{k:'mat',l:'Material',type:'sel',o:{lexan:'Polikarbonat (Lexan)',glass:'Shisha tola',wood:'Fanera'},g:'material'},{k:'len',l:'Uzunligi (korpusdan)',min:35,max:75,step:1,u:'%'},{k:'canopy',l:'Kabina oynasi',type:'bool'},{k:'seal',l:'Germetik lenta',type:'bool'}]},
  esc:{t:'ESC',ic:'bolt',g:'esc',f:[{k:'a',l:'Tok',min:20,max:250,step:5,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{2:'2S',3:'3S',4:'4S',6:'6S'}},{k:'cool',l:'Suv bilan sovutish',type:'bool',g:'watercool'}]},
  servo:{t:'Rul servosi',ic:'servo',g:'servo',f:[{k:'tq',l:'Moment',min:2,max:30,step:.5,u:'kg·sm',g:'servo'},{k:'wp',l:'Suv o\'tkazmaydigan',type:'bool'}]},
  rx:{t:'Qabul qilgich',ic:'antenna',g:'rx',f:[{k:'ch',l:'Kanallar',type:'sel',o:{3:'3 kanal',4:'4 kanal'},g:'channel'}]},
  bat:{t:'Batareya',ic:'battery',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',liion:'Li-ion'},g:'chem'},{k:'cells',l:'Yacheykalar',min:2,max:8,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:1000,max:10000,step:100,u:'mAh',g:'mah'},{k:'c',l:'C reyting',min:10,max:120,step:5,u:'C',g:'crating'}]}},
 presets:{
  deepv:{name:'65 sm deep-V tezyurar',desc:'Suv sovutishli, 4S, 60+ km/soat',purpose:'speed',p:{hull:{kind:'vhull',len:65,beam:17,dead:20,mat:'glass'},motor:{kv:2200,d:36,len:60,cool:true},prop:{d:38,pr:1.4,b:2},shaft:{d:'4.76',ang:10,strut:22},rudder:{h:55,c:28,pickup:true},hatch:{mat:'lexan',len:58,canopy:true,seal:true},esc:{a:120,cells:4,cool:true},servo:{tq:6,wp:true},rx:{ch:3},bat:{chem:'lipo',cells:4,mah:5000,c:50}}},
  cat:{name:'80 sm katamaran',desc:'Barqaror, yuqori tezlikda ham buriladi',purpose:'speed',p:{hull:{kind:'cat',len:80,beam:26,dead:12,mat:'glass'},motor:{kv:1400,d:40,len:68,cool:true},prop:{d:42,pr:1.5,b:2},shaft:{d:'4.76',ang:8,strut:28},rudder:{h:65,c:32,pickup:true},hatch:{mat:'glass',len:55,canopy:true,seal:true},esc:{a:150,cells:6,cool:true},servo:{tq:10,wp:true},rx:{ch:3},bat:{chem:'lipo',cells:6,mah:5000,c:60}}},
  cruise:{name:'50 sm sayr qayig\'i',desc:"Sekin, barqaror, uzoq suzadi",purpose:'sport',p:{hull:{kind:'mono',len:50,beam:18,dead:6,mat:'abs'},motor:{kv:1400,d:28,len:40,cool:false},prop:{d:35,pr:1.1,b:3},shaft:{d:'3.18',ang:12,strut:16},rudder:{h:45,c:26,pickup:false},hatch:{mat:'wood',len:62,canopy:true,seal:true},esc:{a:30,cells:3,cool:false},servo:{tq:4,wp:true},rx:{ch:3},bat:{chem:'lipo',cells:3,mah:3000,c:25}}}},
 steps:[
  {id:'hull',t:'Korpus',ic:'boat',cats:['hull'],slots:()=>['hull'],intro:"Korpus shakli tezlik va barqarorlikni belgilaydi: chuqur V to'lqinni yaxshi kesadi, katamaran keng va barqaror, yassi tub — sekin sayr uchun."},
  {id:'drive',t:'Motor, val va parrak',ic:'motor',cats:['motor','shaft','prop'],slots:()=>['mot1','shaft','prop1'],intro:"Motor korpus ichida; egiluvchan val (flex shaft) kronshteyn orqali parrakka aylanish uzatadi. Suv parragi kichik, lekin qadami katta."},
  {id:'elec',t:'ESC, rul, qabul qilgich',ic:'bolt',cats:['esc','servo','rudder','rx'],slots:()=>['esc','servo','rudder','rx'],intro:"Tezyurar katerda ESC va motor suv bilan sovutiladi: parrak ortidagi bosim suvni trubkalar orqali haydaydi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"Kater pultida ham standart: CH1 — rul, CH2 — gaz. Suv o'tmasligi uchun ulanishlar germetiklanadi."},
  {id:'battery',t:'Batareya va qopqoq',ic:'battery',cats:['bat','hatch'],slots:()=>['bat','hatch'],intro:"Batareya korpus o'rtasiga, iloji boricha pastga — og'irlik markazi qayiq muvozanatini belgilaydi. Qopqoq lenta bilan germetiklanadi."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Suvda sinov',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{mot1:'hull',shaft:'mot1',prop1:'shaft',esc:'hull',servo:'hull',rudder:'servo',rx:'esc',bat:'esc',hatch:'bat'},
 labels:{hull:'hull',mot1:'motor',shaft:'flexshaft',prop1:'boatprop',esc:'esc',servo:'servo',rudder:'rudder',rx:'rx',bat:'battery',hatch:'hatch'}};

T.derive=B=>{const p=B.p,h=p.hull,m=p.motor,pr=p.prop,ba=p.bat,H=HULL[h.kind];
 const area=h.len*h.beam*(h.kind==='cat'?1.5:1.25),dens={glass:.16,abs:.2,wood:.22}[h.mat],wHull=area*dens*(1+h.len/300);
 const wMot=.0029*m.d*m.d*m.len+(m.cool?18:0),Pm=.012*m.d*m.d*m.len*(m.cool?1.15:.85),wEsc=30+p.esc.a*.35+(p.esc.cool?15:0),wServo=25+p.servo.tq*1.6,wRx=12,wProp=pr.d*pr.d*.004*pr.b,sd=+(p.shaft&&p.shaft.d||4.76),wShaft=h.len*(.25+sd*sd*.02)+10+(p.shaft?p.shaft.strut*.4:8),
  ru=p.rudder||{h:50,c:28},wRud=ru.h*ru.c*.012+12,ha=p.hatch||{mat:'lexan',len:58},wHatch=h.len*h.beam*ha.len/100*{lexan:.045,glass:.08,wood:.11}[ha.mat]+8;
 const Vn=ba.cells*NOM[ba.chem],V=Vn*.93,wBat=ba.cells*ba.mah*DENS[ba.chem]+ba.cells*3+12,AUW=wHull+wMot+wEsc+wServo+wRx+wProp+wShaft+wRud+wHatch+wBat+15,mkg=AUW/1000;
 const rpmMax=m.kv*V*.9,pitchM=pr.d*pr.pr/1000,vPitch=rpmMax*pitchM/60;
 // parrak yuklamasi: quvvat ~ rpm³·D⁴·(P/D)
 const Pprop=r=>1.9e-8*Math.pow(r/1000,3)*Math.pow(pr.d,4)*pr.pr*(pr.b==3?1.2:1);let overload=Pprop(rpmMax)/Pm,rpm=rpmMax;if(overload>1)rpm=rpmMax*Math.pow(1/overload,1/3);
 const vProp=rpm*pitchM/60*.75,Pneed=v=>mkg*9.81*v/H.ld/.6+.4*v*v*v*(h.beam/100)*.02;
 let vPow=vProp;if(Pneed(vProp)>Math.min(Pm,Pprop(rpm))){let lo=0,hi=vProp;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(Pneed(mid)>Math.min(Pm,Pprop(rpm)))hi=mid;else lo=mid}vPow=lo}
 const vTop=Math.min(vProp,vPow),vPlane=1.5*Math.sqrt(9.81*h.len/100),planes=vTop>vPlane;
 const Imax=Math.min(Pm,Pprop(rpm))/.85/V,Iavg=Imax*.45,capAh=ba.mah/1000,tRun=capAh*.8/Iavg*60,cmax=Math.min(ba.c,CMAX[ba.chem]);
 const draft=mkg/(1000*(h.len/100)*(h.beam/100)*.6)*100,stab=h.beam/h.len*4*H.stab;
 const rudA=ru.h*ru.c/100,servoNeed=1+mkg*vTop*.04+rudA*vTop*vTop*.0006,turn=clamp(rudA/(h.len*.35),.25,2.5),shaftOk=pr.d<=sd*12,Pact=Math.min(Pm,Pprop(rpm));
 return{AUW,wHull,wMot,Pm,wEsc,wServo,wBat,wProp,wShaft,V,Vn,rpm,overload,vPitch,vProp,vPow,vTop,vPlane,planes,Imax,Iavg,tRun,cmax,batMaxA:capAh*cmax,draft,stab,servoNeed,Pact,turn,shaftOk,sd,rudA,wRud,wHatch,
  parts:[['Korpus',wHull],['Motor',wMot],['Val va parrak',wShaft+wProp],['Rul',wRud],['Qopqoq',wHatch],['ESC',wEsc],['Servo',wServo],['Batareya',wBat],["Qabul qilgich va boshqa",wRx+15]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>{const v=vTop*t/100,pw=Math.min(Pm,Pneed(v));return{t,thrust:v*3.6,watt:pw,amp:pw/.85/V,eff:pw>0?v*3.6/pw*100:0}})}};
T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW/1000,2)+' kg'},{l:'Maks. tezlik',v:fmt(D.vTop*3.6)+' km/soat'},{l:'Glissirlash',v:D.planes?'ha':"yo'q",lvl:D.planes?'ok':'warn'},
 {l:'Motor yuklamasi',v:fmt(D.overload*100)+' %',lvl:D.overload>1.4?'bad':D.overload>1.1?'warn':'ok'},{l:'Cho\'kish (draft)',v:fmt(D.draft,1)+' sm'},{l:'Suzish vaqti',v:fmt(D.tRun)+' daq'}];
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y});
 if(D.overload>1.4)add('bad',`Parrak juda katta — motor kuyadi (${fmt(D.overload*100)}%)`,'Diametri yoki qadami kichikroq parrak oling, yoki KV ni pasaytiring.');else if(D.overload>1.1)add('warn',`Motor og'ir yuklangan (${fmt(D.overload*100)}%)`,"To'liq gazni qisqa ishlating.");
 if(D.Pact>250&&!p.motor.cool)add('bad','Motor suv bilan sovutilmagan',`~${fmt(D.Pact)} W quvvatda yopiq korpus ichida motor 1–2 daqiqada qizib ketadi. Suv sovutish gilzasini yoqing.`);
 if(D.Imax>40&&!p.esc.cool)add('warn','ESC suv bilan sovutilmagan','Yuqori tokda ESC qiziydi — suv sovutish plitasi kerak.');
 if(p.bat.cells>+p.esc.cells)add('bad',`Batareya ${p.bat.cells}S, ESC ${p.esc.cells}S gacha`,'ESC kuyadi.');
 if(D.Imax>p.esc.a*1.1)add('bad',`ESC toki yetmaydi (${fmt(D.Imax)} / ${p.esc.a} A)`,'Kuchliroq ESC oling.');else if(D.Imax>p.esc.a*.9)add('warn',`ESC chegarada (${fmt(D.Imax)} / ${p.esc.a} A)`,'');
 if(D.Imax>D.batMaxA)add('warn',`Batareya toki yetmaydi (${fmt(D.batMaxA)} / ${fmt(D.Imax)} A)`,'Yuqori C reyting kerak.');
 if(!D.planes&&B.purpose==='speed')add('warn',`Glissirlamaydi (${fmt(D.vTop*3.6)} < ${fmt(D.vPlane*3.6)} km/soat)`,"Qayiq suvni yorib suzadi, tezlik oshmaydi. Kuchliroq motor yoki yengilroq korpus kerak.");
 if(D.stab<.9)add('warn',"Ag'darilishga moyil",`En/uzunlik nisbati kichik (${fmt(D.stab,2)}). Kengroq korpus yoki katamaran barqarorroq.`);
 if(!p.servo.wp)add('warn',"Servo suv o'tkazmaydigan emas",'Korpusga tushgan suv servoni ishdan chiqaradi.');
 if(p.servo.tq<D.servoNeed)add('warn',`Rul servosi kuchsiz (${p.servo.tq} < ${fmt(D.servoNeed,1)} kg·sm)`,"Yuqori tezlikda rul suv bosimiga dosh bermaydi.");
 if(!D.shaftOk)add('bad',`Val juda ingichka (${D.sd} mm) — ${p.prop.d} mm parrak uchun`,"Katta parrak momenti ingichka valni buraydi va uzadi. 4,76 mm yoki 6,35 mm val oling.");
 if(p.motor.cool&&p.rudder&&!p.rudder.pickup)add('bad','Sovutish suvi olinmaydi',"Suv sovutish gilzasi bor, lekin rulda suv olgich (pickup) yo'q — suv aylanmaydi va motor qiziydi.");
 if(p.hatch&&!p.hatch.seal)add('warn',"Qopqoq germetiklanmagan","To'lqin va burilishda suv korpusga kiradi; elektronika ho'l bo'ladi. Qopqoq chetiga lenta yopishtiring.");
 if(D.turn<.45)add('warn','Rul kichik — sekin buriladi',`Rul maydoni ${fmt(D.rudA,1)} sm². Kattaroq rul oling.`);
 if(p.shaft&&p.shaft.ang>14&&D.vTop>12)add('info','Val qiyaligi katta',"Katta qiyalik parrak kuchini pastga yo'naltiradi — tumshuq ko'tarilib sakraydi. Tezyurar katerlar uchun 8–12°.");
 if(p.hull.dead<10&&p.hull.kind==='vhull'&&D.vTop>12)add('info','Kichik tub burchagi',"Tez suzishda to'lqinda qattiq urilib sakraydi; 18–22° tavsiya.");
 return L};
T.catInfo=(cat,d,p,a)=>{
 if(cat==='hull'){a("Korpus og'irligi",fmt(d.wHull)+' g');a("Cho'kish (draft)",fmt(d.draft,1)+' sm');a('Barqarorlik',fmt(d.stab,2));a('Glissirlash tezligi',fmt(d.vPlane*3.6)+' km/soat')}
 if(cat==='motor'||cat==='prop'||cat==='shaft'){a('Maks. quvvat',fmt(d.Pm)+' W');a('Motor yuklamasi',fmt(d.overload*100)+' %');a('Aylanish',fmt(d.rpm,-2)+' rpm');a('Parrak qadam tezligi',fmt(d.vPitch*3.6)+' km/soat');a('Maks. tezlik',fmt(d.vTop*3.6)+' km/soat')}
 if(cat==='shaft'){a('Valga mos parrak',`≤ ${fmt(d.sd*12)} mm ${d.shaftOk?'<i class=i-ok></i>':'<i class=i-bad></i>'}`)}
 if(cat==='esc'||cat==='rx'){a('Cho\'qqi tok / ESC',`${fmt(d.Imax)} / ${p.esc.a} A`)}
 if(cat==='servo'||cat==='rudder'){a('Rul maydoni',fmt(d.rudA,1)+' sm²');a('Burilish',fmt(d.turn,2));a('Kerakli servo',fmt(d.servoNeed,1)+' kg·sm')}
 if(cat==='bat'||cat==='hatch'){a('Kuchlanish',fmt(d.Vn,1)+' V');a('Suzish vaqti',fmt(d.tRun)+' daq');a("Umumiy og'irlik",fmt(d.AUW)+' g')}};
T.ext=D=>[['Glissirlash tezligi',fmt(D.vPlane*3.6)+' km/soat'],['Parrak qadam tezligi',fmt(D.vPitch*3.6)+' km/soat'],['Cho\'qqi tok',fmt(D.Imax)+' A'],['Barqarorlik',fmt(D.stab,2)],['Kerakli servo',fmt(D.servoNeed,1)+' kg·sm'],['Rul maydoni',fmt(D.rudA,1)+' sm²']];
T.startTitle='Suvga tushirishga tayyor';
T.startNote="Kater ko'l qirg'og'idagi pirs yonida. <b>W</b> — gaz, <b>A/D</b> — rul. Rul faqat qayiq harakatlanganda buradi.";
T.linkMsg=()=>"ESC signal kabeli CH2 ga ulanmagan — qabul qilgich quvvatsiz (BEC), motor ishlamaydi.";
T.armMsg=()=>"W/S — gaz, A/D — rul. Qirg'oqqa urilmang!";
T.pilotCam=[0,0,0];
T.simInit=(S,B)=>{S.pos.set(LAKE.x,0,LAKE.z+LAKE.r-6);S.yaw=0;S.spd=0;S.sink=Math.min(S.D.draft,6)/100;S.pos.y=.03-S.sink;T.pilotCam=[LAKE.x+1.6,1.4,LAKE.z+LAKE.r-2.5];S.wakeT=0;S.rud=null;S.model.traverse(o=>{if(o.userData.rudder)S.rud=o})};
T.simTick=(S,dt,I,{g,soc})=>{const B=S.B,D=S.D,p=B.p,m=D.AUW/1000,sag=.85+.15*soc;
 let thr=0;if(S.armed&&soc>0)thr=(I.thrUp||KEYS.ArrowUp?1:0)-(I.thrDn||KEYS.ArrowDown?1:0)+(-STK.l.y);thr=clamp(thr,-1,1);if(S.rev)thr=-thr;S.thr+=(thr-S.thr)*Math.min(1,dt*5);
 const steerIn=!S.armed?0:clamp((KEYS.KeyA||KEYS.ArrowLeft?1:0)-(KEYS.KeyD||KEYS.ArrowRight?1:0)+(-STK.r.x),-1,1);
 const steer=S.ctl.steer==='CH1'?steerIn:S.ctl.steer==='CH2'?-thr:0;S.steer+=(steer-S.steer)*Math.min(1,dt*6);
 // qizish: suv sovutishsiz kuchli motor yoki sovutish suvi olinmasa
 const noCool=(!p.motor.cool&&D.Pact>250)||(p.motor.cool&&p.rudder&&!p.rudder.pickup);
 if(S.armed&&Math.abs(S.thr)>.5)S.heat+=dt*((noCool?1:0)+Math.max(0,D.overload-1.1)*2);else S.heat=Math.max(0,S.heat-dt*.3);
 let lim=1;if(S.heat>20){lim=.15;if(!S.hotMsg){S.hotMsg=1;S.status=noCool?"Motor qizib ketdi — suv sovutish ishlamayapti. ESC himoyaga o'tdi.":"Motor ortiqcha yuklangan va qizib ketdi. Kichikroq parrak oling.";puff(S,6,'#777')}}
 // tortish va qarshilik: maks. tezlikda muvozanat (k·v² = F)
 const vT=Math.max(1,D.vTop),Fmax=m*g*.55,k=Fmax/(vT*vT);let F=S.thr>0?S.thr*Fmax*sag*lim:S.thr*Fmax*.3*lim;
 const hump=D.planes&&S.spd>0&&S.spd<D.vPlane?m*g*.06*Math.sin(Math.PI*S.spd/D.vPlane):0;
 S.spd+=(F-k*S.spd*Math.abs(S.spd)-hump*Math.sign(S.spd)-.02*m*g*Math.sign(S.spd)*(Math.abs(S.spd)>.05?1:0))/m*dt;if(Math.abs(S.spd)<.05&&Math.abs(S.thr)<.02)S.spd=0;S.spd=clamp(S.spd,-vT*.4,vT*1.05);
 // rul: burilish tezligi suv oqimiga (tezlikka) proporsional
 const L=p.hull.len/100,yawRate=S.steer*D.turn*S.spd/Math.max(.3,L)*.9;S.yaw+=yawRate*dt;
 const latA=Math.abs(S.spd*yawRate);if(latA>D.stab*g*.9&&!S.fail){S.roll=Math.sign(yawRate)*1.2;crash(S,`Keskin burilishda ag'darildi: yon tezlanish ${fmt(latA/g,2)}g, barqarorlik ${fmt(D.stab,2)}. Kengroq korpus yoki katamaran barqarorroq.`)}
 const dir=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw));S.vel.copy(dir).multiplyScalar(S.spd);S.pos.addScaledVector(S.vel,dt);
 // qirg'oq
 const dx=S.pos.x-LAKE.x,dz=S.pos.z-LAKE.z,dd=Math.hypot(dx,dz);if(dd>LAKE.r-1.2){S.pos.x=LAKE.x+dx/dd*(LAKE.r-1.2);S.pos.z=LAKE.z+dz/dd*(LAKE.r-1.2);if(Math.abs(S.spd)>4&&!S.fail)crash(S,`Qirg'oqqa ${fmt(Math.abs(S.spd)*3.6)} km/soat tezlikda urildi.`);S.spd*=-.2}
 // glissirlash: tumshuq avval ko'tariladi, glissirlashga chiqqach tekislanadi; to'lqinda chayqalish
 const r=S.spd/Math.max(.5,D.vPlane),pit=r<1?.13*r:.13*Math.max(.25,1.6-r*.6);S.t2=(S.t2||0)+dt;
 S.pitch=pit+Math.sin(S.t2*2.1)*.012;if(!S.fail)S.roll=clamp(-yawRate*Math.abs(S.spd)*.012,-.3,.3)+Math.sin(S.t2*1.7)*.015;
 S.pos.y=.03-S.sink*(r>1?.45:1-.4*Math.min(1,r))+Math.sin(S.t2*2.3)*.004;
 // iz (to'lqin ko'piklari)
 S.wakeT-=dt;if(Math.abs(S.spd)>1.5&&S.wakeT<=0){S.wakeT=.06;const back=S.obj.position.clone().addScaledVector(dir,-L*.5);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:'#ffffff',transparent:true,opacity:.6,depthWrite:false}));sp.position.set(back.x,.08,back.z);sp.scale.setScalar(.2+Math.abs(S.spd)*.03);simScene.add(sp);S.smoke.push({m:sp,v:new V3(rnd(-.4,.4),.05,rnd(-.4,.4)),t:rnd(1.2,2)})}
 const I_A=S.armed?D.Imax*Math.pow(Math.abs(S.thr),2.5)*lim+.3:.15;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.amp=I_A;S.volt=D.V*sag;
 if(soc<=0&&S.armed){S.armed=false;S.status="Batareya tugadi — qayiq to'xtadi. Endi uni suzib olib chiqish kerak."}
 if(S.rev&&S.armed&&Math.abs(thr)>.3&&!S.revMsg){S.revMsg=1;S.status="Kater orqaga suzmoqda: motor teskari aylanmoqda. Motorning istalgan ikki simini almashtiring."}
 if(S.ctl.steer!=='CH1'&&!S.steerMsg&&S.armed&&(steerIn!==0||thr!==0)){S.steerMsg=1;S.status=S.ctl.steer==='CH2'?"Rul gaz bilan birga buriladi: servo CH2 ga ulangan (CH1 bo'lishi kerak).":"Rul ishlamayapti: servo CH1 ga ulanmagan."}
 humSet(S.armed&&Math.abs(S.thr)>.02,Math.min(1,Math.abs(S.thr)));S.thrIn=Math.abs(S.thr);for(const sp of S.model.userData.spinners)sp.o.rotation.y+=dt*S.thr*160;
 if(S.rud)S.rud.rotation.y=S.steer*.5};
T.wiring=B=>{const p=B.p;return{boards:[{id:'esc',label:`ESC ${p.esc.a}A`,x:260,y:230,w:200,h:170,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:310,y:400,l:'+'},{id:'VBAT-',t:'gnd',x:380,y:400,l:'−'},{id:'A',t:'motor',x:290,y:230,l:'A'},{id:'B',t:'motor',x:360,y:230,l:'B'},{id:'C',t:'motor',x:430,y:230,l:'C'}]},
  {id:'rx',label:`Qabul qilgich (${p.rx.ch} kanal)`,x:600,y:230,w:180,h:170,need:'rx',pads:Array.from({length:+p.rx.ch},(_,i)=>({id:'CH'+(i+1),t:'ch',x:600,y:250+i*(130/(p.rx.ch-1)),l:'CH'+(i+1)}))}],
 comps:[{id:'mot1',label:"Cho'tkasiz motor",x:360,y:90,need:'mot1',wires:[{id:'ma',l:'a',col:'#c58a3a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mb',l:'b',col:'#b0702a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3},{id:'mc',l:'c',col:'#d39a4a',kind:'motor',ok:['A','B','C'],grp:'mot',w:3}]},
  {id:'xt60',label:'Batareya kabeli',x:340,y:590,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]},
  {id:'escsig',label:'ESC signal (BEC)',x:520,y:520,need:'esc',wires:[{id:'escsig',l:'gaz',col:'#ff9800',kind:'servo',ok:['CH2'],w:3}]},
  {id:'servo',label:'Rul servosi',x:920,y:200,need:'servo',wires:[{id:'wservo',l:'servo',col:'#ff9800',kind:'servo',ok:['CH1'],w:3}]}],
 hint:"Kater pultida: CH1 — rul, CH2 — gaz. Motorning 3 simi istalgan tartibda — yo'nalish teskari bo'lsa (qayiq orqaga suzsa) ikkitasini almashtiring."}};
T.wextra=B=>{const w=B.wires,o=[w.ma,w.mb,w.mc];if(o.some(x=>!x)||new Set(o).size<3)return{};const i=o.map(x=>'ABC'.indexOf(x));let n=0;for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(i[a]>i[b])n++;return{motorReversed:n%2===1}};
T.build=(B,D,ctx)=>{const p=B.p,h=p.hull,c=B.col,X=!!window.XRAY,L=h.len,Bm=h.beam,dh=Math.max(5,Bm*.42),yWL=dh*.45;
 const hm=X?MAT('xrh'+c.hull,()=>new THREE.MeshPhysicalMaterial({color:c.hull,transparent:true,opacity:.22,depthWrite:false})):mPaint(c.hull,'gloss'),dm=X?MAT('xrd'+c.deck,()=>new THREE.MeshPhysicalMaterial({color:c.deck,transparent:true,opacity:.25,depthWrite:false})):mPaint(c.deck,'gloss'),ac=mPaint(c.accent,'gloss');
 // korpus: haqiqiy V-tub — o'tkir tumshuq (stem), qirrali bortlar (chine), tekis transom; har bir panel alohida silliqlanadi
 const top=dh*.55,depth=Bm*(h.kind==='mono'?.36:h.kind==='cat'?.46:.5);
 {const g=new THREE.Group();
  if(h.kind==='cat'){for(const sx of[-1,1]){const m=hullMesh(L,Bm*.17,top,depth,Math.max(h.dead,22),hm);m.position.x=sx*Bm*.33;g.add(m)}
   g.add(box(Bm*.9,dh*.22,L*.78,hm,0,top-dh*.05,L*.07))}
  else g.add(hullMesh(L,Bm/2,top,depth,h.dead,hm));
  for(const sx of[-1,1])g.add(box(.25,.3,L*.66,ac,sx*Bm*(h.kind==='cat'?.49:.475),top-depth*.25,L*.1));
  ctx.add('hull',g,[0,0,0])}
 // ustaxonada kater taglik (stend) ustida turadi: parrak va rul yerga tegmaydi
 if(ctx.step!=='test'){const wd=mPlastic('#6d4c33',.8),pb=-dh*.55-(p.shaft?p.shaft.strut/10*.45:.6)-p.prop.d/20-.6,kl=top-depth;for(const z of[-L*.22,L*.2]){const s2=new THREE.Group();s2.add(box(Bm*.8,.8,1.6,wd,0,pb+.4,z));for(const sx of[-1,1]){const u=box(.8,kl-pb+depth*.35,1.4,wd,sx*Bm*.28,(kl+pb)/2+depth*.17,z);u.rotation.z=sx*.25;s2.add(u)}ctx.deco(s2)}}
 // motor (korpus ichida, orqaga qaragan), suv sovutish gilzasi
 const mR=p.motor.d/20,mL=p.motor.len/10,mz=L*.12,my=dh*.25;
 {const g=new THREE.Group();g.position.set(0,my+mR,mz);const can=cyl(mR,mR,mL,mPaint(c.motor,'metal'),0,0,0,32);can.rotation.x=Math.PI/2;g.add(can);
  if(p.motor.cool){const j=cyl(mR*1.12,mR*1.12,mL*.8,mMetal('#9aa3ad',.3),0,0,0,32);j.rotation.x=Math.PI/2;g.add(j);g.add(wireMesh([[mR,0,-mL*.3],[mR+1.5,.5,-mL*.6],[Bm*.3,1,L*.3]],'#4fc3f7',.15))}
  g.add(box(mR*2.4,.4,mL*1.1,mPlastic('#333'),0,-mR-.2,0));ctx.add('mot1',g,[0,5,0])}
 // egiluvchan val (flex shaft): motordan qiya pastga, tubdan chiqib, kronshteyn (strut) orqali parrakka
 const pz=L/2+1.6,py=-dh*.55-(p.shaft?p.shaft.strut/10*.45:.6);
 {const g=new THREE.Group();g.add(wireMesh([[0,my+mR,mz+mL/2+.4],[0,my,L*.32],[0,-dh*.2,L*.46],[0,py,pz-.6]],'#b0b6bf',.22));
  g.add(box(.3,dh*.9,1.4,mMetal('#b0b6bf',.3),0,py+dh*.45,L/2+.6));g.add(box(.25,dh*1.1,1.6,mMetal('#b0b6bf',.3),Bm*.18,py+dh*.3,L/2+.9));ctx.add('shaft',g,[0,-3,3])}
 {const g=new THREE.Group();g.position.set(0,py,pz);g.rotation.x=-Math.PI/2;const pr=mkProp(p.prop.d/25.4,p.prop.d*p.prop.pr/25.4,+p.prop.b,'pc',c.prop,'CCW');pr.traverse(o=>{if(o.isMesh)o.material=mMetal(c.prop,.25)});g.add(pr);
  const o=ctx.add('prop1',g,[0,-3,6]);if(o&&ctx.inst('prop1'))ctx.spin(pr,1)}
 // ESC (sovutish plitasi), servo, qabul qilgich, batareya, qopqoq
 {const g=new THREE.Group();g.add(rbox(3.2,1.2,4.5,.3,mPlastic('#1e1e1e',.4),-Bm*.22,dh*.35,L*.02));if(p.esc.cool){g.add(box(3,.25,4.2,mMetal('#9aa3ad',.3),-Bm*.22,dh*.35+.7,L*.02));g.add(wireMesh([[-Bm*.22,dh*.35+.8,L*.02-2],[-Bm*.3,dh*.6,-L*.1],[0,my+mR*2.2,mz-mL/2]],'#4fc3f7',.15))}ctx.add('esc',g,[-3,5,0])}
 {const g=new THREE.Group(),sv=mkServo('micro','#263238');sv.position.set(Bm*.22,dh*.25,L*.32);g.add(sv);g.add(wireMesh([[Bm*.22,dh*.25+2.6,L*.34],[Bm*.15,dh*.6,L*.45],[Bm*.18,py+dh*.6,L/2+.9]],'#c0c4c9',.07));ctx.add('servo',g,[3,4,0])}
 {const g=new THREE.Group(),ru=p.rudder,rh=ru.h/10,rc=ru.c/10,piv=new THREE.Group();piv.position.set(Bm*.2,dh*.2,L/2+.5);
  piv.add(box(.18,rh,rc,mMetal('#c4c9cf',.25),0,-rh/2-dh*.2,rc/2));piv.add(box(1.4,.6,.5,mMetal('#9aa3ad',.3),0,0,0));
  if(ru.pickup){piv.add(cyl(.18,.18,1.6,mMetal('#c4c9cf',.25),0,-dh*.2-rh*.6,-.1));piv.add(wireMesh([[0,.3,0],[-.3,dh*.6,-1],[-Bm*.1,dh*.5,-L*.15]],'#4fc3f7',.15))}
  piv.userData.rudder=true;g.add(piv);ctx.add('rudder',g,[2,-2,4])}
 ctx.add('rx',(()=>{const g=new THREE.Group();g.add(rbox(2.2,1,3,.3,mPlastic('#202020',.4),Bm*.2,dh*.35,-L*.12));g.add(cyl(.05,.05,6,mPlastic('#111'),Bm*.2,dh*.35+3.4,-L*.12,6));return g})(),[3,6,0]);
 {const g=mkBattery(p.bat.cells,p.bat.mah,p.bat.chem,c.bat,[`${p.bat.cells}S ${p.bat.mah}mAh`,`${p.bat.c}C`,`${fmt(D.Vn,1)} V`],{hard:true,awg:12,lead:3});g.position.set(0,dh*.05,-L*.12);const d=g.userData.dims,k=Math.min(1,Bm*.55/d.w);if(k<1)g.scale.set(k,1,1);ctx.add('bat',g,[0,8,0])}
 {const g=new THREE.Group(),ha=p.hatch,hl=L*ha.len/100,hm2=ha.mat==='wood'?mPlastic('#b48a5c',.7):dm;const ty=dh*.55+Bm*.02;g.add(loft([[-hl/2-L*.08,Bm*.5,.3,ty+.15],[-hl/2,Bm*.85,1,ty+.5],[0,Bm*.9,1.3,ty+.65],[hl/2,Bm*.88,1,ty+.5]],hm2,2.6));
  if(ha.seal)g.add(box(Bm*.87,.08,hl*.98,mPlastic('#1565c0',.4),0,ty+.05,0));
  if(ha.canopy)g.add(loft([[-L*.08,Bm*.36,.3,ty+1.1],[-L*.03,Bm*.4,1.6,ty+1.5],[L*.06,Bm*.38,1.8,ty+1.6],[L*.12,Bm*.3,.3,ty+1.2]],MAT('bglass',()=>new THREE.MeshPhysicalMaterial({color:'#0e1620',roughness:.04,metalness:.3,clearcoat:1,transparent:true,opacity:.8})),2.4));
  ctx.add('hatch',g,[0,10,0])}};
T.bom=(B,D)=>{const p=B.p;return[['hull',`Korpus ${HULL[p.hull.kind].n}, ${p.hull.len} sm`,`${p.hull.beam} sm eni, ${p.hull.dead}° tub`,1,D.wHull],['motor',`Cho'tkasiz motor ${p.motor.kv}KV ${p.motor.d}×${p.motor.len}`,p.motor.cool?'Suv sovutish gilzasi bilan':'Havo bilan sovutiladi',1,D.wMot],
 ['flexshaft',`Egiluvchan val Ø${p.shaft.d} mm, qiyalik ${p.shaft.ang}°`,`Kronshteyn ${p.shaft.strut} mm, germetik vtulka`,1,D.wShaft],['boatprop',`Parrak ${p.prop.d} mm, P/D ${p.prop.pr}, ${p.prop.b} qanotli`,'Bronza yoki karbon',1,D.wProp],
 ['esc',`ESC ${p.esc.a}A ${p.esc.cells}S`,p.esc.cool?'Suv sovutish plitasi bilan':'',1,D.wEsc],['servo',`Rul servosi ${p.servo.tq} kg·sm`,p.servo.wp?"Suv o'tkazmaydigan":'',1,D.wServo],['rx',`Qabul qilgich ${p.rx.ch} kanal`,'',1,12],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C`,'',1,D.wBat],['rudder',`Rul ${p.rudder.h}×${p.rudder.c} mm`,p.rudder.pickup?'Suv olgich bilan':'',1,D.wRud],
 ['hatch',`Qopqoq: ${{lexan:'polikarbonat',glass:'shisha tola',wood:'fanera'}[p.hatch.mat]}, ${p.hatch.len}% uzunlik`,p.hatch.seal?'Germetik lenta bilan':'Germetiksiz',1,D.wHatch],
 ['watercool','Silikon trubkalar (sovutish), tortqich, mahkamlagichlar','',1,15]]};

// korpus geometriyasi: stansiyalar bo'yicha keel, chine, paluba qirrasi nuqtalari; panellar alohida (qirralar keskin)
function hullMesh(L,b0,top,depth,dead,mat0){const mat=MAT('ds'+mat0.uuid,()=>{const m=mat0.clone();m.side=THREE.DoubleSide;return m});const NS=28,ta=Math.tan(dead*DEG),st=[];
 for(let i=0;i<=NS;i++){const t=i/NS,z=(t-.5)*L,b=b0*Math.max(.02,(1-Math.pow(1-Math.min(t/.58,1),2.3)))*(t>.58?1-(t-.58)*.14:1),dY=top+depth*.16*Math.pow(1-t,2.2),
  kY=top-depth*(t<.32?.3+.7*Math.sin(t/.32*Math.PI/2):1-(t-.32)*.06),cY=Math.min(kY+b*.9*ta,dY-depth*.18);
  st.push({z,K:[0,kY],C:[b*.9,cY],D:[b,dY],M:[0,dY+b0*.05]})}
 const g=new THREE.Group(),strip=(fa,fb,n,side)=>{const pos=[],idx=[];for(const q of st){for(let j=0;j<=n;j++){const u=j/n,A=fa(q),Bq=fb(q);pos.push((A[0]+(Bq[0]-A[0])*u)*side,A[1]+(Bq[1]-A[1])*u,q.z)}}
  for(let i=0;i<NS;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+1,c=a+n+1,d=c+1;idx.push(a,c,b,b,c,d)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
  // normal tashqariga qaraganini tekshirish (kesim markazidan)
  const mi=Math.floor(NS*.6)*(n+1)+Math.floor(n/2),P=geo.attributes.position,N=geo.attributes.normal,cy=(st[Math.floor(NS*.6)].K[1]+st[Math.floor(NS*.6)].D[1])/2;
  if(N.getX(mi)*P.getX(mi)+N.getY(mi)*(P.getY(mi)-cy)<0){const I=geo.index.array;for(let k=0;k<I.length;k+=3){const t2=I[k+1];I[k+1]=I[k+2];I[k+2]=t2}geo.index.needsUpdate=true;geo.computeVertexNormals()}
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;m.userData.dispose=true;g.add(m)};
 for(const sd of[-1,1]){strip(q=>q.K,q=>q.C,4,sd);strip(q=>q.C,q=>q.D,3,sd);strip(q=>q.M,q=>q.D,3,sd)}
 // transom (orqa devor)
 {const q=st[NS],sh=new THREE.Shape([[0,q.K[1]],[q.C[0],q.C[1]],[q.D[0],q.D[1]],[0,q.M[1]],[-q.D[0],q.D[1]],[-q.C[0],q.C[1]]].map(([x,y])=>new THREE.Vector2(x,y)));const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),mat);m.position.z=q.z;m.castShadow=true;m.userData.dispose=true;g.add(m)}
 return g}
regType(T);
})();
