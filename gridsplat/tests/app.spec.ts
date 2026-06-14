import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { exportExcel } from '../src/io/excel';
import { updateCell, createSheet } from '../src/grid/gridModel';

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
});

async function dismissSplash(page: Page) {
  await page.getByRole('button', { name: 'New Sheet' }).click();
  await expect(page.getByRole('dialog', { name: 'GridSplat™' })).toBeHidden();
}

test('shows the welcome splash and opens toolbar help by keyboard', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Shell flow runs in Chromium.',
  );

  await expect(page.getByRole('dialog', { name: 'GridSplat™' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Sheet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open a File' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Try an Activity' }),
  ).toBeVisible();

  await dismissSplash(page);
  await expect(page.getByText('New sheet ready.')).toBeVisible();

  await page.getByRole('button', { name: 'Help' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu', { name: 'Help menu' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Quick help' }).click();
  await expect(
    page.getByRole('dialog', { name: 'GridSplat™ Help' }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'GridSplat™ Help' }),
  ).toContainText('Templates');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(
    page.getByRole('dialog', { name: 'GridSplat™ Help' }),
  ).toBeHidden();
});

test('opens activity dialog from the splash on touch', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Splash touch flow runs in mobile Chrome.',
  );

  await page.getByRole('button', { name: 'Try an Activity' }).tap();
  await expect(
    page.getByRole('dialog', { name: 'Classroom Activities' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Class Pet Survey Bar Graph' }),
  ).toBeVisible();
  await page
    .locator('.activity-card')
    .filter({ hasText: 'Daily Temperature Line Graph' })
    .getByRole('button', { name: 'Load Activity' })
    .tap();
  await expect(page.getByTestId('cell-A1')).toContainText('Day');
  await expect(page.getByTestId('cell-B2')).toContainText('72');
});

test('opens top menus from mobile taps', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Mobile menu flow runs in mobile Chrome.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'File', exact: true }).tap();
  await expect(page.getByRole('menu', { name: 'File menu' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Export' }).tap();
  await expect(page.getByRole('menuitem', { name: 'JSON' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'JSON' }).tap();
  await expect(page.getByText('Downloaded a GridSplat™ JSON file.')).toBeVisible();

  await page.getByRole('button', { name: 'Templates' }).tap();
  await expect(
    page.getByRole('menu', { name: 'Templates menu' }),
  ).toBeVisible();
});

test('enters data, selects a range, copies, pastes, and undoes on desktop', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Desktop flow runs in Chromium.',
  );

  await expect(
    page.getByRole('heading', { level: 1, name: 'GridSplat™' }),
  ).toBeVisible();
  await dismissSplash(page);

  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByTestId('cell-A2').dblclick();
  await page.getByLabel('Edit cell A2').fill('Apples');
  await page.getByLabel('Edit cell A2').press('Enter');

  await page.getByTestId('cell-B1').dblclick();
  await page.getByLabel('Edit cell B1').fill('6');
  await page.getByLabel('Edit cell B1').press('Enter');

  const a1 = await page.getByTestId('cell-A1').boundingBox();
  const b2 = await page.getByTestId('cell-B2').boundingBox();

  if (!a1 || !b2) {
    throw new Error('Expected grid cells to be visible');
  }

  await page.mouse.move(a1.x + a1.width / 2, a1.y + a1.height / 2);
  await page.mouse.down();
  await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.mouse.up();

  await page.keyboard.press('ControlOrMeta+C');
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('5\t6\nApples\t');

  await page.getByTestId('cell-C1').click();
  await page.locator('[role="grid"]').focus();
  await page.evaluate(() => navigator.clipboard.writeText('9\t10\n11\t12'));
  await page.keyboard.press('ControlOrMeta+V');

  await expect(page.getByTestId('cell-C1')).toContainText('9');
  await expect(page.getByTestId('cell-D2')).toContainText('12');

  await page.getByRole('button', { name: 'Undo' }).click();

  await expect(page.getByTestId('cell-C1')).not.toContainText('9');
  await expect(page.getByTestId('cell-D2')).not.toContainText('12');

  await page.getByRole('button', { name: 'Redo' }).click();

  await expect(page.getByTestId('cell-C1')).toContainText('9');
  await expect(page.getByTestId('cell-D2')).toContainText('12');

  await page.getByTestId('cell-E1').click();
  await page.locator('[role="grid"]').focus();
  await page.keyboard.press('K');
  await page.getByLabel('Edit cell E1').press('Enter');
  await expect(page.getByTestId('cell-E1')).toContainText('K');

  await page.getByTestId('cell-E1').click();
  await page.locator('[role="grid"]').focus();
  await page.keyboard.press('Delete');
  await expect(page.getByTestId('cell-E1')).not.toContainText('K');
});

