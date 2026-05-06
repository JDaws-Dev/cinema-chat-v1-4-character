// Launches headed Chromium (system Chrome — has GPU/WebGL), navigates to the game,
// clicks PLAY FREE, calls window.__securityCams(), waits for the API to save 22 PNGs to /tmp/fnv-cams/, exits.
import { chromium } from "playwright";
import { mkdirSync, existsSync, readdirSync } from "fs";

mkdirSync("/tmp/fnv-cams", { recursive: true });

const browser = await chromium.launch({
  headless: false, // need real GPU for WebGL
  channel: "chrome", // use system Chrome instead of bundled Chromium
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") return;
  console.log(`[browser] ${m.text()}`);
});

console.log("Navigating...");
// Pre-seed email so the splash skips the input prompt and goes straight to
// the "ENTER THE STORE" path.
await page.goto("http://localhost:3000/game", { waitUntil: "networkidle", timeout: 30000 });
await page.evaluate(() => localStorage.setItem("fnv_user_email", "capture@local.test"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

console.log("Clicking ENTER THE STORE...");
const enterBtn = page.locator('button:has-text("ENTER THE STORE"), button:has-text("PLAY FREE")').first();
await enterBtn.click();

console.log("Waiting for scene to load...");
await page.waitForFunction(() => typeof (window).__securityCams === "function", { timeout: 30000 });
await page.waitForTimeout(3000); // let the scene settle

console.log("Triggering security cam capture...");
await page.evaluate(() => (window).__securityCams());

// Poll /tmp/fnv-cams/ for 22 files
const startTs = Date.now();
let lastCount = 0;
while (Date.now() - startTs < 60000) {
  const files = existsSync("/tmp/fnv-cams")
    ? readdirSync("/tmp/fnv-cams").filter((f) => f.endsWith(".png"))
    : [];
  if (files.length !== lastCount) {
    console.log(`  ${files.length} files saved...`);
    lastCount = files.length;
  }
  if (files.length >= 22) break;
  await page.waitForTimeout(500);
}

const final = readdirSync("/tmp/fnv-cams").filter((f) => f.endsWith(".png"));
console.log(`Done. ${final.length} captures in /tmp/fnv-cams/`);

await browser.close();
