//! Relieve con IA: un modelo de profundidad (Depth Anything V2) calcula qué tan cerca está cada punto.
//! Corre en la tarjeta de video con DirectML (AMD, Nvidia e Intel en Windows); si no hay, usa la CPU.
use anyhow::{anyhow, Context, Result};
use ort::session::Session;
use ort::value::Tensor;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use ort::environment::Environment;

pub const MODELO_NOMBRE: &str = "depth_anything_v2_small.onnx";
/// Direcciones donde se baja el modelo la primera vez (se prueba una tras otra).
pub const MODELO_URLS: &[&str] = &[
    "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx",
    "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/refs%2Fpr%2F1/onnx/model.onnx",
];
const MEDIA: [f32; 3] = [0.485, 0.456, 0.406];
const DESV: [f32; 3] = [0.229, 0.224, 0.225];

static ENTORNO: OnceLock<std::result::Result<Arc<Environment>, String>> = OnceLock::new();
fn iniciar_ort(dll: &Path) -> Result<Arc<Environment>> {
    let r = ENTORNO.get_or_init(|| {
        let b = ort::init_from(dll).map_err(|e| format!("{e}"))?;
        b.with_name("atrapa").build().map(Arc::new).map_err(|e| format!("{e}"))
    });
    r.clone().map_err(|e| anyhow!("{e}"))
}

/// Baja el modelo si todavía no está. `progreso(bytes, total)` para la barra.
pub fn asegurar_modelo(dir: &Path, mut progreso: impl FnMut(u64, u64)) -> Result<PathBuf> {
    std::fs::create_dir_all(dir)?;
    let dest = dir.join(MODELO_NOMBRE);
    if dest.exists() && std::fs::metadata(&dest)?.len() > 1_000_000 { return Ok(dest); }
    let mut ultimo = String::new();
    for url in MODELO_URLS {
        match descargar(url, &dest, &mut progreso) { Ok(()) => return Ok(dest), Err(e) => ultimo = format!("{e}") }
    }
    Err(anyhow!("No pude bajar el modelo de relieve ({ultimo}). Revisa tu internet o elige el archivo .onnx a mano."))
}
fn descargar(url: &str, dest: &Path, progreso: &mut impl FnMut(u64, u64)) -> Result<()> {
    let resp = ureq::get(url).call().map_err(|e| anyhow!("{e}"))?;
    let total: u64 = resp.header("content-length").and_then(|s| s.parse().ok()).unwrap_or(0);
    let tmp = dest.with_extension("parte");
    let mut f = std::fs::File::create(&tmp)?;
    let mut r = resp.into_reader(); let mut buf = vec![0u8; 1 << 20]; let mut n = 0u64;
    loop { let k = r.read(&mut buf)?; if k == 0 { break; } f.write_all(&buf[..k])?; n += k as u64; progreso(n, total); }
    drop(f);
    if n < 1_000_000 { let _ = std::fs::remove_file(&tmp); return Err(anyhow!("archivo incompleto")); }
    std::fs::rename(&tmp, dest)?;
    Ok(())
}

pub struct Relieve { sesion: Session, entrada: String, salida: String, lado: usize, pub gpu: bool }

impl Relieve {
    pub fn cargar(modelo: &Path, ort_lib: &Path) -> Result<Self> {
        let env = iniciar_ort(ort_lib).context("no se pudo cargar ONNX Runtime")?;
        let mut b = Session::builder(&env).map_err(|e| anyhow!("{e}"))?;
        #[allow(unused_mut)] let mut gpu = false;
        #[cfg(windows)] {
            // DirectML: la GPU (AMD, Nvidia o Intel). Si no se puede registrar, sigue con la CPU.
            use ort::ep::DirectML;
            match b.with_execution_providers([DirectML::default().build().error_on_failure()]) {
                Ok(nb) => { b = nb; gpu = true; }
                Err(e) => { b = e.recover(); }
            }
        }
        let s = b.commit_from_file(modelo).map_err(|e| anyhow!("no pude abrir el modelo: {e}"))?;
        let entrada = s.inputs().first().ok_or_else(|| anyhow!("modelo sin entradas"))?.name().to_string();
        let salida = s.outputs().first().ok_or_else(|| anyhow!("modelo sin salidas"))?.name().to_string();
        let lado = 518;
        Ok(Self { sesion: s, entrada, salida, lado, gpu })
    }

    /// Devuelve el mapa de relieve en grises (255 = más cerca) con el mismo aspecto de la imagen, lado mayor ≤ 1024.
    pub fn estimar(&mut self, rgba: &[u8], w: usize, h: usize) -> Result<(Vec<u8>, usize, usize)> {
        if rgba.len() != w * h * 4 { return Err(anyhow!("imagen de tamaño incorrecto")); }
        let l = self.lado;
        let mut t = vec![0f32; 3 * l * l];
        for y in 0..l { for x in 0..l {
            let p = muestra(rgba, w, h, x as f32 * w as f32 / l as f32, y as f32 * h as f32 / l as f32);
            for c in 0..3 { t[c * l * l + y * l + x] = (p[c] / 255.0 - MEDIA[c]) / DESV[c]; }
        } }
        let ent = Tensor::from_array(([1usize, 3, l, l], t)).map_err(|e| anyhow!("{e}"))?;
        let res = self.sesion.run(ort::inputs![self.entrada.as_str() => ent]).map_err(|e| anyhow!("{e}"))?;
        let (forma, datos) = res[self.salida.as_str()].try_extract_tensor::<f32>().map_err(|e| anyhow!("{e}"))?;
        let n = forma.len();
        if n < 2 { return Err(anyhow!("salida inesperada")); }
        let (oh, ow) = (forma[n - 2] as usize, forma[n - 1] as usize);
        if datos.len() < oh * ow { return Err(anyhow!("salida incompleta")); }
        Ok(normalizar(&datos[..oh * ow], ow, oh, w, h))
    }
}