test('opens a roomy editor from a mobile tap', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Mobile tap flow runs in mobile Chrome.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').tap();

  const editor = page.getByLabel('Edit cell A1');
  await expect(editor).toBeVisible();
  await expect(editor).toHaveCSS('min-height', '48px');

  await editor.fill('7');
  await editor.press('Enter');

  await expect(page.getByTestId('cell-A1')).toContainText('7');
});

test('applies formatting to a selected cell range', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Formatting toolbar flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('Name');
  await page.getByLabel('Edit cell A1').press('Enter');
  await page.getByTestId('cell-B1').dblclick();
  await page.getByLabel('Edit cell B1').fill('Count');
  await page.getByLabel('Edit cell B1').press('Enter');

  const a1 = await page.getByTestId('cell-A1').boundingBox();
  const b1 = await page.getByTestId('cell-B1').boundingBox();

  if (!a1 || !b1) {
    throw new Error('Expected range cells to be visible');
  }

  await page.mouse.move(a1.x + a1.width / 2, a1.y + a1.height / 2);
  await page.mouse.down();
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.up();

  await page.getByRole('button', { name: 'Bold' }).click();
  await page.getByRole('button', { name: 'Align center' }).click();
  await page.getByLabel('Fill color').fill('#fff2cc');

  await expect(page.getByTestId('cell-A1').locator('.cell-value')).toHaveCSS(
    'font-weight',
    '900',
  );
  await expect(page.getByTestId('cell-B1').locator('.cell-value')).toHaveCSS(
    'font-weight',
    '900',
  );
  await expect(page.getByTestId('cell-A1').locator('.cell-value')).toHaveCSS(
    'text-align',
    'center',
  );
  await expect(page.getByTestId('cell-B1')).toHaveCSS(
    'background-color',
    'rgb(255, 242, 204)',
  );
});

test('extends a cell range with shift click', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Shift-click selection runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').click();
  await page.keyboard.down('Shift');
  await page.getByTestId('cell-C2').click();
  await page.keyboard.up('Shift');

  await page.getByRole('button', { name: 'Bold' }).click();

  await expect(page.getByTestId('cell-A1').locator('.cell-value')).toHaveCSS(
    'font-weight',
    '900',
  );
  await expect(page.getByTestId('cell-C2').locator('.cell-value')).toHaveCSS(
    'font-weight',
    '900',
  );
  await expect(page.getByTestId('cell-D2').locator('.cell-value')).not.toHaveCSS(
    'font-weight',
    '900',
  );
});

test('freezes top rows and first columns by dragging dividers', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Freeze pane flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('Frozen corner');
  await page.getByLabel('Edit cell A1').press('Enter');
  await page.getByTestId('cell-A2').dblclick();
  await page.getByLabel('Edit cell A2').fill('Frozen column');
  await page.getByLabel('Edit cell A2').press('Enter');
  await page.getByTestId('cell-B1').dblclick();
  await page.getByLabel('Edit cell B1').fill('Frozen row');
  await page.getByLabel('Edit cell B1').press('Enter');

  const verticalDivider = page.getByRole('button', {
    name: 'Drag vertical freeze divider',
  });
  const horizontalDivider = page.getByRole('button', {
    name: 'Drag horizontal freeze divider',
  });
  const verticalBox = await verticalDivider.boundingBox();
  const horizontalBox = await horizontalDivider.boundingBox();

  if (!verticalBox || !horizontalBox) {
    throw new Error('Expected freeze dividers to be visible');
  }

  await page.mouse.move(verticalBox.x + 4, verticalBox.y + 80);
  await page.mouse.down();
  await page.mouse.move(verticalBox.x + 126, verticalBox.y + 80);
  await page.mouse.up();

  await page.mouse.move(horizontalBox.x + 80, horizontalBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(horizontalBox.x + 80, horizontalBox.y + 62);
  await page.mouse.up();

  await page.locator('.sheet-scroller').evaluate((scroller) => {
    scroller.scrollLeft = 360;
    scroller.scrollTop = 160;
    scroller.dispatchEvent(new Event('scroll'));
  });

  await expect(
    page.locator('.frozen-corner-layer .cell-value').first(),
  ).toContainText('Frozen corner');
  await expect(page.locator('.frozen-col-layer')).toContainText(
    'Frozen column',
  );
  await expect(page.locator('.frozen-row-layer')).toContainText('Frozen row');
});

