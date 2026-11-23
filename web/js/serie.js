/* Atrapacuentos Studio · Modo Serie
   Editor de animación por recortes: elenco, fondos, decoración, cámara, voces y subtítulos, exportar a MP4.
   Usa el estudio de grabación (dub.js), los subtítulos (subs.js), los efectos (fx.js) y la exportación (export.js) que ya existían. */
(function(){
"use strict";
const A=window.SerieArt,Rig=window.SerieRig;
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=()=>"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=u=>u*u*(3-2*u),TAU=Math.PI*2;
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};

let proj=null,IMG={},sel=null,edT=0,rail="act",decCat="plantas",tmr=0,saveTmr=0,thumbTmr=0,redo=[],undo=[],lastSnap="";
const pv={on:false,all:false,t:0,exp:null,last:0};
const SPD=Object.fromEntries(A.SP.map(s=>[s.id,s]));
const BGS=Object.fromEntries(A.BG.map(b=>[b.id,b]));
const DEPTH={arbol:45,pino:45,araucaria:40,palmera:45,helecho:50,casa:45,carpa:50,volcan:15,arcoiris:8,nube:10,sol:6,luna:6,estrella:8,pajaros:12,estalactita:20,flores:70,pasto:72,arbusto:66,hongo:68,roca:64,rocas:62,huellas:70};

/* ---------------- proyecto ---------------- */
function newScene(nombre,fondo){return {nombre:nombre||"Escena",dur:10,fondo:fondo||{id:"pradera"},hora:"",items:[],cam:{z0:1,z1:1,x0:0,x1:0},lineas:[],efecto:"",trans:"",textos:[]};}
/* Lienzo: la altura de la escena siempre mide 720 unidades; el ancho depende del formato. */
const FMT={"16:9":{n:"Horizontal 16:9 (YouTube)",w:1280,h:720},"9:16":{n:"Vertical 9:16 (Shorts, Reels, TikTok)",w:405,h:720},"1:1":{n:"Cuadrado 1:1 (Instagram)",w:720,h:720}};
const BASES=[[720,"720p (HD)"],[1080,"1080p (Full HD)"],[1440,"1440p (2K)"],[2160,"2160p (4K)"]];
function lienzoDe(p){const l=Object.assign({fmt:"16:9",base:1080,fps:30,mbps:0},(p&&p.lienzo)||{});if(!FMT[l.fmt])l.fmt="16:9";return l;}
function UW(){return FMT[lienzoDe(proj).fmt].w;}
function UH(){return FMT[lienzoDe(proj).fmt].h;}
function dim(){return {w:UW(),h:UH(),asp:UW()/UH(),lienzo:lienzoDe(proj)};}
/* Proyecto nuevo y vacío: una escena sin nada, con fondo liso blanco. */
function newProj(o){
  o=o||{};const tipo=o.tipo==="serie"?"serie":"animacion";
  const sc=newScene(tipo==="serie"?"Capítulo 1":"Escena 1",{id:"blanco",color:"#ffffff"});
  return {v:3,nombre:o.nombre||(tipo==="serie"?"Mi serie":"Mi animación"),tipo,lienzo:lienzoDe({lienzo:o.lienzo}),mundo:0,mundos:[sc],actores:[],imgs:{}};
}
function curScene(){return proj.mundos[proj.mundo];}
function palabraEsc(){return proj&&proj.tipo==="serie"?"Capítulo":"Escena";}
function curItem(){return sel?curScene().items.find(i=>i.uid===sel):null;}
/* ▣ selección múltiple: msel guarda los elementos extra; sel sigue siendo el principal */
const msel=new Set();let clip=[],pegados=0;
function grupo(){if(!sel||msel.size<2||!msel.has(sel))return [];return curScene().items.filter(i=>msel.has(i.uid)&&!i.oculto);}
function quedan(){const g=grupo();return g.length?g:(curItem()?[curItem()]:[]);}
function camZ(){return camAt(curScene(),0).z||1;}
/* 🛤 trayectorias: grabar el ratón, dibujar un camino y editar los puntos en el cuadro */
let rec=null;
const w2s=(x,y,cam,pf)=>({x:(x-cam.x*pf-UW()/2)*cam.z+UW()/2,y:(y-360)*cam.z+360});
const s2w=(px,py,cam,pf)=>({x:Math.round((px-UW()/2)/cam.z+UW()/2+cam.x*pf),y:Math.round((py-360)/cam.z+360)});
function puntosKf(it){return (it.kf||[]).filter(f=>f.x!=null&&f.y!=null);}
function rdp(P,eps){if(P.length<3)return P;let mx=0,ix=0;const a=P[0],b=P[P.length-1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;
  for(let i=1;i<P.length-1;i++){const d=Math.abs((P[i].x-a.x)*dy-(P[i].y-a.y)*dx)/L;if(d>mx){mx=d;ix=i;}}
  if(mx<=eps)return [a,b];return rdp(P.slice(0,ix+1),eps).slice(0,-1).concat(rdp(P.slice(ix),eps));}
function grabarTrayecto(modo){const it=curItem();if(!it){say("Primero elige un personaje o elemento.");return;}rec={it,modo,t0:edT};say(modo==="dibujar"?"Dibuja el camino con el ratón sobre el cuadro y suelta.":"Arrastra el elemento: lo que hagas se graba tal cual.");$("cv").style.cursor="crosshair";}
function finTrayecto(pts){
  const it=rec.it,t0=rec.t0,modo=rec.modo;rec=null;$("cv").style.cursor="";
  if(pts.length<2){say("El movimiento fue muy corto. Prueba de nuevo.");return;}
  let P=rdp(pts,5);if(P.length>60)P=rdp(pts,12);
  let dur;if(modo==="dibujar"){let len=0;const cum=[0];for(let i=1;i<P.length;i++){len+=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);cum.push(len);}dur=Math.max(1,len/260);P.forEach((q,i)=>q.t=len?dur*cum[i]/len:0);}
  else{dur=Math.min(30,P[P.length-1].t);}
  it.kf=(it.kf||[]).filter(f=>!((f.x!=null||f.y!=null)&&f.t>=t0-.001&&f.t<=t0+dur+.001));
  for(const q of P)setKf(it,t0+Math.min(dur,q.t),{x:Math.round(q.x),y:Math.round(q.y),e:"lineal"});
  changed();renderProps();draw();say(`Camino guardado (${P.length} puntos, ${dur.toFixed(1)} s). Dale ▶ o mueve los puntos naranjas para ajustarlo.`);
}
function suavizarTrayecto(){const it=curItem();if(!it)return;const pk=puntosKf(it);if(pk.length<4){say("Ya es un camino simple.");return;}
  const P=rdp(pk.map(f=>({x:f.x,y:f.y,t:f.t,f})),14);const keep=new Set(P.map(q=>q.f));
  it.kf=it.kf.filter(f=>!(f.x!=null&&f.y!=null)||keep.has(f));changed();renderProps();draw();say("Camino suavizado.");}
function borrarTrayecto(){const it=curItem();if(!it)return;it.kf=(it.kf||[]).filter(f=>{if(f.x!=null||f.y!=null){delete f.x;delete f.y;}return Object.keys(f).some(k=>k!=="t"&&k!=="e");});if(!it.kf.length)delete it.kf;changed();renderProps();draw();say("Camino borrado.");}
function copiar(){const g=quedan();if(!g.length)return false;clip=g.map(i=>JSON.parse(JSON.stringify(i,strip)));pegados=0;say(g.length>1?g.length+" elementos copiados.":"Copiado.");return true;}
function pegar(){if(!clip.length)return false;pegados++;const sc=curScene(),nuevos=[];
  for(const o of clip){const c=JSON.parse(JSON.stringify(o));c.uid=uid();c.x+=36*pegados;c.y+=14*pegados;sc.items.push(c);nuevos.push(c);}
  msel.clear();if(nuevos.length>1)nuevos.forEach(c=>msel.add(c.uid));sel=nuevos[nuevos.length-1].uid;changed();renderProps();draw();return true;}
function duplicarSel(){if(!copiar())return;pegar();}
function selTodo(){const its=curScene().items.filter(i=>!i.oculto&&!i.bloq);if(!its.length)return;msel.clear();its.forEach(i=>msel.add(i.uid));sel=its[its.length-1].uid;renderProps();draw();}
function borrarSel(){const g=quedan();if(!g.length)return;const sc=curScene();sc.items=sc.items.filter(i=>!g.includes(i));sel=null;msel.clear();changed();renderProps();draw();}
function mover(dx,dy){for(const it of quedan()){it.x+=dx;it.y+=dy;}draw();changed();}
function alinear(modo){const g=quedan().filter(i=>i._bb);if(g.length<2)return;const z=camZ();
  const L=Math.min(...g.map(i=>i._bb.x)),R=Math.max(...g.map(i=>i._bb.x+i._bb.w)),T=Math.min(...g.map(i=>i._bb.y)),B=Math.max(...g.map(i=>i._bb.y+i._bb.h));
  for(const i of g){const b=i._bb;let dx=0,dy=0;
    if(modo==="izq")dx=L-b.x;else if(modo==="der")dx=R-(b.x+b.w);else if(modo==="cx")dx=(L+R)/2-(b.x+b.w/2);
    else if(modo==="arr")dy=T-b.y;else if(modo==="aba")dy=B-(b.y+b.h);else if(modo==="cy")dy=(T+B)/2-(b.y+b.h/2);
    i.x=Math.round(i.x+dx/z);i.y=Math.round(i.y+dy/z);}
  changed();draw();}
function distribuir(eje){const g=quedan().filter(i=>i._bb);if(g.length<3){say("Para distribuir elige al menos 3 elementos.");return;}const z=camZ(),h=eje==="h";
  const pos=i=>h?i._bb.x+i._bb.w/2:i._bb.y+i._bb.h/2;g.sort((a,b)=>pos(a)-pos(b));
  const a=pos(g[0]),b=pos(g[g.length-1]);
  g.forEach((i,k)=>{const d=a+(b-a)*k/(g.length-1)-pos(i);if(h)i.x=Math.round(i.x+d/z);else i.y=Math.round(i.y+d/z);});
  changed();draw();}
function alternar(it,que){it[que]=!it[que];if(it[que]&&sel===it.uid&&que==="bloq"){}if(it.oculto&&sel===it.uid){sel=null;msel.clear();}changed();renderProps();draw();}
function strip(k,v){return(k[0]==="_"||k==="dubLv"||k==="dubVis"||k==="dubExpr")?undefined:v;}
function snapshot(){return JSON.stringify(Object.assign({},proj,{imgs:undefined,actores:undefined}),strip);}
function changed(quiet){
  const s=snapshot();if(s!==lastSnap){undo.push(lastSnap);if(undo.length>60)undo.shift();redo=[];lastSnap=s;}
  $("bUndo").disabled=!undo.length;$("bRedo").disabled=!redo.length;
  clearTimeout(saveTmr);saveTmr=setTimeout(saveAuto,900);window.dispatchEvent(new Event("atr-cambio"));clearTimeout(thumbTmr);thumbTmr=setTimeout(thumbs,400);
  if(!quiet){draw();}
  window.dispatchEvent(new Event("serie-tl"));
}
function restoreSnap(s){const o=JSON.parse(s);proj.mundos=o.mundos;proj.mundo=Math.min(o.mundo,o.mundos.length-1);proj.nombre=o.nombre;proj.finFade=o.finFade;proj.musica=o.musica;proj.sub=o.sub;sel=null;fullRender();}
function doUndo(){if(!undo.length)return;const cur=snapshot();redo.push(cur);const s=undo.pop();lastSnap=s;restoreSnap(s);$("bUndo").disabled=!undo.length;$("bRedo").disabled=!redo.length;}
function doRedo(){if(!redo.length)return;undo.push(snapshot());const s=redo.pop();lastSnap=s;restoreSnap(s);$("bUndo").disabled=!undo.length;$("bRedo").disabled=!redo.length;}

/* ---------------- personajes (definiciones) ---------------- */
const DEFC={};
function ensure(d){if(!d._ok&&!d._pend){d._pend=1;Rig.prep(d).then(()=>{d._pend=0;draw();thumbs();});}return d;}
function defOf(it){
  if(it.ref==="dino_nino")return ensure(window.ACTOR_DINO);
  if(it.ref&&it.ref.startsWith("hum:")){
    const pre=A.HUM_PRE[it.ref.slice(4)]||A.HUM_PRE.nino,pal=Object.assign({},pre,it.pal||{}),key=it.ref+JSON.stringify(pal);
    if(it._dk!==key){if(it._def)Rig.liberar(it._def);it._def=A.humano(pal);it._dk=key;}
    return ensure(it._def);
  }
  const c=(proj.actores||[]).find(a=>a.id===it.ref);
  if(c){DEFC[c.id]=c;return ensure(c);}
  return null;
}
function loadImgs(){
  for(const id in proj.imgs){if(IMG[id])continue;const o=proj.imgs[id],im=new Image();IMG[id]={img:im,ok:false,fr:null};im.onload=()=>{IMG[id].ok=true;draw();};im.src=o.url;if(o.frames){IMG[id].fr=o.frames.map(u=>{const f=new Image();f.onload=()=>draw();f.src=u;return f;});}}
}

/* ---------------- dibujo de un cuadro ---------------- */
const sm01=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);};
const EASE={lineal:u=>u,suave:u=>u*u*(3-2*u),entrada:u=>u*u*u,salida:u=>1-Math.pow(1-u,3),
  rebote:u=>{const n=7.5625,d=2.75;if(u<1/d)return n*u*u;if(u<2/d)return n*(u-=1.5/d)*u+.75;if(u<2.5/d)return n*(u-=2.25/d)*u+.9375;return n*(u-=2.625/d)*u+.984375;},
  elastico:u=>u<=0?0:u>=1?1:Math.pow(2,-10*u)*Math.sin((u*10-.75)*(2*Math.PI/3))+1,
  retroceso:u=>{const c=1.70158;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2);},paso:u=>u<1?0:1};
