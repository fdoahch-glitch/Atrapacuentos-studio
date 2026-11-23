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
    r=await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nina','Nina');await new Promise(r=>setTimeout(r,800));
      const E=Dub.exprDeTexto,o={};
      for(const t of ['Hola, buenos días','¡Qué alegría, gracias!','Estoy muy triste','CÁLLATE YA','¡Cuidado!','¿Dónde estás?','Me da mucha rabia']) o[t]=E(t);
      const sc=Studio.serie.proj().mundos[0],it=sc.items[0];
      sc.lineas.push({id:Dub.newId(),txt:'Estoy muy triste hoy',quien:it.uid,t0:1});Dub.tick(1.5,sc);o.enLinea=it.dubExpr;
      Dub.tick(8,sc);o.fuera=it.dubExpr;
      it.exprAuto=false;Dub.tick(1.5,sc);o.apagada=it.dubExpr;
      o.json=JSON.stringify(Studio.serie.proj(),null,0).includes('dubExpr');
      return o})()""")
    for k,v in r.items(): print(k,"->",repr(v))
    print("errores:",errs);await b.close()
asyncio.run(main())
