import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('loads the WriteSplat writing app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'SplatWorks home' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'WriteSplat menus' })).toBeVisible();
  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await expect(editor).toBeVisible();
  await expect(page.getByLabel('Readability and educator tools').getByText('Readability')).toBeVisible();

  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('I think the assignment was completed very quickly. Students utilize examples.');

  await expect(page.locator('#statusWords')).toHaveText('11');
  await expect(page.locator('.analysis-passive')).toBeVisible();
  await expect(page.locator('.analysis-adverb')).toHaveCount(2);
  await expect(page.locator('.analysis-alternative')).toBeVisible();
});

test('rescales readability warnings when target grade changes', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Students explain their ideas in complete sentences.');

  await expect(page.locator('#hardCount')).toHaveText('0');
  await page.locator('#targetGrade').selectOption('0');
  await expect(page.locator('#hardCount')).toHaveText('1');
  await expect(page.locator('.analysis-hard, .analysis-very-hard')).toBeVisible();
});

test('shows kid-friendly readability cards and expandable stats', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('The assignment was completed very quickly. Students utilize examples.');

  await expect(page.locator('#readabilityGradeLabel')).toContainText('Grade');
  await expect(page.locator('#readabilityStatus')).toBeVisible();
  await page.getByText('Show more stats').click();
  await expect(page.locator('#letterCount')).not.toHaveText('0');
  await expect(page.locator('#characterCount')).not.toHaveText('0');
  await expect(page.locator('#readingTime')).toContainText('s');
  await expect(page.locator('.suggestion-card').first()).toBeVisible();
  await expect(page.locator('.suggestion-alternative')).toHaveCSS('background-color', 'rgb(109, 40, 217)');
});

test('keeps primary controls keyboard accessible with visible focus and readable contrast', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'SplatWorks home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'New' })).toBeFocused();

  const newButtonBox = await page.getByRole('button', { name: 'New' }).boundingBox();
  expect(newButtonBox?.height).toBeGreaterThanOrEqual(38);
  expect(newButtonBox?.width).toBeGreaterThanOrEqual(44);

  const contrast = await page.locator('.readability-card').evaluate((card) => {
    function channel(value: number): number {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }
    function luminance(rgb: string): number {
      const [r, g, b] = rgb.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }
    const styles = getComputedStyle(card);
    const foreground = luminance(styles.color);
    const background = luminance(styles.backgroundColor);
    const lighter = Math.max(foreground, background);
    const darker = Math.min(foreground, background);
    return (lighter + 0.05) / (darker + 0.05);
  });
  expect(contrast).toBeGreaterThan(4.5);
});

test('jumps from readability warning rows to inline highlights', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('The assignment was completed by the students.');

  await expect(page.locator('#passiveCount')).toHaveText('1');
  await page.getByRole('button', { name: /passive voice/i }).click();
  await expect(page.locator('#editor')).toHaveAttribute('data-active-analysis-kind', 'passive');
});

test('toggles readability highlights without changing document content', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('The assignment was completed very quickly.');

  await expect(page.locator('.analysis-passive')).toBeVisible();
  const before = await editor.innerText();
  await page.getByRole('button', { name: 'Toggle Analysis' }).click();

  await expect(page.locator('.analysis-highlight')).toHaveCount(0);
  await expect(editor).toHaveText(before);
});

test('saves and reopens named browser documents', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('writesplat.'))
      .forEach((key) => localStorage.removeItem(key));
  });
  await page.reload();

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await page.locator('#docTitle').fill('Local Essay');
  await page.locator('#docAuthor').fill('A. Teacher');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Saved browser library draft.');
  await page.getByRole('button', { name: 'Save Local' }).click();
  await expect(page.locator('#statusSaved')).toHaveText('Saved to browser');

  await page.getByRole('button', { name: 'New' }).click();
  await expect(editor).toContainText('Untitled Document');

  await page.getByRole('button', { name: 'Library' }).click();
  await page.locator('.library-item', { hasText: 'Local Essay' }).getByRole('button', { name: 'Open' }).click();

  await expect(page.locator('#docTitle')).toHaveValue('Local Essay');
  await expect(page.locator('#docAuthor')).toHaveValue('A. Teacher');
  await expect(editor).toContainText('Saved browser library draft.');
});

