// Perf probe: measures REAL draw calls and FPS in the actual player viewport.
// Patches the WebGL draw entrypoints before any page script runs, then samples
// per-frame counts once the player is standing in the store.
//
// Use this instead of guessing at perf from mesh counts — a poster wall that
// "looks expensive" may be batching fine, and a cheap-looking scene may be
// issuing a draw call per tape.
//
// Usage: node scripts/perf-probe.mjs
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false, channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// Must be installed BEFORE page scripts so we wrap the real prototypes.
await page.addInitScript(() => {
  const w = window;
  w.__perf = { draws: 0, frames: 0, drawsThisFrame: 0, samples: [] };
  for (const proto of [
    WebGLRenderingContext.prototype,
    window.WebGL2RenderingContext ? WebGL2RenderingContext.prototype : null,
  ]) {
    if (!proto) continue;
    for (const fn of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const orig = proto[fn];
      if (!orig) continue;
      proto[fn] = function (...args) {
        w.__perf.draws++;
        w.__perf.drawsThisFrame++;
        return orig.apply(this, args);
      };
    }
  }
  const raf = w.requestAnimationFrame.bind(w);
  const tick = () => {
    w.__perf.frames++;
    w.__perf.samples.push(w.__perf.drawsThisFrame);
    if (w.__perf.samples.length > 240) w.__perf.samples.shift();
    w.__perf.drawsThisFrame = 0;
    raf(tick);
  };
  raf(tick);
});

await page.goto("http://localhost:3000/game", { waitUntil: "networkidle", timeout: 30000 });
await page.evaluate(() => localStorage.setItem("fnv_user_email", "perf@local.test"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.locator('button:has-text("ENTER THE STORE"), button:has-text("PLAY FREE")').first().click();
await page.waitForFunction(() => typeof window.__securityCams === "function", { timeout: 30000 });

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
      clicked = true;
      break;
    }
  }
  await page.waitForTimeout(clicked ? 900 : 500);
}

await page.locator("canvas").first().click({ position: { x: 640, y: 500 }, force: true });

// Let textures finish streaming in so we measure the steady state, not the ramp.
await page.waitForTimeout(8000);

async function sample(label) {
  const before = await page.evaluate(() => ({ f: window.__perf.frames, d: window.__perf.draws, t: performance.now() }));
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({
    f: window.__perf.frames,
    d: window.__perf.draws,
    t: performance.now(),
    recent: window.__perf.samples.slice(-60),
  }));
  const secs = (after.t - before.t) / 1000;
  const fps = (after.f - before.f) / secs;
  const perFrame = (after.d - before.d) / Math.max(after.f - before.f, 1);
  const recent = after.recent.filter((n) => n > 0).sort((a, b) => a - b);
  const median = recent.length ? recent[Math.floor(recent.length / 2)] : 0;
  console.log(
    `${label.padEnd(16)} fps ${fps.toFixed(1).padStart(5)}   draws/frame ${perFrame.toFixed(0).padStart(5)}   median ${String(median).padStart(5)}`,
  );
}

await sample("at spawn");
await page.keyboard.down("KeyW");
await page.waitForTimeout(2000);
await page.keyboard.up("KeyW");
await page.waitForTimeout(500);
await sample("front of store");
await page.keyboard.down("KeyW");
await page.waitForTimeout(2000);
await page.keyboard.up("KeyW");
await page.waitForTimeout(500);
await sample("mid store");

await browser.close();
