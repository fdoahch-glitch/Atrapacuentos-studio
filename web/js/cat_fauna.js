/* Biblioteca: animales del bosque, dinosaurios, ciudad y cueva */
(function(root){
"use strict";
const G=root.Geo,Cat=root.Cat,def=Cat.def,H=G.hex;
const bx=(w,h,d,col,x,y,z,o)=>{const m=G.box(w,h,d,col);G.xf(m,Object.assign({t:[x||0,y||0,z||0]},o||{}));return m;};
const cy=(r0,r1,h,seg,col,x,y,z,o)=>{const m=G.cyl(r0,r1,h,seg,col,true);G.xf(m,Object.assign({t:[x||0,y||0,z||0]},o||{}));return m;};
const sp=(r,col,x,y,z,s,o)=>{const m=G.sphere(r,10,col);G.xf(m,Object.assign({s:s||[1,1,1],t:[x,y,z]},o||{}));return m;};
const cn=(r,h,col,x,y,z,o)=>{const m=G.cone(r,h,8,col);G.xf(m,Object.assign({t:[x,y,z]},o||{}));return m;};
const tb=(a,b,c,d,r0,r1,col)=>G.tube(G.bezier(a,b,c,d,8),i=>r0+(r1-r0)*Math.min(1,i/8),6,col,true);
const out=(L,K)=>[{g:G.merge(...L),m:"vc"},{g:G.merge(...K),m:"vc"}];
const eyes=(K,y,z,dx,r)=>{for(const s of [-1,1]){K.push(sp(r*1.4,"#ffffff",s*dx,y,z),sp(r*.8,"#111111",s*dx,y,z+r*1.1));}};

/* ---------- animales del bosque ---------- */
def({id:"conejo",nombre:"Conejo",cat:"personaje",grp:["bosque","cuento","granja"],alto:1.3,paleta:{cuerpo:"#f1ece4",detalle:"#f7b8c4"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.5,P.cuerpo,0,.55,0,[.9,.9,1.15]),sp(.34,P.cuerpo,0,.95,.5),sp(.17,P.cuerpo,0,.5,-.65));
  L.push(sp(.15,P.cuerpo,-.3,.1,.35,[.9,.8,1.5]),sp(.15,P.cuerpo,.3,.1,.35,[.9,.8,1.5]),sp(.2,P.cuerpo,-.36,.2,-.25,[.8,1,1.4]),sp(.2,P.cuerpo,.36,.2,-.25,[.8,1,1.4]));
  for(const s of [-1,1]){L.push(sp(.11,P.cuerpo,s*.15,1.5,.45,[.6,2.6,.5]));K.push(sp(.06,P.detalle,s*.15,1.5,.49,[.5,2,.3]));}
  K.push(sp(.06,P.detalle,0,.9,.82));eyes(K,1.02,.7,.14,.04);
  return out(L,K);}});
def({id:"zorro",nombre:"Zorro",cat:"personaje",grp:["bosque","cuento"],alto:1.5,paleta:{cuerpo:"#e2762b",detalle:"#fbf1e2"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.55,P.cuerpo,0,.75,0,[.75,.65,1.2]));
  for(const [x,z] of [[-.25,-.5],[.25,-.5],[-.25,.5],[.25,.5]])L.push(cy(.08,.07,.55,8,"#3a2a22",x,0,z));
  L.push(sp(.34,P.cuerpo,0,1.05,.8),cn(.2,.55,P.cuerpo,0,.95,1.05,{rx:Math.PI/2}),sp(.2,P.detalle,0,.9,1.0,[1.1,.7,1.1]));
  L.push(cn(.12,.32,P.cuerpo,-.2,1.3,.75),cn(.12,.32,P.cuerpo,.2,1.3,.75));
  L.push(tb([0,.85,-.7],[0,1,-1.2],[0,.7,-1.7],[0,.5,-1.9],.14,.26,P.cuerpo),sp(.26,P.detalle,0,.5,-1.95,[1,1,1.3]));
  K.push(sp(.05,"#111111",0,.96,1.58));eyes(K,1.1,1.05,.14,.04);
  return out(L,K);}});