test('restores the autosaved draft after reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('writesplat.'))
      .forEach((key) => localStorage.removeItem(key));
  });
  await page.reload();

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await page.locator('#docTitle').fill('Autosaved Draft');
  await page.locator('#docAuthor').fill('Reload Tester');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('This draft should survive a browser reload.');
  await expect(page.locator('#statusSaved')).toHaveText('Saved locally');

  await page.reload();
  await expect(page.locator('#docTitle')).toHaveValue('Autosaved Draft');
  await expect(page.locator('#docAuthor')).toHaveValue('Reload Tester');
  await expect(page.getByRole('textbox', { name: 'WriteSplat document editor' })).toContainText(
    'This draft should survive a browser reload.',
  );
});

test('exports and imports editable .writesplat.json documents', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await page.locator('#docTitle').fill('Round Trip Draft');
  await page.locator('#docAuthor').fill('Student Writer');
  await page.locator('#targetGrade').selectOption('8');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Round trip text stays editable.');
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Bold' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const nativeFile = readFileSync(downloadPath!, 'utf8');
  const parsed = JSON.parse(nativeFile);
  expect(parsed.metadata.title).toBe('Round Trip Draft');
  expect(parsed.metadata.author).toBe('Student Writer');
  expect(parsed.metadata.targetGrade).toBe('8');

  await page.getByRole('button', { name: 'New' }).click();
  await expect(editor).not.toContainText('Round trip text stays editable.');
  await page.locator('#fileInput').setInputFiles({
    name: 'round-trip.writesplat.json',
    mimeType: 'application/json',
    buffer: Buffer.from(nativeFile),
  });

  await expect(page.locator('#docTitle')).toHaveValue('Round Trip Draft');
  await expect(page.locator('#docAuthor')).toHaveValue('Student Writer');
  await expect(page.locator('#targetGrade')).toHaveValue('8');
  await expect(editor).toContainText('Round trip text stays editable.');
  await expect(page.locator('.ProseMirror strong')).toContainText('Round trip text stays editable.');
});

test('exports OpenDocument text files', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await page.locator('#docTitle').fill('ODT Draft');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('OpenDocument export text.');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('navigation', { name: 'WriteSplat menus' }).getByText('File', { exact: true }).click();
  await page.getByText('Export As', { exact: true }).click();
  await page.getByRole('button', { name: 'OpenDocument (.odt)' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('odt-draft.odt');
});

test('loads templates and runs find replace', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByRole('button', { name: /Lab Report/ }).click();
  await expect(page.locator('#docTitle')).toHaveValue('Lab Report');
  await expect(page.getByRole('textbox', { name: 'WriteSplat document editor' })).toContainText('Hypothesis');

  await page.getByRole('navigation', { name: 'WriteSplat menus' }).getByText('Edit', { exact: true }).click();
  await page.getByRole('button', { name: 'Find and replace' }).click();
  await page.locator('#findText').fill('Hypothesis');
  await page.locator('#replaceText').fill('Prediction');
  await page.getByRole('button', { name: 'Replace all' }).click();
  await expect(page.locator('#findStatus')).toHaveText('Replaced 1 match.');
  await expect(page.getByRole('textbox', { name: 'WriteSplat document editor' })).toContainText('Prediction');
});

test('applies deeper heading levels', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Small section');
  await page.keyboard.press('Control+A');
  await page.getByLabel('Block Style').selectOption('heading4');

  await expect(page.locator('.ProseMirror h4')).toHaveText('Small section');
});

test('applies font family and size marks', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Styled text');
  await page.keyboard.press('Control+A');
  await page.getByLabel('Font').selectOption({ label: 'Georgia' });
  await page.keyboard.press('Control+A');
  await page.getByLabel('Size').selectOption('18px');

  await expect(page.locator('.ProseMirror span[style*="Georgia"]')).toContainText('Styled text');
  await expect(page.locator('.ProseMirror span[style*="18px"]')).toContainText('Styled text');
});

test('applies text color and highlight marks', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Colored text');
  await page.keyboard.press('Control+A');
  await page.getByLabel('Color').selectOption('#5b21b6');
  await page.keyboard.press('Control+A');
  await page.locator('#highlightColorSelect').selectOption('#fef3c7');

  await expect(page.locator('.ProseMirror span[style*="background-color:"]')).toContainText('Colored text');
  await expect
    .poll(async () =>
      page.locator('.ProseMirror span').evaluateAll((spans) => spans.some((span) => span instanceof HTMLElement && Boolean(span.style.color))),
    )
    .toBe(true);
});

