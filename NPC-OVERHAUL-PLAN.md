# NPC Overhaul — Master Plan

## Architecture Overview

```
ERA SELECTION
    ↓
NPC POOL (24 configs) → SPAWN MANAGER (10 desktop / 5 mobile)
    ↓                         ↓
GOAL SYSTEM              WAYPOINT GRAPH (55 nodes)
(rent_movie, grab_pizza,  (3 stores + parking + street)
 do_laundry, cross-biz)        ↓
    ↓                    BFS PATHFINDING
STATE MACHINE (14 states)      ↓
    ↓                    MOVEMENT (useFrame lerp)
PROXIMITY TRIGGERS
    ↓
┌──────────────┬────────────────┐
│ NPC-NPC CHAT │ PLAYER-NPC CHAT│
│ (scripted)   │ (dialogue tree │
│              │  + LLM fallback)│
└──────┬───────┴───────┬────────┘
       ↓               ↓
   SENTIMENT SCORING (keyword + LLM piggyback)
       ↓
   XP / RAPPORT SYSTEM (+5 friendly, -10 rude, -25 hostile)
       ↓
   ELEVENLABS TTS (spatial audio, per-personality voice)
```

---

## Phase A: Waypoint Graph + Pathfinding

55 waypoints spanning all 3 stores + exterior:

- **Video Store (22):** 6 shelf browsing spots (rows 1-3 left/right), 6 aisle pass-through nodes, new releases wall, counter approach + counter, 3 front-area aisles, door transition pair
- **Pizza Palace (7):** Counter, soda fountain, 4 booths, door transition pair
- **Laundromat (12):** 3 washers, 3 dryers, folding table, 3 chairs, vending machine, door transition pair
- **Exterior (14):** 3 street spawn/despawn points, 7 parking spots (matching car positions from store-layout.ts), 5 sidewalk segments connecting all three storefronts

Door transitions modeled as paired waypoints (exterior + interior) connected bidirectionally, so BFS pathfinding naturally routes NPCs through doors.

**File:** `src/lib/npc-waypoints.ts`

---

## Phase B: NPC Lifecycle + Goal System

### NPC Pool
24-NPC config pool with diverse names, appearances, personalities, walk speeds, chattiness values.

### Spawn Rules
- Spawn every 30-60 seconds from street/parking waypoints
- Fade in/out opacity transitions (1 second)
- Cap: 10 desktop, 5 mobile
- Configs returned to pool after despawn

### Goal Types (7, weighted random)

| Goal | Weight | Flow |
|------|--------|------|
| `rent_movie` | 30% | parking → store → browse 3 shelves → counter → leave |
| `grab_pizza` | 20% | parking → pizza → order → booth → eat → leave |
| `do_laundry` | 15% | parking → laundromat → washer → wait → dryer → fold → leave |
| `browse_then_pizza` | 10% | video store checkout → pizza palace |
| `just_browsing` | 15% | wander shelves, leave empty-handed |
| `pizza_then_movie` | 5% | pizza first, then video store |
| `quick_return` | 5% | straight to counter and out |

Each goal is a sequence of `GoalStep` objects with target waypoints (literal or resolved dynamically by type+zone), arrival states, and optional duration overrides.

**File:** `src/lib/npc-lifecycle.ts`

---

## Phase C: State Machine

14 states with weighted transitions:

```
spawning → entering → walking → browsing/ordering/loading_machine
    → talking_to_npc/talking_to_player → eating/waiting/folding
    → checking_out → leaving → despawning
```

Each state has:
- Duration range (min/max seconds)
- Speed multiplier
- Interruptibility flag (can player talk to this NPC?)
- Chat eligibility (can this NPC start an NPC-NPC conversation?)
- Animation hint (idle, walk, browse, talk, etc.)

Brain state in `useRef` (no React re-renders). Weighted transitions with context awareness.

**File:** `src/lib/npc-brain.ts`

---

## Phase D: NPC-NPC Conversations (Scripted + Spatial)

