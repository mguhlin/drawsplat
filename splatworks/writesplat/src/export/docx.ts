import {
  AlignmentType,
  Document,
  HeadingLevel,
  HighlightColor,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
} from 'docx';

export async function htmlToDocxBlob(title: string, html: string): Promise<Blob> {
  const host = document.createElement('div');
  host.innerHTML = html;
  const children = Array.from(host.childNodes).flatMap(nodeToDocx);

  const doc = new Document({
    creator: 'WriteSplatTM',
    title,
    sections: [
      {
        children: children.length > 0 ? children : [new Paragraph('')],
      },
    ],
  });

  return Packer.toBlob(doc);
}

function nodeToDocx(node: ChildNode): Array<Paragraph | Table> {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? [new Paragraph({ children: [new TextRun(text)] })] : [];
  }

  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const tag = node.tagName.toLowerCase();

  if (tag === 'h1') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_1, children: inlineRuns(node) })];
  }

  if (tag === 'h2') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_2, children: inlineRuns(node) })];
  }

  if (tag === 'h3') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_3, children: inlineRuns(node) })];
  }

  if (tag === 'h4') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_4, children: inlineRuns(node) })];
  }

  if (tag === 'h5') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_5, children: inlineRuns(node) })];
  }

  if (tag === 'h6') {
    return [new Paragraph({ alignment: docxAlignment(node), heading: HeadingLevel.HEADING_6, children: inlineRuns(node) })];
  }

  if (tag === 'hr') {
    return [new Paragraph({ children: [new TextRun('---')] })];
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children).map(
      (child, index) =>
        new Paragraph({
          bullet: tag === 'ul' ? { level: 0 } : undefined,
          numbering: tag === 'ol' ? { reference: 'writesplat-numbering', level: 0, instance: index } : undefined,
          children: inlineRuns(child as HTMLElement),
        }),
    );
  }

  if (tag === 'table') {
    return [tableToDocx(node)];
  }

  if (tag === 'img') {
    return [new Paragraph({ children: [new TextRun(`[Image: ${node.getAttribute('alt') || 'embedded image'}]`)] })];
  }

  return [new Paragraph({ alignment: docxAlignment(node), children: inlineRuns(node) })];
}

function tableToDocx(table: HTMLElement): Table {
  return new Table({
    rows: Array.from(table.querySelectorAll('tr')).map(
      (row) =>
        new TableRow({
          children: Array.from(row.children).map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ children: inlineRuns(cell as HTMLElement) })],
              }),
          ),
        }),
    ),
  });
}

function inlineRuns(element: HTMLElement): TextRun[] {
  const runs = Array.from(element.childNodes).flatMap((node) => inlineNodeRuns(node));
  return runs.length > 0 ? runs : [new TextRun('')];
}

function inlineNodeRuns(node: ChildNode, marks: Partial<TextRunOptions> = {}): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [new TextRun({ text: node.textContent ?? '', ...marks })];
  }

  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const tag = node.tagName.toLowerCase();
  const nextMarks = { ...marks };

  if (tag === 'strong') {
    nextMarks.bold = true;
  }

  if (tag === 'em') {
    nextMarks.italics = true;
  }

  if (tag === 'u') {
    nextMarks.underline = { type: UnderlineType.SINGLE };
  }

  if (tag === 's') {
    nextMarks.strike = true;
  }

  if (tag === 'span') {
    const backgroundColor = normalizeCssColor(node.style.backgroundColor);
    const color = normalizeCssColor(node.style.color);
    const fontFamily = normalizeFontFamily(node.style.fontFamily);
    const fontSize = cssPxToHalfPoints(node.style.fontSize);

    if (backgroundColor) {
      nextMarks.highlight = docxHighlightColor(backgroundColor);
    }

    if (color) {
      nextMarks.color = color.replace('#', '');
    }

    if (fontFamily) {
      nextMarks.font = fontFamily;
    }

    if (fontSize) {
      nextMarks.size = fontSize;
    }
  }

  if (tag === 'br') {
    return [new TextRun({ text: '', break: 1 })];
  }

  return Array.from(node.childNodes).flatMap((child) => inlineNodeRuns(child, nextMarks));
}

interface TextRunOptions {
  bold?: boolean;
  color?: string;
  font?: string;
  highlight?: (typeof HighlightColor)[keyof typeof HighlightColor];
  italics?: boolean;
  size?: number;
  underline?: { type: typeof UnderlineType.SINGLE };
  strike?: boolean;
}

function docxAlignment(element: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  const alignments: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
    center: AlignmentType.CENTER,
    justify: AlignmentType.JUSTIFIED,
    left: AlignmentType.LEFT,
    right: AlignmentType.RIGHT,
  };
  return alignments[element.style.textAlign];
}

function docxHighlightColor(value: string): (typeof HighlightColor)[keyof typeof HighlightColor] {
  const colors: Record<string, (typeof HighlightColor)[keyof typeof HighlightColor]> = {
    '#dbeafe': HighlightColor.BLUE,
    '#dcfce7': HighlightColor.GREEN,
    '#fee2e2': HighlightColor.RED,
    '#fef3c7': HighlightColor.YELLOW,
  };
  return colors[value.toLowerCase()] ?? HighlightColor.YELLOW;
}

function normalizeCssColor(value: string): string {
  if (!value) {
    return '';
  }

  const host = document.createElement('span');
  host.style.color = value;
  document.body.appendChild(host);
  const rgb = getComputedStyle(host).color;
  host.remove();
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/u);

  if (!match) {
    return value;
  }

  return `#${[match[1], match[2], match[3]]
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function normalizeFontFamily(value: string): string {
  return value
    .split(',')[0]
    ?.replace(/["']/g, '')
    .trim();
}

function cssPxToHalfPoints(value: string): number | undefined {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/u);

  if (!match) {
    return undefined;
  }

  return Math.round(Number(match[1]) * 1.5);
}
