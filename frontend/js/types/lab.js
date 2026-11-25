/* =====================================================================
   ARDUINO LABORATORIYASI — maket plata (breadboard) ustida elektron sxema
     LED toki      I = (V − Vf) / R   (Vf: qizil 2,0 V, yashil/ko'k/oq 3,0 V; xavfsiz ≤ 20 mA)
     pin toki      bitta pin ≤ 40 mA (tavsiya 20 mA), USB 5 V ≤ 500 mA
     potensiometr  analogRead = 1023 · Vwiper / 5
   ===================================================================== */
(()=>{
const LED={red:{n:'Qizil',vf:2,c:'#ff2d2d'},green:{n:'Yashil',vf:3,c:'#2dff6a'},blue:{n:"Ko'k",vf:3,c:'#3d8bff'},yellow:{n:'Sariq',vf:2.1,c:'#ffd02d'},white:{n:'Oq',vf:3.1,c:'#f4f7ff'}};
const BRD={uno:{n:'Arduino Uno R3',v:5,pwm:[3,5,6,9,10,11],w:6.86,d:5.34,col:'#00798c'},nano:{n:'Arduino Nano',v:5,pwm:[3,5,6,9,10,11],w:4.5,d:1.8,col:'#1565c0'},esp32:{n:'ESP32 DevKit',v:3.3,w:5.15,d:2.8,col:'#1b1b1b'}};
const T={id:'lab',name:'Arduino laboratoriyasi',ic:'chip',desc:"Maket platada sxema: LED, tugma, potensiometr, buzzer, servo, LCD — kod yozib simulyatsiya qiling.",defPreset:'starter',defPurpose:'learn',
 purposes:{learn:{t:"O'rganish",note:'Sxema yig\'ish va kod yozish'}},colors:{wire:'#ff9800'},paint:[],
 spec:{
  board:{t:'Plata va maket',ic:'chip',g:'mcu',f:[{k:'kind',l:'Plata',type:'sel',o:Object.fromEntries(Object.entries(BRD).map(([k,v])=>[k,v.n]))},{k:'bb',l:'Maket plata (breadboard)',type:'sel',o:{half:'Yarim (400 nuqta)',full:"To'liq (830 nuqta)"},g:'breadboard'}]},
  led:{t:'LED va rezistor',ic:'bulb',g:'led',f:[{k:'on',l:'LED',type:'bool'},{k:'color',l:'Rangi',type:'sel',o:Object.fromEntries(Object.entries(LED).map(([k,v])=>[k,v.n]))},{k:'r',l:'Rezistor',type:'sel',o:{0:"Yo'q (0 Ω)",47:'47 Ω',100:'100 Ω',220:'220 Ω',330:'330 Ω',1000:'1 kΩ',10000:'10 kΩ'},g:'resistor'}]},
  btn:{t:'Tugma',ic:'dot',g:'button',f:[{k:'on',l:'Tugma',type:'bool'},{k:'pull',l:'Ulanish usuli',type:'sel',o:{pullup:'INPUT_PULLUP (GND ga)',pulldown:'10 kΩ pull-down (5V ga)',none:"Rezistorsiz (suzuvchi)"},g:'pullup'}]},
  pot:{t:'Potensiometr',ic:'sliders',g:'pot',f:[{k:'on',l:'Potensiometr',type:'bool'},{k:'k',l:'Qarshiligi',type:'sel',o:{1:'1 kΩ',10:'10 kΩ',100:'100 kΩ'}}]},
  buz:{t:'Buzzer',ic:'volume',g:'buzzer',f:[{k:'on',l:'Buzzer',type:'bool'},{k:'kind',l:'Turi',type:'sel',o:{active:'Aktiv (o\'zi chiyillaydi)',passive:'Passiv (tone() kerak)'}}]},
  servo:{t:'Servo SG90',ic:'servo',g:'servo',f:[{k:'on',l:'Servo',type:'bool'}]},
  lcd:{t:'LCD 16×2 (I2C)',ic:'image',g:'lcd',f:[{k:'on',l:'LCD displey',type:'bool'},{k:'addr',l:'I2C manzil',type:'sel',o:{'0x27':'0x27','0x3F':'0x3F'},g:'i2c'}]}},
 presets:{
  starter:{name:"Boshlang'ich to'plam",desc:'LED, tugma, potensiometr, servo, LCD',purpose:'learn',p:{board:{kind:'uno',bb:'half'},led:{on:true,color:'red',r:220},btn:{on:true,pull:'pullup'},pot:{on:true,k:10},buz:{on:true,kind:'passive'},servo:{on:true},lcd:{on:true,addr:'0x27'}}},
  blink:{name:'Blink — birinchi dastur',desc:'Faqat LED va rezistor',purpose:'learn',p:{board:{kind:'uno',bb:'half'},led:{on:true,color:'green',r:330},btn:{on:false,pull:'pullup'},pot:{on:false,k:10},buz:{on:false,kind:'active'},servo:{on:false},lcd:{on:false,addr:'0x27'}}},
  esp:{name:'ESP32 + LCD + potensiometr',desc:'3,3 V mantiq',purpose:'learn',p:{board:{kind:'esp32',bb:'full'},led:{on:true,color:'blue',r:100},btn:{on:false,pull:'pullup'},pot:{on:true,k:10},buz:{on:false,kind:'active'},servo:{on:false},lcd:{on:true,addr:'0x27'}}}},
 steps:[
  {id:'board',t:'Plata va maket',ic:'chip',cats:['board'],slots:()=>['board','bb'],intro:"Maket platada teshiklar ichida metall qisqichlar bor: har bir 5 talik ustun o'zaro ulangan, chetdagi qizil/ko'k qatorlar — + va − shinalari."},
  {id:'inputs',t:'LED, tugma, potensiometr',ic:'bulb',cats:['led','btn','pot'],slots:B=>[B.p.led.on&&'led',B.p.led.on&&'res',B.p.btn.on&&'btn',B.p.pot.on&&'pot'].filter(Boolean),intro:"LED doim rezistor bilan ulanadi — aks holda tok cheklanmaydi va LED yoki pin kuyadi. Tugmaga pull-up yoki pull-down kerak, aks holda kirish «suzadi»."},
  {id:'outputs',t:'Buzzer, servo, LCD',ic:'servo',cats:['buz','servo','lcd'],slots:B=>[B.p.buz.on&&'buz',B.p.servo.on&&'servo',B.p.lcd.on&&'lcd'].filter(Boolean),intro:"Servo burchakka PWM signal bilan buriladi, LCD esa faqat 2 ta simdan (I2C: SDA va SCL) boshqariladi."},
  {id:'wiring',kind:'wiring',t:'Simlar (jumper)',ic:'plug',intro:"Har bir komponentning GND simi platadagi GND ga. LED anodi (uzun oyog'i) pin ga, katodi rezistor orqali GND ga."},
  {id:'bom',kind:'bom',t:'Kod va detallar',ic:'terminal'},{id:'check',kind:'check',t:'Tekshiruv',ic:'chart'},{id:'test',kind:'test',t:'Simulyatsiya',ic:'play'}],
 req:{bb:'board',led:'bb',res:'led',btn:'bb',pot:'bb',buz:'bb',servo:'board',lcd:'board'},
 labels:{board:'mcu',bb:'breadboard',led:'led',res:'resistor',btn:'button',pot:'pot',buz:'buzzer',servo:'servo',lcd:'lcd'},
 chart:{title:"LED toki va yorqinligi (PWM bo'yicha)",cols:['PWM','Yorqinlik, %','Tok, mA','Quvvat, mW','—'],l1:'■ Yorqinlik (%)',l2:'■ Tok (mA)'}};
T.derive=B=>{const p=B.p,Bd=BRD[p.board.kind],V=Bd.v,L=LED[p.led.color],R=+p.led.r;
 const ledI=p.led.on?(R>0?Math.max(0,(V-L.vf)/R*1000):Math.max(0,(V-L.vf)/25*1000)):0,potI=p.pot.on?V/(p.pot.k*1000)*1000:0,servoI=p.servo.on?250:0,lcdI=p.lcd.on?25:0,buzI=p.buz.on?30:0,boardI=p.board.kind==='esp32'?120:50;
 const total=ledI+potI+servoI+lcdI+buzI+boardI;
 return{V,ledI,potI,servoI,total,vTop:0,AUW:50,V0:V,Vn:V,parts:[['Plata',25],['Maket plata',40],['Komponentlar',30]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>({t,thrust:t,amp:ledI*t/100,watt:ledI*t/100*V,eff:0}))}};
T.metrics=(B,D)=>[{l:'LED toki',v:B.p.led.on?fmt(D.ledI,1)+' mA':'—',lvl:D.ledI>40?'bad':D.ledI>20?'warn':'ok'},{l:'Umumiy tok',v:fmt(D.total)+' mA',lvl:D.total>500?'bad':D.total>400?'warn':'ok'},{l:'Mantiq',v:D.V+' V'},{l:'Komponentlar',v:['led','btn','pot','buz','servo','lcd'].filter(k=>B.p[k].on).length+' ta'}];
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y});
 if(p.led.on&&+p.led.r===0)add('bad',"LED rezistorsiz ulangan",`Tok cheklanmaydi (~${fmt(D.ledI)} mA): LED va Arduino pini kuyadi. 220–330 Ω rezistor qo'ying.`);
 else if(D.ledI>40)add('bad',`LED toki ${fmt(D.ledI)} mA — pin chegarasidan oshdi`,'Bitta pin maksimal 40 mA beradi. Kattaroq rezistor kerak.');else if(D.ledI>20)add('warn',`LED toki ${fmt(D.ledI)} mA`,'20 mA dan ortiq — LED umri qisqaradi. 220 Ω yoki undan katta rezistor.');
 if(p.led.on&&D.ledI<1)add('warn','LED juda xira yonadi',`Tok atigi ${fmt(D.ledI,2)} mA. Rezistorni kamaytiring.`);
 {const Bd=BRD[p.board.kind],lp=pinNo(B.wires.ledA);if(p.led.on&&p.pot.on&&Bd.pwm&&lp>=0&&!Bd.pwm.includes(lp))add('warn',`LED ${B.wires.ledA} pinida — PWM yo'q`,"analogWrite() bu pinda faqat yoqadi/o'chiradi: yorqinlik silliq o'zgarmaydi. LED ni ~ belgili pinga (3, 5, 6, 9, 10, 11) ulang.")}
 if(p.btn.on&&p.btn.pull==='none')add('warn','Tugma kirishi «suzadi»',"Rezistorsiz kirish havoda antenna kabi — bosilmasa ham tasodifiy 0/1 o'qiladi. INPUT_PULLUP ishlating.");
 if(D.total>500)add('bad',`USB toki yetmaydi (${fmt(D.total)} mA)`,"Servo motor ko'p tok oladi — alohida 5 V manba ulang.");else if(p.servo.on)add('info','Servo 5V pindan ta\'minlanmoqda',"Kichik SG90 uchun yetadi; katta servolar uchun alohida manba kerak.");
 if(p.board.kind==='esp32'&&p.lcd.on)add('info','ESP32 da I2C pinlari: SDA — GPIO21, SCL — GPIO22','LCD modul 5 V da ishlaydi, lekin 3,3 V I2C signalni odatda qabul qiladi.');
 if(p.buz.on&&p.buz.kind==='passive')add('info','Passiv buzzer',"Ovoz uchun tone(pin, chastota) kerak — digitalWrite faqat chirt etadi.");
 return L};
