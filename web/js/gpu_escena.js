/* Atrapacuentos Studio · compositor GPU (Babylon.js).
   Dibuja el fondo, la decoración y las imágenes directamente en la tarjeta de video, con la MISMA matemática que el dibujo clásico
   (posición, zoom, paralaje, giro, opacidad), así que se ve igual. Todo lo que aún no tiene camino propio en GPU (personajes, relieve,
   desenfoque de profundidad, GIF animados) se dibuja con el código de siempre en un lienzo 2D y se sube como una textura a pantalla completa,
   en el orden de profundidad que le toca. Si algo falla, el programa vuelve solo al dibujo clásico.
   Preferencia guardada: "2d" (clásico) | "webgl2" | "webgpu". */
(function(){
"use strict";
const LS="atr_motor_grafico";
let tmrPend=0;const G={pendientes:0,activo:false,motor:"2d",estado:"apagado",canvas:null,W:0,H:0,fallo:"",ultimoMs:0};
let B=null,E=null,scene=null,cam=null,api=null;
const texs=new Map(),mats=new Map(),capasBg=new Map(),quads=[],prox=[];let usados=0,usadosProx=0,cnt=0;
const pref=()=>{try{return localStorage.getItem(LS)||"2d";}catch(e){return "2d";}};
const guardar=v=>{try{localStorage.setItem(LS,v);}catch(e){}};

/* ---------- texturas y materiales ---------- */
function texDeCanvas(key,cv,mip){
  let t=texs.get(key);if(t)return t;
  t=new B.DynamicTexture("t_"+key,{width:cv.width,height:cv.height},scene,!!mip,mip?B.Texture.TRILINEAR_SAMPLINGMODE:B.Texture.BILINEAR_SAMPLINGMODE);
  const g=t.getContext();g.clearRect(0,0,cv.width,cv.height);g.drawImage(cv,0,0);t.hasAlpha=true;if(mip)t.anisotropicFilteringLevel=8;t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;t.update(true);
  texs.set(key,t);return t;
}
function matDe(key,tex){
  let m=mats.get(key);if(m)return m;
  m=new B.StandardMaterial("m_"+key,scene);m.diffuseTexture=tex;m.useAlphaFromDiffuseTexture=true;m.disableLighting=true;m.emissiveColor=B.Color3.White();
  m.backFaceCulling=false;m.transparencyMode=B.Material.MATERIAL_ALPHABLEND;m.disableDepthWrite=true;m.freeze&&0;mats.set(key,m);return m;
}
/* un plano reutilizable por cada elemento dibujado en el cuadro */
function plano(){
  let q=quads[usados];
  if(!q){q=B.MeshBuilder.CreatePlane("q"+usados,{size:1},scene);q.isPickable=false;q.doNotSyncBoundingInfo=true;q.alwaysSelectAsActiveMesh=true;quads.push(q);}
  usados++;q.setEnabled(true);return q;
}
/* coloca un plano: centro (cx,cy) en píxeles de lienzo (y hacia abajo), tamaño w×h, giro en radianes (horario, como el Canvas 2D) */
function ubicar(q,mat,cx,cy,w,h,rot,op,orden){
  q.material=mat;q.position.set(cx-G.W/2,G.H/2-cy,0);q.scaling.set(w,h,1);q.rotation.z=-(rot||0);q.visibility=op==null?1:op;q.alphaIndex=cnt++;
}
/* camino de respaldo: el elemento se dibuja con el código clásico en un lienzo 2D del tamaño del cuadro y se sube como textura */
function proxy(){
  let p=prox[usadosProx];
  if(!p){const t=new B.DynamicTexture("prox"+usadosProx,{width:G.W,height:G.H},scene,false,B.Texture.BILINEAR_SAMPLINGMODE);t.hasAlpha=true;t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;
    p={t,m:matDe("prox"+usadosProx,t)};prox.push(p);}
  else if(p.t.getSize().width!==G.W||p.t.getSize().height!==G.H){p.t.dispose();const t=new B.DynamicTexture("prox"+usadosProx,{width:G.W,height:G.H},scene,false,B.Texture.BILINEAR_SAMPLINGMODE);t.hasAlpha=true;t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;mats.delete("prox"+usadosProx);p.t=t;p.m=matDe("prox"+usadosProx,t);}
  usadosProx++;return p;
}
function aProxy(sc,it,t,cam0,sx,orden,opt){
  const p=proxy(),g=p.t.getContext();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,G.W,G.H);
  api.drawItem(g,sc,it,t,cam0,sx,opt);p.t.update(true);
  const q=plano();ubicar(q,p.m,G.W/2,G.H/2,G.W,G.H,0,1,orden);
}
function aProxyFondo(sc,cam1,sx,t,orden){
  const p=proxy(),g=p.t.getContext();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,G.W,G.H);
  api.drawBg(g,sc,cam1,sx,t);p.t.update(true);
  const q=plano();ubicar(q,p.m,G.W/2,G.H/2,G.W,G.H,0,1,orden);
}

