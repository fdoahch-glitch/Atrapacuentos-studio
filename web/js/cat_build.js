/* Biblioteca: casas, edificios y objetos (todo dibujado por código) */
(function(root){
"use strict";
const G=root.Geo,P=root.Proc,Cat=root.Cat,def=Cat.def,H=G.hex;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const bx=(w,h,d,col,x,y,z,ry)=>{const m=G.box(w,h,d,col);G.xf(m,{t:[x||0,y||0,z||0],ry:ry||0});return m;};
const cy=(r0,r1,h,seg,col,x,y,z,o)=>{const m=G.cyl(r0,r1,h,seg,col,true);G.xf(m,Object.assign({t:[x||0,y||0,z||0]},o||{}));return m;};
const hemi=(r,seg,col)=>{const pr=[];for(let k=0;k<=8;k++){const a=k/8*Math.PI/2;pr.push([r*Math.cos(a),r*Math.sin(a)]);}return G.lathe(pr,seg||16,col,{caps:false});};
const gable=(w,rh,d,col,y)=>{const m=G.prism([[-w/2,0],[w/2,0],[0,rh]],d,col);G.xf(m,{t:[0,y,0]});return m;};
const wins=(w,d,rows,cols,y0,gap,col)=>{const L=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=(c-(cols-1)/2)*gap;L.push(bx(.5,.55,.07,col,x,y0+r*1.3,d/2+.02));L.push(bx(.5,.55,.07,col,x,y0+r*1.3,-d/2-.02));}
  return G.merge(...L);};
function house(f,o){
  const w=o.w,h=o.h,d=o.d,wall=f.paleta.pared,roof=f.paleta.techo;
  const body=G.box(w,h,d,wall);
  if(o.brick)G.paint(body,(x,y,z,c)=>{const row=Math.floor(y*5),off=(row%2)*.5,b=((x*3+off)%1+1)%1;return (b<.06||(y*5)%1<.08)?mixc(c,[.85,.8,.75],.7):mixc(c,[0,0,0],(P.hash(Math.floor(x*3+off),row,3)-.5)*.2);});
  const r=gable(w+.5,o.rh,d+.5,roof,h);
  const door=bx(.9,1.5,.08,f.paleta.puerta,w*(o.doorX||0),0,d/2+.02),ch=bx(.5,1.3,.5,f.paleta.pared2||"#8a6a58",w*.28,h+o.rh*.35,-d*.15);
  const parts=[{g:G.merge(body,r,door,ch),m:"vc"},{g:wins(w,d,o.floors||1,Math.max(2,Math.round(w/2.2)),1.2,Math.min(2.2,w/2.4),"#bfe6ff"),m:"glass"}];
  return parts;
}
const HS={w:4,h:2.6,d:3.6,rh:1.8};
def({id:"casa_madera",nombre:"Casa de madera",cat:"casa",grp:["cuento","bosque"],alto:4.6,paleta:{pared:"#b8864e",techo:"#a8402c",puerta:"#5a3a22"},build:(f)=>house(f,Object.assign({},HS,{doorX:.0}))});
def({id:"casa_ladrillo",nombre:"Casa de ladrillos",cat:"casa",grp:["cuento","ciudad"],alto:4.8,paleta:{pared:"#c4603a",techo:"#4a4a58",puerta:"#4a2a1a"},build:(f)=>house(f,Object.assign({},HS,{brick:1,w:4.4}))});
def({id:"casa_paja",nombre:"Casa de paja",cat:"casa",grp:["cuento","granja"],alto:4.2,paleta:{pared:"#e8d070",techo:"#c8a040",puerta:"#6a4a22"},build:(f)=>house(f,Object.assign({},HS,{rh:2.1,w:3.6}))});
def({id:"casa_colonial",nombre:"Casa colonial",cat:"casa",grp:["latam","ciudad"],alto:6.5,paleta:{pared:"#f6e0a8",techo:"#b8502f",puerta:"#6a3a22"},build:(f)=>house(f,{w:6.4,h:4.6,d:4.4,rh:1.6,floors:2,doorX:0})});
def({id:"casa_hongo",nombre:"Casa hongo",cat:"casa",grp:["cuento","magia"],alto:5,paleta:{sombrero:"#d9402f",tallo:"#f3e6c4",motas:"#ffffff",puerta:"#6a4a22"},build:(f,rnd)=>{
  const st=G.lathe([[1.3,0],[1.1,1.4],[1.2,2.6]],14,f.paleta.tallo),cap=G.lathe([[0,0],[2.6,0],[2.8,.4],[2.5,1.3],[1.4,2.2],[0,2.5]],20,f.paleta.sombrero);G.xf(cap,{t:[0,2.5,0]});
  const door=bx(.8,1.3,.1,f.paleta.puerta,0,0,1.18),M=[];
  for(let k=0;k<8;k++){const a=k*.8+rnd(),r=1.2+rnd()*1.1,s=G.sphere(.22,6,f.paleta.motas);G.xf(s,{s:[1,.5,1],t:[Math.cos(a)*r,4.7-r*.35,Math.sin(a)*r]});M.push(s);}
  return [{g:G.merge(st,cap,door,...M),m:"vc"},{g:bx(.6,.6,.08,"#ffe9a0",.0,1.5,1.2),m:"glass"}];}});
def({id:"cabana",nombre:"Cabaña de troncos",cat:"casa",grp:["bosque","cuento"],alto:4.2,paleta:{tronco:"#8a5a30",tronco2:"#a8743c",techo:"#4a3a30",puerta:"#4a2a14"},build:(f,rnd)=>{
  const L=[],w=4.4,d=3.6;
  for(let r=0;r<7;r++){const y=.2+r*.38,c=mixc(H(f.paleta.tronco),H(f.paleta.tronco2),rnd());
    L.push(cy(.2,.2,w,8,c,0,y,d/2,{rz:Math.PI/2,t:[w/2,y,d/2]}),cy(.2,.2,w,8,c,0,y,-d/2,{rz:Math.PI/2,t:[w/2,y,-d/2]}),
      cy(.2,.2,d,8,c,0,y,0,{rx:Math.PI/2,t:[w/2,y,-d/2]}),cy(.2,.2,d,8,c,0,y,0,{rx:Math.PI/2,t:[-w/2,y,-d/2]}));}
  const roof=gable(w+.6,1.6,d+.6,f.paleta.techo,2.85),door=bx(.9,1.5,.1,f.paleta.puerta,0,0,d/2+.2);
  return [{g:G.merge(...L,roof,door),m:"vc"},{g:bx(.7,.6,.08,"#bfe6ff",1.4,1.1,d/2+.2),m:"glass"}];}});
def({id:"granero",nombre:"Granero",cat:"casa",grp:["granja"],alto:6.4,paleta:{pared:"#b8352a",techo:"#4a3a38",puerta:"#f3e6c4"},build:(f)=>{
  const body=G.box(5.2,2.8,6.6,f.paleta.pared),roof=G.prism([[-2.8,0],[2.8,0],[2.2,1.4],[0,2.6],[-2.2,1.4]],6.9,f.paleta.techo);G.xf(roof,{t:[0,2.8,0]});
  const dr=bx(2,2.2,.1,f.paleta.puerta,0,0,3.35),x1=bx(.12,2.7,.06,f.paleta.pared,0,0,3.4);G.xf(x1,{rz:.7,t:[0,0,0]});
  const tr=[bx(.15,.15,.06,f.paleta.pared,0,1.1,3.45)];
  return [{g:G.merge(body,roof,dr),m:"vc"}];}});
def({id:"castillo",nombre:"Castillo",cat:"casa",grp:["cuento","magia"],alto:11,paleta:{piedra:"#a8a4b4",techo:"#c8403a",puerta:"#4a2a1a",bandera:"#ffd34d"},build:(f,rnd)=>{
  const L=[],R=[];
  L.push(bx(5,4.4,4,f.paleta.piedra,0,0,0));
  for(const [x,z] of [[-3,-2.4],[3,-2.4],[-3,2.4],[3,2.4]]){L.push(cy(1,1.05,6.2,14,f.paleta.piedra,x,0,z));const c=G.cone(1.4,2.2,14,f.paleta.techo);G.xf(c,{t:[x,6.2,z]});R.push(c);}
  for(let k=0;k<9;k++)L.push(bx(.45,.5,.45,f.paleta.piedra,-2.3+k*.58,4.4,2.1));
  L.push(cy(1.2,1.2,3.8,14,f.paleta.piedra,0,0,-.4));const top=G.cone(1.7,2.8,14,f.paleta.techo);G.xf(top,{t:[0,3.8,-.4]});R.push(top);
  L.push(cy(.04,.04,1.3,4,"#555",0,6.6,-.4));
  const flag=G.prism([[0,0],[0,.6],[1,.3]],.04,f.paleta.bandera);G.xf(flag,{t:[0,7.4,-.4]});R.push(flag);
  const gate=bx(1.4,2.2,.1,f.paleta.puerta,0,0,2.02);
  return [{g:G.merge(...L,gate),m:"vc"},{g:G.merge(...R),m:"vc"}];}});
def({id:"choza",nombre:"Choza africana",cat:"casa",grp:["africa","cult"],alto:3.6,paleta:{pared:"#c88a50",techo:"#e0b850",puerta:"#4a2a14"},build:(f)=>{
  const wall=G.cyl(1.7,1.7,1.7,16,f.paleta.pared,true),roof=G.lathe([[2.3,0],[1.9,.5],[1,1.4],[0,2.1]],16,f.paleta.techo);G.xf(roof,{t:[0,1.7,0]});
  return [{g:G.merge(wall,roof,bx(.8,1.2,.1,f.paleta.puerta,0,0,1.68)),m:"vc"}];}});
def({id:"ruca",nombre:"Ruca mapuche",cat:"casa",grp:["latam","cult"],alto:3.2,paleta:{paja:"#c8a850",puerta:"#4a2a14"},build:(f)=>{
  const d=hemi(1,18,f.paleta.paja);G.xf(d,{s:[2.6,2.2,3.4]});
  const L=[];for(let k=0;k<6;k++){const a=(k/6-.5)*2.4,t=G.tube(G.bezier([Math.sin(a)*2.6,0,-3],[Math.sin(a)*2.6,2.2,-1.5],[Math.sin(a)*1.2,2.2,1.5],[Math.sin(a)*2.6,0,3],10),i=>.03,4,"#a88830",false);L.push(t);}
  return [{g:G.merge(d,...L,bx(1,1.4,.1,f.paleta.puerta,0,0,3.35)),m:"vc"}];}});
def({id:"tipi",nombre:"Tipi",cat:"casa",grp:["cult"],alto:4.4,paleta:{tela:"#e8c890",franja:"#c4512f",palo:"#7a5230"},build:(f)=>{
  const c=G.lathe([[1.8,0],[1.4,1],[.7,2.8],[.15,3.6]],14,(y)=>y>.7&&y<1?f.paleta.franja:f.paleta.tela);
  const P2=[];for(let k=0;k<6;k++){const a=k/6*6.28;P2.push(G.tube([[Math.cos(a)*.2,3.4,Math.sin(a)*.2],[Math.cos(a)*.5,4.2,Math.sin(a)*.5],[Math.cos(a)*.9,4.8,Math.sin(a)*.9]],i=>.045,5,f.paleta.palo,true));}
  return [{g:G.merge(c,...P2),m:"vc"},{g:bx(.8,1.6,.05,"#2a1a10",0,0,1.5),m:"vc"}];}});
def({id:"iglu",nombre:"Iglú",cat:"casa",grp:["frio"],alto:2.4,paleta:{hielo:"#eaf4ff",puerta:"#4a6a88"},build:(f)=>{
  const d=hemi(2,18,f.paleta.hielo),t=hemi(.8,12,f.paleta.hielo);G.xf(t,{s:[1,1,1.5],t:[0,0,1.9]});
  const dr=G.cyl(.5,.5,.05,12,f.paleta.puerta,true);G.xf(dr,{rx:Math.PI/2,t:[0,.5,3.1]});
  return [{g:G.merge(d,t,dr),m:"vc"}];}});
def({id:"molino",nombre:"Molino de viento",cat:"casa",grp:["granja","cuento"],alto:9,paleta:{torre:"#f3e6c4",techo:"#a8402c",aspa:"#8a5a2a",vela:"#f6f0e0"},build:(f)=>{
  const tw=G.lathe([[1.4,0],[.95,4.4]],8,f.paleta.torre),cap=G.cone(1.15,1.2,8,f.paleta.techo);G.xf(cap,{t:[0,4.4,0]});
  const bl=[];for(let k=0;k<4;k++){const a=k*Math.PI/2+.3,b=bx(.22,3.6,.1,f.paleta.aspa,0,0,0),v=bx(.9,2.8,.05,f.paleta.vela,.55,.5,.07);const m=G.merge(b,v);G.xf(m,{rz:a,t:[0,4.1,1.15]});bl.push(m);}
  const hub=G.sphere(.22,8,f.paleta.aspa);G.xf(hub,{t:[0,4.1,1.15]});
  return [{g:G.merge(tw,cap,hub,...bl,bx(.8,1.4,.1,"#4a2a14",0,0,1.35)),m:"vc"}];}});
def({id:"faro",nombre:"Faro",cat:"casa",grp:["mar"],alto:10,paleta:{a:"#f4f4f4",b:"#d9402f",luz:"#fff3a0"},build:(f)=>{
  const tw=G.lathe([[1.3,0],[.85,7]],16,(y)=>(Math.floor(y/1.2)%2)?f.paleta.b:f.paleta.a),gal=G.cyl(1.1,1.1,.2,16,"#444",true);G.xf(gal,{t:[0,7,0]});
  const lamp=G.cyl(.6,.6,1,12,f.paleta.luz,true);G.xf(lamp,{t:[0,7.2,0]});const cap=G.cone(.85,.9,12,f.paleta.b);G.xf(cap,{t:[0,8.2,0]});
  return [{g:G.merge(tw,gal,cap,bx(.7,1.3,.1,"#4a2a14",0,0,1.3)),m:"vc"},{g:lamp,m:"emit"}];}});
def({id:"templo_maya",nombre:"Templo maya",cat:"casa",grp:["latam","cult"],alto:8.6,paleta:{piedra:"#a8a490",piedra2:"#b8b4a0",puerta:"#3a382e"},build:(f)=>{
  const L=[];for(let k=0;k<5;k++){const s=9-k*1.5;L.push(bx(s,1.2,s,k%2?f.paleta.piedra:f.paleta.piedra2,0,k*1.2,0));}
  L.push(bx(2.6,1.9,2.4,f.paleta.piedra2,0,6,0),bx(3.1,.4,2.9,f.paleta.piedra,0,7.9,0),bx(2.4,.5,2.2,f.paleta.piedra,0,8.3,0));
  const st=G.prism([[0,0],[-4.6,0],[0,6]],1.6,f.paleta.piedra);G.xf(st,{ry:Math.PI/2,t:[0,0,0]});
  const door=bx(.9,1.4,.08,f.paleta.puerta,0,6,1.22);
  return [{g:G.merge(...L,st,door),m:"vc"}];}});
def({id:"piramide",nombre:"Pirámide",cat:"casa",grp:["africa","cult","desierto"],alto:7,paleta:{arena:"#e8c070",sombra:"#c8a050"},build:(f)=>{
  const p=G.cone(5,7,4,f.paleta.arena);G.xf(p,{ry:Math.PI/4});
  G.paint(p,(x,y,z,c)=>(Math.floor(y*2.2)%2)?mixc(c,[.6,.45,.2],.18):c);
  return [{g:G.merge(p,bx(1.2,1.6,.2,"#3a2a14",0,0,2.4)),m:"vc"}];}});
def({id:"torre",nombre:"Torre de piedra",cat:"casa",grp:["cuento","magia"],alto:9,paleta:{piedra:"#a8a4b4",techo:"#4a62b8"},build:(f)=>{
  const t=G.cyl(1.4,1.2,6.6,14,f.paleta.piedra,true),r=G.cone(1.9,2.8,14,f.paleta.techo);G.xf(r,{t:[0,6.6,0]});
  const w=[bx(.4,.9,.1,"#222",0,2.4,1.3),bx(.4,.9,.1,"#222",0,4.4,1.18)];
  return [{g:G.merge(t,r,bx(.9,1.5,.1,"#4a2a14",0,0,1.38)),m:"vc"},{g:G.merge(...w),m:"vc"}];}});
def({id:"pozo",nombre:"Pozo",cat:"casa",grp:["cuento","granja"],alto:3,paleta:{piedra:"#9a9690",techo:"#a8402c",madera:"#6a4a2a"},build:(f)=>{
  const ring=G.lathe([[1.1,0],[1.1,1],[.8,1],[.8,0]],14,f.paleta.piedra,{caps:false});
  const w=G.cyl(.7,.7,.04,12,"#1a3a5a",true);G.xf(w,{t:[0,.7,0]});
  const roof=gable(2.8,1,1.8,f.paleta.techo,2.6);
  return [{g:G.merge(ring,bx(.14,2.6,.14,f.paleta.madera,-1,0,0),bx(.14,2.6,.14,f.paleta.madera,1,0,0),roof,cy(.05,.05,2.2,6,f.paleta.madera,0,1.4,0,{rz:Math.PI/2,t:[-1.1,2,0]})),m:"vc"},{g:w,m:"vc"}];}});
def({id:"valla",nombre:"Valla de madera",cat:"casa",grp:["granja","cuento"],alto:1.1,paleta:{madera:"#b8864e"},build:(f,rnd)=>{
  const L=[];for(let k=0;k<7;k++)L.push(bx(.2,1.1+rnd()*.08,.14,f.paleta.madera,-2.1+k*.7,0,0));
  L.push(bx(4.6,.12,.08,f.paleta.madera,0,.35,.1),bx(4.6,.12,.08,f.paleta.madera,0,.75,.1));
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"tienda_campana",nombre:"Tienda de campaña",cat:"casa",grp:["bosque"],alto:2.2,paleta:{tela:"#e8762c",puerta:"#2a1a10"},build:(f)=>{
  const t=G.prism([[-1.6,0],[1.6,0],[0,2.2]],3,f.paleta.tela);const d=G.prism([[-.6,0],[.6,0],[0,1.3]],.05,f.paleta.puerta);G.xf(d,{t:[0,0,1.52]});
  return [{g:G.merge(t,d),m:"vc"}];}});
def({id:"edificio",nombre:"Edificio alto",cat:"casa",grp:["ciudad"],alto:16,paleta:{pared:"#8a96b4",ventana:"#ffe9a0"},params:{pisos:8},build:(f,rnd)=>{
  const n=f.params.pisos,h=n*1.5,body=G.box(5,h,5,f.paleta.pared),W=[];
  for(let r=0;r<n;r++)for(let c=0;c<4;c++){if(rnd()<.18)continue;const x=-1.8+c*1.2;W.push(bx(.7,.75,.06,f.paleta.ventana,x,.5+r*1.5,2.52));W.push(bx(.7,.75,.06,f.paleta.ventana,x,.5+r*1.5,-2.52));W.push(bx(.06,.75,.7,f.paleta.ventana,2.52,.5+r*1.5,x));W.push(bx(.06,.75,.7,f.paleta.ventana,-2.52,.5+r*1.5,x));}
  return [{g:G.merge(body,bx(5.4,.3,5.4,"#555",0,h,0)),m:"vc"},{g:G.merge(...W),m:"emit"}];}});

/* ---- objetos ---- */
def({id:"cofre",nombre:"Cofre del tesoro",cat:"objeto",grp:["magia","mar","cuento"],alto:1.1,paleta:{madera:"#8a5a2a",metal:"#d9a42a"},build:(f)=>{
  const base=G.box(1.8,.8,1.1,f.paleta.madera),lid=G.lathe([[.55,0],[.55,0],[0,.0]],4,f.paleta.madera,{caps:false});
  const top=G.cyl(.55,.55,1.8,14,f.paleta.madera,true);G.xf(top,{rz:Math.PI/2,t:[.9,.8,0]});
  const lock=bx(.2,.3,.1,f.paleta.metal,0,.5,.58),b1=bx(.14,.84,1.14,f.paleta.metal,-.5,0,0),b2=bx(.14,.84,1.14,f.paleta.metal,.5,0,0);
  return [{g:G.merge(base,top),m:"vc"},{g:G.merge(lock,b1,b2),m:"vc"}];}});
def({id:"farol",nombre:"Farol de calle",cat:"objeto",grp:["ciudad","cuento"],alto:4,paleta:{poste:"#2b2b33",luz:"#fff0a0"},build:(f)=>{
  const p=G.lathe([[.18,0],[.12,.4],[.07,3.2]],8,f.paleta.poste),cap=G.cone(.4,.35,6,f.paleta.poste);G.xf(cap,{t:[0,3.8,0]});
  const lamp=G.cyl(.28,.22,.55,6,f.paleta.luz,true);G.xf(lamp,{t:[0,3.25,0]});
  return [{g:G.merge(p,cap),m:"vc"},{g:lamp,m:"emit"}];}});
def({id:"banca",nombre:"Banca",cat:"objeto",grp:["ciudad","cuento"],alto:1.1,paleta:{madera:"#a8743c",metal:"#2b2b33"},build:(f)=>{
  const L=[bx(1.8,.08,.18,f.paleta.madera,0,.45,-.1),bx(1.8,.08,.18,f.paleta.madera,0,.45,.12),bx(1.8,.08,.14,f.paleta.madera,0,.85,-.28),bx(1.8,.08,.14,f.paleta.madera,0,1.05,-.28)];
  for(const x of [-.8,.8])L.push(bx(.07,.5,.6,f.paleta.metal,x,0,0),bx(.07,.8,.07,f.paleta.metal,x,.45,-.3));
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"fogata",nombre:"Fogata",cat:"objeto",grp:["bosque","cuento"],alto:1.1,paleta:{leno:"#6a4a2a",roca:"#8a8680"},build:(f,rnd)=>{
  const L=[],S=[],F=[];
  for(let k=0;k<5;k++){const a=k/5*6.28;L.push(cy(.09,.09,1.3,6,f.paleta.leno,0,0,0,{rz:Math.PI/2-.7,ry:-a,t:[Math.cos(a)*.1,.05,Math.sin(a)*.1]}));}
  for(let k=0;k<9;k++){const a=k/9*6.28,s=G.ico(.2+rnd()*.08,1,f.paleta.roca);G.xf(s,{s:[1,.7,1],t:[Math.cos(a)*.9,.1,Math.sin(a)*.9]});S.push(s);}
  F.push(G.cone(.4,1,8,"#ff7a2a"));const c2=G.cone(.25,.8,8,"#ffd34d");G.xf(c2,{t:[.1,0,0]});F.push(c2);G.xf(F[0],{t:[0,.2,0]});G.xf(c2,{t:[0,.2,0]});
  return [{g:G.merge(...L,...S),m:"vc"},{g:G.merge(...F),m:"emit"}];}});
def({id:"barril",nombre:"Barril",cat:"objeto",grp:["mar","cuento","granja"],alto:1.3,paleta:{madera:"#9a6a38",aro:"#3a3a44"},build:(f)=>{
  const b=G.lathe([[.55,0],[.7,.4],[.76,.7],[.7,1],[.55,1.4]],14,f.paleta.madera);
  const a1=G.lathe([[.58,.12],[.58,.2]],14,f.paleta.aro,{caps:false}),a2=G.lathe([[.76,.64],[.76,.74]],14,f.paleta.aro,{caps:false}),a3=G.lathe([[.58,1.18],[.58,1.26]],14,f.paleta.aro,{caps:false});
  return [{g:G.merge(b,a1,a2,a3),m:"vc"}];}});
def({id:"caldero",nombre:"Caldero mágico",cat:"objeto",grp:["magia"],alto:1.5,paleta:{hierro:"#2b2b33",pocion:"#6bdb59"},build:(f)=>{
  const c=G.lathe([[.5,.2],[.9,.5],[1,.95],[1.05,1.2]],16,f.paleta.hierro,{caps:false}),liq=G.cyl(.97,.97,.03,16,f.paleta.pocion,true);G.xf(liq,{t:[0,1.05,0]});
  const legs=[0,2.1,4.2].map(a=>cy(.07,.05,.3,6,f.paleta.hierro,Math.cos(a)*.6,0,Math.sin(a)*.6));
  return [{g:G.merge(c,...legs),m:"vc"},{g:liq,m:"emit"}];}});
def({id:"libro_magico",nombre:"Libro de hechizos",cat:"objeto",grp:["magia"],alto:.5,paleta:{tapa:"#6a2a8a",hojas:"#f3e6c4",estrella:"#ffd34d"},build:(f)=>{
  const t=G.box(1.4,.5,1.9,f.paleta.tapa),h=bx(1.3,.34,1.8,f.paleta.hojas,.04,.08,0),st=G.cyl(.35,.35,.02,5,f.paleta.estrella,true);G.xf(st,{t:[0,.5,0]});
  return [{g:G.merge(t,h),m:"vc"},{g:st,m:"emit"}];}});
def({id:"espada",nombre:"Espada",cat:"objeto",grp:["magia","cuento"],alto:3,paleta:{hoja:"#d8dce6",empunadura:"#7a4a28",oro:"#ffd34d"},build:(f)=>{
  const bl=G.prism([[-.14,0],[.14,0],[.1,2.1],[0,2.4],[-.1,2.1]],.05,f.paleta.hoja);G.xf(bl,{t:[0,.55,0]});
  return [{g:G.merge(bl,bx(.7,.1,.14,f.paleta.oro,0,.5,0),cy(.05,.05,.5,8,f.paleta.empunadura,0,0,0)),m:"vc"}];}});
def({id:"corona",nombre:"Corona",cat:"objeto",grp:["magia","cuento"],alto:.9,paleta:{oro:"#ffd34d",gema:"#e8402f"},build:(f)=>{
  const ring=G.lathe([[.6,0],[.6,.4]],16,f.paleta.oro,{caps:false}),L=[ring],gs=[];
  for(let k=0;k<6;k++){const a=k/6*6.28,c=G.cone(.14,.5,6,f.paleta.oro);G.xf(c,{t:[Math.cos(a)*.6,.4,Math.sin(a)*.6]});L.push(c);const g=G.sphere(.07,6,f.paleta.gema);G.xf(g,{t:[Math.cos(a)*.62,.18,Math.sin(a)*.62]});gs.push(g);}
  return [{g:G.merge(...L),m:"vc"},{g:G.merge(...gs),m:"emit"}];}});
def({id:"totem",nombre:"Tótem",cat:"objeto",grp:["cult"],alto:5,paleta:{a:"#e8402f",b:"#4a9fd8",c:"#6bbf59",d:"#ffd34d"},build:(f)=>{
  const L=[bx(1.2,1.3,1.2,f.paleta.a,0,0,0),bx(1.2,1.3,1.2,f.paleta.b,0,1.3,0),bx(1.2,1.3,1.2,f.paleta.c,0,2.6,0),bx(1.2,1.3,1.2,f.paleta.d,0,3.9,0),
    bx(2.4,.18,.2,f.paleta.a,0,4.4,.3),bx(.3,.2,.5,"#222",0,3.2,.64),bx(.3,.2,.5,"#222",0,1.9,.64),bx(.3,.2,.5,"#222",0,.6,.64),bx(.3,.2,.5,"#222",0,4.5,.64)];
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"tambor",nombre:"Tambor africano",cat:"objeto",grp:["africa","cult"],alto:1.5,paleta:{madera:"#a8743c",cuero:"#f3e6c4"},build:(f)=>{
  const b=G.lathe([[.5,0],[.65,.5],[.55,1.1],[.7,1.2]],14,f.paleta.madera,{caps:false}),top=G.cyl(.72,.72,.05,14,f.paleta.cuero,true);G.xf(top,{t:[0,1.2,0]});
  return [{g:G.merge(b,top),m:"vc"}];}});
def({id:"canoa",nombre:"Canoa",cat:"objeto",grp:["cult","selva","mar"],alto:.9,paleta:{madera:"#a8743c",interior:"#7a5230"},build:(f)=>{
  const h=G.prism([[-3,.6],[-2.2,0],[2.2,0],[3,.6],[2.4,.85],[-2.4,.85]],1.2,f.paleta.madera);
  const i=G.prism([[-2.3,.8],[-2,.45],[2,.45],[2.3,.8]],.9,f.paleta.interior);
  return [{g:G.merge(h,i),m:"vc"}];}});
def({id:"hueso",nombre:"Huesos fósiles",cat:"objeto",grp:["prehi","desierto"],alto:1,paleta:{hueso:"#f3e6c4"},build:(f,rnd)=>{
  const L=[];L.push(cy(.09,.09,3.2,8,f.paleta.hueso,0,0,0,{rz:Math.PI/2,t:[-1.6,.1,0]}));
  for(const x of [-1.6,1.6])for(const z of [-.12,.12]){const s=G.sphere(.17,8,f.paleta.hueso);G.xf(s,{t:[x,.1,z]});L.push(s);}
  for(let k=0;k<8;k++){const a=(k-3.5)*.3,r=G.tube(G.bezier([a*1.2,.1,0],[a*1.2,.9,.3],[a*1.2,1.1,.8],[a*1.2,.5,1.3],8),i=>.06,5,f.paleta.hueso,true);L.push(r);}
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"moai",nombre:"Moai",cat:"objeto",grp:["latam","cult"],alto:6,paleta:{piedra:"#8a8678"},build:(f)=>{
  const b=G.lathe([[1.1,0],[1,2.2],[1.05,3.6],[1.15,4.6],[1,5.8]],10,f.paleta.piedra,{caps:true});G.xf(b,{s:[1,1,.8]});
  const brow=bx(1.7,.35,.6,"#6a665a",0,4.5,.65),nose=bx(.35,1.1,.5,"#7a766a",0,3.7,.75),mouth=bx(.9,.12,.4,"#5a564a",0,3.45,.55);
  return [{g:G.merge(b,brow,nose,mouth),m:"rock"}];}});
def({id:"cartel",nombre:"Cartel",cat:"objeto",grp:["cuento","ciudad"],alto:2.4,paleta:{madera:"#a8743c",tabla:"#c9964a"},build:(f)=>{
  const p=bx(.16,2.4,.16,f.paleta.madera,0,0,0),t=G.prism([[-.9,0],[.6,0],[.9,.25],[.6,.5],[-.9,.5]],.1,f.paleta.tabla);G.xf(t,{t:[0,1.7,.12]});
  return [{g:G.merge(p,t),m:"vc"}];}});
})(window);
