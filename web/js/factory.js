/* Personajes de fábrica con esqueleto: se dibujan por código y ya vienen con sus puntos marcados.
   Caminan, mueven brazos y piernas, parpadean y hablan igual que los que el niño dibuja. */
(function(){
"use strict";
const W=360,H=580,CX=180;
/* puntos comunes (el dibujo mira de frente; "L" es el lado izquierdo de la imagen) */
const PTS=()=>({top:{x:CX,y:40},neck:{x:CX,y:190},hip:{x:CX,y:340},handL:{x:62,y:352},handR:{x:298,y:352},footL:{x:140,y:552},footR:{x:220,y:552},eyeL:{x:CX-32,y:116},eyeR:{x:CX+32,y:116},mouth:{x:CX,y:158}});
const INK="#3a2a2a";
function mk(){const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,W,H);g.lineJoin="round";g.lineCap="round";return [c,g];}
function limb(g,x1,y1,x2,y2,w,col,ink){
  g.strokeStyle=ink||INK;g.lineWidth=w+7;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
  g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
}
function ell(g,x,y,rx,ry,col,ink,lw){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.3);g.fill();if(ink!==null){g.strokeStyle=ink||INK;g.lineWidth=lw||4;g.stroke();}}
function poly(g,P,col,ink,lw){g.fillStyle=col;g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();if(ink!==null){g.strokeStyle=ink||INK;g.lineWidth=lw||4;g.stroke();}}
function eyes(g,y,dx,r){for(const s of [-1,1]){ell(g,CX+s*dx,y,r,r*1.15,"#2a1a1a",null);ell(g,CX+s*dx+r*.3,y-r*.4,r*.35,r*.35,"#ffffff",null);}}
/* contorno peludo: óvalo con puntas */
function fur(g,x,y,rx,ry,col,n,spike,ink){
  g.fillStyle=col;g.strokeStyle=ink||INK;g.lineWidth=3.5;g.beginPath();
  for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,k=i%2?1:1+spike;g.lineTo(x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k);}
  g.closePath();g.fill();g.stroke();
}

