// Rich stories remain text plus validated inline ranges, never imported HTML.
export function appendRich(element, story, start, end, { first = false, style = story.style } = {}) {
  const text = story.text.slice(start, end), ranges = (story.marks || []).filter(m => m.from < end && m.to > start);
  const edges = [...new Set([start, end, ...ranges.flatMap(m => [Math.max(start, m.from), Math.min(end, m.to)])])].sort((a, b) => a - b);
  const firstLength = first && style.dropCap ? ([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)][0]?.segment.length || 0) : 0;
  if (firstLength && !edges.includes(start + firstLength)) edges.push(start + firstLength), edges.sort((a, b) => a - b);
  for (let i = 0; i < edges.length - 1; i++) {
    const from = edges[i], to = edges[i + 1]; if (to <= from) continue;
    const active = ranges.filter(m => m.from <= from && m.to >= to), attrs = Object.assign({}, ...active);
    const span = document.createElement(attrs.link ? 'a' : 'span'); span.textContent = story.text.slice(from, to);
    if (attrs.bold !== undefined) span.style.fontWeight = attrs.bold ? 'bold' : 'normal';
    if (attrs.italic !== undefined) span.style.fontStyle = attrs.italic ? 'italic' : 'normal'; if (attrs.underline !== undefined) span.style.textDecoration = attrs.underline ? 'underline' : 'none';
    if (attrs.color) span.style.color = attrs.color; if (attrs.font) span.style.fontFamily = `"${attrs.font}","LayoutSplat Arabic","LayoutSplat Indic","LayoutSplat CJK",sans-serif`; if (attrs.size) span.style.fontSize = `${attrs.size * style.size / story.style.size}pt`;
    if (attrs.link) { span.href = attrs.link; span.rel = 'noopener noreferrer'; }
    if (firstLength && from === start) { span.style.cssFloat = style.direction === 'rtl' ? 'right' : 'left'; span.style.fontSize = `${style.size * style.lineHeight * style.dropCap}pt`; span.style.lineHeight = '0.85'; span.style.marginInlineEnd = '5pt'; }
    element.append(span);
  }
}
export function textToRichDocument(story) {
  let offset = 0;
  return { type: 'doc', content: story.text.split('\n').map(line => {
    const start = offset, end = offset + line.length, ranges = (story.marks || []).filter(m => m.from < end && m.to > start), edges = [...new Set([start, end, ...ranges.flatMap(m => [Math.max(start, m.from), Math.min(end, m.to)])])].sort((a, b) => a - b);
    offset = end + 1;
    const content = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const from = edges[i], to = edges[i + 1]; if (to <= from) continue;
      const active = Object.assign({}, ...ranges.filter(m => m.from <= from && m.to >= to)), marks = [];
      for (const [key, name] of [['bold', 'strong'], ['italic', 'em'], ['underline', 'underline']]) if (active[key]) marks.push({ type: name });
      if (active.color || active.size || active.font) marks.push({ type: 'style', attrs: { color: active.color || null, size: active.size || null, font: active.font || null } });
      if (active.link) marks.push({ type: 'link', attrs: { href: active.link } });
      content.push({ type: 'text', text: story.text.slice(from, to), ...(marks.length ? { marks } : {}) });
    }
    return { type: 'paragraph', ...(content.length ? { content } : {}) };
  }) };
}
export function richDocumentToText(documentJson) {
  let text = '', marks = [];
  (documentJson.content || []).forEach((paragraph, i) => {
    if (i) text += '\n';
    for (const node of paragraph.content || []) {
      if (node.type === 'hard_break') { text += '\n'; continue; }
      if (!node.text) continue;
      const from = text.length; text += node.text; const range = { from, to: text.length };
      for (const mark of node.marks || []) {
        if (mark.type === 'strong') range.bold = true; if (mark.type === 'em') range.italic = true; if (mark.type === 'underline') range.underline = true;
        if (mark.type === 'link' && /^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(mark.attrs.href)) range.link = mark.attrs.href;
        if (mark.type === 'style') for (const key of ['color', 'size', 'font']) if (mark.attrs[key]) range[key] = mark.attrs[key];
      }
      if (Object.keys(range).length > 2) marks.push(range);
    }
  });
  return { text, marks };
}
