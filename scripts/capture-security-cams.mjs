import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const args = process.argv.slice(2);

function getArg(prefix, fallback) {
  const match = args.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : fallback;
}

const era = getArg("--era", "early90s");
const cameraCsv = getArg("--cams", "");
const outputDir = getArg("--out", "/tmp/fnv-cams");
const baseUrl = getArg("--url", "http://localhost:3014");
const cameras = cameraCsv
  ? cameraCsv.split(",").map((name) => name.trim()).filter(Boolean)
  : null;

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = new URL("/game", baseUrl);
  url.searchParams.set("autostart", "1");
  url.searchParams.set("era", era);

  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.__securityCams === "function", { timeout: 30000 });
  await page.waitForTimeout(3000);

  const captured = await page.evaluate(async (camNames) => {
    const fn = window.__securityCams;
    if (typeof fn !== "function") {
      throw new Error("window.__securityCams is not available");
    }
    return await fn(camNames ?? undefined);
  }, cameras);

  await page.waitForTimeout(1500);

  const expected = (captured ?? cameras ?? []).map((name) => path.join(outputDir, `${name}.png`));
  console.log(`Captured cameras: ${(captured ?? []).join(", ")}`);
  console.log(`Saved to: ${outputDir}`);
  for (const file of expected) {
    try {
      await fs.access(file);
      console.log(`OK ${file}`);
    } catch {
      console.log(`MISSING ${file}`);
    }
  }
} finally {
  await browser.close();
}
