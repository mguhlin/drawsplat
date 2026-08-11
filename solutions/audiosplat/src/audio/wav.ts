export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const frameCount = buffer.length;
  const bytesPerSample = 2;
  const dataSize = frameCount * channels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);
  writeAscii(view, 0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true); view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data'); view.setUint32(40, dataSize, true);
  const channelData = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([output], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe - minutes * 60;
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
}
