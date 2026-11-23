/* Detección automática de partes (sin IA en la nube, sin descargas): analiza la silueta del dibujo
   y propone cabeza, cuello, torso, brazos, manos, piernas y pies. Todo se puede corregir a mano en el Taller.
   También: recorte con un clic (crece una región por color sin cruzar bordes). */
(function(){
"use strict";
const WORK=300;
function leer(img){
  const W=img.width,H=img.height,s=Math.min(1,WORK/Math.max(W,H)),w=Math.max(8,Math.round(W*s)),h=Math.max(8,Math.round(H*s));
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(img,0,0,w,h);
  const D=g.getImageData(0,0,w,h).data,A=new Uint8Array(w*h);for(let i=0;i<w*h;i++)A[i]=D[i*4+3]>40?1:0;
  return {w,h,s,A,D,W,H};
}
/* tramos de píxeles opacos en una fila: [[x0,x1],…] (se ignoran huecos de 2 px o menos) */
function runs(R,y,gap){
  const {w,A}=R,out=[];let a=-1,last=-9;gap=gap==null?2:gap;
  for(let x=0;x<w;x++){if(A[y*w+x]){if(a<0)a=x;else if(x-last>gap+1){out.push([a,last]);a=x;}last=x;}}
  if(a>=0)out.push([a,last]);return out;
}
/* mide la silueta fila por fila */
function perfil(R){
  const {h}=R,rows=[];let top=-1,bot=-1;
  for(let y=0;y<h;y++){const r=runs(R,y);rows.push(r);if(r.length){if(top<0)top=y;bot=y;}}
  return {rows,top,bot};
}
const wid=r=>r.reduce((a,b)=>a+b[1]-b[0]+1,0);
const ext=r=>r.length?[r[0][0],r[r.length-1][1]]:[0,0];
/* Devuelve {ok, bones, hitos:[{id,nombre,x,y,conf}], nota} en coordenadas de la imagen original */
function detectar(img){
  const R=leer(img),P=perfil(R),{rows,top,bot}=P;
  if(top<0||bot-top<20)return {ok:false,nota:"No encontré un dibujo con fondo transparente. Usa un PNG sin fondo, o pon los huesos a mano."};
  const H=bot-top+1,Y=f=>top+Math.round(f*H);
  let conf=1;const notas=[];
  /* 1) piernas: de abajo hacia arriba, donde hay dos tramos grandes separados */
  let crotch=-1;
  for(let y=bot;y>=top+H*.35;y--){const r=rows[y];const big=r.filter(s=>s[1]-s[0]>=2);if(big.length>=2){crotch=y;}else if(big.length===1&&crotch>=0&&y<crotch-3){break;}}
  /* crotch = fila más alta con dos tramos (la entrepierna queda justo arriba) */
  let hayPiernas=crotch>=0&&bot-crotch>H*.12;
  if(!hayPiernas){crotch=Y(.58);conf*=.6;notas.push("No vi dos piernas separadas; las puse a la mitad del dibujo.");}
  else crotch=Math.max(top+Math.round(H*.4),crotch-1);
  const legY=Math.min(bot-2,crotch+Math.round((bot-crotch)*.2));
  const lr=runs(R,legY).filter(s=>s[1]-s[0]>=2);
  let lcx=[0,0];
  if(hayPiernas&&lr.length>=2){const a=lr[0],b=lr[lr.length-1];lcx=[(a[0]+a[1])/2,(b[0]+b[1])/2];}
  else{const e=ext(rows[legY]);const m=(e[0]+e[1])/2,q=(e[1]-e[0])/4;lcx=[m-q,m+q];}
  const fr=runs(R,bot-2).filter(s=>s[1]-s[0]>=2);
  let fcx=[lcx[0],lcx[1]];if(hayPiernas&&fr.length>=2){fcx=[(fr[0][0]+fr[0][1])/2,(fr[fr.length-1][0]+fr[fr.length-1][1])/2];}
  /* 2) cabeza y cuello: el punto más angosto entre el 8% y el 40% superior (si no hay, la cabeza es 1/4) */
  let neck=-1,nw=1e9,maxHead=0;
  for(let y=top+Math.round(H*.05);y<top+H*.4;y++){const w0=wid(rows[y]);if(w0>maxHead)maxHead=w0;}
  for(let y=top+Math.round(H*.12);y<top+H*.42;y++){const w0=wid(rows[y]);if(w0>0&&w0<nw&&maxHead>0&&w0<maxHead*.8){nw=w0;neck=y;}}
  if(neck<0){neck=Y(.24);conf*=.7;notas.push("No vi cuello marcado; la cabeza es el cuarto de arriba.");}
  const headC=(()=>{const rs=[];for(let y=top;y<neck;y++){const e=ext(rows[y]);rs.push((e[0]+e[1])/2);}return rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:ext(rows[neck])[0];})();
  /* 3) torso y brazos: en la fila del hombro miro cuánto sobresale a cada lado */
  const shY=Math.min(crotch-4,neck+Math.max(4,Math.round((crotch-neck)*.14)));
  const waistY=Math.round(neck+(crotch-neck)*.8);
  const we=ext(rows[waistY]),wm=(we[0]+we[1])/2,wh=Math.max(6,(we[1]-we[0])/2);
  const se=ext(rows[shY]);
  const tx=wm;
  /* tronco = lo más angosto entre hombro y cintura; lo que sobra a los lados son los brazos */
  let tHalf=wh;for(let y=shY+Math.round((crotch-shY)*.3);y<=waistY;y++){const e=ext(rows[y]);tHalf=Math.min(tHalf,Math.max(6,(e[1]-e[0])/2));}
  let minX=1e9,maxX=-1;for(let y=shY;y<=crotch+Math.round(H*.1);y++){const e=ext(rows[y]);if(!rows[y].length)continue;if(e[0]<minX)minX=e[0];if(e[1]>maxX)maxX=e[1];}
  const armL=(minX<tx-tHalf*1.25),armR=(maxX>tx+tHalf*1.25);
  const hand=(side)=>{ /* punto más bajo de la franja exterior */
    const lim=side<0?tx-tHalf*1.05:tx+tHalf*1.05;let best=null;
    for(let y=shY;y<=Math.min(bot,crotch+Math.round(H*.1));y++){const r=rows[y];for(const s of r){
      if(side<0&&s[0]<lim){const xx=Math.max(s[0],0);if(!best||y>=best[1])best=[(s[0]+Math.min(s[1],lim))/2,y];}
      if(side>0&&s[1]>lim){if(!best||y>=best[1])best=[(Math.max(s[0],lim)+s[1])/2,y];}}}
    return best;};
  const shoulder=(side)=>[tx+side*Math.max(tHalf*.85,6),shY+2];
  let hl=armL?hand(-1):null,hr=armR?hand(1):null;
  if(!armL){hl=[tx-tHalf-4,Math.round(shY+(crotch-shY)*.85)];conf*=.85;}
  if(!armR){hr=[tx+tHalf+4,Math.round(shY+(crotch-shY)*.85)];conf*=.85;}
  if(!armL&&!armR)notas.push("Los brazos van pegados al cuerpo; ajusta las manos si quieres.");
  /* 4) arma los huesos con el mismo formato que la plantilla «Persona» */
  const k=1/R.s,pt=(x,y)=>[x*k,y*k];
  const kneeY=Math.round((crotch+bot)/2),hipY=crotch-Math.round(H*.03);
  const mk=(n,role,pv,tip,par)=>({n,role,pv,tip,par});
  const defs=[
    mk("cuerpo","cuerpo",pt(tx,Math.round((shY+crotch)/2)),pt(tx,neck+2),null),
    mk("cabeza","cabeza",pt(headC,neck),pt(headC,top),"cuerpo"),
    mk("brazo_i","brazo",pt(...shoulder(-1)),pt(hl[0],hl[1]),"cuerpo"),
    mk("brazo_d","brazo",pt(...shoulder(1)),pt(hr[0],hr[1]),"cuerpo"),
    mk("muslo_i","muslo",pt(lcx[0],hipY),pt(lcx[0],kneeY),"cuerpo"),mk("canilla_i","canilla",pt(lcx[0],kneeY),pt(fcx[0],bot),"muslo_i"),
    mk("muslo_d","muslo",pt(lcx[1],hipY),pt(lcx[1],kneeY),"cuerpo"),mk("canilla_d","canilla",pt(lcx[1],kneeY),pt(fcx[1],bot),"muslo_d")];
  const ids={};const bones=defs.map((d,i)=>{const o={id:"b"+(i+1),name:d.n,role:d.role,pv:d.pv,tip:d.tip,parent:null,atras:false,brush:[],auto:true};ids[d.n]=o.id;o._p=d.par;return o;});
  bones.forEach(o=>{if(o._p)o.parent=ids[o._p];delete o._p;});
  /* el cuerpo se dibuja del torso hacia el cuello: su pivote queda en la cadera */
  const hitos=[
    {id:"cabeza",nombre:"Cabeza",p:pt(headC,(top+neck)/2)},{id:"cuello",nombre:"Cuello",p:pt(ext(rows[neck])[0]/2+ext(rows[neck])[1]/2,neck)},
    {id:"torso",nombre:"Torso",p:pt(tx,(shY+crotch)/2)},
    {id:"hombro_i",nombre:"Hombro izq.",p:pt(...shoulder(-1))},{id:"hombro_d",nombre:"Hombro der.",p:pt(...shoulder(1))},
    {id:"mano_i",nombre:"Mano izq.",p:pt(hl[0],hl[1]),conf:armL?1:.5},{id:"mano_d",nombre:"Mano der.",p:pt(hr[0],hr[1]),conf:armR?1:.5},
    {id:"cadera",nombre:"Cadera",p:pt(tx,crotch)},
    {id:"rodilla_i",nombre:"Rodilla izq.",p:pt(lcx[0],kneeY)},{id:"rodilla_d",nombre:"Rodilla der.",p:pt(lcx[1],kneeY)},
    {id:"pie_i",nombre:"Pie izq.",p:pt(fcx[0],bot)},{id:"pie_d",nombre:"Pie der.",p:pt(fcx[1],bot)}];
  /* "izq." = el lado izquierdo de la imagen */
  return {ok:true,bones,hitos,conf:Math.round(conf*100)/100,notas,face:1};
}
/* ---------- recorte con un clic ---------- */
/* crece desde (x,y) (coordenadas de la imagen) por color parecido; devuelve contornos en coordenadas de la imagen */
function recorteClic(img,x,y,tol){
  const R=leer(img),{w,h,A,D}=R,N=w*h;tol=tol==null?38:tol;
  const sx=Math.max(0,Math.min(w-1,Math.round(x*R.s))),sy=Math.max(0,Math.min(h-1,Math.round(y*R.s))),s0=sy*w+sx;
  if(!A[s0])return {polys:[],area:0};
  /* color de referencia: promedio local 3x3 para no depender de un píxel ruidoso */
  let r=0,g=0,b=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=sx+dx,yy=sy+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const i=yy*w+xx;if(!A[i])continue;r+=D[i*4];g+=D[i*4+1];b+=D[i*4+2];n++;}
  r/=n;g/=n;b/=n;
  const m=new Uint8Array(N),q=[s0];m[s0]=1;let area=0;
  const dist=i=>Math.abs(D[i*4]-r)+Math.abs(D[i*4+1]-g)+Math.abs(D[i*4+2]-b);
  while(q.length){const a=q.pop();area++;const ax=a%w,ay=(a/w)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=ax+dx,yy=ay+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const bI=yy*w+xx;
      if(m[bI]||!A[bI])continue;
      /* no cruzar un borde fuerte entre vecinos (evita que se derrame por degradados suaves) */
      const step=Math.abs(D[a*4]-D[bI*4])+Math.abs(D[a*4+1]-D[bI*4+1])+Math.abs(D[a*4+2]-D[bI*4+2]);
      if(dist(bI)<=tol*3&&step<=tol*1.6){m[bI]=1;q.push(bI);}}}
  /* cerrar huequitos y agrandar 1 px para que la pieza traslape un poco con las vecinas */
  const o=m.slice();for(let yy=1;yy<h-1;yy++)for(let xx=1;xx<w-1;xx++){const i=yy*w+xx;if(!m[i]&&A[i]&&(m[i-1]+m[i+1]+m[i-w]+m[i+w])>=3)o[i]=1;}
  const cs=window.RigAuto.contours(o,w,h,.02);
  const polys=cs.map(c=>window.RigAuto.chaikin(window.RigAuto.rdpClosed(c,.9),2).map(([px,py])=>[(px+.5)/R.s,(py+.5)/R.s]));
  return {polys,area:area/ N,w,h};
}
/* ---------- agrandar imagen (mejora clásica, no es IA): reescala suave en pasos + afinado de bordes ---------- */
function agrandar(img,f,max){
  f=f||2;max=max||4096;const W=img.width,H=img.height;let k=f;if(Math.max(W,H)*k>max)k=max/Math.max(W,H);
  if(k<=1.01)return null;
  let cur=img,cw=W,ch=H;const tw=Math.round(W*k),th=Math.round(H*k);
  while(cw<tw||ch<th){const nw=Math.min(tw,Math.round(cw*1.5)),nh=Math.min(th,Math.round(ch*1.5));
    const c=document.createElement("canvas");c.width=nw;c.height=nh;const g=c.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(cur,0,0,nw,nh);cur=c;cw=nw;ch=nh;}
  /* máscara de enfoque suave (solo color; la transparencia no se toca) */
  const out=document.createElement("canvas");out.width=cw;out.height=ch;const g=out.getContext("2d",{willReadFrequently:true});g.drawImage(cur,0,0);
  const id=g.getImageData(0,0,cw,ch),D=id.data,B=new Uint8ClampedArray(D);
  const bl=document.createElement("canvas");bl.width=cw;bl.height=ch;const bg=bl.getContext("2d",{willReadFrequently:true});bg.filter="blur(1.2px)";bg.drawImage(cur,0,0);
  const bd=bg.getImageData(0,0,cw,ch).data,amt=.6;
  for(let i=0;i<D.length;i+=4){if(B[i+3]<8)continue;for(let c=0;c<3;c++){const v=B[i+c]+(B[i+c]-bd[i+c])*amt;D[i+c]=v<0?0:v>255?255:v;}}
  g.putImageData(id,0,0);return out;
}
window.Detecta={detectar,recorteClic,agrandar};
})();
