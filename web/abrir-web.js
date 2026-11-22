/* Abre el Studio en tu navegador desde un mini servidor local (sin internet, sin instalar nada más que Node.js).
   Necesario para la IA (recorte de fondo, subtítulos, labios), exportar en segundo plano y guardar en carpetas. */
const http = require("http"), fs = require("fs"), path = require("path"), { exec } = require("child_process");
const ROOT = __dirname, PORT = +process.env.PORT || 8765;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm", ".onnx": "application/octet-stream", ".data": "application/octet-stream", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".txt": "text/plain" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  const url = "http://localhost:" + PORT + "/index.html";
  console.log("Atrapacuentos Studio listo en " + url + "\nDeja esta ventana abierta mientras trabajas. Ciérrala para terminar.");
  const cmd = process.platform === "win32" ? 'start "" "' + url + '"' : process.platform === "darwin" ? 'open "' + url + '"' : 'xdg-open "' + url + '"';
  exec(cmd);
}).on("error", e => console.error("No pude abrir el puerto " + PORT + ": " + e.message + "\nProbablemente ya está abierto: entra a http://localhost:" + PORT + "/index.html"));
