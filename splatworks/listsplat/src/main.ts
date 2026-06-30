import { tableFromCsv, tableToCsv } from './io/csv';
import { downloadFile, loadAutosave, saveAutosave } from './io/storage';
import {
  addField,
  addRecord,
  addTable,
  assertListSplatFile,
  createRecord,
  createStarterProject,
  deleteRecord,
  duplicateRecord,
  replaceTable,
  updateCell,
  updateField,
} from './model/database';
import { evaluateSimpleFormula, summarizeTable } from './model/formulas';
import { previewReplaceValues, findDuplicateRecords, findMissingRecords, findRecords, replaceValues, sortRecords } from './model/query';
import { addRelationship, createRelationship, relatedRecords, relationshipLabel } from './model/relationships';
import type { FieldType, ListSplatCellValue, ListSplatField, ListSplatFile, ListSplatRecord, ListSplatTable } from './model/types';
import { cloneTemplateTable, listSplatTemplates } from './templates/templates';
import './styles/global.css';

type ViewMode = 'table' | 'form' | 'cards' | 'gallery' | 'labels' | 'report';
type DialogName = 'none' | 'replace' | 'field' | 'help' | 'projectIdeas' | 'relationship' | 'csvImport' | 'layout';
type LanguageCode = 'en' | 'es' | 'vi' | 'ar' | 'zh' | 'uh';

const LANGUAGE_KEY = 'drawsplat.language';
const languages: Array<{ code: LanguageCode; label: string; dir: 'ltr' | 'rtl'; htmlLang: string }> = [
  { code: 'en', label: 'English', dir: 'ltr', htmlLang: 'en' },
  { code: 'es', label: 'Español', dir: 'ltr', htmlLang: 'es' },
  { code: 'vi', label: 'Tiếng Việt', dir: 'ltr', htmlLang: 'vi' },
  { code: 'ar', label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
  { code: 'zh', label: '中文', dir: 'ltr', htmlLang: 'zh' },
  { code: 'uh', label: 'हिन्दी / اردو', dir: 'ltr', htmlLang: 'hi' },
];

const translations: Record<Exclude<LanguageCode, 'en'>, Record<string, string>> = {
  es: {
    New: 'Nuevo',
    'Save JSON': 'Guardar JSON',
    'Open JSON': 'Abrir JSON',
    'Export CSV': 'Exportar CSV',
    File: 'Archivo',
    Edit: 'Editar',
    Data: 'Datos',
    Layout: 'Diseño',
    Tools: 'Herramientas',
    View: 'Vista',
    Teacher: 'Docente',
    Help: 'Ayuda',
    Title: 'Título',
    Search: 'Buscar',
    In: 'En',
    'All fields': 'Todos los campos',
    Sort: 'Ordenar',
    'Choose field': 'Elegir campo',
    'New field': 'Campo nuevo',
    'Field name': 'Nombre del campo',
    Type: 'Tipo',
    'Add field': 'Agregar campo',
    'Add record': 'Agregar registro',
    Table: 'Tabla',
    Form: 'Formulario',
    Cards: 'Tarjetas',
    Gallery: 'Galería',
    Labels: 'Etiquetas',
    Report: 'Informe',
    'Upload image': 'Subir imagen',
    'No image yet': 'Sin imagen todavía',
  },
  vi: {
    New: 'Mới',
    'Save JSON': 'Lưu JSON',
    'Open JSON': 'Mở JSON',
    'Export CSV': 'Xuất CSV',
    File: 'Tệp',
    Edit: 'Sửa',
    Data: 'Dữ liệu',
    Layout: 'Bố cục',
    Tools: 'Công cụ',
    View: 'Xem',
    Teacher: 'Giáo viên',
    Help: 'Trợ giúp',
    Title: 'Tiêu đề',
    Search: 'Tìm',
    Sort: 'Sắp xếp',
    Table: 'Bảng',
    Form: 'Biểu mẫu',
    Cards: 'Thẻ',
    Gallery: 'Thư viện ảnh',
    Labels: 'Nhãn',
    Report: 'Báo cáo',
  },
  ar: {
    New: 'جديد',
    'Save JSON': 'حفظ JSON',
    'Open JSON': 'فتح JSON',
    'Export CSV': 'تصدير CSV',
    File: 'ملف',
    Edit: 'تحرير',
    Data: 'بيانات',
    Layout: 'تخطيط',
    Tools: 'أدوات',
    View: 'عرض',
    Teacher: 'المعلم',
    Help: 'مساعدة',
    Title: 'العنوان',
    Search: 'بحث',
    Sort: 'فرز',
    Table: 'جدول',
    Form: 'نموذج',
    Cards: 'بطاقات',
    Gallery: 'معرض',
    Labels: 'ملصقات',
    Report: 'تقرير',
  },
  zh: {
    New: '新建',
    'Save JSON': '保存 JSON',
    'Open JSON': '打开 JSON',
    'Export CSV': '导出 CSV',
    File: '文件',
    Edit: '编辑',
    Data: '数据',
    Layout: '布局',
    Tools: '工具',
    View: '视图',
    Teacher: '教师',
    Help: '帮助',
    Title: '标题',
    Search: '搜索',
    Sort: '排序',
    Table: '表格',
    Form: '表单',
    Cards: '卡片',
    Gallery: '图库',
    Labels: '标签',
    Report: '报告',
  },
  uh: {
    New: 'नया',
    File: 'फ़ाइल',
    Edit: 'संपादन',
    Data: 'डेटा',
    Layout: 'लेआउट',
    Tools: 'औज़ार',
    View: 'दृश्य',
    Teacher: 'शिक्षक',
    Help: 'सहायता',
    Search: 'खोज',
    Table: 'तालिका',
    Form: 'फ़ॉर्म',
    Cards: 'कार्ड',
    Gallery: 'गैलरी',
    Labels: 'लेबल',
    Report: 'रिपोर्ट',
  },
};

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('ListSplatTM app root was not found.');
}

const appRoot = root;

let project = loadAutosave() ?? createStarterProject();
let activeTableId = project.schema.tables[0].id;
let activeRecordId = project.schema.tables[0].records[0]?.id ?? '';
let viewMode: ViewMode = 'table';
let saveStatus = 'Saved locally';
let searchQuery = '';
let searchFieldId = 'all';
let sortFieldId = '';
let sortDirection: 'asc' | 'desc' = 'asc';
let highlightedRecordIds = new Set<string>();
let dialog: DialogName = 'none';
let selectedFieldId = '';
let lastMessage = 'Tip: Start with one table, then add relationships when your project needs them.';
let undoStack: Array<{ label: string; project: ListSplatFile }> = [];
let replacePreview: Array<{ recordId: string; fieldId: string; before: string; after: string }> = [];
let relationshipFromTableId = activeTableId;
let relationshipToTableId = project.schema.tables[1]?.id ?? activeTableId;
let pendingCsvTable: ListSplatTable | null = null;
let pendingCsvFileName = '';
let language = initialLanguage();