- **Proximity trigger:** 2 NPCs within ~2 units + both chat-eligible → chance to talk
- **Max 2 simultaneous conversations**
- **Pre-written era-specific scripts:** 20-30 per era × 5 eras = 100-150 total
- **Topics:** movie recs, late fees, genre debates, pizza opinions, laundry small talk, VHS nostalgia, weekend plans, sequel arguments
- NPCs face each other, speech bubbles via drei `<Html>`
- Audio through Web Audio HRTF panners — hear them chatting as you walk near
- Zustand store manages active convos, line advancement, busy flags

**Files:** `src/lib/npc-conversation-store.ts`, `src/lib/npc-conversation-scripts.ts`

---

## Phase E: Player-NPC Chat

### Fast Path (handles 70%+ of interactions, zero cost)
Keyword/regex matcher for common inputs:
- Greetings, directions ("where is horror?"), recommendations, goodbye
- Genre-specific responses, store policy questions

### Slow Path (freeform LLM)
- `gpt-4o-mini` — fast, cheap (~$0.001/conversation)
- Per-NPC system prompt with personality, era, knowledge bounds
- 2-sentence max responses — casual store talk, not essays
- NPCs don't know it's a game — they're in the 90s
- Era-locked: "It is 1992. You have never heard of the internet."

Chat opens on E-key interaction, locks player controls.

**Files:** `src/lib/player-chat-store.ts`, `src/app/api/npc-chat/route.ts`

---

## Phase F: Sentiment + XP/Rapport

### Keyword Scoring (primary, zero cost)
- **Positive:** "thanks", "please", "awesome", "you're the best" → +1 to +3
- **Negative:** "stupid", "shut up", ALL CAPS, excessive punctuation → -1 to -3

### LLM Piggyback (secondary, free when LLM already called)
Append `[SENTIMENT:friendly/neutral/rude/hostile]` tag to LLM responses.

### XP Deltas
| Tone | XP |
|------|----|
| Friendly | +5 |
| Neutral | +1 |
| Rude | -10 |
| Hostile | -25 |

### Per-NPC Rapport (-100 to +100)
- Below -50: NPC refuses to talk
- Above +50: unlocks special dialogue, discounts, quest access
- **NPC gossip:** rudeness near other NPCs spreads reputation penalty

**File:** `src/lib/sentiment.ts`

---

## Phase G: ElevenLabs Voice System

### Voice Mapping

| Character | Voice | Voice ID | Settings |
|-----------|-------|----------|----------|
| Vinny | Voice Design (gruff Italian-American) | Custom | stability 0.3, style 0.4 |
| Charlie | Liam (Energetic) | `TX3LPaxmHKxFdv7VOQHJ` | stability 0.4, style 0.5 |
| Pizza Clerk | Chris (Charming) | `iP95p4xoKVk53GoZ742B` | stability 0.5 |
| Laundromat | Roger (Laid-Back) | `CwhRBWXzGAHq8TQ4Fs17` | stability 0.5 |
| Movie Buff | Brian (Deep) | `nPczCjzI2devNBz1zQrb` | stability 0.5 |
| Parent | Matilda (Warm) | `XrExE9yKIg1WjnnlVkGX` | stability 0.4 |
| Teenager | Laura (Quirky) | `FGY2WhTYpPnrIDTdsKH5` | stability 0.3 |
| Kid | Voice Design (child) | Custom | stability 0.2, style 0.6 |
| Couple M | Eric (Smooth) | `cjVigY5qzO86Huf0OWal` | stability 0.5 |
| Couple F | Jessica (Playful) | `cgSgspJ2msm6clMCkdW9` | stability 0.4 |
| Regular | River (Relaxed) | `SAz9YHcvj6GT2YYXdXww` | stability 0.5 |
| Critic | George (British) | `JBFqnCBsd6RMkjVDRZzb` | stability 0.7, style 0.2 |

