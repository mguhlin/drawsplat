
(function(){
let desktopSaved="",desktopGenerated="";
  const $=id=>document.getElementById(id);
  const t=(key,vars)=>window.WidgetI18n?window.WidgetI18n.t(key,vars):key;

  const state={
    frames: [], // {id, name, w, h, image}
    lastBlobUrl: null
  };
  let nextId=1;

  function setStatus(msg, cls){
    const el=$('statusLine'); el.textContent=msg||''; el.className='status '+(cls||'');
  }

  function renderList(){clearGenerated();queueMicrotask(()=>SplatWorkspace.changed('gifsplat'));
    const wrap=$('frameList');
    if(!state.frames.length){
      wrap.innerHTML='<p class="empty-hint">'+t('frames.empty')+'</p>';
      return;
    }
    wrap.innerHTML='';
    state.frames.forEach((f,idx)=>{
      const row=document.createElement('div'); row.className='frame-row';
      const img=document.createElement('img'); img.className='thumb'; img.src=f.image.src; img.alt='';
      const meta=document.createElement('div'); meta.className='meta';
      meta.innerHTML='<strong>'+(idx+1)+'.</strong> '+escapeHtml(f.name)+'<br><span style="color:#64748b">'+f.w+'×'+f.h+'</span>';
      const acts=document.createElement('div'); acts.className='row-actions';
      const up=mkBtn('↑', t('row.up'), ()=>move(idx,-1));
      const down=mkBtn('↓', t('row.down'), ()=>move(idx,1));
      const del=mkBtn('✕', t('row.remove'), ()=>remove(idx)); del.classList.add('danger');
      acts.append(up,down,del);
      row.append(img,meta,acts);
      wrap.append(row);
    });
  }
  function mkBtn(label,title,onClick){ const b=document.createElement('button'); b.type='button'; b.textContent=label; b.title=title; b.addEventListener('click',onClick); return b; }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function move(idx,dir){
    const j=idx+dir; if(j<0||j>=state.frames.length) return;
    const [item]=state.frames.splice(idx,1); state.frames.splice(j,0,item); renderList();
  }
  function remove(idx){ state.frames.splice(idx,1); renderList(); }

  async function loadFile(file){const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{const image=await DesktopProjects.importImage(file);return {id:nextId++,name:file.name,w:image.naturalWidth,h:image.naturalHeight,image};}finally{__desktopDone?.();}}

  $('frameInput').addEventListener('change', async ev=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{const files=[...ev.target.files||[]];let count=0,failed=0;for(const file of files){try{if(state.frames.length>=200)throw Error('Frame limit');const frame=await loadFile(file);if(state.frames.reduce((n,f)=>n+f.w*f.h,0)+frame.w*frame.h>64000000)throw Error('Pixel limit');state.frames.push(frame);count++;}catch{failed++;}}renderList();setStatus('Imported '+count+' frame(s).'+(failed?' '+failed+' file(s) could not be imported. Use images up to 32 MB / 24 megapixels; at most 200 frames and 64 megapixels total.':''),failed?'danger':'success');ev.target.value='';}finally{__desktopDone?.();}});

  $('clearFramesBtn').addEventListener('click', async()=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{if(!await SplatWorkspace.confirmReplace('gifsplat'))return;
    state.frames=[]; renderList(); setStatus(t('status.cleared'),'info');
  }finally{__desktopDone?.();}});
  $('resetBtn').addEventListener('click', async()=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{if(!await SplatWorkspace.confirmReplace('gifsplat'))return;state.lastBlob=null;
    state.frames=[]; renderList();
    $('previewWrap').innerHTML='<p class="placeholder">'+t('preview.placeholder')+'</p>';
    $('downloadBtn').disabled=true;
    if(state.lastBlobUrl){ URL.revokeObjectURL(state.lastBlobUrl); state.lastBlobUrl=null; }
    setStatus('','');
  }finally{__desktopDone?.();}});

  // Encoder lives in assets/js/gif-encoder.js (window.DrawSplatGifEncoder).

  function framesToCanvases(){
    const first=state.frames[0];
    const maxW=parseInt($('maxWidthInput').value,10)||0;
    let targetW=first.w, targetH=first.h;
    if(maxW>0 && first.w>maxW){
      const scale=maxW/first.w;
      targetW=Math.round(first.w*scale);
      targetH=Math.round(first.h*scale);
    }
    if(targetW*targetH*state.frames.length>64000000)throw Error('This animation exceeds 64 megapixels. Reduce maximum width or frame count.');
    return state.frames.map(f=>{
      const c=document.createElement('canvas'); c.width=targetW; c.height=targetH;
      const ctx=c.getContext('2d');
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,targetW,targetH);
      // Letterbox/scale-fit the frame inside targetW×targetH to preserve aspect.
      const fr=f.w/f.h, tr=targetW/targetH;
      let dw, dh;
      if(fr>tr){ dw=targetW; dh=Math.round(targetW/fr); } else { dh=targetH; dw=Math.round(targetH*fr); }
      const dx=Math.round((targetW-dw)/2), dy=Math.round((targetH-dh)/2);
      ctx.drawImage(f.image, dx, dy, dw, dh);
      return c;
    });
  }

  $('generateBtn').addEventListener('click', ()=>{
    if(!state.frames.length){ setStatus(t('status.needFrames'),'danger'); return; }
    if(SplatWorkspace.busy){setStatus('Finish the current operation before generating.','info');return;}const desktopEnd=SplatWorkspace.beginOperation(),desktopStart=desktopStamp(),desktopInert=document.body.inert;document.body.inert=true;const btn=$('generateBtn'); btn.disabled=true; setStatus(t('status.encoding'),'info');
    setTimeout(()=>{
      try{
        const delayMs=parseInt($('delayInput').value,10)||450;
        const loop=Math.max(0, parseInt($('loopInput').value,10)||0);
        const mode=$('qualityInput').value==='fast'?'fast':'best';
        const dither=$('ditherInput').checked;
        const paletteSize=parseInt($('paletteSizeInput').value,10)||256;
        const canvases=framesToCanvases();
        const blob=window.DrawSplatGifEncoder.encode(canvases, {delayMs, loopCount:loop, mode, dither, paletteSize});
        if(state.lastBlobUrl) URL.revokeObjectURL(state.lastBlobUrl);
        state.lastBlobUrl=URL.createObjectURL(blob);state.lastBlob=blob;desktopGenerated=desktopStart;
        const wrap=$('previewWrap'); wrap.innerHTML='';
        const img=document.createElement('img'); img.src=state.lastBlobUrl; img.alt='Generated GIF preview';
        wrap.appendChild(img);
        $('downloadBtn').disabled=false;
        const kb=Math.round(blob.size/1024);
        setStatus(t('status.ready',{kb:kb}),'success');
      }catch(err){
        setStatus(t('status.encodeFail',{msg:err.message||err}),'danger');
      }finally{
        btn.disabled=false;document.body.inert=desktopInert;desktopEnd();
      }
    }, 16);
  });

  $('downloadBtn').addEventListener('click', async()=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{if(!state.lastBlob)return;await desktopSave(state.lastBlob,'GIFsplat-animation.gif',{tool:'gifsplat',stamp:desktopGenerated,complete:true});}finally{__desktopDone?.();}});

  // Hide the video button entirely if the browser can't record.
  if (window.DrawSplatGifEncoder && !window.DrawSplatGifEncoder.videoSupported()) {
    const vb = $('recordVideoBtn'); if (vb) vb.style.display = 'none';
  }
  $('recordVideoBtn')?.addEventListener('click', async ()=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{
    if(!state.frames.length){ setStatus(t('status.needFrames'),'danger'); return; }
    const btn=$('recordVideoBtn'); btn.disabled=true;
    const delayMs=parseInt($('delayInput').value,10)||450;
    const loop=Math.max(1, parseInt($('loopInput').value,10)||1);
    // WebCodecs path is not real-time; MediaRecorder path is. Show the
    // real-time estimate either way — it's the upper bound.
    const usingWebCodecs = window.DrawSplatGifEncoder && window.DrawSplatGifEncoder.webCodecsMp4Available && window.DrawSplatGifEncoder.webCodecsMp4Available();
    const msgKey = usingWebCodecs ? 'status.encodingMp4' : 'status.recording';
    setStatus(t(msgKey,{s: Math.ceil(state.frames.length * loop * delayMs / 1000)}),'info');
    try{
      const canvases=framesToCanvases();
      const blob=await window.DrawSplatGifEncoder.encodeVideo(canvases, {delayMs, loopCount:loop});
      const ext = blob.type.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      if(!await desktopSave(blob,'GIFsplat-animation.'+ext))return;
      const kb=Math.round(blob.size/1024);
      setStatus(t('status.videoReady',{kb:kb, ext:ext.toUpperCase()}),'success');
    } catch(err){
      setStatus(t('status.videoFail',{msg:err.message||err}),'danger');
    } finally {
      btn.disabled=false;
    }
  }finally{__desktopDone?.();}});

  // Re-render the (mostly static) UI text on language change.
  document.addEventListener('widget-i18n:changed', renderList);
  renderList();

