import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");
const outputPath = path.join(cwd, "src", "lib", "generated-era-catalog.ts");

const ERAS = {
  late80s: { start: 1987, end: 1989 },
  early90s: { start: 1990, end: 1993 },
  mid90s: { start: 1994, end: 1996 },
  late90s: { start: 1997, end: 1999 },
};

const SHELF_TARGETS = {
  action: 72,
  adventure: 72,
  thriller: 72,
  comedy: 108,
  romance: 108,
  horror: 72,
  western: 96,
  musical: 72,
  drama: 108,
  classics: 72,
  scifi: 72,
  fantasy: 72,
  kids: 54,
  family: 54,
  new: 80,
};

const GENRE_QUERIES = {
  western: [{ with_genres: "37" }],
  musical: [{ with_genres: "10402" }],
  kids: [{ with_genres: "16" }, { with_genres: "10751", with_keywords: "9715" }],
  family: [{ with_genres: "10751" }],
  fantasy: [{ with_genres: "14" }],
  romance: [{ with_genres: "10749" }],
  horror: [{ with_genres: "27" }],
  scifi: [{ with_genres: "878" }],
  thriller: [{ with_genres: "53" }],
  comedy: [{ with_genres: "35" }],
  adventure: [{ with_genres: "12" }],
  action: [{ with_genres: "28" }],
  drama: [{ with_genres: "18" }, { with_genres: "80" }, { with_genres: "36" }],
  classics: [{ sort_by: "vote_count.desc", "vote_average.gte": "6.8", "vote_count.gte": "150" }],
  new: [{ sort_by: "popularity.desc" }],
};

const GENRE_NAMES = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  37: "Western",
  53: "Thriller",
  878: "Science Fiction",
  10402: "Musical",
  10749: "Romance",
  10751: "Family",
};

const EXCLUDED_TITLE_PATTERNS = [
  /\bsex\b/i,
  /\berotic\b/i,
  /\bnaked\b/i,
  /\bporn\b/i,
  /\bplayboy\b/i,
  /\bemmanuelle\b/i,
];

const MAINSTREAM_LOOKBACK = {
  action: 10,
  adventure: 10,
  thriller: 10,
  comedy: 10,
  romance: 10,
  horror: 10,
  drama: 10,
  scifi: 12,
  fantasy: 12,
  family: 12,
  kids: 12,
  musical: 15,
  western: 18,
};

const MAINSTREAM_VOTE_FLOOR = {
  action: 700,
  adventure: 600,
  thriller: 600,
  comedy: 700,
  romance: 600,
  horror: 500,
  drama: 800,
  scifi: 600,
  fantasy: 450,
  family: 350,
  kids: 250,
  musical: 250,
  western: 200,
  classics: 800,
  new: 250,
};

function toTitleCase(title) {
  return title.replace(/\s+/g, " ").trim();
}

async function loadApiKey() {
  if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY;
  const envText = await readFile(envPath, "utf8");
  const match = envText.match(/^TMDB_API_KEY=(.+)$/m);
  if (!match) throw new Error("TMDB_API_KEY not found in .env.local");
  return match[1].trim();
}

async function tmdbFetch(apiKey, endpoint, params) {
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB ${endpoint} failed: ${res.status}`);
  }
  return res.json();
}

function buildMovie(result, shelfGenre) {
  const year = Number(String(result.release_date || "").slice(0, 4));
  if (!year) return null;
  const title = toTitleCase(String(result.title || ""));
  if (!title) return null;
  if (EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return null;

  return {
    id: Number(result.id),
    title,
    year,
    overview: String(result.overview || ""),
    genres: Array.isArray(result.genre_ids)
      ? result.genre_ids.map((id) => GENRE_NAMES[id]).filter(Boolean)
      : [],
    shelfGenres: [shelfGenre],
    posterUrl: result.poster_path
      ? `https://image.tmdb.org/t/p/w342${result.poster_path}`
      : null,
  };
}

