/**
 * DrawSplatTM safety — shared text + link scan for the MySQL backend.
 *
 * Mirrors the rules in compliance.config.json and apps-script/Code.gs so a
 * board rejected by the Apps Script path is also rejected here. Returns
 * { ok: true } when the content passes, or { ok: false, reason, hits } when
 * a configured rule fires.
 */

function loadSafetyConfig(complianceConfig) {
  const cfg = complianceConfig || {};
  const safety = cfg.safety || {};
  return {
    text: {
      enabled: safety.text && safety.text.enabled !== false,
      blockOnMatch: safety.text && safety.text.blockOnMatch !== false,
      logOnMatch: safety.text && safety.text.logOnMatch !== false,
      patterns: (safety.text && Array.isArray(safety.text.patterns)) ? safety.text.patterns : [],
      words: (safety.text && Array.isArray(safety.text.words)) ? safety.text.words : []
    },
    links: {
      enabled: safety.links && safety.links.enabled !== false,
      blockUnapproved: safety.links && safety.links.blockUnapproved !== false,
      allowedDomains: (safety.links && Array.isArray(safety.links.allowedDomains)) ? safety.links.allowedDomains : []
    }
  };
}

function extractStrings(value, out) {
  if (value == null) return;
  if (typeof value === 'string') { out.push(value); return; }
  if (typeof value === 'number' || typeof value === 'boolean') return;
  if (Array.isArray(value)) { for (const v of value) extractStrings(v, out); return; }
  if (typeof value === 'object') {
    for (const k of Object.keys(value)) extractStrings(value[k], out);
  }
}

function scanText(text, rules) {
  const hits = [];
  if (!rules.text.enabled) return hits;
  const lower = String(text).toLowerCase();
  for (const word of rules.text.words) {
    if (!word) continue;
    if (lower.indexOf(String(word).toLowerCase()) !== -1) hits.push({ type: 'word', value: word });
  }
  for (const pattern of rules.text.patterns) {
    if (!pattern) continue;
    try {
      const re = new RegExp(pattern, 'i');
      if (re.test(text)) hits.push({ type: 'pattern', value: pattern });
    } catch (e) {}
  }
  return hits;
}

function scanLinks(text, rules) {
  const hits = [];
  if (!rules.links.enabled) return hits;
  if (!rules.links.blockUnapproved) return hits;
  const allowed = rules.links.allowedDomains.map(d => String(d).toLowerCase());
  const urls = String(text).match(/https?:\/\/[^\s<>"')]+/gi) || [];
  for (const url of urls) {
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch (e) {}
    if (!host) continue;
    const ok = allowed.some(d => host === d || host.endsWith('.' + d));
    if (!ok) hits.push({ type: 'link', value: url, host });
  }
  return hits;
}

function checkBoardSafety(boardJson, complianceConfig) {
  const rules = loadSafetyConfig(complianceConfig);
  const strings = [];
  extractStrings(boardJson, strings);
  const joined = strings.join('\n');
  const textHits = scanText(joined, rules);
  const linkHits = scanLinks(joined, rules);
  const allHits = textHits.concat(linkHits);
  if (allHits.length === 0) return { ok: true, hits: [] };
  const shouldBlock = (textHits.length > 0 && rules.text.blockOnMatch)
    || (linkHits.length > 0 && rules.links.blockUnapproved);
  return { ok: !shouldBlock, hits: allHits, reason: shouldBlock ? 'safety_block' : 'safety_warn' };
}

module.exports = { loadSafetyConfig, checkBoardSafety, scanText, scanLinks };
