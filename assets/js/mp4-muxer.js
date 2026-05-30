// Minimal hand-rolled MP4 (ISO BMFF) muxer for AVC H.264 video-only output.
// Designed to pair with WebCodecs VideoEncoder. NOT a general-purpose MP4
// library — only writes the box tree needed for fragmented-free, single-
// track, video-only playback in Chrome / Safari / VLC / QuickTime.
//
// Usage:
//   const mux = new DrawSplatMp4.Muxer({width, height, timescale: 1000});
//   mux.addAvcDecoderConfig(avcCBytes);            // from EncodedVideoChunk metadata
//   mux.addSample({data, durationTicks, isKey});  // per encoded frame
//   const blob = mux.finalize();
//
// All multi-byte integers are big-endian (MP4 spec). The muxer buffers
// every encoded sample in memory; for the kind of GIF-replacement clips
// this widget produces (≤10s @ ≤2 Mbps ≈ ≤2.5 MB) that's fine.
//
// Box reference: ISO/IEC 14496-12 (file format) + 14496-15 (AVC in MP4).
(function(){
  // -------- Bytes / box writer ----------------------------------------
  function ascii(s) { const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
  function u8(n)  { return new Uint8Array([n & 0xff]); }
  function u16(n) { return new Uint8Array([(n >>> 8) & 0xff, n & 0xff]); }
  function u24(n) { return new Uint8Array([(n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]); }
  function u32(n) { return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]); }
  // 64-bit only used inside mdhd if elapsed > 2^32 ticks; we stick to 32-bit.
  function concat(parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }
  // box(type, ...children) → [size(4) + type(4) + concat(children)]
  function box(type, ...children) {
    const body = concat(children);
    const size = 8 + body.length;
    return concat([u32(size), ascii(type), body]);
  }
  // Full box: 1-byte version + 3-byte flags + body
  function fullBox(type, version, flags, ...children) {
    return box(type, u8(version), u24(flags), ...children);
  }

  // -------- Box builders ----------------------------------------------
  // ftyp — file type
  function ftyp() {
    return box('ftyp',
      ascii('isom'), u32(512),
      ascii('isom'), ascii('iso2'), ascii('avc1'), ascii('mp41')
    );
  }
  // mvhd — movie header. Tracks timescale + duration.
  function mvhd(timescale, durationTicks) {
    return fullBox('mvhd', 0, 0,
      u32(0), u32(0),               // creation/modification time
      u32(timescale),
      u32(durationTicks),
      u32(0x00010000),              // rate 1.0
      u16(0x0100),                  // volume 1.0
      u16(0),                       // reserved
      u32(0), u32(0),               // reserved
      // 9*4 = 36-byte transformation matrix (identity)
      u32(0x00010000), u32(0), u32(0),
      u32(0), u32(0x00010000), u32(0),
      u32(0), u32(0), u32(0x40000000),
      // 6*4 = 24 bytes pre_defined
      u32(0), u32(0), u32(0), u32(0), u32(0), u32(0),
      u32(2)                        // next_track_ID
    );
  }
  // tkhd — track header.
  function tkhd(trackId, durationTicks, width, height) {
    return fullBox('tkhd', 0, 0x000007, // flags: track_enabled + in_movie + in_preview
      u32(0), u32(0),               // creation/modification
      u32(trackId),
      u32(0),                       // reserved
      u32(durationTicks),
      u32(0), u32(0),               // reserved
      u16(0),                       // layer
      u16(0),                       // alternate_group
      u16(0),                       // volume (0 for video)
      u16(0),                       // reserved
      u32(0x00010000), u32(0), u32(0),
      u32(0), u32(0x00010000), u32(0),
      u32(0), u32(0), u32(0x40000000),
      u32(width  << 16),            // width  (16.16 fixed)
      u32(height << 16)             // height (16.16 fixed)
    );
  }
  // mdhd — media header.
  function mdhd(timescale, durationTicks) {
    return fullBox('mdhd', 0, 0,
      u32(0), u32(0),               // creation/modification
      u32(timescale),
      u32(durationTicks),
      u16((21 << 10) | (14 << 5) | 4), // language 'und' packed (5 bits each)
      u16(0)                        // pre_defined
    );
  }
  // hdlr — handler reference.
  function hdlr() {
    return fullBox('hdlr', 0, 0,
      u32(0),                       // pre_defined
      ascii('vide'),                // handler_type
      u32(0), u32(0), u32(0),       // reserved
      ascii('VideoHandler\0')
    );
  }
  // vmhd — video media header.
  function vmhd() {
    return fullBox('vmhd', 0, 1,    // flags=1
      u16(0),                       // graphicsmode
      u16(0), u16(0), u16(0)        // opcolor
    );
  }
  // dinf > dref > url — data reference to "self" (data is in same file).
  function dinf() {
    const url = fullBox('url ', 0, 1); // flags=1: data is in same file
    const dref = fullBox('dref', 0, 0, u32(1), url);
    return box('dinf', dref);
  }
  // avc1 sample entry with avcC config inside.
  function avc1Entry(width, height, avcC) {
    return box('avc1',
      // SampleEntry: 6 reserved bytes + 2-byte data_reference_index
      u8(0), u8(0), u8(0), u8(0), u8(0), u8(0),
      u16(1),
      // VisualSampleEntry:
      u16(0), u16(0),               // pre_defined, reserved
      u32(0), u32(0), u32(0),       // pre_defined[3]
      u16(width),
      u16(height),
      u32(0x00480000),              // horizresolution 72 dpi
      u32(0x00480000),              // vertresolution
      u32(0),                       // reserved
      u16(1),                       // frame_count
      // compressorname: 32 bytes — first byte is length, rest is name (padded)
      u8(11), ascii('DrawSplat\0\0'), u8(0),
      // pad to 32 total: we wrote 1 + 11 + 1 = 13, need 19 more
      ...Array.from({length: 19}, () => u8(0)),
      u16(0x0018),                  // depth 0x0018 (color)
      u16(0xFFFF),                  // pre_defined
      // 'avcC' configuration box
      box('avcC', avcC)
    );
  }
  // stsd — sample description.
  function stsd(width, height, avcC) {
    return fullBox('stsd', 0, 0, u32(1), avc1Entry(width, height, avcC));
  }
  // stts — decoding time-to-sample. We use one entry per sample so each
  // sample can have its own duration (matches GIF's per-frame delay).
  function stts(durations) {
    const entries = [];
    let i = 0;
    while (i < durations.length) {
      let count = 1;
      while (i + count < durations.length && durations[i + count] === durations[i]) count++;
      entries.push(u32(count), u32(durations[i]));
      i += count;
    }
    return fullBox('stts', 0, 0, u32(entries.length / 2), concat(entries));
  }
  // stss — sync sample (keyframe) indices.
  function stss(keyIndices) {
    if (!keyIndices.length) return new Uint8Array(0);
    const entries = keyIndices.map(i => u32(i + 1)); // 1-based
    return fullBox('stss', 0, 0, u32(keyIndices.length), concat(entries));
  }
  // stsc — sample-to-chunk. Single entry: all samples in one chunk.
  function stsc(sampleCount) {
    return fullBox('stsc', 0, 0,
      u32(1),                       // entry count
      u32(1),                       // first_chunk
      u32(sampleCount),             // samples_per_chunk
      u32(1)                        // sample_description_index
    );
  }
  // stsz — sample sizes.
  function stsz(sampleSizes) {
    const entries = sampleSizes.map(s => u32(s));
    return fullBox('stsz', 0, 0,
      u32(0),                       // sample_size (0 = per-sample)
      u32(sampleSizes.length),
      concat(entries)
    );
  }
  // stco — chunk offsets. Single chunk → single offset.
  function stco(mdatHeaderOffset) {
    // mdat header is 8 bytes (size + 'mdat'); samples start right after.
    return fullBox('stco', 0, 0, u32(1), u32(mdatHeaderOffset + 8));
  }
  function stbl(width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset) {
    return box('stbl',
      stsd(width, height, avcC),
      stts(sampleDurations),
      stss(keyIndices),
      stsc(sampleSizes.length),
      stsz(sampleSizes),
      stco(mdatOffset)
    );
  }
  function minf(width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset) {
    return box('minf', vmhd(), dinf(), stbl(width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset));
  }
  function mdia(timescale, durationTicks, width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset) {
    return box('mdia',
      mdhd(timescale, durationTicks),
      hdlr(),
      minf(width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset)
    );
  }
  function trak(trackId, durationTicks, timescale, width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset) {
    return box('trak',
      tkhd(trackId, durationTicks, width, height),
      mdia(timescale, durationTicks, width, height, avcC, sampleSizes, sampleDurations, keyIndices, mdatOffset)
    );
  }

  // -------- Muxer class -----------------------------------------------
  class Muxer {
    constructor(opts) {
      this.width = opts.width;
      this.height = opts.height;
      this.timescale = opts.timescale || 1000;
      this.samples = [];        // { data: Uint8Array, durationTicks, isKey }
      this.avcCBytes = null;    // AVCDecoderConfigurationRecord bytes
    }
    addAvcDecoderConfig(bytes) {
      this.avcCBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    }
    addSample(s) {
      const data = s.data instanceof Uint8Array ? s.data : new Uint8Array(s.data);
      this.samples.push({ data, durationTicks: s.durationTicks | 0, isKey: !!s.isKey });
    }
    finalize() {
      if (!this.avcCBytes) throw new Error('mp4-muxer: addAvcDecoderConfig() must be called before finalize()');
      if (!this.samples.length) throw new Error('mp4-muxer: no samples to write');
      const sampleSizes = this.samples.map(s => s.data.length);
      const sampleDurations = this.samples.map(s => s.durationTicks);
      const keyIndices = [];
      this.samples.forEach((s, i) => { if (s.isKey) keyIndices.push(i); });
      const totalDuration = sampleDurations.reduce((a, b) => a + b, 0);

      // We need mdatOffset to write stco. Build moov twice with a placeholder
      // first to measure ftyp+moov size, then again with the real offset.
      // First pass: assume mdat starts at offset 0 (we'll patch).
      const ftypBytes = ftyp();
      let moovBytes = box('moov',
        mvhd(this.timescale, totalDuration),
        trak(1, totalDuration, this.timescale, this.width, this.height, this.avcCBytes, sampleSizes, sampleDurations, keyIndices, 0)
      );
      const mdatOffset = ftypBytes.length + moovBytes.length;
      // Second pass with the real offset baked into stco.
      moovBytes = box('moov',
        mvhd(this.timescale, totalDuration),
        trak(1, totalDuration, this.timescale, this.width, this.height, this.avcCBytes, sampleSizes, sampleDurations, keyIndices, mdatOffset)
      );

      // mdat: size(4) + 'mdat'(4) + concatenated sample data
      const mdatPayload = concat(this.samples.map(s => s.data));
      const mdatBytes = concat([u32(8 + mdatPayload.length), ascii('mdat'), mdatPayload]);

      return new Blob([ftypBytes, moovBytes, mdatBytes], { type: 'video/mp4' });
    }
  }

  window.DrawSplatMp4 = { Muxer };
})();
