/* Núcleo de formas 3D por código (sin Babylon). Malla = {p,n,c,u,i} con listas planas. */
(function(root){
"use strict";
const P=root.Proc;
const G={};
G.hex=h=>{if(Array.isArray(h))return h;const n=parseInt(h.slice(1),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};
G.mesh=()=>({p:[],n:[],c:[],u:[],i:[]});
const pv=(m,p,n,c,u)=>{m.p.push(p[0],p[1],p[2]);m.n.push(n[0],n[1],n[2]);m.c.push(c[0],c[1],c[2]);m.u.push(u?u[0]:0,u?u[1]:0);return m.p.length/3-1;};
const colAt=(col,a,b)=>typeof col==="function"?G.hex(col(a,b)):G.hex(col);
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
G.merge=function(){
  const o=G.mesh();
  for(const m of arguments){
    if(!m)continue;const off=o.p.length/3;
    for(const k of ["p","n","c","u"])for(let j=0;j<m[k].length;j++)o[k].push(m[k][j]);
    for(let j=0;j<m.i.length;j++)o.i.push(m.i[j]+off);
  }
  return o;
};
/* Transformación: escala -> rotación Z, X, Y -> traslación */
G.xf=function(m,o){
  o=o||{};const s=o.s==null?[1,1,1]:(typeof o.s==="number"?[o.s,o.s,o.s]:o.s),t=o.t||[0,0,0];
  const rx=o.rx||0,ry=o.ry||0,rz=o.rz||0,cz=Math.cos(rz),sz=Math.sin(rz),cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
  const rot=v=>{let [x,y,z]=v;let a=x*cz-y*sz,b=x*sz+y*cz;x=a;y=b;a=y*cx-z*sx;b=y*sx+z*cx;y=a;z=b;a=x*cy+z*sy;b=-x*sy+z*cy;x=a;z=b;return [x,y,z];};
  for(let j=0;j<m.p.length;j+=3){
    const p=rot([m.p[j]*s[0],m.p[j+1]*s[1],m.p[j+2]*s[2]]);
    m.p[j]=p[0]+t[0];m.p[j+1]=p[1]+t[1];m.p[j+2]=p[2]+t[2];
    const n=norm(rot(norm([m.n[j]/s[0],m.n[j+1]/s[1],m.n[j+2]/s[2]])));
    m.n[j]=n[0];m.n[j+1]=n[1];m.n[j+2]=n[2];
  }
  return m;
};
G.paint=function(m,fn){
  for(let j=0;j<m.p.length;j+=3){const c=G.hex(fn(m.p[j],m.p[j+1],m.p[j+2],[m.c[j],m.c[j+1],m.c[j+2]],[m.n[j],m.n[j+1],m.n[j+2]]));m.c[j]=c[0];m.c[j+1]=c[1];m.c[j+2]=c[2];}
  return m;
};
G.tint=(m,col)=>G.paint(m,()=>col);
/* Normales suaves, soldando vértices en la misma posición (sin costuras) */
G.recalc=function(m){
  const key=j=>Math.round(m.p[j]*1000)+","+Math.round(m.p[j+1]*1000)+","+Math.round(m.p[j+2]*1000);
  const acc=new Map(),keys=[];
  for(let j=0;j<m.p.length;j+=3){const k=key(j);keys.push(k);if(!acc.has(k))acc.set(k,[0,0,0]);}
  for(let t=0;t<m.i.length;t+=3){
    const a=m.i[t]*3,b=m.i[t+1]*3,c=m.i[t+2]*3;
    const e1=[m.p[b]-m.p[a],m.p[b+1]-m.p[a+1],m.p[b+2]-m.p[a+2]],e2=[m.p[c]-m.p[a],m.p[c+1]-m.p[a+1],m.p[c+2]-m.p[a+2]],n=cross(e1,e2);
    for(const q of [a,b,c]){const s=acc.get(keys[q/3]);s[0]+=n[0];s[1]+=n[1];s[2]+=n[2];}
  }
  for(let j=0;j<m.p.length;j+=3){const n=norm(acc.get(keys[j/3]));m.n[j]=n[0];m.n[j+1]=n[1];m.n[j+2]=n[2];}
  return m;
};
G.displace=function(m,fn){
  for(let j=0;j<m.p.length;j+=3){const d=fn(m.p[j],m.p[j+1],m.p[j+2],m.n[j],m.n[j+1],m.n[j+2]);m.p[j]+=m.n[j]*d;m.p[j+1]+=m.n[j+1]*d;m.p[j+2]+=m.n[j+2]*d;}
  return G.recalc(m);
};
/* Sólido de revolución. prof=[[radio,y],...] de abajo hacia arriba */
G.lathe=function(prof,seg,col,o){
  o=o||{};seg=seg||16;const m=G.mesh(),n=prof.length;
  for(let i=0;i<n;i++){
    const a=prof[Math.max(0,i-1)],b=prof[Math.min(n-1,i+1)];
    let dr=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dr,dy)||1,nr=dy/l,ny=-dr/l;
    for(let j=0;j<=seg;j++){
      const th=j/seg*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
      pv(m,[prof[i][0]*c,prof[i][1],prof[i][0]*s],[nr*c,ny,nr*s],colAt(col,prof[i][1],th),[j/seg,i/(n-1)]);
    }
  }
  for(let i=0;i<n-1;i++)for(let j=0;j<seg;j++){
    const a=i*(seg+1)+j,b=a+1,c=a+seg+1,d=c+1;
    m.i.push(a,c,b,b,c,d);
  }
  if(o.caps!==false){
    const cap=(r,y,up)=>{
      if(r<1e-4)return;const ci=pv(m,[0,y,0],[0,up?1:-1,0],colAt(col,y,0),[.5,.5]),st=m.p.length/3;
      for(let j=0;j<=seg;j++){const th=j/seg*Math.PI*2;pv(m,[r*Math.cos(th),y,r*Math.sin(th)],[0,up?1:-1,0],colAt(col,y,th),[.5+.5*Math.cos(th),.5+.5*Math.sin(th)]);}
      for(let j=0;j<seg;j++)up?m.i.push(ci,st+j+1,st+j):m.i.push(ci,st+j,st+j+1);
    };
    cap(prof[0][0],prof[0][1],false);cap(prof[n-1][0],prof[n-1][1],true);
  }
  return m;
};
G.cyl=(r0,r1,h,seg,col,caps)=>G.lathe([[r0,0],[r1,h]],seg,col,{caps});
G.cone=(r,h,seg,col)=>G.lathe([[r,0],[0,h]],seg,col);
G.sphere=function(r,seg,col){
  const prof=[],rings=Math.max(6,Math.round((seg||14)/2));
  for(let k=0;k<=rings;k++){const a=k/rings*Math.PI;prof.push([r*Math.sin(a),-r*Math.cos(a)]);}
  return G.lathe(prof,seg||14,col,{caps:false});
};
G.box=function(w,h,d,col){
  const m=G.mesh(),x=w/2,z=d/2,c=G.hex(col);
  const face=(pts,n)=>{const s=m.p.length/3;pts.forEach((p,k)=>pv(m,p,n,c,[k===1||k===2?1:0,k>1?1:0]));m.i.push(s,s+1,s+2,s,s+2,s+3);};
  face([[-x,0,z],[x,0,z],[x,h,z],[-x,h,z]],[0,0,1]);
  face([[x,0,-z],[-x,0,-z],[-x,h,-z],[x,h,-z]],[0,0,-1]);
  face([[x,0,z],[x,0,-z],[x,h,-z],[x,h,z]],[1,0,0]);
  face([[-x,0,-z],[-x,0,z],[-x,h,z],[-x,h,-z]],[-1,0,0]);
  face([[-x,h,z],[x,h,z],[x,h,-z],[-x,h,-z]],[0,1,0]);
  face([[-x,0,-z],[x,0,-z],[x,0,z],[-x,0,z]],[0,-1,0]);
  return m;
};
/* Prisma: polígono convexo en XY (antihorario) extruido en Z (centrado) */
G.prism=function(poly,depth,col){
  const m=G.mesh(),z=depth/2,c=G.hex(col),n=poly.length;
  for(let k=0;k<n;k++){
    const a=poly[k],b=poly[(k+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],nn=norm([dy,-dx,0]),s=m.p.length/3;
    pv(m,[a[0],a[1],z],nn,c);pv(m,[b[0],b[1],z],nn,c);pv(m,[b[0],b[1],-z],nn,c);pv(m,[a[0],a[1],-z],nn,c);
    m.i.push(s,s+1,s+2,s,s+2,s+3);
  }
  for(const sd of [1,-1]){
    const s=m.p.length/3;poly.forEach(p=>pv(m,[p[0],p[1],z*sd],[0,0,sd],c));
    for(let k=1;k<n-1;k++)sd>0?m.i.push(s,s+k,s+k+1):m.i.push(s,s+k+1,s+k);
  }
  return m;
};
/* Tubo a lo largo de una curva (marcos de transporte paralelo) */
G.tube=function(path,radFn,seg,col,caps){
  seg=seg||8;const m=G.mesh(),n=path.length;let nv=null,len=0;
  const tan=i=>norm([path[Math.min(n-1,i+1)][0]-path[Math.max(0,i-1)][0],path[Math.min(n-1,i+1)][1]-path[Math.max(0,i-1)][1],path[Math.min(n-1,i+1)][2]-path[Math.max(0,i-1)][2]]);
  for(let i=0;i<n;i++){
    const t=tan(i);
    if(!nv){nv=Math.abs(t[1])<.9?cross(t,[0,1,0]):cross(t,[1,0,0]);nv=norm(nv);}
    else{const d=dot(nv,t);nv=norm([nv[0]-t[0]*d,nv[1]-t[1]*d,nv[2]-t[2]*d]);}
    const b=cross(t,nv),r=radFn(i,n);
    if(i>0)len+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1],path[i][2]-path[i-1][2]);
    for(let j=0;j<=seg;j++){
      const th=j/seg*Math.PI*2,c=Math.cos(th),s=Math.sin(th),dir=[nv[0]*c+b[0]*s,nv[1]*c+b[1]*s,nv[2]*c+b[2]*s];
      pv(m,[path[i][0]+dir[0]*r,path[i][1]+dir[1]*r,path[i][2]+dir[2]*r],dir,colAt(col,path[i][1],i/(n-1)),[j/seg,len*.4]);
    }
  }
  for(let i=0;i<n-1;i++)for(let j=0;j<seg;j++){const a=i*(seg+1)+j,b=a+1,c=a+seg+1,d=c+1;m.i.push(a,c,b,b,c,d);}
  if(caps){
    for(const end of [0,n-1]){
      const t=tan(end),sg=end===0?-1:1,ci=pv(m,path[end],[t[0]*sg,t[1]*sg,t[2]*sg],colAt(col,path[end][1],end)),base=end*(seg+1);
      const st=m.p.length/3;
      for(let j=0;j<=seg;j++){const k=base+j;pv(m,[m.p[k*3],m.p[k*3+1],m.p[k*3+2]],[t[0]*sg,t[1]*sg,t[2]*sg],colAt(col,path[end][1],end));}
      for(let j=0;j<seg;j++)sg>0?m.i.push(ci,st+j,st+j+1):m.i.push(ci,st+j+1,st+j);
    }
  }
  return m;
};
/* Cinta doble cara a lo largo de una curva (hojas, frondas, hierba). side=dirección lateral */
G.strip=function(path,wFn,col,side){
  const m=G.mesh(),n=path.length;side=side||[1,0,0];
  for(let i=0;i<n;i++){
    const t=norm([path[Math.min(n-1,i+1)][0]-path[Math.max(0,i-1)][0],path[Math.min(n-1,i+1)][1]-path[Math.max(0,i-1)][1],path[Math.min(n-1,i+1)][2]-path[Math.max(0,i-1)][2]]);
    let sd=cross(cross(t,side),t);sd=norm(sd);const nn=norm(cross(sd,t)),w=wFn(i/(n-1));
    const c=colAt(col,path[i][1],i/(n-1));
    pv(m,[path[i][0]-sd[0]*w,path[i][1]-sd[1]*w,path[i][2]-sd[2]*w],nn,c,[0,i/(n-1)]);
    pv(m,[path[i][0]+sd[0]*w,path[i][1]+sd[1]*w,path[i][2]+sd[2]*w],nn,c,[1,i/(n-1)]);
  }
  const f=m.i.length;
  for(let i=0;i<n-1;i++){const a=i*2;m.i.push(a,a+1,a+2,a+1,a+3,a+2);}
  /* cara trasera */
  const off=m.p.length/3;
  for(let k=0;k<off;k++)pv(m,[m.p[k*3],m.p[k*3+1],m.p[k*3+2]],[-m.n[k*3],-m.n[k*3+1],-m.n[k*3+2]],[m.c[k*3],m.c[k*3+1],m.c[k*3+2]],[m.u[k*2],m.u[k*2+1]]);
  for(let i=0;i<n-1;i++){const a=off+i*2;m.i.push(a,a+2,a+1,a+1,a+2,a+3);}
  return m;
};
/* Icosfera soldada (para rocas, copas, planetas) */
G.ico=function(r,sub,col){
  const t=(1+Math.sqrt(5))/2,V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(norm);
  let F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let s=0;s<(sub||2);s++){
    const cache=new Map(),mid=(a,b)=>{const k=a<b?a+"_"+b:b+"_"+a;if(cache.has(k))return cache.get(k);const v=norm([(V[a][0]+V[b][0])/2,(V[a][1]+V[b][1])/2,(V[a][2]+V[b][2])/2]);V.push(v);cache.set(k,V.length-1);return V.length-1;};
    const NF=[];for(const f of F){const a=mid(f[0],f[1]),b=mid(f[1],f[2]),c=mid(f[2],f[0]);NF.push([f[0],a,c],[f[1],b,a],[f[2],c,b],[a,b,c]);}F=NF;
  }
  const m=G.mesh();
  for(const v of V)pv(m,[v[0]*r,v[1]*r,v[2]*r],v,colAt(col,v[1]*r,0),[v[0]*.5+.5,v[2]*.5+.5]);
  for(const f of F)m.i.push(f[0],f[1],f[2]);
  return m;
};
G.bezier=function(a,b,c,d,n){
  const out=[];for(let k=0;k<=n;k++){const t=k/n,u=1-t;out.push([0,1,2].map(i=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]));}
  return out;
};
G.bounds=function(m){
  const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(let j=0;j<m.p.length;j+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],m.p[j+k]);hi[k]=Math.max(hi[k],m.p[j+k]);}
  return {lo,hi};
};
G.noise=P;
root.Geo=G;
})(window);
