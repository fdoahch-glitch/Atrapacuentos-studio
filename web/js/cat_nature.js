/* Biblioteca: árboles, plantas, rocas y montañas (todo dibujado por código) */
(function(root){
"use strict";
const G=root.Geo,P=root.Proc,Cat=root.Cat,def=Cat.def;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const n3=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const H=G.hex;

/* ---- copa de hojas: icosfera deformada con colores por altura ---- */
function clump(r,squash,c1,c2,seed){
  const m=G.ico(r,2,c1);
  G.displace(m,(x,y,z)=>(P.noise3(x*1.6+seed,y*1.6,z*1.6)-.5)*r*.55);
  G.xf(m,{s:[1,squash,1]});
  G.paint(m,(x,y,z)=>{const n=P.noise3(x*2.2+seed,y*2.2,z*2.2),top=cl((y/(r*squash)+1)/2,0,1);return mixc(c1,c2,cl(.15+top*.55+(n-.5)*.7,0,1));});
  return m;
}
/* ---- generador de ramas ---- */
function genTree(f,rnd,o){
  const bark=[],spots=[],trunk=H(f.paleta.tronco);
  function branch(start,dir,len,rad,depth){
    const n=6,pts=[];let p=start.slice(),d=dir.slice();
    for(let i=0;i<=n;i++){
      pts.push(p.slice());
      d=n3([d[0]+(rnd()-.5)*o.wob,d[1]+(rnd()-.5)*o.wob*.6+o.up,d[2]+(rnd()-.5)*o.wob]);
      p=[p[0]+d[0]*len/n,p[1]+d[1]*len/n,p[2]+d[2]*len/n];
    }
    const r0=rad,r1=Math.max(.02,rad*.55);
    bark.push(G.tube(pts,i=>r0+(r1-r0)*i/n,depth>=o.depth-1?10:6,trunk,true));
    if(depth===0){spots.push(pts[n]);return;}
    for(let k=0;k<o.kids;k++){
      const base=pts[2+Math.floor(rnd()*(n-2))],ang=rnd()*Math.PI*2,sp=o.spread*(.7+rnd()*.6);
      branch(base,n3([Math.cos(ang)*sp,o.lift+rnd()*.5,Math.sin(ang)*sp]),len*(o.lenK+rnd()*.1),rad*o.radK,depth-1);
    }
  }
  branch([0,0,0],[0,1,0],o.trunkLen,o.trunkRad,o.depth);
  const parts=[{g:G.merge(...bark),m:"bark"}];
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2||f.paleta.hoja),L=[];
  if(o.leaf==="clump"||o.leaf==="weep"){
    spots.forEach((s,i)=>{
      const m=clump(o.leafR*(.8+rnd()*.5),o.squash||.85,c1,c2,f.semilla+i);G.xf(m,{t:s});L.push(m);
      if(o.leaf==="weep")for(let k=0;k<5;k++){
        const a=rnd()*6.28,rr=o.leafR*.9,x0=s[0]+Math.cos(a)*rr,z0=s[2]+Math.sin(a)*rr,ln=o.leafR*(1.6+rnd());
        L.push(G.strip(G.bezier([x0,s[1],z0],[x0*1.05-s[0]*.05,s[1]-ln*.3,z0*1.05-s[2]*.05],[x0*1.08-s[0]*.08,s[1]-ln*.7,z0*1.08-s[2]*.08],[x0*1.08-s[0]*.08,s[1]-ln,z0*1.08-s[2]*.08],6),t=>.14*(1-t*.5),mixc(c1,c2,rnd()),[1,0,0]));
      }
    });
  }
  if(o.leaf==="umbrella"){
    spots.forEach((s,i)=>{const m=clump(o.leafR*(.9+rnd()*.4),.3,c1,c2,f.semilla+i);G.xf(m,{t:[s[0],s[1]+.1,s[2]]});L.push(m);});
  }
  if(L.length)parts.push({g:G.merge(...L),m:"vc"});
  return parts;
}
const TREE={wob:.4,up:.03,kids:3,spread:1.6,lift:.35,lenK:.78,radK:.55,depth:3,trunkLen:3,trunkRad:.34,leaf:"clump",leafR:1.4,squash:.8};
const tree=(o)=>(f,rnd)=>genTree(f,rnd,Object.assign({},TREE,o,f.params));

def({id:"roble",nombre:"Roble",cat:"arbol",grp:["bosque","cuento"],alto:7,paleta:{tronco:"#6b4a2c",hoja:"#2f7a3a",hoja2:"#8cc24a"},build:tree({})});
def({id:"cerezo",nombre:"Cerezo en flor",cat:"arbol",grp:["cuento"],alto:6,paleta:{tronco:"#5a3a2a",hoja:"#e07aa0",hoja2:"#ffd0e0"},build:tree({leafR:1.3})});
def({id:"otono",nombre:"Árbol de otoño",cat:"arbol",grp:["bosque"],alto:7,paleta:{tronco:"#6b4a2c",hoja:"#c8481a",hoja2:"#f0b030"},build:tree({})});
def({id:"seco",nombre:"Árbol seco",cat:"arbol",grp:["desierto","noche"],alto:6,paleta:{tronco:"#4a3a30",hoja:"#4a3a30"},build:tree({depth:4,leaf:"none",kids:3,spread:1.3,lift:.3,trunkRad:.28})});
def({id:"sauce",nombre:"Sauce llorón",cat:"arbol",grp:["cuento"],alto:7,paleta:{tronco:"#5a4a30",hoja:"#4a9a4a",hoja2:"#9ad06a"},build:tree({leaf:"weep",depth:2,leafR:1.5,spread:1.3,lift:.7})});
def({id:"acacia",nombre:"Acacia",cat:"arbol",grp:["africa"],alto:6,paleta:{tronco:"#6a4a30",hoja:"#5a8a2a",hoja2:"#b8c050"},build:tree({depth:2,kids:2,trunkLen:2.6,trunkRad:.28,spread:1.1,lift:.5,leaf:"umbrella",leafR:2.4})});
def({id:"selva_gigante",nombre:"Árbol de la selva",cat:"arbol",grp:["selva","tropical"],alto:12,paleta:{tronco:"#5a4030",hoja:"#1f6a2a",hoja2:"#5aa83a"},build:(f,rnd)=>{
  const o=Object.assign({},TREE,{trunkLen:5.5,trunkRad:.5,depth:2,kids:3,spread:1.2,lift:.6,leafR:2.4,squash:.6},f.params);
  const parts=genTree(f,rnd,o),L=[];
  /* contrafuertes en la base */
  for(let k=0;k<5;k++){const a=k/5*6.28;L.push(G.tube([[Math.cos(a)*1.4,0,Math.sin(a)*1.4],[Math.cos(a)*.7,1,Math.sin(a)*.7],[Math.cos(a)*.45,2.4,Math.sin(a)*.45]],i=>.28-i*.08,6,H(f.paleta.tronco),true));}
  /* lianas */
  for(let k=0;k<7;k++){const a=rnd()*6.28,r=1+rnd()*2,x=Math.cos(a)*r,z=Math.sin(a)*r;L.push(G.tube([[x,8,z],[x*1.05,6,z*1.05],[x*1.1,3.5,z*1.1],[x*1.1,1.8,z*1.1]],i=>.05,5,H("#3a7a30"),true));}
  parts[0]=({g:G.merge(parts[0].g,...L),m:"bark"});
  return parts;
}});
def({id:"baobab",nombre:"Baobab",cat:"arbol",grp:["africa"],alto:9,paleta:{tronco:"#8a6a48",hoja:"#4a8a2a",hoja2:"#9ac04a"},build:(f,rnd)=>{
  const trunk=G.lathe([[1.9,0],[1.55,1.2],[1.65,2.6],[1.4,4],[1.05,5]],18,H(f.paleta.tronco));
  G.displace(trunk,(x,y,z)=>(P.noise3(x*2,y*1.2,z*2)-.5)*.18);
  const o=Object.assign({},TREE,{trunkLen:.1,trunkRad:.05,depth:2,kids:5,spread:1.8,lift:.2,lenK:1.4,leaf:"clump",leafR:1.5,squash:.6,radK:.7},f.params);
  const top=genTree(f,rnd,o);G.xf(top[0].g,{t:[0,5,0]});G.xf(top[1].g,{t:[0,5,0]});
  return [{g:G.merge(trunk,top[0].g),m:"bark"},top[1]];
}});
def({id:"pino",nombre:"Pino",cat:"arbol",grp:["bosque","frio"],alto:8,paleta:{tronco:"#5a3a24",hoja:"#1f5a38",hoja2:"#4a8a52",nieve:"#ffffff"},params:{capas:7,nevado:0},build:(f,rnd)=>{
  const n=f.params.capas,c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),sn=H(f.paleta.nieve),L=[];
  for(let i=0;i<n;i++){
    const t=i/(n-1),r=2.3*(1-t*.8),y=1.2+i*.95;
    const m=G.lathe([[r,0],[r*.35,1.5]],14,c1);G.displace(m,(x,yy,z)=>(P.noise3(x*2+i,yy*2,z*2)-.5)*.28);
    G.paint(m,(x,yy,z,c,nn)=>{const base=mixc(c1,c2,t*.7+(P.noise3(x*3,yy*3,z*3)-.5)*.3);return f.params.nevado&&nn[1]>.35?mixc(base,sn,.85):base;});
    G.xf(m,{t:[0,y,0]});L.push(m);
  }
  return [{g:G.cyl(.32,.18,2,8,H(f.paleta.tronco)),m:"bark"},{g:G.merge(...L),m:"vc"}];
}});
def({id:"abeto_nevado",nombre:"Pino nevado",cat:"arbol",grp:["frio"],alto:8,paleta:{tronco:"#5a3a24",hoja:"#1f5a38",hoja2:"#3a7a50",nieve:"#ffffff"},params:{capas:7,nevado:1},build:(f,rnd)=>Cat.byId.pino.build(f,rnd)});
def({id:"araucaria",nombre:"Araucaria",cat:"arbol",grp:["latam"],alto:14,paleta:{tronco:"#6a5240",hoja:"#3a7a30",hoja2:"#7ab048"},build:(f,rnd)=>{
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),trunk=H(f.paleta.tronco),B=[],L=[];
  B.push(G.lathe([[.55,0],[.42,6],[.32,9.4]],10,trunk));
  const whorls=7;
  for(let w=0;w<whorls;w++){
    const y=4+w*.8,rise=-.25+w*.12,len=1.9+Math.min(w,3)*.2-(w>4?(w-4)*.25:0),cnt=6;
    for(let k=0;k<cnt;k++){
      const a=(k/cnt+w*.13)*6.28+rnd()*.3,ca=Math.cos(a),sa=Math.sin(a);
      const pts=G.bezier([0,y,0],[ca*len*.4,y+.1,sa*len*.4],[ca*len*.8,y+rise*.4,sa*len*.8],[ca*len,y+rise+.3,sa*len],6);
      B.push(G.tube(pts,i=>.1-i*.011,5,trunk,true));
      const pad=clump(.65,.3,c1,c2,w*7+k);G.xf(pad,{t:[ca*len,y+rise+.4,sa*len]});L.push(pad);
    }
  }
  for(let k=0;k<8;k++){const a=k/8*6.28,ca=Math.cos(a),sa=Math.sin(a);
    B.push(G.tube(G.bezier([0,9.2,0],[ca*.6,9.3,sa*.6],[ca*1.4,9.5,sa*1.4],[ca*2,9.9,sa*2],6),i=>.09-i*.01,5,trunk,true));
    const pad=clump(.7,.32,c1,c2,60+k);G.xf(pad,{t:[ca*2,10,sa*2]});L.push(pad);}
  const top=clump(1,.4,c1,c2,99);G.xf(top,{t:[0,9.9,0]});L.push(top);
  return [{g:G.merge(...B),m:"bark"},{g:G.merge(...L),m:"vc"}];
}});
/* ---- palmeras ---- */
function frond(len,a,ytop,wmax,c1,c2){
  const pts=[];for(let k=0;k<=10;k++){const t=k/10;pts.push([Math.cos(a)*len*t,ytop+len*(.5*t-.78*t*t),Math.sin(a)*len*t]);}
  return G.strip(pts,t=>wmax*Math.sin(Math.PI*Math.min(1,t*1.04))*(.62+.38*Math.abs(Math.cos(t*34))),(x=>x)(mixc(c1,c2,.4)),[-Math.sin(a),.35,Math.cos(a)]);
}
function palm(f,rnd,coco){
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),tr=H(f.paleta.tronco),top=[.9,7.4,0];
  const path=G.bezier([0,0,0],[.2,2.4,0],[.9,5,0],top,16);
  const trunk=G.tube(path,(i,n)=>.34-.12*i/n+(i%2?.02:0),9,tr,true),L=[];
  const nf=12;for(let k=0;k<nf;k++){const a=k/nf*6.28+rnd()*.3;const fr=frond(3.4+rnd()*.7,a,0,.55,c1,c2);G.xf(fr,{t:[top[0],top[1],top[2]]});L.push(fr);}
  const parts=[{g:trunk,m:"bark"},{g:G.merge(...L),m:"vc"}];
  if(coco){const cc=[];for(let k=0;k<4;k++){const s=G.sphere(.28,8,"#5a4020");G.xf(s,{t:[top[0]+Math.cos(k*1.6)*.35,top[1]-.35,top[2]+Math.sin(k*1.6)*.35]});cc.push(s);}parts.push({g:G.merge(...cc),m:"vc"});}
  return parts;
}
def({id:"palmera",nombre:"Palmera",cat:"arbol",grp:["tropical","desierto"],alto:9,paleta:{tronco:"#9a7a50",hoja:"#2f8a3a",hoja2:"#7ac04a"},build:(f,r)=>palm(f,r,false)});
def({id:"cocotero",nombre:"Palma de coco",cat:"arbol",grp:["tropical","mar"],alto:9,paleta:{tronco:"#8a6a48",hoja:"#2a7a30",hoja2:"#6ab044"},build:(f,r)=>palm(f,r,true)});
def({id:"bambu",nombre:"Bambú",cat:"arbol",grp:["selva"],alto:8,paleta:{tronco:"#8ac84a",hoja:"#4aa850",hoja2:"#9ad870"},build:(f,rnd)=>{
  const c=H(f.paleta.tronco),B=[],L=[];
  for(let s=0;s<5;s++){
    const x=(rnd()-.5)*1.6,z=(rnd()-.5)*1.6,h=6+rnd()*2.4,bend=(rnd()-.5)*.6,seg=Math.floor(h/.9);
    for(let i=0;i<seg;i++){const y0=i*h/seg;const m=G.cyl(.14,.14,h/seg-.04,8,c,true);G.xf(m,{t:[x+bend*(y0/h)**2,y0,z]});B.push(m);const r=G.cyl(.18,.18,.06,8,"#6aa83a",true);G.xf(r,{t:[x+bend*(y0/h)**2,y0+h/seg-.05,z]});B.push(r);}
    for(let k=0;k<5;k++){const a=rnd()*6.28,y=h*(.55+rnd()*.4);const lf=G.strip(G.bezier([0,0,0],[Math.cos(a)*.5,.2,Math.sin(a)*.5],[Math.cos(a)*.9,-.1,Math.sin(a)*.9],[Math.cos(a)*1.2,-.5,Math.sin(a)*1.2],5),t=>.12*(1-t),mixc(H(f.paleta.hoja),H(f.paleta.hoja2),rnd()),[0,1,0]);G.xf(lf,{t:[x+bend*(y/h)**2,y,z]});L.push(lf);}
  }
  return [{g:G.merge(...B),m:"vc"},{g:G.merge(...L),m:"vc"}];
}});
def({id:"cactus",nombre:"Cactus",cat:"planta",grp:["desierto","latam"],alto:3.2,paleta:{cuerpo:"#4a9a4a",flor:"#ff6a9a"},build:(f,rnd)=>{
  const c=H(f.paleta.cuerpo),prof=[[0,0],[.5,.05],[.55,1],[.5,2.4],[.35,3],[0,3.2]];
  const body=G.lathe(prof,12,c);
  const arm=(side,y,h)=>G.tube([[side*.4,y,0],[side*.95,y+.05,0],[side*1.1,y+.5,0],[side*1.1,y+h,0]],(i,n)=>.26-(i===n-1?.12:0),8,c,true);
  const fl=G.sphere(.16,8,f.paleta.flor);G.xf(fl,{t:[0,3.25,0]});
  return [{g:G.merge(body,arm(1,1.2,1),arm(-1,1.6,.8)),m:"vc"},{g:fl,m:"vc"}];
}});
/* ---- plantas ---- */
function fern(f,rnd,n,len,wmax,h){
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),L=[];
  for(let k=0;k<n;k++){
    const a=k/n*6.28+rnd()*.3,ln=len*(.7+rnd()*.5),pts=[];
    for(let i=0;i<=10;i++){const t=i/10;pts.push([Math.cos(a)*ln*t,h+ln*(.75*t-1.0*t*t)*.9,Math.sin(a)*ln*t]);}
    L.push(G.strip(pts,t=>wmax*Math.sin(Math.PI*Math.min(1,t*1.03))*(.55+.45*Math.abs(Math.sin(t*38))),mixc(c1,c2,rnd()),[-Math.sin(a),.4,Math.cos(a)]));
  }
  return G.merge(...L);
}
def({id:"helecho",nombre:"Helecho",cat:"planta",grp:["selva","bosque","prehi"],alto:1.6,paleta:{hoja:"#2a7a34",hoja2:"#5aaa44"},build:(f,r)=>[{g:fern(f,r,14,2.2,.36,.1),m:"vc"}]});
def({id:"helecho_gigante",nombre:"Helecho gigante",cat:"planta",grp:["selva","prehi"],alto:4.5,paleta:{hoja:"#2a7a34",hoja2:"#5aaa44",tronco:"#5a4030"},build:(f,r)=>{
  const tr=G.lathe([[.28,0],[.22,2],[.18,2.6]],8,H(f.paleta.tronco)),fr=fern(f,r,12,3.4,.5,2.6);return [{g:tr,m:"bark"},{g:fr,m:"vc"}];}});
