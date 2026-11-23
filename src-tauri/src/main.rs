#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]
use atrapa_core::ffmpeg::{self, bloquear, Codificador, Exportacion, Opciones};
use atrapa_core::relieve::{self, Relieve};
use atrapa_core::yuv;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
struct Estado {
    export: Mutex<Option<Exportacion>>,
    salida: Mutex<String>,
    codificadores: Mutex<Option<Vec<Codificador>>>,
    relieve: Mutex<Option<Relieve>>,
    recursos: Mutex<Option<PathBuf>>,
    auto_base: Mutex<Option<PathBuf>>,
    cierre_inesperado: Mutex<bool>,
}

type R<T> = Result<T, String>;
fn e<T: std::fmt::Display>(x: T) -> String { x.to_string() }

fn bin_dir(s: &Estado) -> Option<PathBuf> { bloquear(&s.recursos).clone().map(|p| p.join("bin")) }
fn lib_ort(s: &Estado) -> PathBuf {
    let n = if cfg!(windows) { "onnxruntime.dll" } else if cfg!(target_os = "macos") { "libonnxruntime.dylib" } else { "libonnxruntime.so" };
    if let Ok(p) = std::env::var("ATRAPA_ORT_LIB") { return PathBuf::from(p); }
    bin_dir(s).map(|b| b.join(n)).unwrap_or_else(|| PathBuf::from(n))
}
fn carpeta_datos(app: &AppHandle) -> PathBuf { app.path().app_data_dir().unwrap_or_else(|_| std::env::temp_dir().join("atrapacuentos")) }

fn lista_codificadores(s: &Estado) -> Vec<Codificador> {
    let mut g = bloquear(&s.codificadores);
    if g.is_none() { *g = Some(ffmpeg::detectar()); }
    g.clone().unwrap()
}

#[derive(Serialize)]
struct Sistema { gpus: Vec<yuv::GpuInfo>, codificadores: Vec<Codificador>, ffmpeg: bool, relieve_listo: bool, sistema: String }

#[tauri::command]
async fn sistema(s: State<'_, Estado>, app: AppHandle) -> R<Sistema> {
    let cod = lista_codificadores(&s);
    let modelo = carpeta_datos(&app).join("modelos").join(relieve::MODELO_NOMBRE).exists();
    Ok(Sistema { gpus: yuv::adaptadores(), ffmpeg: !cod.is_empty(), codificadores: cod, relieve_listo: modelo && lib_ort(&s).exists(), sistema: std::env::consts::OS.into() })
}

#[tauri::command]
async fn elegir_guardar_video(app: AppHandle, nombre: String) -> R<Option<String>> {
    let r = app.dialog().file().add_filter("Video MP4", &["mp4"]).set_file_name(format!("{nombre}.mp4")).set_title("Guardar video").blocking_save_file();
    Ok(r.map(|p| p.to_string()))
}

#[tauri::command]
async fn guardar_audio(request: Request<'_>) -> R<String> {
    let InvokeBody::Raw(b) = request.body() else { return Err("falta el audio".into()) };
    if b.len() < 8 { return Err("audio vacío".into()); }
    let sr = u32::from_le_bytes(b[0..4].try_into().unwrap());
    let ch = u32::from_le_bytes(b[4..8].try_into().unwrap()) as u16;
    let muestras: Vec<f32> = b[8..].chunks_exact(4).map(|c| f32::from_le_bytes(c.try_into().unwrap())).collect();
    let dir = std::env::temp_dir().join("atrapacuentos"); std::fs::create_dir_all(&dir).map_err(e)?;
    let ruta = dir.join(format!("voz-{}.wav", std::process::id()));
    ffmpeg::escribir_wav(&ruta, sr, ch, &muestras).map_err(e)?;
    Ok(ruta.to_string_lossy().into())
}

#[derive(Serialize)]
struct Inicio { codificador: String, marca: String, gpu: bool, tarjeta: String, bitrate: f32 }

#[tauri::command]
async fn exportar_iniciar(s: State<'_, Estado>, opciones: Opciones) -> R<Inicio> {
    let lista = lista_codificadores(&s);
    let ex = Exportacion::iniciar(&opciones, &lista).map_err(e)?;
    let r = Inicio { codificador: ex.usado.id.clone(), marca: ex.usado.marca.clone(), gpu: ex.usado.gpu, tarjeta: ex.gpu_nombre.clone(),
        bitrate: if opciones.mbps > 0.0 { opciones.mbps } else { ffmpeg::bitrate_auto(opciones.w, opciones.h, opciones.fps) } };
    // si había una exportación abandonada, se cierra antes de empezar la nueva (no deja FFmpeg colgado)
    if let Some(vieja) = bloquear(&s.export).replace(ex) { vieja.cancelar(); }
    *bloquear(&s.salida) = opciones.salida.clone();
    Ok(r)
}

