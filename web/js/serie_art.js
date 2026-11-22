/* Arte incluido en Modo Serie: fondos por capas (con profundidad), decoración y elementos dibujados por código
   (sin descargar nada) y personajes humanos por piezas (cabeza, boca, torso, brazos, piernas).
   Todo se dibuja en unidades de escena: el cuadro mide 1280 × 720. */
(function(){
"use strict";
const TAU=Math.PI*2;
function RND(seed){let s=(Math.imul(seed|0,2654435761)+12345)>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const lerp=(a,b,t)=>a+(b-a)*t;
const hx=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
function mix(c1,c2,t){const a=hx(c1),b=hx(c2);return "#"+a.map((v,i)=>Math.round(lerp(v,b[i],t)).toString(16).padStart(2,"0")).join("");}
const shade=(c,k)=>k>=0?mix(c,"#ffffff",k):mix(c,"#000000",-k);
function circ(g,x,y,r,col){g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
function ell(g,x,y,rx,ry,col,rot){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,TAU);g.fill();}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function shadow(g,x,y,w){g.fillStyle="rgba(20,40,20,.22)";g.beginPath();g.ellipse(x,y,w,w*.14,0,0,TAU);g.fill();}

/* ================= elementos dibujados: (g, cx, by, h, rnd, pal) — cx centro, by base, h alto ================= */
const D={};
D.arbol=(g,cx,by,h,r,p)=>{p=p||["#3f9a55","#58b86a"];const tw=h*.09;shadow(g,cx,by,h*.28);
  g.fillStyle="#7a4f2c";rr(g,cx-tw/2,by-h*.42,tw,h*.42,tw*.3);g.fill();
  for(const [dx,dy,rad] of [[-.2,.5,.26],[.2,.52,.25],[0,.7,.3],[-.1,.88,.22],[.14,.84,.2]])circ(g,cx+dx*h*.9,by-dy*h,rad*h,p[0]);
  for(const [dx,dy,rad] of [[-.12,.78,.13],[.08,.9,.1],[-.2,.58,.1]])circ(g,cx+dx*h*.9,by-dy*h,rad*h,p[1]);};
D.pino=(g,cx,by,h,r,p)=>{p=p||["#2f7a4e","#3e9460"];shadow(g,cx,by,h*.22);g.fillStyle="#6b4426";g.fillRect(cx-h*.04,by-h*.2,h*.08,h*.2);
  for(let i=0;i<4;i++){const y=by-h*(.14+i*.2),w=h*(.34-i*.065);g.fillStyle=i%2?p[1]:p[0];g.beginPath();g.moveTo(cx,y-h*.3);g.lineTo(cx+w,y);g.lineTo(cx-w,y);g.closePath();g.fill();}};
D.araucaria=(g,cx,by,h,r,p)=>{p=p||["#3b6b34","#4f8a42"];shadow(g,cx,by,h*.2);
  g.fillStyle="#5b4a3a";g.beginPath();g.moveTo(cx-h*.045,by);g.lineTo(cx-h*.03,by-h*.78);g.lineTo(cx+h*.03,by-h*.78);g.lineTo(cx+h*.045,by);g.fill();
  g.strokeStyle="#4a3b2e";g.lineWidth=h*.012;for(let i=0;i<7;i++){const y=by-h*(.2+i*.075);g.beginPath();g.moveTo(cx-h*.03,y);g.lineTo(cx-h*.07,y+h*.03);g.moveTo(cx+h*.03,y);g.lineTo(cx+h*.07,y+h*.03);g.stroke();}
  const ty=by-h*.8;for(let i=0;i<9;i++){const a=-Math.PI*(.12+.76*i/8),L=h*(.2+.04*Math.sin(i*2.1)),x1=cx+Math.cos(a)*L*1.5,y1=ty+Math.sin(a)*L*.5;
    g.strokeStyle="#5b4a3a";g.lineWidth=h*.014;g.beginPath();g.moveTo(cx,ty+h*.03);g.quadraticCurveTo(cx+Math.cos(a)*L,ty+h*.0,x1,y1);g.stroke();
    ell(g,x1,y1,h*.075,h*.04,i%2?p[0]:p[1],Math.cos(a)*.5);}
  ell(g,cx,ty-h*.03,h*.09,h*.05,p[1]);};
D.palmera=(g,cx,by,h,r,p)=>{p=p||["#2e9a58","#56bb6e"];shadow(g,cx,by,h*.2);
  g.strokeStyle="#8a5a33";g.lineWidth=h*.06;g.lineCap="round";g.beginPath();g.moveTo(cx,by);g.quadraticCurveTo(cx+h*.12,by-h*.5,cx+h*.04,by-h*.86);g.stroke();
  const tx=cx+h*.04,ty=by-h*.86;for(let i=0;i<7;i++){const a=-Math.PI*(.05+.9*i/6),L=h*.36;
    g.strokeStyle=i%2?p[0]:p[1];g.lineWidth=h*.05;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*L*.6,ty+Math.sin(a)*L*.9-h*.06,tx+Math.cos(a)*L,ty+Math.sin(a)*L*.35+h*.12);g.stroke();}
  circ(g,tx,ty+h*.02,h*.035,"#5a3a1c");};
D.helecho=(g,cx,by,h,r,p)=>{p=p||["#2f8f4a","#58b86a"];shadow(g,cx,by,h*.35);g.lineCap="round";
  for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.32,L=h*(.8+.15*Math.cos(i)),ex=cx+Math.sin(a+Math.PI/2)*0,x1=cx+Math.cos(a)*L*.55,y1=by-Math.abs(Math.sin(a))*L*.9;
    const x2=cx+Math.cos(a)*L*1.1,y2=by-Math.abs(Math.sin(a))*L*.6+L*.12;
    g.strokeStyle=p[0];g.lineWidth=h*.015;g.beginPath();g.moveTo(cx,by);g.quadraticCurveTo(x1,y1,x2,y2);g.stroke();
    for(let k=1;k<12;k++){const u=k/12,qx=(1-u)*(1-u)*cx+2*(1-u)*u*x1+u*u*x2,qy=(1-u)*(1-u)*by+2*(1-u)*u*y1+u*u*y2,s=h*.06*(1-u*.7);
      ell(g,qx-s*.5,qy-s*.2,s,s*.28,k%2?p[0]:p[1],-.5);ell(g,qx+s*.5,qy-s*.2,s,s*.28,k%2?p[1]:p[0],.5);}}};
D.arbusto=(g,cx,by,h,r,p)=>{p=p||["#3f9a55","#5fbd6c"];shadow(g,cx,by,h*.8);for(const [dx,dy,rad] of [[-.5,.35,.34],[.5,.35,.34],[0,.5,.5],[-.25,.3,.3],[.25,.3,.3]])circ(g,cx+dx*h,by-dy*h,rad*h,p[0]);
  for(const [dx,dy,rad] of [[-.15,.66,.16],[.2,.52,.12],[-.45,.45,.1]])circ(g,cx+dx*h,by-dy*h,rad*h,p[1]);};
D.flores=(g,cx,by,h,r,p)=>{const cols=p||["#ff6b9a","#ffd23f","#ffffff","#a77bff"];g.lineCap="round";
  for(let i=0;i<6;i++){const x=cx+(i-2.5)*h*.2,t=h*(.55+.4*r()),by2=by-h*.02*(i%2);g.strokeStyle="#3d8f45";g.lineWidth=h*.03;g.beginPath();g.moveTo(x,by2);g.quadraticCurveTo(x+h*.05*(r()-.5),by2-t*.5,x,by2-t);g.stroke();
    ell(g,x-h*.06,by2-t*.4,h*.07,h*.025,"#4fae55",-.5);const c=cols[i%cols.length];for(let k=0;k<5;k++){const a=k*TAU/5;circ(g,x+Math.cos(a)*h*.06,by2-t+Math.sin(a)*h*.06,h*.05,c);}circ(g,x,by2-t,h*.04,"#ffb62e");}};
D.copihue=(g,cx,by,h,r,p)=>{g.strokeStyle="#3f7a3a";g.lineWidth=h*.025;g.lineCap="round";g.beginPath();g.moveTo(cx-h*.4,by-h*.95);g.bezierCurveTo(cx-h*.1,by-h*1.05,cx+h*.1,by-h*.8,cx+h*.4,by-h*.9);g.stroke();
  for(let i=0;i<7;i++){const x=cx-h*.38+i*h*.12,y=by-h*(.96-.1*Math.sin(i*.9));ell(g,x,y-h*.03,h*.06,h*.025,"#3f8f45",i%2?.6:-.6);}
  for(const dx of [-.25,0,.25]){const x=cx+dx*h,y=by-h*(.9-.03*dx);g.strokeStyle="#3f7a3a";g.lineWidth=h*.015;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+h*.1);g.stroke();
    g.fillStyle="#d8142c";g.beginPath();g.moveTo(x-h*.025,y+h*.09);g.quadraticCurveTo(x-h*.1,y+h*.2,x-h*.1,y+h*.34);g.quadraticCurveTo(x,y+h*.4,x+h*.1,y+h*.34);g.quadraticCurveTo(x+h*.1,y+h*.2,x+h*.025,y+h*.09);g.fill();
    g.fillStyle="#fff3ea";g.beginPath();g.ellipse(x,y+h*.35,h*.1,h*.03,0,0,TAU);g.fill();g.strokeStyle="#fff";g.lineWidth=h*.01;g.beginPath();g.moveTo(x,y+h*.34);g.lineTo(x-h*.02,y+h*.44);g.moveTo(x,y+h*.34);g.lineTo(x+h*.03,y+h*.45);g.stroke();}};