def({id:"ciervo",nombre:"Ciervo",cat:"personaje",grp:["bosque","cuento"],alto:2.6,paleta:{cuerpo:"#a46a3c",detalle:"#f1e0c0",astas:"#5a3d26"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.6,P.cuerpo,0,1.35,0,[.7,.62,1.3]),sp(.3,P.detalle,0,1.1,.3,[.8,.5,1.2]));
  for(const [x,z] of [[-.28,-.6],[.28,-.6],[-.28,.6],[.28,.6]])L.push(cy(.08,.06,1.0,8,P.cuerpo,x,0,z),cy(.07,.07,.12,8,"#2a2220",x,0,z));
  L.push(tb([0,1.5,.7],[0,1.9,.9],[0,2.1,1.0],[0,2.25,1.1],.2,.15,P.cuerpo),sp(.26,P.cuerpo,0,2.3,1.2,[.9,.9,1.2]),sp(.14,P.detalle,0,2.22,1.45));
  for(const s of [-1,1]){L.push(sp(.1,P.cuerpo,s*.24,2.5,1.1,[1.4,.5,.6]),tb([s*.12,2.45,1.15],[s*.4,2.8,1.1],[s*.5,3.1,1.1],[s*.7,3.3,1.1],.04,.02,P.astas),tb([s*.4,2.8,1.1],[s*.5,2.9,1.2],[s*.6,3.0,1.3],[s*.65,3.1,1.35],.03,.015,P.astas));}
  K.push(sp(.05,"#111111",0,2.22,1.58));eyes(K,2.36,1.38,.16,.035);
  return out(L,K);}});
def({id:"oso",nombre:"Oso",cat:"personaje",grp:["bosque","cuento","frio"],alto:2.4,paleta:{cuerpo:"#7a4f2f",detalle:"#d7b48a"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.85,P.cuerpo,0,1.05,0,[.95,1,1.1]),sp(.5,P.detalle,0,1.0,.55,[.8,.9,.4]));
  for(const [x,z] of [[-.5,-.6],[.5,-.6],[-.5,.5],[.5,.5]])L.push(cy(.22,.2,.7,9,P.cuerpo,x,0,z),sp(.2,P.detalle,x,.05,z+.1,[1,.5,1.2]));
  L.push(sp(.5,P.cuerpo,0,1.85,.65),sp(.22,P.detalle,0,1.7,1.08,[1.1,.8,1]),sp(.12,"#1b1b1b",0,1.78,1.28));
  for(const s of [-1,1])L.push(sp(.17,P.cuerpo,s*.38,2.28,.6,[1,1,.6]));
  eyes(K,1.95,1.05,.2,.05);
  return out(L,K);}});
def({id:"buho",nombre:"Búho",cat:"personaje",grp:["bosque","cuento","magia"],alto:1.6,paleta:{cuerpo:"#8a6a48",detalle:"#e8d9bc"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.62,P.cuerpo,0,.8,0,[.9,1.15,.85]),sp(.4,P.detalle,0,.7,.35,[.9,1.1,.5]));
  L.push(sp(.2,P.cuerpo,-.55,.8,-.05,[.4,1.2,.7]),sp(.2,P.cuerpo,.55,.8,-.05,[.4,1.2,.7]));
  L.push(cy(.05,.05,.25,6,"#d09a2c",-.2,0,.1),cy(.05,.05,.25,6,"#d09a2c",.2,0,.1),bx(.22,.08,.3,"#d09a2c",-.2,0,.2),bx(.22,.08,.3,"#d09a2c",.2,0,.2));
  L.push(cn(.14,.3,P.cuerpo,-.35,1.7,0,{rz:.3}),cn(.14,.3,P.cuerpo,.35,1.7,0,{rz:-.3}),cn(.1,.22,"#e8a02c",0,1.2,.6,{rx:Math.PI/2}));
  for(const s of [-1,1]){K.push(sp(.22,P.detalle,s*.22,1.3,.5,[1,1,.5]),sp(.15,"#e8a02c",s*.22,1.3,.58,[1,1,.5]),sp(.08,"#111111",s*.22,1.3,.64,[1,1,.5]));}
  return out(L,K);}});
def({id:"rana",nombre:"Rana",cat:"personaje",grp:["selva","bosque","cuento"],alto:.9,paleta:{cuerpo:"#5cae3c",detalle:"#d8f0b0"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.5,P.cuerpo,0,.4,0,[1.1,.75,1.1]),sp(.3,P.detalle,0,.3,.35,[1,.6,.6]));
  L.push(sp(.2,P.cuerpo,-.55,.12,-.1,[.7,.5,1.6]),sp(.2,P.cuerpo,.55,.12,-.1,[.7,.5,1.6]),sp(.1,P.cuerpo,-.3,.08,.55,[1.4,.5,1]),sp(.1,P.cuerpo,.3,.08,.55,[1.4,.5,1]));
  for(const s of [-1,1]){L.push(sp(.17,P.cuerpo,s*.28,.85,.3));K.push(sp(.1,"#ffffff",s*.28,.9,.42),sp(.06,"#111111",s*.28,.9,.5));}
  K.push(sp(.03,"#2a5a20",0,.55,.8,[6,.3,1]));
  return out(L,K);}});
