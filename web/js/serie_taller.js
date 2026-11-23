/* Taller de piezas: convierte una ilustración en un personaje con partes que se mueven.
   1) subes la imagen  2) dibujas el contorno de cada parte  3) marcas dónde se dobla  4) pruebas el movimiento y lo guardas. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const TAU=Math.PI*2;
const ROLES=[["cuerpo","Cuerpo (tronco)"],["cabeza","Cabeza"],["mandibula","Mandíbula o boca (se abre al hablar)"],["cola","Cola (ondula)"],["brazo","Brazo (se balancea)"],["saluda","Brazo que saluda"],["pata","Pata o pierna (camina)"],["muslo","Muslo / pata de arriba (con rodilla)"],["canilla","Canilla / pata de abajo"],["colgante","Colgante (pelo, bufanda, flequillo)"],["ala","Ala (aletea)"],["oreja","Oreja"],["ojo","Ojo (parpadea)"],["jinete","Persona o cosa montada"],["otro","Otra parte"]];
const COLS=["#ff6b6b","#4ecdc4","#ffd93d","#a78bfa","#6bcB77","#ff9f43","#54a0ff","#f368e0","#00d2d3","#feca57"];
let T=null,pvRaf=0;
function fresh(){return {img:null,w:0,h:0,k:1,polys:[],cur:[],mode:"idle",draft:null,sel:-1,nombre:"Mi personaje"};}

function abrir(){
  const m=$("tallerDlg");m.hidden=false;if(!T)T=fresh();render();
}
function cerrar(){stopPreview();$("tallerDlg").hidden=true;}
function render(){
  const m=$("tallerDlg");
  m.innerHTML=`<div class="mbox" style="max-width:1120px;max-height:94vh;overflow:auto"><h2>✂️ Taller de piezas</h2>
  <p>Convierte tu dibujo en un personaje con partes que se mueven. <b>1</b> Sube la imagen · <b>2</b> dibuja el contorno de cada parte · <b>3</b> marca dónde se dobla · <b>4</b> pruébalo y guárdalo.</p>
  <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px">
   <div><div class="btns" style="margin-bottom:8px"><button id="tImg" class="pri">🖼 1. Elegir imagen</button><button id="tNew" ${T.img?"":"disabled"}>✂ 2. Recortar una pieza</button><button id="tUp" ${T.img?"":"disabled"} title="Hace la imagen más grande con bordes más nítidos (mejora clásica, sin IA ni descargas)">🔎 Agrandar imagen</button><button id="tClic" ${T.img?"":"disabled"} title="Haces clic sobre una parte del dibujo y el programa la recorta por ti">👆 Recorte con un clic</button><button id="tAuto" ${T.img?"":"disabled"} class="pri">🦴 Esqueleto automático</button><button id="tClose" ${T.cur.length>2?"":"disabled"}>✔ Cerrar contorno</button><button id="tUndo" ${T.cur.length?"":"disabled"}>↩ Quitar punto</button></div>
    <div id="tMsg" style="min-height:34px;background:#232740;border-radius:9px;padding:8px 10px;margin-bottom:8px;font-size:12.5px"></div>
    <div style="background:#0e1016;border-radius:10px;padding:6px;text-align:center"><canvas id="tCv" style="max-width:100%;cursor:crosshair;background:repeating-conic-gradient(#2a2f45 0% 25%,#232740 0% 50%) 0 0/20px 20px;border-radius:6px"></canvas></div></div>
   <div><div class="card" id="tSkCard" hidden></div><div class="card"><h4>🧩 Piezas</h4><div id="tList" style="max-height:230px;overflow:auto"></div><div class="sub" style="font-size:11px;opacity:.65">Lo que no recortes queda como <b>cuerpo</b> (la pieza que no se dobla).</div></div>
    <div class="card"><h4>▶ Probar</h4><canvas id="tPv" width="300" height="220" style="width:100%;background:#cfe9f7;border-radius:8px"></canvas>
     <div class="btns" style="margin-top:6px"><button id="tWalk" class="on">🚶 Caminar</button><button id="tTalk">🗣 Hablar</button></div></div>
    <div class="card"><h4>💾 Guardar</h4><input id="tNom" type="text" value="${esc(T.nombre)}" style="width:100%;margin-bottom:6px"><select id="tVista" style="width:100%;margin-bottom:6px" title="Si tienes un dibujo del mismo personaje de lado, guárdalo como su vista de perfil: se usa solo cuando camina."><option value="">Guardar como personaje nuevo</option>${((window.Studio&&Studio.serie&&Studio.serie.proj().actores)||[]).map(a=>`<option value="${esc(a.id)}" ${T.vistaDe===a.id?"selected":""}>Vista de lado (mira a la derecha) de: ${esc(a.n||a.id)}</option>`).join("")}</select><button id="tSave" class="go" style="width:100%" ${T.polys.length?"":"disabled"}>Guardar personaje</button></div></div></div>
  <div class="wnav"><span style="opacity:.6;font-size:12px">Consejo: usa una imagen con fondo transparente (PNG). Recorta un poco por dentro del borde.</span><button id="tExit">Cerrar</button></div></div>`;
  $("tExit").onclick=cerrar;$("tImg").onclick=pick;$("tNew").onclick=()=>{T.mode="draw";T.cur=[];msg("Haz clic alrededor de la parte que quieres mover. Ciérralo con «Cerrar contorno», Enter, o haciendo clic en el primer punto.");render2();};
  $("tAuto").onclick=()=>skStart();
  $("tUp").onclick=()=>{const c=Detecta.agrandar(T.img,2,4096);if(!c){msg("Esta imagen ya es muy grande (más de 4096 px). No hace falta agrandarla.");return;}
    const w0=T.w,h0=T.h,k=c.width/w0;T.img=c;T.w=c.width;T.h=c.height;
    /* los huesos y piezas ya marcados se escalan para quedar en el mismo lugar */
    const sc=p=>p&&[p[0]*k,p[1]*k];(T.polys||[]).forEach(q=>{q.pts=q.pts.map(sc);q.pv=sc(q.pv);q.tip=sc(q.tip);});
    if(T.sk&&T.sk.bones)T.sk.bones.forEach(b=>{b.pv=sc(b.pv);b.tip=sc(b.tip);b.brush=(b.brush||[]).map(sc);});
    T.def=null;render();msg("🔎 Listo: de "+w0+"×"+h0+" a "+c.width+"×"+c.height+" píxeles. (Es una mejora clásica de nitidez, no una IA: no inventa detalles nuevos.)");};
  $("tClic").onclick=()=>{T.mode="clic";T.cur=[];render();msg("👆 Haz <b>clic sobre la parte</b> que quieres separar (un brazo, la cabeza, un sombrero…). Si recorta de más o de menos, cambia la sensibilidad abajo y vuelve a hacer clic.");const c=$("tMsg");c.insertAdjacentHTML("beforeend",`<div style="margin-top:6px;font-size:12px">Sensibilidad: <input id="tTol" type="range" min="10" max="90" value="${T.tol||38}" style="vertical-align:middle"> <span style="opacity:.7">(menos = recorta solo colores casi iguales)</span></div>`);$("tTol").oninput=e=>{T.tol=+e.target.value;};};
  $("tClose").onclick=closePoly;$("tUndo").onclick=()=>{T.cur.pop();render();paint();};
  $("tVista").onchange=e=>{T.vistaDe=e.target.value||null;};
  $("tNom").onchange=e=>{T.nombre=e.target.value||"Mi personaje";};$("tSave").onclick=guardar;
  $("tWalk").onclick=()=>{T.pvMode="walk";mark();};$("tTalk").onclick=()=>{T.pvMode="talk";mark();};
  setupCv();list();skRender();msg(T.img?(T.mode==="draw"?"Haz clic para marcar el contorno…":"Imagen lista. Pulsa «Recortar una pieza»."):"Empieza subiendo la imagen de tu personaje.");
  if(T.mode==="pivot")msg("Ahora haz clic <b>donde se dobla</b> esta pieza (por ejemplo el hombro, la cadera o la bisagra de la mandíbula).");
  if(T.mode==="form")formUI();
  if(T.mode==="sk")skMsg();
  paint();startPreview();
}
function render2(){const keep=T.mode;render();T.mode=keep;paint();}
function mark(){$("tWalk").classList.toggle("on",T.pvMode!=="talk");$("tTalk").classList.toggle("on",T.pvMode==="talk");}
function msg(h){const e=$("tMsg");if(e)e.innerHTML=h;}
function pick(){
  const f=$("fUp");f.accept="image/*";f.multiple=false;
  f.onchange=()=>{const file=f.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const MAXD=1400,k=Math.min(1,MAXD/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    const fin=cc=>{T=fresh();T.img=cc;T.w=cc.width;T.h=cc.height;T.nombre=file.name.replace(/\.[^.]+$/,"").slice(0,24)||"Mi personaje";render();};
    if(window.IA&&IA.ok()&&!IA.tieneAlfa(c)&&confirm("Esta imagen tiene fondo. ¿Quitarlo con IA para armar el esqueleto? (tarda unos segundos)")){const w0=document.createElement("div");w0.style.cssText="position:fixed;inset:0;display:grid;place-items:center;background:#000a;color:#fff;font:600 18px sans-serif;z-index:99999";w0.textContent="Quitando el fondo…";document.body.appendChild(w0);IA.quitarFondo(c,t=>w0.textContent=t).then(fin).catch(e=>{alert("No pude quitar el fondo: "+e.message);fin(c);}).finally(()=>w0.remove());}else fin(c);};im.src=r.result;};r.readAsDataURL(file);f.value="";};f.click();
}
function setupCv(){
  const cv=$("tCv");if(!T.img){cv.width=640;cv.height=360;const g=cv.getContext("2d");g.fillStyle="#9aa";g.font="16px sans-serif";g.textAlign="center";g.fillText("Aquí aparecerá tu imagen",320,180);return;}
  const maxW=Math.min(760,window.innerWidth-420),maxH=Math.max(300,window.innerHeight-330);T.k=Math.min(maxW/T.w,maxH/T.h,1.2);
  cv.width=Math.round(T.w*T.k);cv.height=Math.round(T.h*T.k);
  cv.onclick=e=>{
    const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*T.w,y=(e.clientY-r.top)/r.height*T.h;
    if(T.mode==="draw"){
      if(T.cur.length>2&&Math.hypot(x-T.cur[0][0],y-T.cur[0][1])*T.k<12){closePoly();return;}
      T.cur.push([x,y]);$("tClose").disabled=T.cur.length<3;$("tUndo").disabled=false;paint();
    }else if(T.mode==="clic"){
      const R=Detecta.recorteClic(T.img,x,y,T.tol||38);
      if(!R.polys.length||R.polys[0].length<3){msg("😕 Ahí no hay dibujo (o es fondo transparente). Prueba en otro punto.");return;}
      if(R.area>.8){msg("⚠ Eso recortó casi todo el dibujo. Baja la sensibilidad o haz clic en una parte de otro color.");return;}
      T.draft={pts:R.polys[0],role:"otro",name:"",quitar:true,atras:false,pv:null};T.mode="form";render();
    }else if(T.mode==="pivot"){T.draft.pv=[x,y];finishPiece();}
  };
  cv.oncontextmenu=e=>{e.preventDefault();if(T.mode==="draw")closePoly();};
  skPointer(cv);
}
window.addEventListener("keydown",e=>{if($("tallerDlg").hidden||!T)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==="Enter"&&T.mode==="draw")closePoly();else if(e.key==="Escape"&&T.mode!=="idle"){T.mode="idle";T.cur=[];T.draft=null;render();}else if(e.key==="Backspace"&&T.mode==="draw"){T.cur.pop();render2();}});