test('applies paragraph alignment', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Centered paragraph');
  await page.keyboard.press('Control+A');
  await page.getByLabel('Align').selectOption('center');

  await expect(page.locator('.ProseMirror p')).toHaveAttribute('style', /text-align: center/);
});

test('zooms the editor view without changing document text', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Zoom keeps the document content stable.');
  const before = await editor.innerText();

  await page.getByLabel('Zoom').selectOption('1.3');

  await expect(page.locator('#editor')).toHaveAttribute('data-zoom', '1.3');
  await expect(page.locator('#editor')).toHaveCSS('transform', 'none');
  const fontSize = await page.locator('#editor').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThan(18);
  await expect(editor).toHaveText(before);
});

test('round trips raw and split markdown editing', async ({ page }) => {
  async function chooseMarkdownMode(label: string): Promise<void> {
    const viewMenu = page.locator('.menu-bar > details.menu').nth(5);
    await viewMenu.locator('> summary').click();
    await viewMenu.locator('.menu-submenu > summary').click();
    await viewMenu.getByRole('button', { name: label }).click();
  }

  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  const markdown = page.getByRole('textbox', { name: 'Raw Markdown source' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Markdown source starts here.');

  await chooseMarkdownMode('Split Markdown');
  await expect(editor).toBeVisible();
  await expect(markdown).toBeVisible();
  await expect(markdown).toHaveValue(/Markdown source starts here\./);

  await markdown.fill('# Markdown Draft\n\nHello **writers**.\n\n- Revise\n- Publish');
  await expect(page.locator('.ProseMirror h1')).toContainText('Markdown Draft');
  await expect(page.locator('.ProseMirror strong')).toContainText('writers');
  await expect(page.locator('.ProseMirror li')).toHaveCount(2);

  await markdown.fill('');
  await markdown.pressSequentially('## Now is the time for all good folks\n\nThis is interesting.');
  await expect(markdown).toHaveValue('## Now is the time for all good folks\n\nThis is interesting.');
  await expect(page.locator('.ProseMirror h2')).toContainText('Now is the time for all good folks');
  await expect(page.locator('.ProseMirror p')).toContainText('This is interesting.');

  await chooseMarkdownMode('Raw Markdown');
  await expect(editor).toBeHidden();
  await expect(markdown).toBeVisible();
  await markdown.fill('## Raw Draft\n\nReturn to *writing* mode.');

  await chooseMarkdownMode('WYSIWYG editor');
  await expect(editor).toBeVisible();
  await expect(markdown).toBeHidden();
  await expect(page.locator('.ProseMirror h2')).toContainText('Raw Draft');
  await expect(page.locator('.ProseMirror em')).toContainText('writing');
});

test('reorders top-level blocks by drag and drop', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('First block');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second block');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Third block');

  const handleBox = await page.locator('.block-drag-handle').first().boundingBox();
  const targetBox = await page.locator('.ProseMirror p').nth(2).boundingBox();
  expect(handleBox).toBeTruthy();
  expect(targetBox).toBeTruthy();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + 20, targetBox!.y + targetBox!.height - 2, { steps: 8 });
  await page.mouse.up();

  await expect
    .poll(async () =>
      page.locator('.ProseMirror p').evaluateAll((paragraphs) =>
        paragraphs.map((paragraph) =>
          Array.from(paragraph.childNodes)
            .filter((node) => !(node instanceof HTMLElement && node.classList.contains('block-drag-handle')))
            .map((node) => node.textContent)
            .join(''),
        ),
      ),
    )
    .toEqual(['Second block', 'Third block', 'First block']);
});

test('uses a larger document canvas on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1905, height: 899 });
  await page.goto('/');

  const editorBox = await page.locator('#editor').boundingBox();

  expect(editorBox?.width).toBeGreaterThan(1050);
});

