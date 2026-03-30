// RPG Quest System for Friday Night Video
// Vinny gives main quests — movie-themed challenges that earn props for the trophy shelf.

export interface Quest {
  id: string;
  title: string;
  description: string;
  giverNpc: "vinny" | "charlie" | "customer";
  type: "fetch" | "find" | "trivia" | "social" | "explore";
  objectives: QuestObjective[];
  reward: { propId?: string; xp: number };
  unlockCondition?: { completedQuests?: string[]; minProps?: number };
}

export interface QuestObjective {
  id: string;
  description: string;
  type: "find_movie" | "visit_section" | "talk_to_npc" | "answer_trivia" | "browse_genre";
  target: string; // genre name, NPC name, movie title, etc.
  completed: boolean;
}

export interface QuestState {
  activeQuests: string[];
  completedQuests: string[];
  questProgress: Record<string, Record<string, boolean>>; // questId -> objectiveId -> done
}

// ── The 12 genre sections in the store ──────────────────────
export const ALL_GENRES = [
  "HORROR", "SCI-FI", "COMEDY", "DRAMA",
  "ACTION", "FAMILY", "ROMANCE", "WESTERN",
  "THRILLER", "ANIMATED", "DOCS", "CLASSICS",
];

// ── Vinny's 5 Quests ────────────────────────────────────────
export const VINNY_QUESTS: Quest[] = [
  {
    id: "starter_pack",
    title: "The Friday Night Starter Pack",
    description: "Vinny wants to make sure you know the store. Browse 3 different genre sections to prove you can find your way around.",
    giverNpc: "vinny",
    type: "explore",
    objectives: [
      { id: "visit_horror", description: "Browse the Horror section", type: "visit_section", target: "HORROR", completed: false },
      { id: "visit_comedy", description: "Browse the Comedy section", type: "visit_section", target: "COMEDY", completed: false },
      { id: "visit_action", description: "Browse the Action section", type: "visit_section", target: "ACTION", completed: false },
    ],
    reward: { xp: 50 },
    // Always available — no unlock condition
  },
  {
    id: "top_shelf",
    title: "Vinny's Top Shelf",
    description: "Vinny swears by a specific movie. Find it on the shelves and bring it back to him.",
    giverNpc: "vinny",
    type: "fetch",
    objectives: [
      { id: "find_vinnys_pick", description: "Find and pick up the movie Vinny recommends", type: "find_movie", target: "", completed: false }, // target set dynamically
    ],
    reward: { propId: "vhs_tape", xp: 100 },
    unlockCondition: { completedQuests: ["starter_pack"] },
  },
  {
    id: "genre_master",
    title: "The Genre Master",
    description: "Think you know this store? Visit every single genre section. All 12 of them.",
    giverNpc: "vinny",
    type: "explore",
    objectives: ALL_GENRES.map(g => ({
      id: `visit_${g.toLowerCase().replace(/-/g, "_")}`,
      description: `Browse the ${g} section`,
      type: "visit_section" as const,
      target: g,
      completed: false,
    })),
    reward: { propId: "membership_card", xp: 150 },
    unlockCondition: { completedQuests: ["top_shelf"] },
  },
  {
    id: "movie_night_planner",
    title: "Movie Night Planner",
    description: "Plan the perfect movie night: pick one comedy, one drama, and one action film from the shelves.",
    giverNpc: "vinny",
    type: "fetch",
    objectives: [
      { id: "pick_comedy", description: "Pick up a movie from Comedy", type: "browse_genre", target: "COMEDY", completed: false },
      { id: "pick_drama", description: "Pick up a movie from Drama", type: "browse_genre", target: "DRAMA", completed: false },
      { id: "pick_action", description: "Pick up a movie from Action", type: "browse_genre", target: "ACTION", completed: false },
    ],
    reward: { propId: "popcorn_bucket", xp: 200 },
    unlockCondition: { completedQuests: ["genre_master"] },
  },
  {
    id: "secret_stash",
    title: "Vinny's Secret Stash",
    description: "Vinny mentions a legendary movie hidden behind the counter. Talk to Charlie for a hint, then find it on the shelves.",
    giverNpc: "vinny",
    type: "social",
    objectives: [
      { id: "talk_charlie", description: "Talk to Charlie for a hint", type: "talk_to_npc", target: "charlie", completed: false },
      { id: "find_secret", description: "Find the hidden movie", type: "find_movie", target: "", completed: false }, // target set dynamically
    ],
    reward: { propId: "golden_vhs", xp: 300 },
    unlockCondition: { completedQuests: ["movie_night_planner"] },
  },
];

