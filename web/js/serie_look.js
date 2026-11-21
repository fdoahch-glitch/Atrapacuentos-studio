/* Aspecto de la escena: luz, atmósfera (polvo, niebla, rayos de sol, viento, chispas), color, viñeta, brillo suave y grano.
   Todo se calcula solo con el tiempo, así la vista previa y el MP4 salen idénticos. */
(function(){
"use strict";
const rnd=(i,k)=>{const x=Math.sin(i*12.9898+k*78.233)*43758.5453;return x-Math.floor(x);},fr=x=>x-Math.floor(x);
const ATM=[["","Ninguna"],["polvo","Polvo de luz"],["niebla","Niebla suave"],["rayos","Rayos de sol"],["viento","Viento"],["chispas","Chispas mágicas"]];
let bl=null;
function atmos(g,W,H,t,k,hora){
  g.save();
  if(k==="polvo"){for(let i=0;i<70;i++){const x=fr(rnd(i,0)+Math.sin(t*.15+i)*.03+t*.01),y=fr(rnd(i,1)+Math.sin(t*.2+i*2)*.04-t*.012),r=H*(.002+rnd(i,2)*.004),a=.25+.5*Math.abs(Math.sin(t*.8+i*5));
      const gr=g.createRadialGradient(x*W,y*H,0,x*W,y*H,r*4);gr.addColorStop(0,"rgba(255,244,200,"+(a*.8).toFixed(2)+")");gr.addColorStop(1,"rgba(255,244,200,0)");g.fillStyle=gr;g.beginPath();g.arc(x*W,y*H,r*4,0,6.3);g.fill();}}
  else if(k==="niebla"){for(let i=0;i<5;i++){const y=.55+i*.1,x=fr(t*(.012+i*.004)+i*.37),gr=g.createLinearGradient(0,(y-.2)*H,0,(y+.18)*H);gr.addColorStop(0,"rgba(235,240,250,0)");gr.addColorStop(.5,"rgba(235,240,250,.2)");gr.addColorStop(1,"rgba(235,240,250,0)");
      g.fillStyle=gr;g.save();g.translate(-x*W,0);g.fillRect(0,(y-.2)*H,W*2.2,.4*H);g.restore();}}
  else if(k==="rayos"){g.globalCompositeOperation="screen";for(let i=0;i<7;i++){const x0=.1+i*.14+Math.sin(t*.2+i)*.02,w=.05+rnd(i,3)*.05,a=.06+.05*Math.sin(t*.5+i*2);
      const gr=g.createLinearGradient(x0*W,0,(x0-.18)*W,H);gr.addColorStop(0,"rgba(255,236,170,"+a.toFixed(3)+")");gr.addColorStop(1,"rgba(255,236,170,0)");g.fillStyle=gr;g.beginPath();g.moveTo(x0*W,-5);g.lineTo((x0+w)*W,-5);g.lineTo((x0+w-.28)*W,H);g.lineTo((x0-.18)*W,H);g.closePath();g.fill();}}
  else if(k==="viento"){g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=Math.max(1,H*.0025);g.lineCap="round";for(let i=0;i<14;i++){const sp=.18+rnd(i,2)*.16,p=fr(rnd(i,0)+t*sp),x=p*1.4-.2,y=.15+rnd(i,1)*.7,len=.06+rnd(i,3)*.08,a=Math.sin(p*Math.PI);
      g.globalAlpha=a*.7;g.beginPath();g.moveTo(x*W,y*H);g.bezierCurveTo((x+len*.4)*W,(y-.02)*H,(x+len*.7)*W,(y+.02)*H,(x+len)*W,y*H);g.stroke();}}
  else if(k==="chispas"){g.globalCompositeOperation="lighter";for(let i=0;i<46;i++){const p=fr(rnd(i,2)+t*(.1+rnd(i,3)*.1)),x=fr(rnd(i,0)+Math.sin(t*1.2+i)*.03),y=1-p,r=H*(.003+rnd(i,4)*.005),a=Math.sin(p*Math.PI)*(.5+.5*Math.sin(t*6+i));
      const col=i%3?"255,225,120":"190,160,255",gr=g.createRadialGradient(x*W,y*H,0,x*W,y*H,r*5);gr.addColorStop(0,"rgba("+col+","+a.toFixed(2)+")");gr.addColorStop(1,"rgba("+col+",0)");g.fillStyle=gr;g.beginPath();g.arc(x*W,y*H,r*5,0,6.3);g.fill();}}
  g.restore();
}
function apply(g,sc,t){
  const W=g.canvas.width,H=g.canvas.height,L=sc.look||{};
  if(sc.atm)atmos(g,W,H,t,sc.atm);
  /* brillo suave: una copia pequeña y borrosa se suma encima */
  if(L.bloom>0){if(!bl)bl=document.createElement("canvas");const bw=Math.max(64,W>>3),bh=Math.max(36,H>>3);if(bl.width!==bw)bl.width=bw;if(bl.height!==bh)bl.height=bh;const b=bl.getContext("2d");
    b.globalCompositeOperation="copy";b.filter="brightness(1.15) contrast(1.15) blur(1.5px)";b.drawImage(g.canvas,0,0,bw,bh);b.filter="none";
    g.save();g.globalCompositeOperation="screen";g.globalAlpha=Math.min(.85,L.bloom*.9);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(bl,0,0,W,H);g.restore();}
  /* color cálido / frío */
  if(L.calor){g.save();g.globalCompositeOperation="soft-light";g.globalAlpha=Math.min(1,Math.abs(L.calor));g.fillStyle=L.calor>0?"#ff9a3c":"#4a7dff";g.fillRect(0,0,W,H);g.restore();}
  if(L.sat!=null&&L.sat!==1){g.save();g.globalCompositeOperation=L.sat>1?"saturation":"saturation";g.globalAlpha=L.sat>1?Math.min(1,(L.sat-1)):Math.min(1,1-L.sat);g.fillStyle=L.sat>1?"#ff3a3a":"#808080";g.fillRect(0,0,W,H);g.restore();}
  if(L.vig>0){g.save();const gr=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,"rgba(0,0,0,"+Math.min(.85,L.vig)+")");g.fillStyle=gr;g.fillRect(0,0,W,H);g.restore();}
  if(L.grano>0){g.save();g.globalAlpha=Math.min(.35,L.grano*.35);g.globalCompositeOperation="overlay";const n=Math.floor(t*24),sz=Math.max(2,Math.round(W/400));
    for(let i=0;i<500;i++){const x=rnd(i,n)*W,y=rnd(i,n+7)*H;g.fillStyle=rnd(i,n+3)>.5?"#fff":"#000";g.fillRect(x,y,sz,sz);}g.restore();}
}
window.Look={ATM,apply};
})();