T.catInfo=(cat,d,p,a)=>{if(cat==='led'){a('LED toki',fmt(d.ledI,1)+' mA');a('Tavsiya',`R ≥ ${fmt((d.V-LED[p.led.color].vf)/.02)} Ω`)}a('Umumiy tok',fmt(d.total)+' mA');a('Mantiq kuchlanishi',d.V+' V')};
T.ext=D=>[['LED toki',fmt(D.ledI,1)+' mA'],['Potensiometr toki',fmt(D.potI,2)+' mA'],['Servo (cho\'qqi)',fmt(D.servoI)+' mA'],['Jami',fmt(D.total)+' mA']];
const pinOf=pid=>pid?(/^A\d$/.test(pid)?pid:pid.replace(/^[DG]/,'')):null,pinNo=v=>!v?-1:/^A\d$/.test(v)?14+(+v[1]):+v.replace(/^[DG]/,'');
T.wiring=B=>{const p=B.p,Bd=BRD[p.board.kind],esp=p.board.kind==='esp32';
 const dig=esp?['G2','G4','G5','G12','G13','G14','G15','G16','G17','G18','G19','G23','G25','G26','G27','G32']:['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'],ana=esp?['G33','G34','G35','G36']:['A0','A1','A2','A3'];
 const pwm=esp?dig:dig.filter(x=>Bd.pwm.includes(+x.slice(1))),lab=x=>esp?x.replace('G','IO'):(Bd.pwm&&Bd.pwm.includes(+x.slice(1))?'~'+x:x),left=[...dig,...ana],sp=500/(left.length-1);
 const board={id:'board',label:Bd.n,x:620,y:70,w:250,h:520,need:'board',pads:[...left.map((x,i)=>({id:x,t:'sig',x:620,y:80+i*sp,l:lab(x),title:ana.includes(x)?'Analog kirish (0–1023)':pwm.includes(x)?'Raqamli pin, PWM bor (~)':'Raqamli pin'})),
  {id:'5V',t:'5v',x:870,y:110,l:esp?'5V (USB)':'5V'},{id:'3V3',t:'5v',x:870,y:160,l:'3V3'},{id:'VIN',t:'9v',x:870,y:210,l:'VIN',title:'VIN — 7–12 V kirish (5 V qurilma uchun emas!)'},{id:'GND1',t:'gnd',x:870,y:280,l:'GND'},{id:'GND2',t:'gnd',x:870,y:330,l:'GND'},{id:'GND3',t:'gnd',x:870,y:380,l:'GND'},
  {id:'SDA',t:'sig',x:870,y:470,l:esp?'SDA (IO21)':'SDA (A4)',title:'I2C ma\'lumot'},{id:'SCL',t:'sig',x:870,y:530,l:esp?'SCL (IO22)':'SCL (A5)',title:'I2C takt'}]};
 const G=['GND1','GND2','GND3'],sig=(id,l,ok,col)=>({id,l,col:col||'#fdd835',kind:'sig',ok,grp:'pin',w:2.5}),comps=[];let y=70;const at=()=>{const v=y;y+=95;return v};
 if(p.led.on)comps.push({id:'cled',label:`${LED[p.led.color].n} LED`,x:300,y:at(),need:'led',wires:[sig('ledA','anod (+)',[...pwm,...dig.filter(x=>!pwm.includes(x))],'#e53935'),{id:'ledK',l:'katod (R orqali)',col:'#222',kind:'gnd',ok:G,w:2.5}]});
 if(p.btn.on)comps.push({id:'cbtn',label:'Tugma',x:300,y:at(),need:'btn',wires:[sig('btnS','signal',dig,'#43a047'),p.btn.pull==='pulldown'?{id:'btnV',l:'5V',col:'#e53935',kind:'p5',ok:['5V'],w:2.5}:{id:'btnG',l:'GND',col:'#222',kind:'gnd',ok:G,w:2.5}]});
 if(p.pot.on)comps.push({id:'cpot',label:'Potensiometr',x:300,y:at(),need:'pot',wires:[{id:'potV',l:'VCC',col:'#e53935',kind:'p5',ok:['5V','3V3'],w:2.5},sig('potW','surgich',ana,'#90caf9'),{id:'potG',l:'GND',col:'#222',kind:'gnd',ok:G,w:2.5}]});
 if(p.buz.on)comps.push({id:'cbuz',label:'Buzzer',x:300,y:at(),need:'buz',wires:[sig('buzS','+',dig,'#ff9800'),{id:'buzG',l:'−',col:'#222',kind:'gnd',ok:G,w:2.5}]});
 if(p.servo.on)comps.push({id:'csrv',label:'Servo SG90',x:300,y:at(),need:'servo',wires:[{id:'srvV',l:'VCC',col:'#e53935',kind:'p5',ok:['5V'],w:2.5},{id:'srvG',l:'GND',col:'#5d4037',kind:'gnd',ok:G,w:2.5},sig('srvS','signal',pwm,'#ff9800')]});
 if(p.lcd.on)comps.push({id:'clcd',label:'LCD 16×2 I2C',x:300,y:at(),need:'lcd',wires:[{id:'lcdV',l:'VCC',col:'#e53935',kind:'p5',ok:['5V'],w:2.5},{id:'lcdG',l:'GND',col:'#222',kind:'gnd',ok:G,w:2.5},sig('lcdD','SDA',['SDA'],'#43a047'),sig('lcdC','SCL',['SCL'],'#e0e0e0')]});
 return{boards:[board],comps,hint:"Signal simlari pinlarga, VCC — 5V ga, GND — GND ga. Potensiometr surgichi faqat analog (A) pinga, servo signali — PWM (~) pinga, LCD — SDA va SCL ga."}};
