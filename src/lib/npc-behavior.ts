/**
 * npc-behavior.ts — Complete NPC behavior system for the strip mall.
 *
 * Architecture:
 *   1. Waypoint graph with typed nodes and directed edges (door transitions)
 *   2. Goal-driven behavior: each NPC picks a goal that decomposes into sub-states
 *   3. Finite state machine with timed transitions
 *   4. Lifecycle: spawn from street/parking, execute goal, despawn
 *   5. Proximity-based NPC-to-NPC conversation triggers
 *
 * Coordinate system (matches Store.tsx / store-layout.ts):
 *   - Video store: x=-10..10, z=-7..7 (ROOM_W=20, ROOM_D=14)
 *   - Pizza Palace: group at (-13, 0, 5.5), local x=-3..3, z=-2.5..1.5
 *   - Laundromat:   group at (13, 0, 5.75), local x=-3..3, z=-1.25..1.25
 *   - Sidewalk:     z ~ 7.8, full width
 *   - Parking lot:  z ~ 10-14
 *   - Street:       z ~ 16+
 */

// ═══════════════════════════════════════════════════════════════
// §1 — WAYPOINT GRAPH
// ═══════════════════════════════════════════════════════════════

export type WaypointType =
  | 'aisle'      // between shelf rows
  | 'shelf'      // directly in front of a shelf, for browsing
  | 'counter'    // checkout / order counter
  | 'booth'      // pizza booth seating
  | 'machine'    // washer or dryer
  | 'table'      // folding table (laundromat)
  | 'seat'       // waiting chair
  | 'door'       // transition between zones
  | 'parking'    // parking lot spots
  | 'sidewalk'   // sidewalk path
  | 'street'     // street (spawn/despawn edge)
  | 'soda'       // soda fountain / vending
  | 'new_releases'; // new releases wall

export type Zone =
  | 'video_store'
  | 'pizza_palace'
  | 'laundromat'
  | 'exterior';

export interface Waypoint {
  id: string;
  type: WaypointType;
  zone: Zone;
  /** World-space position */
  position: [number, number, number];
  /** IDs of waypoints directly reachable from here */
  neighbors: string[];
  /** How long an NPC might linger here (seconds). 0 = pass-through */
  loiterRange: [number, number];
  /** Optional: which direction the NPC faces while loitering (radians, 0 = +z) */
  facingAngle?: number;
}

// Helper: world positions for Pizza Palace (group offset: -13, 0, 5.5)
const pp = (lx: number, ly: number, lz: number): [number, number, number] =>
  [lx + -13, ly, lz + 5.5];

// Helper: world positions for Laundromat (group offset: 13, 0, 5.75)
const lm = (lx: number, ly: number, lz: number): [number, number, number] =>
  [lx + 13, ly, lz + 5.75];

