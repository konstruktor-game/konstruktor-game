/* =====================================================================
   ERKIN KONSTRUKTOR — alohida detallardan istalgan narsani yasash
   Foydalanuvchi detallar kutubxonasidan qo'shadi, o'lcham/joy/burilishini belgilaydi, simlaydi.
   Hisob: og'irlik va og'irlik markazi, kuchlanish, tok, ishlash vaqti,
     parrak tortishi T ≈ 3,1·10⁻⁹ · rpm² · D³ · P (g; D, P — dyuym), quvvat bo'yicha cheklangan;
     g'ildirak tezligi v = rpm / uzatma · π · d / 60.
   ===================================================================== */
(()=>{
const DENS={plastic:1.05,card:.7,wood:.6,alu:2.7,carbon:1.6,steel:7.85};
const MATS={plastic:'Plastik',card:'Karton',wood:"Yog'och / fanera",alu:'Alyuminiy',carbon:'Karbon',steel:"Po'lat"};
const BAT={aa2:{n:'2×AA (3 V)',v:2.8,imax:1.5,w:50},aa4:{n:'4×AA (6 V)',v:5.6,imax:1.5,w:100},li1:{n:'18650 Li-ion 1S (3,7 V)',v:3.6,imax:8,w:48},li2:{n:'18650 Li-ion 2S (7,4 V)',v:7.2,imax:8,w:96},lipo2:{n:'LiPo 2S (7,4 V)',v:7.4,imax:0,w:0},lipo3:{n:'LiPo 3S (11,1 V)',v:11.1,imax:0,w:0},lipo4:{n:'LiPo 4S (14,8 V)',v:14.8,imax:0,w:0}};
const DCM={130:{n:'130 (kichik, 3–6 V)',vr:4.5,kv:4000,irun:.25,pm:2,w:18,d:20,l:25},280:{n:'280 (o\'rta)',vr:6,kv:2400,irun:.5,pm:8,w:40,d:24,l:30},370:{n:'370 (kuchli)',vr:6,kv:2200,irun:.8,pm:15,w:60,d:28,l:38}};
// quyosh paneli: nominal kuchlanish va to'liq quyoshdagi tok (yorug'lik ~1000 W/m²), og'irlik, o'lchami (mm)
const SOL={s1:{n:'Kichik 6 V · 1 W',v:6,i:.17,w:40,a:110,b:70},s2:{n:"O'rta 6 V · 2 W",v:6,i:.33,w:70,a:165,b:110},s5:{n:'Katta 12 V · 5 W',v:12,i:.42,w:180,a:250,b:180}};
const LEDC={red:'#ff2d2d',green:'#2dff6a',blue:'#3d8bff',yellow:'#ffd02d',white:'#f4f7ff'};
const ROT={0:'0°',90:'90°',180:'180°',270:'270°'};
const txt=(k,l,max=24)=>({k,l,type:'text',max}),sel=(k,l,o,g)=>({k,l,type:'sel',o,g}),num=(k,l,min,max,step,u,g)=>({k,l,min,max,step,u,g});
// detallar kutubxonasi: nomi, ikonka, lug'at kaliti, parametrlari, standart qiymatlar
const KIND={
 plate:{n:'Plastina',ic:'layers',g:'fplate',f:[num('w','Eni',10,400,1,'mm'),num('d','Uzunligi',10,400,1,'mm'),num('t','Qalinligi',1,12,.5,'mm'),sel('mat','Material',MATS,'material')],def:{w:120,d:80,t:3,mat:'plastic',col:'#9e9e9e'}},
 beam:{n:'Profil (brus)',ic:'ruler',g:'fbeam',f:[num('len','Uzunligi',10,600,1,'mm'),num('w','Kesimi',4,50,1,'mm'),sel('mat','Material',MATS,'material')],def:{len:150,w:10,mat:'alu',col:'#b0b6bf'}},
 box:{n:'Korpus (quti)',ic:'chassis',g:'fbox',f:[num('w','Eni',10,400,1,'mm'),num('h','Balandligi',10,300,1,'mm'),num('d','Chuqurligi',10,400,1,'mm'),num('wall','Devor qalinligi',1,6,.5,'mm'),sel('mat','Material',MATS,'material')],def:{w:100,h:40,d:80,wall:2,mat:'plastic',col:'#455a64'}},
 tube:{n:'Truba (silindr)',ic:'dot',g:'ftube',f:[num('d','Diametri',4,120,1,'mm'),num('len','Uzunligi',10,500,1,'mm'),num('wall','Devor qalinligi',.5,5,.5,'mm'),sel('mat','Material',MATS,'material')],def:{d:30,len:120,wall:1.5,mat:'plastic',col:'#eceff1'}},
 dcmotor:{n:"Cho'tkali motor",ic:'motor',g:'brushed',el:1,f:[sel('size','O\'lchami',Object.fromEntries(Object.entries(DCM).map(([k,v])=>[k,v.n]))),num('gear','Reduktor (uzatma)',1,120,1,':1','gear')],def:{size:'130',gear:1,col:'#c9ced4'}},
 bldc:{n:"Cho'tkasiz motor",ic:'motor',g:'motor',el:1,f:[num('d','Stator diametri',10,40,1,'mm'),num('h','Stator balandligi',3,20,1,'mm'),num('kv','KV',300,6000,50,'KV','kv')],def:{d:14,h:4,kv:3800,col:'#30343a'}},
 prop:{n:'Parrak',ic:'prop',g:'prop',f:[num('d','Diametri',2,14,.5,'"'),num('p','Qadami',1,8,.1,'"','pitch'),sel('b','Qanotlar',{2:'2 ta',3:'3 ta'},'blades')],def:{d:5,p:3,b:2,col:'#ff6d00'}},
 wheel:{n:"G'ildirak",ic:'wheel',g:'wheel',f:[num('d','Diametri',15,200,1,'mm'),num('w','Eni',5,80,1,'mm')],def:{d:65,w:26,col:'#f2c200'}},
 battery:{n:'Batareya',ic:'battery',g:'battery',el:2,f:[sel('bt','Turi',Object.fromEntries(Object.entries(BAT).map(([k,v])=>[k,v.n])),'chem'),num('mah',"Sig'im",200,8000,50,'mAh','mah')],def:{bt:'aa4',mah:2000,col:'#1b5e20'}},
 sw:{n:"O'chirgich",ic:'pointer',g:'switch',f:[],def:{col:'#d32f2f'}},
 led:{n:'LED chiroq',ic:'bulb',g:'fled',el:1,f:[sel('c','Rangi',{red:'Qizil',green:'Yashil',blue:"Ko'k",yellow:'Sariq',white:'Oq'}),sel('pw','Quvvati',{ind:'Indikator (20 mA)',w1:'Kuchli 1 W (300 mA)'}),sel('ls','Linza',{5:'5 mm',10:'10 mm',20:'20 mm (svetofor, soyabonli)'})],def:{c:'white',pw:'ind',ls:'5',col:'#ffffff'}},
 servo:{n:'Servo',ic:'servo',g:'servo',el:1,f:[sel('sk','Turi',{micro:'Mikro (9 g)',std:'Standart (40 g)'})],def:{sk:'micro',col:'#1565c0'}},
 camera:{n:'Kamera',ic:'camera',g:'cam',el:1,f:[],def:{col:'#222222'}},
 sensor:{n:'Masofa sensori',ic:'target',g:'ultrasonic',el:1,f:[],def:{col:'#1565c0'}},
 mcu:{n:'Arduino plata',ic:'chip',g:'mcu',el:1,f:[],def:{col:'#00798c'}},
 gear:{n:'Shesterna',ic:'gear',g:'fgear',f:[num('zt','Tishlar soni',8,80,1,'ta'),num('m','Modul',.3,2,.1,'mm'),num('t','Qalinligi',2,15,1,'mm'),sel('mat','Material',MATS,'material')],def:{zt:30,m:1,t:5,mat:'plastic',col:'#eceff1'}},
 axle:{n:"Val (o'q)",ic:'ruler',g:'faxle',f:[num('d','Diametri',2,12,1,'mm'),num('len','Uzunligi',10,300,1,'mm'),sel('mat','Material',MATS,'material')],def:{d:4,len:80,mat:'steel',col:'#cfd8dc'}},
 bracket:{n:'Burchak (L-kronshteyn)',ic:'layers',g:'fbracket',f:[num('a','Tomoni',10,100,1,'mm'),num('w','Eni',8,60,1,'mm'),num('t','Qalinligi',1,5,.5,'mm'),sel('mat','Material',MATS,'material')],def:{a:30,w:20,t:2,mat:'alu',col:'#b0b6bf'}},
 sphere:{n:'Shar / gumbaz',ic:'dot',g:'fsphere',f:[num('d','Diametri',10,300,1,'mm'),sel('half','Shakli',{0:"To'liq shar",1:'Yarim shar (gumbaz)'}),sel('mat','Material',MATS,'material')],def:{d:60,half:'0',mat:'plastic',col:'#ffb300'}},
 solar:{n:'Quyosh paneli',ic:'sun',g:'fsolar',el:2,f:[sel('sp','Turi',Object.fromEntries(Object.entries(SOL).map(([k,v])=>[k,v.n])))],def:{sp:'s1',col:'#0d47a1'}},
 esc:{n:'ESC (tezlik regulyatori)',ic:'chip',g:'esc',el:1,f:[num('a','Maksimal tok',6,80,1,'A')],def:{a:20,col:'#263238'}},
 buzzer:{n:'Buzzer (ovoz)',ic:'volume',g:'fbuzzer',el:1,f:[],def:{col:'#111111'}},
 btn:{n:'Tugma (knopka)',ic:'pointer',g:'fbtn',f:[sel('bk','Turi',{tact:'Taktil 12 mm',big:'Katta 16 mm (qopqoqli)'})],def:{bk:'tact',col:'#e53935'}},
 pot:{n:'Potensiometr (rostlagich)',ic:'gauge',g:'fpot',f:[sel('ohm','Qarshiligi',{'1k':'1 kΩ','10k':'10 kΩ','100k':'100 kΩ'})],def:{ohm:'10k',col:'#263238'}},
 ldr:{n:"Yorug'lik datchigi (LDR)",ic:'sun',g:'fldr',el:1,f:[],def:{col:'#c62828'}},
 sticker:{n:'Stiker (yorliq)',ic:'tag',g:'fsticker',f:[sel('st','Dizayn',{text:"O'z yozuvim",warn:'Ehtiyot: tok!',pol:'Qutblar + / −',logo:'Konstruktor belgisi',arrow:"Yo'nalish strelkasi",num:'Raqam / harf',stripe:'Poyga chiziqlari',qr:'Shtrix-kod (seriya raqami)'}),txt('tx','Yozuv'),
   num('w','Eni',10,250,1,'mm'),sel('shape','Shakli',{rect:"To'rtburchak",round:'Yumaloq burchakli',circle:'Doira'}),sel('fin','Sirti',{gloss:'Yaltiroq vinil',matte:'Mat',metal:'Metallik (folga)'})],def:{st:'text',tx:'MENING ROBOTIM',w:60,shape:'round',fin:'gloss',col:'#ffb020',tc:'#111111'}}};
// kutubxona bo'limlari (Tinkercad va robot to'plamlaridagi kabi guruhlash)
const CATS=[['build','Konstruksiya',['plate','beam','box','tube','bracket','sphere','sticker']],['move',"Harakat",['dcmotor','bldc','prop','wheel','gear','axle','servo']],['el','Elektr',['battery','solar','sw','btn','pot','esc','led','buzzer','ldr','mcu','sensor','camera']]];
const EL_I={led:.02,servo:.15,camera:.15,sensor:.015,mcu:.05,esc:.05,buzzer:.03,ldr:.005};
Object.assign(GLOSS,{
 fgear:{n:'Shesterna',en:'Gear',w:"Tishli g'ildirak: aylanishni bir valdan boshqasiga uzatadi. Modul — tish o'lchami, diametri = modul × tishlar soni.",y:"Katta va kichik shesterna juftligi tezlikni pasaytirib, kuchni (momentni) oshiradi.",h:"Juftlikdagi ikkala shesterna moduli bir xil bo'lishi shart, aks holda tishlar ilashmaydi."},
 faxle:{n:"Val (o'q)",en:'Axle',w:"Po'lat yoki alyuminiy tayoqcha: g'ildirak, shesterna yoki parrak unga o'rnatiladi.",y:"Aylanuvchi detallarni bir o'qda ushlab turadi.",h:"Yuk ko'p bo'lsa yo'g'onroq val oling; podshipnik yoki vtulka ishqalanishni kamaytiradi."},
 fbracket:{n:'Burchak (L-kronshteyn)',en:'L-bracket',w:"90° egilgan metall yoki plastik plastinka, teshiklari bilan.",y:"Ikki detalni to'g'ri burchak ostida vint bilan mahkamlaydi: masalan, motorni plastinaga.",h:"Qalinroq burchak — qattiqroq birikma."},
 fsphere:{n:'Shar / gumbaz',en:'Sphere / dome',w:"Shar yoki yarim shar shaklidagi qobiq.",y:"Kuzov, burun qismi, robot boshi yoki dekor uchun.",h:"Yarim shar — qopqoq va gumbaz uchun qulay."},
 fsolar:{n:'Quyosh paneli',en:'Solar panel',w:"Yorug'likni elektr tokiga aylantiradi (kremniy elementlar).",y:"Batareyasiz ishlaydigan o'yinchoq va stansiyalar uchun manba.",h:"Tok yorug'likka bog'liq: soyada 5–10 baravar kamayadi. Motor ko'p tok olsa — panel kuchlanishi tushib ketadi."},
 fbtn:{n:'Tugma (knopka)',en:'Push button',w:"Bosib turilganda zanjirni ulaydigan kalit; qo'yib yuborilsa — uziladi.",y:"Qo'ng'iroq, o'yin boshqaruvi, Arduino ga buyruq berish.",h:"O'chirgichdan farqi: holatini eslab qolmaydi (faqat bosilganda ishlaydi)."},
 fpot:{n:'Potensiometr',en:'Potentiometer',w:"Burab o'zgartiriladigan qarshilik (rostlagich).",y:"LED yorqinligi, motor tezligi yoki ovoz balandligini qo'lda sozlash.",h:"Arduino da o'rta oyog'i analog kirishga (A0) ulanadi — 0…1023 qiymat beradi."},
 fldr:{n:"Yorug'lik datchigi (LDR)",en:'Photoresistor',w:"Yorug'lik tushsa qarshiligi kamayadigan element.",y:"Qorong'ida avtomatik yonadigan chiroq, quyoshni kuzatish.",h:"10 kΩ rezistor bilan kuchlanish bo'luvchi qilib, Arduino analog kirishiga ulanadi."},
 fled:{n:'LED chiroq',en:'LED',w:"Yorug'lik diodi: tok o'tganda yonadi. Uzun oyog'i — plus (anod).",y:"Indikator, chiroq, svetofor, bezak.",h:"LED ga doim cheklovchi rezistor kerak (5 V da ~220 Ω); 1 W LED uchun drayver."},
 fsticker:{n:'Stiker (yorliq)',en:'Sticker / decal',w:"Yopishqoq vinil yorliq: yozuv, belgi yoki bezak. Istalgan sirtga yopishtiriladi.",y:"Loyihani chiroyli va tushunarli qiladi: qutblar, ogohlantirish, nom, seriya raqami.",h:"Yon devorga yopishtirish uchun «Burilish» dan X o'qini 90° qiling va «Ustiga qo'yish» bilan joylang."},
 fbuzzer:{n:'Buzzer',en:'Buzzer',w:"Kichik ovoz chiqargich (pyezo yoki elektromagnit).",y:"Signal, ogohlantirish yoki ovozli indikator.",h:"Faol (active) buzzer o'zi ovoz chiqaradi; passiv buzzerga Arduino chastota beradi."}});
const items=B=>(B.p.free&&B.p.free.items)||[];
const it=(kind,x,y,z,o={})=>Object.assign({kind,x,y,z,rx:0,ry:0,rz:0},KIND[kind].def,o);
const r360=v=>((+v||0)%360+360)%360,tpl=L=>{let n=0;return{items:L.map(o=>{o.rx=r360(o.rx);o.ry=r360(o.ry);o.rz=r360(o.rz);return Object.assign({id:'i'+(++n)},o,{goal:{x:o.x,y:o.y,z:o.z,rx:o.rx,ry:o.ry,rz:o.rz},placed:false})})}};
const T={id:'free',name:'Erkin konstruktor',ic:'tools',desc:"Alohida detallardan istalgan narsa: ventilyator, fonar, mashina, tegirmon yoki o'z g'oyangiz.",defPreset:'fan',defPurpose:'free',
 purposes:{free:{t:'Erkin',note:"O'z g'oyangiz"}},colors:{},paint:[],
 spec:{free:{t:'Loyiha',ic:'tools',f:[]}},
 presets:{
  fan:{name:'Stol ventilyatori',desc:'Korpus, tirgak, motor, parrak, 4×AA',purpose:'free',p:{free:tpl([it('box',0,20,0,{w:120,h:40,d:90}),it('beam',0,110,0,{len:140,w:12,rz:90}),it('dcmotor',0,190,0,{size:'280',rx:90}),it('prop',0,190,27,{d:6,p:3,b:3,rx:90,col:'#90caf9'}),it('battery',0,20,10,{bt:'li2',mah:2600}),it('sw',40,42,30)])}},
  flash:{name:'Fonar',desc:'Truba, LED, 2×AA, o\'chirgich',purpose:'free',p:{free:tpl([it('tube',0,16,0,{d:32,len:150,rz:90}),it('led',80,16,0,{rz:-90,pw:'w1'}),it('battery',-10,16,0,{bt:'aa2'}),it('sw',20,34,0)])}},
  car:{name:"O'yinchoq mashina",desc:"Plastina, 2 reduktorli motor, 4 g'ildirak",purpose:'free',p:{free:tpl([it('plate',0,40,0,{w:110,d:170,t:4,col:'#1e88e5'}),it('dcmotor',-35,25,45,{size:'280',gear:48,rz:90}),it('sticker',0,40,-30,{st:'num',tx:'7',w:40,shape:'circle',col:'#ffffff',tc:'#d32f2f'}),it('dcmotor',35,25,45,{size:'280',gear:48,rz:-90}),it('wheel',-68,33,45),it('wheel',68,33,45),it('wheel',-68,33,-45),it('wheel',68,33,-45),it('battery',0,48.2,0,{bt:'li2',mah:2600}),it('sw',40,46,-60)])}},
  mill:{name:'Shamol tegirmoni modeli',desc:'Minora, generator motor, katta parrak, LED',purpose:'free',p:{free:tpl([it('box',0,10,0,{w:90,h:20,d:90,mat:'wood',col:'#8d6e63'}),it('tube',0,140,0,{d:22,len:240,mat:'wood',col:'#d7ccc8'}),it('dcmotor',0,268,0,{size:'130',rx:90}),it('prop',0,268,24.5,{d:12,p:6,b:3,rx:90,col:'#fafafa'}),it('led',30,25,30,{c:'yellow'}),it('battery',-25,25,-25,{bt:'aa2'})])}},
  quad:{name:'Oddiy kvadrokopter',desc:"Detallardan o'zingiz yig'gan kichik dron",purpose:'free',p:{free:tpl([it('plate',0,3,0,{w:110,d:110,t:3,mat:'carbon',col:'#212121'}),it('bldc',-45,5,-45,{d:14,h:4,kv:4000}),it('bldc',45,5,-45,{d:14,h:4,kv:4000}),it('bldc',-45,5,45,{d:14,h:4,kv:4000}),it('bldc',45,5,45,{d:14,h:4,kv:4000}),
   it('prop',-45,17,-45,{d:3,p:3,b:3}),it('prop',45,17,-45,{d:3,p:3,b:3}),it('prop',-45,17,45,{d:3,p:3,b:3}),it('prop',45,17,45,{d:3,p:3,b:3}),it('battery',0,14.4,0,{bt:'lipo3',mah:1300}),it('camera',0,13,-50),it('esc',-25,7,-25,{a:12}),it('esc',25,7,-25,{a:12}),it('esc',-25,7,25,{a:12}),it('esc',25,7,25,{a:12})])}},
  scar:{name:'Quyosh mashinasi',desc:"Batareyasiz: quyosh paneli, reduktorli motor, 2 val, 4 g'ildirak",purpose:'free',p:{free:tpl([
   it('wheel',-48,20,-50,{d:40,w:14,col:'#212121'}),it('wheel',48,20,-50,{d:40,w:14,col:'#212121'}),it('wheel',-48,20,50,{d:40,w:14,col:'#212121'}),it('wheel',48,20,50,{d:40,w:14,col:'#212121'}),
   it('axle',0,20,-50,{len:110}),it('axle',0,20,50,{len:110}),it('plate',0,26,0,{w:80,d:140,t:3,mat:'wood',col:'#c8a165'}),
   it('dcmotor',20,34,40,{size:'130',gear:48,rz:90}),it('solar',0,43.5,0,{sp:'s2'}),it('sw',-25,34,-40,{})])}},
  alarm:{name:'Signalizatsiya',desc:"Arduino, masofa sensori, buzzer, LED, 4×AA korpusda",purpose:'free',p:{free:tpl([
   it('box',0,15,0,{w:120,h:30,d:80,col:'#37474f'}),it('battery',0,15,0,{bt:'aa4'}),it('mcu',0,31,0),it('sensor',0,52,-28),
   it('buzzer',40,35,20),it('led',-40,37,20,{c:'red'}),it('sw',50,34,-30)])}},
  lamp:{name:'Stol lampasi',desc:"Asos, tirgak, abajur, kuchli LED, 4×AA, o'chirgich",purpose:'free',p:{free:tpl([
   it('box',0,10,0,{w:80,h:20,d:80,col:'#37474f'}),it('battery',0,10,0,{bt:'aa4'}),it('tube',0,110,0,{d:12,len:180,mat:'alu',col:'#b0b6bf'}),
   it('sphere',0,180,0,{d:70,half:'1',col:'#f5f5f5'}),it('led',0,180,0,{pw:'w1',c:'white',rx:180}),it('sw',28,24,25,{})])}},
  bell:{name:"Eshik qo'ng'irog'i",desc:"Tugma bosilganda buzzer chalinadi, 2×AA",purpose:'free',p:{free:tpl([
   it('box',0,12.5,0,{w:70,h:25,d:50,mat:'wood',col:'#a1887f'}),it('battery',0,12.5,0,{bt:'aa2'}),it('btn',-15,29,0,{bk:'big'}),it('buzzer',15,30,0),it('sticker',0,12.5,-25.1,{st:'text',tx:'QO\'NG\'IROQ',w:44,rx:-90,col:'#fff3e0',tc:'#4e342e'})])}},
  traffic:{name:'Svetofor',desc:"Arduino, 3 ta LED (qizil, sariq, yashil), tirgak",purpose:'free',p:{free:tpl([
   it('box',0,12.5,0,{w:90,h:25,d:80,col:'#455a64'}),it('battery',0,12.5,0,{bt:'aa4'}),it('mcu',0,26,0),it('beam',0,97,25,{len:150,w:12,rz:90,col:'#263238'}),
   it('box',0,207,25,{w:40,h:110,d:30,col:'#212121'}),it('led',0,240,8,{c:'red',rx:-90,ls:'20'}),it('led',0,207,8,{c:'yellow',rx:-90,ls:'20'}),it('led',0,174,8,{c:'green',rx:-90,ls:'20'}),it('sticker',0,13,-40.5,{st:'logo',w:44,rx:-90,col:'#111418',tc:'#ffb020'}),it('sw',35,29,-30,{})])}},
  night:{name:'Tungi chiroq',desc:"Qorong'ida yonadi: LDR datchigi, Arduino, LED, gumbaz",purpose:'free',p:{free:tpl([
   it('box',0,12.5,0,{w:80,h:25,d:80,mat:'card',col:'#eceff1'}),it('battery',0,12.5,0,{bt:'aa4'}),it('mcu',0,26,0),it('ldr',32,26,-32),it('led',0,43,0,{c:'yellow'}),
   it('sphere',0,36,0,{d:80,half:'1',col:'#fff8e1'}),it('sw',-35,29,-30,{})])}},
  carousel:{name:'Karusel',desc:"Reduktorli motor platformani sekin aylantiradi, potensiometr bilan",purpose:'free',p:{free:tpl([
   it('box',0,20,0,{w:80,h:40,d:80,mat:'wood',col:'#8d6e63'}),it('battery',0,20,0,{bt:'aa4'}),it('dcmotor',0,50,0,{size:'130',gear:120}),it('plate',0,74,0,{w:120,d:120,t:3,col:'#e53935'}),
   it('sphere',0,74,0,{d:30,half:'1',col:'#ffd54f'}),it('sw',-30,44,-38,{}),it('pot',30,46,-30,{})])}},
  arm:{name:"Robot qo'l",desc:"2 ta servo, profillar, Arduino — qo'lni burish va ko'tarish",purpose:'free',p:{free:tpl([
   it('box',0,10,0,{w:80,h:20,d:80,mat:'alu',col:'#607d8b'}),it('servo',0,39,0,{sk:'std'}),it('beam',50,66,0,{len:120,w:10}),it('servo',100,83,0,{sk:'micro'}),
   it('beam',130,102,0,{len:80,w:10,col:'#ff7043',mat:'plastic'}),it('mcu',-90,1,0),it('battery',-90,9.2,65,{bt:'aa4'}),it('sw',-40,24,30,{})])}},
  empty:{name:"Bo'sh loyiha",desc:"Noldan o'zingiz yasang",purpose:'free',p:{free:{items:[]}}}},
 steps:[
  {id:'design',kind:'custom',t:'Detallar va loyiha',ic:'tools',slots:B=>items(B).map(o=>o.id),intro:"Kutubxonadan detal qo'shing, o'lchami va joyini belgilang. Yangi detal avval yasash stolida qismlardan yig'iladi. Modeldagi detalni bosing — uni tanlab tahrirlaysiz."},
  {id:'wiring',kind:'wiring',t:'Simlar',ic:'plug',intro:"Har bir elektr detalning + simi quvvat shinasining + kontaktiga, − simi esa − kontaktiga ulanadi. Teskari ulash — qisqa tutashuv."},
  {id:'check',kind:'check',t:'Hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Sinov',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{},chart:{title:"Detallar og'irligi",cols:['#','Og\'irlik, g','Tok, A','—','—'],l1:"■ Og'irlik (g)",l2:'■ Tok (A)',xf:r=>'#'+r.t/10}};
// slot → lug'at kaliti (detal turi bo'yicha)
T.labels=new Proxy({},{get:(_,slot)=>{const o=items(B).find(x=>x.id===slot);return o?KIND[o.kind].g:undefined}});

// ---------- hisob-kitob ----------
function weight(o){const m=o.mat&&DENS[o.mat]||1;switch(o.kind){
 case'plate':return o.w*o.d*o.t/1000*m;case'beam':return o.len*o.w*o.w/1000*m*(o.mat==='alu'||o.mat==='steel'?.35:1);
 case'box':return 2*(o.w*o.h+o.w*o.d+o.h*o.d)*o.wall/1000*m;case'tube':return Math.PI*o.d*o.len*o.wall/1000*m;
 case'dcmotor':return DCM[o.size].w+(o.gear>1?15:0);case'bldc':return .0029*o.d*o.d*o.h+3;case'prop':return o.d*o.d*.12*(o.b==3?1.3:1);
 case'wheel':return o.d*o.w*.012+3;case'battery':{const b=BAT[o.bt];return b.w?b.w*(o.bt.startsWith('li')?o.mah/2600*.7+.3:1):(+o.bt.slice(-1))*o.mah*.026+10}
 case'sw':return 4;case'led':return (+o.ls/5||1)**2;case'servo':return o.sk==='std'?40:9;case'camera':return 12;case'sensor':return 9;case'mcu':return 25;
 case'gear':{const r=o.m*o.zt/2;return Math.PI*r*r*o.t*.75/1000*m}case'axle':return Math.PI*(o.d/2)**2*o.len/1000*m;case'bracket':return 2*o.a*o.w*o.t/1000*m;
 case'sphere':{const r=o.d/2,sh=Math.min(3,Math.max(1,o.d*.02));return 4*Math.PI*r*r*sh/1000*m*(+o.half?.5:1)}case'solar':return SOL[o.sp].w;case'esc':return 8+o.a*.6;case'buzzer':return 3;
 case'btn':return o.bk==='big'?5:1.5;case'pot':return 6;case'ldr':return .5;case'sticker':return o.w*stH(o)*.00035}return 0}
function axisUp(o){const e=new THREE.Euler(o.rx*DEG,o.ry*DEG,o.rz*DEG);return new V3(0,1,0).applyEuler(e)}
const runTxt=D=>D.solar?'quyosh bor ekan':D.tRun?fmt(D.tRun)+' daq':'—';
// ---------- geometriya: har detalning mahalliy chegaralari (mm) va dunyodagi qutisi (AABB) ----------
// 3D model qanday chizilsa, shunday: o'qlar, markaz va o'lchamlar build() bilan bir xil.
// ---------- bosma yorliqlar (canvas teksturalar) ----------
const stH=o=>o.shape==='circle'?o.w:o.st==='stripe'?o.w*.35:o.w*.5;
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function fitText(g,t,maxW,maxH,weight='800'){let f=maxH;g.font=`${weight} ${f}px Inter,Segoe UI,Arial,sans-serif`;while(f>8&&g.measureText(t).width>maxW){f-=2;g.font=`${weight} ${f}px Inter,Segoe UI,Arial,sans-serif`}return f}
function stickerTex(o){const W=512,H=Math.round(512*stH(o)/o.w),key=['stk',o.st,o.tx,o.shape,o.col,o.tc,W,H].join('|');
 return ctex(key,W,H,(g,w,h)=>{g.clearRect(0,0,w,h);g.save();
  if(o.shape==='circle'){g.beginPath();g.arc(w/2,h/2,Math.min(w,h)/2-4,0,Math.PI*2)}else rr(g,4,4,w-8,h-8,o.shape==='round'?Math.min(w,h)*.18:6);g.clip();
  const bg=o.col||'#ffb020',fg=o.tc||'#111',gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,bg);gr.addColorStop(1,bg);g.fillStyle=gr;g.fillRect(0,0,w,h);
  // nozik yaltiroq va chekka (real vinil kabi)
  const sh=g.createLinearGradient(0,0,w,h);sh.addColorStop(0,'rgba(255,255,255,.22)');sh.addColorStop(.45,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.12)');g.fillStyle=sh;g.fillRect(0,0,w,h);
  g.fillStyle=fg;g.strokeStyle=fg;g.textAlign='center';g.textBaseline='middle';const cx=w/2,cy=h/2;
  switch(o.st){
   case'warn':{const s2=Math.min(h*.8,w*.3),x0=h*.12+s2/2;g.beginPath();g.moveTo(x0,cy-s2*.48);g.lineTo(x0+s2*.55,cy+s2*.42);g.lineTo(x0-s2*.55,cy+s2*.42);g.closePath();g.lineWidth=s2*.09;g.lineJoin='round';g.stroke();
    g.beginPath();g.moveTo(x0+s2*.08,cy-s2*.25);g.lineTo(x0-s2*.12,cy+s2*.06);g.lineTo(x0+s2*.02,cy+s2*.06);g.lineTo(x0-s2*.08,cy+s2*.32);g.lineTo(x0+s2*.14,cy-s2*.02);g.lineTo(x0,cy-s2*.02);g.closePath();g.fill();
    const tx0=x0+s2*.7,tw=w-tx0-h*.12;g.textAlign='left';fitText(g,'EHTIYOT!',tw,h*.34);g.fillText('EHTIYOT!',tx0,cy-h*.16);fitText(g,'YUQORI TOK',tw,h*.2,'700');g.fillText('YUQORI TOK',tx0,cy+h*.2);break}
   case'pol':{const r=Math.min(h*.36,w*.2);for(const[dx,c2,t]of[[-1,'#e53935','+'],[1,'#212121','−']]){g.fillStyle=c2;g.beginPath();g.arc(cx+dx*w*.22,cy,r,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font=`900 ${r*1.5}px Arial`;g.fillText(t,cx+dx*w*.22,cy+r*.06)}break}
   case'logo':{const r=Math.min(h*.36,w*.16),x0=h*.14+r;g.lineWidth=r*.16;g.beginPath();g.arc(x0,cy,r,0,Math.PI*2);g.stroke();g.font=`900 ${r*1.15}px Arial`;g.fillText('K',x0,cy+r*.05);
    g.textAlign='left';const tw=w-x0-r-h*.2;fitText(g,'KONSTRUKTOR',tw,h*.3);g.fillText('KONSTRUKTOR',x0+r+h*.12,cy-h*.07);g.globalAlpha=.75;fitText(g,'ENGINEERING LAB',tw,h*.14,'600');g.fillText('ENGINEERING LAB',x0+r+h*.12,cy+h*.2);g.globalAlpha=1;break}
   case'arrow':{const L=w*.78,T=h*.3;g.beginPath();g.moveTo(cx-L/2,cy-T/2);g.lineTo(cx+L/2-h*.35,cy-T/2);g.lineTo(cx+L/2-h*.35,cy-h*.36);g.lineTo(cx+L/2,cy);g.lineTo(cx+L/2-h*.35,cy+h*.36);g.lineTo(cx+L/2-h*.35,cy+T/2);g.lineTo(cx-L/2,cy+T/2);g.closePath();g.fill();break}
   case'num':{const t=(o.tx||'7').slice(0,4);fitText(g,t,w*.8,h*.82,'900');g.fillText(t,cx,cy+h*.04);break}
   case'stripe':{for(const k of[-1,0,1]){g.fillStyle=k?fg:bg;}g.fillStyle=fg;g.fillRect(0,h*.18,w,h*.2);g.fillRect(0,h*.62,w,h*.2);break}
   case'qr':{g.fillStyle='#fff';g.fillRect(w*.06,h*.12,w*.88,h*.76);g.fillStyle='#111';let x=w*.1,seed=[...(o.tx||'KN-001')].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);while(x<w*.9){seed=seed*1103515245+12345>>>0;const bw=(seed%4+1)*w*.006;g.fillRect(x,h*.18,bw,h*.46);x+=bw+((seed>>3)%3+1)*w*.005}
    g.font=`600 ${h*.13}px Consolas,monospace`;g.fillText((o.tx||'KN-001').toUpperCase(),cx,h*.76);break}
   default:{const t=(o.tx||'').toUpperCase()||'YOZUV';fitText(g,t,w*.86,h*.46);g.fillText(t,cx,cy+h*.03)}}
  g.restore();
  // ingichka oq chekka (kesilgan vinil)
  g.lineWidth=5;g.strokeStyle='rgba(255,255,255,.55)';if(o.shape==='circle'){g.beginPath();g.arc(w/2,h/2,Math.min(w,h)/2-5,0,Math.PI*2);g.stroke()}else{rr(g,5,5,w-10,h-10,o.shape==='round'?Math.min(w,h)*.18:6);g.stroke()}})}
// AA va 18650 element yorlig'i: rangli plyonka, kuchlanish, qutb belgisi
function cellTex(big,alt){return ctex('cell'+big+alt,256,128,(g,w,h)=>{const base=big?'#1565c0':alt?'#b71c1c':'#212121',acc=big?'#90caf9':alt?'#ffcdd2':'#ffb300';g.fillStyle=base;g.fillRect(0,0,w,h);
 g.fillStyle=acc;g.fillRect(0,h*.62,w,h*.12);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.25)');gr.addColorStop(.4,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle='#fff';g.font='900 34px Arial';g.textBaseline='middle';g.fillText(big?'18650':'AA',16,h*.32);g.font='700 22px Arial';g.fillText(big?'3.7 V  Li-ion':'1.5 V  ALKALINE',big?120:72,h*.32);g.font='900 26px Arial';g.fillText('+',w-34,h*.32)})}
function motorTex(size,vr){return ctex('mot'+size,256,128,(g,w,h)=>{const big=size!=='130';g.fillStyle=big?'#1e3a8a':'#eceff1';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.25)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle=big?'#fff':'#1b1b1b';g.font='900 30px Arial';g.textBaseline='middle';g.fillText(`DC ${size}`,14,h*.33);g.font='700 19px Arial';g.fillText(`${vr<4.6?'3-6':'6-12'} V  ·  BRUSHED`,14,h*.66);g.fillStyle='#d32f2f';g.fillRect(w-40,h*.25,22,22)})}
function chipTex(){return ctex('atm328',512,128,(g,w,h)=>{g.fillStyle='#1b1b1b';g.fillRect(0,0,w,h);g.fillStyle='rgba(235,235,235,.9)';g.font='700 34px Arial';g.textBaseline='middle';g.fillText('ATMEGA328P',70,h*.38);g.font='500 22px Arial';g.fillText('-PU  2026',70,h*.72);
 g.fillStyle='#0d0d0d';g.beginPath();g.arc(26,h/2,14,-Math.PI/2,Math.PI/2);g.fill();g.beginPath();g.arc(w-30,h*.75,7,0,Math.PI*2);g.fill()})}
function meshTex(){return ctex('srmesh',128,128,(g,w,h)=>{g.fillStyle='#2b2f35';g.fillRect(0,0,w,h);g.fillStyle='#111317';for(let y=0;y<h;y+=6)for(let x=(y/6)%2?3:0;x<w;x+=6){g.beginPath();g.arc(x,y,2,0,Math.PI*2);g.fill()}})}
function buzTex(){return ctex('buzlab',256,256,(g,w,h)=>{g.fillStyle='#f2f2f2';g.fillRect(0,0,w,h);g.fillStyle='#111';g.textAlign='center';g.font='700 22px Arial';g.fillText('REMOVE SEAL',w/2,h*.36);g.fillText('AFTER',w/2,h*.47);g.fillText('WASHING',w/2,h*.58);
 g.font='900 40px Arial';g.fillText('+',w*.3,h*.82);g.beginPath();g.arc(w/2,h/2,18,0,Math.PI*2);g.fill()})}
function ext(o){const h=(x,y,z)=>[-x,-y,-z,x,y,z];switch(o.kind){
 case'plate':return[-o.w/2,-o.t,-o.d/2,o.w/2,0,o.d/2];case'beam':return h(o.len/2,o.w/2,o.w/2);case'box':return h(o.w/2,o.h/2,o.d/2);case'tube':return h(o.d/2,o.len/2,o.d/2);
 case'dcmotor':{const d=DCM[o.size],r=d.d/2;return[-r*.8,-d.l/2-(o.gear>1?r*1.7:4),-r,r*.8,d.l/2+8,r]}case'bldc':return[-(o.d/2+3),-3,-(o.d/2+3),o.d/2+3,o.h+7,o.d/2+3];
 case'prop':{const r=o.d*25.4/2;return[-r,-4,-r,r,4,r]}case'wheel':return h(o.w/2,o.d/2,o.d/2);
 case'battery':{if(o.bt.startsWith('lipo')){const c=+o.bt.slice(-1);return h(16,c*3.8,Math.min(70,25+o.mah/40))}const n=o.bt==='aa2'?2:o.bt==='aa4'?4:o.bt==='li1'?1:2,big=o.bt.startsWith('li'),r=big?9.2:7.2,l=big?65:50;return h(n*r+1.5,r+1,l/2+3)}
 case'sw':return[-8.5,-8,-6,8.5,4,6];case'led':{const k=+o.ls/5||1;return[-3*k,-7,-3*k,3*k,3.5+4.25*k,3*k]}case'servo':return o.sk==='std'?[-21,-19,-10,21,22,10]:[-12,-12,-6,12,14,6];case'camera':return h(10,10,10);
 case'sensor':return[-22.5,-16,-19,22.5,10,2];case'mcu':return[-40.3,-1,-26.7,34.3,10,26.7];case'gear':{const r=o.m*(o.zt+2)/2;return h(r,o.t/2,r)}case'axle':return h(o.len/2,o.d/2,o.d/2);
 case'bracket':return[-o.w/2,0,0,o.w/2,o.a,o.a];case'sphere':return[-o.d/2,+o.half?0:-o.d/2,-o.d/2,o.d/2,o.d/2,o.d/2];case'solar':{const p=SOL[o.sp];return h(p.a/2,1.5,p.b/2)}
 case'esc':return h(12,4,20);case'buzzer':return h(6,5,6);case'btn':return o.bk==='big'?[-9,-4,-9,9,9,9]:[-6,-4,-6,6,5,6];case'pot':return[-8,-6,-8,8,16,8];case'ldr':return[-3,-1,-3,3,12,3];case'sticker':return[-o.w/2,0,-stH(o)/2,o.w/2,.4,stH(o)/2]}return h(5,5,5)}
function aabb(o){const e=ext(o),E=new THREE.Euler(o.rx*DEG,o.ry*DEG,o.rz*DEG),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9],v=new V3();
 for(let i=0;i<8;i++){v.set(i&1?e[3]:e[0],i&2?e[4]:e[1],i&4?e[5]:e[2]).applyEuler(E);const p=[v.x+o.x,v.y+o.y,v.z+o.z];for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[k]);mx[k]=Math.max(mx[k],p[k])}}return{mn,mx}}
const touch=(a,b,g=1.5)=>[0,1,2].every(k=>a.mn[k]-g<=b.mx[k]&&b.mn[k]-g<=a.mx[k]);
// yerga (y = 0) tayangan detallardan boshlab tutashganlarini yig'amiz — qolganlari havoda osilib turibdi
function floating(L){if(!L.length)return[];const A=L.map(aabb),on=L.map((o,i)=>A[i].mn[1]<=1.5),q=on.map((v,i)=>v?i:-1).filter(i=>i>=0);
 if(!q.length)return L.slice();while(q.length){const i=q.pop();for(let j=0;j<L.length;j++)if(!on[j]&&touch(A[i],A[j])){on[j]=true;q.push(j)}}return L.filter((o,i)=>!on[i])}
// shesternalar juftligi: o'qlari parallel, markazlar orasi a = m·(z₁+z₂)/2 bo'lsa — ilashgan
function gearPairs(L){const G=L.filter(o=>o.kind==='gear'),out=[];for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++){const a=G[i],b=G[j],ua=axisUp(a),ub=axisUp(b);if(Math.abs(ua.dot(ub))<.97)continue;
  const d=new V3(b.x-a.x,b.y-a.y,b.z-a.z),ax=d.dot(ua),rad=Math.sqrt(Math.max(0,d.lengthSq()-ax*ax));if(Math.abs(ax)>Math.max(a.t,b.t))continue;
  const need=(a.m*a.zt+b.m*b.zt)/2,tip=a.m*(a.zt+2)/2+b.m*(b.zt+2)/2;if(rad>tip+1)continue;out.push({a,b,rad,need,same:Math.abs(a.m-b.m)<.05,ok:Math.abs(a.m-b.m)<.05&&Math.abs(rad-need)<=Math.max(.3,a.m*.25),ratio:b.zt/a.zt})}return out}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