// ---------- 3D model (sm), stol ustida ----------
function lcdTex(lines,bl){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle=bl?'#7fd13b':'#2f4a1c';g.fillRect(0,0,256,64);g.font='bold 24px monospace';g.fillStyle=bl?'#0b2a05':'#1b2b10';
 (lines||['','']).forEach((t,i)=>g.fillText(String(t).slice(0,16),6,26+i*30));const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx}
T.build=(B,D,ctx)=>{const p=B.p,Bd=BRD[p.board.kind],bbW=p.board.bb==='full'?16.5:8.2,bbD=5.5,ox=Bd.w/2+1+bbW/2,Wm=(pt,col,r)=>wireMesh(pt,col,r||.05);
 // plata
 {const g=new THREE.Group();g.add(tagP(box(Bd.w,.16,Bd.d,mPCB(Bd.col,p.board.kind==='uno'?'UNO':p.board.kind==='nano'?'NANO':'ESP32'),-ox+bbW/2,.5,0),'Plata (PCB)',1));
  g.add(tagP(box(Math.min(3.5,Bd.w*.5),.35,Math.min(.9,Bd.d*.3),mPlastic('#111',.4),-ox+bbW/2,.75,0),'Mikrokontroller',2));
  for(const sz of[-1,1])g.add(tagP(box(Bd.w*.82,.85,.25,mPlastic('#0d0d0d',.4),-ox+bbW/2,1,sz*(Bd.d/2-.2)),'Ulagich qatorlari (header)',3));
  g.add(tagP(box(1.2,1.1,1.6,mMetal('#c9ced4',.25),-ox+bbW/2-Bd.w/2+.5,1,-Bd.d*.15),'USB ulagich',4));
  const led=box(.2,.1,.14,mPlastic('#5d4020',.4),-ox+bbW/2-Bd.w*.1,.62,Bd.d*.18);led.userData.led13=true;g.add(tagP(led,'«L» LED (D13)',5));g.add(sph(.08,mGlow('#4caf50'),-ox+bbW/2+Bd.w*.3,.62,Bd.d*.18));
  g.add(tagP(box(Bd.w*1.05,.4,Bd.d*1.05,mPlastic('#f2f2f2',.7),-ox+bbW/2,.2,0),'Qo\'yilma (stend)',0));ctx.add('board',g,[-4,0,0])}
 // maket plata: teshiklar va +/− shinalari
 {const g=new THREE.Group(),tx=MAT('bbtex'+bbW,()=>{const c=document.createElement('canvas'),n=Math.round(bbW/.254),W=n*8,H=Math.round(bbD/.254)*8;c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#f3f1ea';x.fillRect(0,0,W,H);
   for(let i=0;i<n;i++)for(let j=0;j<H/8;j++){if(j===2||j===3||j===10||j===H/8-3||j===H/8-4)continue;x.fillStyle='#3a3a3a';x.fillRect(i*8+2,j*8+2,4,4)}x.fillStyle='#d32f2f';x.fillRect(0,4,W,1.5);x.fillRect(0,H-6,W,1.5);x.fillStyle='#1565c0';x.fillRect(0,18,W,1.5);x.fillRect(0,H-20,W,1.5);
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.7})});
  g.add(tagP(box(bbW,.9,bbD,tx,bbW/2-ox+Bd.w/2+1,.45,0),'Maket plata (ichida metall qisqichlar)',1));ctx.add('bb',g,[4,0,0])}
 const bx=x=>-ox+Bd.w+1+x,top=.92,brdPin=[-ox+bbW/2-Bd.w*.3,1.45,-Bd.d/2+.2];
 if(p.led.on){const g=new THREE.Group(),c=LED[p.led.color].c,lm=MAT('ledoff'+c,()=>new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:.75,roughness:.15,transmission:.3}));
  const dome=new THREE.Mesh(GEO('ledd',()=>new THREE.CapsuleGeometry(.25,.35,6,14)),lm);dome.position.set(bx(1),top+.75,-1);dome.userData.labLed=c;dome.castShadow=true;g.add(tagP(dome,'LED korpusi (linza)',1));
  g.add(tagP(cyl(.29,.29,.08,lm,bx(1),top+.42,-1,16),'LED korpusi (linza)',1));for(const[dx,l]of[[-.1,.5],[.1,.38]])g.add(tagP(cyl(.025,.025,l,mMetal('#cfd8dc',.2),bx(1)+dx,top+.2,-1,6),'Oyoqchalar (anod uzun)',2));
  g.add(Wm([[bx(1)-.1,top,-1.2],[bx(1)-2,top+2,-2],brdPin],'#e53935',.05));ctx.add('led',g,[0,3,0])}
 if(p.led.on){const g=new THREE.Group(),r=cyl(.12,.12,.65,mPlastic('#d8c8a0',.5),bx(2),top+.35,-.2,12);r.rotation.z=Math.PI/2;g.add(tagP(r,'Rezistor korpusi',1));
  const bands={0:['#000','#000','#000'],47:['#ff0','#7b1fa2','#000'],100:['#8b4513','#000','#8b4513'],220:['#d32f2f','#d32f2f','#8b4513'],330:['#ff8c00','#ff8c00','#8b4513'],1000:['#8b4513','#000','#d32f2f'],10000:['#8b4513','#000','#ff8c00']}[p.led.r]||['#000','#000','#000'];
  bands.forEach((col,i)=>{const b=cyl(.125,.125,.06,mPlastic(col,.5),bx(2)-.18+i*.12,top+.35,-.2,12);b.rotation.z=Math.PI/2;g.add(tagP(b,"Rang halqalari (qarshilik kodi)",2))});ctx.add('res',g,[0,3,0])}
 if(p.btn.on){const g=new THREE.Group();g.add(tagP(box(1.2,.35,1.2,mPlastic('#1a1a1a',.4),bx(3.6),top+.18,-1),'Tugma korpusi',1));const cap=cyl(.35,.35,.3,mPlastic('#e53935',.4),bx(3.6),top+.5,-1,20);cap.userData.btnCap=true;g.add(tagP(cap,'Tugma qalpoqchasi',2));
  g.add(Wm([[bx(3.6),top,-1.5],[bx(1),top+2.4,-2.4],brdPin],'#43a047',.05));ctx.add('btn',g,[0,3,0])}
 if(p.pot.on){const g=new THREE.Group();g.add(tagP(box(1.4,.8,1.2,mPlastic('#1565c0',.4),bx(5.6),top+.4,-.9),'Potensiometr korpusi (rezistiv qatlam ichida)',1));const kn=cyl(.32,.32,.9,mPlastic('#eceff1',.4),bx(5.6),top+1.2,-.9,18);kn.userData.potKnob=true;g.add(tagP(kn,'Dastak (surgich)',2));
  g.add(tagP(box(.12,.12,.5,mPlastic('#333'),bx(5.6),top+1.68,-.9),'Dastak (surgich)',2));g.add(Wm([[bx(5.6),top,-1.6],[bx(2),top+2.8,-2.6],brdPin],'#90caf9',.05));ctx.add('pot',g,[0,3,0])}
 if(p.buz.on){const g=new THREE.Group(),b=cyl(.6,.6,.8,mPlastic('#111',.3),bx(7.2),top+.4,1.2,24);b.userData.buzzer=true;g.add(tagP(b,'Buzzer korpusi (pyezo element ichida)',1));g.add(tagP(cyl(.12,.12,.05,mPlastic('#333'),bx(7.2),top+.82,1.2,12),'Ovoz teshigi',2));
  g.add(Wm([[bx(7.2),top,.8],[bx(3),top+2,-2.2],brdPin],'#ff9800',.05));ctx.add('buz',g,[0,3,0])}
 if(p.servo.on){const s=mkServo('micro','#1565c0');s.position.set(bx(bbW-1.8),0,3.5);const h=s.userData.horn;h.userData.servoHorn=true;s.add(Wm([[-1.4,.4,0],[-4,1.5,-2],[brdPin[0]-bx(bbW-1.8),brdPin[1],brdPin[2]-3.5]],'#ff9800',.05));ctx.add('servo',s,[0,4,3])}
 if(p.lcd.on){const g=new THREE.Group(),yy=0,zz=-6.2;g.add(tagP(box(8,.16,3.6,mPCB('#1b5e20','LCD1602'),bx(bbW/2)-ox*0,2.2,zz),'Displey platasi',1));const fr=box(7.1,.45,2.4,mPlastic('#111',.4),bx(bbW/2),2.45,zz);g.add(tagP(fr,'Ramka',2));
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(6.4,1.6),new THREE.MeshBasicMaterial({map:lcdTex(['Konstruktor','LCD 16x2'],true)}));scr.rotation.x=-Math.PI/2;scr.position.set(bx(bbW/2),2.69,zz);scr.userData.lcdScreen=true;scr.userData.dispose=true;g.add(tagP(scr,'Suyuq kristall ekran',3));
  g.add(tagP(box(4,.6,1.2,mPCB('#000000','I2C'),bx(bbW/2),1.85,zz+1),'I2C adapter (PCF8574)',4));for(const sx of[-3.4,3.4])g.add(cyl(.12,.12,2.2,mMetal('#c9a227',.3),bx(bbW/2)+sx,1.1,zz,6));
  g.add(Wm([[bx(bbW/2)-1.8,1.9,zz+1.6],[bx(0),2.5,-4],brdPin],'#43a047',.05));ctx.add('lcd',g,[0,6,-3])}};
