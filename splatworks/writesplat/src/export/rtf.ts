export function htmlToRtf(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  const body = Array.from(host.childNodes).map(nodeToRtf).join('\\par\n');
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\n${body}\n}`;
}

function nodeToRtf(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeRtf(node.textContent ?? '');
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const content = inlineRtf(node);

  if (tag === 'h1') {
    return `\\fs40\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'h2') {
    return `\\fs32\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'h3') {
    return `\\fs28\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'h4') {
    return `\\fs24\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'h5') {
    return `\\fs22\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'h6') {
    return `\\fs20\\b ${content}\\b0\\fs24`;
  }

  if (tag === 'hr') {
    return '\\emdash\\emdash\\emdash';
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children)
      .map((child, index) => {
        const bullet = tag === 'ol' ? `${index + 1}.` : '\\bullet';
        return `${bullet} ${inlineRtf(child as HTMLElement)}`;
      })
      .join('\\par\n');
  }

  if (tag === 'blockquote') {
    return `\\li360 ${content}\\li0`;
  }

  if (tag === 'table') {
    return Array.from(node.querySelectorAll('tr'))
      .map((row) => Array.from(row.children).map((cell) => inlineRtf(cell as HTMLElement)).join(' | '))
      .join('\\par\n');
  }

  if (tag === 'img') {
    return `[Image: ${escapeRtf(node.getAttribute('alt') || 'embedded image')}]`;
  }

  return content;
}

function inlineRtf(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeRtf(node.textContent ?? '');
      }

      if (!(node instanceof HTMLElement)) {
        return '';
      }

      const tag = node.tagName.toLowerCase();
      const content = inlineRtf(node);

      if (tag === 'strong') {
        return `\\b ${content}\\b0`;
      }

      if (tag === 'em') {
        return `\\i ${content}\\i0`;
      }

      if (tag === 'u') {
        return `\\ul ${content}\\ul0`;
      }

      if (tag === 's') {
        return `\\strike ${content}\\strike0`;
      }

      if (tag === 'br') {
        return '\\line ';
      }

      return content;
    })
    .join('');
}

function escapeRtf(value: string): string {
  return value.replace(/[\\{}]/g, (char) => `\\${char}`).replace(/\n/g, '\\line ');
}
