export function setupWebsitePdf({ addPdf }) {
  const $ = id => document.getElementById(id);
  const dialog = $('websiteDialog'), video = $('websiteVideo'), pages = [];
  let stream, request = 0, busy = false;
  const message = text => { $('websiteStatus').textContent = text; };
  function update() {
    $('websiteShare').disabled = busy || !!stream || !navigator.mediaDevices?.getDisplayMedia;
    $('websiteStop').disabled = !stream;
    $('websiteCapture').disabled = busy || !stream || pages.length >= 20;
    $('websiteDownload').disabled = $('websiteAdd').disabled = busy || !pages.length;
    $('websiteClose').disabled = busy;
  }
  function stop() {
    request++;
    const old = stream;
    stream = undefined;
    old?.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    video.hidden = true;
    update();
  }
  function render() {
    $('websitePages').replaceChildren(...pages.map((page, index) => {
      const item = document.createElement('li');
      const img = document.createElement('img');
      img.src = page.url;
      img.alt = `Captured page ${index + 1}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = `Remove page ${index + 1}`;
      remove.disabled = busy;
      remove.onclick = () => { URL.revokeObjectURL(pages.splice(index, 1)[0].url); render(); };
      item.append(img, remove);
      return item;
    }));
    update();
  }
  for (const id of ['websiteButton', 'websiteStartButton']) $(id).onclick = () => {
    dialog.showModal();
    update();
    message(navigator.mediaDevices?.getDisplayMedia ? '' : 'Tab or window capture is unavailable in this browser. Open PDFSplat in a desktop browser that supports screen sharing.');
  };
  $('websiteClose').onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    stop();
    pages.splice(0).forEach(page => URL.revokeObjectURL(page.url));
    render();
  });
  window.addEventListener('pagehide', stop);
  $('websiteStop').onclick = () => { stop(); message('Sharing stopped. Your captured pages are still available.'); };
  $('websiteShare').onclick = async () => {
    const ticket = ++request;
    $('websiteShare').disabled = true;
    try {
      const selected = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (ticket !== request || !dialog.open) { selected.getTracks().forEach(track => track.stop()); return; }
      stream = selected;
      stream.getVideoTracks()[0].addEventListener('ended', () => { stop(); message('Sharing ended. Captured pages are still available.'); }, { once: true });
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      if (ticket !== request) return;
      message('Sharing is ready. Check the preview, then capture the visible page.');
    } catch (error) {
      if (ticket !== request) return;
      stop();
      message(error.name === 'NotAllowedError' ? 'Sharing was canceled or denied. Choose tab or window to try again.' : 'Could not share this screen. Try a desktop browser that supports screen sharing.');
    } finally { if (ticket === request) update(); }
  };
  $('websiteCapture').onclick = async () => {
    if (busy || !stream || pages.length >= 20) return;
    if (!video.videoWidth || video.readyState < 2) { message('Wait for the shared page preview, then capture again.'); return; }
    const ticket = request;
    busy = true; update();
    try {
      const scale = Math.min(1, 2200 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Capture failed. Try again.');
      if (!dialog.open || ticket !== request) return;
      pages.push({ blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
      message(`${pages.length} page(s) captured. ${pages.length === 20 ? 'Limit reached: download or add these pages.' : 'Scroll the source page to capture another section.'}`);
    } catch (error) { message(error.message); }
    finally { busy = false; render(); }
  };
  async function output(add) {
    if (busy || !pages.length) return;
    busy = true; render();
    try {
      const pdf = await globalThis.PDFLib.PDFDocument.create();
      for (const page of pages) {
        const img = await pdf.embedJpg(await page.blob.arrayBuffer());
        const width = page.width * 0.75, height = page.height * 0.75;
        pdf.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height });
      }
      const file = new File([await pdf.save()], 'website-capture.pdf', { type: 'application/pdf' });
      if (add) { await addPdf(file); dialog.close(); }
      else {
        const url = URL.createObjectURL(file), link = document.createElement('a');
        link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        stop(); message('Captured PDF downloaded. Sharing stopped.');
      }
    } catch (error) { message(`Could not create PDF: ${error.message}`); }
    finally { busy = false; render(); }
  }
  $('websiteDownload').onclick = () => output(false);
  $('websiteAdd').onclick = () => output(true);
}
