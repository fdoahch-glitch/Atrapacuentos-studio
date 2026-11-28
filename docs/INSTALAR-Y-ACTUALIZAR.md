# Instalar y actualizar AtrapaCuentos Studio Master

## Instalar (Windows)
1. En GitHub abre **Actions → la última ejecución verde → Artifacts → atrapacuentos-windows** (o, si ya hay una versión publicada, **Releases**).
2. Descarga el `.exe` y ábrelo. Elige "para mí" o "para todos los usuarios".
3. Si Windows muestra «SmartScreen», es porque el instalador **aún no está firmado** (la firma cuesta dinero y no se compró). Pulsa «Más información → Ejecutar de todas formas».

## Actualizar
- La app busca versiones nuevas **una vez al día** al abrirse (se puede apagar en ❓ Ayuda → Actualizaciones). Si hay una, muestra un aviso con las novedades.
- «Descargar e instalar» baja el instalador **solo desde GitHub**, lo abre y cierra la app. Nada se instala sin que lo pidas.
- Tus proyectos `.atrapacuentos` siguen abriendo igual, y el autoguardado guarda copias en tu equipo.

## Publicar una versión nueva (para quien mantiene el proyecto)
```
git tag v1.2.0
git push origin v1.2.0
```
GitHub Actions compila Windows y Linux, corre las pruebas y publica una *Release* con los instaladores. El aviso de la app compara esa etiqueta con la versión instalada.

## Firma digital (preparada, no comprada)
El flujo ya sabe firmar el `.exe`. Se activa solo si en GitHub → Settings → Secrets agregas `WIN_CERT_BASE64` (el .pfx en base64) y `WIN_CERT_PASSWORD`. Sin esos secretos, el instalador sale sin firmar. **No se compró ningún certificado ni se generó gasto.**

## Reportar un problema
❓ Ayuda → 🐞 Reportar un problema. Nada se envía solo: tú eliges copiar, guardar o abrir GitHub con el texto. No incluye proyecto, imágenes ni voces.

## Versión nueva automática (cada cambio)
- Cada cambio que llega a la rama `main` (o una etiqueta `v*`) compila Windows y Linux, corre las pruebas y, **si todo sale bien**, publica solo una
  versión nueva en GitHub con sus instaladores. El número es `scripts/version-base.txt` + el número de ejecución (por ejemplo `1.2.57`).
- El instalador queda con ese mismo número (`scripts/fijar-version.py` lo escribe en `tauri.conf.json` y en los `Cargo.toml` antes de compilar).
- La aplicación instalada revisa GitHub al abrirse y cada 30 minutos. Si hay una versión más nueva aparece el botón verde **«⬆ vX.Y.Z»** en la
  barra superior (no se puede descartar) y un aviso abajo a la derecha. Al pulsarlo se ven los cambios y «Descargar e instalar».
- Para subir el «1.2» a «1.3», se edita `scripts/version-base.txt`.
- Las ramas que no son `main` compilan pero **no publican**.