T.derive=B=>{const L=items(B),W=L.map(weight),AUW=W.reduce((s,x)=>s+x,0)||0,m=AUW/1000,g=9.81;
 // manba: batareya, u bo'lmasa — quyosh paneli (yuk ostida kuchlanish ~85 %, tok panel imkoniyati bilan cheklangan)
 const bat=L.find(o=>o.kind==='battery'),sol=!bat&&L.find(o=>o.kind==='solar'),Bt=bat&&BAT[bat.bt],Sp=sol&&SOL[sol.sp],V=Bt?Bt.v:Sp?Sp.v*.85:0,mah=bat?bat.mah:0,imax=Bt?(Bt.imax||mah*30/1000):Sp?Sp.i:0;
 let cx=0,cy=0,cz=0;L.forEach((o,i)=>{cx+=o.x*W[i];cy+=o.y*W[i];cz+=o.z*W[i]});const cg=AUW?{x:cx/AUW,y:cy/AUW,z:cz/AUW}:{x:0,y:0,z:0};
 const motors=L.filter(o=>o.kind==='dcmotor'||o.kind==='bldc').map(o=>{const isDC=o.kind==='dcmotor',d=isDC?DCM[o.size]:null,rpm0=isDC?d.kv*V*.85:o.kv*V*.85,Pm=isDC?d.pm*Math.min(1.6,V/d.vr)**2:o.d*o.d*o.h*.2,load=0;return{o,isDC,d,rpm0,Pm,over:isDC?V/d.vr:0,gear:isDC?o.gear:1,used:false}});
 // parrakni eng yaqin motorga biriktirish (≤ 30 mm)
 let lift=0,thrustAll=0,Ptot=0;const props=L.filter(o=>o.kind==='prop').map(o=>{let best=null,bd=45;for(const q of motors){const dd=dist(q.o,o);if(dd<bd&&!q.used){bd=dd;best=q}}
  let T=0,rpm=0;if(best){best.used=true;const k=5.5e-15*o.d**4*o.p*(o.b==3?1.2:1),rpmP=Math.cbrt(best.Pm/Math.max(k,1e-20));rpm=Math.min(best.rpm0/best.gear,rpmP);T=3.1e-9*rpm*rpm*o.d**3*o.p*(o.b==3?1.15:1);best.P=Math.min(best.Pm,k*rpm**3);best.rpm=rpm}
  const up=axisUp(o);if(up.y>.7)lift+=T;thrustAll+=T;return{o,T,rpm,motor:best,up}});
 // g'ildirak — eng yaqin motor (≤ 45 mm) uni aylantiradi
 const wheels=L.filter(o=>o.kind==='wheel').map(o=>{let best=null,bd=45;for(const q of motors){const dd=dist(q.o,o);if(dd<bd){bd=dd;best=q}}return{o,motor:best}});
 const driven=wheels.filter(w=>w.motor),vWheel=driven.length?Math.min(...driven.map(w=>w.motor.rpm0*.8/w.motor.gear*Math.PI*w.o.d/1000/60)):0;
 const twr0=m?lift/(AUW||1):0;let I=0,Ipk=0;for(const q of motors){const Pf=q.P!=null?q.P:(q.isDC?q.d.pm:q.Pm*.15),hov=q.P!=null&&twr0>1?Math.min(1,Math.max(.12,Math.pow(1/twr0,1.5)*1.25)):.6,P=Pf*hov;I+=V?P/V/.8:0;Ipk+=V?Pf/V/.8:0;Ptot+=P}
 for(const o of L)if(EL_I[o.kind])I+=o.kind==='led'&&o.pw==='w1'?.3:EL_I[o.kind];
 const tRun=I>0&&mah?mah/1000*.8/I*60:0,twr=m?lift/(AUW||1):0,canFly=twr>=1.2,cgOff=lift>0?Math.hypot(cg.x-(props.filter(p=>p.up.y>.7).reduce((s,p)=>s+p.o.x*p.T,0)/(lift||1)),cg.z-(props.filter(p=>p.up.y>.7).reduce((s,p)=>s+p.o.z*p.T,0)/(lift||1))):0;
 const drag=driven.length?Math.max(0,.04*m*g):0;
 const sLim=sol&&I>0?Math.min(1,imax/I):1,escs=L.filter(o=>o.kind==='esc'),bl=L.filter(o=>o.kind==='bldc'),noEsc=Math.max(0,bl.length-escs.length),escLow=escs.filter((e,i)=>bl[i]&&motors.find(q=>q.o===bl[i])&&V&&(motors.find(q=>q.o===bl[i]).P||motors.find(q=>q.o===bl[i]).Pm)/V/.8>e.a);
 return{AUW,m,cg,V,Vn:V,mah,imax,I,Ipk,tRun:sol?Infinity:tRun,lift,thrustAll,twr,canFly,cgOff,motors,props,wheels,driven:driven.length,vWheel:vWheel*sLim,vTop:canFly?8:vWheel*sLim,Ptot,bat:!!bat||!!sol,solar:!!sol,sLim,escs,noEsc,escLow,
  parts:L.map((o,i)=>[KIND[o.kind].n,W[i]]),table:L.slice(0,10).map((o,i)=>({t:(i+1)*10,thrust:W[i],amp:EL_I[o.kind]||0,watt:0,eff:0}))}};
