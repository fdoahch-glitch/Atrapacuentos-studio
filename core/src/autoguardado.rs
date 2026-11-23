//! Autoguardado permanente en disco, con las últimas 10 versiones y detección de cierres inesperados.
//! Carpeta: <datos>/autoguardado/<proyecto>/  →  reciente.atrapacuentos + <milisegundos>.atrapacuentos (hasta 10).
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

pub const MAX_VERSIONES: usize = 10;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Version { pub proyecto: String, pub ms: u64, pub bytes: u64, pub ruta: String }

/// nombre seguro para usar como carpeta
pub fn limpiar(nombre: &str) -> String {
    let s: String = nombre.chars().map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' }).collect();
    let s = s.trim().trim_matches('.').to_string();
    if s.is_empty() { "proyecto".into() } else { s.chars().take(80).collect() }
}

fn escribir_atomico(ruta: &Path, texto: &str) -> std::io::Result<()> {
    let tmp = ruta.with_extension("tmp");
    { let mut f = fs::File::create(&tmp)?; f.write_all(texto.as_bytes())?; f.sync_all()?; }
    fs::rename(&tmp, ruta)
}

fn numeradas(dir: &Path) -> Vec<(u64, PathBuf)> {
    let mut v: Vec<(u64, PathBuf)> = fs::read_dir(dir).into_iter().flatten().flatten().filter_map(|e| {
        let p = e.path();
        if p.extension().and_then(|x| x.to_str()) != Some("atrapacuentos") { return None; }
        let ms = p.file_stem()?.to_str()?.parse::<u64>().ok()?;
        Some((ms, p))
    }).collect();
    v.sort_by(|a, b| b.0.cmp(&a.0));
    v
}

/// Guarda siempre `reciente`; crea una versión nueva solo si el texto cambió y pasó `intervalo_ms` desde la última.
/// Devuelve true si se creó una versión nueva.
pub fn guardar(base: &Path, nombre: &str, texto: &str, ahora_ms: u64, intervalo_ms: u64) -> std::io::Result<bool> {
    let dir = base.join(limpiar(nombre));
    fs::create_dir_all(&dir)?;
    let reciente = dir.join("reciente.atrapacuentos");
    escribir_atomico(&reciente, texto)?;
    let vs = numeradas(&dir);
    let toca = match vs.first() {
        None => true,
        Some((ms, p)) => ahora_ms.saturating_sub(*ms) >= intervalo_ms && fs::read_to_string(p).map(|t| t != texto).unwrap_or(true),
    };
    if toca {
        escribir_atomico(&dir.join(format!("{ahora_ms}.atrapacuentos")), texto)?;
        for (_, p) in numeradas(&dir).into_iter().skip(MAX_VERSIONES) { let _ = fs::remove_file(p); }
    }
    Ok(toca)
}

/// Todas las versiones (más nuevas primero). Si `proyecto` es None, de todos los proyectos.
pub fn listar(base: &Path, proyecto: Option<&str>) -> Vec<Version> {
    let mut out = vec![];
    let carpetas: Vec<PathBuf> = match proyecto {
        Some(n) => vec![base.join(limpiar(n))],
        None => fs::read_dir(base).into_iter().flatten().flatten().map(|e| e.path()).filter(|p| p.is_dir()).collect(),
    };
    for d in carpetas {
        let nom = d.file_name().and_then(|x| x.to_str()).unwrap_or("").to_string();
        for (ms, p) in numeradas(&d) {
            out.push(Version { proyecto: nom.clone(), ms, bytes: fs::metadata(&p).map(|m| m.len()).unwrap_or(0), ruta: p.to_string_lossy().into() });
        }
    }
    out.sort_by(|a, b| b.ms.cmp(&a.ms));
    out
}

/// Lee una versión. Solo permite archivos dentro de `base`.
pub fn leer(base: &Path, ruta: &str) -> Result<String, String> {
    let r = fs::canonicalize(ruta).map_err(|e| e.to_string())?;
    let b = fs::canonicalize(base).map_err(|e| e.to_string())?;
    if !r.starts_with(&b) { return Err("ruta fuera del autoguardado".into()); }
    fs::read_to_string(r).map_err(|e| e.to_string())
}

