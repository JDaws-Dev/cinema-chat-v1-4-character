/**
 * Hidden VHS tapes scattered around the store.
 * Walk over them to discover films and add to your collection.
 */

export interface Collectible {
  id: string;
  x: number;
  y: number;
  title: string;
  year: number;
  color: string; // spine color
}

// Hidden tapes placed in interesting spots around the store
export const COLLECTIBLES: Collectible[] = [
  { id: "c1",  x: 3,  y: 5,  title: "Jaws",                    year: 1975, color: "#3b82f6" },
  { id: "c2",  x: 8,  y: 6,  title: "Blade Runner",            year: 1982, color: "#a855f7" },
  { id: "c3",  x: 15, y: 9,  title: "The Shining",             year: 1980, color: "#dc2626" },
  { id: "c4",  x: 6,  y: 11, title: "Back to the Future",      year: 1985, color: "#f97316" },
  { id: "c5",  x: 17, y: 14, title: "E.T. the Extra-Terrestrial", year: 1982, color: "#22c55e" },
  { id: "c6",  x: 2,  y: 9,  title: "Raiders of the Lost Ark", year: 1981, color: "#b8960a" },
  { id: "c7",  x: 12, y: 6,  title: "Alien",                   year: 1979, color: "#1e40af" },
  { id: "c8",  x: 10, y: 15, title: "The Princess Bride",      year: 1987, color: "#ec4899" },
  { id: "c9",  x: 5,  y: 2,  title: "Ghostbusters",            year: 1984, color: "#22c55e" },
  { id: "c10", x: 16, y: 5,  title: "Die Hard",                year: 1988, color: "#ef4444" },
  { id: "c11", x: 11, y: 11, title: "The Breakfast Club",      year: 1985, color: "#f97316" },
  { id: "c12", x: 7,  y: 14, title: "Ferris Bueller's Day Off",year: 1986, color: "#ffd700" },
];

const STORAGE_KEY = "fnv_collected";

export function getCollected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function collectTape(id: string): void {
  const set = getCollected();
  set.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function isCollected(id: string): boolean {
  return getCollected().has(id);
}
