/* Biblioteca: naves, vehículos y espacio */
(function(root){
"use strict";
const G=root.Geo,P=root.Proc,Cat=root.Cat,def=Cat.def,H=G.hex;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const bx=(w,h,d,col,x,y,z)=>{const m=G.box(w,h,d,col);G.xf(m,{t:[x||0,y||0,z||0]});return m;};
const cy=(r0,r1,h,seg,col,x,y,z,o)=>{const m=G.cyl(r0,r1,h,seg,col,true);G.xf(m,Object.assign({t:[x||0,y||0,z||0]},o||{}));return m;};
const planetCol=(f,seed,bands)=>{const c1=H(f.paleta.a),c2=H(f.paleta.b);return (x,y,z)=>{const n=P.noise3(x*1.5+seed,y*3,z*1.5);const t=bands?cl(.5+Math.sin(y*bands+n*3)*.5,0,1):cl(n*1.4,0,1);return mixc(c1,c2,t);};};

def({id:"cohete",nombre:"Cohete",cat:"nave",grp:["espacio"],alto:8,paleta:{cuerpo:"#f4f4f4",punta:"#d9402f",aleta:"#d9402f",ventana:"#7ad0ff",fuego:"#ffa02a"},build:(f)=>{
  const body=G.lathe([[0,0],[1,.1],[1.1,1],[1.1,4],[.95,5.3],[.6,6.6],[.2,7.6],[0,7.9]],20,(y)=>y>5.6?f.paleta.punta:f.paleta.cuerpo);
  const L=[];for(let k=0;k<3;k++){const a=k/3*6.28,fin=G.prism([[0,0],[1.4,-.2],[1.4,.2],[0,1.8]].map(([x,y])=>[x,y]),.12,f.paleta.aleta);G.xf(fin,{ry:-a+Math.PI/2,t:[Math.cos(a)*1,.7,Math.sin(a)*1]});L.push(fin);}
  const win=G.cyl(.4,.4,.15,14,f.paleta.ventana,true);G.xf(win,{rx:Math.PI/2,t:[0,3.3,1.05]});
  const fl=G.cone(.7,1.6,12,f.paleta.fuego);G.xf(fl,{rx:Math.PI,t:[0,.1,0]});
  return [{g:G.merge(body,...L),m:"vc"},{g:win,m:"glass"},{g:fl,m:"emit"}];}});
def({id:"ovni",nombre:"OVNI",cat:"nave",grp:["espacio","magia"],alto:2.4,paleta:{casco:"#b8c0d0",cupula:"#7affc8",luz:"#ffe97a"},build:(f)=>{
  const disc=G.lathe([[0,0],[.9,.1],[2.4,.5],[3,.9],[2.4,1.2],[1.2,1.3],[0,1.3]],28,f.paleta.casco);
  const dome=G.lathe((()=>{const p=[];for(let k=0;k<=8;k++){const a=k/8*Math.PI/2;p.push([1.1*Math.cos(a),1.2+.95*Math.sin(a)]);}return p;})(),18,f.paleta.cupula,{caps:false});
  const lights=[];for(let k=0;k<8;k++){const a=k/8*6.28,s=G.sphere(.16,6,f.paleta.luz);G.xf(s,{t:[Math.cos(a)*2.7,.8,Math.sin(a)*2.7]});lights.push(s);}
  return [{g:disc,m:"vc"},{g:dome,m:"glass"},{g:G.merge(...lights),m:"emit"}];}});
def({id:"nave_caza",nombre:"Nave caza",cat:"nave",grp:["espacio"],alto:1.6,paleta:{casco:"#8aa0c8",ala:"#5a6a90",cabina:"#7ad0ff",fuego:"#7ab0ff"},build:(f)=>{
  const body=G.lathe([[0,0],[.35,.4],[.55,1.6],[.5,3],[.3,4.2],[0,4.8]],12,f.paleta.casco);G.xf(body,{rx:Math.PI/2,t:[0,.5,-2.4]});
  const wing=(s)=>{const w=G.prism([[0,0],[2.6,-.9],[2.6,-.4],[0,1.3]],.1,f.paleta.ala);G.xf(w,{rx:-Math.PI/2,s:[s,1,1],t:[0,.5,.8]});return w;};
  const cab=G.sphere(.38,10,f.paleta.cabina);G.xf(cab,{s:[1,.8,1.8],t:[0,.9,-.5]});
  const fl=[-.25,.25].map(x=>{const c=G.cone(.2,.9,8,f.paleta.fuego);G.xf(c,{rx:Math.PI/2,t:[x,.5,2.5]});return c;});
  return [{g:G.merge(body,wing(1),wing(-1)),m:"vc"},{g:cab,m:"glass"},{g:G.merge(...fl),m:"emit"}];}});
def({id:"transbordador",nombre:"Transbordador",cat:"nave",grp:["espacio"],alto:3,paleta:{cuerpo:"#f4f4f4",oscuro:"#2b2b33",tanque:"#e8884a",cohete:"#dcdcdc"},build:(f)=>{
  const bd=G.lathe([[0,0],[.5,.3],[.75,1.5],[.75,5],[.6,6],[0,6.4]],12,f.paleta.cuerpo);G.xf(bd,{rx:Math.PI/2,t:[0,1.3,-3.2]});
  const tk=G.lathe([[0,0],[.65,.4],[.7,1.5],[.7,6.5],[.4,7.2],[0,7.6]],12,f.paleta.tanque);G.xf(tk,{rx:Math.PI/2,t:[0,.1,-3.6]});
  const wing=(s)=>{const w=G.prism([[0,0],[2.4,-.2],[2.4,.2],[0,2.2]],.1,f.paleta.cuerpo);G.xf(w,{rx:-Math.PI/2,s:[s,1,1],t:[0,1.2,1.2]});return w;};
  return [{g:G.merge(bd,tk,wing(1),wing(-1)),m:"vc"},{g:G.merge(bx(.8,.14,.9,f.paleta.oscuro,0,1.6,-3.3)),m:"vc"}];}});
def({id:"estacion",nombre:"Estación espacial",cat:"nave",grp:["espacio"],alto:3,paleta:{modulo:"#d8dce6",panel:"#2a4a9a",acento:"#e8762c"},build:(f)=>{
  const L=[],S=[];
  L.push(bx(8,.28,.28,"#8a90a0",-4,2.1,-.14));
  L.push(cy(.6,.6,3.2,14,f.paleta.modulo,0,0,0,{rx:Math.PI/2,t:[0,2.25,-1.6]}));
  L.push(cy(.5,.5,2.6,14,f.paleta.modulo,0,0,0,{rz:Math.PI/2,t:[-1.3,2.25,0]}));
  const dome=G.sphere(.5,10,f.paleta.acento);G.xf(dome,{t:[0,2.25,-3.3]});L.push(dome);
  for(const sx of [-1,1])for(const dz of [-1,1]){S.push(bx(2.6,.06,1.5,f.paleta.panel,sx*3.9-1.3+1.3,2.1,dz*1.1));}
  for(const sx of [-1,1])L.push(bx(.1,.1,2.2,"#8a90a0",sx*3.9,2.1,-1.1));
  return [{g:G.merge(...L),m:"vc"},{g:G.merge(...S),m:"vc"}];}});
def({id:"barco_pirata",nombre:"Barco pirata",cat:"nave",grp:["mar","cuento"],alto:12,paleta:{casco:"#6a4a2a",vela:"#f3e6c4",bandera:"#1a1a1a",madera:"#8a5a2a"},build:(f)=>{
  const hull=G.prism([[-4,2],[-3.2,0],[3,0],[4.2,1.6],[4.8,2.4],[3,2.2],[-3.6,2.4]],2.2,f.paleta.casco);
  const L=[hull];
  L.push(cy(.14,.14,9,8,f.paleta.madera,-.6,2,0),cy(.12,.12,7,8,f.paleta.madera,2,2,0),cy(.1,.1,4,8,f.paleta.madera,0,0,0,{rx:Math.PI/2,t:[-4.4,2,-2]}));
  const sails=[];sails.push(G.box(.06,3.4,3,f.paleta.vela),G.box(.06,3,2.4,f.paleta.vela),G.box(.06,2.6,2.8,f.paleta.vela));G.xf(sails[0],{t:[-.6,4.4,0]});G.xf(sails[1],{t:[-.6,8,0]});G.xf(sails[2],{t:[2,4.2,0]});
  const fl=G.prism([[0,0],[0,.7],[1.1,.35]],.04,f.paleta.bandera);G.xf(fl,{t:[-.6,10.6,0]});
  return [{g:G.merge(...L,fl),m:"vc"},{g:G.merge(...sails),m:"vc"}];}});
def({id:"velero",nombre:"Velero",cat:"nave",grp:["mar"],alto:7,paleta:{casco:"#f4f4f4",franja:"#2a6ac8",vela:"#fff6e0"},build:(f)=>{
  const hull=G.prism([[-2.4,1],[-1.8,0],[1.8,0],[3,1]],.9,f.paleta.casco),st=bx(5.4,.2,.92,f.paleta.franja,0,.55,0);G.xf(st,{});
  const mast=cy(.07,.06,5.6,8,"#8a5a2a",0,1,0),s1=G.prism([[0,0],[2,0],[0,4.6]],.04,f.paleta.vela),s2=G.prism([[0,0],[-1.6,0],[0,3.6]],.04,f.paleta.vela);G.xf(s1,{t:[.15,1.4,0]});G.xf(s2,{t:[-.15,1.5,0]});
  return [{g:G.merge(hull,mast),m:"vc"},{g:G.merge(s1,s2),m:"vc"}];}});
def({id:"bote",nombre:"Bote de remos",cat:"nave",grp:["mar","cuento"],alto:.9,paleta:{casco:"#b8502f",interior:"#a8743c"},build:(f)=>{
  const h=G.prism([[-2,.8],[-1.4,0],[1.4,0],[2.2,.8],[1.4,.9],[-1.4,.9]],1.4,f.paleta.casco),i=G.prism([[-1.8,.85],[-1.3,.35],[1.3,.35],[2,.85]],1.2,f.paleta.interior);
  return [{g:G.merge(h,i,bx(.14,.1,1.3,f.paleta.interior,0,.6,0)),m:"vc"}];}});
def({id:"globo",nombre:"Globo aerostático",cat:"nave",grp:["cuento","magia"],alto:9,paleta:{a:"#d9402f",b:"#ffd34d",cesta:"#a8743c"},build:(f)=>{
  const bl=G.lathe((()=>{const p=[[0,0]];for(let k=1;k<=12;k++){const a=k/12*Math.PI;p.push([2.2*Math.sin(a)*(1-.15*Math.cos(a)),3.2-3.2*Math.cos(a)*(k>10?.9:1)]);}return p;})(),20,f.paleta.a);
  G.paint(bl,(x,y,z)=>Math.floor((Math.atan2(z,x)+3.15)/6.3*10)%2?H(f.paleta.a):H(f.paleta.b));G.xf(bl,{t:[0,2.8,0]});
  const bk=bx(1,.7,1,f.paleta.cesta,0,0,0),L=[bk];
  for(const [x,z] of [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])L.push(G.tube([[x,.7,z],[x*1.6,2,z*1.6],[x*2.2,3.2,z*2.2]],i=>.02,4,"#444",true));
  return [{g:G.merge(bl,...L),m:"vc"}];}});
def({id:"auto",nombre:"Auto",cat:"nave",grp:["ciudad"],alto:1.6,paleta:{carroceria:"#d9402f",vidrio:"#9ad8ff",llanta:"#2b2b33"},build:(f)=>{
  const L=[bx(4,.7,1.8,f.paleta.carroceria,0,.35,0),bx(2,.55,1.6,f.paleta.carroceria,-.1,1.05,0)];
  for(const x of [-1.3,1.3])for(const z of [-.85,.85]){const t=G.cyl(.42,.42,.3,14,f.paleta.llanta,true);G.xf(t,{rx:Math.PI/2,t:[x,.42,z-.15]});L.push(t);}
  L.push(bx(.15,.2,.3,"#ffe97a",2,.5,.6),bx(.15,.2,.3,"#ffe97a",2,.5,-.6));
  const gl=bx(2.04,.4,1.64,f.paleta.vidrio,-.1,1.12,0);
  return [{g:G.merge(...L),m:"vc"},{g:gl,m:"glass"}];}});
def({id:"avion",nombre:"Avión",cat:"nave",grp:["cielo"],alto:3,paleta:{cuerpo:"#f4f4f4",ala:"#2a6ac8",ventana:"#7ad0ff"},build:(f)=>{
  const fu=G.lathe([[0,0],[.6,.6],[.75,2],[.7,6],[.3,8.6],[.12,9]],14,f.paleta.cuerpo);G.xf(fu,{rx:Math.PI/2,t:[0,1,-4.5]});
  const wing=(s)=>{const w=G.prism([[0,0],[3.8,-1.4],[3.8,-.9],[0,1.6]],.14,f.paleta.ala);G.xf(w,{rx:-Math.PI/2,s:[s,1,1],t:[0,.9,-.4]});return w;};
  const tail=G.prism([[0,0],[.1,1.8],[1,0]],.1,f.paleta.ala);G.xf(tail,{ry:Math.PI/2,t:[0,1.4,3.5]});
  const tw=(s)=>{const w=G.prism([[0,0],[1.4,-.4],[1.4,-.1],[0,.8]],.08,f.paleta.ala);G.xf(w,{rx:-Math.PI/2,s:[s,1,1],t:[0,1.2,3.8]});return w;};
  return [{g:G.merge(fu,wing(1),wing(-1),tail,tw(1),tw(-1)),m:"vc"}];}});
def({id:"carreta",nombre:"Carreta",cat:"nave",grp:["granja","cuento","latam"],alto:2.2,paleta:{madera:"#a8743c",rueda:"#6a4a2a",lona:"#f3e6c4"},build:(f)=>{
  const L=[bx(3,.2,1.6,f.paleta.madera,0,.8,0),bx(3,.5,.1,f.paleta.madera,0,1,.8),bx(3,.5,.1,f.paleta.madera,0,1,-.8)];
  for(const z of [-.95,.95]){const w=G.lathe([[.8,0],[.8,.12]],18,f.paleta.rueda,{caps:false});G.xf(w,{rx:Math.PI/2,t:[0,.8,z-.06]});L.push(w);for(let k=0;k<6;k++){const a=k/6*3.14,s=bx(.08,1.6,.08,f.paleta.rueda,0,-.8,0);G.xf(s,{rz:a,t:[0,.8,z]});L.push(s);}}
  const hood=G.prism([[-.8,0],[.8,0],[0,.5]],3,f.paleta.lona);
  return [{g:G.merge(...L),m:"vc"}];}});

/* ---- espacio ---- */
const ball=(id,nombre,r,a,b,bands,grp)=>def({id,nombre,cat:"espacio",grp:grp||["espacio"],alto:r*2,paleta:{a,b},build:(f)=>{const m=G.ico(r,4,a);G.displace(m,(x,y,z)=>bands?0:(P.noise3(x*1.2+f.semilla,y*1.2,z*1.2)-.5)*r*.08);G.paint(m,planetCol(f,f.semilla,bands));return [{g:m,m:"vc"}];}});
ball("planeta_rocoso","Planeta rocoso",3,"#a8583a","#e8b078",0);
ball("planeta_gas","Planeta gaseoso",4,"#d8a868","#f4e4c0",9);
ball("planeta_hielo","Planeta de hielo",3,"#6ab0e8","#e0f4ff",5);
ball("planeta_tierra","Planeta verde",3,"#2a6ac8","#4aa84a",0,["espacio","cuento"]);
def({id:"planeta_anillos",nombre:"Planeta con anillos",cat:"espacio",grp:["espacio"],alto:8,paleta:{a:"#e8c070",b:"#f8ecc0",anillo:"#c8a060"},build:(f)=>{
  const m=G.ico(2.6,4,f.paleta.a);G.paint(m,planetCol(f,f.semilla,10));
  const ring=G.lathe([[3.4,0],[5.2,0]],48,f.paleta.anillo,{caps:false});G.paint(ring,(x,y,z)=>{const r=Math.hypot(x,z);return mixc(H(f.paleta.anillo),H("#f4e4c0"),cl(.5+Math.sin(r*9)*.45,0,1));});G.xf(ring,{rz:.35});
  return [{g:m,m:"vc"},{g:ring,m:"vc"}];}});
def({id:"sol",nombre:"Sol",cat:"espacio",grp:["espacio","cielo"],alto:6,paleta:{a:"#ffd34d",b:"#ff9a2a"},build:(f)=>{const m=G.ico(3,3,f.paleta.a);G.paint(m,planetCol(f,f.semilla,0));return [{g:m,m:"emit"}];}});
def({id:"luna",nombre:"Luna con cráteres",cat:"espacio",grp:["espacio","noche","cielo"],alto:5,paleta:{a:"#d8d8d0",b:"#9a9a94"},build:(f,rnd)=>{
  const cr=[];for(let k=0;k<14;k++){const v=[rnd()*2-1,rnd()*2-1,rnd()*2-1],l=Math.hypot(...v);cr.push([v[0]/l,v[1]/l,v[2]/l,.18+rnd()*.3,.08+rnd()*.1]);}
  const m=G.ico(2.5,4,f.paleta.a);
  G.displace(m,(x,y,z)=>{const l=Math.hypot(x,y,z),u=[x/l,y/l,z/l];let d=0;for(const c of cr){const dd=Math.hypot(u[0]-c[0],u[1]-c[1],u[2]-c[2]);if(dd<c[3])d-=c[4]*(1-dd/c[3]);if(dd>=c[3]&&dd<c[3]*1.25)d+=c[4]*.3*(1-(dd-c[3])/(c[3]*.25));}return d;});
  G.paint(m,(x,y,z)=>mixc(H(f.paleta.a),H(f.paleta.b),cl((P.noise3(x*2,y*2,z*2)-.3)*1.2,0,1)));
  return [{g:m,m:"vc"}];}});
def({id:"asteroide",nombre:"Asteroide",cat:"espacio",grp:["espacio"],alto:2,paleta:{roca:"#7a7068",roca2:"#a89e90"},build:(f)=>{
  const m=G.ico(1,4,f.paleta.roca);G.displace(m,(x,y,z)=>(P.noise3(x*1.3+f.semilla,y*1.3,z*1.3)-.5)*.9+(P.noise3(x*4,y*4,z*4)-.5)*.15);G.xf(m,{s:[1.3,.8,1]});
  G.paint(m,(x,y,z)=>mixc(H(f.paleta.roca),H(f.paleta.roca2),cl(P.noise3(x*5,y*5,z*5)*1.3,0,1)));return [{g:m,m:"rock"}];}});
def({id:"cometa",nombre:"Cometa",cat:"espacio",grp:["espacio","cielo"],alto:3,paleta:{nucleo:"#d8f0ff",cola:"#7ac8ff"},build:(f)=>{
  const n=G.ico(.9,3,f.paleta.nucleo);G.displace(n,(x,y,z)=>(P.noise3(x*2,y*2,z*2)-.5)*.2);
  const tail=G.lathe([[0,0],[.8,0],[.4,3],[0,6]],16,f.paleta.cola,{caps:false});G.paint(tail,(x,y,z)=>mixc(H(f.paleta.nucleo),H(f.paleta.cola),cl(y/6,0,1)));G.xf(tail,{rx:-Math.PI/2,rz:.0,t:[0,0,0]});
  return [{g:n,m:"vc"},{g:tail,m:"emit"}];}});
def({id:"estrella",nombre:"Estrella",cat:"espacio",grp:["cielo","noche","magia"],alto:1.6,paleta:{a:"#ffe97a"},build:(f)=>{
  const pts=[];for(let k=0;k<10;k++){const a=k/10*6.28+Math.PI/2,r=k%2?.38:1;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
  const L=[];for(let k=0;k<10;k++){const a=pts[k],b=pts[(k+1)%10];L.push(G.prism([[0,0],[a[0],a[1]],[b[0],b[1]]].map(([x,y])=>[x,y]),.3,f.paleta.a));}
  const m=G.merge(...L);G.xf(m,{t:[0,1,0]});return [{g:m,m:"emit"}];}});
})(window);
