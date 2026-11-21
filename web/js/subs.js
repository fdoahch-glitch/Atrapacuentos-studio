/* Panel de subtítulos: se activan o desactivan, se diseñan (letra, tamaño, colores, contorno, sombra, fondo, posición)
   y se pueden sacar como archivo .srt / .vtt. Se dibujan igual en la vista previa y dentro del MP4. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const S=()=>window.Studio,D=()=>window.Dub;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FONTS={
  redondo:["Redondeada","'Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif"],
  clasica:["Clásica (Arial)","Arial,Helvetica,sans-serif"],
  comic:["Divertida (Comic)","'Comic Sans MS','Chalkboard SE','Comic Neue',cursive"],
  impacto:["Impacto","Impact,'Arial Black',sans-serif"],
  serif:["Con serifa (Georgia)","Georgia,'Times New Roman',serif"],
  verdana:["Verdana","Verdana,Geneva,sans-serif"],
  trebuchet:["Trebuchet","'Trebuchet MS',Tahoma,sans-serif"],
  mono:["Máquina de escribir","'Courier New',monospace"]
};
const PRESETS={
  clasico:["Clásico",{font:"clasica",bold:true,italic:false,upper:false,col:"#ffffff",hi:"#ffd23f",hiMode:"color",outline:true,outCol:"#000000",outW:14,shadow:false,bg:false,size:6}],
  infantil:["Infantil",{font:"comic",bold:true,italic:false,upper:false,col:"#ffffff",hi:"#ff5fa2",hiMode:"color",outline:true,outCol:"#3b2a8c",outW:22,shadow:true,bg:false,size:7.5}],
  cine:["Cine",{font:"serif",bold:false,italic:false,upper:false,col:"#f5f0e0",hi:"#f5f0e0",hiMode:"ninguno",outline:false,outCol:"#000000",outW:10,shadow:true,bg:false,size:5.2}],
  karaoke:["Karaoke",{font:"redondo",bold:true,italic:false,upper:true,col:"#ffffff",hi:"#7a5cff",hiMode:"caja",outline:true,outCol:"#000000",outW:12,shadow:false,bg:true,bgCol:"#000000",bgOp:55,size:6.5}],
  neon:["Neón",{font:"impacto",bold:false,italic:false,upper:true,col:"#9ff9ff",hi:"#ffe14a",hiMode:"color",outline:true,outCol:"#0a1a4a",outW:16,shadow:true,bg:false,size:6.5}]
};
const family=o=>o.font==="mia"&&o.fontSrc?"'AtrFont',sans-serif":(FONTS[o.font]||FONTS.redondo)[1];

/* ---------- dibujo (vista previa y MP4) ---------- */
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function render(g,W,H,words,idx,o){
  if(!words||!words.length)return;
  const fs=Math.max(8,Math.round(H*o.size/100));
  g.save();
  g.font=(o.italic?"italic ":"")+(o.bold?"800 ":"500 ")+fs+"px "+family(o);g.textBaseline="alphabetic";
  const T=w=>o.upper?w.toUpperCase():w;
  const maxW=W*(o.maxW||86)/100,sp=g.measureText(" ").width,rows=[];let row=[],rw=0;
  words.forEach((x,i)=>{const t=T(x.w),mw=g.measureText(t).width;if(row.length&&rw+sp+mw>maxW){rows.push({row,rw});row=[];rw=0;}rw+=(row.length?sp:0)+mw;row.push({t,i,mw});});
  rows.push({row,rw});
  const lh=fs*(o.sepLine||1.3),bh=rows.length*lh+fs*.5;
  let top=o.pos==="arriba"?H*.06:o.pos==="centro"?(H-bh)/2:H*.94-bh;
  top+=H*(o.off||0)/100;
  if(o.bg){
    const bw=Math.max(...rows.map(r=>r.rw))+fs*1.2,x=(W-bw)/2;
    g.globalAlpha=(o.bgOp==null?50:o.bgOp)/100;g.fillStyle=o.bgCol||"#000";rrect(g,x,top,bw,bh,fs*.4);g.fill();g.globalAlpha=1;
  }
  g.lineJoin="round";
  rows.forEach((r,ri)=>{
    let x=(W-r.rw)/2;const y=top+fs*.25+lh*ri+fs;
    for(const c of r.row){
      const on=c.i===idx;
      if(on&&o.hiMode==="caja"){g.fillStyle=o.hi;rrect(g,x-fs*.12,y-fs*.95,c.mw+fs*.24,fs*1.2,fs*.25);g.fill();}
      if(o.shadow){g.shadowColor="rgba(0,0,0,.75)";g.shadowBlur=fs*.18;g.shadowOffsetX=fs*.05;g.shadowOffsetY=fs*.07;}
      if(o.outline){g.lineWidth=Math.max(1.5,fs*(o.outW||14)/100);g.strokeStyle=o.outCol||"#000";g.strokeText(c.t,x,y);}
      g.shadowColor="transparent";
      g.fillStyle=on?(o.hiMode==="caja"?"#ffffff":o.hiMode==="ninguno"?o.col:o.hi):o.col;
      if(o.shadow&&!o.outline){g.shadowColor="rgba(0,0,0,.75)";g.shadowBlur=fs*.18;g.shadowOffsetX=fs*.05;g.shadowOffsetY=fs*.07;}
      g.fillText(c.t,x,y);g.shadowColor="transparent";
      x+=c.mw+sp;
    }
  });
  g.restore();
}

