/* Exportación extra: perfiles, tramo, movimiento suave, bordes suaves, miniatura, solo audio, secuencia PNG, GIF,
   aviso al terminar y medidor de cuadros por segundo reales de la vista previa (con calidad adaptable). */
(function(){
const $=id=>document.getElementById(id);
const X={tramo:false,desde:0,hasta:null,blur:0,ss:1};
const NOMBRE=()=>((window.Studio&&Studio.proj&&Studio.proj.nombre||"mi-cuento").replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,"").trim()||"mi-cuento").replace(/\s+/g,"-");
const par2=n=>Math.max(2,Math.round(n/2)*2);
/* ---------- usados por export.js ---------- */
const E=window.ExportExtra={
  X,
  size(W,H){return X.ss>1?[par2(W*X.ss),par2(H*X.ss)]:[W,H];},
  dur(total){if(!X.tramo)return total;const h=Math.min(total,X.hasta==null?total:X.hasta),d=Math.max(0,Math.min(X.desde,h-.1));return Math.max(.1,h-d);},
  flags(){return X.tramo?{desde:X.desde,hasta:Math.min(Studio.totalSeconds(),X.hasta==null?1e9:X.hasta),blur:X.blur}:{blur:X.blur};},
  /* recorta el audio mezclado al tramo elegido */
  recorte(buf,desde,hasta){
    if(!buf)return buf;
    if(desde==null&&!X.tramo)return buf;
    const d=desde!=null?desde:X.desde,h=hasta!=null?hasta:(X.hasta==null?1e9:X.hasta),sr=buf.sampleRate,a=Math.max(0,Math.round(d*sr)),b=Math.min(buf.length,Math.round(h*sr));
    if(b<=a)return buf;
    const o=new AudioBuffer({length:b-a,numberOfChannels:buf.numberOfChannels,sampleRate:sr});
    for(let c=0;c<buf.numberOfChannels;c++)o.copyToChannel(buf.getChannelData(c).subarray(a,b),c);
    return o;
  }
};
/* ---------- formatos de archivo ---------- */
function crc32(u8){let c,t=crc32.t;if(!t){t=crc32.t=new Uint32Array(256);for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}}
  let r=0xFFFFFFFF;for(let i=0;i<u8.length;i++)r=t[(r^u8[i])&255]^(r>>>8);return(r^0xFFFFFFFF)>>>0;}