D.cactus=(g,cx,by,h,r,p)=>{p=p||["#4f9a5a","#6dba70"];shadow(g,cx,by,h*.3);const w=h*.2;
  g.fillStyle=p[0];rr(g,cx-w/2,by-h,w,h,w/2);g.fill();rr(g,cx-w*1.9,by-h*.62,w*.7,h*.1,w*.35);g.fill();rr(g,cx-w*1.9,by-h*.72,w*.62,h*.3,w*.31);g.fill();
  rr(g,cx+w*.5,by-h*.5,w*.8,h*.1,w*.35);g.fill();rr(g,cx+w*1.0,by-h*.74,w*.62,h*.34,w*.31);g.fill();
  g.strokeStyle=p[1];g.lineWidth=h*.012;for(const d of [-.2,0,.2]){g.beginPath();g.moveTo(cx+d*w,by-h*.95);g.lineTo(cx+d*w,by-h*.05);g.stroke();}
  g.fillStyle="#ff9ab8";circ(g,cx,by-h*1.0,h*.035,"#ff7aa5");};
D.hongo=(g,cx,by,h,r,p)=>{shadow(g,cx,by,h*.4);g.fillStyle="#f6ecd8";rr(g,cx-h*.14,by-h*.5,h*.28,h*.5,h*.1);g.fill();
  g.fillStyle="#e23b3b";g.beginPath();g.ellipse(cx,by-h*.5,h*.45,h*.4,0,Math.PI,0);g.closePath();g.fill();
  for(const [dx,dy,s] of [[-.2,.62,.07],[.1,.78,.06],[.24,.58,.05],[-.02,.55,.045]])circ(g,cx+dx*h,by-dy*h,s*h,"#fff");};
D.pasto=(g,cx,by,h,r,p)=>{p=p||["#4fae55","#7bd06a"];g.lineCap="round";for(let i=0;i<16;i++){const x=cx+(i-7.5)*h*.07,t=h*(.5+.5*r());g.strokeStyle=i%2?p[0]:p[1];g.lineWidth=h*.035;g.beginPath();g.moveTo(x,by);g.quadraticCurveTo(x+h*.04*(r()-.3),by-t*.6,x+h*.12*(r()-.5),by-t);g.stroke();}};
D.tronco=(g,cx,by,h,r,p)=>{const w=h*1.6;g.fillStyle="#7a4f2c";rr(g,cx-w/2,by-h*.5,w,h*.5,h*.2);g.fill();g.fillStyle="#9b6b3e";rr(g,cx-w/2,by-h*.5,w,h*.18,h*.09);g.fill();
  ell(g,cx+w/2,by-h*.25,h*.12,h*.25,"#d9b27a");ell(g,cx+w/2,by-h*.25,h*.07,h*.15,"#c79a5e");};
D.roca=(g,cx,by,h,r,p)=>{p=p||"#8d96a3";shadow(g,cx,by,h*.7);g.fillStyle=p;g.beginPath();g.moveTo(cx-h*.7,by);g.lineTo(cx-h*.55,by-h*.55);g.lineTo(cx-h*.15,by-h);g.lineTo(cx+h*.35,by-h*.85);g.lineTo(cx+h*.7,by-h*.35);g.lineTo(cx+h*.75,by);g.closePath();g.fill();
  g.fillStyle=shade(p,.22);g.beginPath();g.moveTo(cx-h*.55,by-h*.55);g.lineTo(cx-h*.15,by-h);g.lineTo(cx+h*.35,by-h*.85);g.lineTo(cx,by-h*.5);g.closePath();g.fill();
  g.fillStyle=shade(p,-.18);g.beginPath();g.moveTo(cx,by-h*.5);g.lineTo(cx+h*.35,by-h*.85);g.lineTo(cx+h*.7,by-h*.35);g.lineTo(cx+h*.75,by);g.lineTo(cx+h*.1,by);g.closePath();g.fill();};
D.rocas=(g,cx,by,h,r,p)=>{D.roca(g,cx-h*.55,by,h*.7,r);D.roca(g,cx+h*.5,by,h*.9,r,"#7e8895");D.roca(g,cx+h*.05,by+h*.02,h*.45,r,"#a1a9b5");};
D.cristal=(g,cx,by,h,r,p)=>{p=p||["#7fe3ff","#a98bff"];for(const [dx,s,c,a] of [[-.3,.7,p[1],-.2],[.3,.8,p[0],.18],[0,1,p[0],0],[.55,.5,p[1],.3],[-.55,.5,p[0],-.3]]){
  g.save();g.translate(cx+dx*h*.5,by);g.rotate(a);g.fillStyle=c;g.beginPath();g.moveTo(-h*.1*s,0);g.lineTo(-h*.08*s,-h*.7*s);g.lineTo(0,-h*s);g.lineTo(h*.08*s,-h*.7*s);g.lineTo(h*.1*s,0);g.closePath();g.fill();
  g.fillStyle="rgba(255,255,255,.35)";g.beginPath();g.moveTo(-h*.08*s,-h*.7*s);g.lineTo(0,-h*s);g.lineTo(0,-h*.05*s);g.lineTo(-h*.08*s,-h*.05*s);g.closePath();g.fill();g.restore();}};
D.estalactita=(g,cx,by,h,r,p)=>{p=p||"#6d6a7c";for(const [dx,s] of [[-.5,.7],[-.2,1],[.15,.6],[.45,.85]]){g.fillStyle=shade(p,dx*.1);g.beginPath();g.moveTo(cx+dx*h*.6-h*.13,by-h);g.lineTo(cx+dx*h*.6+h*.13,by-h);g.lineTo(cx+dx*h*.6,by-h*(1-s));g.closePath();g.fill();}};
D.nube=(g,cx,by,h,r,p)=>{g.fillStyle=p||"#ffffff";const c=by-h/2;for(const [dx,dy,rad] of [[-.7,.1,.34],[-.3,-.1,.46],[.2,-.18,.5],[.7,.08,.34],[0,.2,.4],[-.5,.22,.3],[.45,.22,.3]])circ(g,cx+dx*h,c+dy*h*.6,rad*h*.7,p||"#fff");
  g.fillStyle="rgba(170,200,230,.25)";g.beginPath();g.ellipse(cx,c+h*.28,h*.95,h*.12,0,0,TAU);g.fill();};
D.sol=(g,cx,by,h,r,p)=>{const c=by-h/2;g.strokeStyle="#ffcf3f";g.lineWidth=h*.05;g.lineCap="round";for(let i=0;i<12;i++){const a=i*TAU/12;g.beginPath();g.moveTo(cx+Math.cos(a)*h*.36,c+Math.sin(a)*h*.36);g.lineTo(cx+Math.cos(a)*h*.5,c+Math.sin(a)*h*.5);g.stroke();}
  const gr=g.createRadialGradient(cx,c,0,cx,c,h*.32);gr.addColorStop(0,"#fff3a8");gr.addColorStop(1,"#ffcf3f");g.fillStyle=gr;g.beginPath();g.arc(cx,c,h*.32,0,TAU);g.fill();};
D.luna=(g,cx,by,h,r,p)=>{const c=by-h/2;g.fillStyle="#f6f0c8";g.beginPath();g.arc(cx,c,h*.42,0,TAU);g.fill();g.globalCompositeOperation="destination-out";g.beginPath();g.arc(cx+h*.2,c-h*.08,h*.38,0,TAU);g.fill();g.globalCompositeOperation="source-over";};
D.estrella=(g,cx,by,h,r,p)=>{const c=by-h/2;g.fillStyle="#ffe14a";g.strokeStyle="#ffb62e";g.lineWidth=h*.04;g.lineJoin="round";g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?h*.2:h*.46;g.lineTo(cx+Math.cos(a)*rad,c+Math.sin(a)*rad);}g.closePath();g.fill();g.stroke();};
D.arcoiris=(g,cx,by,h,r,p)=>{const cols=["#ff4d4d","#ff9f3f","#ffe14a","#5fd068","#4aa8ff","#8b5cff"];g.lineWidth=h*.07;for(let i=0;i<6;i++){g.strokeStyle=cols[i];g.beginPath();g.arc(cx,by,h*(.95-i*.07),Math.PI,0);g.stroke();}};
D.pajaros=(g,cx,by,h,r,p)=>{g.strokeStyle="#34405a";g.lineWidth=h*.06;g.lineCap="round";for(const [dx,dy,s] of [[-.7,.1,.6],[0,-.1,.9],[.7,.15,.5]]){g.beginPath();g.moveTo(cx+(dx-.35*s)*h,by-h/2+dy*h);g.quadraticCurveTo(cx+(dx-.15*s)*h,by-h/2+(dy-.3*s)*h,cx+dx*h,by-h/2+dy*h);g.quadraticCurveTo(cx+(dx+.15*s)*h,by-h/2+(dy-.3*s)*h,cx+(dx+.35*s)*h,by-h/2+dy*h);g.stroke();}};
D.casa=(g,cx,by,h,r,p)=>{p=p||["#e9d2a8","#c2503c"];shadow(g,cx,by,h*.8);const w=h*1.0;g.fillStyle=p[0];g.fillRect(cx-w/2,by-h*.55,w,h*.55);
  g.fillStyle=p[1];g.beginPath();g.moveTo(cx-w*.62,by-h*.52);g.lineTo(cx,by-h);g.lineTo(cx+w*.62,by-h*.52);g.closePath();g.fill();
  g.fillStyle="#7a4f2c";rr(g,cx-w*.1,by-h*.32,w*.2,h*.32,h*.02);g.fill();g.fillStyle="#bfe6f7";g.fillRect(cx-w*.38,by-h*.42,w*.2,w*.2);g.fillRect(cx+w*.18,by-h*.42,w*.2,w*.2);
  g.strokeStyle="#7a4f2c";g.lineWidth=h*.015;g.strokeRect(cx-w*.38,by-h*.42,w*.2,w*.2);g.strokeRect(cx+w*.18,by-h*.42,w*.2,w*.2);g.fillStyle="#8a3a2a";g.fillRect(cx+w*.25,by-h*.95,w*.1,h*.25);};
