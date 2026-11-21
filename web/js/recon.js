/* Reconstruir un escenario desde una imagen: mide colores, horizonte y manchas (árboles, rocas, montañas)
   y arma la escena con piezas 3D del catálogo, usando los colores de la imagen. Es una aproximación, sin IA. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const GW=128,GH=72;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const hex=(r,g,b)=>"#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("");
const lum=(r,g,b)=>(r+g+b)/3, sat=(r,g,b)=>Math.max(r,g,b)-Math.min(r,g,b);
const isSky=(r,g,b)=>{const l=lum(r,g,b),s=sat(r,g,b);return (b>r+8&&b>=g-6&&l>90)||(l>205&&s<40);};
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error("imagen"));i.src=src;});}

function analyze(img){
  const c=document.createElement("canvas");c.width=GW;c.height=GH;const g=c.getContext("2d");g.drawImage(img,0,0,GW,GH);
  const d=g.getImageData(0,0,GW,GH).data,px=(x,y)=>{const i=(y*GW+x)*4;return [d[i],d[i+1],d[i+2]];};
  /* horizonte */
  let hor=0;for(let y=0;y<GH;y++){let s=0;for(let x=0;x<GW;x++)if(isSky(...px(x,y)))s++;if(s/GW>.5)hor=y;else if(y>hor+4)break;}
  hor=clamp(hor,0,Math.round(GH*.68));
  /* color del cielo y del suelo (mediana de la franja inferior) */
  const med=(arr,k)=>{const a=arr.map(v=>v[k]).sort((p,q)=>p-q);return a[a.length>>1]||0;};
  const skyPx=[],gPx=[];
  for(let x=0;x<GW;x+=2){skyPx.push(px(x,Math.max(0,Math.min(hor,3))));}
  for(let y=Math.round(GH*.88);y<GH;y++)for(let x=0;x<GW;x+=2)gPx.push(px(x,y));
  const sky=[med(skyPx,0),med(skyPx,1),med(skyPx,2)],ground=[med(gPx,0),med(gPx,1),med(gPx,2)],gl=lum(...ground);
  /* el suelo empieza donde, de abajo hacia arriba, aún hay color de suelo en buena parte de la fila */
  let gtop=GH;
  for(let y=GH-1;y>=Math.round(GH*.3);y--){let n=0;for(let x=0;x<GW;x+=2){const p=px(x,y);if(Math.hypot(p[0]-ground[0],p[1]-ground[1],p[2]-ground[2])<70)n++;}if(n/(GW/2)>=.35)gtop=y;else if(gtop-y>3)break;}
  if(gtop<GH)hor=Math.max(hor,gtop-1);
  /* máscaras */
  const kind=new Uint8Array(GW*GH); /* 1 follaje, 2 roca, 3 montaña/lejano */
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
    const [r,gg,b]=px(x,y),l=lum(r,gg,b),s=sat(r,gg,b);
    if((Math.hypot(r-sky[0],gg-sky[1],b-sky[2])<60||(l>205&&s<40)||(y<3&&isSky(r,gg,b)))&&y<=hor+2)continue;
    const green=gg>r+6&&gg>b+6;
    if(green&&l<gl*.82&&y>hor-6){kind[y*GW+x]=1;continue;}
    if(green&&l<110&&y<=hor+8){kind[y*GW+x]=1;continue;}
    if(y>hor+2&&s<28&&l>70&&l<190&&Math.abs(l-gl)>24){kind[y*GW+x]=2;continue;}
    if(y<=hor+4&&s<70&&!green&&l<190&&l>50){kind[y*GW+x]=3;}
  }
  /* componentes conectados */
  const seen=new Uint8Array(GW*GH),comps=[];
  for(let i0=0;i0<GW*GH;i0++){
    const k=kind[i0];if(!k||seen[i0])continue;
    const q=[i0];seen[i0]=1;let x0=GW,x1=0,y0=GH,y1=0,n=0,sr=0,sg=0,sb=0;
    while(q.length){const i=q.pop(),x=i%GW,y=(i/GW)|0;n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);const p=px(x,y);sr+=p[0];sg+=p[1];sb+=p[2];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=ny*GW+nx;if(!seen[j]&&kind[j]===k){seen[j]=1;q.push(j);}}}
    if(n>=(k===3?60:7))comps.push({k,n,x0,x1,y0,y1,col:[sr/n,sg/n,sb/n]});
  }
  /* el tronco: prolonga hacia abajo el follaje por píxeles marrones */
  for(const c of comps){if(c.k!==1)continue;
    const cx=Math.round((c.x0+c.x1)/2);let y=c.y1+1;
    while(y<GH-1){let br=0;for(let x=cx-2;x<=cx+2;x++){if(x<0||x>=GW)continue;const [r,gg,b]=px(x,y);if(r>gg-4&&r>b&&lum(r,gg,b)<130)br++;}if(br>=1)y++;else break;}
    c.feet=Math.min(GH-1,y);
  }
  const lsky=lum(...sky);
  const pre=lsky<70?"noche":(sky[0]>sky[2]+25&&sky[0]>150)?"atardecer":"dia";
  const gr=ground;let suelo="pasto";
  if(lum(...gr)>205&&sat(...gr)<45)suelo="nieve";
  else if(gr[0]>gr[1]+10&&gr[0]>gr[2]+40&&lum(...gr)>150)suelo="arena";
  else if(gr[0]>gr[1]&&gr[0]>gr[2]+15)suelo="tierra";
  else if(sat(...gr)<28)suelo="roca";
  return {hor,sky,ground,pre,suelo,comps,W:GW,H:GH};
}