test('calculates formulas live and shows friendly errors', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Formula flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByTestId('cell-A2').dblclick();
  await page.getByLabel('Edit cell A2').fill('6');
  await page.getByLabel('Edit cell A2').press('Enter');

  await page.getByTestId('cell-B1').dblclick();
  await page.getByLabel('Edit cell B1').fill('=SUM(A1:A2)');
  await page.getByLabel('Edit cell B1').press('Enter');

  await expect(page.getByTestId('cell-B1')).toContainText('11');

  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('7');
  await page.getByLabel('Edit cell A1').press('Enter');

  await expect(page.getByTestId('cell-B1')).toContainText('13');

  await page.getByTestId('cell-C1').dblclick();
  await page.getByLabel('Edit cell C1').fill('=1/0');
  await page.getByLabel('Edit cell C1').press('Enter');

  await expect(page.getByTestId('cell-C1')).toContainText(
    "You can't divide by zero. Check your numbers.",
  );
});

test('imports CSV and pastes Markdown tables', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Import flow runs in Chromium.',
  );

  await dismissSplash(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'fruit.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Name,Count\nApples,4\nBananas,6'),
  });

  await expect(page.getByTestId('cell-A1')).toContainText('Name');
  await expect(page.getByTestId('cell-B3')).toContainText('6');
  await expect(page.getByText('Opened fruit.csv.')).toBeVisible();

  await page.getByTestId('cell-C1').click();
  await page.locator('[role="grid"]').focus();
  await page.evaluate(() =>
    navigator.clipboard.writeText(
      '| Item | Count |\n| --- | --- |\n| Pears | 5 |',
    ),
  );
  await page.keyboard.press('ControlOrMeta+V');

  await expect(page.getByTestId('cell-C1')).toContainText('Item');
  await expect(page.getByTestId('cell-D2')).toContainText('5');
  await expect(page.getByText('Pasted table into the sheet.')).toBeVisible();

  await page.getByTestId('cell-E1').click();
  await page.locator('[role="grid"]').focus();
  await page.evaluate(() =>
    navigator.clipboard.writeText('Name,Note\nApples,"Red, sweet"'),
  );
  await page.keyboard.press('ControlOrMeta+V');

  await expect(page.getByTestId('cell-E1')).toContainText('Name');
  await expect(page.getByTestId('cell-F2')).toContainText('Red, sweet');
});

test('imports and exports Excel workbooks', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Excel flow runs in Chromium.',
  );

  await dismissSplash(page);

  let sheet = createSheet(20, 20);

  sheet = updateCell(sheet, { row: 0, col: 0 }, 'Name');
  sheet = updateCell(sheet, { row: 0, col: 1 }, 'Count');
  sheet = updateCell(sheet, { row: 1, col: 0 }, 'Grapes');
  sheet = updateCell(sheet, { row: 1, col: 1 }, '8');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'fruit.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await exportExcel(sheet)),
  });

  await expect(page.getByTestId('cell-A1')).toContainText('Name');
  await expect(page.getByTestId('cell-B2')).toContainText('8');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export' }).click();
  await page.getByRole('menuitem', { name: 'Excel' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('gridsplat.xlsx');
});