D.carpa=(g,cx,by,h,r,p)=>{p=p||"#e8913a";shadow(g,cx,by,h*.8);g.fillStyle=p;g.beginPath();g.moveTo(cx,by-h);g.lineTo(cx+h*.8,by);g.lineTo(cx-h*.8,by);g.closePath();g.fill();
  g.fillStyle=shade(p,-.2);g.beginPath();g.moveTo(cx,by-h);g.lineTo(cx+h*.8,by);g.lineTo(cx+h*.1,by);g.closePath();g.fill();g.fillStyle="#3b2a1c";g.beginPath();g.moveTo(cx-h*.02,by-h*.55);g.lineTo(cx+h*.22,by);g.lineTo(cx-h*.22,by);g.closePath();g.fill();};
D.valla=(g,cx,by,h,r,p)=>{g.fillStyle="#b98a54";for(let i=0;i<5;i++){const x=cx+(i-2)*h*.3;g.beginPath();g.moveTo(x-h*.09,by);g.lineTo(x-h*.09,by-h*.85);g.lineTo(x,by-h);g.lineTo(x+h*.09,by-h*.85);g.lineTo(x+h*.09,by);g.fill();}
  g.fillStyle="#9b6e3e";g.fillRect(cx-h*.72,by-h*.62,h*1.44,h*.1);g.fillRect(cx-h*.72,by-h*.28,h*1.44,h*.1);};
D.cartel=(g,cx,by,h,r,p)=>{g.fillStyle="#7a4f2c";g.fillRect(cx-h*.035,by-h*.7,h*.07,h*.7);g.fillStyle="#d9a864";rr(g,cx-h*.45,by-h,h*.9,h*.4,h*.04);g.fill();g.strokeStyle="#7a4f2c";g.lineWidth=h*.03;g.stroke();
  g.fillStyle="#7a4f2c";g.beginPath();g.moveTo(cx-h*.3,by-h*.8);g.lineTo(cx+h*.2,by-h*.8);g.lineTo(cx+h*.2,by-h*.88);g.lineTo(cx+h*.34,by-h*.8);g.lineTo(cx+h*.2,by-h*.72);g.lineTo(cx+h*.2,by-h*.8);g.fill();};
D.puente=(g,cx,by,h,r,p)=>{const w=h*2;g.fillStyle="#9b6e3e";g.beginPath();g.moveTo(cx-w/2,by);g.quadraticCurveTo(cx,by-h*1.1,cx+w/2,by);g.lineTo(cx+w/2,by+h*.12);g.quadraticCurveTo(cx,by-h*.9,cx-w/2,by+h*.12);g.closePath();g.fill();
  g.strokeStyle="#7a4f2c";g.lineWidth=h*.03;for(let i=0;i<9;i++){const u=i/8,x=cx-w/2+u*w,y=by-Math.sin(u*Math.PI)*h*.5;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+h*.08);g.stroke();}
  g.strokeStyle="#7a4f2c";g.lineWidth=h*.04;g.beginPath();g.moveTo(cx-w/2,by-h*.2);g.quadraticCurveTo(cx,by-h*1.4,cx+w/2,by-h*.2);g.stroke();};
D.fogata=(g,cx,by,h,r,p)=>{const t=(p&&p.t)||0;shadow(g,cx,by,h*.5);g.strokeStyle="#6b4426";g.lineWidth=h*.12;g.lineCap="round";g.beginPath();g.moveTo(cx-h*.4,by-h*.05);g.lineTo(cx+h*.3,by-h*.2);g.moveTo(cx+h*.4,by-h*.05);g.lineTo(cx-h*.3,by-h*.2);g.stroke();
  const fl=1+.08*Math.sin(t*14);for(const [s,c] of [[1,"#ff7a2a"],[.7,"#ffb62e"],[.4,"#fff1a0"]]){g.fillStyle=c;g.beginPath();g.moveTo(cx-h*.28*s,by-h*.15);g.quadraticCurveTo(cx-h*.34*s,by-h*.6*s*fl,cx,by-h*1.0*s*fl);g.quadraticCurveTo(cx+h*.34*s,by-h*.6*s*fl,cx+h*.28*s,by-h*.15);g.closePath();g.fill();}};
D.huevo=(g,cx,by,h,r,p)=>{p=p||"#e8e0c8";shadow(g,cx,by,h*.35);g.fillStyle=p;g.beginPath();g.ellipse(cx,by-h*.5,h*.34,h*.5,0,0,TAU);g.fill();g.fillStyle=shade(p,-.12);g.beginPath();g.ellipse(cx+h*.1,by-h*.45,h*.22,h*.45,0,-Math.PI/2,Math.PI/2);g.fill();
  for(const [dx,dy,s] of [[-.15,.7,.05],[.1,.85,.04],[-.05,.4,.05],[.18,.55,.035],[-.2,.45,.03]])circ(g,cx+dx*h,by-dy*h,s*h,"#9a8f6a");};
D.hueso=(g,cx,by,h,r,p)=>{const c=by-h/2;g.fillStyle="#f1ead6";g.strokeStyle="#cbbf9e";g.lineWidth=h*.03;g.save();g.translate(cx,c);g.rotate(-.3);g.beginPath();g.rect(-h*.55,-h*.08,h*1.1,h*.16);g.fill();g.stroke();
  for(const sx of [-1,1])for(const sy of [-1,1]){g.beginPath();g.arc(sx*h*.55,sy*h*.1,h*.12,0,TAU);g.fill();g.stroke();}g.restore();};
D.craneo=(g,cx,by,h,r,p)=>{shadow(g,cx,by,h*.9);g.fillStyle="#efe6cf";g.strokeStyle="#bfb28f";g.lineWidth=h*.03;g.beginPath();g.moveTo(cx-h*.85,by-h*.2);g.quadraticCurveTo(cx-h*.8,by-h*.95,cx-h*.1,by-h*.9);g.quadraticCurveTo(cx+h*.6,by-h*.85,cx+h*.95,by-h*.35);g.lineTo(cx+h*.9,by-h*.1);g.lineTo(cx-h*.2,by-h*.05);g.closePath();g.fill();g.stroke();
  circ(g,cx-h*.05,by-h*.55,h*.17,"#4a4338");circ(g,cx+h*.55,by-h*.28,h*.04,"#4a4338");g.fillStyle="#fff";for(let i=0;i<6;i++)g.fillRect(cx+h*.1+i*h*.1,by-h*.12,h*.05,h*.09);};
D.huellas=(g,cx,by,h,r,p)=>{g.fillStyle="rgba(90,70,45,.8)";for(let i=0;i<3;i++){const x=cx+(i-1)*h*.75,y=by-h*.2-(i%2)*h*.15;for(const [dx,dy,a] of [[-.18,-.18,-.4],[0,-.3,0],[.18,-.18,.4]]){g.save();g.translate(x+dx*h,y+dy*h);g.rotate(a);g.beginPath();g.ellipse(0,0,h*.07,h*.15,0,0,TAU);g.fill();g.restore();}
  g.beginPath();g.ellipse(x,y+h*.08,h*.16,h*.14,0,0,TAU);g.fill();}};
