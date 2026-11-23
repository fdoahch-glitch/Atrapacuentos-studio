//! Búsqueda de versiones nuevas en GitHub Releases y descarga del instalador.
//! Nada se instala solo: la app avisa, la persona elige «Descargar e instalar» y recién ahí se baja y se abre el instalador.
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Novedad {
    pub version: String,
    pub notas: String,
    pub pagina: String,
    pub archivo: String,
    pub url: String,
    pub tamano: u64,
}

/// "v1.2.3-beta" → [1,2,3]. Lo que no se entienda cuenta como 0.
pub fn partes(v: &str) -> Vec<u64> {
    let v = v.trim().trim_start_matches(|c| c == 'v' || c == 'V');
    let v = v.split(|c| c == '-' || c == '+').next().unwrap_or("");
    v.split('.').map(|p| p.trim().parse::<u64>().unwrap_or(0)).collect()
}
/// ¿`nueva` es más reciente que `actual`?
pub fn es_mas_nueva(nueva: &str, actual: &str) -> bool {
    let (a, b) = (partes(nueva), partes(actual));
    for i in 0..a.len().max(b.len()) {
        let (x, y) = (*a.get(i).unwrap_or(&0), *b.get(i).unwrap_or(&0));
        if x != y { return x > y; }
    }
    false
}
/// Elige el instalador que corresponde a este sistema entre los archivos de la versión.
pub fn elegir_archivo(os: &str, assets: &[(String, String, u64)]) -> Option<(String, String, u64)> {
    let ok = |n: &str| -> bool {
        let n = n.to_lowercase();
        match os {
            "windows" => n.ends_with(".exe") && !n.contains("portable"),
            "linux" => n.ends_with(".appimage") || n.ends_with(".deb"),
            "macos" => n.ends_with(".dmg"),
            _ => false,
        }
    };
    // en Linux se prefiere AppImage (no pide permisos de administrador)
    let mut c: Vec<_> = assets.iter().filter(|a| ok(&a.0)).cloned().collect();
    c.sort_by_key(|a| if a.0.to_lowercase().ends_with(".appimage") { 0 } else { 1 });
    c.into_iter().next()
}
/// Convierte la respuesta JSON de GitHub (`releases/latest`) en una Novedad si es más nueva que `actual`.
pub fn interpretar(json: &str, actual: &str, os: &str) -> Result<Option<Novedad>> {
    let v: serde_json::Value = serde_json::from_str(json)?;
    if v.get("draft").and_then(|d| d.as_bool()).unwrap_or(false) || v.get("prerelease").and_then(|d| d.as_bool()).unwrap_or(false) { return Ok(None); }
    let tag = v.get("tag_name").and_then(|t| t.as_str()).ok_or_else(|| anyhow!("la respuesta no trae versión"))?;
    if !es_mas_nueva(tag, actual) { return Ok(None); }
    let assets: Vec<(String, String, u64)> = v.get("assets").and_then(|a| a.as_array()).map(|a| a.iter().filter_map(|x| {
        Some((x.get("name")?.as_str()?.to_string(), x.get("browser_download_url")?.as_str()?.to_string(), x.get("size").and_then(|s| s.as_u64()).unwrap_or(0)))
    }).collect()).unwrap_or_default();
    let (archivo, url, tamano) = elegir_archivo(os, &assets).unwrap_or_default();
    Ok(Some(Novedad {
        version: tag.trim_start_matches(|c| c == 'v' || c == 'V').to_string(),
        notas: v.get("body").and_then(|b| b.as_str()).unwrap_or("").chars().take(4000).collect(),
        pagina: v.get("html_url").and_then(|b| b.as_str()).unwrap_or("").to_string(),
        archivo, url, tamano,
    }))
}
/// Pregunta a GitHub. `repo` = "dueño/nombre". Necesita internet; si no hay, devuelve error y la app sigue normal.
pub fn buscar(repo: &str, actual: &str, os: &str) -> Result<Option<Novedad>> {
    if !repo.chars().all(|c| c.is_ascii_alphanumeric() || "-_./".contains(c)) || repo.matches('/').count() != 1 { return Err(anyhow!("repositorio no válido")); }
    let url = format!("https://api.github.com/repos/{repo}/releases/latest");
    let r = ureq::get(&url).set("User-Agent", "atrapacuentos-studio").set("Accept", "application/vnd.github+json").timeout(std::time::Duration::from_secs(12)).call()
        .map_err(|e| anyhow!("no pude consultar GitHub: {e}"))?;
    let txt = r.into_string()?;
    interpretar(&txt, actual, os)
}
/// Baja el archivo con avisos de progreso. Solo acepta direcciones https de github.com.
pub fn descargar(url: &str, dest: &Path, mut progreso: impl FnMut(u64, u64)) -> Result<()> {
    let host_ok = url.starts_with("https://github.com/") || url.starts_with("https://objects.githubusercontent.com/");
    if !host_ok { return Err(anyhow!("solo se descargan instaladores desde GitHub")); }
    let resp = ureq::get(url).set("User-Agent", "atrapacuentos-studio").call().map_err(|e| anyhow!("{e}"))?;
    let total: u64 = resp.header("content-length").and_then(|s| s.parse().ok()).unwrap_or(0);
    let tmp = dest.with_extension("parte");
    let mut f = std::fs::File::create(&tmp)?;
    let mut r = resp.into_reader(); let mut buf = vec![0u8; 1 << 20]; let mut n = 0u64;
    loop { let k = r.read(&mut buf)?; if k == 0 { break; } f.write_all(&buf[..k])?; n += k as u64; progreso(n, total); }
    drop(f);
    if total > 0 && n != total { let _ = std::fs::remove_file(&tmp); return Err(anyhow!("la descarga quedó incompleta ({n} de {total} bytes)")); }
    if n < 100_000 { let _ = std::fs::remove_file(&tmp); return Err(anyhow!("archivo demasiado chico")); }
    std::fs::rename(&tmp, dest)?;
    Ok(())
}

