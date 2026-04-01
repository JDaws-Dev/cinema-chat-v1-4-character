# FRIDAY NIGHT VIDEO: Brutally Honest Audit & Reset Plan

**Date:** 2026-03-29
**Total codebase:** ~20,000 lines across game files
**Verdict:** Refactor, don't rebuild. But cut hard.

---

## Part 1: Honest Assessment

### Line Counts (the numbers don't lie)

| File | Lines | Verdict |
|------|-------|---------|
| `Store.tsx` | 6,285 | UNACCEPTABLE. This is a god-component. |
| `page.tsx` | 1,991 | Too big. 50+ useState hooks. Every feature crammed into one render function. |
| `audio.ts` | 594 | Actually reasonable. One concern: two separate chatter systems (audio.ts scheduler + page.tsx NPC timer). |
| `npc-dialogues.ts` | 845 | Lots of hardcoded dialogue trees. Works but not scalable. |
| `era-conversations.ts` | 507 | Solid concept, lots of static data. Fine. |
| `npc-personalities.ts` | 216 | Well-structured but DISCONNECTED from the 3D NPCs. |
| `game-state.ts` | 334 | Reasonable but everything is scattered across 6+ localStorage keys. |
| `quest-system.ts` | 207 | Clean definitions. Quest logic works. |
| `weekly-challenges.ts` | 45 | Half-baked. `check` functions return false for 2 of 10 challenges. Never called from game code. |
| `procedural-quests.ts` | 46 | Works but is a thin wrapper. Fine for what it is. |
| `FirstPerson.tsx` | 262 | Actually solid. Collision system is simple and effective. AABB is fine for this game. |
| `npc-conversations.ts` | 150 | DUPLICATE of functionality in `audio.ts` and `era-conversations.ts`. Three conversation systems. |

### What's Actually Working Well (KEEP)

1. **The 3D video store itself.** Walking around feels like a real Blockbuster. The layout, shelves, genre sections, counter area, Vinny behind the counter -- this is the soul of the game. Keep it.
2. **VHS pickup mechanic.** Pick up tapes, see them in inventory, take them to checkout. Core loop works.
3. **TMDB poster loading.** Real movie posters on VHS boxes, era-filtered. This is the killer feature. The texture cache with throttled loading is well-engineered.
4. **Vinny's Five puzzle (TV game).** Fun standalone mini-game with clue progression and search.
5. **RPG dialogue system.** The typewriter effect, response choices, quest hooks -- this feels polished.
6. **First-person controls.** WASD + pointer lock + AABB collision. Simple, works, no jank.
7. **Audio architecture.** Spatial audio, ambient layers, SFX caching. Overbuilt but functional.
8. **Era selection.** Choose your decade, get period-accurate movies. Great concept, well-executed.
9. **Checkout receipt with scoring.** The retro receipt with Movie Night Score is charming and gives the visit a satisfying ending.
10. **Mobile controls.** Dual joystick system works. Not great, but functional.

### What's Broken or Half-Baked (CUT or FIX)

1. **Weekly challenges** -- `getWeeklyChallenge()` is defined but NEVER evaluated during gameplay. Two of ten challenge templates have `check: () => false`. The quest log renders them but they can't actually be completed. **CUT until properly integrated.**

2. **Three overlapping conversation/chatter systems:**
   - `audio.ts` has `startCustomerChatter()` with its own 20-40s timer, picks from `era-conversations.ts`
   - `page.tsx` has its OWN `npcConvoTimer` (30-60s) that picks from `npc-conversations.ts`
   - `npc-dialogues.ts` has dialogue trees for interactive RPG conversations
   - Result: two separate timers fire ambient chatter independently, stepping on each other. **FIX: merge into one system.**

3. **NPC personalities are decoration.** `npc-personalities.ts` defines 8 personality types with genre reactions, greetings, voice styles. The `NPCCustomer` component in Store.tsx receives a personality and uses `getPersonalityLabel()` for hover text. But the personality-specific greetings, genre reactions, and voice styles are NEVER used in actual dialogue. When you talk to a customer, it rolls dice to pick a random dialogue tree or procedural request -- the personality is ignored. **FIX or CUT the personality system.**

4. **New Release Race** -- Works mechanically but feels disconnected. A 15-second timer to find a specific movie with no guidance on where it is. Not fun, just frustrating. **CUT or redesign.**

