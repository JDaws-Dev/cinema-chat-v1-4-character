# 3D Design Review Checklist — MANDATORY Before Committing Visual Changes

## STOP. Before you commit ANY 3D geometry change, answer ALL of these:

### 1. Real-World Reference
- [ ] Did you web search for reference photos of the real-world thing? (e.g. "exterior apartment stairs above store")
- [ ] Did you look at the reference photos and note proportions, materials, positioning?
- [ ] Did you search for dimension specs? (building codes, furniture standards, etc.)
- [ ] Can you describe in plain English what this thing looks like in real life?

### 2. Spatial Reasoning
- [ ] Did you draw/describe the layout from the PLAYER'S perspective? (not top-down math)
- [ ] Does the geometry clear all walls/floors/ceilings with proper margins?
- [ ] Where would a person actually walk? Can they reach the door/stairs/counter?
- [ ] What do the proportions look like at human eye level (1.6m)?

### 3. Real Measurements (in meters)
Common reference:
- Person height: 1.7m
- Door: 0.91m wide × 2.03m tall
- Standard stair: 0.19m rise, 0.28m tread, 0.91m wide
- Counter height: 0.91m
- Ceiling: 2.44-2.74m
- Handrail: 0.86-0.97m above tread
- Table height: 0.75m
- Chair seat: 0.45m
- [ ] Do your dimensions match real-world measurements?

### 4. Visual Verification
- [ ] Did you run `node scripts/visual-qa.mjs [camera_names]`?
- [ ] Did you READ the screenshots with the Read tool?
- [ ] Does the screenshot match what you'd expect from the reference photos?
- [ ] Check from MULTIPLE angles (not just one camera)
- [ ] Does it look right from the player's starting position?

### 5. Anti-Patterns to Catch
- [ ] No geometry clipping through walls (check x/z bounds vs wall positions)
- [ ] No floating objects (everything touches the floor/wall/ceiling)
- [ ] No invisible objects (check if material is transparent or backface-culled)
- [ ] No objects inside other objects (check bounding boxes)
- [ ] Railings follow stair angles (atan2 of rise/run, applied correctly)
- [ ] Text faces the correct direction (toward the viewer, not away)

### 6. If an Agent Wrote It
- [ ] Did you READ the agent's code changes before committing?
- [ ] Did you verify the agent used real-world reference (not just math)?
- [ ] Did you visually verify the result (not just "build passes")?
- [ ] "Build passes" is NOT proof that geometry looks correct

## Quick Reference: How Things Actually Look

**Exterior apartment stairs (above a store):**
- Run PARALLEL to building wall, about 1m away
- Metal or concrete with metal railings
- Start at ground near front of building, ascend toward the back
- Landing at top with door on the building wall
- Usually covered/partially enclosed
- 16-20 steps for one story

**Strip mall storefront:**
- Full-width glass windows, aluminum frames
- Flat commercial roof (not pitched)
- Signage band above windows
- Concrete sidewalk
- Parking directly in front

**Laundromat interior:**
- Washers along one wall, dryers opposite
- Folding tables in center
- Plastic chairs for waiting
- Fluorescent ceiling lights
- Vending machines in back

**Pizza place interior:**
- Counter/register near front
- Pizza display case
- Booths along walls or freestanding tables
- Often has a few arcade machines
- Menu board on wall above counter
