# AtrapaCuentos Studio Master 1.2.0 — Informe de cierre (2026-11-23)

Rama `mejoras-estudio`. Respaldo previo: etiqueta `respaldo-antes-de-mejoras-2026-11-22`.
Nada existente fue eliminado ni simplificado; los proyectos antiguos siguen abriendo.

## Implementado (probado en el entorno de desarrollo Linux)
- **Fase 1:** buscador global de recursos.
- **Fase 2:** biblioteca de movimientos, trayectorias editables, física suave, cara automática según el texto, movimientos ligados a palabras, marcas con nombre, accesorios con física (lentes, mochila, bufanda, capa) de frente y de perfil.
- **Fase 3 (Taller):** detección de partes humanas por silueta, **detección de animales y dinosaurios de lado (bípedos y cuadrúpedos)**, recorte con un clic, agrandar imagen, vista de perfil, texto a movimiento y sugerencias.
- **Fase 5:** perfiles de exportación, tramo, movimiento suave, miniatura, solo audio, secuencia PNG, GIF, aviso al terminar, cuadros/s reales y calidad adaptable.
- **Fase 6:** actualizaciones por GitHub con aviso, diagnóstico del equipo, reporte voluntario, pruebas de interfaz en CI, publicación por etiqueta, firma opcional.
- **Fase 7:** luz de foco, viento, confeti/cenizas/relámpagos, guías de composición, flujo macOS experimental manual (no afecta Windows).

## Mejoras posteriores (2026-11-23)
- Medidores de tiempo en la exportación (captura, lectura GPU, envío, cola llena): el mensaje final muestra «Tiempos: …». Sin probar en la app de escritorio. Primera exportación 1080p60 real en Windows: 77 s de video en 4,4 min con h264_amf.
- Boca que sigue las letras de cada palabra cuando no hay voz grabada (con voz, ya seguía el audio).
- Acción «Girar» (frente ↔ perfil, o dar vuelta si no hay vista de perfil). El 3/4 es el momento intermedio del giro, no un dibujo propio.
- «Respirar / mecer» para cualquier elemento (suave o fuerte).
- Marioneta en vivo: el micrófono mueve la boca (probado con micrófono simulado). La cámara es experimental: baja un modelo de ~4 MB con permiso; NO probada con cámara ni modelo real. No graba la actuación, solo la muestra en vivo.

- Vestuarios: 3 de fábrica (explorador, invierno, héroe) y los que guardes; se aplican con un toque.
- Cuello flexible: rol «Cuello (se curva)» en el Taller; se curva más al hablar y al caminar.
- Subtítulos y boca con el tiempo real de cada palabra (Whisper incluido en el proyecto). Probado el reparto de tiempos; NO probado con voz humana real.
- Ya existían: IK de piernas, cola en onda, entrada/salida suaves por acción.
- No hecho: voz sintética local y recorte con IA (SAM) porque requerían modelos que no pude verificar ni bajar; IK sobre terreno desnivelado (la app no tiene terreno).

## Pruebas
- 12 de 12 pruebas de interfaz (`python3 pruebas/correr_ui.py`), más pruebas Rust del núcleo y de la app real vía tauri-driver (Linux).

## Pendiente
- **Fase 4 — estado actualizado:** grabación y subtítulos ya existen; la atenuación suave de ruido constante ya está implementada con control y prueba automática; la normalización nativa a -14 LUFS / -1,5 dBTP ya está implementada como opción de exportación. La reducción actual es una compuerta adaptativa, no una restauración espectral. La biblioteca de sonidos con licencias y la voz sintética local siguen pendientes. La sincronía labial con voz se conserva; no se reactivó el flujo automático de IA que se había omitido a pedido.
- Voz local (TTS) real, más modelos de IA verificables, mejoras de profundidad y optimización de render (etapa B con wgpu).
- **Exportación en segundo plano:** ya existe en `serie_bg.js` mediante una copia del proyecto en un iframe aislado, cola, progreso, cancelación y descarga. Se actualizó la cola para conservar en la página de renderizado las opciones elegidas de normalización LUFS, máster y códec. Falta validar el flujo completo en una sesión real de escritorio; la atenuación de ruido se aplica al audio grabado/subido antes de la mezcla y no se vuelve a procesar automáticamente en el render aislado.

## Límites reales
- La detección de partes es por silueta, no usa IA. Agrandar imagen es nitidez clásica, no IA.
- Nada se ha probado en Windows real ni en hardware AMD/NVIDIA/Intel; falta ver el resultado del build de Windows en GitHub Actions.
- No hay Release publicada: la descarga de actualizaciones real no está probada.
- El instalador no está firmado (Windows puede mostrar aviso).

