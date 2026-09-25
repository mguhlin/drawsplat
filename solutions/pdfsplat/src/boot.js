/* Classic-script boot supports both hosted pages and opening the extracted HTML. */
(async () => {
  const load = (src, module = false) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    if (module) script.type = 'module';
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
  try {
    if (!globalThis.pdfjsLib || !globalThis.PDFLib || !globalThis.JSZip)
      throw new Error('Required PDF libraries are missing.');
    if (location.protocol === 'file:') {
      // PDF.js can render using its local main-thread worker implementation.
      // A file-origin Worker cannot load a sibling file in all browsers.
      await load('../../vendor/pdf.worker.min.js');
      document.querySelector('[data-ds-app-launcher]').hidden = true;
    } else {
      void load('../../assets/js/tool-launcher.js?v=2', true).catch(console.error);
    }
    await load('./app.bundle.js?v=20260924-offline');
  } catch (error) {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.style.cssText = 'padding:20px;background:#fff1f2;color:#881337;position:relative;z-index:100';
    message.textContent = 'PDFSplat could not start. Extract the entire ZIP and keep its folders together. Use the included START-WINDOWS.bat or START-MAC.command / start-local.sh launcher if your browser blocks local files. ' + error.message;
    document.body.prepend(message);
  }
})();
