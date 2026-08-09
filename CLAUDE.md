# Friday Night Video — Claude Code Project Guide

## What this is

A 3D Blockbuster-style video store game. Player walks in, finds movies, talks to Vinny (LLM clerk), checks out, goes home to an apartment to rewind tapes, then comes back for the next visit.

**Two live surfaces:**
- **`/game`** — the original React Three Fiber build. Polished, has Vinny chat, apartment scene, challenges, dialogue NPCs. Still the canonical R3F implementation.
- **`/v2`** — a Unity 6 / URP rebuild deployed as a WebGL bundle from `cinema-chat-unity/`. Lighter mechanic set (FPS controller, raycast pickup, drop-where-they-belong, Backrooms portal), but has the spatial bones, a working "arrival in the parking lot" moment, filmic post-processing, and an alphabetized, sign-posted store. Active build (last commit 2026-06-04; live-evaled 2026-06-09 — loads and plays headless, see eval notes below).
- **`/layout-editor`** — top-down drag-and-drop editor (gondolas, counter, NPCs, cars, parking lot, strip-mall buildings, floor decal). Outputs JSON that gets applied to the Unity scene.

**Stack:** Next.js 16 + React 19 + React Three Fiber (R3F build), Unity 6 + URP (v2 build), Convex, OpenAI (Vinny chat), ElevenLabs (TTS), TMDB (movies + posters), localStorage persistence.

