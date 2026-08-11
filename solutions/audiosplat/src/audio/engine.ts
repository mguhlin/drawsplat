import type { AudioClip, AudioProject, AudioSourceRecord } from "../types";

export class AudioEngine {
  private context: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private active: AudioBufferSourceNode[] = [];
  private startedAt = 0;
  private startedFrom = 0;
  private timer = 0;

  async ensureContext(): Promise<AudioContext> {
    this.context ??= new AudioContext();
    if (this.context.state !== "running") await this.context.resume();
    if (this.context.state !== "running")
      throw new Error("Audio output is not available");
    return this.context;
  }

  async loadSource(source: AudioSourceRecord): Promise<AudioBuffer> {
    const cached = this.buffers.get(source.id);
    if (cached) return cached;
    if (!source.blob) throw new Error(`Missing audio for ${source.id}`);
    const context = await this.ensureContext();
    const buffer = await context.decodeAudioData(
      await source.blob.arrayBuffer(),
    );
    this.buffers.set(source.id, buffer);
    return buffer;
  }

  setBuffer(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }
  getBuffer(id: string): AudioBuffer | undefined {
    return this.buffers.get(id);
  }
  removeBuffer(id: string): void {
    this.buffers.delete(id);
  }

  async play(
    project: AudioProject,
    sources: Map<string, AudioSourceRecord>,
    from: number,
    onTick: (time: number) => void,
    onEnded: () => void,
  ): Promise<boolean> {
    this.stop();
    const context = await this.ensureContext();
    const anySolo = project.tracks.some((track) => track.solo);
    const duration = Math.max(
      0,
      ...project.tracks.flatMap((track) =>
        track.clips.map((clip) => clip.start + clip.duration),
      ),
    );
    this.startedAt = context.currentTime;
    this.startedFrom = from;
    for (const track of project.tracks) {
      if (track.muted || (anySolo && !track.solo)) continue;
      const trackGain = context.createGain();
      const pan = context.createStereoPanner();
      trackGain.gain.value = track.gain;
      pan.pan.value = track.pan;
      trackGain.connect(pan).connect(context.destination);
      for (const clip of track.clips) {
        const clipEnd = clip.start + clip.duration;
        if (clipEnd <= from) continue;
        const sourceInfo = sources.get(clip.sourceId);
        if (!sourceInfo) continue;
        const buffer = await this.loadSource(sourceInfo);
        const node = context.createBufferSource();
        const clipGain = context.createGain();
        node.buffer = buffer;
        clipGain.gain.value = clip.gain;
        node.connect(clipGain).connect(trackGain);
        const timelineOffset = Math.max(0, clip.start - from);
        const skipped = Math.max(0, from - clip.start);
        const sourceOffset = clip.sourceOffset + skipped;
        const playDuration = Math.max(0, clip.duration - skipped);
        if (playDuration > 0) {
          applyPlaybackFades(
            clipGain.gain,
            clip,
            context.currentTime + timelineOffset,
            skipped,
            playDuration,
          );
          node.start(
            context.currentTime + timelineOffset,
            sourceOffset,
            playDuration,
          );
          this.active.push(node);
        }
      }
    }
    if (this.active.length === 0) return false;
    const tick = (): void => {
      if (!this.context || this.active.length === 0) return;
      const time =
        this.startedFrom + (this.context.currentTime - this.startedAt);
      onTick(Math.min(time, duration));
      if (time >= duration) {
        this.stop();
        onEnded();
        return;
      }
      this.timer = requestAnimationFrame(tick);
    };
    this.timer = requestAnimationFrame(tick);
    return true;
  }

  stop(): void {
    cancelAnimationFrame(this.timer);
    for (const node of this.active) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    this.active = [];
  }

  async render(
    project: AudioProject,
    sources: Map<string, AudioSourceRecord>,
  ): Promise<AudioBuffer> {
    const sampleRate = project.metadata.sampleRate || 48000;
    const duration = Math.max(
      0.1,
      ...project.tracks.flatMap((track) =>
        track.clips.map((clip) => clip.start + clip.duration),
      ),
    );
    const offline = new OfflineAudioContext(
      2,
      Math.ceil(duration * sampleRate),
      sampleRate,
    );
    const anySolo = project.tracks.some((track) => track.solo);
    for (const track of project.tracks) {
      if (track.muted || (anySolo && !track.solo)) continue;
      const trackGain = offline.createGain();
      const pan = offline.createStereoPanner();
      trackGain.gain.value = track.gain;
      pan.pan.value = track.pan;
      trackGain.connect(pan).connect(offline.destination);
      for (const clip of track.clips) {
        const sourceInfo = sources.get(clip.sourceId);
        if (!sourceInfo) continue;
        const original = await this.loadSource(sourceInfo);
        const node = offline.createBufferSource();
        const gain = offline.createGain();
        node.buffer = original;
        gain.gain.value = clip.gain;
        node.connect(gain).connect(trackGain);
        applyFades(gain.gain, clip, offline.currentTime);
        node.start(clip.start, clip.sourceOffset, clip.duration);
      }
    }
    return offline.startRendering();
  }
}

function applyPlaybackFades(
  param: AudioParam,
  clip: AudioClip,
  when: number,
  skipped: number,
  duration: number,
): void {
  let level = clip.gain;
  if (clip.fadeIn > 0 && skipped < clip.fadeIn) level *= skipped / clip.fadeIn;
  const fadeOutAt = clip.duration - clip.fadeOut;
  if (clip.fadeOut > 0 && skipped > fadeOutAt)
    level *= Math.max(0, (clip.duration - skipped) / clip.fadeOut);
  param.setValueAtTime(level, when);
  if (clip.fadeIn > 0 && skipped < clip.fadeIn)
    param.linearRampToValueAtTime(
      clip.gain,
      when + Math.min(duration, clip.fadeIn - skipped),
    );
  if (clip.fadeOut > 0 && skipped + duration > fadeOutAt) {
    const start = when + Math.max(0, fadeOutAt - skipped);
    param.setValueAtTime(clip.gain, start);
    param.linearRampToValueAtTime(0, when + duration);
  }
}

function applyFades(param: AudioParam, clip: AudioClip, _now: number): void {
  const level = clip.gain;
  if (clip.fadeIn > 0) {
    param.setValueAtTime(0, clip.start);
    param.linearRampToValueAtTime(
      level,
      clip.start + Math.min(clip.fadeIn, clip.duration),
    );
  }
  if (clip.fadeOut > 0) {
    const start = clip.start + Math.max(0, clip.duration - clip.fadeOut);
    param.setValueAtTime(level, start);
    param.linearRampToValueAtTime(0, clip.start + clip.duration);
  }
}
