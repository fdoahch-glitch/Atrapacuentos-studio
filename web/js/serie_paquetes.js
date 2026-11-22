/* 📦 Paquetes de imágenes: sube un .zip con dibujos (PNG, JPG, WEBP, SVG) de tu carpeta, de Kenney, OpenGameArt, etc.
   Cada imagen queda en «Mis imágenes»: las que se llaman fondo/background/cielo (o son JPG grandes) como fondos, el resto como elementos. */
(function(){
"use strict";
const dec=new TextDecoder(),S=()=>window.Studio;
const MIME={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",svg:"image/svg+xml"};
async function inflate(u8){const ds=new DecompressionStream("deflate-raw"),w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer());}
async function readZip(buf){
  const u=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-65600);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break;}}
  if(e<0)throw new Error("Ese archivo no parece un .zip");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=dec.decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
    if(name.endsWith("/")||/(^|\/)(__MACOSX|\.DS_Store)/.test(name))continue;
    const lnl=dv.getUint16(off+26,true),lxl=dv.getUint16(off+28,true),ds=off+30+lnl+lxl;
    out.push({name,async data(){const raw=u.subarray(ds,ds+csz);if(meth===0)return raw.slice();if(meth===8)return inflate(raw);throw new Error("Compresión no compatible en "+name);}});
  }
  return out;
}
const dataUrl=(bytes,mime)=>new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(new Blob([bytes],{type:mime}));});
const medir=url=>new Promise(ok=>{const i=new Image();i.onload=()=>ok([i.naturalWidth,i.naturalHeight]);i.onerror=()=>ok([0,0]);i.src=url;});
async function leer(file,say){
  const ents=(await readZip(await file.arrayBuffer())).filter(x=>/\.(png|jpe?g|webp|gif|svg)$/i.test(x.name));
  if(!ents.length)throw new Error("No encontré imágenes dentro del .zip");
  const P=S().serie.proj();let ok=0,fon=0,saltadas=0;const MAX=250;
  for(const en of ents.slice(0,MAX)){
    say("Leyendo "+(ok+1)+" de "+Math.min(ents.length,MAX)+"…");
    try{
      const ext=en.name.split(".").pop().toLowerCase(),bytes=await en.data();
      if(bytes.length>15*1048576){saltadas++;continue;}
      const url=await dataUrl(bytes,MIME[ext]||"image/png"),[w,h]=await medir(url);if(!w){saltadas++;continue;}
      const base=en.name.split("/").pop().replace(/\.[^.]+$/,""),carpeta=en.name.includes("/")?en.name.split("/").slice(-2,-1)[0]:"";
      const esFondo=/(^|[^a-z])(fondo|background|bg|sky|cielo|paisaje|landscape)([^a-z]|$)/i.test(en.name)||(ext.startsWith("jp")&&w>=1400&&h>=700);
      const id="u"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
      P.imgs[id]={n:base.slice(0,24),tipo:esFondo?"fondo":"elemento",url,grupo:carpeta||undefined};ok++;if(esFondo)fon++;
    }catch(e){saltadas++;}
  }
  S().serie.loadImgs();S().serie.renderLib();S().serie.changed();
  return {ok,fon,saltadas,total:ents.length,tope:ents.length>MAX};
}
function abrir(){
  const f=document.createElement("input");f.type="file";f.accept=".zip";
  f.onchange=async()=>{const file=f.files[0];if(!file)return;const say=S().serie.say;
    try{const r=await leer(file,say);say("Paquete listo: "+r.ok+" imágenes ("+r.fon+" fondos, "+(r.ok-r.fon)+" elementos)"+(r.saltadas?" · "+r.saltadas+" no se pudieron leer":"")+(r.tope?" · se leyeron las primeras 250":"")+".");}
    catch(e){say("No pude abrir el paquete: "+(e.message||e));}};
  f.click();
}
window.Paquetes={abrir,leer,readZip};
})();