T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW)+' g'},{l:'Detallar',v:items(B).length+' ta'},{l:'Kuchlanish',v:D.V?fmt(D.V,1)+' V':'—',lvl:D.bat?'ok':'warn'},{l:'Tok',v:fmt(D.I,2)+' A',lvl:D.imax&&D.I>D.imax?'bad':'ok'},{l:'Ishlash vaqti',v:runTxt(D)},
 D.lift?{l:"Tortish/og'irlik",v:fmt(D.twr,2)+' : 1',lvl:D.canFly?'ok':'warn'}:{l:'Tezlik',v:D.driven?fmt(D.vWheel*3.6,1)+' km/soat':'—'}];
T.issues=(B,D)=>{const L=items(B),out=[],add=(l,t,y)=>out.push({lvl:l,t,why:y});
 if(!L.length)add('info',"Loyiha bo'sh","Kutubxonadan birinchi detalni qo'shing.");
 const el=L.filter(o=>KIND[o.kind].el===1);if(el.length&&!D.bat)add('bad',"Batareya yo'q",`${el.length} ta elektr detal bor, lekin ularni ta'minlaydigan batareya yo'q.`);
 for(const q of D.motors)if(q.isDC&&q.over>1.5)add('bad',`${KIND.dcmotor.n} ${q.o.size} ortiqcha kuchlanishda (${fmt(D.V,1)} V / ${q.d.vr} V)`,"Motor qiziydi va tez kuyadi. Kuchlanishi pastroq batareya yoki kuchliroq motor oling.");else if(q.isDC&&q.over<.6&&D.V)add('warn',`Motor ${q.o.size} sust aylanadi (${fmt(D.V,1)} V)`,'Kuchlanish nominaldan ancha past.');
 for(const q of D.motors)if(!q.isDC&&D.V&&D.V<6)add('warn',"Cho'tkasiz motorga past kuchlanish",'BLDC motorlar odatda 2S–6S LiPo bilan ishlaydi.');
 if(D.noEsc)add('bad',`${D.noEsc} ta cho'tkasiz motorga ESC yetmaydi`,"Cho'tkasiz (BLDC) motor 3 fazali: uni to'g'ridan-to'g'ri batareyaga ulab bo'lmaydi. Har bir motorga alohida ESC qo'shing.");
 for(const e of D.escLow)add('warn',`ESC ${e.a} A — motor uchun kam (${e.id})`,"ESC ning maksimal toki motor tokidan kamida 20–30 % katta bo'lishi kerak, aks holda qizib o'chadi.");
 if(L.some(o=>o.kind==='battery')&&L.some(o=>o.kind==='solar'))add('info',"Batareya va quyosh paneli birga","Hisob batareya bo'yicha. Panel bilan batareyani zaryadlash uchun zaryad kontrolleri (masalan TP4056 yoki MPPT) kerak — to'g'ridan-to'g'ri ulash xavfli.");
 for(const o of L){const a=aabb(o);if(a.mn[1]<-2){add('warn',`${KIND[o.kind].n} (${o.id}) yer ostiga kirib ketgan`,"Detalni yuqoriga ko'taring yoki «Yerga qo'yish» tugmasini bosing.");break}}
 {const un=L.filter(o=>o.goal&&!o.placed);if(un.length)add('bad',`${un.length} ta detal hali o'z joyiga o'rnatilmagan`,`${un.slice(0,4).map(o=>KIND[o.kind].n).join(', ')}${un.length>4?'…':''}. Avval «Yasash», keyin detalni sichqoncha bilan sariq sharpa ko'rsatgan joyga sudrang — u yerga yetganda o'zi joyiga tushadi.`)}
 const fl=floating(L.filter(o=>!o.goal||o.placed));if(fl.length)add('warn',`${fl.length} ta detal havoda osilib turibdi: ${fl.slice(0,4).map(o=>o.id).join(', ')}${fl.length>4?'…':''}`,"Bu detallar yerga ham, boshqa detalga ham tegmayapti — real hayotda ular tushib ketadi. Joyini o'zgartiring yoki «Ustiga qo'yish» tugmasidan foydalaning.");
 for(const p of gearPairs(L))if(!p.same)add('bad',`Shesternalar moduli har xil (${p.a.id}: ${fmt(p.a.m,1)} va ${p.b.id}: ${fmt(p.b.m,1)})`,"Tishlar faqat bir xil modulda ilashadi.");
  else if(!p.ok)add('warn',`Shesternalar orasi noto'g'ri (${p.a.id}–${p.b.id}): ${fmt(p.rad,1)} mm, kerak ${fmt(p.need,1)} mm`,"Markazlar orasidagi masofa a = m·(z₁+z₂)/2 bo'lishi kerak. Yaqin bo'lsa tishlar tiqilib qoladi, uzoq bo'lsa sirpanadi.");
 if(D.solar&&D.sLim<1)add(D.sLim<.8?'warn':'info',`Quyosh paneli tokni to'liq bermaydi (${fmt(D.I,2)} / ${fmt(D.imax,2)} A)`,`Kuchlanish tushadi — motorlar taxminan ${fmt(D.sLim*100)} % tezlikda aylanadi. Kattaroq panel yoki kamroq yuk qo'ying.`);
 else if(D.imax&&D.I>D.imax)add('bad',`Batareya toki yetmaydi (${fmt(D.I,1)} / ${fmt(D.imax,1)} A)`,'Kattaroq sig\'im yoki LiPo kerak.');else if(D.imax&&D.Ipk>D.imax&&!D.solar)add('warn',`To'liq gazda tok ${fmt(D.Ipk,1)} A — batareya ${fmt(D.imax,1)} A beradi`,"Qisqa muddat ishlaydi, lekin batareya qiziydi. Sig'imi kattaroq batareya oling.");
 const lone=D.props.filter(p=>!p.motor);if(lone.length)add('warn',`${lone.length} ta parrak motorga biriktirilmagan`,"Parrakni motor valining ustiga (45 mm ichida) joylang.");
 if(D.lift>0&&!D.canFly)add('info',`Uchishga tortish yetmaydi (${fmt(D.twr,2)}:1)`,"Uchish uchun yuqoriga qaragan parraklar tortishi og'irlikdan kamida 1,2 baravar ko'p bo'lishi kerak.");
 if(D.canFly&&D.cgOff>15)add('warn',`Og'irlik markazi ${fmt(D.cgOff)} mm siljigan`,"Parraklar markazi og'irlik markazi ustida bo'lishi kerak — aks holda qurilma bir tomonga ag'dariladi.");
 const w=D.wheels;if(w.length&&!D.driven)add('info',"G'ildiraklar aylantirilmaydi","G'ildirakni motor yoniga (45 mm ichida) qo'ying — shunda u yetaklovchi bo'ladi.");
 if(D.driven&&D.vWheel>6)add('warn',`Juda tez (${fmt(D.vWheel*3.6)} km/soat)`,"Motorga reduktor qo'shing (masalan 1:48) — tezlik pasayadi, kuch oshadi.");
 if(L.length&&!L.some(o=>o.kind==='sw'||o.kind==='btn')&&D.bat)add('info',"O'chirgich yo'q","Batareyani uzmasdan o'chirish uchun o'chirgich qo'shing.");
 return out};
T.catInfo=(cat,d,p,a)=>{a("Og'irlik",fmt(d.AUW)+' g');a('Tok',fmt(d.I,2)+' A')};
T.ext=D=>[['Og\'irlik markazi',`${fmt(D.cg.x)}, ${fmt(D.cg.y)}, ${fmt(D.cg.z)} mm`],['Yuqoriga tortish',fmt(D.lift)+' g'],['Barcha parraklar',fmt(D.thrustAll)+' g'],['Motorlar quvvati',fmt(D.Ptot,1)+' W'],["Yetakchi g'ildiraklar",D.driven+' ta'],['Batareya toki (maks.)',D.imax?fmt(D.imax,1)+' A':'—']];

