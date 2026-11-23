"""GL2D (dibujo 100 % WebGL2) contra el Canvas 2D del navegador como referencia, figura por figura.
Canvas 2D se usa aquí SOLO como regla de medir; la app ya no lo necesita para dibujar."""
import os, io, base64, asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageChops
FIGS = r"""
const F=[
 (g)=>{g.fillStyle="#d33f49";g.beginPath();g.moveTo(20,20);g.lineTo(180,40);g.lineTo(150,180);g.lineTo(30,150);g.closePath();g.fill();},
 (g)=>{g.fillStyle="#2a6fd6";g.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*4*Math.PI/5;const x=100+80*Math.cos(a),y=100+80*Math.sin(a);i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();},
 (g)=>{g.fillStyle="#3a9d4f";g.beginPath();g.moveTo(20,100);g.quadraticCurveTo(100,0,180,100);g.quadraticCurveTo(100,200,20,100);g.fill();},
 (g)=>{g.fillStyle="#9b59b6";g.beginPath();g.moveTo(20,160);g.bezierCurveTo(40,0,160,0,180,160);g.closePath();g.fill();},
 (g)=>{g.fillStyle="#e67e22";g.beginPath();g.ellipse(100,100,80,45,0.5,0,Math.PI*2);g.fill();g.fillStyle="#2c3e50";g.beginPath();g.arc(100,100,20,0,Math.PI*2);g.fill();},
 (g)=>{g.strokeStyle="#111";g.lineWidth=14;for(const [c,j,y] of [["butt","miter",40],["round","round",100],["square","bevel",160]]){g.lineCap=c;g.lineJoin=j;g.beginPath();g.moveTo(30,y+20);g.lineTo(80,y-20);g.lineTo(130,y+20);g.lineTo(170,y-10);g.stroke();}},
 (g)=>{g.strokeStyle="#c0392b";g.lineWidth=6;g.lineCap="round";g.setLineDash([14,10]);g.beginPath();g.arc(100,100,70,0,Math.PI*1.7);g.stroke();g.setLineDash([]);g.lineWidth=3;g.strokeRect(30,30,140,140);},
 (g)=>{const l=g.createLinearGradient(0,0,200,200);l.addColorStop(0,"#ff0");l.addColorStop(.5,"#f0f");l.addColorStop(1,"#0ff");g.fillStyle=l;g.fillRect(10,10,180,180);},
 (g)=>{const r=g.createRadialGradient(100,100,10,100,100,90);r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(1,"rgba(0,100,200,0)");g.fillStyle="#222";g.fillRect(0,0,200,200);g.fillStyle=r;g.fillRect(0,0,200,200);},
 (g)=>{g.save();g.translate(100,100);g.rotate(.6);g.scale(1.4,.7);g.fillStyle="#16a085";g.fillRect(-50,-50,100,100);g.restore();g.globalAlpha=.5;g.fillStyle="#f1c40f";g.fillRect(70,70,100,100);},
 (g)=>{g.fillStyle="#fff";g.fillRect(0,0,200,200);g.fillStyle="#f39c12";g.fillRect(20,20,120,120);g.globalCompositeOperation="multiply";g.fillStyle="#3498db";g.beginPath();g.arc(120,120,60,0,Math.PI*2);g.fill();},
 (g)=>{g.fillStyle="#8e44ad";g.fillRect(0,0,200,200);g.clearRect(40,40,80,80);g.fillStyle="#fff";g.beginPath();g.arc(100,100,10,0,6.3);g.fill();g.beginPath();g.moveTo(20,180);g.arcTo(180,180,180,100,40);g.lineTo(180,100);g.strokeStyle="#fff";g.lineWidth=5;g.stroke();},
];
"""
def img(u): return Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGBA")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await b.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:300])); pg.on("console", lambda m: errs.append(m.text[:300]) if m.type == "error" and "404" not in m.text else None)
        await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
        await pg.goto("http://localhost:" + os.environ.get("PORT", "8765") + "/index.html"); await pg.wait_for_timeout(1500)
        full = "(async()=>{" + FIGS.replace("const F=", "const F=") + "const R=async(modo)=>{const out=[];for(let i=0;i<F.length;i++){let g,cv;if(modo==='gl'){g=GL2D.crear(200,200,{muestras:8});cv=g.canvas;}else{cv=document.createElement('canvas');cv.width=200;cv.height=200;g=cv.getContext('2d');}F[i](g);if(modo==='gl')g.resolver();out.push(cv.toDataURL('image/png'));}return out;};return {a:await R('2d'),b:await R('gl')};})()"
        r = await pg.evaluate(full)
        nombres = ["polígono", "estrella (regla del cero)", "curvas cuadráticas", "curva bézier", "elipse y arco", "líneas con extremos y uniones", "línea punteada y rectángulo", "degradado lineal", "degradado radial con transparencia", "transformaciones y transparencia", "mezcla multiplicar", "borrar, arcTo y trazo"]
        malas = []; peor = 0
        for i, n in enumerate(nombres):
            A = img(r["a"][i]); B = img(r["b"][i]);             fa = Image.alpha_composite(Image.new("RGBA", A.size, (255, 255, 255, 255)), A).convert("RGB"); fb = Image.alpha_composite(Image.new("RGBA", B.size, (255, 255, 255, 255)), B).convert("RGB")
            d = ImageChops.difference(fa, fb); px = list(d.getdata()); N = len(px)
            media = sum(sum(q) for q in px) / (3 * N); grandes = sum(1 for q in px if max(q) > 80) / N
            ok = media < 1.2 and grandes < 0.008
            print(("igual " if ok else "DIFIERE"), f"{n}: media {media:.2f}, píxeles muy distintos {grandes*100:.2f} %")
            if not ok:
                malas.append(n)
                w = Image.new("RGB", (600, 200)); w.paste(fa, (0, 0)); w.paste(fb, (200, 0)); w.paste(d.point(lambda v: min(255, v * 4)), (400, 0)); w.save(f"/tmp/gl2d_{i}.png")
        print("errores:", errs)
        print("figuras:", len(nombres), "| distintas:", malas if malas else "ninguna")
        sys.exit(1 if (malas or errs) else 0)
asyncio.run(main())
