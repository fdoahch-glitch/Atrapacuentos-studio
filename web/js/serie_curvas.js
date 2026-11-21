/* Editor de curvas: gráfico de valores por propiedad (arrastra los puntos) + curva Bézier de cada tramo */
(function(){
"use strict";
const S=()=>window.Serie;
const PROPS=[["x","Izquierda⇄Derecha"],["y","Arriba⇄Abajo"],["s","Tamaño"],["r","Giro"],["op","Transparencia"]];
const PRE=[["suave","Suave"],["lineal","Lineal"],["entrada","Arranca lento"],["salida","Frena al final"],["rebote","Rebote"],["elastico","Elástico"],["retroceso","Se pasa y vuelve"],["paso","Salto brusco"]];
let dlg=null,st={it:null,kf:null,prop:"x",drag:null,vmin:0,vmax:1};
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
function css(){if(document.getElementById("crvCss"))return;const s=el("style");s.id="crvCss";s.textContent=`
#crv{position:fixed;inset:0;z-index:9000;background:#000b;display:grid;place-items:center}
#crv .box{background:#1b1e36;border:1px solid #7a5cff;border-radius:16px;padding:14px 16px;color:#eef;max-width:96vw;max-height:94vh;overflow:auto;font:14px system-ui,sans-serif}
#crv h3{margin:0 0 8px;font-size:17px}#crv .cols{display:flex;gap:16px;flex-wrap:wrap}
#crv button{background:#2b3058;color:#eef;border:1px solid #4a4f86;border-radius:9px;padding:6px 10px;cursor:pointer;font:inherit}
#crv button.on{background:#7a5cff;border-color:#a99bff}#crv button.pri{background:#7a5cff}
#crv .tabs{display:flex;gap:6px;margin:0 0 8px;flex-wrap:wrap}#crv canvas{background:#12142a;border-radius:10px;border:1px solid #343a6a;touch-action:none;display:block}
#crv .pre{display:flex;flex-wrap:wrap;gap:5px;max-width:250px;margin-top:8px}#crv .hint{font-size:12px;opacity:.72;margin-top:6px;max-width:660px}`;document.head.appendChild(css2());function css2(){return s;}}
function abrir(it,kf){
  css();if(dlg)dlg.remove();
  it=it||S().proj.mundos[S().proj.mundo].items.find(i=>i.uid===S().sel);if(!it){S().say&&S().say("Primero toca un personaje o un objeto en la escena.");return;}
  st.it=it;st.kf=kf||((it.kf||[])[0]||null);
  if(kf){const p=PROPS.find(([k])=>kf[k]!=null);if(p)st.prop=p[0];}
  dlg=el("div");dlg.id="crv";
  dlg.innerHTML=`<div class="box"><h3>📈 Editor de curvas — ${S().itemName(it)}</h3><div class="cols"><div><div class="tabs" id="cvTabs"></div><canvas id="cvG" width="640" height="300"></canvas>
  <div class="hint">Cada punto es un fotograma clave. <b>Arrástralo</b> para cambiar cuándo y cuánto. <b>Doble clic</b> en la línea agrega uno. <b>Clic derecho</b> en un punto lo quita. Clic en la regla de arriba mueve el tiempo.</div></div>
  <div><b>Cómo llega al punto elegido</b><canvas id="cvB" width="240" height="240" style="margin-top:6px"></canvas><div class="pre" id="cvP"></div><div class="hint" id="cvH"></div></div></div>
  <div style="margin-top:10px;text-align:right"><button class="pri" id="cvX">Listo</button></div></div>`;
  document.body.appendChild(dlg);dlg.addEventListener("pointerdown",e=>{if(e.target===dlg)cerrar();});
  dlg.querySelector("#cvX").onclick=cerrar;buildTabs();bindG();bindB();drawG();drawB();
  document.addEventListener("keydown",esc);
}
function esc(e){if(e.key==="Escape")cerrar();}
function cerrar(){if(dlg){dlg.remove();dlg=null;}document.removeEventListener("keydown",esc);S().changed();window.dispatchEvent(new Event("serie-tl"));S().draw();}
function buildTabs(){const t=dlg.querySelector("#cvTabs");t.innerHTML="";for(const [k,n] of PROPS){const b=el("button",st.prop===k?"on":"",n);b.onclick=()=>{st.prop=k;buildTabs();drawG();};t.appendChild(b);}}
const dur=()=>S().curScene().dur;
/* valores muestreados del gráfico */
function sample(){const it=st.it,D=dur(),n=240,o=[];let mn=1e9,mx=-1e9;for(let i=0;i<=n;i++){const t=D*i/n,v=S().posAt(it,t)[st.prop];o.push(v);if(v<mn)mn=v;if(v>mx)mx=v;}
  for(const k of it.kf||[])if(k[st.prop]!=null){mn=Math.min(mn,k[st.prop]);mx=Math.max(mx,k[st.prop]);}
  if(mx-mn<1e-6){mn-=1;mx+=1;}const pad=(mx-mn)*.12;st.vmin=mn-pad;st.vmax=mx+pad;return o;}
const GX={l:44,r:12,t:26,b:20};
const gx=t=>GX.l+(t/dur())*(640-GX.l-GX.r),gy=v=>GX.t+(1-(v-st.vmin)/(st.vmax-st.vmin))*(300-GX.t-GX.b);
const gt=x=>(x-GX.l)/(640-GX.l-GX.r)*dur(),gv=y=>st.vmin+(1-(y-GX.t)/(300-GX.t-GX.b))*(st.vmax-st.vmin);
function drawG(){
  const c=dlg.querySelector("#cvG"),g=c.getContext("2d"),vals=sample(),D=dur();g.clearRect(0,0,640,300);
  g.strokeStyle="#2a2f5c";g.fillStyle="#9aa3e6";g.font="11px system-ui";g.lineWidth=1;
  for(let i=0;i<=4;i++){const v=st.vmin+(st.vmax-st.vmin)*i/4,y=gy(v);g.beginPath();g.moveTo(GX.l,y);g.lineTo(628,y);g.stroke();g.fillText(Math.abs(v)<10?v.toFixed(2):Math.round(v),4,y+4);}
  const step=D>20?5:D>8?2:1;for(let t=0;t<=D+1e-6;t+=step){const x=gx(t);g.beginPath();g.moveTo(x,GX.t);g.lineTo(x,280);g.stroke();g.fillText(t+"s",x-8,14);}
  const ph=window.__lastT||0;g.strokeStyle="#ffcf5a";g.beginPath();g.moveTo(gx(ph),GX.t);g.lineTo(gx(ph),280);g.stroke();
  g.strokeStyle="#7a5cff";g.lineWidth=2.5;g.beginPath();vals.forEach((v,i)=>{const x=gx(D*i/(vals.length-1)),y=gy(v);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();
  for(const k of st.it.kf||[]){if(k[st.prop]==null)continue;const x=gx(k.t),y=gy(k[st.prop]),on=st.kf===k;g.fillStyle=on?"#ffcf5a":"#fff";g.strokeStyle="#12142a";g.lineWidth=2;g.beginPath();g.rect(x-6,y-6,12,12);g.save();g.translate(x,y);g.rotate(Math.PI/4);g.beginPath();g.rect(-6,-6,12,12);g.restore();g.fill();g.stroke();}
  if(!(st.it.kf||[]).some(k=>k[st.prop]!=null)){g.fillStyle="#9aa3e6";g.font="13px system-ui";g.fillText("Aún no hay fotogramas de esta propiedad. Haz doble clic sobre la línea para crear uno.",GX.l+10,150);}
}
function bindG(){
  const c=dlg.querySelector("#cvG"),pos=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*640/r.width,(e.clientY-r.top)*300/r.height];};
  const hit=(x,y)=>{let b=null,bd=14;for(const k of st.it.kf||[]){if(k[st.prop]==null)continue;const d=Math.hypot(gx(k.t)-x,gy(k[st.prop])-y);if(d<bd){bd=d;b=k;}}return b;};
  c.onpointerdown=e=>{const [x,y]=pos(e);if(y<GX.t){const t=Math.max(0,Math.min(dur(),gt(x)));S().setT(t);drawG();return;}
    const k=hit(x,y);if(k){st.kf=k;st.drag=k;c.setPointerCapture(e.pointerId);drawG();drawB();}};
  c.onpointermove=e=>{if(!st.drag)return;const [x,y]=pos(e),k=st.drag;k.t=Math.round(Math.max(0,Math.min(dur(),gt(x)))*20)/20;let v=gv(y);if(st.prop==="op")v=Math.max(0,Math.min(1,v));if(st.prop==="s")v=Math.max(.05,v);k[st.prop]=st.prop==="x"||st.prop==="y"?Math.round(v):+v.toFixed(3);drawG();S().draw();};
  c.onpointerup=()=>{if(st.drag){st.it.kf.sort((a,b)=>a.t-b.t);st.drag=null;S().changed();drawG();drawB();}};
  c.ondblclick=e=>{const [x,y]=pos(e);if(y<GX.t||hit(x,y))return;const t=Math.round(Math.max(0,Math.min(dur(),gt(x)))*20)/20,q=S().posAt(st.it,t),v=q[st.prop];
    S().setKf(st.it,t,{[st.prop]:st.prop==="x"||st.prop==="y"?Math.round(v):+v.toFixed(3)});st.kf=st.it.kf.find(k=>Math.abs(k.t-t)<.04);S().changed();drawG();drawB();S().draw();};
  c.oncontextmenu=e=>{e.preventDefault();const [x,y]=pos(e),k=hit(x,y);if(!k)return;delete k[st.prop];if(!PROPS.some(([p])=>k[p]!=null)){st.it.kf.splice(st.it.kf.indexOf(k),1);if(!st.it.kf.length)delete st.it.kf;}if(st.kf===k)st.kf=null;S().changed();drawG();drawB();S().draw();};
}
/* ---- curva Bézier del tramo ---- */
const BW=240,BP=26;const bx=u=>BP+u*(BW-2*BP),by=v=>BW-BP-v*(BW-2*BP);
const cur=()=>st.kf&&st.kf.e;
function ctrl(){const e=cur();return Array.isArray(e)?e:null;}
function drawB(){
  if(!dlg)return;const c=dlg.querySelector("#cvB"),g=c.getContext("2d");g.clearRect(0,0,BW,BW);
  g.strokeStyle="#2a2f5c";g.lineWidth=1;g.strokeRect(bx(0),by(1),bx(1)-bx(0),by(0)-by(1));g.beginPath();g.moveTo(bx(0),by(0));g.lineTo(bx(1),by(1));g.setLineDash([3,4]);g.stroke();g.setLineDash([]);
  const P=dlg.querySelector("#cvP");P.innerHTML="";
  if(!st.kf){g.fillStyle="#9aa3e6";g.font="12px system-ui";g.fillText("Elige un punto del gráfico",44,120);dlg.querySelector("#cvH").textContent="";return;}
  const f=S().easeFn(st.kf.e);g.strokeStyle="#7a5cff";g.lineWidth=3;g.beginPath();for(let i=0;i<=60;i++){const u=i/60,x=bx(u),y=by(f(u));i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  const b=ctrl();if(b){g.strokeStyle="#ffcf5a";g.lineWidth=1.5;g.beginPath();g.moveTo(bx(0),by(0));g.lineTo(bx(b[0]),by(b[1]));g.moveTo(bx(1),by(1));g.lineTo(bx(b[2]),by(b[3]));g.stroke();
    for(const [x,y] of [[b[0],b[1]],[b[2],b[3]]]){g.fillStyle="#ffcf5a";g.beginPath();g.arc(bx(x),by(y),7,0,6.3);g.fill();}}
  for(const [id,n] of PRE){const bt=el("button",(!b&&(st.kf.e||"suave")===id)?"on":"",n);bt.onclick=()=>{st.kf.e=id;S().changed();drawB();S().draw();};P.appendChild(bt);}
  const bt=el("button",b?"on":"","✏ Dibujar mi curva");bt.onclick=()=>{if(!b)st.kf.e=[.42,0,.58,1];S().changed();drawB();};P.appendChild(bt);
  dlg.querySelector("#cvH").innerHTML=b?"Arrastra las dos bolitas amarillas. Si la curva sube sobre la línea de arriba, el movimiento se pasa y vuelve.":"El tramo llega al punto a las "+st.kf.t.toFixed(2)+" s.";
}
function bindB(){
  const c=dlg.querySelector("#cvB");let dr=-1;
  const pos=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*BW/r.width,(e.clientY-r.top)*BW/r.height];};
  c.onpointerdown=e=>{const b=ctrl();if(!b)return;const [x,y]=pos(e);const d0=Math.hypot(bx(b[0])-x,by(b[1])-y),d1=Math.hypot(bx(b[2])-x,by(b[3])-y);if(Math.min(d0,d1)<16){dr=d0<d1?0:1;c.setPointerCapture(e.pointerId);}};
  c.onpointermove=e=>{if(dr<0)return;const b=ctrl(),[x,y]=pos(e);b[dr*2]=Math.max(0,Math.min(1,+((x-BP)/(BW-2*BP)).toFixed(3)));b[dr*2+1]=Math.max(-.6,Math.min(1.6,+((BW-BP-y)/(BW-2*BP)).toFixed(3)));drawB();drawG();S().draw();};
  c.onpointerup=()=>{if(dr>=0){dr=-1;S().changed();}};
}
window.Curvas={abrir,cerrar};
})();
