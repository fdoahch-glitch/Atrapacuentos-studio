/* 📦 Paquetes: tus propias colecciones de elementos y escenas (Jungla, Granja, Espacio…).
   - Importar un .zip con modelos (.glb/.gltf/imágenes) de Kenney, Quaternius, KayKit, etc.
   - Crear paquetes vacíos y subirles assets sueltos.
   - Guardar la escena actual dentro del paquete y reutilizarla después.
   Todo queda guardado en esta PC (IndexedDB), también en el programa de escritorio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const enc=new TextEncoder(),dec=new TextDecoder();
const CATS=[["personaje","🧍 Personajes y animales"],["arbol","🌳 Árboles"],["planta","🌿 Plantas"],["roca","⛰️ Rocas"],["casa","🏠 Casas"],["nave","🚀 Naves y vehículos"],["espacio","🪐 Espacio"],["objeto","🎒 Objetos"]];
const ALTO={personaje:3,arbol:7,planta:1.4,roca:2.5,casa:6,nave:4,espacio:6,objeto:2.5};
const TEMAS=[["","Ninguno"],["bosque","Bosque"],["selva","Selva"],["desierto","Desierto"],["frio","Nieve"],["espacio","Espacio"],["mar","Mar y piratas"],["ciudad","Ciudad"],["magia","Reino mágico"],["prehi","Prehistórico"],["cueva","Cueva"],["granja","Granja"],["africa","Sabana"]];
let loaded=false,db=null,packs=[],assets=[],scenes=[],cur=null,filtro="",ready=null;

/* ---------- IndexedDB ---------- */
function openDB(){
  return new Promise((ok,no)=>{
    const r=indexedDB.open("atr2_packs",1);
    r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore("packs",{keyPath:"id"});d.createObjectStore("assets",{keyPath:"id"});d.createObjectStore("scenes",{keyPath:"id"});d.createObjectStore("blobs",{keyPath:"id"});};
    r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
  });
}
function tx(store,mode,fn){return new Promise((ok,no)=>{const t=db.transaction(store,mode),s=t.objectStore(store);let out;try{out=fn(s);}catch(e){no(e);return;}t.oncomplete=()=>ok(out&&out.result!==undefined?out.result:out);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error);});}
const put=(store,v)=>tx(store,"readwrite",s=>s.put(v));
const del=(store,k)=>tx(store,"readwrite",s=>s.delete(k));
const all=store=>new Promise((ok,no)=>{const r=db.transaction(store,"readonly").objectStore(store).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
const getOne=(store,k)=>new Promise((ok,no)=>{const r=db.transaction(store,"readonly").objectStore(store).get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
async function init(){
  if(ready)return ready;
  ready=(async()=>{
    try{db=await openDB();}catch(e){db=null;return;}
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
    packs=await all("packs");assets=await all("assets");scenes=await all("scenes");
    registrar();
  })().then(()=>{loaded=true;});
  return ready;
}
/* los assets del paquete aparecen en la biblioteca como "mis elementos" */
function mineOf(a){
  const m={id:a.id,nombre:a.nombre,kind:a.kind,cat:a.cat,alto:a.alto,pack:a.pack,pk:true,thumb:a.thumb||null};
  if(a.kind==="img"){m.src=a.src;m.w=a.w;m.h=a.h;}
  return m;
}
function registrar(){
  const S=window.Studio;if(!S)return;
  for(const a of assets){
    const old=S.MINE.find(m=>m.id===a.id);
    if(old){Object.assign(old,mineOf(a));}else S.MINE.push(mineOf(a));
  }
}
const sceneOf=id=>window.Studio&&window.Studio.MINE.find(m=>m.id===id);
/* archivo de un modelo guardado (se pide cuando se coloca) */
const fileCache=new Map();
async function file(id){
  if(fileCache.has(id))return fileCache.get(id);
  await init();const b=await getOne("blobs",id);if(!b)return null;
  const a=assets.find(x=>x.id===id);
  const f=new File([b.data],(a?a.nombre:"modelo")+".glb",{type:"model/gltf-binary"});
  fileCache.set(id,f);return f;
}

/* ---------- lector de .zip ---------- */
async function inflate(u8){
  const ds=new DecompressionStream("deflate-raw"),w=ds.writable.getWriter();w.write(u8);w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
async function readZip(buf){
  const u=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-65600);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break;}}
  if(e<0)throw new Error("Ese archivo no parece un .zip");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),usz=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    let name=dec.decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
    if(name.endsWith("/")||/(^|\/)(__MACOSX|\.DS_Store)/.test(name))continue;
    const lnl=dv.getUint16(off+26,true),lxl=dv.getUint16(off+28,true),ds=off+30+lnl+lxl;
    out.push({name,meth,csz,usz,ds,async data(){const raw=u.subarray(ds,ds+csz);if(meth===0)return raw.slice();if(meth===8)return inflate(raw);throw new Error("Compresión no compatible en "+name);}});
  }
  return out;
}

