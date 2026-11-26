/* Exportar en segundo plano: copia de la serie → página oculta que la exporta → cola con avance */
(function(){
"use strict";
const $=id=>document.getElementById(id);
/* ---------------- la página oculta que renderiza ---------------- */
if(window.__RENDER){
  let job=null;
  window.addEventListener("message",async e=>{
    const m=e.data||{};if(!m.tipo)return;
    if(m.tipo==="render"&&!job){job=m;
      try{
        await Studio.importText(m.texto);
        document.querySelector("input[name=expRes][value='"+m.H+"']").checked=true;document.querySelector("input[name=expFps][value='"+m.fps+"']").checked=true;if($("expMbps")){const o=[...$("expMbps").options].some(x=>+x.value===(m.mbps||0));if(o){$("expMbps").value=String(m.mbps||0);$("expMbpsC").value="";}else{$("expMbps").value="0";$("expMbpsC").value=m.mbps;}}
        const sb=$("expSub");if(sb){sb.checked=!!m.burn;sb.onchange&&sb.onchange();}
        const lufs=$("expLufs");if(lufs)lufs.checked=!!m.lufs;
        const master=$("expMaestra");if(master)master.checked=!!m.maestra;
        const codec=$("expCodec");if(codec&&m.codec&&[...codec.options].some(o=>o.value===m.codec&&!o.disabled))codec.value=m.codec;
        window.__onExportProg=(u,n,total,fps)=>parent.postMessage({tipo:"prog",u,n,total,fps},"*");
        window.__onExportDone=(blob,nm,info)=>parent.postMessage({tipo:"fin",blob,nm,info},"*");
        window.__onExportErr=msg=>parent.postMessage({tipo:"error",msg},"*");
        await new Promise(r=>setTimeout(r,600));$("expGo").click();
      }catch(err){parent.postMessage({tipo:"error",msg:String(err&&err.message||err)},"*");}
    }else if(m.tipo==="cancelar"){try{Studio.cancelExport();}catch(e2){}}
  });
  const ping=()=>{if(!job)parent.postMessage({tipo:"hola"},"*");};
  document.addEventListener("studio-ready",()=>{ping();const t=setInterval(()=>{if(job)clearInterval(t);else ping();},500);});
  return;
}
/* ---------------- la cola, en la página principal ---------------- */
const Q=[];let running=null,seq=0;
function css(){if($("bgCss"))return;const s=document.createElement("style");s.id="bgCss";s.textContent=`
#bgQ{position:fixed;left:12px;bottom:12px;z-index:7000;display:flex;flex-direction:column;gap:6px;max-width:340px}
#bgQ .j{background:#1b1e36;border:1px solid #7a5cff;border-radius:12px;padding:8px 10px;color:#eef;font:12px system-ui,sans-serif;box-shadow:0 8px 24px #0009}
#bgQ .j b{font-size:13px}#bgQ .bar{height:6px;background:#12142a;border-radius:4px;margin:5px 0;overflow:hidden}#bgQ .bar i{display:block;height:100%;background:#ffb347;width:0}
#bgQ button,#bgQ a{background:#2b3058;color:#eef;border:1px solid #4a4f86;border-radius:8px;padding:4px 9px;cursor:pointer;font:inherit;text-decoration:none;display:inline-block;margin-right:4px}#bgQ a.go{background:#2fbf6a;color:#06210f;font-weight:700;border-color:#2fbf6a}
#bgQ iframe{position:fixed;left:0;top:0;width:1280px;height:720px;border:0;opacity:.01;pointer-events:none;z-index:-1}`;document.head.appendChild(s);}
function pintar(){
  css();const box=$("bgQ");if(!box)return;[...box.querySelectorAll(".j")].forEach(n=>n.remove());
  for(const j of Q){const d=document.createElement("div");d.className="j";
    const pct=Math.round(j.u*100);
    if(j.estado==="fin")d.innerHTML=`<b>✔ ${j.nombre}</b><div>${j.info||""}</div>`;
    else if(j.estado==="error")d.innerHTML=`<b>⚠ ${j.nombre}</b><div>${j.msg}</div>`;
    else d.innerHTML=`<b>🛰 ${j.nombre}</b> · ${j.H}p<div class="bar"><i style="width:${pct}%"></i></div><div>${j.estado==="espera"?"En cola…":j.estado==="prep"?"Preparando…":"Creando… "+pct+"%"}</div>`;
    const r=document.createElement("div");r.style.marginTop="4px";
    if(j.estado==="fin"){const a=document.createElement("a");a.className="go";a.textContent="⬇ Descargar MP4";a.href=j.url;a.download=j.nm+".mp4";r.appendChild(a);}
    const x=document.createElement("button");x.textContent=j.estado==="fin"||j.estado==="error"?"Quitar":"Cancelar";x.onclick=()=>quitar(j);r.appendChild(x);d.appendChild(r);box.appendChild(d);}
}
function quitar(j){if(j.estado==="run"||j.estado==="prep"){try{j.fr.contentWindow.postMessage({tipo:"cancelar"},"*");}catch(e){}cerrarFrame(j);running=null;}
  const i=Q.indexOf(j);if(i>=0)Q.splice(i,1);if(j.url)URL.revokeObjectURL(j.url);pintar();siguiente();}
function cerrarFrame(j){if(j.fr){j.fr.remove();j.fr=null;}if(j.onmsg){window.removeEventListener("message",j.onmsg);j.onmsg=null;}}
function siguiente(){if(running)return;const j=Q.find(x=>x.estado==="espera");if(!j)return;running=j;j.estado="prep";pintar();
  const fr=document.createElement("iframe");fr.src=new URL("index.html?render=1",location.href).href;j.fr=fr;document.body.appendChild(fr);
  j.onmsg=async e=>{if(e.source!==fr.contentWindow)return;const m=e.data||{};
    if(m.tipo==="hola"&&j.estado==="prep"){j.estado="run";fr.contentWindow.postMessage({tipo:"render",texto:j.texto,H:j.H,fps:j.fps,mbps:j.mbps,burn:j.burn,lufs:j.lufs,maestra:j.maestra,codec:j.codec},"*");j.texto=null;pintar();}
    else if(m.tipo==="prog"){j.u=m.u;pintar();}
    else if(m.tipo==="fin"){j.estado="fin";j.u=1;j.nm=m.nm;j.info=m.info;j.url=URL.createObjectURL(m.blob);cerrarFrame(j);running=null;
      if(window.Biblio&&Biblio._dir&&Biblio._dir())Biblio.guardarVideo(m.blob,m.nm+".mp4");pintar();siguiente();}
    else if(m.tipo==="error"){j.estado="error";j.msg=m.msg;cerrarFrame(j);running=null;pintar();siguiente();}};
  window.addEventListener("message",j.onmsg);}
function agregar(opts){
  opts=opts||{};const H=opts.H||+(document.querySelector("input[name=expRes]:checked")||{value:1080}).value,fps=opts.fps||+(document.querySelector("input[name=expFps]:checked")||{value:30}).value,sb=$("expSub");
  const j={id:++seq,nombre:(Studio.proj.nombre||"Mi serie").slice(0,30),H,fps,mbps:(+(($("expMbpsC")||{}).value)||0)||+(($("expMbps")||{}).value)||0,burn:opts.burn!=null?opts.burn:(sb?sb.checked:true),lufs:!!($("expLufs")&&$("expLufs").checked),maestra:!!($("expMaestra")&&$("expMaestra").checked),codec:($("expCodec")||{}).value||"",texto:Studio.exportText(),estado:"espera",u:0};
  Q.push(j);pintar();siguiente();return j;
}
document.addEventListener("studio-ready",()=>{const b=$("expBg");if(!b)return;
  b.onclick=()=>{if(location.protocol==="file:"){alert("Para exportar en segundo plano abre el Studio con «abrir-web» o usa el programa de escritorio (desde un archivo suelto el navegador lo bloquea).");return;}
    agregar();$("exp").hidden=true;Studio.say&&Studio.say("Tu video se está creando en segundo plano. Mira el avance abajo a la izquierda.");};});
window.ExportBg={agregar,cola:Q};
})();
