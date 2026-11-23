/* Panel de pistas: una fila por personaje/objeto, con caminata, acciones, fotogramas clave (con curvas), voces y sonidos */
(function(){
"use strict";
const S=()=>window.Serie,$=id=>document.getElementById(id);
const AI={saludar:"👋",señalar:"👉",saltar:"⬆",bailar:"💃",asustarse:"😱",reír:"😂",pensar:"🤔",esperar:"⏳",comer:"🍎",girar_cabeza:"🙆",hablar:"🗣",rebotar:"🏀"};
const COL={go:"#4d7cff",acc:"#ff9f43",voz:"#3ecf8e",sfx:"#c084fc",amb:"#38bdf8",kf:"#ffd93d"};
const CURVES=[["suave","Suave"],["lineal","Recta"],["entrada","Arranca lento"],["salida","Frena al final"],["rebote","Rebote"],["elastico","Elástico"],["retroceso","Se pasa y vuelve"],["paso","Salto brusco"]];
const LBL=150,RH=30;
let pps=90,scrollX=0,drawn=false,raf=0,menu=null,selKf=null;
const T={};
function el(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const snap=t=>Math.round(t*10)/10;
function build(){
  const w=$("trkWrap");if(!w||w._built)return;w._built=true;
  const body=el("div","trkBody");body.id="trkBody";w.appendChild(body);
  w.insertBefore(Object.assign(el("div","trkTools"),{id:"trkTools"}),body);
  $("trkTools").innerHTML=`<span style="opacity:.7">Zoom</span><input id="trkZ" type="range" min="30" max="260" value="${pps}" style="width:110px"><button id="trkFit">Ajustar</button>
   <span style="opacity:.6;margin-left:8px">Doble clic en una fila = agregar. Arrastra para mover. Clic derecho = borrar.</span>`;
  $("trkZ").oninput=e=>{pps=+e.target.value;render();};
  $("trkFit").onclick=()=>{const b=$("trkBody");pps=Math.max(30,Math.min(260,(b.clientWidth-LBL-30)/Math.max(2,S().curScene().dur)));$("trkZ").value=pps;scrollX=0;render();};
  body.addEventListener("scroll",()=>{scrollX=body.scrollLeft;});
  body.addEventListener("wheel",e=>{if(e.ctrlKey){e.preventDefault();pps=Math.max(30,Math.min(260,pps*(e.deltaY<0?1.12:.89)));$("trkZ").value=pps;render();}},{passive:false});
  const sp=el("div","splh");w.parentNode.insertBefore(sp,w);
  sp.onpointerdown=e=>{sp.setPointerCapture(e.pointerId);const y0=e.clientY,h0=w.getBoundingClientRect().height;sp.onpointermove=ev=>{w.style.height=Math.max(110,Math.min(innerHeight-260,h0-(ev.clientY-y0)))+"px";};sp.onpointerup=()=>{sp.onpointermove=null;window.dispatchEvent(new Event("resize"));};};
  document.addEventListener("pointerdown",e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
}
function closeMenu(){if(menu){menu.remove();menu=null;}}
function showMenu(x,y,items,doc){
  closeMenu();const d=doc||document;menu=d.createElement("div");menu.className="trkMenu";
  menu.style.cssText=`position:fixed;left:${x}px;top:${y}px;z-index:99;background:#232740;border:1px solid #7a5cff;border-radius:10px;padding:5px;min-width:170px;box-shadow:0 10px 30px #000a;max-height:70vh;overflow:auto`;
  for(const it of items){if(it==="-"){menu.appendChild(Object.assign(d.createElement("div"),{style:"height:1px;background:#3a3f6a;margin:4px 0"}));continue;}
    const b=d.createElement("div");b.className="mi"+(it.on?" on":"");b.textContent=it.t;b.onclick=()=>{closeMenu();it.f();};menu.appendChild(b);}
  d.body.appendChild(menu);
  const r=menu.getBoundingClientRect(),W=d.defaultView.innerWidth,H=d.defaultView.innerHeight;if(r.right>W)menu.style.left=Math.max(4,W-r.width-6)+"px";if(r.bottom>H)menu.style.top=Math.max(4,H-r.height-6)+"px";
}
function render(){
  cancelAnimationFrame(raf);raf=requestAnimationFrame(doRender);
}
function doRender(){
  const w=$("trkWrap");if(!w||!window.Serie||!S().curScene)return;build();
  const body=$("trkBody");if(!body)return;const sc=S().curScene(),dur=sc.dur||6,W=Math.max(body.clientWidth-LBL,dur*pps+60);
  const keep=body.scrollTop;body.innerHTML="";
  const grid=el("div","trkGrid");grid.style.width=(LBL+W)+"px";body.appendChild(grid);
  /* regla */
  const ru=el("div","trkRow trkRuler");ru.style.height="24px";ru.appendChild(el("div","trkLbl","⏱ Tiempo"));
  const rr=el("div","trkArea");rr.style.width=W+"px";
  const step=pps>=140?.5:pps>=60?1:2;for(let t=0;t<=dur+.001;t+=step){const k=el("div","tick");k.style.left=t*pps+"px";k.innerHTML=`<i></i><b>${t%1?t.toFixed(1):t}s</b>`;rr.appendChild(k);}
  const end=el("div","trkEnd");end.style.left=dur*pps+"px";rr.appendChild(end);
  ru.appendChild(rr);grid.appendChild(ru);
  const seek=ev=>{const r=rr.getBoundingClientRect();S().setT(snap((ev.clientX-r.left)/pps));};
  rr.onpointerdown=ev=>{rr.setPointerCapture(ev.pointerId);seek(ev);rr.onpointermove=seek;rr.onpointerup=()=>{rr.onpointermove=null;};};
  /* cámara */
  const cr=row("🎥 Cámara",W,null);const c=sc.cam||{};
  const cb=el("div","blk cam","Zoom "+(c.z0||1).toFixed(1)+"× → "+(c.z1||1).toFixed(1)+"×"+(c.sigue?" · sigue a "+esc(nameOf(sc,c.sigue)):""));cb.style.cssText=`left:0;width:${dur*pps}px;background:#2b3358;border-color:#4a5486`;
  cb.onclick=()=>{S().select(null);};
  if(sc.cortes&&sc.cortes.length){const f=sc.cortes[0].t;cb.style.width=Math.max(2,f*pps)+"px";cb.textContent=f>.2?"Inicio":"";
    sc.cortes.forEach((k,i)=>{const nx=sc.cortes[i+1]?sc.cortes[i+1].t:dur,b=el("div","blk cam","✂ Plano "+(i+1)+" · "+(k.z||1).toFixed(1)+"×");b.style.cssText=`left:${k.t*pps}px;width:${Math.max(30,(nx-k.t)*pps)}px;background:#3a2f58;border-color:#a98bff`;b.title="Clic derecho = quitar el corte";b.onclick=()=>{S().select(null);S().setT(k.t);};b.oncontextmenu=ev=>{ev.preventDefault();sc.cortes.splice(i,1);if(!sc.cortes.length)delete sc.cortes;commit();};cr.area.appendChild(b);});}
  cr.area.ondblclick=ev=>{if(ev.target.closest&&ev.target.closest(".blk")&&!ev.target.classList.contains("cam"))return;const r=cr.area.getBoundingClientRect(),t=Math.round(Math.max(0,Math.min(dur,(ev.clientX-r.left)/pps))*10)/10;sc.cortes=sc.cortes||[];if(sc.cortes.some(k=>Math.abs(k.t-t)<.05))return;sc.cortes.push({t,z:sc.cortes.length?1.8:1.35,z1:sc.cortes.length?1.95:1.45,x:0});sc.cortes.sort((a,b)=>a.t-b.t);commit();};
  cr.area.appendChild(cb);
  /* personajes y objetos */
  const L=window.Dub?Dub.lines(sc):[];
  const vis=sc.items.filter(i=>i.kind==='actor'||S().sel===i.uid||(i.kf&&i.kf.length)).sort((a,b)=>(b.kind==='actor')-(a.kind==='actor'));
  for(const it of vis){
    const r=row((it.kind==="actor"?"🎭 ":it.kind==="deco"?"🌳 ":"🖼 ")+esc(S().itemName(it)),W,it);
    if(S().sel===it.uid)r.row.classList.add("sel");
    /* caminata */
    if(it.go){const a=it.go.t0||0,b=it.go.t1||a+3,g=el("div","blk go","🚶 camina");g.style.cssText=`left:${a*pps}px;width:${Math.max(16,(b-a)*pps)}px;background:${COL.go}`;
      grip(g,"go",it,a,b);r.area.appendChild(g);}
    /* acciones */
    (it.acc||[]).forEach((a,i)=>{const isP=a.k.startsWith("pose:"),pz=isP?S().poseOf(a.k.slice(5)):null,d=a.dur||(isP?1.4:(window.SerieRig&&SerieRig.ACC[a.k]?SerieRig.ACC[a.k].d:2));const b=el("div","blk acc",isP?(pz?pz.n:"pose"):(AI[a.k]||"•")+" "+a.k);b.style.cssText=`left:${a.t0*pps}px;width:${Math.max(24,d*pps)}px;background:${COL.acc}`;
      drag(b,{get:()=>a.t0,set:v=>{a.t0=Math.max(0,snap(v));},max:()=>dur-.2,right:{get:()=>a.dur||d,set:v=>{a.dur=Math.max(.4,snap(v));}}});
      b.oncontextmenu=ev=>{ev.preventDefault();it.acc.splice(i,1);S().select(it.uid);commit();};
      b.onclick=ev=>{ev.stopPropagation();S().select(it.uid);};r.area.appendChild(b);});
    /* voces de este personaje */
    L.filter(l=>l.quien===it.uid&&!l.sfx).forEach(l=>{const e=Dub.lineEnd(l);const b=el("div","blk voz","🗣 "+esc((l.txt||"").slice(0,40)));b.style.cssText=`left:${l.t0*pps}px;width:${Math.max(24,(e-l.t0)*pps)}px;background:${COL.voz};top:15px;height:13px;font-size:9px;line-height:13px`;
      drag(b,{get:()=>l.t0,set:v=>{l.t0=Math.max(0,snap(v));},max:()=>dur});b.title="Arrastra para mover la voz";r.area.appendChild(b);});
    /* fotogramas clave */
    (it.kf||[]).forEach((k,i)=>{const d=el("div","kfd"+(selKf&&selKf.k===k?" on":""));d.style.left=(k.t*pps)+"px";d.title=k.t.toFixed(1)+" s · "+(CURVES.find(c=>c[0]===(k.e||"suave"))||[0,"Suave"])[1]+" (clic = elegir curva)";
      let moved=false;
      d.onpointerdown=ev=>{ev.stopPropagation();d.setPointerCapture(ev.pointerId);moved=false;const x0=ev.clientX,t0=k.t;
        d.onpointermove=e2=>{const t=Math.max(.05,Math.min(dur,snap(t0+(e2.clientX-x0)/pps)));if(Math.abs(e2.clientX-x0)>3)moved=true;if(moved){k.t=t;d.style.left=t*pps+"px";S().setT(t);}};
        d.onpointerup=e2=>{d.onpointermove=null;if(moved){it.kf.sort((a,b)=>a.t-b.t);commit();}else{S().select(it.uid);selKf={k};curveMenu(e2,it,k);}};};
      d.oncontextmenu=ev=>{ev.preventDefault();it.kf.splice(i,1);if(!it.kf.length)delete it.kf;S().select(it.uid);commit();};
      r.area.appendChild(d);});
    /* doble clic: agregar */
    r.area.ondblclick=ev=>{const rc=r.area.getBoundingClientRect(),t=Math.max(0,Math.min(dur,snap((ev.clientX-rc.left)/pps)));
      const its=[{t:"🔑 Fotograma clave aquí",f:()=>{const q=S().posAt(it,t);S().setKf(it,t,{x:Math.round(q.x),y:Math.round(q.y),s:+q.s.toFixed(3)});S().select(it.uid);commit();}}];
      if(it.kind==="actor"){its.push("-");for(const k in AI)its.push({t:AI[k]+" "+k[0].toUpperCase()+k.slice(1),f:()=>{(it.acc=it.acc||[]).push({k,t0:t});S().select(it.uid);commit();}});
        its.push("-");its.push({t:"🚶 Que camine desde aquí",f:()=>{it.go={x1:Math.min(1220,it.x+320),y1:it.y,t0:t,t1:Math.min(dur,t+3)};S().select(it.uid);commit();}});}
      showMenu(ev.clientX,ev.clientY,its,ev.target.ownerDocument);};
    r.area.onclick=()=>{S().select(it.uid);};
  }
  /* sonidos */
  const so=row("🔊 Sonidos",W,null);
  L.filter(l=>l.sfx).forEach(l=>{const e=Dub.lineEnd(l),b=el("div","blk "+(l.amb?"amb":"sfx"),(l.amb?"🌬 ":"🔔 ")+esc(l.nombre||"efecto"));b.style.cssText=`left:${l.t0*pps}px;width:${Math.max(24,(e-l.t0)*pps)}px;background:${l.amb?COL.amb:COL.sfx}`;
    if(!l.amb)drag(b,{get:()=>l.t0,set:v=>{l.t0=Math.max(0,snap(v));},max:()=>dur});r.area&&0;so.area.appendChild(b);});
  if(window.Serie&&Serie.curScene&&Dub.AUD){const P=Serie.curScene();void P;}
  /* cabezal */
  const ph=el("div","trkHead");ph.id="trkHead";grid.appendChild(ph);head(window.__lastT||0);
  body.scrollTop=keep;body.scrollLeft=scrollX;
}
function row(label,W,it){
  const r=el("div","trkRow");const l=el("div","trkLbl",label);l.title=label;if(it)l.onclick=()=>S().select(it.uid);r.appendChild(l);
  const a=el("div","trkArea");a.style.width=W+"px";r.appendChild(a);$("trkBody").firstChild.appendChild(r);return {row:r,area:a};
}
function nameOf(sc,uid){const i=sc.items.find(x=>x.uid===uid);return i?S().itemName(i):"";}
function commit(){const s=S();if(s&&window.Studio)Studio.changed();render();}
/* arrastrar un bloque (mover y, si hay borde derecho, estirar) */
function drag(b,o){
  const h=el("i","rsz");if(o.right)b.appendChild(h);
  b.onpointerdown=ev=>{if(ev.button)return;ev.stopPropagation();const right=ev.target===h,x0=ev.clientX,v0=right?o.right.get():o.get();b.setPointerCapture(ev.pointerId);let mv=false;
    b.onpointermove=e=>{const dx=(e.clientX-x0)/pps;if(Math.abs(e.clientX-x0)>3)mv=true;if(!mv)return;
      if(right){o.right.set(v0+dx);b.style.width=Math.max(24,o.right.get()*pps)+"px";}else{o.set(Math.min(o.max?o.max():99,v0+dx));b.style.left=o.get()*pps+"px";}};
    b.onpointerup=()=>{b.onpointermove=null;if(mv)commit();};};
}
/* la caminata se estira por los dos lados */
function grip(b,kind,it,a,e){
  const l=el("i","rsz l"),r=el("i","rsz");b.appendChild(l);b.appendChild(r);
  b.onpointerdown=ev=>{if(ev.button)return;ev.stopPropagation();const side=ev.target===l?"l":ev.target===r?"r":"m",x0=ev.clientX,g=it.go,t0=g.t0||0,t1=g.t1||t0+3,dur=S().curScene().dur;b.setPointerCapture(ev.pointerId);let mv=false;
    b.onpointermove=e2=>{const dx=(e2.clientX-x0)/pps;if(Math.abs(e2.clientX-x0)>3)mv=true;if(!mv)return;
      if(side==="m"){const d=t1-t0,n=Math.max(0,Math.min(dur-d,snap(t0+dx)));g.t0=n;g.t1=n+d;}else if(side==="l")g.t0=Math.max(0,Math.min(t1-.5,snap(t0+dx)));else g.t1=Math.max(t0+.5,Math.min(dur,snap(t1+dx)));
      b.style.left=g.t0*pps+"px";b.style.width=Math.max(16,(g.t1-g.t0)*pps)+"px";};
    b.onpointerup=()=>{b.onpointermove=null;if(mv)commit();else S().select(it.uid);};};
  b.oncontextmenu=ev=>{ev.preventDefault();delete it.go;S().select(it.uid);commit();};
}
function curveMenu(ev,it,k){
  showMenu(ev.clientX,ev.clientY,[{t:"Cómo llega a esta pose:",f:()=>{}},"-",...CURVES.map(([id,n])=>({t:n,on:(k.e||"suave")===id,f:()=>{k.e=id;commit();}})),"-",{t:"📈 Editor de curvas…",f:()=>window.Curvas&&Curvas.abrir(it,k)},"-",{t:"🗑 Borrar fotograma",f:()=>{it.kf.splice(it.kf.indexOf(k),1);if(!it.kf.length)delete it.kf;commit();}}],ev.target.ownerDocument);
}
function head(t){window.__lastT=t;const h=$("trkHead");if(h)h.style.left=(LBL+t*pps)+"px";}
window.addEventListener("serie-tl",render);window.addEventListener("serie-time",e=>head(e.detail));
window.addEventListener("resize",()=>{if(window.Serie)render();});
window.Tracks={render,head,build};
setTimeout(()=>{build();render();},200);
})();