/* ---------- de la imagen al mundo ---------- */
const CZ=-8.7,TAN=Math.tan(.4),ASP=1.78;
const hw=z=>(z-CZ)*TAN*ASP;                 /* medio ancho visible a esa distancia */
function plan(a,max){
  const out=[];
  const dZ=(yb)=>clamp(4+(1-(yb-a.hor)/Math.max(8,a.H-a.hor))*52,3,60);
  for(const c of a.comps){
    const w=c.x1-c.x0+1,h=c.y1-c.y0+1,cx=(c.x0+c.x1+1)/2/a.W,feet=c.feet||c.y1;
    if(c.k===1){
      const z=dZ(feet),d=z-CZ,fh=(feet-c.y0+1)/a.H,alto=clamp(fh*2*d*TAN,1.2,18),x=(cx-.5)*2*hw(z);
      const r=c.col[0],g=c.col[1],b=c.col[2];
      let id="roble";
      if(r>g+25&&r>b+25)id="cerezo";
      else if(h/w>1.5&&lum(r,g,b)<95)id="pino";
      else if(a.suelo==="arena")id="palmera";
      if(alto<2)id="arbusto";
      const over={alto:+alto.toFixed(1),paleta:{hoja:hex(r*.95,g*.95,b*.95),hoja2:hex(r*1.35+20,g*1.3+25,b*1.25+10)}};
      out.push({id,x:+x.toFixed(1),z:+z.toFixed(1),over,area:c.n});
    }else if(c.k===2){
      const z=dZ(c.y1),d=z-CZ,alto=clamp((h/a.H)*2*d*TAN,.5,6),x=(cx-.5)*2*hw(z);
      out.push({id:"roca",x:+x.toFixed(1),z:+z.toFixed(1),over:{alto:+alto.toFixed(1),paleta:{roca:hex(...c.col),roca2:hex(c.col[0]*1.2+10,c.col[1]*1.2+10,c.col[2]*1.2+10)}},area:c.n});
    }else{
      const z=76,d=z-CZ,alto=clamp((h/a.H)*2*d*TAN*1.3,8,34),x=(cx-.5)*2*hw(z);
      out.push({id:lum(...c.col)>170?"montana":"colina",x:+x.toFixed(1),z,over:{alto:+alto.toFixed(1),paleta:{roca:hex(...c.col),base:hex(c.col[0]*.9,c.col[1]*.95,c.col[2]*.9)}},area:c.n});
    }
  }
  out.sort((p,q)=>q.area-p.area);const keep=out.slice(0,max);
  return keep.sort((p,q)=>q.z-p.z);
}

