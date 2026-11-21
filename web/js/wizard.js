/* Asistente de historias: "¿qué historia quieres crear?" arma las escenas iniciales del cuento */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const Z=8;
const mv=(x,z,t0,t1)=>({x,z:z===undefined?Z:z,t0:t0||0,t1:t1});
const L=(t0,txt)=>({t0,txt});
const it=(id,x,o)=>Object.assign({id,x,z:Z},o||{});
/* ---- cuentos listos ---- */
const STORIES=[
 {id:"cerditos",n:"Los tres cerditos",e:"🐷",d:"Tres cerditos construyen casas y un lobo quiere derribarlas.",escenas:[
   {nombre:"Los cerditos construyen",lineas:[L(0.5,"Había una vez tres cerditos hermanos que decidieron construir sus propias casas."),L(4.5,"El primero la hizo de paja, el segundo de madera y el tercero, con mucho esfuerzo, de ladrillos.")],tema:"bosque",dur:9,cam:"derecha",items:[
     it("casa_paja",4,{z:10}),it("casa_madera",11,{z:10}),it("casa_ladrillo",18,{z:10}),
     it("cerdito",-12,{mov:mv(2,Z,0,6)}),it("cerdito",-14,{over:{paleta:{cuerpo:"#f0b0a0",detalle:"#e68a80"}},mov:mv(9,Z,1,7)}),it("cerdito",-16,{over:{paleta:{cuerpo:"#f8bcc8",detalle:"#f09aaa"}},mov:mv(16,Z,2,8)})]},
   {nombre:"El lobo sopla",lineas:[L(0.5,"Un día llegó un lobo muy hambriento."),L(3,"¡Soplaré y soplaré, y tu casa derribaré!")],tema:"bosque",dur:7,cam:"acercar",items:[
     it("lobo",-12,{mov:mv(1,Z,0,4)}),it("casa_paja",6,{z:9}),it("cerdito",4,{ry:0})]},
   {nombre:"La casa de ladrillos",lineas:[L(0.5,"Pero la casa de ladrillos era fuerte y el lobo no pudo derribarla."),L(4.5,"Los tres cerditos se salvaron y vivieron felices para siempre.")],tema:"bosque",dur:8,cam:"seguir",items:[
     it("lobo",-14,{mov:mv(5,Z,0,7)}),it("casa_ladrillo",9,{z:10}),it("cerdito",8),it("cerdito",11)]}]},
 {id:"caperucita",n:"Caperucita Roja",e:"🧣",d:"Caperucita camina por el bosque hasta la casa de su abuela.",escenas:[
   {nombre:"En el bosque",lineas:[L(0.5,"Caperucita Roja caminaba por el bosque con una canasta para su abuelita."),L(5,"Su mamá le había dicho: no te apartes del camino.")],tema:"bosque",dur:9,cam:"seguir",items:[it("caperucita",-14,{mov:mv(12,Z,0,9)})]},
   {nombre:"El lobo aparece",lineas:[L(0.5,"De pronto, un lobo apareció entre los árboles."),L(3,"—¿A dónde vas, niña? —preguntó con voz suave.")],tema:"bosque",dur:6,cam:"fija",items:[it("caperucita",-3),it("lobo",12,{mov:mv(3,Z,1,5)})]},
   {nombre:"La casa de la abuela",lineas:[L(0.5,"Caperucita llegó a la casa de su abuela y notó algo extraño."),L(4,"Con ayuda de un leñador, el lobo se fue lejos y nunca volvió.")],tema:"bosque",dur:7,cam:"derecha",items:[it("cabana",8,{z:10}),it("caperucita",-12,{mov:mv(4,Z,0,6)}),it("lobo",12)]}]},
 {id:"granja",n:"Un día en la granja",e:"🐮",d:"Los animales de la granja salen a pasear por la mañana.",escenas:[
   {nombre:"Buenos días",lineas:[L(0.5,"Amanece en la granja y todos los animales despiertan."),L(4.5,"La vaca, la oveja y el cerdito salen a pasear por el campo.")],tema:"granja",dur:9,cam:"derecha",items:[
     it("granero",-6,{z:13}),it("vaca",-4,{mov:mv(6,Z,0,7)}),it("oveja",2,{mov:mv(10,Z,1,8)}),it("cerdito",-8,{mov:mv(0,Z,0,6)})]},
   {nombre:"El molino",lineas:[L(0.5,"Cerca del molino se juntan a saludar al sol."),L(3.5,"Fue un día feliz en la granja.")],tema:"granja",dur:6,cam:"acercar",items:[it("molino",8,{z:12}),it("vaca",0),it("oveja",4)]}]},
 {id:"piratas",n:"El tesoro pirata",e:"🏴‍☠️",d:"Un marinero busca el cofre del tesoro en una isla.",escenas:[
   {nombre:"El barco",lineas:[L(0.5,"El joven marinero navegó en su barco pirata buscando un tesoro escondido."),L(4.5,"Tras muchos días, avistó una isla misteriosa.")],tema:"mar",dur:8,cam:"derecha",items:[it("barco_pirata",4,{z:13}),it("heroe",-12,{over:{paleta:{ropa:"#d9402f",pelo:"#222222"}},mov:mv(0,Z,0,6)})]},
   {nombre:"La isla",lineas:[L(0.5,"En la isla, bajo un cocotero, el marinero encontró un cofre."),L(4.5,"¡Era el tesoro! Y la mejor aventura de su vida.")],tema:"mar",dur:8,cam:"seguir",items:[it("cocotero",9,{z:11}),it("cofre",10),it("heroe",-10,{over:{paleta:{ropa:"#d9402f",pelo:"#222222"}},mov:mv(8,Z,0,7)})]}]},
 {id:"espacio",n:"Viaje al espacio",e:"🚀",d:"Una astronauta viaja en cohete hasta un planeta con anillos.",escenas:[
   {nombre:"El despegue",lineas:[L(0.5,"La astronauta se preparó para su gran viaje."),L(3.5,"Tres, dos, uno... ¡despegue!")],tema:"espacio",dur:7,cam:"acercar",items:[it("cohete",8,{z:12}),it("heroe",-10,{over:{paleta:{ropa:"#e8e8f0",pelo:"#5a3a22"}},mov:mv(6,Z,0,5)})]},
   {nombre:"Un planeta nuevo",lineas:[L(0.5,"Después de un largo viaje, llegó a un planeta con anillos de colores."),L(4.5,"Allí hizo muchos amigos nuevos y volvió a casa con miles de historias.")],tema:"espacio",dur:8,cam:"derecha",items:[it("planeta_anillos",6,{z:26,y:4}),it("heroe",-12,{over:{paleta:{ropa:"#e8e8f0"}},mov:mv(10,Z,0,7)})]}]}
];
window.__STORIES=STORIES;
const STY=[["2d","2D","🖼️","Todo plano, como un dibujo animado clásico."],["2.5d","2.5D","🎬","Fondo con profundidad y personajes que caminan de lado. Como Trine."],["3d","3D","🧊","Todo en tres dimensiones; la cámara puede girar."]];
const PROTA=[["heroe","Niño / niña","🧒"],["caperucita","Caperucita","🧣"],["cerdito","Cerdito","🐷"],["lobo","Lobo","🐺"],["vaca","Vaca","🐮"],["oveja","Oveja","🐑"]];
const W={step:0,estilo:"2.5d",hist:null,nombre:"",escenas:3,temas:["bosque","bosque","bosque"],prota:"heroe",idea:""};
const STEPS=["inicio","estilo","historia","detalle","resumen"];

