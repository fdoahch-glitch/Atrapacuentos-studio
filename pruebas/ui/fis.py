import asyncio,hashlib
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nina','Nina');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];Serie.setT(0);Serie.select(it.uid);
      [[0,300],[1,700],[2,300]].forEach(([t,x])=>Serie.setKf(it,t,{x,y:650,e:'lineal'}));Studio.changed();await new Promise(r=>setTimeout(r,400));})()""")
    print("piezas candidatas:",await pg.evaluate("[...document.querySelectorAll('[data-fo]')].map(c=>c.dataset.fo+':'+c.checked)"))
    print("extra select:",await pg.evaluate("[...document.querySelectorAll('#foNueva option')].map(o=>o.value).slice(0,12)"))
    h=lambda:pg.evaluate("(()=>{const c=document.getElementById('cv');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=1)s=(s*31+d[i])|0;return s})()")
    await pg.evaluate("Serie.setT(1.15)");await pg.wait_for_timeout(250);a1=await h()
    await pg.evaluate("Serie.setT(0.2);Serie.setT(1.15)");await pg.wait_for_timeout(250);a2=await h()
    print("determinista:",a1==a2)
    # apagar física del pelo
    n=await pg.evaluate("document.querySelector('[data-fo]')&&document.querySelector('[data-fo]').dataset.fo")
    await pg.click("[data-fo]");await pg.wait_for_timeout(200)
    await pg.evaluate("Serie.setT(0.2);Serie.setT(1.15)");await pg.wait_for_timeout(250);a3=await h()
    print("cambia al apagar:",a1!=a3,n);await pg.screenshot(path="fis.png")
    # rendimiento: 60 cuadros con física
    await pg.click("[data-fo]");await pg.wait_for_timeout(200)
    ms=await pg.evaluate("(()=>{const t0=performance.now();for(let i=0;i<60;i++)Serie.setT(i/30);return (performance.now()-t0)/60})()")
    print("ms por cuadro (con física, CPU software):",round(ms,1))
    print("errores:",errs);await b.close()
asyncio.run(main())
