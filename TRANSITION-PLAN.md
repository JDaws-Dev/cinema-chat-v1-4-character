# Transition Plan — FNV → Personal Collection Viewer

Drafted 2026-06-01. The fictional Blockbuster catalog becomes Jeremiah's real archive: 50-film Letterboxd diary + 966-film library from `/Users/jeremiahdaws/Projects/DEMO REEL/public/movies.html`.

## Status as of 2026-07-25 — deferred, and the host changed

**Deferred by decision.** The catalog stays the fictional era-curated TMDB set for now. Order of work is (1) visual quality bar, (2) liveliness, (3) content — this plan is step 3.

**The host is no longer Unity v2.** As of 2026-07-25 the project is rebuilding on web/R3F as `/v3` (reasoning in `CLAUDE.md` → "Active direction"). So the Phase 1–5 wording below, which assumes Unity fixtures (`M_NR_*` materials, `Assets/Arrival/Data/movie_titles.tsv`, gondola GameObjects), needs re-targeting at R3F equivalents before anyone starts. The *phasing* still holds; the implementation notes don't.

**The gate moved too.** The old gate was "v2 needs NPC liveliness + a Vinny voice." That was written believing the store looked right and only lacked life. It doesn't look right yet: shelf tapes are untextured flat blocks (`InstancedVHSBoxes` has no poster material at all — see the CORRECTION section in `CLAUDE.md`), and the scene is toon-shaded, shadowless, and never reads as night. **New gate: the poster-atlas + PBR/lighting foundation lands first.** Hydrating a personal collection into shelves that render as navy rectangles would waste the whole point — the diary's poster art *is* the payoff.

**Still true and still valuable:** the per-tape metadata approach (each tape a distinct object carrying its own movie id), the diary→New Releases wall mapping, and the Backrooms-as-unrated-archive idea all survive the engine change intact.

## Status as of 2026-06-09 (superseded)

**Where we are:** Phase 0 not started. The Unity v2 build is the more likely host for the personal-collection content (rather than R3F `/game`), so the runway question shifted to "is v2 good enough as a vessel?" before pivoting. v2 took a real step toward "feel-right" in early June (post-processing + a properly merchandised store), but the gate below is still open.

**2026-06-09 live eval (full repo + runtime check):** v2 loads and plays, including headless (~20s splash→exterior); the arrival moment and merchandised store hold up. Three issues logged for the next editor session: interior renders washed-out/milky (verify in a real browser before tuning — suspects: postExposure + ambient + bloom stacking), dark quads overlap the exterior marquee text, and the storefront glass may be missing a collider (headless player walked in with just W). The R3F `/game` eval-debt (empty NEW RELEASES wall, near-black aisles, FOR LEASE void) was re-verified as all still present but stays parked — fix energy belongs here, not there. The eval's bottom line matched this plan's gate: **v2 is a beautiful store with nobody in it; liveliness (NPCs + a Vinny voice) is the blocker, then Phase 0.**

**Recent v2 progress that affects this plan:**
- The store has bones now (parking-lot arrival, NEW RELEASES wall, drop-where-they-belong, zone-pool lighting, Employees Only → Backrooms portal)
- Filmic post-processing now in (`PostFX_Store` volume profile) — the store finally reads as a warm Blockbuster at night instead of a flat viewport. Biggest visual win to date.
- VHS GameObjects are individually-instantiated with `VHS_<genre>_<id>` naming + Interactable + HeldItem + Rigidbody — when we hydrate from the personal diary, each tape can carry its own metadata cleanly. They're now alphabetized A–Z within each gondola, seated on the shelves, with genre top-cap labels.
- id→title resolution for the catalog is baked at `cinema-chat-unity/Assets/Arrival/Data/movie_titles.tsv` (extracted from the web `generated-era-catalog.ts`) — a useful precedent for hydrating tape metadata.
- The NEW RELEASES wall was widened to 10m and densely stocked from the curated new-release set (`M_NR_*`) — when we pivot, this is the host for the diary's most recent entries (swap the `M_NR_*` materials for diary posters; fixture is already sized).
- A `Tools/FNV/Capture Security Cams` editor harness exists, so visual changes can be validated pre-rebuild.

**Gate before starting Phase 0 (still open):** v2 needs (a) NPC height-variance + ambient pair dialogue to feel like a real store, and (b) at least basic Vinny-equivalent so the personal context has a voice to deliver. Without these, the personal collection lands in a quieter space than R3F's `/game` and loses meaning. Visuals/merchandising are now in good shape; **liveliness (NPCs + a voice) is the remaining blocker.**

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