5. **Back Room / Platinum Door** -- You can open a door if you're Platinum tier. Behind it is a tiny room with a desk and a small shelf. There's nothing meaningful to DO in there. **CUT until there's a reason to go in.**

6. **Security Cameras** (116 lines in its own component) -- Renders camera domes on the ceiling. Purely decorative. Not connected to anything. **KEEP but it's dead weight.**

7. **Procedural quests** -- The system works but the customer dialogue wrapping is clunky (stores data on `window.__pendingProceduralRequest`). Using the window object as state is a code smell. **FIX: move to React state.**

8. **Vinny reputation tracking** -- `recordVinnyRec()` tracks if you follow Vinny's recommendations. This data is saved but NEVER read back to affect anything. **CUT until it drives behavior.**

9. **NPC relationship memory** -- `incrementNpcRelationship()` counts your interactions, and `getRelationshipGreeting()` modifies greetings based on level. This actually works but the effect is subtle (just a prefix on the greeting text). **KEEP but make it more visible.**

### What's Over-Engineered (SIMPLIFY)

1. **Store.tsx at 6,285 lines.** This file contains:
   - Poster texture cache & throttled loader (140 lines)
   - Poster URL fetcher with era filtering (100 lines)
   - PosterBox component (60 lines)
   - ShelfUnit component (90 lines)
   - WallShelf component (60 lines)
   - EndcapDisplay component (55 lines)
   - Counter component (230 lines -- a counter with register, candy, monitor, lamp, barcode scanner, VHS stacks, membership forms)
   - VinnyCharacter (300 lines of box-geometry body parts)
   - NPCCustomer (300 lines, full animated character with pathfinding)
   - TarantinoNPC (230 lines, Easter egg character)
   - KidCustomer (200 lines)
   - CharlieCharacter (370 lines)
   - NewReleasesWall (100 lines)
   - NeonSign (25 lines)
   - WallCrtTv (150 lines)
   - SecurityDome (20 lines)
   - TrophyShelf (150 lines)
   - KenneyCar, KenneyModel (25 lines)
   - BackRoomShelf, AnimatedDoors (80 lines)
   - The main Store() component (175 lines of JSX assembling everything)
   - Plus: aisle signs, floor markings, staff picks shelf, wall posters, flickering lights, floor rug, baseboards, clock, umbrella stand, newspaper stand, "coming soon" board, ceiling details...

   **This file has 30+ components and should be 8-10 separate files.**

2. **page.tsx state management.** 50+ useState calls. The component manages:
   - Game start/loading/era selection
   - Mobile detection
   - Overlay routing (12 overlay types)
   - Puzzle state (6 states)
   - Quote/Synopsis quiz state
   - VHS inventory + snack inventory
   - Challenge state (movie night, speed run, mystery, race)
   - Audio/subtitle state
   - NPC conversation timing
   - RPG dialogue with typewriter effect
   - Notification system
   - Procedural request tracking
   - Quest system integration (3 tracking callbacks)
   - Membership tier + XP
   - Game clock
   - iOS home screen prompt
   - Back room door state
   - Vinny recommendation tracking
   - Score calculation
   - Screenshot capture

   **This needs to be broken into custom hooks or use a state machine.**

3. **Characters built from 30+ box geometries each.** Vinny alone is 300 lines of manually positioned boxes for legs, shoes, belt, torso, collar, buttons, name tag, manager badge, lanyard, arms, hands, head, hair, glasses (6 meshes for glasses alone), eyes, mouth, 5 o'clock shadow, and ears. Same for Charlie, NPCs, Tarantino, and the kid. **Consider: are these characters adding enough value for their complexity? Could simplified characters (fewer meshes, more stylized) look just as good?**

4. **NPC pathfinding in Store.tsx.** Each NPC has waypoint-based movement with shelf collision avoidance, idle animations, head tracking, arm swinging, and positional audio registration. This is 300+ lines per NPC variant. For NPCs that are basically set dressing, this is overkill.

### What's Missing That Actually Matters

