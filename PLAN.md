# Friday Night Video — Full Game Design

> **STATUS (April 2026):** Historical design doc. The shipped game has diverged
> significantly from this plan after a deliberate MVP-tightening pass: XP/tier
> system removed from UI, weekly challenges dropped, quest log merged into
> challenges, Pizza Palace + apartment-above-laundromat cut, customer-job
> "Return Shift" challenge added. For the live state of the game, see CLAUDE.md
> and README.md. Treat this file as a record of intent, not a roadmap.

## Vision
A **video store sim** where you're a new hire at Friday Night Video. Vinny (the legendary clerk) is training you. Customers walk in with requests, you browse shelves and recommend films, Vinny quizzes you, and you collect iconic movie artifacts. The store evolves as you rank up.

**Audience:** Blockbuster nostalgia crowd (30-45), Letterboxd film buffs, cozy game fans
**Tone:** Warm, funny, knowledgeable — like your favorite video store clerk
**Comparables:** VA-11 HALL-A (bartender conversation sim), Papers Please (customer service under pressure), Unpacking (discovery through objects), Cook Serve Delicious (flow-state service)

---

## Core Loop: The Shift

Each play session is a **shift** at the store. A shift contains:
- **3-5 customer requests** (escalating difficulty based on rank)
- **1 Vinny trivia round** (2-3 questions per round)
- **1 hidden artifact** to discover (daily rotation)
- **Shift rating** (1-5 stars based on customer satisfaction + trivia accuracy)

After each shift: summary screen with XP earned, artifacts found, customer reactions, streak counter. "CLOCK IN AGAIN?" button → next shift.

**The "one more shift" hook:** You always know the shift will end, so you start another.

---

## Gameplay Systems

### 1. Customer Requests (Core Mechanic)

**Flow:** Customer walks in → dialogue box with their request → you accept → walk to a shelf → press SPACE to pick that genre → customer reacts → scored.

**Customer Types:**
| Type | Example Request | Difficulty | XP |
|------|----------------|------------|-----|
| **The Easy Ask** | "I want something scary" | New Hire | 20-30 |
| **The Specific** | "80s action, not Stallone" | Regular | 30-40 |
| **The Mood** | "I need to ugly cry tonight" | Film Buff | 40-50 |
| **The Couple** | Two people want different things | Film Buff | 50-60 |
| **The Critic** | "Surprise me. I've seen everything." | Cinephile | 60-80 |
| **The Kid** | "Something my parents won't say no to" | Regular | 30-40 |
| **The Regular** | Returns and references your last pick | Any | Bonus XP |

**Returning Customers (VA-11 HALL-A mechanic):**
- NPCs remember what you recommended last visit
- "That horror movie you picked? My girlfriend LOVED it. Got anything else like that?"
- Bad picks: "Yeah... that one you recommended was terrible. Let's try again."
- Creates emotional investment — you care about getting it right

**Scoring:**
- **Great pick** (correct genre, best match): +30 XP, customer delighted
- **OK pick** (adjacent genre): +10 XP, customer shrugs
- **Bad pick** (wrong genre entirely): +0 XP, customer disappointed
- **Streak bonus**: 3 great picks in a row = artifact drop

### 2. Vinny Trivia

**Flow:** Walk to counter → SPACE → Vinny says "Pop quiz, hotshot" → multiple choice question → immediate feedback with Vinny's reaction + film lore.

**Question Categories:**
- Release years ("What year did Jaws come out?")
- Directors ("Who directed Blade Runner?")
- Famous quotes ("Which film: 'Here's looking at you, kid'?")
- Plot knowledge ("What's the room number in The Shining?")
- Oscars ("Best Picture 1994?")
- Connections ("What do Alien and Blade Runner have in common?")

**Progression:** Questions get harder as you rank up. New Hire gets "What year did Star Wars come out?" Cinephile gets "What was Kubrick's only film to use a Steadicam?"

**Rewards:** +20 XP per correct answer. 3 correct in a row = artifact drop.

### 3. Movie Artifacts (Collection System)

**The Collection Wall:** A dedicated area in the store (back wall or unlockable back room) with shadow-outline slots. Found artifacts display in full color. Each one has a Vinny monologue when you place it.

**Artifact Tiers:**

