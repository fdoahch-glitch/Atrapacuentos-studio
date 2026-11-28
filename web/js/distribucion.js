/* Distribución y estabilidad: avisos de versión nueva (GitHub), diagnóstico del equipo con mediciones reales
   y reporte de problemas VOLUNTARIO (nada se envía solo). */
(function(){
if(window.__RENDER)return;
const T=window.__TAURI__,inv=T&&T.core&&T.core.invoke;
const $=id=>document.getElementById(id),esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const REPO_DEF="fdoahch-glitch/Atrapacuentos-studio";
let VER={version:"web",os:"web",repo:REPO_DEF};
const lee=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}};
const guarda=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
/* ---------- errores recientes (solo en memoria, para el reporte voluntario) ---------- */
const ERR=[];const nota=(t)=>{ERR.push(new Date().toLocaleTimeString()+" "+String(t).slice(0,400));if(ERR.length>30)ERR.shift();};
window.addEventListener("error",e=>nota("Error: "+(e.message||"")+" ("+((e.filename||"").split("/").pop())+":"+e.lineno+")"));
window.addEventListener("unhandledrejection",e=>nota("Promesa rechazada: "+((e.reason&&e.reason.message)||e.reason)));
const ce=console.error;console.error=function(){try{nota("console.error: "+[...arguments].map(a=>a&&a.message||String(a)).join(" "));}catch(x){}return ce.apply(console,arguments);};
function ventana(html){const m=document.createElement("div");m.className="ia-modal";m.style.zIndex=9500;m.innerHTML=`<div class="ia-box" style="max-width:640px;max-height:90vh;overflow:auto">${html}</div>`;document.body.appendChild(m);
  m.addEventListener("pointerdown",e=>{if(e.target===m)m.remove();});return m;}
