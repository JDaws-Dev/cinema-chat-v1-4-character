/**
 * Friday Night Video — Game Data
 * You're the customer. It's Friday night. Pick your movie.
 */

// ── Scenarios for "Friday Night Pick" ─────────────────────
export interface Scenario {
  id: string;
  setup: string;           // Vinny describes the vibe
  hint: string;            // Short label
  goodGenres: string[];    // Genres that score well
  greatGenres: string[];   // Genre that's perfect
  vinnyGreat: string;      // Vinny's reaction to a great pick
  vinnyGood: string;
  vinnyBad: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    setup: "It's your first date. You need something impressive but not pretentious. Nothing too heavy, nothing too dumb. What are you bringing home?",
    hint: "First date movie",
    goodGenres: ["drama", "comedy", "scifi"],
    greatGenres: ["comedy"],
    vinnyGreat: "Smart choice. Funny, charming, low-risk. She's gonna think you have taste AND a sense of humor. Go get 'em.",
    vinnyGood: "Could work. Little risky for a first date, but if she's into it, you'll look like a genius.",
    vinnyBad: "Bold move. Most people wouldn't lead with that on date one. I respect the confidence, but... maybe reconsider.",
  },
  {
    id: "s2",
    setup: "You're home sick. Fever, soup, the whole deal. You need something comforting — like a warm blanket for your brain. What's the pick?",
    hint: "Sick day comfort watch",
    goodGenres: ["family", "comedy", "classics"],
    greatGenres: ["family"],
    vinnyGreat: "Perfect sick day movie. Warm, easy, like chicken soup for your eyeballs. Feel better, kid.",
    vinnyGood: "Yeah, that'll do. Not the coziest pick, but it'll keep your mind off the NyQuil.",
    vinnyBad: "You wanna watch THAT while you're sick? You're either braver than I thought or the fever's talking.",
  },
  {
    id: "s3",
    setup: "Your buddy just got dumped. Hard. He's on your couch, third beer deep. What do you put on to remind him life doesn't suck?",
    hint: "Cheer up a heartbroken friend",
    goodGenres: ["action", "comedy", "scifi"],
    greatGenres: ["action"],
    vinnyGreat: "Explosions. Justice. Zero romance subplot. This is the correct prescription. You're a good friend.",
    vinnyGood: "Not bad. Might take his mind off it. Just hope there's no surprise love story in the third act.",
    vinnyBad: "There's a love story in this one, isn't there? Read the room, man. Read the room.",
  },
  {
    id: "s4",
    setup: "Family movie night. You got a 7-year-old, a 13-year-old, and your parents visiting. Everyone has to agree. Good luck.",
    hint: "Movie the whole family loves",
    goodGenres: ["family", "comedy", "classics"],
    greatGenres: ["family"],
    vinnyGreat: "That'll work for literally everyone. The 7-year-old laughs, the 13-year-old doesn't roll their eyes TOO hard, and grandma stays awake. Perfect.",
    vinnyGood: "Decent pick. Might lose the 7-year-old or bore grandma, but it's a solid attempt at the impossible.",
    vinnyBad: "I love your optimism, but the 7-year-old is gonna be asleep in 20 minutes and your mom's gonna give you a look.",
  },
  {
    id: "s5",
    setup: "You can't sleep. It's 2 AM. You want something that'll blow your mind — something that makes you stare at the ceiling after. Give me weird, smart, unforgettable.",
    hint: "2 AM mind-bender",
    goodGenres: ["scifi", "drama", "horror"],
    greatGenres: ["scifi"],
    vinnyGreat: "Oh, you're not sleeping tonight. This one's gonna rewire your brain. Perfect 2 AM choice — you asked for it.",
    vinnyGood: "Good pick. It'll give you something to think about. Maybe not full ceiling-staring territory, but close.",
    vinnyBad: "That's... fine? But you said you wanted your mind blown. This is more of a gentle breeze.",
  },
  {
    id: "s6",
    setup: "You're having people over for a dinner party. Background movie — something with style, great cinematography, maybe a good soundtrack. Not too distracting.",
    hint: "Dinner party background film",
    goodGenres: ["classics", "drama"],
    greatGenres: ["classics"],
    vinnyGreat: "Class act. Beautiful to look at, great music, and nobody has to follow the plot while they're eating bruschetta. You've done this before.",
    vinnyGood: "Could work as background. Might grab people's attention a little too much, but that's not the worst problem.",
    vinnyBad: "This is gonna stop the conversation dead. Everyone's either watching or asking to change it. Neither is great for a dinner party.",
  },
  {
    id: "s7",
    setup: "Halloween night. You want SCARED. Real scared. Not campy, not funny-scary — you want to check the locks on your doors after. What's the pick?",
    hint: "Genuinely terrifying",
    goodGenres: ["horror"],
    greatGenres: ["horror"],
    vinnyGreat: "Sleep with the lights on. This one stays with you. You asked for scared — you're getting scared.",
    vinnyGood: "It's got some good scares. Maybe not 'check the locks' level, but you'll jump a few times.",
    vinnyBad: "This is about as scary as a campfire story told by someone's dad. You wanted horror, not mild discomfort.",
  },
  {
    id: "s8",
    setup: "Rainy Sunday. Nowhere to go, nothing to do. You want something LONG — an epic. The kind of movie where you forget what day it is when it ends.",
    hint: "Rainy Sunday epic",
    goodGenres: ["drama", "classics", "action"],
    greatGenres: ["classics"],
    vinnyGreat: "Now THAT'S a rainy Sunday movie. Three hours, intermission optional, you come out the other side a different person. Perfect.",
    vinnyGood: "Good choice. It'll fill the afternoon. Might not quite be 'epic' territory, but it's solid.",
    vinnyBad: "That's like 90 minutes. You said epic! I want you parked on that couch until the sun goes down.",
  },
];

