/* =====================================================================
   MODEL RAKETA (qattiq yoqilg'ili dvigatel, parashyut bilan qaytadi)
     barqarorlik: Barrowman usuli — bosim markazi (CP) og'irlik markazidan (CG) pastda bo'lishi kerak;
       zaxira = (CP − CG) / diametr, 1–2 kalibr — eng yaxshi
     parvoz: m·dv/dt = F − ½ρ·Cd·A·v|v| − m·g  (dvigatel yonishida massa kamayadi)
     tushish tezligi: v = √(2mg / (ρ·Cd·A_parashyut))
   ===================================================================== */
(()=>{
// dvigatel klassi: umumiy impuls (N·s), yonish vaqti (s), massa va yoqilg'i (g), diametr (mm), uzunlik (mm)
const MOT={A8:{I:2.5,tb:.32,m:16.2,mp:3.1,d:18,l:70},B6:{I:5,tb:.8,m:19.8,mp:6.2,d:18,l:70},C6:{I:10,tb:1.7,m:24.1,mp:12.3,d:18,l:70},D12:{I:20,tb:1.6,m:44,mp:21,d:24,l:70},
 E12:{I:30,tb:2.4,m:58,mp:36,d:24,l:95},F15:{I:50,tb:3.4,m:101,mp:60,d:29,l:114},G40:{I:120,tb:3,m:123,mp:62,d:29,l:124}};
const NOSE={ogive:{n:'Ogiv (silliq yoy)',cd:.42,xn:.466},cone:{n:'Konus',cd:.5,xn:.666},parab:{n:'Parabolik',cd:.4,xn:.5}};
const RAIL=1.0,WIND=3;
const T={id:'rocket',name:'Model raketa',ic:'rocket',desc:"Raketa: korpus, burun, stabilizatorlar, dvigatel va parashyut. Barqarorlik va apogeyni hisoblaydi.",defPreset:'alpha',defPurpose:'alt',
 purposes:{alt:{t:'Balandlik',note:'Apogey maksimal, barqarorlik 1–2 kalibr'},safe:{t:'Xavfsiz o\'quv parvozi',note:'Sekin, barqaror, yumshoq qo\'nish'}},
 colors:{body:'#f4f4f4',nose:'#e53935',fins:'#1e88e5',chute:'#ff6f00',accent:'#212121'},
 paint:[['body','Korpus'],['nose','Burun'],['fins','Stabilizatorlar'],['chute','Parashyut'],['accent','Chiziqlar']],
 spec:{
  body:{t:'Korpus (truba)',ic:'rocket',g:'bodytube',f:[{k:'d',l:'Diametri',min:18,max:100,step:1,u:'mm'},{k:'len',l:'Uzunligi',min:15,max:150,step:1,u:'sm'},{k:'wall',l:'Devor qalinligi',min:.4,max:2.5,step:.1,u:'mm'},{k:'mat',l:'Material',type:'sel',o:{paper:'Karton (spiral)',glass:'Shisha tola',carbon:'Karbon tola'},g:'material'},{k:'lug',l:"Yo'naltiruvchi",type:'sel',o:{rod:'Halqa (3–5 mm sterjen)',rail:'Rels tugmalari (1010)'},g:'launchlug'}]},
  nose:{t:'Burun konusi',ic:'target',g:'nosecone',f:[{k:'shape',l:'Shakli',type:'sel',o:Object.fromEntries(Object.entries(NOSE).map(([k,v])=>[k,v.n]))},{k:'cal',l:'Uzunligi (kalibrda)',min:2,max:6,step:.5,u:'×d'},{k:'ballast',l:"Ballast (burundagi yuk)",min:0,max:150,step:1,u:'g',g:'cg'}]},
  fins:{t:'Stabilizatorlar',ic:'wing',g:'fins',f:[{k:'n',l:'Soni',type:'sel',o:{3:'3 ta',4:'4 ta'}},{k:'root',l:'Ildiz vatari',min:20,max:250,step:1,u:'mm'},{k:'tip',l:'Uchi vatari',min:0,max:200,step:1,u:'mm'},{k:'span',l:'Balandligi (span)',min:15,max:200,step:1,u:'mm'},{k:'sweep',l:'Orqaga og\'ishi',min:0,max:200,step:1,u:'mm'},{k:'th',l:'Qalinligi',min:1.5,max:6,step:.5,u:'mm'},{k:'mat',l:'Material',type:'sel',o:{balsa:'Balza',ply:'Fanera',g10:'G10 shisha tola'},g:'material'}]},
  motor:{t:'Dvigatel',ic:'flame',g:'rmotor',f:[{k:'cls',l:'Klass (impuls)',type:'sel',o:Object.fromEntries(Object.entries(MOT).map(([k,v])=>[k,`${k} — ${v.I} N·s, ${fmt(v.I/v.tb,1)} N, Ø${v.d}`]))},{k:'delay',l:'Ajratish kechikishi',min:2,max:10,step:1,u:'s',g:'delay'},{k:'mount',l:'Dvigatel trubasi diametri',type:'sel',o:{18:'18 mm',24:'24 mm',29:'29 mm'},g:'motormount'}]},
  recov:{t:'Qaytish tizimi',ic:'download',g:'parachute',f:[{k:'type',l:'Turi',type:'sel',o:{chute:'Parashyut',streamer:'Lenta (streamer)'},g:'parachute'},{k:'d',l:"Parashyut diametri / lenta uzunligi",min:20,max:150,step:1,u:'sm'},{k:'cord',l:'Amortizatsion shnur',min:50,max:500,step:10,u:'sm',g:'shockcord'},{k:'kevlar',l:'Kevlar (issiqqa chidamli) uchi',type:'bool',g:'shockcord'}]}},
 presets:{
  alpha:{name:'Alpha — boshlang\'ich (18 mm)',desc:'C6 dvigatel, ~200 m, parashyut bilan',purpose:'safe',p:{body:{d:25,len:30,wall:.6,mat:'paper',lug:'rod'},nose:{shape:'ogive',cal:3,ballast:4},fins:{n:3,root:75,tip:30,span:52,sweep:38,th:2.5,mat:'balsa'},motor:{cls:'C6',delay:5,mount:18},recov:{type:'chute',d:30,cord:120,kevlar:false}}},
  mid:{name:'Mid-power (29 mm, F)',desc:'F15, ~500 m, shisha tola stabilizatorlar',purpose:'alt',p:{body:{d:54,len:70,wall:1.2,mat:'glass',lug:'rail'},nose:{shape:'ogive',cal:4,ballast:0},fins:{n:4,root:130,tip:50,span:70,sweep:70,th:3,mat:'g10'},motor:{cls:'G40',delay:8,mount:29},recov:{type:'chute',d:75,cord:300,kevlar:true}}},
  dart:{name:'Dart — balandlik rekordi',desc:'D12, ingichka korpus, lenta bilan',purpose:'alt',p:{body:{d:33,len:45,wall:.6,mat:'paper',lug:'rod'},nose:{shape:'parab',cal:4.5,ballast:12},fins:{n:3,root:75,tip:28,span:55,sweep:50,th:2,mat:'ply'},motor:{cls:'D12',delay:7,mount:24},recov:{type:'streamer',d:150,cord:150,kevlar:true}}}},
 steps:[
  {id:'body',t:'Korpus',ic:'rocket',cats:['body'],slots:()=>['body','lug'],intro:"Korpus — yengil truba. Diametri dvigatelga mos bo'lishi kerak; uzunligi barqarorlikka ta'sir qiladi: uzun raketa barqarorroq."},
  {id:'nose',t:'Burun konusi',ic:'target',cats:['nose'],slots:()=>['nose'],intro:"Burun havoni yorib o'tadi. Ogiv shakl qarshiligi kichik; burundagi ballast og'irlik markazini oldinga suradi va raketani barqaror qiladi."},
  {id:'fins',t:'Stabilizatorlar',ic:'wing',cats:['fins'],slots:()=>['fins'],intro:"Stabilizatorlar bosim markazini (CP) orqaga suradi. CP og'irlik markazidan (CG) kamida 1 diametr pastda bo'lsa, raketa to'g'ri uchadi."},
  {id:'motor',t:'Dvigatel',ic:'flame',cats:['motor'],slots:()=>['mount','motor'],intro:"Dvigatel trubasi markazlash halqalari bilan korpusga yelimlanadi, dvigatel ilgak bilan ushlanadi. Klass harfi impulsni bildiradi: har keyingi harf — 2 baravar ko'p."},
  {id:'recov',t:'Parashyut',ic:'download',cats:['recov'],slots:()=>['cord','chute'],intro:"Dvigatel yonib bo'lgach, kechikish zaryadi parashyutni chiqaradi. U apogeyga yaqin ochilishi kerak — tez uchayotganda ochilsa yirtiladi."},
  {id:'wiring',kind:'wiring',t:"O't oldirish (simlar)",ic:'plug',intro:"Elektr o't oldirgich (igniter) dvigatel soplosiga kiritiladi va uchirish pultining qisqichlariga ulanadi. Xavfsizlik kaliti — oxirgi qadam."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Uchirish',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{lug:'body',nose:'body',fins:'body',mount:'body',motor:'mount',cord:'body',chute:'cord'},
 labels:{body:'bodytube',lug:'launchlug',nose:'nosecone',fins:'fins',mount:'motormount',motor:'rmotor',cord:'shockcord',chute:'parachute'},
 chart:{title:'Parvoz: balandlik va tezlik (vaqt bo\'yicha)',cols:['Vaqt, s','Balandlik, m','Tezlik, m/s','Tezlanish, g','Mach'],l1:'■ Balandlik (m)',l2:'■ Tezlik (m/s)',xf:r=>fmt(r.ts,1)+'s'}};

// parvozni oddiy Eyler usulida hisoblash (vertikal)
function flight(m0,mp,F,tb,Cd,A,rho,delay,unstable){const g=9.81,dt=.005;let t=0,h=0,v=0,vr=0,vmax=0,amax=0,hEj=0,vEj=0,tEj=tb+delay,ap=0,tap=0;const tr=[];
 for(let i=0;i<40000;i++){const m=t<tb?m0-mp*t/tb:m0-mp,f=t<tb?F:0,cd=unstable&&h>RAIL?Cd*6:Cd,a=(f-.5*rho*cd*A*v*Math.abs(v))/m-g;
  if(h<=0&&f<m*g&&t<tb){t+=dt;continue}v+=a*dt;h+=v*dt;t+=dt;if(h<0){h=0;if(t>tb)break}
  if(!vr&&h>=RAIL)vr=v;vmax=Math.max(vmax,v);amax=Math.max(amax,a+g);if(h>ap){ap=h;tap=t}
  if(Math.abs(t-tEj)<dt/2){hEj=h;vEj=v}if(i%10===0)tr.push([t,h,v,(a+g)/g]);if(t>tb&&v<0&&t>tEj+1)break}
 return{ap,tap,vr,vmax,amax,hEj,vEj,tEj,tr}}
T.derive=B=>{const p=B.p,M=MOT[p.motor.cls],d=p.body.d/1000,L=p.body.len/100,Ln=d*p.nose.cal,rho=airDensity(B.env.alt,B.env.temp),g=9.81;
 const dens={paper:.75,glass:1.85,carbon:1.6}[p.body.mat],wBody=Math.PI*d*L*(p.body.wall/1000)*dens*1e6,wNose=Math.PI*d*Ln*.5*.0012*{paper:.9,glass:1.6,carbon:1.4}[p.body.mat]*1e3+p.nose.ballast;
 const f=p.fins,fa=(f.root+f.tip)/2*f.span/1e6,wFins=fa*f.th/1000*{balsa:160,ply:600,g10:1850}[f.mat]*1000*f.n,wMount=M.l/1000*Math.PI*((+p.motor.mount)/1000)*.0007*800*1e3+6,wLug=4;
 const wRec=(p.recov.type==='chute'?Math.PI*(p.recov.d/200)**2*45:p.recov.d/100*.05*60)+p.recov.cord*.04+(p.recov.kevlar?3:0),wMot=M.m,AUW=wBody+wNose+wFins+wMount+wLug+wRec+wMot+5,mkg=AUW/1000,mEmpty=(AUW-M.mp)/1000;
 // og'irlik markazi (burun uchidan, m)
 const tail=Ln+L,parts=[[wNose,Ln*(NOSE[p.nose.shape].xn+.1)],[wBody,Ln+L/2],[wFins,tail-f.root/2000],[wMount,tail-M.l/2000],[wMot,tail-M.l/2000+.005],[wRec,Ln+L*.25],[wLug+5,Ln+L*.6]];
 const CG=parts.reduce((s,[w,x])=>s+w*x,0)/parts.reduce((s,[w])=>s+w,0),CGb=(parts.reduce((s,[w,x])=>s+w*x,0)-M.mp*(tail-M.l/2000))/(AUW-M.mp);
 // Barrowman bosim markazi
 const R=d/2,s=f.span/1000,Cr=f.root/1000,Ct=f.tip/1000,Xr=f.sweep/1000,lf=Math.sqrt(s*s+(Xr+Ct/2-Cr/2)**2),CNn=2,Xn=NOSE[p.nose.shape].xn*Ln;
 const CNf=(1+R/(s+R))*(4*f.n*(s/d)**2/(1+Math.sqrt(1+(2*lf/(Cr+Ct||1e-3))**2))),Xb=tail-Cr,Xf=Xb+Xr*(Cr+2*Ct)/(3*(Cr+Ct||1e-3))+((Cr+Ct)-Cr*Ct/(Cr+Ct||1e-3))/6;
 const CP=(CNn*Xn+CNf*Xf)/(CNn+CNf),stab=(CP-CG)/d,stabB=(CP-CGb)/d;
 const A=Math.PI*R*R,finCd=.012*f.n*(s*Cr)/A*.8,Cd=NOSE[p.nose.shape].cd+.12+Math.min(.4,finCd)+(p.body.lug==='rod'?.05:.02),F=M.I/M.tb;
 const fl=flight(mkg,M.mp/1000,F,M.tb,Cd,A,rho,p.motor.delay,stab<.3);
 const Ac=p.recov.type==='chute'?Math.PI*(p.recov.d/200)**2:(p.recov.d/100)*(d*1.6),CdR=p.recov.type==='chute'?1.5:.55,vDesc=Math.sqrt(2*mEmpty*g/(rho*CdR*Ac));
 const tw=F/(mkg*g),drift=WIND*(fl.ap/Math.max(vDesc,.5));
 const table=[];if(fl.tr.length){const n=fl.tr.length;for(let k=1;k<=10;k++){const q=fl.tr[Math.min(n-1,Math.floor(k/10*(n-1)))];table.push({t:k*10,ts:q[0],thrust:q[1],amp:Math.max(0,q[2]),watt:q[3],eff:Math.abs(q[2])/340})}}
 return{AUW,wBody,wNose,wFins,wMot,wRec,wMount,mEmpty,CG,CGb,CP,stab,stabB,Cd,F,tw,ap:fl.ap,tap:fl.tap,vr:fl.vr,vmax:fl.vmax,amax:fl.amax/g,vEj:fl.vEj,hEj:fl.hEj,tEj:fl.tEj,vDesc,drift,tb:M.tb,M,Ln,tail,len:tail,d,
  vTop:fl.vmax,V:12,Vn:12,parts:[['Korpus',wBody],['Burun',wNose],['Stabilizatorlar',wFins],['Dvigatel',wMot],['Dvigatel trubasi',wMount],['Parashyut va shnur',wRec],['Boshqa',wLug+5]],table}};
T.metrics=(B,D)=>[{l:'Apogey',v:fmt(D.ap)+' m'},{l:'Barqarorlik',v:fmt(D.stab,2)+' kal',lvl:D.stab<.8?'bad':D.stab<1||D.stab>3?'warn':'ok'},{l:'Tortish/og\'irlik',v:fmt(D.tw,1)+' : 1',lvl:D.tw<3?'bad':D.tw<5?'warn':'ok'},
 {l:'Relsdan chiqish',v:fmt(D.vr,1)+' m/s',lvl:D.vr<8?'bad':D.vr<11?'warn':'ok'},{l:'Maks. tezlik',v:fmt(D.vmax)+' m/s'},{l:'Qo\'nish tezligi',v:fmt(D.vDesc,1)+' m/s',lvl:D.vDesc>8?'bad':D.vDesc>6?'warn':'ok'}];
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y}),M=D.M;
 if(D.stab<.8)add('bad',`Raketa barqaror emas (${fmt(D.stab,2)} kalibr)`,"Bosim markazi (CP) og'irlik markaziga juda yaqin yoki undan oldinda — raketa havoda aylanib ketadi. Stabilizatorlarni kattalashtiring yoki burunga ballast qo'shing.");
 else if(D.stab<1)add('warn',`Barqarorlik chegarada (${fmt(D.stab,2)} kal)`,"1–2 kalibr tavsiya etiladi.");else if(D.stab>3)add('warn',`Haddan tashqari barqaror (${fmt(D.stab,1)} kal)`,"Raketa shamolga qarab buriladi (weathercocking) va apogey pasayadi. Stabilizatorni kichraytiring.");
 if(D.tw<3)add('bad',`Tortish juda kam (${fmt(D.tw,1)}:1)`,"Kamida 5:1 bo'lishi kerak — aks holda raketa sekin ko'tarilib, egilib ketadi. Kuchliroq dvigatel yoki yengilroq raketa.");else if(D.tw<5)add('warn',`Tortish/og'irlik ${fmt(D.tw,1)}:1`,"5:1 dan kam — shamolda xavfli.");
 if(D.vr<11)add(D.vr<8?'bad':'warn',`Yo'naltiruvchidan chiqish tezligi ${fmt(D.vr,1)} m/s`,"Stabilizatorlar ishlashi uchun 1 m sterjendan kamida 11–15 m/s bilan chiqishi kerak.");
 if(M.d>(+p.motor.mount))add('bad',`Dvigatel (Ø${M.d}) trubaga sig'maydi (Ø${(+p.motor.mount)})`,'Dvigatel trubasini dvigatel diametriga mos tanlang.');else if(M.d<(+p.motor.mount))add('warn',`Dvigatel Ø${M.d}, truba Ø${(+p.motor.mount)}`,'Adapter kerak — aks holda dvigatel trubada qimirlaydi.');
 if((+p.motor.mount)+2>p.body.d-2*p.body.wall)add('bad',`Dvigatel trubasi korpusga sig'maydi (korpus ichki Ø${fmt(p.body.d-2*p.body.wall,1)} mm)`,'Kattaroq korpus yoki kichikroq dvigatel.');
 if(D.vEj>20)add('bad',`Parashyut juda erta ochiladi (${fmt(D.vEj)} m/s tezlikda)`,"Kechikish qisqa — parashyut yoki shnur yirtiladi (zipper). Kechikishni oshiring.");else if(D.vEj<-20)add('bad',`Parashyut juda kech ochiladi (${fmt(-D.vEj)} m/s bilan tushayotganda)`,"Kechikish uzun — raketa tezlashib ketadi, parashyut yirtiladi. Kechikishni kamaytiring.");else if(Math.abs(D.vEj)>10)add('warn',`Ajralish apogeydan uzoq (${fmt(D.vEj)} m/s)`,`Eng yaxshi kechikish ≈ ${fmt(Math.max(0,D.tap-D.tb),1)} s.`);
 if(D.vDesc>8)add('bad',`Qo'nish tezligi ${fmt(D.vDesc,1)} m/s`,"Raketa sinadi. Kattaroq parashyut kerak (3,5–6 m/s tavsiya etiladi).");else if(D.vDesc>6)add('warn',`Qo'nish tezligi ${fmt(D.vDesc,1)} m/s`,'Stabilizatorlar sinishi mumkin.');
 if(D.vDesc<3&&D.ap>150)add('info',`Shamol uzoqqa olib ketadi (~${fmt(D.drift)} m)`,'Juda katta parashyut: 3 m/s shamolda raketa uzoqqa uchadi.');
 if(!p.recov.kevlar&&M.I>=20)add('warn',"Shnur oddiy rezina — kuyib uziladi","D va undan katta dvigatellarda ajratish zaryadi issiq: kevlar uchi kerak.");
 if(p.fins.mat==='balsa'&&D.vmax>150)add('warn',`Balza stabilizatorlar ${fmt(D.vmax)} m/s da sinishi mumkin`,'Fanera yoki G10 shisha tola oling.');
 if(D.AUW>1500)add('bad',"Massa 1,5 kg dan oshdi",'Model raketa qoidalari bo\'yicha ruxsat etilmaydi.');
 if(p.fins.tip>p.fins.root)add('warn','Stabilizator uchi ildizidan keng','Uchi ildizdan kichik bo\'lishi kerak — aks holda tebranadi (flutter).');
 return L};
T.catInfo=(cat,d,p,a)=>{a('Barqarorlik',`${fmt(d.stab,2)} kal (dvigatel yongach ${fmt(d.stabB,2)})`);a('CG / CP (burundan)',`${fmt(d.CG*100,1)} / ${fmt(d.CP*100,1)} sm`);
 if(cat==='motor'){a('O\'rtacha tortish',fmt(d.F,1)+' N');a('Yonish vaqti',fmt(d.tb,1)+' s');a('Tortish/og\'irlik',fmt(d.tw,1))}
 if(cat==='recov'){a('Tushish tezligi',fmt(d.vDesc,1)+' m/s');a('Ajralish payti tezligi',fmt(d.vEj,1)+' m/s');a('Eng yaxshi kechikish',fmt(Math.max(0,d.tap-d.tb),1)+' s')}
 a('Apogey',fmt(d.ap)+' m');a("Umumiy og'irlik",fmt(d.AUW)+' g')};
T.ext=D=>[['Apogeygacha vaqt',fmt(D.tap,1)+' s'],['Maks. tezlanish',fmt(D.amax,1)+' g'],['Qarshilik koeff. Cd',fmt(D.Cd,2)],['Bosim markazi (CP)',fmt(D.CP*100,1)+' sm'],["Og'irlik markazi (CG)",fmt(D.CG*100,1)+' sm'],['Shamolda siljish',fmt(D.drift)+' m']];
T.wiring=B=>({boards:[{id:'pad',label:'Uchirish pulti (12 V)',x:520,y:240,w:240,h:180,need:'motor',pads:[{id:'CLIP1',t:'vbat',x:560,y:240,l:'Qisqich 1',title:'Qizil qisqich'},{id:'CLIP2',t:'gnd',x:640,y:240,l:'Qisqich 2',title:'Qora qisqich'},{id:'KEY',t:'ch',x:720,y:420,l:'Kalit',title:'Xavfsizlik kaliti uyasi'}]}],
 comps:[{id:'xt60',label:"O't oldirgich (igniter)",x:600,y:90,need:'motor',wires:[{id:'ig1',l:'1',col:'#c58a3a',kind:'motor',ok:['CLIP1','CLIP2'],grp:'mig',w:2.5},{id:'ig2',l:'2',col:'#b0702a',kind:'motor',ok:['CLIP2','CLIP1'],grp:'mig',w:2.5}]},
  {id:'key',label:'Xavfsizlik kaliti',x:760,y:560,need:'motor',wires:[{id:'wkey',l:'kalit',col:'#ff9800',kind:'servo',ok:['KEY'],w:3}]}],
 hint:"O't oldirgichning ikki simi pultning ikki qisqichiga ulanadi (qutbi muhim emas). Kalit faqat hamma raketadan 5 m uzoqlashgandan keyin qo'yiladi."});
// ---------- 3D model (sm), vertikal: y yuqoriga, quyruq y=0 da ----------
T.build=(B,D,ctx)=>{const p=B.p,c=B.col,X=!!window.XRAY,R=p.body.d/20,L=p.body.len,Ln=R*2*p.nose.cal,y0=2.2,yTop=y0+L;
 const bm=X?MAT('xrr'+c.body,()=>new THREE.MeshPhysicalMaterial({color:c.body,transparent:true,opacity:.22,depthWrite:false})):p.body.mat==='carbon'?mCarbon('#9aa'):mPaint(c.body,B.fin);
 // korpus: truba + bo'yalgan chiziq
 {const g=new THREE.Group();g.add(tagP(cyl(R,R,L,bm,0,y0+L/2,0,40),'Korpus trubasi',1));g.add(tagP(cyl(R*1.004,R*1.004,L*.06,mPaint(c.accent,'gloss'),0,y0+L*.72,0,40),'Bezak chizig\'i',2));ctx.add('body',g,[0,0,0])}
 {const g=new THREE.Group();if(p.body.lug==='rod'){const lg=cyl(.3,.3,Math.min(6,L*.15),mPlastic('#e0e0e0',.4),R+.3,y0+L*.45,0,12);g.add(tagP(lg,"Yo'naltiruvchi halqa",1))}else for(const yy of[y0+L*.2,y0+L*.6]){g.add(tagP(cyl(.55,.45,.4,mPlastic('#111',.4),R+.2,yy,0,16),'Rels tugmalari',1));g.children[g.children.length-1].rotation.z=Math.PI/2}ctx.add('lug',g,[3,0,0])}
 // burun: aylanma profil (shakli bo'yicha) + yelka
 {const g=new THREE.Group(),N=24,pts=[];for(let i=0;i<=N;i++){const t=i/N,r=p.nose.shape==='cone'?R*t:p.nose.shape==='parab'?R*(2*t-t*t):R*Math.sqrt(t*(2-t));pts.push(new THREE.Vector2(Math.max(.001,r),Ln*(1-t)))}
  const nm=X?bm:mPaint(c.nose,B.fin),m=new THREE.Mesh(new THREE.LatheGeometry(pts,40),nm);m.position.y=yTop;m.castShadow=true;m.userData.dispose=true;g.add(tagP(m,'Burun konusi',2));
  g.add(tagP(cyl(R*.93,R*.93,R*1.6,mPlastic('#ddd',.5),0,yTop-R*.8,0,32),'Yelka (korpusga kiradigan qism)',1));if(p.nose.ballast>0)g.add(tagP(cyl(R*.5,R*.5,Math.min(Ln*.3,p.nose.ballast/30+.3),mMetal('#777',.4),0,yTop+Ln*.15,0,16),'Ballast (qo\'rg\'oshin)',1));
  ctx.add('nose',g,[0,8,0])}
 // stabilizatorlar: trapetsiya, ildiz korpusga yopishtirilgan
 {const g=new THREE.Group(),f=p.fins,cr=f.root/10,ct=f.tip/10,s=f.span/10,sw=f.sweep/10,th=f.th/10,fm=X?bm:mPaint(c.fins,B.fin);
  const sh=new THREE.Shape([[0,0],[0,cr],[s,cr-sw],[s,Math.max(cr-sw-ct,cr-sw-ct)]].map(([x,y])=>new THREE.Vector2(x,y)));const geo=new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:false});geo.translate(0,0,-th/2);
  for(let k=0;k<+f.n;k++){const a=k/f.n*Math.PI*2,m=new THREE.Mesh(geo,fm);m.castShadow=true;m.userData.dispose=true;const h=new THREE.Group();h.rotation.y=a;m.position.set(R,y0,0);h.add(m);
   h.add(box(.25,cr*.9,.25,mPlastic('#f5f5dc',.6),R+.12,y0+cr*.45,th/2+.1));g.add(tagP(h,`Stabilizator ${k+1}`,1+k))}
  ctx.add('fins',g,[0,-3,0])}
 // dvigatel trubasi, markazlash halqalari, ilgak
 const mr=(+p.motor.mount)/20,ml=D.M.l/10;
 {const g=new THREE.Group();g.add(tagP(cyl(mr+.06,mr+.06,ml+.6,mPlastic('#c8a46a',.7),0,y0+ml/2,0,24),'Dvigatel trubasi',1));for(const yy of[y0+.2,y0+ml*.85]){const r=new THREE.Mesh(new THREE.RingGeometry(mr+.06,R*.97,32),mPlastic('#b48a5c',.7));r.rotation.x=-Math.PI/2;r.position.y=yy;r.userData.dispose=true;g.add(tagP(r,'Markazlash halqalari',2))}
  g.add(tagP(box(.12,ml*.6,.3,mMetal('#bbb',.3),mr+.12,y0+ml*.4,0),'Dvigatel ilgagi',3));ctx.add('mount',g,[0,-6,0])}
 {const g=new THREE.Group(),md=D.M.d/20;g.add(tagP(cyl(md,md,ml,mPaint('#2e5aa8','satin'),0,y0+ml/2-.6,0,28),'Dvigatel korpusi (yoqilg\'i ichida)',1));g.add(tagP(cyl(md*.55,md*.4,.5,mPlastic('#3e2a1a',.8),0,y0-.85,0,20),'Soplo (keramika)',2));
  g.add(tagP(cyl(md*1.002,md*1.002,ml*.4,mPlastic('#f2f2f2',.6),0,y0+ml*.55,0,28),'Yorliq',3));ctx.add('motor',g,[0,-8,0])}
 // shnur va parashyut (korpus ichida — «Ichini ko'rish» bilan ko'rinadi)
 {const g=new THREE.Group();g.add(tagP(wireMesh([[0,y0+ml+1,0],[R*.4,y0+L*.4,0],[-R*.4,y0+L*.6,0],[0,yTop-1,0]],p.recov.kevlar?'#d4a017':'#f5f5f5',.12),'Amortizatsion shnur',1));ctx.add('cord',g,[R*2+2,0,0])}
 {const g=new THREE.Group(),cm=mPaint(c.chute,'satin');if(p.recov.type==='chute'){g.add(tagP(cyl(R*.75,R*.75,Math.max(2,p.recov.d/18),cm,0,yTop-R*2-p.recov.d/36,0,20),'Parashyut (taxlangan)',1));g.add(tagP(box(R*1.2,.08,R*1.2,mPlastic('#fafafa',.5),0,yTop-R*2-p.recov.d/18-.4,0),'Olovdan himoya qog\'ozi',0))}
  else g.add(tagP(box(R*.9,Math.max(2,p.recov.d/20),R*.6,cm,0,yTop-R*2-p.recov.d/40,0),'Lenta (taxlangan)',1));ctx.add('chute',g,[R*2+5,0,0])}
 // ustaxonada: uchirish sterjeni va taglik
 if(ctx.step!=='test'&&ctx.step!=='inspect'){const pad=new THREE.Group();pad.add(cyl(.25,.25,Math.max(100,L+Ln+20),mMetal('#c0c4c9',.25),R+.85,Math.max(100,L+Ln+20)/2,0,10));pad.add(cyl(R*2.6,R*2.8,.4,mMetal('#3a3f46',.5),0,.2,0,32));for(let k=0;k<3;k++){const a=k/3*Math.PI*2,lg=box(.5,.5,R*5,mMetal('#3a3f46',.5),Math.cos(a)*R*2,.25,Math.sin(a)*R*2);lg.rotation.y=-a+Math.PI/2;pad.add(lg)}
  pad.userData.label='launchpad';ctx.deco(pad)}};
