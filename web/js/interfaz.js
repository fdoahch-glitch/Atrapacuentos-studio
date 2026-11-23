/* Interfaz guiada: barra Crear · Animar · Voz · Exportar, modo Simple/Avanzado, plantillas de escena,
   atajos y ayuda contextual, tutorial inicial y «Mi primer vídeo».
   No quita ni cambia ninguna herramienta: solo reordena botones existentes y agrega ayudas. */
(function(){
if(window.__RENDER)return;
const $=id=>document.getElementById(id),Q=(s,r)=>(r||document).querySelector(s),QA=(s,r)=>[...(r||document).querySelectorAll(s)];
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}};
const say=t=>window.Studio&&Studio.say&&Studio.say(t);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const css=document.createElement("style");css.textContent=`
#tabsMain{display:flex;gap:4px}#tabsMain button{background:#232740;padding:6px 12px;border-radius:99px;font-size:12.5px;font-weight:600}
#tabsMain button.on{background:#ffb347;color:#1a1305}
#gp{display:flex;gap:6px;align-items:center;padding-left:8px;border-left:1px solid #343a58}
#gp .gpi{display:none;gap:6px;align-items:center}#gp .gpi.on{display:flex}
#bModo,#bAyuda{background:#232740}
#top{overflow-x:auto;overflow-y:hidden;gap:6px!important}#top button{white-space:nowrap;padding:6px 9px;font-size:12.5px}#top input.nm{width:120px!important}
#top #info{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
@media(max-width:1680px){#top #info{display:none}}
body.simple .adv-ocultar{display:none!important}
.ia-modal{position:fixed;inset:0;background:#000a;z-index:9000;display:flex;align-items:center;justify-content:center}
.ia-box{background:#191c2a;border:1px solid #343a58;border-radius:14px;max-width:640px;width:calc(100% - 40px);max-height:86vh;overflow:auto;padding:18px 20px;color:#eee}
.ia-box h2{margin:0 0 6px;font-size:18px}.ia-box h4{margin:12px 0 4px;color:#ffb347}.ia-box kbd{background:#12141c;border:1px solid #343a58;border-radius:5px;padding:1px 6px;font-size:12px}
.ia-box .fila{display:flex;gap:10px;justify-content:space-between;margin:3px 0;font-size:13.5px}
.ia-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:8px}
.ia-card{background:#232740;border:1px solid #343a58;border-radius:12px;padding:12px;cursor:pointer;text-align:left}.ia-card:hover{border-color:#ffb347}.ia-card b{display:block;margin-bottom:3px}.ia-card span{font-size:12px;opacity:.8}
#guia1{position:fixed;left:14px;bottom:14px;z-index:8000;background:#191c2a;border:1px solid #ffb347;border-radius:14px;padding:12px 14px;width:280px;color:#eee;box-shadow:0 8px 30px #0008}
#guia1 h3{margin:0 0 6px;font-size:14px}#guia1 .pas{display:flex;gap:8px;align-items:center;margin:5px 0;font-size:13px}#guia1 .pas i{font-style:normal;width:20px;height:20px;border-radius:50%;border:2px solid #555;display:inline-flex;align-items:center;justify-content:center;font-size:11px}
#guia1 .pas.ok i{background:#4cc38a;border-color:#4cc38a;color:#06210f}#guia1 .pas button{margin-left:auto;font-size:11.5px;padding:3px 8px}
`;document.head.appendChild(css);

