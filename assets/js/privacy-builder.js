(() => {
  const form = document.getElementById('privacyBuilderForm');
  const preview = document.getElementById('privacyMarkdownPreview');
  const status = document.getElementById('privacyBuilderStatus');
  const copyBtn = document.getElementById('copyPrivacyMarkdownBtn');
  const clearBtn = document.getElementById('clearPrivacyBuilderBtn');
  const storageKey = 'drawsplatPrivacyBuilderDraft';

  if (!form || !preview) return;

  const fields = Array.from(form.elements).filter(el => el.name);
  const today = new Date().toISOString().slice(0, 10);

  function value(name, fallback = 'To be completed') {
    const field = form.elements[name];
    const raw = field ? String(field.value || '').trim() : '';
    return raw || fallback;
  }

  function makeMarkdown() {
    const org = value('organization', 'School, district, or organization name');
    return `# DrawSplat Deployment Privacy Notice

## Deployment

- **School/District/Organization:** ${org}
- **Deployment Owner:** ${value('owner')}
- **Deployment URL:** ${value('deploymentUrl')}
- **Effective Date:** ${value('effectiveDate', today)}

## Privacy and Security Contacts

- **Privacy/Security Contact:** ${value('privacyContact')}
- **Privacy/Security Email:** ${value('privacyEmail')}
- **Breach Notice Contact Method:** ${value('breachContact')}

## Approved Configuration

- **Storage Mode:** ${value('storageMode')}
- **Hosting/Data Location:** ${value('hostingLocation')}
- **Approved Age/Grade Bands:** ${value('ageBands')}
- **Student Uploads Enabled:** ${value('studentUploads')}
- **Audio Recording Enabled:** ${value('audioRecording')}
- **Turn-ins Enabled:** ${value('turnIns')}

## Approved Educational Purpose

${value('purpose')}

## Retention Schedule

${value('retention')}

## Consent or Legal Basis

${value('consentBasis')}

## Baseline DrawSplat Commitments

- DrawSplat does not require student accounts in the static app.
- DrawSplat does not sell student data or use targeted advertising.
- DrawSplat does not use student data for AI model training, behavioral profiling, or cross-context advertising.
- Browser-only work stays in the user's browser unless exported or sent to a configured backend.
- Google storage uses the teacher or school's Google Apps Script, Drive, and Sheets deployment.
- MySQL, standalone, hosted, or managed deployments must define their own access controls, retention schedule, backups, and deletion process.

## Local Review

This Markdown file is a deployment-specific notice generated from the DrawSplat privacy builder. ${org} should review it against local policy, student privacy laws, procurement rules, and any required district data privacy agreement before student use.
`;
  }

  function slug(text) {
    return String(text || 'drawsplat-deployment')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'drawsplat-deployment';
  }

  function saveDraft() {
    const data = {};
    fields.forEach(field => { data[field.name] = field.value; });
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function loadDraft() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(data, field.name)) field.value = data[field.name];
      });
    } catch (_) {}
    if (!form.elements.effectiveDate.value) form.elements.effectiveDate.value = today;
  }

  function render() {
    preview.textContent = makeMarkdown();
    saveDraft();
  }

  function setStatus(message) {
    if (!status) return;
    status.textContent = message;
    window.setTimeout(() => {
      if (status.textContent === message) status.textContent = '';
    }, 3500);
  }

  function downloadMarkdown() {
    const markdown = makeMarkdown();
    const filename = `${slug(value('organization', 'drawsplat'))}-drawsplat-privacy-notice.md`;
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${filename}.`);
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(makeMarkdown());
      setStatus('Markdown copied.');
    } catch (_) {
      setStatus('Copy failed. Select the preview text and copy it manually.');
    }
  }

  loadDraft();
  render();

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
    downloadMarkdown();
  });
  copyBtn?.addEventListener('click', copyMarkdown);
  clearBtn?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    form.reset();
    form.elements.effectiveDate.value = today;
    render();
    setStatus('Draft cleared.');
  });
})();