test('uses a sidebar drawer on tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 760 });
  await page.goto('/');

  const sidebar = page.getByLabel('Readability and educator tools');
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('body')).not.toHaveClass(/sidebar-open/);

  await page.locator('.toolbar').getByRole('button', { name: 'Toggle sidebar' }).click();

  await expect(page.locator('body')).toHaveClass(/sidebar-open/);
  await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

  await page.getByRole('button', { name: 'Close sidebar' }).click();

  await expect(page.locator('body')).not.toHaveClass(/sidebar-open/);
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
});

test('applies links to selected text', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Open DrawSplat');
  await page.keyboard.press('Control+A');

  await page.getByRole('button', { name: 'Link' }).click();
  await page.locator('#linkHref').fill('drawsplat.org');
  await page.getByRole('button', { name: 'Apply link' }).click();

  await expect(page.locator('.ProseMirror a')).toHaveAttribute('href', 'https://drawsplat.org');
});

test('inserts uploaded images as embedded data', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Image' }).click();
  await page.locator('#imageAlt').fill('Purple square');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose image' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('tests/fixtures/purple-square.svg');

  await expect(page.locator('.ProseMirror img')).toHaveAttribute('alt', 'Purple square');
  await expect(page.locator('.ProseMirror img')).toHaveAttribute('src', /data:image\/svg\+xml/);
});

test('inserts pasted images as embedded data', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await editor.evaluate((element) => {
    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"></svg>'], 'pasted-square.svg', {
      type: 'image/svg+xml',
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dataTransfer }));
  });

  await expect(page.locator('.ProseMirror img')).toHaveAttribute('alt', 'pasted-square.svg');
  await expect(page.locator('.ProseMirror img')).toHaveAttribute('src', /data:image\/svg\+xml/);
});

test('inserts and adjusts a basic table', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Table' }).click();

  await expect(page.locator('.ProseMirror table')).toBeVisible();
  await expect(page.locator('.ProseMirror td')).toHaveCount(9);

  await page.locator('.ProseMirror td').first().click();
  const insertMenu = page.locator('.menu-bar > details.menu').nth(2);
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Add row' }).click();
  await expect(page.locator('.ProseMirror tr')).toHaveCount(4);

  await page.locator('.ProseMirror td').first().click();
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Add column' }).click();
  await expect(page.locator('.ProseMirror tr').first().locator('td')).toHaveCount(4);

  await page.locator('.ProseMirror td').first().click();
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Delete row' }).click();
  await expect(page.locator('.ProseMirror tr')).toHaveCount(3);

  await page.locator('.ProseMirror td').first().click();
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Delete column' }).click();
  await expect(page.locator('.ProseMirror tr').first().locator('td')).toHaveCount(3);
});

test('merges and splits selected table cells', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Table' }).click();
  const firstCell = page.locator('.ProseMirror td').nth(0);
  const secondCell = page.locator('.ProseMirror td').nth(1);
  const firstBox = await firstCell.boundingBox();
  const secondBox = await secondCell.boundingBox();

  expect(firstBox).toBeTruthy();
  expect(secondBox).toBeTruthy();
  await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2, { steps: 8 });
  await page.mouse.up();

  const insertMenu = page.locator('.menu-bar > details.menu').nth(2);
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Merge cells' }).click();

  await expect(page.locator('.ProseMirror td')).toHaveCount(8);
  await expect(page.locator('.ProseMirror tr').first().locator('td').first()).toHaveAttribute('colspan', '2');

  await page.locator('.ProseMirror tr').first().locator('td').first().click();
  await insertMenu.locator('> summary').click();
  await insertMenu.locator('.menu-submenu > summary').click();
  await insertMenu.getByRole('button', { name: 'Split cell' }).click();

  await expect(page.locator('.ProseMirror td')).toHaveCount(9);
  await expect(page.locator('.ProseMirror tr').first().locator('td').first()).not.toHaveAttribute('colspan', '2');
});

test('inserts horizontal rules as document nodes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Horizontal rule' }).click();

  await expect(page.locator('.ProseMirror hr')).toBeVisible();
});

test('inserts page breaks as document nodes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Page break' }).click();

  await expect(page.locator('.ProseMirror .page-break')).toBeVisible();
  await expect(page.locator('.ProseMirror .page-break')).toHaveAttribute('data-page-break', 'true');
});

test('marks selected text as a cloze answer', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('The moon rises.');
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Cloze Builder' }).click();

  await expect(page.locator('.ProseMirror .cloze-answer')).toBeVisible();
});