def({id:"pato",nombre:"Pato",cat:"personaje",grp:["granja","cuento"],alto:1.2,paleta:{cuerpo:"#f6d84a",detalle:"#f08a2a"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.55,P.cuerpo,0,.6,0,[.85,.8,1.15]),sp(.34,P.cuerpo,0,1.05,.5),sp(.17,P.cuerpo,0,.75,-.6,[.6,.6,1]));
  L.push(sp(.17,P.detalle,0,.97,.9,[1.2,.4,1.6]),bx(.2,.05,.3,P.detalle,-.2,0,.15),bx(.2,.05,.3,P.detalle,.2,0,.15));
  L.push(sp(.2,"#e8c83a",-.5,.6,-.05,[.3,.8,1.2]),sp(.2,"#e8c83a",.5,.6,-.05,[.3,.8,1.2]));
  eyes(K,1.12,.75,.16,.04);
  return out(L,K);}});
def({id:"gallina",nombre:"Gallina",cat:"personaje",grp:["granja","cuento"],alto:1.4,paleta:{cuerpo:"#f4efe6",detalle:"#d9402f"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.58,P.cuerpo,0,.8,0,[.8,.85,1.1]),sp(.3,P.cuerpo,0,1.3,.5),sp(.3,P.cuerpo,0,1,-.6,[.5,1,.9]));
  L.push(cy(.04,.04,.45,6,"#e8a02c",-.18,0,.05),cy(.04,.04,.45,6,"#e8a02c",.18,0,.05));
  L.push(cn(.09,.25,"#e8a02c",0,1.25,.85,{rx:Math.PI/2}),sp(.09,P.detalle,0,1.62,.45,[.5,1.2,1.1]),sp(.07,P.detalle,0,1.12,.78,[.8,1.2,.8]));
  eyes(K,1.38,.72,.15,.035);
  return out(L,K);}});

/* ---------- dinosaurios ---------- */
def({id:"trex",nombre:"Tiranosaurio",cat:"personaje",grp:["prehi","cuento"],alto:3.4,paleta:{cuerpo:"#6e9b3f",vientre:"#cfd98a",dientes:"#fbf6e6"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.95,P.cuerpo,0,1.9,0,[.8,1,1.2]),sp(.6,P.vientre,0,1.7,.35,[.7,1,.9]));
  L.push(tb([0,1.8,-.8],[0,1.6,-1.8],[0,1.0,-2.8],[0,.5,-3.6],.5,.08,P.cuerpo));
  for(const s of [-1,1]){L.push(sp(.4,P.cuerpo,s*.55,1.2,-.15,[.7,1.5,1]),cy(.2,.17,.95,8,P.cuerpo,s*.55,0,.15),bx(.4,.14,.7,"#4a6a2a",s*.55,0,.4),cn(.05,.2,P.dientes,s*.55,.02,.78,{rx:Math.PI/2}));}
  L.push(tb([0,2.1,.5],[0,2.5,.8],[0,2.8,.9],[0,3.0,1.0],.45,.4,P.cuerpo),sp(.55,P.cuerpo,0,3.1,1.1,[.9,.85,1.3]),sp(.35,P.cuerpo,0,2.85,1.75,[.9,.7,1.1]));
  L.push(bx(.7,.1,.7,P.vientre,0,2.7,1.6));
  for(const s of [-1,1]){L.push(cy(.05,.03,.35,6,P.cuerpo,s*.55,1.95,.9,{rz:s*-.9}),sp(.1,P.cuerpo,s*.65,1.8,.95),cn(.03,.12,P.dientes,s*.75,1.65,.98,{rx:Math.PI}));}
  for(let k=0;k<5;k++)K.push(cn(.04,.14,P.dientes,-.28+k*.14,2.68,2.0,{rx:Math.PI}));
  eyes(K,3.3,1.35,.3,.06);
  return out(L,K);}});
