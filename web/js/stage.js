/* Atrapacuentos Studio 2 · Fase 1: escenario 2.5D + 3D con Babylon.js */
(async function(){
"use strict";
const $=id=>document.getElementById(id);
const say=t=>{$("status").textContent=t;};
if(!window.BABYLON){say("No se pudo cargar Babylon.js. Revisa tu conexión a internet y recarga.");return;}
const B=BABYLON,V3=B.Vector3,C3=B.Color3,P=window.Proc,A=(window.EST&&window.EST.A)||{bg:[],arbol:[]};
const canvas=$("cv");

/* ---------- Motor: WebGL2 por defecto, WebGPU si lo pides ---------- */
let engine=null,backend="WebGL2",wantGPU=false;
try{wantGPU=localStorage.getItem("atr2_gpu")==="1";}catch(e){}
if(wantGPU){
  try{
    if(B.WebGPUEngine&&await B.WebGPUEngine.IsSupportedAsync){
      const e=new B.WebGPUEngine(canvas,{antialias:true,stencil:true});
      await e.initAsync();engine=e;backend="WebGPU";
    }
  }catch(err){engine=null;}
}
if(!engine)engine=new B.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,antialias:true},true);

const scene=new B.Scene(engine);
scene.fogMode=B.Scene.FOGMODE_EXP2;

/* ---------- Cámara ---------- */
const cam=new B.ArcRotateCamera("cam",-Math.PI/2,1.38,17,new V3(0,3,8),scene);
cam.fov=.8;cam.minZ=.1;cam.maxZ=500;cam.lowerRadiusLimit=4;cam.upperRadiusLimit=45;
cam.lowerBetaLimit=.8;cam.upperBetaLimit=1.65;cam.wheelPrecision=20;cam.panningSensibility=0;
cam.attachControl(canvas,true);

/* ---------- Luces y sombras ---------- */
const hemi=new B.HemisphericLight("hemi",new V3(0,1,0),scene);
const sun=new B.DirectionalLight("sun",new V3(-.5,-1,.6),scene);
sun.position=new V3(30,50,-20);
const sg=new B.ShadowGenerator(2048,sun);
sg.usePercentageCloserFiltering=true;sg.filteringQuality=B.ShadowGenerator.QUALITY_HIGH;
sg.bias=.0006;sg.normalBias=.02;

/* ---------- Terreno ---------- */
const GW=150,GD=130,GZ=30;
function groundY(wx,wz){
  const r=Math.hypot(wx*.8,wz-8);
  return (P.fbm(wx*.045+10,wz*.045+10,4,3)-.5)*6*P.smooth(9,40,r);
}
const ground=B.MeshBuilder.CreateGround("ground",{width:GW,height:GD,subdivisions:150,updatable:true},scene);
ground.position.set(0,0,GZ);
{
  const pos=ground.getVerticesData(B.VertexBuffer.PositionKind);
  for(let i=0;i<pos.length;i+=3)pos[i+1]=groundY(pos[i],pos[i+2]+GZ);
  ground.updateVerticesData(B.VertexBuffer.PositionKind,pos);
  const nor=[];B.VertexData.ComputeNormals(pos,ground.getIndices(),nor);
  ground.updateVerticesData(B.VertexBuffer.NormalKind,nor);
}
ground.receiveShadows=true;

/* ---------- Materiales procedurales ---------- */
function dyn(canvasSrc,uS,vS){
  const s=canvasSrc.width,t=new B.DynamicTexture("t",s,scene,true);
  t.getContext().drawImage(canvasSrc,0,0);t.update();
  t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.uScale=uS;t.vScale=vS;return t;
}
function pbrFrom(name,tx,uS,vS,rough,bump){
  const m=new B.PBRMaterial(name,scene);
  m.albedoTexture=dyn(tx.color,uS,vS);
  m.bumpTexture=dyn(tx.normal,uS,vS);m.bumpTexture.level=bump||1;
  m.metallic=0;m.roughness=rough;
  return m;
}
const grassTx=P.grass(512),barkTx=P.bark(512),rockTx=P.rock(512);
ground.material=pbrFrom("grassM",grassTx,26,22,.95,1);
const barkMat=pbrFrom("barkM",barkTx,1,3,.9,1.4);
const rockMat=pbrFrom("rockM",rockTx,2,2,.92,1.6);
const leafMat=new B.PBRMaterial("leafM",scene);leafMat.albedoColor=new C3(1,1,1);leafMat.metallic=0;leafMat.roughness=.85;

