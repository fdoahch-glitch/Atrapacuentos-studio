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


    r=await pg.evaluate("""(()=>{const ln={id:'zz',txt:'hola mundo bonito',t0:2,wt:[['hola',0,.4],['mundo',.5,1.0],['bonito',1.1,1.8]]};const w=Dub.words(ln);return {w:w.map(x=>[x.w,+x.t0.toFixed(2),+x.t1.toFixed(2)]),s:ln._s,e:ln._e};})()""")
    print("tiempos por palabra:",r["w"])
    print("usa los tiempos reales:",r["w"][0][1]==2.0 and r["w"][1][1]==2.5 and r["w"][2][2]==3.8)
    r2=await pg.evaluate("""(()=>{const ln={id:'zy',txt:'uno dos tres cuatro',t0:0,wt:[['a',0,1],['b',1,2]]};const w=Dub.words(ln);return w.map(x=>[x.w,+x.t0.toFixed(2),+x.t1.toFixed(2)]);})()""")
    print("texto distinto al de Whisper se reparte:",r2)
    print("sin tiempos usa el reparto de siempre:",await pg.evaluate("Dub.words({id:'zx',txt:'a b c',t0:1}).length===3"))
    print("errores:",errs);await b.close()
asyncio.run(main())
