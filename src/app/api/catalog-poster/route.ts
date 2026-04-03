import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCatalogMovieById, ensureCatalogLoaded } from "@/lib/curated-movie-catalog";

const GENRE_COLORS: Record<string, { bg: string; fg: string; accent: string }> = {
  Action: { bg: "#7f1d1d", fg: "#fff7ed", accent: "#fb923c" },
  Adventure: { bg: "#1d4ed8", fg: "#eff6ff", accent: "#facc15" },
  Comedy: { bg: "#b45309", fg: "#fff7ed", accent: "#fde047" },
  Drama: { bg: "#1e3a8a", fg: "#eff6ff", accent: "#93c5fd" },
  Family: { bg: "#166534", fg: "#f0fdf4", accent: "#facc15" },
  Fantasy: { bg: "#6d28d9", fg: "#f5f3ff", accent: "#f9a8d4" },
  Horror: { bg: "#3f0d12", fg: "#fee2e2", accent: "#ef4444" },
  Musical: { bg: "#9d174d", fg: "#fdf2f8", accent: "#f9a8d4" },
  Romance: { bg: "#be185d", fg: "#fff1f2", accent: "#fbcfe8" },
  "Science Fiction": { bg: "#0f766e", fg: "#ecfeff", accent: "#67e8f9" },
  Thriller: { bg: "#312e81", fg: "#eef2ff", accent: "#c4b5fd" },
  Western: { bg: "#78350f", fg: "#fffbeb", accent: "#fbbf24" },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitTitle(title: string): [string, string] {
  const words = title.split(" ");
  if (words.length <= 2) return [title, ""];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const cacheDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "images", "posters");
  const candidateFiles = [
    path.join(cacheDir, `${id}.jpg`),
    path.join(cacheDir, `${id}.jpeg`),
    path.join(cacheDir, `${id}.png`),
    path.join(cacheDir, `${id}.webp`),
  ];

  for (const filePath of candidateFiles) {
    try {
      const data = await readFile(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const contentType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      return new Response(data, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Try next cached format.
    }
  }

  await ensureCatalogLoaded();
  const movie = getCatalogMovieById(id);

  if (!movie) {
    return new Response("Not found", { status: 404 });
  }

  if (movie.posterUrl) {
    try {
      const res = await fetch(movie.posterUrl);
      if (res.ok) {
        return new Response(await res.arrayBuffer(), {
          headers: {
            "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch {
      // Fall back to generated art below.
    }
  }

  const primaryGenre = movie.genres[0] || "Drama";
  const palette = GENRE_COLORS[primaryGenre] || GENRE_COLORS.Drama;
  const [line1, line2] = splitTitle(movie.title);
  const genreLabel = escapeXml(movie.genres.slice(0, 2).join(" / ").toUpperCase());

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bg}" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="342" height="513" fill="url(#bg)" />
      <rect x="18" y="18" width="306" height="477" rx="18" fill="none" stroke="${palette.accent}" stroke-width="4" opacity="0.9" />
      <rect x="34" y="34" width="274" height="48" rx="10" fill="${palette.accent}" opacity="0.95" />
      <text x="171" y="65" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#111827" letter-spacing="2">${genreLabel}</text>
      <circle cx="171" cy="220" r="96" fill="none" stroke="${palette.accent}" stroke-width="10" opacity="0.18" />
      <circle cx="171" cy="220" r="62" fill="none" stroke="${palette.accent}" stroke-width="4" opacity="0.28" />
      <rect x="58" y="338" width="226" height="98" rx="14" fill="#0b1020" fill-opacity="0.72" />
      <text x="171" y="375" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900" fill="${palette.fg}" letter-spacing="1">${escapeXml(line1.toUpperCase())}</text>
      ${line2 ? `<text x="171" y="409" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="24" font-weight="900" fill="${palette.fg}" letter-spacing="1">${escapeXml(line2.toUpperCase())}</text>` : ""}
      <text x="171" y="468" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="${palette.accent}">${movie.year}</text>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