function bez(x1,y1,x2,y2){return u=>{if(u<=0)return 0;if(u>=1)return 1;let lo=0,hi=1,q=u;for(let i=0;i<24;i++){const m=1-q,x=3*m*m*q*x1+3*m*q*q*x2+q*q*q;if(x<u)lo=q;else hi=q;q=(lo+hi)/2;}const m=1-q;return 3*m*m*q*y1+3*m*q*q*y2+q*q*q;};}
function easeFn(e){if(Array.isArray(e)&&e.length===4)return bez(e[0],e[1],e[2],e[3]);return EASE[e||"suave"]||EASE.suave;}
function kfVal(it,prop,t,base){
  const k=(it.kf||[]).filter(f=>f[prop]!=null).sort((a,b)=>a.t-b.t);if(!k.length)return base;
  const pts=k[0].t<=.001?[]:[{t:0,v:base}];for(const f of k)pts.push({t:f.t,v:f[prop],e:f.e});
  if(t<=pts[0].t)return pts[0].v;const L=pts[pts.length-1];if(t>=L.t)return L.v;
  for(let i=1;i<pts.length;i++){if(t<=pts[i].t){const a=pts[i-1],b=pts[i],u=easeFn(b.e)((t-a.t)/Math.max(.001,b.t-a.t));return lerp(a.v,b.v,u);}}return L.v;
}
function physSim(it,t){
  const f=it.fis,t0=f.t0||0;if(t<=t0)return {x:it.x,y:it.y,r:0};
  const g=f.g||2200,e=f.e==null?.5:f.e,suelo=f.suelo||650,rueda=f.k==="rueda",rad=f.rad||40,dt=1/120;let x=it.x,y=it.y,vx=f.vx||0,vy=rueda?0:(f.vy||0),rest=false;
  for(let tau=t0;tau<t;tau+=dt){
    if(!rueda){vy+=g*dt;y+=vy*dt;if(y>=suelo){y=suelo;if(Math.abs(vy)<90){vy=0;rest=true;}else vy=-vy*e;}}else y=suelo;
    x+=vx*dt;if(rest||rueda)vx*=Math.max(0,1-(rueda?.55:2.2)*dt);}
  return {x,y,r:rueda?(x-it.x)/rad:0};
}
function posAt(it,t){
  let x=it.x,y=it.y;const go=it.go;
  if(go){const a=go.t0||0,b=Math.max(a+.1,go.t1||a+3),u=clamp((t-a)/(b-a),0,1),e=u*.85+ease(u)*.15;x=lerp(it.x,go.x1,e);y=lerp(it.y,go.y1,e);}
  let rr=it.r||0;if(it.fis){const q=physSim(it,t);x=q.x;y=q.y;rr+=q.r;}
  return {x:kfVal(it,"x",t,x),y:kfVal(it,"y",t,y),s:kfVal(it,"s",t,it.s||1),r:kfVal(it,"r",t,rr),op:kfVal(it,"op",t,it.op==null?1:it.op)};
}
function itemPos(it,t){
  const p=posAt(it,t),a=posAt(it,t-.05),b=posAt(it,t+.05),vx=(b.x-a.x)/.1,vy=(b.y-a.y)/.1,sp=Math.hypot(vx,vy);
  const l1=posAt(it,t-.15),l2=posAt(it,t-.05),vl=(l2.x-l1.x)/.1;
  let dir=1;if(it.go)dir=it.go.x1<it.x?-1:1;else if(it.kf&&it.kf.some(f=>f.x!=null)){const ks=it.kf.filter(f=>f.x!=null).sort((a,b)=>a.t-b.t);dir=ks[ks.length-1].x<it.x?-1:1;}
  return {x:p.x,y:p.y,s:p.s,r:p.r,op:p.op,moving:sp>22,walk:sm01(20,70,sp),speed:sp,vx,vl,dir};
}
const PLANOS=[["Plano general",1],["Plano medio",1.35],["Primer plano",1.8],["Plano detalle",2.4]];
function corteAt(sc,t){const cs=sc.cortes;if(!cs||!cs.length)return null;let k=-1;for(let i=0;i<cs.length;i++)if(cs[i].t<=t+1e-6)k=i;return k<0?null:{c:cs[k],n:cs[k+1]?cs[k+1].t:sc.dur||6,i:k};}
function camAt(sc,t){
  const u=ease(clamp(t/(sc.dur||6),0,1)),c=sc.cam||{},ct=corteAt(sc,t);let x,y=0,z,sg=c.sigue;
  if(ct){const k=ct.c,uu=clamp((t-k.t)/Math.max(.1,ct.n-k.t),0,1);z=lerp(k.z||1,k.z1==null?(k.z||1):k.z1,uu);x=k.x||0;sg=k.sigue===undefined?c.sigue:k.sigue;}
  else{x=lerp(c.x0||0,c.x1||0,u);z=lerp(c.z0||1,c.z1||1,u);}
  if(sg){const it=sc.items.find(i=>i.uid===sg);if(it){const p=posAt(it,Math.max(0,t-.3));x+=clamp((p.x-UW()/2)*.9,-460,460);y=clamp((p.y-520)*.25,-60,60);}}
  return {z,x,y};
}
const pfOf=d=>clamp(.2+.8*((d==null?60:d)/60),.2,1.35);
const GAITS={normal:{n:"Caminar normal",g:{}},
  trote:{n:"Trote alegre",g:{hz:1.4,aw:1.25,bob:1.4,lean:.04,lift:1.3,stride:1.1}},
  sigilo:{n:"Sigilo (de puntillas)",g:{hz:.6,aw:.7,bob:.5,lean:.12,lift:1.45,stride:.8,duty:.75}},
  saltitos:{n:"Saltitos",g:{hz:1.1,aw:.9,bob:2.8,lift:1.6,lean:-.03}},
  cansado:{n:"Cansado",g:{hz:.7,aw:.6,bob:.6,lean:.1,lift:.7,stride:.8,duty:.7}},
  marcha:{n:"Marcha firme",g:{hz:1.2,aw:1.4,bob:1.1,lift:1.2,stride:1}}};
function gaitOf(it){if(it._gaitEdit)return it._gaitEdit;const c=it.ciclo;if(!c)return {};if(proj&&proj.ciclos&&proj.ciclos[c])return proj.ciclos[c].g||{};return (GAITS[c]||GAITS.normal).g;}
function poseOf(id){return (proj&&proj.poses&&proj.poses[id])||(window.Poses&&Poses.PRE[id])||null;}
function actsAt(it,t,sc){const o=[];for(const a of it.acc||[]){const pose=a.k&&a.k.startsWith("pose:")?poseOf(a.k.slice(5)):null;if(a.k&&a.k.startsWith("pose:")&&!pose)continue;
  const d=a.dur||(pose?1.4:(Rig.ACC[a.k]||{d:2}).d),u=(t-a.t0)/d;if(u>=0&&u<=1){let tgt=null;if(a.tgt&&sc){const o2=sc.items.find(i=>i.uid===a.tgt);if(o2){const q=posAt(o2,t);tgt={x:q.x,y:q.y-120*(o2.s||1)};}}
  o.push({k:pose?"pose":a.k,pose,u,tt:t-a.t0,tgt,w:a.w,fe:a.ent!=null?a.ent/d:undefined,fs:a.sal!=null?a.sal/d:undefined});}}
  if(it._poseEdit)o.push({k:"pose",pose:it._poseEdit,u:.5,tt:0,full:1});return o;}
