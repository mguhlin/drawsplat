/* Upgrade an existing whiteboard offline worker without touching project storage.
 * A new, versioned bootstrap URL also escapes the old worker's cache-first rule.
 * Never reload an active publication or replace another application's worker.
 */
(() => {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  let offered = false;
  const offerReload = () => {
    if (offered) return; offered = true;
    const button = document.createElement('button'); button.id = 'layoutsplatUpdateReady'; button.type = 'button';
    button.textContent = 'Update ready — Reload LayoutSplat';
    button.style.cssText = 'position:fixed;right:16px;bottom:36px;z-index:10000;background:#5a22b5;color:white;border:2px solid white;border-radius:8px;padding:12px;font:600 14px system-ui;box-shadow:0 4px 16px #0003';
    button.addEventListener('click', () => location.reload()); document.body.append(button);
  };
  navigator.serviceWorker.getRegistration(location.href).then(async registration => {
    const worker = registration?.active || registration?.waiting;
    if (!worker || new URL(worker.scriptURL).pathname !== '/sw.js') return;
    navigator.serviceWorker.addEventListener('controllerchange', offerReload, { once: true });
    await registration.update();
  }).catch(() => { /* The existing offline copy remains usable without a network. */ });
})();
