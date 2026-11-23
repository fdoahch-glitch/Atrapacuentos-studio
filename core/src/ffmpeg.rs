//! Codificación con FFmpeg: elige sola el codificador de la tarjeta de video
//! (NVENC de Nvidia, AMF de AMD, Quick Sync de Intel) y, si no hay, usa la CPU.
use crate::yuv::Yuv;
use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

pub fn ffmpeg_path() -> PathBuf {
    if let Ok(p) = std::env::var("ATRAPA_FFMPEG") { return PathBuf::from(p); }
    let nombre = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };
    if let Ok(exe) = std::env::current_exe() {
        if let Some(d) = exe.parent() {
            for c in [d.join(nombre), d.join("bin").join(nombre), d.join("resources").join(nombre), d.join("../Resources").join(nombre)] {
                if c.exists() { return c; }
            }
        }
    }
    PathBuf::from(nombre)
}

fn cmd(p: &Path) -> Command {
    #[allow(unused_mut)] let mut c = Command::new(p);
    #[cfg(windows)] c.creation_flags(0x0800_0000); // sin ventana negra
    c
}

#[derive(Serialize, Clone, Debug)]
pub struct Codificador { pub id: String, pub codec: String, pub marca: String, pub gpu: bool }

const CANDIDATOS: &[(&str, &str, &str, bool)] = &[
    ("h264_nvenc", "h264", "Nvidia (NVENC)", true), ("h264_amf", "h264", "AMD (AMF)", true), ("h264_qsv", "h264", "Intel (Quick Sync)", true),
    ("hevc_nvenc", "hevc", "Nvidia (NVENC)", true), ("hevc_amf", "hevc", "AMD (AMF)", true), ("hevc_qsv", "hevc", "Intel (Quick Sync)", true),
    ("av1_nvenc", "av1", "Nvidia (NVENC)", true), ("av1_amf", "av1", "AMD (AMF)", true), ("av1_qsv", "av1", "Intel (Quick Sync)", true),
    ("libx264", "h264", "CPU", false), ("libx265", "hevc", "CPU", false), ("libsvtav1", "av1", "CPU", false),
];

