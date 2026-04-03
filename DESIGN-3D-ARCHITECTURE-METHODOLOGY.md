# 3D Architectural Design Methodology for Programmatic Game Environments

> A permanent reference for any AI or developer building 3D architectural elements
> in React Three Fiber / Three.js. Born from repeated failures with floating geometry,
> broken proportions, and spatial incoherence.

---

## Table of Contents

1. [The Core Problem](#1-the-core-problem)
2. [The Professional Workflow](#2-the-professional-workflow)
3. [Reference-Driven Design](#3-reference-driven-design)
4. [The Measurement Sheet](#4-the-measurement-sheet)
5. [Blockout Methodology](#5-blockout-methodology)
6. [Spatial Coherence Rules](#6-spatial-coherence-rules)
7. [Strip Mall Architecture Reference](#7-strip-mall-architecture-reference)
8. [Translating Architecture into Code](#8-translating-architecture-into-code)
9. [Self-Evaluation Checklist](#9-self-evaluation-checklist)
10. [Our Specific Building: Strip Mall with Apartment](#10-our-specific-building-strip-mall-with-apartment)
11. [Anti-Patterns and How to Fix Them](#11-anti-patterns-and-how-to-fix-them)

---

## 1. The Core Problem

When an AI builds 3D geometry programmatically, it tends to:

- **Imagine** what things look like instead of referencing reality
- **Position elements independently** instead of anchoring them to each other
- **Start with details** (railings, doorknobs) before the main volume is correct
- **Use absolute coordinates** for everything, leading to gaps and overlaps when any dimension changes
- **Never verify visually** -- treating "the code compiles" as proof that geometry is correct
- **Confuse mathematical correctness with visual correctness** -- coordinates can be "right" but the building still looks wrong because the mental model was wrong

The result: stairs that float away from buildings, facades that cover windows, rooflines that don't connect, and proportions that feel alien.

### Why This Happens

An AI generating code does not have a spatial imagination. It works with numbers. When it writes `position={[3.8, -2, -4.13]}`, it has no intuitive sense of whether that point is inside a wall, floating in air, or correctly placed. Every architectural element becomes an exercise in arithmetic rather than spatial design.

Professional game environment artists solve this by **never starting with numbers**. They start with shapes, proportions, and visual references. The numbers come last.

---

## 2. The Professional Workflow

Professional game environment artists follow a strict sequence. Each step must be completed before the next begins.

### Phase 1: Reference Gathering (Before Any Code)

- Search for 10-20 reference photos of the real-world thing
- Study them: what are the proportions? What connects to what?
- Note materials, colors, weathering, and scale cues (people, cars, doors)
- Write a plain-English description of what you see

### Phase 2: Measurement Documentation

- Research real-world dimensions (building codes, architectural standards)
- Create a measurement sheet with every key dimension
- Define the relationships between dimensions (floor height determines stair count, etc.)
- Establish a coordinate system and origin point

### Phase 3: Blockout (Big Shapes Only)

- Build the main volume as a single box
- Add the floor plate, then walls, then roof -- each one touching/connected
- NO details. NO railings. NO doorknobs. NO window frames.
- Verify the blockout from multiple camera angles
- Does it look like the right building type at a glance? If not, adjust before continuing.

### Phase 4: Subdivision (Medium Shapes)

- Cut openings for doors and windows (still just holes, no frames)
- Add the stair volume as a single angled box
- Add the second floor as a single slab
- Verify again: does the silhouette match the reference?

### Phase 5: Detail Pass

- NOW add window frames, door frames, railings
- Each detail element is positioned relative to its parent opening/surface
- Details should never change the silhouette significantly

### Phase 6: Polish

- Materials, colors, accent trim
- Signage, lighting fixtures
- Weathering and imperfection

### The Iron Rule

**If Phase 3 looks wrong, NOTHING in Phases 4-6 will fix it.** Going back to fix the blockout is always cheaper than trying to adjust details to compensate for a broken foundation.

---

## 3. Reference-Driven Design

### Before Writing Any Geometry Code, Answer These Questions

For ANY architectural element (building, stairs, storefront, roof), you must be able to answer:

1. **What does this look like in real life?** Describe it in plain English. Not code. Not coordinates. English.
2. **What is it made of?** Concrete? Brick? Metal? Glass? Wood?
3. **How big is it?** In feet/meters. Not game units. Real measurements first.
4. **What does it connect to?** Every element touches something else. What?
5. **What is above, below, left, right, in front, and behind it?** Context matters.
6. **Where would a person stand when looking at this?** That determines the camera angle that matters most.

### Reference Photo Study Method

When studying a reference photo:

1. **Identify the main mass** -- What is the largest single shape?
2. **Count the horizontal bands** -- Most buildings have 2-4 horizontal zones (base, middle, top, parapet)
3. **Note the rhythm** -- How wide are bays? How many windows per bay?
4. **Find the datum lines** -- What lines are continuous across the whole building? (roofline, signage band, window sill line, floor line)
5. **Observe material changes** -- Where does brick become stucco? Where does commercial become residential?

---

## 4. The Measurement Sheet

Before coding ANY building, fill out this sheet. Every dimension should come from research or reference, not imagination.

### Building Envelope

```
Overall width:      ___ m
Overall depth:      ___ m
Ground floor height: ___ m (floor to ceiling)
Upper floor height:  ___ m (floor to ceiling)
Total height:        ___ m (ground to top of parapet/roof)
Wall thickness:      ___ m
Floor slab thickness: ___ m
```

### Storefront (Commercial Ground Floor)

```
Storefront bay width:     ___ m
Glass height:             ___ m
Knee wall height:         ___ m (below glass)
Transom/header height:    ___ m (above glass)
Signage band height:      ___ m
Door width:               ___ m
Door height:              ___ m
Bulkhead/base height:     ___ m
```

### Upper Floor (Residential)

```
Window width:       ___ m
Window height:      ___ m
Window sill height: ___ m (above floor)
Window head height: ___ m (above floor)
```

### Roof

```
Parapet height above roof:  ___ m
Fascia depth:               ___ m
Roof overhang:              ___ m
Coping width:               ___ m
```

### Stairs (if applicable)

```
Total rise (floor to floor): ___ m
Riser height:                 ___ m (max 0.197m per code)
Tread depth:                  ___ m (min 0.254m per code)
Number of risers:             ___ (total rise / riser height)
Total run:                    ___ m (risers x tread depth)
Stair width:                  ___ m (min 0.91m per code)
Handrail height:              ___ m (0.86-0.97m above tread)
Landing depth:                ___ m (min 0.91m, same as stair width)
```

### Standard Real-World Measurements

These are non-negotiable references:

| Element | Measurement |
|---------|-------------|
| Person height | 1.7m |
| Eye level (standing) | 1.6m |
| Standard door | 0.91m wide x 2.03m tall |
| Commercial door | 0.91-1.07m wide x 2.13m tall |
| Residential ceiling | 2.44m (8 ft) |
| Commercial ceiling | 3.05-3.66m (10-12 ft) |
| Stair riser (max) | 0.197m (7.75 in) |
| Stair tread (min) | 0.254m (10 in) |
| Handrail height | 0.86-0.97m above tread |
| Counter height | 0.91m (36 in) |
| Table height | 0.75m (30 in) |
| Chair seat | 0.45m (18 in) |
| Sidewalk width | 1.5-1.8m |
| Parking space | 2.7m x 5.5m |
| Standard brick | 0.057m x 0.092m x 0.194m |
| Parapet wall height | 0.76-1.07m above roof (min 30-42 in) |

---

## 5. Blockout Methodology

### What Is a Blockout?

A blockout is a 3D rough draft built with simple boxes. No textures. No details. No polish. Just shapes that establish:

- **Size**: Is the building the right height/width/depth?
- **Scale**: Does a person fit through the door? Can they see over the counter?
- **Proportions**: Does the ground floor look taller than the upper floor (as it should for commercial)?
- **Connections**: Do walls meet? Does the roof sit on the walls? Do stairs touch the building?

### The Blockout Process for Code-Generated Buildings

**Step 1: The Bounding Box**

Start with a single box that represents the entire building envelope. Nothing else.

```tsx
// STEP 1: Just the building mass
<mesh position={[0, totalHeight/2, 0]}>
  <boxGeometry args={[width, totalHeight, depth]} />
  <meshBasicMaterial color="gray" wireframe />
</mesh>
```

Ask: Does this box feel like the right size for a two-story strip mall building?

**Step 2: Split Into Floors**

Replace the single box with two boxes: ground floor and upper floor.

```tsx
// STEP 2: Two floors
<group>
  {/* Ground floor */}
  <mesh position={[0, groundFloorH/2, 0]}>
    <boxGeometry args={[width, groundFloorH, depth]} />
    <meshBasicMaterial color="#888" wireframe />
  </mesh>
  {/* Upper floor */}
  <mesh position={[0, groundFloorH + upperFloorH/2, 0]}>
    <boxGeometry args={[width, upperFloorH, depth]} />
    <meshBasicMaterial color="#aaa" wireframe />
  </mesh>
</group>
```

Ask: Do the two floors have the right proportional relationship? Commercial ground floors are typically taller.

**Step 3: Add the Roof Mass**

```tsx
// Parapet/roof cap on top
<mesh position={[0, groundFloorH + upperFloorH + parapetH/2, 0]}>
  <boxGeometry args={[width + overhang*2, parapetH, depth + overhang*2]} />
  <meshBasicMaterial color="#666" wireframe />
</mesh>
```

**Step 4: Add the Stair Volume**

The stair structure is ONE SOLID BOX at this stage. Not individual steps. Just the space the stairs occupy.

```tsx
// Stair volume — attached to building wall
<mesh position={[width/2 + stairWidth/2, totalRise/2, stairStartZ - totalRun/2]}>
  <boxGeometry args={[stairWidth, totalRise, totalRun]} />
  <meshBasicMaterial color="#aa8" wireframe />
</mesh>
```

Ask: Is the stair box touching the building? Is it the right height? Does it start at the right place?

**Step 5: Verify the Blockout**

Before adding ANY detail:
- View from the front (player perspective from parking lot)
- View from the side (see stair relationship to building)
- View from above (see footprint and adjacency)
- View from eye level at the stair entrance (does the stair angle look walkable?)

### The Big Shapes First Rule

| Order | What to Build | Example |
|-------|---------------|---------|
| 1 | Building mass (single box) | The entire strip mall as one rectangle |
| 2 | Floor division | Ground floor box + upper floor box |
| 3 | Roof mass | Flat slab on top |
| 4 | Major attachments | Stair volume, awning volume |
| 5 | Wall openings | Cut out door and window zones |
| 6 | Window/door frames | Thin boxes around openings |
| 7 | Railings | Thin boxes along stair edges |
| 8 | Trim and details | Fascia, sills, signage |
| 9 | Fixtures | Lights, door hardware, numbers |

**Never skip ahead.** If step 2 is wrong, steps 3-9 will all be wrong.

---

## 6. Spatial Coherence Rules

These rules prevent floating geometry, gaps, and disconnected elements.

### Rule 1: The Anchor Principle

**Every object must be anchored to at least one other object.** No object exists in isolation.

- A wall is anchored to the floor and to adjacent walls
- A roof is anchored to the top of the walls
- Stairs are anchored to the ground AND to the building wall AND to the upper floor
- A railing is anchored to the stair treads
- A door frame is anchored to the wall opening

If you cannot name what an object is anchored to, it will float.

### Rule 2: Shared Edges

**Adjacent elements must share coordinates at their connection point.**

Bad (independently positioned, gap likely):
```tsx
// Wall ends at x=5.0
<mesh position={[2.5, 1.5, 0]}>
  <boxGeometry args={[5, 3, 0.2]} />
</mesh>
// Adjacent wall starts at x=5.1 <-- GAP!
<mesh position={[7.55, 1.5, 0]}>
  <boxGeometry args={[5, 3, 0.2]} />
</mesh>
```

Good (derived from shared constant):
```tsx
const SHARED_EDGE_X = 5.0;
// Wall 1: right edge at SHARED_EDGE_X
<mesh position={[SHARED_EDGE_X - wall1Width/2, 1.5, 0]}>
  <boxGeometry args={[wall1Width, 3, 0.2]} />
</mesh>
// Wall 2: left edge at SHARED_EDGE_X
<mesh position={[SHARED_EDGE_X + wall2Width/2, 1.5, 0]}>
  <boxGeometry args={[wall2Width, 3, 0.2]} />
</mesh>
```

### Rule 3: Derive, Don't Invent

**Every position should be derived from a dimension constant, not hardcoded.**

Bad:
```tsx
<mesh position={[3.8, -2.0, -4.13]}>  // Where did these numbers come from?
```

Good:
```tsx
const stairCenterX = wallOuterX + ENCL_WIDTH / 2;
const landingCenterZ = topStepZ - LANDING_DEPTH / 2;
<mesh position={[stairCenterX, APT_FLOOR_Y - slabThickness/2, landingCenterZ]}>
```

### Rule 4: The Parent Group Pattern

**Use groups to establish local coordinate systems.** A staircase group should have its origin at the logical anchor point (where stairs meet the building), so all children are positioned relative to that anchor.

```tsx
// The group's position IS the anchor point
<group position={[buildingRightWallX, groundLevel, buildingFrontZ]}>
  {/* Everything inside is relative to the anchor */}
  <mesh position={[stairWidth/2, riseN/2, -runN/2]}>
    {/* Stair treads relative to stair anchor */}
  </mesh>
</group>
```

### Rule 5: Verify From Multiple Angles

A building that looks correct from one angle may have:
- A wall that doesn't reach the floor (visible from the side)
- A roof that doesn't cover the full building (visible from above)
- Stairs that float 0.1m from the building wall (visible from behind)
- A facade that covers a window opening (visible from the front)

**Always check: front, side, top, and player eye level.**

### Rule 6: The Continuity Principle

Certain lines must be continuous across the entire building:
- **The ground plane** -- every ground-floor element sits on y=0
- **The roofline** -- every section of the strip mall has the same roof height
- **The signage band** -- runs unbroken across all storefronts
- **The sidewalk** -- continuous in front of the entire building
- **Floor levels** -- the 2nd floor is at the same Y across the entire building width

If any element breaks one of these continuity lines, the building looks like separate objects stacked together rather than one structure.

### Rule 7: The Enclosure Test

For any enclosed space (room, stair enclosure, landing):
1. Can you trace a continuous path around all walls without a gap?
2. Is there a floor at the bottom and a ceiling/roof at the top?
3. Are all openings intentional (doors, windows) and properly framed?

---

## 7. Strip Mall Architecture Reference

### What a Real 1990s Strip Mall Looks Like

A 1990s strip mall is a **single-story, linear commercial building** with these defining features:

**Overall Form:**
- Long horizontal rectangle, typically 6-10 tenant bays wide
- Flat roof (not pitched), hidden behind a parapet wall
- Parking lot directly in front, oriented for cars approaching from the street
- One continuous structure -- all stores share walls

**The Parapet Wall:**
- A low wall (0.76-1.07m / 30-42 inches) that extends above the flat roof
- Hides rooftop HVAC equipment and the roof edge
- Creates the building's "forehead" -- the top visual line
- Typically capped with metal coping (a shaped metal strip that sheds water)
- The fascia (vertical face of the parapet) is the most visible part from the parking lot
- Often the fascia has the most architectural detail: reveals, color changes, or signage

**The Storefront Zone (ground level):**
- Large plate glass windows (60-70% of the facade is glass)
- Aluminum window frames, typically dark anodized (bronze, black) or clear silver
- Knee wall / bulkhead below the glass: 0.3-0.5m of solid wall at the base
- Recessed entries or flush glass doors
- Each tenant has their own door centered or at one side of their bay
- Standard bay width: approximately 6m (20 ft)

**The Signage Band:**
- A continuous horizontal band between the top of the storefront glass and the parapet
- Typically 0.6-0.9m tall (2-3 ft)
- Each tenant mounts their sign within their bay's section of this band
- The band itself is a unified architectural element -- same material across all bays
- Usually painted stucco, EIFS (synthetic stucco), or metal panel
- Channel letters (individual illuminated letters) are the most common 90s sign type

**Awnings (optional but very 90s):**
- Fabric or metal awnings projecting 0.9-1.5m from the facade
- Mounted between the storefront glass and the signage band
- Common colors: deep green, burgundy, navy, tan
- Provide shade and a pedestrian-scale element
- Some malls have a continuous awning; others have per-tenant awnings

**Side and Rear:**
- Rear is strictly utilitarian: painted CMU (concrete block), service doors, dumpsters
- Side walls are blank or have minimal windows
- Building services (HVAC, electrical) are on the roof or at the rear

**Materials Palette (1990s):**
- Stucco or EIFS in warm tones (beige, sand, light terra cotta)
- Brick accents (often the lower portion or pilasters between bays)
- Aluminum storefront glazing systems
- Standing seam metal awnings or fabric awnings
- Asphalt parking lot, concrete sidewalk

**Color Palette (1990s):**
- Teal/green accents were everywhere
- Dusty rose, mauve, and southwestern pastels
- Earth tones: sand, terracotta, warm gray
- Neon accents: hot pink, electric blue, lime green (signage only)

### Mixed-Use: Apartment Above a Store

When a strip mall has a second floor apartment above one section:

**How It Reads as One Building:**
- The ground floor of the apartment section looks IDENTICAL to the rest of the strip mall
- Same storefront system, same signage band, same parapet height
- The 2nd floor addition sits BEHIND and ABOVE the parapet
- From the parking lot at eye level, you barely see the 2nd floor because the parapet partially screens it
- The 2nd floor is set back from the facade (even just 0.3-0.5m) so it doesn't overpower the ground floor
- Different material on the 2nd floor (brick, siding) vs the stucco of the commercial ground floor

**The Floor Transition:**
- A visible structural floor slab or band marks where commercial ends and residential begins
- This band sits at the same height as the strip mall parapet across the rest of the building
- It acts as a visual "belt course" that ties the building together

**Where Exactly the 2nd Floor Sits:**
- Ground floor: 0 to ~3.5m (commercial ceiling height)
- Structural floor slab / parapet band: 3.5m to 3.7m
- Second floor interior: 3.7m to ~6.2m (2.5m residential ceiling)
- 2nd floor parapet/roof: 6.2m to ~6.5m

### How Exterior Stairs Attach

**Structural Connection:**
- Stairs must be "positively anchored" to the primary structure (building code requirement)
- The inner wall of the stair enclosure IS the building wall -- they share the same surface
- The stair structure has its own foundation at ground level
- At the top, the landing connects directly to the building's floor structure

**Physical Arrangement:**
- Stairs run PARALLEL to the building wall (along the side of the building)
- The staircase is typically on the end of the building, not in the middle of the storefront
- Width: minimum 0.91m (3 ft), typically 1.0-1.2m
- The stair enclosure may be open (metal railings only) or partially enclosed (brick/stucco walls matching the building)
- A landing at the top, minimum 0.91m deep, serves as a small porch
- The apartment entry door opens onto this landing, mounted in the building wall

**Visual Connection:**
- If the stair enclosure has walls, they should be the SAME material as the building (brick, stucco)
- Metal railings should match other metal elements (aluminum storefront frames, etc.)
- The stair enclosure looks like it "grew out of" the building, not like it was bolted on as an afterthought
- A small roof/awning over the landing matches the main building roof material

---

## 8. Translating Architecture into Code

### The Dimensional Constant System

**Every building starts with a constants block that defines ALL dimensions.**

```tsx
// ══════════════════════════════════════════════
// DIMENSIONAL CONSTANTS — derived from research
// ══════════════════════════════════════════════

// Building envelope
const BLDG_W = 6.0;          // building width (this section)
const BLDG_D = 8.0;          // building depth (front to back)
const GND_FLOOR_H = 3.5;     // ground floor ceiling height (commercial)
const UPPER_FLOOR_H = 2.5;   // upper floor ceiling height (residential)
const FLOOR_SLAB = 0.2;      // structural floor slab thickness
const WALL_T = 0.2;          // wall thickness

// Derived dimensions — NEVER hardcode these
const TOTAL_H = GND_FLOOR_H + FLOOR_SLAB + UPPER_FLOOR_H;
const UPPER_FLOOR_Y = GND_FLOOR_H + FLOOR_SLAB;   // bottom of upper floor interior
const ROOF_Y = TOTAL_H;                             // top of upper floor walls

// Building edges — derived from width/depth
const HALF_W = BLDG_W / 2;
const HALF_D = BLDG_D / 2;
const LEFT_WALL_X = -HALF_W;
const RIGHT_WALL_X = HALF_W;
const FRONT_WALL_Z = HALF_D;
const BACK_WALL_Z = -HALF_D;

// Stair dimensions — from building code
const STAIR_RISE = 0.19;
const STAIR_TREAD = 0.28;
const STAIR_W = 1.0;
const NUM_STEPS = Math.ceil(UPPER_FLOOR_Y / STAIR_RISE);
const TOTAL_RUN = NUM_STEPS * STAIR_TREAD;
const TOTAL_RISE = NUM_STEPS * STAIR_RISE;
```

### Organizing Code for Spatial Clarity

**Structure components hierarchically to match physical hierarchy:**

```
Building (group at world position)
  GroundFloor (group at y=0)
    Floor
    Walls
    Storefront
    Interior
  UpperFloor (group at y=UPPER_FLOOR_Y)
    FloorSlab
    Walls
    Interior
  Roof (group at y=ROOF_Y)
    RoofSlab
    Parapet
    Fascia
  Stairs (group at stair anchor point)
    Enclosure walls
    Treads
    Landing
    Railings
```

Each group establishes a LOCAL coordinate system. Children are positioned relative to their parent group, not in world coordinates.

### The "Inside-Out" vs "Outside-In" Approach

**Outside-In (recommended for new buildings):**
1. Start with the exterior shell (walls, roof, floor)
2. Cut openings (doors, windows)
3. Add interior elements that fit within the shell
4. Ensures the exterior reads as one cohesive building

**Inside-Out (useful for interiors that must fit specific furniture):**
1. Start with the interior layout (where does furniture go?)
2. Build walls around the interior
3. Add the exterior skin
4. Risk: exterior proportions may look wrong if driven entirely by interior needs

**For our strip mall: use Outside-In.** The exterior proportions and continuity matter most. Interior furniture adapts to the space, not the other way around.

### The Shared Edge Implementation Pattern

When two elements share a boundary (e.g., the building wall and the stair enclosure wall):

```tsx
// The building's right wall outer surface
const BLDG_RIGHT_OUTER = HALF_W + WALL_T / 2;

// The stair enclosure's inner wall IS the building wall
// So the stair treads start at:
const STAIR_INNER_X = BLDG_RIGHT_OUTER;  // flush with building wall

// The stair outer edge:
const STAIR_OUTER_X = STAIR_INNER_X + STAIR_W;

// NO GAP between building and stairs because they share BLDG_RIGHT_OUTER
```

### Avoiding Independent Positioning

**The most common source of spatial errors in this codebase:**

Each element is positioned with absolute numbers that were calculated independently. When one dimension changes, the others don't update.

**Solution: Chain everything through constants.**

```tsx
// BAD: Magic numbers everywhere
<mesh position={[3.8, -2.0, -4.13]}>
<mesh position={[4.4, -2.0, -4.13]}>

// GOOD: Every number derived from named constants
<mesh position={[stairCenterX, enclMidY, enclMidZ]}>
<mesh position={[outerWallX, enclMidY, enclMidZ]}>
```

---

## 9. Self-Evaluation Checklist

### Before Considering Any Architectural Element "Done"

**A. The Silhouette Test**
- [ ] View the building from 30m away (zoomed out). Does it look like the type of building it's supposed to be?
- [ ] Can you identify it as a "strip mall" / "apartment" / "stairs" instantly?
- [ ] Is the proportional relationship between floors correct? (commercial taller than residential)

**B. The Connection Test**
- [ ] Does every wall meet the floor? (no gaps at the bottom)
- [ ] Does every wall meet the ceiling/roof? (no gaps at the top)
- [ ] Do adjacent walls share edges? (no gaps at corners)
- [ ] Do stairs touch the building wall? (no floating)
- [ ] Does the roof cover the full building footprint?
- [ ] Does the landing connect to both the stairs AND the building?

**C. The Scale Test**
- [ ] Place a 1.7m tall reference box (person) next to the building. Does it look right?
- [ ] Can a person walk through the door without crouching?
- [ ] Are the stairs a comfortable slope? (30-35 degrees)
- [ ] Is the counter at waist height?
- [ ] Does the signage look readable from the parking lot?

**D. The Continuity Test**
- [ ] Is the ground plane at the same Y across the entire scene?
- [ ] Is the roofline continuous across all sections of the strip mall?
- [ ] Is the signage band at the same height everywhere?
- [ ] Does the sidewalk run unbroken in front of the building?

**E. The Player Perspective Test**
- [ ] Stand at the parking lot looking at the building. Does it look like a real building?
- [ ] Walk toward the entrance. Does the approach feel natural?
- [ ] Stand at the stair entrance looking up. Do the stairs look climbable?
- [ ] Stand on the landing looking at the door. Does it feel like a real porch?

**F. The Uncanny Valley Test**
Things that make AI-generated buildings look "off":
- [ ] Everything is too clean and symmetrical -- add slight color variation
- [ ] All elements are exactly the same height/width -- real buildings have subtle variation
- [ ] No weathering or imperfection -- real buildings have stains, worn edges
- [ ] No visual hierarchy -- the eye needs a focal point (the sign, the door, the window)
- [ ] No material differentiation -- different parts of a building use different materials
- [ ] Perfect mathematical placement -- real construction has slight imprecision (this is fine in low-poly)

**G. Common AI-Generation Tells**
- Elements that are clearly independent objects placed near each other (vs parts of one structure)
- Walls that don't quite meet at corners
- Stairs that exist as a separate floating structure near a building
- Facades that are a flat plane with no depth (no window reveals, no recessed entries)
- Identical repetition without variation (every window exactly the same color/size)
- Details without context (a doorknob without a door, a railing without stairs)

---

## 10. Our Specific Building: Strip Mall with Apartment

### Current Architecture (from codebase analysis)

The strip mall is a 3-unit building:
- **Left**: Pizza Palace (position: `[-13, 0, 5.5]`, 6m wide x 8m deep)
- **Center**: Friday Night Video (position: origin, 20m wide x 14m deep)
- **Right**: Laundromat (position: `[13, 0, 5.75]`, 6m wide x 8m deep)
- **Above Laundromat**: Apartment (position: `[13, 4, 5.75]`, 6m wide x 5m deep)

### Key Constants (current)

```
Video Store: ROOM_W=20, ROOM_D=14, ROOM_H=3.5
Apartment: APT_W=6, APT_D=5, APT_H=2.8, APT_Y=4 (height above ground)
Wall thickness: 0.2m
```

### The Continuous Roofline Principle

The strip mall's commercial roofline must be ONE CONTINUOUS LINE at the same height across all three businesses. Currently `ROOM_H=3.5m`. This means:

- Pizza Palace roof at 3.5m
- Video Store roof at 3.5m
- Laundromat roof at 3.5m
- Apartment floor slab sits ON this 3.5m line
- Apartment walls then rise from 3.5m to 3.5+2.8=6.3m
- Apartment parapet/roof at ~6.5m

The signage band should also be continuous. It's the zone from ~2.8m to ~3.5m across all storefronts.

### How the Parapet Works

```
                    ┌──────────────┐
                    │  Apt roof    │  6.5m
                    │              │
                    │  Apartment   │  3.7m to 6.3m
    ┌───────────────┼──────────────┤
    │ Parapet wall  │ Floor slab   │  3.5m (continuous line)
    │  (all units)  │              │
    ├───────────────┼──────────────┤
    │               │              │
    │  Signage band │  Signage     │  2.8m to 3.5m
    │               │              │
    │  Glass        │  Glass       │
    │  storefront   │  storefront  │  0.5m to 2.8m
    │               │              │
    │  Knee wall    │  Knee wall   │  0 to 0.5m
    └───────────────┴──────────────┘
    Pizza / Video    Laundromat
```

The parapet wall is the short wall that extends above the roofline on Pizza Palace and Video Store sections (where there is no 2nd floor). It's typically 0.3-0.5m above the actual roof surface. On the Laundromat section, the apartment floor slab replaces the parapet -- the slab IS the visual top of the ground floor.

### Exterior Stairs Design Spec

The stairs are on the RIGHT side of the Laundromat/Apartment section. In the current code, they run from front (high Z, ground level) toward the back (low Z, apartment level). Key relationships:

```
Building right wall outer: x = APT_W/2 + WALL_T = 3.2 (local to apartment group)
Stair structure: butts directly against this wall (x starts at 3.2)
Ground entry: at the front of the building (high z), at y=0 (ground)
Top landing: at apartment floor level (y=0 in apartment local coords)
Landing door: mounted IN the building wall, facing the landing
```

### Materials Differentiation

- **Ground floor (all 3 stores)**: Unified commercial facade -- aluminum-framed glass storefront, stucco/EIFS signage band, consistent awning style
- **2nd floor (apartment only)**: Brick exterior walls -- visually distinct from commercial ground floor
- **Stair enclosure**: Matches apartment material (brick) since it's part of the residential structure
- **Roof**: Dark gray flat roof membrane (barely visible)
- **Parapet fascia**: Can be darker accent color to frame the building top
- **Trim band at floor transition**: A horizontal reveal or color change marking where commercial ends and residential begins

---

## 11. Anti-Patterns and How to Fix Them

### Anti-Pattern 1: "Let me add the detail first"

**Symptom:** Starting by coding individual stair treads before establishing that the stair volume is in the right place.

**Fix:** Always build the containing volume first (a single box for the entire stair structure), verify its position, THEN subdivide into treads.

### Anti-Pattern 2: "Each element is its own island"

**Symptom:** Every mesh has hardcoded position values. Nothing references shared edge points. Moving one wall creates a gap elsewhere.

**Fix:** Define boundary constants (wall positions, floor heights, edge coordinates) and derive all positions from them.

### Anti-Pattern 3: "I'll just adjust the numbers until it looks right"

**Symptom:** Tweaking position values by +/-0.1 repeatedly, hoping to stumble onto the right placement.

**Fix:** Stop. Go back to the measurement sheet. Calculate the correct position from first principles. If the measurement sheet doesn't have the number you need, you haven't done enough reference research.

### Anti-Pattern 4: "The code compiles, so the geometry must be correct"

**Symptom:** Committing geometry changes without visual verification.

**Fix:** Run the visual QA cameras (`node scripts/visual-qa.mjs`). Read the screenshots. Compare to reference photos. "It compiles" tells you nothing about spatial correctness.

### Anti-Pattern 5: "I know what a building looks like"

**Symptom:** Writing geometry from memory/imagination without searching for reference photos. This is the #1 source of errors.

**Fix:** ALWAYS search for reference photos before writing any architectural code. You do not know what things look like. You have training data, not eyes. Look at real photos.

### Anti-Pattern 6: "The facade is a flat plane"

**Symptom:** Buildings that look like painted cardboard -- no depth, no reveals, no projections.

**Fix:** Real buildings have depth: window reveals (the glass is set back 5-10cm from the wall face), projecting sills, recessed entries, awning brackets. Even 2-5cm of depth makes geometry read as three-dimensional.

### Anti-Pattern 7: "I'll use a separate wall for each surface"

**Symptom:** Every wall face is an independent plane, leading to z-fighting at corners and visible seams.

**Fix:** Use boxes (`boxGeometry`) for walls, not planes. A box has thickness, which means corners automatically have depth. When two box-walls meet at a corner, overlap them slightly (let one wall extend past the corner and the other butt against it).

---

## Appendix: Quick Reference Card

Print this and tape it to your (virtual) wall:

```
BEFORE YOU CODE ANY GEOMETRY:
1. Did I search for reference photos?        [ ]
2. Did I fill out the measurement sheet?      [ ]
3. Did I build the blockout (big boxes only)? [ ]
4. Did I verify the blockout from 4 angles?   [ ]

WHILE CODING:
5. Is every position derived from a constant? [ ]
6. Does every element touch what it should?   [ ]
7. Am I building big-to-small?                [ ]

BEFORE COMMITTING:
8. Did I run visual QA?                       [ ]
9. Does the screenshot match the reference?   [ ]
10. Did I check from the player's perspective? [ ]
```

---

## Sources

Research compiled from:

- [The Level Design Book: Blockout](https://book.leveldesignbook.com/process/blockout)
- [The Level Design Book: Metrics](https://book.leveldesignbook.com/process/blockout/metrics)
- [The Level Design Book: Environment Art](https://book.leveldesignbook.com/process/env-art)
- [World of Level Design: Blocktober Guide](https://www.worldofleveldesign.com/categories/level_design_tutorials/guide-to-blocktober.php)
- [World of Level Design: Prototype Blockout Process](https://worldofleveldesign.com/categories/game_environments_design/prototype-blockout-process-modular-environments.php)
- [World of Level Design: UE5 Guide to Scale and Proportions](https://www.worldofleveldesign.com/categories/ue5/guide-to-scale-dimensions-proportions.php)
- [World of Level Design: Reference Gathering Guide](https://worldofleveldesign.com/categories/level_design_tutorials/guide-to-collecting-level-design-reference.php)
- [80.lv: Stages of Environment Art in Gamedev](https://80.lv/articles/the-stages-of-environment-art-in-gamedev)
- [Grokipedia: Strip Mall Architecture](https://grokipedia.com/page/stripmall_architecture)
- [General Steel: Strip Mall Designs](https://gensteel.com/steel-building-kits/strip-malls/)
- [3ten Architecture: Retail Success - The Strip Center](https://3ten.co/retail-success-strip-center/)
- [Common Edge: AI, Architecture, and the Uncanny Valley](https://commonedge.org/ai-architecture-and-the-uncanny-valley/)
- [ArchDaily: Architectural Rendering and the Uncanny Valley](https://www.archdaily.com/959563/architectural-rendering-and-the-slippery-slope-of-the-uncanny-valley)
- [Roof Hub: Parapet Wall Roofing Guide](https://myroofhub.com/flat-roofs/parapet-walls-design-construction/)
- [Building Science: BSI-050 Parapets](https://buildingscience.com/documents/insights/bsi-050-parapets-where-roofs-meet-walls)
- [Engineer Fix: How to Design Exterior Stairs to a Second Floor](https://engineerfix.com/how-to-design-exterior-stairs-to-a-second-floor/)
- [Lapeyre Stair: Exterior Stairs Code Requirements](https://www.lapeyrestair.com/blog/exterior-stairs-code/)
- [SelfCAD: 11 Common 3D Modeling Mistakes](https://www.selfcad.com/blog/common-3d-modeling-mistakes-and-how-to-avoid-them)
- [Professional 3D Services: Common 3D Design Errors](https://professional3dservices.com/blog/common-3d-design-errors-to-avoid.html)
- [MIT-DUSP: Building Housing Over Single-Story Retail](https://issuu.com/mit-dusp/docs/building_housing_over_single-story_retail/s/19239217)
- [PureRef](https://www.pureref.com/)
- [Three.js Coordinate System Overview](https://medium.com/@alexbates39/an-overview-of-the-three-js-coordinate-system-07f75ee76e64)
- [Discover Three.js: Transformations](https://discoverthreejs.com/book/first-steps/transformations/)
- [pmndrs/react-three-fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Shamus Young: Procedural City Building Generation](https://www.shamusyoung.com/twentysidedtale/?p=2968)
- [Hitem3D: Level Design Fundamentals 2026](https://www.hitem3d.ai/blog/en-Level-Design-Fundamentals-A-Complete-Guide-for-Game-Developers/)
