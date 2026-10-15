import { xml, number } from './presentation-model.mjs';
const pt = value => `${number(value)}pt`;
const attrs = values => Object.entries(values).map(([key, value]) => ` ${key}="${xml(value)}"`).join('');
// ODF requires integer viewBox coordinates. Scale the path too, preserving arc
// angles/flags while scaling radii and endpoints like other SVG coordinates.
export function odfPath(path, viewBox) {
  const tokens = path.match(/[a-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/gi) || [], out = [];
  const sizes = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 };
  let at = 0, command;
  while (at < tokens.length) {
    if (/^[a-z]$/i.test(tokens[at])) command = tokens[at++];
    if (!command) return null;
    const code = command.toUpperCase();
    if (code === 'Z') { out.push(command); command = null; continue; }
    const count = sizes[code]; if (!count || at + count > tokens.length) return null;
    const values = tokens.slice(at, at + count).map(Number); if (values.some(n => !Number.isFinite(n))) return null; at += count;
    out.push(command + values.map((v, i) => code === 'A' && [2, 3, 4].includes(i) ? v : Math.round(v * 1000)).join(' '));
    if (code === 'M') command = command === 'm' ? 'l' : 'L';
  }
  const box = viewBox.map(v => Math.round(v * 1000));
  return box[2] > 0 && box[3] > 0 ? { path: out.join(' '), viewBox: box.join(' ') } : null;
}
export class OdpObjects {
  constructor(warn) { this.warn = warn; this.styles = []; this.definitions = []; this.fonts = new Set(); this.cache = new Map(); }
  style(family, properties, children = '') {
    const body = `<style:${family === 'paragraph' ? 'paragraph' : family === 'text' ? 'text' : family === 'table-cell' ? 'table-cell' : family === 'table-row' ? 'table-row' : family === 'table-column' ? 'table-column' : 'graphic'}-properties${attrs(properties)}/>${children}`;
    const key = family + body; if (this.cache.has(key)) return this.cache.get(key);
    const id = `Native${this.styles.length + 1}`; this.styles.push(`<style:style style:name="${id}" style:family="${family}">${body}</style:style>`); this.cache.set(key, id); return id;
  }
  textProperties(style) {
    this.fonts.add(style.font);
    return { 'fo:font-family': style.font, 'style:font-family-asian': style.font, 'style:font-family-complex': style.font, 'fo:font-size': pt(style.size), 'style:font-size-asian': pt(style.size), 'style:font-size-complex': pt(style.size), 'fo:font-weight': style.bold ? 'bold' : 'normal', 'style:font-weight-asian': style.bold ? 'bold' : 'normal', 'style:font-weight-complex': style.bold ? 'bold' : 'normal', 'fo:font-style': style.italic ? 'italic' : 'normal', 'style:font-style-asian': style.italic ? 'italic' : 'normal', 'style:font-style-complex': style.italic ? 'italic' : 'normal', 'style:text-underline-style': style.underline ? 'solid' : 'none', 'style:text-underline-width': 'auto', 'style:text-underline-color': 'font-color', 'fo:color': style.color, 'fo:letter-spacing': pt(style.tracking || 0) };
  }
  paragraphs(paragraphs) {
    // Explicit space/tab elements keep repeated spaces, leading/trailing spaces,
    // blank paragraphs and tabs editable rather than XML whitespace collapsing.
    const text = value => value.split(/( +|\t|\n)/).map(part => /^ +$/.test(part) ? `<text:s text:c="${part.length}"/>` : part === '\t' ? '<text:tab/>' : part === '\n' ? '<text:line-break/>' : xml(part)).join('');
    return paragraphs.map(p => {
      const style = this.style('paragraph', { 'fo:text-align': p.align === 'justify' ? 'justify' : p.align || 'left', 'style:writing-mode': p.direction === 'rtl' ? 'rl-tb' : 'lr-tb', 'fo:line-height': p.lineMultiple ? `${number(p.lineMultiple * 100)}%` : pt(p.leading || p.style.size * 1.45), 'fo:margin-top': pt(p.spaceBefore || 0), 'fo:margin-bottom': pt(p.spaceAfter || 0), 'fo:margin-left': pt(p.indentLeft || 0), 'fo:margin-right': pt(p.indentRight || 0), 'fo:text-indent': pt(p.firstLineIndent || 0) }, `<style:text-properties${attrs(this.textProperties(p.style))}/>`);
      return `<text:p text:style-name="${style}">${p.runs.map(run => {
        // Impress imports hyperlink field text inside a styled span; nested
        // spans inside text:a are dropped by its field importer.
        const content = run.style.link ? `<text:a xlink:type="simple" xlink:href="${xml(run.style.link)}">${text(run.text)}</text:a>` : text(run.text);
        return `<text:span text:style-name="${this.style('text', this.textProperties(run.style))}">${content}</text:span>`;
      }).join('')}</text:p>`;
    }).join('');
  }
  geometry(o) {
    const size = ` svg:width="${pt(o.w)}" svg:height="${pt(o.h)}"`;
    if (!o.rotation) return ` svg:x="${pt(o.x)}" svg:y="${pt(o.y)}"${size}`;
    const a = o.rotation * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = o.x + o.w / 2 - c * o.w / 2 + s * o.h / 2, y = o.y + o.h / 2 - s * o.w / 2 - c * o.h / 2;
    return `${size} draw:transform="matrix(${number(c)} ${number(s)} ${number(-s)} ${number(c)} ${pt(x)} ${pt(y)})"`;
  }
  object(o, id, path) {
    const base = { 'draw:stroke': 'none', 'draw:fill': 'none', 'draw:opacity': `${number(o.opacity * 100)}%`, 'fo:padding': '0pt', 'draw:auto-grow-height': 'false', 'draw:auto-grow-width': 'false', 'draw:textarea-vertical-align': 'top' };
    const frame = (style, content) => `<draw:frame draw:name="${xml(o.name)}" draw:style-name="${style}"${this.geometry(o)}>${content}</draw:frame>`;
    if (o.type === 'text') {
      if (o.opacity !== 1) this.warn('ODP text transparency may vary by application; text remains editable.');
      return frame(this.style('graphic', base), `<draw:text-box>${this.paragraphs(o.paragraphs)}</draw:text-box>`);
    }
    if (o.type === 'image') {
      const crop = o.crop, { width, height } = o.asset;
      // ODF crop values are physical distances in the unscaled source image.
      if (crop) base['fo:clip'] = `rect(${pt(crop.t * height * .75)}, ${pt(crop.r * width * .75)}, ${pt(crop.b * height * .75)}, ${pt(crop.l * width * .75)})`;
      return frame(this.style('graphic', base), `<draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title>${xml(o.asset.alt || o.asset.name)}</svg:title>`);
    }
    if (o.type === 'table') {
      const column = this.style('table-column', { 'style:column-width': pt(o.w / o.cells[0].length) });
      const rowStyle = this.style('table-row', { 'style:row-height': pt(o.h / o.cells.length) });
      const rows = o.cells.map((row, index) => `<table:table-row table:style-name="${rowStyle}">${row.map(value => {
        const heading = o.header && index === 0, style = { font: 'Liberation Sans', size: o.fontSize, color: heading ? '#34205c' : '#25304b', bold: heading };
        const cell = this.style('table-cell', { 'fo:padding': '6pt', 'fo:border': '.75pt solid #b9b1cd', 'fo:background-color': heading ? '#ede7fb' : '#ffffff', 'style:vertical-align': 'top' });
        return `<table:table-cell table:style-name="${cell}" office:value-type="string">${this.paragraphs(value.split('\n').map(text => ({ runs: [{ text, style }], style, direction: o.direction || 'ltr', lineMultiple: 1.4 })))}</table:table-cell>`;
      }).join('')}</table:table-row>`).join('');
      return frame(this.style('graphic', base), `<table:table table:name="Table${id}">${o.cells[0].map(() => `<table:table-column table:style-name="${column}"/>`).join('')}${rows}</table:table>`);
    }
    const lineWidth = o.kind === 'line' ? Math.max(1, o.strokeWidth) : o.strokeWidth;
    Object.assign(base, { 'draw:fill': o.noFill || o.kind === 'line' ? 'none' : 'solid', 'draw:fill-color': o.fill, 'draw:stroke': lineWidth ? 'solid' : 'none', 'svg:stroke-color': o.stroke, 'svg:stroke-width': pt(lineWidth), 'svg:stroke-opacity': `${number(o.opacity * 100)}%` });
    if (o.strokeDash) {
      const name = `Dash${id}`; this.definitions.push(`<draw:stroke-dash draw:name="${name}" draw:style="rect" draw:dots1="1" draw:dots1-length="4pt" draw:distance="3pt"/>`); base['draw:stroke'] = 'dash'; base['draw:stroke-dash'] = name;
      this.warn('Custom dash patterns use the office application’s native dashed stroke.');
    }
    if (o.gradient && !o.noFill) {
      const g = o.gradient, first = g.stops[0], last = g.stops.at(-1), name = `Gradient${id}`;
      if (g.stops.length !== 2 || first.offset !== 0 || last.offset !== 1 || first.opacity !== 1 || last.opacity !== 1) return null;
      this.definitions.push(`<draw:gradient draw:name="${name}" draw:style="${g.type === 'radial' ? 'radial' : 'linear'}" draw:start-color="${first.color}" draw:end-color="${last.color}" draw:start-intensity="100%" draw:end-intensity="100%" draw:angle="${number((90 - g.angle) * 10)}" draw:cx="50%" draw:cy="50%" draw:border="0%"/>`);
      base['draw:fill'] = 'gradient'; base['draw:fill-gradient-name'] = name;
    }
    const style = this.style('graphic', base), common = ` draw:name="${xml(o.name)}" draw:style-name="${style}"`;
    if (o.path) {
      const path = odfPath(o.path, o.pathViewBox); if (!path) return null;
      return `<draw:path${common}${this.geometry(o)} svg:viewBox="${path.viewBox}" svg:d="${xml(path.path)}"/>`;
    }
    if (o.kind === 'line') {
      const angle = o.rotation * Math.PI / 180, cx = o.x + o.w / 2, cy = o.y + o.h / 2, dx = Math.cos(angle) * o.w / 2, dy = Math.sin(angle) * o.w / 2;
      return `<draw:line${common} svg:x1="${pt(cx - dx)}" svg:y1="${pt(cy - dy)}" svg:x2="${pt(cx + dx)}" svg:y2="${pt(cy + dy)}"/>`;
    }
    return `<draw:${o.kind === 'ellipse' ? 'ellipse' : 'rect'}${common}${this.geometry(o)}/>`;
  }
  fontDeclarations() { return [...this.fonts].map(font => `<style:font-face style:name="${xml(font)}" svg:font-family="${xml(font)}"/>`).join(''); }
}
