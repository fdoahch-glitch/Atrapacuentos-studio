/* Copia el Studio de la carpeta "web" a "app", baja las librerías a local (para que funcione sin internet)
   y cambia los enlaces de internet por los locales. */
const fs = require("fs"), path = require("path");
const ROOT = __dirname, WEB = path.join(ROOT, "web"), APP = path.join(ROOT, "app");
function copiar(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, f.name), b = path.join(dst, f.name);
    f.isDirectory() ? copiar(a, b) : fs.copyFileSync(a, b);
  }
}
if (!fs.existsSync(path.join(WEB, "index.html"))) { console.error("Falta web/index.html (copia ahí los archivos del Studio)."); process.exit(1); }
fs.rmSync(APP, { recursive: true, force: true });
copiar(WEB, APP);
const LIBS = [
  ["https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js", "babylonjs/babylon.js", "babylon.js"],
  ["https://cdn.jsdelivr.net/npm/babylonjs-loaders@7/babylonjs.loaders.min.js", "babylonjs-loaders/babylonjs.loaders.min.js", "babylonjs.loaders.min.js"],
  ["https://cdn.jsdelivr.net/npm/mp4-muxer@5/build/mp4-muxer.js", "mp4-muxer/build/mp4-muxer.js", "mp4-muxer.js"]
];
fs.mkdirSync(path.join(APP, "vendor"), { recursive: true });
let html = fs.readFileSync(path.join(APP, "avanzado.html"), "utf8");
for (const [url, rel, name] of LIBS) {
  const origen = path.join(ROOT, "node_modules", rel);
  if (name === "mp4-muxer.js" && fs.existsSync(path.join(APP, "vendor", name))) { html = html.split(url).join("vendor/" + name); continue; }
  if (!fs.existsSync(origen)) { console.error("Falta " + rel + ". Ejecuta primero:  npm install"); process.exit(1); }
  fs.copyFileSync(origen, path.join(APP, "vendor", name));
  html = html.split(url).join("vendor/" + name);
}
fs.writeFileSync(path.join(APP, "avanzado.html"), html);
console.log("Listo: carpeta app preparada.");