**Legendary (Gold border, sparkle animation) — 10 items**
| Artifact | Film | How to Unlock |
|----------|------|--------------|
| Ruby Slippers | Wizard of Oz | Complete all genre masteries |
| Lightsaber | Star Wars | 10 trivia streak |
| DeLorean Keys | Back to the Future | Recommend 25 films |
| Golden Idol | Raiders of the Lost Ark | Perfect shift (all 5-star customers) |
| One Ring | Lord of the Rings | Find all Rare artifacts |
| Rosebud Sled | Citizen Kane | Reach Cinephile rank |
| Wilson Volleyball | Cast Away | Help 50 customers |
| Infinity Gauntlet | Avengers | Complete 20 shifts |
| Glass Slipper | Cinderella | 15 great Family picks |
| Flux Capacitor | Back to the Future | Daily login streak (7 days) |

**Rare (Silver border) — 15 items**
| Artifact | Film | How to Unlock |
|----------|------|--------------|
| Proton Pack | Ghostbusters | 5 Comedy great picks |
| Red Pill | The Matrix | 5 Sci-Fi great picks |
| Fedora | Indiana Jones | 5 Action great picks |
| Hockey Mask | Friday the 13th | 5 Horror great picks |
| Hoverboard | BTTF Part II | 5 trivia correct in a row |
| Boxing Gloves | Rocky | 5 Drama great picks |
| Whip | Indiana Jones | Browse every shelf in one shift |
| Necronomicon | Evil Dead | Find 5 hidden store artifacts |
| Wonka Bar | Charlie & the Chocolate Factory | 5 Family great picks |
| Director's Chair | General | Reach Film Buff rank |
| Film Reel (Gold) | General | 10 shifts completed |
| VHS Rewinder | General | Reach Regular rank |
| Clapperboard | General | Answer 20 trivia correctly |
| Movie Ticket (Gold) | General | 100 total XP earned |
| Popcorn Bucket | General | Visit 3 days in a row |

**Common (Bronze border) — 25 items**
- Genre-specific VHS tapes (1 per genre, earned by browsing that genre)
- Movie ticket stubs (earned by customer interactions)
- Film strip segments (earned by trivia)
- Scattered around store as daily-rotating hidden finds

**Total: 50 artifacts** (10 legendary, 15 rare, 25 common)

### 4. Reputation System

**Reputation Score:** 0-100, starts at 50. Carries between sessions.
- Great customer pick: +5
- OK pick: +1
- Bad pick: -3
- Trivia correct: +2
- Trivia wrong: -1

**Reputation Effects:**
| Rep | Effect |
|-----|--------|
| 0-20 | "Slow day" — only 2 customers per shift, easy requests only |
| 21-40 | Normal flow — 3 customers, mixed difficulty |
| 41-60 | "Word's getting out" — 4 customers, harder requests available |
| 61-80 | "Busy night" — 5 customers, couples and critics show up |
| 81-100 | "Friday Night Rush" — 5 customers + time pressure + VIP customers |

### 5. Rank Progression

| Rank | XP | Unlock |
|------|-----|--------|
| New Hire | 0 | Basic gameplay |
| Regular | 50 | Vinny remembers your name, calls you by it |
| Film Buff | 150 | Back room unlocked (staff picks with deep cuts) |
| Cinephile | 300 | Vinny asks YOUR opinion on new arrivals |
| Honorary Manager | 500 | Rearrange shelves, Vinny consults you on orders |

**Store Evolution:** As you rank up:
- Shelves get fuller (more tapes rendered)
- Neon sign gets brighter
- New posters appear on the wall
- Bulletin board gets more notes
- Vinny gets new vest colors

### 6. Shareable Recommendation Cards

When Vinny recommends a film or you successfully recommend one to a customer, generate a shareable card:
```
┌─────────────────────┐
│  ╔══════════════╗    │
│  ║  [POSTER]    ║    │
│  ║              ║    │
│  ╚══════════════╝    │
│  THE SHAWSHANK       │
│  REDEMPTION (1994)   │
│                      │
│  "If you haven't     │
│  seen this, we need  │
│  to talk." — Vinny   │
│                      │
│  🎬 Friday Night     │
│     Video            │
│  ★ Film Buff | 280XP │
└─────────────────────┘
```
One-tap copy/share. This is the viral mechanic.

### 7. Daily Trivia Challenge

- One trivia question per day, same for all players
- Shareable result (Wordle-style): "FNV Daily #42 ✅ 1/1"
- Streak counter for consecutive correct days
- 7-day streak = Legendary artifact

---

## Visual Design

### Palette (Blockbuster-inspired)
- **Walls:** `#0c2244` → `#132d5e` (deep Blockbuster blue)
- **Floor:** `#1e2640` (blue commercial carpet)
- **Shelves:** `#6b4226` → `#8b5e3c` (warm wood)
- **Counter:** `#3a1f18` → `#6a4a38` (dark wood with polish)
- **Accents:** `#ffd700` (gold — borders, signs, highlights)
- **Neon:** `#ff3e7a` (pink), `#00d4ff` (cyan) for signage