/* ---------- subtítulos como archivo ---------- */
function cues(){
  const out=[];let off=0;
  S().proj.mundos.forEach(w=>{
    D().lines(w).forEach(ln=>{
      if(!(ln.txt||"").trim())return;
      const ws=D().words(ln);if(!ws.length)return;
      let i=0;
      while(i<ws.length){
        let j=i,n=0;
        while(j<ws.length&&n<8){n++;if(/[.!?…]$/.test(ws[j].w)&&n>=3){j++;break;}j++;}
        if(ws.length-j===1)j=ws.length;
        const seg=ws.slice(i,j);
        out.push({t0:off+seg[0].t0,t1:off+seg[seg.length-1].t1+.05,txt:seg.map(x=>x.w).join(" ")});
        i=j;
      }
    });
    off+=(w.dur||6);
  });
  out.sort((a,b)=>a.t0-b.t0);
  for(let k=0;k<out.length-1;k++)if(out[k].t1>out[k+1].t0)out[k].t1=Math.max(out[k].t0+.3,out[k+1].t0-.02);
  return out;
}
const tc=(t,sep)=>{t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),ms=Math.round((t%1)*1000);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")+sep+String(ms).padStart(3,"0");};
const nm=()=>((S().proj.nombre||"mi-cuento").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w -]/g,"").trim()||"mi-cuento").replace(/\s+/g,"-");
function srt(){return cues().map((c,i)=>(i+1)+"\r\n"+tc(c.t0,",")+" --> "+tc(c.t1,",")+"\r\n"+c.txt+"\r\n").join("\r\n");}
function vtt(){return "WEBVTT\r\n\r\n"+cues().map(c=>tc(c.t0,".")+" --> "+tc(c.t1,".")+"\r\n"+c.txt+"\r\n").join("\r\n");}
function save(text,name,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}
function downloadSrt(){if(!cues().length){S().say("Aún no hay textos para los subtítulos.");return;}save(srt(),nm()+".srt","application/x-subrip");}
function parseCues(txt){
  const out=[],blocks=txt.replace(/\r/g,"").replace(/^﻿/,"").split(/\n\s*\n/);
  const rx=/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/,rx2=/(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+)[,.](\d+)/;
  for(const b of blocks){
    const ls=b.split("\n"),k=ls.findIndex(l=>rx.test(l)||rx2.test(l));if(k<0)continue;
    let a,e,m=ls[k].match(rx);
    if(m){a=+m[1]*3600+ +m[2]*60+ +m[3]+ +("0."+m[4]);e=+m[5]*3600+ +m[6]*60+ +m[7]+ +("0."+m[8]);}
    else{m=ls[k].match(rx2);a=+m[1]*60+ +m[2]+ +("0."+m[3]);e=+m[4]*60+ +m[5]+ +("0."+m[6]);}
    const t=ls.slice(k+1).join(" ").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    if(t)out.push({t0:a,t1:e,txt:t});
  }
  return out;
}
function importCues(list){
  const P=S().proj;let n=0;
  /* se reemplazan los textos que no tienen voz; las líneas con voz grabada se conservan */
  P.mundos.forEach(w=>{w.lineas=(w.lineas||[]).filter(l=>D().AUD[l.id]);});
  let off=0;const starts=P.mundos.map(w=>{const o=off;off+=(w.dur||6);return o;});
  for(const c of list){
    let si=starts.length-1;for(let i=0;i<starts.length;i++){if(c.t0<starts[i]+(P.mundos[i].dur||6)){si=i;break;}}
    const w=P.mundos[si];(w.lineas||(w.lineas=[])).push({id:"l"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),txt:c.txt,quien:"",t0:+Math.max(0,c.t0-starts[si]).toFixed(2)});n++;
  }
  S().changed();return n;
}