/* tinte de «atardecer» y «noche»: un degradado que multiplica los colores de todo lo dibujado (igual que en el dibujo clásico) */
function matHora(h){
  const key="hora:"+h;let m=mats.get(key);if(m)return m;
  const cv=document.createElement("canvas");cv.width=4;cv.height=256;const g=cv.getContext("2d"),gr=g.createLinearGradient(0,0,0,256);
  if(h==="tarde"){gr.addColorStop(0,"#ffb98a");gr.addColorStop(1,"#ffe0b8");}else{gr.addColorStop(0,"#5a6aa8");gr.addColorStop(1,"#7a86bc");}
  g.fillStyle=gr;g.fillRect(0,0,4,256);
  const t=new B.DynamicTexture("t_"+key,{width:4,height:256},scene,false,B.Texture.BILINEAR_SAMPLINGMODE);t.getContext().drawImage(cv,0,0);t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;t.update(true);texs.set(key,t);
  m=new B.StandardMaterial("m_"+key,scene);m.diffuseTexture=t;m.disableLighting=true;m.emissiveColor=B.Color3.White();m.backFaceCulling=false;m.disableDepthWrite=true;
  m.transparencyMode=B.Material.MATERIAL_ALPHABLEND;m.alphaMode=B.Constants.ALPHA_MULTIPLY;mats.set(key,m);return m;
}

/* ---------- fondo ---------- */
function resCapa(){return Math.max(1,Math.min(2,G.W/api.UW()*1.5));}
function capasDe(bg){
  const res=resCapa(),key=bg.id+"@"+res.toFixed(2);let c=capasBg.get(key);if(c)return c;
  const A=api.A;c=[];
  bg.L.forEach((L,i)=>{
    const cv=document.createElement("canvas");cv.width=Math.round(A.BW*res);cv.height=Math.round(A.BH*res);
    A.dibujarFondo(cv.getContext("2d"),{id:bg.id+"_gpu"+i,L:[L]},res,res,1,res,{x:0,y:0},undefined,A.BW);
    const k=key+"#"+i,tex=texDeCanvas(k,cv,true);c.push({L,mat:matDe(k,tex)});
  });
  capasBg.set(key,c);return c;
}
function dibujarFondo(sc,cam1,sx,t){
  const f=sc.fondo||{},cx=api.UW()/2,z=cam1.z;let orden=0;
  if(f.img){
    const o=api.IMG()[f.img];
    if(f.rel||!o||!o.ok){aProxyFondo(sc,cam1,sx,t,orden++);return orden;}
    const im=o.img,k=Math.max(api.UW()/im.width,api.UH()/im.height)*1.2,w=im.width*k,h=im.height*k;
    const key="fimg:"+f.img,cv=imgCanvas(im);const tex=texDeCanvas(key,cv,true),mat=matDe(key,tex);
    const q=plano(),ux=cx-cam1.x*.3;ubicar(q,mat,((ux-cx)*z+cx)*sx,360*sx,w*sx*z,h*sx*z,0,1,orden++);return orden;
  }
  if(f.id==="blanco"){scene.clearColor=B.Color4.FromHexString((f.color||"#ffffff").slice(0,7)+"ff");return orden;}
  scene.clearColor=new B.Color4(0,0,0,0);
  const bg=api.BGS[f.id]||api.A.BG[0],A=api.A;
  for(const c of capasDe(bg)){
    const pf=c.L.pf,q=plano(),ux=cx-cam1.x*pf,uy=A.BH/2-cam1.y*pf*.5;
    ubicar(q,c.mat,((ux-cx)*z+cx)*sx,((uy-360)*z+360)*sx,A.BW*sx*z,A.BH*sx*z,0,1,orden++);
  }
  return orden;
}
const IC=new WeakMap();
function imgCanvas(im){
  if(typeof HTMLCanvasElement!=="undefined"&&im instanceof HTMLCanvasElement)return im;
  let c=IC.get(im);if(c)return c;
  const k=Math.min(1,4096/Math.max(im.width,im.height));c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
  c.getContext("2d").drawImage(im,0,0,c.width,c.height);IC.set(im,c);return c;
}