/// Borra el video a medias: un .mp4 incompleto engaña más que un archivo que no existe.
fn borrar_parcial(s: &Estado) { let r = bloquear(&s.salida).clone(); if !r.is_empty() { let _ = std::fs::remove_file(r); } }

#[tauri::command]
async fn exportar_cuadro(s: State<'_, Estado>, request: Request<'_>) -> R<u64> {
    let InvokeBody::Raw(b) = request.body() else { return Err("falta el cuadro".into()) };
    let mut g = bloquear(&s.export);
    let ex = g.as_mut().ok_or("no hay exportación en curso")?;
    if let Err(x) = ex.cuadro(b) { if let Some(ex) = g.take() { ex.cancelar(); } drop(g); borrar_parcial(&s); return Err(e(x)); }
    Ok(ex.cuadros)
}

#[tauri::command]
async fn exportar_terminar(s: State<'_, Estado>) -> R<u64> {
    let ex = bloquear(&s.export).take().ok_or("no hay exportación en curso")?;
    if let Err(x) = ex.terminar() { borrar_parcial(&s); return Err(e(x)); }
    let ruta = bloquear(&s.salida).clone();
    Ok(std::fs::metadata(ruta).map(|m| m.len()).unwrap_or(0))
}
#[tauri::command]
async fn exportar_cancelar(s: State<'_, Estado>) -> R<()> { let ex = bloquear(&s.export).take(); if let Some(ex) = ex { ex.cancelar(); borrar_parcial(&s); } Ok(()) }

fn base_auto(app: &AppHandle) -> PathBuf { carpeta_datos(app).join("autoguardado") }
fn ahora_ms() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0) }

#[tauri::command]
async fn autoguardar(app: AppHandle, nombre: String, texto: String) -> R<bool> {
    atrapa_core::autoguardado::guardar(&base_auto(&app), &nombre, &texto, ahora_ms(), 60_000).map_err(e)
}
#[tauri::command]
async fn autoguardado_versiones(app: AppHandle, nombre: Option<String>) -> R<Vec<atrapa_core::autoguardado::Version>> {
    Ok(atrapa_core::autoguardado::listar(&base_auto(&app), nombre.as_deref()))
}
#[tauri::command]
async fn autoguardado_leer(app: AppHandle, ruta: String) -> R<String> { atrapa_core::autoguardado::leer(&base_auto(&app), &ruta) }
/// Si la sesión anterior no cerró bien, devuelve el proyecto guardado más reciente para recuperarlo.
#[tauri::command]
async fn autoguardado_recuperar(s: State<'_, Estado>) -> R<Option<(String, String)>> {
    if !*bloquear(&s.cierre_inesperado) { return Ok(None); }
    let Some(base) = bloquear(&s.auto_base).clone() else { return Ok(None) };
    Ok(atrapa_core::autoguardado::mas_reciente(&base).and_then(|(n, p, _)| std::fs::read_to_string(p).ok().map(|t| (n, t))))
}

#[tauri::command]
async fn mostrar_en_carpeta(app: AppHandle, ruta: String) -> R<()> { tauri_plugin_opener::reveal_item_in_dir(PathBuf::from(&ruta)).map_err(e)?; let _ = app; Ok(()) }

const REPO: &str = "fdoahch-glitch/Atrapacuentos-studio";

#[derive(Serialize)]
struct VersionInfo { version: String, os: String, repo: String }
#[tauri::command]
fn version_app() -> VersionInfo { VersionInfo { version: env!("CARGO_PKG_VERSION").into(), os: std::env::consts::OS.into(), repo: REPO.into() } }

