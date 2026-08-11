export type EffectKind =
  | "amplify"
  | "adjustable-fade"
  | "echo"
  | "noise-reduction"
  | "reverb"
  | "silence"
  | "truncate-silence"
  | "noise-gate"
  | "bass-treble";

export interface EffectSettings {
  start: number;
  end: number;
  amount: number;
  secondary: number;
}

export async function processEffect(
  input: AudioBuffer,
  kind: EffectKind,
  settings: EffectSettings,
): Promise<AudioBuffer> {
  const rate = input.sampleRate;
  const start = Math.max(
    0,
    Math.min(input.length, Math.floor(settings.start * rate)),
  );
  const end = Math.max(
    start,
    Math.min(input.length, Math.ceil(settings.end * rate)),
  );
  if (kind === "truncate-silence")
    return truncateSilence(
      input,
      start,
      end,
      settings.amount,
      settings.secondary,
    );

  const output = new AudioBuffer({
    length: input.length,
    numberOfChannels: input.numberOfChannels,
    sampleRate: rate,
  });
  for (let channel = 0; channel < input.numberOfChannels; channel += 1)
    output.copyToChannel(input.getChannelData(channel), channel);

  if (kind === "bass-treble")
    return filterTone(output, start, end, settings.amount, settings.secondary);

  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    const data = output.getChannelData(channel);
    const original = input.getChannelData(channel);
    for (let index = start; index < end; index += 1) {
      const position = (index - start) / Math.max(1, end - start - 1);
      if (kind === "amplify")
        data[index] = clamp(original[index] * dbGain(settings.amount));
      else if (kind === "adjustable-fade") {
        const from = dbGain(settings.amount);
        const to = dbGain(settings.secondary);
        data[index] = clamp(original[index] * (from + (to - from) * position));
      } else if (kind === "silence") data[index] = 0;
      else if (kind === "noise-gate" || kind === "noise-reduction") {
        const threshold = dbGain(settings.amount);
        const ratio =
          kind === "noise-reduction"
            ? dbGain(-Math.abs(settings.secondary))
            : 0;
        if (Math.abs(original[index]) < threshold)
          data[index] = original[index] * ratio;
      } else if (kind === "echo") {
        const delay = Math.max(1, Math.floor(settings.amount * rate));
        const delayed = index - delay >= start ? data[index - delay] : 0;
        data[index] = clamp(original[index] + delayed * settings.secondary);
      } else if (kind === "reverb") {
        const wet = settings.amount;
        const decay = settings.secondary;
        let reflected = 0;
        for (const seconds of [0.029, 0.043, 0.067, 0.101]) {
          const delayedIndex = index - Math.floor(seconds * rate);
          if (delayedIndex >= start)
            reflected += original[delayedIndex] * Math.pow(decay, seconds * 12);
        }
        data[index] = clamp(
          original[index] * (1 - wet) + (reflected / 4) * wet,
        );
      }
    }
  }
  return output;
}

function truncateSilence(
  input: AudioBuffer,
  start: number,
  end: number,
  thresholdDb: number,
  minimumSeconds: number,
): AudioBuffer {
  const threshold = dbGain(thresholdDb);
  const minimum = Math.max(1, Math.floor(minimumSeconds * input.sampleRate));
  const keep = new Uint8Array(input.length).fill(1);
  let runStart = -1;
  for (let index = start; index <= end; index += 1) {
    let peak = 0;
    if (index < end)
      for (let channel = 0; channel < input.numberOfChannels; channel += 1)
        peak = Math.max(peak, Math.abs(input.getChannelData(channel)[index]));
    if (index < end && peak < threshold) {
      if (runStart < 0) runStart = index;
    } else if (runStart >= 0) {
      if (index - runStart >= minimum)
        keep.fill(0, runStart + Math.floor(minimum / 3), index);
      runStart = -1;
    }
  }
  const length = Math.max(
    1,
    keep.reduce((sum, value) => sum + value, 0),
  );
  const output = new AudioBuffer({
    length,
    numberOfChannels: input.numberOfChannels,
    sampleRate: input.sampleRate,
  });
  for (let channel = 0; channel < input.numberOfChannels; channel += 1) {
    const source = input.getChannelData(channel);
    const target = output.getChannelData(channel);
    let cursor = 0;
    for (let index = 0; index < input.length; index += 1)
      if (keep[index]) target[cursor++] = source[index];
  }
  return output;
}

async function filterTone(
  input: AudioBuffer,
  start: number,
  end: number,
  bassDb: number,
  trebleDb: number,
): Promise<AudioBuffer> {
  const context = new OfflineAudioContext(
    input.numberOfChannels,
    input.length,
    input.sampleRate,
  );
  const source = context.createBufferSource();
  source.buffer = input;
  const bass = context.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 250;
  bass.gain.value = bassDb;
  const treble = context.createBiquadFilter();
  treble.type = "highshelf";
  treble.frequency.value = 4000;
  treble.gain.value = trebleDb;
  source.connect(bass).connect(treble).connect(context.destination);
  source.start();
  const filtered = await context.startRendering();
  const output = new AudioBuffer({
    length: input.length,
    numberOfChannels: input.numberOfChannels,
    sampleRate: input.sampleRate,
  });
  for (let channel = 0; channel < input.numberOfChannels; channel += 1) {
    const result = output.getChannelData(channel);
    result.set(input.getChannelData(channel));
    result.set(filtered.getChannelData(channel).subarray(start, end), start);
  }
  return output;
}

const dbGain = (db: number): number => Math.pow(10, db / 20);
const clamp = (sample: number): number => Math.max(-1, Math.min(1, sample));
