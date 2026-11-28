import os, base64
import asyncio
from playwright.async_api import async_playwright
# Motor gráfico GPU: debe verse igual que el clásico y poder cargar un modelo 3D animado.
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
async def main():
  glb = "data:model/gltf-binary;base64," + base64.b64encode(open(os.path.join(RAIZ,"pruebas","referencias","modelo_prueba.glb"),"rb").read()).decode()
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1440,"height":860}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1;localStorage.atr_motor_grafico='webgl2'}catch(e){}")
    await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_function("window.__serieReady&&window.GPUEsc&&GPUEsc.activo",timeout=60000); await pg.wait_for_timeout(800)
    print("motor GPU activo:", await pg.evaluate("GPUEsc.activo&&GPUEsc.motor==='webgl2'"))
    r=await pg.evaluate("""async()=>{
      Inicio.cerrar();const p=Historias.crear('cerditos',{fmt:'16:9',base:720,fps:30});await Studio.importText(JSON.stringify(p));await new Promise(r=>setTimeout(r,1000));
      const cv=document.getElementById('cv'),snap=()=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height);
      const dif=(a,b)=>{let s=0;for(let i=0;i<a.data.length;i+=4)s+=(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]))/3;return s/(a.data.length/4);};
      const out=[];
      for(const i of [0,1,3]){Serie.proj.mundo=i;Studio.rerender();const t=p.mundos[i].dur*.5;
        GPUEsc.activo=true;for(let w=0;w<3;w++){Serie.setT(t+w*1e-4);await new Promise(r=>setTimeout(r,150));}Serie.setT(t);await new Promise(r=>setTimeout(r,80));const A=snap();
        GPUEsc.activo=false;Serie.setT(t+1e-4);Serie.setT(t);await new Promise(r=>setTimeout(r,60));const C=snap();GPUEsc.activo=true;out.push(dif(A,C));}
      return out;}""")
    print("diferencia media GPU contra clásico (0-255):", [round(x,2) for x in r], "| todas menores a 4:", all(x<4 for x in r))
    m=await pg.evaluate("""async(url)=>{
      const P=Studio.newProj({tipo:'animacion',lienzo:{fmt:'16:9',base:720,fps:30}});P.modelos={m1:{n:'muñeco',url,anims:[]}};
      P.mundos[0].items.push({uid:'i3d',kind:'modelo3d',ref:'m1',x:640,y:660,s:1,d:62,h0:560,ry:0,vel:1,anim:''});
      await Studio.importText(JSON.stringify(P));await new Promise(r=>setTimeout(r,1500));
      const cv=document.getElementById('cv'),f=t=>{Serie.setT(t);return new Promise(r=>setTimeout(()=>{Serie.setT(t);setTimeout(()=>r(cv.toDataURL()),300)},500));};
      const a=await f(0),b=await f(.5);return {anims:Serie.proj.modelos.m1.anims,cambia:a!==b,activo:GPUEsc.activo};}""", glb)
    print("modelo 3D: animaciones:", m["anims"], "| se mueve:", m["cambia"], "| motor sigue activo:", m["activo"])
    print("errores:",errs); await b.close()
asyncio.run(main())
