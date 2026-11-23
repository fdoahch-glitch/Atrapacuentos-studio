"""Corre las pruebas de interfaz contra la versión web (Chrome + Playwright).
Uso:  python pruebas/correr_ui.py [nombre ...]      (variable CHROME = ruta de Chrome si no está en /usr/bin/google-chrome)
Cada prueba declara qué texto debe aparecer en su salida para darse por buena; si aparece «Traceback» falla.
No inventa resultados: lo que se ve es lo que imprimió cada prueba."""
import os, subprocess, sys, time, urllib.request
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI = os.path.join(RAIZ, "pruebas", "ui")
# nombre -> textos obligatorios en la salida
PRUEBAS = {
    "acc.py": ["errores: []", "lentes"],
    "det.py": ['"ok": true', "errores []"],
    "det_ui.py": ["bones: 8", "errores: []"],
    "animal_ui.py": ["huesos: cuerpo,cola,cabeza,mandibula,muslo,canilla,muslo,canilla", "mira: -1", "errores: []"],
    "txt.py": ["saludar>caminar>saltarx2", "errores: []"],
    "vistas.py": ["agrandar: 400 -> 800", "vistas: ['perfil']", "errores: []"],
    "expx.py": ["cuadro t=1.25 igual (completo vs tramo): True", "movimiento suave distinto del normal: True", "errores: []"],
    "expv.py": ["¡Listo!", "errores: []"],
    "fps.py": ["errores: []"],
    "dist.py": ["botones ayuda: [True, True, True]", "reporte incluye error: True"],
    "anim2.py": ["errores: []"],
    "extras.py": ["'relampago': True", "controles: [True, True, True, True, True]", "errores: []"],
}
def servidor_listo():
    try: urllib.request.urlopen("http://localhost:8765/index.html", timeout=2); return True
    except Exception: return False
def main():
    elegidas = sys.argv[1:] or list(PRUEBAS)
    srv = None
    if not servidor_listo():
        srv = subprocess.Popen(["node", os.path.join(RAIZ, "web", "abrir-web.js")], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(30):
            if servidor_listo(): break
            time.sleep(0.5)
    fallos = []
    try:
        for nombre in elegidas:
            if nombre not in PRUEBAS: print("?? no conozco", nombre); fallos.append(nombre); continue
            t0 = time.time()
            r = subprocess.run([sys.executable, nombre], cwd=UI, capture_output=True, text=True, timeout=600)
            salida = r.stdout + r.stderr
            faltan = [x for x in PRUEBAS[nombre] if x not in salida]
            ok = r.returncode == 0 and "Traceback" not in salida and not faltan
            print(("OK   " if ok else "FALLA"), nombre, f"({time.time()-t0:.0f} s)", "" if ok else f"faltan: {faltan}")
            if not ok:
                fallos.append(nombre); print(salida[-1500:])
    finally:
        if srv: srv.terminate()
    print(f"\n{len(elegidas)-len(fallos)} de {len(elegidas)} pruebas buenas")
    sys.exit(1 if fallos else 0)
main()
