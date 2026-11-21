/* Biblioteca: personajes listos para cuentos (se editan los colores; luego tendrán esqueleto) */
(function(root){
"use strict";
const G=root.Geo,P=root.Proc,Cat=root.Cat,def=Cat.def,H=G.hex;
const bx=(w,h,d,col,x,y,z)=>{const m=G.box(w,h,d,col);G.xf(m,{t:[x||0,y||0,z||0]});return m;};
const cy=(r0,r1,h,seg,col,x,y,z,o)=>{const m=G.cyl(r0,r1,h,seg,col,true);G.xf(m,Object.assign({t:[x||0,y||0,z||0]},o||{}));return m;};
const sp=(r,col,x,y,z,s)=>{const m=G.sphere(r,10,col);G.xf(m,{s:s||[1,1,1],t:[x,y,z]});return m;};
const cn=(r,h,col,x,y,z,o)=>{const m=G.cone(r,h,8,col);G.xf(m,Object.assign({t:[x,y,z]},o||{}));return m;};
Cat.CATS.unshift(["personaje","Personajes"]);
Cat.GRP.personaje="Personajes";

/* persona base (niño/niña): piel, ropa, pelo editables */
function persona(f,extra){
  const P=f.paleta,L=[],S=[],K=[];
  L.push(cy(.17,.15,.75,8,P.pantalon,-.2,.15,0),cy(.17,.15,.75,8,P.pantalon,.2,.15,0));
  L.push(bx(.4,.18,.55,P.zapatos,-.2,0,.08),bx(.4,.18,.55,P.zapatos,.2,0,.08));
  L.push(cy(.42,.36,.85,10,P.ropa,0,.85,0));
  L.push(cy(.12,.1,.75,8,P.ropa,-.55,.9,0,{rz:.12}),cy(.12,.1,.75,8,P.ropa,.55,.9,0,{rz:-.12}));
  L.push(sp(.12,P.piel,-.62,.85,0),sp(.12,P.piel,.62,.85,0));
  S.push(sp(.5,P.piel,0,1.95,0,[1,1.05,1]),sp(.53,P.pelo,0,2.08,-.08,[1,.8,1]));
  K.push(sp(.07,"#222222",-.17,1.98,.45,[1,1.3,.6]),sp(.07,"#222222",.17,1.98,.45,[1,1.3,.6]));
  if(extra)extra(L,S);
  return [{g:G.merge(...L,...S),m:"vc"},{g:G.merge(...K),m:"vc"}];
}
def({id:"heroe",nombre:"Niño / niña",cat:"personaje",grp:["cuento"],alto:2,paleta:{piel:"#f0c8a0",ropa:"#3a7ad8",pantalon:"#4a4a6a",pelo:"#5a3a22",zapatos:"#2b2b33"},build:(f)=>persona(f)});
def({id:"caperucita",nombre:"Caperucita Roja",cat:"personaje",grp:["cuento","bosque"],alto:2,paleta:{piel:"#f0c8a0",ropa:"#f2e6d0",pantalon:"#f2e6d0",pelo:"#5a3a22",zapatos:"#5a3a22",capa:"#d9402f"},build:(f)=>persona(f,(L,S)=>{
  const cape=G.lathe([[.62,.35],[.5,1.2],[.36,1.62]],14,f.paleta.capa,{caps:false});L.push(cape);
  const hood=G.sphere(.58,12,f.paleta.capa);G.xf(hood,{s:[1,.95,1.02],t:[0,2.0,-.1]});S.push(hood);})});

/* cuadrúpedo base: cuerpo, 4 patas, cabeza, hocico, orejas, cola */
function animal(f,o){
  const P=f.paleta,L=[],S=[],K=[],c=H(P.cuerpo),c2=H(P.detalle||P.cuerpo);
  const body=G.sphere(.7,14,c);G.xf(body,{s:[o.bw||.75,o.bh||.6,o.bl||1.1],t:[0,.95,0]});
  if(o.spots)G.paint(body,(x,y,z)=>P.noise3?c:(Math.sin(x*5)*Math.sin(z*4+y*3)>.25?H(P.manchas):c));
  L.push(body);
  for(const [x,z] of [[-.34,-.55],[.34,-.55],[-.34,.55],[.34,.55]])L.push(cy(.11,.09,.7,8,o.patas?H(P.patas):c,x,.0,z));
  const head=G.sphere(o.hr||.42,12,c);G.xf(head,{t:[0,o.hy||1.25,o.hz||1.0]});S.push(head);
  if(o.hocico==="cerdo"){const s=cy(.19,.21,.2,10,c2,0,0,0,{rx:Math.PI/2});G.xf(s,{t:[0,(o.hy||1.25)-.06,(o.hz||1)+.42]});S.push(s);
    K.push(sp(.035,"#5a2a30",-.07,(o.hy||1.25)-.06,(o.hz||1)+.53),sp(.035,"#5a2a30",.07,(o.hy||1.25)-.06,(o.hz||1)+.53));}
  else if(o.hocico==="lobo"){const s=cn(.2,.7,c2,0,0,0,{rx:Math.PI/2});G.xf(s,{t:[0,(o.hy||1.25)-.08,(o.hz||1)+.25]});S.push(s);K.push(sp(.05,"#111111",0,(o.hy||1.25)-.03,(o.hz||1)+.93));}
  else{const s=sp(.26,c2,0,(o.hy||1.25)-.12,(o.hz||1)+.28,[1,.85,1]);S.push(s);K.push(sp(.04,"#222222",-.08,(o.hy||1.25)-.1,(o.hz||1)+.52),sp(.04,"#222222",.08,(o.hy||1.25)-.1,(o.hz||1)+.52));}
  K.push(sp(.06,"#ffffff",-.18,(o.hy||1.25)+.1,(o.hz||1)+.32),sp(.06,"#ffffff",.18,(o.hy||1.25)+.1,(o.hz||1)+.32),sp(.03,"#111111",-.18,(o.hy||1.25)+.1,(o.hz||1)+.37),sp(.03,"#111111",.18,(o.hy||1.25)+.1,(o.hz||1)+.37));
  const ey=(o.hy||1.25)+.38,hz=o.hz||1;
  if(o.orejas==="punta"){S.push(cn(.14,.35,c,-.2,ey-.05,hz-.05),cn(.14,.35,c,.2,ey-.05,hz-.05));}
  else if(o.orejas==="largas"){S.push(sp(.13,c,-.42,ey-.15,hz,[1,.45,1.4]),sp(.13,c,.42,ey-.15,hz,[1,.45,1.4]));}
  else{const e1=sp(.15,c,-.3,ey-.12,hz-.05,[1,1,.35]);const e2=sp(.15,c,.3,ey-.12,hz-.05,[1,1,.35]);S.push(e1,e2);}
  if(o.cuernos){S.push(cn(.05,.3,"#f3e6c4",-.2,ey+.12,hz-.1),cn(.05,.3,"#f3e6c4",.2,ey+.12,hz-.1));}
  if(o.ubre){S.push(sp(.2,"#f4a8b8",0,.5,-.1,[1,.8,1]));}
  if(o.cola==="rulo")L.push(G.tube(G.bezier([0,1.05,-1],[0,1.3,-1.25],[.2,1.5,-1.1],[0,1.45,-1.0],8),i=>.05,5,c,true));
  else if(o.cola==="lobo")L.push(G.tube(G.bezier([0,1,-1],[0,1.1,-1.4],[0,.8,-1.8],[0,.5,-1.9],8),i=>.16-i*.012,6,c,true));
  else L.push(G.tube(G.bezier([0,1.05,-1],[0,1.0,-1.3],[0,.7,-1.4],[0,.35,-1.35],8),i=>.05,5,c,true));
  if(o.lana)for(let k=0;k<9;k++){const a=k/9*6.28,w=sp(.38,c,Math.cos(a)*.42,1.05+(k%2)*.15,Math.sin(a)*.8);L.push(w);}
  return [{g:G.merge(...L,...S),m:"vc"},{g:G.merge(...K),m:"vc"}];
}
def({id:"cerdito",nombre:"Cerdito",cat:"personaje",grp:["cuento","granja"],alto:1.9,paleta:{cuerpo:"#f4a8b8",detalle:"#f08aa0"},build:(f)=>animal(f,{hocico:"cerdo",orejas:"punta",cola:"rulo",bw:.75,bh:.62})});
def({id:"lobo",nombre:"Lobo",cat:"personaje",grp:["cuento","bosque"],alto:2.2,paleta:{cuerpo:"#7a7d88",detalle:"#d8d8dc"},build:(f)=>animal(f,{hocico:"lobo",orejas:"punta",cola:"lobo",bw:.7,bh:.6,bl:1.15,hr:.45})});
def({id:"vaca",nombre:"Vaca",cat:"personaje",grp:["cuento","granja"],alto:2.3,paleta:{cuerpo:"#f6f2ea",manchas:"#2b2b33",detalle:"#f4a8b8"},build:(f)=>animal(f,{hocico:"vaca",orejas:"largas",cola:"vaca",cuernos:1,ubre:1,spots:1,bw:.85,bh:.7,bl:1.2,hr:.46,hy:1.35})});
def({id:"oveja",nombre:"Oveja",cat:"personaje",grp:["cuento","granja"],alto:1.8,paleta:{cuerpo:"#f6f2ea",detalle:"#3a3236"},build:(f)=>animal(f,{hocico:"vaca",orejas:"largas",cola:"vaca",lana:1,bw:.8,bh:.6,hr:.36}).map((p,i)=>i===0?p:p)});
})(window);
