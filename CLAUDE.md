# Friday Night Video — Claude Code Project Guide

## Architecture
- **Runtime:** Next.js 16 + React 19 + React Three Fiber + Three.js
- **Style:** Low-poly box geometry, cel-shaded, Blockbuster-inspired palette
- **Assets:** Currently all procedural (box/sphere/cylinder geometry). GLB models welcome for props.
- **State:** React hooks + localStorage persistence. No database.

## Art Style & Scale
- **Aesthetic:** Stylized 1990s Blockbuster video store — warm, nostalgic, slightly cartoonish
- **Scale:** 1 unit = 1 meter. Player eye height = 1.6m. Doorways = 2.3m. Ceilings = 3.5m.
- **Colors:** Navy blue walls (#1a3a6a), gold accents (#ffd700), warm brown shelves, cream apartment walls
- **Materials:** Use `Mat` component (meshStandardMaterial wrapper) from store-materials.tsx
- **Lighting:** Warm fluorescent (store), warm ambient (apartment). Max 6 lights per zone.

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

## Key Constraints
- ZERO Claude API cost (subscription CLI only)
- OpenAI for gpt-4o-mini NPC chat only
- ElevenLabs for TTS (eleven_flash_v2_5, disk-cached)
- TMDB for movie data (real movies only, era-filtered)
- No npm packages without explicit approval
- Visual changes MUST be verified before reporting done