D.volcan=(g,cx,by,h,r,p)=>{g.fillStyle="#6a4a45";g.beginPath();g.moveTo(cx-h*1.1,by);g.lineTo(cx-h*.2,by-h);g.lineTo(cx+h*.2,by-h);g.lineTo(cx+h*1.1,by);g.closePath();g.fill();
  g.fillStyle="#7d5a52";g.beginPath();g.moveTo(cx,by-h);g.lineTo(cx+h*.2,by-h);g.lineTo(cx+h*1.1,by);g.lineTo(cx+h*.3,by);g.closePath();g.fill();
  g.fillStyle="#ff6a2a";g.beginPath();g.moveTo(cx-h*.22,by-h);g.quadraticCurveTo(cx-h*.28,by-h*.65,cx-h*.12,by-h*.3);g.lineTo(cx-h*.02,by-h*.55);g.quadraticCurveTo(cx+h*.05,by-h*.75,cx+h*.2,by-h);g.closePath();g.fill();
  g.fillStyle="rgba(120,110,110,.55)";for(const [dx,dy,s] of [[0,1.15,.2],[.15,1.4,.26],[-.05,1.7,.3]])circ(g,cx+dx*h,by-dy*h,s*h,"rgba(120,110,110,.5)");};
D.nido=(g,cx,by,h,r,p)=>{g.fillStyle="#8a6a3a";g.beginPath();g.ellipse(cx,by-h*.2,h*.8,h*.22,0,0,TAU);g.fill();g.strokeStyle="#6b4a26";g.lineWidth=h*.03;for(let i=0;i<9;i++){g.beginPath();g.moveTo(cx-h*.7+i*h*.17,by-h*.15);g.lineTo(cx-h*.6+i*h*.17,by-h*.38);g.stroke();}
  D.huevo(g,cx-h*.25,by-h*.1,h*.5,r,"#d8ecd0");D.huevo(g,cx+h*.22,by-h*.1,h*.5,r,"#ecdcc8");};
D.mariposa=(g,cx,by,h,r,p)=>{const t=(p&&p.t)||0,f=Math.abs(Math.cos(t*9)),c=by-h/2;g.fillStyle="#3a2a4a";g.fillRect(cx-h*.02,c-h*.2,h*.04,h*.4);
  for(const s of [-1,1]){g.fillStyle="#ff8bd0";g.beginPath();g.ellipse(cx+s*h*.2*f,c-h*.1,h*.22*f+h*.01,h*.2,s*-.4,0,TAU);g.fill();g.fillStyle="#a77bff";g.beginPath();g.ellipse(cx+s*h*.15*f,c+h*.13,h*.16*f+h*.01,h*.14,s*.4,0,TAU);g.fill();}};
D.cofre=(g,cx,by,h,r,p)=>{shadow(g,cx,by,h*.8);g.fillStyle="#8a5a2c";rr(g,cx-h*.6,by-h*.6,h*1.2,h*.6,h*.05);g.fill();g.fillStyle="#a8713a";g.beginPath();g.moveTo(cx-h*.6,by-h*.6);g.quadraticCurveTo(cx,by-h*1.15,cx+h*.6,by-h*.6);g.closePath();g.fill();
  g.fillStyle="#ffcf3f";g.fillRect(cx-h*.6,by-h*.62,h*1.2,h*.08);g.fillRect(cx-h*.07,by-h*.72,h*.14,h*.3);};
D.lupa=(g,cx,by,h,r,p)=>{g.strokeStyle="#7a4f2c";g.lineWidth=h*.1;g.lineCap="round";g.beginPath();g.moveTo(cx+h*.2,by-h*.35);g.lineTo(cx+h*.5,by);g.stroke();g.strokeStyle="#c8a04a";g.lineWidth=h*.09;g.fillStyle="rgba(180,225,255,.55)";g.beginPath();g.arc(cx-h*.1,by-h*.65,h*.33,0,TAU);g.fill();g.stroke();};
D.mapa=(g,cx,by,h,r,p)=>{g.fillStyle="#ecd9a8";g.strokeStyle="#b99a5a";g.lineWidth=h*.025;rr(g,cx-h*.6,by-h*.8,h*1.2,h*.8,h*.04);g.fill();g.stroke();g.strokeStyle="#b34a3a";g.setLineDash([h*.05,h*.04]);g.lineWidth=h*.03;g.beginPath();g.moveTo(cx-h*.4,by-h*.2);g.bezierCurveTo(cx-h*.1,by-h*.7,cx+h*.1,by-h*.1,cx+h*.4,by-h*.5);g.stroke();g.setLineDash([]);
  g.strokeStyle="#b34a3a";g.lineWidth=h*.04;g.beginPath();g.moveTo(cx+h*.32,by-h*.58);g.lineTo(cx+h*.48,by-h*.42);g.moveTo(cx+h*.48,by-h*.58);g.lineTo(cx+h*.32,by-h*.42);g.stroke();};

/* catálogo de elementos: id, nombre, categoría, alto por defecto, ancho relativo, ancla (b=pie, c=centro, t=arriba), movimiento por defecto */
const SP=[
 ["arbol","Árbol","plantas",300,.9,"b","mecer"],["pino","Pino","plantas",320,.7,"b","mecer"],["araucaria","Araucaria","plantas",420,1.1,"b","mecer"],["palmera","Palmera","plantas",340,1.0,"b","mecer"],
 ["helecho","Helecho gigante","plantas",240,1.5,"b","mecer"],["arbusto","Arbusto","plantas",130,2.0,"b","mecer"],["flores","Flores","plantas",110,1.4,"b","mecer"],["copihue","Copihue","plantas",170,1.1,"b","mecer"],
 ["cactus","Cactus","plantas",230,1.3,"b",""],["hongo","Hongo","plantas",90,1.0,"b",""],["pasto","Pasto alto","plantas",90,1.2,"b","mecer"],["tronco","Tronco","plantas",90,1.7,"b",""],
 ["roca","Roca","rocas",120,1.5,"b",""],["rocas","Rocas","rocas",150,2.2,"b",""],["cristal","Cristales","rocas",150,1.3,"b","pulso"],["estalactita","Estalactitas","rocas",220,1.5,"t",""],
 ["nube","Nube","cielo",110,2.0,"c","flotar"],["sol","Sol","cielo",150,1,"c","girar"],["luna","Luna","cielo",130,1,"c","flotar"],["estrella","Estrella","cielo",60,1,"c","pulso"],["arcoiris","Arcoíris","cielo",260,2.0,"b",""],["pajaros","Pájaros","cielo",90,2.2,"c","volar"],
 ["casa","Casita","construcciones",230,1.4,"b",""],["carpa","Carpa de campamento","construcciones",180,1.7,"b",""],["valla","Valla","construcciones",90,1.5,"b",""],["cartel","Cartel","construcciones",150,1,"b","mecer"],["puente","Puente","construcciones",120,2.0,"b",""],["fogata","Fogata","construcciones",110,1,"b","parpadear"],
 ["huevo","Huevo de dinosaurio","prehistoria",100,.7,"b",""],["nido","Nido con huevos","prehistoria",90,1.7,"b",""],["hueso","Hueso fósil","prehistoria",70,1.2,"c",""],["craneo","Cráneo fósil","prehistoria",110,2.0,"b",""],["huellas","Huellas de dinosaurio","prehistoria",70,3.0,"b",""],["volcan","Volcán","prehistoria",330,2.2,"b","humo"],
 ["mariposa","Mariposa","objetos",56,1,"c","aletear"],["cofre","Cofre del tesoro","objetos",90,1.2,"b",""],["lupa","Lupa","objetos",90,1,"b",""],["mapa","Mapa","objetos",100,1.2,"b",""]
].map(a=>({id:a[0],n:a[1],cat:a[2],h:a[3],a:a[4],anc:a[5],mov:a[6],draw:D[a[0]]}));
const CATS=[["plantas","🌳","Plantas"],["rocas","🪨","Rocas y cuevas"],["cielo","☁️","Cielo"],["construcciones","🏠","Construcciones"],["prehistoria","🥚","Prehistoria"],["objetos","🧭","Objetos"]];

/* dibuja un elemento en un lienzo propio (se guarda en caché por tamaño) */
const SC={};
function sprite(sp,res,t,anim){
  const key=sp.id+"@"+res+(anim?"@"+Math.round(t*30):"");if(SC[key])return SC[key];
  const wU=Math.ceil(sp.h*sp.a*1.15+20),hU=Math.ceil(sp.h*1.25+20),cv=document.createElement("canvas");cv.width=Math.round(wU*res);cv.height=Math.round(hU*res);
  const g=cv.getContext("2d");g.scale(res,res);
  const by=sp.anc==="b"?hU-14:sp.anc==="t"?10+sp.h:hU/2+sp.h/2;
  const r=RND(sp.id.length*977+sp.id.charCodeAt(0));
  sp.draw(g,wU/2,by,sp.h,r,undefined);
  const o={cv,wU,hU,ax:wU/2,ay:sp.anc==="b"?hU-14:sp.anc==="t"?10:hU/2};
  if(anim){const k=Object.keys(SC).filter(x=>x.startsWith(sp.id+"@")&&x.includes("@",sp.id.length+1));if(k.length>40)delete SC[k[0]];}
  return SC[key]=o;
}

