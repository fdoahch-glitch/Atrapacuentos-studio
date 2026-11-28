#!/usr/bin/env python3
"""Pone el mismo número de versión en tauri.conf.json y en los dos Cargo.toml.
Lo usa la construcción automática: así el programa instalado sabe qué versión es y compara bien con la última publicada.
Uso: python scripts/fijar-version.py 1.2.57"""
import json, os, re, sys
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = (sys.argv[1] if len(sys.argv) > 1 else "").strip().lstrip("vV")
if not re.fullmatch(r"\d+\.\d+\.\d+", v):
    sys.exit("Versión no válida: %r (se espera 1.2.57)" % v)
conf = os.path.join(raiz, "src-tauri", "tauri.conf.json")
d = json.load(open(conf, encoding="utf8")); d["version"] = v
open(conf, "w", encoding="utf8").write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
for rel in ("src-tauri/Cargo.toml", "core/Cargo.toml"):
    p = os.path.join(raiz, rel); t = open(p, encoding="utf8").read()
    n = re.sub(r'(?m)^version\s*=\s*"[^"]+"', 'version = "%s"' % v, t, count=1)
    if n == t and ('version = "%s"' % v) not in t: sys.exit("No encontré la versión en " + rel)
    open(p, "w", encoding="utf8").write(n)
print("Versión fijada:", v)
