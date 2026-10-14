import { parseDelimited, mergeFields, previewRecord, generateMerge } from './merge.mjs';
import { createMeasurer, layoutStories, designFindings } from './layout.mjs';
import { publicationPage } from './render.mjs';
export function setupMerge(api) {
  const $ = id => document.getElementById(id), { t, status } = api;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="mergeDialog"><form method="dialog"><div class="dialog-head"><h2 data-i18n="mailMerge">Mail merge</h2><button value="cancel" data-i18n-aria-label="close">×</button></div><p data-i18n="mergePrivacy">Choose a local CSV, TSV, or Excel workbook. Recipient data stays in this browser and is not saved with your template.</p><label><span data-i18n="dataSource">Data source</span><input id="mergeFile" type="file" accept=".csv,.tsv,.xlsx"></label><label id="sheetLabel" hidden><span data-i18n="worksheet">Worksheet</span><select id="mergeSheet"></select></label><div id="mergeMapping"></div><div class="property-grid"><label><span data-i18n="filterField">Filter column</span><select id="mergeFilterField"></select></label><label><span data-i18n="filterText">Contains</span><input id="mergeFilterText"></label><label><span data-i18n="firstRecord">First record</span><input id="mergeFirst" type="number" min="1" value="1"></label><label><span data-i18n="lastRecord">Last record</span><input id="mergeLast" type="number" min="1" value="1"></label></div><p id="mergeSummary" role="status"></p><div class="dialog-buttons"><button type="button" id="mergePreviewBtn" data-i18n="previewRecord">Preview record</button><button type="button" id="mergeCheckAll" data-i18n="checkRecords">Check every record</button><button type="button" id="mergeGenerate" class="primary" data-i18n="generateMerge">Generate publications</button></div><p id="mergeChecks" class="hint"></p><div id="mergePreview"></div><div class="dialog-actions"><button value="cancel" data-i18n="close">Close</button></div></form></dialog>`);
  let data = { fields: [], records: [] }, workbook, fields = [], busy = false;
  const measurer = createMeasurer();
  const mapping = () => Object.fromEntries([...$('mergeMapping').querySelectorAll('select')].map(el => [el.dataset.field, el.value]));
  const filtered = () => data.records.filter(record => !$('mergeFilterField').value || String(record[$('mergeFilterField').value] || '').toLocaleLowerCase().includes($('mergeFilterText').value.toLocaleLowerCase())).slice(Math.max(0, Number($('mergeFirst').value) - 1), Number($('mergeLast').value));
  function update() {
    fields = mergeFields(api.getDoc()); $('mergeMapping').replaceChildren();
    for (const field of fields) { const label = document.createElement('label'); label.textContent = `{{${field}}}`; const select = document.createElement('select'); select.dataset.field = field; select.add(new Option(t('unmapped'), '')); data.fields.forEach(column => select.add(new Option(column, column))); select.value = data.fields.find(column => column.toLowerCase() === field.toLowerCase()) || ''; label.append(select); $('mergeMapping').append(label); }
    $('mergeFilterField').replaceChildren(new Option(t('allRecords'), '')); data.fields.forEach(field => $('mergeFilterField').add(new Option(field, field)));
    $('mergeFirst').value = 1; $('mergeLast').value = data.records.length || 1; $('mergeSummary').textContent = t('recordCount', { count: data.records.length, fields: fields.length }); $('mergeChecks').textContent = ''; $('mergePreview').replaceChildren(); WidgetI18n.refresh();
  }
  function selectSheet() {
    const sheet = workbook.getWorksheet(Number($('mergeSheet').value)), rows = [];
    sheet.eachRow({ includeEmpty: false }, row => {
      const cells = [];
      for (let i = 1; i <= sheet.columnCount; i++) { const cell = row.getCell(i), value = cell.value; let text = cell.text;
        if (value instanceof Date) text = value.toISOString().slice(0, 10);
        if (typeof value === 'number' && /^0+$/.test(cell.numFmt || '')) text = String(value).padStart(cell.numFmt.length, '0');
        if (value && typeof value === 'object' && 'formula' in value) text = String(value.result ?? '');
        cells.push(String(text || ''));
      }
      rows.push(cells);
    });
    const csv = rows.map(row => row.map(value => '"' + value.replaceAll('"', '""') + '"').join(',')).join('\n'); data = parseDelimited(csv); update();
  }
  $('mergeFile').onchange = async () => {
    const file = $('mergeFile').files[0]; if (!file) return;
    if (file.size > 20000000) return status('mergeDataError');
    try {
      if (/\.xlsx$/i.test(file.name)) {
        if (!window.ExcelJS) await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = 'vendor/exceljs.min.js'; script.onload = resolve; script.onerror = reject; document.head.append(script); });
        workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); $('mergeSheet').replaceChildren(); workbook.worksheets.forEach(sheet => $('mergeSheet').add(new Option(sheet.name, sheet.id))); if (!workbook.worksheets.length) throw Error('No worksheets.'); $('sheetLabel').hidden = false; selectSheet();
      } else { workbook = null; $('sheetLabel').hidden = true; data = parseDelimited(await file.text(), /\.tsv$/i.test(file.name) ? '\t' : ','); update(); }
    } catch (error) { console.warn(error.message); status('mergeDataError'); $('mergeSummary').textContent = t('mergeDataError'); }
  };
  $('mergeSheet').onchange = selectSheet;
  $('mergePreviewBtn').onclick = () => {
    const records = filtered(); if (!records.length) return status('mergeDataError');
    const preview = previewRecord(api.getDoc(), records[0], mapping()), layout = layoutStories(preview, measurer); const scale = Math.min(1, 500 / (preview.width * 96 / 72));
    $('mergePreview').replaceChildren(); const holder = document.createElement('div'); holder.style.width = `${preview.width * 96 / 72 * scale}px`; holder.style.height = `${preview.height * 96 / 72 * scale}px`; holder.style.position = 'relative'; const page = publicationPage(preview, preview.pages[0], layout); page.style.transform = `scale(${scale})`; page.style.transformOrigin = 'top left'; holder.append(page); $('mergePreview').append(holder);
  };
  $('mergeCheckAll').onclick = async () => {
    if (busy) return; const records = filtered(); if (!records.length) return status('mergeDataError'); busy = true; $('mergeCheckAll').disabled = true;
    try { let problems = 0; const failures = [];
      for (let i = 0; i < records.length; i++) { const copy = previewRecord(api.getDoc(), records[i], mapping()), issues = designFindings(copy, layoutStories(copy, measurer)); if (issues.some(issue => issue.severity === 'error' || issue.key === 'mergeUnresolved')) { problems++; if (failures.length < 30) failures.push(i + Number($('mergeFirst').value)); } if (i % 10 === 0) { $('mergeChecks').textContent = t('checkingRecords', { count: i + 1, total: records.length }); await new Promise(resolve => setTimeout(resolve, 0)); } }
      $('mergeChecks').textContent = t('mergeCheckResult', { count: problems, total: records.length }) + (failures.length ? ` ${failures.join(', ')}` : '');
    } finally { busy = false; $('mergeCheckAll').disabled = false; }
  };
  $('mergeGenerate').onclick = async () => {
    if (busy) return;
    try { const result = generateMerge(api.getDoc(), filtered(), mapping()); if (confirm(t('mergeReplace'))) { await api.replaceDoc(result); $('mergeDialog').close(); status('mergeGenerated'); } } catch (error) { console.warn(error.message); $('mergeChecks').textContent = t('mergeLimit'); }
  };
  $('mergeDialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('mergeDialog').addEventListener('close', () => { $('mergePreview').replaceChildren(); });
  return { open() { update(); $('mergeDialog').showModal(); } };
}