T.bom=(B,D)=>{const p=B.p,L=[['mcu',BRD[p.board.kind].n,'USB kabel bilan',1,25],['breadboard',p.board.bb==='full'?"Maket plata 830 nuqta":'Maket plata 400 nuqta','',1,40],['wire',"Jumper simlar (erkak-erkak) 20 ta",'',1,10]];
 if(p.led.on)L.push(['led',`${LED[p.led.color].n} LED 5 mm`,`Vf ≈ ${LED[p.led.color].vf} V`,1,.3],['resistor',`Rezistor ${p.led.r} Ω, 0,25 W`,'',1,.2]);if(p.btn.on)L.push(['button','Tugma 6×6 mm',p.btn.pull==='pulldown'?'+ 10 kΩ rezistor':'',1,1]);
 if(p.pot.on)L.push(['pot',`Potensiometr ${p.pot.k} kΩ`,'',1,5]);if(p.buz.on)L.push(['buzzer',p.buz.kind==='active'?'Aktiv buzzer 5 V':'Passiv buzzer','',1,2]);if(p.servo.on)L.push(['servo','Servo SG90 (9 g)','',1,9]);if(p.lcd.on)L.push(['lcd',`LCD 1602 + I2C adapter (${p.lcd.addr})`,'LiquidCrystal_I2C kutubxonasi',1,35]);return L};
