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
    return `# SplatWorks Deployment Privacy Notice

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

- **Approved Components and Versions:** ${value('approvedComponents')}
- **Approved External Services and Recipients:** ${value('approvedServices', 'Not specified; review before enabling connections')}
- **Local Drafts, Downloads, and Shared Devices:** ${value('localCopies')}
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

## Baseline SplatWorks Commitments

- SplatWorks is the ecosystem; DrawSplat is the whiteboard. Existing agreement scope is not expanded by a name change.
- Local editing in static apps does not require a student account. Public hosting/CDN requests still include request metadata such as IP address, user agent, and requested URL.
- SplatWorks does not sell student data, use targeted advertising, or train AI models on student content.
- Optional AI/cloud/identity services and sharing recipients have their own terms, retention, and data use. Approve each selected service before sending student information.
- Local drafts, imported originals, fonts/media, settings, and exports may contain personal information and may persist until explicitly cleared. There is no ecosystem-wide 24-hour expiry.
- Local import/conversion and exports do not require an online converter. Browser Share hands the chosen file to the selected operating system/app destination.
- Google Apps Script Drive/Sheets controls apply to configured whiteboard records, not every app draft or district MySQL record.
- District MariaDB/MySQL, self-hosted, or managed deployments must define access controls, retention, backups, verified requests, and deletion procedures.

## Local Review

This Markdown file is a deployment-specific notice generated from the SplatWorks privacy builder. ${org} should review it against local policy, student privacy laws, procurement rules, and any required district data privacy agreement before student use.
`;
  }

  function slug(text) {
    return String(text || 'splatworks-deployment')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'splatworks-deployment';
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
    const filename = `${slug(value('organization', 'splatworks'))}-splatworks-privacy-notice.md`;
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
