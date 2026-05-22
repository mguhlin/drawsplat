/* DrawSplatTM v2.10 — translation applicator. Reads window.DRAWSPLAT_LOCALE
   and applies window.DRAWSPLAT_LOCALES[lang] to the page. Wraps setStatus,
   confirm, alert, prompt with a runtime translation pass.
   Loads before app.js so that document.title/lang/dir are correct on first paint. */
(function(){
  /* Resolve language from explicit window var, translated page filename, query
     string, saved preference, then browser preference. English pages stay
     flexible so the shared template gallery can follow the user's selection. */
  const explicit = window.DRAWSPLAT_LOCALE;
  const fromTag = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  const tagLang = fromTag.split('-')[0];
  const tagIsTranslatedPage = tagLang && tagLang !== 'en';
  const params = new URLSearchParams(location.search || '');
  const fromQuery = (params.get('lang') || '').toLowerCase();
  let fromStorage = '';
  try{fromStorage = (localStorage.getItem('drawsplat.language') || '').toLowerCase()}catch(_){}
  const fromBrowser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
  function normalizeLang(lang){
    if(!lang) return '';
    if(lang.startsWith('es')) return 'es';
    if(lang.startsWith('vi')) return 'vi';
    if(lang.startsWith('ar')) return 'ar';
    if(lang.startsWith('zh')) return 'zh';
    if(lang === 'uh' || lang.startsWith('ur') || lang.startsWith('hi')) return 'uh';
    if(lang.startsWith('en')) return 'en';
    return '';
  }
  const LANG = normalizeLang(explicit) || (tagIsTranslatedPage ? normalizeLang(tagLang) : '') || normalizeLang(fromQuery) || normalizeLang(fromStorage) || normalizeLang(fromBrowser) || normalizeLang(tagLang) || 'en';
  const LOCS = window.DRAWSPLAT_LOCALES || {};
  const cfg = LOCS[LANG] || LOCS.en || {lang:'en',dir:'ltr',texts:{},placeholders:{},selects:{},runtime:{}};
  document.documentElement.lang = cfg.lang || 'en';
  document.documentElement.dir = cfg.dir || 'ltr';
  if(cfg.title) document.title = cfg.title;
  window.DRAWSPLAT_LANG = cfg.lang || LANG;

  const texts = cfg.texts || {};
  const runtime = cfg.runtime || {};

  function translate(msg){
    if(typeof msg !== 'string') return msg;
    if(texts[msg]) return texts[msg];
    if(runtime[msg]) return runtime[msg];
    for(const [k,v] of Object.entries(runtime)) if(msg.startsWith(k)) return v + msg.slice(k.length);
    return msg;
  }

  window.DRAWSPLAT_TRANSLATE = translate;
  window.DRAWSPLAT_APPLY_I18N = applyDom;

  function shouldSkipElement(el){
    return !el || !!el.closest('script,style,canvas,#boardSvg,#richEditor,#inlineTextEditor,.mermaid-preview,.graph-preview,.wc-preview');
  }

  function translateTextNode(node){
    const t = node.nodeValue.trim();
    if(!t) return;
    const translated = translate(t);
    if(translated !== t) node.nodeValue = node.nodeValue.replace(t, translated);
  }

  function applyDom(root=document.body){
    if(!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode(node){
      if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      const tag = (p.tagName||'').toLowerCase();
      if(['script','style','canvas'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if(shouldSkipElement(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    /* Also translate aria-label, title, and data-tooltip attributes so iconization picks up translated labels. */
    ['aria-label','title','data-tooltip','placeholder','alt'].forEach(attr=>{
      if(root.nodeType === Node.ELEMENT_NODE && root.hasAttribute?.(attr) && !shouldSkipElement(root)){
        const v = (root.getAttribute(attr)||'').trim();
        const translated = translate(v);
        if(translated !== v) root.setAttribute(attr, translated);
      }
      root.querySelectorAll?.('['+attr+']').forEach(el=>{
        if(shouldSkipElement(el)) return;
        const v = (el.getAttribute(attr)||'').trim();
        const translated = translate(v);
        if(translated !== v) el.setAttribute(attr, translated);
      });
    });
    if(root.nodeType === Node.ELEMENT_NODE && root.matches?.('option')){
      const v = root.textContent.trim();
      const translated = translate(v);
      if(translated !== v) root.textContent = translated;
    }
    root.querySelectorAll?.('option').forEach(opt=>{
      const v = opt.textContent.trim();
      const translated = translate(v);
      if(translated !== v) opt.textContent = translated;
    });
    if(root.nodeType === Node.ELEMENT_NODE && root.matches?.('optgroup[label]')){
      const v = root.getAttribute('label') || '';
      const translated = translate(v);
      if(translated !== v) root.setAttribute('label', translated);
    }
    root.querySelectorAll?.('optgroup[label]').forEach(group=>{
      const v = group.getAttribute('label') || '';
      const translated = translate(v);
      if(translated !== v) group.setAttribute('label', translated);
    });
    Object.entries(cfg.placeholders||{}).forEach(([id,val])=>{ const el = document.getElementById(id); if(el) el.placeholder = val });
    Object.entries(cfg.selects||{}).forEach(([id,map])=>{ const el = document.getElementById(id); if(!el) return; [...el.options].forEach(opt=>{ if(map[opt.value]) opt.textContent = map[opt.value] }) });
  }

  function patchRuntime(){
    if(typeof window.setStatus === 'function' && !window.setStatus.__drawsplatPatched){
      const old = window.setStatus;
      window.setStatus = function(msg, cls){ return old(translate(msg), cls) };
      window.setStatus.__drawsplatPatched = true;
    }
    if(typeof window.setSyncStatus === 'function' && !window.setSyncStatus.__drawsplatPatched){
      const old = window.setSyncStatus;
      window.setSyncStatus = function(msg, cls){ return old(translate(msg), cls) };
      window.setSyncStatus.__drawsplatPatched = true;
    }
    if(!window.confirm.__drawsplatPatched){
      const oldFn = window.confirm.bind(window);
      window.confirm = function(msg){ return oldFn(translate(msg)) };
      window.confirm.__drawsplatPatched = true;
    }
    if(!window.alert.__drawsplatPatched){
      const oldFn = window.alert.bind(window);
      window.alert = function(msg){ return oldFn(translate(msg)) };
      window.alert.__drawsplatPatched = true;
    }
    if(!window.prompt.__drawsplatPatched){
      const oldFn = window.prompt.bind(window);
      window.prompt = function(msg, def){ return oldFn(translate(msg), def) };
      window.prompt.__drawsplatPatched = true;
    }
  }

  function observeDom(){
    if(!window.MutationObserver || !document.body) return;
    const observer = new MutationObserver(mutations=>{
      mutations.forEach(m=>{
        m.addedNodes.forEach(node=>{
          if(node.nodeType === Node.TEXT_NODE && node.parentElement && !shouldSkipElement(node.parentElement)) translateTextNode(node);
          else if(node.nodeType === Node.ELEMENT_NODE && !shouldSkipElement(node)) applyDom(node);
        });
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn() }
  ready(()=>{ applyDom(); /* re-run after app.js boots so dynamic markup is also translated */ setTimeout(applyDom, 0); patchRuntime(); setTimeout(patchRuntime, 0); observeDom() });
})();
