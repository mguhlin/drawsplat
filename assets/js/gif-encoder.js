// DrawSplat shared GIF encoder.
// Single entry point: window.DrawSplatGifEncoder.encode(canvases, opts) → Blob
//
//   opts = {
//     delayMs:   Number,   // per-frame delay in ms (default 450)
//     loopCount: Number,   // 0 = forever (default 0)
//     mode:      'fast' | 'best',  // 'fast' = fixed 256-color cube palette
//                                    'best' = per-frame median-cut palette
//     dither:    Boolean   // Floyd-Steinberg error diffusion ('best' only)
//   }
//
// 'fast' is identical to the original whiteboard encoder: small + quick, but
// gradients/photos posterize visibly. 'best' picks the 256 most-useful colors
// per frame via median-cut, optionally dithering to mask remaining banding.
// Pixels with alpha<80 map to palette index 255 — same convention the
// whiteboard's original encoder used.
(function(){
  function cubePalette(){
    const p=[];
    for(let r=0;r<8;r++) for(let g=0;g<8;g++) for(let b=0;b<4;b++){
      p.push(Math.round(r*255/7), Math.round(g*255/7), Math.round(b*255/3));
    }
    return p;
  }
  function cubeIndices(canvas){
    const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    const out=new Uint8Array(canvas.width*canvas.height);
    for(let i=0,j=0;i<d.length;i+=4,j++){
      const a=d[i+3]; if(a<80){ out[j]=255; continue; }
      const r=d[i]>>5, g=d[i+1]>>5, b=d[i+2]>>6;
      out[j]=(r<<5)|(g<<2)|b;
    }
    return out;
  }
  function packSubBlocks(bytes){
    const out=[];
    for(let i=0;i<bytes.length;i+=255){
      const chunk=bytes.slice(i,i+255);
      out.push(chunk.length, ...chunk);
    }
    out.push(0);
    return out;
  }
  function appendBytes(target,bytes){
    for(let i=0;i<bytes.length;i+=8192) target.push(...bytes.slice(i,i+8192));
  }
  // Proper GIF-spec LZW with a real dictionary. Replaces the previous
  // "degenerate" encoder that emitted CLEAR every 240 codes and never built
  // a dictionary entry. Typical real-world content compresses 3–10× smaller
  // with proper LZW (flat colors, runs, and repeated patterns all get
  // dictionary codes).
  //
  // Algorithm:
  //   1. Start with the implicit base dictionary (codes 0..N-1 = single
  //      symbols, where N = 1<<minCodeSize). Reserve CLEAR = N, END = N+1.
  //      First user code is N+2. Code size starts at minCodeSize+1.
  //   2. Maintain a longest-matched prefix. For each new symbol K, if
  //      (prefix,K) is in the dict, extend; otherwise emit prefix's code,
  //      add (prefix,K) → nextCode, and start a new prefix from K.
  //   3. When the dict fills (nextCode reaches 2^codeSize), grow codeSize
  //      by 1 (up to 12 bits / 4096 entries). When the 12-bit ceiling hits,
  //      emit CLEAR and rebuild.
  function lzwEncode(indices, minCodeSize){
    const CLEAR = 1 << minCodeSize;
    const END = CLEAR + 1;
    const MAX_CODE = 4095;
    let codeSize = minCodeSize + 1;
    let nextCode = END + 1;
    const dict = new Map();
    const out = [];
    let buf = 0, bufBits = 0;
    function writeCode(code){
      buf |= code << bufBits;
      bufBits += codeSize;
      while (bufBits >= 8) {
        out.push(buf & 0xff);
        buf >>>= 8;
        bufBits -= 8;
      }
    }
    function resetDict(){
      dict.clear();
      codeSize = minCodeSize + 1;
      nextCode = END + 1;
    }
    if (!indices.length) {
      writeCode(CLEAR);
      writeCode(END);
      if (bufBits > 0) out.push(buf & 0xff);
      return out;
    }
    writeCode(CLEAR);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      // Key = (prefix << 12) | k packs up to 12+8 = 20 bits — safely inside
      // a 32-bit Number, and Map handles small ints efficiently.
      const key = (prefix << 12) | k;
      const existing = dict.get(key);
      if (existing !== undefined) {
        prefix = existing;
      } else {
        writeCode(prefix);
        if (nextCode <= MAX_CODE) {
          dict.set(key, nextCode);
          nextCode++;
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          writeCode(CLEAR);
          resetDict();
        }
        prefix = k;
      }
    }
    writeCode(prefix);
    writeCode(END);
    if (bufBits > 0) out.push(buf & 0xff);
    return out;
  }

  // ---- Median-cut quantizer.
  // Builds a histogram of unique colors (skipping transparent pixels), then
  // recursively splits the most-populous color box along its longest axis at
  // the population-weighted median. Each leaf box becomes one palette entry
  // (count-weighted RGB average).
  function medianCutPalette(rgba, maxColors){
    const hist=new Map();
    for(let i=0;i<rgba.length;i+=4){
      if(rgba[i+3]<80) continue;
      const key=(rgba[i]<<16)|(rgba[i+1]<<8)|rgba[i+2];
      hist.set(key,(hist.get(key)||0)+1);
    }
    if(!hist.size) return [[0,0,0]];
    const colors=[];
    for(const [k,c] of hist){
      colors.push({r:(k>>16)&255, g:(k>>8)&255, b:k&255, count:c});
    }
    function makeBox(arr){
      let rmin=255,gmin=255,bmin=255, rmax=0,gmax=0,bmax=0, total=0;
      for(const c of arr){
        if(c.r<rmin) rmin=c.r; if(c.g<gmin) gmin=c.g; if(c.b<bmin) bmin=c.b;
        if(c.r>rmax) rmax=c.r; if(c.g>gmax) gmax=c.g; if(c.b>bmax) bmax=c.b;
        total+=c.count;
      }
      return {colors:arr, rmin,gmin,bmin, rmax,gmax,bmax, total};
    }
    const boxes=[makeBox(colors)];
    while(boxes.length<maxColors){
      let bestIdx=-1, bestPrio=-1;
      for(let i=0;i<boxes.length;i++){
        const b=boxes[i];
        const longest=Math.max(b.rmax-b.rmin, b.gmax-b.gmin, b.bmax-b.bmin);
        if(longest===0 || b.colors.length<2) continue;
        if(b.total>bestPrio){ bestPrio=b.total; bestIdx=i; }
      }
      if(bestIdx<0) break;
      const box=boxes[bestIdx];
      const rRange=box.rmax-box.rmin, gRange=box.gmax-box.gmin, bRange=box.bmax-box.bmin;
      const axis = (gRange>=rRange && gRange>=bRange) ? 'g' : (bRange>=rRange ? 'b' : 'r');
      box.colors.sort((a,b)=>a[axis]-b[axis]);
      const half=box.total/2; let run=0, splitIdx=0;
      for(let i=0;i<box.colors.length;i++){
        run+=box.colors[i].count;
        if(run>=half){ splitIdx=i+1; break; }
      }
      if(splitIdx<=0||splitIdx>=box.colors.length) splitIdx=Math.floor(box.colors.length/2);
      boxes.splice(bestIdx, 1, makeBox(box.colors.slice(0,splitIdx)), makeBox(box.colors.slice(splitIdx)));
    }
    return boxes.map(b=>{
      let sr=0,sg=0,sb=0,sc=0;
      for(const c of b.colors){ sr+=c.r*c.count; sg+=c.g*c.count; sb+=c.b*c.count; sc+=c.count; }
      return [Math.round(sr/sc), Math.round(sg/sc), Math.round(sb/sc)];
    });
  }

  // 5-bit-per-channel nearest-palette LUT. ~32k cells × N palette entries
  // gives a one-time O(32768·N) precompute, then O(1) pixel lookups. The
  // 5-bit quantization error (≤4/255 per channel) is negligible next to the
  // palette-quantization error itself.
  function buildPaletteLUT(palette){
    const lut=new Uint8Array(32*32*32);
    for(let r=0;r<32;r++){
      const rv=(r<<3)|(r>>2);
      for(let g=0;g<32;g++){
        const gv=(g<<3)|(g>>2);
        for(let b=0;b<32;b++){
          const bv=(b<<3)|(b>>2);
          let best=0, bestD=Infinity;
          for(let p=0;p<palette.length;p++){
            const dr=palette[p][0]-rv, dg=palette[p][1]-gv, db=palette[p][2]-bv;
            const d=dr*dr+dg*dg+db*db;
            if(d<bestD){ bestD=d; best=p; }
          }
          lut[(r<<10)|(g<<5)|b]=best;
        }
      }
    }
    return lut;
  }
  function lookup(lut, r, g, b){
    return lut[((r>>3)<<10)|((g>>3)<<5)|(b>>3)];
  }
  function mapToIndices(rgba, lut, transparentIdx){
    const t = transparentIdx == null ? 255 : transparentIdx;
    const out=new Uint8Array(rgba.length/4);
    for(let i=0,j=0;i<rgba.length;i+=4,j++){
      if(rgba[i+3]<80){ out[j]=t; continue; }
      out[j]=lookup(lut, rgba[i], rgba[i+1], rgba[i+2]);
    }
    return out;
  }
  // Floyd-Steinberg. Accumulate float errors in a side buffer; for each
  // pixel pick the nearest palette entry, then push the residual to the
  // right/below-left/below/below-right neighbors with 7/3/5/1 weights.
  function ditherToIndices(rgba, w, h, palette, lut, transparentIdx){
    const t = transparentIdx == null ? 255 : transparentIdx;
    const buf=new Float32Array(w*h*3);
    for(let i=0,j=0;i<rgba.length;i+=4,j+=3){
      buf[j]=rgba[i]; buf[j+1]=rgba[i+1]; buf[j+2]=rgba[i+2];
    }
    const out=new Uint8Array(w*h);
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const idx=y*w+x, bi=idx*3, ai=idx*4;
        if(rgba[ai+3]<80){ out[idx]=t; continue; }
        const r=Math.max(0,Math.min(255,buf[bi]));
        const g=Math.max(0,Math.min(255,buf[bi+1]));
        const b=Math.max(0,Math.min(255,buf[bi+2]));
        const p=lookup(lut, r|0, g|0, b|0);
        out[idx]=p;
        const pr=palette[p][0], pg=palette[p][1], pb=palette[p][2];
        const er=r-pr, eg=g-pg, eb=b-pb;
        if(x+1<w){ const n=(idx+1)*3; buf[n]+=er*7/16; buf[n+1]+=eg*7/16; buf[n+2]+=eb*7/16; }
        if(y+1<h){
          if(x>0){ const n=((y+1)*w+x-1)*3; buf[n]+=er*3/16; buf[n+1]+=eg*3/16; buf[n+2]+=eb*3/16; }
          { const n=((y+1)*w+x)*3; buf[n]+=er*5/16; buf[n+1]+=eg*5/16; buf[n+2]+=eb*5/16; }
          if(x+1<w){ const n=((y+1)*w+x+1)*3; buf[n]+=er*1/16; buf[n+1]+=eg*1/16; buf[n+2]+=eb*1/16; }
        }
      }
    }
    return out;
  }

  function encode(canvases, opts){
    const o=opts||{};
    const delayMs=o.delayMs||450;
    const loopCount=o.loopCount|0;
    const mode=o.mode==='best'?'best':'fast';
    const dither=!!o.dither && mode==='best';
    // paletteSize only matters in best mode. Must be a power of 2 between
    // 4 and 256. Smaller = smaller file (smaller LCT bytes per frame +
    // smaller LZW minCodeSize), but worse color fidelity. Reserve index
    // (size-1) for transparent.
    let palSize = 256;
    if (mode === 'best') {
      const requested = o.paletteSize | 0;
      if ([4, 8, 16, 32, 64, 128, 256].indexOf(requested) >= 0) palSize = requested;
    }
    // GIF spec: size field N in the LCT/GCT packed byte means 2^(N+1) entries.
    // So for palSize=256 → N=7, 128 → N=6, 64 → N=5, etc.
    const sizeField = Math.max(0, Math.round(Math.log2(palSize)) - 1);
    // GIF spec: minCodeSize must be >= 2 even if palette is smaller.
    const minCode = Math.max(2, Math.round(Math.log2(palSize)));
    const transparentIdx = palSize - 1;
    const w=canvases[0].width, h=canvases[0].height;
    const out=[];
    const text=s=>{ for(let i=0;i<s.length;i++) out.push(s.charCodeAt(i)); };
    text('GIF89a');
    // Logical Screen Descriptor. Global cube palette is always 256 entries
    // so older viewers always have a defined GCT, even when per-frame LCTs
    // are smaller in best mode.
    const globalPal=cubePalette();
    out.push(w&255, w>>8, h&255, h>>8, 0xF7, 0, 255);
    for(let i=0;i<globalPal.length;i++) out.push(globalPal[i]);
    // NETSCAPE2.0 loop extension.
    out.push(0x21, 0xFF, 11); text('NETSCAPE2.0');
    out.push(3, 1, loopCount&255, loopCount>>8, 0);
    const delay=Math.max(2, Math.round(delayMs/10));
    for(const c of canvases){
      let indices, hasLCT, lctBytes=null, frameMinCode = 8;
      if(mode==='best'){
        const ctx=c.getContext('2d');
        const rgba=ctx.getImageData(0,0,c.width,c.height).data;
        // Reserve last index for transparent; quantize to palSize-1 colors.
        const tuples=medianCutPalette(rgba, palSize - 1);
        while(tuples.length<palSize) tuples.push([0,0,0]);
        const lut=buildPaletteLUT(tuples);
        indices = dither
          ? ditherToIndices(rgba, c.width, c.height, tuples, lut, transparentIdx)
          : mapToIndices(rgba, lut, transparentIdx);
        lctBytes=[];
        for(const t of tuples){ lctBytes.push(t[0], t[1], t[2]); }
        hasLCT=true;
        frameMinCode = minCode;
      } else {
        indices=cubeIndices(c);
        hasLCT=false;
        frameMinCode = 8;
      }
      // Graphic Control Extension.
      out.push(0x21, 0xF9, 4, 0x00, delay&255, delay>>8, 0, 0);
      // Image Descriptor. Packed byte: bit 7 = LCT flag, bits 2..0 = LCT size.
      const packed = hasLCT ? (0x80 | sizeField) : 0x00;
      out.push(0x2C, 0,0,0,0, w&255, w>>8, h&255, h>>8, packed);
      if(hasLCT){
        for(let i=0;i<lctBytes.length;i++) out.push(lctBytes[i]);
      }
      out.push(frameMinCode);
      appendBytes(out, packSubBlocks(lzwEncode(indices, frameMinCode)));
    }
    out.push(0x3B);
    return new Blob([new Uint8Array(out)], {type:'image/gif'});
  }

  // -------- WebM / MP4 video export via MediaRecorder. -----------------
  // Uses canvas.captureStream(0) so we can push frames at exact times
  // matching the requested delayMs. MediaRecorder support:
  //   - WebM (VP8/VP9): Chrome, Edge, Firefox; not in Safari < 14.5
  //   - MP4 (H.264):    Safari 14.5+
  // The function picks whichever mime the browser supports.
  function pickVideoMime(){
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const m of candidates) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) {}
    }
    return null;
  }
  function videoSupported(){ return pickVideoMime() !== null; }
  async function encodeVideo(canvases, opts){
    const o = opts || {};
    const delayMs = Math.max(20, o.delayMs || 450);
    const loopCount = Math.max(1, o.loopCount | 0 || 1);
    const mime = pickVideoMime();
    if (!mime) throw new Error('Video recording is not supported in this browser.');
    if (!canvases.length) throw new Error('No frames to record.');
    const w = canvases[0].width, h = canvases[0].height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // White background so the first captured frame isn't a black flash.
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    // Use a fixed-rate captureStream — captureStream(0) + requestFrame()
    // is unreliable in Firefox (the recorder ends up with zero samples).
    // 30 FPS captures everything we draw while staying portable across
    // Chrome / Edge / Firefox / Safari with no requestFrame requirement.
    const stream = c.captureStream(30);
    const track = stream.getVideoTracks()[0];
    const bps = Math.max(500_000, Math.min(8_000_000, w * h * 8));
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise(resolve => { recorder.onstop = resolve; });
    // Prime the canvas with the first frame BEFORE starting the recorder
    // so the stream's first sample isn't blank.
    ctx.drawImage(canvases[0], 0, 0);
    recorder.start();
    // Give the recorder a beat to attach to the stream and capture the
    // priming frame; without this Firefox occasionally drops it.
    await new Promise(r => setTimeout(r, 120));
    for (let loop = 0; loop < loopCount; loop++) {
      for (let i = 0; i < canvases.length; i++) {
        ctx.drawImage(canvases[i], 0, 0);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    // Hold the last frame visible for one extra delay-tick + flush the
    // encoder buffer.
    await new Promise(r => setTimeout(r, Math.max(300, delayMs)));
    recorder.stop();
    await stopped;
    track.stop();
    return new Blob(chunks, { type: mime });
  }

  window.DrawSplatGifEncoder = { encode, encodeVideo, videoSupported, pickVideoMime };
})();