1. **No tutorial/onboarding.** New player lands in a parking lot, has no idea what to do. No arrow pointing at the door. No "Walk into the store" prompt. Vinny doesn't greet you on entry.
2. **No save state indicator.** Player has no idea their progress persists. No "Welcome back!" on return visits.
3. **No clear win condition per visit.** The game clock ticks to 11 PM but there's no "end of night summary" beyond the checkout receipt. The score doesn't DO anything.
4. **No visual feedback for XP gain.** You earn XP but there's no "+50 XP" floating text. The tier badge updates silently.
5. **No sound design.** The `/sounds/` directory likely has placeholder or missing files. The ambient system tries to load `ambient_muzak.mp3`, `ambient_hum.mp3`, `ambient_chatter.mp3` but these may not exist. Most "audio" is just subtitle text with timing.
6. **No loading progress.** The loading screen says "Opening the store..." but doesn't show actual progress. Meanwhile, 16 GLTF models preload + hundreds of poster textures fetch.

---

## Part 2: The Core Experience (Stripped Down)

The MINIMUM game that's fun:

1. **Walk into a 90s video store.** Pick your era. Walk through the parking lot. Automatic doors open. You're in.
2. **Browse real movies on shelves.** Walk up to a genre section. See real movie posters from your chosen era on VHS boxes. Interact to pick one up.
3. **Pick a movie.** VHS goes in your inventory bar. You can carry up to 3-4 movies and some snacks.
4. **Talk to Vinny.** RPG dialogue. He has opinions. He gives you a recommendation. He reacts to what you're holding.
5. **Check out.** Bring your movies to the counter. Get a receipt with your Movie Night Score. See a breakdown of your picks.
6. **Get a score.** Genre variety, snack pairings, Vinny's recommendation -- all factor in. High score persists.

**That's it.** Everything else is optional progression layered on top:
- Quests (talk to Vinny to unlock)
- Challenges (Movie Night, Speed Run)
- Props/trophies (reward for challenge completion)
- Membership tiers (XP accumulation)
- NPC ambient chatter (atmosphere)

---

## Part 3: Rebuild vs Refactor Decision

### Verdict: REFACTOR. Do NOT rebuild.

Here's why:

**What would we lose in a rebuild:**
- 6,285 lines of Store.tsx that, despite being a god-component, contains a lovingly detailed 3D video store with correct proportions, working poster loading, animated NPCs, and dozens of environmental details. Rebuilding this from scratch would take 2-3 full sessions minimum.
- The TMDB integration pipeline (poster fetching, era filtering, genre mapping, texture caching) is battle-tested and non-trivial.
- The collision system, first-person controls, and interaction system all work correctly together.
- All the dialogue content (quest text, NPC conversations, era-specific lines) -- thousands of words of hand-crafted content.

**What a refactor buys us:**
- Split Store.tsx into ~10 focused files without changing ANY visual output
- Extract page.tsx state into custom hooks without changing ANY behavior
- Delete dead/half-baked features to reduce cognitive load
- Each change is testable ("does the game still look/play the same?")

### Refactor Plan: What to Keep, What to Cut

**KEEP AS-IS:**
- `FirstPerson.tsx` (262 lines, clean)
- `Interaction.tsx` (154 lines, clean)
- `MobileControls.tsx` (212 lines, functional)
- `DialogueOverlay.tsx` (99 lines, clean)
- `SecurityCameras.tsx` (116 lines, decorative but harmless)
- `game-state.ts` (334 lines, works)
- `quest-system.ts` (207 lines, works)
- `store-layout.ts` (195 lines, works)
- `friday-night.ts` (323 lines, works)
- `era-conversations.ts` (507 lines, content)
- `audio.ts` (594 lines, works after chatter dedup)

**CUT:**
- `weekly-challenges.ts` -- not integrated, half the checks are stubs
- `npc-conversations.ts` -- redundant with `era-conversations.ts` + `audio.ts` chatter system
- Back room feature (door, room, shelf) -- no meaningful content behind it
- New Release Race -- frustrating, not fun
- Vinny reputation tracking (`recordVinnyRec`) -- saved but never read
- `window.__pendingProceduralRequest` hack
- iOS home screen prompt -- niche, adds code for edge case

