/* Editor: biblioteca, arrastrar y soltar, propiedades del elemento, subir personajes, mundos, Probar, guardado */
(function(){
"use strict";
const $=id=>document.getElementById(id);
function boot(){
const S=window.__atr2;if(!S||!window.Cat){setTimeout(boot,200);return;}
const {scene,B,sg,groundY,cam,barkMat,rockMat,say}=S,V3=B.Vector3,Cat=window.Cat,Thumb=window.Thumb;
const placed=[],MINE=[];let sel=null,cat="personaje",grp="",query="",curPre="dia";

/* ---------- datos del proyecto ---------- */
const proj={estilo:"2.5d",nombre:"",historia:"",mundos:[{nombre:"Escena 1",tema:"bosque",items:[],pre:"dia",suelo:"pasto",bg:"",dur:6,cam:"fija"}],mundo:0,activo:false};
const THEMES={
  bosque:{n:"Bosque",e:"🌲",pre:"dia",g:["bosque","cuento"],deco:["roble","pino","arbusto","flor","hongo","roca","pasto_alto","cerezo"]},
  selva:{n:"Selva",e:"🌴",pre:"dia",g:["selva","tropical"],deco:["selva_gigante","helecho_gigante","hojas_gigantes","bambu","helecho","nenufar"]},
  desierto:{n:"Desierto",e:"🏜️",pre:"atardecer",suelo:"arena",g:["desierto"],deco:["cactus","palmera","roca_angular","columna","seco","hueso","piramide"]},
  frio:{n:"Nieve",e:"❄️",pre:"dia",suelo:"nieve",g:["frio"],deco:["abeto_nevado","pino","penasco","iglu","cristales","montana"]},
  espacio:{n:"Espacio",e:"🚀",pre:"noche",suelo:"roca",g:["espacio","cielo"],deco:["planeta_rocoso","luna","estrella","asteroide","cohete","planeta_anillos","ovni"]},
  mar:{n:"Mar y piratas",e:"🏴‍☠️",pre:"dia",suelo:"arena",g:["mar","tropical"],deco:["cocotero","palmera","barco_pirata","velero","bote","faro","barril","cofre"]},
  ciudad:{n:"Ciudad",e:"🏙️",pre:"atardecer",suelo:"roca",g:["ciudad"],deco:["edificio","farol","banca","auto","casa_ladrillo","casa_colonial","cartel","semaforo","tienda","bus"]},
  magia:{n:"Reino mágico",e:"🏰",pre:"noche",g:["magia","cuento"],deco:["castillo","hongo","cristales","torre","caldero","libro_magico","isla_flotante","casa_hongo","cerezo"]},
  prehi:{n:"Prehistórico",e:"🦕",pre:"dia",suelo:"tierra",g:["prehi"],deco:["helecho_gigante","volcan","hueso","palmera","roca","helecho","huevo_dino"]},
  cueva:{n:"Cueva",e:"🕳️",pre:"noche",suelo:"roca",g:["cueva"],deco:["estalagmitas","cristales","antorcha","penasco","roca_angular","hueso"]},
  granja:{n:"Granja",e:"🌾",pre:"dia",g:["granja"],deco:["granero","molino","valla","girasol","pasto_alto","carreta","pozo","roble"]},
  africa:{n:"Sabana",e:"🦁",pre:"atardecer",suelo:"tierra",g:["africa","cult"],deco:["baobab","acacia","choza","tambor","pasto_alto","roca","totem"]}
};
const DEF={ovni:{anim:"flotar"},cometa:{anim:"flotar"},estrella:{anim:"latir"},isla_flotante:{anim:"flotar"},globo:{anim:"flotar"},molino:{},faro:{}};
const ANIMS=[["","Ninguna"],["flotar","Flotar"],["girar","Girar"],["balancear","Balancear"],["latir","Latir"],["saltarin","Saltarín"]];
const CAMS=[["fija","Fija"],["derecha","Avanza a la derecha"],["izquierda","Avanza a la izquierda"],["acercar","Se acerca"],["alejar","Se aleja"],["seguir","Sigue al personaje que camina"]];
const PLAB={capa:"Capa",detalle:"Hocico",manchas:"Manchas",tronco:"Tronco",hoja:"Hojas",hoja2:"Hojas claras",piel:"Piel",ropa:"Ropa",pelo:"Pelo",pantalon:"Pantalón",zapatos:"Zapatos",roca:"Roca",roca2:"Roca clara",musgo:"Musgo",pared:"Paredes",pared2:"Chimenea",techo:"Techo",puerta:"Puerta",
  cuerpo:"Cuerpo",flor:"Flor",petalo:"Pétalos",centro:"Centro",tallo:"Tallo",sombrero:"Sombrero",motas:"Motas",oro:"Oro",metal:"Metal",madera:"Madera",piedra:"Piedra",nieve:"Nieve",base:"Base",lava:"Lava",pasto:"Pasto",
  a:"Color 1",b:"Color 2",casco:"Casco",ala:"Alas",cabina:"Cabina",vela:"Vela",bandera:"Bandera",mastil:"Mástil",tela:"Tela",paja:"Paja",hielo:"Hielo",luz:"Luz",cristal:"Cristal",cristal2:"Cristal claro",tierra:"Tierra",caja:"Caja",
  carroceria:"Carrocería",vidrio:"Vidrio",llanta:"Llantas",cohete:"Cohete",modulo:"Módulo",panel:"Paneles",acento:"Acento",torre:"Torre",anillo:"Anillo",nucleo:"Núcleo",cola:"Cola",pocion:"Poción",hierro:"Hierro",tapa:"Tapa",hojas:"Hojas",estrella:"Estrella",hueso:"Hueso"};

/* ---------- materiales ---------- */
const MC={};
function mat(kind,col){
  const key=kind+(col||"");if(MC[key])return MC[key];
  let m;
  if(kind==="bark")m=barkMat;else if(kind==="rock")m=rockMat;
  else{
    m=new B.PBRMaterial("m_"+key,scene);m.albedoColor=new B.Color3(1,1,1);m.metallic=0;m.roughness=.8;
    if(kind==="glass"){m.alpha=.6;m.roughness=.1;m.metallic=.1;m.backFaceCulling=false;}
    if(kind==="emit"){const c=B.Color3.FromHexString(col);m.albedoColor=c;m.emissiveColor=c;m.disableLighting=true;}
    if(kind==="vc")m.backFaceCulling=false;
  }
  return MC[key]=m;
}
const hex=c=>"#"+[0,1,2].map(i=>Math.round(Math.min(1,Math.max(0,c[i]))*255).toString(16).padStart(2,"0")).join("");
function toMesh(part,name,root){
  const g=part.g,n=g.p.length/3,cols=new Array(n*4);let r=0,gg=0,b=0;
  for(let k=0;k<n;k++){cols[k*4]=g.c[k*3];cols[k*4+1]=g.c[k*3+1];cols[k*4+2]=g.c[k*3+2];cols[k*4+3]=1;r+=g.c[k*3];gg+=g.c[k*3+1];b+=g.c[k*3+2];}
  const vd=new B.VertexData();vd.positions=g.p;vd.normals=g.n;vd.colors=cols;vd.indices=g.i;
  if(g.u&&g.u.length===n*2)vd.uvs=g.u;else{const uv=[];for(let k=0;k<n;k++)uv.push(g.p[k*3]*.5,g.p[k*3+1]*.5);vd.uvs=uv;}
  const m=new B.Mesh(name,scene);vd.applyToMesh(m);m.parent=root;
  m.material=mat(part.m,part.m==="emit"?hex([r/n,gg/n,b/n]):"");
  sg.addShadowCaster(m);m.receiveShadows=part.m!=="emit";return m;
}
/* ---------- definición de un elemento (de la biblioteca o subido por el usuario) ---------- */
function defOf(id){
  const d=Cat.byId[id];if(d)return {nombre:d.nombre,alto:d.alto,cat:d.cat,paleta:d.paleta,custom:false};
  const m=MINE.find(x=>x.id===id);if(m)return {nombre:m.nombre,alto:m.alto,cat:m.cat,paleta:{},custom:true,mine:m};
  return null;
}
function imgMat(m){
  if(m._mat)return m._mat;
  const t=new B.Texture(m.src,scene);t.hasAlpha=true;
  const x=new B.StandardMaterial("img_"+m.id,scene);x.diffuseTexture=t;x.emissiveTexture=t;x.useAlphaFromDiffuseTexture=true;x.disableLighting=true;x.backFaceCulling=false;
  return m._mat=x;
}
async function loadGLB(it){
  const m=it.mine;let res=null;
  if(!m.file&&m.pk&&window.Packs){m.file=await Packs.file(m.id);if(!m.file){say("Falta el modelo «"+m.nombre+"»: su paquete no está en este PC.");return;}}
  try{res=await B.SceneLoader.ImportMeshAsync("","file:",m.file,scene);}
  catch(e1){try{res=await B.SceneLoader.ImportMeshAsync("","",URL.createObjectURL(m.file),scene,null,".glb");}catch(e2){say("No pude abrir ese modelo 3D: "+(e2.message||e2));return;}}
  if(!placed.includes(it)){res.meshes.forEach(x=>x.dispose());return;}
  const gl=res.meshes[0];let mn=new V3(1e9,1e9,1e9),mx=new V3(-1e9,-1e9,-1e9);
  for(const x of res.meshes){if(!x.getBoundingInfo||!x.getTotalVertices||!x.getTotalVertices())continue;x.computeWorldMatrix(true);const bb=x.getBoundingInfo().boundingBox;mn=V3.Minimize(mn,bb.minimumWorld);mx=V3.Maximize(mx,bb.maximumWorld);}
  const h=Math.max(.001,mx.y-mn.y),k=m.alto/h,inner=new B.TransformNode("glbIn",scene);
  gl.scaling.scaleInPlace(k);gl.position.set(-(mn.x+mx.x)/2*k,-mn.y*k,-(mn.z+mx.z)/2*k);
  gl.parent=inner;inner.parent=it.root;it.inner=inner;it.over.alto&&inner.scaling.setAll(it.over.alto/m.alto);
  const ms=res.meshes.filter(x=>x.getTotalVertices&&x.getTotalVertices());
  ms.forEach(x=>{sg.addShadowCaster(x);x.receiveShadows=true;x.metadata={item:it};});
  it.meshes=ms;it.size=[(mx.x-mn.x)*k,m.alto,(mx.z-mn.z)*k];
  res.animationGroups.forEach((g,i)=>{if(i===0)g.start(true);else g.stop();});
  if(sel===it)it.meshes.forEach(x=>x.showBoundingBox=true);
}
function buildInto(it){
  for(const c of (it.meshes||[]))c.dispose();it.meshes=[];
  (it.joints||[]).forEach(j=>j.dispose());it.joints=[];it.rig=null;(it.disp||[]).forEach(d=>{try{d.dispose();}catch(e){}});it.disp=[];
  const d=defOf(it.id);
  if(d.custom){
    const m=d.mine,alto=it.over.alto||m.alto;
    it.ficha={id:it.id,nombre:m.nombre,alto,paleta:{}};
    if(m.kind==="puppet"){
      const r=Puppet.build(m,alto,it.root,scene,B,()=>{if(placed.includes(it))buildInto(it);});
      if(!r){it.size=[alto*m.w/m.h,alto,.3];return;}
      r.meshes.forEach(x=>{x.metadata={item:it};});it.meshes=r.meshes;it.joints=r.joints;it.disp=r.disp;it.rig=r.rig;it.size=r.size;
    }else if(m.kind==="img"){
      const ar=m.w/m.h,p=B.MeshBuilder.CreatePlane("img",{width:alto*ar,height:alto,sideOrientation:B.Mesh.DOUBLESIDE},scene);
      p.parent=it.root;p.position.y=alto/2;p.material=imgMat(m);p.metadata={item:it};it.meshes.push(p);it.size=[alto*ar,alto,.3];
    }else{
      it.size=[alto,alto,alto];
      if(it.inner){it.inner.scaling.setAll(alto/m.alto);it.meshes=it._ms||[];}
      else loadGLB(it);
    }
    it.meshes.forEach(x=>x.showBoundingBox=(it===sel));return;
  }
  const b=Cat.build(it.id,it.over);it.size=b.size;it.ficha=b.ficha;
  b.parts.forEach((p,i)=>{const m=toMesh(p,it.id+i,it.root);m.metadata={item:it};it.meshes.push(m);});
  it.meshes.forEach(m=>m.showBoundingBox=(it===sel));
}

/* ---------- colocar / mover / borrar ---------- */
const SCENERY=["arbol","planta","roca","casa","espacio"];
function place(id,o){
  o=o||{};const d=defOf(id);if(!d)return null;
  const root=new B.TransformNode("it_"+id,scene),n=placed.length,df=DEF[id]||{};
  const it={id,over:o.over||{},root,x:0,z:0,ry:o.ry||0,br:d.custom?0:Math.PI,kind:d.custom?d.mine.kind:"cat",mine:d.mine||null,
    anim:o.anim!==undefined?o.anim:(df.anim||""),mov:o.mov||null,talk:!!o.talk,pose:o.pose||"",emo:o.emo||"",uid:o.uid||("u"+Math.random().toString(36).slice(2,8)),ph:Math.random()*6.28};
  placed.push(it);it.y0=o.y;buildInto(it);
  const x=o.x!==undefined?o.x:((n*7)%13-6)*1.1,z=o.z!==undefined?o.z:6+((n*5)%7)*1.3;
  moveTo(it,x,z);
  if(!o.quiet){select(it);say(d.nombre+" agregado. Arrástralo para moverlo; toca para editarlo.");changed();}
  return it;
}
function baseY(it){return (it.y0!==undefined&&it.y0!==null)?it.y0:groundY(it.x,it.z);}
function moveTo(it,x,z){it.x=x;it.z=z;it.root.position.set(x,baseY(it),z);it.root.rotation.y=it.ry+it.br;}
function remove(it,quiet){(it.disp||[]).forEach(d=>{try{d.dispose();}catch(e){}});(it.meshes||[]).forEach(m=>m.dispose());if(it.inner)it.inner.dispose();it.root.dispose();const k=placed.indexOf(it);if(k>=0)placed.splice(k,1);if(sel===it)select(null);if(!quiet)changed();}
function clearItems(){while(placed.length)remove(placed[0],true);}
function dropPlace(id,px,py){
  const d=defOf(id),side=proj.estilo!=="3d",scen=SCENERY.includes(d.cat);
  let x,z,y;
  if(side){
    z=scen?(14+Math.random()*6):8;const p=planePoint(px,py,z);
    if(p){x=p.x;if(p.y>groundY(p.x,z)+1.2&&!scen)y=p.y-(d.alto||1)/2;}
  }else{const g=groundPoint(px,py);if(g){x=g.x;z=g.z;}}
  return place(id,{x:x,z:z,y:y});
}

/* ---------- puntos del lienzo ---------- */
function ray(px,py){try{const r=scene.createPickingRay(px,py,B.Matrix.Identity(),cam);return r&&isFinite(r.direction.y)?r:null;}catch(e){return null;}}
function groundPoint(px,py){
  const r=ray(px,py);if(!r||Math.abs(r.direction.y)<1e-4)return null;
  let y=0,p=null;for(let k=0;k<2;k++){const t=(y-r.origin.y)/r.direction.y;if(t<0)return null;p={x:r.origin.x+r.direction.x*t,z:r.origin.z+r.direction.z*t};y=groundY(p.x,p.z);}
  return p&&isFinite(p.x)?p:null;
}
function planePoint(px,py,z){
  const r=ray(px,py);if(!r||Math.abs(r.direction.z)<1e-4)return null;
  const t=(z-r.origin.z)/r.direction.z;if(t<0)return null;
  const p={x:r.origin.x+r.direction.x*t,y:r.origin.y+r.direction.y*t};return isFinite(p.x)&&isFinite(p.y)?p:null;
}
function canvasXY(e){const c=$("cv"),r=c.getBoundingClientRect();return [(e.clientX-r.left)*(c.width/r.width),(e.clientY-r.top)*(c.height/r.height)];}

/* ---------- animaciones (se ven siempre) ---------- */
let t0=performance.now();
scene.onBeforeRenderObservable.add(()=>{
  const t=(performance.now()-t0)/1000;
  for(const it of placed){
    if(it.kind==="img"&&it.mine._mat&&S.SPRITE){const c=S.SPRITE();if(c)it.mine._mat.emissiveColor=c;}
    if(it.rig&&!(pv.on&&it.mov)){const L=it.rig.pose(t,0,it.dubLv!=null?it.dubLv:it.talk,it.pose,it.emo);if(!it.anim&&drag!==it&&(L||it._lifted)){it.root.position.y=baseY(it)+(L||0);it._lifted=!!L;}if(S.SPRITE){const c=S.SPRITE();if(c)it.rig.tint(c);}}
    if(pv.on&&it.mov)continue;
    if(!it.anim||drag===it)continue;
    const r=it.root,by=baseY(it),p=it.ph;
    r.position.y=by;r.rotation.y=it.ry+it.br;r.rotation.z=0;r.scaling.setAll(1);
    if(it.anim==="flotar")r.position.y=by+.4+Math.sin(t*1.6+p)*.35;
    else if(it.anim==="girar")r.rotation.y=it.ry+it.br+t*1.8+p;
    else if(it.anim==="balancear")r.rotation.z=Math.sin(t*2+p)*.12;
    else if(it.anim==="latir")r.scaling.setAll(1+Math.sin(t*3+p)*.07);
    else if(it.anim==="saltarin")r.position.y=by+Math.abs(Math.sin(t*3+p))*.6;
  }
});

/* ---------- panel de propiedades (derecha) ---------- */
const props=$("props"),sceneBox=$("sceneProps");sceneBox.hidden=false;
const opt=(list,v)=>list.map(([k,n])=>`<option value="${k}"${k===v?" selected":""}>${n}</option>`).join("");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function showScene(){
  const w=proj.mundos[proj.mundo],th=THEMES[w.tema]||{n:"",e:""};
  const head=document.createElement("div");
  head.innerHTML=`<h3>🎬 ${esc(w.nombre)}</h3><div class="sub">${th.e} ${th.n}. Toca un elemento del lienzo para editarlo.</div>`;
  const sc=document.createElement("div");sc.className="card";
  sc.innerHTML=`<h4>⏱️ Esta escena</h4>
   <div class="row"><span>Nombre</span><input id="scN" type="text" value="${esc(w.nombre)}" style="flex:1;min-width:0;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:8px;padding:6px"></div>
   <div class="row"><span>Duración</span><input id="scD" type="range" min="2" max="40" value="${w.dur||6}"><b id="scDv" style="width:34px">${w.dur||6}s</b></div>
   <div class="row"><span>Cámara</span><select id="scC">${opt(CAMS,w.cam||"fija")}</select></div>`;
  const parts=[head,sc];
  const L=document.createElement("div");L.className="card";
  L.innerHTML=`<h4>Elementos en la escena (${placed.length})</h4>`+(placed.length?`<div id="layerList" style="max-height:140px;overflow:auto"></div>`:`<div class="sub">Vacía. Arrastra elementos desde la izquierda.</div>`);
  parts.push(L);parts.push(sceneBox);
  props.replaceChildren(...parts);
  $("scN").onchange=e=>{w.nombre=e.target.value||w.nombre;renderTimeline();guide();changed();};
  $("scD").oninput=e=>{w.dur=+e.target.value;$("scDv").textContent=w.dur+"s";renderTimeline();};
  $("scD").onchange=()=>changed();
  $("scC").onchange=e=>{w.cam=e.target.value;renderTimeline();changed();};
  const ll=$("layerList");
  if(window.Fx)Fx.panel(w,props);
  if(ll)placed.forEach(it=>{const b=document.createElement("button");b.style.cssText="display:block;width:100%;text-align:left;margin:2px 0;padding:5px 8px;font-size:12px";b.textContent=(it.ficha?it.ficha.nombre:it.id)+(it.mov?" 🚶":"");b.onclick=()=>select(it);ll.appendChild(b);});
}
/* ---------- recorrido con varias paradas, curva suave y rapidez ---------- */
const EASES={suave:u=>u*u*(3-2*u),lineal:u=>u,acelera:u=>u*u,frena:u=>1-(1-u)*(1-u)};
function routePts(sx,sz,m){const P=[{x:sx,z:sz}];(m.via||[]).forEach(p=>P.push(p));P.push({x:m.x,z:m.z});return P;}
function samplePath(P,curva){
  let S=[];
  if(!curva||P.length<3)S=P.map(p=>({x:p.x,z:p.z}));
  else{
    for(let i=0;i<P.length-1;i++){
      const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
      for(let k=0;k<14;k++){const t=k/14,t2=t*t,t3=t2*t;
        S.push({x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
                z:.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)});}
    }
    S.push({x:P[P.length-1].x,z:P[P.length-1].z});
  }
  const L=[0];for(let i=1;i<S.length;i++)L.push(L[i-1]+Math.hypot(S[i].x-S[i-1].x,S[i].z-S[i-1].z));
  return {S,L,len:L[L.length-1]||1e-6};
}
function pathAt(c,f){
  f=Math.min(1,Math.max(0,f));const d=f*c.len;let i=1;while(i<c.L.length-1&&c.L[i]<d)i++;
  const a=c.S[i-1],b=c.S[i],seg=(c.L[i]-c.L[i-1])||1e-6,u=Math.min(1,Math.max(0,(d-c.L[i-1])/seg));
  return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,dx:b.x-a.x,dz:b.z-a.z};
}
function pathCache(i,m){
  const key=i.sx+","+i.sz+"|"+m.x+","+m.z+"|"+JSON.stringify(m.via||[])+"|"+(m.curva!==false);
  if(m._ck!==key){m._pc=samplePath(routePts(i.sx,i.sz,m),m.curva!==false);m._ck=key;}
  return m._pc;
}
/* ruta y destino del movimiento */
let pathMeshes=[];
function clearPath(){pathMeshes.forEach(m=>m.dispose());pathMeshes=[];}
function showPath(it){
  clearPath();if(!it||!it.mov)return;
  const m=it.mov,P=routePts(it.x,it.z,m),c=samplePath(P,m.curva!==false);
  const mm=new B.StandardMaterial("pathM",scene);mm.emissiveColor=new B.Color3(1,.4,.75);mm.disableLighting=true;
  const pts=c.S.map(p=>new V3(p.x,groundY(p.x,p.z)+.1,p.z));
  const ln=B.MeshBuilder.CreateLines("pathLn",{points:pts},scene);ln.color=new B.Color3(1,.4,.75);ln.isPickable=false;pathMeshes=[ln];
  P.slice(1).forEach((p,k)=>{const last=k===P.length-2,d=B.MeshBuilder.CreateSphere("pathDot",{diameter:last?.6:.4},scene);d.position.set(p.x,groundY(p.x,p.z)+.1,p.z);d.material=mm;d.isPickable=false;pathMeshes.push(d);});
}
let targeting=null,tmode="set";
function select(it){
  if(sel)(sel.meshes||[]).forEach(m=>m.showBoundingBox=false);
  targeting=null;sel=it;if(!it){clearPath();showScene();guide();return;}
  (it.meshes||[]).forEach(m=>m.showBoundingBox=true);
  const f=it.ficha,d=defOf(it.id),w=proj.mundos[proj.mundo],dur=w.dur||6;
  const wrap=document.createElement("div");
  let h=`<h3>${esc(f.nombre)}</h3><div class="sub">Controles de este elemento</div>
  <div class="card"><h4>📐 Tamaño y posición</h4>
   <div class="row"><span>Alto (m)</span><input id="fAlto" type="range" min="${(d.alto*.2).toFixed(2)}" max="${(d.alto*3).toFixed(2)}" step=".05" value="${f.alto}"></div>
   <div class="row"><span>Girar</span><input id="fRot" type="range" min="0" max="360" value="${Math.round(it.ry*180/Math.PI)}"></div>
   <div class="row"><span>Altura del piso</span><input id="fY" type="range" min="0" max="12" step=".1" value="${Math.max(0,(it.y0===undefined||it.y0===null?0:it.y0-groundY(it.x,it.z))).toFixed(1)}"></div></div>
  <div class="card"><h4>🚶 Movimiento en la escena</h4>`;
  if(it.mov){
    h+=`<div class="row"><span>Empieza (s)</span><input id="mT0" type="range" min="0" max="${dur}" step=".5" value="${it.mov.t0}"><b id="mT0v" style="width:34px">${it.mov.t0}s</b></div>
    <div class="row"><span>Llega (s)</span><input id="mT1" type="range" min="0.5" max="${dur}" step=".5" value="${it.mov.t1}"><b id="mT1v" style="width:34px">${it.mov.t1}s</b></div>
    <div class="row"><span>Rapidez</span><select id="mEase"><option value="suave" ${(it.mov.ease||"suave")==="suave"?"selected":""}>Suave (parte y llega lento)</option><option value="lineal" ${it.mov.ease==="lineal"?"selected":""}>Constante</option><option value="acelera" ${it.mov.ease==="acelera"?"selected":""}>Empieza lento, termina rápido</option><option value="frena" ${it.mov.ease==="frena"?"selected":""}>Empieza rápido, termina lento</option></select></div>
    <div class="row"><span>Recorrido en curva</span><input id="mCurve" type="checkbox" ${it.mov.curva!==false?"checked":""}></div>
    <div class="sub">Puntos del recorrido: ${(it.mov.via||[]).length+1}</div>
    <div class="btns"><button id="mAdd" class="pri">➕ Agregar otro punto</button><button id="mUndo">↩ Quitar último punto</button></div>
    <div class="btns"><button id="mSet">📍 Cambiar destino</button><button id="mDel" class="danger">Quitar todo</button></div>`;
  }else h+=`<div class="sub">Haz que camine hasta otro lugar durante la escena.</div><div class="btns"><button id="mSet" class="pri">📍 Marcar destino</button></div>`;
  if(it.kind==="puppet"){const st=Object.assign({suav:.5,vel:1,amp:1,parp:true},it.mine.set||{});it.mine.set=st;
    h+=`</div><div class="card"><h4>🎭 Personaje</h4>
    <div class="row"><span>Velocidad al caminar</span><input id="pVel" type="range" min="4" max="20" value="${Math.round(st.vel*10)}"></div>
    <div class="row"><span>Largo de pasos</span><input id="pAmp" type="range" min="4" max="16" value="${Math.round(st.amp*10)}"></div>
    <div class="row"><span>Parpadea</span><input id="pParp" type="checkbox" ${st.parp?"checked":""}></div>
    <div class="row"><span>Habla (mueve la boca)</span><input id="pTalk" type="checkbox" ${it.talk?"checked":""}></div>
    <div class="row"><span>Acción</span><select id="pPose">${opt(Puppet.POSES,it.pose||"")}</select></div>
    <div class="row"><span>Cara</span><select id="pEmo">${opt(Puppet.EMOS,it.emo||"")}</select></div>
    ${Puppet.hasFace(it.mine)?"":'<div class="hint" style="font-size:11px;opacity:.7">Para usar caras, marca ojos y boca al crear el personaje.</div>'}`;}
  h+=`</div><div class="card"><h4>✨ Animación</h4><div class="row"><select id="fAnim">${opt(ANIMS,it.anim)}</select></div></div>`;
  const keys=Object.keys(f.paleta);
  if(keys.length){h+=`<div class="card"><h4>🎨 Colores</h4>`+keys.map(k=>`<div class="row"><span>${PLAB[k]||k}</span><input type="color" data-k="${k}" value="${f.paleta[k]}"></div>`).join("")+`</div>`;}
  h+=`<div class="btns">${keys.length?`<button id="fVar">🎲 Variar</button>`:""}<button id="fDup">⧉ Duplicar</button><button id="fDel" class="danger">🗑️ Borrar</button></div><div class="btns" style="margin-top:8px"><button id="fBack">← Volver a la escena</button></div>`;
  wrap.innerHTML=h;props.replaceChildren(wrap);
  const $$=id=>wrap.querySelector("#"+id);
  $$("fAlto").onchange=e=>{it.over.alto=+e.target.value;buildInto(it);moveTo(it,it.x,it.z);changed();};
  $$("fAlto").oninput=e=>{it.over.alto=+e.target.value;buildInto(it);};
  $$("fRot").oninput=e=>{it.ry=+e.target.value*Math.PI/180;it.root.rotation.y=it.ry+it.br;changed();};
  $$("fY").oninput=e=>{const v=+e.target.value;it.y0=v<.05?undefined:groundY(it.x,it.z)+v;moveTo(it,it.x,it.z);changed();};
  if(it.kind==="puppet"){
    $$("pVel").oninput=e=>{it.mine.set.vel=e.target.value/10;changed();};$$("pAmp").oninput=e=>{it.mine.set.amp=e.target.value/10;changed();};
    $$("pParp").onchange=e=>{it.mine.set.parp=e.target.checked;changed();};$$("pTalk").onchange=e=>{it.talk=e.target.checked;changed();};
    $$("pPose").onchange=e=>{it.pose=e.target.value;changed();};$$("pEmo").onchange=e=>{it.emo=e.target.value;changed();};
  }
  $$("fAnim").onchange=e=>{it.anim=e.target.value;if(!it.anim){it.root.position.y=baseY(it);it.root.rotation.z=0;it.root.scaling.setAll(1);it.root.rotation.y=it.ry+it.br;}changed();};
  $$("mSet").onclick=()=>{targeting=it;tmode="set";say("Toca en el lienzo el lugar donde debe llegar «"+f.nombre+"».");};
  if(it.mov){
    $$("mAdd").onclick=()=>{targeting=it;tmode="add";say("Toca el siguiente punto del recorrido. El último que marques será el destino.");};
    $$("mUndo").onclick=()=>{const v=it.mov.via||[];if(v.length){const p=v.pop();it.mov.x=p.x;it.mov.z=p.z;select(it);changed();}else{it.mov=null;clearPath();select(it);changed();}};
    $$("mEase").onchange=e=>{it.mov.ease=e.target.value;changed();};$$("mCurve").onchange=e=>{it.mov.curva=e.target.checked;showPath(it);changed();};
  }
  if(it.mov){
    $$("mDel").onclick=()=>{it.mov=null;clearPath();select(it);changed();};
    $$("mT0").oninput=e=>{it.mov.t0=+e.target.value;if(it.mov.t1<=it.mov.t0)it.mov.t1=it.mov.t0+.5;$$("mT0v").textContent=it.mov.t0+"s";$$("mT1").value=it.mov.t1;$$("mT1v").textContent=it.mov.t1+"s";changed();};
    $$("mT1").oninput=e=>{it.mov.t1=Math.max(+e.target.value,it.mov.t0+.5);$$("mT1v").textContent=it.mov.t1+"s";changed();};
  }
  wrap.querySelectorAll("input[type=color]").forEach(e=>e.onchange=()=>{it.over.paleta=Object.assign({},it.over.paleta,{[e.dataset.k]:e.value});buildInto(it);changed();});
  const v=$$("fVar");if(v)v.onclick=()=>{it.over.semilla=Math.floor(Math.random()*9999)+1;buildInto(it);changed();};
  $$("fDup").onclick=()=>duplicate(it);
  $$("fDel").onclick=()=>remove(it);
  $$("fBack").onclick=()=>select(null);
  showPath(it);guide();
}
function duplicate(it){const c=place(it.id,{over:JSON.parse(JSON.stringify(it.over)),ry:it.ry,anim:it.anim,x:it.x+1.6,z:it.z,y:it.y0===null?undefined:it.y0,quiet:true});select(c);changed();}

/* ---------- arrastrar elementos del lienzo; tocar para seleccionar ---------- */
let drag=null,moved=false;
scene.onPointerObservable.add(pi=>{
  if(!pi||pv.on)return;const T=B.PointerEventTypes;
  if(pi.type===T.POINTERDOWN){
    if(targeting)return;
    const p=scene.pick(scene.pointerX,scene.pointerY,m=>!!(m.metadata&&m.metadata.item));
    moved=false;
    if(p.hit&&p.pickedMesh.metadata){const it=p.pickedMesh.metadata.item;if(sel!==it)select(it);drag=it;cam.detachControl();}
  }else if(pi.type===T.POINTERMOVE&&drag){
    moved=true;
    if(proj.estilo==="3d"){const g=groundPoint(scene.pointerX,scene.pointerY);if(g)moveTo(drag,g.x,g.z);}
    else{const p=planePoint(scene.pointerX,scene.pointerY,drag.z);if(p){const gy=groundY(p.x,drag.z),by=p.y-(drag.size?drag.size[1]/2:0);drag.y0=by<gy+.5?undefined:by;moveTo(drag,p.x,drag.z);}}
  }else if(pi.type===T.POINTERUP&&drag){
    const was=drag;drag=null;cam.attachControl($("cv"),true);if(moved){changed();if(sel===was)select(was);}
  }else if(pi.type===T.POINTERTAP){
    if(targeting){
      const it=targeting;let x,z;
      if(proj.estilo==="3d"){const g=groundPoint(scene.pointerX,scene.pointerY);if(g){x=g.x;z=g.z;}}
      else{const p=planePoint(scene.pointerX,scene.pointerY,it.z);if(p){x=p.x;z=it.z;}}
      if(x!==undefined){
        const dur=proj.mundos[proj.mundo].dur||6;
        if(tmode==="add"&&it.mov){it.mov.via=(it.mov.via||[]).concat([{x:it.mov.x,z:it.mov.z}]);it.mov.x=x;it.mov.z=z;}
        else it.mov=Object.assign({t0:0,t1:dur,ease:"suave",curva:true},it.mov||{},{x,z});
        select(it);say(tmode==="add"?"Punto agregado. Puedes seguir agregando o ajustar los tiempos.":"Destino marcado. Ajusta cuándo empieza y cuándo llega.");changed();}
      else say("No pude calcular ese punto. Intenta tocar de nuevo.");
      return;
    }
    const p=scene.pick(scene.pointerX,scene.pointerY,m=>!!(m.metadata&&m.metadata.item));
    if(!(p.hit&&p.pickedMesh.metadata))select(null);
  }
});
window.addEventListener("keydown",e=>{
  if(/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||"")))return;
  if(pv.on){if(e.key==="Escape")stopPreview();return;}
  if(sel&&(e.key==="Delete"||e.key==="Backspace")){remove(sel);e.preventDefault();}
  else if(sel&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"){duplicate(sel);e.preventDefault();}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!e.shiftKey){undo();e.preventDefault();}
  else if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==="y"||(e.key.toLowerCase()==="z"&&e.shiftKey))){redo();e.preventDefault();}
  else if(e.key==="Escape"){targeting=null;select(null);}
});
{const bu=$("bUndo"),br=$("bRedo");if(bu)bu.onclick=undo;if(br)br.onclick=redo;}