/* ================= fondos por capas ================= */
const BW=2560,BH=720;
const LAY={
 sky(g,L){const gr=g.createLinearGradient(0,0,0,BH*.8);L.c.forEach((c,i)=>gr.addColorStop(i/(L.c.length-1),c));g.fillStyle=gr;g.fillRect(0,0,BW,BH);
  if(L.stars){const r=RND(7);for(let i=0;i<L.stars;i++){const x=r()*BW,y=r()*BH*.6,s=.6+r()*1.8;g.fillStyle="rgba(255,252,220,"+(.4+r()*.6).toFixed(2)+")";g.beginPath();g.arc(x,y,s,0,TAU);g.fill();}}
  if(L.sun){const s=L.sun,x=640+s.x,gr2=g.createRadialGradient(x,s.y,s.r*.4,x,s.y,s.r*4);gr2.addColorStop(0,s.glow||"rgba(255,240,170,.55)");gr2.addColorStop(1,"rgba(255,240,170,0)");g.fillStyle=gr2;g.beginPath();g.arc(x,s.y,s.r*4,0,TAU);g.fill();circ(g,x,s.y,s.r,s.col);}
  if(L.moon){const x=640+L.moon.x,y=L.moon.y,rad=L.moon.r;const gr3=g.createRadialGradient(x,y,rad*.5,x,y,rad*3);gr3.addColorStop(0,"rgba(220,230,255,.35)");gr3.addColorStop(1,"rgba(220,230,255,0)");g.fillStyle=gr3;g.beginPath();g.arc(x,y,rad*3,0,TAU);g.fill();circ(g,x,y,rad,"#f4f1d8");circ(g,x-rad*.3,y-rad*.2,rad*.18,"#e2dec0");circ(g,x+rad*.35,y+rad*.25,rad*.12,"#e2dec0");}
  if(L.clouds){const r=RND(11);for(let i=0;i<L.clouds;i++)D.nube(g,r()*BW*.9+100,60+r()*190+60,70+r()*50,r,L.cc||"#ffffffd9");}},
 mount(g,L){const r=RND(L.seed||1),n=L.n||9,pts=[];for(let i=0;i<=n;i++)pts.push([BW*i/n,L.y-(i%2?L.amp*(.45+r()*.4):L.amp*(.9+r()*.5))*(L.flat?.5:1)]);
  g.fillStyle=L.col;g.beginPath();g.moveTo(0,BH);pts.forEach(p=>g.lineTo(p[0],p[1]));g.lineTo(BW,BH);g.closePath();g.fill();
  g.fillStyle=shade(L.col,.12);for(let i=1;i<pts.length-1;i+=2){g.beginPath();g.moveTo(pts[i][0],pts[i][1]);g.lineTo(pts[i+1][0],pts[i+1][1]);g.lineTo(pts[i][0]+60,L.y+30);g.closePath();g.globalAlpha=.5;g.fill();g.globalAlpha=1;}
  if(L.snow){g.fillStyle="#f4f8ff";for(let i=1;i<pts.length-1;i++){if(pts[i][1]>L.y-L.amp*.7)continue;const [x,y]=pts[i];g.beginPath();g.moveTo(x,y);g.lineTo(x+L.amp*.22,y+L.amp*.3);g.lineTo(x+L.amp*.08,y+L.amp*.22);g.lineTo(x-L.amp*.05,y+L.amp*.34);g.lineTo(x-L.amp*.22,y+L.amp*.28);g.closePath();g.fill();}}},
 hills(g,L){const r=RND(L.seed||2),p1=r()*6,p2=r()*6,f=L.f||1;g.fillStyle=L.col;g.beginPath();g.moveTo(0,BH);for(let x=0;x<=BW;x+=16)g.lineTo(x,L.y-L.amp*(.6*Math.sin(x/(260/f)+p1)+.4*Math.sin(x/(130/f)+p2)));g.lineTo(BW,BH);g.closePath();g.fill();
  if(L.hi){g.strokeStyle=L.hi;g.lineWidth=3;g.beginPath();for(let x=0;x<=BW;x+=16){const y=L.y-L.amp*(.6*Math.sin(x/(260/f)+p1)+.4*Math.sin(x/(130/f)+p2));x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}},
 trees(g,L){const r=RND(L.seed||3),fn=D[L.type]||D.arbol;const n=L.n;const arr=[];for(let i=0;i<n;i++)arr.push([(i+.5)/n*BW+(r()-.5)*(BW/n)*.8,L.y+(r()-.5)*(L.jy||10),L.size*(.75+r()*.5)]);arr.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,s] of arr)fn(g,x,y,s,r,L.pal);},
 ground(g,L){const gr=g.createLinearGradient(0,L.y,0,BH);gr.addColorStop(0,L.col);gr.addColorStop(1,L.col2);g.fillStyle=gr;g.fillRect(0,L.y,BW,BH-L.y);
  const r=RND(L.seed||5);
  if(L.path){g.fillStyle=L.path;g.beginPath();g.moveTo(0,L.y+70);for(let x=0;x<=BW;x+=40)g.lineTo(x,L.y+70+Math.sin(x/200)*14);for(let x=BW;x>=0;x-=40)g.lineTo(x,L.y+120+Math.sin(x/200+.6)*14);g.closePath();g.globalAlpha=.6;g.fill();g.globalAlpha=1;}
  if(L.detail==="grass"){for(let i=0;i<140;i++){const x=r()*BW,y=L.y+15+r()*(BH-L.y-20);D.pasto(g,x,y,10+(y-L.y)*.1,r,[shade(L.col,-.1),shade(L.col,.08)]);}
    for(let i=0;i<26;i++){const x=r()*BW,y=L.y+20+r()*(BH-L.y-30);circ(g,x,y,2.5,["#ffffff","#ffd23f","#ff7aa8","#b79bff"][i%4]);}}
  else if(L.detail==="sand"){g.strokeStyle=shade(L.col,-.1);g.lineWidth=2;for(let i=0;i<60;i++){const x=r()*BW,y=L.y+10+r()*(BH-L.y-10),w=20+r()*50;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-6,x+w,y);g.stroke();}
    for(let i=0;i<14;i++)D.roca(g,r()*BW,L.y+25+r()*(BH-L.y-30),8+r()*10,r,shade(L.col,-.25));}
  else if(L.detail==="snow"){g.fillStyle="rgba(255,255,255,.6)";for(let i=0;i<70;i++){g.beginPath();g.ellipse(r()*BW,L.y+8+r()*(BH-L.y),20+r()*40,3+r()*4,0,0,TAU);g.fill();}}
  else if(L.detail==="rock"){for(let i=0;i<24;i++)D.roca(g,r()*BW,L.y+20+r()*(BH-L.y-20),8+r()*18,r,shade(L.col,-.2+r()*.3));}
  else if(L.detail==="fern"){for(let i=0;i<50;i++){const x=r()*BW,y=L.y+15+r()*(BH-L.y-20);D.pasto(g,x,y,12+(y-L.y)*.12,r,[shade(L.col,-.15),shade(L.col,.1)]);}}
 },
 water(g,L){const gr=g.createLinearGradient(0,L.y,0,BH);gr.addColorStop(0,L.col);gr.addColorStop(1,L.col2);g.fillStyle=gr;g.fillRect(0,L.y,BW,BH-L.y);g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=2;const r=RND(9);
  for(let i=0;i<70;i++){const x=r()*BW,y=L.y+8+r()*(BH-L.y-10),w=30+r()*60;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-5,x+w,y);g.stroke();}},
 dunes(g,L){LAY.hills(g,L);},
 fog(g,L){const gr=g.createLinearGradient(0,L.y-L.h,0,L.y+L.h);gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(.5,L.col);gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,L.y-L.h,BW,L.h*2);},
 volcano(g,L){D.volcan(g,640+L.x,L.y,L.h,RND(3));const gr=g.createRadialGradient(640+L.x,L.y-L.h,10,640+L.x,L.y-L.h,L.h*.8);gr.addColorStop(0,"rgba(255,120,40,.5)");gr.addColorStop(1,"rgba(255,120,40,0)");g.fillStyle=gr;g.fillRect(0,0,BW,BH);},
 cave(g,L){const gr=g.createLinearGradient(0,0,0,BH);gr.addColorStop(0,L.c[0]);gr.addColorStop(1,L.c[1]);g.fillStyle=gr;g.fillRect(0,0,BW,BH);const r=RND(4);
  for(let i=0;i<16;i++){const hh=140+r()*180;D.estalactita(g,r()*BW,hh-8,hh,r,L.rock);}
  g.fillStyle=L.rock;g.beginPath();g.moveTo(0,BH);for(let x=0;x<=BW;x+=30)g.lineTo(x,L.y+Math.sin(x/90)*10+Math.sin(x/37)*6);g.lineTo(BW,BH);g.closePath();g.fill();
  for(let i=0;i<9;i++)D.cristal(g,r()*BW,L.y+10+r()*20,60+r()*80,r);}
};
const BG=[
 {id:"pradera",n:"Pradera soleada",tema:"dia",L:[
  {k:"sky",pf:0,c:["#6ec3ee","#bfe6f7","#f4f7dc"],sun:{x:360,y:140,r:46,col:"#ffe27a"},clouds:7},
  {k:"mount",pf:.08,y:470,amp:100,col:"#9db8c9",seed:1,snow:1},{k:"hills",pf:.2,y:515,amp:40,col:"#9bd37a",seed:2},
  {k:"trees",pf:.36,y:540,n:9,size:170,type:"arbol",pal:["#3f9a55","#58b86a"],seed:3},{k:"hills",pf:.6,y:565,amp:24,col:"#7ac85d",seed:4},
  {k:"ground",pf:1,y:590,col:"#6fc15a",col2:"#54a644",detail:"grass",path:"#d8c58a"}]},
 {id:"bosque",n:"Bosque prehistórico",tema:"dia",L:[
  {k:"sky",pf:0,c:["#8fd3c4","#c9ecd0","#eef6c8"],sun:{x:420,y:120,r:40,col:"#fff1a0"},clouds:4},
  {k:"mount",pf:.07,y:450,amp:90,col:"#7fb0a0",seed:5},{k:"fog",pf:.1,y:470,h:70,col:"rgba(255,255,255,.35)"},
  {k:"trees",pf:.22,y:520,n:12,size:300,type:"araucaria",pal:["#2f6a3a","#43864a"],seed:6},
  {k:"trees",pf:.4,y:545,n:10,size:230,type:"helecho",pal:["#2f8f4a","#58b86a"],seed:7},{k:"hills",pf:.62,y:575,amp:20,col:"#3f9a55",seed:8},
  {k:"ground",pf:1,y:595,col:"#4f9e4f",col2:"#397a3d",detail:"fern",path:"#a9936a"}]},
 {id:"selva",n:"Selva valdiviana",tema:"selva",L:[
  {k:"sky",pf:0,c:["#59a89a","#98cfae","#d6ecb8"],sun:{x:300,y:110,r:34,col:"#ffffd0",glow:"rgba(255,255,200,.35)"}},
  {k:"fog",pf:.08,y:420,h:110,col:"rgba(230,250,240,.5)"},{k:"trees",pf:.2,y:500,n:11,size:340,type:"arbol",pal:["#2a7a4a","#3f9a5e"],seed:9},
  {k:"trees",pf:.4,y:540,n:9,size:260,type:"helecho",pal:["#1f7a46","#47b06a"],seed:10},{k:"trees",pf:.58,y:570,n:7,size:120,type:"copihue",seed:11,jy:8},
  {k:"ground",pf:1,y:592,col:"#3d8c4a",col2:"#2a6a3a",detail:"fern",path:"#8a7a52"}]},
 {id:"atacama",n:"Desierto de Atacama",tema:"desierto",L:[
  {k:"sky",pf:0,c:["#7cc4ee","#cfe9f3","#fbe9c4"],sun:{x:500,y:120,r:52,col:"#fff0a0"},clouds:2},
  {k:"mount",pf:.08,y:450,amp:120,col:"#c98d6a",seed:12,flat:1},{k:"mount",pf:.18,y:500,amp:80,col:"#d9a47c",seed:13},
  {k:"dunes",pf:.35,y:540,amp:30,col:"#e8bf86",hi:"#f2d4a4",seed:14},{k:"trees",pf:.5,y:565,n:5,size:200,type:"cactus",seed:15,jy:6},
  {k:"dunes",pf:.7,y:580,amp:18,col:"#e4b475",seed:16},{k:"ground",pf:1,y:598,col:"#e8bf86",col2:"#cf9d5e",detail:"sand"}]},
 {id:"patagonia",n:"Patagonia (montañas y lago)",tema:"frio",L:[
  {k:"sky",pf:0,c:["#7fb3e6","#c4def4","#eef4fa"],sun:{x:200,y:130,r:38,col:"#fff6c8"},clouds:6},
  {k:"mount",pf:.08,y:430,amp:190,col:"#8da4c0",seed:17,snow:1,n:8},{k:"mount",pf:.16,y:470,amp:120,col:"#6f8aa6",seed:18,snow:1},
  {k:"water",pf:.3,y:480,col:"#6fb7d8",col2:"#4f98c0"},{k:"trees",pf:.45,y:500,n:12,size:150,type:"pino",pal:["#2f6a4a","#3e8460"],seed:19},
  {k:"hills",pf:.65,y:570,amp:20,col:"#7aa86a",seed:20},{k:"ground",pf:1,y:595,col:"#86b574",col2:"#648f58",detail:"grass"}]},
 {id:"costa",n:"Costa y mar",tema:"mar",L:[
  {k:"sky",pf:0,c:["#58b4ea","#a9dcf5","#f6f3e0"],sun:{x:450,y:130,r:46,col:"#ffe98a"},clouds:5},
  {k:"water",pf:.05,y:400,col:"#3f9fd8",col2:"#2a84c4"},{k:"mount",pf:.1,y:405,amp:50,col:"#6f9ab8",seed:21,flat:1},
  {k:"dunes",pf:.4,y:520,amp:22,col:"#f1dba4",hi:"#fff0c4",seed:22},{k:"trees",pf:.55,y:555,n:5,size:290,type:"palmera",seed:23,jy:8},
  {k:"ground",pf:1,y:590,col:"#f1dba4",col2:"#dcc084",detail:"sand"}]},
 {id:"volcan",n:"Volcán y lava",tema:"prehi",L:[
  {k:"sky",pf:0,c:["#3a2038","#9a3a3a","#f09a4a"],stars:30},{k:"volcano",pf:.12,x:140,y:520,h:330},
  {k:"mount",pf:.2,y:520,amp:90,col:"#4a2a30",seed:24},{k:"trees",pf:.4,y:555,n:7,size:200,type:"helecho",pal:["#3a5a2a","#5a7a3a"],seed:25},
  {k:"hills",pf:.6,y:575,amp:16,col:"#3a2428",seed:26},{k:"ground",pf:1,y:596,col:"#4a2c2a",col2:"#2e1a1c",detail:"rock"}]},
 {id:"cueva",n:"Cueva de cristales",tema:"cueva",L:[{k:"cave",pf:.1,c:["#2a2640","#4a4468"],rock:"#3a3652",y:600},{k:"ground",pf:1,y:610,col:"#4a4468",col2:"#322e4a",detail:"rock"}]},
 {id:"noche",n:"Noche estrellada",tema:"noche",L:[
  {k:"sky",pf:0,c:["#0e1230","#26306a","#4a5a9a"],stars:220,moon:{x:300,y:120,r:44}},
  {k:"mount",pf:.08,y:470,amp:100,col:"#1c2448",seed:27},{k:"trees",pf:.3,y:540,n:10,size:190,type:"pino",pal:["#142a3a","#1c3a4a"],seed:28},
  {k:"hills",pf:.6,y:570,amp:20,col:"#16283a",seed:29},{k:"ground",pf:1,y:594,col:"#1c3a42",col2:"#102430",detail:"grass"}]},
 {id:"nevado",n:"Nevado",tema:"frio",L:[
  {k:"sky",pf:0,c:["#a9c6e8","#dbe9f6","#f6fafe"],clouds:5,cc:"#ffffffe6"},{k:"mount",pf:.1,y:460,amp:150,col:"#a9bdd6",seed:30,snow:1},
  {k:"trees",pf:.35,y:530,n:11,size:180,type:"pino",pal:["#dfeaf0","#f4f8fc"],seed:31},{k:"hills",pf:.6,y:570,amp:20,col:"#f2f7fc",seed:32},
  {k:"ground",pf:1,y:594,col:"#f4f8fc",col2:"#d6e4f0",detail:"snow"}]}
];
/* capas ya dibujadas (caché por escala) */
const LC={};
function layerCanvas(bg,i,res){
  const key=bg.id+"#"+i+"@"+res;if(LC[key])return LC[key];
  const L=bg.L[i],cv=document.createElement("canvas");cv.width=Math.round(BW*res);cv.height=Math.round(BH*res);
  const g=cv.getContext("2d");g.scale(res,res);LAY[L.k==="mount"&&L.snow?"mount":L.k](g,L);
  const ks=Object.keys(LC);if(ks.length>40){for(const k of ks.slice(0,10))delete LC[k];}
  return LC[key]=cv;
}
function dibujarFondo(g,bg,sx,sy,z,res,cam,tint,uw){
  /* sx = unidades de escena -> píxeles; cam={x,y} en unidades; z zoom; uw = ancho de la escena (1280 horizontal) */
  const cx=(uw||1280)/2;
  for(let i=0;i<bg.L.length;i++){
    const L=bg.L[i],cv=layerCanvas(bg,i,Math.max(.4,Math.min(1.5,sx*z)));
    const pf=L.pf,ox=cx-1280-cam.x*pf,oy=-cam.y*pf*.5;
    g.save();g.translate(cx*sx,360*sy);g.scale(z,z);g.translate(-cx*sx,-360*sy);
    g.drawImage(cv,ox*sx,oy*sy,BW*sx,BH*sy);g.restore();
  }
}
function miniFondo(bg,w,h){const cv=document.createElement("canvas");cv.width=w;cv.height=h;const g=cv.getContext("2d");
  for(let i=0;i<bg.L.length;i++){const c=layerCanvas(bg,i,.5);g.drawImage(c,640*.5,0,1280*.5,720*.5,0,0,w,h);}return cv;}

