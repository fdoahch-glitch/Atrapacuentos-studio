import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]));pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
    await pg.add_init_script("try{localStorage.atr_tutorial=1;localStorage.removeItem('atr_movs')}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');Studio.serie.addActor('hum:nina','Nina');await new Promise(r=>setTimeout(r,500));})()""")
    await pg.click("[data-tab=animar]");await pg.click("#gp button:has-text('Movimientos')");await pg.wait_for_timeout(300)
    # elegir varios: saludar, rebotar, correr, comer, esperar, girar, hablar, asustarse
    for i in [0,2,3,4,6,7,8,9]:
        await pg.click(f"[data-m='{i}']")
    await pg.click("#movAp");await pg.wait_for_timeout(800)
    it=await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[1];return {acc:it.acc,kf:it.kf.length,paso:it.paso}})()")
    print("acciones aplicadas:",[ (a['k'],a['t0']) for a in it['acc']],"kf:",it['kf'],"paso",it['paso'])
    await pg.evaluate("Studio.stop&&Studio.stop()")
    # dibujar cada acción en distintos instantes para detectar errores de render
    for t in [0.5,3,6,9,12,15]:
        await pg.evaluate(f"Serie.setT({t})")
    await pg.evaluate("Studio.stop&&Studio.stop();document.getElementById('bPlay').click&&0")
    await pg.wait_for_timeout(300)
    await pg.evaluate("Serie.select(Studio.serie.proj().mundos[0].items[1].uid)");await pg.wait_for_timeout(200)
    # guardar como movimiento propio
    await pg.click("[data-tab=animar]");await pg.click("#gp button:has-text('Movimientos')");await pg.click("#movGu");await pg.fill("#mgN","Mi secuencia");await pg.click("#mgOk");await pg.wait_for_timeout(500)
    print("propios:",await pg.evaluate("Movs.propios().map(m=>[m.n,m.acc.length,m.kf.length,m.dur])"))
    await pg.click("#movCe");await pg.wait_for_timeout(200)
    await pg.evaluate("Serie.select&&Serie.select(Studio.serie.proj().mundos[0].items[0].uid)")
    await pg.wait_for_timeout(200)
    await pg.click("[data-tab=animar]");await pg.click("#gp button:has-text('Movimientos')")
    n=await pg.evaluate("document.querySelectorAll('[data-m]').length");await pg.click(f"[data-m='{n-1}']");await pg.click("#movAp");await pg.wait_for_timeout(500)
    print("reutilizado en el otro:",await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];return [it.acc&&it.acc.length,it.kf&&it.kf.length]})()"))
    print("en proyecto:",await pg.evaluate("(Studio.serie.proj().movs||[]).length"))
    await pg.screenshot(path="movs.png");print("errores:",errs);await b.close()
asyncio.run(main())
