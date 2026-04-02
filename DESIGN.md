# Friday Night Video -- Complete Design Document

> The store IS the interface. Every game mode lives inside the store. You never leave.

---

## 0. CURRENT 3D STORE STATE (Updated 2026-04-02)

### Session Update -- 2026-04-02

#### Major branch work completed
- **Prefab/layout Phase 1**: large chunks of the store are now layout-driven instead of hardcoded scene-only JSX. Posters, signs, return bin, bargain bin, lamps, cars, trash cans, CRT TVs, shelves, the counter, and the new releases wall all moved further onto the prefab path.
- **Collision and interaction sync**: gameplay collision now comes from layout/prefab data instead of relying only on a hand-maintained list. Shelf, sign, TV, and prop interactions are being resolved from the same object data used to render them.
- **3D editor overhaul**: selection, transform gizmos, focus-selected, local/world transform mode, angle snap, layer toggles, delete, undo/redo, collision preview, and better prefab visibility are in place in the 3D editor.
- **2D editor overhaul**: multi-select, group dragging, align/distribute, duplicate, and layer hide/lock controls are now in the 2D editor.
- **Exterior/storefront authoring**: the large exterior `FRIDAY NIGHT VIDEO` sign is now a layout object, Pizza Palace and storefront details are visible in the 3D editor, and car footprints/colliders were brought back into alignment with their visible meshes.
- **Security camera QA path verified**: the built-in 10-camera review system is still mounted in `/game` via `SecurityCameras.tsx` and remains the intended visual QA workflow.

#### VHS catalog and poster system updates
- **Historical eras moved off the tiny hand-curated fallback**: a generated per-era catalog snapshot now exists in `src/lib/generated-era-catalog.ts` and feeds historical shelf stocking through `src/lib/curated-movie-catalog.ts`.
- **Poster cache expanded**: real poster files are being cached locally in `public/images/posters/` and served through `/api/catalog-poster`.
- **Catalog generation tooling added**:
  - `scripts/generate-era-catalog.mjs`
  - `scripts/cache-catalog-posters.mjs`
- **Canonical shelf rule in progress**: the codebase is moving toward one canonical shelf home per movie, with `new releases` as the only place where multiple physical copies should appear.
- **Checked-out home slots improved**: when a movie is no longer on the shelf, its slot now renders as a readable checked-out card showing the title that belongs there instead of a blank placeholder.
- **Held VHS viewmodel is now in the main viewport**: the fragile in-canvas version was replaced with a reliable first-person overlay, and it now supports a larger lower-left left-handed stack instead of a tiny HUD-only representation.
- **Slot-level pickup state now exists**: physical shelf slots can now disappear per copy, which fixes the `new releases` bug where grabbing one copy incorrectly removed every copy of that title from the wall.
- **Staff Picks is display-only again**: that shelf now behaves like a recommendation display instead of extra rentable duplicates, which better matches the one-home-per-movie rule.
- **Gameplay HUD readability improved**: the game now exposes a clearer in-world status readout for store time, time until close, carried tape count, XP progress, and challenge timing.
- **Shelf browser now respects the actual shelf you clicked**: `Browse Shelf` no longer dumps a whole genre bucket; it is limited to the physical rack or wall run the player interacted with.
- **Pointer-lock flow improved after pickups**: grabbing a tape no longer leaves the player stranded waiting to click back into the game before they can look around again.
- **Held tape stack behavior tightened**: newest pickup renders on top of the stack, the stack supports five carried tapes, and the HUD exposes a direct `View Stack` path for managing them.
- **Stack overflow now has an explicit loop**: trying to grab a sixth tape surfaces a warning and routes the player to a stack/checkout view where individual movies can be put back.
- **VHS back-of-box UI tightened**: the modal is now consistently rectangular again, and provider metadata is restored so catalog-backed titles can show `STREAM`, `RENT`, and `BUY` availability when TMDB has it.
- **Spawn-time missing-copy logic has started**: some shelf homes now spawn empty, and a subset of those missing copies appear in a rentable `RECENT RETURNS` stack near the return bin.
- **Returns stack is now a real pickup source**: players can rent directly from recent returns, which creates the foundation for later “race to returns” and “find the missing copy” gameplay.
- **Historical shelf rendering is now placement-driven**: for non-present eras, the in-world shelf meshes and the shelf browser now read from the same canonical placement-slot assignments, and wall shelves request their true physical slot counts instead of a stale fixed `20`.
- **Slot-state transitions are more centralized now**: challenge resets, checkout, return-bin drops, and put-backs are now routed through shared helpers in `src/lib/store-movie-state.ts` instead of each path mutating recent returns and checked-out slots separately.
- **Store movie state is moving behind shared helpers**: checkout, put-back, challenge reset, timeout, and return-bin flows are now being routed through `src/lib/store-movie-state.ts` instead of each path mutating separate slot arrays by hand.

#### Current known issues / active work
- **VHS artwork path is still the top priority**: most poster requests are now succeeding through `/api/catalog-poster`, but the full in-game VHS flow still needs more hardening so shelf art, shelf browser art, HUD inventory art, held-in-hand tapes, and missing/checked-out states all stay consistent.
- **Shelf/browser/state unification is still incomplete**: historical shelf browsing and shelf rendering now share placement-slot data, but the full canonical movie-slot model across held stack, returns stack, checkout, and present-day shelves still needs more hardening.
- **Present-day shelves are still the big holdout**: historical eras now use the stronger placement-slot path, but the live/present-day movie pipeline still needs to be pulled into the same model.
- **Historical catalog quality still needs tuning**: the generated era catalogs are large enough now, but the selection rules still need to skew harder toward mainstream, high-recognition rental-store movies rather than odd TMDB long-tail results.
- **Returns gameplay is only at Phase 1**: spawn-time missing copies and rentable recent returns exist now, but routing returned movies back to their canonical shelf homes and building competitive/customer race logic still remains.

### Architecture
- **React Three Fiber** with first-person controls (WASD + mouse look)
- **MeshToonMaterial** cel-shading on desktop (4-step gradient map)
- Main file: `src/components/game3d/Store.tsx` (~4500 lines)
- Controls: `src/components/game3d/FirstPerson.tsx` (collision boxes, spawn, spatial audio listener)
- Interaction: `src/components/game3d/Interaction.tsx` (raycaster + E/F key + click)
- Security cameras: `src/components/game3d/SecurityCameras.tsx` (10 angles, saves to /tmp/fnv-cams/)
- Quest system: `src/lib/quest-system.ts` (5 Vinny quests + 5 customer side quests)
- NPC dialogues: `src/lib/npc-dialogues.ts` (RPG dialogue trees, branching responses)
- Audio: `src/lib/audio.ts` (65 audio clips: ambient, SFX, 31 customer voices, 6 conversations, spatial PannerNode)
- VHS detail: `src/components/FilmDetailModal.tsx` (back-of-box VHS case design)
- Debug: `src/app/debug/page.tsx` (top-down + side elevation views)

### Kenney GLB Models (CC0)
- **Cars**: sedan, van, suv, hatchback-sports, taxi (parking lot)
- **Furniture**: televisionVintage (2x TVs), trashcan, pottedPlant, bookcaseOpen, cardboardBoxOpen, radio
- **Food**: candy-bar, candy-bar-wrapper, chocolate, cookie-chocolate, soda-can, soda-bottle, soda
- All loaded via `KenneyModel` / `KenneyCar` components using `useGLTF` from drei

### Room Dimensions
- Width (X): 20 units (-10 to +10), Depth (Z): 14 units (-7 to +7), Height (Y): 3.5 units
- Shelves at z=-4, -1, 2 (pushed back for entrance breathing room)
- Front wall (entrance): z = +7, Back wall: z = -7

### Current Layout (Top-Down)
```
                    BACK WALL (z = -7)
  +──────────────────────────────────────────────+
  |  ALIEN  JAWS  [NEW RELEASES WALL] BLADE RAIDERS  |
  |               [FNV NEON SIGN y=3.1]              |
  |  EMPLOYEES                              TROPHIES |
  |  ONLY DOOR    ROW 1 (z=-4): front/back genres    |
  |               HORROR/CULT  SCI-FI/FOREIGN etc.   |
  | TV(Kenney)    ROW 2 (z=-1): front/back genres    |
  | SHINING(z=2)  ACTION/HORROR  FAMILY/SCI-FI etc.  |
  | STAR WARS     ROW 3 (z=2): front/back genres     |
  | BE KIND(z=3.5) THRILLER/ACTION  ANIMATED/FAMILY  |
  | BULLETIN(z=4.8)  SPECIALS(z=3)  BTTF(z=0)  E.T.(z=5)|
  | LATE FEES(z=5.2) COUNTER[-6,5.5]  RUG(z=5.2)   |
  | PHONE(z=6.3) VINNY  COOLER  OPEN  [DOORS] CLOCK(z=6.2)|
  | RETURN CHUTE                    HOURS            |
  +──────────────────────────────────────────────+
     PIZZA PALACE | SIDEWALK+GLOW | LAUNDROMAT
          [KENNEY CARS x5]  [BIKE]  [CART RETURN]
                    [ROAD]  [STARS+MOON]
```

