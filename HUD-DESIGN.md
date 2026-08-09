# Friday Night Video -- HUD Overhaul Design Spec

> ## ⚠️ Chrome stripped since this spec (2026-08-07, commit `9a37e65`)
>
> The panel treatment specified here — `--fnv-panel-bg: rgba(6, 8, 16, 0.92)`
> with a gold border and drop shadow — shipped, and in a 3D build it was
> outcompeting the thing it framed. `.g3-hud` was a 980px opaque slab pinned
> top-left through roughly the top 15% of every frame; it was the first object
> the eye landed on in every screenshot taken of this game.
>
> **Now:** `.g3-hud` has no fill, no border, no shadow. Legibility comes from
> `text-shadow`, so it reads over both a bright storefront and a dark aisle.
> Pills keep a faint `rgba(0,0,0,0.28)` so numbers stay parseable. The subtitle
> lost its 3px gold frame and hard drop shadow and is now a `0.55` scrim with a
> single bottom rule — once the HUD stopped being a slab, the subtitle became
> the heaviest object on screen by default.
>
> The layout, information architecture, and element inventory below are all
> still accurate and still worth following. It's specifically the *panel
> chrome* that was wrong. General principle for this project: the room is the
> product, and UI that competes with it loses even when the UI is well made.
>
> Not yet done, and still the right idea: fading the HUD out when idle and
> restoring it on input.

## 1. Full Audit of Current UI

### 1.1 Element Inventory

Every UI element rendered on top of the 3D canvas, documented with position, trigger, and issues.

---

#### A. Crosshair
- **What:** 2px white dot at screen center
- **Position:** Fixed center (`top: 50%; left: 50%`)
- **Trigger:** Always visible when no overlay is open
- **CSS class:** `.g3-crosshair`
- **Issues:**
  - Too small (2px) -- hard to see against bright shelves
  - No color change on hover over interactable objects
  - No indication of interaction range

#### B. Hover Label
- **What:** "[E] Browse Horror", "[E] Talk to Vinny" etc.
- **Position:** Fixed, 20px below crosshair center
- **Trigger:** When crosshair raycasts onto an interactable object (from InteractionSystem `onHover`)
- **CSS class:** `.g3-hover-label`, `.g3-hover-key`
- **Issues:**
  - Good gold styling but no entry/exit animation (just pops in)
  - The `E` key badge is well-designed
  - On mobile, still shows "[E]" even though interaction is via touch button
  - No distance fade -- appears at full opacity immediately

#### C. Subtitle Display (Vinny's voice lines)
- **What:** Italic gold text in a dark pill at bottom
- **Position:** Fixed `bottom: 80px`, centered
- **Trigger:** When `setSubtitleHandler` fires (Vinny audio plays)
- **CSS class:** `.g3-subtitle`
- **Issues:**
  - Overlaps with NPC chatter (same bottom position, but subtitle takes precedence via z-index 13 vs 12)
  - On mobile, moved to `bottom: 170px` which may conflict with challenge list
  - No queue system -- new subtitle replaces old immediately
  - Good slide-in animation

#### D. NPC Conversation Chatter
- **What:** Overheard customer conversations like `Karen: "Did you see that new horror movie?"`
- **Position:** Fixed `bottom: 80px`, centered (same as subtitle)
- **Trigger:** Automatic timer every 30-60 seconds, plays multi-line conversations sequentially
- **CSS class:** `.g3-npc-chatter`
- **Issues:**
  - Same position as subtitle -- hidden when subtitle is active (conditional render `!subtitle`)
  - Lower z-index (12) than subtitle (13)
  - Good ambient effect but no spatial awareness (plays even if no NPCs nearby)
  - On mobile, font shrinks to 0.75rem which is borderline readable

#### E. Pickup Flash
- **What:** Full-screen gold flash overlay when picking up VHS or snack
- **Position:** Fixed, covers entire viewport
- **Trigger:** When a VHS tape or snack is picked up via interaction
- **CSS class:** `.g3-pickup-flash`
- **Issues:**
  - Good feedback but lasts 600ms (flash animation) -- could be disorienting if rapid pickups
  - No variation between VHS pickup vs snack pickup

#### F. Pickup Toast
- **What:** "VHS emoji + Movie Title" text above crosshair
- **Position:** Fixed `top: calc(50% - 60px)`, centered
- **Trigger:** On item pickup, lasts 1500ms
- **CSS class:** `.g3-pickup-toast`
- **Issues:**
  - Good animation (scale in, float up, fade out)
  - Always shows VHS emoji even for snack pickups (snack has its own emoji in title)
  - Positioned relative to center which is correct for FPS

#### G. Top HUD Bar
- **What:** Title "FRIDAY NIGHT VIDEO" | context hint | right-side buttons
- **Position:** Fixed `top: 0`, full width, 44px height
- **Trigger:** Always visible
- **CSS class:** `.g3-hud`, `.g3-hud-title`, `.g3-hud-hint`, `.g3-hud-right`
- **Contents (left to right):**
  - Title: "FRIDAY NIGHT VIDEO" in gold
  - Center hint: contextual text (controls, "Take movie to Vinny!", overlay close instructions)
  - Right side: Quest Log button, Props badge, Music toggle, Mute toggle, Screenshot button
