import { escapeCsvCell, tableFromCsv, tableToCsv } from './io/csv';
import { downloadFile, loadAutosave, saveAutosave } from './io/storage';
import {
  addField,
  addRecord,
  addTable,
  assertListSplatFile,
  convertFieldValues,
  convertValueForType,
  createField,
  createId,
  createRecord,
  createStarterProject,
  deleteRecord,
  deleteTable,
  duplicateRecord,
  duplicateTable,
  moveTable,
  renameTable,
  replaceTable,
  structureOnlyProject,
  updateCell,
  updateField,
} from './model/database';
import { evaluateSimpleFormula, summarizeTable } from './model/formulas';
import {
  filterAdvanced,
  findDuplicateRecords,
  findMissingRecords,
  findRecords,
  previewReplaceValues,
  replaceValues,
  sortRecordsByKeys,
} from './model/query';
import { addRelationship, createRelationship, relatedRecords, relationshipLabel } from './model/relationships';
import { tableValidationIssues, validateCell } from './model/validation';
import type {
  FieldType,
  FindOperator,
  FindQuery,
  FindRule,
  ListSplatCellValue,
  ListSplatField,
  ListSplatFile,
  ListSplatRecord,
  ListSplatTable,
  SavedView,
  SortKey,
} from './model/types';
import { cloneTemplateTable, listSplatTemplates } from './templates/templates';
import './styles/global.css';

type ViewMode = 'table' | 'form' | 'cards' | 'gallery' | 'list' | 'kanban' | 'calendar' | 'labels' | 'report';
type DialogName =
  | 'none'
  | 'replace'
  | 'field'
  | 'help'
  | 'projectIdeas'
  | 'relationship'
  | 'csvImport'
  | 'layout'
  | 'functions'
  | 'quality'
  | 'teacherNotes'
  | 'find'
  | 'sort'
  | 'views'
  | 'bulkFill'
  | 'charts';
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
let sortKeys: SortKey[] = [];
let findQuery: FindQuery | null = null;
let findDraft: FindQuery = { match: 'all', rules: [] };
let sortDraft: SortKey[] = [];
let fieldDialogType: FieldType | '' = '';
let selectedRecordIds = new Set<string>();
let cellRange: { anchor: { r: string; f: string }; focus: { r: string; f: string } } | null = null;
let showArchived = false;
let groupByFieldId = '';
let boardFieldId = '';
let calendarFieldId = '';
let calendarMonth = '';
let wrapText = false;
let draggedRecordId: string | null = null;
let chartType: 'bar' | 'pie' | 'line' = 'bar';
let chartCategoryField = '';
let chartValueMode: 'count' | 'sum' = 'count';
let chartValueField = '';
let pendingCsvMap: Array<{ header: string; action: 'new' | 'existing' | 'skip'; type: FieldType; fieldId: string }> = [];
let pendingCsvKeyField = '';
let pendingCsvDupMode: 'add' | 'skip' | 'update' = 'add';
let highlightedRecordIds = new Set<string>();
let dialog: DialogName = 'none';
let selectedFieldId = '';
let lastMessage = 'Tip: Start with one table, then add relationships when your project needs them.';
let undoStack: Array<{ label: string; project: ListSplatFile }> = [];
let redoStack: Array<{ label: string; project: ListSplatFile }> = [];
let activeCellDirtyKey = '';
let pendingFocusCell: { recordId: string; fieldId: string } | null = null;
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
  let records = findRecords(table, { query: searchQuery, fieldId: searchFieldId });
  records = records.filter((record) => (showArchived ? record.archived : !record.archived));
  records = filterAdvanced(records, findQuery);
  if (highlightedRecordIds.size > 0) {
    records = records.filter((record) => highlightedRecordIds.has(record.id));
  }
  return sortRecordsByKeys(records, sortKeys.filter((key) => table.fields.some((field) => field.id === key.fieldId)));
}

function archivedCount(table: ListSplatTable): number {
  return table.records.filter((record) => record.archived).length;
}

function findIsActive(): boolean {
  return Boolean(searchQuery) || Boolean(findQuery && findQuery.rules.length) || highlightedRecordIds.size > 0;
}

function clearFind(): void {
  searchQuery = '';
  findQuery = null;
  highlightedRecordIds = new Set();
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
  undoStack = [{ label, project: structuredClone(project) }, ...undoStack].slice(0, 25);
  redoStack = [];
}

// One undo checkpoint per cell-editing session (not per keystroke), so typing in
// a cell can be undone as a single step.
function noteCellEdit(recordId: string, fieldId: string): void {
  const key = `${recordId}:${fieldId}`;
  if (activeCellDirtyKey === key) {
    return;
  }
  const fieldName = activeTable().fields.find((field) => field.id === fieldId)?.name ?? 'cell';
  pushUndo(`edit ${fieldName}`);
  activeCellDirtyKey = key;
  syncHistoryButtons();
}

