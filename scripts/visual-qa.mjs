#!/usr/bin/env node
/**
 * visual-qa.mjs — Headful Playwright visual QA for Friday Night Video.
 * Launches real Chromium (with GPU) to capture security camera screenshots.
 * Saves to /tmp/fnv-cams/ for Claude to read with the Read tool.
 *
 * Usage:
 *   node scripts/visual-qa.mjs                    # all cameras
 *   node scripts/visual-qa.mjs apt_exterior apt_interior  # specific cameras
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const GAME_URL = 'http://localhost:3001/game';
const OUTPUT_DIR = '/tmp/fnv-cams';
const SPECIFIC_CAMS = process.argv.slice(2);

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log('Launching headful Chromium with GPU...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-webgl', '--enable-gpu', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('Loading game...');
  await page.goto(GAME_URL, { timeout: 30000, waitUntil: 'load' });
  await page.waitForTimeout(1000);

  console.log('Starting game...');
  await page.click('.g3-splash-btn').catch(() => {});
  await page.waitForTimeout(2000);

  const eraBtn = page.locator('button:has-text("Early 90s")');
  if (await eraBtn.count() > 0) { await eraBtn.click(); console.log('Era: Early 90s'); }
  await page.waitForTimeout(1500);

  const gotIt = page.locator('button:has-text("GOT IT")');
  if (await gotIt.count() > 0) { await gotIt.click(); console.log('Tutorial dismissed'); }

  console.log('Waiting for 3D scene (10s)...');
  await page.waitForTimeout(10000);

  console.log('Capturing security cameras...');
  const result = await page.evaluate(async (camNames) => {
    if (typeof window.__securityCams !== 'function') return { error: 'No __securityCams' };
    try {
      const names = await window.__securityCams(camNames.length > 0 ? camNames : undefined);
      return { success: true, cameras: names };
    } catch (e) { return { error: e.message }; }
  }, SPECIFIC_CAMS);

  if (result.error) console.error('Failed:', result.error);
  else console.log('Captured:', result.cameras);

  await page.screenshot({ path: `${OUTPUT_DIR}/page-screenshot.png` });
  await page.waitForTimeout(2000);
  await browser.close();
  console.log(`Done! Screenshots in ${OUTPUT_DIR}/`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