- **Issues:**
  - No membership tier display
  - No XP display
  - No clock/time display
  - Props badge `propsCount.unlocked/propsCount.total` works but is small
  - On mobile, center hint is `display: none` -- loses important context
  - All right-side buttons use `.g3-screenshot-btn` class even for non-screenshot functions (naming inconsistency)
  - Buttons use emoji (camera, speaker, music note) with no text -- ambiguous on first visit
  - No visual grouping between buttons
  - Height shrinks to 38px on mobile, buttons get cramped

#### H. Movie Inventory HUD
- **What:** Stack of VHS poster cards with titles, "DROP ALL" button
- **Position:** Fixed `bottom: 20px`, `right: 20px`
- **Trigger:** When `heldMovies.length > 0` and no overlay
- **CSS class:** `.g3-inventory`, `.g3-inventory-card`, `.g3-inventory-stack`
- **Issues:**
  - Good visual design -- mini poster cards with gold borders
  - "Take to Vinny to check out" hint is helpful
  - Remove button per card only visible on hover (unusable on mobile without hover)
  - Stacks horizontally with `flex-direction: row-reverse` -- confusing direction
  - On mobile, moves to `bottom: 160px` to avoid joystick, shrinks to 50px cards
  - Max width 280px (200px on mobile) -- can overflow with 3 movies
  - No max inventory indicator (nothing says "max 3")

#### I. Snack Inventory HUD
- **What:** Stack of snack cards with emoji and name
- **Position:** Fixed `bottom: 20px` (or 180px if movies are held), `right: 20px`
- **Trigger:** When `heldSnacks.length > 0` and no overlay
- **CSS class:** Same `.g3-inventory` with inline style overrides
- **Issues:**
  - Uses green border color via inline style (breaks consistency with CSS class approach)
  - Position is calculated via inline style `bottom: heldMovies.length > 0 ? 180 : 20` -- fragile
  - No max capacity indicator
  - Stacks on top of movie inventory -- can get very tall

#### J. Challenge Shopping List HUD
- **What:** Movie Night list showing 3 target movies with checkmarks, timer, hint buttons
- **Position:** Fixed `top: 60px`, `left: 20px`
- **Trigger:** When `challenge` is active and no overlay
- **CSS class:** `.g3-challenge-list`, `.g3-challenge-item`, `.g3-challenge-timer`
- **Issues:**
  - Good design -- checklist feel, genre hints on demand
  - Timer font is tiny (0.6rem) -- hard to read during intense gameplay
  - Speed run timer turns red at 15s remaining -- good
  - On mobile, shrinks to `min-width: 150px`, max 200px -- can truncate long movie titles
  - Hint buttons ("?") are 18px -- tiny touch target on mobile

#### K. Vinny's Mystery HUD
- **What:** Cryptic clue text, progressive hints, wrong-guess feedback
- **Position:** Fixed `top: 60px`, `left: 20px` (reuses `.g3-challenge-list`)
- **Trigger:** When `mysteryClue` is active and no overlay
- **Issues:**
  - Reuses challenge list styling -- looks identical, no visual distinction
  - Wrong guess message is inline-styled red text -- should be a proper class
  - Hint button is repurposed with inline styles (`width: auto, borderRadius: 4, padding: 3px 10px`)

#### L. New Release Race HUD
- **What:** Race countdown with movie name and timer
- **Position:** Fixed `top: 60px`, `left: 20px` (reuses `.g3-challenge-list` with inline red border)
- **Trigger:** When `raceActive` and no overlay
- **Issues:**
  - Good urgency feel with red accent
  - Timer is 1rem bold -- better than other challenge timers
  - Red color at 5s remaining
  - Reuses challenge list with inline style overrides

#### M. Challenge Complete Overlay
- **What:** Full-screen celebration: icon + title + time + button
- **Position:** Fixed, covers viewport with blur backdrop
- **Trigger:** On challenge completion (success or timeout)
- **CSS class:** `.g3-challenge-complete`, `.g3-challenge-complete-card`
- **Issues:**
  - Uses emoji icons (movie camera, clock, magnifying glass) -- good
  - No XP reward display
  - No prop unlock preview (that comes separately via RewardOverlay)
  - "NICE!" button is only way to dismiss -- also dismisses on backdrop click

#### N. Race Result Overlay
- **What:** Win/lose screen for New Release Race
- **Position:** Fixed, covers viewport (reuses `.g3-challenge-complete`)
- **Trigger:** When race ends (win or timeout)
- **Issues:**
  - Separate from challenge complete -- duplicated pattern
  - Trophy or frustrated emoji

#### O. Challenge Selection Overlay
- **What:** Card list of 4 challenge types with lock/unlock states
- **Position:** Centered overlay (`.g3-overlay-center`)
- **Trigger:** Interacting with challenge board in store
- **Issues:**
  - Good progressive unlock system
  - Locked challenges show lock emoji + unlock requirement
  - Completion stats per challenge type
  - No visual progression bar toward next unlock

