/* Biblioteca de poses y ciclos de caminata reutilizables */
(function(){
"use strict";
const S=()=>window.Serie;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const PRE={
 brazosarriba:{n:"🙌 Brazos arriba",v:{"brazo:d":-2.6,"brazo:i":2.6},dy:.01,expr:"feliz"},
 brazosabiertos:{n:"🤗 Brazos abiertos",v:{"brazo:d":-1.3,"brazo:i":1.3}},
 pensando:{n:"🤔 Pensando",v:{"cabeza:":.14,"brazo:d":-.55}},
 triste:{n:"😞 Cabeza baja",v:{"cabeza:":.28,"brazo:d":.12,"brazo:i":-.12},ra:.03,expr:"triste"},
 agachado:{n:"🧎 Agachado",v:{"cabeza:":.1,"pata:d":.25,"pata:i":-.25},dy:-.07},
 alerta:{n:"👀 Alerta",v:{"cabeza:":-.12,"brazo:d":.2,"brazo:i":-.2},ra:-.03,expr:"sorpresa"},
 corriendo:{n:"🏃 Impulso",v:{"brazo:d":-.9,"brazo:i":.9,"pata:d":.4,"pata:i":-.4},ra:.1}};
const ROLES={brazo:"Brazo",saluda:"Mano que saluda",pata:"Pierna",muslo:"Muslo",canilla:"Canilla",cabeza:"Cabeza",cola:"Cola",torso:"Torso",cuello:"Cuello",oreja:"Oreja",mandibula:"Mandíbula",colgante:"Colgante",ala:"Ala"};
const LADO={i:" izquierdo",d:" derecho","":""};
function css(){if(document.getElementById("posCss"))return;const s=el("style");s.id="posCss";s.textContent=`
.pFloat{position:fixed;right:18px;top:70px;z-index:8000;width:310px;max-height:84vh;overflow:auto;background:#1b1e36;border:1px solid #7a5cff;border-radius:14px;padding:12px;color:#eef;font:13px system-ui,sans-serif;box-shadow:0 14px 40px #000b}
.pFloat h4{margin:0 0 8px;font-size:15px}.pFloat .r{display:grid;grid-template-columns:1fr 120px 42px;gap:6px;align-items:center;margin:3px 0}
.pFloat .r b{font-weight:500;font-size:12px}.pFloat input[type=range]{width:100%}.pFloat input[type=text],.pFloat select{width:100%;background:#12142a;color:#eef;border:1px solid #3a3f6a;border-radius:8px;padding:5px}
.pFloat button{background:#2b3058;color:#eef;border:1px solid #4a4f86;border-radius:9px;padding:6px 10px;cursor:pointer;font:inherit}.pFloat button.pri{background:#7a5cff}.pFloat .bt{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}`;document.head.appendChild(s);}
let box=null;
function cerrar(){if(box){box.remove();box=null;}const it=cur();if(it){delete it._poseEdit;delete it._gaitEdit;}S().draw();}
const cur=()=>{const sc=S().curScene();return sc.items.find(i=>i.uid===S().sel);};
function grupos(def){const o=[],seen={};for(const p of def.piezas){if(!p.rol||!ROLES[p.rol])continue;const k=p.rol+":"+(p.lado||"");if(seen[k])continue;seen[k]=1;o.push([k,ROLES[p.rol]+(LADO[p.lado||""]||"")]);}return o;}
function slider(lbl,min,max,step,val,on,fmt){const r=el("div","r"),b=el("b","",lbl),i=el("input");i.type="range";i.min=min;i.max=max;i.step=step;i.value=val;const v=el("span","",fmt?fmt(val):val);i.oninput=()=>{v.textContent=fmt?fmt(+i.value):i.value;on(+i.value);};r.append(b,i,v);return r;}
/* ---- crear una pose ---- */
function editarPose(it){
  it=it||cur();if(!it||it.kind!=="actor"){S().say("Toca un personaje primero.");return;}css();cerrar();
  const def=S().defOf(it),G=grupos(def);if(!G.length){S().say("Este personaje no tiene piezas con nombre de parte (brazo, pierna…). Hazlo con el esqueleto automático.");return;}
  const P={v:{},dy:0,ra:0,expr:""};it._poseEdit=P;
  box=el("div","pFloat");box.append(el("h4","","🧍 Crear una pose"));
  const hint=el("div","","<span style='opacity:.7;font-size:12px'>Mueve los deslizadores y mira al personaje en la escena. Al terminar, ponle nombre y guárdala.</span>");box.append(hint);
  for(const [k,n] of G)box.append(slider(n,-180,180,1,0,v=>{P.v[k]=v*Math.PI/180;S().draw();},v=>v+"°"));
  box.append(slider("Subir / agachar",-15,15,1,0,v=>{P.dy=v/100;S().draw();},v=>v+"%"));
  box.append(slider("Inclinar el cuerpo",-30,30,1,0,v=>{P.ra=v/100;S().draw();},v=>v+"°"));
  const sel=el("select","",[["","Cara normal"],["feliz","Feliz"],["triste","Triste"],["sorpresa","Sorprendido"],["enojo","Enojado"]].map(([v,l])=>`<option value="${v}">${l}</option>`).join(""));sel.onchange=()=>{P.expr=sel.value;S().draw();};box.append(sel);
  const nm=el("input");nm.type="text";nm.placeholder="Nombre de la pose";nm.style.marginTop="8px";box.append(nm);
  const bt=el("div","bt"),g=el("button","pri","💾 Guardar pose"),c=el("button","","Cancelar");
  g.onclick=()=>{const n=nm.value.trim();if(!n){nm.focus();return;}const pr=S().proj;pr.poses=pr.poses||{};const id="p"+Date.now().toString(36);pr.poses[id]={n:"⭐ "+n,v:Object.assign({},P.v),dy:P.dy,ra:P.ra,expr:P.expr};cerrar();S().changed();S().renderProps&&S().renderProps();S().say("Pose guardada. Aparece en la lista de poses.");};
  c.onclick=cerrar;bt.append(g,c);box.append(bt);document.body.appendChild(box);S().draw();
}
/* ---- ajustar el ciclo de caminata ---- */
const GP=[["hz","Velocidad de pasos",.4,2.2,.05,1],["aw","Balanceo de brazos y piernas",0,2,.05,1],["bob","Rebote del cuerpo",0,3,.05,1],["lean","Inclinación hacia adelante",-.2,.3,.01,0],["lift","Altura de la pisada",0,2,.05,1],["stride","Largo del paso",.4,1.6,.05,1],["duty","Tiempo con el pie en el suelo",.5,.85,.01,.62]];
function editarCiclo(it){
  it=it||cur();if(!it||it.kind!=="actor"){S().say("Toca un personaje primero.");return;}css();cerrar();
  const base=Object.assign({},...GP.map(([k,,,,,d])=>({[k]:d})),S().gaitOf(it)),G=Object.assign({},base);it._gaitEdit=G;
  box=el("div","pFloat");box.append(el("h4","","🚶 Ajustar cómo camina"));
  box.append(el("div","","<span style='opacity:.7;font-size:12px'>Dale ▶ en una escena donde camine para ver el cambio.</span>"));
  for(const [k,n,mn,mx,st] of GP)box.append(slider(n,mn,mx,st,G[k],v=>{G[k]=v;S().draw();},v=>(+v).toFixed(2)));
  const nm=el("input");nm.type="text";nm.placeholder="Nombre del ciclo (ej. Caminar de Nina)";nm.style.marginTop="8px";box.append(nm);
  const bt=el("div","bt"),g=el("button","pri","💾 Guardar ciclo"),c=el("button","","Cancelar");
  g.onclick=()=>{const n=nm.value.trim();if(!n){nm.focus();return;}const pr=S().proj;pr.ciclos=pr.ciclos||{};const id="c"+Date.now().toString(36);pr.ciclos[id]={n:"⭐ "+n,g:Object.assign({},G)};it.ciclo=id;cerrar();S().changed();S().renderProps&&S().renderProps();S().say("Ciclo guardado: puedes usarlo en cualquier personaje de este proyecto.");};
  c.onclick=cerrar;bt.append(g,c);box.append(bt);document.body.appendChild(box);S().draw();
}
window.Poses={PRE,editarPose,editarCiclo,cerrar,ROLES};
})();
