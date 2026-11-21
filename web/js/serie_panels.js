/* Paneles desacoplables: acoplado · flotante · ventana aparte (segundo monitor) */
(function(){
"use strict";
const LS="atr_layout_v1",PN={},pops={};
const orig={gid:Document.prototype.getElementById,qs:Document.prototype.querySelector,qsa:Document.prototype.querySelectorAll};
const others=()=>Object.values(pops).map(p=>p.win&&!p.win.closed?p.win.document:null).filter(Boolean);
/* los scripts del Studio buscan por id en «document»: que también encuentre lo que está en otra ventana */
document.getElementById=function(id){return orig.gid.call(document,id)||others().map(d=>orig.gid.call(d,id)).find(Boolean)||null;};
document.querySelector=function(s){return orig.qs.call(document,s)||others().map(d=>orig.qs.call(d,s)).find(Boolean)||null;};
document.querySelectorAll=function(s){let r=Array.from(orig.qsa.call(document,s));for(const d of others())r=r.concat(Array.from(orig.qsa.call(d,s)));return r;};

let L={};try{L=JSON.parse(localStorage.getItem(LS)||"{}");}catch(e){}
L.libW=L.libW||354;L.propsW=L.propsW||316;L.f=L.f||{};
const save=()=>{try{localStorage.setItem(LS,JSON.stringify({libW:L.libW,propsW:L.propsW,f:L.f}));}catch(e){}};
const main=()=>orig.gid.call(document,"main");

function layout(){
  const m=main();if(!m)return;
  const c=[];if(PN.lib&&PN.lib.mode==="dock")c.push(L.libW+"px");c.push("minmax(0,1fr)");if(PN.props&&PN.props.mode==="dock")c.push(L.propsW+"px");
  m.style.setProperty("--cols",c.join(" "));
  /* los dos asideros para cambiar el ancho */
  m.querySelectorAll(".spl").forEach(s=>s.remove());
  const add=(w,k,dir)=>{const s=document.createElement("div");s.className="spl";s.style[dir]=w+"px";
    s.onpointerdown=e=>{s.setPointerCapture(e.pointerId);s.classList.add("on");const x0=e.clientX,w0=L[k];
      s.onpointermove=ev=>{const d=(ev.clientX-x0)*(dir==="left"?1:-1);L[k]=Math.max(k==="libW"?240:240,Math.min(700,w0+d));layout();window.dispatchEvent(new Event("resize"));};
      s.onpointerup=()=>{s.classList.remove("on");s.onpointermove=null;save();};};m.appendChild(s);};
  if(PN.lib&&PN.lib.mode==="dock")add(L.libW,"libW","left");
  if(PN.props&&PN.props.mode==="dock")add(L.propsW,"propsW","right");
}
function mkBar(p){
  const b=document.createElement("div");b.className="pbar";
  b.innerHTML=`<span class="pt">⠿ ${p.title}</span><button data-a="f" title="Sacar como panel flotante">⧉ Flotar</button><button data-a="w" title="Abrir en otra ventana: arrástrala a tu otro monitor">🖥 Otra ventana</button>`;
  b.onclick=e=>{const a=e.target.dataset&&e.target.dataset.a;if(a==="f")p.mode==="float"?dock(p):float(p);else if(a==="w")p.mode==="win"?dock(p):popOut(p);else if(a==="d")dock(p);};
  b.ondblclick=e=>{if(e.target.tagName!=="BUTTON")p.mode==="dock"?float(p):dock(p);};
  b.onpointerdown=e=>{if(p.mode!=="float"||e.target.tagName==="BUTTON")return;const r=p.el.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;b.setPointerCapture(e.pointerId);
    b.onpointermove=ev=>{p.el.style.left=Math.max(0,Math.min(innerWidth-80,ev.clientX-dx))+"px";p.el.style.top=Math.max(0,Math.min(innerHeight-30,ev.clientY-dy))+"px";};
    b.onpointerup=()=>{b.onpointermove=null;remember(p);};};
  return b;
}
function setBar(p){const bt=p.bar.querySelectorAll("button");
  bt[0].textContent=p.mode==="float"?"⤓ Acoplar":"⧉ Flotar";bt[0].style.display=p.mode==="win"?"none":"";
  bt[1].textContent=p.mode==="win"?"⤓ Traer aquí":"🖥 Otra ventana";}
function remember(p){const r=p.el.getBoundingClientRect();L.f[p.id]={x:r.left,y:r.top,w:r.width,h:r.height};save();}
function dock(p){
  if(p.mode==="win"){const w=p.win;p.win=null;p.mode="dock";document.adoptNode(p.el);try{w&&!w.closed&&w.close();}catch(e){}delete pops[p.id];}
  p.mode="dock";p.el.classList.remove("flt");p.el.style.cssText="";
  /* volver a su sitio */
  p.home.parent.insertBefore(p.el,p.home.next&&p.home.next.parentNode===p.home.parent?p.home.next:null);
  setBar(p);layout();after();
}
function float(p){
  if(p.mode==="win")dock(p);
  const r=p.el.getBoundingClientRect(),f=L.f[p.id]||{x:Math.max(20,r.left+30),y:Math.max(70,r.top+30),w:Math.max(320,r.width),h:Math.max(240,Math.min(r.height,innerHeight-120))};
  p.mode="float";p.el.classList.add("flt");Object.assign(p.el.style,{left:f.x+"px",top:f.y+"px",width:f.w+"px",height:f.h+"px"});
  setBar(p);layout();remember(p);after();
}
async function popOut(p){
  if(p.mode==="float")dock(p);
  const r=p.el.getBoundingClientRect();let left=Math.round(screenX+60),top=Math.round(screenY+60);
  /* si hay otro monitor, abrir ahí */
  try{if(window.screen&&screen.isExtended&&window.getScreenDetails){const d=await getScreenDetails(),me=d.currentScreen,o=d.screens.find(s=>s!==me);if(o){left=o.availLeft+40;top=o.availTop+40;}}}catch(e){}
  const w=window.open("","atr_"+p.id,`popup=yes,width=${Math.max(420,Math.round(r.width))},height=${Math.max(320,Math.round(r.height))},left=${left},top=${top}`);
  if(!w){const h=orig.gid.call(document,"dockHint");if(h){h.textContent="El navegador bloqueó la ventana nueva: permite ventanas emergentes para esta página.";h.style.display="block";setTimeout(()=>h.style.display="none",5000);}return;}
  const d=w.document;d.open();d.write("<!doctype html><html><head><meta charset=utf-8><title>"+p.title+" · Atrapacuentos Studio</title></head><body class='popbody'></body></html>");d.close();
  for(const n of Array.from(orig.qsa.call(document,"head style, head link[rel=stylesheet]")))d.head.appendChild(n.cloneNode(true));
  d.body.style.cssText="margin:0";
  d.adoptNode(p.el);d.body.appendChild(p.el);p.el.style.cssText="";p.el.classList.remove("flt");
  p.mode="win";p.win=w;pops[p.id]=p;setBar(p);layout();
  /* atajos de teclado también dentro de la ventana aparte */
  w.addEventListener("keydown",e=>{window.dispatchEvent(new KeyboardEvent("keydown",{key:e.key,ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey,bubbles:true,cancelable:true}));
    if(e.key===" "||(e.ctrlKey&&/^[zy]$/i.test(e.key)))e.preventDefault();});
  w.addEventListener("pagehide",()=>{if(p.mode==="win"&&p.win===w){p.win=null;try{document.adoptNode(p.el);}catch(e){}p.mode="float";delete pops[p.id];dock(p);}});
  w.addEventListener("resize",()=>after());
  after();
}
function after(){setTimeout(()=>{window.dispatchEvent(new Event("resize"));if(window.Serie&&Serie.draw)Serie.draw();},60);}
function init(){
  document.querySelectorAll(".pnl").forEach(el=>{const id=el.dataset.pid,p=PN[id]={id,el,title:el.dataset.title,mode:"dock",home:{parent:el.parentNode,next:el.nextSibling}};
    p.bar=mkBar(p);el.insertBefore(p.bar,el.firstChild);setBar(p);});
  layout();
  window.addEventListener("beforeunload",()=>{for(const id in pops){try{pops[id].win.close();}catch(e){}}});
  const bn=document.createElement("button");bn.textContent="🗔 Paneles";bn.id="bPanels";bn.title="Volver a acoplar todos los paneles";
  bn.onclick=()=>{for(const id in PN)if(PN[id].mode!=="dock")dock(PN[id]);};
  const top=orig.gid.call(document,"top"),ref=orig.gid.call(document,"bUndo");if(top&&ref)top.insertBefore(bn,ref);
  const hh=document.createElement("div");hh.id="dockHint";document.body.appendChild(hh);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.Panels={PN,dock,float,popOut,layout};
})();
