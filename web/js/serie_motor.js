/* Atrapacuentos Studio · motor de movimiento: curvas de suavizado, fotogramas clave, física y posición de cada elemento en el tiempo.
   Sin estado propio: recibe el elemento y el tiempo, devuelve la posición. */
(function(){
"use strict";
const {clamp,ease,lerp,TAU,hash}=window.SerieBase;
const sm01=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);};
const EASE={lineal:u=>u,suave:u=>u*u*(3-2*u),entrada:u=>u*u*u,salida:u=>1-Math.pow(1-u,3),
  rebote:u=>{const n=7.5625,d=2.75;if(u<1/d)return n*u*u;if(u<2/d)return n*(u-=1.5/d)*u+.75;if(u<2.5/d)return n*(u-=2.25/d)*u+.9375;return n*(u-=2.625/d)*u+.984375;},
  elastico:u=>u<=0?0:u>=1?1:Math.pow(2,-10*u)*Math.sin((u*10-.75)*(2*Math.PI/3))+1,
  retroceso:u=>{const c=1.70158;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2);},paso:u=>u<1?0:1};
function bez(x1,y1,x2,y2){return u=>{if(u<=0)return 0;if(u>=1)return 1;let lo=0,hi=1,q=u;for(let i=0;i<24;i++){const m=1-q,x=3*m*m*q*x1+3*m*q*q*x2+q*q*q;if(x<u)lo=q;else hi=q;q=(lo+hi)/2;}const m=1-q;return 3*m*m*q*y1+3*m*q*q*y2+q*q*q;};}
function easeFn(e){if(Array.isArray(e)&&e.length===4)return bez(e[0],e[1],e[2],e[3]);return EASE[e||"suave"]||EASE.suave;}
function kfVal(it,prop,t,base){
  const k=(it.kf||[]).filter(f=>f[prop]!=null).sort((a,b)=>a.t-b.t);if(!k.length)return base;
  const pts=k[0].t<=.001?[]:[{t:0,v:base}];for(const f of k)pts.push({t:f.t,v:f[prop],e:f.e});
  if(t<=pts[0].t)return pts[0].v;const L=pts[pts.length-1];if(t>=L.t)return L.v;
  for(let i=1;i<pts.length;i++){if(t<=pts[i].t){const a=pts[i-1],b=pts[i],u=easeFn(b.e)((t-a.t)/Math.max(.001,b.t-a.t));return lerp(a.v,b.v,u);}}return L.v;
}
function physSim(it,t){
  const f=it.fis,t0=f.t0||0;if(t<=t0)return {x:it.x,y:it.y,r:0};
  const g=f.g||2200,e=f.e==null?.5:f.e,suelo=f.suelo||650,rueda=f.k==="rueda",rad=f.rad||40,dt=1/120;let x=it.x,y=it.y,vx=f.vx||0,vy=rueda?0:(f.vy||0),rest=false;
  for(let tau=t0;tau<t;tau+=dt){
    if(!rueda){vy+=g*dt;y+=vy*dt;if(y>=suelo){y=suelo;if(Math.abs(vy)<90){vy=0;rest=true;}else vy=-vy*e;}}else y=suelo;
    x+=vx*dt;if(rest||rueda)vx*=Math.max(0,1-(rueda?.55:2.2)*dt);}
  return {x,y,r:rueda?(x-it.x)/rad:0};
}
function posAt(it,t){
  let x=it.x,y=it.y;const go=it.go;
  if(go){const a=go.t0||0,b=Math.max(a+.1,go.t1||a+3),u=clamp((t-a)/(b-a),0,1),e=u*.85+ease(u)*.15;x=lerp(it.x,go.x1,e);y=lerp(it.y,go.y1,e);}
  let rr=it.r||0;if(it.fis){const q=physSim(it,t);x=q.x;y=q.y;rr+=q.r;}
  return {x:kfVal(it,"x",t,x),y:kfVal(it,"y",t,y),s:kfVal(it,"s",t,it.s||1),r:kfVal(it,"r",t,rr),op:kfVal(it,"op",t,it.op==null?1:it.op)};
}
function itemPos(it,t){
  const p=posAt(it,t),a=posAt(it,t-.05),b=posAt(it,t+.05),vx=(b.x-a.x)/.1,vy=(b.y-a.y)/.1,sp=Math.hypot(vx,vy);
  const l1=posAt(it,t-.15),l2=posAt(it,t-.05),vl=(l2.x-l1.x)/.1;
  let dir=1;if(it.go)dir=it.go.x1<it.x?-1:1;else if(it.kf&&it.kf.some(f=>f.x!=null)){const ks=it.kf.filter(f=>f.x!=null).sort((a,b)=>a.t-b.t);dir=ks[ks.length-1].x<it.x?-1:1;}
  return {x:p.x,y:p.y,s:p.s,r:p.r,op:p.op,moving:sp>22,walk:sm01(20,70,sp),speed:sp,vx,vl,dir};
}
const PLANOS=[["Plano general",1],["Plano medio",1.35],["Primer plano",1.8],["Plano detalle",2.4]];
function corteAt(sc,t){const cs=sc.cortes;if(!cs||!cs.length)return null;let k=-1;for(let i=0;i<cs.length;i++)if(cs[i].t<=t+1e-6)k=i;return k<0?null:{c:cs[k],n:cs[k+1]?cs[k+1].t:sc.dur||6,i:k};}
window.SerieMotor={sm01,EASE,bez,easeFn,kfVal,physSim,posAt,itemPos,PLANOS,corteAt};
})();