/* ---------- arrastrar desde la biblioteca al lienzo ---------- */
const frame=$("frame");
frame.addEventListener("dragover",e=>{e.preventDefault();frame.classList.add("over");});
frame.addEventListener("dragleave",()=>frame.classList.remove("over"));
frame.addEventListener("drop",e=>{
  e.preventDefault();frame.classList.remove("over");
  const [px,py]=canvasXY(e);
  if(e.dataTransfer.files&&e.dataTransfer.files.length){uploadFile("objeto",e.dataTransfer.files[0],px,py);return;}
  const t=e.dataTransfer.getData("text/plain")||"";
  if(t.startsWith("atr:")){dropPlace(t.slice(4),px,py);}
});

/* ---------- biblioteca (izquierda) ---------- */
const RAIL=[["sug","⭐","Sugeridos"],["fondo","🖼️","Fondo"],["personaje","🧍","Personajes"],["arbol","🌳","Árboles"],["planta","🌿","Plantas"],["roca","⛰️","Rocas"],["casa","🏠","Casas"],["nave","🚀","Naves"],["espacio","🪐","Espacio"],["objeto","🎒","Objetos"],["paq","📦","Paquetes"]];
const TITLES={sug:"Sugeridos para tu cuento",fondo:"Fondo y ambiente",personaje:"Personajes",arbol:"Árboles",planta:"Plantas",roca:"Rocas y montañas",casa:"Casas y edificios",nave:"Naves y vehículos",espacio:"Espacio",objeto:"Objetos",paq:"Mis paquetes"};
const THUMBS=new Map();
function thumbOf(d){
  if(THUMBS.has(d.id))return THUMBS.get(d.id);
  const c=document.createElement("canvas");c.width=c.height=110;THUMBS.set(d.id,c);
  setTimeout(()=>{try{const b=Cat.build(d.id);const r=Thumb.render(b.parts,{size:110,bg:"#dfeef8"});c.getContext("2d").drawImage(r,0,0,110,110);}catch(e){}},0);
  return c;
}
function tile(id,nombre,visual){
  const t=document.createElement("div");t.className="tile";t.title=nombre;t.draggable=true;
  t.appendChild(visual);const n=document.createElement("div");n.className="nm";n.textContent=nombre;t.appendChild(n);
  t.ondragstart=e=>{e.dataTransfer.setData("text/plain","atr:"+id);e.dataTransfer.effectAllowed="copy";};
  t.onclick=()=>place(id);return t;
}
function mineVisual(m){
  if(m.thumb){const i=document.createElement("img");i.src=m.thumb;return i;}
  if(m.kind==="img"||m.kind==="puppet"){const i=document.createElement("img");i.src=m.src;return i;}
  const d=document.createElement("div");d.style.cssText="aspect-ratio:1;background:#3a3f66;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:30px";d.textContent="🧊";return d;
}
function addTile(label,emoji,fn){
  const t=document.createElement("div");t.className="tile add";t.innerHTML=`<big>${emoji}</big>${label}`;t.onclick=fn;return t;
}
function suggested(){
  const th=THEMES[proj.mundos[proj.mundo].tema]||THEMES.bosque;
  return Cat.items.filter(d=>d.cat==="personaje"||d.grp.some(x=>th.g.includes(x)));
}
function secTitle(txt){const d=document.createElement("div");d.className="sec";d.textContent=txt;return d;}
function chipRow(list,cur,fn){
  const r=document.createElement("div");r.className="chips";
  list.forEach(([k,n])=>{const b=document.createElement("span");b.className="chip"+(cur===k?" on":"");b.textContent=n;b.style.cursor="pointer";b.onclick=()=>fn(k);r.appendChild(b);});return r;
}
function setCat(c){cat=c;grp="";query="";$("q").value="";renderRail();renderLib();}
function renderRail(){
  const r=$("rail");r.innerHTML="";
  RAIL.forEach(([k,e,n])=>{
    if(k==="sug"&&!proj.activo)return;
    const b=document.createElement("button");b.className="rb"+(cat===k&&!query?" on":"");b.innerHTML=`<big>${e}</big>${n}`;b.onclick=()=>setCat(k);r.appendChild(b);
  });
}
function renderLib(){
  const body=$("libBody");body.innerHTML="";$("libTitle").textContent=query?"Resultados":(TITLES[cat]||"Biblioteca");
  const grid=document.createElement("div");grid.id="grid";
  if(query){
    const q=query.toLowerCase();
    Cat.items.filter(d=>d.nombre.toLowerCase().includes(q)).forEach(d=>grid.appendChild(tile(d.id,d.nombre,thumbOf(d))));
    MINE.filter(m=>m.kind!=="bg"&&m.nombre.toLowerCase().includes(q)).forEach(m=>grid.appendChild(tile(m.id,m.nombre,mineVisual(m))));
    body.appendChild(grid);if(!grid.children.length)body.textContent="No encontré nada con ese nombre.";return;
  }
  if(cat==="paq"){if(window.Packs)Packs.render(body);else body.textContent="Cargando paquetes…";return;}
  if(cat==="fondo"){
    const w=proj.mundos[proj.mundo];
    body.appendChild(secTitle("Momento del día"));
    body.appendChild(chipRow([["dia","☀️ Día"],["atardecer","🌇 Tarde"],["noche","🌙 Noche"]],curPre,k=>{curPre=k;w.pre=k;S.setPreset(k);changed();renderLib();}));
    body.appendChild(secTitle("Suelo"));
    body.appendChild(chipRow([["pasto","Pasto"],["arena","Arena"],["nieve","Nieve"],["tierra","Tierra"],["roca","Roca"],["ninguno","Sin suelo"]],w.suelo||"pasto",k=>{w.suelo=k;S.setGround(k);changed();renderLib();}));
    body.appendChild(secTitle("Fondo lejano"));
    const g2=document.createElement("div");g2.id="grid";
    g2.appendChild(addTile("Subir mi fondo","⬆️",()=>pickFile("fondo")));
    g2.appendChild(addTile(w.fondo?"Editar profundidad":"Fondo con profundidad","🏔️",()=>window.Scenery&&Scenery.open()));
    g2.appendChild(addTile("Reconstruir desde imagen","🪄",()=>window.Recon&&Recon.open()));
    const auto=document.createElement("div");auto.className="tile";auto.innerHTML=`<div style="aspect-ratio:1;border-radius:7px;background:linear-gradient(#7ec8ff,#dff3ff);display:flex;align-items:center;justify-content:center;font-size:26px">✨</div><div class="nm">Automático</div>`;
    auto.onclick=()=>{delete w.fondo;window.__userBd=false;w.bg="";S.setPreset(curPre);changed();};g2.appendChild(auto);
    MINE.filter(m=>m.kind==="bg").forEach(m=>{const t=document.createElement("div");t.className="tile";const i=document.createElement("img");i.src=m.src;t.appendChild(i);t.insertAdjacentHTML("beforeend",`<div class="nm">${esc(m.nombre)}</div>`);t.onclick=()=>{delete w.fondo;window.__userBd=true;S.setBackdropImage(m.src);w.bg="mine:"+m.id;changed();};g2.appendChild(t);});
    (S.A.bg||[]).forEach(a=>{const t=document.createElement("div");t.className="tile";const i=document.createElement("img");i.src=a.src;t.appendChild(i);t.insertAdjacentHTML("beforeend",`<div class="nm">${esc(a.name)}</div>`);t.onclick=()=>{delete w.fondo;window.__userBd=true;S.setBackdrop(a.name);S.setBackdropOn(true);w.bg=a.name;changed();};g2.appendChild(t);});
    body.appendChild(g2);return;
  }
  let list=[],extra=[];
  if(cat==="sug"){list=suggested();if(window.Packs)extra=Packs.sugeridos(proj.mundos[proj.mundo].tema).map(a=>MINE.find(m=>m.id===a.id)).filter(Boolean);}
  else if(cat==="personaje"){list=Cat.items.filter(d=>d.cat==="personaje");extra=MINE.filter(m=>m.cat==="personaje"&&m.kind!=="bg");grid.appendChild(addTile("Agregar personaje","➕",openAddChar));}
  else{
    if(cat!=="objeto"&&cat!=="juego"){/* chips por tipo */
      const used=new Set();Cat.items.forEach(d=>{if(d.cat===cat)d.grp.forEach(x=>used.add(x));});
      if(used.size>1)body.appendChild(chipRow([["","Todos"]].concat([...used].map(k=>[k,Cat.GRP[k]||k])),grp,k=>{grp=k;renderLib();}));
    }
    list=Cat.search("",cat,grp);
    if(cat!=="objeto")extra=MINE.filter(m=>m.cat===cat&&m.kind!=="bg");
    if(cat==="objeto"){extra=MINE.filter(m=>m.cat==="objeto"&&m.kind!=="bg");grid.appendChild(addTile("Subir mi objeto","⬆️",()=>pickFile("objeto")));}
  }
  list.forEach(d=>grid.appendChild(tile(d.id,d.nombre,thumbOf(d))));
  extra.forEach(m=>grid.appendChild(tile(m.id,m.nombre,mineVisual(m))));
  body.appendChild(grid);
  if(!grid.children.length)body.textContent="Nada por aquí todavía.";
}
$("q").oninput=e=>{query=e.target.value.trim();renderRail();renderLib();};

