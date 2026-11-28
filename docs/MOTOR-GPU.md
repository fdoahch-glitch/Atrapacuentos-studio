# Motor gráfico GPU (Babylon.js) · estado

Rama `migracion-babylon`. El dibujo clásico (Canvas 2D) sigue existiendo como respaldo y es el motor por defecto.
Se cambia en **💾 Proyecto → Motor gráfico**: *Clásico*, *GPU · WebGL2* o *GPU · WebGPU*. La elección queda guardada.

## Cómo está armado
| Pieza | Archivo | Qué hace |
|---|---|---|
| Babylon empaquetado | `web/vendor/babylon-motor.js` (2,8 MB) | Motor, cámara ortográfica, materiales, cargador de `.glb`. Se genera con `npm run build:motor` en `herramientas/babylon`. Sin internet. |
| Compositor GPU | `web/js/gpu_escena.js` | Dibuja fondo, decoración, imágenes, personajes por piezas y modelos 3D en la tarjeta de video. |
| Aspecto en GPU | `web/js/gpu_aspecto.js` | Brillo suave, luz de foco, color, saturación, viñeta y grano con un shader. |
| Puente | `serie.js` (`SerieGpuApi`, `frame()`) | Presta al compositor la misma matemática del dibujo clásico (posición, zoom, paralaje, giro, opacidad). |
| Matemática de personajes | `serie_rig.js` (`partes`) | Calcula dónde queda cada vértice de cada pieza; la usan el dibujo clásico y la GPU. |

## Qué corre en GPU
- **Fondo** con capas de paralaje (2,5D), fondo de imagen y color liso.
- **Decoración e imágenes** (2D) como planos con mipmaps y filtrado anisotrópico.
- **Personajes por piezas** como mallas deformables, con sombra suave y sombra proyectada (stencil: una sola silueta).
- **Modelos 3D `.glb`** con animación, en la misma escena. El orden de profundidad es exacto (grupos de dibujo).
- **Atardecer / noche** (multiplicación de color) y el **aspecto** (bloom, foco, calor/frío, saturación, viñeta, grano).

## Qué sigue en 2D (por ahora)
- Atmósfera (polvo, niebla, rayos, viento, chispas, confeti, cenizas, relámpagos): se dibuja con el código de siempre sobre el cuadro.
- Títulos, subtítulos, transiciones y efectos de `fx.js`: capa 2D encima del cuadro, igual que antes.
- Personajes con opacidad parcial (entradas/salidas), con desenfoque de profundidad o GIF animados: van por el camino clásico y se suben como textura.
- Relieve con IA y fondos con relieve.
- Miniaturas de la línea de tiempo.
- La sombra proyectada no tiene el desenfoque de 2,2 px del dibujo clásico.

## Seguridad
- Si WebGPU o WebGL2 fallan, el programa vuelve solo al dibujo clásico y avisa.
- Si algún shader aún se está compilando, ese cuadro sale por el dibujo clásico y se repite enseguida.

## Verificado (WebGL2, GPU simulada por software)
- Fondo, decoración e imágenes: 246 cuadros contra el dibujo clásico, diferencia media 0,92/255, 0,22 % de píxeles distintos.
- Personajes nativos: 30 cuadros, diferencia media 0,24/255.
- Aspecto: diferencias medias de 1 a 5/255 según el efecto.
- Texto, transiciones y cortes de cámara: 1,5 a 3/255.
- Selección y arrastre de elementos, línea de tiempo y exportación a MP4 funcionan con el motor GPU.
- Modelo 3D de prueba (`pruebas/referencias/modelo_prueba.glb`): se carga, se anima y respeta la profundidad.

## Sin verificar (necesita una tarjeta real)
- WebGPU: el motor se crea, pero no se pudo ejecutar la escena completa en el entorno de desarrollo.
- Velocidad: con GPU simulada no hay números válidos. Compara en tu PC exportando lo mismo con *Clásico* y con *GPU*
  (el informe de la exportación muestra los cuadros por segundo).
