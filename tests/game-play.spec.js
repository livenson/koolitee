// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Campaign Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start campaign mode', async ({ page }) => {
    // Click campaign button
    await page.click('#campaign-button');

    // Progress display should appear
    const progressDisplay = page.locator('#campaign-progress-display');
    await expect(progressDisplay).toBeVisible();

    // Start button should appear
    const startButton = page.locator('#start-button');
    await expect(startButton).toBeVisible();
  });

  test('should start the game when clicking start', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');

    // Menu should be hidden
    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toHaveClass(/hidden/);

    // Game header should show score
    const score = page.locator('#score-display');
    await expect(score).toContainText('Score:');
  });

  test('should display level info after starting', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');

    // Level display should show level 1
    const levelDisplay = page.locator('#level-display');
    await expect(levelDisplay).toBeVisible();
  });
});

test.describe('Free Play Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show free play settings', async ({ page }) => {
    await page.click('#freeplay-button');

    const freeplaySettings = page.locator('#freeplay-settings');
    await expect(freeplaySettings).toBeVisible();
  });

  test('should have difficulty settings', async ({ page }) => {
    await page.click('#freeplay-button');

    await expect(page.locator('#school-type')).toBeVisible();
    await expect(page.locator('#map-size')).toBeVisible();
    await expect(page.locator('#teacher-count')).toBeVisible();
  });

  test('should update teacher count display', async ({ page }) => {
    await page.click('#freeplay-button');

    const slider = page.locator('#teacher-count');
    const display = page.locator('#teacher-count-display');

    // Change slider value
    await slider.fill('6');
    await expect(display).toContainText('6');
  });
});

test.describe('Keyboard Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Start a game
    await page.click('#campaign-button');
    await page.click('#start-button');
    // Wait for game to initialize
    await page.waitForTimeout(500);
  });

  test('should pause game with Escape key', async ({ page }) => {
    await page.keyboard.press('Escape');

    const pauseScreen = page.locator('#pause-screen');
    await expect(pauseScreen).toBeVisible();
  });

  test('should resume game from pause', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-screen')).toBeVisible();

    await page.click('#resume-button');
    await expect(page.locator('#pause-screen')).toHaveClass(/hidden/);
  });

  test('should quit to menu from pause', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.click('#quit-button');

    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();
  });

  test('should register WASD keys', async ({ page }) => {
    // These tests verify the game receives keyboard input
    // We check that no errors occur when pressing movement keys
    await page.keyboard.press('KeyW');
    await page.keyboard.press('KeyA');
    await page.keyboard.press('KeyS');
    await page.keyboard.press('KeyD');

    // Game should still be running (no crash)
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should register arrow keys', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should trigger dash with Space', async ({ page }) => {
    // Press space for dash
    await page.keyboard.press('Space');

    // Game should still be running
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Game State', () => {
  test('should initialize game state variables', async ({ page }) => {
    await page.goto('/');

    // Check that game state exists
    const hasGameState = await page.evaluate(() => {
      return typeof gameState !== 'undefined' &&
             typeof player !== 'undefined' &&
             typeof teachers !== 'undefined';
    });

    expect(hasGameState).toBe(true);
  });

  test('should have correct initial game state', async ({ page }) => {
    await page.goto('/');

    const state = await page.evaluate(() => ({
      running: gameState.running,
      paused: gameState.paused,
      score: gameState.score,
      lives: gameState.lives,
    }));

    expect(state.running).toBe(false);
    expect(state.paused).toBe(false);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(3);
  });

  test('should set running to true after start', async ({ page }) => {
    await page.goto('/');
    await page.click('#campaign-button');
    await page.click('#start-button');

    const isRunning = await page.evaluate(() => gameState.running);
    expect(isRunning).toBe(true);
  });
});
