/* Asistente de proyecto: 10 cuentos clásicos de dominio público, ya armados con fondos, personajes y narración.
   Todo es editable. Los personajes de animales son figuras de piezas pintadas con otros colores: se pueden
   cambiar en «Personajes» o reemplazar por un dibujo propio desde el Taller. */
(function(){
"use strict";
const rid=()=>Math.random().toString(36).slice(2,7)+Date.now().toString(36).slice(-3);
/* colores de personajes */
const P=(piel,pelo,camisa,pantalon,estilo,gorro,zapato)=>({piel,pelo,camisa,pantalon,pelo_estilo:estilo||"corto",gorro:gorro||null,zapato:zapato||"#4a3426"});
const CHAR={
 /* hum:nino, hum:nina, hum:cientifica, hum:abuelo son las cuatro figuras base */
 cerdo1:["Cerdito Paja","nino",P("#f6b3c4","#e58aa4","#f2d36b","#c9a24a","calvo")],
 cerdo2:["Cerdito Palos","nino",P("#f6b3c4","#e58aa4","#8a6a45","#6b4a2c","calvo")],
 cerdo3:["Cerdito Ladrillos","nino",P("#f6b3c4","#e58aa4","#c0503c","#3d4a6b","calvo")],
 lobo:["Lobo","nino",P("#8d8f9a","#5b5d68","#3b3d4a","#2a2c36","corto")],
 caperucita:["Caperucita","nina",P("#f1c49b","#5a3320","#d6283a","#6a4a8a","coletas","#d6283a")],
 abuela:["Abuelita","abuelo",P("#ecc3a0","#e6e6ea","#b78fc4","#6a5a7a","largo")],
 leniador:["Leñador","abuelo",P("#e3b48b","#4a3022","#2f7a4a","#4a4a5a","corto","#8a4a2a")],
 patito:["Patito","nino",P("#f4e27a","#e9cf4a","#f4e27a","#e9cf4a","calvo")],
 cisne:["Cisne","nina",P("#fbfbff","#ffffff","#f4f6ff","#e2e6f6","largo")],
 pata:["Mamá pata","nina",P("#f1d56a","#d9b84a","#e8c24c","#c9a23a","coletas")],
 liebre:["Liebre","nino",P("#cfa57a","#a9794a","#e57a3a","#3a4a7a","corto")],
 tortuga:["Tortuga","abuelo",P("#8fc98a","#4a7a4a","#4f9a5a","#3a6a3a","calvo")],
 ricitos:["Ricitos de Oro","nina",P("#f6d0ac","#f2c230","#6fa8e8","#e8dca0","largo")],
 oso:["Papá Oso","abuelo",P("#a9784a","#6a4426","#7a4e2a","#4a3320","calvo")],
 osa:["Mamá Osa","cientifica",P("#b98656","#6a4426","#c98a5a","#7a5636","largo")],
 osito:["Osito","nino",P("#b98656","#7a4e2a","#e8b05a","#6a4a2a","corto")],
 cigarra:["Cigarra","nina",P("#b9e08a","#4a7a2a","#5ab05a","#3a7a3a","largo")],
 hormiga:["Hormiga","cientifica",P("#d9544a","#2a1a16","#a8302a","#4a2a22","coletas")],
 gato:["Gato con Botas","nino",P("#e0a45a","#b8722a","#6a3ea8","#3a2a5a","corto","#8a2a2a","#2a1a12")],
 molinero:["Hijo del molinero","nino",P("#f0c29a","#5a3a22","#7a8ac8","#6a5a4a","corto")],
 rey:["Rey","abuelo",P("#ecbf98","#d8d8d8","#b8283a","#6a2a8a","calvo","#e8c43a")],
 hansel:["Hansel","nino",P("#f3c9a0","#7a4a28","#5a8ac8","#6a5a3a","corto")],
 gretel:["Gretel","nina",P("#f3c9a0","#e0a830","#e86a8a","#7a5a8a","coletas")],
 bruja:["La bruja","cientifica",P("#9bc48a","#2a2a30","#3a2a4a","#2a2030","largo","#2a2030")],
 leon:["León","abuelo",P("#e5b062","#b8742a","#d89a3a","#a8722a","largo")],
 raton:["Ratoncito","nino",P("#bdb6b0","#8a847e","#a09a94","#6a645e","corto")],
 burro:["Burro","nino",P("#b0a8a0","#6a6460","#8a847e","#5a544e","corto")],
 perro:["Perro","nino",P("#d8b27a","#8a5a2a","#a8742a","#5a3e22","corto")],
 gallo:["Gallo","nina",P("#f1d6b0","#d83a2a","#e8a02a","#c8501a","corto")],
 cazador:["Cazador","abuelo",P("#e0b088","#3a2a1a","#5a6a3a","#3a3a2a","corto","#5a6a3a")]
};
/* escena: n=nombre, f=fondo, hora, ef=efecto, deco=[[ref,x(0-1),y,escala,profundidad,mov]], act=[[clave,x(0-1),{flip,hasta(0-1)}]], lin=[[quien|null,texto]] */
const D=(ref,x,y,s,d,mov)=>[ref,x,y,s||1,d==null?50:d,mov||""];
const HIST=[
{id:"cerditos",n:"🐷 Los tres cerditos",d:"Tres hermanos construyen casas de paja, palos y ladrillos, y un lobo sopla fuerte.",f:"pradera",e:[
 {n:"Los tres hermanos",f:"pradera",deco:[D("nube",.2,130,1,10,"flotar"),D("arbol",.92,610,1.1,45,"mecer"),D("flores",.5,690,1,70,"mecer")],act:[["cerdo1",.2],["cerdo2",.5],["cerdo3",.8,{flip:1}]],
  lin:[[null,"Había una vez tres hermanos cerditos que decidieron hacerse cada uno su propia casa."],["cerdo1","¡Yo la haré de paja, así termino rápido!"],["cerdo3","Yo prefiero ladrillos. Es más trabajo, pero será más segura."]]},
 {n:"La casa de paja",f:"pradera",deco:[D("casa",.72,640,1,45),D("pasto",.3,700,1.2,72,"mecer"),D("nube",.5,110,1,10,"flotar")],act:[["lobo",.12,{hasta:.4}],["cerdo1",.8,{flip:1}]],
  lin:[["lobo","¡Cerdito, cerdito, déjame entrar!"],["cerdo1","¡No, no, por los pelos de mi barbilla!"],["lobo","¡Pues soplaré y soplaré, y tu casa derribaré!"]]},
 {n:"La casa de palos",f:"bosque",deco:[D("tronco",.2,650,1,40),D("arbusto",.85,660,1.2,66,"mecer"),D("casa",.7,640,1,45)],act:[["lobo",.1,{hasta:.4}],["cerdo2",.82,{flip:1}]],
  lin:[[null,"El lobo sopló y sopló, y la casa de palos también cayó. Los dos cerditos corrieron a casa de su hermano."],["cerdo2","¡Hermano, abre, que viene el lobo!"]]},
 {n:"La casa de ladrillos",f:"pradera",hora:"tarde",deco:[D("casa",.7,640,1.3,45),D("sol",.15,150,1,6,"girar"),D("arbusto",.3,670,1,66,"mecer")],act:[["lobo",.1,{hasta:.38}],["cerdo3",.55,{flip:1}],["cerdo1",.85,{flip:1}]],
  lin:[["lobo","¡Soplaré y soplaré, y tu casa derribaré!"],[null,"Sopló con todas sus fuerzas, pero la casa de ladrillos no se movió ni un poquito."],["cerdo3","¡Aquí estamos a salvo, hermanos!"]]},
 {n:"Fin",f:"pradera",hora:"tarde",deco:[D("arcoiris",.5,430,1,8),D("flores",.2,690,1,70,"mecer")],act:[["cerdo1",.3],["cerdo2",.5],["cerdo3",.7,{flip:1}]],
  lin:[[null,"Desde ese día, los tres cerditos vivieron felices en la casa de ladrillos. Y el lobo aprendió a no molestar."]]}]},
{id:"caperucita",n:"🧣 Caperucita Roja",d:"Una niña lleva comida a su abuelita y se cruza con un lobo en el bosque.",f:"bosque",e:[
 {n:"La casita del bosque",f:"bosque",deco:[D("casa",.78,640,1,45),D("arbol",.1,610,1.1,45,"mecer"),D("nube",.5,110,1,10,"flotar")],act:[["caperucita",.3],["abuela",.65,{flip:1}]],
  lin:[[null,"Caperucita Roja vivía cerca de un gran bosque. Un día su mamá le dio una canasta."],["caperucita","Llevaré estos pasteles a la abuelita, que está enferma."]]},
 {n:"El camino",f:"bosque",ef:"hojas",deco:[D("helecho",.15,650,1.2,40,"mecer"),D("tronco",.85,650,1,40),D("hongo",.5,690,1,68)],act:[["caperucita",.12,{hasta:.55}],["lobo",.8,{flip:1}]],
  lin:[["lobo","Buenos días, Caperucita. ¿Adónde vas tan sola?"],["caperucita","A la casa de mi abuelita, al otro lado del bosque."],[null,"El lobo sonrió con astucia y se fue corriendo por un atajo."]]},
 {n:"En casa de la abuelita",f:"bosque",hora:"tarde",deco:[D("casa",.5,640,1.3,45),D("arbusto",.1,670,1,66,"mecer")],act:[["lobo",.35],["caperucita",.85,{flip:1}]],
  lin:[["caperucita","Abuelita, ¡qué ojos tan grandes tienes!"],["lobo","Son para verte mejor."],["caperucita","¡Y qué dientes tan grandes!"],["lobo","¡Son para comerte mejor!"]]},
 {n:"El leñador",f:"bosque",deco:[D("tronco",.2,650,1,40),D("arbol",.9,610,1.1,45,"mecer")],act:[["leniador",.2,{hasta:.55}],["lobo",.78,{flip:1}],["caperucita",.5]],
  lin:[[null,"Los gritos de Caperucita llegaron hasta el leñador, que corrió con su hacha."],["leniador","¡Fuera de aquí, lobo!"],[null,"El lobo salió huyendo y nunca más volvió."]]},
 {n:"Fin",f:"pradera",hora:"tarde",deco:[D("sol",.8,150,1,6,"girar"),D("flores",.3,690,1,70,"mecer")],act:[["abuela",.35],["caperucita",.65,{flip:1}]],
  lin:[["abuela","Gracias por los pasteles, mi niña."],[null,"Caperucita aprendió a no hablar con extraños en el bosque. Fin."]]}]},
{id:"patito",n:"🦆 El patito feo",d:"Un patito rechazado por todos descubre quién es realmente (cuento de Andersen).",f:"costa",e:[
 {n:"El nuevo huevo",f:"pradera",deco:[D("nido",.5,660,1.2,50),D("pasto",.15,700,1.2,72,"mecer"),D("nube",.7,110,1,10,"flotar")],act:[["pata",.25]],
  lin:[[null,"En una granja, una mamá pata esperaba que nacieran sus patitos."],["pata","¡Qué lindos! Pero este último es más grande y diferente..."]]},
 {n:"Todos se ríen",f:"pradera",deco:[D("valla",.85,650,1.3,50),D("flores",.2,690,1,70,"mecer")],act:[["patito",.3],["gallo",.7,{flip:1}]],
  lin:[["gallo","¡Qué patito tan feo! ¡Vete de aquí!"],[null,"El patito se sintió tan triste que decidió irse lejos."]]},
 {n:"El invierno",f:"nevado",ef:"estrellas",deco:[D("pino",.2,620,1,45),D("pino",.85,620,1,45)],act:[["patito",.5]],
  lin:[[null,"Pasó un invierno largo y frío. El patito caminaba solo entre la nieve, buscando un lugar donde no lo rechazaran."]]},
 {n:"Primavera en el lago",f:"costa",deco:[D("sol",.85,140,1,6,"girar"),D("arbusto",.12,670,1,66,"mecer"),D("flores",.6,700,1,70,"mecer")],act:[["patito",.2,{hasta:.45}],["cisne",.78,{flip:1}]],
  lin:[[null,"Cuando llegó la primavera, vio a unos hermosos cisnes en el lago."],["cisne","Ven con nosotros, eres uno de los nuestros."]]},
 {n:"Fin",f:"costa",hora:"tarde",deco:[D("arcoiris",.5,430,1,8)],act:[["cisne",.4],["cisne",.62,{flip:1}]],
  lin:[[null,"El patito feo se miró en el agua y vio que se había convertido en un hermoso cisne. Nunca más se sintió solo."]]}]},
{id:"liebre",n:"🐢 La liebre y la tortuga",d:"Una carrera donde la constancia le gana a la prisa (fábula de Esopo).",f:"pradera",e:[
 {n:"El desafío",f:"pradera",deco:[D("arbol",.9,610,1.1,45,"mecer"),D("nube",.3,120,1,10,"flotar")],act:[["liebre",.3],["tortuga",.7,{flip:1}]],
  lin:[["liebre","¡Soy la más veloz del bosque! Nadie puede ganarme."],["tortuga","Yo te desafío a una carrera, amiga liebre."],["liebre","¡Ja, ja! ¡Acepto!"]]},
 {n:"¡Largada!",f:"pradera",deco:[D("cartel",.1,650,1,50,"mecer"),D("pasto",.5,700,1.2,72,"mecer")],act:[["liebre",.12,{hasta:.9}],["tortuga",.14,{hasta:.3}]],
  lin:[[null,"La liebre salió disparada y la tortuga comenzó a andar, paso a paso."]]},
 {n:"La siesta",f:"pradera",hora:"tarde",deco:[D("arbol",.5,610,1.3,45,"mecer"),D("sol",.85,150,1,6,"girar")],act:[["liebre",.55],["tortuga",.1,{hasta:.4}]],
  lin:[["liebre","Voy tan adelante que puedo echarme una siesta bajo este árbol."],[null,"Y la liebre se quedó profundamente dormida."]]},
 {n:"La meta",f:"pradera",deco:[D("cartel",.85,650,1.2,50),D("flores",.4,690,1,70,"mecer")],act:[["tortuga",.2,{hasta:.8}],["liebre",.1]],
  lin:[[null,"La tortuga no se detuvo ni un instante y cruzó la meta primero."],["tortuga","Despacio, pero sin parar, se llega lejos."]]}]},
{id:"ricitos",n:"🐻 Ricitos de Oro y los tres osos",d:"Una niña curiosa entra a una casa del bosque que no es suya.",f:"bosque",e:[
 {n:"La casa de los osos",f:"bosque",deco:[D("casa",.7,640,1.2,45),D("arbol",.12,610,1.1,45,"mecer")],act:[["osa",.3],["oso",.45],["osito",.58,{flip:1}]],
  lin:[[null,"En el bosque vivía una familia de osos: papá oso, mamá osa y el osito."],["osa","La sopa está muy caliente. Salgamos a pasear mientras se enfría."]]},
 {n:"Ricitos llega",f:"bosque",ef:"hojas",deco:[D("casa",.7,640,1.2,45),D("helecho",.15,650,1.2,40,"mecer")],act:[["ricitos",.12,{hasta:.5}]],
  lin:[[null,"Una niña llamada Ricitos de Oro encontró la casa vacía."],["ricitos","¡Qué rico huele! Probaré esta sopa... la pequeña está perfecta."]]},
 {n:"Las camas",f:"cueva",deco:[D("cofre",.8,690,1,55)],act:[["ricitos",.5]],
  lin:[["ricitos","Esta cama es muy dura, esta es muy blanda... ¡y esta es perfecta!"],[null,"Y se quedó dormida."]]},
 {n:"Los osos vuelven",f:"bosque",hora:"tarde",deco:[D("casa",.8,640,1,45)],act:[["oso",.2],["osa",.36],["osito",.5],["ricitos",.78,{flip:1}]],
  lin:[["osito","¡Alguien durmió en mi cama y todavía está ahí!"],["ricitos","¡Ay, perdón! ¡Me voy!"],[null,"Ricitos de Oro salió corriendo y nunca volvió a entrar a casas ajenas."]]}]},
{id:"cigarra",n:"🐜 La cigarra y la hormiga",d:"Una canta todo el verano y la otra trabaja: ¿quién tendrá comida en invierno? (Esopo)",f:"pradera",e:[
 {n:"Verano",f:"pradera",deco:[D("sol",.85,140,1,6,"girar"),D("flores",.2,690,1,70,"mecer"),D("mariposa",.6,300,1,30,"aletear")],act:[["cigarra",.3],["hormiga",.72,{flip:1}]],
  lin:[[null,"Era verano. La cigarra cantaba todo el día, mientras la hormiga cargaba granos de trigo."],["cigarra","¡Ven a cantar conmigo, hormiga!"],["hormiga","No puedo, debo guardar comida para el invierno."]]},
 {n:"Llega el otoño",f:"bosque",ef:"hojas",hora:"tarde",deco:[D("arbol",.85,610,1.1,45,"mecer"),D("hongo",.3,690,1,68)],act:[["hormiga",.5]],
  lin:[[null,"Las hojas cayeron y el aire se volvió frío. La hormiga seguía guardando su comida."]]},
 {n:"El invierno",f:"nevado",ef:"estrellas",deco:[D("pino",.9,620,1,45),D("casa",.7,640,1,45)],act:[["cigarra",.2,{hasta:.55}],["hormiga",.8,{flip:1}]],
  lin:[["cigarra","Hormiga, tengo mucha hambre y frío. ¿Me regalas un poco de comida?"],["hormiga","Mientras yo trabajaba, tú cantabas. Ahora te toca aprender."],[null,"Aun así, la hormiga le abrió la puerta, y la cigarra prometió trabajar desde la primavera."]]}]},
{id:"gato",n:"🐱 El gato con botas",d:"El gato más astuto ayuda a su amo a conseguir fortuna (Perrault).",f:"pradera",e:[
 {n:"La herencia",f:"pradera",deco:[D("casa",.82,640,1,45),D("arbol",.12,610,1.1,45,"mecer")],act:[["molinero",.35],["gato",.6,{flip:1}]],
  lin:[[null,"Un joven molinero heredó solamente un gato. Estaba muy triste."],["gato","No te preocupes, amo. Dame unas botas y un saco, y yo me encargo de todo."]]},
 {n:"Ante el rey",f:"patagonia",deco:[D("cartel",.1,650,1,50,"mecer")],act:[["gato",.2,{hasta:.4}],["rey",.78,{flip:1}]],
  lin:[["gato","Majestad, mi amo, el Marqués de Carabás, le envía este regalo."],["rey","¡Qué generoso marqués! Quiero conocerlo."]]},
 {n:"El río",f:"costa",deco:[D("roca",.15,660,1.2,64),D("puente",.7,660,1,50)],act:[["molinero",.4],["rey",.8,{flip:1}],["gato",.2,{hasta:.3}]],
  lin:[[null,"El gato hizo que su amo se bañara en el río y gritó pidiendo ayuda."],["rey","¡Pronto, que le traigan ropas finas al marqués!"]]},
 {n:"El castillo",f:"pradera",hora:"tarde",deco:[D("casa",.5,640,1.5,45),D("sol",.85,150,1,6,"girar")],act:[["molinero",.25],["rey",.75,{flip:1}]],
  lin:[[null,"El gato engañó a un ogro y consiguió su castillo para su amo."],["rey","Marqués de Carabás, ¡te doy la mano de mi hija!"],[null,"Y el gato con botas vivió como un señor para siempre."]]}]},
{id:"hansel",n:"🍬 Hansel y Gretel",d:"Dos hermanos se pierden en el bosque y encuentran una casa de dulces (Hermanos Grimm).",f:"bosque",e:[
 {n:"Migas de pan",f:"bosque",deco:[D("arbol",.12,610,1.1,45,"mecer"),D("arbol",.9,610,1.2,45,"mecer"),D("tronco",.5,650,1,40)],act:[["hansel",.3],["gretel",.5]],
  lin:[[null,"Hansel y Gretel eran dos hermanos que vivían cerca de un bosque muy espeso."],["hansel","Dejaré migas de pan para encontrar el camino de vuelta."],["gretel","Ojalá los pájaros no se las coman."]]},
 {n:"Perdidos",f:"bosque",hora:"noche",ef:"estrellas",deco:[D("pino",.15,620,1,45),D("hongo",.7,690,1.2,68)],act:[["hansel",.4],["gretel",.58]],
  lin:[[null,"Los pájaros se comieron las migas y los hermanos quedaron perdidos en la noche."]]},
 {n:"La casa de dulces",f:"bosque",deco:[D("casa",.65,640,1.3,45),D("flores",.2,690,1,70,"mecer")],act:[["hansel",.2,{hasta:.4}],["gretel",.1,{hasta:.3}]],
  lin:[["gretel","¡Mira, una casa hecha de pan y dulces!"],["hansel","¡Qué rico! ¡Probemos un poquito!"]]},
 {n:"La bruja",f:"cueva",deco:[D("cristal",.12,670,1,50,"pulso"),D("cofre",.85,690,1,55)],act:[["bruja",.65,{flip:1}],["hansel",.25],["gretel",.4]],
  lin:[["bruja","¡Entren, entren, mis niños! Los alimentaré bien."],["gretel","Hansel, esta bruja no es buena. Tenemos que escapar."]]},
 {n:"De regreso",f:"pradera",deco:[D("casa",.8,640,1,45),D("sol",.2,150,1,6,"girar"),D("flores",.5,690,1,70,"mecer")],act:[["hansel",.3],["gretel",.5]],
  lin:[[null,"Con astucia, los hermanos lograron escapar y volvieron a casa con un tesoro."],[null,"Y vivieron felices, sin volver a perderse jamás."]]}]},
{id:"leon",n:"🦁 El león y el ratón",d:"Un favor pequeño puede salvar una vida (fábula de Esopo).",f:"selva",e:[
 {n:"Una siesta interrumpida",f:"selva",deco:[D("palmera",.88,630,1.1,45,"mecer"),D("helecho",.12,650,1.2,40,"mecer")],act:[["leon",.4],["raton",.7,{flip:1,hasta:.55}]],
  lin:[[null,"Un ratoncito corrió sin querer sobre un león que dormía la siesta."],["leon","¡Grrr! ¿Quién se atreve a despertarme? Te voy a comer."],["raton","Perdóname, majestad. Algún día te devolveré el favor."]]},
 {n:"La trampa",f:"selva",hora:"tarde",deco:[D("arbusto",.15,670,1.3,66,"mecer"),D("tronco",.8,650,1,40)],act:[["cazador",.15,{hasta:.3}],["leon",.65]],
  lin:[[null,"Unos días después, el león cayó en la red de unos cazadores."],["leon","¡Socorro! ¿Alguien puede ayudarme?"]]},
 {n:"El ratón al rescate",f:"selva",deco:[D("palmera",.88,630,1.1,45,"mecer"),D("flores",.2,690,1,70,"mecer")],act:[["raton",.2,{hasta:.5}],["leon",.65]],
  lin:[["raton","¡Quédate quieto, león! Roeré las cuerdas."],[null,"Con sus pequeños dientes, el ratón rompió la red y liberó al león."],["leon","Nunca más despreciaré a nadie por ser pequeño."]]}]},
{id:"bremen",n:"🎺 Los músicos de Bremen",d:"Cuatro animales viejos se unen para formar una banda (Hermanos Grimm).",f:"bosque",e:[
 {n:"Cuatro amigos",f:"pradera",deco:[D("cartel",.85,650,1,50,"mecer"),D("arbol",.1,610,1.1,45,"mecer")],act:[["burro",.2],["perro",.4],["gato",.6],["gallo",.8,{flip:1}]],
  lin:[[null,"Un burro, un perro, un gato y un gallo ya estaban muy viejos para trabajar en sus granjas."],["burro","¡Vamos a la ciudad de Bremen a ser músicos!"]]},
 {n:"La casa de los ladrones",f:"bosque",hora:"noche",ef:"estrellas",deco:[D("casa",.75,640,1.2,45),D("pino",.1,620,1,45)],act:[["burro",.12,{hasta:.3}],["perro",.28],["gato",.4],["gallo",.52]],
  lin:[[null,"Al caer la noche vieron una casa con luz: allí vivían unos ladrones comiendo en la mesa."],["perro","¡Subámonos unos encima de otros y cantemos todos juntos!"]]},
 {n:"El gran concierto",f:"bosque",hora:"noche",ef:"estrellas",deco:[D("casa",.5,640,1.3,45),D("luna",.85,130,1,5,"flotar")],act:[["burro",.2],["perro",.38],["gato",.56],["gallo",.74,{flip:1}]],
  lin:[[null,"¡Iiiaaa, guau, miau, quiquiriquí! Los ladrones se asustaron tanto que salieron corriendo."],["gallo","¡La casa ahora es nuestra!"],[null,"Y los cuatro músicos vivieron felices en su nuevo hogar."]]}]}
];
const X=(f,w)=>Math.round(f*w);
/* construye el proyecto de una historia para el lienzo elegido */
function crear(id,lienzo,nombre){
  const h=HIST.find(x=>x.id===id);if(!h)throw new Error("Historia desconocida");
  const w=Studio.FMT[(lienzo&&lienzo.fmt)||"16:9"].w,esc=w<1000?.72:1,P={v:3,nombre:nombre||h.n.replace(/^[^\wÁ-ú]+/,""),tipo:"animacion",lienzo:Studio.lienzoDe({lienzo}),mundo:0,mundos:[],actores:[],imgs:{}};
  h.e.forEach((e,k)=>{
    const sc={nombre:e.n,dur:10,fondo:{id:e.f},hora:e.hora||"",items:[],cam:{z0:1,z1:1,x0:0,x1:0},lineas:[],efecto:e.ef||"",trans:k===0?"fundido":(k%2?"cortina":"fundido"),textos:[]};
    for(const [ref,fx,y,s,d,mov] of e.deco||[])sc.items.push({uid:"i"+rid(),kind:"deco",ref,x:X(fx,w),y,s:s*(w<1000?.8:1),d,mov});
    const uids={};
    for(const [key,fx,o0] of e.act||[]){
      const c=CHAR[key],o=o0||{};const it={uid:"i"+rid(),kind:"actor",ref:"hum:"+c[1],ficha:{nombre:c[0]},pal:Object.assign({},c[2]),x:X(fx,w),y:650,s:1.45*esc,d:60,flip:o.flip?1:0,paso:1};
      if(o.hasta!=null){it.go={x1:X(o.hasta,w),y1:650,t0:.6,t1:7};}
      uids[key]=it.uid;sc.items.push(it);}
    let t=.8;
    for(const [q,txt] of e.lin||[]){sc.lineas.push({id:"l"+rid(),txt,quien:(q&&uids[q])||"",t0:+t.toFixed(1)});t+=Math.max(2.4,txt.length/12.5+.7);}
    sc.dur=Math.max(8,Math.ceil(t+1.2));
    if(k===0)sc.textos.push({tipo:"titulo",txt:P.nombre,x:50,y:16,size:w<1000?6:8,t0:.3,t1:4});
    if(k===h.e.length-1&&h.e.length>1)sc.textos.push({tipo:"titulo",txt:"Fin",x:50,y:20,size:8,t0:Math.max(2,sc.dur-4),t1:sc.dur});
    P.mundos.push(sc);
  });
  /* los personajes de animales quedan en el proyecto con su nombre para el estudio de grabación */
  return P;
}
window.Historias={LISTA:HIST.map(h=>({id:h.id,n:h.n,d:h.d,escenas:h.e.length})),crear,CHAR};
})();
