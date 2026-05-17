/* DrawSplat v2.10 — translation applicator. Reads window.DRAWSPLAT_LOCALE
   and applies window.DRAWSPLAT_LOCALES[lang] to the page. Wraps setStatus,
   confirm, alert, prompt with a runtime translation pass.
   Loads before app.js so that document.title/lang/dir are correct on first paint. */
(function(){
  /* Resolve language from explicit window var, else from <html lang>. */
  const explicit = window.DRAWSPLAT_LOCALE;
  const fromTag = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  const LANG = explicit || fromTag;
  const LOCS = window.DRAWSPLAT_LOCALES || {};
  const cfg = LOCS[LANG] || LOCS.en || {lang:'en',dir:'ltr',texts:{},placeholders:{},selects:{},runtime:{}};
  document.documentElement.lang = cfg.lang || 'en';
  document.documentElement.dir = cfg.dir || 'ltr';
  if(cfg.title) document.title = cfg.title;

  const texts = cfg.texts || {};
  const runtime = cfg.runtime || {};

  function applyDom(){
    const replaceMap = texts;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode(node){
      if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      const tag = (p.tagName||'').toLowerCase();
      if(['script','style','canvas'].includes(tag)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{ const t = n.nodeValue.trim(); if(replaceMap[t]) n.nodeValue = n.nodeValue.replace(t, replaceMap[t]) });
    /* Also translate aria-label, title, and data-tooltip attributes so iconization picks up translated labels. */
    ['aria-label','title','data-tooltip'].forEach(attr=>{
      document.querySelectorAll('['+attr+']').forEach(el=>{
        const v = (el.getAttribute(attr)||'').trim();
        if(replaceMap[v]) el.setAttribute(attr, replaceMap[v]);
      });
    });
    Object.entries(cfg.placeholders||{}).forEach(([id,val])=>{ const el = document.getElementById(id); if(el) el.placeholder = val });
    Object.entries(cfg.selects||{}).forEach(([id,map])=>{ const el = document.getElementById(id); if(!el) return; [...el.options].forEach(opt=>{ if(map[opt.value]) opt.textContent = map[opt.value] }) });
  }

  function translate(msg){
    if(typeof msg !== 'string') return msg;
    if(runtime[msg]) return runtime[msg];
    for(const [k,v] of Object.entries(runtime)) if(msg.startsWith(k)) return v + msg.slice(k.length);
    return msg;
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

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn() }
  ready(()=>{ applyDom(); /* re-run after app.js boots so dynamic markup is also translated */ setTimeout(applyDom, 0); patchRuntime(); setTimeout(patchRuntime, 0) });
})();
