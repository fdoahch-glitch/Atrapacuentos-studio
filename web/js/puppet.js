/* Creador de personajes con esqueleto: el niño sube un dibujo, el programa quita el fondo,
   marca 7 puntos (cabeza, cuello, cintura, manos, pies) y separa el dibujo en 6 partes
   (cabeza, cuerpo, 2 brazos, 2 piernas) que se mueven como títere. */
(function(){
const SEG=[["legR","hip","footR",1.3],["legL","hip","footL",1.3],["torso","hip","neck",1],["head","neck","top",.85],["armR","sh","handR",1.6],["armL","sh","handL",1.6]];
const ORDER=SEG.map(s=>s[0]); /* de atrás hacia adelante */
const PTS=[["top","Toca lo más alto de la cabeza"],["neck","Toca el cuello (donde se une la cabeza)"],["hip","Toca la cintura / cadera"],["handL","Toca la mano que queda a la izquierda del dibujo"],["handR","Toca la mano que queda a la derecha del dibujo"],["footL","Toca el pie de la izquierda del dibujo"],["footR","Toca el pie de la derecha del dibujo"]];
const FACE=[["eyeL","Toca el ojo de la izquierda del dibujo"],["eyeR","Toca el ojo de la derecha del dibujo"],["mouth","Toca el centro de la boca"]];
const DEFSET={suav:.5,vel:1,amp:1,parp:true,fsz:1};
function sets(m){m.set=Object.assign({},DEFSET,m.set||{});return m.set;}
const COL={legR:"#3b82f6",legL:"#22c1c3",torso:"#f5a524",head:"#ef4444",armR:"#a855f7",armL:"#10b981"};
const PARTN={legR:"pierna der.",legL:"pierna izq.",torso:"cuerpo",head:"cabeza",armR:"brazo der.",armL:"brazo izq."};

function withSh(p,piv){const q=Object.assign({},p);q.sh={x:p.neck.x+(p.hip.x-p.neck.x)*.22,y:p.neck.y+(p.hip.y-p.neck.y)*.22};
  q.shL=(piv&&piv.armL)||q.sh;q.shR=(piv&&piv.armR)||q.sh;return q;}
function pivot(name,q){return name==="head"?q.neck:name==="armL"?q.shL:name==="armR"?q.shR:q.hip;}

/* quita el fondo: solo lo que está conectado con los bordes y se parece al color de la esquina */
function cutout(img,tol){
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");g.drawImage(img,0,0,w,h);
  if(tol<=0)return c;
  const id=g.getImageData(0,0,w,h),d=id.data;
  const px=(x,y)=>(y*w+x)*4;
  const cs=[px(0,0),px(w-1,0),px(0,h-1),px(w-1,h-1)];
  let r=0,gr=0,b=0,n=0;
  for(const o of cs){if(d[o+3]>200){r+=d[o];gr+=d[o+1];b+=d[o+2];n++;}}
  if(!n)return c; /* ya tiene fondo transparente */
  r/=n;gr/=n;b/=n;
  const near=o=>{if(d[o+3]<20)return true;const dr=d[o]-r,dg=d[o+1]-gr,db=d[o+2]-b;return Math.sqrt(dr*dr+dg*dg+db*db)<tol;};
  const seen=new Uint8Array(w*h),st=[];
  const push=(x,y)=>{if(x<0||y<0||x>=w||y>=h)return;const k=y*w+x;if(seen[k])return;if(!near(k*4))return;seen[k]=1;st.push(k);};
  for(let x=0;x<w;x++){push(x,0);push(x,h-1);}for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
  while(st.length){const k=st.pop(),x=k%w,y=(k/w)|0;d[k*4+3]=0;push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1);}
  g.putImageData(id,0,0);return c;
}
function dseg(px,py,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy;let t=L?((px-a.x)*dx+(py-a.y)*dy)/L:0;t=t<0?0:t>1?1:t;
  const x=a.x+dx*t-px,y=a.y+dy*t-py;return Math.sqrt(x*x+y*y);
}
/* separa en partes: cada píxel va al hueso más cercano. Los brazos solo empiezan donde termina el ancho del cuerpo,
   y con suavizado los píxeles de la frontera se comparten con la parte vecina (sin costuras) y los bordes se difuminan */
function split(cut,pts,suav){
  suav=suav||0;
  const w=cut.width,h=cut.height,q=withSh(pts),src=cut.getContext("2d").getImageData(0,0,w,h).data;
  const segs=SEG.map(s=>[q[s[1]],q[s[2]],s[3]]),ov=suav*14;
  const iT=SEG.findIndex(s=>s[0]==="torso"),iL=SEG.findIndex(s=>s[0]==="armL"),iR=SEG.findIndex(s=>s[0]==="armR");
  const A1=new Int8Array(w*h).fill(-1),A2=new Int8Array(w*h).fill(-1),DF=new Float32Array(w*h);
  const ax=q.neck.x-q.hip.x,ay=q.neck.y-q.hip.y,al=ax*ax+ay*ay||1,tw=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=y*w+x;if(src[k*4+3]<10)continue;
    let b1=1e9,i1=0,b2=1e9,i2=-1;
    for(let j=0;j<segs.length;j++){const dd=dseg(x,y,segs[j][0],segs[j][1])*segs[j][2];if(dd<b1){b2=b1;i2=i1;b1=dd;i1=j;}else if(dd<b2){b2=dd;i2=j;}}
    A1[k]=i1;A2[k]=i2;DF[k]=b2-b1;
    if(i1===iT){const u=((x-q.hip.x)*ax+(y-q.hip.y)*ay)/al;if(u>.25&&u<.8)tw.push(dseg(x,y,q.hip,q.neck));}
  }
  /* ancho del cuerpo: los brazos no pueden empezar dentro de él */
  tw.sort((a,b)=>a-b);const hw=tw.length?tw[Math.floor(tw.length*.9)]:0;
  const outs=SEG.map(()=>new Uint8ClampedArray(w*h*4)),cand={armL:[],armR:[]};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=y*w+x;if(A1[k]<0)continue;let i1=A1[k],i2=A2[k];const o=k*4;
    if(i1===iL||i1===iR){const dt=dseg(x,y,q.hip,q.neck);if(dt<hw*1.06){i1=iT;i2=-1;}else cand[i1===iL?"armL":"armR"].push(x,y,dt);}
    let out=outs[i1];out[o]=src[o];out[o+1]=src[o+1];out[o+2]=src[o+2];out[o+3]=src[o+3];
    if(ov>0&&i2>=0&&DF[k]<ov){out=outs[i2];out[o]=src[o];out[o+1]=src[o+1];out[o+2]=src[o+2];out[o+3]=src[o+3];}
  }
  const parts={},piv={};
  for(const n of ["armL","armR"]){
    const c=cand[n];let mn=1e9;for(let i=2;i<c.length;i+=3)if(c[i]<mn)mn=c[i];
    let sx=0,sy=0,k=0;for(let i=0;i<c.length;i+=3)if(c[i+2]<=mn+3){sx+=c[i];sy+=c[i+1];k++;}
    if(k)piv[n]={x:sx/k,y:sy/k};
  }
  SEG.forEach((s,k)=>{
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").putImageData(new ImageData(outs[k],w,h),0,0);
    if(suav>0){const c2=document.createElement("canvas");c2.width=w;c2.height=h;const g2=c2.getContext("2d");g2.filter="blur("+(suav*1.1).toFixed(2)+"px)";g2.drawImage(c,0,0);parts[s[0]]=c2;}
    else parts[s[0]]=c;
  });
  Object.defineProperty(parts,"_piv",{value:piv,enumerable:false});
  return parts;
}
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});}
/* prepara (y guarda) las partes de un personaje guardado */
function prepare(m){
  if(m._parts)return Promise.resolve(m._parts);
  if(m._prep)return m._prep;
  return m._prep=loadImg(m.src).then(im=>{sets(m);m._cut=cutout(im,m.tol||0);m._parts=split(m._cut,m.pts,m.set.suav);return m._parts;});
}
/* ángulos de cada parte: t = segundos, amt = 0 quieto … 1 caminando; st = ajustes (velocidad, amplitud) */
const POSES=[["","Quieto"],["saludar","Saludar"],["saltar","Saltar"],["bailar","Bailar"],["susto","Asustarse"],["celebrar","Celebrar"]];
const EMOS=[["","Normal"],["feliz","Feliz"],["triste","Triste"],["enojado","Enojado"],["sorpresa","Sorprendido"]];
/* ángulos en sentido del reloj (como el canvas 2D). pose = acción; lift = cuánto sube el personaje */
const PI=Math.PI,norm=d=>{while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;return d;};
function angles(t,amt,st,pose,pts,piv){
  const vel=(st&&st.vel)||1,amp=(st&&st.amp)||1,w=Math.sin(t*9*vel)*amt*amp,id=1-amt;
  const a={legL:w*.45,legR:-w*.45,armL:-w*.35+Math.sin(t*1.7)*.05*id,armR:w*.35-Math.sin(t*1.7+1)*.05*id,
    head:Math.sin(t*18*vel)*.04*amt*amp+Math.sin(t*1.3)*.03*id,torso:Math.sin(t*18*vel)*.02*amt*amp,lift:0};
  if(pose&&amt<.01&&pts&&pts.neck){
    const q=withSh(pts,piv);
    /* cada brazo apunta hacia una dirección absoluta en pantalla (−π/2 = arriba); se calcula cuánto girar desde cómo lo dibujaron */
    const rest=n=>{const h=n==="armR"?pts.handR:pts.handL;return Math.atan2(h.y-q.sh.y,h.x-q.sh.x);};
    const pt=(n,dir)=>norm(dir-rest(n));
    const s5=Math.sin(t*5),s9=Math.sin(t*9);
    if(pose==="saludar"){a.armR=pt("armR",-1.25+s9*.3);a.armL=pt("armL",PI/2+.15);a.head=.08+Math.sin(t*2)*.03;}
    else if(pose==="saltar"){a.lift=Math.abs(Math.sin(t*5))*.7;a.armR=pt("armR",-.8);a.armL=pt("armL",-PI+.8);a.legL=.2*s5;a.legR=-.2*s5;}
    else if(pose==="bailar"){a.torso=s5*.07;a.head=Math.sin(t*5+1)*.1;a.armR=pt("armR",-.9+s5*.5);a.armL=pt("armL",-2.25+Math.sin(t*5+2)*.5);a.legL=s5*.2;a.legR=-s5*.2;a.lift=Math.abs(s5)*.1;}
    else if(pose==="susto"){const f=Math.sin(t*34);a.armR=pt("armR",-1.1+f*.05);a.armL=pt("armL",-2.04-f*.05);a.torso=f*.03;a.head=f*.04;a.legL=.12;a.legR=-.12;}
    else if(pose==="celebrar"){a.armR=pt("armR",-1.3+Math.sin(t*10)*.2);a.armL=pt("armL",-1.84-Math.sin(t*10)*.2);a.lift=Math.abs(Math.sin(t*6))*.5;a.head=Math.sin(t*6)*.05;}
  }
  return a;
}
/* ---- cara: parpadeo y boca (se pintan sobre la cabeza) ---- */
function faceState(t,st,talk,emo){
  let blink=0,open=0;
  if(st.parp){const u=(t%3.6);if(u<.16)blink=Math.sin(u/.16*Math.PI);}
  if(typeof talk==="number")open=Math.min(1,talk*1.3);else if(talk)open=(.5+.5*Math.sin(t*14))*(.55+.45*Math.sin(t*5.3));
  return {blink:blink>.66?1:blink>.2?.5:0,open:Math.round(open*4)/4,emo:emo||""};
}
function skinAt(m,e,r){
  m._skin=m._skin||{};const key=Math.round(e.x)+","+Math.round(e.y);if(m._skin[key])return m._skin[key];
  let R=0,G=0,B=0,n=0;const x0=Math.max(0,Math.floor(e.x-r*2)),y0=Math.max(0,Math.floor(e.y-r*2)),x1=Math.min(m.w,Math.ceil(e.x+r*2)),y1=Math.min(m.h,Math.ceil(e.y+r*2));
  if(x1>x0&&y1>y0){
    const d=m._cut.getContext("2d").getImageData(x0,y0,x1-x0,y1-y0).data;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const dd=Math.hypot(x-e.x,y-e.y);if(dd<r*1.45||dd>r*2)continue;const o=((y-y0)*(x1-x0)+(x-x0))*4;if(d[o+3]<200)continue;R+=d[o];G+=d[o+1];B+=d[o+2];n++;}
  }
  return m._skin[key]=n?"rgb("+Math.round(R/n)+","+Math.round(G/n)+","+Math.round(B/n)+")":"#f3c9a0";
}
/* devuelve la cabeza con ojos cerrados / boca abierta / emoción según el estado (c = caché de quien la usa) */
function faceCanvas(m,fs,c){
  c=c||m;const p=m.pts,k=fs.blink+"_"+fs.open+"_"+fs.emo;
  if(c._fc&&c._fk===k)return c._fc;
  const cv=c._fc||(c._fc=document.createElement("canvas"));cv.width=m.w;cv.height=m.h;
  const g=cv.getContext("2d");g.drawImage(m._parts.head,0,0);
  const hl=Math.hypot(p.top.x-p.neck.x,p.top.y-p.neck.y),f=sets(m).fsz,r=hl*.07*f,ink="#2a1a1a";
  const hasEyes=p.eyeL&&p.eyeR,e=fs.emo;
  g.lineCap="round";g.strokeStyle=ink;
  if(e&&hasEyes){ /* cejas */
    const lw=Math.max(2,r*.3);g.lineWidth=lw;
    for(const [pt,sg] of [[p.eyeL,-1],[p.eyeR,1]]){ /* sg: lado hacia el centro de la cara */
      const y=pt.y-r*(e==="sorpresa"?2.7:2.1),x0=pt.x-r*1.0,x1=pt.x+r*1.0;g.beginPath();
      if(e==="feliz"){g.moveTo(x0,y+r*.2);g.quadraticCurveTo(pt.x,y-r*.5,x1,y+r*.2);}
      else if(e==="sorpresa"){g.moveTo(x0,y+r*.3);g.quadraticCurveTo(pt.x,y-r*.7,x1,y+r*.3);}
      else{const inner=e==="triste"?-r*.8:r*.8,xi=pt.x-sg*r*1.0,xo=pt.x+sg*r*1.0; /* triste: extremo interior arriba; enojado: interior abajo */
        g.moveTo(xo,y);g.lineTo(xi,y+inner*(e==="triste"?1:1));}
      g.stroke();
    }
  }
  if(p.mouth&&e){ /* tapa la boca dibujada y pone la de la emoción */
    const mw=hl*.26*f;g.fillStyle=skinAt(m,p.mouth,mw*.35);g.beginPath();g.ellipse(p.mouth.x,p.mouth.y,mw*.62,mw*.42,0,0,6.3);g.fill();
    g.lineWidth=Math.max(2,mw*.1);g.beginPath();
    if(e==="feliz"){g.moveTo(p.mouth.x-mw*.45,p.mouth.y-mw*.05);g.quadraticCurveTo(p.mouth.x,p.mouth.y+mw*.5,p.mouth.x+mw*.45,p.mouth.y-mw*.05);g.stroke();}
    else if(e==="triste"){g.moveTo(p.mouth.x-mw*.4,p.mouth.y+mw*.15);g.quadraticCurveTo(p.mouth.x,p.mouth.y-mw*.3,p.mouth.x+mw*.4,p.mouth.y+mw*.15);g.stroke();}
    else if(e==="enojado"){g.moveTo(p.mouth.x-mw*.4,p.mouth.y+mw*.1);g.lineTo(p.mouth.x+mw*.4,p.mouth.y+mw*.1);g.stroke();}
    else if(e==="sorpresa"){g.fillStyle="#4a1418";g.beginPath();g.ellipse(p.mouth.x,p.mouth.y,mw*.2,mw*.28,0,0,6.3);g.fill();}
  }
  if(fs.blink>0&&hasEyes)for(const pt of [p.eyeL,p.eyeR]){
    g.fillStyle=skinAt(m,pt,r);g.beginPath();g.ellipse(pt.x,pt.y,r*1.35,r*(fs.blink===1?1.15:.7),0,0,6.3);g.fill();
    g.strokeStyle=ink;g.lineWidth=Math.max(1.5,r*.22);g.beginPath();g.moveTo(pt.x-r*1.05,pt.y);g.quadraticCurveTo(pt.x,pt.y+r*.35,pt.x+r*1.05,pt.y);g.stroke();
  }
  if(fs.open>0&&p.mouth){
    const mw=hl*.26*f;g.fillStyle="#4a1418";g.beginPath();g.ellipse(p.mouth.x,p.mouth.y,mw/2,Math.max(1.5,mw*.5*fs.open),0,0,6.3);g.fill();
  }
  c._fk=k;return cv;
}
let _tc=null;
function drawPose(g,parts,pts,ang,ox,oy,s,w,h,tint,piv){
  const q=withSh(pts,piv||parts._piv),ww=Math.max(1,Math.round(w*s)),hh=Math.max(1,Math.round(h*s));
  if(tint){if(!_tc)_tc=document.createElement("canvas");if(_tc.width!==ww||_tc.height!==hh){_tc.width=ww;_tc.height=hh;}}
  for(const n of ORDER){
    const p=pivot(n,q);g.save();g.translate(ox+p.x*s,oy+p.y*s);g.rotate(ang[n]||0);g.translate(-p.x*s,-p.y*s);
    if(tint){
      const t=_tc.getContext("2d");t.globalCompositeOperation="source-over";t.globalAlpha=1;t.clearRect(0,0,ww,hh);
      t.drawImage(parts[n],0,0,ww,hh);t.globalCompositeOperation="source-atop";t.globalAlpha=.55;t.fillStyle=COL[n];t.fillRect(0,0,ww,hh);
      g.drawImage(_tc,0,0);
    }else g.drawImage(parts[n],0,0,ww,hh);
    g.restore();
  }
}
/* construye el personaje en Babylon: una lámina por parte, cada una colgada de su articulación */
function build(m,alto,root,scene,B,onReady){
  if(!m._parts){prepare(m).then(onReady);return null;}
  const W=alto*m.w/m.h,H=alto,q=withSh(m.pts,m._parts._piv);
  const X=px=>(px/m.w-.5)*W,Y=py=>(1-py/m.h)*H;
  if(!m._mats){
    m._mats={};
    for(const n of ORDER){
      const dt=new B.DynamicTexture("pp_"+n,{width:m.w,height:m.h},scene,false);dt.hasAlpha=true;
      dt.getContext().drawImage(m._parts[n],0,0);dt.update();
      const x=new B.StandardMaterial("pm_"+n,scene);x.diffuseTexture=dt;x.emissiveTexture=dt;x.opacityTexture=null;
      x.useAlphaFromDiffuseTexture=true;x.transparencyMode=3;x.alphaCutOff=.06;x.disableLighting=true;x.backFaceCulling=false;
      m._mats[n]=x;(m._dts=m._dts||{})[n]=dt;
    }
  }
  const meshes=[],joints=[],J={},disp=[],fcache={};
  /* la cabeza es propia de cada copia: así cada personaje puede tener su emoción y su boca */
  const hdt=new B.DynamicTexture("hd",{width:m.w,height:m.h},scene,false);hdt.hasAlpha=true;hdt.getContext().drawImage(m._parts.head,0,0);hdt.update();
  const hm=m._mats.head.clone("hm");hm.diffuseTexture=hdt;hm.emissiveTexture=hdt;disp.push(hm,hdt);
  let dk=null;
  ORDER.forEach((n,k)=>{
    const p=pivot(n,q),jn=new B.TransformNode("j_"+n,scene);jn.parent=root;jn.position.set(X(p.x),Y(p.y),.02-k*.007);
    const pl=B.MeshBuilder.CreatePlane("pl_"+n,{width:W,height:H,sideOrientation:B.Mesh.DOUBLESIDE},scene);
    pl.parent=jn;pl.position.set(-X(p.x),H/2-Y(p.y),0);pl.material=n==="head"?hm:m._mats[n];
    meshes.push(pl);joints.push(jn);J[n]=jn;
  });
  const rig={pose(t,amt,talk,pose,emo){
      const st=sets(m),a=angles(t,amt,st,pose,m.pts,m._parts._piv);for(const n of ORDER)J[n].rotation.z=-(a[n]||0);
      if(m.pts.eyeL||m.pts.mouth){
        const c=faceCanvas(m,faceState(t,st,talk,emo),fcache);
        if(dk!==fcache._fk){const g=hdt.getContext();g.clearRect(0,0,m.w,m.h);g.drawImage(c,0,0);hdt.update();dk=fcache._fk;}
      }
      return a.lift*(m.alto||3)/3;
    },
    tint(c){for(const n of ORDER)if(n!=="head")m._mats[n].emissiveColor=c;hm.emissiveColor=c;}};
  return {meshes,joints,rig,disp,size:[W,H,.3]};
}

