# Friday Night Video — Claude Code Project Guide

## Architecture
- **Runtime:** Next.js 16 + React 19 + React Three Fiber + Three.js
- **Style:** Low-poly box geometry, cel-shaded, Blockbuster-inspired palette
- **Assets:** Currently all procedural (box/sphere/cylinder geometry). GLB models welcome for props.
- **State:** React hooks + localStorage persistence. No database.

## Art Style & Scale
- **Aesthetic:** Stylized 1990s Blockbuster video store — warm, nostalgic, slightly cartoonish
- **Scale:** 1 unit = 1 meter. Y is UP. Position = CENTER of geometry (use SmartBox to avoid this).
- **Colors:** Navy blue walls (#1a3a6a), gold accents (#ffd700), warm brown shelves, cream apartment walls
- **Materials:** Use `Mat` component (meshStandardMaterial wrapper) from store-materials.tsx
- **Lighting:** Warm fluorescent (store), warm ambient (apartment). Max 6 lights per zone.

## 3D Positioning Helpers (src/components/game3d/helpers.tsx)
- **SmartBox**: position Y = BOTTOM, not center. `<SmartBox size={[2,3,0.2]} position={[0,0,-5]} />`
- **PivotBottom**: wraps children so Y=0 means floor. `<PivotBottom height={3} position={[0,0,0]}>`
- **WORLD_ANCHORS**: named reference points. `offsetFrom(WORLD_ANCHORS.LAUNDROMAT_ENTRANCE, [2,0,0])`
- **BUILDING_CODES**: real measurements. `BUILDING_CODES.COMMERCIAL_CEILING` = 3.5m
- **snapToGrid(val, 0.5)**: prevents magic decimals

## Building Codes (non-negotiable, from helpers.tsx)
- Doors: 0.91m × 2.03m (residential), 1.07m × 2.13m (commercial)
- Ceilings: 3.5m (commercial), 2.8m (residential)
- Walls: 0.2m (interior), 0.3m (exterior)
- Stairs: max 0.197m riser, min 0.254m tread, min 0.91m width
- Counter: 0.91m, Table: 0.75m, Chair seat: 0.45m
- Person: 1.7m, Eye level: 1.6m
- NEVER use raw `<mesh>` for furniture — use SmartBox or PivotBottom

## File Structure
- `src/components/game3d/` — 3D scene components (Store, Apartment, NPCManager, etc.)
- `src/components/game3d/prefabs/` — Layout-driven prefab rendering
- `src/components/game/` — 2D UI overlays (HUD, overlays, dialogue)
- `src/hooks/` — Custom hooks (useGameClock, useInventory, useChallenge, etc.)
- `src/lib/` — Game logic, state, NPC behavior, audio, VHS state
- `src/app/game/` — Main game page + CSS
- `scripts/` — Build tools (visual-qa.mjs, generate-npc-audio.mjs)

## Performance Budget
- Max 10 dynamic NPCs (desktop), 5 (mobile)
- Max 6 lights per zone
- No real-time shadows (too expensive)
- Post-processing: desktop only (Bloom, Vignette, Noise, ChromaticAberration)
- Target: 30+ FPS on mid-range laptop
- Prefer InstancedMesh for repeated objects (VHS boxes, chairs, shelf units)
- Reuse materials — don't create new material instances per mesh

## Modular Zone Rules
- Each zone (store, apartment, pizza, laundromat, exterior) is its own component
- Zones are composed in Store.tsx, not nested
- Props should be reusable factory functions, not baked into zone files
- Layout data lives in store-layout.ts (JSON-like, drives prefab rendering)
- New zones should follow the same pattern: separate file, exported component

## What "Done" Means
1. `npx next build` passes with zero errors
2. Visual QA: run `node scripts/visual-qa.mjs` and review screenshots from `/tmp/fnv-cams/`
3. No z-fighting, floating objects, or invisible geometry
4. Works on both desktop and mobile
5. No new performance regressions (check draw calls aren't exploding)

## Naming Conventions
- Components: PascalCase (Store, Apartment, NPCManager)
- Hooks: camelCase with "use" prefix (useGameClock, useVHSState)
- State files: kebab-case (vhs-state.ts, npc-behavior.ts)
- CSS classes: g3- prefix (g3-hud, g3-overlay, g3-crosshair)

## MANDATORY: 3D Architecture Methodology (see DESIGN-3D-ARCHITECTURE-METHODOLOGY.md)
Before writing ANY 3D geometry code, you MUST follow the methodology in DESIGN-3D-ARCHITECTURE-METHODOLOGY.md.

**The short version (full details in the methodology doc):**
1. Search for reference photos of the real-world thing FIRST
2. Fill out the measurement sheet (real dimensions, not guesses)
3. Build the BLOCKOUT (big boxes only, no details) and verify from 4 angles
4. Only then add detail (window frames, railings, trim)
5. Run visual-qa.mjs and READ the screenshots — compare to references
6. "Build passes" is NOT proof that geometry looks correct

**The three fatal mistakes to avoid:**
- Starting with details before the main volume is right
- Positioning elements with independent hardcoded numbers (use shared edge constants)
- "Imagining" what things look like instead of searching for references

Also see: DESIGN-REVIEW-CHECKLIST.md for the commit-time checklist.

NEVER "imagine" what a thing looks like. ALWAYS reference real-world examples.
- Consider how the thing INTERSECTS with surrounding objects (walls, floors, other geometry)
- Evaluate the ENTIRE screenshot, not just the thing you changed
- Every 3D change MUST include collision updates in FirstPerson.tsx if it affects walkable areas

## Key Constraints
- ZERO Claude API cost (subscription CLI only)
- OpenAI for gpt-4o-mini NPC chat only
- ElevenLabs for TTS (eleven_flash_v2_5, disk-cached)
- TMDB for movie data (real movies only, era-filtered)
- No npm packages without explicit approval
- Visual changes MUST be verified before reporting done
