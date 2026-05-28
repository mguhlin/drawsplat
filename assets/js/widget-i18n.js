/* DrawSplatTM Widget i18n — opt-in translation for standalone widgets and games.
   ---------------------------------------------------------------------------
   Six languages, shared language preference with the whiteboard (via
   localStorage `drawsplat.language`), and a small <select> picker that any
   widget can drop in.

   HOW TO ADOPT IN A WIDGET (or game)
   ---------------------------------------------------------------------------
   1) Load this script, ideally before your widget's main inline script so
      translations apply on first paint:

        <script src="../../assets/js/widget-i18n.js" defer></script>

      (Path from a typical `solutions/<slug>/index.html` or `games/<slug>/index.html`.)

   2) Mark translatable DOM nodes with one of:

        <h1 data-i18n="app.title">Step-Splat</h1>
        <p  data-i18n="app.tagline">Splat any task into bite-size steps.</p>
        <button data-i18n="btn.splat" data-i18n-title="btn.splat.tip">Splat it →</button>
        <input  data-i18n-placeholder="input.ph">
        <h2     data-i18n-html="cta.html">Try our <strong>new</strong> mode</h2>

      Supported attribute helpers: data-i18n (textContent), data-i18n-html
      (innerHTML — only use with trusted dictionary content), data-i18n-placeholder,
      data-i18n-title, data-i18n-aria-label, data-i18n-alt.

   3) Add one language picker placeholder. Either form works:

        <select id="i18nSwitcher"></select>      <!-- already-styled select -->
        <div    data-i18n-picker></div>          <!-- script generates the select -->

   4) Register your locale dictionary. Inline in the widget's <script> block
      is fine (matches the single-file widget pattern):

        WidgetI18n.register('step-splat', {
          en: { 'app.title': 'Step-Splat', 'btn.splat': 'Splat it →', ... },
          es: { 'app.title': 'Paso-Splat', 'btn.splat': '¡A trocear! →', ... },
          vi: { ... }, ar: { ... }, zh: { ... }, uh: { ... },
        });

      The first argument is a widget identifier — pick something stable.
      Only the en table is required; missing strings fall back to en, then
      to whatever was in the HTML.

   5) For strings built in JS, call WidgetI18n.t():

        const label = WidgetI18n.t('progress.done', { done: 3, total: 10 });
        // dict: 'progress.done': '{done} of {total} done'

   6) For widgets that re-render dynamic UI on language change, listen for
      the event:

        window.addEventListener('widget-i18n:changed', () => render());

   LANGUAGE RESOLUTION ORDER
   ---------------------------------------------------------------------------
   ?lang=es URL query (one-shot share links)
     -> localStorage `drawsplat.language` (shared with the whiteboard so a
        teacher who picks Spanish in the whiteboard sees Spanish widgets too)
     -> navigator.language / navigator.languages[0]
     -> English

   RTL handling
   ---------------------------------------------------------------------------
   Arabic (ar) and Urdu/Hindi (uh) set <html dir="rtl">. Flex/grid layouts
   flip naturally; ensure padding/margins use logical properties (margin-inline-*)
   where direction-sensitive.
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'drawsplat.language';

  // The whiteboard treats `uh` as LTR Hindi (Devanagari) with bilingual
  // Urdu/Hindi labels in key UI text — see assets/js/locales.js. Mirroring
  // that here so widgets and the whiteboard render consistently.
  // The `htmlLang` value goes into <html lang=…> when this locale is active.
  const LANGS = [
    { code: 'en', label: 'English',          dir: 'ltr', htmlLang: 'en' },
    { code: 'es', label: 'Español',          dir: 'ltr', htmlLang: 'es' },
    { code: 'vi', label: 'Tiếng Việt',       dir: 'ltr', htmlLang: 'vi' },
    { code: 'ar', label: 'العربية',           dir: 'rtl', htmlLang: 'ar' },
    { code: 'zh', label: '中文',              dir: 'ltr', htmlLang: 'zh' },
    { code: 'uh', label: 'हिन्दी / اردو',     dir: 'ltr', htmlLang: 'hi' },
  ];

  const state = {
    lang: 'en',
    dictionaries: {},   // { widgetKey: { en: {...}, es: {...}, ... } }
    activeWidget: null,
    initialized: false,
  };

  // ---- Language detection
  function normalizeLang(raw) {
    if (!raw) return '';
    const lower = String(raw).toLowerCase();
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('vi')) return 'vi';
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('zh')) return 'zh';
    if (lower === 'uh' || lower.startsWith('ur') || lower.startsWith('hi')) return 'uh';
    if (lower.startsWith('en')) return 'en';
    return '';
  }

  function safeStorageGet() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }
  function safeStorageSet(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (_) { /* ignore */ }
  }

  function detectLang() {
    const params = new URLSearchParams(location.search || '');
    const candidates = [
      params.get('lang'),
      safeStorageGet(),
      navigator.language,
      ...(navigator.languages || []),
    ];
    for (const c of candidates) {
      const n = normalizeLang(c);
      if (n) return n;
    }
    return 'en';
  }

  function currentDict() {
    const widget = state.dictionaries[state.activeWidget] || {};
    return widget[state.lang] || widget.en || {};
  }

  function lookup(key) {
    const dict = currentDict();
    if (dict[key] !== undefined) return dict[key];
    // Fall back to en if the active lang is missing the key
    const enDict = (state.dictionaries[state.activeWidget] || {}).en || {};
    if (enDict[key] !== undefined) return enDict[key];
    return undefined;
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{([^}]+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }

  // ---- Apply translations to the DOM
  function apply() {
    const langCfg = LANGS.find(l => l.code === state.lang) || LANGS[0];
    document.documentElement.lang = langCfg.htmlLang || langCfg.code;
    document.documentElement.dir = langCfg.dir;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const v = lookup(key);
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const v = lookup(key);
      if (v !== undefined) el.innerHTML = v;
    });

    const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
    ATTRS.forEach(attr => {
      const selector = `[data-i18n-${attr}]`;
      document.querySelectorAll(selector).forEach(el => {
        const key = el.getAttribute(`data-i18n-${attr}`);
        const v = lookup(key);
        if (v !== undefined) el.setAttribute(attr, v);
      });
    });

    // Sync any pickers
    document.querySelectorAll('select#i18nSwitcher, select.widget-i18n-switcher').forEach(sel => {
      if (sel.value !== state.lang) sel.value = state.lang;
    });
  }

  // ---- Build picker(s)
  function buildPickerInto(sel) {
    sel.innerHTML = '';
    LANGS.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.label;
      if (l.code === state.lang) opt.selected = true;
      sel.appendChild(opt);
    });
    if (!sel.dataset.i18nWired) {
      sel.addEventListener('change', () => WidgetI18n.setLang(sel.value));
      sel.dataset.i18nWired = '1';
    }
    if (!sel.getAttribute('aria-label')) {
      sel.setAttribute('aria-label', 'Language / Idioma / Ngôn ngữ / اللغة / 语言 / زبان');
    }
  }

  function ensurePickers() {
    const existing = document.getElementById('i18nSwitcher');
    if (existing && existing.tagName === 'SELECT') buildPickerInto(existing);
    document.querySelectorAll('[data-i18n-picker]').forEach(host => {
      let sel = host.querySelector('select');
      if (!sel) {
        sel = document.createElement('select');
        sel.className = 'widget-i18n-switcher';
        if (!host.id && !document.getElementById('i18nSwitcher')) sel.id = 'i18nSwitcher';
        host.appendChild(sel);
      }
      buildPickerInto(sel);
    });
  }

  // ---- Public API
  const WidgetI18n = {
    register(widgetKey, dictionaries) {
      state.dictionaries[widgetKey] = dictionaries || {};
      state.activeWidget = widgetKey;
      if (state.initialized) {
        // Late registration — re-apply with the new dictionary
        ensurePickers();
        apply();
        return;
      }
      const start = () => init();
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    },
    t(key, vars) {
      const v = lookup(key);
      return interpolate(v === undefined ? key : v, vars);
    },
    setLang(code) {
      const n = normalizeLang(code) || 'en';
      if (n === state.lang) return;
      state.lang = n;
      safeStorageSet(n);
      apply();
      try {
        window.dispatchEvent(new CustomEvent('widget-i18n:changed', { detail: { lang: n }}));
      } catch (_) { /* CustomEvent unavailable */ }
    },
    getLang() { return state.lang; },
    LANGS: LANGS.slice(),
    // Escape hatch for advanced widgets that build their own picker UI
    refresh() { if (state.initialized) { ensurePickers(); apply(); } },
  };

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    state.lang = detectLang();
    ensurePickers();
    apply();
  }

  // Boot when DOM is ready even if no widget has registered yet (so a future
  // call to register() can re-apply without a flash of untranslated content).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (state.activeWidget) init(); });
  }

  window.WidgetI18n = WidgetI18n;
})();
