/* IA sin internet: recorte de fondo (modelo ISNet) y voz a texto (Whisper tiny).
   Los modelos viajan dentro de vendor/ia. Necesita abrirse desde http(s):// o app:// (no file://). */
(function(){
const BASE=(()=>{const s=document.currentScript;return s?new URL("../vendor/ia/",s.src).href:"vendor/ia/";})();
const ok=()=>/^(https?|app):$/.test(location.protocol);
const NOTA="Para usar la IA abre el Studio con «abrir-web» (o el programa de escritorio). Desde un archivo suelto el navegador la bloquea.";
let ortP=null,sess=null,wsp=null;
function script(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("No se pudo cargar "+src));document.head.appendChild(s);});}
async function ort(){
  if(!ok())throw new Error(NOTA);
  if(!ortP)ortP=(async()=>{await script(BASE+"ort/ort.min.js");window.ort.env.wasm.wasmPaths={mjs:BASE+"ort/ort-wasm-simd-threaded.mjs",wasm:BASE+"ort/ort-wasm-simd-threaded.wasm"};window.ort.env.wasm.numThreads=1;return window.ort;})();
  return ortP;
}
async function modelo(prog){
  const o=await ort();
  if(!sess)sess=(async()=>{prog&&prog("Cargando el modelo de recorte…");const r=await fetch(BASE+"recorte.onnx");if(!r.ok)throw new Error("Falta el modelo de recorte");const buf=await r.arrayBuffer();return o.InferenceSession.create(buf,{executionProviders:["wasm"],graphOptimizationLevel:"all"});})();
  return sess;
}
const cv=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
/* ¿la imagen ya trae transparencia? */
function tieneAlfa(img){const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,s=Math.min(1,160/Math.max(w,h)),c=cv(Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))),g=c.getContext("2d");g.drawImage(img,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]<250)n++;return n/(d.length/4)>.02;}
/* quita el fondo: devuelve un canvas RGBA del mismo tamaño */
async function quitarFondo(img,prog){
  const S=await modelo(prog),o=window.ort,w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,R=1024;
  prog&&prog("Pensando qué es fondo y qué es personaje…");
  const c=cv(R,R),g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(img,0,0,R,R);const px=g.getImageData(0,0,R,R).data,n=R*R,f=new Float32Array(3*n);
  for(let i=0;i<n;i++){f[i]=(px[i*4]-128)/256;f[i+n]=(px[i*4+1]-128)/256;f[i+2*n]=(px[i*4+2]-128)/256;}
  const out=await S.run({[S.inputNames[0]]:new o.Tensor("float32",f,[1,3,R,R])});
  const m=out[S.outputNames[0]].data;let mn=1e9,mx=-1e9;for(let i=0;i<n;i++){if(m[i]<mn)mn=m[i];if(m[i]>mx)mx=m[i];}
  const mk=cv(R,R),mg=mk.getContext("2d"),mi=mg.createImageData(R,R),span=Math.max(1e-6,mx-mn);
  for(let i=0;i<n;i++){let a=(m[i]-mn)/span;a=a<.5?a*a*2:1-(1-a)*(1-a)*2;/* curva que afirma el borde */const v=Math.round(Math.max(0,Math.min(1,a))*255);mi.data[i*4]=mi.data[i*4+1]=mi.data[i*4+2]=v;mi.data[i*4+3]=255;}
  mg.putImageData(mi,0,0);
  const res=cv(w,h),rg=res.getContext("2d"),mm=cv(w,h),mmg=mm.getContext("2d");mmg.imageSmoothingQuality="high";mmg.drawImage(mk,0,0,w,h);
  rg.drawImage(img,0,0,w,h);const id=rg.getImageData(0,0,w,h),md=mmg.getImageData(0,0,w,h).data;
  for(let i=0;i<w*h;i++)id.data[i*4+3]=Math.round(id.data[i*4+3]*md[i*4]/255);
  rg.putImageData(id,0,0);return res;
}
/* ---------- voz a texto ---------- */
async function whisper(prog){
  if(!ok())throw new Error(NOTA);
  if(!wsp)wsp=(async()=>{
    prog&&prog("Cargando el oído de la IA…");
    const T=await import(BASE+"tf/transformers.min.js");
    T.env.allowRemoteModels=false;T.env.allowLocalModels=true;T.env.localModelPath=BASE+"whisper/";T.env.useBrowserCache=false;
    T.env.backends.onnx.wasm.wasmPaths=BASE+"tf/";T.env.backends.onnx.wasm.numThreads=1;
    return T.pipeline("automatic-speech-recognition","Xenova/whisper-tiny",{dtype:"q8",device:"wasm"});
  })();
  return wsp;
}
function mono16k(buf){
  const sr=16000,len=Math.round(buf.duration*sr),o=new Float32Array(len),n=buf.numberOfChannels,ch=[];for(let c=0;c<n;c++)ch.push(buf.getChannelData(c));
  const k=buf.sampleRate/sr;for(let i=0;i<len;i++){const p=i*k,a=Math.floor(p),b=Math.min(buf.length-1,a+1),f=p-a;let v=0;for(let c=0;c<n;c++)v+=ch[c][a]*(1-f)+ch[c][b]*f;o[i]=v/n;}
  return o;
}
/* devuelve {texto, trozos:[{t0,t1,texto}], palabras:[{w,t0,t1}] (si el modelo pudo dar el tiempo de cada palabra)} */
async function transcribir(audioBuffer,idioma,prog){
  const P=await whisper(prog);prog&&prog("Escuchando…");
  const a=mono16k(audioBuffer),base={language:idioma||"spanish",task:"transcribe",chunk_length_s:30,stride_length_s:5};
  let r,palabras=[];
  try{r=await P(a,Object.assign({return_timestamps:"word"},base));
    palabras=(r.chunks||[]).filter(c=>c.timestamp&&c.timestamp[0]!=null).map(c=>({w:c.text.trim(),t0:c.timestamp[0],t1:c.timestamp[1]==null?audioBuffer.duration:c.timestamp[1]})).filter(p=>p.w&&!/^\[.*\]$/.test(p.w));}
  catch(e){r=null;}
  if(!r||!palabras.length){r=await P(a,Object.assign({return_timestamps:true},base));palabras=[];}
  const tr=(r.chunks||[]).map(c=>({t0:c.timestamp[0]||0,t1:c.timestamp[1]==null?audioBuffer.duration:c.timestamp[1],texto:c.text.trim()}));
  return {texto:(r.text||"").trim(),trozos:tr,palabras};
}
/* ---------- labios (Rhubarb, sin internet) ---------- */
let rhp=null;
async function rhubarb(audioBuffer,texto,prog){
  if(!ok())throw new Error(NOTA);
  if(!rhp)rhp=(async()=>{prog&&prog("Cargando el motor de labios…");const M=await import(BASE+"rhubarb/index.mjs"),e=M.LipSyncEngine.getInstance();await e.init({wasmPath:BASE+"rhubarb/lip-sync-engine.wasm",dataPath:BASE+"rhubarb/lip-sync-engine.data",jsPath:BASE+"rhubarb/lip-sync-engine.js"});return e;})();
  const e=await rhp;prog&&prog("Mirando cómo se mueve la boca…");
  const f=mono16k(audioBuffer),p=new Int16Array(f.length);for(let i=0;i<f.length;i++)p[i]=Math.max(-32768,Math.min(32767,Math.round(f[i]*32767)));
  const r=await e.analyze(p,{sampleRate:16000,dialogText:texto||undefined,recognizer:"phonetic"});
  return r.mouthCues;
}
/* formas de Rhubarb → las 5 bocas del estudio (0 reposo, 1 a, 2 o, 3 e, 4 s/f) */
const RMAP={A:0,X:0,B:3,C:1,D:1,E:2,F:2,G:4,H:3};
function visDeCues(cues,n,hop,sr){const v=new Uint8Array(n);for(const c of cues){const k=RMAP[c.value]==null?0:RMAP[c.value],a=Math.max(0,Math.floor(c.start*sr/hop)),b=Math.min(n,Math.ceil(c.end*sr/hop));for(let i=a;i<b;i++)v[i]=k;}return v;}
window.IA={ok,NOTA,quitarFondo,tieneAlfa,transcribir,rhubarb,visDeCues,precargar:modelo};
})();