### What's Built
- **12 gondola shelves**: Open frame design (0.35m deep), visible shelf boards, different genres front/back (24 total). VHS tapes 0.15x0.26x0.025 with TMDB poster art. No repeats per side.
- **Prefab-aware layout system**: reusable prefab renderers plus layout metadata now drive more of the store scene and editor behavior.
- **Era selector**: Late 80s, Early 90s, Mid 90s, Late 90s, Present Day — filters all movie posters
- **Generated era catalog snapshot**: historical shelves now draw from a stored per-era movie database rather than only the original hand-built list.
- **RPG quest system**: 5 Vinny main quests (sequential unlock), 5 customer side quests (50% chance on NPC talk). Quest log UI (J key). Props as rewards.
- **NPC system**: 4 adults (distinct hair/outfits/faces), 1 kid (backpack, sneakers), Charlie (vest, name tag), Tarantino easter egg (30% spawn). Shelf collision avoidance, NPC-to-NPC avoidance, walk animation (leg+arm swing), browse behavior (face shelves).
- **Audio**: 65 clips total — 20 adult customer lines, 6 kid lines, 5 Tarantino rants, 6 multi-voice conversations (24 clips), 3 ambient tracks, 7 SFX. Spatial PannerNode tied to NPC positions.
- **Counter**: RoundedBox geometry, Kenney candy/soda models, register with keypad, barcode scanner, computer monitor, membership cards, return bin, VHS rewinder
- **Exterior**: Kenney car models (5 cars), Pizza Palace (neon/checkered/menu), Laundromat (washing machines), window decals, light spill, dusk sky with stars+moon
- **Kenney GLB models**: 19 models replacing procedural geometry (cars, TV, trash, plant, food items)
- **Cel-shaded rendering**: MeshToonMaterial with 4-step gradient, single directional light
- **VHS detail view**: Back-of-box design (genre stripe, synopsis, barcode, monospace)
- **PWA**: manifest.json, Apple meta tags, landscape orientation, safe area CSS
- **Performance**: Poster throttle (6 concurrent), w154/w92 images, RoundedBox on key furniture
- **Security cameras**: 10 angles for AI-assisted visual QA (verified by o3 vision)
- **3D editor controls**: focus, local/world transforms, angle snap, delete, undo/redo, layer toggles, and collision preview
- **2D editor controls**: multi-select, align/distribute, duplicate, and layer hide/lock

### TODO (Future Sessions)
- [ ] InstancedMesh for VHS boxes (720 draw calls → 1)
- [ ] Finish canonical VHS slot state across shelf, browser, HUD, and held-in-hand view
- [ ] Push the same canonical placement-slot model into present-day shelves and the remaining HUD/returns surfaces
- [ ] Tune generated era catalogs toward more mainstream/high-recognition titles
- [ ] Complete return-bin / recent-returns gameplay loop
- [ ] More Kenney model swaps (bookcases, desks, lamps from furniture kit)
- [ ] Arcade cabinet (Prop Hunt game mode)
- [ ] Door animation + bell sound
- [ ] Counter bell interaction (Name That Quote)
- [ ] Zone-based exterior toggle
- [ ] CrazyGames SDK integration
- [ ] itch.io listing + press kit
- [ ] Share buttons + URL watermark on screenshots
- [ ] Streaming affiliate links (TMDB → JustWatch)
- [ ] Multiplayer lobby (browse together)

### Security Camera System
Trigger from Playwright or browser console:
```js
window.__securityCams()                    // all 10 cameras
window.__securityCams(['overhead','entrance'])  // specific cameras
```
Cameras: overhead, entrance, back_wall, left_wall, right_wall, counter, ceiling_front, ceiling_back, exterior, side_elev
Images saved to: `/tmp/fnv-cams/{name}.png`

### User's Nostalgia Vision
> "I love the idea of the pizza parlor — we'd always get pizza and a movie for Friday night. So much nostalgia."
> "Video return should link to behind the counter and then the worker puts the recent returns on the counter for people to look through before sorted."
> "I want the customer audio. That's part of the charm, hearing customers talk about movies and have arguments and funny exchanges."
> "Voices need to be attached to actual customers. And there need to be kid customers."

---

## 1. THE STORE AS INTERFACE

### Core Principle

One screen. One room. Everything happens here. The store view is always visible -- game modes overlay ON TOP of it, dimming the background but never replacing it. When you finish a game mode, the overlay slides away and you're back in the store. The effect: it always feels like you're physically present in this space.

### What You See (Single-Screen Layout)

The store is rendered as a 2.5D front-facing view (not top-down, not isometric -- think the bartending view in VA-11 HALL-A or the shop view in Moonlighter). The camera angle is slightly elevated, looking down at roughly 15 degrees. Everything fits on one screen with no scrolling.

```
+------------------------------------------------------------------+
|  [POSTERS] [POSTERS] [POSTERS]    FRIDAY NIGHT VIDEO    [POSTERS]|  <- Back wall (10%)
|                                  ~~~~neon sign~~~~                |
+------------------------------------------------------------------+
|  [HORROR] [SCI-FI] [COMEDY] [DRAMA]     |     [TV SET]          |  <- Shelf row 1 (18%)
|  ████████ ████████ ████████ ████████     |     ┌──────┐          |
|  tapes... tapes... tapes... tapes...     |     │static│          |
|                                          |     └──────┘          |
+------------------------------------------+     [VHS STACK]       |
|  [ACTION] [CLASSICS] [FAMILY] [NEW]     |                       |  <- Shelf row 2 (18%)
|  ████████ ████████ ████████ ████████     |     [GUMBALL]         |
|  tapes... tapes... tapes... tapes...     |     MACHINE           |
+------------------------------------------+-----------------------+
|                                                                   |
|         [COUNTER~~~~~~~~~~~~~~~~~~~~~~~~~~~~]                     |  <- Counter area (22%)
|         | REGISTER |  [VINNY]  | bell |tape |                     |
|         [~~~~~~~~~~~~~~~~~~~~~~~~~~~counter~~]                    |
|                                                                   |
|  [BULLETIN    [ARCADE       [RUG / FLOOR AREA]     [CARDBOARD    |  <- Floor area (20%)
|   BOARD]      CAB]                                   STANDEE]    |
|                                                                   |
+-----[NPC]--------[WELCOME MAT]----------[NPC]-------------------+
|                    [DOOR / ENTRANCE]                              |  <- Entrance (12%)
+------------------------------------------------------------------+
```

### Layout Zones (Percentage-Based Positioning)

All positions are relative to the store-map container. The container is `max-width: 1000px`, `height: calc(100dvh - 48px)`.

| Element | top% | left% | width% | height% | z-index |
|---------|------|-------|--------|---------|---------|
| Back wall | 0 | 0 | 100 | 10 | 1 |
| Neon sign | 1 | 30 | 40 | 8 | 2 |
| Shelf row 1 (4 shelves) | 12 | 5 | 55 | 18 | 3 |
| TV set | 12 | 68 | 18 | 16 | 3 |
| Shelf row 2 (4 shelves) | 33 | 5 | 55 | 18 | 3 |
| Gumball machine | 38 | 72 | 8 | 12 | 3 |
| VHS stack (by TV) | 28 | 70 | 12 | 6 | 2 |
| Counter | 56 | 15 | 55 | 14 | 4 |
| Vinny (behind counter) | 42 | 35 | 12 | 18 | 5 |
| Register | 57 | 18 | 8 | 8 | 5 |
| Counter bell | 58 | 52 | 4 | 4 | 5 |
| Bulletin board | 72 | 5 | 14 | 16 | 2 |
| Arcade cabinet | 72 | 22 | 10 | 16 | 2 |
| Cardboard standee | 72 | 78 | 10 | 16 | 2 |
| Floor rug | 74 | 38 | 24 | 12 | 1 |
| Welcome mat | 88 | 40 | 20 | 5 | 1 |
| Door | 90 | 38 | 24 | 10 | 1 |

### Individual Shelf Positions (Within Each Row)

Shelf row 1 spans `left: 5%` to `left: 60%`, divided into 4 shelves:

| Shelf | left% | width% |
|-------|-------|--------|
| Horror | 5 | 12 |
| Sci-Fi | 19 | 12 |
| Comedy | 33 | 12 |
| Drama | 47 | 12 |

Shelf row 2 spans the same range:

