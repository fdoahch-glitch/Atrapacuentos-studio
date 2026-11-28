import os
import asyncio
from playwright.async_api import async_playwright
# Simula la aplicación de escritorio con TODO lo que aparece al arrancar (inicio, recuperar trabajo, guía de bienvenida, aviso de versión)
# y comprueba que Exportar, Exportar MP4, Crear video y Cerrar siempre se pueden pulsar, en varios tamaños de ventana.
STUB = """(()=>{const proj=JSON.stringify({v:4,nombre:'Cuento anterior',mundo:0,mundos:[{nombre:'Escena 1',dur:5,fondo:{id:'pradera'},hora:'',items:[],cam:{z0:1,z1:1,x0:0,x1:0},lineas:[],efecto:'',trans:'',textos:[]}],actores:[],imgs:{},tipo:'animacion',lienzo:{fmt:'16:9',base:1080,fps:30}});
window.__TAURI__={core:{invoke:async(c)=>{switch(c){
 case 'version_app':return {version:'1.2.0',os:'windows',repo:'fdoahch-glitch/Atrapacuentos-studio'};
 case 'buscar_actualizacion':return {version:'1.3.0',notas:'Notas',url:null,pagina:'https://github.com/x',archivo:'a.exe',tamano:1048576};
 case 'sistema':return {gpus:[],codificadores:[],ffmpeg:false};
 case 'autoguardado_recuperar':return ['Cuento anterior',proj];
 default:return null;}}},event:{listen:async()=>()=>{}}};})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    errs=[]; todo=True
    for w,h in [(1280,720),(1400,860),(1920,1080)]:
        pg=await b.new_page(viewport={"width":w,"height":h}); pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
        await pg.add_init_script(STUB)
        await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_function("window.__serieReady",timeout=60000); await pg.wait_for_timeout(2500)
        fallos=[]
        async def pulsa(nombre, sel, trial=False):
            try: await pg.click(sel, timeout=15000, trial=trial)
            except Exception: fallos.append(nombre)
        await pulsa("No, empezar de cero","text=No, empezar de cero")
        await pulsa("Asistente","#inAsis"); await pulsa("cuento","#inicio .hist .card:has-text('Caperucita')")
        await pulsa("siguiente","text=Siguiente: formato"); await pulsa("crear","text=Crear con este cuento")
        await pg.wait_for_timeout(8500)   # aparecen la guía de bienvenida y el aviso de versión
        await pulsa("Exportar (barra)","#top button:has-text('Exportar') >> nth=0")
        await pulsa("Exportar MP4","#bExp"); await pg.wait_for_timeout(500)
        await pulsa("Crear video","#expGo",True); await pulsa("Cerrar","#expClose",True)
        print("ventana %dx%d: botones tapados: %s"%(w,h,fallos or "ninguno")); todo = todo and not fallos
        await pg.close()
    print("Exportar, Exportar MP4, Crear video y Cerrar se pueden pulsar siempre:", todo)
    print("errores:",errs); await b.close()
asyncio.run(main())
