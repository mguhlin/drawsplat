// PDF text is positioned glyph runs, not paragraphs. These conservative
// heuristics retain styling and infer structure without claiming exact layout.
export const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
export const safeLink = value => /^(https?:|mailto:)/i.test(value || '') ? value : '';

export function formattedLines(items, width = 600) {
  const rows = [];
  for (const item of items.filter(item => item.str?.trim()).sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
    const size = Math.max(1, Math.hypot(item.transform[0], item.transform[1]));
    const run = { text: item.str.replace(/\s+/g, ' '), x: item.transform[4], y: item.transform[5], width: item.width || 0, size,
      bold: !!item.bold, italic: !!item.italic, font: item.fontFamily || 'serif', ...(safeLink(item.link) ? { link: safeLink(item.link) } : {}), ...(item.color ? { color: item.color } : {}) };
    let row = rows.find(row => Math.abs(row.y - run.y) <= Math.max(row.size, size) * .35);
    if (!row) rows.push(row = { y: run.y, size, runs: [] });
    row.runs.push(run); row.size = Math.max(row.size, size);
  }
  const lines = [];
  for (const row of rows.sort((a, b) => b.y - a.y)) {
    let group = [], right = -Infinity;
    const flush = () => {
      if (!group.length) return;
      let edge = -Infinity;
      const spans = [];
      for (const run of group) {
        const { text, ...style } = run;
        if (spans.length && run.x - edge > row.size * .12 && !/\s$/.test(spans.at(-1).text) && !/^\s/.test(text)) spans.push({ ...style, text: ' ' });
        spans.push({ ...style, text }); edge = run.x + run.width;
      }
      spans[0].text = spans[0].text.trimStart(); spans.at(-1).text = spans.at(-1).text.trimEnd();
      lines.push({ text: spans.map(s => s.text).join(''), spans, size: row.size, y: row.y, x: group[0].x, width: edge - group[0].x });
      group = [];
    };
    for (const run of row.runs.sort((a, b) => a.x - b.x)) {
      if (run.x - right > Math.max(row.size * 3, width * .07)) flush();
      group.push(run); right = run.x + run.width;
    }
    flush();
  }
  return lines;
}

function trimPrefix(spans, count) {
  return spans.flatMap(span => { const text = span.text.slice(count); count = Math.max(0, count - span.text.length); return text ? [{ ...span, text }] : []; });
}
export function structureLines(lines, pageWidth = 600) {
  if (!lines.length) return [];
  const weights = new Map();
  for (const line of lines) for (const span of line.spans || [{ text: line.text, size: line.size }]) {
    const size = Math.round(span.size * 2) / 2;
    weights.set(size, (weights.get(size) || 0) + span.text.length);
  }
  const bodySize = [...weights].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  const headingSizes = [...weights.keys()].filter(size => size >= bodySize * 1.18).sort((a, b) => b - a);
  const left = Math.min(...lines.map(line => line.x || 0));
  const right = Math.max(...lines.map(line => (line.x || 0) + (line.width || 0)));
  const blocks = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index], prev = lines[index - 1];
    const spans = line.spans || [{ text: line.text, size: line.size }];
    const marker = line.text.match(/^(?:([•●▪◦‣–—-])|(\d+)[.)])\s+/);
    const allBold = spans.filter(span => span.text.trim()).every(span => span.bold);
    const heading = !marker && line.text.length < 180 && (line.size >= bodySize * 1.18 || (allBold && line.text.length < 100 && !/[.!?;:]$/.test(line.text) && (!prev || prev.y - line.y > line.size * 1.5)));
    const alignment = Math.abs((line.x || 0) + (line.width || 0) / 2 - pageWidth / 2) < 8 && (line.width || 0) < pageWidth * .8 && (heading || line.x > left + 20) ? 'center' : Math.abs((line.x || 0) + (line.width || 0) - right) < 4 && line.x > left + 40 ? 'right' : 'left';
    const block = { type: heading ? 'heading' : marker ? 'list-item' : 'paragraph', spans: marker ? trimPrefix(spans, marker[0].length) : spans.map(span => ({ ...span })), alignment,
      size: line.size, spaceBefore: prev ? Math.max(0, Math.min(36, prev.y - line.y - line.size * 1.2)) : 0,
      indent: Math.max(0, (line.x || 0) - left), text: marker ? line.text.slice(marker[0].length) : line.text };
    if (heading) block.level = Math.min(6, Math.max(1, headingSizes.findIndex(size => Math.abs(size - line.size) < .6) + 1));
    if (marker) { block.ordered = !!marker[2]; block.start = marker[2] ? Number(marker[2]) : 1; block.marker = marker[0].trim(); }
    const prior = blocks.at(-1), gap = prev ? prev.y - line.y : Infinity;
    // Join wrapped prose only when its baseline, size, and left edge agree.
    if (block.type === 'paragraph' && prior?.type === 'paragraph' && gap > 0 && gap <= line.size * 1.5 && Math.abs(prev.size - line.size) < 1 && Math.abs(prev.x - line.x) < 3 && prior.alignment === alignment && !/[.!?:;]$/.test(prior.text)) {
      prior.spans.push({ text: ' ', size: line.size }, ...block.spans); prior.text += ` ${block.text}`;
    } else blocks.push(block);
  }
  return blocks;
}

export function blocksFor(page) {
  return page.blocks || structureLines(page.lines || [], page.width);
}
export function inlineHtml(spans) {
  return spans.map(span => {
    let text = xml(span.text);
    if (span.bold) text = `<strong>${text}</strong>`;
    if (span.italic) text = `<em>${text}</em>`;
    const family = String(span.font || '').replace(/[^\p{L}\p{N} _-]/gu, '');
    const size = Number.isFinite(span.size) ? Math.max(6, Math.min(144, span.size)) : 12;
    text = `<span style="font-size:${size}pt${family ? `;font-family:'${xml(family)}',serif` : ''}${/^#[0-9a-f]{6}$/i.test(span.color || '') ? `;color:${span.color}` : ''}">${text}</span>`;
    if (safeLink(span.link)) text = `<a href="${xml(span.link)}">${text}</a>`;
    return text;
  }).join('');
}
export function blocksHtml(blocks) {
  let html = '', list = '';
  const closeList = () => { if (list) html += `</${list}>`; list = ''; };
  for (const block of blocks) {
    const content = inlineHtml(block.spans), align = block.alignment === 'center' ? 'center' : block.alignment === 'right' ? 'right' : 'left';
    if (block.type === 'list-item') {
      const tag = block.ordered ? 'ol' : 'ul';
      if (list !== tag) { closeList(); html += `<${tag}${block.ordered ? ` start="${block.start}"` : ''}>`; list = tag; }
      html += `<li${block.ordered ? ` value="${block.start}"` : ''}>${content}</li>`;
    } else {
      closeList(); const tag = block.type === 'heading' ? `h${Math.min(6, block.level)}` : 'p';
      html += `<${tag} class="align-${align}">${content}</${tag}>`;
    }
  }
  closeList(); return html;
}