// ---------- simlar: quvvat shinasi ----------
T.wiring=B=>{const L=items(B),bat=L.find(o=>o.kind==='battery')||L.find(o=>o.kind==='solar'),el=L.filter(o=>KIND[o.kind].el===1&&o.kind!=='bldc'),n=Math.max(4,Math.min(10,el.length+1)),sp=300/(n-1);
 const board={id:'bus',label:"Quvvat shinasi (+ / −)",x:420,y:170,w:200,h:340,need:bat?bat.id:'__none',pads:[...Array.from({length:n},(_,i)=>({id:'P'+(i+1),t:'vbat',x:420,y:190+i*sp,l:'+'+(i+1)})),...Array.from({length:n},(_,i)=>({id:'G'+(i+1),t:'gnd',x:620,y:190+i*sp,l:'−'+(i+1)})),{id:'BAT+',t:'vbat',x:470,y:510,l:'B+'},{id:'BAT-',t:'gnd',x:570,y:510,l:'B−'}]};
 const P=Array.from({length:n},(_,i)=>'P'+(i+1)),G=Array.from({length:n},(_,i)=>'G'+(i+1)),comps=[],boards=[board];
 if(bat)comps.push({id:'xt60',label:bat.kind==='solar'?'Quyosh paneli':'Batareya',x:520,y:610,need:bat.id,wires:[{id:'bat+',l:'+',col:'#e53935',kind:'p9',ok:['BAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'gnd',ok:['BAT-'],w:4}]});
 el.forEach((o,i)=>{const left=i%2===0,row=Math.floor(i/2);comps.push({id:'c'+o.id,label:`${KIND[o.kind].n} (${o.id})`,x:left?170:870,y:110+row*95,need:o.id,wires:[{id:o.id+'+',l:'+',col:'#e53935',kind:'p9',ok:P,w:2.5},{id:o.id+'-',l:'−',col:'#222',kind:'gnd',ok:G,w:2.5}]})});
 // ESC — o'z platasi (A, B, C faza kontaktlari); har bir cho'tkasiz motor tartib bo'yicha o'z ESC siga 3 ta sim bilan ulanadi (fazalar har xil kontaktda)
 const escs=L.filter(o=>o.kind==='esc').slice(0,4),bl=L.filter(o=>o.kind==='bldc'),EX=[30,200,690,860];
 escs.forEach((e,i)=>{const x=EX[i],y=545;boards.push({id:'esc_'+e.id,label:`ESC ${e.a} A (${e.id}) — motor fazalari`,x,y,w:140,h:80,need:e.id,pads:['A','B','C'].map((f,k)=>({id:e.id+f,t:'motor',x:x+25+k*45,y,l:f}))});
  const m=bl[i];if(m){const row=Math.floor((el.length+i)/2),left=(el.length+i)%2===0,ok=['A','B','C'].map(f=>e.id+f);
   comps.push({id:'c'+m.id,label:`Cho'tkasiz motor (${m.id}) → ESC ${e.id}`,x:left?170:870,y:110+row*95,need:m.id,wires:['a','b','c'].map((f,k)=>({id:m.id+f,l:f,col:['#c58a3a','#b0702a','#d39a4a'][k],kind:'motor',ok,grp:'m'+m.id,w:3}))})}});
 return{boards,comps,hint:"Manba simlari shinaning B+ va B− kontaktlariga, har bir detalning + simi «+» qatoriga, − simi «−» qatoriga. Cho'tkasiz motorning 3 ta simi o'z ESC sining A, B, C kontaktlariga (har biri alohida). Teskari ulash — qisqa tutashuv."}};

// ---------- 3D model (sm) ----------
T.build=(B,D,ctx)=>{const X=!!window.XRAY;
 for(const o of items(B)){const g=new THREE.Group(),c=o.col||'#9e9e9e',mm=o.mat?mMat(o.mat==='wood'?'wood':o.mat==='alu'||o.mat==='steel'?'alu':o.mat==='carbon'?'carbon':'plastic',c,'satin'):mPaint(c,'satin'),M=X&&['box','tube','plate'].includes(o.kind)?MAT('xrf'+c,()=>new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:.25,depthWrite:false})):mm;
  switch(o.kind){
   case'plate':{const w=o.w/10,d=o.d/10,t=o.t/10;g.add(tagP(rbox(w,t,d,Math.min(w,d)*.06,M,0,-t/2,0),'Plastina',1));
    const hx=w/2-.45,hz=d/2-.45;for(const[sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(tagP(cyl(.17,.17,t+.02,mPlastic('#0b0b0b',.8),sx*hx,0,sz*hz,12),'Montaj teshiklari (M3)',2));g.add(tagP(cyl(.28,.28,.12,mMetal('#c0c4c9',.3),sx*hx,t/2+.06,sz*hz,6),'Vintlar (M3)',3))}break}
   case'beam':{const L=o.len/10,w=o.w/10;g.add(tagP(box(L,w,w,M,0,0,0),'Profil',1));
    if(o.mat==='alu'||o.mat==='steel'){const sl=mPlastic('#1b1d20',.6);for(const[y,z,a,b]of[[w/2,0,w*.28,.06],[-w/2,0,w*.28,.06],[0,w/2,.06,w*.28],[0,-w/2,.06,w*.28]])g.add(tagP(box(L*.995,a===w*.28?.05:a,b===.06?w*.28:b,sl,0,y,z),'T-ariqchalar (profil pazlari)',2));
     for(const s2 of[-1,1])g.add(tagP(box(.04,w*.96,w*.96,mPlastic('#2a2d31',.5),s2*L/2,0,0),'Uchidagi qopqoqlar',3))}break}
   case'box':{const w=o.w/10,h=o.h/10,d=o.d/10,t=o.wall/10;g.add(tagP(box(w,t,d,M,0,-h/2+t/2,0),'Tub',1));for(const s of[-1,1]){g.add(tagP(box(t,h,d,M,s*(w/2-t/2),0,0),'Yon devorlar',2));g.add(tagP(box(w,h,t,M,0,0,s*(d/2-t/2)),'Old va orqa devor',2))}g.add(tagP(box(w,t,d,M,0,h/2-t/2,0),'Qopqoq',3));break}
   case'tube':{const tb=new THREE.Mesh(GEO(`ftube${o.d},${o.len}`,()=>new THREE.CylinderGeometry(o.d/20,o.d/20,o.len/10,32,1,true)),M===mm?MAT('ftd'+c+o.mat,()=>{const q=mm.clone();q.side=THREE.DoubleSide;return q}):M);tb.castShadow=true;g.add(tagP(tb,'Truba devori',1));
    for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.RingGeometry(o.d/20-o.wall/10,o.d/20,32),mPlastic('#333',.5));r.rotation.x=s*Math.PI/2;r.position.y=s*o.len/20;r.userData.dispose=true;g.add(tagP(r,"Uchlari (halqa)",2))}break}
   case'dcmotor':{const d=DCM[o.size],r=d.d/20,l=d.l/10,ml=mMetal('#c4c9cf',.22);
    // korpus: ikki tomoni yassilangan po'lat silindr (haqiqiy 130/280/370 motorlar kabi), bosma yorliq bilan
    const can=cyl(r,r,l*.86,ml,0,l*.07,0,40);can.scale.x=.8;g.add(tagP(can,"Po'lat korpus (ichida magnitlar va yakor)",1));
    const lab=new THREE.Mesh(GEO(`dclab${r},${l}`,()=>new THREE.CylinderGeometry(r*1.006,r*1.006,l*.42,40,1,true)),MAT('dclabm'+o.size,()=>new THREE.MeshPhysicalMaterial({map:motorTex(o.size,d.vr),roughness:.4,clearcoat:.5})));lab.scale.x=.8;lab.position.y=l*.05;g.add(tagP(lab,'Yorliq (turi va kuchlanishi)',1));
    // old qopqoq: latun vtulka, ikki montaj teshigi, ventilyatsiya tirqishlari
    {const fc=cyl(r*.97,r*.97,.06,ml,0,l/2+.03,0,40);fc.scale.x=.8;g.add(tagP(fc,"Old qopqoq",1))}
    g.add(tagP(cyl(r*.34,r*.34,.14,mMetal('#c9a227',.28),0,l/2+.1,0,20),'Latun vtulka (podshipnik)',3));
    for(const sx of[-1,1]){g.add(tagP(cyl(r*.09,r*.09,.08,mPlastic('#0a0a0a',.8),sx*r*.5,l/2+.05,0,12),'Montaj teshiklari (M2)',3));const sl=box(r*.18,.04,r*.5,mPlastic('#0a0a0a',.8),0,l/2+.05,sx*r*.55);g.add(tagP(sl,'Ventilyatsiya tirqishlari',3))}
    const sh=cyl(.1,.1,.85,mMetal('#eceff1',.15),0,l/2+.5,0,14);g.add(tagP(sh,"Val (yassi kesimli)",3));g.add(tagP(box(.06,.5,.2,mMetal('#cfd8dc',.2),.07,l/2+.7,0),"Val",3));
    // orqa qopqoq (plastik) cho'tkalar bilan, mis kontakt plastinalari teshigi bilan
    const eb=cyl(r*.9,r*.9,l*.16,mPlastic(o.size==='130'?'#f5f5f5':'#1c1c1c',.5),0,-l/2+l*.06,0,36);eb.scale.x=.8;g.add(tagP(eb,"Orqa qopqoq (cho'tkalar ichida)",2));
    g.add(tagP(cyl(r*.3,r*.3,.12,mPlastic(o.size==='130'?'#e0e0e0':'#111',.5),0,-l/2-.04,0,20),"Kollektor qopqog'i",2));
    for(const sx of[-1,1]){const tb=box(.22,.34,.04,mCopper(),sx*r*.45,-l/2-.12,0);g.add(tagP(tb,'Kontakt plastinalari (+ / −)',5));const hl=cyl(.05,.05,.06,mPlastic('#000',.8),sx*r*.45,-l/2-.2,0,10);hl.rotation.x=Math.PI/2;g.add(tagP(hl,'Kontakt plastinalari (+ / −)',5))}
    g.add(tagP(box(.12,.12,.04,mPaint('#d32f2f','gloss'),r*.45,-l/2+.12,r*.02),"«+» belgisi (qizil nuqta)",5));
    // reduktor (sariq TT tipidagi quti): ikki qism korpus, vintlar, oq olti qirrali chiqish vali
    if(o.gear>1){const gy=-l/2-r*.75,gh=r*1.4,yel=mPlastic('#f2c200',.45);g.add(tagP(rbox(r*2.3,gh*.5,r*2.5,.12,yel,0,gy+gh*.25,0),`Reduktor korpusi (${o.gear}:1)`,4));g.add(tagP(rbox(r*2.3,gh*.5,r*2.5,.12,mPlastic('#e8b800',.5),0,gy-gh*.25,0),`Reduktor korpusi (${o.gear}:1)`,4));
     for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])g.add(tagP(cyl(.09,.09,gh*1.02,mMetal('#9aa3ad',.3),sx*r*.95,gy,sz*r*1.05,8),'Reduktor vintlari',4));
     g.add(tagP(box(r*2.32,.02,r*2.52,mPlastic('#c79a00',.6),0,gy,0),'Qismlar tutashuvi',4));const out=cyl(r*.28,r*.28,r*.32,mPlastic('#f5f5f5',.4),0,gy-gh/2-r*.16,0,6);g.add(tagP(out,"Chiqish vali (olti qirrali)",4))}break}
   case'bldc':{const m=mkMotor(o.d,o.h,c);m.position.y=-.3;g.add(m);break}
   case'prop':{const sp=new THREE.Group(),pr=mkProp(o.d,o.p,+o.b,'pc',c,'CCW');sp.add(pr);sp.userData.fspin=o.id;g.add(sp);if(ctx.inst(o.id))ctx.spin(sp,1);break}
   case'wheel':{const wh=mkWheel(o.d,o.w,'slick',c,'#151515');wh.userData.fwheel=o.id;g.add(wh);break}
   case'battery':{const b=BAT[o.bt];if(o.bt.startsWith('lipo')){const bb=mkBattery(+o.bt.slice(-1),o.mah,'lipo',c,[b.n,`${o.mah} mAh`,'']);bb.position.y=-bb.userData.dims.h/2;g.add(bb)}
    else{const n=o.bt==='aa2'?2:o.bt==='aa4'?4:o.bt==='li1'?1:2,big=o.bt.startsWith('li'),r=big?.92:.72,l=big?6.5:5;g.add(tagP(box(n*r*2+.3,r*2+.2,l+.6,mPlastic('#111',.5),0,0,0),'Ushlagich (prujinali)',1));
     for(let k=0;k<n;k++){const x=(k-(n-1)/2)*r*2,cy=cyl(r,r,l,MAT('cellw'+big+(k%2),()=>new THREE.MeshPhysicalMaterial({map:cellTex(big,k%2),roughness:.35,metalness:.25,clearcoat:.6})),x,.15,0,20);cy.rotation.x=Math.PI/2;g.add(tagP(cy,big?'18650 elementlar':'AA elementlar',2));
      const tip=cyl(r*.35,r*.35,.12,mMetal('#d5d9de',.2),x,.15,(k%2?-1:1)*(l/2+.06),12);tip.rotation.x=Math.PI/2;g.add(tagP(tip,'Kontakt va prujinalar',3));
      const sp=new THREE.Mesh(springGeo(r*.45,5,.45,.04),mMetal('#d5d9de',.2));sp.rotation.x=Math.PI/2;sp.position.set(x,.15,(k%2?1:-1)*(l/2+.05));g.add(tagP(sp,'Kontakt va prujinalar',3))}
     for(const[s2,cl]of[[.3,'#d32f2f'],[-.3,'#1b1b1b']])g.add(tagP(wireMesh([[s2,0,l/2+.3],[s2*1.6,.1,l/2+1.4],[s2*2,.2,l/2+2.6]],cl,.05),'Simlar',4))}break}
   case'sw':{g.add(tagP(rbox(1.5,.8,1,.12,mPlastic('#111',.5),0,-.4,0),"O'chirgich korpusi",1));g.add(tagP(box(1.7,.1,1.15,mPlastic('#161616',.5),0,0,0),'Ramka',1));const rk=box(1,.35,.65,mPlastic(c,.4),0,.18,0);rk.rotation.z=.18;g.add(tagP(rk,'Klavisha (I/O)',2));
    g.add(tagP(box(.12,.02,.3,mPlastic('#ffffff',.4),-.25,.37,0),'Klavisha (I/O)',2));for(const s2 of[-.35,.35])g.add(tagP(box(.12,.6,.3,mMetal('#c9a227',.3),s2,-1.05,0),'Kontakt plastinalari',3));break}
   case'led':{const lc=LEDC[o.c]||'#fff',d=new THREE.Mesh(GEO('fled',()=>new THREE.CapsuleGeometry(.25,.35,6,14)),MAT('fledoff'+lc,()=>new THREE.MeshPhysicalMaterial({color:lc,transparent:true,opacity:.75,roughness:.15})));d.position.y=.35;d.userData.fled=lc;d.userData.fledId=o.id;d.userData.fledK=(+o.ls/5||1)*(o.pw==='w1'?1.6:1);d.castShadow=true;const lk=+o.ls/5||1;if(lk>1){d.scale.setScalar(lk);d.position.y=.35*lk-.05}g.add(tagP(d,'LED linzasi',1));
    if(lk>=4){const r=.25*lk;g.add(tagP(cyl(r*1.12,r*1.12,.12,mMetal('#cfd8dc',.15),0,.12,0,32),"Reflektor halqasi",1));const hd=new THREE.Mesh(GEO('fledhood'+lk,()=>new THREE.CylinderGeometry(r*1.25,r*1.25,r*1.6,28,1,true,-Math.PI/2,Math.PI)),MAT('hoodm',()=>new THREE.MeshStandardMaterial({color:'#151515',roughness:.6,side:THREE.DoubleSide})));
     hd.position.set(0,r*.85,0);hd.rotation.y=Math.PI;hd.castShadow=true;g.add(tagP(hd,"Soyabon (quyosh nuridan to'sadi)",2))}
    for(const dx of[-.1,.1])g.add(tagP(cyl(.025,.025,.5,mMetal('#cfd8dc',.2),dx,-.2,0,6),'Oyoqchalar',2));break}
   case'servo':{const s=mkServo(o.sk,c);g.add(s);break}
   case'camera':{const cm=mkCamera(19,c,false);g.add(cm);break}
   case'sensor':{const pcb=box(4.5,2,.16,mPCB('#1565c0','HC-SR04'),0,0,0);g.add(tagP(pcb,'Plata (HC-SR04)',1));
    // ikki ultratovush o'zgartkich: alyuminiy stakan, oldida to'r, ichida pyezo; T — uzatgich, R — qabul qilgich
    for(const sx of[-1,1]){const can=cyl(.8,.8,1.15,mMetal('#c4c9cf',.22),sx*1.3,0,-.66,36);can.rotation.x=Math.PI/2;g.add(tagP(can,'Ultratovush o\'zgartkichlari (T va R)',2));
     const rim=new THREE.Mesh(GEO('srrim',()=>new THREE.TorusGeometry(.76,.05,8,36)),mMetal('#aab2bb',.25));rim.position.set(sx*1.3,0,-1.24);g.add(tagP(rim,'Ultratovush o\'zgartkichlari (T va R)',2));
     const mesh=new THREE.Mesh(GEO('srmesh',()=>new THREE.CircleGeometry(.72,40)),MAT('srmeshm',()=>new THREE.MeshStandardMaterial({map:meshTex(),roughness:.6,metalness:.3,transparent:true})));mesh.position.set(sx*1.3,0,-1.235);mesh.rotation.y=Math.PI;g.add(tagP(mesh,"Himoya to'ri",3));
     g.add(tagP(box(.28,.28,.02,mPlastic('#ffffff',.4),sx*1.3+(sx<0?.95:-.95),.75,-.09),sx<0?'«T» belgisi':'«R» belgisi',3))}
    // orqa tomonda: kvars rezonator, 3 ta mikrosxema, kondensatorlar
    {const xt=cyl(.22,.22,.5,mMetal('#d5d9de',.2),0,.45,.18,20);xt.rotation.z=Math.PI/2;xt.scale.z=.45;g.add(tagP(xt,'Kvars rezonator (4 MHz)',4))}
    for(const[x,y,w]of[[-1.1,-.2,.6],[0,-.35,.5],[1.1,-.2,.6]])g.add(tagP(box(w,.45,.12,mPlastic('#141414',.4),x,y,.14),'Mikrosxemalar (kuchaytirgich, generator)',4));
    // 4 pinli ulagich: VCC, Trig, Echo, GND — pastga qaragan
    g.add(tagP(box(1.05,.25,.25,mPlastic('#111',.5),0,-1.12,.02),'Ulagich (VCC · Trig · Echo · GND)',5));for(let k=0;k<4;k++)g.add(tagP(box(.06,.62,.06,mMetal('#d4af37',.25),-.38+k*.254,-1.3,.02),'Ulagich (VCC · Trig · Echo · GND)',5));break}
   case'mcu':{g.add(tagP(box(6.86,.16,5.34,mPCB('#00798c','UNO'),0,0,0),'Plata (Arduino UNO, 68,6×53,4 mm)',1));const T0=.08,blk=mPlastic('#121212',.45),met=mMetal('#c9ced4',.2),gold=mMetal('#d4af37',.25);
    for(const[x,z]of[[-2.9,-2.4],[2.4,-2.4],[-2.9,2.1],[3.0,1.4]]){g.add(tagP(cyl(.16,.16,.18,mPlastic('#0a0a0a',.8),x,0,z,14),'Montaj teshiklari',1));g.add(tagP(cyl(.24,.24,.01,gold,x,T0+.005,z,16),'Montaj teshiklari',1))}
    // USB-B va quvvat gnezdosi (chap chetda, plata chetidan chiqib turadi)
    g.add(tagP(box(1.6,1.08,1.2,met,-3.2,T0+.54,-1.3),'USB-B ulagich (dastur yuklash)',2));g.add(tagP(box(.06,.7,.82,mPlastic('#0a0a0a',.6),-4.01,T0+.54,-1.3),'USB-B ulagich (dastur yuklash)',2));
    g.add(tagP(box(1.4,1.05,.9,blk,-3.05,T0+.52,1.75),'Quvvat gnezdosi (7–12 V)',2));{const hl=cyl(.22,.22,.08,mPlastic('#000',.9),-3.76,T0+.6,1.75,16);hl.rotation.z=Math.PI/2;g.add(tagP(hl,'Quvvat gnezdosi (7–12 V)',2))}
    // ATmega328P (DIP-28) panelda, 2×14 oyoq
    g.add(tagP(box(3.6,.08,.95,mPlastic('#1b1b1b',.5),.9,T0+.04,.95),'Mikrosxema paneli',3));{const ch=new THREE.Mesh(GEO('atm',()=>new THREE.BoxGeometry(3.55,.34,.74)),[blk,blk,MAT('atmtop',()=>new THREE.MeshStandardMaterial({map:chipTex(),roughness:.45})),blk,blk,blk]);ch.position.set(.9,T0+.29,.95);ch.castShadow=true;g.add(tagP(ch,'Mikrokontroller ATmega328P (16 MHz)',3))}
    for(let i=0;i<14;i++)for(const sz of[-1,1])g.add(tagP(box(.05,.2,.08,met,.9-1.65+i*.254,T0+.14,.95+sz*.4),'Mikrokontroller oyoqlari',3));
    // kvars, stabilizator, kondensatorlar, reset tugmasi, indikator LEDlar, ICSP
    {const xt=cyl(.2,.2,.3,met,-.6,T0+.15,.95,20);xt.scale.z=.45;g.add(tagP(xt,'Kvars rezonator (16 MHz)',4))}
    g.add(tagP(box(.65,.45,.25,blk,-2.3,T0+.23,2.15),'Kuchlanish stabilizatori (5 V)',4));g.add(tagP(box(.65,.5,.04,met,-2.3,T0+.3,2.3),'Kuchlanish stabilizatori (5 V)',4));
    for(const x of[-1.75,-1.25]){g.add(tagP(cyl(.3,.3,.6,mPaint('#1a237e','satin'),x,T0+.3,2.05,24),'Elektrolitik kondensatorlar (47 µF)',4));g.add(tagP(cyl(.29,.29,.02,met,x,T0+.61,2.05,24),'Elektrolitik kondensatorlar (47 µF)',4))}
    g.add(tagP(box(.6,.3,.6,met,-2.85,T0+.15,-2.25),'Reset tugmasi',4));g.add(tagP(cyl(.17,.17,.12,mPlastic('#c62828',.4),-2.85,T0+.36,-2.25,16),'Reset tugmasi',4));
    for(const[x,z,c]of[[.15,-1.45,'#ffb300'],[.15,-1.15,'#ffb300'],[.15,-.85,'#ffb300'],[2.2,.0,'#43a047']])g.add(tagP(box(.16,.08,.1,mGlow(c),x,T0+.04,z),'Indikator LEDlar (L, TX, RX, ON)',4));
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)g.add(tagP(box(.06,.55,.06,gold,3.05+j*.254,T0+.28,.7+i*.254),'ICSP ulagichi',5));g.add(tagP(box(.55,.25,.8,blk,3.18,T0+.12,.95),'ICSP ulagichi',5));
    // urg'ochi ulagich qatorlari (Dupont simlar uchun): raqamli 0–13 (tepada), quvvat va analog (pastda)
    const hdr=(x0,n,z,lab)=>{g.add(tagP(box(n*.254,.85,.25,blk,x0+n*.127,T0+.42,z),lab,5));for(let k=0;k<n;k++)g.add(tagP(box(.1,.02,.1,mPlastic('#000',.95),x0+.127+k*.254,T0+.855,z),lab,5))};
    hdr(-1.3,10,-2.42,'Raqamli pinlar (D8–D13, GND, AREF, SDA, SCL)');hdr(1.35,8,-2.42,'Raqamli pinlar (D0–D7)');hdr(-1.05,8,2.42,'Quvvat pinlari (IOREF, RESET, 3V3, 5V, GND, VIN)');hdr(1.35,6,2.42,'Analog kirishlar (A0–A5)');break}
   case'gear':{const gm=new THREE.Mesh(gearGeo(o.zt,o.m,o.t),M);gm.rotation.x=Math.PI/2;gm.castShadow=true;g.add(tagP(gm,`Tishli gardish (${o.zt} tish, m ${fmt(o.m,1)})`,1));
    const r=o.m*o.zt/20;g.add(tagP(cyl(Math.max(.25,r*.28),Math.max(.25,r*.28),o.t/10+.2,mPlastic('#37474f',.5),0,0,0,24),'Vtulka (val uchun)',2));
    if(r>.9)for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,hl=cyl(r*.14,r*.14,o.t/10+.02,mPlastic('#0b0b0b',.8),Math.cos(a)*r*.58,0,Math.sin(a)*r*.58,14);g.add(tagP(hl,'Yengillatish teshiklari',1))}
    g.add(tagP(cyl(.08,.08,o.t/10+.3,mMetal('#9aa3ad',.3),Math.max(.25,r*.28)*.7,0,0,6),"Fiksator vint (M3)",3));break}
   case'axle':{const r=o.d/20,L=o.len/10,ax=cyl(r,r,L,mMetal(o.mat==='steel'?'#cfd8dc':c,.22),0,0,0,18);ax.rotation.z=Math.PI/2;g.add(tagP(ax,"Val (silliqlangan)",1));
    for(const s2 of[-1,1]){const cl=cyl(r*1.5,r*1.5,.08,mMetal('#3a3f45',.35),s2*(L/2-.25),0,0,16);cl.rotation.z=Math.PI/2;g.add(tagP(cl,"Stopor halqalar (E-klips)",2))}break}
   case'bracket':{const a=o.a/10,w=o.w/10,t=o.t/10;g.add(tagP(box(w,t,a,M,0,t/2,a/2),'Gorizontal tomoni',1));g.add(tagP(box(w,a,t,M,0,a/2,t/2),'Vertikal tomoni',1));
    const gs=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(a*.45,0),new THREE.Vector2(0,a*.45)]),gg=new THREE.ExtrudeGeometry(gs,{depth:t,bevelEnabled:false});gg.rotateY(-Math.PI/2);gg.translate(t/2,t,t);const gu=new THREE.Mesh(gg,M);gu.userData.dispose=true;gu.castShadow=true;g.add(tagP(gu,"Qovurg'a (mustahkamlik)",2));
    for(const dz of[a*.62]){g.add(tagP(cyl(.17,.17,t+.02,mPlastic('#0b0b0b',.8),0,t/2,dz,12),'Vint teshiklari',3));const h2=cyl(.17,.17,t+.02,mPlastic('#0b0b0b',.8),0,dz,t/2,12);h2.rotation.x=Math.PI/2;g.add(tagP(h2,'Vint teshiklari',3))}break}
   case'sphere':{const r=o.d/20,half=+o.half,sg=new THREE.Mesh(GEO(`fsph${o.d},${half}`,()=>new THREE.SphereGeometry(r,48,half?16:32,0,Math.PI*2,0,half?Math.PI/2:Math.PI)),half&&M===mm?MAT('fsd'+c+o.mat,()=>{const q=mm.clone();q.side=THREE.DoubleSide;return q}):M);sg.castShadow=true;g.add(tagP(sg,half?'Gumbaz qobig\'i':'Shar',1));
    if(half){const rg=new THREE.Mesh(GEO(`fsphr${o.d}`,()=>new THREE.TorusGeometry(r,Math.max(.05,r*.03),8,48)),mPlastic('#263238',.5));rg.rotation.x=Math.PI/2;g.add(tagP(rg,'Chet halqasi (mahkamlash)',2))}break}
   case'solar':{const p=SOL[o.sp],A=p.a/10,Bb=p.b/10,cs=2.6,nx=Math.max(2,Math.floor((A-.6)/cs)),nz=Math.max(2,Math.floor((Bb-.6)/cs)),cw=(A-.6)/nx,cd=(Bb-.6)/nz;
    g.add(tagP(rbox(A,.3,Bb,.08,mMetal('#aeb5bd',.3),0,0,0),"Alyuminiy ramka",1));g.add(tagP(box(A-.3,.04,Bb-.3,mPlastic('#e8ecef',.6),0,.16,0),"Orqa plyonka (EVA)",1));
    const cm=MAT('solcell'+c,()=>new THREE.MeshPhysicalMaterial({color:c,roughness:.25,metalness:.35,clearcoat:1,clearcoatRoughness:.08}));
    for(let i=0;i<nx;i++)for(let k=0;k<nz;k++)g.add(tagP(box(cw*.94,.04,cd*.94,cm,-A/2+.3+cw*(i+.5),.19,-Bb/2+.3+cd*(k+.5)),'Kremniy elementlar',2));
    for(let i=0;i<nx;i++)for(const f of[.3,.7])g.add(tagP(box(.03,.045,Bb-.7,mMetal('#d9dde1',.2),-A/2+.3+cw*(i+f),.2,0),'Shina (kumush o\'tkazgichlar)',3));
    g.add(tagP(box(Math.min(3,A*.3),.5,1.6,mPlastic('#1b1b1b',.5),0,-.4,-Bb*.3),"Ulash qutisi (diod ichida)",4));
    for(const[s2,cl]of[[.4,'#d32f2f'],[-.4,'#1b1b1b']])g.add(tagP(wireMesh([[s2,-.5,-Bb*.3-.8],[s2*1.4,-.6,-Bb*.3-2],[s2*1.8,-.6,-Bb*.3-3.2]],cl,.06),'Simlar',5));break}
   case'esc':{g.add(tagP(rbox(2.4,.8,4,.25,mPlastic(c,.45),0,0,0),"Issiqlik qisqaruvchi qobiq",1));g.add(tagP(box(2,.15,3.2,mPCB('#1b5e20','ESC'),0,.48,0),'Plata (MOSFET tranzistorlar)',2));
    for(let k=-3;k<=3;k++)g.add(tagP(box(.08,.3,2.6,mMetal('#9aa3ad',.35),k*.26,.7,0),'Radiator',3));
    ['#c58a3a','#b0702a','#d39a4a'].forEach((cl,k)=>g.add(tagP(wireMesh([[(k-1)*.6,0,2],[(k-1)*.7,0,3],[(k-1)*.8,0,4]],cl,.08),'Faza simlari (A, B, C)',4)));
    for(const[s2,cl]of[[.4,'#d32f2f'],[-.4,'#1b1b1b']])g.add(tagP(wireMesh([[s2,0,-2],[s2*1.2,0,-3.2],[s2*1.3,0,-4.4]],cl,.1),'Quvvat simlari',5));
    g.add(tagP(wireMesh([[.9,.2,-2],[1.2,.3,-3],[1.5,.3,-3.8]],'#f9a825',.04),'Signal simi (PWM)',5));break}
   case'buzzer':{g.add(tagP(cyl(.6,.6,.9,mPlastic('#141414',.45),0,0,0,32),'Korpus',1));{const lb=new THREE.Mesh(new THREE.CircleGeometry(.5,32),MAT('buzlab',()=>new THREE.MeshStandardMaterial({map:buzTex(),roughness:.5})));lb.rotation.x=-Math.PI/2;lb.position.y=.455;lb.userData.dispose=true;g.add(tagP(lb,"Yorliq (yuvgandan keyin oling)",4))}g.add(tagP(cyl(.12,.12,.04,mPlastic('#000',.8),0,.46,0,12),"Ovoz teshigi",1));
    g.add(tagP(box(.12,.02,.04,mPlastic('#ffffff',.4),-.32,.46,-.3),"«+» belgisi",2));for(const dx of[-.2,.2])g.add(tagP(cyl(.025,.025,.6,mMetal('#cfd8dc',.2),dx,-.75,0,6),'Oyoqchalar',3));break}
   case'sticker':{const w=o.w/10,h=stH(o)/10,tex=stickerTex(o),mt=MAT('stk'+tex.uuid+o.fin,()=>new THREE.MeshPhysicalMaterial({map:tex,transparent:true,alphaTest:.02,roughness:o.fin==='matte'?.8:o.fin==='metal'?.25:.3,metalness:o.fin==='metal'?.85:0,clearcoat:o.fin==='gloss'?1:0,clearcoatRoughness:.12}));
    const pl=new THREE.Mesh(GEO(`stkp${w},${h}`,()=>new THREE.PlaneGeometry(w,h)),mt);pl.rotation.set(-Math.PI/2,0,Math.PI);pl.position.y=.08;pl.receiveShadow=true;pl.renderOrder=3;g.add(tagP(pl,"Vinil yorliq",1));break}
   case'btn':{const big=o.bk==='big',w=big?1.6:1.2;g.add(tagP(box(w,.35,w,mPlastic('#1b1b1b',.5),0,-.2,0),'Korpus',1));for(const sx of[-1,1])for(const sz of[-1,1])g.add(tagP(box(.06,.4,.12,mMetal('#cfd8dc',.2),sx*w*.42,-.4,sz*w*.42),'Oyoqchalar (4 ta)',2));
    const cap=cyl(w*.3,w*.3,big?.5:.35,mPlastic(c,.4),0,big?.25:.15,0,24);g.add(tagP(cap,'Bosiladigan qopqoq',3));if(big)g.add(tagP(cyl(w*.42,w*.42,.12,mPlastic('#111',.5),0,-.02,0,24),'Gardish',2));break}
   case'pot':{g.add(tagP(cyl(.8,.8,.5,mMetal('#9aa3ad',.3),0,-.35,0,28),'Korpus',1));g.add(tagP(cyl(.35,.35,.5,mMetal('#c9a227',.3),0,.15,0,16),'Rezbali vtulka',2));g.add(tagP(cyl(.12,.12,.4,mMetal('#cfd8dc',.2),0,.55,0,10),'Val',3));
    const kn=cyl(.55,.6,.75,mPlastic(c,.45),0,.95,0,28);g.add(tagP(kn,'Dastak (ruchka)',4));g.add(tagP(box(.06,.04,.4,mPlastic('#ffffff',.4),0,1.33,-.2),'Ko\'rsatkich chizig\'i',4));
    for(const dx of[-.35,0,.35])g.add(tagP(box(.08,.04,.5,mMetal('#cfd8dc',.2),dx,-.55,-.9),'Uchta oyoq (1 · signal · 3)',5));break}
   case'ldr':{const hd=cyl(.25,.25,.1,mPlastic('#efe6c8',.4),0,1.05,0,20);g.add(tagP(hd,"Sezgir yuza (kadmiy sulfid)",1));
    const zz=[];for(let k=0;k<7;k++)zz.push(new V3(-.14+.28*(k%2),1.11,-.18+k*.06));g.add(tagP(new THREE.Line(new THREE.BufferGeometry().setFromPoints(zz),new THREE.LineBasicMaterial({color:c})),"Ilon izi (o'tkazgich yo'li)",1));
    g.add(tagP(cyl(.27,.27,.25,MAT('ldrcl',()=>new THREE.MeshPhysicalMaterial({color:'#ffffff',transparent:true,opacity:.35,roughness:.05})),0,1.12,0,20),'Shaffof qoplama',2));
    for(const dx of[-.1,.1])g.add(tagP(cyl(.025,.025,1,mMetal('#cfd8dc',.2),dx,.5,0,6),'Oyoqchalar',3));break}}
  if(o.goal&&!o.placed&&ctx.inst(o.id)&&ctx.step!=='inspect'){const gh=g.clone(true);gh.position.set(o.goal.x/10,o.goal.y/10,o.goal.z/10);gh.rotation.set(o.goal.rx*DEG,o.goal.ry*DEG,o.goal.rz*DEG);
   gh.traverse(m=>{m.userData={};if(m.isMesh||m.isLine){m.material=goalMat;m.castShadow=false;m.receiveShadow=false}});gh.userData.goalOf=o.id;ctx.deco(gh)}
  g.position.set(o.x/10,o.y/10,o.z/10);g.rotation.set(o.rx*DEG,o.ry*DEG,o.rz*DEG);ctx.add(o.id,g,[0,3,0])}};
