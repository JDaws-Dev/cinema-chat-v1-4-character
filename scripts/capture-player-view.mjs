// Ground-truth capture: screenshots the ACTUAL player viewport (not a secondary
// camera), so what we see is exactly what a player sees — fog, post-processing,
// and all. Walks the player forward in stages to sample the whole store.
//
// Usage: node scripts/capture-player-view.mjs [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = process.argv[2] || "/tmp/fnv-player";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false, channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/game", { waitUntil: "networkidle", timeout: 30000 });
await page.evaluate(() => localStorage.setItem("fnv_user_email", "capture@local.test"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const enterBtn = page
  .locator('button:has-text("ENTER THE STORE"), button:has-text("PLAY FREE")')
  .first();
await enterBtn.click();

// Scene is ready once the debug hook the security-cam harness installs exists.
await page.waitForFunction(() => typeof window.__securityCams === "function", { timeout: 30000 });

// Two modals gate the store and dim the scene behind them: "CHOOSE YOUR ERA"
// then the "GOT IT" tutorial. They appear with a delay, so poll rather than
// checking once — otherwise every capture is the same greyed-out frame.
const GATES = ['button:has-text("Late 80s")', 'button:has-text("GOT IT")'];
for (let i = 0; i < 20; i++) {
  const topIsCanvas = await page.evaluate(
    () => document.elementFromPoint(640, 500)?.tagName === "CANVAS",
  );
  if (topIsCanvas) break;
  let clicked = false;
  for (const sel of GATES) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      console.log(`gate cleared: ${sel}`);
      clicked = true;
      break;
    }
  }
  await page.waitForTimeout(clicked ? 900 : 500);
}

// Click the canvas to take pointer lock so WASD + mouse-look reach the game.
await page.locator("canvas").first().click({ position: { x: 640, y: 500 }, force: true });
await page.waitForTimeout(2500); // let lights/textures settle

// Stages: hold a key for N ms, then shoot. Cumulative — each builds on the last.
const stages = [
  { name: "01_spawn", key: null, ms: 0 },
  { name: "02_doorway", key: "KeyW", ms: 900 },
  { name: "03_front_aisle", key: "KeyW", ms: 900 },
  { name: "04_mid_store", key: "KeyW", ms: 1100 },
  { name: "05_back_wall", key: "KeyW", ms: 1100 },
  { name: "06_look_left", key: null, ms: 0, mouse: [-450, 0] },
  { name: "07_look_right", key: null, ms: 0, mouse: [900, 0] },
];

for (const s of stages) {
  if (s.key) {
    await page.keyboard.down(s.key);
    await page.waitForTimeout(s.ms);
    await page.keyboard.up(s.key);
  }
  if (s.mouse) await page.mouse.move(s.mouse[0], s.mouse[1], { steps: 10 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log(`shot ${s.name}`);
}

await browser.close();
console.log(`Done. Player-view captures in ${OUT}/`);