def({id:"hojas_gigantes",nombre:"Hojas gigantes",cat:"planta",grp:["selva","tropical"],alto:3,paleta:{hoja:"#1f7a3a",hoja2:"#4aaa50"},build:(f,rnd)=>{
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),L=[];
  for(let k=0;k<6;k++){const a=k/6*6.28+rnd()*.4,ln=2+rnd()*1.2,pts=[];
    for(let i=0;i<=10;i++){const t=i/10;pts.push([Math.cos(a)*ln*t*.9,.1+ln*(.9*t-.8*t*t),Math.sin(a)*ln*t*.9]);}
    L.push(G.strip(pts,t=>.75*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.02)),.7)*(t<.12?t/.12:1),mixc(c1,c2,rnd()),[-Math.sin(a),.5,Math.cos(a)]));}
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"arbusto",nombre:"Arbusto",cat:"planta",grp:["bosque","cuento"],alto:1.4,paleta:{hoja:"#2f7a3a",hoja2:"#7cc24a",flor:"#ff6a8a"},params:{flores:1},build:(f,rnd)=>{
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),L=[],Fl=[];
  for(let i=0;i<7;i++){const m=clump(.55+rnd()*.35,.8,c1,c2,i+f.semilla);G.xf(m,{t:[(rnd()-.5)*1.2,.4+rnd()*.3,(rnd()-.5)*1.2]});L.push(m);}
  if(f.params.flores)for(let i=0;i<9;i++){const s=G.sphere(.07,6,f.paleta.flor),a=rnd()*6.28,r=.5+rnd()*.5;G.xf(s,{t:[Math.cos(a)*r,.55+rnd()*.6,Math.sin(a)*r]});Fl.push(s);}
  return [{g:G.merge(...L),m:"vc"},Fl.length?{g:G.merge(...Fl),m:"vc"}:null];}});