**SPLIT (Store.tsx -> multiple files):**
- `store/PosterSystem.tsx` -- texture cache, poster URL fetching, PosterBox, InstancedVHSBoxes
- `store/Shelves.tsx` -- ShelfUnit, WallShelf, EndcapDisplay, BackRoomShelf, StaffPicksShelf
- `store/Counter.tsx` -- Counter component with all details
- `store/Characters.tsx` -- VinnyCharacter, CharlieCharacter, NPCCustomer, KidCustomer, TarantinoNPC
- `store/Environment.tsx` -- walls, floor, ceiling, doors, parking lot, neon sign, lights
- `store/Furniture.tsx` -- CRT TV, trophy shelf, bargain bin, cooler, misc objects
- `store/AisleSigns.tsx` -- signs, floor markings, genre labels
- `store/constants.ts` -- room dimensions, colors, waypoints, NPC pool config
- `store/Store.tsx` -- main component that assembles everything (should be <100 lines)

**EXTRACT (page.tsx -> custom hooks):**
- `useGameClock()` -- game time, closing announcements
- `useInventory()` -- held movies, held snacks, pickup flash
- `useChallenge()` -- movie night, speed run, mystery state
- `useQuestTracking()` -- quest objective tracking callbacks
- `useDialogue()` -- RPG dialogue state, typewriter effect, response handling
- `useAudioUI()` -- mute toggles, subtitle display, NPC chatter timer
- `useOverlay()` -- overlay routing, open/close logic

---

## Part 4: Phased Refactor Plan

### Phase 1: Cut Dead Weight (1 session)
**Goal:** Remove features that add complexity but no value.

1. Delete `weekly-challenges.ts` and all references in `page.tsx` quest log
2. Delete `npc-conversations.ts` and the duplicate chatter timer in `page.tsx` (keep `audio.ts` scheduler)
3. Remove back room feature (door state, back room rendering in Store.tsx, employee door interactions)
4. Remove New Release Race (state, timer, HUD, result overlay)
5. Remove `recordVinnyRec` / Vinny reputation tracking
6. Remove `window.__pendingProceduralRequest` hack -- move to proper React state or cut procedural quests
7. Remove iOS home screen prompt
8. Remove screenshot capture (C key) -- niche feature, adds code

**Expected result:** page.tsx drops from ~2000 to ~1500 lines. Store.tsx drops by ~200 lines.

### Phase 2: Split Store.tsx (1 session)
**Goal:** Break the god-component into focused modules.

1. Create `src/components/game3d/store/` directory
2. Extract components one at a time, verifying the game still renders after each extraction
3. Keep imports/exports clean -- the main `Store.tsx` becomes a thin orchestrator
4. Extract constants to `constants.ts` so they're shared

**Expected result:** No file over 500 lines. Store.tsx (orchestrator) under 150 lines.

### Phase 3: Extract page.tsx Hooks (1 session)
**Goal:** Make the game page comprehensible.

1. Create `src/hooks/` directory
2. Extract state groups into custom hooks one at a time
3. The page component should read like a screenplay: "here's the canvas, here's the HUD, here's the overlay router"
4. Each hook owns its state AND its effects

**Expected result:** page.tsx under 500 lines. Each hook under 200 lines.

### Phase 4: Visual Polish Pass (1 session)
**Goal:** Make every visual element intentional.

