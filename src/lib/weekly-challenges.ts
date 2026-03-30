// Weekly challenges that reset every Monday, deterministic based on week number

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  check: (state: { moviesRented: string[]; genresVisited: string[]; snacksGrabbed: number; xpEarned: number }) => boolean;
  reward: number; // XP
}

const CHALLENGE_TEMPLATES: Omit<WeeklyChallenge, 'id'>[] = [
  { title: "Genre Explorer", description: "Visit 6 different genre sections", check: (s) => s.genresVisited.length >= 6, reward: 100 },
  { title: "Movie Marathon", description: "Pick up 5 movies in one visit", check: (s) => s.moviesRented.length >= 5, reward: 150 },
  { title: "Snack Attack", description: "Grab 3 snacks", check: (s) => s.snacksGrabbed >= 3, reward: 75 },
  { title: "The Completionist", description: "Visit all 12 genre sections", check: (s) => s.genresVisited.length >= 12, reward: 200 },
  { title: "Double Feature", description: "Pick up exactly 2 movies", check: (s) => s.moviesRented.length === 2, reward: 80 },
  { title: "XP Grinder", description: "Earn 100 XP this visit", check: (s) => s.xpEarned >= 100, reward: 100 },
  { title: "Quick Pick", description: "Check out within 5 minutes", check: () => false, reward: 120 }, // time-based, needs special handling
  { title: "Horror Fan", description: "Pick up 2 Horror movies", check: (s) => s.moviesRented.filter(g => g === "HORROR").length >= 2, reward: 90 },
  { title: "Family Night", description: "Pick a Family movie and 2 snacks", check: (s) => s.moviesRented.includes("FAMILY") && s.snacksGrabbed >= 2, reward: 100 },
  { title: "Vinny's Friend", description: "Talk to Vinny 3 times", check: () => false, reward: 75 }, // needs special tracking
];

export function getWeeklyChallenge(): WeeklyChallenge {
  // Deterministic based on week number since Jan 1 2026
  const now = new Date();
  const weekNum = Math.floor((now.getTime() - new Date(2026, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const idx = weekNum % CHALLENGE_TEMPLATES.length;
  const template = CHALLENGE_TEMPLATES[idx];
  return { ...template, id: `weekly_${weekNum}` };
}

export function isWeeklyChallengeComplete(challengeId: string): boolean {
  if (typeof window === "undefined") return false;
  return JSON.parse(localStorage.getItem("fnv_weekly_done") || "[]").includes(challengeId);
}

export function completeWeeklyChallenge(challengeId: string) {
  if (typeof window === "undefined") return;
  const done: string[] = JSON.parse(localStorage.getItem("fnv_weekly_done") || "[]");
  if (!done.includes(challengeId)) {
    done.push(challengeId);
    localStorage.setItem("fnv_weekly_done", JSON.stringify(done));
  }
}
