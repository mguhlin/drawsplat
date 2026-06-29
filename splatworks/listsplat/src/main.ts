import { tableFromCsv, tableToCsv } from './io/csv';
import { downloadFile, loadAutosave, saveAutosave } from './io/storage';
import {
  addField,
  addRecord,
  addTable,
  assertListSplatFile,
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
import type { FieldType, ListSplatCellValue, ListSplatFile, ListSplatRecord, ListSplatTable } from './model/types';
import { cloneTemplateTable, listSplatTemplates } from './templates/templates';
import './styles/global.css';

type ViewMode = 'table' | 'form' | 'cards' | 'gallery' | 'labels' | 'report';
type DialogName = 'none' | 'replace' | 'field' | 'help' | 'projectIdeas' | 'relationship';

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

function html(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
    pushUndo('CSV import');
    activeTableId = table.id;
    activeRecordId = table.records[0]?.id ?? '';
    lastMessage = `Imported ${table.records.length} records from ${file.name}.`;
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
  });
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
      <summary>${label}</summary>
      <div class="menu-panel">
        ${items.map(([action, text]) => `<button type="button" data-action="${action}">${text}</button>`).join('')}
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
    ['choice', 'Choice'],
    ['image', 'Image'],
    ['link', 'Link'],
    ['calculation', 'Calculation'],
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

