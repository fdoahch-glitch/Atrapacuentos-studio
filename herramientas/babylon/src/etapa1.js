/* Etapa 1 · escena híbrida 2D + 2,5D + 3D con Babylon.js (WebGPU con respaldo a WebGL2).
   Solo prueba: no toca el programa. Todo es función del tiempo t, así la exportación a MP4 sale idéntica a la vista. */
import {
  Engine, WebGPUEngine, Scene, FreeCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, ShadowGenerator,
  MeshBuilder, StandardMaterial, Material, DynamicTexture, Texture, TransformNode, DefaultRenderingPipeline,
  ParticleSystem, GPUParticleSystem, ImageProcessingConfiguration, DepthOfFieldEffectBlurLevel
} from "@babylonjs/core";
import {ShadowOnlyMaterial} from "@babylonjs/materials/shadowOnly";

const D0=1000;                         /* distancia de la cámara al plano de trabajo: ahí 1 unidad = 1 unidad de escena */
const UW=1280,UH=720;                  /* la escena mide 1280×720 unidades y se dibuja a la resolución elegida */
let W=1280,H=720,SX=1;

function texDeCanvas(scene,cv,nombre){
  const t=new DynamicTexture(nombre,{width:cv.width,height:cv.height},scene,true,Texture.TRILINEAR_SAMPLINGMODE);
  const g=t.getContext();g.clearRect(0,0,cv.width,cv.height);g.drawImage(cv,0,0);t.hasAlpha=true;t.anisotropicFilteringLevel=8;t.update(true);return t;
}
function matPlano(scene,tex,nombre){
  const m=new StandardMaterial(nombre,scene);m.diffuseTexture=tex;m.useAlphaFromDiffuseTexture=true;m.disableLighting=true;m.emissiveColor=Color3.White();
  m.backFaceCulling=false;m.transparencyMode=Material.MATERIAL_ALPHATESTANDBLEND;m.alphaCutOff=.5;return m;
}
function cuerpo(scene,nombre,mesh,color){const m=new StandardMaterial(nombre,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(.12,.12,.12);mesh.material=m;return mesh;}

/* personaje 3D de prueba hecho con formas simples (en el programa será un modelo .glb con esqueleto) */
function crearNino(scene,sombra){
  const raiz=new TransformNode("nino",scene),cap=[];
  const hips=new TransformNode("hips",scene);hips.parent=raiz;hips.position.y=105;
  const torso=cuerpo(scene,"torso",MeshBuilder.CreateCapsule("torso",{height:115,radius:34,tessellation:24,capSubdivisions:6},scene),"#6fbf5a");torso.parent=hips;torso.position.y=62;
  const cabeza=new TransformNode("cabeza",scene);cabeza.parent=hips;cabeza.position.y=150;
  const cara=cuerpo(scene,"cara",MeshBuilder.CreateSphere("cara",{diameter:78,segments:24},scene),"#f3c9a0");cara.parent=cabeza;cara.position.y=30;
  const sombrero=cuerpo(scene,"sombrero",MeshBuilder.CreateCylinder("sombrero",{height:26,diameterTop:56,diameterBottom:60,tessellation:32},scene),"#d9b878");sombrero.parent=cabeza;sombrero.position.y=62;
  const ala=cuerpo(scene,"ala",MeshBuilder.CreateCylinder("ala",{height:5,diameter:104,tessellation:40},scene),"#d9b878");ala.parent=cabeza;ala.position.y=50;
  for(const sx of [-1,1]){
    const ojo=cuerpo(scene,"ojo",MeshBuilder.CreateSphere("ojo",{diameter:11},scene),"#1a1410");ojo.parent=cabeza;ojo.position.set(sx*13,34,-34);cap.push(ojo);
    const mejilla=cuerpo(scene,"mej",MeshBuilder.CreateSphere("mej",{diameter:11},scene),"#f29a8a");mejilla.parent=cabeza;mejilla.position.set(sx*23,24,-31);cap.push(mejilla);
  }
  const bra={},pie={};
  for(const [lado,sx] of [["i",-1],["d",1]]){
    const br=new TransformNode("br"+lado,scene);br.parent=hips;br.position.set(sx*46,106,0);
    const bm=cuerpo(scene,"bm"+lado,MeshBuilder.CreateCapsule("bm"+lado,{height:84,radius:11,tessellation:16},scene),"#f3c9a0");bm.parent=br;bm.position.y=-38;bra[lado]=br;cap.push(bm);
    const pi=new TransformNode("pi"+lado,scene);pi.parent=hips;pi.position.set(sx*18,8,0);
    const pm=cuerpo(scene,"pm"+lado,MeshBuilder.CreateCapsule("pm"+lado,{height:104,radius:15,tessellation:16},scene),"#b9a46a");pm.parent=pi;pm.position.y=-48;
    const zap=cuerpo(scene,"zap"+lado,MeshBuilder.CreateBox("zap"+lado,{width:26,height:14,depth:44},scene),"#5b3a22");zap.parent=pi;zap.position.set(0,-104,-8);pie[lado]=pi;cap.push(pm,zap);
  }
  cap.push(torso,cara,sombrero,ala);
  for(const m of cap){sombra.addShadowCaster(m);m.receiveShadows=false;}
  return {raiz,hips,cabeza,bra,pie};
}

export async function iniciar(canvas,op){
  op=op||{};const alto=op.res===1080?1080:720;W=alto*16/9;H=alto;SX=W/UW;const sin=new Set((op.sin||"").split(",").filter(Boolean));canvas.width=W;canvas.height=H;
  let engine,motor="webgl2";
  if(op.motor==="webgpu"){
    if(!navigator.gpu)throw new Error("WebGPU no está disponible en este navegador");
    engine=new WebGPUEngine(canvas,{antialias:false,adaptToDeviceRatio:false,powerPreference:"high-performance",enableAllFeatures:true,setMaximumLimits:false});
    await engine.initAsync();motor="webgpu";
  }else{
    engine=new Engine(canvas,false,{preserveDrawingBuffer:true,stencil:true,powerPreference:"high-performance",adaptToDeviceRatio:false},false);
  }
  engine.setSize(W,H);engine.setHardwareScalingLevel(1);
  const scene=new Scene(engine);scene.clearColor=new Color4(.43,.76,.93,1);scene.skipPointerMovePicking=true;
  const cam=new FreeCamera("cam",new Vector3(0,0,-D0),scene);cam.setTarget(new Vector3(0,0,0));cam.fov=2*Math.atan(UH/2/D0);cam.minZ=10;cam.maxZ=D0*200;
  const A=window.SerieArt,bgDef=A.BG.find(b=>b.id===(op.fondo||"pradera"));

  /* ---- 2,5D: capas de fondo a distintas profundidades; la velocidad de paralaje sale de pf ---- */
  const capas=[];
  if(!sin.has("capas"))bgDef.L.forEach((L,i)=>{
    const cv=document.createElement("canvas");cv.width=Math.round(2560*SX);cv.height=Math.round(UH*SX);
    const g=cv.getContext("2d");A.dibujarFondo(g,{id:bgDef.id+"_E1_"+i,L:[L]},SX,SX,1,SX,{x:0,y:0},undefined,2560);
    const pf=Math.max(L.pf,.012),esc=1/pf,z=D0*esc-D0;                  /* más lejos cuanto menor es pf */
    const p=MeshBuilder.CreatePlane("capa"+i,{width:2560*esc,height:UH*esc},scene);p.position.set(0,0,z);
    p.material=matPlano(scene,texDeCanvas(scene,cv,"capaT"+i),"capaM"+i);p.isPickable=false;capas.push({p,pf,z});
  });

  /* ---- 2D: decoración dibujada por el programa, como planos con transparencia ---- */
  const deco=[];
  const quiero=[["arbol",-470,0,1.1,"mecer"],["arbusto",-250,-30,1,"mecer"],["flores",150,-40,1,"mecer"],["arbusto",420,-20,1.2,"mecer"],["arbol",520,10,1,"mecer"],["pasto",-60,-45,1,"mecer"]];
  for(const [id,x,z,s,mov] of (sin.has("deco")?[]:quiero)){
    const sp=A.SP.find(q=>q.id===id);if(!sp)continue;const sp1=A.sprite(sp,2),
      nodo=new TransformNode("deco_"+id,scene);nodo.position.set(x,-290+(id==="arbol"?0:-10),z);
    const pl=MeshBuilder.CreatePlane("decoP_"+id,{width:sp1.wU*s,height:sp1.hU*s},scene);pl.parent=nodo;pl.position.set((sp1.wU/2-sp1.ax)*s,(sp1.ay-sp1.hU/2)*s,0);
    pl.material=matPlano(scene,texDeCanvas(scene,sp1.cv,"decoT_"+id),"decoM_"+id);pl.isPickable=false;deco.push({nodo,mov,ph:Math.random()*6.28,x});
  }
  for(const [x,y,s] of (sin.has("deco")?[]:[[-300,230,1.6],[330,270,1.2],[-540,300,.9]])){
    const sp=A.SP.find(q=>q.id==="nube"),sp1=A.sprite(sp,2),nodo=new TransformNode("nube",scene);nodo.position.set(x,y,200);
    const pl=MeshBuilder.CreatePlane("nubeP",{width:sp1.wU*s,height:sp1.hU*s},scene);pl.parent=nodo;pl.material=matPlano(scene,texDeCanvas(scene,sp1.cv,"nubeT"),"nubeM");deco.push({nodo,mov:"flotar",ph:x,x});
  }

  /* ---- luces y sombra ---- */
  const amb=new HemisphericLight("amb",new Vector3(0,1,-.3),scene);amb.intensity=.75;amb.groundColor=new Color3(.55,.6,.5);
  const sol=new DirectionalLight("sol",new Vector3(-.55,-1,.45),scene);sol.position=new Vector3(500,700,-500);sol.intensity=.9;sol.diffuse=new Color3(1,.96,.85);
  const sg=sin.has("sombra")?{addShadowCaster(){},getShadowMap(){return {refreshRate:0};}}:new ShadowGenerator(2048,sol);if(!sin.has("sombra")){sg.usePercentageCloserFiltering=true;sg.filteringQuality=ShadowGenerator.QUALITY_HIGH;sg.bias=.5;sg.normalBias=.5;sg.darkness=.25;}
  const suelo=MeshBuilder.CreateGround("suelo",{width:2600,height:1400},scene);suelo.position.set(0,-290,-250);
  if(!sin.has("sombra")){const sm=new ShadowOnlyMaterial("sombraM",scene);sm.activeLight=sol;sm.alpha=.5;suelo.material=sm;suelo.receiveShadows=true;}else suelo.setEnabled(false);suelo.isPickable=false;
  const nino=crearNino(scene,sg);nino.raiz.position.set(-300,-290,-70);nino.raiz.scaling.setAll(1);

  /* ---- partículas en GPU: luciérnagas ---- */
  const pc=document.createElement("canvas");pc.width=pc.height=64;{const g=pc.getContext("2d"),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"rgba(255,250,200,1)");r.addColorStop(.35,"rgba(255,230,120,.55)");r.addColorStop(1,"rgba(255,230,120,0)");g.fillStyle=r;g.fillRect(0,0,64,64);}
  const ptex=texDeCanvas(scene,pc,"luz");
  let particulas=null,tipoPart="ninguno";
  try{
    const usarGPU=GPUParticleSystem.IsSupported;
    particulas=usarGPU?new GPUParticleSystem("luciernagas",{capacity:700},scene):new ParticleSystem("luciernagas",700,scene);tipoPart=usarGPU?"GPU":"CPU";
  }catch(e){particulas=new ParticleSystem("luciernagas",700,scene);tipoPart="CPU";}
  particulas.particleTexture=ptex;particulas.emitter=new Vector3(0,-100,-100);particulas.minEmitBox=new Vector3(-700,-150,-200);particulas.maxEmitBox=new Vector3(700,300,300);
  particulas.color1=new Color4(1,.95,.5,1);particulas.color2=new Color4(.8,1,.6,1);particulas.colorDead=new Color4(1,.9,.4,0);
  particulas.minSize=10;particulas.maxSize=26;particulas.minLifeTime=3;particulas.maxLifeTime=7;particulas.emitRate=110;particulas.blendMode=ParticleSystem.BLENDMODE_ADD;
  particulas.gravity=new Vector3(0,3,0);particulas.direction1=new Vector3(-12,8,-6);particulas.direction2=new Vector3(12,24,6);particulas.minEmitPower=3;particulas.maxEmitPower=10;particulas.updateSpeed=.02;
  particulas.preWarmCycles=120;particulas.preWarmStepOffset=1;if(!sin.has("part"))particulas.start();

  /* ---- postproceso en GPU ---- */
  let ip=null;const pipe=sin.has("pipe")?null:new DefaultRenderingPipeline("pipe",true,scene,[cam]);if(pipe){
  pipe.samples=4;pipe.fxaaEnabled=false;pipe.bloomEnabled=true;pipe.bloomThreshold=.8;pipe.bloomWeight=.32;pipe.bloomKernel=64;pipe.bloomScale=.5;
  pipe.imageProcessingEnabled=true;ip=pipe.imageProcessing;ip.toneMappingEnabled=true;ip.toneMappingType=ImageProcessingConfiguration.TONEMAPPING_ACES;ip.exposure=1.05;ip.contrast=1.12;
  ip.vignetteEnabled=true;ip.vignetteWeight=2.2;ip.vignetteStretch=.4;ip.vignetteColor=new Color4(.05,.05,.1,0);
  pipe.grainEnabled=true;pipe.grain.intensity=5;pipe.grain.animated=true;
  pipe.depthOfFieldEnabled=true;pipe.depthOfFieldBlurLevel=DepthOfFieldEffectBlurLevel.Medium;
  var dof=pipe.depthOfField;dof.focalLength=50;dof.fStop=1.8;dof.focusDistance=(D0+70)*1000;dof.lensSize=50;}
  const ef={bloom:true,dof:true,vineta:true,grano:true,msaa:true,sombra:true,particulas:true,tono:true};
  function aplicar(){
    if(pipe){pipe.bloomEnabled=ef.bloom;pipe.depthOfFieldEnabled=ef.dof;ip.vignetteEnabled=ef.vineta;pipe.grainEnabled=ef.grano;pipe.samples=ef.msaa?4:1;ip.toneMappingEnabled=ef.tono;}
    sg.getShadowMap().refreshRate=ef.sombra?1:0;suelo.setEnabled(ef.sombra);
    if(ef.particulas){if(!particulas.isStarted())particulas.start();}else particulas.stop();
  }

  /* ---- todo en función del tiempo ---- */
  function poner(t){
    const pan=130*Math.sin(t*.32);cam.position.x=pan;cam.position.y=8*Math.sin(t*.21);cam.setTarget(new Vector3(pan,0,0));
    for(const c of capas){/* el paralaje sale solo de la perspectiva: las capas lejanas se mueven menos */}
    for(const d of deco){
      if(d.mov==="mecer")d.nodo.rotation.z=.035*Math.sin(t*1.4+d.ph);
      else if(d.mov==="flotar")d.nodo.position.x=d.x+22*Math.sin(t*.18+d.ph);
    }
    const u=t*.38,x=-300+620*(.5-.5*Math.cos(u)),dir=Math.sin(u)>0?1:-1,fase=t*7;
    nino.raiz.position.x=x;nino.raiz.rotation.y=dir*(Math.PI/2-.45);
    nino.hips.position.y=105+Math.abs(Math.sin(fase))*7;nino.cabeza.rotation.z=Math.sin(fase)*.04;nino.hips.rotation.z=Math.sin(fase)*.03;
    nino.pie.i.rotation.x=Math.sin(fase)*.75;nino.pie.d.rotation.x=-Math.sin(fase)*.75;
    nino.bra.i.rotation.x=-Math.sin(fase)*.6;nino.bra.d.rotation.x=Math.sin(fase)*.6;
  }
  if(op.apagar)for(const k of Object.keys(ef))ef[k]=false;
  aplicar();poner(0);
  return {engine,scene,motor,tipoPart,ef,aplicar,poner,pipe,dof,W,H};
}
window.Etapa1={iniciar,Engine,WebGPUEngine};