test('inserts formatted citations', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Citation Assistant' }).click();
  await page.locator('#citationAuthor').fill('Guhlin, Miguel');
  await page.locator('#citationTitle').fill('Classroom Writing');
  await page.locator('#citationPublisher').fill('DrawSplat Press');
  await page.locator('#citationYear').fill('2026');
  await page.locator('#citationUrl').fill('https://drawsplat.org');
  await page.locator('#citationAccessDate').fill('29 June 2026');
  await expect(page.locator('#citationPreview')).toContainText('Guhlin, Miguel.');
  await page.getByRole('button', { name: 'Insert citation', exact: true }).click();

  await expect(page.getByRole('textbox', { name: 'WriteSplat document editor' })).toContainText(
    'Guhlin, Miguel. "Classroom Writing."',
  );
});

test('maintains and inserts a Works Cited section', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Citation Assistant' }).click();
  await page.locator('#citationAuthor').fill('Guhlin, Miguel');
  await page.locator('#citationTitle').fill('Classroom Writing');
  await page.locator('#citationPublisher').fill('DrawSplat Press');
  await page.locator('#citationYear').fill('2026');
  await page.locator('#citationUrl').fill('https://drawsplat.org');
  await page.locator('#citationAccessDate').fill('29 June 2026');
  await page.getByRole('button', { name: 'Insert citation', exact: true }).click();

  await page.getByRole('button', { name: 'Citation Assistant' }).click();
  await page.getByRole('button', { name: 'Insert citations section' }).click();

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await expect(editor).toContainText('Works Cited');
  await expect(page.locator('.ProseMirror h2', { hasText: 'Works Cited' })).toBeVisible();
  await expect(page.locator('.ProseMirror li', { hasText: 'Guhlin, Miguel. "Classroom Writing."' })).toBeVisible();
});

test('marks teacher-only content and hides it in student view', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Teacher note');
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Mark Teacher Only' }).click();
  await expect(page.locator('.ProseMirror .teacher-only')).toBeVisible();

  await page.getByRole('button', { name: 'Student View' }).click();
  await expect(page.locator('.ProseMirror .teacher-only')).toBeHidden();
});

test('shows export limitations', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('navigation', { name: 'WriteSplat menus' }).getByText('File', { exact: true }).click();
  await page.getByText('Export As', { exact: true }).click();
  await page.getByRole('button', { name: 'Export options' }).click();

  await expect(page.getByRole('dialog', { name: 'Export options' })).toBeVisible();
  await expect(page.getByText('Removes formatting, images, tables, links, and teacher-only metadata.')).toBeVisible();
  await expect(page.getByText('Basic formatting only. Images become alt-text placeholders and tables become readable rows.')).toBeVisible();
  await expect(page.getByRole('button', { name: /OpenDocument/ })).toBeEnabled();
  await expect(page.getByText('Exports headings, paragraphs, lists, links, simple tables, and basic inline formatting.')).toBeVisible();
});

test('closes menus after selection and outside clicks', async ({ page }) => {
  await page.goto('/');

  const menuBar = page.getByRole('navigation', { name: 'WriteSplat menus' });
  const fileMenu = menuBar.locator('details.menu').filter({ hasText: 'File' }).first();
  const editMenu = menuBar.locator('details.menu').filter({ hasText: 'Edit' }).first();

  await fileMenu.locator(':scope > summary').click();
  await expect(fileMenu).toHaveAttribute('open', '');
  await editMenu.locator(':scope > summary').click();
  await expect(fileMenu).not.toHaveAttribute('open', '');
  await expect(editMenu).toHaveAttribute('open', '');

  await page.locator('#editor').click();
  await expect(editMenu).not.toHaveAttribute('open', '');

  await fileMenu.locator(':scope > summary').click();
  await menuBar.getByText('Export As', { exact: true }).click();
  await menuBar.getByRole('button', { name: 'Export options' }).click();

  await expect(page.getByRole('dialog', { name: 'Export options' })).toBeVisible();
  await expect(fileMenu).not.toHaveAttribute('open', '');
});

