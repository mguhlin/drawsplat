const {test, expect} = require('@playwright/test');
const markdown = '# Notes\n\n| Name | Age |\n| --- | ---: |\n| Alex | 12 |\n\n# Books\n\nTitle | Pages\n--- | ---\nBook \\| One | 200\nSecond | 100';
async function openImport(page) {
  await page.locator('summary').filter({hasText: /^File/}).click();
  await page.locator('[data-action="import-markdown"]').click();
}
test('pasted Markdown supports choosing tables, typed import and safe text cells', async ({page}) => {
  await page.goto('/splatworks/listsplat/');
  await expect(page.locator('.quick-actions button')).toHaveCount(0);
  await openImport(page);
  await expect(page.locator('[data-action="preview-markdown"]')).toBeDisabled();
  await page.locator('[data-markdown-text]').fill(markdown);
  await expect(page.locator('[data-markdown-table] option')).toHaveCount(2);
  await page.locator('[data-markdown-table]').selectOption('1');
  await page.locator('[data-markdown-name]').fill('Books');
  await page.locator('[data-action="preview-markdown"]').click();
  await expect(page.getByRole('heading', {name: 'Import Markdown', exact: true})).toBeVisible();
  await expect(page.locator('.preview-table')).toContainText('Book | One');
  await page.locator('[data-action="apply-csv-new"]').click();
  await expect(page.locator('.table-tab.active')).toHaveText('Books');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('listsplat.autosave.v1')));
  const books = saved.schema.tables.find(table => table.name === 'Books');
  expect(books.records).toHaveLength(2);
  expect(books.fields[1].type).toBe('number');
  expect(books.records[0].values[books.fields[0].id]).toBe('Book | One');
  expect(books.records[0].values[books.fields[1].id]).toBe(200);
  await openImport(page);
  await page.locator('[data-markdown-text]').fill('not a table');
  await expect(page.locator('[data-action="preview-markdown"]')).toBeDisabled();
  await page.getByRole('button', {name: 'Close dialog', exact: true}).click();
  await expect(page.locator('.table-tab.active')).toHaveText('Books');
});
test('Markdown files preview and append to the existing table', async ({page}) => {
  await page.goto('/splatworks/listsplat/');
  await openImport(page);
  await page.locator('[data-markdown-file]').setInputFiles({name: 'animals.md', mimeType: 'text/markdown', buffer: Buffer.from('| Animal | Habitat |\n| --- | --- |\n| Owl | Forest |')});
  await expect(page.locator('[data-markdown-name]')).toHaveValue('animals');
  await page.locator('[data-action="preview-markdown"]').click();
  await page.locator('[data-action="apply-csv-append"]').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('listsplat.autosave.v1')));
  expect(saved.schema.tables).toHaveLength(1);
  expect(saved.schema.tables[0].records).toHaveLength(13);
  const animal = saved.schema.tables[0].fields.find(field => field.name === 'Animal');
  expect(saved.schema.tables[0].records[12].values[animal.id]).toBe('Owl');
});
