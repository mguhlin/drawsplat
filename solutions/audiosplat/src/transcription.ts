import { transcribe } from '@splat/local-subtitles/client';
import { cuesToSrt, validateCues, type Cue } from '@splat/local-subtitles/core';

/** A separate file workflow: never writes to the editor's project or audio sources. */
export function mountTranscription(host: HTMLElement, download: (blob: Blob, name: string) => void, close: () => void): () => void {
  host.innerHTML = `<div class="effect-form transcription-form">
    <p>Choose an MP3, OGG, M4A, WAV, or other browser-playable audio file. Transcribe English speech locally, review the captions, and download SRT or plain text. This does not change your project.</p>
    <p>First use downloads a speech model from Hugging Face (about 42 MB), cached when storage allows. Your audio and transcript are never uploaded. Up to 30 minutes and 512 MB per file; processing can take several minutes.</p>
    <label>Audio file for transcription<input type="file" accept="audio/*,.mp3,.ogg,.oga,.m4a,.wav,.flac,.aac" /></label>
    <audio controls hidden aria-label="Transcription audio preview"></audio>
    <div class="dialog-actions"><button class="btn primary" type="button" id="transcription-start" disabled>Generate transcript</button><button class="btn" type="button" id="transcription-cancel" hidden>Cancel generation</button></div>
    <p role="status" aria-live="polite"></p><progress aria-label="Transcription progress" hidden></progress><p role="alert" hidden></p>
    <fieldset class="transcription-cues" hidden><legend>Review words and timing</legend><div class="transcription-cue-list"></div></fieldset>
    <div class="dialog-actions" id="transcription-downloads" hidden><button class="btn" type="button" id="transcription-srt">Download SRT</button><button class="btn" type="button" id="transcription-txt">Download transcript (.txt)</button></div>
  </div>`;
  const input = host.querySelector<HTMLInputElement>('input')!;
  const preview = host.querySelector<HTMLAudioElement>('audio')!;
  const start = host.querySelector<HTMLButtonElement>('#transcription-start')!;
  const cancel = host.querySelector<HTMLButtonElement>('#transcription-cancel')!;
  const status = host.querySelector<HTMLElement>('[role="status"]')!;
  const error = host.querySelector<HTMLElement>('[role="alert"]')!;
  const progress = host.querySelector<HTMLProgressElement>('progress')!;
  const editor = host.querySelector<HTMLFieldSetElement>('fieldset')!;
  const list = host.querySelector<HTMLElement>('.transcription-cue-list')!;
  const downloads = host.querySelector<HTMLElement>('#transcription-downloads')!;
  let file: File | undefined;
  let cues: Cue[] = [];
  let controller: AbortController | undefined;
  let url: string | undefined;
  const showError = (message: string) => { error.textContent = message; error.hidden = !message; };
  const setBusy = (busy: boolean) => {
    start.disabled = busy || !file; cancel.hidden = !busy; progress.hidden = !busy;
    editor.disabled = busy;
    downloads.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = busy; });
  };
  const abort = () => { controller?.abort(); controller = undefined; setBusy(false); };
  const releasePreview = () => { preview.pause(); preview.removeAttribute('src'); if (url) URL.revokeObjectURL(url); url = undefined; };
  const renderCues = () => {
    list.replaceChildren(); editor.hidden = downloads.hidden = cues.length === 0;
    cues.forEach((cue, index) => {
      const row = document.createElement('div'); row.className = 'transcription-cue';
      for (const field of ['start', 'end', 'text'] as const) {
        const label = document.createElement('label'); label.textContent = `Caption ${index + 1} ${field}`;
        const control = document.createElement(field === 'text' ? 'textarea' : 'input');
        if (control instanceof HTMLInputElement) { control.type = 'number'; control.min = '0'; control.step = '0.01'; }
        control.value = String(cue[field]);
        control.addEventListener('input', () => {
          if (field === 'text') cue.text = control.value;
          else cue[field] = (control as HTMLInputElement).valueAsNumber;
        });
        label.append(control); row.append(label);
      }
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn'; remove.textContent = `Delete caption ${index + 1}`;
      remove.addEventListener('click', () => { cues.splice(index, 1); renderCues(); }); row.append(remove); list.append(row);
    });
  };
  input.addEventListener('change', () => {
    abort(); releasePreview(); file = input.files?.[0]; cues = []; renderCues(); showError(''); status.textContent = '';
    preview.hidden = !file;
    if (file) { url = URL.createObjectURL(file); preview.src = url; }
    setBusy(false);
  });
  start.addEventListener('click', async () => {
    if (!file || controller) return;
    const source = file;
    const job = new AbortController(); controller = job; setBusy(true); showError('');
    try {
      const result = await transcribe({ name: source.name, load: async () => source }, job.signal, message => { if (!job.signal.aborted) status.textContent = message; });
      if (!job.signal.aborted) { cues = result; renderCues(); status.textContent = `${cues.length} captions ready. Review the words and timing before downloading.`; }
    } catch (caught) {
      if (!job.signal.aborted) { status.textContent = ''; showError(caught instanceof Error ? caught.message : 'Transcription failed.'); }
    } finally { if (controller === job) { controller = undefined; setBusy(false); } }
  });
  cancel.addEventListener('click', () => { abort(); status.textContent = 'Transcription cancelled.'; });
  for (const extension of ['srt', 'txt']) {
    host.querySelector(`#transcription-${extension}`)!.addEventListener('click', () => {
      if (!file || controller) return;
      try {
        validateCues(cues); showError('');
        const body = extension === 'srt' ? cuesToSrt(cues) : cues.map(cue => cue.text.trim()).join('\n\n') + '\n';
        download(new Blob([body], { type: extension === 'srt' ? 'application/x-subrip' : 'text/plain;charset=utf-8' }), `${file.name.replace(/\.[^.]+$/, '') || 'transcript'}.${extension}`);
      } catch (caught) { showError(caught instanceof Error ? caught.message : 'Could not download transcript.'); }
    });
  }
  const dialog = host.closest<HTMLElement>('[role="dialog"]')!;
  const onKey = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),audio[controls]')].filter(node => node.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  // Keep editor shortcuts and file drops from changing the project behind this dialog.
  const stopDrop = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
  dialog.addEventListener('keydown', onKey);
  dialog.addEventListener('dragover', stopDrop); dialog.addEventListener('drop', stopDrop);
  const previous = document.activeElement as HTMLElement | null; input.focus();
  return () => { abort(); releasePreview(); dialog.removeEventListener('keydown', onKey); dialog.removeEventListener('dragover', stopDrop); dialog.removeEventListener('drop', stopDrop); previous?.focus(); };
}