| Shelf | left% | width% |
|-------|-------|--------|
| Action | 5 | 12 |
| Classics | 19 | 12 |
| Family | 33 | 12 |
| New Releases | 47 | 12 |

Staff Picks shelf is a separate unit on the right wall: `top: 15%, left: 85%, width: 12%, height: 35%` -- rotated 90 degrees to look like a side-wall display.

### What Is Clickable

Every interactive element has three states: **idle** (subtle glow outline on hover), **hover** (brighter glow + cursor pointer + tooltip label), **active** (slight scale pulse when clicked).

| Element | Click Action | Hover Tooltip |
|---------|-------------|---------------|
| Any shelf (8 shelves) | Opens ShelfBrowser panel (slides up from bottom) | "HORROR", "SCI-FI", etc. |
| TV set | Starts "Friday Night Pick" mode | "FRIDAY NIGHT PICK" |
| Vinny | Opens DialogueBox (slides up from bottom) | "TALK TO VINNY" |
| Counter bell | Starts "Name That Quote" quick round | "RING FOR TRIVIA" |
| VHS stack (by TV) | Starts "Back of the Box" mode | "GRAB A TAPE" |
| Bulletin board | Shows daily challenge + stats | "CHECK THE BOARD" |
| Arcade cabinet | Starts "Prop Hunt" mode | "PLAY PROP HUNT" |
| Cardboard standee | Random film fact from Vinny (one-liner popup) | "WHAT'S THIS?" |
| Gumball machine | Spend 50 XP for random artifact | "TRY YOUR LUCK" |
| Movie posters (back wall) | Shows the film's TMDB detail | Poster title |
| Door | Exits to title screen (with "Closing time?" confirm) | "EXIT" |

### How Game Modes Transition

All game modes use the same transition pattern:

1. **Click trigger element** -- element does a brief "activation" animation (glow pulse, slight bounce)
2. **Store dims** -- `store-map` gets class `store-dimmed` (opacity 0.3, filter: blur(2px)), transition 400ms ease-out
3. **Panel slides in** -- the game mode panel slides up from the bottom (for quiz modes) or fades in as a centered card (for pick mode). Uses `transform: translateY(100%) -> translateY(0)` with 400ms cubic-bezier(0.16, 1, 0.3, 1)
4. **Game plays** -- panel is interactive, store is visible but non-interactive behind it
5. **Game ends** -- result shown in panel, then "BACK TO STORE" button
6. **Panel slides out** -- reverse of step 3, 300ms
7. **Store un-dims** -- opacity back to 1, blur removed, 300ms

The store is NEVER unmounted. It stays in the DOM the entire session. Panels are overlays.

### How the Store Feels Alive

**Always-running ambient animations (no user input needed):**

- **Neon sign flicker**: The "FRIDAY NIGHT VIDEO" sign has a subtle CSS flicker (already implemented). Add a secondary flicker to the "OPEN" sign in the window area on a different timing cycle.
- **TV static**: The TV set shows animated static (CSS noise pattern using a `background-image` with `background-position` animation at 10fps). When not in a game mode, it cycles through "channels" every 8 seconds -- a colored bar screen, a movie scene silhouette, static, a "BE KIND REWIND" message.
- **Ceiling light hum**: The 3 ceiling light elements have a barely perceptible brightness oscillation (opacity 0.95 to 1.0, 2s cycle, staggered). Their light pools on the floor shift subtly.
- **NPC customers**: 2-3 NPCs walk pre-set routes through the store (already implemented). Add: they occasionally stop at a shelf for 3-5 seconds (browse animation -- slight head-tilt), then continue. One NPC should linger near the counter and "talk" to Vinny (speech bubble dots appear).
- **Vinny idle animations**: Vinny cycles through idle states every 6-10 seconds: leaning on counter, adjusting glasses, looking at a tape, tapping the counter. Each is a CSS class swap on his sprite.
- **Door bell**: When an NPC enters/exits through the door, a small "ding" sound effect plays (if audio enabled) and the door briefly swings open (2px translate + rotate).
- **Gumball machine**: One gumball slowly rolls around inside (CSS animation, 12s loop).
- **Posters**: One random poster gets a subtle "new arrival" sparkle every 30 seconds.

**Time-of-day awareness (cosmetic only):**

The store window (back wall area) shows a gradient representing outside. This shifts based on the user's local time:

| Local Time | Window Gradient | Mood |
|------------|----------------|------|
| 6AM-12PM | Light blue / morning gold | "Early bird special" |
| 12PM-5PM | Bright blue / white | Afternoon brightness |
| 5PM-8PM | Orange / purple sunset | "Friday evening" prime time |
| 8PM-11PM | Deep blue / dark purple | "Friday night" peak cozy |
| 11PM-6AM | Near black / dark blue | "Late night" cult film hours |

This is purely CSS -- the store-map gets a data attribute (`data-time-of-day="evening"`) set once on mount, which controls CSS custom properties for the window gradient and ambient light warmth.

---

## 2. GAME MODES MAPPED TO STORE ELEMENTS

### Mode 1: Friday Night Pick

**Trigger:** Click the TV set (right side of store, above the VHS stack).

**Visual:** TV "turns on" (static animation speeds up, then resolves to a colored screen). Store dims. A card slides up from the bottom covering the lower 70% of the screen.

**Full UX Flow:**

1. **Scenario card** -- Vinny's portrait on the left, scenario text on the right. "It's your first date. You need something impressive but not pretentious..." Below the text: a single button "LET ME BROWSE".

2. **Genre select** -- The scenario hint stays pinned at the top ("First date movie"). Below it, a 2x4 grid of genre buttons, each styled like a VHS section divider. Colors match the shelf accents. Each button shows: genre emoji, genre name, and a one-line flavor text ("Dark rooms, darker stories").

3. **Film browse** -- A grid of real TMDB film cards (poster + title + year). 12 films per page. Each film is rendered as a VHS cassette (poster as the box art, colored spine on the left edge matching the genre). Clicking a film = selecting it as your pick.

4. **Result** -- Vinny reacts. His portrait changes expression (happy/neutral/disappointed). The selected film shows large with its poster. Vinny's quote appears in a dialogue bubble. Score badge animates in. Two buttons: "ANOTHER SCENARIO" and "BACK TO STORE".

**Visual Details:**
- The card has a dark blue background (`#0a1830`) with a subtle VHS tracking-line effect at the top (horizontal line slowly scrolling down, barely visible)
- Film cards in the browse phase have a slight perspective tilt on hover (rotateY 3deg)
- The result badge (Perfect Pick / Good Pick / Wrong Vibe) pops in with a scale bounce (0 -> 1.1 -> 1.0, 300ms)

**How It Looks During Play:**
```
+------------------------------------------------------------------+
|  [dimmed store background, blurred]                    [TV glow]  |
|                                                                   |
+------------------------------------------------------------------+
|  FRIDAY NIGHT PICK                               142 pts    [X]  |  <- Panel header
+------------------------------------------------------------------+
|                                                                   |
|  [Vinny]  "It's your first date. You need something              |
|  portrait   impressive but not pretentious..."                    |
|                                                                   |
|  Hint: First date movie                                          |
|                                                                   |
|  +----------+ +----------+ +----------+ +----------+             |
|  | HORROR   | | SCI-FI   | | COMEDY   | | DRAMA    |             |
|  +----------+ +----------+ +----------+ +----------+             |
|  +----------+ +----------+ +----------+ +----------+             |
|  | ACTION   | | CLASSICS | | FAMILY   | | NEW      |             |
|  +----------+ +----------+ +----------+ +----------+             |
|                                                                   |
+------------------------------------------------------------------+
```

### Mode 2: Name That Quote

**Trigger:** Click the counter bell (small brass bell on the checkout counter).

**Visual:** Bell does a wobble animation + "ding" sound. Vinny perks up ("Pop quiz, hotshot!"). Store dims. A centered card appears (not bottom panel -- this one floats in the middle, 60% width, like a dialogue card).

**Full UX Flow:**

1. **Quote display** -- Large quotation marks, the quote in serif-style text (contrast with the pixel font used elsewhere -- this feels like a film quote). Below: 4 answer buttons (A, B, C, D) styled like multiple choice on a chalkboard.

2. **Answer** -- Correct answer highlights green, wrong highlights red + correct shows green. Vinny's reaction text appears below. Score badge. "NEXT QUOTE" and "BACK TO STORE" buttons.

**Visual Details:**
- The quote card has a slight paper texture (CSS `background-image` noise)
- Quote text uses a different font weight -- bold, slightly larger, with smart quotation marks
- Answer buttons have letter-grade badges (A, B, C, D) in gold circles on the left
- Correct answer does a brief green flash + checkmark animation
- Wrong answer does a brief red flash + X, then the correct one glows green

**Panel Type:** Centered floating card (not bottom slide-up). Width: min(90%, 520px). Appears with `opacity 0 -> 1` + `scale(0.95) -> scale(1)`, 300ms.