def({id:"flor",nombre:"Flor",cat:"planta",grp:["cuento","bosque"],alto:1.2,paleta:{petalo:"#ff6aa0",centro:"#ffd34d",tallo:"#3a8a3a"},params:{petalos:7},build:(f,rnd)=>{
  const st=G.tube(G.bezier([0,0,0],[.05,.4,0],[-.05,.7,0],[0,1,0],8),i=>.025,6,H(f.paleta.tallo),true),P2=[],n=f.params.petalos;
  for(let k=0;k<n;k++){const a=k/n*6.28,p=clmp(.17,.07,f.paleta.petalo);G.xf(p,{t:[Math.cos(a)*.2,1,Math.sin(a)*.2]});P2.push(p);}
  const c=G.sphere(.1,8,f.paleta.centro);G.xf(c,{t:[0,1,0]});
  const lf=G.strip(G.bezier([0,.3,0],[.2,.4,0],[.4,.45,0],[.5,.35,0],5),t=>.09*Math.sin(Math.PI*t)+.01,H(f.paleta.tallo),[0,0,1]);
  return [{g:G.merge(st,lf),m:"vc"},{g:G.merge(...P2),m:"vc"},{g:c,m:"vc"}];
  function clmp(r,s,col){const m=G.sphere(r,8,col);G.xf(m,{s:[1,.3,.55]});return m;}
}});
def({id:"girasol",nombre:"Girasol",cat:"planta",grp:["granja","cuento"],alto:2.4,paleta:{petalo:"#ffc928",centro:"#5a3a1a",tallo:"#3a8a3a"},build:(f,rnd)=>{
  const st=G.tube(G.bezier([0,0,0],[.05,.8,0],[.1,1.6,0],[.2,2,0],10),i=>.05,6,H(f.paleta.tallo),true),P2=[];
  for(let k=0;k<16;k++){const a=k/16*6.28,p=G.sphere(.28,8,f.paleta.petalo);G.xf(p,{s:[1,.22,.4],rz:0,ry:-a,t:[.2+Math.cos(a)*.42,2.05+Math.sin(a)*0,Math.sin(a)*.42]});P2.push(p);}
  const c=G.cyl(.32,.32,.12,14,f.paleta.centro,true);G.xf(c,{rx:Math.PI/2,t:[.2,2,0]});
  return [{g:st,m:"vc"},{g:G.merge(...P2),m:"vc"},{g:c,m:"vc"}];}});
