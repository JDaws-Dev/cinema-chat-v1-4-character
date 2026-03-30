# Layout Overhaul — Based on Real Blockbuster Floor Plan

> Reference: `~/Desktop/blockbuster layout diagram.png` (circa 1995-2000)

## Current vs Real Blockbuster

| Element | Our Store | Real Blockbuster | Fix |
|---------|-----------|-----------------|-----|
| Shelf arrangement | 3 parallel rows, grid | Angled gondolas, herringbone | Rearrange with varied angles |
| Wall shelving | Bare walls + posters | Full perimeter shelving | Add wall-mounted shelf runs |
| New Releases | Back wall only | Right wall + back wall | Expand to right wall perimeter |
| Checkout | Left side, mid-store | Front-right, near entrance | Move to front-right |
| Video games | None | Dedicated section | Add games area |
| Kids area | None | Corner with kiddie TV | Add kids corner |
| Cooler/snacks | Small cooler, counter candy | Cooler + freezer + candy racks near front | Expand near checkout |
| Previously viewed | None | Bargain section near front | Add bargain bin area |
| Entrance area | Tight, shelves close | Open decompression zone | Already improved, verify |
| Tape return | Exterior only | Interior + exterior | Add interior return bin |
| Gondola depth | Shelves feel like walls | Freestanding browse aisles | Make shelves feel walkable |

## New Layout Plan (Top-Down)

Based on the diagram, mapping to our coordinate system:
- Room: x=-10 to +10, z=-7 to +7
- Entrance at z=+7 (bottom of diagram)
- Back wall at z=-7 (top of diagram)

```
                    BACK WALL (z = -7)
  +──────────────────────────────────────────────+
  |  [WALL SHELVES: DRAMA along entire back wall] |
  |  [NEW RELEASES continued in back-left corner] |
  |                                               |
  |  ╲ HORROR ╲    ╲ SCI-FI ╲    ╲ COMEDY ╲     |  ← Angled gondolas
  |   ╲________╲    ╲________╲    ╲________╲     |     (rotated ~15°)
  |                                               |
  | [WALL:     ╲ ACTION ╲    ╲ CLASSICS ╲  [WALL:|
  | FOREIGN     ╲________╲    ╲________╲   NEW   |
  | INDIE                                  REL   |
  | CULT]       ╲ FAMILY ╲    ╲ WESTERN ╲  EASES]|
  |              ╲________╲    ╲________╲        |
  |                                               |
  | [WALL:                              [KIDS    |
  | DOCS/       ╲ THRILLER╲    ╲ANIMATED╲ CORNER |
  | SPECIAL      ╲________╲    ╲________╲ + TV]  |
  | INTEREST]                                     |
  |                                               |
  | [PREV.VIEWED]  [OPEN SPACE]   [CANDY/COOLER] |
  | [VIDEO GAMES]                 [CHECKOUT+VINNY]|
  |              ═══[ENTRANCE]═══                 |
  +──────────────────────────────────────────────+
```

## Detailed Position Map

### Perimeter Wall Shelving (new)
These are flat against the walls, single-sided, facing inward:

| Section | Wall | Position | Genres |
|---------|------|----------|--------|
| Back wall left | Back | x=-7 to -2, z=-6.8 | DRAMA (expanded) |
| Back wall right | Back | x=2 to 7, z=-6.8 | NEW RELEASES (expanded) |
| Left wall upper | Left | x=-9.8, z=-6 to -2 | FOREIGN, INDIE, CULT |
| Left wall lower | Left | x=-9.8, z=-2 to 3 | DOCS, SPECIAL INTEREST |
| Right wall | Right | x=9.8, z=-6 to 2 | NEW RELEASES (main wall) |

### Freestanding Gondolas (angled ~15°)
8 gondolas in 3 staggered rows, each rotated slightly:

| Gondola | Position | Rotation | Front Genre | Back Genre |
|---------|----------|----------|-------------|------------|
| G1 | x=-5, z=-4 | 0.25 rad | HORROR | THRILLER |
| G2 | x=-1, z=-4 | 0.25 rad | SCI-FI | MYSTERY |
| G3 | x=3, z=-4 | 0.25 rad | COMEDY | ROMANCE |
| G4 | x=-5, z=-1 | -0.15 rad | ACTION | ADVENTURE |
| G5 | x=0, z=-1 | -0.15 rad | CLASSICS | WESTERN |
| G6 | x=-4, z=2 | 0.2 rad | FAMILY | ANIMATED |
| G7 | x=1, z=2 | 0.2 rad | THRILLER | DRAMA |

### Checkout Area (front-right)
- Counter: x=5 to 9, z=5
- Vinny: behind counter at x=7, z=5.5
- Register, scanner, monitor on counter
- Candy racks flanking counter

### Cooler + Snacks (front-right, near checkout)
- Coca-Cola cooler: x=8, z=4
- Candy/popcorn racks: x=6, z=4
- Ice cream freezer: x=9, z=3

### Kids Corner (right-back)
- x=7 to 9.5, z=-4 to -6
- Small TV with kiddie video playing
- 2 small shelves with FAMILY/ANIMATED overflow
- Lower shelf height (1.0m instead of 1.5m)

### Video Games Area (front-left)
- x=-9 to -7, z=3 to 5
- Game console display
- Game shelves (smaller than movie gondolas)
- "VIDEO GAMES" sign

### Previously Viewed / Bargain Bin (front-left)
- x=-6 to -3, z=4 to 5
- Low table/bin with discounted tapes
- "PREVIOUSLY VIEWED — $4.99" sign

### Interior Return Bin
- x=3, z=5 (near checkout)
- "DROP RETURNS HERE" sign

## Implementation Plan

### Phase 1: Rearrange existing elements
1. Move checkout counter from left (x=-6) to right (x=7, z=5)
2. Move Vinny to new counter position
3. Reposition all SHELF_ROWS with new positions + rotations
4. Update COLLIDERS in FirstPerson.tsx
5. Update NPC_WAYPOINTS for new aisle paths
6. Update SHELF_BOUNDS for collision
7. Verify with overhead security camera

### Phase 2: Add perimeter wall shelving
8. Create WallShelf component (single-sided, flat against wall)
9. Add back wall shelving (DRAMA + NEW RELEASES)
10. Add left wall shelving (FOREIGN, INDIE, CULT, DOCS)
11. Add right wall shelving (NEW RELEASES main section)

### Phase 3: Add new areas
12. Kids corner with small TV + low shelves
13. Video games area with console display
14. Previously Viewed bargain bin
15. Expanded cooler/candy near checkout
16. Interior return bin

### Phase 4: Polish
17. Angle some gondolas (rotation on Y axis)
18. Update debug floor plan
19. Run security camera verification from all angles
20. Run visual-qa pipeline
21. Update NPC spawn points and waypoints for new layout