const goalMat=new THREE.MeshBasicMaterial({color:'#ffc24a',transparent:true,opacity:.28,depthWrite:false});
T.bom=(B,D)=>items(B).map(o=>{const K=KIND[o.kind],ps=K.f.map(f=>f.type==='sel'?f.o[o[f.k]]:fmt(o[f.k],f.step<1?1:0)+' '+(f.u||'')).join(', ');return[K.g,`${K.n} (${o.id})`,ps+(o.mat?'':''),1,weight(o)]});

// ---------- loyihalash paneli ----------
let SEL=null,LIBCAT='build',LIBQ='';
const snapOf=B=>B.p.free&&B.p.free.snap!=null?+B.p.free.snap:5,snapV=v=>{const st=snapOf(B);return st?Math.round(v/st)*st:v};
const sizeTxt=o=>{const a=aabb(o),f=v=>typeof fmtLen==='function'?fmtLen(v):fmt(v)+' mm';return`${f(a.mx[0]-a.mn[0])} × ${f(a.mx[2]-a.mn[2])} × ${f(a.mx[1]-a.mn[1])}`};
// tagidagi eng baland detal ustki sathi (X–Z izi kesishsa), aks holda yer (0)
function stackY(o){const a=aabb(o);let top=0;for(const q of items(B)){if(q===o||q.id===o.id)continue;const b=aabb(q);if(a.mn[0]<b.mx[0]-.5&&b.mn[0]<a.mx[0]-.5&&a.mn[2]<b.mx[2]-.5&&b.mn[2]<a.mx[2]-.5)top=Math.max(top,b.mx[1])}return top}const AX=[['x','X (chap ↔ o\'ng)'],['y','Y (past ↕ yuqori)'],['z','Z (old ↔ orqa)']];
function nextId(B){let n=0;for(const o of items(B))n=Math.max(n,+o.id.slice(1)||0);return'i'+(n+1)}
T.panel=(B,D)=>{const L=items(B);if(SEL&&!L.find(o=>o.id===SEL))SEL=null;const s=SEL&&L.find(o=>o.id===SEL);
 const q=LIBQ.trim().toLowerCase(),kinds=q?Object.keys(KIND).filter(k=>(KIND[k].n+' '+((GLOSS[KIND[k].g]||{}).en||'')).toLowerCase().includes(q)):(CATS.find(c=>c[0]===LIBCAT)||CATS[0])[2];
 const lib=`<div class="card"><h3>${IC('plus')} Detal qo'shish</h3><div class="ftabs">${CATS.map(([id,n,ks])=>`<button data-fcat="${id}" class="${!q&&LIBCAT===id?'on':''}">${esc(n)} <small>${ks.length}</small></button>`).join('')}</div>
 <div class="fsearch">${IC('search')}<input id="fSearch" type="search" placeholder="Detal qidirish: motor, shesterna, LED…" value="${esc(LIBQ)}"></div>
 <div class="flib">${kinds.length?kinds.map(k=>{const K=KIND[k];return`<button data-fadd="${k}" title="${esc(K.n)} — ${esc((GLOSS[K.g]||{}).w||'')}">${IC(K.ic)}<span>${esc(K.n)}</span></button>`}).join(''):'<p class="note" style="grid-column:1/-1">Hech narsa topilmadi.</p>'}</div></div>`;
 const G=L.filter(o=>o.goal),gp=G.filter(o=>o.placed).length,gb=G.filter(o=>B.inst[o.id]).length;
 const asm=G.length?`<div class="card fasm"><h3>${IC('wrench')} Yig'ish · ${gp}/${G.length}</h3><div class="fbar"><i style="width:${G.length?gp/G.length*100:0}%"></i><b style="width:${G.length?(gb-gp)/G.length*100:0}%"></b></div>
  <ol class="fsteps"><li class="${gb===G.length?'ok':''}"><b>1.</b> Har bir detalni <b>yasang</b> (yasash stolida qismlardan) — ${gb}/${G.length}</li><li class="${gp===G.length?'ok':''}"><b>2.</b> Stoldagi detalni sharpadek <b>burang</b> va <b>sudrab</b> joyiga olib boring — ${gp}/${G.length}</li><li><b>3.</b> «Simlar» bosqichida ulang va <b>shu yerda sinang</b></li></ol>
  <button class="btn ${PV.on?'on':''} pri" id="fPower" style="width:100%;margin-top:6px">${PV.on?`${IC('x')} Quvvatni o'chirish`:`${IC('bolt')} Shu yerda sinash`}</button></div>`:`<div class="card fasm"><button class="btn pri" id="fPower" style="width:100%">${PV.on?`${IC('x')} Quvvatni o'chirish`:`${IC('bolt')} Shu yerda sinash`}</button><p class="note" style="margin:6px 0 0">Quvvat yoqiladi: simi to'g'ri ulangan motorlar aylanadi, LEDlar yonadi.</p></div>`;
 const list=`<div class="card"><h3>${IC('layers')} Loyihadagi detallar · ${L.length}</h3>${L.length?`<div class="flist">${L.map(o=>`<button data-fsel="${o.id}" class="${o.id===SEL?'on':''}">${IC(KIND[o.kind].ic)}<span>${esc(KIND[o.kind].n)}</span><small class="${!B.inst[o.id]?'st0':o.goal&&!o.placed?'st1':'st2'}">${o.id} · ${!B.inst[o.id]?'yasalmagan':o.goal&&!o.placed?'stolda':o.goal?'o\'rnatilgan':'tayyor'}</small></button>`).join('')}</div>`:'<p class="note">Hali detal yo\'q. Yuqoridan qo\'shing.</p>'}</div>`;
 let ed='';if(s){const K=KIND[s.kind];
  const fld=f=>(f.type==='text'&&!['text','num'].includes(s.st)&&s.kind==='sticker')?'':f.type==='text'?`<div class="fld"><div class="fl"><span>${esc(f.l)}</span></div><input type="text" class="ftxt" data-fk="${f.k}" maxlength="${f.max}" value="${esc(s[f.k]||'')}" placeholder="Yozuvni kiriting"></div>`:f.type==='sel'?`<div class="fld"><div class="fl"><span>${esc(f.l)}</span></div><select data-fk="${f.k}">${Object.entries(f.o).map(([v,l])=>`<option value="${esc(v)}" ${String(s[f.k])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`
   :`<div class="fld"><div class="fl"><span>${esc(f.l)}</span><b><input class="fnum" type="number" data-fn="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${+(+s[f.k]).toFixed(f.step<1?1:0)}"> ${esc(f.u||'')}</b></div><input type="range" data-fk="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${s[f.k]}"></div>`;
  ed=`<div class="card"><h3>${IC(K.ic)} ${esc(K.n)} <small style="color:var(--mu);font-weight:400">${s.id}</small></h3>${K.f.map(fld).join('')}
  <div class="fld"><div class="fl"><span>${s.kind==='sticker'?'Fon rangi':'Rangi'}</span></div><input type="color" data-fk="col" value="${s.col||'#9e9e9e'}" style="width:54px;height:30px;border:0;background:none"></div>${s.kind==='sticker'?`<div class="fld"><div class="fl"><span>Yozuv rangi</span></div><input type="color" data-fk="tc" value="${s.tc||'#111111'}" style="width:54px;height:30px;border:0;background:none"></div>`:''}
  <div class="fsize">${IC('ruler')} O'lchami: <b>${sizeTxt(s)}</b> · og'irligi <b>${fmt(weight(s),weight(s)<10?1:0)} g</b></div>
  <h3 style="margin-top:8px;display:flex;align-items:center;gap:6px">${IC('pin')} Joyi (mm)<label class="fsnap" title="Surganda joy shu qadamga yaxlitlanadi (Tinkercad dagi kabi)">To'r <select id="fSnap">${[0,1,5,10].map(v=>`<option value="${v}" ${snapOf(B)===v?'selected':''}>${v?v+' mm':"o'chiq"}</option>`).join('')}</select></label></h3>
  ${AX.map(([a,l])=>`<div class="fld"><div class="fl"><span>${l}</span><b><input class="fnum" type="number" data-fn="${a}" min="${a==='y'?-50:-400}" max="${a==='y'?500:400}" step="${snapOf(B)||1}" value="${+(+s[a]).toFixed(1)}"> mm</b></div><input type="range" data-fk="${a}" min="${a==='y'?-50:-400}" max="${a==='y'?500:400}" step="${snapOf(B)||1}" value="${s[a]}"></div>`).join('')}
  <div class="ftools"><button class="btn sm" id="fGround" title="Detalning eng past nuqtasini yerga (Y = 0) tushiradi">${IC('down')} Yerga qo'yish</button><button class="btn sm" id="fStack" title="Ostidagi eng baland detal ustiga qo'yadi">${IC('layers')} Ustiga qo'yish</button><button class="btn sm" id="fCenter" title="X va Z ni 0 ga — modelning o'rtasiga">${IC('target')} O'rtaga</button></div>
  <p class="note" style="margin:4px 0 0">Blender kabi: <b>G</b> — surish, <b>R</b> — burish, <b>S</b> — o'lcham, keyin <b>X/Y/Z</b> va raqam, <b>Enter</b>. Shift+D — nusxa. Strelkalar, PgUp/PgDn — surish, Delete — o'chirish.</p>
  <h3 style="margin-top:8px;display:flex;align-items:center;gap:6px">${IC('cw')} Burilish${s.goal&&!s.placed&&B.inst[s.id]?`<span class="frot ${sameRot(s,s.goal)?'ok':''}">${sameRot(s,s.goal)?'to\'g\'ri':'sharpadek emas'}</span>`:''}</h3>
  <div class="ftools" style="margin:0 0 6px">${['x','y','z'].map(a=>`<button class="btn sm" data-rot="r${a}" title="${a.toUpperCase()} o'qi atrofida 90° burish (klaviatura: ${({x:'Shift+X',y:'Shift+Y',z:'Shift+Z'})[a]})">${IC('cw')} ${a.toUpperCase()} +90°</button>`).join('')}</div><div class="grid2" style="grid-template-columns:repeat(3,1fr)">${['rx','ry','rz'].map((a,i)=>`<div class="fld"><div class="fl"><span>${'XYZ'[i]} o'qi</span></div><select data-fk="${a}">${Object.entries(ROT).map(([v,l])=>`<option value="${v}" ${+s[a]===+v?'selected':''}>${l}</option>`).join('')}</select></div>`).join('')}</div>
  <div class="row" style="margin:10px 0 4px;flex-wrap:wrap">${B.inst[s.id]?'':`<button class="btn pri" id="fForge">${IC('wrench')} Yasash</button>`}${s.goal&&!s.placed&&B.inst[s.id]?`<button class="btn" id="fGoal" title="Kamerani bu detal o'rnatiladigan joyga buradi">${IC('target')} Joyini ko'rsat</button>`:''}<button class="btn" id="fDup" title="Yonma-yon nusxa">${IC('layers')} Nusxa</button><button class="btn" id="fMirX" title="X o'qiga nisbatan ko'zgu nusxa: chapdagi detal o'ngda paydo bo'ladi">${IC('explode')} Ko'zgu (X)</button><button class="btn" id="fMirZ" title="Z o'qiga nisbatan ko'zgu nusxa: oldidagi detal orqada paydo bo'ladi">${IC('explode')} Ko'zgu (Z)</button><button class="btn danger" id="fDel">${IC('x')} O'chirish</button></div></div>`}
 const sum=`<div class="card"><h3>${IC('chart')} Hisob</h3><div class="info" style="border:0"><span>Og'irlik</span><b>${fmt(D.AUW)} g</b><span>Kuchlanish</span><b>${D.V?fmt(D.V,1)+' V':'—'}</b><span>Tok</span><b>${fmt(D.I,2)} A</b><span>Ishlash vaqti</span><b>${runTxt(D)}</b>${D.lift?`<span>Tortish/og'irlik</span><b>${fmt(D.twr,2)} : 1 ${D.canFly?IC('ok'):''}</b>`:''}${D.driven?`<span>Tezlik</span><b>${fmt(D.vWheel*3.6,1)} km/soat</b>`:''}</div></div>`;
 return (G.length&&gp<G.length?asm+lib:lib+asm)+list+ed+sum+`<h3 style="font-size:13px;font-weight:600;margin:6px 0 6px"><i class=i-warn></i> Tekshiruv natijasi</h3><div id="stepIssues">${issuesHTML(true)}</div>`};
T.bindPanel=P=>{const L=()=>items(B);
 P.querySelectorAll('[data-fadd]').forEach(b=>b.onclick=()=>{pushUndo();if(!B.p.free)B.p.free={items:[]};const id=nextId(B),k=b.dataset.fadd,n=L().length;const o=Object.assign({id},it(k,(n%5-2)*40,0,(Math.floor(n/5)%3-1)*40));o.y=+(stackY(o)-aabb(o).mn[1]).toFixed(1);
  B.p.free.items.push(o);SEL=id;saveLocal();rebuild();snd('click');if(window.FORGE)FORGE.start(id);else{B.inst[id]=true;commit()}});
 P.querySelectorAll('[data-fcat]').forEach(b=>b.onclick=()=>{LIBCAT=b.dataset.fcat;LIBQ='';snd('click');renderPanel()});
 {const fs=P.querySelector('#fSearch');if(fs){fs.oninput=()=>{LIBQ=fs.value;const pos=fs.selectionStart;renderPanel();const n=document.getElementById('fSearch');if(n){n.focus();n.setSelectionRange(pos,pos)}}}}
 {const pw=P.querySelector('#fPower');if(pw)pw.onclick=()=>pvToggle()}
 P.querySelectorAll('[data-fsel]').forEach(b=>b.onclick=()=>{SEL=b.dataset.fsel===SEL?null:b.dataset.fsel;snd('click');renderPanel()});
 const s=SEL&&L().find(o=>o.id===SEL);if(!s)return;
 P.querySelectorAll('[data-fk]').forEach(inp=>{const k=inp.dataset.fk;inp.addEventListener('pointerdown',()=>pushUndo());
  if(inp.type==='range'){inp.oninput=()=>{s[k]=AX.some(x=>x[0]===k)?snapV(+inp.value):+inp.value;const v=P.querySelector(`[data-fn="${k}"]`);if(v)v.value=s[k];scheduleRebuild(false)};inp.onchange=()=>{saveLocal();renderPanel()}}
  else if(inp.type==='color'){inp.oninput=()=>{s[k]=inp.value;scheduleRebuild(false)};inp.onchange=()=>saveLocal()}
  else if(inp.type==='text'){inp.oninput=()=>{s[k]=inp.value.slice(0,24);scheduleRebuild(false)};inp.onchange=()=>{pushUndo();saveLocal();renderPanel()}}
  else inp.onchange=()=>{pushUndo();const v=inp.value;s[k]=['rx','ry','rz'].includes(k)?+v:(typeof KIND[s.kind].def[k]==='number'?+v:v);if(['rx','ry','rz'].includes(k)&&s.goal&&!s.placed){ground(s);trySnap(s)}cleanup();commit()}});
 P.querySelectorAll('[data-fn]').forEach(inp=>{inp.onchange=()=>{const k=inp.dataset.fn,v=+inp.value;if(!isFinite(v))return;pushUndo();s[k]=clamp(v,+inp.min,+inp.max);if(AX.some(x=>x[0]===k))trySnap(s);cleanup();commit()};inp.onkeydown=e=>{if(e.key==='Enter')inp.blur()}});
 const g=id=>P.querySelector('#'+id);
 g('fSnap').onchange=()=>{B.p.free.snap=+g('fSnap').value;saveLocal();renderPanel()};
 const move=(f)=>{pushUndo();f(s);commit();snd('place')};
 g('fGround').onclick=()=>move(o=>{o.y=+(o.y-aabb(o).mn[1]).toFixed(1)});g('fStack').onclick=()=>move(o=>{o.y=+(o.y+stackY(o)-aabb(o).mn[1]).toFixed(1)});g('fCenter').onclick=()=>move(o=>{o.x=0;o.z=0});
 const mirror=ax=>{pushUndo();const id=nextId(B),o=Object.assign({},s,{id,goal:null,placed:false});o[ax]=-s[ax];if(ax==='x'){o.ry=(360-s.ry)%360;o.rz=(360-s.rz)%360}else{o.rx=(360-s.rx)%360;o.ry=(180-s.ry+360)%360}
  if(Math.abs(o[ax])<1)o[ax]=s[ax]+30;B.p.free.items.push(o);B.inst[id]=!!B.inst[s.id];SEL=id;commit();snd('click')};
 if(g('fGoal'))g('fGoal').onclick=()=>{const a=aabb(Object.assign({},s,s.goal)),dy=model?model.position.y:0;orb.tg.set((a.mn[0]+a.mx[0])/20,(a.mn[1]+a.mx[1])/20+dy,(a.mn[2]+a.mx[2])/20);orb.tr=clamp(Math.max(a.mx[0]-a.mn[0],a.mx[1]-a.mn[1],a.mx[2]-a.mn[2])/10*4+15,20,200);snd('click')};
 const rot90=k=>{pushUndo();s[k]=((+s[k]||0)+90)%360;if(s.goal&&!s.placed){ground(s);trySnap(s)}commit();snd('flip')};
 P.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>rot90(b.dataset.rot));T._rot90=rot90;
 g('fMirX').onclick=()=>mirror('x');g('fMirZ').onclick=()=>mirror('z');
 if(g('fForge'))g('fForge').onclick=()=>FORGE.start(s.id);
 g('fDup').onclick=()=>{pushUndo();const id=nextId(B),o=Object.assign({},s,{id,x:s.x+30,goal:null,placed:false});B.p.free.items.push(o);B.inst[id]=!!B.inst[s.id];SEL=id;commit();snd('click')};
 g('fDel').onclick=()=>{pushUndo();B.p.free.items=L().filter(o=>o.id!==s.id);delete B.inst[s.id];for(const k of[s.id+'+',s.id+'-'])delete B.wires[k];SEL=null;commit();snd('place')}};
T.pick=slot=>{SEL=slot;snd('click');renderPanel()};
// yig'ish: yasalgan shablon detali modelning yonidagi "stol"ga qo'yiladi — uni o'zingiz sudrab o'z joyiga o'rnatasiz
const goalBox=L=>{const g=L.filter(o=>o.goal).map(o=>aabb(Object.assign({},o,o.goal)));if(!g.length)return null;return{mn:[0,1,2].map(k=>Math.min(...g.map(a=>a.mn[k]))),mx:[0,1,2].map(k=>Math.max(...g.map(a=>a.mx[k])))}};
function trayPlace(o){const L=items(B),gb=goalBox(L),x0=gb?gb.mx[0]+45:120;const others=L.filter(q=>q!==o&&B.inst[q.id]&&!(q.goal&&q.placed)).map(aabb).concat(L.filter(q=>q.goal).map(q=>aabb(Object.assign({},q,q.goal))));
 for(let col=0;col<6;col++)for(let row=0;row<8;row++){const t=Object.assign({},o,{x:Math.min(390,x0+col*55),z:-170+row*50});t.y=+(t.y-aabb(t).mn[1]).toFixed(1);const a=aabb(t);
  if(a.mx[0]>400)continue;if(!others.some(b=>touch(a,b,4))){o.x=t.x;o.y=t.y;o.z=t.z;return}}o.x=Math.min(390,x0);o.y=+(o.y-aabb(o).mn[1]).toFixed(1);o.z=-170}
// simmetriya: [mahalliy o'q, 2 = ikki tomonlama (teskarisi ham bir xil), 1 = bir tomonlama]; 'all' — har qanday burilish teng
const SYM={tube:['y',2],axle:['x',2],beam:['x',2],wheel:['x',2],gear:['y',2],prop:['y',1],led:['y',1],buzzer:['y',1],bldc:['y',1],dcmotor:['y',1],btn:['y',1],pot:['y',1],ldr:['y',1]};
const qOf=r=>new THREE.Quaternion().setFromEuler(new THREE.Euler(r.rx*DEG,r.ry*DEG,r.rz*DEG));
function sameRot(o,g){const q1=qOf(o),q2=qOf(g);if(Math.abs(q1.dot(q2))>.999)return true;if(o.kind==='sphere'&&!+o.half)return true;const sy=SYM[o.kind];if(!sy)return false;
 const ax={x:new V3(1,0,0),y:new V3(0,1,0),z:new V3(0,0,1)}[sy[0]],a=ax.clone().applyQuaternion(q1),b=ax.clone().applyQuaternion(q2),d=a.dot(b);return sy[1]===2?Math.abs(d)>.99:d>.99}
// stoldagi burilish: maqsaddan farqli, lekin 90° li qadamlar bilan topsa bo'ladigan
function trayRot(o){const g=o.goal,opts=[{rx:0,ry:0,rz:0},{rx:0,ry:90,rz:0},{rx:90,ry:0,rz:0},{rx:0,ry:0,rz:90},{rx:0,ry:180,rz:0},{rx:270,ry:0,rz:0}],start=(o.id.charCodeAt(o.id.length-1)+o.kind.length)%opts.length;
 for(let k=0;k<opts.length;k++){const r=opts[(start+k)%opts.length];if(!sameRot(Object.assign({},o,r),g))return r}return{rx:g.rx,ry:g.ry,rz:g.rz}}
const ground=o=>{o.y=+(o.y-aabb(o).mn[1]).toFixed(1)};
T.onInstall=slot=>{const o=items(B).find(x=>x.id===slot);if(!o||!o.goal||o.placed)return;Object.assign(o,trayRot(o));trayPlace(o);SEL=o.id;
 setTimeout(()=>{if(typeof toast==='function')toast(`${IC('pointer')} ${esc(KIND[o.kind].n)} stolga qo'yildi. Sharpaga qarab uni to'g'ri <b>buring</b> (X/Y/Z +90°) va sudrab joyiga olib boring`,4200)},700)};
// sudrab qo'yilganda: maqsadga 12 mm gacha yaqin bo'lsa — joyiga "chiq" etib tushadi (ostidagi detal o'rnatilgan bo'lishi shart)
function trySnap(o){if(!o.goal||o.placed)return false;const d=Math.hypot(o.x-o.goal.x,o.z-o.goal.z);if(d>12)return false;
 if(!sameRot(o,o.goal)){const up=axisUp(o),gu=axisUp(Object.assign({},o,o.goal)),dir=v=>Math.abs(v.y)>.7?(v.y>0?'yuqoriga':'pastga'):Math.abs(v.x)>.7?(v.x>0?"o'ngga":'chapga'):(v.z<0?'oldinga':'orqaga');
  toast(`${IC('warn')} Joyi to'g'ri, lekin <b>burilishi noto'g'ri</b>: hozir ${dir(up)} qaragan, ${dir(gu)}${dir(up)===dir(gu)?' — o\'z o\'qi atrofida ham burish kerak':''} qarashi kerak. «Burilish» tugmalaridan foydalaning`,3800);snd('err');return false}
 const placed=items(B).filter(q=>q.goal&&q.placed&&q!==o),test=Object.assign({},o,o.goal),fl=floating(placed.concat([test]));
 if(fl.includes(test)){const under=items(B).filter(q=>q.goal&&!q.placed&&q!==o&&touch(aabb(test),aabb(Object.assign({},q,q.goal)))).map(q=>KIND[q.kind].n);
  toast(`${IC('warn')} Avval ostidagi detalni o'rnating${under.length?': '+esc(under.slice(0,2).join(', ')):''}`,2600);snd('err');return false}
 Object.assign(o,o.goal);o.placed=true;snd('screw');setTimeout(()=>snd('ok'),160);burst(o);const L=items(B).filter(q=>q.goal),n=L.filter(q=>q.placed).length;
 toast(`${IC('ok')} ${esc(KIND[o.kind].n)} o'rnatildi · ${n}/${L.length}${n===L.length?" — yig'ish tugadi! Endi simlang va «Shu yerda sinash» ni bosing":''}`,2600);return true}
// o'rnatilganda halqa to'lqini (effekt)
const FX=[];function burst(o){const a=aabb(o),dy=model?model.position.y:0,c=new V3((a.mn[0]+a.mx[0])/20,a.mn[1]/10+dy+.05,(a.mn[2]+a.mx[2])/20),r0=Math.max(a.mx[0]-a.mn[0],a.mx[2]-a.mn[2])/20;
 for(let k=0;k<2;k++){const m=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),new THREE.MeshBasicMaterial({color:k?'#2fcf7a':'#ffc24a',transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.copy(c);m.renderOrder=25;scene.add(m);FX.push({m,t:-k*.12,r0:Math.max(.6,r0)})}}
// ---------- shu yerda sinash: quvvatni yoqib, motorlar aylanishi, LEDlar yonishi, buzzer ovozi ----------
const PV={on:false,wc:null,beep:0};
function pvToggle(on){PV.on=on==null?!PV.on:on;if(PV.on){PV.wc=wcheck(B);const L=items(B),srcOk=!!PV.wc.works.xt60,es=L.filter(o=>o.kind==='esc');PV.ok={};
  for(const o of L)PV.ok[o.id]=srcOk&&(!o.goal||o.placed)&&(KIND[o.kind].el!==1||!!PV.wc.works['c'+o.id]);L.filter(o=>o.kind==='bldc').forEach((m,i)=>{PV.ok[m.id]=PV.ok[m.id]&&!!es[i]&&PV.ok[es[i].id]});
  const bad=L.filter(o=>KIND[o.kind].el===1&&!PV.ok[o.id]);snd('click');
  if(!srcOk)toast(`${IC('warn')} Manba ulanmagan: batareya yoki quyosh panelini «Simlar» bosqichida shinaga ulang`,3200);
  else if(bad.length)toast(`${IC('warn')} Ishlamaydi: ${esc(bad.slice(0,3).map(o=>KIND[o.kind].n+' ('+o.id+')').join(', '))} — o'rnatilmagan yoki simi ulanmagan`,3400);
  else toast(`${IC('ok')} Quvvat yoqildi — hammasi ishlayapti`,2000);humSet(srcOk&&L.some(o=>(o.kind==='dcmotor'||o.kind==='bldc')&&PV.ok[o.id]),.5)}
 else{humSet(false);rebuild()}const b=document.getElementById('fPower');if(b){b.classList.toggle('on',PV.on);b.innerHTML=PV.on?`${IC('x')} Quvvatni o'chirish`:`${IC('bolt')} Shu yerda sinash`}}
function pvTick(dt){if(!PV.on||!model)return;if(!selActive()){pvToggle(false);return}const D=TYPES.free.derive(B);
 model.traverse(m=>{const u=m.userData;if(u.fspin){const p=D.props.find(x=>x.o.id===u.fspin);if(p&&p.motor&&PV.ok[p.motor.o.id])m.rotation.y+=dt*Math.min(60,p.rpm/60*2*Math.PI*.15)}
  if(u.fwheel){const w=D.wheels.find(x=>x.o.id===u.fwheel);if(w&&w.motor&&PV.ok[w.motor.o.id])m.rotation.x+=dt*6}
  if(u.fled){const lit=!!PV.ok[u.fledId];m.material=lit?mGlow(u.fled):m.material;ledHalo(m,lit)}});
 // vertikal motor valiga o'tirgan detallar (platforma, gumbaz) — motor bilan birga aylanadi (karusel, aylanma stol)
 for(const q of D.motors){if(!PV.ok[q.o.id]||D.props.some(p=>p.motor===q)||D.wheels.some(w=>w.motor===q))continue;const up=axisUp(q.o);if(Math.abs(up.y)<.9)continue;const ma=aabb(q.o),top=up.y>0?ma.mx[1]:ma.mn[1],w=Math.min(8,q.rpm0/q.gear/60*2*Math.PI);
  for(const o of items(B)){if(o===q.o)continue;const a=aabb(o),cx=(a.mn[0]+a.mx[0])/2,cz=(a.mn[2]+a.mx[2])/2;if(Math.hypot(cx-q.o.x,cz-q.o.z)>15)continue;if(up.y>0?a.mn[1]<top-2:a.mx[1]>top+2)continue;const ob=modelObjs[o.id];if(ob)ob.rotation.y+=dt*w*Math.sign(up.y)}}
 if(items(B).some(o=>o.kind==='buzzer'&&PV.ok[o.id])){PV.beep-=dt;if(PV.beep<=0){PV.beep=.8;snd('ok',.35)}}}
let CLIP=null;
addEventListener('keydown',e=>{if(!B||B.type!=='free'||typeof step!=='function'||step().kind!=='custom'||(typeof modOn==='function'&&modOn()))return;const t=e.target;if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable||e.altKey)return;
 // Ctrl+C / Ctrl+V / Ctrl+D — nusxa olish, qo'yish, takrorlash (Tinkercad dagi kabi)
 if(e.ctrlKey||e.metaKey){const cur=SEL&&items(B).find(o=>o.id===SEL);
  if(e.code==='KeyC'&&cur){CLIP=JSON.parse(JSON.stringify(cur));if(typeof toast==='function')toast(`${IC('clipboard')} Nusxa olindi: ${esc(KIND[cur.kind].n)}`,1400);return}
  if((e.code==='KeyV'&&CLIP)||(e.code==='KeyD'&&cur)){e.preventDefault();const src=e.code==='KeyV'?CLIP:cur;pushUndo();const id=nextId(B),o=Object.assign({},src,{id,goal:null,placed:false,x:clamp(src.x+20,-400,400),z:clamp(src.z+20,-400,400)});
   B.p.free.items.push(o);B.inst[id]=src===CLIP?true:!!B.inst[cur.id];SEL=id;if(e.code==='KeyV')CLIP=Object.assign({},o);commit();snd('click');return}
  if(e.code==='KeyA'){e.preventDefault();return}return}
 if(e.key==='Escape'&&SEL){SEL=null;renderPanel();return}if(!SEL)return;
 if(e.shiftKey&&['KeyX','KeyY','KeyZ'].includes(e.code)&&T._rot90){e.preventDefault();e.stopImmediatePropagation();T._rot90('r'+e.code.slice(3).toLowerCase());return}
 const s=items(B).find(o=>o.id===SEL);if(!s)return;const st=(snapOf(B)||1)*(e.shiftKey?10:1),M={ArrowLeft:['x',-st],ArrowRight:['x',st],ArrowUp:['z',-st],ArrowDown:['z',st],PageUp:['y',st],PageDown:['y',-st]}[e.key];
 if(M){e.preventDefault();pushUndo();s[M[0]]=clamp(+(s[M[0]]+M[1]).toFixed(1),M[0]==='y'?-50:-400,M[0]==='y'?500:400);trySnap(s);commit();return}
 if(e.key==='Delete'){e.preventDefault();const b=document.getElementById('fDel');if(b)b.click()}});
{const st=document.createElement('style');st.textContent=`.flib{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.flib button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border:1px solid var(--ln);border-radius:10px;font-size:11px;color:var(--tx2);text-align:center}.flib button:hover{border-color:var(--ln2);background:var(--p3);color:var(--tx)}.flib i{width:18px;height:18px}
.ftabs{display:flex;gap:4px;margin:2px 0 8px}.ftabs button{flex:1;padding:6px 4px;border:1px solid var(--ln);border-radius:8px;font-size:12px;color:var(--tx2)}.ftabs button small{color:var(--mu);font-size:10px}.ftabs button.on{border-color:var(--ac);background:var(--ac-soft);color:var(--tx)}
.fsearch{display:flex;align-items:center;gap:6px;border:1px solid var(--ln);border-radius:8px;padding:0 8px;margin-bottom:8px}.fsearch input{flex:1;background:none;border:0;outline:0;color:var(--tx);padding:7px 0;font-size:12.5px}.fsearch i{width:14px;height:14px;color:var(--mu)}
.fnum{width:64px;background:var(--p3,#151b24);border:1px solid var(--ln);border-radius:6px;color:var(--tx);font:inherit;font-size:12px;padding:2px 5px;text-align:right}.fnum:focus{border-color:var(--ac);outline:0}
.fsize{margin:8px 0 2px;padding:7px 9px;border:1px dashed var(--ln2);border-radius:8px;font-size:12px;color:var(--tx2)}.fsize b{color:#ffd58a}.fsize i{width:13px;height:13px}
.fsnap{margin-left:auto;font-size:11.5px;font-weight:500;color:var(--mu);display:flex;align-items:center;gap:5px}.fsnap select{padding:2px 4px;font-size:11.5px}
.ftools{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.ftools .btn{flex:1;min-width:0;font-size:11.5px;padding:6px 6px}
.frot{margin-left:auto;font-size:11px;font-weight:600;padding:2px 7px;border-radius:6px;background:rgba(255,194,74,.16);color:#ffc24a}.frot.ok{background:rgba(47,207,122,.16);color:#7be8a9}.fasm h3{margin-bottom:6px}.fbar{position:relative;height:8px;border-radius:5px;background:var(--p3,#151b24);overflow:hidden;display:flex}.fbar i{display:block;height:100%;background:linear-gradient(90deg,#2fcf7a,#7be8a9);transition:width .4s}.fbar b{display:block;height:100%;background:rgba(255,194,74,.55);transition:width .4s}
.fsteps{margin:8px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--tx2)}.fsteps li{padding:6px 8px;border:1px solid var(--ln);border-radius:8px}.fsteps li.ok{border-color:rgba(47,207,122,.45);color:#bff3d6}.fsteps li b{color:var(--tx)}
#fPower.on{background:#c62828;border-color:#c62828}.flist small.st0{color:var(--mu)}.flist small.st1{color:#ffc24a}.flist small.st2{color:#7be8a9}
.flist{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto}.flist button{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--ln);border-radius:9px;text-align:left;font-size:12px}.flist button span{flex:1}.flist button small{color:var(--mu);font-size:10.5px}.flist button.on{border-color:var(--ac);background:var(--ac-soft)}.flist i{width:15px;height:15px}`;document.head.appendChild(st)}

// ---------- sinov ----------
T.startTitle='Sinovga tayyor';T.startNote="<b>Boshlash</b> — quvvat yoqiladi: motorlar aylanadi, LEDlar yonadi. Uchadigan bo'lsa: <b>W/S</b> — yuqoriga/pastga, strelkalar — harakat. G'ildirakli bo'lsa: <b>W/S</b> — yurish, <b>A/D</b> — burilish.";
T.linkMsg=()=>"Batareya quvvat shinasiga ulanmagan.";T.armMsg=S=>S.fmode==='fly'?"Uchishga tayyor: W — ko'tarilish":S.fmode==='drive'?"W/S — yurish, A/D — burilish":"Quvvat yoqildi";
// yonib turgan LED atrofidagi yorug'lik doirasi (qo'shiluvchi aralashtirish) — haqiqiy chiroq kabi
const haloTex=ctex('halo',128,128,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.18,'rgba(255,255,255,.55)');r.addColorStop(.5,'rgba(255,255,255,.12)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
function ledHalo(l,on){let h=l.userData.halo;if(!h&&on){h=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex,color:l.userData.fled,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));h.renderOrder=30;l.add(h);l.userData.halo=h}
 if(h){h.visible=on;if(on){const k=(l.userData.fledK||1),t=performance.now()/1000;h.scale.setScalar((2.4+.12*Math.sin(t*9))*k/Math.max(.001,l.scale.x));h.material.opacity=.85}}}
