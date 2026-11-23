import asyncio,json,base64
from playwright.async_api import async_playwright
MK="""(()=>{const c=document.createElement('canvas');c.width=400;c.height=700;const g=c.getContext('2d');
 g.fillStyle='#f3c9a0';g.beginPath();g.arc(200,90,60,0,7);g.fill();g.fillStyle='#d33';g.fillRect(140,30,120,30);g.fillStyle='#f3c9a0';g.fillRect(185,145,30,25);
 g.fillStyle='#4fae64';g.beginPath();g.roundRect(140,170,120,190,20);g.fill();g.fillStyle='#b9a46a';g.fillRect(145,350,50,260);g.fillRect(205,350,50,260);
 g.fillStyle='#5b3a22';g.fillRect(135,600,70,40);g.fillRect(195,600,70,40);
 g.fillStyle='#4fae64';g.save();g.translate(140,190);g.rotate(2.2);g.fillRect(0,-15,150,30);g.restore();g.save();g.translate(260,190);g.rotate(.94);g.fillRect(0,-15,150,30);g.restore();
 return c.toDataURL().split(',')[1];})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=await b.new_page(viewport={"width":1500,"height":950});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(1500)
    open("fig.png","wb").write(base64.b64decode(await pg.evaluate(MK)))
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Taller.abrir();})()""")
    async with pg.expect_file_chooser() as fc:
        await pg.click("#tImg")
    await (await fc.value).set_files("fig.png");await pg.wait_for_timeout(1000)
    await pg.click("#tAuto");await pg.wait_for_timeout(300)
    await pg.click("[data-det]");await pg.wait_for_timeout(1500)
    print("bones:",await pg.evaluate("Taller._T().sk.bones.length"),"|",(await pg.inner_text("#skDet"))[:160].replace("\n"," "))
    await pg.screenshot(path="det_sk.png")
    await pg.click("#skGo");await pg.wait_for_timeout(2500)
    print("piezas:",await pg.evaluate("Taller._T().polys.map(p=>p.name+':'+p.role).join(', ')"))
    # recorte con un clic (sombrero)
    await pg.evaluate("Taller._T().polys=[]");
    await pg.click("#tClic");await pg.wait_for_timeout(300)
    box=await pg.locator("#tCv").bounding_box();T=await pg.evaluate("[Taller._T().w,Taller._T().h]")
    await pg.mouse.click(box["x"]+200/T[0]*box["width"],box["y"]+45/T[1]*box["height"]);await pg.wait_for_timeout(500)
    print("modo:",await pg.evaluate("Taller._T().mode"),"pts:",await pg.evaluate("Taller._T().draft&&Taller._T().draft.pts.length"))
    await pg.screenshot(path="det_clic.png");print("errores:",errs);await b.close()
asyncio.run(main())
