export function htmlToMarkdown(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  return `${Array.from(host.childNodes)
    .map((node) => nodeToMarkdown(node))
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  let codeLang = '';

  function flushList(): void {
    if (list) {
      const tag = list.ordered ? 'ol' : 'ul';
      blocks.push(`<${tag}>${list.items.join('')}</${tag}>`);
      list = null;
    }
  }

  function flushCode(): void {
    if (code) {
      const className = codeLang ? ` class="language-${escapeAttribute(codeLang)}"` : '';
      blocks.push(`<pre><code${className}>${escapeHtml(code.join('\n'))}</code></pre>`);
      code = null;
      codeLang = '';
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (code) {
      if (/^```/.test(line)) {
        flushCode();
      } else {
        code.push(line);
      }
      continue;
    }

    const trimmed = fixDuplicateHeadingMarkers(line.trim());

    if (/^```/.test(trimmed)) {
      flushList();
      code = [];
      codeLang = trimmed.replace(/^```/, '').trim();
      continue;
    }

    const table = parseMarkdownTable(lines, index);
    if (table) {
      flushList();
      blocks.push(table.html);
      index = table.nextIndex - 1;
      continue;
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/u.exec(trimmed);
    if (heading) {
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineHtml(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/u.test(trimmed)) {
      flushList();
      blocks.push('<hr>');
      continue;
    }

    if (/^<div style="page-break-after: always;"><\/div>$/iu.test(trimmed)) {
      flushList();
      blocks.push('<div class="page-break" data-page-break="true"></div>');
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/u.exec(trimmed);
    if (quoteMatch) {
      flushList();
      blocks.push(`<blockquote><p>${inlineHtml(quoteMatch[1])}</p></blockquote>`);
      continue;
    }

    const taskMatch = /^[-*+]\s*\[([ xX])\]\s+(.+)$/u.exec(trimmed);
    if (taskMatch) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      const checked = /[xX]/u.test(taskMatch[1]) ? ' checked' : '';
      list.items.push(`<li><input type="checkbox" disabled${checked}> ${inlineHtml(taskMatch[2])}</li>`);
      continue;
    }

    const orderedMatch = /^\s*\d+\.\s+(.+)$/u.exec(trimmed);
    const unorderedMatch = /^\s*[-*+]\s+(.+)$/u.exec(trimmed);
    if (orderedMatch || unorderedMatch) {
      const ordered = Boolean(orderedMatch);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(`<li>${inlineHtml((orderedMatch ?? unorderedMatch)?.[1] ?? '')}</li>`);
      continue;
    }

    flushList();
    blocks.push(`<p>${inlineHtml(trimmed)}</p>`);
  }

  flushList();
  flushCode();

  return blocks.join('\n');
}

