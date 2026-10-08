const { test, expect } = require('@playwright/test');

const games = [
  'castles', 'floodfill', 'flowfree', 'funquiz', 'gilasplat', 'lightsout',
  'splatball', 'squirrel-run-game', 'super-star-trek', 'tangram',
  'untangle'
];

for (const game of games) {
  test(`${game} provides a clear goal and help`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/games/${game}/`);
    await expect(page.locator('.game-ux-coach')).toBeVisible();
    await expect(page.locator('.game-ux-coach')).toContainText('Goal:');
    if (game !== 'super-star-trek') {
      await page.locator('.game-ux-help-button').click();
      await expect(page.locator('.game-ux-dialog')).toBeVisible();
    }
    await expect(page.locator('.game-ux-dialog')).toContainText('Strategy tip:');
    expect(errors).toEqual([]);
  });
}

// Typing Games is now a menu; its four independent experiences provide
// translated instructions directly. Covered by typing-arcade.spec.js.
