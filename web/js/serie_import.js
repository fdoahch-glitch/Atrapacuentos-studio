/* Importar SVG (dibujo vectorial) y PSD (Photoshop con capas) */
(function(){
"use strict";
const S=()=>window.Serie,cv=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
const nid=()=>"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const leer=(f,m)=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;m==="text"?r.readAsText(f):r.readAsArrayBuffer(f);});
function loadScript(src){return new Promise((ok,no)=>{if(window.agPsd)return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("No se pudo cargar el lector de PSD"));document.head.appendChild(s);});}
const base=(()=>{const s=document.currentScript;return s?new URL("../vendor/",s.src).href:"vendor/";})();
function nombre(f){return f.name.replace(/\.[^.]+$/,"").slice(0,24);}
function agregar(n,tipo,canvas){const id=nid();S().proj.imgs[id]={n:n.slice(0,24),tipo,url:canvas.toDataURL("image/png")};return id;}
/* ---------- SVG ---------- */
async function svg(file){
  const txt=await leer(file,"text");
  const doc=new DOMParser().parseFromString(txt,"image/svg+xml"),root=doc.documentElement;
  if(!root||root.nodeName.toLowerCase()!=="svg"||doc.querySelector("parsererror"))throw new Error("Este archivo no es un SVG válido.");
  doc.querySelectorAll("script,foreignObject").forEach(e=>e.remove());   /* sin código dentro del dibujo */
  let w=parseFloat(root.getAttribute("width")),h=parseFloat(root.getAttribute("height"));const vb=(root.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);
  if(!(w>0)||!(h>0)||/%/.test(root.getAttribute("width")||"")){if(vb.length===4&&vb[2]>0&&vb[3]>0){w=vb[2];h=vb[3];}else{w=800;h=600;}}
  if(vb.length!==4||!(vb[2]>0))root.setAttribute("viewBox","0 0 "+w+" "+h);
  const k=Math.min(4,2200/Math.max(w,h));root.setAttribute("width",Math.round(w*k));root.setAttribute("height",Math.round(h*k));
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)],{type:"image/svg+xml"}));
  const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error("No pude dibujar este SVG."));i.src=url;});
  const c=cv(Math.round(w*k),Math.round(h*k));c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
  const fondo=w/h>1.6&&confirm("Este dibujo es ancho. ¿Usarlo como fondo? (Aceptar = fondo, Cancelar = elemento suelto)");
  const id=agregar(nombre(file),fondo?"fondo":"elemento",c);return {n:1,ids:[id],fondo};
}
/* ---------- PSD ---------- */
function capas(g,out){for(const l of g.children||[]){if(l.hidden)continue;if(l.children)capas(l,out);else if(l.canvas&&l.canvas.width>0&&l.canvas.height>0)out.push(l);}return out;}
async function psd(file){
  await loadScript(base+"ag-psd.js");
  const buf=await leer(file),p=agPsd.readPsd(buf,{skipThumbnail:true,useImageData:false});
  const L=capas(p,[]);if(!L.length)throw new Error("Este PSD no tiene capas visibles con dibujo.");
  const ids=[];L.forEach((l,i)=>{ids.push({id:agregar((l.name||("capa "+(i+1))),"elemento",l.canvas),l});});
  const k=Math.min(1280/p.width,720/p.height),sc=S().curScene();let puesto=0;
  if(confirm("Encontré "+L.length+" capas. ¿Ponerlas en la escena, cada una en su lugar? (Cancelar = solo guardarlas en Mis imágenes)")){
    for(const {id,l} of ids){const w=l.right-l.left,h=l.bottom-l.top;sc.items.push({uid:"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind:"img",ref:id,x:Math.round(((l.left+l.right)/2)*k+(1280-p.width*k)/2),y:Math.round(l.bottom*k+(720-p.height*k)/2),s:1,d:60,h0:Math.round(h*k)});puesto++;}
  }
  return {n:L.length,ids:ids.map(o=>o.id),puesto};
}
async function cargar(file){
  const ext=(file.name.split(".").pop()||"").toLowerCase();let r;
  if(ext==="svg"||file.type==="image/svg+xml")r=await svg(file);else if(ext==="psd"||ext==="psb")r=await psd(file);else throw new Error("Usa un archivo .svg o .psd");
  S().loadImgs();S().renderLib();S().changed();S().draw();return r;
}
function abrir(){
  const f=document.createElement("input");f.type="file";f.accept=".svg,.psd,.psb,image/svg+xml";f.multiple=true;
  f.onchange=async()=>{for(const file of f.files){try{const r=await cargar(file);S().say(r.puesto?"PSD abierto: "+r.puesto+" capas puestas en la escena.":"Listo: «"+file.name+"» quedó en Mis imágenes.");}catch(e){S().say("⚠ "+e.message);}}};f.click();
}
window.Importar={abrir,cargar,svg,psd};
})();
