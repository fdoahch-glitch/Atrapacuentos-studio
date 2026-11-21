/* Recursos dibujados en SVG */
(function(root){
"use strict";
const svg=(w,h,body,defs)=>({w,h,src:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+(defs?"<defs>"+defs+"</defs>":"")+body+"</svg>")});
const sky=(top,bot,body)=>svg(960,540,'<rect width="960" height="540" fill="url(#g)"/>'+body,'<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+top+'"/><stop offset="1" stop-color="'+bot+'"/></linearGradient>');
const hills=(c1,c2)=>'<path d="M0 380 Q180 300 400 370 T960 350 V540 H0Z" fill="'+c1+'"/><path d="M0 440 Q250 380 520 440 T960 420 V540 H0Z" fill="'+c2+'"/>';
const stars=Array.from({length:44},(_,i)=>'<circle cx="'+((i*131)%960)+'" cy="'+((i*67)%260+12)+'" r="'+(i%3?1.5:2.6)+'" fill="#fff"/>').join("");
const trunks=[50,230,440,650,870].map(x=>'<rect x="'+x+'" y="130" width="34" height="320" fill="#6b4b2f"/><circle cx="'+(x+17)+'" cy="130" r="72" fill="#3f8a4a"/>').join("");
const grass=(base,top)=>svg(960,140,'<rect width="960" height="140" fill="'+base+'"/><rect width="960" height="16" fill="'+top+'"/>'+Array.from({length:24},(_,i)=>'<path d="M'+(i*40+8)+' 16 l7 -15 l7 15z" fill="'+top+'"/>').join(""));
const A={bg:[],ground:[],char:[],obj:[],mine:[]},ASSET={};
function reg(cat,name,s,extra){const a=Object.assign({id:cat+"_"+name,cat,name,src:s.src,w:s.w,h:s.h},extra||{});A[cat].push(a);ASSET[a.id]=a;return a;}

reg("bg","Día",sky("#7ec8f2","#e3f5ff",'<circle cx="800" cy="110" r="52" fill="#ffd34d"/>'+hills("#9bd16b","#7bbf4f")));
reg("bg","Atardecer",sky("#ff9a5a","#ffe3a8",'<circle cx="480" cy="330" r="80" fill="#fff1b8"/>'+hills("#7a4a6a","#4d2f4f")));
reg("bg","Noche",sky("#0d1b3d","#2c3f7a",stars+'<circle cx="780" cy="100" r="40" fill="#fff6d0"/>'+hills("#1d3a4f","#12293a")));
reg("bg","Bosque",sky("#cfeccf","#8cc98f",trunks+hills("#4f9a5a","#2f7440")));
reg("bg","Cuarto",svg(960,540,'<rect width="960" height="540" fill="#ffe6c7"/><rect y="400" width="960" height="140" fill="#c98e55"/><rect x="620" y="90" width="200" height="160" rx="8" fill="#bfe6ff" stroke="#fff" stroke-width="10"/><path d="M720 90 V250 M620 170 H820" stroke="#fff" stroke-width="8"/>'));
reg("ground","Pasto",grass("#6cbf4a","#8ad45f"));
reg("ground","Arena",grass("#f0d9a0","#f7e8be"));
reg("ground","Nieve",grass("#e9f1fb","#ffffff"));
reg("ground","Tierra",grass("#a8754a","#bd8a5e"));
reg("obj","Árbol",svg(200,280,'<rect x="85" y="150" width="30" height="130" rx="8" fill="#7a5230"/><circle cx="100" cy="100" r="70" fill="#4aa456"/><circle cx="60" cy="130" r="45" fill="#58b862"/><circle cx="142" cy="130" r="48" fill="#58b862"/>'));
reg("obj","Nube",svg(220,120,'<ellipse cx="110" cy="80" rx="95" ry="32" fill="#fff"/><circle cx="75" cy="58" r="38" fill="#fff"/><circle cx="125" cy="48" r="46" fill="#fff"/><circle cx="165" cy="70" r="32" fill="#fff"/>'));
reg("obj","Sol",svg(170,170,Array.from({length:12},(_,i)=>'<rect x="82" y="2" width="6" height="26" rx="3" fill="#ffb627" transform="rotate('+(i*30)+' 85 85)"/>').join("")+'<circle cx="85" cy="85" r="46" fill="#ffd34d"/>'));
reg("obj","Casa",svg(260,240,'<rect x="30" y="100" width="200" height="130" fill="#f3d9a8"/><path d="M10 105 L130 15 L250 105Z" fill="#c4512f"/><rect x="108" y="150" width="46" height="80" rx="4" fill="#7a5230"/><rect x="48" y="130" width="40" height="40" fill="#bfe6ff" stroke="#fff" stroke-width="5"/><rect x="172" y="130" width="40" height="40" fill="#bfe6ff" stroke="#fff" stroke-width="5"/>'));
reg("obj","Flor",svg(100,170,'<rect x="46" y="70" width="8" height="100" fill="#3f9a4a"/><path d="M50 130 Q20 110 22 95 Q45 100 50 130Z" fill="#58b862"/>'+Array.from({length:6},(_,i)=>'<ellipse cx="50" cy="26" rx="14" ry="24" fill="#ff7aa8" transform="rotate('+(i*60)+' 50 52)"/>').join("")+'<circle cx="50" cy="52" r="14" fill="#ffd34d"/>'));
reg("obj","Hongo",svg(140,130,'<rect x="52" y="60" width="36" height="66" rx="14" fill="#f6ead2"/><path d="M8 68 Q70 -22 132 68Z" fill="#d9402f"/><circle cx="40" cy="48" r="8" fill="#fff"/><circle cx="78" cy="34" r="9" fill="#fff"/><circle cx="104" cy="54" r="7" fill="#fff"/>'));
reg("obj","Roca",svg(180,110,'<path d="M8 104 Q4 50 50 28 Q100 0 140 30 Q178 60 172 104Z" fill="#9a9aa5"/><path d="M50 28 Q100 0 140 30 Q100 40 50 28Z" fill="#b8b8c4"/>'));
reg("obj","Luna",svg(120,120,'<circle cx="60" cy="60" r="46" fill="#fff6d0"/><circle cx="44" cy="46" r="8" fill="#eadfae"/><circle cx="76" cy="72" r="11" fill="#eadfae"/>'));
reg("obj","Estrella",svg(110,110,'<path d="M55 6 L68 40 L104 42 L76 64 L86 100 L55 80 L24 100 L34 64 L6 42 L42 40Z" fill="#ffd34d" stroke="#ffb627" stroke-width="4" stroke-linejoin="round"/>'));
reg("obj","Cartel",svg(170,200,'<rect x="76" y="70" width="18" height="130" fill="#7a5230"/><rect x="10" y="10" width="150" height="76" rx="10" fill="#e8b36b" stroke="#7a5230" stroke-width="6"/><path d="M40 48 H116 M100 34 L120 48 L100 62" stroke="#7a5230" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'));
root.A=A;root.ASSET=ASSET;root.reg=reg;
})(window.EST=window.EST||{});