def({id:"hongo",nombre:"Hongo",cat:"planta",grp:["bosque","cuento","magia"],alto:1.3,paleta:{sombrero:"#d9402f",tallo:"#f3e6c4",motas:"#ffffff"},build:(f,rnd)=>{
  const tl=G.lathe([[.3,0],[.22,.5],[.24,.9]],10,H(f.paleta.tallo)),cap=G.lathe([[.0,.0],[.7,.0],[.8,.12],[.7,.4],[.4,.62],[0,.7]],14,H(f.paleta.sombrero));
  G.xf(cap,{t:[0,.8,0]});const M=[];
  for(let k=0;k<7;k++){const a=rnd()*6.28,r=.28+rnd()*.3,s=G.sphere(.07,6,f.paleta.motas);G.xf(s,{s:[1,.5,1],t:[Math.cos(a)*r,1.1+(.35-r*.4),Math.sin(a)*r]});M.push(s);}
  return [{g:tl,m:"vc"},{g:cap,m:"vc"},{g:G.merge(...M),m:"vc"}];}});
def({id:"pasto_alto",nombre:"Pasto alto",cat:"planta",grp:["bosque","africa","granja"],alto:1.1,paleta:{hoja:"#5a9a3a",hoja2:"#b8c85a"},build:(f,rnd)=>{
  const c1=H(f.paleta.hoja),c2=H(f.paleta.hoja2),L=[];
  for(let k=0;k<40;k++){const a=rnd()*6.28,r=rnd()*.5,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.7+rnd()*.7,b=(rnd()-.5)*.5,d=rnd()*6.28;
    L.push(G.strip(G.bezier([x,0,z],[x+Math.cos(d)*b*.1,h*.4,z],[x+Math.cos(d)*b*.5,h*.8,z+Math.sin(d)*b*.5],[x+Math.cos(d)*b,h,z+Math.sin(d)*b],5),t=>.045*(1-t),mixc(c1,c2,rnd()),[Math.cos(d+1.5),0,Math.sin(d+1.5)]));}
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"nenufar",nombre:"Nenúfar",cat:"planta",grp:["selva","mar"],alto:.5,paleta:{hoja:"#2f8a3a",flor:"#ff9ac0"},build:(f,rnd)=>{
  const pad=G.lathe([[0,0],[1,.02],[1.05,.06],[1,.1]],20,H(f.paleta.hoja)),Pt=[];
  for(let k=0;k<8;k++){const a=k/8*6.28,p=G.sphere(.28,8,f.paleta.flor);G.xf(p,{s:[.5,1.4,.25],ry:-a,t:[Math.cos(a)*.2,.35,Math.sin(a)*.2]});Pt.push(p);}
  return [{g:pad,m:"vc"},{g:G.merge(...Pt),m:"vc"}];}});

/* ---- rocas y montañas ---- */
function rockMesh(f,seed,o){
  const m=G.ico(1,o.sub||4,f.paleta.roca);
  G.displace(m,(x,y,z)=>{
    const n=P.noise3(x*1.4+seed,y*1.4,z*1.4),rg=Math.abs(P.noise3(x*3+seed,y*3,z*3)-.5),fine=P.noise3(x*9,y*9,z*9)-.5;
    return (n-.5)*(o.big||.7)-rg*(o.ridge||.25)+fine*(o.fine||.06);
  });
  G.xf(m,{s:o.s||[1.15,.75,1]});
  const c1=H(f.paleta.roca),c2=H(f.paleta.roca2||f.paleta.roca),mo=H(f.paleta.musgo||f.paleta.roca);
  G.paint(m,(x,y,z,c,nn)=>{const g=P.noise3(x*6+seed,y*6,z*6),b=mixc(c1,c2,cl(g*1.2,0,1));return f.params.musgo&&nn[1]>.45?mixc(b,mo,.7*P.smooth(.4,.8,nn[1])):b;});
  return m;
}
const rk=(o)=>(f,rnd)=>[{g:rockMesh(f,f.semilla,Object.assign({},o,f.params)),m:"rock"}];
def({id:"roca",nombre:"Roca redonda",cat:"roca",grp:["bosque","cuento"],alto:1.2,paleta:{roca:"#8a8680",roca2:"#b0aaa0",musgo:"#5a8a40"},params:{musgo:1},build:rk({})});
def({id:"roca_angular",nombre:"Roca angular",cat:"roca",grp:["desierto"],alto:1.6,paleta:{roca:"#8a6a58",roca2:"#c0907a"},build:rk({ridge:.55,big:.9,s:[1,1.1,.85],sub:3})});
def({id:"penasco",nombre:"Peñasco grande",cat:"roca",grp:["frio","bosque"],alto:3.5,paleta:{roca:"#7a7a82",roca2:"#a8a8b0",musgo:"#5a8a40"},params:{musgo:1},build:(f,rnd)=>{
  const a=rockMesh(f,f.semilla,{s:[1.3,.9,1]}),b=rockMesh(f,f.semilla+9,{s:[.8,.6,.8]});G.xf(b,{t:[1.1,-.2,.4]});return [{g:G.merge(a,b),m:"rock"}];}});
def({id:"piedras",nombre:"Piedras pequeñas",cat:"roca",grp:["bosque","cuento"],alto:.5,paleta:{roca:"#8a8680",roca2:"#b0aaa0"},build:(f,rnd)=>{
  const L=[];for(let k=0;k<5;k++){const m=rockMesh(f,f.semilla+k*3,{sub:3,s:[1,.65,.85]});G.xf(m,{s:.25+rnd()*.3,t:[(rnd()-.5)*1.6,0,(rnd()-.5)*1.6],ry:rnd()*6});L.push(m);}
  return [{g:G.merge(...L),m:"rock"}];}});
def({id:"columna",nombre:"Columna de arenisca",cat:"roca",grp:["desierto","latam"],alto:6,paleta:{roca:"#c8784a",roca2:"#e8b078"},build:(f,rnd)=>{
  const prof=[[1.3,0],[1,.8],[.8,1.6],[.95,2.4],[.7,3.2],[.65,3.8],[1.1,4.1],[1.15,4.6],[.7,4.9]];
  const m=G.lathe(prof,24,f.paleta.roca);G.displace(m,(x,y,z)=>(P.noise3(x*2.4,y*1.6,z*2.4)-.5)*.35);
  const c1=H(f.paleta.roca),c2=H(f.paleta.roca2);G.paint(m,(x,y,z)=>mixc(c1,c2,cl(.5+Math.sin(y*5+P.noise3(x,y,z)*2)*.45,0,1)));
  return [{g:m,m:"rock"}];}});
def({id:"cristales",nombre:"Cristales",cat:"roca",grp:["magia","frio"],alto:2.4,paleta:{cristal:"#7ad0ff",cristal2:"#d8f4ff"},build:(f,rnd)=>{
  const L=[];for(let k=0;k<8;k++){const a=rnd()*6.28,r=rnd()*.7,h=.8+rnd()*1.4,w=.14+rnd()*.12;
    const body=G.cyl(w,w,h,6,f.paleta.cristal,true),tip=G.cone(w,w*2.4,6,f.paleta.cristal2);G.xf(tip,{t:[0,h,0]});
    const c=G.merge(body,tip);G.xf(c,{rx:(rnd()-.5)*.6,rz:(rnd()-.5)*.6,t:[Math.cos(a)*r,0,Math.sin(a)*r]});L.push(c);}
  return [{g:G.merge(...L),m:"glass"}];}});
function mountain(f,o){
  const m=G.lathe([[o.R,0],[o.R*.7,o.H*.35],[o.R*.4,o.H*.65],[o.R*.15,o.H*.9],[0,o.H]],64,"#888",{caps:false});
  /* más anillos: re-muestrear el perfil con subdivisiones */
  return m;
}
function mtn(f,rnd,o){
  const prof=[];const N=36;for(let i=0;i<=N;i++){const t=i/N;prof.push([o.R*Math.pow(1-t,.85),o.H*t]);}
  const m=G.lathe(prof,72,"#888",{caps:false});
  G.displace(m,(x,y,z)=>{const t=y/o.H;return ((P.noise3(x*.22+f.semilla,y*.22,z*.22)-.5)*o.R*.5+Math.abs(P.noise3(x*.7,y*.7,z*.7)-.5)*-o.R*.18)*(1-t*.6)*(t<.02?0:1);});
  const base=H(f.paleta.base),rock=H(f.paleta.roca),snow=H(f.paleta.nieve||"#ffffff");
  G.paint(m,(x,y,z,c,nn)=>{const t=y/o.H,n=P.noise3(x*.5,y*.5,z*.5);
    let col=mixc(base,rock,cl(t*2.2-.3+n*.3,0,1));
    if(o.snow)col=mixc(col,snow,P.smooth(.62,.78,t+(n-.5)*.18+nn[1]*.1));
    return col;});
  return m;
}
def({id:"montana",nombre:"Montaña nevada",cat:"roca",grp:["frio","latam"],alto:12,paleta:{base:"#5a7a44",roca:"#8a8a94",nieve:"#ffffff"},build:(f,rnd)=>[{g:mtn(f,rnd,{R:9,H:12,snow:1}),m:"rock"}]});
def({id:"colina",nombre:"Colina",cat:"roca",grp:["bosque","granja","cuento"],alto:4,paleta:{base:"#6aaa48",roca:"#8aba58"},build:(f,rnd)=>[{g:mtn(f,rnd,{R:9,H:4,snow:0}),m:"vc"}]});
def({id:"volcan",nombre:"Volcán",cat:"roca",grp:["prehi","latam"],alto:8,paleta:{base:"#4a3a34",roca:"#6a5048",lava:"#ff7a2a"},build:(f,rnd)=>{
  const prof=[];const N=30;for(let i=0;i<=N;i++){const t=i/N;let r=7*Math.pow(1-t,.9);if(t>.88)r=Math.max(r,1.05+(t-.88)*0);prof.push([r,6*t]);}
  prof.push([.8,5.6],[.01,5.5]);
  const m=G.lathe(prof,64,"#555",{caps:false});
  G.displace(m,(x,y,z)=>(P.noise3(x*.3+f.semilla,y*.3,z*.3)-.5)*1.4*Math.min(1,y/2));
  const b=H(f.paleta.base),r=H(f.paleta.roca);G.paint(m,(x,y,z)=>mixc(b,r,cl(y/6+(P.noise3(x,y,z)-.5)*.4,0,1)));
  const lava=G.cyl(1,1,.1,20,f.paleta.lava,true);G.xf(lava,{t:[0,5.4,0]});
  const L=[];for(let k=0;k<4;k++){const a=k*1.6+rnd(),ca=Math.cos(a),sa=Math.sin(a);L.push(G.tube([[ca*1.1,5.9,sa*1.1],[ca*2.2,4.6,sa*2.2],[ca*3.4,3,sa*3.4],[ca*4.4,1.6,sa*4.4]],i=>.16-i*.03,6,f.paleta.lava,true));}
  return [{g:m,m:"rock"},{g:G.merge(lava,...L),m:"emit"}];}});
def({id:"isla_flotante",nombre:"Isla flotante",cat:"roca",grp:["magia","cuento"],alto:5,paleta:{roca:"#8a7a6a",pasto:"#5ab04a"},build:(f,rnd)=>{
  const under=G.lathe([[3,0],[2.6,-.8],[1.8,-2],[.9,-3.2],[.1,-3.9]],20,f.paleta.roca,{caps:false});
  G.displace(under,(x,y,z)=>(P.noise3(x*1.2,y*1.2,z*1.2)-.5)*.7);
  const top=G.lathe([[0,.25],[2.9,.2],[3.05,0]],24,f.paleta.pasto);
  return [{g:under,m:"rock"},{g:top,m:"vc"}];}});
})(window);
