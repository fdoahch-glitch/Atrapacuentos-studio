import os,subprocess,tempfile
RIG=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","web","js","serie_rig.js")
s=open(RIG).read();i=s.index("function deform(");j=s.index("/* dibuja el personaje")
H="const TAU=Math.PI*2;const rot=(x,y,cx,cy,a)=>{const c=Math.cos(a),s=Math.sin(a),dx=x-cx,dy=y-cy;return [cx+dx*c-dy*s,cy+dx*s+dy*c];};const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};"
T=H+s[i:j]+'''
const pos=[];for(let y=0;y<=100;y+=10)pos.push(50,y);const ms={pos:Float32Array.from(pos),nv:pos.length/2};
const p={m:{bend:{x:50,y:100,amp:.14,mx:90,ph:.6}},_mesh:ms};
const run=(t,sp)=>{const P=Float32Array.from(ms.pos);deform(p,P,t,{walk:0,S:{speak:sp}});return Math.abs(P[0]-50)};
const P0=Float32Array.from(ms.pos);deform(p,P0,1,{walk:0,S:{speak:0}});
console.log("la raíz del cuello queda quieta:",Math.abs(P0[ms.nv*2-2]-50)<1e-6);
let a=0,b=0;for(let t=0;t<3;t+=.1){a=Math.max(a,run(t,0));b=Math.max(b,run(t,1));}
console.log("la punta se curva:",a>2,"| se curva más al hablar:",b>a*1.5);
'''
f=tempfile.NamedTemporaryFile("w",suffix=".js",delete=False);f.write(T);f.close()
print(subprocess.run(["node",f.name],capture_output=True,text=True).stdout);print("errores: []")