/* ---------- esqueleto automático: huesos + corte que sigue el borde del dibujo ---------- */
const BCOL=["#ff6b6b","#4ecdc4","#ffd93d","#a78bfa","#6bcB77","#ff9f43","#54a0ff","#f368e0","#00d2d3","#feca57","#ee5a6f","#1dd1a1"];
function skStart(tpl){
  if(!T.img)return;
  T.mode="sk";T.sk=T.sk||{bones:[],sel:null,tool:"move",face:1,pend:null,zones:null,L:null,role:"otro"};
  if(tpl){const r=RigAuto.plantilla(tpl,T.img);T.sk.bones=r.bones;T.sk.face=r.face;T.sk.sel=r.bones[0]?r.bones[0].id:null;}
  render();skCalc();
}
function skBone(id){return T.sk.bones.find(b=>b.id===id);}
let skTmr=0;
function skCalc(now){
  clearTimeout(skTmr);const go=()=>{if(!T||T.mode!=="sk")return;const B=T.sk.bones;if(!B.length){T.sk.zones=null;paint();return;}
    const L=RigAuto.labels(T.img,B,{});T.sk.L=L;T.sk.zones=RigAuto.paintZones(L,B.map((_,i)=>BCOL[i%BCOL.length]),120);paint();};
  if(now)go();else skTmr=setTimeout(go,160);
}
function skUI(){
  const c=$("tSkCard");if(!c)return;if(T.mode!=="sk"){c.hidden=true;return;}c.hidden=false;const S=T.sk,B=S.bones;
  c.innerHTML=`<h4>🦴 Esqueleto</h4>
   <div class="btns" style="margin-bottom:6px"><button data-tp="humano">🧍 Persona</button><button data-tp="dino">🦖 Animal de lado</button><button data-tp="vacio">⬜ Vacío</button></div>
   <div class="btns" style="margin-bottom:6px"><button data-det="1" class="pri" title="Mira la silueta de tu dibujo y coloca los huesos solos">🔍 Detectar partes automáticamente</button></div>
   <div class="btns" style="margin-bottom:6px;align-items:center"><button data-deta="1" class="pri" title="Para dinosaurios y animales dibujados de lado: cabeza, mandíbula, cola y patas">🦖 Detectar animal de lado</button><select id="skTipoA" title="Tipo de animal"><option value="">Automático</option><option value="bipedo">Bípedo (T. rex, gallina)</option><option value="cuadrupedo">Cuadrúpedo (oso, perro)</option></select></div>
   <div id="skDet" style="font-size:11.5px;margin-bottom:6px"></div>
   <div class="btns" style="margin-bottom:6px"><button data-tl="move" class="${S.tool==="move"?"on":""}">✋ Mover puntos</button><button data-tl="add" class="${S.tool==="add"?"on":""}">➕ Hueso nuevo</button><button data-tl="brush" class="${S.tool==="brush"?"on":""}">🖌 Reforzar zona</button></div>
   <div style="font-size:12px;margin:4px 0">Mira hacia: <button data-f="1" class="${S.face===1?"on":""}">derecha →</button><button data-f="-1" class="${S.face===-1?"on":""}">← izquierda</button></div>
   <div id="skList" style="max-height:200px;overflow:auto"></div>
   <div class="btns" style="margin-top:8px"><button id="skGo" class="pri" ${B.length>=1?"":"disabled"}>✨ Crear las piezas</button><button id="skX">Cancelar</button></div>
   <div class="sub" style="font-size:11px;opacity:.7;margin-top:6px">Los colores muestran cómo se va a cortar. Mueve los puntos blancos (articulación) y los rombos (punta del hueso). Con 🖌 pintas encima de lo que debe moverse con ese hueso.</div>`;
  c.querySelectorAll("[data-det]").forEach(b=>b.onclick=()=>{const r=Detecta.detectar(T.img);const d=$("skDet");
    if(!r.ok){d.innerHTML="⚠ "+r.nota;return;}
    S.bones=r.bones;S.face=r.face;S.sel=r.bones[0].id;S.det=r;skUI();skCalc();skMsg();});
  c.querySelectorAll("[data-deta]").forEach(b=>b.onclick=()=>{const t=$("skTipoA").value;const r=Detecta.detectarAnimal(T.img,t?{tipo:t}:{});const d=$("skDet");
    if(!r.ok){d.innerHTML="⚠ "+(r.nota||"No pude ver el animal.");return;}
    S.bones=r.bones;S.face=r.face;S.sel=r.bones[0].id;S.det=r;skUI();skCalc();skMsg();});
  if(S.det&&$("skDet"))$("skDet").innerHTML=`<b>Detecté:</b> ${S.det.hitos.map(h=>h.nombre).join(", ")}.<br>Seguridad: <b>${Math.round(S.det.conf*100)}%</b>. ${S.det.notas.map(esc).join(" ")}<br><span style="opacity:.7">Si algo quedó mal, arrastra los puntos: todo es corregible.</span>`;
  c.querySelectorAll("[data-tp]").forEach(b=>b.onclick=()=>{S.bones=[];skStart(b.dataset.tp);});
  c.querySelectorAll("[data-tl]").forEach(b=>b.onclick=()=>{S.tool=b.dataset.tl;S.pend=null;skUI();skMsg();paint();});
  c.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{S.face=+b.dataset.f;skUI();});
  const L=c.querySelector("#skList");
  B.forEach((b,i)=>{const d=document.createElement("div");d.style.cssText="border-left:4px solid "+BCOL[i%BCOL.length]+";padding:3px 4px 3px 6px;margin:3px 0;background:"+(S.sel===b.id?"#2d2f55":"transparent");
    d.innerHTML=`<div style="display:flex;gap:4px;align-items:center"><input data-n value="${esc(b.name)}" style="flex:1;min-width:0;background:#12141c;color:#fff;border:1px solid #343a58;border-radius:6px;padding:2px 5px;font-size:12px"><button data-x style="padding:1px 6px" class="danger">✕</button></div>
     <div style="display:flex;gap:4px;margin-top:3px;align-items:center;font-size:11px"><select data-r style="flex:1;min-width:0">${ROLES.map(([v,l])=>`<option value="${v}" ${b.role===v?"selected":""}>${l.split(" (")[0]}</option>`).join("")}</select>
     <select data-p style="flex:1;min-width:0"><option value="">sin padre</option>${B.filter(q=>q.id!==b.id).map(q=>`<option value="${q.id}" ${b.parent===q.id?"selected":""}>sigue a ${esc(q.name)}</option>`).join("")}</select></div>
     <label style="font-size:11px"><input type="checkbox" data-a ${b.atras?"checked":""}> va detrás del cuerpo</label>${b.brush&&b.brush.length?` <button data-cb style="font-size:10px;padding:0 5px">borrar pinceladas</button>`:""}`;
    d.onclick=e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="BUTTON")return;S.sel=b.id;skUI();paint();};
    d.querySelector("[data-n]").onchange=e=>{b.name=e.target.value||b.name;};
    d.querySelector("[data-x]").onclick=()=>{S.bones=B.filter(q=>q.id!==b.id);B.forEach(q=>{if(q.parent===b.id)q.parent=null;});if(S.sel===b.id)S.sel=null;skUI();skCalc();};
    d.querySelector("[data-r]").onchange=e=>{b.role=e.target.value;};
    d.querySelector("[data-p]").onchange=e=>{b.parent=e.target.value||null;};
    d.querySelector("[data-a]").onchange=e=>{b.atras=e.target.checked;};
    const cb=d.querySelector("[data-cb]");if(cb)cb.onclick=()=>{b.brush=[];skUI();skCalc();};
    d.onfocusin=()=>{S.sel=b.id;};
    L.appendChild(d);});
  $("skGo").onclick=skCrear;$("skX").onclick=()=>{T.mode="idle";render();};
}
function skMsg(){
  const S=T.sk;let m="";
  if(S.tool==="move")m="Arrastra los <b>puntos blancos</b> (donde se dobla) y los <b>rombos</b> (hasta dónde llega el hueso). Verás los colores cambiar.";
  else if(S.tool==="add")m=S.pend?"Ahora haz clic en la <b>punta</b> del hueso (por ejemplo la mano, el pie o la punta de la cola).":"Haz clic donde <b>se dobla</b> la parte nueva (hombro, cadera, cuello…). Elige su tipo en la lista.";
  else m="Pinta con el mouse sobre lo que debe moverse con el hueso <b>seleccionado</b> ("+((skBone(S.sel)||{}).name||"elige uno en la lista")+").";
  msg("🦴 "+m);
}
function skPaint(g,k){
  const S=T.sk;if(S.zones){g.save();g.globalAlpha=1;g.drawImage(S.zones,0,0,g.canvas.width,g.canvas.height);g.restore();}
  S.bones.forEach((b,i)=>{const col=BCOL[i%BCOL.length],on=S.sel===b.id;
    if(b.brush&&b.brush.length){g.fillStyle=col+"aa";for(const q of b.brush){g.beginPath();g.arc(q[0]*k,q[1]*k,3,0,TAU);g.fill();}}
    g.lineWidth=on?5:3;g.strokeStyle="#000";g.beginPath();g.moveTo(b.pv[0]*k,b.pv[1]*k);g.lineTo(b.tip[0]*k,b.tip[1]*k);g.stroke();
    g.lineWidth=on?3:1.6;g.strokeStyle=col;g.stroke();
    g.fillStyle="#fff";g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.arc(b.pv[0]*k,b.pv[1]*k,on?8:6,0,TAU);g.fill();g.stroke();
    g.fillStyle=col;g.beginPath();const tx=b.tip[0]*k,ty=b.tip[1]*k,r=on?8:6;g.moveTo(tx,ty-r);g.lineTo(tx+r,ty);g.lineTo(tx,ty+r);g.lineTo(tx-r,ty);g.closePath();g.fill();g.stroke();
    if(on){g.fillStyle="#000a";g.font="bold 11px sans-serif";g.fillText(b.name,b.pv[0]*k+10,b.pv[1]*k-10);}});
  if(S.pend){g.fillStyle="#fff";g.beginPath();g.arc(S.pend[0]*k,S.pend[1]*k,7,0,TAU);g.fill();}
}
window.skPaint=skPaint;
function skPointer(cv){
  let drag=null;const P=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*T.w,(e.clientY-r.top)/r.height*T.h];};
  cv.onpointerdown=e=>{if(T.mode!=="sk")return;const S=T.sk,p=P(e),k=T.k,near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])*k<14;
    if(S.tool==="add"){if(!S.pend){S.pend=p;skMsg();paint();}else{const id="b"+Date.now().toString(36)+Math.floor(Math.random()*99);
        const role=(S.newRole||"otro");S.bones.push({id,name:role+"_"+(S.bones.length+1),role,pv:S.pend,tip:p,parent:S.sel||null,atras:false,brush:[]});S.sel=id;S.pend=null;skUI();skMsg();skCalc();}return;}
    if(S.tool==="brush"){const b=skBone(S.sel);if(!b)return;cv.setPointerCapture(e.pointerId);drag={m:"b",b};b.brush=b.brush||[];b.brush.push(p);paint();return;}
    for(const b of S.bones){if(near(b.pv,p)){S.sel=b.id;drag={m:"pv",b};cv.setPointerCapture(e.pointerId);skUI();paint();return;}if(near(b.tip,p)){S.sel=b.id;drag={m:"tip",b};cv.setPointerCapture(e.pointerId);skUI();paint();return;}}
    let best=null,bd=1e9;for(const b of S.bones){const dx=b.tip[0]-b.pv[0],dy=b.tip[1]-b.pv[1],L2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p[0]-b.pv[0])*dx+(p[1]-b.pv[1])*dy)/L2)),d=Math.hypot(p[0]-(b.pv[0]+dx*t),p[1]-(b.pv[1]+dy*t));if(d<bd){bd=d;best=b;}}
    if(best&&bd*k<14){S.sel=best.id;skUI();paint();}};
  cv.onpointermove=e=>{if(!drag)return;const p=P(e),S=T.sk,b=drag.b;
    if(drag.m==="pv"){const d=[p[0]-b.pv[0],p[1]-b.pv[1]];b.pv=p;if(b.parent){const par=skBone(b.parent);if(par&&par.role==="muslo")par.tip=[p[0],p[1]];}}
    else if(drag.m==="tip"){b.tip=p;S.bones.forEach(q=>{if(q.parent===b.id&&q.role==="canilla")q.pv=[p[0],p[1]];});}
    else if(drag.m==="b"){const l=b.brush[b.brush.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])*T.k>3)b.brush.push(p);}
    paint();skCalc();};
  cv.onpointerup=cv.onpointercancel=()=>{if(drag){const was=drag.m;drag=null;if(was==="b")skUI();skCalc(true);}};
}
function skCrear(){
  const S=T.sk,B=S.bones;if(!B.length)return;msg("⏳ Cortando siguiendo los bordes…");
  setTimeout(()=>{
    const R=RigAuto.segment(T.img,B,{});T.polys=[];T.face=S.face;
    B.forEach((b,i)=>{(R.polys[i]||[]).forEach((pts,k)=>{if(pts.length<3)return;
      T.polys.push({pts,role:b.role,name:b.name+(k?"_"+k:""),quitar:b.role!=="cuerpo",atras:!!b.atras,pv:[b.pv[0],b.pv[1]],tip:[b.tip[0],b.tip[1]],bone:b.id,parentBone:b.parent,main:k===0});});});
    T.def=null;T.sel=-1;T.mode="idle";render();
    msg("✨ Listo: "+T.polys.length+" piezas. Mira la prueba de la derecha; si algo no mueve bien, vuelve a «🦴 Esqueleto automático», ajusta y crea de nuevo.");
  },30);
}
function skRender(){skUI();if(T&&T.mode==="sk")skMsg();}