/* ---------- barra superior: Crear · Animar · Voz · Exportar ---------- */
const GRUPOS=[["crear","Crear"],["animar","Animar"],["voz","Voz"],["exportar","Exportar"]];
function barra(){
  const st=$("steps");if(!st)return;
  st.id="tabsMain";st.innerHTML=GRUPOS.map(([k,n])=>`<button data-tab="${k}" title="${n}">${n}</button>`).join("");
  const gp=document.createElement("div");gp.id="gp";
  gp.innerHTML=GRUPOS.map(([k])=>`<div class="gpi" data-g="${k}"></div>`).join("");
  st.after(gp);
  const put=(g,...els)=>els.forEach(e=>e&&Q(`[data-g=${g}]`,gp).appendChild(e));
  const nuevo=(txt,tit,fn)=>{const b=document.createElement("button");b.innerHTML=txt;b.title=tit;b.onclick=fn;return b;};
  put("crear",nuevo("📄 Plantillas","Empieza una escena ya armada",plantillas),nuevo("🎬 Primer vídeo","Te guío paso a paso hasta tener tu primer MP4",()=>guia(true)),nuevo("🔎 Buscar","Busca personajes, fondos y decoración (Ctrl+F)",buscar));
  put("animar",nuevo("🏃 Movimientos","Biblioteca de movimientos: saludar, saltar, correr, comer…",()=>window.Movs&&Movs.abrir()),nuevo("🛤 Trayectoria","Graba o dibuja el camino de lo elegido",()=>{const it=Studio.seleccion&&Studio.seleccion();if(!it){say("Elige primero un elemento en el cuadro.");return;}Studio.grabarTrayecto("dibujar");}),nuevo("⏱ Pistas","Muestra u oculta la línea de tiempo con pistas",()=>{const w=$("trkWrap");if(w)w.style.display=w.style.display==="none"?"":"none";}));
  put("voz",$("bDub"),$("bSub"));
  put("exportar",$("bFoto"),$("bExp"));
  QA("[data-tab]",st).forEach(b=>b.onclick=()=>tab(b.dataset.tab));
  tab(ls("atr_tab")||"crear",true);
}
function tab(k,silencio){
  ls("atr_tab",k);
  QA("#tabsMain button").forEach(b=>b.classList.toggle("on",b.dataset.tab===k));
  QA("#gp .gpi").forEach(g=>g.classList.toggle("on",g.dataset.g===k));
  if(silencio)return;
  if(k==="crear"){const r=Q("#rail .rb");r&&r.click();}
}
function buscar(){
  const m=ventana(`<h2>🔎 Buscar recursos</h2><input id="busQ" type="text" placeholder="Escribe: árbol, bosque, niña, dino…" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:9px;padding:9px;font-size:14px"><div id="busR" style="margin-top:10px"></div>`);
  const q=Q("#busQ",m),R=Q("#busR",m);q.focus();
  const pinta=()=>{const L=Studio.recursos(q.value);R.innerHTML=!q.value.trim()?'<p style="opacity:.7">Busca en fondos, personajes, decoración y tus imágenes a la vez.</p>':L.length?L.map((x,i)=>`<div class="fila" style="align-items:center"><span>${esc(x.n)} <small style="opacity:.6">· ${x.tipo}</small></span><button data-i="${i}">Agregar</button></div>`).join(""):"<p>No encontré nada con ese nombre.</p>";
    QA("[data-i]",R).forEach(b=>b.onclick=()=>{L[+b.dataset.i].ir();m.remove();});};
  q.oninput=pinta;q.onkeydown=e=>{if(e.key==="Enter"){const b=Q("[data-i]",R);b&&b.click();}};pinta();
}

/* ---------- modo Simple / Avanzado ---------- */
const AVANZADO=/fotogramas clave|física|cortes de cámara|poses y ciclos|aspecto|colores|animar el fondo|la cámara sigue|curvas/i;
function aplicarModo(){
  const simple=ls("atr_modo")==="simple";document.body.classList.toggle("simple",simple);
  const b=$("bModo");if(b){b.textContent=simple?"🧰 Simple":"🧰 Avanzado";b.title=simple?"Estás en Modo Simple. Pulsa para ver todas las herramientas.":"Estás en Modo Avanzado. Pulsa para ver solo lo habitual.";}
  filtrar();
}
function filtrar(){
  QA("#props .card").forEach(c=>{const h=Q("h4",c);c.classList.toggle("adv-ocultar",!!(h&&AVANZADO.test(h.textContent)));});
  QA("#rail .rb").forEach(b=>b.classList.toggle("adv-ocultar",/taller|dibujo/i.test(b.textContent)));
  const t=$("trkWrap");if(t)t.classList.toggle("adv-ocultar",document.body.classList.contains("simple")&&ls("atr_simple_pistas")!=="1");
}
function modo(){ls("atr_modo",ls("atr_modo")==="simple"?"avanzado":"simple");aplicarModo();say(ls("atr_modo")==="simple"?"Modo Simple: solo lo habitual. Todo sigue disponible en Modo Avanzado.":"Modo Avanzado: todas las herramientas.");}

