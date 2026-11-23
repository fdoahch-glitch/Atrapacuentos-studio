import asyncio,json,base64
from playwright.async_api import async_playwright
exec(open('det_ui.py').read().split("async def main")[0])
async def cargar(pg,ruta):
    async with pg.expect_file_chooser() as fc:
        await pg.click("#tImg")
    await (await fc.value).set_files(ruta);await pg.wait_for_timeout(1000)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":950});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(1500)
    open("fig.png","wb").write(base64.b64decode(await pg.evaluate(MK)))
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Taller.abrir();})()""")
    await cargar(pg,"fig.png")
    # agrandar
    w0=await pg.evaluate("Taller._T().w");await pg.click("#tUp");await pg.wait_for_timeout(800)
    print("agrandar:",w0,"->",await pg.evaluate("Taller._T().w"))
    await pg.click("#tAuto");await pg.click("[data-det]");await pg.wait_for_timeout(800)
    await pg.click("#skGo");await pg.wait_for_timeout(2500)
    await pg.fill("#tNom","Figura");await pg.click("#tSave");await pg.wait_for_timeout(1000)
    print("actores:",await pg.evaluate("Studio.serie.proj().actores.map(a=>a.id+':'+a.n)"))
    # vista de lado
    await pg.evaluate("Taller.abrir()");await cargar(pg,"fig.png")
    await pg.click("#tAuto");await pg.click("[data-det]");await pg.wait_for_timeout(800);await pg.click("#skGo");await pg.wait_for_timeout(2500)
    await pg.select_option("#tVista",index=1);await pg.click("#tSave");await pg.wait_for_timeout(1000)
    print("vistas:",await pg.evaluate("Object.keys(Studio.serie.proj().actores[0].vistas||{})"),"actores:",await pg.evaluate("Studio.serie.proj().actores.length"))
    # caminar: usa vista perfil sin errores
    await pg.evaluate("""(async()=>{const a=Studio.serie.proj().actores[0];Studio.serie.addActor(a.id,'Fig');await new Promise(r=>setTimeout(r,800));const it=Studio.serie.proj().mundos[0].items[0];it.go={x1:900,y1:650,t0:0,t1:4};Studio.changed();Serie.setT(1.5);await new Promise(r=>setTimeout(r,800));})()""")
    await pg.locator("#cv").screenshot(path="vistas.png")
    print("errores:",errs);await b.close()
asyncio.run(main())
