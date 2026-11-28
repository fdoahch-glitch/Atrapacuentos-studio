/* Atrapacuentos Studio · «Aspecto» en la GPU.
   Aplica con un shader (WebGL2) lo que el dibujo clásico hacía con muchas capas de Canvas 2D: brillo suave (bloom), luz de foco,
   color cálido/frío, saturación, viñeta y grano. Usa las mismas fórmulas que serie_look.js, así la imagen sale igual.
   Si algo falla, se vuelve al dibujo clásico (Look.aspecto). */
(function(){
"use strict";
const A={activo:false,fallo:"",ultimoMs:0};
let gl=null,cv=null,P={},src=null,fb=[],bw=0,bh=0,quad=null;

const VS=`#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
/* paso 1: lo claro de la imagen, reducida a 1/8 (brillo y contraste como en el dibujo clásico) */
const FS_DOWN=`#version 300 es
precision highp float;uniform sampler2D uS;uniform vec2 uR;out vec4 o;
void main(){vec2 uv=gl_FragCoord.xy/uR;vec2 d=1./uR*3.;vec3 c=vec3(0.);
 for(int i=0;i<4;i++)for(int j=0;j<4;j++)c+=texture(uS,uv+(vec2(float(i),float(j))-1.5)*d*.67).rgb;c/=16.;
 c*=1.15;c=(c-.5)*1.15+.5;o=vec4(clamp(c,0.,1.),1.);}`;
const FS_BLUR=`#version 300 es
precision highp float;uniform sampler2D uS;uniform vec2 uR;uniform vec2 uD;out vec4 o;
void main(){vec2 uv=gl_FragCoord.xy/uR;vec3 c=vec3(0.);float w[5]=float[5](.2270,.1946,.1216,.0541,.0162);
 c+=texture(uS,uv).rgb*w[0];for(int i=1;i<5;i++){c+=texture(uS,uv+uD*float(i)/uR).rgb*w[i];c+=texture(uS,uv-uD*float(i)/uR).rgb*w[i];}o=vec4(c,1.);}`;
const FS_FIN=`#version 300 es
precision highp float;
uniform sampler2D uS;uniform sampler2D uB;uniform vec2 uR;
uniform float uBl;uniform float uFo;uniform vec2 uFc;uniform float uRr;uniform float uCa;uniform float uSk;uniform float uSs;uniform float uVi;uniform float uGr;uniform float uGs;uniform float uGp;uniform float uGn;
out vec4 o;
float hash(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
float lum(vec3 c){return dot(c,vec3(.3,.59,.11));}
vec3 clipc(vec3 c){float l=lum(c),n=min(min(c.r,c.g),c.b),x=max(max(c.r,c.g),c.b);
 if(n<0.)c=l+(c-l)*l/(l-n);if(x>1.)c=l+(c-l)*(1.-l)/(x-l);return c;}
vec3 setlum(vec3 c,float l){return clipc(c+(l-lum(c)));}
float sat(vec3 c){return max(max(c.r,c.g),c.b)-min(min(c.r,c.g),c.b);}
vec3 setsat(vec3 c,float s){float mx=max(max(c.r,c.g),c.b),mn=min(min(c.r,c.g),c.b);if(mx<=mn)return vec3(0.);return (c-mn)*s/(mx-mn);}
float softlum(float cb,float cs){if(cs<=.5)return cb-(1.-2.*cs)*cb*(1.-cb);float d=cb<=.25?((16.*cb-12.)*cb+4.)*cb:sqrt(cb);return cb+(2.*cs-1.)*(d-cb);}
void main(){
 vec2 uv=gl_FragCoord.xy/uR;vec2 pt=vec2(gl_FragCoord.x,uR.y-gl_FragCoord.y);
 vec3 c=texture(uS,uv).rgb;
 if(uBl>0.){vec3 b=texture(uB,uv).rgb;c=mix(c,1.-(1.-c)*(1.-b),uBl);}
 if(uFo>0.){float d=length(pt-uFc);float t=clamp((d-uRr*.15)/(uRr*.85),0.,1.);float base=1.-uFo;
  c*=mix(vec3(1.),vec3(base,base,min(1.,base+14./255.)),t);
  float a=uFo*.38*(1.-clamp(d/(uRr*.8),0.,1.));vec3 col=vec3(1.,236./255.,190./255.);c=mix(c,1.-(1.-c)*(1.-col),a);}
 if(uCa!=0.){vec3 cs=uCa>0.?vec3(1.,154./255.,60./255.):vec3(74./255.,125./255.,1.);vec3 r=vec3(softlum(c.r,cs.r),softlum(c.g,cs.g),softlum(c.b,cs.b));c=mix(c,r,min(1.,abs(uCa)));}
 if(uSk>0.){vec3 r=setlum(setsat(c,uSs),lum(c));c=mix(c,r,uSk);}
 if(uVi>0.){float d=length(pt-uR*.5);float t=clamp((d-uR.y*.35)/(uR.y*.6),0.,1.);c*=1.-t*uVi;}
 if(uGr>0.){vec2 cell=floor(gl_FragCoord.xy/uGs);float h=hash(cell+uGn*7.13);
  if(h<uGp){float w=hash(cell+uGn*3.7+11.)>.5?1.:0.;vec3 cs=vec3(w);vec3 ov;for(int k=0;k<3;k++){float cb=c[k];ov[k]=cb<=.5?2.*cb*cs[k]:1.-(1.-cs[k])*(1.-(2.*cb-1.));}c=mix(c,ov,uGr);}}
 o=vec4(clamp(c,0.,1.),1.);}`;
function prog(vs,fs){
  const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,"p");gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name);}
  return {p,u};
}
function tex(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
A.iniciar=function(){
  if(gl)return true;
  try{
    cv=document.createElement("canvas");cv.width=16;cv.height=16;
    gl=cv.getContext("webgl2",{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:"high-performance"});
    if(!gl)throw new Error("WebGL2 no está disponible");
    P.down=prog(VS,FS_DOWN);P.blur=prog(VS,FS_BLUR);P.fin=prog(VS,FS_FIN);
    quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    src=tex();const mk=()=>{const t=tex(),f=gl.createFramebuffer();return {t,f};};fb=[mk(),mk(),mk()];
    A.activo=true;A.fallo="";return true;
  }catch(e){A.fallo=String(e&&e.message||e);A.activo=false;gl=null;console.warn("Aspecto GPU:",e);return false;}
};
function ajustar(W,H){
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const w=Math.max(64,W>>3),h=Math.max(36,H>>3);
  if(w!==bw||h!==bh){bw=w;bh=h;for(const f of fb){gl.bindTexture(gl.TEXTURE_2D,f.t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bw,bh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,f.f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,f.t,0);}}
}
function pase(pr,destino,W,H,texIn,fn){
  gl.useProgram(pr.p);gl.bindFramebuffer(gl.FRAMEBUFFER,destino);gl.viewport(0,0,W,H);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texIn);if(pr.u.uS)gl.uniform1i(pr.u.uS,0);if(pr.u.uR)gl.uniform2f(pr.u.uR,W,H);
  if(fn)fn(pr.u);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
/* ¿este aspecto necesita pasar por la GPU? */
A.necesita=sc=>{const L=sc.look||{};return L.bloom>0||L.foco>0||!!L.calor||(L.sat!=null&&L.sat!==1)||L.vig>0||L.grano>0;};
/* g: lienzo 2D con la imagen ya dibujada; el resultado queda de vuelta en g. Devuelve true si lo logró. */
A.apply=function(g,sc,t){
  if(!A.activo)return false;const L=sc.look||{};if(!A.necesita(sc))return true;
  const a0=performance.now();
  try{
    const W=g.canvas.width,H=g.canvas.height;ajustar(W,H);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,src);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,g.canvas);
    const bl=L.bloom>0?Math.min(.85,L.bloom*.9):0;
    if(bl>0){
      pase(P.down,fb[0].f,bw,bh,src);
      pase(P.blur,fb[1].f,bw,bh,fb[0].t,u=>gl.uniform2f(u.uD,1.5,0));
      pase(P.blur,fb[0].f,bw,bh,fb[1].t,u=>gl.uniform2f(u.uD,0,1.5));
    }
    const k=Math.min(.92,L.foco*.9),hasSat=L.sat!=null&&L.sat!==1,sz=Math.max(2,Math.round(W/400));
    pase(P.fin,null,W,H,src,u=>{
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fb[0].t);gl.uniform1i(u.uB,1);
      gl.uniform1f(u.uBl,bl);gl.uniform1f(u.uFo,L.foco>0?k:0);gl.uniform2f(u.uFc,(L.fx!=null?L.fx:.5)*W,(L.fy!=null?L.fy:.4)*H);gl.uniform1f(u.uRr,(L.fr!=null?L.fr:.45)*Math.max(W,H));
      gl.uniform1f(u.uCa,L.calor||0);
      /* saturación como el modo «saturation» del Canvas 2D: sat>1 empuja hacia el rojo #ff3a3a (saturación .7725), sat<1 hacia gris */
      gl.uniform1f(u.uSk,hasSat?(L.sat>1?Math.min(1,L.sat-1):Math.min(1,1-L.sat)):0);gl.uniform1f(u.uSs,L.sat>1?(255-58)/255:0);
      gl.uniform1f(u.uVi,L.vig>0?Math.min(.85,L.vig):0);
      gl.uniform1f(u.uGr,L.grano>0?Math.min(.35,L.grano*.35):0);gl.uniform1f(u.uGs,sz);gl.uniform1f(u.uGp,500*sz*sz/(W*H));gl.uniform1f(u.uGn,Math.floor(t*24));
    });
    gl.finish&&0;
    g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation="copy";g.drawImage(cv,0,0,W,H);g.restore();
    A.ultimoMs=performance.now()-a0;return true;
  }catch(e){A.fallo=String(e&&e.message||e);A.activo=false;console.warn("Aspecto GPU falló:",e);return false;}
};
window.GPUAsp=A;
})();
