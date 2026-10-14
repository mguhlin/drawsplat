// Queue an early click while the shared module is still downloading.
(() => {
  let ready = false;
  const pending = import('./tool-launcher.js').then(module => { ready = true; return module; });
  document.addEventListener('click', event => {
    if (ready || !event.target.closest('[data-ds-app-launcher]')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    pending.then(module => module.openLauncher()).catch(console.error);
  }, true);
})();
