/* Plantillas, biblioteca reutilizable entre proyectos y guardado en una carpeta del computador */
(function(){
"use strict";
const S=()=>window.Serie,$=id=>document.getElementById(id);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const rid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function css(){if($("bibCss"))return;const s=el("style");s.id="bibCss";s.textContent=`
.bibM{position:fixed;inset:0;z-index:9500;background:#000b;display:grid;place-items:center}.bibM .b{background:#1b1e36;border:1px solid #7a5cff;border-radius:16px;padding:16px;color:#eef;width:min(760px,94vw);max-height:90vh;overflow:auto;font:14px system-ui,sans-serif}
.bibM h3{margin:0 0 6px}.bibM button{background:#2b3058;color:#eef;border:1px solid #4a4f86;border-radius:9px;padding:7px 11px;cursor:pointer;font:inherit}.bibM button.pri{background:#7a5cff}.bibM button.danger{background:#6a2a3a}
.bibG{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin:10px 0}.bibC{background:#242842;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}.bibC b{font-size:14px}.bibC span{font-size:12px;opacity:.75}
.bibT{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.bibT button.on{background:#7a5cff}`;document.head.appendChild(s);}
function modal(titulo){css();const m=el("div","bibM"),b=el("div","b");m.appendChild(b);b.appendChild(el("h3","",titulo));m.addEventListener("pointerdown",e=>{if(e.target===m)m.remove();});document.body.appendChild(m);b.cerrar=()=>m.remove();return b;}
/* ---------- base de datos del navegador ---------- */
let dbp=null;
function db(){if(!dbp)dbp=new Promise((ok,no)=>{const r=indexedDB.open("atrapa_studio",2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("biblio"))d.createObjectStore("biblio",{keyPath:"id"});if(!d.objectStoreNames.contains("handles"))d.createObjectStore("handles");};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});return dbp;}
async function tx(store,mode,fn){const d=await db();return new Promise((ok,no)=>{const t=d.transaction(store,mode),s=t.objectStore(store),q=fn(s);t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error);});}
/* ======================= PLANTILLAS ======================= */
const U=()=>"t"+rid();
const deco=(ref,x,y,s,d,mov)=>({uid:U(),kind:"deco",ref,x,y,s:s||1,d:d==null?50:d,mov:mov||""});
const act=(ref,nombre,x,y,s,o)=>Object.assign({uid:U(),kind:"actor",ref,ficha:{nombre},x,y,s,d:60,flip:0,paso:1},o||{});
const esce=(nombre,fondo,o)=>Object.assign({nombre,dur:10,fondo:{id:fondo},hora:"",items:[],cam:{z0:1,z1:1,x0:0,x1:0},lineas:[],efecto:"",trans:"",textos:[]},o||{});
const ln=(txt,t0,quien)=>({id:window.Dub?Dub.newId():U(),txt,quien:quien||"",t0});
const tit=(txt,t0,t1,y)=>({tipo:"titulo",txt,x:50,y:y||18,size:8,t0,t1});
const TPL=[
 {id:"cuento",n:"📖 Cuento corto (3 escenas)",d:"Una niña, un abuelo narrador y un bosque. Cambia los textos y listo.",f:()=>[
   esce("Había una vez","pradera",{dur:9,trans:"fundido",textos:[tit("Había una vez…",.3,4)],items:[deco("nube",260,130,1,10,"flotar"),deco("nube",800,90,.8,10,"flotar"),deco("arbol",1130,600,1.1,45,"mecer"),deco("araucaria",90,600,1,42,"mecer"),act("hum:nina","Nina",330,650,1.5,{go:{x1:700,y1:650,t0:1,t1:6}}),act("hum:abuelo","Abuelo",1000,650,1.5,{flip:1})],lineas:[ln("Había una vez una niña muy curiosa que vivía junto al bosque.",.8,"Abuelo")]}),
   esce("El camino","bosque",{dur:9,trans:"cortina",efecto:"hojas",items:[deco("helecho",180,640,1.2,40,"mecer"),deco("tronco",1000,640,1,40),act("hum:nina","Nina",200,650,1.5,{go:{x1:1000,y1:650,t0:.5,t1:8}})],cam:{z0:1.1,z1:1.1,x0:0,x1:0},lineas:[ln("Cada mañana caminaba por un sendero lleno de sorpresas.",.5,"Abuelo")]}),
   esce("El final","pradera",{dur:8,hora:"tarde",trans:"fundido",textos:[tit("Fin",3,8,45)],items:[deco("sol",1000,160,1,5,"girar"),act("hum:nina","Nina",450,650,1.6,{acc:[{k:"saludar",t0:1}]}),act("hum:abuelo","Abuelo",800,650,1.6,{flip:1})],lineas:[ln("Y desde ese día, el bosque fue su mejor amigo.",.5,"Abuelo")]})]},
 {id:"dialogo",n:"💬 Diálogo con cortes de cámara",d:"Dos personajes conversan; la cámara alterna entre ellos.",f:()=>[esce("Conversación","pradera",{dur:14,cam:{z0:1,z1:1,x0:0,x1:0},cortes:[{t:0,z:1,z1:1.05,x:0},{t:4,z:1.7,z1:1.85,x:-260},{t:8,z:1.7,z1:1.85,x:260},{t:11,z:1.1,z1:1.1,x:0}],items:[deco("arbol",1150,600,1.1,45,"mecer"),deco("nube",300,120,1,10,"flotar"),act("hum:nina","Nina",400,650,1.7,{}),act("hum:cientifica","Científica",880,650,1.7,{flip:1})],lineas:[ln("¿Qué encontraste en la excavación?",.8,"Nina"),ln("Un hueso enorme. ¡Creo que es de un dinosaurio chileno!",4.5,"Científica"),ln("¡Quiero verlo! ¿Me llevas?",8.5,"Nina"),ln("Claro, vamos juntas.",11.2,"Científica")]})]},
 {id:"desierto",n:"🏜 Aventura en el desierto",d:"Dos exploradores caminan por Atacama, la cámara los sigue y hay polvo en el aire.",f:()=>{const n=act("hum:nino","Niño",200,650,1.5,{go:{x1:1050,y1:650,t0:.5,t1:11},paso:1});return [esce("Atacama","atacama",{dur:12,atm:"polvo",look:{calor:.35,vig:.3,grano:.12},items:[deco("cactus",900,640,1.3,40),deco("cactus",300,650,1,35),deco("roca",640,660,1.2,45),n,act("hum:nina","Nina",90,650,1.5,{go:{x1:940,y1:650,t0:.8,t1:11.3}})],cam:{z0:1.15,z1:1.15,x0:0,x1:0,sigue:n.uid},lineas:[ln("El desierto más seco del mundo guarda secretos de millones de años.",.5,"Narrador")]})];}},
 {id:"intro",n:"🎬 Intro del canal (8 s)",d:"Título grande sobre una noche estrellada, ideal para abrir tus videos.",f:()=>[esce("Intro","noche",{dur:8,hora:"noche",efecto:"estrellas",trans:"fundido",look:{bloom:.4,vig:.5,grano:.15},textos:[tit("Atrapa Cuentos",1,8,42),Object.assign(tit("Historias que cobran vida",3,8,58),{size:4.5})],items:[deco("luna",1000,150,1,5,"flotar"),deco("estrella",260,120,.8,5,"pulso"),deco("estrella",620,80,.6,5,"pulso")]})]}];