/// Prueba de verdad cada codificador con un cuadro pequeño: si la tarjeta no lo ofrece, falla y se descarta.
pub fn detectar() -> Vec<Codificador> {
    let ff = ffmpeg_path();
    let listado = cmd(&ff).args(["-hide_banner", "-encoders"]).output().ok().map(|o| String::from_utf8_lossy(&o.stdout).to_string()).unwrap_or_default();
    let mut v = Vec::new();
    for (id, codec, marca, gpu) in CANDIDATOS {
        if !listado.contains(id) { continue; }
        let ok = cmd(&ff).args(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=0.3:r=30", "-frames:v", "5", "-c:v", id, "-pix_fmt", "yuv420p", "-f", "null", "-"])
            .stdout(Stdio::null()).stderr(Stdio::null()).status().map(|s| s.success()).unwrap_or(false);
        if ok { v.push(Codificador { id: id.to_string(), codec: codec.to_string(), marca: marca.to_string(), gpu: *gpu }); }
    }
    v
}

/// Mejor codificador para un códec: primero GPU (en el orden NVENC, AMF, QSV), si no CPU.
pub fn elegir(lista: &[Codificador], codec: &str, preferido: Option<&str>) -> Option<Codificador> {
    if let Some(p) = preferido { if let Some(c) = lista.iter().find(|c| c.id == p) { return Some(c.clone()); } }
    lista.iter().find(|c| c.codec == codec && c.gpu).or_else(|| lista.iter().find(|c| c.codec == codec)).cloned()
}

#[derive(Deserialize, Clone, Debug)]
pub struct Opciones {
    pub w: u32, pub h: u32, pub fps: u32,
    #[serde(default)] pub mbps: f32,
    #[serde(default = "h264")] pub codec: String,
    #[serde(default)] pub codificador: Option<String>,
    pub salida: String,
    #[serde(default)] pub audio: Option<String>,
    #[serde(default)] pub maestra: Option<String>,
    /// duración total en segundos (recorta el audio si sobra)
    #[serde(default)] pub duracion: f32,
}
fn h264() -> String { "h264".into() }

/// Bloquea un Mutex aunque otro hilo haya fallado con el bloqueo tomado (el dato sigue siendo usable).
pub fn bloquear<T>(m: &std::sync::Mutex<T>) -> std::sync::MutexGuard<'_, T> { m.lock().unwrap_or_else(|p| p.into_inner()) }

pub struct Exportacion {
    child: Child,
    tx: Option<std::sync::mpsc::SyncSender<Vec<u8>>>,
    escritor: Option<std::thread::JoinHandle<()>>,
    fallo: std::sync::Arc<std::sync::Mutex<Option<String>>>,
    errores: std::sync::Arc<std::sync::Mutex<String>>,
    yuv: Yuv, w: u32, h: u32,
    pub usado: Codificador, pub cuadros: u64, pub gpu_nombre: String,
}

/// Cuadro ya convertido a YUV 4:2:0 por la tarjeta de video de la ventana (WebGL): W×(H·3/2) bytes.
/// Filas 0..H = Y; luego H/2 filas con U en la mitad izquierda y V en la derecha. Se ordena como I420.
pub fn empaquetado_a_i420(w: usize, h: usize, src: &[u8]) -> Vec<u8> {
    let mut o = Vec::with_capacity(w * h * 3 / 2);
    o.extend_from_slice(&src[..w * h]);
    let (cw, ch) = (w / 2, h / 2);
    for cy in 0..ch { let r = w * h + cy * w; o.extend_from_slice(&src[r..r + cw]); }
    for cy in 0..ch { let r = w * h + cy * w + cw; o.extend_from_slice(&src[r..r + cw]); }
    o
}

pub fn bitrate_auto(w: u32, h: u32, fps: u32) -> f32 {
    let px = w as f32 * h as f32;
    let b = if px >= 7e6 { 50.0 } else if px >= 3.5e6 { 24.0 } else if px >= 1.9e6 { 14.0 } else { 8.0 };
    b * if fps >= 50 { 1.5 } else { 1.0 }
}

pub fn args_codificador(c: &Codificador, mbps: f32, fps: u32) -> Vec<String> {
    let mut a: Vec<String> = vec!["-c:v".into(), c.id.clone()];
    let s = |x: &str| x.to_string();
    match c.id.as_str() {
        id if id.ends_with("_nvenc") => a.extend([s("-preset"), s("p5"), s("-tune"), s("hq"), s("-rc"), s("vbr")]),
        // AMF en "quality" es el modo más lento (en una RX 570 daba ~24 cuadros/s a 1080p60 y el resto del proceso esperaba); "balanced" es el punto medio de AMD.
        id if id.ends_with("_amf") => a.extend([s("-quality"), s("balanced"), s("-rc"), s("vbr_peak")]),
        id if id.ends_with("_qsv") => a.extend([s("-preset"), s("slower")]),
        "libx264" | "libx265" => a.extend([s("-preset"), s("medium")]),
        _ => {}
    }
    a.extend([s("-b:v"), format!("{}k", (mbps * 1000.0) as u32), s("-maxrate"), format!("{}k", (mbps * 1500.0) as u32), s("-bufsize"), format!("{}k", (mbps * 2000.0) as u32), s("-g"), (fps * 2).to_string()]);
    if c.codec == "hevc" { a.extend([s("-tag:v"), s("hvc1")]); }
    a
}

impl Exportacion {
    pub fn iniciar(o: &Opciones, lista: &[Codificador]) -> Result<Self> {
        let enc = elegir(lista, &o.codec, o.codificador.as_deref()).ok_or_else(|| anyhow!("no hay codificador para {}", o.codec))?;
        let yuv = Yuv::new(o.w, o.h)?;
        let mbps = if o.mbps > 0.0 { o.mbps } else { bitrate_auto(o.w, o.h, o.fps) };
        let mut a: Vec<String> = ["-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s"].iter().map(|x| x.to_string()).collect();
        a.push(format!("{}x{}", o.w, o.h));
        a.extend(["-r".to_string(), o.fps.to_string(), "-i".into(), "pipe:0".into()]);
        if let Some(au) = &o.audio { a.extend(["-i".to_string(), au.clone()]); }
        a.extend(["-map", "0:v"].map(String::from));
        if o.audio.is_some() { a.extend(["-map", "1:a", "-c:a", "aac", "-b:a", "192k"].map(String::from)); }
        if o.duracion > 0.0 { a.extend(["-t".to_string(), format!("{:.3}", o.duracion)]); }
        a.extend(args_codificador(&enc, mbps, o.fps));
        // Las etiquetas de color (BT.709, rango limitado) se escriben en el flujo ya codificado. Con las opciones
        // -colorspace/-color_* FFmpeg nuevo reconvierte los colores y los desplaza; así los cuadros quedan intactos.
        let bsf = match enc.codec.as_str() {
            "hevc" => "hevc_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0",
            "av1" => "av1_metadata=color_primaries=1:transfer_characteristics=1:matrix_coefficients=1:color_range=tv",
            _ => "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0",
        };
        a.extend(["-pix_fmt", "yuv420p", "-bsf:v", bsf, "-movflags", "+faststart"].map(String::from));
        a.push(o.salida.clone());
        if let Some(m) = &o.maestra {
            // copia maestra sin pérdida visible (ProRes 422 HQ) para editar o volver a exportar
            if o.duracion > 0.0 { a.extend(["-t".to_string(), format!("{:.3}", o.duracion)]); }
            a.extend(["-map", "0:v", "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le"].map(String::from));
            if o.audio.is_some() { a.extend(["-map", "1:a", "-c:a", "pcm_s16le"].map(String::from)); }
            a.push(m.clone());
        }
        let mut child = cmd(&ffmpeg_path()).args(&a).stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::piped()).spawn().context("no se pudo abrir FFmpeg")?;
        let mut stdin = child.stdin.take().ok_or_else(|| anyhow!("FFmpeg sin entrada"))?;
        // se lee lo que diga FFmpeg mientras trabaja, para poder explicar un fallo
        let errores = std::sync::Arc::new(std::sync::Mutex::new(String::new()));
        if let Some(mut se) = child.stderr.take() {
            let e2 = errores.clone();
            std::thread::spawn(move || { use std::io::Read; let mut b = [0u8; 4096]; while let Ok(n) = se.read(&mut b) { if n == 0 { break; } let mut g = bloquear(&e2); if g.len() < 8000 { g.push_str(&String::from_utf8_lossy(&b[..n])); } } });
        }
        let gpu_nombre = format!("{} ({}, {})", yuv.info.nombre, yuv.info.api, yuv.info.tipo);
        // los cuadros se escriben a FFmpeg en otro hilo, para que el programa pueda ir preparando el siguiente
        let (tx, rx) = std::sync::mpsc::sync_channel::<Vec<u8>>(4);
        let fallo = std::sync::Arc::new(std::sync::Mutex::new(None::<String>));
        let f2 = fallo.clone();
        let escritor = std::thread::spawn(move || {
            while let Ok(c) = rx.recv() { if let Err(e) = stdin.write_all(&c) { *bloquear(&f2) = Some(e.to_string()); break; } }
        });
        Ok(Self { child, tx: Some(tx), escritor: Some(escritor), fallo, errores, yuv, w: o.w, h: o.h, usado: enc, cuadros: 0, gpu_nombre })
    }

    fn motivo(&self, e: String) -> anyhow::Error {
        std::thread::sleep(std::time::Duration::from_millis(150));
        let det = bloquear(&self.errores).trim().to_string();
        anyhow!("FFmpeg dejó de responder ({}): {}", self.usado.id, if det.is_empty() { e } else { det })
    }

    /// Acepta un cuadro RGBA (w·h·4) o ya en YUV empaquetado (w·h·3/2).
    pub fn cuadro(&mut self, datos: &[u8]) -> Result<()> {
        if let Some(f) = bloquear(&self.fallo).clone() { return Err(self.motivo(f)); }
        let (w, h) = (self.w as usize, self.h as usize);
        let i420 = if datos.len() == w * h * 4 { self.yuv.convertir(datos)? }
            else if datos.len() == w * h * 3 / 2 { empaquetado_a_i420(w, h, datos) }
            else { return Err(anyhow!("cuadro de tamaño incorrecto ({} bytes)", datos.len())); };
        let tx = self.tx.as_ref().ok_or_else(|| anyhow!("la exportación ya terminó"))?;
        if tx.send(i420).is_err() { let f = bloquear(&self.fallo).clone().unwrap_or_default(); return Err(self.motivo(f)); }
        self.cuadros += 1;
        Ok(())
    }

    pub fn terminar(mut self) -> Result<()> {
        drop(self.tx.take());
        if let Some(h) = self.escritor.take() { let _ = h.join(); }
        if let Some(f) = bloquear(&self.fallo).clone() { let _ = self.child.kill(); return Err(self.motivo(f)); }
        let st = self.child.wait()?;
        std::thread::sleep(std::time::Duration::from_millis(100));
        if !st.success() { return Err(anyhow!("FFmpeg falló ({}): {}", self.usado.id, bloquear(&self.errores).trim())); }
        Ok(())
    }
    pub fn pid(&self) -> u32 { self.child.id() }
    pub fn cancelar(mut self) { drop(self.tx.take()); let _ = self.child.kill(); if let Some(h) = self.escritor.take() { let _ = h.join(); } let _ = self.child.wait(); }
}

