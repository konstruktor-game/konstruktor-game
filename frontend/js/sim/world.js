/* =====================================================================
   SINOV MAYDONI MUHITI: qishloq / shahar chekkasi.
   Uylar (devor, qiya tom, deraza va eshik teksturasi), daraxtlar, asfalt yo'llar (chiziq, piyodalar
   yo'lagi, yo'laklar), panjaralar, elektr ustunlari va simlari, skameykalar, mashinalar, tepaliklar, bulutlar.
   Tezlik: hammasi kataklarga (160 m) bo'lingan birlashtirilgan geometriya yoki InstancedMesh;
   soya faqat uylar va daraxt tojlarida. Ustunlik: start nuqtalari atrofi (~35-45 m) va uchish yo'lagi bo'sh.
   Birliklar: metr.
   ===================================================================== */
'use strict';
const WORLD={built:false,cols:[],occ:[],clouds:[],ch:new Map(),mats:null};
const WCHUNK=160;
function wRng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const WCOL={};function wc(h){return WCOL[h]||(WCOL[h]=new THREE.Color(h))}

// Birlashtiriladigan geometriya: to'rtburchak / uchburchak / quti / prizma (vertex rang bilan)
class GeoBuf{
 constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.i=[]}
 _v(a,nx,ny,nz,col){this.p.push(a[0],a[1],a[2]);this.n.push(nx,ny,nz);this.c.push(col.r,col.g,col.b)}
 _nrm(a,b,d,out){const e1x=b[0]-a[0],e1y=b[1]-a[1],e1z=b[2]-a[2],e2x=d[0]-a[0],e2y=d[1]-a[1],e2z=d[2]-a[2];
  let nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  let fl=false;if(out&&nx*out[0]+ny*out[1]+nz*out[2]<0){fl=true;nx=-nx;ny=-ny;nz=-nz}return[nx,ny,nz,fl]}
 quad(a,b,c,d,uv,col,out){const[nx,ny,nz,fl]=this._nrm(a,b,d,out),o=this.p.length/3;
  for(const q of[a,b,c,d])this._v(q,nx,ny,nz,col);const[u0,v0,u1,v1]=uv;this.u.push(u0,v0,u1,v0,u1,v1,u0,v1);
  if(fl)this.i.push(o,o+2,o+1,o,o+3,o+2);else this.i.push(o,o+1,o+2,o,o+2,o+3)}
 tri(a,b,c,uv,col,out){const[nx,ny,nz,fl]=this._nrm(a,b,c,out),o=this.p.length/3;
  for(const q of[a,b,c])this._v(q,nx,ny,nz,col);this.u.push(...uv);if(fl)this.i.push(o,o+2,o+1);else this.i.push(o,o+1,o+2)}
 box(x0,y0,z0,x1,y1,z1,col,us){const U=(a,b,c,d)=>us?[a/us,b/us,c/us,d/us]:[0,0,1,1];
  this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],U(x0,y0,x1,y1),col);
  this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],U(x0,y0,x1,y1),col);
  this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],U(z0,y0,z1,y1),col);
  this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],U(z0,y0,z1,y1),col);
  this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],U(x0,z0,x1,z1),col)}
 prism(cx,cz,r,y0,y1,n,col){for(let k=0;k<n;k++){const a0=k/n*6.2832,a1=(k+1)/n*6.2832,am=(a0+a1)/2;
  this.quad([cx+r*Math.cos(a0),y0,cz+r*Math.sin(a0)],[cx+r*Math.cos(a1),y0,cz+r*Math.sin(a1)],[cx+r*Math.cos(a1),y1,cz+r*Math.sin(a1)],[cx+r*Math.cos(a0),y1,cz+r*Math.sin(a0)],[0,0,1,1],col,[Math.cos(am),0,Math.sin(am)])}}
 mesh(mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mat);m.castShadow=!!mat.userData.cast;m.receiveShadow=true;return m}}

function wg(name,x,z){const k=name+'|'+Math.floor(x/WCHUNK)+','+Math.floor(z/WCHUNK);let g=WORLD.ch.get(k);if(!g){g=new GeoBuf();WORLD.ch.set(k,g)}return g}