T.simInit=(S,B,WC)=>{const D=S.D;S.pos.set(0,0,6);S.yaw=0;S.fmode=D.canFly?'fly':D.driven?'drive':'demo';S.link=!!WC.works.xt60;S.st='on';S.vy=0;S.vh=new V3();S.spd=0;
 S.ok={};for(const o of items(B))S.ok[o.id]=(!o.goal||o.placed)&&(KIND[o.kind].el!==1||!!WC.works['c'+o.id]);
 const es=items(B).filter(o=>o.kind==='esc');items(B).filter(o=>o.kind==='bldc').forEach((m,i)=>{S.ok[m.id]=S.ok[m.id]&&!!es[i]&&S.ok[es[i].id]});S.beep=0;S.fx={sp:[],wh:[],led:[]};
 S.model.traverse(o=>{if(o.userData.fspin)S.fx.sp.push(o);if(o.userData.fwheel)S.fx.wh.push(o);if(o.userData.fled)S.fx.led.push(o)})};
T.simTick=(S,dt,I)=>{const D=S.D,B=S.B,g=9.81,soc=D.solar?1:D.mah?Math.max(0,1-S.used/D.mah):0,on=S.armed&&soc>0;S.st=on?'on':'off';
 const motorOk=q=>on&&q&&S.ok[q.o.id];
 for(const sp of S.fx.sp){const p=D.props.find(x=>x.o.id===sp.userData.fspin);if(p&&motorOk(p.motor))sp.rotation.y+=dt*Math.min(60,p.rpm/60*2*Math.PI*.15)}
 for(const wh of S.fx.wh){const w=D.wheels.find(x=>x.o.id===wh.userData.fwheel);if(w&&w.motor&&motorOk(w.motor))wh.rotation.x+=dt*S.spd/Math.max(.01,w.o.d/2000)}
 for(const l of S.fx.led){const o=items(B).find(x=>x.id===l.userData.fledId);const lit=on&&o&&S.ok[o.id];ledHalo(l,lit);l.material=lit?mGlow(l.userData.fled):MAT('fledoff'+l.userData.fled,()=>new THREE.MeshPhysicalMaterial({color:l.userData.fled,transparent:true,opacity:.75,roughness:.15}))}
 // buzzer: quvvat bo'lsa har 0,8 s da qisqa signal
 if(on&&items(B).some(o=>o.kind==='buzzer'&&S.ok[o.id])){S.beep-=dt;if(S.beep<=0){S.beep=.8;snd('ok',.35)}}
 if(S.fmode==='fly'&&on){const want=((I.thrUp?1:0)-(I.thrDn?1:0))*2.5,a=(want-S.vy)*3;S.vy+=a*dt;if(S.pos.y<=0&&S.vy<0)S.vy=0;
  const fwd=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw)),rt=new V3(-fwd.z,0,fwd.x);S.vh.addScaledVector(fwd,I.pitch*4*dt).addScaledVector(rt,I.roll*4*dt).multiplyScalar(1-dt*.8);S.yaw+=I.yaw*1.5*dt;
  if(D.cgOff>15&&S.pos.y>.3&&!S.fail){S.roll+=dt*.8;if(Math.abs(S.roll)>1)crash(S,`Ag'darildi: og'irlik markazi parraklar markazidan ${fmt(D.cgOff)} mm siljigan.`)}else{S.pitch=-I.pitch*.15;S.roll=-I.roll*.15}
  S.pos.y+=S.vy*dt;S.pos.addScaledVector(S.vh,dt);if(S.pos.y<0){S.pos.y=0;if(S.vy<-3&&!S.fail)crash(S,'Qattiq qo\'ndi.')}}
 else if(S.fmode==='fly'){S.vy-=g*dt;S.pos.y=Math.max(0,S.pos.y+S.vy*dt);if(S.pos.y===0){if(S.vy<-4&&!S.fail)crash(S,'Quvvat o\'chdi — qurilma qulab tushdi.');S.vy=0}}
 if(S.fmode==='drive'){const f=on?(I.thrUp?1:0)-(I.thrDn?1:0):0,t=on?(KEYS.KeyA||KEYS.ArrowLeft?1:0)-(KEYS.KeyD||KEYS.ArrowRight?1:0):0;const allOk=D.wheels.filter(w=>w.motor).every(w=>S.ok[w.motor.o.id]);
  S.spd+=((allOk?f*D.vWheel:0)-S.spd)*Math.min(1,dt*3);S.yaw+=t*1.6*dt*(Math.abs(S.spd)>.02||f===0?1:0);const dir=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw));S.vel.copy(dir).multiplyScalar(S.spd);S.pos.addScaledVector(S.vel,dt);S.pos.y=0}
 else S.vel.set(S.vh?S.vh.x:0,S.vy||0,S.vh?S.vh.z:0);
 const I_A=on?D.I:0;S.amp=I_A;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.volt=D.V;if(S.armed&&soc<=0){S.armed=false;S.status='Batareya tugadi.'}
 humSet(on&&D.motors.length>0,.6)};