### Mode 3: Back of the Box

**Trigger:** Click the VHS stack next to the TV set.

**Visual:** A VHS tape "lifts" off the stack (slight float animation). The tape flips around (CSS 3D transform, rotateY 180deg, 600ms). Store dims. A card slides up showing the back of the VHS box.

**Full UX Flow:**

1. **Synopsis display** -- Styled like an actual VHS box back: dark background, white text synopsis in a bordered area, a "STARRING: ???" line, a "RATED: ???" line (all hidden -- just the synopsis). Genre tags are hidden. Below: 4 film title options.

2. **Answer + reveal** -- Same pattern as quotes. Correct film highlights. Vinny comments. The VHS "box" flips back to the front, revealing the poster of the correct film. Score badge. Next/Back buttons.

**Visual Details:**
- The VHS box back has scan lines (CSS horizontal lines, 1px every 3px, opacity 0.05)
- The synopsis text types out character by character (60ms per character, skip-able by clicking anywhere)
- The VHS box has a visible spine on the left edge (colored by genre)
- The "flip" reveal of the correct film poster is a satisfying moment -- add a brief sparkle/glow

**Panel Type:** Bottom slide-up, covering lower 65% of screen.

### Mode 4: Prop Hunt

**Trigger:** Click the arcade cabinet (lower-left floor area of the store).

**Visual:** Arcade screen lights up, "INSERT COIN" text, then the store itself becomes the game board. This is the ONE mode where the store is NOT dimmed -- instead, the store becomes interactive in a different way.

**Full UX Flow:**

1. **Intro** -- A small HUD banner appears at the top: "PROP HUNT -- Find 5 movie props hidden in the store! Time: 60s". A countdown timer starts.

2. **Gameplay** -- 5 iconic movie props are hidden among the store's visual elements. They're rendered as small pixel-art items (16x16px) tucked into shelves, behind the counter, on the bulletin board, near the door, etc. They have a subtle shimmer animation (very subtle -- you have to look). Clicking one collects it.

3. **Found prop** -- A small toast notification slides in from the right: "[Lightsaber icon] LIGHTSABER -- Star Wars (1977)" with a +10 XP badge. The prop disappears from the store with a sparkle.

4. **End** -- Timer runs out or all 5 found. Results card shows: props found/5, time taken, XP earned. Each found prop is displayed with its film connection.

**Prop Pool (30 total, 5 randomly selected per round):**

| Prop | Film | Pixel Art Description | Possible Hiding Spots |
|------|------|----------------------|----------------------|
| Lightsaber (green) | Star Wars | 16px glowing green rod | On a shelf, behind counter |
| Ruby slippers | Wizard of Oz | Red sparkly shoes | Under the counter, on the rug |
| Fedora | Indiana Jones | Brown hat with band | On top of a shelf unit |
| Hockey mask | Friday the 13th | White mask with red | Hanging on bulletin board |
| Golden idol | Raiders | Small gold statue | On the counter next to register |
| One Ring | LOTR | Small gold ring | On the welcome mat, on a shelf |
| Proton pack | Ghostbusters | Beige backpack device | Leaning against arcade cabinet |
| Red pill | The Matrix | Small red capsule | On the counter, near gumball machine |
| DeLorean keys | BTTF | Silver keys | Hanging on bulletin board pin |
| Wilson volleyball | Cast Away | White ball with face | On the floor near door |
| Infinity Gauntlet | Avengers | Gold glove | On top of TV set |
| Rosebud sled | Citizen Kane | Small wooden sled | Leaning against side wall |
| Glass slipper | Cinderella | Transparent shoe | On the welcome mat |
| Hoverboard | BTTF II | Pink floating board | On the floor near shelves |
| Whip | Indiana Jones | Coiled brown whip | Hanging from shelf edge |

**Visual Details:**
- Props are `position: absolute` within the store-map, placed at pixel-precise positions
- They have a very subtle `animation: shimmer 3s ease-in-out infinite` (opacity 0.6 -> 1.0 -> 0.6)
- When found, they do a `scale(1) -> scale(1.5) -> scale(0)` with `opacity 1 -> 0` animation (sparkle burst)
- The timer bar at the top is styled like a VHS tracking bar (blue/red gradient)
- The store is at full brightness during this mode -- the props need to be findable but not obvious

### Mode 5: Talk to Vinny (Free AI Chat)

**Trigger:** Click Vinny directly (his sprite behind the counter).

**Visual:** Vinny's speech bubble enlarges. Store dims. The DialogueBox slides up from the bottom covering the lower 50% of the screen.

**Full UX Flow:**

This is the existing chat system -- Vinny powered by OpenAI via SSE streaming. The DialogueBox component already handles this well.

**Enhancements to the existing DialogueBox:**

1. **Vinny portrait expressions** -- Based on keywords in his response:
   - Default: neutral/friendly (current)
   - Excited: when recommending something he loves (eyes wider, eyebrows up)
   - Thinking: when processing a complex request (hand on chin)
   - Disappointed: when user picks something he thinks is bad
   - Laughing: when making a joke (mouth open, squint eyes)

   Implementation: parse the last assistant message for trigger words ("love", "perfect", "hmm", "well...", "ha") and set an expression class on the portrait.

2. **Film title links** -- Already implemented (bold titles are clickable). When clicked, show the TMDB film detail modal overlaying the dialogue.

3. **"Vinny's Pick" card** -- When Vinny recommends a specific film, a small "VINNY'S PICK" card appears in the dialogue with the film poster thumbnail, title, year, and a "Save to Watchlist" button.

**Panel Type:** Bottom slide-up, 50% height. The store is visible above, dimmed.

### Mode 6: Scene Description Challenge (NEW MODE)

**Trigger:** Click one of the movie posters on the back wall.

**Visual:** The poster "zooms in" (scale animation from its wall position to center screen). Store dims. A card appears.

**Full UX Flow:**

1. **Scene description** -- Vinny describes an iconic scene WITHOUT naming the film: "A man in a white suit walks through a ballroom, the camera following him in one unbroken shot, as the music swells and he catches a glimpse of the woman who will ruin his life..."

2. **Answer** -- 4 film options. Same answer flow as quotes.

3. **Reveal** -- Vinny gives context: the director, the technique, why it matters.

**Data Structure:**
```typescript
interface SceneChallenge {
  id: string;
  description: string;  // Vivid scene description, no title
  film: string;
  year: number;
  director: string;
  options: string[];
  correctIndex: number;
  vinnyRight: string;   // includes film lore about the scene
  vinnyWrong: string;
}
```

**Why this mode works:** It tests visual memory and cinematic literacy rather than trivia knowledge. Film buffs will love it because it rewards actually having SEEN the films.

### Mode 7: Soundtrack Round (NEW MODE)

**Trigger:** Click the gumball machine -- but only after reaching Film Buff rank (150 XP). Before that, the gumball machine just dispenses a random film fun fact.

**Flow:** Vinny hums/describes a famous film score. "Dun-dun... dun-dun... dun-dun-dun-dun-dun-dun..." You guess the film. This is text-only (no actual audio needed) -- Vinny describes the music in his voice.

**Data example:**
```
"Okay, picture this: big brass section, sounds like a march, makes you feel like you could conquer the world.
Da-da-da-DAAAA, da-da-da-DAAAA..."
Answer: Star Wars / Indiana Jones / Superman / Jurassic Park
```

This mode is lightweight -- 5 questions, quick rounds, palate cleanser between longer modes.

---

## 3. PROGRESSION & PERSISTENCE

### Store Evolution

The store visually changes as you progress. This is the key "Animal Crossing" mechanic -- your progress is VISIBLE in the environment.

| Rank | XP | Store Changes |
|------|-----|---------------|
| New Hire (0) | 0 | Base store: sparse shelves (6-8 tapes each), dim lighting, 2 posters, no bulletin board content |
| Regular (50) | 50 | Shelves fill up (10-12 tapes). Bulletin board gets first note ("Employee of the Month: ???"). Neon sign glows slightly brighter. |
| Film Buff (150) | 150 | All shelves full. Staff Picks section appears (was "COMING SOON" barrier tape before). Vinny gets a new vest color (burgundy -> navy). 2 more posters appear. Bulletin board has 3 notes. |
| Cinephile (300) | 300 | New Releases shelf gets a "HOT" sticker. Gumball machine activates. A "FILM OF THE WEEK" poster with real TMDB data appears. Vinny has reading glasses on his head. Arcade cabinet screen glows. Cardboard standee appears. |
| Honorary Manager (500) | 500 | Neon sign is vivid and barely flickers. Shelves are overflowing. Vinny's nametag changes to "MANAGER". A framed photo of "you and Vinny" appears behind the counter. Gold trim on the counter. Premium posters everywhere. |