test('creates a live-updating bar chart and exports PNG', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Chart flow runs in Chromium.',
  );

  await dismissSplash(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'fruit.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Fruit,Count\nApples,4\nBananas,6\nPears,3'),
  });

  const a1 = await page.getByTestId('cell-A2').boundingBox();
  const b3 = await page.getByTestId('cell-B4').boundingBox();

  if (!a1 || !b3) {
    throw new Error('Expected chart source cells to be visible');
  }

  await page.mouse.move(a1.x + a1.width / 2, a1.y + a1.height / 2);
  await page.mouse.down();
  await page.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2);
  await page.mouse.up();

  await page
    .getByLabel('Chart tools')
    .getByLabel('Chart title')
    .fill('Fruit Count');
  await page.getByRole('button', { name: 'Bar' }).click();

  await expect(page.getByLabel('Chart preview')).toBeVisible();
  await expect(page.locator('.chart-floating-panel')).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('Bananas');
  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('6');

  const chartPanel = page.locator('.chart-floating-panel');
  const startPanelBox = await chartPanel.boundingBox();
  const moveHandle = page.getByRole('button', { name: 'Move chart' });

  if (!startPanelBox) {
    throw new Error('Expected chart panel to be visible');
  }

  await moveHandle.dragTo(page.getByTestId('cell-C1'), {
    targetPosition: { x: 12, y: 12 },
  });

  const movedPanelBox = await chartPanel.boundingBox();

  if (!movedPanelBox) {
    throw new Error('Expected moved chart panel to be visible');
  }

  expect(Math.abs(movedPanelBox.x - startPanelBox.x)).toBeGreaterThan(20);

  await page.getByTestId('cell-B3').dblclick();
  await page.getByLabel('Edit cell B3').fill('9');
  await page.getByLabel('Edit cell B3').press('Enter');

  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('9');

  const canvas = page.getByTestId('chart-canvas');
  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error('Expected chart canvas to be visible');
  }

  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.45,
    canvasBox.y + canvasBox.height * 0.42,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.45,
    canvasBox.y + canvasBox.height * 0.25,
  );
  await page.mouse.up();

  await expect(page.getByTestId('cell-B3')).not.toContainText('9');
  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).not.toContainText('9');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export' }).click();
  await page.getByRole('menuitem', { name: 'Chart PNG' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('gridsplat-chart.png');
});

test('charts selected ranges that include text columns before numbers', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Chart range detection runs in Chromium.',
  );

  await dismissSplash(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'reading.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'Day,Title,Minutes,Pages\nMonday,The Willow,20,12\nTuesday,The Willow,25,16\nWednesday,The Willow,25,16',
    ),
  });

  const a1 = await page.getByTestId('cell-A1').boundingBox();
  const d4 = await page.getByTestId('cell-D4').boundingBox();

  if (!a1 || !d4) {
    throw new Error('Expected chart source cells to be visible');
  }

  await page.mouse.move(a1.x + a1.width / 2, a1.y + a1.height / 2);
  await page.mouse.down();
  await page.mouse.move(d4.x + d4.width / 2, d4.y + d4.height / 2);
  await page.mouse.up();

  await page.getByRole('button', { name: 'Bar' }).click();

  await expect(page.getByLabel('Chart preview')).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'My Chart data' }),
  ).toContainText('Monday');
  await expect(
    page.getByRole('table', { name: 'My Chart data' }),
  ).toContainText('20');
  await expect(
    page.getByText('Select labels and numbers before making a chart.'),
  ).toHaveCount(0);
});

test('updates and exports the picture graph', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Picture graph flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'Insert' }).click();
  await page.getByRole('menuitem', { name: 'Picture graph' }).click();
  await expect(page.getByRole('dialog', { name: 'Picture Graph' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Favorite Fruit Pictograph' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add one Apples' }).click();
  await expect(page.getByTestId('picture-column-apples')).toContainText(
    '4 total',
  );

  await page.getByRole('spinbutton', { name: 'Bananas' }).fill('7');
  await expect(page.getByTestId('picture-column-bananas')).toContainText(
    '7 total',
  );

  await page.getByLabel('Each picture equals').fill('2');
  await expect(
    page.locator('[aria-label="Bananas pictures"] .picture-symbol'),
  ).toHaveCount(4);

  await page.getByRole('button', { name: 'Add one Oranges' }).click();
  await expect(page.getByTestId('picture-column-oranges')).toContainText(
    '5 total',
  );

  await page.getByTestId('export-picture-graph').scrollIntoViewIfNeeded();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-picture-graph').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('gridsplat-picture-graph.png');
});

