/* Doblaje y subtítulos de Atrapacuentos Studio.
   - Cada escena tiene "líneas": texto + quién habla + momento en que empieza + voz (grabada o subida).
   - La voz mueve la boca del personaje y los subtítulos resaltan la palabra que se está diciendo.
   - Las voces se mezclan al ritmo del cuento para el MP4. */
(function(){
const AUD={};            /* id de línea -> {data,buf,env,dur,vs,ve} */
let AC=null,srcs=[],cur=null,state=null,rec=null,mus=null;
const MK="__musica__";
const $=id=>document.getElementById(id);
const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
const newId=()=>"l"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const S=()=>window.Studio;
const SUBDEF={on:true,burn:true,pos:"abajo",off:0,size:6,font:"redondo",bold:true,italic:false,upper:false,col:"#ffffff",hi:"#ffd23f",hiMode:"color",outline:true,outCol:"#000000",outW:14,shadow:false,bg:true,bgCol:"#000000",bgOp:50,maxW:86,sepLine:1.3};
function sub(){const p=S().proj;p.sub=Object.assign({},SUBDEF,p.sub||{});return p.sub;}
const lines=w=>w.lineas||(w.lineas=[]);

/* ---------- guardado de voces (IndexedDB, para que no se pierdan al recargar) ---------- */
function idb(){return new Promise((ok,no)=>{try{const r=indexedDB.open("atr2_aud",1);r.onupgradeneeded=()=>r.result.createObjectStore("a");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);}catch(e){no(e);}});}
async function idbPut(k,v){if(window.__RENDER)return;try{const d=await idb();d.transaction("a","readwrite").objectStore("a").put(v,k);}catch(e){}}
async function idbGet(k){try{const d=await idb();return await new Promise(ok=>{const r=d.transaction("a").objectStore("a").get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null);});}catch(e){return null;}}

/* ---------- voz: decodificar, medir volumen y detectar dónde empieza y termina ---------- */
async function setAudio(id,dataURL){
  const bin=atob(dataURL.split(",")[1]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const buf=await ac().decodeAudioData(u8.buffer);
  const ch=buf.getChannelData(0),hop=Math.max(1,Math.round(buf.sampleRate/50)),n=Math.ceil(ch.length/hop),env=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0,c=0;for(let j=i*hop;j<Math.min(ch.length,(i+1)*hop);j+=4){s+=ch[j]*ch[j];c++;}env[i]=Math.sqrt(s/(c||1));}
  const sorted=Array.from(env).sort((a,b)=>a-b),ref=sorted[Math.floor(n*.95)]||1e-4;
  for(let i=0;i<n;i++)env[i]=Math.min(1,env[i]/ref);
  let a=0,b=n-1;while(a<n&&env[a]<.15)a++;while(b>a&&env[b]<.15)b--;
  const vs=a>=n?0:Math.max(0,a/50-.05),ve=a>=n?buf.duration:Math.min(buf.duration,(b+1)/50+.1);
  /* visemas: forma de la boca según el sonido (vocal abierta, o/u, e/i, s/f) */
  const vis=new Uint8Array(n),sr=buf.sampleRate,al=1-Math.exp(-2*Math.PI*600/sr);
  let lp=0;
  for(let i=0;i<n;i++){let e=0,el=0,zc=0,prev=0;const a0=i*hop,a1=Math.min(ch.length,(i+1)*hop);
    for(let j=a0;j<a1;j++){const x=ch[j];lp+=al*(x-lp);e+=x*x;el+=lp*lp;if(j>a0&&(x>0)!==(prev>0))zc++;prev=x;}
    const m=a1-a0||1,zr=zc/m*sr/2000,r=el/(e||1);
    if(env[i]<.16)vis[i]=0;else if(zr>2.2&&env[i]<.7)vis[i]=4;else if(r>.72)vis[i]=2;else if(r<.34)vis[i]=3;else vis[i]=1;}
  for(let i=1;i<n-1;i++)if(vis[i]!==vis[i-1]&&vis[i]!==vis[i+1]&&vis[i-1]===vis[i+1])vis[i]=vis[i-1];
  AUD[id]={data:dataURL,buf,env,vis,dur:buf.duration,vs,ve};
  return AUD[id];
}
function blobToDataURL(b){return new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(b);});}
function pushUndo(ln){const a=AUD[ln.id];if(!a)return;(ln._undo||(ln._undo=[])).push(a.data);if(ln._undo.length>6)ln._undo.shift();if(!ln._orig)ln._orig=a.data;}
async function attach(ln,blob){
  const d=await blobToDataURL(blob);pushUndo(ln);await setAudio(ln.id,d);idbPut(ln.id,d);
  const w=S().proj.mundos[S().proj.mundo],au=AUD[ln.id];
  const end=ln.t0+au.dur+.3;if(end>(w.dur||6)){w.dur=Math.min(120,Math.ceil(end));}
  S().changed();
}
function dump(){const o={};if(AUD[MK]&&S().proj.musica)o[MK]=AUD[MK].data;for(const w of S().proj.mundos)for(const l of lines(w))if(AUD[l.id])o[l.id]=AUD[l.id].data;return Object.keys(o).length?o:undefined;}
async function load(map){if(!map)return;for(const id in map){try{await setAudio(id,map[id]);idbPut(id,map[id]);}catch(e){}}}
async function restore(){
  if(!AUD[MK]&&S().proj.musica){const d=await idbGet(MK);if(d){try{await setAudio(MK,d);}catch(e){}}}
  for(const w of S().proj.mundos)for(const l of lines(w)){
    if(AUD[l.id]||!l.voz)continue;const d=await idbGet(l.id);if(d){try{await setAudio(l.id,d);}catch(e){}}
  }
}

/* ---------- tiempos de cada palabra ---------- */
function words(ln){
  const au=AUD[ln.id],ws=(ln.txt||"").trim().split(/\s+/).filter(Boolean);
  const key=ln.txt+"|"+ln.t0+"|"+(au?au.vs+"|"+au.ve:"x");
  if(ln._wk===key)return ln._w;
  const start=ln.t0+(au?au.vs:0),end=au?ln.t0+au.ve:ln.t0+Math.max(1.2,ws.length*.42);
  const wt=ws.map(w=>w.replace(/[^\p{L}\p{N}]/gu,"").length+1.5+(/[,;:]$/.test(w)?1.5:0)+(/[.!?…]$/.test(w)?3:0));
  const tot=wt.reduce((a,b)=>a+b,0)||1;let a=start;
  ln._w=ws.map((w,i)=>{const d=(end-start)*wt[i]/tot,o={w,t0:a,t1:a+d};a+=d;return o;});ln._wk=key;ln._s=start;ln._e=end;return ln._w;
}
function lineEnd(ln){words(ln);return ln._e||ln.t0;}

