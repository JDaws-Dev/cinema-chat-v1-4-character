"use client";

import type { WatchlistItem, UserRating } from "./types";

const WATCHLIST_KEY = "vinny_watchlist";
const RATINGS_KEY = "vinny_ratings";

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToWatchlist(item: WatchlistItem): void {
  const list = getWatchlist();
  if (list.some((w) => w.title === item.title && w.year === item.year)) return;
  list.unshift(item);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list.slice(0, 200)));
}

export function removeFromWatchlist(title: string, year: number | null): void {
  const list = getWatchlist().filter(
    (w) => !(w.title === title && w.year === year)
  );
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

export function isOnWatchlist(title: string, year: number | null): boolean {
  return getWatchlist().some((w) => w.title === title && w.year === year);
}

export function getRatings(): UserRating[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setRating(rating: UserRating): void {
  const list = getRatings();
  const idx = list.findIndex(
    (r) => r.title === rating.title && r.year === rating.year
  );
  if (idx >= 0) {
    list[idx] = rating;
  } else {
    list.unshift(rating);
  }
  localStorage.setItem(RATINGS_KEY, JSON.stringify(list.slice(0, 500)));
}

export function getRating(
  title: string,
  year: number | null
): UserRating | null {
  return (
    getRatings().find((r) => r.title === title && r.year === year) || null
  );
}
