/* 🏔 Relieve con IA: un modelo de profundidad (Depth Anything V2) corre en tu tarjeta de video y calcula qué está cerca y qué está lejos.
   Con ese mapa la imagen se separa en capas que se mueven distinto: se siente en 3D sin salir del mundo simple de recortes. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const nat=()=>window.Nativo&&Nativo.activo;
let ocupado=false;
function aviso(t,fin){let d=$("relAviso");if(!d){d=document.createElement("div");d.id="relAviso";d.style.cssText="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#1d2040;color:#fff;border:1px solid #7a5cff;border-radius:12px;padding:10px 16px;z-index:99998;font:13px system-ui;box-shadow:0 8px 24px #0008";document.body.appendChild(d);}
  d.textContent=t;d.hidden=false;clearTimeout(d._t);if(fin)d._t=setTimeout(()=>{d.hidden=true;},4500);}
async function calcular(id,despues){
  if(ocupado)return;const pr=Studio.proj.imgs[id];if(!pr)return;
  if(!nat()){aviso("El relieve con IA funciona en el programa de escritorio (usa tu tarjeta de video).",true);return;}
  ocupado=true;let un=null;
  try{
    aviso("Preparando el relieve…");
    if(window.__TAURI__.event)un=await __TAURI__.event.listen("relieve-progreso",e=>{const p=e.payload||{};aviso(p.total?"Bajando el modelo de relieve (solo la primera vez)… "+Math.round(100*p.n/p.total)+"%":"Bajando el modelo de relieve…");});
    const im=new Image();im.src=pr.url;await im.decode();
    aviso("Calculando el relieve con tu tarjeta de video…");
    const r=await Nativo.relieve(im);
    const c=document.createElement("canvas");c.width=r.w;c.height=r.h;const g=c.getContext("2d"),d=g.createImageData(r.w,r.h);
    for(let i=0;i<r.w*r.h;i++){const v=r.mapa[i];d.data[4*i]=v;d.data[4*i+1]=v;d.data[4*i+2]=v;d.data[4*i+3]=255;}
    g.putImageData(d,0,0);pr.depth=c.toDataURL("image/png");Studio.changed();
    aviso("¡Relieve listo! "+(r.gpu?"Calculado con la GPU.":"Calculado con la CPU."),true);
  }catch(e){
    const m=String(e&&e.message||e);
    aviso("No se pudo calcular el relieve: "+m,true);
    if(/modelo/i.test(m)&&window.Nativo){const d=$("relAviso"),b=document.createElement("button");b.textContent="Elegir el archivo del modelo (.onnx)…";b.style.cssText="margin-left:10px;padding:5px 10px;border-radius:8px;cursor:pointer";
      b.onclick=async()=>{try{if(await Nativo.modeloArchivo())aviso("Modelo guardado. Vuelve a tocar «Calcular relieve».",true);}catch(x){aviso(String(x),true);}};d.appendChild(b);clearTimeout(d._t);}
  }finally{if(un)un();ocupado=false;if(despues)despues();}
}
function card(o,id){
  const pr=(window.Studio&&Studio.proj.imgs[id])||{},tiene=!!pr.depth,r=o.rel;
  const op=(v,l,a)=>`<option value="${v}" ${a===v?"selected":""}>${l}</option>`;
  let h=`<div class="card"><h4>🏔 Relieve con IA</h4><div class="sub" style="font-size:11px;opacity:.7;margin-bottom:4px">La IA separa lo cercano de lo lejano y la imagen gana profundidad cuando se mueve.</div>`;
  if(!tiene)h+=`${nat()?`<div class="sub" style="font-size:12px;opacity:.9;background:#12142a;border-radius:8px;padding:7px 9px;margin:4px 0">⬇ <b>Se descarga una sola vez</b>: la primera vez que pulses «Calcular relieve» el programa baja el modelo de IA (unos 100 MB, necesita internet). Después queda guardado y funciona sin internet.</div>`:""}<div class="btns"><button id="rlCalc">✨ Calcular relieve</button></div>${nat()?"":`<div class="sub" style="font-size:11px;opacity:.7">Disponible en el programa de escritorio.</div>`}`;
  else{
    h+=`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="rlOn" ${r?"checked":""}> Usar relieve</label>`;
    if(r)h+=`<div class="row" style="margin-top:6px"><span>Fuerza</span><input id="rlF" type="range" min="5" max="100" value="${r.fuerza==null?50:r.fuerza}"></div>
      <div class="row"><span>Movimiento</span><select id="rlA">${op("vaiven","Vaivén suave",r.anim||"vaiven")}${op("camara","Sigue a la cámara",r.anim||"vaiven")}${op("ambos","Las dos cosas",r.anim||"vaiven")}</select></div>`;
    h+=`<div class="btns" style="margin-top:6px"><button id="rlRe">↻ Volver a calcular</button> <button id="rlDel">🗑 Quitar relieve</button></div>`;
  }
  return h+`</div>`;
}
function bind(P,o,id,despues){
  const q=s=>P.querySelector(s),pr=Studio.proj.imgs[id];if(!pr)return;
  const c=q("#rlCalc");if(c)c.onclick=()=>calcular(id,despues);
  const re=q("#rlRe");if(re)re.onclick=()=>{delete pr.depth;calcular(id,despues);};
  const dl=q("#rlDel");if(dl)dl.onclick=()=>{delete pr.depth;delete o.rel;despues&&despues();};
  const on=q("#rlOn");if(on)on.onchange=()=>{if(on.checked)o.rel={fuerza:50,anim:"vaiven"};else delete o.rel;despues&&despues();};
  const f=q("#rlF");if(f){f.oninput=()=>{o.rel.fuerza=+f.value;Studio.changed();Serie.select(Serie.sel);};}
  const a=q("#rlA");if(a)a.onchange=()=>{o.rel.anim=a.value;despues&&despues();};
}
window.Relieve={card,bind,calcular};
})();
