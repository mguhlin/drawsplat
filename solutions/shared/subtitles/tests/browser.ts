import type { Page } from '@playwright/test';
// Deterministic worker double. Audio decoding, trimming, UI and SRT export remain real.
export async function fakeTranscriber(page: Page, delay = 20) {
  await page.addInitScript(({ delay }) => {
    sessionStorage.setItem('videosplat-splash-seen', '1');
    const Original = window.Worker;
    (window as any).subtitleJobs = [];
    (window as any).Worker = class {
      onmessage?: (event: { data: unknown }) => void;
      onerror?: () => void;
      timer?: number;
      constructor(url: string | URL, options?: WorkerOptions) {
        // FFmpeg's worker is separate and must remain real for burn-in tests.
        if (String(url).includes('ffmpeg')) return new Original(url, options) as any;
      }
      postMessage(data: { audio?: Float32Array; model?: string }) {
        if (!data.audio) return;
        (window as any).subtitleJobs.push({ samples: data.audio.length, model: data.model });
        this.timer = window.setTimeout(() => this.onmessage?.({ data: { type: 'complete', cues: [{ start: .2, end: 1.2, text: 'Generated speech' }, { start: 1.3, end: 2.2, text: 'Review this caption' }] } }), delay);
      }
      terminate() { clearTimeout(this.timer); (window as any).subtitleTerminated = true; }
    };
  }, { delay });
}
export function silentWav() {
  const pcm = Buffer.alloc(44 + 32000);
  pcm.write('RIFF'); pcm.writeUInt32LE(pcm.length - 8, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(16000, 24); pcm.writeUInt32LE(32000, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(32000, 40);
  return pcm;
}
