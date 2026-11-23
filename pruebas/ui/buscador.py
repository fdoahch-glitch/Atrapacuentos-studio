import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}");await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("localStorage.atr_tutorial='1'")
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));})()""")
    await pg.click("#gp button:has-text(\"Buscar\")");await pg.wait_for_timeout(200)
    await pg.fill("#busQ","bosq");print([await pg.evaluate("document.getElementById('busR').textContent.trim().slice(0,80)")])
    await pg.keyboard.press("Enter");await pg.wait_for_timeout(300)
    print("fondo:",await pg.evaluate("Studio.serie.proj().mundos[0].fondo.id"))
    await pg.click("#gp button:has-text(\"Buscar\")");await pg.fill("#busQ","ni");print(await pg.evaluate("[...document.querySelectorAll(\"#busR .fila span\")].slice(0,5).map(e=>e.textContent)"));await pg.click("[data-i]");await pg.wait_for_timeout(300)
    print("items:",await pg.evaluate("Studio.serie.proj().mundos[0].items.map(i=>i.kind+':'+i.ref)"),errs);await b.close()
asyncio.run(main())
