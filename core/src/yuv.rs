//! Convierte cuadros RGBA a YUV 4:2:0 usando la GPU (wgpu: Vulkan / DirectX 12 / Metal).
//! Funciona igual en AMD, Nvidia e Intel. Así FFmpeg recibe el cuadro ya listo (62 % menos datos).
use anyhow::{anyhow, Result};
use wgpu::util::DeviceExt;

#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
struct Params { w: u32, h: u32, ny: u32, nu: u32 }

#[derive(serde::Serialize, Clone, Debug)]
pub struct GpuInfo { pub nombre: String, pub api: String, pub tipo: String }

/// Lista las tarjetas de video que wgpu encuentra (Vulkan, DirectX 12, Metal).
pub fn adaptadores() -> Vec<GpuInfo> {
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
    pollster::block_on(instance.enumerate_adapters(wgpu::Backends::all())).into_iter().map(|a| { let i = a.get_info(); GpuInfo { nombre: i.name.clone(), api: format!("{:?}", i.backend), tipo: format!("{:?}", i.device_type) } }).collect()
}

pub struct Yuv {
    device: wgpu::Device,
    queue: wgpu::Queue,
    pipe: wgpu::ComputePipeline,
    bind: wgpu::BindGroup,
    src: wgpu::Buffer,
    out: wgpu::Buffer,
    read: wgpu::Buffer,
    w: u32, h: u32, total: u64, groups: (u32, u32),
    pub info: GpuInfo,
}

impl Yuv {
    pub fn new(w: u32, h: u32) -> Result<Self> {
        if w == 0 || h == 0 || w % 2 != 0 || h % 2 != 0 { return Err(anyhow!("el tamaño debe ser par ({w}x{h})")); }
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
        let (adapter, fallback) = match pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance, compatible_surface: None, force_fallback_adapter: false, ..Default::default()
        })) { Ok(a) => (a, false), Err(_) => (pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::LowPower, compatible_surface: None, force_fallback_adapter: true, ..Default::default()
        })).map_err(|e| anyhow!("no hay GPU compatible: {e}"))?, true) };
        let ai = adapter.get_info();
        let al = adapter.limits();
        let limits = al.clone();
        let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
            label: Some("atrapa"), required_features: wgpu::Features::empty(), required_limits: limits, ..Default::default()
        })).map_err(|e| anyhow!("no se pudo abrir la GPU: {e}"))?;
        let ny = w * h; let nu = (w / 2) * (h / 2);
        let total = (ny + 2 * nu) as u64;
        let words = (total + 3) / 4;
        let sh = device.create_shader_module(wgpu::ShaderModuleDescriptor { label: Some("yuv"), source: wgpu::ShaderSource::Wgsl(include_str!("yuv.wgsl").into()) });
        let pipe = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor { label: Some("yuv"), layout: None, module: &sh, entry_point: Some("main"), compilation_options: Default::default(), cache: None });
        let src = device.create_buffer(&wgpu::BufferDescriptor { label: Some("rgba"), size: (w as u64 * h as u64 * 4), usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST, mapped_at_creation: false });
        let out_sz = words * 4;
        let out = device.create_buffer(&wgpu::BufferDescriptor { label: Some("yuv"), size: out_sz, usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC, mapped_at_creation: false });
        let read = device.create_buffer(&wgpu::BufferDescriptor { label: Some("leer"), size: out_sz, usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST, mapped_at_creation: false });
        let prm = device.create_buffer_init(&wgpu::util::BufferInitDescriptor { label: Some("p"), contents: bytemuck::bytes_of(&Params { w, h, ny, nu }), usage: wgpu::BufferUsages::UNIFORM });
        let bind = device.create_bind_group(&wgpu::BindGroupDescriptor { label: None, layout: &pipe.get_bind_group_layout(0), entries: &[
            wgpu::BindGroupEntry { binding: 0, resource: src.as_entire_binding() },
            wgpu::BindGroupEntry { binding: 1, resource: out.as_entire_binding() },
            wgpu::BindGroupEntry { binding: 2, resource: prm.as_entire_binding() },
        ]});
        let gtotal = ((words + 255) / 256) as u32;
        let maxd = al.max_compute_workgroups_per_dimension.max(1);
        let groups = if gtotal <= maxd { (gtotal, 1) } else { (maxd, (gtotal + maxd - 1) / maxd) };
        let info = GpuInfo { nombre: ai.name.clone(), api: format!("{:?}", ai.backend), tipo: if fallback { "software".into() } else { format!("{:?}", ai.device_type) } };
        Ok(Self { device, queue, pipe, bind, src, out, read, w, h, total, groups, info })
    }

    /// RGBA (w*h*4 bytes) -> I420 (w*h*3/2 bytes)
    pub fn convertir(&self, rgba: &[u8]) -> Result<Vec<u8>> {
        if rgba.len() as u64 != self.w as u64 * self.h as u64 * 4 { return Err(anyhow!("cuadro de tamaño incorrecto")); }
        self.queue.write_buffer(&self.src, 0, rgba);
        let mut enc = self.device.create_command_encoder(&Default::default());
        {
            let mut pass = enc.begin_compute_pass(&Default::default());
            pass.set_pipeline(&self.pipe); pass.set_bind_group(0, &self.bind, &[]);
            pass.dispatch_workgroups(self.groups.0, self.groups.1, 1);
        }
        let sz = self.read.size();
        enc.copy_buffer_to_buffer(&self.out, 0, &self.read, 0, sz);
        self.queue.submit(Some(enc.finish()));
        let sl = self.read.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        sl.map_async(wgpu::MapMode::Read, move |r| { let _ = tx.send(r); });
        self.device.poll(wgpu::PollType::wait_indefinitely()).map_err(|e| anyhow!("{e:?}"))?;
        rx.recv()?.map_err(|e| anyhow!("{e:?}"))?;
        let v = sl.get_mapped_range().map_err(|e| anyhow!("{e:?}"))?[..self.total as usize].to_vec();
        self.read.unmap();
        Ok(v)
    }
}