function aplicarPlantilla(t,modo){
  const P=S().proj,esc2=t.f();
  if(modo==="nueva"){const p={v:3,nombre:t.n.replace(/^[^\wÁ-ú]+/,"").slice(0,30),tipo:"animacion",lienzo:Studio.lienzoDe(P),mundo:0,mundos:esc2,actores:[],imgs:{}};Studio.importText(JSON.stringify(p));}
  else{for(const e of esc2)P.mundos.push(e);P.mundo=P.mundos.length-esc2.length;S().changed();window.dispatchEvent(new Event("serie-tl"));if(S().renderTl)S().renderTl();}
}
function abrirPlantillas(){
  const b=modal("🧩 Plantillas");b.appendChild(el("p","","Empieza con algo ya armado y cámbialo a tu gusto. Los textos son de ejemplo: edítalos en el estudio de grabación."));
  const g=el("div","bibG");for(const t of TPL){const c=el("div","bibC",`<b>${t.n}</b><span>${t.d}</span>`);const r=el("div","","");const a=el("button","pri","Empezar proyecto nuevo"),m=el("button","","Agregar a mi proyecto");
    a.onclick=()=>{if(confirm("¿Empezar un proyecto nuevo con esta plantilla? El proyecto actual se reemplaza: guárdalo como archivo si lo quieres conservar."))aplicarPlantilla(t,"nueva"),b.cerrar(),$("projDlg").hidden=true;};
    m.onclick=()=>{aplicarPlantilla(t,"agregar");b.cerrar();$("projDlg").hidden=true;S().say("Escenas agregadas al final de tu serie.");};r.append(a,m);r.style.cssText="display:flex;gap:6px;flex-wrap:wrap";c.appendChild(r);g.appendChild(c);}
  b.appendChild(g);const x=el("button","","Cerrar");x.onclick=b.cerrar;b.appendChild(x);
}
/* ======================= BIBLIOTECA ======================= */
const TIPOS={personaje:"🧍 Personajes",escena:"🎞 Escenas",pose:"🤸 Poses",ciclo:"🚶 Ciclos de caminata",imagen:"🖼 Imágenes"};
const clean=(k,v)=>(k[0]==="_"||k==="dubLv"||k==="dubVis")?undefined:v;
async function guardarItem(tipo,nombre,data){const it={id:"b"+rid(),tipo,nombre:String(nombre).slice(0,40),fecha:Date.now(),data:JSON.stringify(data,clean)};await tx("biblio","readwrite",s=>s.put(it));return it;}
async function listar(){const r=await tx("biblio","readonly",s=>s.getAll());return (r||[]).sort((a,b)=>b.fecha-a.fecha);}
async function borrar(id){await tx("biblio","readwrite",s=>s.delete(id));}
function refsEscena(sc,P){const a=new Set(),i=new Set();for(const o of sc.items){if(o.kind==="actor"&&(P.actores||[]).some(x=>x.id===o.ref))a.add(o.ref);if(o.kind==="img")i.add(o.ref);}if(sc.fondo&&sc.fondo.img)i.add(sc.fondo.img);
  return {actores:(P.actores||[]).filter(x=>a.has(x.id)),imgs:Object.fromEntries([...i].filter(k=>P.imgs[k]).map(k=>[k,P.imgs[k]]))};}
