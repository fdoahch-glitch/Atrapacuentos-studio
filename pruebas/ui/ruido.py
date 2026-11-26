import os, asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"),
            args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await b.new_page()
        await pg.goto("http://localhost:8765/index.html")
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("""() => {
          const sr=8000,n=sr*2,d=new Float32Array(n);
          let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
          for(let i=0;i<n;i++){const t=i/sr;d[i]=(rnd()*2-1)*.005;if(t>=.5&&t<1.5)d[i]+=.08*Math.sin(2*Math.PI*440*t);}
          const buf={sampleRate:sr,duration:2,getChannelData:()=>d};
          const out=DubFX.process(buf,{noiseReduction:1,trimA:0,trimB:2}).data;
          const rms=(x,a,b)=>{let s=0,k=0;for(let i=Math.round(a*sr);i<Math.round(b*sr);i++){s+=x[i]*x[i];k++;}return Math.sqrt(s/k);};
          return {ruidoAntes:rms(d,.05,.35),ruidoDespues:rms(out,.05,.35),vozAntes:rms(d,.65,1.35),vozDespues:rms(out,.65,1.35)};
        }""")
        ruido = r["ruidoDespues"] < r["ruidoAntes"] * .55
        voz = r["vozDespues"] > r["vozAntes"] * .85
        print("ruido atenuado:",ruido,"voz conservada:",voz,"medidas:",r)
        await b.close()
        if not (ruido and voz): raise SystemExit(1)

asyncio.run(main())