function html(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeLanguage(value: string | null | undefined): LanguageCode {
  const lang = (value || '').toLowerCase();
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('vi')) return 'vi';
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('zh')) return 'zh';
  if (lang === 'uh' || lang.startsWith('ur') || lang.startsWith('hi')) return 'uh';
  return 'en';
}

function initialLanguage(): LanguageCode {
  const params = new URLSearchParams(window.location.search);
  try {
    return normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY) || navigator.language);
  } catch {
    return normalizeLanguage(params.get('lang') || navigator.language);
  }
}

function languageOptions(current: LanguageCode): string {
  return languages
    .map(({ code, label }) => `<option value="${code}"${code === current ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function t(value: string): string {
  if (language === 'en') return value;
  return translations[language][value] ?? value;
}

function applyDocumentLanguage(): void {
  const config = languages.find((item) => item.code === language) ?? languages[0];
  document.documentElement.lang = config.htmlLang;
  document.documentElement.dir = config.dir;
}

function activeTable(): ListSplatTable {
  return project.schema.tables.find((table) => table.id === activeTableId) ?? project.schema.tables[0];
}

function visibleRecords(table: ListSplatTable): ListSplatRecord[] {
  const records = findRecords(table, { query: searchQuery, fieldId: searchFieldId });
  return highlightedRecordIds.size > 0 ? records.filter((record) => highlightedRecordIds.has(record.id)) : records;
}

function ensureActiveRecord(table: ListSplatTable): void {
  if (!table.records.some((record) => record.id === activeRecordId)) {
    activeRecordId = table.records[0]?.id ?? '';
  }
}

function setProject(nextProject: ListSplatFile): void {
  project = nextProject;
  ensureActiveRecord(activeTable());
  saveAutosave(project);
  saveStatus = 'Saved locally';
  render();
}

function pushUndo(label: string): void {
  undoStack = [{ label, project: structuredClone(project) }, ...undoStack].slice(0, 12);
}

function undoLastChange(): void {
  const last = undoStack[0];
  if (!last) {
    lastMessage = 'Nothing to undo yet.';
    render();
    return;
  }
  undoStack = undoStack.slice(1);
  project = last.project;
  activeTableId = project.schema.tables.some((table) => table.id === activeTableId)
    ? activeTableId
    : project.schema.tables[0].id;
  ensureActiveRecord(activeTable());
  saveAutosave(project);
  lastMessage = `Undid ${last.label}.`;
  render();
}

function setActiveTable(table: ListSplatTable): void {
  activeTableId = table.id;
  setProject(replaceTable(project, table));
}

function closeMenus(): void {
  document.querySelectorAll<HTMLDetailsElement>('.menu[open]').forEach((menu) => {
    menu.open = false;
  });
}

function updateTitle(value: string): void {
  setProject({
    ...project,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...project.metadata,
      title: value || 'Untitled Database',
    },
  });
}

function saveJson(): void {
  downloadFile(
    `${project.metadata.title || 'listsplat-project'}.listsplat.json`,
    JSON.stringify(project, null, 2),
    'application/json',
  );
}

function saveCsv(): void {
  downloadFile(`${activeTable().name}.csv`, tableToCsv(activeTable()), 'text/csv;charset=utf-8');
}

function exportReport(): void {
  const table = activeTable();
  const rows = visibleRecords(table);
  const report = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${html(project.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${html(project.metadata.title)}</h1><p>${html(table.name)} report from ListSplatTM.</p>
<table><thead><tr>${table.fields.map((field) => `<th>${html(field.name)}</th>`).join('')}</tr></thead>
<tbody>${rows
    .map((record) => `<tr>${table.fields.map((field) => `<td>${html(displayValue(table, record, field.id))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></body></html>`;
  downloadFile(`${project.metadata.title || 'listsplat-report'}.html`, report, 'text/html;charset=utf-8');
}

function openJson(file: File): void {
  file
    .text()
    .then((text) => {
      const parsed: unknown = JSON.parse(text);
      assertListSplatFile(parsed);
      activeTableId = parsed.schema.tables[0].id;
      activeRecordId = parsed.schema.tables[0].records[0]?.id ?? '';
      setProject(parsed);
    })
    .catch((error: unknown) => {
      window.alert(error instanceof Error ? error.message : 'Could not open this ListSplatTM file.');
    });
}

function importCsv(file: File): void {
  file.text().then((text) => {
    const table = tableFromCsv(file.name.replace(/\.csv$/i, ''), text);
    pendingCsvTable = table;
    pendingCsvFileName = file.name;
    dialog = 'csvImport';
    lastMessage = `Previewing ${table.records.length} CSV record${table.records.length === 1 ? '' : 's'} from ${file.name}.`;
    render();
  });
}

function applyCsvImport(mode: 'new' | 'append'): void {
  if (!pendingCsvTable) {
    dialog = 'none';
    return;
  }

  pushUndo('CSV import');
  if (mode === 'new') {
    const table = pendingCsvTable;
    activeTableId = table.id;
    activeRecordId = table.records[0]?.id ?? '';
    pendingCsvTable = null;
    dialog = 'none';
    lastMessage = `Imported ${table.records.length} records from ${pendingCsvFileName}.`;
    setProject({
      ...project,
      updatedAt: new Date().toISOString(),
      schema: {
        ...project.schema,
        tables: [...project.schema.tables, table],
      },
      layouts: [
        ...project.layouts,
        {
          id: `layout_${Date.now().toString(36)}`,
          name: `${table.name} Table`,
          tableId: table.id,
          mode: 'table',
          locked: false,
        },
      ],
    });
    return;
  }

  const table = activeTable();
  const importedFieldsByName = new Map(pendingCsvTable.fields.map((field) => [field.name.trim().toLowerCase(), field.id]));
  const appendedRecords = pendingCsvTable.records.map((record) =>
    createRecord(
      table.fields,
      Object.fromEntries(
        table.fields.map((field) => {
          const importedFieldId = importedFieldsByName.get(field.name.trim().toLowerCase());
          return [field.id, importedFieldId ? record.values[importedFieldId] ?? '' : ''];
        }),
      ),
    ),
  );
  pendingCsvTable = null;
  dialog = 'none';
  lastMessage = `Appended ${appendedRecords.length} CSV record${appendedRecords.length === 1 ? '' : 's'} to ${table.name}.`;
  setActiveTable({ ...table, records: [...table.records, ...appendedRecords] });
}

function applyTemplate(templateId: string): void {
  const template = listSplatTemplates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }
  const table = cloneTemplateTable(template);
  pushUndo('template load');
  activeTableId = table.id;
  activeRecordId = table.records[0]?.id ?? '';
  lastMessage = `Loaded ${template.title}.`;
  setProject({
    ...project,
    metadata: {
      ...project.metadata,
      title: template.title,
    },
    schema: {
      ...project.schema,
      tables: [...project.schema.tables, table],
    },
    teacher: {
      ...project.teacher,
      notes: template.reflectionQuestions,
    },
  });
}

function createMenu(label: string, items: Array<[string, string]>): string {
  return `
    <details class="menu">
      <summary>${html(t(label))}</summary>
      <div class="menu-panel">
        ${items.map(([action, text]) => `<button type="button" data-action="${action}">${html(t(text))}</button>`).join('')}
      </div>
    </details>
  `;
}

function fieldTypeOptions(selected: FieldType = 'text'): string {
  const types: Array<[FieldType, string]> = [
    ['text', 'Short text'],
    ['longText', 'Long text'],
    ['number', 'Number'],
    ['currency', 'Currency'],
    ['percent', 'Percent'],
    ['date', 'Date'],
    ['checkbox', 'Checkbox'],
    ['rating', 'Rating'],
    ['choice', 'Choice'],
    ['image', 'Image'],
    ['link', 'Link'],
    ['calculation', 'Calculation'],
    ['autoNumber', 'Auto number'],
    ['createdAt', 'Created time'],
    ['updatedAt', 'Updated time'],
  ];
  return types.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
}

function displayValue(table: ListSplatTable, record: ListSplatRecord, fieldId: string): ListSplatCellValue {
  const field = table.fields.find((item) => item.id === fieldId);
  if (field?.type === 'calculation' && field.formula) {
    return evaluateSimpleFormula(field.formula, table, record);
  }
  return record.values[fieldId] ?? '';
}

function currentLayout() {
  return project.layouts.find((layout) => layout.tableId === activeTableId && layout.mode === viewMode);
}

function isField(value: ListSplatField | undefined): value is ListSplatField {
  return Boolean(value);
}

function orderedFields(table: ListSplatTable): ListSplatField[] {
  const layout = currentLayout();
  const order = layout?.fieldOrder ?? table.fields.map((field) => field.id);
  const byId = new Map(table.fields.map((field) => [field.id, field]));
  return [
    ...order.map((fieldId) => byId.get(fieldId)).filter(isField),
    ...table.fields.filter((field) => !order.includes(field.id)),
  ].filter((field) => field && !field.hidden);
}

function imageFields(table: ListSplatTable): ListSplatField[] {
  return orderedFields(table).filter((field) => field.type === 'image');
}

function firstImageValue(table: ListSplatTable, record: ListSplatRecord): string {
  const imageField = imageFields(table)[0];
  return imageField ? String(displayValue(table, record, imageField.id) ?? '') : '';
}

function updateCurrentLayout(updates: { fieldOrder?: string[]; locked?: boolean }): void {
  const layout = currentLayout();
  if (!layout) {
    return;
  }
  setProject({
    ...project,
    updatedAt: new Date().toISOString(),
    layouts: project.layouts.map((item) => (item.id === layout.id ? { ...item, ...updates } : item)),
  });
}

function recordTitle(table: ListSplatTable, record: ListSplatRecord): string {
  const firstVisibleField = table.fields.find((field) => !field.hidden) ?? table.fields[0];
  const value = firstVisibleField ? displayValue(table, record, firstVisibleField.id) : '';
  return String(value || 'Untitled record');
}

function renderInput(table: ListSplatTable, record: ListSplatRecord, fieldId: string, rowIndex: number): string {
  const field = table.fields.find((item) => item.id === fieldId);
  const value = displayValue(table, record, fieldId);
  const common = `aria-label="${html(field?.name ?? 'Field')}, record ${rowIndex + 1}" data-record-id="${record.id}" data-field-id="${fieldId}"`;

  if (field?.type === 'checkbox') {
    return `<input class="cell-checkbox" type="checkbox" ${common} ${value === true || value === 'true' ? 'checked' : ''}>`;
  }
  if (field?.type === 'image') {
    const imageSrc = String(value ?? '');
    return `
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${common}>
        ${imageSrc ? `<img src="${html(imageSrc)}" alt="">` : `<span>${html(t('No image yet'))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${html(t('Upload image'))}
          <input class="image-input" type="file" accept="image/*" ${common}>
        </label>
      </div>
    `;
  }
  if (field?.type === 'rating') {
    return `<input class="cell-input" type="number" min="0" max="5" step="1" ${common} value="${html(value)}">`;
  }
  if (field?.type === 'choice') {
    const options = field.options?.length ? field.options : ['Yes', 'No'];
    return `<select class="cell-input" ${common}>${options
      .map((option) => `<option value="${html(option)}" ${String(value) === option ? 'selected' : ''}>${html(option)}</option>`)
      .join('')}</select>`;
  }
  if (field?.type === 'autoNumber' || field?.type === 'createdAt' || field?.type === 'updatedAt') {
    return `<output class="calc-output">${html(value)}</output>`;
  }
  if (field?.type === 'longText') {
    return `<textarea class="cell-input" ${common}>${html(value)}</textarea>`;
  }
  if (field?.type === 'date') {
    return `<input class="cell-input" type="date" ${common} value="${html(value)}">`;
  }
  if (field?.type === 'number' || field?.type === 'currency' || field?.type === 'percent') {
    return `<input class="cell-input" type="number" step="any" ${common} value="${html(value)}">`;
  }
  if (field?.type === 'calculation') {
    return `<output class="calc-output">${html(value)}</output>`;
  }
  return `<input class="cell-input" ${common} value="${html(value)}">`;
}

function renderTableTabs(table: ListSplatTable): string {
  return `
    <div class="table-tabs">
      ${project.schema.tables
        .map(
          (item) =>
            `<button type="button" class="table-tab ${item.id === table.id ? 'active' : ''}" data-table-id="${item.id}">${html(item.name)}</button>`,
        )
        .join('')}
    </div>
  `;
}

function renderTableView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  return `
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${orderedFields(table)
              .map(
                (field) => `
                  <th>
                    <button type="button" class="field-button" data-field-settings="${field.id}">
                      ${html(field.name)}<br><small>${html(field.type)}</small>
                    </button>
                  </th>
                `,
              )
              .join('')}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (record, rowIndex) => `
                <tr class="${record.id === activeRecordId ? 'active-row' : ''}" data-record-row="${record.id}">
                  <td><button type="button" class="row-button" data-select-record="${record.id}">${rowIndex + 1}</button></td>
                  ${orderedFields(table)
                    .map((field) => `<td>${renderInput(table, record, field.id, rowIndex)}</td>`)
                    .join('')}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${record.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${record.id}">Delete</button>
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderFormView(table: ListSplatTable): string {
  const record = table.records.find((item) => item.id === activeRecordId) ?? table.records[0];
  if (!record) {
    return '<div class="empty-panel">Add a record to use form view.</div>';
  }
  const relatedSections = project.schema.relationships
    .filter((relationship) => relationship.fromTableId === table.id)
    .map((relationship) => {
      const targetTable = project.schema.tables.find((item) => item.id === relationship.toTableId);
      const rows = targetTable ? relatedRecords(relationship, table, record, targetTable) : [];
      return `
        <section class="related-records">
          <h3>${html(relationship.name)}</h3>
          <p>${rows.length} related record${rows.length === 1 ? '' : 's'} from ${html(targetTable?.name ?? 'another table')}</p>
          ${
            rows.length
              ? `<div class="related-grid">${rows
                  .slice(0, 6)
                  .map(
                    (relatedRecord) => `
                      <article>
                        <strong>${html(recordTitle(targetTable!, relatedRecord))}</strong>
                        ${targetTable!.fields
                          .filter((field) => !field.hidden)
                          .slice(0, 3)
                          .map((field) => `<span>${html(field.name)}: ${html(displayValue(targetTable!, relatedRecord, field.id))}</span>`)
                          .join('')}
                      </article>
                    `,
                  )
                  .join('')}</div>`
              : '<p>No matches yet. Make sure the match fields use the same value.</p>'
          }
        </section>
      `;
    })
    .join('');
  return `
    <div class="form-view">
      <div class="form-nav">
        ${table.records
          .map(
            (item, index) =>
              `<button type="button" class="${item.id === record.id ? 'active' : ''}" data-select-record="${item.id}">Record ${index + 1}</button>`,
          )
          .join('')}
      </div>
      <div class="record-form">
        ${orderedFields(table)
          .map(
            (field, index) => `
              <label>
                <span>${html(field.name)}</span>
                ${renderInput(table, record, field.id, index)}
                ${field.description ? `<small>${html(field.description)}</small>` : ''}
              </label>
            `,
          )
          .join('')}
        ${relatedSections}
      </div>
    </div>
  `;
}

function renderCardsView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  const renderCardField = (field: ListSplatField, record: ListSplatRecord): string => {
    const value = displayValue(table, record, field.id);
    if (field.type === 'image') {
      const imageSrc = String(value ?? '');
      return `
        <figure class="card-image-field">
          ${imageSrc ? `<img src="${html(imageSrc)}" alt="">` : '<span>No image yet</span>'}
          <figcaption>${html(field.name)}</figcaption>
        </figure>
      `;
    }
    return `<p><strong>${html(field.name)}</strong><span>${html(value)}</span></p>`;
  };

  return `
    <div class="cards-view ${viewMode === 'gallery' ? 'gallery-view' : ''}">
      ${rows
        .map(
          (record) => {
            const imageSrc = firstImageValue(table, record);
            return `
            <article class="record-card" data-select-record="${record.id}">
              ${
                viewMode === 'gallery'
                  ? `<div class="gallery-image">${imageSrc ? `<img src="${html(imageSrc)}" alt="">` : '<span>Add an image field, then upload a picture.</span>'}</div>`
                  : ''
              }
              ${orderedFields(table)
                .filter((field) => viewMode !== 'gallery' || field.type !== 'image')
                .slice(0, viewMode === 'gallery' ? 4 : 8)
                .map((field) => renderCardField(field, record))
                .join('')}
            </article>
          `;
          },
        )
        .join('')}
    </div>
  `;
}

function renderLabelsView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  return `
    <div class="labels-view">
      ${rows
        .map(
          (record) => `
            <article class="print-label">
              ${orderedFields(table)
                .slice(0, 4)
                .map((field) => `<p><strong>${html(field.name)}:</strong> ${html(displayValue(table, record, field.id))}</p>`)
                .join('')}
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderReportView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  const summaries = summarizeTable(table);
  return `
    <div class="report-view">
      <header>
        <h2>${html(project.metadata.title)}</h2>
        <p>${html(table.name)} report. ${rows.length} record${rows.length === 1 ? '' : 's'} shown.</p>
      </header>
      ${renderTableView(table, rows)}
      ${
        summaries.length
          ? `<section class="summary-strip">${summaries
              .map(
                (summary) =>
                  `<div><strong>${html(summary.fieldName)}</strong><span>Sum ${summary.sum.toLocaleString()} | Avg ${summary.average.toFixed(2)}</span></div>`,
              )
              .join('')}</section>`
          : '<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>'
      }
    </div>
  `;
}

function renderDatabasePanel(table: ListSplatTable): string {
  const rows = visibleRecords(table);
  const viewHelp: Record<ViewMode, string> = {
    table: 'Table: spreadsheet-like rows and columns for fast data entry.',
    form: 'Form: focus on one record at a time.',
    cards: 'Cards: compact text-first record cards for browsing.',
    gallery: 'Gallery: image-first cards for collections and exhibits.',
    labels: 'Labels: printable small cards or shelf labels.',
    report: 'Report: printable table with title and summaries.',
  };
  const body =
    viewMode === 'form'
      ? renderFormView(table)
      : viewMode === 'cards' || viewMode === 'gallery'
        ? renderCardsView(table, rows)
        : viewMode === 'labels'
          ? renderLabelsView(table, rows)
          : viewMode === 'report'
            ? renderReportView(table, rows)
            : renderTableView(table, rows);

  return `
    <section class="database-panel" aria-label="Database table">
      ${renderTableTabs(table)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${(['table', 'form', 'cards', 'gallery', 'labels', 'report'] as ViewMode[])
          .map(
            (mode) =>
              `<button type="button" class="${viewMode === mode ? 'active' : ''}" data-view-mode="${mode}" title="${html(viewHelp[mode])}" aria-label="${html(viewHelp[mode])}">${html(t(mode[0].toUpperCase() + mode.slice(1)))}</button>`,
          )
          .join('')}
      </div>
      ${body}
    </section>
  `;
}

function renderTeacherPanel(table: ListSplatTable): string {
  const summaries = summarizeTable(table);
  const currentRecord = table.records.find((record) => record.id === activeRecordId) ?? table.records[0];
  const relationshipCards = currentRecord
    ? project.schema.relationships
        .filter((relationship) => relationship.fromTableId === table.id)
        .map((relationship) => {
          const targetTable = project.schema.tables.find((item) => item.id === relationship.toTableId);
          const count = targetTable ? relatedRecords(relationship, table, currentRecord, targetTable).length : 0;
          return `
            <div class="template-card">
              <strong>${html(relationship.name)}</strong>
              <span>${count} related record${count === 1 ? '' : 's'}</span>
              <p>${html(relationshipLabel(project, relationship))}</p>
            </div>
          `;
        })
        .join('')
    : '';
  return `
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${visibleRecords(table).length}</strong> shown</div>
        <div class="stat-card"><strong>${table.records.length}</strong> records</div>
        <div class="stat-card"><strong>${table.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${project.schema.tables.length}</strong> tables</div>
      </div>
      ${summaries
        .map(
          (summary) => `
            <div class="template-card">
              <strong>${html(summary.fieldName)} summary</strong>
              <span>Sum: ${summary.sum.toLocaleString()}</span>
              <span>Average: ${summary.average.toFixed(2)}</span>
            </div>
          `,
        )
        .join('')}
      ${relationshipCards ? `<h3>Related Records</h3>${relationshipCards}` : ''}
      <h3>Template Starters</h3>
      ${listSplatTemplates
        .map(
          (template) => `
            <div class="template-card">
              <strong>${html(template.title)}</strong>
              <span>${html(template.gradeBand)}</span>
              <p>${html(template.goal)}</p>
              <button type="button" data-template-id="${template.id}">Use template</button>
            </div>
          `,
        )
        .join('')}
    </aside>
  `;
}

function renderDialog(table: ListSplatTable): string {
  if (dialog === 'none') {
    return '';
  }

  if (dialog === 'replace') {
    const previewRows = replacePreview.slice(0, 8);
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${table.fields.map((field) => `<option value="${field.id}">${html(field.name)}</option>`).join('')}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${
            replacePreview.length
              ? `<div class="replace-preview"><strong>${replacePreview.length} change${replacePreview.length === 1 ? '' : 's'} ready</strong>${previewRows
                  .map((item) => {
                    const record = table.records.find((candidate) => candidate.id === item.recordId);
                    const field = table.fields.find((candidate) => candidate.id === item.fieldId);
                    return `<p><span>${html(record ? recordTitle(table, record) : 'Record')} / ${html(field?.name ?? 'Field')}</span><del>${html(item.before)}</del><ins>${html(item.after)}</ins></p>`;
                  })
                  .join('')}</div>`
              : ''
          }
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${replacePreview.length ? '' : 'disabled'}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;
  }

  if (dialog === 'field') {
    const field = table.fields.find((item) => item.id === selectedFieldId) ?? table.fields[0];
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${html(field.name)}"></label>
          <label>Type <select data-field-type>${fieldTypeOptions(field.type)}</select></label>
          <label>Description <textarea data-field-description>${html(field.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${html(field.options?.join(', ') ?? '')}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${field.required ? 'checked' : ''}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${field.hidden ? 'checked' : ''}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${html(field.formula ?? '')}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Supported starter formulas: <code>FIELD(Field Name)</code> and <code>JOIN(Field, " text ", Other Field)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;
  }

  if (dialog === 'layout') {
    const layout = currentLayout();
    const fields = orderedFields(table);
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange fields for the current ${html(viewMode)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${layout?.locked ? 'checked' : ''}> Lock this layout</label>
          <div class="layout-field-list">
            ${fields
              .map(
                (field, index) => `
                  <div class="layout-field-row">
                    <strong>${html(field.name)}</strong>
                    <span>${html(field.type)}</span>
                    <button type="button" data-action="layout-field-up" data-layout-field-id="${field.id}" ${index === 0 ? 'disabled' : ''}>Up</button>
                    <button type="button" data-action="layout-field-down" data-layout-field-id="${field.id}" ${index === fields.length - 1 ? 'disabled' : ''}>Down</button>
                  </div>
                `,
              )
              .join('')}
          </div>
          <div class="modal-actions">
            <button type="button" data-action="save-layout-settings">Save layout</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `;
  }

  if (dialog === 'csvImport' && pendingCsvTable) {
    const previewRows = pendingCsvTable.records.slice(0, 5);
    return `
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import preview">
          <h2>CSV import preview</h2>
          <p>${html(pendingCsvFileName)} has ${pendingCsvTable.fields.length} field${pendingCsvTable.fields.length === 1 ? '' : 's'} and ${pendingCsvTable.records.length} record${pendingCsvTable.records.length === 1 ? '' : 's'}.</p>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${pendingCsvTable.fields.map((field) => `<th>${html(field.name)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${previewRows
                  .map(
                    (record) =>
                      `<tr>${pendingCsvTable!.fields
                        .map((field) => `<td>${html(record.values[field.id])}</td>`)
                        .join('')}</tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          <p>New table keeps every CSV column. Append uses matching field names in the current table and leaves unmatched fields blank.</p>
          <div class="modal-actions">
            <button type="button" data-action="apply-csv-new">Create new table</button>
            <button type="button" data-action="apply-csv-append">Append to ${html(table.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;
  }

  if (dialog === 'projectIdeas') {
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Project ideas">
          <h2>Project ideas</h2>
          <ul>
            <li>Build a classroom library and find books by genre, author, or recommendation.</li>
            <li>Track science observations, then sort by date or measurement.</li>
            <li>Create animal trading cards with a label layout.</li>
            <li>Survey classmates and make a report showing the most common answers.</li>
            <li>Connect a Books table to a Reviews table after relationships are added.</li>
          </ul>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `;
  }

  if (dialog === 'relationship') {
    const fromTable = project.schema.tables.find((item) => item.id === relationshipFromTableId) ?? table;
    const toTable = project.schema.tables.find((item) => item.id === relationshipToTableId) ?? table;
    const fromFieldOptions = fromTable.fields
      .map((field) => `<option value="${fromTable.id}:${field.id}">${html(field.name)}</option>`)
      .join('');
    const toFieldOptions = toTable.fields
      .map((field) => `<option value="${toTable.id}:${field.id}">${html(field.name)}</option>`)
      .join('');
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${project.schema.tables
            .map((item) => `<option value="${item.id}" ${item.id === fromTable.id ? 'selected' : ''}>${html(item.name)}</option>`)
            .join('')}</select></label>
          <label>Parent match field <select data-relationship-from-field>${fromFieldOptions}</select></label>
          <label>Related table <select data-relationship-to-table>${project.schema.tables
            .map((item) => `<option value="${item.id}" ${item.id === toTable.id ? 'selected' : ''}>${html(item.name)}</option>`)
            .join('')}</select></label>
          <label>Related match field <select data-relationship-to-field>${toFieldOptions}</select></label>
          ${
            project.schema.relationships.length
              ? `<div class="relationship-list">${project.schema.relationships
                  .map((relationship) => `<p><strong>${html(relationship.name)}</strong><br>${html(relationshipLabel(project, relationship))}</p>`)
                  .join('')}</div>`
              : '<p>No relationships yet. Add a second table first for the most useful results.</p>'
          }
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="ListSplat help">
        <h2>ListSplatTM Help</h2>
        <p>Create fields to describe the information you want to collect. Add one record for each item, person, place, observation, or source.</p>
        <ul>
          <li>Use Table view for fast entry.</li>
          <li>Use Form view to focus on one record.</li>
          <li>Use Cards, Labels, and Report view to share or print.</li>
          <li>Save a .listsplat.json file when you need a reliable backup.</li>
          <li>CSV import/export lets you trade data with spreadsheets.</li>
        </ul>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `;
}

function render(): void {
  const table = activeTable();
  ensureActiveRecord(table);
  applyDocumentLanguage();
  appRoot.innerHTML = `
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.svg" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button primary" data-action="new">${html(t('New'))}</button>
        <button type="button" class="button primary" data-action="save-json">${html(t('Save JSON'))}</button>
        <button type="button" class="button primary" data-action="open-json">${html(t('Open JSON'))}</button>
        <button type="button" class="button primary" data-action="export-csv">${html(t('Export CSV'))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${languageOptions(language)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${createMenu('File', [
          ['new', 'New database'],
          ['save-json', 'Save .listsplat.json'],
          ['open-json', 'Open .listsplat.json'],
          ['import-csv', 'Import CSV'],
          ['export-csv', 'Export CSV'],
          ['export-report', 'Export report HTML'],
          ['print', 'Print'],
        ])}
        ${createMenu('Edit', [
          ['undo-change', 'Undo last change'],
          ['add-record', 'Add record'],
          ['add-field', 'Add field'],
          ['find', 'Find records'],
          ['replace', 'Replace values'],
        ])}
        ${createMenu('Data', [
          ['add-table', 'New table'],
          ['sort', 'Sort records'],
          ['missing', 'Find missing values'],
          ['duplicates', 'Find duplicates'],
          ['clear-find', 'Show all records'],
        ])}
        ${createMenu('Layout', [
          ['layout-designer', 'Design current layout'],
          ['table-view', 'Table view'],
          ['form-view', 'Form view'],
          ['cards-view', 'Card view'],
          ['gallery-view', 'Gallery view'],
          ['labels-view', 'Label view'],
          ['report-view', 'Report view'],
        ])}
        ${createMenu('Tools', [
          ['functions', 'Functions'],
          ['relationships', 'Relationships'],
          ['quality', 'Data quality check'],
        ])}
        ${createMenu('View', [
          ['student-view', 'Student view'],
          ['teacher-notes', 'Teacher notes'],
        ])}
        <span class="menu-spacer"></span>
        ${createMenu('Teacher', [
          ['templates', 'Template Library'],
          ['project-ideas', 'Project Ideas'],
          ['lock-layout', 'Lock Layout'],
          ['project-packet', 'Print Project Packet'],
        ])}
        ${createMenu('Help', [
          ['help-start', 'Start a database'],
          ['help-csv', 'Import and export CSV'],
          ['help-layouts', 'Forms and reports'],
          ['help-privacy', 'Privacy and saving'],
        ])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${html(t('Title'))} <input data-project-title value="${html(project.metadata.title)}"></label>
        <label>${html(t('Search'))} <input data-search value="${html(searchQuery)}" placeholder="${html(t('Find records'))}"></label>
        <label>${html(t('In'))} <select data-search-field><option value="all">${html(t('All fields'))}</option>${table.fields
          .map((field) => `<option value="${field.id}" ${searchFieldId === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
          .join('')}</select></label>
        <label>${html(t('Sort'))} <select data-sort-field><option value="">${html(t('Choose field'))}</option>${table.fields
          .map((field) => `<option value="${field.id}" ${sortFieldId === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
          .join('')}</select></label>
        <button type="button" data-action="toggle-sort">${sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</button>
        <label>${html(t('New field'))} <input data-new-field placeholder="${html(t('Field name'))}"></label>
        <label>${html(t('Type'))} <select data-new-field-type>${fieldTypeOptions()}</select></label>
        <button type="button" data-action="add-field">${html(t('Add field'))}</button>
        <button type="button" data-action="add-record">${html(t('Add record'))}</button>
      </section>
      <div class="workspace">
        ${renderDatabasePanel(table)}
        ${renderTeacherPanel(table)}
      </div>
      <footer class="status-bar">
        <span>${html(table.name)}: ${visibleRecords(table).length} shown of ${table.records.length} records, ${table.fields.length} fields</span>
        <span>${html(lastMessage)}</span>
        <span>${saveStatus}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${renderDialog(table)}
  `;
}

function cellValueFromInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ListSplatCellValue {
  if (input instanceof HTMLInputElement && input.type === 'checkbox') {
    return input.checked;
  }
  if (input instanceof HTMLInputElement && input.type === 'number') {
    return input.value === '' ? '' : Number(input.value);
  }
  return input.value;
}

function updateActiveCell(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  const recordId = input.dataset.recordId;
  const fieldId = input.dataset.fieldId;
  if (!recordId || !fieldId) {
    return;
  }
  project = replaceTable(project, updateCell(activeTable(), recordId, fieldId, cellValueFromInput(input)));
  saveAutosave(project);
  saveStatus = 'Saved locally';
}

function storeImageFile(recordId: string, fieldId: string, file: File, undoLabel: string): void {
  if (!file.type.startsWith('image/')) {
    lastMessage = 'That clipboard item is not an image.';
    render();
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    pushUndo(undoLabel);
    project = replaceTable(project, updateCell(activeTable(), recordId, fieldId, String(reader.result ?? '')));
    saveAutosave(project);
    lastMessage = 'Image saved in this field.';
    render();
  });
  reader.readAsDataURL(file);
}

function runFieldSettingsSave(): void {
  const table = activeTable();
  const field = table.fields.find((item) => item.id === selectedFieldId);
  if (!field) {
    return;
  }
  const name = appRoot.querySelector<HTMLInputElement>('[data-field-name]')?.value ?? field.name;
  const type = (appRoot.querySelector<HTMLSelectElement>('[data-field-type]')?.value ?? field.type) as FieldType;
  const description = appRoot.querySelector<HTMLTextAreaElement>('[data-field-description]')?.value ?? '';
  const required = appRoot.querySelector<HTMLInputElement>('[data-field-required]')?.checked ?? false;
  const hidden = appRoot.querySelector<HTMLInputElement>('[data-field-hidden]')?.checked ?? false;
  const formula = appRoot.querySelector<HTMLInputElement>('[data-field-formula]')?.value ?? '';
  const options = (appRoot.querySelector<HTMLInputElement>('[data-field-options]')?.value ?? '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
  setActiveTable(updateField(table, field.id, { name, type, description, required, hidden, formula, options }));
  dialog = 'none';
  lastMessage = `Updated ${name}.`;
  render();
}

function runReplace(): void {
  const find = appRoot.querySelector<HTMLInputElement>('[data-replace-find]')?.value ?? '';
  const replacement = appRoot.querySelector<HTMLInputElement>('[data-replace-with]')?.value ?? '';
  const fieldId = appRoot.querySelector<HTMLSelectElement>('[data-replace-field]')?.value ?? activeTable().fields[0]?.id;
  const caseSensitive = appRoot.querySelector<HTMLInputElement>('[data-replace-case-sensitive]')?.checked ?? false;
  const wholeWord = appRoot.querySelector<HTMLInputElement>('[data-replace-whole-word]')?.checked ?? false;
  const recordIds = searchQuery ? visibleRecords(activeTable()).map((record) => record.id) : undefined;
  pushUndo('replace');
  const result = replaceValues(activeTable(), { fieldIds: [fieldId], find, replacement, recordIds, caseSensitive, wholeWord });
  dialog = 'none';
  replacePreview = [];
  lastMessage = `Replaced ${result.count} value${result.count === 1 ? '' : 's'}.`;
  setActiveTable(result.table);
}

function runReplacePreview(): void {
  const find = appRoot.querySelector<HTMLInputElement>('[data-replace-find]')?.value ?? '';
  const replacement = appRoot.querySelector<HTMLInputElement>('[data-replace-with]')?.value ?? '';
  const fieldId = appRoot.querySelector<HTMLSelectElement>('[data-replace-field]')?.value ?? activeTable().fields[0]?.id;
  const caseSensitive = appRoot.querySelector<HTMLInputElement>('[data-replace-case-sensitive]')?.checked ?? false;
  const wholeWord = appRoot.querySelector<HTMLInputElement>('[data-replace-whole-word]')?.checked ?? false;
  const recordIds = searchQuery ? visibleRecords(activeTable()).map((record) => record.id) : undefined;
  replacePreview = previewReplaceValues(activeTable(), { fieldIds: [fieldId], find, replacement, recordIds, caseSensitive, wholeWord });
  lastMessage = `Preview found ${replacePreview.length} change${replacePreview.length === 1 ? '' : 's'}.`;
  render();
}

function selectedRelationshipField(selector: string): { tableId: string; fieldId: string } | null {
  const raw = appRoot.querySelector<HTMLSelectElement>(selector)?.value;
  if (!raw) {
    return null;
  }
  const [tableId, fieldId] = raw.split(':');
  return tableId && fieldId ? { tableId, fieldId } : null;
}

function createRelationshipFromDialog(): void {
  const fromTableId = appRoot.querySelector<HTMLSelectElement>('[data-relationship-from-table]')?.value ?? '';
  const toTableId = appRoot.querySelector<HTMLSelectElement>('[data-relationship-to-table]')?.value ?? '';
  const fromField = selectedRelationshipField('[data-relationship-from-field]');
  const toField = selectedRelationshipField('[data-relationship-to-field]');
  const name = appRoot.querySelector<HTMLInputElement>('[data-relationship-name]')?.value ?? '';
  if (!fromTableId || !toTableId || !fromField || !toField) {
    lastMessage = 'Choose both tables and both match fields.';
    render();
    return;
  }
  if (fromField.tableId !== fromTableId || toField.tableId !== toTableId) {
    lastMessage = 'Match fields must belong to the tables you chose.';
    render();
    return;
  }
  pushUndo('relationship create');
  const relationship = createRelationship(name, fromTableId, fromField.fieldId, toTableId, toField.fieldId);
  lastMessage = `Created relationship: ${relationship.name}.`;
  setProject(addRelationship(project, relationship));
}

function updateRelationshipDialogTables(): void {
  relationshipFromTableId = appRoot.querySelector<HTMLSelectElement>('[data-relationship-from-table]')?.value ?? relationshipFromTableId;
  relationshipToTableId = appRoot.querySelector<HTMLSelectElement>('[data-relationship-to-table]')?.value ?? relationshipToTableId;
  render();
}

appRoot.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  const tableId = target.closest<HTMLElement>('[data-table-id]')?.dataset.tableId;
  const templateId = target.closest<HTMLElement>('[data-template-id]')?.dataset.templateId;
  const view = target.closest<HTMLElement>('[data-view-mode]')?.dataset.viewMode as ViewMode | undefined;
  const recordId = target.closest<HTMLElement>('[data-select-record]')?.dataset.selectRecord;
  const fieldSettings = target.closest<HTMLElement>('[data-field-settings]')?.dataset.fieldSettings;
  const recordActionId = target.closest<HTMLElement>('[data-record-action-id]')?.dataset.recordActionId;

  if (tableId) {
    activeTableId = tableId;
    highlightedRecordIds = new Set();
    ensureActiveRecord(activeTable());
    render();
    return;
  }

  if (templateId) {
    applyTemplate(templateId);
    return;
  }

  if (view) {
    viewMode = view;
    render();
    return;
  }

  if (recordId) {
    activeRecordId = recordId;
    if (viewMode === 'table') {
      render();
    }
    return;
  }

  if (fieldSettings) {
    selectedFieldId = fieldSettings;
    dialog = 'field';
    render();
    return;
  }

  if (!action) {
    return;
  }

  closeMenus();

  if (action === 'new') {
    pushUndo('new database');
    const next = createStarterProject('Untitled Database');
    activeTableId = next.schema.tables[0].id;
    activeRecordId = next.schema.tables[0].records[0]?.id ?? '';
    highlightedRecordIds = new Set();
    setProject(next);
  } else if (action === 'save-json') {
    saveJson();
  } else if (action === 'open-json') {
    appRoot.querySelector<HTMLInputElement>('[data-open-json]')?.click();
  } else if (action === 'import-csv') {
    appRoot.querySelector<HTMLInputElement>('[data-import-csv]')?.click();
  } else if (action === 'export-csv') {
    saveCsv();
  } else if (action === 'export-report' || action === 'project-packet') {
    exportReport();
  } else if (action === 'print') {
    window.print();
  } else if (action === 'add-record') {
    pushUndo('add record');
    setActiveTable(addRecord(activeTable()));
  } else if (action === 'add-field') {
    const input = appRoot.querySelector<HTMLInputElement>('[data-new-field]');
    const type = appRoot.querySelector<HTMLSelectElement>('[data-new-field-type]')?.value as FieldType | undefined;
    pushUndo('add field');
    setActiveTable(addField(activeTable(), input?.value || 'New Field', type ?? 'text'));
  } else if (action === 'add-table') {
    const name = window.prompt('New table name?', 'New Table') ?? '';
    pushUndo('add table');
    const next = addTable(project, name);
    activeTableId = next.schema.tables.at(-1)?.id ?? activeTableId;
    activeRecordId = activeTable().records[0]?.id ?? '';
    setProject(next);
  } else if (action === 'duplicate-record' && recordActionId) {
    pushUndo('duplicate record');
    setActiveTable(duplicateRecord(activeTable(), recordActionId));
  } else if (action === 'delete-record' && recordActionId) {
    pushUndo('delete record');
    setActiveTable(deleteRecord(activeTable(), recordActionId));
  } else if (action === 'toggle-sort') {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    render();
  } else if (action === 'sort') {
    if (sortFieldId) {
      setActiveTable(sortRecords(activeTable(), sortFieldId, sortDirection));
    }
  } else if (action === 'duplicates') {
    const fieldId = searchFieldId === 'all' ? activeTable().fields[0]?.id : searchFieldId;
    highlightedRecordIds = new Set(findDuplicateRecords(activeTable(), fieldId).map((record) => record.id));
    lastMessage = `Found ${highlightedRecordIds.size} duplicate record${highlightedRecordIds.size === 1 ? '' : 's'}.`;
    render();
  } else if (action === 'missing') {
    const fieldId = searchFieldId === 'all' ? activeTable().fields[0]?.id : searchFieldId;
    highlightedRecordIds = new Set(findMissingRecords(activeTable(), fieldId).map((record) => record.id));
    lastMessage = `Found ${highlightedRecordIds.size} record${highlightedRecordIds.size === 1 ? '' : 's'} with missing values.`;
    render();
  } else if (action === 'clear-find') {
    searchQuery = '';
    highlightedRecordIds = new Set();
    lastMessage = 'Showing all records.';
    render();
  } else if (action === 'replace') {
    replacePreview = [];
    dialog = 'replace';
    render();
  } else if (action === 'preview-replace') {
    runReplacePreview();
  } else if (action === 'run-replace') {
    runReplace();
  } else if (action === 'apply-csv-new') {
    applyCsvImport('new');
  } else if (action === 'apply-csv-append') {
    applyCsvImport('append');
  } else if (action === 'save-field-settings') {
    pushUndo('field settings');
    runFieldSettingsSave();
  } else if (action === 'layout-designer' || action === 'lock-layout') {
    dialog = 'layout';
    render();
  } else if (action === 'layout-field-up' || action === 'layout-field-down') {
    const fieldId = target.closest<HTMLElement>('[data-layout-field-id]')?.dataset.layoutFieldId;
    const layout = currentLayout();
    if (fieldId && layout) {
      const order = orderedFields(activeTable()).map((field) => field.id);
      const index = order.indexOf(fieldId);
      const swapIndex = action === 'layout-field-up' ? index - 1 : index + 1;
      if (index >= 0 && swapIndex >= 0 && swapIndex < order.length) {
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
        pushUndo('layout order');
        updateCurrentLayout({ fieldOrder: order });
        dialog = 'layout';
      }
    }
  } else if (action === 'save-layout-settings') {
    const locked = appRoot.querySelector<HTMLInputElement>('[data-layout-locked]')?.checked ?? false;
    pushUndo('layout settings');
    updateCurrentLayout({ locked, fieldOrder: orderedFields(activeTable()).map((field) => field.id) });
    dialog = 'none';
  } else if (action === 'create-relationship') {
    createRelationshipFromDialog();
  } else if (action === 'undo-change') {
    undoLastChange();
  } else if (action === 'close-dialog') {
    dialog = 'none';
    replacePreview = [];
    pendingCsvTable = null;
    render();
  } else if (action.endsWith('-view')) {
    viewMode = action.replace('-view', '') as ViewMode;
    render();
  } else if (action === 'templates') {
    lastMessage = 'Template starters are in the Teacher panel.';
    render();
  } else if (action === 'project-ideas') {
    dialog = 'projectIdeas';
    render();
  } else if (action === 'relationships') {
    dialog = 'relationship';
    render();
  } else if (action.startsWith('help-') || action === 'functions' || action === 'quality') {
    dialog = 'help';
    render();
  } else {
    lastMessage = 'This ListSplatTM tool is planned for a later build.';
    render();
  }
});

appRoot.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  if (target.matches('#languageSwitcher') && target instanceof HTMLSelectElement) {
    language = normalizeLanguage(target.value);
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Language selection is a convenience preference only.
    }
    render();
  } else if (target.matches('[data-open-json]') && target instanceof HTMLInputElement && target.files?.[0]) {
    openJson(target.files[0]);
  } else if (target.matches('[data-import-csv]') && target instanceof HTMLInputElement && target.files?.[0]) {
    importCsv(target.files[0]);
  } else if (target.matches('[data-search-field]')) {
    searchFieldId = target.value;
    highlightedRecordIds = new Set();
    render();
  } else if (target.matches('[data-sort-field]')) {
    sortFieldId = target.value;
    if (sortFieldId) {
      setActiveTable(sortRecords(activeTable(), sortFieldId, sortDirection));
    }
  } else if (target.matches('[data-relationship-from-table], [data-relationship-to-table]')) {
    updateRelationshipDialogTables();
  } else if (
    target.matches('.cell-input, .cell-checkbox, .image-input') &&
    (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)
  ) {
    if (target instanceof HTMLInputElement && target.type === 'file' && target.files?.[0]) {
      const recordId = target.dataset.recordId;
      const fieldId = target.dataset.fieldId;
      const file = target.files[0];
      if (recordId && fieldId) {
        storeImageFile(recordId, fieldId, file, 'image upload');
      }
    } else {
      updateActiveCell(target);
    }
  }
});

appRoot.addEventListener('paste', (event) => {
  const target = event.target as HTMLElement;
  const imageCell = target.closest<HTMLElement>('.image-cell');
  if (!imageCell) {
    return;
  }
  const recordId = imageCell.dataset.recordId;
  const fieldId = imageCell.dataset.fieldId;
  const item = Array.from(event.clipboardData?.items ?? []).find((clipboardItem) => clipboardItem.type.startsWith('image/'));
  const file = item?.getAsFile();
  if (recordId && fieldId && file) {
    event.preventDefault();
    storeImageFile(recordId, fieldId, file, 'image paste');
  }
});

appRoot.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  if (target.matches('[data-project-title]')) {
    updateTitle(target.value);
    return;
  }

  if (target.matches('[data-search]')) {
    searchQuery = target.value;
    highlightedRecordIds = new Set();
    render();
    return;
  }

  if (target.matches('.cell-input') && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    updateActiveCell(target);
  }
});

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.menu')) {
    closeMenus();
  }
});

document.addEventListener('toggle', (event) => {
  const menu = event.target;
  if (!(menu instanceof HTMLDetailsElement) || !menu.matches('.menu') || !menu.open) {
    return;
  }
  document.querySelectorAll<HTMLDetailsElement>('.menu[open]').forEach((otherMenu) => {
    if (otherMenu !== menu) {
      otherMenu.open = false;
    }
  });
}, true);

render();
