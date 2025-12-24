// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Responsive Layout - Desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should hide mobile controls on desktop', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    // Check that mobile controls exist but are hidden
    const mobileControls = page.locator('#mobile-controls');
    await expect(mobileControls).toHaveClass(/hidden/);
  });

  test('should show keyboard hints on desktop', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const footer = page.locator('#game-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('WASD');
    await expect(footer).toContainText('SPACE');
    await expect(footer).toContainText('ESC');
  });

  test('should show powerup display on desktop', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const powerupDisplay = page.locator('#powerup-display');
    await expect(powerupDisplay).toBeVisible();
  });

  test('should not detect as touch device on desktop', async ({ page }) => {
    const isTouchDevice = await page.evaluate(() => mobileInput.isTouchDevice);
    expect(isTouchDevice).toBe(false);
  });
});

test.describe('Viewport Sizes', () => {
  test('should handle small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');

    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();

    // All buttons should still be accessible
    await expect(page.locator('#campaign-button')).toBeVisible();
    await expect(page.locator('#freeplay-button')).toBeVisible();
    await expect(page.locator('#multiplayer-button')).toBeVisible();
  });

  test('should handle large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();

    // Canvas should be visible and at expected size
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBe(800);
    expect(box?.height).toBe(600);
  });

  test('should handle landscape mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape
    await page.goto('/');

    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();
  });

  test('should handle tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');

    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();

    // Canvas should be visible
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Fullscreen Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct body styling', async ({ page }) => {
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        display: styles.display,
        overflow: styles.overflow,
        minHeight: styles.minHeight,
      };
    });

    expect(bodyStyles.display).toBe('flex');
    expect(bodyStyles.overflow).toBe('hidden');
    expect(bodyStyles.minHeight).toBe('100vh');
  });

  test('should have correct viewport meta tag', async ({ page }) => {
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1.0');
    expect(viewport).toContain('maximum-scale=1.0');
    expect(viewport).toContain('user-scalable=no');
  });

  test('game container should be centered', async ({ page }) => {
    const containerStyles = await page.evaluate(() => {
      const container = document.getElementById('game-container');
      const styles = window.getComputedStyle(container);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        alignItems: styles.alignItems,
      };
    });

    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.flexDirection).toBe('column');
    expect(containerStyles.alignItems).toBe('center');
  });
});

test.describe('Menu Screens Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('menu screens should cover full viewport', async ({ page }) => {
    const menuStyles = await page.evaluate(() => {
      const menu = document.getElementById('main-menu');
      const styles = window.getComputedStyle(menu);
      return {
        position: styles.position,
        width: styles.width,
        height: styles.height,
      };
    });

    expect(menuStyles.position).toBe('absolute');
    expect(menuStyles.width).toBe('100%');
    expect(menuStyles.height).toBe('100%');
  });

  test('all menu screens should have same base styling', async ({ page }) => {
    const menuIds = [
      'main-menu',
      'pause-screen',
      'game-over-screen',
      'level-complete-screen',
      'how-to-play-screen',
    ];

    for (const id of menuIds) {
      const hasCorrectClass = await page.evaluate(
        (menuId) => document.getElementById(menuId)?.classList.contains('menu-screen'),
        id
      );
      expect(hasCorrectClass).toBe(true);
    }
  });
});