/* ---------- cada personaje ---------- */
function cerdito(){
  const [c,g]=mk(),P="#f6b3bd",D="#e68a98";
  limb(g,150,340,140,540,46,P);limb(g,210,340,220,540,46,P);
  ell(g,140,548,32,15,"#7a4a4a");ell(g,220,548,32,15,"#7a4a4a");
  limb(g,128,222,70,345,38,P);limb(g,232,222,290,345,38,P);
  ell(g,CX,270,70,86,P);ell(g,CX,290,44,52,"#fbd0d6",null);
  /* overol azul */
  poly(g,[[130,260],[230,260],[238,350],[122,350]],"#3b6fd1");ell(g,CX,262,10,10,"#ffd23f");
  poly(g,[[112,128],[140,52],[176,92]],D);poly(g,[[248,128],[220,52],[184,92]],D);
  ell(g,CX,118,82,76,P);
  eyes(g,116,32,10);
  ell(g,CX,150,34,25,"#f08c9e");ell(g,CX-12,150,6,9,"#9a3a52",null);ell(g,CX+12,150,6,9,"#9a3a52",null);
  return [c,{...PTS(),mouth:{x:CX,y:162}},"#f6b3bd"];
}
function lobo(){
  const [c,g]=mk(),G="#7d8798",L="#a9b2c2";
  limb(g,150,340,140,540,50,G);limb(g,210,340,220,540,50,G);
  poly(g,[[108,552],[172,552],[168,534],[112,534]],"#3d4452");poly(g,[[188,552],[252,552],[248,534],[192,534]],"#3d4452");
  limb(g,128,222,70,345,40,G);limb(g,232,222,290,345,40,G);
  ell(g,62,356,20,18,L);ell(g,298,356,20,18,L);
  fur(g,CX,272,68,88,G,16,.07);ell(g,CX,290,36,54,L,null);
  /* orejas puntiagudas */
  poly(g,[[110,112],[112,30],[160,76]],G);poly(g,[[250,112],[248,30],[200,76]],G);
  poly(g,[[121,92],[122,52],[146,78]],"#e8a5ad",null);poly(g,[[239,92],[238,52],[214,78]],"#e8a5ad",null);
  fur(g,CX,118,82,72,G,14,.06);
  ell(g,CX,150,44,34,L);
  for(const s of [-1,1]){poly(g,[[CX+s*30,112],[CX+s*8,126],[CX+s*38,128]],"#ffd23f",null);ell(g,CX+s*28,120,5,7,"#222",null);}
  poly(g,[[CX-12,128],[CX+12,128],[CX,142]],"#222");
  poly(g,[[CX-22,162],[CX-14,176],[CX-6,162]],"#fff",null);poly(g,[[CX+22,162],[CX+14,176],[CX+6,162]],"#fff",null);
  return [c,{...PTS(),top:{x:CX,y:34},eyeL:{x:CX-28,y:120},eyeR:{x:CX+28,y:120},mouth:{x:CX,y:164}},"#a9b2c2"];
}
function caperucita(){
  const [c,g]=mk(),SK="#f6cfa8",R="#d9322f";
  limb(g,152,350,146,540,34,SK);limb(g,208,350,214,540,34,SK);
  ell(g,142,552,32,14,"#5a2a1a");ell(g,218,552,32,14,"#5a2a1a");
  limb(g,128,222,72,346,32,"#f0e6d8");limb(g,232,222,288,346,32,"#f0e6d8");ell(g,64,356,17,16,SK);ell(g,296,356,17,16,SK);
  poly(g,[[130,200],[230,200],[262,380],[98,380]],"#f4f0e6");poly(g,[[122,206],[238,206],[286,420],[74,420]],R);
  poly(g,[[158,200],[202,200],[CX,232]],"#f4f0e6",null);
  /* cabello y capucha */
  ell(g,CX,118,84,80,R);ell(g,CX,128,60,62,SK);
  poly(g,[[120,100],[240,100],[222,82],[138,82]],"#8a4a1f",null);
  eyes(g,120,26,9);ell(g,CX-44,140,9,6,"#f09a9a",null);ell(g,CX+44,140,9,6,"#f09a9a",null);
  g.strokeStyle="#a03030";g.lineWidth=4;g.beginPath();g.arc(CX,152,10,.2,Math.PI-.2);g.stroke();
  return [c,{...PTS(),eyeL:{x:CX-26,y:120},eyeR:{x:CX+26,y:120},mouth:{x:CX,y:158}},SK];
}
function humano(ropa,pelo,pant,falda){
  return ()=>{
    const [c,g]=mk(),SK="#f2c9a0";
    if(!falda){limb(g,152,350,146,540,36,pant);limb(g,208,350,214,540,36,pant);}
    else{limb(g,152,380,146,540,30,SK);limb(g,208,380,214,540,30,SK);}
    ell(g,140,552,32,14,"#3a3a4a");ell(g,220,552,32,14,"#3a3a4a");
    limb(g,126,222,70,346,34,ropa);limb(g,234,222,290,346,34,ropa);ell(g,62,356,17,16,SK);ell(g,298,356,17,16,SK);
    poly(g,[[126,200],[234,200],[240,360],[120,360]],ropa);
    if(falda)poly(g,[[120,330],[240,330],[272,420],[88,420]],pant);
    else poly(g,[[120,330],[240,330],[236,372],[124,372]],pant);
    ell(g,CX,118,80,78,SK);
    if(falda){ell(g,CX-76,150,18,60,pelo);ell(g,CX+76,150,18,60,pelo);}
    poly(g,[[100,110],[CX,28],[260,110],[240,86],[CX,58],[120,86]],pelo);
    eyes(g,118,28,9);ell(g,CX-46,140,9,6,"#f09a9a",null);ell(g,CX+46,140,9,6,"#f09a9a",null);
    g.strokeStyle="#a03030";g.lineWidth=4;g.beginPath();g.arc(CX,150,12,.2,Math.PI-.2);g.stroke();
    return [c,{...PTS(),eyeL:{x:CX-28,y:118},eyeR:{x:CX+28,y:118},mouth:{x:CX,y:158}},SK];
  };
}
const LISTA=[
  {k:"cerdito",n:"Cerdito",e:"🐷",f:cerdito},
  {k:"lobo",n:"Lobo",e:"🐺",f:lobo},
  {k:"caperucita",n:"Caperucita",e:"🧣",f:caperucita},
  {k:"nino",n:"Niño",e:"🧒",f:humano("#f0902a","#3b2418","#3b6fd1",false)},
  {k:"nina",n:"Niña",e:"👧",f:humano("#b24fd0","#6b3410","#2f9e8f",true)}
];
function crear(k){
  const d=LISTA.find(x=>x.k===k);if(!d)return null;
  const [c,pts]=d.f();
  return {id:"mi"+Date.now().toString(36)+k,nombre:d.n,kind:"puppet",src:c.toDataURL("image/png"),w:W,h:H,cat:"personaje",alto:3.2,pts,tol:40,set:{suav:.6,vel:1,amp:1,parp:true,fsz:1}};
}
let box=null;
function open(done){
  if(!box){
    box=document.createElement("div");box.id="fabBox";box.className="modal";
    box.innerHTML=`<div class="mbox" style="max-width:620px"><h2>🧸 Personajes listos</h2><p>Elige uno: ya camina, mueve brazos y piernas, parpadea y habla.</p><div id="fabList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px"></div><div class="wnav"><button id="fabX">Cerrar</button></div></div>`;
    document.body.appendChild(box);
    $("fabX").onclick=()=>{box.hidden=true;};
    const L=$("fabList");
    LISTA.forEach(d=>{
      const b=document.createElement("button");b.style.cssText="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px";
      const [c]=d.f(),im=document.createElement("canvas");im.width=90;im.height=140;
      const gg=im.getContext("2d");gg.fillStyle="#fff";gg.fillRect(0,0,90,140);gg.drawImage(c,0,0,90,140);im.style.cssText="border-radius:8px";
      b.appendChild(im);b.appendChild(document.createTextNode(d.e+" "+d.n));
      b.onclick=()=>{box.hidden=true;const m=crear(d.k);if(m&&box._done)box._done(m);};
      L.appendChild(b);
    });
  }
  box._done=done;box.hidden=false;
}
function $(id){return document.getElementById(id);}
window.Factory={open,crear,LISTA};
function init(){
  const a=$("acFab");if(a)a.onclick=()=>{$("addChar").hidden=true;open(m=>window.Studio.addPuppet(m));};
}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