/* ---------- .gltf + .bin + texturas → un solo .glb ---------- */
const dirOf=p=>p.includes("/")?p.slice(0,p.lastIndexOf("/")+1):"";
function norm(p){const o=[];for(const s of p.split("/")){if(s===".."){o.pop();}else if(s&&s!==".")o.push(s);}return o.join("/");}
async function dataUri(uri){const r=await fetch(uri);return new Uint8Array(await r.arrayBuffer());}
async function gltfToGlb(jsonU8,dir,getFile){
  const j=JSON.parse(dec.decode(jsonU8));const chunks=[];let total=0;
  const add=(u8)=>{const pad=(4-total%4)%4;if(pad){chunks.push(new Uint8Array(pad));total+=pad;}const o=total;chunks.push(u8);total+=u8.length;return o;};
  const bufOff=[];
  for(const b of (j.buffers||[])){
    if(b.uri===undefined){bufOff.push(null);continue;}
    let d=b.uri.startsWith("data:")?await dataUri(b.uri):await getFile(norm(dir+decodeURIComponent(b.uri)));
    if(!d)throw new Error("Falta el archivo "+b.uri);bufOff.push({o:add(d),d});
  }
  const views=j.bufferViews||[];
  views.forEach(v=>{const bo=bufOff[v.buffer];if(bo){v.byteOffset=(v.byteOffset||0)+bo.o;v.buffer=0;}});
  for(const im of (j.images||[])){
    if(im.uri===undefined)continue;
    const d=im.uri.startsWith("data:")?await dataUri(im.uri):await getFile(norm(dir+decodeURIComponent(im.uri)));
    if(!d){delete im.uri;continue;}
    const o=add(d);views.push({buffer:0,byteOffset:o,byteLength:d.length});im.bufferView=views.length-1;
    const ext=(im.uri.startsWith("data:")?(im.uri.match(/data:image\/(\w+)/)||[])[1]:im.uri.split(".").pop()||"").toLowerCase();
    im.mimeType=ext==="jpg"||ext==="jpeg"?"image/jpeg":"image/png";delete im.uri;
  }
  j.bufferViews=views;
  const pad4=(4-total%4)%4;if(pad4){chunks.push(new Uint8Array(pad4));total+=pad4;}
  j.buffers=[{byteLength:total}];
  let js=enc.encode(JSON.stringify(j));const jp=(4-js.length%4)%4;if(jp){const t=new Uint8Array(js.length+jp);t.set(js);t.fill(32,js.length);js=t;}
  const len=12+8+js.length+8+total,out=new Uint8Array(len),dv=new DataView(out.buffer);
  dv.setUint32(0,0x46546C67,true);dv.setUint32(4,2,true);dv.setUint32(8,len,true);
  dv.setUint32(12,js.length,true);dv.setUint32(16,0x4E4F534A,true);out.set(js,20);
  let p=20+js.length;dv.setUint32(p,total,true);dv.setUint32(p+4,0x004E4942,true);p+=8;
  for(const c of chunks){out.set(c,p);p+=c.length;}
  return out;
}

/* ---------- categoría, nombre y tamaño según el nombre del archivo ---------- */
const RX=[
 ["arbol",/(^|[^a-z])(tree|trees|pine|oak|birch|palm|willow|spruce|fir|cypress|baobab|arbol|árbol|pino|palmera)/],
 ["planta",/(grass|bush|flower|plant|fern|mushroom|leaf|shrub|clover|cactus|log|stump|reed|lily|vine|bamboo|hedge|crop|wheat|corn|carrot|pumpkin|planta|flor|hongo|pasto|arbusto|seta|petal|tulip|weed|moss|ivy)/],
 ["roca",/(rock|stone|cliff|boulder|mountain|pebble|crystal|ore|roca|piedra|monta)/],
 ["casa",/(house|building|hut|tent|wall|fence|tower|castle|barn|shop|door|window|bridge|gate|roof|windmill|church|cabin|casa|torre|puente|valla|edificio|skyscraper|market|stall|well)/],
 ["nave",/(ship|boat|car|bus|truck|rocket|plane|train|cart|wagon|ufo|tractor|bike|helicopter|nave|barco|auto|cohete|kayak|canoe|sail)/],
 ["espacio",/(planet|star|moon|asteroid|comet|satellite|planeta|luna|estrella|galaxy)/],
 ["personaje",/(character|human|person|man|woman|adventurer|knight|mage|rogue|skeleton|barbarian|player|npc|cow|pig|horse|sheep|dog|cat|fox|deer|rabbit|bunny|bear|bird|fish|chicken|duck|frog|wolf|tiger|lion|monkey|elephant|dino|rex|penguin|llama|pug|donkey|hog|snake|owl|bat|goat|panda|zebra|giraffe|hippo|crocodile|turtle|shark|whale|dolphin|crab|bee|butterfly|spider|boy|girl|kid|child|animal|alpaca|bull|calf|stag|squirrel|raccoon|hedgehog|mouse|rat|pigeon|parrot|toucan|sloth|gorilla|cube)/]
];
function guess(nombre,path){
  const s=(path||nombre).toLowerCase().replace(/[_\-.]+/g," ");let cat="objeto";
  for(const [c,r] of RX){if(r.test(" "+s)){cat=c;break;}}
  let alto=ALTO[cat];
  if(/flower|tulip|mushroom|seta|hongo|petal|clover|weed|moss/.test(s))alto=.7;
  else if(/grass|pasto|reed|crop|wheat|fern/.test(s))alto=.9;
  else if(/bush|shrub|arbusto|hedge/.test(s))alto=1.6;
  else if(/log|stump|pebble/.test(s))alto=1;
  else if(/cactus/.test(s))alto=3;
  else if(/rabbit|bunny|frog|duck|chicken|mouse|rat|cat\b|bird|bee|butterfly|hedgehog|squirrel/.test(s))alto=1.2;
  else if(/elephant|giraffe|trex|rex|whale/.test(s))alto=5;
  else if(/cow|horse|bull|bear|deer|stag|zebra|hippo/.test(s))alto=2.8;
  return {cat,alto};
}
function limpio(f){
  let n=f.replace(/\.[^.]+$/,"").replace(/[_\-]+/g," ").replace(/([a-z])([A-Z])/g,"$1 $2").replace(/\s+/g," ").trim();
  n=n.charAt(0).toUpperCase()+n.slice(1);return n.slice(0,28)||"Elemento";
}

