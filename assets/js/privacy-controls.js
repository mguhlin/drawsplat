/* Shared SplatWorks privacy controls. No telemetry; all state stays on this origin. */
(function () {
  'use strict';
  if (window.SplatPrivacy) return;
  const VERSION = '2026-10-15.3';
  const KEY = 'splatworks.privacy.v1';
  const rootURL = new URL('../../', document.currentScript.src);
  const privacyURL = new URL('privacy/', rootURL).href;
  const DAY = 86400000;
  const isCenter = /\/privacy\/(?:index\.html)?$/.test(location.pathname);
  const providerHosts = /(^|\.)(openai\.com|anthropic\.com|generativelanguage\.googleapis\.com|api\.groq\.com|openrouter\.ai|api\.mistral\.ai|api\.cohere\.ai)$/i;
  const rawFetch = window.fetch.bind(window);
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
  if (!state || state.version !== 1 || !Number.isFinite(state.expiresAt)) {
    state = { version: 1, startedAt: Date.now(), expiresAt: Date.now() + 30 * DAY, optionalConnections: true, expiryEnabled: false };
  }
  function privacyLabel() { return state.expiryEnabled && Date.now() + 7 * DAY >= state.expiresAt ? 'Privacy · save before expiry' : 'Privacy'; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    const link = document.querySelector('.splat-privacy-link'); if (link) link.textContent = privacyLabel();
  }
  save();
  const approvedAIOrigins = new Set();
  const pendingApprovals = new Map();
  let approvalQueue = Promise.resolve(), approvalGeneration = 0, activeApproval;
  const credentialField = /token|password|passcode|secret|api.?key|pepper|credential|authorization/i;
  // Migrate known legacy AI settings without carrying persistent secrets forward.
  for (const storeName of ['localStorage', 'sessionStorage']) {
    try {
      const store = window[storeName];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!/(brain.?sort|clock.?wizard|step.?splat|toneshifter|vibe.?check)/i.test(key || '')) continue;
        const value = JSON.parse(store.getItem(key) || 'null');
        if (value && typeof value === 'object' && 'apiKey' in value) {
          value.apiKey = ''; store.setItem(key, JSON.stringify(value));
        }
      }
    } catch (_) { /* unavailable storage must not prevent local editing */ }
  }
  const networkError = () => new Error('External AI is disabled. Use the local option or ask your school about an approved service.');
  function permitted(input) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    if (providerHosts.test(url.hostname) && (url.protocol !== 'https:' || !approvedAIOrigins.has(url.origin))) return false;
    if (!state.optionalConnections && url.origin !== location.origin && /^https?:$/.test(url.protocol)) return false;
    return true;
  }
  // A second boundary in addition to removing browser AI credentials in the tools.
  function approveAI(origin) {
    if (approvedAIOrigins.has(origin)) return Promise.resolve(true);
    if (pendingApprovals.has(origin)) return pendingApprovals.get(origin);
    const generation = approvalGeneration;
    const operation = approvalQueue.then(async () => {
      if (!state.optionalConnections || generation !== approvalGeneration) return false;
      if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
      if (!state.optionalConnections || generation !== approvalGeneration) return false;
      return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.className = 'splat-privacy-approval';
      dialog.innerHTML = '<h2>Before sending content to AI</h2><p>Your prompt and selected content will leave this browser for this provider. Approval applies only to this destination in this tab. Review the <a href="/legal/terms-privacy.html#service-providers" target="_blank" rel="noopener">provider register</a>. Use an approved API account with no-training terms. Do not send student information without school authorization.</p><label><input type="checkbox"> I am an adult using my own data, or an authorized educator using a school-approved service and consent basis.</label><form method="dialog"><button value="cancel">Use local processing</button> <button value="approve" disabled>Allow AI for this tab</button></form>';
      const destination = document.createElement('p'); destination.textContent = 'Provider destination: ' + origin; dialog.querySelector('h2').after(destination);
      document.body.appendChild(dialog);
      const checkbox = dialog.querySelector('input'), allow = dialog.querySelector('[value="approve"]');
      checkbox.onchange = () => { allow.disabled = !checkbox.checked; };
      dialog.addEventListener('close', () => {
        const allowed = dialog.returnValue === 'approve' && checkbox.checked && state.optionalConnections && generation === approvalGeneration;
        if (allowed) approvedAIOrigins.add(origin);
        if (activeApproval === dialog) activeApproval = null;
        dialog.remove(); resolve(allowed);
      }, { once: true });
      activeApproval = dialog; dialog.showModal();
      });
    });
    approvalQueue = operation.then(() => {}, () => {});
    const pending = operation.finally(() => { if (pendingApprovals.get(origin) === pending) pendingApprovals.delete(origin); });
    pendingApprovals.set(origin, pending);
    return pending;
  }
  function revokeAI() {
    approvalGeneration++; approvedAIOrigins.clear(); pendingApprovals.clear();
    if (activeApproval && activeApproval.open) activeApproval.close('cancel');
  }
  window.fetch = async function (input, init) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    const isAI = providerHosts.test(url.hostname);
    if (isAI && url.protocol !== 'https:') throw networkError();
    const signal = init && init.signal || (input instanceof Request ? input.signal : null);
    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (isAI && state.optionalConnections && !approvedAIOrigins.has(url.origin)) await approveAI(url.origin);
    if (!permitted(input)) throw networkError();
    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
    // A provider's redirect cannot silently forward approved content elsewhere.
    return rawFetch(input, isAI ? { ...init, redirect: 'error' } : init);
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (!permitted(String(url))) throw networkError();
    return open.call(this, method, url, ...rest);
  };
  if (navigator.sendBeacon) {
    const beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, body) => permitted(String(url)) ? beacon(url, body) : false;
  }
  function redactJSONString(value) {
    if (typeof value !== 'string' || !/^\s*[\[{]/.test(value)) return value;
    try {
      return JSON.stringify(JSON.parse(value), (key, item) => credentialField.test(key) ? '[redacted]' : typeof item === 'string' ? redactJSONString(item) : item);
    } catch (_) { return value; }
  }
  function credentialKey(key) {
    return typeof key === 'string' ? credentialField.test(key) : Array.isArray(key) && key.some(credentialKey);
  }
  function snapshotStorage(store) {
    const result = {};
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      // Credentials are never included in the privacy export.
      if (credentialField.test(key)) continue;
      result[key] = redactJSONString(store.getItem(key));
    }
    return result;
  }
  async function encode(value) {
    if (value instanceof Blob) {
      const data = new Uint8Array(await value.arrayBuffer());
      let s = ''; for (let i = 0; i < data.length; i += 8192) s += String.fromCharCode(...data.subarray(i, i + 8192));
      return { type: 'Blob', mime: value.type, base64: btoa(s) };
    }
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      return encode(new Blob([bytes]));
    }
    if (value instanceof Date) return { type: 'Date', value: value.toISOString() };
    if (Array.isArray(value)) return Promise.all(value.map(encode));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = credentialField.test(k) ? '[redacted]' : await encode(v);
      return out;
    }
    return typeof value === 'string' ? redactJSONString(value) : value;
  }
  function request(req) { return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async function databases() {
    if (!indexedDB.databases) throw new Error('This browser cannot enumerate saved app databases. Use browser settings to export or clear site data.');
    return (await indexedDB.databases()).filter(d => d.name);
  }
  async function exportData() {
    const result = { version: VERSION, origin: location.origin, exportedAt: new Date().toISOString(), localStorage: snapshotStorage(localStorage), sessionStorage: snapshotStorage(sessionStorage), databases: {}, limitations: ['This is a browser data archive, not an app-native project file.', 'Backend records, downloaded files, cloud copies, other origins and backups are excluded.', 'Credentials are redacted. Keep the archive private; it can contain student work.'] };
    for (const item of await databases()) {
      const db = await request(indexedDB.open(item.name));
      try {
        const stores = {};
        for (const name of db.objectStoreNames) {
          const tx = db.transaction(name, 'readonly'), store = tx.objectStore(name);
          const [keys, values] = await Promise.all([request(store.getAllKeys()), request(store.getAll())]);
          stores[name] = await encode({ keys, values: values.map((value, index) => credentialKey(keys[index]) ? '[redacted]' : value) });
        }
        result.databases[item.name] = stores;
      } finally { db.close(); }
    }
    return result;
  }
  async function clearData() {
    revokeAI();
    // Close app tabs first: a blocked IDB deletion is reported, never called successful.
    const all = await databases();
    for (const db of all) {
      await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = resolve; req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('Close other SplatWorks tabs on this domain, then retry clearing. A database is still open.'));
      });
    }
    const cacheNames = 'caches' in window ? await caches.keys() : [];
    for (const key of cacheNames) await caches.delete(key);
    const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
    for (const registration of registrations) await registration.unregister();
    localStorage.clear(); sessionStorage.clear();
    state = { version: 1, startedAt: Date.now(), expiresAt: Date.now() + 30 * DAY, optionalConnections: false, expiryEnabled: false };
    save();
    return { version: VERSION, cleared: true, origin: location.origin, at: new Date().toISOString(), counts: { databases: all.length, caches: cacheNames.length, serviceWorkerRegistrations: registrations.length }, scope: 'Origin-local browser clearing; privacy preferences reset; not proof of erasure from other systems.', excluded: ['other domains', 'downloads', 'backend records', 'cloud copies', 'backups'] };
  }
  window.SplatPrivacy = Object.freeze({
    version: VERSION, getState: () => ({ ...state, gpc: navigator.globalPrivacyControl === true, dnt: navigator.doNotTrack === '1' }),
    exportData, clearData,
    setConnections(enabled) { state.optionalConnections = Boolean(enabled); if (!state.optionalConnections) revokeAI(); save(); },
    disableRetention() { state.expiryEnabled = false; save(); },
    renewRetention(days = 30) {
      if (![1, 7, 30].includes(Number(days))) throw new Error('Choose 1, 7, or 30 days.');
      state.expiryEnabled = true; state.startedAt = Date.now(); state.expiresAt = Date.now() + Number(days) * DAY; save();
    },
    aiUnavailable: networkError
  });
  // Do not erase legacy work during an upgrade. Expiry starts only after an explicit choice.
  // Once expired, send the visitor to the dedicated clearing page before editing.
  if (!isCenter && state.expiryEnabled && Date.now() >= state.expiresAt) {
    location.replace(privacyURL + '?expired=1'); return;
  }
  function readPreferences() {
    try {
      const incoming = JSON.parse(localStorage.getItem(KEY));
      if (incoming && incoming.version === 1 && Number.isFinite(incoming.expiresAt)) {
        if (!incoming.optionalConnections) revokeAI();
        state = incoming;
        const link = document.querySelector('.splat-privacy-link'); if (link) link.textContent = privacyLabel();
      }
    } catch (_) {}
  }
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) {
      if (event.key === null) revokeAI();
      readPreferences();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isCenter) {
      readPreferences();
      if (state.expiryEnabled && Date.now() >= state.expiresAt) location.replace(privacyURL + '?expired=1');
    }
  });
  function link() {
    if (window.top !== window.self || document.documentElement.hasAttribute('data-privacy-no-link')) return;
    const a = document.createElement('a'); a.href = privacyURL; a.className = 'splat-privacy-link';
    a.textContent = privacyLabel();
    a.setAttribute('aria-label', 'Privacy: export or clear saved browser data');
    // Apps exposes the same link inside its menu. Never cover the existing launcher.
    const place = () => { a.hidden = Boolean(document.querySelector('[data-ds-app-launcher]')); };
    document.body.appendChild(a); place();
    const observer = new MutationObserver(() => { place(); if (a.hidden) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', link); else link();
})();
