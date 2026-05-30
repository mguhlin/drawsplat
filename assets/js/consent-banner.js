// DrawSplat localStorage / cookie consent banner.
//
// Shows once on first visit, dismisses on either button. Choice is stored in
// localStorage.drawsplat.consent.accepted so the banner stays out of the way
// on return visits. The banner is intentionally lightweight: no tracking, no
// "reject all" granularity (we don't have categories — everything we store is
// either strictly-necessary or a single-feature preference like "audio
// muted"). The accompanying GDPR Compliance Summary page documents what each
// localStorage key is for.
//
// Load this on every public-facing page that uses localStorage:
//   <script src="/assets/js/consent-banner.js" defer></script>
//
// Schools self-hosting who prefer a different UX (full cookie wall, granular
// consent, district branding) can replace this single file with their own.
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
      +   '<strong style="color:#5b21b6">DrawSplat saves your preferences in this browser.</strong> '
      +   'Things like your language, in-progress board, and Audio On/Off toggle live in your browser\'s '
      +   'localStorage so they persist between visits. We do not use cookies for tracking, do not run third-party '
      +   'analytics, and never send your data anywhere unless you opt into Cloud Save.'
      +   ' <a href="/legal/gdpr-compliance.html#localStorage" style="color:#6d28d9;font-weight:700">See the full storage inventory →</a>'
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button type="button" id="drawsplatConsentOk" '
      +     'style="padding:8px 14px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer;font:inherit;font-weight:800">'
      +     'Got it'
      +   '</button>'
      +   '<a href="/legal/gdpr-compliance.html" '
      +     'style="padding:8px 14px;border:1.5px solid #7c3aed;border-radius:8px;background:#fff;color:#7c3aed;font-weight:800;text-decoration:none">'
      +     'Read full notice'
      +   '</a>'
      + '</div>';
    document.body.appendChild(wrap);
    document.getElementById('drawsplatConsentOk').addEventListener('click', () => {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      wrap.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