/* ---------- Árboles 3D (generados por código) ---------- */
const trees=[],props=[];
function castAndReceive(m){sg.addShadowCaster(m);m.receiveShadows=true;}
function buildTree(seed,x,z,scale,tint){
  const rnd=P.mulberry32(seed),parts=[],spots=[];
  const root=new B.TransformNode("tree"+seed,scene);
  root.position.set(x,groundY(x,z)-.15,z);root.scaling.setAll(scale);
  function branch(start,dir,len,rad,depth){
    const n=6,pts=[];let p=start.clone(),d=dir.clone();
    for(let i=0;i<=n;i++){
      pts.push(p.clone());
      d=d.add(new V3((rnd()-.5)*.35,(rnd()-.5)*.2+.03,(rnd()-.5)*.35)).normalize();
      p=p.add(d.scale(len/n));
    }
    const r0=rad,r1=Math.max(.03,rad*.55);
    parts.push(B.MeshBuilder.CreateTube("br",{path:pts,radiusFunction:i=>r0+(r1-r0)*(i/n),tessellation:depth>=3?10:6,cap:B.Mesh.CAP_ALL},scene));
    if(depth===0){spots.push(pts[n].clone());return;}
    for(let k=0;k<3;k++){
      const base=pts[2+Math.floor(rnd()*(n-2))],ang=rnd()*Math.PI*2,sp=.7+rnd()*.5;
      const nd=new V3(Math.cos(ang)*sp,.55+rnd()*.5,Math.sin(ang)*sp).add(d.scale(.3)).normalize();
      branch(base,nd,len*(.68+rnd()*.12),rad*.55,depth-1);
    }
  }
  branch(new V3(0,0,0),new V3(0,1,0),3.2,.34,3);
  const bark=B.Mesh.MergeMeshes(parts,true,true);bark.material=barkMat;bark.parent=root;castAndReceive(bark);
  const dark=P.mix3([34,92,40],tint[0],.5),light=P.mix3([120,180,60],tint[1],.5),lparts=[];
  for(const s of spots){
    const r=1+rnd()*.5;
    const ico=B.MeshBuilder.CreateIcoSphere("lf",{radius:r,subdivisions:3,updatable:true},scene);
    const pp=ico.getVerticesData(B.VertexBuffer.PositionKind),cols=[];
    for(let i=0;i<pp.length;i+=3){
      const n=P.noise3(pp[i]*1.6+seed,pp[i+1]*1.6,pp[i+2]*1.6),k=1+(n-.5)*.7,top=P.smooth(-r,r,pp[i+1]);
      pp[i]*=k;pp[i+1]*=k*.85;pp[i+2]*=k;
      const g=P.mix3(dark,light,Math.min(1,Math.max(0,.2+top*.6+(n-.5)*.6)));
      cols.push(g[0]/255,g[1]/255,g[2]/255,1);
    }
    ico.updateVerticesData(B.VertexBuffer.PositionKind,pp);
    const nn=[];B.VertexData.ComputeNormals(pp,ico.getIndices(),nn);ico.updateVerticesData(B.VertexBuffer.NormalKind,nn);
    ico.setVerticesData(B.VertexBuffer.ColorKind,cols);
    ico.position.copyFrom(s);lparts.push(ico);
  }
  const leaves=B.Mesh.MergeMeshes(lparts,true,true);leaves.material=leafMat;leaves.parent=root;castAndReceive(leaves);
  trees.push({root,leaves,phase:rnd()*6.28});
  return root;
}

/* ---------- Rocas con poros ---------- */
function buildRock(seed,x,z,r){
  const rnd=P.mulberry32(seed);
  const m=B.MeshBuilder.CreateIcoSphere("rock",{radius:1,subdivisions:5,updatable:true},scene);
  const pp=m.getVerticesData(B.VertexBuffer.PositionKind);
  for(let i=0;i<pp.length;i+=3){
    const a=pp[i],b=pp[i+1],c=pp[i+2];
    const n=P.noise3(a*1.4+seed,b*1.4,c*1.4),rg=Math.abs(P.noise3(a*3+seed,b*3,c*3)-.5);
    const k=.75+n*.5-rg*.25;pp[i]=a*k*1.2;pp[i+1]=b*k*.7;pp[i+2]=c*k;
  }
  m.updateVerticesData(B.VertexBuffer.PositionKind,pp);
  const nn=[];B.VertexData.ComputeNormals(pp,m.getIndices(),nn);m.updateVerticesData(B.VertexBuffer.NormalKind,nn);
  m.scaling.setAll(r);m.position.set(x,groundY(x,z)+r*.15,z);m.rotation.y=rnd()*6.28;
  m.material=rockMat;castAndReceive(m);props.push(m);return m;
}