// ── Famous Quotes ─────────────────────────────────────────
export interface QuoteChallenge {
  id: string;
  quote: string;
  film: string;
  year: number;
  options: string[];       // 4 film titles
  correctIndex: number;
  vinnyRight: string;
  vinnyWrong: string;
}

export const QUOTES: QuoteChallenge[] = [
  {
    id: "q1", quote: "Here's looking at you, kid.", film: "Casablanca", year: 1942,
    options: ["The Maltese Falcon", "Casablanca", "Gone with the Wind", "Citizen Kane"],
    correctIndex: 1,
    vinnyRight: "Bogart. '42. If you haven't seen the whole thing, stop what you're doing and watch it. Tonight.",
    vinnyWrong: "Casablanca! Bogart to Bergman. One of the most quoted lines in cinema history.",
  },
  {
    id: "q2", quote: "I'm gonna make him an offer he can't refuse.", film: "The Godfather", year: 1972,
    options: ["Scarface", "Goodfellas", "The Godfather", "Casino"],
    correctIndex: 2,
    vinnyRight: "Brando. '72. Coppola put cotton in his cheeks. True story. Changed how everyone does mob movies.",
    vinnyWrong: "The Godfather! Brando. Come on, that one's day one.",
  },
  {
    id: "q3", quote: "You can't handle the truth!", film: "A Few Good Men", year: 1992,
    options: ["The Firm", "A Few Good Men", "JFK", "The Verdict"],
    correctIndex: 1,
    vinnyRight: "Jack Nicholson, '92. Fun fact — that scene was basically one take. Jack just went off.",
    vinnyWrong: "A Few Good Men! Nicholson vs. Cruise. One of the great courtroom scenes ever filmed.",
  },
  {
    id: "q4", quote: "Life is like a box of chocolates. You never know what you're gonna get.", film: "Forrest Gump", year: 1994,
    options: ["Rain Man", "Forrest Gump", "The Green Mile", "Big"],
    correctIndex: 1,
    vinnyRight: "Tom Hanks on that bench. '94. Beat Shawshank AND Pulp Fiction for Best Picture. Wild year.",
    vinnyWrong: "Forrest Gump! Hanks at his most lovable. Also, in the book he says 'WAS like a box of chocolates.' Past tense. Zemeckis changed it.",
  },
  {
    id: "q5", quote: "To infinity and beyond!", film: "Toy Story", year: 1995,
    options: ["Toy Story", "Buzz Lightyear of Star Command", "WALL-E", "Up"],
    correctIndex: 0,
    vinnyRight: "Buzz Lightyear. '95. First Pixar feature. Changed animation forever. I didn't cry. You can't prove anything.",
    vinnyWrong: "Toy Story! Tim Allen as Buzz. '95. The movie that proved computers could make you feel things.",
  },
  {
    id: "q6", quote: "Why so serious?", film: "The Dark Knight", year: 2008,
    options: ["Batman Begins", "Joker", "The Dark Knight", "Batman Returns"],
    correctIndex: 2,
    vinnyRight: "Heath Ledger. '08. That performance... man. Changed what a comic book movie could be.",
    vinnyWrong: "The Dark Knight! Ledger's Joker. Won the Oscar posthumously. One of those performances that rewrites the rules.",
  },
  {
    id: "q7", quote: "I see dead people.", film: "The Sixth Sense", year: 1999,
    options: ["The Others", "The Sixth Sense", "Stir of Echoes", "Ghost"],
    correctIndex: 1,
    vinnyRight: "Haley Joel Osment. '99. That twist ending... if someone spoiled it for you, I'm sorry. If it hasn't been spoiled, go watch it. NOW.",
    vinnyWrong: "The Sixth Sense! Shyamalan's masterpiece. '99. The twist that launched a thousand imitations.",
  },
  {
    id: "q8", quote: "May the Force be with you.", film: "Star Wars", year: 1977,
    options: ["Star Trek: The Motion Picture", "Star Wars", "Flash Gordon", "Dune"],
    correctIndex: 1,
    vinnyRight: "A New Hope. '77. George Lucas. Binary sunset. John Williams. If this doesn't move you, I can't help you.",
    vinnyWrong: "Star Wars! Come on. COME ON. That's like not knowing the alphabet.",
  },
  {
    id: "q9", quote: "You talking to me?", film: "Taxi Driver", year: 1976,
    options: ["Raging Bull", "Taxi Driver", "Mean Streets", "Goodfellas"],
    correctIndex: 1,
    vinnyRight: "De Niro. '76. Scorsese. He improvised that whole scene. The mirror, the gun — all De Niro.",
    vinnyWrong: "Taxi Driver! De Niro in front of the mirror. '76. Most of that monologue was improvised.",
  },
  {
    id: "q10", quote: "After all, tomorrow is another day.", film: "Gone with the Wind", year: 1939,
    options: ["Gone with the Wind", "Rebecca", "Wuthering Heights", "Casablanca"],
    correctIndex: 0,
    vinnyRight: "Scarlett O'Hara. '39. Adjusted for inflation, it's still the highest-grossing film ever made. Let that sink in.",
    vinnyWrong: "Gone with the Wind! '39. Vivien Leigh. Four hours long and people lined up around the block.",
  },
];

