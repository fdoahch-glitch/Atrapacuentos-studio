import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.go={x1:1000,y1:650,t0:0,t1:8};Studio.proj.mundos[0].dur=9;Studio.changed();Studio.play();})()""")
    for i in range(6):
        await pg.wait_for_timeout(1500)
        print(await pg.evaluate("[document.getElementById('fpsReal').hidden,document.getElementById('fpsReal').textContent,window.PrevQ,window.FisQ]"))
    await pg.evaluate("Studio.playing&&Studio.play()");await pg.wait_for_timeout(1500)
    print("playing:",await pg.evaluate("Studio.playing"));print("tras detener:",await pg.evaluate("[document.getElementById('fpsReal').hidden,window.PrevQ,window.FisQ]"),"errores:",errs);await b.close()
asyncio.run(main())
