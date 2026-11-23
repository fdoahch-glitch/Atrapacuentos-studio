/* Atrapacuentos Studio · GL2D
   Un contexto de dibujo con las mismas funciones que usa el Studio (trazados, rellenos, líneas, degradados, imágenes, transformaciones)
   pero que dibuja TODO con WebGL2 en la tarjeta de video: bordes suavizados con MSAA (hasta 8x) y, si se pide, supersampling.
   No usa Canvas 2D para dibujar. Los colores en texto se traducen con el propio motor de CSS (sin lienzos).
   Uso:  const g=GL2D.crear(ancho,alto,{muestras:8});  g.canvas es un canvas WebGL2;  g.fillStyle="#fa0";g.beginPath();...;g.fill(); */
(function(){
"use strict";
const TAU=Math.PI*2;
const VS=`#version 300 es
in vec2 a;uniform vec2 res;out vec2 vp;
void main(){vp=a;vec2 p=a/res*2.-1.;gl_Position=vec4(p.x,-p.y,0.,1.);}`;
const FS_RELLENO=`#version 300 es
precision highp float;
uniform int modo;uniform vec4 col;uniform float alfa;uniform mat3 inv;uniform vec2 g0;uniform vec2 g1;uniform float r0;uniform float r1;
uniform int ns;uniform float st[8];uniform vec4 sc[8];
in vec2 vp;out vec4 o;
vec4 rampa(float t){
  t=clamp(t,0.,1.);vec4 c=sc[0];
  for(int i=1;i<8;i++){if(i>=ns)break;
    if(t>=st[i-1]){c=(t>=st[i])?sc[i]:mix(sc[i-1],sc[i],(t-st[i-1])/max(st[i]-st[i-1],1e-6));}}
  return c;
}
void main(){
  vec4 c=col;
  if(modo>0){
    vec2 p=(inv*vec3(vp,1.)).xy;float t=0.;
    if(modo==1){vec2 d=g1-g0;t=dot(p-g0,d)/max(dot(d,d),1e-9);}
    else{
      vec2 cd=g1-g0;vec2 pd=p-g0;float dr=r1-r0;
      float a=dot(cd,cd)-dr*dr;float b=dot(pd,cd)+r0*dr;float cc=dot(pd,pd)-r0*r0;
      if(abs(a)<1e-6){t=cc/max(2.*b,1e-6);}
      else{float disc=b*b-a*cc;if(disc<0.){discard;}
        float s=sqrt(disc);float t1=(b+s)/a;float t2=(b-s)/a;float hi=max(t1,t2);float lo=min(t1,t2);
        t=(r0+hi*dr>=0.)?hi:lo;if(r0+t*dr<0.)discard;}
    }
    vec4 g=rampa(t);c=vec4(g.rgb*g.a,g.a);
  }
  o=c*alfa;
}`;
const FS_TEX=`#version 300 es
precision highp float;uniform sampler2D tx;uniform float alfa;in vec2 uv;out vec4 o;
void main(){o=texture(tx,uv)*alfa;}`;
const VS_TEX=`#version 300 es
in vec2 a;in vec2 u;uniform vec2 res;out vec2 uv;
void main(){uv=u;vec2 p=a/res*2.-1.;gl_Position=vec4(p.x,-p.y,0.,1.);}`;

/* color CSS -> [r,g,b,a] 0..1, con el analizador de colores del navegador (sin lienzos) */
let spanColor=null;const cacheColor=new Map();
function color(s){
  if(Array.isArray(s))return s;
  let r=cacheColor.get(s);if(r)return r;
  if(!spanColor){spanColor=document.createElement("span");spanColor.style.cssText="position:absolute;left:-9999px;visibility:hidden;color:#000";document.documentElement.appendChild(spanColor);}
  spanColor.style.color="#000";spanColor.style.color=String(s);
  const c=getComputedStyle(spanColor).color;const m=c.match(/[\d.]+/g)||[0,0,0,1];
  r=[+m[0]/255,+m[1]/255,+m[2]/255,m.length>3?+m[3]:1];
  if(cacheColor.size>2000)cacheColor.clear();cacheColor.set(s,r);return r;
}
class Degradado{
  constructor(tipo,a){this.tipo=tipo;this.a=a;this.paradas=[];}
  addColorStop(t,c){this.paradas.push([Math.max(0,Math.min(1,t)),color(c)]);this.paradas.sort((x,y)=>x[0]-y[0]);}
}
const mmul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
function minv(m){const d=m[0]*m[3]-m[1]*m[2]||1e-12;return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}

class Contexto{
  constructor(w,h,op){
    op=op||{};this.canvas=document.createElement("canvas");this.canvas.width=w;this.canvas.height=h;this.canvas.__gl2d=this;
    const gl=this.gl=this.canvas.getContext("webgl2",{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true,powerPreference:"high-performance"});
    if(!gl)throw new Error("Este equipo no tiene WebGL2. Atrapacuentos Studio lo necesita para dibujar.");
    this.muestras=Math.min(op.muestras==null?8:op.muestras,gl.getParameter(gl.MAX_SAMPLES));
    this.ver=0;this._sucio=false;this._prog={};this._tex=new WeakMap();
    this._compilar();this._buffers();this._fbo();
    this.reset();
    const self=this,tdu=this.canvas.toDataURL.bind(this.canvas),tb=this.canvas.toBlob.bind(this.canvas);
    this.canvas.toDataURL=function(){self.resolver();return tdu.apply(null,arguments);};
    this.canvas.toBlob=function(){self.resolver();return tb.apply(null,arguments);};
  }
  _sh(t,s){const gl=this.gl,x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error("GL2D shader: "+gl.getShaderInfoLog(x));return x;}
  _p(vs,fs,attr){const gl=this.gl,p=gl.createProgram();gl.attachShader(p,this._sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,this._sh(gl.FRAGMENT_SHADER,fs));
    attr.forEach((n,i)=>gl.bindAttribLocation(p,i,n));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error("GL2D programa: "+gl.getProgramInfoLog(p));
    const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const inf=gl.getActiveUniform(p,i),nm=inf.name.replace(/\[0\]$/,"");u[nm]=gl.getUniformLocation(p,inf.name);}
    return {p,u};}
  _compilar(){this._pr=this._p(VS,FS_RELLENO,["a"]);this._pt=this._p(VS_TEX,FS_TEX,["a","u"]);}
  _buffers(){const gl=this.gl;this._vao=gl.createVertexArray();this._vb=gl.createBuffer();this._vaoT=gl.createVertexArray();this._vbT=gl.createBuffer();}
  _fbo(){
    const gl=this.gl,w=this.canvas.width,h=this.canvas.height;
    if(this._f){gl.deleteFramebuffer(this._f);gl.deleteRenderbuffer(this._rc);gl.deleteRenderbuffer(this._rs);}
    this._f=gl.createFramebuffer();this._rc=gl.createRenderbuffer();this._rs=gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,this._rc);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,this.muestras,gl.RGBA8,w,h);
    gl.bindRenderbuffer(gl.RENDERBUFFER,this._rs);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,this.muestras,gl.DEPTH24_STENCIL8,w,h);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this._f);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,this._rc);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_STENCIL_ATTACHMENT,gl.RENDERBUFFER,this._rs);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("GL2D: no se pudo crear el búfer de dibujo");
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clearStencil(0);gl.clear(gl.COLOR_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
  }
  /* cambiar el tamaño del lienzo (borra) */
  redimensionar(w,h){this.canvas.width=w;this.canvas.height=h;this._fbo();this.ver++;this._sucio=true;}
  reset(){
    this.fillStyle="#000";this.strokeStyle="#000";this.lineWidth=1;this.lineCap="butt";this.lineJoin="miter";this.miterLimit=10;
    this.globalAlpha=1;this.globalCompositeOperation="source-over";this.imageSmoothingEnabled=true;this.imageSmoothingQuality="high";
    this.m=[1,0,0,1,0,0];this._pila=[];this._dash=[];this._subs=[];this._cur=null;this._ux=0;this._uy=0;
    this.font="10px sans-serif";this.textAlign="start";this.textBaseline="alphabetic";
  }
  /* ---- estado ---- */
  save(){this._pila.push({m:this.m.slice(),fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth,lineCap:this.lineCap,lineJoin:this.lineJoin,miterLimit:this.miterLimit,globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation,dash:this._dash,font:this.font,textAlign:this.textAlign,textBaseline:this.textBaseline,imageSmoothingEnabled:this.imageSmoothingEnabled});}
  restore(){const s=this._pila.pop();if(!s)return;this.m=s.m;this.fillStyle=s.fillStyle;this.strokeStyle=s.strokeStyle;this.lineWidth=s.lineWidth;this.lineCap=s.lineCap;this.lineJoin=s.lineJoin;this.miterLimit=s.miterLimit;this.globalAlpha=s.globalAlpha;this.globalCompositeOperation=s.globalCompositeOperation;this._dash=s.dash;this.font=s.font;this.textAlign=s.textAlign;this.textBaseline=s.textBaseline;this.imageSmoothingEnabled=s.imageSmoothingEnabled;}
  translate(x,y){this.m=mmul(this.m,[1,0,0,1,x,y]);}
  scale(x,y){this.m=mmul(this.m,[x,0,0,y,0,0]);}
  rotate(a){const c=Math.cos(a),s=Math.sin(a);this.m=mmul(this.m,[c,s,-s,c,0,0]);}
  transform(a,b,c,d,e,f){this.m=mmul(this.m,[a,b,c,d,e,f]);}
  setTransform(a,b,c,d,e,f){if(a&&a.a!==undefined){this.m=[a.a,a.b,a.c,a.d,a.e,a.f];}else this.m=[a,b,c,d,e,f];}
  resetTransform(){this.m=[1,0,0,1,0,0];}
  getTransform(){const m=this.m;return {a:m[0],b:m[1],c:m[2],d:m[3],e:m[4],f:m[5]};}
  setLineDash(d){this._dash=(d||[]).slice();if(this._dash.length%2)this._dash=this._dash.concat(this._dash);}
  getLineDash(){return this._dash.slice();}
  createLinearGradient(x0,y0,x1,y1){return new Degradado(1,[x0,y0,x1,y1]);}
  createRadialGradient(x0,y0,r0,x1,y1,r1){return new Degradado(2,[x0,y0,r0,x1,y1,r1]);}
  /* ---- trazados (se guardan ya transformados al espacio de pantalla) ---- */
  _tp(x,y){const m=this.m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}
  _escala(){const m=this.m;return Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))||1e-6;}
  beginPath(){this._subs=[];this._cur=null;}
  moveTo(x,y){this._cur={p:[this._tp(x,y)],c:false,us:[x,y]};this._subs.push(this._cur);this._ux=x;this._uy=y;}
  _asegura(x,y){if(!this._cur||this._cur.c){const sx=this._cur?this._cur.sx:x,sy=this._cur?this._cur.sy:y;this._cur={p:[this._tp(sx,sy)],c:false,us:[sx,sy]};this._subs.push(this._cur);}}
  lineTo(x,y){if(!this._cur){this.moveTo(x,y);return;}this._asegura(x,y);this._cur.p.push(this._tp(x,y));this._ux=x;this._uy=y;}
  closePath(){if(!this._cur)return;this._cur.c=true;const s=this._cur.us||[this._ux,this._uy];this._cur.sx=s[0];this._cur.sy=s[1];this._ux=s[0];this._uy=s[1];}
  quadraticCurveTo(cx,cy,x,y){
    if(!this._cur)this.moveTo(cx,cy);this._asegura(cx,cy);
    const p0=this._cur.p[this._cur.p.length-1],c=this._tp(cx,cy),p1=this._tp(x,y);
    const L=Math.hypot(c[0]-p0[0],c[1]-p0[1])+Math.hypot(p1[0]-c[0],p1[1]-c[1]);const n=Math.max(4,Math.min(80,Math.ceil(Math.sqrt(L)*1.4)));
    for(let i=1;i<=n;i++){const t=i/n,u=1-t;this._cur.p.push([u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]);}
    this._ux=x;this._uy=y;}
  bezierCurveTo(c1x,c1y,c2x,c2y,x,y){
    if(!this._cur)this.moveTo(c1x,c1y);this._asegura(c1x,c1y);
    const p0=this._cur.p[this._cur.p.length-1],a=this._tp(c1x,c1y),b=this._tp(c2x,c2y),p1=this._tp(x,y);
    const L=Math.hypot(a[0]-p0[0],a[1]-p0[1])+Math.hypot(b[0]-a[0],b[1]-a[1])+Math.hypot(p1[0]-b[0],p1[1]-b[1]);const n=Math.max(6,Math.min(100,Math.ceil(Math.sqrt(L)*1.6)));
    for(let i=1;i<=n;i++){const t=i/n,u=1-t;this._cur.p.push([u*u*u*p0[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t*t*t*p1[0],u*u*u*p0[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t*t*t*p1[1]]);}
    this._ux=x;this._uy=y;}
  ellipse(x,y,rx,ry,rot,a0,a1,ccw){
    rot=rot||0;let da=a1-a0;
    if(!ccw){if(da<0)da=(da%TAU)+TAU;if(da>TAU)da=TAU;}else{if(da>0)da=(da%TAU)-TAU;if(da<-TAU)da=-TAU;}
    const rd=Math.max(rx,ry)*this._escala();const step=rd>0.2?2*Math.acos(Math.max(0,1-0.08/rd)):1;
    const n=Math.max(8,Math.ceil(Math.abs(da)/Math.max(step,0.01)));const cr=Math.cos(rot),sr=Math.sin(rot);
    const pt=a=>{const ex=rx*Math.cos(a),ey=ry*Math.sin(a);return [x+ex*cr-ey*sr,y+ex*sr+ey*cr];};
    const s=pt(a0);
    if(!this._cur||this._cur.c)this.moveTo(s[0],s[1]);else{this._cur.p.push(this._tp(s[0],s[1]));}
    for(let i=1;i<=n;i++){const q=pt(a0+da*i/n);this._cur.p.push(this._tp(q[0],q[1]));}
    const e=pt(a0+da);this._ux=e[0];this._uy=e[1];}
  arc(x,y,r,a0,a1,ccw){this.ellipse(x,y,r,r,0,a0,a1,ccw);}
  arcTo(x1,y1,x2,y2,r){
    if(!this._cur){this.moveTo(x1,y1);return;}
    const x0=this._ux,y0=this._uy;
    const v1x=x0-x1,v1y=y0-y1,v2x=x2-x1,v2y=y2-y1,l1=Math.hypot(v1x,v1y),l2=Math.hypot(v2x,v2y);
    if(!l1||!l2||!r){this.lineTo(x1,y1);return;}
    const cross=v1x*v2y-v1y*v2x;if(Math.abs(cross)<1e-9){this.lineTo(x1,y1);return;}
    const ang=Math.acos(Math.max(-1,Math.min(1,(v1x*v2x+v1y*v2y)/(l1*l2))));const t=r/Math.tan(ang/2);
    const p1x=x1+v1x/l1*t,p1y=y1+v1y/l1*t,p2x=x1+v2x/l2*t,p2y=y1+v2y/l2*t;
    const bx=v1x/l1+v2x/l2,by=v1y/l1+v2y/l2,bl=Math.hypot(bx,by)||1,d=r/Math.sin(ang/2);
    const ccx=x1+bx/bl*d,ccy=y1+by/bl*d;
    this.lineTo(p1x,p1y);
    this.arc(ccx,ccy,r,Math.atan2(p1y-ccy,p1x-ccx),Math.atan2(p2y-ccy,p2x-ccx),cross>0);}
  rect(x,y,w,h){this.moveTo(x,y);this._cur.p.push(this._tp(x+w,y),this._tp(x+w,y+h),this._tp(x,y+h));this._cur.c=true;this._cur.sx=x;this._cur.sy=y;this._ux=x;this._uy=y;}
  roundRect(x,y,w,h,r){r=Math.min(Array.isArray(r)?r[0]:(r||0),Math.abs(w)/2,Math.abs(h)/2);if(!r){this.rect(x,y,w,h);return;}
    this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();}
  /* ---- pintura ---- */
  _estado(op){
    const gl=this.gl;gl.enable(gl.BLEND);
    switch(op){
      case "multiply":gl.blendFuncSeparate(gl.DST_COLOR,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);break;
      case "lighter":gl.blendFunc(gl.ONE,gl.ONE);break;
      case "destination-out":gl.blendFunc(gl.ZERO,gl.ONE_MINUS_SRC_ALPHA);break;
      case "clear":gl.blendFunc(gl.ZERO,gl.ZERO);break;
      case "source-atop":gl.blendFunc(gl.DST_ALPHA,gl.ONE_MINUS_SRC_ALPHA);break;
      case "destination-over":gl.blendFunc(gl.ONE_MINUS_DST_ALPHA,gl.ONE);break;
      case "screen":gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_COLOR);break;
      default:gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    }
  }
  _usa(){const gl=this.gl;if(gl.getParameter(gl.FRAMEBUFFER_BINDING)!==this._f)gl.bindFramebuffer(gl.FRAMEBUFFER,this._f);gl.viewport(0,0,this.canvas.width,this.canvas.height);this._marca();}
  _marca(){this.ver++;this._sucio=true;}
  /* pinta el conjunto de triángulos ya cargados en el búfer usando el estencil, y luego cubre su caja con la pintura */
  _pintaTris(verts,regla,estilo,op,alfa){
    if(verts.length<6)return;
    const gl=this.gl,W=this.canvas.width,H=this.canvas.height;this._usa();
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<verts.length;i+=2){const x=verts[i],y=verts[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
    x0=Math.max(0,Math.floor(x0)-1);y0=Math.max(0,Math.floor(y0)-1);x1=Math.min(W,Math.ceil(x1)+1);y1=Math.min(H,Math.ceil(y1)+1);if(x1<=x0||y1<=y0)return;
    const P=this._pr;gl.useProgram(P.p);gl.uniform2f(P.u.res,W,H);
    gl.bindVertexArray(this._vao);gl.bindBuffer(gl.ARRAY_BUFFER,this._vb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.bufferData(gl.ARRAY_BUFFER,verts instanceof Float32Array?verts:new Float32Array(verts),gl.STREAM_DRAW);
    gl.enable(gl.STENCIL_TEST);gl.colorMask(false,false,false,false);gl.stencilMask(0xff);
    if(regla==="union"){gl.stencilFunc(gl.ALWAYS,1,0xff);gl.stencilOp(gl.KEEP,gl.KEEP,gl.REPLACE);}
    else if(regla==="evenodd"){gl.stencilFunc(gl.ALWAYS,0,0xff);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INVERT);}
    else{gl.stencilFunc(gl.ALWAYS,0,0xff);gl.stencilOpSeparate(gl.FRONT,gl.KEEP,gl.KEEP,gl.INCR_WRAP);gl.stencilOpSeparate(gl.BACK,gl.KEEP,gl.KEEP,gl.DECR_WRAP);}
    gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES,0,verts.length/2);
    /* cubrir con la pintura donde el estencil no es cero, y dejarlo en cero */
    gl.colorMask(true,true,true,true);gl.stencilFunc(gl.NOTEQUAL,0,0xff);gl.stencilOp(gl.ZERO,gl.ZERO,gl.ZERO);
    this._estado(op);this._cargaPintura(estilo,alfa);
    const quad=new Float32Array([x0,y0,x1,y0,x0,y1,x0,y1,x1,y0,x1,y1]);gl.bufferData(gl.ARRAY_BUFFER,quad,gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES,0,6);gl.disable(gl.STENCIL_TEST);
  }
  _cargaPintura(est,alfa){
    const gl=this.gl,u=this._pr.u;gl.uniform1f(u.alfa,alfa);
    if(est instanceof Degradado&&est.paradas.length){
      const inv=minv(this.m);gl.uniformMatrix3fv(u.inv,false,[inv[0],inv[1],0,inv[2],inv[3],0,inv[4],inv[5],1]);
      const a=est.a;gl.uniform1i(u.modo,est.tipo);
      if(est.tipo===1){gl.uniform2f(u.g0,a[0],a[1]);gl.uniform2f(u.g1,a[2],a[3]);gl.uniform1f(u.r0,0);gl.uniform1f(u.r1,0);}
      else{gl.uniform2f(u.g0,a[0],a[1]);gl.uniform2f(u.g1,a[3],a[4]);gl.uniform1f(u.r0,a[2]);gl.uniform1f(u.r1,a[5]);}
      const ps=est.paradas.slice(0,8),T=new Float32Array(8),C=new Float32Array(32);
      ps.forEach((s,i)=>{T[i]=s[0];C.set(s[1],i*4);});gl.uniform1i(u.ns,ps.length);gl.uniform1fv(u.st,T);gl.uniform4fv(u.sc,C);gl.uniform4f(u.col,0,0,0,0);
    }else{
      const c=color(est instanceof Degradado?"#0000":est);gl.uniform1i(u.modo,0);gl.uniform4f(u.col,c[0]*c[3],c[1]*c[3],c[2]*c[3],c[3]);
    }
  }
  /* relleno: abanico de triángulos por cada subtrazado (regla del cero o par-impar) */
  _tris(){const v=[];for(const s of this._subs){const p=s.p;if(p.length<3)continue;const a=p[0];for(let i=1;i<p.length-1;i++)v.push(a[0],a[1],p[i][0],p[i][1],p[i+1][0],p[i+1][1]);}return v;}
  fill(regla){this._pintaTris(this._tris(),regla==="evenodd"?"evenodd":"nonzero",this.fillStyle,this.globalCompositeOperation,this.globalAlpha);}
  fillRect(x,y,w,h){const sv=this._subs,sc=this._cur,ux=this._ux,uy=this._uy;this.beginPath();this.rect(x,y,w,h);this.fill();this._subs=sv;this._cur=sc;this._ux=ux;this._uy=uy;}
  clearRect(x,y,w,h){const sv=this._subs,sc=this._cur,ux=this._ux,uy=this._uy;this.beginPath();this.rect(x,y,w,h);this._pintaTris(this._tris(),"nonzero","#000","clear",1);this._subs=sv;this._cur=sc;this._ux=ux;this._uy=uy;}
  strokeRect(x,y,w,h){const sv=this._subs,sc=this._cur,ux=this._ux,uy=this._uy;this.beginPath();this.rect(x,y,w,h);this.stroke();this._subs=sv;this._cur=sc;this._ux=ux;this._uy=uy;}
  /* línea: cada tramo es un rectángulo; uniones y extremos se agregan como polígonos; todo se une por el estencil */
  stroke(){
    const ancho=this.lineWidth*this._escala();if(!(ancho>0))return;
    const v=[],hw=ancho/2,cap=this.lineCap,join=this.lineJoin,ml=this.miterLimit;
    const dash=this._dash.length?this._dash.map(d=>d*this._escala()):null;
    const circ=(cx,cy)=>{const n=Math.max(8,Math.min(48,Math.ceil(Math.sqrt(hw)*5)));for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;v.push(cx,cy,cx+Math.cos(a0)*hw,cy+Math.sin(a0)*hw,cx+Math.cos(a1)*hw,cy+Math.sin(a1)*hw);}};
    const seg=(ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy);if(l<1e-6)return;const nx=-dy/l*hw,ny=dx/l*hw;v.push(ax+nx,ay+ny,bx+nx,by+ny,ax-nx,ay-ny,ax-nx,ay-ny,bx+nx,by+ny,bx-nx,by-ny);};
    const unir=(px,py,ax,ay,bx,by)=>{ /* unión en el punto p entre el tramo que llega desde a y el que sale hacia b */
      if(join==="round"){circ(px,py);return;}
      const d1x=px-ax,d1y=py-ay,d2x=bx-px,d2y=by-py,l1=Math.hypot(d1x,d1y),l2=Math.hypot(d2x,d2y);if(l1<1e-6||l2<1e-6)return;
      const u1x=d1x/l1,u1y=d1y/l1,u2x=d2x/l2,u2y=d2y/l2,cr=u1x*u2y-u1y*u2x;if(Math.abs(cr)<1e-6)return;
      const s=cr>0?-1:1;const n1x=-u1y*hw*s,n1y=u1x*hw*s,n2x=-u2y*hw*s,n2y=u2x*hw*s;
      v.push(px,py,px+n1x,py+n1y,px+n2x,py+n2y);
      if(join==="miter"){const cosT=u1x*u2x+u1y*u2y;const lim=1/Math.sin(Math.acos(Math.max(-1,Math.min(1,-cosT)))/2);
        if(isFinite(lim)&&lim<=ml){const mx=n1x+n2x,my=n1y+n2y,ml2=mx*mx+my*my;if(ml2>1e-9){const k=2*hw*hw/ml2;v.push(px+n1x,py+n1y,px+n2x,py+n2y,px+mx*k,py+my*k);}}}};
    const tapa=(px,py,qx,qy)=>{ /* extremo en p, mirando desde q hacia p */
      if(cap==="round"){circ(px,py);return;}if(cap!=="square")return;
      const dx=px-qx,dy=py-qy,l=Math.hypot(dx,dy);if(l<1e-6)return;const ux=dx/l*hw,uy=dy/l*hw,nx=-uy,ny=ux;
      v.push(px+nx,py+ny,px+nx+ux,py+ny+uy,px-nx,py-ny,px-nx,py-ny,px+nx+ux,py+ny+uy,px-nx+ux,py-ny+uy);};
    const lineaPor=(P,cerrado)=>{
      const n=P.length;if(n<2){if(n===1&&cap!=="butt"&&!cerrado){circ(P[0][0],P[0][1]);}return;}
      const q=cerrado?P.concat([P[0]]):P;
      for(let i=0;i<q.length-1;i++)seg(q[i][0],q[i][1],q[i+1][0],q[i+1][1]);
      for(let i=1;i<q.length-1;i++)unir(q[i][0],q[i][1],q[i-1][0],q[i-1][1],q[i+1][0],q[i+1][1]);
      if(cerrado&&n>2)unir(q[0][0],q[0][1],q[n-1][0],q[n-1][1],q[1][0],q[1][1]);
      if(!cerrado){tapa(q[0][0],q[0][1],q[1][0],q[1][1]);tapa(q[q.length-1][0],q[q.length-1][1],q[q.length-2][0],q[q.length-2][1]);}
    };
    for(const s of this._subs){
      let P=s.p;if(!dash||!dash.some(d=>d>0)){
        /* quitar puntos repetidos */
        const Q=[P[0]];for(let i=1;i<P.length;i++){const a=Q[Q.length-1];if(Math.abs(P[i][0]-a[0])>1e-6||Math.abs(P[i][1]-a[1])>1e-6)Q.push(P[i]);}
        lineaPor(Q,s.c&&Q.length>2);continue;}
      const Q=s.c?P.concat([P[0]]):P;let i0=0,pos=0,on=true,rest=dash[0];let trozo=[Q[0]];
      for(let i=0;i<Q.length-1;i++){
        let ax=Q[i][0],ay=Q[i][1];const bx=Q[i+1][0],by=Q[i+1][1];let l=Math.hypot(bx-ax,by-ay);if(l<1e-9)continue;const ux=(bx-ax)/l,uy=(by-ay)/l;
        while(l>rest){ax+=ux*rest;ay+=uy*rest;l-=rest;
          if(on){trozo.push([ax,ay]);lineaPor(trozo,false);trozo=[];}else{trozo=[[ax,ay]];}
          on=!on;i0=(i0+1)%dash.length;rest=dash[i0]||1e-6;}
        rest-=l;if(on)trozo.push([bx,by]);}
      if(on&&trozo.length>1)lineaPor(trozo,false);
    }
    this._pintaTris(v,"union",this.strokeStyle,this.globalCompositeOperation,this.globalAlpha);
  }
  /* ---- imágenes ---- */
  _textura(src){
    const gl=this.gl;let t=this._tex.get(src);
    const g2=src.__gl2d;if(g2){g2.resolver();}
    const ver=g2?g2.ver:0;
    if(!t){t={tx:gl.createTexture(),ver:-1,w:0,h:0};this._tex.set(src,t);}
    const estatica=!g2&&!(src instanceof HTMLCanvasElement)&&!(src instanceof HTMLVideoElement);
    if(t.ver!==ver||!estatica&&!g2){
      gl.bindTexture(gl.TEXTURE_2D,t.tx);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
      t.w=src.naturalWidth||src.videoWidth||src.width;t.h=src.naturalHeight||src.videoHeight||src.height;
      gl.generateMipmap(gl.TEXTURE_2D);t.ver=ver;
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    }
    return t;
  }
  drawImage(src,a,b,c,d,e,f,g,h){
    let sx=0,sy=0,sw,sh,dx,dy,dw,dh;const t=this._textura(src);const W0=t.w,H0=t.h;if(!W0||!H0)return;
    if(arguments.length<=5){dx=a;dy=b;dw=c===undefined?W0:c;dh=d===undefined?H0:d;sw=W0;sh=H0;}
    else{sx=a;sy=b;sw=c;sh=d;dx=e;dy=f;dw=g;dh=h;}
    const gl=this.gl,W=this.canvas.width,H=this.canvas.height;this._usa();
    const P=this._pt;gl.useProgram(P.p);gl.uniform2f(P.u.res,W,H);gl.uniform1f(P.u.alfa,this.globalAlpha);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t.tx);gl.uniform1i(P.u.tx,0);
    const suave=this.imageSmoothingEnabled;
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,suave?gl.LINEAR_MIPMAP_LINEAR:gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,suave?gl.LINEAR:gl.NEAREST);
    const u0=sx/W0,v0=sy/H0,u1=(sx+sw)/W0,v1=(sy+sh)/H0;
    const A=this._tp(dx,dy),B=this._tp(dx+dw,dy),C=this._tp(dx,dy+dh),D=this._tp(dx+dw,dy+dh);
    const q=new Float32Array([A[0],A[1],u0,v0,B[0],B[1],u1,v0,C[0],C[1],u0,v1,C[0],C[1],u0,v1,B[0],B[1],u1,v0,D[0],D[1],u1,v1]);
    gl.bindVertexArray(this._vaoT);gl.bindBuffer(gl.ARRAY_BUFFER,this._vbT);gl.bufferData(gl.ARRAY_BUFFER,q,gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,16,8);
    gl.disable(gl.STENCIL_TEST);this._estado(this.globalCompositeOperation);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  /* ---- salida ---- */
  /* pasa lo dibujado (con suavizado) al canvas que se ve o se lee */
  resolver(){
    if(!this._sucio)return;const gl=this.gl,W=this.canvas.width,H=this.canvas.height;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,this._f);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);
    gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,this._f);
    this._sucio=false;
  }
  getImageData(x,y,w,h){
    this.resolver();const gl=this.gl,H=this.canvas.height,px=new Uint8Array(w*h*4);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(x,H-y-h,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.bindFramebuffer(gl.FRAMEBUFFER,this._f);
    const o=new Uint8ClampedArray(w*h*4);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const s=((h-1-j)*w+i)*4,d=(j*w+i)*4,a=px[s+3];
      if(a){o[d]=Math.min(255,Math.round(px[s]*255/a));o[d+1]=Math.min(255,Math.round(px[s+1]*255/a));o[d+2]=Math.min(255,Math.round(px[s+2]*255/a));}o[d+3]=a;}
    return {width:w,height:h,data:o};
  }
}
window.GL2D={crear:(w,h,op)=>new Contexto(w,h,op),Contexto,color};
})();
