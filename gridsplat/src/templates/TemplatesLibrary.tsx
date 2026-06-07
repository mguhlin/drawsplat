import { spreadsheetTemplates, type SpreadsheetTemplate } from './templates';

function loadTemplate(template: SpreadsheetTemplate) {
  window.dispatchEvent(
    new CustomEvent('gridsplat:load-matrix', {
      detail: template.sampleData,
    }),
  );
}

export function TemplatesLibrary() {
  return (
    <section className="templates-library" aria-labelledby="templates-title">
      <header className="module-header">
        <div>
          <p className="eyebrow">Templates</p>
          <h2 id="templates-title">Everyday Spreadsheet Templates</h2>
        </div>
      </header>
      <div className="templates-grid">
        {spreadsheetTemplates.map((template) => (
          <article className="template-card" key={template.id}>
            <p className="activity-grade">
              {template.gradeBand} · {template.category}
            </p>
            <h3>{template.title}</h3>
            <p>{template.description}</p>
            <button
              className="big-action"
              type="button"
              onClick={() => loadTemplate(template)}
            >
              Load Template
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