export const WAYPOINTS: Record<string, Waypoint> = {
  // ── STREET (spawn/despawn) ──────────────────────────────
  'street-left':    { id: 'street-left',    type: 'street',   zone: 'exterior', position: [-18, 0, 16], neighbors: ['parking-far-left'], loiterRange: [0, 0] },
  'street-center':  { id: 'street-center',  type: 'street',   zone: 'exterior', position: [0, 0, 16],   neighbors: ['parking-center'],   loiterRange: [0, 0] },
  'street-right':   { id: 'street-right',   type: 'street',   zone: 'exterior', position: [18, 0, 16],  neighbors: ['parking-far-right'], loiterRange: [0, 0] },

  // ── PARKING LOT ─────────────────────────────────────────
  'parking-far-left':  { id: 'parking-far-left',  type: 'parking', zone: 'exterior', position: [-12.75, 0, 12], neighbors: ['street-left', 'parking-left', 'sidewalk-pizza'], loiterRange: [0, 2] },
  'parking-left':      { id: 'parking-left',      type: 'parking', zone: 'exterior', position: [-8.24, 0, 12.6], neighbors: ['parking-far-left', 'parking-center-left', 'sidewalk-pizza'], loiterRange: [0, 2] },
  'parking-center-left': { id: 'parking-center-left', type: 'parking', zone: 'exterior', position: [-4.76, 0, 12.5], neighbors: ['parking-left', 'parking-center', 'sidewalk-video-left'], loiterRange: [0, 2] },
  'parking-center':    { id: 'parking-center',    type: 'parking', zone: 'exterior', position: [0, 0, 12.3], neighbors: ['street-center', 'parking-center-left', 'parking-center-right', 'sidewalk-video-center'], loiterRange: [0, 2] },
  'parking-center-right': { id: 'parking-center-right', type: 'parking', zone: 'exterior', position: [5.45, 0, 12.2], neighbors: ['parking-center', 'parking-right', 'sidewalk-video-right'], loiterRange: [0, 2] },
  'parking-right':     { id: 'parking-right',     type: 'parking', zone: 'exterior', position: [8.19, 0, 12.4], neighbors: ['parking-center-right', 'parking-far-right', 'sidewalk-laundro'], loiterRange: [0, 2] },
  'parking-far-right': { id: 'parking-far-right', type: 'parking', zone: 'exterior', position: [12.86, 0, 13.9], neighbors: ['street-right', 'parking-right', 'sidewalk-laundro'], loiterRange: [0, 2] },

  // ── SIDEWALK ────────────────────────────────────────────
  'sidewalk-pizza':         { id: 'sidewalk-pizza',         type: 'sidewalk', zone: 'exterior', position: [-13, 0, 7.8], neighbors: ['parking-far-left', 'parking-left', 'sidewalk-video-left', 'door-pizza-ext'], loiterRange: [0, 3] },
  'sidewalk-video-left':    { id: 'sidewalk-video-left',    type: 'sidewalk', zone: 'exterior', position: [-5, 0, 7.8],  neighbors: ['parking-center-left', 'sidewalk-pizza', 'sidewalk-video-center'], loiterRange: [0, 1] },
  'sidewalk-video-center':  { id: 'sidewalk-video-center',  type: 'sidewalk', zone: 'exterior', position: [0, 0, 7.8],   neighbors: ['parking-center', 'sidewalk-video-left', 'sidewalk-video-right', 'door-video-ext'], loiterRange: [0, 1] },
  'sidewalk-video-right':   { id: 'sidewalk-video-right',   type: 'sidewalk', zone: 'exterior', position: [5, 0, 7.8],   neighbors: ['parking-center-right', 'sidewalk-video-center', 'sidewalk-laundro'], loiterRange: [0, 1] },
  'sidewalk-laundro':       { id: 'sidewalk-laundro',       type: 'sidewalk', zone: 'exterior', position: [13, 0, 7.8],  neighbors: ['parking-right', 'parking-far-right', 'sidewalk-video-right', 'door-laundro-ext'], loiterRange: [0, 3] },

  // ── DOOR TRANSITIONS ───────────────────────────────────
  // Each door has an exterior and interior waypoint. Neighbors cross the threshold.
  'door-video-ext':   { id: 'door-video-ext',   type: 'door', zone: 'exterior',    position: [0, 0, 7],    neighbors: ['sidewalk-video-center', 'door-video-int'], loiterRange: [0, 0] },
  'door-video-int':   { id: 'door-video-int',   type: 'door', zone: 'video_store', position: [0, 0, 6],    neighbors: ['door-video-ext', 'vs-aisle-front-center'], loiterRange: [0, 0] },
  'door-pizza-ext':   { id: 'door-pizza-ext',   type: 'door', zone: 'exterior',     position: [-12.5, 0, 7.15], neighbors: ['sidewalk-pizza', 'door-pizza-int'], loiterRange: [0, 0] },
  'door-pizza-int':   { id: 'door-pizza-int',   type: 'door', zone: 'pizza_palace', position: pp(-0.3, 0, 1.2), neighbors: ['door-pizza-ext', 'pp-counter'], loiterRange: [0, 0] },
  'door-laundro-ext': { id: 'door-laundro-ext', type: 'door', zone: 'exterior',     position: [13.5, 0, 7.15], neighbors: ['sidewalk-laundro', 'door-laundro-int'], loiterRange: [0, 0] },
  'door-laundro-int': { id: 'door-laundro-int', type: 'door', zone: 'laundromat',   position: lm(0.5, 0, 1.0), neighbors: ['door-laundro-ext', 'lm-folding-table', 'lm-chair-1'], loiterRange: [0, 0] },

  // ── VIDEO STORE — AISLES ───────────────────────────────
  // Front area (near entrance, z ~ 5-6)
  'vs-aisle-front-center': { id: 'vs-aisle-front-center', type: 'aisle', zone: 'video_store', position: [0, 0, 5], neighbors: ['door-video-int', 'vs-aisle-front-left', 'vs-aisle-front-right', 'vs-aisle-mid-center', 'vs-counter-approach'], loiterRange: [0, 1] },
  'vs-aisle-front-left':   { id: 'vs-aisle-front-left',   type: 'aisle', zone: 'video_store', position: [-4, 0, 5], neighbors: ['vs-aisle-front-center', 'vs-aisle-mid-left'], loiterRange: [0, 1] },
  'vs-aisle-front-right':  { id: 'vs-aisle-front-right',  type: 'aisle', zone: 'video_store', position: [4, 0, 5],  neighbors: ['vs-aisle-front-center', 'vs-aisle-mid-right'], loiterRange: [0, 1] },

  // Mid-store aisles (z ~ 3, between row 3 and front)
  'vs-aisle-mid-center': { id: 'vs-aisle-mid-center', type: 'aisle', zone: 'video_store', position: [0, 0, 3],   neighbors: ['vs-aisle-front-center', 'vs-aisle-row3-center', 'vs-aisle-mid-left', 'vs-aisle-mid-right'], loiterRange: [0, 1] },
  'vs-aisle-mid-left':   { id: 'vs-aisle-mid-left',   type: 'aisle', zone: 'video_store', position: [-4, 0, 1],  neighbors: ['vs-aisle-front-left', 'vs-aisle-mid-center', 'vs-shelf-row3-left'], loiterRange: [0, 1] },
  'vs-aisle-mid-right':  { id: 'vs-aisle-mid-right',  type: 'aisle', zone: 'video_store', position: [4, 0, 1],   neighbors: ['vs-aisle-front-right', 'vs-aisle-mid-center', 'vs-shelf-row3-right'], loiterRange: [0, 1] },

  // Row 3 cross-aisle (z ~ 0)
  'vs-aisle-row3-center': { id: 'vs-aisle-row3-center', type: 'aisle', zone: 'video_store', position: [0, 0, 0],  neighbors: ['vs-aisle-mid-center', 'vs-aisle-row2-center', 'vs-shelf-row3-left', 'vs-shelf-row3-right'], loiterRange: [0, 1] },

  // Row 2 cross-aisle (z ~ -3)
  'vs-aisle-row2-center': { id: 'vs-aisle-row2-center', type: 'aisle', zone: 'video_store', position: [0, 0, -3], neighbors: ['vs-aisle-row3-center', 'vs-aisle-back-center', 'vs-shelf-row2-left', 'vs-shelf-row2-right'], loiterRange: [0, 1] },

  // Back area (z ~ -5.5, near new releases wall)
  'vs-aisle-back-center': { id: 'vs-aisle-back-center', type: 'aisle', zone: 'video_store', position: [0, 0, -5.5], neighbors: ['vs-aisle-row2-center', 'vs-shelf-row1-left', 'vs-shelf-row1-right', 'vs-new-releases'], loiterRange: [0, 1] },

  // ── VIDEO STORE — SHELF BROWSING SPOTS ─────────────────
  // Row 1 (back): Action/Adventure left, Comedy right
  'vs-shelf-row1-left':   { id: 'vs-shelf-row1-left',   type: 'shelf', zone: 'video_store', position: [-4, 0, -4.2], neighbors: ['vs-aisle-back-center', 'vs-shelf-row2-left'],  loiterRange: [5, 15], facingAngle: Math.PI },
  'vs-shelf-row1-right':  { id: 'vs-shelf-row1-right',  type: 'shelf', zone: 'video_store', position: [4, 0, -4.2],  neighbors: ['vs-aisle-back-center', 'vs-shelf-row2-right'], loiterRange: [5, 15], facingAngle: Math.PI },

  // Row 2: Horror left, Drama right
  'vs-shelf-row2-left':   { id: 'vs-shelf-row2-left',   type: 'shelf', zone: 'video_store', position: [-4, 0, -1.5], neighbors: ['vs-aisle-row2-center', 'vs-shelf-row1-left', 'vs-shelf-row3-left'],  loiterRange: [5, 15], facingAngle: Math.PI },
  'vs-shelf-row2-right':  { id: 'vs-shelf-row2-right',  type: 'shelf', zone: 'video_store', position: [4, 0, -1.5],  neighbors: ['vs-aisle-row2-center', 'vs-shelf-row1-right', 'vs-shelf-row3-right'], loiterRange: [5, 15], facingAngle: 0 },

  // Row 3: Sci-Fi left, Kids/Family right
  'vs-shelf-row3-left':   { id: 'vs-shelf-row3-left',   type: 'shelf', zone: 'video_store', position: [-4, 0, 1],    neighbors: ['vs-aisle-mid-left', 'vs-aisle-row3-center', 'vs-shelf-row2-left'],  loiterRange: [5, 15], facingAngle: 0 },
  'vs-shelf-row3-right':  { id: 'vs-shelf-row3-right',  type: 'shelf', zone: 'video_store', position: [4, 0, 1],     neighbors: ['vs-aisle-mid-right', 'vs-aisle-row3-center', 'vs-shelf-row2-right'], loiterRange: [5, 15], facingAngle: 0 },

  // New releases wall (back wall z ~ -6.5)
  'vs-new-releases': { id: 'vs-new-releases', type: 'new_releases', zone: 'video_store', position: [0, 0, -6], neighbors: ['vs-aisle-back-center', 'vs-shelf-row1-left', 'vs-shelf-row1-right'], loiterRange: [8, 20], facingAngle: Math.PI },

  // ── VIDEO STORE — COUNTER ──────────────────────────────
  'vs-counter-approach': { id: 'vs-counter-approach', type: 'aisle',   zone: 'video_store', position: [7, 0, 4],   neighbors: ['vs-aisle-front-center', 'vs-aisle-front-right', 'vs-counter'], loiterRange: [0, 2] },
  'vs-counter':          { id: 'vs-counter',          type: 'counter', zone: 'video_store', position: [7, 0, 4.8], neighbors: ['vs-counter-approach'], loiterRange: [5, 15], facingAngle: Math.PI },

  // ── PIZZA PALACE ───────────────────────────────────────
  'pp-counter':  { id: 'pp-counter',  type: 'counter', zone: 'pizza_palace', position: pp(0, 0, -1.2),   neighbors: ['door-pizza-int', 'pp-soda', 'pp-booth-1', 'pp-booth-2'], loiterRange: [8, 20], facingAngle: Math.PI },
  'pp-soda':     { id: 'pp-soda',     type: 'soda',    zone: 'pizza_palace', position: pp(-2.5, 0, -0.8), neighbors: ['pp-counter'], loiterRange: [3, 6] },
  'pp-booth-1':  { id: 'pp-booth-1',  type: 'booth',   zone: 'pizza_palace', position: pp(-2.2, 0, -1),   neighbors: ['pp-counter', 'pp-booth-2'], loiterRange: [60, 180], facingAngle: -Math.PI / 2 },
  'pp-booth-2':  { id: 'pp-booth-2',  type: 'booth',   zone: 'pizza_palace', position: pp(-2.2, 0, 0.5),  neighbors: ['pp-counter', 'pp-booth-1'], loiterRange: [60, 180], facingAngle: -Math.PI / 2 },
  // Two more booths on the opposite side (conceptual — the store has 2 booth groups)
  'pp-booth-3':  { id: 'pp-booth-3',  type: 'booth',   zone: 'pizza_palace', position: pp(1.5, 0, -1),    neighbors: ['pp-counter', 'pp-booth-4'], loiterRange: [60, 180], facingAngle: Math.PI / 2 },
  'pp-booth-4':  { id: 'pp-booth-4',  type: 'booth',   zone: 'pizza_palace', position: pp(1.5, 0, 0.5),   neighbors: ['pp-counter', 'pp-booth-3'], loiterRange: [60, 180], facingAngle: Math.PI / 2 },

  // ── LAUNDROMAT ─────────────────────────────────────────
  // Washers along back wall (5 machines, we provide 3 waypoints for usable ones)
  'lm-washer-1':     { id: 'lm-washer-1',     type: 'machine', zone: 'laundromat', position: lm(-1.2, 0, -0.5), neighbors: ['lm-washer-2', 'lm-folding-table', 'door-laundro-int'], loiterRange: [3, 8], facingAngle: Math.PI },
  'lm-washer-2':     { id: 'lm-washer-2',     type: 'machine', zone: 'laundromat', position: lm(-0.4, 0, -0.5), neighbors: ['lm-washer-1', 'lm-washer-3', 'lm-folding-table'], loiterRange: [3, 8], facingAngle: Math.PI },
  'lm-washer-3':     { id: 'lm-washer-3',     type: 'machine', zone: 'laundromat', position: lm(0.4, 0, -0.5),  neighbors: ['lm-washer-2', 'lm-folding-table', 'lm-dryer-1'], loiterRange: [3, 8], facingAngle: Math.PI },

  // Dryers on right wall (3 machines)
  'lm-dryer-1':      { id: 'lm-dryer-1',      type: 'machine', zone: 'laundromat', position: lm(2.2, 0, -0.8),  neighbors: ['lm-washer-3', 'lm-dryer-2', 'lm-folding-table'], loiterRange: [3, 8], facingAngle: -Math.PI / 2 },
  'lm-dryer-2':      { id: 'lm-dryer-2',      type: 'machine', zone: 'laundromat', position: lm(2.2, 0, -0.1),  neighbors: ['lm-dryer-1', 'lm-dryer-3', 'lm-folding-table'], loiterRange: [3, 8], facingAngle: -Math.PI / 2 },
  'lm-dryer-3':      { id: 'lm-dryer-3',      type: 'machine', zone: 'laundromat', position: lm(2.2, 0, 0.6),   neighbors: ['lm-dryer-2', 'lm-folding-table'], loiterRange: [3, 8], facingAngle: -Math.PI / 2 },

  // Folding table (center)
  'lm-folding-table': { id: 'lm-folding-table', type: 'table', zone: 'laundromat', position: lm(0, 0, 0.2), neighbors: ['lm-washer-1', 'lm-washer-2', 'lm-washer-3', 'lm-dryer-1', 'lm-dryer-2', 'lm-dryer-3', 'lm-chair-1', 'door-laundro-int'], loiterRange: [10, 30], facingAngle: Math.PI },

  // Seating (3 chairs along left wall)
  'lm-chair-1': { id: 'lm-chair-1', type: 'seat', zone: 'laundromat', position: lm(-2.7, 0, -0.6), neighbors: ['lm-chair-2', 'lm-folding-table', 'door-laundro-int'], loiterRange: [30, 120], facingAngle: -Math.PI / 2 },
  'lm-chair-2': { id: 'lm-chair-2', type: 'seat', zone: 'laundromat', position: lm(-2.7, 0, 0.1),  neighbors: ['lm-chair-1', 'lm-chair-3', 'lm-folding-table'], loiterRange: [30, 120], facingAngle: -Math.PI / 2 },
  'lm-chair-3': { id: 'lm-chair-3', type: 'seat', zone: 'laundromat', position: lm(-2.7, 0, 0.8),  neighbors: ['lm-chair-2', 'lm-folding-table'], loiterRange: [30, 120], facingAngle: -Math.PI / 2 },

  // Vending machine
  'lm-vending':  { id: 'lm-vending',  type: 'soda', zone: 'laundromat', position: lm(2.5, 0, -0.5), neighbors: ['lm-dryer-1', 'lm-folding-table'], loiterRange: [3, 6] },
};