**Implementation:** The `StoreMap` component reads the player's rank from localStorage and conditionally renders elements. Store evolution data structure:

```typescript
interface StoreEvolution {
  rank: string;
  tapesPerShelf: number;       // 6 -> 8 -> 12 -> 14 -> 16
  posterCount: number;          // 2 -> 4 -> 6 -> 8 -> 10
  bulletinNotes: number;        // 0 -> 1 -> 3 -> 5 -> 8
  neonBrightness: number;       // 0.6 -> 0.7 -> 0.85 -> 0.95 -> 1.0
  vinnyVestColor: string;       // "#8b2252" -> "#1e3a5f" -> "#2d1b69" -> "#8b6914" -> "#c41e3a"
  specialElements: string[];    // ["staff_picks", "arcade", "standee", "film_of_week", "manager_photo"]
  shelfOverflow: boolean;       // false until Honorary Manager
}
```

### Scoring System

**XP Sources:**

| Action | XP | Notes |
|--------|-----|-------|
| Friday Night Pick -- Perfect | +30 | Correct genre match |
| Friday Night Pick -- Good | +15 | Adjacent genre |
| Friday Night Pick -- Bad | +0 | Wrong genre |
| Name That Quote -- Correct | +20 | Per question |
| Back of the Box -- Correct | +20 | Per question |
| Scene Description -- Correct | +25 | Slightly harder, more reward |
| Soundtrack Round -- Correct | +15 | Quick round, less reward |
| Prop Hunt -- Per prop found | +10 | Up to +50 per round |
| Prop Hunt -- All 5 found | +20 bonus | Completion bonus |
| Artifact discovered | +5 | One-time per artifact |
| Daily challenge correct | +25 | Once per day |
| Streak bonus (3 correct in a row) | +10 | Any mode |

**Reputation Score (Separate from XP):**

Reputation is 0-100 and affects the difficulty/content available. It rises and falls.

| Action | Rep Change |
|--------|-----------|
| Perfect pick | +5 |
| Good pick | +1 |
| Bad pick | -3 |
| Trivia correct | +2 |
| Trivia wrong | -1 |
| Prop Hunt all 5 | +5 |
| Daily challenge correct | +3 |

| Rep Range | Effect |
|-----------|--------|
| 0-20 | Easy mode: simpler scenarios, common trivia, 60s prop hunt timer |
| 21-40 | Normal mode |
| 41-60 | Harder scenarios appear, more obscure trivia mixed in |
| 61-80 | Expert scenarios, deeper-cut films in browse results |
| 81-100 | "Friday Night Rush": all modes slightly faster paced, VIP customers with tougher requests, rare props in Prop Hunt |

### Collectibles (Artifacts)

The existing `collectibles.ts` has 12 hidden VHS tapes. Expand to a full 50-item artifact system:

**Artifact Categories:**

1. **Movie Props (15 items)** -- earned through Prop Hunt. Each unique prop you find in Prop Hunt is permanently added to your collection.

2. **VHS Tapes (12 items)** -- the existing hidden tapes in the walkable store. Keep as-is but add to the unified collection.

3. **Vinny's Picks (8 items)** -- earned by talking to Vinny. After every 5th conversation, Vinny "gives" you a personal recommendation tape (a golden VHS). Each one has a unique Vinny monologue.

4. **Achievement Badges (10 items)** -- earned by hitting milestones:
   - "Opening Night" -- Complete your first round of any mode
   - "The Regular" -- Play 7 days in a row
   - "Genre Master: [X]" -- Get 10 perfect picks in one genre (one per genre = 7)
   - "Vinny's Apprentice" -- Reach Cinephile rank
   - "Manager Material" -- Reach Honorary Manager

5. **Rare Artifacts (5 items)** -- legendary items earned by exceptional play:
   - Ruby Slippers -- Complete all Genre Master badges
   - Lightsaber -- 10 correct answers in a row (any quiz mode)
   - DeLorean Keys -- Recommend 25 different films through Friday Night Pick
   - Golden Idol -- Get 5 perfect picks in a single session (no misses)
   - Infinity Gauntlet -- Collect all other 45 artifacts

**Collection Wall:**

Accessed by clicking the bulletin board (or a dedicated "BACK ROOM" area that unlocks at Film Buff rank). Full-screen overlay with a grid of artifact slots:

```
+------------------------------------------------------------------+
|  YOUR COLLECTION                              32/50    [CLOSE X]  |
+------------------------------------------------------------------+
|                                                                   |
|  MOVIE PROPS ~~~~~~~~~~~~~~~~~~~~~~~~  8/15                       |
|  [Lightsaber] [Fedora] [???] [???] [Ring] [???] [???] [???]     |
|  [???] [???] [Mask] [???] [???] [???] [???]                     |
|                                                                   |
|  VHS TAPES ~~~~~~~~~~~~~~~~~~~~~~~~~~  7/12                       |
|  [Jaws] [Blade Runner] [???] [BTTF] [???] [E.T.] [???]         |
|  [???] [???] [Ghstbstrs] [Die Hard] [???]                       |
|                                                                   |
|  VINNY'S PICKS ~~~~~~~~~~~~~~~~~~~~~~  4/8                        |
|  [gold tape] [gold tape] [???] [gold tape] [???] [???]          |
|  [gold tape] [???]                                               |
|                                                                   |
|  ...                                                              |
+------------------------------------------------------------------+
```

Undiscovered items show as dark silhouette outlines with "???". Discovered items show in full color with a slight glow. Clicking a discovered artifact shows: the item name, the film it's from, how you earned it, and a Vinny monologue.

### Taste Profile

The existing `TasteProfile` in `friday-night.ts` tracks genre affinity and picks. Expand it:

```typescript
interface TasteProfile {
  genres: Record<string, number>;    // genre -> affinity score
  picks: string[];                    // film titles picked
  totalRounds: number;
  correctAnswers: number;
  favoriteDecade: string | null;     // computed from picks
  topGenre: string | null;           // computed from genres
  streak: number;                     // current correct streak
  bestStreak: number;                // all-time best
  sessionsPlayed: number;
  lastSessionDate: string;           // ISO date string
  dailyStreak: number;              // consecutive days played
}
```

**What the taste profile unlocks:**
- Vinny references your tastes in his dialogue: "You've been on a sci-fi kick lately..."
- The "Staff Picks" shelf biases toward genres you haven't explored yet (anti-bubble)
- At Cinephile rank, a "YOUR SHELF" section appears with your top picks displayed
- The shareable recommendation cards include your top genre and rank

### What Brings People Back Daily

1. **Daily Challenge** -- One trivia question per day, same for all players. Streak counter. 7-day streak = rare artifact. Displayed on the bulletin board with today's question and your streak.

2. **Daily Prop Hunt** -- The 5 props in Prop Hunt rotate daily. New hiding spots each day. "Today's hunt" is always fresh.

3. **Rotating Film of the Week** -- A featured TMDB trending film appears on a special poster. Clicking it shows Vinny's take on it (a pre-written or AI-generated review).

4. **Store evolution carrot** -- Progress toward the next rank is shown in the HUD. "42 XP to Film Buff" creates ongoing motivation.

5. **Vinny remembers** -- When you return after a day away, Vinny greets you differently: "Hey, you're back! Been thinking about that Kubrick thing..." This uses the existing preference/memory system.

6. **Streak rewards** -- Daily play streaks unlock cosmetic changes (different rug, different counter color, holiday decorations during real-world holidays).

---

## 4. THE VIBE

### Capturing "Friday Night at the Video Store"

The emotional target is: you just got off work, it's 7pm on a Friday, you have nothing planned, and you walk into your favorite local video store. The fluorescent lights are buzzing, there's a movie playing on the TV in the corner, and the clerk knows your name.

**Key Vibe Elements:**

1. **Warm lighting** -- The store should feel WARM despite the blue walls. The ceiling lights cast visible warm pools on the floor (CSS radial gradients, `rgba(255, 245, 220, 0.06)`). The neon sign adds color temperature contrast.

2. **Sound design** (future, but spec it now): Ambient hum of fluorescent lights. Quiet movie dialogue from the TV (muffled). Door bell ding. VHS tape clatter when browsing shelves. Cash register cha-ching on correct answers. Vinny's "hmm" and "oh!" as sound cues.

3. **Pacing** -- Nothing rushes you. Prop Hunt has a timer, but everything else is at your pace. The store exists whether you're doing a game mode or just looking around. This is "cozy game" pacing -- you set the tempo.

4. **The personal touch** -- Vinny's dialogue is the soul. Every game mode begins and ends with Vinny saying something. He's not a menu -- he's a character. His reactions to your picks feel personal. His trivia commentary teaches you something. His free chat is genuinely knowledgeable.