/* ---------- miniaturas (un motor aparte, uno por vez) ---------- */
let tEng=null,tq=Promise.resolve();
function miniatura(f){
  tq=tq.then(()=>new Promise(async ok=>{
    const B=window.BABYLON;if(!B){ok(null);return;}
    let sc=null,url=null;
    try{
      if(!tEng){const cv=document.createElement("canvas");cv.width=cv.height=160;tEng={cv,eng:new B.Engine(cv,true,{preserveDrawingBuffer:true,alpha:true},false)};}
      sc=new B.Scene(tEng.eng);sc.clearColor=new B.Color4(.87,.93,.97,1);
      new B.HemisphericLight("h",new B.Vector3(.3,1,.4),sc).intensity=.95;
      const dl=new B.DirectionalLight("d",new B.Vector3(-.4,-.8,-.5),sc);dl.intensity=.7;
      url=URL.createObjectURL(f);
      const r=await B.SceneLoader.ImportMeshAsync("",url,"",sc,null,".glb");
      let mn=new B.Vector3(1e9,1e9,1e9),mx=new B.Vector3(-1e9,-1e9,-1e9);
      for(const m of r.meshes){if(!m.getTotalVertices||!m.getTotalVertices())continue;m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;mn=B.Vector3.Minimize(mn,bb.minimumWorld);mx=B.Vector3.Maximize(mx,bb.maximumWorld);}
      r.animationGroups.forEach(g=>g.stop());
      const c=mn.add(mx).scale(.5),rad=Math.max(.01,mx.subtract(mn).length()/2);
      const cam=new B.ArcRotateCamera("c",-Math.PI/2.4,Math.PI/2.6,rad*2.6,c,sc);cam.minZ=rad/50;cam.maxZ=rad*20;
      sc.activeCamera=cam;sc.render();sc.render();
      const out=document.createElement("canvas");out.width=out.height=110;out.getContext("2d").drawImage(tEng.cv,0,0,110,110);
      ok(out.toDataURL("image/jpeg",.8));
    }catch(e){ok(null);}
    finally{try{sc&&sc.dispose();}catch(e){}if(url)URL.revokeObjectURL(url);}
  }));
  return tq;
}