/* ---------- personajes nativos en GPU ---------- */
const piezasMesh=new WeakMap(),usoPz=new Map(),todosPz=[],idImg=new WeakMap();let nImg=0,matElip=null;
const idDe=im=>{let i=idImg.get(im);if(!i){i=++nImg;idImg.set(im,i);}return i;};
function imagenDe(p,key){return key===""?p._im:key==="2"?p._im2:(p._ima&&p._ima[key.slice(2)]);}
function matPieza(p,key,oscura){
  const im=imagenDe(p,key);if(!im)return null;const id=idDe(im),k="pz:"+id+(oscura?":"+oscura:"");let m=mats.get(k);if(m)return m;
  const tk="pzt:"+id,tex=texDeCanvas(tk,imgCanvas(im),true);
  m=new B.StandardMaterial("m_"+k,scene);m.diffuseTexture=tex;m.useAlphaFromDiffuseTexture=true;m.disableLighting=true;
  m.emissiveColor=oscura?B.Color3.FromHexString(oscura):B.Color3.White();m.backFaceCulling=false;m.transparencyMode=B.Material.MATERIAL_ALPHABLEND;m.disableDepthWrite=true;
  mats.set(k,m);return m;
}
function matElipse(){
  if(matElip)return matElip;
  const cv=document.createElement("canvas");cv.width=cv.height=128;const g=cv.getContext("2d"),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,"rgba(15,35,20,1)");gr.addColorStop(.6,"rgba(15,35,20,.7)");gr.addColorStop(1,"rgba(15,35,20,0)");g.fillStyle=gr;g.fillRect(0,0,128,128);
  matElip=matDe("elipse",texDeCanvas("elipse",cv,false));return matElip;
}
function entradaPieza(p,ms){
  let arr=piezasMesh.get(p);if(!arr){arr=[];piezasMesh.set(p,arr);}
  const n=usoPz.get(p)||0;usoPz.set(p,n+1);let e=arr[n];
  if(!e||e.nv!==ms.nv){
    const nv=ms.nv,uv=new Float32Array(nv*2);for(let i=0;i<nv;i++){uv[i*2]=ms.uv[i*2];uv[i*2+1]=1-ms.uv[i*2+1];}
    const m=new B.Mesh("pz",scene),vd=new B.VertexData();vd.positions=new Float32Array(nv*3);vd.indices=Array.from(ms.idx);vd.uvs=uv;vd.colors=new Float32Array(nv*4).fill(1);vd.applyToMesh(m,true);
    m.isPickable=false;m.alwaysSelectAsActiveMesh=true;m.doNotSyncBoundingInfo=true;m.hasVertexAlpha=false;
    e={mesh:m,sh:null,nv,pos:new Float32Array(nv*3),xy:new Float32Array(nv*2),col:new Float32Array(nv*4).fill(1),spos:new Float32Array(nv*3)};arr[n]=e;todosPz.push(e);
  }
  return e;
}
function sombraMalla(e){
  if(e.sh)return e.sh;
  const m=new B.Mesh("pzs",scene),vd=new B.VertexData(),nv=e.nv,src=e.mesh;
  vd.positions=new Float32Array(nv*3);vd.indices=Array.from(src.getIndices());vd.uvs=Array.from(src.getVerticesData(B.VertexBuffer.UVKind));vd.colors=new Float32Array(nv*4).fill(1);vd.applyToMesh(m,true);
  m.isPickable=false;m.alwaysSelectAsActiveMesh=true;m.doNotSyncBoundingInfo=true;m.hasVertexAlpha=true;
  /* la sombra de todas las piezas se junta en una sola silueta: con el stencil cada píxel se pinta una vez, así no se oscurece donde se cruzan */
  m.onBeforeDrawObservable.add(()=>{if(G.sinStencil)return;E.setStencilBuffer(true);E.setStencilMask(255);E.setStencilFunction(B.Constants.EQUAL);E.setStencilFunctionReference(0);E.setStencilOperationPass(B.Constants.INCR);});
  m.onAfterRenderObservable.add(()=>{E.setStencilBuffer(false);});
  e.sh=m;return m;
}
function actorNativo(def,RO,info){
  const R=api.Rig.partes(def,RO);if(!R)return;
  const {X,Y,ELL,giroSq,hora,sombra,sx,ht}=info,W=G.W,H=G.H,sq=giroSq<1;
  if(ELL){const q=plano();ubicar(q,matElipse(),ELL.cx,ELL.cy,ELL.sw*2,ELL.sh*2,0,ELL.al,0);}
  const lista=[];
  for(const r of R){
    const e=entradaPieza(r.p,r.ms),out=r.out,nv=e.nv;
    for(let i=0;i<nv;i++){let x=out[i*2];const y=out[i*2+1];if(sq)x=X+(x-X)*giroSq;e.xy[i*2]=x;e.xy[i*2+1]=y;e.pos[i*3]=x-W/2;e.pos[i*3+1]=H/2-y;e.pos[i*3+2]=0;}
    lista.push([r,e]);
  }
  if(sombra!=="suave"){
    const lk=hora==="tarde"?[1.0,.5,.4]:hora==="noche"?[.3,.3,.2]:[.35,.22,.34],oy=Y+2*sx,col=hora==="noche"?"#0a1020":"#0c1c12";
    for(const [r,e] of lista){
      const m=matPieza(r.p,r.key,col);if(!m)continue;const sh=sombraMalla(e),pos=e.spos,cl=e.col;
      for(let i=0;i<e.nv;i++){const x=e.xy[i*2],y=e.xy[i*2+1],dx=x-X,dy=y-oy;pos[i*3]=X+dx-lk[0]*dy-W/2;pos[i*3+1]=H/2-(oy+lk[1]*dy);pos[i*3+2]=0;
        const f=Math.max(0,Math.min(1,(Y-y)/Math.max(1,ht)));cl[i*4+3]=1+(.2-1)*f;}
      sh.updateVerticesData(B.VertexBuffer.PositionKind,pos);sh.updateVerticesData(B.VertexBuffer.ColorKind,cl);
      sh.material=m;sh.visibility=lk[2];sh.alphaIndex=cnt++;sh.setEnabled(true);
    }
  }
  for(const [r,e] of lista){
    const m=matPieza(r.p,r.key,"");if(!m)continue;
    e.mesh.updateVerticesData(B.VertexBuffer.PositionKind,e.pos);e.mesh.material=m;e.mesh.visibility=1;e.mesh.alphaIndex=cnt++;e.mesh.setEnabled(true);
  }
}

