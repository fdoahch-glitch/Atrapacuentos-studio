import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.go={x1:1000,y1:650,t0:0,t1:4};Studio.proj.mundos[0].dur=4;Studio.changed();})()""")
    await pg.evaluate("document.getElementById('bExp').click()");await pg.wait_for_timeout(400)
    await pg.select_option("#xPerf","draft");await pg.check("#xTr");await pg.fill("#xD","1");await pg.fill("#xH","2.5");await pg.select_option("#xBl","3");await pg.select_option("#xSs","1.5")
    await pg.click("#expGo")
    for i in range(80):
        await pg.wait_for_timeout(1500)
        if await pg.evaluate("!document.getElementById('expDone').hidden"):break
        if await pg.evaluate("!document.getElementById('expWarn').hidden"):break
    print("resultado:",await pg.evaluate("document.getElementById('expDone').hidden?document.getElementById('expWarn').textContent:document.getElementById('expRes').textContent"))
    print("errores:",errs);await b.close()
asyncio.run(main())
