/* Lector de cuadros en la GPU: toma el lienzo ya dibujado (que vive en la tarjeta de video), lo convierte a YUV 4:2:0 con un shader
   y lo trae a memoria sin frenar (lectura asíncrona con búfer y cerca de sincronía). Así el cuadro viaja 62 % más liviano
   y la tarjeta puede dibujar el siguiente mientras se envía el anterior. Si algo falla, devuelve null y se usa el camino RGBA. */
(function(){
if(!window.Nativo)return;
const VS=`#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
/* cada texel de salida guarda 4 muestras seguidas de una fila: Y (H filas) y luego U|V lado a lado (H/2 filas) */
const FS=`#version 300 es
precision highp float;precision highp int;
uniform sampler2D src;uniform ivec2 dim;
out vec4 o;
vec3 px(int x,int y){return texelFetch(src,ivec2(x,y),0).rgb*255.;}
float yv(vec3 c){return 16.+(0.2126*c.r+0.7152*c.g+0.0722*c.b)*219./255.;}
float uv(vec3 c){return 128.+(-0.1146*c.r-0.3854*c.g+0.5*c.b)*224./255.;}
float vv(vec3 c){return 128.+(0.5*c.r-0.4542*c.g-0.0458*c.b)*224./255.;}
float muestra(int n,int ty){
  int W=dim.x,H=dim.y;
  if(ty<H)return yv(px(n,ty));
  int cy=ty-H,cw=W/2;bool esV=n>=cw;int cx=esV?n-cw:n;
  vec3 c=(px(2*cx,2*cy)+px(2*cx+1,2*cy)+px(2*cx,2*cy+1)+px(2*cx+1,2*cy+1))*.25;
  return esV?vv(c):uv(c);
}
void main(){
  int tx=int(gl_FragCoord.x),ty=int(gl_FragCoord.y);
  vec4 r;
  for(int k=0;k<4;k++)r[k]=clamp(floor(muestra(4*tx+k,ty)+.5),0.,255.)/255.;
  o=r;
}`;
function compilar(gl,tipo,fuente){const s=gl.createShader(tipo);gl.shaderSource(s,fuente);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
Nativo.lector=function(W,H){
  if(W%8||H%2)return null;
  try{
    const cv=document.createElement("canvas"),Wt=W/4,Ht=H*3/2;cv.width=Wt;cv.height=Ht;
    const gl=cv.getContext("webgl2",{antialias:false,alpha:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:"high-performance"});
    if(!gl)return null;
    const pr=gl.createProgram();gl.attachShader(pr,compilar(gl,gl.VERTEX_SHADER,VS));gl.attachShader(pr,compilar(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,W,H);
    gl.uniform1i(gl.getUniformLocation(pr,"src"),0);gl.uniform2i(gl.getUniformLocation(pr,"dim"),W,H);
    /* se dibuja en una textura RGBA8 propia (así el 4.º byte de cada grupo también viaja) */
    const sal=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,sal);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,Wt,Ht);
    const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,sal,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("framebuffer incompleto");
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.disable(gl.BLEND);gl.viewport(0,0,Wt,Ht);
    const bytes=Wt*Ht*4,N=3,pbo=[];
    for(let i=0;i<N;i++){const b=gl.createBuffer();gl.bindBuffer(gl.PIXEL_PACK_BUFFER,b);gl.bufferData(gl.PIXEL_PACK_BUFFER,bytes,gl.STREAM_READ);pbo.push(b);}
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
    let k=0,vivo=true,pend=0;
    return{
      W,H,bytes,
      get pendientes(){return pend;},get capacidad(){return N-1;},
      /* dibuja la conversión y devuelve una promesa con los bytes YUV (se resuelve cuando la tarjeta termina) */
      leer(canvas){
        if(!vivo)return Promise.reject(new Error("lector cerrado"));
        gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
        gl.drawArrays(gl.TRIANGLES,0,3);
        const b=pbo[k++%N];gl.bindBuffer(gl.PIXEL_PACK_BUFFER,b);gl.readPixels(0,0,Wt,Ht,gl.RGBA,gl.UNSIGNED_BYTE,0);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
        const f=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
        pend++;
        return new Promise((ok0,mal0)=>{
          const ok=v=>{pend--;ok0(v);},mal=e=>{pend--;mal0(e);};
          const sondear=()=>{
            if(!vivo){mal(new Error("lector cerrado"));return;}
            const r=gl.clientWaitSync(f,0,0);
            if(r===gl.TIMEOUT_EXPIRED){setTimeout(sondear,1);return;}
            if(r===gl.WAIT_FAILED){mal(new Error("falló la lectura de la GPU"));return;}
            const out=new Uint8Array(bytes);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,b);gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,out);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);gl.deleteSync(f);ok(out);
          };sondear();
        });
      },
      cerrar(){vivo=false;try{const e=gl.getExtension("WEBGL_lose_context");e&&e.loseContext();}catch(x){}}
    };
  }catch(e){console.warn("lector GPU no disponible:",e);return null;}
};
})();