/* ---------- agregar assets ---------- */
function readImg(file){
  return new Promise(ok=>{
    const fr=new FileReader();
    fr.onload=()=>{const im=new Image();im.onload=()=>{
      const k=Math.min(1,1024/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(1,Math.round(im.naturalWidth*k)),h=Math.max(1,Math.round(im.naturalHeight*k));
      const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);ok({src:c.toDataURL("image/png"),w,h});};im.onerror=()=>ok(null);im.src=fr.result;};
    fr.onerror=()=>ok(null);fr.readAsDataURL(file);
  });
}
async function addGlb(pack,u8,nombre,path,over){
  const g=guess(nombre,path),a={id:uid("pk_"),pack:pack.id,nombre,kind:"glb",cat:(over&&over.cat)||g.cat,alto:(over&&over.alto)||g.alto,thumb:null,t:Date.now()};
  const f=new File([u8],nombre+".glb",{type:"model/gltf-binary"});
  a.thumb=await miniatura(f);
  await put("blobs",{id:a.id,data:u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength)});
  await put("assets",a);assets.push(a);return a;
}
async function addImg(pack,file){
  const d=await readImg(file);if(!d)return null;
  const nombre=limpio(file.name),g=guess(nombre);
  const a={id:uid("pk_"),pack:pack.id,nombre,kind:"img",cat:g.cat==="objeto"?"objeto":g.cat,alto:g.alto,src:d.src,w:d.w,h:d.h,thumb:d.src,t:Date.now()};
  await put("assets",a);assets.push(a);return a;
}
/* acepta una lista de archivos (glb, gltf, imágenes o .zip) */
async function importFiles(pack,list,opts){
  opts=opts||{};const st=opts.progress||(()=>{});let n=0,omit=0,fbx=0,fail=0;
  const over=opts.cat?{cat:opts.cat}:null;
  const files=[...list];
  for(const f of files){
    const ext=(f.name.split(".").pop()||"").toLowerCase();
    try{
      if(ext==="zip"){
        st("Leyendo "+f.name+"…");const ents=await readZip(await f.arrayBuffer());
        const byPath=new Map(ents.map(e=>[e.name,e]));
        const getFile=async p=>{const e=byPath.get(p)||ents.find(x=>x.name.toLowerCase()===p.toLowerCase())||ents.find(x=>x.name.split("/").pop()===p.split("/").pop());return e?e.data():null;};
        const meta=byPath.get("pack.json")||ents.find(e=>/(^|\/)pack\.json$/.test(e.name));
        let M=null;if(meta){try{M=JSON.parse(dec.decode(await meta.data()));}catch(e){}}
        const models=ents.filter(e=>/\.(glb|gltf)$/i.test(e.name));
        const seen=new Set();let i=0;
        for(const e of models){
          i++;st("Importando "+i+" de "+models.length+"…");
          const base=e.name.split("/").pop().replace(/\.[^.]+$/,"");
          try{
            let u8;
            if(/\.glb$/i.test(e.name))u8=await e.data();
            else u8=await gltfToGlb(await e.data(),dirOf(e.name),getFile);
            const nombre=limpio(base);
            const mm=M&&M.assets&&M.assets.find(x=>x.archivo===e.name);
            const a=await addGlb(pack,u8,mm?mm.nombre:nombre,e.name,mm?{cat:mm.cat,alto:mm.alto}:over);
            n++;seen.add(a.id);
          }catch(err){fail++;}
        }
        /* imágenes sueltas (solo si el zip es de dibujos, no texturas de un modelo) */
        if(!models.length){
          for(const e of ents.filter(x=>/\.(png|jpe?g|webp)$/i.test(x.name)&&!/preview|sample|thumb/i.test(x.name))){
            const b=new File([await e.data()],e.name.split("/").pop(),{type:/png$/i.test(e.name)?"image/png":"image/jpeg"});
            if(await addImg(pack,b))n++;
          }
        }
        fbx+=ents.filter(e=>/\.(fbx|obj|blend|dae|stl)$/i.test(e.name)).length;
        if(M&&M.escenas){for(const sc of M.escenas){const s={id:uid("sc_"),pack:pack.id,nombre:sc.nombre,data:sc.data,thumb:sc.thumb||null,def:!!sc.def,t:Date.now()};await put("scenes",s);scenes.push(s);}}
        if(M&&M.tema&&!pack.tema){pack.tema=M.tema;await put("packs",pack);}
      }else if(ext==="glb"){
        const nombre=limpio(f.name);await addGlb(pack,new Uint8Array(await f.arrayBuffer()),nombre,f.name,over);n++;
      }else if(ext==="gltf"){
        const u8=await gltfToGlb(new Uint8Array(await f.arrayBuffer()),"",async()=>null);await addGlb(pack,u8,limpio(f.name),f.name,over);n++;
      }else if(/^(png|jpe?g|webp|gif)$/.test(ext)){
        if(await addImg(pack,f))n++;else fail++;
      }else if(/^(fbx|obj|blend|dae|stl)$/.test(ext)){fbx++;}
      else omit++;
    }catch(err){fail++;}
  }
  registrar();
  return {n,omit,fbx,fail};
}