#[cfg(test)]
mod pruebas {
    use super::*;
    #[test] fn compara_versiones() {
        assert!(es_mas_nueva("v1.2.0", "1.1.0")); assert!(es_mas_nueva("1.10.0", "1.9.9")); assert!(!es_mas_nueva("1.1.0", "1.1.0"));
        assert!(!es_mas_nueva("1.0.9", "1.1.0")); assert!(es_mas_nueva("2", "1.9")); assert!(!es_mas_nueva("1.1", "1.1.0")); assert!(es_mas_nueva("1.1.1-beta", "1.1.0"));
    }
    fn demo() -> String {
        r#"{"tag_name":"v1.3.0","html_url":"https://github.com/x/y/releases/tag/v1.3.0","body":"Novedades","draft":false,"prerelease":false,"assets":[
          {"name":"Atrapacuentos Studio_1.3.0_x64-setup.exe","browser_download_url":"https://github.com/x/y/releases/download/v1.3.0/a-setup.exe","size":5000000},
          {"name":"atrapacuentos_1.3.0_amd64.deb","browser_download_url":"https://github.com/x/y/releases/download/v1.3.0/a.deb","size":4000000},
          {"name":"atrapacuentos_1.3.0_amd64.AppImage","browser_download_url":"https://github.com/x/y/releases/download/v1.3.0/a.AppImage","size":6000000}]}"#.into()
    }
    #[test] fn elige_instalador_por_sistema() {
        let w = interpretar(&demo(), "1.1.0", "windows").unwrap().unwrap();
        assert_eq!(w.version, "1.3.0"); assert!(w.archivo.ends_with("setup.exe")); assert_eq!(w.tamano, 5000000);
        let l = interpretar(&demo(), "1.1.0", "linux").unwrap().unwrap(); assert!(l.archivo.ends_with(".AppImage"));
        let m = interpretar(&demo(), "1.1.0", "macos").unwrap().unwrap(); assert!(m.url.is_empty());
    }
    #[test] fn no_avisa_si_ya_esta_al_dia_ni_con_borradores() {
        assert!(interpretar(&demo(), "1.3.0", "windows").unwrap().is_none());
        assert!(interpretar(&demo().replace("\"draft\":false", "\"draft\":true"), "1.0.0", "windows").unwrap().is_none());
        assert!(interpretar(&demo().replace("\"prerelease\":false", "\"prerelease\":true"), "1.0.0", "windows").unwrap().is_none());
        assert!(interpretar("no es json", "1.0.0", "windows").is_err());
    }
    #[test] fn solo_descarga_de_github() {
        let d = std::env::temp_dir().join("x.exe");
        assert!(descargar("https://example.com/a.exe", &d, |_, _| {}).is_err());
        assert!(buscar("no es un repo", "1.0.0", "windows").is_err());
    }
}
