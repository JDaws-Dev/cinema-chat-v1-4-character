# Friday Night Video — Claude Code Project Guide

## What this is

A 3D Blockbuster-style video store game. Player walks in, finds movies, talks to Vinny (LLM clerk), checks out, goes home to an apartment to rewind tapes, then comes back for the next visit.

**Two live surfaces:**
- **`/game`** — the original React Three Fiber build. Polished, has Vinny chat, apartment scene, challenges, dialogue NPCs. Still the canonical R3F implementation.
- **`/v2`** — a Unity 6 / URP rebuild deployed as a WebGL bundle from `cinema-chat-unity/`. Lighter mechanic set (FPS controller, raycast pickup, drop-where-they-belong, Backrooms portal), but has the spatial bones and a working "arrival in the parking lot" moment. Active development as of 2026-06-02.
- **`/layout-editor`** — top-down drag-and-drop editor (gondolas, counter, NPCs, cars, parking lot, strip-mall buildings, floor decal). Outputs JSON that gets applied to the Unity scene.

**Stack:** Next.js 16 + React 19 + React Three Fiber (R3F build), Unity 6 + URP (v2 build), Convex, OpenAI (Vinny chat), ElevenLabs (TTS), TMDB (movies + posters), localStorage persistence.

**Live:** [www.fridaynightvideo.app](https://www.fridaynightvideo.app)

## Active direction (2026-06-02)

The project is mid-transition. Three threads in parallel:

1. **Unity v2 maturity.** The Unity port has rough parity with R3F for the *spatial* loop (walk in, browse, pick up tapes, return them to matching shelves, enter the Backrooms via the Employees Only door) and the *arrival moment* (parking-lot spawn → storefront sign → warm interior). Polishing layout + lighting via `Tools/FNV/Capture Security Cams` and `/layout-editor` — see memory `reference_r3f_to_unity_port_lessons.md` for the prioritized port queue.

2. **Personal-collection pivot.** Strategic decision 2026-06-01 to stop catalog-faking with TMDB and use Jeremiah's actual film archive (`/Users/jeremiahdaws/Projects/DEMO REEL/public/movies.html`: 50-film Letterboxd diary + 966-film library). Full phased plan in `TRANSITION-PLAN.md`. Not started yet — gated on v2 being in a "feel-right" state first.

3. **Feel-first vibe work.** Per the 2026-05-29 pause, level-geometry yak-shaving is officially out of the budget. Every commit needs to move the *felt* experience. See memory `feedback_evaluate_by_feel.md`.

The R3F `/game` build is in maintenance — it works, but new feature development now targets `/v2` (which is closer to the long-term Unity-native direction).

## Vision & success criterion (2026-05-29)

**The inspiration is the *feeling* of being in a Blockbuster on Friday night.** This is a vibe piece, not an RPG. Closest reference points: *Hypnospace Outlaw*, *Off-Peak*, *The Norwood Suite*, *Coffee Talk*. Place is the protagonist.

**Old success metric (deprecated):** does the geometry not glitch, does the gameplay loop tighten.
**New success metric:** when a first-time player drops in cold, do they go quiet for a second?

A polish commit that does not move the felt experience does not count as progress. The strategic risk is that level-geometry yak-shaving (recent two months of commits) crowds out feel-work, which is where the IP actually lives.

## Backlog — ordered by feel-per-hour (paused 2026-05-29)

Audit identified a sensory inventory of what makes a Friday-night Blockbuster *feel* like one. Items below are missing or weak in the current build, ordered by impact. Resume here:

1. **Arrival moment.** 30-second authored choreography from parking lot → door bell → warm spill → fluorescent buzz up → radio up → customer brushes past. Highest single-item value.
2. **Time pressure / anticipation.** Wall clock at 6:47pm, growing counter line, Vinny says "closing in 20." Stakes from nothing — you're picking *tonight's* movie.
3. **Ambient soundscape layer.** Distant top-40 radio, HVAC drone, fluorescent flicker, carpet footsteps, kid asking for *Land Before Time*, register beep, VHS clack. 5–6 independent ambient sources separate from NPC lines.
4. **Bring back strip-mall life.** FOR LEASE storefront is anti-feel ("this place is dying"). Restore Pizza Palace / Hollywood Video competitor / something as warm-window ambience only — no interaction needed.
5. **Fix the immersion-pops from the eval** (see "Eval findings" below). Broken atmosphere is worse than no atmosphere.
6. **The drive home.** Even a fixed-shot cutscene — tape on passenger seat, suburban houses going past, your apartment light on. Closes the emotional loop.

## Eval findings — 2026-05-29 capture pass

From `node scripts/capture-security-cams.mjs` against current `main` (60c0e1a):
- **Mirrored billboard labels** (YNNIV / EILRAHC / OPEN). Root cause: drei's `<Billboard>` tracks the main R3F camera via `useFrame`; `SecurityCameras.tsx` renders with a secondary camera via `gl.render(scene, cam)` that bypasses the frame loop. Fix: call R3F's `advance(t, true, scene, cam)` before each `gl.render` so all `useFrame` subscribers re-evaluate with the capture camera. *Note: this is a capture-script bug, not a runtime bug — labels are correct in the live game. But it makes the capture script lie, which is dangerous.*
- **Back third of store is near-black** in `overhead.png`, `back_wall.png`, upper half of `ceiling_back.png`. Needs a second ceiling light at z ≈ −3 or an intensity bump.
- **NEW RELEASES wall is sparse** — only ~5 posters across the whole back wall in `back_wall_face.png`. Investigate slot count vs TMDB fetch.
- **`overhead.png` is pointed up at ceiling, not down.** No true plan-view debug cam exists. Cheap to add.
- **`vacant_front.png`** — pitch-black interior behind FOR LEASE placard reads as render failure. See backlog item 4 (replace the whole storefront instead).
- **`back_alley.png`, `service_doors.png`** — nearly pure black. Add a dim sodium lamp if keeping; cheaper to never camera in here.

All 24 capture PNGs in `/tmp/fnv-cams/` at pause time.



## Game state — what's IN, what's OUT (2026-06-02)

### R3F build (`/game`) — shipped & in maintenance

- Email-only login (splash screen)
- Era selector (late 80s, early/mid/late 90s, present)
- 3D store with 14 gondolas, each owning one genre, both sides same
- NEW RELEASES wall (back of store)
- Vinny clerk with full LLM freeform chat (no XP gate)
- Vinny menu (E key): Check out · Ask for a recommendation · Just chat · Start a challenge · Take a return-tape shift
- Charlie regular at the shelves (gives challenge hints)
- Earl at the laundromat (decorative)
- Customer NPCs walking the aisles, ambient overheard dialogue
- 4 challenges: Movie Night · Speed Run · Vinny's Mystery · Return Shift
- Drop-where-they-belong: E on a matching-genre shelf returns a held tape
- Apartment scene after checkout: living room + bedroom + VCR + door
- Rewind mechanic: pick tape from counter, walk to VCR, press E
- Vinny "you didn't rewind last time" callback at next visit
- TMDB poster auto-fetch with disk cache (`public/images/posters/<id>.jpg`)
- Trophy props (visual collection on the right wall)

### Unity v2 (`/v2`) — active build

**Shipped:**
- Parking-lot spawn at `(3, 1.55, 11)` facing the storefront (the arrival moment)
- 14 gondolas in a 4-row × 4-col grid, each named `Gondola_<genre>` with matching `VHS_<genre>_<id>` children
- NEW RELEASES centerpiece — 3m featured display under a 4m marquee, 16 tapes in 4 movie clusters at canonical scale `(0.14, 0.23, 0.03)`
- Cashier counter parallel to storefront on the left side, monitors facing the window
- Employees Only door at back-left corner, opens into the Backrooms scene
- Pizza Palace and Laundromat as ambient strip-mall facades (no interaction)
- Street + curb in front of parking lot with dashed centerline
- 6 parked cars + Car_Arriving + Car_PassBy + 5 user-placed extras
- 6 zone-pool point lights (back/mid/front aisles, NEW RELEASES, counter at `#ffc888` warmest)
- FirstPerson controller with WASD + mouse look + crouch toggle (LCtrl/C) + jump
- Mobile UX: TAP TO ENTER start screen, virtual joystick + look pad + GRAB + JUMP buttons
- VHS pickup via raycast (pierces `_BlockerFront` shelf colliders)
- Drop-where-they-belong: hold a tape, aim at the matching `Gondola_<genre>`, HUD reads `[E] return to <genre> shelf`
- Editor tooling: `Tools/FNV/Build Employees Door + Portal` · `Tools/FNV/Audit + Fix Sign Orientation` · `Tools/FNV/Capture Security Cams` (11 canonical PNGs to `Assets/Screenshots/cams/`)
- Runtime `TextDepthFixer` enforces `ZTest LessEqual` on all 3D text so signage no longer bleeds through opaque walls (glass still shows through)
- `/layout-editor` web UI: drag-and-drop, multi-select, align/distribute, undo (Cmd-Z), duplicate (Cmd-D), absolute-yaw presets, building rotation, FloorDecal resize. Outputs JSON; applied to scene via `execute_code`.

**Unity v2 missing vs R3F (queued, ranked by feel-per-hour):**
- NPC height-variance (squat/eye-level/reach-up for browse animations)
- Ambient overheard dialogue pairs with world-space speech bubbles
- Vinny clerk + menu + chat
- Era selector + apartment scene + rewind mechanic
- Challenges (Movie Night, Speed Run, etc.)
- Post-processing (Bloom/Vignette/ChromaticAberration desktop-only)

### Removed / intentionally absent (in both)
- Pizza Palace + Tony as a *rentable* second store (cut from R3F to avoid esthetic creep; Pizza facade kept in Unity as ambient strip-mall only)
- XP / Tier (Bronze/Silver/Gold) UI surfaces — state exists but never rendered
- Quest log surface — merged into Vinny's "Start a challenge"
- Weekly challenges UI — file exists but unimported
- WatchAtHomeOverlay — superseded by the Apartment scene

## Architecture

- **Runtime (R3F path):** Next.js 16 + React 19 + React Three Fiber + Three.js
- **Runtime (v2 path):** Unity 6 + URP, exported as WebGL to `public/v2/`; React shell at `src/app/v2/page.tsx` mounts the Unity instance and bridges mobile touch to the FPS controller via `unityInstance.SendMessage`
- **Style:** Low-poly box geometry, PBR materials, Blockbuster-inspired palette
- **State:** React hooks + localStorage. No database.
- **Routes:** `/game` (R3F 3D), `/v2` (Unity 3D), `/layout-editor` (top-down scene editor), `/chat` (chat-only with Vinny), `/editor/3d` + `/editor/dual` (R3F debug)
- **Unity project:** `/Users/jeremiahdaws/Projects/jarvis-builds/cinema-chat-unity` (separate git repo, initial commit `aa8f886`). Scene of record: `Assets/Scenes/Arrival.unity` (build index 0); `Assets/Backrooms/Scenes/Backrooms.unity` (build index 1).

## Art style & scale

- **Aesthetic:** Stylized 1990s Blockbuster — warm, nostalgic, slightly cartoonish
- **Scale:** 1 unit = 1 meter. Y is UP. Position = CENTER of geometry (use SmartBox to avoid this).
- **Colors:** Navy walls (`#223663`), gold accents (`#ffd700`), warm brown shelves (`#7a5a30`), cream apartment walls (`#e6dac3`)
- **Materials:** Use `Mat` component (PBR `meshStandardMaterial` cached by param set) from `store-materials.tsx`
- **Lighting:** Warm fluorescent (store), warm ambient (apartment). Max 6 lights per zone.

## 3D Positioning Helpers (`src/components/game3d/helpers.tsx`)

- **SmartBox:** position Y = BOTTOM, not center. `<SmartBox size={[2,3,0.2]} position={[0,0,-5]} />`
- **PivotBottom:** wraps children so Y=0 means floor. `<PivotBottom height={3} position={[0,0,0]}>`
- **WORLD_ANCHORS:** named reference points. `offsetFrom(WORLD_ANCHORS.VIDEO_STORE_ENTRANCE, [2,0,0])`
- **BUILDING_CODES:** real measurements. `BUILDING_CODES.COMMERCIAL_CEILING` = 3.5m
- **snapToGrid(val, 0.5):** prevents magic decimals

## Building codes (non-negotiable)

- Doors: 0.91m × 2.03m (residential), 1.07m × 2.13m (commercial)
- Ceilings: 3.5m (commercial), 2.6m (apartment)
- Walls: 0.2m (interior), 0.3m (exterior)
- Person: 1.7m, Eye level: 1.6m
- NEVER use raw `<mesh>` for furniture — use SmartBox or PivotBottom

## File structure

- `src/app/game/page.tsx` — main game page; composes Canvas + HUD + overlays + state hooks
- `src/components/game3d/` — 3D scene components (Store, SimpleApartment, NPCManager, FirstPerson, Interaction)
- `src/components/game3d/prefabs/` — layout-driven prefab rendering (LayoutDrivenPrefabs.tsx)
- `src/components/game/` — 2D UI overlays (HUD, ChallengeHUD, ReturnShiftHUD, all *Overlay.tsx)
- `src/hooks/` — game logic hooks (useInventory, useChallenge, useReturnShift, useDialogue, useInteraction, useOverlay)
- `src/lib/` — game state, audio, NPC scripts, TMDB integration, store layout
- `src/app/api/` — backend routes (chat, tts, search, catalog-poster)
- `scripts/capture-security-cams.mjs` — headed Chromium harness; dumps 23+ scene captures to `/tmp/fnv-cams/`

## Store layout

`src/lib/store-layout.ts` is the single source of truth for placed objects (gondolas, counter, props, doors). Each gondola has `meta.genre` (front) and `meta.backGenre`. Genre keys must come from the curated catalog set:

```
action, adventure, classics, comedy, drama, family, fantasy,
horror, kids, musical, romance, scifi, thriller, western
```

Other genre names (war, animated, mystery, crime) produce empty/fallback content because the curated era catalog has no entries for them.

## Verification — required for visual changes

```bash
npm run dev                                  # in one terminal
node scripts/capture-security-cams.mjs       # in another
```

Reads/writes `/tmp/fnv-cams/`. The script pre-seeds `localStorage.fnv_user_email` so it can blow past the splash. Use the `Read` tool on the PNGs to inspect.

For 3D bugs: do the geometry math from numbers (position + size + rotation), don't trust comments. `PlaneGeometry` without rotation is a horizontal slab in XY by default — not a wall. `side={DoubleSide}` masks orientation bugs.

## Performance budget

- Max ~10 dynamic NPCs (desktop), 5 (mobile)
- Max 6 lights per zone
- No real-time shadows (too expensive)
- Post-processing: desktop only (Bloom, Vignette, ChromaticAberration)
- Target: 30+ FPS on mid-range laptop
- Prefer InstancedMesh for repeated objects (VHS boxes via `InstancedVHSBoxes`)
- Reuse materials — `Mat` already does shared-material caching

## What "Done" means

1. `npx next build` passes with zero errors
2. Visual QA: run capture-security-cams + read the PNGs (or hit the dev server)
3. No z-fighting, floating objects, invisible geometry
4. Works on desktop (mobile is best-effort)
5. No new performance regressions

## Naming conventions

- Components: PascalCase (`Store`, `SimpleApartment`, `NPCManager`)
- Hooks: camelCase with `use` prefix (`useChallenge`, `useReturnShift`)
- Lib files: kebab-case (`vhs-state.ts`, `store-layout.ts`)
- CSS classes: `g3-` prefix (`g3-hud`, `g3-overlay`, `g3-crosshair`)

## Key constraints

- OpenAI: gpt-4o-mini for Vinny chat only
- ElevenLabs: `eleven_flash_v2_5`, disk-cached at `.tts-cache/`
- TMDB: real movies only, era-filtered. Catalog at `src/lib/curated-movie-catalog.ts` + `generated-era-catalog.ts`. Posters auto-fetch via `/api/catalog-poster` with disk cache.
- Visual changes MUST be verified before reporting done

## Three fatal 3D mistakes (learned the hard way)

1. **Trusting comments over geometry math.** A comment saying "right wall at x=-10" can hide a slab running across z=0.
2. **`side={DoubleSide}` on geometry that doesn't need it.** It hides orientation bugs and overwrites adjacent surfaces (e.g., painting brown over a blue store wall).
3. **Speculative dimension edits before identifying the culprit.** Bisect with debug colors first — paint each suspect mesh a unique bright color, capture, identify. Then fix once.

See `DESIGN-3D-ARCHITECTURE-METHODOLOGY.md` for the full methodology.

## Audio + subtitle pipeline

- `playVinnyLine(text, speaker)` — Vinny / Charlie / Tony / Earl voice. Hits `/api/tts`, plays via Web Audio buffer source. Fires the global subtitle handler.
- `playNpcLine(npcId, text, personalityType)` — generic NPC voice with spatial panning. Same subtitle path. `personalityType` falls back to `"movie_buff"` if unset (so RPG dialogue still speaks).
- `playSFX(name)` — short clips from `public/sounds/`.
- `playRandomLine(category)` — pre-rolled Vinny lines (greetings, checkout, challenge_start, etc.).
- `setSubtitleHandler(cb)` — single global callback. Only ONE component should register; `useAudioUI` does this in `game/page.tsx`. Don't override it elsewhere.

## Save state keys (localStorage)

- `fnv_user_email` — splash login
- `fnv_vhs_state` — tape inventory + rewind state. Stale "held" tapes downgrade to "on_shelf" on load.
- `fnv_last_rewound` — `"true"` / `"false"` / `"acknowledged"`. Vinny scolds on next visit if `"false"`.
- `fnv_messages` — chat history (`/chat` route)
- `fnv_preferences` — extracted user preferences from chat
- `fnv_watchlist` — saved movie ids
- `fnv_retro_mode` — pixelation effect toggle

## Deploy

Vercel project `cinema-chat-v1-4-character`, custom domain `www.fridaynightvideo.app`. Run `vercel --prod` from repo root.

## When delegating to codex

`/codex consult` is wired in. Hand it a self-contained spec — it doesn't have the conversation context. The "Return Shift" challenge was built this way; spec lives at `/tmp/job-challenge-spec.md` (regenerate per task). The user's ChatGPT-account auth doesn't accept `gpt-5.5-codex` models — fall back to default unless the user has `OPENAI_API_KEY` set.
