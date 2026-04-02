import type {
  FilmDetail,
  MovieInfo,
  SearchResponse,
  SearchResult,
  StreamingProviders,
  TrendingMovie,
} from "./types";
import { GENERATED_ERA_CATALOG, type GeneratedCatalogMovie } from "./generated-era-catalog";
import { STORE_LAYOUT } from "./store-layout";

export type EraId = "late80s" | "early90s" | "mid90s" | "late90s" | "present";

export type ShelfGenre =
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

export interface CatalogMovie {
  id: number;
  title: string;
  year: number;
  overview: string;
  genres: string[];
  shelfGenres: ShelfGenre[];
  posterUrl?: string | null;
  runtime?: number | null;
  director?: string | null;
}

export const ERA_RANGES: Record<EraId, { start: number; end: number }> = {
  late80s: { start: 1987, end: 1989 },
  early90s: { start: 1990, end: 1993 },
  mid90s: { start: 1994, end: 1996 },
  late90s: { start: 1997, end: 1999 },
  present: { start: 2024, end: 2026 },
};

const EMPTY_PROVIDERS: StreamingProviders = {
  flatrate: [],
  rent: [],
  buy: [],
  link: null,
};

const CATALOG_POSTER_REV = "2026-04-02c";

const KNOWN_POSTERS: Record<string, string> = {
  "Jaws": "https://image.tmdb.org/t/p/w342/lxM6kqilAdpdhqUl2biYp5frUxE.jpg",
  "Alien": "https://image.tmdb.org/t/p/w342/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
  "Blade Runner": "https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
  "Raiders of the Lost Ark": "https://image.tmdb.org/t/p/w342/ceG9VzoRAVGwivFU403Wc3AHRys.jpg",
  "The Shining": "https://image.tmdb.org/t/p/w342/nRj5511mZdTl4saWEPoj9QroTIu.jpg",
  "Star Wars": "https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  "Back to the Future": "https://image.tmdb.org/t/p/w342/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg",
  "E.T. the Extra-Terrestrial": "https://image.tmdb.org/t/p/w342/an0nD6uq6byfxXCfk6lQBzdL2J1.jpg",
  "Pulp Fiction": "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  "The Godfather": "https://image.tmdb.org/t/p/w342/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg",
  "The Princess Bride": "https://image.tmdb.org/t/p/w342/gpMR1hnEo0JLEW0oGOAkxRYrf7R.jpg",
  "Ghostbusters": "https://image.tmdb.org/t/p/w342/3E52VpEVKhklKLLjqOGKpjEJBnM.jpg",
};