function setKf(it,t,v){t=Math.round(t*20)/20;it.kf=it.kf||[];let f=it.kf.find(k=>Math.abs(k.t-t)<.04);if(!f){f={t};it.kf.push(f);}Object.assign(f,v);it.kf.sort((a,b)=>a.t-b.t);}
/* 🏔 Relieve: la imagen se corta en capas según su mapa de profundidad y cada capa se mueve distinto (paralaje) */
const NCAP=6;
function capasDe(id){
  const o=IMG[id],pr=proj.imgs[id];if(!o||!o.ok||!pr||!pr.depth)return null;
  if(o.capas&&o.capas.src===pr.depth)return o.capas.l;
  if(!o.dep||o.dep.src!==pr.depth){const d=new Image();d.onload=()=>{o.capas=null;draw();};d.src=pr.depth;o.dep=d;return null;}
  if(!o.dep.complete||!o.dep.naturalWidth)return null;
  const im=o.img,k=Math.min(1,1024/Math.max(im.naturalWidth,im.naturalHeight)),W=Math.max(2,Math.round(im.naturalWidth*k)),H=Math.max(2,Math.round(im.naturalHeight*k));
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d",{willReadFrequently:true});
  g.drawImage(im,0,0,W,H);const px=g.getImageData(0,0,W,H).data;
  g.clearRect(0,0,W,H);g.drawImage(o.dep,0,0,W,H);const dp=g.getImageData(0,0,W,H).data,L=[],soft=.6/NCAP;
  for(let n=0;n<NCAP;n++){
    const out=new ImageData(W,H),od=out.data,th=n/NCAP;
    for(let i=0,p=0;i<W*H;i++,p+=4){const m=n===0?1:Math.min(1,Math.max(0,(dp[p]/255-(th-soft/2))/soft));od[p]=px[p];od[p+1]=px[p+1];od[p+2]=px[p+2];od[p+3]=px[p+3]*m;}
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;cv.getContext("2d").putImageData(out,0,0);L.push(cv);
  }
  o.capas={src:pr.depth,l:L};return L;
}
/* cuánto se separan las capas: vaivén suave y/o siguiendo a la cámara */
function relOff(rel,t,cam,w){
  const a=(rel.fuerza==null?50:rel.fuerza)/100*.05*w,an=rel.anim||"vaiven";let x=0,y=0;
  if(an==="vaiven"||an==="ambos"){x+=Math.sin(TAU*t/6)*a;y+=Math.cos(TAU*t/6)*a*.35;}
  if(an==="camara"||an==="ambos")x+=-(cam.x||0)/UW()*a*5;
  return{x,y};
}
function drawRelieve(g,L,x,y,w,h,rel,t,cam){
  const f=relOff(rel,t,cam,w),sc=1+2.2*(Math.abs(f.x)/w+Math.abs(f.y)/h);
  g.save();g.translate(x+w/2,y+h/2);g.scale(sc,sc);g.translate(-w/2,-h/2);
  for(let n=0;n<L.length;n++){const q=(n/(L.length-1)-.5)*2;g.drawImage(L[n],f.x*q,f.y*q,w,h);}
  g.restore();
}
function drawBg(g,sc,cam,sx,t){
  const W=g.canvas.width,H=g.canvas.height;
  if(sc.fondo&&sc.fondo.img){const o=IMG[sc.fondo.img];g.fillStyle="#222";g.fillRect(0,0,W,H);
    if(o&&o.ok){const im=o.img,cx=UW()/2,k=Math.max(UW()/im.width,UH()/im.height)*1.2,w=im.width*k,h=im.height*k;g.save();g.translate(cx*sx,360*sx);g.scale(cam.z,cam.z);g.translate(-cx*sx,-360*sx);
      const L=sc.fondo.rel?capasDe(sc.fondo.img):null;
      if(L)drawRelieve(g,L,(cx-w/2-cam.x*.3)*sx,(360-h/2)*sx,w*sx,h*sx,sc.fondo.rel,t||0,cam);else g.drawImage(im,(cx-w/2-cam.x*.3)*sx,(360-h/2)*sx,w*sx,h*sx);g.restore();}
    return;}
  if(sc.fondo&&sc.fondo.id==="blanco"){g.fillStyle=sc.fondo.color||"#ffffff";g.fillRect(0,0,W,H);return;}
  const bg=BGS[sc.fondo&&sc.fondo.id]||A.BG[0];A.dibujarFondo(g,bg,sx,sx,cam.z,sx,cam,undefined,UW());
}
function drawItem(g,sc,it,t,cam,sx,opt){g.save();try{drawItemIn(g,sc,it,t,cam,sx,opt);}finally{g.restore();}}
const SIL={},mkc=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
/* ✨ entrada y salida de cualquier elemento (personaje, decoración, imagen): aparece y se va con animación */
const eo=u=>1-Math.pow(1-u,3),eb=u=>{const c=1.70158;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2);};
function entSal(it,t,P){
  if(!it.ent&&!it.sal)return P;const Q=Object.assign({},P);let a=1;
  if(it.ent){const t0=it.ent_t||0,d=Math.max(.15,it.ent_d||.8);
    if(t<t0)a=0;else if(t<t0+d){const u=(t-t0)/d,e=eo(u);
      switch(it.ent){case"aparecer":a=e;break;case"subir":a=e;Q.y+=(1-e)*160;break;case"caer":a=Math.min(1,u*3);Q.y-=(1-eb(u))*420;break;
        case"zoom":a=e;Q.s=(Q.s||1)*(.15+.85*e);break;case"rebote":a=Math.min(1,u*4);Q.s=(Q.s||1)*Math.max(0,eb(u));break;
        case"izq":a=e;Q.x-=(1-e)*520;break;case"der":a=e;Q.x+=(1-e)*520;break;}}}
  if(it.sal&&it.sal_t>0){const t0=it.sal_t,d=Math.max(.15,it.sal_d||.8);
    if(t>=t0+d)a=0;else if(t>=t0){const u=(t-t0)/d,e=u*u;
      switch(it.sal){case"aparecer":a*=1-u;break;case"bajar":a*=1-u;Q.y+=e*160;break;case"zoom":a*=1-u;Q.s=(Q.s||1)*(1-.85*e);break;
        case"izq":a*=1-e;Q.x-=e*520;break;case"der":a*=1-e;Q.x+=e*520;break;case"subir":a*=1-u;Q.y-=e*220;break;}}}
  Q.op=(Q.op==null?1:Q.op)*a;return Q;
}
function drawItemIn(g,sc,it,t,cam,sx,opt){
  const P=entSal(it,t,itemPos(it,t)),pf=pfOf(it.d),z=cam.z;
  const cx0=UW()/2,X=((P.x-cam.x*pf-cx0)*z+cx0)*sx,Y=((P.y-cam.y*pf*.5-360)*z+360)*sx,k=(P.s||1)*z*sx;
  let bb=null;
  if(P.op<1)g.globalAlpha=Math.max(0,P.op);
  {const dof=(sc.look&&sc.look.dof)||0,dd=it.d==null?60:it.d;if(dof>0&&it.kind!=="actor"&&dd<48){g.filter="blur("+(((48-dd)/48)*3.2*dof*sx*z).toFixed(2)+"px)";}}
  if(it.kind==="actor"){
    const def=defOf(it);if(!def)return;
    const gk=def.esc*k;
    const fl=(it.flip?-1:1)*P.dir;
    let wk=P.walk;if(it.go){const a=it.go.t0||0,b=Math.max(a+.1,it.go.t1||a+3);wk*=clamp(Math.min(t-a,b-t)/.4,0,1);}
    const acts=actsAt(it,t,sc);let aim=null;
    for(const a of acts)if(a.k==="señalar"&&a.tgt){const dx=(a.tgt.x-P.x)*pf*0+(a.tgt.x-P.x),dy=(a.tgt.y-(P.y-(def.h*(def.esc||1)*(it.s||1)*.55)));const L=Math.hypot(dx,dy)||1;aim=[dx/L*fl,dy/L];}
    const vista=def.vistas&&wk>.12?"perfil":"";
    const f=def.feet,wd=def.w*gk,ht=def.h*gk;
    {const lx=sc.hora==="tarde"?.55:sc.hora==="noche"?.12:.12,sw=wd*(.34+Math.abs(lx)*.5),sh=Math.max(6*sx,wd*.05),al=(sc.sombra==="suave"?1:.55)*(sc.hora==="noche"?.16:.3),cx=X+lx*wd*.35*(it.flip?-1:1)*0+lx*wd*.3,gr=g.createRadialGradient(cx,Y+3*sx,0,cx,Y+3*sx,sw);
      gr.addColorStop(0,"rgba(15,35,20,"+al+")");gr.addColorStop(.6,"rgba(15,35,20,"+(al*.7).toFixed(3)+")");gr.addColorStop(1,"rgba(15,35,20,0)");
      g.save();g.translate(cx,Y+3*sx);g.scale(1,sh/sw);g.translate(-cx,-(Y+3*sx));g.fillStyle=gr;g.beginPath();g.arc(cx,Y+3*sx,sw,0,TAU);g.fill();g.restore();}
    const RO={ax:X,ay:Y,s:gk,flip:fl,t:t+hash(it.uid)%7,walk:wk,speak:it.dubLv||0,vis:it.dubVis||0,hz:(it.paso||1)*(gaitOf(it).hz||1),gait:gaitOf(it),run:(it.paso||1)*(gaitOf(it).hz||1)>1.45,stride:(P.speed/(def.esc*(P.s||1)))/((it.paso||1)*(gaitOf(it).hz||1)*((it.paso||1)*(gaitOf(it).hz||1)>1.45?1.8:1)),velFn:tau=>((posAt(it,tau+.03).x-posAt(it,tau-.03).x)/.06)/(def.esc*(P.s||1))*fl*(def.face||1),acts,aim,sec:it.sec,fq:window.FisQ||1,expr:it.expr||it.dubExpr||"",vista,fwd:P.vl/200*fl,rot:P.r,seed:hash(it.uid)%5,alpha:g.globalAlpha};
    if(sc.sombra!=="suave"){
      const Wc=g.canvas.width,Hc=g.canvas.height,M=g.getTransform();SIL.a=SIL.a&&SIL.a.width===Wc&&SIL.a.height===Hc?SIL.a:mkc(Wc,Hc);SIL.b=SIL.b&&SIL.b.width===Wc&&SIL.b.height===Hc?SIL.b:mkc(Wc,Hc);
      const og=SIL.a.getContext("2d");og.setTransform(1,0,0,1,0,0);og.clearRect(0,0,Wc,Hc);og.setTransform(M);og.globalAlpha=g.globalAlpha;
      Rig.draw(og,def,RO);og.setTransform(1,0,0,1,0,0);og.globalAlpha=1;
      const tg=SIL.b.getContext("2d");tg.setTransform(1,0,0,1,0,0);tg.globalCompositeOperation="source-over";tg.clearRect(0,0,Wc,Hc);tg.drawImage(SIL.a,0,0);
      tg.globalCompositeOperation="source-in";tg.fillStyle=sc.hora==="noche"?"#0a1020":"#0c1c12";tg.fillRect(0,0,Wc,Hc);
      const q0=M.transformPoint(new DOMPoint(X,Y)),q1=M.transformPoint(new DOMPoint(X,Y-ht)),gr2=tg.createLinearGradient(q0.x,q0.y,q1.x,q1.y);gr2.addColorStop(0,"rgba(0,0,0,1)");gr2.addColorStop(1,"rgba(0,0,0,.2)");
      tg.globalCompositeOperation="destination-in";tg.fillStyle=gr2;tg.fillRect(0,0,Wc,Hc);tg.globalCompositeOperation="source-over";
      const lk=sc.hora==="tarde"?[1.0,.5,.4]:sc.hora==="noche"?[.3,.3,.2]:[.35,.22,.34];/* [inclina, aplasta, opacidad] */
      const Sm=new DOMMatrix([1,0,-lk[0],lk[1],0,0]),T2=M.multiply(new DOMMatrix().translate(X,Y+2*sx)).multiply(Sm).multiply(new DOMMatrix().translate(-X,-(Y+2*sx))).multiply(M.inverse());
      g.save();g.setTransform(T2);g.globalAlpha=g.globalAlpha*lk[2];g.filter="blur("+(2.2*sx).toFixed(1)+"px)";g.drawImage(SIL.b,0,0);g.restore();
      g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(SIL.a,0,0);g.restore();
    }else Rig.draw(g,def,RO);
    const x0=fl>0?X-f[0]*gk:X-(def.w-f[0])*gk;bb={x:x0,y:Y-f[1]*gk,w:wd,h:ht};
  }else if(it.kind==="deco"){
    const sp=SPD[it.ref];if(!sp)return;const mv=it.mov||"";let dx=0,dy=0,rot=0,sc2=1;const ph=hash(it.uid)%100/10;
    if(mv==="mecer")rot=.03*Math.sin(TAU*.4*t+ph);else if(mv==="flotar"){dx=16*Math.sin(TAU*.07*t+ph);dy=-7*Math.sin(TAU*.25*t+ph);}
    else if(mv==="girar")rot=t*.35;else if(mv==="pulso")sc2=1+.07*Math.sin(TAU*1.1*t+ph);else if(mv==="volar"){dx=70*Math.sin(.45*t+ph);dy=14*Math.sin(1.1*t+ph);}
    else if(mv==="aletear"){dx=46*Math.sin(.8*t+ph);dy=22*Math.sin(1.3*t+ph);}
    g.translate(X+dx*sx*z,Y+dy*sx*z);if(rot+P.r)g.rotate(rot+P.r);if(sc2!==1)g.scale(sc2,sc2);
    const hh=sp.h*k,ww=sp.h*sp.a*k;
    if(mv==="aletear"||mv==="parpadear"){g.save();g.scale(k,k);const by=sp.anc==="b"?0:sp.anc==="t"?sp.h:sp.h/2;sp.draw(g,0,by,sp.h,A.RND(3),{t});g.restore();}
    else{const rs=Math.round(clamp(k,.35,3)*4)/4,s=A.sprite(sp,rs);g.drawImage(s.cv,-s.ax*k,-s.ay*k,s.wU*k,s.hU*k);}
    bb={x:X+dx*sx*z-ww*.5,y:sp.anc==="b"?Y+dy*sx*z-hh:sp.anc==="t"?Y+dy*sx*z:Y+dy*sx*z-hh/2,w:ww,h:hh};
  }else if(it.kind==="img"){
    const o=IMG[it.ref];if(!o||!o.ok)return;const pr=proj.imgs[it.ref]||{};let im=o.img;if(o.fr&&o.fr.length){const f=o.fr[Math.floor(t*(pr.fps||8))%o.fr.length];if(f&&f.complete&&f.naturalWidth)im=f;}const hh=(it.h0||300)*k,ww=hh*im.width/im.height;
    const rot=it.mov==="mecer"?.03*Math.sin(TAU*.4*t):0;g.translate(X,Y);if(rot+P.r)g.rotate(rot+P.r);{const L=it.rel&&!(o.fr&&o.fr.length)?capasDe(it.ref):null;if(L)drawRelieve(g,L,-ww/2,-hh,ww,hh,it.rel,t,cam);else g.drawImage(im,-ww/2,-hh,ww,hh);}bb={x:X-ww/2,y:Y-hh,w:ww,h:hh};
  }
  if(bb)it._bb={x:bb.x/sx,y:bb.y/sx,w:bb.w/sx,h:bb.h/sx,X:X/sx,Y:Y/sx};
}
/* 🌄 el fondo también se puede animar: se desplaza, va y viene, respira o se acerca despacio */
function bgCamAt(sc,cam,t){
  const f=sc.fondo||{},m=f.mov;if(!m)return cam;const v=(f.vel==null?50:f.vel)/50,c=Object.assign({},cam),d=Math.max(1,sc.dur||6);
  const tri=x=>{const u=((x%2)+2)%2;return u<1?u*2-1:3-u*2;};          /* onda triangular: va y vuelve sin saltos */
  if(m==="deriva")c.x=cam.x+160*v*tri(t/18);
  else if(m==="vaiven")c.x=cam.x+110*v*Math.sin(TAU*t/12);
  else if(m==="respirar")c.z=cam.z*(1+.05*v*Math.sin(TAU*t/9));
  else if(m==="acercar")c.z=cam.z*(1+.14*v*Math.min(1,t/d));
  else if(m==="alejar")c.z=cam.z*(1+.14*v*(1-Math.min(1,t/d)));
  return c;
}
function frame(g,sc,t,opt){
  const W=g.canvas.width,sx=W/UW();g.clearRect(0,0,W,g.canvas.height);
  const cam=camAt(sc,t);
  drawBg(g,sc,bgCamAt(sc,cam,t),sx,t);
  const L=sc.items.map((it,i)=>[it,i]).sort((a,b)=>((a[0].d==null?60:a[0].d)-(b[0].d==null?60:b[0].d))||a[1]-b[1]);
  for(const [it] of L){if(it.oculto)continue;drawItem(g,sc,it,t,cam,sx,opt);}
  if(sc.hora==="tarde"||sc.hora==="noche"){g.save();g.globalCompositeOperation="multiply";const gr=g.createLinearGradient(0,0,0,g.canvas.height);
    if(sc.hora==="tarde"){gr.addColorStop(0,"#ffb98a");gr.addColorStop(1,"#ffe0b8");}else{gr.addColorStop(0,"#5a6aa8");gr.addColorStop(1,"#7a86bc");}
    g.fillStyle=gr;g.fillRect(0,0,W,g.canvas.height);g.restore();}
  if(window.Look)Look.apply(g,sc,t);
  if(opt&&opt.edit){
    const it=curItem();
    for(const o of grupo()){if(o===it||!o._bb)continue;const b=o._bb;g.save();g.strokeStyle="#ffd9a0";g.lineWidth=2*sx;g.setLineDash([4*sx,4*sx]);g.strokeRect(b.x*sx,b.y*sx,b.w*sx,b.h*sx);g.restore();}
    if(it&&it._bb){const b=it._bb;g.save();g.strokeStyle="#ffb347";g.lineWidth=2*sx;g.setLineDash([8*sx,6*sx]);g.strokeRect(b.x*sx,b.y*sx,b.w*sx,b.h*sx);g.setLineDash([]);
      g.fillStyle="#ffb347";g.fillRect((b.x+b.w)*sx-7*sx,(b.y+b.h)*sx-7*sx,14*sx,14*sx);
      {const pk=puntosKf(it);if(pk.length){const pf=pfOf(it.d),D=sc.dur||6;g.strokeStyle="#ffb347";g.lineWidth=2.5*sx;g.setLineDash([2*sx,6*sx]);g.beginPath();
        for(let tt=0;tt<=D+1e-6;tt+=Math.max(.05,D/120)){const q=posAt(it,tt),w=w2s(q.x,q.y,cam,pf);tt?g.lineTo(w.x*sx,w.y*sx):g.moveTo(w.x*sx,w.y*sx);}g.stroke();g.setLineDash([]);
        for(const f of pk){const w=w2s(f.x,f.y,cam,pf);g.fillStyle="#ffb347";g.strokeStyle="#1a1305";g.lineWidth=2*sx;g.beginPath();g.arc(w.x*sx,w.y*sx,8*sx,0,TAU);g.fill();g.stroke();}}}
      if(it.go){const pf=pfOf(it.d),z=cam.z,fx=((it.go.x1-cam.x*pf-UW()/2)*z+UW()/2)*sx,fy=((it.go.y1-360)*z+360)*sx;
        const p0=itemPos(it,0);g.strokeStyle="#7a5cff";g.lineWidth=3*sx;g.setLineDash([4*sx,6*sx]);g.beginPath();g.moveTo(b.X*sx,b.Y*sx);g.lineTo(fx,fy);g.stroke();g.setLineDash([]);
        g.fillStyle="#7a5cff";g.beginPath();g.arc(fx,fy,11*sx,0,TAU);g.fill();g.fillStyle="#fff";g.font="bold "+(13*sx)+"px sans-serif";g.textAlign="center";g.fillText("➜",fx,fy+5*sx);void p0;}
      g.restore();}
  }
}
function draw(){
  if(pv.on)return;const sc=curScene(),cv=$("cv");if(!cv||!sc)return;
  frame(cv.getContext("2d"),sc,edT,{edit:true});
}

/* ---------------- biblioteca ---------------- */
const RAIL=[["act","🎭","Personajes"],["fon","🏞","Fondos"],["dec","🌳","Decoración"],["img","🖼","Mis imágenes"],["tal","✂️","Taller"],["dib","✏️","Dibujo"]];
function tile(cv,name,onclick,drag){
  const d=document.createElement("div");d.className="tile";d.draggable=!!drag;
  if(cv){cv.style.cssText="width:100%;aspect-ratio:1;object-fit:contain;background:#dfeef8;border-radius:7px";d.appendChild(cv);}
  const n=document.createElement("div");n.className="nm";n.textContent=name;d.appendChild(n);
  d.onclick=onclick;if(drag)d.ondragstart=e=>{e.dataTransfer.setData("text/plain",drag);};return d;
}
function thumbOf(sp){const s=A.sprite(sp,.5),c=document.createElement("canvas");c.width=c.height=110;const g=c.getContext("2d");g.fillStyle="#dfeef8";g.fillRect(0,0,110,110);
  const k=Math.min(100/s.cv.width,100/s.cv.height);g.drawImage(s.cv,55-s.cv.width*k/2,55-s.cv.height*k/2,s.cv.width*k,s.cv.height*k);return c;}
async function thumbActor(def){
  await Rig.prep(def);const c=document.createElement("canvas");c.width=c.height=110;const g=c.getContext("2d");g.fillStyle="#dfeef8";g.fillRect(0,0,110,110);
  const ims=await Promise.all(def.piezas.map(p=>new Promise(ok=>{if(typeof p.img!=="string")return ok(p.img);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=p.img;})));
  const k=Math.min(100/def.w,100/def.h);g.save();g.translate(55-def.w*k/2,55-def.h*k/2);g.scale(k,k);def.piezas.forEach((p,i)=>{if(ims[i])g.drawImage(ims[i],p.x,p.y,p.w,p.h);});g.restore();return c;
}
function addAt(item){
  const sc=curScene();item.uid=uid();sc.items.push(item);sel=item.uid;changed();renderProps();say("Agregado. Arrástralo para moverlo; la esquina naranja cambia el tamaño.");
}
function addActor(ref,nombre,pal){
  const n=curScene().items.filter(i=>i.kind==="actor").length;
  addAt({kind:"actor",ref,ficha:{nombre:nombre||"Personaje"},x:Math.round(UW()*.23+(n*UW()*.19)%(UW()*.55)),y:650,s:1,d:60,flip:0,pal:pal||undefined,paso:1});
}
function addDeco(id,x,y){
  const sp=SPD[id];if(!sp)return;
  const yy=y!=null?y:(sp.cat==="cielo"?(id==="arcoiris"?430:150):sp.anc==="t"?0:610+Math.round(Math.random()*60));
  addAt({kind:"deco",ref:id,x:x!=null?x:Math.round(UW()*.15+Math.random()*UW()*.7),y:yy,s:1,d:DEPTH[id]!=null?DEPTH[id]:55,mov:sp.mov||""});
}
/* 🔎 buscador global: fondos, personajes, decoración y tus imágenes, todo en una sola búsqueda */
function recursos(t){t=(t||"").toLowerCase().trim();if(!t)return [];const r=[],ok=n=>String(n||"").toLowerCase().includes(t);
  for(const b of A.BG)if(ok(b.n))r.push({tipo:"Fondo",n:b.n,ir:()=>{curScene().fondo={id:b.id};changed();draw();say("Fondo: "+b.n);}});
  for(const [id,pre] of Object.entries(A.HUM_PRE))if(ok(pre.n))r.push({tipo:"Personaje",n:pre.n,ir:()=>addActor("hum:"+id,pre.n.split(" ")[0])});
  if(ok("dino con niño"))r.push({tipo:"Personaje",n:"Dino con niño",ir:()=>addActor("dino_nino","Dino y niño")});
  for(const sp of A.SP)if(ok(sp.n)||ok(sp.id))r.push({tipo:"Decoración",n:sp.n||sp.id,ir:()=>addDeco(sp.id)});
  for(const [id,o] of Object.entries(proj.imgs||{}))if(ok(o.n))r.push({tipo:o.tipo==="fondo"?"Mi fondo":"Mi imagen",n:o.n,ir:()=>{if(o.tipo==="fondo"){curScene().fondo={img:id};changed();draw();}else addImg(id);}});
  return r.slice(0,80);}
