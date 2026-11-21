/* Exportar e importar grabaciones del doblaje.
   Exporta un .zip con una voz por línea (WAV), la narración completa y el guion.
   Al volver a subir los archivos editados, el Studio detecta de nuevo dónde empieza y termina cada voz,
   ajusta la duración de la escena y los labios/subtítulos se sincronizan solos. */
(function(){
"use strict";
const S=()=>window.Studio,D=()=>window.Dub;

/* ---------- WAV ---------- */
function wavBytes(ch,sr){
  const n=ch[0].length,nc=ch.length,buf=new ArrayBuffer(44+n*nc*2),v=new DataView(buf);
  const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
  w(0,"RIFF");v.setUint32(4,36+n*nc*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,nc,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*nc*2,true);v.setUint16(32,nc*2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*nc*2,true);
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<nc;c++){const x=Math.max(-1,Math.min(1,ch[c][i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}
  return new Uint8Array(buf);
}
const bufWav=b=>{const ch=[];for(let c=0;c<b.numberOfChannels;c++)ch.push(b.getChannelData(c));return wavBytes(ch,b.sampleRate);};

/* ---------- ZIP (sin compresión) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const now=new Date(),dt=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xFFFF,dd=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xFFFF;
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,dt,true);lh.setUint16(12,dd,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),nm,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,dt,true);ch.setUint16(14,dd,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
    cen.push(new Uint8Array(ch.buffer),nm);
    off+=30+nm.length+sz;
  }
  let cs=0;cen.forEach(c=>cs+=c.length);
  const end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cs,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(end.buffer)],{type:"application/zip"});
}

/* ---------- utilidades ---------- */
function dl(blob,name){
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
}
const slug=t=>(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w ]/g,"").trim().split(/\s+/).slice(0,4).join("-").slice(0,32)||"linea";
const pad=n=>String(n).padStart(2,"0");
const projName=()=>((S().proj.nombre||"mi-cuento").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w -]/g,"").trim()||"mi-cuento").replace(/\s+/g,"-");
const say=(el,t)=>{if(el)el.textContent=t;else S().say(t);};
function blobToDataURL(b){return new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(b);});}
function allLines(){const out=[];S().proj.mundos.forEach((w,si)=>{(D().lines(w)).forEach((ln,li)=>out.push({w,si,ln,li}));});return out;}
const total=()=>S().proj.mundos.reduce((a,w)=>a+(w.dur||6),0);

/* narración completa: todas las voces en su lugar de la línea de tiempo, sin música */
function fullTrack(){
  const sr=D().ac().sampleRate,out=new Float32Array(Math.ceil(total()*sr));let off=0;
  for(const w of S().proj.mundos){
    for(const ln of D().lines(w)){const au=D().AUD[ln.id];if(!au)continue;
      const d=au.buf.getChannelData(0),st=Math.round((off+Math.max(0,ln.t0))*sr);
      for(let i=0;i<d.length&&st+i<out.length;i++)out[st+i]+=d[i];}
    off+=(w.dur||6);
  }
  return {data:out,sr};
}
function guion(){
  let t="GUION DE "+(S().proj.nombre||"mi cuento")+"\r\n(archivo: escena, línea, quién habla, segundo en que empieza, texto)\r\n\r\n";
  const names={};S().placed.forEach(i=>names[i.uid]=i.ficha?i.ficha.nombre:i.id);
  allLines().forEach(({w,si,ln,li})=>{t+="E"+pad(si+1)+"_L"+pad(li+1)+" | "+(w.nombre||"")+" | "+(ln.quien?(names[ln.quien]||"personaje"):"Narrador")+" | "+(+ln.t0).toFixed(1)+"s | "+(ln.sfx?"[efecto de sonido: "+(ln.nombre||"")+"]":(ln.txt||""))+"\r\n";});
  return t;
}
const LEEME="CÓMO USAR ESTAS GRABACIONES\r\n\r\n"+
"1. Edita los archivos .wav en tu programa de audio favorito (por ejemplo Audacity): quita ruido, sube el volumen, recorta silencios.\r\n"+
"2. NO cambies el nombre de los archivos que empiezan con E01_L01 (escena y línea): así el Studio sabe a qué línea pertenece cada uno.\r\n"+
"3. En el Studio abre Doblaje → «Importar grabaciones editadas» y elige los archivos (puedes elegirlos todos juntos).\r\n"+
"4. El Studio detecta de nuevo dónde empieza y termina cada voz, ajusta la duración de la escena, los labios y los subtítulos.\r\n\r\n"+
"Opción rápida: si editas solo «narracion_completa.wav», sin mover ni cambiar su duración, también puedes importarla: el Studio la corta de nuevo en las voces de cada línea.\r\n";

