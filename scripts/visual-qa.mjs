#!/usr/bin/env node
/**
 * Friday Night Video — Automated Visual QA Pipeline
 *
 * Launches Playwright, enters the 3D store, captures security camera views,
 * sends them to GPT-4o vision for QA analysis, and reports PASS/FAIL.
 *
 * Usage: npm run visual-qa
 * Requires: dev server running on PORT (default 3000), OPENAI_API_KEY in .env.local
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load .env.local
const envPath = resolve(ROOT, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}

const PORT = process.env.PORT || "3002";
const URL = `http://localhost:${PORT}/game`;
const CAM_DIR = "/tmp/fnv-cams";
const REPORT_PATH = "/tmp/fnv-visual-qa.md";
const CAMERAS = ["overhead", "entrance", "back_wall", "counter"];

// ── Helpers ──────────────────────────────────────────────────

async function callGPT4oVision(images, prompt) {
  const content = [{ type: "text", text: prompt }];
  for (const img of images) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${img.base64}`,
        detail: "high",
      },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 2000,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function parseResults(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results = [];
  for (const line of lines) {
    const passMatch = line.match(/^PASS:\s*(.+)/i);
    const failMatch = line.match(/^FAIL:\s*(.+)/i);
    if (passMatch) results.push({ status: "PASS", detail: passMatch[1] });
    if (failMatch) results.push({ status: "FAIL", detail: failMatch[1] });
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────

console.log("\n=== Friday Night Video — Visual QA Pipeline ===");
console.log(`Target: ${URL}`);
console.log(`Cameras: ${CAMERAS.join(", ")}\n`);

// Phase 1: Launch browser and capture cameras
console.log("Phase 1: Launching browser and capturing security cameras...");

let browser;
let devServer;
let startedServer = false;

try {
  // Check if dev server is running
  try {
    await fetch(URL, { signal: AbortSignal.timeout(2000) });
  } catch {
    console.log("  Dev server not detected, starting one...");
    const { spawn } = await import("child_process");
    devServer = spawn("npx", ["next", "dev", "-p", PORT], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });
    startedServer = true;

    // Log server output for debugging
    devServer.stdout.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg) console.log(`    [next] ${msg}`);
    });
    devServer.stderr.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg) console.log(`    [next:err] ${msg}`);
    });

    // Wait for server to be ready — dev mode compiles on first request
    let serverReady = false;
    for (let i = 0; i < 60; i++) {
      try {
        const resp = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(5000) });
        if (resp.ok || resp.status === 404) { serverReady = true; break; }
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!serverReady) {
      throw new Error(`Dev server failed to start on port ${PORT} after 120s`);
    }
    console.log("  Dev server started.");
  }

  // Use headed mode — R3F/Three.js WebGL needs a real GPU context
  const headless = process.env.VISUAL_QA_HEADLESS === "1";
  browser = await chromium.launch({
    headless,
    args: [
      "--no-sandbox",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      ...(headless ? ["--use-gl=swiftshader"] : []),
    ],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await ctx.newPage();

  // Collect JS errors
  const jsErrors = [];
  page.on("pageerror", (err) => jsErrors.push(err.message));

  console.log("  Navigating to game...");
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });

  // Click "ENTER THE STORE"
  console.log('  Clicking "ENTER THE STORE"...');
  const enterBtn = page.locator('button:has-text("ENTER THE STORE")');
  await enterBtn.waitFor({ state: "visible", timeout: 10000 });
  await enterBtn.click();

  // Wait for 3D scene to load — poll for __securityCams availability
  console.log("  Waiting for 3D scene and security cameras to initialize...");
  const maxWait = 30000;
  const pollInterval = 1000;
  let camsReady = false;
  for (let elapsed = 0; elapsed < maxWait; elapsed += pollInterval) {
    camsReady = await page.evaluate(() => typeof window.__securityCams === "function");
    if (camsReady) break;
    await page.waitForTimeout(pollInterval);
    if (elapsed % 5000 === 0 && elapsed > 0) {
      console.log(`    Still waiting... (${elapsed / 1000}s)`);
    }
  }

  if (!camsReady) {
    throw new Error("__securityCams never became available after 30s. WebGL may have failed to initialize.");
  }
  console.log("  Security cameras ready.");

  // Ensure /tmp/fnv-cams exists
  mkdirSync(CAM_DIR, { recursive: true });

  // Trigger security cameras for our 4 target angles
  console.log(`  Capturing cameras: ${CAMERAS.join(", ")}...`);
  const camResult = await page.evaluate(async (cams) => {
    try {
      const names = await window.__securityCams(cams);
      return { ok: true, names };
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }, CAMERAS);

  if (camResult.error) {
    throw new Error(`Security camera capture failed: ${camResult.error}`);
  }
  console.log(`  Captured: ${camResult.names.join(", ")}`);

  // Wait for API to save files
  await page.waitForTimeout(2000);

  if (jsErrors.length > 0) {
    console.log(`  JS errors during capture: ${jsErrors.length}`);
    jsErrors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
  }

  await browser.close();
  browser = null;

  // Phase 2: Read camera images
  console.log("\nPhase 2: Reading captured images...");
  const images = [];
  for (const cam of CAMERAS) {
    const imgPath = `${CAM_DIR}/${cam}.png`;
    if (!existsSync(imgPath)) {
      console.error(`  WARNING: Missing image for camera "${cam}" at ${imgPath}`);
      continue;
    }
    const buf = readFileSync(imgPath);
    images.push({ name: cam, base64: buf.toString("base64"), path: imgPath });
    const kb = Math.round(buf.length / 1024);
    console.log(`  Loaded ${cam}.png (${kb} KB)`);
  }

  if (images.length === 0) {
    console.error("ERROR: No camera images captured. Aborting.");
    process.exit(1);
  }

  // Phase 3: Send to GPT-4o vision
  console.log(`\nPhase 3: Sending ${images.length} images to GPT-4o for visual QA...\n`);

  const qaPrompt = `You are a QA tester for a 3D video store game. Check these ${images.length} camera angles for:
- Objects overlapping or clipping through each other
- Things floating (not touching surfaces)
- Text facing wrong direction
- Scale issues (too big/small)
- Empty areas that look broken
- Any obvious visual bugs

The cameras are: ${images.map((i) => i.name).join(", ")}.

For each issue found, respond with: FAIL: [camera] [description]
If no issues: PASS: [camera] looks good

Be specific. Only flag real problems, not style opinions.`;

  const response = await callGPT4oVision(images, qaPrompt);

  // Phase 4: Parse and report
  console.log("Phase 4: Parsing results...\n");

  const results = parseResults(response);
  const passes = results.filter((r) => r.status === "PASS");
  const fails = results.filter((r) => r.status === "FAIL");

  // Print summary
  console.log("─".repeat(60));
  console.log("  VISUAL QA RESULTS");
  console.log("─".repeat(60));

  for (const r of results) {
    const icon = r.status === "PASS" ? "[PASS]" : "[FAIL]";
    console.log(`  ${icon} ${r.detail}`);
  }

  console.log("─".repeat(60));
  console.log(`  Total: ${passes.length} passed, ${fails.length} failed`);
  console.log("─".repeat(60));

  // Save full report
  const report = `# Friday Night Video — Visual QA Report
**Date:** ${new Date().toISOString()}
**Cameras:** ${CAMERAS.join(", ")}
**Images:** ${images.map((i) => i.path).join(", ")}

## Summary
- **Passed:** ${passes.length}
- **Failed:** ${fails.length}
- **Total checks:** ${results.length}

## GPT-4o Analysis

${response}

## Parsed Results

${results.map((r) => `- **${r.status}:** ${r.detail}`).join("\n")}

${jsErrors.length > 0 ? `## JS Errors During Capture\n\n${jsErrors.map((e) => `- ${e}`).join("\n")}` : ""}
`;

  writeFileSync(REPORT_PATH, report);
  console.log(`\nFull report saved to: ${REPORT_PATH}`);
  console.log(`Camera images in: ${CAM_DIR}/`);

  // Exit code
  if (fails.length > 0) {
    console.log(`\nExiting with code 1 (${fails.length} failures found)`);
    process.exit(1);
  } else {
    console.log("\nAll cameras passed visual QA.");
    process.exit(0);
  }
} catch (err) {
  console.error("\nFATAL:", err.message || err);
  process.exit(1);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (devServer) devServer.kill();
}
