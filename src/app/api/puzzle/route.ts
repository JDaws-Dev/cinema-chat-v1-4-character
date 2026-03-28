import { tmdbFetch, posterUrl, backdropUrl } from "@/lib/tmdb";
import OpenAI from "openai";

// Curated pool of well-known films (TMDB IDs)
const FILM_POOL = [
  278, 238, 424, 680, 550, 13, 155, 122, 598, 857,    // Shawshank, Godfather, Schindler's, Pulp Fiction, Fight Club, Forrest Gump, Dark Knight, LOTR, City of God, Saving Private Ryan
  497, 389, 429, 769, 274, 240, 539, 346, 510, 637,    // Green Mile, 12 Angry Men, Good Will Hunting, Goodfellas, Silence of the Lambs, Godfather II, Psycho, Seven, Mononoke, Life is Beautiful
  120, 11, 1891, 1892, 1893, 128, 329, 194, 27205,     // LOTR trilogy, Star Wars OT, Princess Mononoke, Jurassic Park, Amélie, Inception
  311, 807, 1422, 207, 578, 77, 18, 22, 73, 105,       // Once Upon West, Seven Samurai, Departed, Dead Poets, Truman Show, Memento, Fifth Element, Pirates, Jaws, BTTF
  103, 78, 629, 489, 372058, 76341, 157336, 286217,    // Taxi Driver, Goodfellas, Departed, Django, Your Name, Fury Road, Interstellar, Martian
  475557, 299536, 284053, 374720, 550988, 569094,       // Joker, Infinity War, Thor Ragnarok, Dunkirk, Free Guy, Spider-Verse
  862, 954, 121, 8587, 694, 620, 1895, 567, 76600,     // Toy Story, Mission Impossible, LOTR2, Lion King, Shining, Ghostbusters, Empire Strikes Back, Rear Window, Avatar 2
  68718, 49026, 274870, 269149, 263115, 438631,         // Django, Dark Knight Rises, Conjuring, Zootopia, Logan, Dune
];

function getPoolIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % FILM_POOL.length;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "daily";

  const key = process.env.TMDB_API_KEY;
  if (!key) return Response.json({ error: "TMDB not configured" }, { status: 503 });

  try {
    let movieId: number;

    if (mode === "daily") {
      const today = new Date().toISOString().split("T")[0];
      const idx = getPoolIndex(today);
      movieId = FILM_POOL[idx];
    } else {
      movieId = FILM_POOL[Math.floor(Math.random() * FILM_POOL.length)];
    }

    // Fetch movie details from TMDB
    const res = await tmdbFetch(`/movie/${movieId}`, { append_to_response: "credits" });
    const data = await res.json();

    if (!data.id) return Response.json({ error: "Movie not found" }, { status: 404 });

    const year = data.release_date ? parseInt(data.release_date.split("-")[0]) : null;
    const genres = (data.genres || []).map((g: { name: string }) => g.name);
    const director = (data.credits?.crew || []).find((c: { job: string }) => c.job === "Director")?.name || null;
    const cast = (data.credits?.cast || []).slice(0, 5).map((c: { name: string }) => c.name);
    const tagline = data.tagline || null;

    // Clue 2: genre + decade
    const decade = year ? `${Math.floor(year / 10) * 10}s` : "unknown era";
    const genreStr = genres.slice(0, 2).join("/") || "Film";
    const clue2 = `${genreStr}. ${decade}.`;

    // Clue 3: cast member
    const clue3 = cast.length > 0 ? cast[0] : "Unknown lead";

    // Clue 4: tagline (fallback to director)
    const clue4 = tagline || (director ? `Directed by ${director}` : "A cinematic experience.");

    // Generate Vinny clue (clue 1) via OpenAI
    let clue1 = "";
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content: `You are Vinny, a legendary video store clerk. Give a one-sentence, vague, poetic hint about a movie. Do NOT mention the title, character names, actor names, or director. Be evocative and conversational. Examples: "This one changed how people thought about summer." "You ever wonder what happens when you mix a heist with your dreams?" Keep it under 25 words.`
          },
          {
            role: "user",
            content: `Movie: ${data.title} (${year}). Genre: ${genreStr}. Overview: ${data.overview?.slice(0, 200)}`
          }
        ],
      });
      clue1 = completion.choices[0]?.message?.content?.trim() || "";
    } catch {
      // Fallback if OpenAI fails
      clue1 = `This one's a ${genreStr.toLowerCase()} from the ${decade}. Trust me, you need to see it.`;
    }

    // Build puzzle response (DO NOT include the title — that's the answer!)
    return Response.json({
      puzzle: {
        movieId: data.id,
        backdrop: backdropUrl(data.backdrop_path),
        poster: posterUrl(data.poster_path),
        clues: [clue1, clue2, clue3, clue4],
        answer: {
          title: data.title,
          year,
          director,
          genres,
          overview: data.overview,
          voteAverage: data.vote_average,
        },
      },
      mode,
      date: mode === "daily" ? new Date().toISOString().split("T")[0] : null,
    });
  } catch (err) {
    console.error("Puzzle error:", err);
    return Response.json({ error: "Failed to generate puzzle" }, { status: 500 });
  }
}