/* ZIP sin compresión ("store"): los PNG ya vienen comprimidos */
function zip(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const f of files){const nm=enc.encode(f.name),crc=crc32(f.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,0,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(h.buffer,nm,f.data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,0,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(c.buffer,nm);off+=30+nm.length+f.data.length;}
  let sz=0;for(const p of cd)sz+=p.byteLength;
  const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,sz,true);e.setUint32(16,off,true);
  return new Blob(parts.concat(cd,[e.buffer]),{type:"application/zip"});
}
function wav(buf){
  const ch=Math.min(2,buf.numberOfChannels),n=buf.length,sr=buf.sampleRate,v=new DataView(new ArrayBuffer(44+n*ch*2));
  const s=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
  s(0,"RIFF");v.setUint32(4,36+n*ch*2,true);s(8,"WAVE");s(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);s(36,"data");v.setUint32(40,n*ch*2,true);
  const L=buf.getChannelData(0),R=ch>1?buf.getChannelData(1):L;let o=44;
  for(let i=0;i<n;i++){for(const d of ch>1?[L,R]:[L]){const x=Math.max(-1,Math.min(1,d[i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}}
  return new Blob([v.buffer],{type:"audio/wav"});
}
/* GIF animado: paleta fija de 252 colores (6×7×6) y compresión LZW */
function gif(frames,w,h,delayCs){
  const out=[],b=x=>out.push(x&255),w16=x=>{b(x);b(x>>8);};
  "GIF89a".split("").forEach(c=>b(c.charCodeAt(0)));w16(w);w16(h);b(0xF7);b(0);b(0);
  const pal=[];for(let r=0;r<6;r++)for(let g=0;g<7;g++)for(let bl=0;bl<6;bl++)pal.push([Math.round(r*51),Math.round(g*255/6),Math.round(bl*51)]);
  while(pal.length<256)pal.push([0,0,0]);for(const c of pal){b(c[0]);b(c[1]);b(c[2]);}
  b(0x21);b(0xFF);b(11);"NETSCAPE2.0".split("").forEach(c=>b(c.charCodeAt(0)));b(3);b(1);w16(0);b(0);
  for(const px of frames){
    const idx=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++){const r=Math.round(px[i*4]/51),g=Math.round(px[i*4+1]*6/255),bl=Math.round(px[i*4+2]/51);idx[i]=r*42+g*6+bl;}
    b(0x21);b(0xF9);b(4);b(0);w16(delayCs);b(0);b(0);
    b(0x2C);w16(0);w16(0);w16(w);w16(h);b(0);
    const mc=8;b(mc);
    /* LZW */
    const clear=1<<mc,eoi=clear+1;let bits=mc+1,next=eoi+1,dict=new Map(),cur=0,nb=0;const bytes=[];
    const put=code=>{cur|=code<<nb;nb+=bits;while(nb>=8){bytes.push(cur&255);cur>>>=8;nb-=8;}};
    put(clear);let pre=idx[0];
    for(let i=1;i<idx.length;i++){const k=idx[i],key=pre*256+k,hit=dict.get(key);
      if(hit!==undefined){pre=hit;}
      else{put(pre);if(next<4096){dict.set(key,next++);if(next>(1<<bits)&&bits<12)bits++;}else{put(clear);dict=new Map();bits=mc+1;next=eoi+1;}pre=k;}}
    put(pre);put(eoi);if(nb>0)bytes.push(cur&255);
    for(let i=0;i<bytes.length;i+=255){const n=Math.min(255,bytes.length-i);b(n);for(let j=0;j<n;j++)out.push(bytes[i+j]);}
    b(0);
  }
  b(0x3B);return new Blob([new Uint8Array(out)],{type:"image/gif"});
}
/* ---------- ejecuta una exportación personalizada (miniatura, PNG, GIF…) con el motor del Studio ---------- */
function correr(o){
  const S=Studio,eng=window.__atr2.engine,cv=$("cv"),tmp=document.createElement("canvas");tmp.width=o.W;tmp.height=o.H;const g=tmp.getContext("2d");g.imageSmoothingQuality="high";
  const [CW,CH]=o.ss>1?[par2(o.W*o.ss),par2(o.H*o.ss)]:[o.W,o.H];
  eng.fijar(CW,CH);let n=0;
  return new Promise(res=>{
    const ex={fps:o.fps,cancelled:false,__x:1,desde:o.desde,hasta:o.hasta,blur:o.blur||0,skip:()=>false,
      capture(){if(ex.cancelled)return;g.drawImage(cv,0,0,o.W,o.H);if(window.Fx)Fx.draw(g,o.W,o.H);if(window.Dub)Dub.drawSub(g,o.W,o.H);o.frame(tmp,g,n++);o.prog&&o.prog(Math.min(1,n/o.total));},
      end(){S.exporting=false;eng.soltar();res({cancelado:ex.cancelled,n});}};
    window.__xcancel=()=>{ex.cancelled=true;};
    S.exporting=true;if(!S.beginExport(ex)){S.exporting=false;eng.soltar();res({cancelado:true,n:0,error:"Hay una vista previa en curso. Detenla primero."});}
  });
}
function bajar(blob,nom){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nom;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),20000);}
const png=c=>new Promise(r=>c.toBlob(r,"image/png"));
let ocupado=false;
function ui(){
  const box=$("expOpts");if(!box||$("xCard"))return;
  const card=document.createElement("div");card.id="xCard";card.style.cssText="background:#1b1e30;border-radius:10px;padding:10px;margin:10px 0;font-size:13px";
  card.innerHTML=`<b>🎛 Perfil rápido</b> <select id="xPerf"><option value="">Personalizado</option><option value="yt1080">YouTube 1080p (30 fps · 12 Mbps)</option><option value="yt4k">YouTube 4K (30 fps · 45 Mbps)</option><option value="short">Shorts / Reels vertical (1080 · 30 fps · 10 Mbps)</option><option value="draft">Borrador rápido (720p · 24 fps · 5 Mbps)</option></select>
  <div id="xPerfNota" style="font-size:11.5px;opacity:.8;margin:4px 0"></div>
  <p style="margin:8px 0 4px"><label><input type="checkbox" id="xTr"> Exportar solo un tramo</label> <span id="xTrBox" hidden>desde <input id="xD" type="number" min="0" step=".5" value="0" style="width:70px"> s hasta <input id="xH" type="number" min="0" step=".5" style="width:70px"> s</span></p>
  <p style="margin:4px 0">Movimiento suave <select id="xBl"><option value="0">No (más rápido)</option><option value="3">Suave (3 subcuadros)</option><option value="6">Fuerte (6 subcuadros)</option></select> &nbsp; Bordes más suaves <select id="xSs"><option value="1">No</option><option value="1.5">Sí (1.5×, más lento)</option><option value="2">Máximo (2×, mucho más lento)</option></select></p>
  <div style="margin-top:6px"><b>Otras salidas</b> <small style="opacity:.7">(usan el tramo de arriba si lo marcas)</small><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
   <button id="xMin">🖼 Miniatura (PNG)</button><button id="xAud">🎵 Solo audio (WAV)</button><button id="xSeq">🗂 Secuencia PNG (.zip)</button><button id="xGif">🌀 GIF animado</button></div>
   <div id="xProg" hidden style="margin-top:6px"><span id="xTxt"></span><div style="background:#12141c;border-radius:9px;height:12px;overflow:hidden;margin-top:3px"><div id="xBar" style="height:100%;width:0;background:#7ee787"></div></div><button id="xCan" style="margin-top:4px">Cancelar</button></div>
   <div id="xMsg" style="font-size:12px;margin-top:6px;color:#ffb347"></div></div>`;
  const first=box.querySelector("p");first.after(card);
  const msg=t=>{$("xMsg").textContent=t||"";};
  const PERF={yt1080:{r:"1080",f:"30",m:12,n:"Recomendado por YouTube para 1080p."},yt4k:{r:"2160",f:"30",m:45,n:"Pesado: tarda más y el archivo es grande."},short:{r:"1080",f:"30",m:10,n:"Para Shorts/Reels/TikTok el lienzo debe ser vertical 9:16; cámbialo en el formato del proyecto si no lo está."},draft:{r:"720",f:"24",m:5,n:"Para revisar rápido; no es la calidad final."}};
  $("xPerf").onchange=e=>{const p=PERF[e.target.value];$("xPerfNota").textContent=p?p.n:"";if(!p)return;
    const r=document.querySelector(`input[name=expRes][value="${p.r}"]`),f=document.querySelector(`input[name=expFps][value="${p.f}"]`);if(r)r.checked=true;if(f)f.checked=true;
    const m=$("expMbps"),c=$("expMbpsC");if(m){const o=[...m.options].find(o=>+o.value===p.m);if(o){m.value=o.value;if(c)c.value="";m.dispatchEvent(new Event("change"));}else if(c){m.value="0";c.value=p.m;c.dispatchEvent(new Event("input"));}}
    if(e.target.value==="short"&&Studio.dim().asp>=1)$("xPerfNota").textContent+=" (Ahora el lienzo es horizontal.)";};
  const tot=()=>Studio.totalSeconds();
  const sync=()=>{X.tramo=$("xTr").checked;$("xTrBox").hidden=!X.tramo;X.desde=Math.max(0,+$("xD").value||0);const h=+$("xH").value;X.hasta=h>0?Math.min(h,tot()):null;X.blur=+$("xBl").value;X.ss=+$("xSs").value;};
  ["xTr","xD","xH","xBl","xSs"].forEach(i=>$(i).addEventListener("input",sync));
  new MutationObserver(()=>{if(!$("exp").hidden){$("xH").value=tot();$("xD").value=0;$("xTr").checked=false;$("xBl").value="0";$("xSs").value="1";sync();msg("");}}).observe($("exp"),{attributes:true,attributeFilter:["hidden"]});
  const prog=(t,u)=>{$("xProg").hidden=false;$("xTxt").textContent=t;$("xBar").style.width=(u*100).toFixed(0)+"%";};
  const lock=b=>{ocupado=b;["xMin","xAud","xSeq","xGif","expGo","expBg"].forEach(i=>{const e=$(i);if(e)e.disabled=b;});if(!b)$("xProg").hidden=true;};
  $("xCan").onclick=()=>{window.__xcancel&&window.__xcancel();};
  const rango=()=>{sync();const T=tot(),d=X.tramo?Math.min(X.desde,T-.1):0,h=X.tramo&&X.hasta?X.hasta:T;return {d,h};};
  const dimFinal=(tier)=>{const asp=Studio.dim().asp;return asp>=1?[Math.round(tier*asp/2)*2,tier]:[tier,Math.round(tier/asp/2)*2];};
  const fpsSel=()=>+(document.querySelector("input[name=expFps]:checked")||{value:30}).value;
  $("xMin").onclick=async()=>{if(ocupado)return;msg("");const {d}=rango(),[W,H]=dimFinal(720);lock(true);prog("Sacando la miniatura…",.2);
    let blob=null;const r=await correr({W,H,fps:30,desde:d,hasta:d+1/30+1e-4,total:1,ss:X.ss,frame:async(c)=>{blob=await png(c);}});
    await new Promise(r=>setTimeout(r,200));lock(false);if(!blob){msg(r.error||"No pude sacar la miniatura.");return;}bajar(blob,NOMBRE()+"-miniatura.png");msg("Miniatura guardada ("+W+"×"+H+") del segundo "+d.toFixed(1)+".");};
  $("xAud").onclick=async()=>{if(ocupado)return;msg("");if(!(window.Dub&&Dub.hasAudio())){msg("Este proyecto no tiene voces ni música todavía.");return;}
    lock(true);prog("Mezclando el audio…",.5);try{const {d,h}=rango(),mix=E.recorte(await Dub.mixdown(48000),d,h);bajar(wav(mix),NOMBRE()+"-audio.wav");msg("Audio guardado ("+Math.round(mix.duration)+" s, WAV 48 kHz).");}catch(e){msg("No pude mezclar el audio: "+(e&&e.message||e));}lock(false);};
  $("xSeq").onclick=async()=>{if(ocupado)return;msg("");const {d,h}=rango(),fps=fpsSel(),total=Math.max(1,Math.round((h-d)*fps)),[W,H]=dimFinal(+(document.querySelector("input[name=expRes]:checked")||{value:1080}).value);
    if(total>1800){msg("Son "+total+" cuadros: demasiado para armar un .zip en memoria. Elige un tramo más corto (máx. 1800 cuadros) o baja los cuadros por segundo.");return;}
    lock(true);const files=[];const pend=[];
    const r=await correr({W,H,fps,desde:d,hasta:h,blur:X.blur,total,ss:X.ss,prog:u=>prog("Cuadros "+Math.round(u*total)+" de "+total,u),frame:(c,g,i)=>{pend.push(png(c).then(b=>b.arrayBuffer()).then(ab=>{files[i]={name:"cuadro_"+String(i+1).padStart(5,"0")+".png",data:new Uint8Array(ab)};}));}});
    await Promise.all(pend);
    if(r.cancelado){lock(false);msg("Cancelado.");return;}
    prog("Armando el .zip…",1);const z=zip(files.filter(Boolean));bajar(z,NOMBRE()+"-cuadros.zip");lock(false);msg("Listo: "+files.length+" cuadros PNG de "+W+"×"+H+" ("+(z.size/1048576).toFixed(1)+" MB).");};
  $("xGif").onclick=async()=>{if(ocupado)return;msg("");const {d,h}=rango(),fps=Math.min(15,fpsSel()),dur=h-d;
    if(dur>20){msg("Un GIF de más de 20 segundos queda muy pesado. Marca «solo un tramo» de 20 s o menos.");return;}
    const asp=Studio.dim().asp,W=asp>=1?480:270,H=Math.round(W/asp/2)*2,total=Math.max(1,Math.round(dur*fps)),frames=[];
    lock(true);
    const r=await correr({W,H,fps,desde:d,hasta:h,blur:X.blur,total,ss:X.ss,prog:u=>prog("Cuadros "+Math.round(u*total)+" de "+total,u),frame:(c,g)=>{frames.push(g.getImageData(0,0,W,H).data.slice());}});
    if(r.cancelado){lock(false);msg("Cancelado.");return;}
    prog("Comprimiendo el GIF…",1);await new Promise(r=>setTimeout(r,30));const b=gif(frames,W,H,Math.round(100/fps));bajar(b,NOMBRE()+".gif");lock(false);msg("GIF listo: "+W+"×"+H+", "+frames.length+" cuadros, "+(b.size/1048576).toFixed(1)+" MB.");};
}
/* ---------- aviso al terminar ---------- */
function avisos(){
  const done=$("expDone");if(!done)return;
  $("expGo")&&$("expGo").addEventListener("click",()=>{try{if(window.Notification&&Notification.permission==="default")Notification.requestPermission();}catch(e){}});
  new MutationObserver(()=>{if(!done.hidden){const t=$("expRes")?$("expRes").textContent:"Tu video está listo";
    const tt=document.title;document.title="✅ Video listo – "+tt.replace(/^✅ Video listo – /,"");
    try{if(window.Notification&&Notification.permission==="granted"&&document.hidden)new Notification("Atrapacuentos Studio",{body:t});}catch(e){}
    window.addEventListener("focus",()=>{document.title=tt.replace(/^✅ Video listo – /,"");},{once:true});}}).observe(done,{attributes:true,attributeFilter:["hidden"]});
}
/* ---------- cuadros por segundo reales de la vista previa + calidad adaptable ---------- */
function medidor(){
  const fr=$("frame");if(!fr)return;const b=document.createElement("div");b.id="fpsReal";b.style.cssText="position:absolute;top:6px;right:8px;z-index:5;background:#000a;color:#7ee787;font:600 11px monospace;padding:2px 7px;border-radius:7px;pointer-events:none";b.hidden=true;fr.appendChild(b);
  let n=0,t0=performance.now(),lento=0,rapido=0,activo=false;
  window.addEventListener("serie-time",()=>{
    if(Studio.exporting){b.hidden=true;return;}
    if(!Studio.playing)return;
    if(!activo){activo=true;n=0;t0=performance.now();lento=rapido=0;b.hidden=false;}
    n++;const now=performance.now();
    if(now-t0>=1000){const fps=n*1000/(now-t0);n=0;t0=now;b.textContent="⚡ "+Math.round(fps)+" cuadros/s"+((window.PrevQ||1)<1?" · calidad "+Math.round((window.PrevQ||1)*100)+"%":"");b.style.color=fps>=24?"#7ee787":fps>=15?"#ffd166":"#ff8a8a";
      if(fps<22){lento++;rapido=0;}else if(fps>=29){rapido++;lento=0;}else{lento=rapido=0;}
      if(lento>=2&&(window.PrevQ||1)>.5){window.PrevQ=Math.max(.5,(window.PrevQ||1)-.25);window.FisQ=.5;lento=0;refit();}
      else if(rapido>=5&&(window.PrevQ||1)<1){window.PrevQ=Math.min(1,(window.PrevQ||1)+.25);if(window.PrevQ>=1)window.FisQ=1;rapido=0;refit();}}
  });
  setInterval(()=>{if(activo&&!Studio.playing){activo=false;b.hidden=true;if((window.PrevQ||1)<1||window.FisQ){window.PrevQ=1;window.FisQ=1;refit();}}},700);
  const refit=()=>{window.dispatchEvent(new Event("resize"));const c=$("cv");if(c&&window.ResizeObserver){/* fitCanvas se llama al cambiar tamaño */}if(window.Studio&&Studio.refit)Studio.refit();};
}
function init(){ui();avisos();medidor();if(!Studio.__xw){Studio.__xw=1;const o=Studio.beginExport;Studio.beginExport=ex=>{if(!ex.__x)Object.assign(ex,E.flags());return o(ex);};}}
if(window.Studio&&$("expOpts"))init();else document.addEventListener("studio-ready",init);
})();