// ── Customer Side Quests ──────────────────────────────────────
export const CUSTOMER_SIDE_QUESTS: Quest[] = [
  {
    id: "help_me_find_it",
    title: "Help Me Find It",
    description: "A confused customer needs you to find an Action movie for them.",
    giverNpc: "customer",
    type: "fetch",
    objectives: [
      { id: "visit_action", description: "Browse the Action section", type: "visit_section", target: "ACTION", completed: false },
      { id: "return_to_customer", description: "Talk to a customer again", type: "talk_to_npc", target: "customer", completed: false },
    ],
    reward: { xp: 50 },
  },
  {
    id: "date_night_dilemma",
    title: "Date Night Dilemma",
    description: "Help a couple find a movie they can both enjoy — check the Comedy section.",
    giverNpc: "customer",
    type: "fetch",
    objectives: [
      { id: "visit_comedy", description: "Browse the Comedy section", type: "visit_section", target: "COMEDY", completed: false },
    ],
    reward: { xp: 50 },
  },
  {
    id: "kids_pick_family",
    title: "The Kid's Pick",
    description: "Help a kid find something awesome in the Family section.",
    giverNpc: "customer",
    type: "fetch",
    objectives: [
      { id: "visit_family", description: "Browse the Family section", type: "visit_section", target: "FAMILY", completed: false },
    ],
    reward: { xp: 50 },
  },
  {
    id: "trivia_bet",
    title: "Movie Trivia Bet",
    description: "A customer bet you $5 on a movie trivia question. Answer correctly to win!",
    giverNpc: "customer",
    type: "trivia",
    objectives: [
      { id: "answer_correct", description: "Answer the trivia question correctly", type: "answer_trivia", target: "Spielberg", completed: false },
    ],
    reward: { xp: 75 },
  },
  {
    id: "return_run",
    title: "The Return Run",
    description: "A customer forgot to return their tape. Take it to the video return slot for them.",
    giverNpc: "customer",
    type: "fetch",
    objectives: [
      { id: "use_return_slot", description: "Use the video return slot", type: "visit_section", target: "RETURN_SLOT", completed: false },
    ],
    reward: { xp: 50 },
  },
];

// All quests combined (Vinny + Customer)
export const ALL_QUESTS: Quest[] = [...VINNY_QUESTS, ...CUSTOMER_SIDE_QUESTS];

// ── Quest reward props (added to the trophy shelf) ──────────
export const QUEST_PROPS = [
  { id: "vhs_tape", name: "VHS Tape", movie: "Vinny's Top Shelf Pick", rarity: "uncommon" as const, emoji: "\uD83D\uDCFC", unlockedBy: "quest_top_shelf" },
  { id: "membership_card", name: "Membership Card", movie: "Genre Master Achievement", rarity: "rare" as const, emoji: "\uD83C\uDFAB", unlockedBy: "quest_genre_master" },
  { id: "popcorn_bucket", name: "Popcorn Bucket", movie: "Movie Night Planner", rarity: "rare" as const, emoji: "\uD83C\uDF7F", unlockedBy: "quest_movie_night_planner" },
  { id: "golden_vhs", name: "Golden VHS", movie: "Vinny's Secret Stash", rarity: "legendary" as const, emoji: "\uD83C\uDFC6", unlockedBy: "quest_secret_stash" },
];

// ── Vinny dialogue for each quest ───────────────────────────
export const QUEST_DIALOGUE: Record<string, { offer: string; progress: string; complete: string }> = {
  starter_pack: {
    offer: "Hey, new face! Before I let you browse the good stuff, show me you know the store. Go check out the Horror, Comedy, and Action sections. Just walk up and browse each one.",
    progress: "Still exploring? You haven't hit all three sections yet. Horror, Comedy, Action — come on, it's not that big a store!",
    complete: "Now you're getting the layout! Welcome to Friday Night Video, kid.",
  },
  top_shelf: {
    offer: "Alright, now I know you can find your way around. I've got a personal recommendation for you — one of my all-time favorites. Find it on the shelves and bring it to me.",
    progress: "Still looking for my pick? It's gotta be on one of these shelves somewhere. Keep your eyes peeled.",
    complete: "THAT'S the one! Incredible taste. You've earned yourself a VHS tape for the collection.",
  },
  genre_master: {
    offer: "You think you know this store? Prove it. Visit every single genre section — all 12 of 'em. Horror, Sci-Fi, Comedy, Drama, Action, Family, Romance, Western, Thriller, Animated, Docs, and Classics.",
    progress: "Still got sections to hit. Don't skip any — I'll know.",
    complete: "Every section! You've earned your official Friday Night Video Membership Card. Flash this baby and you get the VIP treatment.",
  },
  movie_night_planner: {
    offer: "Here's a challenge for you: plan the perfect movie night. I need you to pick up one movie from Comedy, one from Drama, and one from Action. Three genres, three picks — go!",
    progress: "You still need more movies for movie night. Remember: Comedy, Drama, and Action. One from each!",
    complete: "Now THAT'S a movie night! Comedy, drama, and action — the perfect triple feature. Here's a Popcorn Bucket for the shelf!",
  },
  secret_stash: {
    offer: "Listen... I don't tell everyone this, but there's a movie in this store that's special. Real special. Go talk to Charlie — he knows something about it. Then find it and bring it to me.",
    progress: "Still looking for the secret tape? Charlie might have a hint if you haven't talked to him yet.",
    complete: "You found it. You actually found it. I'm impressed. This Golden VHS is yours — the rarest item in the store.",
  },
};
