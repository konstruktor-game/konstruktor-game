/* =====================================================================
   ARDUINO KOD SIMULYATORI
   Arduino (C++) tilining o'quv uchun yetarli qismini JavaScript generatorlariga o'giradi va
   virtual vaqt bilan bajaradi: delay() — virtual soat bo'yicha kutadi, sinov kadrlariga bo'linadi.
   Qo'llab-quvvatlanadi: #define, #if/#ifdef/#elif/#else/#endif, o'zgaruvchilar (int, long, float, bool…),
   funksiyalar, if/for/while/switch, pinMode, digitalWrite/Read, analogWrite/Read, pulseIn, millis,
   random, map, constrain, Serial.begin/print/println/available/read, tone/noTone.
   ===================================================================== */
'use strict';
const ARD=(()=>{
const TYPES_RE='(?:unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|long\\s+long|int|long|float|double|bool|boolean|byte|char|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|word|size_t|short)';
function preprocess(src){const out=[],def={},stack=[];let on=true;const active=()=>stack.every(s=>s.on);
 src.split('\n').forEach((ln,i)=>{const t=ln.trim();let m;
  if(m=/^#\s*define\s+([A-Za-z_]\w*)\s*(.*)$/.exec(t)){if(active()){def[m[1]]=m[2]||'1';out.push(m[2]?`var ${m[1]} = (${m[2]});`:'')}else out.push('');return}
  if(m=/^#\s*ifdef\s+(\w+)/.exec(t)){stack.push({on:m[1] in def,taken:m[1] in def});out.push('');return}
  if(m=/^#\s*ifndef\s+(\w+)/.exec(t)){stack.push({on:!(m[1] in def),taken:!(m[1] in def)});out.push('');return}
  if(m=/^#\s*if\s+defined\s*\(?\s*(\w+)\s*\)?/.exec(t)){stack.push({on:m[1] in def,taken:m[1] in def});out.push('');return}
  if(m=/^#\s*elif\s+defined\s*\(?\s*(\w+)\s*\)?/.exec(t)){const s=stack[stack.length-1];if(s){s.on=!s.taken&&(m[1] in def);s.taken=s.taken||s.on}out.push('');return}
  if(/^#\s*else/.test(t)){const s=stack[stack.length-1];if(s){s.on=!s.taken;s.taken=true}out.push('');return}
  if(/^#\s*endif/.test(t)){stack.pop();out.push('');return}
  if(/^#\s*(include|pragma)/.test(t)){out.push('');return}
  out.push(active()?ln:'')});return out.join('\n')}
function stripComments(s){let o='',i=0,q=null;while(i<s.length){const c=s[i],n=s[i+1];if(q){o+=c;if(c==='\\'){o+=n;i+=2;continue}if(c===q)q=null;i++;continue}
 if(c==='"'||c==="'"){q=c;o+=c;i++;continue}if(c==='/'&&n==='/'){while(i<s.length&&s[i]!=='\n')i++;continue}if(c==='/'&&n==='*'){i+=2;while(i<s.length&&!(s[i]==='*'&&s[i+1]==='/')){if(s[i]==='\n')o+='\n';i++}i+=2;continue}o+=c;i++}return o}
function matchParen(s,i){let d=0,q=null;for(let k=i;k<s.length;k++){const c=s[k];if(q){if(c==='\\'){k++;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')d++;else if(c===')'){d--;if(d===0)return k}}return -1}
const INT_RE='(?:unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|long\\s+long|int|long|byte|short|word|size_t|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)';
function intify(s){// butun sonli funksiyalar: return qiymati butunga keltiriladi (C da 17/2 = 8)
 const re=new RegExp(`\\b${INT_RE}\\s+([A-Za-z_]\\w*)\\s*\\([^()]*\\)\\s*\\{`,'g');let m;const spans=[];while((m=re.exec(s))){let d=0,k=m.index+m[0].length-1;for(;k<s.length;k++){if(s[k]==='{')d++;else if(s[k]==='}'){d--;if(!d)break}}spans.push([m.index+m[0].length,k])}
 for(let i=spans.length-1;i>=0;i--){const[a,b]=spans[i];s=s.slice(0,a)+s.slice(a,b).replace(/\breturn\s+([^;]+);/g,'return __i($1);')+s.slice(b)}
 // bitta e'lon: int x = ifoda;  → let x = __i(ifoda);
 return s.replace(new RegExp(`\\b((?:const\\s+)?(?:static\\s+)?${INT_RE})\\s+([A-Za-z_]\\w*)\\s*=\\s*([^;,{]+);`,'g'),(m,t,n,e)=>`${t} ${n} = __i(${e});`)}
function transpile(src){let s=intify(stripComments(preprocess(stripComments(src))));const fns=[];
 // funksiya ta'riflari → generatorlar
 s=s.replace(new RegExp(`\\b(?:static\\s+)?(?:void|${TYPES_RE})\\s+([A-Za-z_]\\w*)\\s*\\(([^()]*)\\)\\s*\\{`,'g'),(m,name,ps)=>{fns.push(name);const args=ps.trim()===''||ps.trim()==='void'?'':ps.split(',').map(p=>p.trim().split(/[\s*&]+/).pop().replace(/\[\]$/,'')).join(', ');return`function* ${name}(${args}) {`});
 // massivlar: int a[] = {1,2} → let a = [1,2]
 s=s.replace(new RegExp(`\\b(?:const\\s+)?${TYPES_RE}\\s+([A-Za-z_]\\w*)\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([^}]*)\\}`,'g'),'let $1 = [$2]');
 s=s.replace(new RegExp(`\\b(?:const\\s+)?${TYPES_RE}\\s+([A-Za-z_]\\w*)\\s*\\[([^\\]]+)\\]\\s*;`,'g'),'let $1 = new Array($2).fill(0);');
 s=s.replace(new RegExp(`\\bconst\\s+(?:static\\s+)?${TYPES_RE}\\s+`,'g'),'const ');
 s=s.replace(new RegExp(`\\b(?:static\\s+|volatile\\s+)*${TYPES_RE}\\s+(?=[A-Za-z_])`,'g'),'let ');
 s=s.replace(new RegExp(`\\(\\s*${TYPES_RE}\\s*\\)`,'g'),'');
 // kutubxona obyektlari: Servo s;  LiquidCrystal_I2C lcd(0x27,16,2);
 s=s.replace(/\b(Servo|LiquidCrystal_I2C)\s+([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?\s*;/g,(m,c,n,a)=>`let ${n} = new __${c}(${a||''});`);
 s=s.replace(/\bdelayMicroseconds\s*\(/g,'yield* __dus(').replace(/\bdelay\s*\(/g,'yield* __delay(');
 // foydalanuvchi funksiyalarini chaqirish: (yield* f(...))
 for(const f of fns){const re=new RegExp(`(?<!function\\* )\\b${f}\\s*\\(`,'g');let out='',last=0,m;while((m=re.exec(s))){const open=m.index+m[0].length-1,close=matchParen(s,open);if(close<0)break;out+=s.slice(last,m.index)+`(yield* ${f}(`+s.slice(open+1,close)+'))';last=close+1;re.lastIndex=close+1}s=out+s.slice(last)}
 // cheksiz sikl sahifani qotirmasligi uchun har bir sikl ichida nazorat nuqtasi
 {const re=/\b(while|for)\s*\(/g;let out='',last=0,m;while((m=re.exec(s))){const open=m.index+m[0].length-1,close=matchParen(s,open);if(close<0)break;let k=close+1;while(/\s/.test(s[k]))k++;if(s[k]==='{'){out+=s.slice(last,k+1)+' yield* __tick();';last=k+1}re.lastIndex=close+1}s=out+s.slice(last)}
 return{js:s,fns}}
const API=['pinMode','digitalWrite','digitalRead','analogWrite','analogRead','pulseIn','millis','micros','random','randomSeed','map','constrain','abs','min','max','sq','sqrt','pow','Serial','tone','noTone','HIGH','LOW','INPUT','OUTPUT','INPUT_PULLUP','LED_BUILTIN','A0','A1','A2','A3','A4','A5','__delay','__dus','__tick','__i','__Servo','__LiquidCrystal_I2C','Wire'];
function compile(src){let t;try{t=transpile(src)}catch(e){return{ok:false,err:"O'girishda xato: "+e.message}}
 if(!t.fns.includes('setup')||!t.fns.includes('loop'))return{ok:false,err:'setup() va loop() funksiyalari bo\'lishi shart.'};
 try{const f=new Function(...API,'"use strict";\n'+t.js+'\n;return{setup,loop};');return{ok:true,f,js:t.js}}
 catch(e){let line='';const m=/<anonymous>:(\d+)/.exec(e.stack||'');if(m)line=` (taxminan ${+m[1]-3}-qator)`;return{ok:false,err:`Sintaksis xatosi${line}: ${e.message}`}}}
// hw: {write(pin,val,pwm), read(pin), aread(pin), pulse(pin,level), serial(text), tone(pin,f)}
function run(src,hw){const c=compile(src);if(!c.ok)return c;const R={now:0,wake:0,pins:{},modes:{},serial:[],line:'',gen:null,phase:'setup',err:null,ops:0,rx:[]};
 const pinOf=p=>typeof p==='string'&&/^A\d$/.test(p)?14+(+p[1]):+p;
 const Serial={begin(){},print(v,b){R.line+=fmtv(v,b)},println(v,b){R.line+=(v===undefined?'':fmtv(v,b));hw.serial&&hw.serial(R.line);R.serial.push(R.line);if(R.serial.length>60)R.serial.shift();R.line=''},available(){return R.rx.length},read(){return R.rx.length?R.rx.shift():-1},write(v){Serial.print(v)}};
 const fmtv=(v,b)=>typeof v==='number'?(b===undefined&&!Number.isInteger(v)?v.toFixed(2):String(b===undefined?v:Number.isInteger(b)?(+v).toFixed(b):v)):String(v);
 const api={pinMode:(p,m)=>{R.modes[pinOf(p)]=m},digitalWrite:(p,v)=>{p=pinOf(p);R.pins[p]=v?1:0;hw.write&&hw.write(p,v?1:0,false)},digitalRead:p=>hw.read?hw.read(pinOf(p)):0,
  analogWrite:(p,v)=>{p=pinOf(p);v=Math.max(0,Math.min(255,+v||0));R.pins[p]=v/255;hw.write&&hw.write(p,v/255,true)},analogRead:p=>hw.aread?hw.aread(pinOf(p)):512,
  pulseIn:(p,lv,to)=>hw.pulse?hw.pulse(pinOf(p),lv,to):0,millis:()=>Math.floor(R.now),micros:()=>Math.floor(R.now*1000),random:(a,b)=>b===undefined?Math.floor(Math.random()*a):a+Math.floor(Math.random()*(b-a)),randomSeed(){},
  map:(x,a,b,c,d)=>Math.trunc((x-a)*(d-c)/(b-a)+c),constrain:(x,a,b)=>Math.max(a,Math.min(b,x)),abs:Math.abs,min:Math.min,max:Math.max,sq:x=>x*x,sqrt:Math.sqrt,pow:Math.pow,Serial,
  tone:(p,f)=>hw.tone&&hw.tone(pinOf(p),f),noTone:p=>hw.tone&&hw.tone(pinOf(p),0),HIGH:1,LOW:0,INPUT:0,OUTPUT:1,INPUT_PULLUP:2,LED_BUILTIN:13,A0:14,A1:15,A2:16,A3:17,A4:18,A5:19,
  __delay:function*(ms){R.wake=R.now+Math.max(0,+ms||0);yield 1},__dus:function*(us){R.wake=R.now+Math.max(0,+us||0)/1000;if(us>2000)yield 1},__tick:function*(){if(++R.ops%300===0){R.wake=R.now+.05;yield 1}},__i:v=>typeof v==='number'?Math.trunc(v):typeof v==='boolean'?+v:v,
  // Servo kutubxonasi: attach(pin), write(burchak), read()
  __Servo:function(){let pin=-1,ang=90;this.attach=p=>{pin=pinOf(p)};this.write=a=>{ang=Math.max(0,Math.min(180,+a||0));hw.servo&&hw.servo(pin,ang)};this.read=()=>ang;this.detach=()=>{pin=-1}},
  // LiquidCrystal_I2C: init/begin, backlight, clear, setCursor, print
  __LiquidCrystal_I2C:function(addr,cols,rows){cols=cols||16;rows=rows||2;const buf=Array.from({length:rows},()=>' '.repeat(cols));let cx=0,cy=0,bl=false;const flush=()=>hw.lcd&&hw.lcd(buf.slice(),bl,addr);
   this.init=this.begin=()=>{flush()};this.backlight=()=>{bl=true;flush()};this.noBacklight=()=>{bl=false;flush()};this.clear=()=>{for(let i=0;i<rows;i++)buf[i]=' '.repeat(cols);cx=cy=0;flush()};
   this.setCursor=(x,y)=>{cx=Math.max(0,Math.min(cols-1,x|0));cy=Math.max(0,Math.min(rows-1,y|0))};this.print=v=>{const t=fmtv(v);for(const ch of t){if(cx<cols){buf[cy]=buf[cy].slice(0,cx)+ch+buf[cy].slice(cx+1);cx++}}flush()}},
  Wire:{begin(){}}};
 let prog;try{prog=c.f(...API.map(k=>api[k]))}catch(e){return{ok:false,err:'Ishga tushirishda xato: '+e.message}}
 R.gen=prog.setup();
 R.step=dtMs=>{if(R.err)return;const target=R.now+dtMs;let guard=0;
  while(guard++<4000){if(R.wake>target){R.now=target;return}R.now=Math.max(R.now,R.wake);let res;try{res=R.gen.next()}catch(e){R.err='Kod bajarilishida xato: '+e.message;hw.serial&&hw.serial('⟂ '+R.err);return}
   if(res.done){if(R.phase==='setup')R.phase='loop';R.gen=prog.loop();R.now+=.01;R.loops=(R.loops||0)+1}}
  R.now=target};
 R.send=ch=>{R.rx.push(...String(ch))};return{ok:true,R}}
return{transpile,compile,run}})();
// ---- Serial monitor (sinov paytida, kod rejimida) ----
(()=>{const st=document.createElement('style');st.textContent=`.serMon{position:absolute;left:10px;bottom:10px;width:min(300px,55%);max-height:34%;display:flex;flex-direction:column;background:rgba(8,11,16,.88);border:1px solid var(--ln2);border-radius:10px;z-index:6;font:11.5px/1.45 'JetBrains Mono',monospace;color:#c8f7c5;overflow:hidden}
.serMon b{font:600 11px Inter,sans-serif;color:var(--tx2);padding:5px 9px;border-bottom:1px solid var(--ln);display:flex;gap:6px;align-items:center}.serMon pre{margin:0;padding:6px 9px;overflow:auto;white-space:pre-wrap;flex:1}
.serMon form{display:flex;border-top:1px solid var(--ln)}.serMon input{flex:1;background:transparent;border:0;color:var(--tx);padding:5px 9px;font:inherit}.serMon input:focus{outline:none}`;document.head.appendChild(st);
 let el=null,last='';setInterval(()=>{const S=typeof SIM!=='undefined'?SIM:null,show=S&&S.io&&S.on&&typeof step==='function'&&step().kind==='test'&&typeof B!=='undefined'&&B&&S.B.type===B.type&&document.getElementById('view');if(!show){if(el){el.remove();el=null;last=''}return}
  if(!el){el=document.createElement('div');el.className='serMon';el.innerHTML=`<b>${IC('terminal')} Serial monitor · 115200</b><pre></pre><form><input placeholder="Yuborish (masalan: w)" maxlength="40"></form>`;document.getElementById('view').appendChild(el);
   el.querySelector('form').onsubmit=e=>{e.preventDefault();const i=el.querySelector('input');if(typeof SIM!=='undefined'&&SIM&&SIM.ard&&i.value){SIM.ard.send(i.value);SIM.io.serial.push('> '+i.value)}i.value=''}}
  const t=(S.io.serial||[]).slice(-14).join('\n')+(S.ard&&S.ard.err?'\n'+S.ard.err:'');if(t!==last){last=t;const pre=el.querySelector('pre');pre.textContent=t||'(chiqish yo\'q — Serial.println bilan yozing)';pre.scrollTop=pre.scrollHeight}},250)})();
