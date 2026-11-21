/* Biblioteca: personajes con partes (boca real), casas, árboles, ciudad, fondos, paletas e historias */
(function(root){
"use strict";
const {A,ASSET,reg}=root;
for(const c of ["casa","arbol","ciudad"])A[c]=A[c]||[];
const svg=(w,h,body,defs,vb)=>({w,h,src:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(vb||("0 0 "+w+" "+h))+'" width="'+w+'" height="'+h+'">'+(defs?"<defs>"+defs+"</defs>":"")+body+"</svg>")});
function shade(hex,k){
  const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));
  return "#"+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,"0")).join("");
}

/* ================= Animales de cuatro patas ================= */
const SPECIES={
  Zorro:{body:"#e8762c",belly:"#f9dcbc",dark:"#4a2a1a",ear:"point",earIn:"#4a2a1a",snout:"fox",tail:"bushy",tip:"#ffffff",jaw:"#ffffff"},
  Lobo:{body:"#8a8f9a",belly:"#d9dce2",dark:"#3d4350",ear:"point",earIn:"#3d4350",snout:"fox",tail:"wolf",tip:"#3d4350",jaw:"#d9dce2",teeth:1,eye:"#e8b800"},
  Perro:{body:"#c98c4e",belly:"#f3deb9",dark:"#5a3a22",ear:"floppy",earC:"#7a4a28",snout:"med",tail:"dogtail",jaw:"#f3deb9",tongue:1},
  Gato:{body:"#f0a050",belly:"#fbe3c2",dark:"#8a4a1a",ear:"point",earIn:"#f7b6b6",snout:"short",tail:"cat",stripes:1,whisk:1,jaw:"#fbe3c2",nose:"#e0707a"},
  Vaca:{body:"#ffffff",belly:"#f6e6e6",dark:"#2b2b2b",hoof:"#3a3a3a",ear:"cow",earIn:"#f4a6b8",horns:"cow",hornC:"#f3e6c4",snout:"short",tail:"tuft",spots:"#2b2b2b",muzzle:"#f4a6b8",jaw:"#f4a6b8",bw:1.05,bh:1.08},
  Cerdo:{body:"#f6a6b8",belly:"#f9c4d0",dark:"#c4687e",hoof:"#c4687e",ear:"small",earC:"#e88aa0",snout:"pig",tail:"curly",jaw:"#f6a6b8",pigC:"#ee8aa2",legH:58},
  Oveja:{body:"#f2f2f2",belly:"#f2f2f2",dark:"#3b3b3b",hoof:"#3b3b3b",ear:"small",earC:"#3b3b3b",snout:"short",tail:"puff",wool:"#fbfbfb",headC:"#3b3b3b",snoutC:"#3b3b3b",jaw:"#3b3b3b",nose:"#222",legW:18,eyeC:"#fff",pupil:1},
  Conejo:{body:"#e9e2d4",belly:"#ffffff",dark:"#7a6a58",ear:"long",earIn:"#f4b6c0",snout:"short",tail:"puff",tip:"#ffffff",jaw:"#ffffff",nose:"#e0707a",teeth:2,legH:58},
  Oso:{body:"#7a5232",belly:"#a37a52",dark:"#3a2412",ear:"round",earIn:"#a37a52",snout:"short",tail:"puff",snoutC:"#d9b58a",jaw:"#d9b58a",bw:1.08,bh:1.1,legW:28},
  Ciervo:{body:"#b07a46",belly:"#f0dcb8",dark:"#5a3a1a",ear:"point",earIn:"#f0dcb8",horns:"antlers",hornC:"#6b4a2a",snout:"med",tail:"deer",spots:"#fff3dc",jaw:"#f0dcb8",legH:84,legW:18,bw:.92,bh:.9},
  Dinosaurio:{body:"#5fae4a",belly:"#c9e68a",dark:"#2e6a2a",ear:"none",snout:"med",tail:"long",plates:"#e8762c",jaw:"#c9e68a",teeth:1,legH:62,legW:30,bw:1.05,bh:1.1,headW:44,headH:38},
  Caballo:{body:"#9a5a2e",belly:"#c9905a",dark:"#2e1a0e",ear:"point",earIn:"#c9905a",snout:"fox",tail:"bushy",tip:"#2e1a0e",jaw:"#c9905a",legH:92,legW:20,bw:1.05,bh:.95,hoof:"#2e1a0e"},
  Cabra:{body:"#e8e4d8",belly:"#fff",dark:"#6a5a48",ear:"floppy",earC:"#cfc8b4",horns:"antlers",hornC:"#a89878",snout:"med",tail:"deer",jaw:"#fff",legH:70,legW:18},
  Burro:{body:"#8a8f9a",belly:"#d9dce2",dark:"#3d4350",ear:"long",earIn:"#d9dce2",snout:"med",tail:"tuft",jaw:"#d9dce2",legH:64,legW:22,muzzle:"#d9dce2"},
  Elefante:{body:"#8f9bb0",belly:"#b8c2d4",dark:"#4a5568",ear:"cow",earIn:"#f4a6b8",snout:"fox",tail:"tuft",jaw:"#b8c2d4",legH:60,legW:38,bw:1.2,bh:1.2,headW:48,headH:46,snoutS:1.5,snoutC:"#8f9bb0"},
  Triceratops:{body:"#4a9fd8",belly:"#cfe9f7",dark:"#1d5a8a",ear:"none",snout:"short",tail:"long",horns:"tri",hornC:"#f3e6c4",frill:"#e8762c",jaw:"#cfe9f7",legH:60,legW:32,bw:1.1,bh:1.1}
};
const EARS=[["point","Puntudas"],["floppy","Caídas"],["round","Redondas"],["long","Largas"],["cow","De vaca"],["small","Pequeñas"],["none","Sin orejas"]];
const HORNS=[["none","Sin cuernos"],["cow","Cuernos de vaca"],["antlers","Astas"],["tri","Tres cuernos"],["one","Unicornio"],["rhino","De rinoceronte"],["tusk","Colmillos"]];
const TAILS=[["bushy","Peluda"],["wolf","De lobo"],["tuft","Con mechón"],["curly","Enrulada"],["puff","Pompón"],["long","Larga"],["cat","De gato"],["dogtail","De perro"],["deer","Corta"]];
const SNOUTS=[["fox","Larga y fina"],["med","Mediana"],["short","Corta"],["pig","De cerdito"]];
const ACCS=[["none","Ninguno"],["sombrero","Sombrero"],["corona","Corona"],["lentes","Lentes"],["bufanda","Bufanda"],["lazo","Lazo"]];