// ---------- Tinkercad uslubida: 3D'da tanlash, sichqoncha bilan surish, ko'tarish konusi ----------
// Detalni bosib ushlab suring — u yer tekisligi bo'ylab (to'r qadami bilan) siljiydi. Tepadagi konusni tortsangiz — balandligi o'zgaradi.
// Tanlangan detal atrofida punktir quti, burchak tutqichlari va yerdagi izi ko'rinadi.
const SV={grp:null,line:null,hs:[],lift:null,foot:null,lbl:null,key:'',drag:null};
const selActive=()=>B&&B.type==='free'&&typeof step==='function'&&step().kind==='custom'&&!(window.FORGE&&FORGE.active)&&!insp&&explode<.01&&!(window.RULER&&RULER.active);
function svEnsure(){if(SV.grp)return;const g=new THREE.Group();SV.grp=g;scene.add(g);
 const hm=new THREE.MeshBasicMaterial({color:'#ffffff',depthTest:false}),he=new THREE.LineBasicMaterial({color:'#11151c',depthTest:false});
 for(let i=0;i<8;i++){const h=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),hm);h.renderOrder=22;const e=new THREE.LineSegments(new THREE.EdgesGeometry(h.geometry),he);e.renderOrder=23;h.add(e);g.add(h);SV.hs.push(h)}
 const lf=new THREE.Group(),cone=new THREE.Mesh(new THREE.ConeGeometry(.5,1.1,24),new THREE.MeshBasicMaterial({color:'#1b1f26',depthTest:false}));cone.renderOrder=22;cone.position.y=.55;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.07,8,24),new THREE.MeshBasicMaterial({color:'#ffb020',depthTest:false}));ring.rotation.x=Math.PI/2;ring.renderOrder=23;lf.add(cone,ring);lf.userData.lift=true;g.add(lf);SV.lift=lf;
 const ft=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffb020',transparent:true,opacity:.16,depthWrite:false}));ft.rotation.x=-Math.PI/2;ft.renderOrder=2;g.add(ft);SV.foot=ft;
 SV.lbl=document.createElement('div');SV.lbl.className='fLbls';const v=$('view');if(v)v.appendChild(SV.lbl)}
