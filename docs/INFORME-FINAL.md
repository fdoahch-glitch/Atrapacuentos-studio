# Atrapacuentos Studio 1.2.0 — Informe de cierre (2026-11-23)

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

## Pruebas
- 12 de 12 pruebas de interfaz (`python3 pruebas/correr_ui.py`), más pruebas Rust del núcleo y de la app real vía tauri-driver (Linux).

## Pendiente
- **Fase 4:** biblioteca de sonidos con licencias, grabación, reducción de ruido, -14 LUFS, voz sintética, subtítulos, sincronía labial (omitida a pedido).
- Voz local (TTS), más modelos de IA, mejoras de profundidad, optimización de render (etapa B con wgpu).
- Pasar la exportación en segundo plano las nuevas opciones de exportación.

## Límites reales
- La detección de partes es por silueta, no usa IA. Agrandar imagen es nitidez clásica, no IA.
- Nada se ha probado en Windows real ni en hardware AMD/NVIDIA/Intel; falta ver el resultado del build de Windows en GitHub Actions.
- No hay Release publicada: la descarga de actualizaciones real no está probada.
- El instalador no está firmado (Windows puede mostrar aviso).

## Para ti
1. Revisar GitHub Actions (build de Windows).
2. Correr el diagnóstico (Ayuda) y una exportación 1080p60; enviar el texto "tardó X s…".
3. Probar con tus dinosaurios reales en el Taller.