function clearGenerated(){if(state.lastBlobUrl){URL.revokeObjectURL(state.lastBlobUrl);state.lastBlobUrl=null;}state.lastBlob=null;$('downloadBtn').disabled=true;$('previewWrap').innerHTML='<p class="placeholder">'+t('preview.placeholder')+'</p>';desktopGenerated='';}
for(const id of ['delayInput','loopInput','maxWidthInput','qualityInput','paletteSizeInput','ditherInput'])$(id).addEventListener('input',clearGenerated);
function desktopStamp(){return JSON.stringify({frames:state.frames.map(f=>f.id),settings:['delayInput','loopInput','maxWidthInput','qualityInput','paletteSizeInput','ditherInput'].map(id=>[$(id)?.value,$(id)?.checked])});}
async function desktopSave(blob,name,details={}){const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{try{const ok=await SplatWorkspace.saveBlob(blob,name,details);$('statusLine').textContent=ok?(SplatWorkspace.native?'Saved ':'Download requested for ')+name:'Save cancelled. Your work is still open.';return ok;}catch(error){$('statusLine').textContent='Save failed: '+error.message;return false;}}finally{__desktopDone?.();}}
const desktopPristine=desktopStamp();
SplatWorkspace.registerWorkspace('gifsplat',{isDirty:()=>desktopStamp()!==(desktopSaved||desktopPristine),markSaved:stamp=>desktopSaved=stamp});

