// Shared "open in other tool" handoff used by Concept Map Studio ⇄ Markdown
// Studio. URL-hash transfer turned out to be flaky in production — browsers
// strip the hash on noopener+target=_blank in some Safari versions, and
// service-worker / CDN caching can serve stale recipient JS that mishandles
// the fragment. localStorage is bulletproof across same-origin tabs and
// survives a hard refresh on the recipient page.
//
// Convention:
//   - Sender writes { content, kind, ts } to localStorage.drawsplat.handoff
//   - Recipient page reads it ON LOAD, clears it, and uses the content.
//   - If the entry is older than HANDOFF_TTL_MS, it's discarded (stale tab
//     opened later, not from a real handoff).
(function(){
  const KEY = 'drawsplat.handoff';
  const TTL = 5 * 60 * 1000; // 5 minutes — generous for "click button, switch tab, wait"

  function write(content, kind){
    try {
      localStorage.setItem(KEY, JSON.stringify({
        content: String(content || ''),
        kind: String(kind || ''),
        ts: Date.now()
      }));
      return true;
    } catch (e) { return false; }
  }
  function readAndClear(expectedKind){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      let obj;
      try { obj = JSON.parse(raw); } catch (e) { localStorage.removeItem(KEY); return null; }
      // Always clear — handoff is one-shot. Even if it doesn't match the
      // expected kind, get it out of the way so a future handoff isn't
      // shadowed by this one.
      localStorage.removeItem(KEY);
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.ts !== 'number' || Date.now() - obj.ts > TTL) return null;
      if (expectedKind && obj.kind !== expectedKind) return null;
      return obj.content;
    } catch (e) { return null; }
  }

  // Markdown → Concept Map parser. Inputs a markdown outline like:
  //   # Main idea
  //   ## Hub one
  //   ### Detail A
  //   - bullet detail
  // Output: a concept-map JSON object with nodes (level 1/2/3), connectors
  // wiring each non-root node to its parent heading, and a simple radial
  // layout so the imported map doesn't dogpile at origin.
  const PALETTE = [
    { fill: '#fce7f3', stroke: '#ec4899', text: '#831843' },
    { fill: '#d1fae5', stroke: '#10b981', text: '#064e3b' },
    { fill: '#ede9fe', stroke: '#8b5cf6', text: '#4c1d95' },
    { fill: '#fef9c3', stroke: '#eab308', text: '#713f12' },
    { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a' }
  ];
  const ROOT = { fill: '#7c3aed', stroke: '#5b21b6', text: '#ffffff' };

  function parseMarkdownToConceptMap(md){
    const lines = String(md || '').split(/\r?\n/);
    const nodes = [];
    const connectors = [];
    let parentByLevel = {}; // level → last seen node id at that level
    let nextId = 1;
    let nextCId = 1;
    let bulletIndentBaseline = null;
    function add(label, level, parentId, paletteIdx){
      const id = 'n' + (nextId++);
      const c = level === 1 ? ROOT : PALETTE[paletteIdx % PALETTE.length];
      // Omit w/h so the recipient's applyLoadedJson picks the level-based
      // defaults (clampNumber falls back when the input is undefined).
      nodes.push({
        id,
        label: label.trim(),
        level,
        isRoot: level === 1,
        fill: c.fill, stroke: c.stroke, text: c.text,
        x: 0, y: 0
      });
      if (parentId) connectors.push({ id: 'c' + (nextCId++), fromId: parentId, toId: id, label: '' });
      return id;
    }
    let level2Count = 0;
    for (const raw of lines) {
      const line = raw.replace(/^\s+|\s+$/g, '');
      if (!line) continue;
      let m;
      if ((m = line.match(/^#\s+(.+)$/))) {
        const id = add(m[1], 1, null, 0);
        parentByLevel = { 1: id };
        level2Count = 0;
      } else if ((m = line.match(/^##\s+(.+)$/))) {
        const parent = parentByLevel[1] || null;
        const id = add(m[1], 2, parent, level2Count);
        parentByLevel[2] = id;
        delete parentByLevel[3];
        level2Count++;
      } else if ((m = line.match(/^###\s+(.+)$/))) {
        const parent = parentByLevel[2] || parentByLevel[1] || null;
        const parentColor = parent ? (nodes.find(n => n.id === parent)?.fill) : null;
        const palIdx = PALETTE.findIndex(p => p.fill === parentColor);
        const id = add(m[1], 3, parent, palIdx >= 0 ? palIdx : 0);
        parentByLevel[3] = id;
      } else if ((m = line.match(/^(\s*)[-*+]\s+(.+)$/))) {
        // Bullet — level 3 detail, attaches to deepest current heading.
        const parent = parentByLevel[3] || parentByLevel[2] || parentByLevel[1] || null;
        const parentColor = parent ? (nodes.find(n => n.id === parent)?.fill) : null;
        const palIdx = PALETTE.findIndex(p => p.fill === parentColor);
        add(m[2], 3, parent, palIdx >= 0 ? palIdx : 0);
      }
      // Ignore everything else (paragraphs, links, code blocks, etc.) — the
      // outline mode only cares about heading + bullet structure.
    }
    // If no root was detected (markdown without # heading), synthesize one
    // so the rendered map still has a center.
    if (!nodes.some(n => n.isRoot)) {
      const id = add('(Untitled map)', 1, null, 0);
      // Re-parent all current top-level nodes to this synthetic root
      const orphans = nodes.filter(n => n.id !== id && !connectors.some(c => c.toId === n.id));
      orphans.forEach(o => connectors.push({ id: 'c' + (nextCId++), fromId: id, toId: o.id, label: '' }));
    }
    // Radial layout: root at origin, each subtree gets a wedge.
    layoutRadial(nodes, connectors);
    return {
      type: 'drawsplat-concept-map',
      version: 2,
      saved: new Date().toISOString(),
      canvas: { w: 1200, h: 720 },
      nodes, connectors, groups: []
    };
  }

  function layoutRadial(nodes, connectors){
    const root = nodes.find(n => n.isRoot);
    if (!root) return;
    root.x = 0; root.y = 0;
    const children = new Map();
    connectors.forEach(c => {
      if (!children.has(c.fromId)) children.set(c.fromId, []);
      children.get(c.fromId).push(c.toId);
    });
    function place(parentId, angleStart, angleEnd, ringRadius, depth){
      const kids = children.get(parentId) || [];
      if (!kids.length) return;
      const sweep = (angleEnd - angleStart);
      const step = sweep / Math.max(1, kids.length);
      kids.forEach((kid, i) => {
        const a = angleStart + step * (i + 0.5);
        const n = nodes.find(nn => nn.id === kid);
        if (!n) return;
        n.x = Math.cos(a) * ringRadius;
        n.y = Math.sin(a) * ringRadius;
        // Children take their parent's sliver of angle for sub-layout
        place(kid, angleStart + step * i, angleStart + step * (i + 1), ringRadius + (depth === 0 ? 320 : 260), depth + 1);
      });
    }
    place(root.id, -Math.PI / 2, 3 * Math.PI / 2, 380, 0);
  }

  window.DrawSplatHandoff = {
    write,
    readAndClear,
    parseMarkdownToConceptMap
  };
})();