function closePoly(){
  if(T.cur.length<3)return;T.draft={pts:T.cur.slice(),role:"otro",name:"",quitar:true,atras:false,pv:null};T.cur=[];T.mode="form";render();
}
function formUI(){
  const d=T.draft,n=T.polys.length+1;
  const e=$("tMsg");e.innerHTML=`<b>¿Qué parte es?</b> <select id="fRole">${ROLES.map(([v,l])=>`<option value="${v}" ${d.role===v?"selected":""}>${l}</option>`).join("")}</select>
   <label style="margin-left:8px"><input type="checkbox" id="fQ" ${d.quitar?"checked":""}> Quitarla del cuerpo</label>
   <label style="margin-left:8px"><input type="checkbox" id="fA" ${d.atras?"checked":""}> Va detrás del cuerpo</label>
   <button id="fOk" class="pri" style="margin-left:8px">Siguiente: dónde se dobla →</button>`;
  $("fRole").onchange=ev=>{d.role=ev.target.value;};$("fQ").onchange=ev=>{d.quitar=ev.target.checked;};$("fA").onchange=ev=>{d.atras=ev.target.checked;};
  $("fOk").onclick=()=>{d.name=(ROLES.find(r=>r[0]===d.role)||[0,"pieza"])[1].split(" ")[0].toLowerCase()+"_"+n;T.mode="pivot";render();};
}
function finishPiece(){
  T.polys.push(T.draft);T.def=null;T.sel=T.polys.length-1;T.draft=null;T.mode="idle";render();
}
function list(){
  const L=$("tList");if(!L)return;L.innerHTML="";
  T.polys.forEach((p,i)=>{const d=document.createElement("div");d.style.cssText="display:flex;gap:4px;align-items:center;padding:3px 0;border-left:4px solid "+COLS[i%COLS.length]+";padding-left:6px;margin:2px 0;background:"+(T.sel===i?"#2d2f55":"transparent");
    d.innerHTML=`<span style="flex:1;font-size:12px">${i+1}. ${esc((ROLES.find(r=>r[0]===p.role)||[0,p.role])[1].split(" (")[0])}</span><button data-a="u" style="padding:2px 6px">↑</button><button data-a="d" style="padding:2px 6px">↓</button><button data-a="x" class="danger" style="padding:2px 6px">✖</button>`;
    d.onclick=ev=>{const a=ev.target.dataset.a;if(a==="x")T.polys.splice(i,1);else if(a==="u"&&i>0)[T.polys[i-1],T.polys[i]]=[T.polys[i],T.polys[i-1]];else if(a==="d"&&i<T.polys.length-1)[T.polys[i+1],T.polys[i]]=[T.polys[i],T.polys[i+1]];else{T.sel=i;}
      T.def=null;render();};L.appendChild(d);});
}
function path(g,pts,k){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]*k,p[1]*k):g.moveTo(p[0]*k,p[1]*k));g.closePath();}
function paint(){
  const cv=$("tCv");if(!cv||!T.img)return;const g=cv.getContext("2d"),k=T.k;g.clearRect(0,0,cv.width,cv.height);g.drawImage(T.img,0,0,cv.width,cv.height);
  T.polys.forEach((p,i)=>{path(g,p.pts,k);g.fillStyle=COLS[i%COLS.length]+(T.sel===i?"66":"30");g.fill();g.strokeStyle=COLS[i%COLS.length];g.lineWidth=2;g.stroke();
    if(p.pv){g.fillStyle="#fff";g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.arc(p.pv[0]*k,p.pv[1]*k,6,0,TAU);g.fill();g.stroke();}});
  if(T.mode==="sk"&&window.skPaint)skPaint(g,k);
  if(false)T.ap.forEach((a,i)=>{g.fillStyle=COLS[i%COLS.length];g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.arc(a.c[0]*k,a.c[1]*k,8,0,TAU);g.fill();g.stroke();if(a.pv){g.beginPath();g.moveTo(a.c[0]*k,a.c[1]*k);g.lineTo(a.pv[0]*k,a.pv[1]*k);g.stroke();g.fillStyle="#fff";g.beginPath();g.arc(a.pv[0]*k,a.pv[1]*k,5,0,TAU);g.fill();g.stroke();}});
  if(T.draft){path(g,T.draft.pts,k);g.fillStyle="#ffb34755";g.fill();g.strokeStyle="#ffb347";g.lineWidth=2;g.stroke();}
  if(T.cur.length){g.strokeStyle="#ffb347";g.lineWidth=2;g.beginPath();T.cur.forEach((p,i)=>i?g.lineTo(p[0]*k,p[1]*k):g.moveTo(p[0]*k,p[1]*k));g.stroke();T.cur.forEach((p,i)=>{g.fillStyle=i?"#ffb347":"#fff";g.beginPath();g.arc(p[0]*k,p[1]*k,i?4:7,0,TAU);g.fill();});}
}

