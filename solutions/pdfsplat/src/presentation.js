// A separate, read-only viewer renders an edited PDF snapshot; editor state stays intact.
export function setupPresentation({ pdfjs, buildPdf, state, announce }) {
  const present = document.getElementById('presentButton'), full = document.getElementById('fullscreenButton');
  const viewer = document.createElement('section');
  viewer.id = 'presentationViewer'; viewer.className = 'topbar'; viewer.hidden = true; viewer.tabIndex = -1;
  viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-modal', 'true'); viewer.setAttribute('aria-label', 'PDF presentation');
  viewer.innerHTML = `<div class="presentation-stage"><canvas aria-label="Presented PDF page"></canvas></div><div class="topbar presentation-controls"><button type="button" data-action="previous" aria-label="Previous page">← <span>Previous page</span></button><span data-position role="status"></span><button type="button" data-action="next" aria-label="Next page"><span>Next page</span> →</button><button type="button" data-action="blank">Blank screen</button><label><span>Slide interval (seconds)</span> <input type="number" min="1" max="3600" value="10" data-interval></label><label><input type="checkbox" data-loop> <span>Loop slides</span></label><button type="button" data-action="play">Start slideshow</button><button type="button" data-action="fullscreen">Full screen</button><button type="button" data-action="exit">Exit presentation</button></div>`;
  document.body.append(viewer);
  const stage = viewer.querySelector('.presentation-stage'), canvas = viewer.querySelector('canvas'), position = viewer.querySelector('[data-position]'), play = viewer.querySelector('[data-action="play"]');
  let pdf, index = 0, timer, busy = false, previousFocus, blank = false, generation = 0;
  function pause() { clearTimeout(timer); timer = undefined; play.textContent = 'Start slideshow'; play.setAttribute('aria-pressed', 'false'); }
  function schedule() { timer = setTimeout(async () => { timer = undefined; if (index + 1 === pdf.numPages && !viewer.querySelector('[data-loop]').checked) { pause(); return; } await show((index + 1) % pdf.numPages); if (!viewer.hidden) schedule(); }, Math.max(1, Math.min(3600, Number(viewer.querySelector('[data-interval]').value) || 10)) * 1000); play.textContent = 'Pause slideshow'; play.setAttribute('aria-pressed', 'true'); }
  function unblank() { blank = false; stage.classList.remove('blank-white', 'blank-black'); }
  async function show(next) {
    if (!pdf || busy || viewer.hidden) return;
    busy = true; unblank(); index = Math.max(0, Math.min(pdf.numPages - 1, next));
    try {
      const page = await pdf.getPage(index + 1), original = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1800 / Math.max(original.width, original.height));
      const viewport = page.getViewport({ scale }); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, background: '#ffffff' }).promise;
      position.textContent = `${index + 1} / ${pdf.numPages}`;
      viewer.querySelector('[data-action="previous"]').disabled = index === 0;
      viewer.querySelector('[data-action="next"]').disabled = index === pdf.numPages - 1;
      page.cleanup();
    } catch (error) { console.error(error); announce('Presentation could not render this page.'); }
    finally { busy = false; }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (viewer.requestFullscreen) await viewer.requestFullscreen(); }
    catch { /* Browser may deny fullscreen; the distraction-free viewer still works. */ }
  }
  async function exit() {
    generation++; pause(); viewer.hidden = true;
    document.querySelector('#workspace').inert = false; document.querySelector('header.topbar').inert = false; document.querySelector('footer.statusbar').inert = false;
    if (document.fullscreenElement === viewer) await document.exitFullscreen().catch(() => {});
    const old = pdf; pdf = undefined; await old?.destroy(); canvas.width = canvas.height = 0; previousFocus?.focus(); announce('Presentation closed. Your edits are unchanged.');
  }
  async function open(useFullscreen = false) {
    if (!state.pages.length || busy || !viewer.hidden || document.querySelector('dialog[open]')) return;
    previousFocus = document.activeElement; const token = ++generation;
    present.disabled = true;
    // Request fullscreen while the click still carries browser user activation.
    viewer.hidden = false; viewer.classList.toggle('presentation-clean', !useFullscreen); viewer.focus();
    document.querySelector('#workspace').inert = true; document.querySelector('header.topbar').inert = true; document.querySelector('footer.statusbar').inert = true;
    if (useFullscreen) void fullscreen();
    announce('Preparing presentation…');
    try { const bytes = await buildPdf(); const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise; if (token !== generation) { await doc.destroy(); return; } pdf = doc; await show(state.current); announce('Presentation ready.'); }
    catch (error) { console.error(error); await exit(); announce('Presentation could not open. The source PDF is unchanged.'); }
    finally { present.disabled = !state.pages.length; }
  }
  present.onclick = () => open(); full.onclick = () => open(true);
  viewer.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'exit') void exit();
    else if (action === 'fullscreen') void fullscreen();
    else if (action === 'previous' || action === 'next') void show(index + (action === 'next' ? 1 : -1));
    else if (action === 'blank') { blank = !blank; stage.classList.toggle('blank-black', blank); stage.classList.remove('blank-white'); }
    else if (action === 'play' && pdf) { if (timer) pause(); else schedule(); }
    else if (event.target === canvas || event.target === stage) void show(index + (event.clientX < innerWidth / 3 ? -1 : 1));
  });
  window.addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (viewer.hidden) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l' && state.pages.length) { event.preventDefault(); void open(); } return; }
    if (event.key === 'Tab') { const controls = [...viewer.querySelectorAll('button:not(:disabled),input')]; const first = controls[0], last = controls.at(-1); if (event.shiftKey && (document.activeElement === first || document.activeElement === viewer)) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === viewer)) { event.preventDefault(); first.focus(); } return; }
    if (event.key === 'Escape') { event.preventDefault(); void exit(); }
    else if (['ArrowRight','ArrowDown','PageDown',' '].includes(event.key)) { event.preventDefault(); void show(index + 1); }
    else if (['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(event.key)) { event.preventDefault(); void show(index - 1); }
    else if (event.key === 'Home') { event.preventDefault(); void show(0); }
    else if (event.key === 'End') { event.preventDefault(); void show(pdf?.numPages - 1); }
    else if (['b','w'].includes(event.key.toLowerCase())) { event.preventDefault(); const white = event.key.toLowerCase() === 'w'; blank = !stage.classList.contains(white ? 'blank-white' : 'blank-black'); stage.classList.toggle('blank-white', blank && white); stage.classList.toggle('blank-black', blank && !white); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); void fullscreen(); }
    else if (event.key.toLowerCase() === 'h') { viewer.classList.toggle('presentation-clean'); }
  });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !viewer.hidden) void exit(); });
  window.addEventListener('pagehide', pause);
}