/* ================= personajes humanos por piezas ================= */
const HUM_BASE={piel:"#f3c9a0",pelo:"#6b4528",camisa:"#4fae64",pantalon:"#b9a46a",zapato:"#5b3a22",pelo_estilo:"corto",gorro:null};
const HUM_PRE={
  nino:{n:"Niño explorador",piel:"#f3c9a0",pelo:"#6b4528",camisa:"#7bbf5a",pantalon:"#b9a46a",zapato:"#5b3a22",pelo_estilo:"corto",gorro:"#d9b878"},
  nina:{n:"Niña aventurera",piel:"#e9b98a",pelo:"#2a1d16",camisa:"#ff7aa5",pantalon:"#4a6fb5",zapato:"#7a3a4a",pelo_estilo:"coletas",gorro:null},
  cientifica:{n:"Científica",piel:"#c98f64",pelo:"#1c1410",camisa:"#f4f4f4",pantalon:"#3a4a6a",zapato:"#2a2a2a",pelo_estilo:"largo",gorro:null},
  abuelo:{n:"Abuelo narrador",piel:"#e8bd96",pelo:"#d8d8d8",camisa:"#b55a3a",pantalon:"#5a5a6a",zapato:"#3a2a22",pelo_estilo:"calvo",gorro:null}
};
function pieza(w,h,fn,ol){const cv=document.createElement("canvas");cv.width=w*2;cv.height=h*2;const g=cv.getContext("2d");g.scale(2,2);fn(g);
  if(!ol)return cv;
  /* contorno suave de dibujo animado */
  const t=document.createElement("canvas");t.width=cv.width;t.height=cv.height;const tg=t.getContext("2d");tg.drawImage(cv,0,0);tg.globalCompositeOperation="source-in";tg.fillStyle="rgba(58,36,28,.7)";tg.fillRect(0,0,t.width,t.height);
  const o=document.createElement("canvas");o.width=cv.width;o.height=cv.height;const og=o.getContext("2d"),r=3;
  for(let k=0;k<12;k++){const an=k/12*Math.PI*2;og.drawImage(t,Math.cos(an)*r,Math.sin(an)*r);}
  og.drawImage(cv,0,0);return o;}
