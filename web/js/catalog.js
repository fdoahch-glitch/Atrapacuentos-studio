/* Base de datos de la biblioteca. Cada elemento tiene una ficha (tamaño, paleta, parámetros) y un constructor por código. */
(function(root){
"use strict";
const G=root.Geo,P=root.Proc;
const Cat={items:[],byId:{}};
Cat.CATS=[["arbol","Árboles"],["planta","Plantas"],["roca","Rocas y montañas"],["casa","Casas y edificios"],["nave","Naves y vehículos"],["espacio","Espacio"],["objeto","Objetos"]];
Cat.GRP={selva:"Selva",africa:"África",latam:"Latinoamérica",frio:"Frío",desierto:"Desierto",tropical:"Tropical",granja:"Granja",bosque:"Bosque",cuento:"Cuento",prehi:"Prehistórico",mar:"Mar",magia:"Magia",ciudad:"Ciudad",espacio:"Espacio",cult:"Culturas",noche:"Noche",cielo:"Cielo"};
Cat.def=function(d){d.dim=d.dim||"3d";d.paleta=d.paleta||{};d.params=d.params||{};d.grp=d.grp||[];Cat.items.push(d);Cat.byId[d.id]=d;return d;};
Cat.ficha=function(id,over){
  const d=Cat.byId[id],o=over||{};
  return {id:id,nombre:d.nombre,alto:o.alto||d.alto,paleta:Object.assign({},d.paleta,o.paleta),params:Object.assign({},d.params,o.params),semilla:o.semilla||d.semilla||1,dim:d.dim};
};
/* Construye las partes y las normaliza: apoyadas en y=0, centradas en x/z y con la altura de la ficha */
Cat.build=function(id,over){
  const d=Cat.byId[id],f=Cat.ficha(id,over),rnd=P.mulberry32(f.semilla*977+13);
  const parts=d.build(f,rnd,G).filter(Boolean);
  let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(const p of parts){const b=G.bounds(p.g);for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],b.lo[k]);hi[k]=Math.max(hi[k],b.hi[k]);}}
  const k=f.alto/Math.max(1e-6,hi[1]-lo[1]),cx=(lo[0]+hi[0])/2,cz=(lo[2]+hi[2])/2;
  for(const p of parts)G.xf(p.g,{s:k,t:[-cx*k,-lo[1]*k,-cz*k]});
  return {parts,ficha:f,size:[(hi[0]-lo[0])*k,f.alto,(hi[2]-lo[2])*k]};
};
Cat.search=function(q,cat,grp){
  q=(q||"").toLowerCase();
  return Cat.items.filter(d=>(!cat||d.cat===cat)&&(!grp||d.grp.includes(grp))&&(!q||d.nombre.toLowerCase().includes(q)));
};
root.Cat=Cat;
})(window);
