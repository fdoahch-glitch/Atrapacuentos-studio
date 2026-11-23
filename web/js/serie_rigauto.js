/* Corte automático por huesos: cada hueso (línea + pinceladas) "reclama" los píxeles más cercanos,
   pero sin cruzar los bordes del dibujo (camino geodésico con costo por contraste). */
(function(){
"use strict";
const WORK=420;
function heapPush(h,k,v){let i=h.n++;h.k[i]=k;h.v[i]=v;while(i>0){const p=(i-1)>>1;if(h.k[p]<=h.k[i])break;[h.k[p],h.k[i]]=[h.k[i],h.k[p]];[h.v[p],h.v[i]]=[h.v[i],h.v[p]];i=p;}}
function heapPop(h){const k=h.k[0],v=h.v[0];h.n--;if(h.n>0){h.k[0]=h.k[h.n];h.v[0]=h.v[h.n];let i=0;for(;;){let l=i*2+1,r=l+1,m=i;if(l<h.n&&h.k[l]<h.k[m])m=l;if(r<h.n&&h.k[r]<h.k[m])m=r;if(m===i)break;[h.k[m],h.k[i]]=[h.k[i],h.k[m]];[h.v[m],h.v[i]]=[h.v[i],h.v[m]];i=m;}}return v;}
function raster(pts,w,h,sc,out,rad){
  const put=(x,y)=>{for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const xx=Math.round(x+dx),yy=Math.round(y+dy);if(xx>=0&&yy>=0&&xx<w&&yy<h)out.push(yy*w+xx);}};
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[i+1]||a,n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*sc));
    for(let k=0;k<=n;k++)put((a[0]+(b[0]-a[0])*k/n)*sc,(a[1]+(b[1]-a[1])*k/n)*sc);}
}
/* devuelve {w,h,sc,lab(Int16: -1 = nada),alpha(Uint8)} */
function labels(img,bones,opt){
  opt=opt||{};const W=img.width,H=img.height,sc=Math.min(1,WORK/Math.max(W,H)),w=Math.max(8,Math.round(W*sc)),h=Math.max(8,Math.round(H*sc));
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(img,0,0,w,h);const D=g.getImageData(0,0,w,h).data,N=w*h;
  const lum=new Float32Array(N),A=new Uint8Array(N);
  for(let i=0;i<N;i++){A[i]=D[i*4+3]>40?1:0;lum[i]=(D[i*4]*.3+D[i*4+1]*.59+D[i*4+2]*.11)/255;}
  const edge=new Float32Array(N);let mx=1e-4;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;
    const gx=-lum[i-w-1]-2*lum[i-1]-lum[i+w-1]+lum[i-w+1]+2*lum[i+1]+lum[i+w+1],gy=-lum[i-w-1]-2*lum[i-w]-lum[i-w+1]+lum[i+w-1]+2*lum[i+w]+lum[i+w+1];
    const dc=Math.abs(D[i*4]-D[(i+1)*4])+Math.abs(D[i*4+1]-D[(i+1)*4+1])+Math.abs(D[i*4+2]-D[(i+1)*4+2]);
    const e=Math.hypot(gx,gy)+dc/255*.6;edge[i]=e;if(e>mx)mx=e;}
  const k=opt.edge==null?26:opt.edge,cost=new Float32Array(N);
  for(let i=0;i<N;i++)cost[i]=(A[i]?1:7)+k*Math.min(1,edge[i]/(mx*.55));
  const dist=new Float32Array(N).fill(1e30),lab=new Int16Array(N).fill(-1),heap={n:0,k:new Float32Array(N*3),v:new Int32Array(N*3)};
  bones.forEach((b,bi)=>{const sd=[];const line=[b.pv,b.tip];raster(line,w,h,sc,sd,Math.max(1,Math.round(w/180)));
    if(b.brush&&b.brush.length)raster(b.brush,w,h,sc,sd,Math.max(1,Math.round(w/140)));
    for(const i of sd){if(dist[i]>0){dist[i]=0;lab[i]=bi;heapPush(heap,0,i);}}});
  const nb=[[-1,0,1],[1,0,1],[0,-1,1],[0,1,1],[-1,-1,1.414],[1,-1,1.414],[-1,1,1.414],[1,1,1.414]];
  while(heap.n){const dk=heap.k[0],i=heapPop(heap);if(dk>dist[i])continue;const x=i%w,y=(i/w)|0;
    for(const [dx,dy,m] of nb){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx,nd=dk+(cost[i]+cost[j])*.5*m;if(nd<dist[j]){dist[j]=nd;lab[j]=lab[i];heapPush(heap,nd,j);}}}
  return {w,h,sc,lab,alpha:A,W,H};
}
/* máscara de un hueso, agrandada unos píxeles para que las piezas se traslapen un poco y no queden rendijas */
function maskOf(L,bi,grow){
  const {w,h,lab,alpha}=L,N=w*h;let m=new Uint8Array(N);for(let i=0;i<N;i++)m[i]=lab[i]===bi&&alpha[i]?1:0;
  /* cerrar huequitos */
  const sm=(src)=>{const o=new Uint8Array(N);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;let s=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s+=src[i+dy*w+dx];o[i]=s>=5?1:0;}return o;};
  m=sm(m);
  for(let it=0;it<grow;it++){const o=m.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!m[i]&&(m[i-1]||m[i+1]||m[i-w]||m[i+w]))o[i]=1;}m=o;}
  return m;
}
/* contornos exteriores de cada pedazo conectado (de mayor a menor) */
function contours(m,w,h,minFrac){
  const N=w*h,comp=new Int32Array(N).fill(-1),sizes=[],start=[];let nc=0;
  for(let i=0;i<N;i++){if(!m[i]||comp[i]>=0)continue;let q=[i],n=0;comp[i]=nc;start.push(i);while(q.length){const a=q.pop();n++;const x=a%w,y=(a/w)|0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const b=yy*w+xx;if(m[b]&&comp[b]<0){comp[b]=nc;q.push(b);}}}
    sizes.push(n);nc++;}
  if(!nc)return [];const tot=sizes.reduce((a,b)=>a+b,0),out=[];
  const order=sizes.map((s,i)=>i).sort((a,b)=>sizes[b]-sizes[a]);
  for(const ci of order){if(sizes[ci]<tot*minFrac&&out.length)break;if(sizes[ci]<6)break;out.push(trace(comp,ci,start[ci],w,h));}
  return out;
}
/* seguimiento de borde (Moore) */
function trace(comp,ci,s,w,h){
  const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&comp[y*w+x]===ci;
  const D=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const sx=s%w,sy=(s/w)|0,pts=[[sx,sy]];let x=sx,y=sy,bd=4,first=null,guard=w*h*3;
  for(let it=0;it<guard;it++){let moved=false;
    for(let k=1;k<=8;k++){const d=(bd+k)%8,nx=x+D[d][0],ny=y+D[d][1];
      if(inside(nx,ny)){
        const pd=(d+7)%8,bx=x+D[pd][0],by=y+D[pd][1],vx=bx-nx,vy=by-ny;let nb=4;for(let q=0;q<8;q++)if(D[q][0]===vx&&D[q][1]===vy){nb=q;break;}
        if(first===null)first=[nx,ny];else if(x===sx&&y===sy&&nx===first[0]&&ny===first[1])return pts;
        x=nx;y=ny;bd=nb;pts.push([x,y]);moved=true;break;}}
    if(!moved)break;}
  return pts;
}
function rdp(p,e){if(p.length<4)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const A=p[a],B=p[b],dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1;
    for(let i=a+1;i<b;i++){const d=Math.abs((p[i][0]-A[0])*dy-(p[i][1]-A[1])*dx)/L;if(d>md){md=d;mi=i;}}
    if(md>e&&mi>=0){keep[mi]=1;st.push([a,mi],[mi,b]);}}
  return p.filter((_,i)=>keep[i]);}
