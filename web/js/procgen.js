/* Dibujo por código: ruido, texturas (corteza, roca, pasto) con mapas de relieve. No depende de Babylon. */
(function(root){
"use strict";
const imul=Math.imul;
function hash(x,y,s){let h=imul(x|0,374761393)^imul(y|0,668265263)^imul((s|0)+1,1274126177);h=imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,y,oct,s){let t=0,a=.5,f=1,n=0;for(let i=0;i<(oct||5);i++){t+=a*vnoise(x*f,y*f,(s||0)+i);n+=a;f*=2;a*=.5;}return t/n;}
function noise3(x,y,z){return (vnoise(x+y*1.31,z+x*.77,1)+vnoise(y*1.73+z,x*.91+z*1.13,2))/2;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=imul(a^a>>>15,1|a);t=t+imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function smooth(a,b,x){const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}
const mix=(a,b,t)=>a+(b-a)*t;
const mix3=(c1,c2,t)=>[mix(c1[0],c2[0],t),mix(c1[1],c2[1],t),mix(c1[2],c2[2],t)];

/* Crea dos canvas (color y mapa de normales) a partir de una función de altura y otra de color */
function texture(size,heightFn,colorFn,strength){
  const h=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)h[y*size+x]=heightFn(x/size,y/size);
  const col=document.createElement("canvas"),nor=document.createElement("canvas");
  col.width=col.height=nor.width=nor.height=size;
  const cc=col.getContext("2d"),nc=nor.getContext("2d"),ci=cc.createImageData(size,size),ni=nc.createImageData(size,size);
  const H=(x,y)=>h[((y+size)%size)*size+((x+size)%size)];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,hv=h[y*size+x],rgb=colorFn(x/size,y/size,hv);
    ci.data[i]=rgb[0];ci.data[i+1]=rgb[1];ci.data[i+2]=rgb[2];ci.data[i+3]=255;
    let dx=(H(x-1,y)-H(x+1,y))*strength,dy=(H(x,y-1)-H(x,y+1))*strength;
    const l=Math.hypot(dx,dy,1);dx/=l;dy/=l;const dz=1/l;
    ni.data[i]=(dx*.5+.5)*255;ni.data[i+1]=(dy*.5+.5)*255;ni.data[i+2]=(dz*.5+.5)*255;ni.data[i+3]=255;
  }
  cc.putImageData(ci,0,0);nc.putImageData(ni,0,0);
  return {color:col,normal:nor,heights:h};
}
function bark(size){
  return texture(size||512,(u,v)=>{
    const s=fbm(u*14,v*30,4,3),r=Math.abs(vnoise(u*12,v*22,5)-.5)*2;
    return s*.55+(1-r)*.45;
  },(u,v,h)=>mix3([46,32,22],[132,100,68],Math.min(1,Math.max(0,h*1.15-.1))),4.5);
}
function rock(size){
  return texture(size||512,(u,v)=>{
    const base=fbm(u*7,v*7,5,7),fine=fbm(u*34,v*34,3,15),pits=smooth(.68,.78,vnoise(u*44,v*44,9)),cracks=smooth(.48,.5,fbm(u*8,v*8,3,11))*.3;
    return Math.max(0,base*.55+fine*.3-pits*.4-cracks+.1);
  },(u,v,h)=>{
    const grain=fbm(u*60,v*60,2,31);
    let c=mix3([92,88,84],[168,160,148],Math.min(1,Math.max(0,h*1.2+(grain-.5)*.35)));
    const moss=smooth(.66,.8,fbm(u*5,v*5,4,21));
    return mix3(c,[80,106,60],moss*.4);
  },6);
}
function grass(size){
  return texture(size||512,(u,v)=>fbm(u*32,v*32,4,4),(u,v,h)=>{
    const patch=fbm(u*4,v*4,3,13);
    return mix3(mix3([52,98,40],[112,156,60],h),[160,150,70],smooth(.55,.75,patch)*.5);
  },2);
}
root.Proc={hash,vnoise,fbm,noise3,mulberry32,smooth,mix3,texture,bark,rock,grass};
})(typeof window!=="undefined"?window:globalThis);
