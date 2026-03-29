import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";

/**
 * Receives security camera captures and saves them to /tmp/fnv-cams/
 * so Claude can read them with the Read tool.
 */
export async function POST(request: NextRequest) {
  try {
    const { captures } = await request.json();
    if (!Array.isArray(captures)) {
      return NextResponse.json({ error: "Expected captures array" }, { status: 400 });
    }

    const dir = "/tmp/fnv-cams";
    await writeFile("/dev/null", "").catch(() => {}); // ensure fs works
    const { mkdir } = await import("fs/promises");
    await mkdir(dir, { recursive: true });

    for (const cap of captures) {
      const { name, dataUrl } = cap;
      if (!name || !dataUrl) continue;
      // Strip data:image/png;base64, prefix
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(base64, "base64");
      await writeFile(`${dir}/${name}.png`, buf);
    }

    return NextResponse.json({ saved: captures.length, dir });
  } catch (err) {
    console.error("debug-cam error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