/* ---------- exportar ---------- */
async function exportRec(msg){
  const L=allLines().filter(x=>D().AUD[x.ln.id]);
  if(!L.length){say(msg,"Aún no hay voces grabadas para exportar.");return;}
  say(msg,"Preparando archivos…");
  const enc=new TextEncoder(),files=[];
  for(const {si,ln,li} of L)files.push({name:"E"+pad(si+1)+"_L"+pad(li+1)+"_"+slug(ln.txt)+".wav",data:bufWav(D().AUD[ln.id].buf)});
  const tr=fullTrack();files.push({name:"narracion_completa.wav",data:wavBytes([tr.data],tr.sr)});
  files.push({name:"guion.txt",data:enc.encode(guion())},{name:"LEEME.txt",data:enc.encode(LEEME)});
  dl(zip(files),projName()+"-grabaciones.zip");
  say(msg,"Listo: "+L.length+" voces y la narración completa en un .zip.");
}
function exportOne(ln,k){
  const au=D().AUD[ln.id];if(!au)return;
  const si=S().proj.mundo;dl(new Blob([bufWav(au.buf)],{type:"audio/wav"}),"E"+pad(si+1)+"_L"+pad(k+1)+"_"+slug(ln.txt||ln.nombre)+".wav");
}
async function exportMix(msg){
  if(!D().hasAudio()){say(msg,"No hay voces ni música para mezclar.");return;}
  say(msg,"Mezclando…");
  try{const b=await D().mixdown(44100);dl(new Blob([bufWav(b)],{type:"audio/wav"}),projName()+"-mezcla.wav");say(msg,"Mezcla guardada (voces + música).");}
  catch(e){say(msg,"No pude mezclar: "+(e.message||e));}
}

/* ---------- importar ---------- */
async function putLine(si,ln,dataURL){
  await D().setAudio(ln.id,dataURL);D().idbPut(ln.id,dataURL);ln.voz=true;
  const w=S().proj.mundos[si],au=D().AUD[ln.id],end=ln.t0+au.dur+.3;
  if(end>(w.dur||6))w.dur=Math.min(120,Math.ceil(end));
}
async function importRec(msg,after){
  const inp=document.createElement("input");inp.type="file";inp.accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm";inp.multiple=true;
  inp.onchange=async()=>{
    const files=[...inp.files];if(!files.length)return;
    let ok=0,skip=[],note="";
    say(msg,"Importando…");
    for(const f of files){
      try{
        const m=f.name.match(/^E(\d+)_L(\d+)/i);
        if(m){
          const si=+m[1]-1,li=+m[2]-1,w=S().proj.mundos[si],ln=w&&D().lines(w)[li];
          if(!ln){skip.push(f.name+" (esa línea ya no existe)");continue;}
          await putLine(si,ln,await blobToDataURL(f));ok++;
        }else if(/narraci[oó]n|completa/i.test(f.name)){
          const buf=await D().ac().decodeAudioData(await f.arrayBuffer()),sr=buf.sampleRate,ch=buf.getChannelData(0);
          if(Math.abs(buf.duration-total())>.5)note=" Ojo: la duración cambió ("+buf.duration.toFixed(1)+" s en vez de "+total().toFixed(1)+" s); se cortó según los tiempos originales.";
          let off=0;
          for(let si=0;si<S().proj.mundos.length;si++){
            const w=S().proj.mundos[si];
            for(const ln of D().lines(w)){
              const au=D().AUD[ln.id];if(!au)continue;
              const a=Math.round((off+Math.max(0,ln.t0))*sr),n=Math.round(au.dur*sr),seg=ch.subarray(a,Math.min(ch.length,a+n));
              if(seg.length<sr*.05)continue;
              await putLine(si,ln,await blobToDataURL(new Blob([wavBytes([seg],sr)],{type:"audio/wav"})));ok++;
            }
            off+=(w.dur||6);
          }
        }else skip.push(f.name+" (nombre no reconocido: debe empezar con E01_L01)");
      }catch(e){skip.push(f.name+" (no pude leerlo)");}
    }
    S().changed();
    say(msg,(ok?"Importé "+ok+" voz"+(ok>1?"es":"")+" y las ajusté.":"No se importó ninguna voz.")+note+(skip.length?" Omitidos: "+skip.join("; ")+".":""));
    if(after)after();
  };
  inp.click();
}
window.DubX={exportRec,exportOne,exportMix,importRec,wavBytes,zip,dl};
})();
