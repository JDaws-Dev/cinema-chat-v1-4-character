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
