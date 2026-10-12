// Capture displayed image regions from the edited PDF, not original image bytes.
// This retains visual masks, cropping, color conversion, and overlapping edits.
const identity = () => [1, 0, 0, 1, 0, 0];
const multiply = (a, b) => [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
const points = m => [[m[4],m[5]], [m[0]+m[4],m[1]+m[5]], [m[2]+m[4],m[3]+m[5]], [m[0]+m[2]+m[4],m[1]+m[3]+m[5]]];
export function imagePlacements(list, ops) {
  let matrix = identity();
  const stack = [], placements = [];
  const add = transform => placements.push(multiply(matrix, transform || identity()));
  for (let i = 0; i < list.fnArray.length; i++) {
    const op = list.fnArray[i], args = list.argsArray[i] || [];
    if (op === ops.save || op === ops.paintFormXObjectBegin) {
      stack.push(matrix.slice());
      if (op === ops.paintFormXObjectBegin && args[0]?.length === 6) matrix = multiply(matrix, args[0]);
    } else if (op === ops.restore || op === ops.paintFormXObjectEnd) matrix = stack.pop() || identity();
    else if (op === ops.transform) matrix = multiply(matrix, args);
    else if ([ops.paintImageXObject, ops.paintInlineImageXObject, ops.paintImageMaskXObject, ops.paintSolidColorImageMask].includes(op)) add();
    else if (op === ops.paintImageXObjectRepeat) {
      for (let n = 0; n < args[3].length; n += 2) add([args[1],0,0,args[2],args[3][n],args[3][n+1]]);
    } else if (op === ops.paintImageMaskXObjectRepeat) {
      for (let n = 0; n < args[5].length; n += 2) add([args[1],args[2],args[3],args[4],args[5][n],args[5][n+1]]);
    } else if (op === ops.paintImageMaskXObjectGroup || op === ops.paintInlineImageXObjectGroup) {
      for (const entry of (op === ops.paintImageMaskXObjectGroup ? args[0] : args[1])) add(entry.transform);
    }
  }
  return placements;
}

export async function collectEpubImages({ pdfjs, pdfBytes, textDocument, onProgress = () => {} }) {
  const pdf = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
  try {
    for (let number = 1; number <= pdf.numPages; number++) {
      onProgress(number, pdf.numPages);
      const page = await pdf.getPage(number), list = await page.getOperatorList();
      const placements = imagePlacements(list, pdfjs.OPS);
      const outputPage = textDocument.pages[number - 1];
      outputPage.images = [];
      if (!placements.length) { page.cleanup(); continue; }
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 2200 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      try {
        await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, background: '#ffffff' }).promise;
        const seen = new Set();
        for (const matrix of placements) {
          const corners = points(matrix), pixels = corners.map(p => viewport.convertToViewportPoint(...p));
          const x = Math.max(0, Math.floor(Math.min(...pixels.map(p => p[0]))));
          const y = Math.max(0, Math.floor(Math.min(...pixels.map(p => p[1]))));
          const right = Math.min(canvas.width, Math.ceil(Math.max(...pixels.map(p => p[0]))));
          const bottom = Math.min(canvas.height, Math.ceil(Math.max(...pixels.map(p => p[1]))));
          if (right <= x || bottom <= y) continue;
          const key = [x,y,right,bottom].join(',');
          if (seen.has(key)) continue;
          seen.add(key);
          const image = document.createElement('canvas'); image.width = right-x; image.height = bottom-y;
          try {
            image.getContext('2d').drawImage(canvas,x,y,image.width,image.height,0,0,image.width,image.height);
            const blob = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
            if (!blob) throw Error(`Image export failed on page ${number}.`);
            const top = (page.view[3]-Math.max(...corners.map(p=>p[1])))/(page.view[3]-page.view[1]);
            outputPage.images.push({ bytes: new Uint8Array(await blob.arrayBuffer()), width: image.width, height: image.height, top: Math.max(0,Math.min(1,top)), alt: `Figure ${outputPage.images.length+1} from PDF page ${number}` });
          } finally { image.width = image.height = 0; }
        }
      } finally { canvas.width = canvas.height = 0; page.cleanup(); }
    }
    return textDocument;
  } finally { await pdf.destroy(); }
}