/* ---------- Capas 2D con profundidad (2.5D) ---------- */
const layers=[];
const SPRITE_TINT={day:new C3(1,1,1),dusk:new C3(1,.72,.55),night:new C3(.35,.42,.7)};
let tintNow=SPRITE_TINT.day;
function addSprite(asset,x,z,h){
  const ar=asset.w/asset.h;
  const p=B.MeshBuilder.CreatePlane("sp",{width:h*ar,height:h},scene);
  p.position.set(x,groundY(x,z)+h/2-.3,z);
  const m=new B.StandardMaterial("spm",scene),t=new B.Texture(asset.src,scene);
  t.hasAlpha=true;m.diffuseTexture=t;m.emissiveTexture=t;m.useAlphaFromDiffuseTexture=true;
  m.disableLighting=true;m.backFaceCulling=false;m.emissiveColor=tintNow.clone();
  p.material=m;layers.push(p);return p;
}
const byName=(cat,n)=>(A[cat]||[]).find(a=>a.name===n)||(A[cat]||[])[0];
/* Fondo lejano */
const backMat=new B.StandardMaterial("backM",scene);backMat.disableLighting=true;backMat.fogEnabled=false;backMat.backFaceCulling=false;
const backdrop=B.MeshBuilder.CreatePlane("backdrop",{width:230,height:130},scene);
backdrop.position.set(0,28,115);backdrop.material=backMat;
function setBackdrop(name){
  const a=byName("bg",name);if(!a)return;
  if(window.Scenery&&window.__userBd===false)Scenery.clear();
  const t=new B.Texture(a.src,scene);
  if(backMat.emissiveTexture)backMat.emissiveTexture.dispose();
  backMat.emissiveTexture=t;backMat.diffuseColor=new C3(0,0,0);backMat.specularColor=new C3(0,0,0);
}

/* ---------- Efectos de cine ---------- */
let pipe=null;
try{
  pipe=new B.DefaultRenderingPipeline("cine",true,scene,[cam]);
  pipe.fxaaEnabled=true;
  pipe.bloomEnabled=true;pipe.bloomThreshold=.72;pipe.bloomWeight=.35;pipe.bloomKernel=48;pipe.bloomScale=.5;
  pipe.depthOfFieldEnabled=true;pipe.depthOfFieldBlurLevel=B.DepthOfFieldEffectBlurLevel.Medium;
  pipe.depthOfField.focalLength=60;pipe.depthOfField.fStop=3.2;pipe.depthOfField.focusDistance=18000;
  pipe.imageProcessingEnabled=true;
  const ip=pipe.imageProcessing;
  ip.toneMappingEnabled=true;ip.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;
  ip.exposure=1.05;ip.contrast=1.15;ip.vignetteEnabled=true;ip.vignetteWeight=1.8;
  pipe.sharpenEnabled=true;pipe.sharpen.edgeAmount=.25;
}catch(err){say("Los efectos de cine no están disponibles en este modo ("+err.message+").");}
/* ---------- Momentos del día ---------- */
const PRESETS={
  dia:{clear:[.62,.82,.96],fog:.0045,hemi:[.75,.82,.95],hemiG:[.32,.3,.24],hI:.75,sun:[1,.96,.86],sI:2.4,dir:[-.5,-1,.6],bg:"Mediodía brillante",tint:"day",bloom:.3,leaf:[[34,92,40],[120,180,60]]},
  atardecer:{clear:[.99,.66,.4],fog:.006,hemi:[.95,.72,.6],hemiG:[.3,.2,.2],hI:.6,sun:[1,.58,.3],sI:2.1,dir:[-1,-.35,.4],bg:"Atardecer en el bosque",tint:"dusk",bloom:.5,leaf:[[60,86,30],[200,150,50]]},
  noche:{clear:[.04,.07,.18],fog:.008,hemi:[.25,.32,.6],hemiG:[.05,.06,.12],hI:.55,sun:[.55,.65,1],sI:.9,dir:[.4,-1,.5],bg:"Noche de luna llena",tint:"night",bloom:.8,leaf:[[16,50,40],[50,100,90]]}
};
function setPreset(k){
  const p=PRESETS[k];
  scene.clearColor=new B.Color4(p.clear[0],p.clear[1],p.clear[2],1);
  scene.fogColor=new C3(p.clear[0],p.clear[1],p.clear[2]);scene.fogDensity=p.fog;
  hemi.diffuse=new C3(...p.hemi);hemi.groundColor=new C3(...p.hemiG);hemi.intensity=p.hI;
  sun.diffuse=new C3(...p.sun);sun.intensity=p.sI;sun.direction=new V3(...p.dir);
  tintNow=SPRITE_TINT[p.tint];for(const l of layers)l.material.emissiveColor=tintNow.clone();
  if(!window.__userBd)setBackdrop(p.bg);
  if(pipe)pipe.bloomWeight=p.bloom;
  $("sBloom").value=Math.round(p.bloom*100);$("sFog").value=Math.round(p.fog*5000);
  for(const b of document.querySelectorAll("[data-pre]"))b.classList.toggle("on",b.dataset.pre===k);
}

