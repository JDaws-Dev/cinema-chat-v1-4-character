# Friday Night Video — Interior Design Guide & Directive

## Design Philosophy
Low-poly cel-shaded 1992 Blockbuster video store. The goal is "believable nostalgia" not photorealism. Color choices and clutter do the heavy lifting, not complex lighting. The store should feel like a bright fluorescent retail box — not moody or dark.

## Lighting Directive (P0)

### Current Problem
Ambient light at 1.85 washes out all directionality. Toon gradient (4 steps) flattens everything into one tone. Fluorescent fixtures glow visually but don't cast actual light.

### Rules
1. **Ambient intensity <= 1.0.** Drop from 1.85 to ~0.9. This is the single highest-impact change.
2. **Every fluorescent fixture gets a pointLight below it.** Intensity ~0.6, distance ~6, warm white (#fff6e8). Fixtures should illuminate, not just glow.
3. **Toon gradient: 5-6 steps.** Smoother transitions without losing cel-shaded look. NearestFilter on both min and mag.
4. **No RectAreaLight.** Incompatible with MeshToonMaterial. Use emissive meshes + pointLights instead.
5. **Max ~10 pointLights total.** No shadows on point lights (6 extra renders each). Directional light for key only.
6. **Night of the Consumers rule:** retail stores are BRIGHT. Sterile fluorescent, not atmospheric. The brightness is the atmosphere.

### Target Setup
```
ambientLight: intensity 0.9, color #f0eadc
hemisphereLight: sky #fff6e4, ground #4a5070, intensity 0.8
directionalLight: position [5,8,3], intensity 1.5, color #fff1dc (key)
directionalLight: position [-3,6,-8], intensity 0.4, color #c8d4e8 (fill)
pointLight x6-8: at fluorescent fixture positions, intensity 0.6, distance 6
```

### Medium-Term: Hybrid Materials
- MeshBasicMaterial with baked vertex colors for static room shell (walls, floor, ceiling) — zero runtime lighting cost
- MeshToonMaterial (5-6 step gradient) only for shelves, props, NPCs, interactive objects
- N8AO ambient occlusion for depth and grounding (@react-three/postprocessing)

## Color Palette

### Blockbuster Authentic
- **Walls:** Blue #1a3a6a with gold #ffd700 accent stripe
- **Floor/carpet:** Blue-grey #2a3660 (NOT too dark — real Blockbusters had lighter carpet)
- **Ceiling tiles:** Off-white #e8e0d0
- **Shelving wood:** Warm brown #5a3820
- **Counter laminate:** Tan #D2B48C
- **Fluorescent warm white:** #fff6e8 to #fffae8

### 90s Accent Colors
- Petrol, magenta, neon green, electric blue for signage and props
- Pastel base with neon accents for promotional materials
- Gold/yellow for branding elements (genre signs, membership cards)

## Layout Rules (from Retro Rewind research)

1. **Wall shelving first, center aisles second.** Perimeter walls lined with shelves, gondola aisles in the middle.
2. **Genre grouping matters.** Compatible genres adjacent: Kids/Family, Action/Horror, Romance/Comedy, Sci-Fi/Fantasy.
3. **Traffic flow.** Clear paths from entrance to counter. Keep register area unobstructed on the right (queue space).
4. **Counter near entrance.** Left or right of door, always visible when entering.
5. **New Releases on back wall.** Forces customers to walk through the store (real Blockbuster strategy).

## Clutter Rules (from 80.lv "Cozy Clutter" research)

### "Prop Stacks" — Group Objects to Tell Stories
- Returns bin overflowing with tapes (someone just dropped off a bunch)
- Half-eaten snack behind counter (employee on break)
- Membership forms fanned out on counter (busy night)
- One crooked standee, one perfectly placed (different employees set them up)

### Evidence of Use
- Carpet slightly worn near entrance-to-counter path (vertex color darkening)
- Scuff marks on floor near shelf ends (where people turn)
- Price stickers slightly peeling on bargain bin items
- Handwritten "Staff Picks" signs with imperfect lettering

### Density Guidelines
- Counter area: HIGHEST density (candy, forms, register, tapes, signs, bell, pen)
- Aisle endcaps: MEDIUM density (genre signs, promo displays, standees)
- Mid-aisle: LOW density (just shelves and tapes, clear browsing space)
- Walls: MEDIUM density (posters, signs, clock, fire extinguisher, phone)

## What Makes It Recognizable as a Video Store

Must-have elements (all implemented):
- [x] Blue/yellow Blockbuster-style branding
- [x] VHS cases on shelves (face-out on wall, spine-out on gondolas)
- [x] Genre section signs overhead
- [x] "Be Kind, Rewind" signage
- [x] "New Releases" wall display
- [x] Cardboard movie standees
- [x] Carpet flooring
- [x] Fluorescent drop-ceiling
- [x] Counter with register, candy, membership cards
- [x] Returns drop box

Nice-to-have (partially implemented):
- [x] Popcorn machine / candy rack
- [x] Staff Picks shelf
- [x] Store hours sign
- [x] Security mirror
- [ ] VHS rewinder machine (visual only, exists as prop)
- [ ] Membership card scanner at counter
- [ ] "Please rewind" stickers on individual tapes
- [ ] Weekly rental specials chalkboard
- [ ] Employee name tags on NPCs

## Performance Budget

- **Max 1000 draw calls** (aim for few hundred)
- **InstancedMesh for VHS cases** — one draw call for hundreds of cases
- **No shadows on pointLights** (6 extra render passes each)
- **MeshBasicMaterial on mobile** (already implemented via Mat component)
- **DPR=1 on mobile, [1,2] on desktop** (already implemented)
- **Raycaster throttled to ~10Hz on mobile** (already implemented)
- **frameloop="demand"** when nothing animates (not yet implemented)

## AI Asset Generation

**Tripo Smart Mesh P1.0** — generates clean low-poly game-ready GLB models in ~2 seconds. Good for:
- Promotional standees
- Food/candy props
- Furniture (chairs, displays)
- Decorative items

**Meshy AI** — cleaner meshes with good edge flow. Better for:
- Detailed hero props
- Character accessories
- Signage with text

## Reference Games

| Game | Relevance | Key Takeaway |
|------|-----------|--------------|
| Retro Rewind | Direct competitor, video store sim | Layout patterns, genre grouping, traffic flow |
| Night of the Consumers | Low-poly store horror | Sterile fluorescent = atmosphere, sightline blocking with shelves |
| Untitled Goose Game | Flat-shaded 3D, SSAO grounding | Color and AO do more than complex lighting |
| A Short Hike | Warm flat-shaded aesthetic | Minimal shadows, color carries mood |

## Reference Sources
- [Retro Rewind Store Layout Guide](https://www.thegamer.com/retro-rewind-store-layout-best-guide/)
- [Baked Lighting in R3F](https://tchayen.github.io/posts/baked-lighting-in-r3f)
- [Custom Toon Shader Tutorial](https://www.maya-ndljk.com/blog/threejs-basic-toon-shader)
- [N8AO Ambient Occlusion](https://github.com/N8python/n8ao)
- [Cozy Clutter: Lived-In Interiors](https://80.lv/articles/cozy-clutter-working-on-a-lived-in-hobbit-hole-interior)
- [Claude Code Game Development Patterns](https://github.com/HermeticOrmus/claude-code-game-development)
- [Three.js Skills for Claude](https://github.com/CloudAI-X/threejs-skills)
- [90s Color Palettes](https://www.vandelaydesign.com/90s-color-palettes/)
