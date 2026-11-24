/* =====================================================================
   GUSENITSALI TANK (RC, ikki motorli, gusenitsa bilan burilish — skid steer)
     tezlik            v = rpm / uzatma · π · d_yetakchi / 60
     qiyalikka chiqish θ = min(atan μ, asin(F_motor / m·g))
     burilish          gusenitsa uzunligi / koleya (L/B) 1,2–1,8 bo'lsa oson buriladi
     yerga bosim       p = m·g / (2 · b · L)
   ===================================================================== */
(()=>{
const NOM={lipo:3.7,nimh:1.2},MU={rubber:.9,plastic:.55,metal:.75},DENS={rubber:1.2,plastic:1.05,metal:7.8};
const T={id:'tank',name:'Gusenitsali tank',ic:'tank',desc:"Tank: korpus, gusenitsalar, yetakchi va tayanch g'ildiraklar, aylanuvchi minora.",defPreset:'t116',defPurpose:'terrain',
 purposes:{terrain:{t:"Yo'lsizlik",note:'Qiyalikka chiqish va yopishish'},scale:{t:'Maket (scale)',note:'Haqiqiy tank kabi sekin va real'}},
 colors:{hull:'#4b5320',turret:'#4b5320',track:'#2b2b2b',wheels:'#3a3f2a',accent:'#c8b88a'},
 paint:[['hull','Korpus'],['turret','Minora'],['track','Gusenitsa'],['wheels',"G'ildiraklar"],['accent','Belgilar']],
 spec:{
  hull:{t:'Korpus',ic:'chassis',g:'thull',f:[{k:'len',l:'Uzunligi',min:250,max:800,step:5,u:'mm'},{k:'wid',l:'Eni (korpus)',min:120,max:400,step:5,u:'mm'},{k:'h',l:'Balandligi',min:60,max:200,step:5,u:'mm'},{k:'mat',l:'Material',type:'sel',o:{plastic:'Plastik (ABS)',alu:'Alyuminiy',steel:"Po'lat"},g:'material'}]},
  track:{t:'Gusenitsa',ic:'chassis',g:'tracks',f:[{k:'w',l:'Eni',min:20,max:90,step:1,u:'mm'},{k:'pitch',l:"Zveno qadami",min:6,max:25,step:1,u:'mm'},{k:'mat',l:'Material',type:'sel',o:{rubber:'Rezina',plastic:'Plastik zvenolar',metal:'Metall zvenolar'},g:'material'},{k:'n',l:"Tayanch g'ildiraklar (bir tomonda)",min:3,max:8,step:1,u:'ta',g:'roadwheel'},{k:'sp',l:"Yetakchi g'ildirak diametri",min:25,max:90,step:1,u:'mm',g:'sprocket'}]},
  motor:{t:"Motorlar (2 ta)",ic:'motor',g:'brushed',f:[{k:'d',l:'Korpus diametri',min:20,max:42,step:1,u:'mm'},{k:'len',l:'Korpus uzunligi',min:25,max:70,step:1,u:'mm'},{k:'kv',l:"Aylanish (1 V ga)",min:500,max:4000,step:50,u:'rpm/V',g:'kv'}]},
  gear:{t:'Reduktorlar',ic:'gear',g:'gear',f:[{k:'ratio',l:'Uzatma nisbati',min:8,max:120,step:1,u:':1',g:'gear'},{k:'mat',l:'Tishlilar',type:'sel',o:{plastic:'Plastik',metal:'Metall'}}]},
  turret:{t:'Minora',ic:'target',g:'turret',f:[{k:'on',l:"Aylanuvchi minora",type:'bool'},{k:'barrel',l:"Stvol uzunligi",min:60,max:400,step:5,u:'mm'},{k:'cam',l:'FPV kamera (stvolda)',type:'bool',g:'cam'}]},
  esc:{t:'Ikki kanalli ESC',ic:'bolt',g:'esc',f:[{k:'a',l:'Tok (har bir kanal)',min:5,max:80,step:1,u:'A',g:'escA'},{k:'mix',l:'Ichki aralashtirish (mix)',type:'bool',g:'mixing'}]},
  rx:{t:'Qabul qilgich',ic:'antenna',g:'rx',f:[{k:'ch',l:'Kanallar',type:'sel',o:{4:'4 kanal',6:'6 kanal'},g:'channel'}]},
  bat:{t:'Batareya',ic:'battery',g:'battery',f:[{k:'chem',l:'Kimyo',type:'sel',o:{lipo:'LiPo',nimh:'NiMH'},g:'chem'},{k:'cells',l:'Yacheykalar',min:2,max:12,step:1,u:'S',g:'cells'},{k:'mah',l:"Sig'im",min:800,max:8000,step:100,u:'mAh',g:'mah'}]}},
 presets:{
  t116:{name:'1/16 o\'quv tanki',desc:'Plastik, 2S LiPo, aylanuvchi minora',purpose:'scale',p:{hull:{len:420,wid:170,h:100,mat:'plastic'},track:{w:40,pitch:12,mat:'plastic',n:5,sp:45},motor:{d:28,len:38,kv:2000},gear:{ratio:30,mat:'metal'},turret:{on:true,barrel:180,cam:false},esc:{a:15,mix:true},rx:{ch:6},bat:{chem:'lipo',cells:2,mah:3000}}},
  rover:{name:"Gusenitsali rover (FPV)",desc:'Rezina gusenitsa, qiyalikka chiqadi',purpose:'terrain',p:{hull:{len:340,wid:220,h:90,mat:'alu'},track:{w:60,pitch:10,mat:'rubber',n:4,sp:60},motor:{d:36,len:50,kv:1100},gear:{ratio:25,mat:'metal'},turret:{on:false,barrel:60,cam:true},esc:{a:30,mix:true},rx:{ch:4},bat:{chem:'lipo',cells:3,mah:5000}}},
  heavy:{name:"Og'ir metall tank 1/10",desc:"Metall gusenitsa, kuchli",purpose:'scale',p:{hull:{len:700,wid:300,h:160,mat:'steel'},track:{w:70,pitch:18,mat:'metal',n:7,sp:80},motor:{d:40,len:60,kv:900},gear:{ratio:45,mat:'metal'},turret:{on:true,barrel:380,cam:false},esc:{a:50,mix:true},rx:{ch:6},bat:{chem:'lipo',cells:4,mah:6000}}}},
 steps:[
  {id:'hull',t:'Korpus',ic:'chassis',cats:['hull'],slots:()=>['hull'],intro:"Korpus — barcha mexanizmlar joylashadigan quti. Pastki qismi (tub) yerdan baland bo'lsa, to'siqlardan oson o'tadi."},
  {id:'drive',t:'Motorlar va reduktorlar',ic:'motor',cats:['motor','gear'],slots:()=>['motL','motR','gear'],intro:"Har bir gusenitsaning o'z motori bor. Reduktor tezlikni kamaytirib, kuchni oshiradi — tank sekin, lekin juda kuchli."},
  {id:'run',t:"Yurish qismi va gusenitsa",ic:'chassis',cats:['track'],slots:()=>['wheels','trackL','trackR'],intro:"Yetakchi g'ildirak (tishli) gusenitsani tortadi, tayanch g'ildiraklar og'irlikni yerga tarqatadi, orqa yo'naltiruvchi g'ildirak gusenitsani taranglaydi."},
  {id:'turret',t:'Minora',ic:'target',cats:['turret'],slots:B=>B.p.turret.on?['turret','tsv']:['turret'],intro:"Minora servo yoki kichik motor bilan aylanadi. Stvolga FPV kamera o'rnatilsa — kuzatuv roveri bo'ladi."},
  {id:'elec',t:'ESC va qabul qilgich',ic:'bolt',cats:['esc','rx'],slots:()=>['esc','rx'],intro:"Ikki kanalli ESC gaz va rul buyrug'ini aralashtiradi: oldinga — ikkala gusenitsa birga, burilish — biri tez, biri sekin yoki teskari."},
  {id:'wiring',kind:'wiring',t:'Ulash (simlar)',ic:'plug',intro:"CH1 — burilish, CH2 — gaz, CH4 — minora. Motor simlari teskari ulansa, o'sha gusenitsa orqaga yuradi."},
  {id:'battery',t:'Batareya va qopqoq',ic:'battery',cats:['bat'],slots:()=>['bat','lid'],intro:"Batareya korpus tubiga — og'irlik markazi past bo'lsa, tank qiyalikda ag'darilmaydi."},
  {id:'paint',kind:'paint',t:'Dizayn va rang',ic:'palette'},{id:'check',kind:'check',t:'Tekshiruv va hisob-kitob',ic:'chart'},{id:'test',kind:'test',t:'Maydonda sinov',ic:'flag'},{id:'bom',kind:'bom',t:"Detallar ro'yxati",ic:'list'}],
 req:{motL:'hull',motR:'hull',gear:'motL',wheels:'gear',trackL:'wheels',trackR:'wheels',turret:'hull',tsv:'turret',esc:'hull',rx:'esc',bat:'esc',lid:'bat'},
 labels:{hull:'thull',motL:'brushed',motR:'brushed',gear:'gear',wheels:'roadwheel',trackL:'tracks',trackR:'tracks',turret:'turret',tsv:'servo',esc:'esc',rx:'rx',bat:'battery',lid:'plate'}};
T.derive=B=>{const p=B.p,h=p.hull,tr=p.track,g=9.81,Vn=p.bat.cells*NOM[p.bat.chem],V=Vn*.92;
 const Lh=h.len/1000,Wh=h.wid/1000,rs=Math.max(tr.sp/2000,h.h/1000*.3),Lc=Lh-2*rs*.6,perim=2*(Lh-2*rs)+2*Math.PI*rs;
 const wHull=2*(Lh*Wh+Lh*h.h/1000+Wh*h.h/1000)*{plastic:2.5,alu:1.6,steel:1.2}[h.mat]/1000*{plastic:1050,alu:2700,steel:7850}[h.mat]*1000;
 const wTrack=2*perim*tr.w/1000*.004*DENS[tr.mat]*1e6*(tr.mat==='metal'?.45:1),wWheels=2*(tr.n+2)*(rs*1000*.75)**2*.012*(tr.mat==='metal'?1.4:1),wMot=2*(.0029*p.motor.d*p.motor.d*p.motor.len+10),wGear=2*(p.gear.mat==='metal'?55:25);
 const wTur=p.turret.on?Wh*Lh*.35*h.h/1000*.45*1e6*.18+p.turret.barrel*.15+(p.turret.cam?15:0):p.turret.cam?25:0,wBat=p.bat.chem==='lipo'?p.bat.cells*p.bat.mah*.026+12:p.bat.cells*p.bat.mah*.012+15,wEl=30+p.esc.a*.6;
 const AUW=wHull+wTrack+wWheels+wMot+wGear+wTur+wBat+wEl,m=AUW/1000;
 const rpm=p.motor.kv*V*.85,v=rpm/p.gear.ratio*Math.PI*tr.sp/1000/60,Pm=.0012*p.motor.d*p.motor.d*p.motor.len,eff=p.gear.mat==='metal'?.8:.7;
 const Fm=2*Pm*eff*.6/Math.max(v*.3,.05),mu=MU[tr.mat],climb=Math.min(Math.atan(mu),Math.asin(Math.min(1,Fm/(m*g))))*180/Math.PI;
 const track=Wh+2*tr.w/1000*.5+.01,LB=Lc/track,press=m*g/(2*tr.w/1000*Lc)/1000,Ist=Pm*2.5/V,Iavg=2*Pm*.5/V+.2,tRun=p.bat.mah/1000*.8/Iavg*60;
 return{AUW,m,v,vTop:v,rpm,Pm,Fm,mu,climb,LB,press,Ist,Iavg,tRun,track,Lc,rs,V,Vn,wHull,wTrack,wWheels,wMot,wGear,wTur,wBat,
  parts:[['Korpus',wHull],['Gusenitsalar',wTrack],["G'ildiraklar",wWheels],['Motorlar',wMot],['Reduktorlar',wGear],['Minora',wTur],['Batareya',wBat],['Elektronika',wEl]],
  table:[10,20,30,40,50,60,70,80,90,100].map(t=>{const sp=v*t/100,pw=2*Pm*.3*t/100+2;return{t,thrust:sp*3.6,watt:pw,amp:pw/V,eff:pw>0?sp*3.6/pw*100:0}})}};
T.metrics=(B,D)=>[{l:"Og'irlik",v:fmt(D.AUW/1000,2)+' kg'},{l:'Tezlik',v:fmt(D.v*3.6,1)+' km/soat'},{l:'Qiyalikka chiqish',v:fmt(D.climb)+'°',lvl:D.climb<20?'warn':'ok'},{l:'L / B',v:fmt(D.LB,2),lvl:D.LB>2?'bad':D.LB>1.8||D.LB<1?'warn':'ok'},{l:'Yerga bosim',v:fmt(D.press,1)+' kPa'},{l:'Ishlash vaqti',v:fmt(D.tRun)+' daq'}];
T.issues=(B,D)=>{const p=B.p,L=[],add=(l,t,y)=>L.push({lvl:l,t,why:y});
 if(D.LB>2)add('bad',`Burila olmaydi: L/B = ${fmt(D.LB,2)}`,"Gusenitsa juda uzun yoki koleya tor — joyida burilishda motorlar to'xtab qoladi. Korpusni kengaytiring yoki qisqartiring (1,2–1,8).");else if(D.LB>1.8)add('warn',`Qiyin buriladi (L/B ${fmt(D.LB,2)})`,'');else if(D.LB<1)add('warn',`To'g'ri yurishi beqaror (L/B ${fmt(D.LB,2)})`,"Qisqa gusenitsa — tank chayqaladi va to'g'ri yurmaydi.");
 if(D.Ist>p.esc.a)add('bad',`ESC toki yetmaydi: start ${fmt(D.Ist,1)} A > ${p.esc.a} A`,"Burilishda motorlar yuklanadi — ESC kuyadi. Kuchliroq ESC yoki kattaroq uzatma.");
 if(D.v*3.6>15&&p.gear.mat==='plastic')add('warn','Plastik tishlilar yuqori tezlikda yeyiladi','Metall reduktor oling.');
 if(D.climb<20)add('warn',`Qiyalikka kuchsiz (${fmt(D.climb)}°)`,D.mu<.7?"Plastik gusenitsa sirpanadi — rezina qoplama qo'shing.":"Uzatmani oshiring (kuch ko'payadi).");
 if(!p.esc.mix)add('warn',"Aralashtirish (mix) o'chiq","Pultda aralashtirish sozlanmasa, har bir gusenitsa alohida tayoqcha bilan boshqariladi.");
 if(D.v*3.6<1.5)add('warn',`Juda sekin (${fmt(D.v*3.6,1)} km/soat)`,'Uzatmani kamaytiring yoki KV ni oshiring.');
 if(p.track.pitch>p.track.sp*.45)add('warn','Zveno qadami yetakchi g\'ildirakka nisbatan katta',"Gusenitsa tishlardan sakrab chiqadi.");
 if(p.turret.barrel/10>p.hull.len/10*.9)add('info','Stvol uzun',"Burilishda to'siqlarga ilinadi.");
 return L};
T.catInfo=(cat,d,p,a)=>{a('Tezlik',fmt(d.v*3.6,1)+' km/soat');a('Qiyalik',fmt(d.climb)+'°');a('L/B (burilish)',fmt(d.LB,2));if(cat==='esc'||cat==='motor')a('Start toki',fmt(d.Ist,1)+' A');if(cat==='bat')a('Ishlash vaqti',fmt(d.tRun)+' daq');a("Og'irlik",fmt(d.AUW)+' g')};
T.ext=D=>[['Tortish kuchi',fmt(D.Fm,1)+' N'],['Yopishish μ',fmt(D.mu,2)],['Tayanch uzunligi',fmt(D.Lc*1000)+' mm'],['Koleya',fmt(D.track*1000)+' mm'],["O'rtacha tok",fmt(D.Iavg,1)+' A'],['Motor quvvati',fmt(D.Pm)+' W × 2']];
T.wiring=B=>({boards:[{id:'esc',label:`Ikki kanalli ESC ${B.p.esc.a}A`,x:220,y:240,w:240,h:180,need:'esc',pads:[{id:'VBAT+',t:'vbat',x:280,y:420,l:'+'},{id:'VBAT-',t:'gnd',x:360,y:420,l:'−'},{id:'ML+',t:'motor',x:240,y:240,l:'A+'},{id:'ML-',t:'motor',x:290,y:240,l:'A−'},{id:'MR+',t:'motor',x:390,y:240,l:'B+'},{id:'MR-',t:'motor',x:440,y:240,l:'B−'}]},
  {id:'rx',label:`Qabul qilgich (${B.p.rx.ch} kanal)`,x:620,y:220,w:180,h:220,need:'rx',pads:Array.from({length:+B.p.rx.ch},(_,i)=>({id:'CH'+(i+1),t:'ch',x:620,y:240+i*(180/(B.p.rx.ch-1)),l:'CH'+(i+1)}))}],
 comps:[{id:'motL',label:'Chap motor',x:230,y:100,need:'motL',wires:[{id:'mLa',l:'+',col:'#e53935',kind:'motor',ok:['ML+','ML-'],grp:'mL',w:3},{id:'mLb',l:'−',col:'#222',kind:'motor',ok:['ML-','ML+'],grp:'mL',w:3}]},
  {id:'motR',label:"O'ng motor",x:430,y:100,need:'motR',wires:[{id:'mRa',l:'+',col:'#e53935',kind:'motor',ok:['MR+','MR-'],grp:'mR',w:3},{id:'mRb',l:'−',col:'#222',kind:'motor',ok:['MR-','MR+'],grp:'mR',w:3}]},
  {id:'xt60',label:'Batareya kabeli',x:320,y:590,need:'esc',wires:[{id:'bat+',l:'+',col:'#e53935',kind:'bat+',ok:['VBAT+'],w:4},{id:'bat-',l:'−',col:'#222',kind:'bat-',ok:['VBAT-'],w:4}]},
  {id:'escsig',label:'ESC: gaz',x:520,y:520,need:'esc',wires:[{id:'escsig',l:'gaz',col:'#ff9800',kind:'servo',ok:['CH2'],grp:'ch',w:3}]},
  {id:'escsig2',label:'ESC: burilish',x:520,y:600,need:'esc',wires:[{id:'escsig2',l:'rul',col:'#ffb74d',kind:'servo',ok:['CH1'],grp:'ch',w:3}]},
  ...(B.p.turret.on?[{id:'tsv',label:'Minora servosi',x:930,y:300,need:'tsv',wires:[{id:'wtsv',l:'servo',col:'#ff9800',kind:'servo',ok:['CH4'],grp:'ch',w:3}]}]:[])],
 hint:"CH1 — burilish, CH2 — gaz, CH4 — minora. Motor simlarining qutbi teskari bo'lsa, gusenitsa orqaga yuradi — ikki simni almashtiring."});
T.wextra=B=>{const w=B.wires;return{revL:w.mLa==='ML-'&&w.mLb==='ML+',revR:w.mRa==='MR-'&&w.mRb==='MR+'}};
// ---------- 3D model (sm) ----------
function trackPath(L,rs,yc){const zF=-L/2+rs,zR=L/2-rs,straight=zR-zF,P=2*straight+2*Math.PI*rs;return{P,at:s=>{s=((s%P)+P)%P;if(s<straight)return[zF+s,yc-rs,0];s-=straight;if(s<Math.PI*rs){const a=s/rs;return[zR+Math.sin(a)*rs,yc-Math.cos(a)*rs,a]}s-=Math.PI*rs;if(s<straight)return[zR-s,yc+rs,Math.PI];s-=straight;const a=s/rs+Math.PI;return[zF+Math.sin(a)*rs,yc-Math.cos(a)*rs,a]}}}
T.build=(B,D,ctx)=>{const p=B.p,c=B.col,X=!!window.XRAY,L=p.hull.len/10,Wh=p.hull.wid/10,Hh=p.hull.h/10,tw=p.track.w/10,rs=D.rs*100,yc=rs+.3,xs=Wh/2+tw/2+.25,hy=rs*.7,top=hy+Hh;
 const hm=X?MAT('xth'+c.hull,()=>new THREE.MeshPhysicalMaterial({color:c.hull,transparent:true,opacity:.22,depthWrite:false})):mMat(p.hull.mat==='plastic'?'plastic':'paint',c.hull,'matte');
 {const g=new THREE.Group();g.add(tagP(box(Wh,Hh*.75,L*.92,hm,0,hy+Hh*.375,0),'Korpus tubi va yon devorlari',1));const gl=box(Wh*.98,Hh*.08,L*.22,hm,0,hy+Hh*.55,-L*.5);gl.rotation.x=-.55;g.add(tagP(gl,'Old zirh plitasi (glacis)',2));
  for(const sx of[-1,1])g.add(tagP(box(.4,Hh*.15,L*.9,mMetal('#555',.5),sx*(Wh/2+.2),yc,0),"G'ildirak o'qlari tayanchi",3));ctx.add('hull',g,[0,0,0])}
 const mot=(s)=>{const g=new THREE.Group(),r=p.motor.d/20,l=p.motor.len/10,m=cyl(r,r,l,mMetal('#c4c9cf',.25),s*(Wh/2-l/2-.4),yc,-L*.32,24);m.rotation.z=Math.PI/2;g.add(tagP(m,'Motor korpusi (magnitlar va yakor ichida)',1));
  const e=cyl(r*.8,r*.8,.3,mPlastic('#222',.5),s*(Wh/2-l-.5),yc,-L*.32,20);e.rotation.z=Math.PI/2;g.add(tagP(e,"Cho'tka qopqog'i",2));g.add(tagP(wireMesh([[s*(Wh/2-l-.6),yc+.3,-L*.32],[s*Wh*.2,hy+Hh*.5,-L*.1],[s*Wh*.1,hy+Hh*.45,L*.05]],s<0?'#e53935':'#222',.1),'Simlar',3));return g};
 ctx.add('motL',mot(-1),[-4,4,0]);ctx.add('motR',mot(1),[4,4,0]);
 {const g=new THREE.Group();for(const s of[-1,1]){g.add(tagP(box(2.2,Hh*.45,3,p.gear.mat==='metal'?mMetal('#8d939b',.3):mPlastic('#2b2b2b',.5),s*(Wh/2-1.4),yc,-L*.42),'Reduktor korpusi',1));
   const gm=new THREE.Mesh(gearGeo(30,.5,4),p.gear.mat==='metal'?mMetal('#b0b6bf',.3):mPlastic('#ddd',.4));gm.rotation.z=Math.PI/2;gm.position.set(s*(Wh/2-.25),yc,-L*.42);g.add(tagP(gm,'Tishli g\'ildiraklar',2))}ctx.add('gear',g,[0,5,-4])}
 // yetakchi (oldda), yo'naltiruvchi (orqada), tayanch va qaytaruvchi g'ildiraklar
 {const g=new THREE.Group(),wm=mPaint(c.wheels,'matte'),rr=rs*.72,n=+p.track.n;for(const s of[-1,1]){const x=s*xs;
   const sp=new THREE.Mesh(gearGeo(11,Math.max(.4,rs*2/13),tw*8),mMetal('#3a3a3a',.4));sp.rotation.z=Math.PI/2;sp.position.set(x,yc,-L/2+rs);sp.userData.spin=true;g.add(tagP(sp,"Yetakchi g'ildirak (tishli)",1));
   const id=cyl(rs*.9,rs*.9,tw*.85,wm,x,yc,L/2-rs,28);id.rotation.z=Math.PI/2;id.userData.spin=true;g.add(tagP(id,"Yo'naltiruvchi g'ildirak (taranglovchi)",2));
   for(let i=0;i<n;i++){const z=-L/2+rs*1.9+i*(L-rs*3.8)/Math.max(1,n-1),w=cyl(rr,rr,tw*.8,wm,x,rr+.6,z,24);w.rotation.z=Math.PI/2;w.userData.spin=true;g.add(tagP(w,"Tayanch g'ildiraklar",3));const hb=cyl(rr*.35,rr*.35,tw*.82,mMetal('#9aa',.3),x,rr+.6,z,12);hb.rotation.z=Math.PI/2;g.add(tagP(hb,"Tayanch g'ildiraklar",3))}
   for(const z of[-L*.15,L*.15]){const r2=cyl(rs*.3,rs*.3,tw*.5,wm,x,yc+rs-.35,z,16);r2.rotation.z=Math.PI/2;g.add(tagP(r2,"Qaytaruvchi roliklar",4))}}ctx.add('wheels',g,[0,-3,0])}
 const trk=(s)=>{const g=new THREE.Group(),pth=trackPath(L,rs+.15,yc),pl=p.track.pitch/10,n=Math.max(12,Math.round(pth.P/pl)),geo=GEO(`tlink${tw},${pl}`,()=>new THREE.BoxGeometry(tw,.35,pl*.86)),im=new THREE.InstancedMesh(geo,p.track.mat==='metal'?mMetal(c.track,.5):mRubber(c.track),n),mx=new THREE.Matrix4(),q=new THREE.Quaternion();
  for(let i=0;i<n;i++){const[z,y,a]=pth.at(i/n*pth.P);q.setFromAxisAngle(new V3(1,0,0),-a);mx.compose(new V3(s*xs,y,z),q,new V3(1,1,1));im.setMatrixAt(i,mx)}im.castShadow=true;g.add(tagP(im,'Gusenitsa zvenolari',1));g.userData.track=im;return g};
 ctx.add('trackL',trk(-1),[-6,0,0]);ctx.add('trackR',trk(1),[6,0,0]);
 {const g=new THREE.Group(),tm=X?hm:mMat(p.hull.mat==='plastic'?'plastic':'paint',c.turret,'matte');if(p.turret.on){const tr=new THREE.Group();tr.position.set(0,top+.3,L*.02);tr.userData.turret=true;
   tr.add(tagP(rbox(Wh*.62,Hh*.42,L*.36,Wh*.12,tm,0,Hh*.21,0),'Minora korpusi',1));tr.add(tagP(box(Wh*.22,Hh*.25,1.2,tm,0,Hh*.22,-L*.18-.4),'Stvol niqobi (mantlet)',2));
   const bl=p.turret.barrel/10,b=cyl(.45,.55,bl,mMetal('#3b3f2a',.6),0,Hh*.22,-L*.18-bl/2-.8,16);b.rotation.x=Math.PI/2;tr.add(tagP(b,'Stvol',3));
   tr.add(tagP(cyl(Wh*.08,Wh*.08,.3,tm,Wh*.12,Hh*.43,L*.05,20),'Lyuk',4));tr.add(tagP(cyl(.05,.05,Hh*.9,mPlastic('#111'),-Wh*.22,Hh*.85,L*.12,6),'Antenna',4));
   if(p.turret.cam){const cm=mkCamera(19,'#111',false);cm.scale.setScalar(.7);cm.position.set(0,Hh*.48,-L*.15);tr.add(tagP(cm,'FPV kamera',5))}g.add(tr)}
  else{g.add(tagP(box(Wh*.5,Hh*.2,L*.3,tm,0,top+.4,0),'Asboblar qutisi',1));if(p.turret.cam){const cm=mkCamera(19,'#111',false);cm.position.set(0,top+1.4,-L*.25);g.add(tagP(cm,'FPV kamera',2))}}
  ctx.add('turret',g,[0,8,0])}
 if(p.turret.on){const s=mkServo('std','#263238');s.scale.setScalar(.8);s.position.set(Wh*.15,top-1.5,L*.02);ctx.add('tsv',s,[0,-4,0])}
 {const g=new THREE.Group();g.add(rbox(3.5,1.2,4.5,.3,mPlastic('#1e1e1e',.4),-Wh*.2,hy+1,L*.15));g.add(box(3.2,.3,4,mMetal('#9aa3ad',.3),-Wh*.2,hy+1.75,L*.15));ctx.add('esc',g,[-4,4,0])}
 ctx.add('rx',(()=>{const g=new THREE.Group();g.add(rbox(2.2,1,3,.3,mPlastic('#202020',.4),Wh*.25,hy+.9,L*.25));g.add(cyl(.05,.05,5,mPlastic('#111'),Wh*.25,hy+3.5,L*.25,6));return g})(),[4,4,0]);
 {const b=mkBattery(p.bat.cells,p.bat.mah,p.bat.chem==='lipo'?'lipo':'life','#1b5e20',[`${p.bat.cells}S ${p.bat.mah}`,'','']);b.position.set(0,hy+.3,L*.05);const d=b.userData.dims,k=Math.min(1,Wh*.85/d.w,L*.5/d.l);if(k<1)b.scale.setScalar(k);ctx.add('bat',b,[0,6,0])}
 {const g=new THREE.Group();g.add(tagP(box(Wh+2*tw+.6,.3,L*.94,hm,0,top+.15,0),'Yuqori qopqoq va qanotlar (fender)',1));for(const sx of[-1,1])g.add(tagP(box(.6,.6,L*.25,mPaint(c.accent,'matte'),sx*(Wh/2+tw*.6),top+.45,L*.25),'Asbob-uskuna qutilari',2));
  g.add(tagP(box(Wh*.3,.12,Wh*.3,mPaint(c.accent,'matte'),0,top+.31,-L*.32),'Belgi',3));ctx.add('lid',g,[0,10,0])}};
T.bom=(B,D)=>{const p=B.p;return[['thull',`Korpus ${p.hull.len}×${p.hull.wid}×${p.hull.h} mm`,{plastic:'ABS plastik',alu:'Alyuminiy',steel:"Po'lat"}[p.hull.mat],1,D.wHull],['brushed',`Motor ${p.motor.d}×${p.motor.len} mm, ${p.motor.kv} rpm/V`,`~${fmt(D.Pm)} W`,2,D.wMot/2],
 ['gear',`Reduktor ${p.gear.ratio}:1`,p.gear.mat==='metal'?'Metall tishlilar':'Plastik tishlilar',2,D.wGear/2],['roadwheel',`Tayanch g'ildiraklar`,`${p.track.n} ta × 2 tomon + yetakchi va yo'naltiruvchi`,1,D.wWheels],['tracks',`Gusenitsa ${p.track.w} mm, qadam ${p.track.pitch} mm`,{rubber:'Rezina',plastic:'Plastik zvenolar',metal:'Metall zvenolar'}[p.track.mat],2,D.wTrack/2],
 ...(p.turret.on?[['turret',`Minora, stvol ${p.turret.barrel} mm`,p.turret.cam?'FPV kamera bilan':'',1,D.wTur],['servo','Minora servosi (360°)','',1,40]]:[]),['esc',`Ikki kanalli ESC ${p.esc.a}A`,p.esc.mix?'Ichki aralashtirish':'',1,30],['rx',`Qabul qilgich ${p.rx.ch} kanal`,'',1,10],['battery',`Batareya ${p.bat.cells}S ${p.bat.mah}mAh`,'',1,D.wBat],['plate','Yuqori qopqoq + vintlar','',1,20]]};
// ---------- sinov ----------
T.startTitle='Sinov haydashga tayyor';T.startNote="Tank maydonda. <b>W/S</b> — oldinga/orqaga, <b>A/D</b> — burilish (joyida ham), <b>Q/E</b> — minorani burish.";
T.linkMsg=()=>"ESC gaz kabeli CH2 ga ulanmagan — tank yurmaydi.";T.armMsg=()=>"W/S — yurish, A/D — burilish, Q/E — minora";
T.simInit=(S,B,WC,ex)=>{S.pos.set(-10,0,42);S.yaw=Math.PI;S.vL=0;S.vR=0;S.revL=!!ex.revL;S.revR=!!ex.revR;S.steerOk=WC.works.escsig2;S.turOk=B.p.turret.on&&WC.works.tsv;S.tur=null;S.wls=[];
 S.model.traverse(o=>{if(o.userData.turret)S.tur=o;if(o.userData.spin)S.wls.push(o)})};
T.simTick=(S,dt,I,{g,soc})=>{const D=S.D,B=S.B,p=B.p,sag=.85+.15*soc;let f=0,t=0;
 if(S.armed&&soc>0){f=clamp((I.thrUp||KEYS.ArrowUp?1:0)-(I.thrDn||KEYS.ArrowDown?1:0)+(-STK.l.y),-1,1);t=clamp((KEYS.KeyA||KEYS.ArrowLeft?1:0)-(KEYS.KeyD||KEYS.ArrowRight?1:0)+(-STK.r.x),-1,1);if(!S.steerOk){if(t&&!S.sMsg){S.sMsg=1;S.status="Burilish kabeli (CH1) ulanmagan — tank burilmaydi."}t=0}}
 let cL=clamp(f-t*(D.LB>2?.25:.8),-1,1),cR=clamp(f+t*(D.LB>2?.25:.8),-1,1);if(S.revL)cL=-cL;if(S.revR)cR=-cR;
 if(S.armed&&(S.revL||S.revR)&&(cL||cR)&&!S.rMsg){S.rMsg=1;S.status=`${S.revL&&S.revR?'Ikkala':S.revL?'Chap':"O'ng"} gusenitsa teskari yurmoqda — motor simlarini almashtiring.`}
 const vmax=D.v*sag,tc=Math.min(1,dt/.35);S.vL+=(cL*vmax-S.vL)*tc;S.vR+=(cR*vmax-S.vR)*tc;
 const v=(S.vL+S.vR)/2,w=(S.vR-S.vL)/D.track*.75;S.yaw+=w*dt;const dir=new V3(-Math.sin(S.yaw),0,-Math.cos(S.yaw));S.vel.copy(dir).multiplyScalar(v);S.pos.addScaledVector(S.vel,dt);S.pos.y=0;
 S.pitch=clamp(-(S.vL+S.vR-(S.pv||0))*.6,-.05,.05);S.pv=S.vL+S.vR;S.roll=Math.sin(S.t*9)*.004*Math.abs(v)/Math.max(.1,vmax);
 if(S.tur){const q=(KEYS.KeyQ?1:0)-(KEYS.KeyE?1:0);if(q&&!S.turOk&&!S.qMsg){S.qMsg=1;S.status="Minora servosi ulanmagan (CH4)."}if(S.turOk)S.tur.rotation.y+=q*dt*.8}
 const R=D.rs;for(const o of S.wls){const side=o.position.x<0?S.vL:S.vR;o.rotation.x-=side*dt/R}
 const I_A=S.armed?D.Iavg+D.Ist*.25*(Math.abs(cL)+Math.abs(cR)):.1;S.amp=I_A;S.used+=I_A*dt/3.6*(window.SIM_FAST||1);S.volt=D.V*sag;if(soc<=0&&S.armed){S.armed=false;S.status='Batareya tugadi.'}
 humSet(S.armed&&(Math.abs(S.vL)+Math.abs(S.vR))>.01,Math.min(1,(Math.abs(cL)+Math.abs(cR))/2)*.7)};
regType(T);
})();