T.codeTitle='Arduino kodi (tahrirlash mumkin)';
T.code=(B,D,WC)=>{const p=B.p,w=B.wires,LN=[],o=x=>LN.push(x),pn=id=>pinOf(w[id])||'/* ulanmagan */ 0';o(`// ${B.name} — Konstruktor Arduino laboratoriyasi`);
 if(p.servo.on)o('#include <Servo.h>');if(p.lcd.on){o('#include <Wire.h>');o('#include <LiquidCrystal_I2C.h>')}o('');
 if(p.led.on)o(`const int LED_PIN = ${pn('ledA')};`);if(p.btn.on)o(`const int BTN_PIN = ${pn('btnS')};`);if(p.pot.on)o(`const int POT_PIN = ${pn('potW')};`);if(p.buz.on)o(`const int BUZ_PIN = ${pn('buzS')};`);if(p.servo.on)o(`const int SERVO_PIN = ${pn('srvS')};`);
 if(p.servo.on)o('Servo servo;');if(p.lcd.on)o(`LiquidCrystal_I2C lcd(${p.lcd.addr}, 16, 2);`);o('');
 o('void setup() {');o('  Serial.begin(9600);');if(p.led.on)o('  pinMode(LED_PIN, OUTPUT);');if(p.btn.on)o(`  pinMode(BTN_PIN, ${p.btn.pull==='pullup'?'INPUT_PULLUP':'INPUT'});`);if(p.buz.on)o('  pinMode(BUZ_PIN, OUTPUT);');if(p.servo.on)o('  servo.attach(SERVO_PIN);');
 if(p.lcd.on){o('  lcd.init();');o('  lcd.backlight();');o('  lcd.setCursor(0, 0);');o('  lcd.print("Konstruktor lab");')}o('  Serial.println("Tayyor");');o('}');o('');
 o('void loop() {');
 if(p.pot.on){o('  int pot = analogRead(POT_PIN);            // 0..1023');if(p.led.on)o('  analogWrite(LED_PIN, map(pot, 0, 1023, 0, 255));   // yorqinlik');if(p.servo.on)o('  servo.write(map(pot, 0, 1023, 0, 180));            // burchak')}
 else if(p.led.on&&!p.btn.on){o('  digitalWrite(LED_PIN, HIGH);');o('  delay(500);');o('  digitalWrite(LED_PIN, LOW);');o('  delay(500);')}
 if(p.btn.on){o(`  bool pressed = digitalRead(BTN_PIN) == ${p.btn.pull==='pullup'?'LOW':'HIGH'};`);if(p.buz.on)o(p.buz.kind==='passive'?'  if (pressed) tone(BUZ_PIN, 880); else noTone(BUZ_PIN);':'  digitalWrite(BUZ_PIN, pressed ? HIGH : LOW);');if(p.led.on&&!p.pot.on)o('  digitalWrite(LED_PIN, pressed ? HIGH : LOW);')}
 if(p.lcd.on){o('  lcd.setCursor(0, 1);');o(p.pot.on?'  lcd.print("Pot: ");':'  lcd.print("Vaqt: ");');o(p.pot.on?'  lcd.print(pot);':'  lcd.print(millis() / 1000);');o('  lcd.print("     ");')}
 if(p.pot.on)o('  Serial.println(pot);');o(p.pot.on||p.btn.on?'  delay(50);':'');o('}');return LN.filter((x,i,a)=>!(x===''&&a[i-1]==='')).join('\n')};
