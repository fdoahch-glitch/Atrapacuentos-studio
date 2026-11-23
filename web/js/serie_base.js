/* Atrapacuentos Studio · piezas básicas compartidas del editor (utilidades, tablas y migración de proyectos).
   Sin estado propio: solo funciones y datos. Las usan serie.js y serie_motor.js. */
(function(){
"use strict";
const A=window.SerieArt,Rig=window.SerieRig;
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=()=>"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=u=>u*u*(3-2*u),TAU=Math.PI*2;
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};
const SPD=Object.fromEntries(A.SP.map(s=>[s.id,s]));
const BGS=Object.fromEntries(A.BG.map(b=>[b.id,b]));
const DEPTH={arbol:45,pino:45,araucaria:40,palmera:45,helecho:50,casa:45,carpa:50,volcan:15,arcoiris:8,nube:10,sol:6,luna:6,estrella:8,pajaros:12,estalactita:20,flores:70,pasto:72,arbusto:66,hongo:68,roca:64,rocas:62,huellas:70};
const FMT={"16:9":{n:"Horizontal 16:9 (YouTube)",w:1280,h:720},"9:16":{n:"Vertical 9:16 (Shorts, Reels, TikTok)",w:405,h:720},"1:1":{n:"Cuadrado 1:1 (Instagram)",w:720,h:720}};
const BASES=[[720,"720p (HD)"],[1080,"1080p (Full HD)"],[1440,"1440p (2K)"],[2160,"2160p (4K)"]];
function rdp(P,eps){if(P.length<3)return P;let mx=0,ix=0;const a=P[0],b=P[P.length-1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;
  for(let i=1;i<P.length-1;i++){const d=Math.abs((P[i].x-a.x)*dy-(P[i].y-a.y)*dx)/L;if(d>mx){mx=d;ix=i;}}
  if(mx<=eps)return [a,b];return rdp(P.slice(0,ix+1),eps).slice(0,-1).concat(rdp(P.slice(ix),eps));}
const VEST_PRE={explorador:{n:"🧭 Explorador",pal:{camisa:"#6a8f4a",pantalon:"#b9a46a",zapato:"#5b3a22",gorro:"#d9b878",lentes:null,mochila:"#d9602b",bufanda:null,capa:null}},
  invierno:{n:"❄️ Invierno",pal:{camisa:"#3f6fb5",pantalon:"#2d3550",zapato:"#2a2a2a",gorro:"#d33f49",lentes:null,mochila:null,bufanda:"#d33f49",capa:null}},
  heroe:{n:"🦸 Héroe",pal:{camisa:"#d33f49",pantalon:"#2a3f8f",zapato:"#2a2a2a",gorro:null,lentes:"#2a2a2a",mochila:null,bufanda:null,capa:"#6a3fb5"}}};
const FORMATO=4;
const MIG={
  3:p=>{/* v3 → v4: listas siempre presentes y sin restos de datos temporales */
    for(const sc of p.mundos||[])for(const it of sc.items||[]){if(it.acc&&!Array.isArray(it.acc))it.acc=[];delete it.dubLv;delete it.dubVis;delete it.dubExpr;delete it.marRot;}
    if(p.vestuarios&&typeof p.vestuarios!=="object")delete p.vestuarios;}
};
function migrar(p){let v=+p.v||1;while(v<FORMATO){if(MIG[v])MIG[v](p);v++;}p.v=FORMATO;return p;}
window.SerieBase={A,Rig,$,esc,uid,lerp,clamp,ease,TAU,hash,SPD,BGS,DEPTH,FMT,BASES,rdp,VEST_PRE,FORMATO,MIG,migrar};
})();