/* ---------- elementos ---------- */
let scratch=null;const TAU=Math.PI*2;
function dibujarItem(sc,it,t,cam0,sx,orden,opt){
  const z=cam0.z,dd=it.d==null?60:it.d,dof=(sc.look&&sc.look.dof)||0;
  if(it.kind==="actor"){
    const Pa=api.pos(it,t);
    /* con opacidad parcial (entradas/salidas) las piezas se verían a través unas de otras: ese caso va por el camino clásico */
    if((Pa.op==null?1:Pa.op)<.999||(dof>0&&dd<48)){aProxy(sc,it,t,cam0,sx,orden,opt);return;}
    if(!scratch){scratch=document.createElement("canvas");scratch.width=scratch.height=2;}
    api.drawItem(scratch.getContext("2d"),sc,it,t,cam0,sx,Object.assign({},opt,{gpuActor:actorNativo}));return;
  }
  if(dof>0&&dd<48){aProxy(sc,it,t,cam0,sx,orden,opt);return;}
  const P=api.pos(it,t),pf=api.pfOf(it.d),cx0=api.UW()/2;
  const X=((P.x-cam0.x*pf-cx0)*z+cx0)*sx,Y=((P.y-cam0.y*pf*.5-360)*z+360)*sx,k=(P.s||1)*z*sx,op=Math.max(0,Math.min(1,P.op==null?1:P.op));
  if(it.kind==="deco"){
    const sp=api.SPD[it.ref];if(!sp)return;const mv=it.mov||"";
    if(mv==="aletear"||mv==="parpadear"){aProxy(sc,it,t,cam0,sx,orden,opt);return;}
    let dx=0,dy=0,rot=0,sc2=1;const ph=api.hash(it.uid)%100/10;
    if(mv==="mecer")rot=.03*Math.sin(TAU*.4*t+ph);else if(mv==="flotar"){dx=16*Math.sin(TAU*.07*t+ph);dy=-7*Math.sin(TAU*.25*t+ph);}
    else if(mv==="girar")rot=t*.35;else if(mv==="pulso")sc2=1+.07*Math.sin(TAU*1.1*t+ph);else if(mv==="volar"){dx=70*Math.sin(.45*t+ph);dy=14*Math.sin(1.1*t+ph);}
    const s=api.A.sprite(sp,2),tex=texDeCanvas("sp:"+sp.id,s.cv,true),mat=matDe("sp:"+sp.id,tex);
    const ax=X+dx*sx*z,ay=Y+dy*sx*z,r=rot+P.r,ox=(s.wU/2-s.ax)*k*sc2,oy=(s.hU/2-s.ay)*k*sc2,c=Math.cos(r),sn=Math.sin(r);
    const q=plano();ubicar(q,mat,ax+ox*c-oy*sn,ay+ox*sn+oy*c,s.wU*k*sc2,s.hU*k*sc2,r,op,orden);
    const hh=sp.h*k,ww=sp.h*sp.a*k,bb={x:ax-ww*.5,y:sp.anc==="b"?ay-hh:sp.anc==="t"?ay:ay-hh/2,w:ww,h:hh};
    it._bb={x:bb.x/sx,y:bb.y/sx,w:bb.w/sx,h:bb.h/sx,X:X/sx,Y:Y/sx};return;
  }
  if(it.kind==="img"){
    const o=api.IMG()[it.ref];if(!o||!o.ok)return;
    if((o.fr&&o.fr.length)||it.rel){aProxy(sc,it,t,cam0,sx,orden,opt);return;}
    const im=o.img,hh=(it.h0||300)*k,ww=hh*im.width/im.height,rot=(it.mov==="mecer"?.03*Math.sin(TAU*.4*t):0)+P.r;
    const key="im:"+it.ref,tex=texDeCanvas(key,imgCanvas(im),true),mat=matDe(key,tex),c=Math.cos(rot),sn=Math.sin(rot),oy=-hh/2;
    const q=plano();ubicar(q,mat,X-oy*sn,Y+oy*c,ww,hh,rot,op,orden);
    it._bb={x:(X-ww/2)/sx,y:(Y-hh)/sx,w:ww/sx,h:hh/sx,X:X/sx,Y:Y/sx};return;
  }
  aProxy(sc,it,t,cam0,sx,orden,opt);
}

