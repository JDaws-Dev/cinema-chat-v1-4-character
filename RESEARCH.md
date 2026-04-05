# Friday Night Video — Research Report (2026-03-29)

## Domain Names

**Top 5 recommendations:**
1. **fridaynightvideo.com** — Perfect brand match. Peak 90s nostalgia.
2. **fridaynightvideo.gg** — Gamer TLD, great fallback if .com taken.
3. **rentavhs.com** — Short, punchy, action-oriented. Likely available.
4. **fridaynightvid.com** — Shorter variant, strong branding.
5. **fridaynightvideo.app** — Forces HTTPS, clean.

**Action:** Check availability at instantdomainsearch.com

## Competitive Landscape

### The Market Opportunity
**Retro Rewind** (Steam, March 2026) sold **100,000 copies in 5 days** at $19.90 — proving massive demand for video store nostalgia. But it's a paid download.

**Nobody is doing this in the browser.** Zero free, browser-based, zero-install 3D video store experiences exist.

### Competitors
| Game | Platform | Price | Our Advantage |
|------|----------|-------|---------------|
| Retro Rewind | Steam | $19.90 | We're free + browser |
| Rewind 99 | Steam EA | ~$15 | We're free + browser |
| The Last Video Store | PSVR | $20+headset | We're free + any device |
| Blockbuster Inc. | Steam | $20 | Different concept (studio mgmt) |

### Our Unique Position
**"Walk into a 90s video store right now, in your browser, for free."**
- No download, no headset, no money
- Customer perspective (not manager sim)
- Atmospheric/experiential (not inventory management)
- Real TMDB movie data
- RPG progression + nostalgia

## Rendering Improvement Techniques (Ranked)

| # | Technique | Visual Impact | Effort | Perf Impact |
|---|-----------|--------------|--------|-------------|
| 1 | InstancedMesh for VHS boxes | 2/10 (enables others) | Medium | MUCH BETTER |
| 2 | GLTF models via useGLTF | 9/10 | Medium | Same/Better |
| 3 | MeshToonMaterial (cel shading) | 8/10 | Easy | Same |
| 4 | Canvas-generated textures | 7/10 | Easy-Medium | Better |
| 5 | RoundedBox for furniture | 6/10 | Easy | Same |
| 6 | Billboard sprites for decorations | 5/10 | Easy | Better |
| 7 | PS1 retro shader (toggle) | 7/10 | Hard | Better |
| 8 | CSG for doorways/arches | 6/10 | Medium | Same |
| 9 | Sprite sheet NPC animations | 6/10 | Medium | Better |
| 10 | LOD with Detailed component | 4/10 | Easy | Better |

### Key Resources
- **gltfjsx**: `npx gltfjsx model.glb --transform --types` (auto-generates R3F component)
- **Free models**: Kenney.nl (CC0), Poly Pizza, Quaternius, Sketchfab CC0
- **MeshToonMaterial**: Drop-in replacement for Mat component
- **InstancedMesh**: Collapses 720 VHS draw calls into 1
- **PS1 shader**: Codrops tutorial for R3F specifically

---

## Alternative Name Analysis

### Top 5 Name Picks

| # | Name | Score | Why |
|---|------|-------|-----|
| 1 | **Late Fee** | 8.5 | Emotional, unique, short. Everyone who rented VHS feels this. No existing game. |
| 2 | **Rewind Night** | 8.0 | Clean, evocative. Differentiates from Retro Rewind. No conflicts. |
| 3 | **Please Rewind** | 7.8 | Triggers sticker memory without trademark. Personality. |
| 4 | **Tape Night** | 7.5 | Simple, clean, era-specific. |
| 5 | **Neon Video** | 7.3 | Captures the aesthetic. Works as game title AND store name. |

### Names to AVOID
- **Friday Night [anything]** — Friday Night Funkin' dominates all "Friday Night" game searches (SEO disaster)
- **Be Kind Rewind** — active trademarks, existing film
- **The Last Blockbuster** — documentary + trademark
- **Rewind** (alone) — too crowded

---

## Marketing Plan (Ranked by Impact/Effort)

### Phase 1: Launch Week ($0, ~8 hours)
1. List on itch.io with full tags
2. Post to r/WebGames, r/nostalgia, r/90s
3. Post to r/ThreeJS, r/webdev (dev angle)
4. Add share buttons + URL watermark to screenshots
5. SEO: optimize landing page meta tags

### Phase 2: First Month ($0, ~15 hours)
6. Press kit (screenshots, trailer, pitch)
7. Email 5-10 journalists — piggyback on Retro Rewind coverage wave
8. List on Newgrounds
9. First TikTok ("POV: it's 1995...")
10. Submit to CrazyGames (20M monthly players)
11. Twitter #IndieGame #ScreenshotSaturday
12. Start Discord server

### Phase 3: Month 2-3 ($0, ongoing)
13. YouTube devlog
14. PWA → Microsoft Store (free via PWABuilder)
15. Reach out to cozy game Twitch streamers
16. Submit to PC Gamer "best browser games" list

### Key Pitch
"Retro Rewind sold 100K copies recreating the 90s video store. We built one you can visit for free in your browser. No download. No cost. Just click."

### Retro Rewind Press Wave
Still active (March 2026). Narrow window to ride it with targeted press outreach.