// ═══════════════════════════════════════════════════════════════
// §1b — PATHFINDING (BFS on waypoint graph)
// ═══════════════════════════════════════════════════════════════

/** BFS shortest path between two waypoint IDs. Returns ordered list of waypoint IDs including start and end. */
export function findPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  const visited = new Set<string>([startId]);
  const parent = new Map<string, string>();
  const queue: string[] = [startId];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    const wp = WAYPOINTS[current];
    if (!wp) continue;

    for (const neighborId of wp.neighbors) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      parent.set(neighborId, current);

      if (neighborId === endId) {
        // Reconstruct path
        const path: string[] = [endId];
        let node = endId;
        while (parent.has(node)) {
          node = parent.get(node)!;
          path.unshift(node);
        }
        return path;
      }
      queue.push(neighborId);
    }
  }

  // No path found — return empty (should not happen in connected graph)
  return [];
}

/** Find the nearest waypoint of a given type within a zone (or any zone). */
export function findNearestWaypoint(
  fromId: string,
  type: WaypointType,
  zone?: Zone
): string | null {
  const from = WAYPOINTS[fromId];
  if (!from) return null;

  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const wp of Object.values(WAYPOINTS)) {
    if (wp.type !== type) continue;
    if (zone && wp.zone !== zone) continue;
    const dx = wp.position[0] - from.position[0];
    const dz = wp.position[2] - from.position[2];
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = wp.id;
    }
  }

  return bestId;
}


// ═══════════════════════════════════════════════════════════════
// §2 — NPC STATE MACHINE
// ═══════════════════════════════════════════════════════════════

export type NPCState =
  | 'spawning'          // fading in at street/parking
  | 'entering'          // walking from parking/street toward a store
  | 'walking'           // moving between waypoints (generic transit)
  | 'browsing'          // looking at shelves/new releases
  | 'talking_to_npc'    // conversation with another NPC
  | 'talking_to_player' // player has initiated dialogue
  | 'ordering'          // at pizza counter placing order
  | 'eating'            // sitting in booth, eating pizza
  | 'waiting'           // waiting for laundry, waiting in line, etc.
  | 'loading_machine'   // putting clothes in washer/dryer
  | 'folding'           // at folding table
  | 'checking_out'      // at video store counter
  | 'leaving'           // walking back to parking/street
  | 'despawning';       // fading out at street

/** Rules for valid state transitions. Map<from, Set<to>>. */
export const STATE_TRANSITIONS: Record<NPCState, NPCState[]> = {
  spawning:          ['entering'],
  entering:          ['walking'],
  walking:           ['browsing', 'ordering', 'loading_machine', 'waiting', 'checking_out', 'leaving', 'talking_to_npc', 'talking_to_player', 'walking'],
  browsing:          ['walking', 'talking_to_npc', 'talking_to_player', 'checking_out'],
  talking_to_npc:    ['walking', 'browsing', 'waiting', 'eating'],
  talking_to_player: ['walking', 'browsing', 'waiting', 'eating'],
  ordering:          ['waiting', 'eating', 'walking'],
  eating:            ['walking', 'leaving', 'talking_to_npc', 'talking_to_player'],
  waiting:           ['loading_machine', 'folding', 'walking', 'talking_to_npc', 'talking_to_player'],
  loading_machine:   ['waiting', 'walking'],
  folding:           ['walking', 'leaving'],
  checking_out:      ['walking', 'leaving'],
  leaving:           ['despawning'],
  despawning:        [],
};

export interface StateConfig {
  /** Default duration range in seconds (min, max) */
  durationRange: [number, number];
  /** NPC movement speed multiplier (1.0 = normal walk) */
  speedMultiplier: number;
  /** Whether the NPC is interruptible by player */
  playerInterruptible: boolean;
  /** Whether the NPC is eligible for NPC-to-NPC conversation */
  npcChatEligible: boolean;
  /** Optional animation hint */
  animation: 'idle' | 'walk' | 'browse' | 'sit' | 'eat' | 'load' | 'fold' | 'talk' | 'fadein' | 'fadeout';
}