/* ---------- API pública ---------- */
G.iniciar=async function(motor){
  if(G.estado==="listo"&&G.motor===motor)return true;
  G.apagar();
  B=window.BabylonMotor;api=window.SerieGpuApi;
  if(!B||!api){G.fallo="Falta el motor gráfico (Babylon).";G.estado="error";return false;}
  try{
    const cv=document.createElement("canvas");cv.width=1280;cv.height=720;
    cv.style.cssText="position:fixed;left:-99999px;top:0;width:320px;height:180px;pointer-events:none";document.body.appendChild(cv);
    if(motor==="webgpu"){
      if(!navigator.gpu)throw new Error("WebGPU no está disponible");
      E=new B.WebGPUEngine(cv,{antialias:true,stencil:true,adaptToDeviceRatio:false,powerPreference:"high-performance"});await E.initAsync();
    }else{
      E=new B.Engine(cv,true,{preserveDrawingBuffer:true,stencil:true,powerPreference:"high-performance",adaptToDeviceRatio:false},false);
      if(E.webGLVersion<2)throw new Error("WebGL2 no está disponible");
    }
    E.setHardwareScalingLevel(1);
    scene=new B.Scene(E);scene.autoClear=true;scene.clearColor=new B.Color4(0,0,0,0);scene.skipPointerMovePicking=true;scene.autoClearDepthAndStencil=true;
    cam=new B.FreeCamera("cam",new B.Vector3(0,0,-10),scene);cam.mode=B.Camera.ORTHOGRAPHIC_CAMERA;cam.setTarget(new B.Vector3(0,0,0));cam.minZ=1;cam.maxZ=100;
    if(window.GPUAsp)GPUAsp.iniciar();
    /* precalentamiento: Babylon compila los shaders en segundo plano; se espera aquí para que el primer cuadro salga completo */
    G.W=1280;G.H=720;G.canvas=cv;
    {const c0=document.createElement("canvas");c0.width=c0.height=4;const q1=plano(),q2=plano(),q3=plano();
      ubicar(q1,matDe("warm",texDeCanvas("warm",c0,true)),2,2,4,4,0,1,0);ubicar(q2,matHora("tarde"),2,2,4,4,0,1,1);
      const p=proxy();ubicar(q3,p.m,2,2,4,4,0,1,2);
      /* se renderiza mientras se espera: algunos motores solo avanzan la compilación entre cuadros */
      const listo=()=>quads.slice(0,3).every(q=>q.isReady(true));
      for(let i=0;i<150&&!listo();i++){E.beginFrame();scene.render();E.endFrame();await new Promise(r=>setTimeout(r,40));}
      if(!listo())console.warn("Motor GPU: los shaders tardan en compilar; sigo igual.");
      E.beginFrame();scene.render();E.endFrame();
      for(const q of quads)q.setEnabled(false);usados=0;usadosProx=0;}
    G.W=0;G.H=0;
    G.canvas=cv;G.motor=motor;G.activo=true;G.estado="listo";G.fallo="";G.W=0;G.H=0;
    window.dispatchEvent(new CustomEvent("gpu-listo",{detail:{motor}}));
    return true;
  }catch(e){G.fallo=String(e&&e.message||e);G.estado="error";G.activo=false;console.warn("Motor GPU:",e);try{if(E)E.dispose();}catch(x){}E=null;scene=null;return false;}
};
G.apagar=function(){
  G.activo=false;
  try{if(scene)scene.dispose();if(E)E.dispose();}catch(e){}
  if(G.canvas&&G.canvas.parentNode)G.canvas.parentNode.removeChild(G.canvas);
  texs.clear();mats.clear();capasBg.clear();quads.length=0;prox.length=0;usados=usadosProx=0;scene=null;E=null;cam=null;G.canvas=null;G.estado="apagado";
};
/* al cambiar de proyecto se sueltan las texturas */
G.limpiar=function(){
  if(!scene)return;
  for(const t of texs.values())try{t.dispose();}catch(e){}
  for(const m of mats.values())try{m.dispose();}catch(e){}
  texs.clear();mats.clear();capasBg.clear();for(const q of quads)try{q.dispose();}catch(e){}quads.length=0;prox.length=0;
};
function medir(W,H){
  if(G.W===W&&G.H===H)return;
  G.W=W;G.H=H;E.setSize(W,H);
  cam.orthoLeft=-W/2;cam.orthoRight=W/2;cam.orthoTop=H/2;cam.orthoBottom=-H/2;
  for(const p of prox)try{p.t.dispose();}catch(e){}prox.length=0;
  for(const [k,m] of [...mats])if(k.startsWith("prox")){try{m.dispose();}catch(e){}mats.delete(k);}
}
/* dibuja el cuadro en la tarjeta y deja el resultado en G.canvas; devuelve true si lo logró */
G.render=function(sc,t,W,H,cam0,cam1,orden,opt){
  if(!G.activo||!scene)return false;
  const a0=performance.now();
  try{
    medir(W,H);usados=0;usadosProx=0;cnt=0;usoPz.clear();for(const e of todosPz){e.mesh.setEnabled(false);if(e.sh)e.sh.setEnabled(false);}
    const sx=W/api.UW();
    let n=dibujarFondo(sc,cam1,sx,t);
    n=100;
    for(const it of orden){if(it.oculto)continue;dibujarItem(sc,it,t,cam0,sx,n++,opt);}
    if(sc.hora==="tarde"||sc.hora==="noche"){const q=plano();ubicar(q,matHora(sc.hora),W/2,H/2,W,H,0,1,n++);}
    for(let i=usados;i<quads.length;i++)quads[i].setEnabled(false);
    /* si algún shader aún se está compilando (pasa solo la primera vez que aparece algo nuevo), este cuadro sale por el dibujo clásico y se repite enseguida */
    let pend=false;for(const m of scene.meshes)if(m.isEnabled()&&!m.isReady(true))pend=true;
    if(pend){G.pendientes++;clearTimeout(tmrPend);tmrPend=setTimeout(()=>{try{if(window.Studio&&Studio.refit)Studio.refit();}catch(x){}},70);return false;}
    E.beginFrame();scene.render();E.endFrame();
    G.ultimoMs=performance.now()-a0;return true;
  }catch(e){
    G.fallo="Falló el dibujo en GPU: "+(e&&e.message||e);console.warn(G.fallo,e);
    G.estado="error";G.activo=false;
    setTimeout(()=>{try{if(window.Studio&&Studio.say)Studio.say("⚠ El motor GPU falló y volví al dibujo clásico.");if(window.Studio&&Studio.refit)Studio.refit();}catch(x){}},0);
    return false;
  }
};
G._top=()=>scene.meshes.filter(m=>m.isEnabled()).sort((a,b)=>b.alphaIndex-a.alphaIndex).slice(0,3).map(m=>[m.name,m.alphaIndex,m.material&&m.material.name,m.isReady(true),m.visibility]);
G._dbg2=()=>({piezas:todosPz.length,activos:scene.meshes.filter(m=>m.isEnabled()).length,pz:scene.meshes.filter(m=>m.name==="pz"&&m.isEnabled()).map(m=>[!!m.material,m.visibility,m.alphaIndex,m.getTotalVertices(),m.isReady(true),m.material&&m.material.isReady(m)]).slice(0,5)});
G._dbg=()=>({scene:scene.isReady(),meshes:scene.meshes.map(m=>[m.name,m.isEnabled(),m.isReady(true),m.material&&m.material.isReady(m)]),pend:scene._pendingData&&scene._pendingData.length,texturas:scene.textures.map(t=>[t.name,t.isReady()])});
G.preferencia=pref;
G.elegir=async function(v){
  guardar(v);
  if(v==="2d"){G.apagar();if(window.Studio&&Studio.refit)Studio.refit();return true;}
  let ok=await G.iniciar(v);
  if(!ok&&v==="webgpu"){const r=await G.iniciar("webgl2");if(r){ok=true;guardar("webgl2");}}
  if(window.Studio&&Studio.refit)Studio.refit();return ok;
};
/* selector en la ventana «Proyecto» */
function montar(){
  const box=document.querySelector("#projDlg .mbox");if(!box||document.getElementById("pjMotor"))return;
  const d=document.createElement("div");d.style.cssText="margin-top:14px;padding-top:12px;border-top:1px solid #343a58";
  d.innerHTML='<b>🎮 Motor gráfico</b> <small style="opacity:.7">(en prueba)</small><div style="margin:6px 0"><select id="pjMotor" style="width:100%;padding:8px;border-radius:9px;background:#12141c;color:#fff;border:1px solid #343a58"><option value="2d">Clásico (Canvas 2D)</option><option value="webgl2">GPU · WebGL2 (Babylon)</option><option value="webgpu">GPU · WebGPU (Babylon)</option></select></div><small id="pjMotorEst" style="opacity:.75"></small>';
  box.appendChild(d);const s=d.querySelector("#pjMotor"),e=d.querySelector("#pjMotorEst");
  const pintar=()=>{s.value=pref();e.textContent=G.activo?"Activo: "+(G.motor==="webgpu"?"WebGPU":"WebGL2")+" · el fondo y la decoración se dibujan en la tarjeta de video.":(G.fallo?"⚠ "+G.fallo+" Se usa el dibujo clásico.":"Dibujo clásico activo.");};
  s.onchange=async()=>{e.textContent="Cambiando…";await G.elegir(s.value);pintar();};
  window.addEventListener("gpu-listo",pintar);document.getElementById("bProj")&&document.getElementById("bProj").addEventListener("click",pintar);pintar();
}
document.addEventListener("DOMContentLoaded",montar);if(document.readyState!=="loading")montar();
/* arranque: si el usuario eligió GPU, se prende apenas el editor está listo */
function arranque(){const p=pref();if(p!=="2d")G.elegir(p);}
document.addEventListener("studio-ready",arranque);
window.GPUEsc=G;
})();