test('autosaves sheet data in the browser and shows cloud setup status', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Save flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('Autosaved');
  await page.getByLabel('Edit cell A1').press('Enter');
  await expect(page.getByText('Autosaved in this browser.')).toBeVisible({
    timeout: 3000,
  });

  await page.reload();
  await dismissSplash(page);
  await expect(page.getByTestId('cell-A1')).toContainText('Autosaved');

  await expect(
    page.locator('.sheet-toolbar').getByRole('button', {
      name: 'Save Google Drive',
    }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Save' }).click();
  await page.getByRole('menuitem', { name: 'Save Google Drive' }).click();
  await expect(page.getByText(/VITE_GOOGLE_DRIVE_CLIENT_ID/)).toBeVisible();
});

test('loads an activity dataset and toggles teacher notes', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Activities flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'Activities' }).click();
  await page.getByRole('menuitem', { name: 'Browse activities' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Classroom Activities' }),
  ).toBeVisible();

  const activity = page.locator('.activity-card').filter({
    hasText: 'Class Pet Survey Bar Graph',
  });

  await activity.getByRole('button', { name: 'Teacher Notes' }).click();
  await expect(activity).toContainText('which pet category has the most');

  await activity.getByRole('button', { name: 'Load Activity' }).click();
  await expect(
    page.getByText('Loaded Class Pet Survey Bar Graph.'),
  ).toBeVisible();
  await expect(page.getByTestId('cell-A1')).toContainText('Pet');
  await expect(page.getByTestId('cell-B2')).toContainText('8');
});

test('loads everyday and financial literacy templates', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Template flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByRole('menuitem', { name: 'Browse templates' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Spreadsheet Templates' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Everyday Spreadsheet Templates' }),
  ).toBeVisible();

  await expect(page.locator('.template-card')).toHaveCount(8);

  const allowanceTemplate = page.locator('.template-card').filter({
    hasText: 'Allowance Tracker',
  });

  await expect(allowanceTemplate).toContainText('Financial Literacy');
  await allowanceTemplate
    .getByRole('button', { name: 'Load Template' })
    .click();
  await expect(page.getByText('Loaded Allowance Tracker.')).toBeVisible();
  await expect(page.getByTestId('cell-A1')).toContainText('Date');
  await expect(page.getByTestId('cell-B2')).toContainText('Allowance');

  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByRole('menuitem', { name: 'Browse templates' }).click();
  await page
    .locator('.template-card')
    .filter({ hasText: 'Simple Gradebook' })
    .getByRole('button', { name: 'Load Template' })
    .click();
  await expect(page.getByTestId('cell-A1')).toContainText('Student');
  await expect(page.getByTestId('cell-E1')).toContainText('Average');
});

test('formats numbers and starts over with confirmation', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Formatting flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').dblclick();
  await page.getByLabel('Edit cell A1').fill('12.5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByLabel('Number format').selectOption('currency');
  await expect(page.getByTestId('cell-A1')).toContainText('$12.50');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Start over' }).click();
  await expect(
    page.getByText('Started over with a blank sheet.'),
  ).toBeVisible();
  await expect(page.getByTestId('cell-A1')).not.toContainText('$12.50');
});

test('builds and navigates a presentation', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Presentation flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'Present' }).click();
  await page.getByRole('menuitem', { name: 'Whiteboard slides' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Whiteboard Slides' }),
  ).toBeVisible();

  await expect(page.getByLabel('Presentation slides')).toContainText(
    'Class Sheet',
  );
  await page.getByRole('button', { name: /Add Chart Slide/ }).click();
  await expect(page.getByLabel('Presentation slides')).toContainText('Slide 4');

  await page.getByRole('button', { name: 'Move Up' }).nth(3).click();
  await expect(page.getByLabel('Presentation slides')).toContainText('Slide 3');

  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printed = 'true';
    };
  });
  await page.getByRole('button', { name: 'Print Slides' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'true');

  const slideDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();
  const slideDownload = await slideDownloadPromise;

  expect(slideDownload.suggestedFilename()).toBe('gridsplat-slide-3.png');

  await page.getByRole('button', { name: 'Spotlight' }).click();

  await page.getByRole('button', { name: 'Start Presentation' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Presentation viewer' }),
  ).toBeVisible();
  await expect(page.locator('.viewer-slide.spotlight')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chart View' })).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('heading', { name: 'Picture Graph' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Exit Presentation' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Presentation viewer' }),
  ).toBeHidden();
});

test('replays onboarding and shows privacy help', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Help flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: 'Privacy & safety' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Privacy & Safety' }),
  ).toBeVisible();
  await expect(page.getByText('No trackers')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: 'Replay tour' }).click();
  await expect(page.getByRole('dialog', { name: 'GridSplat™' })).toBeVisible();
  await expect(page.getByLabel('First tour steps')).toContainText(
    'Make a chart or picture graph',
  );
});

test('has no automated accessibility violations on the main workspace', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Accessibility smoke test runs in Chromium.',
  );

  await dismissSplash(page);

  const results = await new AxeBuilder({ page })
    .include('main')
    .analyze();

  expect(results.violations).toEqual([]);
});
