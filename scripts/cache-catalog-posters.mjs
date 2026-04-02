import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const curatedCatalogPath = path.join(cwd, "src", "lib", "curated-movie-catalog.ts");
const generatedCatalogPath = path.join(cwd, "src", "lib", "generated-era-catalog.ts");
const envPath = path.join(cwd, ".env.local");
const outputDir = path.join(cwd, "public", "images", "posters");

async function loadApiKey() {
  if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY;
  const envText = await readFile(envPath, "utf8");
  const match = envText.match(/^TMDB_API_KEY=(.+)$/m);
  if (!match) throw new Error("TMDB_API_KEY not found in .env.local");
  return match[1].trim();
}

function parseCuratedCatalog(text) {
  const objectMatches = text.match(/\{ id: \d+,[^\n]+\}/g) || [];
  return objectMatches.map((entry) => {
    const id = Number(entry.match(/id: (\d+)/)?.[1]);
    const title = entry.match(/title: "([^"]+)"/)?.[1];
    const year = Number(entry.match(/year: (\d{4})/)?.[1]);
    if (!id || !title || !year) return null;
    return { id, title, year };
  }).filter(Boolean);
}

function parseGeneratedCatalog(text) {
  const matches = Array.from(
    text.matchAll(/"id":\s*(\d+),[\s\S]*?"title":\s*"([^"]+)",[\s\S]*?"year":\s*(\d{4})/g)
  );

  return matches.map((match) => ({
    id: Number(match[1]),
    title: match[2],
    year: Number(match[3]),
  }));
}

function dedupeMovies(movies) {
  const seenIds = new Set();
  const seenTitleYears = new Set();
  return movies.filter((movie) => {
    if (!movie?.id) return false;
    const titleYear = `${String(movie.title).trim().toLowerCase()}::${movie.year}`;
    if (seenIds.has(movie.id) || seenTitleYears.has(titleYear)) return false;
    seenIds.add(movie.id);
    seenTitleYears.add(titleYear);
    return true;
  });
}

async function searchPosterPath(apiKey, title, year) {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", title);
  url.searchParams.set("year", String(year));
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB search failed for ${title}: ${res.status}`);
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  const exact = results.find((movie) =>
    String(movie.title || "").toLowerCase() === title.toLowerCase() &&
    String(movie.release_date || "").startsWith(String(year))
  );

  const fallback = results.find((movie) =>
    String(movie.release_date || "").startsWith(String(year))
  ) || results[0];

  return exact?.poster_path || fallback?.poster_path || null;
}

async function downloadPoster(posterPath, outputPath) {
  const posterUrl = `https://image.tmdb.org/t/p/w342${posterPath}`;
  const res = await fetch(posterUrl);
  if (!res.ok) throw new Error(`Poster download failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await writeFile(outputPath, bytes);
}

const apiKey = await loadApiKey();
const curatedText = await readFile(curatedCatalogPath, "utf8");
const generatedText = await readFile(generatedCatalogPath, "utf8");
const movies = dedupeMovies([
  ...parseCuratedCatalog(curatedText),
  ...parseGeneratedCatalog(generatedText),
]);

await mkdir(outputDir, { recursive: true });

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const movie of movies) {
  const outputPath = path.join(outputDir, `${movie.id}.jpg`);
  try {
    try {
      await access(outputPath);
      skipped++;
      console.log(`skip ${movie.title} (${movie.year})`);
      continue;
    } catch {
      // Download missing posters only.
    }
    const posterPath = await searchPosterPath(apiKey, movie.title, movie.year);
    if (!posterPath) {
      failed++;
      console.log(`missing ${movie.title} (${movie.year})`);
      continue;
    }
    await downloadPoster(posterPath, outputPath);
    downloaded++;
    console.log(`cached ${movie.title} (${movie.year})`);
  } catch (error) {
    failed++;
    console.log(`failed ${movie.title} (${movie.year}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`done downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
