import asyncio,json
from playwright.async_api import async_playwright
JS="""
(()=>{
const mk=(arms)=>{const c=document.createElement('canvas');c.width=400;c.height=700;const g=c.getContext('2d');
 const F=(col,f)=>{g.fillStyle=col;f();};
 F('#f3c9a0',()=>{g.beginPath();g.arc(200,90,60,0,7);g.fill();});               // cabeza
 F('#d33',()=>{g.fillRect(140,30,120,30);});                                        // sombrero rojo
 F('#f3c9a0',()=>g.fillRect(185,145,30,25));                                        // cuello
 F('#4fae64',()=>{g.beginPath();g.roundRect(140,170,120,190,20);g.fill();});        // torso
 F('#b9a46a',()=>{g.fillRect(145,350,50,260);g.fillRect(205,350,50,260);});         // piernas
 F('#5b3a22',()=>{g.fillRect(135,600,70,40);g.fillRect(195,600,70,40);});           // zapatos
 F('#4fae64',()=>{ if(arms==='out'){g.save();g.translate(140,190);g.rotate(2.2);g.fillRect(0,-15,150,30);g.restore();g.save();g.translate(260,190);g.rotate(.94);g.fillRect(0,-15,150,30);g.restore();}
   else if(arms==='down'){g.fillRect(105,180,32,170);g.fillRect(263,180,32,170);} });
 F('#f3c9a0',()=>{ if(arms==='down'){g.fillRect(105,350,32,30);g.fillRect(263,350,32,30);} });
 return c;};
const out={};
for(const a of ['out','down','none']){const r=Detecta.detectar(mk(a));out[a]={ok:r.ok,conf:r.conf,notas:r.notas,b:r.ok?Object.fromEntries(r.bones.map(b=>[b.name,[b.pv.map(Math.round),b.tip.map(Math.round)]])):null};}
// recorte con un clic sobre el sombrero rojo
const c=mk('down');const q=Detecta.recorteClic(c,200,45,38);
const xs=q.polys[0]?q.polys[0].map(p=>p[0]):[0],ys=q.polys[0]?q.polys[0].map(p=>p[1]):[0];
out.clic={n:q.polys.length,area:q.area,bbox:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)].map(Math.round)};
const q2=Detecta.recorteClic(c,200,260,38);const x2=q2.polys[0].map(p=>p[0]),y2=q2.polys[0].map(p=>p[1]);
out.clic_torso={bbox:[Math.min(...x2),Math.min(...y2),Math.max(...x2),Math.max(...y2)].map(Math.round)};
return out;})()
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    await pg.add_init_script("try{localStorage.atr_tutorial=1}catch(e){}")
    await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(1500)
    r=await pg.evaluate(JS);print(json.dumps(r,ensure_ascii=False,indent=0));print("errores",errs);await b.close()
asyncio.run(main())
