// Local, bounded conversions. Imported text is data, never executable markup.
export const TABLE_EXAMPLES = {
  measurements: 'Trial,Distance (cm),Time (s)\n1,12.5,2\n2,25,4\n3,37.5,6',
  probability: 'Outcome\tCount\tProbability\nHeads\t12\t0.6\nTails\t8\t0.4',
  matrix: '1,2\n3,4',
};
export const escapeTex = (value) => String(value).replace(/[\\{}$&#%_^~]/g, c => ({
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&',
  '#': '\\#', '%': '\\%', '_': '\\_', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}',
})[c]);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

export function parseTable(source, format = 'auto') {
  const text = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
  if (!text.trim()) throw Error('Paste a table or choose an example.');
  if (text.length > 20000) throw Error('Keep table input under 20,000 characters.');
  const delimiter = format === 'tsv' || (format === 'auto' && text.includes('\t')) ? '\t' : ',';
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  const pushCell = () => { row.push(cell); cell = ''; closed = false; };
  const pushRow = () => { pushCell(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === delimiter) pushCell();
    else if (c === '\n') pushRow();
    else if (c === '"' && !cell && !closed) quoted = true;
    else if (closed || c === '"') throw Error('Check the quotation marks in your table.');
    else cell += c;
  }
  if (quoted) throw Error('Close the quoted cell before converting.');
  if (cell || row.length || closed) pushRow();
  if (!rows.length) throw Error('Enter at least one table cell.');
  const width = rows[0].length;
  if (rows.length > 100 || width > 12) throw Error('Use at most 100 rows and 12 columns.');
  if (rows.some(r => r.length !== width)) throw Error('Every row needs the same number of cells. Check the delimiter or quote cells containing commas.');
  return rows;
}

export function tableToLatex(rows, header = true) {
  const cell = value => value.includes('\n') ? `\\shortstack[l]{${value.split('\n').map(escapeTex).join('\\\\')}}` : escapeTex(value);
  const lines = rows.map((row, i) => row.map(value => header && i === 0 ? `\\textbf{${cell(value)}}` : cell(value)).join(' & ') + String.raw` \\`);
  if (header) lines.splice(1, 0, String.raw`\midrule`);
  return `\\begin{tabular}{${'l'.repeat(rows[0].length)}}\n\\toprule\n${lines.join('\n')}\n\\bottomrule\n\\end{tabular}`;
}

export function tableToMatrix(rows) {
  if (rows.some(row => row.some(c => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(c.trim()))))
    throw Error('Matrix insertion requires numeric cells only. Remove header rows or use the numeric matrix example.');
  const tex = `\\begin{pmatrix}${rows.map(r => r.map(c => c.trim()).join('&')).join('\\\\')}\\end{pmatrix}`;
  if (tex.length > 2000) throw Error('This matrix exceeds the equation limit of 2,000 characters.');
  return tex;
}

export function equationFromTex(source) {
  let text = String(source).replace(/^\uFEFF/, '').trim();
  if (text.length > 50000) throw Error('Use a LaTeX file smaller than 50,000 characters.');
  // Remove TeX comments; an escaped percent remains literal.
  text = text.split('\n').map(line => {
    for (let i = 0; i < line.length; i++) if (line[i] === '%') {
      let slashes = 0; for (let j = i - 1; j >= 0 && line[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) return line.slice(0, i);
    }
    return line;
  }).join('\n').trim();
  if (/\\(?:documentclass|begin\{document\})/.test(text)) {
    const body = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (!body) throw Error('The LaTeX document needs a complete document environment.');
    // Accept a single display equation, with optional surrounding prose.
    const equations = [...body[1].matchAll(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\begin\{(equation\*?|align\*?)\}([\s\S]*?)\\end\{\3\}/g)];
    if (equations.length !== 1) throw Error('Import one display equation at a time. Copy the desired equation into LaTeX equation.');
    const match = equations[0];
    text = match[1] ?? match[2] ?? (match[3].startsWith('align') ? `\\begin{aligned}${match[4]}\\end{aligned}` : match[4]);
  }
  text = text.trim();
  if (!text || text.length > 2000) throw Error('Import an equation with 1–2,000 characters.');
  return text;
}

export function latexDocument(body, title, description = '', table = false) {
  return `\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\usepackage{amsmath,amssymb${table ? ',booktabs' : ''}}\n\\begin{document}\n\\section*{${escapeTex(title || 'Equation')}}\n${escapeTex(description)}\n\n${table ? body : `\\[\n${body}\n\\]`}\n\\end{document}\n`;
}
export function equationMarkdown(tex, title, description) {
  const plain = value => String(value || '').replace(/[\\`*_{}\[\]<>#!|$]/g, '\\$&').replace(/[\r\n]+/g, ' ');
  return `# ${plain(title || 'Equation')}\n\n${plain(description)}\n\n$$\n${tex}\n$$\n`;
}
export function equationHtml(result, title, description) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title || 'Equation')}</title><style>body{font-family:system-ui;max-width:60rem;margin:2rem auto;padding:1rem}svg{width:100%;height:auto}math{font-size:1.5rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>${escapeHtml(title || 'Equation')}</h1><p>${escapeHtml(description || '')}</p>${result.svg}<details><summary>Structured math</summary>${result.mathml}</details><details><summary>LaTeX source</summary><pre>${escapeHtml(result.tex)}</pre></details></html>`;
}
