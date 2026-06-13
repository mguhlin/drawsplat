import { spreadsheetTemplates, type SpreadsheetTemplate } from './templates';

interface TemplatesLibraryProps {
  onLoadTemplate: (template: SpreadsheetTemplate) => void;
}

export function TemplatesLibrary({ onLoadTemplate }: TemplatesLibraryProps) {
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
              onClick={() => onLoadTemplate(template)}
            >
              Load Template
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