**Live:** [www.fridaynightvideo.app](https://www.fridaynightvideo.app)

## Active direction (2026-07-25) — v3 web rebuild

**Repo moved.** This project now lives at `/Users/jeremiahdaws/Projects/friday-night-video` (was `jarvis-builds/cinema-chat`, which had been relocated to `/Volumes/Daws_SSD/Artios-Migration/...`). The SSD copy is still present as a backup. **The 8 commits from `ac98609`→`8af1388` — all of the Unity v2 work — are local-only and have never been pushed to `origin`.**

**Decision (2026-07-25): build a v3 on the web/R3F stack, not Unity.** The reason is iteration loop, not rendering ceiling: on the web build the whole cycle (change → run → screenshot → judge → fix) is self-contained, whereas every Unity visual change needs the Editor open and a ~5-minute WebGL rebuild. For a project whose success metric is a *feel* question, the fast loop wins. Unity v2 (`cinema-chat-unity`, 18 GB, on the SSD) is parked, not deleted.

**Order of work:** (1) visual quality bar, (2) liveliness, (3) content. The catalog stays the fictional era-curated TMDB set for now — the personal-collection pivot is deferred until the place looks right. See `TRANSITION-PLAN.md`.

**v3 shape:** a new `/v3` route in this repo sharing `src/lib/` (catalog, game state, audio) so it's a new render layer over existing work rather than a third parallel build.

**⚠️ Most of the v3 foundation list was done in-place on `/game` instead (2026-08-07, commit `9a37e65`).** Rather than stand up a parallel route, the render work landed directly in the existing build. Status of the original five:

1. ~~Poster-atlas instanced material.~~ **Not needed for the stated reason, and not urgent.** Shelf tapes already carry real poster art — `PosterBox` maps the catalog poster onto each tape; the solid-colored `InstancedVHSBoxes` path is only the fallback for slots past the end of a thin genre's catalog, and that list now wraps so it rarely triggers. The remaining case for an atlas is draw-call count on mobile, not visuals. Measured: ~2500 draws at spawn, holding ~57 FPS on desktop.
2. ~~Toon → PBR, tonemapping, one shadow key, warm pooled fill.~~ **Done.** The store was already PBR (`Mat` is a `MeshStandardMaterial` cache; `toonGradientTexture` is a null stub); the last toon holdouts were the shelf boards, now converted. R3F already defaults to ACESFilmic — no tonemapping change was ever needed. One overhead shadow-casting directional added, zone lights rebalanced to pool.
3. ~~Drop exterior ambient so the storefront glows into the lot.~~ **Done.** Interior ambient 1.1 → 0.18, dropped the daylight directional, exterior lights rescaled, sodium pole lamp added.
4. ~~Bloom on neon + signage, grain, vignette.~~ **Mostly pre-existing and now effective.** `PostEffects.tsx` always had bloom at `luminanceThreshold 0.8`; it did nothing because ambient washed everything to a similar luminance. It started working the moment the lights came down — no post-processing change was required.
5. ~~Billboarded labels → physical signs.~~ **Resolved by deletion.** The floating NPC nametags are gone; the `[E] TALK TO …` prompt does the wayfinding. Aisle signs are real geometry with a bezel and depth.

**De-boxing pass (2026-08-07/08).** The store was built entirely from axis-aligned `BoxGeometry`, which is most of why it read as blocky regardless of lighting: a sharp 90° edge between two faces at similar angles produces almost no value change, so boxes collapse into flat silhouettes. A small bevel gives each corner a band angled differently from both faces, which catches a highlight and *draws* the edge. Done so far:

- **Gondolas** — bevelled boards, top caps and end posts; front price rails on every shelf face (both sides — they're double-sided). End posts are deeper than the shelf and taller than the carcass so the unit has a frame rather than a sheared edge.
- **Signage is now one system.** Aisle signs, gondola-top genre panels, and wall-run genre signs all use the same construction: a gold bezel with real depth and a navy face raised proud of it. Previously all three were ~0.02-thick decals. Aisle signs also hang from two cylindrical rods at the quarter points instead of one square rod at the centre of a 6.2m sign.
- **Wall-run shelving** — bevelled boards + front rail, bezel sign.
- **Ceiling fixtures** — bevelled housing/diffuser, and the lit element is a **cylinder**, not a box. It's the brightest object in the room, so it's what bloom picks up and its silhouette gets seen more than almost anything else.
- **VHS tapes** — bevelled, and `PosterBox` now uses one shared geometry instead of allocating a fresh `BoxGeometry` per tape.
- **NPCs** — see the character notes; heads trimmed, neck + shoulder yoke added, limbs bevelled, eyes flattened from protruding spheres to discs on the face plane.

**⚠️ Recurring bug — poster slot indexing.** Shelf code indexes a genre's poster list by slot number, but `getCuratedShelfPosterData` returns only a *slice* of the genre catalog per placement. When the slice is shorter than the slot count the tail falls through to solid-colored placeholder boxes. This has now been found and fixed **twice** — gondolas (`sideIdx % sidePosters.length`) and wall runs (`wallIdx % posters.length`). If you see flat navy tapes anywhere, look for a third instance before theorizing about materials or lighting.

**Still open on the visual bar:** storefront trim and window frames are still hard boxes. Store dressing is sparse (no standees, danglers, ceiling banners, games section) — emptiness reads as unfinished no matter how well lit. Palette skews brown-navy; Blockbuster's identity was saturated blue and gold. Character faces are crude at conversation range even after the eye fix.

## Superseded direction (2026-06-09) — kept for history

The project is mid-transition. Three threads in parallel:

1. **Unity v2 maturity.** The Unity port has rough parity with R3F for the *spatial* loop (walk in, browse, pick up tapes, return them to matching shelves, enter the Backrooms via the Employees Only door) and the *arrival moment* (parking-lot spawn → storefront sign → warm interior). Polishing layout + lighting via `Tools/FNV/Capture Security Cams` and `/layout-editor` — see memory `reference_r3f_to_unity_port_lessons.md` for the prioritized port queue. **Recently shipped (2026-06-02→04):** NEW RELEASES rebuilt as a 10m densely-stocked wall (new-release titles only); filmic post-processing (the `PostFX_Store` volume profile — it was wired but had no profile, which was the single biggest visual jump — see memory `reference_v2_rendering_levers.md`); VHS tapes alphabetized A–Z within each gondola and seated back against the shelf spine; genre top-cap labels snapped onto the gondolas (both faces). **Next-biggest visual levers:** lighting rebalance + tape gloss/materials; verify post-processing perf on mobile. **2026-06-09 live eval:** v2 loads clean (splash → exterior in ~20s even headless) and the store reads stocked, but the interior renders washed-out/milky (suspects: `postExposure 0.32` + ambient 0.85 + bloom stacking — verify in a real browser first, headless GPU may exaggerate it), and the exterior marquee has dark quads overlapping the sign text (covers the G in NIGHT + part of the tagline — real geometry overlap). Also verify the storefront glass has a collider: a headless player reached the interior from spawn with nothing but W held.

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

## ⚠️ CORRECTION (2026-07-25) — the lighting diagnosis below is WRONG

Re-verified against `8af1388` using **real player-viewport screenshots** (`scripts/capture-player-view.mjs`) rather than the security-cam harness. The store does not have a lighting problem. Three corrections, in order of how much wasted effort they explain:

1. ~~**Shelf tapes cannot show posters — there is no poster material on them.**~~ **ALSO WRONG (corrected 2026-08-07).** `InstancedVHSBoxes` is only the *placeholder* path. The real renderer is `PosterBox` in `store-materials.tsx`, which maps the catalog poster onto every tape that has one — gondola tapes included, not just wall displays. Solid blocks appeared only where a genre's catalog slice ran shorter than the shelf's 15 slots. See the corrected item 2 above.
2. ~~**`MeshToonMaterial` is why the whole store reads flat.**~~ **WRONG (corrected 2026-08-07).** The store was already PBR when this was written — `Mat` is a `MeshStandardMaterial` cache and `toonGradientTexture` is `export const toonGradientTexture = null`, a legacy stub. The only real toon holdouts were the shelf boards (toon-shaded with a *null* gradient, so effectively flat unlit brown), now converted. What actually made the store read flat was `ambientLight intensity={1.1}` drowning the zone lights. **Do not re-plan a toon→PBR conversion; it happened.** The branch where everything was cel-shaded is `prefab-editor-phase1`, which is 104 commits behind and unmerged.
3. **"Back third of store is near-black" is a capture artifact, not a runtime fact.** `capture-security-cams.mjs` renders via a secondary camera (`gl.render(scene, cam)`) that bypasses R3F's frame loop; several interior cams return uniform navy with zero geometry in frame. In the live player view the interior is evenly lit — arguably *too* evenly. **Do not trust the security-cam harness for lighting judgements.**

**Real visual problems, ranked by damage (player-view evidence, 2026-07-25) — ALL FOUR FIXED 2026-08-07 in `9a37e65`:**
1. ~~**Billboarded labels at absurd screen scale.**~~ Fixed by removing the floating nametags entirely. Note the diagnosis was wrong: they weren't mis-scaled, they were `fontSize={0.1}` and physically correct — Charlie simply walks close enough that 10cm of text fills the frame. Either way it read as debug UI.
2. ~~**Every shelf tape is a flat colored block.**~~ **This was never true.** `PosterBox` has always mapped real poster art onto tapes; the solid blocks were only slots past the end of a thin genre's catalog slice (`getCuratedShelfPosterData` divides a genre across placements). The slot list now wraps, so every slot carries art — and stacking copies of a title is what a real store looked like. Two separate compounding bugs made this look worse than it was: posters were downscaled `w342 → w154` on desktop (a 154px image stretched across a tape face), and poster faces used `meshBasicMaterial` so they were unlit and read as stickers.
3. ~~**No night.**~~ Fixed. The cause was a single number: `ambientLight intensity={1.1}` plus a `1.7` directional "sun", which together swamped the fluorescents. That value had been there across every branch, unchanged, through the entire toon→PBR conversion.
4. ~~**No shadows, no bloom.**~~ Shadows on (desktop). Bloom was already configured and always had been — it did nothing because ambient washed the whole scene to a similar luminance, so nothing crossed its `0.8` threshold. It started working the instant the lights came down.

**Method note worth keeping:** three of these four were misdiagnosed in this file before being fixed, each time by reasoning from a screenshot instead of from the code. Read the material and the light values before theorizing. `scripts/perf-probe.mjs` exists for the same reason — "shadows are too expensive" was a five-year-old assumption that measured at ~2 FPS.

## Eval findings — 2026-05-29 capture pass (⚠️ superseded by the correction above)

**2026-06-09 re-run** of the full capture harness against `main` (8af1388): every finding below is unchanged. Two additions from that run:
- ~~**Posters are served fine but invisible.** Server log shows all `/api/catalog-poster` + image-proxy requests returning 200 — the TMDB pipeline is healthy. The gondola tapes still read as black slabs in every interior capture. This is a *lighting* problem, not a data problem. Don't debug the fetch path again.~~ **WRONG — see correction above.**
- **NEW RELEASES wall confirmed at 2 visible posters** (Jaws, Blade Runner, far edges of an otherwise bare slot grid) — worse than the "~5" estimate below. For the marquee feature wall this is the single biggest feel-breaker in `/game`.

Original findings (2026-05-29, against 60c0e1a):
- **Mirrored billboard labels** (YNNIV / EILRAHC / OPEN). Root cause: drei's `<Billboard>` tracks the main R3F camera via `useFrame`; `SecurityCameras.tsx` renders with a secondary camera via `gl.render(scene, cam)` that bypasses the frame loop. Fix: call R3F's `advance(t, true, scene, cam)` before each `gl.render` so all `useFrame` subscribers re-evaluate with the capture camera. *Note: this is a capture-script bug, not a runtime bug — labels are correct in the live game. But it makes the capture script lie, which is dangerous.*
- **Back third of store is near-black** in `overhead.png`, `back_wall.png`, upper half of `ceiling_back.png`. Needs a second ceiling light at z ≈ −3 or an intensity bump.
- **NEW RELEASES wall is sparse** — only ~5 posters across the whole back wall in `back_wall_face.png`. Investigate slot count vs TMDB fetch.
- **`overhead.png` is pointed up at ceiling, not down.** No true plan-view debug cam exists. Cheap to add.
- **`vacant_front.png`** — pitch-black interior behind FOR LEASE placard reads as render failure. See backlog item 4 (replace the whole storefront instead).
- **`back_alley.png`, `service_doors.png`** — nearly pure black. Add a dim sodium lamp if keeping; cheaper to never camera in here.

All 24 capture PNGs in `/tmp/fnv-cams/` (refreshed by the 2026-06-09 run; Unity v2 headless shots in `/tmp/fnv-v2/`).

**Note on priorities:** these `/game` findings stay parked per the feel-first rule — `/game` is in maintenance and the fix energy belongs in v2 (liveliness + lighting) and then the personal-collection pivot. They're recorded here so nobody re-diagnoses them from scratch.



## Game state — what's IN, what's OUT (2026-06-04)

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
- NEW RELEASES wall (`NewReleasesWall` on the 21m `BackWall`) — widened to a 10m featured display + 6 rails under a 10m gold marquee, densely stocked with ~240 tapes drawn **only** from the curated new-release set (`M_NR_*` materials, ~30 titles) repeated as vertical stacks. ~10 are interactive (`VhsTape`); the rest are static `NR_Fill_*` dressing (no colliders, SRP-batched). Tapes at canonical scale `(0.14, 0.23, 0.03)` — never scale, add copies.
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
- Filmic post-processing — `Assets/Settings/PostFX_Store.asset` (Neutral tonemap, bloom on signage, warm color grade + white balance, vignette, subtle film grain) on the `Global Volume`. The volume + camera post flag pre-existed but had **no profile assigned**; plugging one in was the biggest perceived-quality jump. Desktop `PC_RPAsset` active; lighter `Mobile_RPAsset` tier exists (verify post perf there).
- VHS tapes alphabetized A–Z by title within each gondola (front face then back, top→bottom, left→right) and seated back against the shelf spine (`localPosition.z ±0.05`). Titles resolved id→title from the web catalog, baked to `Assets/Arrival/Data/movie_titles.tsv`.
- Genre top-cap labels (`SignLabel`/`SignPanel`, TMP navy-on-gold) parented onto each gondola, both faces. Note: TMP's readable face points −Z at `rotY=0`, so a +Z-facing label needs `rotY=180`, else it renders mirrored.

**Unity v2 missing vs R3F (queued, ranked by feel-per-hour):**
- NPC height-variance (squat/eye-level/reach-up for browse animations)
- Ambient overheard dialogue pairs with world-space speech bubbles
- Vinny clerk + menu + chat
- Era selector + apartment scene + rewind mechanic
- Challenges (Movie Night, Speed Run, etc.)

The 2026-06-09 live eval confirmed this list is the felt gap: v2 is a well-merchandised store with nobody in it — no clerk, no customers, no sound. `/game` has the life wrapped in broken atmosphere; v2 has the atmosphere with no life. Closing that (NPCs + stub Vinny voice) is the gate on the personal-collection pivot.

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
- **Unity project:** `/Volumes/Daws_SSD/Artios-Migration/Projects/jarvis-builds/cinema-chat-unity` (separate git repo, 18 GB, **external drive only**). Scene of record: `Assets/Scenes/Arrival.unity` (build index 0); `Assets/Backrooms/Scenes/Backrooms.unity` (build index 1). Parked as of 2026-07-25 — see "Active direction" above.
- **v2 build + deploy pipeline:** build WebGL (Brotli/IL2CPP, ~5 min) to `cinema-chat-unity/Builds/WebGL` → copy the 4 `WebGL.*` files into `public/v2/Build/` → commit → `vercel --prod --yes`. Incremental builds only change `WebGL.data.br` when no C# changed. Full detail in memory `reference_v2_build_deploy_pipeline.md`.
- **⚠️ Backup risk.** This repo *does* have a remote (`JDaws-Dev/cinema-chat-v1-4-character`) but is 8 commits ahead of it — all the Unity v2 work is unpushed. `cinema-chat-unity` (18 GB) and `backrooms-unity` (14 GB) have **no remote at all and exist only on the Daws_SSD external drive**. If that drive dies, the entire Unity port is gone. Pushing them needs `.gitignore` for `Library/` and Git LFS for assets.

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

**Use the player-view harness. It is the only one that tells the truth.**

```bash
npm run dev                                  # in one terminal
node scripts/capture-player-view.mjs         # in another
```

Writes to `/tmp/fnv-player/`. Screenshots the **actual player viewport** — real camera, real fog, real post-processing — so what you see is what a player sees. Walks forward in stages (spawn → doorway → front aisle → mid store → back wall) plus look-left/look-right. Use the `Read` tool on the PNGs.

It clears both gates that silently invalidate captures: the **"CHOOSE YOUR ERA"** modal and the **"GOT IT"** tutorial. Both dim the scene behind them, and both appear on a delay — so it polls for them rather than checking once. If you add another modal, add its button text to the `GATES` array or every capture will be the same greyed-out frame.

**Three things it will not tell you** (learned the hard way, 2026-08-07):
- **The stages are not reproducible.** Each stage holds a key for N ms, but NPCs collide with the player and deflect the walk, so `03_front_aisle` can be a different spot and a different heading on every run. Fine for coverage; **useless for before/after comparison of a specific object.** To judge one change, find it in several shots or the difference you're "seeing" may just be a different camera.
- **A cold browser is a cold cache.** Every run is a fresh Playwright context, so all ~200 poster textures re-download. A shelf showing flat placeholder color in an early stage is usually still loading, not broken — check a late stage before diagnosing. (See the loader notes in `store-materials.tsx`: concurrency 12, placeholder deadline 14s.)
- **It has no audio and cannot show motion.** Anything about gait, walk direction, or sound has to be confirmed by a human in the live game.

```bash
node scripts/perf-probe.mjs                  # dev server must be running
```

Patches the WebGL draw entrypoints before page scripts run and samples real draw calls + FPS from the player viewport at three positions. **Use this before deferring anything on performance grounds** — the long-standing "no real-time shadows, too expensive" rule had never been measured and turned out to cost ~2 FPS. Baseline after the 2026-08-07/08 overhaul: ~2620 draws at spawn, ~1960 mid-store, ~57 FPS.

**Shell gotcha when reporting checks:** `npx tsc --noEmit | head -12 && echo "TYPECHECK OK"` always prints OK, because `head` exits 0 regardless of what `tsc` said. That pattern printed a false pass directly underneath real type errors during this work. Use:
```bash
out=$(npx tsc --noEmit -p tsconfig.json 2>&1); [ -z "$out" ] && echo "CLEAN" || echo "$out" | head -20
```

```bash
node scripts/capture-security-cams.mjs       # legacy — treat output as suspect
```

Writes `/tmp/fnv-cams/`. Renders via a secondary camera with `gl.render(scene, cam)`, bypassing R3F's frame loop. Consequences: billboards face the wrong way (mirrored YNNIV / EILRAHC labels), and **several interior cams return uniform navy with no geometry at all** — which is what produced the bogus "back third is near-black" finding. Useful for exterior/geometry spot-checks; do not judge lighting or materials from it.

For 3D bugs: do the geometry math from numbers (position + size + rotation), don't trust comments. `PlaneGeometry` without rotation is a horizontal slab in XY by default — not a wall. `side={DoubleSide}` masks orientation bugs.

## Performance budget

- Max ~10 dynamic NPCs (desktop), 5 (mobile)
- Max 6 lights per zone
- **Shadows: ON for desktop, off for mobile.** The old "no real-time shadows (too expensive)" rule was never measured; when it finally was, one shadow-casting directional cost ~2 FPS. Point lights each need a 6-face cube map, so exactly one directional does the casting and the zone point lights stay non-casting. Gondola *structure* casts; the ~400 tapes deliberately don't.
- Post-processing: desktop only (Bloom, Vignette, ChromaticAberration)
- Target: 30+ FPS on mid-range laptop
- Prefer InstancedMesh for repeated objects (VHS boxes via `InstancedVHSBoxes`)
- Reuse materials — `Mat` already does shared-material caching (now supports `map`/`mapKey`; `mapKey` is part of the cache key so two surfaces sharing a color but not a texture don't collide)
- Surface textures are generated at runtime in `procedural-textures.ts` (carpet, ceiling tile, wood, wall) — canvas-drawn, seeded, seamlessly tiling, no image assets
- **Measure before optimizing or deferring.** `node scripts/perf-probe.mjs` reports real draw calls and FPS from the player viewport. Baseline after the 2026-08-07 overhaul: ~2500 draws at spawn, ~1900 mid-store, ~57 FPS.

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