/* ---------- ventana del creador ---------- */
function open(onDone){
  let box=document.getElementById("pup");
  if(!box){
    box=document.createElement("div");box.id="pup";box.className="modal";
    box.innerHTML=`<div class="mbox" style="max-width:1000px"><h2>🦴 Creador de personajes</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="flex:0 0 auto"><canvas id="pupCv" width="480" height="480" style="width:min(480px,86vw);aspect-ratio:1;background:repeating-conic-gradient(#e8ecf3 0 25%,#fff 0 50%) 0 0/20px 20px;border-radius:12px;cursor:crosshair;touch-action:none"></canvas></div>
      <div style="flex:1;min-width:250px">
        <div id="pupS1"><p><b>1.</b> Sube el dibujo de tu personaje (de cuerpo entero, de frente).</p><button id="pupFile" class="pri">🖼️ Elegir dibujo</button></div>
        <div id="pupS2" hidden>
          <p><b>2.</b> <span id="pupGuide"></span></p>
          <div id="pupList" style="font-size:12px;opacity:.9;margin-bottom:8px"></div>
          <p><label>Quitar fondo <input id="pupTol" type="range" min="0" max="140" value="45" style="width:150px"></label><br><small>Súbelo si queda fondo; bájalo si se borra parte del dibujo.</small></p>
          <p><button id="pupUndo">↩ Quitar último punto</button> <button id="pupReset">🗑 Empezar de nuevo</button></p>
          <div id="pupS3" hidden><p><b>3.</b> ¡Listo! Mira cómo se mueve y ajústalo.</p>
            <p><label><input type="checkbox" id="pupWalk" checked> Caminando</label> &nbsp; <label><input type="checkbox" id="pupParts"> Ver las partes</label> &nbsp; <label><input type="checkbox" id="pupTalk"> Hablando</label></p>
            <p>Probar: <select id="pupPose">${POSES.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join("")}</select> <select id="pupEmo">${EMOS.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join("")}</select></p>
            <p><label>Suavizado de bordes <input id="pupSuav" type="range" min="0" max="10" value="5" style="width:120px"></label><br><small>Más suavizado = se nota menos que está hecho por partes.</small></p>
            <p><label>Velocidad de caminata <input id="pupVel" type="range" min="4" max="20" value="10" style="width:110px"></label><br><label>Largo de los pasos <input id="pupAmp" type="range" min="4" max="16" value="10" style="width:110px"></label></p>
            <p><button id="pupFaceB">👁 Marcar ojos y boca</button> <label><input type="checkbox" id="pupParp" checked> Parpadea</label><br><label>Tamaño de ojos y boca <input id="pupFsz" type="range" min="5" max="20" value="10" style="width:100px"></label><br><small id="pupFaceH">Opcional: así puede abrir y cerrar los ojos y la boca.</small></p>
            <p><input type="text" id="pupName" placeholder="Nombre del personaje" maxlength="30" style="width:100%"></p>
            <button id="pupOk" class="go">✅ Agregar al cuento</button></div>
        </div>
        <p id="pupMsg" style="color:#ff9d9d;min-height:1em"></p>
      </div></div>
    <div class="wnav"><button id="pupClose">Cerrar</button></div></div>
    <input type="file" id="pupIn" accept="image/*" hidden>`;
    document.body.appendChild(box);
  }
  const $=id=>document.getElementById(id);
  const cv=$("pupCv"),g=cv.getContext("2d");
  let img=null,cut=null,pts={},parts=null,raf=0,stopped=false,name="Mi personaje",srcUrl="",W=0,H=0,faceMode=false,mm=null;
  const set=Object.assign({},DEFSET);
  const scaleOf=()=>Math.min(cv.width/W,cv.height/H),offOf=()=>[(cv.width-W*scaleOf())/2,(cv.height-H*scaleOf())/2];
  const cur=()=>PTS.findIndex(p=>!pts[p[0]]);
  function ui(){
    const k=cur();
    $("pupGuide").textContent=k<0?"Puntos listos. Si algo se ve mal, ajusta el fondo o empieza de nuevo.":"Punto "+(k+1)+" de 7: "+PTS[k][1]+".";
    $("pupList").innerHTML=PTS.map((p,i)=>`<span style="opacity:${pts[p[0]]?1:.45}">${pts[p[0]]?"✅":(i===k?"👉":"⚪")} ${p[1].replace("Toca ","")}</span>`).join("<br>");
    $("pupS3").hidden=k>=0;
    const fk=FACE.findIndex(f=>!pts[f[0]]);
    $("pupFaceH").textContent=faceMode&&fk>=0?"👉 "+FACE[fk][1]+".":(fk<0?"Ojos y boca marcados.":"Opcional: así puede abrir y cerrar los ojos y la boca.");
    $("pupFaceB").textContent=fk<0?"👁 Volver a marcar ojos y boca":(faceMode?"Cancelar marcado":"👁 Marcar ojos y boca");
  }
  function recut(){
    if(!img)return;cut=cut||null;cut=cutout(img,+$("pupTol").value);
    parts=cur()<0?split(cut,pts,set.suav):null;
    mm=parts?{w:W,h:H,pts,set,_cut:cut,_parts:parts}:null;
  }
  function frame(t){
    if(stopped)return;
    g.clearRect(0,0,cv.width,cv.height);
    if(cut){
      const s=scaleOf(),[ox,oy]=offOf();
      if(parts){
        const walk=$("pupWalk").checked;
        const tt=t/1000,hc=(pts.eyeL||pts.mouth||$("pupEmo").value)?faceCanvas(mm,faceState(tt,set,$("pupTalk").checked,$("pupEmo").value)):parts.head;
        drawPose(g,Object.assign({},parts,{head:hc}),pts,angles(tt,walk?1:0,set,$("pupPose").value,pts,parts._piv),ox,oy+(angles(tt,walk?1:0,set,$("pupPose").value,pts,parts._piv).lift*-60*s),s,W,H,$("pupParts").checked,parts._piv);
      }else g.drawImage(cut,ox,oy,W*s,H*s);
      const q=Object.keys(pts).length?pts:{};
      for(const p of PTS.concat(FACE)){const v=q[p[0]];if(!v)continue;g.fillStyle=FACE.includes(p)?"#ff4d94":"#7a5cff";g.strokeStyle="#fff";g.lineWidth=2;g.beginPath();g.arc(ox+v.x*s,oy+v.y*s,6,0,6.3);g.fill();g.stroke();}
      if(!parts&&cur()>=0&&cur()>=3){/* ayuda visual: línea cuello-cintura */ }
    }
    raf=requestAnimationFrame(frame);
  }
  function setImage(im){
    /* se reduce para que sea ágil y liviano */
    const k=Math.min(1,720/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.round(im.naturalWidth*k),h=Math.round(im.naturalHeight*k);
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);
    srcUrl=c.toDataURL("image/png");W=w;H=h;
    const i2=new Image();i2.onload=()=>{img=i2;for(const k in pts)delete pts[k];faceMode=false;parts=null;recut();$("pupS1").hidden=true;$("pupS2").hidden=false;ui();};i2.src=srcUrl;
  }
  $("pupFile").onclick=()=>$("pupIn").click();
  $("pupIn").onchange=e=>{
    const f=e.target.files[0];e.target.value="";if(!f)return;name=f.name.replace(/\.[^.]+$/,"").slice(0,30)||"Mi personaje";
    $("pupName").value=name;
    const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>setImage(im);im.onerror=()=>{$("pupMsg").textContent="No pude leer esa imagen.";};im.src=fr.result;};fr.readAsDataURL(f);
  };
  cv.onpointerdown=e=>{
    if(!img)return;if(cur()<0&&!faceMode)return;const r=cv.getBoundingClientRect(),s=scaleOf(),[ox,oy]=offOf();
    const x=((e.clientX-r.left)*(cv.width/r.width)-ox)/s,y=((e.clientY-r.top)*(cv.height/r.height)-oy)/s;
    if(x<0||y<0||x>W||y>H)return;
    if(cur()>=0){pts[PTS[cur()][0]]={x,y};if(cur()<0)recut();}
    else{const fk=FACE.findIndex(f=>!pts[f[0]]);if(fk>=0)pts[FACE[fk][0]]={x,y};if(FACE.every(f=>pts[f[0]]))faceMode=false;if(mm)mm._skin=null;}
    ui();
  };
  $("pupUndo").onclick=()=>{const ks=PTS.concat(FACE).map(p=>p[0]).filter(k=>pts[k]);if(ks.length){const k=ks[ks.length-1];delete pts[k];if(PTS.some(x=>x[0]===k))parts=null;ui();}};
  $("pupReset").onclick=()=>{for(const k in pts)delete pts[k];faceMode=false;parts=null;mm=null;ui();};
  $("pupFaceB").onclick=()=>{
    if(FACE.every(f=>pts[f[0]])){FACE.forEach(f=>delete pts[f[0]]);faceMode=true;}else faceMode=!faceMode;
    if(mm){mm._skin=null;mm._fk=null;}ui();};
  const bind=(id,fn)=>{$(id).oninput=()=>{fn();if(mm){mm._fk=null;}};};
  bind("pupVel",()=>{set.vel=$("pupVel").value/10;});bind("pupAmp",()=>{set.amp=$("pupAmp").value/10;});
  bind("pupFsz",()=>{set.fsz=$("pupFsz").value/10;});$("pupParp").onchange=()=>{set.parp=$("pupParp").checked;};
  $("pupSuav").oninput=()=>{set.suav=$("pupSuav").value/10;clearTimeout(open._t2);open._t2=setTimeout(recut,150);};
  $("pupTol").oninput=()=>{clearTimeout(open._t);open._t=setTimeout(()=>{recut();},120);};
  function close(){stopped=true;cancelAnimationFrame(raf);box.hidden=true;}
  $("pupClose").onclick=close;
  $("pupOk").onclick=()=>{
    if(cur()>=0||!parts)return;
    const nm=($("pupName").value||"Mi personaje").trim();
    const m={id:"mi"+Date.now().toString(36),nombre:nm,kind:"puppet",src:srcUrl,w:W,h:H,cat:"personaje",alto:3,pts:JSON.parse(JSON.stringify(pts)),tol:+$("pupTol").value};
    m.set=Object.assign({},set);m._parts=parts;m._cut=cut;close();onDone(m);
  };
  $("pupS1").hidden=false;$("pupS2").hidden=true;$("pupMsg").textContent="";g.clearRect(0,0,cv.width,cv.height);
  box.hidden=false;stopped=false;raf=requestAnimationFrame(frame);
}
window.Puppet={open,prepare,build,ORDER,angles,POSES,EMOS,hasFace:m=>!!(m.pts&&m.pts.eyeL&&m.pts.eyeR&&m.pts.mouth)};
})();