/* ---------- ventanas ---------- */
function ventana(html){
  const m=document.createElement("div");m.className="ia-modal";m.innerHTML=`<div class="ia-box">${html}</div>`;document.body.appendChild(m);
  m.addEventListener("pointerdown",e=>{if(e.target===m)m.remove();});
  const cerrar=e=>{if(e.key==="Escape"){m.remove();document.removeEventListener("keydown",cerrar,true);}};document.addEventListener("keydown",cerrar,true);
  return m;
}

/* ---------- plantillas de escena ---------- */
const PLANT=[
 {id:"narracion",n:"📖 Narración",d:"Un fondo bonito y un título. Para contar con voz en off.",f:{id:"pradera"},dur:10,txt:[{tipo:"titulo",txt:"Había una vez…",x:50,y:18,size:9,t0:0,t1:4,ent:"aparecer"}]},
 {id:"dialogo",n:"💬 Diálogo",d:"Dos personajes, uno frente al otro.",f:{id:"pradera"},dur:12,act:2},
 {id:"titulo",n:"🎬 Título",d:"Pantalla de color con un título grande.",f:{id:"blanco",color:"#2b2f55"},dur:5,txt:[{tipo:"titulo",txt:"Título del cuento",x:50,y:45,size:11,t0:0,t1:0,ent:"rebote"}]},
 {id:"paneo",n:"🌄 Paisaje con paneo",d:"El fondo se desplaza despacio. Ideal para viajes.",f:{id:"patagonia",mov:"deriva",vel:50},dur:12},
 {id:"noche",n:"🌙 Noche estrellada",d:"Cielo de noche con estrellas.",f:{id:"noche"},dur:10,hora:"noche",efecto:"estrellas"},
 {id:"bosque",n:"🌲 Bosque",d:"Un bosque con ambiente de luciérnagas.",f:{id:"bosque"},dur:10,efecto:"luciernagas"}
];
function plantillas(){
  const m=ventana(`<h2>📄 Plantillas de escena</h2><p>Elige una y se agrega como escena nueva. Después cambias lo que quieras.</p><div class="ia-grid">${PLANT.map(p=>`<div class="ia-card" data-p="${p.id}"><b>${p.n}</b><span>${p.d}</span></div>`).join("")}</div>`);
  QA("[data-p]",m).forEach(c=>c.onclick=()=>{aplicarPlantilla(PLANT.find(p=>p.id===c.dataset.p));m.remove();});
}
function aplicarPlantilla(p){
  const S=Studio.serie;if(!S)return;
  $("bAddScene").click();
  const sc=window.Serie.curScene();
  sc.fondo=JSON.parse(JSON.stringify(p.f));sc.dur=p.dur;if(p.hora)sc.hora=p.hora;if(p.efecto)sc.efecto=p.efecto;
  sc.textos=(p.txt||[]).map(o=>Object.assign({id:"t"+Date.now().toString(36)+Math.random().toString(36).slice(2,4)},o));
  if(p.act){const ids=Object.keys(window.SerieArt.HUM_PRE||{});for(let i=0;i<p.act;i++){S.addActor("hum:"+ids[i%ids.length],"Personaje "+(i+1));}
    sc.items.filter(i=>i.kind==="actor").forEach((it,i,a)=>{it.x=a.length===1?640:Math.round(1280*(i?0.72:0.28));it.flip=i?-1:1;});}
  Studio.changed();window.Serie.renderProps&&window.Serie.renderProps();Studio.rerender&&Studio.rerender();say("Escena «"+p.n.replace(/^\S+\s/,"")+"» agregada.");
}