export const STATE_CONFIGS: Record<NPCState, StateConfig> = {
  spawning:          { durationRange: [1, 1.5],    speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'fadein' },
  entering:          { durationRange: [0, 0],      speedMultiplier: 0.9,  playerInterruptible: false, npcChatEligible: false, animation: 'walk' },
  walking:           { durationRange: [0, 0],      speedMultiplier: 1.0,  playerInterruptible: true,  npcChatEligible: false, animation: 'walk' },
  browsing:          { durationRange: [5, 15],     speedMultiplier: 0,    playerInterruptible: true,  npcChatEligible: true,  animation: 'browse' },
  talking_to_npc:    { durationRange: [8, 20],     speedMultiplier: 0,    playerInterruptible: true,  npcChatEligible: false, animation: 'talk' },
  talking_to_player: { durationRange: [0, 0],      speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'talk' },
  ordering:          { durationRange: [5, 10],     speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'idle' },
  eating:            { durationRange: [30, 90],    speedMultiplier: 0,    playerInterruptible: true,  npcChatEligible: true,  animation: 'eat' },
  waiting:           { durationRange: [30, 120],   speedMultiplier: 0,    playerInterruptible: true,  npcChatEligible: true,  animation: 'idle' },
  loading_machine:   { durationRange: [5, 10],     speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'load' },
  folding:           { durationRange: [10, 20],    speedMultiplier: 0,    playerInterruptible: true,  npcChatEligible: true,  animation: 'fold' },
  checking_out:      { durationRange: [8, 15],     speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'idle' },
  leaving:           { durationRange: [0, 0],      speedMultiplier: 1.1,  playerInterruptible: false, npcChatEligible: false, animation: 'walk' },
  despawning:        { durationRange: [1, 1.5],    speedMultiplier: 0,    playerInterruptible: false, npcChatEligible: false, animation: 'fadeout' },
};


// ═══════════════════════════════════════════════════════════════
// §3 — GOAL SYSTEM
// ═══════════════════════════════════════════════════════════════

export type GoalType =
  | 'rent_movie'
  | 'grab_pizza'
  | 'do_laundry'
  | 'browse_then_pizza'
  | 'just_browsing'
  | 'pizza_then_movie'
  | 'quick_return';

/** A single step in a goal's plan. */
export interface GoalStep {
  /** Target waypoint ID (or a waypoint type + zone to resolve dynamically) */
  target: string | { type: WaypointType; zone: Zone };
  /** What state to enter upon arriving at the target */
  arrivalState: NPCState;
  /** Override duration range for this step (otherwise use state default) */
  durationOverride?: [number, number];
  /** Optional: pick a random waypoint of this type in the zone instead of the literal ID */
  pickRandom?: boolean;
}

export interface GoalDefinition {
  type: GoalType;
  /** Relative probability weight for random goal selection */
  weight: number;
  /** Human-readable label */
  label: string;
  /** Ordered sequence of steps. NPC walks to each target, enters arrivalState, waits, then moves to next. */
  steps: GoalStep[];
}

export const GOAL_DEFINITIONS: Record<GoalType, GoalDefinition> = {
  rent_movie: {
    type: 'rent_movie',
    weight: 30,
    label: 'Rent a movie',
    steps: [
      { target: 'door-video-int', arrivalState: 'walking' },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true, durationOverride: [3, 8] },
      { target: 'vs-counter', arrivalState: 'checking_out' },
      { target: 'door-video-ext', arrivalState: 'walking' },
    ],
  },

  grab_pizza: {
    type: 'grab_pizza',
    weight: 20,
    label: 'Grab a slice',
    steps: [
      { target: 'door-pizza-int', arrivalState: 'walking' },
      { target: 'pp-counter', arrivalState: 'ordering' },
      { target: { type: 'booth', zone: 'pizza_palace' }, arrivalState: 'eating', pickRandom: true },
      { target: 'door-pizza-ext', arrivalState: 'walking' },
    ],
  },

  do_laundry: {
    type: 'do_laundry',
    weight: 15,
    label: 'Do laundry',
    steps: [
      { target: 'door-laundro-int', arrivalState: 'walking' },
      { target: { type: 'machine', zone: 'laundromat' }, arrivalState: 'loading_machine', pickRandom: true, durationOverride: [5, 10] },
      // Wait for wash cycle
      { target: { type: 'seat', zone: 'laundromat' }, arrivalState: 'waiting', pickRandom: true, durationOverride: [45, 90] },
      // Move to dryer
      { target: 'lm-dryer-1', arrivalState: 'loading_machine', durationOverride: [5, 8] },
      // Wait for dry cycle
      { target: { type: 'seat', zone: 'laundromat' }, arrivalState: 'waiting', pickRandom: true, durationOverride: [40, 80] },
      // Fold
      { target: 'lm-folding-table', arrivalState: 'folding' },
      { target: 'door-laundro-ext', arrivalState: 'walking' },
    ],
  },

  browse_then_pizza: {
    type: 'browse_then_pizza',
    weight: 10,
    label: 'Browse movies, then pizza',
    steps: [
      { target: 'door-video-int', arrivalState: 'walking' },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: 'vs-new-releases', arrivalState: 'browsing', durationOverride: [5, 12] },
      { target: 'vs-counter', arrivalState: 'checking_out' },
      { target: 'door-video-ext', arrivalState: 'walking' },
      // Cross to pizza palace
      { target: 'sidewalk-pizza', arrivalState: 'walking' },
      { target: 'door-pizza-int', arrivalState: 'walking' },
      { target: 'pp-counter', arrivalState: 'ordering' },
      { target: { type: 'booth', zone: 'pizza_palace' }, arrivalState: 'eating', pickRandom: true, durationOverride: [40, 90] },
      { target: 'door-pizza-ext', arrivalState: 'walking' },
    ],
  },

  just_browsing: {
    type: 'just_browsing',
    weight: 15,
    label: 'Just browsing',
    steps: [
      { target: 'door-video-int', arrivalState: 'walking' },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: 'vs-new-releases', arrivalState: 'browsing', durationOverride: [8, 15] },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true, durationOverride: [3, 6] },
      // Leaves without buying
      { target: 'door-video-ext', arrivalState: 'walking' },
    ],
  },

  pizza_then_movie: {
    type: 'pizza_then_movie',
    weight: 5,
    label: 'Pizza first, then rent a movie',
    steps: [
      { target: 'door-pizza-int', arrivalState: 'walking' },
      { target: 'pp-counter', arrivalState: 'ordering' },
      { target: { type: 'booth', zone: 'pizza_palace' }, arrivalState: 'eating', pickRandom: true, durationOverride: [30, 60] },
      { target: 'door-pizza-ext', arrivalState: 'walking' },
      { target: 'sidewalk-video-center', arrivalState: 'walking' },
      { target: 'door-video-int', arrivalState: 'walking' },
      { target: { type: 'shelf', zone: 'video_store' }, arrivalState: 'browsing', pickRandom: true },
      { target: 'vs-counter', arrivalState: 'checking_out' },
      { target: 'door-video-ext', arrivalState: 'walking' },
    ],
  },

  quick_return: {
    type: 'quick_return',
    weight: 5,
    label: 'Quick tape return',
    steps: [
      { target: 'door-video-int', arrivalState: 'walking' },
      { target: 'vs-counter', arrivalState: 'checking_out', durationOverride: [3, 5] },
      { target: 'door-video-ext', arrivalState: 'walking' },
    ],
  },
};

/** Weighted random goal selection. */
export function pickRandomGoal(): GoalType {
  const defs = Object.values(GOAL_DEFINITIONS);
  const totalWeight = defs.reduce((sum, d) => sum + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const def of defs) {
    roll -= def.weight;
    if (roll <= 0) return def.type;
  }
  return 'just_browsing';
}


