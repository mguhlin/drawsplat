/* Temporary compatibility links. Six months from October 8, 2026.
 * Date-gated in the browser so static hosts need no future deploy or cron job.
 */
(() => {
  'use strict';
  const page = document.body;
  const expires = Date.parse(page.dataset.redirectExpires);
  if (!Number.isFinite(expires) || Date.now() >= expires) {
    document.getElementById('redirect-title').textContent = 'This old game link has expired';
    document.getElementById('redirect-message').textContent =
      'Automatic forwarding ended April 8, 2027. Choose the game link below and update your bookmark.';
    return;
  }
  const destination = new URL(page.dataset.redirectTo, location.href);
  // Preserve shared language links and fragments, including on subpath hosts.
  destination.search = location.search;
  destination.hash = location.hash;
  location.replace(destination.href);
})();
