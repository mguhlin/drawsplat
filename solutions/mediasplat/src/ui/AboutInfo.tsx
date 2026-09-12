import { useRef } from 'react';

export function AboutInfo() {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button className="secondary" onClick={() => dialog.current?.showModal()}>About</button>
    <dialog className="about-dialog" ref={dialog} aria-labelledby="about-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="secondary about-close" aria-label="Close About" onClick={() => dialog.current?.close()}>×</button>
      <h2 id="about-title">About MediaSplat</h2>
      <h3>Video size, length, and processing limits</h3>
      <ul>
        <li><strong>Automatic captions:</strong> up to 120 minutes (2 hours) and 512 MB per source file. English speech and browser-decodable audio are required.</li>
        <li><strong>Longer caption jobs:</strong> split the video, download the parts, then load and caption each part separately. Each part must meet both limits.</li>
        <li><strong>Trim, split, join, and burn-in:</strong> no fixed app-level file-size, duration, resolution, or frame-rate cap. Available browser memory and storage determine practical limits; large files can still fail.</li>
        <li><strong>Automatic splitting:</strong> equal-parts, by-time, and by-size splitting support up to 100 output parts. Size targets are estimates, not guaranteed maximums; check downloaded sizes.</li>
        <li><strong>Processing time:</strong> fast, lossless operations avoid re-encoding. Precise cuts, normalized joins, and subtitle burn-in re-encode locally; speed depends on the video and device, with no fixed minutes-per-minute rule.</li>
      </ul>
      <p>Keep this tab open until processing finishes. Importing an existing SRT/VTT file for burn-in does not use the automatic-caption limits.</p>
    </dialog>
  </>;
}