/* ---------- atajos y ayuda contextual ---------- */
const ATAJOS=[["Espacio","Vista previa / pausa"],["Ctrl+Z · Ctrl+Y","Deshacer · Rehacer"],["Ctrl+C · Ctrl+V","Copiar · Pegar elementos"],["Ctrl+D","Duplicar lo elegido"],["Ctrl+A","Elegir todo en la escena"],["Shift o Ctrl + clic","Sumar o quitar de la selección"],["Supr","Quitar lo elegido"],["Flechas","Mover (con Shift, más rápido)"],["Esc","Dejar de elegir"],["Ctrl+S","Guardar proyecto en un archivo"],["Ctrl+F","Buscar recursos"],["?","Abrir esta ayuda"]];
function contexto(){
  const it=Studio.seleccion&&Studio.seleccion(),n=Studio.grupoN?Studio.grupoN():0;
  if(n>1)return ["Varios elementos elegidos",["Arrastra uno y se mueven todos.","Usa Alinear y Distribuir para ordenarlos.","Ctrl+D los duplica; Supr los quita."]];
  if(it&&it.kind==="actor")return ["Personaje elegido",["Arrástralo para moverlo; la esquina naranja cambia el tamaño.","Con «Acciones y cara» le das gestos y expresiones.","Pon una línea de voz en el Estudio de grabación y su boca se moverá sola."]];
  if(it)return ["Elemento elegido",["Arrástralo para moverlo; la esquina naranja cambia el tamaño.","Con «Animar entrada y salida» aparece y se va con efecto.","El candado lo protege de moverlo sin querer."]];
  return ["Escena sin nada elegido",["Haz clic en algo del cuadro para editarlo, o arrastra personajes desde la biblioteca.","Cambia el fondo en la pestaña Fondos.","Cuando esté lista, usa Voz para grabar y Exportar para sacar el MP4."]];
}
function ayuda(){
  const [t,tips]=contexto();
  const m=ventana(`<h2>❓ Ayuda</h2><h4>${t}</h4><ul>${tips.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
  <h4>Atajos de teclado</h4>${ATAJOS.map(([k,d])=>`<div class="fila"><kbd>${esc(k)}</kbd><span>${esc(d)}</span></div>`).join("")}
  <div class="btns" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button id="ayTut">🎓 Ver el tutorial</button><button id="ayPri">🎬 Mi primer vídeo</button><button id="ayCer" class="go">Cerrar</button></div>`);
  Q("#ayCer",m).onclick=()=>m.remove();Q("#ayTut",m).onclick=()=>{m.remove();tutorial();};Q("#ayPri",m).onclick=()=>{m.remove();guia(true);};
}
window.addEventListener("keydown",e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||"")||e.target.isContentEditable)return;
  if(e.key==="?"){e.preventDefault();ayuda();}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="f"){e.preventDefault();buscar();}
});

/* ---------- tutorial inicial ---------- */
const PASOS=[
 ["🎬 Bienvenido a Atrapacuentos Studio","Aquí armas animaciones de recortes y las sacas en MP4 para YouTube. Todo funciona sin internet."],
 ["Cuatro pestañas arriba","<b>Crear</b>: fondos, personajes y plantillas. <b>Animar</b>: movimientos y línea de tiempo. <b>Voz</b>: grabar y subtítulos. <b>Exportar</b>: sacar el vídeo."],
 ["Arrastra y suelta","Toma un personaje de la biblioteca de la izquierda y suéltalo en la escena. Con Shift o Ctrl puedes elegir varios a la vez."],
 ["Dos modos","<b>Modo Simple</b> muestra solo lo habitual. <b>Modo Avanzado</b> deja a la mano todas las herramientas profesionales. Puedes cambiar cuando quieras desde la barra."]
];
function tutorial(){
  let i=0;const m=ventana("");const box=Q(".ia-box",m);
  const pinta=()=>{const [t,d]=PASOS[i],ult=i===PASOS.length-1;
    box.innerHTML=`<h2>${t}</h2><p style="font-size:14px;line-height:1.5">${d}</p><div style="display:flex;gap:8px;align-items:center;margin-top:14px"><span style="opacity:.6;font-size:12px">${i+1} de ${PASOS.length}</span><span style="flex:1"></span>${i?'<button id="tAnt">← Atrás</button>':""}${ult?'<button id="tSimple">Empezar en Modo Simple</button><button id="tPri" class="go">🎬 Mi primer vídeo</button><button id="tAv">Modo Avanzado</button>':'<button id="tSig" class="go">Siguiente →</button>'}<button id="tOmitir" title="Cerrar el tutorial">Omitir</button></div>`;
    const f=(id,fn)=>{const b=Q("#"+id,box);if(b)b.onclick=fn;};
    f("tAnt",()=>{i--;pinta();});f("tSig",()=>{i++;pinta();});f("tOmitir",fin);
    f("tSimple",()=>{ls("atr_modo","simple");aplicarModo();fin();});f("tAv",()=>{ls("atr_modo","avanzado");aplicarModo();fin();});f("tPri",()=>{fin();guia(true);});};
  const fin=()=>{ls("atr_tutorial","1");m.remove();};
  pinta();
}

