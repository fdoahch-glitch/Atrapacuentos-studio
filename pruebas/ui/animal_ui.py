import os
import asyncio,base64
from playwright.async_api import async_playwright
MK="""(()=>{const c=document.createElement('canvas');c.width=900;c.height=520;const g=c.getContext('2d');g.fillStyle='#6b8a3a';
 g.beginPath();g.moveTo(10,130);g.quickCurveTo&&0;g.bezierCurveTo(20,60,120,40,180,60);g.bezierCurveTo(260,100,300,190,340,190);g.lineTo(600,230);g.lineTo(885,297);g.lineTo(560,365);g.bezierCurveTo(400,370,300,350,260,260);g.bezierCurveTo(200,160,100,150,10,130);g.fill();
 g.fillRect(330,340,70,130);g.fillRect(430,360,90,110);g.fillRect(280,470,280,40);g.fillRect(235,230,25,60);
 return c.toDataURL().split(',')[1];})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox"])
    pg=await b.new_page(viewport={"width":1500,"height":950});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(1500)
    open("trex.png","wb").write(base64.b64decode(await pg.evaluate(MK)))
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Taller.abrir();})()""")
    async with pg.expect_file_chooser() as fc:
        await pg.click("#tImg")
    await (await fc.value).set_files("trex.png");await pg.wait_for_timeout(1000)
    await pg.click("#tAuto");await pg.wait_for_timeout(300)
    await pg.click("[data-deta]");await pg.wait_for_timeout(1500)
    print("huesos:",await pg.evaluate("Taller._T().sk.bones.map(b=>b.role).join(',')"),"| mira:",await pg.evaluate("Taller._T().sk.face"))
    print("aviso:",(await pg.inner_text("#skDet"))[:140].replace("\n"," "))
    await pg.screenshot(path="animal_sk.png")
    await pg.click("#skGo");await pg.wait_for_timeout(2500)
    print("piezas:",await pg.evaluate("Taller._T().polys.map(p=>p.name+':'+p.role).join(', ')"))
    print("errores:",errs);await b.close()
asyncio.run(main())