// ---------- teksturalar (canvas) ----------
// Fasad atlasi: 4 ta 128x128 katak: deraza, eshik, bo'sh devor, kichik deraza
function wFacade(key,brick){return ctex(key,512,128,(g,w,h)=>{const R=wRng(brick?11:7);
 for(let k=0;k<4;k++){const x0=k*128;
  if(brick){g.fillStyle='#cbbfae';g.fillRect(x0,0,128,128);for(let r=0;r<12;r++){const y=r*10.67,off=(r%2)*12;for(let c=-1;c<7;c++){const bx=x0+c*24+off,xa=Math.max(x0,bx+1),xb=Math.min(x0+128,bx+23);if(xb>xa){g.fillStyle=`hsl(${8+R()*9},${36+R()*14}%,${36+R()*14}%)`;g.fillRect(xa,y+1,xb-xa,9)}}}}
  else{g.fillStyle='#f2ede3';g.fillRect(x0,0,128,128);for(let i=0;i<500;i++){g.fillStyle=`rgba(${R()<.5?90:255},${R()<.5?90:255},${R()<.5?80:255},${R()*.05})`;g.fillRect(x0+R()*128,R()*128,1+R()*2,1+R()*2)}
   g.fillStyle='rgba(0,0,0,.05)';g.fillRect(x0,122,128,6)}
  const win=(cx,cy,ww,hh)=>{g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x0+cx-ww/2-2,cy-hh/2-2,ww+8,hh+8);g.fillStyle='#f7f7f3';g.fillRect(x0+cx-ww/2-3,cy-hh/2-3,ww+6,hh+6);
   const gr=g.createLinearGradient(0,cy-hh/2,0,cy+hh/2);gr.addColorStop(0,'#9fc3e0');gr.addColorStop(.55,'#4d7195');gr.addColorStop(1,'#263c52');g.fillStyle=gr;g.fillRect(x0+cx-ww/2,cy-hh/2,ww,hh);
   g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.moveTo(x0+cx-ww/2,cy-hh/2);g.lineTo(x0+cx-ww/2+ww*.55,cy-hh/2);g.lineTo(x0+cx-ww/2,cy-hh/2+hh*.6);g.fill();
   g.fillStyle='#f7f7f3';g.fillRect(x0+cx-1.5,cy-hh/2,3,hh);g.fillRect(x0+cx-ww/2,cy-1.5,ww,3);
   g.fillStyle='#dcd7cc';g.fillRect(x0+cx-ww/2-7,cy+hh/2+3,ww+14,5);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x0+cx-ww/2-6,cy+hh/2+8,ww+12,3)};
  if(k===0)win(64,62,56,66);
  else if(k===3)win(64,56,28,34);
  else if(k===1){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x0+30,30,68,98);g.fillStyle='#f7f7f3';g.fillRect(x0+33,33,62,95);const dg=g.createLinearGradient(x0+38,0,x0+90,0);dg.addColorStop(0,'#74482c');dg.addColorStop(.5,'#8a5a38');dg.addColorStop(1,'#6a4128');g.fillStyle=dg;g.fillRect(x0+38,38,52,90);
   const gl=g.createLinearGradient(0,46,0,74);gl.addColorStop(0,'#9fc3e0');gl.addColorStop(1,'#35506b');g.fillStyle=gl;g.fillRect(x0+47,46,34,28);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x0+45,84,38,36);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x0+46,85,36,2);
   g.fillStyle='#d5b24a';g.beginPath();g.arc(x0+83,92,2.6,0,6.3);g.fill();g.fillStyle='#bdb8ae';g.fillRect(x0+28,122,72,6)}
  else if(k===2){g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x0+54,92,20,6);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x0+54,90,20,2)}
 }})}
