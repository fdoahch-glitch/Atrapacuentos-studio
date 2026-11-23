/* Guías de composición sobre el lienzo (solo para editar: nunca salen en el video ni en las fotos).
   Regla de tercios, centro, diagonales, proporción áurea y zonas seguras (TV y Shorts/Reels). */
(function(){
if(window.__RENDER)return;
const $=id=>document.getElementById(id);
const GUIAS=[["tercios","▦ Regla de tercios"],["centro","✚ Centro"],["diag","⟋ Diagonales"],["aurea","φ Proporción áurea"],["tv","📺 Zona segura TV (90%)"],["shorts","📱 Zona segura Shorts/Reels"]];
const lee=()=>{try{return JSON.parse(localStorage.getItem("atr_guias")||"[]");}catch(e){return [];}};
let on=new Set(lee());
const L=(x1,y1,x2,y2,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c||"#ffffffb0"}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
const R=(x,y,w,h,c,d)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="1.2" vector-effect="non-scaling-stroke" ${d?`stroke-dasharray="${d}"`:""}/>`;
function dibuja(){
  const fr=$("frame");if(!fr)return;let sv=$("guiasSvg");
  if(!sv){sv=document.createElementNS("http://www.w3.org/2000/svg","svg");sv.id="guiasSvg";sv.setAttribute("viewBox","0 0 100 100");sv.setAttribute("preserveAspectRatio","none");sv.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4";fr.appendChild(sv);}
  let h="";
  if(on.has("tercios"))h+=L(33.333,0,33.333,100)+L(66.667,0,66.667,100)+L(0,33.333,100,33.333)+L(0,66.667,100,66.667)+[[33.333,33.333],[66.667,33.333],[33.333,66.667],[66.667,66.667]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".7" fill="#ffd166"/>`).join("");
  if(on.has("centro"))h+=L(50,0,50,100,"#7ee787b0")+L(0,50,100,50,"#7ee787b0");
  if(on.has("diag"))h+=L(0,0,100,100,"#ffffff70")+L(100,0,0,100,"#ffffff70");
  if(on.has("aurea"))h+=L(38.2,0,38.2,100,"#ffb347b0")+L(61.8,0,61.8,100,"#ffb347b0")+L(0,38.2,100,38.2,"#ffb347b0")+L(0,61.8,100,61.8,"#ffb347b0");
  if(on.has("tv"))h+=R(5,5,90,90,"#ff8a8a","3 2");
  if(on.has("shorts"))h+=R(6,10,88,62,"#7cc4ff","3 2")+`<text x="8" y="78" font-size="3" fill="#7cc4ff" style="font-family:sans-serif">abajo: botones y texto de la app</text>`;
  sv.innerHTML=h;
}
function menu(){
  const old=$("guiasMenu");if(old){old.remove();return;}
  const fr=$("frame");const m=document.createElement("div");m.id="guiasMenu";m.style.cssText="position:absolute;left:8px;bottom:40px;z-index:6;background:#1b1e30f2;border:1px solid #343a58;border-radius:10px;padding:8px 10px;font:12.5px system-ui;color:#fff";
  m.innerHTML=GUIAS.map(([k,n])=>`<label style="display:block;margin:3px 0;cursor:pointer"><input type="checkbox" data-g="${k}" ${on.has(k)?"checked":""}> ${n}</label>`).join("")+`<div style="font-size:11px;opacity:.65;margin-top:4px">Solo se ven al editar; no salen en el video.</div>`;
  fr.appendChild(m);
  m.querySelectorAll("[data-g]").forEach(c=>c.onchange=()=>{c.checked?on.add(c.dataset.g):on.delete(c.dataset.g);try{localStorage.setItem("atr_guias",JSON.stringify([...on]));}catch(e){}dibuja();});
}
function init(){
  const fr=$("frame");if(!fr||$("guiasBtn"))return;
  const b=document.createElement("button");b.id="guiasBtn";b.textContent="📐 Guías";b.title="Guías de composición (solo para editar)";b.style.cssText="position:absolute;left:8px;bottom:8px;z-index:6;background:#000a;color:#fff;border:1px solid #ffffff40;border-radius:8px;padding:3px 9px;font:12px system-ui;cursor:pointer";
  b.onclick=menu;fr.appendChild(b);dibuja();
}
window.Composicion={on:k=>{on.add(k);dibuja();},off:k=>{on.delete(k);dibuja();},activas:()=>[...on],GUIAS};
if(document.getElementById("frame"))init();else document.addEventListener("studio-ready",init);
document.addEventListener("studio-ready",init);
})();