function rdpClosed(p,e){if(p.length>3&&p[0][0]===p[p.length-1][0]&&p[0][1]===p[p.length-1][1])p=p.slice(0,-1);if(p.length<6)return p;
  let k=0,md=0;for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1]);if(d>md){md=d;k=i;}}
  const a=rdp(p.slice(0,k+1),e),b=rdp(p.slice(k).concat([p[0]]),e);return a.concat(b.slice(1,-1));}
function chaikin(p,n){for(let k=0;k<n;k++){const o=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}p=o;}return p;}
/* resultado: por hueso, lista de polígonos en coordenadas de la imagen */
function segment(img,bones,opt){
  opt=opt||{};const L=labels(img,bones,opt),grow=opt.grow==null?Math.max(2,Math.round(L.w/110)):opt.grow;
  const res=bones.map((b,bi)=>{const m=maskOf(L,bi,grow),cs=contours(m,L.w,L.h,.04);
    return cs.map(c=>chaikin(rdpClosed(c,.9),2).map(([x,y])=>[(x+.5)/L.sc,(y+.5)/L.sc]));});
  return {polys:res,L};
}
/* vista previa de zonas: lienzo con colores por hueso */
function paintZones(L,cols,alpha){
  const c=document.createElement("canvas");c.width=L.w;c.height=L.h;const g=c.getContext("2d"),im=g.createImageData(L.w,L.h);
  const rgb=cols.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
  for(let i=0;i<L.w*L.h;i++){const l=L.lab[i];if(l>=0&&L.alpha[i]){const q=rgb[l%rgb.length];im.data[i*4]=q[0];im.data[i*4+1]=q[1];im.data[i*4+2]=q[2];im.data[i*4+3]=alpha;}}
  g.putImageData(im,0,0);return c;
}
/* plantillas que se colocan según el tamaño del dibujo; después se arrastran los puntos para ajustar */
function bboxAlpha(img){const c=document.createElement("canvas"),W=img.width,H=img.height,s=Math.min(1,300/Math.max(W,H));c.width=Math.round(W*s);c.height=Math.round(H*s);const g=c.getContext("2d");g.drawImage(img,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return {x:0,y:0,w:W,h:H};return {x:x0/s,y:y0/s,w:(x1-x0)/s,h:(y1-y0)/s};}
const TPL={
  humano:{nombre:"Persona (de frente)",face:1,bones:[
    ["cuerpo","cuerpo",[.5,.55],[.5,.38],null],["cabeza","cabeza",[.5,.22],[.5,.07],"cuerpo"],
    ["brazo_i","brazo",[.34,.28],[.27,.5],"cuerpo"],["brazo_d","brazo",[.66,.28],[.73,.5],"cuerpo"],
    ["muslo_i","muslo",[.43,.55],[.42,.75],"cuerpo"],["canilla_i","canilla",[.42,.75],[.42,.96],"muslo_i"],
    ["muslo_d","muslo",[.57,.55],[.58,.75],"cuerpo"],["canilla_d","canilla",[.58,.75],[.58,.96],"muslo_d"]]},
  dino:{nombre:"Dinosaurio o animal de lado (mira a la derecha)",face:1,bones:[
    ["cuerpo","cuerpo",[.42,.5],[.55,.48],null],["cola","cola",[.3,.52],[.04,.3],"cuerpo"],
    ["cabeza","cabeza",[.7,.38],[.88,.18],"cuerpo"],["mandibula","mandibula",[.82,.28],[.96,.33],"cabeza"],
    ["muslo_t","muslo",[.4,.62],[.37,.78],"cuerpo"],["canilla_t","canilla",[.37,.78],[.36,.96],"muslo_t"],
    ["muslo_d","muslo",[.58,.62],[.6,.78],"cuerpo"],["canilla_d","canilla",[.6,.78],[.62,.96],"muslo_d"]]},
  vacio:{nombre:"Vacío (pongo yo los huesos)",face:1,bones:[]}
};
function plantilla(id,img){
  const t=TPL[id],b=bboxAlpha(img),P=([u,v])=>[b.x+u*b.w,b.y+v*b.h];
  const ids={};const out=t.bones.map(([n,role,pv,tip,par],i)=>{const o={id:"b"+(i+1),name:n,role,pv:P(pv),tip:P(tip),parent:null,atras:false,brush:[]};ids[n]=o.id;if(par)o._par=par;return o;});
  out.forEach(o=>{if(o._par){o.parent=ids[o._par];delete o._par;}});return {bones:out,face:t.face};
}
window.RigAuto={contours,trace,rdp,rdpClosed,chaikin,segment,labels,paintZones,plantilla,TPL};
})();