async function guardarActual(tipo){
  const P=S().proj,sc=S().curScene(),it=sc.items.find(i=>i.uid===S().sel);
  if(tipo==="personaje"){if(!it||it.kind!=="actor"){S().say("Toca primero un personaje de la escena.");return false;}const d=(P.actores||[]).find(a=>a.id===it.ref);if(!d){S().say("Este es un personaje de fábrica. Guarda uno que hayas creado en el Taller.");return false;}await guardarItem("personaje",(it.ficha&&it.ficha.nombre)||"Personaje",d);}
  else if(tipo==="escena"){const r=refsEscena(sc,P);await guardarItem("escena",sc.nombre,{escena:sc,actores:r.actores,imgs:r.imgs});}
  else if(tipo==="pose"){const ps=P.poses||{},ks=Object.keys(ps);if(!ks.length){S().say("Aún no creaste poses (en «Poses y ciclos» del personaje).");return false;}for(const k of ks)await guardarItem("pose",ps[k].n.replace(/^⭐ /,""),ps[k]);}
  else if(tipo==="ciclo"){const cs=P.ciclos||{},ks=Object.keys(cs);if(!ks.length){S().say("Aún no creaste ciclos de caminata.");return false;}for(const k of ks)await guardarItem("ciclo",cs[k].n.replace(/^⭐ /,""),cs[k]);}
  else if(tipo==="imagen"){const es=Object.entries(P.imgs);if(!es.length){S().say("No hay imágenes en este proyecto.");return false;}for(const [,o] of es)await guardarItem("imagen",o.n,o);}
  return true;
}
function usar(e){
  const P=S().proj,d=JSON.parse(e.data);
  if(e.tipo==="personaje"){d.id="a"+rid();P.actores=P.actores||[];P.actores.push(d);S().changed();S().renderLib();S().addActor(d.id,e.nombre);}
  else if(e.tipo==="escena"){const mi={},ma={};for(const [k,o] of Object.entries(d.imgs||{})){const n="u"+rid();mi[k]=n;P.imgs[n]=o;}for(const a of d.actores||[]){const n="a"+rid();ma[a.id]=n;a.id=n;P.actores.push(a);}
    const sc=d.escena;for(const o of sc.items){o.uid="i"+rid();if(o.kind==="actor"&&ma[o.ref])o.ref=ma[o.ref];if(o.kind==="img"&&mi[o.ref])o.ref=mi[o.ref];}if(sc.fondo&&sc.fondo.img&&mi[sc.fondo.img])sc.fondo.img=mi[sc.fondo.img];
    for(const l of sc.lineas||[])l.id=window.Dub?Dub.newId():U();P.mundos.push(sc);P.mundo=P.mundos.length-1;S().loadImgs();S().changed();S().renderLib();if(S().renderTl)S().renderTl();}
  else if(e.tipo==="pose"){P.poses=P.poses||{};P.poses["p"+rid()]=d;S().changed();}
  else if(e.tipo==="ciclo"){P.ciclos=P.ciclos||{};P.ciclos["c"+rid()]=d;S().changed();}
  else if(e.tipo==="imagen"){P.imgs["u"+rid()]=d;S().loadImgs();S().changed();S().renderLib();}
  S().say("«"+e.nombre+"» agregado a tu serie.");S().renderProps&&S().renderProps();
}
async function abrirBiblio(tab){
  tab=tab||"personaje";const b=modal("📚 Mi biblioteca");
  b.appendChild(el("p","","Guarda aquí lo que quieras reutilizar en otras series. Vive en este equipo; para llevarla a otro, usa «Exportar biblioteca»."));
  const tabs=el("div","bibT");for(const [k,n] of Object.entries(TIPOS)){const x=el("button",k===tab?"on":"",n);x.onclick=()=>{b.cerrar();abrirBiblio(k);};tabs.appendChild(x);}b.appendChild(tabs);
  const ac=el("div","bibT"),sv=el("button","pri","➕ Guardar "+({personaje:"el personaje elegido",escena:"la escena actual",pose:"mis poses",ciclo:"mis ciclos",imagen:"las imágenes del proyecto"}[tab]));
  sv.onclick=async()=>{if(await guardarActual(tab)){b.cerrar();abrirBiblio(tab);}};ac.appendChild(sv);
  const ex=el("button","","⬇ Exportar biblioteca"),im=el("button","","⬆ Importar biblioteca");
  ex.onclick=async()=>{const all=await listar(),blob=new Blob([JSON.stringify({v:1,items:all})],{type:"application/json"}),a=el("a");a.href=URL.createObjectURL(blob);a.download="mi-biblioteca.atrapabiblio";a.click();};
  im.onclick=()=>{const f=el("input");f.type="file";f.accept=".atrapabiblio,.json";f.onchange=async()=>{try{const o=JSON.parse(await f.files[0].text());let n=0;for(const it of o.items||[]){if(!it.tipo||!it.data)continue;it.id="b"+rid();await tx("biblio","readwrite",s=>s.put(it));n++;}S().say("Importé "+n+" elementos.");b.cerrar();abrirBiblio(tab);}catch(e){S().say("⚠ Ese archivo no es una biblioteca.");}};f.click();};
  ac.append(ex,im);b.appendChild(ac);
  const all=(await listar()).filter(x=>x.tipo===tab),g=el("div","bibG");
  if(!all.length)g.appendChild(el("p","","Todavía no hay nada guardado en esta sección."));
  for(const e of all){const c=el("div","bibC",`<b>${esc(e.nombre)}</b><span>${new Date(e.fecha).toLocaleDateString()}</span>`),r=el("div","");r.style.cssText="display:flex;gap:6px";const u=el("button","pri","Usar"),d=el("button","danger","🗑");u.onclick=()=>{usar(e);b.cerrar();$("projDlg").hidden=true;};d.onclick=async()=>{if(confirm("¿Borrar «"+e.nombre+"» de la biblioteca?")){await borrar(e.id);b.cerrar();abrirBiblio(tab);}};r.append(u,d);c.appendChild(r);g.appendChild(c);}
  b.appendChild(g);const x=el("button","","Cerrar");x.onclick=b.cerrar;b.appendChild(x);
}
/* ======================= CARPETA DEL PROYECTO ======================= */
let dir=null,saveT=0,estado="",ultimo="";
const hasFS=()=>typeof window.showDirectoryPicker==="function";
async function permiso(h,w){try{const o={mode:w?"readwrite":"read"};if((await h.queryPermission(o))==="granted")return true;return (await h.requestPermission(o))==="granted";}catch(e){return false;}}
async function escribir(sub,nombre,contenido){let d=dir;if(sub)d=await dir.getDirectoryHandle(sub,{create:true});const f=await d.getFileHandle(nombre,{create:true}),w=await f.createWritable();await w.write(contenido);await w.close();}
const nom=()=>((S().proj.nombre||"mi-serie").replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,"").trim()||"mi-serie").replace(/\s+/g,"-");
async function guardarEnCarpeta(copia){
  if(!dir)return false;const txt=Studio.exportText();if(!copia&&txt===ultimo)return true;
  try{await escribir(null,nom()+".atrapa",txt);ultimo=txt;
    if(copia){const d=new Date(),p=n=>String(n).padStart(2,"0"),stamp=d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"-"+p(d.getHours())+p(d.getMinutes());await escribir("copias",nom()+"-"+stamp+".atrapa",txt);
      const cd=await dir.getDirectoryHandle("copias",{create:true}),nombres=[];for await(const [n] of cd.entries())nombres.push(n);nombres.sort();while(nombres.length>10)await cd.removeEntry(nombres.shift());}
    estado="Guardado en la carpeta "+new Date().toLocaleTimeString();return true;}catch(e){estado="⚠ No pude escribir en la carpeta: "+e.message;return false;}
}
async function elegirCarpeta(handle){
  try{const h=handle||await window.showDirectoryPicker({mode:"readwrite",id:"atrapa-proyectos"});if(!(await permiso(h,true)))return false;dir=h;await tx("handles","readwrite",s=>s.put(h,"carpeta"));await guardarEnCarpeta(true);
    for(const sd of ["videos","copias"])await dir.getDirectoryHandle(sd,{create:true});return true;}catch(e){if(e&&e.name!=="AbortError")S().say("⚠ "+e.message);return false;}
}
async function abrirDeCarpeta(){
  try{const [fh]=await window.showOpenFilePicker({types:[{description:"Serie Atrapa Cuentos",accept:{"application/json":[".atrapa",".atrapacuentos",".json"]}}],startIn:dir||undefined});const txt=await (await fh.getFile()).text();await Studio.importText(txt);S().say("Serie abierta.");return true;}catch(e){if(e&&e.name!=="AbortError")S().say("⚠ "+e.message);return false;}
}
async function guardarVideo(blob,nombre){if(!dir)return false;try{await escribir("videos",nombre,blob);estado="Video guardado en la carpeta «videos».";return true;}catch(e){return false;}}
window.addEventListener("serie-tl",()=>{if(!dir)return;clearTimeout(saveT);saveT=setTimeout(()=>guardarEnCarpeta(false),4000);});
setInterval(()=>{if(dir)guardarEnCarpeta(true);},10*60*1000);
async function restaurarCarpeta(){try{const h=await tx("handles","readonly",s=>s.get("carpeta"));if(h&&(await h.queryPermission({mode:"readwrite"}))==="granted")dir=h;}catch(e){}}
async function abrirCarpeta(){
  const b=modal("📁 Carpeta del proyecto");
  b.appendChild(el("p","","Elige una carpeta de tu computador. La serie se guarda ahí sola cada vez que haces cambios, con copias de seguridad (las últimas 10) y una carpeta para tus videos."));
  if(!hasFS()){b.appendChild(el("p","","⚠ Este navegador no permite guardar en carpetas. Usa Chrome, Edge o el programa de escritorio. Mientras tanto puedes guardar un archivo con «⬇ Guardar archivo»."));}
  const inf=el("p","",dir?"📂 Carpeta activa: <b>"+esc(dir.name)+"</b><br><small>"+esc(estado)+"</small>":"Todavía no elegiste una carpeta.");b.appendChild(inf);
  const r=el("div","bibT"),e=el("button","pri",dir?"Cambiar carpeta":"Elegir carpeta"),n=el("button","","💾 Guardar ahora"),o=el("button","","📂 Abrir una serie…"),q=el("button","danger","Dejar de usar carpeta");
  e.onclick=async()=>{if(await elegirCarpeta()){b.cerrar();abrirCarpeta();}};n.onclick=async()=>{if(!dir){S().say("Primero elige una carpeta.");return;}await guardarEnCarpeta(true);inf.innerHTML="📂 Carpeta activa: <b>"+esc(dir.name)+"</b><br><small>"+esc(estado)+"</small>";};
  o.onclick=async()=>{if(await abrirDeCarpeta())b.cerrar();};q.onclick=async()=>{dir=null;await tx("handles","readwrite",s=>s.delete("carpeta"));b.cerrar();};
  if(hasFS()){r.append(e,n,o);if(dir)r.appendChild(q);}b.appendChild(r);const x=el("button","","Cerrar");x.onclick=b.cerrar;b.appendChild(x);
}
/* ---------- botones en el diálogo «Proyecto» ---------- */
function montar(){const d=$("projDlg");if(!d||$("pjTpl"))return;const row=el("div","btns");row.style.marginTop="8px";
  row.innerHTML=`<button id="pjTpl">🧩 Plantillas</button><button id="pjBib">📚 Mi biblioteca</button><button id="pjDir">📁 Carpeta del proyecto</button>`;
  d.querySelector(".btns").after(row);$("pjTpl").onclick=abrirPlantillas;$("pjBib").onclick=()=>abrirBiblio();$("pjDir").onclick=abrirCarpeta;}
document.addEventListener("DOMContentLoaded",()=>{montar();restaurarCarpeta();});
if(document.readyState!=="loading"){montar();restaurarCarpeta();}
window.Biblio={TPL,aplicarPlantilla,guardarActual,listar,usar,abrirBiblio,abrirPlantillas,abrirCarpeta,guardarEnCarpeta,elegirCarpeta,guardarVideo,_setDir:h=>{dir=h;},_dir:()=>dir};
})();
