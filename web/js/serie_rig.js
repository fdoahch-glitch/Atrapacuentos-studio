/* Motor de personajes por piezas (recortes) · v2
   def: {w,h,feet:[x,y],esc,piezas:[{n,x,y,w,h,pv,img,alts?,rol?,lado?,m:{...}}],root?,bob?,vistas?:{perfil:def2}}
   Movimientos (m): aw/pw balanceo al caminar · ai/pi balanceo en reposo · ta giro al hablar (jaw:1 = sigue la forma de la boca)
   lift=[alto,fase] · par=pieza que sigue · osc=[base,amp,hz,fase] · wave={x,y,amp,len,mx,ph} · blink:1 parpadea
   exp={feliz:{r,dy,sx,sy},...} cambia con la expresión · spring=k cuelga y se balancea con la velocidad
   alts={v1..v4 (visemas), e_feliz/e_triste/e_sorpresa/e_enojo}: imágenes alternativas (boca). */
(function(){
"use strict";
const gl_cv=document.createElement("canvas");
let gl=null,pr=null,lp,lu,uR,uT;
function initGL(){
  if(gl)return true;
  const ga={premultipliedAlpha:true,alpha:true,antialias:true,preserveDrawingBuffer:false};
  gl=gl_cv.getContext("webgl2",ga)||gl_cv.getContext("webgl",ga)||gl_cv.getContext("experimental-webgl");
  if(!gl)return false;
  const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
  pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,"attribute vec2 p;attribute vec2 u;varying vec2 v;uniform vec2 R;void main(){v=u;gl_Position=vec4(p.x/R.x*2.-1.,1.-p.y/R.y*2.,0.,1.);}"));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,"precision mediump float;varying vec2 v;uniform sampler2D T;void main(){gl_FragColor=texture2D(T,v);}"));
  gl.linkProgram(pr);gl.useProgram(pr);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  lp=gl.getAttribLocation(pr,"p");lu=gl.getAttribLocation(pr,"u");uR=gl.getUniformLocation(pr,"R");uT=gl.getUniformLocation(pr,"T");
  return true;
}
const sm=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rot=(x,y,px,py,a)=>{const c=Math.cos(a),s=Math.sin(a),rx=x-px,ry=y-py;return [px+rx*c-ry*s,py+rx*s+ry*c];};
const TAU=Math.PI*2;

