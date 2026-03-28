// ── Customer Requests ─────────────────────────────────────
export interface CustomerRequest {
  id: string;
  dialogue: string;          // What the customer says
  hint: string;              // Shown in HUD as reminder
  correctGenres: string[];   // Which shelf sections count as "right"
  greatPicks: string[];      // Specific genres that get bonus points
  reactions: {
    great: string;
    ok: string;
    bad: string;
  };
}

export const CUSTOMER_REQUESTS: CustomerRequest[] = [
  {
    id: "r1",
    dialogue: "Hey, I need something scary for date night. Not too gory though — she hates that.",
    hint: "Scary but not gory",
    correctGenres: ["horror", "scifi"],
    greatPicks: ["horror"],
    reactions: {
      great: "Oh PERFECT. She's gonna love this. Thanks!",
      ok: "Hmm, could work. We'll see how it goes.",
      bad: "Dude... this isn't even close to scary. Come on.",
    },
  },
  {
    id: "r2",
    dialogue: "My kids loved Toy Story. Got anything else like that? Something the whole family can watch.",
    hint: "Family-friendly, like Toy Story",
    correctGenres: ["family", "comedy"],
    greatPicks: ["family"],
    reactions: {
      great: "Yes! The kids are gonna flip. You're good at this.",
      ok: "I guess that could work for family night...",
      bad: "Uh, I said FAMILY movie. My kids are 6.",
    },
  },
  {
    id: "r3",
    dialogue: "I just got dumped. Give me something where the guy wins in the end. Big explosions preferred.",
    hint: "Action, feel-good victory",
    correctGenres: ["action", "scifi"],
    greatPicks: ["action"],
    reactions: {
      great: "Hell yeah. This is exactly what I need tonight. Explosions and justice.",
      ok: "Alright, I'll take it. Better than sitting alone.",
      bad: "I said explosions, not... whatever this is.",
    },
  },
  {
    id: "r4",
    dialogue: "I'm writing a paper on Cold War cinema. Got any classic political thrillers?",
    hint: "Classic political thriller",
    correctGenres: ["classics", "drama"],
    greatPicks: ["classics"],
    reactions: {
      great: "This is going straight into my bibliography. Excellent taste.",
      ok: "Not exactly what I had in mind, but there's material here.",
      bad: "This has nothing to do with the Cold War...",
    },
  },
  {
    id: "r5",
    dialogue: "I need something that'll make me ugly cry. Like, full-on tears. Hit me.",
    hint: "Emotional tearjerker",
    correctGenres: ["drama", "family"],
    greatPicks: ["drama"],
    reactions: {
      great: "Oh no. I'm already tearing up just reading the back. Perfect.",
      ok: "This might get a few tears... maybe.",
      bad: "I said CRY, not CRINGE.",
    },
  },
  {
    id: "r6",
    dialogue: "Something weird. Like, really weird. I want my brain to hurt after.",
    hint: "Mind-bending and weird",
    correctGenres: ["scifi", "drama"],
    greatPicks: ["scifi"],
    reactions: {
      great: "Okay wow. I've heard of this. My brain is already pre-hurting. Perfect.",
      ok: "It's a little weird I guess? I wanted WEIRDER.",
      bad: "This is just a normal movie. I said WEIRD.",
    },
  },
  {
    id: "r7",
    dialogue: "Date night but we already saw all the rom-coms. Something fun, light, maybe funny?",
    hint: "Fun date night, comedy",
    correctGenres: ["comedy", "family"],
    greatPicks: ["comedy"],
    reactions: {
      great: "Oh she's gonna love this one. Great call!",
      ok: "Yeah, this could work. Not exactly light though.",
      bad: "This is way too heavy for date night, dude.",
    },
  },
  {
    id: "r8",
    dialogue: "What's new? Just show me whatever came out recently. I'll trust your judgment.",
    hint: "Recent release",
    correctGenres: ["new_releases", "staff_picks"],
    greatPicks: ["new_releases"],
    reactions: {
      great: "Oh nice, I've been hearing about this one. Sold!",
      ok: "Alright, I'll give it a shot.",
      bad: "This came out like 30 years ago, man.",
    },
  },
];

