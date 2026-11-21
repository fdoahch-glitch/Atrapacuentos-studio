/* Transiciones entre escenas, textos en pantalla (títulos y globos de diálogo) y efectos de ambiente
   (lluvia, nieve, estrellas…). Todo se dibuja sobre el cuadro, tanto en la vista previa como en el MP4. */
(function(){
const $=id=>document.getElementById(id);
const S=()=>window.Studio;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const TRANS=[["","Ninguna"],["fundido","Fundido desde negro"],["cortina","Cortina"],["destello","Destello blanco"],["iris","Círculo que se abre"],["persiana","Persianas"],["subir","Cortina hacia arriba"],["fundidoblanco","Fundido desde blanco"]];
const EFE=[["","Ninguno"],["lluvia","Lluvia"],["nieve","Nieve"],["estrellas","Estrellas"],["hojas","Hojas cayendo"],["luciernagas","Luciérnagas"],["burbujas","Burbujas"]];
const st={t:0,w:null,idx:0,n:1,edit:false};
const rnd=(i,k)=>{const x=Math.sin(i*12.9898+k*78.233)*43758.5453;return x-Math.floor(x);};
const fr=x=>x-Math.floor(x);

/* ---------- efectos de ambiente (se calculan solo con el tiempo, así el MP4 sale igual que la vista) ---------- */
function ambient(g,W,H,t,ef){
  g.save();
  if(ef==="lluvia"){
    g.strokeStyle="rgba(190,210,255,.55)";g.lineWidth=Math.max(1,H*.0025);g.beginPath();
    for(let i=0;i<150;i++){const sp=.9+rnd(i,2)*.7,y=fr(rnd(i,1)+t*sp)*1.1-.05,x=fr(rnd(i,0)+y*.12);
      g.moveTo(x*W,y*H);g.lineTo(x*W-H*.012,y*H+H*.045);}
    g.stroke();
  }else if(ef==="nieve"){
    g.fillStyle="rgba(255,255,255,.9)";
    for(let i=0;i<110;i++){const sp=.07+rnd(i,2)*.1,y=fr(rnd(i,1)+t*sp),x=fr(rnd(i,0)+Math.sin(t*.8+i)*.02),r=H*(.004+rnd(i,3)*.007);
      g.beginPath();g.arc(x*W,y*H,r,0,6.3);g.fill();}
  }else if(ef==="estrellas"){
    for(let i=0;i<90;i++){const x=rnd(i,0),y=rnd(i,1)*.65,tw=.5+.5*Math.sin(t*2+i*3.1),r=H*(.003+rnd(i,2)*.004);
      g.fillStyle="rgba(255,250,210,"+(.35+.65*tw).toFixed(2)+")";g.beginPath();g.arc(x*W,y*H,r*(.7+.5*tw),0,6.3);g.fill();}
  }else if(ef==="hojas"){
    const cols=["#e8832a","#c9462c","#d9a21b","#7fa33a"];
    for(let i=0;i<34;i++){const sp=.06+rnd(i,2)*.08,y=fr(rnd(i,1)+t*sp),x=fr(rnd(i,0)+Math.sin(t*.9+i*2)*.05),s=H*(.012+rnd(i,3)*.012);
      g.save();g.translate(x*W,y*H);g.rotate(t*(1+rnd(i,4))+i);g.fillStyle=cols[i%4];g.beginPath();g.ellipse(0,0,s,s*.5,0,0,6.3);g.fill();g.restore();}
  }else if(ef==="luciernagas"){
    for(let i=0;i<26;i++){const x=fr(rnd(i,0)+Math.sin(t*.3+i)*.06),y=.35+rnd(i,1)*.55+Math.sin(t*.5+i*1.7)*.04,a=.4+.6*Math.max(0,Math.sin(t*1.6+i*2.3)),r=H*.012;
      const gr=g.createRadialGradient(x*W,y*H,0,x*W,y*H,r*4);gr.addColorStop(0,"rgba(255,244,150,"+a.toFixed(2)+")");gr.addColorStop(1,"rgba(255,244,150,0)");
      g.fillStyle=gr;g.beginPath();g.arc(x*W,y*H,r*4,0,6.3);g.fill();}
  }else if(ef==="burbujas"){
    g.strokeStyle="rgba(210,240,255,.8)";g.lineWidth=Math.max(1,H*.003);
    for(let i=0;i<30;i++){const sp=.05+rnd(i,2)*.08,y=1-fr(rnd(i,1)+t*sp),x=fr(rnd(i,0)+Math.sin(t*1.2+i)*.015),r=H*(.01+rnd(i,3)*.025);
      g.beginPath();g.arc(x*W,y*H,r,0,6.3);g.stroke();}
  }
  g.restore();
}

/* ---------- textos: título o globo de diálogo ---------- */
const FONT="'Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif";
function wrap(g,txt,maxW){
  const ws=String(txt).split(/\s+/).filter(Boolean),rows=[];let row="";
  for(const w of ws){const test=row?row+" "+w:w;if(row&&g.measureText(test).width>maxW){rows.push(row);row=w;}else row=test;}
  if(row)rows.push(row);return rows;
}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function drawText(g,W,H,o){
  if(!o.txt)return;const fs=Math.round(H*(o.size||6)/100);g.save();
  g.font="800 "+fs+"px "+FONT;g.textBaseline="alphabetic";g.textAlign="center";
  const rows=wrap(g,o.txt,W*(o.tipo==="globo"?.34:.8)),lh=fs*1.25,cx=W*o.x/100,cy=H*o.y/100,mw=Math.max(...rows.map(r=>g.measureText(r).width));
  if(o.tipo==="globo"){
    const bw=mw+fs*1.2,bh=rows.length*lh+fs*.7,x=cx-bw/2,y=cy-bh/2;
    g.fillStyle="#fff";g.strokeStyle="#222";g.lineWidth=Math.max(2,fs*.08);
    rrect(g,x,y,bw,bh,fs*.6);g.fill();g.stroke();
    g.beginPath();g.moveTo(cx-fs*.5,y+bh-1);g.lineTo(cx-fs*.15,y+bh+fs*.9);g.lineTo(cx+fs*.3,y+bh-1);g.closePath();g.fillStyle="#fff";g.fill();
    g.beginPath();g.moveTo(cx-fs*.5,y+bh);g.lineTo(cx-fs*.15,y+bh+fs*.9);g.lineTo(cx+fs*.3,y+bh);g.stroke();
    g.fillStyle="#222";rows.forEach((r,i)=>g.fillText(r,cx,y+fs*.35+lh*i+fs));
  }else{
    g.lineJoin="round";g.lineWidth=Math.max(3,fs*.16);g.strokeStyle="#000";g.fillStyle="#fff";
    rows.forEach((r,i)=>{const yy=cy-(rows.length*lh)/2+lh*i+fs;g.strokeText(r,cx,yy);g.fillText(r,cx,yy);});
  }
  g.restore();
}

/* ---------- transiciones ---------- */
function trans(g,W,H){
  const w=st.w,t=st.t,P=S().proj;
  if(w.trans==="fundido"&&t<.8){g.fillStyle="rgba(0,0,0,"+(1-t/.8).toFixed(3)+")";g.fillRect(0,0,W,H);}
  else if(w.trans==="cortina"&&t<.8){const u=t/.8,e=u*u*(3-2*u);g.fillStyle="#000";g.fillRect(W*e,0,W,H);}
  else if(w.trans==="iris"&&t<.9){const u=t/.9,e=u*u*(3-2*u),r=e*Math.hypot(W,H)*.52;g.save();g.fillStyle="#000";g.beginPath();g.rect(0,0,W,H);g.arc(W/2,H/2,Math.max(0,r),0,6.2832,true);g.fill("evenodd");g.restore();}
  else if(w.trans==="persiana"&&t<.9){const u=t/.9,e=u*u*(3-2*u),n=8,hh=H/n;g.fillStyle="#000";for(let i=0;i<n;i++)g.fillRect(0,i*hh+hh*e,W,hh*(1-e)+1);}
  else if(w.trans==="subir"&&t<.8){const u=t/.8,e=u*u*(3-2*u);g.fillStyle="#000";g.fillRect(0,0,W,H*(1-e));}
  else if(w.trans==="fundidoblanco"&&t<.8){g.fillStyle="rgba(255,255,255,"+(1-t/.8).toFixed(3)+")";g.fillRect(0,0,W,H);}
  else if(w.trans==="destello"&&t<.5){g.fillStyle="rgba(255,255,255,"+(1-t/.5).toFixed(3)+")";g.fillRect(0,0,W,H);}
  if(P.finFade&&st.idx===st.n-1){const d=w.dur||6;if(t>d-.8){g.fillStyle="rgba(0,0,0,"+Math.min(1,(t-(d-.8))/.8).toFixed(3)+")";g.fillRect(0,0,W,H);}}
}

function tick(t,w){st.t=t;st.w=w;st.idx=S().proj.mundo;st.n=S().proj.mundos.length;st.edit=false;}
function draw(g,W,H){
  const w=st.w;if(!w)return;
  if(w.efecto)ambient(g,W,H,st.t,w.efecto);
  for(const o of (w.textos||[])){
    if(!st.edit){const t1=o.t1>0?o.t1:1e9;if(st.t<o.t0||st.t>t1)continue;}
    drawText(g,W,H,o);
  }
  if(!st.edit)trans(g,W,H);
}

/* mientras se edita (sin vista previa) se ven el ambiente y los textos para poder colocarlos */
function loop(){
  try{
    const c=$("subCv"),St=S();
    if(c&&St&&St.proj&&!St.playing&&!St.exporting){
      const r=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1,W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);
      if(W>0&&(c.width!==W||c.height!==H)){c.width=W;c.height=H;}
      const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);
      const w=St.proj.mundos[St.proj.mundo];
      if(w&&(w.efecto||(w.textos&&w.textos.length))){st.w=w;st.t=performance.now()/1000;st.edit=true;draw(g,c.width,c.height);st.edit=false;}
    }
  }catch(e){}
  requestAnimationFrame(loop);
}