// ── Back of the Box (synopsis → guess the film) ──────────
export interface SynopsisChallenge {
  id: string;
  synopsis: string;       // TMDB-style overview, no title mentioned
  film: string;
  year: number;
  options: string[];
  correctIndex: number;
  vinnyRight: string;
  vinnyWrong: string;
}

export const SYNOPSES: SynopsisChallenge[] = [
  {
    id: "b1",
    synopsis: "A young man is accidentally sent thirty years into the past in a time-traveling automobile, where he must make sure his parents fall in love so he can return to his own time.",
    film: "Back to the Future", year: 1985,
    options: ["Bill & Ted's Excellent Adventure", "Back to the Future", "The Terminator", "Somewhere in Time"],
    correctIndex: 1,
    vinnyRight: "Marty McFly! '85. Spielberg producing, Zemeckis directing. The DeLorean is the coolest time machine ever built. Don't @ me.",
    vinnyWrong: "Back to the Future! '85. Come on, DeLorean, flux capacitor, 88 miles per hour. A perfect movie.",
  },
  {
    id: "b2",
    synopsis: "When a killer shark unleashes chaos on a beach community, a police chief, a marine scientist, and a fisherman set out to stop it.",
    film: "Jaws", year: 1975,
    options: ["The Deep", "Jaws", "Open Water", "The Shallows"],
    correctIndex: 1,
    vinnyRight: "Spielberg. '75. The shark barely worked, so he had to be creative with the camera. Best accident in film history.",
    vinnyWrong: "Jaws! The movie that made people afraid of the ocean. Spielberg was 27. Twenty-seven!",
  },
  {
    id: "b3",
    synopsis: "A computer hacker learns that reality as he knows it is a simulation created by machines, and joins a rebellion to free humanity.",
    film: "The Matrix", year: 1999,
    options: ["Tron", "The Matrix", "eXistenZ", "Dark City"],
    correctIndex: 1,
    vinnyRight: "Neo. '99. The Wachowskis. Bullet time changed EVERYTHING. Every action movie after this had to respond to it.",
    vinnyWrong: "The Matrix! Red pill, blue pill. '99. Changed the visual language of action cinema overnight.",
  },
  {
    id: "b4",
    synopsis: "An archaeologist races against Nazi agents to find the legendary Ark of the Covenant before they can use its power for world domination.",
    film: "Raiders of the Lost Ark", year: 1981,
    options: ["The Mummy", "Raiders of the Lost Ark", "National Treasure", "The Da Vinci Code"],
    correctIndex: 1,
    vinnyRight: "Indy! '81. Spielberg and Lucas together. Harrison Ford was a carpenter before this. A CARPENTER.",
    vinnyWrong: "Raiders of the Lost Ark! Ford, Spielberg, Lucas, John Williams. The greatest adventure film ever made.",
  },
  {
    id: "b5",
    synopsis: "A young lion prince flees his kingdom after the murder of his father, only to learn the true meaning of responsibility and bravery.",
    film: "The Lion King", year: 1994,
    options: ["Bambi", "The Lion King", "The Jungle Book", "Brother Bear"],
    correctIndex: 1,
    vinnyRight: "Simba! '94. It's basically Hamlet with lions. Hans Zimmer's score? Elton John? Circle of Life? Come on. Peak Disney.",
    vinnyWrong: "The Lion King! '94. Disney's masterpiece. Mufasa's death scene still hits. I'm not crying, you're crying.",
  },
];