test('opens useful task-focused help', async ({ page }) => {
  await page.goto('/');

  const menuBar = page.getByRole('navigation', { name: 'WriteSplat menus' });
  const helpMenu = menuBar.locator('details.menu').filter({ hasText: 'Help' }).first();

  await helpMenu.locator(':scope > summary').click();
  await menuBar.getByRole('button', { name: 'WriteSplat help' }).click();

  await expect(page.getByRole('dialog', { name: 'WriteSplat help' })).toBeVisible();
  await expect(page.getByText('Save safely')).toBeVisible();
  await expect(page.getByText('Use teacher tools')).toBeVisible();
  await expect(helpMenu).not.toHaveAttribute('open', '');
});

test('groups educator commands in a far-right Teacher menu', async ({ page }) => {
  await page.goto('/');

  const menuBar = page.getByRole('navigation', { name: 'WriteSplat menus' });
  const teacherMenu = menuBar.getByText('Teacher', { exact: true });
  const helpMenu = menuBar.getByText('Help', { exact: true });
  const teacherBox = await teacherMenu.boundingBox();
  const helpBox = await helpMenu.boundingBox();

  expect(teacherBox?.x).toBeGreaterThan(900);
  expect(helpBox?.x).toBeGreaterThan(teacherBox?.x ?? 0);

  await teacherMenu.click();
  await menuBar.locator('.teacher-menu').getByText('Cloze Builder', { exact: true }).click();
  await expect(menuBar.locator('.teacher-menu').getByRole('button', { name: 'Convert selection to blank' })).toBeVisible();
  await expect(menuBar.locator('.teacher-menu').getByRole('button', { name: 'Vocabulary highlighter' })).toBeVisible();
});

test('uses the shared DrawSplat language preference', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Language').selectOption('es');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('navigation', { name: 'WriteSplat menus' }).getByText('Archivo', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'WriteSplat menus' }).getByText('Docente', { exact: true })).toBeVisible();
  await expect(page.locator('#languageSwitcher')).toHaveValue('es');

  const storedLanguage = await page.evaluate(() => localStorage.getItem('drawsplat.language'));
  expect(storedLanguage).toBe('es');
});

test('scrambles selected sentences', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('First. Second. Third.');
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Scramble Sentences' }).click();

  await expect(editor).toContainText('Second. Third. First.');
  await page.getByRole('button', { name: 'Insert Answer Key' }).click();
  await expect(page.locator('.ProseMirror .teacher-only-block')).toContainText('First. Second. Third.');

  await page.getByRole('button', { name: 'Student View' }).click();
  await expect(page.locator('.ProseMirror .teacher-only-block')).toBeHidden();
});

test('exposes read aloud controls', async ({ page }) => {
  await page.addInitScript(() => {
    class MockSpeechSynthesisUtterance extends EventTarget {
      charIndex = 0;
      charLength = 0;
      onboundary: ((event: SpeechSynthesisEvent) => void) | null = null;
      onend: ((event: SpeechSynthesisEvent) => void) | null = null;
      rate = 1;
      text: string;

      constructor(text: string) {
        super();
        this.text = text;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        pause() {},
        speak(utterance: SpeechSynthesisUtterance) {
          (window as typeof window & { __writesplatUtterance?: SpeechSynthesisUtterance }).__writesplatUtterance = utterance;
        },
      },
    });
  });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Read Aloud' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop Reading' })).toBeVisible();

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Read aloud tracks words.');
  await page.getByRole('button', { name: 'Read Aloud' }).click();
  await page.evaluate(() => {
    const utterance = (window as typeof window & { __writesplatUtterance?: SpeechSynthesisUtterance }).__writesplatUtterance;
    utterance?.onboundary?.({ charIndex: 5, charLength: 5 } as SpeechSynthesisEvent);
  });

  await expect(page.locator('.read-aloud-highlight')).toContainText('aloud');
  await page.getByRole('button', { name: 'Stop Reading' }).click();
  await expect(page.locator('.read-aloud-highlight')).toHaveCount(0);
});

test('highlights vocabulary terms', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', { name: 'WriteSplat document editor' });
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('The moon orbits Earth.');
  await page.getByRole('button', { name: 'Vocabulary Highlighter' }).click();
  await page.locator('#vocabularyTerms').fill('moon\nEarth');
  await page.getByRole('button', { name: 'Highlight terms' }).click();

  await expect(page.locator('.vocabulary-highlight')).toHaveCount(2);
});
