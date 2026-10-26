const {test, expect} = require('@playwright/test');

function fixture() {
  const now = new Date().toISOString();
  const field = (id, name, type = 'text') => ({id, name, type, description: '', required: false, hidden: false});
  const record = (id, values) => ({id, values, createdAt: now, updatedAt: now});
  return {
    app: 'ListSplatTM', version: 1, createdAt: now, updatedAt: now,
    metadata: {title: 'School relationships', author: '', className: ''},
    schema: {tables: [
      {id: 'students', name: 'Students', fields: [field('sid', 'Student ID', 'number'), field('name', 'Name')],
        records: [record('alex', {sid: 101, name: 'Alex'}), record('sam', {sid: 102, name: 'Sam'})]},
      {id: 'assignments', name: 'Assignments', fields: [field('title', 'Assignment'), field('student', 'Student ID', 'number')],
        records: [record('reading', {title: 'Reading', student: 101}), record('essay', {title: 'Essay', student: 101})]},
    ], relationships: []}, layouts: [], teacher: {studentView: false, notes: [], rubric: []},
  };
}

test('key relationships provide parent pickers and protect referenced records', async ({page}) => {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(data => {
    if (!localStorage.getItem('listsplat.autosave.v1')) localStorage.setItem('listsplat.autosave.v1', JSON.stringify(data));
  }, fixture());
  await page.goto('/splatworks/listsplat/');
  await page.locator('[data-field-settings="sid"]').click();
  await page.locator('[data-field-primary-key]').check();
  await page.locator('[data-action="save-field-settings"]').click();
  await page.locator('.relationship-launch').click();
  await page.locator('[data-relationship-to-table]').selectOption('assignments');
  await expect(page.locator('.relationship-example')).toContainText('Students');
  await expect(page.locator('.relationship-example')).toContainText('Assignments');
  await expect(page.locator('.relationship-example')).toContainText('101');
  await expect(page.locator('.relationship-example')).toContainText('illustration');
  await page.locator('[data-relationship-to-field]').selectOption('assignments:student');
  await page.locator('[data-action="create-relationship"]').click();
  await expect(page.locator('.relationship-list p')).toHaveCount(1);
  await expect(page.locator('.relationship-example')).toContainText('Your connection');
  await expect(page.locator('.rel-links')).toContainText('1 ─── ∞');
  await page.getByRole('button', {name: 'Close dialog', exact: true}).click();
  await page.locator('[data-table-id="assignments"]').click();
  await expect(page.locator('.foreign-key-cell select').first()).toContainText('Alex · 101');
  await page.locator('.foreign-key-cell select').first().selectOption('102');
  await page.locator('.foreign-key-cell .linked-record').first().click();
  await expect(page.locator('.table-tab.active')).toHaveText('Students');
  await page.locator('[data-view-mode="table"]').click();
  const key = page.locator('[data-record-id="sam"][data-field-id="sid"]');
  for (const [value, message] of [['101', 'duplicate primary key'], ['999', 'no parent record']]) {
    await key.fill(value);
    await key.dispatchEvent('change');
    await expect(page.locator('[role="status"]')).toContainText(message);
  }
  await page.locator('[data-record-action-id="sam"][data-action="delete-record"]').click();
  await expect(page.locator('[role="status"]')).toContainText('no parent record');
  await page.reload();
  await expect(page.locator('.primary-key')).not.toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('listsplat.autosave.v1')));
  expect(saved.schema.relationships[0].enforceKeys).toBe(true);
  expect(saved.schema.tables[1].records[0].values.student).toBe(102);
  await page.locator('[data-table-id="assignments"]').click();
  await page.getByRole('button', {name: 'Close Assignments tab', exact: true}).click();
  await expect(page.locator('[data-table-id="assignments"]')).toHaveCount(0);
  await expect(page.locator('.table-tab.active')).toHaveText('Students');
  await expect(page.getByRole('button', {name: 'Close Students tab', exact: true})).toBeDisabled();
  await page.getByRole('combobox', {name: 'Reopen table', exact: true}).selectOption('assignments');
  await expect(page.locator('.table-tab.active')).toHaveText('Assignments');
  await expect(page.locator('.foreign-key-cell select')).toHaveCount(2);
  await page.setViewportSize({width: 390, height: 844});
  await page.locator('.relationship-launch').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('linked classroom starter loads two tables with twelve records and working parent pickers', async ({page}) => {
  await page.goto('/splatworks/listsplat/');
  await page.locator('.template-starters summary').click();
  await expect(page.locator('[data-template-id]')).toHaveCount(15);
  await page.locator('[data-template-id="library-loans"]').click();
  await expect(page.locator('.table-tab.active')).toHaveText('Library Books');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('listsplat.autosave.v1')));
  expect(saved.schema.tables).toHaveLength(3);
  for (const table of saved.schema.tables) expect(table.records).toHaveLength(12);
  expect(saved.schema.relationships[0].enforceKeys).toBe(true);
  const loans = saved.schema.tables.find(table => table.name === 'Library Loans');
  await page.locator(`[data-table-id="${loans.id}"]`).click();
  await expect(page.locator('.foreign-key-cell select')).toHaveCount(12);
  await expect(page.locator('.foreign-key-cell select').first()).toContainText('The Lantern Map');
});
