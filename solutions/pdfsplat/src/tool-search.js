// Search the existing controls rather than introducing another command implementation.
export function setupToolSearch() {
  const trigger = document.getElementById('toolSearchButton');
  const dialog = document.createElement('dialog');
  dialog.id = 'toolSearchDialog';
  dialog.className = 'tool-search-dialog';
  dialog.setAttribute('aria-labelledby', 'toolSearchTitle');
  dialog.innerHTML = `<div class="tool-search-heading"><h2 id="toolSearchTitle">Find a tool</h2><button type="button" data-close>Close</button></div>
    <label class="dialog-field">Search tools<input type="search" id="toolSearchInput" placeholder="Try signature, rotate, scan…" autocomplete="off"></label>
    <p id="toolSearchCount" role="status"></p><div id="toolSearchResults" class="tool-search-results" aria-label="Matching tools"></div>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input'), results = dialog.querySelector('#toolSearchResults');
  let executed = false;
  function update() {
    const query = input.value.trim().toLowerCase();
    const controls = [...document.querySelectorAll('.tool-grid button[id], .topbar .actions button[id]')]
      .filter(button => button !== trigger && !button.hidden && button.id !== 'pagesButton');
    const matching = controls.filter(button => button.textContent.toLowerCase().includes(query));
    results.replaceChildren();
    for (const control of matching) {
      const button = document.createElement('button');
      button.type = 'button'; button.disabled = control.disabled;
      const group = control.closest('.tool-group')?.querySelector('summary')?.textContent || 'Document';
      const name = document.createElement('strong'); name.textContent = control.textContent;
      const context = document.createElement('span'); context.textContent = control.disabled ? `${group} · Open a PDF to use this tool` : group;
      button.append(name, context);
      button.onclick = () => {
        if (control.disabled) return;
        executed = true; dialog.close();
        const section = control.closest('details'); if (section) section.open = true;
        control.click();
      };
      results.append(button);
    }
    dialog.querySelector('#toolSearchCount').textContent = matching.length ? `${matching.length} matching tools` : 'No matching tools. Try text, image, pages, or export.';
  }
  function open() {
    if (document.querySelector('dialog[open]')) return;
    executed = false; input.value = ''; update(); dialog.showModal(); input.focus();
  }
  trigger.onclick = open;
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (!executed) trigger.focus(); });
  input.addEventListener('input', update);
  dialog.addEventListener('keydown', event => {
    const buttons = [...results.querySelectorAll('button:not(:disabled)')];
    if (event.key === 'Enter' && event.target === input) {
      event.preventDefault(); buttons[0]?.click();
    } else if (['ArrowDown','ArrowUp'].includes(event.key) && buttons.length) {
      event.preventDefault(); const index = buttons.indexOf(document.activeElement);
      buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
    }
  });
  window.addEventListener('keydown', event => {
    if (document.getElementById('presentationViewer')?.hidden === false) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); if (dialog.open) dialog.close(); else open();
    }
  });
}
