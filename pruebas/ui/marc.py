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
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');Studio.serie.addActor('hum:nina','Nina');await new Promise(r=>setTimeout(r,600));
      const its=Studio.serie.proj().mundos[0].items;its[0].acc=[{k:'saludar',t0:2}];its[1].acc=[{k:'saltar',t0:6}];Studio.changed();Serie.renderTl();await new Promise(r=>setTimeout(r,500));})()""")
    await pg.evaluate("Serie.setT(1.5)");await pg.click("#trkMk");await pg.evaluate("Serie.setT(4)");await pg.click("#trkMk");await pg.evaluate("Serie.setT(8)");await pg.click("#trkMk");await pg.wait_for_timeout(400)
    print("marcas:",await pg.evaluate("Studio.serie.proj().mundos[0].marcas.map(m=>[m.n,m.t])"))
    await pg.click("#trkPrev");print("prev ->",await pg.evaluate("Serie.getT()"))
    await pg.click("#trkPrev");print("prev ->",await pg.evaluate("Serie.getT()"))
    await pg.click("#trkNext");print("next ->",await pg.evaluate("Serie.getT()"))
    await pg.dblclick(".mk >> nth=1");await pg.keyboard.type("Entra Nina");await pg.keyboard.press("Enter");await pg.wait_for_timeout(400)
    print("renombrada:",await pg.evaluate("Studio.serie.proj().mundos[0].marcas.map(m=>m.n)"))
    await pg.click(".mk >> nth=2",button="right");await pg.click(".trkMenu .mi");await pg.wait_for_timeout(300)
    print("tras quitar:",await pg.evaluate("Studio.serie.proj().mundos[0].marcas.length"))
    filas=lambda:pg.evaluate("document.querySelectorAll('#trkBody .trkRow').length")
    print("filas:",await filas())
    await pg.evaluate("Serie.select(Studio.serie.proj().mundos[0].items[1].uid)");await pg.wait_for_timeout(200)
    await pg.click("#trkSolo");await pg.wait_for_timeout(300);print("filas solo elegido:",await filas())
    await pg.click("#trkSelZ");await pg.wait_for_timeout(500);print("zoom pps:",await pg.evaluate("document.getElementById('trkZ').value"),"scroll:",await pg.evaluate("document.getElementById('trkBody').scrollLeft"))
    await pg.screenshot(path="marc.png");print("errores:",errs);await b.close()
asyncio.run(main())