/* ---------- escenas de paquete ---------- */
function escenaActual(){
  const S=window.Studio;S.saveWorld&&S.saveWorld();
  const w=JSON.parse(JSON.stringify(S.proj.mundos[S.proj.mundo]));
  delete w.lineas;delete w.textos;
  if(typeof w.bg==="string"&&w.bg.startsWith("mine:")){const m=S.MINE.find(x=>x.id===w.bg.slice(5));if(m)w.bgMine={id:m.id,nombre:m.nombre,kind:"bg",src:m.src,w:m.w,h:m.h,cat:"fondo"};}
  return w;
}
function miniEscena(){
  try{const s=window.__atr2;s.scene.render();const cv=document.createElement("canvas");cv.width=160;cv.height=90;cv.getContext("2d").drawImage(s.engine.getRenderingCanvas(),0,0,160,90);return cv.toDataURL("image/jpeg",.7);}catch(e){return null;}
}
async function guardarEscena(pack,nombre,def){
  const w=escenaActual();
  if(def)for(const s of scenes.filter(x=>x.pack===pack.id&&x.def)){s.def=false;await put("scenes",s);}
  const s={id:uid("sc_"),pack:pack.id,nombre:nombre||w.nombre||"Escena",data:w,thumb:miniEscena(),def:!!def,t:Date.now()};
  await put("scenes",s);scenes.push(s);return s;
}
/* usa una escena del paquete: "reemplazar" la escena actual o "sumar" sus elementos a la actual */
function usarEscena(s,modo){
  const S=window.Studio,w=JSON.parse(JSON.stringify(s.data));
  if(w.bgMine&&!S.MINE.find(m=>m.id===w.bgMine.id))S.MINE.push(Object.assign({},w.bgMine));
  if(modo==="reemplazar"){
    const cur=S.proj.mundos[S.proj.mundo];w.nombre=cur.nombre;w.dur=cur.dur||w.dur;w.lineas=cur.lineas;w.textos=cur.textos;
    S.proj.mundos[S.proj.mundo]=w;S.gotoRebuild(S.proj.mundo);
  }else{
    for(const o of w.items||[]){
      if(o.mine&&!S.MINE.find(m=>m.id===o.mine.id))S.MINE.push(Object.assign({},o.mine));
      S.place(o.id,{over:o.over,x:o.x,z:o.z,y:o.y===null?undefined:o.y,ry:o.ry,anim:o.anim,mov:o.mov,talk:o.talk,pose:o.pose,emo:o.emo,quiet:true});
    }
    S.changed();
  }
}
/* escena por defecto de un tema: se usa al crear una escena nueva de ese tema */
function porDefecto(tema){
  for(const p of packs){if(p.tema!==tema)continue;const s=scenes.find(x=>x.pack===p.id&&x.def);if(s)return {pack:p,escena:s};}
  return null;
}
function assetsDeTema(tema){const ids=new Set(packs.filter(p=>p.tema===tema).map(p=>p.id));return assets.filter(a=>ids.has(a.pack));}