function quadSvg(p,open){
  const o=p.body,b=p.belly,d=p.dark,hv=p.hoof||d,bw=p.bw||1,bh=p.bh||1,lh=p.legH||66,lw=p.legW||24;
  const hx=320,hy=118,hrx=p.headW||46,hry=p.headH||42;
  const L=({fox:66,med:54,short:38,pig:36}[p.snout]||54)*(p.snoutS||1),tipY={fox:128,med:124,short:114,pig:116}[p.snout]||124;
  const ex=326+L,jawC=p.jaw||b,snoutC=p.snoutC||o,noseC=p.nose||"#222";
  let s="";
  /* cola */
  const tail={
    bushy:'<path d="M118 185 C50 200 10 150 18 80 C60 100 100 120 140 160Z" fill="'+o+'"/>'+(p.tip?'<path d="M18 80 C14 112 26 140 52 160 C62 130 44 100 18 80Z" fill="'+p.tip+'"/>':""),
    wolf:'<path d="M122 176 C70 200 34 196 12 150 C52 152 92 148 142 160Z" fill="'+o+'"/><path d="M12 150 C22 170 34 184 50 192 C40 176 30 164 12 150Z" fill="'+(p.tip||d)+'"/>',
    tuft:'<path d="M124 166 C84 178 72 200 76 236" stroke="'+o+'" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="76" cy="248" rx="9" ry="17" fill="'+d+'"/>',
    curly:'<path d="M122 170 C84 150 70 184 92 188 C110 190 102 166 88 172" stroke="'+(p.pigC||o)+'" stroke-width="8" fill="none" stroke-linecap="round"/>',
    puff:'<circle cx="104" cy="172" r="17" fill="'+(p.tip||o)+'"/>',
    long:'<path d="M130 160 C70 170 30 200 6 238 C52 234 100 226 144 212Z" fill="'+o+'"/>',
    cat:'<path d="M120 182 C60 192 34 132 68 92" stroke="'+o+'" stroke-width="14" fill="none" stroke-linecap="round"/>',
    dogtail:'<path d="M122 168 C82 150 70 112 92 84" stroke="'+o+'" stroke-width="15" fill="none" stroke-linecap="round"/>',
    deer:'<path d="M124 160 L92 148 L112 184Z" fill="#fff3dc"/>'
  }[p.tail]||"";
  s+=tail;
  if(p.wings)s+='<path d="M200 150 C160 70 110 14 30 16 C64 50 74 84 92 118 C124 108 160 114 200 150Z" fill="'+p.wings+'" stroke="'+shade(p.wings,-.25)+'" stroke-width="3"/><path d="M92 118 C98 80 74 46 30 16 M130 112 C130 76 100 40 66 28" stroke="'+shade(p.wings,-.25)+'" stroke-width="3" fill="none" opacity=".6"/>';
  /* placas dinosaurio */
  if(p.plates){for(let i=0;i<6;i++){const x=104+i*28,y=150-Math.sin(i/5*3.1)*16;s+='<path d="M'+x+' '+y+' l12 -34 l12 34Z" fill="'+p.plates+'"/>';}}
  /* patas */
  for(const x of [118,148,232,262]){
    const far=(x===148||x===262);
    s+='<rect x="'+x+'" y="200" width="'+lw+'" height="'+lh+'" rx="'+(lw/2)+'" fill="'+(far?shade(p.wool?d:o,-.14):(p.wool?d:o))+'"/>';
    s+='<rect x="'+x+'" y="'+(200+lh-20)+'" width="'+lw+'" height="22" rx="'+Math.min(10,lw/2)+'" fill="'+(far?shade(hv,-.1):hv)+'"/>';
  }
  /* cuerpo */
  const chestC=p.wool||o;
  if(p.wool){
    for(const [cx,cy,r] of [[112,176,36],[152,152,44],[200,148,48],[248,160,42],[146,198,42],[198,204,46],[246,198,38],[108,200,30]])s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+p.wool+'"/>';
    s+='<path d="M232 165 Q250 112 316 118 L316 210 L226 212Z" fill="'+p.wool+'"/>';
  }else{
    s+='<ellipse cx="195" cy="185" rx="'+(100*bw)+'" ry="'+(54*bh)+'" fill="'+o+'"/>';
    s+='<path d="M232 165 Q250 112 316 118 L316 210 L226 212Z" fill="'+o+'"/>';
    s+='<ellipse cx="205" cy="'+(208*1)+'" rx="'+(72*bw)+'" ry="'+(22*bh)+'" fill="'+b+'"/>';
    const clip='<clipPath id="cb"><ellipse cx="195" cy="185" rx="'+(100*bw)+'" ry="'+(54*bh)+'"/><path d="M232 165 Q250 112 316 118 L316 210 L226 212Z"/></clipPath>';
    if(p.spots)s+=clip+'<g clip-path="url(#cb)" fill="'+p.spots+'">'+[[140,160,30,22],[212,204,34,22],[256,138,24,18],[166,128,20,14],[110,200,22,18],[296,170,16,22]].map(a=>'<ellipse cx="'+a[0]+'" cy="'+a[1]+'" rx="'+a[2]+'" ry="'+a[3]+'"/>').join("")+'</g>';
    if(p.stripes)s+=clip+'<g clip-path="url(#cb)" stroke="'+d+'" stroke-width="9" fill="none" stroke-linecap="round" opacity=".75">'+[130,160,190,220,250].map(x=>'<path d="M'+x+' 128 q10 30 -2 70"/>').join("")+'</g>';
  }
  /* cabeza completa (se puede agrandar) */
  s+='<g transform="translate(300 150) scale('+(p.headS||1)+') translate(-300 -150)">';
  /* orejas / cuernos detrás de la cabeza */
  const earIn=p.earIn||d,earC=p.earC||o;
  if(p.mane)s+='<circle cx="'+(hx-8)+'" cy="'+(hy+8)+'" r="'+((hrx+26)*(p.maneS||1))+'" fill="'+p.mane+'"/><circle cx="'+(hx-8)+'" cy="'+(hy+8)+'" r="'+((hrx+14)*(p.maneS||1))+'" fill="'+shade(p.mane,.18)+'"/>';
  if(p.frill)s+='<ellipse cx="292" cy="100" rx="46" ry="58" fill="'+p.frill+'"/><ellipse cx="292" cy="100" rx="30" ry="40" fill="'+shade(p.frill,.35)+'"/>';
  if(p.horns==="cow")s+='<path d="M298 80 C282 58 276 60 268 42 C292 46 308 60 314 78Z" fill="'+p.hornC+'"/><path d="M326 76 C338 54 346 52 354 40 C330 42 320 58 316 76Z" fill="'+p.hornC+'"/>';
  if(p.horns==="antlers")s+='<path d="M304 82 L296 38 M296 58 L278 44 M300 46 L314 32 M332 78 L340 34 M340 54 L358 44 M336 44 L326 28" stroke="'+p.hornC+'" stroke-width="6" fill="none" stroke-linecap="round"/>';
  const eS=p.earS||1;s+='<g transform="translate(310 86) scale('+eS+') translate(-310 -86)">';
  if(p.ear==="point")s+='<path d="M268 92 L262 30 L308 76Z" fill="'+o+'"/><path d="M272 80 L270 52 L292 74Z" fill="'+earIn+'"/><path d="M300 74 L326 24 L342 86Z" fill="'+o+'"/><path d="M310 76 L324 48 L331 80Z" fill="'+earIn+'"/>';
  if(p.ear==="round")s+='<circle cx="290" cy="82" r="20" fill="'+o+'"/><circle cx="290" cy="84" r="11" fill="'+earIn+'"/><circle cx="338" cy="76" r="20" fill="'+o+'"/><circle cx="338" cy="78" r="11" fill="'+earIn+'"/>';
  if(p.ear==="long")s+='<ellipse cx="292" cy="46" rx="13" ry="50" fill="'+o+'" transform="rotate(-14 292 90)"/><ellipse cx="292" cy="48" rx="6" ry="34" fill="'+earIn+'" transform="rotate(-14 292 90)"/><ellipse cx="328" cy="42" rx="13" ry="50" fill="'+o+'" transform="rotate(10 328 90)"/><ellipse cx="328" cy="46" rx="6" ry="34" fill="'+earIn+'" transform="rotate(10 328 90)"/>';
  if(p.ear==="cow")s+='<ellipse cx="282" cy="98" rx="28" ry="12" fill="'+o+'" transform="rotate(-26 282 98)"/><ellipse cx="282" cy="98" rx="18" ry="6" fill="'+earIn+'" transform="rotate(-26 282 98)"/>';
  if(p.ear==="small")s+='<path d="M296 88 L282 52 L324 76Z" fill="'+earC+'"/><path d="M330 76 L344 46 L356 88Z" fill="'+earC+'"/>';
  s+="</g>";
  /* cabeza */
  s+='<ellipse cx="'+hx+'" cy="'+hy+'" rx="'+hrx+'" ry="'+hry+'" fill="'+(p.headC||o)+'"/>';
  if(p.horns==="one")s+='<path d="M334 86 L372 0 L350 94Z" fill="'+p.hornC+'"/><path d="M341 66 L352 70 M346 50 L358 54 M353 32 L362 36" stroke="'+shade(p.hornC,-.25)+'" stroke-width="3"/>';
  if(p.horns==="tri")s+='<path d="M334 82 L396 62 L342 102Z" fill="'+p.hornC+'"/><path d="M310 84 L360 44 L322 102Z" fill="'+p.hornC+'"/>';
  /* mandíbula inferior y boca */
  const A0=[326,150],ang=24*Math.PI/180;
  const rot=(x,y)=>[A0[0]+(x-A0[0])*Math.cos(ang)-(y-A0[1])*Math.sin(ang),A0[1]+(x-A0[0])*Math.sin(ang)+(y-A0[1])*Math.cos(ang)];
  const jawPath='<path d="M326 150 L'+(ex-8)+' 148 Q'+(ex-12)+' 172 334 174 Q312 172 306 156Z" fill="'+jawC+'"/>';
  if(open){
    const B=[ex-8,148],B2=rot(B[0],B[1]),mid=[(A0[0]+B2[0])/2+4,(A0[1]+B2[1])/2-3];
    s+='<path d="M326 150 L'+B[0]+' '+B[1]+' L'+B2[0].toFixed(1)+' '+B2[1].toFixed(1)+'Z" fill="#7a1f2b"/>';
    s+='<ellipse cx="'+mid[0].toFixed(1)+'" cy="'+mid[1].toFixed(1)+'" rx="'+(L*.34).toFixed(1)+'" ry="7" fill="#e86a7a" transform="rotate(24 '+mid[0].toFixed(1)+' '+mid[1].toFixed(1)+')"/>';
    s+='<g transform="rotate(24 326 150)">'+jawPath+(p.teeth===1?'<path d="M'+(ex-30)+' 160 l5 -10 l5 10Z" fill="#fff"/>':'')+'</g>';
  }else{
    s+=jawPath+'<path d="M'+(ex-4)+' 149 Q'+((ex+326)/2)+' 157 322 153" stroke="'+(p.wool?"#777":d)+'" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }
  /* hocico superior */
  s+='<path d="M290 104 Q340 '+(tipY-16)+' '+ex+' '+tipY+' Q'+(ex+6)+' '+((tipY+146)/2)+' '+(ex-4)+' 147 L326 150 L290 150Z" fill="'+snoutC+'"/>';
  if(p.muzzle)s+='<ellipse cx="'+(ex-6)+'" cy="'+(tipY+14)+'" rx="19" ry="21" fill="'+p.muzzle+'"/><circle cx="'+(ex-12)+'" cy="'+(tipY+14)+'" r="3" fill="#8a4a58"/><circle cx="'+(ex+1)+'" cy="'+(tipY+14)+'" r="3" fill="#8a4a58"/>';
  else if(p.snout==="pig")s+='<ellipse cx="'+(ex-2)+'" cy="'+(tipY+12)+'" rx="15" ry="22" fill="'+(p.pigC||o)+'"/><ellipse cx="'+(ex-2)+'" cy="'+(tipY+12)+'" rx="10" ry="17" fill="'+shade(p.pigC||o,.15)+'"/><ellipse cx="'+(ex-6)+'" cy="'+(tipY+12)+'" rx="2.6" ry="5" fill="'+d+'"/><ellipse cx="'+(ex+3)+'" cy="'+(tipY+12)+'" rx="2.6" ry="5" fill="'+d+'"/>';
  else s+='<ellipse cx="'+(ex-3)+'" cy="'+(tipY+3)+'" rx="8" ry="6.5" fill="'+noseC+'"/>';
  if(p.horns==="rhino")s+='<path d="M'+(ex-34)+' 112 L'+(ex-8)+' 58 L'+(ex-4)+' 114Z" fill="'+p.hornC+'"/>';
  if(p.horns==="tusk")s+='<path d="M'+(ex-40)+' 150 Q'+(ex-14)+' 200 '+(ex+24)+' 166" stroke="'+p.hornC+'" stroke-width="11" fill="none" stroke-linecap="round"/>';
  if(p.horns==="tri")s+='<path d="M'+(ex-16)+' '+(tipY-2)+' L'+(ex+8)+' '+(tipY-34)+' L'+(ex-2)+' '+(tipY+8)+'Z" fill="'+p.hornC+'"/>';
  if(p.teeth===1&&open)for(let x=344;x<ex-10;x+=12)s+='<path d="M'+x+' 148 l5 11 l5 -11Z" fill="#fff"/>';
  if(p.teeth===1&&!open)s+='<path d="M'+(ex-26)+' 148 l4 10 l5 -10Z" fill="#fff"/>';
  if(p.teeth===2)s+='<rect x="'+(ex-22)+'" y="146" width="9" height="'+(open?14:11)+'" rx="2" fill="#fff" stroke="#bbb" stroke-width="1"/>';
  if(p.tongue&&!open)s+='';
  if(p.whisk)s+='<g stroke="#fff" stroke-width="2" opacity=".85"><path d="M'+(ex-10)+' 132 L'+(ex+30)+' 122"/><path d="M'+(ex-10)+' 138 L'+(ex+32)+' 140"/><path d="M'+(ex-14)+' 144 L'+(ex+24)+' 156"/></g>';
  /* orejas caídas delante */
  if(p.ear==="floppy")s+='<g transform="translate(300 86) scale('+eS+') translate(-300 -86)"><path d="M298 84 C262 80 254 132 270 162 C290 152 304 122 304 92Z" fill="'+earC+'"/></g>';
  /* ojo */
  const ex0=hx+16,ey0=hy-14,eS2=p.eyeS||1,md=p.mood||"normal";
  const shut=md==="dormido"||md==="parpadeo";
  const eyeInner=shut?'<path d="M'+(ex0-9)+' '+ey0+' Q'+ex0+' '+(ey0+8)+' '+(ex0+9)+' '+ey0+'" stroke="#222" stroke-width="3.6" fill="none" stroke-linecap="round"/>':(p.pupil?'<circle cx="'+ex0+'" cy="'+ey0+'" r="10" fill="#fff"/><circle cx="'+(ex0+2)+'" cy="'+ey0+'" r="5" fill="#222"/>':'<circle cx="'+ex0+'" cy="'+ey0+'" r="'+(p.eyeC?8:6.8)+'" fill="'+(p.eyeC||"#222")+'"/><circle cx="'+(ex0+(p.eyeC?2:0))+'" cy="'+ey0+'" r="'+(p.eyeC?4:0)+'" fill="#222"/><circle cx="'+(ex0+2)+'" cy="'+(ey0-2)+'" r="2.2" fill="#fff"/>');
  s+='<g transform="translate('+ex0+' '+ey0+') scale('+eS2+') translate('+(-ex0)+' '+(-ey0)+')">'+(md==="sorpresa"&&!shut?'<circle cx="'+ex0+'" cy="'+ey0+'" r="11" fill="#fff" stroke="#222" stroke-width="2.4"/><circle cx="'+(ex0+2)+'" cy="'+ey0+'" r="4.5" fill="#222"/>':eyeInner);
  if(md==="feliz")s+='<path d="M'+(ex0-12)+' '+(ey0-16)+' Q'+ex0+' '+(ey0-24)+' '+(ex0+12)+' '+(ey0-16)+'" stroke="'+d+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
  if(md==="triste")s+='<path d="M'+(ex0-12)+' '+(ey0-12)+' L'+(ex0+10)+' '+(ey0-22)+'" stroke="'+d+'" stroke-width="3.6" stroke-linecap="round"/><path d="M'+(ex0+2)+' '+(ey0+10)+' q-3 8 0 12 q4 -4 0 -12" fill="#7ac0e8"/>';
  if(md==="enojado")s+='<path d="M'+(ex0-14)+' '+(ey0-22)+' L'+(ex0+12)+' '+(ey0-8)+'" stroke="'+d+'" stroke-width="4.4" stroke-linecap="round"/>';
  if(md==="sorpresa")s+='<path d="M'+(ex0-12)+' '+(ey0-24)+' Q'+ex0+' '+(ey0-34)+' '+(ex0+12)+' '+(ey0-24)+'" stroke="'+d+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
  s+='</g>';
  if(p.cheek)s+='<circle cx="'+(hx+12)+'" cy="'+(hy+14)+'" r="9" fill="'+p.cheek+'" opacity=".6"/>';
  /* accesorios */
  const acc=p.acc;
  if(acc==="sombrero")s+='<ellipse cx="316" cy="78" rx="58" ry="11" fill="#e0b45a"/><path d="M284 76 Q290 36 316 34 Q344 36 348 76Z" fill="#edc872"/><rect x="286" y="64" width="62" height="9" fill="#c4512f"/>';
  if(acc==="corona")s+='<path d="M292 80 L296 48 L310 64 L320 42 L330 64 L344 48 L348 80Z" fill="#ffd34d" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/>';
  if(acc==="lentes")s+='<circle cx="'+ex0+'" cy="'+ey0+'" r="16" fill="#bfe6ff" fill-opacity=".45" stroke="#333" stroke-width="4"/><path d="M'+(ex0-16)+' '+(ey0-2)+' L'+(hx-34)+' '+(hy-24)+'" stroke="#333" stroke-width="4" stroke-linecap="round"/>';
  if(acc==="bufanda")s+='<path d="M234 152 Q276 180 320 150 L324 174 Q276 202 230 176Z" fill="#d9402f"/><path d="M246 172 l10 42 l22 -8 l-8 -36z" fill="#b32d1f"/>';
  if(acc==="lazo")s+='<path d="M272 164 L244 146 L244 182Z" fill="#ff7aa8"/><path d="M272 164 L300 146 L300 182Z" fill="#ff7aa8"/><circle cx="272" cy="164" r="9" fill="#e0457f"/>';
  s+="</g>";
  return svg(480,370,s,null,"-20 -50 480 370");
}

/* ================= Personas ================= */
const HAIRS=[["corto","Corto"],["largo","Largo"],["trenzas","Trenzas"],["rulos","Rulos"],["calvo","Sin pelo"]];
const PACCS=[["none","Ninguno"],["sombrero","Sombrero"],["corona","Corona"],["lentes","Lentes"],["capucha","Capucha"],["bruja","Sombrero de bruja"],["pirata","Pirata"],["alas","Alas de hada"],["antena","Antena de robot"],["gnomo","Gorro de gnomo"]];
const MOODS=[["normal","Normal"],["feliz","Feliz"],["triste","Triste"],["enojado","Enojado"],["sorpresa","Sorprendido"],["dormido","Dormido"]];
function personSvg(p,open){
  const sk=p.skin,hr=p.hair,sh=p.shirt,pa=p.pants,so=p.shoes||"#4a3a2a";
  const e=p.legL||0,hs=p.headS||1,es=p.eyeS||1,bw=p.bodyW||1;
  const hg=c=>'<g transform="translate(100 92) scale('+hs+') translate(-100 -92)">'+c+'</g>';
  let s="";
  let back=p.hairStyle==="largo"?'<path d="M56 56 Q54 6 100 6 Q146 6 144 56 L150 150 Q100 166 50 150Z" fill="'+hr+'"/>':"";
  if(p.hairStyle==="trenzas")back+='<path d="M58 70 Q40 110 52 150" stroke="'+hr+'" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M142 70 Q160 110 148 150" stroke="'+hr+'" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="52" cy="152" r="9" fill="#ff7aa8"/><circle cx="148" cy="152" r="9" fill="#ff7aa8"/>';
  if(p.acc==="alas")s+='<path d="M58 118 Q-6 70 14 140 Q22 182 62 168Z" fill="#fff" fill-opacity=".85" stroke="#9fd8ff" stroke-width="3"/><path d="M142 118 Q206 70 186 140 Q178 182 138 168Z" fill="#fff" fill-opacity=".85" stroke="#9fd8ff" stroke-width="3"/>';
  s+=hg(back);
  if(p.capeC)s+='<path d="M48 104 Q100 90 152 104 L166 200 L34 200Z" fill="'+p.capeC+'"/>';
  /* piernas */
  if(p.skirt){
    s+='<rect x="72" y="224" width="22" height="'+(46+e)+'" rx="9" fill="'+sk+'"/><rect x="106" y="224" width="22" height="'+(46+e)+'" rx="9" fill="'+sk+'"/>';
    s+='<ellipse cx="83" cy="'+(276+e)+'" rx="17" ry="9" fill="'+so+'"/><ellipse cx="117" cy="'+(276+e)+'" rx="17" ry="9" fill="'+so+'"/>';
    s+='<path d="M58 178 L142 178 L160 238 L40 238Z" fill="'+pa+'"/>';
  }else{
    s+='<rect x="68" y="178" width="28" height="'+(92+e)+'" rx="11" fill="'+pa+'"/><rect x="104" y="178" width="28" height="'+(92+e)+'" rx="11" fill="'+pa+'"/>';
    s+='<ellipse cx="82" cy="'+(277+e)+'" rx="19" ry="9" fill="'+so+'"/><ellipse cx="118" cy="'+(277+e)+'" rx="19" ry="9" fill="'+so+'"/>';
  }
  /* brazos y torso */
  let t='<path d="M66 118 L44 178" stroke="'+sh+'" stroke-width="20" stroke-linecap="round"/><path d="M134 118 L156 178" stroke="'+sh+'" stroke-width="20" stroke-linecap="round"/><circle cx="43" cy="186" r="11" fill="'+sk+'"/><circle cx="157" cy="186" r="11" fill="'+sk+'"/>';
  t+='<rect x="88" y="92" width="24" height="22" fill="'+sk+'"/><path d="M62 112 Q100 100 138 112 L144 190 L56 190Z" fill="'+sh+'"/>';
  s+='<g transform="translate(100 0) scale('+bw+' 1) translate(-100 0)">'+t+'</g>';
  /* cabeza */
  let h='<circle cx="100" cy="58" r="40" fill="'+sk+'"/>';
  if(p.hairStyle!=="calvo"){
    h+='<path d="M60 56 Q56 12 100 12 Q144 12 140 56 Q130 34 100 34 Q70 34 60 56Z" fill="'+hr+'"/>';
    if(p.hairStyle==="rulos")for(const [cx,cy] of [[64,34],[80,20],[100,14],[120,20],[136,34],[58,54],[142,54]])h+='<circle cx="'+cx+'" cy="'+cy+'" r="14" fill="'+hr+'"/>';
  }
  const md=p.mood||"normal",shut=md==="dormido"||md==="parpadeo",brow=(a,b,c,d2)=>'<path d="M'+a+' '+b+' L'+c+' '+d2+'" stroke="'+hr+'" stroke-width="3.6" stroke-linecap="round"/>';
  let eyes=shut?'<path d="M80 60 Q86 66 92 60 M108 60 Q114 66 120 60" stroke="#222" stroke-width="3.4" fill="none" stroke-linecap="round"/>':(md==="sorpresa"?'<circle cx="86" cy="60" r="8.5" fill="#fff" stroke="#222" stroke-width="2.2"/><circle cx="114" cy="60" r="8.5" fill="#fff" stroke="#222" stroke-width="2.2"/><circle cx="86" cy="60" r="3.6" fill="#222"/><circle cx="114" cy="60" r="3.6" fill="#222"/>':'<circle cx="86" cy="60" r="5.2" fill="#222"/><circle cx="114" cy="60" r="5.2" fill="#222"/><circle cx="87.6" cy="58.4" r="1.8" fill="#fff"/><circle cx="115.6" cy="58.4" r="1.8" fill="#fff"/>');
  if(md==="feliz")eyes+='<path d="M78 46 Q86 40 94 46 M106 46 Q114 40 122 46" stroke="'+hr+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
  if(md==="triste"){eyes+=brow(78,50,94,44)+brow(122,50,106,44)+'<path d="M80 70 q-3 8 0 12 q4 -4 0 -12" fill="#7ac0e8"/>';}
  if(md==="enojado")eyes+=brow(78,44,94,52)+brow(122,44,106,52);
  if(md==="sorpresa")eyes+='<path d="M78 44 Q86 36 94 44 M106 44 Q114 36 122 44" stroke="'+hr+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
  h+='<g transform="translate(100 60) scale('+es+') translate(-100 -60)">'+eyes+'</g>';
  h+='<circle cx="76" cy="74" r="7" fill="#ff8a8a" opacity=".45"/><circle cx="124" cy="74" r="7" fill="#ff8a8a" opacity=".45"/>';
  h+='<path d="M99 66 q3 6 0 8" stroke="'+shade(sk,-.25)+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  const mouthShut={normal:'M88 82 Q100 91 112 82',feliz:'M82 80 Q100 100 118 80 Z',triste:'M88 90 Q100 78 112 90',enojado:'M90 86 H110',sorpresa:'',dormido:'M92 84 Q100 88 108 84',parpadeo:'M88 82 Q100 91 112 82'}[md]||'M88 82 Q100 91 112 82';
  h+=open?'<ellipse cx="100" cy="86" rx="12" ry="11" fill="#7a1f2b"/><ellipse cx="100" cy="92" rx="7" ry="4" fill="#e86a7a"/><rect x="92" y="76" width="16" height="5" rx="2" fill="#fff"/>':(md==="sorpresa"?'<ellipse cx="100" cy="86" rx="7" ry="9" fill="#7a1f2b"/>':md==="feliz"?'<path d="'+mouthShut+'" fill="#7a1f2b" stroke="#7a3030" stroke-width="3" stroke-linejoin="round"/>':'<path d="'+mouthShut+'" stroke="#7a3030" stroke-width="3.4" fill="none" stroke-linecap="round"/>');
  if(p.beard)h+='<path d="M64 70 Q70 118 100 124 Q130 118 136 70 Q120 96 100 96 Q80 96 64 70Z" fill="'+p.beard+'"/>'+(open?'<ellipse cx="100" cy="90" rx="10" ry="9" fill="#7a1f2b"/>':'');
  if(p.acc==="sombrero")h+='<ellipse cx="100" cy="26" rx="58" ry="11" fill="#e0b45a"/><path d="M68 24 Q72 -12 100 -12 Q128 -12 132 24Z" fill="#edc872"/><rect x="69" y="12" width="62" height="9" fill="#c4512f"/>';
  if(p.acc==="corona")h+='<path d="M70 28 L72 0 L88 14 L100 -6 L112 14 L128 0 L130 28Z" fill="#ffd34d" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/>';
  if(p.acc==="lentes")h+='<circle cx="86" cy="60" r="14" fill="#bfe6ff" fill-opacity=".4" stroke="#333" stroke-width="4"/><circle cx="114" cy="60" r="14" fill="#bfe6ff" fill-opacity=".4" stroke="#333" stroke-width="4"/>';
  if(p.acc==="gnomo")h+='<path d="M62 30 Q70 -10 108 -50 Q126 -6 138 30Z" fill="#d9402f"/><path d="M62 30 Q100 40 138 30 L138 22 Q100 32 62 22Z" fill="#fff"/>';
  if(p.acc==="bruja")h+='<ellipse cx="100" cy="26" rx="62" ry="10" fill="#2b2233"/><path d="M66 24 Q90 -10 112 -64 Q124 -10 134 24Z" fill="#3a2d4a"/><rect x="68" y="12" width="64" height="9" fill="#c86bd6"/>';
  if(p.acc==="pirata")h+='<path d="M52 28 Q100 -26 148 28 Q100 12 52 28Z" fill="#2b2b2b"/><circle cx="100" cy="6" r="8" fill="#fff"/><path d="M95 2 l10 8 M105 2 l-10 8" stroke="#2b2b2b" stroke-width="2.4"/><rect x="74" y="52" width="24" height="18" rx="6" fill="#2b2b2b"/><path d="M62 46 L112 52" stroke="#2b2b2b" stroke-width="3"/>';
  if(p.acc==="antena")h+='<path d="M100 20 V-6" stroke="#666" stroke-width="5"/><circle cx="100" cy="-10" r="8" fill="#e8402f"/><rect x="62" y="54" width="14" height="14" rx="3" fill="#889"/><rect x="124" y="54" width="14" height="14" rx="3" fill="#889"/>';
  if(p.acc==="capucha")h+='<path d="M54 74 Q48 2 100 2 Q152 2 146 74 Q132 30 100 32 Q68 30 54 74Z" fill="'+(p.capeC||"#d9402f")+'"/>';
  s+=hg(h);
  return svg(260,360+e,s,null,"-30 -40 260 "+(360+e));
}
const PERSONS={
  "Niña":{skin:"#f1c9a0",hair:"#5a3a22",shirt:"#ff7aa8",pants:"#6a5acd",hairStyle:"trenzas",skirt:1},
  "Niño":{skin:"#e8b98a",hair:"#2f2118",shirt:"#4a9fd8",pants:"#3d5a80",hairStyle:"corto"},
  "Princesa":{skin:"#f6d5b5",hair:"#e8c04a",shirt:"#c86bd6",pants:"#e48ae8",hairStyle:"largo",skirt:1,acc:"corona"},
  "Caperucita":{skin:"#f1c9a0",hair:"#7a4a28",shirt:"#d9402f",pants:"#fff3dc",hairStyle:"corto",skirt:1,acc:"capucha",capeC:"#d9402f"},
  "Bruja":{skin:"#9fd08a",hair:"#2b2233",shirt:"#4a3a6a",pants:"#2b2233",hairStyle:"largo",skirt:1,acc:"bruja",shoes:"#2b2233"},
  "Rey":{skin:"#f1c9a0",hair:"#8a8f9a",shirt:"#c4402f",pants:"#6a3aa0",hairStyle:"corto",acc:"corona",capeC:"#9a2a2a",beard:"#8a8f9a"},
  "Hada":{skin:"#f6d5b5",hair:"#ff9ad0",shirt:"#8ad4ff",pants:"#c8a0ff",hairStyle:"rulos",skirt:1,acc:"alas"},
  "Robot":{skin:"#b8c4d0",hair:"#889",shirt:"#7a8aa8",pants:"#5a6a88",hairStyle:"calvo",acc:"antena",shoes:"#444"},
  "Pirata":{skin:"#e8b98a",hair:"#2f2118",shirt:"#e8e0d0",pants:"#3a3a52",hairStyle:"largo",acc:"pirata",beard:"#2f2118"},
  "Abuela":{skin:"#f1c9a0",hair:"#d9dce2",shirt:"#b8553f",pants:"#6a5a7a",hairStyle:"rulos",skirt:1,acc:"lentes"},
  "Abuelo":{skin:"#e8b98a",hair:"#d9dce2",shirt:"#4a7a5a",pants:"#5a4a3a",hairStyle:"calvo",acc:"lentes",beard:"#d9dce2"}
};

/* ================= Registro de personajes ================= */
const PAL={
  fur:["#e8762c","#c98c4e","#7a5232","#8a8f9a","#f2f2f2","#2b2b2b","#f6a6b8","#f0a050","#5fae4a","#4a9fd8","#c86bd6","#ffd34d"],
  skin:["#fbe0c8","#f1c9a0","#e8b98a","#c68a5a","#8a5a3a","#5a3a24"],
  hair:["#2f2118","#5a3a22","#a0602a","#e8c04a","#d9402f","#8a8f9a","#4a9fd8","#c86bd6"],
  cloth:["#d9402f","#ff7aa8","#ffd34d","#5fae4a","#4a9fd8","#6a5acd","#ffffff","#2b2b2b"]
};
const CHAR_ORDER=["Zorro","Vaca","Cerdo","Lobo","Perro","Gato","Conejo","Oveja","Oso","Ciervo","Caballo","Cabra","Burro","Elefante","Dinosaurio","Triceratops"];
function makeChar(kind,key,p){
  const f=kind==="quad"?quadSvg:personSvg;
  const c=f(p,false),o=f(p,true);
  return {c,o};
}
for(const k of CHAR_ORDER){
  const p=Object.assign({acc:"none"},SPECIES[k]);
  const {c,o}=makeChar("quad",k,p);
  reg("char",k,c,{alt:o.src,lib:{kind:"quad",sp:k,p},tpl:"cuadrupedo",size:k==="Dinosaurio"||k==="Triceratops"?400:(k==="Conejo"||k==="Gato"?280:340)});
}
for(const k of Object.keys(PERSONS)){
  const p=Object.assign({acc:"none"},PERSONS[k]);
  const {c,o}=makeChar("person",k,p);
  reg("char",k,c,{alt:o.src,lib:{kind:"person",sp:k,p},tpl:"persona",size:300});
}

/* ================= Criaturas pequeñas (sin esqueleto) ================= */
function creatureSvg(k,open){
  const eye=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff"/><circle cx="'+(x+r*.2)+'" cy="'+y+'" r="'+(r*.5)+'" fill="#222"/>';
  if(k==="Pato")return svg(220,200,'<ellipse cx="96" cy="130" rx="74" ry="50" fill="#ffd34d"/><path d="M30 118 Q8 96 14 78 Q40 90 46 112Z" fill="#f0b82a"/><path d="M70 130 Q100 96 128 138 Q100 154 70 130Z" fill="#f0b82a"/><circle cx="148" cy="70" r="38" fill="#ffd34d"/>'+eye(160,62,8)+(open?'<path d="M178 74 Q210 70 214 84 L180 90Z" fill="#f08a2a"/><path d="M178 92 Q206 98 208 108 Q190 112 178 100Z" fill="#c8601a"/>':'<path d="M178 72 Q212 74 214 88 Q196 98 176 90Z" fill="#f08a2a"/>')+'<path d="M78 178 l-8 18 h24 M118 178 l-8 18 h24" stroke="#f08a2a" stroke-width="8" fill="none" stroke-linecap="round"/>');
  if(k==="Pollito")return svg(180,190,'<circle cx="90" cy="112" r="64" fill="#ffe060"/><circle cx="106" cy="52" r="34" fill="#ffe060"/><path d="M96 20 q4 -14 10 0 M110 18 q6 -12 10 2" stroke="#f0b82a" stroke-width="5" fill="none" stroke-linecap="round"/>'+eye(118,48,7)+(open?'<path d="M136 56 L162 54 L138 62Z" fill="#f08a2a"/><path d="M136 64 L158 70 L138 72Z" fill="#c8601a"/>':'<path d="M134 54 L160 62 L134 70Z" fill="#f08a2a"/>')+'<path d="M32 108 Q10 90 22 70 Q44 84 48 104Z" fill="#f0c840"/><path d="M76 176 v12 M104 176 v12" stroke="#f08a2a" stroke-width="7" stroke-linecap="round"/><circle cx="108" cy="70" r="6" fill="#ff9aa0" opacity=".6"/>');
  if(k==="Búho")return svg(180,210,'<ellipse cx="90" cy="120" rx="64" ry="78" fill="#8a6a4a"/><ellipse cx="90" cy="140" rx="40" ry="50" fill="#d9b88a"/><path d="M38 60 L30 30 L62 48Z M142 60 L150 30 L118 48Z" fill="#6a4a2e"/><circle cx="66" cy="80" r="24" fill="#fff3dc"/><circle cx="114" cy="80" r="24" fill="#fff3dc"/><circle cx="70" cy="82" r="11" fill="#222"/><circle cx="110" cy="82" r="11" fill="#222"/><circle cx="73" cy="78" r="3.4" fill="#fff"/><circle cx="113" cy="78" r="3.4" fill="#fff"/>'+(open?'<path d="M78 102 L102 102 L90 130Z" fill="#f0a830"/><path d="M82 118 H98" stroke="#7a1f2b" stroke-width="4"/>':'<path d="M80 100 L100 100 L90 120Z" fill="#f0a830"/>')+'<path d="M20 120 Q4 160 32 180 Q44 150 44 120Z M160 120 Q176 160 148 180 Q136 150 136 120Z" fill="#6a4a2e"/><path d="M68 192 l-6 14 M112 192 l6 14" stroke="#f0a830" stroke-width="7" stroke-linecap="round"/>');
  if(k==="Rana")return svg(210,170,'<ellipse cx="105" cy="112" rx="82" ry="52" fill="#5fcf4a"/><ellipse cx="105" cy="132" rx="52" ry="30" fill="#c9f08a"/><circle cx="58" cy="60" r="26" fill="#5fcf4a"/><circle cx="152" cy="60" r="26" fill="#5fcf4a"/>'+eye(58,58,15)+eye(152,58,15)+(open?'<path d="M62 104 Q105 150 148 104 Q105 120 62 104Z" fill="#7a1f2b"/><ellipse cx="105" cy="122" rx="20" ry="8" fill="#e86a7a"/>':'<path d="M58 104 Q105 126 152 104" stroke="#2e7a28" stroke-width="5" fill="none" stroke-linecap="round"/>')+'<path d="M24 150 Q4 168 34 168 Q48 160 44 148Z M186 150 Q206 168 176 168 Q162 160 166 148Z" fill="#4ab83a"/><circle cx="46" cy="96" r="7" fill="#ff9aa0" opacity=".5"/><circle cx="164" cy="96" r="7" fill="#ff9aa0" opacity=".5"/>');
  if(k==="Pez")return svg(220,150,'<path d="M170 76 L214 40 Q204 76 214 112Z" fill="#f08a2a"/><ellipse cx="96" cy="76" rx="84" ry="56" fill="#ff9a3c"/><path d="M70 34 Q92 6 120 30 Q100 40 70 34Z" fill="#f08a2a"/><path d="M60 40 Q50 76 60 112 M96 24 Q84 76 96 128" stroke="#fff" stroke-width="10" fill="none" opacity=".8"/>'+eye(34,64,10)+(open?'<ellipse cx="14" cy="86" rx="9" ry="12" fill="#7a1f2b"/>':'<path d="M8 84 Q16 92 26 84" stroke="#a8501a" stroke-width="4" fill="none" stroke-linecap="round"/>')+'<path d="M100 96 Q116 128 140 118 Q124 100 100 96Z" fill="#f08a2a"/>');
  if(k==="Abeja")return svg(200,170,'<ellipse cx="66" cy="50" rx="30" ry="40" fill="#bfe6ff" fill-opacity=".8" transform="rotate(-24 66 50)"/><ellipse cx="108" cy="46" rx="30" ry="40" fill="#bfe6ff" fill-opacity=".8" transform="rotate(20 108 46)"/><ellipse cx="86" cy="104" rx="64" ry="44" fill="#ffd34d"/><path d="M62 64 Q50 104 62 144 M92 62 Q82 104 92 146 M120 66 Q112 104 120 142" stroke="#2b2b2b" stroke-width="14" fill="none"/><circle cx="144" cy="92" r="28" fill="#2b2b2b"/>'+eye(152,86,8)+(open?'<ellipse cx="160" cy="106" rx="8" ry="9" fill="#e8402f"/>':'<path d="M150 106 Q158 112 166 104" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>')+'<path d="M140 68 q-8 -22 -18 -26 M152 66 q4 -22 -2 -30" stroke="#2b2b2b" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M24 104 L4 110 L24 118Z" fill="#2b2b2b"/>');
  return svg(100,100,"");
}
for(const [k,sz] of [["Pato",230],["Pollito",190],["Búho",220],["Rana",200],["Pez",210],["Abeja",190]]){
  const c=creatureSvg(k,false),o=creatureSvg(k,true);
  reg("char",k,c,{alt:o.src,size:sz});
}
/* vuelve a dibujar un personaje con parámetros nuevos */
function redraw(lib){
  const f=lib.kind==="quad"?quadSvg:personSvg;
  const a=f(lib.p,false),o=f(lib.p,true);
  return {src:a.src,alt:o.src,w:a.w,h:a.h};
}

/* ================= Plantas, casas y objetos ================= */
const trunk=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(w/3)+'" fill="'+(c||"#7a5230")+'"/>';
reg("arbol","Roble",svg(220,300,trunk(94,150,32,150)+'<circle cx="110" cy="100" r="76" fill="#3f9a4a"/><circle cx="66" cy="136" r="50" fill="#4aa456"/><circle cx="156" cy="136" r="52" fill="#4aa456"/><circle cx="96" cy="76" r="30" fill="#58b862" opacity=".7"/>'));
reg("arbol","Pino",svg(180,300,trunk(80,230,20,70)+'<path d="M90 10 L150 100 H118 L162 170 H124 L172 236 H8 L56 170 H18 L62 100 H30Z" fill="#2f7a46"/><path d="M90 10 L120 56 H60Z" fill="#3f9a5a"/>'));
reg("arbol","Palmera",svg(220,300,'<path d="M98 300 C90 230 102 170 110 120 L126 122 C120 176 114 240 120 300Z" fill="#9a6b3a"/>'+[-70,-38,0,38,70].map((a,i)=>'<g transform="rotate('+a+' 116 122)"><path d="M116 122 C100 70 106 28 116 4 C128 28 134 70 116 122Z" fill="'+(i%2?"#3f9a4a":"#4aa456")+'" stroke="#2f7a46" stroke-width="3"/></g>').join("")+'<circle cx="106" cy="130" r="9" fill="#7a5230"/><circle cx="126" cy="132" r="9" fill="#7a5230"/>'));
reg("arbol","Árbol de otoño",svg(220,300,trunk(94,150,32,150)+'<circle cx="110" cy="100" r="76" fill="#e8762c"/><circle cx="66" cy="136" r="50" fill="#d9402f"/><circle cx="156" cy="136" r="52" fill="#f0a830"/><circle cx="96" cy="76" r="30" fill="#ffd34d" opacity=".6"/>'));
reg("arbol","Árbol seco",svg(200,280,'<path d="M92 280 L96 150 L70 100 M96 150 L130 92 L150 60 M112 116 L84 70 M70 100 L46 90" stroke="#6b4b2f" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'));
reg("arbol","Arbusto",svg(180,110,'<circle cx="50" cy="70" r="40" fill="#3f9a4a"/><circle cx="96" cy="58" r="48" fill="#4aa456"/><circle cx="134" cy="76" r="34" fill="#3f9a4a"/><circle cx="110" cy="48" r="10" fill="#e8402f"/><circle cx="64" cy="58" r="8" fill="#e8402f"/>'));
reg("arbol","Tocón",svg(130,90,'<path d="M10 80 Q8 30 24 24 H106 Q122 30 120 80Z" fill="#8a5a30"/><ellipse cx="65" cy="26" rx="42" ry="14" fill="#d9a066"/><ellipse cx="65" cy="26" rx="26" ry="8" fill="none" stroke="#a8743c" stroke-width="3"/>'));
reg("arbol","Helecho",svg(170,150,[-62,-34,-10,14,38,62].map((a,i)=>'<g transform="rotate('+a+' 85 146)"><path d="M85 146 C66 100 70 50 85 12 C100 50 104 100 85 146Z" fill="'+(i%2?"#3f9a4a":"#4aa456")+'" stroke="#2f7a46" stroke-width="2"/><path d="M85 140 V24" stroke="#2f7a46" stroke-width="2"/></g>').join("")));
reg("arbol","Cactus",svg(120,200,'<rect x="44" y="20" width="32" height="178" rx="16" fill="#4aa456"/><path d="M44 110 H20 V70" stroke="#4aa456" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M76 130 H100 V84" stroke="#4aa456" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="22" r="8" fill="#ff7aa8"/>'));
reg("arbol","Pasto alto",svg(200,90,Array.from({length:14},(_,i)=>'<path d="M'+(i*14+6)+' 90 Q'+(i*14+(i%2?-4:12))+' 40 '+(i*14+(i%3?2:14))+' '+(12+(i%4)*10)+' Q'+(i*14+14)+' 50 '+(i*14+16)+' 90Z" fill="'+(i%2?"#4aa456":"#3f9a4a")+'"/>').join("")));

/* casas */
const win=(x,y,s)=>'<rect x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" fill="#bfe6ff" stroke="#fff" stroke-width="5"/>';
const door='<rect x="108" y="156" width="46" height="84" rx="5" fill="#7a5230"/><circle cx="144" cy="200" r="3.5" fill="#ffd34d"/>';
reg("casa","Casa de paja",svg(280,250,'<rect x="36" y="110" width="208" height="130" fill="#e8c860"/>'+Array.from({length:12},(_,i)=>'<path d="M'+(36+i*17.5)+' 110 v130" stroke="#c9a640" stroke-width="3"/>').join("")+'<path d="M6 118 L140 14 L274 118Z" fill="#d9a830"/><path d="M6 118 L140 14 L274 118" stroke="#b88a20" stroke-width="5" fill="none" stroke-linejoin="round"/>'+Array.from({length:7},(_,i)=>'<path d="M'+(30+i*32)+' 112 L'+(140+(i-3)*8)+' 30" stroke="#b88a20" stroke-width="3"/>').join("")+door+win(54,138,40)+win(188,138,40)));
reg("casa","Casa de madera",svg(280,250,'<rect x="36" y="110" width="208" height="130" fill="#b87a42"/>'+Array.from({length:9},(_,i)=>'<path d="M36 '+(110+i*15)+' h208" stroke="#8a5a2c" stroke-width="3"/>').join("")+'<path d="M12 116 L140 22 L268 116Z" fill="#7a4a28"/>'+door+win(54,138,40)+win(188,138,40)+'<rect x="196" y="40" width="22" height="46" fill="#8a5a2c"/>'));
reg("casa","Casa de ladrillos",svg(280,250,'<rect x="36" y="110" width="208" height="130" fill="#c4512f"/>'+Array.from({length:9},(_,r)=>'<path d="M36 '+(110+r*14.5)+' h208" stroke="#8a3a22" stroke-width="2"/>'+Array.from({length:7},(_,c)=>'<path d="M'+(36+c*30+(r%2?15:0))+' '+(110+r*14.5)+' v14.5" stroke="#8a3a22" stroke-width="2"/>').join("")).join("")+'<path d="M8 116 L140 18 L272 116Z" fill="#5a3a2a"/>'+door+win(54,138,40)+win(188,138,40)+'<rect x="204" y="36" width="24" height="56" fill="#9a3a22"/><rect x="200" y="30" width="32" height="10" fill="#6a2a1a"/>'));
reg("casa","Cabaña",svg(280,230,'<rect x="40" y="100" width="200" height="120" fill="#a8743c"/>'+Array.from({length:8},(_,i)=>'<rect x="40" y="'+(100+i*15)+'" width="200" height="13" rx="6" fill="'+(i%2?"#b8844a":"#9a6a34")+'"/>').join("")+'<path d="M16 108 L140 28 L264 108Z" fill="#4a7a3a"/><rect x="112" y="148" width="44" height="72" rx="4" fill="#5a3a22"/>'+win(58,128,36)+win(192,128,36)));
reg("casa","Castillo",svg(300,280,'<rect x="40" y="120" width="220" height="156" fill="#b9b3c8"/><rect x="20" y="70" width="64" height="206" fill="#a39cb8"/><rect x="216" y="70" width="64" height="206" fill="#a39cb8"/>'+[20,38,56,216,234,252].map(x=>'<rect x="'+x+'" y="56" width="14" height="18" fill="#a39cb8"/>').join("")+[44,66,88,110,130,150,170,190,210,232].map(x=>'<rect x="'+x+'" y="106" width="12" height="16" fill="#b9b3c8"/>').join("")+'<path d="M16 72 L52 14 L88 72Z" fill="#c4512f"/><path d="M212 72 L248 14 L284 72Z" fill="#c4512f"/><path d="M118 276 V196 Q150 160 182 196 V276Z" fill="#5a3a22"/><rect x="42" y="104" width="12" height="22" rx="6" fill="#3a3550"/><rect x="246" y="104" width="12" height="22" rx="6" fill="#3a3550"/><path d="M52 14 V-0 l22 8 l-22 8" fill="#ff7aa8"/>'));
reg("casa","Granero",svg(300,250,'<rect x="30" y="96" width="240" height="150" fill="#c4402f"/><path d="M14 104 L40 50 H260 L286 104Z" fill="#8a2a22"/><path d="M110 246 V150 H190 V246Z" fill="#f3e6c4" stroke="#fff" stroke-width="6"/><path d="M110 150 L190 246 M190 150 L110 246" stroke="#c4402f" stroke-width="6"/><rect x="132" y="66" width="36" height="26" fill="#f3e6c4"/>'));
reg("casa","Cueva",svg(300,200,'<path d="M0 200 Q4 60 80 30 Q150 0 220 30 Q296 60 300 200Z" fill="#7a7a86"/><path d="M60 200 Q60 90 150 80 Q240 90 240 200Z" fill="#1d1a26"/><path d="M40 60 Q80 36 120 44" stroke="#9a9aa6" stroke-width="8" fill="none" stroke-linecap="round"/>'));
reg("casa","Tienda de campaña",svg(260,170,'<path d="M10 166 L130 10 L250 166Z" fill="#e8762c"/><path d="M130 10 L102 166 H158Z" fill="#7a3a1a"/><path d="M130 10 L250 166 H158Z" fill="#c4602a"/>'));

/* ciudad */
const bld=(w,h,c,rows,cols)=>{let s='<rect x="0" y="0" width="'+w+'" height="'+h+'" fill="'+c+'"/><rect x="0" y="0" width="'+w+'" height="10" fill="'+shade(c,-.2)+'"/>';for(let r=0;r<rows;r++)for(let k=0;k<cols;k++)s+='<rect x="'+(14+k*(w-28)/cols)+'" y="'+(26+r*((h-70)/rows))+'" width="'+((w-28)/cols-10)+'" height="'+((h-70)/rows-12)+'" fill="'+((r*3+k)%4?"#cfeaff":"#ffe9a0")+'"/>';return s+'<rect x="'+(w/2-14)+'" y="'+(h-34)+'" width="28" height="34" fill="#5a3a22"/>';};
reg("ciudad","Edificio alto",svg(140,360,bld(140,360,"#7a8aa8",6,3)));
reg("ciudad","Edificio rojo",svg(180,260,bld(180,260,"#b8553f",4,4)));
reg("ciudad","Edificio amarillo",svg(150,200,bld(150,200,"#e8c060",3,3)));
reg("ciudad","Tienda",svg(200,150,'<rect x="0" y="30" width="200" height="120" fill="#f3d9a8"/><path d="M0 30 H200 V64 Q180 80 160 64 Q140 80 120 64 Q100 80 80 64 Q60 80 40 64 Q20 80 0 64Z" fill="#d9402f"/><rect x="24" y="84" width="90" height="56" fill="#bfe6ff" stroke="#fff" stroke-width="5"/><rect x="132" y="84" width="44" height="66" fill="#7a5230"/>'));
reg("ciudad","Auto",svg(240,110,'<path d="M10 84 Q8 56 40 50 L78 22 Q90 16 104 16 H156 Q170 16 180 28 L206 52 Q232 56 232 84Z" fill="#d9402f"/><path d="M92 26 H150 L174 52 H80Z" fill="#bfe6ff"/><path d="M122 26 V52" stroke="#d9402f" stroke-width="5"/><circle cx="66" cy="88" r="20" fill="#2b2b2b"/><circle cx="66" cy="88" r="9" fill="#bbb"/><circle cx="176" cy="88" r="20" fill="#2b2b2b"/><circle cx="176" cy="88" r="9" fill="#bbb"/><rect x="222" y="62" width="10" height="10" fill="#ffd34d"/>'));
reg("ciudad","Semáforo",svg(70,230,'<rect x="30" y="80" width="10" height="150" fill="#4a4a52"/><rect x="10" y="4" width="50" height="86" rx="10" fill="#2b2b2b"/><circle cx="35" cy="22" r="11" fill="#e8402f"/><circle cx="35" cy="47" r="11" fill="#555"/><circle cx="35" cy="72" r="11" fill="#555"/>'));
reg("ciudad","Farol",svg(60,240,'<rect x="26" y="40" width="8" height="200" fill="#3a3a42"/><path d="M10 40 L50 40 L44 8 H16Z" fill="#ffe08a" stroke="#3a3a42" stroke-width="5"/>'));
reg("ciudad","Banca",svg(180,100,'<rect x="10" y="30" width="160" height="16" rx="5" fill="#a8743c"/><rect x="10" y="8" width="160" height="14" rx="5" fill="#a8743c"/><rect x="24" y="46" width="12" height="46" fill="#4a4a52"/><rect x="144" y="46" width="12" height="46" fill="#4a4a52"/>'));

/* objetos varios */
reg("obj","Valla",svg(260,100,Array.from({length:8},(_,i)=>'<path d="M'+(i*32+6)+' 96 V16 L'+(i*32+20)+' 4 L'+(i*32+34)+' 16 V96Z" fill="#e8d4a8" stroke="#b89a68" stroke-width="2"/>').join("")+'<rect x="0" y="34" width="260" height="10" fill="#c9a870"/><rect x="0" y="66" width="260" height="10" fill="#c9a870"/>'));
reg("obj","Fogata",svg(120,120,'<path d="M60 100 Q22 80 40 40 Q48 60 56 52 Q54 20 66 6 Q92 40 84 62 Q96 56 98 44 Q112 76 60 100Z" fill="#f0a830"/><path d="M60 98 Q40 84 52 62 Q60 74 64 66 Q74 82 60 98Z" fill="#ffd34d"/><rect x="14" y="94" width="92" height="12" rx="6" fill="#6b4b2f" transform="rotate(-8 60 100)"/><rect x="14" y="94" width="92" height="12" rx="6" fill="#7a5230" transform="rotate(8 60 100)"/>'));
reg("obj","Estanque",svg(260,70,'<ellipse cx="130" cy="38" rx="124" ry="30" fill="#7ac0e8"/><ellipse cx="130" cy="34" rx="96" ry="18" fill="#9bd4f2"/><path d="M60 38 q10 -6 20 0 M150 30 q10 -6 20 0" stroke="#fff" stroke-width="3" fill="none"/>'));
reg("obj","Huevo de dino",svg(90,110,'<path d="M45 6 Q86 20 84 70 Q80 106 45 106 Q10 106 6 70 Q4 20 45 6Z" fill="#f3e6c4"/><circle cx="34" cy="40" r="8" fill="#6bbf59"/><circle cx="60" cy="64" r="10" fill="#6bbf59"/><circle cx="38" cy="82" r="7" fill="#6bbf59"/>'));
reg("obj","Volcán",svg(340,240,'<path d="M0 240 L110 70 H230 L340 240Z" fill="#6b4b3f"/><path d="M110 70 L128 40 H212 L230 70Z" fill="#8a3a2a"/><path d="M128 40 Q170 56 212 40" fill="#ff7a2a"/><path d="M150 52 Q154 110 140 170 M190 56 Q196 120 214 190" stroke="#ff7a2a" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="170" cy="14" r="22" fill="#6a6a72" opacity=".7"/><circle cx="196" cy="-2" r="16" fill="#8a8a92" opacity=".6"/>'));
reg("obj","Columpio",svg(200,220,'<path d="M10 216 L60 14 H140 L190 216" stroke="#d9402f" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M76 14 V150 M124 14 V150" stroke="#555" stroke-width="4"/><rect x="62" y="150" width="76" height="12" rx="5" fill="#a8743c"/>'));
reg("obj","Pelota",svg(70,70,'<circle cx="35" cy="35" r="30" fill="#e8402f"/><path d="M8 28 Q35 44 62 28 M16 54 Q35 36 54 54" stroke="#fff" stroke-width="5" fill="none"/>'));
reg("obj","Arcoíris",svg(300,150,['#e8402f','#f0a830','#ffd34d','#6bbf59','#4a9fd8','#8a5ad6'].map((c,i)=>'<path d="M'+(10+i*10)+' 148 A'+(140-i*10)+' '+(140-i*10)+' 0 0 1 '+(290-i*10)+' 148" stroke="'+c+'" stroke-width="10" fill="none"/>').join("")));
reg("obj","Mariposa",svg(110,90,'<ellipse cx="32" cy="32" rx="28" ry="26" fill="#ff7aa8"/><ellipse cx="78" cy="32" rx="28" ry="26" fill="#ff7aa8"/><ellipse cx="36" cy="64" rx="20" ry="18" fill="#ffb3cc"/><ellipse cx="74" cy="64" rx="20" ry="18" fill="#ffb3cc"/><rect x="51" y="20" width="8" height="52" rx="4" fill="#4a2a1a"/><circle cx="32" cy="32" r="8" fill="#fff" opacity=".7"/><circle cx="78" cy="32" r="8" fill="#fff" opacity=".7"/>'));
reg("obj","Pájaro",svg(110,80,'<ellipse cx="50" cy="46" rx="34" ry="24" fill="#4a9fd8"/><circle cx="82" cy="30" r="18" fill="#4a9fd8"/><path d="M98 30 l16 4 l-16 6Z" fill="#f0a830"/><circle cx="86" cy="26" r="3.4" fill="#222"/><path d="M20 44 L0 30 L22 36Z" fill="#2c6fa0"/><path d="M40 40 Q50 8 70 36Z" fill="#2c6fa0"/>'));
reg("obj","Cofre",svg(130,100,'<rect x="8" y="40" width="114" height="56" rx="6" fill="#a8743c"/><path d="M8 44 Q8 8 65 8 Q122 8 122 44Z" fill="#c4883c"/><rect x="8" y="40" width="114" height="10" fill="#e0b040"/><rect x="54" y="38" width="22" height="26" rx="4" fill="#ffd34d" stroke="#b88a20" stroke-width="3"/>'));
reg("obj","Corazón",svg(100,90,'<path d="M50 84 C6 52 4 12 30 8 C42 6 50 18 50 22 C50 18 58 6 70 8 C96 12 94 52 50 84Z" fill="#e8402f"/>'));
reg("obj","Montón de paja",svg(150,90,'<path d="M6 88 Q10 30 70 18 Q130 30 144 88Z" fill="#e8c860"/>'+Array.from({length:10},(_,i)=>'<path d="M'+(20+i*12)+' 86 L'+(40+i*9)+' 30" stroke="#c9a640" stroke-width="3"/>').join("")));
reg("obj","Montón de ladrillos",svg(150,80,Array.from({length:3},(_,r)=>Array.from({length:4-r},(_,c)=>'<rect x="'+(10+c*34+r*17)+'" y="'+(52-r*22)+'" width="32" height="20" fill="#c4512f" stroke="#8a3a22" stroke-width="2" rx="2"/>').join("")).join("")));

/* ================= Fondos y suelos ================= */
const sky=(top,bot,body)=>svg(960,540,'<rect width="960" height="540" fill="url(#g)"/>'+body,'<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+top+'"/><stop offset="1" stop-color="'+bot+'"/></linearGradient>');
const hill=(c,y)=>'<path d="M0 '+y+' Q220 '+(y-60)+' 460 '+(y-4)+' T960 '+(y-10)+' V540 H0Z" fill="'+c+'"/>';
const cloudsBg='<g fill="#fff" opacity=".8"><ellipse cx="180" cy="90" rx="70" ry="22"/><ellipse cx="560" cy="60" rx="90" ry="26"/><ellipse cx="820" cy="120" rx="64" ry="20"/></g>';
let cityB="",px=-20;
for(const [w,h,c] of [[110,230,"#8896b0"],[90,170,"#b8765f"],[130,280,"#6f7e9a"],[100,200,"#c8a060"],[120,250,"#7a8aa8"],[90,160,"#a8655a"],[110,220,"#8896b0"],[90,190,"#b89860"]]){
  cityB+='<rect x="'+px+'" y="'+(400-h)+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';
  for(let y=400-h+20;y<380;y+=34)for(let x=px+14;x<px+w-20;x+=28)cityB+='<rect x="'+x+'" y="'+y+'" width="14" height="18" fill="'+((x*7+y)%5?"#d8ecff":"#ffe9a0")+'"/>';
  px+=w+10;
}
reg("bg","Ciudad",sky("#8ccdf5","#e8f6ff",cloudsBg+cityB+'<rect y="400" width="960" height="140" fill="#9aa0aa"/>'));
reg("bg","Patio",sky("#7ec8f2","#e3f5ff",cloudsBg+hill("#8acb5c",380)+Array.from({length:12},(_,i)=>'<path d="M'+(i*84)+' 410 V300 L'+(i*84+36)+' 286 L'+(i*84+72)+' 300 V410Z" fill="#e8d4a8" stroke="#b89a68" stroke-width="3"/>').join("")+'<rect y="330" width="960" height="12" fill="#c9a870"/><rect y="372" width="960" height="12" fill="#c9a870"/>'));
let stal="";for(let i=0;i<9;i++){const x=i*120+30;stal+='<path d="M'+x+' 0 L'+(x+34)+' 0 L'+(x+17)+' '+(60+(i*37)%70)+'Z" fill="#4a3b52"/><path d="M'+(x+50)+' 540 L'+(x+88)+' 540 L'+(x+68)+' '+(430-(i*29)%50)+'Z" fill="#3a2e44"/>';}
reg("bg","Cueva",sky("#2b2233","#4a3b52",stal+'<circle cx="760" cy="230" r="120" fill="#ffd34d" opacity=".12"/><circle cx="760" cy="230" r="60" fill="#ffd34d" opacity=".12"/>'));
reg("bg","Granja",sky("#8ccdf5","#eaf7ff",cloudsBg+hill("#9bd16b",380)+hill("#7bbf4f",450)+'<rect x="690" y="270" width="150" height="120" fill="#c4402f"/><path d="M676 276 L704 226 H826 L854 276Z" fill="#8a2a22"/><rect x="744" y="320" width="42" height="70" fill="#f3e6c4"/><rect x="860" y="236" width="40" height="154" rx="6" fill="#b9b3c8"/>'));
reg("bg","Montañas",sky("#a8d8f6","#f0f8ff",'<path d="M0 400 L170 170 L330 400Z" fill="#8a96b0"/><path d="M110 400 L330 120 L560 400Z" fill="#7a86a2"/><path d="M290 400 L560 190 L780 400Z" fill="#8a96b0"/><path d="M600 400 L800 150 L960 330 V400Z" fill="#7a86a2"/><path d="M330 120 L292 168 L320 160 L336 178 L356 156 L372 166Z" fill="#fff"/><path d="M800 150 L768 192 L792 184 L806 200 L826 180 L842 190Z" fill="#fff"/>'+hill("#5ba04a",420)));
reg("bg","Prehistórico",sky("#ff9a5a","#ffe3a8",'<path d="M610 400 L700 190 H800 L900 400Z" fill="#6b4b3f"/><path d="M700 190 Q750 210 800 190 Q790 170 750 172 Q710 170 700 190Z" fill="#ff7a2a"/><circle cx="750" cy="140" r="30" fill="#6a6a72" opacity=".6"/><circle cx="780" cy="100" r="22" fill="#6a6a72" opacity=".5"/>'+hill("#7a8a3a",420)+hill("#5a7a2a",470)));
reg("bg","Desierto",sky("#8ccdf5","#ffe9b0",'<circle cx="780" cy="110" r="50" fill="#ffd34d"/><path d="M0 400 Q200 330 420 390 T960 360 V540 H0Z" fill="#e8c070"/><path d="M0 460 Q260 410 520 460 T960 440 V540 H0Z" fill="#d9aa55"/>'));
reg("bg","Atardecer en el bosque",sky("#ff9a5a","#ffe3a8",[40,200,420,620,860].map(x=>'<rect x="'+x+'" y="130" width="34" height="320" fill="#5a3a24"/><circle cx="'+(x+17)+'" cy="130" r="72" fill="#4a6a3a"/>').join("")+hill("#4d6a3a",390)+hill("#33502a",450)));
const gr=(base,top,extra)=>svg(960,140,'<rect width="960" height="140" fill="'+base+'"/><rect width="960" height="16" fill="'+top+'"/>'+(extra||""));
reg("ground","Piedra",gr("#8a8a96","#a0a0ac",Array.from({length:12},(_,i)=>'<ellipse cx="'+(i*82+30)+'" cy="'+(50+(i%3)*30)+'" rx="30" ry="14" fill="#7a7a86"/>').join("")));
reg("ground","Calle",gr("#55555e","#6a6a74",'<rect y="62" width="960" height="8" fill="#555" opacity="0"/>'+Array.from({length:10},(_,i)=>'<rect x="'+(i*100+10)+'" y="70" width="60" height="8" fill="#ffd34d"/>').join("")));
reg("ground","Madera",gr("#b87a42","#c9904e",Array.from({length:8},(_,i)=>'<path d="M0 '+(30+i*14)+' H960" stroke="#9a6430" stroke-width="2"/>').join("")));
reg("ground","Pasto con flores",gr("#6cbf4a","#8ad45f",Array.from({length:20},(_,i)=>'<circle cx="'+(i*50+14)+'" cy="'+(12+(i*13)%26)+'" r="5" fill="'+["#ff7aa8","#ffd34d","#fff"][i%3]+'"/>').join("")));

/* ================= Paletas de ambiente ================= */
const PALETTES=[
  {id:"manana",name:"Mañana",bg:"bg_Día",ground:"ground_Pasto",tint:null},
  {id:"atardecer",name:"Atardecer",bg:"bg_Atardecer",ground:"ground_Pasto",tint:["#ff9a4d",.18]},
  {id:"noche",name:"Noche",bg:"bg_Noche",ground:"ground_Pasto",tint:["#1b2a7a",.34]},
  {id:"otono",name:"Otoño",bg:"bg_Día",ground:"ground_Tierra",tint:["#e08a2a",.22]},
  {id:"invierno",name:"Invierno",bg:"bg_Día",ground:"ground_Nieve",tint:["#8fb8ff",.22]},
  {id:"fantasia",name:"Fantasía",bg:"bg_Atardecer",ground:"ground_Pasto con flores",tint:["#ff7ad9",.16]},
  {id:"antiguo",name:"Cuento antiguo",bg:"bg_Día",ground:"ground_Tierra",tint:["#8a6a3a",.3]}
];

/* ================= Historias listas ================= */
const T=(text,start,dur,speaker)=>({op:"text",text,start,dur,speaker});
const STORIES=[
 {id:"cerditos",emoji:"🐷",name:"Los tres cerditos",desc:"Tres casas y un lobo soplador",ops:[
  {op:"world",screens:5},{op:"duration",seconds:40},{op:"bg",asset:"bg_Día"},{op:"ground",asset:"ground_Pasto"},
  ...[300,1500,2800,4000].map((x,i)=>({op:"add",asset:"obj_Nube",x,y:80+(i%2)*30,w:200,depth:.45})),
  ...[420,1650,2650,3700,4550].map(x=>({op:"add",asset:"arbol_Roble",x,onGround:true,w:230,depth:.8})),
  {op:"add",asset:"casa_Casa de paja",x:1300,onGround:true,w:260,name:"Casa de paja"},
  {op:"add",asset:"casa_Casa de madera",x:2300,onGround:true,w:260,name:"Casa de madera"},
  {op:"add",asset:"casa_Casa de ladrillos",x:3300,onGround:true,w:270,name:"Casa de ladrillos"},
  {op:"add",asset:"char_Cerdo",x:300,onGround:true,w:190,name:"Cerdito 1",ref:"c1",acc:"none"},
  {op:"add",asset:"char_Cerdo",x:420,onGround:true,w:190,name:"Cerdito 2",ref:"c2",body:"#f4b0a0",belly:"#f9d0c4",acc:"sombrero"},
  {op:"add",asset:"char_Cerdo",x:540,onGround:true,w:190,name:"Cerdito 3",ref:"c3",body:"#e9a0c8",belly:"#f5c4de",acc:"lentes"},
  {op:"add",asset:"char_Lobo",x:4550,onGround:true,w:260,name:"Lobo",ref:"lobo",flip:true},
  {op:"path",target:"c1",points:[{t:.5,x:300},{t:5.5,x:1050}]},
  {op:"path",target:"c2",points:[{t:.5,x:420},{t:11.5,x:2050}]},
  {op:"path",target:"c3",points:[{t:.5,x:540},{t:17.5,x:3050}]},
  {op:"path",target:"lobo",points:[{t:22,x:4550},{t:28,x:3600},{t:33,x:3600},{t:38,x:4750}]},
  T("Había una vez tres cerditos que querían construir su propia casa.",.5,5),
  T("El primero la hizo de paja, muy rápido, para irse a jugar.",6,5,"c1"),
  T("El segundo la hizo de madera, y también terminó pronto.",12,5,"c2"),
  T("El tercero trabajó mucho y construyó su casa con ladrillos.",18,5,"c3"),
  T("¡Soplaré y soplaré, y tu casa derribaré!",24,4.5,"lobo"),
  T("Pero la casa de ladrillos era tan fuerte que el lobo no pudo derribarla.",29.5,5),
  T("Y los tres cerditos vivieron felices para siempre.",35.5,4,"c3"),
  {op:"camera",mode:"keys",keys:[{t:0,x:480,y:270,z:1},{t:6,x:1200,y:270,z:1},{t:12,x:2100,y:270,z:1},{t:18,x:3000,y:270,z:1},{t:26,x:3700,y:270,z:1.12},{t:34,x:3500,y:270,z:1.12},{t:39.5,x:3400,y:270,z:1}]}
 ]},
 {id:"caperucita",emoji:"🧣",name:"La niña de la capa roja",desc:"Un paseo por el bosque",ops:[
  {op:"world",screens:4},{op:"duration",seconds:32},{op:"bg",asset:"bg_Bosque"},{op:"ground",asset:"ground_Tierra"},
  ...[500,1300,2100,2800].map(x=>({op:"add",asset:"arbol_Pino",x,onGround:true,w:210,depth:.8})),
  {op:"add",asset:"obj_Hongo",x:900,onGround:true,w:80},{op:"add",asset:"arbol_Arbusto",x:2400,onGround:true,w:200,ref:"arb"},
  {op:"add",asset:"casa_Cabaña",x:3500,onGround:true,w:300,name:"Casa de la abuela"},
  {op:"add",asset:"char_Caperucita",x:250,onGround:true,w:150,name:"Niña de rojo",ref:"nina"},
  {op:"add",asset:"char_Lobo",x:2650,onGround:true,w:250,name:"Lobo",ref:"lobo",flip:true},
  {op:"path",target:"nina",points:[{t:.5,x:250},{t:12,x:2000},{t:15,x:2000},{t:26,x:3350}]},
  {op:"path",target:"lobo",points:[{t:16,x:2650},{t:20,x:2650},{t:26,x:3200}]},
  T("Una niña de capa roja iba por el bosque a visitar a su abuela.",.5,5,"nina"),
  T("Por el camino se encontró con un lobo muy curioso.",13,3.5),
  T("—¿A dónde vas, niña? —preguntó el lobo.",16.5,3.5,"lobo"),
  T("—A casa de mi abuela —respondió ella.",20.5,3.5,"nina"),
  T("Y siguió caminando hasta llegar a la cabaña.",25,5),
  {op:"camera",mode:"follow",follow:"nina",look:260,zoom:1.1}
 ]},
 {id:"zorro",emoji:"🦊",name:"El zorro curioso",desc:"Un zorro explora el bosque",ops:[
  {op:"world",screens:3},{op:"duration",seconds:20},{op:"bg",asset:"bg_Bosque"},{op:"ground",asset:"ground_Pasto"},
  ...[500,1250,2050,2550].map(x=>({op:"add",asset:"arbol_Roble",x,onGround:true,w:230,depth:.85})),
  {op:"add",asset:"obj_Flor",x:900,onGround:true,w:50},{op:"add",asset:"obj_Flor",x:1000,onGround:true,w:46},{op:"add",asset:"obj_Roca",x:1700,onGround:true,w:150},
  {op:"add",asset:"char_Conejo",x:1500,onGround:true,w:170,name:"Conejo",ref:"con",flip:true},
  {op:"add",asset:"char_Ciervo",x:2500,onGround:true,w:270,name:"Ciervo",ref:"cie",flip:true},
  {op:"add",asset:"char_Zorro",x:200,onGround:true,w:260,name:"Zorro",ref:"zor"},
  {op:"path",target:"zor",points:[{t:.5,x:200},{t:6,x:1250},{t:9,x:1250},{t:17,x:2200}]},
  T("Había una vez un zorro curioso que quería conocer el bosque.",.3,4.5,"zor"),
  T("—Hola, conejo. ¿Qué haces aquí?",6.5,3,"zor"),
  T("—Estoy buscando zanahorias —dijo el conejo.",9.5,3.2,"con"),
  T("¡Sigamos caminando!",13,2.6,"zor"),
  T("Más adelante, un ciervo lo saludó desde lejos.",16,3.5,"cie"),
  {op:"camera",mode:"follow",follow:"zor",look:240,zoom:1.1}
 ]},
 {id:"dinos",emoji:"🦕",name:"Los dinosaurios",desc:"Un volcán, huevos y dos amigos",ops:[
  {op:"world",screens:3},{op:"duration",seconds:20},{op:"bg",asset:"bg_Prehistórico"},{op:"ground",asset:"ground_Tierra"},
  {op:"add",asset:"obj_Volcán",x:2400,onGround:true,w:420,depth:.7},
  ...[600,1200,1900].map(x=>({op:"add",asset:"arbol_Helecho",x,onGround:true,w:170})),
  {op:"add",asset:"arbol_Palmera",x:1500,onGround:true,w:210,depth:.85},
  {op:"add",asset:"obj_Huevo de dino",x:1700,onGround:true,w:70},{op:"add",asset:"obj_Huevo de dino",x:1780,onGround:true,w:64},
  {op:"add",asset:"char_Dinosaurio",x:250,onGround:true,w:330,name:"Dino verde",ref:"d1"},
  {op:"add",asset:"char_Triceratops",x:2300,onGround:true,w:320,name:"Tricera",ref:"d2",flip:true},
  {op:"path",target:"d1",points:[{t:.5,x:250},{t:8,x:1300},{t:12,x:1300},{t:18,x:1500}]},
  T("Hace muchos años, un dinosaurio verde caminaba cerca de un volcán.",.5,5,"d1"),
  T("—¡Mira esos huevos! ¿De quién serán?",8.5,3.5,"d1"),
  T("—Son de mi mamá —dijo Tricera.",12.5,3.5,"d2"),
  T("Y los dos amigos cuidaron los huevos hasta que nacieron.",16.5,3.5),
  {op:"camera",mode:"follow",follow:"d1",look:240,zoom:1.1}
 ]},
 {id:"granja",emoji:"🐮",name:"Un día en la granja",desc:"Vaca, cerdito y oveja",ops:[
  {op:"world",screens:3},{op:"duration",seconds:20},{op:"bg",asset:"bg_Granja"},{op:"ground",asset:"ground_Pasto con flores"},
  {op:"add",asset:"obj_Sol",x:600,y:90,w:120,depth:.3},{op:"add",asset:"obj_Nube",x:1400,y:90,w:200,depth:.45},
  {op:"add",asset:"casa_Granero",x:2450,onGround:true,w:320,depth:.9},
  {op:"add",asset:"obj_Valla",x:900,onGround:true,w:300},{op:"add",asset:"obj_Valla",x:1160,onGround:true,w:300},
  {op:"add",asset:"obj_Montón de paja",x:1800,onGround:true,w:150},
  {op:"add",asset:"char_Vaca",x:250,onGround:true,w:290,name:"Vaca",ref:"vac"},
  {op:"add",asset:"char_Cerdo",x:1500,onGround:true,w:200,name:"Cerdito",ref:"cer",flip:true},
  {op:"add",asset:"char_Oveja",x:2000,onGround:true,w:240,name:"Oveja",ref:"ove",flip:true},
  {op:"path",target:"vac",points:[{t:.5,x:250},{t:8,x:1250},{t:14,x:1250}]},
  T("Era una mañana soleada en la granja.",.4,3.5),
  T("—¡Muuu! Buenos días, amigos.",4,3.5,"vac"),
  T("—Oink, oink. ¡Vamos a jugar!",8.5,3.5,"cer"),
  T("—Bee, bee. ¡Yo también quiero!",12.5,3.5,"ove"),
  T("Y todos jugaron juntos hasta la tarde.",16.5,3.2),
  {op:"camera",mode:"follow",follow:"vac",look:240,zoom:1.1}
 ]},
 {id:"ciudad",emoji:"🐱",name:"El gato en la ciudad",desc:"Un gato y una niña pasean",ops:[
  {op:"world",screens:3},{op:"duration",seconds:18},{op:"bg",asset:"bg_Ciudad"},{op:"ground",asset:"ground_Calle"},
  {op:"add",asset:"ciudad_Farol",x:700,onGround:true,w:70,depth:.9},{op:"add",asset:"ciudad_Semáforo",x:1500,onGround:true,w:80},
  {op:"add",asset:"ciudad_Banca",x:2200,onGround:true,w:190},{op:"add",asset:"ciudad_Auto",x:1900,onGround:true,w:250,depth:1.1,flip:true},
  {op:"add",asset:"char_Niña",x:2450,onGround:true,w:140,name:"Niña",ref:"nin",flip:true},
  {op:"add",asset:"char_Gato",x:250,onGround:true,w:210,name:"Gato",ref:"gat"},
  {op:"path",target:"gat",points:[{t:.5,x:250},{t:9,x:1700},{t:11,x:1700},{t:16,x:2200}]},
  T("Un gato curioso salió a pasear por la ciudad.",.4,4,"gat"),
  T("—¡Miau! Cuántos autos y cuántas luces.",5,3.5,"gat"),
  T("—Hola, gatito —dijo una niña.",11,3.2,"nin"),
  T("Y se hicieron muy buenos amigos.",14.5,3),
  {op:"camera",mode:"follow",follow:"gat",look:240,zoom:1.1}
 ]}
];

/* ================= Biblioteca ampliada ================= */
A.sky=A.sky||[];
const GRPNAMES={personas:"Personas",granja:"Granja",bosque:"Bosque",selva:"Selva",africa:"África",latam:"Latinoamérica",noct:"Nocturnos",prehi:"Prehistóricos",aves:"Aves",mar:"Mar y reptiles",mito:"Mitológicos",bichos:"Insectos",
  dia:"Día",noche:"Noche",atardecer:"Atardecer",ciudad:"Ciudad",fantasia:"Fantasía",espacio:"Cielo y espacio",
  nubes:"Nubes",lunas:"Lunas y estrellas",soles:"Soles",nat:"Naturaleza",cult:"Culturas",magia:"Magia",cosas:"Cosas",casas:"Casas",tropical:"Tropicales",frio:"Frío"};
const E2=(x,y,r,col)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff"/><circle cx="'+(x+r*.25)+'" cy="'+y+'" r="'+(r*.52)+'" fill="'+(col||"#222")+'"/><circle cx="'+(x+r*.4)+'" cy="'+(y-r*.25)+'" r="'+(r*.2)+'" fill="#fff"/>';
const MOUTH='#7a1f2b';

/* ---------- Aves ---------- */
const BIRDS={
  Gallina:{body:"#f6f0e0",belly:"#fffaf0",wing:"#e0d4b8",beak:"#f0a830",bt:"short",crest:"comb",cc:"#e8402f",tail:"fan",legC:"#f0a830",nk:.15,g:["granja","aves"]},
  Gallo:{body:"#c4602a",belly:"#e0a040",wing:"#8a3a1a",beak:"#f0a830",bt:"short",crest:"comb",cc:"#e8402f",tail:"long",tailC:"#2e6a4a",legC:"#f0a830",nk:.3,g:["granja","aves"]},
  Ganso:{body:"#ffffff",belly:"#f4f4f4",wing:"#e4e4e4",beak:"#f08a2a",bt:"med",legC:"#f08a2a",nk:.85,tail:"short",g:["granja","aves"]},
  Pavo:{body:"#8a5a3a",belly:"#a8754a",wing:"#6a3a20",beak:"#f0a830",bt:"short",head:"#6aa8d8",crest:"tuft",cc:"#6aa8d8",tail:"fan",tailC:"#a8754a",legC:"#a8754a",nk:.5,g:["granja","aves"]},
  "Pavo real":{body:"#2a7ac8",belly:"#1f5a9a",wing:"#1a4a8a",beak:"#e8d4a8",bt:"short",crest:"tuft",cc:"#2a7ac8",tail:"peacock",legC:"#8a8f9a",nk:.7,g:["aves","africa"]},
  Guacamayo:{body:"#e8402f",belly:"#ff7a3a",wing:"#2a7ac8",beak:"#f3e6c4",bt:"hook",tail:"long",tailC:"#2a7ac8",legC:"#8a8f9a",nk:.1,face:"#fff",g:["selva","latam","aves"]},
  "Tucán":{body:"#2b2b33",belly:"#fff",wing:"#1a1a22",beak:"#f0a830",beak2:"#e8402f",bt:"toucan",legC:"#4a8ad8",nk:.1,tail:"short",g:["selva","latam","aves"]},
  "Colibrí":{body:"#2ab88a",belly:"#f0e68a",wing:"#8adfc0",beak:"#2b2b33",bt:"needle",tail:"fork",tailC:"#1a8a6a",legC:"#2b2b33",nk:0,size:.6,g:["latam","selva","aves"]},
  "Cóndor":{body:"#2b2b33",belly:"#3a3a44",wing:"#1a1a22",head:"#e0a090",beak:"#e8d4a8",bt:"hook",collar:"#fff",legC:"#8a8f9a",nk:.3,tail:"short",size:1.1,g:["latam","aves"]},
  Flamenco:{body:"#ff8aa8",belly:"#ffa8c0",wing:"#ff5a88",beak:"#f3e6c4",beak2:"#2b2b33",bt:"hook",legC:"#ff7a98",nk:1,legL:60,tail:"short",g:["latam","aves"]},
  Avestruz:{body:"#2b2b33",belly:"#3a3a44",wing:"#f0f0f0",head:"#e8c0b0",beak:"#f0c070",bt:"short",legC:"#e8c0b0",nk:1,legL:60,tail:"fan",tailC:"#f0f0f0",size:1.1,g:["africa","aves"]},
  "Pingüino":{body:"#2b2b33",belly:"#ffffff",wing:"#1a1a22",beak:"#f08a2a",bt:"med",legC:"#f08a2a",nk:0,legL:-14,tail:"short",g:["latam","mar","aves","frio"]},
  Paloma:{body:"#b8bcc8",belly:"#d0d4de",wing:"#8a90a0",beak:"#f0c0a0",bt:"short",legC:"#e8808a",nk:.1,tail:"short",g:["aves"]},
  Golondrina:{body:"#2a4a8a",belly:"#f6e8d0",wing:"#1a2a5a",beak:"#222",bt:"short",legC:"#555",nk:0,tail:"fork",tailC:"#1a2a5a",size:.8,g:["aves"]},
  "Águila":{body:"#6a4a2a",belly:"#8a6a42",wing:"#4a2a14",head:"#fff",beak:"#ffd34d",bt:"hook",legC:"#ffd34d",nk:.2,tail:"short",tailC:"#fff",size:1.1,g:["aves"]},
  "Fénix":{body:"#e8402f",belly:"#ffb627",wing:"#ff7a2a",beak:"#ffd34d",bt:"hook",crest:"fan",cc:"#ffd34d",tail:"flame",tailC:"#ff7a2a",legC:"#ffd34d",nk:.3,g:["mito","aves"]},
  Cisne:{body:"#ffffff",belly:"#f0f4ff",wing:"#dde4f4",beak:"#f08a2a",bt:"med",legC:"#444",nk:1,tail:"short",legL:-6,g:["aves"]},
  Loro:{body:"#4ac83a",belly:"#8adf5a",wing:"#2a8a2a",beak:"#e8402f",bt:"hook",tail:"long",tailC:"#e8402f",legC:"#8a8f9a",nk:.1,face:"#ffd34d",g:["selva","latam","aves"]}
};
function birdSvg(p,open){
  const nk=p.nk||0,hx=150,hy=96-nk*44,bs=p.size||1,ll=22+(p.legL||0),H=184+Math.max(8,ll)+16,tc=p.tailC||p.wing,hc=p.head||p.body;
  let s="";
  const tails={
    short:'<path d="M54 130 L18 112 L26 142Z" fill="'+tc+'"/>',
    long:'<path d="M54 132 C30 140 8 168 2 218 C34 198 58 172 78 150Z" fill="'+tc+'"/><path d="M54 128 C30 120 8 118 0 92 C30 98 54 108 70 124Z" fill="'+shade(tc,-.2)+'"/>',
    fan:'<g fill="'+tc+'">'+[-32,-12,8,28].map(a=>'<ellipse cx="46" cy="124" rx="9" ry="32" transform="rotate('+(a-72)+' 60 134)"/>').join("")+'</g>',
    peacock:'<g>'+[-48,-32,-16,0,16,32,48].map((a,i)=>'<ellipse cx="0" cy="134" rx="62" ry="11" fill="'+(i%2?"#2a9a8a":"#1f7a9a")+'" transform="rotate('+a+' 62 134)"/>').join("")+[-48,-32,-16,0,16,32,48].map(a=>{const r=a*Math.PI/180;return '<circle cx="'+(62-112*Math.cos(r)).toFixed(1)+'" cy="'+(134-112*Math.sin(r)).toFixed(1)+'" r="7" fill="#ffd34d"/><circle cx="'+(62-112*Math.cos(r)).toFixed(1)+'" cy="'+(134-112*Math.sin(r)).toFixed(1)+'" r="3.4" fill="#1f5a9a"/>';}).join("")+'</g>',
    flame:'<path d="M58 132 C30 150 4 196 6 238 C30 214 40 224 50 242 C60 214 76 196 80 160Z" fill="'+tc+'"/><path d="M58 128 C28 120 6 96 0 62 C28 76 36 70 46 88 C52 100 64 108 74 122Z" fill="#ffd34d"/>',
    fork:'<path d="M58 134 L4 154 L34 136 L8 118Z" fill="'+tc+'"/>'
  };
  s+=tails[p.tail]||"";
  s+='<path d="M92 184 V'+(184+ll)+' M118 184 V'+(184+ll)+'" stroke="'+p.legC+'" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M80 '+(184+ll)+' H104 M106 '+(184+ll)+' H130" stroke="'+p.legC+'" stroke-width="7" stroke-linecap="round" fill="none"/>';
  s+='<ellipse cx="100" cy="150" rx="'+(58*bs)+'" ry="'+(42*bs)+'" fill="'+p.body+'"/>';
  if(p.belly)s+='<ellipse cx="114" cy="166" rx="'+(40*bs)+'" ry="'+(26*bs)+'" fill="'+p.belly+'"/>';
  if(nk>0)s+='<path d="M126 134 Q154 '+((hy+134)/2)+' '+(hx-2)+' '+(hy+16)+'" stroke="'+(p.neckC||hc)+'" stroke-width="'+(24+(p.collar?4:0))+'" fill="none" stroke-linecap="round"/>';
  if(p.collar)s+='<ellipse cx="132" cy="136" rx="26" ry="12" fill="'+p.collar+'" transform="rotate(-30 132 136)"/>';
  s+='<ellipse cx="88" cy="152" rx="'+(40*bs)+'" ry="'+(22*bs)+'" transform="rotate(-14 88 152)" fill="'+p.wing+'"/>';
  if(p.crest==="comb")s+='<path d="M136 '+(hy-20)+' q6 -22 14 -6 q6 -20 14 -2 q6 -14 10 10Z" fill="'+p.cc+'"/>';
  if(p.crest==="tuft")s+='<path d="M142 '+(hy-22)+' q-10 -26 -2 -34 M152 '+(hy-26)+' q-4 -30 8 -36 M162 '+(hy-22)+' q4 -22 14 -26" stroke="'+p.cc+'" stroke-width="5" fill="none" stroke-linecap="round"/>';
  if(p.crest==="fan")s+='<path d="M128 '+(hy-14)+' L116 '+(hy-46)+' L140 '+(hy-26)+' L146 '+(hy-58)+' L156 '+(hy-28)+' L172 '+(hy-48)+' L170 '+(hy-14)+'Z" fill="'+p.cc+'"/>';
  s+='<circle cx="'+hx+'" cy="'+hy+'" r="26" fill="'+hc+'"/>';
  if(p.face)s+='<ellipse cx="'+(hx+8)+'" cy="'+(hy+2)+'" rx="16" ry="14" fill="'+p.face+'"/>';
  if(p.crest==="comb")s+='<path d="M'+(hx+20)+' '+(hy+10)+' q-4 22 6 22 q8 -4 2 -22Z" fill="'+p.cc+'"/>';
  s+=E2(hx+8,hy-6,7);
  const x0=hx+20,len={short:24,med:38,hook:32,toucan:62,needle:56}[p.bt]||26,th={short:16,med:18,hook:20,toucan:26,needle:6}[p.bt]||16,c2=p.beak2||p.beak;
  if(open){
    s+='<path d="M'+x0+' '+(hy-th/2)+' L'+(x0+len*.7)+' '+(hy-th*.1)+' L'+(x0+len*.7)+' '+(hy+th*.55)+' L'+x0+' '+(hy+th/2)+'Z" fill="'+MOUTH+'"/>';
    s+='<path d="M'+x0+' '+(hy-th/2)+' L'+(x0+len)+' '+(hy-th*.05)+(p.bt==="hook"?' q4 14 -6 16':'')+' L'+x0+' '+(hy+1)+'Z" fill="'+p.beak+'"/>';
    s+='<path d="M'+x0+' '+(hy+3)+' L'+(x0+len*.88)+' '+(hy+th*.75)+' L'+x0+' '+(hy+th/2+2)+'Z" fill="'+c2+'"/>';
  }else{
    s+='<path d="M'+x0+' '+(hy-th/2)+' L'+(x0+len)+' '+(hy+th*.05)+(p.bt==="hook"?' q4 16 -8 18':'')+' L'+x0+' '+(hy+th/2)+'Z" fill="'+p.beak+'"/>';
    s+='<path d="M'+x0+' '+(hy+th*.05)+' L'+(x0+len*.96)+' '+(hy+th*.2)+' L'+x0+' '+(hy+th/2)+'Z" fill="'+c2+'"/>';
  }
  return svg(250,H+40,'<g>'+s+'</g>',null,"0 -40 250 "+(H+40));
}
for(const k of Object.keys(BIRDS)){const p=BIRDS[k],c=birdSvg(p,false),o=birdSvg(p,true);reg("char",k,c,{alt:o.src,size:p.size&&p.size<.7?150:210,grp:p.g});}

/* ---------- Criaturas (dibujos sin esqueleto) ---------- */
function critter(k,open){
  const mo=(x,y,w,h)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+w+'" ry="'+h+'" fill="'+MOUTH+'"/>';
  if(k==="Serpiente")return svg(260,170,'<path d="M20 140 C20 90 90 100 110 130 C130 160 190 160 200 110 C206 80 186 60 168 70" stroke="#5fae4a" stroke-width="34" fill="none" stroke-linecap="round"/><path d="M20 140 C20 90 90 100 110 130 C130 160 190 160 200 110 C206 80 186 60 168 70" stroke="#c9e68a" stroke-width="10" fill="none" stroke-dasharray="14 18" stroke-linecap="round"/><ellipse cx="190" cy="62" rx="36" ry="26" fill="#5fae4a" transform="rotate(-14 190 62)"/>'+E2(196,52,7)+(open?'<path d="M210 66 L246 56 L214 82Z" fill="'+MOUTH+'"/><path d="M246 58 l14 -6 l-6 12 l12 4 l-16 0" fill="#e8402f"/>':'<path d="M214 66 L248 70" stroke="#2e6a2a" stroke-width="4" stroke-linecap="round"/><path d="M248 70 l14 -6 M248 70 l14 8" stroke="#e8402f" stroke-width="3" stroke-linecap="round"/>'));
  if(k==="Cocodrilo")return svg(320,150,'<path d="M20 100 C60 84 100 92 130 90 L250 80 L300 78 L300 96 L252 104 L130 120 C90 126 50 128 4 116Z" fill="#4a9a4a"/><path d="M4 116 C50 128 90 126 130 120 L250 104 L300 96 L300 104 L250 114 L130 134 C80 140 40 138 8 124Z" fill="#c9e68a"/><path d="M60 110 L60 142 h22 M170 118 l-6 30 h24" stroke="#3a7a3a" stroke-width="16" stroke-linecap="round" fill="none"/>'+[40,70,100,130,160].map(x=>'<path d="M'+x+' 90 l6 -14 l6 14Z" fill="#3a7a3a"/>').join("")+E2(258,70,8)+(open?'<path d="M250 80 L300 70 L300 78 L252 92Z" fill="#4a9a4a"/><path d="M252 94 L300 100 L300 112 L250 106Z" fill="'+MOUTH+'"/>'+[262,276,290].map(x=>'<path d="M'+x+' 94 l4 8 l4 -8Z" fill="#fff"/>').join(""):'<path d="M252 94 L300 98" stroke="#2e6a2a" stroke-width="4"/>'+[266,282].map(x=>'<path d="M'+x+' 96 l4 8 l4 -8Z" fill="#fff"/>').join("")));
  if(k==="Tortuga")return svg(240,170,'<path d="M30 130 C20 60 90 30 130 40 C176 48 210 90 200 130Z" fill="#5fae4a"/><path d="M60 126 C56 80 90 58 130 60 C160 62 184 90 180 126Z" fill="#7acb5a"/><path d="M90 66 l20 20 l-10 36 M130 62 v60 M168 72 l-24 24 M70 100 h110" stroke="#3a7a3a" stroke-width="5" fill="none"/><ellipse cx="206" cy="108" rx="30" ry="24" fill="#c9e68a"/>'+E2(214,100,6)+(open?mo(222,120,10,6):'<path d="M212 118 Q222 124 232 116" stroke="#3a7a3a" stroke-width="3" fill="none" stroke-linecap="round"/>')+'<ellipse cx="70" cy="144" rx="20" ry="12" fill="#c9e68a"/><ellipse cx="150" cy="146" rx="20" ry="12" fill="#c9e68a"/><path d="M30 130 L8 140 L34 138Z" fill="#c9e68a"/>');
  if(k==="Mono")return svg(200,250,'<path d="M40 150 C0 130 0 70 30 60" stroke="#8a5a30" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="150" rx="46" ry="60" fill="#8a5a30"/><ellipse cx="104" cy="160" rx="30" ry="42" fill="#e8c090"/><path d="M70 196 L60 240 h30 M130 196 L140 240 h-30" stroke="#8a5a30" stroke-width="18" stroke-linecap="round" fill="none"/><path d="M62 130 L30 170 M138 130 L168 170" stroke="#8a5a30" stroke-width="16" stroke-linecap="round"/><circle cx="100" cy="68" r="40" fill="#8a5a30"/><circle cx="58" cy="68" r="16" fill="#8a5a30"/><circle cx="142" cy="68" r="16" fill="#8a5a30"/><circle cx="58" cy="68" r="9" fill="#e8c090"/><circle cx="142" cy="68" r="9" fill="#e8c090"/><ellipse cx="100" cy="78" rx="28" ry="24" fill="#e8c090"/>'+E2(88,64,7)+E2(112,64,7)+(open?mo(100,88,10,9):'<path d="M88 88 Q100 96 112 88" stroke="#6a3a1a" stroke-width="4" fill="none" stroke-linecap="round"/>'));
  if(k==="Murciélago")return svg(260,170,'<path d="M130 70 C100 20 40 20 6 60 C30 56 40 76 56 70 C66 90 90 90 104 76 C112 90 124 96 130 100Z" fill="#4a3a5a"/><path d="M130 70 C160 20 220 20 254 60 C230 56 220 76 204 70 C194 90 170 90 156 76 C148 90 136 96 130 100Z" fill="#4a3a5a"/><ellipse cx="130" cy="104" rx="26" ry="36" fill="#6a5a7a"/><path d="M112 76 L108 44 L124 66Z M148 76 L152 44 L136 66Z" fill="#6a5a7a"/><circle cx="130" cy="82" r="24" fill="#6a5a7a"/>'+E2(121,80,6,"#e8402f")+E2(139,80,6,"#e8402f")+(open?mo(130,96,8,8)+'<path d="M126 90 l2 6 l2 -6Z M132 90 l2 6 l2 -6Z" fill="#fff"/>':'<path d="M122 94 Q130 100 138 94" stroke="#2a1a3a" stroke-width="3" fill="none" stroke-linecap="round"/>'));
  if(k==="Erizo")return svg(220,150,Array.from({length:22},(_,i)=>'<path d="M'+(30+i*7)+' '+(104-Math.sin(i/21*3.1)*60)+' L'+(26+i*7.6+(i<11?-12:12))+' '+(54-Math.sin(i/21*3.1)*50)+' L'+(42+i*7)+' '+(110-Math.sin(i/21*3.1)*56)+'Z" fill="#6a4a30"/>').join("")+'<path d="M24 120 C20 60 80 28 130 40 C176 52 196 96 184 124Z" fill="#7a5a3a"/><path d="M150 70 C180 70 214 100 210 122 L146 124Z" fill="#e8c090"/>'+E2(184,98,6)+'<circle cx="212" cy="114" r="6" fill="#222"/>'+(open?mo(196,122,8,5):'')+'<ellipse cx="70" cy="132" rx="16" ry="9" fill="#e8c090"/><ellipse cx="140" cy="134" rx="16" ry="9" fill="#e8c090"/>');
  if(k==="Armadillo")return svg(260,150,'<path d="M28 124 C20 60 96 30 160 44 C210 56 228 96 214 124Z" fill="#a8906a"/>'+[0,1,2,3,4].map(i=>'<path d="M'+(52+i*32)+' 124 C'+(46+i*32)+' 80 '+(66+i*32)+' 52 '+(80+i*32)+' 46" stroke="#7a6444" stroke-width="5" fill="none"/>').join("")+'<path d="M206 70 C240 74 258 100 252 118 L206 122Z" fill="#c8b088"/><path d="M208 70 L214 46 L226 72Z" fill="#a8906a"/>'+E2(232,92,5)+'<circle cx="254" cy="112" r="5" fill="#222"/>'+(open?mo(240,118,8,4):'')+'<path d="M28 120 L4 132 L30 134Z" fill="#a8906a"/><ellipse cx="80" cy="134" rx="16" ry="9" fill="#c8b088"/><ellipse cx="180" cy="136" rx="16" ry="9" fill="#c8b088"/>');
  if(k==="Pulpo")return svg(220,230,'<path d="M30 130 C20 50 70 14 110 14 C150 14 200 50 190 130Z" fill="#c86bd6"/>'+[0,1,2,3,4].map(i=>'<path d="M'+(40+i*36)+' 124 C'+(30+i*36)+' 170 '+(60+i*30)+' 190 '+(46+i*36)+' 220" stroke="#c86bd6" stroke-width="18" fill="none" stroke-linecap="round"/>').join("")+'<circle cx="60" cy="52" r="8" fill="#e8a0f0"/><circle cx="150" cy="44" r="6" fill="#e8a0f0"/>'+E2(80,98,12)+E2(140,98,12)+(open?mo(110,128,12,10):'<path d="M96 126 Q110 136 124 126" stroke="#7a2a8a" stroke-width="4" fill="none" stroke-linecap="round"/>'));
  if(k==="Delfín")return svg(300,170,'<path d="M10 120 C40 70 100 30 170 40 C230 48 262 80 292 74 C280 100 250 112 224 118 C190 150 100 160 54 140 C40 136 26 128 10 120Z" fill="#6aa8d8"/><path d="M60 130 C120 150 200 138 224 118 C190 150 100 160 54 140Z" fill="#e8f2fb"/><path d="M110 50 L128 6 L150 44Z" fill="#4a88b8"/><path d="M10 120 L-6 90 L24 104 L4 150Z" fill="#4a88b8"/><path d="M130 130 L150 168 L166 134Z" fill="#4a88b8"/>'+E2(244,84,7)+(open?'<path d="M262 80 L298 84 L262 96Z" fill="'+MOUTH+'"/>':'<path d="M262 92 L296 86" stroke="#2a5a88" stroke-width="4" stroke-linecap="round"/>'));
  if(k==="Pterodáctilo")return svg(300,180,'<path d="M150 70 C100 30 40 30 0 80 C40 70 60 90 76 106 C96 80 120 84 150 100Z" fill="#c08a5a"/><path d="M150 70 C190 20 250 24 290 70 C256 64 240 84 226 100 C206 80 184 86 150 100Z" fill="#c08a5a"/><ellipse cx="150" cy="110" rx="24" ry="38" fill="#a8744a"/><path d="M160 76 C190 50 220 50 258 62 L160 94Z" fill="#a8744a"/><path d="M150 74 L120 44 L156 68Z" fill="#c8502a"/>'+E2(176,72,6)+(open?'<path d="M164 90 L250 76 L250 90 L168 100Z" fill="'+MOUTH+'"/>':'<path d="M164 92 L252 74" stroke="#6a4020" stroke-width="3"/>'));
  if(k==="Sirena")return svg(180,300,'<path d="M60 150 C40 200 40 240 70 270 C50 280 30 290 20 296 C60 300 90 296 100 280 C110 296 140 300 170 296 C150 290 130 280 110 270 C140 240 140 200 120 150Z" fill="#2ab8a8"/><path d="M70 270 C50 280 30 290 20 296 C40 300 60 298 74 290Z" fill="#8adfd8"/><path d="M62 150 L118 150 L112 120 L68 120Z" fill="#ff7aa8"/><path d="M68 122 L50 168 M112 122 L130 168" stroke="#f1c9a0" stroke-width="14" stroke-linecap="round"/><path d="M52 40 C30 60 36 130 60 160 L70 120 Z M128 40 C150 60 144 130 120 160 L110 120Z" fill="#e85a4a"/><circle cx="90" cy="76" r="34" fill="#f1c9a0"/><path d="M56 70 C58 28 122 28 124 70 C112 50 70 50 56 70Z" fill="#e85a4a"/>'+E2(78,78,6)+E2(102,78,6)+(open?mo(90,98,8,7):'<path d="M80 96 Q90 104 100 96" stroke="#a04040" stroke-width="3.4" fill="none" stroke-linecap="round"/>')+'<circle cx="68" cy="92" r="6" fill="#ff8a8a" opacity=".5"/><circle cx="112" cy="92" r="6" fill="#ff8a8a" opacity=".5"/>');
  if(k==="Fantasma")return svg(170,230,'<path d="M20 200 V80 C20 30 150 30 150 80 V200 L126 180 L102 202 L78 180 L52 202Z" fill="#f4f6ff" stroke="#c8d0f0" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="90" r="9" fill="#2b2b44"/><circle cx="110" cy="90" r="9" fill="#2b2b44"/>'+(open?'<ellipse cx="85" cy="130" rx="14" ry="18" fill="#2b2b44"/>':'<path d="M68 128 Q85 142 102 128" stroke="#2b2b44" stroke-width="5" fill="none" stroke-linecap="round"/>')+'<circle cx="46" cy="116" r="8" fill="#ffb3cc" opacity=".6"/><circle cx="124" cy="116" r="8" fill="#ffb3cc" opacity=".6"/>');
  if(k==="Jirafa")return svg(250,380,'<rect x="60" y="260" width="16" height="110" rx="8" fill="#e8b040"/><rect x="96" y="260" width="16" height="110" rx="8" fill="#e8b040"/><rect x="150" y="260" width="16" height="110" rx="8" fill="#e8b040"/><rect x="182" y="260" width="16" height="110" rx="8" fill="#e8b040"/><ellipse cx="120" cy="250" rx="82" ry="46" fill="#f0c050"/><path d="M158 220 L176 40 L214 52 L190 230Z" fill="#f0c050"/><path d="M40 240 C20 250 14 280 22 306" stroke="#d99a30" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="196" cy="42" rx="40" ry="26" fill="#f0c050" transform="rotate(-14 196 42)"/><path d="M178 20 L172 -8 M196 14 L198 -12" stroke="#a8742a" stroke-width="6" stroke-linecap="round"/><circle cx="172" cy="-10" r="7" fill="#a8742a"/><circle cx="198" cy="-14" r="7" fill="#a8742a"/><path d="M168 26 L150 10 L176 34Z" fill="#f0c050"/>'+[[100,236,16],[140,262,14],[84,270,12],[174,136,14],[182,86,11],[170,190,13],[120,226,10],[60,246,12]].map(a=>'<circle cx="'+a[0]+'" cy="'+a[1]+'" r="'+a[2]+'" fill="#a8742a"/>').join("")+E2(206,38,6)+(open?'<ellipse cx="226" cy="58" rx="12" ry="8" fill="'+MOUTH+'"/>':'<path d="M214 56 Q226 62 236 54" stroke="#a8742a" stroke-width="4" fill="none" stroke-linecap="round"/>'),null,"0 -30 250 410");
  return svg(100,100,"");
}
const CRIT=[["Serpiente",230,["selva","latam","mar"]],["Cocodrilo",320,["africa","selva","mar"]],["Tortuga",200,["mar","latam"]],["Mono",190,["selva","latam"]],["Murciélago",200,["noct"]],["Erizo",170,["noct","bosque"]],["Armadillo",200,["latam","noct"]],["Pulpo",190,["mar"]],["Delfín",260,["mar"]],["Pterodáctilo",300,["prehi"]],["Sirena",230,["mito","mar"]],["Fantasma",190,["mito","noct"]],["Jirafa",380,["africa"]]];
for(const [k,sz,g] of CRIT){const c=critter(k,false),o=critter(k,true);reg("char",k,c,{alt:o.src,size:sz,grp:g});}

/* ---------- Animales con esqueleto (nuevas especies) ---------- */
Object.assign(SPECIES,{
  Tigre:{body:"#e8892c",belly:"#fff3dc",dark:"#2b2118",ear:"round",earIn:"#fff3dc",snout:"short",tail:"long",stripes:1,jaw:"#fff3dc",teeth:1,bw:1.08,bh:1.05,legH:58},
  "León":{body:"#d9a050",belly:"#f3deb9",dark:"#6a4020",ear:"round",earIn:"#f3deb9",snout:"short",tail:"tuft",mane:"#8a4a1c",jaw:"#f3deb9",teeth:1,bw:1.08,legH:62},
  Leopardo:{body:"#e8b050",belly:"#fbe3c2",dark:"#4a2a10",ear:"round",earIn:"#fbe3c2",snout:"short",tail:"long",spots:"#4a2a10",jaw:"#fbe3c2",legH:56},
  Pantera:{body:"#2e2e3a",belly:"#44445a",dark:"#111118",ear:"round",earIn:"#6a4a5a",snout:"short",tail:"long",jaw:"#44445a",eyeC:"#f0d040",legH:56,teeth:1},
  Guepardo:{body:"#e8c060",belly:"#fbf0d0",dark:"#2e2010",ear:"round",earIn:"#fbf0d0",snout:"short",tail:"long",spots:"#2e2010",jaw:"#fbf0d0",legH:84,legW:16,bw:.9,bh:.85},
  Cebra:{body:"#ffffff",belly:"#f0f0f0",dark:"#222222",ear:"point",earIn:"#222222",snout:"med",tail:"tuft",stripes:1,jaw:"#e8e8e8",legH:78,legW:20,hoof:"#222222"},
  "Hipopótamo":{body:"#9a8aa8",belly:"#c4b8d0",dark:"#5a4a68",ear:"small",earC:"#8a7a98",snout:"short",snoutS:1.25,tail:"puff",jaw:"#c4b8d0",legH:40,legW:34,bw:1.25,bh:1.2,headW:54,headH:46},
  Rinoceronte:{body:"#8a8f9a",belly:"#b0b4bc",dark:"#4a5060",ear:"small",earC:"#7a8090",snout:"short",horns:"rhino",hornC:"#d9d4c4",tail:"tuft",jaw:"#b0b4bc",legH:44,legW:32,bw:1.2,bh:1.12},
  Hiena:{body:"#b8a070",belly:"#d9c8a0",dark:"#3a2a18",ear:"round",earIn:"#3a2a18",snout:"med",tail:"bushy",spots:"#5a4028",jaw:"#d9c8a0",teeth:1,legH:64,bw:.95},
  Jaguar:{body:"#e0a030",belly:"#fff3dc",dark:"#2b1a08",ear:"round",earIn:"#fff3dc",snout:"short",tail:"long",spots:"#2b1a08",jaw:"#fff3dc",bw:1.08,legH:52,legW:28,teeth:1},
  Puma:{body:"#c8a070",belly:"#f3e0c0",dark:"#5a3a1a",ear:"round",earIn:"#f3e0c0",snout:"short",tail:"long",jaw:"#f3e0c0",legH:62},
  Llama:{body:"#f0e6d2",belly:"#ffffff",dark:"#7a6040",ear:"long",earIn:"#e8c8b8",snout:"med",tail:"puff",jaw:"#ffffff",legH:92,legW:16,bw:.95,bh:.9},
  Alpaca:{body:"#e8d4b0",belly:"#e8d4b0",dark:"#7a6040",wool:"#e8d4b0",headC:"#f3e6d0",snoutC:"#f3e6d0",ear:"long",earC:"#f3e6d0",snout:"med",tail:"puff",jaw:"#f3e6d0",nose:"#5a3a22",legW:18,legH:84,eyeC:"#fff",pupil:1},
  Capibara:{body:"#a07a50",belly:"#c4a070",dark:"#5a3a1a",ear:"small",earC:"#8a6a40",snout:"short",snoutS:1.1,tail:"deer",jaw:"#c4a070",legH:40,bw:1.15,bh:1.05,headW:50,headH:44},
  Huemul:{body:"#8a7050",belly:"#d9c8a0",dark:"#3a2a14",ear:"point",earIn:"#d9c8a0",horns:"antlers",hornC:"#5a4028",snout:"med",tail:"deer",jaw:"#d9c8a0",legH:88,legW:18,bw:.92,bh:.9},
  Mapache:{body:"#8a8f9a",belly:"#d9dce2",dark:"#2b2b33",ear:"round",earIn:"#2b2b33",snout:"med",tail:"long",stripes:1,jaw:"#d9dce2",legH:46,eyeC:"#f0f0f0",pupil:1},
  Zorrillo:{body:"#2b2b33",belly:"#2b2b33",dark:"#111118",ear:"round",earIn:"#555566",snout:"short",tail:"bushy",tip:"#ffffff",jaw:"#3a3a44",legH:44,bw:.95},
  "Gato negro":{body:"#2e2e3a",belly:"#44445a",dark:"#111118",ear:"point",earIn:"#6a4a5a",snout:"short",tail:"cat",whisk:1,jaw:"#44445a",nose:"#e0707a",eyeC:"#f0d040"},
  Tiranosaurio:{body:"#9a5a32",belly:"#d9b080",dark:"#4a2a14",ear:"none",snout:"med",snoutS:1.1,tail:"long",jaw:"#d9b080",teeth:1,legH:76,legW:34,bw:1.1,bh:1.1,headW:56,headH:46},
  Estegosaurio:{body:"#6a9a6a",belly:"#c4d8a8",dark:"#2e4a2e",ear:"none",snout:"short",tail:"long",plates:"#e0603a",jaw:"#c4d8a8",legH:48,legW:30,bw:1.15,bh:1.05},
  Velociraptor:{body:"#7a8a3a",belly:"#d9e08a",dark:"#3a4a14",ear:"none",snout:"fox",tail:"long",jaw:"#d9e08a",teeth:1,legH:80,legW:16,bw:.9,bh:.85},
  Anquilosaurio:{body:"#8a7a5a",belly:"#c8b88a",dark:"#4a3a22",ear:"none",snout:"short",tail:"long",plates:"#5a4a30",jaw:"#c8b88a",legH:42,legW:30,bw:1.2,bh:1},
  Mamut:{body:"#7a4a2a",belly:"#9a6a3a",dark:"#3a2012",ear:"cow",earIn:"#9a6a3a",snout:"fox",snoutS:1.5,snoutC:"#7a4a2a",horns:"tusk",hornC:"#f3e6c4",tail:"tuft",jaw:"#9a6a3a",legH:56,legW:38,bw:1.22,bh:1.2,headW:50,headH:46},
  "Dientes de sable":{body:"#d8a060",belly:"#f3deb9",dark:"#5a3a1a",ear:"round",earIn:"#f3deb9",snout:"short",tail:"cat",horns:"tusk",hornC:"#fffaf0",jaw:"#f3deb9",bw:1.1,legH:52,legW:28},
  Unicornio:{body:"#ffffff",belly:"#f0e6ff",dark:"#c8a0e8",ear:"point",earIn:"#f8d0f0",horns:"one",hornC:"#ffd34d",snout:"fox",tail:"bushy",tip:"#ff9ad0",jaw:"#f0e6ff",legH:92,legW:19,hoof:"#c8a0e8",mane:"#ff9ad0",maneS:.7},
  Pegaso:{body:"#ffffff",belly:"#e8f0ff",dark:"#9ac8ff",ear:"point",earIn:"#cfe0ff",snout:"fox",tail:"bushy",tip:"#9ac8ff",jaw:"#e8f0ff",legH:92,legW:19,hoof:"#9ac8ff",mane:"#9ac8ff",maneS:.7,wings:"#e8f0ff"},
  "Dragón":{body:"#c4402f",belly:"#ffd34d",dark:"#6a1a14",ear:"none",snout:"med",tail:"long",plates:"#ffd34d",wings:"#e8762c",jaw:"#ffd34d",teeth:1,legH:58,legW:30,bw:1.08,bh:1.1,headW:48,headH:42,eyeC:"#ffd34d"},
  "Dragón verde":{body:"#3a9a5a",belly:"#d9f08a",dark:"#1a4a2a",ear:"none",snout:"short",tail:"long",plates:"#8a3ad8",wings:"#8a3ad8",jaw:"#d9f08a",teeth:1,legH:56,legW:30,bw:1.1,bh:1.1,headW:48,headH:42,eyeC:"#f0d040"}
});
const QG={Tigre:["selva"],"León":["africa"],Leopardo:["selva","africa"],Pantera:["selva","noct"],Guepardo:["africa"],Cebra:["africa"],"Hipopótamo":["africa"],Rinoceronte:["africa"],Hiena:["africa","noct"],Jaguar:["latam","selva"],Puma:["latam"],Llama:["latam"],Alpaca:["latam"],Capibara:["latam","selva"],Huemul:["latam","bosque"],Mapache:["noct","bosque"],Zorrillo:["noct","latam"],"Gato negro":["noct","granja"],Tiranosaurio:["prehi"],Estegosaurio:["prehi"],Velociraptor:["prehi"],Anquilosaurio:["prehi"],Mamut:["prehi","frio"],"Dientes de sable":["prehi"],Unicornio:["mito"],Pegaso:["mito"],"Dragón":["mito"],"Dragón verde":["mito"]};
for(const k of Object.keys(QG)){
  const p=Object.assign({acc:"none"},SPECIES[k]),{c,o}=makeChar("quad",k,p);
  reg("char",k,c,{alt:o.src,lib:{kind:"quad",sp:k,p},tpl:"cuadrupedo",size:/Tiranosaurio|Mamut|Dragón|Hipo|Rino/.test(k)?400:340,grp:QG[k]});
}
Object.assign(PERSONS,{
  Gnomo:{skin:"#f1c9a0",hair:"#f2f2f2",shirt:"#4a9fd8",pants:"#6a3aa0",hairStyle:"calvo",acc:"gnomo",beard:"#f2f2f2",headS:1.1},
  Troll:{skin:"#7aa86a",hair:"#4a6a3a",shirt:"#8a6a4a",pants:"#5a4a3a",hairStyle:"rulos",headS:1.15,bodyW:1.3},
  Ogro:{skin:"#a0b060",hair:"#4a3a22",shirt:"#7a4a2a",pants:"#4a3a2a",hairStyle:"calvo",bodyW:1.45,headS:1.1},
  Vampiro:{skin:"#e8e0f0",hair:"#1a1a24",shirt:"#2a1a3a",pants:"#1a1a24",hairStyle:"corto",capeC:"#8a1a2a"}
});
for(const k of ["Gnomo","Troll","Ogro","Vampiro"]){const p=Object.assign({acc:"none"},PERSONS[k]),{c,o}=makeChar("person",k,p);reg("char",k,c,{alt:o.src,lib:{kind:"person",sp:k,p},tpl:"persona",size:k==="Gnomo"?230:(k==="Ogro"||k==="Troll"?340:300),grp:["mito","personas"]});}

/* ---------- Cielo: nubes, lunas, soles, estrellas ---------- */
const cl=(c,o)=>svg(240,130,'<g fill="'+c+'"'+(o?' opacity="'+o+'"':'')+'><ellipse cx="120" cy="92" rx="104" ry="30"/><circle cx="82" cy="66" r="38"/><circle cx="134" cy="52" r="46"/><circle cx="178" cy="76" r="32"/></g>');
reg("sky","Nube esponjosa",cl("#ffffff"),{grp:["nubes"]});
reg("sky","Nube pequeña",svg(150,84,'<g fill="#fff"><ellipse cx="75" cy="60" rx="64" ry="20"/><circle cx="52" cy="44" r="26"/><circle cx="88" cy="36" r="30"/></g>'),{grp:["nubes"]});
reg("sky","Nubes largas",svg(380,90,'<g fill="#fff" opacity=".92"><ellipse cx="190" cy="64" rx="180" ry="18"/><ellipse cx="120" cy="46" rx="70" ry="18"/><ellipse cx="270" cy="40" rx="80" ry="16"/></g>'),{grp:["nubes"]});
reg("sky","Nube gris",cl("#aab4c2"),{grp:["nubes"]});
reg("sky","Nube de lluvia",svg(240,200,'<g fill="#8a96a8"><ellipse cx="120" cy="82" rx="104" ry="28"/><circle cx="82" cy="58" r="36"/><circle cx="134" cy="44" r="44"/><circle cx="178" cy="68" r="30"/></g>'+[60,96,132,168,84,150].map((x,i)=>'<path d="M'+x+' '+(114+(i%2)*14)+' l-6 24" stroke="#7ac0e8" stroke-width="5" stroke-linecap="round"/>').join("")),{grp:["nubes"]});
reg("sky","Nube de tormenta",svg(240,210,'<g fill="#4a5568"><ellipse cx="120" cy="82" rx="104" ry="28"/><circle cx="82" cy="58" r="36"/><circle cx="134" cy="44" r="44"/><circle cx="178" cy="68" r="30"/></g><path d="M126 104 L100 154 L124 154 L110 204 L152 138 L128 138 L144 104Z" fill="#ffd34d" stroke="#f0a830" stroke-width="3" stroke-linejoin="round"/>'),{grp:["nubes"]});
reg("sky","Nube rosada",cl("#ffb3c8"),{grp:["nubes","atardecer"]});
reg("sky","Nube de atardecer",cl("#ffc78a"),{grp:["nubes","atardecer"]});
reg("sky","Nube sonriente",svg(240,130,'<g fill="#fff"><ellipse cx="120" cy="92" rx="104" ry="30"/><circle cx="82" cy="66" r="38"/><circle cx="134" cy="52" r="46"/><circle cx="178" cy="76" r="32"/></g><circle cx="106" cy="84" r="5" fill="#333"/><circle cx="140" cy="84" r="5" fill="#333"/><path d="M110 98 Q123 110 136 98" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="96" cy="96" r="6" fill="#ffb3c8" opacity=".7"/><circle cx="150" cy="96" r="6" fill="#ffb3c8" opacity=".7"/>'),{grp:["nubes"]});
reg("sky","Luna llena",svg(140,140,'<circle cx="70" cy="70" r="56" fill="#fff6d0"/><circle cx="50" cy="52" r="10" fill="#eadfae"/><circle cx="88" cy="84" r="14" fill="#eadfae"/><circle cx="92" cy="40" r="7" fill="#eadfae"/><circle cx="46" cy="92" r="6" fill="#eadfae"/>'),{grp:["lunas","noche"]});
reg("sky","Luna creciente",svg(140,140,'<path d="M92 12 A60 60 0 1 0 128 96 A50 50 0 1 1 92 12Z" fill="#fff6d0"/>'),{grp:["lunas","noche"]});
reg("sky","Luna sonriente",svg(150,150,'<path d="M96 10 A62 62 0 1 0 138 104 A52 52 0 1 1 96 10Z" fill="#fff0b0"/><circle cx="70" cy="76" r="5" fill="#6a5a2a"/><path d="M58 98 Q74 110 88 98" stroke="#6a5a2a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="54" cy="90" r="6" fill="#ffb3c8" opacity=".7"/>'),{grp:["lunas","noche"]});
reg("sky","Luna roja",svg(140,140,'<circle cx="70" cy="70" r="56" fill="#e8602a"/><circle cx="50" cy="52" r="10" fill="#c8481a"/><circle cx="88" cy="84" r="14" fill="#c8481a"/>'),{grp:["lunas","atardecer"]});
reg("sky","Estrella fugaz",svg(240,120,'<path d="M60 70 L226 18 L120 60Z" fill="#ffe9a0" opacity=".5"/><path d="M60 70 L226 18 L150 70Z" fill="#fff3c0" opacity=".35"/><path d="M50 30 L58 48 L78 50 L62 62 L66 82 L50 72 L34 82 L38 62 L22 50 L42 48Z" fill="#ffd34d" stroke="#ffb627" stroke-width="3" stroke-linejoin="round"/>'),{grp:["lunas","noche"]});
reg("sky","Estrellas",svg(240,140,[[30,30,14],[110,20,9],[190,40,16],[70,90,10],[150,100,13],[220,110,8],[20,120,8]].map(a=>'<path d="M'+a[0]+' '+(a[1]-a[2])+' L'+(a[0]+a[2]*.35)+' '+(a[1]-a[2]*.35)+' L'+(a[0]+a[2])+' '+a[1]+' L'+(a[0]+a[2]*.35)+' '+(a[1]+a[2]*.35)+' L'+a[0]+' '+(a[1]+a[2])+' L'+(a[0]-a[2]*.35)+' '+(a[1]+a[2]*.35)+' L'+(a[0]-a[2])+' '+a[1]+' L'+(a[0]-a[2]*.35)+' '+(a[1]-a[2]*.35)+'Z" fill="#fff6c0"/>').join("")),{grp:["lunas","noche"]});
reg("sky","Cometa",svg(260,110,'<path d="M20 60 C90 50 170 60 214 54 L214 70 C170 76 90 74 20 60Z" fill="#9ad8ff" opacity=".6"/><circle cx="222" cy="62" r="24" fill="#fff6d0"/><circle cx="222" cy="62" r="14" fill="#ffd34d"/>'),{grp:["lunas","noche"]});
reg("sky","Sol sonriente",svg(190,190,Array.from({length:12},(_,i)=>'<rect x="92" y="2" width="7" height="28" rx="3.5" fill="#ffb627" transform="rotate('+(i*30)+' 95 95)"/>').join("")+'<circle cx="95" cy="95" r="52" fill="#ffd34d"/><circle cx="78" cy="88" r="6" fill="#6a4a10"/><circle cx="112" cy="88" r="6" fill="#6a4a10"/><path d="M76 108 Q95 126 114 108" stroke="#6a4a10" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="66" cy="104" r="7" fill="#ff9a6a" opacity=".6"/><circle cx="124" cy="104" r="7" fill="#ff9a6a" opacity=".6"/>'),{grp:["soles"]});
reg("sky","Sol de atardecer",svg(220,130,'<path d="M10 130 A100 100 0 0 1 210 130Z" fill="#ff8a3a"/><path d="M34 130 A76 76 0 0 1 186 130Z" fill="#ffb347"/>'),{grp:["soles","atardecer"]});
reg("sky","Sol con rayos",svg(200,200,Array.from({length:16},(_,i)=>'<path d="M96 4 L104 4 L100 36Z" fill="#ffd34d" transform="rotate('+(i*22.5)+' 100 100)"/>').join("")+'<circle cx="100" cy="100" r="50" fill="#ffe066"/>'),{grp:["soles"]});
reg("sky","Arcoíris grande",svg(340,170,['#e8402f','#f0a830','#ffd34d','#6bbf59','#4a9fd8','#8a5ad6'].map((c,i)=>'<path d="M'+(14+i*11)+' 168 A'+(156-i*11)+' '+(156-i*11)+' 0 0 1 '+(326-i*11)+' 168" stroke="'+c+'" stroke-width="11" fill="none"/>').join("")),{grp:["nubes","dia"]});
reg("sky","Globo aerostático",svg(160,230,'<path d="M80 6 C14 6 4 90 52 140 L108 140 C156 90 146 6 80 6Z" fill="#e8402f"/><path d="M80 6 C50 20 46 110 62 140 M80 6 C110 20 114 110 98 140" stroke="#ffd34d" stroke-width="10" fill="none"/><path d="M52 140 L64 190 M108 140 L96 190" stroke="#7a5230" stroke-width="3"/><rect x="58" y="188" width="44" height="30" rx="5" fill="#a8743c"/>'),{grp:["dia"]});
reg("sky","Cohete",svg(110,240,'<path d="M55 4 C20 44 18 120 28 170 L82 170 C92 120 90 44 55 4Z" fill="#f0f4ff"/><path d="M55 4 C36 24 30 44 28 62 L82 62 C80 44 74 24 55 4Z" fill="#e8402f"/><circle cx="55" cy="96" r="16" fill="#6ac0f0" stroke="#8a96a8" stroke-width="5"/><path d="M28 130 L4 180 L28 168Z M82 130 L106 180 L82 168Z" fill="#e8402f"/><path d="M38 172 L55 232 L72 172Z" fill="#ffb627"/><path d="M46 172 L55 210 L64 172Z" fill="#ff7a2a"/>'),{grp:["espacio"]});
reg("sky","Planeta con anillo",svg(240,150,'<ellipse cx="120" cy="76" rx="110" ry="24" fill="none" stroke="#e8c070" stroke-width="10" transform="rotate(-16 120 76)"/><circle cx="120" cy="76" r="48" fill="#e8762c"/><path d="M80 64 Q120 50 160 66 M76 86 Q120 74 164 88" stroke="#c8602a" stroke-width="6" fill="none"/><path d="M20 94 Q120 110 220 58" stroke="#e8c070" stroke-width="10" fill="none" transform="rotate(-16 120 76)" opacity="0"/>'),{grp:["espacio"]});
reg("sky","Planeta azul",svg(130,130,'<circle cx="65" cy="65" r="56" fill="#4a9fd8"/><path d="M30 50 Q60 30 90 54 Q70 70 40 74Z M62 96 Q92 80 104 96 Q84 112 62 110Z" fill="#6bbf59"/><path d="M20 70 Q60 100 110 40" stroke="#fff" stroke-width="5" fill="none" opacity=".4"/>'),{grp:["espacio"]});

/* ---------- Aves y bichos voladores (objetos) ---------- */
reg("obj","Bandada",svg(260,110,[[20,60,1],[70,34,.9],[120,52,1.1],[170,24,.8],[220,60,1]].map(a=>'<path d="M'+a[0]+' '+a[1]+' q'+(14*a[2])+' -'+(16*a[2])+' '+(26*a[2])+' 0 q'+(12*a[2])+' -'+(16*a[2])+' '+(26*a[2])+' 0" stroke="#3a3a44" stroke-width="5" fill="none" stroke-linecap="round"/>').join("")),{grp:["aves"]});
reg("obj","Libélula",svg(150,90,'<ellipse cx="60" cy="26" rx="34" ry="12" fill="#bfe6ff" opacity=".8" transform="rotate(-16 60 26)"/><ellipse cx="90" cy="24" rx="34" ry="12" fill="#bfe6ff" opacity=".8" transform="rotate(16 90 24)"/><path d="M34 52 L128 46" stroke="#2ab8a8" stroke-width="9" stroke-linecap="round"/><circle cx="130" cy="46" r="10" fill="#2ab8a8"/><circle cx="134" cy="43" r="3" fill="#222"/>'),{grp:["bichos"]});
reg("obj","Luciérnaga",svg(100,90,'<circle cx="50" cy="56" r="34" fill="#fff59a" opacity=".35"/><ellipse cx="50" cy="56" rx="22" ry="14" fill="#ffe83a"/><ellipse cx="40" cy="34" rx="16" ry="9" fill="#bfe6ff" opacity=".8" transform="rotate(-30 40 34)"/><circle cx="76" cy="50" r="8" fill="#4a3a2a"/><circle cx="79" cy="48" r="2.4" fill="#fff"/>'),{grp:["bichos","noche"]});
reg("obj","Mariposa azul",svg(110,90,'<ellipse cx="32" cy="32" rx="28" ry="26" fill="#4a9fd8"/><ellipse cx="78" cy="32" rx="28" ry="26" fill="#4a9fd8"/><ellipse cx="36" cy="64" rx="20" ry="18" fill="#8ac8f0"/><ellipse cx="74" cy="64" rx="20" ry="18" fill="#8ac8f0"/><rect x="51" y="20" width="8" height="52" rx="4" fill="#2a2a44"/><circle cx="32" cy="32" r="8" fill="#fff" opacity=".7"/><circle cx="78" cy="32" r="8" fill="#fff" opacity=".7"/>'),{grp:["bichos"]});
reg("obj","Nido con huevos",svg(150,90,'<ellipse cx="75" cy="64" rx="66" ry="22" fill="#8a5a30"/><path d="M14 60 C30 80 120 80 136 60" stroke="#6a4020" stroke-width="5" fill="none"/><ellipse cx="54" cy="46" rx="14" ry="18" fill="#bfe6ff"/><ellipse cx="78" cy="42" rx="14" ry="18" fill="#f3e6c4"/><ellipse cx="102" cy="48" rx="14" ry="18" fill="#bfe6ff"/>'),{grp:["aves"]});
reg("obj","Pluma",svg(60,180,'<path d="M30 4 C60 40 58 110 30 176 C2 110 0 40 30 4Z" fill="#ff7aa8"/><path d="M30 8 V176" stroke="#c8486e" stroke-width="3"/><path d="M30 40 L12 56 M30 64 L10 84 M30 88 L12 108 M30 40 L48 56 M30 64 L50 84 M30 88 L48 108" stroke="#c8486e" stroke-width="2"/>'),{grp:["aves"]});

/* ---------- Plantas de varios lugares ---------- */
reg("arbol","Acacia",svg(260,260,'<path d="M126 260 C122 200 118 160 100 120 M130 150 C150 130 170 120 200 112" stroke="#6a4a2a" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="130" cy="104" rx="116" ry="30" fill="#4a8a3a"/><ellipse cx="86" cy="90" rx="66" ry="20" fill="#5aa048"/><ellipse cx="190" cy="96" rx="60" ry="18" fill="#5aa048"/>'),{grp:["africa"]});
reg("arbol","Baobab",svg(240,300,'<path d="M70 296 C86 240 74 190 82 140 L158 140 C166 190 154 240 170 296Z" fill="#a8743c"/><path d="M96 150 C94 200 100 250 98 290 M120 146 V290 M144 150 C148 200 142 250 146 290" stroke="#8a5a2a" stroke-width="4" fill="none" opacity=".6"/><path d="M84 140 C40 120 20 90 14 60 M156 140 C200 120 220 90 226 60 M120 140 V80" stroke="#8a5a2a" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="20" cy="50" r="32" fill="#5aa048"/><circle cx="220" cy="50" r="32" fill="#5aa048"/><circle cx="120" cy="64" r="44" fill="#4a8a3a"/><circle cx="64" cy="76" r="26" fill="#5aa048"/><circle cx="176" cy="76" r="26" fill="#5aa048"/>'),{grp:["africa"]});
reg("arbol","Palma de coco",svg(240,300,'<path d="M110 300 C100 230 116 170 130 110 L144 114 C130 176 118 236 128 300Z" fill="#a8743c"/>'+[-80,-52,-24,8,38,66,96].map((a,i)=>'<g transform="rotate('+a+' 136 112)"><path d="M136 112 C112 66 116 26 136 0 C156 26 162 66 136 112Z" fill="'+(i%2?"#3f9a4a":"#4aa456")+'"/></g>').join("")+'<circle cx="124" cy="120" r="10" fill="#6a4a2a"/><circle cx="148" cy="122" r="10" fill="#6a4a2a"/>'),{grp:["tropical"]});
reg("arbol","Banano",svg(220,280,'<rect x="96" y="120" width="26" height="160" rx="8" fill="#8aa84a"/>'+[-90,-58,-28,28,58,90].map((a,i)=>'<g transform="rotate('+a+' 109 120)"><path d="M109 120 C70 90 74 30 109 0 C144 30 148 90 109 120Z" fill="'+(i%2?"#4aa456":"#5ab862")+'"/><path d="M109 118 V8" stroke="#2f7a46" stroke-width="3"/></g>').join("")+'<path d="M116 136 q16 4 18 26 q-14 -6 -18 -26Z M104 136 q-16 4 -18 26 q14 -6 18 -26Z" fill="#ffd34d"/>'),{grp:["tropical","latam"]});
reg("arbol","Araucaria",svg(220,320,'<rect x="98" y="150" width="24" height="170" rx="6" fill="#6a4a2a"/><path d="M110 150 C70 140 40 120 20 90 C60 96 90 100 110 110 C130 100 160 96 200 90 C180 120 150 140 110 150Z" fill="#3a7a3a"/><path d="M110 108 C74 100 50 84 36 58 C70 64 94 70 110 78 C126 70 150 64 184 58 C170 84 146 100 110 108Z" fill="#4a8a46"/><path d="M110 74 C84 66 68 50 60 28 C86 32 100 38 110 44 C120 38 134 32 160 28 C152 50 136 66 110 74Z" fill="#5a9a52"/><path d="M104 22 L110 2 L116 22Z" fill="#5a9a52"/>'),{grp:["latam"]});
reg("arbol","Árbol de selva",svg(240,320,'<path d="M100 320 C104 250 96 200 110 150 L134 150 C148 200 138 250 144 320Z" fill="#6a4a2a"/><circle cx="120" cy="90" r="86" fill="#2f7a3a"/><circle cx="62" cy="128" r="54" fill="#3a8a46"/><circle cx="182" cy="126" r="56" fill="#3a8a46"/><circle cx="110" cy="54" r="40" fill="#4aa456"/><path d="M60 130 C54 180 66 200 60 230 M180 130 C186 170 174 200 182 236" stroke="#5aa048" stroke-width="6" fill="none"/>'),{grp:["selva","tropical"]});
reg("arbol","Hojas gigantes",svg(220,200,[-50,-20,10,40,70].map((a,i)=>'<g transform="rotate('+(a-10)+' 110 196)"><path d="M110 196 C60 150 66 50 110 6 C154 50 160 150 110 196Z" fill="'+(i%2?"#3f9a4a":"#2f8a3a")+'"/><path d="M110 190 V14" stroke="#1f6a2a" stroke-width="4"/></g>').join("")),{grp:["selva","tropical"]});
reg("arbol","Bambú",svg(160,300,[30,70,112].map((x,k)=>Array.from({length:6},(_,i)=>'<rect x="'+x+'" y="'+(k%2*14+i*46)+'" width="16" height="42" rx="5" fill="#8ac84a"/><rect x="'+(x-2)+'" y="'+(k%2*14+i*46+38)+'" width="20" height="6" rx="3" fill="#6aa83a"/>').join("")).join("")+'<path d="M46 60 L80 40 M120 110 L150 90" stroke="#6aa83a" stroke-width="5"/>'),{grp:["selva"]});
reg("arbol","Cactus saguaro",svg(140,240,'<rect x="52" y="12" width="36" height="226" rx="18" fill="#4a9a4a"/><path d="M52 130 H26 V80 M88 150 H114 V100" stroke="#4a9a4a" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 16 V230 M58 30 V220 M82 30 V220" stroke="#3a7a3a" stroke-width="2" opacity=".5"/>'),{grp:["nat","latam"]});
reg("arbol","Copihue",svg(160,190,'<path d="M80 190 V90" stroke="#4a8a3a" stroke-width="7"/>'+[[80,80,0],[56,110,-30],[104,110,30]].map(a=>'<g transform="rotate('+a[2]+' '+a[0]+' '+a[1]+')"><path d="M'+a[0]+' '+a[1]+' C'+(a[0]-28)+' '+(a[1]+20)+' '+(a[0]-24)+' '+(a[1]+66)+' '+a[0]+' '+(a[1]+74)+' C'+(a[0]+24)+' '+(a[1]+66)+' '+(a[0]+28)+' '+(a[1]+20)+' '+a[0]+' '+a[1]+'Z" fill="#d9203a"/><path d="M'+a[0]+' '+(a[1]+60)+' v26" stroke="#fff3dc" stroke-width="3"/></g>').join("")+'<path d="M80 130 C50 120 34 130 28 146 C54 148 70 142 80 130Z M80 140 C110 130 126 140 132 156 C106 158 90 152 80 140Z" fill="#4a8a3a"/>'),{grp:["latam","nat"]});
reg("arbol","Girasol",svg(140,220,'<rect x="64" y="90" width="10" height="130" fill="#4a8a3a"/><path d="M68 170 C34 160 24 176 28 190 C50 192 62 184 68 170Z M70 150 C104 140 116 156 112 170 C90 172 76 164 70 150Z" fill="#5aa048"/>'+Array.from({length:14},(_,i)=>'<ellipse cx="69" cy="36" rx="12" ry="30" fill="#ffd34d" transform="rotate('+(i*25.7)+' 69 70)"/>').join("")+'<circle cx="69" cy="70" r="26" fill="#6a4020"/>'),{grp:["nat"]});

/* ---------- Casas y construcciones ---------- */
reg("casa","Choza africana",svg(240,220,'<rect x="30" y="100" width="180" height="110" fill="#c88a50"/>'+Array.from({length:6},(_,i)=>'<path d="M'+(30+i*30)+' 100 V210" stroke="#a86a34" stroke-width="3"/>').join("")+'<path d="M10 106 L120 12 L230 106Z" fill="#e8c060"/>'+Array.from({length:8},(_,i)=>'<path d="M'+(20+i*28)+' 104 L120 24" stroke="#c8a040" stroke-width="3"/>').join("")+'<path d="M92 210 V150 Q120 120 148 150 V210Z" fill="#4a2a14"/>'),{grp:["africa","casas"]});
reg("casa","Ruca mapuche",svg(260,200,'<path d="M10 196 C20 80 80 30 130 28 C180 30 240 80 250 196Z" fill="#c8a850"/>'+Array.from({length:7},(_,i)=>'<path d="M'+(30+i*32)+' 190 Q'+(80+i*14)+' 90 130 30" stroke="#a88830" stroke-width="3" fill="none"/>').join("")+'<path d="M100 196 V140 Q130 112 160 140 V196Z" fill="#4a2a14"/>'),{grp:["latam","casas"]});
reg("casa","Casa colonial",svg(300,230,'<rect x="20" y="70" width="260" height="150" fill="#f6e0a8"/><path d="M10 74 H290 L270 40 H30Z" fill="#c4512f"/><rect x="20" y="206" width="260" height="14" fill="#c8a870"/>'+[44,120,200].map(x=>'<rect x="'+x+'" y="102" width="36" height="52" rx="18" fill="#3a6aa8" stroke="#fff" stroke-width="5"/>').join("")+'<path d="M126 220 V160 Q150 134 174 160 V220Z" fill="#7a4a28"/>'),{grp:["latam","casas","ciudad"]});
reg("casa","Templo maya",svg(300,240,'<rect x="10" y="190" width="280" height="46" fill="#a8a490"/><rect x="40" y="150" width="220" height="44" fill="#b8b4a0"/><rect x="70" y="110" width="160" height="44" fill="#a8a490"/><rect x="100" y="70" width="100" height="44" fill="#b8b4a0"/><rect x="124" y="30" width="52" height="44" fill="#a8a490"/><path d="M130 236 V170 H170 V236Z" fill="#5a5a48"/>'+[0,1,2,3].map(i=>'<path d="M'+(10+i*30)+' '+(236-i*0)+' h0" />').join("")+'<path d="M132 36 h36 M132 56 h36" stroke="#6a6a58" stroke-width="4"/>'),{grp:["latam","casas","cult"]});
reg("casa","Pirámide",svg(300,200,'<path d="M10 196 L150 10 L290 196Z" fill="#e8c070"/><path d="M150 10 L290 196 L190 196Z" fill="#c8a050"/><path d="M122 196 V150 H178 V196Z" fill="#3a2a14"/>'+[60,100,140].map(y=>'<path d="M'+(150-(196-y)*.73)+' '+y+' H'+(150+(196-y)*.73)+'" stroke="#b89040" stroke-width="3"/>').join("")),{grp:["africa","casas","cult"]});
reg("casa","Iglú",svg(240,170,'<path d="M10 166 C10 40 230 40 230 166Z" fill="#eef6ff" stroke="#bcd0e8" stroke-width="5"/>'+[60,96,132].map(y=>'<path d="M'+(20+(y-60)*.2)+' '+y+' H'+(220-(y-60)*.2)+'" stroke="#bcd0e8" stroke-width="3"/>').join("")+'<path d="M92 166 V120 Q120 92 148 120 V166Z" fill="#6a8aa8"/>'),{grp:["frio","casas"]});
reg("casa","Casa del árbol",svg(260,300,'<rect x="104" y="130" width="52" height="170" rx="8" fill="#7a5230"/><circle cx="130" cy="70" r="76" fill="#3f9a4a"/><circle cx="64" cy="110" r="50" fill="#4aa456"/><circle cx="196" cy="108" r="52" fill="#4aa456"/><rect x="66" y="110" width="128" height="76" fill="#c88a50"/><path d="M56 114 L130 62 L204 114Z" fill="#c4512f"/><rect x="112" y="134" width="36" height="52" rx="4" fill="#5a3a22"/><path d="M96 186 L80 240 M164 186 L180 240" stroke="#7a5230" stroke-width="5"/>'),{grp:["casas","bosque"]});
reg("casa","Molino",svg(200,280,'<path d="M60 276 L80 100 H120 L140 276Z" fill="#f3e6c4"/><path d="M52 104 H148 L100 56Z" fill="#c4512f"/>'+[0,90,180,270].map(a=>'<g transform="rotate('+(a+20)+' 100 100)"><rect x="94" y="8" width="12" height="92" fill="#8a5a2a"/><rect x="106" y="14" width="34" height="48" fill="#f3e6c4" stroke="#8a5a2a" stroke-width="3"/></g>').join("")+'<circle cx="100" cy="100" r="9" fill="#5a3a22"/><path d="M88 276 V220 Q100 204 112 220 V276Z" fill="#5a3a22"/>'),{grp:["casas"]});
reg("casa","Faro",svg(150,300,'<path d="M46 296 L62 80 H88 L104 296Z" fill="#fff"/>'+[0,1,2].map(i=>'<path d="M'+(52-i*4)+' '+(120+i*60)+' L'+(98+i*4)+' '+(120+i*60)+' L'+(96+i*4)+' '+(150+i*60)+' L'+(54-i*4)+' '+(150+i*60)+'Z" fill="#d9402f"/>').join("")+'<rect x="56" y="48" width="38" height="32" fill="#bfe6ff" stroke="#555" stroke-width="4"/><path d="M50 48 H100 L75 22Z" fill="#d9402f"/><circle cx="75" cy="64" r="8" fill="#ffd34d"/><path d="M60 296 V260 h30 V296Z" fill="#5a3a22"/>'),{grp:["casas","dia"]});
reg("casa","Tipi",svg(240,230,'<path d="M20 226 L120 14 L220 226Z" fill="#e8c890"/><path d="M120 14 L150 226 H220Z" fill="#d4ac6a"/><path d="M96 226 L120 120 L144 226Z" fill="#4a2a14"/><path d="M86 30 L100 -2 M154 30 L140 -2" stroke="#7a5230" stroke-width="5"/><path d="M50 170 H190" stroke="#c4512f" stroke-width="8"/>'),{grp:["casas","cult"]});

/* ---------- Objetos nuevos ---------- */
reg("obj","Moai",svg(110,240,'<path d="M20 236 C16 160 24 80 40 30 C56 6 80 8 92 30 C102 80 106 160 100 236Z" fill="#8a8678"/><path d="M34 70 Q56 60 82 70 L84 84 Q58 92 32 84Z" fill="#6a665a"/><path d="M52 100 L60 140 L72 100Z" fill="#6a665a"/><path d="M42 160 H80 V176 H42Z" fill="#6a665a"/><circle cx="46" cy="76" r="5" fill="#3a382e"/><circle cx="72" cy="76" r="5" fill="#3a382e"/>'),{grp:["cult","latam"]});
reg("obj","Tótem",svg(100,260,'<rect x="22" y="6" width="56" height="248" rx="8" fill="#a8743c"/><rect x="22" y="6" width="56" height="62" fill="#e8402f"/><path d="M26 28 L74 28 M30 44 H70" stroke="#fff" stroke-width="5"/><rect x="22" y="76" width="56" height="62" fill="#4a9fd8"/><circle cx="50" cy="106" r="18" fill="#ffd34d"/><circle cx="43" cy="102" r="3" fill="#222"/><circle cx="57" cy="102" r="3" fill="#222"/><rect x="22" y="146" width="56" height="62" fill="#6bbf59"/><path d="M28 176 L72 176 L50 156Z" fill="#fff"/><path d="M0 100 L22 94 V126 L0 116Z M100 100 L78 94 V126 L100 116Z" fill="#d9402f"/>'),{grp:["cult"]});
reg("obj","Tambor africano",svg(130,150,'<path d="M20 30 C20 14 110 14 110 30 V110 C110 134 20 134 20 110Z" fill="#a8743c"/><ellipse cx="65" cy="30" rx="45" ry="14" fill="#f3e6c4"/><path d="M26 40 L50 124 M54 42 L65 128 M104 40 L80 124 M76 42 L65 128" stroke="#e8c060" stroke-width="3" fill="none"/>'),{grp:["cult"]});
reg("obj","Canoa",svg(280,90,'<path d="M6 30 C50 80 230 80 274 30 C230 44 50 44 6 30Z" fill="#a8743c"/><path d="M6 30 C50 44 230 44 274 30" stroke="#7a5230" stroke-width="5" fill="none"/><path d="M60 52 H220" stroke="#7a5230" stroke-width="4" opacity=".6"/>'),{grp:["cult","nat"]});
reg("obj","Balsa",svg(260,70,Array.from({length:8},(_,i)=>'<rect x="'+(8+i*30)+'" y="10" width="24" height="52" rx="12" fill="'+(i%2?"#c8a050":"#b88a3c")+'"/>').join("")+'<path d="M0 36 H260" stroke="#7a5230" stroke-width="6"/>'),{grp:["cult","nat"]});
reg("obj","Charco",svg(220,60,'<ellipse cx="110" cy="34" rx="100" ry="22" fill="#6aa8d8"/><ellipse cx="96" cy="30" rx="60" ry="10" fill="#8ac8f0"/><path d="M60 40 q10 -5 20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>'),{grp:["nat"]});
reg("obj","Tronco caído",svg(260,90,'<rect x="10" y="20" width="240" height="56" rx="26" fill="#8a5a2c"/><ellipse cx="236" cy="48" rx="20" ry="28" fill="#d9a066"/><ellipse cx="236" cy="48" rx="11" ry="16" fill="none" stroke="#a8743c" stroke-width="3"/><path d="M30 30 H210 M24 52 H200 M34 68 H190" stroke="#6a4020" stroke-width="3" opacity=".6"/>'),{grp:["nat"]});
reg("obj","Nenúfar",svg(140,60,'<ellipse cx="70" cy="40" rx="62" ry="16" fill="#3f9a4a"/><path d="M70 40 L100 28" stroke="#2f7a3a" stroke-width="3"/><path d="M70 36 C60 16 70 6 70 4 C70 6 80 16 70 36Z M70 36 C46 26 44 14 44 12 C52 14 68 22 70 36Z M70 36 C94 26 96 14 96 12 C88 14 72 22 70 36Z" fill="#ff9ac0"/>'),{grp:["nat","tropical"]});
reg("obj","Cascada",svg(180,260,'<path d="M10 0 H170 V40 H10Z" fill="#7a7a86"/><path d="M40 40 H140 V250 H40Z" fill="#9ad8ff"/><path d="M56 40 V250 M80 40 V250 M104 40 V250 M126 40 V250" stroke="#fff" stroke-width="4" opacity=".6"/><ellipse cx="90" cy="250" rx="70" ry="12" fill="#cfeeff"/><path d="M10 40 H40 V250 H10Z M140 40 H170 V250 H140Z" fill="#6a6a76"/>'),{grp:["nat","selva"]});
reg("obj","Esqueleto de dino",svg(300,160,'<path d="M20 120 C60 100 90 70 130 70 C170 70 200 80 230 70 L270 50 L284 66 L240 96 C200 100 170 104 140 110 L110 150 M150 112 L136 150 M96 110 C70 120 40 126 6 150" stroke="#f3e6c4" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cx="268" cy="54" rx="24" ry="16" fill="#f3e6c4"/><circle cx="274" cy="50" r="5" fill="#3a2a14"/>'+Array.from({length:7},(_,i)=>'<path d="M'+(80+i*22)+' '+(78+Math.sin(i/6*3)*4)+' q-6 26 6 42" stroke="#f3e6c4" stroke-width="6" fill="none" stroke-linecap="round"/>').join("")),{grp:["nat","cosas"]});
reg("obj","Huellas",svg(220,70,[[20,44],[70,22],[120,44],[170,22]].map(a=>'<g fill="#6a4a30"><ellipse cx="'+a[0]+'" cy="'+a[1]+'" rx="12" ry="9"/>'+[-14,-5,5,14].map(d=>'<circle cx="'+(a[0]+d)+'" cy="'+(a[1]-14)+'" r="4"/>').join("")+'</g>').join("")),{grp:["nat","cosas"]});
reg("obj","Varita mágica",svg(160,160,'<path d="M20 140 L110 50" stroke="#6a4a2a" stroke-width="12" stroke-linecap="round"/><path d="M20 140 L40 120" stroke="#ffd34d" stroke-width="12" stroke-linecap="round"/><path d="M120 20 L128 40 L148 42 L132 54 L138 74 L120 62 L102 74 L108 54 L92 42 L112 40Z" fill="#ffd34d" stroke="#f0a830" stroke-width="3" stroke-linejoin="round"/><circle cx="148" cy="100" r="4" fill="#fff"/><circle cx="70" cy="30" r="3" fill="#fff"/>'),{grp:["magia"]});
reg("obj","Corona",svg(130,100,'<path d="M10 90 L10 30 L38 56 L65 12 L92 56 L120 30 L120 90Z" fill="#ffd34d" stroke="#e0a800" stroke-width="5" stroke-linejoin="round"/><circle cx="10" cy="28" r="7" fill="#e8402f"/><circle cx="65" cy="10" r="7" fill="#4a9fd8"/><circle cx="120" cy="28" r="7" fill="#6bbf59"/><rect x="10" y="74" width="110" height="16" fill="#f0a830"/>'),{grp:["magia"]});
reg("obj","Poción",svg(100,150,'<path d="M36 10 H64 V50 C96 70 100 110 90 130 C80 146 20 146 10 130 C0 110 4 70 36 50Z" fill="#c86bd6" opacity=".9"/><path d="M12 100 C30 90 70 110 92 98 C98 116 94 130 86 134 C70 146 30 146 14 134 C8 126 8 112 12 100Z" fill="#8a3ab8"/><rect x="34" y="2" width="32" height="16" rx="4" fill="#a8743c"/><circle cx="44" cy="90" r="5" fill="#fff" opacity=".6"/><circle cx="62" cy="76" r="4" fill="#fff" opacity=".6"/>'),{grp:["magia"]});
reg("obj","Libro de hechizos",svg(150,130,'<rect x="10" y="14" width="130" height="104" rx="8" fill="#6a2a8a"/><rect x="18" y="22" width="114" height="88" rx="4" fill="#8a3ab8"/><circle cx="75" cy="66" r="22" fill="none" stroke="#ffd34d" stroke-width="4"/><path d="M75 44 L81 60 L98 60 L84 70 L90 86 L75 76 L60 86 L66 70 L52 60 L69 60Z" fill="#ffd34d"/><rect x="10" y="14" width="10" height="104" fill="#4a1a6a"/>'),{grp:["magia"]});
reg("obj","Caldero",svg(170,150,'<ellipse cx="85" cy="44" rx="66" ry="16" fill="#2b2b33"/><path d="M19 44 C10 100 30 140 85 140 C140 140 160 100 151 44Z" fill="#3a3a44"/><ellipse cx="85" cy="44" rx="56" ry="11" fill="#6bbf59"/><circle cx="60" cy="38" r="8" fill="#9ae87a"/><circle cx="104" cy="34" r="6" fill="#9ae87a"/><circle cx="82" cy="24" r="5" fill="#9ae87a"/><path d="M40 146 L30 126 M130 146 L140 126" stroke="#2b2b33" stroke-width="8"/>'),{grp:["magia"]});
reg("obj","Escoba",svg(200,90,'<path d="M10 40 H140" stroke="#7a5230" stroke-width="8" stroke-linecap="round"/><path d="M140 26 C190 20 200 40 196 60 C190 78 160 74 140 56Z" fill="#e8c060"/><path d="M150 32 C168 40 176 50 178 64 M164 28 C180 36 190 46 190 60" stroke="#a88830" stroke-width="3" fill="none"/><rect x="138" y="30" width="10" height="28" fill="#6a4a2a"/>'),{grp:["magia"]});
reg("obj","Bola de cristal",svg(140,150,'<path d="M30 140 H110 L96 110 H44Z" fill="#6a4a2a"/><circle cx="70" cy="66" r="50" fill="#bfa8ff" opacity=".8"/><circle cx="70" cy="66" r="50" fill="none" stroke="#8a6ad8" stroke-width="4"/><path d="M42 46 Q56 30 76 34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/><path d="M60 78 L66 62 L72 78 L88 80 L74 88 L80 102 L66 94 L52 102 L58 88 L44 80Z" fill="#fff" opacity=".6"/>'),{grp:["magia"]});
reg("obj","Espada",svg(60,220,'<path d="M30 4 L42 130 H18Z" fill="#cfd8e4" stroke="#8a96a8" stroke-width="3" stroke-linejoin="round"/><path d="M30 12 V126" stroke="#fff" stroke-width="3" opacity=".7"/><rect x="4" y="130" width="52" height="12" rx="5" fill="#ffd34d"/><rect x="24" y="142" width="12" height="50" rx="4" fill="#7a4a28"/><circle cx="30" cy="200" r="11" fill="#ffd34d"/>'),{grp:["magia","cosas"]});
reg("obj","Escudo",svg(110,130,'<path d="M10 10 H100 V70 C100 100 70 120 55 126 C40 120 10 100 10 70Z" fill="#4a6ad8" stroke="#8a96a8" stroke-width="7"/><path d="M55 20 V118 M14 56 H96" stroke="#ffd34d" stroke-width="8"/>'),{grp:["magia","cosas"]});
reg("obj","Cuerno de unicornio",svg(70,170,'<path d="M35 4 L58 160 H12Z" fill="#ffe9a0" stroke="#e0b020" stroke-width="4" stroke-linejoin="round"/><path d="M20 130 L50 118 M23 100 L48 90 M27 70 L45 62 M30 42 L42 36" stroke="#e0b020" stroke-width="4"/>'),{grp:["magia"]});
reg("obj","Destello",svg(120,120,'<circle cx="60" cy="60" r="40" fill="#ffe0f8" opacity=".35"/><circle cx="60" cy="60" r="20" fill="#fff0ff" opacity=".7"/><path d="M60 36 L66 54 L84 60 L66 66 L60 84 L54 66 L36 60 L54 54Z" fill="#fff" />'),{grp:["magia"]});

/* ---------- Escenarios ---------- */
const starF=(n,ymax,seed)=>Array.from({length:n},(_,i)=>'<circle cx="'+(((i+seed)*137)%960)+'" cy="'+(((i+seed)*71)%ymax+10)+'" r="'+(i%4?1.4:2.6)+'" fill="#fff" opacity="'+(.5+(i%5)*.1)+'"/>').join("");
const sunC=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+(r*1.7)+'" fill="'+c+'" opacity=".25"/><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
const moonC=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+(r*1.8)+'" fill="#fff6d0" opacity=".12"/><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff6d0"/><circle cx="'+(x-r*.3)+'" cy="'+(y-r*.25)+'" r="'+(r*.18)+'" fill="#eadfae"/><circle cx="'+(x+r*.3)+'" cy="'+(y+r*.3)+'" r="'+(r*.24)+'" fill="#eadfae"/>';
const peak=(x,y,w,h,c,snow)=>'<path d="M'+(x-w/2)+' '+y+' L'+x+' '+(y-h)+' L'+(x+w/2)+' '+y+'Z" fill="'+c+'"/>'+(snow?'<path d="M'+x+' '+(y-h)+' L'+(x-w*.13)+' '+(y-h*.72)+' L'+(x-w*.04)+' '+(y-h*.78)+' L'+x+' '+(y-h*.68)+' L'+(x+w*.05)+' '+(y-h*.78)+' L'+(x+w*.13)+' '+(y-h*.72)+'Z" fill="#fff"/>':"");
const acaciaB=(x,y,s,c)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M0 0 C-2 -34 -8 -54 -22 -70 M2 -40 C16 -54 30 -60 50 -66" stroke="'+c+'" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="4" cy="-76" rx="60" ry="14" fill="'+c+'"/></g>';
const palmB=(x,y,s,c,lc)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M0 0 C-6 -40 4 -80 14 -110" stroke="'+c+'" stroke-width="9" fill="none" stroke-linecap="round"/>'+[-70,-38,-8,24,54,84].map(a=>'<path d="M14 -110 C-6 -134 -4 -156 14 -172 C34 -156 36 -134 14 -110Z" fill="'+lc+'" transform="rotate('+a+' 14 -110)"/>').join("")+'</g>';
const pineB=(x,y,s,c)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-5" y="-14" width="10" height="16" fill="#5a3a24"/><path d="M0 -120 L26 -66 H10 L34 -32 H12 L38 -2 H-38 L-12 -32 H-34 L-10 -66 H-26Z" fill="'+c+'"/></g>';
const BG=(name,svgv,g)=>reg("bg",name,svgv,{grp:g});
BG("Amanecer",sky("#ffb27a","#fff0c8",sunC(480,360,60,"#fff0a0")+hill("#8a9a5a",400)+hill("#5a7a3a",460)),["dia","atardecer"]);
BG("Día nublado",sky("#aab4c2","#e8edf2",'<g fill="#fff" opacity=".85"><ellipse cx="180" cy="100" rx="130" ry="34"/><ellipse cx="520" cy="70" rx="160" ry="40"/><ellipse cx="820" cy="120" rx="120" ry="32"/><ellipse cx="360" cy="170" rx="110" ry="26"/></g>'+hill("#7aa860",390)+hill("#5a8a48",450)),["dia"]);
BG("Día lluvioso",sky("#6a7a90","#aab4c2",'<g fill="#7a8698"><ellipse cx="180" cy="90" rx="150" ry="40"/><ellipse cx="560" cy="60" rx="180" ry="46"/><ellipse cx="860" cy="100" rx="120" ry="36"/></g>'+hill("#5a8a58",390)+hill("#3f7048",450)+Array.from({length:60},(_,i)=>'<path d="M'+((i*97)%960)+' '+((i*53)%420)+' l-8 28" stroke="#cfe6ff" stroke-width="2" opacity=".6"/>').join("")),["dia"]);
BG("Mediodía brillante",sky("#4aa8f0","#d8f0ff",sunC(480,90,46,"#fff3a0")+cloudsBg+hill("#8acb5c",390)+hill("#6abb48",450)),["dia"]);
BG("Noche de luna llena",sky("#0a1230","#1d2f66",starF(70,260,3)+moonC(720,120,60)+hill("#14243f",400)+hill("#0c1830",460)),["noche"]);
BG("Noche estrellada",sky("#05081c","#162a5a",starF(140,330,9)+hill("#0c1830",430)+hill("#060e20",480)),["noche"]);
BG("Bosque de noche",sky("#0a1230","#1d2f66",starF(50,200,5)+moonC(780,110,46)+[40,200,420,640,860].map(x=>'<rect x="'+x+'" y="130" width="34" height="320" fill="#1a1a24"/><circle cx="'+(x+17)+'" cy="130" r="72" fill="#14301f"/>').join("")+hill("#0f2a1c",400)+hill("#0a1c14",460)),["noche"]);
BG("Granja de noche",sky("#0a1230","#2a3a7a",starF(60,230,2)+moonC(240,100,42)+hill("#1a3a4a",380)+hill("#10283a",450)+'<rect x="690" y="270" width="150" height="120" fill="#6a1a1a"/><path d="M676 276 L704 226 H826 L854 276Z" fill="#401010"/><rect x="744" y="320" width="42" height="70" fill="#ffd34d" opacity=".85"/><rect x="860" y="236" width="40" height="154" rx="6" fill="#5a5870"/>'),["noche"]);
BG("Selva",sky("#a8e8a8","#e0f6c8",'<circle cx="780" cy="90" r="50" fill="#fff6a0" opacity=".6"/>'+[60,240,420,600,780,900].map((x,i)=>'<rect x="'+(x-14)+'" y="80" width="28" height="400" fill="'+(i%2?"#5a4028":"#6a4a30")+'"/>').join("")+[60,240,420,600,780,900].map((x,i)=>'<ellipse cx="'+x+'" cy="'+(60+(i%2)*30)+'" rx="110" ry="46" fill="'+(i%2?"#2f7a3a":"#3a8a46")+'"/>').join("")+hill("#2f7a3a",420)+hill("#1f5a2a",470)),["selva"]);
BG("Selva de noche",sky("#0a2030","#143a3a",starF(30,200,4)+moonC(760,90,40)+[60,240,420,600,780,900].map(x=>'<rect x="'+(x-14)+'" y="80" width="28" height="400" fill="#1a1a14"/>').join("")+[60,240,420,600,780,900].map((x,i)=>'<ellipse cx="'+x+'" cy="'+(60+(i%2)*30)+'" rx="110" ry="46" fill="#0f3a24"/>').join("")+hill("#0f3a24",420)+hill("#0a2a18",470)+Array.from({length:18},(_,i)=>'<circle cx="'+((i*173)%960)+'" cy="'+(220+((i*97)%220))+'" r="4" fill="#fff59a"/>').join("")),["selva","noche"]);
BG("Sabana africana",sky("#8ccdf5","#ffe9b0",sunC(760,110,46,"#ffd34d")+'<path d="M0 400 Q220 360 460 396 T960 380 V540 H0Z" fill="#d9b860"/><path d="M0 460 Q260 420 520 462 T960 440 V540 H0Z" fill="#c8a448"/>'+acaciaB(200,410,1.1,"#5a6a2a")+acaciaB(700,400,.8,"#5a6a2a")),["africa","dia"]);
BG("Sabana al atardecer",sky("#e8602a","#ffd390",sunC(480,330,90,"#ffe08a")+'<path d="M0 410 Q220 380 460 408 T960 394 V540 H0Z" fill="#7a4a2a"/><path d="M0 470 Q260 440 520 472 T960 456 V540 H0Z" fill="#4a2a1a"/>'+acaciaB(180,420,1.2,"#2a1a10")+acaciaB(760,410,.9,"#2a1a10")),["africa","atardecer"]);
BG("Playa",sky("#6ac0f0","#d8f4ff",sunC(800,100,46,"#fff3a0")+cloudsBg+'<rect y="330" width="960" height="90" fill="#3a9ad8"/><path d="M0 346 Q80 336 160 346 T320 346 T480 346 T640 346 T800 346 T960 346" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/><path d="M0 410 Q300 380 620 412 T960 404 V540 H0Z" fill="#f3dca0"/>'+palmB(130,430,.9,"#8a5a2a","#3f9a4a")),["dia","tropical"]);
BG("Playa de noche",sky("#0a1230","#1d3a7a",starF(60,240,7)+moonC(700,110,48)+'<rect y="330" width="960" height="90" fill="#10285a"/><path d="M0 410 Q300 380 620 412 T960 404 V540 H0Z" fill="#6a6a58"/>'+palmB(130,430,.9,"#2a1a10","#0f3a24")),["noche","tropical"]);
BG("Fondo del mar",sky("#6ad0f0","#0a4a8a",'<path d="M200 0 L340 540 L260 540 L140 0Z M520 0 L640 540 L580 540 L460 0Z M820 0 L900 540 L850 540 L760 0Z" fill="#fff" opacity=".07"/>'+Array.from({length:22},(_,i)=>'<circle cx="'+((i*149)%960)+'" cy="'+((i*83)%440+20)+'" r="'+(4+(i%4)*3)+'" fill="#fff" opacity=".35"/>').join("")+'<path d="M0 460 Q200 430 440 462 T960 450 V540 H0Z" fill="#e8d4a0"/>'+[80,300,540,800].map((x,i)=>'<path d="M'+x+' 470 C'+(x-20)+' 420 '+(x+20)+' 380 '+x+' 330" stroke="'+(i%2?"#2a9a5a":"#3aaa6a")+'" stroke-width="9" fill="none" stroke-linecap="round"/>').join("")),["mar","dia"]);
BG("Altiplano",sky("#6ab8f0","#e0f2ff",cloudsBg+peak(260,380,380,230,"#8a7a6a",true)+peak(700,380,300,170,"#9a8a78",true)+'<path d="M0 380 H960 V540 H0Z" fill="#c8a860"/><path d="M0 420 Q300 400 600 424 T960 410 V540 H0Z" fill="#b89a50"/><ellipse cx="560" cy="440" rx="190" ry="26" fill="#5ab8d8"/>'),["latam","dia"]);
BG("Patagonia",sky("#8ab8e0","#e8f2fa",cloudsBg+peak(180,390,200,260,"#6a6a78",true)+peak(330,390,180,310,"#7a7a88",true)+peak(470,390,160,230,"#6a6a78",true)+peak(780,390,300,200,"#7a7a88",true)+'<rect y="390" width="960" height="150" fill="#3aaec8"/><path d="M0 470 Q300 440 600 474 T960 462 V540 H0Z" fill="#7a8a4a"/>'),["latam","frio","dia"]);
BG("Río amazónico",sky("#b8e8b0","#e8f8d0",[0,160,320,480,640,800].map((x,i)=>'<ellipse cx="'+(x+60)+'" cy="'+(200+(i%2)*30)+'" rx="120" ry="130" fill="'+(i%2?"#2f7a3a":"#3a8a46")+'"/>').join("")+'<path d="M0 360 C240 330 700 380 960 340 V540 H0Z" fill="#8a6a40"/><path d="M0 400 C260 372 700 420 960 380 V470 C700 500 240 450 0 460Z" fill="#6ab0c8"/>'+palmB(60,440,.9,"#6a4a2a","#2f8a3a")+palmB(880,440,.9,"#6a4a2a","#2f8a3a")),["selva","latam","dia"]);
BG("Pueblo",sky("#8ccdf5","#f0f8ff",cloudsBg+hill("#9bd16b",420)+[[40,150,"#e8c060"],[190,120,"#d9704a"],[320,170,"#6aa8d8"],[470,130,"#e898b8"],[610,160,"#8ac060"],[760,120,"#e8c060"]].map(h=>'<rect x="'+h[0]+'" y="'+(420-h[1])+'" width="130" height="'+h[1]+'" fill="'+h[2]+'"/><path d="M'+(h[0]-8)+' '+(424-h[1])+' L'+(h[0]+65)+' '+(380-h[1])+' L'+(h[0]+138)+' '+(424-h[1])+'Z" fill="#8a3a2a"/><rect x="'+(h[0]+50)+'" y="360" width="30" height="60" fill="#5a3a22"/><rect x="'+(h[0]+14)+'" y="'+(430-h[1])+'" width="26" height="26" fill="#bfe6ff"/>').join("")),["dia","ciudad"]);
BG("Reino mágico",sky("#c8a0f0","#ffd8f0",starF(30,200,1)+['#e8402f','#f0a830','#ffd34d','#6bbf59','#4a9fd8','#8a5ad6'].map((c,i)=>'<path d="M'+(100+i*10)+' 400 A'+(380-i*10)+' '+(300-i*10)+' 0 0 1 '+(860-i*10)+' 400" stroke="'+c+'" stroke-width="10" fill="none" opacity=".55"/>').join("")+'<rect x="420" y="190" width="120" height="170" fill="#e8d8f8"/><rect x="380" y="150" width="46" height="210" fill="#d8c8f0"/><rect x="534" y="150" width="46" height="210" fill="#d8c8f0"/><path d="M372 152 L403 80 L434 152Z M526 152 L557 80 L588 152Z M440 192 L480 110 L520 192Z" fill="#e85a9a"/><path d="M450 360 V290 Q480 260 510 290 V360Z" fill="#8a5aa8"/>'+hill("#9ad88a",410)+hill("#6abb7a",460)),["fantasia","dia"]);
BG("Entre nubes",sky("#4aa8f0","#e8f6ff",[[100,120,1.3],[400,70,1.5],[780,130,1.2],[240,260,1.6],[620,300,1.4],[880,330,1.1],[60,400,1.5],[460,440,1.7]].map(a=>'<g fill="#fff" opacity=".92" transform="translate('+a[0]+' '+a[1]+') scale('+a[2]+')"><ellipse cx="0" cy="20" rx="90" ry="26"/><circle cx="-34" cy="2" r="30"/><circle cx="10" cy="-8" r="38"/><circle cx="50" cy="8" r="26"/></g>').join("")),["dia","espacio"]);
BG("Espacio",sky("#05040f","#1a1040",starF(150,520,6)+'<circle cx="760" cy="150" r="70" fill="#e8762c"/><path d="M700 130 Q760 110 820 134 M696 168 Q760 150 826 170" stroke="#c8602a" stroke-width="7" fill="none"/><circle cx="210" cy="380" r="40" fill="#4a9fd8"/><path d="M190 370 Q214 356 232 374 Q214 388 190 386Z" fill="#6bbf59"/><circle cx="480" cy="90" r="16" fill="#e0e0e8"/>'),["espacio","noche"]);
BG("Prehistórico de noche",sky("#2a0f14","#8a2a1a",starF(40,200,8)+'<path d="M560 420 L680 170 H800 L920 420Z" fill="#3a2220"/><path d="M680 170 Q740 196 800 170 Q780 140 740 144 Q700 140 680 170Z" fill="#ff7a2a"/><path d="M720 176 Q724 260 700 340 M770 180 Q780 280 810 380" stroke="#ff7a2a" stroke-width="12" fill="none" stroke-linecap="round"/>'+hill("#2a1a14",430)+hill("#1a100c",480)),["prehi","noche"]);
BG("Pantano",sky("#b8c8a0","#d8e0c0",'<g fill="#fff" opacity=".35"><ellipse cx="200" cy="250" rx="220" ry="40"/><ellipse cx="700" cy="220" rx="260" ry="46"/></g>'+[60,300,560,860].map(x=>'<path d="M'+x+' 430 C'+(x-10)+' 300 '+(x+10)+' 200 '+x+' 120" stroke="#4a3a24" stroke-width="22" fill="none"/><path d="M'+x+' 130 C'+(x-60)+' 150 '+(x-70)+' 220 '+(x-60)+' 260 M'+x+' 130 C'+(x+60)+' 150 '+(x+70)+' 220 '+(x+60)+' 260" stroke="#7a9a4a" stroke-width="5" fill="none"/>').join("")+'<rect y="400" width="960" height="140" fill="#5a7a4a"/><path d="M0 420 Q240 400 480 424 T960 412 V540 H0Z" fill="#4a6a3a"/>'),["selva","noche"]);
BG("Invierno nevado",sky("#c8dcf0","#f4f8ff",Array.from({length:50},(_,i)=>'<circle cx="'+((i*139)%960)+'" cy="'+((i*61)%420)+'" r="'+(2+(i%3))+'" fill="#fff"/>').join("")+peak(240,400,360,210,"#9ab0d0",true)+peak(720,400,320,170,"#8aa0c0",true)+pineB(80,430,1.1,"#2f6a4a")+pineB(360,440,1,"#2f6a4a")+pineB(560,436,1.3,"#2f6a4a")+pineB(880,432,1.1,"#2f6a4a")+'<path d="M0 410 Q240 380 480 412 T960 396 V540 H0Z" fill="#fff"/><path d="M0 470 Q300 440 620 474 T960 460 V540 H0Z" fill="#e6eef8"/>'),["frio","dia"]);
BG("Ciudad de noche",sky("#0a1230","#2a3a7a",starF(50,200,9)+moonC(820,100,36)+[[20,220],[130,300],[250,190],[380,330],[500,250],[620,310],[740,200],[860,280]].map(b=>'<rect x="'+b[0]+'" y="'+(450-b[1])+'" width="110" height="'+b[1]+'" fill="#10183a"/>'+Array.from({length:Math.floor(b[1]/34)},(_,r)=>[0,1,2].map(c=>((r*3+c+b[0])%4?'<rect x="'+(b[0]+14+c*32)+'" y="'+(466-b[1]+r*34)+'" width="18" height="18" fill="#ffd34d" opacity=".85"/>':"")).join("")).join("")).join("")+'<rect y="440" width="960" height="100" fill="#1a1a2a"/>'),["noche","ciudad"]);
BG("Aldea africana",sky("#8ccdf5","#ffe9b0",sunC(120,100,44,"#ffd34d")+'<path d="M0 400 Q220 370 460 398 T960 384 V540 H0Z" fill="#d9b860"/>'+[[180,1],[420,1.2],[700,.9]].map(h=>'<g transform="translate('+h[0]+' 420) scale('+h[1]+')"><rect x="-60" y="-70" width="120" height="70" fill="#c88a50"/><path d="M-76 -66 L0 -130 L76 -66Z" fill="#e8c060"/><path d="M-16 0 V-40 Q0 -56 16 -40 V0Z" fill="#4a2a14"/></g>').join("")+acaciaB(860,420,.8,"#5a6a2a")),["africa","dia"]);
BG("Selva con templo maya",sky("#a8e8a8","#e0f6c8",'<g transform="translate(480 440)"><rect x="-240" y="-40" width="480" height="40" fill="#8a8878"/><rect x="-190" y="-80" width="380" height="40" fill="#9a9888"/><rect x="-140" y="-120" width="280" height="40" fill="#8a8878"/><rect x="-90" y="-160" width="180" height="40" fill="#9a9888"/><rect x="-44" y="-200" width="88" height="40" fill="#8a8878"/></g>'+[40,150,810,920].map((x,i)=>'<rect x="'+(x-12)+'" y="100" width="24" height="380" fill="#5a4028"/><ellipse cx="'+x+'" cy="'+(90+(i%2)*20)+'" rx="100" ry="50" fill="#2f7a3a"/>').join("")+hill("#2f7a3a",440)+hill("#1f5a2a",490)),["latam","selva","dia"]);
BG("Granja de día soleado",sky("#4aa8f0","#d8f0ff",sunC(150,100,46,"#fff3a0")+hill("#9bd16b",380)+hill("#7bbf4f",450)+'<rect x="640" y="250" width="180" height="140" fill="#c4402f"/><path d="M624 256 L660 196 H800 L836 256Z" fill="#8a2a22"/><rect x="706" y="306" width="48" height="84" fill="#f3e6c4"/><path d="M706 306 L754 390 M754 306 L706 390" stroke="#c4402f" stroke-width="4"/><rect x="850" y="212" width="46" height="178" rx="6" fill="#b9b3c8"/>'),["dia"]);
/* suelos */
reg("ground","Pasto seco",gr("#c8a850","#dcc070"),{grp:["africa"]});
reg("ground","Hierba de noche",gr("#1f4a2a","#2f6a3a"),{grp:["noche"]});
reg("ground","Selva",gr("#2f6a30","#4a8a3a"),{grp:["selva"]});
reg("ground","Barro",gr("#6a4a2a","#8a6a3a"),{grp:["selva"]});
reg("ground","Roca volcánica",gr("#3a2a2a","#5a3a34"),{grp:["prehi"]});
reg("ground","Arena de playa",gr("#f3dca0","#fbeec0"),{grp:["tropical"]});
reg("ground","Fondo marino",gr("#e8d4a0","#f3e4b8"),{grp:["mar"]});
reg("ground","Nieve profunda",gr("#e6eef8","#ffffff"),{grp:["frio"]});
reg("ground","Adoquines",gr("#8a8a96","#a0a0ac"),{grp:["ciudad"]});
/* etiquetas de los recursos que ya existían */
const tag=(cat,names,g)=>{for(const a of (A[cat]||[]))if(names.includes(a.name))a.grp=(a.grp||[]).concat(g);};
tag("char",["Niña","Niño","Princesa","Caperucita","Bruja","Rey","Hada","Robot","Pirata","Abuela","Abuelo"],["personas"]);
tag("char",["Bruja","Hada","Rey","Princesa"],["mito"]);
tag("char",["Vaca","Cerdo","Oveja","Caballo","Cabra","Burro","Perro","Gato","Conejo","Pato","Pollito"],["granja"]);
tag("char",["Zorro","Lobo","Oso","Ciervo","Conejo","Búho"],["bosque"]);
tag("char",["Lobo","Búho","Zorro"],["noct"]);
tag("char",["Elefante"],["africa","selva"]);
tag("char",["Dinosaurio","Triceratops"],["prehi"]);
tag("char",["Rana","Pez"],["mar"]);tag("char",["Pato","Búho","Pollito"],["aves"]);tag("char",["Abeja"],["bichos"]);tag("char",["Rana"],["selva"]);
tag("obj",["Pájaro","Mariposa"],["aves","bichos"]);tag("obj",["Nube","Sol","Luna","Estrella","Arcoíris"],["cielo"]);

const VCACHE=new Map();
function variant(lib,mood,open){
  const p=Object.assign({},lib.p,{mood});
  const key=lib.kind+JSON.stringify(p)+(open?1:0);
  let v=VCACHE.get(key);
  if(!v){v=(lib.kind==="quad"?quadSvg:personSvg)(p,open).src;VCACHE.set(key,v);if(VCACHE.size>120)VCACHE.delete(VCACHE.keys().next().value);}
  return v;
}
root.Lib={GRPNAMES,MOODS,variant,SPECIES,PERSONS,EARS,HORNS,TAILS,SNOUTS,ACCS,HAIRS,PACCS,PAL,PALETTES,STORIES,redraw,quadSvg,personSvg};
})(window.EST=window.EST||{});