## Para ti
1. Revisar GitHub Actions (build de Windows).
2. Correr el diagnóstico (Ayuda) y una exportación 1080p60; enviar el texto "tardó X s…".
3. Probar con tus dinosaurios reales en el Taller.

## Robustez y orden interno (nov 2026)
- Proyectos: número de versión (v=4) y cadena de migración; versión futura se rechaza con aviso claro. Prueba `formato.py` con un proyecto real del respaldo.
- Rust: los bloqueos dañados se recuperan (`bloquear`); FFmpeg se cierra solo si la exportación se abandona; una exportación nueva cierra la vieja; el video a medias se borra si falla o se cancela. 4 pruebas nuevas (20 en total), incluida una exportación que falla a medias.
- Seguridad: política CSP en `tauri.conf.json` (recursos propios; solo jsdelivr/storage.googleapis para el modelo de cara, que exige autorización con tamaño visible). Las pruebas de interfaz corren bajo la misma política. **No probado dentro de la ventana real de Tauri en Windows**: si algo no carga, la causa probable es la CSP.
- `serie.js` partido por etapas: etapa 1 sacó `serie_base.js` (utilidades, tablas, migración) y `serie_motor.js` (movimiento y física). Quedan dibujo, propiedades y ratón, que comparten estado y requieren un objeto de contexto común; se hará en etapas con las 19 pruebas de interfaz después de cada una.

## Calidad visual: etapa 0 (nov 2026)
- `pruebas/ui/ref_cuadros.py`: dibuja 5 escenas de referencia con `Serie.frame` (la función que usan editor y MP4) y las compara píxel a píxel con `pruebas/referencias/*.png`. Con el motor actual dan diferencia 0,000 en 3 corridas seguidas, o sea que el dibujo es determinista (con el identificador de cada elemento fijo: el azar de `uid()` cambia la fase de parpadeo y respiración). Para cambiar el aspecto a propósito: `python3 ref_cuadros.py --guardar`.
- Ayuda → Diagnóstico ahora informa WebGL2 (MSAA máximo, color flotante) y si WebGPU existe en el motor de la app instalada (WebView2). **Pendiente: ejecutar ese diagnóstico en tu PC con el instalador** antes de decidir sobre WebGPU.

## GL2D: dibujo 100 % WebGL2 (en curso)
- `web/js/gl2d.js`: contexto de dibujo propio sobre WebGL2 (relleno por estencil con regla del cero o par-impar, líneas con extremos/uniones/punteado, curvas, arcos, elipses, degradados lineales y radiales, transformaciones, transparencia, mezclas multiplicar/aclarar/borrar, imágenes con mipmaps, suavizado MSAA hasta 8x). No usa Canvas 2D para dibujar.
- Prueba `gl2d.py`: 12 figuras comparadas con Canvas 2D del navegador (solo como regla de medir); las 12 dentro de tolerancia.
- Decidido con el usuario: textos y subtítulos con una tipografía libre incluida en la app y dibujada como formas; sin WebGL2 la app avisa con un mensaje claro (sin respaldo en Canvas 2D).
- Estado de integración: `GL2D` sigue siendo un motor experimental independiente; todavía no sustituye el contexto 2D usado por `Serie.frame()`. Pendiente: completar compatibilidad de texto con tipografía vectorial incluida, `filter`/desenfoque, `drawImage` entre contextos y lectura de píxeles; después integrar por capas en `frame()` sin perder edición, miniaturas, relieve ni exportación. El uso de un contexto WebGL2 compartido con rig/YUV requiere rediseño coordinado de propiedad del contexto y no está implementado. También faltan el aviso de WebGL2 no disponible y la comparación visual final de las cinco escenas.


## Actualización de ejecución — 2026-11-26
- Atenuación suave de ruido constante: control en el estudio de grabación y prueba automática de conservación de voz.
- Exportación nativa: normalización opcional `-14 LUFS`, pico máximo `-1,5 dBTP`, aplicada a AAC y al máster PCM.
- Validación CI del commit `2aeb59b`: trabajo Windows completado correctamente; pruebas Rust y de interfaz Linux completadas correctamente; empaquetado/instaladores Linux todavía en ejecución al momento de esta actualización.
- No se declara validación en equipos físicos AMD/NVIDIA/Intel ni en Windows 10/11 real: esos equipos no están disponibles desde CI.