function addImg(id,x,y){addAt({kind:"img",ref:id,x:x||UW()/2,y:y||620,s:1,d:55,h0:300});}
function renderLib(){
  const rl=$("rail");rl.innerHTML="";
  for(const [k,e,n] of RAIL){const b=document.createElement("button");b.className="rb"+(rail===k?" on":"");b.innerHTML=`<big>${e}</big>${n}`;b.onclick=()=>{rail=k;renderLib();if(k==="tal"&&window.Taller)Taller.abrir();if(k==="dib"&&window.Dibujo)Dibujo.abrir();};rl.appendChild(b);}
  const body=$("libBody"),title=$("libTitle");body.innerHTML="";const q=($("q").value||"").toLowerCase();
  const grid=()=>{const d=document.createElement("div");d.id="grid";body.appendChild(d);return d;};
  const sec=t=>{const s=document.createElement("div");s.className="sec";s.textContent=t;body.appendChild(s);};
  const up=(txt,fn)=>{const t=document.createElement("div");t.className="tile add";t.innerHTML=`<big>＋</big>${txt}`;t.onclick=fn;return t;};
  if(rail==="act"){title.textContent="Personajes";
    sec("Tu ilustración");let g=grid();const t0=tile(null,"Dino con niño",()=>addActor("dino_nino","Dino y niño"),"act:dino_nino");g.appendChild(t0);
    thumbActor(window.ACTOR_DINO).then(c=>{c.style.cssText="width:100%;aspect-ratio:1;border-radius:7px";t0.insertBefore(c,t0.firstChild);});
    sec("Personajes con piezas (editables)");g=grid();
    for(const [id,p] of Object.entries(A.HUM_PRE)){const d=A.humano(p),t=tile(null,p.n,()=>addActor("hum:"+id,p.n.split(" ")[0]),"act:hum:"+id);g.appendChild(t);thumbActor(d).then(c=>{c.style.cssText="width:100%;aspect-ratio:1;border-radius:7px";t.insertBefore(c,t.firstChild);});}
    if((proj.actores||[]).length){sec("Mis personajes");g=grid();for(const a of proj.actores){const t=tile(null,a.n,()=>addActor(a.id,a.n),"act:"+a.id);g.appendChild(t);thumbActor(a).then(c=>{c.style.cssText="width:100%;aspect-ratio:1;border-radius:7px";t.insertBefore(c,t.firstChild);});}}
    g=grid();g.appendChild(up("Crear personaje desde mi dibujo",()=>{rail="tal";renderLib();window.Taller&&Taller.abrir();}));
  }else if(rail==="fon"){title.textContent="Fondos";
    sec("Liso");let g=grid();g.appendChild(tile(null,"Color liso",()=>{const f=curScene().fondo;curScene().fondo={id:"blanco",color:(f&&f.color)||"#ffffff"};changed();renderProps();say("Fondo liso. Cambia el color en «Escena».");}));
    sec("Fondos listos (con profundidad)");g=grid();
    for(const b of A.BG){if(q&&!b.n.toLowerCase().includes(q))continue;g.appendChild(tile(A.miniFondo(b,110,62),b.n,()=>{curScene().fondo={id:b.id};changed();say("Fondo: "+b.n);}));}
    const mis=Object.entries(proj.imgs).filter(([,o])=>o.tipo==="fondo");
    sec("Mis fondos");g=grid();for(const [id,o] of mis){const im=new Image();im.src=o.url;g.appendChild(tile(im,o.n,()=>{curScene().fondo={img:id};changed();}));}
    g.appendChild(up("Subir fondo (JPG o PNG)",()=>subirImg("fondo")));
  }else if(rail==="dec"){title.textContent="Decoración y elementos";
    const ch=document.createElement("div");ch.className="chips";ch.style.marginTop="6px";for(const [k,e,n] of A.CATS){const c=document.createElement("span");c.className="chip"+(decCat===k?" on":"");c.textContent=e+" "+n;c.onclick=()=>{decCat=k;renderLib();};ch.appendChild(c);}body.appendChild(ch);
    const g=grid();g.style.marginTop="10px";
    for(const sp of A.SP){if(q?!sp.n.toLowerCase().includes(q):sp.cat!==decCat)continue;g.appendChild(tile(thumbOf(sp),sp.n,()=>addDeco(sp.id),"dec:"+sp.id));}
    const mis=Object.entries(proj.imgs).filter(([,o])=>o.tipo==="elemento");if(mis.length&&!q){sec("Mis elementos");const g2=grid();for(const [id,o] of mis){const im=new Image();im.src=o.url;g2.appendChild(tile(im,o.n,()=>addImg(id),"img:"+id));}}
  }else if(rail==="img"){title.textContent="Mis imágenes";
    sec("Subir");let g=grid();g.appendChild(up("Fondo",()=>subirImg("fondo")));g.appendChild(up("Elemento con fondo transparente (PNG)",()=>subirImg("elemento")));g.appendChild(up("Dibujo SVG o PSD de Photoshop",()=>window.Importar&&Importar.abrir()));g.appendChild(up("📦 Paquete de imágenes (.zip)",()=>window.Paquetes&&Paquetes.abrir()));
    const all=Object.entries(proj.imgs);if(all.length){sec("Subidas");g=grid();for(const [id,o] of all){const im=new Image();im.src=o.url;g.appendChild(tile(im,o.n+" · "+o.tipo,()=>o.tipo==="fondo"?(curScene().fondo={img:id},changed()):addImg(id),"img:"+id));}}
    body.insertAdjacentHTML("beforeend",`<p style="opacity:.65;font-size:12px;margin-top:12px">Los elementos se pueden mover, agrandar, ponerlos cerca o lejos y hasta mecerlos con el viento. Para que un personaje mueva la boca y las patas, usa el <b>✂️ Taller</b>.</p>`);
  }else if(rail==="dib"){title.textContent="Dibujo cuadro a cuadro";body.innerHTML="";
    const b0=document.createElement("button");b0.className="pri";b0.textContent="✏️ Dibujar una animación";b0.onclick=()=>window.Dibujo&&Dibujo.abrir();body.appendChild(b0);
  }else if(rail==="tal"){title.textContent="Taller de piezas";
    body.innerHTML=`<p>Aquí conviertes <b>tu dibujo</b> en un personaje con partes que se mueven: cabeza, mandíbula, cola, patas, brazos…</p><p>Subes la imagen, <b>dibujas el contorno</b> de cada parte y dices dónde se dobla. Puedes probar cómo se mueve antes de guardarlo.</p>`;
    const b=document.createElement("button");b.className="pri";b.textContent="✂️ Abrir el Taller";b.onclick=()=>window.Taller&&Taller.abrir();body.appendChild(b);
  }
}
function subirImg(tipo){
  const f=$("fUp");f.accept="image/*";f.multiple=true;f.onchange=async()=>{
    for(const file of f.files){const url=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(file);});
      let url2=url;if(tipo!=="fondo"&&window.IA&&IA.ok()){try{const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url;});if(!IA.tieneAlfa(im)&&confirm("«"+file.name+"» tiene fondo. ¿Quitarlo con IA? (tarda unos segundos)")){say("Quitando el fondo…");url2=(await IA.quitarFondo(im,say)).toDataURL("image/png");}}catch(e){say("No pude quitar el fondo: "+e.message);}}
      const id="u"+Date.now().toString(36)+Math.random().toString(36).slice(2,4);proj.imgs[id]={n:file.name.replace(/\.[^.]+$/,"").slice(0,24),tipo,url:url2};}
    f.value="";loadImgs();renderLib();changed();say("Imagen guardada en tus imágenes.");};f.click();
}