#### P. Trophy Collection Overlay
- **What:** 3-column grid of all 19 props (owned or locked)
- **Position:** Centered overlay
- **Trigger:** Clicking props badge in HUD or interacting with trophy shelf in store
- **Issues:**
  - Good grid layout with rarity colors (gold/purple/cyan)
  - Locked items show "???" with "Keep playing to unlock"
  - No sorting by rarity
  - No indication of HOW to unlock specific props
  - Scrollable but no scroll indicator

#### Q. Quest Log Overlay
- **What:** Full quest management: Active, Available, Completed sections
- **Position:** Centered overlay
- **Trigger:** J key or quest log button in HUD
- **Issues:**
  - Good sectioned layout with color-coded borders (blue=active, green=available, dim=completed)
  - "ACCEPT QUEST" button on available quests
  - Progress bar per quest (done/total objectives)
  - XP rewards shown but no total XP display anywhere
  - No quest tracking pin (can't mark a quest as "tracked" to show on HUD)
  - On mobile, max-height shrinks to 60vh

#### R. Quest Notification Toast
- **What:** Gold pill toast: "Quest: Visited HORROR section", "Quest Complete: ..."
- **Position:** Fixed `top: 60px`, centered
- **Trigger:** On quest objective completion or quest completion, 3 second duration
- **CSS class:** `.g3-quest-notif`
- **Issues:**
  - Good animation (slide down, then fade out at 2.5s)
  - z-index 1000 -- highest in the app, always on top
  - No stacking -- rapid notifications replace each other
  - No distinction between "objective complete" and "quest complete" (same styling)
  - "+50 XP" text appears on side quest completion but no XP animation/counter

#### S. RPG Dialogue Box
- **What:** Classic JRPG-style bottom dialogue box with portrait, name, text, numbered choices
- **Position:** Fixed bottom, max-width 720px, centered
- **Trigger:** Interacting with Vinny, Charlie, or customers (opens `rpg_dialogue` overlay)
- **CSS class:** `.g3-rpg-overlay`, `.g3-rpg-box`, `.g3-rpg-nameplate`, etc.
- **Issues:**
  - Excellent design -- gold border, name plate with portrait badge, numbered choices
  - Keyboard support (1-4 to select, Q to leave) -- great
  - Dark gradient background lets you see the 3D store behind
  - Portrait is just a letter ("V" for Vinny) -- should be proper character art
  - No typewriter text animation
  - No dialogue history scroll (previous lines not visible)
  - Quest start/complete triggers work well from dialogue choices

#### T. Reward Overlay (Prop Unlock)
- **What:** Celebration overlay when a new prop is unlocked (imported component)
- **Position:** Presumably full-screen overlay
- **Trigger:** When `rewardProp` is set (after challenge/quest completion)
- **Component:** `<RewardOverlay prop={rewardProp} onDismiss={...} />`
- **Issues:**
  - Good that it exists as a separate celebration moment
  - Unclear if it stacks with challenge complete overlay

#### U. Shelf Browser
- **What:** Genre movie browser panel (imported component)
- **Position:** Bottom slide-up overlay
- **Trigger:** Interacting with a shelf section in the store
- **Component:** `<ShelfBrowser>` with `onFilmClick` to open film detail
- **Issues:**
  - Slides up from bottom -- good for browse-while-seeing-store
  - On mobile, takes 85vh

#### V. Film Detail Modal
- **What:** VHS back-of-case design with poster, synopsis, credits, streaming, watchlist, rating
- **Position:** Centered fixed overlay with dark backdrop
- **Trigger:** Clicking a film in shelf browser, or taking held movie to Vinny
- **Component:** `<FilmDetailModal>`
- **Issues:**
  - Beautiful VHS aesthetic -- genre-colored left border, barcode, Courier New font
  - Watchlist + star rating integration
  - Similar films row -- can navigate between films
  - 360px fixed width -- narrow on desktop, may overflow on mobile
  - No "Pick up this movie" button from the detail view

#### W. Vinny's Five (Puzzle) Overlay
- **What:** Movie guessing game: progressive clues, blurred backdrop, search input
- **Position:** Full-screen overlay with movie backdrop
- **Trigger:** Interacting with TV in the store
- **Issues:**
  - Good progressive reveal (clue -> genre -> cast -> tagline -> poster)
  - Star track showing remaining guesses
  - Search with live results from TMDB
  - Win/lose reveal with movie poster

#### X. Quote / Synopsis Quiz Overlays
- **What:** Multiple choice quizzes -- "Name That Quote" and "Back of the Box"
- **Position:** Centered overlay
- **Trigger:** Talking to Vinny (random 50% RPG dialogue, 25% quote, 25% synopsis)
- **Issues:**
  - Good quiz format with A/B/C/D buttons
  - Vinny commentary on right/wrong
  - No XP reward display on correct answer
  - No streak tracking visible in UI

#### Y. Controls Hint (Initial)
- **What:** "WASD to move | E interact | J quests" text on first entering the store
- **Position:** Fixed `bottom: 24px`, centered
- **Trigger:** On game start, fades out over 5 seconds
- **CSS class:** `.g3-hint`
- **Issues:**
  - Auto-fades via CSS animation -- good for not cluttering
  - Only shown once, no way to recall it
  - Missing C for screenshot, number keys for dialogue

#### Z. Loading Overlay
- **What:** Logo + "Opening the store..." pulsing text
- **Position:** Full-screen overlay
- **Trigger:** During 3D scene loading, fades out when ready
- **Issues:**
  - Good branded loading screen
  - Smooth opacity transition to gameplay

#### AA. Mobile Touch Controls
- **What:** Virtual joystick (left) + interact button (right)
- **Position:** Joystick: bottom-left (32px). Interact: bottom-right (32px)
- **Trigger:** Automatically on mobile devices
- **CSS class:** `.mobile-joystick`, `.mobile-interact-btn`
- **Issues:**
  - Good size for thumb reach (120px joystick, 80px button)
  - No sprint button
  - No quest log button (J key not available on mobile)
  - Interact button just says "INTERACT" -- could show contextual label

---

### 1.2 Summary of Cross-Cutting Issues

| Issue | Impact |
|-------|--------|
| No XP system in UI (XP is in quest rewards but never displayed) | Players don't feel progression |
| No membership tier display | Core RPG feature invisible |
| No in-game clock | Closing time mechanic has no UI |
| Notifications don't stack (rapid events lose info) | Players miss quest updates |
| Challenge HUDs all reuse same class with inline overrides | Inconsistent, hard to maintain |
| Inventory has no max capacity indicator | Players don't know limits |
| Mobile loses the context hint entirely | Touch players have less info |
| No tracked quest mini-HUD | Players forget active objectives |
| Trophy collection has no unlock hints | Players don't know what to do |
| Multiple overlays share z-index ranges (10-30) | Potential layering conflicts |
| VHS Film Detail is hardcoded 360px | Not responsive |
| Portrait is just a letter, not art | Breaks immersion |
| No CRT/scanline aesthetic on HUD elements | Missed theming opportunity |

---

## 2. Proposed Layout Diagram

```
+===========================================================================+
|  TOP BAR (always visible, 48px)                                            |
|  [FNV Logo]  FRIDAY NIGHT VIDEO          [Clock] [Tier Badge] [XP Bar]    |
|              contextual hint text         [Quest] [Mute] [Music] [Cam]    |
+===========================================================================+
|                                                                            |
|  QUEST TRACKER            (top-left, contextual)                           |
|  +---------------------------+                                             |
|  | ACTIVE QUEST              |                                             |
|  | "The Friday Night..."     |                                             |
|  | [x] Horror  [ ] Comedy    |                                             |
|  | [ ] Action   (1/3)        |                                             |
|  +---------------------------+                                             |
|                                                                            |
|                                                                            |
|                                                                            |
|  CHALLENGE HUD            (top-left, replaces quest tracker when active)   |
|  +---------------------------+                                             |
|  | MOVIE NIGHT  |  01:23     |                                             |
|  | [x] Aliens   (Action)     |                                             |
|  | [ ] Clueless  ?           |                                             |
|  | [ ] Fargo     ?           |                                             |
|  +---------------------------+                                             |
|                                                                            |
|                                                NOTIF TOAST (top-center)    |
|                                                +---------------------+     |
|                                                | Quest Complete! +50XP|    |
|                                                +---------------------+     |
|                                                                            |
|                                                                            |
|                          CROSSHAIR                                         |
|                              +                                             |
|                       [E] Browse Horror                                    |
|                                                                            |
|                      PICKUP TOAST (center-up)                              |
|                      +-- Picked up: Aliens --+                             |
|                                                                            |
|                                                                            |
|             SUBTITLE (lower-center)                                        |
|             +-- "Great choice, kid!" --+                                   |
|                                                                            |
|             NPC CHATTER (lower-center, below subtitle)                     |
|             +-- Karen: "Have you seen..." --+                              |
|                                                                            |
+-----+                                                        +--------+   |
| INV |  MOVIES (3 slots)          SNACKS (5 slots)             |        |   |
| BAR |  [poster][poster][empty]   [candy][soda][--][--][--]    | (mob.) |   |
+-----+                                                        +--------+   |
+===========================================================================+
|  RPG DIALOGUE BOX (bottom, when talking to NPC)                            |
|  +-----------------------------------------------------------------------+ |
|  | [V] VINNY                                                             | |
|  | "Hey kid, looking for something? I've got a recommendation..."        | |
|  |                                                                       | |
|  | [1] What do you recommend?                                            | |
|  | [2] I'm just browsing.                                                | |
|  | [3] Got any quests for me?                                            | |
|  | [Q] Leave                                                             | |
|  +-----------------------------------------------------------------------+ |
+===========================================================================+
```

### Layer Hierarchy (z-index)

```
z-index:
  5   -- Crosshair, hover label
  10  -- Top HUD bar, controls hint
  12  -- Inventory bar, challenge HUD, quest tracker
  15  -- Pickup flash
  16  -- Pickup toast
  18  -- NPC chatter
  20  -- Subtitle
  25  -- Notification toasts (stacking)
  30  -- Bottom overlays (shelf browser)
  35  -- RPG dialogue box
  40  -- Center overlays (quest log, trophy, challenge select, quiz)
  50  -- Film detail modal
  60  -- Reward celebration
  70  -- Full-screen overlays (Vinny's Five puzzle)
  100 -- Loading screen
```

---

## 3. Design Tokens

### 3.1 Colors

```css
:root {
  /* Primary palette -- Blockbuster inspired */
  --fnv-gold:          #ffd700;
  --fnv-gold-dim:      rgba(255, 215, 0, 0.6);
  --fnv-gold-subtle:   rgba(255, 215, 0, 0.15);
  --fnv-blue-dark:     #0a1a3a;
  --fnv-blue-mid:      #0f2244;
  --fnv-blue-panel:    rgba(10, 24, 48, 0.95);
  --fnv-navy:          #1a2a48;

  /* Text */
  --fnv-text-primary:  #e8e2d6;
  --fnv-text-dim:      rgba(232, 226, 214, 0.5);
  --fnv-text-faint:    rgba(232, 226, 214, 0.25);

  /* Rarity */
  --fnv-rarity-legendary:  #ffd700;
  --fnv-rarity-rare:       #a855f7;
  --fnv-rarity-uncommon:   #06b6d4;

  /* Membership tiers */
  --fnv-tier-bronze:   #cd7f32;
  --fnv-tier-silver:   #c0c0c0;
  --fnv-tier-gold:     #ffd700;
  --fnv-tier-platinum: #e5e4e2;

  /* Feedback */
  --fnv-success:       #22c55e;
  --fnv-warning:       #f59e0b;
  --fnv-danger:        #ef4444;
  --fnv-info:          #3b82f6;

  /* Surfaces */
  --fnv-panel-bg:      rgba(6, 8, 16, 0.92);
  --fnv-panel-border:  rgba(255, 215, 0, 0.25);
  --fnv-panel-glow:    rgba(255, 215, 0, 0.08);
  --fnv-overlay-bg:    rgba(0, 0, 0, 0.7);
}
```

### 3.2 Typography

```css
:root {
  /* System font stack for UI */
  --fnv-font-ui:      system-ui, -apple-system, sans-serif;
  /* Monospace for VHS aesthetic elements */
  --fnv-font-vhs:     'Courier New', Courier, monospace;
  /* Display/title font -- consider loading "Press Start 2P" or "VCR OSD Mono" */
  --fnv-font-display:  var(--fnv-font-ui);

  /* Scale */
  --fnv-text-xs:   0.65rem;   /* labels, badges */
  --fnv-text-sm:   0.75rem;   /* secondary info */
  --fnv-text-base: 0.85rem;   /* body text */
  --fnv-text-lg:   1.0rem;    /* dialogue, prominent */
  --fnv-text-xl:   1.25rem;   /* titles */
  --fnv-text-2xl:  1.6rem;    /* celebration headers */
}
```

### 3.3 Spacing and Sizing

```css
:root {
  --fnv-hud-height:    48px;
  --fnv-hud-height-m:  40px;   /* mobile */
  --fnv-radius-sm:     4px;
  --fnv-radius-md:     8px;
  --fnv-radius-lg:     12px;
  --fnv-radius-pill:   20px;

  /* Inventory slot */
  --fnv-slot-w:        56px;
  --fnv-slot-h:        72px;
  --fnv-slot-w-m:      48px;   /* mobile */
  --fnv-slot-h-m:      60px;

  /* Touch targets */
  --fnv-touch-min:     44px;
  --fnv-touch-comfy:   48px;
}
```

### 3.4 Effects

```css
/* CRT Scanline overlay -- apply to .g3-container::after */
.g3-container::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  mix-blend-mode: multiply;
}

/* Panel glow */
.fnv-panel {
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 var(--fnv-panel-glow);
}

/* Gold text glow */
.fnv-glow {
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

/* Notification entrance */
@keyframes fnv-notif-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.95); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

/* XP gain pop */
@keyframes fnv-xp-pop {
  0%   { opacity: 0; transform: translateY(0) scale(0.8); }
  30%  { opacity: 1; transform: translateY(-8px) scale(1.1); }
  100% { opacity: 0; transform: translateY(-30px) scale(1); }
}
```

---

## 4. Element Specifications

### 4.1 Top HUD Bar (Always Visible)

**Position:** Fixed top, full width, `var(--fnv-hud-height)` tall.

**Layout:**
```
[Logo] FRIDAY NIGHT VIDEO     [Clock 9:14 PM]  [Tier: SILVER]  [XP ====--]  [J] [Mute] [Music] [Cam]
```

**Left section:**
- Miniature torn-ticket logo (24x16px)
- "FRIDAY NIGHT VIDEO" in gold, `--fnv-text-xs`, weight 700, letter-spacing 0.15em
- Context hint text (dim white, `--fnv-text-xs`) -- same as current but always visible including mobile

**Center section:**
- In-game clock: "9:14 PM" in monospace, gold, updates every game-minute
- Membership tier badge: pill shape, tier-colored border and text (e.g., "SILVER" with silver border)
- XP progress bar: thin horizontal bar (100px wide, 4px tall) with gold fill, shows progress to next tier

**Right section:**
- Quest log button: scroll emoji with "J" badge, opens quest log
- Mute button: speaker icon
- Music button: music note icon
- Screenshot button: camera icon
- All buttons: `var(--fnv-touch-min)` on mobile, grouped with 4px gap

**Differences from current:**
- Added clock, tier badge, XP bar
- Context hint visible on mobile (smaller text)
- Buttons get tooltip on hover (desktop)
- Subtle bottom gradient instead of hard edge

---

### 4.2 In-Game Clock (NEW)

**Position:** Integrated into top HUD bar, center-right area.

**Behavior:**
- Displays current in-game time (e.g., "8:00 PM" start, "MIDNIGHT" closing)
- 1 real second = 1 game minute (so 4 real hours = closing time at midnight)
- Turns orange at 11:00 PM, red at 11:30 PM with pulse animation
- Closing time triggers special event (Vinny: "We're closing up!")

**Style:** Monospace font, `--fnv-font-vhs`, gold color, `--fnv-text-sm`

---

### 4.3 Membership Tier Badge (NEW)

**Position:** Top HUD bar, right of clock.

**Display:** Pill badge with tier-colored border:
- Bronze: `--fnv-tier-bronze` border, "BRONZE" text
- Silver: `--fnv-tier-silver` border, "SILVER" text
- Gold: `--fnv-tier-gold` border, "GOLD" text
- Platinum: `--fnv-tier-platinum` border, shimmer animation

**Trigger:** Always visible. Tier determined by total XP:
- 0-199 XP: Bronze
- 200-499 XP: Silver
- 500-999 XP: Gold
- 1000+ XP: Platinum

**Click:** Opens a tier detail popup showing current XP, next tier threshold, benefits per tier.

**Tier-up animation:** When crossing threshold, the badge pulses with a starburst effect and a notification appears: "TIER UP! You're now SILVER!"

---

### 4.4 XP Progress Bar (NEW)

**Position:** Top HUD bar, right of tier badge.

**Display:** Thin horizontal bar (80px wide desktop, 60px mobile, 4px tall):
- Background: `rgba(255, 255, 255, 0.1)`
- Fill: gradient matching current tier color
- Label: "125/200 XP" appears on hover (desktop) or tap (mobile)

**XP Gain Animation:** When XP is earned:
1. "+50 XP" text floats up from the bar in gold, fades out over 1.5s (`fnv-xp-pop` animation)
2. Bar fill smoothly animates to new value over 0.5s
3. If tier threshold crossed, triggers tier-up celebration

---

### 4.5 Active Quest Tracker (NEW -- Always Visible Mini-HUD)

**Position:** Fixed `top: 56px`, `left: 16px`. Max width 220px.

**Visibility:** Shown when player has an active quest AND no challenge is running. Hidden during overlays.

**Display:**
```
+---------------------------+
| ACTIVE QUEST        (J)   |
| The Friday Night...  1/3  |
| [x] Horror                |
| [ ] Comedy                |
| [ ] Action                |
+---------------------------+
```

**Style:**
- Panel background `--fnv-panel-bg` with gold top border (2px)
- Quest title truncated with ellipsis, `--fnv-text-sm`, white
- Objectives listed as checklist, `--fnv-text-xs`
- Completed objectives: green checkmark, strikethrough, 50% opacity
- Progress fraction in blue pill (matches current quest log)
- "(J)" hint in top-right corner, `--fnv-text-xs`, dim

**Behavior:**
- Shows the most recently accepted quest (or first active)
- Clicking/tapping opens quest log
- Smoothly collapses when challenge starts, reappears when challenge ends
- On mobile: 180px max width, slightly smaller text

---

### 4.6 Crosshair (Improved)

**Position:** Fixed center.

**Changes from current:**
- Size: 4px dot (up from 2px) with 1px outline ring (8px diameter)
- Color: white at rest, gold when hovering over interactable
- Subtle scale animation on hover: 1.0 -> 1.3 over 0.15s
- Dot + 4 tiny tick marks (2px lines) at cardinal directions, 6px from center -- forming a minimal reticle

---

### 4.7 Hover Label (Improved)

**Position:** Fixed, 24px below crosshair center.

**Changes from current:**
- Add `opacity: 0 -> 1` fade-in over 0.15s (currently pops in)
- On mobile: hide the "[E]" key badge, just show the action text
- Add contextual verb: "[E] Browse" for shelves, "[E] Talk to" for NPCs, "[E] Pick up" for items, "[E] Use" for objects
- Slightly larger font on mobile for readability

---

### 4.8 Inventory Bar (Bottom -- Replaces Separate Movie/Snack Inventories)

**Position:** Fixed `bottom: 20px`, centered horizontally.

**Layout:** Single horizontal bar with 8 slots:
```
[ VHS ][ VHS ][ VHS ][ --- ][ --- ]     [ Snack ][ Snack ][ Snack ][ Snack ][ Snack ]
  1       2      3     empty  empty        1        2        3        4        5
         MOVIES (3 max)                              SNACKS (5 max)
```

**Design:**
- Each slot: `var(--fnv-slot-w)` x `var(--fnv-slot-h)`, rounded corners
- Empty slots: dashed border, `rgba(255, 255, 255, 0.1)` background
- Movie slots: poster thumbnail fills slot, gold border when occupied
- Snack slots: emoji centered, green border when occupied
- Divider: thin vertical line between movie and snack sections
- Small "x" button on occupied slots (visible on hover desktop, always visible mobile)
- Slot count labels below: "MOVIES 2/3" and "SNACKS 1/5" in `--fnv-text-xs`

**Behavior:**
- Slides up on first pickup, slides down when all items dropped
- Glow animation on slot when item is added
- On mobile: slots shrink to `var(--fnv-slot-w-m)`, moves above joystick area (bottom: 160px)
- Long-press on mobile to remove item (replaces hover)

**Why unified bar:** Prevents the stacking issue where snack inventory floats above movie inventory. A single bar is cleaner and more game-like (Stardew Valley, Minecraft).

---

### 4.9 Subtitle Display (Improved)

**Position:** Fixed `bottom: 100px` (raised from 80px to clear inventory bar), centered.

**Changes:**
- Queue system: if a new subtitle arrives while one is showing, the old one fades out quickly (0.1s) and new one slides in
- Max width reduced to 60% (from 80%) for cleaner look
- On mobile: `bottom: 200px` (above inventory bar + touch controls)
- NPC chatter moves to `bottom: 140px` so it sits just above the inventory bar, below subtitles

---

### 4.10 Notification System (Improved)

**Position:** Fixed `top: 56px`, centered.

**Types:**
1. **Quest notification:** Gold border, gold text (existing style)
2. **XP gain:** Green border, "+50 XP" with coin icon
3. **Tier up:** Tier-colored border, "TIER UP: SILVER!" with starburst
4. **Item pickup:** Gold border, "Picked up: [item name]"
5. **Quest complete:** Gold border, animated confetti particles, "Quest Complete!"

**Stacking:** Up to 3 notifications visible simultaneously:
- Each notification is 36px tall with 4px gap
- New notifications push older ones down
- Each auto-dismisses after 3s (quest complete: 4s)
- Oldest notification fades out if 4th arrives

**Animations:**
- Enter: slide down + fade in (0.3s)
- Exit: fade out + slide up (0.3s)
- Quest complete: subtle gold shimmer on border

---

### 4.11 Challenge HUD (Improved)

**Position:** Fixed `top: 56px`, `left: 16px`. Replaces quest tracker when active.

**Shared panel design** with visual variants per challenge type:

| Challenge | Header Color | Timer Style | Special |
|-----------|-------------|-------------|---------|
| Movie Night | Gold | Count up (small) | Checklist + hints |
| Speed Run | Red | Count down (large, prominent) | Pulsing at 15s |
| Vinny's Mystery | Purple | None | Clue + progressive hints |
| New Release Race | Red | Count down (large) | Single movie target |

**Timer improvements:**
- Timer font size: `--fnv-text-lg` minimum (currently 0.6rem is too small)
- Speed Run and Race: timer is `--fnv-text-xl`, bold, with seconds pulsing red under 10s
- Sound tick at 10s, 5s, 3s, 2s, 1s remaining

**New: progress ring** -- circular progress indicator (SVG) in top-right of panel showing items found / total

---

### 4.12 RPG Dialogue Box (Improved)

**Position:** Fixed bottom, max-width 720px, centered. Same as current.

**Changes:**
- **Typewriter effect:** Text appears character-by-character (~30 chars/sec), click/press to instant-complete
- **Portrait upgrade:** 40x40px square with background illustration (prepare character art: V=vest+mustache, C=baseball cap, Customer=various). Fallback to letter badge if no art loaded.
- **Dialogue history:** Scrollable area above the current line showing previous exchanges (max 4 visible lines, faded older)
- **Quest indicator:** If dialogue choice starts a quest, show a small quest icon next to the choice text
- **Mobile:** Full-width at bottom, responses have `min-height: var(--fnv-touch-comfy)`

---

### 4.13 Controls Reminder (NEW -- Persistent, Collapsible)

**Position:** Fixed `bottom: 20px`, `left: 16px`.

**Behavior:**
- Shows on first visit for 8 seconds (full display), then collapses to a "?" icon
- Click/tap "?" to expand: shows WASD, E, J, C, Q, ESC, 1-4
- On mobile: replaced with labeled touch buttons (no keyboard hints)
- Auto-shows briefly (3s) when player is idle for 30+ seconds

**Style:**
- Collapsed: 24px circle, "?" in gold, subtle pulse animation
- Expanded: dark panel with key badges and descriptions in 2 columns

---

### 4.14 Film Detail Modal (Improved)

**Position:** Centered, fixed overlay.

**Changes:**
- Responsive width: `min(360px, 90vw)` -- scales on mobile
- Add "PICK UP THIS MOVIE" button (gold, prominent) that adds to inventory
- Add "RENT THIS MOVIE" button if within RPG context
- CRT scanline overlay on the poster image for aesthetic
- On mobile: full-width bottom sheet instead of centered card

---

## 5. Mobile Adaptation

### 5.1 Layout Changes

| Element | Desktop | Mobile |
|---------|---------|--------|
| Top HUD | 48px, full info | 40px, logo + tier badge + hamburger menu for buttons |
| Clock | Visible in HUD | Inside hamburger or tap tier badge |
| XP bar | 80px wide in HUD | Replaced by XP text "125 XP" |
| Quest tracker | 220px panel, top-left | 180px panel, smaller text |
| Inventory bar | 8 slots centered, bottom | 8 slots centered, bottom: 160px, smaller |
| Subtitles | bottom: 100px | bottom: 210px (above inventory + controls) |
| NPC chatter | bottom: 140px | bottom: 250px |
| Hover label | Shows "[E] action" | Shows just "action" (no key badge) |
| Crosshair | 4px reticle | Hidden (touch-based aim) |
| Dialogue box | 720px max | Full width, bottom sheet |
| Challenge HUD | Top-left panel | Top-left, 160px, collapsed objectives |
| Notifications | Top-center | Top-center, full-width pill |
| Controls hint | "?" collapse | Hidden (touch buttons self-explain) |
| Film detail | 360px centered | Full-width bottom sheet |

### 5.2 Touch Controls Enhancement

- **Joystick:** Same as current (120px, bottom-left)
- **Interact button:** Show contextual label: "TALK", "BROWSE", "PICK UP" instead of generic "INTERACT"
- **Quest button:** Add 40px circle button above interact button with scroll emoji, opens quest log
- **Menu button:** Add hamburger in top-right for mute/music/screenshot/settings

### 5.3 Safe Areas

- All fixed elements respect `env(safe-area-inset-*)` (already in `.g3-container`)
- Bottom inventory bar adds `padding-bottom: env(safe-area-inset-bottom)`
- Top HUD adds `padding-top: env(safe-area-inset-top)`

---

## 6. Implementation Priority Order

### Phase 1: Foundation (Must-Have)
**Estimated effort: Medium**

1. **Design tokens CSS variables** -- Add `:root` block with all color, font, spacing tokens. Migrate existing hardcoded values. This unblocks everything else.
2. **Unified inventory bar** -- Replace separate movie + snack inventories with single bottom bar (8 slots). Fixes stacking bugs and overflow issues.
3. **Improved crosshair** -- Larger reticle with interactable-hover color change. Tiny effort, big UX win.
4. **Notification stacking** -- Queue system for up to 3 notifications. Prevents lost quest updates.

### Phase 2: RPG Core (High Impact)
**Estimated effort: Medium-High**

5. **XP tracking in game-state.ts** -- Add `totalXP` field to `GameState`, accumulate on quest/challenge completion. Foundation for tier system.
6. **Membership tier system** -- Calculate tier from XP, add badge to HUD. Makes progression visible.
7. **XP progress bar + gain animation** -- Thin bar in HUD, "+50 XP" float animation. Satisfying feedback loop.
8. **Active quest tracker** -- Mini-HUD panel showing current quest objectives. Keeps players oriented.

### Phase 3: Polish (Delight)
**Estimated effort: Medium**

9. **RPG dialogue typewriter effect** -- Character-by-character text reveal. Classic RPG feel.
10. **In-game clock** -- Timer in HUD, closing time mechanic. Adds urgency and atmosphere.
11. **Challenge HUD variants** -- Visual distinction per challenge type (color, timer style, progress ring).
12. **CRT scanline overlay** -- Subtle scanline effect on the full viewport. 90s VHS aesthetic.
13. **Tier-up celebration** -- Animated overlay when crossing tier threshold.

### Phase 4: Mobile (Reach)
**Estimated effort: Medium**

14. **Contextual mobile interact button** -- Show "TALK", "BROWSE", "PICK UP" instead of generic label.
15. **Mobile quest button** -- Add dedicated quest log button to touch controls.
16. **Mobile HUD hamburger** -- Collapse secondary buttons into a menu.
17. **Responsive film detail** -- Bottom sheet on mobile instead of centered card.

### Phase 5: Advanced (Nice-to-Have)
**Estimated effort: High**

18. **Character portrait art** -- Replace letter badges with illustrated character portraits.
19. **Dialogue history** -- Scrollable previous lines in RPG dialogue box.
20. **Controls reminder system** -- Collapsible "?" button with contextual hints.
21. **Film detail "Pick Up" action** -- Add inventory interaction from detail modal.
22. **Sound design** -- Timer ticks, XP gain chime, tier-up fanfare.

---

## Appendix: State Additions Required

The following fields need to be added to `GameState` in `src/lib/game-state.ts`:

```typescript
export interface GameState {
  // Existing
  unlockedProps: string[];
  challengesCompleted: number;
  bestTime: number | null;
  totalMoviesFound: number;
  challengeCompletions: Record<string, number>;

  // NEW for HUD overhaul
  totalXP: number;                    // Accumulated from quests + challenges
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  gameClockStart: number | null;      // Timestamp when current session started
  trackedQuestId: string | null;      // Which quest to show in mini-tracker
}
```

Tier thresholds:
```typescript
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 200,
  gold: 500,
  platinum: 1000,
};

function getTierForXP(xp: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (xp >= 1000) return 'platinum';
  if (xp >= 500) return 'gold';
  if (xp >= 200) return 'silver';
  return 'bronze';
}
```
