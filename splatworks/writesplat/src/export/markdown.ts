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
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let code: string[] | null = null;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push(`<p>${inlineHtml(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  }

  function flushList(): void {
    if (list) {
      const tag = list.ordered ? 'ol' : 'ul';
      blocks.push(`<${tag}>${list.items.map((item) => `<li>${inlineHtml(item)}</li>`).join('')}</${tag}>`);
      list = null;
    }
  }

  function flushQuote(): void {
    if (quote.length > 0) {
      blocks.push(`<blockquote><p>${inlineHtml(quote.join(' '))}</p></blockquote>`);
      quote = [];
    }
  }

  function flushCode(): void {
    if (code) {
      blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      code = null;
    }
  }

  lines.forEach((line) => {
    if (code) {
      if (/^```/.test(line)) {
        flushCode();
      } else {
        code.push(line);
      }
      return;
    }

    if (/^```/.test(line)) {
      flushParagraph();
      flushList();
      flushQuote();
      code = [];
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      return;
    }

    const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineHtml(heading[2])}</h${level}>`);
      return;
    }

    if (/^(-{3,}|\*{3,})\s*$/u.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push('<hr>');
      return;
    }

    if (/^<div style="page-break-after: always;"><\/div>$/iu.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push('<div class="page-break" data-page-break="true"></div>');
      return;
    }

    const quoteMatch = /^>\s?(.*)$/u.exec(line);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      return;
    }

    const orderedMatch = /^\s*\d+\.\s+(.+)$/u.exec(line);
    const unorderedMatch = /^\s*[-*]\s+(.+)$/u.exec(line);
    if (orderedMatch || unorderedMatch) {
      flushParagraph();
      flushQuote();
      const ordered = Boolean(orderedMatch);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((orderedMatch ?? unorderedMatch)?.[1] ?? '');
      return;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushQuote();
  flushCode();

  return blocks.join('\n');
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, (_match, alt: string, src: string) => {
      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (_match, text: string, href: string) => {
      return `<a href="${escapeAttribute(href)}">${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/gu, '<s>$1</s>')
    .replace(/(^|[^\*])\*([^*]+)\*/gu, '$1<em>$2</em>')
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/giu, '<u>$1</u>');
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
