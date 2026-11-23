import os
import subprocess,time,os,sys,json,signal
from selenium import webdriver
from selenium.webdriver.common.options import ArgOptions
os.environ["DISPLAY"]=":99"
xv=subprocess.Popen(["Xvfb",":99","-screen","0","1500x950x24"],stderr=subprocess.DEVNULL);time.sleep(1.5)
def sesion(fn):
    drv=subprocess.Popen(["tauri-driver"],env=dict(os.environ),stderr=subprocess.DEVNULL);time.sleep(2)
    o=ArgOptions();o.set_capability("browserName","wry");o.set_capability("tauri:options",{"application":"/home/claude/atrapacuentos-studio/target/debug/atrapacuentos-studio"})
    d=webdriver.Remote("http://127.0.0.1:4444",options=o);d.set_script_timeout(60);time.sleep(9)
    js=lambda code:d.execute_async_script("const cb=arguments[arguments.length-1];(async()=>{try{const r=await ("+code+");cb(r)}catch(e){cb('ERR '+(e&&e.message||e))}})()")
    try: return fn(d,js)
    finally:
        pass
    return None,drv
try:
    drv=subprocess.Popen(["tauri-driver"],env=dict(os.environ),stderr=subprocess.DEVNULL);time.sleep(2)
    o=ArgOptions();o.set_capability("browserName","wry");o.set_capability("tauri:options",{"application":"/home/claude/atrapacuentos-studio/target/debug/atrapacuentos-studio"})
    d=webdriver.Remote("http://127.0.0.1:4444",options=o);d.set_script_timeout(60);time.sleep(4)
    js=lambda code:d.execute_async_script("const cb=arguments[arguments.length-1];(async()=>{try{const r=await ("+code+");cb(r)}catch(e){cb('ERR '+(e&&e.message||e))}})()")
    print("nuevo",js("(async()=>{document.getElementById('inNuevo').click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Animación')).click();await new Promise(r=>setTimeout(r,300));[...document.querySelectorAll('#inicio button')].find(b=>b.textContent.includes('Crear lienzo en blanco')).click();await new Promise(r=>setTimeout(r,1200));Studio.proj.nombre='Prueba auto';Studio.proj.mundos[0].nombre='ESCENA-RECUPERADA';Studio.changed();return 1})()"))
    time.sleep(6)
    print("versiones",js("window.__TAURI__.core.invoke('autoguardado_versiones',{nombre:'Prueba auto'})"))
    # cierre brusco: matar la app sin cerrar bien
    subprocess.run("pkill -9 -f target/debug/atrapacuentos-studio",shell=True)
    time.sleep(1);
    try:d.quit()
    except Exception:pass
    drv.terminate();time.sleep(1)
    drv=subprocess.Popen(["tauri-driver"],env=dict(os.environ),stderr=subprocess.DEVNULL);time.sleep(2)
    d=webdriver.Remote("http://127.0.0.1:4444",options=o);d.set_script_timeout(60);time.sleep(5)
    js=lambda code:d.execute_async_script("const cb=arguments[arguments.length-1];(async()=>{try{const r=await ("+code+");cb(r)}catch(e){cb('ERR '+(e&&e.message||e))}})()")
    print("dialogo",js("!!document.getElementById('recSi')"))
    print("recuperar",js("(async()=>{document.getElementById('recSi').click();await new Promise(r=>setTimeout(r,1500));return Studio.proj.mundos[0].nombre})()"))
    d.save_screenshot("/home/claude/prueba/auto.png")
    d.quit()
finally:
    subprocess.run("pkill -f tauri-driver",shell=True);xv.terminate()
