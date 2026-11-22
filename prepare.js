/* Copia el Studio de la carpeta "web" a "app", que es lo que se empaqueta en el instalador. */
const fs = require("fs"), path = require("path");
const ROOT = __dirname, WEB = path.join(ROOT, "web"), APP = path.join(ROOT, "app");
function copiar(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src, { withFileTypes: true })) {
    if (f.name === "abrir-web.js") continue;
    const a = path.join(src, f.name), b = path.join(dst, f.name);
    f.isDirectory() ? copiar(a, b) : fs.copyFileSync(a, b);
  }
}
if (!fs.existsSync(path.join(WEB, "index.html"))) { console.error("Falta web/index.html (copia ahí los archivos del Studio)."); process.exit(1); }
fs.rmSync(APP, { recursive: true, force: true });
copiar(WEB, APP);
console.log("Listo: carpeta app preparada.");
