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


    print("versión actual del formato:",await pg.evaluate("Studio.FORMATO"))
    saved=await pg.evaluate("Studio.exportText()")
    import json
    o=json.loads(saved)
    print("al guardar lleva el número:",o.get("v")==4)
    # proyecto viejo: sin número, con restos temporales
    viejo=json.loads(saved);viejo["v"]=3
    for sc in viejo["mundos"]:
        for it in sc["items"]:
            it["dubLv"]=.5;it["marRot"]=.2
    viejo["mundos"][0]["items"][0]["acc"]="roto"
    await pg.evaluate("t=>Studio.importText(t)",json.dumps(viejo))
    r=await pg.evaluate("(()=>{const p=Studio.proj;const it=p.mundos[0].items[0];return {f:p.v,acc:Array.isArray(it.acc),tmp:p.mundos.every(s=>s.items.every(i=>i.dubLv===undefined&&i.marRot===undefined)),n:p.mundos.length}})()")
    print("proyecto sin número se abre y se migra:",r)
    print("queda con el número nuevo y limpio:",r["f"]==4 and r["acc"] and r["tmp"])
    real=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","proyectos","v1-respaldo-2026-11-22.atrapa")).read()
    await pg.evaluate("t=>Studio.importText(t)",real)
    r3=await pg.evaluate("({v:Studio.proj.v,n:Studio.proj.mundos.length,t:Studio.proj.tipo})")
    print("proyecto real guardado con el código anterior:",r3)
    print("abre y queda en formato nuevo:",r3["v"]==4 and r3["n"]==1)
    futuro=json.loads(saved);futuro["v"]=99
    msg=await pg.evaluate("t=>Studio.importText(t).then(()=>'abrió').catch(e=>e.message)",json.dumps(futuro))
    print("proyecto de una versión más nueva:",msg[:60])
    print("no lo abre y avisa:",msg.startswith("Este proyecto lo guardó una versión más nueva"))
    print("el proyecto de antes sigue intacto:",await pg.evaluate("Studio.proj.mundos.length>=1&&Studio.proj.v===4"))
    rt=await pg.evaluate("(async()=>{const t=Studio.exportText();await Studio.importText(t);return Studio.exportText()===t})()")
    print("guardar y abrir de nuevo da lo mismo:",rt)
    print("errores:",errs);await b.close()
asyncio.run(main())