/* ---------- reproducción durante la vista previa ---------- */
function stopSrc(){srcs.forEach(s=>{try{s.stop();}catch(e){}});srcs=[];}
function offsetOf(i){return S().proj.mundos.slice(0,i).reduce((a,w)=>a+(w.dur||6),0);}
function musicStop(){if(mus){try{mus.src.stop();}catch(e){}mus=null;}}
function musicBegin(w,from){
  from=from||0;const m=AUD[MK],o=S().proj.musica;if(!m||!o)return;const a=ac(),idx=S().proj.mundos.indexOf(w),expected=offsetOf(idx)+from;
  if(mus){const played=a.currentTime-mus.t0+mus.off;if(Math.abs(played-expected)>.4)musicStop();}
  if(!mus){
    const src=a.createBufferSource();src.buffer=m.buf;src.loop=true;const g=a.createGain();g.gain.value=o.vol*(w.musVol==null?1:w.musVol);src.connect(g);g.connect(a.destination);
    src.start(0,expected%m.buf.duration);mus={src,g,t0:a.currentTime,off:expected};
  }
  /* la música baja un poco mientras alguien habla */
  const gp=mus.g.gain,now=a.currentTime,ov=o.vol*(w.musVol==null?1:w.musVol);gp.cancelScheduledValues(now);gp.setValueAtTime(ov,now);
  if(o.duck)for(const ln of lines(w)){if(ln.sfx||(!AUD[ln.id]&&!ln.txt))continue;words(ln);const s0=now+ln._s-from,e0=now+ln._e-from;
    if(e0<=now)continue;gp.linearRampToValueAtTime(ov,Math.max(now,s0-.25));gp.linearRampToValueAtTime(ov*.3,Math.max(now,s0));gp.setValueAtTime(ov*.3,Math.max(now,e0));gp.linearRampToValueAtTime(ov,e0+.4);}
}
/* ---- estéreo y eco (reverberación) por línea ---- */
const RV={sala:[.9,2.2],pasillo:[1.6,2.6],cueva:[3.2,1.7],bosque:[1.2,3.2]};
function irFor(ctx,k){const T=RV[k];if(!T)return null;const sr=ctx.sampleRate,n=Math.floor(sr*T[0]),b=ctx.createBuffer(2,n,sr);let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1;};
  for(let c=0;c<2;c++){const dd=b.getChannelData(c);for(let i=0;i<n;i++)dd[i]=rnd()*Math.pow(1-i/n,T[1]*2.2)*(i<sr*.004?i/(sr*.004):1);}return b;}
function voiceNode(ctx,ln,buf,dest,when,off){const s=ctx.createBufferSource();s.buffer=buf;let n=s;
  if(ln.pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,ln.pan));n.connect(p);n=p;}
  n.connect(dest);
  if(ln.rvk&&RV[ln.rvk]){const cv=ctx.createConvolver();cv.buffer=irFor(ctx,ln.rvk);const sg=ctx.createGain();sg.gain.value=(ln.rvm==null?.35:ln.rvm)*3.2;n.connect(sg);sg.connect(cv);cv.connect(dest);}
  s.start(when,off||0);return s;}
const mixRow=ln=>`<div class="r"><span>Posición</span><input class="pan" type="range" min="-100" max="100" step="5" value="${Math.round((ln.pan||0)*100)}" style="width:110px" title="Izquierda ⇄ derecha"><b class="pv">${ln.pan?(ln.pan<0?"◀ ":"")+Math.abs(Math.round(ln.pan*100))+(ln.pan>0?" ▶":""):"centro"}</b><span>Eco</span><select class="rvk"><option value="">Sin eco</option>${Object.keys(RV).map(k=>`<option value="${k}" ${ln.rvk===k?"selected":""}>${k[0].toUpperCase()+k.slice(1)}</option>`).join("")}</select><input class="rvm" type="range" min="5" max="100" step="5" value="${Math.round((ln.rvm==null?.35:ln.rvm)*100)}" style="width:80px" ${ln.rvk?"":"disabled"} title="Cuánto eco"></div>`;
function bindMix(d,ln){const p=d.querySelector(".pan"),pv=d.querySelector(".pv"),k=d.querySelector(".rvk"),m=d.querySelector(".rvm");
  p.oninput=()=>{ln.pan=+p.value/100;pv.textContent=ln.pan?(ln.pan<0?"◀ ":"")+Math.abs(p.value)+(ln.pan>0?" ▶":""):"centro";S().changed();};
  k.onchange=()=>{ln.rvk=k.value||undefined;m.disabled=!k.value;S().changed();};m.oninput=()=>{ln.rvm=+m.value/100;S().changed();};}