/* ---------------- propiedades ---------------- */
function row(l,html){return `<div class="row"><span>${l}</span>${html}</div>`;}
function renderProps(){
  window.dispatchEvent(new Event("serie-tl"));
  const P=$("props");P.innerHTML="";const it=curItem();
  if(grupo().length>1)multiPanel(P);else if(it)itemPanel(P,it);else{scenePanel(P);capasCard(P);}
}
function bind(P,sel2,ev,fn){const e=P.querySelector(sel2);if(e)e[ev]=fn;return e;}
function itemPanel(P,it){
  const sp=it.kind==="deco"?SPD[it.ref]:null,def=it.kind==="actor"?defOf(it):null;
  const nm=it.kind==="actor"?(it.ficha&&it.ficha.nombre)||"Personaje":sp?sp.n:(proj.imgs[it.ref]||{}).n||"Imagen";
  let h=`<h3>${esc(nm)}</h3><div class="sub">Arrastra en el cuadro para moverlo.</div>`;
  if(it.kind==="actor")h+=`<div class="card"><h4>👤 Nombre (sale en el estudio de grabación)</h4><input id="pNom" type="text" value="${esc(nm)}" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:8px;padding:7px"></div>`;
  h+=`<div class="card"><h4>📐 Tamaño y lugar</h4>${row("Tamaño",`<input id="pS" type="range" min="10" max="400" value="${Math.round((it.s||1)*100)}">`)}
   ${row("Lejos ↔ Cerca",`<input id="pD" type="range" min="0" max="100" value="${it.d==null?60:it.d}">`)}
   <div class="sub" style="font-size:11px;opacity:.65;margin:0 0 4px">Lo que está más lejos se mueve menos cuando la cámara se desplaza y queda detrás.</div>
   ${row("Opacidad",`<input id="pO" type="range" min="10" max="100" value="${Math.round((it.op==null?1:it.op)*100)}">`)}
   <div class="btns"><button id="pF" class="${it.flip?"on":""}">↔ Voltear</button><button id="pFr">⬆ Al frente</button><button id="pAt">⬇ Atrás</button></div></div>`;
  if(it.kind==="actor"){
    h+=`<div class="card"><h4>🚶 Movimiento</h4>${it.go?`<div class="sub" style="font-size:11px">Arrastra la bolita morada en el cuadro para elegir adónde va.</div>
      ${row("Empieza (s)",`<input id="gT0" type="number" min="0" step=".5" value="${it.go.t0||0}" style="width:70px">`)}${row("Termina (s)",`<input id="gT1" type="number" min="1" step=".5" value="${it.go.t1}" style="width:70px">`)}
      ${row("Ritmo de pasos",`<input id="pPas" type="range" min="40" max="220" value="${Math.round((it.paso||1)*100)}">`)}
      <div class="btns"><button id="gOff" class="danger">Que se quede quieto</button></div>`:
      `<div class="btns"><button id="gOn" class="pri">🚶 Que camine hasta otro punto</button></div><div class="sub" style="font-size:11px;opacity:.65">Si no camina, respira y mueve la boca cuando habla.</div>`}</div>`;
    if(it.kind==="actor"){
      const AN={saludar:"👋 Saludar",señalar:"👉 Señalar",saltar:"⬆ Saltar",bailar:"💃 Bailar",asustarse:"😱 Asustarse",reír:"😂 Reír",pensar:"🤔 Pensar",esperar:"⏳ Esperar",comer:"🍎 Comer",girar_cabeza:"🙆 Girar la cabeza",hablar:"🗣 Hablar",rebotar:"🏀 Rebotar"};
      const otros=curScene().items.filter(o=>o.uid!==it.uid);
      h+=`<div class="card"><h4>🎭 Acciones y cara</h4>${row("Cara",`<select id="pEx">${[["","Normal"],["feliz","Feliz"],["triste","Triste"],["sorpresa","Sorprendido"],["enojo","Enojado"]].map(([v,l])=>`<option value="${v}" ${(it.expr||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}
       ${row("Cara automática",`<label><input type="checkbox" id="pExA" ${it.exprAuto!==false?"checked":""}> según lo que dice</label>`)}
       <div class="sub" style="font-size:11px;opacity:.7;margin:2px 0 4px">Pon la barra de tiempo donde quieras y toca una acción:</div>
       <div class="btns">${Object.keys(AN).map(k=>`<button data-ac="${k}">${AN[k]}</button>`).join("")}</div>
       ${row("Señalar a",`<select id="pTg"><option value="">(al frente)</option>${otros.map(o=>`<option value="${o.uid}">${esc((o.ficha&&o.ficha.nombre)||SPD[o.ref]&&SPD[o.ref].n||"Cosa")}</option>`).join("")}</select>`)}
       ${(it.acc||[]).map((a,i)=>{const dd=a.dur||(a.k.startsWith("pose:")?1.4:(Rig.ACC[a.k]||{d:2}).d),pn=a.k.startsWith("pose:")?(poseOf(a.k.slice(5))||{n:"pose"}).n:null;return `<div class="row"><span>${pn||AN[a.k]||a.k} · ${a.t0.toFixed(1)} s</span><button data-am="${i}">⚙ Mezcla</button><button data-ad="${i}" class="danger">✕</button></div>
         ${a._m?`<div class="mez"><label>Dura <input type="range" min=".4" max="8" step=".1" value="${dd}" data-mk="dur" data-mi="${i}"><b>${dd.toFixed(1)} s</b></label><label>Entra en <input type="range" min="0" max="${Math.min(3,dd/2).toFixed(1)}" step=".05" value="${a.ent!=null?a.ent:(.16*dd).toFixed(2)}" data-mk="ent" data-mi="${i}"><b>${(a.ent!=null?a.ent:.16*dd).toFixed(2)} s</b></label><label>Sale en <input type="range" min="0" max="${Math.min(3,dd/2).toFixed(1)}" step=".05" value="${a.sal!=null?a.sal:(.16*dd).toFixed(2)}" data-mk="sal" data-mi="${i}"><b>${(a.sal!=null?a.sal:.16*dd).toFixed(2)} s</b></label><label>Fuerza <input type="range" min="0" max="1.5" step=".05" value="${a.w==null?1:a.w}" data-mk="w" data-mi="${i}"><b>${Math.round((a.w==null?1:a.w)*100)}%</b></label></div>`:""}`;}).join("")}</div>
      <div class="card"><h4>🧍 Poses y ciclos</h4>
       <div class="sub" style="font-size:11px;opacity:.7;margin:2px 0 4px">Una pose se suma a lo que ya hace (caminar, hablar). Se pone en el tiempo donde esté la barra.</div>
       <div class="btns">${Object.entries(Object.assign({},window.Poses?Poses.PRE:{},proj.poses||{})).map(([id,p])=>`<button data-po="${id}">${p.n}</button>`).join("")}</div>
       <div class="btns"><button id="poNew" class="pri">✏ Crear pose nueva</button>${Object.keys(proj.poses||{}).length?`<button id="poDel">🗑 Borrar mis poses</button>`:""}</div>
       ${row("Cómo camina",`<select id="pCi">${Object.entries(GAITS).map(([k,v])=>`<option value="${k}" ${(it.ciclo||"normal")===k?"selected":""}>${v.n}</option>`).join("")}${Object.entries(proj.ciclos||{}).map(([k,v])=>`<option value="${k}" ${it.ciclo===k?"selected":""}>${v.n}</option>`).join("")}</select>`)}
       <div class="btns"><button id="ciEd">🚶 Ajustar / crear ciclo</button></div></div>
      <div class="card"><h4>🔑 Fotogramas clave</h4><div class="sub" style="font-size:11px;opacity:.7;margin-bottom:4px">Mueve la barra de tiempo, arrastra o cambia el tamaño y guarda: se mueve suave entre una pose y otra.</div>
       <div class="btns"><button id="kAdd" class="pri">🔑 Guardar aquí (${edT.toFixed(1)} s)</button><button id="kCrv">📈 Editor de curvas</button></div>
       ${(it.kf||[]).map((k,i)=>`<div class="row"><span>${k.t.toFixed(1)} s · x${Math.round(k.x==null?it.x:k.x)} y${Math.round(k.y==null?it.y:k.y)}${k.s!=null?" · "+Math.round(k.s*100)+"%":""}</span><button data-kd="${i}" class="danger">✕</button></div>`).join("")}</div>`;
    }
    if(it.ref&&it.ref.startsWith("hum:")){const pre=A.HUM_PRE[it.ref.slice(4)]||A.HUM_PRE.nino,pal=Object.assign({},pre,it.pal||{});
      h+=`<div class="card"><h4>🎨 Colores</h4>${[["piel","Piel"],["pelo","Pelo"],["camisa","Camisa"],["pantalon","Pantalón"],["zapato","Zapatos"]].map(([k,l])=>row(l,`<input type="color" data-k="${k}" value="${pal[k]}">`)).join("")}
      ${row("Peinado",`<select id="pPe">${[["corto","Corto"],["largo","Largo"],["coletas","Coletas"],["calvo","Sin pelo"]].map(([v,l])=>`<option value="${v}" ${pal.pelo_estilo===v?"selected":""}>${l}</option>`).join("")}</select>`)}
      ${row("Sombrero",`<input id="pGo" type="checkbox" ${pal.gorro?"checked":""}><input type="color" id="pGoC" value="${pal.gorro||"#d9b878"}">`)}</div>`;}
  }
  if(it.kind==="img"&&window.Relieve)h+=Relieve.card(it,it.ref);
  h+=`<div class="card"><h4>✨ Animar entrada y salida</h4><div class="sub" style="font-size:11px;opacity:.7;margin-bottom:4px">Hace que aparezca y se vaya con animación. Funciona con personajes, decoración e imágenes.</div>
   ${row("Entra",`<select id="eN">${[["","Ya está en escena"],["aparecer","Aparecer (fundido)"],["subir","Subir"],["caer","Caer con rebote"],["zoom","Crecer"],["rebote","Rebotar al aparecer"],["izq","Entrar por la izquierda"],["der","Entrar por la derecha"]].map(([v,l])=>`<option value="${v}" ${(it.ent||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}
   ${it.ent?row("Entra en (s)",`<input id="eNt" type="number" min="0" step=".5" value="${it.ent_t||0}" style="width:70px"> dura <input id="eNd" type="number" min=".2" step=".1" value="${it.ent_d||.8}" style="width:60px">`):""}
   ${row("Sale",`<select id="eS">${[["","No sale"],["aparecer","Desaparecer (fundido)"],["bajar","Bajar"],["subir","Subir"],["zoom","Achicarse"],["izq","Salir por la izquierda"],["der","Salir por la derecha"]].map(([v,l])=>`<option value="${v}" ${(it.sal||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}
   ${it.sal?row("Sale en (s)",`<input id="eSt" type="number" min="0" step=".5" value="${it.sal_t||Math.max(1,(curScene().dur||6)-1)}" style="width:70px"> dura <input id="eSd" type="number" min=".2" step=".1" value="${it.sal_d||.8}" style="width:60px">`):""}</div>`;
  if(it.kind==="deco"||it.kind==="img"){h+=`<div class="card"><h4>🌬 Movimiento</h4>${row("Se mueve",`<select id="pMv">${[["","Quieto"],["mecer","Mecerse con el viento"],["flotar","Flotar"],["girar","Girar"],["pulso","Latir"],["volar","Volar suave"],["aletear","Aletear y revolotear"],["parpadear","Parpadear (fuego)"]].map(([v,l])=>`<option value="${v}" ${(it.mov||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}</div>`;}
  {const f=it.fis||{};h+=`<div class="card"><h4>⚙ Física</h4>${row("Qué hace",`<select id="fiK"><option value="">Nada</option><option value="rebota" ${f.k==="rebota"?"selected":""}>Cae y rebota</option><option value="rueda" ${f.k==="rueda"?"selected":""}>Rueda por el suelo</option></select>`)}
   ${it.fis?`${row("Empieza (s)",`<input id="fiT" type="number" step=".5" min="0" value="${f.t0||0}" style="width:70px">`)}${row("Suelo (altura)",`<input id="fiS" type="number" step="10" value="${f.suelo||650}" style="width:80px">`)}${row("Empujón →",`<input id="fiV" type="range" min="-600" max="600" value="${f.vx||0}">`)}${f.k==="rebota"?row("Rebote",`<input id="fiE" type="range" min="0" max="90" value="${Math.round((f.e==null?.5:f.e)*100)}">`):""}`:`<div class="sub" style="font-size:11px;opacity:.7">Coloca el objeto en lo alto y elige «Cae y rebota».</div>`}</div>`;}
  if(def){
    const ROLF=/oreja|colgante|cola|pelo|ropa|capa|bufanda|falda|cinta/i,cand=def.piezas.filter(p=>(p.m&&p.m.phys)||ROLF.test(p.rol||"")||ROLF.test(p.n||"")),otras=def.piezas.filter(p=>!cand.includes(p)&&!/ojo|boca|ceja|cuerpo/.test(p.rol||""));
    const sec=it.sec||{};
    h+=`<div class="card"><h4>🎀 Colas, pelo y ropa (física suave)</h4><div class="sub" style="font-size:11px;opacity:.7;margin:0 0 4px">Las piezas que cuelgan se mueven con retraso cuando el personaje camina o salta. Es el mismo resultado en la vista previa y en el MP4.</div>
     ${cand.length?cand.map(p=>{const o=sec[p.n]||{},base=Object.assign({k:55,c:5.5,g:1,w:.25,max:.7},(p.m&&p.m.phys)||{}),v=k=>o[k]!=null?o[k]:base[k],on=o.on!==false&&!!((p.m&&p.m.phys)||o.on);
      return `<div style="margin:6px 0;padding:6px;background:#12142a;border-radius:8px"><label><input type="checkbox" data-fo="${esc(p.n)}" ${on?"checked":""}> <b>${esc(p.n)}</b></label>
       <div class="mez" ${on?"":'style="opacity:.45"'}>${[["k","Rigidez",10,120,1],["c","Freno",1,14,.5],["g","Fuerza",0,2,.05],["w","Viento",0,1,.05],["max","Límite",.1,1.2,.05]].map(([k,l,a,b,st])=>`<label>${l} <input type="range" data-fk="${k}" data-fp="${esc(p.n)}" min="${a}" max="${b}" step="${st}" value="${v(k)}"><b>${(+v(k)).toFixed(st<1?2:0)}</b></label>`).join("")}</div></div>`;}).join(""):'<div class="sub">Este personaje no tiene piezas que cuelguen.</div>'}
     ${otras.length?`<div class="row"><span>Agregar a otra pieza</span><select id="foNueva"><option value="">Elegir…</option>${otras.map(p=>`<option value="${esc(p.n)}">${esc(p.n)}</option>`).join("")}</select></div>`:""}</div>`;
  }
  h+=`<div class="card"><h4>🛤 Trayectoria</h4><div class="sub" style="font-size:11px;opacity:.7;margin:0 0 4px">Pon la barra de tiempo donde empieza el movimiento. Después edita los puntos naranjas: arrástralos, o clic derecho para quitarlos.</div><div class="btns"><button id="trRec" title="Arrastra el elemento y se graba con su velocidad real">⏺ Grabar moviendo</button><button id="trDib" title="Dibuja el camino; el elemento lo recorre a velocidad pareja">✏️ Dibujar camino</button></div>${puntosKf(it).length?`<div class="btns" style="margin-top:4px"><button id="trSua">〰 Suavizar</button><button id="trBor" class="danger">🗑 Borrar camino</button></div><div class="sub" style="font-size:11px;opacity:.7">${puntosKf(it).length} puntos</div>`:""}</div>`;
  h+=`<div class="card"><div class="btns"><button id="pDup">⧉ Duplicar</button><button id="pBloq">${it.bloq?"🔓 Desbloquear":"🔒 Bloquear"}</button><button id="pOcu">👁 Ocultar</button><button id="pDel" class="danger">🗑 Quitar</button></div></div>`;
  P.innerHTML=h;
  const ch=()=>changed(),setv=(k,v)=>{it[k]=v;draw();};
  const nom=bind(P,"#pNom","onchange",e=>{it.ficha={nombre:e.target.value||"Personaje"};ch();renderProps();});void nom;
  const s=bind(P,"#pS","oninput",e=>setv("s",e.target.value/100));if(s)s.onchange=ch;
  const d=bind(P,"#pD","oninput",e=>setv("d",+e.target.value));if(d)d.onchange=ch;
  const o=bind(P,"#pO","oninput",e=>setv("op",e.target.value/100));if(o)o.onchange=ch;
  bind(P,"#pF","onclick",()=>{it.flip=it.flip?0:1;ch();renderProps();});bind(P,"#pFr","onclick",()=>{it.d=Math.min(100,Math.max(...curScene().items.map(i=>i.d==null?60:i.d))+1);ch();renderProps();});
  bind(P,"#pAt","onclick",()=>{it.d=Math.max(0,Math.min(...curScene().items.map(i=>i.d==null?60:i.d))-1);ch();renderProps();});
  bind(P,"#gOn","onclick",()=>{it.go={x1:clamp(it.x+320,60,1220),y1:it.y,t0:0,t1:Math.max(3,curScene().dur-1)};ch();renderProps();});
  bind(P,"#gOff","onclick",()=>{delete it.go;ch();renderProps();});
  bind(P,"#gT0","onchange",e=>{it.go.t0=+e.target.value||0;ch();});bind(P,"#gT1","onchange",e=>{it.go.t1=+e.target.value||3;ch();});
  const pa=bind(P,"#pPas","oninput",e=>setv("paso",e.target.value/100));if(pa)pa.onchange=ch;
  P.querySelectorAll("input[data-k]").forEach(e=>{e.oninput=()=>{it.pal=Object.assign({},it.pal||{},{[e.dataset.k]:e.value});draw();};e.onchange=ch;});
  bind(P,"#pPe","onchange",e=>{it.pal=Object.assign({},it.pal||{},{pelo_estilo:e.target.value});ch();});
  const gc=()=>{it.pal=Object.assign({},it.pal||{},{gorro:P.querySelector("#pGo").checked?P.querySelector("#pGoC").value:null});draw();};bind(P,"#pGo","onchange",()=>{gc();ch();});const gcc=bind(P,"#pGoC","oninput",gc);if(gcc)gcc.onchange=ch;
  bind(P,"#pEx","onchange",e=>{it.expr=e.target.value;ch();draw();});
  P.querySelectorAll("[data-ac]").forEach(b=>b.onclick=()=>{const k=b.dataset.ac,tg=P.querySelector("#pTg");it.acc=it.acc||[];it.acc.push({k,t0:Math.round(edT*10)/10,tgt:k==="señalar"&&tg&&tg.value?tg.value:undefined});changed();renderProps();draw();say("Listo: dale ▶ para verlo.");});
  P.querySelectorAll("[data-ad]").forEach(b=>b.onclick=()=>{it.acc.splice(+b.dataset.ad,1);changed();renderProps();draw();});
  P.querySelectorAll("[data-am]").forEach(b=>b.onclick=()=>{const a=it.acc[+b.dataset.am];a._m=!a._m;renderProps();});
  P.querySelectorAll("[data-mk]").forEach(r=>{r.oninput=()=>{const a=it.acc[+r.dataset.mi],k=r.dataset.mk;a[k]=+r.value;r.nextElementSibling.textContent=k==="w"?Math.round(+r.value*100)+"%":(+r.value).toFixed(k==="dur"?1:2)+" s";draw();};r.onchange=()=>{changed();renderProps();};});
  P.querySelectorAll("[data-po]").forEach(b=>b.onclick=()=>{it.acc=it.acc||[];it.acc.push({k:"pose:"+b.dataset.po,t0:Math.round(edT*10)/10});changed();renderProps();draw();say("Pose puesta. Ajusta su mezcla con ⚙.");});
  bind(P,"#poNew","onclick",()=>window.Poses&&Poses.editarPose(it));bind(P,"#ciEd","onclick",()=>window.Poses&&Poses.editarCiclo(it));
  bind(P,"#poDel","onclick",()=>{if(confirm("¿Borrar todas tus poses guardadas?")){const used=new Set(Object.keys(proj.poses||{}));for(const w of proj.mundos)for(const o of w.items)if(o.acc)o.acc=o.acc.filter(a=>!(a.k.startsWith("pose:")&&used.has(a.k.slice(5))));delete proj.poses;changed();renderProps();draw();}});
  bind(P,"#pCi","onchange",e=>{if(e.target.value==="normal")delete it.ciclo;else it.ciclo=e.target.value;changed();draw();});
  bind(P,"#kCrv","onclick",()=>window.Curvas&&Curvas.abrir(it));
  bind(P,"#kAdd","onclick",()=>{const q=posAt(it,edT);setKf(it,edT,{x:Math.round(q.x),y:Math.round(q.y),s:+q.s.toFixed(3)});changed();renderProps();draw();});
  P.querySelectorAll("[data-kd]").forEach(b=>b.onclick=()=>{it.kf.splice(+b.dataset.kd,1);if(!it.kf.length)delete it.kf;changed();renderProps();draw();});
  bind(P,"#fiK","onchange",e=>{if(!e.target.value)delete it.fis;else it.fis=Object.assign({t0:0,suelo:Math.max(it.y+150,650),vx:0,e:.5},it.fis||{},{k:e.target.value});ch();renderProps();draw();});
  for(const [id,k,fn] of [["#fiT","t0",v=>+v||0],["#fiS","suelo",v=>+v||650]])bind(P,id,"onchange",e=>{it.fis[k]=fn(e.target.value);ch();draw();});
  {const v=bind(P,"#fiV","oninput",e=>{it.fis.vx=+e.target.value;draw();});if(v)v.onchange=ch;const q=bind(P,"#fiE","oninput",e=>{it.fis.e=e.target.value/100;draw();});if(q)q.onchange=ch;}
  if(it.kind==="img"&&window.Relieve)Relieve.bind(P,it,it.ref,()=>{ch();renderProps();draw();});
  bind(P,"#eN","onchange",e=>{if(e.target.value)it.ent=e.target.value;else delete it.ent;ch();renderProps();draw();});
  bind(P,"#eS","onchange",e=>{if(e.target.value){it.sal=e.target.value;if(!(it.sal_t>0))it.sal_t=Math.max(1,(curScene().dur||6)-1);}else delete it.sal;ch();renderProps();draw();});
  for(const [id,k,fn] of [["#eNt","ent_t",v=>Math.max(0,+v||0)],["#eNd","ent_d",v=>Math.max(.2,+v||.8)],["#eSt","sal_t",v=>Math.max(0,+v||0)],["#eSd","sal_d",v=>Math.max(.2,+v||.8)]])bind(P,id,"onchange",e=>{it[k]=fn(e.target.value);ch();draw();});
  bind(P,"#pMv","onchange",e=>{it.mov=e.target.value;ch();});
  P.querySelectorAll("[data-fo]").forEach(c=>c.onchange=()=>{it.sec=it.sec||{};const n=c.dataset.fo,o=it.sec[n]=it.sec[n]||{};o.on=c.checked;changed();renderProps();draw();});
  P.querySelectorAll("[data-fk]").forEach(r=>r.oninput=()=>{it.sec=it.sec||{};const n=r.dataset.fp,o=it.sec[n]=it.sec[n]||{};o[r.dataset.fk]=+r.value;if(o.on==null)o.on=true;r.nextElementSibling.textContent=(+r.value).toFixed(+r.step<1?2:0);draw();});
  P.querySelectorAll("[data-fk]").forEach(r=>r.onchange=()=>changed());
  bind(P,"#foNueva","onchange",e=>{if(!e.target.value)return;it.sec=it.sec||{};it.sec[e.target.value]={on:true};changed();renderProps();draw();});
  bind(P,"#pExA","onchange",e=>{it.exprAuto=e.target.checked;changed();draw();});
  bind(P,"#trRec","onclick",()=>grabarTrayecto("grabar"));bind(P,"#trDib","onclick",()=>grabarTrayecto("dibujar"));bind(P,"#trSua","onclick",suavizarTrayecto);bind(P,"#trBor","onclick",borrarTrayecto);
  bind(P,"#pBloq","onclick",()=>alternar(it,"bloq"));bind(P,"#pOcu","onclick",()=>alternar(it,"oculto"));
  bind(P,"#pDup","onclick",()=>{const c=JSON.parse(JSON.stringify(it,strip));c.uid=uid();c.x+=40;c.y+=10;curScene().items.push(c);sel=c.uid;ch();renderProps();});
  bind(P,"#pDel","onclick",delItem);void def;
}
function delItem(){const sc=curScene(),i=sc.items.findIndex(x=>x.uid===sel);if(i<0)return;sc.items.splice(i,1);sel=null;changed();renderProps();}
async function ambiente(sc,k,v){
  if(!window.Dub||!window.DubFX)return;const ls=Dub.lines(sc),old=ls.findIndex(l=>l.amb);
  if(old>=0){ls.splice(old,1);}
  if(!k){delete sc.amb;changed();say("Ambiente quitado.");return;}
  const vol=v==null?(sc.amb?sc.amb.v:.35):v,fx=DubFX.makeSfx(k);if(!fx)return;
  const n=Math.round(sc.dur*fx.sr),out=new Float32Array(n),L=fx.data.length,fd=Math.min(Math.round(.5*fx.sr),L>>1);
  for(let i=0;i<n;i++){let p=i%(L-fd),x=fx.data[p];if(p<fd&&i>=L-fd){/*empalme suave*/const u=p/fd;x=fx.data[p]*u+fx.data[L-fd+p]*(1-u);}out[i]=x*vol;}
  const id=Dub.newId(),d=await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(new Blob([DubX.wavBytes([out],fx.sr)],{type:"audio/wav"}));});
  await Dub.setAudio(id,d);Dub.idbPut(id,d);ls.push({id,txt:"",quien:"",t0:0,sfx:true,amb:true,nombre:"Ambiente: "+fx.nombre,voz:true});
  sc.amb={k,v:vol};changed();say("Ambiente listo: dale ▶ para oírlo.");
}
function nombreItem(it){if(it.kind==="actor")return (it.ficha&&it.ficha.nombre)||"Personaje";if(it.kind==="img")return ((proj.imgs[it.ref]||{}).n)||"Imagen";if(it.kind==="deco")return "Decoración "+(it.ref||"");return it.kind||"Elemento";}
function multiPanel(P){
  const g=grupo();
  P.innerHTML=`<h3>${g.length} elementos elegidos</h3><div class="sub">Shift o Ctrl + clic suma o quita. Arrastra uno y se mueven todos.</div>
  <div class="card"><h4>↔ Alinear</h4><div class="btns"><button data-al="izq">⇤ Izquierda</button><button data-al="cx">⇔ Centro</button><button data-al="der">⇥ Derecha</button></div>
  <div class="btns" style="margin-top:4px"><button data-al="arr">⤒ Arriba</button><button data-al="cy">⇕ Medio</button><button data-al="aba">⤓ Abajo</button></div></div>
  <div class="card"><h4>▥ Distribuir</h4><div class="btns"><button data-di="h">Horizontal parejo</button><button data-di="v">Vertical parejo</button></div></div>
  <div class="card"><div class="btns"><button id="mDup">⧉ Duplicar</button><button id="mCop">📋 Copiar</button><button id="mBloq">🔒 Bloquear</button><button id="mOcu">👁 Ocultar</button><button id="mDel" class="danger">🗑 Quitar</button></div></div>`;
  P.querySelectorAll("[data-al]").forEach(b=>b.onclick=()=>alinear(b.dataset.al));
  P.querySelectorAll("[data-di]").forEach(b=>b.onclick=()=>distribuir(b.dataset.di));
  bind(P,"#mDup","onclick",duplicarSel);bind(P,"#mCop","onclick",copiar);bind(P,"#mDel","onclick",borrarSel);
  bind(P,"#mBloq","onclick",()=>{g.forEach(i=>i.bloq=true);sel=null;msel.clear();changed();renderProps();draw();});
  bind(P,"#mOcu","onclick",()=>{g.forEach(i=>i.oculto=true);sel=null;msel.clear();changed();renderProps();draw();});
}
/* capas: lista de lo que hay en la escena, con ojo (ocultar) y candado (bloquear) */
function capasCard(P){
  const sc=curScene();if(!sc.items.length)return;
  const c=document.createElement("div");c.className="card";
  const L=sc.items.map((it,i)=>[it,i]).sort((a,b)=>((b[0].d==null?60:b[0].d)-(a[0].d==null?60:a[0].d))||b[1]-a[1]);
  c.innerHTML="<h4>🗂 Capas</h4>"+L.map(([it])=>`<div class="capa" data-u="${it.uid}" style="display:flex;gap:6px;align-items:center;margin:3px 0;opacity:${it.oculto?.45:1}"><button data-o="${it.uid}" title="Mostrar u ocultar">${it.oculto?"🚫":"👁"}</button><button data-b="${it.uid}" title="Bloquear o desbloquear">${it.bloq?"🔒":"🔓"}</button><span data-s="${it.uid}" style="flex:1;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(nombreItem(it))}</span></div>`).join("");
  P.appendChild(c);
  const por=u=>sc.items.find(i=>i.uid===u);
  c.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>alternar(por(b.dataset.o),"oculto"));
  c.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>alternar(por(b.dataset.b),"bloq"));
  c.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{const it=por(b.dataset.s);if(it&&!it.oculto){sel=it.uid;msel.clear();renderProps();draw();}});
}
function scenePanel(P){
  const sc=curScene(),c=sc.cam||(sc.cam={z0:1,z1:1,x0:0,x1:0});
  const bgn=sc.fondo&&sc.fondo.id==="blanco"?"Color liso":sc.fondo&&sc.fondo.img?((proj.imgs[sc.fondo.img]||{}).n||"Mi imagen"):(BGS[sc.fondo&&sc.fondo.id]||A.BG[0]).n;
  P.innerHTML=`<h3>${palabraEsc()} ${proj.mundo+1}</h3><div class="sub">Haz clic en algo del cuadro para editarlo.</div>
  <div class="card"><h4>🎬 Esta escena</h4><input id="sNom" type="text" value="${esc(sc.nombre)}" style="width:100%;background:#12141c;border:1px solid #343a58;color:#fff;border-radius:8px;padding:7px;margin-bottom:6px">
   ${row("Dura (s)",`<input id="sDur" type="number" min="2" max="300" step="1" value="${sc.dur}" style="width:80px">`)}
   ${row("Fondo",`<span style="flex:1;opacity:.85">${esc(bgn)}</span><button id="sBg">Cambiar</button>`)}${sc.fondo&&sc.fondo.id==="blanco"?row("Color del fondo",`<input id="sBgC" type="color" value="${sc.fondo.color||"#ffffff"}">`):""}
   ${row("Momento",`<select id="sHo">${[["","☀️ Día"],["tarde","🌇 Atardecer"],["noche","🌙 Noche"]].map(([v,l])=>`<option value="${v}" ${(sc.hora||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}</div>
  ${sc.fondo&&sc.fondo.img&&window.Relieve?Relieve.card(sc.fondo,sc.fondo.img):""}
  <div class="card"><h4>🌄 Animar el fondo</h4>${row("Movimiento",`<select id="sBm">${[["","Quieto"],["deriva","Deriva (se desplaza despacio)"],["vaiven","Vaivén suave"],["respirar","Respirar (zoom suave)"],["acercar","Acercarse"],["alejar","Alejarse"]].map(([v,l])=>`<option value="${v}" ${((sc.fondo&&sc.fondo.mov)||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}
   ${sc.fondo&&sc.fondo.mov?row("Velocidad",`<input id="sBv" type="range" min="10" max="150" value="${sc.fondo.vel==null?50:sc.fondo.vel}">`):""}</div>
  <div class="card"><h4>📷 Cámara</h4><div class="btns" style="margin-bottom:6px"><button data-cp="fija">Fija</button><button data-cp="acercar">Acercar</button><button data-cp="alejar">Alejar</button><button data-cp="der">Pasea →</button><button data-cp="izq">← Pasea</button></div>
   ${row("Zoom inicio",`<input id="cZ0" type="range" min="100" max="200" value="${Math.round((c.z0||1)*100)}">`)}${row("Zoom final",`<input id="cZ1" type="range" min="100" max="200" value="${Math.round((c.z1||1)*100)}">`)}
   ${row("Mover inicio",`<input id="cX0" type="range" min="-300" max="300" value="${c.x0||0}">`)}${row("Mover final",`<input id="cX1" type="range" min="-300" max="300" value="${c.x1||0}">`)}</div>
  <div class="card"><h4>🎵 Sonido de esta escena</h4>${row("Música (volumen)",`<input id="sMv" type="range" min="0" max="150" value="${Math.round((sc.musVol==null?1:sc.musVol)*100)}">`)}
   ${row("Ambiente",`<select id="sAm"><option value="">Ninguno</option>${[["viento","🌬 Viento"],["lluvia","🌧 Lluvia"],["pajaros","🐦 Pajaritos"]].map(([v,l])=>`<option value="${v}" ${sc.amb&&sc.amb.k===v?"selected":""}>${l}</option>`).join("")}</select>`)}
   ${row("Volumen ambiente",`<input id="sAv" type="range" min="5" max="100" value="${Math.round((sc.amb?sc.amb.v:.35)*100)}">`)}</div>
  <div class="card"><h4>✨ Aspecto</h4>${row("Atmósfera",`<select id="aAt">${(window.Look?Look.ATM:[["","Ninguna"]]).map(([v,l])=>`<option value="${v}" ${(sc.atm||"")===v?"selected":""}>${l}</option>`).join("")}</select>`)}
   ${[["aBl","Brillo suave","bloom",0,100],["aCa","Frío ↔ Cálido","calor",-100,100],["aVi","Viñeta","vig",0,90],["aGr","Grano de cine","grano",0,100],["aDo","Fondo desenfocado","dof",0,100]].map(([id,l,k,mi,ma])=>row(l,`<input id="${id}" type="range" min="${mi}" max="${ma}" value="${Math.round(((sc.look||{})[k]||0)*100)}">`)).join("")}
   ${row("Sombras",`<select id="aSh"><option value="" ${sc.sombra!=="suave"?"selected":""}>De la silueta (realista)</option><option value="suave" ${sc.sombra==="suave"?"selected":""}>Mancha suave</option></select>`)}
   <div class="btns" style="margin-top:6px"><button id="aCine">🎬 Look de cine</button><button id="aNo">Quitar todo</button></div></div>
  <div class="card"><h4>🎥 La cámara sigue a…</h4>${row("Personaje",`<select id="cSg"><option value="">Nadie</option>${sc.items.filter(i=>i.kind==="actor").map(i=>`<option value="${i.uid}" ${c.sigue===i.uid?"selected":""}>${esc((i.ficha&&i.ficha.nombre)||"Personaje")}</option>`).join("")}</select>`)}</div>
  <div class="card"><h4>✂ Cortes de cámara</h4><div class="sub" style="font-size:11px;opacity:.7;margin-bottom:4px">Cambia de plano de golpe, como en el cine: un plano general, luego un primer plano…</div>
   <div class="btns"><button id="ctAdd" class="pri">✂ Cortar aquí (${edT.toFixed(1)} s)</button></div>
   ${(sc.cortes||[]).map((k,i)=>`<div class="mez"><div class="row"><b>Plano ${i+1} · desde ${k.t.toFixed(1)} s</b><button data-cd="${i}" class="danger">✕</button></div>
     <label>Plano <select data-ck="z" data-ci="${i}">${PLANOS.map(([n,v])=>`<option value="${v}" ${Math.abs((k.z||1)-v)<.01?"selected":""}>${n}</option>`).join("")}<option value="${k.z}" ${PLANOS.some(([,v])=>Math.abs((k.z||1)-v)<.01)?"hidden":"selected"}>${(k.z||1).toFixed(2)}×</option></select><span></span></label>
     <label>Acerca <input type="range" min="1" max="3" step=".05" value="${k.z1==null?k.z||1:k.z1}" data-ck="z1" data-ci="${i}"><b>${(k.z1==null?k.z||1:k.z1).toFixed(2)}×</b></label>
     <label>Lado <input type="range" min="-400" max="400" step="10" value="${k.x||0}" data-ck="x" data-ci="${i}"><b>${k.x||0}</b></label>
     <label>Sigue a <select data-ck="sigue" data-ci="${i}"><option value="">(el de la escena)</option><option value="none" ${k.sigue===null?"selected":""}>Nadie</option>${sc.items.filter(o=>o.kind==="actor").map(o=>`<option value="${o.uid}" ${k.sigue===o.uid?"selected":""}>${esc((o.ficha&&o.ficha.nombre)||"Personaje")}</option>`).join("")}</select><span></span></label></div>`).join("")}</div>
  <div class="card"><h4>🎞 Escenas</h4><div class="btns"><button id="sDup">⧉ Duplicar</button><button id="sL">◀ Antes</button><button id="sR">Después ▶</button><button id="sDel" class="danger">🗑</button></div></div>`;
  const ch=()=>changed();
  bind(P,"#sNom","onchange",e=>{sc.nombre=e.target.value||"Escena";ch();renderTl();});bind(P,"#sDur","onchange",e=>{sc.dur=clamp(+e.target.value||10,2,300);ch();renderTl();syncScrub();if(sc.amb)ambiente(sc,sc.amb.k,sc.amb.v);});
  if(sc.fondo&&sc.fondo.img&&window.Relieve)Relieve.bind(P,sc.fondo,sc.fondo.img,()=>{ch();renderProps();draw();});
  bind(P,"#sBm","onchange",e=>{sc.fondo=sc.fondo||{id:"pradera"};if(e.target.value)sc.fondo.mov=e.target.value;else delete sc.fondo.mov;ch();renderProps();draw();});
  {const v=bind(P,"#sBv","oninput",e=>{sc.fondo.vel=+e.target.value;draw();});if(v)v.onchange=ch;}
  bind(P,"#sBg","onclick",()=>{rail="fon";renderLib();});{const cb=bind(P,"#sBgC","oninput",e=>{sc.fondo.color=e.target.value;draw();});if(cb)cb.onchange=()=>{ch();renderTl();};}bind(P,"#sHo","onchange",e=>{sc.hora=e.target.value;ch();});
  const pre={fija:[1,1,0,0],acercar:[1,1.35,0,0],alejar:[1.4,1,0,0],der:[1.15,1.15,-120,120],izq:[1.15,1.15,120,-120]};
  P.querySelectorAll("[data-cp]").forEach(b=>b.onclick=()=>{const a=pre[b.dataset.cp];Object.assign(c,{z0:a[0],z1:a[1],x0:a[2],x1:a[3]});ch();renderProps();say("Cámara lista: dale ▶ para verla.");});
  for(const [id,k,f] of [["#cZ0","z0",v=>v/100],["#cZ1","z1",v=>v/100],["#cX0","x0",v=>+v],["#cX1","x1",v=>+v]]){const e=bind(P,id,"oninput",ev=>{c[k]=f(ev.target.value);draw();});if(e)e.onchange=ch;}
  {const mv=bind(P,"#sMv","oninput",e=>{sc.musVol=e.target.value/100;});if(mv)mv.onchange=ch;
   const am=bind(P,"#sAm","onchange",e=>ambiente(sc,e.target.value,null));const av=bind(P,"#sAv","onchange",e=>{if(sc.amb)ambiente(sc,sc.amb.k,e.target.value/100);});void am;void av;}
  {const lk=()=>sc.look||(sc.look={});bind(P,"#aAt","onchange",e=>{sc.atm=e.target.value;ch();draw();});
   for(const [id,k,sg] of [["#aBl","bloom",1],["#aCa","calor",1],["#aVi","vig",1],["#aGr","grano",1],["#aDo","dof",1]]){const e=bind(P,id,"oninput",ev=>{lk()[k]=ev.target.value/100*sg;draw();});if(e)e.onchange=ch;}
   bind(P,"#aCine","onclick",()=>{Object.assign(lk(),{bloom:.35,calor:.18,vig:.35,grano:.25});ch();renderProps();draw();});
   bind(P,"#aNo","onclick",()=>{delete sc.look;delete sc.atm;ch();renderProps();draw();});}
  bind(P,"#aSh","onchange",e=>{if(e.target.value)sc.sombra=e.target.value;else delete sc.sombra;ch();draw();});
  bind(P,"#ctAdd","onclick",()=>{sc.cortes=sc.cortes||[];const t=Math.round(edT*10)/10;if(sc.cortes.some(k=>Math.abs(k.t-t)<.05)){say("Ya hay un corte ahí.");return;}sc.cortes.push({t,z:sc.cortes.length?1.8:1.35,z1:sc.cortes.length?1.95:1.45,x:0});sc.cortes.sort((a,b)=>a.t-b.t);ch();renderProps();draw();});
  P.querySelectorAll("[data-cd]").forEach(b=>b.onclick=()=>{sc.cortes.splice(+b.dataset.cd,1);if(!sc.cortes.length)delete sc.cortes;ch();renderProps();draw();});
  P.querySelectorAll("[data-ck]").forEach(r=>{const ev=r.tagName==="SELECT"?"onchange":"oninput";r[ev]=()=>{const k=sc.cortes[+r.dataset.ci],p=r.dataset.ck;if(p==="sigue"){if(r.value==="")delete k.sigue;else k.sigue=r.value==="none"?null:r.value;}else{k[p]=+r.value;if(p==="z"&&(k.z1==null||k.z1<k.z))k.z1=k.z;if(r.nextElementSibling&&r.tagName==="INPUT")r.nextElementSibling.textContent=p==="x"?r.value:(+r.value).toFixed(2)+"×";}ch();draw();};});
  bind(P,"#cSg","onchange",e=>{if(e.target.value)c.sigue=e.target.value;else delete c.sigue;ch();draw();});
  bind(P,"#sDup","onclick",()=>{const o=JSON.parse(JSON.stringify(sc,strip));o.nombre+=" (copia)";const m={};for(const it of o.items){const n=uid();m[it.uid]=n;it.uid=n;}for(const l of o.lineas||[]){l.id="l"+Date.now().toString(36)+Math.random().toString(36).slice(2,4);if(m[l.quien])l.quien=m[l.quien];}
    proj.mundos.splice(proj.mundo+1,0,o);gotoScene(proj.mundo+1);changed();});
  bind(P,"#sL","onclick",()=>{if(proj.mundo>0){const [x]=proj.mundos.splice(proj.mundo,1);proj.mundos.splice(proj.mundo-1,0,x);proj.mundo--;changed();renderTl();renderProps();}});
  bind(P,"#sR","onclick",()=>{if(proj.mundo<proj.mundos.length-1){const [x]=proj.mundos.splice(proj.mundo,1);proj.mundos.splice(proj.mundo+1,0,x);proj.mundo++;changed();renderTl();renderProps();}});
  bind(P,"#sDel","onclick",()=>{if(proj.mundos.length<2){say("Una serie necesita al menos una escena.");return;}proj.mundos.splice(proj.mundo,1);proj.mundo=Math.min(proj.mundo,proj.mundos.length-1);sel=null;changed();renderTl();renderProps();});
  if(window.Fx)Fx.panel(sc,P);
}

/* ---------------- línea de tiempo ---------------- */
function renderTl(){
  const t=$("tlCards");t.innerHTML="";
  proj.mundos.forEach((sc,i)=>{const d=document.createElement("div");d.className="sc"+(i===proj.mundo?" on":"");d.innerHTML=`<canvas width="${Math.round(72*UW()/UH())}" height="72" style="width:${Math.round(72*UW()/UH())}px;height:72px;border-radius:6px;display:block;background:#222"></canvas><b>${i+1}. ${esc(sc.nombre)}</b><small>${sc.dur} s</small>`;d.onclick=()=>gotoScene(i);t.appendChild(d);});
  $("tlTotal").textContent="Total: "+fmt(proj.mundos.reduce((a,m)=>a+(m.dur||6),0));thumbs();
}
function thumbs(){
  const cs=document.querySelectorAll("#tlCards .sc canvas");
  proj.mundos.forEach((sc,i)=>{const c=cs[i];if(!c)return;try{frame(c.getContext("2d"),sc,0,null);}catch(e){}});
  draw();
}
const fmt=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
function gotoScene(i){if(pv.on)return;proj.mundo=clamp(i,0,proj.mundos.length-1);sel=null;edT=0;fullRender();}
function syncScrub(){window.dispatchEvent(new CustomEvent("serie-time",{detail:edT}));const s=$("scrub");if(!s)return;s.max=curScene().dur;s.value=edT;$("scrubT").textContent=edT.toFixed(1)+" / "+curScene().dur+" s";}
function fullRender(){const ba=$("bAddScene");if(ba&&proj)ba.textContent="＋ "+palabraEsc();renderTl();renderProps();renderLib();syncScrub();draw();window.dispatchEvent(new Event("serie-tl"));}

/* ---------------- reproducción y exportación ---------------- */
function say(t){const s=$("status");s.textContent=t;s.hidden=false;clearTimeout(tmr);tmr=setTimeout(()=>{s.hidden=true;},4200);}
function sceneStart(w,live,from){if(window.Dub)Dub.begin(w,live,from||0);for(const it of w.items)it.dubLv=null;}
function play(all,from){
  if(pv.on){stop("");return;}
  sel=null;pv.on=true;pv.all=!!all;pv.exp=null;if(all)proj.mundo=0;pv.t=from||0;pv.last=performance.now();
  renderProps();renderTl();sceneStart(curScene(),true,from||0);$("bPlay").textContent="⏹ Detener";$("bPlayAll").hidden=true;requestAnimationFrame(runLive);
}
function stop(msg){
  if(!pv.on)return;pv.on=false;const ex=pv.exp;pv.exp=null;
  if(window.Dub)Dub.stop();for(const sc of proj.mundos)for(const it of sc.items)it.dubLv=null;
  $("bPlay").textContent="▶ Vista previa";$("bPlayAll").hidden=false;if(msg)say(msg);edT=0;syncScrub();renderTl();draw();
  if(ex)ex.end(msg);
}
function runLive(now){
  if(!pv.on||pv.exp)return;
  const dt=Math.min(.05,(now-pv.last)/1000);pv.last=now;pv.t+=dt;
  const sc=curScene();stepFrame(sc,pv.t);
  if(pv.t>=sc.dur){
    if(pv.all&&proj.mundo<proj.mundos.length-1){if(window.Dub)Dub.stop();proj.mundo++;pv.t=0;renderTl();sceneStart(curScene(),true);}
    else{stop("Fin de la vista previa.");return;}
  }
  requestAnimationFrame(runLive);
}
function stepFrame(sc,t){
  if(window.Fx)Fx.tick(t,sc);if(window.Dub)Dub.tick(t,sc);
  frame($("cv").getContext("2d"),sc,t,null);
  window.dispatchEvent(new CustomEvent("serie-time",{detail:t}));const s=$("scrub");if(s&&!pv.exp){s.value=t;$("scrubT").textContent=t.toFixed(1)+" / "+sc.dur+" s";}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runExport(ex){
  Studio.exporting=true;pv.on=true;pv.exp=ex;sel=null;
  try{
    for(let si=0;si<proj.mundos.length&&!ex.cancelled;si++){
      proj.mundo=si;const sc=proj.mundos[si];sceneStart(sc,false);
      const n=Math.max(1,Math.round(sc.dur*ex.fps));
      for(let f=0;f<n&&!ex.cancelled;f++){
        while(ex.skip()&&!ex.cancelled)await sleep(6);
        const t=f/ex.fps;stepFrame(sc,t);ex.capture();
        if(f%6===0)await sleep(0);
      }
      if(window.Dub)Dub.stop();
    }
  }catch(e){console.error(e);}
  pv.on=false;pv.exp=null;Studio.exporting=false;proj.mundo=0;fullRender();
  if(ex.cancelled){ex.end("Exportación cancelada.");}else ex.end();
}
function beginExport(ex){if(pv.on)return false;runExport(ex);return true;}
function cancelExport(){if(pv.exp)pv.exp.cancelled=true;}
function totalSeconds(){return proj.mundos.reduce((a,m)=>a+(m.dur||6),0);}

/* ---------------- guardar y abrir ---------------- */
function exportText(){return JSON.stringify(Object.assign({},proj,{audios:window.Dub?Dub.dump():undefined}),strip);}
async function importText(txt){
  const p=JSON.parse(txt);const au=p.audios;delete p.audios;
  if(!p.mundos||!p.mundos.length)throw new Error("Ese archivo no es una serie.");
  setProj(p);if(window.Dub){Dub.load(au);Dub.restore&&Dub.restore();}if(window.Subs)Subs.restore();changed(true);
}
function setProj(p){
  p.imgs=p.imgs||{};p.actores=p.actores||[];p.mundo=clamp(p.mundo||0,0,p.mundos.length-1);
  for(const sc of p.mundos){sc.items=sc.items||[];sc.lineas=sc.lineas||[];sc.cam=sc.cam||{z0:1,z1:1,x0:0,x1:0};sc.dur=sc.dur||10;sc.nombre=sc.nombre||"Escena";}
  if(!p.tipo)p.tipo="serie";p.lienzo=lienzoDe(p);proj=p;Studio.proj=p;IMG={};aplicarLienzo();sel=null;edT=0;undo=[];redo=[];lastSnap=snapshot();loadImgs();$("pNombre").value=p.nombre||"";fullRender();
}
function idb(){return new Promise((ok,no)=>{const r=indexedDB.open("atr_serie",1);r.onupgradeneeded=()=>r.result.createObjectStore("p");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
async function saveAuto(){if(window.__RENDER)return;try{const db=await idb(),tx=db.transaction("p","readwrite");tx.objectStore("p").put(JSON.stringify(proj,strip),"actual");$("info").textContent="✔ Guardado en este equipo";}catch(e){$("info").textContent="";}}
async function loadAuto(){try{const db=await idb();return await new Promise(ok=>{const r=db.transaction("p").objectStore("p").get("actual");r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null);});}catch(e){return null;}}
/* 📷 Foto: el cuadro actual como PNG, al tamaño final del proyecto (sin depender de la ventana) */
function foto(){
  if(pv.on||Studio.exporting){say("Detén la vista previa para sacar la foto.");return;}
  const l=lienzoDe(proj),asp=UW()/UH(),tier=l.base,W=asp>=1?Math.round(tier*asp/2)*2:tier,H=asp>=1?tier:Math.round(tier/asp/2)*2;
  const sc=curScene(),keep=sel;sel=null;engine.fijar(W,H);stepFrame(sc,edT);
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.drawImage($("cv"),0,0);
  if(window.Fx)Fx.draw(g,W,H);if(window.Dub)Dub.drawSub(g,W,H);
  engine.soltar();sel=keep;draw();
  c.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=((proj.nombre||"cuadro").replace(/[^\wáéíóúñ -]/gi,"").replace(/\s+/g,"-")||"cuadro")+"-"+W+"x"+H+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);say("Foto guardada: "+W+"×"+H+" px.");},"image/png");
}
function download(name,txt){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}
function projDlg(){
  const m=$("projDlg");m.hidden=false;
}

/* ---------------- ratón ---------------- */
function ptr(e){const r=$("cv").getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*UW(),y:(e.clientY-r.top)/r.height*UH()};}
let drag=null;
function hit(p){
  const sc=curScene(),L=sc.items.map((it,i)=>[it,i]).sort((a,b)=>((b[0].d==null?60:b[0].d)-(a[0].d==null?60:a[0].d))||b[1]-a[1]);
  for(const [it] of L){if(it.oculto||it.bloq)continue;const b=it._bb;if(b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)return it;}return null;
}
function wire(){
  const cv=$("cv");
  cv.addEventListener("pointerdown",e=>{
    if(pv.on)return;const p=ptr(e);const c0=curItem();if(edT>0&&!(c0&&c0.kf)){edT=0;syncScrub();draw();}
    if(rec){const cam0=camAt(curScene(),0),it=rec.it,b0=posAt(it,rec.t0);drag={m:"rec",it,p0:p,b0,cz:cam0.z,t0:performance.now(),pts:[{t:0,x:b0.x,y:b0.y}]};cv.setPointerCapture(e.pointerId);return;}
    const it0=curItem();
    if(it0&&it0.kf){const cam1=camAt(curScene(),0),pf1=pfOf(it0.d);for(const f of puntosKf(it0)){const w=w2s(f.x,f.y,cam1,pf1);if(Math.hypot(p.x-w.x,p.y-w.y)<14){drag={m:"kf",it:it0,f,cam:cam1,pf:pf1};cv.setPointerCapture(e.pointerId);return;}}}
    if(it0&&it0._bb){const b=it0._bb;if(Math.abs(p.x-(b.x+b.w))<16&&Math.abs(p.y-(b.y+b.h))<16){drag={m:"s",it:it0,s0:it0.s||1,d0:Math.hypot(p.x-b.X,p.y-b.Y)||1};cv.setPointerCapture(e.pointerId);return;}
      if(it0.go){const cam=camAt(curScene(),0),pf=pfOf(it0.d),fx=((it0.go.x1-cam.x*pf-UW()/2)*cam.z+UW()/2),fy=((it0.go.y1-360)*cam.z+360);if(Math.hypot(p.x-fx,p.y-fy)<20){drag={m:"g",it:it0,z:cam.z};cv.setPointerCapture(e.pointerId);return;}}}
    const it=hit(p);
    if(it&&(e.shiftKey||e.ctrlKey||e.metaKey)){
      if(msel.has(it.uid)&&msel.size>1){msel.delete(it.uid);if(sel===it.uid)sel=[...msel][0]||null;}
      else{if(sel)msel.add(sel);msel.add(it.uid);sel=it.uid;}
      renderProps();draw();return;}
    if(it){const sh=sel!==it.uid;if(!msel.has(it.uid))msel.clear();sel=it.uid;drag={m:"m",it,x:p.x,y:p.y,ix:it.x,iy:it.y,gr:grupo().filter(o=>o!==it).map(o=>({it:o,ix:o.x,iy:o.y}))};cv.setPointerCapture(e.pointerId);if(sh)renderProps();}
    else if(sel&&!(e.shiftKey||e.ctrlKey||e.metaKey)){sel=null;msel.clear();renderProps();}
    draw();
  });
  cv.addEventListener("pointermove",e=>{
    if(!drag)return;const p=ptr(e),it=drag.it,cam=camAt(curScene(),0);
    if(drag.m==="rec"){const x=drag.b0.x+(p.x-drag.p0.x)/drag.cz,y=drag.b0.y+(p.y-drag.p0.y)/drag.cz,t=(performance.now()-drag.t0)/1000,L=drag.pts[drag.pts.length-1];
      if(Math.hypot(x-L.x,y-L.y)>=2)drag.pts.push({t,x,y});draw();
      const g=$("cv").getContext("2d"),sx=$("cv").width/UW();g.save();g.strokeStyle="#ffb347";g.lineWidth=3*sx;g.beginPath();drag.pts.forEach((q,i)=>{const w=w2s(q.x,q.y,camAt(curScene(),0),pfOf(it.d));i?g.lineTo(w.x*sx,w.y*sx):g.moveTo(w.x*sx,w.y*sx);});g.stroke();g.restore();return;}
    if(drag.m==="kf"){const q=s2w(p.x,p.y,drag.cam,drag.pf);drag.f.x=q.x;drag.f.y=q.y;draw();return;}
    if(drag.m==="m"){const nx=Math.round(drag.ix+(p.x-drag.x)/cam.z),ny=Math.round(drag.iy+(p.y-drag.y)/cam.z);if(it.kf&&edT>0)setKf(it,edT,{x:nx,y:ny});else{it.x=nx;it.y=ny;}
      for(const g of drag.gr||[]){const gx=Math.round(g.ix+(p.x-drag.x)/cam.z),gy=Math.round(g.iy+(p.y-drag.y)/cam.z);if(g.it.kf&&edT>0)setKf(g.it,edT,{x:gx,y:gy});else{g.it.x=gx;g.it.y=gy;}}}
    else if(drag.m==="s"){const b=it._bb;it.s=clamp(drag.s0*(Math.hypot(p.x-b.X,p.y-b.Y)/drag.d0),.1,4);}
    else if(drag.m==="g"){const pf=pfOf(it.d);it.go.x1=Math.round((p.x-UW()/2)/cam.z+UW()/2+cam.x*pf);it.go.y1=Math.round((p.y-360)/cam.z+360);}
    draw();
  });
  const up=()=>{if(drag){const m=drag.m,d=drag;drag=null;if(m==="rec"){finTrayecto(d.pts);return;}changed();if(m==="s")renderProps();}};
  cv.addEventListener("contextmenu",e=>{const it=curItem();if(!it||!it.kf)return;const p=ptr(e),cam=camAt(curScene(),0),pf=pfOf(it.d);
    for(const f of puntosKf(it)){const w=w2s(f.x,f.y,cam,pf);if(Math.hypot(p.x-w.x,p.y-w.y)<14){e.preventDefault();delete f.x;delete f.y;it.kf=it.kf.filter(k=>Object.keys(k).some(q=>q!=="t"&&q!=="e"));changed();renderProps();draw();say("Punto quitado.");return;}}});
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  const fr=$("frame");
  fr.addEventListener("dragover",e=>{e.preventDefault();fr.classList.add("over");});fr.addEventListener("dragleave",()=>fr.classList.remove("over"));
  fr.addEventListener("drop",e=>{e.preventDefault();fr.classList.remove("over");const d=e.dataTransfer.getData("text/plain");if(!d)return;const p=ptr(e),[k,...r]=d.split(":"),id=r.join(":");
    if(k==="dec")addDeco(id,Math.round(p.x),Math.round(p.y));else if(k==="img")addImg(id,Math.round(p.x),Math.round(p.y));
    else if(k==="act"){addActor(id,id==="dino_nino"?"Dino y niño":(A.HUM_PRE[id.replace("hum:","")]||{n:"Personaje"}).n.split(" ")[0]);const it=curItem();if(it){it.x=Math.round(p.x);it.y=Math.round(p.y);changed();}}});
  window.addEventListener("keydown",e=>{
    if(/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||""))||!$("exp").hidden)return;
    if(e.key==="Delete"||e.key==="Backspace"){if(sel){e.preventDefault();borrarSel();}}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="c"){if(copiar())e.preventDefault();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="v"){if(pegar())e.preventDefault();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"){e.preventDefault();duplicarSel();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="a"){e.preventDefault();selTodo();}
    else if(e.key==="Escape"&&sel){sel=null;msel.clear();renderProps();draw();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?doRedo():doUndo();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();doRedo();}
    else if(e.key===" "){e.preventDefault();play(false);}
    else if(sel&&e.key.startsWith("Arrow")){if(!curItem())return;e.preventDefault();const st=e.shiftKey?20:4;mover(e.key==="ArrowLeft"?-st:e.key==="ArrowRight"?st:0,e.key==="ArrowUp"?-st:e.key==="ArrowDown"?st:0);}
  });
}

/* ---------------- arranque ---------------- */
/* al exportar, el lienzo se dibuja al TAMAÑO FINAL del video (no al de la ventana) */
let fijo=null;
const engine={fijar(W,H){fijo={W,H};const c=$("cv");c.width=W;c.height=H;},soltar(){fijo=null;fitCanvas();},get fijo(){return fijo;}};
function fitCanvas(){const c=$("cv");if(!c||Studio.exporting||fijo)return;const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(320,Math.round(c.clientWidth*dpr/2)*2);const h=Math.round(w*UH()/UW());if(c.width!==w||c.height!==h){c.width=w;c.height=h;}}
function aplicarLienzo(){const f=$("frame");if(!f||!proj)return;const a=UW()/UH();f.style.aspectRatio=UW()+" / "+UH();f.style.setProperty("--asp",a);fitCanvas();}
const Studio=window.Studio={proj:null,say,seleccion:()=>curItem(),recursos,grabarTrayecto,suavizarTrayecto,borrarTrayecto,grupoN:()=>grupo().length,gotoScene:i=>gotoScene(i),changed:()=>changed(),select:()=>{sel=null;renderProps();draw();},play:()=>play(false),playFrom:t=>play(false,t),get tNow(){return pv.t;},stopPlay:()=>stop(""),exporting:false,
  get placed(){const sc=curScene();return sc?sc.items.filter(i=>i.kind==="actor"):[];},get playing(){return pv.on;},beginExport,cancelExport,totalSeconds,exportText,importText,
  rerender:()=>fullRender(),dim,newProj,setProject:p=>{setProj(p);changed(true);},loadAuto,aplicarLienzo,FMT,BASES,lienzoDe,get serie(){return {proj:()=>proj,defOf,addActor,IMG:()=>IMG,changed,renderLib,uid,loadImgs,say};},foto};
window.__atr2={engine};
window.Serie={setKf,posAt,getT:()=>edT,curItem,quedan,dim,renderTl,renderProps,GAITS,gaitOf,poseOf,easeFn,bez,curScene,setT(t){if(pv.on)return;edT=clamp(t,0,curScene().dur);syncScrub();draw();},select(u){sel=u;renderProps();draw();},get sel(){return sel;},get playing(){return pv.on;},posAt,setKf,EASE,itemName(it){return it.kind==="actor"?(it.ficha&&it.ficha.nombre)||"Personaje":it.kind==="deco"?(SPD[it.ref]||{n:"Decoración"}).n:(proj.imgs[it.ref]||{}).n||"Imagen";},loadImgs,addImg,thumbs,saveAuto,addActorDef(def){proj.actores.push(def);changed();renderLib();say("Personaje guardado en «Mis personajes».");},get proj(){return proj;},changed,renderLib,say,addActor,play,draw,frame,defOf};

async function init(){
  if(!Rig.ok()){$("status").hidden=false;$("status").textContent="Este navegador no puede usar WebGL: actívalo para ver los personajes.";}
  let p=null;
  if(window.__RENDER){const saved=await loadAuto();if(saved){try{p=JSON.parse(saved);if(!p.mundos||!p.mundos.length)p=null;}catch(e){p=null;}}}
  Studio.proj=proj=p||newProj();setProj(proj);
  wire();fitCanvas();new ResizeObserver(()=>{fitCanvas();draw();}).observe($("cv"));
  $("q").oninput=renderLib;
  $("bUndo").onclick=doUndo;$("bRedo").onclick=doRedo;$("bPlay").onclick=()=>play(false);$("bPlayAll").onclick=()=>play(true);
  $("bAddScene").onclick=()=>{const s=newScene(palabraEsc()+" "+(proj.mundos.length+1),JSON.parse(JSON.stringify(curScene().fondo)));proj.mundos.push(s);gotoScene(proj.mundos.length-1);changed();};
  $("scrub").oninput=e=>{if(pv.on)return;edT=+e.target.value;window.dispatchEvent(new CustomEvent("serie-time",{detail:edT}));const ka=document.getElementById("kAdd");if(ka)ka.textContent="🔑 Guardar aquí ("+edT.toFixed(1)+" s)";$("scrubT").textContent=edT.toFixed(1)+" / "+curScene().dur+" s";draw();};
  $("pNombre").onchange=e=>{proj.nombre=e.target.value||"Mi serie";changed(true);};
  $("bProj").onclick=projDlg;if($("bFoto"))$("bFoto").onclick=foto;$("projClose").onclick=()=>{$("projDlg").hidden=true;};
  $("pjLz").onclick=()=>{$("projDlg").hidden=true;if(window.Inicio)Inicio.configurar();};
  $("pjNew").onclick=()=>{$("projDlg").hidden=true;if(window.Inicio)Inicio.abrir();};
  $("pjSave").onclick=()=>{download((proj.nombre||"mi-serie").replace(/[^\wáéíóúñ -]/gi,"").replace(/\s+/g,"-")+".atrapa",exportText());say("Archivo guardado en Descargas.");};
  $("pjOpen").onclick=()=>{const f=$("fUp");f.accept=".atrapa,.atrapacuentos,.json";f.multiple=false;f.onchange=async()=>{try{await importText(await f.files[0].text());$("projDlg").hidden=true;say("Serie abierta.");}catch(e){say("No pude abrir ese archivo: "+e.message);}f.value="";};f.click();};
  document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const s=b.dataset.step;if(s==="1"){rail="act";renderLib();}else if(s==="2"){rail="fon";renderLib();}else if(s==="3")$("bDub").click();else $("bExp").click();});
  document.dispatchEvent(new Event("studio-ready"));
  fullRender();
  if(!window.__RENDER&&window.Inicio)Inicio.abrir(true);
  window.__serieReady=true;
}
window.addEventListener("beforeunload",()=>{try{saveAuto();}catch(e){}});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