async function fetchShelfPool(apiKey, shelfGenre, eraId, assignedIds) {
  const target = SHELF_TARGETS[shelfGenre];
  const era = ERAS[eraId];
  const queries = GENRE_QUERIES[shelfGenre];
  const collected = [];
  const seenIds = new Set();
  const baseVoteFloor = MAINSTREAM_VOTE_FLOOR[shelfGenre] ?? 150;
  const baseLookback = MAINSTREAM_LOOKBACK[shelfGenre];
  const passes = [
    { voteFloor: baseVoteFloor, lookback: baseLookback, originalLanguage: "en" },
    { voteFloor: Math.max(150, Math.floor(baseVoteFloor * 0.65)), lookback: baseLookback ? baseLookback + 6 : undefined, originalLanguage: "en" },
    { voteFloor: Math.max(75, Math.floor(baseVoteFloor * 0.4)), lookback: baseLookback ? baseLookback + 12 : undefined, originalLanguage: undefined },
  ];

  for (const pass of passes) {
    for (const queryBase of queries) {
      for (let page = 1; page <= 12 && collected.length < target; page++) {
        const params = {
          page,
          sort_by: shelfGenre === "new" ? "popularity.desc" : "vote_count.desc",
          "vote_count.gte": String(pass.voteFloor),
          ...queryBase,
        };

        if (pass.originalLanguage) {
          params.with_original_language = pass.originalLanguage;
        }

        if (shelfGenre === "new") {
          params["primary_release_date.gte"] = `${era.start}-01-01`;
          params["primary_release_date.lte"] = `${era.end}-12-31`;
        } else if (shelfGenre === "classics") {
          params["primary_release_date.lte"] = `${Math.min(1985, era.end)}-12-31`;
        } else {
          if (pass.lookback) {
            params["primary_release_date.gte"] = `${Math.max(1950, era.end - pass.lookback)}-01-01`;
          }
          params["primary_release_date.lte"] = `${era.end}-12-31`;
        }

        const data = await tmdbFetch(apiKey, "/discover/movie", params);
        const results = Array.isArray(data.results) ? data.results : [];
        if (results.length === 0) break;

        for (const result of results) {
          const movie = buildMovie(result, shelfGenre);
          if (!movie) continue;
          if (assignedIds.has(movie.id) || seenIds.has(movie.id)) continue;
          seenIds.add(movie.id);
          collected.push(movie);
          if (collected.length >= target) break;
        }
      }
    }
  }

  for (const movie of collected) {
    assignedIds.add(movie.id);
  }

  return collected;
}

function renderTs(snapshot) {
  return `export type GeneratedEraId = "late80s" | "early90s" | "mid90s" | "late90s";

export type GeneratedShelfGenre =
  | "action"
  | "adventure"
  | "thriller"
  | "comedy"
  | "romance"
  | "horror"
  | "western"
  | "musical"
  | "drama"
  | "classics"
  | "scifi"
  | "fantasy"
  | "kids"
  | "family"
  | "new";

export interface GeneratedCatalogMovie {
  id: number;
  title: string;
  year: number;
  overview: string;
  genres: string[];
  shelfGenres: GeneratedShelfGenre[];
  posterUrl?: string | null;
}

export const GENERATED_ERA_CATALOG: Record<
  GeneratedEraId,
  Record<GeneratedShelfGenre, GeneratedCatalogMovie[]>
> = ${JSON.stringify(snapshot, null, 2)} as const;
`;
}

const apiKey = await loadApiKey();
const generationOrder = [
  "western",
  "musical",
  "kids",
  "family",
  "fantasy",
  "romance",
  "horror",
  "scifi",
  "thriller",
  "classics",
  "comedy",
  "adventure",
  "action",
  "drama",
  "new",
];

const snapshot = {};

for (const eraId of Object.keys(ERAS)) {
  const assignedIds = new Set();
  snapshot[eraId] = {};
  console.log(`\nGenerating ${eraId}...`);
  for (const shelfGenre of generationOrder) {
    const movies = await fetchShelfPool(apiKey, shelfGenre, eraId, assignedIds);
    snapshot[eraId][shelfGenre] = movies;
    console.log(`  ${shelfGenre.padEnd(10)} ${movies.length}`);
  }
}

await writeFile(outputPath, renderTs(snapshot), "utf8");
console.log(`\nWrote ${outputPath}`);
