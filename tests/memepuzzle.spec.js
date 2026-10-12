const { test, expect } = require('@playwright/test');
const origin = process.env.DRAWSPLAT_URL || 'http://127.0.0.1:4183';
const setup = { title: 'Jump test', image: '/kitty.png', tileOrder: [2, 0, 1], questions: [
  { question: 'First?', answer: 'AudioSplat' },
  { question: 'Second, with commas?', answer: 'VideoSplat with MediaSplat' },
  { question: 'Third?', answer: 'two words' },
] };
const url = origin + '/solutions/memepuzzle/student.html#p=' + Buffer.from(JSON.stringify(setup)).toString('base64url');
test('jumping tracks solved questions independently and accepts mixed case with word hints', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-question="1"]').click();
  await expect(page.locator('#wordHint')).toHaveText('Hint: 3 words');
  await page.locator('#answerInput').fill('VIDEOSPLAT WITH MEDIASPLAT');
  await page.locator('#submitBtn').click();
  await expect(page.locator('#correctCount')).toHaveText('1');
  await expect(page.locator('[data-question="1"]')).toHaveClass(/open/);
  await expect(page.locator('[data-question="0"]')).not.toHaveClass(/open/);
  await page.locator('[data-question="0"]').click();
  await expect(page.locator('#wordHint')).toBeEmpty();
  await page.locator('#answerInput').fill('audiosplat');
  await page.locator('#submitBtn').click();
  await expect(page.locator('#wordHint')).toHaveText('Hint: 2 words');
  await page.locator('#answerInput').fill('TWO WORDS');
  await page.locator('#submitBtn').click();
  await expect(page.locator('#correctCount')).toHaveText('3');
  await expect(page.locator('#answerInput')).toBeDisabled();
});
test('student drag and keyboard movement preserve question identity, and teacher clicks preview questions', async ({ page }) => {
  await page.goto(url);
  await page.locator('#tileGrid').scrollIntoViewIfNeeded();
  const first = await page.locator('[data-question="2"]').boundingBox();
  const last = await page.locator('[data-question="1"]').boundingBox();
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('#tileGrid > :first-child')).toHaveAttribute('data-question', '1');
  await expect(page.locator('#correctCount')).toHaveText('0');
  await page.locator('[data-question="1"]').focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.locator('#tileGrid > :nth-child(2)')).toHaveAttribute('data-question', '1');
  await page.goto(origin + '/solutions/memepuzzle/index.html');
  await page.locator('#qaInput').fill('First? | one\nSecond? | two\nThird? | three');
  await page.locator('#previewBtn').click();
  await page.locator('[data-question="2"]').click();
  await expect(page.locator('#status')).toContainText('Third?');
  await page.locator('[data-question="0"]').focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.locator('#tileGrid > :first-child')).toHaveAttribute('data-question', '1');
});
