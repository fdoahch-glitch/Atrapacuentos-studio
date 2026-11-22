# Baja FFmpeg (con NVENC / AMF / Quick Sync) y ONNX Runtime con DirectML (GPU de AMD, Nvidia e Intel) a src-tauri\bin (Windows).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$bin = "src-tauri\bin"; New-Item -ItemType Directory -Force $bin, ".tmp-bin" | Out-Null
if (-not (Test-Path "$bin\ffmpeg.exe")) {
  Write-Host "Bajando FFmpeg…"
  Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile ".tmp-bin\ff.zip"
  Expand-Archive ".tmp-bin\ff.zip" ".tmp-bin\ff" -Force
  Copy-Item (Get-ChildItem ".tmp-bin\ff" -Recurse -Filter ffmpeg.exe | Select-Object -First 1).FullName "$bin\ffmpeg.exe"
}
if (-not (Test-Path "$bin\onnxruntime.dll")) {
  Write-Host "Bajando ONNX Runtime con DirectML…"
  python -m pip download onnxruntime-directml==1.24.4 --platform win_amd64 --only-binary=:all: --no-deps --python-version 3.12 -d ".tmp-bin\ort" -q
  $whl = Get-ChildItem ".tmp-bin\ort" -Filter *.whl | Select-Object -First 1
  Copy-Item $whl.FullName ".tmp-bin\ort.zip"; Expand-Archive ".tmp-bin\ort.zip" ".tmp-bin\ortx" -Force
  foreach ($f in "onnxruntime.dll", "DirectML.dll", "onnxruntime_providers_shared.dll") { Copy-Item ".tmp-bin\ortx\onnxruntime\capi\$f" "$bin\$f" }
}
Remove-Item ".tmp-bin" -Recurse -Force
Write-Host "Listo:"; Get-ChildItem $bin | ForEach-Object { $_.Name }