let recId=null;
function begin(w,live,from){
  from=from||0;stopSrc();cur=w;state=null;if(!live)return;
  musicBegin(w,from);
  const a=ac();if(a.state==="suspended")a.resume();
  for(const ln of lines(w)){const au=AUD[ln.id];if(!au||ln.id===recId)continue;
    const dt=Math.max(0,ln.t0)-from,off=dt<0?-dt:0;if(off>=au.buf.duration-.02)continue;
    srcs.push(voiceNode(a,ln,au.buf,a.destination,a.currentTime+Math.max(0,dt),off));}
}
function stop(){
  stopSrc();musicStop();state=null;cur=null;
  if(S()&&S().placed)for(const i of S().placed)i.dubLv=null;
  clearSub();
}
/* cada cuadro: qué línea suena, qué palabra, cuánto abre la boca el que habla */
function tick(t,w){
  let act=null;
  for(const ln of lines(w)){if(ln.sfx||(!ln.txt&&!AUD[ln.id]))continue;words(ln);if(t>=ln._s-.05&&t<=ln._e+.5){act=ln;}}
  for(const i of S().placed){i.dubLv=null;i.dubVis=0;}
  if(act){
    const au=AUD[act.id],ws=words(act);let idx=-1;
    for(let k=0;k<ws.length;k++)if(t>=ws[k].t0)idx=k;
    if(t>act._e)idx=-1;
    state={ln:act,words:ws,idx};
    if(act.quien){
      const it=S().placed.find(i=>i.uid===act.quien);
      if(it){
        let lv,vs=1;
        if(au){if(act.rh&&!au._rh&&window.IA){au.vis=IA.visDeCues(act.rh.map(c=>({start:c[0],end:c[1],value:c[2]})),au.vis.length,Math.max(1,Math.round(au.buf.sampleRate/50)),au.buf.sampleRate);au._rh=1;}const k=Math.floor((t-act.t0+.03)*50);lv=k>=0&&k<au.env.length?au.env[k]:0;vs=au.vis&&k>=0&&k<au.vis.length?au.vis[k]:1;}
        else{lv=(t>=act._s&&t<=act._e)?(.5+.5*Math.sin(t*14))*(.55+.45*Math.sin(t*5.3)):0;vs=1+Math.floor(t*7)%3;}
        it.dubLv=lv;it.dubVis=vs||1;
      }
    }
  }else state=null;
  if(!window.Studio.exporting)drawPreview();
}

/* ---------- subtítulos ---------- */
function drawSub(g,W,H){
  const o=sub();if(!o.on||!state)return;
  if(S().exporting&&o.burn===false)return;
  const ws=state.words;if(!ws.length)return;
  if(window.Subs)Subs.render(g,W,H,ws,state.idx,o);
}
function clearSub(){const c=$("subCv");if(c){const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);}}
function drawPreview(){
  const c=$("subCv");if(!c)return;const r=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1,W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);
  if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
  const g=c.getContext("2d");g.clearRect(0,0,W,H);if(window.Fx)Fx.draw(g,W,H);drawSub(g,W,H);
}

/* ---------- mezcla final para el MP4 ---------- */
function hasAudio(){return !!(AUD[MK]&&S().proj.musica)||S().proj.mundos.some(w=>lines(w).some(l=>AUD[l.id]));}
async function mixdown(sr){
  const P=S().proj,total=P.mundos.reduce((a,w)=>a+(w.dur||6),0);
  if(!hasAudio())return null;
  const oc=new OfflineAudioContext(2,Math.ceil(total*sr),sr);let off=0;
  const mo=P.musica;
  if(AUD[MK]&&mo){
    const s=oc.createBufferSource();s.buffer=AUD[MK].buf;s.loop=true;
    const fg=oc.createGain(),dg=oc.createGain(),sg=oc.createGain();s.connect(fg);fg.connect(dg);dg.connect(sg);sg.connect(oc.destination);{let o3=0,pv=1;for(const w of P.mundos){const v=w.musVol==null?1:w.musVol;if(o3===0)sg.gain.setValueAtTime(v,0);else{sg.gain.setValueAtTime(pv,o3);sg.gain.linearRampToValueAtTime(v,o3+.3);}pv=v;o3+=(w.dur||6);}}
    fg.gain.setValueAtTime(0,0);fg.gain.linearRampToValueAtTime(mo.vol,Math.min(1,total/3));fg.gain.setValueAtTime(mo.vol,Math.max(0,total-1.5));fg.gain.linearRampToValueAtTime(0,total);
    dg.gain.setValueAtTime(1,0);
    if(mo.duck){let o2=0;for(const w of P.mundos){for(const ln of lines(w)){if(ln.sfx||(!AUD[ln.id]&&!ln.txt))continue;words(ln);const s0=o2+ln._s,e0=o2+ln._e;
      dg.gain.setValueAtTime(1,Math.max(0,s0-.25));dg.gain.linearRampToValueAtTime(.3,s0);dg.gain.setValueAtTime(.3,e0);dg.gain.linearRampToValueAtTime(1,e0+.4);}o2+=(w.dur||6);}}
    s.start(0);
  }
  for(const w of P.mundos){
    for(const ln of lines(w)){const au=AUD[ln.id];if(!au)continue;voiceNode(oc,ln,au.buf,oc.destination,off+Math.max(0,ln.t0));}
    off+=(w.dur||6);
  }
  return await oc.startRendering();
}