function svBox(o){const a=aabb(o),dy=model?model.position.y:0;return{mn:new V3(a.mn[0]/10,a.mn[1]/10+dy,a.mn[2]/10),mx:new V3(a.mx[0]/10,a.mx[1]/10+dy,a.mx[2]/10)}}
let svLast=0;function svTick(t){requestAnimationFrame(svTick);const dt=Math.min(.05,(t-svLast)/1000||0);svLast=t;
 for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;if(f.t<0)continue;const k=f.t/.7;f.m.scale.setScalar(f.r0*(1+k*1.6));f.m.material.opacity=Math.max(0,1-k);if(k>=1){scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose();FX.splice(i,1)}}
 goalMat.opacity=.2+.14*Math.sin(t/260);pvTick(dt);const o=SEL&&selActive()&&items(B).find(x=>x.id===SEL);
 if(!o){if(SV.grp)SV.grp.visible=false;if(SV.lbl)SV.lbl.innerHTML='';return}svEnsure();if(SV.lbl&&!SV.lbl.isConnected&&$('view'))$('view').appendChild(SV.lbl);
 const{mn,mx}=svBox(o),sz=mx.clone().sub(mn),c=mn.clone().add(mx).multiplyScalar(.5),key=sz.toArray().map(v=>v.toFixed(2)).join(',');SV.grp.visible=true;
 if(key!==SV.key){SV.key=key;if(SV.line){SV.grp.remove(SV.line);SV.line.geometry.dispose()}const pad=.15,geo=new THREE.EdgesGeometry(new THREE.BoxGeometry(sz.x+pad,sz.y+pad,sz.z+pad)),
   ln=new THREE.LineSegments(geo,SV.lm||(SV.lm=new THREE.LineDashedMaterial({color:'#ffb020',dashSize:.5,gapSize:.35,depthTest:false,transparent:true})));ln.computeLineDistances();ln.renderOrder=21;SV.grp.add(ln);SV.line=ln}
 SV.line.position.copy(c);SV.lm.opacity=.65+.35*Math.sin(t/180);
 const k=Math.max(.15,camera.position.distanceTo(c)*.011);let i=0;for(const sx of[-1,1])for(const sy of[-1,1])for(const sz2 of[-1,1]){const h=SV.hs[i++];h.position.set(c.x+sx*(sz.x/2+.07),c.y+sy*(sz.y/2+.07),c.z+sz2*(sz.z/2+.07));h.scale.setScalar(k*.55)}
 SV.lift.position.set(c.x,mx.y+k*1.6,c.z);SV.lift.scale.setScalar(k*1.3);
 SV.foot.visible=mn.y>.25;SV.foot.position.set(c.x,.02,c.z);SV.foot.scale.set(sz.x,sz.z,1);
 // yorliq: surish paytida — koordinatalar, aks holda — o'lcham
 const p=new V3(c.x,mx.y,c.z).project(camera),r=$('view').getBoundingClientRect(),d=SV.drag;
 SV.lbl.innerHTML=p.z<1?`<div class="fLbl ${d?'next':''} svL" style="left:${(p.x+1)/2*r.width}px;top:${(1-p.y)/2*r.height-k*48}px">${d?(d.mode==='lift'?`Y ${fmt(o.y)} mm · yerdan ${fmt(Math.max(0,aabb(o).mn[1]))} mm`:`X ${fmt(o.x)} · Z ${fmt(o.z)} mm`):`${esc(KIND[o.kind].n)} · ${sizeTxt(o)}`}</div>`:''}
requestAnimationFrame(svTick);
function rayFrom(e){const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);return ray}
window.DRAGHOOK={
 down(e){if(!selActive()||!model)return false;const R=rayFrom(e);let mode=null,o=null;
  if(SV.grp&&SV.grp.visible&&SEL&&R.intersectObject(SV.lift,true).length){mode='lift';o=items(B).find(x=>x.id===SEL)}
  else{const hit=pickAt(e,model),id=hit&&hit.userData.slot;o=id&&items(B).find(x=>x.id===id);if(o&&!hit.userData.ghost)mode='move'}
  if(!o||!mode)return false;if(SEL!==o.id){SEL=o.id;renderPanel()}
  const dy=model.position.y,pl=new THREE.Plane(new V3(0,1,0),-(o.y/10+dy)),pt=new V3();if(!R.ray.intersectPlane(pl,pt))return false;
  pushUndo();SV.drag={mode,o,pl,off:new V3(o.x/10-pt.x,0,o.z/10-pt.z),y0:e.clientY,start:{x:o.x,y:o.y,z:o.z},moved:false};renderer.domElement.style.cursor=mode==='lift'?'ns-resize':'grabbing';return true},
 move(e){const d=SV.drag;if(!d)return;const o=d.o;
  if(d.mode==='lift'){const v=d.start.y+(d.y0-e.clientY)*orb.r*.016;o.y=clamp(+snapV(v).toFixed(1),-50,500)}
  else{const pt=new V3();if(!rayFrom(e).ray.intersectPlane(d.pl,pt))return;o.x=clamp(+snapV((pt.x+d.off.x)*10).toFixed(1),-400,400);o.z=clamp(+snapV((pt.z+d.off.z)*10).toFixed(1),-400,400)}
  if(o.x!==d.start.x||o.y!==d.start.y||o.z!==d.start.z)d.moved=true;
  const ob=modelObjs[o.id];if(ob){ob.userData.base.set(o.x/10,o.y/10,o.z/10)}},
 up(e){const d=SV.drag;SV.drag=null;renderer.domElement.style.cursor='';if(!d)return false;if(!d.moved){undoStack.pop();return false}if(!trySnap(d.o))snd('place');commit();return true}};
// ---------- Blender uslubidagi tahrirlash: G — surish, R — burish, S — o'lcham; X/Y/Z — o'q; raqam — aniq qiymat ----------
// Enter yoki sichqoncha chap tugmasi — tasdiqlash, Esc yoki o'ng tugma — bekor qilish. Shift+D — nusxa olib surish. Numpad . — tanlanganga yaqinlashish.
const MOD={m:null,mx:0,my:0,hud:null};
const modOn=()=>!!MOD.m;
function modHud(){if(!MOD.hud){MOD.hud=document.createElement('div');MOD.hud.className='bhud';}const v=$('view');if(v&&!MOD.hud.isConnected)v.appendChild(MOD.hud);const m=MOD.m;if(!m){MOD.hud.style.display='none';return}
 const o=m.o,ax=m.ax?`<b class="ax ax${m.ax}">${m.ax.toUpperCase()}</b>`:'<i>erkin</i>',num=m.num?`<span class="num">${esc(m.num)}</span>`:'';
 const val=m.kind==='g'?`X ${fmt(o.x)} · Y ${fmt(o.y)} · Z ${fmt(o.z)} mm`:m.kind==='r'?`X ${o.rx}° · Y ${o.ry}° · Z ${o.rz}°`:`× ${fmt(m.f||1,2)}`;
 MOD.hud.style.display='';MOD.hud.innerHTML=`<b>${({g:'Surish (G)',r:'Burish (R)',s:"O'lcham (S)"})[m.kind]}</b> · o'q: ${ax} ${num}<span class="v">${val}</span><small>X / Y / Z — o'q · raqam — aniq qiymat${m.kind==='g'?' (mm)':m.kind==='r'?' (gradus, 90° qadam)':' (marta)'} · Enter — tasdiqlash · Esc — bekor</small>`}
function modStart(kind){const o=SEL&&items(B).find(x=>x.id===SEL);if(!o||!selActive()||MOD.m||SV.drag)return false;pushUndo();
 const m={kind,o,start:JSON.parse(JSON.stringify(o)),ax:null,num:'',mx:MOD.mx,my:MOD.my,f:1};
 if(kind==='g'){const dy=model?model.position.y:0;m.pl=new THREE.Plane(new V3(0,1,0),-(o.y/10+dy));const pt=new V3();const r=renderer.domElement.getBoundingClientRect();
  if(rayFrom({clientX:MOD.mx||r.left+r.width/2,clientY:MOD.my||r.top+r.height/2}).ray.intersectPlane(m.pl,pt))m.hit0=pt.clone()}
 if(kind==='s'){const a=svBox(o),c=a.mn.clone().add(a.mx).multiplyScalar(.5).project(camera),r=renderer.domElement.getBoundingClientRect();m.cx=r.left+(c.x+1)/2*r.width;m.cy=r.top+(1-c.y)/2*r.height;m.d0=Math.max(20,Math.hypot(MOD.mx-m.cx,MOD.my-m.cy))}
 MOD.m=m;renderer.domElement.style.cursor=kind==='g'?'move':kind==='r'?'alias':'nwse-resize';snd('click');modHud();return true}
const SZK=o=>KIND[o.kind].f.filter(f=>!f.type&&f.u==='mm');
function modApply(e){const m=MOD.m;if(!m)return;const o=m.o,s0=m.start,n=m.num&&m.num!=='-'&&m.num!=='.'?+m.num:null;
 if(m.kind==='g'){for(const k of['x','y','z'])o[k]=s0[k];
  if(n!=null&&isFinite(n)){const a=m.ax||'x';o[a]=s0[a]+n}
  else if(e){if(m.ax==='y'){o.y=s0.y+(m.my-e.clientY)*orb.r*.016}else{const pt=new V3();if(m.hit0&&rayFrom(e).ray.intersectPlane(m.pl,pt)){const dx=(pt.x-m.hit0.x)*10,dz=(pt.z-m.hit0.z)*10;if(m.ax!=='z')o.x=s0.x+dx;if(m.ax!=='x')o.z=s0.z+dz}}}
  o.x=clamp(+snapV(o.x).toFixed(1),-400,400);o.y=clamp(+snapV(o.y).toFixed(1),-50,500);o.z=clamp(+snapV(o.z).toFixed(1),-400,400);const ob=modelObjs[o.id];if(ob)ob.userData.base.set(o.x/10,o.y/10,o.z/10)}
 else if(m.kind==='r'){const k='r'+(m.ax||'y');for(const a of['rx','ry','rz'])o[a]=s0[a];let deg=n!=null&&isFinite(n)?n:e?Math.round((e.clientX-m.mx)/70)*90:0;deg=Math.round(deg/90)*90;o[k]=((s0[k]+deg)%360+360)%360;scheduleRebuild(false)}
 else{let f=n!=null&&isFinite(n)&&n>0?n:e?Math.hypot(e.clientX-m.cx,e.clientY-m.cy)/m.d0:1;f=clamp(f,.1,10);m.f=f;
  for(const fd of SZK(o)){const ax=m.ax,map={x:['w','len','a','d'],y:['h','t'],z:['d']}[ax]||null;if(map&&!map.includes(fd.k))continue;o[fd.k]=clamp(+(Math.round(s0[fd.k]*f/fd.step)*fd.step).toFixed(2),fd.min,fd.max)}scheduleRebuild(false)}
 modHud()}
function modEnd(ok){const m=MOD.m;if(!m)return;MOD.m=null;renderer.domElement.style.cursor='';modHud();
 if(!ok){Object.assign(m.o,m.start);undoStack.pop();rebuild();snd('flip');return}
 const o=m.o;if(o.goal&&!o.placed){if(m.kind!=='g')ground(o);if(!trySnap(o))snd('place')}else snd('place');commit()}
addEventListener('pointermove',e=>{MOD.mx=e.clientX;MOD.my=e.clientY;if(MOD.m&&!MOD.m.num)modApply(e)},true);
renderer.domElement.addEventListener('pointerdown',e=>{if(!MOD.m)return;e.stopImmediatePropagation();e.preventDefault();modEnd(e.button===0)},true);
addEventListener('keydown',e=>{const t=e.target;if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable)return;
 const m=MOD.m;
 if(m){e.preventDefault();e.stopImmediatePropagation();const k=e.key;
  if(k==='Escape')return modEnd(false);if(k==='Enter'||k===' ')return modEnd(true);
  if(/^[xyzXYZ]$/.test(k)){const a=k.toLowerCase();m.ax=m.ax===a?null:a;modApply({clientX:MOD.mx,clientY:MOD.my});return}
  if(/^[0-9]$/.test(k)||k==='.'||k===','||k==='-'){m.num=(k==='-'?(m.num.startsWith('-')?m.num.slice(1):'-'+m.num):m.num+(k===','?'.':k));modApply(null);return}
  if(k==='Backspace'){m.num=m.num.slice(0,-1);modApply(m.num?null:{clientX:MOD.mx,clientY:MOD.my});return}
  if(/^[gGrRsS]$/.test(k)&&k.toLowerCase()!==m.kind){modEnd(true);modStart(k.toLowerCase())}return}
 if(!B||B.type!=='free'||!SEL||!selActive()||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.shiftKey&&e.code==='KeyD'){e.preventDefault();e.stopImmediatePropagation();const cur=items(B).find(o=>o.id===SEL);if(!cur)return;pushUndo();const id=nextId(B),o=Object.assign({},cur,{id,goal:null,placed:false});B.p.free.items.push(o);B.inst[id]=!!B.inst[cur.id];SEL=id;commit();undoStack.pop();modStart('g');return}
 if(e.shiftKey)return;const c={KeyG:'g',KeyR:'r',KeyS:'s'}[e.code];if(c){e.preventDefault();e.stopImmediatePropagation();modStart(c);return}
 if(e.code==='NumpadDecimal'){e.preventDefault();e.stopImmediatePropagation();const o=items(B).find(x=>x.id===SEL),a=svBox(o),sz=a.mx.clone().sub(a.mn);orb.tg.copy(a.mn.clone().add(a.mx).multiplyScalar(.5));orb.tr=clamp(Math.max(sz.x,sz.y,sz.z)*3+12,15,300);snd('click')}});
{const st=document.createElement('style');st.textContent=`.bhud{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:6;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;max-width:min(92%,720px);padding:8px 14px;border-radius:12px;background:rgba(10,13,18,.9);border:1px solid rgba(255,176,32,.45);box-shadow:0 8px 30px rgba(0,0,0,.45);font-size:12.5px;color:var(--tx2);pointer-events:none}
.bhud>b{color:#ffb020}.bhud .ax{padding:1px 7px;border-radius:5px;color:#fff}.bhud .axx{background:#e53935}.bhud .axy{background:#43a047}.bhud .axz{background:#1e88e5}.bhud .num{font:700 13px ui-monospace,Consolas,monospace;color:#fff;background:#222a35;padding:1px 7px;border-radius:5px}.bhud .v{color:var(--tx);font-variant-numeric:tabular-nums}.bhud small{flex-basis:100%;color:var(--mu);font-size:11px}`;document.head.appendChild(st)}
regType(T);
})();