function box(){return $("wizBox");}
function open(){if(!window.Studio)return;W.step=0;$("wiz").hidden=false;render();}
function close(){$("wiz").hidden=true;}
function nav(next,label){return `<div class="wnav"><button id="wBack">${W.step<=1?"Cerrar":"← Atrás"}</button><span class="dots">Paso ${W.step} de ${STEPS.length-1}</span>${next===null?"":`<button id="wNext" class="go">${label||"Siguiente →"}</button>`}</div>`;}
function wire(ok,onNext){
  $("wBack").onclick=()=>{if(W.step<=1)close();else{W.step--;render();}};
  const n=$("wNext");if(n){n.disabled=ok===false;n.onclick=()=>{if(ok===false)return;(onNext||(()=>{W.step++;render();}))();};}
}
function opts(list,sel,onPick){
  const d=document.createElement("div");d.className="opts";
  list.forEach(([k,label,emoji,sub])=>{
    const o=document.createElement("div");o.className="opt"+(sel===k?" on":"");
    o.innerHTML=(emoji?`<big>${emoji}</big>`:"")+label+(sub?`<small>${sub}</small>`:"");o.onclick=()=>onPick(k);d.appendChild(o);
  });
  return d;
}
function ownStory(){
  const th=Object.keys(window.Studio.THEMES),esc=[];
  for(let i=0;i<W.escenas;i++){
    const t=W.temas[i]||th[(i*3)%th.length];
    const items=[{id:W.prota,x:-12,z:Z,mov:{x:8,z:Z,t0:0,t1:6}}];
    esc.push({nombre:"Escena "+(i+1),tema:t,dur:8,cam:i%2?"seguir":"derecha",items});
  }
  return esc;
}
function render(){
  const b=box(),S=window.Studio;b.innerHTML="";
  const add=h=>{const d=document.createElement("div");d.innerHTML=h;while(d.firstChild)b.appendChild(d.firstChild);};
  const step=STEPS[W.step],st=STORIES.find(x=>x.id===W.hist);
  if(step==="inicio"){
    add(`<h2>🎬 ¿Cómo quieres empezar?</h2><p>Las dos formas se pueden editar después: arrastras elementos, tocas uno y cambias sus controles.</p><div class="opts" id="o"></div>`);
    const o=$("o");
    [["nuevo","Crear una historia con el asistente","🧙"],["libre","Lienzo en blanco","🎨"]].concat(S.hasSaved()?[["cont","Continuar mi último proyecto","📂"]]:[]).forEach(([k,l,e])=>{
      const d=document.createElement("div");d.className="opt";d.innerHTML=`<big>${e}</big>${l}`;
      d.onclick=()=>{if(k==="nuevo"){W.step=1;render();}else if(k==="cont"){if(S.loadSaved())close();else S.say("No encontré un proyecto guardado.");}else{close();}};o.appendChild(d);
    });return;
  }
  if(step==="estilo"){
    add(`<h2>1. ¿En qué estilo será tu animación?</h2><p>Esto cambia cómo se ve y se mueve la cámara. Después lo puedes cambiar arriba.</p>`);
    b.appendChild(opts(STY,W.estilo,k=>{W.estilo=k;render();}));add(nav(true));wire();return;
  }
  if(step==="historia"){
    add(`<h2>2. ¿Qué historia quieres crear?</h2><p>Elige un cuento clásico (ya viene con escenas armadas) o crea el tuyo.</p>`);
    b.appendChild(opts(STORIES.map(s=>[s.id,s.n,s.e,s.d]).concat([["propia","Historia propia","✍️","Tú eliges el lugar y el personaje"]]),W.hist,k=>{W.hist=k;if(k!=="propia")W.nombre=STORIES.find(s=>s.id===k).n;render();}));
    add(nav(true));wire(!!W.hist);return;
  }
  if(step==="detalle"){
    if(W.hist!=="propia"){
      add(`<h2>3. Detalles</h2><p>«${st.n}» trae ${st.escenas.length} escenas. Puedes cambiar el título.</p><b>Título del cuento</b><input type="text" id="iN" value="${W.nombre}">`);
      add(nav(true));wire(true,()=>{W.nombre=$("iN").value.trim()||st.n;W.step++;render();});return;
    }
    add(`<h2>3. Tu historia</h2><p>Cuéntame lo básico y armo las escenas.</p><b>Título del cuento</b><input type="text" id="iN" placeholder="Ej: El zorro y la luna" value="${W.nombre}"><b>Personaje principal</b>`);
    b.appendChild(opts(PROTA,W.prota,k=>{W.nombre=$("iN").value;W.prota=k;render();}));
    add(`<b>¿Cuántas escenas?</b>`);
    b.appendChild(opts([1,2,3,4,5,6].map(n=>[n,String(n)]),W.escenas,k=>{W.nombre=$("iN").value;W.escenas=k;render();}));
    const th=window.Studio.THEMES,keys=Object.keys(th);
    for(let i=0;i<W.escenas;i++)if(!W.temas[i])W.temas[i]=keys[(i*3)%keys.length];
    const wrap=document.createElement("div");wrap.className="wbox";
    for(let i=0;i<W.escenas;i++){const row=document.createElement("div");row.className="wrow";
      row.innerHTML=`<span>Escena ${i+1}: lugar</span><select data-i="${i}">${keys.map(k=>`<option value="${k}"${W.temas[i]===k?" selected":""}>${th[k].e} ${th[k].n}</option>`).join("")}</select>`;wrap.appendChild(row);}
    b.appendChild(wrap);wrap.querySelectorAll("select").forEach(s=>s.onchange=()=>{W.temas[+s.dataset.i]=s.value;});
    add(nav(true));wire(true,()=>{W.nombre=$("iN").value.trim();W.step++;render();});return;
  }
  if(step==="resumen"){
    const th=window.Studio.THEMES,esc=W.hist==="propia"?ownStory():st.escenas;
    add(`<h2>4. ¡Listo para crear!</h2><div class="wbox"><div><b>${W.nombre||"Mi cuento"}</b> · ${W.estilo.toUpperCase()}</div>
    <div>${esc.length} escena(s): ${esc.map(e=>th[e.tema].e+" "+e.nombre).join(" → ")}</div></div>
    <p>Voy a armar las escenas con decorado y personajes que ya caminan. Después tú cambias lo que quieras, agregas elementos y le pones movimiento. Los personajes son figuras base; con el creador de personajes los vas a poder dibujar a tu gusto.</p>`);
    add(nav(true,"✨ Crear mi cuento"));
    wire(true,()=>{S.newStory({estilo:W.estilo,nombre:W.nombre||"Mi cuento",escenas:JSON.parse(JSON.stringify(esc))});close();});return;
  }
}
function projModal(){
  const S=window.Studio,b=box();$("wiz").hidden=false;
  b.innerHTML=`<h2>💾 Tu proyecto</h2><p>Se guarda solo en este navegador. Aquí puedes copiarlo como texto (para respaldarlo) o pegar uno.</p>
  <textarea id="pt" style="width:100%;height:150px;background:#12141c;color:#fff;border:1px solid #3a4064;border-radius:8px;padding:8px" spellcheck="false"></textarea>
  <div class="wnav"><button id="pc">Cerrar</button><span><button id="pe">📋 Mostrar mi proyecto</button> <button id="pi" class="go">📥 Cargar lo pegado</button></span></div>`;
  $("pc").onclick=close;$("pe").onclick=()=>{$("pt").value=S.exportText();$("pt").select();};
  $("pi").onclick=()=>{try{S.importText($("pt").value);close();S.say("Proyecto cargado.");}catch(e){S.say("Ese texto no es un proyecto válido.");}};
}
function init(){$("bWiz").onclick=open;$("bProj").onclick=projModal;open();}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
