import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.s=1.6;it.x=400;Serie.select(it.uid);Studio.changed();await new Promise(r=>setTimeout(r,400));})()""")
    await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];it.acc=[{k:'girar',t0:1}];Studio.changed();Studio.select()})()")
    from PIL import Image
    import io
    async def ancho(t):
        await pg.evaluate(f"Serie.setT({t})");await pg.wait_for_timeout(350)
        im=Image.open(io.BytesIO(await pg.locator('#cv').screenshot())).convert('RGB');W,H=im.size;px=im.load()
        xs=[x for x in range(120,500,1) for y in range(90,330,4) if sum(255-c for c in px[x,y])>90]
        return (max(xs)-min(xs)) if xs else 0
    for tt in (0.3,1.6,2.8):
        await pg.evaluate(f'Serie.setT({tt})');await pg.wait_for_timeout(350);await pg.locator('#cv').screenshot(path=f'giro_{tt}.png')
    a0=await ancho(0.3);a1=await ancho(1.6);a2=await ancho(2.8)
    print("ancho antes/mitad/después:",a0,a1,a2)
    print("se angosta a mitad del giro:",a1<a0*0.35)
    print("vuelve a ensancharse:",a2>a1*1.3)
    print("errores:",errs);await b.close()
asyncio.run(main())