const project=DesktopProjects;
project.install({id:'gifsplat',extension:'gifsplat',status:message=>setStatus(message,'info'),stamp:desktopStamp,clean:stamp=>desktopSaved=stamp,
 serialize:()=>({frames:state.frames.map(f=>({name:f.name,src:f.image.src})),settings:{delay:Number($('delayInput').value),loop:Number($('loopInput').value),width:Number($('maxWidthInput').value),quality:$('qualityInput').value,palette:Number($('paletteSizeInput').value),dither:$('ditherInput').checked}}),
 prepare:async data=>{const __desktopDone=globalThis.SplatWorkspace?.beginOperation();try{project.require(Array.isArray(data?.frames)&&data.frames.length<=200,'A GIF project supports up to 200 frames.');const s=data.settings;project.require(s&&typeof s.dither==='boolean','Invalid GIF settings.');const settings={delay:project.number(s.delay,20,10000),loop:project.number(s.loop,0,65535),width:project.number(s.width,0,8192),quality:project.choice(s.quality,['best','fast']),palette:project.choice(s.palette,[32,64,128,256]),dither:s.dither};const frames=[];let pixels=0;for(const frame of data.frames){const name=project.text(frame.name),image=await project.image(frame.src);pixels+=image.naturalWidth*image.naturalHeight;project.require(pixels<=64000000,'A GIF project exceeds the 64-megapixel frame limit.');frames.push({name,image,w:image.naturalWidth,h:image.naturalHeight});}return{settings,frames};}finally{__desktopDone?.();}},
 commit:({settings:s,frames})=>{state.frames=frames.map(f=>({...f,id:nextId++}));for(const[id,value]of [['delayInput',s.delay],['loopInput',s.loop],['maxWidthInput',s.width],['qualityInput',s.quality],['paletteSizeInput',s.palette]])$(id).value=value;$('ditherInput').checked=s.dither;clearGenerated();renderList();}
});

})();