### TTS Strategy
- **Model:** `eleven_flash_v2_5` (75ms inference, 50% cheaper than multilingual)
- **Hybrid approach:**
  - Pre-generate scripted lines at build time (~500 clips, ~30MB)
  - Live TTS for freeform player chat
  - Server-side MD5 disk cache (`.tts-cache/`) so repeated lines never re-generate
  - Client-side `Map<string, AudioBuffer>` for session caching
- **Cost:** Starter plan ($5/mo, 30K credits) covers full pre-gen. Runtime near-zero with caching.
- **Pronunciation dictionary** for era terms: VHS, Blockbuster, specific movie titles
- **`seed` parameter** for deterministic output — same text = same audio every time
- **Graceful degradation:** If TTS fails → subtitle-only mode (already works)

### ElevenLabs API Notes
- Concurrent limits: Starter 3, Creator 5, Pro 10
- WebSocket streaming available for dynamic dialogue (low latency)
- Voice Design API for custom voices (Vinny, Kid) — `POST /v1/text-to-voice/design`
- Premade voices are unlimited and don't count against voice slots
- Custom voices count: Starter 3, Creator 10, Pro 20

**File:** `src/lib/npc-voices.ts`

---

## Phase H: Era Lock (All Systems)

All NPC systems must be era-aware:

- **Conversation scripts** keyed to era (already have 94 one-liners + 37 conversations across 5 eras in `era-conversations.ts`)
- **LLM system prompts** include era year and cultural context
- **NPC cultural references**, slang, movie names all era-correct:
  - Late 80s: Die Hard, Rain Man, Top Gun, 80s slang
  - Early 90s: Terminator 2, Home Alone, Nirvana
  - Mid 90s: Pulp Fiction, Friends, OJ trial
  - Late 90s: Matrix, Titanic, Y2K
  - Present: modern references, streaming nostalgia
- **`setCurrentEra()`** already wired in audio system — extend to all NPC text
- **Era-specific NPC outfit overrides** (80s neon vs 90s flannel vs present streetwear)

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/lib/npc-waypoints.ts` | 55-node waypoint graph with BFS pathfinding |
| `src/lib/npc-brain.ts` | State machine, goal system, transitions |
| `src/lib/npc-lifecycle.ts` | Spawn/despawn manager, pool, caps |
| `src/lib/npc-conversation-store.ts` | Zustand store for NPC-NPC pairing |
| `src/lib/npc-conversation-scripts.ts` | Era-keyed scripted exchanges |
| `src/lib/npc-voices.ts` | Personality → ElevenLabs voice ID mapping |
| `src/lib/player-chat-store.ts` | Zustand store for player↔NPC freeform chat |
| `src/lib/sentiment.ts` | Keyword + LLM sentiment scoring |
| `src/app/api/npc-chat/route.ts` | LLM endpoint for freeform NPC responses |

---

## Build Order (Dependencies)

1. **Phase A: Waypoints + Pathfinding** — foundation everything else needs
2. **Phase B: Lifecycle + Goals** — NPCs that come and go across the strip mall
3. **Phase C: State Machine** — natural behavior (browsing, eating, waiting)
4. **Phase D: NPC-NPC Conversations** — store feels alive with chatter
5. **Phase G: ElevenLabs Voices** — voice the conversations with spatial audio
6. **Phase E+F: Player Chat + Sentiment** — interactive relationships with XP consequences
7. **Phase H: Era Lock** — polish pass ensuring all systems respect the selected era

---

## Living Strip Mall Vision

NPCs aren't just in the video store — they're everywhere:
- **Outside:** Walking to/from cars, chatting by entrance, smoking break
- **Arriving/Leaving:** Walk in from street/parking, do their thing, leave
- **Pizza Palace:** Ordering, eating in booths, waiting for pizza
- **Laundromat:** Loading machines, folding clothes, reading magazines
- **Cross-business:** Grab pizza then rent a movie. Do laundry then browse while waiting.
- **Goals drive movement** — not random wandering, but purposeful behavior

The whole strip mall should feel like a living place where things happen whether you're watching or not.
