/* Revisión del equipo: comprueba qué puede hacer este computador/navegador con el Studio
   y entrega un informe corto que se puede copiar y pegar. */
(function(){
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let dlg=null,lastReport="";

async function run(){
  const R=[];const add=(ok,t,d)=>R.push({ok,t,d:d||""});
  const A=window.__atr2;
  /* gráficos */
  try{
    const c=document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");
    if(!gl)add(0,"Gráficos (WebGL)","No disponible. El Studio necesita WebGL.");
    else{
      const ext=gl.getExtension("WEBGL_debug_renderer_info"),name=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):"(oculto por el navegador)";
      const soft=/swiftshader|software|llvmpipe/i.test(name);
      add(soft?1:2,"Tarjeta gráfica",name+(soft?" · parece gráficos por software: irá lento. Activa la aceleración por hardware del navegador.":""));
      add(2,"WebGL",(c.getContext("webgl2")?"WebGL2":"WebGL1")+" · textura máx. "+gl.getParameter(gl.MAX_TEXTURE_SIZE)+" px");
    }
  }catch(e){add(0,"Gráficos",String(e.message||e));}
  /* Babylon y velocidad */
  try{
    add(window.BABYLON?2:0,"Motor 3D (Babylon.js)",window.BABYLON?"cargado, versión "+(BABYLON.Engine&&BABYLON.Engine.Version||"?"):"No cargó (¿sin internet para descargar la librería?)");
    if(A&&A.engine){
      await new Promise(r=>setTimeout(r,1500));const f=Math.round(A.engine.getFps());
      add(f>=45?2:f>=24?1:0,"Velocidad del lienzo",f+" cuadros/s"+(f<45?" · baja: usa 2D/2.5D o menos elementos":""));
    }
  }catch(e){add(1,"Velocidad","no se pudo medir");}
  /* exportación a MP4 */
  add(typeof Mp4Muxer!=="undefined"?2:0,"Librería de MP4",typeof Mp4Muxer!=="undefined"?"cargada":"No cargó (¿sin internet?)");
  if(typeof VideoEncoder!=="undefined"){
    for(const [W,H,f] of [[1280,720,30],[1920,1080,30],[1920,1080,60]]){
      let ok=false;
      for(const codec of ["avc1.640034","avc1.640032","avc1.64002A","avc1.4D0028","avc1.42E01F"]){
        try{const r=await VideoEncoder.isConfigSupported({codec,width:W,height:H,bitrate:8e6,framerate:f});if(r&&r.supported){ok=true;break;}}catch(e){}
      }
      add(ok?2:1,"Video "+H+"p a "+f+" cuadros/s",ok?"se puede exportar":"no disponible en este equipo");
    }
  }else add(0,"Codificador de video","No disponible. Usa Chrome o Edge actualizados.");
  /* audio */
  if(typeof AudioEncoder!=="undefined"){
    let aac=false,opus=false;
    try{aac=!!(await AudioEncoder.isConfigSupported({codec:"mp4a.40.2",sampleRate:44100,numberOfChannels:1,bitrate:128000})).supported;}catch(e){}
    try{opus=!!(await AudioEncoder.isConfigSupported({codec:"opus",sampleRate:48000,numberOfChannels:1,bitrate:128000})).supported;}catch(e){}
    add(aac||opus?2:1,"Audio dentro del MP4",aac?"AAC (el mejor)":opus?"Opus (funciona, pero algunos programas viejos no lo leen)":"no disponible: el video saldría sin voz");
  }else add(1,"Audio dentro del MP4","No disponible: el video saldría sin voz.");
  /* micrófono */
  try{
    add(window.MediaRecorder&&navigator.mediaDevices?2:1,"Grabación de voz",window.MediaRecorder&&navigator.mediaDevices?"el navegador puede grabar":"no disponible: usa «Subir audio»");
    if(navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices){
      const d=await navigator.mediaDevices.enumerateDevices(),n=d.filter(x=>x.kind==="audioinput").length;
      add(n?2:1,"Micrófonos detectados",String(n)+(n?"":" · conecta uno para grabar"));
    }
    if(navigator.permissions){try{const p=await navigator.permissions.query({name:"microphone"});add(p.state==="denied"?1:2,"Permiso del micrófono",p.state==="granted"?"concedido":p.state==="denied"?"bloqueado (en el visor web puede pasar; usa «Subir audio»)":"se pedirá al grabar");}catch(e){}}
  }catch(e){add(1,"Micrófono","no se pudo revisar");}
  /* guardado y recursos */
  try{localStorage.setItem("atr2_t","1");localStorage.removeItem("atr2_t");add(2,"Guardado automático","funciona");}catch(e){add(1,"Guardado automático","bloqueado: usa «Proyecto» para copiar tu cuento");}
  add(typeof indexedDB!=="undefined"?2:1,"Guardado de voces",typeof indexedDB!=="undefined"?"funciona":"no disponible");
  add(2,"Equipo",(navigator.hardwareConcurrency||"?")+" núcleos"+(navigator.deviceMemory?" · ≥"+navigator.deviceMemory+" GB de RAM":"")+" · "+(navigator.userAgent.match(/(Chrome|Edg|Firefox|Safari)\/[\d.]+/)||[""])[0]);
  return R;
}
function fmt(R){
  return "Informe Atrapacuentos Studio\n"+R.map(r=>(r.ok===2?"✅":r.ok===1?"⚠️":"❌")+" "+r.t+(r.d?": "+r.d:"")).join("\n");
}
async function open(){
  if(!dlg){
    dlg=document.createElement("div");dlg.id="diag";dlg.className="modal";
    dlg.innerHTML=`<div class="mbox" style="max-width:640px"><h2>🩺 Revisar mi equipo</h2>
    <p>Comprueba si tu computador puede mostrar, grabar y exportar tus cuentos. Si algo sale mal, copia el informe y envíamelo.</p>
    <div id="dgBody" style="min-height:120px"></div>
    <div class="wnav"><button id="dgCopy">📋 Copiar informe</button><button id="dgAgain">↻ Revisar otra vez</button><button id="dgClose">Cerrar</button></div></div>`;
    document.body.appendChild(dlg);
    $("dgClose").onclick=()=>{dlg.hidden=true;};
    $("dgAgain").onclick=go;
    $("dgCopy").onclick=async()=>{
      try{await navigator.clipboard.writeText(lastReport);window.Studio&&Studio.say("Informe copiado.");}
      catch(e){const t=document.createElement("textarea");t.value=lastReport;document.body.appendChild(t);t.select();try{document.execCommand("copy");window.Studio&&Studio.say("Informe copiado.");}catch(_){window.Studio&&Studio.say("No pude copiar; selecciona el texto a mano.");}t.remove();}
    };
  }
  dlg.hidden=false;go();
}
async function go(){
  const b=$("dgBody");b.innerHTML="<p>Revisando… (unos segundos)</p>";
  const R=await run();lastReport=fmt(R);
  b.innerHTML=R.map(r=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #2a2f4a"><span>${r.ok===2?"✅":r.ok===1?"⚠️":"❌"}</span><div><b>${esc(r.t)}</b><br><small style="opacity:.85">${esc(r.d)}</small></div></div>`).join("");
}
window.Diag={open,run};
function init(){const b=$("bDiag");if(b)b.onclick=open;}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
