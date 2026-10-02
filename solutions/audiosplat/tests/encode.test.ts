import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeWithMediaRecorder } from '../src/audio/encode';
let context: any, recorder: any, source: any;
function setup() {
  vi.stubGlobal('AudioContext', class extends EventTarget {
    state = 'running'; currentTime = 0;
    close = vi.fn(async () => { this.state = 'closed'; this.dispatchEvent(new Event('statechange')); });
    resume = vi.fn(async () => {});
    constructor() { super(); context = this; }
    createBufferSource() { return source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), onended: null }; }
    createMediaStreamDestination() { return { stream: { getTracks: () => [{ stop: vi.fn() }] } }; }
  });
  vi.stubGlobal('MediaRecorder', class {
    state = 'inactive'; ondataavailable: any; onstop: any; onerror: any;
    constructor() { recorder = this; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['audio']) }); this.onstop?.(); }
  });
}
afterEach(() => vi.unstubAllGlobals());
describe('audio export interruption', () => {
  it('finishes using the audio clock even without animation callbacks', async () => {
    setup();
    const pending = encodeWithMediaRecorder({ sampleRate: 48000, duration: 10 } as AudioBuffer, 'audio/webm');
    await Promise.resolve();
    context.currentTime = 10; source.onended();
    expect((await pending).size).toBeGreaterThan(0);
    expect(context.close).toHaveBeenCalled();
  });
  it('rejects early recorder termination', async () => {
    setup(); const pending = encodeWithMediaRecorder({ sampleRate: 48000, duration: 10 } as AudioBuffer, 'audio/webm');
    await Promise.resolve(); recorder.stop();
    await expect(pending).rejects.toThrow('stopped early');
  });
  it('rejects a delayed stop that would append an audio tail', async () => {
    setup(); const pending = encodeWithMediaRecorder({ sampleRate: 48000, duration: 10 } as AudioBuffer, 'audio/webm');
    await Promise.resolve(); context.currentTime = 15; source.onended();
    await expect(pending).rejects.toThrow('stopped early');
  });
  it('rejects browser suspension and cleans up', async () => {
    setup(); const pending = encodeWithMediaRecorder({ sampleRate: 48000, duration: 10 } as AudioBuffer, 'audio/webm');
    await Promise.resolve(); context.state = 'suspended'; context.dispatchEvent(new Event('statechange'));
    await expect(pending).rejects.toThrow('interrupted');
    expect(recorder.state).toBe('inactive');
  });
});
