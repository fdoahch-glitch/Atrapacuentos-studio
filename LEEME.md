# Atrapacuentos Studio de escritorio (Windows y Linux)

Con esto el Studio se instala como un programa normal: guarda tus cuentos en archivos,
graba la voz sin permisos raros y baja el MP4 directo a tu computador. Funciona sin internet.

## Qué necesitas (una sola vez)
1. Instalar **Node.js** (versión LTS): https://nodejs.org
2. Descomprimir esta carpeta, por ejemplo en `C:\atrapacuentos-escritorio`.

## Paso 1: copiar el Studio
Copia **todo el contenido** del Studio (el `index.html` y las carpetas `js`, etc.)
dentro de la carpeta `web` de este paquete. Ya viene lista: si `web\index.html` existe, sigue.

## Paso 2: probarlo
Abre una terminal en esta carpeta (en Windows: clic derecho dentro de la carpeta → "Abrir en Terminal") y escribe:

    npm install
    npm start

Se abre el Studio como programa. Prueba: ▶ vista previa, 🎙️ doblaje y 🎞️ exportar MP4.
El botón 🩺 revisa tu equipo y te dice si algo no funciona.

## Paso 3: crear el instalador
Para Windows:

    npm run dist:win

Para Linux:

    npm run dist:linux

Los instaladores quedan en la carpeta `instaladores` (en Windows: un instalador `.exe` y una versión portable
que no necesita instalarse; en Linux: `.AppImage` y `.deb`).

## Cómo se usa
- **Archivo → Guardar proyecto** crea un archivo `.atrapacuentos` con tu cuento (incluye las voces).
- **Archivo → Abrir proyecto** lo recupera, en este u otro computador.
- Al exportar, el programa te pregunta dónde guardar el MP4.
- Los cambios también se guardan solos mientras trabajas.

## Fondos con profundidad y reconstrucción
- **Fondo con profundidad** y **Reconstruir desde imagen** funcionan igual que en el navegador (panel «Fondo»).
- **🧠 Relieve con IA** descarga un modelo la primera vez (necesita internet y ~100 MB); después queda guardado en el programa.
  Sin internet puedes usar «Automático» o el pincel.

## Subtítulos y grabaciones
- **💬 Subtítulos** tiene su propio panel: activar/desactivar, letra, tamaño, colores, contorno, sombra, fondo, posición, y exportar `.srt`/`.vtt`.
- **Doblaje → Exportar grabaciones** crea un `.zip` con una voz por línea para editarla en otro programa. Luego **Importar grabaciones editadas** las vuelve a subir y el Studio las ajusta.

## Estudio de doblaje completo
Grabar con teleprompter y medidor de micrófono (elige micrófono), subir audio, **✂ Editar voz** (recortar, volumen, fundidos, tono, normalizar, deshacer), **efectos de sonido** (pasos, puerta, lluvia, trueno…), duplicar líneas, subtítulos con estilo, música con bajada automática y exportar/importar grabaciones.

## Si algo falla
Abre 🩺 Revisar mi equipo → "Copiar informe" y envíamelo.

## 📦 Paquetes (colecciones propias)
Botón **📦 Paquetes** en la biblioteca. Importa un `.zip` de Kenney, Quaternius, KayKit… (modelos `.glb`/`.gltf`), o crea un paquete vacío (ej. «Selva»), súbele assets y guarda tus escenas dentro. Todo queda guardado en tu PC y los elementos aparecen también en sus categorías (Árboles, Rocas…). Los FBX/OBJ no se pueden usar: busca la versión GLB/glTF.

## 🎬 Modo Serie (nuevo)
Al abrir el programa entra directo al editor de recortes: 1 Elenco · 2 Escena · 3 Voces · 4 MP4.
El Studio 3D anterior sigue disponible en 💾 Proyecto → «Avanzado».

