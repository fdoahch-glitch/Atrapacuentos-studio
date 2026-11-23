/* Puente con el núcleo nativo (Rust): exportación con la tarjeta de video, guardar/abrir y relieve con IA.
   Si el Studio se abre fuera de la aplicación de escritorio, Nativo.activo es false y todo sigue como antes. */
(function(){
const T=window.__TAURI__,inv=T&&T.core&&T.core.invoke;
if(!inv||window.__RENDER)return;
const N=window.Nativo={activo:true,info:null};
N.sistema=async()=>N.info=await inv("sistema");
N.elegirVideo=nombre=>inv("elegir_guardar_video",{nombre});
N.guardarAudio=(sr,ch,f32)=>{const b=new Uint8Array(8+f32.byteLength);const dv=new DataView(b.buffer);dv.setUint32(0,sr,true);dv.setUint32(4,ch,true);b.set(new Uint8Array(f32.buffer,f32.byteOffset,f32.byteLength),8);return inv("guardar_audio",b);};
N.iniciar=opciones=>inv("exportar_iniciar",{opciones});
N.cuadro=rgba=>inv("exportar_cuadro",rgba);
N.terminar=()=>inv("exportar_terminar");
N.cancelar=()=>inv("exportar_cancelar");
N.mostrar=ruta=>inv("mostrar_en_carpeta",{ruta});
N.guardarProyecto=async()=>{const S=window.Studio;const r=await inv("guardar_proyecto",{texto:S.exportText(),nombre:(S.proj.nombre||"mi-cuento").replace(/[\\/:*?"<>|]/g,"_")});if(r)S.say&&S.say("Proyecto guardado.");return r;};
N.abrirProyecto=async()=>{const t=await inv("abrir_proyecto");if(t){await window.Studio.importText(t);window.Studio.say&&window.Studio.say("Proyecto abierto.");}return !!t;};
/* relieve con IA: recibe un ImageData/canvas/imagen y devuelve {w,h,gpu,mapa:Uint8Array} */
N.relieve=async(fuente)=>{
  const w=fuente.naturalWidth||fuente.width,h=fuente.naturalHeight||fuente.height,k=Math.min(1,1400/Math.max(w,h));
  const W=Math.max(2,Math.round(w*k)),H=Math.max(2,Math.round(h*k));
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.drawImage(fuente,0,0,W,H);
  const px=g.getImageData(0,0,W,H).data,b=new Uint8Array(8+px.length),dv=new DataView(b.buffer);dv.setUint32(0,W,true);dv.setUint32(4,H,true);b.set(px,8);
  const r=new Uint8Array(await inv("relieve_estimar",b)),d=new DataView(r.buffer);
  return{w:d.getUint32(0,true),h:d.getUint32(4,true),gpu:r[8]===1,mapa:r.subarray(9)};
};
N.modeloArchivo=()=>inv("relieve_modelo_archivo");
if(T.event)T.event.listen("menu",ev=>{
  const id=ev.payload;
  if(id==="abrir")N.abrirProyecto().catch(x=>window.Studio&&Studio.say("No se pudo abrir: "+x));
  else if(id==="guardar")N.guardarProyecto().catch(x=>window.Studio&&Studio.say("No se pudo guardar: "+x));
  else if(id==="equipo")(window.Distrib?Distrib.diagnostico():N.equipo());
});
/* ventana «Mi equipo»: qué tarjeta y qué codificadores encontró */
N.equipo=async()=>{
  const i=await N.sistema(),old=document.getElementById("nvEquipo");if(old)old.remove();
  const d=document.createElement("div");d.id="nvEquipo";d.style.cssText="position:fixed;inset:0;background:#000a;z-index:99999;display:flex;align-items:center;justify-content:center";
  const cod=i.codificadores.map(c=>`<li>${c.id} — ${c.marca}${c.gpu?" ✔ GPU":""}</li>`).join("")||"<li>Ninguno (revisa que FFmpeg esté instalado)</li>";
  const gp=i.gpus.map(g=>`<li>${g.nombre} <small>(${g.api}, ${g.tipo})</small></li>`).join("")||"<li>No se encontró tarjeta de video</li>";
  d.innerHTML=`<div style="background:#1d2040;color:#fff;border-radius:14px;padding:20px 24px;max-width:520px;font:14px system-ui"><h3 style="margin-top:0">🖥 Mi equipo</h3><b>Tarjetas de video</b><ul>${gp}</ul><b>Codificadores de video disponibles</b><ul>${cod}</ul><p style="opacity:.8">Relieve con IA: ${i.relieve_listo?"listo":"se prepara la primera vez que lo uses"}.</p><button id="nvEqOk" class="go" style="padding:8px 16px;border-radius:9px">Cerrar</button></div>`;
  document.body.appendChild(d);document.getElementById("nvEqOk").onclick=()=>d.remove();
};
window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();N.guardarProyecto().catch(()=>{});}});
N.sistema().catch(()=>{});
})();
