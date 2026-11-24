/* =====================================================================
   RC VERTOLYOT (bitta asosiy rotor + dum rotori, flybarless)
     rotor tezligi (headspeed)  rpm = KV · V · 0,9 · pinion / asosiy tishli
     maks. tortish (pichoq)     T = 0,12·σ·ρ·A·(ΩR)²,  σ = b·c / (π·R)
     muallaq turish quvvati     P = T^1,5 / √(2ρA) / FM   (FM ≈ 0,62)
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,lihv:3.8},CLS={250:{fw:110,boom:.95},450:{fw:280,boom:1},550:{fw:560,boom:1.05},700:{fw:1050,boom:1.1}};
const T={id:'heli',name:'RC vertolyot',ic:'heli',desc:"Vertolyot: asosiy va dum rotori, swashplate, flybarless boshqaruv.",defPreset:'h450',defPurpose:'sport',
 purposes:{sport:{t:'Sport / 3D',note:'Yuqori headspeed va tortish zaxirasi'},scale:{t:'Sayr (scale)',note:'Past headspeed, uzoq parvoz'}},
 colors:{canopy:'#d32f2f',canopy2:'#fafafa',frame:'#212121',blades:'#263238',boom:'#cfd8dc',skids:'#212121'},
 paint:[['canopy','Kabina (asosiy)'],['canopy2','Kabina (bezak)'],['frame','Rama'],['blades','Pichoqlar'],['boom','Dum trubasi'],['skids','Shassi']],
 spec:{
  frame:{t:'Rama va shassi',ic:'frame',g:'hframe',f:[{k:'cls',l:'Klass (o\'lcham)',type:'sel',o:{250:'250',450:'450',550:'550',700:'700'}},{k:'mat',l:'Material',type:'sel',o:{carbon:'Karbon',alu:'Alyuminiy',plastic:'Plastik'},g:'material'},{k:'skid',l:'Shassi (chang\'i) eni',min:80,max:400,step:5,u:'mm',g:'skids'}]},
  rotor:{t:'Asosiy rotor',ic:'prop',g:'mainrotor',f:[{k:'bl',l:'Pichoq uzunligi',min:150,max:720,step:5,u:'mm'},{k:'ch',l:'Pichoq vatari',min:20,max:70,step:1,u:'mm'},{k:'b',l:'Pichoqlar soni',type:'sel',o:{2:'2 ta',3:'3 ta',4:'4 ta'},g:'blades'},{k:'mat',l:'Material',type:'sel',o:{cf:'Karbon',glass:'Shisha tola',wood:'Yog\'och'},g:'material'}]},
  tail:{t:'Dum rotori va trubasi',ic:'tail',g:'tailrotor',f:[{k:'d',l:'Dum rotori diametri',min:60,max:320,step:5,u:'mm'},{k:'b',l:'Pichoqlar',type:'sel',o:{2:'2 ta',3:'3 ta'}},{k:'drive',l:'Uzatma',type:'sel',o:{belt:'Tasma (belt)',tt:'Val (torque tube)'},g:'taildrive'}]},
  motor:{t:'Motor',ic:'motor',g:'motor',f:[{k:'kv',l:'KV',min:400,max:4500,step:10,u:'KV',g:'kv'},{k:'d',l:'Stator diametri',min:22,max:60,step:1,u:'mm'},{k:'h',l:'Stator balandligi',min:6,max:40,step:1,u:'mm'}]},
  gear:{t:'Uzatma',ic:'gear',g:'gear',f:[{k:'pin',l:'Pinion tishlari',min:9,max:24,step:1,u:'T',g:'pinion'},{k:'main',l:'Asosiy tishli',min:90,max:180,step:1,u:'T',g:'gear'}]},
  esc:{t:'ESC (governor bilan)',ic:'bolt',g:'esc',f:[{k:'a',l:'Tok',min:15,max:200,step:5,u:'A',g:'escA'},{k:'cells',l:'Maks. batareya',type:'sel',o:{3:'3S',6:'6S',12:'12S'}}]},
  servo:{t:'Servolar',ic:'servo',g:'servo',f:[{k:'tq',l:'Moment (swashplate)',min:1.5,max:30,step:.5,u:'kg·sm',g:'servo'},{k:'tail',l:'Dum servosi tezligi',min:.02,max:.12,step:.01,u:'s/60°'}]},
  fbl:{t:'Flybarless tizim',ic:'cpu',g:'fbl',f:[{k:'gov',l:'Governor (headspeed ushlagich)',type:'bool',g:'governor'},{k:'rescue',l:"Qutqarish rejimi (o'zi tekislanadi)",type:'bool'}]},
  bat:{t:'Batareya',ic:'battery',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',lihv:'LiHV'},g:'chem'},{k:'cells',l:'Yacheykalar',min:2,max:12,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:300,max:6000,step:50,u:'mAh',g:'mah'},{k:'c',l:'C reyting',min:20,max:100,step:5,u:'C',g:'crating'}]}},
 presets:{
  h450:{name:'450 klass 3D',desc:'6S, 325 mm pichoqlar',purpose:'sport',p:{frame:{cls:450,mat:'carbon',skid:150},rotor:{bl:325,ch:36,b:2,mat:'cf'},tail:{d:150,b:2,drive:'belt'},motor:{kv:1800,d:28,h:20},gear:{pin:12,main:121},esc:{a:60,cells:6},servo:{tq:5,tail:.04},fbl:{gov:true,rescue:true},bat:{chem:'lipo',cells:6,mah:2200,c:40}}},
  h250:{name:'250 mini',desc:'3S, xonada ham',purpose:'sport',p:{frame:{cls:250,mat:'plastic',skid:90},rotor:{bl:205,ch:30,b:2,mat:'cf'},tail:{d:90,b:2,drive:'belt'},motor:{kv:4200,d:24,h:12},gear:{pin:15,main:120},esc:{a:30,cells:3},servo:{tq:2,tail:.03},fbl:{gov:true,rescue:true},bat:{chem:'lipo',cells:3,mah:850,c:45}}},
  h700:{name:'700 scale',desc:'12S, katta va barqaror',purpose:'scale',p:{frame:{cls:700,mat:'alu',skid:320},rotor:{bl:690,ch:62,b:3,mat:'cf'},tail:{d:300,b:3,drive:'tt'},motor:{kv:500,d:50,h:28},gear:{pin:12,main:112},esc:{a:160,cells:12},servo:{tq:20,tail:.03},fbl:{gov:true,rescue:true},bat:{chem:'lipo',cells:12,mah:5000,c:35}}}},
 steps:[
  {id:'frame',t:'Rama va shassi',ic:'frame',cats:['frame'],slots:()=>['frame','skids'],intro:"Rama ikki yon plastinadan iborat; ichida asosiy val podshipniklari. Chang'ili shassi qo'nishda zarbani yutadi."},
  {id:'drive',t:'Motor va uzatma',ic:'motor',cats:['motor','gear'],slots:()=>['mot1','gear'],intro:"Motor pinion orqali katta asosiy tishlini aylantiradi. Uzatma nisbati rotor tezligini (headspeed) belgilaydi."},
  {id:'rotor',t:'Asosiy rotor',ic:'prop',cats:['rotor'],slots:()=>['head','blades'],intro:"Rotor boshi pichoqlarni ushlaydi; swashplate servolar buyrug'ini pichoq burchagiga aylantiradi: hammasi birga — ko'tarilish (collective), navbat bilan — egilish (cyclic)."},
  {id:'tail',t:'Dum',ic:'tail',cats:['tail'],slots:()=>['boom','tailr'],intro:"Asosiy rotor vertolyotni teskari tomonga buradi (reaktiv moment). Dum rotori shu momentni muvozanatlaydi va burilishni boshqaradi."},
  {id:'elec',t:'Elektronika va servolar',ic:'cpu',cats:['esc','servo','fbl'],slots:()=>['esc','fbl','rx','sv1','sv2','sv3','svT'],intro:"Flybarless tizim (FBL) giroskop bilan vertolyotni barqaror ushlaydi va 3 ta swashplate servosini aralashtirib boshqaradi."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"Servolar FBL ga ulanadi: S1, S2, S3 — swashplate, TAIL — dum. Qabul qilgich FBL ning RX kirishiga (SBUS)."},
  {id:'battery',t:'Batareya va kabina',ic:'battery',cats:['bat'],slots:()=>['bat','canopy'],intro:"Batareya ramaning old qismiga — og'irlik markazi asosiy val ostida bo'lishi kerak."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Sinov parvozi',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{skids:'frame',mot1:'frame',gear:'mot1',head:'gear',blades:'head',boom:'frame',tailr:'boom',esc:'frame',fbl:'frame',rx:'fbl',sv1:'head',sv2:'head',sv3:'head',svT:'boom',bat:'esc',canopy:'bat'},
 labels:{frame:'hframe',skids:'skids',mot1:'motor',gear:'gear',head:'rotorhead',blades:'mainrotor',boom:'tailboom',tailr:'tailrotor',esc:'esc',fbl:'fbl',rx:'rx',sv1:'servo',sv2:'servo',sv3:'servo',svT:'servo',bat:'battery',canopy:'canopy'}};
T.derive=B=>{const p=B.p,C=CLS[p.frame.cls],rho=airDensity(B.env.alt,B.env.temp),g=9.81,b=+p.rotor.b;
 const R=(p.rotor.bl/1000)*1.12+.01,A=Math.PI*R*R,c=p.rotor.ch/1000,sig=b*c/(Math.PI*R),Vn=p.bat.cells*NOM[p.bat.chem],V=Vn*.92;
 const rpmM=p.motor.kv*V*.9,hs=rpmM*p.gear.pin/p.gear.main*(p.fbl.gov?.92:.88),Om=hs*2*Math.PI/60,tip=Om*R;
 const wFrame=C.fw*{carbon:.85,alu:1.05,plastic:1}[p.frame.mat],wBlades=b*p.rotor.bl*p.rotor.ch*.0011*{cf:1,glass:1.15,wood:.9}[p.rotor.mat],wMot=.0029*p.motor.d*p.motor.d*p.motor.h+8,Pm=.0095*p.motor.d*p.motor.d*p.motor.h;
 const wEsc=10+p.esc.a*.45,wServo=4*(6+p.servo.tq*2.2),wTail=p.tail.d*p.tail.d*.0012*+p.tail.b+R*60,wBat=p.bat.cells*p.bat.mah*.026+p.bat.cells*3+12,wElec=25,AUW=wFrame+wBlades+wMot+wEsc+wServo+wTail+wBat+wElec,W=AUW/1000*g;
 const Tblade=.12*sig*rho*A*tip*tip,FM=.62,Tpow=Math.pow(Pm*.85*FM*Math.sqrt(2*rho*A),2/3),Tmax=Math.min(Tblade,Tpow),twr=Tmax/W;
 const P0=sig*.02/8*rho*A*tip*tip*tip,Ph=(Math.pow(W,1.5)/Math.sqrt(2*rho*A)/FM+P0)*1.12,Ih=Ph/V/.88,Imax=Math.min(Pm,Tpow>Tblade?Pm*.8:Pm)/V/.88,cap=p.bat.mah/1000,tHov=cap*.8/Ih*60,tSport=cap*.8/(Ih*2.1)*60,batMaxA=cap*p.bat.c;
 const tailNeed=.17*2*R*1000,servoNeed=1.5+R*R*b*c*1000*.09*(tip/150)**2,disk=W/A;
 return{AUW,R,A,sig,hs,tip,twr,Tmax:Tmax/g*1000,Tblade:Tblade/g*1000,Tpow:Tpow/g*1000,Ph,Pm,Ih,Imax,tHov,tSport,V,Vn,batMaxA,tailNeed,servoNeed,disk,wFrame,wBlades,wMot,wEsc,wServo,wTail,wBat,vTop:Math.min(45,8+twr*9),
  parts:[['Rama va shassi',wFrame],['Pichoqlar',wBlades],['Motor',wMot],['Dum',wTail],['ESC',wEsc],['Servolar',wServo],['Batareya',wBat],['FBL va boshqa',wElec]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>{const k=t/100,th=Tmax*k*k/g*1000,pw=Math.pow(Tmax*k*k,1.5)/Math.sqrt(2*rho*A)/FM;return{t,thrust:th,amp:pw/V/.88,watt:pw,eff:pw>0?th/pw:0}})}};
T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW)+' g'},{l:'Headspeed',v:fmt(D.hs,-1)+' rpm'},{l:'Pichoq uchi tezligi',v:fmt(D.tip)+' m/s',lvl:D.tip>210||D.tip<90?'bad':D.tip>190||D.tip<110?'warn':'ok'},{l:'Tortish/og\'irlik',v:fmt(D.twr,2)+' : 1',lvl:D.twr<1.3?'bad':D.twr<1.8?'warn':'ok'},{l:'Muallaq turish',v:fmt(D.tHov,1)+' daq'},{l:'Muallaq quvvat',v:fmt(D.Ph)+' W'}];
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y});
 if(D.twr<1.3)add('bad',`Ko'tarila olmaydi (${fmt(D.twr,2)}:1)`,D.Tblade<D.Tpow?"Pichoqlar kuchsiz: headspeed past yoki pichoq kichik. Uzatmani yoki KV ni oshiring.":"Motor quvvati yetmaydi — kattaroq motor yoki ko'proq S.");else if(D.twr<1.8)add('warn',`Tortish zaxirasi kam (${fmt(D.twr,2)}:1)`,'Sport uchun 2:1 dan yuqori.');
 if(D.tip>210)add('bad',`Pichoq uchi ${fmt(D.tip)} m/s — xavfli`,"Pichoqlar markazdan qochma kuchdan sinishi mumkin; shovqin juda kuchli. Headspeedni pasaytiring.");else if(D.tip>190)add('warn',`Pichoq uchi tezligi yuqori (${fmt(D.tip)} m/s)`,'');
 if(D.tip<90)add('bad',`Headspeed juda past (${fmt(D.hs)} rpm)`,"Rotor inertsiyasi kam — boshqaruv sust, autorotatsiya imkonsiz.");
 if(p.tail.d<D.tailNeed*.75)add('bad',`Dum rotori kichik (${p.tail.d} < ${fmt(D.tailNeed)} mm)`,"Reaktiv momentni ushlay olmaydi — vertolyot gaz berilganda aylanib ketadi (tail blowout).");else if(p.tail.d<D.tailNeed*.9)add('warn','Dum rotori chegarada','');
 if(p.bat.cells>+p.esc.cells)add('bad',`Batareya ${p.bat.cells}S, ESC ${p.esc.cells}S gacha`,'ESC kuyadi.');
 if(D.Imax>p.esc.a)add('bad',`ESC toki yetmaydi (${fmt(D.Imax)} / ${p.esc.a} A)`,'');if(D.Imax>D.batMaxA)add('warn',`Batareya toki yetmaydi (${fmt(D.batMaxA)} A)`,'Yuqori C reyting kerak.');
 if(p.servo.tq<D.servoNeed)add('warn',`Swashplate servolari kuchsiz (${p.servo.tq} < ${fmt(D.servoNeed,1)} kg·sm)`,'Pichoqlar yuklamasida servo ushlab turolmaydi.');
 if(p.servo.tail>.06)add('warn','Dum servosi sekin',"Dum tebranadi (wag). 0,03–0,04 s/60° tezlikdagi raqamli servo oling.");
 if(!p.fbl.gov)add('info',"Governor yo'q","Headspeed gaz bilan o'zgaradi — boshqarish qiyinroq.");
 const clsR={250:.24,450:.36,550:.6,700:.78}[p.frame.cls];if(Math.abs(D.R-clsR)/clsR>.3)add('warn','Pichoq ramaga mos emas',`${p.frame.cls} klass uchun rotor radiusi ~${fmt(clsR*1000)} mm.`);
 return L};
T.catInfo=(cat,d,p,a)=>{if(cat==='rotor'||cat==='gear'||cat==='motor'){a('Headspeed',fmt(d.hs,-1)+' rpm');a('Pichoq uchi',fmt(d.tip)+' m/s');a('Maks. tortish',fmt(d.Tmax)+' g');a('Disk yuklamasi',fmt(d.disk,1)+' N/m²')}
 if(cat==='tail')a('Tavsiya diametr',fmt(d.tailNeed)+' mm');if(cat==='servo')a('Kerakli moment',fmt(d.servoNeed,1)+' kg·sm');if(cat==='esc'||cat==='bat'){a('Maks. tok',fmt(d.Imax)+' A');a('Muallaq turish',fmt(d.tHov,1)+' daq')}
 a("Og'irlik",fmt(d.AUW)+' g')};
T.ext=D=>[['Maks. tortish (pichoq)',fmt(D.Tblade)+' g'],['Maks. tortish (quvvat)',fmt(D.Tpow)+' g'],['Sport parvoz',fmt(D.tSport,1)+' daq'],['Rotor diametri',fmt(D.R*2000)+' mm'],['Solidlik σ',fmt(D.sig,3)],['Muallaq tok',fmt(D.Ih,1)+' A']];
T.wiring=B=>{const sv=(id,l,pad)=>({id,label:l,x:0,y:0,need:id,wires:[{id:'w'+id,l:'servo',col:'#ff9800',kind:'servo',ok:[pad],grp:'fbl',w:3}]});
 const comps=[{id:'mot1',label:"Cho'tkasiz motor",x:330,y:90,need:'mot1',wires:['a','b','c'].map((l,i)=>({id:'m'+l,l,col:['#c58a3a','#b0702a','#d39a4a'][i],kind:'motor',ok:['A','B','C'],grp:'mot',w:3}))},
  {id:'xt60',label:'Batareya kabeli',x:320,y:590,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]},
  {id:'escsig',label:'ESC signal',x:500,y:560,need:'esc',wires:[{id:'escsig',l:'gaz',col:'#ff9800',kind:'servo',ok:['THR'],w:3}]},
  {id:'rx',label:'Qabul qilgich (SBUS)',x:900,y:600,need:'rx',wires:[{id:'wrx',l:'SBUS',col:'#fdd835',kind:'servo',ok:['RX'],w:3}]},
  Object.assign(sv('sv1','Swash servo 1','S1'),{x:930,y:110}),Object.assign(sv('sv2','Swash servo 2','S2'),{x:930,y:210}),Object.assign(sv('sv3','Swash servo 3','S3'),{x:930,y:310}),Object.assign(sv('svT','Dum servosi','TAIL'),{x:930,y:430})];
 return{boards:[{id:'esc',label:`ESC ${B.p.esc.a}A`,x:230,y:230,w:200,h:170,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:280,y:400,l:'+'},{id:'VBAT-',t:'gnd',x:350,y:400,l:'−'},{id:'A',t:'motor',x:260,y:230,l:'A'},{id:'B',t:'motor',x:330,y:230,l:'B'},{id:'C',t:'motor',x:400,y:230,l:'C'}]},
  {id:'fbl',label:'Flybarless (FBL)',x:600,y:150,w:180,h:360,need:'fbl',pads:[{id:'S1',t:'ch',x:780,y:180,l:'S1'},{id:'S2',t:'ch',x:780,y:240,l:'S2'},{id:'S3',t:'ch',x:780,y:300,l:'S3'},{id:'TAIL',t:'ch',x:780,y:390,l:'TAIL'},{id:'RX',t:'sig',x:780,y:480,l:'RX'},{id:'THR',t:'ch',x:600,y:450,l:'THR'}]}],
  comps,hint:"Swashplate servolari raqami bo'yicha (S1–S3) ulanadi — almashsa FBL noto'g'ri aralashtiradi va vertolyot boshqa tomonga egiladi."}};
T.wextra=B=>{const w=B.wires,o=[w.ma,w.mb,w.mc];if(o.some(x=>!x)||new Set(o).size<3)return{};const i=o.map(x=>'ABC'.indexOf(x));let n=0;for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(i[a]>i[b])n++;return{motorReversed:n%2===1}};
// ---------- 3D model (sm) ----------
T.build=(B,D,ctx)=>{const p=B.p,c=B.col,X=!!window.XRAY,R=D.R*100,k=R/36,fw=7*k,fh=9*k,fl=16*k,sy=1.2*k,frY=sy+5*k,top=frY+fh;
 const fm=X?MAT('xhf',()=>new THREE.MeshPhysicalMaterial({color:c.frame,transparent:true,opacity:.25,depthWrite:false})):p.frame.mat==='carbon'?mCarbon(c.frame):mMat(p.frame.mat,c.frame,B.fin);
 {const g=new THREE.Group();for(const sx of[-1,1])g.add(tagP(rbox(.25*k,fh,fl,.6*k,fm,sx*fw/2,frY+fh/2,0),'Yon plastinalar',1));for(const z of[-fl*.35,0,fl*.35])g.add(tagP(box(fw,.6*k,.8*k,mMetal('#30343a',.4),0,frY+fh*.2,z),'Ko\'ndalang tirgaklar',2));
  g.add(tagP(cyl(.9*k,.9*k,1*k,mMetal('#c0c4c9',.3),0,top-.4*k,0,24),'Podshipnik bloki',3));ctx.add('frame',g,[0,0,0])}
 {const g=new THREE.Group(),sw=p.frame.skid/20*k/ (R/36)*.0+p.frame.skid/20;for(const sx of[-1,1]){const t=cyl(.35*k,.35*k,fl*1.3,mPaint(c.skids,'satin'),sx*sw,sy,0,12);t.rotation.x=Math.PI/2;g.add(tagP(t,"Chang'i trubalari",2))}
  for(const z of[-fl*.3,fl*.3])g.add(tagP(wireMesh([[-sw,sy,z],[-fw*.4,frY-.3,z],[fw*.4,frY-.3,z],[sw,sy,z]],c.skids,.32*k),'Ko\'ndalang ustunlar',1));ctx.add('skids',g,[0,-4,0])}
 {const m=mkMotor(p.motor.d,p.motor.h,'#455a64');m.rotation.x=Math.PI;m.position.set(0,top-.5*k,-fl*.18);m.scale.setScalar(Math.max(.6,k*.55));ctx.add('mot1',m,[0,6,-6])}
 {const g=new THREE.Group(),gm=new THREE.Mesh(gearGeo(p.gear.main,Math.max(.4,R/90),6),mPlastic('#eeeeee',.4));gm.rotation.x=-Math.PI/2;gm.position.y=top+.3*k;g.add(tagP(gm,'Asosiy tishli',2));
  const pn=new THREE.Mesh(gearGeo(p.gear.pin,Math.max(.4,R/90),6),mMetal('#b0b6bf',.3));pn.rotation.x=-Math.PI/2;pn.position.set(0,top+.3*k,-fl*.18);g.add(tagP(pn,'Pinion',1));
  g.add(tagP(cyl(.32*k,.32*k,fh*.9+8*k,mMetal('#d5d9de',.2),0,top+4*k-fh*.4,0,16),'Asosiy val',1));ctx.add('gear',g,[0,4,0])}
 const hy=top+8*k;
 {const g=new THREE.Group();g.add(tagP(cyl(1.6*k,1.6*k,.4*k,mMetal('#9aa3ad',.3),0,top+2.5*k,0,28),'Swashplate',1));for(let i=0;i<3;i++){const a=i/3*Math.PI*2;g.add(tagP(cyl(.12*k,.12*k,3*k,mMetal('#cfd8dc',.2),Math.cos(a)*1.4*k,top+4.1*k,Math.sin(a)*1.4*k,8),'Tortqichlar (linklar)',2))}
  g.add(tagP(box(3.2*k,.9*k,1.2*k,mMetal('#2b2e33',.35),0,hy,0),'Rotor boshi (pichoq ushlagichlari)',3));g.add(tagP(cyl(.5*k,.5*k,.6*k,mMetal('#c0c4c9',.2),0,hy+.7*k,0,16),'Gayka',4));ctx.add('head',g,[0,6,0])}
 {const g=new THREE.Group(),b=+p.rotor.b,ch=p.rotor.ch/10,bm=p.rotor.mat==='cf'?mCarbon(c.blades):mPaint(c.blades,'satin');for(let i=0;i<b;i++){const h=new THREE.Group();h.rotation.y=i/b*Math.PI*2;const s=foilSurface(R-1.5*k,ch,bm);s.position.set(1.5*k+(R-1.5*k)/2,hy,0);h.add(s);
   h.add(box(R*.08,.06,ch*.95,mPaint('#ffeb3b','gloss'),R*.9,hy+.05,0));g.add(h)}tagRanges(g,[[0,'Asosiy pichoqlar',1]]);const o=ctx.add('blades',g,[0,10,0]);if(o&&ctx.inst('blades'))ctx.spin(g,1)}
 const bl=R*1.08*CLS[p.frame.cls].boom,by=frY+fh*.55,tr=p.tail.d/20;
 {const g=new THREE.Group(),t=cyl(.5*k,.38*k,bl,mPaint(c.boom,'metal'),0,by,fl/2+bl/2-1,16);t.rotation.x=Math.PI/2;g.add(tagP(t,'Dum trubasi',1));
  g.add(tagP(box(.15*k,4*k,3*k,mPaint(c.canopy,'gloss'),0,by+1.5*k,fl/2+bl-2*k),'Vertikal stabilizator',2));g.add(tagP(box(6*k,.15*k,2.5*k,mPaint(c.canopy,'gloss'),0,by,fl/2+bl*.7),'Gorizontal stabilizator',2));
  g.add(tagP(box(1.2*k,1.4*k,1.6*k,mMetal('#30343a',.35),0,by,fl/2+bl-.5),'Dum reduktori',2));ctx.add('boom',g,[0,0,8])}
 {const g=new THREE.Group(),rg=new THREE.Group();rg.position.set(1.1*k,by,fl/2+bl-.5);rg.rotation.z=Math.PI/2;const sp=new THREE.Group();rg.add(sp);for(let i=0;i<+p.tail.b;i++){const h=new THREE.Group();h.rotation.y=i/p.tail.b*Math.PI*2;h.add(box(tr,.08,Math.max(.5,tr*.22),mPaint(c.blades,'satin'),tr/2+.2,0,0));sp.add(h)}sp.add(cyl(.35*k,.35*k,.5*k,mMetal('#9aa3ad',.3),0,0,0,16));
  g.add(rg);tagRanges(g,[[0,'Dum rotori',1]]);const o=ctx.add('tailr',g,[4,0,4]);if(o&&ctx.inst('tailr'))ctx.spin(sp,3)}
 {const g=new THREE.Group();g.add(rbox(2.4*k,.8*k,4*k,.2,MAT('hesc',()=>new THREE.MeshPhysicalMaterial({color:'#1e40af',roughness:.35,clearcoat:.5})),fw/2+1.3*k,frY+fh*.5,-fl*.1));ctx.add('esc',g,[5,0,0])}
 {const g=new THREE.Group();g.add(rbox(2*k,.9*k,2.6*k,.2,mPlastic('#111',.4),0,frY+.5*k,fl*.25));g.add(box(1.4*k,.05,1.4*k,mPlastic('#0d47a1',.4),0,frY+.98*k,fl*.25));ctx.add('fbl',g,[0,-2,4])}
 ctx.add('rx',(()=>{const g=new THREE.Group();g.add(rbox(1.5*k,.6*k,2*k,.15,mPlastic('#202020',.4),-fw/2-1*k,frY+fh*.3,fl*.2));return g})(),[-4,0,0]);
 const svPos=[[-fw/2-.9*k,top-2*k,-fl*.25],[fw/2+.9*k,top-2*k,-fl*.25],[0,top-2*k,fl*.32]];
 ['sv1','sv2','sv3'].forEach((id,i)=>{const s=mkServo(p.servo.tq>8?'std':'micro','#263238');s.scale.setScalar(Math.max(.7,k*.6));s.position.set(...svPos[i]);if(i<2)s.rotation.y=Math.PI/2;ctx.add(id,s,[i===0?-4:i===1?4:0,2,i===2?4:0])});
 {const s=mkServo('micro','#263238');s.scale.setScalar(Math.max(.7,k*.55));s.position.set(0,by-.2*k,fl/2+3*k);s.rotation.z=Math.PI;ctx.add('svT',s,[0,-3,3])}
 {const b=mkBattery(p.bat.cells,p.bat.mah,p.bat.chem,'#1b5e20',[`${p.bat.cells}S ${p.bat.mah}`,`${p.bat.c}C`,`${fmt(D.Vn,1)} V`]);b.position.set(0,frY-.2,-fl*.55);b.rotation.y=Math.PI;const dd=b.userData.dims,kk=Math.min(1,fw*1.3/dd.w);if(kk<1)b.scale.setScalar(kk);ctx.add('bat',b,[0,-3,-6])}
 {const g=new THREE.Group(),cm=X?MAT('xhc',()=>new THREE.MeshPhysicalMaterial({color:c.canopy,transparent:true,opacity:.2,depthWrite:false})):mPaint(c.canopy,'gloss'),z0=-fl*.95,z1=fl*.35;
  g.add(tagP(loft([[z0,fw*.4,fh*.3,frY+fh*.45],[z0+fl*.15,fw*1.25,fh*.95,frY+fh*.55],[z0+fl*.55,fw*1.45,fh*1.25,frY+fh*.6],[z1-fl*.1,fw*1.35,fh*1.1,frY+fh*.62],[z1,fw*.9,fh*.4,frY+fh*.75]],cm,2.4),'Kabina qobig\'i',1));
  g.add(tagP(loft([[z0+fl*.1,fw*1.1,fh*.4,frY+fh*.78],[z0+fl*.3,fw*1.3,fh*.5,frY+fh*.95],[z0+fl*.45,fw*1.2,fh*.3,frY+fh*1.1]],MAT('hglass',()=>new THREE.MeshPhysicalMaterial({color:'#0e1620',roughness:.05,metalness:.3,clearcoat:1,transparent:true,opacity:.85})),2.4),'Oyna',2));
  g.add(tagP(box(fw*1.42,fh*.12,fl*.5,mPaint(c.canopy2,'gloss'),0,frY+fh*.4,z0+fl*.55),'Bezak chizig\'i',3));ctx.add('canopy',g,[0,4,-6])}};
T.bom=(B,D)=>{const p=B.p;return[['hframe',`Rama ${p.frame.cls} klass`,{carbon:'Karbon',alu:'Alyuminiy',plastic:'Plastik'}[p.frame.mat],1,D.wFrame*.8],['skids',`Chang'ili shassi ${p.frame.skid} mm`,'',1,D.wFrame*.2],['motor',`Motor ${p.motor.d}${p.motor.h} ${p.motor.kv}KV`,`~${fmt(D.Pm)} W`,1,D.wMot],
 ['gear',`Pinion ${p.gear.pin}T + asosiy tishli ${p.gear.main}T`,`Uzatma ${fmt(p.gear.main/p.gear.pin,2)}:1`,1,15],['rotorhead','Rotor boshi + swashplate + linklar','FBL uchun',1,40],['mainrotor',`Pichoq ${p.rotor.bl} mm`,`${p.rotor.ch} mm vatar, ${{cf:'karbon',glass:'shisha tola',wood:'yog\'och'}[p.rotor.mat]}`,+p.rotor.b,D.wBlades/p.rotor.b],
 ['tailboom','Dum trubasi + stabilizatorlar + reduktor',p.tail.drive==='belt'?'Tasmali':'Valli',1,D.wTail*.6],['tailrotor',`Dum rotori ${p.tail.d} mm`,`${p.tail.b} pichoq`,1,D.wTail*.4],['esc',`ESC ${p.esc.a}A`,'Governor bilan',1,D.wEsc],
 ['servo',`Swashplate servo ${p.servo.tq} kg·sm`,'Raqamli, metall tishli',3,D.wServo/4],['servo',`Dum servosi ${p.servo.tail} s/60°`,'Tez raqamli',1,D.wServo/4],['fbl','Flybarless tizim',p.fbl.rescue?'Qutqarish rejimi bilan':'',1,12],['rx','Qabul qilgich (SBUS)','',1,6],
 ['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh ${p.bat.c}C`,'',1,D.wBat],['canopy','Kabina (shisha tola)','',1,25]]};
// ---------- sinov ----------
T.startTitle='Sinov parvoziga tayyor';T.startNote="Vertolyot maydonchada. <b>W</b> — collective (ko'tarilish), <b>S</b> — pasayish, strelkalar — cyclic (egilish), <b>A/D</b> — dum (burilish). Oson rejim balandlikni ushlab turadi.";
T.linkMsg=()=>"FBL yoki ESC signali ulanmagan — rotor aylanmaydi.";T.armMsg=()=>"Rotor aylanmoqda. W — ko'tarilish.";
T.simInit=(S,B,WC,ex)=>{const w=WC.works;S.pos.set(-8,0,14);S.yaw=0;S.link=w.escsig&&w.xt60&&w.rx;S.tailOk=w.svT;S.cycOk=w.sv1&&w.sv2&&w.sv3;S.rev=!!ex.motorReversed;S.spool=0;S.vy=0;S.vh=new V3();if(!['easy','manual'].includes(S.mode))S.mode='easy'};
T.simTick=(S,dt,I,{g,soc})=>{const D=S.D,B=S.B,m=D.AUW/1000,sag=.85+.15*soc;
 S.spool+=((S.armed&&soc>0?1:0)-S.spool)*Math.min(1,dt*.8);const hsK=S.rev?0:S.spool;
 let col=0;if(S.mode==='easy'){const want=((I.thrUp?1:0)-(I.thrDn?1:0)-STK.l.y)*3;const a=want-S.vy;col=clamp(1/D.twr+a*.12,0,1)}else{S.colM=clamp((S.colM||0)+((I.thrUp?1:0)-(I.thrDn?1:0)-STK.l.y)*dt*.8,0,1);col=S.colM}
 const Tn=D.Tmax/1000*g*col*hsK*hsK*sag;S.vy+=(Tn*Math.cos(S.pitch)*Math.cos(S.roll)/m-g-.6*S.vy*Math.abs(S.vy)*.05)*dt;
 let pin=clamp(I.pitch,-1,1),rin=clamp(I.roll,-1,1);if(!S.cycOk&&S.armed&&S.pos.y>.3){pin=-rin*.8+Math.sin(S.t*1.3)*.4;rin=pin*.6;if(!S.cMsg){S.cMsg=1;S.status="Swashplate servolari noto'g'ri ulangan — vertolyot boshqa tomonga egilmoqda!"}}
 const tgtP=-pin*.35,tgtR=-rin*.35;S.pitch+=(tgtP-S.pitch)*Math.min(1,dt*3);S.roll+=(tgtR-S.roll)*Math.min(1,dt*3);
 let yr=I.yaw*2.2;if(!S.tailOk&&hsK>.3){yr=col*7+1;if(!S.tMsg){S.tMsg=1;S.status="Dum servosi ulanmagan — reaktiv moment vertolyotni aylantirib yubordi!"}}S.yaw+=yr*dt;
 const fwd=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw)),rt=new V3(-fwd.z,0,fwd.x),ah=new V3().addScaledVector(fwd,-Math.sin(S.pitch)*Tn/m).addScaledVector(rt,Math.sin(S.roll)*Tn/m);
 if(S.mode==='easy'&&Math.abs(pin)<.05&&Math.abs(rin)<.05)S.vh.multiplyScalar(1-Math.min(1,dt*1.5));S.vh.addScaledVector(ah,dt).multiplyScalar(1-.25*dt);
 S.pos.addScaledVector(S.vh,dt);S.pos.y+=S.vy*dt;if(S.pos.y<=0){if(S.vy<-4&&!S.fail)crash(S,`Qattiq qo'nish: ${fmt(-S.vy,1)} m/s.`);S.pos.y=0;S.vy=Math.max(0,S.vy);S.vh.multiplyScalar(.8)}
 if(!S.tailOk&&S.spool>.6&&S.pos.y>.5&&!S.fail&&S.t>6)crash(S,"Dum rotori boshqarilmadi — vertolyot aylanib yerga urildi. Dum servosini FBL ning TAIL kontaktiga ulang.");
 S.vel.set(S.vh.x,S.vy,S.vh.z);const P=D.Ph*(col*hsK)*1.4/Math.max(.3,1/D.twr);S.amp=S.armed?Math.max(.5,P/D.V):.1;S.used+=S.amp*dt/3.6*(window.SIM_FAST||1);S.volt=D.V*sag;
 if(soc<=0&&S.armed){S.armed=false;S.status='Batareya tugadi — autorotatsiyada qo\'nish kerak!'}
 for(const s of S.model.userData.spinners)s.o.rotation.y+=dt*D.hs/60*2*Math.PI*hsK*(s.d===3?.25:.12);humSet(S.armed,hsK)};
regType(T);
})();
