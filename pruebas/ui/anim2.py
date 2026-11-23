import asyncio,hashlib
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}");errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]));pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
    pg.on("console",lambda m:errs.append("C:"+m.text[:200]) if m.type=="error" and "404" not in m.text else None)
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.click("#inNuevo");await pg.click("text=Animación");await pg.wait_for_timeout(300)
    await pg.click("text=Crear lienzo en blanco");await pg.wait_for_timeout(1200)
    print("inicio cerrado:",await pg.evaluate("!document.getElementById('inicio')||getComputedStyle(document.getElementById('inicio')).display=='none'||document.getElementById('inicio').hidden"))
    print("items:",await pg.evaluate("Studio.proj.mundos[0].items.length"),"fondo:",await pg.evaluate("JSON.stringify(Studio.proj.mundos[0].fondo)"),"lienzo:",await pg.evaluate("JSON.stringify(Studio.proj.lienzo)"))
    # agregar decoración y personaje por UI
    await pg.click("text=Decoración");await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('#lib .tile, .tile').click()");await pg.wait_for_timeout(400)
    print("items tras agregar:",await pg.evaluate("Studio.proj.mundos[0].items.length"))
    sel=await pg.evaluate("Serie.sel");print("seleccionado:",bool(sel))
    # entrada 'caer' desde el panel
    await pg.select_option("#eN","caer");await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('eNt').value=1;document.getElementById('eNt').dispatchEvent(new Event('change'))")
    h=lambda: pg.evaluate("(async()=>{const c=document.getElementById('cv');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=97)s=(s*31+d[i])>>>0;return s})()")
    await pg.evaluate("Serie.setT(0)");a=await h()
    await pg.evaluate("Serie.setT(1.3)");bb=await h()
    await pg.evaluate("Serie.setT(4)");c=await h()
    print("entrada caer: t0/t1.3/t4 distintos:",len({a,bb,c})==3)
    # fondo animado
    await pg.evaluate("Serie.select(null)");await pg.wait_for_timeout(200)
    await pg.click("#sBg");await pg.wait_for_timeout(200)
    # elegir un fondo con capas (primer tile fondo)
    await pg.evaluate("document.querySelector('.tile').click()");await pg.wait_for_timeout(500)
    await pg.evaluate("Serie.select(null)")
    await pg.select_option("#sBm","deriva");await pg.wait_for_timeout(200)
    print("fondo:",await pg.evaluate("JSON.stringify(Studio.proj.mundos[0].fondo)"))
    await pg.evaluate("Serie.setT(0)");f0=await h();await pg.evaluate("Serie.setT(6)");f1=await h()
    print("fondo cambia con el tiempo:",f0!=f1)
    await pg.evaluate("Serie.setT(3)");await pg.screenshot(path="anim_fondo.png")
    # texto animado
    await pg.evaluate("Studio.proj.mundos[0].textos.push({id:'t1',tipo:'titulo',txt:'Hola mundo',x:50,y:20,size:9,t0:1,t1:5,ent:'rebote',sal:'aparecer',mov:'latir'});Studio.changed()")
    await pg.evaluate("Serie.setT(1.2)")
    print("errores:",errs);await b.close()
asyncio.run(main())
