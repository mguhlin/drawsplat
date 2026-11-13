import { TABLE_EXAMPLES, parseTable, tableToLatex, tableToMatrix, equationFromTex, latexDocument, equationMarkdown, equationHtml } from './converters.js';

export function bindConverters({ getResult, setEquation, status, save }) {
  const $ = id => document.getElementById(id);
  let rows = null, tableTex = '', importSequence = 0;
  const tableActions = ['copyTableLatex', 'downloadTableLatex', 'insertTableMatrix'];
  function refreshTable() {
    rows = null; tableTex = '';
    tableActions.forEach(id => { $(id).disabled = true; });
    $('latexTablePreview').replaceChildren();
    $('tableLatexSource').value = '';
    try {
      rows = parseTable($('latexTableInput').value, $('latexTableFormat').value);
      tableTex = tableToLatex(rows, $('latexTableHeader').checked);
      $('tableLatexSource').value = tableTex;
      const table = document.createElement('table');
      const caption = table.createCaption(); caption.textContent = 'Converted table preview';
      rows.forEach((row, index) => {
        const tr = table.insertRow();
        row.forEach(cell => {
          const td = document.createElement(index === 0 && $('latexTableHeader').checked ? 'th' : 'td');
          if (td.localName === 'th') td.scope = 'col';
          td.textContent = cell; tr.append(td);
        });
      });
      $('latexTablePreview').append(table);
      tableActions.forEach(id => { $(id).disabled = false; });
      $('tableConversionStatus').textContent = `${rows.length} rows, ${rows[0].length} columns. Review every value before sharing.`;
    } catch (error) { $('tableConversionStatus').textContent = error.message; }
  }
  ['latexTableInput', 'latexTableFormat', 'latexTableHeader'].forEach(id => $(id).addEventListener('input', refreshTable));
  $('latexTableExample').onchange = () => {
    const key = $('latexTableExample').value;
    if (!(key in TABLE_EXAMPLES)) return;
    $('latexTableInput').value = TABLE_EXAMPLES[key];
    $('latexTableFormat').value = 'auto';
    $('latexTableHeader').checked = key !== 'matrix';
    refreshTable();
  };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); status('LaTeX table copied.'); }
    catch { status('Clipboard unavailable. Select the table source or download the LaTeX file.'); }
  }
  $('copyTableLatex').onclick = () => { if (rows) copy(tableTex); };
  $('downloadTableLatex').onclick = () => { if (rows) save(latexDocument(tableTex, 'Data table', '', true), 'tex', 'text/plain'); };
  $('insertTableMatrix').onclick = () => {
    try { if (rows) setEquation(tableToMatrix(rows)); }
    catch (error) { status(error.message); }
  };
  $('importEquationTex').onclick = () => $('equationTexFile').click();
  $('equationTexFile').onchange = async () => {
    const sequence = ++importSequence;
    const file = $('equationTexFile').files[0];
    $('equationTexFile').value = '';
    if (!file) return;
    // A late file read must not replace an equation edited or imported meanwhile.
    const before = $('equationTex').value;
    try {
      if (file.size > 200000) throw Error('Use a LaTeX file smaller than 200 KB.');
      const source = equationFromTex(await file.text());
      if (sequence !== importSequence) return;
      if ($('mode').value !== 'equation' || $('equationTex').value !== before) {
        status('The workspace changed while reading. Import the file again to replace the current equation.'); return;
      }
      // Validate before replacing the working equation.
      const { typesetEquation } = await import('./vendor/equation-engine.mjs');
      typesetEquation(source);
      if (sequence !== importSequence || $('mode').value !== 'equation' || $('equationTex').value !== before) return;
      setEquation(source);
    } catch (error) { if (sequence === importSequence) status(`LaTeX import: ${error.message}`); }
  };
  const exports = {
    downloadLatexDocument: ['tex', 'text/plain', r => latexDocument(r.tex, $('title').value, $('equationReading').value)],
    downloadEquationMarkdown: ['md', 'text/markdown', r => equationMarkdown(r.tex, $('title').value, $('equationReading').value)],
    downloadEquationHtml: ['html', 'text/html', r => equationHtml(r, $('title').value, $('equationReading').value)],
  };
  for (const [id, [extension, type, content]] of Object.entries(exports)) $(id).onclick = () => {
    const result = getResult(); if (result) save(content(result), extension, type);
  };
  return refreshTable;
}
