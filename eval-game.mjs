// Game evaluation script — Playwright takes screenshots of the game for AI review
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/tmp/fnv-eval';
mkdirSync(OUT, { recursive: true });

const SCREENSHOTS = [];
async function snap(page, name, delay = 500) {
  await page.waitForTimeout(delay);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  SCREENSHOTS.push(path);
  console.log(`📸 ${name}: ${path}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  // 1. Landing page
  console.log('--- Loading game ---');
  await page.goto('http://localhost:3001/game', { waitUntil: 'networkidle' });
  await snap(page, '01_landing_page', 1000);

  // 2. Click "Enter the Store"
  console.log('--- Entering store ---');
  const enterBtn = page.locator('button:has-text("ENTER THE STORE")');
  if (await enterBtn.isVisible()) {
    await enterBtn.click();
    await snap(page, '02_loading', 1000);
    // Wait for loading to finish
    await page.waitForTimeout(4000);
    await snap(page, '03_store_entry', 500);
  }

  // 3. Take screenshots from the 3D view at different points
  // Since we can't WASD in headless, let's capture the initial view
  // and check for UI elements
  await snap(page, '04_initial_view', 1000);

  // 4. Check HUD elements
  const hud = await page.locator('.g3-hud').isVisible().catch(() => false);
  console.log(`HUD visible: ${hud}`);

  // 5. Check crosshair
  const crosshair = await page.locator('.g3-crosshair').isVisible().catch(() => false);
  console.log(`Crosshair visible: ${crosshair}`);

  // 6. Check for any overlay elements
  const overlays = await page.locator('[class*="g3-overlay"]').count().catch(() => 0);
  console.log(`Overlay elements: ${overlays}`);

  // 7. Check for hover label
  const hoverLabel = await page.locator('.g3-hover-label').isVisible().catch(() => false);
  console.log(`Hover label visible: ${hoverLabel}`);

  // 8. Simulate clicking the canvas to trigger pointer lock (won't work headless but captures state)
  await page.locator('canvas').click().catch(() => {});
  await snap(page, '05_after_click', 1000);

  // 9. Try pressing E to interact
  await page.keyboard.press('e');
  await snap(page, '06_after_e_key', 500);

  // 10. Try pressing Q to close any overlay
  await page.keyboard.press('q');
  await snap(page, '07_after_q_close', 500);

  // 11. Check console for any errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(2000);

  // 12. Get page dimensions and canvas info
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    return { width: c.width, height: c.height, style: c.style.cssText };
  });
  console.log(`Canvas info: ${JSON.stringify(canvasInfo)}`);

  // 13. Check mobile controls are NOT showing on desktop
  const mobileControls = await page.locator('.mobile-joystick, .mobile-interact-btn').count().catch(() => 0);
  console.log(`Mobile controls visible: ${mobileControls}`);

  // 14. Final full page screenshot
  await snap(page, '08_final_state', 500);

  // Report
  console.log('\n--- EVALUATION REPORT ---');
  console.log(`Screenshots saved: ${SCREENSHOTS.length}`);
  console.log(`JS errors captured: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log(`Screenshot paths:\n${SCREENSHOTS.join('\n')}`);

  await browser.close();
})();