function renderInput(table: ListSplatTable, record: ListSplatRecord, fieldId: string, rowIndex: number): string {
  const field = table.fields.find((item) => item.id === fieldId);
  const value = displayValue(table, record, fieldId);
  const common = `aria-label="${html(field?.name ?? 'Field')}, record ${rowIndex + 1}" data-record-id="${record.id}" data-field-id="${fieldId}"`;

  if (field?.type === 'checkbox') {
    return `<input class="cell-checkbox" type="checkbox" ${common} ${value === true || value === 'true' ? 'checked' : ''}>`;
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
            ${table.fields
              .filter((field) => !field.hidden)
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
                  ${table.fields
                    .filter((field) => !field.hidden)
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
        ${table.fields
          .filter((field) => !field.hidden)
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
      </div>
    </div>
  `;
}

function renderCardsView(table: ListSplatTable, rows: ListSplatRecord[]): string {
  return `
    <div class="cards-view ${viewMode === 'gallery' ? 'gallery-view' : ''}">
      ${rows
        .map(
          (record) => `
            <article class="record-card" data-select-record="${record.id}">
              ${table.fields
                .filter((field) => !field.hidden)
                .slice(0, viewMode === 'gallery' ? 5 : 8)
                .map((field) => `<p><strong>${html(field.name)}</strong><span>${html(displayValue(table, record, field.id))}</span></p>`)
                .join('')}
            </article>
          `,
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
              ${table.fields
                .filter((field) => !field.hidden)
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
          .map((mode) => `<button type="button" class="${viewMode === mode ? 'active' : ''}" data-view-mode="${mode}">${mode}</button>`)
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
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${
            replacePreview.length
              ? `<div class="replace-preview"><strong>${replacePreview.length} change${replacePreview.length === 1 ? '' : 's'} ready</strong>${previewRows
                  .map((item) => `<p><del>${html(item.before)}</del><ins>${html(item.after)}</ins></p>`)
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
    const tableOptions = project.schema.tables.map((item) => `<option value="${item.id}">${html(item.name)}</option>`).join('');
    const fieldOptions = project.schema.tables
      .map((item) =>
        item.fields.map((field) => `<option value="${item.id}:${field.id}">${html(item.name)} - ${html(field.name)}</option>`).join(''),
      )
      .join('');
    return `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${tableOptions}</select></label>
          <label>Parent match field <select data-relationship-from-field>${fieldOptions}</select></label>
          <label>Related table <select data-relationship-to-table>${tableOptions}</select></label>
          <label>Related match field <select data-relationship-to-field>${fieldOptions}</select></label>
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
        <button type="button" class="button primary" data-action="new">New</button>
        <button type="button" class="button primary" data-action="save-json">Save JSON</button>
        <button type="button" class="button primary" data-action="open-json">Open JSON</button>
        <button type="button" class="button primary" data-action="export-csv">Export CSV</button>
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
        <label>Title <input data-project-title value="${html(project.metadata.title)}"></label>
        <label>Search <input data-search value="${html(searchQuery)}" placeholder="Find records"></label>
        <label>In <select data-search-field><option value="all">All fields</option>${table.fields
          .map((field) => `<option value="${field.id}" ${searchFieldId === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
          .join('')}</select></label>
        <label>Sort <select data-sort-field><option value="">Choose field</option>${table.fields
          .map((field) => `<option value="${field.id}" ${sortFieldId === field.id ? 'selected' : ''}>${html(field.name)}</option>`)
          .join('')}</select></label>
        <button type="button" data-action="toggle-sort">${sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</button>
        <label>New field <input data-new-field placeholder="Field name"></label>
        <label>Type <select data-new-field-type>${fieldTypeOptions()}</select></label>
        <button type="button" data-action="add-field">Add field</button>
        <button type="button" data-action="add-record">Add record</button>
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

function cellValueFromInput(input: HTMLInputElement | HTMLTextAreaElement): ListSplatCellValue {
  if (input instanceof HTMLInputElement && input.type === 'checkbox') {
    return input.checked;
  }
  if (input instanceof HTMLInputElement && input.type === 'number') {
    return input.value === '' ? '' : Number(input.value);
  }
  return input.value;
}

function updateActiveCell(input: HTMLInputElement | HTMLTextAreaElement): void {
  const recordId = input.dataset.recordId;
  const fieldId = input.dataset.fieldId;
  if (!recordId || !fieldId) {
    return;
  }
  project = replaceTable(project, updateCell(activeTable(), recordId, fieldId, cellValueFromInput(input)));
  saveAutosave(project);
  saveStatus = 'Saved locally';
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
  setActiveTable(updateField(table, field.id, { name, type, description, required, hidden, formula }));
  dialog = 'none';
  lastMessage = `Updated ${name}.`;
  render();
}

function runReplace(): void {
  const find = appRoot.querySelector<HTMLInputElement>('[data-replace-find]')?.value ?? '';
  const replacement = appRoot.querySelector<HTMLInputElement>('[data-replace-with]')?.value ?? '';
  const fieldId = appRoot.querySelector<HTMLSelectElement>('[data-replace-field]')?.value ?? activeTable().fields[0]?.id;
  const recordIds = searchQuery ? visibleRecords(activeTable()).map((record) => record.id) : undefined;
  pushUndo('replace');
  const result = replaceValues(activeTable(), { fieldIds: [fieldId], find, replacement, recordIds });
  dialog = 'none';
  replacePreview = [];
  lastMessage = `Replaced ${result.count} value${result.count === 1 ? '' : 's'}.`;
  setActiveTable(result.table);
}

function runReplacePreview(): void {
  const find = appRoot.querySelector<HTMLInputElement>('[data-replace-find]')?.value ?? '';
  const replacement = appRoot.querySelector<HTMLInputElement>('[data-replace-with]')?.value ?? '';
  const fieldId = appRoot.querySelector<HTMLSelectElement>('[data-replace-field]')?.value ?? activeTable().fields[0]?.id;
  const recordIds = searchQuery ? visibleRecords(activeTable()).map((record) => record.id) : undefined;
  replacePreview = previewReplaceValues(activeTable(), { fieldIds: [fieldId], find, replacement, recordIds });
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
  } else if (action === 'save-field-settings') {
    pushUndo('field settings');
    runFieldSettingsSave();
  } else if (action === 'create-relationship') {
    createRelationshipFromDialog();
  } else if (action === 'undo-change') {
    undoLastChange();
  } else if (action === 'close-dialog') {
    dialog = 'none';
    replacePreview = [];
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
  if (target.matches('[data-open-json]') && target instanceof HTMLInputElement && target.files?.[0]) {
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
  } else if (target.matches('.cell-input, .cell-checkbox') && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    updateActiveCell(target);
  }
});

appRoot.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
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

  if (target.matches('.cell-input')) {
    updateActiveCell(target);
  }
});

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.menu')) {
    closeMenus();
  }
});

render();