// ═══════════════════════════════════════════════════════════════
// §4 — NPC IDENTITY & APPEARANCE
// ═══════════════════════════════════════════════════════════════

export type HairStyle = 'flattop' | 'long' | 'cap' | 'ponytail' | 'buzzcut' | 'mohawk' | 'afro' | 'bald';

export interface NPCAppearance {
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinTone: string;
  hairStyle: HairStyle;
  height: number;       // scale multiplier, 0.85–1.15
  hasAccessory: boolean; // sunglasses, bag, etc.
  accessoryType?: 'sunglasses' | 'bag' | 'hat' | 'headphones';
}

export interface NPCConfig {
  id: string;
  name: string;
  appearance: NPCAppearance;
  /** Personality type from npc-personalities.ts */
  personalityType: import('./npc-personalities').PersonalityType;
  /** Walk speed in units/second */
  walkSpeed: number;
  /** Chattiness: probability (0-1) of initiating NPC-to-NPC conversation */
  chattiness: number;
}

/** Pool of 24 NPC configurations with diverse appearances. */
export const NPC_CONFIG_POOL: NPCConfig[] = [
  { id: 'npc-01', name: 'Dave',      appearance: { shirtColor: '#3498db', pantsColor: '#2c3e50', hairColor: '#2a1a0a', skinTone: '#d4a574', hairStyle: 'flattop',  height: 1.0,  hasAccessory: false },                                personalityType: 'movie_buff', walkSpeed: 0.8, chattiness: 0.7 },
  { id: 'npc-02', name: 'Linda',     appearance: { shirtColor: '#e74c3c', pantsColor: '#1a1a2e', hairColor: '#4a3020', skinTone: '#c49a6c', hairStyle: 'ponytail', height: 0.92, hasAccessory: true, accessoryType: 'bag' },              personalityType: 'parent',     walkSpeed: 0.7, chattiness: 0.5 },
  { id: 'npc-03', name: 'Marcus',    appearance: { shirtColor: '#27ae60', pantsColor: '#34495e', hairColor: '#1a1a1a', skinTone: '#8d5524', hairStyle: 'buzzcut',  height: 1.08, hasAccessory: false },                                   personalityType: 'regular',    walkSpeed: 0.85, chattiness: 0.6 },
  { id: 'npc-04', name: 'Becky',     appearance: { shirtColor: '#9b59b6', pantsColor: '#2d2d44', hairColor: '#8b6914', skinTone: '#e8c4a0', hairStyle: 'long',     height: 0.95, hasAccessory: false },                                   personalityType: 'teenager',   walkSpeed: 0.9, chattiness: 0.8 },
  { id: 'npc-05', name: 'Frank',     appearance: { shirtColor: '#e67e22', pantsColor: '#1a2a1a', hairColor: '#3a1a0a', skinTone: '#c49a6c', hairStyle: 'cap',      height: 1.05, hasAccessory: true, accessoryType: 'sunglasses' },        personalityType: 'critic',     walkSpeed: 0.75, chattiness: 0.3 },
  { id: 'npc-06', name: 'Keiko',     appearance: { shirtColor: '#1abc9c', pantsColor: '#2c2c3e', hairColor: '#0a0a0a', skinTone: '#f1c27d', hairStyle: 'ponytail', height: 0.9,  hasAccessory: false },                                   personalityType: 'newbie',     walkSpeed: 0.7, chattiness: 0.4 },
  { id: 'npc-07', name: 'Ray',       appearance: { shirtColor: '#c0392b', pantsColor: '#3a3a4e', hairColor: '#6a4a2a', skinTone: '#d4a574', hairStyle: 'flattop',  height: 1.1,  hasAccessory: false },                                   personalityType: 'couple',     walkSpeed: 0.8, chattiness: 0.9 },
  { id: 'npc-08', name: 'Priya',     appearance: { shirtColor: '#8e44ad', pantsColor: '#1a1a30', hairColor: '#0a0a0a', skinTone: '#c68642', hairStyle: 'long',     height: 0.93, hasAccessory: true, accessoryType: 'bag' },              personalityType: 'movie_buff', walkSpeed: 0.8, chattiness: 0.6 },
  { id: 'npc-09', name: 'Tommy',     appearance: { shirtColor: '#2980b9', pantsColor: '#4a4a5e', hairColor: '#4a2a0a', skinTone: '#e8c4a0', hairStyle: 'mohawk',   height: 0.88, hasAccessory: false },                                   personalityType: 'teenager',   walkSpeed: 0.95, chattiness: 0.8 },
  { id: 'npc-10', name: 'Gloria',    appearance: { shirtColor: '#d35400', pantsColor: '#2a2a3e', hairColor: '#2a1a0a', skinTone: '#d4a574', hairStyle: 'afro',     height: 0.97, hasAccessory: false },                                   personalityType: 'regular',    walkSpeed: 0.8, chattiness: 0.5 },
  { id: 'npc-11', name: 'Steve',     appearance: { shirtColor: '#16a085', pantsColor: '#3a3a4a', hairColor: '#3a3a3a', skinTone: '#c49a6c', hairStyle: 'bald',     height: 1.12, hasAccessory: true, accessoryType: 'sunglasses' },        personalityType: 'critic',     walkSpeed: 0.75, chattiness: 0.2 },
  { id: 'npc-12', name: 'Amy',       appearance: { shirtColor: '#f39c12', pantsColor: '#1a1a28', hairColor: '#8b4513', skinTone: '#e8c4a0', hairStyle: 'ponytail', height: 0.94, hasAccessory: false },                                   personalityType: 'parent',     walkSpeed: 0.7, chattiness: 0.6 },
  { id: 'npc-13', name: 'Jerome',    appearance: { shirtColor: '#2ecc71', pantsColor: '#2c3e50', hairColor: '#0a0a0a', skinTone: '#6f4e37', hairStyle: 'flattop',  height: 1.07, hasAccessory: false },                                   personalityType: 'movie_buff', walkSpeed: 0.85, chattiness: 0.7 },
  { id: 'npc-14', name: 'Diane',     appearance: { shirtColor: '#e91e63', pantsColor: '#37474f', hairColor: '#d4a060', skinTone: '#f1c27d', hairStyle: 'long',     height: 0.96, hasAccessory: true, accessoryType: 'headphones' },        personalityType: 'teenager',   walkSpeed: 0.9, chattiness: 0.4 },
  { id: 'npc-15', name: 'Carl',      appearance: { shirtColor: '#607d8b', pantsColor: '#263238', hairColor: '#808080', skinTone: '#d4a574', hairStyle: 'buzzcut',  height: 1.02, hasAccessory: false },                                   personalityType: 'regular',    walkSpeed: 0.8, chattiness: 0.5 },
  { id: 'npc-16', name: 'Rosa',      appearance: { shirtColor: '#ff5722', pantsColor: '#3e2723', hairColor: '#1a0a0a', skinTone: '#c68642', hairStyle: 'ponytail', height: 0.91, hasAccessory: true, accessoryType: 'bag' },              personalityType: 'newbie',     walkSpeed: 0.7, chattiness: 0.3 },
  { id: 'npc-17', name: 'Hank',      appearance: { shirtColor: '#795548', pantsColor: '#455a64', hairColor: '#4a3020', skinTone: '#e8c4a0', hairStyle: 'cap',      height: 1.15, hasAccessory: false },                                   personalityType: 'couple',     walkSpeed: 0.8, chattiness: 0.8 },
  { id: 'npc-18', name: 'Yuki',      appearance: { shirtColor: '#009688', pantsColor: '#1a237e', hairColor: '#0a0a0a', skinTone: '#f1c27d', hairStyle: 'long',     height: 0.89, hasAccessory: false },                                   personalityType: 'movie_buff', walkSpeed: 0.8, chattiness: 0.6 },
  { id: 'npc-19', name: 'Bobby',     appearance: { shirtColor: '#ff9800', pantsColor: '#33691e', hairColor: '#6a3a0a', skinTone: '#c49a6c', hairStyle: 'mohawk',   height: 0.87, hasAccessory: false },                                   personalityType: 'teenager',   walkSpeed: 0.95, chattiness: 0.9 },
  { id: 'npc-20', name: 'Margaret',  appearance: { shirtColor: '#673ab7', pantsColor: '#424242', hairColor: '#a0a0a0', skinTone: '#d4a574', hairStyle: 'long',     height: 0.93, hasAccessory: true, accessoryType: 'bag' },              personalityType: 'critic',     walkSpeed: 0.65, chattiness: 0.4 },
  { id: 'npc-21', name: 'Darnell',   appearance: { shirtColor: '#4caf50', pantsColor: '#212121', hairColor: '#0a0a0a', skinTone: '#6f4e37', hairStyle: 'afro',     height: 1.09, hasAccessory: true, accessoryType: 'headphones' },        personalityType: 'regular',    walkSpeed: 0.85, chattiness: 0.5 },
  { id: 'npc-22', name: 'Nancy',     appearance: { shirtColor: '#f44336', pantsColor: '#1b5e20', hairColor: '#8b4513', skinTone: '#e8c4a0', hairStyle: 'ponytail', height: 0.95, hasAccessory: false },                                   personalityType: 'parent',     walkSpeed: 0.75, chattiness: 0.6 },
  { id: 'npc-23', name: 'Miguel',    appearance: { shirtColor: '#00bcd4', pantsColor: '#bf360c', hairColor: '#1a1a0a', skinTone: '#c68642', hairStyle: 'buzzcut',  height: 1.04, hasAccessory: false },                                   personalityType: 'newbie',     walkSpeed: 0.8, chattiness: 0.3 },
  { id: 'npc-24', name: 'Tiffany',   appearance: { shirtColor: '#e040fb', pantsColor: '#311b92', hairColor: '#d4a060', skinTone: '#f1c27d', hairStyle: 'long',     height: 0.9,  hasAccessory: true, accessoryType: 'sunglasses' },        personalityType: 'couple',     walkSpeed: 0.85, chattiness: 0.7 },
];


