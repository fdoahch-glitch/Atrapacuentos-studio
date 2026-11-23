import os
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1500));})()""")
    await pg.wait_for_timeout(1500)
    print("tutorial:",await pg.evaluate("document.querySelector('.ia-box h2')&&document.querySelector('.ia-box h2').textContent"))
    for i in range(3): await pg.click("#tSig");
    print("ultimo paso botones:",await pg.evaluate("[...document.querySelectorAll('.ia-box button')].map(b=>b.textContent)"))
    await pg.click("#tSimple");await pg.wait_for_timeout(300)
    print("modo simple:",await pg.evaluate("[document.body.classList.contains('simple'),localStorage.atr_modo,getComputedStyle(document.getElementById('trkWrap')).display,[...document.querySelectorAll('#rail .rb')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.textContent)]"))
    await pg.screenshot(path="ui_simple.png")
    await pg.click("#bModo");await pg.wait_for_timeout(300)
    print("modo avanzado:",await pg.evaluate("[document.body.classList.contains('simple'),getComputedStyle(document.getElementById('trkWrap')).display,[...document.querySelectorAll('#rail .rb')].length]"))
    for t in ["animar","voz","exportar","crear"]:
        await pg.click(f"[data-tab={t}]");print(t,await pg.evaluate("[...document.querySelectorAll('#gp .gpi.on button')].map(b=>b.id||b.textContent.trim().slice(0,18))"))
    await pg.click("text=Plantillas");await pg.wait_for_timeout(200)
    await pg.click("[data-p=dialogo]");await pg.wait_for_timeout(700)
    print("tras plantilla:",await pg.evaluate("(()=>{const m=Studio.serie.proj().mundos;const s=m[m.length-1];return [m.length,s.items.filter(i=>i.kind==='actor').length,s.dur,s.fondo.id]})()"))
    await pg.click("text=Plantillas");await pg.click("[data-p=narracion]");await pg.wait_for_timeout(500)
    print("textos:",await pg.evaluate("(()=>{const m=Studio.serie.proj().mundos;return m[m.length-1].textos.map(t=>t.txt)})()"))
    await pg.keyboard.press("?");await pg.wait_for_timeout(300)
    print("ayuda:",await pg.evaluate("document.querySelector('.ia-box h2').textContent+' | '+document.querySelector('.ia-box h4').textContent"))
    await pg.keyboard.press("Escape");await pg.wait_for_timeout(200)
    await pg.click("text=Primer vídeo");await pg.wait_for_timeout(2000)
    print("guia:",await pg.evaluate("document.querySelector('#guia1').textContent.replace(/\\s+/g,' ').slice(0,140)"))
    await pg.screenshot(path="ui_full.png")
    print("errores:",errs);await b.close()
asyncio.run(main())