function fixDuplicateHeadingMarkers(line: string): string {
  const match = /^(\s*)((?:#{1,6}\s+){2,})(.*)$/u.exec(line);
  if (!match) {
    return line;
  }

  const markers = match[2].trim().split(/\s+/u).filter((item) => /^#{1,6}$/u.test(item));
  if (markers.length < 2) {
    return line;
  }

  return `${match[1]}${markers[markers.length - 1]} ${match[3].trim()}`;
}

function isTableDivider(row: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(row.trim());
}

function parseMarkdownTable(lines: string[], start: number): { html: string; nextIndex: number } | null {
  const rows: string[] = [];
  let index = start;
  while (index < lines.length && /^\|.*\|\s*$/u.test(lines[index].trim())) {
    rows.push(lines[index].trim());
    index += 1;
  }

  if (rows.length < 2 || !isTableDivider(rows[1])) {
    return null;
  }

  const cellsFor = (row: string): string[] => {
    const trimmed = row.replace(/^\|/u, '').replace(/\|$/u, '');
    return trimmed.split('|').map((cell) => inlineHtml(cell.trim()));
  };
  const headers = cellsFor(rows[0]);
  const bodyRows = rows.slice(2).map(cellsFor);
  const html = `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody>${bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;

  return { html, nextIndex: index };
}

function nodeToMarkdown(node: ChildNode, listDepth = 0, index = 1): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.trim() ?? '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const tag = node.tagName.toLowerCase();

  if (tag === 'h1') {
    return `# ${inlineMarkdown(node)}`;
  }

  if (tag === 'h2') {
    return `## ${inlineMarkdown(node)}`;
  }

  if (tag === 'h3') {
    return `### ${inlineMarkdown(node)}`;
  }

  if (tag === 'h4') {
    return `#### ${inlineMarkdown(node)}`;
  }

  if (tag === 'h5') {
    return `##### ${inlineMarkdown(node)}`;
  }

  if (tag === 'h6') {
    return `###### ${inlineMarkdown(node)}`;
  }

  if (tag === 'p') {
    return inlineMarkdown(node);
  }

  if (node.dataset.pageBreak === 'true') {
    return '<div style="page-break-after: always;"></div>';
  }

  if (tag === 'hr') {
    return '---';
  }

  if (tag === 'blockquote') {
    return inlineMarkdown(node)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children)
      .map((child, childIndex) => nodeToMarkdown(child, listDepth + 1, childIndex + 1))
      .join('\n');
  }

  if (tag === 'li') {
    const bullet = node.parentElement?.tagName.toLowerCase() === 'ol' ? `${index}.` : '-';
    return `${'  '.repeat(Math.max(0, listDepth - 2))}${bullet} ${inlineMarkdown(node)}`;
  }

  return inlineMarkdown(node);
}

function inlineMarkdown(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
      }

      if (!(node instanceof HTMLElement)) {
        return '';
      }

      const text = inlineMarkdown(node);
      const tag = node.tagName.toLowerCase();

      if (tag === 'strong') {
        return `**${text}**`;
      }

      if (tag === 'em') {
        return `*${text}*`;
      }

      if (tag === 'u') {
        return `<u>${text}</u>`;
      }

      if (tag === 's') {
        return `~~${text}~~`;
      }

      if (tag === 'a') {
        const href = node.getAttribute('href') ?? '';
        return `[${text}](${href})`;
      }

      if (tag === 'img') {
        const alt = node.getAttribute('alt') ?? '';
        const src = node.getAttribute('src') ?? '';
        return `![${alt}](${src})`;
      }

      return text;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function inlineHtml(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, (_match, alt: string, src: string) => {
      const safeUrl = safeMarkdownUrl(src, 'image');
      return safeUrl ? `<img src="${escapeAttribute(safeUrl)}" alt="${escapeAttribute(alt)}">` : alt;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (_match, text: string, href: string) => {
      const safeUrl = safeMarkdownUrl(href, 'link');
      return safeUrl ? `<a href="${escapeAttribute(safeUrl)}">${text}</a>` : text;
    })
    .replace(/\*\*\*([^*]+)\*\*\*/gu, '<strong><em>$1</em></strong>')
    .replace(/___([^_]+)___/gu, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
    .replace(/__([^_]+)__/gu, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/gu, '<s>$1</s>')
    .replace(/(^|[^\*])\*([^*]+)\*/gu, '$1<em>$2</em>')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/gu, '$1<em>$2</em>')
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/giu, '<u>$1</u>');
}

function safeMarkdownUrl(url: string, kind: 'image' | 'link'): string {
  const raw = String(url || '').trim().replace(/[\u0000-\u001f\u007f\s]+/gu, '');
  if (!raw) {
    return '';
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || raw.startsWith('data:image/')) {
    return raw;
  }
  if (kind === 'link' && lower.startsWith('mailto:')) {
    return raw;
  }
  if (raw[0] === '#' || raw[0] === '/' || raw.startsWith('./') || raw.startsWith('../')) {
    return raw;
  }
  return '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

function escapeAttribute(value: string): string {
  return value.replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}
