# Friday Night Video

A 3D Blockbuster-style video store. Walk in, talk to Vinny (LLM clerk with TTS), find a movie, take it home and watch it. Live at [fridaynightvideo.app](https://www.fridaynightvideo.app).

Stack: Next.js 16 + React Three Fiber, Convex, OpenAI (Vinny chat), ElevenLabs (TTS), TMDB (movie data + posters).

## Getting started

```bash
npm install
npm run dev
```

Game is at [http://localhost:3000/game](http://localhost:3000/game). The chat-only `/chat` route is also available.

Required env (in `.env.local`):

- `OPENAI_API_KEY` — Vinny chat
- `ELEVENLABS_API_KEY` — NPC voice TTS (optional; subtitles still work without it)
- `TMDB_API_KEY` — movie catalog + poster auto-fetch fallback

## Game loop

1. Splash → enter your email (purely for save state, no verification)
2. Pick an era (late 80s, early/mid/late 90s, present)
3. Walk into Friday Night Video. Find movies on the gondolas.
4. Approach Vinny (E key). Menu offers: check out, ask for a recommendation, just chat, start a challenge, take a return-tape shift.
5. After checkout: head home (apartment scene). Pick up tapes from the counter, walk to the VCR, rewind. Click the door to head back to the store for the next session.

Challenges:

- **Movie Night** — find 3 movies from different genres, no clock
- **Speed Run** — same goal, 60 seconds
- **Vinny's Mystery** — solve a cryptic clue, find the movie
- **Return Shift** — Vinny hands you 5 tapes, return each to the correct genre shelf in 3 minutes

Forgot to rewind a tape? Vinny notices on your next visit.

## Repo layout

- `src/app/game/page.tsx` — main game page, scene composition
- `src/components/game3d/` — 3D components (Store, Apartment, NPCs, props, FirstPerson controls, interaction system)
- `src/components/game/` — 2D UI overlays (HUD, dialogue, checkout, challenges, Vinny menu)
- `src/hooks/` — game logic hooks (inventory, challenges, dialogue, interaction)
- `src/lib/` — game data, audio system, NPC scripts, TMDB integration, store layout
- `src/app/api/` — backend routes (chat, TTS, search, catalog-poster)
- `public/sounds/` — ambient + SFX + cached NPC voice clips
- `public/images/posters/` — cached TMDB posters (created on first request)

## Architecture notes

- **Store layout** is data-driven from `src/lib/store-layout.ts`. Each gondola has a `meta.genre` (front side) and `meta.backGenre`. After the April 2026 dedup, every genre lives in exactly one gondola, sourced only from genres present in the curated catalog.
- **VHS pickup state** is persisted in `localStorage.fnv_vhs_state` via `src/lib/vhs-state.ts`. Tapes left in "held" status across sessions auto-downgrade to "on_shelf" on load.
- **Audio** flows through a single Web Audio context (`src/lib/audio.ts`). NPC voice lines (`playVinnyLine`, `playNpcLine`) hit `/api/tts` (ElevenLabs) and feed a global subtitle handler registered by `useAudioUI`.
- **Interaction system** (`src/components/game3d/Interaction.tsx`) raycasts forward from the camera and dispatches the hit mesh's `userData.interactType` to `useInteraction`. Each interaction type (shelf, vinny, customer, vcr, apartment_door, etc.) has a branch.
- **Challenges** (`src/hooks/useChallenge.ts`, `useReturnShift.ts`) own their own timer + completion logic. They set `heldMovies` directly via the inventory hook.

## Verification

`scripts/capture-security-cams.mjs` launches headed Chromium against a running dev server and dumps 23+ scene captures to `/tmp/fnv-cams/`. Use it to verify visual changes without running through the splash + login by hand:

```bash
npm run dev   # in one terminal
node scripts/capture-security-cams.mjs   # in another
```

The script pre-seeds the `fnv_user_email` localStorage key so the splash shows "ENTER THE STORE" immediately.

## Deploy

Vercel project `cinema-chat-v1-4-character`. Custom domain: `www.fridaynightvideo.app`.

```bash
vercel --prod
```

## Design docs

The various `*.md` files at repo root (DESIGN.md, HUD-DESIGN.md, etc.) are historical brainstorm + spec documents. The current state of the game may diverge — when in doubt, the code is the truth. CLAUDE.md is the practical guide for AI assistants working in this repo.