def({id:"triceratops",nombre:"Triceratops",cat:"personaje",grp:["prehi","cuento"],alto:2.4,paleta:{cuerpo:"#7aa0a8",gola:"#c0643c",cuerno:"#f3e6c4"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.9,P.cuerpo,0,1.2,0,[.85,.8,1.45]));
  L.push(tb([0,1.2,-1.1],[0,1.1,-1.8],[0,.8,-2.2],[0,.5,-2.5],.3,.06,P.cuerpo));
  for(const [x,z] of [[-.5,-.9],[.5,-.9],[-.5,.9],[.5,.9]])L.push(cy(.23,.2,.9,9,P.cuerpo,x,0,z),bx(.4,.12,.5,"#4f6a70",x,0,z+.1));
  L.push(sp(.5,P.cuerpo,0,1.3,1.5,[1,.9,1.2]),cn(.55,.15,P.gola,0,1.7,1.15,{rx:-Math.PI/2+.35,}),sp(.75,P.gola,0,1.65,1.0,[1.2,1.15,.18],{rx:-.35}));
  L.push(cn(.07,.7,P.cuerno,-.3,1.7,1.65,{rx:Math.PI/2-.4}),cn(.07,.7,P.cuerno,.3,1.7,1.65,{rx:Math.PI/2-.4}),cn(.08,.3,P.cuerno,0,1.35,2.05,{rx:Math.PI/2-.2}));
  eyes(K,1.55,1.85,.32,.05);
  return out(L,K);}});
def({id:"braquiosaurio",nombre:"Dinosaurio de cuello largo",cat:"personaje",grp:["prehi","cuento"],alto:5,paleta:{cuerpo:"#8f9c4e",vientre:"#d7d98c"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(1.2,P.cuerpo,0,1.9,0,[.8,.8,1.35]),sp(.7,P.vientre,0,1.5,.2,[.8,.7,1.1]));
  for(const [x,z] of [[-.6,-.9],[.6,-.9],[-.6,.9],[.6,.9]])L.push(cy(.3,.26,1.3,9,P.cuerpo,x,0,z),bx(.55,.14,.6,"#657034",x,0,z+.1));
  L.push(tb([0,1.8,-1.2],[0,1.6,-2.2],[0,1,-3.2],[0,.5,-4.2],.35,.05,P.cuerpo));
  L.push(tb([0,2.2,1.0],[0,3.2,1.5],[0,4.2,1.7],[0,5.0,1.8],.38,.2,P.cuerpo),sp(.3,P.cuerpo,0,5.2,1.95,[.9,.8,1.3]));
  eyes(K,5.3,2.1,.17,.04);
  return out(L,K);}});
def({id:"huevo_dino",nombre:"Huevo de dinosaurio",cat:"objeto",grp:["prehi","cuento"],alto:.9,paleta:{cascara:"#e8dcb8",motas:"#7aa05a"},build:f=>{
  const P=f.paleta,L=[sp(.5,P.cascara,0,.6,0,[.8,1.15,.8])];
  [[.2,.9,.32],[-.3,.5,.3],[.1,.3,.4],[-.12,1.0,.28],[.35,.65,.2]].forEach(([x,y,z])=>L.push(sp(.09,P.motas,x,y,z,[1,1,.5])));
  return [{g:G.merge(...L),m:"vc"}];}});

/* ---------- ciudad ---------- */
def({id:"semaforo",nombre:"Semáforo",cat:"objeto",grp:["ciudad"],alto:3.4,paleta:{poste:"#3a3f4a",rojo:"#e0382f",amarillo:"#f4c83a",verde:"#3fbf5a"},build:f=>{
  const P=f.paleta,L=[cy(.09,.09,3,8,P.poste,0,0,0),bx(.55,1.2,.4,"#22252c",0,2.3,0)],K=[];
  K.push(sp(.15,P.rojo,0,2.7,.2),sp(.15,P.amarillo,0,2.3,.2),sp(.15,P.verde,0,1.9,.2));
  return out(L,K);}});
def({id:"bus",nombre:"Bus escolar",cat:"nave",grp:["ciudad","cuento"],alto:2.6,paleta:{carroceria:"#f4b92c",vidrio:"#9fd4ec",rueda:"#222"},build:f=>{
  const P=f.paleta,L=[bx(4.2,1.7,1.7,P.carroceria,0,.6,0),bx(4.22,.1,1.72,"#222",0,1.2,0)],K=[];
  for(let k=0;k<5;k++)K.push(bx(.58,.55,1.74,P.vidrio,-1.6+k*.8,1.5,0));
  for(const x of [-1.4,1.4])for(const s of [-1,1])L.push(cy(.4,.4,.3,12,P.rueda,x,0,s*.75,{rx:Math.PI/2}));
  K.push(bx(.1,.5,.5,"#fff",2.12,.9,.5),bx(.1,.5,.5,"#fff",2.12,.9,-.5));
  return out(L,K);}});