// ═══════════════════════════════════════════════════════════════
// §5 — NPC RUNTIME INSTANCE
// ═══════════════════════════════════════════════════════════════

export interface ActiveNPC {
  config: NPCConfig;
  /** Current world position */
  position: [number, number, number];
  /** Current facing angle (radians, 0 = +z) */
  facing: number;
  /** Current opacity (for spawn/despawn fade) */
  opacity: number;

  // ── State machine ──
  state: NPCState;
  /** Time remaining in current state (seconds). 0 = indefinite / movement-driven. */
  stateTimer: number;
  /** Previous state for transition validation */
  prevState: NPCState;

  // ── Goal tracking ──
  goal: GoalType;
  goalStepIndex: number;
  /** Resolved waypoint path for current step */
  currentPath: string[];
  /** Index into currentPath */
  pathIndex: number;

  // ── Conversation ──
  conversationPartnerId: string | null;

  // ── Lifecycle ──
  /** Which parking/street waypoint this NPC entered from */
  spawnWaypointId: string;
  /** Seconds since this NPC was spawned */
  lifetime: number;
  /** Set to true when goal is complete and NPC should leave */
  goalComplete: boolean;
}


// ═══════════════════════════════════════════════════════════════
// §6 — NPC-TO-NPC CONVERSATION SYSTEM
// ═══════════════════════════════════════════════════════════════

export interface NPCConversation {
  id: string;
  participantIds: [string, string];
  /** Which waypoint they're talking near */
  waypointId: string;
  /** Total duration of this conversation */
  duration: number;
  /** Time elapsed */
  elapsed: number;
  /** Current dialogue line index */
  dialogueIndex: number;
}

export interface ConversationTopic {
  id: string;
  label: string;
  /** Lines alternate between speaker A and speaker B */
  lines: string[];
  /** Minimum duration in seconds */
  minDuration: number;
}

/** Pre-authored ambient conversation snippets. */
export const CONVERSATION_TOPICS: ConversationTopic[] = [
  {
    id: 'movie-rec',
    label: 'Movie recommendation',
    lines: [
      "Have you seen the new one on the wall back there?",
      "Not yet. Is it any good?",
      "My neighbor said it was incredible. I'm grabbing it tonight.",
      "Alright, you convinced me. I'll check it out.",
    ],
    minDuration: 8,
  },
  {
    id: 'weekend-plans',
    label: 'Weekend plans',
    lines: [
      "Got any plans this weekend?",
      "Just a movie night. The usual Friday routine.",
      "Same here. There's nothing better than a rented movie and some pizza.",
      "You should try the Palace next door. Their pepperoni is unreal.",
    ],
    minDuration: 10,
  },
  {
    id: 'late-fees',
    label: 'Late fees complaint',
    lines: [
      "I got hit with a late fee again. Three bucks!",
      "Ouch. I always rewind and return on time. It's a point of pride.",
      "Must be nice. I always forget until Tuesday.",
      "Set an alarm or something! That's pizza money you're wasting.",
    ],
    minDuration: 10,
  },
  {
    id: 'genre-debate',
    label: 'Genre debate',
    lines: [
      "Horror is the best genre, and I will die on that hill.",
      "You're out of your mind. Comedy all the way.",
      "Comedy doesn't keep you up at night thinking about it.",
      "That's... that's the point. I WANT to sleep.",
    ],
    minDuration: 10,
  },
  {
    id: 'laundry-chat',
    label: 'Laundromat small talk',
    lines: [
      "How long has your load been in?",
      "About twenty minutes. I think it's almost done.",
      "These machines take forever, don't they?",
      "At least the vending machine works. Last week it ate my quarters.",
    ],
    minDuration: 10,
  },
  {
    id: 'pizza-review',
    label: 'Pizza opinions',
    lines: [
      "This pepperoni is so good. I come here every Friday.",
      "Really? I usually just get plain cheese.",
      "You're missing out. The sauce on the pepperoni is different, I swear.",
      "Alright, I'll try it next time. You better be right.",
    ],
    minDuration: 10,
  },
  {
    id: 'vhs-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "I love the sound a tape makes when you push it in.",
      "The click? Yeah, that's the best part.",
      "My kid doesn't understand. He just wants to press buttons on the remote.",
      "Kids these days... they'll never know the joy of rewinding.",
    ],
    minDuration: 10,
  },
  {
    id: 'store-regular',
    label: 'Being a regular',
    lines: [
      "Vinny already knows what I'm here for.",
      "He's got a memory like a steel trap. Remembers everyone's picks.",
      "That's what I love about this place. It's personal.",
      "Try telling that to the big chain stores.",
    ],
    minDuration: 10,
  },
];


// ═══════════════════════════════════════════════════════════════
// §7 — NPC LIFECYCLE MANAGER
// ═══════════════════════════════════════════════════════════════

export interface NPCManagerConfig {
  /** Max simultaneous NPCs on desktop */
  maxNPCsDesktop: number;
  /** Max simultaneous NPCs on mobile */
  maxNPCsMobile: number;
  /** Seconds between spawn attempts */
  spawnIntervalRange: [number, number];
  /** Max simultaneous NPC-to-NPC conversations */
  maxConversations: number;
  /** Proximity threshold (world units) to trigger conversation check */
  conversationProximity: number;
  /** Probability (0-1) that proximity triggers a conversation */
  conversationChance: number;
}

export const DEFAULT_MANAGER_CONFIG: NPCManagerConfig = {
  maxNPCsDesktop: 10,
  maxNPCsMobile: 5,
  spawnIntervalRange: [30, 60],
  maxConversations: 2,
  conversationProximity: 2.0,
  conversationChance: 0.15,
};

export interface NPCManagerState {
  activeNPCs: Map<string, ActiveNPC>;
  activeConversations: Map<string, NPCConversation>;
  /** Pool indices that are currently in use */
  usedConfigIndices: Set<number>;
  /** Time until next spawn attempt */
  spawnTimer: number;
  /** Running conversation ID counter */
  nextConversationId: number;
}

