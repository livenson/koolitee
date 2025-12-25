// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Game Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game page', async ({ page }) => {
    await expect(page).toHaveTitle('School Escape - Action Arcade Game');
  });

  test('should display the main menu', async ({ page }) => {
    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();
  });

  test('should display game title', async ({ page }) => {
    const title = page.locator('#main-menu h1');
    await expect(title).toContainText('SCHOOL ESCAPE');
  });

  test('should have all game mode buttons', async ({ page }) => {
    await expect(page.locator('#campaign-button')).toBeVisible();
    await expect(page.locator('#freeplay-button')).toBeVisible();
    await expect(page.locator('#multiplayer-button')).toBeVisible();
  });

  test('should have the game canvas', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Check canvas element has valid dimensions (dynamic based on viewport)
    const dimensions = await canvas.evaluate((el) => ({
      width: el.width,
      height: el.height
    }));
    // Canvas should have positive dimensions and maintain roughly 4:3 aspect ratio
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    const aspectRatio = dimensions.width / dimensions.height;
    expect(aspectRatio).toBeGreaterThan(1.2);
    expect(aspectRatio).toBeLessThan(1.5);
  });

  test('should have the minimap canvas', async ({ page }) => {
    const minimap = page.locator('#minimap');
    await expect(minimap).toBeVisible();
  });

  test('should have help button', async ({ page }) => {
    const helpBtn = page.locator('#how-to-play-button');
    await expect(helpBtn).toBeVisible();
  });

  test('should open How To Play screen', async ({ page }) => {
    await page.click('#how-to-play-button');
    const howToPlay = page.locator('#how-to-play-screen');
    await expect(howToPlay).toBeVisible();
    await expect(howToPlay).toContainText('HOW TO PLAY');
    await expect(howToPlay).toContainText('CONTROLS');
    await expect(howToPlay).toContainText('WASD or Arrow Keys');
  });

  test('should close How To Play screen', async ({ page }) => {
    await page.click('#how-to-play-button');
    await expect(page.locator('#how-to-play-screen')).toBeVisible();

    await page.click('#back-to-menu-button');
    await expect(page.locator('#how-to-play-screen')).toHaveClass(/hidden/);
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have language selector', async ({ page }) => {
    // Expand settings panel
    await page.click('#settings-toggle');

    const langSelect = page.locator('#language-select');
    await expect(langSelect).toBeVisible();

    // Check all language options
    const options = langSelect.locator('option');
    await expect(options).toHaveCount(5);
  });

  test('should have avatar selector', async ({ page }) => {
    await page.click('#settings-toggle');

    const avatarSelect = page.locator('#avatar-select');
    await expect(avatarSelect).toBeVisible();

    // Check avatar options
    const options = avatarSelect.locator('option');
    await expect(options).toHaveCount(8);
  });

  test('should have sound toggle', async ({ page }) => {
    await page.click('#settings-toggle');

    const soundBtn = page.locator('#sound-toggle');
    await expect(soundBtn).toBeVisible();
  });

  test('should have random events toggle', async ({ page }) => {
    await page.click('#settings-toggle');

    const eventsBtn = page.locator('#events-toggle');
    await expect(eventsBtn).toBeVisible();
  });
});
