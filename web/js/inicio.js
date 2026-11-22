/* Pantalla de inicio: crear proyecto nuevo (animación o serie), abrir proyecto guardado y asistente de proyecto. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FPS=[24,25,30,50,60];
let root=null,guardado=null,primera=false;
function css(){if($("inicioCss"))return;const s=el("style");s.id="inicioCss";s.textContent=`
#inicio{position:fixed;inset:0;z-index:9000;background:radial-gradient(1200px 600px at 50% -10%,#2a2450,#12141c 70%);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;color:#e9ebf5;font:14px system-ui,Segoe UI,Roboto,sans-serif}
#inicio .box{width:min(980px,100%);margin:auto}
#inicio h1{margin:0 0 4px;font-size:30px;color:#ffb347}#inicio h2{margin:0 0 6px;font-size:22px;color:#ffb347}#inicio .sub{opacity:.75;margin:0 0 18px}
#inicio .big{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
#inicio .card{background:#232740;border:2px solid #343a58;border-radius:16px;padding:20px;cursor:pointer;text-align:left;color:#fff;font:inherit;display:flex;flex-direction:column;gap:6px}
#inicio .card:hover{border-color:#ffb347;background:#2b3050}#inicio .card.on{border-color:#ffb347;background:#3c3560}
#inicio .card big{font-size:38px;line-height:1}#inicio .card b{font-size:17px}#inicio .card span{opacity:.75;font-size:13px}
#inicio .row2{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}
#inicio button.pri,#inicio button.sec{border:0;border-radius:10px;padding:11px 18px;font:inherit;font-weight:700;cursor:pointer}
#inicio button.pri{background:#7a5cff;color:#fff}#inicio button.pri:hover{background:#8d72ff}#inicio button.sec{background:#2a2f45;color:#fff}#inicio button.sec:hover{background:#363c5a}
#inicio input[type=text]{width:100%;max-width:420px;background:#12141c;border:1px solid #3a4064;color:#fff;border-radius:9px;padding:10px;font:inherit}
#inicio h3{margin:18px 0 8px;font-size:14px;color:#ffb347}
#inicio .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
#inicio .opt{background:#2b3050;border:2px solid transparent;border-radius:12px;padding:10px;cursor:pointer;text-align:center;color:#fff;font:inherit}
#inicio .opt:hover{border-color:#ffb347}#inicio .opt.on{border-color:#ffb347;background:#3c3560}#inicio .opt small{display:block;opacity:.7;margin-top:3px;font-size:11px}
#inicio .hist{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:8px}
#inicio .hist .card{padding:14px}#inicio .hist b{font-size:15px}
#inicio .nota{opacity:.65;font-size:12px;margin-top:12px}
#inicio .prev{display:inline-block;background:#fff2;border:2px solid #ffb347;border-radius:6px;vertical-align:middle;margin-right:8px}`;document.head.appendChild(s);}

async function hayGuardado(){
  try{const t=await Studio.loadAuto();if(!t)return null;const p=JSON.parse(t);if(!p.mundos||!p.mundos.length)return null;
    const n=p.mundos.reduce((a,m)=>a+(m.items||[]).length+(m.lineas||[]).length,0);return {texto:t,nombre:p.nombre||"Mi proyecto",vacio:n===0};}catch(e){return null;}
}
function cerrar(){if(root){root.remove();root=null;}}
function montar(){css();cerrar();root=el("div");root.id="inicio";const box=el("div","box");root.appendChild(box);document.body.appendChild(root);return box;}
const cfg={fmt:"16:9",base:1080,fps:30,tipo:"animacion"};
/* selector del lienzo, reutilizado en «nuevo» y en el asistente */
function lienzoUI(parent){
  const F=Studio.FMT,B=Studio.BASES,wrap=el("div");
  const resTxt=v=>{const a=Studio.FMT[cfg.fmt];const asp=a.w/a.h;return asp>=1?Math.round(v*asp/2)*2+"×"+v:v+"×"+Math.round(v/asp/2)*2;};
  const sel=(titulo,items,get,set,fmtItem)=>{wrap.appendChild(el("h3","",titulo));const o=el("div","opts");
    const pintar=()=>[...o.children].forEach((b,i)=>b.classList.toggle("on",items[i][0]===get()));
    items.forEach(it=>{const b=el("button","opt",fmtItem(it));b.onclick=()=>{set(it[0]);pintar();};o.appendChild(b);});pintar();wrap.appendChild(o);};
  sel("Formato del lienzo",Object.entries(F).map(([k,v])=>[k,v]),()=>cfg.fmt,v=>{cfg.fmt=v;wrap.querySelectorAll(".rt").forEach(e=>{e.textContent=resTxt(+e.dataset.v);});},([k,v])=>{
    const asp=k==="16:9"?[28,16]:k==="9:16"?[16,28]:[22,22];return `<span class="prev" style="width:${asp[0]}px;height:${asp[1]}px"></span><b>${k}</b><small>${esc(v.n.replace(/^[^(]*\(?/,"").replace(/\)$/,"")||v.n)}</small>`;});
  sel("Resolución base (lado corto del video)",B,()=>cfg.base,v=>{cfg.base=v;},([v,n])=>`<b>${n}</b><small class="rt" data-v="${v}">${resTxt(v)}</small>`);
  sel("Cuadros por segundo",FPS.map(f=>[f]),()=>cfg.fps,v=>{cfg.fps=v;},([f])=>`<b>${f} fps</b><small>${f===30?"recomendado":f===24?"cine":f>=50?"muy suave":"estándar"}</small>`);
  wrap.appendChild(el("p","nota","Puedes cambiar esto después en 💾 Proyecto → Configuración del lienzo. Al exportar eliges la calidad final."));
  parent.appendChild(wrap);
}
const lz=()=>({fmt:cfg.fmt,base:cfg.base,fps:cfg.fps});
async function confirmarReemplazo(){
  const g=guardado;if(!g||g.vacio)return true;
  return confirm("Hay un proyecto guardado automáticamente («"+g.nombre+"»). Si sigues, el trabajo nuevo lo reemplaza apenas hagas un cambio.\n\nSi quieres conservarlo, cancela, ábrelo con «Continuar» y guárdalo como archivo.\n\n¿Seguir de todos modos?");
}
async function inicioPantalla(){
  cfg.fmt="16:9";cfg.base=1080;cfg.fps=30;
  guardado=await hayGuardado();
  const b=montar();
  b.innerHTML=`<h1>🎬 Atrapacuentos Studio</h1><p class="sub">¿Qué quieres hacer hoy?</p><div class="big">
   <button class="card" id="inNuevo"><big>✨</big><b>Crear proyecto nuevo</b><span>Un lienzo completamente en blanco. Tú eliges si es una animación o una serie y el formato del video.</span></button>
   <button class="card" id="inAbrir"><big>📂</big><b>Abrir proyecto guardado</b><span>Abre un archivo .atrapa o .atrapacuentos que guardaste antes.</span></button>
   <button class="card" id="inAsis"><big>🧙</big><b>Asistente de proyecto</b><span>Empieza desde un cuento clásico ya armado, con escenas, personajes y narración. Todo se puede editar.</span></button></div>`;
  const fila=el("div","row2");
  if(guardado&&!guardado.vacio){const c=el("button","sec","▶ Continuar con «"+esc(guardado.nombre)+"» (guardado automático)");c.onclick=async()=>{try{await Studio.importText(guardado.texto);cerrar();Studio.say("Proyecto recuperado.");}catch(e){Studio.say("No pude recuperarlo: "+e.message);}};fila.appendChild(c);}
  if(!primera||true){const v=el("button","sec","Volver al editor");v.onclick=cerrar;if(!primera)fila.appendChild(v);}
  b.appendChild(fila);
  $("inNuevo").onclick=pantallaNuevo;$("inAbrir").onclick=abrir;$("inAsis").onclick=pantallaAsistente;
}
function pantallaNuevo(){
  const b=montar();b.innerHTML=`<h2>✨ Crear proyecto nuevo</h2><p class="sub">Paso 1 de 2 · ¿Qué vas a hacer?</p>
   <div class="big"><button class="card" id="tAn"><big>🎞</big><b>Animación</b><span>Una sola pieza: un cortometraje, un cuento o un video suelto. Puede tener varias escenas y se exporta como un solo video.</span></button>
   <button class="card" id="tSe"><big>📺</big><b>Serie</b><span>Varios capítulos. Cada capítulo es una parte de tu serie, con su propia duración.</span></button></div>
   <h3>Nombre del proyecto (opcional)</h3><input type="text" id="inNom" placeholder="Mi animación">`;
  const nx=t=>{cfg.tipo=t;pantallaLienzo($("inNom").value.trim());};
  $("tAn").onclick=()=>nx("animacion");$("tSe").onclick=()=>nx("serie");
  const v=el("div","row2");const a=el("button","sec","← Volver");a.onclick=inicioPantalla;v.appendChild(a);b.appendChild(v);
}
function pantallaLienzo(nombre){
  const b=montar();b.innerHTML=`<h2>📐 Configuración del lienzo</h2><p class="sub">Paso 2 de 2 · ${cfg.tipo==="serie"?"Serie":"Animación"}${nombre?" «"+esc(nombre)+"»":""}</p>`;
  lienzoUI(b);
  const v=el("div","row2");const a=el("button","sec","← Atrás"),c=el("button","pri","Crear lienzo en blanco");
  a.onclick=pantallaNuevo;
  c.onclick=async()=>{if(!(await confirmarReemplazo()))return;const p=Studio.newProj({tipo:cfg.tipo,nombre:nombre||undefined,lienzo:lz()});await Studio.importText(JSON.stringify(p));cerrar();Studio.say("Lienzo en blanco listo. Elige un personaje o un fondo a la izquierda.");};
  v.append(a,c);b.appendChild(v);
}
function abrir(){
  const f=el("input");f.type="file";f.accept=".atrapa,.atrapacuentos,.json";
  f.onchange=async()=>{if(!f.files[0])return;try{if(!(await confirmarReemplazo()))return;await Studio.importText(await f.files[0].text());cerrar();Studio.say("Proyecto abierto.");}catch(e){alert("No pude abrir ese archivo: "+e.message);}};
  f.click();
}
function pantallaAsistente(){
  const b=montar();b.innerHTML=`<h2>🧙 Asistente de proyecto</h2><p class="sub">Elige un cuento clásico (dominio público). Se crea con escenas, personajes, fondos y narración listos para editar.</p>`;
  const g=el("div","hist");let elegido=null;
  for(const h of Historias.LISTA){const c=el("button","card",`<b>${h.n}</b><span>${esc(h.d)}</span><span>${h.escenas} escenas</span>`);c.onclick=()=>{elegido=h;[...g.children].forEach(x=>x.classList.remove("on"));c.classList.add("on");sig.disabled=false;sig.textContent="Siguiente: formato →";};g.appendChild(c);}
  b.appendChild(g);
  b.appendChild(el("p","nota","Los animales se arman con las figuras de piezas pintadas de otro color (por ejemplo, los cerditos). Puedes cambiar colores y peinados en «Personajes», o reemplazarlos por tus propios dibujos desde el ✂️ Taller."));
  const v=el("div","row2"),a=el("button","sec","← Volver"),sig=el("button","pri","Elige un cuento");sig.disabled=true;a.onclick=inicioPantalla;
  sig.onclick=()=>pantallaAsistenteLienzo(elegido);v.append(a,sig);b.appendChild(v);
}
function pantallaAsistenteLienzo(h){
  const b=montar();b.innerHTML=`<h2>${h.n}</h2><p class="sub">Elige el formato del video para esta animación.</p>`;lienzoUI(b);
  const v=el("div","row2"),a=el("button","sec","← Atrás"),c=el("button","pri","Crear con este cuento");a.onclick=pantallaAsistente;
  c.onclick=async()=>{if(!(await confirmarReemplazo()))return;const p=Historias.crear(h.id,lz());await Studio.importText(JSON.stringify(p));cerrar();Studio.say("«"+p.nombre+"» está listo. Dale ▶ para verlo y 🎙 para grabar las voces.");};
  v.append(a,c);b.appendChild(v);
}
/* configuración del lienzo de un proyecto ya abierto */
function configurar(){
  const P=Studio.proj,l=Studio.lienzoDe(P);cfg.fmt=l.fmt;cfg.base=l.base;cfg.fps=l.fps;
  const b=montar();b.innerHTML=`<h2>📐 Configuración del lienzo</h2><p class="sub">Cambia el formato, la resolución base y los cuadros por segundo de «${esc(P.nombre||"tu proyecto")}».</p>`;lienzoUI(b);
  b.appendChild(el("p","nota","Si cambias el formato, lo que ya pusiste en el cuadro conserva su lugar y puede quedar cortado: revisa cada escena."));
  const v=el("div","row2"),a=el("button","sec","Cancelar"),c=el("button","pri","Aplicar");a.onclick=cerrar;
  c.onclick=()=>{P.lienzo=lz();Studio.aplicarLienzo();Studio.rerender();Studio.changed();cerrar();Studio.say("Lienzo: "+cfg.fmt+" · "+cfg.base+"p · "+cfg.fps+" fps.");};
  v.append(a,c);b.appendChild(v);
}
function abrirInicio(primeraVez){primera=!!primeraVez;inicioPantalla();}
window.Inicio={abrir:abrirInicio,configurar,cerrar};
})();
