"use client";

import { getShelfRows } from "@/lib/store-layout";

// ── Room dimensions ──────────────────────────────────────
export const ROOM_W = 20;
export const ROOM_D = 14;
export const ROOM_H = 3.5;
export const WALL_COLOR = "#223663";     // Brighter Blockbuster blue so shelves/signs read from a distance
export const FLOOR_COLOR = "#2a3660";    // Blue-grey carpet — lighter, authentic to real Blockbusters
export const CEILING_COLOR = "#969081";  // Warm retail drop ceiling
export const COUNTER_COLOR = "#8a6830";  // warmer wood
export const SHELF_COLOR = "#7a5a30";    // Codex: warmer walnut/honey so posters don't disappear

// ── Shelf layout — driven by store-layout.ts ─────────────
export const SHELF_ROWS = getShelfRows();