/// El proyecto con el guardado `reciente` más nuevo (para recuperar tras un cierre inesperado).
pub fn mas_reciente(base: &Path) -> Option<(String, PathBuf, u64)> {
    fs::read_dir(base).ok()?.flatten().filter(|e| e.path().is_dir()).filter_map(|e| {
        let p = e.path().join("reciente.atrapacuentos");
        let t = fs::metadata(&p).ok()?.modified().ok()?.duration_since(std::time::UNIX_EPOCH).ok()?.as_millis() as u64;
        Some((e.file_name().to_string_lossy().into_owned(), p, t))
    }).max_by_key(|x| x.2)
}

/// Marca de sesión: se crea al abrir y se borra al cerrar bien. Si al abrir ya existe, hubo un cierre inesperado.
pub fn iniciar_sesion(base: &Path) -> bool {
    let _ = fs::create_dir_all(base);
    let m = base.join("sesion-abierta");
    let inesperado = m.exists();
    let _ = fs::write(&m, b"1");
    inesperado
}
pub fn cerrar_sesion(base: &Path) { let _ = fs::remove_file(base.join("sesion-abierta")); }

#[cfg(test)]
mod pruebas {
    use super::*;
    fn tmp(n: &str) -> PathBuf { let d = std::env::temp_dir().join(format!("atr_auto_{n}_{}", std::process::id())); let _ = fs::remove_dir_all(&d); d }

    #[test] fn nombre_seguro() { assert_eq!(limpiar("../a/b:c"), "___a_b_c"); assert_eq!(limpiar("  "), "proyecto"); }

    #[test] fn guarda_reciente_y_versiones_con_limite() {
        let d = tmp("lim");
        for i in 0..15u64 { guardar(&d, "Mi cuento", &format!("v{i}"), 1_000_000 + i * 100_000, 60_000).unwrap(); }
        let v = listar(&d, Some("Mi cuento"));
        assert_eq!(v.len(), MAX_VERSIONES);
        assert_eq!(fs::read_to_string(d.join("Mi cuento/reciente.atrapacuentos")).unwrap(), "v14");
        assert_eq!(leer(&d, &v[0].ruta).unwrap(), "v14");
        assert_eq!(leer(&d, &v[9].ruta).unwrap(), "v5");
    }

    #[test] fn no_crea_version_si_no_cambia_o_es_muy_pronto() {
        let d = tmp("int");
        assert!(guardar(&d, "p", "a", 1_000_000, 60_000).unwrap());
        assert!(!guardar(&d, "p", "b", 1_010_000, 60_000).unwrap());   // muy pronto
        assert!(!guardar(&d, "p", "a", 1_100_000, 60_000).unwrap());   // igual
        assert!(guardar(&d, "p", "b", 1_100_000, 60_000).unwrap());    // cambió y pasó el tiempo
        assert_eq!(listar(&d, Some("p")).len(), 2);
    }

    #[test] fn no_lee_fuera_de_la_carpeta() {
        let d = tmp("fuera"); fs::create_dir_all(&d).unwrap();
        let otro = std::env::temp_dir().join(format!("atr_otro_{}.txt", std::process::id())); fs::write(&otro, "x").unwrap();
        assert!(leer(&d, otro.to_str().unwrap()).is_err());
    }

    #[test] fn detecta_cierre_inesperado() {
        let d = tmp("ses");
        assert!(!iniciar_sesion(&d));      // primera vez: limpio
        assert!(iniciar_sesion(&d));       // no se cerró: inesperado
        cerrar_sesion(&d);
        assert!(!iniciar_sesion(&d));
    }

    #[test] fn recupera_el_mas_reciente() {
        let d = tmp("rec");
        guardar(&d, "a", "uno", 1_000_000, 1).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(20));
        guardar(&d, "b", "dos", 2_000_000, 1).unwrap();
        let (n, p, _) = mas_reciente(&d).unwrap();
        assert_eq!(n, "b"); assert_eq!(fs::read_to_string(p).unwrap(), "dos");
    }
}