// ---------- simulyatsiya: stol ustidagi sxema ----------
const SITE={x:20,z:60};
T.startTitle='Simulyatsiyaga tayyor';T.startNote="Sxema stolda. <b>Bo'sh joy</b> yoki <b>B</b> — tugmani bosish, <b>← →</b> (yoki A/D) — potensiometrni burash. Kod «Kod va detallar» bosqichida tahrirlanadi.";
T.linkMsg=()=>"Plata ulanmagan.";T.armMsg=()=>"Kod ishlamoqda. Bo'sh joy — tugma, ← → — potensiometr.";T.pilotCam=[SITE.x+.02,1.02,SITE.z+.27];T.noSpeed=true;
T.simInit=(S,B,WC)=>{S.pos.set(SITE.x,.76,SITE.z);S.yaw=0;S.cam='pilot';S.st='run';S.link=true;S.pot=512;S.mode='code';
 if(!simScene.userData.desk){const g=new THREE.Group(),wm=new THREE.MeshStandardMaterial({color:'#8d6e4f',roughness:.8});const top=new THREE.Mesh(new THREE.BoxGeometry(1.4,.04,.8),wm);top.position.y=.74;top.receiveShadow=true;g.add(top);
  for(const sx of[-.65,.65])for(const sz of[-.35,.35]){const l=new THREE.Mesh(new THREE.BoxGeometry(.05,.74,.05),wm);l.position.set(sx,.37,sz);g.add(l)}const mat=new THREE.Mesh(new THREE.BoxGeometry(.6,.004,.4),new THREE.MeshStandardMaterial({color:'#1e5e3b',roughness:.9}));mat.position.y=.762;g.add(mat);
  g.position.set(SITE.x,0,SITE.z);simScene.add(g);simScene.userData.desk=g}
 S.lab={};S.model.traverse(o=>{for(const k of['labLed','btnCap','potKnob','servoHorn','lcdScreen','led13','buzzer'])if(o.userData[k])S.lab[k]=o});
 const w=WC.works,p=B.p,res=+p.led.r;S.io={pins:{},serial:[]};const ledPin=pinNo(B.wires.ledA),btnPin=pinNo(B.wires.btnS),potPin=pinNo(B.wires.potW),buzPin=pinNo(B.wires.buzS),srvPin=pinNo(B.wires.srvS);
 S.ledOk=p.led.on&&w.cled&&B.inst.res;S.ledBurn=S.ledOk&&res===0;S.lcdOk=p.lcd.on&&w.clcd;S.srvOk=p.servo.on&&w.csrv;S.potOk=p.pot.on&&w.cpot;S.btnOk=p.btn.on&&w.cbtn;S.buzOk=p.buz.on&&w.cbuz;S.btnPin=btnPin;S.pressed=false;
 const r=ARD.run(B.code||T.code(B,S.D,WC),{write:(pin,v,pwm)=>{const Bd=BRD[p.board.kind];if(pwm&&Bd.pwm&&!Bd.pwm.includes(pin))v=v>=.5?1:0;S.io.pins[pin]=v},read:pin=>pin===btnPin?(S.btnOk?(p.btn.pull==='pullup'?(S.pressed?0:1):p.btn.pull==='pulldown'?(S.pressed?1:0):(Math.random()<.5?1:0)):Math.random()<.5?1:0):0,
  aread:pin=>pin===potPin&&S.potOk?Math.round(S.pot):Math.floor(Math.random()*40+300),servo:(pin,a)=>{if(pin===srvPin&&S.srvOk)S.srvA=a},lcd:(lines,bl)=>{S.lcdLines=lines;S.lcdBl=bl;S.lcdDirty=true},
  tone:(pin,f)=>{if(pin===buzPin)S.toneF=f},serial:t=>{S.io.serial.push(t);if(S.io.serial.length>40)S.io.serial.shift()}});
 if(!r.ok){S.status='Kodda xato: '+r.err;S.ard=null}else{S.ard=r.R;S.status='Kod ishga tushdi'}
 if(S.ledBurn)S.status="LED rezistorsiz ulangan — birinchi yonishda kuyadi!"};
