/* Exportación a MP4: reproduce el cuento cuadro a cuadro (tiempo fijo, sin saltos)
   y codifica cada cuadro con WebCodecs; mp4-muxer arma el archivo. */
(function(){
const $=id=>document.getElementById(id);
function init(){
  const S=window.Studio,A=window.__atr2;
  if(!S||!A||!$("exp"))return;
  let busy=false,lastUrl=null;
  const show=(a,b,c)=>{$("expOpts").hidden=!a;$("expProg").hidden=!b;$("expDone").hidden=!c;};
  const supported=()=>typeof VideoEncoder!=="undefined"&&typeof VideoFrame!=="undefined"&&typeof Mp4Muxer!=="undefined";
  const fmt=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");

  function openDlg(){
    if(busy)return;
    const sec=S.totalSeconds();
    $("expInfo").textContent="Duración total: "+fmt(sec)+" ("+S.proj.mundos.length+" escena"+(S.proj.mundos.length>1?"s":"")+").";
    const w=$("expWarn");
    if(!supported()){w.hidden=false;w.textContent="Este navegador no puede crear MP4. Usa Chrome o Edge actualizados (o la aplicación de escritorio).";$("expGo").disabled=true;}
    else{w.hidden=true;$("expGo").disabled=false;}
    {const sb=$("expSub");if(sb){const st=S.proj.sub||{};sb.checked=st.on!==false&&st.burn!==false;sb.onchange=()=>{S.proj.sub=Object.assign({},window.Dub&&Dub.SUBDEF,S.proj.sub||{});S.proj.sub.burn=sb.checked;if(sb.checked)S.proj.sub.on=true;S.changed();};}}
    {const lz=S.dim().lienzo,r=document.querySelector("input[name=expRes][value='"+lz.base+"']"),f=document.querySelector("input[name=expFps][value='"+lz.fps+"']");if(r)r.checked=true;if(f)f.checked=true;}
    {const l=S.proj.lienzo||{},m=$("expMbps"),c=$("expMbpsC"),pe=$("expPeso");
      if(m&&c){const val=String(l.mbps||0);if([...m.options].some(o=>o.value===val)){m.value=val;c.value="";}else{m.value="0";c.value=l.mbps;m.dataset.c=l.mbps;}
        const upd=()=>{const cv=+c.value;if(cv>0){m.dataset.c=cv;}else delete m.dataset.c;const mb=cv>0?cv:+m.value;
          if(pe)pe.textContent=mb>0?"hasta ≈ "+(mb*S.totalSeconds()/8).toFixed(0)+" MB":"";
          if(S.proj.lienzo&&S.proj.lienzo.mbps!==mb){S.proj.lienzo.mbps=mb;S.changed();}};
        m.onchange=()=>{c.value="";upd();};c.oninput=()=>{upd();};upd();}}
    {const nat=window.Nativo&&Nativo.activo,bx=$("expNat");if(bx){bx.hidden=!nat;
      if(nat){const info=Nativo.info,en=$("expEnc");
        const pinta=()=>{const cod=(info&&info.codificadores)||[],c=$("expCodec").value,g=cod.find(x=>x.codec===c&&x.gpu),cpu=cod.find(x=>x.codec===c);
          en.textContent=!info?"":g?"→ se usará tu tarjeta: "+g.marca:cpu?"→ tu tarjeta no ofrece este códec; se usará la CPU":"→ no disponible en este equipo";};
        const op=[...$("expCodec").options];for(const o of op){const c=((info&&info.codificadores)||[]).some(x=>x.codec===o.value);o.disabled=!!info&&!c;}
        $("expCodec").onchange=pinta;pinta();}}
      if(nat&&Nativo.info&&!Nativo.info.ffmpeg){w.hidden=false;w.textContent="No encontré FFmpeg en el programa; se usará el motor del navegador.";}}
    show(true,false,false);$("exp").hidden=false;
  }
  /* Codificador: siempre se pide la GPU. Si el equipo no puede, se usa la CPU y se avisa al final. */
  async function pickConfig(W,H,fps,bitrate){
    for(const hw of ["prefer-hardware","no-preference"]){
      for(const codec of ["avc1.640034","avc1.640032","avc1.64002A","avc1.4D0028","avc1.42E01F"]){
        const cfg={codec,width:W,height:H,bitrate,framerate:fps,avc:{format:"avc"},hardwareAcceleration:hw};
        try{const r=await VideoEncoder.isConfigSupported(cfg);if(r&&r.supported){const c=Object.assign({},r.config||cfg);c.hardwareAcceleration=hw;c._gpu=hw==="prefer-hardware";return c;}}catch(e){}
      }
    }
    return null;
  }
  /* ⚙ Camino nativo: los cuadros van al núcleo Rust, que los pasa por la tarjeta de video (wgpu) y los codifica con FFmpeg
     usando NVENC (Nvidia), AMF (AMD) o Quick Sync (Intel). */
  async function nativo(W,H,fps,mb){
    const nm=((S.proj.nombre||"mi-cuento").replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,"").trim()||"mi-cuento").replace(/\s+/g,"-");
    const salida=await Nativo.elegirVideo(nm);
    if(!salida){show(true,false,false);return;}
    const total=Math.round(ExportExtra.dur(S.totalSeconds())*fps),codec=$("expCodec").value;
    let audio=null,noAudioMsg="";
    if(window.Dub&&Dub.hasAudio()){
      try{const mix=ExportExtra.recorte(await Dub.mixdown(48000)),L=mix.getChannelData(0),R=mix.numberOfChannels>1?mix.getChannelData(1):L,il=new Float32Array(L.length*2);
        for(let i=0;i<L.length;i++){il[2*i]=L[i];il[2*i+1]=R[i];}
        audio=await Nativo.guardarAudio(48000,2,il);}catch(e){noAudioMsg="No pude preparar el audio; el video saldrá sin voz.";}
    }
    const maestra=$("expMaestra")&&$("expMaestra").checked?salida.replace(/\.mp4$/i,"")+"-maestra.mov":null;
    let info;
    try{info=await Nativo.iniciar({w:W,h:H,fps,mbps:mb||0,codec,salida,audio,maestra,duracion:total/fps,normalizar_lufs:!!($("expLufs")&&$("expLufs").checked)});}
    catch(e){$("expWarn").hidden=false;$("expWarn").textContent="No pude iniciar la exportación: "+e;show(true,false,false);busy=false;if(window.__onExportErr)__onExportErr(String(e));return;}
    const cv=$("cv"),eng=A.engine;eng.fijar(...ExportExtra.size(W,H));
    /* el cuadro se arma en un lienzo de la GPU y un shader lo convierte a YUV sin pasar por la CPU */
    const tmp=document.createElement("canvas");tmp.width=W;tmp.height=H;const g=tmp.getContext("2d");g.imageSmoothingQuality="high";
    const lector=Nativo.lector?Nativo.lector(W,H):null;
    let rgbaCtx=null;const leerRgba=()=>{if(!rgbaCtx){const c2=document.createElement("canvas");c2.width=W;c2.height=H;rgbaCtx=c2.getContext("2d",{willReadFrequently:true});}rgbaCtx.drawImage(tmp,0,0);return Promise.resolve(new Uint8Array(rgbaCtx.getImageData(0,0,W,H).data.buffer));};
    const cola=[];let bombeando=null,err=null,n=0;
    const M={t0:performance.now(),cap:0,envio:0,lect:0,llena:0,cuadros:0};
    const bombear=()=>bombeando||(bombeando=(async()=>{try{while(cola.length&&!err){const t1=performance.now();const b=await cola.shift();const t2=performance.now();M.lect+=t2-t1;await Nativo.cuadro(b);M.envio+=performance.now()-t2;M.cuadros++;}}catch(e){err=e;}bombeando=null;})());
    const ex={fps,cancelled:false,
      skip(){const l=!err&&(cola.length>=4||(lector&&lector.pendientes>=lector.capacidad));if(l)M.llena++;return l;},
      capture(){
        if(err||ex.cancelled)return;const tc=performance.now();
        g.drawImage(cv,0,0,W,H);if(window.Fx)Fx.draw(g,W,H);if(window.Dub)Dub.drawSub(g,W,H);
        cola.push(lector?lector.leer(tmp):leerRgba());bombear();n++;M.cap+=performance.now()-tc;
        const u=Math.min(1,n/total);$("expBar").style.width=(u*100).toFixed(1)+"%";if(window.__onExportProg)__onExportProg(u,n,total,fps);
        $("expTxt").textContent="Creando video con "+(info.gpu?info.marca:"la CPU")+"… "+Math.round(u*100)+"%  ("+fmt(n/fps)+" de "+fmt(total/fps)+")";
      },
      async end(){
        S.exporting=false;eng.soltar();
        try{
          if(ex.cancelled){if(lector)lector.cerrar();await Nativo.cancelar();show(true,false,false);busy=false;return;}
          while(bombeando||cola.length){bombear();await bombeando;if(err)break;}
          if(lector)lector.cerrar();
          if(err)throw err;
          const bytes=await Nativo.terminar();
          $("expVid").removeAttribute("src");$("expVid").hidden=true;
          const dl=$("expDl");dl.textContent="📂 Mostrar en la carpeta";dl.removeAttribute("download");dl.href="#";dl.onclick=ev=>{ev.preventDefault();Nativo.mostrar(salida);};
          $("expRes").textContent="¡Listo! "+W+"×"+H+" · "+fps+" cuadros/s · "+fmt(n/fps)+" · "+(bytes/1048576).toFixed(1)+" MB · "+(info.gpu?"codificado con la GPU: "+info.marca:"codificado con la CPU")+" ("+info.codificador+")"+(maestra?" · con copia maestra":"")+(audio?" · con voz":(noAudioMsg?" · "+noAudioMsg:""));
          {const tot=(performance.now()-M.t0)/1000,f=x=>(x/1000).toFixed(1);
           window.__expMedidas={total:+tot.toFixed(1),captura:+f(M.cap),lectura:+f(M.lect),envio:+f(M.envio),colaLlena:M.llena,cuadros:n,gpuLector:!!lector};
           $("expRes").textContent+=" · Tiempos: total "+tot.toFixed(1)+" s, captura del cuadro "+f(M.cap)+" s, esperando lectura de la GPU "+f(M.lect)+" s, envío al codificador "+f(M.envio)+" s, cola llena "+M.llena+" veces, lector GPU: "+(lector?"sí":"no")+".";}
          show(false,false,true);if(window.__onExportDone)__onExportDone(null,nm,$("expRes").textContent);
          {const sb=$("expSrtBtn");if(sb){sb.hidden=!(window.Subs&&Subs.cues().length);sb.onclick=()=>Subs.downloadSrt();}}
        }catch(e){
          if(lector)lector.cerrar();try{await Nativo.cancelar();}catch(_){}
          $("expWarn").hidden=false;$("expWarn").textContent="No se pudo terminar el video: "+(e&&e.message||e);show(true,false,false);if(window.__onExportErr)__onExportErr(String(e&&e.message||e));
        }
        busy=false;
      }};
    busy=true;show(false,true,false);$("expBar").style.width="0";S.exporting=true;
    if(!S.beginExport(ex)){S.exporting=false;busy=false;eng.soltar();Nativo.cancelar();show(true,false,false);}
  }
  async function start(){
    const tier=+document.querySelector("input[name=expRes]:checked").value,dm=S.dim(),asp=dm.asp;
    /* el valor elegido (720, 1080…) es el lado corto del video, según el formato del lienzo */
    const W=asp>=1?Math.round(tier*asp/2)*2:tier,H=asp>=1?tier:Math.round(tier/asp/2)*2;
    const fps=+document.querySelector("input[name=expFps]:checked").value;
    const px=W*H,mb=(+(($("expMbpsC")||{}).value)||0)||+(($("expMbps")||{}).value)||0,bitrate=mb>0?Math.round(mb*1e6):Math.round((px>=7e6?50e6:px>=3.5e6?24e6:px>=1.9e6?14e6:8e6)*(fps>=50?1.5:1));
    if(window.Nativo&&Nativo.activo&&Nativo.info&&Nativo.info.ffmpeg)return nativo(W,H,fps,mb);
    const dl=$("expDl");dl.onclick=null;dl.textContent="⬇ Descargar MP4";
    const cfg=await pickConfig(W,H,fps,bitrate);
    if(!cfg){$("expWarn").hidden=false;$("expWarn").textContent="Tu equipo no pudo preparar el codificador de video. Prueba con 720p.";if(window.__onExportErr)__onExportErr("Tu equipo no pudo preparar el codificador de video.");return;}
    const total=Math.round(ExportExtra.dur(S.totalSeconds())*fps);
    /* voces: se mezclan al ritmo del cuento y se guardan como audio AAC dentro del MP4 */
    let mix=null,noAudioMsg="",ac={codec:"mp4a.40.2",mux:"aac",sr:44100};
    if(window.Dub&&Dub.hasAudio()){
      try{
        for(const c of [{codec:"mp4a.40.2",mux:"aac",sr:44100},{codec:"opus",mux:"opus",sr:48000}]){
          const sup=typeof AudioEncoder!=="undefined"?await AudioEncoder.isConfigSupported({codec:c.codec,sampleRate:c.sr,numberOfChannels:2,bitrate:160000}):null;
          if(sup&&sup.supported){ac=c;mix=ExportExtra.recorte(await Dub.mixdown(c.sr));break;}
        }
        if(!mix)noAudioMsg="Este navegador no puede guardar audio en el MP4; saldrá sin voz.";
      }catch(e){noAudioMsg="No pude preparar el audio; el video saldrá sin voz.";}
    }
    const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:"avc",width:W,height:H},audio:mix?{codec:ac.mux,numberOfChannels:2,sampleRate:ac.sr}:undefined,fastStart:"in-memory"});
    let err=null;
    const enc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>{err=e;}});
    const usoGpu=cfg._gpu;delete cfg._gpu;enc.configure(cfg);
    const cv=$("cv"),eng=A.engine;
    eng.fijar(...ExportExtra.size(W,H));
    const tmp=document.createElement("canvas");tmp.width=W;tmp.height=H;const g=tmp.getContext("2d");g.imageSmoothingQuality="high";
    let n=0,skipped=false;
    const ex={
      fps,cancelled:false,
      skip(){skipped=err?false:enc.encodeQueueSize>8;return skipped;},
      capture(){
        if(skipped||err||ex.cancelled)return;
        g.drawImage(cv,0,0,W,H);if(window.Fx)Fx.draw(g,W,H);if(window.Dub)Dub.drawSub(g,W,H);
        const f=new VideoFrame(tmp,{timestamp:Math.round(n*1e6/fps),duration:Math.round(1e6/fps)});
        enc.encode(f,{keyFrame:n%(fps*2)===0});f.close();n++;
        const u=Math.min(1,n/total);$("expBar").style.width=(u*100).toFixed(1)+"%";if(window.__onExportProg)__onExportProg(u,n,total,fps);
        $("expTxt").textContent="Creando video… "+Math.round(u*100)+"%  ("+fmt(n/fps)+" de "+fmt(total/fps)+")";
      },
      async end(){
        S.exporting=false;
        eng.soltar();
        try{
          if(ex.cancelled){try{enc.close();}catch(e){}show(true,false,false);busy=false;return;}
          await enc.flush();enc.close();
          if(err)throw err;
          if(mix){
            const ae=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>{err=e;}});
            ae.configure({codec:ac.codec,sampleRate:ac.sr,numberOfChannels:2,bitrate:160000});
            const dL=mix.getChannelData(0),dR=mix.numberOfChannels>1?mix.getChannelData(1):dL,data=dL;
            for(let i=0;i<data.length;i+=4096){
              const k=Math.min(4096,data.length-i);
              const pl=new Float32Array(k*2);pl.set(dL.subarray(i,i+k),0);pl.set(dR.subarray(i,i+k),k);const ad=new AudioData({format:"f32-planar",sampleRate:ac.sr,numberOfFrames:k,numberOfChannels:2,timestamp:Math.round(i/ac.sr*1e6),data:pl});
              ae.encode(ad);ad.close();
              if(ae.encodeQueueSize>30)await new Promise(r=>setTimeout(r,5));
            }
            await ae.flush();ae.close();
            if(err)throw err;
          }
          muxer.finalize();
          const blob=new Blob([muxer.target.buffer],{type:"video/mp4"});
          if(lastUrl)URL.revokeObjectURL(lastUrl);lastUrl=URL.createObjectURL(blob);
          const nm=((S.proj.nombre||"mi-cuento").replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,"").trim()||"mi-cuento").replace(/\s+/g,"-");
          $("expVid").src=lastUrl;$("expDl").href=lastUrl;$("expDl").download=nm+".mp4";
          $("expRes").textContent="¡Listo! "+W+"×"+H+" · "+fps+" cuadros/s · "+fmt(n/fps)+" · "+(blob.size/1048576).toFixed(1)+" MB"+(usoGpu?" · codificado con GPU":" · codificado con CPU (tu equipo no ofreció GPU)")+(mix?" · con voz":(noAudioMsg?" · "+noAudioMsg:""));
          show(false,false,true);
          if(window.__onExportDone)__onExportDone(blob,nm,$("expRes").textContent);
          {const sb=$("expSrtBtn");if(sb){sb.hidden=!(window.Subs&&Subs.cues().length);sb.onclick=()=>Subs.downloadSrt();}}
        }catch(e){
          $("expWarn").hidden=false;$("expWarn").textContent="No se pudo terminar el video: "+(e&&e.message||e);show(true,false,false);if(window.__onExportErr)__onExportErr(e&&e.message||String(e));
        }
        busy=false;
      }
    };
    busy=true;show(false,true,false);$("expBar").style.width="0";
    S.exporting=true;
    if(!S.beginExport(ex)){S.exporting=false;busy=false;eng.soltar();show(true,false,false);}
  }
  $("bExp").onclick=openDlg;
  $("expGo").onclick=()=>{start().catch(e=>{busy=false;show(true,false,false);$("expWarn").hidden=false;$("expWarn").textContent="Error: "+(e&&e.message||e);if(window.__onExportErr)__onExportErr(e&&e.message||String(e));});};
  $("expCancel").onclick=()=>S.cancelExport();
  const close=()=>{if(busy)return;try{$("expVid").pause();}catch(e){}$("expVid").hidden=false;$("exp").hidden=true;};
  $("expClose").onclick=close;$("expClose2").onclick=close;
}
if(window.Studio)init();else document.addEventListener("studio-ready",init);
})();