export function createInitialManagerState(): NPCManagerState {
  return {
    activeNPCs: new Map(),
    activeConversations: new Map(),
    usedConfigIndices: new Set(),
    spawnTimer: 5, // first NPC spawns after 5 seconds
    nextConversationId: 0,
  };
}

// ── Spawn logic ──────────────────────────────────────────────

const SPAWN_WAYPOINTS = ['street-left', 'street-center', 'street-right', 'parking-far-left', 'parking-center', 'parking-far-right'];

export function pickSpawnWaypoint(): string {
  return SPAWN_WAYPOINTS[Math.floor(Math.random() * SPAWN_WAYPOINTS.length)];
}

export function pickUnusedConfig(state: NPCManagerState): NPCConfig | null {
  const available: number[] = [];
  for (let i = 0; i < NPC_CONFIG_POOL.length; i++) {
    if (!state.usedConfigIndices.has(i)) available.push(i);
  }
  if (available.length === 0) return null;
  const idx = available[Math.floor(Math.random() * available.length)];
  state.usedConfigIndices.add(idx);
  return NPC_CONFIG_POOL[idx];
}

/** Resolve a GoalStep target to a concrete waypoint ID. */
export function resolveStepTarget(step: GoalStep, currentWaypointId: string): string {
  if (typeof step.target === 'string') return step.target;

  // Find all waypoints matching type + zone
  const t = step.target as { type: WaypointType; zone: Zone };
  const candidates = Object.values(WAYPOINTS).filter(
    wp => wp.type === t.type && wp.zone === t.zone
  );

  if (candidates.length === 0) return currentWaypointId;

  if (step.pickRandom) {
    return candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  // Pick nearest
  const current = WAYPOINTS[currentWaypointId];
  if (!current) return candidates[0].id;

  let bestId = candidates[0].id;
  let bestDist = Infinity;
  for (const c of candidates) {
    const dx = c.position[0] - current.position[0];
    const dz = c.position[2] - current.position[2];
    const d = dx * dx + dz * dz;
    if (d < bestDist) { bestDist = d; bestId = c.id; }
  }
  return bestId;
}

/** Create a new ActiveNPC and add it to the manager state. */
export function spawnNPC(state: NPCManagerState): ActiveNPC | null {
  const config = pickUnusedConfig(state);
  if (!config) return null;

  const spawnWpId = pickSpawnWaypoint();
  const spawnWp = WAYPOINTS[spawnWpId];
  if (!spawnWp) return null;

  const goal = pickRandomGoal();
  const goalDef = GOAL_DEFINITIONS[goal];

  const npc: ActiveNPC = {
    config,
    position: [...spawnWp.position],
    facing: 0,
    opacity: 0,
    state: 'spawning',
    stateTimer: 1.0 + Math.random() * 0.5,
    prevState: 'spawning',
    goal,
    goalStepIndex: 0,
    currentPath: [],
    pathIndex: 0,
    conversationPartnerId: null,
    spawnWaypointId: spawnWpId,
    lifetime: 0,
    goalComplete: false,
  };

  state.activeNPCs.set(config.id, npc);
  return npc;
}


// ═══════════════════════════════════════════════════════════════
// §8 — TICK UPDATE (called every frame from useFrame)
// ═══════════════════════════════════════════════════════════════

/**
 * Main update function. Call once per frame with delta time.
 * Mutates `state` in place for performance (no allocations per frame).
 */
export function tickNPCManager(
  state: NPCManagerState,
  dt: number,
  config: NPCManagerConfig,
  isMobile: boolean
): void {
  const maxNPCs = isMobile ? config.maxNPCsMobile : config.maxNPCsDesktop;

  // ── Spawn timer ──
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.activeNPCs.size < maxNPCs) {
    spawnNPC(state);
    state.spawnTimer = config.spawnIntervalRange[0] + Math.random() * (config.spawnIntervalRange[1] - config.spawnIntervalRange[0]);
  }

  // ── Update each NPC ──
  const toRemove: string[] = [];

  for (const [id, npc] of Array.from(state.activeNPCs.entries())) {
    npc.lifetime += dt;

    switch (npc.state) {
      case 'spawning':
        npc.opacity = Math.min(1, npc.opacity + dt / 1.0);
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          transitionState(npc, 'entering');
          advanceGoalStep(npc, state);
        }
        break;

      case 'entering':
      case 'walking':
      case 'leaving':
        tickMovement(npc, dt);
        break;

      case 'browsing':
      case 'ordering':
      case 'eating':
      case 'waiting':
      case 'loading_machine':
      case 'folding':
      case 'checking_out':
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          // Advance to next goal step
          npc.goalStepIndex++;
          if (npc.goalStepIndex >= GOAL_DEFINITIONS[npc.goal].steps.length) {
            npc.goalComplete = true;
            beginLeaving(npc, state);
          } else {
            advanceGoalStep(npc, state);
          }
        }
        break;

      case 'talking_to_npc':
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          npc.conversationPartnerId = null;
          // Resume goal
          transitionState(npc, 'walking');
          advanceGoalStep(npc, state);
        }
        break;

      case 'talking_to_player':
        // Duration controlled externally by dialogue system
        break;

      case 'despawning':
        npc.opacity = Math.max(0, npc.opacity - dt / 1.0);
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          toRemove.push(id);
        }
        break;
    }
  }

  // ── Remove despawned NPCs ──
  for (const id of toRemove) {
    const npc = state.activeNPCs.get(id);
    if (npc) {
      const poolIdx = NPC_CONFIG_POOL.findIndex(c => c.id === npc.config.id);
      if (poolIdx >= 0) state.usedConfigIndices.delete(poolIdx);
    }
    state.activeNPCs.delete(id);
  }

  // ── Conversation cleanup ──
  const convToRemove: string[] = [];
  for (const [convId, conv] of Array.from(state.activeConversations.entries())) {
    conv.elapsed += dt;
    if (conv.elapsed >= conv.duration) {
      convToRemove.push(convId);
      // Free participants
      for (const pid of conv.participantIds) {
        const npc = state.activeNPCs.get(pid);
        if (npc && npc.state === 'talking_to_npc') {
          npc.stateTimer = 0; // will trigger transition on next tick
        }
      }
    }
  }
  for (const cid of convToRemove) {
    state.activeConversations.delete(cid);
  }

  // ── Proximity conversation checks ──
  if (state.activeConversations.size < config.maxConversations) {
    checkProximityConversations(state, config);
  }
}

function tickMovement(npc: ActiveNPC, dt: number): void {
  if (npc.currentPath.length === 0 || npc.pathIndex >= npc.currentPath.length) {
    // Arrived at destination — handle arrival
    handleArrival(npc);
    return;
  }

  const targetWpId = npc.currentPath[npc.pathIndex];
  const targetWp = WAYPOINTS[targetWpId];
  if (!targetWp) { npc.pathIndex++; return; }

  const tx = targetWp.position[0];
  const tz = targetWp.position[2];
  const dx = tx - npc.position[0];
  const dz = tz - npc.position[2];
  const dist = Math.sqrt(dx * dx + dz * dz);

  const speed = npc.config.walkSpeed * (STATE_CONFIGS[npc.state]?.speedMultiplier ?? 1.0);

  if (dist < 0.3) {
    // Reached this waypoint, advance to next in path
    npc.position[0] = tx;
    npc.position[2] = tz;
    npc.pathIndex++;
  } else {
    // Move toward waypoint
    const step = speed * dt;
    const nx = dx / dist;
    const nz = dz / dist;
    npc.position[0] += nx * Math.min(step, dist);
    npc.position[2] += nz * Math.min(step, dist);
    // Face movement direction
    npc.facing = Math.atan2(nx, nz) + Math.PI;
  }
}

