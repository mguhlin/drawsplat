import { Mp3Encoder } from "@breezystack/lamejs";

export function encodeMp3(buffer: AudioBuffer, kbps = 192): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const encoder = new Mp3Encoder(channels, buffer.sampleRate, kbps);
  const pcm = Array.from({ length: channels }, (_, channel) =>
    toPcm16(buffer.getChannelData(channel)),
  );
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < buffer.length; offset += 1152) {
    const left = pcm[0].subarray(offset, offset + 1152);
    const encoded =
      channels === 2
        ? encoder.encodeBuffer(left, pcm[1].subarray(offset, offset + 1152))
        : encoder.encodeBuffer(left);
    if (encoded.length) chunks.push(encoded);
  }
  const final = encoder.flush();
  if (final.length) chunks.push(final);
  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

function toPcm16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]));
    output[index] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  return output;
}