/* ---------- panel de la escena ---------- */
function opts(list,cur){return list.map(x=>`<option value="${x[0]}" ${x[0]===cur?"selected":""}>${x[1]}</option>`).join("");}
function panel(w,props){
  const P=S().proj,ch=()=>S().changed();
  const a=document.createElement("div");a.className="card";
  a.innerHTML=`<h4>🌦️ Ambiente y transición</h4>
   <div class="row"><span>Ambiente</span><select id="fxE">${opts(EFE,w.efecto||"")}</select></div>
   <div class="row"><span>Al empezar</span><select id="fxT">${opts(TRANS,w.trans||"")}</select></div>
   <div class="row"><span>Fundido final</span><input id="fxF" type="checkbox" ${P.finFade?"checked":""}></div>
   <div class="sub" style="font-size:11px;opacity:.7">La transición se ve en «Vista previa» y en el MP4. El fundido final aplica a la última escena.</div>`;
  const b=document.createElement("div");b.className="card";
  b.innerHTML=`<h4>💬 Textos en pantalla</h4><div id="fxL"></div>
   <div class="row"><button id="fxAddT">➕ Título</button><button id="fxAddB">➕ Globo de diálogo</button></div>`;
  props.appendChild(a);props.appendChild(b);
  $("fxE").onchange=e=>{w.efecto=e.target.value;ch();};$("fxT").onchange=e=>{w.trans=e.target.value;ch();};$("fxF").onchange=e=>{P.finFade=e.target.checked;ch();};
  const L=$("fxL"),ls=w.textos||(w.textos=[]);
  ls.forEach((o,k)=>{
    const d=document.createElement("div");d.style.cssText="background:#1c2036;border-radius:10px;padding:8px;margin:6px 0";
    d.innerHTML=`<div class="row"><select class="tp"><option value="titulo" ${o.tipo!=="globo"?"selected":""}>Título</option><option value="globo" ${o.tipo==="globo"?"selected":""}>Globo</option></select><button class="dl">✖</button></div>
    <input class="tx" type="text" value="${esc(o.txt||"")}" placeholder="Escribe el texto…" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:8px;padding:6px;margin:4px 0">
    <div class="row"><span>Izq ↔ Der</span><input class="px" type="range" min="5" max="95" value="${o.x}"></div>
    <div class="row"><span>Arriba ↕ Abajo</span><input class="py" type="range" min="5" max="95" value="${o.y}"></div>
    <div class="row"><span>Tamaño</span><input class="sz" type="range" min="3" max="14" value="${o.size||6}"></div>
    <div class="row"><span>Aparece (s)</span><input class="t0" type="number" min="0" step=".5" value="${o.t0||0}" style="width:60px"><span>Hasta (s)</span><input class="t1" type="number" min="0" step=".5" value="${o.t1||0}" style="width:60px"></div>
    <div class="sub" style="font-size:11px;opacity:.7">«Hasta» 0 = hasta el final de la escena.</div>`;
    const q=s=>d.querySelector(s);
    q(".tp").onchange=e=>{o.tipo=e.target.value;ch();};q(".tx").onchange=e=>{o.txt=e.target.value;ch();};
    q(".px").oninput=e=>{o.x=+e.target.value;};q(".px").onchange=ch;q(".py").oninput=e=>{o.y=+e.target.value;};q(".py").onchange=ch;
    q(".sz").oninput=e=>{o.size=+e.target.value;};q(".sz").onchange=ch;
    q(".t0").onchange=e=>{o.t0=+e.target.value||0;ch();};q(".t1").onchange=e=>{o.t1=+e.target.value||0;ch();};
    q(".dl").onclick=()=>{ls.splice(k,1);ch();};
    L.appendChild(d);
  });
  const add=tipo=>{ls.push({id:"t"+Date.now().toString(36),tipo,txt:tipo==="globo"?"¡Hola!":"Título",x:50,y:tipo==="globo"?30:18,size:tipo==="globo"?5:9,t0:0,t1:0});ch();};
  $("fxAddT").onclick=()=>add("titulo");$("fxAddB").onclick=()=>add("globo");
}

window.Fx={tick,draw,panel};
requestAnimationFrame(loop);
})();
