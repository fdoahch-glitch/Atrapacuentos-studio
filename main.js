const { app, BrowserWindow, Menu, dialog, session, protocol, net, shell } = require("electron");
const path = require("path"), fs = require("fs"), { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
let win;
const js = (code) => win.webContents.executeJavaScript(code, true);

async function guardar() {
  try {
    const texto = await js("Studio.exportText()");
    const nombre = (await js("(Studio.proj.nombre||'mi-cuento')")).replace(/[\\/:*?"<>|]/g, "_");
    const r = await dialog.showSaveDialog(win, { title: "Guardar proyecto", defaultPath: nombre + ".atrapacuentos", filters: [{ name: "Proyecto Atrapacuentos", extensions: ["atrapacuentos"] }] });
    if (r.canceled || !r.filePath) return;
    fs.writeFileSync(r.filePath, texto, "utf8");
    js("Studio.say('Proyecto guardado.')");
  } catch (e) { dialog.showErrorBox("No se pudo guardar", String(e.message || e)); }
}
async function abrir() {
  try {
    const r = await dialog.showOpenDialog(win, { title: "Abrir proyecto", properties: ["openFile"], filters: [{ name: "Proyecto Atrapacuentos", extensions: ["atrapacuentos", "json", "txt"] }] });
    if (r.canceled || !r.filePaths[0]) return;
    const texto = fs.readFileSync(r.filePaths[0], "utf8");
    await js("Studio.importText(" + JSON.stringify(texto) + ")");
    js("Studio.say('Proyecto abierto.')");
  } catch (e) { dialog.showErrorBox("No se pudo abrir", String(e.message || e)); }
}
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Archivo", submenu: [
      { label: "Abrir proyecto…", accelerator: "CmdOrCtrl+O", click: abrir },
      { label: "Guardar proyecto…", accelerator: "CmdOrCtrl+S", click: guardar },
      { type: "separator" },
      { label: "Revisar mi equipo", click: () => js("window.Diag&&Diag.open()") },
      { type: "separator" },
      { role: "quit", label: "Salir" }] },
    { label: "Ver", submenu: [
      { role: "togglefullscreen", label: "Pantalla completa" },
      { role: "reload", label: "Recargar" },
      { role: "toggleDevTools", label: "Herramientas de desarrollo" }] }
  ]));
}
async function crear() {
  /* micrófono permitido sin preguntar cada vez */
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(["media", "audioCapture", "fullscreen", "fileSystem", "window-management"].includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ["media", "audioCapture", "fullscreen", "fileSystem", "window-management"].includes(perm));
  /* sirve la carpeta app/ con una dirección segura (app://studio/) para que funcionen micrófono y audio */
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname); if (p === "/" || p === "") p = "/index.html";
    const f = path.normalize(path.join(__dirname, "app", p));
    if (!f.startsWith(path.join(__dirname, "app"))) return new Response("no", { status: 403 });
    return net.fetch(pathToFileURL(f).toString());
  });
  win = new BrowserWindow({ width: 1400, height: 860, minWidth: 1000, minHeight: 640, title: "Atrapacuentos Studio", backgroundColor: "#14162a", webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, autoplayPolicy: "no-user-gesture-required" } });
  /* descargas (el MP4): pregunta dónde guardar */
  session.defaultSession.on("will-download", (e, item) => {
    const r = dialog.showSaveDialogSync(win, { title: "Guardar video", defaultPath: item.getFilename() });
    if (!r) { item.cancel(); return; }
    item.setSavePath(r);
    item.once("done", (_e, st) => { if (st === "completed") shell.showItemInFolder(r); });
  });
  /* los paneles que se sacan a otro monitor abren una ventana vacía propia: se permite; los enlaces de internet van al navegador */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url || url === "about:blank" || url.startsWith("app://")) return { action: "allow", overrideBrowserWindowOptions: { backgroundColor: "#14162a", autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } } };
    shell.openExternal(url); return { action: "deny" };
  });
  menu();
  win.loadURL("app://studio/index.html");
}
app.whenReady().then(crear);
app.on("window-all-closed", () => app.quit());