### 3D / Isometric Store View
The current top-down flat view should be upgraded to a **2.5D isometric perspective**:
- Floor tiles at slight angle (isometric grid)
- Shelves have visible depth (side panels, top surfaces)
- Counter has 3D form (front face + top surface)
- Characters have drop shadows and slight perspective scaling
- Walls have baseboard detail and crown molding
- Ceiling visible with fluorescent light fixtures

This matches the quality bar of games like Unpacking, Wilmot's Warehouse, and the store sections of Moonlighter.

### Character Art
- **Vinny:** 64px tall, detailed CSS art (vest, nametag, mustache, expressions)
- **Player:** 42px tall, red shirt (customizable later), walks with leg animation
- **Customers:** 5 visual variants, speech bubbles, simple expressions
- **All characters:** Drop shadows, smooth tile-to-tile movement transitions

---

## Tech Architecture

### Existing (Keep)
- Next.js 16 + React 19 + Tailwind 4
- OpenAI API (gpt-4o-mini) for Vinny free chat via SSE
- TMDB API for film data, posters, trending, search, detail
- localStorage for persistence
- Existing `/api/*` routes unchanged
- `/chat` route as legacy fallback

### New Files
```
src/lib/
  game-data.ts        ← customer requests, trivia, XP, ranks (DONE)
  store-grid.ts       ← tile grid, collision, interactions (DONE)
  collectibles.ts     ← artifact definitions, unlock conditions
  reputation.ts       ← rep score, effects, persistence
  shift.ts            ← shift structure, scoring, state machine
  share-card.ts       ← generate shareable recommendation cards

src/components/game/
  GameWorld.tsx        ← (rename page.tsx internals) main game container
  TitleScreen.tsx      ← title screen (DONE)
  StoreMap.tsx         ← store rendering (DONE, needs 3D upgrade)
  PlayerSprite.tsx     ← player character (DONE)
  VinnySprite.tsx      ← Vinny CSS art (DONE, needs expressions)
  NPCWalker.tsx        ← ambient NPCs (DONE)
  CustomerRequest.tsx  ← customer dialogue + scoring (DONE)
  TriviaPanel.tsx      ← trivia UI (DONE)
  DialogueBox.tsx      ← Vinny free chat (DONE)
  ShelfBrowser.tsx     ← VHS tape grid (DONE)
  HUD.tsx              ← top bar (DONE, needs rank/rep display)
  CollectionWall.tsx   ← artifact display wall (NEW)
  ShiftSummary.tsx     ← end-of-shift scoring screen (NEW)
  ShareCard.tsx        ← recommendation card generator (NEW)
  VinnyExpressions.tsx ← expression variants for portrait (NEW)
```

---

## Build Order

### Phase A: Visual Upgrade (Current Priority)
1. Upgrade store to 2.5D isometric look
2. Add depth to shelves, counter, walls
3. Improve lighting (visible light fixtures, warm pools)
4. Vinny expression variants
5. Better NPC character variety

### Phase B: Shift System
1. Shift state machine (start → customers → trivia → summary)
2. Shift summary screen with star rating
3. Customer queue (3-5 per shift based on reputation)
4. "Clock In Again?" flow

### Phase C: Artifacts
1. Define all 50 artifacts with unlock conditions
2. Build Collection Wall component + back room zone
3. Artifact drop logic (streak, completion, daily hidden)
4. Vinny monologues for each artifact

### Phase D: Reputation + Returning Customers
1. Reputation score with persistence
2. Reputation effects on customer difficulty/quantity
3. Returning customer system (remember last rec, react)
4. Customer personality variety

### Phase E: Social / Sharing
1. Recommendation card generator (canvas or DOM-to-image)
2. Daily trivia challenge (same question for all)
3. Share flow (clipboard + social links)
4. Collection progress sharing

---

## Constraints
- No new npm dependencies unless absolutely necessary
- All existing API routes untouched
- Mobile playable (touch d-pad + tap interactions)
- Performance: pure CSS/DOM, no canvas, no heavy libraries
- TMDB API key: `TMDB_API_KEY` in `.env.local`
- OpenAI API key: `OPENAI_API_KEY` in `.env.local`

## Source Plan
Original plan: `~/.claude/plans/wiggly-wondering-phoenix.md`
Research: conducted 2026-03-27 (competitive analysis, audience, artifacts, UX)
