// SplatWorks browser storage notice. This is an acknowledgement, not a
// granular consent manager. Keep the existing storage key and dismissal event
// so returning visitors and component integrations remain compatible.
// Local drafts, hosting metadata and optional connections have different
// boundaries; see the component inventory and the deployment privacy notice.
(function(){
  const KEY = 'drawsplat.consent.accepted';
  // Skip if already accepted, or if the page opted out via data-no-consent
  // attribute on <html> (e.g. embed-iframe pages, parent-portal kiosk mode).
  try {
    if (localStorage.getItem(KEY) === '1') return;
    if (document.documentElement.hasAttribute('data-no-consent')) return;
  } catch (e) { return; }

  function inject() {
    if (document.getElementById('drawsplatConsentBanner')) return;
    const wrap = document.createElement('div');
    wrap.id = 'drawsplatConsentBanner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Browser storage notice');
    wrap.setAttribute('aria-modal', 'false');
    wrap.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:14px', 'transform:translateX(-50%)',
      'z-index:10000', 'width:min(720px,calc(100vw - 24px))',
      'background:#fff', 'color:#1f2937',
      'border:1.5px solid #c7d2fe', 'border-radius:12px',
      'box-shadow:0 14px 40px rgba(15,23,42,.22)',
      'padding:14px 16px', 'font:14px/1.5 Arial,Helvetica,sans-serif',
      'display:flex', 'flex-wrap:wrap', 'gap:12px', 'align-items:center'
    ].join(';');
    wrap.innerHTML = ''
      + '<div style="flex:1 1 320px;min-width:240px">'
      +   '<strong style="color:#5b21b6">SplatWorks keeps app drafts and settings in this browser.</strong> '
      +   'They may remain until cleared. Public hosting receives request metadata; enabled cloud, AI, '
      +   'and sharing features send selected data to their providers.'
      +   ' <a href="/legal/widgets-security.html" style="color:#6d28d9;font-weight:700">Review storage and connections →</a>'
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button type="button" id="drawsplatConsentOk" '
      +     'style="padding:8px 14px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer;font:inherit;font-weight:800">'
      +     'Got it'
      +   '</button>'
      +   '<a href="/legal/terms-privacy.html" id="drawsplatConsentNotice" '
      +     'style="padding:8px 14px;border:1.5px solid #7c3aed;border-radius:8px;background:#fff;color:#7c3aed;font-weight:800;text-decoration:none">'
      +     'Read full notice'
      +   '</a>'
      + '</div>';
    document.body.appendChild(wrap);
    function dismiss() {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      wrap.remove();
      document.dispatchEvent(new CustomEvent('drawsplat:consent-dismissed'));
    }
    document.getElementById('drawsplatConsentOk').addEventListener('click', dismiss);
    document.getElementById('drawsplatConsentNotice').addEventListener('click', dismiss);
  }

  function injectWhenReady() {
    try {
      if (document.getElementById('welcomeDialog') && localStorage.getItem('drawsplat.welcomed') !== '1') {
        document.addEventListener('drawsplat:welcome-dismissed', () => setTimeout(inject, 250), { once: true });
        return;
      }
    } catch (e) {}
    inject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWhenReady);
  } else {
    injectWhenReady();
  }
})();
