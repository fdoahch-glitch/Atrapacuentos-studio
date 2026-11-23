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


    await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];Serie.select(it.uid)})()")
    await pg.wait_for_timeout(300)
    await pg.click("[data-vs=heroe]");await pg.wait_for_timeout(400)
    pal=await pg.evaluate("Studio.serie.proj().mundos[0].items[0].pal")
    print("héroe pone capa y lentes:",bool(pal.get("capa")) and bool(pal.get("lentes")))
    await pg.fill("#vsNom","Mi disfraz");await pg.click("#vsGuardar");await pg.wait_for_timeout(300)
    print("se guardó el vestuario:",await pg.evaluate("Object.values(Studio.serie.proj().vestuarios||{}).map(v=>v.n).join()"))
    await pg.click("[data-vs=invierno]");await pg.wait_for_timeout(300)
    print("invierno quita la capa:",await pg.evaluate("!Studio.serie.proj().mundos[0].items[0].pal.capa"))
    btn=pg.locator("#propiedades [data-vs], #props [data-vs], [data-vs]").filter(has_text="Mi disfraz").first
    await btn.click();await pg.wait_for_timeout(300)
    print("el vestuario guardado se vuelve a poner:",await pg.evaluate("!!Studio.serie.proj().mundos[0].items[0].pal.capa"))
    print("errores:",errs);await b.close()
asyncio.run(main())