/* ---------- Poblar el mundo ---------- */
let seedBase=7;
function clearWorld(){
  for(const t of trees){t.root.getChildren().forEach(c=>c.dispose());t.root.dispose();}
  trees.length=0;for(const m of props)m.dispose();props.length=0;
  for(const l of layers){l.material.dispose();l.dispose();}layers.length=0;
}
function populate(){
  for(const t of trees){t.root.getChildren().forEach(c=>c.dispose());t.root.dispose();}
  trees.length=0;for(const m of props)m.dispose();props.length=0;
  for(const l of layers){l.material.dispose();l.dispose();}layers.length=0;
  const rnd=P.mulberry32(seedBase);
  const tints=[[[40,100,40],[130,190,60]],[[60,110,30],[190,200,70]],[[90,80,30],[220,150,50]]];
  const pts=[[-9,6],[-4.5,12],[8,9],[11,17],[-13,18],[4,22],[-6,26],[14,26]];
  pts.forEach((p,i)=>buildTree(seedBase*10+i,p[0]+(rnd()-.5)*2,p[1]+(rnd()-.5)*2,.9+rnd()*.5,tints[i%3]));
  for(let i=0;i<9;i++)buildRock(seedBase*20+i,(rnd()-.5)*22,3+rnd()*18,.35+rnd()*.7);
  const names=["Pino","Roble","Arbusto","Pino","Roble"];
  for(let i=0;i<16;i++){
    const a=byName("arbol",names[i%names.length]);if(!a)continue;
    addSprite(a,(rnd()-.5)*110,36+rnd()*44,12+rnd()*8);
  }
}

/* ---------- Animación: viento y recorrido de cámara ---------- */
let wind=1,orbit=false,t0=performance.now();
scene.onBeforeRenderObservable.add(()=>{
  const t=(performance.now()-t0)/1000;
  for(const tr of trees){
    tr.root.rotation.z=Math.sin(t*.8+tr.phase)*.012*wind;
    tr.root.rotation.x=Math.cos(t*.6+tr.phase)*.008*wind;
    tr.leaves.rotation.z=Math.sin(t*2.1+tr.phase)*.018*wind;
  }
  if(orbit){cam.alpha=-Math.PI/2+Math.sin(t*.25)*.4;cam.radius=17+Math.sin(t*.17)*3;}
});