T.simTick=(S,dt)=>{const B=S.B,p=B.p;S.pos.set(SITE.x,.76,SITE.z);S.vel.set(0,0,0);if(!S.armed||!S.ard)return;
 S.pressed=!!(KEYS.Space||KEYS.KeyB);const d=(KEYS.ArrowRight||KEYS.KeyD?1:0)-(KEYS.ArrowLeft||KEYS.KeyA?1:0);S.pot=Math.max(0,Math.min(1023,S.pot+d*dt*600));
 S.ard.step(dt*1000);const P=S.io.pins,L=S.lab;
 if(L.btnCap)L.btnCap.position.y=L.btnCap.userData.y0??(L.btnCap.userData.y0=L.btnCap.position.y),L.btnCap.position.y=L.btnCap.userData.y0-(S.pressed?.12:0);
 if(L.potKnob)L.potKnob.rotation.y=-(S.pot/1023-.5)*Math.PI*1.5;
 if(L.labLed){const v=S.ledOk?(P[pinNo(B.wires.ledA)]||0):0;if(S.ledBurn&&v>0&&!S.ledDead){S.ledDead=true;puff(S,4,'#444');snd('boom',.2);S.status="LED kuydi: tok cheklanmadi. Rezistor qo'shing."}
  const on=v>0&&!S.ledDead;L.labLed.material=on?MAT('ledon'+L.labLed.userData.labLed+Math.round(v*4),()=>new THREE.MeshStandardMaterial({color:L.labLed.userData.labLed,emissive:L.labLed.userData.labLed,emissiveIntensity:.5+v*3})):S.ledDead?MAT('ledburnt',()=>new THREE.MeshStandardMaterial({color:'#2a2a2a',roughness:.9})):MAT('ledoff2'+L.labLed.userData.labLed,()=>new THREE.MeshPhysicalMaterial({color:L.labLed.userData.labLed,transparent:true,opacity:.7,roughness:.15}))}
 if(L.led13)L.led13.material=P[p.board.kind==='esp32'?2:13]?mGlow('#ffa726'):mPlastic('#5d4020',.4);
 if(L.servoHorn&&S.srvA!=null){L.servoHorn.rotation.y+=(((S.srvA-90)*Math.PI/180)-L.servoHorn.rotation.y)*Math.min(1,dt*10)}
 if(L.lcdScreen&&S.lcdDirty){S.lcdDirty=false;const old=L.lcdScreen.material.map;L.lcdScreen.material.map=S.lcdOk?lcdTex(S.lcdLines,S.lcdBl):lcdTex(['',''],false);L.lcdScreen.material.needsUpdate=true;if(old)old.dispose()}
 const buz=S.buzOk&&(p.buz.kind==='active'?P[pinNo(B.wires.buzS)]>0:S.toneF>0);humSet(buz,buz?.9:0);
 if(S.ard.err)S.status=S.ard.err;else if(S.io.serial.length)S.status='Serial: '+S.io.serial[S.io.serial.length-1]};
regType(T);
})();
