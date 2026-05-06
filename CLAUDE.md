# Friday Night Video — Claude Code Project Guide

## What this is

A 3D Blockbuster-style video store game. Player walks in, finds movies, talks to Vinny (LLM clerk), checks out, goes home to an apartment to rewind tapes, then comes back for the next visit.

**Stack:** Next.js 16 + React 19 + React Three Fiber, Convex, OpenAI (Vinny chat), ElevenLabs (TTS), TMDB (movies + posters), localStorage persistence.

**Live:** [www.fridaynightvideo.app](https://www.fridaynightvideo.app)

## Game state — what's IN, what's OUT (April 2026)

**Currently shipped:**
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

**Removed / intentionally absent:**
- Pizza Palace + Tony (replaced with FOR LEASE storefront placard)
- Old in-strip-mall apartment integration (apartment is now its own scene only)
- XP / Tier (Bronze/Silver/Gold) UI surfaces — state still exists, no longer rendered
- Quest log surface (mobile button, J shortcut, Vinny menu entry) — quests merged conceptually into challenges
- Weekly challenges UI — file exists but unimported
- WatchAtHomeOverlay — superseded by the Apartment scene

## Architecture

- **Runtime:** Next.js 16 + React 19 + React Three Fiber + Three.js
- **Style:** Low-poly box geometry, PBR materials, Blockbuster-inspired palette
- **State:** React hooks + localStorage. No database.
- **Routes:** `/game` (3D), `/chat` (chat-only with Vinny), `/editor/3d` + `/editor/dual` (debug)

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
