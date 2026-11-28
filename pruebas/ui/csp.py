import os, json, re
import asyncio
from playwright.async_api import async_playwright
# La aplicación de escritorio (Tauri 2) agrega sola un «nonce» a script-src y style-src; con un nonce presente el navegador IGNORA 'unsafe-inline'
# y bloquea todo estilo creado por el programa (la pantalla de inicio queda abajo, sin formato). Esta prueba imita esa regla leyendo
# src-tauri/tauri.conf.json y exige cero bloqueos: si alguien quita «dangerousDisableAssetCspModification», falla.
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
conf = json.load(open(os.path.join(RAIZ, "src-tauri", "tauri.conf.json"), encoding="utf8"))["app"]["security"]
CSP = conf["csp"]; DIS = conf.get("dangerousDisableAssetCspModification", False); NONCE = "n0nc3t4ur1"
def tauri_modifica(d): return not (DIS is True or (isinstance(DIS, list) and d in DIS))
if tauri_modifica("script-src"): CSP = CSP.replace("script-src 'self'", "script-src 'self' 'nonce-%s'" % NONCE)
if tauri_modifica("style-src"): CSP = CSP.replace("style-src 'self'", "style-src 'self' 'nonce-%s'" % NONCE)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get("CHROME","/usr/bin/google-chrome"),args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=await b.new_page(viewport={"width":1400,"height":860}); viol=[]; errs=[]
    pg.on("console",lambda m: viol.append(m.text[:140]) if ("Content Security Policy" in m.text or "Refused to" in m.text) else None)
    pg.on("pageerror",lambda e:errs.append(str(e)[:250]))
    async def ruta(route):
        r = await route.fetch(); html = (await r.body()).decode("utf8")
        if tauri_modifica("style-src"): html = re.sub(r"<style(?![^>]*nonce)", '<style nonce="%s"' % NONCE, html)
        if tauri_modifica("script-src"): html = re.sub(r'<script(?![^>]*\bsrc=)(?![^>]*nonce)', '<script nonce="%s"' % NONCE, html)
        h = dict(r.headers); h["content-security-policy"] = CSP
        await route.fulfill(status=200, headers=h, body=html)
    await pg.route("**/index.html", ruta)
    await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_function("window.__serieReady", timeout=60000); await pg.wait_for_timeout(2500)
    ini=await pg.evaluate("""(()=>{const i=document.getElementById('inicio');if(!i)return null;const s=getComputedStyle(i),r=i.getBoundingClientRect();return {pos:s.position,top:Math.round(r.top),h:Math.round(r.height),vh:innerHeight};})()""")
    top=await pg.evaluate("document.getElementById('top').getBoundingClientRect().height")
    print("bloqueos de seguridad:", len(viol), viol[:2])
    print("pantalla de inicio centrada y a pantalla completa:", bool(ini) and ini["pos"]=="fixed" and ini["top"]==0 and ini["h"]==ini["vh"])
    print("barra superior de una sola fila:", top<=60, round(top))
    print("errores:",errs); await b.close()
asyncio.run(main())
