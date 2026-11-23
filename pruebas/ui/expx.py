import os
import asyncio,json,zipfile,io,hashlib
from playwright.async_api import async_playwright
async def baja(pg,btn):
    async with pg.expect_download(timeout=90000) as d:
        await pg.click(btn)
    dl=await d.value;p=f"/tmp/x_{btn[1:]}_"+dl.suggested_filename;await dl.save_as(p);return p
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1500,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("""(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,800));
      const it=Studio.serie.proj().mundos[0].items[0];it.s=1.2;it.x=200;it.y=650;it.go={x1:1000,y1:650,t0:0,t1:4};Studio.proj.mundos[0].dur=4;Studio.changed();})()""")
    await pg.evaluate("document.getElementById('bExp').click()");await pg.wait_for_timeout(500)
    # perfil
    await pg.select_option("#xPerf","draft");await pg.wait_for_timeout(300)
    print("perfil draft:",await pg.evaluate("[document.querySelector('input[name=expRes]:checked').value,document.querySelector('input[name=expFps]:checked').value,document.getElementById('expMbps').value+'/'+document.getElementById('expMbpsC').value]"))
    await pg.select_option("#xPerf","yt4k");await pg.wait_for_timeout(300)
    print("perfil 4k:",await pg.evaluate("[document.querySelector('input[name=expRes]:checked').value,document.querySelector('input[name=expFps]:checked').value,document.getElementById('expMbps').value+'/'+document.getElementById('expMbpsC').value]"))
    # miniatura
    pg.set_default_timeout(90000)
    mp=await baja(pg,"#xMin");from PIL import Image;im=Image.open(mp);print("miniatura:",im.size,await pg.inner_text("#xMsg"))
    # secuencia completa 720p/24 vs tramo
    await pg.select_option("#xPerf","draft")
    seq=None
    zp=await baja(pg,"#xSeq");z=zipfile.ZipFile(zp);n=z.namelist();print("zip completo (4s):",len(n),"cuadros",n[0],n[-1],"| msg:",(await pg.inner_text("#xMsg"))[:90])
    full=z.read(n[30])   # cuadro 31 => t=1.25 s
    # tramo 1.0 a 2.0
    await pg.check("#xTr");await pg.fill("#xD","1");await pg.fill("#xH","2");await pg.dispatch_event("#xH","input")
    zp2=await baja(pg,"#xSeq");z2=zipfile.ZipFile(zp2);n2=z2.namelist();print("zip tramo 1-2 s:",len(n2),"cuadros")
    seg=z2.read(n2[6])   # 1.0+6/24=1.25 s
    print("cuadro t=1.25 igual (completo vs tramo):",hashlib.md5(full).hexdigest()==hashlib.md5(seg).hexdigest())
    # movimiento suave
    await pg.select_option("#xBl","3");zp3=await baja(pg,"#xSeq");z3=zipfile.ZipFile(zp3);blur=z3.read(z3.namelist()[6])
    print("movimiento suave distinto del normal:",hashlib.md5(blur).hexdigest()!=hashlib.md5(seg).hexdigest())
    await pg.select_option("#xBl","0")
    # GIF
    gp=await baja(pg,"#xGif");g=Image.open(gp);print("gif:",g.size,"cuadros",g.n_frames,"formato",g.format)
    g.seek(5);g.convert("RGB").save("/tmp/gif5.png")
    # audio sin audio
    await pg.click("#xAud");await pg.wait_for_timeout(500);print("solo audio:",await pg.inner_text("#xMsg"))
    print("errores:",errs);await b.close()
asyncio.run(main())
