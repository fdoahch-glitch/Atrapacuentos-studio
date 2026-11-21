/* Fondo con profundidad: una imagen se separa en capas (cerca / lejos) y se ubica en el escenario 3D.
   Al mover la cámara las capas se desplazan distinto y se siente relieve.
   La profundidad se pinta con pincel, sale automática por la forma del paisaje, o llega desde la IA (depthai.js). */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const S=()=>window.__atr2;
const IW=1024,IH=576,DW=256,DH=144;
const reg={};           /* fondos ya creados, por id (para deshacer/rehacer) */
let meshes=[],mats=[],texs=[],token=0,current=null;

/* ---------- utilidades de imagen ---------- */
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error("imagen"));i.src=src;});}
function cv(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function blur(c,px){const o=cv(c.width,c.height),g=o.getContext("2d");try{g.filter="blur("+px+"px)";}catch(e){}g.drawImage(c,0,0);return o;}

/* ---------- profundidad automática: abajo = cerca, cielo = lejos, árboles oscuros un poco más cerca ---------- */
function autoDepth(img){
  const w=DW,h=DH,c=cv(w,h),g=c.getContext("2d");g.drawImage(img,0,0,w,h);
  const src=g.getImageData(0,0,w,h).data,out=g.createImageData(w,h);
  /* horizonte: la fila donde el cielo (azulado/claro) deja de ser dominante */
  const sky=(r,gg,b)=>{const lum=(r+gg+b)/3,sat=Math.max(r,gg,b)-Math.min(r,gg,b);return (b>r+8&&b>=gg-6&&lum>90)||(lum>205&&sat<40)||(r>200&&gg>120&&b<170&&lum>150&&false);};
  let hor=0;
  for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++){const i=(y*w+x)*4;if(sky(src[i],src[i+1],src[i+2]))s++;}if(s/w>.5)hor=y;else if(y>hor+6)break;}
  hor=clamp(hor,0,Math.round(h*.7));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,r=src[i],gg=src[i+1],b=src[i+2];
    let d;
    if(y<=hor&&sky(r,gg,b))d=0;
    else{const f=clamp((y-hor*.6)/(h-hor*.6),0,1);d=.12+.78*Math.pow(f,.9);
      const lum=(r+gg+b)/3;if(gg>r+6&&gg>b+6&&lum<110)d+=.12;   /* follaje oscuro: se siente más cerca */
      if(y<hor)d=Math.max(d*.5,.05);}
    const v=Math.round(clamp(d,0,1)*255);out.data[i]=out.data[i+1]=out.data[i+2]=v;out.data[i+3]=255;
  }
  g.putImageData(out,0,0);return blur(c,2.5);
}
function gradDepth(){const c=cv(DW,DH),g=c.getContext("2d"),gr=g.createLinearGradient(0,0,0,DH);gr.addColorStop(0,"#000");gr.addColorStop(.35,"#222");gr.addColorStop(1,"#fff");g.fillStyle=gr;g.fillRect(0,0,DW,DH);return c;}
function flatDepth(v){const c=cv(DW,DH),g=c.getContext("2d");g.fillStyle="rgb("+v+","+v+","+v+")";g.fillRect(0,0,DW,DH);return c;}