/* ---------- ventana de doblaje ---------- */
let dlg=null;
function css(){
  if($("dubCss"))return;const st=document.createElement("style");st.id="dubCss";
  st.textContent=`.dbl{background:#242842;border-radius:12px;padding:10px;margin:8px 0}.dbl textarea{width:100%;background:#12141c;color:#fff;border:1px solid #3a4064;border-radius:8px;padding:8px;font:inherit;resize:vertical}
  .dbl select{background:#12141c;color:#fff;border:1px solid #3a4064;border-radius:8px;padding:6px}.dbl .r{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:13px}
  .dbl .rec{background:#c0392b}.dbl .inf{opacity:.8;font-size:12px}#dbTele{position:absolute;inset:0;background:#0a0b12f2;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;z-index:2}
  #dbTele[hidden]{display:none}#dbTele .big{font-size:30px;font-weight:800;line-height:1.5;max-width:760px}#dbTele .big span{opacity:.5}#dbTele .big span.on{opacity:1;color:#ffd23f}#dbTele .big span.done{opacity:1}
  #dbTele .cd{font-size:70px;font-weight:800;color:#ffb347}.dbs label{display:inline-flex;gap:6px;align-items:center;margin:4px 12px 4px 0}`;
  document.head.appendChild(st);
}
function speakers(){
  const o=['<option value="">🗣 Narrador</option>'];
  S().placed.forEach(i=>{o.push(`<option value="${i.uid}">${esc(i.ficha?i.ficha.nombre:i.id)}</option>`);});
  return o.join("");
}
function openDlg(){
  css();
  if(!dlg){
    dlg=document.createElement("div");dlg.id="dub";dlg.className="modal";
    dlg.innerHTML=`<div class="mbox" style="max-width:900px;position:relative"><h2>🎙 Estudio de grabación</h2>
    <p>Escribe lo que se dice en cada escena, elige quién habla y pulsa «Grabar»: la escena se reproduce en pantalla con sus subtítulos mientras hablas. Mejor con audífonos, para que el micrófono no capte las otras voces.</p>
    <p><b>Escena:</b> <select id="dbScene"></select></p><div id="dbLines"></div>
    <p><button id="dbAdd" class="pri">➕ Agregar línea</button> <select id="dbSfx"></select> <button id="dbSfxAdd">🔊 Agregar efecto</button> <button id="dbPrev" class="go">▶ Ver esta escena</button></p>
    <div class="dbs"><h4 style="margin:12px 0 4px">🔤 Estilo de los subtítulos</h4>
      <label><input type="checkbox" id="sbOn"> Mostrar subtítulos</label>
      <label><input type="checkbox" id="sbBurn"> Dentro del video exportado</label>
      <label>Posición <select id="sbPos"><option value="abajo">Abajo</option><option value="centro">Centro</option><option value="arriba">Arriba</option></select></label>
      <label>Tamaño <input type="range" id="sbSize" min="3" max="14" step=".5" style="width:110px"></label>
      <label>Texto <input type="color" id="sbCol"></label><label>Palabra que se dice <input type="color" id="sbHi"></label>
      <label><input type="checkbox" id="sbBg"> Fondo oscuro</label>
      <p style="margin:4px 0"><button id="dbSubOpen">💬 Más diseño: letra, contorno, sombra, archivo .srt…</button></p></div>
    <div class="dbs"><h4 style="margin:12px 0 4px">🎤 Micrófono</h4>
      <label>Micrófono <select id="dbMic" style="max-width:260px"></select></label>
      <label><input type="checkbox" id="dbNs" checked> Reducir ruido</label><label><input type="checkbox" id="dbEc" checked> Quitar eco</label>
      <button id="dbMicTest">🎙 Probar micrófono</button>
      <div style="background:#12141c;border-radius:8px;height:12px;overflow:hidden;margin-top:6px;max-width:420px"><div id="dbLvl" style="height:100%;width:0;background:linear-gradient(90deg,#3fbf5a,#f4c83a,#e0382f)"></div></div>
      <p id="dbMicMsg" style="font-size:12px;opacity:.85;margin:3px 0"></p></div>
    <div class="dbs"><h4 style="margin:12px 0 4px">🎧 Grabaciones</h4>
      <p style="margin:4px 0;font-size:13px">Saca tus voces para editarlas en otro programa (limpiar ruido, subir volumen…) y vuelve a subirlas: el Studio las ajusta solo.</p>
      <button id="dbExpRec">⬇ Exportar grabaciones (.zip)</button> <button id="dbImpRec">⬆ Importar grabaciones editadas</button> <button id="dbExpMix">⬇ Mezcla final (.wav)</button>
      <p id="dbRecMsg" style="font-size:12px;opacity:.85;margin:4px 0"></p></div>
    <div class="dbs"><h4 style="margin:12px 0 4px">🎵 Música de fondo</h4>
      <p id="mbInfo" style="margin:4px 0"></p>
      <button id="mbPick">📁 Elegir música</button> <button id="mbDel">🗑 Quitar</button>
      <label>Volumen <input type="range" id="mbVol" min="5" max="100" style="width:110px"></label>
      <label><input type="checkbox" id="mbDuck"> Bajar cuando alguien habla</label>
      <p style="font-size:11px;opacity:.7;margin:2px 0">Suena durante todo el cuento (se repite si es corta) y se atenúa al final. Usa música libre de derechos.</p></div>
    <div class="wnav"><button id="dbClose">Cerrar</button></div><div id="dbTele" hidden></div></div>`;
    document.body.appendChild(dlg);
    $("dbClose").onclick=closeDlg;$("dbScene").onchange=e=>{gotoScene(+e.target.value);};
    $("dbAdd").onclick=()=>{const w=S().proj.mundos[S().proj.mundo],ls=lines(w),last=ls[ls.length-1];ls.push({id:newId(),txt:"",quien:"",t0:last?+(lineEnd(last)+.3).toFixed(1):.5});S().changed();render();};
    $("dbPrev").onclick=()=>{closeDlg();S().play();};
    $("dbSfx").innerHTML=window.DubFX?DubFX.list().map(([k,n])=>`<option value="${k}">${n}</option>`).join(""):"";
    $("dbSfxAdd").onclick=async()=>{
      if(!window.DubFX)return;const k=$("dbSfx").value,fx=DubFX.makeSfx(k);if(!fx)return;
      const w=S().proj.mundos[S().proj.mundo],ls=lines(w),last=ls[ls.length-1],ln={id:newId(),txt:"",quien:"",t0:last?+(lineEnd(last)+.2).toFixed(1):.5,sfx:true,nombre:fx.nombre,voz:true};
      const d=await blobToDataURL(new Blob([DubX.wavBytes([fx.data],fx.sr)],{type:"audio/wav"}));
      await setAudio(ln.id,d);idbPut(ln.id,d);ls.push(ln);
      const end=ln.t0+AUD[ln.id].dur+.3;if(end>(w.dur||6))w.dur=Math.min(120,Math.ceil(end));
      S().changed();render();};
    const bind=(id,k,ev,get)=>{$(id)[ev]=()=>{sub()[k]=get($(id));S().changed();};};
    bind("sbOn","on","onchange",e=>e.checked);bind("sbBurn","burn","onchange",e=>e.checked);bind("sbPos","pos","onchange",e=>e.value);bind("sbSize","size","oninput",e=>+e.value);
    bind("sbCol","col","oninput",e=>e.value);bind("sbHi","hi","oninput",e=>e.value);bind("sbBg","bg","onchange",e=>e.checked);
    $("dbSubOpen").onclick=()=>{closeDlg();window.Subs&&Subs.open();};
    $("dbMic").onchange=()=>{micId=$("dbMic").value;};$("dbMicTest").onclick=testMic;
    $("dbExpRec").onclick=()=>window.DubX&&DubX.exportRec($("dbRecMsg"));
    $("dbImpRec").onclick=()=>window.DubX&&DubX.importRec($("dbRecMsg"),render);
    $("dbExpMix").onclick=()=>window.DubX&&DubX.exportMix($("dbRecMsg"));
    $("mbPick").onclick=()=>{const f=document.createElement("input");f.type="file";f.accept="audio/*";
      f.onchange=async()=>{const file=f.files[0];if(!file)return;try{const d=await blobToDataURL(file);await setAudio(MK,d);idbPut(MK,d);
        const P=S().proj;P.musica=Object.assign({vol:.5,duck:true},P.musica||{},{nombre:file.name});S().changed();S().say("Música agregada.");musUI();}catch(e){S().say("No pude leer esa música.");}};f.click();};
    $("mbDel").onclick=()=>{delete AUD[MK];delete S().proj.musica;musicStop();S().changed();musUI();};
    $("mbVol").oninput=()=>{const o=S().proj.musica;if(o){o.vol=$("mbVol").value/100;}};$("mbVol").onchange=()=>S().changed();
    $("mbDuck").onchange=()=>{const o=S().proj.musica;if(o){o.duck=$("mbDuck").checked;S().changed();}};
  }
  {const o=sub();$("sbOn").checked=o.on;$("sbBurn").checked=o.burn!==false;$("sbPos").value=o.pos;$("sbSize").value=o.size;$("sbCol").value=o.col;$("sbHi").value=o.hi;$("sbBg").checked=o.bg;}
  listMics();
  $("dbScene").innerHTML=S().proj.mundos.map((w,i)=>`<option value="${i}">${i+1}. ${esc(w.nombre)}</option>`).join("");$("dbScene").value=S().proj.mundo;
  dlg.hidden=false;render();musUI();
}
function musUI(){
  const o=S().proj.musica,m=AUD[MK];
  $("mbInfo").textContent=o&&m?"🎵 "+(o.nombre||"música")+" · "+Math.floor(m.dur/60)+":"+String(Math.round(m.dur%60)).padStart(2,"0"):(o?"Cargando música…":"Sin música todavía.");
  $("mbDel").disabled=!o;$("mbVol").disabled=!o;$("mbDuck").disabled=!o;if(o){$("mbVol").value=Math.round(o.vol*100);$("mbDuck").checked=!!o.duck;}
}
function closeDlg(){if(rec)cancelRec();stopListen();if(testStream){testStream.getTracks().forEach(t=>t.stop());testStream=null;if(stopMeter)stopMeter();}if(dlg)dlg.hidden=true;}
function gotoScene(i){
  /* cambia de escena sin salir de la ventana */
  const P=S().proj;if(i===P.mundo)return;S().select(null);
  document.querySelectorAll("#tlCards .sc")[i]?.click();setTimeout(render,50);
}
let micId="",lvlRaf=0,testStream=null;
async function listMics(){
  const sel=$("dbMic");if(!sel)return;
  try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==="audioinput");
    sel.innerHTML='<option value="">Predeterminado</option>'+d.map((x,i)=>`<option value="${x.deviceId}">${esc(x.label||("Micrófono "+(i+1)))}</option>`).join("");sel.value=micId;
    $("dbMicMsg").textContent=d.length?"":"No se detectó ningún micrófono. Conecta uno o usa «Subir audio».";}
  catch(e){sel.innerHTML='<option value="">Predeterminado</option>';}
}
const audioOpts=()=>({audio:Object.assign({echoCancellation:!$("dbEc")||$("dbEc").checked,noiseSuppression:!$("dbNs")||$("dbNs").checked},micId?{deviceId:{exact:micId}}:{})});
function meter(stream,bar){
  const a=ac(),src=a.createMediaStreamSource(stream),an=a.createAnalyser();an.fftSize=512;src.connect(an);const d=new Uint8Array(an.fftSize);let peak=0;
  const loop=()=>{an.getByteTimeDomainData(d);let m=0;for(let i=0;i<d.length;i++)m=Math.max(m,Math.abs(d[i]-128)/128);peak=Math.max(m,peak*.92);const bb=typeof bar==="string"?$(bar):bar;if(bb)bb.style.width=Math.round(Math.min(1,peak*1.6)*100)+"%";lvlRaf=requestAnimationFrame(loop);};
  loop();return ()=>{cancelAnimationFrame(lvlRaf);try{src.disconnect();}catch(e){}const bb=typeof bar==="string"?$(bar):bar;if(bb)bb.style.width="0";};
}
let stopMeter=null;
async function testMic(){
  const msg=$("dbMicMsg");
  if(testStream){testStream.getTracks().forEach(t=>t.stop());testStream=null;if(stopMeter)stopMeter();$("dbMicTest").textContent="🎙 Probar micrófono";msg.textContent="";return;}
  try{testStream=await navigator.mediaDevices.getUserMedia(audioOpts());await listMics();stopMeter=meter(testStream,"dbLvl");$("dbMicTest").textContent="⏹ Terminar prueba";msg.textContent="Habla: la barra debe moverse. Si casi no se mueve, acércate o sube el volumen del micrófono en tu computador.";}
  catch(e){msg.textContent="No pude usar el micrófono (puede estar bloqueado). Usa «Subir audio» o la versión de escritorio.";}
}
let listen=null;
function stopListen(){if(listen){try{listen.stop();}catch(e){}listen=null;}}
function render(){
  if(!dlg||dlg.hidden)return;const w=S().proj.mundos[S().proj.mundo],ls=lines(w);$("dbScene").value=S().proj.mundo;
  const box=$("dbLines");box.innerHTML=ls.length?"":'<p style="opacity:.7">Esta escena aún no tiene texto. Pulsa «Agregar línea» para escribir lo que dice el narrador o un personaje.</p>';
  ls.forEach((ln,k)=>{
    const au=AUD[ln.id],d=document.createElement("div");d.className="dbl";
    if(ln.sfx){
      d.innerHTML=`<div class="r"><b>${k+1}.</b> 🔊 <b>Efecto: ${esc(ln.nombre||"sonido")}</b><span class="inf">${au?au.dur.toFixed(1)+" s":"sin audio"}</span></div>
      <div class="r"><span>Suena en</span><input class="t0" type="range" min="0" max="${Math.max(10,(w.dur||6))}" step=".1" value="${ln.t0}" style="width:160px"><b class="tv">${(+ln.t0).toFixed(1)}s</b></div>
      ${mixRow(ln)}<div class="r"><button class="pl" ${au?"":"disabled"}>▶ Escuchar</button><button class="ed2" ${au?"":"disabled"}>✂ Volumen y recorte</button><button class="dl danger">✖ Quitar efecto</button></div><div class="edbox"></div>`;
      const t0=d.querySelector(".t0");t0.oninput=()=>{ln.t0=+t0.value;d.querySelector(".tv").textContent=(+ln.t0).toFixed(1)+"s";S().changed();};
      bindMix(d,ln);d.querySelector(".pl").onclick=()=>playLine(ln);
      d.querySelector(".ed2").onclick=()=>{ln._ed=!ln._ed;render();};
      d.querySelector(".dl").onclick=()=>{ls.splice(k,1);delete AUD[ln.id];S().changed();render();};
      if(ln._ed&&au)editor(d.querySelector(".edbox"),ln,w);
      box.appendChild(d);return;
    }
    d.innerHTML=`<div class="r"><b>${k+1}.</b> <select class="q">${speakers()}</select><span class="inf">${au?"🎙 voz de "+au.dur.toFixed(1)+" s":"sin voz todavía (los subtítulos igual se verán)"}</span></div>
    <textarea rows="2" placeholder="Escribe aquí lo que se dice…">${esc(ln.txt||"")}</textarea>
    <div class="r"><span>Empieza en</span><input class="t0" type="range" min="0" max="${Math.max(10,(w.dur||6))}" step=".1" value="${ln.t0}" style="width:140px"><b class="tv">${(+ln.t0).toFixed(1)}s</b></div>
    ${mixRow(ln)}
    <div class="r"><button class="rec">🎙 Grabar</button><button class="pl" ${au?"":"disabled"}>▶ Escuchar</button><button class="up">📁 Subir audio</button><button class="ed2" ${au?"":"disabled"}>✂ Editar voz</button><button class="ia" ${au?"":"disabled"} title="La IA escucha la voz y escribe el texto, sin internet">📝 Escribir con IA</button><button class="rh" ${au?"":"disabled"} title="Rhubarb: la IA mira el sonido y mueve mejor los labios">👄 Labios con IA</button><button class="xp" ${au?"":"disabled"}>⬇ Exportar</button><button class="un" ${ln._undo&&ln._undo.length?"":"disabled"}>↶ Voz anterior</button><button class="dv" ${au?"":"disabled"}>🗑 Quitar voz</button><button class="cp">⧉ Duplicar</button><button class="dl danger">✖ Quitar línea</button></div><div class="edbox"></div>`;
    const q=d.querySelector(".q");q.value=ln.quien||"";q.onchange=()=>{ln.quien=q.value;S().changed();};
    const ta=d.querySelector("textarea");ta.oninput=()=>{ln.txt=ta.value;S().changed();};
    const t0=d.querySelector(".t0");t0.oninput=()=>{ln.t0=+t0.value;d.querySelector(".tv").textContent=(+ln.t0).toFixed(1)+"s";S().changed();};
    bindMix(d,ln);d.querySelector(".rec").onclick=()=>startRec(ln);
    d.querySelector(".pl").onclick=()=>playLine(ln);
    d.querySelector(".up").onclick=()=>pickAudio(ln);
    d.querySelector(".ed2").onclick=()=>{ln._ed=!ln._ed;render();};
    d.querySelector(".xp").onclick=()=>window.DubX&&DubX.exportOne(ln,k);
    d.querySelector(".rh").onclick=async()=>{const m=$("dbRecMsg"),say=t=>{if(m)m.textContent=t;};try{const cues=await IA.rhubarb(au.buf,ln.txt,say);ln.rh=cues.map(c=>[+c.start.toFixed(3),+c.end.toFixed(3),c.value]);au._rh=0;S().changed();say("Listo: los labios de esta voz ahora siguen los sonidos ("+cues.length+" movimientos). Rhubarb está hecho para inglés; en español es aproximado.");}catch(e){say("⚠ "+e.message);}};
    d.querySelector(".ia").onclick=async()=>{const m=$("dbRecMsg"),say=t=>{if(m)m.textContent=t;};try{const r=await IA.transcribir(au.buf,"spanish",say);if(!r.texto||/^\[.*\]$/.test(r.texto)){say("No escuché palabras en esta voz.");return;}ln.txt=r.texto;S().changed();say("Listo: la IA escribió «"+r.texto.slice(0,60)+(r.texto.length>60?"…":"")+"». Revísalo, puede equivocarse.");render();}catch(e){say("⚠ "+e.message);}};
    d.querySelector(".un").onclick=async()=>{const u=ln._undo.pop();if(!u)return;await setAudio(ln.id,u);idbPut(ln.id,u);S().changed();render();};
    d.querySelector(".dv").onclick=()=>{pushUndo(ln);delete AUD[ln.id];ln.voz=false;S().changed();render();};
    d.querySelector(".cp").onclick=()=>{ls.splice(k+1,0,{id:newId(),txt:ln.txt||"",quien:ln.quien||"",t0:+(lineEnd(ln)+.3).toFixed(1)});S().changed();render();};
    d.querySelector(".dl").onclick=()=>{ls.splice(k,1);delete AUD[ln.id];S().changed();render();};
    if(ln._ed&&au)editor(d.querySelector(".edbox"),ln,w);
    box.appendChild(d);
  });
}
function playLine(ln){const au=AUD[ln.id];if(!au)return;stopListen();const a=ac();if(a.state==="suspended")a.resume();const s=a.createBufferSource();s.buffer=au.buf;s.connect(a.destination);s.start();listen=s;}
function wave(cv,au,a,b){
  const g=cv.getContext("2d"),W=cv.width,H=cv.height,d=au.buf.getChannelData(0),n=d.length;g.fillStyle="#12141c";g.fillRect(0,0,W,H);
  g.fillStyle="#7a5cff";
  for(let x=0;x<W;x++){const i0=Math.floor(x/W*n),i1=Math.max(i0+1,Math.floor((x+1)/W*n));let m=0;for(let i=i0;i<i1;i+=Math.max(1,Math.floor((i1-i0)/24)))m=Math.max(m,Math.abs(d[i]));const h=Math.max(1,m*H*.95);g.fillRect(x,(H-h)/2,1,h);}
  g.fillStyle="rgba(0,0,0,.55)";g.fillRect(0,0,a/au.dur*W,H);g.fillRect(b/au.dur*W,0,W-b/au.dur*W,H);
  g.fillStyle="#ffd23f";g.fillRect(a/au.dur*W,0,2,H);g.fillRect(b/au.dur*W-2,0,2,H);
}
function editor(host,ln,w){
  const au=AUD[ln.id],dur=au.dur;
  host.innerHTML=`<div style="background:#1b1e33;border-radius:10px;padding:8px;margin-top:8px">
  <canvas class="wf" width="640" height="72" style="width:100%;border-radius:8px"></canvas>
  <div class="r"><span style="min-width:80px">Inicio</span><input class="eA" type="range" min="0" max="${dur.toFixed(2)}" step=".01" value="0" style="width:200px"><b class="eAv">0.00s</b></div>
  <div class="r"><span style="min-width:80px">Final</span><input class="eB" type="range" min="0" max="${dur.toFixed(2)}" step=".01" value="${dur.toFixed(2)}" style="width:200px"><b class="eBv">${dur.toFixed(2)}s</b></div>
  <div class="r"><span style="min-width:80px">Volumen</span><input class="eG" type="range" min="-12" max="12" step="1" value="0" style="width:200px"><b class="eGv">0 dB</b></div>
  <div class="r"><span style="min-width:80px">Fundido</span>entrada <input class="eFi" type="range" min="0" max="1" step=".05" value="0" style="width:90px"> salida <input class="eFo" type="range" min="0" max="1" step=".05" value="0" style="width:90px"></div>
  <div class="r"><span style="min-width:80px">Tono</span><select class="eT"><option value="-6">Muy grave (monstruo)</option><option value="-3">Grave</option><option value="0" selected>Normal</option><option value="3">Agudo</option><option value="6">Muy agudo (ratoncito)</option></select><small style="opacity:.7">cambiar el tono también cambia la velocidad</small></div>
  <div class="r"><label><input type="checkbox" class="eN"> Normalizar (volumen parejo)</label><button class="eS">Recortar silencios</button><button class="eP">▶ Escuchar</button><button class="eOk pri">✔ Aplicar cambios</button><button class="eO">Restaurar original</button></div></div>`;
  const q=c=>host.querySelector(c),cv=q(".wf");
  const draw=()=>wave(cv,au,+q(".eA").value,+q(".eB").value);
  const upd=()=>{q(".eAv").textContent=(+q(".eA").value).toFixed(2)+"s";q(".eBv").textContent=(+q(".eB").value).toFixed(2)+"s";q(".eGv").textContent=q(".eG").value+" dB";draw();};
  const opts=()=>({trimA:+q(".eA").value,trimB:Math.max(+q(".eB").value,+q(".eA").value+.05),gainDb:+q(".eG").value,fadeIn:+q(".eFi").value,fadeOut:+q(".eFo").value,semi:+q(".eT").value,normalize:q(".eN").checked});
  ["eA","eB","eG"].forEach(c=>q("."+c).oninput=upd);
  q(".eS").onclick=()=>{const [a,b]=DubFX.silenceBounds(au.buf);q(".eA").value=a;q(".eB").value=b;upd();};
  q(".eP").onclick=()=>{stopListen();const r=DubFX.process(au.buf,opts()),a=ac();if(a.state==="suspended")a.resume();const b=a.createBuffer(1,r.data.length,r.sr);b.copyToChannel(r.data,0);const s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start();listen=s;};
  q(".eOk").onclick=async()=>{
    const r=DubFX.process(au.buf,opts());pushUndo(ln);
    const d=await blobToDataURL(new Blob([DubX.wavBytes([r.data],r.sr)],{type:"audio/wav"}));
    await setAudio(ln.id,d);idbPut(ln.id,d);const end=ln.t0+AUD[ln.id].dur+.3;if(end>(w.dur||6))w.dur=Math.min(120,Math.ceil(end));
    S().changed();render();S().say("Voz editada.");};
  q(".eO").onclick=async()=>{if(!ln._orig){S().say("Esta voz aún no tiene cambios.");return;}pushUndo(ln);await setAudio(ln.id,ln._orig);idbPut(ln.id,ln._orig);S().changed();render();};
  draw();
}
function pickAudio(ln){
  const f=document.createElement("input");f.type="file";f.accept="audio/*";
  f.onchange=async()=>{const file=f.files[0];if(!file)return;try{await attach(ln,file);ln.voz=true;S().say("Voz agregada.");}catch(e){S().say("No pude leer ese audio.");}render();};
  f.click();
}
/* ---------- cabina: grabar mirando el video, con subtítulos y teleprompter ---------- */
function cabCss(){
  if($("cabCss"))return;const st=document.createElement("style");st.id="cabCss";
  st.textContent=`#cabina{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);width:min(760px,94vw);background:#12141cf5;border:1px solid #3a4064;border-radius:16px;padding:12px 16px;z-index:60;box-shadow:0 10px 40px #000a;text-align:center}
  #cabina .cbTop{display:flex;justify-content:space-between;gap:10px;font-size:13px;opacity:.9;margin-bottom:6px}
  #cabina .cbTxt{font-size:24px;font-weight:800;line-height:1.45;max-height:112px;overflow:auto;padding:2px 6px}#cabina .cbTxt span{opacity:.45}#cabina .cbTxt span.on{opacity:1;color:#ffd23f}#cabina .cbTxt span.done{opacity:1}
  #cabina .cbCd{font-size:54px;font-weight:900;color:#ffb347;line-height:1.1}#cabina .cbBar{background:#242842;border-radius:8px;height:10px;overflow:hidden;margin:8px auto;max-width:420px}
  #cabina .cbBar div{height:100%;width:0;background:linear-gradient(90deg,#3fbf5a,#f4c83a,#e0382f)}#cabina .cbBtns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px}
  #cabina .cbBtns button{padding:9px 16px;border-radius:10px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#2c3150;color:#fff}#cabina .cbBtns .go{background:#c0392b}#cabina .cbBtns .ok{background:#2e9e57}`;
  document.head.appendChild(st);
}
let cabEl=null;
function cabHide(){if(cabEl){cabEl.remove();cabEl=null;}}
async function startRec(ln){
  if(!ln.txt||!ln.txt.trim()){S().say("Primero escribe el texto que vas a decir.");return;}
  if(!navigator.mediaDevices||!window.MediaRecorder){S().say("Este navegador no puede grabar. Usa «Subir audio».");return;}
  if(testStream){testStream.getTracks().forEach(t=>t.stop());testStream=null;if(stopMeter)stopMeter();}
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia(audioOpts());}
  catch(e){S().say("No pude usar el micrófono (puede estar bloqueado en este visor). Puedes usar «Subir audio» o la versión de escritorio.");return;}
  cabCss();cabHide();
  const P=S().proj,w=P.mundos[P.mundo],ls=lines(w),k=ls.indexOf(ln);
  if(S().playing)S().stopPlay();
  if(dlg)dlg.hidden=true;                       /* la ventana se esconde: el escenario queda a la vista */
  const from=Math.max(0,+(ln.t0-1.5).toFixed(2));
  cabEl=document.createElement("div");cabEl.id="cabina";document.body.appendChild(cabEl);
  rec={ln,stream,cancel:false,mr:null,chunks:[],timers:[],from};
  const ws=ln.txt.trim().split(/\s+/);
  const paint=(on,cd,estado)=>{cabEl.innerHTML=`<div class="cbTop"><b>🎙 Cabina · línea ${k+1} de ${ls.length}</b><span>${estado||""}</span></div>`+(cd?`<div class="cbCd">${cd}</div>`:"")+
    `<div class="cbTxt">${ws.map((x,i)=>`<span class="${i<on?"done":i===on?"on":""}">${esc(x)}</span>`).join(" ")}</div><div class="cbBar"><div id="cbLvl"></div></div>`+
    `<div class="cbBtns">${cd?'<button id="cbCan">Cancelar</button>':'<button id="cbStop" class="go">⏹ Terminé</button><button id="cbCan">Cancelar</button>'}</div>`;
    const c=$("cbCan");if(c)c.onclick=cancelRec;const sp=$("cbStop");if(sp)sp.onclick=finishRec;};
  const at=ms=>new Promise(r=>{const t=setTimeout(r,ms);rec.timers.push(t);});
  if(window.Serie)Serie.setT(Math.min(from,w.dur));            /* el escenario se queda en el cuadro de partida */
  for(const c of [3,2,1]){if(!rec||rec.cancel)return;paint(-1,c,"Mira la escena y prepárate");await at(900);}
  if(!rec||rec.cancel)return;
  const mr=new MediaRecorder(stream);rec.mr=mr;mr.ondataavailable=e=>{if(e.data.size)rec.chunks.push(e.data);};
  mr.onstop=async()=>{
    const r=rec;stream.getTracks().forEach(t=>t.stop());if(r&&r.stopMeter)r.stopMeter();clearInterval(r&&r.iv);recId=null;if(S().playing)S().stopPlay();
    if(!r||r.cancel){rec=null;return;}
    rec=null;cabEl&&(cabEl.innerHTML='<div class="cbCd" style="font-size:24px">Procesando tu voz…</div>');
    try{ln.t0=r.from;await attach(ln,new Blob(r.chunks,{type:mr.mimeType||"audio/webm"}));ln.voz=true;words(ln);cabDone(ln,r.from);}
    catch(e){S().say("No pude procesar la grabación.");cabHide();if(dlg){dlg.hidden=false;render();}}
  };
  recId=ln.id;words(ln);mr.start();
  const t0=performance.now();paint(0,0,"● Grabando · lee cuando aparezca el texto en el video");rec.stopMeter=meter(stream,"cbLvl");
  S().playFrom(from);
  rec.iv=setInterval(()=>{
    if(!rec||rec.mr!==mr){clearInterval(rec&&rec.iv);return;}
    if(!S().playing){finishRec();return;}                       /* terminó la escena: se corta sola */
    const t=from+(performance.now()-t0)/1000,wl=words(ln);let idx=-1;for(let i=0;i<wl.length;i++)if(t>=wl[i].t0)idx=i;
    const sp=cabEl&&cabEl.querySelectorAll(".cbTxt span");if(sp)sp.forEach((e,i)=>{e.className=i<idx?"done":i===idx?"on":"";});
  },70);
}
function cabDone(ln,from){
  const P=S().proj,w=P.mundos[P.mundo],ls=lines(w),k=ls.indexOf(ln),au=AUD[ln.id],sig=ls.slice(k+1).find(x=>!x.sfx&&x.txt&&x.txt.trim()&&!AUD[x.id]);
  cabEl.innerHTML=`<div class="cbTop"><b>✅ Línea ${k+1} grabada</b><span>${au?au.dur.toFixed(1)+" s de voz":""}</span></div><div class="cbTxt" style="font-size:18px">${esc(ln.txt)}</div>
  <div class="cbBtns"><button id="cbVer" class="go">▶ Ver con video</button><button id="cbRep">🔁 Repetir toma</button>${sig?'<button id="cbSig" class="ok">➡ Grabar siguiente línea</button>':""}<button id="cbFin" class="ok">✔ Listo</button></div>`;
  $("cbVer").onclick=()=>{if(S().playing)S().stopPlay();S().playFrom(Math.max(0,from));};
  $("cbRep").onclick=()=>{if(S().playing)S().stopPlay();const u=(ln._undo||[]).pop();(async()=>{if(u){await setAudio(ln.id,u);idbPut(ln.id,u);}else{delete AUD[ln.id];ln.voz=false;}S().changed();startRec(ln);})();};
  if(sig)$("cbSig").onclick=()=>{if(S().playing)S().stopPlay();startRec(sig);};
  $("cbFin").onclick=()=>{if(S().playing)S().stopPlay();cabHide();S().changed();if(dlg){dlg.hidden=false;render();}};
}
function finishRec(){if(rec&&rec.mr&&rec.mr.state==="recording")rec.mr.stop();}
function cancelRec(){if(!rec)return;rec.cancel=true;clearInterval(rec.iv);rec.timers.forEach(clearTimeout);try{if(rec.mr&&rec.mr.state==="recording")rec.mr.stop();}catch(e){}rec.stream.getTracks().forEach(t=>t.stop());if(rec.stopMeter)rec.stopMeter();rec=null;recId=null;if(S().playing)S().stopPlay();cabHide();if(dlg){dlg.hidden=false;render();}}

window.Dub={newId,begin,tick,stop,drawSub,dump,load,restore,mixdown,hasAudio,open:openDlg,lines:w=>lines(w),AUD,ac,setAudio,attach,words,lineEnd,offsetOf,idbPut,pushUndo,style:sub,SUBDEF,state:()=>state};
function init(){$("bDub").onclick=openDlg;restore();}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
