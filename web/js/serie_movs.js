/* Biblioteca de movimientos: se aplican a lo elegido en el momento de la barra de tiempo, se pueden combinar
   (a la vez o una tras otra), editar después como cualquier acción o fotograma clave, y guardar los propios para reutilizarlos. */
(function(){
if(window.__RENDER)return;
const $=id=>document.getElementById(id),esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const S=()=>window.Serie,R=()=>window.SerieRig;
const dirOf=it=>(it.flip<0?-1:1);
const kf=(it,t,v)=>S().setKf(it,t,v);

/* movimientos que usan acciones del personaje (solo personajes por piezas) */
const acc=(id,n,e,d,k)=>({id,n,e,d,actor:true,dur:()=>(R().ACC[k]||{d:2}).d,aplicar:(it,t0)=>{it.acc=it.acc||[];it.acc.push({k,t0:Math.round(t0*10)/10});}});
const LIB=[
 acc("saludar","Saludar","👋","Levanta el brazo y saluda","saludar"),
 acc("saltar","Saltar","⬆","Un salto con los brazos arriba","saltar"),
 {id:"rebotar",n:"Rebotar",e:"🏀",d:"Botes que se van haciendo más chicos. Sirve para cualquier elemento.",dur:()=>1.4,aplicar:(it,t0)=>{
   const y0=S().posAt(it,t0).y,A=[0,-90,0,-48,0,-20,0],T=[0,.3,.6,.8,1,1.15,1.3];T.forEach((dt,i)=>kf(it,t0+dt,{y:Math.round(y0+A[i]),e:i%2?"salida":"entrada"}));}},
 {id:"girar_cabeza",n:"Girar la cabeza",e:"🙆",d:"Mira a un lado y al otro. En otros elementos se mece.",dur:()=>2.4,aplicar:(it,t0)=>{
   if(it.kind==="actor"){it.acc=it.acc||[];it.acc.push({k:"girar_cabeza",t0:Math.round(t0*10)/10});}
   else{const r0=S().posAt(it,t0).r||0;[[0,0],[.4,.35],[1.2,-.35],[2,0]].forEach(([dt,a])=>kf(it,t0+dt,{r:r0+a*.5,e:"suave"}));}}},
 {id:"correr",n:"Correr",e:"🏃",d:"Corre hacia donde mira, unos 500 px.",actor:true,dur:()=>2.5,aplicar:(it,t0)=>{
   const p=S().posAt(it,t0),d=dirOf(it);if((it.paso||1)<1.8)it.paso=1.8;kf(it,t0,{x:Math.round(p.x),y:Math.round(p.y),e:"lineal"});kf(it,t0+2.5,{x:Math.round(p.x+d*500),y:Math.round(p.y),e:"lineal"});}},
 {id:"caminar",n:"Caminar",e:"🚶",d:"Camina hacia donde mira, unos 300 px.",actor:true,dur:()=>3,aplicar:(it,t0)=>{
   const p=S().posAt(it,t0),d=dirOf(it);if((it.paso||1)>1.2)it.paso=1;kf(it,t0,{x:Math.round(p.x),y:Math.round(p.y),e:"lineal"});kf(it,t0+3,{x:Math.round(p.x+d*300),y:Math.round(p.y),e:"lineal"});}},
 acc("comer","Comer","🍎","Se lleva comida a la boca y mastica","comer"),
 acc("asustarse","Asustarse","😱","Se sobresalta con los brazos arriba","asustarse"),
 acc("esperar","Esperar","⏳","Impaciente: mira alrededor y golpea el suelo con el pie","esperar"),
 acc("hablar","Hablar","🗣","Mueve la boca y gesticula, aunque no haya voz","hablar"),
 acc("bailar","Bailar","💃","Baila con todo el cuerpo","bailar"),
 acc("reir","Reír","😄","Se ríe moviendo el cuerpo","reír"),
 acc("pensar","Pensar","🤔","Se queda pensando con la mano en la cara","pensar"),
 acc("senalar","Señalar","👉","Señala hacia adelante","señalar")
];
/* ---- texto a movimiento: entiende frases simples en español y arma la secuencia con los movimientos de arriba ---- */
const PAL=[["senalar",/senal|apunt|muestr/],["saludar",/salud|hola|chao|despid/],["saltar",/salt|brinc/],["rebotar",/rebot|bote/],["girar_cabeza",/gira.*cabeza|mira.*(lado|alrededor)|voltea/],
  ["correr",/corr|huy|escap/],["caminar",/camin|avanz|pasea|\bentra|llega|\bsale|\bva\b|\bir\b/],["comer",/\bcom(e|er|en|iendo)\b|mastic|devor/],["asustarse",/asust|susto|miedo|sobresalt/],
  ["esperar",/esper|impacient/],["hablar",/habl|cuent|dice|conversa|platic/],["bailar",/bail|dans/],["reir",/r[ie]e|risa|carcaj|re[ií]r/],["pensar",/pens|pienso|piensa|piensan|medit|reflexion|duda/]];
const NUM={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5};
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
/* devuelve {pasos:[{id,rep,texto}], sinEntender:[…], dir:-1|1|0} */
function texto(frase){
  const t=norm(frase),trozos=t.split(/,|;|\.| y luego | y despues | luego | despues | entonces | y | pero /).map(x=>x.trim()).filter(Boolean),pasos=[],no=[];
  let dir=/izquierda/.test(t)?-1:/derecha/.test(t)?1:0;
  for(const tz of trozos){
    let ok=null;for(const [id,re] of PAL){if(re.test(tz)){ok=id;break;}}
    if(!ok){if(!/^(el|la|se|y|a|que|luego|hacia|la izquierda|la derecha|izquierda|derecha)$/.test(tz)&&tz.length>2&&!/^hacia /.test(tz))no.push(tz);continue;}
    let rep=1;const mm=tz.match(/(\d+|un|una|uno|dos|tres|cuatro|cinco)\s+vez|(dos|tres|cuatro|cinco)\s+veces|(\d+)\s+veces/);
    if(mm){const v=mm[1]||mm[2]||mm[3];rep=Math.max(1,Math.min(6,NUM[v]||+v||1));}
    pasos.push({id:ok,rep,texto:tz});
  }
  return {pasos,sinEntender:no,dir};
}
/* ---- sugerencias según las piezas del personaje ---- */
function sugerir(it){
  const sug=[];let roles=new Set();
  try{const d=Studio.serie.defOf(it);(d&&d.piezas||[]).forEach(p=>{if(p.rol)roles.add(p.rol);});}catch(e){}
  const add=(id,why)=>{if(!sug.find(x=>x.id===id))sug.push({id,why});};
  if(it.kind==="actor"){
    if(roles.has("pata")||roles.has("muslo")){add("caminar","tiene piernas");add("correr","tiene piernas");add("saltar","tiene piernas");}
    if(roles.has("brazo")||roles.has("saluda")){add("saludar","tiene brazos");add("senalar","tiene brazos");add("bailar","tiene brazos y piernas");}
    if(roles.has("cabeza")){add("girar_cabeza","tiene cabeza");add("pensar","tiene cabeza");}
    if(roles.has("boca")||roles.has("mandibula")){add("hablar","tiene boca");add("comer","tiene boca");}
    if(roles.has("ojo"))add("asustarse","tiene ojos que reaccionan");
    if(roles.has("colgante")||roles.has("oreja"))add("rebotar","pelo u orejas que cuelgan: se ve la física al rebotar");
    if(!sug.length){add("rebotar","funciona con cualquier elemento");add("girar_cabeza","");}
  }else{add("rebotar","sirve para cualquier elemento");add("girar_cabeza","se mece");}
  return sug;
}
/* ---- mis movimientos (se guardan en el proyecto y en este equipo) ---- */
function propios(){
  const a=[],vistos=new Set(),proy=(window.Studio&&Studio.proj&&Studio.proj.movs)||[];
  let loc=[];try{loc=JSON.parse(localStorage.getItem("atr_movs")||"[]");}catch(e){}
  for(const m of proy.concat(loc)){if(m&&m.id&&!vistos.has(m.id)){vistos.add(m.id);a.push(m);}}return a;
}
function guardarPropios(L){const proy=Studio.proj;if(proy)proy.movs=L;try{localStorage.setItem("atr_movs",JSON.stringify(L));}catch(e){}Studio.changed();}
function capturar(it,nombre,desde,hasta){
  const A=(it.acc||[]).filter(a=>a.t0>=desde-1e-6&&a.t0<=hasta+1e-6),K=(it.kf||[]).filter(f=>f.t>=desde-1e-6&&f.t<=hasta+1e-6);
  if(!A.length&&!K.length)return null;
  const base=S().posAt(it,desde),m={id:"m"+Date.now().toString(36),n:nombre,e:"⭐",d:"Tu movimiento guardado",propio:true,
    acc:A.map(a=>{const o=JSON.parse(JSON.stringify(a));o.t0=Math.round((a.t0-desde)*10)/10;delete o._m;return o;}),
    kf:K.map(f=>{const o={t:Math.round((f.t-desde)*100)/100,e:f.e};if(f.x!=null)o.dx=Math.round(f.x-base.x);if(f.y!=null)o.dy=Math.round(f.y-base.y);if(f.s!=null)o.s=f.s;if(f.r!=null)o.r=f.r;if(f.op!=null)o.op=f.op;return o;})};
  m.dur=Math.max(0,...m.acc.map(a=>a.t0+(a.dur||(R().ACC[a.k]||{d:1.4}).d)),...m.kf.map(f=>f.t),1);return m;
}
function aplicarPropio(m){return {id:m.id,n:m.n,dur:()=>m.dur||2,aplicar:(it,t0)=>{
  const base=S().posAt(it,t0);
  for(const a of m.acc||[]){if(a.k.startsWith("pose:")&&!(it.kind==="actor"))continue;const o=JSON.parse(JSON.stringify(a));o.t0=Math.round((t0+a.t0)*10)/10;(it.acc=it.acc||[]).push(o);}
  for(const f of m.kf||[]){const v={e:f.e};if(f.dx!=null)v.x=Math.round(base.x+f.dx);if(f.dy!=null)v.y=Math.round(base.y+f.dy);if(f.s!=null)v.s=f.s;if(f.r!=null)v.r=f.r;if(f.op!=null)v.op=f.op;kf(it,t0+f.t,v);}}};}

function ventana(html){const m=document.createElement("div");m.className="ia-modal";m.innerHTML=`<div class="ia-box" style="max-width:720px">${html}</div>`;document.body.appendChild(m);
  m.addEventListener("pointerdown",e=>{if(e.target===m)m.remove();});const c=e=>{if(e.key==="Escape"){m.remove();document.removeEventListener("keydown",c,true);}};document.addEventListener("keydown",c,true);return m;}

function abrir(){
  const objs=S().quedan();if(!objs.length){Studio.say("Primero elige un personaje o elemento en el cuadro.");return;}
  const todos=LIB.concat(propios().map(aplicarPropio)),meta=LIB.concat(propios().map(m=>Object.assign({},m,{propio:true})));
  const hayActor=objs.some(o=>o.kind==="actor"),t0=Math.round(S().getT()*10)/10;
  const sc=Studio.serie.proj().mundos[Studio.serie.proj().mundo],voz=[];
  if(window.Dub)for(const ln of Dub.lines(sc)){if(ln.sfx||!(ln.txt||"").trim())continue;const ws=Dub.words(ln);ws.forEach((w,k)=>{if(k%1===0)voz.push({t:w.t0,txt:`${(ln.txt||"").trim().slice(0,22)}… → «${w.w}» (${w.t0.toFixed(1)} s)`});});}
  const sug=sugerir(objs[0]);
  const tarj=meta.map((m,i)=>{const off=m.actor&&!hayActor;return `<label class="ia-card" style="${off?"opacity:.4;cursor:not-allowed":""}"><input type="checkbox" data-m="${i}" ${off?"disabled":""} style="float:right"><b>${m.e||"⭐"} ${esc(m.n)}</b><span>${esc(m.d||"")}${off?" (solo personajes)":""}</span>${m.propio?`<br><button data-del="${esc(m.id)}" style="margin-top:4px;font-size:11px">Quitar</button>`:""}</label>`;}).join("");
  const m=ventana(`<h2>🏃 Movimientos</h2><p>Se aplican a <b>${objs.length>1?objs.length+" elementos":"lo elegido"}</b> a partir del segundo <b>${t0}</b> de la barra de tiempo. Marca uno o varios.</p>
  <div style="background:#1b1e30;border-radius:10px;padding:10px;margin:8px 0"><b>✍ Escribe lo que debe hacer</b>
   <div style="display:flex;gap:6px;margin-top:6px"><input id="movTx" type="text" placeholder="Ej: saluda, luego camina hacia la derecha y salta dos veces" style="flex:1;min-width:0;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:9px;padding:8px"><button id="movTxOk" class="go">Entender</button></div>
   <div id="movTxR" style="font-size:12px;margin-top:6px;opacity:.85"></div></div>
  ${sug.length?`<div style="font-size:12.5px;margin:6px 0"><b>✨ Sugeridos para este personaje:</b> ${sug.map(x=>`<button data-sug="${x.id}" title="${esc(x.why)}" style="margin:2px">${esc((LIB.find(l=>l.id===x.id)||{}).n||x.id)}</button>`).join("")}</div>`:""}
  <div class="ia-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${tarj}</div>
  ${voz.length?`<p style="margin-top:12px"><b>Empezar en una palabra de la voz</b> <select id="movPal"><option value="">No, usar el segundo ${t0}</option>${voz.map((x,i)=>`<option value="${x.t.toFixed(2)}">${esc(x.txt)}</option>`).join("")}</select></p>`:""}
  <p style="margin-top:12px"><label><input type="radio" name="movOrd" value="seq" checked> Uno tras otro</label> &nbsp; <label><input type="radio" name="movOrd" value="par"> Todos a la vez</label></p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="movAp" class="go">Aplicar y ver</button><button id="movGu">⭐ Guardar lo que ya hizo este personaje como movimiento…</button><button id="movCe">Cerrar</button></div>`);
  m.querySelector("#movCe").onclick=()=>m.remove();
  const marcar=id=>{const i=meta.findIndex(x=>x.id===id),c=m.querySelector(`[data-m="${i}"]`);if(c&&!c.disabled)c.checked=!c.checked;};
  m.querySelectorAll("[data-sug]").forEach(b=>b.onclick=()=>{marcar(b.dataset.sug);b.style.outline="2px solid #7ee787";});
  m.querySelector("#movTxOk").onclick=()=>{
    const r=texto(m.querySelector("#movTx").value),R_=m.querySelector("#movTxR");
    if(!r.pasos.length){R_.innerHTML="😕 No entendí ningún movimiento. Prueba con verbos como: saluda, camina, corre, salta, baila, habla, come, piensa, se asusta, ríe, espera.";return;}
    const sel=[];for(const p of r.pasos){const mv=LIB.find(x=>x.id===p.id);for(let k=0;k<p.rep;k++)sel.push(mv);}
    const seq=sel.filter(mv=>!(mv.actor&&!hayActor));
    const tIni=Math.round(t0*10)/10;
    for(const it of objs){let t=tIni;if(r.dir&&it.kind==="actor")it.flip=r.dir<0?-1:0;for(const mv of seq){if(mv.actor&&it.kind!=="actor")continue;mv.aplicar(it,t);t+=mv.dur()+.15;}}
    Studio.changed();window.Serie.renderProps();m.remove();Studio.rerender&&Studio.rerender();Studio.playFrom(Math.max(0,tIni-.5));
    Studio.say("Armé: "+r.pasos.map(p=>(LIB.find(x=>x.id===p.id)||{}).n+(p.rep>1?" ×"+p.rep:"")).join(" → ")+(r.sinEntender.length?". No entendí: "+r.sinEntender.join(", "):"")+".");};
  m.querySelectorAll("[data-del]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();guardarPropios(propios().filter(x=>x.id!==b.dataset.del));m.remove();abrir();});
  m.querySelector("#movAp").onclick=()=>{
    const sel=[...m.querySelectorAll("[data-m]:checked")].map(c=>todos[+c.dataset.m]);if(!sel.length){Studio.say("Marca al menos un movimiento.");return;}
    const seq=m.querySelector("[name=movOrd]:checked").value==="seq";
    const pal=m.querySelector("#movPal"),tIni=pal&&pal.value?+pal.value:t0;
    for(const it of objs){let t=Math.round(tIni*10)/10;for(const mv of sel){if(mv.actor&&it.kind!=="actor")continue;mv.aplicar(it,t);if(seq)t+=mv.dur()+.15;}}
    Studio.changed();window.Serie.renderProps();m.remove();Studio.rerender&&Studio.rerender();Studio.playFrom(Math.max(0,tIni-.5));Studio.say("Movimiento aplicado. Lo puedes editar en la lista de acciones o en las curvas.");};
  m.querySelector("#movGu").onclick=()=>{
    const it=objs[0];
    const caja=ventana(`<h2>⭐ Guardar movimiento</h2><p>Guarda las acciones y fotogramas de «${esc((it.ficha&&it.ficha.nombre)||"este elemento")}» entre dos momentos.</p>
     <p><input id="mgN" type="text" placeholder="Nombre, por ejemplo: Entra saludando" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:9px;padding:8px"></p>
     <p>Desde <input id="mgA" type="number" step=".5" min="0" value="0" style="width:70px"> s hasta <input id="mgB" type="number" step=".5" min="0" value="${Math.round(((Studio.serie.proj().mundos[Studio.serie.proj().mundo]||{}).dur||10)*2)/2}" style="width:70px"> s</p>
     <div style="display:flex;gap:8px"><button id="mgOk" class="go">Guardar</button><button id="mgNo">Cancelar</button></div><p id="mgMsg" style="color:#ffb347"></p>`);
    caja.querySelector("#mgNo").onclick=()=>caja.remove();
    caja.querySelector("#mgOk").onclick=()=>{const n=caja.querySelector("#mgN").value.trim();if(!n){caja.querySelector("#mgMsg").textContent="Ponle un nombre.";return;}
      const mv=capturar(it,n,+caja.querySelector("#mgA").value,+caja.querySelector("#mgB").value);if(!mv){caja.querySelector("#mgMsg").textContent="No hay acciones ni fotogramas en ese tramo.";return;}
      guardarPropios(propios().concat([mv]));caja.remove();m.remove();Studio.say("Movimiento «"+n+"» guardado. Ya está en la biblioteca.");abrir();};
  };
}
window.Movs={LIB,texto,sugerir,abrir,propios,capturar,aplicarPropio,guardarPropios};
})();
