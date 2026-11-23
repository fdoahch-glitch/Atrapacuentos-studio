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

    from PIL import Image
    import io
    async def alto():
        await pg.wait_for_timeout(350)
        im=Image.open(io.BytesIO(await pg.locator('#cv').screenshot())).convert('RGB');px=im.load()
        ys=[y for y in range(60,345) for x in range(120,500,2) if sum(255-c for c in px[x,y])>90]
        return (max(ys)-min(ys)) if ys else 0
    async def serie_alturas(resp):
        await pg.evaluate(f"(()=>{{const it=Studio.serie.proj().mundos[0].items[0];it.acc=[];if({resp})it.resp={resp};else delete it.resp;Studio.changed();Studio.select()}})()")
        r=[]
        for t in (0.2,1.0,2.0,3.0):
            await pg.evaluate(f"Serie.setT({t})");r.append(await alto())
        return r
    off=await serie_alturas(0);on=await serie_alturas(2)
    print("alturas sin respirar:",off,"con respirar fuerte:",on)
    print("sin respirar queda quieto:",max(off)-min(off)<=2)
    print("respirar mueve el cuerpo:",max(on)-min(on)>=4)
    print("errores:",errs);await b.close()
asyncio.run(main())