---

## Addendum -- 2026-04-05

### Latest Research: World Models, 3D Building, and QA

#### External notes
- **Google DeepMind -- Genie 2**: the strongest takeaway is not "generate the whole shipped game with AI." It is **rapid interactive prototyping from a single concept image**, then using agent tasks to test whether the world stays spatially coherent. Useful lesson for us: concept art and rough blockouts are acceptable inputs early, but final game spaces still need human-authored geometry, landmark design, and explicit collision rules.
- **Google DeepMind -- Gemini 2.0 / agents in games**: the useful pattern is **agent-plus-environment evaluation**. The demo framing is consistent: give an agent a concrete world task like "open the blue door" or "go behind the house" and see whether the environment remains legible and consistent under action.
- **Playwright visual comparison docs**: strongest QA pattern is to keep **reference screenshots in a stable environment**, then compare future runs against those baselines. Cross-machine screenshot drift is real, so screenshot QA should be generated and compared in the same local or CI environment.
- **Playwright projects docs**: desktop and mobile should be treated as separate test targets, not just CSS breakpoints. We should run the same high-value interactions on at least one desktop profile and one mobile profile.

#### Direct implications for Friday Night Video
- Use AI/world-model research for **layout ideation, interaction scenarios, and evaluation prompts**, not for final authored geometry.
- Treat every major 3D change as both a **visual design problem** and a **navigation/readability problem**.
- QA should verify whether a player or agent can:
  - identify the focal landmark in 5 seconds
  - move through the space without clipping
  - interpret signage correctly from the intended side
  - complete a shelf, counter, or doorway interaction without camera or UI confusion

### Repo-Specific 3D Building Process

This repo now has a clearer working process, combining the external research above with the in-repo guides:
- Start with **real-world reference and proportions**, especially for storefronts, stairs, counter lines, shelf height, and signage placement.
- Build the **largest readable masses first**:
  - overall building envelope
  - parapet/sign band
  - storefront openings
  - stairs / landings / sidewalk continuity
- Only add secondary detail after the massing reads correctly from the parking lot camera and the street-level player view.
- Anchor all gameplay-critical objects to a clear physical owner:
  - signs belong to walls or counters
  - NPCs belong to walkable lanes
  - VHS interactions belong to fixed browse points or held-view states
- Never trust "it compiles" as proof that the 3D space works. The visual read and collision read must both be checked.

### QA Workflow for This Project

#### Required pass after meaningful gameplay or UI changes
1. Run `npm run build`.
2. Run the live game locally and test the main route:
   - `http://localhost:3001/game`
3. Run visual QA capture when spatial work changes:
   - `npm run visual-qa`
4. Check desktop and mobile separately.
5. Verify at least these interaction classes:
   - navigation through aisles
   - counter approach and checkout
   - NPC blocking / idle / browse behavior
   - VHS inspect / pick up / put back flow
   - HUD readability with no overlap

#### Practical visual checks
- **Parking lot read test**: can you identify the building, brand sign, and front entrance immediately?
- **Landmark test**: is the counter still the brightest and clearest destination when the objective says to return to Vinny?
- **Shelf test**: can the player see top, middle, and bottom VHS rows without camera judder?
- **Collision test**: can the player avoid walking through racks, counters, and NPC bodies?
- **Facing test**: are customer-facing signs actually facing customers, and clerk-facing signs facing Vinny/counter staff?
- **HUD test**: can you understand the current objective in one glance on desktop and on mobile?

#### Good QA habit from the current work
- Build after each real fix.
- Hard refresh when validating visual UI changes.
- Compare the local result against an actual screenshot, not memory.
- If the screen still looks "filtered," inspect for global overlays before changing local component styling.

### Shipped Changes on 2026-04-05

These are now reflected in the live `main` branch:
- Removed the **global CRT scanline overlay** from the game-wide UI layer.
- Reworked the **VHS case inspection flow** into a cleaner front/back case presentation with shared actions.
- Reduced the VHS back cover to a more fixed, box-like layout and removed the in-case streaming panel.
- Simplified the **HUD** from a dense multi-block header into a flatter hierarchy that works better on desktop and mobile.
- Removed the HUD's CRT toggle after removing the global CRT overlay.
- Lowered and stabilized **crouch / kneel** behavior so the bottom VHS rack is readable.
- Improved several **NPC collision and presentation issues**, including blocking against player movement and reducing some head/rig mismatches.

### Open Follow-Ups
- HUD may still need one more desktop reduction pass if the mission band is judged too loud.
- Named character polish (especially Charlie / Vinny) still needs a dedicated appearance and animation cleanup pass.
- A proper automated browser QA setup should be added with Playwright projects for:
  - desktop Chromium
  - mobile Safari emulation
  - mobile Chrome emulation

### Sources Consulted
- Google DeepMind: Genie 2 -- https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/
- Google DeepMind: Gemini 2.0 -- https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-ai-update-december-2024/
- Playwright visual comparisons -- https://playwright.dev/docs/next/test-snapshots
- Playwright projects -- https://playwright.dev/docs/test-projects
- In-repo references:
  - `3D-DESIGN-GUIDE.md`
  - `DESIGN-3D-ARCHITECTURE-METHODOLOGY.md`
  - `HUD-DESIGN.md`
