// The shared encoder only needs canvas dimensions and pixel reads for GIF output.
// Run quantization/LZW off the editor thread and transfer pixels without copying.
self.window = self;
importScripts('../../assets/js/gif-encoder.js');
self.onmessage = ({ data: { frames, delayMs } }) => {
  try {
    const canvases = frames.map(frame => ({ width: frame.width, height: frame.height, getContext: () => ({ getImageData: () => frame }) }));
    self.postMessage({ blob: DrawSplatGifEncoder.encode(canvases, { delayMs, loopCount: 0, mode: 'best', dither: true }) });
  } catch (error) { self.postMessage({ error: error.message || 'GIF encoding failed.' }); }
};
