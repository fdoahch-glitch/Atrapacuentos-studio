# Matriz de pruebas por equipo

Estado real. «Sin probar» significa que **nadie ha corrido esto en ese equipo todavía**; no se asume que funciona.

| Equipo / sistema | Qué hay que verificar | Estado |
|---|---|---|
| Linux (sandbox de desarrollo, Chrome + SwiftShader, sin GPU real) | Interfaz, edición, exportación por navegador/CPU, pruebas automáticas | **Probado** (CI y local) |
| Linux, aplicación Tauri real (Xvfb + tauri-driver) | Autoguardado y recuperación tras cierre inesperado | **Probado** (sesión de desarrollo) |
| Windows 11 + AMD Radeon (RX 570) | AMF (H.264/HEVC), wgpu, DirectML relieve | **Sin probar** (lo debe correr la persona dueña del equipo) |
| Windows 10 | Instalador, WebView2, exportación | **Sin probar** |
| Windows 11 + NVIDIA | NVENC, DirectML | **Sin probar** |
| Windows + Intel (iGPU) | Quick Sync | **Sin probar** |
| Equipo sin tarjeta dedicada | Exportación por CPU, rendimiento de la vista previa | **Sin probar** (en el sandbox solo se probó CPU/SwiftShader) |

## Cómo probar un equipo (5 minutos)
1. Instala la app. Abre **❓ Ayuda → 🩺 Diagnóstico del equipo → ⏱ Medir este equipo** y guarda el texto.
2. Exporta un video de 1080p / 60 cuadros por segundo. Al terminar la app dice cuánto tardó.
3. Abre un proyecto grande, mueve elementos y reproduce: mira el medidor «⚡ cuadros/s» sobre el lienzo.
4. Manda el texto del diagnóstico y el tiempo de exportación (o ábrelo como issue con 🐞 Reportar un problema).

Las pruebas automáticas (`python pruebas/correr_ui.py`, `cargo test -p atrapa-core`) corren en GitHub Actions en cada subida.
