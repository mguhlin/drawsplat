(async function () {
  'use strict';
  const privacy = window.SplatPrivacy, byId = id => document.getElementById(id), status = byId('status');
  function render() {
    const state = privacy.getState(); byId('origin').textContent = location.origin;
    byId('retention').textContent = state.expiryEnabled ? 'Browser drafts and settings expire on ' + new Date(state.expiresAt).toLocaleString() + '. Save native files before this date.' : 'Existing drafts are preserved. Choose 1, 7, or 30 days below to enable automatic expiry, or clear saved data now. No cleanup is silently enabled on upgrade.';
    byId('connections').checked = state.optionalConnections;
    byId('signals').textContent = 'Privacy signals: GPC ' + (state.gpc ? 'on' : 'not set') + '; Do Not Track ' + (state.dnt ? 'on' : 'not set') + '. No sale, targeted advertising, cross-context profiling, or model training by SplatWorks is permitted regardless of these signals.';
  }
  async function busy(button, action) {
    button.disabled = true; status.textContent = 'Working…';
    try { await action(); } catch (error) { status.textContent = error.message + ' Some operations may have completed. Retry or use browser site-data settings.'; }
    finally { button.disabled = false; render(); }
  }
  byId('export').onclick = () => busy(byId('export'), async () => {
    const archive = await privacy.exportData(), url = URL.createObjectURL(new Blob([JSON.stringify(archive)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'splatworks-browser-data.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = 'Browser data archive downloaded. Save native project files separately to reopen work.';
  });
  const dialog = byId('confirm-clear');
  byId('clear').onclick = () => dialog.showModal();
  dialog.addEventListener('close', () => { if (dialog.returnValue === 'clear') busy(byId('clear'), async () => {
    await privacy.clearData(); status.textContent = 'Cleared this domain’s browser databases, saved settings, caches, and service-worker registrations. Other copies require separate deletion.';
  }); });
  byId('renew').onclick = () => { privacy.renewRetention(Number(byId('days').value)); status.textContent = 'New retention deadline saved for this domain.'; render(); };
  byId('connections').onchange = () => { privacy.setConnections(byId('connections').checked); status.textContent = 'Connection preference saved. Reload other app tabs to apply it.'; };
  render();
  if (privacy.getState().expiryEnabled && Date.now() >= privacy.getState().expiresAt) await busy(byId('clear'), async () => {
    await privacy.clearData(); status.textContent = 'Expired browser data cleared on this domain. Other copies require separate deletion.';
  });
})();