/* ---------- exportar un paquete (copia de seguridad / para compartir) ---------- */
async function exportar(pack){
  const files=[],A=assets.filter(a=>a.pack===pack.id),meta={nombre:pack.nombre,tema:pack.tema||"",assets:[],escenas:[]},used=new Set();
  for(const a of A){
    if(a.kind==="glb"){
      const b=await getOne("blobs",a.id);if(!b)continue;
      let nm=a.nombre.replace(/[^\w\- ]+/g,"_"),k=nm,i=2;while(used.has(k)){k=nm+"_"+i++;}used.add(k);
      const path="modelos/"+k+".glb";files.push({name:path,data:new Uint8Array(b.data)});meta.assets.push({archivo:path,nombre:a.nombre,cat:a.cat,alto:a.alto});
    }else{
      const bin=atob(a.src.split(",")[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      files.push({name:"dibujos/"+a.nombre.replace(/[^\w\- ]+/g,"_")+".png",data:u});
    }
  }
  for(const s of scenes.filter(x=>x.pack===pack.id))meta.escenas.push({nombre:s.nombre,data:s.data,thumb:s.thumb,def:s.def});
  files.push({name:"pack.json",data:enc.encode(JSON.stringify(meta))});
  files.push({name:"LEEME.txt",data:enc.encode("Paquete de Atrapacuentos Studio: «"+pack.nombre+"».\nPara usarlo: 📦 Paquetes → Importar paquete (.zip) y elige este archivo.\n")});
  window.DubX.dl(window.DubX.zip(files),pack.nombre.replace(/[^\w\-]+/g,"_")+".paquete.zip");
}

/* ---------- panel dentro de la biblioteca ---------- */
function msg(t){const S=window.Studio;if(S&&S.say)S.say(t);}
function el(h){const d=document.createElement("div");d.innerHTML=h;return d.firstElementChild;}
function pedir(types,multi,cb){
  const i=document.createElement("input");i.type="file";i.accept=types;i.multiple=!!multi;i.style.display="none";document.body.appendChild(i);
  i.onchange=()=>{const l=[...i.files];i.remove();if(l.length)cb(l);};i.click();
}
function barra(body,txt){let b=body.querySelector(".pkProg");if(!b){b=el('<div class="pkProg" style="position:sticky;top:0;background:#3c3560;border-radius:8px;padding:8px;margin:6px 0;z-index:2"></div>');body.prepend(b);}b.textContent=txt;return b;}
async function correr(body,pack,files,opts){
  const b=barra(body,"Preparando…");
  const r=await importFiles(pack,files,Object.assign({progress:t=>{b.textContent=t;}},opts||{}));
  b.remove();
  let t="Listo: "+r.n+" elemento"+(r.n===1?"":"s")+" agregado"+(r.n===1?"":"s")+" a «"+pack.nombre+"».";
  if(r.fbx)t+=" "+r.fbx+" archivo(s) FBX/OBJ no se pueden usar: busca la versión GLB o glTF del paquete.";
  if(r.fail)t+=" "+r.fail+" no se pudieron leer.";
  if(!r.n&&!r.fbx&&!r.fail)t="No encontré modelos ni imágenes en lo que elegiste.";
  msg(t);render(body);window.Studio.rerender&&window.Studio.rerender();
}
function render(body){
  if(!loaded){body.textContent="Cargando paquetes…";init().then(()=>{loaded=true;render(body);});return;}
  if(!db){body.innerHTML='<div style="padding:12px;opacity:.85">Este navegador no permite guardar paquetes (IndexedDB bloqueado). Prueba abrir el Studio fuera de una ventana privada.</div>';return;}
  body.innerHTML="";
  if(cur&&!packs.find(p=>p.id===cur))cur=null;
  if(!cur)return vistaLista(body);
  vistaPack(body,packs.find(p=>p.id===cur));
}
function vistaLista(body){
  const S=window.Studio;
  body.appendChild(el('<div style="opacity:.85;font-size:12px;margin:2px 0 8px">Tus colecciones. Crea un paquete (por ejemplo «Jungla»), súbele modelos y guarda ahí tus escenas para reutilizarlas.</div>'));
  const g=el('<div id="grid"></div>');
  const add=(l,e,f)=>{const t=el('<div class="tile add"><big>'+e+'</big>'+l+'</div>');t.onclick=f;g.appendChild(t);};
  add("Crear paquete","➕",()=>formNuevo(body));
  add("Importar paquete (.zip)","📥",()=>pedir(".zip",true,async l=>{
    const nom=l.length===1?limpio(l[0].name.replace(/\.paquete$/i,"")):"Paquete importado";
    const p=await crearPack(nom,"");cur=p.id;await correrConPack(body,p,l);
  }));
  packs.forEach(p=>{
    const n=assets.filter(a=>a.pack===p.id).length,m=scenes.filter(s=>s.pack===p.id).length;
    const th=assets.find(a=>a.pack===p.id&&a.thumb);
    const t=el('<div class="tile"><div style="aspect-ratio:1;border-radius:7px;background:#3a3f66;display:flex;align-items:center;justify-content:center;font-size:34px;overflow:hidden">'+(th?'<img src="'+th.thumb+'" style="width:100%;height:100%;object-fit:cover;opacity:.9">':"📦")+'</div><div class="nm">'+esc(p.nombre)+'</div><div style="opacity:.6;font-size:10px">'+n+' elem. · '+m+' esc.</div></div>');
    t.draggable=false;t.style.cursor="pointer";t.onclick=()=>{cur=p.id;filtro="";render(body);};g.appendChild(t);
  });
  body.appendChild(g);
}
async function correrConPack(body,p,files){render(body);await correr(body,p,files);}
async function crearPack(nombre,tema){
  const p={id:uid("pack_"),nombre:nombre||"Mi paquete",tema:tema||"",t:Date.now()};await put("packs",p);packs.push(p);return p;
}
function formNuevo(body){
  body.innerHTML="";
  const f=el('<div class="wbox"><b>Nuevo paquete</b><div style="margin-top:8px">Nombre</div><input type="text" id="pkN" placeholder="Jungla" maxlength="30"><div>¿Para qué tipo de escena? <small style="opacity:.7">(así te lo sugiero cuando hagas una escena de ese tipo)</small></div><select id="pkT" style="width:100%;margin:4px 0 10px">'+TEMAS.map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join("")+'</select><div style="display:flex;gap:8px"><button id="pkOk" class="pri">Crear</button><button id="pkNo">Cancelar</button></div></div>');
  body.appendChild(f);const inp=f.querySelector("#pkN");inp.focus();
  f.querySelector("#pkNo").onclick=()=>render(body);
  const go=async()=>{const nm=inp.value.trim();if(!nm){inp.focus();return;}const t=f.querySelector("#pkT").value;const p=await crearPack(nm,t);cur=p.id;render(body);msg("Paquete «"+nm+"» creado. Usa «Importar assets» para subirle modelos.");};
  f.querySelector("#pkOk").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go();};
  f.querySelector("#pkT").onchange=e=>{if(!inp.value.trim()){const o=TEMAS.find(x=>x[0]===e.target.value);if(o&&o[0])inp.value=o[1];}};
}
function vistaPack(body,p){
  const S=window.Studio,A=assets.filter(a=>a.pack===p.id),SC=scenes.filter(s=>s.pack===p.id);
  const head=el('<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:2px 0 8px"><button id="pkBack">← Paquetes</button><b style="font-size:15px;flex:1;min-width:80px">📦 '+esc(p.nombre)+'</b></div>');
  body.appendChild(head);
  head.querySelector("#pkBack").onclick=()=>{cur=null;render(body);};
  const bar=el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>');
  const btn=(t,f,cls)=>{const b=document.createElement("button");b.textContent=t;if(cls)b.className=cls;b.onclick=f;bar.appendChild(b);return b;};
  btn("⬆️ Importar assets",()=>pedir(".glb,.gltf,.zip,image/*",true,l=>correr(body,p,l)),"pri");
  btn("💾 Guardar esta escena aquí",()=>formEscena(body,p));
  btn("✏️ Renombrar",()=>{const n=prompt("Nombre del paquete",p.nombre);if(n&&n.trim()){p.nombre=n.trim().slice(0,30);put("packs",p).then(()=>render(body));}});
  btn("⬇️ Exportar .zip",()=>exportar(p).then(()=>msg("Paquete exportado: guárdalo como copia de seguridad o para otro PC.")));
  btn("🗑 Borrar paquete",async()=>{if(!confirm("¿Borrar el paquete «"+p.nombre+"» con sus "+A.length+" elementos y "+SC.length+" escenas? No se puede deshacer."))return;await borrarPack(p);cur=null;render(body);window.Studio.rerender&&window.Studio.rerender();});
  body.appendChild(bar);
  const meta=el('<div style="font-size:12px;opacity:.85;margin-bottom:6px">Tipo de escena: <select id="pkTema">'+TEMAS.map(([k,n])=>'<option value="'+k+'"'+(p.tema===k?" selected":"")+'>'+n+'</option>').join("")+'</select></div>');
  meta.querySelector("select").onchange=e=>{p.tema=e.target.value;put("packs",p);msg(p.tema?"Cuando hagas una escena de tipo «"+e.target.selectedOptions[0].textContent+"», verás este paquete en Sugeridos.":"Listo.");};
  body.appendChild(meta);
  /* escenas */
  body.appendChild(sec("Escenas guardadas ("+SC.length+")"));
  if(!SC.length)body.appendChild(el('<div style="opacity:.7;font-size:12px;margin:4px 0 8px">Arma una escena en el Studio y pulsa «Guardar esta escena aquí».</div>'));
  const gs=el('<div id="grid"></div>');
  SC.forEach(s=>{
    const t=el('<div class="tile" style="cursor:default"><div style="position:relative">'+(s.thumb?'<img src="'+s.thumb+'" style="aspect-ratio:16/9;object-fit:cover">':'<div style="aspect-ratio:16/9;background:#3a3f66;border-radius:7px"></div>')+(s.def?'<span style="position:absolute;top:2px;left:4px" title="Escena por defecto">⭐</span>':"")+'</div><div class="nm">'+esc(s.nombre)+'</div><div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-top:3px"></div></div>');
    const row=t.lastChild;
    const mb=(txt,tt,f)=>{const b=document.createElement("button");b.textContent=txt;b.title=tt;b.style.cssText="padding:2px 6px;font-size:11px";b.onclick=e=>{e.stopPropagation();f();};row.appendChild(b);};
    mb("➕","Sumar sus elementos a mi escena",()=>{usarEscena(s,"sumar");msg("Agregué los elementos de «"+s.nombre+"» a tu escena.");});
    mb("🔁","Reemplazar mi escena actual por esta",()=>{if(confirm("¿Reemplazar la escena actual por «"+s.nombre+"»?")){usarEscena(s,"reemplazar");msg("Escena «"+s.nombre+"» cargada.");}});
    mb(s.def?"★":"☆","Escena por defecto: se carga sola al crear una escena nueva de este tipo",async()=>{
      if(!p.tema){msg("Primero elige el «Tipo de escena» del paquete (arriba).");return;}
      const on=!s.def;for(const o of scenes.filter(x=>x.pack===p.id&&x.def)){o.def=false;await put("scenes",o);}s.def=on;await put("scenes",s);render(body);msg(on?"«"+s.nombre+"» se cargará sola al crear una escena nueva de tipo «"+p.tema+"».":"Quitada como escena por defecto.");});
    mb("🗑","Borrar escena",async()=>{if(!confirm("¿Borrar la escena «"+s.nombre+"»?"))return;await del("scenes",s.id);scenes.splice(scenes.indexOf(s),1);render(body);});
    gs.appendChild(t);
  });
  body.appendChild(gs);
  /* assets */
  body.appendChild(sec("Elementos ("+A.length+")"));
  if(!A.length){body.appendChild(el('<div style="opacity:.75;font-size:12px;margin:4px 0">Aún no tiene elementos. Pulsa «Importar assets» y elige modelos .glb/.gltf, dibujos PNG/JPG o un .zip entero de Kenney, Quaternius, KayKit…</div>'));return;}
  const usadas=[...new Set(A.map(a=>a.cat))];
  const chips=el('<div class="chips"></div>');
  [["","Todos"]].concat(CATS.filter(c=>usadas.includes(c[0])).map(c=>[c[0],c[1]])).forEach(([k,n])=>{const c=document.createElement("span");c.className="chip"+(filtro===k?" on":"");c.textContent=n;c.style.cursor="pointer";c.onclick=()=>{filtro=k;render(body);};chips.appendChild(c);});
  body.appendChild(chips);
  const q=el('<input type="text" placeholder="Buscar en este paquete…" style="margin:6px 0">');body.appendChild(q);
  const g=el('<div id="grid"></div>');body.appendChild(g);
  const pintar=()=>{
    g.innerHTML="";const qq=q.value.toLowerCase();
    A.filter(a=>(!filtro||a.cat===filtro)&&a.nombre.toLowerCase().includes(qq)).forEach(a=>{
      const t=S.tile(a.id,a.nombre,S.mineVisual(S.MINE.find(m=>m.id===a.id)||mineOf(a)));
      const x=document.createElement("span");x.textContent="⚙";x.title="Cambiar nombre, categoría, altura o borrar";x.style.cssText="position:absolute;top:2px;right:4px;background:#000a;border-radius:6px;padding:0 5px;cursor:pointer";
      t.style.position="relative";x.onclick=e=>{e.stopPropagation();editarAsset(body,a);};t.appendChild(x);g.appendChild(t);
    });
    if(!g.children.length)g.textContent="Nada con ese filtro.";
  };
  q.oninput=pintar;pintar();
}
const sec=t=>{const d=document.createElement("div");d.className="sec";d.textContent=t;return d;};
function formEscena(body,p){
  const w=window.Studio.proj.mundos[window.Studio.proj.mundo];
  const nm=prompt("¿Cómo se llamará esta escena dentro del paquete «"+p.nombre+"»?",w.nombre||"Escena");if(!nm)return;
  const def=p.tema&&!scenes.some(s=>s.pack===p.id&&s.def)&&confirm("¿Usarla como escena por defecto? Se cargará sola al crear una escena nueva de tipo «"+p.tema+"».");
  guardarEscena(p,nm.trim().slice(0,30),def).then(()=>{render(body);msg("Escena «"+nm+"» guardada en «"+p.nombre+"».");});
}
function editarAsset(body,a){
  const b=document.createElement("div");b.className="modal";b.style.zIndex=40;
  b.innerHTML='<div class="mbox" style="max-width:380px"><h2>⚙ '+esc(a.nombre)+'</h2>Nombre<input type="text" id="eaN" value="'+esc(a.nombre)+'" maxlength="28">Categoría<select id="eaC" style="width:100%;margin:4px 0 10px">'+CATS.map(([k,n])=>'<option value="'+k+'"'+(a.cat===k?" selected":"")+'>'+n+'</option>').join("")+'</select>Altura al colocarlo (metros): <b id="eaV">'+a.alto+'</b><input type="range" id="eaH" min="0.2" max="14" step="0.1" value="'+a.alto+'" style="width:100%"><div class="wnav"><button id="eaDel">🗑 Borrar</button><span><button id="eaNo">Cancelar</button> <button id="eaOk" class="pri">Guardar</button></span></div></div>';
  document.body.appendChild(b);
  b.querySelector("#eaH").oninput=e=>{b.querySelector("#eaV").textContent=e.target.value;};
  b.querySelector("#eaNo").onclick=()=>b.remove();
  b.querySelector("#eaOk").onclick=async()=>{
    a.nombre=b.querySelector("#eaN").value.trim().slice(0,28)||a.nombre;a.cat=b.querySelector("#eaC").value;a.alto=+b.querySelector("#eaH").value;
    await put("assets",a);registrar();b.remove();render(body);window.Studio.rerender&&window.Studio.rerender();
  };
  b.querySelector("#eaDel").onclick=async()=>{if(!confirm("¿Borrar «"+a.nombre+"» del paquete?"))return;await borrarAsset(a);b.remove();render(body);window.Studio.rerender&&window.Studio.rerender();};
}
async function borrarAsset(a){
  await del("assets",a.id);await del("blobs",a.id);assets.splice(assets.indexOf(a),1);fileCache.delete(a.id);
  const M=window.Studio.MINE,i=M.findIndex(m=>m.id===a.id);if(i>=0)M.splice(i,1);
}
async function borrarPack(p){
  for(const a of assets.filter(x=>x.pack===p.id))await borrarAsset(a);
  for(const s of scenes.filter(x=>x.pack===p.id)){await del("scenes",s.id);}
  scenes=scenes.filter(s=>s.pack!==p.id);await del("packs",p.id);packs=packs.filter(x=>x.id!==p.id);
}
/* un .glb subido por el método de siempre se guarda solo en «Mis modelos» para que no se pierda al recargar */
async function guardarSuelto(m,f){
  try{
    await init();if(!db)return;
    let p=packs.find(x=>x.auto);if(!p){p={id:uid("pack_"),nombre:"Mis modelos",tema:"",auto:true,t:Date.now()};await put("packs",p);packs.push(p);}
    const a={id:m.id,pack:p.id,nombre:m.nombre,kind:"glb",cat:m.cat,alto:m.alto,thumb:null,t:Date.now()};
    const u8=new Uint8Array(await f.arrayBuffer());
    await put("blobs",{id:a.id,data:u8.buffer});a.thumb=await miniatura(f);await put("assets",a);assets.push(a);
    m.pk=true;m.pack=p.id;m.thumb=a.thumb;
  }catch(e){}
}
function sugeridos(tema){return assetsDeTema(tema);}

window.Packs={init,render,file,guardarSuelto,porDefecto,usarEscena,sugeridos,importFiles,readZip,gltfToGlb,guess,limpio,crearPack,guardarEscena,exportar,get packs(){return packs;},get assets(){return assets;},get scenes(){return scenes;}};
function boot(){if(window.Studio)init().then(()=>{window.Studio.rerender&&window.Studio.rerender();});}
if(window.Studio)boot();else document.addEventListener("studio-ready",boot);
})();