/* bocas: reposo (sonrisa), visemas v1..v4 (a, o, e, s) y expresiones */
function bocas(ox,oy,cx,cy){
  const W=60,Hh=36,mk=fn=>pieza(W,Hh,g=>{g.translate(-ox,-oy);g.lineCap="round";fn(g);});
  const dark="#7a1f2a",tongue="#ff8a98";
  const o={};
  o.rest=mk(g=>{g.strokeStyle="#9a3a3a";g.lineWidth=5;g.beginPath();g.moveTo(cx-22,cy+8);g.quadraticCurveTo(cx,cy+28,cx+22,cy+8);g.stroke();});
  o.v1=mk(g=>{g.fillStyle=dark;g.beginPath();g.ellipse(cx,cy+17,19,16,0,0,TAU);g.fill();g.fillStyle=tongue;g.beginPath();g.ellipse(cx,cy+27,11,6,0,0,TAU);g.fill();g.fillStyle="#fff";g.fillRect(cx-14,cy+3,28,6);});
  o.v2=mk(g=>{g.fillStyle=dark;g.beginPath();g.ellipse(cx,cy+15,9,12,0,0,TAU);g.fill();g.fillStyle=tongue;g.beginPath();g.ellipse(cx,cy+22,5,4,0,0,TAU);g.fill();});
  o.v3=mk(g=>{g.fillStyle=dark;g.beginPath();g.ellipse(cx,cy+13,22,8,0,0,TAU);g.fill();g.fillStyle="#fff";g.fillRect(cx-17,cy+7,34,4);});
  o.v4=mk(g=>{g.fillStyle=dark;g.beginPath();g.ellipse(cx,cy+12,17,4.5,0,0,TAU);g.fill();g.fillStyle="#fff";g.fillRect(cx-14,cy+8,28,3.5);});
  o.e_feliz=mk(g=>{g.fillStyle=dark;g.beginPath();g.moveTo(cx-24,cy+6);g.quadraticCurveTo(cx,cy+40,cx+24,cy+6);g.quadraticCurveTo(cx,cy+12,cx-24,cy+6);g.fill();g.fillStyle="#fff";g.beginPath();g.moveTo(cx-20,cy+8);g.quadraticCurveTo(cx,cy+14,cx+20,cy+8);g.lineTo(cx+18,cy+13);g.quadraticCurveTo(cx,cy+19,cx-18,cy+13);g.fill();});
  o.e_triste=mk(g=>{g.strokeStyle="#9a3a3a";g.lineWidth=5;g.beginPath();g.moveTo(cx-18,cy+20);g.quadraticCurveTo(cx,cy+6,cx+18,cy+20);g.stroke();});
  o.e_sorpresa=mk(g=>{g.fillStyle=dark;g.beginPath();g.ellipse(cx,cy+16,10,14,0,0,TAU);g.fill();});
  o.e_enojo=mk(g=>{g.strokeStyle="#9a3a3a";g.lineWidth=5;g.beginPath();g.moveTo(cx-18,cy+17);g.lineTo(cx-8,cy+13);g.lineTo(cx,cy+18);g.lineTo(cx+8,cy+13);g.lineTo(cx+18,cy+17);g.stroke();});
  return o;
}
function humano(pal){
  const P=Object.assign({},HUM_BASE,pal||{});const skin=P.piel,sk2=shade(skin,-.1);
  const pcs=[];const add=(n,x,y,w,h,pv,m,fn,ex)=>pcs.push(Object.assign({n,x,y,w,h,pv,m:m||{},img:pieza(w,h,g=>{g.translate(-x,-y);fn(g);},!(ex&&(ex.rol==="ojo"||ex.rol==="ceja")))},ex||{}));
  const EXPE={feliz:{sy:.5},sorpresa:{sy:1.2,sx:1.1},triste:{sy:.85},enojo:{sy:.75}};
  for(const [n,x0,ph,lado] of [["pierna_i",128,0,"i"],["pierna_d",182,Math.PI,"d"]])
    add(n,x0-10,360,70,260,[x0+25,385],{aw:.42,pw:ph,lift:[16,ph+Math.PI]},g=>{
      g.fillStyle=P.pantalon;rr(g,x0,365,50,170,12);g.fill();g.fillStyle=shade(P.pantalon,-.12);g.fillRect(x0+34,380,16,150);
      g.fillStyle=skin;g.fillRect(x0+8,525,34,50);g.fillStyle=P.zapato;rr(g,x0-8,568,70,40,16);g.fill();g.fillStyle="#ffffff55";g.fillRect(x0-4,598,62,6);},{rol:"pata",lado});
  add("torso",112,205,136,185,[180,380],{},g=>{g.fillStyle=skin;g.fillRect(168,205,24,26);g.fillStyle=P.camisa;rr(g,116,222,128,160,26);g.fill();g.fillStyle=shade(P.camisa,-.14);g.fillRect(222,236,20,140);
    g.fillStyle=shade(P.camisa,.2);g.beginPath();g.moveTo(168,222);g.lineTo(180,246);g.lineTo(192,222);g.closePath();g.fill();},{rol:"cuerpo"});
  for(const [n,x0,ph,flip,lado] of [["brazo_i",84,Math.PI,1,"i"],["brazo_d",230,0,-1,"d"]])
    add(n,x0-18,208,70,190,[x0+15,230],{aw:.5,pw:ph,ai:.04,pi:flip},g=>{g.fillStyle=skin;rr(g,x0+2,260,26,120,13);g.fill();circ(g,x0+15,386,17,skin);g.fillStyle=P.camisa;rr(g,x0-4,222,38,78,18);g.fill();g.fillStyle=shade(P.camisa,.2);g.fillRect(x0-4,288,38,10);},{rol:"brazo",lado});
  if(P.pelo_estilo==="coletas"){for(const [n,px,py,sg] of [["coleta_i",110,98,1],["coleta_d",250,98,-1]])
    add(n,px-22,py-6,44,90,[px,py],{phys:{r:[0,1],k:48,c:4.2,g:.8,max:.8,w:.35},par:"cabeza"},g=>{g.fillStyle=P.pelo;g.beginPath();g.moveTo(px-10,py);g.quadraticCurveTo(px-22,py+50,px-6,py+80);g.quadraticCurveTo(px,py+88,px+8,py+78);g.quadraticCurveTo(px+22,py+50,px+10,py);g.closePath();g.fill();g.fillStyle="#ff5f9a";circ(g,px,py+2,8,"#ff5f9a");},{rol:"resorte"});}
  add("cabeza",96,22,168,196,[180,208],{ai:.02,pi:1,ta:.035},g=>{
    if(P.pelo_estilo==="largo"){g.fillStyle=P.pelo;rr(g,100,56,160,150,60);g.fill();}
    ell(g,180,124,76,82,skin);ell(g,102,134,13,18,skin);ell(g,258,134,13,18,skin);ell(g,102,134,6,10,sk2);ell(g,258,134,6,10,sk2);
    if(P.pelo_estilo!=="calvo"){g.fillStyle=P.pelo;g.beginPath();g.ellipse(180,86,80,50,0,Math.PI,0);g.fill();g.beginPath();g.moveTo(104,90);g.quadraticCurveTo(110,128,126,110);g.quadraticCurveTo(160,80,204,100);g.quadraticCurveTo(240,92,256,90);g.quadraticCurveTo(250,50,180,40);g.quadraticCurveTo(110,50,104,90);g.fill();}
    else{g.fillStyle="#e0e0e0";g.beginPath();g.ellipse(104,122,10,24,0,0,TAU);g.fill();g.beginPath();g.ellipse(256,122,10,24,0,0,TAU);g.fill();}
    circ(g,126,160,11,"#ff8c8c55");circ(g,234,160,11,"#ff8c8c55");ell(g,180,152,6,5,sk2);
    if(P.gorro){g.fillStyle=P.gorro;g.beginPath();g.ellipse(180,70,100,22,0,0,TAU);g.fill();g.beginPath();g.ellipse(180,64,64,50,0,Math.PI,0);g.fill();g.fillStyle=shade(P.gorro,-.2);g.fillRect(118,62,124,10);}
  },{rol:"cabeza"});
  for(const [n,cx,lado] of [["ojo_i",152,"i"],["ojo_d",208,"d"]])
    add(n,cx-20,126-22,40,44,[cx,126],{blink:1,exp:EXPE,par:"cabeza"},g=>{ell(g,cx,126,15,18,"#fff");circ(g,cx+1,128,10,"#3a2a1c");circ(g,cx+4,123,3.5,"#fff");},{rol:"ojo",lado});
  const bc=P.pelo_estilo==="calvo"?"#bdbdbd":shade(P.pelo,-.1);
  for(const [n,cx,sg] of [["ceja_i",152,1],["ceja_d",208,-1]])
    add(n,cx-24,84,48,26,[cx,100],{par:"cabeza",exp:{feliz:{dy:-5},sorpresa:{dy:-12},triste:{r:-.34*sg,dy:-2},enojo:{r:.4*sg,dy:3}}},g=>{g.strokeStyle=bc;g.lineWidth=5;g.lineCap="round";g.beginPath();g.moveTo(cx-14,100);g.quadraticCurveTo(cx,92,cx+14,100);g.stroke();},{rol:"ceja"});
  const alts=bocas(150,168,180,168);
  const bo=Object.assign({},alts);delete bo.rest;
  pcs.push({n:"boca",x:150,y:168,w:60,h:36,pv:[180,208],img:alts.rest,alts:bo,rol:"boca",m:{par:"cabeza"}});
  const order=["coleta_i","coleta_d","pierna_i","pierna_d","torso","brazo_i","brazo_d","cabeza","ojo_i","ojo_d","ceja_i","ceja_d","boca"];pcs.sort((a,b)=>order.indexOf(a.n)-order.indexOf(b.n));
  const def={w:360,h:640,feet:[180,606],esc:.52,piezas:pcs,bob:10,hum:true,pal:P};
  def.vistas={perfil:humanoPerfil(P)};
  return def;
}
/* vista de perfil (mira a la derecha) */
function humanoPerfil(P){
  const skin=P.piel,sk2=shade(skin,-.1),pcs=[];const add=(n,x,y,w,h,pv,m,fn,ex)=>pcs.push(Object.assign({n,x,y,w,h,pv,m:m||{},img:pieza(w,h,g=>{g.translate(-x,-y);fn(g);},!(ex&&(ex.rol==="ojo"||ex.rol==="ceja")))},ex||{}));
  const EXPE={feliz:{sy:.5},sorpresa:{sy:1.2,sx:1.1},triste:{sy:.85},enojo:{sy:.75}};
  for(const [l,dx,ph,col] of [["i",-8,0,shade(P.pantalon,-.18)],["d",8,Math.PI,P.pantalon]]){
    const x0=164+dx,hx=x0+23;
    add("canilla_"+l,x0-14,450,104,166,[hx,470],{par:"muslo_"+l},g=>{g.fillStyle=col;rr(g,x0,452,46,86,12);g.fill();g.fillStyle=skin;g.fillRect(x0+6,525,34,50);g.fillStyle=P.zapato;g.beginPath();g.moveTo(x0-2,568);g.lineTo(x0+30,568);g.quadraticCurveTo(x0+68,570,x0+70,596);g.lineTo(x0-2,606);g.closePath();g.fill();g.fillStyle="#ffffff55";g.fillRect(x0-2,596,70,5);},{rol:"canilla",lado:l});
    add("muslo_"+l,x0-10,360,66,134,[hx,385],{ik:{shin:"canilla_"+l,foot:[hx,596],phase:ph,bend:1}},g=>{g.fillStyle=col;rr(g,x0,365,46,118,14);g.fill();},{rol:"muslo",lado:l});}
  add("brazo_i",150,208,56,190,[178,232],{aw:.5,pw:Math.PI,ai:.04},g=>{g.fillStyle=shade(skin,-.08);rr(g,166,260,24,120,12);g.fill();circ(g,178,386,15,shade(skin,-.08));g.fillStyle=shade(P.camisa,-.15);rr(g,160,222,36,78,17);g.fill();},{rol:"brazo",lado:"i"});
  add("torso",142,205,98,185,[190,380],{},g=>{g.fillStyle=skin;g.fillRect(180,205,24,26);g.fillStyle=P.camisa;rr(g,146,222,90,160,26);g.fill();g.fillStyle=shade(P.camisa,-.1);g.fillRect(146,360,90,20);},{rol:"cuerpo"});
  add("brazo_d",150,208,56,190,[178,232],{aw:.5,pw:0,ai:.04,pi:1},g=>{g.fillStyle=skin;rr(g,166,260,26,120,13);g.fill();circ(g,179,386,16,skin);g.fillStyle=P.camisa;rr(g,160,222,38,78,18);g.fill();g.fillStyle=shade(P.camisa,.2);g.fillRect(160,288,38,10);},{rol:"brazo",lado:"d"});
  add("cabeza",96,22,176,196,[190,208],{ai:.02,pi:1,ta:.035},g=>{
    if(P.pelo_estilo==="largo"||P.pelo_estilo==="coletas"){g.fillStyle=P.pelo;rr(g,108,56,110,150,48);g.fill();}
    ell(g,184,124,70,82,skin);
    g.fillStyle=skin;g.beginPath();g.moveTo(246,130);g.quadraticCurveTo(272,140,254,160);g.quadraticCurveTo(248,162,244,158);g.closePath();g.fill();
    ell(g,170,136,12,17,skin);ell(g,170,136,6,10,sk2);
    if(P.pelo_estilo!=="calvo"){g.fillStyle=P.pelo;g.beginPath();g.moveTo(110,128);g.quadraticCurveTo(100,60,184,42);g.quadraticCurveTo(250,50,252,96);g.quadraticCurveTo(220,84,190,100);g.quadraticCurveTo(170,92,150,112);g.quadraticCurveTo(134,128,128,150);g.closePath();g.fill();}
    circ(g,222,158,10,"#ff8c8c55");
    if(P.gorro){g.fillStyle=P.gorro;g.beginPath();g.ellipse(184,70,96,20,0,0,TAU);g.fill();g.beginPath();g.ellipse(176,64,60,48,0,Math.PI,0);g.fill();g.fillStyle=shade(P.gorro,-.2);g.fillRect(118,62,116,9);}
  },{rol:"cabeza"});
  add("ojo_d",218-18,124-22,36,44,[220,126],{blink:1,exp:EXPE,par:"cabeza"},g=>{ell(g,220,126,12,17,"#fff");circ(g,225,128,9,"#3a2a1c");circ(g,228,123,3,"#fff");},{rol:"ojo",lado:"d"});
  const bc=P.pelo_estilo==="calvo"?"#bdbdbd":shade(P.pelo,-.1);
  add("ceja_d",196,84,50,26,[220,100],{par:"cabeza",exp:{feliz:{dy:-5},sorpresa:{dy:-12},triste:{r:-.3,dy:-2},enojo:{r:.35,dy:3}}},g=>{g.strokeStyle=bc;g.lineWidth=5;g.lineCap="round";g.beginPath();g.moveTo(206,100);g.quadraticCurveTo(220,92,236,98);g.stroke();},{rol:"ceja"});
  const alts=bocas(196,168,226,168);const bo=Object.assign({},alts);delete bo.rest;
  pcs.push({n:"boca",x:196,y:168,w:60,h:36,pv:[190,208],img:alts.rest,alts:bo,rol:"boca",m:{par:"cabeza"}});
  const order=["canilla_i","muslo_i","brazo_i","torso","canilla_d","muslo_d","cabeza","ojo_d","ceja_d","boca","brazo_d"];pcs.sort((a,b)=>order.indexOf(a.n)-order.indexOf(b.n));
  return {w:360,h:640,feet:[190,606],esc:.52,piezas:pcs,bob:10,hum:true};
}
window.SerieArt={D,SP,CATS,BG,BW,BH,sprite,dibujarFondo,miniFondo,humano,HUM_PRE,HUM_BASE,shade,mix,RND};
})();