/* ---------- tipografía propia ---------- */
function loadFont(o){
  if(!o.fontSrc)return Promise.resolve();
  try{const f=new FontFace("AtrFont","url("+o.fontSrc+")");return f.load().then(ff=>{document.fonts.add(ff);});}catch(e){return Promise.resolve();}
}
function style(){const P=S().proj;P.sub=Object.assign({},D().SUBDEF,P.sub||{});return P.sub;}

/* ---------- ventana ---------- */
let box=null,tab="d",pvT=null,pvI=0;
function css(){
  if($("sbxCss"))return;const st=document.createElement("style");st.id="sbxCss";
  st.textContent=`#sbxBox .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:820px){#sbxBox .grid{grid-template-columns:1fr}}
  #sbxBox .row{display:flex;gap:8px;align-items:center;margin:5px 0;flex-wrap:wrap}#sbxBox .row>span{min-width:112px;font-size:13px}
  #sbxBox select,#sbxBox input[type=number]{background:#12141c;color:#fff;border:1px solid #3a4064;border-radius:8px;padding:5px}
  #sbxBox .tabs{display:flex;gap:6px;margin:8px 0}#sbxBox .tabs button.on{background:#7a5cff}
  #sbxBox .ln{background:#242842;border-radius:10px;padding:8px;margin:6px 0}#sbxBox .ln textarea{width:100%;background:#12141c;color:#fff;border:1px solid #3a4064;border-radius:8px;padding:6px;font:inherit;resize:vertical}
  #sbxBox .chipb{display:inline-block;padding:5px 11px;border-radius:999px;background:#2a2f4f;cursor:pointer;margin:2px;font-size:13px}`;
  document.head.appendChild(st);
}
function shell(){
  css();box=document.createElement("div");box.id="sbxBox";box.className="modal";
  box.innerHTML=`<div class="mbox" style="max-width:940px"><h2>💬 Subtítulos</h2>
  <div class="row"><label><input type="checkbox" id="sbxOn"> Mostrar subtítulos en la vista previa</label>
  <label><input type="checkbox" id="sbxBurn"> Dentro del video exportado</label></div>
  <div class="tabs"><button id="sbxTD" class="on">🎨 Diseño</button><button id="sbxTT">✏️ Textos</button><button id="sbxTA">📄 Archivo .srt</button></div>
  <div id="sbxD" class="grid"><div id="sbxCtl"></div><div><canvas id="sbxCv" width="480" height="270" style="width:100%;border-radius:12px;background:#222"></canvas><small style="opacity:.7">Así se verá. La palabra marcada cambia sola.</small></div></div>
  <div id="sbxT" hidden></div>
  <div id="sbxA" hidden></div>
  <div class="wnav"><button id="sbxX">Cerrar</button></div></div>`;
  document.body.appendChild(box);
  $("sbxX").onclick=close;
  $("sbxOn").onchange=e=>{style().on=e.target.checked;S().changed();};
  $("sbxBurn").onchange=e=>{style().burn=e.target.checked;S().changed();};
  for(const [id,t] of [["sbxTD","d"],["sbxTT","t"],["sbxTA","a"]])$(id).onclick=()=>{tab=t;view();};
}
function close(){clearInterval(pvT);pvT=null;if(box)box.hidden=true;}
function field(lbl,html){return `<div class="row"><span>${lbl}</span>${html}</div>`;}
function ctl(){
  const o=style(),c=$("sbxCtl");
  const sel=(id,list,v)=>`<select id="${id}">`+list.map(([k,n])=>`<option value="${k}" ${k===v?"selected":""}>${n}</option>`).join("")+`</select>`;
  const fl=Object.keys(FONTS).map(k=>[k,FONTS[k][0]]);if(o.fontSrc)fl.push(["mia","Mi tipografía"]);
  c.innerHTML=`<div>`+Object.keys(PRESETS).map(k=>`<span class="chipb" data-p="${k}">${PRESETS[k][0]}</span>`).join("")+`</div>`+
   field("Letra",sel("sbxFont",fl,o.font)+` <button id="sbxFontUp">📁 Usar mi letra</button>`)+
   field("Tamaño",`<input type="range" id="sbxSize" min="3" max="14" step=".5" value="${o.size}"><b id="sbxSizeT">${o.size}</b>`)+
   field("Estilo",`<label><input type="checkbox" id="sbxBold" ${o.bold?"checked":""}> Negrita</label><label><input type="checkbox" id="sbxIt" ${o.italic?"checked":""}> Cursiva</label><label><input type="checkbox" id="sbxUp" ${o.upper?"checked":""}> MAYÚSCULAS</label>`)+
   field("Color del texto",`<input type="color" id="sbxCol" value="${o.col}">`)+
   field("Palabra que se dice",`<input type="color" id="sbxHi" value="${o.hi}">`+sel("sbxHm",[["color","Cambia de color"],["caja","En una caja"],["ninguno","Sin resaltar"]],o.hiMode))+
   field("Contorno",`<input type="checkbox" id="sbxOut" ${o.outline?"checked":""}><input type="color" id="sbxOc" value="${o.outCol}"><input type="range" id="sbxOw" min="4" max="30" value="${o.outW}" style="width:90px">`)+
   field("Sombra",`<input type="checkbox" id="sbxSh" ${o.shadow?"checked":""}>`)+
   field("Fondo",`<input type="checkbox" id="sbxBg" ${o.bg?"checked":""}><input type="color" id="sbxBc" value="${o.bgCol}"><input type="range" id="sbxBo" min="0" max="100" value="${o.bgOp}" style="width:90px">`)+
   field("Posición",sel("sbxPos",[["abajo","Abajo"],["centro","Centro"],["arriba","Arriba"]],o.pos))+
   field("Subir / bajar",`<input type="range" id="sbxOff" min="-25" max="25" value="${o.off}">`)+
   field("Ancho del texto",`<input type="range" id="sbxMw" min="40" max="95" value="${o.maxW}">`)+
   field("Espacio entre líneas",`<input type="range" id="sbxLh" min="10" max="20" value="${Math.round(o.sepLine*10)}">`)+
   `<div class="row"><button id="sbxReset">↺ Volver al estilo inicial</button></div>`;
  const set=(k,v)=>{style()[k]=v;S().changed();draw();};
  c.querySelectorAll(".chipb").forEach(b=>b.onclick=()=>{Object.assign(style(),PRESETS[b.dataset.p][1]);S().changed();ctl();draw();});
  const bind=(id,k,ev,get)=>{const e=$(id);e[ev]=()=>{const v=get(e);if(id==="sbxSize")$("sbxSizeT").textContent=v;set(k,v);};};
  bind("sbxFont","font","onchange",e=>e.value);bind("sbxSize","size","oninput",e=>+e.value);
  bind("sbxBold","bold","onchange",e=>e.checked);bind("sbxIt","italic","onchange",e=>e.checked);bind("sbxUp","upper","onchange",e=>e.checked);
  bind("sbxCol","col","oninput",e=>e.value);bind("sbxHi","hi","oninput",e=>e.value);bind("sbxHm","hiMode","onchange",e=>e.value);
  bind("sbxOut","outline","onchange",e=>e.checked);bind("sbxOc","outCol","oninput",e=>e.value);bind("sbxOw","outW","oninput",e=>+e.value);
  bind("sbxSh","shadow","onchange",e=>e.checked);bind("sbxBg","bg","onchange",e=>e.checked);bind("sbxBc","bgCol","oninput",e=>e.value);bind("sbxBo","bgOp","oninput",e=>+e.value);
  bind("sbxPos","pos","onchange",e=>e.value);bind("sbxOff","off","oninput",e=>+e.value);bind("sbxMw","maxW","oninput",e=>+e.value);bind("sbxLh","sepLine","oninput",e=>e.value/10);
  $("sbxFontUp").onclick=()=>{const f=document.createElement("input");f.type="file";f.accept=".ttf,.otf,.woff,.woff2";
    f.onchange=()=>{const file=f.files[0];if(!file)return;const fr=new FileReader();fr.onload=async()=>{const o=style();o.fontSrc=fr.result;o.font="mia";try{await loadFont(o);}catch(e){}S().changed();ctl();draw();S().say("Letra «"+file.name+"» lista.");};fr.readAsDataURL(file);};f.click();};
  $("sbxReset").onclick=()=>{const P=S().proj,keep={on:P.sub.on,burn:P.sub.burn};P.sub=Object.assign({},D().SUBDEF,keep);S().changed();ctl();draw();};
}
function draw(){
  const c=$("sbxCv");if(!c)return;const g=c.getContext("2d"),W=c.width,H=c.height;
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#6fb8ff");gr.addColorStop(.62,"#bfe3ff");gr.addColorStop(.62,"#5ea84a");gr.addColorStop(1,"#3f7f35");g.fillStyle=gr;g.fillRect(0,0,W,H);
  const ws="Había una vez un cuento muy bonito".split(" ").map((w,i)=>({w,t0:i,t1:i+1}));
  render(g,W,H,ws,pvI%ws.length,style());
}
function textsView(){
  const P=S().proj,t=$("sbxT");let h=`<p style="font-size:13px;opacity:.85">Aquí editas lo que dicen los subtítulos. Son los mismos textos del doblaje: si cambias uno aquí, cambia allá.</p>`;
  P.mundos.forEach((w,si)=>{
    h+=`<h4 style="margin:10px 0 2px">${si+1}. ${esc(w.nombre||"")}</h4>`;
    const ls=D().lines(w);
    if(!ls.length)h+=`<p style="opacity:.6;font-size:12px;margin:2px 0">Sin textos.</p>`;
    ls.forEach((ln,li)=>{if(ln.sfx)return;h+=`<div class="ln" data-s="${si}" data-l="${li}"><div class="row"><span>Empieza en</span><input type="number" class="t0" min="0" step=".1" value="${(+ln.t0).toFixed(1)}" style="width:70px"> s ${D().AUD[ln.id]?'<small>(con voz: el tiempo sigue a la voz)</small>':""}<button class="del danger" style="margin-left:auto">✖</button></div><textarea rows="2">${esc(ln.txt||"")}</textarea></div>`;});
    h+=`<button class="add" data-s="${si}">➕ Agregar texto a esta escena</button>`;
  });
  t.innerHTML=h;
  t.querySelectorAll(".ln").forEach(d=>{const w=P.mundos[+d.dataset.s],ln=D().lines(w)[+d.dataset.l];
    d.querySelector("textarea").oninput=e=>{ln.txt=e.target.value;S().changed();};
    d.querySelector(".t0").oninput=e=>{ln.t0=Math.max(0,+e.target.value||0);S().changed();};
    d.querySelector(".del").onclick=()=>{const a=D().lines(w);a.splice(+d.dataset.l,1);delete D().AUD[ln.id];S().changed();textsView();};});
  t.querySelectorAll(".add").forEach(b=>b.onclick=()=>{const w=P.mundos[+b.dataset.s],a=D().lines(w),last=a[a.length-1];a.push({id:"l"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),txt:"",quien:"",t0:last?+(D().lineEnd(last)+.3).toFixed(1):.5});S().changed();textsView();});
}
function fileView(){
  const a=$("sbxA"),n=cues().length;
  a.innerHTML=`<p>Los subtítulos como archivo aparte sirven para YouTube y otros programas. Ahora tienes <b>${n}</b> subtítulo${n===1?"":"s"}.</p>
  <div class="row"><button id="sbxSrt" class="pri">⬇ Exportar .srt</button><button id="sbxVtt">⬇ Exportar .vtt</button><button id="sbxImp">⬆ Importar .srt / .vtt</button></div>
  <p id="sbxMsg" style="font-size:12px;opacity:.85"></p>
  <small style="opacity:.7">Al importar, los textos sin voz se reemplazan; las líneas con voz grabada se conservan.<br>Consejo: puedes desactivar «Dentro del video exportado» y subir el .srt a YouTube, así los espectadores pueden activarlos o elegir idioma.</small>`;
  $("sbxSrt").onclick=downloadSrt;
  $("sbxVtt").onclick=()=>{if(!cues().length){S().say("Aún no hay textos.");return;}save(vtt(),nm()+".vtt","text/vtt");};
  $("sbxImp").onclick=()=>{const f=document.createElement("input");f.type="file";f.accept=".srt,.vtt,text/plain";
    f.onchange=async()=>{const file=f.files[0];if(!file)return;const list=parseCues(await file.text());$("sbxMsg").textContent=list.length?"Importé "+importCues(list)+" subtítulos.":"No encontré subtítulos en ese archivo.";fileView2();};f.click();};
}
function fileView2(){const m=$("sbxMsg").textContent;fileView();$("sbxMsg").textContent=m;}
function view(){
  $("sbxD").hidden=tab!=="d";$("sbxT").hidden=tab!=="t";$("sbxA").hidden=tab!=="a";
  for(const [id,t] of [["sbxTD","d"],["sbxTT","t"],["sbxTA","a"]])$(id).classList.toggle("on",tab===t);
  if(tab==="d"){ctl();draw();}else if(tab==="t")textsView();else fileView();
}
function open(){
  if(!box)shell();const o=style();$("sbxOn").checked=o.on;$("sbxBurn").checked=o.burn!==false;
  box.hidden=false;view();clearInterval(pvT);pvT=setInterval(()=>{pvI++;if(tab==="d")draw();},650);
}
function restore(){const P=S().proj;if(P.sub&&P.sub.fontSrc)loadFont(P.sub).catch(()=>{});}
window.Subs={open,render,cues,srt,vtt,downloadSrt,restore};
function init(){const b=$("bSub");if(b)b.onclick=open;restore();}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
