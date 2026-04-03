# Lifelike Character Redesign — Cinema Chat 3D Store

> Design doc for making Vinny, Charlie, and NPCs feel alive.
> All changes are animation/mesh only — no game logic, routing, or state machine changes.
> Vinny and Charlie stay in Blockbuster blue uniforms.

---

## 1. Body Proportions & Shape

### Vinny (Manager, behind counter)
- Slightly wider shoulders (torso width 0.44, up from 0.40)
- Subtle belly — a protruding box mesh at lower torso front
- Center of gravity shifted forward — he leans into conversations
- Keeps glasses, mustache, gold "VINNY" nametag, red "MANAGER" badge

### Charlie (Staff, walks aisles)
- Leaner and taller — narrower torso (0.32), longer legs
- Slight forward hunch to shoulders (upper torso rotated ~0.05 rad on X)
- He's scanning shelves all day — posture reflects that
- Keeps blue uniform, "CHARLIE" + "STAFF" badges, headband/cap

### NPCs by Personality
- **kid**: 0.65x scale + rounder/larger head relative to body (head Y scale 1.2) — childlike proportions
- **parent**: Wider lower torso — grounded, sturdy stance
- **teenager**: Longer limbs relative to torso — gangly, arms hang lower
- **critic/older regulars**: Slight shoulder rounding (arm attachment rotated inward ~0.1 rad)
- **movie_buff**: Normal proportions, confident upright posture

---

## 2. Idle Animations (Biggest Impact)

### Vinny
- **Weight shift**: Subtle X oscillation (not just Y bob) — shifts side to side on ~6s cycle
- **Counter lean**: Every ~12-15s, tilts torso forward, one arm drops to counter height for 3-4s
- **Head tracking**: Lerp headRef.rotation.y toward nearest player/NPC when within interaction range
- **Adjusting glasses**: Every ~15-20s, one arm briefly rotates up toward face (0.5s up, hold 0.3s, 0.5s down)
- **Breathing**: Torso scale Y pulses 1.0 → 1.005 on ~4s sine cycle

### Charlie
- **Shelf straightening**: When browsing/stopped near a shelf, one arm extends forward and rotates down slightly, then pulls back — like he's fixing VHS boxes (4s cycle)
- **Aisle scanning**: Head pans left-right in wider arc (0.4 rad instead of 0.2) when idle
- **Checking clipboard**: Occasionally head tilts down 0.15 rad for 2s, arm comes up slightly — looking at something in hand
- **Asymmetric gait**: One leg swings 10% wider than the other — people don't walk symmetrically

