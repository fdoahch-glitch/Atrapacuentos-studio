/* Dibujo cuadro a cuadro: capas (pintura y vectorial), pinceles, relleno, lazo, pluma Bézier, papel cebolla.
   Al guardar queda como imagen animada en «Mis imágenes». */
(function(){
"use strict";
const $=id=>document.getElementById(id),W=960,H=540;
let D=null,pv=0,ST=null;
const COLORS=["#222222","#e63946","#f4a261","#ffd60a","#2a9d8f","#3a86ff","#8338ec","#ff70a6","#ffffff","#8d5a2b"];
const mk=()=>{const c=document.createElement("canvas");c.width=W;c.height=H;return c;};
const LY=(n,t)=>t==="v"?{n,t:"v",sh:[],v:1,o:1}:{n,t:"r",c:mk(),v:1,o:1};
const FR=()=>({layers:[LY("Capa 1","r")],act:0});
const TOOLS=[["pincel","🖌","Pincel"],["borrar","🧽","Borrador"],["relleno","🪣","Relleno"],["lazo","➰","Lazo"],["pipeta","💧","Pipeta"],["pluma","✒️","Pluma (curvas)"],["linea","╱","Línea"],["rect","▭","Rectángulo"],["elipse","◯","Elipse"],["nodo","🔷","Editar vector"]];
const BRUSH=[["lapiz","Lápiz"],["rotu","Rotulador"],["suave","Pincel suave"],["acuarela","Acuarela"],["tiza","Tiza"],["spray","Spray"]];
const VT=new Set(["pluma","linea","rect","elipse","nodo"]);
const cur=()=>D.frames[D.i],lay=()=>cur().layers[cur().act];
/* ---------- deshacer ---------- */
function snap(l){if(l.t==="v")return JSON.stringify(l.sh);const c=mk();c.getContext("2d").drawImage(l.c,0,0);return c;}
function put(l,s){if(l.t==="v")l.sh=JSON.parse(s);else{const g=l.c.getContext("2d");g.clearRect(0,0,W,H);g.drawImage(s,0,0);}}
function push(){const l=lay();D.und.push({f:cur(),l,s:snap(l)});if(D.und.length>25)D.und.shift();D.red=[];}
function undo(){const e=D.und.pop();if(!e||!e.f.layers.includes(e.l))return;D.red.push({f:e.f,l:e.l,s:snap(e.l)});put(e.l,e.s);D.sel=null;D.shSel=null;paint();}
function redo(){const e=D.red.pop();if(!e||!e.f.layers.includes(e.l))return;D.und.push({f:e.f,l:e.l,s:snap(e.l)});put(e.l,e.s);paint();}
/* ---------- vector ---------- */
const N=(x,y)=>({x,y,ix:0,iy:0,ox:0,oy:0});
function pathOf(s){const p=new Path2D(),n=s.pts;if(!n.length)return p;p.moveTo(n[0].x,n[0].y);
  for(let i=1;i<n.length;i++){const a=n[i-1],b=n[i];p.bezierCurveTo(a.x+a.ox,a.y+a.oy,b.x+b.ix,b.y+b.iy,b.x,b.y);}
  if(s.closed&&n.length>2){const a=n[n.length-1],b=n[0];p.bezierCurveTo(a.x+a.ox,a.y+a.oy,b.x+b.ix,b.y+b.iy,b.x,b.y);p.closePath();}return p;}
function drawShape(g,s){const p=pathOf(s);if(s.fill&&s.closed){g.fillStyle=s.fill;g.fill(p);}if(s.stroke&&s.w>0){g.strokeStyle=s.stroke;g.lineWidth=s.w;g.lineCap="round";g.lineJoin="round";g.stroke(p);}}
function renderL(g,l){g.save();g.globalAlpha*=l.o;if(l.t==="r")g.drawImage(l.c,0,0);else for(const s of l.sh)drawShape(g,s);g.restore();}
function comp(f,g,skip){for(const l of f.layers){if(!l.v||l===skip)continue;renderL(g,l);}}
const ell=(x0,y0,x1,y1)=>{const cx=(x0+x1)/2,cy=(y0+y1)/2,rx=Math.abs(x1-x0)/2,ry=Math.abs(y1-y0)/2,k=.5523;
  const n=[N(cx,cy-ry),N(cx+rx,cy),N(cx,cy+ry),N(cx-rx,cy)];n[0].ox=rx*k;n[0].ix=-rx*k;n[1].oy=ry*k;n[1].iy=-ry*k;n[2].ox=-rx*k;n[2].ix=rx*k;n[3].oy=-ry*k;n[3].iy=ry*k;return n;};
function nuevaForma(pts,closed){return {pts,closed,stroke:D.col,fill:D.rell?D.fillCol:null,w:D.sz};}
/* ---------- pinceles ---------- */
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";}
function stamp(g,x,y,r,pr){
  const b=D.brush,col=D.col;
  if(D.tool==="borrar"){g.globalCompositeOperation="destination-out";const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(.7,"rgba(0,0,0,.9)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.globalCompositeOperation="source-over";return;}
  g.globalCompositeOperation="source-over";
  if(b==="suave"){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,rgba(col,.55*D.op));gr.addColorStop(.5,rgba(col,.3*D.op));gr.addColorStop(1,rgba(col,0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  else if(b==="acuarela"){const gr=g.createRadialGradient(x,y,0,x,y,r*1.2);gr.addColorStop(0,rgba(col,.09*D.op));gr.addColorStop(.8,rgba(col,.06*D.op));gr.addColorStop(1,rgba(col,0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r*1.2,0,7);g.fill();}
  else if(b==="spray"){g.fillStyle=rgba(col,.5*D.op);for(let i=0;i<Math.max(6,r*1.2);i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*r;g.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,1.6,1.6);}}
  else if(b==="tiza"){g.fillStyle=rgba(col,.8*D.op);for(let i=0;i<Math.max(8,r*1.6);i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*r;g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,Math.random()*1.7+.4,0,7);g.fill();}}
}
function stroke(a,b,pr){
  const g=lay().c.getContext("2d"),sz=D.sz*(pr==null?1:(.35+pr*1.3)),r=sz/2;
  if((D.tool==="pincel")&&(D.brush==="lapiz"||D.brush==="rotu")){g.globalCompositeOperation="source-over";g.lineCap="round";g.lineJoin="round";g.lineWidth=sz;g.strokeStyle=rgba(D.col,D.brush==="rotu"?.92*D.op:D.op);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0]+.01,b[1]);g.stroke();return;}
  const d=Math.hypot(b[0]-a[0],b[1]-a[1]),step=Math.max(1,r*(D.brush==="spray"||D.brush==="tiza"?.5:.18)),n=Math.max(1,Math.ceil(d/step));
  for(let i=1;i<=n;i++){const t=i/n;stamp(g,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,r,pr);}
}
/* ---------- relleno de bote de pintura ---------- */
function rellenar(x,y){
  x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;
  const src=document.createElement("canvas");src.width=W;src.height=H;const sg=src.getContext("2d");
  if(D.todas)comp(cur(),sg);else sg.drawImage(lay().c,0,0);
  const id=sg.getImageData(0,0,W,H),d=id.data,i0=(y*W+x)*4,r0=d[i0],g0=d[i0+1],b0=d[i0+2],a0=d[i0+3],tol=D.tol*4;
  const ok=i=>Math.abs(d[i]-r0)+Math.abs(d[i+1]-g0)+Math.abs(d[i+2]-b0)+Math.abs(d[i+3]-a0)<=tol;
  const m=new Uint8Array(W*H),st=[x,y];
  while(st.length){const yy=st.pop(),xx=st.pop();let l=xx;while(l>=0&&!m[yy*W+l]&&ok((yy*W+l)*4))l--;l++;let r=xx;while(r<W&&!m[yy*W+r]&&ok((yy*W+r)*4))r++;r--;
    for(let k=l;k<=r;k++){m[yy*W+k]=1;}
    for(const ny of [yy-1,yy+1]){if(ny<0||ny>=H)continue;let up=false;for(let k=l;k<=r;k++){const f=!m[ny*W+k]&&ok((ny*W+k)*4);if(f&&!up){st.push(k,ny);up=true;}else if(!f)up=false;}}}
  /* se agranda 2 px para que no queden halos blancos junto a la línea */
  const m2=new Uint8Array(m);for(let k=0;k<2;k++){const m3=new Uint8Array(m2);for(let yy=1;yy<H-1;yy++)for(let xx=1;xx<W-1;xx++){const i=yy*W+xx;if(!m2[i]&&(m2[i-1]||m2[i+1]||m2[i-W]||m2[i+W]))m3[i]=1;}m2.set(m3);}
  const lg=lay().c.getContext("2d"),ld=lg.getImageData(0,0,W,H),p=ld.data,c=parseInt(D.col.slice(1),16),cr=c>>16&255,cg=c>>8&255,cb=c&255;
  for(let i=0;i<W*H;i++)if(m2[i]){p[i*4]=cr;p[i*4+1]=cg;p[i*4+2]=cb;p[i*4+3]=255;}
  lg.putImageData(ld,0,0);
}
/* ---------- lazo ---------- */
function lazoPath(pts){const p=new Path2D();p.moveTo(pts[0][0],pts[0][1]);for(const q of pts)p.lineTo(q[0],q[1]);p.closePath();return p;}
function elevar(){ /* corta lo de adentro y lo deja flotando para moverlo */
  const s=D.sel;if(!s||s.c)return;push();const c=mk(),g=c.getContext("2d"),lg=lay().c.getContext("2d");g.save();g.clip(lazoPath(s.pts));g.drawImage(lay().c,0,0);g.restore();
  if(!s.copia){lg.save();lg.clip(lazoPath(s.pts));lg.clearRect(0,0,W,H);lg.restore();}s.c=c;s.dx=0;s.dy=0;}
function soltar(){const s=D.sel;if(!s)return;if(s.c){lay().c.getContext("2d").drawImage(s.c,s.dx,s.dy);}D.sel=null;paint();}
/* ---------- pantalla ---------- */
function abrir(){
  D={frames:[FR()],i:0,tool:"pincel",brush:"lapiz",col:"#222222",fillCol:"#ffd60a",rell:false,sz:6,op:1,tol:40,todas:true,onion:true,fps:8,nombre:"Mi dibujo",down:false,play:false,und:[],red:[],sel:null,shSel:null,draft:null};
  ST={};$("dibDlg").hidden=false;ui();
}
function cerrar(){stopPlay();if(D)soltar();$("dibDlg").hidden=true;document.removeEventListener("keydown",teclas);}
function css(){if($("dibCss"))return;const s=document.createElement("style");s.id="dibCss";s.textContent=`
#dibDlg .dz{display:grid;grid-template-columns:52px 1fr 210px;gap:10px}#dibDlg .tl{display:flex;flex-direction:column;gap:4px}#dibDlg .tl button{padding:8px 0;font-size:18px;width:100%}
#dibDlg .ly{background:#1c2036;border-radius:10px;padding:8px;font-size:12px;max-height:330px;overflow:auto}#dibDlg .ly .li{display:grid;grid-template-columns:22px 1fr auto;gap:4px;align-items:center;padding:4px;border-radius:7px;cursor:pointer}
#dibDlg .ly .li.on{background:#3a3270}#dibDlg .ly input[type=range]{width:100%}#dibDlg .opt{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px;font-size:12px}
#dibDlg .strip{display:flex;gap:6px;overflow:auto;margin-top:8px;padding:4px}#dibDlg .strip canvas{width:96px;height:54px;border:2px solid #0008;border-radius:6px;background:repeating-conic-gradient(#e8e8e8 0 25%,#fff 0 50%) 0 0/12px 12px;cursor:pointer;flex:none}#dibDlg .strip canvas.on{border-color:#ffb347}`;document.head.appendChild(s);}
function ui(){
  css();const m=$("dibDlg");
  m.innerHTML=`<div class="mbox" style="max-width:1240px"><h2>✏️ Dibujo cuadro a cuadro</h2>
  <div class="opt" id="dzOpt"></div>
  <div class="dz"><div class="tl">${TOOLS.map(([k,e,n])=>`<button data-t="${k}" title="${n}" class="${D.tool===k?"on":""}">${e}</button>`).join("")}</div>
  <div><div style="background:#0e1016;border-radius:10px;padding:6px;text-align:center"><canvas id="dCv" width="${W}" height="${H}" style="max-width:100%;touch-action:none;background:#fff;border-radius:6px"></canvas></div>
   <div class="btns" style="margin-top:8px;align-items:center"><button id="dUn">↶</button><button id="dRe">↷</button><button id="dPrev">◀</button><b id="dN"></b><button id="dNext">▶</button><button id="dAdd" class="pri">➕ Cuadro</button><button id="dDup">⧉ Copiar</button><button id="dDel">🗑 Quitar</button>
   <span style="margin-left:10px">Velocidad</span><input id="dFps" type="range" min="2" max="24" value="${D.fps}" style="width:90px"><b id="dFpsT">${D.fps}</b><button id="dPlay">▶ Ver</button><button id="dOn" class="${D.onion?"on":""}">🧅 Papel cebolla</button></div>
   <div class="strip" id="dStrip"></div></div>
  <div><div class="ly" id="dLy"></div><div class="btns" style="margin-top:6px"><button id="lyR">➕ Pintura</button><button id="lyV">➕ Vector</button><button id="lyU">⬆</button><button id="lyD">⬇</button><button id="lyX" class="danger">🗑</button><button id="lyM" title="Unir con la capa de abajo">⤓ Unir</button></div></div></div>
  <div class="wnav"><input id="dNom" type="text" value="${D.nombre}" style="width:190px"><button id="dSvg" title="Descarga solo las capas vectoriales de este cuadro">⬇ SVG</button><button id="dSave" class="go">Guardar en Mis imágenes</button><button id="dExit">Cerrar</button></div></div>`;
  m.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{soltar();D.tool=b.dataset.t;D.shSel=null;D.draft=null;ui();});
  $("dUn").onclick=undo;$("dRe").onclick=redo;
  $("dPrev").onclick=()=>irA(D.i-1);$("dNext").onclick=()=>irA(D.i+1);
  $("dAdd").onclick=()=>{soltar();const f=FR();f.layers=cur().layers.map(l=>l.t==="v"?{n:l.n,t:"v",sh:[],v:1,o:l.o}:{n:l.n,t:"r",c:mk(),v:1,o:l.o});f.act=cur().act;D.frames.splice(D.i+1,0,f);D.i++;ui();};
  $("dDup").onclick=()=>{soltar();const f={act:cur().act,layers:cur().layers.map(l=>l.t==="v"?{n:l.n,t:"v",sh:JSON.parse(JSON.stringify(l.sh)),v:l.v,o:l.o}:{n:l.n,t:"r",c:(()=>{const c=mk();c.getContext("2d").drawImage(l.c,0,0);return c;})(),v:l.v,o:l.o})};D.frames.splice(D.i+1,0,f);D.i++;ui();};
  $("dDel").onclick=()=>{soltar();if(D.frames.length<2)D.frames[0]=FR();else{D.frames.splice(D.i,1);D.i=Math.min(D.i,D.frames.length-1);}ui();};
  $("dFps").oninput=e=>{D.fps=+e.target.value;$("dFpsT").textContent=D.fps;};$("dPlay").onclick=()=>D.play?stopPlay():startPlay();$("dOn").onclick=()=>{D.onion=!D.onion;$("dOn").classList.toggle("on",D.onion);paint();};
  $("dNom").onchange=e=>{D.nombre=e.target.value||"Mi dibujo";};$("dSave").onclick=guardar;$("dExit").onclick=cerrar;$("dSvg").onclick=exportSvg;
  $("lyR").onclick=()=>{cur().layers.splice(cur().act+1,0,LY("Capa "+(cur().layers.length+1),"r"));cur().act++;ui();};
  $("lyV").onclick=()=>{cur().layers.splice(cur().act+1,0,LY("Vector "+(cur().layers.length+1),"v"));cur().act++;D.tool="pluma";ui();};
  $("lyU").onclick=()=>{const f=cur(),k=f.act;if(k<f.layers.length-1){[f.layers[k],f.layers[k+1]]=[f.layers[k+1],f.layers[k]];f.act++;ui();}};
  $("lyD").onclick=()=>{const f=cur(),k=f.act;if(k>0){[f.layers[k],f.layers[k-1]]=[f.layers[k-1],f.layers[k]];f.act--;ui();}};
  $("lyX").onclick=()=>{const f=cur();soltar();if(f.layers.length<2){f.layers[0]=LY("Capa 1","r");}else{f.layers.splice(f.act,1);f.act=Math.max(0,f.act-1);}ui();};
  $("lyM").onclick=()=>{const f=cur(),k=f.act;soltar();if(k<1||f.layers[k].t!=="r"||f.layers[k-1].t!=="r"){S2("Solo se pueden unir dos capas de pintura seguidas.");return;}push();const g=f.layers[k-1].c.getContext("2d");g.globalAlpha=f.layers[k].o;g.drawImage(f.layers[k].c,0,0);f.layers.splice(k,1);f.act=k-1;ui();};
  opciones();capas();tira();enlazar();paint();
}
const S2=t=>{if(window.Serie)Serie.say(t);};
function opciones(){
  const o=$("dzOpt"),t=D.tool,palette=COLORS.map(c=>`<button data-c="${c}" style="width:22px;height:22px;padding:0;background:${c};border:2px solid ${D.col===c?"#fff":"#0008"}"></button>`).join("");
  let h=palette+`<input id="dCol" type="color" value="${D.col}" title="Color">`;
  if(t==="pincel")h+=`<select id="dBr">${BRUSH.map(([k,n])=>`<option value="${k}" ${D.brush===k?"selected":""}>${n}</option>`).join("")}</select>`;
  if(t==="pincel"||t==="borrar"||VT.has(t))h+=`<span>Grosor</span><input id="dSz" type="range" min="1" max="80" value="${D.sz}" style="width:100px"><b id="dSzT">${D.sz}</b>`;
  if(t==="pincel")h+=`<span>Fuerza</span><input id="dOp" type="range" min="10" max="100" value="${Math.round(D.op*100)}" style="width:80px">`;
  if(t==="relleno")h+=`<span>Tolerancia</span><input id="dTol" type="range" min="0" max="120" value="${D.tol}" style="width:90px"><label><input id="dTod" type="checkbox" ${D.todas?"checked":""}> Mirar todas las capas</label>`;
  if(VT.has(t)&&t!=="nodo")h+=`<label><input id="dRell" type="checkbox" ${D.rell?"checked":""}> Relleno</label><input id="dFc" type="color" value="${D.fillCol}">`;
  if(t==="nodo")h+=`<label><input id="dRell" type="checkbox" ${D.shSel&&D.shSel.fill?"checked":""}> Relleno</label><input id="dFc" type="color" value="${D.fillCol}"><button id="dShDel">🗑 Borrar forma</button><button id="dShUp">⬆ Al frente</button><button id="dShRd">◠ Suavizar curva</button>`;
  if(t==="pluma")h+=`<button id="dPlOk" class="pri">✔ Terminar</button><label><input id="dPlCl" type="checkbox"> Cerrar</label><small>Clic = punto · arrastra = curva</small>`;
  if(t==="lazo")h+=`<button id="dLzMv">✋ Mover</button><button id="dLzCp">⧉ Copiar</button><button id="dLzDel">🗑 Borrar</button><button id="dLzFl">🪣 Rellenar</button><button id="dLzOk">✔ Soltar</button>`;
  o.innerHTML=h;
  o.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{D.col=b.dataset.c;aplicarEstilo();opciones();});
  const $$=id=>o.querySelector("#"+id);
  $$("dCol").oninput=e=>{D.col=e.target.value;aplicarEstilo();};if($$("dBr"))$$("dBr").onchange=e=>{D.brush=e.target.value;};
  if($$("dSz"))$$("dSz").oninput=e=>{D.sz=+e.target.value;$$("dSzT").textContent=D.sz;aplicarEstilo();};if($$("dOp"))$$("dOp").oninput=e=>{D.op=e.target.value/100;};
  if($$("dTol"))$$("dTol").oninput=e=>{D.tol=+e.target.value;};if($$("dTod"))$$("dTod").onchange=e=>{D.todas=e.target.checked;};
  if($$("dRell"))$$("dRell").onchange=e=>{D.rell=e.target.checked;if(D.shSel){D.shSel.fill=D.rell?D.fillCol:null;if(D.rell&&D.shSel.pts.length>2)D.shSel.closed=true;paint();}};
  if($$("dFc"))$$("dFc").oninput=e=>{D.fillCol=e.target.value;if(D.shSel&&D.shSel.fill){D.shSel.fill=D.fillCol;paint();}};
  if($$("dShDel"))$$("dShDel").onclick=()=>{if(D.shSel){push();const l=lay();l.sh.splice(l.sh.indexOf(D.shSel),1);D.shSel=null;paint();}};
  if($$("dShUp"))$$("dShUp").onclick=()=>{if(D.shSel){push();const l=lay();l.sh.splice(l.sh.indexOf(D.shSel),1);l.sh.push(D.shSel);paint();}};
  if($$("dShRd"))$$("dShRd").onclick=()=>{const s=D.shSel;if(!s)return;push();const n=s.pts,L=n.length;n.forEach((p,i)=>{const a=n[(i-1+L)%L],b=n[(i+1)%L];if(!s.closed&&(i===0||i===L-1))return;const dx=(b.x-a.x)/6,dy=(b.y-a.y)/6;p.ox=dx;p.oy=dy;p.ix=-dx;p.iy=-dy;});paint();};
  if($$("dPlOk"))$$("dPlOk").onclick=()=>terminarPluma($$("dPlCl")&&$$("dPlCl").checked);
  if($$("dLzMv"))$$("dLzMv").onclick=()=>{if(D.sel){elevar();paint();}};if($$("dLzCp"))$$("dLzCp").onclick=()=>{if(D.sel){D.sel.copia=true;elevar();paint();}};
  if($$("dLzDel"))$$("dLzDel").onclick=()=>{if(D.sel){push();const g=lay().c.getContext("2d");g.save();g.clip(lazoPath(D.sel.pts));g.clearRect(0,0,W,H);g.restore();D.sel=null;paint();}};
  if($$("dLzFl"))$$("dLzFl").onclick=()=>{if(D.sel&&lay().t==="r"){push();const g=lay().c.getContext("2d");g.fillStyle=D.col;g.fill(lazoPath(D.sel.pts));paint();}};
  if($$("dLzOk"))$$("dLzOk").onclick=soltar;
}
function aplicarEstilo(){if(D.tool==="nodo"&&D.shSel){D.shSel.stroke=D.col;D.shSel.w=D.sz;paint();}}
function capas(){
  const b=$("dLy"),f=cur();b.innerHTML="";
  for(let k=f.layers.length-1;k>=0;k--){const l=f.layers[k],d=document.createElement("div");d.className="li"+(k===f.act?" on":"");
    d.innerHTML=`<span class="ev" style="cursor:pointer;font-size:15px">${l.v?"👁":"🚫"}</span><span>${l.t==="v"?"✒️":"🎨"} ${l.n}</span><span style="opacity:.6">${Math.round(l.o*100)}%</span>`;
    d.onclick=e=>{if(e.target.classList.contains("ev")){l.v=l.v?0:1;capas();paint();return;}soltar();f.act=k;if(l.t==="v"&&!VT.has(D.tool))D.tool="pluma";if(l.t==="r"&&VT.has(D.tool))D.tool="pincel";ui();};
    d.ondblclick=()=>{const n=prompt("Nombre de la capa",l.n);if(n){l.n=n.slice(0,20);capas();}};
    b.appendChild(d);}
  const l=lay(),r=document.createElement("div");r.style.marginTop="6px";r.innerHTML=`Transparencia de la capa <input type="range" id="lyO" min="0" max="100" value="${Math.round(l.o*100)}">`;b.appendChild(r);
  r.querySelector("#lyO").oninput=e=>{l.o=e.target.value/100;paint();};r.querySelector("#lyO").onchange=capas;
}
function tira(){
  const s=$("dStrip");s.innerHTML="";D.frames.forEach((f,k)=>{const c=document.createElement("canvas");c.width=192;c.height=108;const g=c.getContext("2d");g.scale(.2,.2);comp(f,g);c.className=k===D.i?"on":"";c.onclick=()=>irA(k);c.title="Cuadro "+(k+1);s.appendChild(c);});
}
function irA(k){soltar();D.i=Math.max(0,Math.min(D.frames.length-1,k));D.shSel=null;D.draft=null;ui();}
/* ---------- puntero ---------- */
function enlazar(){
  const cv=$("dCv");document.removeEventListener("keydown",teclas);document.addEventListener("keydown",teclas);
  const pt=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
  cv.style.cursor=D.tool==="pipeta"?"crosshair":D.tool==="relleno"?"cell":"crosshair";
  let last=null,drag=null;
  cv.onpointerdown=e=>{if(D.play)return;cv.setPointerCapture(e.pointerId);const p=pt(e),t=D.tool,l=lay();D.down=true;
    if(t==="pipeta"){const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,W,H);comp(cur(),g);const d=g.getImageData(Math.round(p[0]),Math.round(p[1]),1,1).data;D.col="#"+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,"0")).join("");D.down=false;opciones();return;}
    if(t==="relleno"){if(l.t!=="r"){S2("El relleno es para capas de pintura. Para vectores activa «Relleno» y dibuja una forma cerrada.");D.down=false;return;}push();rellenar(p[0],p[1]);paint();D.down=false;return;}
    if(t==="pincel"||t==="borrar"){if(l.t!=="r"){S2("Esta es una capa vectorial. Crea o elige una capa de pintura 🎨.");D.down=false;return;}push();last=p;stroke(p,p,e.pointerType==="pen"?e.pressure:null);paint();return;}
    if(t==="lazo"){if(l.t!=="r"){S2("El lazo es para capas de pintura.");D.down=false;return;}
      if(D.sel&&cvIn(D.sel.pts,p)){elevar();drag={k:"selmv",p};return;}soltar();D.lazo=[p];drag={k:"lazo"};return;}
    if(l.t!=="v"){S2("Para dibujar vectores usa una capa vectorial ✒️ (botón «➕ Vector»).");D.down=false;return;}
    if(t==="pluma"){const d=D.draft||(D.draft={pts:[]});const n=d.pts;if(n.length>2&&Math.hypot(n[0].x-p[0],n[0].y-p[1])<10){terminarPluma(true);D.down=false;return;}
      const nn=N(p[0],p[1]);n.push(nn);drag={k:"plh",n:nn};paint();return;}
    if(t==="linea"||t==="rect"||t==="elipse"){drag={k:"forma",a:p};D.draft={tmp:true,pts:[]};return;}
    if(t==="nodo"){const s=D.shSel;
      if(s){for(const nd of s.pts){for(const [kk,hx,hy] of [["o",nd.x+nd.ox,nd.y+nd.oy],["i",nd.x+nd.ix,nd.y+nd.iy]]){if((nd.ox||nd.oy||nd.ix||nd.iy)&&Math.hypot(hx-p[0],hy-p[1])<8){push();drag={k:"hnd",nd,w:kk};return;}}
        if(Math.hypot(nd.x-p[0],nd.y-p[1])<9){push();drag={k:"nod",nd,p};return;}}}
      const g=document.createElement("canvas").getContext("2d");let hit=null;for(let i=l.sh.length-1;i>=0;i--){const q=l.sh[i],pa=pathOf(q);g.lineWidth=Math.max(q.w,12);if((q.fill&&q.closed&&g.isPointInPath(pa,p[0],p[1]))||g.isPointInStroke(pa,p[0],p[1])){hit=q;break;}}
      D.shSel=hit;if(hit){D.col=hit.stroke||D.col;D.sz=hit.w;if(hit.fill)D.fillCol=hit.fill;push();drag={k:"shp",p};}opciones();paint();return;}};
  cv.onpointermove=e=>{if(!D.down)return;const p=pt(e),t=D.tool;
    if(t==="pincel"||t==="borrar"){stroke(last,p,e.pointerType==="pen"?e.pressure:null);last=p;paint();return;}
    if(!drag)return;
    if(drag.k==="lazo"){D.lazo.push(p);paint();}
    else if(drag.k==="selmv"){D.sel.dx+=p[0]-drag.p[0];D.sel.dy+=p[1]-drag.p[1];drag.p=p;paint();}
    else if(drag.k==="plh"){const n=drag.n;n.ox=p[0]-n.x;n.oy=p[1]-n.y;n.ix=-n.ox;n.iy=-n.oy;paint();}
    else if(drag.k==="forma"){const a=drag.a;let b=p;if(e.shiftKey){const s=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));b=[a[0]+Math.sign(b[0]-a[0]||1)*s,a[1]+Math.sign(b[1]-a[1]||1)*s];}
      D.draft={tmp:true,pts:t==="linea"?[N(a[0],a[1]),N(b[0],b[1])]:t==="rect"?[N(a[0],a[1]),N(b[0],a[1]),N(b[0],b[1]),N(a[0],b[1])]:ell(a[0],a[1],b[0],b[1]),closed:t!=="linea"};paint();}
    else if(drag.k==="nod"){const dx=p[0]-drag.p[0],dy=p[1]-drag.p[1];drag.nd.x+=dx;drag.nd.y+=dy;drag.p=p;paint();}
    else if(drag.k==="hnd"){const n=drag.nd,ox=p[0]-n.x,oy=p[1]-n.y;if(drag.w==="o"){n.ox=ox;n.oy=oy;n.ix=-ox;n.iy=-oy;}else{n.ix=ox;n.iy=oy;n.ox=-ox;n.oy=-oy;}paint();}
    else if(drag.k==="shp"&&D.shSel){const dx=p[0]-drag.p[0],dy=p[1]-drag.p[1];for(const nd of D.shSel.pts){nd.x+=dx;nd.y+=dy;}drag.p=p;paint();}};
  cv.onpointerup=cv.onpointercancel=e=>{if(!D.down)return;D.down=false;const t=D.tool;
    if(drag){if(drag.k==="lazo"){if(D.lazo.length>3)D.sel={pts:D.lazo};D.lazo=null;paint();}
      else if(drag.k==="forma"&&D.draft&&D.draft.pts.length>=2){const d=D.draft;if(Math.hypot(d.pts[0].x-d.pts[d.pts.length-1].x,d.pts[0].y-d.pts[d.pts.length-1].y)>2||t!=="linea"){push();const s=nuevaForma(d.pts,d.closed);lay().sh.push(s);D.shSel=s;}D.draft=null;paint();}}
    drag=null;last=null;if(t==="pincel"||t==="borrar")tira();else if(t!=="pluma")tira();};
  cv.ondblclick=()=>{if(D.tool==="pluma")terminarPluma(false);};
}
function terminarPluma(cerrar){const d=D.draft;if(d&&d.pts&&d.pts.length>=2){push();const s=nuevaForma(d.pts,!!cerrar);if(cerrar&&!D.rell)s.fill=null;lay().sh.push(s);D.shSel=s;}D.draft=null;paint();tira();}
const cvIn=(pts,p)=>{const g=document.createElement("canvas").getContext("2d");return g.isPointInPath(lazoPath(pts),p[0],p[1]);};
function teclas(e){if(!D||$("dibDlg").hidden)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.target.type!=="range"&&e.target.type!=="checkbox")return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo();}
  else if(e.key==="Enter"&&D.tool==="pluma"){terminarPluma(false);}
  else if(e.key==="Escape"){if(D.draft){D.draft=null;paint();}else if(D.sel){soltar();}}
  else if((e.key==="Delete"||e.key==="Backspace")&&D.tool==="nodo"&&D.shSel){const b=$("dShDel");if(b)b.click();}}
