import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.s=1.6;it.x=400;Serie.select(it.uid);Studio.changed();await new Promise(r=>setTimeout(r,400));})()""")


    await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];Serie.select(it.uid)})()")
    await pg.evaluate("Marioneta.abrir()");await pg.wait_for_timeout(300)
    print("cámara bloqueada sin autorizar:",await pg.evaluate("document.getElementById('marCam').disabled"))
    await pg.click("#marMic");await pg.wait_for_timeout(300)
    vals=[]
    for _ in range(30):
        vals.append(await pg.evaluate("Studio.serie.proj().mundos[0].items[0].dubLv"));await pg.wait_for_timeout(100)
    vals=[v for v in vals if v is not None]
    print("muestras:",len(vals),"máx boca:",round(max(vals),2) if vals else None)
    print("el micrófono mueve la boca:",bool(vals) and max(vals)>0.2)
    print("estado:",await pg.inner_text("#marMsg"))
    await pg.click("#marStop");await pg.wait_for_timeout(300)
    print("al detener, la boca vuelve a cero:",await pg.evaluate("!Studio.serie.proj().mundos[0].items[0].dubLv"))
    print("no queda inclinación pegada:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].marRot===undefined"))
    await pg.route("**/*",lambda r: r.abort() if ("jsdelivr" in r.request.url or "googleapis" in r.request.url) else r.continue_())
    await pg.check("#marOk");await pg.click("#marCam");await pg.wait_for_timeout(6000)
    print("cámara sin internet falla con aviso claro:",(await pg.inner_text("#marMsg")).startswith("No pude iniciar"))
    print("y no deja nada activo:",await pg.evaluate("!Marioneta.activa"))
    print("errores:",errs);await b.close()
asyncio.run(main())
