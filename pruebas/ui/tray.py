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
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,500));})()""")
    box=await pg.evaluate("(()=>{const r=document.getElementById('cv').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    L,T,W,H=box
    X=lambda ux:L+ux/1280*W; Y=lambda uy:T+uy/720*H
    await pg.click("#trDib");await pg.wait_for_timeout(200)
    await pg.mouse.move(X(300),Y(600));await pg.mouse.down()
    for i in range(1,31):
        await pg.mouse.move(X(300+i*20),Y(600-60*(1 if i<15 else 0)*(i/15)-(i-15 if i>=15 else 0)*3));
    await pg.mouse.up();await pg.wait_for_timeout(300)
    kf=await pg.evaluate("Studio.serie.proj().mundos[0].items[0].kf")
    print("puntos kf:",len(kf),kf[0],kf[-1])
    # arrastrar el primer punto intermedio
    mid=kf[len(kf)//2];print("mid",mid)
    await pg.mouse.move(X(mid['x']),Y(mid['y']));await pg.mouse.down();await pg.mouse.move(X(mid['x']),Y(mid['y']-100),steps=5);await pg.mouse.up()
    kf2=await pg.evaluate("Studio.serie.proj().mundos[0].items[0].kf")
    print("mid tras mover:",kf2[len(kf)//2])
    await pg.mouse.click(X(kf2[len(kf2)//2]['x']),Y(kf2[len(kf2)//2]['y']),button="right");await pg.wait_for_timeout(200)
    print("tras borrar punto:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].kf.length"))
    await pg.click("#trSua");await pg.wait_for_timeout(200)
    print("tras suavizar:",await pg.evaluate("Studio.serie.proj().mundos[0].items[0].kf.length"))
    # reproducción: la posición en mitad de la duración debe seguir el camino
    print("pos t=0.5/dur:",await pg.evaluate("(()=>{const it=Studio.serie.proj().mundos[0].items[0];return [it.kf[0].t,it.kf[it.kf.length-1].t]})()"))
    await pg.screenshot(path="tray.png")
    print("errores:",errs);await b.close()
asyncio.run(main())
