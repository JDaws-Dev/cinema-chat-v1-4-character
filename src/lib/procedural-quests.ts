import { getShelfMovies } from "@/components/game3d/Store";

export interface ProceduralRequest {
  id: string;
  template: string;
  customerLine: string;
  targetMovie: { title: string; genre: string; id: number };
  reward: number; // XP
}

const TEMPLATES = [
  { template: "find_for_me", line: "I'm looking for {MOVIE}. Can you find it for me?", reward: 50 },
  { template: "genre_rec", line: "What's the best {GENRE} movie you have? I heard {MOVIE} is good.", reward: 40 },
  { template: "something_like", line: "I loved {MOVIE}. Got anything else like it?", reward: 60 },
  { template: "kid_wants", line: "My kid keeps asking for {MOVIE}. Is it in stock?", reward: 45 },
  { template: "date_night", line: "I need something for date night. How about {MOVIE}?", reward: 55 },
];

let lastRequestTitle = "";

export function generateRequest(): ProceduralRequest | null {
  const movies = getShelfMovies();
  if (movies.length === 0) return null;

  // Pick a random movie that exists on the shelves, avoiding repeats
  let movie;
  let attempts = 0;
  do {
    movie = movies[Math.floor(Math.random() * movies.length)];
    attempts++;
  } while (movie.title === lastRequestTitle && attempts < 10);

  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const id = `proc_${Date.now()}`;
  lastRequestTitle = movie.title;

  return {
    id,
    template: template.template,
    customerLine: template.line
      .replace("{MOVIE}", movie.title)
      .replace("{GENRE}", movie.genre),
    targetMovie: movie,
    reward: template.reward + Math.floor(Math.random() * 20),
  };
}
