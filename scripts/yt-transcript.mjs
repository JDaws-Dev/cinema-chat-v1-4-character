#!/usr/bin/env node
/**
 * yt-transcript.mjs — Fetch YouTube video transcript
 *
 * Usage:
 *   node scripts/yt-transcript.mjs <youtube-url-or-id>
 *   node scripts/yt-transcript.mjs https://www.youtube.com/watch?v=QCS1DOu2IzU
 *   node scripts/yt-transcript.mjs QCS1DOu2IzU
 *
 * Outputs plain text transcript to stdout.
 * Saves full transcript to /tmp/yt-transcript-<id>.txt
 */

import { getSubtitles } from "youtube-caption-extractor";
import { writeFileSync } from "fs";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/yt-transcript.mjs <youtube-url-or-id>");
  process.exit(1);
}

// Extract video ID from URL or use as-is
let videoId = arg;
try {
  const url = new URL(arg);
  videoId = url.searchParams.get("v") || url.pathname.split("/").pop() || arg;
} catch {
  // Not a URL, use as ID directly
}

console.error(`Fetching transcript for: ${videoId}`);

try {
  const segments = await getSubtitles({ videoID: videoId, lang: "en" });

  if (!segments || segments.length === 0) {
    console.error("No transcript available for this video.");
    process.exit(1);
  }

  // Format: timestamp + text
  const lines = segments.map((s) => {
    const startSec = parseFloat(s.start) || 0;
    const mins = Math.floor(startSec / 60);
    const secs = Math.floor(startSec % 60);
    const ts = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `[${ts}] ${s.text}`;
  });

  const fullText = lines.join("\n");
  const plainText = segments.map((s) => s.text).join(" ");

  // Save to file
  const outPath = `/tmp/yt-transcript-${videoId}.txt`;
  writeFileSync(outPath, fullText, "utf-8");
  console.error(`Saved ${segments.length} segments to ${outPath}`);

  // Output plain text to stdout
  console.log(plainText);
} catch (err) {
  console.error(`Failed to fetch transcript: ${err.message}`);
  process.exit(1);
}