/// Estira de min a max, y deja el tamaño final con el aspecto de la imagen original.
pub fn normalizar(d: &[f32], ow: usize, oh: usize, w: usize, h: usize) -> (Vec<u8>, usize, usize) {
    let (mut lo, mut hi) = (f32::MAX, f32::MIN);
    for v in d { if v.is_finite() { lo = lo.min(*v); hi = hi.max(*v); } }
    let r = if hi > lo { hi - lo } else { 1.0 };
    let esc = (1024.0 / w.max(h) as f32).min(1.0);
    let (fw, fh) = (((w as f32 * esc).round() as usize).max(2), ((h as f32 * esc).round() as usize).max(2));
    let mut o = vec![0u8; fw * fh];
    for y in 0..fh { for x in 0..fw {
        let sx = (x as f32 + 0.5) * ow as f32 / fw as f32 - 0.5; let sy = (y as f32 + 0.5) * oh as f32 / fh as f32 - 0.5;
        let (x0, y0) = (sx.floor().max(0.0), sy.floor().max(0.0));
        let (x1, y1) = ((x0 + 1.0).min(ow as f32 - 1.0), (y0 + 1.0).min(oh as f32 - 1.0));
        let (fx, fy) = ((sx - x0).clamp(0.0, 1.0), (sy - y0).clamp(0.0, 1.0));
        let g = |xx: f32, yy: f32| d[yy as usize * ow + xx as usize];
        let v = (g(x0, y0) * (1.0 - fx) + g(x1, y0) * fx) * (1.0 - fy) + (g(x0, y1) * (1.0 - fx) + g(x1, y1) * fx) * fy;
        o[y * fw + x] = (((v - lo) / r).clamp(0.0, 1.0) * 255.0).round() as u8;
    } }
    (o, fw, fh)
}

fn muestra(p: &[u8], w: usize, h: usize, x: f32, y: f32) -> [f32; 3] {
    let (x0, y0) = (x.floor().clamp(0.0, w as f32 - 1.0) as usize, y.floor().clamp(0.0, h as f32 - 1.0) as usize);
    let (x1, y1) = ((x0 + 1).min(w - 1), (y0 + 1).min(h - 1));
    let (fx, fy) = ((x - x0 as f32).clamp(0.0, 1.0), (y - y0 as f32).clamp(0.0, 1.0));
    let px = |xx: usize, yy: usize, c: usize| p[(yy * w + xx) * 4 + c] as f32;
    let mut o = [0f32; 3];
    for c in 0..3 { o[c] = (px(x0, y0, c) * (1.0 - fx) + px(x1, y0, c) * fx) * (1.0 - fy) + (px(x0, y1, c) * (1.0 - fx) + px(x1, y1, c) * fx) * fy; }
    o
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn normaliza_y_cambia_tamano() {
        let d: Vec<f32> = (0..16).map(|i| i as f32).collect();
        let (o, w, h) = normalizar(&d, 4, 4, 2000, 1000);
        assert_eq!((w, h), (1024, 512));
        assert_eq!(o[0], 0); assert!(o[w * h - 1] >= 250);
    }
    /// Si existe ATRAPA_ORT_LIB y ATRAPA_MODELO_PRUEBA corre un modelo de verdad (en CI y aquí con uno pequeño).
    #[test]
    fn corre_modelo_de_prueba() {
        let (Ok(lib), Ok(mo)) = (std::env::var("ATRAPA_ORT_LIB"), std::env::var("ATRAPA_MODELO_PRUEBA")) else { eprintln!("sin modelo de prueba, se omite"); return; };
        let mut r = Relieve::cargar(Path::new(&mo), Path::new(&lib)).expect("cargar");
        let (w, h) = (200usize, 120usize);
        let mut img = vec![255u8; w * h * 4];
        for y in 0..h { for x in 0..w { let i = (y * w + x) * 4; let v = (x * 255 / w) as u8; img[i] = v; img[i + 1] = v; img[i + 2] = v; } }
        let (m, dw, dh) = r.estimar(&img, w, h).expect("estimar");
        assert_eq!((dw, dh), (w, h));
        assert!(m[(h / 2) * w + w - 2] > m[(h / 2) * w + 1], "la derecha (más clara) debe quedar más cerca");
    }
}
