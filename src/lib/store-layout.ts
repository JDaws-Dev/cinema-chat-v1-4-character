/**
 * store-layout.ts — Single source of truth for all positioned objects in the 3D store.
 *
 * Categories:
 *   shelf    — gondola shelves and wall shelves
 *   counter  — checkout counter
 *   npc      — Vinny, Charlie, Kid, Tarantino, customers
 *   prop     — cooler, trophy shelf, bargain bin, detail items, etc.
 *   wall     — posters, signs, TV, bulletin board
 *   door     — entrance, employees only
 *   exterior — Pizza Palace, Laundromat, cars, lamps, etc.
 */

// ── Types ────────────────────────────────────────────────

export type ObjCategory = "shelf" | "counter" | "npc" | "prop" | "wall" | "door" | "exterior";

export interface LayoutObject {
  id: string;
  label: string;
  category: ObjCategory;
  x: number;
  y: number; // height (usually 0 for floor objects)
  z: number;
  rotY?: number; // Y rotation in radians
  w?: number;    // width for editor display
  d?: number;    // depth for editor display
  meta?: Record<string, unknown>; // genre, color, backGenre, etc.
}

export interface StoreLayout {
  version: number;
  objects: LayoutObject[];
}

// ── Layout Data ──────────────────────────────────────────