/* ---------- dibujo en pantalla ---------- */
function paint(){
  const cv=$("dCv");if(!cv)return;const g=cv.getContext("2d");g.clearRect(0,0,W,H);
  /* cuadrícula de transparencia */
  g.fillStyle="#fff";g.fillRect(0,0,W,H);g.fillStyle="#ececec";for(let y=0;y<H;y+=16)for(let x=((y/16)%2)*16;x<W;x+=32)g.fillRect(x,y,16,16);
  if(D.onion&&!D.play){if(D.i>0){g.globalAlpha=.28;comp(D.frames[D.i-1],g);}if(D.i<D.frames.length-1){g.globalAlpha=.12;comp(D.frames[D.i+1],g);}g.globalAlpha=1;}
  const f=cur();for(const l of f.layers){if(!l.v)continue;renderL(g,l);
    if(l===lay()&&D.sel&&D.sel.c){g.save();g.globalAlpha=l.o;g.drawImage(D.sel.c,D.sel.dx,D.sel.dy);g.restore();}}
  if(!D.play){const l=lay();
    if(D.draft&&D.draft.pts.length){const s=Object.assign({},D.draft,{stroke:D.col,w:D.sz,fill:D.rell&&D.draft.closed?D.fillCol:null});g.save();drawShape(g,s);g.restore();
      if(!D.draft.tmp){g.fillStyle="#fff";g.strokeStyle="#3a86ff";g.lineWidth=2;for(const n of D.draft.pts){g.beginPath();g.rect(n.x-4,n.y-4,8,8);g.fill();g.stroke();}}}
    if(D.tool==="nodo"&&D.shSel&&l.t==="v"&&l.sh.includes(D.shSel)){const s=D.shSel;g.save();g.lineWidth=1;g.strokeStyle="#3a86ff";g.stroke(pathOf(s));
      for(const n of s.pts){if(n.ox||n.oy||n.ix||n.iy){g.beginPath();g.moveTo(n.x+n.ix,n.y+n.iy);g.lineTo(n.x,n.y);g.lineTo(n.x+n.ox,n.y+n.oy);g.stroke();for(const [x,y] of [[n.x+n.ox,n.y+n.oy],[n.x+n.ix,n.y+n.iy]]){g.fillStyle="#ffb347";g.beginPath();g.arc(x,y,4,0,7);g.fill();}}
        g.fillStyle="#fff";g.beginPath();g.rect(n.x-5,n.y-5,10,10);g.fill();g.stroke();}g.restore();}
    const pp=D.lazo?D.lazo:D.sel&&D.sel.pts;if(pp){g.save();if(D.sel&&D.sel.c)g.translate(D.sel.dx,D.sel.dy);g.setLineDash([6,5]);g.lineWidth=1.5;g.strokeStyle="#000";g.stroke(lazoPath(pp));g.lineDashOffset=5;g.strokeStyle="#fff";g.stroke(lazoPath(pp));g.restore();}}
  const n=$("dN");if(n)n.textContent="Cuadro "+(D.i+1)+" de "+D.frames.length;
}
function startPlay(){soltar();D.play=true;$("dPlay").textContent="⏹ Parar";let k=0,t0=performance.now();const f=now=>{if(!D.play)return;k=Math.floor((now-t0)/1000*D.fps)%D.frames.length;D.i=k;paint();pv=requestAnimationFrame(f);};pv=requestAnimationFrame(f);}
function stopPlay(){if(D){D.play=false;const b=$("dPlay");if(b)b.textContent="▶ Ver";}cancelAnimationFrame(pv);}
/* ---------- guardar ---------- */
function flat(f,w,h){const o=document.createElement("canvas");o.width=w;o.height=h;const g=o.getContext("2d");g.scale(w/W,h/H);comp(f,g);return o;}
function guardar(){
  stopPlay();soltar();const S=window.Serie;if(!S)return;
  const sz=D.frames.length>1?[720,405]:[W,H],frames=D.frames.map(f=>flat(f,sz[0],sz[1]).toDataURL("image/png"));
  const id="d"+Date.now().toString(36);S.proj.imgs[id]={n:D.nombre,tipo:"elemento",url:frames[0],frames:frames.length>1?frames:undefined,fps:D.fps};
  S.loadImgs();S.changed();S.renderLib();S.addImg(id);S.say("Dibujo guardado y puesto en la escena"+(frames.length>1?": dale ▶ para verlo.":"."));cerrar();
}
function exportSvg(){
  const f=cur(),vs=f.layers.filter(l=>l.t==="v"&&l.v);if(!vs.length||!vs.some(l=>l.sh.length)){S2("Este cuadro no tiene formas vectoriales.");return;}
  const d=s=>{const n=s.pts;let o="M"+n[0].x.toFixed(1)+" "+n[0].y.toFixed(1);for(let i=1;i<n.length;i++){const a=n[i-1],b=n[i];o+=" C"+(a.x+a.ox).toFixed(1)+" "+(a.y+a.oy).toFixed(1)+" "+(b.x+b.ix).toFixed(1)+" "+(b.y+b.iy).toFixed(1)+" "+b.x.toFixed(1)+" "+b.y.toFixed(1);}
    if(s.closed&&n.length>2){const a=n[n.length-1],b=n[0];o+=" C"+(a.x+a.ox).toFixed(1)+" "+(a.y+a.oy).toFixed(1)+" "+(b.x+b.ix).toFixed(1)+" "+(b.y+b.iy).toFixed(1)+" "+b.x.toFixed(1)+" "+b.y.toFixed(1)+" Z";}return o;};
  let x=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  for(const l of vs)x+=`<g opacity="${l.o}">`+l.sh.map(s=>`<path d="${d(s)}" fill="${s.fill&&s.closed?s.fill:"none"}" stroke="${s.stroke||"none"}" stroke-width="${s.w}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")+"</g>";
  x+="</svg>";const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([x],{type:"image/svg+xml"}));a.download=(D.nombre||"dibujo")+".svg";a.click();
}
window.Dibujo={abrir,cerrar,_D:()=>D,_rellenar:rellenar,_comp:comp,_pathOf:pathOf};
})();