/// Versión en CPU, solo para comprobar que la GPU calcula lo mismo.
pub fn rgba_a_i420_cpu(w: usize, h: usize, rgba: &[u8]) -> Vec<u8> {
    let q = |v: f32| v.round().clamp(0.0, 255.0) as u8;
    let mut o = vec![0u8; w * h * 3 / 2];
    let (cw, ch) = (w / 2, h / 2);
    let px = |x: usize, y: usize| { let i = (y * w + x) * 4; [rgba[i] as f32, rgba[i + 1] as f32, rgba[i + 2] as f32] };
    for y in 0..h { for x in 0..w { let c = px(x, y); o[y * w + x] = q(16.0 + (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * 219.0 / 255.0); } }
    for cy in 0..ch { for cx in 0..cw {
        let mut c = [0f32; 3];
        for (dx, dy) in [(0, 0), (1, 0), (0, 1), (1, 1)] { let p = px(2 * cx + dx, 2 * cy + dy); for k in 0..3 { c[k] += p[k] * 0.25; } }
        o[w * h + cy * cw + cx] = q(128.0 + (-0.1146 * c[0] - 0.3854 * c[1] + 0.5 * c[2]) * 224.0 / 255.0);
        o[w * h + cw * ch + cy * cw + cx] = q(128.0 + (0.5 * c[0] - 0.4542 * c[1] - 0.0458 * c[2]) * 224.0 / 255.0);
    }}
    o
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn gpu_igual_que_cpu() {
        let (w, h) = (96usize, 54usize);
        let mut f = vec![0u8; w * h * 4];
        for y in 0..h { for x in 0..w { let i = (y * w + x) * 4; f[i] = (x * 255 / w) as u8; f[i + 1] = (y * 255 / h) as u8; f[i + 2] = ((x + y) * 3 % 256) as u8; f[i + 3] = 255; } }
        let g = Yuv::new(w as u32, h as u32).expect("gpu");
        eprintln!("GPU: {} ({}, {})", g.info.nombre, g.info.api, g.info.tipo);
        let a = g.convertir(&f).unwrap(); let b = rgba_a_i420_cpu(w, h, &f);
        assert_eq!(a.len(), b.len());
        let maxd = a.iter().zip(&b).map(|(x, y)| (*x as i32 - *y as i32).abs()).max().unwrap();
        assert!(maxd <= 1, "diferencia máxima {maxd}");
    }
}