/* ---------- construir las capas en el escenario ---------- */
function clear(){
  token++;meshes.forEach(m=>{try{m.dispose();}catch(e){}});mats.forEach(m=>{try{m.dispose();}catch(e){}});texs.forEach(t=>{try{t.dispose();}catch(e){}});
  meshes=[];mats=[];texs=[];current=null;
}
async function build(f){
  const my=++token,A=S();if(!A)return;
  const B=A.B,scene=A.scene;
  const img=await loadImg(f.src),dimg=await loadImg(f.depth);
  if(my!==token)return;
  const I=cv(IW,IH);I.getContext("2d").drawImage(img,0,0,IW,IH);
  const D0=cv(IW,IH),dg=D0.getContext("2d");dg.imageSmoothingQuality="high";dg.drawImage(dimg,0,0,IW,IH);
  const D=blur(D0,3).getContext("2d").getImageData(0,0,IW,IH).data;
  const n=clamp(f.n|0||5,2,8),fuerza=clamp(f.fuerza==null?.6:f.fuerza,.1,1);
  let cz=-9,cy=6;
  try{A.cam.getViewMatrix();const p=A.cam.position;if(isFinite(p.z)&&isFinite(p.y)){cz=p.z;cy=p.y;}}catch(e){}
  const zFar=115,zNear=zFar-fuerza*70,base=I.getContext("2d").getImageData(0,0,IW,IH);
  clear();const my2=token;
  for(let k=0;k<n;k++){
    const L=cv(IW,IH),g=L.getContext("2d"),out=g.createImageData(IW,IH),t=k/n,ew=.05;
    for(let i=0,j=0;i<IW*IH;i++,j+=4){
      out.data[j]=base.data[j];out.data[j+1]=base.data[j+1];out.data[j+2]=base.data[j+2];
      out.data[j+3]=k===0?255:Math.round(clamp((D[j]/255-t)/(2*ew)+.5,0,1)*255);
    }
    g.putImageData(out,0,0);
    const z=zFar-(zFar-zNear)*(k/n),s=(z-cz)/(zFar-cz);
    const dt=new B.DynamicTexture("scL"+k,{width:IW,height:IH},scene,true);
    dt.getContext().drawImage(L,0,0);dt.hasAlpha=k>0;dt.update();
    const m=new B.StandardMaterial("scM"+k,scene);
    m.diffuseTexture=dt;m.emissiveTexture=dt;m.disableLighting=true;m.fogEnabled=false;m.backFaceCulling=false;
    m.diffuseColor=new B.Color3(0,0,0);m.specularColor=new B.Color3(0,0,0);
    if(k>0)m.useAlphaFromDiffuseTexture=true;
    const p=B.MeshBuilder.CreatePlane("scP"+k,{width:230*s,height:130*s},scene);
    p.position.set(0,cy+(28-cy)*s,z);p.material=m;p.isPickable=false;
    meshes.push(p);mats.push(m);texs.push(dt);
  }
  if(my2!==token)return;
  current=f;A.setBackdropOn(false);
}
function set(f){
  if(!f){clear();return;}
  reg[f.id]=f;
  const A=S();if(A)A.setBackdropOn(false);
  build(f).catch(e=>{if(window.Studio)Studio.say("No pude armar el fondo con profundidad: "+e.message);});
}