T.bom=(B,D)=>{const p=B.p,M=D.M;return[['bodytube',`Korpus trubasi Ø${p.body.d} × ${p.body.len*10} mm`,{paper:'Spiral karton',glass:'Shisha tola',carbon:'Karbon'}[p.body.mat]+`, devor ${p.body.wall} mm`,1,D.wBody],['nosecone',`Burun konusi: ${NOSE[p.nose.shape].n}, ${p.nose.cal} kalibr`,p.nose.ballast?`Ballast ${p.nose.ballast} g`:'',1,D.wNose],
 ['fins',`Stabilizator ${p.fins.root}/${p.fins.tip} × ${p.fins.span} mm`,`${{balsa:'Balza',ply:'Fanera',g10:'G10'}[p.fins.mat]} ${p.fins.th} mm`,+p.fins.n,D.wFins/p.fins.n],['motormount',`Dvigatel trubasi Ø${(+p.motor.mount)} mm + 2 markazlash halqasi + ilgak`,'',1,D.wMount],
 ['rmotor',`Dvigatel ${p.motor.cls}-${p.motor.delay}`,`${M.I} N·s, ${M.tb} s — bir martalik, sertifikatlangan`,1,M.m],['parachute',p.recov.type==='chute'?`Parashyut Ø${p.recov.d} sm (neylon, 6 stropa)`:`Lenta ${p.recov.d} sm`,'Olovdan himoya qog\'ozi bilan',1,D.wRec*.7],
 ['shockcord',`Amortizatsion shnur ${p.recov.cord} sm`,p.recov.kevlar?'Kevlar uchi bilan':'Rezina',1,D.wRec*.3],['launchlug',p.body.lug==='rod'?'Yo\'naltiruvchi halqa':'Rels tugmalari 1010 ×2','',1,4],['igniter',"Elektr o't oldirgich",'Dvigatel bilan birga',1,0]]};
