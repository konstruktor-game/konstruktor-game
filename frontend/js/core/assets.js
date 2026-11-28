/* =====================================================================
   BLENDER MODELLARI: tools/blender/make_models.py yasagan frontend/models/*.json fayllarini o'qiydi.
   Har bir qism (masalan: Qanot, Vtulka) alohida mesh bo'ladi va yasash stolida alohida bosqich sifatida chiqadi.
   Model yuklanmasa yoki xato bo'lsa — get() null qaytaradi va detal dastur ichida (protsedura bilan) chiziladi.
   ===================================================================== */
'use strict';
const ASSETS=(()=>{const cache={},wait={};
 const b64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer};
 function parse(js){return js.parts.map(p=>{const q=p.q||1,pi=new Int16Array(b64(p.pos)),pos=new Float32Array(pi.length);for(let i=0;i<pi.length;i++)pos[i]=pi[i]*q;
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(new Int8Array(b64(p.nrm)),3,true));
   g.setIndex(new THREE.BufferAttribute(p.i32?new Uint32Array(b64(p.idx)):new Uint16Array(b64(p.idx)),1));g.computeBoundingSphere();
   const col=new THREE.Color().setRGB(p.col[0],p.col[1],p.col[2],THREE.LinearSRGBColorSpace);return{name:p.name,mat:p.mat||'',ord:p.ord,geo:g,col,metal:p.metal,rough:p.rough}})}
 function load(name){if(cache[name]!==undefined)return Promise.resolve(cache[name]);if(wait[name])return wait[name];
  return wait[name]=fetch(`models/${name}.json`,{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(js=>cache[name]=js&&js.v===1?parse(js):null).catch(()=>cache[name]=null)}
 // tint: {qism nomi: rang} yoki {'mat:material': rang} — foydalanuvchi tanlagan rang bilan almashtiriladi
 function get(name,tint){const P=cache[name];if(!P)return null;const g=new THREE.Group();
  for(const p of P){const tc=tint&&(tint['mat:'+p.mat]||tint[p.name]),key=`asset:${name}:${p.name}:${p.mat}:${tc||''}`;
   const m=new THREE.Mesh(p.geo,MAT(key,()=>new THREE.MeshPhysicalMaterial({color:tc?new THREE.Color(tc):p.col,metalness:p.metal,roughness:p.rough,clearcoat:p.metal>.3?.1:.35,clearcoatRoughness:.3})));
   m.castShadow=true;m.receiveShadow=true;g.add(typeof tagP==='function'?tagP(m,p.name,p.ord):m)}g.userData.blender=name;return g}
 const ready=n=>!!cache[n];
 return{load,get,ready}})();
window.ASSETS=ASSETS;
// barcha turlar uchun (parrak va g'ildirak) modellarni oldindan yuklab, tayyor bo'lgach modelni qayta chizamiz
Promise.all(['prop2','prop3','wheel','motor'].map(n=>ASSETS.load(n))).then(()=>{if(typeof B!=='undefined'&&B&&typeof rebuild==='function')rebuild()});
