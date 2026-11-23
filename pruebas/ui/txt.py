import os
import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    print(json.dumps(await pg.evaluate("""['saluda, luego camina hacia la izquierda y salta dos veces','se rie, piensa y despues come','baila 3 veces','xyz qwe','corre y se asusta'].map(f=>{const r=Movs.texto(f);return [f,r.pasos.map(p=>p.id+(p.rep>1?'x'+p.rep:'')).join('>'),r.sinEntender,r.dir]})""") ,ensure_ascii=False))
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));const it=Studio.serie.proj().mundos[0].items[0];Serie.select(it.uid);})()""")
    await pg.wait_for_timeout(500)
    await pg.evaluate("Movs.abrir()");await pg.wait_for_timeout(400)
    print("sugeridos:",await pg.evaluate("[...document.querySelectorAll('[data-sug]')].map(b=>b.textContent).join(', ')"))
    await pg.fill("#movTx","saluda, luego camina hacia la izquierda y salta dos veces");await pg.click("#movTxOk");await pg.wait_for_timeout(800)
    print("acc:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].acc.map(a=>a.k+'@'+a.t0).join(' ')"),"| flip:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].flip"),"| kf:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].kf.length"))
    print("errores:",errs);await b.close()
asyncio.run(main())
