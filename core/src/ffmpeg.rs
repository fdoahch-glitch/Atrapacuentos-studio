//! Codificación con FFmpeg: elige sola el codificador de la tarjeta de video
//! (NVENC de Nvidia, AMF de AMD, Quick Sync de Intel) y, si no hay, usa la CPU.
use crate::yuv::Yuv;
use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};

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

pub struct Exportacion { child: Child, stdin: Option<ChildStdin>, errores: std::sync::Arc<std::sync::Mutex<String>>, yuv: Yuv, pub usado: Codificador, pub cuadros: u64, pub gpu_nombre: String }

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
        id if id.ends_with("_amf") => a.extend([s("-quality"), s("quality"), s("-rc"), s("vbr_peak")]),
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
        a.extend(["-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart"].map(String::from));
        a.push(o.salida.clone());
        if let Some(m) = &o.maestra {
            // copia maestra sin pérdida visible (ProRes 422 HQ) para editar o volver a exportar
            if o.duracion > 0.0 { a.extend(["-t".to_string(), format!("{:.3}", o.duracion)]); }
            a.extend(["-map", "0:v", "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le"].map(String::from));
            if o.audio.is_some() { a.extend(["-map", "1:a", "-c:a", "pcm_s16le"].map(String::from)); }
            a.push(m.clone());
        }
        let mut child = cmd(&ffmpeg_path()).args(&a).stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::piped()).spawn().context("no se pudo abrir FFmpeg")?;
        let stdin = child.stdin.take();
        // se lee lo que diga FFmpeg mientras trabaja, para poder explicar un fallo
        let errores = std::sync::Arc::new(std::sync::Mutex::new(String::new()));
        if let Some(mut se) = child.stderr.take() {
            let e2 = errores.clone();
            std::thread::spawn(move || { use std::io::Read; let mut b = [0u8; 4096]; while let Ok(n) = se.read(&mut b) { if n == 0 { break; } let mut g = e2.lock().unwrap(); if g.len() < 8000 { g.push_str(&String::from_utf8_lossy(&b[..n])); } } });
        }
        let gpu_nombre = format!("{} ({}, {})", yuv.info.nombre, yuv.info.api, yuv.info.tipo);
        Ok(Self { child, stdin, errores, yuv, usado: enc, cuadros: 0, gpu_nombre })
    }

    pub fn cuadro(&mut self, rgba: &[u8]) -> Result<()> {
        let yuv = self.yuv.convertir(rgba)?;
        let si = self.stdin.as_mut().ok_or_else(|| anyhow!("la exportación ya terminó"))?;
        if let Err(e) = si.write_all(&yuv) {
            std::thread::sleep(std::time::Duration::from_millis(150));
            let det = self.errores.lock().unwrap().trim().to_string();
            return Err(anyhow!("FFmpeg dejó de responder ({}): {}", self.usado.id, if det.is_empty() { e.to_string() } else { det }));
        }
        self.cuadros += 1;
        Ok(())
    }

    pub fn terminar(mut self) -> Result<()> {
        drop(self.stdin.take());
        let st = self.child.wait()?;
        std::thread::sleep(std::time::Duration::from_millis(100));
        if !st.success() { return Err(anyhow!("FFmpeg falló ({}): {}", self.usado.id, self.errores.lock().unwrap().trim())); }
        Ok(())
    }
    pub fn cancelar(mut self) { drop(self.stdin.take()); let _ = self.child.kill(); let _ = self.child.wait(); }
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
        let p = Command::new("ffprobe").args(["-v", "error", "-show_entries", "stream=codec_name,width,height,pix_fmt,color_space:format=duration", "-of", "default=nw=1"]).arg(dir.join("o.mp4")).output().unwrap();
        let t = String::from_utf8_lossy(&p.stdout).to_string(); eprintln!("{t}");
        assert!(t.contains("h264") && t.contains("width=320") && t.contains("aac") && t.contains("bt709"));
        let m = Command::new("ffprobe").args(["-v", "error", "-show_entries", "stream=codec_name", "-of", "default=nw=1"]).arg(dir.join("m.mov")).output().unwrap();
        assert!(String::from_utf8_lossy(&m.stdout).contains("prores"));
    }
}
