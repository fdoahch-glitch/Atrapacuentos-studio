# Atrapacuentos Studio

Programa de escritorio (Windows y Linux) para crear cuentos y series animadas con recortes y exportarlas a MP4 para YouTube.
Ya no es una página web: es una aplicación nativa hecha en **Rust** (Tauri), con la tarjeta de video trabajando en todo.

## Qué hace la tarjeta de video (AMD, Nvidia e Intel)
- **Exportar video:** cada cuadro pasa por la GPU con **wgpu** (Vulkan / DirectX 12) para convertirse a YUV, y **FFmpeg** lo codifica con
  **NVENC** (Nvidia), **AMF** (AMD) o **Quick Sync** (Intel) en H.264, H.265 o AV1. Si tu equipo no tiene codificador por hardware, usa la CPU y te avisa.
  Opciones: resolución hasta 4K, fps 24–60, **bitrate**, copia maestra ProRes.
- **Dibujo en pantalla:** la ventana usa aceleración por hardware (rasterizado en GPU, WebGL, DirectX).
- **Relieve con IA:** el modelo Depth Anything V2 corre con **DirectML** (cualquier GPU de Windows); en Linux usa la CPU.

## Funciones
Pantalla de inicio (proyecto nuevo / abrir / asistente), animación o serie, 10 cuentos clásicos, lienzos 16:9 · 9:16 · 1:1,
estudio de grabación con video y subtítulos, animación de fondo, personajes, decoración, imágenes y textos, 📷 foto, paquetes de imágenes .zip,
relieve con IA (imágenes y fondos), paneles separables para 2 monitores.

## Compilar
Necesitas Rust y, en Linux, `libwebkit2gtk-4.1-dev libgtk-3-dev`.
```
./scripts/bajar-binarios.sh        # (Windows: ./scripts/bajar-binarios.ps1)  baja FFmpeg y ONNX Runtime
cargo test -p atrapa-core          # pruebas del núcleo
cargo tauri build                  # instalador
```
Al subir cambios a GitHub, **Actions** compila y deja los instaladores en «Artifacts».

## Estructura
- `core/` – núcleo Rust: conversión de cuadros en la GPU (wgpu), detección de codificadores, FFmpeg, relieve con IA.
- `src-tauri/` – la aplicación (ventana, menús, comandos).
- `web/` – la interfaz del Studio (se muestra dentro de la ventana nativa).