/* ---------- ventana ---------- */
let box=null,st=null;
function shell(){
  box=document.createElement("div");box.id="rcBox";box.className="modal";
  box.innerHTML=`<div class="mbox" style="max-width:720px"><h2>🪄 Reconstruir desde una imagen</h2>
  <p id="rcHelp">Sube un dibujo o foto de un paisaje. Busco el cielo, el suelo, los árboles, rocas y montañas y armo la escena en 3D con los colores de tu imagen.</p>
  <div class="btns"><button id="rcFile" class="pri">⬆️ Subir imagen</button><input type="file" id="rcIn" accept="image/*" hidden></div>
  <div id="rcWork" hidden>
    <canvas id="rcCv" width="640" height="360" style="width:100%;max-width:640px;border-radius:10px;background:#222"></canvas>
    <p id="rcSum" style="margin:6px 0"></p>
    <div class="row"><span>Máx. de elementos</span><input id="rcMax" type="range" min="3" max="40" value="18"><b id="rcMaxT" style="width:30px">18</b></div>
    <div class="row"><span>Reemplazar lo que hay</span><input id="rcRep" type="checkbox" checked></div>
    <div class="row"><span>Imagen como fondo lejano</span><input id="rcBg" type="checkbox" checked></div>
  </div>
  <div class="wnav"><button id="rcOk" class="pri" hidden>✔ Crear escena en 3D</button><button id="rcX">Cerrar</button></div></div>`;
  document.body.appendChild(box);
  $("rcX").onclick=()=>{box.hidden=true;};
  $("rcFile").onclick=()=>$("rcIn").click();
  $("rcIn").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f)return;const fr=new FileReader();fr.onload=()=>start(fr.result);fr.readAsDataURL(f);};
  $("rcMax").oninput=()=>{$("rcMaxT").textContent=$("rcMax").value;if(st)show();};
  $("rcOk").onclick=apply;
}
const COLS={roble:"#3cd14a",pino:"#14a37f",cerezo:"#ff7ac0",palmera:"#9bd62c",arbusto:"#7be08a",roca:"#c0c0c0",montana:"#9fb4ff",colina:"#7aa0ff"};
function show(){
  const c=$("rcCv"),g=c.getContext("2d");g.drawImage(st.img,0,0,c.width,c.height);
  const list=plan(st.a,+$("rcMax").value);st.list=list;
  const sx=c.width/st.a.W,sy=c.height/st.a.H;
  g.lineWidth=2;g.font="bold 13px sans-serif";
  for(const co of st.a.comps){const e=list.find(l=>Math.abs(l.area-co.n)<1&&true);if(!e)continue;
    g.strokeStyle=COLS[e.id]||"#fff";g.strokeRect(co.x0*sx,co.y0*sy,(co.x1-co.x0+1)*sx,((co.feet||co.y1)-co.y0+1)*sy);
    g.fillStyle=g.strokeStyle;g.fillText(e.id,co.x0*sx+2,co.y0*sy+14);}
  g.strokeStyle="#ffd23f";g.setLineDash([6,4]);g.beginPath();g.moveTo(0,st.a.hor*sy);g.lineTo(c.width,st.a.hor*sy);g.stroke();g.setLineDash([]);
  const cnt={};list.forEach(l=>cnt[l.id]=(cnt[l.id]||0)+1);
  const nm={roble:"robles",pino:"pinos",cerezo:"cerezos",palmera:"palmeras",arbusto:"arbustos",roca:"rocas",montana:"montañas",colina:"colinas"};
  $("rcSum").textContent="Encontré: "+(Object.keys(cnt).map(k=>cnt[k]+" "+nm[k]).join(", ")||"nada claro")+" · suelo: "+st.a.suelo+" · momento: "+({dia:"día",atardecer:"atardecer",noche:"noche"})[st.a.pre]+".";
}
async function start(src){
  const img=await loadImg(src),a=analyze(img);
  st={img,a,src};$("rcWork").hidden=false;$("rcOk").hidden=false;show();
  $("rcHelp").textContent="Revisa lo que encontré. La línea punteada es el horizonte. Cuando esté bien, crea la escena.";
}
function apply(){
  const Stu=window.Studio,w=Stu.proj.mundos[Stu.proj.mundo],a=st.a;
  if($("rcRep").checked)Stu.clearItems();
  w.pre=a.pre;w.suelo=a.suelo;
  for(const o of st.list)Stu.place(o.id,{x:o.x,z:o.z,over:o.over,quiet:true});
  if($("rcBg").checked&&window.Scenery){
    /* la imagen también va de fondo lejano, con relieve automático */
    const c=document.createElement("canvas"),k=Math.min(1,1280/Math.max(st.img.naturalWidth,st.img.naturalHeight));
    c.width=Math.round(st.img.naturalWidth*k);c.height=Math.round(st.img.naturalHeight*k);c.getContext("2d").drawImage(st.img,0,0,c.width,c.height);
    const f={id:"fd"+Date.now().toString(36),src:c.toDataURL("image/jpeg",.85),depth:Scenery.autoDepth(st.img).toDataURL("image/png"),n:4,fuerza:.5};
    w.fondo=f;w.bg="";
  }else{delete w.fondo;}
  Stu.applyWorldLook(w);
  box.hidden=true;Stu.changed();Stu.showScene&&Stu.showScene();
  Stu.say("Escena creada con "+st.list.length+" elementos. Puedes moverlos, cambiarles el color o agregar más.");
}
function open(){if(!box)shell();box.hidden=false;}
window.Recon={open,analyze,plan};
})();
