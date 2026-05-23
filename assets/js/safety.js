/* DrawSplat compliance safety checks — runs in the browser before save.
   Reads window.complianceConfig (loaded by app.js). Until the config is
   ready, all checks pass through to avoid blocking startup. The server
   (apps-script/Code.gs) re-runs these checks; client-side is only the
   first line of defense. */
(function(global){
  function cfg(){ return global.complianceConfig || null; }

  function safetyText(){ return (cfg() && cfg().safety && cfg().safety.text) || null; }
  function safetyLinks(){ return (cfg() && cfg().safety && cfg().safety.links) || null; }

  function compilePatterns(list){
    if(!Array.isArray(list)) return [];
    const out=[];
    list.forEach(src=>{
      try{ out.push(new RegExp(src,'i')); }catch(e){ /* skip bad regex */ }
    });
    return out;
  }

  function wordsToPattern(words){
    if(!Array.isArray(words)||!words.length) return null;
    const escaped=words.map(w=>String(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    try{ return new RegExp('\\b('+escaped.join('|')+')\\b','i'); }catch(e){ return null; }
  }

  function checkTextSafety(text, surface){
    const t=String(text==null?'':text);
    if(!t) return { allowed:true, hits:[], reason:'' };
    const config=safetyText();
    if(!config||!config.enabled) return { allowed:true, hits:[], reason:'' };
    if(Array.isArray(config.appliesTo) && surface && config.appliesTo.indexOf(surface)===-1){
      return { allowed:true, hits:[], reason:'' };
    }
    const patterns=compilePatterns(config.patterns||[]);
    const wordsPattern=wordsToPattern(config.words||[]);
    const hits=[];
    patterns.forEach(rx=>{ const m=t.match(rx); if(m) hits.push(m[0]); });
    if(wordsPattern){ const m=t.match(wordsPattern); if(m) hits.push(m[0]); }
    if(!hits.length) return { allowed:true, hits:[], reason:'' };
    const allowed = !(config.blockOnMatch !== false);
    return {
      allowed: allowed,
      hits: hits,
      reason: 'Content matches a flagged term (' + hits.slice(0,3).join(', ') + '). Edit and try again.'
    };
  }

  function extractUrls(text){
    const t=String(text==null?'':text);
    const rx=/\bhttps?:\/\/[^\s<>"')]+/gi;
    return t.match(rx) || [];
  }

  function hostOf(url){
    try{ return new URL(url).hostname.toLowerCase(); }catch(e){ return ''; }
  }

  function checkLinkSafety(text){
    const config=safetyLinks();
    if(!config||!config.enabled) return { allowed:true, blocked:[], reason:'' };
    const urls=extractUrls(text);
    if(!urls.length) return { allowed:true, blocked:[], reason:'' };
    const allow=(config.allowedDomains||[]).map(d=>String(d).toLowerCase());
    if(!config.blockUnapproved) return { allowed:true, blocked:[], reason:'' };
    const blocked=[];
    urls.forEach(u=>{
      const host=hostOf(u);
      if(!host) return;
      const ok=allow.some(domain => host===domain || host.endsWith('.'+domain));
      if(!ok) blocked.push(host);
    });
    if(!blocked.length) return { allowed:true, blocked:[], reason:'' };
    return {
      allowed: false,
      blocked: blocked,
      reason: 'Link to '+blocked[0]+' is not on the allowed-domains list. Ask your teacher to add it, or remove the link.'
    };
  }

  function checkAll(text, surface){
    const t=checkTextSafety(text, surface);
    if(!t.allowed) return t;
    const l=checkLinkSafety(text);
    if(!l.allowed) return { allowed:false, hits:l.blocked, reason:l.reason, kind:'link' };
    return { allowed:true, hits:[], reason:'' };
  }

  global.DrawSplatSafety = {
    checkTextSafety,
    checkLinkSafety,
    checkAll,
    extractUrls
  };
})(window);
