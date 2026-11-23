import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));})()""")
    # tres actores en posiciones distintas
    r=await pg.evaluate("""(async()=>{const S=Studio.serie;const ids=Object.keys(window.SerieArt.HUM_PRE||{});
      for(let i=0;i<3;i++){S.addActor('hum:'+ids[i],'P'+i);await new Promise(r=>setTimeout(r,200));}
      const its=S.proj().mundos[0].items;its[0].x=200;its[0].y=500;its[1].x=500;its[1].y=450;its[2].x=1000;its[2].y=520;S.changed();await new Promise(r=>setTimeout(r,400));
      return its.map(i=>[i.x,i.y,!!i._bb])})()""")
    print("items",r)
    key=lambda k:pg.keyboard.press(k)
    await pg.focus("body")
    await key("Control+a");await pg.wait_for_timeout(300)
    print("panel multi:",await pg.evaluate("document.getElementById('props').textContent.slice(0,40)"))
    await pg.click("[data-al=arr]");await pg.wait_for_timeout(200)
    print("alinear arriba (bb.y iguales):",await pg.evaluate("(()=>{const y=Studio.serie.proj().mundos[0].items.map(i=>Math.round(i._bb.y));return y})()"))
    await pg.click("[data-di=h]");await pg.wait_for_timeout(200)
    print("distribuir h x:",await pg.evaluate("Studio.serie.proj().mundos[0].items.map(i=>i.x)"))
    await key("Control+c");await key("Control+v");await pg.wait_for_timeout(300)
    print("tras pegar:",await pg.evaluate("Studio.serie.proj().mundos[0].items.length"))
    await key("Delete");await pg.wait_for_timeout(300)
    print("tras borrar los pegados:",await pg.evaluate("Studio.serie.proj().mundos[0].items.length"))
    await pg.evaluate("Studio.serie.proj().mundos[0].items[1].oculto=true;Studio.changed()")
    await pg.evaluate("Studio.select()");await pg.wait_for_timeout(300)
    print("capas:",await pg.evaluate("document.querySelectorAll('.capa').length"))
    await pg.click("[data-b]");await pg.wait_for_timeout(200)
    print("bloq:",await pg.evaluate("Studio.serie.proj().mundos[0].items.map(i=>[!!i.bloq,!!i.oculto])"))
    await key("Control+z");await pg.wait_for_timeout(300)
    print("tras deshacer:",await pg.evaluate("Studio.serie.proj().mundos[0].items.map(i=>[!!i.bloq,!!i.oculto])"))
    await pg.screenshot(path="edit1.png")
    print("errores:",errs)
    await b.close()
asyncio.run(main())
