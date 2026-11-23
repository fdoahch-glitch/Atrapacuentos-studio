/* 🎭 Marioneta: tu voz (micrófono) y, opcionalmente, tu cara (cámara) manejan al personaje elegido, en vivo.
   - Micrófono: la boca se abre según el volumen y cambia de forma según el sonido. Todo queda en tu equipo.
   - Cámara (experimental): baja un modelo de cara una sola vez (unos 4 MB, tú lo autorizas) y mueve boca, ceja, sonrisa e inclinación de cabeza. */
(()=>{
const S=()=>window.Serie,$=id=>document.getElementById(id);
let st=null; /* {ac,an,stream,it,raf,mode,fl,vid,cam} */
const MP={js:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs",wasm:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",model:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"};
let landmarker=null;
function limpiar(it){if(!it)return;it.dubLv=null;it.dubVis=0;it.dubExpr="";delete it.marRot;}
function ponerCaja(msg,bad){const m=$("marMsg");if(m){m.textContent=msg;m.style.color=bad?"#ff9b9b":"";}}
function aplicar(it,p){it.dubLv=p.lv;it.dubVis=p.vs;if(p.expr!=null)it.dubExpr=p.expr;if(p.rot!=null)it.marRot=p.rot;
  if(!S().playing)S().setT(S().getT());}
async function iniciarMic(it){
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),src=ac.createMediaStreamSource(stream),an=ac.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.35;src.connect(an);
  const fr=new Uint8Array(an.frequencyBinCount),hz=ac.sampleRate/an.fftSize;let ref=.02;
  st={ac,an,stream,it,mode:"mic"};
  const loop=()=>{if(!st||st.mode!=="mic")return;
    an.getByteFrequencyData(fr);let lo=0,mid=0,hi=0;
    for(let i=1;i<fr.length;i++){const f=i*hz,v=fr[i]/255;if(f<250)continue;if(f<700)lo+=v*v;else if(f<3000)mid+=v*v;else if(f<8000)hi+=v*v;}
    const tot=lo+mid+hi,e=Math.sqrt(tot/Math.max(1,fr.length/6));
    ref=Math.max(ref*.995,e,.02);const sens=(+($("marSens")||{}).value||60)/50;
    let lv=Math.min(1,(e/ref)*sens*(e>.04?1:0)),vs=1;
    if(tot>0){const r=lo/tot,h=hi/tot;if(h>.3)vs=4;else if(r>.55)vs=2;else if(r<.2)vs=3;else vs=1;}
    aplicar(it,{lv,vs,expr:"",rot:null});
    st.raf=requestAnimationFrame(loop);};
  st.raf=requestAnimationFrame(loop);
}
async function cargarModelo(){
  if(landmarker)return landmarker;
  ponerCaja("Bajando el modelo de cara (una sola vez, unos 4 MB)…");
  const mod=await import(MP.js);const fs=await mod.FilesetResolver.forVisionTasks(MP.wasm);
  landmarker=await mod.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MP.model},runningMode:"VIDEO",numFaces:1,outputFaceBlendshapes:true});
  return landmarker;
}
async function iniciarCam(it){
  const lm=await cargarModelo();
  const stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
  const vid=document.createElement("video");vid.srcObject=stream;vid.muted=true;vid.playsInline=true;await vid.play();
  st={stream,it,mode:"cam",vid};let last=-1;
  const loop=()=>{if(!st||st.mode!=="cam")return;
    const now=performance.now();
    if(vid.readyState>=2&&vid.currentTime!==last){last=vid.currentTime;
      const r=lm.detectForVideo(vid,now);
      if(r&&r.faceBlendshapes&&r.faceBlendshapes[0]){
        const b={};for(const c of r.faceBlendshapes[0].categories)b[c.categoryName]=c.score;
        const sens=(+($("marSens")||{}).value||60)/50,lv=Math.min(1,(b.jawOpen||0)*2.2*sens);
        const sonr=((b.mouthSmileLeft||0)+(b.mouthSmileRight||0))/2,fr=((b.mouthFrownLeft||0)+(b.mouthFrownRight||0))/2,sorp=Math.max(b.browInnerUp||0,((b.eyeWideLeft||0)+(b.eyeWideRight||0))/2);
        let expr="";if(sorp>.45)expr="sorpresa";else if(sonr>.35)expr="feliz";else if(fr>.3)expr="triste";
        let vs=1;if((b.mouthPucker||0)>.4||(b.mouthFunnel||0)>.4)vs=2;else if(sonr>.3)vs=3;
        let rot=0;const L=r.faceLandmarks&&r.faceLandmarks[0];if(L){const a=L[33],c=L[263];rot=-Math.atan2(c.y-a.y,c.x-a.x)*.9;rot=Math.max(-.5,Math.min(.5,rot));}
        aplicar(it,{lv,vs,expr,rot});}}
    st.raf=requestAnimationFrame(loop);};
  st.raf=requestAnimationFrame(loop);
}
function parar(){
  if(!st)return;const it=st.it;cancelAnimationFrame(st.raf);
  try{st.stream.getTracks().forEach(t=>t.stop());}catch(e){}try{st.ac&&st.ac.close();}catch(e){}
  st=null;limpiar(it);if(!S().playing)S().setT(S().getT());ponerCaja("Detenido.");
  const bm=$("marMic"),bc=$("marCam"),bs=$("marStop");if(bm)bm.disabled=false;if(bc)bc.disabled=false;if(bs)bs.hidden=true;
}
function abrir(){
  const it=S().curItem&&S().curItem();
  if(!it||it.kind!=="actor"){alert("Primero elige un personaje en la escena.");return;}
  const d=document.createElement("div");d.id="marDlg";d.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(5,8,18,.6);display:flex;align-items:center;justify-content:center";
  d.innerHTML=`<div style="background:#1b1e30;color:#fff;border:1px solid #3a4070;border-radius:14px;padding:16px 18px;max-width:430px;font-size:13px">
   <h3 style="margin:0 0 6px">🎭 Marioneta en vivo</h3>
   <div style="opacity:.8;margin-bottom:8px">Habla y el personaje mueve la boca. Nada sale de tu equipo.</div>
   <label style="display:block;margin:6px 0">Sensibilidad <input type="range" id="marSens" min="20" max="100" value="60"></label>
   <div class="btns" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><button id="marMic" class="pri">🎤 Usar micrófono</button><button id="marStop" hidden>⏹ Detener</button></div>
   <div style="border-top:1px solid #343a58;padding-top:8px;margin-top:6px"><b>📷 Cámara (experimental)</b>
    <div style="opacity:.8;margin:3px 0">Mueve también ceja, sonrisa e inclinación de cabeza. Baja un modelo de cara de unos <b>4 MB</b> la primera vez (necesita internet) y se puede dejar sin usar. No pude probarla con una cámara real.</div>
    <label><input type="checkbox" id="marOk"> Entiendo y autorizo la descarga</label>
    <div><button id="marCam" disabled>📷 Usar cámara</button></div></div>
   <div id="marMsg" style="margin:8px 0;min-height:18px;font-size:12px"></div>
   <div style="text-align:right"><button id="marX">Cerrar</button></div></div>`;
  document.body.appendChild(d);
  const ok=$("marOk");ok.onchange=()=>{$("marCam").disabled=!ok.checked||!!st;};
  const go=async(f)=>{try{await f(it);$("marMic").disabled=true;$("marCam").disabled=true;$("marStop").hidden=false;ponerCaja("En vivo: mueve la boca o habla.");}
    catch(e){parar();ponerCaja("No pude iniciar: "+(e&&e.message||e),true);}};
  $("marMic").onclick=()=>go(iniciarMic);$("marCam").onclick=()=>go(iniciarCam);$("marStop").onclick=parar;
  $("marX").onclick=()=>{parar();d.remove();};
}
window.Marioneta={abrir,parar,get activa(){return !!st;}};
})();