5. **Nostalgia triggers** -- The VHS tape aesthetic. The "BE KIND, REWIND" sign. The bulletin board. The worn carpet. The counter register. Each of these is a memory anchor for the 30-45 audience.

6. **Discovery** -- The store rewards looking around. Hidden tapes. Clickable posters that teach you about films. Vinny's random facts from the standee. The gumball machine surprise. Every corner has something.

### Vinny's Personality in Every Interaction

**Vinny voice rules (already in `vinny-prompt.ts`, extended here for game modes):**

| Context | Vinny's Tone |
|---------|-------------|
| Opening greeting | Warm, casual: "Hey! Friday night. What are we getting into?" |
| Friday Night Pick intro | Setting the scene: "Alright, picture this..." |
| Correct trivia answer | Impressed + teacherly: "Bingo. '75. Fun fact..." |
| Wrong trivia answer | Gently corrective: "Nah, it's actually... but hey, now you know." |
| Perfect pick | Genuinely excited: "Oh, THIS is the one. You nailed it." |
| Bad pick | Sympathetic: "I mean... it's a movie? But for THIS scenario, nah." |
| Prop Hunt start | Playful: "Think you know your props? Prove it." |
| Returning after absence | Personal: "There they are! Been saving something for you..." |
| Achievement unlocked | Proud: "Look at you. You're earning your spot behind this counter." |

**Vinny should NEVER:**
- Sound robotic or mechanical
- Give numbered lists
- Say "great choice!" generically -- his praise is always specific
- Break the fourth wall (he doesn't know he's in a game)
- Be mean -- sarcastic yes, mean no

### Emotional Arc of a Session

A typical 20-30 minute session:

1. **Arrival (0-1 min)** -- Title screen, enter store. Vinny greets you. You orient yourself.
2. **Warm-up (1-5 min)** -- Browse a shelf or two. Maybe grab a hidden tape. Check the bulletin board.
3. **First game mode (5-12 min)** -- Friday Night Pick or a quiz mode. 2-3 rounds.
4. **Exploration (12-15 min)** -- Walk around, discover something new. Maybe try Prop Hunt.
5. **Deep session (15-25 min)** -- Talk to Vinny (free chat). Get a real recommendation. This is the heart.
6. **Wrap-up (25-30 min)** -- One more quick quiz round. Check your collection. See progress toward next rank.
7. **Exit (30 min)** -- Walk to the door. Vinny says "See you next Friday!" (or "tomorrow" if you have a streak).

The arc goes: **novelty -> engagement -> challenge -> connection -> satisfaction -> anticipation for next time**.

---

## 5. TECHNICAL ARCHITECTURE

### React Component Tree

```
GamePage (src/app/game/page.tsx)
  |
  +-- TitleScreen
  |     (shown when gameState === "title")
  |
  +-- StoreContainer (new wrapper)
        |
        +-- HUD (top bar: rank, XP, zone indicator, streak)
        |
        +-- StoreMap (always mounted, dims when overlay active)
        |     +-- BackWall (neon sign, posters, window)
        |     +-- ShelfRow1 (horror, scifi, comedy, drama)
        |     +-- ShelfRow2 (action, classics, family, new_releases)
        |     +-- StaffPicksShelf
        |     +-- TVSet (animated static, channel cycling)
        |     +-- Counter (register, bell, VHS stack)
        |     +-- VinnySprite (idle animations, expressions)
        |     +-- BulletinBoard
        |     +-- ArcadeCabinet
        |     +-- CardboardStandee
        |     +-- GumballMachine
        |     +-- FloorElements (rug, welcome mat, door)
        |     +-- NPCWalkers (ambient customers)
        |     +-- PropHuntOverlay (when prop hunt active, rendered IN the store)
        |     +-- CeilingLights
        |
        +-- OverlayContainer (portaled above StoreMap)
              +-- ShelfBrowser (genre: string)
              +-- DialogueBox (Talk to Vinny -- AI chat)
              +-- FridayNightPick (scenario -> genre -> films -> result)
              +-- QuoteChallenge
              +-- SynopsisChallenge
              +-- SceneChallenge
              +-- SoundtrackRound
              +-- PropHuntHUD (timer + found count -- when prop hunt active)
              +-- CollectionWall
              +-- BulletinBoardPanel (daily challenge, stats)
              +-- FilmDetailModal (TMDB film info)
              +-- ShiftSummary (end-of-session stats)
```

### State Management

All game state uses a single `useReducer` at the `GamePage` level. No external state library needed.

```typescript
interface GameState {
  // Core
  screen: "title" | "store";
  activeOverlay: OverlayType | null;  // which panel is showing
  overlayProps: Record<string, unknown>;  // props for the active overlay

  // Player
  xp: number;
  reputation: number;
  rank: string;
  taste: TasteProfile;
  artifacts: Set<string>;
  dailyStreak: number;

  // Session
  sessionScore: number;       // XP earned this session
  sessionRounds: number;      // rounds played this session
  sessionCorrect: number;     // correct answers this session
  currentStreak: number;      // active correct streak

  // Prop Hunt (special -- runs on the store, not in overlay)
  propHuntActive: boolean;
  propHuntTimeLeft: number;
  propHuntProps: PropPlacement[];
  propHuntFound: string[];

  // Store cosmetics
  storeEvolution: StoreEvolution;
  timeOfDay: "morning" | "afternoon" | "evening" | "night" | "latenight";
}

type OverlayType =
  | "shelf_browser"
  | "dialogue"
  | "friday_night_pick"
  | "quote_challenge"
  | "synopsis_challenge"
  | "scene_challenge"
  | "soundtrack_round"
  | "collection_wall"
  | "bulletin_board"
  | "film_detail"
  | "shift_summary";

type GameAction =
  | { type: "OPEN_OVERLAY"; overlay: OverlayType; props?: Record<string, unknown> }
  | { type: "CLOSE_OVERLAY" }
  | { type: "ADD_XP"; amount: number }
  | { type: "UPDATE_REPUTATION"; delta: number }
  | { type: "RECORD_ANSWER"; correct: boolean }
  | { type: "COLLECT_ARTIFACT"; id: string }
  | { type: "START_PROP_HUNT" }
  | { type: "FIND_PROP"; propId: string }
  | { type: "END_PROP_HUNT" }
  | { type: "TICK_PROP_TIMER" }
  | { type: "UPDATE_TASTE"; genre: string; filmTitle: string }
  | { type: "LOAD_SAVED_STATE"; state: Partial<GameState> };
```

### Persistence (localStorage)

All persistence uses localStorage with a unified key prefix `fnv_`:

```
fnv_xp          -> number
fnv_reputation  -> number
fnv_taste       -> TasteProfile (JSON)
fnv_artifacts   -> string[] (artifact IDs)
fnv_seen        -> string[] (seen question/scenario IDs)
fnv_streak      -> { daily: number, lastDate: string, current: number, best: number }
fnv_session     -> { entered: boolean }
fnv_chat_history -> ChatMessage[] (for Vinny dialogue persistence)
fnv_daily       -> { date: string, questionId: string, answered: boolean, correct: boolean }
```

The `useReducer` initializes from localStorage on mount and writes back on every state change (debounced 500ms to avoid thrashing).

### Store Layout Data Structure

```typescript
interface StoreElement {
  id: string;
  type: "shelf" | "furniture" | "decoration" | "interactive" | "npc_spawn";
  position: { top: number; left: number; width: number; height: number };  // percentages
  zIndex: number;
  clickAction: OverlayType | "prop_hunt" | "film_fact" | "exit" | null;
  clickPayload?: Record<string, unknown>;  // e.g., { genre: "horror" }
  visibleAtRank: string;  // minimum rank to show this element
  hoverLabel: string | null;
  ambientAnimation: string | null;  // CSS animation class name
}

const STORE_ELEMENTS: StoreElement[] = [
  {
    id: "shelf_horror",
    type: "shelf",
    position: { top: 12, left: 5, width: 12, height: 18 },
    zIndex: 3,
    clickAction: "shelf_browser",
    clickPayload: { genre: "horror" },
    visibleAtRank: "New Hire",
    hoverLabel: "HORROR",
    ambientAnimation: null,
  },
  {
    id: "tv_set",
    type: "interactive",
    position: { top: 12, left: 68, width: 18, height: 16 },
    zIndex: 3,
    clickAction: "friday_night_pick",
    clickPayload: {},
    visibleAtRank: "New Hire",
    hoverLabel: "FRIDAY NIGHT PICK",
    ambientAnimation: "tv-static",
  },
  // ... etc for all elements
];
```

This data-driven approach means the `StoreMap` component iterates over `STORE_ELEMENTS` and renders each one, checking rank visibility and wiring click handlers generically.

### Overlay/Panel System

All overlays share a common wrapper:

```typescript
function OverlayContainer({ active, type, onClose, children }: {
  active: boolean;
  type: "bottom-panel" | "center-card" | "fullscreen";
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Renders a backdrop (click to close) + the panel itself
  // Panel position/animation determined by `type`
  // ESC key always closes
}
```

**Panel types:**
- `bottom-panel`: Slides up from bottom. Used for: ShelfBrowser, DialogueBox, Friday Night Pick, Back of the Box, Collection Wall.
- `center-card`: Fades in centered. Used for: Name That Quote, Scene Description, Soundtrack Round, Shift Summary.
- `fullscreen`: Fades in covering entire viewport. Used for: Film Detail Modal.

### Mobile Considerations

**Current state:** Mobile D-pad exists in `PlayerSprite.tsx`. This is for the walkable store mode.

**For the new "store as interface" approach:**

The store is a click/tap interface, not a walk-around. Mobile users tap directly on store elements. The D-pad is removed in favor of direct touch.

**Touch targets:** Every clickable element must be at least 44x44px (Apple HIG minimum). Shelves are large enough. The counter bell, gumball machine, and VHS stack need enlarged touch targets (invisible `::after` pseudo-element extending the tap area).

**Responsive layout:**

| Breakpoint | Layout Change |
|------------|--------------|
| > 768px (desktop) | Full store view as designed. Overlays are 60-70% height. |
| 480-768px (tablet) | Store compresses slightly. Shelf labels shrink. Overlays are 75% height. |
| < 480px (phone) | Store view is scrollable vertically (but try to fit). Overlays are 90% height. Font sizes scale down via clamp(). |

The store-map container uses `aspect-ratio: 4/3` on desktop and `aspect-ratio: 3/4` on mobile to keep proportions.

---

## 6. VISUAL DESIGN SPEC

### Color Palette

**Primary (Store Structure):**
| Name | Hex | Usage |
|------|-----|-------|
| Deep Blue | `#0a1f44` | Walls, primary background |
| Blue Light | `#132d5e` | Wall highlights, lighter areas |
| Blue Dark | `#060f22` | Darkest shadow, store exterior |
| Floor Blue | `#1e2640` | Commercial carpet base |
| Floor Alt | `#1c2438` | Carpet pattern alternate |

**Wood (Shelves & Counter):**
| Name | Hex | Usage |
|------|-----|-------|
| Shelf Dark | `#6b4226` | Shelf base color |
| Shelf Light | `#8b5e3c` | Shelf highlights, edges |
| Counter Dark | `#3d2e1f` | Counter base |
| Counter Light | `#6a4a38` | Counter top surface |

**Accent (Neon & Highlights):**
| Name | Hex | Usage |
|------|-----|-------|
| Gold | `#ffd700` | Primary accent -- sign, borders, badges, achievements |
| Gold Dim | `#b8960a` | Muted gold for secondary elements |
| Neon Pink | `#ff3e7a` | Neon accents, error states |
| Neon Blue | `#00d4ff` | Neon accents, links, info |

**Genre Colors (Shelf Spines & Accents):**
| Genre | Hex | Spine Pattern |
|-------|-----|--------------|
| Horror | `#dc2626` | Dark red, irregular heights |
| Sci-Fi | `#3b82f6` | Electric blue, uniform heights |
| Comedy | `#f97316` | Warm orange, varied heights |
| Drama | `#1e40af` | Deep blue, tall uniform |
| Action | `#ef4444` | Bright red, chunky |
| Classics | `#b8960a` | Warm gold, shorter stacks |
| Family | `#22c55e` | Green, rounded edges |
| New Releases | `#ec4899` | Pink, shiny/glossy effect |
| Staff Picks | `#ffd700` | Gold with star icon |

**UI Panel Colors:**
| Element | Background | Border | Text |
|---------|-----------|--------|------|
| Panel background | `#0a1830` | `rgba(255,215,0,0.2)` | `#e8e0d0` |
| Button primary | `transparent` | `#ffd700` | `#ffd700` |
| Button hover | `rgba(255,215,0,0.15)` | `#ffd700` | `#ffd700` |
| Correct answer | `rgba(34,197,94,0.2)` | `#22c55e` | `#22c55e` |
| Wrong answer | `rgba(239,68,68,0.2)` | `#ef4444` | `#ef4444` |
| Badge (great) | `rgba(255,215,0,0.2)` | `#ffd700` | `#ffd700` |
| Badge (good) | `rgba(96,165,250,0.2)` | `#60a5fa` | `#60a5fa` |
| Badge (bad) | `rgba(239,68,68,0.2)` | `#ef4444` | `#ef4444` |

### Character Sizes and Proportions

All character art is pure CSS (no images). Sizes relative to the store-map container:

| Character | Width | Height | Scale Factor |
|-----------|-------|--------|-------------|
| Vinny (behind counter) | 48px | 72px | 1.4x base (he's the star) |
| NPC customer | 24px | 36px | 1.0x base |
| Cardboard standee | 32px | 56px | -- |

**Vinny detail level:** Full body visible from waist up (behind counter). Hair, head, eyes with pupils, eyebrows (animate-able), cheeks, nose, mustache, mouth (3 states: neutral/smile/open), neck, collar, vest with nametag and buttons, arms (2 positions: resting/gesturing), hands.

**NPC detail level:** Simplified. Head (skin + hair), torso (shirt color), legs (walk animation). 5 visual variants (skin/hair/shirt color combos). No facial features beyond a simple dot for eyes.

### Panel/Overlay Design Language

All panels share these traits:

1. **Background**: `#0a1830` with a very subtle noise texture (CSS background-image with a tiny repeating pattern at 2% opacity)
2. **Border**: 1px solid `rgba(255, 215, 0, 0.2)` with a `box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 215, 0, 0.02)`
3. **Border radius**: 8px on top corners (bottom panels), 8px all corners (center cards)
4. **Header**: Font pixel/monospace, gold text, with a thin gold separator line below
5. **Close button**: Top right, gold "X" or "ESC" text, no background
6. **Content text**: `#e8e0d0` (warm off-white, not pure white -- easier on eyes in dark theme)
7. **Transitions**: Enter 400ms `cubic-bezier(0.16, 1, 0.3, 1)`, exit 300ms `ease-out`

### Animation Specs

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Panel slide up | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(100%) -> translateY(0)` |
| Panel slide down | 300ms | `ease-out` | `translateY(0) -> translateY(100%)` |
| Card fade in | 300ms | `ease-out` | `opacity(0) + scale(0.95) -> opacity(1) + scale(1)` |
| Card fade out | 200ms | `ease-in` | Reverse of fade in |
| Store dim | 400ms | `ease-out` | `opacity(1) -> opacity(0.3)`, `blur(0) -> blur(2px)` |
| Store un-dim | 300ms | `ease-out` | Reverse of dim |
| Neon sign flicker | 4s | `ease-in-out` | Opacity varies: 1 -> 0.8 -> 1 -> 0.9 -> 1 (existing) |
| TV static | infinite, 100ms | `steps(8)` | `background-position` shift every frame |
| NPC walk | 3s per waypoint | `ease-in-out` | CSS `transition` on left/top |
| Vinny idle cycle | 6-10s | `ease-in-out` | Class swap between idle poses |
| Correct answer flash | 300ms | `ease-out` | Green glow pulse: `box-shadow` 0 -> intense -> subtle |
| Wrong answer flash | 300ms | `ease-out` | Red glow pulse, then dim |
| Score badge pop | 300ms | `cubic-bezier(0.68, -0.55, 0.27, 1.55)` | `scale(0) -> scale(1.15) -> scale(1)` |
| Prop shimmer | 3s | `ease-in-out` | `opacity: 0.6 -> 1.0 -> 0.6`, infinite |
| Prop found | 500ms | `ease-out` | `scale(1) + opacity(1) -> scale(1.5) + opacity(0)` + sparkle burst |
| Hover glow (any element) | 200ms | `ease-out` | `box-shadow: none -> 0 0 8px accent-color` |
| Click pulse | 150ms | `ease-out` | `scale(1) -> scale(0.95) -> scale(1)` |
| Ceiling light hum | 2s | `ease-in-out` | `opacity: 0.95 -> 1.0 -> 0.95`, staggered per light |
| Door swing (NPC enter/exit) | 400ms | `ease-in-out` | `translateX(0) -> translateX(3px)` + slight rotate |

### Typography

| Usage | Font | Size | Weight | Color |
|-------|------|------|--------|-------|
| Store signs | `--font-pixel` / "Press Start 2P" | `clamp(0.5rem, 1.5vw, 0.8rem)` | 400 | Gold |
| Panel headers | `--font-pixel` | `clamp(0.6rem, 2vw, 0.9rem)` | 400 | Gold |
| Vinny dialogue | system sans-serif | `clamp(0.85rem, 2.5vw, 1rem)` | 400 | `#e8e0d0` |
| Quiz questions | system sans-serif | `clamp(0.9rem, 2.5vw, 1.1rem)` | 600 | `#e8e0d0` |
| Movie quotes | system serif (Georgia/Times) | `clamp(1rem, 3vw, 1.3rem)` | 400 italic | `#e8e0d0` |
| Answer options | system sans-serif | `clamp(0.8rem, 2vw, 0.95rem)` | 400 | `#c8c0b0` |
| HUD text | `--font-pixel` | `clamp(0.4rem, 1vw, 0.6rem)` | 400 | Gold |
| Film titles (in browse) | system sans-serif | `0.75rem` | 600 | `#e8e0d0` |
| XP/Score numbers | `--font-pixel` | inherit | 400 | Gold |

---

## 7. BUILD ORDER (Revised from PLAN.md)

### Phase A: Store-as-Interface Rewrite (Current Priority)

The existing codebase has TWO separate systems: a walkable pixel store (`StoreMap`, `PlayerSprite`, `store-grid.ts`) and a menu-based game (`page.tsx` with `Screen` type). These need to merge into ONE system where the store IS the menu.

**Steps:**

1. **New `StoreContainer` component** -- Replace the current `page.tsx` branching logic. The store is always visible. Game modes are overlays.

2. **Refactor `StoreMap`** -- Remove the walkable grid dependency. Switch from "zones you walk to" to "elements you click". Keep all visual elements but make them click targets. Add new elements: TV, arcade cabinet, gumball machine, VHS stack, counter bell.

3. **Build `OverlayContainer`** -- Generic overlay wrapper with backdrop, panel positioning, ESC handling, transitions.

4. **Migrate game modes into overlay panels** -- Move Friday Night Pick, Quote, Synopsis logic from `page.tsx` into dedicated overlay components that render inside `OverlayContainer`.

5. **Add `useReducer` state** -- Single state atom for the entire game.

6. **Unified persistence** -- Merge the two localStorage systems (friday-night.ts vs game-data.ts).

7. **Remove PlayerSprite/D-pad** -- No longer walking around. Pure click interface.

8. **Remove `store-grid.ts`** -- Grid collision is no longer needed.

### Phase B: Visual Polish

1. TV set with static animation
2. Vinny idle animation cycle
3. Store evolution based on rank
4. Time-of-day window gradient
5. Ceiling light ambient effects
6. NPC route improvements (browsing pause behavior)

### Phase C: New Game Modes

1. Scene Description challenge (content + component)
2. Soundtrack Round (content + component)
3. Prop Hunt (store integration, prop placement, timer)

### Phase D: Collection & Progression

1. Expanded artifact system (50 items)
2. Collection Wall component
3. Reputation system
4. Store evolution rendering
5. Daily challenge system (bulletin board)

### Phase E: Social & Polish

1. Shareable recommendation cards
2. Daily trivia (same question for all -- requires a deterministic seed based on date)
3. Session summary / shift review
4. Audio (optional, progressive enhancement)

---

## 8. NEW FILES TO CREATE

```
src/lib/
  store-elements.ts      <- StoreElement[] data, click mappings, positions
  store-evolution.ts     <- Rank -> visual changes mapping
  reputation.ts          <- Rep score, effects, persistence
  artifacts.ts           <- Full 50-item artifact definitions (expand collectibles.ts)
  scene-data.ts          <- Scene description challenges
  soundtrack-data.ts     <- Soundtrack round challenges
  prop-hunt.ts           <- Prop definitions, placement algorithm, timer logic
  daily-challenge.ts     <- Date-seeded daily question selection
  game-reducer.ts        <- useReducer state + actions + reducer function
  game-persistence.ts    <- Unified localStorage read/write, debounced save

src/components/game/
  StoreContainer.tsx     <- Main game wrapper (replaces page.tsx branching)
  OverlayContainer.tsx   <- Generic panel/overlay wrapper
  TVSet.tsx              <- Animated TV with static + channel cycling
  CounterBell.tsx        <- Bell with click animation
  ArcadeCabinet.tsx      <- Arcade machine visual
  GumballMachine.tsx     <- Gumball machine visual + interaction
  CardboardStandee.tsx   <- Rotating film standee
  FridayNightPick.tsx    <- Extracted from page.tsx, runs as overlay
  QuoteChallenge.tsx     <- Extracted from page.tsx quote mode
  SynopsisChallenge.tsx  <- Extracted from page.tsx synopsis mode
  SceneChallenge.tsx     <- NEW: scene description game mode
  SoundtrackRound.tsx    <- NEW: soundtrack guessing game
  PropHuntOverlay.tsx    <- NEW: HUD + prop placement for prop hunt
  CollectionWall.tsx     <- NEW: artifact collection display
  BulletinBoardPanel.tsx <- NEW: daily challenge, stats, notes
  ShiftSummary.tsx       <- NEW: end-of-session recap
  VinnyExpressions.tsx   <- NEW: expression variants for portrait
```

### Files to Modify

```
src/app/game/page.tsx         <- Simplify to just mount StoreContainer
src/app/game/game.css         <- Add new element styles, overlay transitions
src/components/game/StoreMap.tsx   <- Refactor to click-based, add new elements
src/components/game/HUD.tsx        <- Add rank, XP bar, streak, daily indicator
src/components/game/VinnySprite.tsx <- Add expression states, idle animations
src/components/game/NPCWalker.tsx  <- Add browsing-pause behavior
src/components/game/DialogueBox.tsx <- Add Vinny expression integration
src/lib/friday-night.ts       <- Keep data, add scene + soundtrack content
src/lib/collectibles.ts       <- Expand to full artifact system (or replace with artifacts.ts)
```

### Files to Remove (After Migration)

```
src/lib/store-grid.ts          <- Grid collision no longer needed
src/components/game/PlayerSprite.tsx  <- Walking removed
```

---

## 9. CRITICAL DESIGN DECISIONS

### Decision 1: Click vs Walk

**Choice: Click interface (not walkable).**

Rationale: The walkable store is cool in concept but creates friction. You have to navigate to each element. On mobile, the D-pad is clunky. The click interface lets you access any game mode in one tap. The store still LOOKS like a walkable space -- you just interact with it differently.

The store visual gives you the spatial feeling. The click interaction gives you the speed.

### Decision 2: Overlays vs Scene Changes

**Choice: Overlays on top of dimmed store.**

Rationale: If you navigate away from the store, you lose the spatial anchoring. The store should always be peeking through. When you're doing a quiz, the dimmed shelves behind remind you WHERE you are. This is the VA-11 HALL-A approach -- one room, everything comes to you.

### Decision 3: Unified State vs Per-Mode State

**Choice: Single `useReducer` at GamePage level.**

Rationale: With 7+ game modes and shared progression (XP, reputation, streaks, artifacts), distributed state creates sync bugs. One reducer, one source of truth, clean dispatch from any component.

### Decision 4: No New Dependencies

**Choice: Pure CSS animations, no canvas, no animation libraries.**

Rationale: The existing codebase is dependency-light (Next.js + React + Tailwind + OpenAI). Adding Framer Motion, Pixi.js, or similar would bloat the bundle and add complexity. Every animation in this spec is achievable with CSS transitions and keyframes. The pixel art aesthetic actually benefits from the slightly "stiff" quality of CSS animations.

### Decision 5: localStorage, Not a Backend

**Choice: All persistence stays client-side.**

Rationale: This is a single-player experience. No leaderboards (yet). No user accounts (yet). localStorage is instant, offline-capable, and zero-cost. The Convex backend in the project is for potential multiplayer later -- don't couple to it now.

---

## 10. CONTENT NEEDS

To fully populate this game, you need:

| Content Type | Current Count | Target Count | Notes |
|-------------|--------------|-------------|-------|
| Friday Night Pick scenarios | 8 | 20 | More diverse situations |
| Movie quotes | 10 | 30 | Mix popular and deep cuts |
| Synopsis challenges | 5 | 20 | Vary difficulty |
| Scene descriptions | 0 | 15 | NEW -- vivid scene writing needed |
| Soundtrack descriptions | 0 | 10 | NEW -- Vinny-voice music descriptions |
| Trivia questions | 10 | 40 | Scale with difficulty tiers |
| Customer requests | 8 | 15 | More personality types |
| Prop definitions | 0 | 30 | Icon descriptions + hiding spots |
| Artifact definitions | 12 | 50 | Unlock conditions + Vinny monologues |
| Vinny greetings | 1 | 10 | Rotate based on time, streak, rank |
| Vinny idle quotes | 0 | 20 | Random one-liners while browsing |
| Film fun facts | 0 | 30 | For the cardboard standee interaction |

All content should be written in Vinny's voice where applicable. Film data comes from TMDB API for browse/detail; quiz content is hand-authored for quality control.
