#!/usr/bin/env node
// Friday Night Video — visual game evaluation
// Usage: npm run eval
// Launches a real browser, screenshots the game, then sends to Codex for AI review.

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const OUT = '/tmp/fnv-eval';
const REPORT = '/tmp/fnv-eval-report.md';
const PORT = process.env.PORT || '3001';
const URL = `http://localhost:${PORT}/game`;

mkdirSync(OUT, { recursive: true });
// Clean old screenshots
if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.png')) execSync(`rm "${OUT}/${f}"`);
  }
}

const shots = [];
async function snap(page, name, delay = 500) {
  await page.waitForTimeout(delay);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  shots.push(path);
  console.log(`  📸 ${name}`);
}

console.log(`\n🎬 Friday Night Video — Visual Eval`);
console.log(`   Target: ${URL}\n`);

// ── Phase 1: Capture screenshots ───────────────────────────

console.log('Phase 1: Capturing screenshots...');

const browser = await chromium.launch({
  headless: false,
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

// Collect JS errors
const jsErrors = [];
page.on('pageerror', err => jsErrors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') jsErrors.push(msg.text());
});

// Landing page
await page.goto(URL, { waitUntil: 'networkidle' });
await snap(page, '01_landing', 1000);

// Enter the store
const enterBtn = page.locator('button:has-text("ENTER THE STORE")');
if (await enterBtn.isVisible()) {
  await enterBtn.click();
  await page.waitForTimeout(5000); // wait for 3D to load
  await snap(page, '02_store_spawn', 500);
}

// Capture initial view
await snap(page, '03_forward_view', 1000);

// Click canvas to engage, then look around via mouse
await page.locator('canvas').click().catch(() => {});
await page.waitForTimeout(500);
await snap(page, '04_after_click', 500);

// Simulate walking forward (W key held for 2s)
await page.keyboard.down('w');
await page.waitForTimeout(2000);
await page.keyboard.up('w');
await snap(page, '05_walked_forward', 500);

// Turn left
await page.keyboard.down('a');
await page.waitForTimeout(1000);
await page.keyboard.up('a');
await snap(page, '06_strafed_left', 500);

// Walk more and interact
await page.keyboard.down('w');
await page.waitForTimeout(1500);
await page.keyboard.up('w');
await page.keyboard.press('e');
await page.waitForTimeout(500);
await snap(page, '07_deep_in_store', 500);

// Try Q to close any overlay
await page.keyboard.press('q');
await page.waitForTimeout(300);

// Walk right toward counter
await page.keyboard.down('d');
await page.waitForTimeout(2000);
await page.keyboard.up('d');
await page.keyboard.down('w');
await page.waitForTimeout(1000);
await page.keyboard.up('w');
await snap(page, '08_near_counter', 500);

// Check UI state
const uiState = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return {
    canvas: c ? { w: c.width, h: c.height } : null,
    hud: !!document.querySelector('.g3-hud'),
    crosshair: !!document.querySelector('.g3-crosshair'),
    hoverLabel: document.querySelector('.g3-hover-label')?.textContent || null,
    overlay: document.querySelector('[class*="g3-overlay"]')?.className || null,
    mobileControls: document.querySelectorAll('.mobile-joystick, .mobile-interact-btn').length,
  };
});

await browser.close();

console.log(`\n  Captured ${shots.length} screenshots`);
console.log(`  JS errors: ${jsErrors.length}`);
console.log(`  UI state: ${JSON.stringify(uiState, null, 2)}`);

// ── Phase 2: Send to Codex for evaluation ──────────────────

console.log('\nPhase 2: Sending to Codex for AI evaluation...\n');

// Pick best screenshots (max 5 for token efficiency)
const evalShots = shots.filter((_, i) => [0, 1, 4, 6, 7].includes(i)).slice(0, 5);
if (evalShots.length === 0) {
  console.error('No screenshots captured. Is the dev server running?');
  process.exit(1);
}

const imageArgs = evalShots.map(s => `-i "${s}"`).join(' ');
const errorContext = jsErrors.length > 0
  ? `\n\nJS console errors captured during gameplay:\n${jsErrors.slice(0, 5).map(e => `- ${e}`).join('\n')}`
  : '\n\nNo JS errors detected during gameplay.';

const prompt = `You are evaluating screenshots from a 3D first-person Blockbuster Video Store game called "Friday Night Video" set in 1992. Built with Next.js + React Three Fiber.

The screenshots show: landing page, store spawn point, walking through aisles, deep in store, and near the counter area.

UI state during capture: ${JSON.stringify(uiState)}${errorContext}

Rate each area 1-10 with specific observations:
1. LANDING PAGE: branding, typography, CTA clarity
2. STORE ATMOSPHERE: lighting, color, mood, does it feel like a 90s video store at night?
3. ENVIRONMENT DETAIL: shelves, props, signage, NPCs, density of objects
4. HUD/UI: crosshair, interaction prompts, readability, consistency
5. VISUAL BUGS: z-fighting, missing textures, mirrored text, clipping, alignment
6. OVERALL: playable demo or rough prototype? What's the single biggest thing holding it back?

Then list the TOP 10 specific visual improvements ranked by impact. Reference what you see in the actual screenshots. Do NOT modify any files.`;

try {
  execSync(
    `codex exec --full-auto ${imageArgs} -o "${REPORT}" "${prompt.replace(/"/g, '\\"')}"`,
    { stdio: 'inherit', timeout: 300000 }
  );
  console.log(`\n✅ Report saved to: ${REPORT}`);
  console.log(`   Screenshots in: ${OUT}/`);
} catch (e) {
  console.error('Codex evaluation failed. Screenshots are still available at:', OUT);
  process.exit(1);
}