/* ---------- editor de profundidad ---------- */
let box=null,st=null;
function shell(){
  box=document.createElement("div");box.id="fdpBox";box.className="modal";
  box.innerHTML=`<div class="mbox" style="max-width:760px"><h2>🏔️ Fondo con profundidad</h2>
  <p id="fdpHelp">Sube una imagen y marca qué está cerca y qué está lejos. El Studio la separa en capas.</p>
  <div class="btns" style="margin-bottom:6px"><button id="fdpFile" class="pri">⬆️ Subir imagen</button><button id="fdpUse">Usar el fondo actual</button><input type="file" id="fdpIn" accept="image/*" hidden></div>
  <div id="fdpWork" hidden>
    <canvas id="fdpCv" width="640" height="360" style="width:100%;max-width:640px;border-radius:10px;touch-action:none;cursor:crosshair;background:#222"></canvas>
    <div class="row"><span>Distancia al pintar</span><input id="fdpVal" type="range" min="0" max="100" value="100"><b id="fdpValT" style="width:70px">Cerca</b></div>
    <div class="row"><span>Tamaño del pincel</span><input id="fdpBr" type="range" min="2" max="60" value="22"></div>
    <div class="btns">
      <button id="fdpAuto">🪄 Automático</button><button id="fdpGrad">⬇️ Degradado</button><button id="fdpAI">🧠 Relieve con IA</button>
      <button id="fdpSoft">💧 Suavizar</button><button id="fdpUndo">↩ Deshacer</button><button id="fdpClr">Todo lejos</button>
    </div>
    <div class="row"><span>Capas</span><input id="fdpN" type="range" min="2" max="8" value="5"><b id="fdpNT" style="width:30px">5</b></div>
    <div class="row"><span>Profundidad</span><input id="fdpF" type="range" min="1" max="10" value="6"><b id="fdpFT" style="width:30px">6</b></div>
    <div class="row"><span>Ver</span><select id="fdpView"><option value="c">Colores de profundidad</option><option value="q">Capas separadas</option><option value="n">Solo la imagen</option></select></div>
  </div>
  <div class="wnav"><button id="fdpOk" class="pri" hidden>✔ Aplicar al fondo</button><button id="fdpX">Cerrar</button></div></div>`;
  document.body.appendChild(box);
  $("fdpX").onclick=()=>{box.hidden=true;};
  $("fdpFile").onclick=()=>$("fdpIn").click();
  $("fdpIn").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f)return;const fr=new FileReader();fr.onload=()=>start(fr.result);fr.readAsDataURL(f);};
  $("fdpUse").onclick=()=>{
    const A=S(),w=window.Studio.proj.mundos[window.Studio.proj.mundo];
    if(w.fondo)start(w.fondo.src,w.fondo);
    else{const m=window.Studio.MINE.find(x=>x.kind==="bg"&&w.bg==="mine:"+x.id)||window.Studio.MINE.filter(x=>x.kind==="bg").pop();
      if(m)start(m.src);else window.Studio.say("Aún no hay un fondo tuyo. Sube una imagen.");}
  };
  const cvs=$("fdpCv");let down=false;
  const pos=e=>{const r=cvs.getBoundingClientRect();return [(e.clientX-r.left)/r.width*DW,(e.clientY-r.top)/r.height*DH];};
  cvs.addEventListener("pointerdown",e=>{if(!st)return;down=true;cvs.setPointerCapture(e.pointerId);snap();paint(...pos(e));});
  cvs.addEventListener("pointermove",e=>{if(down)paint(...pos(e));});
  const up=()=>{down=false;};cvs.addEventListener("pointerup",up);cvs.addEventListener("pointercancel",up);
  $("fdpVal").oninput=()=>{const v=+$("fdpVal").value;$("fdpValT").textContent=v>80?"Cerca":v>55?"Medio-cerca":v>30?"Medio":v>10?"Lejos":"Muy lejos";};
  $("fdpN").oninput=()=>{$("fdpNT").textContent=$("fdpN").value;draw();};
  $("fdpF").oninput=()=>{$("fdpFT").textContent=$("fdpF").value;};
  $("fdpView").onchange=draw;
  $("fdpAuto").onclick=()=>{snap();setDepth(autoDepth(st.img));};
  $("fdpGrad").onclick=()=>{snap();setDepth(gradDepth());};
  $("fdpClr").onclick=()=>{snap();setDepth(flatDepth(0));};
  $("fdpSoft").onclick=()=>{snap();setDepth(blur(st.depth,3));};
  $("fdpUndo").onclick=()=>{if(st&&st.stack.length){st.depth.getContext("2d").putImageData(st.stack.pop(),0,0);draw();}};
  $("fdpAI").onclick=async()=>{
    if(!window.DepthAI){window.Studio.say("El relieve con IA no está disponible aquí. Usa Automático o el pincel.");return;}
    $("fdpAI").disabled=true;$("fdpHelp").textContent="La IA está calculando el relieve… la primera vez descarga el modelo (puede tardar).";
    try{const d=await window.DepthAI.run(st.img,(m)=>{$("fdpHelp").textContent=m;});snap();setDepth(d);$("fdpHelp").textContent="Listo. Puedes retocar con el pincel.";}
    catch(e){$("fdpHelp").textContent="La IA no pudo calcular el relieve ("+(e.message||e)+"). Usa Automático o el pincel.";}
    $("fdpAI").disabled=false;
  };
  $("fdpOk").onclick=apply;
}
function snap(){const g=st.depth.getContext("2d");st.stack.push(g.getImageData(0,0,DW,DH));if(st.stack.length>15)st.stack.shift();}
function setDepth(c){const g=st.depth.getContext("2d");g.clearRect(0,0,DW,DH);g.drawImage(c,0,0,DW,DH);draw();}
function paint(x,y){
  const g=st.depth.getContext("2d"),v=Math.round(+$("fdpVal").value/100*255),r=+$("fdpBr").value*DW/640*1.2;
  const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba("+v+","+v+","+v+",1)");gr.addColorStop(.65,"rgba("+v+","+v+","+v+",.9)");gr.addColorStop(1,"rgba("+v+","+v+","+v+",0)");
  g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();draw();
}
function draw(){
  if(!st)return;const c=$("fdpCv"),g=c.getContext("2d");
  g.drawImage(st.img,0,0,c.width,c.height);
  const mode=$("fdpView").value;if(mode==="n")return;
  const d=st.depth.getContext("2d").getImageData(0,0,DW,DH).data,o=cv(DW,DH),og=o.getContext("2d"),im=og.createImageData(DW,DH),n=+$("fdpN").value;
  for(let i=0;i<DW*DH;i++){
    let v=d[i*4]/255;if(mode==="q")v=Math.min(n-1,Math.floor(v*n))/(n-1);
    /* lejos = azul, cerca = rojo */
    im.data[i*4]=Math.round(255*v);im.data[i*4+1]=Math.round(120*(1-Math.abs(v-.5)*2));im.data[i*4+2]=Math.round(255*(1-v));im.data[i*4+3]=mode==="q"?140:120;
  }
  og.putImageData(im,0,0);g.imageSmoothingEnabled=mode!=="q";g.drawImage(o,0,0,c.width,c.height);
}
async function start(src,prev){
  const img=await loadImg(src);
  const w=img.naturalWidth,h=img.naturalHeight,k=Math.min(1,1280/Math.max(w,h));
  const c=cv(Math.round(w*k),Math.round(h*k));c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  const im2=await loadImg(c.toDataURL("image/jpeg",.85));
  const depth=cv(DW,DH);
  if(prev&&prev.depth){depth.getContext("2d").drawImage(await loadImg(prev.depth),0,0,DW,DH);}
  else depth.getContext("2d").drawImage(autoDepth(im2),0,0);
  st={img:im2,src:c.toDataURL("image/jpeg",.85),depth,stack:[]};
  if(prev){$("fdpN").value=prev.n||5;$("fdpF").value=Math.round((prev.fuerza||.6)*10);}
  $("fdpNT").textContent=$("fdpN").value;$("fdpFT").textContent=$("fdpF").value;
  $("fdpWork").hidden=false;$("fdpOk").hidden=false;
  $("fdpHelp").textContent="Ya está calculado automáticamente. Pinta con el pincel para corregir: rojo = cerca, azul = lejos.";
  draw();
}
function apply(){
  if(!st)return;
  const Stu=window.Studio,w=Stu.proj.mundos[Stu.proj.mundo];
  const f={id:"fd"+Date.now().toString(36),src:st.src,depth:st.depth.toDataURL("image/png"),n:+$("fdpN").value,fuerza:+$("fdpF").value/10};
  w.fondo=f;w.bg="";window.__userBd=true;set(f);
  box.hidden=true;Stu.say("Fondo con profundidad aplicado. Mueve la cámara o pulsa ▶ para ver el efecto.");Stu.changed();Stu.showScene&&Stu.showScene();
}
function open(){if(!box)shell();box.hidden=false;if(!st)$("fdpWork").hidden=true;}
window.Scenery={open,set,clear,reg,autoDepth,get current(){return current;}};
})();
