import { expect, type Page, test } from '@playwright/test';

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
    page.getByRole('dialog', { name: 'Try an Activity' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Class Survey' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Load Weather Data' }).tap();
  await expect(page.getByTestId('cell-A1')).toContainText('Day');
  await expect(page.getByTestId('cell-B2')).toContainText('72');
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

  await page.getByTestId('cell-A1').click();
  await page.getByLabel('Edit cell A1').fill('5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByTestId('cell-A2').click();
  await page.getByLabel('Edit cell A2').fill('Apples');
  await page.getByLabel('Edit cell A2').press('Enter');

  await page.getByTestId('cell-B1').click();
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
  await page.getByLabel('Edit cell C1').press('Escape');
  await page.locator('[role="grid"]').focus();
  await page.evaluate(() => navigator.clipboard.writeText('9\t10\n11\t12'));
  await page.keyboard.press('ControlOrMeta+V');

  await expect(page.getByTestId('cell-C1')).toContainText('9');
  await expect(page.getByTestId('cell-D2')).toContainText('12');

  await page.getByRole('button', { name: 'Undo' }).click();

  await expect(page.getByTestId('cell-C1')).not.toContainText('9');
  await expect(page.getByTestId('cell-D2')).not.toContainText('12');
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

test('calculates formulas live and shows friendly errors', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Formula flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page.getByTestId('cell-A1').click();
  await page.getByLabel('Edit cell A1').fill('5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByTestId('cell-A2').click();
  await page.getByLabel('Edit cell A2').fill('6');
  await page.getByLabel('Edit cell A2').press('Enter');

  await page.getByTestId('cell-B1').click();
  await page.getByLabel('Edit cell B1').fill('=SUM(A1:A2)');
  await page.getByLabel('Edit cell B1').press('Enter');

  await expect(page.getByTestId('cell-B1')).toContainText('11');

  await page.getByTestId('cell-A1').click();
  await page.getByLabel('Edit cell A1').fill('7');
  await page.getByLabel('Edit cell A1').press('Enter');

  await expect(page.getByTestId('cell-B1')).toContainText('13');

  await page.getByTestId('cell-C1').click();
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
  await page.getByLabel('Edit cell C1').press('Escape');
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
    .getByLabel('Chart picker')
    .getByLabel('Chart title')
    .fill('Fruit Count');
  await page.getByRole('button', { name: 'Bar' }).click();

  await expect(page.getByLabel('Chart preview')).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('Bananas');
  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('6');

  await page.getByTestId('cell-B3').click();
  await page.getByLabel('Edit cell B3').fill('9');
  await page.getByLabel('Edit cell B3').press('Enter');

  await expect(
    page.getByRole('table', { name: 'Fruit Count data' }),
  ).toContainText('9');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Chart PNG' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('gridsplat-chart.png');
});

test('updates and exports the picture graph', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Picture graph flow runs in Chromium.',
  );

  await dismissSplash(page);
  await page
    .getByLabel('Favorite Fruit Pictograph')
    .getByRole('heading', { name: 'Favorite Fruit Pictograph' })
    .scrollIntoViewIfNeeded();

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

  await page
    .getByRole('button', { name: 'Drag one picture' })
    .dragTo(page.getByTestId('picture-column-oranges'));
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
  await page.getByTestId('cell-A1').click();
  await page.getByLabel('Edit cell A1').fill('Autosaved');
  await page.getByLabel('Edit cell A1').press('Enter');
  await expect(page.getByText('Autosaved in this browser.')).toBeVisible({
    timeout: 3000,
  });

  await page.reload();
  await dismissSplash(page);
  await expect(page.getByTestId('cell-A1')).toContainText('Autosaved');

  await page.getByRole('button', { name: 'Google Drive' }).click();
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
  await page
    .getByRole('heading', { name: 'Classroom Activities' })
    .scrollIntoViewIfNeeded();

  const activity = page.locator('.activity-card').filter({
    hasText: 'Class Pet Survey Bar Graph',
  });

  await activity.getByRole('button', { name: 'Teacher Notes' }).click();
  await expect(activity).toContainText('which pet category has the most');

  await activity.getByRole('button', { name: 'Load Activity' }).click();
  await expect(page.getByText('Loaded activity data.')).toBeVisible();
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
  await page
    .getByRole('heading', { name: 'Everyday Spreadsheet Templates' })
    .scrollIntoViewIfNeeded();

  await expect(page.locator('.template-card')).toHaveCount(8);

  const allowanceTemplate = page.locator('.template-card').filter({
    hasText: 'Allowance Tracker',
  });

  await expect(allowanceTemplate).toContainText('Financial Literacy');
  await allowanceTemplate
    .getByRole('button', { name: 'Load Template' })
    .click();
  await expect(page.getByText('Loaded activity data.')).toBeVisible();
  await expect(page.getByTestId('cell-A1')).toContainText('Date');
  await expect(page.getByTestId('cell-B2')).toContainText('Allowance');

  await page
    .getByRole('heading', { name: 'Everyday Spreadsheet Templates' })
    .scrollIntoViewIfNeeded();
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
  await page.getByTestId('cell-A1').click();
  await page.getByLabel('Edit cell A1').fill('12.5');
  await page.getByLabel('Edit cell A1').press('Enter');

  await page.getByLabel('Number format').selectOption('currency');
  await expect(page.getByTestId('cell-A1')).toContainText('$12.50');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start Over' }).click();
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
  await page
    .getByRole('heading', { name: 'Whiteboard Slides' })
    .scrollIntoViewIfNeeded();

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
