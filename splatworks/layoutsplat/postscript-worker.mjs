import createGhostscript from './vendor/ghostscript/gs.mjs';
self.onmessage = async ({ data }) => {
  try {
    if (!(data.bytes instanceof ArrayBuffer) || !data.bytes.byteLength || data.bytes.byteLength > 32000000) throw Error('PostScript input is limited to 32 MB.');
    let bytes = new Uint8Array(data.bytes);
    if (bytes.length >= 30 && new DataView(bytes.buffer).getUint32(0, true) === 0xc6d3d0c5) {
      const view = new DataView(bytes.buffer), start = view.getUint32(4, true), length = view.getUint32(8, true);
      if (start < 30 || start + length > bytes.length) throw Error('Invalid binary EPS header.'); bytes = bytes.slice(start, start + length);
    }
    if (!new TextDecoder().decode(bytes.slice(0, 100)).startsWith('%!PS')) throw Error('Not a PostScript document.');
    const logs = [], module = await createGhostscript({ noInitialRun: true, print: s => logs.push(String(s).slice(0, 200)), printErr: s => logs.push(String(s).slice(0, 200)), locateFile: name => new URL(`./vendor/ghostscript/${name}`, import.meta.url).href });
    module.FS.writeFile('/input.ps', bytes);
    const pdf = data.kind === 'pdf', output = pdf ? '/output.pdf' : '/output.png';
    const args = ['-dSAFER', '-dBATCH', '-dNOPAUSE', '-dEPSCrop', '-dFirstPage=1', '-dLastPage=1', `-sDEVICE=${pdf ? 'pdfwrite' : 'pngalpha'}`, ...(!pdf ? [`-r${Math.max(36, Math.min(300, data.ppi || 300))}`, '-dGraphicsAlphaBits=4', '-dTextAlphaBits=4'] : []), `-sOutputFile=${output}`, '/input.ps'];
    let code;
    try { code = module.callMain(args); } catch (error) { if (typeof error.status !== 'number') throw error; code = error.status; }
    if (code !== 0) throw Error(`PostScript conversion failed (${code}). ${logs.slice(-2).join(' ')}`);
    const converted = module.FS.readFile(output); if (!converted.length || converted.length > 96000000) throw Error('Converted artwork is too large.');
    self.postMessage({ bytes: converted.buffer, mime: pdf ? 'application/pdf' : 'image/png' }, [converted.buffer]);
  } catch (error) { self.postMessage({ error: error.message || String(error) }); }
};