const MOVIES: CatalogMovie[] = [
  { id: 900001, title: "Casablanca", year: 1942, overview: "A wartime romance and one of the all-time great studio classics.", genres: ["Drama", "Romance"], shelfGenres: ["classics", "drama", "romance"] },
  { id: 900002, title: "The Wizard of Oz", year: 1939, overview: "Technicolor wonder, songs, and pure family-movie magic.", genres: ["Family", "Fantasy", "Musical"], shelfGenres: ["classics", "family", "fantasy", "musical", "kids"] },
  { id: 900003, title: "Singin' in the Rain", year: 1952, overview: "Hollywood musical perfection with bright, playful energy.", genres: ["Musical", "Comedy"], shelfGenres: ["classics", "musical", "comedy"] },
  { id: 900004, title: "Rear Window", year: 1954, overview: "A suspense masterclass built around curiosity, tension, and one apartment block.", genres: ["Mystery", "Thriller"], shelfGenres: ["classics", "thriller"] },
  { id: 900005, title: "Some Like It Hot", year: 1959, overview: "Fast, charming, and effortlessly funny from start to finish.", genres: ["Comedy", "Romance"], shelfGenres: ["classics", "comedy", "romance"] },
  { id: 900006, title: "12 Angry Men", year: 1957, overview: "A courtroom classic driven by character, pressure, and moral conviction.", genres: ["Drama"], shelfGenres: ["classics", "drama"] },
  { id: 900007, title: "North by Northwest", year: 1959, overview: "Elegant Hitchcock adventure with cross-country momentum and movie-star style.", genres: ["Adventure", "Thriller"], shelfGenres: ["classics", "adventure", "thriller"] },
  { id: 900008, title: "The Magnificent Seven", year: 1960, overview: "A heroic, crowd-pleasing western with swagger and scale.", genres: ["Western", "Adventure"], shelfGenres: ["classics", "western", "adventure"] },
  { id: 900009, title: "The Good, the Bad and the Ugly", year: 1966, overview: "Operatic western iconography and one of the great cinematic showdowns.", genres: ["Western"], shelfGenres: ["classics", "western"] },
  { id: 900010, title: "Roman Holiday", year: 1953, overview: "A sweet, polished romance with old-school movie-star sparkle.", genres: ["Romance", "Comedy"], shelfGenres: ["classics", "romance", "comedy"] },
  { id: 900011, title: "The Godfather", year: 1972, overview: "Epic crime drama with towering performances and total command of tone.", genres: ["Drama", "Crime"], shelfGenres: ["classics", "drama"] , posterUrl: KNOWN_POSTERS["The Godfather"]},
  { id: 900012, title: "Jaws", year: 1975, overview: "Summer-movie suspense that still feels sharp, scary, and irresistibly watchable.", genres: ["Thriller", "Adventure"], shelfGenres: ["classics", "thriller", "adventure"], posterUrl: KNOWN_POSTERS["Jaws"] },
  { id: 900013, title: "Rocky", year: 1976, overview: "A scrappy underdog drama with huge heart and a legendary finish.", genres: ["Drama"], shelfGenres: ["classics", "drama"] },
  { id: 900014, title: "Star Wars", year: 1977, overview: "The space opera that became a modern myth and a rental-store staple.", genres: ["Science Fiction", "Adventure"], shelfGenres: ["classics", "scifi", "adventure"], posterUrl: KNOWN_POSTERS["Star Wars"] },
  { id: 900015, title: "Grease", year: 1978, overview: "Bright pop musical energy, huge songs, and full-on jukebox fun.", genres: ["Musical", "Romance"], shelfGenres: ["musical", "romance"] },
  { id: 900016, title: "Alien", year: 1979, overview: "A clean, iconic blend of sci-fi worldbuilding and pure dread.", genres: ["Horror", "Science Fiction"], shelfGenres: ["horror", "scifi", "classics"], posterUrl: KNOWN_POSTERS["Alien"] },
  { id: 900017, title: "The Shining", year: 1980, overview: "Elegant, unnerving horror with unforgettable imagery and atmosphere.", genres: ["Horror"], shelfGenres: ["horror", "classics"], posterUrl: KNOWN_POSTERS["The Shining"] },
  { id: 900018, title: "Raiders of the Lost Ark", year: 1981, overview: "The gold standard for adventure movies: fast, funny, and endlessly rewatchable.", genres: ["Adventure", "Action"], shelfGenres: ["adventure", "action", "classics"], posterUrl: KNOWN_POSTERS["Raiders of the Lost Ark"] },
  { id: 900019, title: "E.T. the Extra-Terrestrial", year: 1982, overview: "Warm, emotional family sci-fi with pure wonder all the way through.", genres: ["Family", "Science Fiction"], shelfGenres: ["family", "kids", "scifi"], posterUrl: KNOWN_POSTERS["E.T. the Extra-Terrestrial"] },
  { id: 900020, title: "Blade Runner", year: 1982, overview: "Moody future-noir that gives the sci-fi shelf real texture and mystery.", genres: ["Science Fiction", "Thriller"], shelfGenres: ["scifi", "thriller"], posterUrl: KNOWN_POSTERS["Blade Runner"] },
  { id: 900021, title: "Poltergeist", year: 1982, overview: "Big, accessible supernatural horror with a suburban-blockbuster feel.", genres: ["Horror"], shelfGenres: ["horror"] },
  { id: 900022, title: "The Thing", year: 1982, overview: "Paranoia, snow, and creature horror done with maximum practical-effects punch.", genres: ["Horror", "Science Fiction"], shelfGenres: ["horror", "scifi"] },
  { id: 900023, title: "The Terminator", year: 1984, overview: "Lean sci-fi action built like a machine and still incredibly cool.", genres: ["Action", "Science Fiction"], shelfGenres: ["action", "scifi", "thriller"] },
  { id: 900024, title: "Ghostbusters", year: 1984, overview: "A perfect rental-era crowd-pleaser with comedy, effects, and charm.", genres: ["Comedy", "Fantasy"], shelfGenres: ["comedy", "family", "fantasy"], posterUrl: KNOWN_POSTERS["Ghostbusters"] },
  { id: 900025, title: "Beverly Hills Cop", year: 1984, overview: "Fast, funny action-comedy with star power and pure video-store energy.", genres: ["Action", "Comedy"], shelfGenres: ["action", "comedy"] },
  { id: 900026, title: "A Nightmare on Elm Street", year: 1984, overview: "Dream-logic horror and one of the great sleepover-rental picks.", genres: ["Horror"], shelfGenres: ["horror"] },
  { id: 900027, title: "The NeverEnding Story", year: 1984, overview: "Big-hearted fantasy adventure for kids who wanted a whole other world.", genres: ["Fantasy", "Family"], shelfGenres: ["fantasy", "kids", "family"] },
  { id: 900028, title: "Back to the Future", year: 1985, overview: "As close to a perfect blockbuster as the family section can get.", genres: ["Science Fiction", "Adventure", "Comedy"], shelfGenres: ["family", "scifi", "adventure", "comedy"], posterUrl: KNOWN_POSTERS["Back to the Future"] },
  { id: 900029, title: "The Goonies", year: 1985, overview: "A pure adventure shelf essential with kids, booby traps, and treasure maps.", genres: ["Adventure", "Family"], shelfGenres: ["adventure", "family", "kids"] },
  { id: 900030, title: "Ferris Bueller's Day Off", year: 1986, overview: "Smart, breezy teen comedy with endless rewatch value.", genres: ["Comedy"], shelfGenres: ["comedy"] },
  { id: 900031, title: "Little Shop of Horrors", year: 1986, overview: "A funny, catchy musical with just enough monster-movie weirdness.", genres: ["Musical", "Comedy"], shelfGenres: ["musical", "comedy"] },
  { id: 900032, title: "Stand by Me", year: 1986, overview: "A coming-of-age drama that keeps the drama shelf warm and human.", genres: ["Drama"], shelfGenres: ["drama"] },
  { id: 900033, title: "Aliens", year: 1986, overview: "The all-timer sequel that lets sci-fi and action share a shelf with pride.", genres: ["Science Fiction", "Action"], shelfGenres: ["scifi", "action", "horror"] },
  { id: 900034, title: "The Princess Bride", year: 1987, overview: "Adventure, romance, comedy, and fantasy all in one charming box.", genres: ["Fantasy", "Adventure", "Romance"], shelfGenres: ["fantasy", "adventure", "romance", "family"], posterUrl: KNOWN_POSTERS["The Princess Bride"] },
  { id: 900035, title: "Predator", year: 1987, overview: "A muscular action-thriller with a monster-movie twist.", genres: ["Action", "Thriller"], shelfGenres: ["action", "thriller", "horror"] },
  { id: 900036, title: "The Lost Boys", year: 1987, overview: "Cool, accessible horror with a strong rental-store vibe.", genres: ["Horror", "Comedy"], shelfGenres: ["horror", "comedy"] },
  { id: 900037, title: "Who Framed Roger Rabbit", year: 1988, overview: "Showstopper family entertainment with mystery, slapstick, and craft.", genres: ["Family", "Comedy", "Fantasy"], shelfGenres: ["family", "kids", "comedy", "fantasy"] },
  { id: 900038, title: "Die Hard", year: 1988, overview: "The action shelf anchor: sharp, propulsive, and instantly familiar.", genres: ["Action", "Thriller"], shelfGenres: ["action", "thriller"] },
  { id: 900039, title: "Beetlejuice", year: 1988, overview: "Cartoon-ghoul mischief that belongs equally in horror and comedy.", genres: ["Comedy", "Fantasy"], shelfGenres: ["comedy", "horror", "fantasy"] },
  { id: 900040, title: "Big", year: 1988, overview: "A sweet, major-studio comedy with lots of VHS-era comfort.", genres: ["Comedy", "Family"], shelfGenres: ["comedy", "family"] },
  { id: 900041, title: "The Land Before Time", year: 1988, overview: "An emotional animated family staple for the kids shelf.", genres: ["Family", "Animation"], shelfGenres: ["kids", "family"] },
  { id: 900042, title: "Willow", year: 1988, overview: "Sword-and-sorcery fantasy that feels right at home in the era's aisles.", genres: ["Fantasy", "Adventure"], shelfGenres: ["fantasy", "adventure"] },
  { id: 900043, title: "Rain Man", year: 1988, overview: "A mainstream prestige drama that absolutely would have moved tapes.", genres: ["Drama"], shelfGenres: ["drama"] },
  { id: 900044, title: "When Harry Met Sally...", year: 1989, overview: "One of the smartest, most beloved romantic comedies in the store.", genres: ["Romance", "Comedy"], shelfGenres: ["romance", "comedy"] },
  { id: 900045, title: "Batman", year: 1989, overview: "Dark enough to feel cool, broad enough to be a giant rental hit.", genres: ["Action", "Fantasy"], shelfGenres: ["action", "fantasy"] },
  { id: 900046, title: "Indiana Jones and the Last Crusade", year: 1989, overview: "A premium adventure shelf pick with effortless old-school fun.", genres: ["Adventure", "Action"], shelfGenres: ["adventure", "action"] },
  { id: 900047, title: "Field of Dreams", year: 1989, overview: "A warm, quotable drama that feels exactly right for nostalgic browsing.", genres: ["Drama", "Fantasy"], shelfGenres: ["drama", "fantasy"] },
  { id: 900048, title: "The Little Mermaid", year: 1989, overview: "The Disney renaissance starts here and absolutely belongs on family shelves.", genres: ["Family", "Musical", "Fantasy"], shelfGenres: ["family", "kids", "musical", "fantasy"] },
  { id: 900049, title: "Home Alone", year: 1990, overview: "Peak family-rental chaos and one of the biggest tape movers of the decade.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900050, title: "Ghost", year: 1990, overview: "Big-hearted romance with a supernatural hook and a huge mainstream footprint.", genres: ["Romance", "Drama"], shelfGenres: ["romance", "drama", "fantasy"] },
  { id: 900051, title: "The Hunt for Red October", year: 1990, overview: "A clean, satisfying thriller for the grown-up aisle crowd.", genres: ["Thriller", "Action"], shelfGenres: ["thriller", "action"] },
  { id: 900052, title: "Dances with Wolves", year: 1990, overview: "Prestige western scale with wide-appeal rental heft.", genres: ["Western", "Drama"], shelfGenres: ["western", "drama"] },
  { id: 900053, title: "Beauty and the Beast", year: 1991, overview: "Animated musical classic and an easy family-shelf cornerstone.", genres: ["Family", "Musical", "Fantasy"], shelfGenres: ["family", "kids", "musical", "fantasy"] },
  { id: 900054, title: "Terminator 2: Judgment Day", year: 1991, overview: "Big-screen sequel spectacle that dominates action and sci-fi alike.", genres: ["Action", "Science Fiction"], shelfGenres: ["action", "scifi"] },
  { id: 900055, title: "The Addams Family", year: 1991, overview: "Goth-comedy comfort food that fits horror, fantasy, and family overflow.", genres: ["Comedy", "Fantasy"], shelfGenres: ["comedy", "fantasy", "family"] },
  { id: 900056, title: "Hook", year: 1991, overview: "Bright fantasy adventure that feels built for the VHS shelf.", genres: ["Fantasy", "Adventure", "Family"], shelfGenres: ["fantasy", "adventure", "family", "kids"] },
  { id: 900057, title: "Wayne's World", year: 1992, overview: "The comedy shelf should absolutely have something this quotable on it.", genres: ["Comedy"], shelfGenres: ["comedy"] },
  { id: 900058, title: "Aladdin", year: 1992, overview: "Fast, funny, musical, and endlessly replayable for kids and grown-ups.", genres: ["Family", "Fantasy", "Musical"], shelfGenres: ["family", "kids", "musical", "fantasy"] },
  { id: 900059, title: "A League of Their Own", year: 1992, overview: "A sunny, crowd-pleasing drama-comedy that keeps the shelves welcoming.", genres: ["Drama", "Comedy"], shelfGenres: ["drama", "comedy"] },
  { id: 900060, title: "Unforgiven", year: 1992, overview: "A heavyweight western for the serious-rental crowd.", genres: ["Western", "Drama"], shelfGenres: ["western", "drama"] },
  { id: 900061, title: "The Last of the Mohicans", year: 1992, overview: "Sweeping frontier adventure with romance and real shelf presence.", genres: ["Adventure", "Romance"], shelfGenres: ["adventure", "romance"] },
  { id: 900062, title: "Jurassic Park", year: 1993, overview: "Blockbuster wonder that belongs in new releases, sci-fi, adventure, and family conversation.", genres: ["Science Fiction", "Adventure"], shelfGenres: ["scifi", "adventure", "family", "new"] },
  { id: 900063, title: "The Fugitive", year: 1993, overview: "A first-rate thriller that gives the suspense aisle serious backbone.", genres: ["Thriller", "Action"], shelfGenres: ["thriller", "action"] },
  { id: 900064, title: "Groundhog Day", year: 1993, overview: "A smart, comforting comedy with enough fantasy to cross shelves gracefully.", genres: ["Comedy", "Fantasy"], shelfGenres: ["comedy", "fantasy"] },
  { id: 900065, title: "Sleepless in Seattle", year: 1993, overview: "A quintessential cozy romance pick for a Friday-night browse.", genres: ["Romance", "Comedy"], shelfGenres: ["romance", "comedy"] },
  { id: 900066, title: "Mrs. Doubtfire", year: 1993, overview: "A huge family-comedy rental with instant recognition.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900067, title: "The Lion King", year: 1994, overview: "One of the most obvious family-rental juggernauts of the decade.", genres: ["Family", "Musical"], shelfGenres: ["family", "kids", "musical"] },
  { id: 900068, title: "Pulp Fiction", year: 1994, overview: "A defining mid-90s tape that changes the temperature of any shelf it sits on.", genres: ["Drama", "Crime"], shelfGenres: ["drama", "thriller", "new"], posterUrl: KNOWN_POSTERS["Pulp Fiction"] },
  { id: 900069, title: "Forrest Gump", year: 1994, overview: "Prestige crowd-pleaser with a broad, mainstream rental audience.", genres: ["Drama", "Romance"], shelfGenres: ["drama", "romance"] },
  { id: 900070, title: "Clueless", year: 1995, overview: "Bright, endlessly quotable comedy with huge shelf charisma.", genres: ["Comedy", "Romance"], shelfGenres: ["comedy", "romance"] },
  { id: 900071, title: "Apollo 13", year: 1995, overview: "A dependable, uplifting drama-adventure that broad audiences loved.", genres: ["Drama", "Adventure"], shelfGenres: ["drama", "adventure"] },
  { id: 900072, title: "Toy Story", year: 1995, overview: "The computer-animation breakthrough and an instant family favorite.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900073, title: "Babe", year: 1995, overview: "A warm, funny family pick that makes the kids shelf feel fuller and gentler.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids"] },
  { id: 900074, title: "Braveheart", year: 1995, overview: "Big, emotional historical drama that feels like a premium rental.", genres: ["Drama", "Action"], shelfGenres: ["drama", "action"] },
  { id: 900075, title: "GoldenEye", year: 1995, overview: "Pure glossy action with unmistakable mid-90s rental energy.", genres: ["Action", "Adventure"], shelfGenres: ["action", "adventure"] },
  { id: 900076, title: "Twister", year: 1996, overview: "Weather-movie spectacle built for repeat blockbuster rentals.", genres: ["Action", "Adventure"], shelfGenres: ["action", "adventure", "new"] },
  { id: 900077, title: "Mission: Impossible", year: 1996, overview: "Slick, twisty, and right at home between action and thriller shelves.", genres: ["Action", "Thriller"], shelfGenres: ["action", "thriller", "new"] },
  { id: 900078, title: "The Rock", year: 1996, overview: "A very video-store action pick: loud, polished, and easy to recommend.", genres: ["Action", "Thriller"], shelfGenres: ["action", "thriller"] },
  { id: 900079, title: "Matilda", year: 1996, overview: "A vivid kids-and-family tape with enough fantasy to brighten the aisle.", genres: ["Family", "Fantasy"], shelfGenres: ["family", "kids", "fantasy"] },
  { id: 900080, title: "Space Jam", year: 1996, overview: "A pure 90s family-rental artifact and a great shelf flavor pick.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900081, title: "The Birdcage", year: 1996, overview: "A warm, fast, actor-driven comedy that broadens the shelf mix.", genres: ["Comedy"], shelfGenres: ["comedy"] },
  { id: 900082, title: "Men in Black", year: 1997, overview: "Cool, funny, and perfectly calibrated for late-90s sci-fi/action shelves.", genres: ["Science Fiction", "Comedy"], shelfGenres: ["scifi", "action", "comedy", "new"] },
  { id: 900083, title: "Titanic", year: 1997, overview: "A colossal rental hit that belongs anywhere romance or drama is stocked.", genres: ["Romance", "Drama"], shelfGenres: ["romance", "drama", "new"] },
  { id: 900084, title: "Good Will Hunting", year: 1997, overview: "A major drama shelf favorite with strong word-of-mouth energy.", genres: ["Drama"], shelfGenres: ["drama"] },
  { id: 900085, title: "Air Force One", year: 1997, overview: "A premium thriller-action tape with obvious Friday-night appeal.", genres: ["Action", "Thriller"], shelfGenres: ["action", "thriller"] },
  { id: 900086, title: "L.A. Confidential", year: 1997, overview: "Stylish, smart, and ideal for the older thriller crowd.", genres: ["Thriller", "Drama"], shelfGenres: ["thriller", "drama"] },
  { id: 900087, title: "Mulan", year: 1998, overview: "Heroic family animation with strong crossover into action and adventure.", genres: ["Family", "Adventure"], shelfGenres: ["family", "kids", "adventure"] },
  { id: 900088, title: "The Truman Show", year: 1998, overview: "A late-90s shelf essential with brains, warmth, and big recognition.", genres: ["Drama", "Comedy"], shelfGenres: ["drama", "comedy", "scifi"] },
  { id: 900089, title: "Rush Hour", year: 1998, overview: "Fast, funny action-comedy that the front shelves would have moved constantly.", genres: ["Action", "Comedy"], shelfGenres: ["action", "comedy"] },
  { id: 900090, title: "The Parent Trap", year: 1998, overview: "A sturdy family-rental favorite with sunny watch-again appeal.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900091, title: "You've Got Mail", year: 1998, overview: "Late-90s romance comfort food, exactly right for this store tone.", genres: ["Romance", "Comedy"], shelfGenres: ["romance", "comedy"] },
  { id: 900092, title: "The Prince of Egypt", year: 1998, overview: "Epic animated storytelling that gives the musical shelf real weight.", genres: ["Family", "Musical"], shelfGenres: ["family", "kids", "musical"] },
  { id: 900093, title: "A Bug's Life", year: 1998, overview: "Colorful, upbeat family animation with strong replay value.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900094, title: "The Mummy", year: 1999, overview: "Adventure-horror done as a bright, playful blockbuster rental.", genres: ["Adventure", "Fantasy"], shelfGenres: ["adventure", "fantasy", "horror", "new"] },
  { id: 900095, title: "The Matrix", year: 1999, overview: "A seismic late-90s action-sci-fi title and a no-brainer shelf centerpiece.", genres: ["Science Fiction", "Action"], shelfGenres: ["scifi", "action", "new"] },
  { id: 900096, title: "Toy Story 2", year: 1999, overview: "One of the rare sequels that made the family shelf even stronger.", genres: ["Family", "Comedy"], shelfGenres: ["family", "kids", "comedy"] },
  { id: 900097, title: "The Sixth Sense", year: 1999, overview: "A polished mainstream thriller with a perfect rental-hook premise.", genres: ["Thriller", "Horror"], shelfGenres: ["thriller", "horror", "new"] },
  { id: 900098, title: "Notting Hill", year: 1999, overview: "Charming late-90s romance that fits the store's cozy side.", genres: ["Romance", "Comedy"], shelfGenres: ["romance", "comedy"] },
  { id: 900099, title: "Galaxy Quest", year: 1999, overview: "A funny, loving sci-fi-adventure pick that broadens the shelf nicely.", genres: ["Science Fiction", "Comedy"], shelfGenres: ["scifi", "comedy", "adventure"] },
  { id: 900100, title: "10 Things I Hate About You", year: 1999, overview: "A high-school romance-comedy with undeniable late-90s shelf identity.", genres: ["Romance", "Comedy"], shelfGenres: ["romance", "comedy"] },
];

const GENRE_ID_TO_SHELF: Record<string, ShelfGenre> = {
  "28": "action",
  "12": "adventure",
  "35": "comedy",
  "18": "drama",
  "27": "horror",
  "37": "western",
  "53": "thriller",
  "10749": "romance",
  "10402": "musical",
  "878": "scifi",
  "14": "fantasy",
  "10751": "family",
  "16": "kids",
  "classics": "classics",
};

const GENRE_ALIASES: Record<string, ShelfGenre> = {
  action: "action",
  adventure: "adventure",
  thriller: "thriller",
  comedy: "comedy",
  romance: "romance",
  horror: "horror",
  western: "western",
  musical: "musical",
  musicals: "musical",
  drama: "drama",
  classics: "classics",
  scifi: "scifi",
  "sci-fi": "scifi",
  sci_fi: "scifi",
  fantasy: "fantasy",
  kids: "kids",
  family: "family",
  new: "new",
  newreleases: "new",
  new_releases: "new",
  staff_picks: "new",
};

function normalizeGenreKey(input: string): ShelfGenre {
  return GENRE_ALIASES[input.toLowerCase().replace(/[\s-]+/g, "")] || "drama";
}

function isHistoricalEra(eraId: EraId): boolean {
  return eraId !== "present";
}

function getDisplayPosterUrl(movie: CatalogMovie): string {
  return `/api/catalog-poster?id=${movie.id}&rev=${CATALOG_POSTER_REV}`;
}

function compareForShelf(a: CatalogMovie, b: CatalogMovie): number {
  return b.year - a.year;
}

function dedupeById(movies: CatalogMovie[]): CatalogMovie[] {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

function dedupeByTitleYear(movies: CatalogMovie[]): CatalogMovie[] {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    const key = `${movie.title.trim().toLowerCase()}::${movie.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const MANUAL_TITLE_YEAR_KEYS = new Set(
  MOVIES.map((movie) => `${movie.title.trim().toLowerCase()}::${movie.year}`)
);

const GENERATED_MOVIES: CatalogMovie[] = dedupeByTitleYear(
  dedupeById(
    Object.values(GENERATED_ERA_CATALOG)
      .flatMap((eraCatalog) => Object.values(eraCatalog))
      .flat()
      .map((movie: GeneratedCatalogMovie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        overview: movie.overview,
        genres: movie.genres,
        shelfGenres: movie.shelfGenres as ShelfGenre[],
        posterUrl: movie.posterUrl ?? null,
      }))
      .filter((movie) => !MANUAL_TITLE_YEAR_KEYS.has(`${movie.title.trim().toLowerCase()}::${movie.year}`))
  )
);

const ALL_MOVIES: CatalogMovie[] = dedupeByTitleYear(dedupeById([...MOVIES, ...GENERATED_MOVIES]));

const MOVIE_BY_ID = new Map<number, CatalogMovie>();
const MOVIE_BY_TITLE = new Map<string, CatalogMovie>();

for (const movie of ALL_MOVIES) {
  MOVIE_BY_ID.set(movie.id, movie);
  MOVIE_BY_TITLE.set(movie.title.toLowerCase(), movie);
}

function getEraVisibleMovies(eraId: EraId): CatalogMovie[] {
  if (eraId === "present") return ALL_MOVIES;
  const { end } = ERA_RANGES[eraId];
  return ALL_MOVIES.filter((movie) => movie.year <= end);
}

function getPrimaryShelfGenre(movie: CatalogMovie): ShelfGenre {
  return movie.shelfGenres.find((genre) => genre !== "new") || movie.shelfGenres[0] || "drama";
}

export function getPlacementKeysForGenre(genre: ShelfGenre): string[] {
  const keys: string[] = [];

  for (const obj of STORE_LAYOUT.objects) {
    if (obj.prefab === "shelf/gondola") {
      const front = typeof obj.meta?.genre === "string" ? normalizeGenreKey(obj.meta.genre) : null;
      const back = typeof obj.meta?.backGenre === "string" ? normalizeGenreKey(obj.meta.backGenre) : null;
      if (front === genre) keys.push(`${obj.id}:front`);
      if (back === genre) keys.push(`${obj.id}:back`);
    }

    if (obj.prefab === "shelf/wall-run" && typeof obj.meta?.genre === "string") {
      const wallGenre = normalizeGenreKey(obj.meta.genre);
      if (wallGenre === genre) keys.push(obj.id);
    }

    if (obj.prefab === "shelf/new-releases-wall" && genre === "new") {
      keys.push(obj.id);
    }
  }

  return keys.sort();
}

export function getEraIdFromYears(years: string): EraId {
  switch (years) {
    case "1987-1989":
      return "late80s";
    case "1990-1993":
      return "early90s";
    case "1994-1996":
      return "mid90s";
    case "1997-1999":
      return "late90s";
    default:
      return "present";
  }
}

export function getCuratedShelfPosterData(
  genreInput: string,
  eraId: EraId,
  placementKey?: string,
  count?: number,
): Array<{ id: number; title: string; url: string }> {
  const genre = normalizeGenreKey(genreInput);
  const generatedShelfMovies =
    eraId !== "present"
      ? GENERATED_ERA_CATALOG[eraId]?.[genre as keyof typeof GENERATED_ERA_CATALOG.late80s] ?? []
      : [];
  const generatedResults = generatedShelfMovies.map((movie) => {
    const canonical = findCatalogMovieByTitle(movie.title, movie.year);
    const resolved = canonical ?? movie;
    return {
      id: resolved.id,
      title: resolved.title,
      url: getDisplayPosterUrl(resolved),
    };
  });

  if (generatedResults.length > 0) {
    if (genre !== "new" && placementKey && count) {
      const placementKeys = getPlacementKeysForGenre(genre);
      const placementIndex = Math.max(placementKeys.indexOf(placementKey), 0);
      const placementCount = Math.max(placementKeys.length, 1);
      const start = Math.floor((placementIndex * generatedResults.length) / placementCount);
      const end = Math.floor(((placementIndex + 1) * generatedResults.length) / placementCount);
      return generatedResults.slice(start, Math.max(start + count, end));
    }

    return count ? generatedResults.slice(0, count) : generatedResults;
  }

  const eraMovies = getEraVisibleMovies(eraId);

  const results =
    genre === "new"
      ? eraMovies
          .filter((movie) => {
            const range = ERA_RANGES[eraId];
            return isHistoricalEra(eraId)
              ? movie.year >= range.start && movie.year <= range.end
              : movie.year >= 1994;
          })
          .sort(compareForShelf)
      : eraMovies
          .filter((movie) => getPrimaryShelfGenre(movie) === genre)
          .sort(compareForShelf);

  const unique = dedupeById(results);

  if (genre !== "new" && placementKey && count) {
    const placementKeys = getPlacementKeysForGenre(genre);
    const placementIndex = Math.max(placementKeys.indexOf(placementKey), 0);
    const placementCount = Math.max(placementKeys.length, 1);
    const start = Math.floor((placementIndex * unique.length) / placementCount);
    const end = Math.floor(((placementIndex + 1) * unique.length) / placementCount);
    const assigned = unique.slice(start, Math.max(start + 1, end));

    return assigned.map((movie) => ({
      id: movie.id,
      title: movie.title,
      url: getDisplayPosterUrl(movie),
    }));
  }

  return unique.map((movie) => ({
    id: movie.id,
    title: movie.title,
    url: getDisplayPosterUrl(movie),
  }));
}

export function getShelfBrowserMovies(
  genreInput: string,
  eraId: EraId,
  placementKey?: string,
  count?: number,
): Array<{ id: number; title: string; year: number; posterUrl: string }> {
  return getCuratedShelfPosterData(genreInput, eraId, placementKey, count).flatMap((movie) => {
    const full = MOVIE_BY_ID.get(movie.id);
    if (!full) return [];
    return {
      id: full.id,
      title: full.title,
      year: full.year,
      posterUrl: movie.url,
    };
  });
}

export function getCatalogMovieById(id: number): CatalogMovie | undefined {
  return MOVIE_BY_ID.get(id);
}

export function findCatalogMovieByTitle(title: string, year?: number | null): CatalogMovie | undefined {
  const normalized = title.trim().toLowerCase();
  const exact = MOVIE_BY_TITLE.get(normalized);
  if (exact && (year == null || exact.year === year)) return exact;
  return ALL_MOVIES.find((movie) =>
    movie.title.toLowerCase() === normalized && (year == null || movie.year === year)
  );
}

export function searchCatalogMovies(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_MOVIES
    .filter((movie) => movie.title.toLowerCase().includes(q))
    .slice(0, 20)
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterUrl: getDisplayPosterUrl(movie),
      overview: movie.overview,
      voteAverage: 8,
      genre: movie.genres.join(", "),
    }));
}

export function discoverCatalogMovies(filters: {
  decade?: string | null;
  genreId?: string | null;
  releaseDateGte?: string | null;
  releaseDateLte?: string | null;
  page?: number;
}): SearchResponse {
  let results = [...ALL_MOVIES];
  const page = filters.page || 1;

  if (filters.decade) {
    const start = Number(filters.decade);
    const end = start + 9;
    results = results.filter((movie) => movie.year >= start && movie.year <= end);
  }

  if (filters.releaseDateGte) {
    const start = Number(filters.releaseDateGte.slice(0, 4));
    results = results.filter((movie) => movie.year >= start);
  }

  if (filters.releaseDateLte) {
    const end = Number(filters.releaseDateLte.slice(0, 4));
    results = results.filter((movie) => movie.year <= end);
  }

  if (filters.genreId) {
    const shelf = GENRE_ID_TO_SHELF[filters.genreId];
    if (shelf) {
      results = results.filter((movie) => movie.shelfGenres.includes(shelf));
    }
  }

  const pageSize = 20;
  const sorted = results.sort(compareForShelf);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    results: paged.map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterUrl: getDisplayPosterUrl(movie),
      overview: movie.overview,
      voteAverage: 8,
      genre: movie.genres.join(", "),
    })),
    totalResults: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    page,
  };
}

export function getCatalogTrendingMovies(): TrendingMovie[] {
  return ALL_MOVIES
    .filter((movie) => movie.year >= 1997)
    .sort(compareForShelf)
    .slice(0, 20)
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterUrl: getDisplayPosterUrl(movie),
      overview: movie.overview,
      voteAverage: 8,
      genreIds: [],
    }));
}

export function getCatalogMovieInfo(title: string, year?: number | null): { movie: MovieInfo | null; providers: StreamingProviders | null } {
  const match = findCatalogMovieByTitle(title, year);
  if (!match) return { movie: null, providers: null };
  return {
    movie: {
      id: match.id,
      title: match.title,
      year: match.year,
      posterPath: null,
      posterUrl: getDisplayPosterUrl(match),
      overview: match.overview,
      voteAverage: 8,
    },
    providers: EMPTY_PROVIDERS,
  };
}

export function getCatalogFilmDetail(id: number): FilmDetail | null {
  const match = getCatalogMovieById(id);
  if (!match) return null;

  const similar: MovieInfo[] = ALL_MOVIES
    .filter((movie) => movie.id !== match.id && movie.shelfGenres.some((genre) => match.shelfGenres.includes(genre)))
    .slice(0, 8)
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterPath: null,
      posterUrl: getDisplayPosterUrl(movie),
      overview: movie.overview,
      voteAverage: 8,
    }));

  return {
    id: match.id,
    title: match.title,
    year: match.year,
    overview: match.overview,
    posterUrl: getDisplayPosterUrl(match),
    backdropUrl: null,
    voteAverage: 8,
    voteCount: 1,
    runtime: match.runtime ?? null,
    genres: match.genres,
    director: match.director ?? null,
    cast: [],
    crew: [],
    productionCompanies: [],
    language: "en",
    budget: null,
    revenue: null,
    tagline: null,
    similar,
    providers: EMPTY_PROVIDERS,
  };
}