/* ---------- construir el personaje ---------- */
function bbox(pts,pad){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const [x,y] of pts){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y);}a=Math.max(0,Math.floor(a-pad));b=Math.max(0,Math.floor(b-pad));c=Math.min(T.w,Math.ceil(c+pad));d=Math.min(T.h,Math.ceil(d+pad));return {x:a,y:b,w:Math.max(2,c-a),h:Math.max(2,d-b)};}
function cvs(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
/* rellena los huecos del cuerpo con el color de alrededor (difusión a baja resolución) */
function rellenar(base,hole,orig,tintes,maxIt){
  const W=base.width,H=base.height,s=6,w=Math.ceil(W/s),h=Math.ceil(H/s);
  const sm=cvs(w,h),sg=sm.getContext("2d");sg.drawImage(base,0,0,w,h);const D=sg.getImageData(0,0,w,h).data;
  const hm=cvs(w,h),hg=hm.getContext("2d");hg.drawImage(hole,0,0,w,h);const Hm=hg.getImageData(0,0,w,h).data;
  const col=new Float32Array(w*h*3),ok=new Uint8Array(w*h),need=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++){if(Hm[i*4+3]>30)need[i]=1;else if(D[i*4+3]>200){ok[i]=1;col[i*3]=D[i*4];col[i*3+1]=D[i*4+1];col[i*3+2]=D[i*4+2];}}
  for(let it=0;it<(maxIt||120);it++){
    let left=0;const add=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(ok[i]||!need[i])continue;left++;let r=0,g2=0,b=0,n=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(ok[j]){r+=col[j*3];g2+=col[j*3+1];b+=col[j*3+2];n++;}}
      if(n){add.push([i,r/n,g2/n,b/n]);}}
    for(const [i,r,g2,b] of add){ok[i]=1;col[i*3]=r;col[i*3+1]=g2;col[i*3+2]=b;}
    if(!left||!add.length)break;
  }
  const out=cvs(w,h),og=out.getContext("2d"),img=og.createImageData(w,h);
  for(let i=0;i<w*h;i++){if(need[i]&&ok[i]){img.data[i*4]=col[i*3];img.data[i*4+1]=col[i*3+1];img.data[i*4+2]=col[i*3+2];img.data[i*4+3]=255;}}
  og.putImageData(img,0,0);
  const big=cvs(W,H),bg=big.getContext("2d");bg.imageSmoothingEnabled=true;bg.imageSmoothingQuality="high";bg.filter="blur("+s*.6+"px)";bg.drawImage(out,0,0,W,H);bg.filter="none";
  /* tintes propios (por ejemplo, el interior de la boca) */
  for(const t of tintes){bg.save();path(bg,t.pts,1);bg.fillStyle=t.col;bg.fill();bg.restore();}
  bg.globalCompositeOperation="destination-in";bg.drawImage(hole,0,0);bg.globalCompositeOperation="destination-over";
  return big;
}
function physOf(p,pv,bb,g){const cx=bb.x+bb.w/2,cy=bb.y+bb.h/2,d=Math.hypot(cx-pv[0],cy-pv[1])||1;return {r:[(cx-pv[0])/d,(cy-pv[1])/d],k:55,c:5.5,g,max:.7,w:.25};}
function motion(role,pv,bb,state,p,names){
  const far=Math.max(Math.hypot(bb.x-pv[0],bb.y-pv[1]),Math.hypot(bb.x+bb.w-pv[0],bb.y-pv[1]),Math.hypot(bb.x-pv[0],bb.y+bb.h-pv[1]),Math.hypot(bb.x+bb.w-pv[0],bb.y+bb.h-pv[1]));
  switch(role){
    case "cabeza":state.head=state.head||"cabeza";return {aw:.03,pw:.6,ai:.02,ta:.045};
    case "mandibula":return {ta:-.5,jaw:1,par:state.headName||undefined};
    case "ojo":return {blink:1,par:state.headName||undefined};
    case "cola":return {wave:{x:pv[0],y:pv[1],amp:.2,len:Math.max(80,far*.55),mx:Math.max(120,far*1.05),ph:1.1},aw:.05,pw:-1,ai:.03};
    case "brazo":{const pw=(state.brazos++%2)?Math.PI:0;return {aw:.32,pw,ai:.05};}
    case "saluda":return {osc:[-.05,.38,1.7]};
    case "pata":{const pw=(state.patas++%2)?Math.PI:0;return {aw:.3,pw,lift:[Math.max(8,bb.h*.06),pw+Math.PI]};}
    case "ala":return {osc:[0,.45,2.4]};
    case "oreja":return {osc:[0,.10,1.4,state.orejas++],phys:physOf(p,pv,bb,.9)};
    case "colgante":return {phys:physOf(p,pv,bb,1)};
    case "muslo":{const sh=T.polys.find(q=>q.parentBone&&q.parentBone===p.bone&&q.role==="canilla"&&q.main!==false);const ph=(state.patas++%2)?Math.PI:0;
      if(!sh)return {aw:.3,pw:ph,lift:[Math.max(8,bb.h*.06),ph+Math.PI]};
      return {ik:{shin:names.get(sh),foot:[sh.tip[0],sh.tip[1]],phase:ph,bend:1}};}
    case "canilla":{const th=T.polys.find(q=>q.bone===p.parentBone);return th?{par:names.get(th)}:{aw:.3,ai:.02};}
    case "jinete":return {aw:.03,pw:.4,ai:.03};
    default:return {ai:.03};
  }
}
function buildDef(){
  const W=T.w,H=T.h,piezas=[],state={brazos:0,patas:0,orejas:0};
  /* nombre de la cabeza para que la mandíbula la siga */
  const headIdx=T.polys.findIndex(p=>p.role==="cabeza"&&p.main!==false);const headName=headIdx>=0?"p"+(headIdx+1)+"_cabeza":null;state.headName=headName;
  const hole=cvs(W,H),hg=hole.getContext("2d");hg.fillStyle="#000";const tintes=[];
  const base=cvs(W,H),bg=base.getContext("2d");bg.drawImage(T.img,0,0);
  T.polys.forEach(p=>{if(p.quitar&&!p.atras){path(hg,p.pts,1);hg.fill();hg.lineWidth=3;hg.strokeStyle="#000";hg.stroke();if(p.role==="mandibula")tintes.push({pts:p.pts,col:"#6b1d28"});}});
  /* lo que va detrás se queda transparente en el cuerpo para que se vea la pieza de atrás */
  hg.globalCompositeOperation="destination-out";T.polys.forEach(p=>{if(p.quitar&&p.atras){path(hg,p.pts,1);hg.fill();}});hg.globalCompositeOperation="source-over";
  /* solo se rellena donde había dibujo */
  hg.globalCompositeOperation="destination-in";hg.drawImage(T.img,0,0);hg.globalCompositeOperation="source-over";
  /* a la base se le borran las partes recortadas */
  bg.globalCompositeOperation="destination-out";T.polys.forEach(p=>{if(p.quitar){path(bg,p.pts,1);bg.fill();bg.lineWidth=2;bg.strokeStyle="#000";bg.stroke();}});bg.globalCompositeOperation="source-over";
  let baseFinal=base;
  if(T.polys.some(p=>p.quitar)){const fill=rellenar(base,hole,T.img,tintes,T.polys.some(p=>p.bone)?12:120);const b2=cvs(W,H),g2=b2.getContext("2d");g2.drawImage(base,0,0);g2.drawImage(fill,0,0);baseFinal=b2;}
  const parts=[];const names=new Map();T.polys.forEach((p,i)=>names.set(p,"p"+(i+1)+"_"+p.role));
  T.polys.forEach((p,i)=>{if(p.role==="cuerpo"&&p.bone)return;
    const bb=bbox(p.pts,2),c=cvs(bb.w,bb.h),g=c.getContext("2d");g.save();g.translate(-bb.x,-bb.y);path(g,p.pts,1);g.clip();g.drawImage(T.img,0,0);g.restore();
    const nm=names.get(p);
    let mm=motion(p.role,p.pv,bb,state,p,names);
    if(p.main===false){const mp=T.polys.find(q=>q.bone===p.bone&&q.main);mm=mp?{par:names.get(mp)}:{ai:.02};}
    else if(p.parentBone&&p.role!=="canilla"&&p.role!=="muslo"&&!mm.par){const pp=T.polys.find(q=>q.bone===p.parentBone&&q.role==="cabeza"&&q.main!==false);if(pp)mm.par=names.get(pp);}
    parts.push({n:nm,x:bb.x,y:bb.y,w:bb.w,h:bb.h,pv:[Math.round(p.pv[0]),Math.round(p.pv[1])],m:mm,img:c.toDataURL("image/png"),atras:p.atras});
  });
  const cuerpo={n:"cuerpo",x:0,y:0,w:W,h:H,pv:[0,0],m:{ai:.01},img:baseFinal.toDataURL("image/png")};
  /* orden: atrás → cuerpo → delante */
  for(const p of parts)if(p.atras)piezas.push(p);piezas.push(cuerpo);for(const p of parts)if(!p.atras)piezas.push(p);
  piezas.forEach(p=>delete p.atras);
  /* mandíbula: seguir a la cabeza solo si existe */
  for(const p of piezas)if(p.m&&p.m.par&&!piezas.some(q=>q.n===p.m.par))delete p.m.par;
  /* dónde pisa y tamaño */
  const al=T.img.getContext("2d").getImageData(0,0,W,H).data;let x0=W,x1=0,y1=0,y0=H;
  for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){if(al[(y*W+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y>y1)y1=y;if(y<y0)y0=y;}}
  if(x1<x0){x0=0;x1=W;y0=0;y1=H;}
  const alto=y1-y0;
  return {id:"c"+Date.now().toString(36),n:T.nombre||"Mi personaje",face:T.face||1,w:W,h:H,feet:[Math.round((x0+x1)/2),y1],esc:Math.min(1.2,480/Math.max(60,alto)),bob:Math.max(4,alto*.012),piezas};
}