const wRoofTex=()=>ctex('wroof',128,128,(g,w,h)=>{const R=wRng(3);g.fillStyle='#d0d0d0';g.fillRect(0,0,w,h);for(let r=0;r<8;r++){const y=r*16,off=(r%2)*10;for(let c=-1;c<7;c++){const x=c*21+off,v=190+R()*60|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+1,y,19,15);g.fillStyle='rgba(0,0,0,.30)';g.fillRect(x+1,y+13,19,3)}}});
const wRoadTex=()=>ctex('wroad',128,128,(g,w,h)=>{g.fillStyle='#3a3d42';g.fillRect(0,0,w,h);for(let i=0;i<1800;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},255,${rnd(0,.07)})`;g.fillRect(rnd(0,w),rnd(0,h),1.6,1.6)}
 g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1.2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(rnd(0,w),rnd(0,h));g.lineTo(rnd(0,w),rnd(0,h));g.stroke()}});
const wWalkTex=()=>ctex('wwalk',128,128,(g,w,h)=>{g.fillStyle='#bcbab4';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`rgba(${Math.random()<.5?60:255},${Math.random()<.5?60:255},${Math.random()<.5?60:255},${rnd(.02,.08)})`;g.fillRect(rnd(0,w),rnd(0,h),2,2)}
 g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,w,2);g.fillRect(0,0,2,h);g.fillRect(0,63,w,2);g.fillRect(63,0,2,h)});
const wFenceTex=()=>ctex('wfence',64,64,(g,w,h)=>{for(let x=0;x<64;x+=11){g.fillStyle='#e9e0cc';g.beginPath();g.moveTo(x+1,60);g.lineTo(x+1,10);g.lineTo(x+5.5,3);g.lineTo(x+10,10);g.lineTo(x+10,60);g.fill();g.fillStyle='rgba(0,0,0,.14)';g.fillRect(x+8,10,2,50)}
 g.fillStyle='#b9ac92';g.fillRect(0,18,64,5);g.fillRect(0,44,64,5)});
const wCloudTex=()=>ctex('wcloud',128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(.5,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});

const W_PLASTER=['#ffffff','#f7e9c4','#f4d9b5','#dbe9f3','#e3f1da','#f3d3c8','#efe7d2','#e9e0cb','#eddff0'],W_BRICK=['#ffffff','#f3dcd2','#e9cdbd','#dccbb8'],
 W_ROOF=['#b5482f','#8a3d2c','#5f6973','#42614a','#b8742a','#4a4a4e','#7a5a3c'],W_CAR=['#c0392b','#2c5aa0','#e8e8e8','#2b2b2b','#d4a017','#3e7d4f','#7d8791'];

function buildWorld(scene){
 if(WORLD.built)return;WORLD.built=true;
 const R=wRng(20240611),rr=(a,b)=>a+R()*(b-a),pick=a=>a[Math.floor(R()*a.length)],root=new THREE.Group();scene.add(root);
 const MS={wallP:new THREE.MeshStandardMaterial({map:wFacade('wfacP',false),vertexColors:true,roughness:.92}),wallB:new THREE.MeshStandardMaterial({map:wFacade('wfacB',true),vertexColors:true,roughness:.9}),
  roof:new THREE.MeshStandardMaterial({map:wRoofTex(),vertexColors:true,roughness:.85,side:THREE.DoubleSide}),misc:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}),
  car:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.4}),
  fence:new THREE.MeshStandardMaterial({map:wFenceTex(),vertexColors:true,roughness:.8,alphaTest:.5,side:THREE.DoubleSide}),
  road:new THREE.MeshStandardMaterial({map:wRoadTex(),vertexColors:true,roughness:.92,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}),
  mark:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,polygonOffset:true,polygonOffsetFactor:-8,polygonOffsetUnits:-16}),
  walk:new THREE.MeshStandardMaterial({map:wWalkTex(),vertexColors:true,roughness:.95})};
 for(const k of['wallP','wallB','roof','misc'])MS[k].userData.cast=true;
 WORLD.mats=MS;const WHITE=wc('#ffffff'),WALK=2.2;

 // ---------- bo'sh qoladigan joylar ----------
 const SITES=[[0,8,40],[28,14,40],[-10,12,46],[-10,42,32],[20,60,34],[-35,-25,36],[ARENA.x,ARENA.z,36],[LAKE.x,LAKE.z,LAKE.r+20]];
 const sitesFree=(x0,x1,z0,z1,m)=>{for(const[sx,sz,sr]of SITES){const dx=Math.max(x0-sx,0,sx-x1),dz=Math.max(z0-sz,0,sz-z1);if(dx*dx+dz*dz<(sr+m)*(sr+m))return false}
  return!(x1>-32-m&&x0<32+m&&z1>-160-m&&z0<32+m)};
 // yo'llar: h=1 — x o'qi bo'ylab (z=c), h=0 — z o'qi bo'ylab (x=c)
 const roads=[{h:1,c:-165,a:-175,b:165,w:8},{h:1,c:140,a:-175,b:165,w:8},{h:0,c:90,a:-190,b:165,w:8},{h:0,c:-125,a:-190,b:165,w:8},
  {h:1,c:-100,a:45,b:90,w:6},{h:1,c:105,a:45,b:90,w:6},{h:1,c:-10,a:-125,b:-88,w:6},{h:1,c:-95,a:-125,b:-80,w:6},{h:0,c:10,a:100,b:140,w:6}];
 const rrect=r=>r.h?[r.a,r.b,r.c-r.w/2,r.c+r.w/2]:[r.c-r.w/2,r.c+r.w/2,r.a,r.b];
 const roadsFree=(x0,x1,z0,z1,m)=>{for(const r of roads){const[a,b,c,d]=rrect(r),e=WALK+.3+m;if(x1>a-e&&x0<b+e&&z1>c-e&&z0<d+e)return false}return true};
 const occFree=(x0,x1,z0,z1,m)=>{for(const o of WORLD.occ)if(x1>o[0]-m&&x0<o[1]+m&&z1>o[2]-m&&z0<o[3]+m)return false;return true};
 const isFree=(x0,x1,z0,z1,m=0)=>sitesFree(x0,x1,z0,z1,m)&&roadsFree(x0,x1,z0,z1,m)&&occFree(x0,x1,z0,z1,m);
 const addCol=(x0,x1,z0,z1,h,k,roof)=>WORLD.cols.push({x0,x1,z0,z1,h,k,roof});
 // kesishmalar
 const cross=[];for(const r of roads)if(r.h)for(const q of roads)if(!q.h&&q.c>=r.a&&q.c<=r.b&&r.c>=q.a&&r.c<=q.b)cross.push({h:r,v:q,x:q.c,z:r.c});
 const cutsOf=(r,m)=>{const o=[];for(const c of cross){if(c.h===r)o.push([c.x-c.v.w/2-m,c.x+c.v.w/2+m]);else if(c.v===r)o.push([c.z-c.h.w/2-m,c.z+c.h.w/2+m])}return o};
 const segs=(lo,hi,cuts)=>{let s=[[lo,hi]];for(const[a,b]of cuts){const n=[];for(const[x,y]of s){if(b<=x||a>=y)n.push([x,y]);else{if(a>x)n.push([x,a]);if(b<y)n.push([b,y])}}s=n}return s};
 const rect=(g,x0,z0,x1,z1,y,col,us)=>g.quad([x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],us?[x0/us,z0/us,x1/us,z1/us]:[0,0,1,1],col);

 // ---------- yo'llar, chiziqlar, yo'laklar, piyodalar yo'lagi ----------
 for(const r of roads){const[a,b,c,d]=rrect(r),mx=(a+b)/2,mz=(c+d)/2,g=wg('road',mx,mz);
  rect(g,a,c,b,d,.012,WHITE,6);
  const strip=(s,e,lat,wd,col,gg)=>{if(r.h)rect(gg,s,r.c+lat-wd/2,e,r.c+lat+wd/2,.02,col);else rect(gg,r.c+lat-wd/2,s,r.c+lat+wd/2,e,.02,col)};
  const mk=wg('mark',mx,mz),white=wc('#ececea');
  for(const[s,e]of segs(r.a+4,r.b-4,cutsOf(r,4.8)))for(let p=s;p<e-3;p+=7)strip(p,p+3,0,.14,white,mk);
  for(const[s,e]of segs(r.a,r.b,cutsOf(r,r.w/2>0?1:0)))for(const sd of[-1,1])strip(s,e,sd*(r.w/2-.45),.12,white,mk);
  // yo'laklar (ikki tomonda, kesishmalarda uzilgan)
  const wk=wg('walk',mx,mz);
  for(const sd of[-1,1])for(const[s,e]of segs(r.a,r.b,cutsOf(r,0))){const lo=r.w/2,hi=r.w/2+WALK;
   if(r.h){const z0=r.c+(sd>0?lo:-hi),z1=r.c+(sd>0?hi:-lo);wk.box(s,0,z0,e,.13,z1,WHITE,2)}else{const x0=r.c+(sd>0?lo:-hi),x1=r.c+(sd>0?hi:-lo);wk.box(x0,0,s,x1,.13,e,WHITE,2)}}
 }
 // piyodalar yo'lagi: har kesishmada va bitta yo'l o'rtasida
 const zebra=(r,p)=>{const g=wg('mark',r.h?p:r.c,r.h?r.c:p),n=Math.floor((r.w-1.2)/1),col=wc('#f2f2f0');for(let k=0;k<n;k++){const lat=-r.w/2+.8+k*1+.5;
  if(r.h)rect(g,p-1.6,r.c+lat-.25,p+1.6,r.c+lat+.25,.02,col);else rect(g,r.c+lat-.25,p-1.6,r.c+lat+.25,p+1.6,.02,col)}};
 for(const c of cross){for(const r of[c.h,c.v]){const q=r===c.h?c.v:c.h,p0=r.h?c.x:c.z;for(const sd of[-1,1]){const p=p0+sd*(q.w/2+1.2+1.6);if(p>r.a+4&&p<r.b-4)zebra(r,p)}}}
 zebra(roads[2],-30);zebra(roads[0],-60);

 // ---------- uylar ----------
 const T=k=>[k/4+.002,.002,(k+1)/4-.002,.998];
 function addHouse(cx,cz,th,c){const W=c.nbx*3,D=c.nbz*3,H=c.fl*3,s=Math.round(Math.sin(th)),co=Math.round(Math.cos(th));
  const P=(lx,ly,lz)=>[cx+lx*co+lz*s,ly,cz-lx*s+lz*co],Dv=(lx,ly,lz)=>[lx*co+lz*s,ly,-lx*s+lz*co];
  const wall=wg(c.brick?'wallB':'wallP',cx,cz),roof=wg('roof',cx,cz),misc=wg('misc',cx,cz),tint=wc(c.tint),rtint=wc(c.roofTint);
  const lbox=(x0,y0,z0,x1,y1,z1,col)=>{const A=P(x0,y0,z0),B=P(x1,y1,z1);misc.box(Math.min(A[0],B[0]),y0,Math.min(A[2],B[2]),Math.max(A[0],B[0]),y1,Math.max(A[2],B[2]),wc(col))};
  const tileFor=(f,i,front)=>{if(c.style===2)return front&&f===0&&i===c.doorBay?1:(R()<.2?3:2);if(front&&f===0&&i===c.doorBay)return 1;return R()<.14?2:(c.style===1?0:(R()<.1?3:0))};
  for(let f=0;f<c.fl;f++){const y0=f*3,y1=y0+3;
   for(let i=0;i<c.nbx;i++){const x0=-W/2+i*3;
    wall.quad(P(x0,y0,D/2),P(x0+3,y0,D/2),P(x0+3,y1,D/2),P(x0,y1,D/2),T(tileFor(f,i,true)),tint);
    wall.quad(P(x0+3,y0,-D/2),P(x0,y0,-D/2),P(x0,y1,-D/2),P(x0+3,y1,-D/2),T(tileFor(f,i,false)),tint)}
   for(let j=0;j<c.nbz;j++){const z0=-D/2+j*3;
    wall.quad(P(W/2,y0,z0+3),P(W/2,y0,z0),P(W/2,y1,z0),P(W/2,y1,z0+3),T(tileFor(f,-1,false)),tint);
    wall.quad(P(-W/2,y0,z0),P(-W/2,y0,z0+3),P(-W/2,y1,z0+3),P(-W/2,y1,z0),T(tileFor(f,-1,false)),tint)}}
  lbox(-W/2-.03,0,-D/2-.03,W/2+.03,.4,D/2+.03,'#8d8a84');
  let rh=0,rax='x',half=0;
  if(c.style===1){ // yassi tom + parapet
   const q=.12;roof.quad(P(-W/2-q,H,D/2+q),P(W/2+q,H,D/2+q),P(W/2+q,H,-D/2-q),P(-W/2-q,H,-D/2-q),[0,0,W/2.4,D/2.4],rtint,Dv(0,1,0));
   for(const[x0,z0,x1,z1]of[[-W/2,D/2-.2,W/2,D/2],[-W/2,-D/2,W/2,-D/2+.2],[-W/2,-D/2,-W/2+.2,D/2],[W/2-.2,-D/2,W/2,D/2]])lbox(x0,H,z0,x1,H+.55,z1,'#d3cec4');
   lbox(-1.2,H,-1,1.2,H+1.6,1,'#b9b4aa')}
  else{const alx=c.gf?false:true,A=alx?W:D,Bs=alx?D:W,o=.55;rh=c.rh;const tn=rh/(Bs/2),Ao=A/2+o,Bo=Bs/2+o,ye=H-o*tn,yr=H+rh,mp=(a,y,b)=>alx?P(a,y,b):P(b,y,a),slope=Math.hypot(Bo,yr-ye);
   roof.quad(mp(-Ao,ye,Bo),mp(Ao,ye,Bo),mp(Ao,yr,0),mp(-Ao,yr,0),[0,0,Ao*2/2.4,slope/2.4],rtint);
   roof.quad(mp(Ao,ye,-Bo),mp(-Ao,ye,-Bo),mp(-Ao,yr,0),mp(Ao,yr,0),[0,0,Ao*2/2.4,slope/2.4],rtint);
   for(const sg of[-1,1]){const a=sg*A/2;wall.tri(mp(a,H,-Bs/2),mp(a,H,Bs/2),mp(a,yr,0),[T(2)[0],T(2)[1],T(2)[2],T(2)[1],(T(2)[0]+T(2)[2])/2,T(2)[3]],tint,Dv(alx?sg:0,0,alx?0:sg))}
   rax=(alx===(Math.abs(s)===0))?'x':'z';half=Bs/2+o;
   if(c.chimney){const a=alx?W*.27:D*.27;const[x,,z]=mp(a,0,0);lbox2(x,z)}
   function lbox2(x,z){misc.box(x-.3,H+rh*.3,z-.3,x+.3,H+rh+.9,z+.3,wc('#8a4b3b'))}}
  if(c.style!==2){lbox(-1.1+(-W/2+(c.doorBay+.5)*3),2.55,D/2,1.1+(-W/2+(c.doorBay+.5)*3),2.68,D/2+1.1,'#dedad0');lbox(-.9+(-W/2+(c.doorBay+.5)*3),0,D/2,.9+(-W/2+(c.doorBay+.5)*3),.14,D/2+.7,'#aaa59b')}
  // to'qnashuv qutisi
  const A=P(-W/2-.3,0,-D/2-.3),B=P(W/2+.3,0,D/2+.3);addCol(Math.min(A[0],B[0]),Math.max(A[0],B[0]),Math.min(A[2],B[2]),Math.max(A[2],B[2]),H+rh,'house',rh?{ax:rax,cx,cz,H,rh,half}:null);
  return{P}}
 // panjara / past devor
 function fenceSeg(xa,za,xb,zb,style){const mx=(xa+xb)/2,mz=(za+zb)/2,L=Math.hypot(xb-xa,zb-za);if(L<.3)return;
  if(style===0){wg('fence',mx,mz).quad([xa,0,za],[xb,0,zb],[xb,1.15,zb],[xa,1.15,za],[0,0,L,1],wc('#f1ead8'));
   const n=Math.ceil(L/2.5),m=wg('misc',mx,mz);for(let k=0;k<=n;k++){const t=k/n,x=xa+(xb-xa)*t,z=za+(zb-za)*t;m.box(x-.06,0,z-.06,x+.06,1.28,z+.06,wc('#cfc7b2'))}}
  else{wg('misc',mx,mz).box(Math.min(xa,xb)-.15,0,Math.min(za,zb)-.15,Math.max(xa,xb)+.15,1.05,Math.max(za,zb)+.15,wc(style===1?'#d9d3c3':'#b5aea0'))}
  addCol(Math.min(xa,xb)-.12,Math.max(xa,xb)+.12,Math.min(za,zb)-.12,Math.max(za,zb)+.12,style===0?1.2:1.05,'fence')}
 const trees=[];const addTree=(x,z,ty,s)=>trees.push({x,z,ty,s,r:R()*6.28,c:[rr(.82,1.12),rr(.9,1.1),rr(.82,1.05)]});
 function tryHouse(cx,cz,th,c,fenceOn){const W=c.nbx*3,D=c.nbz*3,s=Math.round(Math.sin(th)),co=Math.round(Math.cos(th)),m=2.2,fm=3.5,
   P=(lx,lz)=>[cx+lx*co+lz*s,cz-lx*s+lz*co],a=P(-W/2-m,-D/2-m),b=P(W/2+m,D/2+fm);
  const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),z0=Math.min(a[1],b[1]),z1=Math.max(a[1],b[1]);
  if(!isFree(x0,x1,z0,z1,.8))return false;WORLD.occ.push([x0,x1,z0,z1]);addHouse(cx,cz,th,c);
  if(fenceOn!==2){const gx=-W/2+(c.doorBay+.5)*3,X=W/2+m,Zb=-D/2-m,Zf=D/2+fm,seg=(ax,az,bx,bz)=>{const p=P(ax,az),q=P(bx,bz);fenceSeg(p[0],p[1],q[0],q[1],fenceOn)};
   seg(-X,Zb,X,Zb);seg(-X,Zb,-X,Zf);seg(X,Zb,X,Zf);seg(-X,Zf,gx-1.3,Zf);seg(gx+1.3,Zf,X,Zf)}
  const nt=R()<.65?1+(R()<.5?1:0):0;for(let k=0;k<nt;k++){const sd=R()<.5?-1:1,p=P(sd*(W/2+1.2),rr(-D/2,D/2));addTree(p[0],p[1],R()<.2?1:0,rr(.7,1.1))}
  return true}
 function newCfg(){const q=R(),c={brick:R()<.38,doorBay:0,gf:R()<.3,chimney:R()<.55,rh:rr(1.9,3.2)};
  if(q<.1){c.style=1;c.fl=3+(R()<.4?1:0);c.nbx=4+Math.floor(R()*3);c.nbz=3;c.gf=false;c.chimney=false}
  else if(q<.22){c.style=2;c.fl=1;c.nbx=3+Math.floor(R()*3);c.nbz=2+Math.floor(R()*2);c.rh=1.2;c.chimney=false}
  else{c.style=0;c.fl=R()<.55?1:2;const k=R();c.nbx=k<.15?2:k<.5?3:k<.85?4:5;c.nbz=2+Math.floor(R()*3)}
  c.doorBay=Math.floor((c.nbx-1)/2);c.tint=c.brick?pick(W_BRICK):pick(W_PLASTER);c.roofTint=c.style===1?'#8f8f8c':pick(W_ROOF);return c}
 for(const r of roads){const lo=r.a+12,hi=r.b-12;for(const sd of[-1,1]){let t=lo;while(t<hi){const c=newCfg(),W=c.nbx*3,D=c.nbz*3,lotW=W+4.4;
   if(R()<.3){t+=lotW+rr(1,4);continue}
   const off=r.w/2+WALK+.8+3.5+D/2+rr(0,3.5),tc=t+lotW/2;let ok;
   if(r.h)ok=tryHouse(tc,r.c+sd*off,sd>0?Math.PI:0,c,R()<.75?(R()<.6?0:1):2);else ok=tryHouse(r.c+sd*off,tc,-sd*Math.PI/2,c,R()<.75?(R()<.6?0:1):2);
   t+=ok?lotW+rr(.5,5):5}}}

 // ---------- elektr ustunlari va simlari, skameykalar ----------
 const poles=[],wires=[];
 for(const r of roads.slice(0,4)){const lat=r.w/2+WALK+.5,list=[];const cuts=cutsOf(r,r.w/2),ok=p=>!cuts.some(([a,b])=>p>a-1&&p<b+1);
  for(let p=r.a+14;p<r.b-8;p+=rr(28,34)){if(!ok(p))continue;const x=r.h?p:r.c+lat,z=r.h?r.c+lat:p;if(!sitesFree(x-.3,x+.3,z-.3,z+.3,2))continue;list.push({x,z,p})}
  for(const q of list){const g=wg('misc',q.x,q.z);g.prism(q.x,q.z,.14,0,8.6,8,wc('#6b5a48'));
   if(r.h)g.box(q.x-.07,7.9,q.z-1,q.x+.07,8.05,q.z+1,wc('#5a4a3a'));else g.box(q.x-1,7.9,q.z-.07,q.x+1,8.05,q.z+.07,wc('#5a4a3a'));
   for(const o of[-.9,0,.9])g.box(r.h?q.x-.04:q.x+o-.04,8.05,r.h?q.z+o-.04:q.z-.04,r.h?q.x+.04:q.x+o+.04,8.2,r.h?q.z+o+.04:q.z+.04,wc('#c8c8c8'));
   addCol(q.x-.2,q.x+.2,q.z-.2,q.z+.2,8.6,'pole');poles.push(q)}
  for(let k=0;k+1<list.length;k++){const A=list[k],B=list[k+1];if(B.p-A.p>40)continue;
   for(const o of[-.9,0,.9]){let px=A.x,pz=A.z,qx=B.x,qz=B.z;if(r.h){pz+=o;qz+=o}else{px+=o;qx+=o}
    let prev=null;for(let i=0;i<=8;i++){const t=i/8,x=px+(qx-px)*t,z=pz+(qz-pz)*t,y=8.15-Math.sin(t*Math.PI)*.7;if(prev)wires.push(prev[0],prev[1],prev[2],x,y,z);prev=[x,y,z]}}}}
 if(wires.length){const wgm=new THREE.BufferGeometry();wgm.setAttribute('position',new THREE.Float32BufferAttribute(wires,3));root.add(new THREE.LineSegments(wgm,new THREE.LineBasicMaterial({color:'#1c1c1e'})))}
 // skameykalar
 for(let n=0,tries=0;n<7&&tries<80;tries++){const r=roads[Math.floor(R()*4)],sd=R()<.5?-1:1,p=rr(r.a+20,r.b-20);if(cutsOf(r,r.w/2+4).some(([a,b])=>p>a&&p<b))continue;
  const lat=sd*(r.w/2+1.2),x=r.h?p:r.c+lat,z=r.h?r.c+lat:p;if(!sitesFree(x-1,x+1,z-1,z+1,2))continue;
  const g=wg('misc',x,z),bx=(x0,y0,z0,x1,y1,z1,col)=>r.h?g.box(x+x0,y0,z+z0,x+x1,y1,z+z1,wc(col)):g.box(x+z0,y0,z+x0,x+z1,y1,z+x1,wc(col));
  const back=sd; // yo'ldan uzoq tomon
  bx(-.85,.42,-.22,.85,.48,.22,'#8a5a35');bx(-.85,.55,back*.2-.03,.85,.95,back*.2+.03,'#8a5a35');for(const lx of[-.7,.7])bx(lx-.04,.13,-.18,lx+.04,.42,.18,'#2e2e2e');
  addCol(r.h?x-.9:x-.3,r.h?x+.9:x+.3,r.h?z-.3:z-.9,r.h?z+.3:z+.9,.95,'bench');n++}
 // to'xtab turgan mashinalar
 for(let n=0,tries=0;n<9&&tries<120;tries++){const r=roads[Math.floor(R()*roads.length)],sd=R()<.5?-1:1,p=rr(r.a+15,r.b-15);if(cutsOf(r,r.w/2+9).some(([a,b])=>p>a&&p<b))continue;
  const lat=sd*(r.w/2-1.35),x=r.h?p:r.c+lat,z=r.h?r.c+lat:p,hx=r.h?2.2:1,hz=r.h?1:2.2;if(!sitesFree(x-hx,x+hx,z-hz,z+hz,3))continue;
  let hit=false;for(const c of WORLD.cols)if(c.k==='car'&&x+hx>c.x0-2&&x-hx<c.x1+2&&z+hz>c.z0-2&&z-hz<c.z1+2){hit=true;break}if(hit)continue;
  const g=wg('car',x,z),body=wc(pick(W_CAR)),bx=(x0,y0,z0,x1,y1,z1,col)=>r.h?g.box(x+x0,y0,z+z0,x+x1,y1,z+z1,col):g.box(x+z0,y0,z+x0,x+z1,y1,z+x1,col);
  bx(-2.15,.3,-.9,2.15,.95,.9,body);bx(-1.25,.95,-.82,1.05,1.45,.82,wc('#1e2b38'));bx(-1.15,1.45,-.8,.95,1.5,.8,body);
  for(const lx of[-1.35,1.35])for(const lz of[-.82,.82])bx(lx-.32,0,lz-.13,lx+.32,.64,lz+.13,wc('#151515'));
  addCol(x-hx,x+hx,z-hz,z+hz,1.5,'car');n++}

 // ---------- daraxtlar: yo'l bo'yida, hovlilarda va uzoq o'rmon ----------
 for(const r of roads.slice(0,4)){const cuts=cutsOf(r,r.w/2+3);for(let p=r.a+8;p<r.b-8;p+=rr(14,26)){if(cuts.some(([a,b])=>p>a&&p<b))continue;const sd=R()<.5?-1:1,lat=sd*(r.w/2+1.1),x=r.h?p:r.c+lat,z=r.h?r.c+lat:p;
  if(sitesFree(x-1,x+1,z-1,z+1,3)&&!WORLD.cols.some(c=>c.k==='pole'&&Math.abs(c.x0-x)<1.2&&Math.abs(c.z0-z)<1.2))addTree(x,z,R()<.35?2:0,rr(.8,1.15))}}
 for(let n=0,tries=0;n<190&&tries<1200;tries++){const a=R()*6.2832,d=rr(70,470),x=Math.cos(a)*d,z=Math.sin(a)*d;if(!isFree(x-2,x+2,z-2,z+2,2))continue;const q=R();addTree(x,z,q<.5?1:q<.85?0:2,rr(.8,1.8));n++}

 const GM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),mkTree=parts=>{const ps=[],ns=[],cs=[];for(const[g0,col]of parts){const g=g0.index?g0.toNonIndexed():g0,p=g.attributes.position,n=g.attributes.normal,cc=wc(col);for(let i=0;i<p.count;i++){ps.push(p.getX(i),p.getY(i),p.getZ(i));ns.push(n.getX(i),n.getY(i),n.getZ(i));cs.push(cc.r,cc.g,cc.b)}}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));G.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));return G};
 const sph=(r,w,h,sx,sy,sz,x,y,z)=>new THREE.SphereGeometry(r,w,h).scale(sx,sy,sz).translate(x,y,z),trunk=(h,r0,r1)=>new THREE.CylinderGeometry(r0,r1,h,7,1,true).translate(0,h/2,0);
 const TG=[mkTree([[trunk(2.6,.16,.27),'#5b4636'],[sph(2.1,8,6,1,.9,1,0,4.3,0),'#3f7a34'],[sph(1.5,7,5,1,1,1,1.1,3.5,.6),'#4c8a3a'],[sph(1.4,7,5,1,1,1,-1,3.7,-.5),'#376d2f']]),
  mkTree([[trunk(1.8,.15,.22),'#4d3b2d'],[new THREE.ConeGeometry(2.4,3,8,1,true).translate(0,3.1,0),'#2d5a30'],[new THREE.ConeGeometry(1.9,2.7,8,1,true).translate(0,4.9,0),'#2a5230'],[new THREE.ConeGeometry(1.3,2.4,8,1,true).translate(0,6.6,0),'#2f6034']]),
  mkTree([[trunk(2.2,.12,.2),'#5b4636'],[sph(1.1,7,6,.85,3.4,.85,0,5.6,0),'#5f9238']])];
 const groups=new Map(),Mx=new THREE.Matrix4(),Qt=new THREE.Quaternion(),Sc=new THREE.Vector3(),Ps=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
 for(const t of trees){const k=t.ty+'|'+Math.floor(t.x/200)+','+Math.floor(t.z/200);let a=groups.get(k);if(!a)groups.set(k,a=[]);a.push(t)}
 for(const[k,a]of groups){const ty=+k[0],im=new THREE.InstancedMesh(TG[ty],GM,a.length),col=new THREE.Color();
  a.forEach((t,i)=>{Qt.setFromAxisAngle(UP,t.r);Sc.set(t.s*(ty===2?.9:1),t.s*(ty===2?1.1:1),t.s*(ty===2?.9:1));Ps.set(t.x,0,t.z);Mx.compose(Ps,Qt,Sc);im.setMatrixAt(i,Mx);col.setRGB(t.c[0],t.c[1],t.c[2]);im.setColorAt(i,col)});
  im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();root.add(im)}

 // ---------- tepaliklar (uzoqda, tuman bilan) ----------
 for(const[r0,r1,sd,c1,c2,am]of[[540,1000,1,'#5f7f4a','#8c9b6c',1],[840,1340,2.3,'#7d97a0','#a9bac6',1.5]]){const NA=200,NR=6,pos=[],col=[],idx=[],ca=wc(c1),cb=wc(c2),cc=new THREE.Color();
  for(let j=0;j<=NR;j++)for(let i=0;i<=NA;i++){const a=i/NA*6.2832,t=j/NR,rad=r0+(r1-r0)*t,pr=Math.pow(Math.sin(Math.PI*Math.pow(t,.85)),1.4),
   A=Math.max(12,(52+34*Math.sin(3*a+sd)+22*Math.sin(7*a+2*sd)+11*Math.sin(13*a+3*sd))*am),y=pr*A;pos.push(Math.cos(a)*rad,y,Math.sin(a)*rad);cc.copy(ca).lerp(cb,Math.min(1,y/(A*.9)));col.push(cc.r,cc.g,cc.b)}
  for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){const a=j*(NA+1)+i,b=a+1,c=a+NA+1,d=c+1;idx.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  root.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})))}

 // ---------- bulutlar ----------
 const cmat=new THREE.SpriteMaterial({map:wCloudTex(),transparent:true,opacity:.92,depthWrite:false});
 for(let i=0;i<16;i++){const g=new THREE.Group(),a=R()*6.2832,d=rr(150,1100),n=4+Math.floor(R()*4);g.position.set(Math.cos(a)*d,rr(190,380),Math.sin(a)*d);
  for(let k=0;k<n;k++){const s=new THREE.Sprite(cmat),sz=rr(70,150);s.scale.set(sz*1.5,sz*.6,1);s.position.set((k-n/2)*rr(35,60),rr(-8,12),rr(-30,30));g.add(s)}
  g.userData.v=rr(1.5,4);root.add(g);WORLD.clouds.push(g)}

 // ---------- birlashtirilgan katak meshlari ----------
 for(const[k,g]of WORLD.ch){const m=g.mesh(MS[k.split('|')[0]]);root.add(m)}
 WORLD.ch.clear();WORLD.root=root}

function worldTick(dt){for(const c of WORLD.clouds){c.position.x+=c.userData.v*dt;if(c.position.x>1300)c.position.x=-1300}}

// To'qnashuv: havo apparatlari (dron, samolyot, vertolyot) halokatga uchraydi; yerdagilar to'siqdan ushlanadi
function worldCollide(S){if(!WORLD.built)return;const ty=S.B.type,fly=ty==='free'&&S.fmode==='fly',air=ty==='copter'||ty==='plane'||ty==='heli'||fly,gnd=ty==='car'||ty==='tank'||ty==='robot'||(ty==='free'&&!fly);
 if(!air&&!gnd)return;const p=S.pos,r=clamp(S.size*(air?.26:.3),.15,2),cols=WORLD.cols;
 if(air){if(S.fail){S.wp=null;return}const p0=S.wp||p;
  for(let k=1;k<=2;k++){const x=p0.x+(p.x-p0.x)*k/2,y=p0.y+(p.y-p0.y)*k/2+S.size*.12,z=p0.z+(p.z-p0.z)*k/2;
   for(const c of cols){if(x<c.x0-r||x>c.x1+r||z<c.z0-r||z>c.z1+r)continue;let top=c.h;
    if(c.roof){const d=c.roof.ax==='x'?z-c.roof.cz:x-c.roof.cx;top=c.roof.H+c.roof.rh*(1-Math.min(1,Math.abs(d)/c.roof.half))}
    if(y-r*.5>=top)continue;
    const sp=Math.max(S.vel.length(),S.vh?S.vh.length():0),nm={house:'Uyga urildi',fence:'Panjaraga urildi',pole:'Elektr ustuniga urildi',car:"Yo'ldagi mashinaga urildi",bench:'Skameykaga urildi'}[c.k]||"To'siqqa urildi";
    // devordan tashqariga chiqarish (uyning ichida qolib ketmasin)
    const dl=x-(c.x0-r),dr=(c.x1+r)-x,df=z-(c.z0-r),db=(c.z1+r)-z,m=Math.min(dl,dr,df,db);
    if(m===dl)p.x=c.x0-r;else if(m===dr)p.x=c.x1+r;else if(m===df)p.z=c.z0-r;else p.z=c.z1+r;
    S.vel.multiplyScalar(.1);if(S.vh)S.vh.multiplyScalar(.1);S.wp=null;
    crash(S,sp>.5?`${nm} (${fmt(sp*3.6)} km/soat tezlikda).`:nm+'.');return}}
  S.wp=p.clone();return}
 for(const c of cols){if(c.h<.06||p.y>c.h)continue;if(p.x<c.x0-r||p.x>c.x1+r||p.z<c.z0-r||p.z>c.z1+r)continue;
  const cx=clamp(p.x,c.x0,c.x1),cz=clamp(p.z,c.z0,c.z1);let dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);
  if(d>=r)continue;
  if(d<1e-5){const dl=p.x-c.x0,dr=c.x1-p.x,df=p.z-c.z0,db=c.z1-p.z,m=Math.min(dl,dr,df,db);
   if(m===dl){p.x=c.x0-r;dx=-1;dz=0}else if(m===dr){p.x=c.x1+r;dx=1;dz=0}else if(m===df){p.z=c.z0-r;dx=0;dz=-1}else{p.z=c.z1+r;dx=0;dz=1}}
  else{dx/=d;dz/=d;p.x=cx+dx*r;p.z=cz+dz*r}
  if(S.vel.x*dx+S.vel.z*dz<0){S.vel.set(0,S.vel.y,0);if(S.spd!==undefined)S.spd=0;if(S.vL!==undefined){S.vL=0;S.vR=0}}
  if(!S.fail&&S.t-(S.hitT===undefined?-9:S.hitT)>2.5){S.hitT=S.t;S.status="To'siqqa tegdingiz (uy, panjara yoki mashina). Orqaga qayting."}}}