/* ---------- Mi primer vídeo: guía con pasos que se marcan solos ---------- */
let g1=null,played=false,exportado=false;
const PRI=[
 ["Elige un fondo",()=>{tab("crear");const b=QA("#rail .rb").find(x=>/fondos/i.test(x.textContent));b&&b.click();},()=>{const sc=window.Serie&&Serie.curScene();return !!sc&&(sc.fondo&&sc.fondo.id!=="pradera"||!!(sc.fondo&&sc.fondo.img));}],
 ["Pon un personaje",()=>{tab("crear");const b=QA("#rail .rb").find(x=>/personajes/i.test(x.textContent));b&&b.click();},()=>{const sc=window.Serie&&Serie.curScene();return !!sc&&sc.items.some(i=>i.kind==="actor");}],
 ["Haz que diga algo",()=>{tab("voz");$("bDub").click();},()=>{const sc=window.Serie&&Serie.curScene();return !!sc&&(sc.lineas||[]).length>0;}],
 ["Mira la vista previa",()=>{tab("animar");$("bPlay").click();},()=>played],
 ["Exporta tu MP4",()=>{tab("exportar");$("bExp").click();},()=>exportado]
];
function guia(abrir){
  if(g1){if(abrir)g1.hidden=false;return;}
  g1=document.createElement("div");g1.id="guia1";document.body.appendChild(g1);
  $("bPlay").addEventListener("click",()=>{played=true;pintaGuia();});$("bExp").addEventListener("click",()=>{exportado=true;pintaGuia();});
  setInterval(pintaGuia,1500);pintaGuia();
}
function pintaGuia(){
  if(!g1||g1.hidden)return;
  const hechos=PRI.map(p=>{try{return !!p[2]();}catch(e){return false;}}),n=hechos.filter(Boolean).length;
  g1.innerHTML=`<div style="display:flex;align-items:center"><h3 style="flex:1">🎬 Mi primer vídeo · ${n}/${PRI.length}</h3><button id="g1x" title="Cerrar la guía">✖</button></div>`+PRI.map((p,i)=>`<div class="pas${hechos[i]?" ok":""}"><i>${hechos[i]?"✓":i+1}</i>${p[0]}<button data-i="${i}">Ir</button></div>`).join("")+(n===PRI.length?'<p style="margin:8px 0 0;color:#4cc38a">¡Listo! Ya hiciste tu primer vídeo.</p>':"");
  Q("#g1x",g1).onclick=()=>{g1.hidden=true;};QA("[data-i]",g1).forEach(b=>b.onclick=()=>PRI[+b.dataset.i][1]());
}

/* ---------- arranque ---------- */
window.addEventListener("DOMContentLoaded",()=>{
  barra();
  const top=Q("#top .sp");
  const bm=document.createElement("button");bm.id="bModo";bm.onclick=modo;const ba=document.createElement("button");ba.id="bAyuda";ba.textContent="❓";ba.title="Ayuda y atajos (?)";ba.onclick=ayuda;
  const u=$("bUndo");u.before(bm,ba);
  aplicarModo();
  const obs=new MutationObserver(()=>filtrar());obs.observe($("props"),{childList:true});obs.observe($("rail"),{childList:true});
  if(!ls("atr_tutorial"))setTimeout(()=>{if(!$("inicio")||getComputedStyle($("inicio")).display==="none")tutorial();else{const w=setInterval(()=>{const i=$("inicio");if(!i||getComputedStyle(i).display==="none"){clearInterval(w);tutorial();}},800);}},900);
  window.Interfaz={tab,modo,ayuda,plantillas,tutorial,guia:()=>guia(true),aplicarPlantilla,PLANT};
});
})();
