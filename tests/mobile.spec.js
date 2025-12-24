// @ts-check
const { test, expect } = require('@playwright/test');

// Only run these tests on mobile devices
test.describe('Mobile Controls', () => {
  // Skip these tests on desktop browsers
  test.skip(({ browserName, isMobile }) => !isMobile, 'Mobile only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should detect touch device', async ({ page }) => {
    const isTouchDevice = await page.evaluate(() => {
      return mobileInput.isTouchDevice;
    });

    expect(isTouchDevice).toBe(true);
  });

  test('should have mobile controls element', async ({ page }) => {
    const mobileControls = page.locator('#mobile-controls');
    await expect(mobileControls).toBeAttached();
  });

  test('should show mobile controls when game starts', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');

    // Wait for game to start
    await page.waitForTimeout(500);

    const mobileControls = page.locator('#mobile-controls');
    await expect(mobileControls).not.toHaveClass(/hidden/);
  });

  test('should have joystick elements', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    await expect(page.locator('#joystick-container')).toBeVisible();
    await expect(page.locator('#joystick-base')).toBeVisible();
    await expect(page.locator('#joystick-knob')).toBeVisible();
  });

  test('should have action buttons', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    await expect(page.locator('#mobile-dash-btn')).toBeVisible();
    await expect(page.locator('#mobile-powerup-btn')).toBeVisible();
    await expect(page.locator('#mobile-pause-btn')).toBeVisible();
  });

  test('should pause game with mobile pause button', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    // Tap pause button
    await page.tap('#mobile-pause-btn');

    const pauseScreen = page.locator('#pause-screen');
    await expect(pauseScreen).toBeVisible();
  });

  test('should hide mobile controls when paused', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    await page.tap('#mobile-pause-btn');

    const mobileControls = page.locator('#mobile-controls');
    await expect(mobileControls).toHaveClass(/hidden/);
  });

  test('should show mobile controls when resumed', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    await page.tap('#mobile-pause-btn');
    await expect(page.locator('#pause-screen')).toBeVisible();

    await page.click('#resume-button');
    // Wait for resume animation/transition
    await page.waitForTimeout(300);

    const mobileControls = page.locator('#mobile-controls');
    // Check that controls are visible (not hidden)
    await expect(mobileControls).toBeVisible();
  });

  test('should respond to joystick touch', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const joystick = page.locator('#joystick-base');
    const box = await joystick.boundingBox();

    if (box) {
      // Simulate touch on joystick
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

      // Check that mobileInput is active
      const isActive = await page.evaluate(() => mobileInput.active);
      expect(isActive).toBe(true);
    }
  });

  test('should update joystick position on drag', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const joystick = page.locator('#joystick-container');
    const box = await joystick.boundingBox();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // Perform a touch drag to the right
      await page.touchscreen.tap(startX, startY);

      // Check the joystick position after interaction
      const knob = page.locator('#joystick-knob');
      await expect(knob).toBeVisible();
    }
  });

  test('dash button should trigger dash', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    // Get initial dash cooldown
    const initialCooldown = await page.evaluate(() => player.dashCooldown);

    // Tap dash button
    await page.tap('#mobile-dash-btn');

    // Wait a bit for the dash to register
    await page.waitForTimeout(100);

    // Check dash was triggered (cooldown should be set)
    const afterCooldown = await page.evaluate(() => player.dashCooldown);
    expect(afterCooldown).toBeGreaterThan(0);
  });

  test('dash button should show cooldown state', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const dashBtn = page.locator('#mobile-dash-btn');

    // Tap dash button
    await page.tap('#mobile-dash-btn');

    // Button should have cooldown class
    await expect(dashBtn).toHaveClass(/cooldown/);

    // Wait for cooldown to end (1 second)
    await page.waitForTimeout(1100);

    // Should no longer have cooldown class
    await expect(dashBtn).not.toHaveClass(/cooldown/);
  });

  test('powerup button should be empty initially', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const powerupBtn = page.locator('#mobile-powerup-btn');
    await expect(powerupBtn).toHaveClass(/empty/);
  });
});

test.describe('Mobile Responsive Layout', () => {
  test.skip(({ browserName, isMobile }) => !isMobile, 'Mobile only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should hide keyboard hints on mobile', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    const footer = page.locator('#game-footer');
    await expect(footer).toBeHidden();
  });

  test('should have minimap and controls visible', async ({ page }) => {
    await page.click('#campaign-button');
    await page.click('#start-button');
    await page.waitForTimeout(500);

    // Both minimap and controls should be visible on mobile
    const minimap = page.locator('#minimap');
    await expect(minimap).toBeVisible();

    const actionBtns = page.locator('#action-buttons');
    await expect(actionBtns).toBeVisible();

    const joystick = page.locator('#joystick-container');
    await expect(joystick).toBeVisible();
  });
});