// ---------- sinov: maydonda uchirish ----------
T.startTitle='Uchirishga tayyor';T.startNote="Raketa uchirish sterjenida. <b>Boshlash</b>, so'ng <b>W</b> (yoki bo'sh joy) — 3 soniya ortga sanash va uchirish. Kamera yerdan kuzatadi.";
T.linkMsg=()=>"O't oldirgich yoki xavfsizlik kaliti ulanmagan — dvigatel yonmaydi.";T.armMsg=()=>"Kalit qo'yildi. W — uchirish (3 soniya ortga sanash).";T.pilotZoom=true;
const SITE={x:-35,z:-25};T.pilotCam=[SITE.x+14,1.6,SITE.z+16];
T.simInit=(S,B)=>{S.pos.set(SITE.x,0,SITE.z);S.yaw=0;S.cam='pilot';S.st='pad';S.h=0;S.v=0;S.tt=0;S.chute=null;S.tilt=0;S.dx=0;S.dz=0;S.link=S.pf.WC.works.xt60&&S.pf.WC.works.key;
 if(!simScene.userData.rpad){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1.2,8),new THREE.MeshStandardMaterial({color:'#c0c4c9',metalness:.9,roughness:.3})));g.children[0].position.y=.6;
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.03,24),new THREE.MeshStandardMaterial({color:'#3a3f46'}));b.position.y=.015;g.add(b);g.position.set(SITE.x+.012,0,SITE.z);simScene.add(g);simScene.userData.rpad=g}
 const fl=new THREE.Mesh(new THREE.ConeGeometry(S.D.M.d/20*.9,S.D.M.d/20*6,16),new THREE.MeshBasicMaterial({color:'#ffb74d',transparent:true,opacity:.9}));fl.rotation.x=Math.PI;fl.position.y=2.2-.9-S.D.M.d/20*3;fl.visible=false;S.model.add(fl);S.flame=fl};
