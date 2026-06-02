# Transition Plan — FNV → Personal Collection Viewer

Drafted 2026-06-01. The fictional Blockbuster catalog becomes Jeremiah's real archive: 50-film Letterboxd diary + 966-film library from `/Users/jeremiahdaws/Projects/DEMO REEL/public/movies.html`.

## Status as of 2026-06-02

**Where we are:** Phase 0 not started. The Unity v2 build is the more likely host for the personal-collection content (rather than R3F `/game`), so the runway question shifted to "is v2 good enough as a vessel?" before pivoting.

**Recent v2 progress that affects this plan:**
- The store has bones now (parking-lot arrival, NEW RELEASES centerpiece, drop-where-they-belong, zone-pool lighting, Employees Only → Backrooms portal)
- VHS GameObjects are individually-instantiated with `VHS_<genre>_<id>` naming + Interactable + HeldItem + Rigidbody — when we hydrate from the personal diary, each tape can carry its own metadata cleanly
- The NEW RELEASES wall is intentionally narrow (3m featured display, 16 tapes) — perfect host for the diary's most recent ~12 entries with no further fixture changes
- A `Tools/FNV/Capture Security Cams` editor harness exists, so visual changes can be validated pre-rebuild

**Gate before starting Phase 0:** v2 needs (a) NPC height-variance + ambient pair dialogue to feel like a real store, and (b) at least basic Vinny-equivalent so the personal context has a voice to deliver. Without these, the personal collection lands in a quieter space than R3F's `/game` and loses meaning.

**Where we're going next (in order):**
1. Land NPC liveliness + a stub Vinny voice in v2 (1–2 evenings).
2. Start Phase 0 (extract two JSON blobs, TMDB-hydrate the library).
3. Phase 1 (diary on NEW RELEASES wall) — first user-visible "this is *my* store" moment.
4. Phases 2–5 in order; defer apartment scene until store transition lands.

## Vision

The store stops being a TMDB era-fantasy and becomes *Jeremiah's* video store. Diary = "what I just watched" wall. Library = the catalog you actually own. Vinny becomes a curator who knows your taste, not a clerk pitching strangers.

## Source data

| Source | Records | Schema | Notes |
|---|---|---|---|
| `LETTERBOXD_DIARY` | 50 | `title, year, rating, liked, rewatch, watchedDate, tmdbId` | Chronological desc, 2025-09-06 → 2026-05-25 |
| `ALL_MOVIES` | 966 | `title, year (string), director` (+ unused stubs) | Alphabetical; **no tmdbId** — must be hydrated |

Both live inline in `DEMO REEL/public/movies.html`. No standalone JSON exists yet. A commit message (`bc44c92`) references a Letterboxd sync script that hasn't materialized.

## Phase 0 — Data spine (1 evening, no Unity rebuild)

1. Extract two JSON blobs from `movies.html` → `data/diary.json` + `data/library.json`. Build artifact, gitignored (re-extractable).
2. One-shot script: TMDB-hydrate the library. For each `{title, year}`, hit TMDB search → backfill `tmdbId, poster_path, genres, runtime`. Expect ~5% needing manual disambiguation.
3. Cache posters → `public/images/collection/<tmdbId>.jpg`. Reuse existing FNV poster cache pattern.

## Phase 1 — Diary wall in Unity v2 (1–2 evenings, rebuild)

- Replace NEW RELEASES back-wall content with diary, newest-first.
- Each VHS spine: poster + title + rating + ❤ if liked.
- Vinny entry line: *"Welcome back, Jeremiah. You watched* Con Air *on the 25th — rewatchable, you said. Four stars."*
- **Highest feel-per-hour move.** Makes the place yours immediately.

## Phase 2 — Genre shelves from the library (1 weekend, rebuild)

- Map TMDB genres → existing 14 gondola genre keys (`action, comedy, horror, ...`).
- Each shelf shows a subset of YOUR films in that genre — not era-curated TMDB strangers.
- Pick up a tape → modal with rating (if logged), `watchedDate`, your notes (when added).

## Phase 3 — Vinny re-grounded (in-place, no rebuild)

- Vinny's system prompt gets the diary as context.
- He stops pitching unrated films. Starts saying things like *"You loved* White Christmas *— there's a Hallmark-y one on the back wall, but honestly you'd hate it."*
- Vinny becomes a store clerk who actually *knows* you.

## Phase 4 — Personal modes (optional)

- **Random pull mode** — Vinny grabs one off the shelf for you. "What should I watch tonight?" → one tap.
- **Rewatchable wall** — 35 films flagged `rewatch: true` get their own gondola near the door.

## Phase 5 — Backrooms = unrated archive

- The 916 films owned but never diary-logged live in the Backrooms.
- Employees Only door reads as "the rest of the collection" — vast, unrated, dimly lit. True to the vibe.

## Anti-goals

- Don't ship a flat list. The whole point is the spatial archive.
- Don't scrape Letterboxd live — diary is an export.
- Don't TMDB-hydrate at runtime — bake at build time, ship static JSON.

## Compatibility notes

- FNV `CatalogMovie` schema (`src/lib/curated-movie-catalog.ts`) shares `title, year, director, runtime` with the personal data. Diary already has `tmdbId`.
- FNV's existing hardcoded IDs (`900001–900053`) live in a separate ID space from real TMDB IDs — no collision.
- `ALL_MOVIES.year` is a string; diary year is a number. Normalize on extract.
