/* Miniaturas: dibuja mallas con el algoritmo del pintor sobre un canvas 2D (sin WebGL) */
(function(root){
"use strict";
const T={};
/* parts: [{g:malla,m:material}] ; opts:{size,yaw,pitch,bg} */
T.render=function(parts,opts){
  opts=opts||{};const S=opts.size||160,yaw=opts.yaw==null?.6:opts.yaw,pitch=opts.pitch==null?.32:opts.pitch;
  const cv=document.createElement("canvas");cv.width=cv.height=S;
  const ctx=cv.getContext("2d");
  if(opts.bg){ctx.fillStyle=opts.bg;ctx.fillRect(0,0,S,S);}
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const view=(x,y,z)=>{const a=x*cy+z*sy,b=-x*sy+z*cy;return [a,y*cp-b*sp,y*sp+b*cp];};
  let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  const tris=[];
  for(const part of parts){
    const m=part.g,emit=part.m==="emit",glass=part.m==="glass";
    const V=[],N=[];
    for(let j=0;j<m.p.length;j+=3){
      const v=view(m.p[j],m.p[j+1],m.p[j+2]);V.push(v);
      N.push(view(m.n[j],m.n[j+1],m.n[j+2]));
      for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);}
    }
    for(let t=0;t<m.i.length;t+=3){
      const a=m.i[t],b=m.i[t+1],c=m.i[t+2];
      const nz=(N[a][2]+N[b][2]+N[c][2])/3;
      tris.push({v:[V[a],V[b],V[c]],z:(V[a][2]+V[b][2]+V[c][2])/3,
        n:[(N[a][0]+N[b][0]+N[c][0])/3,(N[a][1]+N[b][1]+N[c][1])/3,nz],
        c:[(m.c[a*3]+m.c[b*3]+m.c[c*3])/3,(m.c[a*3+1]+m.c[b*3+1]+m.c[c*3+1])/3,(m.c[a*3+2]+m.c[b*3+2]+m.c[c*3+2])/3],emit,glass});
    }
  }
  const w=hi[0]-lo[0],h=hi[1]-lo[1],k=(S*.84)/Math.max(w,h,1e-6),ox=S/2-(lo[0]+hi[0])/2*k,oy=S*.9-lo[1]*0+0;
  const px=v=>ox+v[0]*k,py=v=>S*.5+((lo[1]+hi[1])/2-v[1])*k;
  /* sombra */
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(S/2,py([0,lo[1],0])+2,w*k*.42,S*.035,0,0,6.3);ctx.fill();
  tris.sort((a,b)=>a.z-b.z);
  const L=[-.35,.75,.55],ln=Math.hypot(...L);
  for(const t of tris){
    const nl=Math.hypot(...t.n)||1,d=(t.n[0]*L[0]+t.n[1]*L[1]+t.n[2]*L[2])/(nl*ln);
    const sh=t.emit?1.15:.42+.58*Math.max(0,d);
    const col="rgb("+[0,1,2].map(i=>Math.min(255,Math.round(t.c[i]*255*sh))).join(",")+")";
    ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=.7;ctx.globalAlpha=t.glass?.8:1;
    ctx.beginPath();ctx.moveTo(px(t.v[0]),py(t.v[0]));ctx.lineTo(px(t.v[1]),py(t.v[1]));ctx.lineTo(px(t.v[2]),py(t.v[2]));ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.globalAlpha=1;
  return cv;
};
root.Thumb=T;
})(window);