/// Pregunta a GitHub si hay una versión nueva. Si no hay internet, devuelve error y la app sigue normal.
#[tauri::command]
async fn buscar_actualizacion() -> R<Option<atrapa_core::actualizar::Novedad>> {
    tauri::async_runtime::spawn_blocking(|| atrapa_core::actualizar::buscar(REPO, env!("CARGO_PKG_VERSION"), std::env::consts::OS).map_err(|x| x.to_string())).await.map_err(e)?
}
/// Baja el instalador (solo desde GitHub), lo abre y cierra la app para que el instalador pueda reemplazar los archivos.
/// Solo se llama cuando la persona pulsa «Descargar e instalar».
#[tauri::command]
async fn instalar_actualizacion(app: AppHandle, url: String, archivo: String) -> R<()> {
    let nombre: String = archivo.chars().map(|c| if c.is_ascii_alphanumeric() || "._- ".contains(c) { c } else { '_' }).collect();
    if nombre.is_empty() { return Err("falta el nombre del instalador".into()); }
    let dir = std::env::temp_dir().join("atrapacuentos-actualizacion"); std::fs::create_dir_all(&dir).map_err(e)?;
    let dest = dir.join(&nombre);
    let ap = app.clone(); let d2 = dest.clone();
    tauri::async_runtime::spawn_blocking(move || atrapa_core::actualizar::descargar(&url, &d2, |n, t| { let _ = ap.emit("actualizar-progreso", serde_json::json!({"n": n, "total": t})); }).map_err(|x| x.to_string())).await.map_err(e)??;
    #[cfg(unix)] { use std::os::unix::fs::PermissionsExt; let _ = std::fs::set_permissions(&dest, std::fs::Permissions::from_mode(0o755)); }
    if nombre.to_lowercase().ends_with(".deb") { tauri_plugin_opener::reveal_item_in_dir(&dest).map_err(e)?; return Ok(()); }
    std::process::Command::new(&dest).spawn().map_err(e)?;
    let ap2 = app.clone();
    std::thread::spawn(move || { std::thread::sleep(std::time::Duration::from_millis(900)); ap2.exit(0); });
    Ok(())
}
/// Abre una página de GitHub en el navegador (solo direcciones de github.com).
#[tauri::command]
fn abrir_enlace(app: AppHandle, url: String) -> R<()> {
    if !url.starts_with("https://github.com/") { return Err("solo se abren páginas de GitHub".into()); }
    use tauri_plugin_opener::OpenerExt; app.opener().open_url(url, None::<&str>).map_err(e)
}
/// Guarda un texto (por ejemplo el reporte de un problema) donde la persona elija.
#[tauri::command]
async fn guardar_texto(app: AppHandle, texto: String, nombre: String) -> R<Option<String>> {
    let Some(p) = app.dialog().file().add_filter("Texto", &["txt"]).set_file_name(nombre).set_title("Guardar").blocking_save_file() else { return Ok(None) };
    let ruta = p.into_path().map_err(e)?; std::fs::write(&ruta, texto).map_err(e)?; Ok(Some(ruta.to_string_lossy().into()))
}

#[tauri::command]
async fn guardar_proyecto(app: AppHandle, texto: String, nombre: String) -> R<Option<String>> {
    let Some(p) = app.dialog().file().add_filter("Proyecto Atrapacuentos", &["atrapacuentos"]).set_file_name(format!("{nombre}.atrapacuentos")).set_title("Guardar proyecto").blocking_save_file() else { return Ok(None) };
    let ruta = p.into_path().map_err(e)?;
    std::fs::write(&ruta, texto).map_err(e)?;
    Ok(Some(ruta.to_string_lossy().into()))
}
#[tauri::command]
async fn abrir_proyecto(app: AppHandle) -> R<Option<String>> {
    let Some(p) = app.dialog().file().add_filter("Proyecto Atrapacuentos", &["atrapacuentos", "json", "txt"]).set_title("Abrir proyecto").blocking_pick_file() else { return Ok(None) };
    let ruta = p.into_path().map_err(e)?;
    Ok(Some(std::fs::read_to_string(ruta).map_err(e)?))
}

#[tauri::command]
async fn relieve_modelo_archivo(app: AppHandle) -> R<bool> {
    let Some(p) = app.dialog().file().add_filter("Modelo ONNX", &["onnx"]).set_title("Elige el modelo de relieve (.onnx)").blocking_pick_file() else { return Ok(false) };
    let dir = carpeta_datos(&app).join("modelos"); std::fs::create_dir_all(&dir).map_err(e)?;
    std::fs::copy(p.into_path().map_err(e)?, dir.join(relieve::MODELO_NOMBRE)).map_err(e)?;
    Ok(true)
}