// ── Taste Profile ─────────────────────────────────────────
const TASTE_KEY = "fnv_taste";
const SCORE_KEY = "fnv_score";
const SEEN_KEY = "fnv_seen";

export interface TasteProfile {
  genres: Record<string, number>;  // genre → affinity score
  picks: string[];                  // film titles picked
  totalRounds: number;
  correctAnswers: number;
}

export function getTaste(): TasteProfile {
  if (typeof window === "undefined") return { genres: {}, picks: [], totalRounds: 0, correctAnswers: 0 };
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    return raw ? JSON.parse(raw) : { genres: {}, picks: [], totalRounds: 0, correctAnswers: 0 };
  } catch { return { genres: {}, picks: [], totalRounds: 0, correctAnswers: 0 }; }
}

export function updateTaste(genre: string, filmTitle: string): void {
  const t = getTaste();
  t.genres[genre] = (t.genres[genre] || 0) + 1;
  if (!t.picks.includes(filmTitle)) t.picks.push(filmTitle);
  localStorage.setItem(TASTE_KEY, JSON.stringify(t));
}

export function addCorrectAnswer(): void {
  const t = getTaste();
  t.correctAnswers++;
  t.totalRounds++;
  localStorage.setItem(TASTE_KEY, JSON.stringify(t));
}

export function addWrongAnswer(): void {
  const t = getTaste();
  t.totalRounds++;
  localStorage.setItem(TASTE_KEY, JSON.stringify(t));
}

export function getScore(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(SCORE_KEY) || "0", 10);
}

export function addScore(n: number): number {
  const s = getScore() + n;
  localStorage.setItem(SCORE_KEY, String(s));
  return s;
}

export function getSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
}

export function markSeen(id: string): void {
  const s = getSeen();
  s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
}

// ── Titles ────────────────────────────────────────────────
export const FILM_BUFF_TITLES = [
  { min: 0, title: "Just Browsing", icon: "👀" },
  { min: 50, title: "Regular", icon: "🎬" },
  { min: 150, title: "Film Buff", icon: "🎥" },
  { min: 300, title: "Cinephile", icon: "🏆" },
  { min: 500, title: "Living Legend", icon: "⭐" },
];

export function getTitle(score: number): { title: string; icon: string } {
  for (let i = FILM_BUFF_TITLES.length - 1; i >= 0; i--) {
    if (score >= FILM_BUFF_TITLES[i].min) return FILM_BUFF_TITLES[i];
  }
  return FILM_BUFF_TITLES[0];
}