### NPCs (General)
- **Browsing**: Head tilts up (top shelf) then down (bottom shelf) on slow cycle. One arm occasionally reaches out toward shelf.
- **Talking**: Both NPCs face each other. Small hand gestures — alternating arm raises on the "speaker" (sine on one arm's X rotation, swap active arm every 3s)
- **Waiting/idle**: Whole body sways left/right on slow 5s cycle. Occasional foot tap (one leg bounces on fast small sine)
- **Entering store**: Wider head rotation for first 3s after entering — the "where is everything" moment
- **Post-checkout leaving**: Slightly faster walk speed (1.15x). People speed up heading to the door.

---

## 3. Facial Micro-Expressions

### Blink (All Characters)
- Scale eye pupil spheres to Y=0 for 0.1s every 3-5s (random interval per character)
- Cheap, huge lifelike impact

### Mouth Movement (During Conversation)
- When in `talking_to_player` or `talking_to_npc` state, oscillate mouth mesh Y-scale between 0.5 and 1.5 on a fast semi-random cycle
- Doesn't need audio sync — just needs to move

### Eyebrows (New Mesh)
- Add thin box meshes above each eye (hair color or #2a1a0a)
- When browsing, occasionally raise them (translate Y +0.01 for 1s) — surprise at finding a good movie
- When talking, subtle movement synced to arm gestures

### Smile Toggle
- At rest: mouth is flat bar
- Near Vinny or in conversation: two tiny angled boxes at mouth corners become visible, creating upward curl
- Toggle based on state, not continuous animation

### Vinny's Eyes Follow Player
- Offset pupil sphere positions slightly toward the player's world position
- Lerp, not snap — smooth 0.5s tracking
- Subtle but deeply human

---

## 4. Hands & Gestures

### Hand Shape Toggle
- **Idle**: Hands are slightly flattened spheres (scale X=1.2, Y=0.7) — open palm
- **Carrying**: Uniform sphere — closed fist
- Cheap toggle on a single scale property

### Vinny — Pointing
- During chat responses, one arm raises and extends forward slightly, hand rotates outward
- "You gotta see this one" gesture
- Trigger on `talking_to_player` state

### Charlie — Re-shelving
- When in browse state near a shelf: arm extends, small colored VHS rectangle appears in hand, arm pushes forward, VHS disappears
- 4-second cycle, only when stopped at a shelf waypoint

### NPCs — Carrying Rentals
- After `checking_out` state, a small VHS box mesh appears in one hand
- Persists through `leaving` and `despawning` states
- Color matches a random genre (red=action, blue=drama, orange=comedy, purple=horror)

---

## 5. Breathing & Weight (Subconscious Cues)

### Torso Breathing (All Characters)
- Scale torso Y between 1.0 and 1.008 on a 3.5-4.5s sine cycle
- **Randomize period per character** so they never sync — stagger by seeding with character ID
- Barely visible but subconsciously registers as "alive"

### Idle Sway (All Characters)
- When stopped, offset entire character group X by ±0.02 on a slow 6s cycle
- People don't stand perfectly still

### Head Micro-Movements (All Characters)
- Even when "idle," head has tiny rotation noise: sum of two sine waves at different frequencies
- Amplitude: 0.03 rad max
- Living heads are never frozen

---

## 6. Walking Improvements

### Torso Counter-Rotation
- When legs swing, torso rotates Y slightly opposite (±0.06 rad)
- This is how humans actually walk — upper body counterbalances lower body

### Vertical Bounce (Heel-Strike)
- Replace `abs(sin(t * freq))` with a double-bounce: `abs(sin(t * freq * 2))`
- Two peaks per stride, matching left/right heel-strikes
- More natural than single smooth bob

### Arm Swing Lag
- Phase-offset arms from legs by ~0.15 radians
- Arms don't move in perfect lockstep with legs — there's a follow-through delay

### Approach Deceleration
- When within 0.5 units of a browse waypoint, lerp speed toward 0
- People slow down before they stop — they don't halt instantly

---

## 7. Environmental Reactions

### Near the Door
- NPCs briefly pause (0.5s) and head pans left-right when first entering
- Orienting themselves in the space

### Near Vinny / Counter
- NPCs slow down slightly (0.8x speed) when passing within 2 units of counter
- Optional head turn toward Vinny (0.3s glance)

### Near Another NPC
- If two NPCs are close (<1.5 units) but NOT in conversation state, occasional mutual glance
- Both heads briefly rotate toward each other for 0.5s, then resume

### Browsing Height Variety
- Some NPCs "squat" at bottom shelf (lower group Y by 0.3, bend legs)
- Some reach up for top shelf (one arm extends high, head tilts up)
- Not everyone browses at eye level — randomize per browse stop

---

## Priority Order for Implementation

1. **Breathing + idle sway + head micro-movements** — Smallest code change, biggest "alive" impact
2. **Blink animation** — One line of scale logic per character, instant humanity
3. **Walking improvements** (counter-rotation, arm lag, heel-bounce) — Moderate effort, huge visual upgrade
4. **Vinny head-tracking + weight shift** — Makes the main character magnetic
5. **Mouth movement during conversation** — Sells the dialogue moments
6. **Charlie shelf-straightening + aisle scanning** — Gives Charlie a purpose you can see
7. **Browsing height variety + approach deceleration** — Polish layer
8. **Environmental reactions** (door pause, counter glance, mutual NPC glance) — Final layer of life
9. **Hand gestures + carrying objects** — Nice-to-have, most mesh work
10. **Body proportion differences by personality** — Requires per-personality mesh variants

---

## Files to Modify

- `src/components/game3d/store-characters.tsx` — All mesh and `useFrame` animation changes
- `src/components/game3d/store-materials.tsx` — Only if new material variants needed
- `src/lib/npc-behavior.ts` — No changes (state machine stays the same)
- `src/lib/npc-personalities.ts` — No changes

All changes are contained to the character rendering layer.