function handleArrival(npc: ActiveNPC): void {
  const goalDef = GOAL_DEFINITIONS[npc.goal];
  if (!goalDef) return;

  if (npc.goalStepIndex >= goalDef.steps.length) {
    // All steps done
    if (npc.state === 'leaving') {
      transitionState(npc, 'despawning');
      npc.stateTimer = 1.0 + Math.random() * 0.5;
    }
    return;
  }

  const step = goalDef.steps[npc.goalStepIndex];
  const stateConfig = STATE_CONFIGS[step.arrivalState];

  if (step.arrivalState === 'walking') {
    // Walking is a transit state — immediately advance to next step
    npc.goalStepIndex++;
    if (npc.goalStepIndex >= goalDef.steps.length) {
      npc.goalComplete = true;
      // Will be caught on next tick
    } else {
      advanceGoalStep(npc, { activeNPCs: new Map(), activeConversations: new Map(), usedConfigIndices: new Set(), spawnTimer: 0, nextConversationId: 0 } as NPCManagerState);
    }
    return;
  }

  // Enter the arrival state with appropriate duration
  transitionState(npc, step.arrivalState);
  const range = step.durationOverride ?? stateConfig.durationRange;
  npc.stateTimer = range[0] + Math.random() * (range[1] - range[0]);

  // Apply facing angle if waypoint specifies one
  const lastWpId = npc.currentPath[npc.currentPath.length - 1];
  const lastWp = lastWpId ? WAYPOINTS[lastWpId] : null;
  if (lastWp?.facingAngle !== undefined) {
    npc.facing = lastWp.facingAngle;
  }
}

function transitionState(npc: ActiveNPC, newState: NPCState): void {
  npc.prevState = npc.state;
  npc.state = newState;
}

function advanceGoalStep(npc: ActiveNPC, state: NPCManagerState): void {
  const goalDef = GOAL_DEFINITIONS[npc.goal];
  if (!goalDef || npc.goalStepIndex >= goalDef.steps.length) return;

  const step = goalDef.steps[npc.goalStepIndex];

  // Figure out where the NPC currently is (nearest waypoint)
  const currentWpId = findNearestWaypointToPosition(npc.position);
  const targetWpId = resolveStepTarget(step, currentWpId);

  // Compute path
  npc.currentPath = findPath(currentWpId, targetWpId);
  npc.pathIndex = 0;
  transitionState(npc, 'walking');
}

function beginLeaving(npc: ActiveNPC, state: NPCManagerState): void {
  const currentWpId = findNearestWaypointToPosition(npc.position);
  // Walk back to spawn waypoint
  npc.currentPath = findPath(currentWpId, npc.spawnWaypointId);
  npc.pathIndex = 0;
  transitionState(npc, 'leaving');
}

/** Find the nearest waypoint ID to a world position. */
function findNearestWaypointToPosition(pos: [number, number, number]): string {
  let bestId = 'street-center';
  let bestDist = Infinity;
  for (const wp of Object.values(WAYPOINTS)) {
    const dx = wp.position[0] - pos[0];
    const dz = wp.position[2] - pos[2];
    const d = dx * dx + dz * dz;
    if (d < bestDist) { bestDist = d; bestId = wp.id; }
  }
  return bestId;
}


// ═══════════════════════════════════════════════════════════════
// §9 — PROXIMITY CONVERSATION TRIGGER
// ═══════════════════════════════════════════════════════════════

function checkProximityConversations(
  state: NPCManagerState,
  config: NPCManagerConfig
): void {
  const eligible: ActiveNPC[] = [];

  for (const npc of Array.from(state.activeNPCs.values())) {
    const sc = STATE_CONFIGS[npc.state];
    if (!sc.npcChatEligible) continue;
    if (npc.conversationPartnerId) continue;
    eligible.push(npc);
  }

  // Check all pairs
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      if (state.activeConversations.size >= config.maxConversations) return;

      const a = eligible[i];
      const b = eligible[j];

      const dx = a.position[0] - b.position[0];
      const dz = a.position[2] - b.position[2];
      const distSq = dx * dx + dz * dz;

      if (distSq > config.conversationProximity * config.conversationProximity) continue;

      // Must be in same zone
      const aWp = findNearestWaypointToPosition(a.position);
      const bWp = findNearestWaypointToPosition(b.position);
      if (WAYPOINTS[aWp]?.zone !== WAYPOINTS[bWp]?.zone) continue;

      // Probability check (boosted by chattiness)
      const chance = config.conversationChance * (a.config.chattiness + b.config.chattiness) / 2;
      if (Math.random() > chance) continue;

      // Start conversation
      const convId = `conv-${state.nextConversationId++}`;
      const topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];

      const conv: NPCConversation = {
        id: convId,
        participantIds: [a.config.id, b.config.id],
        waypointId: aWp,
        duration: topic.minDuration + Math.random() * 10,
        elapsed: 0,
        dialogueIndex: 0,
      };

      state.activeConversations.set(convId, conv);

      // Put both NPCs in talking state
      a.conversationPartnerId = b.config.id;
      b.conversationPartnerId = a.config.id;
      transitionState(a, 'talking_to_npc');
      transitionState(b, 'talking_to_npc');
      a.stateTimer = conv.duration;
      b.stateTimer = conv.duration;

      // Face each other
      a.facing = Math.atan2(b.position[0] - a.position[0], b.position[2] - a.position[2]);
      b.facing = Math.atan2(a.position[0] - b.position[0], a.position[2] - b.position[2]);
    }
  }
}


// ═══════════════════════════════════════════════════════════════
// §10 — PLAYER INTERACTION HELPERS
// ═══════════════════════════════════════════════════════════════

/** Interrupt an NPC with player dialogue. Returns false if NPC is not interruptible. */
export function startPlayerDialogue(npc: ActiveNPC): boolean {
  const stateConfig = STATE_CONFIGS[npc.state];
  if (!stateConfig.playerInterruptible) return false;

  // If in NPC conversation, break it
  if (npc.conversationPartnerId) {
    npc.conversationPartnerId = null;
  }

  transitionState(npc, 'talking_to_player');
  npc.stateTimer = 0; // player controls duration
  return true;
}

/** End player dialogue and resume NPC's goal. */
export function endPlayerDialogue(npc: ActiveNPC, state: NPCManagerState): void {
  if (npc.state !== 'talking_to_player') return;

  // Resume from where they left off
  const goalDef = GOAL_DEFINITIONS[npc.goal];
  if (npc.goalStepIndex < goalDef.steps.length) {
    advanceGoalStep(npc, state);
  } else {
    beginLeaving(npc, state);
  }
}

/** Get all NPCs within a given distance of a world position. Useful for interaction prompts. */
export function getNPCsNearPosition(
  state: NPCManagerState,
  worldPos: [number, number, number],
  radius: number
): ActiveNPC[] {
  const result: ActiveNPC[] = [];
  const r2 = radius * radius;

  for (const npc of Array.from(state.activeNPCs.values())) {
    const dx = npc.position[0] - worldPos[0];
    const dz = npc.position[2] - worldPos[2];
    if (dx * dx + dz * dz <= r2) {
      result.push(npc);
    }
  }

  return result;
}


// ═══════════════════════════════════════════════════════════════
// §11 — DEBUG / VISUALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════

/** Get a summary of all active NPCs for debug overlay. */
export function getDebugSummary(state: NPCManagerState): {
  npcCount: number;
  conversationCount: number;
  npcs: { id: string; name: string; state: NPCState; goal: GoalType; step: number; zone: Zone | 'unknown' }[];
} {
  const npcs = [];
  for (const npc of Array.from(state.activeNPCs.values())) {
    const nearestWp = findNearestWaypointToPosition(npc.position);
    const zone = WAYPOINTS[nearestWp]?.zone ?? 'unknown';
    npcs.push({
      id: npc.config.id,
      name: npc.config.name,
      state: npc.state,
      goal: npc.goal,
      step: npc.goalStepIndex,
      zone,
    });
  }
  return {
    npcCount: state.activeNPCs.size,
    conversationCount: state.activeConversations.size,
    npcs,
  };
}