T.simTick=(S,dt,I)=>{const D=S.D,B=S.B,p=B.p,g=9.81,rho=airDensity(B.env.alt,B.env.temp),A=Math.PI*(D.d/2)**2;
 if(S.st==='pad'&&S.armed&&(I.thrUp||KEYS.Space||KEYS.ArrowUp)){S.st='count';S.tt=3;snd('click')}
 if(S.st==='count'){S.tt-=dt;S.status=`Uchirishgacha: ${Math.ceil(S.tt)}…`;if(S.tt<=0){S.st='burn';S.tt=0;snd('boom',.35);S.status='Dvigatel yondi!'}}
 if(S.st==='burn'||S.st==='coast'||S.st==='chute'||S.st==='ballistic'){S.tt+=dt;const M=D.M,mp=M.mp/1000,m0=D.AUW/1000,m=S.tt<M.tb?m0-mp*S.tt/M.tb:m0-mp,F=S.tt<M.tb?D.F:0;
  if(S.st==='burn'&&S.tt>=M.tb){S.st='coast';S.status="Dvigatel yonib bo'ldi — inersiya bilan ko'tarilmoqda"}
  const unstable=D.stab<.3&&S.h>RAIL;if(unstable&&!S.fail&&S.st!=='chute'){S.tilt+=dt*6;if(!S.uMsg){S.uMsg=1;S.status="Raketa aylanib ketdi — barqaror emas (CP og'irlik markazidan oldinda)!"}}
  if(S.st==='chute'){const Ac=p.recov.type==='chute'?Math.PI*(p.recov.d/200)**2:(p.recov.d/100)*D.d*1.6,Cd=p.recov.type==='chute'?1.5:.55;S.v+=(-g-.5*rho*Cd*Ac*S.v*Math.abs(S.v)/m)*dt;S.dx+=WIND*dt}
  else{const cd=unstable?D.Cd*6:D.Cd;const a=(F*Math.cos(S.tilt)-.5*rho*cd*A*S.v*Math.abs(S.v))/m-g;if(!(S.h<=0&&a<0&&S.st==='burn'))S.v+=a*dt;if(S.h>RAIL&&!unstable)S.tilt+=(Math.atan2(WIND,Math.max(5,Math.abs(S.v)))*.25-S.tilt)*Math.min(1,dt*2);S.dx+=Math.sin(S.tilt)*S.v*dt}
  S.h=Math.max(0,S.h+S.v*dt);
  if((S.st==='coast'||S.st==='burn')&&S.tt>=M.tb+p.motor.delay){if(Math.abs(S.v)>25){S.st='ballistic';S.status=`Parashyut ${fmt(Math.abs(S.v))} m/s tezlikda ochilib yirtildi!`;snd('err')}else{S.st='chute';snd('ok');S.status=`Parashyut ochildi (${fmt(S.h)} m balandlikda)`;
   const cr=p.recov.type==='chute'?p.recov.d/2:4,cm=new THREE.Group(),dome=new THREE.Mesh(new THREE.SphereGeometry(cr,24,10,0,Math.PI*2,0,Math.PI/2.2),new THREE.MeshStandardMaterial({color:B.col.chute,side:THREE.DoubleSide,roughness:.7}));
   if(p.recov.type==='chute'){dome.position.y=D.len*100+cr*1.4;cm.add(dome);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;cm.add(wireMesh([[0,D.len*100,0],[Math.cos(a)*cr*.95,D.len*100+cr*1.4,Math.sin(a)*cr*.95]],'#eee',.06))}}
   else cm.add(box(D.d*160,p.recov.d,.1,MAT('strm'+B.col.chute,()=>new THREE.MeshStandardMaterial({color:B.col.chute,side:THREE.DoubleSide})),0,D.len*100+p.recov.d/2,0));S.model.add(cm);S.chute=cm}}
  if(S.h<=0&&S.tt>M.tb+.2){S.h=0;const vv=Math.abs(S.v);S.v=0;if(S.st==='chute'&&vv<8){S.st='landed';S.status=`Qo'ndi: ${fmt(vv,1)} m/s. Apogey ${fmt(S.maxH)} m.`;snd('ok')}else if(!S.fail){S.st='landed';crash(S,S.st==='ballistic'||vv>15?`Raketa ${fmt(vv)} m/s tezlikda yerga urildi. ${S.tilt>1?'Barqaror emasligi sababli':'Parashyut ishlamadi'}.`:`Qattiq qo'ndi (${fmt(vv,1)} m/s) — parashyut kichik.`)}}}
 S.flame.visible=S.st==='burn';if(S.st==='burn'&&Math.random()<.7)puff(S,1,'#cfcfcf');
 S.pos.set(SITE.x+S.dx,S.h,SITE.z+S.dz);S.pitch=S.st==='chute'?.35:-S.tilt;S.roll=0;S.vel.set(0,S.v,0);S.amp=S.st==='burn'?D.F:0;S.volt=12;humSet(S.st==='burn',1)};
regType(T);
})();
