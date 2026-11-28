import os
import asyncio
from playwright.async_api import async_playwright
# Simula la aplicación de escritorio (Tauri) y comprueba el botón fijo «⬆ vX» de la barra superior.
STUB = """(()=>{const nov=%s;window.__TAURI__={core:{invoke:async(c)=>{switch(c){
  case 'version_app':return {version:'1.2.0',os:'windows',repo:'fdoahch-glitch/Atrapacuentos-studio'};
  case 'buscar_actualizacion':return nov;
  case 'sistema':return {gpus:[],codificadores:[],ffmpeg:false};
  default:return null;}}},event:{listen:async()=>()=>{}}};})()"""
NOV = "{version:'9.9.9',notas:'- Cambio de prueba',pagina:'https://github.com/x',archivo:'a.exe',url:'https://github.com/x/a.exe',tamano:5e6}"
async def abrir(b, nov):
    pg = await b.new_page(viewport={"width": 1500, "height": 900})
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.add_init_script(STUB % nov)
    await pg.goto("http://localhost:8765/index.html")
    await pg.wait_for_function("window.__serieReady", timeout=60000)
    await pg.wait_for_timeout(9500)
    return pg
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    errs=[]
    pg=await abrir(b, NOV); pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    await pg.evaluate("Inicio.cerrar()")
    vis=await pg.evaluate("""(()=>{const b=document.getElementById('bNuevaVer');if(!b||b.hidden)return 'no existe';const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===b?'ok:'+b.textContent:'tapado'})()""")
    print("botón de nueva versión visible y clicable:", str(vis).startswith("ok:"), "|", vis)
    bus=await pg.evaluate("""(()=>{const b=document.getElementById('bBuscarAct');if(!b)return false;const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===b})()""")
    print("botón «🔄 Buscar actualizaciones» visible y clicable:", bus)
    await pg.click("#bBuscarAct"); await pg.wait_for_timeout(600)
    print("al pulsarlo abre la ventana de actualizaciones:", "Actualizaciones" in await pg.inner_text(".ia-box"))
    await pg.click("#actCe")
    await pg.click("#bNuevaVer"); await pg.wait_for_timeout(400)
    print("al pulsarlo muestra la versión y los cambios:", "9.9.9" in await pg.inner_text(".ia-box") and "Cambio de prueba" in await pg.inner_text(".ia-box"))
    await pg.click("#actCe")
    # «Más tarde» del aviso de abajo no quita el botón
    if await pg.query_selector("#actNo"): await pg.click("#actNo")
    print("el botón sigue aunque se descarte el aviso:", await pg.evaluate("!document.getElementById('bNuevaVer').hidden"))
    await pg.close()
    pg2=await abrir(b, "null")
    print("sin novedades no hay botón:", await pg2.evaluate("!document.getElementById('bNuevaVer')||document.getElementById('bNuevaVer').hidden"))
    print("errores:",errs); await b.close()
asyncio.run(main())