function loadImg(src){return new Promise(ok=>{if(typeof src!=="string")return ok(src);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src;});}
function tex(img){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  /* con WebGL2 se usan mipmaps: al achicar el personaje no salen dientes de sierra ni bordes pixelados */
  const mip=typeof WebGL2RenderingContext!=="undefined"&&gl instanceof WebGL2RenderingContext;if(mip)gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;
}
function mesh(p,step){
  const cols=Math.max(2,Math.ceil(p.w/step)),rows=Math.max(2,Math.ceil(p.h/step)),pos=[],uv=[],idx=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){pos.push(p.x+i/cols*p.w,p.y+j/rows*p.h);uv.push(i/cols,j/rows);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;idx.push(a,b,c,b,d,c);}
  const m={pos:Float32Array.from(pos),nv:pos.length/2,n:idx.length,bp:gl.createBuffer(),bu:gl.createBuffer(),bi:gl.createBuffer()};
  gl.bindBuffer(gl.ARRAY_BUFFER,m.bu);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.bi);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);return m;
}
async function prepOne(def){
  for(const p of def.piezas){
    const a=await loadImg(p.img);if(!a)continue;p._t=tex(a);
    if(p.alt){const b=await loadImg(p.alt);if(b)p._t2=tex(b);}
    if(p.alts){p._ta={};for(const k in p.alts){const b=await loadImg(p.alts[k]);if(b)p._ta[k]=tex(b);}}
    const st=p.m&&p.m.wave?20:(p.n==="base"||p.n==="cuerpo"?28:40);p._mesh=mesh(p,st);
  }
}
async function prep(def){
  if(def._ok)return true;if(def._prom)return def._prom;
  def._prom=(async()=>{
    if(!initGL())return false;
    await prepOne(def);
    if(def.vistas)for(const k in def.vistas)await prepOne(def.vistas[k]);
    def._ok=true;return true;})();
  return def._prom;
}
/* ---- acciones rápidas ---- */
const ACC={saludar:{d:2.6,e:"feliz"},señalar:{d:2.6,e:""},saltar:{d:1,e:"feliz"},bailar:{d:4,e:"feliz"},asustarse:{d:1.8,e:"sorpresa"},reír:{d:2.6,e:"feliz"},pensar:{d:2.8,e:""},esperar:{d:3.2,e:""},comer:{d:3,e:"feliz"},girar_cabeza:{d:2.4,e:""},girar:{d:1.2,e:""},hablar:{d:3,e:""},rebotar:{d:2,e:"feliz"}};
const env=(u,fe,fs)=>{u=clamp(u,0,1);fe=fe==null?.16:Math.max(.001,Math.min(.9,fe));fs=fs==null?.16:Math.max(.001,Math.min(.9,fs));return sm(0,fe,u)*(1-sm(1-fs,1,u));};
function acciones(def,t,o,P,rt,S){
  for(const ac of o.acts||[]){
    const e=env(ac.u,ac.fe,ac.fs)*(ac.w==null?1:ac.w),u=ac.u,k=ac.k,tt=ac.tt||t;
    if(ac.pose){const ps=ac.pose,w=ac.full?1:e;for(const p of def.piezas){const a=ps.v&&ps.v[p.rol+":"+(p.lado||"")];if(a!=null&&P[p.n])P[p.n].a+=a*w;}rt.dy-=(ps.dy||0)*def.h*w;rt.a+=(ps.ra||0)*w;if(ps.expr&&w>.1)S.expr=ps.expr;continue;}
    if(ACC[k]&&ACC[k].e&&e>.1)S.expr=ACC[k].e;
    const arms=def.piezas.filter(p=>p.rol==="brazo"||p.rol==="saluda"),legs=def.piezas.filter(p=>p.rol==="pata"),head=def.piezas.find(p=>p.rol==="cabeza");
    const out=p=>(p.lado==="i"?1:-1);
    const mainArm=arms.find(p=>p.lado==="d")||arms[0];
    const H=def.h*(def.esc||1)/(def.esc||1);
    if(k==="saludar"&&mainArm){P[mainArm.n].a+=out(mainArm)*(2.5*e+.32*e*Math.sin(TAU*2.4*tt));if(head)P[head.n].a+=.05*e*Math.sin(TAU*1.2*tt);}
    else if(k==="señalar"&&mainArm){let th=out(mainArm)*1.5;if(o.aim){th=Math.atan2(-o.aim[0],o.aim[1]);}P[mainArm.n].a+=th*e;}
    else if(k==="saltar"){const j=Math.sin(Math.PI*clamp(u,0,1));rt.dy-=def.h*.16*j;for(const p of legs)P[p.n].a+=out(p)*.45*j;for(const p of arms)P[p.n].a+=out(p)*1.7*j;S.speak=Math.max(S.speak,.0);}
    else if(k==="bailar"){rt.a+=.07*Math.sin(TAU*1.4*tt)*e;rt.dy-=Math.abs(Math.sin(TAU*1.4*tt))*def.h*.03*e;
      arms.forEach((p,i)=>{P[p.n].a+=out(p)*(1.5+.9*Math.sin(TAU*1.4*tt+(i?Math.PI:0)))*e;});if(head)P[head.n].a+=.1*Math.sin(TAU*1.4*tt+1)*e;
      legs.forEach((p,i)=>{P[p.n].a+=.18*Math.sin(TAU*1.4*tt+(i?Math.PI:0))*e;});}
    else if(k==="asustarse"){const j=Math.sin(Math.PI*clamp(u*2.2,0,1))*(u<.45?1:0);rt.dy-=def.h*.07*j;rt.a-=.07*e;for(const p of arms)P[p.n].a+=out(p)*1.9*e;if(head)P[head.n].a-=.12*e;S.speak=Math.max(S.speak,.7*e*(.6+.4*Math.sin(TAU*6*tt)));S.vis=1;}
    else if(k==="reír"){rt.dy-=Math.abs(Math.sin(TAU*4.5*tt))*def.h*.012*e;rt.a+=.012*Math.sin(TAU*9*tt)*e;if(head)P[head.n].a-=.13*e;
      S.speak=Math.max(S.speak,.55*e*(.5+.5*Math.abs(Math.sin(TAU*4.5*tt))));S.vis=1;for(const p of arms)P[p.n].a+=out(p)*.08*e*Math.sin(TAU*4.5*tt);}
    else if(k==="pensar"){if(head)P[head.n].a+=.1*e;if(mainArm)P[mainArm.n].a+=out(mainArm)*-.2*e;}
    else if(k==="esperar"){const sw=Math.sin(TAU*.5*tt);rt.a+=.012*sw*e;if(head)P[head.n].a+=.09*Math.sin(TAU*.4*tt+.6)*e;
      if(legs[0])P[legs[0].n].a+=.14*Math.max(0,Math.sin(TAU*1.6*tt))*e*out(legs[0]);arms.forEach((p,i)=>{P[p.n].a+=out(p)*(.12+.05*Math.sin(TAU*.7*tt+i))*e;});}
    else if(k==="comer"){const ch=Math.abs(Math.sin(TAU*2.6*tt));if(mainArm)P[mainArm.n].a+=out(mainArm)*(2.15+.12*ch)*e;if(head)P[head.n].a+=(.05+.05*ch)*e;S.speak=Math.max(S.speak,.4*ch*e);S.vis=1;}
    else if(k==="girar_cabeza"){if(head)P[head.n].a+=.34*Math.sin(TAU*.75*tt)*e;rt.a+=.012*Math.sin(TAU*.75*tt)*e;}
    else if(k==="hablar"){const b=.5+.5*Math.abs(Math.sin(TAU*3.1*tt+Math.sin(tt*1.3)*2));S.speak=Math.max(S.speak,.6*e*b);S.vis=Math.max(S.vis,1+Math.floor(b*3.4)%4);
      if(mainArm)P[mainArm.n].a+=out(mainArm)*(.35+.3*Math.sin(TAU*.9*tt))*e;if(head)P[head.n].a+=.05*Math.sin(TAU*1.1*tt+1)*e;}
    else if(k==="rebotar"){const j=Math.abs(Math.sin(TAU*1.5*tt/1));rt.dy-=def.h*.07*j*e;for(const p of legs)P[p.n].a+=out(p)*.18*j*e;for(const p of arms)P[p.n].a+=out(p)*.5*j*e;}
  }
}
/* física suave por defecto para una pieza (cola, pelo, orejas, ropa): cuelga desde su pivote */
function fisDef(p){const pv=p.pv||[p.x,p.y],cx=p.x+p.w/2,cy=p.y+p.h/2,d=Math.hypot(cx-pv[0],cy-pv[1])||1;return {r:[(cx-pv[0])/d,(cy-pv[1])/d],k:55,c:5.5,g:1,max:.7,w:.25};}
/* pose de cada pieza en el instante t */
function pose(def,t,o){
  const walk=o.walk||0,hz=(o.hz||1)*(o.run?1.8:1),ph=TAU*t*hz,idl=TAU*.45*t,P={};
  const S={expr:o.expr||"",speak:o.speak||0,vis:o.vis||0};
  const G=Object.assign({aw:1,bob:1,lean:0,lift:1,stride:1,duty:.62},o.gait||{}),aw=(o.run?1.5:1)*G.aw;
  for(const p of def.piezas){
    const m=p.m||{};let a=0,dy=0;
    a+=walk*aw*(m.aw||0)*Math.sin(ph+(m.pw||0));
    a+=(m.ai||0)*Math.sin(idl+(m.pi||0));
    if(m.osc)a+=m.osc[0]+m.osc[1]*Math.sin(TAU*m.osc[2]*t+(m.osc[3]||0));
    if(m.lift)dy-=walk*(o.run?1.4:1)*G.lift*m.lift[0]*Math.max(0,Math.cos(ph+m.lift[1]));
    if(m.spring)a+=m.spring*.9*clamp((o.fwd||0),-1.2,1.2);
    P[p.n]={a,dy,sx:1,sy:1,pv:p.pv};
  }
  const R=def.root||{},rt={a:(R.a||.008)*Math.sin(2*ph)*walk+.004*Math.sin(idl)+(o.run?.07*walk:0)+G.lean*walk,dy:-walk*Math.abs(Math.sin(ph))*(def.bob!==undefined?def.bob:12)*G.bob*(o.run?1.5:1)-Math.sin(TAU*.7*t)*2.2,pv:R.pv||[def.feet[0],def.feet[1]-20]};
  const by={};for(const p of def.piezas)by[p.n]=p;
  /* piernas de dos huesos: la pisada se calcula (IK) y no patina */
  for(const p of def.piezas){const k=p.m&&p.m.ik;if(!k||!by[k.shin])continue;
    const sh=by[k.shin],hip=p.pv,kn=sh.pv,ft=k.foot,L1=Math.hypot(kn[0]-hip[0],kn[1]-hip[1]),L2=Math.hypot(ft[0]-kn[0],ft[1]-kn[1]),reach=L1+L2,face=def.face||1;
    const r1=Math.atan2(kn[1]-hip[1],kn[0]-hip[0]),r2=Math.atan2(ft[1]-kn[1],ft[0]-kn[0]);
    const duty=G.duty,u=(((ph+(k.phase||0))/TAU)%1+1)%1,A=Math.min(.4*reach,(o.stride!=null?o.stride*duty*.5:.22*reach)*G.stride),H=.15*reach*G.lift*(o.run?1.5:1);
    let ox,oy;if(u<duty){const v=u/duty;ox=A*(1-2*v);oy=0;}else{const v=(u-duty)/(1-duty),e=v*v*(3-2*v);ox=-A+2*A*e;oy=-H*Math.sin(Math.PI*v);}
    const wk=Math.min(1,walk*1.4);const tx=ft[0]+face*ox*wk,ty=ft[1]+oy*wk;
    const dx=tx-hip[0],dy=ty-hip[1],dist=clamp(Math.hypot(dx,dy),Math.abs(L1-L2)+1e-3,reach-1e-3),base=Math.atan2(dy,dx),ca=clamp((L1*L1+dist*dist-L2*L2)/(2*L1*dist),-1,1),A1=Math.acos(ca);
    let best=null;for(const sg of [-1,1]){const a1=base+sg*A1,kx=hip[0]+L1*Math.cos(a1);const score=(k.bend==null?1:k.bend)*face*kx;if(!best||score>best.sc)best={a1,sc:score};}
    const a1=best.a1,kx=hip[0]+L1*Math.cos(a1),ky=hip[1]+L1*Math.sin(a1),a2=Math.atan2(ty-ky,tx-kx);
    const d1=a1-r1;P[p.n].a=d1*wk;P[sh.n].a=((a2-r2)-d1)*wk;}
  /* colgantes con resorte (pelo, orejas, bufanda): se calculan desde el pasado, así el video sale igual siempre */
  for(const p of def.piezas){let ph2=p.m&&p.m.phys;const ov=o.sec&&o.sec[p.n];
    if(ov){if(ov.on===false)continue;ph2=Object.assign({},ph2||fisDef(p),ov);}
    if(!ph2)continue;
    const dt=(1/90)*(o.fq||1),k=ph2.k||55,c=ph2.c||5.5,g=ph2.g==null?1:ph2.g,mx=ph2.max||.7,r=ph2.r||[0,1],vf=o.velFn,sd=(o.seed||0)*1.7+Array.from(p.n).reduce((a,c)=>a+c.charCodeAt(0),0)%13;let th=0,w=0;
    for(let tau=t-.9;tau<t;tau+=dt){
      const ax=vf?(vf(tau+dt)-vf(tau))/dt/900:0;
      const hh=(o.hz||1)*(o.run?1.8:1),ay=walk*(def.bob||10)*Math.pow(TAU*hh,2)*Math.cos(2*TAU*hh*tau)*.0006;
      const wind=ph2.w==null?.25:ph2.w,br=wind*Math.sin(TAU*.55*tau+sd)*Math.sin(TAU*.23*tau+sd*2);
      const vi=o.vient||0,gust=vi*(7+6*Math.sin(TAU*.31*tau+sd*.7)+3*Math.sin(TAU*.9*tau+sd)),drive=g*(r[1]*ax-r[0]*ay)*60+br*18+gust*(ph2.w==null?.25:ph2.w)*4;
      w+=(-k*th-c*w+drive)*dt;th=clamp(th+w*dt,-mx,mx);}
    P[p.n].a+=th;}
  acciones(def,t,o,P,rt,S);
  /* parpadeo y expresiones */
  const bl=((t+(o.seed||0))%3.7)/.14,blink=bl<1?Math.abs(bl-.5)*2:1;
  for(const p of def.piezas){
    const m=p.m||{},q=P[p.n];
    if(m.blink){q.sy*=.1+.9*blink*blink;}
    if(m.exp&&S.expr&&m.exp[S.expr]){const e=m.exp[S.expr];q.a+=(e.r||0);q.dy+=(e.dy||0);if(e.sx)q.sx*=e.sx;if(e.sy)q.sy*=e.sy;}
    if(m.ta){let k=S.speak;if(m.jaw){const vk=[1,1,.62,.45,.3][S.vis||1]||1;k=S.speak*vk;}q.a+=m.ta*k;}
  }
  return {parts:P,root:rt,ph,S};
}
function deform(p,P,t,po){
  const m=p.m||{},ms=p._mesh;
  if(m.wave){const w=m.wave,k=w.amp*(.35+.65*Math.min(1,po.walk||0))*(po.run?1.3:1),pp=TAU*t*(po.hz||1);
    for(let i=0;i<ms.nv;i++){const x=P[i*2],y=P[i*2+1],d=Math.hypot(x-w.x,y-w.y),th=k*Math.sin(pp-(w.ph||0)-d/w.len)*sm(0,w.mx,d),r=rot(x,y,w.x,w.y,th);P[i*2]=r[0];P[i*2+1]=r[1];}}
  if(m.bend){/* cuello flexible: toda la pieza se curva suave, más cuanto más lejos del pivote; se curva más al hablar */
    const b=m.bend,sp=(po.S&&po.S.speak)||0,k=b.amp*(.45+.9*sp)*(1+.6*Math.min(1,po.walk||0)),pp=TAU*t*(b.hz||.33)+(b.ph||0);
    for(let i=0;i<ms.nv;i++){const x=P[i*2],y=P[i*2+1],d=Math.hypot(x-b.x,y-b.y),th=k*Math.sin(pp)*sm(0,b.mx,d),r=rot(x,y,b.x,b.y,th);P[i*2]=r[0];P[i*2+1]=r[1];}}
  if(p.warps){for(const d of p.warps){
    const sc=d.sc?1+d.sc*Math.sin(TAU*(d.hz||.5)*t):1,ra=d.rot?d.rot*Math.sin(TAU*t+(d.ph||0)):0;
    for(let k=0;k<ms.nv;k++){const x=P[k*2],y=P[k*2+1],dist=Math.hypot(ms.pos[k*2]-d.cx,ms.pos[k*2+1]-d.cy),w=1-sm(d.r*.25,d.r,dist);if(w<=0)continue;
      let nx=x,ny=y;if(ra){const r=rot(x,y,d.px,d.py,ra*w);nx=r[0];ny=r[1];}if(d.sc){const f=1+(sc-1)*w;nx=d.px+(nx-d.px)*f;ny=d.py+(ny-d.py)*f;}P[k*2]=nx;P[k*2+1]=ny;}}}
}
/* dibuja el personaje dentro de ctx. o: ax,ay,s,flip,t,walk,speak,hz,vis,expr,acts,aim,fwd,run,rot,seed,alpha */
function draw(ctx,def0,o){
  let def=def0;if(o.vista&&def0.vistas&&def0.vistas[o.vista])def=def0.vistas[o.vista];
  if(!def0._ok||!gl)return false;
  const W=ctx.canvas.width,H=ctx.canvas.height;
  if(gl_cv.width!==W||gl_cv.height!==H){gl_cv.width=W;gl_cv.height=H;}
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(pr);gl.uniform2f(uR,W,H);
  const po=pose(def,o.t,o);po.walk=o.walk||0;po.hz=o.hz;po.run=o.run;
  const fx=def.feet[0],fy=def.feet[1],fl=(o.flip<0?-1:1)*(def.face||1),s=o.s,ra=o.rot||0,S=po.S;
  for(const p of def.piezas){
    if(!p._mesh||!p._t)continue;const ms=p._mesh,P=Float32Array.from(ms.pos),pp=po.parts[p.n];
    deform(p,P,o.t,po);
    const par=p.m&&p.m.par?po.parts[p.m.par]:null,rt=po.root;
    const out=new Float32Array(ms.nv*2);
    for(let i=0;i<ms.nv;i++){
      let x=P[i*2],y=P[i*2+1];
      if(pp.sx!==1||pp.sy!==1){x=pp.pv[0]+(x-pp.pv[0])*pp.sx;y=pp.pv[1]+(y-pp.pv[1])*pp.sy;}
      if(pp.a){const r=rot(x,y,pp.pv[0],pp.pv[1],pp.a);x=r[0];y=r[1];}
      y+=pp.dy;
      if(par){if(par.a){const r=rot(x,y,par.pv[0],par.pv[1],par.a);x=r[0];y=r[1];}y+=par.dy;}
      const r2=rot(x,y,rt.pv[0],rt.pv[1],rt.a);x=r2[0];y=r2[1]+rt.dy;
      let X=o.ax+(x-fx)*s*fl,Y=o.ay+(y-fy)*s;
      if(ra){const r3=rot(X,Y,o.ax,o.ay,ra);X=r3[0];Y=r3[1];}
      out[i*2]=X;out[i*2+1]=Y;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,ms.bp);gl.bufferData(gl.ARRAY_BUFFER,out,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,ms.bu);gl.enableVertexAttribArray(lu);gl.vertexAttribPointer(lu,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ms.bi);
    let T=p._t;
    if(p._ta){const sp=S.speak>.12?(p._ta["v"+(S.vis||1)]||p._t2):null;T=sp||(S.expr&&p._ta["e_"+S.expr])||p._t;}
    else if(p._t2&&p.m&&p.m.sw&&S.speak>.28)T=p._t2;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T);gl.uniform1i(uT,0);
    gl.drawElements(gl.TRIANGLES,ms.n,gl.UNSIGNED_SHORT,0);
  }
  ctx.save();ctx.globalAlpha=o.alpha===undefined?1:o.alpha;ctx.drawImage(gl_cv,0,0);ctx.restore();return true;
}
function freeOne(def){for(const p of def.piezas){if(p._t)gl.deleteTexture(p._t);if(p._t2)gl.deleteTexture(p._t2);if(p._ta)for(const k in p._ta)gl.deleteTexture(p._ta[k]);p._t=p._t2=p._ta=null;p._mesh=null;}}
function liberar(def){if(!def||!gl)return;freeOne(def);if(def.vistas)for(const k in def.vistas)freeOne(def.vistas[k]);def._ok=false;def._prom=null;}
window.SerieRig={fisDef,prep,draw,liberar,pose,ACC,ok:()=>initGL()};
})();