## 🎭 Novedades de movimiento (Modo Serie)
- **Acciones rápidas** en cada personaje: saludar, señalar (a otro personaje u objeto), saltar, bailar, asustarse, reír, pensar.
- **Caras**: parpadeo automático, cara feliz/triste/sorprendida/enojada; los humanos se ven de frente y de perfil al caminar.
- **Sincronía de labios** por sonidos (a, o, e/i, s) usando tu grabación.
- **Fotogramas clave** (posición y tamaño en el tiempo) y **cámara que sigue** a un personaje.
- **Sonido por escena**: volumen de la música y ambiente (viento, lluvia, pajaritos).
- **Taller**: «✨ Armar con puntos» (corta las piezas solo) y **✏️ Dibujo cuadro a cuadro** con papel cebolla.

## Novedades de esta versión
- **IA sin internet** (todo viene dentro del programa):
  - ✂ Quitar el fondo de una imagen o de un personaje al subirlo (te pregunta si quieres).
  - 📝 Escribir lo que dice una voz (Whisper pequeño): botón en cada línea del estudio de grabación.
  - 👄 Labios que siguen los sonidos (Rhubarb): botón en cada línea con voz.
- **Editor de curvas**: gráfico de cada propiedad con puntos que se arrastran y curvas Bézier propias (botón «📈 Editor de curvas»).
- **Poses y ciclos**: crea poses (brazos, piernas, cabeza…), guárdalas y ponlas en la línea de tiempo; ciclos de caminata (trote, sigilo, cansado…) y tus propios ciclos.
- **Mezcla de acciones**: cada acción tiene cuánto dura, cuánto tarda en entrar y salir, y su fuerza (botón ⚙ Mezcla).
- **Cortes de cámara** dentro de una escena (planos general, medio, primer plano…).
- **Sombras reales** con la silueta del personaje.
- **Dibujo**: capas de pintura y vectoriales, pinceles, relleno, lazo, pluma Bézier, deshacer, SVG.
- **Importar** dibujos SVG y archivos PSD (Photoshop) con capas.
- **Audio estéreo y eco** (sala, pasillo, cueva, bosque) por línea de voz.
- **Plantillas**, **Mi biblioteca** (personajes, escenas, poses, ciclos entre proyectos) y **Carpeta del proyecto** con copias de seguridad.
- **Exportar en segundo plano** con cola: sigues editando mientras se crea el MP4.
- Paneles que se sacan a otro monitor, pistas, esqueleto automático, look de cine, 2K/4K.

## Si quieres subirlo a GitHub
Crea un repositorio privado y sube esta carpeta. La carpeta `.github/workflows` ya trae las instrucciones para que GitHub cree
solo el instalador de Windows (.exe) y el de Linux cada vez que subas cambios (pestaña «Actions» → «Artifacts»).

## Límites que conviene saber
- El reconocimiento de voz es el modelo *pequeño* de Whisper: sirve para borradores de subtítulos, pero revisa el texto.
- Rhubarb está pensado para inglés; en español mueve la boca de forma aproximada.
- Exportar en segundo plano usa el mismo procesador: el editor puede ir más lento mientras tanto.
- Si tu equipo no puede guardar audio AAC en el MP4, se usa Opus (YouTube lo acepta).

## 🏠 Pantalla de inicio (nuevo)
Al abrir el programa aparece un inicio con tres opciones:
- **Crear proyecto nuevo**: eliges *Animación* (una pieza) o *Serie* (varios capítulos), el formato (16:9 YouTube, 9:16 Shorts/Reels, 1:1 cuadrado), la resolución base (720p, 1080p, 2K, 4K) y los cuadros por segundo. El lienzo queda totalmente en blanco, con fondo liso.
- **Abrir proyecto guardado**: archivos `.atrapa` o `.atrapacuentos`. Si hay un guardado automático, también aparece «Continuar».
- **Asistente de proyecto**: 10 cuentos clásicos de dominio público ya armados (Los tres cerditos, Caperucita Roja, El patito feo, La liebre y la tortuga, Ricitos de Oro, La cigarra y la hormiga, El gato con botas, Hansel y Gretel, El león y el ratón, Los músicos de Bremen), con escenas, fondos y narración editables, en el formato que elijas.

El lienzo se puede cambiar después en **💾 Proyecto → Configuración del lienzo**. Al exportar, la calidad elegida es el lado corto del video (en vertical, 1080p = 1080×1920).
