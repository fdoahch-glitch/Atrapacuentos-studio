/* Relieve automático con IA: un modelo de profundidad (Depth Anything, versión pequeña) calcula qué está cerca y qué lejos.
   Corre en tu propio computador (sin créditos). La primera vez descarga el modelo (~100 MB) y queda guardado. */
(function(){
"use strict";
let pipe=null,loading=null;
const LIB="https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm";
const MODEL="onnx-community/depth-anything-v2-small";
async function load(progress){
  if(pipe)return pipe;
  if(loading)return loading;
  loading=(async()=>{
    progress("Cargando la IA de relieve… (solo la primera vez baja el modelo)");
    const mod=await import(window.DEPTH_LIB||LIB);
    if(mod.env){mod.env.allowLocalModels=!!window.DEPTH_LOCAL;if(window.DEPTH_LOCAL)mod.env.localModelPath=window.DEPTH_LOCAL;}
    const cb=p=>{if(p&&p.status==="progress"&&p.total)progress("Descargando modelo: "+Math.round(p.loaded/p.total*100)+"%");};
    try{pipe=await mod.pipeline("depth-estimation",MODEL,{device:"webgpu",progress_callback:cb});}
    catch(e){pipe=await mod.pipeline("depth-estimation",MODEL,{progress_callback:cb});}
    return pipe;
  })();
  try{return await loading;}finally{loading=null;}
}
async function run(img,progress){
  progress=progress||(()=>{});
  const p=await load(progress);
  progress("Calculando el relieve…");
  const c=document.createElement("canvas");c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;
  const k=Math.min(1,768/Math.max(c.width,c.height));c.width=Math.round(c.width*k);c.height=Math.round(c.height*k);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  const out=await p(c.toDataURL("image/jpeg",.9));
  const dp=out.depth,w=dp.width,h=dp.height,ch=dp.channels||1,data=dp.data;
  const o=document.createElement("canvas");o.width=w;o.height=h;const g=o.getContext("2d"),im=g.createImageData(w,h);
  let lo=255,hi=0;for(let i=0;i<w*h;i++){const v=data[i*ch];if(v<lo)lo=v;if(v>hi)hi=v;}
  for(let i=0;i<w*h;i++){const v=Math.round((data[i*ch]-lo)/Math.max(1,hi-lo)*255);im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v;im.data[i*4+3]=255;}
  g.putImageData(im,0,0);
  const r=document.createElement("canvas");r.width=256;r.height=144;r.getContext("2d").drawImage(o,0,0,256,144);
  return r;
}
window.DepthAI={run};
})();