// Keep the Undo/Redo buttons in step with the stacks without a full re-render,
// so typing in a cell (which does not re-render) still enables Undo immediately.
function syncHistoryButtons(): void {
  const undoBtn = appRoot.querySelector<HTMLButtonElement>('[data-action="undo-change"]');
  const redoBtn = appRoot.querySelector<HTMLButtonElement>('[data-action="redo-change"]');
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function restoreProjectSnapshot(snapshot: ListSplatFile): void {
  project = snapshot;
  activeTableId = project.schema.tables.some((table) => table.id === activeTableId)
    ? activeTableId
    : project.schema.tables[0].id;
  ensureActiveRecord(activeTable());
  saveAutosave(project);
  render();
}

function undoLastChange(): void {
  const last = undoStack[0];
  if (!last) {
    lastMessage = 'Nothing to undo yet.';
    render();
    return;
  }
  redoStack = [{ label: last.label, project: structuredClone(project) }, ...redoStack].slice(0, 25);
  undoStack = undoStack.slice(1);
  lastMessage = `Undid ${last.label}.`;
  restoreProjectSnapshot(last.project);
}

function redoLastChange(): void {
  const next = redoStack[0];
  if (!next) {
    lastMessage = 'Nothing to redo.';
    render();
    return;
  }
  undoStack = [{ label: next.label, project: structuredClone(project) }, ...undoStack].slice(0, 25);
  redoStack = redoStack.slice(1);
  lastMessage = `Redid ${next.label}.`;
  restoreProjectSnapshot(next.project);
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

function saveJson(which: ListSplatFile = project): void {
  downloadFile(
    `${which.metadata.title || 'listsplat-project'}.listsplat.json`,
    JSON.stringify(which, null, 2),
    'application/json',
  );
}

function saveCsv(): void {
  downloadFile(`${activeTable().name}.csv`, tableToCsv(activeTable()), 'text/csv;charset=utf-8');
}

// Export only the records currently shown (found set), respecting hidden fields.
function saveFoundCsv(): void {
  const table = activeTable();
  const fields = table.fields.filter((field) => !field.hidden);
  const rows = visibleRecords(table);
  const header = fields.map((field) => escapeCsvCell(field.name)).join(',');
  const body = rows
    .map((record) => fields.map((field) => escapeCsvCell(displayValue(table, record, field.id))).join(','))
    .join('\n');
  downloadFile(`${table.name}-found.csv`, `${header}\n${body}`, 'text/csv;charset=utf-8');
  lastMessage = `Exported ${rows.length} shown record${rows.length === 1 ? '' : 's'} to CSV.`;
  render();
}

function saveMarkdown(): void {
  const table = activeTable();
  const fields = table.fields.filter((field) => !field.hidden);
  const rows = visibleRecords(table);
  const escapeCell = (value: unknown) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const header = `| ${fields.map((field) => escapeCell(field.name)).join(' | ')} |`;
  const divider = `| ${fields.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((record) => `| ${fields.map((field) => escapeCell(displayValue(table, record, field.id))).join(' | ')} |`)
    .join('\n');
  downloadFile(`${table.name}.md`, `# ${table.name}\n\n${header}\n${divider}\n${body}\n`, 'text/markdown;charset=utf-8');
  lastMessage = 'Exported a Markdown table.';
  render();
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

function exportProjectPacket(): void {
  const qualitySections = project.schema.tables
    .map((table) => {
      const rows = dataQualityRows(table);
      const missing = rows.reduce((total, row) => total + row.missing, 0);
      const duplicates = rows.reduce((total, row) => total + row.duplicates, 0);
      return `
        <section>
          <h2>${html(table.name)}</h2>
          <p>${table.records.length} records, ${table.fields.length} fields, ${missing} missing values, ${duplicates} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${table.fields
              .map((field) => {
                const row = rows.find((item) => item.field.id === field.id);
                return `<tr><td>${html(field.name)}</td><td>${html(field.type)}</td><td>${field.required ? 'Yes' : 'No'}</td><td>${html(field.description)}</td><td>${row?.missing ?? 0}</td><td>${row?.duplicates ?? 0}</td></tr>`;
              })
              .join('')}</tbody>
          </table>
        </section>
      `;
    })
    .join('');
  const relationships = project.schema.relationships.length
    ? `<ul>${project.schema.relationships.map((relationship) => `<li>${html(relationship.name)}: ${html(relationshipLabel(project, relationship))}</li>`).join('')}</ul>`
    : '<p>No relationships have been created yet.</p>';
  const notes = project.teacher.notes.length
    ? `<ul>${project.teacher.notes.map((note) => `<li>${html(note)}</li>`).join('')}</ul>`
    : '<p>No teacher notes yet.</p>';
  const packet = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${html(project.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${html(project.metadata.title || 'ListSplat Project')} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${html(project.metadata.author || 'Not set')}</div>
    <div><strong>Class</strong><br>${html(project.metadata.className || 'Not set')}</div>
    <div><strong>Tables</strong><br>${project.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${project.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${notes}</section>
  <section><h2>Relationships</h2>${relationships}</section>
  ${qualitySections}
</body></html>`;
  downloadFile(`${project.metadata.title || 'listsplat'}-project-packet.html`, packet, 'text/html;charset=utf-8');
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
    const existing = activeTable();
    pendingCsvMap = table.fields.map((field) => {
      const samples = table.records.slice(0, 12).map((record) => String(record.values[field.id] ?? ''));
      const match = existing.fields.find((item) => item.name.trim().toLowerCase() === field.name.trim().toLowerCase());
      return {
        header: field.name,
        action: match ? 'existing' : 'new',
        type: guessFieldType(samples),
        fieldId: match?.id ?? '',
      };
    });
    pendingCsvKeyField = '';
    pendingCsvDupMode = 'add';
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
  readCsvMap();
  const source = pendingCsvTable;

  pushUndo('CSV import');
  if (mode === 'new') {
    // Build a new table from the columns the user chose to keep, with their types.
    const kept = pendingCsvMap.filter((column) => column.action !== 'skip');
    const newFields = kept.map((column, index) => {
      const sourceField = source.fields[pendingCsvMap.indexOf(column)];
      const field = createField(column.header || `Field ${index + 1}`, column.type);
      return { field, sourceFieldId: sourceField.id };
    });
    const records = source.records.map((record) =>
      createRecord(
        newFields.map((entry) => entry.field),
        Object.fromEntries(
          newFields.map((entry) => [entry.field.id, convertValueForType(record.values[entry.sourceFieldId], entry.field.type).value]),
        ),
      ),
    );
    const table: ListSplatTable = {
      id: createId('table'),
      name: source.name,
      fields: newFields.map((entry) => entry.field),
      records: records.length ? records : [createRecord(newFields.map((entry) => entry.field))],
    };
    activeTableId = table.id;
    activeRecordId = table.records[0]?.id ?? '';
    pendingCsvTable = null;
    clearFind();
    sortKeys = [];
    selectedRecordIds = new Set();
    dialog = 'none';
    lastMessage = `Imported ${table.records.length} records from ${pendingCsvFileName}.`;
    setProject({
      ...project,
      updatedAt: new Date().toISOString(),
      schema: { ...project.schema, tables: [...project.schema.tables, table] },
      layouts: [
        ...project.layouts,
        { id: createId('layout'), name: `${table.name} Table`, tableId: table.id, mode: 'table', locked: false },
        { id: createId('layout'), name: `${table.name} Form`, tableId: table.id, mode: 'form', locked: false },
      ],
    });
    return;
  }

  // Append: create any "new" fields the user mapped, then map each CSV column to a target field.
  let table = activeTable();
  pendingCsvMap.forEach((column, index) => {
    if (column.action === 'new') {
      const created = createField(column.header || `Field ${index + 1}`, column.type);
      table = { ...table, fields: [...table.fields, created] };
      column.fieldId = created.id;
    }
  });
  const targetById = new Map(table.fields.map((field) => [field.id, field]));
  const appendedRecords = source.records.map((record) =>
    createRecord(
      table.fields,
      Object.fromEntries(
        pendingCsvMap
          .filter((column) => column.action !== 'skip' && column.fieldId && targetById.has(column.fieldId))
          .map((column, position) => {
            const sourceField = source.fields[pendingCsvMap.indexOf(column)];
            const target = targetById.get(column.fieldId)!;
            void position;
            return [column.fieldId, convertValueForType(record.values[sourceField.id], target.type, target.options).value];
          }),
      ),
    ),
  );
  pendingCsvTable = null;
  dialog = 'none';
  // Duplicate handling on a chosen key field: add all, skip matches, or update matches.
  const keyField = pendingCsvKeyField && targetById.has(pendingCsvKeyField) ? pendingCsvKeyField : '';
  if (keyField && pendingCsvDupMode !== 'add') {
    const keyOf = (record: ListSplatRecord) => String(record.values[keyField] ?? '').trim().toLowerCase();
    const byKey = new Map(table.records.map((record) => [keyOf(record), record.id]));
    let existingRecords = [...table.records];
    let added = 0;
    let updated = 0;
    let skipped = 0;
    appendedRecords.forEach((incoming) => {
      const key = keyOf(incoming);
      const matchId = key ? byKey.get(key) : undefined;
      if (matchId && pendingCsvDupMode === 'skip') {
        skipped += 1;
      } else if (matchId && pendingCsvDupMode === 'update') {
        existingRecords = existingRecords.map((record) =>
          record.id === matchId ? { ...record, updatedAt: new Date().toISOString(), values: { ...record.values, ...incoming.values } } : record,
        );
        updated += 1;
      } else {
        existingRecords.push(incoming);
        if (key) byKey.set(key, incoming.id);
        added += 1;
      }
    });
    lastMessage = `Import: ${added} added, ${updated} updated, ${skipped} skipped.`;
    setActiveTable({ ...table, records: existingRecords });
    return;
  }
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
    ['time', 'Time'],
    ['dateTime', 'Date and time'],
    ['checkbox', 'Checkbox'],
    ['rating', 'Rating'],
    ['choice', 'Single choice'],
    ['multiSelect', 'Multiple choice'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['link', 'Web address'],
    ['image', 'Image'],
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
    return evaluateSimpleFormula(field.formula, table, record, project);
  }
  return record.values[fieldId] ?? '';
}

// Friendly formatting for read-only views (cards, labels). Editable table/form
// cells keep raw values so number inputs still work.
function formatReadValue(field: ListSplatField | undefined, value: ListSplatCellValue): string {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  if (!field) {
    return String(value);
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (field.type === 'currency' && Number.isFinite(numeric)) {
    return numeric.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }
  if (field.type === 'percent' && Number.isFinite(numeric)) {
    return `${numeric.toLocaleString()}%`;
  }
  if (field.type === 'number' && Number.isFinite(numeric)) {
    return numeric.toLocaleString();
  }
  if (field.type === 'checkbox') {
    return value === true || value === 'true' ? 'Yes' : 'No';
  }
  return String(value);
}

function currentLayout() {
  return project.layouts.find((layout) => layout.tableId === activeTableId && layout.mode === viewMode);
}

function isField(value: ListSplatField | undefined): value is ListSplatField {
  return Boolean(value);
}

function orderedFields(table: ListSplatTable): ListSplatField[] {
  const hiddenFieldIds = new Set(currentLayout()?.hiddenFieldIds ?? []);
  return layoutFields(table).filter((field) => !hiddenFieldIds.has(field.id));
}

function layoutFields(table: ListSplatTable): ListSplatField[] {
  const layout = currentLayout();
  const order = layout?.fieldOrder ?? table.fields.map((field) => field.id);
  const byId = new Map(table.fields.map((field) => [field.id, field]));
  return [
    ...order.map((fieldId) => byId.get(fieldId)).filter(isField),
    ...table.fields.filter((field) => !order.includes(field.id)),
  ].filter((field) => field && !field.hidden);
}

function calculationFields(table: ListSplatTable): ListSplatField[] {
  return table.fields.filter((field) => field.type === 'calculation');
}

function formulaErrorCount(table: ListSplatTable): number {
  return calculationFields(table).reduce((total, field) => {
    if (!field.formula) return total;
    return (
      total +
      table.records.filter((record) => String(evaluateSimpleFormula(field.formula ?? '', table, record, project)).startsWith('Formula error:')).length
    );
  }, 0);
}

function dataQualityRows(table: ListSplatTable): Array<{ field: ListSplatField; missing: number; duplicates: number }> {
  return table.fields
    .filter((field) => !field.hidden && !['image', 'autoNumber', 'createdAt', 'updatedAt', 'calculation'].includes(field.type))
    .map((field) => ({
      field,
      missing: findMissingRecords(table, field.id).length,
      duplicates: findDuplicateRecords(table, field.id).length,
    }));
}

function imageFields(table: ListSplatTable): ListSplatField[] {
  return orderedFields(table).filter((field) => field.type === 'image');
}

function firstImageValue(table: ListSplatTable, record: ListSplatRecord): string {
  const imageField = imageFields(table)[0];
  return imageField ? String(displayValue(table, record, imageField.id) ?? '') : '';
}

function updateCurrentLayout(updates: { fieldOrder?: string[]; hiddenFieldIds?: string[]; locked?: boolean; columnWidths?: Record<string, number> }): void {
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
  const invalid = field && !['checkbox', 'image', 'calculation', 'autoNumber', 'createdAt', 'updatedAt'].includes(field.type)
    ? validateCell(field, value, table, record.id)
    : '';
  const cellClass = invalid ? 'cell-input cell-invalid' : 'cell-input';
  const invalidAttr = invalid ? ` title="${html(invalid)}"` : '';
  const readonlyAttr = field?.readonly ? ' readonly disabled' : '';
  const maxLenAttr = field?.maxLength ? ` maxlength="${field.maxLength}"` : '';
  const extra = `${invalidAttr}${readonlyAttr}${maxLenAttr}`;

  if (field?.type === 'checkbox') {
    return `<input class="cell-checkbox" type="checkbox" ${common} ${field.readonly ? 'disabled' : ''} ${value === true || value === 'true' ? 'checked' : ''}>`;
  }
  if (field?.type === 'multiSelect') {
    const options = field.options?.length ? field.options : ['Yes', 'No'];
    const selected = new Set(String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean));
    return `<div class="multi-cell${invalid ? ' cell-invalid' : ''}" ${common}${invalid ? ` title="${html(invalid)}"` : ''}>${options
      .map(
        (option) =>
          `<label class="multi-chip${selected.has(option) ? ' on' : ''}"><input type="checkbox" class="multi-option" data-record-id="${record.id}" data-field-id="${fieldId}" data-multi-option="${html(option)}" ${selected.has(option) ? 'checked' : ''} ${field.readonly ? 'disabled' : ''}>${html(option)}</label>`,
      )
      .join('')}</div>`;
  }
  if (field?.type === 'time') {
    return `<input class="${cellClass}" type="time" ${common}${extra} value="${html(value)}">`;
  }
  if (field?.type === 'dateTime') {
    return `<input class="${cellClass}" type="datetime-local" ${common}${extra} value="${html(value)}">`;
  }
  if (field?.type === 'email') {
    const addr = String(value ?? '');
    return `<div class="link-cell"><input class="${cellClass}" type="email" ${common}${extra} value="${html(addr)}" placeholder="name@example.com">${
      addr && !invalid ? `<a class="link-open" href="mailto:${html(addr)}" title="Send email" aria-label="Send email">✉</a>` : ''
    }</div>`;
  }
  if (field?.type === 'phone') {
    return `<input class="${cellClass}" type="tel" ${common}${extra} value="${html(value)}" placeholder="(555) 555-5555">`;
  }
  if (field?.type === 'link') {
    const raw = String(value ?? '');
    const href = /^https?:\/\//i.test(raw) ? raw : raw ? `https://${raw}` : '';
    return `<div class="link-cell"><input class="${cellClass}" type="url" ${common}${extra} value="${html(raw)}" placeholder="https://…">${
      href ? `<a class="link-open" href="${html(href)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>` : ''
    }</div>`;
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
    return `<input class="${cellClass}" type="number" min="0" max="5" step="1" ${common}${extra} value="${html(value)}">`;
  }
  if (field?.type === 'choice') {
    const options = field.options?.length ? field.options : ['Yes', 'No'];
    return `<select class="${cellClass}" ${common}${invalidAttr}${field.readonly ? ' disabled' : ''}><option value=""${value === '' ? ' selected' : ''}>—</option>${options
      .map((option) => `<option value="${html(option)}" ${String(value) === option ? 'selected' : ''}>${html(option)}</option>`)
      .join('')}</select>`;
  }
  if (field?.type === 'autoNumber' || field?.type === 'createdAt' || field?.type === 'updatedAt') {
    return `<output class="calc-output">${html(value)}</output>`;
  }
  if (field?.type === 'longText') {
    return `<textarea class="${cellClass}" ${common}${extra}>${html(value)}</textarea>`;
  }
  if (field?.type === 'date') {
    return `<input class="${cellClass}" type="date" ${common}${extra} value="${html(value)}">`;
  }
  if (field?.type === 'number' || field?.type === 'currency' || field?.type === 'percent') {
    const prefix = field.type === 'currency' ? '<span class="cell-affix">$</span>' : '';
    const suffix = field.type === 'percent' ? '<span class="cell-affix">%</span>' : '';
    return `<span class="num-cell">${prefix}<input class="${cellClass}" type="number" step="any" ${common}${extra} value="${html(value)}">${suffix}</span>`;
  }
  if (field?.type === 'calculation') {
    return `<output class="calc-output">${html(value)}</output>`;
  }
  return `<input class="${cellClass}" ${common}${extra} value="${html(value)}">`;
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
  if (rows.length === 0) {
    const cleared = findIsActive();
    return `
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${cleared ? html(t('No records match your find')) : html(t('No records yet'))}</h3>
          <p>${
            cleared
              ? html(t('Try a different search, or show all records.'))
              : html(t('Add your first record to start building this database.'))
          }</p>
          <button type="button" class="button primary" data-action="${cleared ? 'clear-find' : 'add-record'}">${
            cleared ? html(t('Show all records')) : `+ ${html(t('Add first record'))}`
          }</button>
        </div>
      </div>
    `;
  }
  const fields = orderedFields(table);
  const allVisibleSelected = rows.length > 0 && rows.every((record) => selectedRecordIds.has(record.id));
  const sortMark = (fieldId: string) => {
    const key = sortKeys.find((item) => item.fieldId === fieldId);
    return key ? (key.direction === 'asc' ? '▲' : '▼') : '⇅';
  };
  const grouped = groupRecords(table, rows);
  const colCount = fields.length + 3;
  const renderRow = (record: ListSplatRecord, rowIndex: number) => `
                <tr class="${record.id === activeRecordId ? 'active-row' : ''}${selectedRecordIds.has(record.id) ? ' selected-row' : ''}" data-record-row="${record.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${record.id}" aria-label="Select record ${rowIndex + 1}" ${selectedRecordIds.has(record.id) ? 'checked' : ''}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${record.id}">${rowIndex + 1}</button></td>
                  ${fields
                    .map((field) => `<td style="${columnWidthStyle(field.id)}">${renderInput(table, record, field.id, rowIndex)}</td>`)
                    .join('')}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${record.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${record.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${record.id}">Delete</button>
                  </td>
                </tr>
              `;
  let rowNumber = 0;
  const bodyRows = grouped
    .map((group) => {
      const groupHeader = groupByFieldId
        ? `<tr class="group-row"><td colspan="${colCount}"><strong>${html(group.label)}</strong> <span>${group.records.length}${groupSummary(table, group.records) ? ' · ' + groupSummary(table, group.records) : ''}</span></td></tr>`
        : '';
      return groupHeader + group.records.map((record) => renderRow(record, rowNumber++)).join('');
    })
    .join('');
  return `
    <div class="data-grid-wrap${wrapText ? ' wrap-cells' : ''}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${allVisibleSelected ? 'checked' : ''}></th>
            <th class="row-num-col">#</th>
            ${fields
              .map(
                (field) => `
                  <th class="col-head" data-col-field="${field.id}" draggable="true" style="${columnWidthStyle(field.id)}">
                    <button type="button" class="field-button" data-field-settings="${field.id}">
                      ${html(field.name)}${field.required ? '<span class="req" title="Required field" aria-label="required">*</span>' : ''}<br><small>${html(field.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${field.id}" title="Sort by ${html(field.name)}">${sortMark(field.id)}</button>
                    <span class="col-resize" data-col-resize="${field.id}" title="Drag to resize" aria-hidden="true"></span>
                  </th>
                `,
              )
              .join('')}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </div>
  `;
}

function columnWidthStyle(fieldId: string): string {
  const width = currentLayout()?.columnWidths?.[fieldId];
  return width ? `width:${width}px;min-width:${width}px;` : '';
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
                  .slice(0, 8)
                  .map(
                    (relatedRecord) => `
                      <article class="related-card" data-action="open-related" data-rel-record="${relatedRecord.id}" data-rel-table="${targetTable!.id}">
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
          <button type="button" class="button" data-action="add-related" data-rel-id="${relationship.id}">+ Add ${html(targetTable?.name ?? 'related')} record</button>
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
    if (field.type === 'link' && String(value ?? '')) {
      const raw = String(value);
      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return `<p><strong>${html(field.name)}</strong><a href="${html(href)}" target="_blank" rel="noopener">${html(raw)}</a></p>`;
    }
    return `<p><strong>${html(field.name)}</strong><span>${html(formatReadValue(field, value))}</span></p>`;
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
                .map((field) => `<p><strong>${html(field.name)}:</strong> ${html(formatReadValue(field, displayValue(table, record, field.id)))}</p>`)
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

// ── View helpers and new views (Batch B) ────────────────────────────────────
function distinctValues(table: ListSplatTable, rows: ListSplatRecord[], fieldId: string): string[] {
  const seen = new Set<string>();
  rows.forEach((record) => {
    const value = String(displayValue(table, record, fieldId) ?? '').trim();
    if (value) seen.add(value);
  });
  return [...seen];
}

function groupRecords(
  table: ListSplatTable,
  rows: ListSplatRecord[],
): Array<{ key: string; label: string; records: ListSplatRecord[] }> {
  if (!groupByFieldId || !table.fields.some((field) => field.id === groupByFieldId)) {
    return [{ key: '', label: '', records: rows }];
  }
  const groups = new Map<string, ListSplatRecord[]>();
  rows.forEach((record) => {
    const key = String(displayValue(table, record, groupByFieldId) ?? '').trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(record);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([key, records]) => ({ key, label: key || '(empty)', records }));
}

function groupSummary(table: ListSplatTable, records: ListSplatRecord[]): string {
  const numberFields = table.fields.filter((field) => ['number', 'currency', 'percent'].includes(field.type) && !field.hidden);
  const bits = numberFields.slice(0, 3).map((field) => {
    const values = records.map((record) => Number(displayValue(table, record, field.id))).filter((value) => Number.isFinite(value));
    if (!values.length) return '';
    const sum = values.reduce((total, value) => total + value, 0);
    return `${html(field.name)}: sum ${sum.toLocaleString()}, avg ${(sum / values.length).toFixed(1)}`;
  }).filter(Boolean);
  return bits.join(' · ');
}

function fieldSelectOptions(fields: ListSplatField[], selected: string): string {
  return fields.map((field) => `<option value="${field.id}" ${selected === field.id ? 'selected' : ''}>${html(field.name)}</option>`).join('');
}

function renderViewControls(table: ListSplatTable): string {
  const parts: string[] = [];
  if (viewMode === 'list' || viewMode === 'table') {
    const groupable = table.fields.filter((field) => !field.hidden && !['image', 'longText'].includes(field.type));
    parts.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${fieldSelectOptions(groupable, groupByFieldId)}</select></label>`);
    parts.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${wrapText ? 'checked' : ''}> Wrap long text</label>`);
  }
  if (viewMode === 'kanban') {
    const columnable = table.fields.filter((field) => ['choice', 'text'].includes(field.type) && !field.hidden);
    parts.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${fieldSelectOptions(columnable, boardFieldId)}</select></label>`);
  }
  if (viewMode === 'calendar') {
    const datey = table.fields.filter((field) => ['date', 'dateTime', 'createdAt', 'updatedAt'].includes(field.type) && !field.hidden);
    parts.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${fieldSelectOptions(datey, calendarFieldId)}</select></label>`);
  }
  return parts.length ? `<div class="view-controls">${parts.join('')}</div>` : '';
}

function renderListView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  const fields = orderedFields(table);
  const primary = fields[0];
  const secondary = fields.find((field) => field.id !== primary?.id && !['image'].includes(field.type));
  const groups = groupRecords(table, rows);
  const body = groups
    .map(
      (group) => `
        ${groupByFieldId ? `<div class="group-head"><strong>${html(group.label)}</strong><span>${group.records.length}${groupSummary(table, group.records) ? ' · ' + groupSummary(table, group.records) : ''}</span></div>` : ''}
        ${group.records
          .map((record) => {
            const image = firstImageValue(table, record);
            return `
              <div class="list-row${record.id === activeRecordId ? ' active' : ''}">
                ${image ? `<img class="list-thumb" src="${html(image)}" alt="">` : ''}
                <div class="list-main">
                  <strong>${html(displayValue(table, record, primary?.id ?? '') || 'Untitled')}</strong>
                  ${secondary ? `<span>${html(formatReadValue(secondary, displayValue(table, record, secondary.id)))}</span>` : ''}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${record.id}">Open</button>
              </div>
            `;
          })
          .join('')}
      `,
    )
    .join('');
  return `<div class="list-view${wrapText ? ' wrap-cells' : ''}">${body || '<p class="empty-panel">No records to list.</p>'}</div>`;
}

function renderKanbanView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  const field = table.fields.find((item) => item.id === boardFieldId);
  if (!field) {
    return '<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>';
  }
  const columns = ['', ...((field.options && field.options.length ? field.options : distinctValues(table, rows, field.id)).filter(Boolean))];
  return `<div class="kanban">${columns
    .map((column) => {
      const cards = rows.filter((record) => String(displayValue(table, record, field.id) ?? '').trim() === column);
      return `
        <div class="kanban-col" data-kanban-col="${html(column)}">
          <div class="kanban-col-head"><strong>${html(column || 'Unassigned')}</strong><span>${cards.length}</span></div>
          <div class="kanban-cards">
            ${cards
              .map(
                (record) => `
                  <div class="kanban-card" draggable="true" data-kanban-card="${record.id}" data-action="expand-record" data-record-action-id="${record.id}">
                    <strong>${html(recordTitle(table, record))}</strong>
                  </div>
                `,
              )
              .join('')}
          </div>
        </div>
      `;
    })
    .join('')}</div>`;
}

function renderCalendarView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  const field = table.fields.find((item) => item.id === calendarFieldId)
    ?? table.fields.find((item) => ['date', 'dateTime', 'createdAt', 'updatedAt'].includes(item.type) && !item.hidden);
  if (!field) {
    return '<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>';
  }
  const base = calendarMonth ? new Date(`${calendarMonth}-01T00:00:00`) : new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDay = new Map<string, ListSplatRecord[]>();
  rows.forEach((record) => {
    const raw = String(displayValue(table, record, field.id) ?? '');
    const day = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day.startsWith(monthKey)) {
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(record);
    }
  });
  const cells: string[] = [];
  for (let i = 0; i < startDay; i += 1) cells.push('<div class="cal-cell empty"></div>');
  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = `${monthKey}-${String(d).padStart(2, '0')}`;
    const dayRecords = byDay.get(key) ?? [];
    cells.push(`
      <div class="cal-cell">
        <div class="cal-day">${d}</div>
        ${dayRecords
          .slice(0, 4)
          .map((record) => `<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${record.id}">${html(recordTitle(table, record))}</button>`)
          .join('')}
        ${dayRecords.length > 4 ? `<span class="cal-more">+${dayRecords.length - 4} more</span>` : ''}
      </div>
    `);
  }
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${html(monthLabel)}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${weekdays.map((day) => `<div class="cal-weekday">${day}</div>`).join('')}
        ${cells.join('')}
      </div>
    </div>
  `;
}

function shiftCalendarMonth(delta: number): void {
  const base = calendarMonth ? new Date(`${calendarMonth}-01T00:00:00`) : new Date();
  base.setMonth(base.getMonth() + delta);
  calendarMonth = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

function renderDatabasePanel(table: ListSplatTable): string {
  const rows = visibleRecords(table);
  const viewHelp: Record<ViewMode, string> = {
    table: 'Table: spreadsheet-like rows and columns for fast data entry.',
    form: 'Form: focus on one record at a time.',
    cards: 'Cards: compact text-first record cards for browsing.',
    gallery: 'Gallery: image-first cards for collections and exhibits.',
    list: 'List: compact rows grouped by a field.',
    kanban: 'Board: columns by status or category, drag cards to change them.',
    calendar: 'Calendar: records placed on a month grid by a date field.',
    labels: 'Labels: printable small cards or shelf labels.',
    report: 'Report: printable table with title and summaries.',
  };
  const body =
    viewMode === 'form'
      ? renderFormView(table)
      : viewMode === 'cards' || viewMode === 'gallery'
        ? renderCardsView(table, rows)
        : viewMode === 'list'
          ? renderListView(table, rows)
          : viewMode === 'kanban'
            ? renderKanbanView(table, rows)
            : viewMode === 'calendar'
              ? renderCalendarView(table, rows)
              : viewMode === 'labels'
                ? renderLabelsView(table, rows)
                : viewMode === 'report'
                  ? renderReportView(table, rows)
                  : renderTableView(table, rows);

  return `
    <section class="database-panel" aria-label="Database table">
      ${renderTableTabs(table)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${(['table', 'form', 'cards', 'gallery', 'list', 'kanban', 'calendar', 'labels', 'report'] as ViewMode[])
          .map(
            (mode) =>
              `<button type="button" class="${viewMode === mode ? 'active' : ''}" data-view-mode="${mode}" title="${html(viewHelp[mode])}" aria-label="${html(viewHelp[mode])}">${html(t(mode === 'kanban' ? 'Board' : mode[0].toUpperCase() + mode.slice(1)))}</button>`,
          )
          .join('')}
      </div>
      ${renderViewControls(table)}
      ${renderFilterChips()}
      ${renderBulkBar(table)}
      ${body}
    </section>
  `;
}

function renderFilterChips(): string {
  const chips: string[] = [];
  if (showArchived) {
    chips.push('<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>');
  }
  if (searchQuery) {
    chips.push(`<span class="chip">Search: “${html(searchQuery)}”</span>`);
  }
  if (findQuery && findQuery.rules.length) {
    const joiner = findQuery.match === 'all' ? ' AND ' : ' OR ';
    const text = findQuery.rules
      .map((rule) => `${fieldNameById(rule.fieldId)} ${operatorLabel(rule.operator)}${rule.operator === 'isEmpty' || rule.operator === 'isNotEmpty' ? '' : ' ' + rule.value}${rule.operator === 'between' ? '–' + (rule.value2 ?? '') : ''}`)
      .join(joiner);
    chips.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${html(text)}</button>`);
  }
  if (highlightedRecordIds.size) {
    chips.push(`<span class="chip">${highlightedRecordIds.size} highlighted</span>`);
  }
  sortKeys
    .filter((key) => activeTable().fields.some((field) => field.id === key.fieldId))
    .forEach((key) => {
      chips.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${html(fieldNameById(key.fieldId))} ${key.direction === 'asc' ? '↑' : '↓'}</button>`);
    });
  if (!chips.length) {
    return '';
  }
  return `<div class="filter-chips">${chips.join('')}${findIsActive() ? '<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>' : ''}${sortKeys.length ? '<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>' : ''}</div>`;
}

function renderBulkBar(table: ListSplatTable): string {
  const count = selectedInTable(table).length;
  if (count === 0 || viewMode === 'form') {
    return '';
  }
  return `
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${count} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${showArchived
        ? '<button type="button" class="button" data-action="bulk-restore">Restore</button>'
        : '<button type="button" class="button" data-action="bulk-archive">Archive</button>'}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
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

function renderRelationshipDiagram(): string {
  const tables = project.schema.tables;
  const relationships = project.schema.relationships;
  const tableName = (id: string) => tables.find((table) => table.id === id)?.name ?? 'table';
  const fieldName = (tableId: string, fieldId: string) =>
    tables.find((table) => table.id === tableId)?.fields.find((field) => field.id === fieldId)?.name ?? 'field';
  const relatedIds = new Set(relationships.flatMap((relationship) => [relationship.fromTableId, relationship.toTableId]));
  const boxes = tables
    .map(
      (table) => `
        <div class="rel-box${table.id === activeTableId ? ' active' : ''}${relatedIds.has(table.id) ? ' linked' : ''}">
          <strong>${html(table.name)}</strong>
          <span>${table.records.length} record${table.records.length === 1 ? '' : 's'} · ${table.fields.length} field${table.fields.length === 1 ? '' : 's'}</span>
        </div>
      `,
    )
    .join('');
  const links = relationships.length
    ? relationships
        .map(
          (relationship) => `
            <div class="rel-link">
              <span class="rel-badge">${html(tableName(relationship.fromTableId))}</span>
              <span class="rel-arrow">${html(fieldName(relationship.fromTableId, relationship.fromFieldId))} <b>1 → &#8734;</b> ${html(fieldName(relationship.toTableId, relationship.toFieldId))}</span>
              <span class="rel-badge">${html(tableName(relationship.toTableId))}</span>
            </div>
          `,
        )
        .join('')
    : '<p class="rel-empty">No links yet. Create one below to connect two tables.</p>';
  return `<div class="rel-diagram"><div class="rel-boxes">${boxes}</div><div class="rel-links">${links}</div></div>`;
}

function renderFormulaBuilder(table: ListSplatTable): string {
  const snippets: Array<[string, string]> = [
    ['Combine text', 'JOIN(A, " ", B)'],
    ['Add', 'ADD(A, B)'],
    ['Multiply', 'MULTIPLY(A, B)'],
    ['Percent', 'PERCENT(A, B)'],
    ['If / then', 'IF(CONTAINS(A, "x"), "yes", "no")'],
    ['Sum column', 'SUM(A)'],
    ['Average', 'AVERAGE(A)'],
    ['Count', 'COUNT(A)'],
    ['Years since', 'YEARS_BETWEEN(A)'],
    ['Uppercase', 'UPPER(A)'],
  ];
  const fields = table.fields.filter((field) => !['calculation'].includes(field.type)).slice(0, 12);
  return `
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${snippets
        .map(([label, snippet]) => `<button type="button" class="fb-chip" data-formula-insert="${html(snippet)}">${html(label)}</button>`)
        .join('')}</div>
      <div class="fb-row"><span>Insert field</span>${fields
        .map((field) => `<button type="button" class="fb-chip field" data-formula-insert="${html(field.name)}">${html(field.name)}</button>`)
        .join('')}</div>
    </div>
  `;
}

function renderFieldConstraints(field: ListSplatField, type: FieldType): string {
  const numeric = ['number', 'currency', 'percent', 'rating'].includes(type);
  const textish = ['text', 'longText', 'link'].includes(type);
  const lengthy = ['text', 'longText', 'email', 'phone', 'link'].includes(type);
  if (['calculation', 'autoNumber', 'createdAt', 'updatedAt', 'image'].includes(type)) {
    return '';
  }
  return `
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${field.unique ? 'checked' : ''}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${field.readonly ? 'checked' : ''}> Read-only (students cannot change it)</label>
      ${
        numeric
          ? `<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${field.min != null ? html(String(field.min)) : ''}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${field.max != null ? html(String(field.max)) : ''}"></label>
            </div>`
          : ''
      }
      ${lengthy ? `<label>Character limit <input data-field-maxlength type="number" min="1" value="${field.maxLength != null ? html(String(field.maxLength)) : ''}" placeholder="no limit"></label>` : ''}
      ${
        textish
          ? `<label>Format <select data-field-pattern>${(['none', 'email', 'url', 'phone', 'custom'] as const)
              .map((option) => `<option value="${option}" ${(field.pattern ?? 'none') === option ? 'selected' : ''}>${option}</option>`)
              .join('')}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${html(field.customPattern ?? '')}" placeholder="regular expression"></label>`
          : ''
      }
      <label>Default value for new records <input data-field-default value="${html(field.defaultValue ?? '')}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${html(field.customMessage ?? '')}" placeholder="optional friendly message"></label>
    </fieldset>
  `;
}

function renderTypeChangePreview(table: ListSplatTable, field: ListSplatField, nextType: FieldType): string {
  if (nextType === field.type || ['calculation', 'autoNumber', 'createdAt', 'updatedAt', 'image'].includes(nextType)) {
    return '';
  }
  const options = (appRoot.querySelector<HTMLInputElement>('[data-field-options]')?.value ?? field.options?.join(', ') ?? '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
  const samples = table.records
    .filter((record) => String(record.values[field.id] ?? '').trim() !== '')
    .slice(0, 4)
    .map((record) => {
      const before = String(record.values[field.id] ?? '');
      const converted = convertValueForType(record.values[field.id], nextType, options);
      const after = converted.value === true ? 'Yes' : converted.value === false ? 'No' : String(converted.value ?? '');
      return `<li><span>${html(before)}</span> → <span class="${converted.lost ? 'preview-lost' : ''}">${converted.lost ? 'cleared' : html(after || '(empty)')}</span></li>`;
    });
  const lostCount = table.records.filter((record) => {
    if (String(record.values[field.id] ?? '').trim() === '') return false;
    return convertValueForType(record.values[field.id], nextType, options).lost;
  }).length;
  return `
    <div class="type-preview">
      <strong>Change ${html(field.type)} → ${html(nextType)}</strong>
      ${samples.length ? `<ul>${samples.join('')}</ul>` : '<p>No values to convert yet.</p>'}
      ${lostCount ? `<p class="preview-warn">${lostCount} value${lostCount === 1 ? '' : 's'} cannot convert and will be cleared.</p>` : '<p>All values convert cleanly.</p>'}
    </div>
  `;
}

function renderFindDialog(table: ListSplatTable): string {
  const fieldOptions = (selected: string) =>
    table.fields.map((field) => `<option value="${field.id}" ${field.id === selected ? 'selected' : ''}>${html(field.name)}</option>`).join('');
  const rows = findDraft.rules
    .map((rule, index) => {
      const op = FIND_OPERATORS.find((item) => item.value === rule.operator) ?? FIND_OPERATORS[0];
      return `
        <div class="find-rule" data-rule-index="${index}">
          <select data-find-field aria-label="Field">${fieldOptions(rule.fieldId)}</select>
          <select data-find-op aria-label="Condition">${FIND_OPERATORS.map(
            (item) => `<option value="${item.value}" ${item.value === rule.operator ? 'selected' : ''}>${html(item.label)}</option>`,
          ).join('')}</select>
          <input data-find-value type="text" value="${html(rule.value)}" placeholder="value" ${op.needsValue ? '' : 'hidden'}>
          <input data-find-value2 type="text" value="${html(rule.value2 ?? '')}" placeholder="and" ${op.needsSecond ? '' : 'hidden'}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `;
    })
    .join('');
  return `
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${findDraft.match === 'all' ? 'selected' : ''}>all conditions (AND)</option>
          <option value="any" ${findDraft.match === 'any' ? 'selected' : ''}>any condition (OR)</option>
        </select></label>
        <div class="find-rules">${rows || '<p>Add a condition to start.</p>'}</div>
        <button type="button" class="button" data-action="find-add-rule">+ Add condition</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-find">Apply find</button>
          <button type="button" data-action="clear-find">Show all</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `;
}

function renderSortDialog(table: ListSplatTable): string {
  const fieldOptions = (selected: string) =>
    table.fields.map((field) => `<option value="${field.id}" ${field.id === selected ? 'selected' : ''}>${html(field.name)}</option>`).join('');
  const rows = sortDraft
    .map(
      (key, index) => `
        <div class="sort-level" data-level-index="${index}">
          <span class="sort-level-num">${index === 0 ? 'Sort by' : 'then by'}</span>
          <select data-sort-level-field aria-label="Sort field">${fieldOptions(key.fieldId)}</select>
          <select data-sort-level-dir aria-label="Direction">
            <option value="asc" ${key.direction === 'asc' ? 'selected' : ''}>A → Z / low → high</option>
            <option value="desc" ${key.direction === 'desc' ? 'selected' : ''}>Z → A / high → low</option>
          </select>
          <button type="button" class="button ghost" data-action="sort-remove-level">Remove</button>
        </div>
      `,
    )
    .join('');
  return `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${rows || '<p>Add a sort level to order records.</p>'}</div>
        <button type="button" class="button" data-action="sort-add-level">+ Add sort level</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-sort">Apply sort</button>
          <button type="button" data-action="clear-sort">Clear sort</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `;
}

function renderViewsDialog(): string {
  const views = savedViews();
  return `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${
            views.length
              ? views
                  .map(
                    (view) => `
                      <div class="saved-view" data-view-id="${view.id}">
                        <div><strong>${html(view.name)}</strong><span>${html(view.mode)}${view.sortKeys.length ? ` · sorted` : ''}${view.find && view.find.rules.length ? ` · found` : ''}</span></div>
                        <button type="button" class="button" data-action="apply-view" data-view-id="${view.id}">Open</button>
                        <button type="button" class="button ghost" data-action="delete-view" data-view-id="${view.id}">Delete</button>
                      </div>
                    `,
                  )
                  .join('')
              : '<p>No saved views yet.</p>'
          }
        </div>
        <label>Name this view <input data-view-name placeholder="e.g. Needs review"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="save-view">Save current view</button>
          <button type="button" data-action="close-dialog">Close</button>
        </div>
      </section>
    </div>
  `;
}

function renderBulkFillDialog(table: ListSplatTable): string {
  const count = selectedInTable(table).length;
  return `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${count} selected record${count === 1 ? '' : 's'}.</p>
        <label>Field <select data-bulk-field>${table.fields
          .filter((field) => !['calculation', 'autoNumber', 'createdAt', 'updatedAt'].includes(field.type))
          .map((field) => `<option value="${field.id}">${html(field.name)}</option>`)
          .join('')}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `;
}

// ── Charts (Batch C) ─────────────────────────────────────────────────────────
function chartData(table: ListSplatTable): Array<{ label: string; value: number }> {
  const categoryField = table.fields.find((field) => field.id === chartCategoryField);
  if (!categoryField) {
    return [];
  }
  const rows = visibleRecords(table);
  const buckets = new Map<string, number>();
  rows.forEach((record) => {
    const label = String(displayValue(table, record, categoryField.id) ?? '').trim() || '(empty)';
    let value = 1;
    if (chartValueMode === 'sum' && chartValueField) {
      const numeric = Number(displayValue(table, record, chartValueField));
      value = Number.isFinite(numeric) ? numeric : 0;
    }
    buckets.set(label, (buckets.get(label) ?? 0) + value);
  });
  return [...buckets.entries()].map(([label, value]) => ({ label, value })).slice(0, 24);
}

const CHART_COLORS = ['#7c3aed', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2', '#65a30d', '#ea580c', '#db2777'];

function renderChartSvg(data: Array<{ label: string; value: number }>): string {
  if (!data.length) {
    return '<p class="empty-panel">Choose a category field to build a chart.</p>';
  }
  const max = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  if (chartType === 'pie') {
    const cx = 150;
    const cy = 130;
    const radius = 110;
    let angle = -Math.PI / 2;
    const slices = data
      .map((item, index) => {
        const slice = (item.value / total) * Math.PI * 2;
        const x1 = cx + radius * Math.cos(angle);
        const y1 = cy + radius * Math.sin(angle);
        angle += slice;
        const x2 = cx + radius * Math.cos(angle);
        const y2 = cy + radius * Math.sin(angle);
        const large = slice > Math.PI ? 1 : 0;
        return `<path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${radius} ${radius} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${CHART_COLORS[index % CHART_COLORS.length]}"></path>`;
      })
      .join('');
    return `<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${slices}</svg>`;
  }
  const width = 520;
  const height = 260;
  const pad = 30;
  const barW = (width - pad * 2) / data.length;
  if (chartType === 'line') {
    const points = data
      .map((item, index) => {
        const x = pad + barW * index + barW / 2;
        const y = height - pad - (item.value / max) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${points}"></polyline>
      ${data.map((item, index) => { const x = pad + barW * index + barW / 2; const y = height - pad - (item.value / max) * (height - pad * 2); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#5b21b6"></circle>`; }).join('')}
    </svg>`;
  }
  const bars = data
    .map((item, index) => {
      const x = pad + barW * index + 4;
      const barHeight = (item.value / max) * (height - pad * 2);
      const y = height - pad - barHeight;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 8).toFixed(1)}" height="${barHeight.toFixed(1)}" rx="4" fill="${CHART_COLORS[index % CHART_COLORS.length]}"></rect>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="Bar chart">${bars}<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d8d2ff"></line></svg>`;
}

function renderChartsDialog(table: ListSplatTable): string {
  const categorical = table.fields.filter((field) => !field.hidden && !['image', 'longText', 'calculation'].includes(field.type));
  const numberFields = table.fields.filter((field) => ['number', 'currency', 'percent', 'rating'].includes(field.type));
  const data = chartData(table);
  return `
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${visibleRecords(table).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${(['bar', 'pie', 'line'] as const).map((option) => `<option value="${option}" ${chartType === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${categorical.map((field) => `<option value="${field.id}" ${chartCategoryField === field.id ? 'selected' : ''}>${html(field.name)}</option>`).join('')}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${chartValueMode === 'count' ? 'selected' : ''}>count records</option><option value="sum" ${chartValueMode === 'sum' ? 'selected' : ''}>sum a number</option></select></label>
          ${chartValueMode === 'sum' ? `<label>Number field <select data-chart-value-field><option value="">Choose</option>${numberFields.map((field) => `<option value="${field.id}" ${chartValueField === field.id ? 'selected' : ''}>${html(field.name)}</option>`).join('')}</select></label>` : ''}
        </div>
        <div class="chart-area">${renderChartSvg(data)}</div>
        ${
          data.length
            ? `<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${data
                .map((item) => `<tr><td>${html(item.label)}</td><td>${item.value.toLocaleString()}</td></tr>`)
                .join('')}</tbody></table>`
            : ''
        }
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `;
}

function renderDialog(table: ListSplatTable): string {
  if (dialog === 'none') {
    return '';
  }

  if (dialog === 'find') {
    return renderFindDialog(table);
  }
  if (dialog === 'sort') {
    return renderSortDialog(table);
  }
  if (dialog === 'views') {
    return renderViewsDialog();
  }
  if (dialog === 'bulkFill') {
    return renderBulkFillDialog(table);
  }
  if (dialog === 'charts') {
    return renderChartsDialog(table);
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
    const previewType = (fieldDialogType || field.type) as FieldType;
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${html(field.name)}"></label>
          <label>Type <select data-field-type>${fieldTypeOptions(previewType)}</select></label>
          ${renderTypeChangePreview(table, field, previewType)}
          <label>Description <textarea data-field-description>${html(field.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${html(field.options?.join(', ') ?? '')}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${field.required ? 'checked' : ''}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${field.hidden ? 'checked' : ''}> Hide field</label>
          ${renderFieldConstraints(field, previewType)}
          <label>Calculation formula <input data-field-formula value="${html(field.formula ?? '')}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${previewType === 'calculation' ? renderFormulaBuilder(table) : ''}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
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
    const fields = layoutFields(table);
    const hiddenFieldIds = new Set(layout?.hiddenFieldIds ?? []);
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${html(viewMode)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${layout?.locked ? 'checked' : ''}> Lock this layout</label>
          <div class="layout-field-list">
            ${fields
              .map(
                (field, index) => `
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${field.id}" ${hiddenFieldIds.has(field.id) ? '' : 'checked'}> <strong>${html(field.name)}</strong></label>
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
    const previewRows = pendingCsvTable.records.slice(0, 4);
    const existingOptions = (selected: string) =>
      table.fields.map((field) => `<option value="${field.id}" ${field.id === selected ? 'selected' : ''}>${html(field.name)}</option>`).join('');
    const mapRows = pendingCsvMap
      .map(
        (column, index) => `
          <div class="csv-map-row" data-map-index="${index}">
            <span class="csv-map-header">${html(column.header || `Column ${index + 1}`)}</span>
            <select data-map-action aria-label="What to do with ${html(column.header)}">
              <option value="new" ${column.action === 'new' ? 'selected' : ''}>New field</option>
              <option value="existing" ${column.action === 'existing' ? 'selected' : ''}>Existing field</option>
              <option value="skip" ${column.action === 'skip' ? 'selected' : ''}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${html(column.header)}" ${column.action === 'new' ? '' : 'hidden'}>${fieldTypeOptions(column.type)}</select>
            <select data-map-existing aria-label="Existing field for ${html(column.header)}" ${column.action === 'existing' ? '' : 'hidden'}>${existingOptions(column.fieldId)}</select>
          </div>
        `,
      )
      .join('');
    return `
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${html(pendingCsvFileName)} has ${pendingCsvTable.fields.length} column${pendingCsvTable.fields.length === 1 ? '' : 's'} and ${pendingCsvTable.records.length} row${pendingCsvTable.records.length === 1 ? '' : 's'}. Choose how each column maps.</p>
          <div class="csv-map">${mapRows}</div>
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
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${html(table.name)} using your field mapping.</p>
          <div class="csv-dup">
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${table.fields
              .filter((field) => !['image', 'calculation', 'autoNumber', 'createdAt', 'updatedAt'].includes(field.type))
              .map((field) => `<option value="${field.id}" ${pendingCsvKeyField === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
              .join('')}</select></label>
            <label>Duplicates <select data-csv-dup ${pendingCsvKeyField ? '' : 'disabled'}>
              <option value="add" ${pendingCsvDupMode === 'add' ? 'selected' : ''}>always add</option>
              <option value="skip" ${pendingCsvDupMode === 'skip' ? 'selected' : ''}>skip matches</option>
              <option value="update" ${pendingCsvDupMode === 'update' ? 'selected' : ''}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${html(table.name)}</button>
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
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${renderRelationshipDiagram()}
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

  if (dialog === 'functions') {
    const fields = table.fields.filter((field) => !['image', 'createdAt', 'updatedAt'].includes(field.type));
    const firstTextField = fields.find((field) => ['text', 'longText', 'choice'].includes(field.type)) ?? fields[0];
    const firstNumberField = fields.find((field) => ['number', 'currency', 'percent', 'rating'].includes(field.type)) ?? firstTextField;
    const textName = firstTextField?.name ?? 'Field';
    const numberName = firstNumberField?.name ?? 'Score';
    return `
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${html(textName)})</code>
              <code>JOIN(${html(textName)}, " report")</code>
              <code>UPPER(${html(textName)})</code>
              <code>TITLECASE(${html(textName)})</code>
              <code>CONTAINS(${html(textName)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${html(numberName)}, "5")</code>
              <code>SUBTRACT(${html(numberName)}, "1")</code>
              <code>MULTIPLY(${html(numberName)}, "2")</code>
              <code>DIVIDE(${html(numberName)}, "2")</code>
              <code>ROUND(${html(numberName)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${html(numberName)})</code>
              <code>AVERAGE(${html(numberName)})</code>
              <code>MIN(${html(numberName)})</code>
              <code>MAX(${html(numberName)})</code>
              <code>COUNT(${html(numberName)})</code>
            </div>
            <div>
              <strong>Relationships</strong>
              <code>COUNT_RELATED("Relationship name")</code>
              <code>LOOKUP("Relationship name", Field)</code>
              <span>Use these after creating a relationship from Tools.</span>
            </div>
          </div>
          <p>To use one, add a new field, choose <strong>Calculation</strong>, then paste a formula into Field settings.</p>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `;
  }

  if (dialog === 'quality') {
    const rows = dataQualityRows(table);
    const errors = formulaErrorCount(table);
    const totalMissing = rows.reduce((total, row) => total + row.missing, 0);
    const totalDuplicates = rows.reduce((total, row) => total + row.duplicates, 0);
    const invalidCount = tableValidationIssues(table).length;
    return `
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Data quality check">
          <h2>Data quality check</h2>
          <p>Use this before printing a report or exporting CSV. Click a count to highlight the records that need attention.</p>
          <div class="quality-summary">
            <div><strong>${totalMissing}</strong><span>missing values</span></div>
            <div><strong>${totalDuplicates}</strong><span>duplicate values</span></div>
            <div><strong>${errors}</strong><span>formula errors</span></div>
            <div><button type="button" data-action="highlight-invalid" ${invalidCount ? '' : 'disabled'}><strong>${invalidCount}</strong><span>rule problems</span></button></div>
          </div>
          <div class="quality-table" role="table" aria-label="Field quality">
            <div class="quality-row quality-head" role="row">
              <span>Field</span><span>Missing</span><span>Duplicates</span>
            </div>
            ${
              rows.length
                ? rows
                    .map(
                      ({ field, missing, duplicates }) => `
                        <div class="quality-row" role="row">
                          <span><strong>${html(field.name)}</strong><small>${html(field.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${field.id}" ${missing ? '' : 'disabled'}>${missing}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${field.id}" ${duplicates ? '' : 'disabled'}>${duplicates}</button>
                        </div>
                      `,
                    )
                    .join('')
                : '<p class="empty-panel">No editable data fields are available yet.</p>'
            }
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `;
  }

  if (dialog === 'teacherNotes') {
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${html(project.teacher.notes.join('\n'))}</textarea></label>
          <div class="modal-actions">
            <button type="button" data-action="save-teacher-notes">Save notes</button>
            <button type="button" data-action="close-dialog">Cancel</button>
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
  const studentView = project.teacher.studentView;
  appRoot.innerHTML = `
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${undoStack.length ? '' : ' disabled'} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${html(t('Undo'))}</button>
        <button type="button" class="button" data-action="redo-change"${redoStack.length ? '' : ' disabled'} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${html(t('Redo'))}</button>
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
          ['import-csv', 'Import CSV or TSV'],
          ['export-csv', 'Export table CSV'],
          ['export-found-csv', 'Export shown records CSV'],
          ['export-markdown', 'Export Markdown table'],
          ['export-report', 'Export report HTML'],
          ['print', 'Print'],
        ])}
        ${createMenu('Edit', [
          ['undo-change', 'Undo last change'],
          ['redo-change', 'Redo last change'],
          ['add-record', 'Add record'],
          ['add-field', 'Add field'],
          ['find', 'Find records'],
          ['replace', 'Replace values'],
        ])}
        ${createMenu('Data', [
          ['add-table', 'New table'],
          ['rename-table', 'Rename this table'],
          ['duplicate-table', 'Duplicate this table'],
          ['move-table-left', 'Move table left'],
          ['move-table-right', 'Move table right'],
          ['delete-table', 'Delete this table'],
          ['sort', 'Sort records'],
          ['missing', 'Find missing values'],
          ['duplicates', 'Find duplicates'],
          ['toggle-archived', showArchived ? 'Show active records' : `Show archived records (${archivedCount(table)})`],
          ['structure-copy', 'Save structure-only copy'],
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
          ['charts', 'Charts'],
          ['quality', 'Data quality check'],
        ])}
        ${createMenu('View', [
          ['student-view', studentView ? 'Exit student view' : 'Student view'],
          ['teacher-notes', 'Teacher notes'],
        ])}
        <span class="menu-spacer"></span>
        ${
          studentView
            ? ''
            : createMenu('Teacher', [
                ['templates', 'Template Library'],
                ['project-ideas', 'Project Ideas'],
                ['lock-layout', 'Lock Layout'],
                ['project-packet', 'Print Project Packet'],
              ])
        }
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
          .map((field) => `<option value="${field.id}" ${sortKeys[0]?.fieldId === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
          .join('')}</select></label>
        <button type="button" data-action="toggle-sort" title="${html(t('Sort direction'))}">${sortKeys[0]?.direction === 'desc' ? 'Z-A' : 'A-Z'}</button>
        <button type="button" data-action="sort-dialog" title="${html(t('Sort by more than one field'))}">${html(t('Sort…'))}</button>
        <button type="button" data-action="find" title="${html(t('Advanced find with conditions'))}">${html(t('Find…'))}</button>
        <button type="button" data-action="views" title="${html(t('Save and reuse this view'))}">${html(t('Views'))}</button>
        <label>${html(t('New field'))} <input data-new-field placeholder="${html(t('Field name'))}"></label>
        <label>${html(t('Type'))} <select data-new-field-type>${fieldTypeOptions()}</select></label>
        <button type="button" data-action="add-field">${html(t('Add field'))}</button>
        <button type="button" data-action="add-record">${html(t('Add record'))}</button>
      </section>
      <div class="workspace${studentView ? ' student-workspace' : ''}">
        ${renderDatabasePanel(table)}
        ${studentView ? '' : renderTeacherPanel(table)}
      </div>
      <footer class="status-bar">
        <span>${html(table.name)}: ${visibleRecords(table).length} shown of ${table.records.length} records, ${table.fields.length} fields</span>
        ${studentView ? '<span>Student view hides teacher notes and teacher tools.</span>' : ''}
        <span>${html(lastMessage)}</span>
        <span>${saveStatus}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${renderDialog(table)}
  `;
  activeCellDirtyKey = '';
  if (pendingFocusCell) {
    const target = pendingFocusCell;
    pendingFocusCell = null;
    focusGridCell(target.recordId, target.fieldId);
  }
  paintCellRange();
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

// Shrink and re-encode large images before storing so they do not bloat the
// browser autosave. Small images are kept as-is.
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (file.size <= 350_000) {
        resolve(dataUrl);
        return;
      }
      const image = new Image();
      image.onerror = () => resolve(dataUrl);
      image.onload = () => {
        const maxDim = 1280;
        const longest = Math.max(image.width, image.height);
        const scale = longest > maxDim ? maxDim / longest : 1;
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function storeImageFile(recordId: string, fieldId: string, file: File, undoLabel: string): void {
  if (!file.type.startsWith('image/')) {
    lastMessage = 'That clipboard item is not an image.';
    render();
    return;
  }
  compressImageFile(file)
    .then((src) => {
      pushUndo(undoLabel);
      project = replaceTable(project, updateCell(activeTable(), recordId, fieldId, src));
      saveAutosave(project);
      const kb = Math.round(src.length / 1024);
      lastMessage = kb > 900
        ? `Image saved (about ${kb} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`
        : 'Image saved in this field.';
      render();
    })
    .catch(() => {
      lastMessage = 'Could not read that image.';
      render();
    });
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
  const unique = appRoot.querySelector<HTMLInputElement>('[data-field-unique]')?.checked ?? false;
  const minRaw = appRoot.querySelector<HTMLInputElement>('[data-field-min]')?.value ?? '';
  const maxRaw = appRoot.querySelector<HTMLInputElement>('[data-field-max]')?.value ?? '';
  const min = minRaw.trim() === '' ? undefined : Number(minRaw);
  const max = maxRaw.trim() === '' ? undefined : Number(maxRaw);
  const pattern = (appRoot.querySelector<HTMLSelectElement>('[data-field-pattern]')?.value as ListSplatField['pattern']) ?? 'none';
  const customPattern = appRoot.querySelector<HTMLInputElement>('[data-field-custom-pattern]')?.value ?? '';
  const defaultValue = appRoot.querySelector<HTMLInputElement>('[data-field-default]')?.value ?? '';
  const readonly = appRoot.querySelector<HTMLInputElement>('[data-field-readonly]')?.checked ?? false;
  const maxLengthRaw = appRoot.querySelector<HTMLInputElement>('[data-field-maxlength]')?.value ?? '';
  const maxLength = maxLengthRaw.trim() === '' ? undefined : Number(maxLengthRaw);
  const customMessage = appRoot.querySelector<HTMLInputElement>('[data-field-message]')?.value ?? '';
  const typeChanged = type !== field.type;
  let nextTable = updateField(table, field.id, {
    name,
    type,
    description,
    required,
    hidden,
    formula,
    options,
    unique,
    min,
    max,
    pattern,
    customPattern,
    defaultValue,
    readonly,
    maxLength,
    customMessage,
  });
  if (typeChanged && !['calculation', 'autoNumber', 'createdAt', 'updatedAt', 'image'].includes(type)) {
    nextTable = convertFieldValues(nextTable, field.id, type, options);
  }
  setActiveTable(nextTable);
  dialog = 'none';
  lastMessage = typeChanged ? `Updated ${name} and converted values to ${type}.` : `Updated ${name}.`;
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

function runTeacherNotesSave(): void {
  const noteText = appRoot.querySelector<HTMLTextAreaElement>('[data-teacher-notes]')?.value ?? '';
  const notes = noteText
    .split('\n')
    .map((note) => note.trim())
    .filter(Boolean);
  pushUndo('teacher notes');
  dialog = 'none';
  lastMessage = `Saved ${notes.length} teacher note${notes.length === 1 ? '' : 's'}.`;
  setProject({
    ...project,
    updatedAt: new Date().toISOString(),
    teacher: {
      ...project.teacher,
      notes,
    },
  });
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

function cssEscape(value: string): string {
  return window.CSS && typeof CSS.escape === 'function' ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&');
}

function focusGridCell(recordId: string, fieldId: string): boolean {
  const grid = appRoot.querySelector('.data-grid');
  if (!grid) return false;
  const row = grid.querySelector<HTMLElement>(`tr[data-record-row="${cssEscape(recordId)}"]`);
  if (!row) return false;
  let cell = row.querySelector<HTMLElement>(`.cell-input[data-field-id="${cssEscape(fieldId)}"], .cell-checkbox[data-field-id="${cssEscape(fieldId)}"]`);
  if (!cell) {
    // The target column may be read-only (calculation/auto/image); fall back to the row's first editable cell.
    cell = row.querySelector<HTMLElement>('.cell-input, .cell-checkbox');
  }
  if (!cell) return false;
  cell.focus();
  if (cell instanceof HTMLInputElement && cell.type !== 'checkbox') {
    cell.select();
  }
  return true;
}

function addRecordAndFocus(fieldId: string): void {
  pushUndo('add record');
  const nextTable = addRecord(activeTable());
  const newRecord = nextTable.records.at(-1);
  if (newRecord) {
    activeRecordId = newRecord.id;
    pendingFocusCell = { recordId: newRecord.id, fieldId };
  }
  setActiveTable(nextTable);
}

// Move focus between grid cells. rowDelta moves up/down within a column,
// colDelta moves left/right across columns (wrapping to the next/previous row),
// and moving past the last cell adds a new record for fast keyboard entry.
function moveGridCell(recordId: string, fieldId: string, rowDelta: number, colDelta: number): void {
  const rows = Array.from(appRoot.querySelectorAll<HTMLElement>('.data-grid tbody tr[data-record-row]'));
  const rowIndex = rows.findIndex((row) => row.dataset.recordRow === recordId);
  const fieldIds = orderedFields(activeTable()).map((field) => field.id);
  const colIndex = fieldIds.indexOf(fieldId);
  if (rowIndex < 0 || colIndex < 0) return;

  let targetRow = rowIndex + rowDelta;
  let targetCol = colIndex + colDelta;
  if (colDelta > 0 && targetCol >= fieldIds.length) {
    targetCol = 0;
    targetRow = rowIndex + 1;
  } else if (colDelta < 0 && targetCol < 0) {
    targetCol = fieldIds.length - 1;
    targetRow = rowIndex - 1;
  }

  if (targetRow >= rows.length) {
    addRecordAndFocus(fieldIds[targetCol] ?? fieldIds[0]);
    return;
  }
  if (targetRow < 0) return;
  const targetRecordId = rows[targetRow].dataset.recordRow ?? recordId;
  focusGridCell(targetRecordId, fieldIds[targetCol] ?? fieldId);
}

// ── Cell-range selection (Excel-style) ───────────────────────────────────────
function rangeBounds(): { rows: string[]; cols: string[]; r1: number; r2: number; c1: number; c2: number } | null {
  if (!cellRange) {
    return null;
  }
  const rows = visibleRecords(activeTable()).map((record) => record.id);
  const cols = orderedFields(activeTable()).map((field) => field.id);
  const ar = rows.indexOf(cellRange.anchor.r);
  const fr = rows.indexOf(cellRange.focus.r);
  const ac = cols.indexOf(cellRange.anchor.f);
  const fc = cols.indexOf(cellRange.focus.f);
  if (ar < 0 || fr < 0 || ac < 0 || fc < 0) {
    return null;
  }
  return { rows, cols, r1: Math.min(ar, fr), r2: Math.max(ar, fr), c1: Math.min(ac, fc), c2: Math.max(ac, fc) };
}

function paintCellRange(): void {
  appRoot.querySelectorAll('.data-grid td.cell-range').forEach((cell) => cell.classList.remove('cell-range'));
  const bounds = rangeBounds();
  if (!bounds) {
    return;
  }
  const cellCount = (bounds.r2 - bounds.r1 + 1) * (bounds.c2 - bounds.c1 + 1);
  if (cellCount <= 1) {
    return;
  }
  for (let r = bounds.r1; r <= bounds.r2; r += 1) {
    for (let c = bounds.c1; c <= bounds.c2; c += 1) {
      const holder = appRoot.querySelector<HTMLElement>(
        `.data-grid [data-record-id="${cssEscape(bounds.rows[r])}"][data-field-id="${cssEscape(bounds.cols[c])}"]`,
      );
      holder?.closest('td')?.classList.add('cell-range');
    }
  }
}

function extendCellRange(key: string): void {
  if (!cellRange) {
    return;
  }
  const rows = visibleRecords(activeTable()).map((record) => record.id);
  const cols = orderedFields(activeTable()).map((field) => field.id);
  let r = rows.indexOf(cellRange.focus.r);
  let c = cols.indexOf(cellRange.focus.f);
  if (r < 0 || c < 0) {
    return;
  }
  if (key === 'ArrowUp') r = Math.max(0, r - 1);
  else if (key === 'ArrowDown') r = Math.min(rows.length - 1, r + 1);
  else if (key === 'ArrowLeft') c = Math.max(0, c - 1);
  else if (key === 'ArrowRight') c = Math.min(cols.length - 1, c + 1);
  cellRange = { anchor: cellRange.anchor, focus: { r: rows[r], f: cols[c] } };
  paintCellRange();
}

function copyCellRange(): boolean {
  const bounds = rangeBounds();
  if (!bounds) {
    return false;
  }
  if ((bounds.r2 - bounds.r1) === 0 && (bounds.c2 - bounds.c1) === 0) {
    return false;
  }
  const table = activeTable();
  const byId = new Map(table.records.map((record) => [record.id, record]));
  const lines: string[] = [];
  for (let r = bounds.r1; r <= bounds.r2; r += 1) {
    const record = byId.get(bounds.rows[r]);
    if (!record) continue;
    const cells: string[] = [];
    for (let c = bounds.c1; c <= bounds.c2; c += 1) {
      cells.push(String(displayValue(table, record, bounds.cols[c]) ?? '').replace(/\t/g, ' ').replace(/\n/g, ' '));
    }
    lines.push(cells.join('\t'));
  }
  const tsv = lines.join('\n');
  navigator.clipboard?.writeText(tsv).catch(() => undefined);
  const count = (bounds.r2 - bounds.r1 + 1) * (bounds.c2 - bounds.c1 + 1);
  const messageSpan = appRoot.querySelector('.status-bar span:nth-last-child(2)');
  if (messageSpan) messageSpan.textContent = `Copied ${count} cells.`;
  return true;
}

function pasteIntoGrid(text: string, startRecordId: string, startFieldId: string): void {
  const table = activeTable();
  const visible = visibleRecords(table);
  const cols = orderedFields(table).map((field) => field.id);
  const startR = visible.findIndex((record) => record.id === startRecordId);
  const startC = cols.indexOf(startFieldId);
  if (startR < 0 || startC < 0) {
    return;
  }
  const matrix = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'));
  pushUndo('paste');
  const byId = new Map(table.records.map((record) => [record.id, record]));
  const order = table.records.map((record) => record.id);
  let added = 0;
  matrix.forEach((cells, rowOffset) => {
    let targetId: string;
    if (startR + rowOffset < visible.length) {
      targetId = visible[startR + rowOffset].id;
    } else {
      const created = createRecord(table.fields);
      byId.set(created.id, created);
      order.push(created.id);
      targetId = created.id;
      added += 1;
    }
    const target = byId.get(targetId);
    if (!target) return;
    const values = { ...target.values };
    cells.forEach((cell, colOffset) => {
      const fieldId = cols[startC + colOffset];
      const field = fieldId ? table.fields.find((item) => item.id === fieldId) : undefined;
      if (!field || ['calculation', 'autoNumber', 'createdAt', 'updatedAt'].includes(field.type)) {
        return;
      }
      values[field.id] = convertValueForType(cell, field.type, field.options).value;
    });
    byId.set(targetId, { ...target, updatedAt: new Date().toISOString(), values });
  });
  cellRange = null;
  lastMessage = `Pasted ${matrix.length} row${matrix.length === 1 ? '' : 's'}${added ? ` (${added} new)` : ''}.`;
  setActiveTable({ ...table, records: order.map((id) => byId.get(id)!).filter(Boolean) });
}

// ── Advanced find ────────────────────────────────────────────────────────────
const FIND_OPERATORS: Array<{ value: FindOperator; label: string; needsValue: boolean; needsSecond: boolean }> = [
  { value: 'contains', label: 'contains', needsValue: true, needsSecond: false },
  { value: 'equals', label: 'is exactly', needsValue: true, needsSecond: false },
  { value: 'startsWith', label: 'starts with', needsValue: true, needsSecond: false },
  { value: 'endsWith', label: 'ends with', needsValue: true, needsSecond: false },
  { value: 'greaterThan', label: 'greater than', needsValue: true, needsSecond: false },
  { value: 'lessThan', label: 'less than', needsValue: true, needsSecond: false },
  { value: 'between', label: 'between', needsValue: true, needsSecond: true },
  { value: 'isEmpty', label: 'is empty', needsValue: false, needsSecond: false },
  { value: 'isNotEmpty', label: 'is not empty', needsValue: false, needsSecond: false },
];

function fieldNameById(fieldId: string): string {
  return activeTable().fields.find((field) => field.id === fieldId)?.name ?? 'field';
}

function operatorLabel(operator: FindOperator): string {
  return FIND_OPERATORS.find((item) => item.value === operator)?.label ?? operator;
}

function readFindDraft(): void {
  const match = (appRoot.querySelector<HTMLSelectElement>('[data-find-match]')?.value as 'all' | 'any') ?? 'all';
  const rules: FindRule[] = [];
  appRoot.querySelectorAll<HTMLElement>('.find-rule').forEach((row) => {
    const fieldId = row.querySelector<HTMLSelectElement>('[data-find-field]')?.value ?? '';
    const operator = (row.querySelector<HTMLSelectElement>('[data-find-op]')?.value as FindOperator) ?? 'contains';
    const value = row.querySelector<HTMLInputElement>('[data-find-value]')?.value ?? '';
    const value2 = row.querySelector<HTMLInputElement>('[data-find-value2]')?.value ?? '';
    if (fieldId) {
      rules.push({ fieldId, operator, value, value2 });
    }
  });
  findDraft = { match, rules };
}

function applyFind(): void {
  readFindDraft();
  findQuery = findDraft.rules.length ? findDraft : null;
  highlightedRecordIds = new Set();
  dialog = 'none';
  const count = visibleRecords(activeTable()).length;
  lastMessage = findQuery ? `Find is on: ${count} record${count === 1 ? '' : 's'} match.` : 'Find cleared.';
  render();
}

// ── Multi-field sort ─────────────────────────────────────────────────────────
function readSortDraft(): void {
  const keys: SortKey[] = [];
  appRoot.querySelectorAll<HTMLElement>('.sort-level').forEach((row) => {
    const fieldId = row.querySelector<HTMLSelectElement>('[data-sort-level-field]')?.value ?? '';
    const direction = (row.querySelector<HTMLSelectElement>('[data-sort-level-dir]')?.value as 'asc' | 'desc') ?? 'asc';
    if (fieldId) {
      keys.push({ fieldId, direction });
    }
  });
  sortDraft = keys;
}

function applySort(): void {
  readSortDraft();
  sortKeys = sortDraft;
  dialog = 'none';
  lastMessage = sortKeys.length ? `Sorting by ${sortKeys.map((key) => fieldNameById(key.fieldId)).join(', ')}.` : 'Sort cleared.';
  render();
}

// ── Saved views ──────────────────────────────────────────────────────────────
function savedViews(): SavedView[] {
  return project.views ?? [];
}

function saveCurrentView(): void {
  const name = appRoot.querySelector<HTMLInputElement>('[data-view-name]')?.value.trim() || `View ${savedViews().length + 1}`;
  const view: SavedView = {
    id: createId('view'),
    name,
    tableId: activeTableId,
    mode: viewMode,
    search: searchQuery,
    searchFieldId,
    find: findQuery,
    sortKeys,
  };
  pushUndo('save view');
  lastMessage = `Saved view: ${name}.`;
  setProject({ ...project, updatedAt: new Date().toISOString(), views: [...savedViews(), view] });
}

function applyView(viewId: string): void {
  const view = savedViews().find((item) => item.id === viewId);
  if (!view) {
    return;
  }
  if (project.schema.tables.some((table) => table.id === view.tableId)) {
    activeTableId = view.tableId;
    ensureActiveRecord(activeTable());
  }
  viewMode = view.mode;
  searchQuery = view.search;
  searchFieldId = view.searchFieldId;
  findQuery = view.find;
  sortKeys = view.sortKeys;
  highlightedRecordIds = new Set();
  dialog = 'none';
  lastMessage = `Opened view: ${view.name}.`;
  render();
}

function deleteView(viewId: string): void {
  pushUndo('delete view');
  lastMessage = 'Deleted a saved view.';
  setProject({ ...project, updatedAt: new Date().toISOString(), views: savedViews().filter((item) => item.id !== viewId) });
}

// ── Row selection + bulk actions ─────────────────────────────────────────────
function selectedInTable(table: ListSplatTable): string[] {
  const ids = new Set(table.records.map((record) => record.id));
  return [...selectedRecordIds].filter((id) => ids.has(id));
}

function bulkDelete(): void {
  const table = activeTable();
  const ids = new Set(selectedInTable(table));
  if (ids.size === 0) {
    return;
  }
  const remaining = table.records.filter((record) => !ids.has(record.id));
  if (remaining.length === 0) {
    lastMessage = 'Keep at least one record. Some rows were not deleted.';
    render();
    return;
  }
  if (!window.confirm(`Delete ${ids.size} selected record${ids.size === 1 ? '' : 's'}? You can undo right after.`)) {
    return;
  }
  pushUndo('bulk delete');
  selectedRecordIds = new Set();
  lastMessage = `Deleted ${table.records.length - remaining.length} records.`;
  setActiveTable({ ...table, records: remaining });
}

function bulkDuplicate(): void {
  const table = activeTable();
  const ids = selectedInTable(table);
  if (ids.length === 0) {
    return;
  }
  pushUndo('bulk duplicate');
  const next = ids.reduce((current, id) => duplicateRecord(current, id), table);
  selectedRecordIds = new Set();
  lastMessage = `Duplicated ${ids.length} record${ids.length === 1 ? '' : 's'}.`;
  setActiveTable(next);
}

function applyBulkFill(): void {
  const table = activeTable();
  const ids = new Set(selectedInTable(table));
  const fieldId = appRoot.querySelector<HTMLSelectElement>('[data-bulk-field]')?.value ?? '';
  const rawValue = appRoot.querySelector<HTMLInputElement>('[data-bulk-value]')?.value ?? '';
  const field = table.fields.find((item) => item.id === fieldId);
  if (!field || ids.size === 0) {
    dialog = 'none';
    render();
    return;
  }
  const value = convertValueForType(rawValue, field.type, field.options).value;
  pushUndo('bulk fill');
  const records = table.records.map((record) =>
    ids.has(record.id) ? { ...record, updatedAt: new Date().toISOString(), values: { ...record.values, [fieldId]: value } } : record,
  );
  dialog = 'none';
  lastMessage = `Filled ${field.name} for ${ids.size} record${ids.size === 1 ? '' : 's'}.`;
  setActiveTable({ ...table, records });
}

// ── CSV column mapping ───────────────────────────────────────────────────────
function guessFieldType(samples: string[]): FieldType {
  const nonEmpty = samples.filter((sample) => sample.trim() !== '');
  if (nonEmpty.length === 0) {
    return 'text';
  }
  if (nonEmpty.every((sample) => !Number.isNaN(Number(sample.replace(/[$,%\s]/g, ''))))) {
    return 'number';
  }
  if (nonEmpty.every((sample) => !Number.isNaN(new Date(sample).getTime()) && /\d/.test(sample))) {
    return 'date';
  }
  if (nonEmpty.every((sample) => /^(yes|no|true|false)$/i.test(sample.trim()))) {
    return 'checkbox';
  }
  return 'text';
}

function readCsvMap(): void {
  appRoot.querySelectorAll<HTMLElement>('.csv-map-row').forEach((row, index) => {
    if (!pendingCsvMap[index]) {
      return;
    }
    pendingCsvMap[index].action = (row.querySelector<HTMLSelectElement>('[data-map-action]')?.value as 'new' | 'existing' | 'skip') ?? 'new';
    pendingCsvMap[index].type = (row.querySelector<HTMLSelectElement>('[data-map-type]')?.value as FieldType) ?? 'text';
    pendingCsvMap[index].fieldId = row.querySelector<HTMLSelectElement>('[data-map-existing]')?.value ?? '';
  });
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
  const qualityTarget = target.closest<HTMLElement>('[data-quality-field-id]');

  if (tableId) {
    activeTableId = tableId;
    clearFind();
    sortKeys = [];
    selectedRecordIds = new Set();
    cellRange = null;
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
    fieldDialogType = '';
    dialog = 'field';
    render();
    return;
  }

  const formulaInsert = target.closest<HTMLElement>('[data-formula-insert]')?.dataset.formulaInsert;
  if (formulaInsert) {
    const input = appRoot.querySelector<HTMLInputElement>('[data-field-formula]');
    if (input) {
      const at = input.selectionStart ?? input.value.length;
      input.value = input.value.slice(0, at) + formulaInsert + input.value.slice(input.selectionEnd ?? at);
      input.focus();
    }
    return;
  }

  if (qualityTarget) {
    const fieldId = qualityTarget.dataset.qualityFieldId;
    const kind = qualityTarget.dataset.qualityKind;
    if (fieldId && kind) {
      const matches = kind === 'duplicates' ? findDuplicateRecords(activeTable(), fieldId) : findMissingRecords(activeTable(), fieldId);
      highlightedRecordIds = new Set(matches.map((record) => record.id));
      const field = activeTable().fields.find((item) => item.id === fieldId);
      lastMessage = `Highlighted ${matches.length} ${kind === 'duplicates' ? 'duplicate' : 'missing'} record${matches.length === 1 ? '' : 's'} in ${field?.name ?? 'this field'}.`;
      dialog = 'none';
      render();
      return;
    }
  }

  if (!action) {
    return;
  }

  closeMenus();

  if (action === 'new') {
    if (!window.confirm('Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.')) {
      return;
    }
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
  } else if (action === 'export-found-csv') {
    saveFoundCsv();
  } else if (action === 'export-markdown') {
    saveMarkdown();
  } else if (action === 'export-report') {
    exportReport();
  } else if (action === 'project-packet') {
    exportProjectPacket();
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
    if (activeTable().records.length <= 1) {
      lastMessage = 'Keep at least one record. Add another before deleting this one.';
      render();
      return;
    }
    if (!window.confirm('Delete this record? You can undo right after with Ctrl+Z.')) {
      return;
    }
    pushUndo('delete record');
    setActiveTable(deleteRecord(activeTable(), recordActionId));
  } else if (action === 'toggle-sort') {
    if (sortKeys.length) {
      sortKeys = [{ ...sortKeys[0], direction: sortKeys[0].direction === 'asc' ? 'desc' : 'asc' }, ...sortKeys.slice(1)];
    } else {
      const firstField = activeTable().fields[0];
      if (firstField) sortKeys = [{ fieldId: firstField.id, direction: 'asc' }];
    }
    render();
  } else if (action === 'sort' || action === 'sort-dialog') {
    sortDraft = sortKeys.length ? sortKeys.map((key) => ({ ...key })) : [{ fieldId: activeTable().fields[0]?.id ?? '', direction: 'asc' }];
    dialog = 'sort';
    render();
  } else if (action === 'find') {
    findDraft = findQuery
      ? { match: findQuery.match, rules: findQuery.rules.map((rule) => ({ ...rule })) }
      : { match: 'all', rules: [{ fieldId: activeTable().fields[0]?.id ?? '', operator: 'contains', value: '' }] };
    dialog = 'find';
    render();
  } else if (action === 'views') {
    dialog = 'views';
    render();
  } else if (action === 'sort-add-level') {
    readSortDraft();
    sortDraft.push({ fieldId: activeTable().fields[0]?.id ?? '', direction: 'asc' });
    render();
  } else if (action === 'sort-remove-level') {
    readSortDraft();
    const index = Number(target.closest<HTMLElement>('[data-level-index]')?.dataset.levelIndex ?? '-1');
    if (index >= 0) sortDraft.splice(index, 1);
    render();
  } else if (action === 'sort-toggle') {
    const fieldId = target.closest<HTMLElement>('[data-sort-toggle]')?.dataset.sortToggle;
    if (fieldId) {
      const existing = sortKeys.find((key) => key.fieldId === fieldId);
      sortKeys = [{ fieldId, direction: existing && existing.direction === 'asc' ? 'desc' : 'asc' }];
      render();
    }
  } else if (action === 'apply-sort') {
    applySort();
  } else if (action === 'clear-sort') {
    readSortDraft();
    sortDraft = [];
    render();
  } else if (action === 'find-add-rule') {
    readFindDraft();
    findDraft.rules.push({ fieldId: activeTable().fields[0]?.id ?? '', operator: 'contains', value: '' });
    render();
  } else if (action === 'find-remove-rule') {
    readFindDraft();
    const index = Number(target.closest<HTMLElement>('[data-rule-index]')?.dataset.ruleIndex ?? '-1');
    if (index >= 0) findDraft.rules.splice(index, 1);
    render();
  } else if (action === 'apply-find') {
    applyFind();
  } else if (action === 'save-view') {
    saveCurrentView();
  } else if (action === 'apply-view') {
    const viewId = target.closest<HTMLElement>('[data-view-id]')?.dataset.viewId;
    if (viewId) applyView(viewId);
  } else if (action === 'delete-view') {
    const viewId = target.closest<HTMLElement>('[data-view-id]')?.dataset.viewId;
    if (viewId) deleteView(viewId);
  } else if (action === 'bulk-delete') {
    bulkDelete();
  } else if (action === 'bulk-duplicate') {
    bulkDuplicate();
  } else if (action === 'bulk-fill') {
    if (selectedInTable(activeTable()).length) {
      dialog = 'bulkFill';
      render();
    }
  } else if (action === 'apply-bulk-fill') {
    applyBulkFill();
  } else if (action === 'bulk-clear') {
    selectedRecordIds = new Set();
    render();
  } else if (action === 'expand-record' && recordActionId) {
    activeRecordId = recordActionId;
    viewMode = 'form';
    render();
  } else if (action === 'open-related') {
    const relTable = target.closest<HTMLElement>('[data-rel-table]')?.dataset.relTable;
    const relRecord = target.closest<HTMLElement>('[data-rel-record]')?.dataset.relRecord;
    if (relTable && relRecord) {
      activeTableId = relTable;
      activeRecordId = relRecord;
      clearFind();
      sortKeys = [];
      viewMode = 'form';
      render();
    }
  } else if (action === 'add-related') {
    const relId = target.closest<HTMLElement>('[data-rel-id]')?.dataset.relId;
    const relationship = project.schema.relationships.find((item) => item.id === relId);
    const parent = activeTable().records.find((item) => item.id === activeRecordId);
    const targetTable = relationship ? project.schema.tables.find((item) => item.id === relationship.toTableId) : undefined;
    if (relationship && parent && targetTable) {
      pushUndo('add related record');
      const matchValue = parent.values[relationship.fromFieldId] ?? '';
      const child = createRecord(targetTable.fields, { [relationship.toFieldId]: matchValue });
      const nextProject = replaceTable(project, { ...targetTable, records: [...targetTable.records, child] });
      activeTableId = targetTable.id;
      activeRecordId = child.id;
      clearFind();
      sortKeys = [];
      viewMode = 'form';
      lastMessage = `Added a ${targetTable.name} record linked to ${recordTitle(activeTable(), parent)}.`;
      setProject(nextProject);
    }
  } else if (action === 'cal-prev') {
    shiftCalendarMonth(-1);
    render();
  } else if (action === 'cal-next') {
    shiftCalendarMonth(1);
    render();
  } else if (action === 'cal-today') {
    calendarMonth = '';
    render();
  } else if (action === 'bulk-archive' || action === 'bulk-restore') {
    const archive = action === 'bulk-archive';
    const ids = new Set(selectedInTable(activeTable()));
    if (ids.size) {
      pushUndo(archive ? 'archive records' : 'restore records');
      const table = activeTable();
      selectedRecordIds = new Set();
      lastMessage = `${archive ? 'Archived' : 'Restored'} ${ids.size} record${ids.size === 1 ? '' : 's'}.`;
      setActiveTable({ ...table, records: table.records.map((record) => (ids.has(record.id) ? { ...record, archived: archive } : record)) });
    }
  } else if (action === 'toggle-archived') {
    showArchived = !showArchived;
    selectedRecordIds = new Set();
    lastMessage = showArchived ? 'Showing archived records.' : 'Showing active records.';
    render();
  } else if (action === 'rename-table') {
    const current = activeTable();
    const name = window.prompt('Rename table', current.name);
    if (name && name.trim()) {
      pushUndo('rename table');
      setProject(renameTable(project, current.id, name));
    }
  } else if (action === 'duplicate-table') {
    pushUndo('duplicate table');
    const result = duplicateTable(project, activeTableId);
    activeTableId = result.newTableId;
    clearFind();
    sortKeys = [];
    selectedRecordIds = new Set();
    lastMessage = 'Duplicated the table.';
    setProject(result.project);
  } else if (action === 'move-table-left' || action === 'move-table-right') {
    pushUndo('move table');
    setProject(moveTable(project, activeTableId, action === 'move-table-left' ? -1 : 1));
  } else if (action === 'delete-table') {
    if (project.schema.tables.length <= 1) {
      lastMessage = 'A database needs at least one table.';
      render();
      return;
    }
    if (window.confirm(`Delete the table "${activeTable().name}" and all its records? You can undo right after.`)) {
      pushUndo('delete table');
      const next = deleteTable(project, activeTableId);
      activeTableId = next.schema.tables[0].id;
      clearFind();
      sortKeys = [];
      selectedRecordIds = new Set();
      lastMessage = 'Deleted the table.';
      setProject(next);
    }
  } else if (action === 'structure-copy') {
    saveJson(structureOnlyProject(project));
    lastMessage = 'Saved a structure-only copy (no records).';
    render();
  } else if (action === 'highlight-invalid') {
    const issues = tableValidationIssues(activeTable());
    highlightedRecordIds = new Set(issues.map((issue) => issue.record.id));
    dialog = 'none';
    lastMessage = `Highlighted ${highlightedRecordIds.size} record${highlightedRecordIds.size === 1 ? '' : 's'} with rule problems.`;
    render();
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
    clearFind();
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
  } else if (action === 'save-teacher-notes') {
    runTeacherNotesSave();
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
      const order = layoutFields(activeTable()).map((field) => field.id);
      const index = order.indexOf(fieldId);
      const swapIndex = action === 'layout-field-up' ? index - 1 : index + 1;
      if (index >= 0 && swapIndex >= 0 && swapIndex < order.length) {
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
        pushUndo('layout order');
        dialog = 'layout';
        updateCurrentLayout({ fieldOrder: order });
      }
    }
  } else if (action === 'save-layout-settings') {
    const locked = appRoot.querySelector<HTMLInputElement>('[data-layout-locked]')?.checked ?? false;
    const visibleFieldIds = new Set(
      [...appRoot.querySelectorAll<HTMLInputElement>('[data-layout-field-visible]:checked')].map((input) => input.dataset.layoutFieldVisible ?? ''),
    );
    const fieldOrder = layoutFields(activeTable()).map((field) => field.id);
    const hiddenFieldIds = fieldOrder.filter((fieldId) => !visibleFieldIds.has(fieldId));
    pushUndo('layout settings');
    dialog = 'none';
    updateCurrentLayout({ locked, fieldOrder, hiddenFieldIds });
  } else if (action === 'create-relationship') {
    createRelationshipFromDialog();
  } else if (action === 'undo-change') {
    undoLastChange();
  } else if (action === 'redo-change') {
    redoLastChange();
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
  } else if (action === 'student-view') {
    pushUndo('student view toggle');
    lastMessage = project.teacher.studentView ? 'Teacher tools are visible again.' : 'Student view is on.';
    setProject({
      ...project,
      updatedAt: new Date().toISOString(),
      teacher: {
        ...project.teacher,
        studentView: !project.teacher.studentView,
      },
    });
  } else if (action === 'project-ideas') {
    dialog = 'projectIdeas';
    render();
  } else if (action === 'relationships') {
    dialog = 'relationship';
    render();
  } else if (action === 'charts') {
    if (!chartCategoryField) {
      const first = activeTable().fields.find((field) => !field.hidden && !['image', 'longText', 'calculation'].includes(field.type));
      chartCategoryField = first?.id ?? '';
    }
    dialog = 'charts';
    render();
  } else if (action === 'functions') {
    dialog = 'functions';
    render();
  } else if (action === 'quality') {
    dialog = 'quality';
    render();
  } else if (action === 'teacher-notes') {
    dialog = 'teacherNotes';
    render();
  } else if (action.startsWith('help-')) {
    dialog = 'help';
    render();
  } else {
    lastMessage = 'That ListSplatTM control is not available in this workspace.';
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
    const direction = sortKeys[0]?.direction ?? 'asc';
    sortKeys = target.value ? [{ fieldId: target.value, direction }] : [];
    render();
  } else if (target.matches('[data-group-field]')) {
    groupByFieldId = target.value;
    render();
  } else if (target.matches('[data-board-field]')) {
    boardFieldId = target.value;
    render();
  } else if (target.matches('[data-calendar-field]')) {
    calendarFieldId = target.value;
    render();
  } else if (target.matches('[data-wrap-toggle]') && target instanceof HTMLInputElement) {
    wrapText = target.checked;
    render();
  } else if (target.matches('[data-chart-type]')) {
    chartType = target.value as 'bar' | 'pie' | 'line';
    render();
  } else if (target.matches('[data-chart-category]')) {
    chartCategoryField = target.value;
    render();
  } else if (target.matches('[data-chart-value-mode]')) {
    chartValueMode = target.value as 'count' | 'sum';
    render();
  } else if (target.matches('[data-chart-value-field]')) {
    chartValueField = target.value;
    render();
  } else if (target.matches('[data-select-all]') && target instanceof HTMLInputElement) {
    const ids = visibleRecords(activeTable()).map((record) => record.id);
    selectedRecordIds = target.checked ? new Set(ids) : new Set();
    render();
  } else if (target.matches('[data-select-row]') && target instanceof HTMLInputElement) {
    const id = target.dataset.selectRow ?? '';
    if (target.checked) selectedRecordIds.add(id);
    else selectedRecordIds.delete(id);
    render();
  } else if (target.matches('[data-field-type]')) {
    fieldDialogType = target.value as FieldType;
    render();
  } else if (target.matches('[data-find-op]')) {
    readFindDraft();
    render();
  } else if (target.matches('[data-map-action]')) {
    readCsvMap();
    render();
  } else if (target.matches('[data-csv-key]')) {
    readCsvMap();
    pendingCsvKeyField = target.value;
    render();
  } else if (target.matches('[data-csv-dup]')) {
    readCsvMap();
    pendingCsvDupMode = target.value as 'add' | 'skip' | 'update';
    render();
  } else if (target.matches('[data-relationship-from-table], [data-relationship-to-table]')) {
    updateRelationshipDialogTables();
  } else if (target.matches('.multi-option') && target instanceof HTMLInputElement) {
    const cell = target.closest<HTMLElement>('.multi-cell');
    const recordId = target.dataset.recordId;
    const fieldId = target.dataset.fieldId;
    if (cell && recordId && fieldId) {
      const chosen = Array.from(cell.querySelectorAll<HTMLInputElement>('.multi-option:checked')).map((box) => box.dataset.multiOption ?? '');
      noteCellEdit(recordId, fieldId);
      project = replaceTable(project, updateCell(activeTable(), recordId, fieldId, chosen.join(', ')));
      saveAutosave(project);
      render();
    }
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
      if (target.dataset.recordId && target.dataset.fieldId) {
        noteCellEdit(target.dataset.recordId, target.dataset.fieldId);
      }
      updateActiveCell(target);
    }
  }
});

appRoot.addEventListener('paste', (event) => {
  const target = event.target as HTMLElement;
  const imageCell = target.closest<HTMLElement>('.image-cell');
  if (imageCell) {
    const recordId = imageCell.dataset.recordId;
    const fieldId = imageCell.dataset.fieldId;
    const item = Array.from(event.clipboardData?.items ?? []).find((clipboardItem) => clipboardItem.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (recordId && fieldId && file) {
      event.preventDefault();
      storeImageFile(recordId, fieldId, file, 'image paste');
    }
    return;
  }
  // Multi-cell paste from a spreadsheet or another range (tab/newline separated).
  const holder = target.closest<HTMLElement>('.cell-input');
  if (!holder || !holder.closest('.data-grid') || !holder.dataset.recordId || !holder.dataset.fieldId) {
    return;
  }
  const text = event.clipboardData?.getData('text/plain') ?? '';
  if (!/[\t\n]/.test(text.replace(/\n$/, ''))) {
    return; // a single value: let the browser paste it into the cell normally
  }
  event.preventDefault();
  pasteIntoGrid(text, holder.dataset.recordId, holder.dataset.fieldId);
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
    if (target.dataset.recordId && target.dataset.fieldId) {
      noteCellEdit(target.dataset.recordId, target.dataset.fieldId);
    }
    updateActiveCell(target);
  }
});

appRoot.addEventListener('focusout', (event) => {
  const target = event.target as HTMLElement;
  if (target.matches?.('.cell-input, .cell-checkbox')) {
    activeCellDirtyKey = '';
  }
});

appRoot.addEventListener('mousedown', (event) => {
  const holder = (event.target as HTMLElement).closest<HTMLElement>('[data-record-id][data-field-id]');
  if (!holder || !holder.closest('.data-grid') || !holder.dataset.recordId || !holder.dataset.fieldId) {
    return;
  }
  const point = { r: holder.dataset.recordId, f: holder.dataset.fieldId };
  if ((event as MouseEvent).shiftKey && cellRange) {
    event.preventDefault();
    cellRange = { anchor: cellRange.anchor, focus: point };
  } else {
    cellRange = { anchor: point, focus: point };
  }
  paintCellRange();
});

// Column resize: drag the handle on a header; persist width in the layout.
appRoot.addEventListener('pointerdown', (event) => {
  const handle = (event.target as HTMLElement).closest<HTMLElement>('[data-col-resize]');
  if (!handle) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const fieldId = handle.dataset.colResize ?? '';
  const th = handle.closest('th') as HTMLElement | null;
  if (!th) {
    return;
  }
  th.setAttribute('draggable', 'false');
  const startX = event.clientX;
  const startWidth = th.getBoundingClientRect().width;
  let width = Math.round(startWidth);
  const move = (moveEvent: PointerEvent) => {
    width = Math.max(80, Math.round(startWidth + (moveEvent.clientX - startX)));
    th.style.width = `${width}px`;
    th.style.minWidth = `${width}px`;
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    th.setAttribute('draggable', 'true');
    const layout = currentLayout();
    if (layout) {
      pushUndo('resize column');
      updateCurrentLayout({ columnWidths: { ...(layout.columnWidths ?? {}), [fieldId]: width } });
    }
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
});

// Column reorder: drag a header onto another to change the field order.
let draggedColumnField: string | null = null;
appRoot.addEventListener('dragstart', (event) => {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>('.kanban-card[data-kanban-card]');
  if (card) {
    draggedRecordId = card.dataset.kanbanCard ?? null;
    event.dataTransfer?.setData('text/plain', draggedRecordId ?? '');
    return;
  }
  if (target.closest('[data-col-resize]')) {
    return;
  }
  const head = target.closest<HTMLElement>('.col-head[data-col-field]');
  if (!head) {
    return;
  }
  draggedColumnField = head.dataset.colField ?? null;
  event.dataTransfer?.setData('text/plain', draggedColumnField ?? '');
});
appRoot.addEventListener('dragover', (event) => {
  const over = event.target as HTMLElement;
  if (draggedColumnField && over.closest('.col-head[data-col-field]')) {
    event.preventDefault();
  } else if (draggedRecordId && over.closest('.kanban-col')) {
    event.preventDefault();
  }
});
appRoot.addEventListener('drop', (event) => {
  // Kanban: drop a card into a column to set its status/choice field.
  const column = (event.target as HTMLElement).closest<HTMLElement>('.kanban-col');
  if (column && draggedRecordId && boardFieldId) {
    event.preventDefault();
    const recordId = draggedRecordId;
    draggedRecordId = null;
    const value = column.dataset.kanbanCol ?? '';
    pushUndo('move card');
    project = replaceTable(project, updateCell(activeTable(), recordId, boardFieldId, value));
    saveAutosave(project);
    lastMessage = `Moved card to ${value || 'Unassigned'}.`;
    render();
    return;
  }
  const head = (event.target as HTMLElement).closest<HTMLElement>('.col-head[data-col-field]');
  if (!head || !draggedColumnField) {
    return;
  }
  event.preventDefault();
  const targetField = head.dataset.colField ?? '';
  const source = draggedColumnField;
  draggedColumnField = null;
  if (!targetField || targetField === source) {
    return;
  }
  const order = layoutFields(activeTable()).map((field) => field.id);
  const from = order.indexOf(source);
  const to = order.indexOf(targetField);
  if (from < 0 || to < 0) {
    return;
  }
  order.splice(to, 0, order.splice(from, 1)[0]);
  pushUndo('reorder columns');
  updateCurrentLayout({ fieldOrder: order });
});

appRoot.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (!target.matches?.('.cell-input, .cell-checkbox')) {
    return;
  }
  const recordId = target.dataset.recordId;
  const fieldId = target.dataset.fieldId;
  if (!recordId || !fieldId) {
    return;
  }
  const isTextarea = target instanceof HTMLTextAreaElement;
  const isSelect = target instanceof HTMLSelectElement;
  // Shift + arrows extend the cell-range selection instead of moving.
  if (event.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && !isTextarea && !isSelect) {
    if (!cellRange) {
      cellRange = { anchor: { r: recordId, f: fieldId }, focus: { r: recordId, f: fieldId } };
    }
    event.preventDefault();
    extendCellRange(event.key);
    return;
  }
  if (event.key === 'Escape' && cellRange) {
    cellRange = null;
    paintCellRange();
    return;
  }
  switch (event.key) {
    case 'Enter':
      if (!isTextarea) {
        event.preventDefault();
        moveGridCell(recordId, fieldId, event.shiftKey ? -1 : 1, 0);
      }
      break;
    case 'ArrowDown':
      if (!isTextarea && !isSelect) {
        event.preventDefault();
        moveGridCell(recordId, fieldId, 1, 0);
      }
      break;
    case 'ArrowUp':
      if (!isTextarea && !isSelect) {
        event.preventDefault();
        moveGridCell(recordId, fieldId, -1, 0);
      }
      break;
    case 'Tab':
      event.preventDefault();
      moveGridCell(recordId, fieldId, 0, event.shiftKey ? -1 : 1);
      break;
    default:
      break;
  }
});

document.addEventListener('keydown', (event) => {
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === 'c') {
    // Copy a multi-cell selection as TSV; single cells fall through to native copy.
    if (copyCellRange()) {
      event.preventDefault();
    }
    return;
  }
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    undoLastChange();
  } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
    event.preventDefault();
    redoLastChange();
  } else if (key === 's') {
    event.preventDefault();
    saveJson();
    lastMessage = 'Saved a .listsplat.json file to your downloads.';
    render();
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