export const STORE_LAYOUT: StoreLayout = {
  version: 1,
  objects: [
    // ═══════════════════════════════════════════════════════
    // SHELVES — Gondola shelf units (from SHELF_ROWS)
    // ═══════════════════════════════════════════════════════
    { id: "shelf-row1-horror",   label: "HORROR / CULT",      category: "shelf", x: -5,  y: 0, z: -4, rotY: 0.25,  w: 3.2, d: 0.6, meta: { genre: "HORROR", color: "#dc2626", backGenre: "CULT", backColor: "#991b1b" } },
    { id: "shelf-row1-scifi",    label: "SCI-FI / FOREIGN",   category: "shelf", x: -1,  y: 0, z: -4, rotY: 0.25,  w: 3.2, d: 0.6, meta: { genre: "SCI-FI", color: "#3b82f6", backGenre: "FOREIGN", backColor: "#6366f1" } },
    { id: "shelf-row1-comedy",   label: "COMEDY / INDIE",     category: "shelf", x: 3,   y: 0, z: -4, rotY: 0.25,  w: 3.2, d: 0.6, meta: { genre: "COMEDY", color: "#f97316", backGenre: "INDIE", backColor: "#a855f7" } },
    { id: "shelf-row2-action",   label: "ACTION / THRILLER",  category: "shelf", x: -5,  y: 0, z: -1, rotY: -0.15, w: 3.2, d: 0.6, meta: { genre: "ACTION", color: "#ef4444", backGenre: "THRILLER", backColor: "#7c3aed" } },
    { id: "shelf-row2-classics", label: "CLASSICS / DOCS",    category: "shelf", x: 0,   y: 0, z: -1, rotY: -0.15, w: 3.2, d: 0.6, meta: { genre: "CLASSICS", color: "#ca8a04", backGenre: "DOCS", backColor: "#65a30d" } },
    { id: "shelf-row3-family",   label: "FAMILY / ANIMATED",  category: "shelf", x: -4,  y: 0, z: 2,  rotY: 0.2,   w: 3.2, d: 0.6, meta: { genre: "FAMILY", color: "#22c55e", backGenre: "ANIMATED", backColor: "#06b6d4" } },
    { id: "shelf-row3-western",  label: "WESTERN / ROMANCE",  category: "shelf", x: 1,   y: 0, z: 2,  rotY: 0.2,   w: 3.2, d: 0.6, meta: { genre: "WESTERN", color: "#92400e", backGenre: "ROMANCE", backColor: "#f43f5e" } },

    // Wall shelves (perimeter)
    { id: "wallshelf-back-drama",   label: "Wall: DRAMA",      category: "shelf", x: -5,   y: 0, z: -6.85, w: 6, d: 0.3, meta: { genre: "DRAMA", color: "#6366f1", rotation: [0, 0, 0], width: 6 } },
    { id: "wallshelf-left-foreign", label: "Wall: FOREIGN",    category: "shelf", x: -9.85, y: 0, z: -3,   w: 0.3, d: 4, meta: { genre: "FOREIGN", color: "#6366f1", rotation: [0, Math.PI / 2, 0], width: 4 } },
    { id: "wallshelf-left-docs",    label: "Wall: DOCS",       category: "shelf", x: -9.85, y: 0, z: 1,    w: 0.3, d: 4, meta: { genre: "DOCS", color: "#65a30d", rotation: [0, Math.PI / 2, 0], width: 4 } },
    { id: "wallshelf-right-new",    label: "Wall: NEW RELEASES", category: "shelf", x: 9.85,  y: 0, z: -2, w: 0.3, d: 8, meta: { genre: "NEW", color: "#ec4899", rotation: [0, -Math.PI / 2, 0], width: 8 } },

    // New Releases back wall display
    { id: "new-releases-wall", label: "NEW RELEASES (wall)", category: "shelf", x: 0, y: 0, z: -6.85, w: 19, d: 0.3, meta: { type: "new-releases-display" } },

    // Staff Picks wall shelf (right wall)
    { id: "staff-picks", label: "Staff Picks", category: "prop", x: 9.7, y: 1.2, z: -0.1, w: 0.4, d: 1.2, meta: { rotation: [0, -Math.PI / 2, 0] } },

    // ═══════════════════════════════════════════════════════
    // COUNTER
    // ═══════════════════════════════════════════════════════
    { id: "counter", label: "COUNTER", category: "counter", x: 7, y: 0, z: 5, w: 6, d: 1.2 },

    // ═══════════════════════════════════════════════════════
    // NPCs
    // ═══════════════════════════════════════════════════════
    { id: "vinny",    label: "Vinny",    category: "npc", x: 7,  y: 0, z: 5.8,  w: 0.6, d: 0.6, meta: { role: "clerk" } },
    { id: "charlie",  label: "Charlie",  category: "npc", x: -2, y: -0.05, z: 1.5, w: 0.6, d: 0.6, meta: { role: "regular" } },
    { id: "kid",      label: "Kid",      category: "npc", x: 0,  y: -0.05, z: 0.5, w: 0.4, d: 0.4, meta: { role: "kid" } },
    { id: "tarantino", label: "Tarantino", category: "npc", x: 0, y: -0.05, z: -2.5, w: 0.5, d: 0.5, meta: { role: "cameo" } },

    // ═══════════════════════════════════════════════════════
    // PROPS — Interior
    // ═══════════════════════════════════════════════════════
    { id: "cooler",           label: "Cooler",           category: "prop", x: 8.63,  y: 0,    z: 3.5,  w: 0.8, d: 0.6 },
    { id: "trophy-shelf",     label: "Trophy Shelf",     category: "prop", x: 9.7,   y: 0,    z: -4,   w: 0.6, d: 2.5, meta: { rotation: [0, -Math.PI / 2, 0] } },
    { id: "plant",            label: "Plant",            category: "prop", x: 9.5,   y: 0,    z: -6.5, w: 0.4, d: 0.4 },
    { id: "trash-can",        label: "Trash Can",        category: "prop", x: -1.5,  y: 0,    z: 6,    w: 0.35, d: 0.35 },
    { id: "recent-returns",   label: "Returns Pile",     category: "prop", x: -3.88, y: 1.08, z: 5.77, w: 1.6, d: 0.4 },
    { id: "membership-forms", label: "Forms",            category: "prop", x: 8,     y: 1.06, z: 4.8,  w: 0.3, d: 0.3 },
    { id: "return-bin",       label: "Return Bin",       category: "prop", x: 5,     y: 0,    z: 5,    w: 0.8, d: 0.6 },
    { id: "kids-corner",      label: "Kids Corner",      category: "prop", x: 8,     y: 0,    z: -5,   w: 3,   d: 2.5 },
    { id: "video-games",      label: "Video Games",      category: "prop", x: -8,    y: 0,    z: 4,    w: 2.5, d: 1.2 },
    { id: "bargain-bin",      label: "Bargain Bin (big)", category: "prop", x: -4,   y: 0,    z: 4,    w: 2.5, d: 1.2 },
    { id: "standee",          label: "Standee",          category: "prop", x: 3.2,   y: 0,    z: 5.2,  w: 0.6, d: 0.4, rotY: -0.3 },
    { id: "featured-standee", label: "Featured Display", category: "prop", x: 5.5,   y: 0,    z: 5.66, w: 0.6, d: 0.4, rotY: -0.02 },
    { id: "basket-holder",    label: "Basket Holder",    category: "prop", x: -3.5,  y: 0,    z: 5.8,  w: 0.7, d: 0.5 },
    { id: "bargain-crate",    label: "2-for-$1 Crate",   category: "prop", x: -1.5,  y: 0,    z: 4.5,  w: 0.9, d: 0.7 },
    { id: "step-stool",       label: "Step Stool",       category: "prop", x: -3.2,  y: 0,    z: -2.5, w: 0.35, d: 0.3 },
    { id: "umbrella-stand",   label: "Umbrella Stand",   category: "prop", x: 1.8,   y: 0,    z: 6.2,  w: 0.3, d: 0.3 },
    { id: "newspaper-stand",  label: "Newspaper Stand",  category: "prop", x: -2.5,  y: 0,    z: 6.0,  w: 0.4, d: 0.3 },
    { id: "vhs-rewinder",     label: "VHS Rewinder",     category: "prop", x: 9,     y: 1.08, z: 5,    w: 0.25, d: 0.18 },
    { id: "tape-stack",       label: "Tape Stack",       category: "prop", x: 7,     y: 1.08, z: 5.5,  w: 0.2, d: 0.12 },
    { id: "card-holder",      label: "Card Holder",      category: "prop", x: 5.8,   y: 0.88, z: 5.2,  w: 0.35, d: 0.2 },
    { id: "bell",             label: "Service Bell",     category: "prop", x: 5.2,   y: 0.90, z: 5.0,  w: 0.1, d: 0.1 },
    { id: "pen-chain",        label: "Pen on Chain",     category: "prop", x: 6.2,   y: 0.92, z: 5.2,  w: 0.16, d: 0.1 },
    { id: "tape-stack-floor", label: "Floor Tape Stack", category: "prop", x: 5.6,   y: 0,    z: 4.6,  w: 0.2, d: 0.12 },
    { id: "return-chute",     label: "Return Chute",     category: "prop", x: 9,     y: 0,    z: 5.5,  w: 0.9, d: 0.6 },

    // ═══════════════════════════════════════════════════════
    // WALL FEATURES — posters, signs, TV, boards
    // ═══════════════════════════════════════════════════════
    // Back wall posters
    { id: "poster-jaws",     label: "JAWS",             category: "wall", x: -7,    y: 1.8, z: -6.95, w: 0.8, d: 0.2 },
    { id: "poster-alien",    label: "ALIEN",            category: "wall", x: -9,    y: 1.8, z: -6.95, w: 0.8, d: 0.2 },
    { id: "poster-blade",    label: "BLADE RUNNER",     category: "wall", x: 7,     y: 1.8, z: -6.95, w: 0.8, d: 0.2 },
    { id: "poster-raiders",  label: "RAIDERS",          category: "wall", x: 9,     y: 1.8, z: -6.95, w: 0.8, d: 0.2 },
    // Side wall posters
    { id: "poster-shining",  label: "THE SHINING",      category: "wall", x: -9.9,  y: 2.0, z: -2.78, w: 0.2, d: 0.8, rotY: Math.PI / 2 },
    { id: "poster-starwars", label: "STAR WARS",        category: "wall", x: -9.96, y: 2.0, z: 1.32,  w: 0.2, d: 0.8, rotY: Math.PI / 2 },
    { id: "poster-bttf",     label: "BACK TO FUTURE",   category: "wall", x: 9.84,  y: 2.0, z: 2.95,  w: 0.2, d: 0.8, rotY: -Math.PI / 2 },
    { id: "poster-et",       label: "E.T.",             category: "wall", x: 9.87,  y: 2.0, z: 5.19,  w: 0.2, d: 0.8, rotY: -Math.PI / 2 },

    // Signs
    { id: "neon-sign",       label: "FRIDAY NIGHT VIDEO", category: "wall", x: 0,     y: 3.1, z: -6.85, w: 5.8, d: 0.15 },
    { id: "be-kind-sign",    label: "BE KIND REWIND",   category: "wall", x: -9.88, y: 2.0, z: 3.5,   w: 0.2, d: 1.5, rotY: Math.PI / 2 },
    { id: "late-fees-sign",  label: "LATE FEES",        category: "wall", x: 9.9,   y: 1.5, z: 5.2,   w: 0.2, d: 1.0, rotY: -Math.PI / 2 },
    { id: "rewards-sign",    label: "REWARDS MEMBER?",  category: "wall", x: 7,     y: 2.8, z: 5,     w: 2.5, d: 0.15, rotY: Math.PI },
    { id: "open-sign",       label: "OPEN",             category: "wall", x: -4,    y: 2.3, z: 7,     w: 1.0, d: 0.15 },
    { id: "store-hours",     label: "STORE HOURS",      category: "wall", x: 4,     y: 1.8, z: 7.05,  w: 1.3, d: 0.9 },
    { id: "promo-board",     label: "STORE SPECIALS",   category: "wall", x: 9.84,  y: 1.72, z: 3.05, w: 0.2, d: 1.0, rotY: -Math.PI / 2 },
    { id: "challenge-board", label: "CHALLENGE BOARD",  category: "wall", x: 9.92,  y: 1.62, z: 2.65, w: 0.2, d: 0.72, rotY: -Math.PI / 2 },
    { id: "price-list",      label: "RENTAL PRICES",    category: "wall", x: 8.5,   y: 1.8, z: 4.2,   w: 0.2, d: 0.8, rotY: -Math.PI / 2 },
    { id: "membership-sign", label: "MEMBERSHIP CARD",  category: "wall", x: 7,     y: 2.4, z: 5.5,   w: 2.4, d: 0.28 },
    { id: "no-food-sign",    label: "NO FOOD/DRINKS",   category: "wall", x: 3,     y: 2.4, z: -6.94, w: 1.6, d: 0.25 },
    { id: "movie-of-week",   label: "MOVIE OF THE WEEK", category: "wall", x: 0,    y: 1.6, z: -6.88, w: 0.8, d: 0.4 },
    { id: "coming-soon-board", label: "COMING SOON",    category: "wall", x: 7.5,   y: 1.8, z: 6.2,   w: 1.0, d: 1.2, rotY: -0.4 },
    { id: "clock-back",      label: "Back Wall Clock",  category: "wall", x: 6,     y: 2.8, z: -6.95, w: 0.7, d: 0.7 },

    // TV / CRT monitors
    { id: "tv-left",         label: "CRT TV (left)",    category: "wall", x: -9.05, y: 2.2, z: -2.8,  w: 0.3, d: 1.2, meta: { yaw: Math.PI / 2 - 0.18, tilt: 0.12, scale: 0.84 } },
    { id: "tv-right",        label: "CRT TV (right)",   category: "wall", x: 9.28,  y: 2.26, z: -3.9, w: 0.3, d: 1.0, meta: { yaw: -Math.PI / 2 + 0.18, tilt: 0.12, scale: 0.7 } },

    // Bulletin board
    { id: "bulletin-board",  label: "Bulletin Board",   category: "wall", x: -9.92, y: 1.6, z: 4.8,   w: 0.2, d: 1.2, rotY: Math.PI / 2 },

    // Wall clock near counter
    { id: "clock-counter",   label: "Wall Clock",       category: "wall", x: 9.9,   y: 2.8, z: 6.2,   w: 0.5, d: 0.5, rotY: -Math.PI / 2 },

    // Phone on wall
    { id: "wall-phone",      label: "Wall Phone",       category: "wall", x: 9.8,   y: 2.2, z: 5.3,   w: 0.15, d: 0.25, rotY: -Math.PI / 2 },

    // Fire extinguisher
    { id: "fire-extinguisher", label: "Fire Extinguisher", category: "wall", x: 9.88, y: 1.2, z: 0.5, w: 0.12, d: 0.35, rotY: -Math.PI / 2 },

    // We Buy Used Tapes window sign
    { id: "we-buy-tapes",   label: "WE BUY USED TAPES", category: "wall", x: -3.5, y: 1.0, z: 7.02, w: 1.2, d: 0.3 },

    // Kids & Family banner
    { id: "kids-banner",    label: "KIDS & FAMILY",     category: "wall", x: 7.6,  y: 2.4, z: 2.35,  w: 0.2, d: 1.4, rotY: -Math.PI / 2 },

    // Rewind sign near return bin
    { id: "rewind-sign",    label: "PLEASE REWIND",     category: "wall", x: 5,    y: 1.6, z: 4.4,   w: 0.9, d: 0.35 },

    // ═══════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════
    { id: "entrance",        label: "ENTRANCE",          category: "door", x: 0,     y: 0,   z: 6.95, w: 2.2, d: 0.2 },
    { id: "employees-door",  label: "EMPLOYEES ONLY",    category: "door", x: -9.93, y: 0,   z: -5.19, w: 0.2, d: 0.9, rotY: Math.PI / 2 },

    // ═══════════════════════════════════════════════════════
    // EXTERIOR
    // ═══════════════════════════════════════════════════════
    // Video return slot (outside)
    { id: "return-slot",     label: "Video Return",      category: "exterior", x: -8,    y: 0, z: 7.1,  w: 1.5, d: 0.6 },

    // Pizza Palace
    { id: "pizza-building",  label: "PIZZA PALACE",      category: "exterior", x: -13,   y: 0, z: 7,    w: 6,   d: 0.3 },
    { id: "pizza-door",      label: "Pizza Door",        category: "exterior", x: -12.5, y: 0, z: 7.16, w: 1.0, d: 0.2 },
    { id: "pizza-window",    label: "Pizza Window",      category: "exterior", x: -13.8, y: 0, z: 7.17, w: 2.0, d: 0.2 },
    { id: "pizza-slice-sign", label: "Pizza Slice",      category: "exterior", x: -14.5, y: 0, z: 7.2,  w: 0.7, d: 0.7 },
    { id: "pizza-menu",      label: "Pizza Menu Board",  category: "exterior", x: -11.6, y: 0, z: 7.4,  w: 0.6, d: 0.5 },
    { id: "pizza-trash",     label: "Pizza Trash Can",   category: "exterior", x: -11.8, y: 0, z: 7.6,  w: 0.35, d: 0.35 },

    // Laundromat
    { id: "laundro-building", label: "LAUNDROMAT",       category: "exterior", x: 13,    y: 0, z: 7,    w: 6,   d: 0.3 },
    { id: "laundro-door",    label: "Laundro Door",      category: "exterior", x: 13.5,  y: 0, z: 7.16, w: 1.0, d: 0.2 },
    { id: "laundro-window",  label: "Laundro Window",    category: "exterior", x: 12,    y: 0, z: 7.17, w: 2.2, d: 0.2 },
    { id: "laundro-open",    label: "Laundro OPEN",      category: "exterior", x: 11.2,  y: 0, z: 7.25, w: 0.7, d: 0.35 },
    { id: "laundro-24hr",    label: "24 HOUR sign",      category: "exterior", x: 14.2,  y: 1.8, z: 7.19, w: 0.9, d: 0.28 },
    { id: "vending-machine", label: "Vending Machine",   category: "exterior", x: 14.8,  y: 0, z: 7.2,  w: 0.6, d: 0.5 },

    // Sidewalk
    { id: "sidewalk",        label: "Sidewalk",          category: "exterior", x: 0,     y: 0, z: 7.8,  w: 22,  d: 1.5 },

    // Parking lot cars (original 5)
    { id: "car-sedan",       label: "Sedan",             category: "exterior", x: 5,     y: 0, z: 11,   w: 2.0, d: 1.0 },
    { id: "car-van",         label: "Van",               category: "exterior", x: -4,    y: 0, z: 11,   w: 2.0, d: 1.0, rotY: Math.PI },
    { id: "car-suv",         label: "SUV",               category: "exterior", x: 1,     y: 0, z: 12.5, w: 2.0, d: 1.0 },
    { id: "car-hatchback",   label: "Hatchback",         category: "exterior", x: -7,    y: 0, z: 12.5, w: 2.0, d: 1.0, rotY: Math.PI },
    { id: "car-taxi",        label: "Taxi",              category: "exterior", x: 8,     y: 0, z: 12.5, w: 2.0, d: 1.0 },
    // Additional cars
    { id: "car-sedan2",      label: "Sedan 2",           category: "exterior", x: -10,   y: 0, z: 11,   w: 2.0, d: 1.0, rotY: Math.PI },
    { id: "car-police",      label: "Police Car",        category: "exterior", x: 10,    y: 0, z: 11,   w: 2.0, d: 1.0 },
    { id: "car-delivery",    label: "Delivery Van",      category: "exterior", x: -2,    y: 0, z: 12.5, w: 2.0, d: 1.0, rotY: Math.PI },

    // Parking lot lamp posts
    { id: "lamp-1",          label: "Lamp Post",         category: "exterior", x: -6,    y: 0, z: 14,   w: 0.3, d: 0.3 },
    { id: "lamp-2",          label: "Lamp Post",         category: "exterior", x: 0,     y: 0, z: 14,   w: 0.3, d: 0.3 },
    { id: "lamp-3",          label: "Lamp Post",         category: "exterior", x: 6,     y: 0, z: 14,   w: 0.3, d: 0.3 },

    // Street lamps
    { id: "street-lamp-left",  label: "Street Lamp L",   category: "exterior", x: -12,   y: 0, z: 19,   w: 0.5, d: 0.5 },
    { id: "street-lamp-right", label: "Street Lamp R",   category: "exterior", x: 12,    y: 0, z: 19,   w: 0.5, d: 0.5 },

    // Sidewalk objects
    { id: "handicap-sign",   label: "Handicap Sign",     category: "exterior", x: -1.5,  y: 0, z: 10.5, w: 0.4, d: 0.4 },
    { id: "bike-rack",       label: "Bike Rack",         category: "exterior", x: 8,     y: 0, z: 8,    w: 0.8, d: 0.5 },
    { id: "bench",           label: "Bench",             category: "exterior", x: 3,     y: 0, z: 8.1,  w: 1.0, d: 0.35 },
    { id: "fire-hydrant",    label: "Fire Hydrant",      category: "exterior", x: 6,     y: 0, z: 8.2,  w: 0.3, d: 0.3 },
    { id: "trash-can-ext",   label: "Trash Can (ext)",   category: "exterior", x: -4,    y: 0, z: 8.1,  w: 0.4, d: 0.4 },
    { id: "newspaper-box",   label: "Newspaper Box",     category: "exterior", x: -6,    y: 0, z: 8.2,  w: 0.5, d: 0.4 },
    { id: "cig-receptacle",  label: "Cigarette Receptacle", category: "exterior", x: -3, y: 0, z: 7.6,  w: 0.2, d: 0.2 },

    // Parking lot features
    { id: "cart-return",     label: "Cart Return",       category: "exterior", x: 2,     y: 0, z: 14,   w: 1.8, d: 1.2 },
    { id: "stray-cart",      label: "Stray Cart",        category: "exterior", x: -5,    y: 0, z: 13,   w: 0.5, d: 0.35, rotY: 0.4 },
    { id: "speed-bump",      label: "Speed Bump",        category: "exterior", x: 0,     y: 0, z: 10,   w: 12,  d: 0.4 },
    { id: "customer-parking-sign", label: "CUSTOMER PARKING", category: "exterior", x: -9, y: 0, z: 11, w: 0.8, d: 0.35 },
    { id: "puddle",          label: "Puddle",            category: "exterior", x: 3,     y: 0, z: 12,   w: 1.6, d: 1.6 },
    { id: "storm-drain",     label: "Storm Drain",       category: "exterior", x: -7,    y: 0, z: 13,   w: 0.6, d: 0.4 },

    // Dumpster (behind store)
    { id: "dumpster",        label: "Dumpster",          category: "exterior", x: -8,    y: 0, z: -7.5, w: 1.8, d: 1.2 },

    // Power line poles
    { id: "power-pole-left",  label: "Power Pole L",    category: "exterior", x: -14,   y: 0, z: 17,   w: 0.3, d: 0.3 },
    { id: "power-pole-right", label: "Power Pole R",    category: "exterior", x: 14,    y: 0, z: 17,   w: 0.3, d: 0.3 },
  ],
};

// ── Helpers ──────────────────────────────────────────────

const _objectMap = new Map<string, LayoutObject>();
for (const obj of STORE_LAYOUT.objects) {
  _objectMap.set(obj.id, obj);
}

export function getObjectById(id: string): LayoutObject | undefined {
  return _objectMap.get(id);
}

export function getObjectsByCategory(category: ObjCategory): LayoutObject[] {
  return STORE_LAYOUT.objects.filter(o => o.category === category);
}

/**
 * Returns shelf rows in the same format Store.tsx SHELF_ROWS used to use.
 * Only includes gondola shelves (not wall shelves).
 */
export function getShelfRows(): { x: number; z: number; genre: string; color: string; backGenre: string; backColor: string; rotY: number }[] {
  return STORE_LAYOUT.objects
    .filter(o => o.id.startsWith("shelf-row"))
    .map(o => ({
      x: o.x,
      z: o.z,
      genre: (o.meta?.genre as string) || "",
      color: (o.meta?.color as string) || "#8B5E3C",
      backGenre: (o.meta?.backGenre as string) || "",
      backColor: (o.meta?.backColor as string) || "#444",
      rotY: o.rotY || 0,
    }));
}