/* ---------- Importar modelos 3D y capas 2D ---------- */
async function importGLB(file){
  say("Abriendo "+file.name+"…");
  let res=null;
  try{res=await B.SceneLoader.ImportMeshAsync("","file:",file,scene);}
  catch(e1){
    try{res=await B.SceneLoader.ImportMeshAsync("","",URL.createObjectURL(file),scene,null,".glb");}
    catch(e2){say("No pude abrir ese modelo: "+(e2.message||e2));return;}
  }
  const root=res.meshes[0];let mn=new V3(1e9,1e9,1e9),mx=new V3(-1e9,-1e9,-1e9);
  for(const m of res.meshes){
    if(!m.getBoundingInfo||!m.getTotalVertices||!m.getTotalVertices())continue;
    m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;
    mn=V3.Minimize(mn,bb.minimumWorld);mx=V3.Maximize(mx,bb.maximumWorld);
  }
  const h=Math.max(.001,mx.y-mn.y),k=3/h;
  root.scaling.scaleInPlace(k);root.position.set(0,groundY(0,6)-mn.y*k,6);
  for(const m of res.meshes)if(m.getTotalVertices&&m.getTotalVertices()){sg.addShadowCaster(m);m.receiveShadows=true;}
  res.animationGroups.forEach((g,i)=>{if(i===0)g.start(true);else g.stop();});
  say("Modelo cargado: "+file.name+(res.animationGroups.length?" · con "+res.animationGroups.length+" animación(es)":""));
}
function importLayer(file){
  const fr=new FileReader();
  fr.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const z=+$("sDepth").value,h=+$("sLayerH").value;
      addSprite({src:fr.result,w:im.naturalWidth||1,h:im.naturalHeight||1},(Math.random()-.5)*20,z,h);
      say("Capa 2D agregada a "+z+" m de distancia.");
    };
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- Interfaz ---------- */
for(const b of document.querySelectorAll("[data-pre]"))b.onclick=()=>setPreset(b.dataset.pre);
const bind=(id,fn)=>{const e=$(id);e.oninput=()=>fn(+e.value);};
bind("sBloom",v=>{if(pipe)pipe.bloomWeight=v/100;});
bind("sBlur",v=>{if(!pipe)return;pipe.depthOfFieldEnabled=v>0;if(v>0)pipe.depthOfField.fStop=8-v*.065;});
bind("sFocus",v=>{if(pipe)pipe.depthOfField.focusDistance=v*1000;});
bind("sExp",v=>{if(pipe)pipe.imageProcessing.exposure=v/100;});
bind("sFog",v=>{scene.fogDensity=v/5000;});
bind("sWind",v=>{wind=v/50;});
bind("sFov",v=>{cam.fov=v*Math.PI/180;});
if($("bOrbit"))$("bOrbit").onclick=e=>{orbit=!orbit;e.target.classList.toggle("on",orbit);};
if($("bGPU"))$("bGPU").textContent=backend==="WebGPU"?"Volver a WebGL2":"Probar WebGPU";
if($("bGPU"))$("bGPU").onclick=()=>{try{localStorage.setItem("atr2_gpu",backend==="WebGPU"?"0":"1");location.reload();}catch(e){say("Este visor no permite cambiar de motor.");}};

$("bShot").onclick=()=>{
  try{
    B.Tools.CreateScreenshotUsingRenderTarget(engine,cam,{width:1920,height:1080},data=>{
      $("shotImg").src=data;$("shot").hidden=false;
    });
  }catch(e){say("No pude sacar la foto: "+e.message);}
};
$("shotClose").onclick=()=>{$("shot").hidden=true;};

/* ---------- Arranque ---------- */
setPreset("dia");
engine.runRenderLoop(()=>scene.render());
window.addEventListener("resize",()=>engine.resize());
let infoT=0;
scene.onAfterRenderObservable.add(()=>{
  const n=performance.now();if(n-infoT<800)return;infoT=n;
  $("info").textContent=backend+" · "+Math.round(engine.getFps())+" fps · "+scene.getActiveMeshes().length+" mallas";
});
say("Listo. Arrastra para girar la cámara; rueda o pellizco para acercar.");
function setGround(k){
  const T={pasto:[1,1,1],arena:[1.25,.95,.55],nieve:[1.3,1.35,1.5],tierra:[.9,.62,.4],roca:[.8,.8,.85]};
  if(k==="ninguno"){ground.isVisible=false;return;}
  ground.isVisible=true;const c=T[k]||T.pasto;ground.material.albedoColor=new C3(c[0],c[1],c[2]);
}
function setBackdropOn(on){backdrop.isVisible=on;}
function setBackdropImage(src){
  if(window.Scenery)Scenery.clear();
  const t=new B.Texture(src,scene);if(backMat.emissiveTexture)backMat.emissiveTexture.dispose();
  backMat.emissiveTexture=t;backMat.diffuseColor=new C3(0,0,0);backMat.specularColor=new C3(0,0,0);backdrop.isVisible=true;
}
window.__atr2={scene,engine,cam,B,sg,groundY,ground,barkMat,rockMat,say,clear:clearWorld,setPreset,setBackdrop,setBackdropImage,setBackdropOn,setGround,A,SPRITE:()=>tintNow,pipe};
})();
