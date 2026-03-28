/**
 * Store grid for player movement and collision.
 * Each cell is ~5% of the store map (20x20 grid).
 * 0 = walkable, 1 = wall, 2 = shelf, 3 = counter, 4 = door, 5 = object
 */

export const GRID_W = 20;
export const GRID_H = 20;

// prettier-ignore
export const GRID: number[][] = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0 top wall
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 1 poster wall
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2 open
  [ 1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 0, 2, 2, 2, 0, 0, 1], // 3 shelf row 1 top
  [ 1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 0, 2, 2, 2, 0, 0, 1], // 4 shelf row 1 bottom
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 5 aisle
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6 aisle
  [ 1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1], // 7 shelf row 2 top
  [ 1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1], // 8 shelf row 2 bottom
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9 aisle
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 1], // 10 open (rewind sign area)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 11 open
  [ 1, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 1], // 12 counter top
  [ 1, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 1], // 13 counter bottom
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 14 open
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 15 near door
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 16 entrance
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 17 entrance
  [ 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], // 18 bottom wall + door
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 19 outside
];

export const PLAYER_START = { x: 10, y: 16 };

export type Direction = "up" | "down" | "left" | "right";

export function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
  return GRID[y][x] === 0 || GRID[y][x] === 4;
}

export type InteractionType = "shelf" | "counter" | "door" | null;

/** Genre assigned to shelf tiles based on position */
function shelfGenre(x: number, y: number): string {
  // Row 1 (y=3,4)
  if (y === 3 || y === 4) {
    if (x <= 2) return "horror";
    if (x <= 5) return "scifi";
    if (x <= 8) return "comedy";
    if (x <= 11) return "drama";
    if (x >= 14) return "staff_picks";
  }
  // Row 2 (y=7,8)
  if (y === 7 || y === 8) {
    if (x <= 2) return "action";
    if (x <= 5) return "classics";
    if (x <= 8) return "family";
    if (x <= 11) return "new_releases";
  }
  return "new_releases";
}

/** Check what the player can interact with from their current position */
export function getInteraction(px: number, py: number): { type: InteractionType; genre?: string } {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
    const cell = GRID[ny][nx];
    if (cell === 2) return { type: "shelf", genre: shelfGenre(nx, ny) };
    if (cell === 3) return { type: "counter" };
    if (cell === 4) return { type: "door" };
  }
  return { type: null };
}

/** Get the zone name for HUD based on player position */
export function getZoneName(px: number, py: number): string | null {
  const interaction = getInteraction(px, py);
  if (interaction.type === "counter") return "vinny";
  if (interaction.type === "shelf") return interaction.genre || null;
  if (interaction.type === "door") return "exit";
  // General area
  if (py <= 6) return null; // browsing area
  if (py >= 14) return null; // entrance
  return null;
}

/** Grid position → CSS percentage position */
export function gridToPercent(gx: number, gy: number): { left: number; top: number } {
  // Map grid coords to store-map percentages
  // Grid is 20x20, store interior is ~92% wide (4% walls each side) and ~84% tall (10% top wall, 7% bottom)
  const left = 4 + (gx / GRID_W) * 92;
  const top = 10 + (gy / GRID_H) * 83;
  return { left, top };
}