def({id:"tienda",nombre:"Tienda con toldo",cat:"casa",grp:["ciudad","cuento"],alto:4,paleta:{pared:"#e9d3b0",toldo:"#d9402f",toldo2:"#f6f2ea",techo:"#8a5a3a"},build:f=>{
  const P=f.paleta,L=[bx(3.6,3,2.4,P.pared,0,0,0),bx(3.9,.3,2.7,P.techo,0,3,0)],K=[];
  for(let k=0;k<6;k++)L.push(bx(.6,.12,1.1,k%2?P.toldo2:P.toldo,-1.5+k*.6,2.1,1.55,{rx:.35}));
  K.push(bx(1,1.5,.05,"#7ec8e6",-.8,.7,1.21),bx(.7,1.7,.05,"#6a4a2a",1.0,0,1.21));
  return out(L,K);}});

/* ---------- cueva ---------- */
function rocka(L,col,col2){
  L.push(sp(1.6,col,-1.3,.9,0,[1,1.1,.9]),sp(1.6,col,1.3,.9,0,[1,1.1,.9]),sp(1.4,col2,0,2.3,-.2,[1.6,.8,.9]),sp(1.2,col,-1.0,1.9,.1,[.9,1.2,.9]),sp(1.2,col,1.0,1.9,.1,[.9,1.2,.9]));
}
def({id:"cueva",nombre:"Cueva",cat:"roca",grp:["cueva","cuento"],alto:4.2,paleta:{roca:"#6b6560",roca2:"#7d766f",interior:"#151218"},build:f=>{
  const P=f.paleta,L=[],K=[];rocka(L,P.roca,P.roca2);
  L.push(sp(1.9,P.roca,0,1.1,-1.3,[1.6,1.1,.8]));
  K.push(sp(1.15,P.interior,0,1.0,1.45,[.95,1.1,.14]));
  return out(L,K);}});
def({id:"estalagmitas",nombre:"Estalagmitas",cat:"roca",grp:["cueva"],alto:2,paleta:{roca:"#8a8278",punta:"#b9b0a4"},build:f=>{
  const P=f.paleta,L=[];
  [[0,0,2,.4],[.7,.3,1.3,.3],[-.7,.2,1.5,.32],[.35,-.5,.9,.25],[-.4,-.4,.7,.22]].forEach(([x,z,h,r])=>L.push(cn(r,h,P.roca,x,0,z),cn(r*.4,h*.35,P.punta,x,h*.65,z)));
  return [{g:G.merge(...L),m:"vc"}];}});
def({id:"antorcha",nombre:"Antorcha",cat:"objeto",grp:["cueva","magia","cuento"],alto:2,paleta:{palo:"#6a4a2a",llama:"#f48a2a",llama2:"#ffd23f"},build:f=>{
  const P=f.paleta,L=[cy(.07,.09,1.4,7,P.palo,0,0,0),cy(.13,.09,.2,8,"#3a3a3a",0,1.4,0)],K=[sp(.2,P.llama,0,1.75,0,[.9,1.5,.9]),sp(.1,P.llama2,0,1.7,0,[.9,1.4,.9])];
  return out(L,K);}});
def({id:"murcielago",nombre:"Murciélago",cat:"personaje",grp:["cueva","magia","cuento"],alto:1.1,paleta:{cuerpo:"#4a3f55",ala:"#5d5070"},build:f=>{
  const P=f.paleta,L=[],K=[];
  L.push(sp(.3,P.cuerpo,0,.6,0,[.9,1.2,.9]),sp(.22,P.cuerpo,0,.95,.05),cn(.07,.2,P.cuerpo,-.12,1.1,.02),cn(.07,.2,P.cuerpo,.12,1.1,.02));
  for(const s of [-1,1]){L.push(sp(.5,P.ala,s*.6,.7,-.05,[1.3,.12,.8],{rz:s*-.25}),sp(.3,P.ala,s*1.05,.55,-.05,[1,.1,.7],{rz:s*-.5}));}
  eyes(K,.98,.2,.08,.025);K.push(cn(.025,.07,"#fff",-.04,.84,.22,{rx:Math.PI}),cn(.025,.07,"#fff",.04,.84,.22,{rx:Math.PI}));
  return out(L,K);}});
Cat.GRP.cueva="Cueva";Cat.GRP.prehi=Cat.GRP.prehi||"Prehistórico";
})(window);