// ── Trivia Questions ──────────────────────────────────────
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  vinnyReactCorrect: string;
  vinnyReactWrong: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: "t1",
    question: "What year did Jaws come out?",
    options: ["1973", "1975", "1977", "1979"],
    correctIndex: 1,
    vinnyReactCorrect: "Bingo. Summer of '75. Changed the whole game — invented the summer blockbuster.",
    vinnyReactWrong: "Nah, '75. Spielberg was like 27. Twenty-seven! Kid practically invented summer movies.",
  },
  {
    id: "t2",
    question: "Who directed Blade Runner?",
    options: ["James Cameron", "Ridley Scott", "David Lynch", "Stanley Kubrick"],
    correctIndex: 1,
    vinnyReactCorrect: "Ridley Scott, yeah. Guy was on a tear — did Alien right before that.",
    vinnyReactWrong: "It's Ridley Scott! Come on, that's like day one stuff. Alien, Blade Runner, back to back.",
  },
  {
    id: "t3",
    question: "Which film has the quote: 'Here's looking at you, kid'?",
    options: ["The Maltese Falcon", "Casablanca", "Gone with the Wind", "Citizen Kane"],
    correctIndex: 1,
    vinnyReactCorrect: "Casablanca. Bogart at his finest. If you haven't seen it, we need to talk.",
    vinnyReactWrong: "Casablanca! Humphrey Bogart. That's a classic you gotta know.",
  },
  {
    id: "t4",
    question: "What was the first Pixar feature film?",
    options: ["A Bug's Life", "Monsters, Inc.", "Toy Story", "Finding Nemo"],
    correctIndex: 2,
    vinnyReactCorrect: "Toy Story, 1995. Changed animation forever. I cried. Don't tell anyone.",
    vinnyReactWrong: "Toy Story! '95. Before that, nobody thought computers could make you cry.",
  },
  {
    id: "t5",
    question: "In The Shining, what's the room number Jack is told to stay away from?",
    options: ["217", "237", "213", "247"],
    correctIndex: 1,
    vinnyReactCorrect: "237. Good, you know your Kubrick. That hallway scene still gets me.",
    vinnyReactWrong: "237! Kubrick changed it from the book. King was not happy about that.",
  },
  {
    id: "t6",
    question: "Which film won Best Picture at the Oscars in 1994?",
    options: ["Pulp Fiction", "The Shawshank Redemption", "Forrest Gump", "The Lion King"],
    correctIndex: 2,
    vinnyReactCorrect: "Forrest Gump. Controversial pick — a lot of people think Shawshank got robbed.",
    vinnyReactWrong: "Forrest Gump! I know, I know — Shawshank shoulda won. But that's the Academy for you.",
  },
  {
    id: "t7",
    question: "What planet is Luke Skywalker from?",
    options: ["Naboo", "Endor", "Tatooine", "Hoth"],
    correctIndex: 2,
    vinnyReactCorrect: "Tatooine. Twin suns, moisture farms, and the best sunset in cinema history.",
    vinnyReactWrong: "Tatooine! Binary sunset, man. If that scene doesn't move you, I can't help you.",
  },
  {
    id: "t8",
    question: "Who composed the music for most of Spielberg's films?",
    options: ["Hans Zimmer", "Danny Elfman", "John Williams", "Howard Shore"],
    correctIndex: 2,
    vinnyReactCorrect: "John Williams. The GOAT. Jaws, E.T., Raiders, Schindler's — the man IS cinema music.",
    vinnyReactWrong: "John Williams! Come on, that's the most important collaboration in film history.",
  },
  {
    id: "t9",
    question: "What's the name of the computer in 2001: A Space Odyssey?",
    options: ["WOPR", "HAL 9000", "Skynet", "GERTY"],
    correctIndex: 1,
    vinnyReactCorrect: "HAL 9000. 'I'm sorry, Dave.' Kubrick was warning us about AI before it was cool.",
    vinnyReactWrong: "HAL 9000. Fun fact — each letter is one step before IBM. H-I, A-B, L-M. Kubrick denied it though.",
  },
  {
    id: "t10",
    question: "Which Coen Brothers film features a wood chipper?",
    options: ["The Big Lebowski", "No Country for Old Men", "Fargo", "Blood Simple"],
    correctIndex: 2,
    vinnyReactCorrect: "Fargo. Oh yah. That wood chipper scene is burned into my brain forever.",
    vinnyReactWrong: "Fargo! '96. Minnesota nice meets Minnesota horrifying. Classic Coens.",
  },
];

// ── XP & Ranks ────────────────────────────────────────────
export interface Rank {
  name: string;
  minXP: number;
  color: string;
}

export const RANKS: Rank[] = [
  { name: "New Hire",          minXP: 0,   color: "#9ca3af" },
  { name: "Regular",           minXP: 50,  color: "#60a5fa" },
  { name: "Film Buff",         minXP: 150, color: "#a855f7" },
  { name: "Cinephile",         minXP: 300, color: "#f59e0b" },
  { name: "Honorary Manager",  minXP: 500, color: "#ef4444" },
];

export function getRank(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(xp: number): Rank | null {
  const current = getRank(xp);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getXPProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 1;
  return (xp - current.minXP) / (next.minXP - current.minXP);
}

// ── Scoring ───────────────────────────────────────────────
export const POINTS = {
  GREAT_PICK: 30,
  OK_PICK: 10,
  BAD_PICK: 0,
  TRIVIA_CORRECT: 20,
  TRIVIA_WRONG: 0,
};

// ── Persistence ───────────────────────────────────────────
const XP_KEY = "fnv_xp";
const TRIVIA_SEEN_KEY = "fnv_trivia_seen";
const REQUESTS_DONE_KEY = "fnv_requests_done";

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

export function addXP(amount: number): number {
  const current = getXP();
  const next = current + amount;
  localStorage.setItem(XP_KEY, String(next));
  return next;
}

export function getSeenTrivia(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(TRIVIA_SEEN_KEY) || "[]"));
  } catch { return new Set(); }
}

export function markTriviaSeen(id: string): void {
  const s = getSeenTrivia();
  s.add(id);
  localStorage.setItem(TRIVIA_SEEN_KEY, JSON.stringify([...s]));
}

export function getDoneRequests(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(REQUESTS_DONE_KEY) || "[]"));
  } catch { return new Set(); }
}

export function markRequestDone(id: string): void {
  const s = getDoneRequests();
  s.add(id);
  localStorage.setItem(REQUESTS_DONE_KEY, JSON.stringify([...s]));
}