/* ---------- prueba de movimiento ---------- */
function stopPreview(){cancelAnimationFrame(pvRaf);pvRaf=0;}
async function startPreview(){
  stopPreview();const cv=$("tPv");if(!cv||!T.img||!T.polys.length){if(cv){const g=cv.getContext("2d");g.fillStyle="#cfe9f7";g.fillRect(0,0,300,220);g.fillStyle="#789";g.font="13px sans-serif";g.textAlign="center";g.fillText("Aquí lo verás moverse",150,110);}return;}
  if(!T.def){try{T.def=buildDef();}catch(e){console.error(e);return;}}
  const def=T.def;await window.SerieRig.prep(def);const g=cv.getContext("2d"),t0=performance.now();
  const loop=now=>{
    if($("tallerDlg").hidden||!$("tPv"))return;const t=(now-t0)/1000;
    g.fillStyle="#cfe9f7";g.fillRect(0,0,300,220);g.fillStyle="#9fd37a";g.fillRect(0,185,300,35);
    const k=Math.min(150/def.h,130/def.w*1.1),talk=T.pvMode==="talk"?(.5+.5*Math.sin(t*14))*(.55+.45*Math.sin(t*5.3)):0;
    window.SerieRig.draw(g,def,{ax:150,ay:200,s:k*(def.esc>0?1:1)*1.0,flip:1,t,walk:T.pvMode==="talk"?0:1,speak:talk,hz:1});
    pvRaf=requestAnimationFrame(loop);};
  pvRaf=requestAnimationFrame(loop);
}
function guardar(){
  if(!T.polys.length)return;let def=T.def||buildDef();def.n=T.nombre||def.n;
  if(T.vistaDe){const P=Studio.serie.proj(),a=(P.actores||[]).find(x=>x.id===T.vistaDe);
    if(a){const v=def;a.vistas=a.vistas||{};v.n="perfil";delete v.vistas;a.vistas.perfil=v;if(window.SerieRig&&SerieRig.liberar)SerieRig.liberar(a);Studio.changed();Studio.say("Listo: «"+(a.n||a.id)+"» ahora usa este dibujo cuando camina de lado.");cerrar();T=null;return;}}
  window.Serie.addActorDef(def);cerrar();T=null;
}
window.Taller={abrir,cerrar,_T:()=>T,_skCrear:()=>skCrear(),_skStart:skStart,_build:()=>buildDef()};
})();