const Q=(s,r)=>(r||document).querySelector(s);
const mb=n=>(n/1048576).toFixed(1)+" MB";
/* ---------- actualizaciones ---------- */
async function buscar(){
  if(!inv)return {web:true};
  try{return {nov:await inv("buscar_actualizacion")};}catch(e){return {error:String(e)};}
}
function aviso(nov){
  if($("actBanner"))$("actBanner").remove();
  const b=document.createElement("div");b.id="actBanner";b.style.cssText="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#1f3a2b;border:1px solid #3fa76a;color:#fff;border-radius:12px;padding:10px 14px;z-index:9400;font:13px system-ui;display:flex;gap:10px;align-items:center;box-shadow:0 6px 24px #0008";
  b.innerHTML=`<span>🔄 Hay una versión nueva: <b>${esc(nov.version)}</b></span><button id="actVer" class="go">Ver</button><button id="actNo">Más tarde</button>`;
  document.body.appendChild(b);$("actNo").onclick=()=>{guarda("atr_upd_omitir",nov.version);b.remove();};$("actVer").onclick=()=>{b.remove();dialogoAct(nov);};
}
function dialogoAct(nov){
  const m=ventana(`<h2>🔄 Versión ${esc(nov.version)}</h2><p>Tienes la <b>${esc(VER.version==="web"?"versión web":VER.version)}</b>.</p>
   <div style="white-space:pre-wrap;font-size:12.5px;background:#12141c;border-radius:9px;padding:9px;max-height:200px;overflow:auto">${esc(nov.notas||"Sin notas de versión.")}</div>
   <p style="font-size:12px;opacity:.8">${nov.url?"Instalador: "+esc(nov.archivo)+" ("+mb(nov.tamano)+"). Se baja desde GitHub. La app se cerrará para instalar; tu proyecto se guarda solo con el autoguardado.":"No hay un instalador para tu sistema en esta versión: usa «Ver en GitHub»."}</p>
   <div id="actProg" hidden><div style="background:#12141c;border-radius:9px;height:14px;overflow:hidden"><div id="actBar" style="height:100%;width:0;background:#7ee787"></div></div><small id="actTx"></small></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${nov.url?`<button id="actGo" class="go">⬇ Descargar e instalar</button>`:""}<button id="actWeb">Ver en GitHub</button><button id="actCe">Cerrar</button></div><p id="actMsg" style="color:#ffb347"></p>`);
  Q("#actCe",m).onclick=()=>m.remove();
  Q("#actWeb",m).onclick=()=>inv&&nov.pagina&&inv("abrir_enlace",{url:nov.pagina}).catch(()=>{});
  const go=Q("#actGo",m);if(go)go.onclick=async()=>{
    go.disabled=true;Q("#actProg",m).hidden=false;
    let un=null;if(T.event)un=await T.event.listen("actualizar-progreso",ev=>{const {n,total}=ev.payload;Q("#actBar",m).style.width=(total?n/total*100:50)+"%";Q("#actTx",m).textContent=mb(n)+(total?" de "+mb(total):"");});
    try{await inv("instalar_actualizacion",{url:nov.url,archivo:nov.archivo});Q("#actMsg",m).style.color="#7ee787";Q("#actMsg",m).textContent="Listo: se abrió el instalador. La app se cierra para actualizarse.";}
    catch(e){Q("#actMsg",m).textContent="No pude actualizar: "+e;go.disabled=false;}
    if(un)un();};
}
async function actualizaciones(){
  const m=ventana(`<h2>🔄 Actualizaciones</h2><p>Versión instalada: <b>${esc(VER.version)}</b></p><p id="actEst">Buscando en GitHub…</p>
   <p><label><input type="checkbox" id="actAuto" ${lee("atr_upd_auto","1")!=="0"?"checked":""}> Avisarme cuando haya una versión nueva (una vez al día, al abrir el programa)</label></p><button id="actCe">Cerrar</button>`);
  Q("#actCe",m).onclick=()=>m.remove();Q("#actAuto",m).onchange=e=>guarda("atr_upd_auto",e.target.checked?"1":"0");
  const r=await buscar(),est=Q("#actEst",m);
  if(r.web)est.textContent="Estás usando la versión web: se actualiza sola al recargar la página.";
  else if(r.error)est.textContent="No pude consultar GitHub (¿sin internet?). Detalle: "+r.error;
  else if(!r.nov)est.textContent="✅ Tienes la última versión.";
  else{botonNueva(r.nov);est.innerHTML=`Hay una versión nueva: <b>${esc(r.nov.version)}</b> <button id="actVer2" class="go">Ver</button>`;Q("#actVer2",m).onclick=()=>{m.remove();dialogoAct(r.nov);};}
}
/* ---------- diagnóstico del equipo ---------- */
async function medirCanvas(){
  const c=document.createElement("canvas");c.width=1920;c.height=1080;const g=c.getContext("2d");const t0=performance.now();let n=0;
  while(performance.now()-t0<1500){g.fillStyle="#"+((n*977)%0xffffff).toString(16).padStart(6,"0");g.fillRect(0,0,1920,1080);for(let i=0;i<60;i++){g.beginPath();g.arc((i*97+n*7)%1920,(i*53+n*5)%1080,40+i%30,0,7);g.fill();}n++;if(n%10===0)await new Promise(r=>setTimeout(r,0));}
  return n/((performance.now()-t0)/1000);
}
async function medirCodec(hw){
  if(typeof VideoEncoder==="undefined")return null;
  const cfg={codec:"avc1.640034",width:1920,height:1080,bitrate:12e6,framerate:30,hardwareAcceleration:hw};
  let sup;try{sup=await VideoEncoder.isConfigSupported(cfg);}catch(e){return null;}
  if(!sup||!sup.supported)return {soporta:false};
  const c=document.createElement("canvas");c.width=1920;c.height=1080;const g=c.getContext("2d");let err=null;
  const enc=new VideoEncoder({output:()=>{},error:e=>{err=e;}});enc.configure(sup.config||cfg);
  const N=60,t0=performance.now();
  for(let i=0;i<N;i++){g.fillStyle="#"+((i*40111)%0xffffff).toString(16).padStart(6,"0");g.fillRect(0,0,1920,1080);g.fillStyle="#fff";g.fillRect(i*20,300,400,300);const f=new VideoFrame(c,{timestamp:i*33333});enc.encode(f,{keyFrame:i%30===0});f.close();while(enc.encodeQueueSize>6)await new Promise(r=>setTimeout(r,2));if(err)break;}
  try{await enc.flush();}catch(e){err=e;}try{enc.close();}catch(e){}
  return err?{soporta:true,error:String(err.message||err)}:{soporta:true,fps:N/((performance.now()-t0)/1000)};
}
function glInfo(){try{const c=document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");if(!gl)return {ok:false};const e=gl.getExtension("WEBGL_debug_renderer_info");const w2=typeof WebGL2RenderingContext!=="undefined"&&gl instanceof WebGL2RenderingContext;return {ok:true,v2:w2,gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):"(oculto)",maxTex:gl.getParameter(gl.MAX_TEXTURE_SIZE),msaa:w2?gl.getParameter(gl.MAX_SAMPLES):0,flotantes:!!gl.getExtension("EXT_color_buffer_float")};}catch(e){return {ok:false};}}
/* ¿Existe WebGPU en este motor (WebView2 en la app instalada)? Solo se mide: la app no lo usa todavía. */
async function webgpuInfo(){
  try{
    if(!navigator.gpu)return {ok:false,motivo:"el motor no expone WebGPU"};
    const a=await Promise.race([navigator.gpu.requestAdapter(),new Promise(r=>setTimeout(()=>r("tiempo"),4000))]);
    if(a==="tiempo")return {ok:false,motivo:"no respondió en 4 s"};
    if(!a)return {ok:false,motivo:"no hay adaptador compatible"};
    const i=a.info||(a.requestAdapterInfo?await a.requestAdapterInfo():{})||{};
    let dev=false;try{const d=await a.requestDevice();dev=true;d.destroy&&d.destroy();}catch(e){}
    return {ok:true,dispositivo:dev,vendor:i.vendor||"",arq:i.architecture||"",desc:i.description||i.device||"",fallback:!!a.isFallbackAdapter};
  }catch(e){return {ok:false,motivo:String(e&&e.message||e)};}
}
/* recomendaciones según lo medido (solo reglas simples y honestas; si no hay dato, no se opina) */
function recomendar(d){
  const r=[];
  if(d.mem&&d.mem<=4)r.push("Tienes poca memoria RAM: usa proyectos con pocas imágenes grandes y exporta a 720p o 1080p.");
  if(d.cores&&d.cores<=4)r.push("Pocos núcleos de CPU: la exportación por CPU será lenta. Usa la tarjeta de video si está disponible.");
  if(d.nat){
    const gpus=d.nat.gpus||[],cod=d.nat.codificadores||[];
    const hw=cod.filter(c=>c.gpu);
    if(!gpus.length)r.push("No se encontró tarjeta de video para el motor nativo: la exportación usará la CPU.");
    else if(!hw.length)r.push("Tu tarjeta no ofrece codificador por hardware (NVENC/AMF/Quick Sync) en este equipo: la exportación irá por CPU. Revisa los controladores de video.");
    else r.push("Codificación por tarjeta disponible: "+hw.map(c=>c.id+" ("+c.marca+")").join(", ")+".");
    if(!d.nat.ffmpeg)r.push("No se encontró FFmpeg: se usará el motor del navegador (más lento).");
    if(!d.nat.relieve_listo)r.push("El modelo de relieve (IA) aún no está descargado; se baja la primera vez que lo uses (necesita internet).");
  }
  if(d.canvasFps!=null){
    if(d.canvasFps<20)r.push("El dibujo en pantalla es lento ("+d.canvasFps.toFixed(0)+" cuadros/s en la prueba): baja el tamaño de la ventana o usa escenas con menos elementos. La vista previa baja su calidad sola si hace falta.");
    else if(d.canvasFps>=45)r.push("El dibujo en pantalla va fluido ("+d.canvasFps.toFixed(0)+" cuadros/s en la prueba).");
  }
  if(d.hw&&d.hw.soporta&&d.hw.fps!=null)r.push("Codificador por hardware del navegador: "+d.hw.fps.toFixed(0)+" cuadros/s en 1080p"+(d.hw.fps<30?" (menos de 30: exportar en 4K será lento).":"."));
  else if(d.hw&&d.hw.soporta===false&&d.sw&&d.sw.fps!=null)r.push("El navegador no tiene codificación por hardware aquí; por software logra "+d.sw.fps.toFixed(0)+" cuadros/s en 1080p"+(d.sw.fps<30?": un video de 5 min a 30 cuadros/s tardaría bastante más que su duración.":"."));
  if(!r.length)r.push("No hay nada raro que avisar.");
  return r;
}
async function reunir(medir,prog){
  const d={version:VER.version,os:VER.os,ua:navigator.userAgent,cores:navigator.hardwareConcurrency||null,mem:navigator.deviceMemory||null,
    pantalla:screen.width+"×"+screen.height+" @"+(window.devicePixelRatio||1)+"x",gl:glInfo(),webcodecs:typeof VideoEncoder!=="undefined"};
  d.webgpu=await webgpuInfo();
  if(window.Nativo&&Nativo.activo){try{d.nat=await Nativo.sistema();}catch(e){d.natError=String(e);}}
  if(medir){prog("Midiendo el dibujo en pantalla (1.5 s)…");d.canvasFps=await medirCanvas();
    prog("Midiendo la codificación por hardware…");d.hw=await medirCodec("prefer-hardware");
    prog("Midiendo la codificación por software…");d.sw=await medirCodec("prefer-software");}
  d.reco=recomendar(d);return d;
}
function textoDiag(d){
  const L=["Atrapacuentos Studio "+d.version+" · "+d.os,"Pantalla: "+d.pantalla,"CPU: "+(d.cores||"?")+" núcleos · RAM aprox.: "+(d.mem?d.mem+" GB (el navegador la redondea)":"?"),
    "Gráficos del navegador: "+(d.gl.ok?d.gl.gpu+" (textura máx. "+d.gl.maxTex+(d.gl.v2?", WebGL2, MSAA hasta "+d.gl.msaa+"x, color flotante "+(d.gl.flotantes?"sí":"no"):", solo WebGL1")+")":"no disponible"),"WebGPU: "+(d.webgpu?(d.webgpu.ok?"disponible"+(d.webgpu.desc||d.webgpu.vendor?" ("+[d.webgpu.vendor,d.webgpu.arq,d.webgpu.desc].filter(Boolean).join(" ")+")":"")+(d.webgpu.dispositivo?"":", pero no pudo crear el dispositivo")+(d.webgpu.fallback?" [adaptador por software]":""):"no disponible ("+d.webgpu.motivo+")"):"sin datos"),"WebCodecs: "+(d.webcodecs?"sí":"no")];
  if(d.nat){L.push("Tarjetas (motor nativo): "+((d.nat.gpus||[]).map(g=>g.nombre+" ["+g.api+", "+g.tipo+"]").join("; ")||"ninguna"));L.push("Codificadores: "+((d.nat.codificadores||[]).map(c=>c.id+(c.gpu?" (GPU)":"")).join(", ")||"ninguno")+" · FFmpeg: "+(d.nat.ffmpeg?"sí":"no")+" · Modelo de relieve: "+(d.nat.relieve_listo?"listo":"sin bajar"));}
  if(d.canvasFps!=null)L.push("Prueba de dibujo 1080p: "+d.canvasFps.toFixed(1)+" cuadros/s");
  if(d.hw)L.push("Codificar H.264 1080p por hardware (navegador): "+(d.hw.soporta===false?"no disponible":d.hw.error?"error "+d.hw.error:d.hw.fps.toFixed(1)+" cuadros/s"));
  if(d.sw)L.push("Codificar H.264 1080p por software (navegador): "+(d.sw.soporta===false?"no disponible":d.sw.error?"error "+d.sw.error:d.sw.fps.toFixed(1)+" cuadros/s"));
  L.push("","Recomendaciones:",...d.reco.map(x=>"- "+x));return L.join("\n");
}
async function diagnostico(){
  const m=ventana(`<h2>🩺 Diagnóstico del equipo</h2><pre id="dgTx" style="white-space:pre-wrap;font-size:12px;background:#12141c;border-radius:9px;padding:10px;max-height:46vh;overflow:auto">Leyendo tu equipo…</pre>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button id="dgMed" class="go">⏱ Medir este equipo (≈10 s)</button><button id="dgCp">📋 Copiar</button><button id="dgCe">Cerrar</button></div><p id="dgPr" style="font-size:12px;opacity:.8"></p>
   <p style="font-size:11.5px;opacity:.7">Las cifras son mediciones reales de este equipo, hechas ahora. No se envía nada a ningún lado.</p>`);
  let ult=null;const mostrar=d=>{ult=d;Q("#dgTx",m).textContent=textoDiag(d);};
  Q("#dgCe",m).onclick=()=>m.remove();Q("#dgCp",m).onclick=()=>{try{navigator.clipboard.writeText(Q("#dgTx",m).textContent);Q("#dgPr",m).textContent="Copiado.";}catch(e){}};
  mostrar(await reunir(false,()=>{}));
  Q("#dgMed",m).onclick=async()=>{const b=Q("#dgMed",m);b.disabled=true;mostrar(await reunir(true,t=>Q("#dgPr",m).textContent=t));Q("#dgPr",m).textContent="Listo.";b.disabled=false;window.__diagUlt=ult;};
  window.__diagUlt=ult;
}
/* ---------- reporte de problemas (voluntario) ---------- */
async function reporte(){
  const m=ventana(`<h2>🐞 Reportar un problema</h2><p style="font-size:13px">Cuéntanos qué pasó. <b>No se envía nada automáticamente</b>: tú eliges si lo copias, lo guardas o lo abres en GitHub. No incluye tu proyecto, imágenes ni voces.</p>
   <textarea id="rpTx" rows="4" placeholder="¿Qué estabas haciendo y qué salió mal?" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:9px;padding:8px"></textarea>
   <p><label><input type="checkbox" id="rpTec" checked> Incluir datos técnicos (versión, sistema, tarjeta de video y errores recientes)</label></p>
   <pre id="rpPre" style="white-space:pre-wrap;font-size:11.5px;background:#12141c;border-radius:9px;padding:8px;max-height:26vh;overflow:auto"></pre>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="rpCp" class="go">📋 Copiar</button><button id="rpGd">💾 Guardar .txt</button><button id="rpGh">🌐 Abrir en GitHub</button><button id="rpCe">Cerrar</button></div><p id="rpMs" style="font-size:12px;color:#7ee787"></p>`);
  const d=await reunir(false,()=>{});
  const arma=()=>{const t=Q("#rpTx",m).value.trim(),tec=Q("#rpTec",m).checked;
    return "## Qué pasó\n"+(t||"(sin descripción)")+(tec?"\n\n## Datos técnicos\n"+textoDiag(d)+"\n\n## Errores recientes\n"+(ERR.length?ERR.join("\n"):"(ninguno)"):"");};
  const pinta=()=>{Q("#rpPre",m).textContent=arma();};pinta();Q("#rpTx",m).oninput=pinta;Q("#rpTec",m).onchange=pinta;
  Q("#rpCe",m).onclick=()=>m.remove();
  Q("#rpCp",m).onclick=()=>{try{navigator.clipboard.writeText(arma());Q("#rpMs",m).textContent="Copiado.";}catch(e){Q("#rpMs",m).textContent="No pude copiar; selecciona el texto a mano.";}};
  Q("#rpGd",m).onclick=async()=>{const nom="reporte-atrapacuentos.txt";
    if(inv){try{const r=await inv("guardar_texto",{texto:arma(),nombre:nom});if(r)Q("#rpMs",m).textContent="Guardado en "+r;}catch(e){Q("#rpMs",m).textContent="No pude guardar: "+e;}}
    else{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([arma()],{type:"text/plain"}));a.download=nom;a.click();}};
  Q("#rpGh",m).onclick=()=>{const body=arma().slice(0,5500),u="https://github.com/"+VER.repo+"/issues/new?title="+encodeURIComponent("Problema: ")+"&body="+encodeURIComponent(body);
    if(inv)inv("abrir_enlace",{url:u}).catch(x=>{Q("#rpMs",m).textContent="No pude abrir el navegador: "+x;});else window.open(u,"_blank");
    Q("#rpMs",m).textContent="Se abrió GitHub con el texto; revísalo antes de enviarlo.";};
}
window.Distrib={actualizaciones,diagnostico,reporte,errores:()=>ERR.slice(),version:()=>VER,_recomendar:recomendar,_texto:textoDiag,_buscar:buscar,_aviso:aviso};
/* ---------- arranque ---------- */
/* Botón fijo «⬆ vX» en la barra superior: aparece apenas hay una versión publicada más nueva que la instalada y NO se puede descartar
   (el aviso de abajo sí). Se revisa al abrir el programa y cada 30 minutos mientras está abierto. */
let botonVer=null;
function botonNueva(nov){
  if(!nov){if(botonVer)botonVer.hidden=true;return;}
  if(!botonVer){botonVer=document.createElement("button");botonVer.id="bNuevaVer";botonVer.className="go";
    const ref=$("bProj")||$("bPlayAll")||$("bPlay");if(!ref||!ref.parentNode)return;ref.parentNode.insertBefore(botonVer,ref);}
  botonVer.hidden=false;botonVer.textContent="⬆ v"+nov.version;botonVer.title="Hay una versión nueva ("+nov.version+"). Pulsa para ver qué cambió y actualizar.";
  botonVer.onclick=()=>dialogoAct(nov);
}
async function revisar(conAviso){
  const r=await buscar();
  if(r.nov){botonNueva(r.nov);if(conAviso&&lee("atr_upd_omitir","")!==r.nov.version&&!$("actBanner"))aviso(r.nov);}
  else if(!r.error)botonNueva(null);
  return r;
}
(async()=>{
  if(inv){try{VER=await inv("version_app");}catch(e){}}
  if(!inv||lee("atr_upd_auto","1")==="0")return;
  setTimeout(()=>{guarda("atr_upd_ult",String(Date.now()));revisar(true);},6000);
  setInterval(()=>{if(lee("atr_upd_auto","1")!=="0")revisar(true);},30*60*1000);
})();
window.Distrib._revisar=revisar;
})();
