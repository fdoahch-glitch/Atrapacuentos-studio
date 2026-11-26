"""Comparación de cuadros contra el motor de dibujo (etapa 0 del plan de calidad visual).
Uso:  python3 ref_cuadros.py            -> compara con pruebas/referencias/*.png y avisa si algo cambió más de la tolerancia
      python3 ref_cuadros.py --guardar  -> vuelve a guardar las referencias (solo cuando se quiere cambiar el aspecto a propósito)
Dibuja 6 escenas de referencia a 960x540 llamando a Serie.frame (la misma función que usan el editor y el MP4)."""
import os, sys, io, json, asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageChops
AQUI = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(AQUI, "..", "referencias")
TOL_MEDIA = 0.5    # tolerancia de rasterizado entre motores GPU; TOL_MAX_PIX sigue limitando cambios visibles
TOL_MAX_PIX = 0.005 # fracción máxima de píxeles que pueden cambiar más de 24 niveles
ESCENAS = {
  "pradera_personaje": "(()=>{const p=Studio.serie.proj();const it=p.mundos[0].items[0];it.s=1.3;it.x=420;it.y=620;p.mundos[0].fondo={id:'pradera'};return {t:0.5}})()",
  "noche_personaje_grande": "(()=>{const p=Studio.serie.proj();const it=p.mundos[0].items[0];it.s=2.2;it.x=600;it.y=700;p.mundos[0].fondo={id:'pradera'};p.mundos[0].hora='noche';return {t:0.5}})()",
  "tarde_caminando": "(()=>{const p=Studio.serie.proj();const it=p.mundos[0].items[0];it.s=1.1;it.x=200;it.y=640;it.go={x1:1000,y1:640,t0:0,t1:4};p.mundos[0].fondo={id:'pradera'};p.mundos[0].hora='tarde';p.mundos[0].dur=4;return {t:1.7}})()",
  "fondo_blanco_pequeno": "(()=>{const p=Studio.serie.proj();const it=p.mundos[0].items[0];it.s=.45;it.x=640;it.y=560;p.mundos[0].fondo={id:'blanco',color:'#ffffff'};return {t:0.3}})()",
  "camara_zoom": "(()=>{const p=Studio.serie.proj();const sc=p.mundos[0];const it=sc.items[0];it.s=1;it.x=500;it.y=620;sc.fondo={id:'pradera'};sc.cam={z0:1,z1:1.8,x0:0,x1:120};sc.dur=4;return {t:3}})()",
}
async def dibuja(pg, preparar, url):
    await pg.goto(url); await pg.wait_for_timeout(2000)
    r = await pg.evaluate("(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.serie.addActor('hum:nino','Nico');await new Promise(r=>setTimeout(r,1000));return 1})()")
    await pg.evaluate("Studio.serie.proj().mundos[0].items.forEach((it,k)=>{it.uid='ref'+k})")  # el identificador al azar cambia la fase de parpadeo y respiración
    info = await pg.evaluate(preparar)
    png = await pg.evaluate("""async(t)=>{const sc=Studio.serie.proj().mundos[0];await new Promise(r=>setTimeout(r,500));
      const c=document.createElement('canvas');c.width=960;c.height=540;const g=c.getContext('2d');Serie.frame(g,sc,t,{});await new Promise(r=>setTimeout(r,700));Serie.frame(g,sc,t,{});
      return c.toDataURL('image/png')}""", info["t"])
    import base64
    return Image.open(io.BytesIO(base64.b64decode(png.split(",")[1]))).convert("RGB")
def compara(a, b):
    d = ImageChops.difference(a, b); px = list(d.getdata()); n = len(px)
    media = sum(sum(p) for p in px) / (3 * n)
    grandes = sum(1 for p in px if max(p) > 24) / n
    return media, grandes
async def main():
    guardar = "--guardar" in sys.argv
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={"width": 1500, "height": 900}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:250]))
        await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
        puerto = os.environ.get("PORT", "8765")
        url = f"http://localhost:{puerto}/index.html"
        mal = []
        for nombre, prep in ESCENAS.items():
            im = await dibuja(pg, prep, url)
            ruta = os.path.join(REF, nombre + ".png")
            if guardar or not os.path.exists(ruta):
                im.save(ruta); print(f"guardada  {nombre}"); continue
            media, grandes = compara(im, Image.open(ruta).convert("RGB"))
            ok = media <= TOL_MEDIA and grandes <= TOL_MAX_PIX
            print(f"{'igual ' if ok else 'CAMBIÓ'} {nombre}: diferencia media {media:.3f}, píxeles muy distintos {grandes*100:.2f} %")
            if not ok: mal.append(nombre); im.save(f"/tmp/ref_{nombre}_nuevo.png")
        print("errores:", errs)
        print("escenas de referencia:", len(ESCENAS), "| cambiadas:", mal if mal else "ninguna")
        sys.exit(1 if (mal or errs) else 0)
asyncio.run(main())