1. Audit every material in Store.tsx -- are toon materials being used consistently?
2. Remove any meshes that aren't visible or add nothing (ceiling speaker grill dots, etc.)
3. Establish a strict color palette (see Part 5)
4. Verify Kenney models integrate visually with box-geometry characters
5. Consider reducing character mesh count (Vinny doesn't need 6 meshes for glasses)

### Phase 5: Onboarding & Polish (1 session)
**Goal:** New players know what to do.

1. Add a subtle "Walk toward the store" arrow/prompt on spawn
2. Vinny greets you when you first enter (trigger zone near doors)
3. Quest log shows a default "Your First Visit" quest: browse 1 section, pick up 1 movie, check out
4. Show "+XP" floating text on XP gain
5. "Welcome back!" message on return visits (check localStorage for previous session)
6. Loading screen shows actual progress (models loaded / total)

### Phase 6: Re-add Features (selective, 1 session each)
**Goal:** Only add back features that enhance the core loop.

- Weekly challenges (properly integrated with actual tracking)
- Procedural customer requests (clean React state, no window hacks)
- Back room (only if there's meaningful exclusive content)
- Sound design pass (actual ambient audio files, not just subtitle-only)

---

## Part 5: Visual Direction

### THE RULE: Cel-Shaded Blockbuster. Period.

No more mixing styles. Every element follows this:

**Color Palette (locked):**
```
Walls:      #223663  (Blockbuster blue)
Floor:      #2a3660  (blue-grey carpet)
Ceiling:    #969081  (warm drop ceiling)
Shelves:    #7a5a30  (warm walnut)
Counter:    #5a3820  (dark wood) + #9a7850 (counter top)
Accents:    #ffd700  (gold for signs, highlights)
Neon:       #ff3366, #00ffaa, #3388ff (genre neon strips)
Skin:       #d4a574  (base), #8b6040 - #4a2818 (range)
Clothes:    Bold solids -- #0a4a8a (Vinny blue), #dc2626, #22c55e
```

**Material Strategy:**
- Desktop: `meshToonMaterial` with 6-step gradient map. EVERYWHERE. No exceptions.
- Mobile: `meshBasicMaterial` for performance. Consistent flat colors.
- Poster textures: `meshBasicMaterial` always (they're images, not lit surfaces).
- Emissive: ONLY for neon signs, TV screens, and the scanner laser. Nothing else.
- Transparent: ONLY for glass (entrance windows, display cases).

**Character Style:**
- Blocky/Minecraft-adjacent. Box geometries are fine -- that IS the style.
- But simplify: Vinny doesn't need collar folds, individual polo buttons, or lens tint circles. 15-20 meshes per character max, not 40+.
- Every character reads clearly from 3 meters away. If a detail is invisible at interaction distance, delete it.

**No new models without a visual review.** Before adding any new 3D element, screenshot the scene and confirm it fits the existing style.

---

## Part 6: Control & HUD Redesign

### Desktop Controls

Current controls are fine. Keep:
- WASD move, mouse look (pointer lock)
- E to interact
- J for quest log
- Q to close overlays
- 1-4 for dialogue responses
- Shift to crouch

Remove:
- C for screenshot (niche)

Add:
- Tab for inventory/quick menu (replaces clicking inventory slots)
- ESC should close overlays THEN release pointer lock (currently ESC always releases lock)

### Mobile Controls

Current dual-joystick works. Improvements:
- Make joystick dead zones bigger (too sensitive right now)
- Interaction button should be bigger and more prominent
- Add a "close" gesture (swipe down?) for overlays instead of requiring a small X button tap

### HUD Redesign

**Current HUD is cluttered.** The top bar has: game title, hint text, clock, tier badge with progress bar, quest log button, props badge, music toggle, mute toggle, screenshot button. That's 8-9 elements.

**Proposed minimal HUD:**

Top-left: Game clock (only shows when < 2 hours to close, turns red)
Top-right: Tier badge (small, just icon + name)
Bottom-center: Inventory bar (current, works)
Bottom-right: Context hint ("E to interact", "Talk to Vinny", etc.)

**Remove from persistent HUD:**
- Game title (player already knows what game they're playing)
- Props badge (show in quest log instead)
- Screenshot button (cut feature)
- Music/mute toggles (move to pause menu, accessed via ESC or a hamburger icon)

**Quest/Challenge HUD:**
- Active quest objective: small text below the top-right corner, auto-hides after 10s
- Challenge timer: only shows during active challenges, centered top
- Notifications: keep the stacking toast system, it works

---

## Summary: The Path Forward

| Priority | What | Why | Effort |
|----------|------|-----|--------|
| 1 | Cut dead features | Reduce ~500 lines, remove confusion | Small |
| 2 | Split Store.tsx | Make the codebase navigable | Medium |
| 3 | Extract page.tsx hooks | Make game logic comprehensible | Medium |
| 4 | Visual audit | Consistent style, fewer meshes | Small |
| 5 | Onboarding | New players actually play the game | Small |
| 6 | HUD cleanup | Less clutter, more immersion | Small |
| 7 | Re-add features (selective) | Only what's proven fun | Per-feature |

**The game has a good foundation.** The 3D store is atmospheric, the movie data integration is strong, and the core loop (browse -> pick -> checkout) works. The problem is feature creep without integration -- systems were added in parallel without talking to each other, and the codebase grew without being refactored.

The fix is surgical: cut the dead weight, split the files, clean the HUD, add onboarding. Don't rebuild. The store is too good to throw away.