impl Drop for Exportacion {
    fn drop(&mut self) { drop(self.tx.take()); let _ = self.child.kill(); let _ = self.child.wait(); }
}

/// Escribe un WAV de 16 bits estéreo (entrada: muestras intercaladas L,R en f32).
pub fn escribir_wav(ruta: &Path, sr: u32, canales: u16, f32s: &[f32]) -> Result<()> {
    let mut f = std::io::BufWriter::new(std::fs::File::create(ruta)?);
    let datos = (f32s.len() * 2) as u32;
    f.write_all(b"RIFF")?; f.write_all(&(36 + datos).to_le_bytes())?; f.write_all(b"WAVEfmt ")?;
    f.write_all(&16u32.to_le_bytes())?; f.write_all(&1u16.to_le_bytes())?; f.write_all(&canales.to_le_bytes())?;
    f.write_all(&sr.to_le_bytes())?; f.write_all(&(sr * canales as u32 * 2).to_le_bytes())?; f.write_all(&(canales * 2).to_le_bytes())?; f.write_all(&16u16.to_le_bytes())?;
    f.write_all(b"data")?; f.write_all(&datos.to_le_bytes())?;
    for s in f32s { f.write_all(&((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes())?; }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reordena_yuv_empaquetado() {
        let (w, h) = (8usize, 4usize);
        let mut s = vec![0u8; w * h * 3 / 2];
        for i in 0..w * h { s[i] = 1; }
        for cy in 0..h / 2 { for x in 0..w / 2 { s[w * h + cy * w + x] = 10 + (cy * 4 + x) as u8; s[w * h + cy * w + w / 2 + x] = 50 + (cy * 4 + x) as u8; } }
        let o = empaquetado_a_i420(w, h, &s);
        assert_eq!(o.len(), 48);
        assert_eq!(&o[32..40], &[10, 11, 12, 13, 14, 15, 16, 17]);
        assert_eq!(&o[40..48], &[50, 51, 52, 53, 54, 55, 56, 57]);
    }
    #[test]
    fn exporta_mp4_con_audio_y_maestra() {
        let lista = detectar();
        eprintln!("codificadores: {:?}", lista.iter().map(|c| c.id.clone()).collect::<Vec<_>>());
        assert!(lista.iter().any(|c| c.id == "libx264"), "debe existir al menos la CPU");
        let dir = std::env::temp_dir().join("atrapa_test"); std::fs::create_dir_all(&dir).unwrap();
        let wav = dir.join("a.wav");
        let s: Vec<f32> = (0..48000 * 2 * 2).map(|i| ((i / 2) as f32 * 440.0 * 6.2831 / 48000.0).sin() * 0.3).collect();
        escribir_wav(&wav, 48000, 2, &s).unwrap();
        let o = Opciones { w: 320, h: 180, fps: 30, mbps: 4.0, codec: "h264".into(), codificador: None, salida: dir.join("o.mp4").to_string_lossy().into(), audio: Some(wav.to_string_lossy().into()), duracion: 2.0, maestra: Some(dir.join("m.mov").to_string_lossy().into()) };
        let mut e = Exportacion::iniciar(&o, &lista).expect("iniciar");
        eprintln!("usa {} en {}", e.usado.id, e.gpu_nombre);
        for n in 0..60 { let mut f = vec![255u8; 320 * 180 * 4]; for y in 0..180 { for x in 0..320 { let i = (y * 320 + x) * 4; f[i] = ((x + n * 4) % 256) as u8; f[i + 1] = (y * 255 / 180) as u8; f[i + 2] = 90; } } e.cuadro(&f).unwrap(); }
        e.terminar().unwrap();
        // se revisa el resultado con el propio FFmpeg (no hace falta ffprobe)
        let info = |f: &Path| { let o = cmd(&ffmpeg_path()).args(["-hide_banner", "-i"]).arg(f).output().unwrap(); String::from_utf8_lossy(&o.stderr).to_string() };
        let t = info(&dir.join("o.mp4")); eprintln!("{t}");
        assert!(t.contains("Video: h264") && t.contains("320x180") && t.contains("Audio: aac") && t.contains("bt709") && t.contains("Duration: 00:00:02"), "mp4 inesperado");
        assert!(t.contains("bt709, progressive") || t.matches("bt709").count() >= 3, "faltan las etiquetas de color BT.709");
        let m = info(&dir.join("m.mov"));
        assert!(m.contains("prores"), "la copia maestra debe ser ProRes");
    }

    #[test]
    fn colores_fieles_en_los_dos_caminos() {
        // un cuadro liso (255,210,122) debe volver igual (±3) tanto por el camino RGBA (wgpu) como por el YUV de la ventana
        let lista = detectar();
        let dir = std::env::temp_dir().join("atrapa_color"); std::fs::create_dir_all(&dir).unwrap();
        let (w, h) = (128usize, 72usize);
        let mut rgba = vec![255u8; w * h * 4]; for p in rgba.chunks_mut(4) { p[0] = 255; p[1] = 210; p[2] = 122; }
        let yuv_i420 = crate::yuv::rgba_a_i420_cpu(w, h, &rgba);
        // el mismo cuadro en el formato empaquetado de la ventana (Y; luego U|V lado a lado)
        let mut emp = yuv_i420[..w * h].to_vec();
        let (cw, ch) = (w / 2, h / 2);
        for cy in 0..ch { emp.extend_from_slice(&yuv_i420[w * h + cy * cw..w * h + (cy + 1) * cw]); emp.extend_from_slice(&yuv_i420[w * h + cw * ch + cy * cw..w * h + cw * ch + (cy + 1) * cw]); }
        for (nombre, datos) in [("rgba", rgba.clone()), ("yuv", emp)] {
            for codec in ["h264", "hevc"] {
                let salida = dir.join(format!("{nombre}_{codec}.mp4"));
                let o = Opciones { w: w as u32, h: h as u32, fps: 30, mbps: 4.0, codec: codec.into(), codificador: None, salida: salida.to_string_lossy().into(), audio: None, duracion: 0.0, maestra: None };
                let mut e = Exportacion::iniciar(&o, &lista).unwrap();
                for _ in 0..10 { e.cuadro(&datos).unwrap(); }
                e.terminar().unwrap();
                let out = cmd(&ffmpeg_path()).args(["-v", "error", "-i"]).arg(&salida).args(["-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]).output().unwrap();
                let (r, g, b) = (out.stdout[0] as i32, out.stdout[1] as i32, out.stdout[2] as i32);
                assert!((r - 255).abs() <= 3 && (g - 210).abs() <= 3 && (b - 122).abs() <= 3, "{nombre}/{codec}: color {r},{g},{b} en vez de 255,210,122");
            }
        }
    }

    fn opts(salida: &str) -> Opciones {
        Opciones { w: 64, h: 36, fps: 30, mbps: 1.0, codec: "h264".into(), codificador: Some("libx264".into()), salida: salida.into(), audio: None, maestra: None, duracion: 0.0 }
    }
    fn cuadro_liso(n: u8) -> Vec<u8> { let mut f = vec![n; 64 * 36 * 4]; for p in f.chunks_mut(4) { p[3] = 255; } f }

    #[test]
    fn bloqueo_danado_se_recupera() {
        let m = std::sync::Arc::new(std::sync::Mutex::new(5));
        let m2 = m.clone();
        let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); panic!("falla con el bloqueo tomado"); }).join();
        assert!(m.is_poisoned());
        assert_eq!(*bloquear(&m), 5, "el dato sigue disponible");
    }

    #[test]
    fn exportacion_que_falla_a_medias_avisa_y_no_se_cuelga() {
        let lista = detectar();
        let mala = std::env::temp_dir().join("atrapa_no_existe_xyz").join("sub").join("o.mp4");
        let mut e = Exportacion::iniciar(&opts(&mala.to_string_lossy()), &lista).expect("iniciar");
        let t = std::time::Instant::now();
        let mut error = None;
        for n in 0..400u32 { if let Err(x) = e.cuadro(&cuadro_liso((n % 255) as u8)) { error = Some(x.to_string()); break; } std::thread::sleep(std::time::Duration::from_millis(5)); }
        let error = error.expect("debe avisar del fallo antes de terminar los cuadros");
        assert!(error.contains("FFmpeg"), "mensaje claro: {error}");
        assert!(t.elapsed().as_secs() < 20, "no debe colgarse");
        e.cancelar();
    }

    #[test]
    #[cfg(target_os = "linux")]
    fn exportacion_abandonada_no_deja_ffmpeg_colgado() {
        let lista = detectar();
        let dir = std::env::temp_dir().join("atrapa_abandono"); std::fs::create_dir_all(&dir).unwrap();
        let mut e = Exportacion::iniciar(&opts(&dir.join("o.mp4").to_string_lossy()), &lista).expect("iniciar");
        for n in 0..5 { e.cuadro(&cuadro_liso(n)).unwrap(); }
        let pid = e.pid();
        assert!(std::path::Path::new(&format!("/proc/{pid}")).exists(), "FFmpeg corre mientras se exporta");
        drop(e); // la ventana se cerró o falló sin llamar a terminar ni cancelar
        assert!(!std::path::Path::new(&format!("/proc/{pid}")).exists(), "FFmpeg debe cerrarse solo");
    }

    #[test]
    fn despues_de_cancelar_se_puede_exportar_de_nuevo() {
        let lista = detectar();
        let dir = std::env::temp_dir().join("atrapa_reintento"); std::fs::create_dir_all(&dir).unwrap();
        let a = dir.join("a.mp4"); let b = dir.join("b.mp4"); let _ = std::fs::remove_file(&b);
        let mut e1 = Exportacion::iniciar(&opts(&a.to_string_lossy()), &lista).expect("iniciar 1");
        for n in 0..3 { e1.cuadro(&cuadro_liso(n)).unwrap(); }
        e1.cancelar();
        let mut e2 = Exportacion::iniciar(&opts(&b.to_string_lossy()), &lista).expect("iniciar 2");
        for n in 0..30 { e2.cuadro(&cuadro_liso(n)).unwrap(); }
        e2.terminar().expect("la segunda exportación termina bien");
        assert!(std::fs::metadata(&b).map(|m| m.len()).unwrap_or(0) > 500, "el video existe y tiene contenido");
    }
}
