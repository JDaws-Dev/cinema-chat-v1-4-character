# Refactor Principles — What Matters

## The Core
- Walk into a 90s video store
- Browse real movies on shelves
- Pick a movie
- Talk to Vinny
- Check out, get a score
- That's it. Everything else earns its way back in slowly.

## Visual Rules
- **Same experience on desktop AND mobile.** No reducing VHS count, no different materials, no isMobile checks that change the visual. Same store, same detail level.
- **Simple and clean.** Strip out visual clutter. Keep the basic store layout (shelves, counter, walls, floor, ceiling). Remove extras that don't serve the core.
- **One material for everything.** Pick toon or standard and use it everywhere. No switching between materials based on device.
- **Add detail SLOWLY.** Each addition must be reviewed visually before committing. No more bulk-adding 15 features at once.

## What Stays
- Blockbuster floor plan layout (angled gondolas, wall shelving, checkout front-right)
- VHS tapes with real TMDB posters (same count everywhere)
- Vinny behind the counter
- RPG dialogue (typewriter effect)
- Checkout receipt with score
- Era selector
- First-person controls
- Audio (ambient + customer conversations)

## What Gets Cut
- isMobile material switching (Mat component — use ONE material)
- isMobile VHS count reduction
- Weekly challenges (unfinished)
- Back room (nothing there)
- Vinny reputation (disconnected)
- New Release Race (frustrating)
- Duplicate conversation systems (merge to one)
- Tarantino NPC (fun but adds complexity — can return later)
- Kids corner, video games section, bargain bin (added too fast, not polished)
- Security dome decorations
- Most of the tiny detail props (newspaper stand, umbrella stand, etc.)

## Architecture
- Split Store.tsx into focused files
- Extract page.tsx state into hooks
- One conversation system, not three