/// Entrada: [ancho u32][alto u32][RGBA]. Salida: [ancho u32][alto u32][gpu u8][grises]
#[tauri::command]
async fn relieve_estimar(s: State<'_, Estado>, app: AppHandle, request: Request<'_>) -> R<Response> {
    let InvokeBody::Raw(b) = request.body() else { return Err("falta la imagen".into()) };
    if b.len() < 8 { return Err("imagen vacía".into()); }
    let w = u32::from_le_bytes(b[0..4].try_into().unwrap()) as usize;
    let h = u32::from_le_bytes(b[4..8].try_into().unwrap()) as usize;
    let rgba = &b[8..];
    let lib = lib_ort(&s);
    if !lib.exists() { return Err(format!("Falta ONNX Runtime ({})", lib.display())); }
    let dir = carpeta_datos(&app).join("modelos");
    let ap = app.clone();
    let modelo = relieve::asegurar_modelo(&dir, move |n, t| { let _ = ap.emit("relieve-progreso", serde_json::json!({"n": n, "total": t})); }).map_err(e)?;
    let mut g = bloquear(&s.relieve);
    if g.is_none() { *g = Some(Relieve::cargar(&modelo, &lib).map_err(e)?); }
    let r = g.as_mut().unwrap();
    let (mapa, dw, dh) = r.estimar(rgba, w, h).map_err(e)?;
    let mut o = Vec::with_capacity(9 + mapa.len());
    o.extend((dw as u32).to_le_bytes()); o.extend((dh as u32).to_le_bytes()); o.push(r.gpu as u8); o.extend(mapa);
    Ok(Response::new(o))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Estado::default())
        .setup(|app| {
            let est: State<Estado> = app.state();
            {
                let base = carpeta_datos(app.handle()).join("autoguardado");
                *bloquear(&est.cierre_inesperado) = atrapa_core::autoguardado::iniciar_sesion(&base);
                *bloquear(&est.auto_base) = Some(base);
            }
            if let Ok(rd) = app.path().resource_dir() {
                *bloquear(&est.recursos) = Some(rd.clone());
                let bin = rd.join("bin");
                let ff = bin.join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
                if ff.exists() && std::env::var("ATRAPA_FFMPEG").is_err() { std::env::set_var("ATRAPA_FFMPEG", &ff); }
                // para que Windows encuentre DirectML.dll junto a onnxruntime.dll
                let sep = if cfg!(windows) { ";" } else { ":" };
                let path = std::env::var("PATH").unwrap_or_default();
                std::env::set_var("PATH", format!("{}{}{}", bin.display(), sep, path));
            }
            let abrir = MenuItemBuilder::with_id("abrir", "Abrir proyecto…").accelerator("CmdOrCtrl+O").build(app)?;
            let guardar = MenuItemBuilder::with_id("guardar", "Guardar proyecto…").accelerator("CmdOrCtrl+S").build(app)?;
            let equipo = MenuItemBuilder::with_id("equipo", "Revisar mi equipo (GPU y codificadores)").build(app)?;
            let archivo = SubmenuBuilder::new(app, "Archivo").item(&abrir).item(&guardar).separator().item(&equipo).separator().quit().build()?;
            let editar = SubmenuBuilder::new(app, "Editar").undo().redo().separator().cut().copy().paste().select_all().build()?;
            let ver = SubmenuBuilder::new(app, "Ver").fullscreen().build()?;
            app.set_menu(MenuBuilder::new(app).items(&[&archivo, &editar, &ver]).build()?)?;
            app.on_menu_event(|app, ev| { let _ = app.emit("menu", ev.id().0.clone()); });
            #[cfg(target_os = "linux")]
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.with_webview(|wv| {
                    use webkit2gtk::{SettingsExt, WebViewExt};
                    if let Some(s) = wv.inner().settings() { s.set_enable_media_stream(true); s.set_enable_webgl(true); s.set_enable_mediasource(true); s.set_hardware_acceleration_policy(webkit2gtk::HardwareAccelerationPolicy::Always); }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![sistema, elegir_guardar_video, guardar_audio, exportar_iniciar, exportar_cuadro, exportar_terminar, exportar_cancelar, mostrar_en_carpeta, guardar_proyecto, abrir_proyecto, relieve_modelo_archivo, relieve_estimar, autoguardar, autoguardado_versiones, autoguardado_leer, autoguardado_recuperar, version_app, buscar_actualizacion, instalar_actualizacion, abrir_enlace, guardar_texto])
        .build(tauri::generate_context!())
        .expect("no se pudo abrir Atrapacuentos Studio")
        .run(|app, ev| {
            if let tauri::RunEvent::Exit = ev {
                if let Some(b) = bloquear(&app.state::<Estado>().auto_base).clone() { atrapa_core::autoguardado::cerrar_sesion(&b); }
            }
        });
}
