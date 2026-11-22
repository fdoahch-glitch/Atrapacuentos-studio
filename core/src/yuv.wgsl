// RGBA8 -> YUV 4:2:0 planar (BT.709, rango limitado) en la tarjeta de video.
struct P { w: u32, h: u32, ny: u32, nu: u32 };
@group(0) @binding(0) var<storage, read> src: array<u32>;
@group(0) @binding(1) var<storage, read_write> dst: array<u32>;
@group(0) @binding(2) var<uniform> p: P;

fn px(x: u32, y: u32) -> vec3<f32> {
  let v = src[y * p.w + x];
  return vec3<f32>(f32(v & 255u), f32((v >> 8u) & 255u), f32((v >> 16u) & 255u));
}
fn yval(c: vec3<f32>) -> f32 { return 16.0 + (0.2126 * c.x + 0.7152 * c.y + 0.0722 * c.z) * 219.0 / 255.0; }
fn uval(c: vec3<f32>) -> f32 { return 128.0 + (-0.1146 * c.x - 0.3854 * c.y + 0.5 * c.z) * 224.0 / 255.0; }
fn vval(c: vec3<f32>) -> f32 { return 128.0 + (0.5 * c.x - 0.4542 * c.y - 0.0458 * c.z) * 224.0 / 255.0; }
fn q(v: f32) -> u32 { return u32(clamp(round(v), 0.0, 255.0)); }

fn byte_at(k: u32) -> u32 {
  // k: posicion del byte en el cuadro YUV completo (Y, luego U, luego V)
  let cw = p.w / 2u;
  if (k < p.ny) {
    return q(yval(px(k % p.w, k / p.w)));
  }
  var j = k - p.ny;
  var isv = false;
  if (j >= p.nu) { j = j - p.nu; isv = true; }
  if (j >= p.nu) { return 0u; }
  let cx = j % cw; let cy = j / cw;
  let c = (px(2u * cx, 2u * cy) + px(2u * cx + 1u, 2u * cy) + px(2u * cx, 2u * cy + 1u) + px(2u * cx + 1u, 2u * cy + 1u)) * 0.25;
  if (isv) { return q(vval(c)); }
  return q(uval(c));
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>, @builtin(num_workgroups) nw: vec3<u32>) {
  let i = id.x + id.y * nw.x * 256u;
  let total = p.ny + 2u * p.nu;
  let base = i * 4u;
  if (base >= total) { return; }
  var o = 0u;
  for (var b = 0u; b < 4u; b = b + 1u) {
    if (base + b < total) { o = o | (byte_at(base + b) << (8u * b)); }
  }
  dst[i] = o;
}
