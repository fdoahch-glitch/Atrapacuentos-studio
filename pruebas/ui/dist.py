import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("setTimeout(()=>{throw new Error('prueba de error')},10)");await pg.wait_for_timeout(300)
    await pg.evaluate("Interfaz.ayuda()");await pg.wait_for_timeout(300)
    print("botones ayuda:",await pg.evaluate("['ayAct','ayDia','ayRep'].map(i=>!!document.getElementById(i))"))
    await pg.click("#ayDia");await pg.wait_for_timeout(800)
    print("diag inicial:",(await pg.inner_text("#dgTx"))[:200].replace("\n"," | "))
    await pg.click("#dgMed");await pg.wait_for_function("document.getElementById('dgPr').textContent==='Listo.'",timeout=60000)
    t=await pg.inner_text("#dgTx");print("diag medido:\n"+t[:900])
    print("diagnóstico incluye WebGPU:","WebGPU:" in t,"| incluye WebGL2 y MSAA:","WebGL2, MSAA hasta" in t)
    await pg.click("#dgCe")
    await pg.evaluate("Distrib.reporte()");await pg.wait_for_timeout(600)
    await pg.fill("#rpTx","Se cuelga al exportar");await pg.wait_for_timeout(200)
    pre=await pg.inner_text("#rpPre");print("reporte incluye error:", "prueba de error" in pre, "| incluye descripción:", "Se cuelga" in pre, "| proyecto?", "mundos" in pre)
    await pg.uncheck("#rpTec");print("sin datos técnicos:",len(await pg.inner_text("#rpPre")))
    await pg.click("#rpCe")
    await pg.evaluate("Distrib._aviso({version:'9.9.9',notas:'- cosa nueva',pagina:'https://github.com/x',archivo:'a.exe',url:'https://github.com/x/a.exe',tamano:5e6})");await pg.wait_for_timeout(300)
    await pg.click("#actVer");await pg.wait_for_timeout(300);print("dialogo versión:",(await pg.inner_text(".ia-box"))[:140].replace("\n"," | "))
    await pg.screenshot(path="dist.png");print("errores de página:",errs);await b.close()
asyncio.run(main())