/* ---------- subir personajes, dibujos y modelos ---------- */
let upKind="objeto";
function pickFile(kind,accept){upKind=kind;const f=$("fUp");f.accept=accept||(kind==="fondo"?"image/*":"image/*,.glb,.gltf");f.click();}
$("fUp").onchange=e=>{const f=e.target.files[0];e.target.value="";if(f)uploadFile(upKind,f);};
function openAddChar(){$("addChar").hidden=false;}
$("acClose").onclick=()=>{$("addChar").hidden=true;};
$("acBase").onclick=()=>{$("addChar").hidden=true;place("heroe",{x:(Math.random()-.5)*8,z:8});setCat("personaje");};
$("acImg").onclick=()=>{$("addChar").hidden=true;Puppet.open(addPuppet);};
$("acFlat").onclick=()=>{$("addChar").hidden=true;pickFile("pers","image/*");};
function addPuppet(m){MINE.push(m);place(m.id,{x:(Math.random()-.5)*6,z:8});setCat("personaje");say("«"+m.nombre+"» creado. Pinchálo y márcale un destino para verlo caminar.");}
$("acGlb").onclick=()=>{$("addChar").hidden=true;pickFile("pers",".glb,.gltf");};
$("bAddChar").onclick=openAddChar;
function downscale(img,max){
  const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*k)),h=Math.max(1,Math.round(img.naturalHeight*k));
  const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);return {src:c.toDataURL("image/png"),w,h};
}
function uploadFile(kind,file,px,py){
  const name=(file.name||"Mi elemento").replace(/\.[^.]+$/,"").slice(0,24),ext=((file.name||"").split(".").pop()||"").toLowerCase();
  if(/^(glb|gltf)$/.test(ext)){
    if(kind==="fondo"){say("Un fondo debe ser una imagen (PNG o JPG).");return;}
    const m={id:"mi"+Date.now().toString(36),nombre:name,kind:"glb",file,cat:kind==="pers"?"personaje":"objeto",alto:kind==="pers"?3:2.5};MINE.push(m);if(window.Packs)Packs.guardarSuelto(m,file).then(()=>renderLib());
    const it=kind==="pers"&&px===undefined?place(m.id,{x:(Math.random()-.5)*6,z:8}):(px!==undefined?dropPlace(m.id,px,py):place(m.id));
    setCat(m.cat);say("Modelo 3D «"+name+"» agregado.");return;
  }
  if(!/^image\//.test(file.type||"")&&!/^(png|jpe?g|webp|gif|bmp)$/.test(ext)){say("Ese formato no es compatible. Usa PNG/JPG o .glb/.gltf.");return;}
  const fr=new FileReader();
  fr.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const d=downscale(im,kind==="fondo"?1600:1024);
      if(kind==="fondo"){const m={id:"mi"+Date.now().toString(36),nombre:name,kind:"bg",src:d.src,w:d.w,h:d.h,cat:"fondo"};MINE.push(m);delete proj.mundos[proj.mundo].fondo;window.__userBd=true;S.setBackdropImage(d.src);proj.mundos[proj.mundo].bg="mine:"+m.id;setCat("fondo");say("Fondo «"+name+"» aplicado.");changed();return;}
      const m={id:"mi"+Date.now().toString(36),nombre:name,kind:"img",src:d.src,w:d.w,h:d.h,cat:kind==="pers"?"personaje":"objeto",alto:kind==="pers"?3:2.5};MINE.push(m);
      if(px!==undefined)dropPlace(m.id,px,py);else place(m.id,{x:(Math.random()-.5)*6,z:8});
      setCat(m.cat);say("«"+name+"» agregado. Pinchálo para darle acciones y animaciones.");
    };
    im.onerror=()=>say("No pude leer esa imagen.");im.src=fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- estilo de cámara ---------- */
function applyStyle(es){
  proj.estilo=es;
  document.querySelectorAll("#segStyle button").forEach(b=>b.classList.toggle("on",b.dataset.es===es));
  if(es==="2d"){cam.lowerAlphaLimit=-Math.PI/2-.01;cam.upperAlphaLimit=-Math.PI/2+.01;cam.lowerBetaLimit=1.5;cam.upperBetaLimit=1.6;cam.alpha=-Math.PI/2;cam.beta=1.57;cam.fov=.5;cam.upperRadiusLimit=60;cam.radius=34;}
  else if(es==="2.5d"){cam.lowerAlphaLimit=-Math.PI/2-.55;cam.upperAlphaLimit=-Math.PI/2+.55;cam.lowerBetaLimit=1.2;cam.upperBetaLimit=1.62;cam.alpha=-Math.PI/2+.12;cam.beta=1.42;cam.fov=.8;cam.upperRadiusLimit=45;cam.radius=24;}
  else{cam.lowerAlphaLimit=null;cam.upperAlphaLimit=null;cam.lowerBetaLimit=.8;cam.upperBetaLimit=1.65;cam.alpha=-Math.PI/2;cam.beta=1.38;cam.fov=.8;cam.upperRadiusLimit=45;cam.radius=17;}
  cam.setTarget(new V3(0,3,8));
}
document.querySelectorAll("#segStyle button").forEach(b=>b.onclick=()=>{applyStyle(b.dataset.es);changed();});

/* ---------- escenas, cuentos y guardado ---------- */
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function starterDeco(tema,seed){
  const th=THEMES[tema]||THEMES.bosque,r=rng(seed||(tema.length*977+proj.mundos.length*31)),n=proj.estilo==="3d"?16:14;
  for(let i=0;i<n;i++){
    const id=th.deco[Math.floor(r()*th.deco.length)];if(!Cat.byId[id])continue;
    place(id,{x:-26+i*(52/n)+r()*2,z:proj.estilo==="3d"?(4+r()*26):(14+r()*16),ry:r()*6,quiet:true});
  }
}
function newScene(tema,nombre){
  const t=tema||"bosque",th=THEMES[t]||THEMES.bosque;
  return {nombre:nombre||("Escena "+(proj.mundos.length+1)),tema:t,items:[],pre:th.pre,suelo:th.suelo||"pasto",bg:"",dur:6,cam:"fija"};
}
function snapshot(){
  const out=[];
  for(const it of placed){
    const o={id:it.id,over:it.over,x:it.x,z:it.z,y:it.y0===undefined?null:it.y0,ry:it.ry,anim:it.anim,mov:it.mov,talk:it.talk||undefined,pose:it.pose||undefined,emo:it.emo||undefined,uid:it.uid};
    if(it.kind==="img")o.mine={id:it.mine.id,nombre:it.mine.nombre,kind:"img",src:it.mine.src,w:it.mine.w,h:it.mine.h,cat:it.mine.cat,alto:it.mine.alto};
    else if(it.kind==="puppet")o.mine={id:it.mine.id,nombre:it.mine.nombre,kind:"puppet",src:it.mine.src,w:it.mine.w,h:it.mine.h,cat:it.mine.cat,alto:it.mine.alto,pts:it.mine.pts,tol:it.mine.tol,set:it.mine.set};
    else if(it.kind==="glb"){if(it.mine.pk)o.mine={id:it.mine.id,nombre:it.mine.nombre,kind:"glb",cat:it.mine.cat,alto:it.mine.alto,pk:true,pack:it.mine.pack};else continue;}
    out.push(o);
  }
  return out;
}
function saveWorld(){proj.mundos[proj.mundo].items=snapshot();}
function applyWorldLook(w){
  const th=THEMES[w.tema]||THEMES.bosque;
  curPre=w.pre||th.pre;w.pre=curPre;w.suelo=w.suelo||th.suelo||"pasto";
  window.__userBd=!!w.bg||!!w.fondo;S.setPreset(curPre);S.setGround(w.suelo);
  if(window.Scenery)Scenery.set(w.fondo||null);
  if(w.fondo){}
  else if(w.bg){
    if(w.bg.startsWith("mine:")){const m=MINE.find(x=>x.id===w.bg.slice(5));if(m)S.setBackdropImage(m.src);}
    else{S.setBackdrop(w.bg);S.setBackdropOn(true);}
  }
}
function buildWorld(i){
  clearItems();S.clear();clearPath();proj.mundo=i;const w=proj.mundos[i];
  for(const o of w.items){
    if(o.mine&&!MINE.find(m=>m.id===o.mine.id))MINE.push(Object.assign({},o.mine));
    place(o.id,{over:o.over,x:o.x,z:o.z,y:o.y===null?undefined:o.y,ry:o.ry,anim:o.anim,mov:o.mov,talk:o.talk,pose:o.pose,emo:o.emo,uid:o.uid,quiet:true});
  }
  applyWorldLook(w);select(null);renderRail();renderLib();renderTimeline();guide();
  clearTimeout(histT);setTimeout(()=>{pushHist();undoUI();},0);
}
function gotoWorld(i){if(pv.on)return;saveWorld();buildWorld(i);say("Estás en «"+proj.mundos[i].nombre+"».");changed();}
/* ---------- deshacer / rehacer (por escena) ---------- */
const HM=new WeakMap();let histT=null;
function stateNow(){
  saveWorld();const w=proj.mundos[proj.mundo];
  return JSON.stringify({nombre:w.nombre,tema:w.tema,items:w.items.map(o=>o.mine?Object.assign({},o,{mine:Object.assign({},o.mine,{src:undefined})}):o),pre:w.pre,suelo:w.suelo,bg:w.bg,fondo:w.fondo?w.fondo.id:undefined,dur:w.dur,cam:w.cam,lineas:(w.lineas&&w.lineas.length)?w.lineas:undefined,trans:w.trans||undefined,efecto:w.efecto||undefined,textos:(w.textos&&w.textos.length)?w.textos:undefined});
}
function hist(){const w=proj.mundos[proj.mundo];let h=HM.get(w);if(!h){h={s:[],i:-1};HM.set(w,h);}return h;}
function pushHist(){
  if(pv.on)return;const h=hist(),st=stateNow();
  if(h.s[h.i]===st)return;
  h.s.length=h.i+1;h.s.push(st);if(h.s.length>60)h.s.shift();h.i=h.s.length-1;undoUI();
}
function undoUI(){const h=hist();const u=$("bUndo"),r=$("bRedo");if(u)u.disabled=!(h.i>0);if(r)r.disabled=!(h.i<h.s.length-1);}
function applyHist(h){
  const st=JSON.parse(h.s[h.i]),w=proj.mundos[proj.mundo];
  for(const k of ["nombre","tema","pre","suelo","bg","dur","cam","lineas","trans","efecto","textos"]){if(st[k]===undefined)delete w[k];else w[k]=st[k];}
  if(st.fondo&&window.Scenery&&Scenery.reg[st.fondo])w.fondo=Scenery.reg[st.fondo];else delete w.fondo;
  w.items=st.items;buildWorld(proj.mundo);undoUI();changed();
}
function undo(){if(pv.on)return;clearTimeout(histT);pushHist();const h=hist();if(h.i>0){h.i--;applyHist(h);say("Deshecho.");}else say("No hay nada que deshacer.");}
function redo(){if(pv.on)return;clearTimeout(histT);pushHist();const h=hist();if(h.i<h.s.length-1){h.i++;applyHist(h);say("Rehecho.");}else say("No hay nada que rehacer.");}
let saveT=null;
function changed(){
  clearTimeout(histT);histT=setTimeout(pushHist,350);
  guide();if(!sel&&!pv.on)showScene();renderTimeline();clearTimeout(saveT);
  saveT=setTimeout(()=>{try{saveWorld();localStorage.setItem("atr2_story",JSON.stringify(proj));}catch(e){}},700);
}
function exportText(){saveWorld();return JSON.stringify(Object.assign({},proj,{audios:window.Dub?Dub.dump():undefined}));}
function importText(txt){
  const p=JSON.parse(txt);if(!p||!p.mundos)throw new Error("Proyecto no válido");
  p.mundos.forEach(m=>{m.dur=m.dur||6;m.cam=m.cam||"fija";});
  const au=p.audios;delete p.audios;if(window.Dub)Dub.load(au);
  Object.assign(proj,p);applyStyle(proj.estilo);buildWorld(Math.min(proj.mundo||0,proj.mundos.length-1));
  if(window.Dub)Dub.restore();
  if(window.Subs)Subs.restore();
}
function hasSaved(){try{return !!localStorage.getItem("atr2_story");}catch(e){return false;}}
function loadSaved(){try{importText(localStorage.getItem("atr2_story"));return true;}catch(e){return false;}}
function addScene(tema){
  if(pv.on)return;saveWorld();const cur=proj.mundos[proj.mundo];
  proj.mundos.push(newScene(tema||cur.tema));buildWorld(proj.mundos.length-1);
  const pd=window.Packs&&Packs.porDefecto(proj.mundos[proj.mundo].tema);
  if(pd){Packs.usarEscena(pd.escena,"reemplazar");say("Usé la escena «"+pd.escena.nombre+"» de tu paquete «"+pd.pack.nombre+"».");}
  else starterDeco(proj.mundos[proj.mundo].tema);
  changed();
}
/* un cuento nuevo: el asistente entrega estilo, nombre y escenas ya armadas */
function newStory(o){
  clearItems();S.clear();clearPath();
  Object.assign(proj,{estilo:o.estilo,nombre:o.nombre,historia:o.historia||"",activo:true,mundo:0,mundos:[]});
  applyStyle(proj.estilo);
  o.escenas.forEach((e,i)=>{
    proj.mundos.push(newScene(e.tema,e.nombre));proj.mundo=i;const w=proj.mundos[i];w.dur=e.dur||6;w.cam=e.cam||"fija";
    clearItems();S.clear();starterDeco(e.tema,i*101+7);
    (e.items||[]).forEach(o2=>place(o2.id,{x:o2.x,z:o2.z,y:o2.y,ry:o2.ry||0,over:o2.over,anim:o2.anim,mov:o2.mov?Object.assign({t0:0,t1:w.dur},o2.mov):null,quiet:true}));
    w.items=snapshot();
    if(e.lineas&&e.lineas.length)w.lineas=e.lineas.map((l,k)=>({id:"l"+Date.now().toString(36)+i+k+Math.random().toString(36).slice(2,4),txt:l.txt,quien:"",t0:l.t0}));
  });
  buildWorld(0);cat="sug";renderRail();renderLib();changed();
  say("¡Cuento «"+(proj.nombre||"sin título")+"» listo! Pulsa ▶ Vista previa para verlo.");
}
function emptyProject(){
  clearItems();S.clear();clearPath();
  Object.assign(proj,{estilo:proj.estilo||"2.5d",nombre:"",activo:false,mundo:0,mundos:[newScene("bosque","Escena 1")]});
  buildWorld(0);
}

/* ---------- vista previa de la animación ---------- */
const pv={on:false,all:false,t:0,saved:[],r0:17,hud:null};
const sm=u=>u*u*(3-2*u);
function beginScene(){
  const w=proj.mundos[proj.mundo];pv.dur=w.dur||6;pv.t=0;pv.r0=cam.radius;pv.cam=w.cam||"fija";
  pv.saved=placed.map(i=>({i,x:i.x,z:i.z,y0:i.y0}));
  pv.follow=pv.cam==="seguir"?(placed.find(i=>i.mov)||null):null;
  placed.forEach(i=>{i.root.setEnabled(true);i.sx=i.x;i.sz=i.z;});
  cam.upperRadiusLimit=120;
  if(window.Dub)Dub.begin(w,!pv.exp);
}
function startPreview(all){
  if(pv.on)return;
  if(!placed.length&&!all){say("Agrega elementos al lienzo para ver la animación.");return;}
  saveWorld();select(null);pv.on=true;pv.all=!!all;
  if(all&&proj.mundo!==0)buildWorld(0);
  beginScene();cam.detachControl();hudUpdate();$("bPlay").textContent="⏹ Detener";$("bPlayAll").hidden=true;
}
function stopPreview(msg){
  if(!pv.on)return;pv.on=false;const ex=pv.exp;pv.exp=null;
  for(const s of pv.saved){const i=s.i;if(!i.root)continue;i.root.setEnabled(true);i.y0=s.y0;moveTo(i,s.x,s.z);i.root.rotation.z=0;i.root.scaling.setAll(1);i.root.rotation.y=i.ry+i.br;}
  cam.attachControl($("cv"),true);applyStyle(proj.estilo);
  $("hud").hidden=true;$("bPlay").textContent="▶ Vista previa";$("bPlayAll").hidden=false;if(msg)say(msg);guide();
  if(window.Dub)Dub.stop();
  if(ex)ex.end(msg);
}
scene.onAfterRenderObservable.add(()=>{if(pv.on&&pv.exp)pv.exp.capture();});
function beginExport(ex){if(pv.on)return false;pv.exp=ex;startPreview(true);if(!pv.on){pv.exp=null;return false;}return true;}
function cancelExport(){if(pv.on&&pv.exp){pv.exp.cancelled=true;stopPreview("Exportación cancelada.");}}
function totalSeconds(){saveWorld();return proj.mundos.reduce((a,m)=>a+(m.dur||6),0);}
function hudUpdate(){
  const h=$("hud");h.hidden=!pv.on;if(!pv.on)return;
  const m=Math.floor(pv.t/60),s=Math.floor(pv.t%60);
  $("hudT").textContent="🎬 Escena "+(proj.mundo+1)+"/"+proj.mundos.length+" · "+m+":"+String(s).padStart(2,"0")+" / "+pv.dur+"s";
}
function faceMove(i,dx,dz){
  if(i.kind==="img"||i.kind==="puppet"){if(dx)i.root.scaling.x=dx<0?-1:1;i.root.rotation.y=i.ry;return;}
  const off=i.br-Math.PI;
  i.root.rotation.y=(proj.estilo==="3d"?Math.atan2(dx,dz):(dx>=0?Math.PI/2:-Math.PI/2))+off;
}
scene.onBeforeRenderObservable.add(()=>{
  if(!pv.on)return;
  if(pv.exp&&pv.exp.skip())return;
  const dt=pv.exp?1/pv.exp.fps:Math.min(.05,scene.getEngine().getDeltaTime()/1000||.016);pv.t+=dt;const t=pv.t;
  for(const i of placed){
    if(!i.mov){if(i.rig){const L=i.rig.pose(t,0,i.dubLv!=null?i.dubLv:i.talk,i.pose,i.emo);if(!i.anim&&(L||i._lifted)){i.root.position.y=baseY(i)+(L||0);i._lifted=!!L;}}continue;}const m=i.mov,u=Math.min(1,Math.max(0,(t-m.t0)/Math.max(.1,m.t1-m.t0))),e=(EASES[m.ease]||EASES.suave)(u);
    const pc=pathCache(i,m),pa=pathAt(pc,e),x=pa.x,z=pa.z,walking=u>0&&u<1;
    i.x=x;i.z=z;i.root.position.set(x,baseY(i)+(walking?Math.abs(Math.sin(t*10))*.12:0),z);
    i.root.rotation.z=walking?Math.sin(t*10)*.05:0;
    if(i.rig)i.rig.pose(t,walking?1:0,i.dubLv!=null?i.dubLv:i.talk,"",i.emo);
    if(u>0&&u<1)faceMove(i,pa.dx,pa.dz);
  }
  const w=proj.mundos[proj.mundo],k=Math.min(1,t/pv.dur);let tx=0,r=pv.r0;
  if(pv.cam==="derecha")tx=-10+20*k;else if(pv.cam==="izquierda")tx=10-20*k;
  else if(pv.cam==="acercar")r=pv.r0*(1-.45*k);else if(pv.cam==="alejar")r=pv.r0*(1+.4*k);
  else if(pv.cam==="seguir"&&pv.follow)tx=pv.follow.x;
  if(pv.cam!=="fija"){cam.setTarget(new V3(tx,3,8));cam.radius=r;}
  hudUpdate();if(window.Fx)Fx.tick(t,w);if(window.Dub)Dub.tick(t,w);
  if(t>=pv.dur){
    if(pv.all&&proj.mundo<proj.mundos.length-1){stopSceneRestore();buildWorld(proj.mundo+1);beginScene();}
    else stopPreview("Fin de la vista previa.");
  }
});
function stopSceneRestore(){
  if(window.Dub)Dub.stop();
  for(const s of pv.saved){const i=s.i;if(!i.root)continue;i.y0=s.y0;moveTo(i,s.x,s.z);i.root.rotation.z=0;i.root.scaling.setAll(1);}
}
$("bPlay").onclick=()=>{if(pv.on)stopPreview("Vista previa detenida.");else startPreview(false);};
$("bPlayAll").onclick=()=>startPreview(true);
$("hudStop").onclick=()=>stopPreview("Vista previa detenida.");

/* ---------- línea de tiempo (escenas) ---------- */
function renderTimeline(){
  const t=$("tlCards");if(!t)return;t.innerHTML="";
  let total=0;
  proj.mundos.forEach((m,i)=>{
    total+=(m.dur||6);
    const c=document.createElement("div");c.className="sc"+(i===proj.mundo?" on":"");
    const th=THEMES[m.tema]||{e:""};
    c.innerHTML=`<b>${i+1}. ${esc(m.nombre)}</b><small>${th.e} ${m.dur||6}s · 🎥 ${({fija:"fija",derecha:"→ derecha",izquierda:"← izquierda",acercar:"acerca",alejar:"aleja",seguir:"sigue"})[m.cam||"fija"]}</small>`;
    c.onclick=()=>gotoWorld(i);t.appendChild(c);
  });
  $("tlTotal").textContent="Total "+Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
}
$("bAddScene").onclick=()=>addScene();

/* ---------- mensaje guía ---------- */
function guide(){
  const w=proj.mundos[proj.mundo];let msg;
  if(pv.on)msg="Reproduciendo tu animación…  (Esc para detener)";
  else if(targeting)msg="Toca en el lienzo el lugar de destino.";
  else if(sel)msg="Editando «"+(sel.ficha?sel.ficha.nombre:"")+"». Arrástralo para moverlo; a la derecha están sus controles.";
  else if(proj.activo)msg="«"+(proj.nombre||"Tu cuento")+"» · "+w.nombre+". Arrastra elementos al lienzo, toca uno para editarlo o hazlo caminar.";
  else msg="Lienzo en blanco. Arrastra elementos desde la izquierda, o abre el 🧙 Asistente para armar un cuento paso a paso.";
  $("guideMsg").textContent=msg;
}

/* ---------- arranque ---------- */
applyStyle("2.5d");applyWorldLook(proj.mundos[0]);
renderRail();renderLib();showScene();renderTimeline();guide();
function gotoRebuild(i){buildWorld(i);changed();}
window.Studio={tile,mineVisual,saveWorld,gotoRebuild,rerender:()=>renderLib(),proj,THEMES,place,clearItems,applyWorldLook,newStory,applyStyle,hasSaved,loadSaved,exportText,importText,say,setCat,placed,select,MINE,showScene,get playing(){return pv.on;},emptyProject,addPuppet,changed,undo,redo,play:()=>startPreview(false),stopPlay:()=>stopPreview(),beginExport,cancelExport,totalSeconds};
window.__lib={placed,place,Cat,Studio:window.Studio};
document.dispatchEvent(new Event("studio-ready"));
}
boot();
})();
