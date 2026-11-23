/* Autoguardado en disco (solo en la aplicación de escritorio): copia reciente + últimas 10 versiones,
   y recuperación si la sesión anterior se cerró de forma inesperada. Convive con el guardado del navegador (IndexedDB). */
(function(){
const N=window.Nativo;if(!N||window.__RENDER)return;
const T=window.__TAURI__.core.invoke,$=id=>document.getElementById(id);
let tmr=0,ultimo="";
const nombre=()=>(window.Studio&&Studio.proj&&Studio.proj.nombre)||"mi-cuento";
async function guardarYa(){
  clearTimeout(tmr);
  try{if(!window.Studio||!Studio.proj||!Studio.exportText)return;
    const t=Studio.exportText();if(t===ultimo)return;
    await T("autoguardar",{nombre:nombre(),texto:t});ultimo=t;
  }catch(e){console.warn("autoguardado:",e);}
}
window.addEventListener("atr-cambio",()=>{clearTimeout(tmr);tmr=setTimeout(guardarYa,4000);});
window.addEventListener("beforeunload",()=>{try{guardarYa();}catch(e){}});
N.autoguardar=guardarYa;
N.versiones=()=>T("autoguardado_versiones",{nombre:nombre()});

function fecha(ms){const d=new Date(ms),p=n=>String(n).padStart(2,"0");return `${p(d.getDate())}/${p(d.getMonth()+1)} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function caja(html){
  const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="mbox" style="max-width:480px">${html}</div>`;document.body.appendChild(m);return m;
}
async function restaurar(texto){await Studio.importText(texto);Studio.say&&Studio.say("Versión recuperada.");}

/* recuperación tras un cierre inesperado */
async function recuperar(){
  let r;try{r=await T("autoguardado_recuperar");}catch(e){return;}
  if(!r)return;
  const [n,texto]=r,m=caja(`<h2>Recuperar tu trabajo</h2><p>La última vez el programa no se cerró bien. Encontré una copia guardada de «<b>${n.replace(/[<>&]/g,"")}</b>».</p><div class="btns"><button class="go" id="recSi">Recuperar</button><button id="recNo">No, empezar de cero</button></div>`);
  m.querySelector("#recSi").onclick=async()=>{try{await restaurar(texto);}catch(e){Studio.say&&Studio.say("No se pudo recuperar: "+e.message);}m.remove();};
  m.querySelector("#recNo").onclick=()=>m.remove();
}

/* versiones anteriores */
async function abrirVersiones(){
  let v=[];try{v=await N.versiones();}catch(e){}
  const filas=v.length?v.map((x,i)=>`<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><span style="flex:1">${fecha(x.ms)} · ${(x.bytes/1048576).toFixed(1)} MB${i===0?" · más reciente":""}</span><button data-r="${i}">Restaurar</button></div>`).join(""):"<p>Todavía no hay versiones guardadas de este proyecto.</p>";
  const m=caja(`<h2>🕘 Versiones anteriores</h2><p>Se guardan solas las últimas 10 de «${nombre().replace(/[<>&]/g,"")}».</p>${filas}<div class="wnav"><span></span><button id="verCierra">Cerrar</button></div>`);
  m.querySelector("#verCierra").onclick=()=>m.remove();
  m.querySelectorAll("[data-r]").forEach(b=>b.onclick=async()=>{
    try{await guardarYa();const t=await T("autoguardado_leer",{ruta:v[+b.dataset.r].ruta});await restaurar(t);m.remove();$("projDlg").hidden=true;}catch(e){Studio.say&&Studio.say("No se pudo restaurar: "+e);}
  });
}
window.addEventListener("DOMContentLoaded",()=>{const b=$("pjVer");if(b){b.hidden=false;b.onclick=abrirVersiones;}});
window.addEventListener("load",()=>setTimeout(recuperar,600));
})();
