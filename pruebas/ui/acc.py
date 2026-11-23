import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.s=1.6;it.x=400;Serie.select(it.uid);Studio.changed();await new Promise(r=>setTimeout(r,400));})()""")
    for k in ["lentes","mochila","bufanda","capa"]:
        await pg.check(f"[data-ac2={k}]")
    await pg.wait_for_timeout(500)
    print("pal:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].pal"))
    print("piezas:",await pg.evaluate("Studio.serie.defOf(Studio.serie.proj().mundos[0].items[0]).piezas.map(p=>p.n).join(',')"))
    await pg.evaluate("Studio.select()");await pg.evaluate("Serie.setT(0)");await pg.wait_for_timeout(300)
    await pg.locator("#cv").screenshot(path="acc_front.png")
    # perfil: movimiento lateral
    await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];it.go={x1:900,y1:650,t0:0,t1:4};Studio.changed();Serie.setT(1.5)})()")
    await pg.wait_for_timeout(500);await pg.locator("#cv").screenshot(path="acc_perfil.png")
    print("errores:",errs);await b.close()
asyncio.run(main())
