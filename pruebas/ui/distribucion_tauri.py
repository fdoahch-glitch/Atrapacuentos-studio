import os
import subprocess,time
from selenium import webdriver
from selenium.webdriver.common.options import ArgOptions
os.environ["DISPLAY"]=":99"
xv=subprocess.Popen(["Xvfb",":99","-screen","0","1500x950x24"],stderr=subprocess.DEVNULL);time.sleep(1.5)
drv=subprocess.Popen(["tauri-driver"],env=dict(os.environ),stderr=subprocess.DEVNULL);time.sleep(2)
o=ArgOptions();o.set_capability("browserName","wry");o.set_capability("tauri:options",{"application":os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","target","debug","atrapacuentos-studio")})
d=webdriver.Remote("http://127.0.0.1:4444",options=o);d.set_script_timeout(60);time.sleep(9)
js=lambda code:d.execute_async_script("const cb=arguments[arguments.length-1];(async()=>{try{const r=await ("+code+");cb(r)}catch(e){cb('ERR '+(e&&e.message||e))}})()")
try:
    print("version_app:",js("window.__TAURI__.core.invoke('version_app')"))
    print("abrir_enlace rechaza sitios que no son GitHub:",js("window.__TAURI__.core.invoke('abrir_enlace',{url:'https://example.com'})"))
    print("instalar rechaza otras fuentes:",js("window.__TAURI__.core.invoke('instalar_actualizacion',{url:'https://example.com/a.exe',archivo:'a.exe'})"))
    r=js("window.__TAURI__.core.invoke('buscar_actualizacion')");print("buscar_actualizacion (sin internet en el sandbox, se espera error limpio):",str(r)[:120])
    print("Distrib en la app:",js("typeof window.Distrib.diagnostico"),js("Distrib.version().version"))
    print("diagnóstico nativo:",str(js("(async()=>{const d=await Nativo.sistema();return JSON.stringify({gpus:d.gpus.length,cod:d.codificadores.length,ffmpeg:d.ffmpeg})})()"))[:120])
finally:
    try:d.quit()
    except Exception:pass
    drv.terminate();xv.terminate()
