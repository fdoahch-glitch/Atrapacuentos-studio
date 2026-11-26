/* Herramientas de audio del doblaje: editar una voz (recortar, volumen, fundidos, tono, normalizar)
   y efectos de sonido creados por código (sin descargar nada). */
(function(){
"use strict";
const SR=44100;

/* ---------- editar una voz ---------- */
function process(buf,o){
  const sr=buf.sampleRate,src=buf.getChannelData(0);
  const a=Math.max(0,Math.round((o.trimA||0)*sr)),b=Math.min(src.length,Math.round((o.trimB==null?buf.duration:o.trimB)*sr));
  let seg=src.slice(a,Math.max(a+1,b));
  const r=Math.pow(2,(o.semi||0)/12);
  if(Math.abs(r-1)>1e-3){const n=Math.max(1,Math.floor(seg.length/r)),out=new Float32Array(n);
    for(let i=0;i<n;i++){const p=i*r,k=Math.floor(p),f=p-k;out[i]=(seg[k]||0)*(1-f)+(seg[k+1]||0)*f;}seg=out;}
  if(o.noiseReduction>0){
    // Puerta suave adaptativa: estima el piso de ruido en los extremos y atenúa solo los bloques débiles.
    // No sustituye una restauración espectral; evita cortar consonantes mediante ataque/liberación gradual.
    const hop=Math.max(64,Math.round(sr*.01)),edge=Math.min(Math.round(sr*.3),Math.floor(seg.length/4));
    const rms=(a,b)=>{let q=0,n=Math.max(1,b-a);for(let i=a;i<b;i+=2)q+=seg[i]*seg[i];return Math.sqrt(q/Math.max(1,Math.ceil(n/2)));};
    const floor=Math.min(rms(0,edge),rms(Math.max(0,seg.length-edge),seg.length));
    const threshold=Math.max(.0015,floor*2.6),amount=Math.max(0,Math.min(1,o.noiseReduction));let gain=1;
    for(let a=0;a<seg.length;a+=hop){const b=Math.min(seg.length,a+hop),level=rms(a,b);let target=1;
      if(level<threshold*2){const speech=Math.max(0,Math.min(1,(level/threshold-.25)/1.75));target=1-amount*(1-speech)*.85;}
      gain+=(target-gain)*(target<gain?.55:.16);for(let i=a;i<b;i++)seg[i]*=gain;
    }
  }
  if(o.normalize){let m=0;for(let i=0;i<seg.length;i++)m=Math.max(m,Math.abs(seg[i]));if(m>1e-4){const k=.92/m;for(let i=0;i<seg.length;i++)seg[i]*=k;}}
  const g=Math.pow(10,(o.gainDb||0)/20);
  const fi=Math.round((o.fadeIn||0)*sr),fo=Math.round((o.fadeOut||0)*sr),n=seg.length;
  for(let i=0;i<n;i++){let v=seg[i]*g;if(fi&&i<fi)v*=i/fi;if(fo&&i>n-fo)v*=(n-i)/fo;seg[i]=Math.max(-1,Math.min(1,v));}
  return {data:seg,sr};
}
/* ¿cuántos segundos duran los silencios del principio y del final? (para «Recortar silencios») */
function silenceBounds(buf){
  const d=buf.getChannelData(0),sr=buf.sampleRate,hop=Math.round(sr/100);let m=0;
  for(let i=0;i<d.length;i+=8)m=Math.max(m,Math.abs(d[i]));
  const th=Math.max(.01,m*.06);let a=0,b=d.length-1;
  while(a<d.length&&Math.abs(d[a])<th)a++;while(b>a&&Math.abs(d[b])<th)b--;
  return [Math.max(0,a/sr-.08),Math.min(buf.duration,b/sr+.15)];
}

/* ---------- efectos de sonido ---------- */
let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},noise=()=>rnd()*2-1;
const buf=s=>new Float32Array(Math.round(s*SR));
const ex=(t,k)=>Math.exp(-t*k);
function lpf(x,a){let y=0;for(let i=0;i<x.length;i++){y+=a*(x[i]-y);x[i]=y;}return x;}
function norm(x,peak){let m=0;for(const v of x)m=Math.max(m,Math.abs(v));if(m>0){const k=peak/m;for(let i=0;i<x.length;i++)x[i]*=k;}return x;}
const FX={
  pasos:["👣 Pasos",()=>{const x=buf(2.6);for(let s=0;s<6;s++){const t0=Math.round((.15+s*.38)*SR);for(let i=0;i<.14*SR;i++){const t=i/SR;x[t0+i]+=(noise()*.5+Math.sin(2*Math.PI*85*t))*ex(t,28)*.7;}}return norm(lpf(x,.35),.8);}],
  puerta:["🚪 Tocar la puerta",()=>{const x=buf(1.3);for(let k=0;k<3;k++){const t0=Math.round((.1+k*.3)*SR);for(let i=0;i<.18*SR;i++){const t=i/SR;x[t0+i]+=(Math.sin(2*Math.PI*(150-60*t*4)*t)*.9+noise()*.25*ex(t,60))*ex(t,22);}}return norm(x,.85);}],
  viento:["🌬 Viento",()=>{const x=buf(3.6);for(let i=0;i<x.length;i++){const t=i/SR;x[i]=noise()*(.55+.45*Math.sin(t*1.7))*Math.min(1,t*2,(3.6-t)*2);}return norm(lpf(lpf(x,.08),.12),.55);}],
  lluvia:["🌧 Lluvia",()=>{const x=buf(3.6),y=new Float32Array(x.length);for(let i=0;i<x.length;i++){const t=i/SR;x[i]=noise()*Math.min(1,t*3,(3.6-t)*3);y[i]=x[i];}lpf(y,.15);for(let i=0;i<x.length;i++)x[i]-=y[i];return norm(x,.5);}],
  trueno:["⛈ Trueno",()=>{const x=buf(3.2);for(let i=0;i<x.length;i++){const t=i/SR;x[i]=(noise()*.8+Math.sin(2*Math.PI*48*t))*Math.min(1,t*20)*ex(t,1.1);}return norm(lpf(x,.04),.95);}],
  campana:["🔔 Campanita",()=>{const x=buf(2.4);const P=[[1,1],[2.4,.6],[3.01,.5],[4.2,.35]];for(let i=0;i<x.length;i++){const t=i/SR;let v=0;for(const [m,a] of P)v+=a*Math.sin(2*Math.PI*660*m*t)*ex(t,2.2+m);x[i]=v;}return norm(x,.7);}],
  magia:["✨ Magia",()=>{const x=buf(1.8),N=[784,988,1175,1568,1976];N.forEach((f,k)=>{const t0=Math.round(k*.13*SR);for(let i=0;i<.6*SR&&t0+i<x.length;i++){const t=i/SR;x[t0+i]+=(Math.sin(2*Math.PI*f*t)+.4*Math.sin(2*Math.PI*f*2.01*t))*ex(t,5)*.4;}});for(let i=0;i<x.length;i++){const t=i/SR;x[i]+=noise()*.05*Math.max(0,Math.sin(t*38))*ex(t,1.5);}return norm(x,.7);}],
  boing:["🪀 Boing",()=>{const x=buf(.7);let ph=0;for(let i=0;i<x.length;i++){const t=i/SR,f=180+520*ex(t,7)+25*Math.sin(t*50);ph+=2*Math.PI*f/SR;x[i]=Math.sin(ph)*ex(t,4.5);}return norm(x,.8);}],
  aplausos:["👏 Aplausos",()=>{const x=buf(2.8);for(let k=0;k<170;k++){const t0=Math.round(rnd()*2.5*SR),a=.4+rnd()*.6;for(let i=0;i<.035*SR&&t0+i<x.length;i++)x[t0+i]+=noise()*a*ex(i/SR,110);}for(let i=0;i<x.length;i++){const t=i/SR;x[i]*=Math.min(1,t*4,(2.8-t)*2);}return norm(x,.7);}],
  pajaros:["🐦 Pajaritos",()=>{const x=buf(2.6);[[.1,3200],[.4,3900],[.55,3000],[1.3,3600],[1.5,4200],[1.7,3300]].forEach(([s,f0])=>{const t0=Math.round(s*SR);let ph=0;for(let i=0;i<.14*SR;i++){const t=i/SR,f=f0+1200*Math.sin(t*38)+900*t*7;ph+=2*Math.PI*f/SR;x[t0+i]+=Math.sin(ph)*Math.sin(Math.PI*i/(.14*SR))*.6;}});return norm(x,.55);}],
  burbuja:["🫧 Burbuja",()=>{const x=buf(.35);let ph=0;for(let i=0;i<x.length;i++){const t=i/SR,f=300+1400*t*3;ph+=2*Math.PI*f/SR;x[i]=Math.sin(ph)*ex(t,12);}return norm(x,.7);}],
  exito:["🎉 Éxito",()=>{const x=buf(1.1);[[0,523],[.18,659],[.36,784],[.6,1047]].forEach(([s,f])=>{const t0=Math.round(s*SR);for(let i=0;i<.45*SR&&t0+i<x.length;i++){const t=i/SR;x[t0+i]+=(Math.sin(2*Math.PI*f*t)+.3*Math.sin(2*Math.PI*f*2*t))*ex(t,5)*.5;}});return norm(x,.75);}],
  error:["😬 Uy, no",()=>{const x=buf(.9);let ph=0;for(let i=0;i<x.length;i++){const t=i/SR,f=260-110*t+14*Math.sin(t*38);ph+=2*Math.PI*f/SR;x[i]=(Math.sin(ph)+.5*Math.sin(ph*2))*ex(t,2.2);}return norm(x,.75);}]
};
function makeSfx(key){seed=7;const d=FX[key];if(!d)return null;return {data:d[1](),sr:SR,nombre:d[0].replace(/^\S+\s/,"")};}
const list=()=>Object.keys(FX).map(k=>[k,FX[k][0]]);
window.DubFX={process,silenceBounds,makeSfx,list};
})();
