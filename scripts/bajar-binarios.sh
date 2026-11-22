#!/usr/bin/env bash
# Baja FFmpeg (con NVENC / AMF / Quick Sync) y ONNX Runtime a src-tauri/bin para el programa (Linux).
set -euo pipefail
cd "$(dirname "$0")/.."
BIN=src-tauri/bin; mkdir -p "$BIN" .tmp-bin
if [ ! -x "$BIN/ffmpeg" ]; then
  echo "Bajando FFmpeg…"
  curl -fL --retry 3 -o .tmp-bin/ff.tar.xz https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz
  tar -xJf .tmp-bin/ff.tar.xz -C .tmp-bin
  cp .tmp-bin/ffmpeg-*/bin/ffmpeg "$BIN/ffmpeg"; chmod +x "$BIN/ffmpeg"
fi
if [ ! -f "$BIN/libonnxruntime.so" ]; then
  echo "Bajando ONNX Runtime…"
  python3 -m pip download onnxruntime==1.24.4 --no-deps --only-binary=:all: -d .tmp-bin/ort -q
  python3 - <<'PY'
import zipfile,glob,shutil
z=zipfile.ZipFile(glob.glob('.tmp-bin/ort/*.whl')[0])
n=[i for i in z.namelist() if i.split('/')[-1].startswith('libonnxruntime.so.')][0]
open('src-tauri/bin/libonnxruntime.so','wb').write(z.read(n))
PY
fi
rm -rf .tmp-bin
echo "Listo: $(ls $BIN)"
