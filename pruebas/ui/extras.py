import os
import asyncio,hashlib
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.s=1.4;it.x=500;it.y=650;it.pal={bufanda:'#d33f49',capa:'#6a3fb5',pelo_estilo:'coletas'};Studio.changed();Serie.select(null);})()""")
    await pg.wait_for_timeout(500)
    # 1) viento: la pose de las piezas colgantes cambia con la fuerza del viento (nivel del motor de piezas)
    r=await pg.evaluate("""(()=>{const it=Studio.serie.proj().mundos[0].items[0],def=Studio.serie.defOf(it);
      const f=v=>{const P=SerieRig.pose(def,2.3,{t:2.3,walk:0,vient:v,seed:1,fq:1,gait:{},flip:1,s:1});return ['bufanda_cola','capa','coleta_i'].map(n=>(P&&P.parts?P.parts[n]:null)).map(q=>q?+q.a.toFixed(4):null);};
      return {sin:f(0),con:f(1)};})()""")
    print("viento (ángulos de bufanda/capa/coleta):",r)
    # 2) atmósferas nuevas y foco: el cuadro cambia y no hay errores
    h=lambda: pg.evaluate("(()=>{const c=document.getElementById('cv');const g=c.getContext('2d');const d=g.getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=997)s=(s*31+d[i])>>>0;return s})()")
    await pg.evaluate("Serie.setT(1.0)");await pg.wait_for_timeout(300);base=await h()
    res={}
    for atm in ["confeti","cenizas"]:
        await pg.evaluate(f"(()=>{{Studio.proj.mundos[0].atm='{atm}';Serie.setT(1.0);}})()");await pg.wait_for_timeout(300)
        res[atm]=(await h())!=base
    await pg.evaluate("(()=>{Studio.proj.mundos[0].atm='relampago';Studio.proj.mundos[0].dur=10;})()")
    ok=False
    for t in [x/10 for x in range(10,60,2)]:
        await pg.evaluate(f"Serie.setT({t})");await pg.wait_for_timeout(60)
        if (await h())!=base: ok=True;break
    res["relampago"]=ok
    await pg.evaluate("(()=>{const sc=Studio.proj.mundos[0];sc.atm='';sc.look={foco:.8,fx:.3,fy:.5,fr:.3};Serie.setT(1.0);})()");await pg.wait_for_timeout(300)
    res["foco"]=(await h())!=base
    print("el cuadro cambia con:",res)
    # 3) UI de la escena tiene los controles nuevos
    await pg.evaluate("Studio.select()");await pg.wait_for_timeout(300)
    print("controles:",await pg.evaluate("['aFo','aFx','aFy','aFr','aVie'].map(i=>!!document.getElementById(i))"))
    # 4) guías de composición
    await pg.click("#guiasBtn");await pg.check("[data-g=tercios]");await pg.check("[data-g=shorts]")
    print("guías dibujadas (líneas):",await pg.evaluate("document.querySelectorAll('#guiasSvg line').length"),"| rect:",await pg.evaluate("document.querySelectorAll('#guiasSvg rect').length"))
    # no salen en la foto/exportación: la exportación usa solo el canvas del lienzo
    print("guías fuera del canvas de exportación:",await pg.evaluate("!document.getElementById('cv').contains(document.getElementById('guiasSvg'))"))
    await pg.locator("#frame").screenshot(path="extras.png")
    print("errores:",errs);await b.close()
asyncio.run(main())
