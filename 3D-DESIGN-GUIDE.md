# 3D Design Guide for Cinema Chat

A practical reference for building visually appealing 3D environments in React Three Fiber / Three.js -- procedurally, without external modeling tools.

---

## Table of Contents

1. [Lighting for Stylized Interior Scenes](#1-lighting-for-stylized-interior-scenes)
2. [Material Techniques for Stylized Games](#2-material-techniques-for-stylized-games)
3. [Spatial Design for First-Person Environments](#3-spatial-design-for-first-person-environments)
4. [Color Theory for 3D Environments](#4-color-theory-for-3d-environments)
5. [Common Mistakes in Procedural Scene Building](#5-common-mistakes-in-procedural-scene-building)
6. [Reference Games and Their Techniques](#6-reference-games-and-their-techniques)
7. [Neon Signs and Glow Effects](#7-neon-signs-and-glow-effects)
8. [Post-Processing in R3F](#8-post-processing-in-r3f)
9. [90s Retail Color Palettes](#9-90s-retail-color-palettes)

---

## 1. Lighting for Stylized Interior Scenes

### The Core Recipe: 3-Light Interior Setup

**What to do:** Use a warm ambient base + cool fill + targeted accent lights.

**Why it works:** Real interiors have light bouncing off every surface (global illumination). We cannot afford true GI in real-time, so we fake it with a layered approach: ambient handles the "bounce," a hemisphere light adds vertical color variation, and point/spot lights create focal interest.

**R3F implementation:**

```tsx
{/* Layer 1: Warm ambient base -- simulates light bouncing off walls/floor */}
<ambientLight intensity={0.3} color="#ffe4c4" />

{/* Layer 2: Hemisphere light -- warm from above (ceiling fixtures), cool from below (floor reflections) */}
<hemisphereLight
  skyColor="#fff5e6"    // warm ceiling bounce
  groundColor="#4a6b8a" // cool floor bounce
  intensity={0.4}
/>

{/* Layer 3: Key light -- main overhead store lighting */}
<pointLight
  position={[0, 4, 0]}
  intensity={1.2}
  color="#fff8f0"
  distance={15}
  decay={2}
/>

{/* Layer 4: Accent spots -- draw attention to shelves, counter, etc. */}
<spotLight
  position={[3, 4, -2]}
  target-position={[3, 0, -2]}
  angle={0.4}
  penumbra={0.5}
  intensity={0.8}
  color="#ffe0b2"
  distance={8}
/>
```

### Warm vs Cool Zones in One Scene

**What to do:** Assign different colored point lights to different areas of the store. Warm lights (amber/yellow) near the entrance and counter. Cool lights (blue/purple) in the back rooms or "New Releases" section.

**Why it works:** Color temperature contrast creates the illusion of depth and variety without adding geometry. Warm areas feel inviting and close; cool areas feel mysterious and distant. This is how retail stores work in real life -- warm lighting at checkout, cooler lighting in browsing areas.

**R3F implementation:**

```tsx
{/* Warm zone: entrance / checkout counter */}
<pointLight position={[-4, 3, 5]} color="#ffb347" intensity={0.8} distance={10} />

{/* Cool zone: back of store / special sections */}
<pointLight position={[4, 3, -8]} color="#7eb8da" intensity={0.6} distance={10} />

{/* Neon accent: colored wash from a "sign" */}
<pointLight position={[0, 2.5, -10]} color="#ff69b4" intensity={0.4} distance={6} />
```

### Fake Global Illumination Techniques

**What to do:** Use multiple low-intensity colored ambient/point lights positioned where light would naturally bounce, rather than one flat ambient light.

**Why it works:** A single white ambient light makes everything look flat and lifeless. Multiple colored fills simulate the way light picks up color from surfaces it bounces off of. In a Blockbuster store, overhead fluorescents bounce warm off the carpet, cool off the metal shelving, and colorful off the movie posters.

**Practical approach (no baking needed):**

```tsx
{/* Instead of one flat ambient: */}
{/* BAD:  <ambientLight intensity={0.5} color="white" /> */}

{/* GOOD: Simulate colored bounce from different surfaces */}
<ambientLight intensity={0.15} color="#ffe4c4" />

{/* Floor bounce (warm carpet) */}
<pointLight position={[0, 0.1, 0]} color="#8B7355" intensity={0.2} distance={12} />

{/* Ceiling bounce (fluorescent panels) */}
<pointLight position={[0, 4.5, 0]} color="#f0f0ff" intensity={0.3} distance={12} />

{/* Wall bounce (colored movie posters) */}
<pointLight position={[-6, 2, 0]} color="#ff9999" intensity={0.1} distance={8} />
<pointLight position={[6, 2, 0]} color="#9999ff" intensity={0.1} distance={8} />
```

### Performance Rules for Lights

- **Max 4-5 active lights** in view at a time for good performance on mid-range hardware
- **PointLight** is cheaper than **SpotLight** (no cone/shadow map computation)
- **Never enable `castShadow` on more than 2 lights** -- shadow maps are expensive
- If you need more "lights," use emissive materials on geometry instead (zero light cost)
- `distance` and `decay` on point lights let the renderer skip calculations for far-away objects

---

## 2. Material Techniques for Stylized Games

### When to Use Each Material

| Material | Cost | Lighting | Best For |
|----------|------|----------|----------|
| `meshBasicMaterial` | Cheapest | None (unlit) | Mobile fallback, UI elements, skyboxes, things that should glow uniformly |
| `meshLambertMaterial` | Cheap | Per-vertex | Large flat surfaces where per-pixel accuracy does not matter |
| `meshToonMaterial` | Medium | Per-pixel, stepped | Cel-shaded / cartoon look -- **our primary material** |
| `meshStandardMaterial` | Expensive | PBR per-pixel | Realistic surfaces, metallic objects, glass |
| `meshPhysicalMaterial` | Most expensive | PBR + clearcoat | Only for hero objects needing realism (avoid in stylized games) |

### MeshToonMaterial Best Practices

**What to do:** Use a custom gradient map to control the number and sharpness of shading steps.

**Why it works:** The default toon material only has 2 steps (light/shadow), which can look cheap. A 3-4 step gradient with carefully chosen values gives that "high-quality cartoon" look (think Wind Waker, Genshin Impact).

**Common mistakes to avoid:**
- Forgetting to set `minFilter` and `magFilter` to `THREE.NearestFilter` on the gradient texture (without this, the steps blur together and you lose the toon effect)
- Using too many steps (5+), which just looks like a bad Standard material
- Not having enough light contrast in the scene -- toon materials need at least one directional/point light to show their step shading

**R3F implementation (3-step gradient):**

```tsx
const toonGradient = useMemo(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  // Shadow | Mid-shadow | Mid-light | Highlight
  ctx.fillStyle = "#555"; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = "#999"; ctx.fillRect(1, 0, 1, 1);
  ctx.fillStyle = "#ccc"; ctx.fillRect(2, 0, 1, 1);
  ctx.fillStyle = "#fff"; ctx.fillRect(3, 0, 1, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter; // CRITICAL -- keeps steps sharp
  tex.magFilter = THREE.NearestFilter;
  return tex;
}, []);

<meshToonMaterial color="#4488aa" gradientMap={toonGradient} />
```

### Making Flat Colors Look Good

**What to do:** Pick colors that are slightly desaturated and vary in value. Never use pure hues (like `#ff0000`). Add subtle value shifts between adjacent surfaces.

**Why it works:** Pure saturated colors fight each other visually and look like programmer art. Slightly muted colors with value variation create harmony and depth. A shelf colored `#6b8f71` looks dramatically better than `#00ff00`.

**Color picking rules:**
1. Start with a base hue
2. Desaturate it 30-50% (pull it toward gray)
3. For shadow sides of the same object, shift the hue slightly toward blue/purple and darken 15-20%
4. For highlight sides, shift toward yellow and lighten 10-15%

```tsx
{/* BAD: Pure saturated colors */}
<meshToonMaterial color="#0000ff" />

{/* GOOD: Desaturated, considered palette */}
<meshToonMaterial color="#5b7aa5" />
```

### Vertex Colors vs Textures vs Solid Materials

**Vertex Colors:**
- Best for: Procedural geometry where you want color variation per-face
- Pro: No texture memory, no UV mapping needed
- Con: Color resolution limited by polygon count; colors blend between vertices unless edges are split
- In Three.js: Set `vertexColors: true` on the material, add a `color` attribute to BufferGeometry

**Textures:**
- Best for: Detailed surfaces, repeating patterns (wood grain, carpet)
- Pro: High detail independent of poly count
- Con: Requires UV mapping, texture memory, loading time

**Solid Materials (one color per mesh):**
- Best for: Stylized low-poly games (our use case)
- Pro: Simplest, cheapest, easiest to change at runtime
- Con: Need separate meshes/materials for each color
- This is what Untitled Goose Game does -- and it looks great

**Recommendation for Cinema Chat:** Stick with solid-color MeshToonMaterial as the primary approach. Use emissive materials for things that should glow (neon signs, TV screens). Reserve textures for movie posters and floor/carpet patterns only.

### The PS1 Aesthetic (if desired)

**What to do:** Render to a low-resolution target, snap vertices to a grid, use affine texture mapping.

**Key techniques:**
- Render the scene to a small RenderTexture (e.g., 320x240), then stretch it to fill the screen
- In a vertex shader, snap vertex positions to a grid: `pos = floor(pos * gridSize) / gridSize`
- Apply a dither pattern in the fragment shader
- Use low-resolution textures (64x64 or 128x128) with `NearestFilter`

**R3F implementation (simple resolution reduction):**

```tsx
import { EffectComposer, Pixelation } from "@react-three/postprocessing";

<EffectComposer>
  <Pixelation granularity={4} /> {/* bigger number = more pixelated */}
</EffectComposer>
```

---

## 3. Spatial Design for First-Person Environments

### The "Weenie" Concept (Disney Imagineering)

**What to do:** Place one large, visually distinctive landmark that is visible from most positions in the store. In a video store, this could be: a large neon "NEW RELEASES" sign, a life-size movie character cutout, or a distinctive checkout counter.

**Why it works:** Walt Disney called these "weenies" because they work like holding a sausage to attract a dog. Players instinctively move toward distinctive visual landmarks. Without one, players wander aimlessly. Disneyland uses Sleeping Beauty's Castle as the ultimate weenie -- visible from the entrance, drawing you down Main Street.

**Implementation tips:**
- The weenie should be **taller** than surrounding objects
- Give it a **contrasting color** (warm object against cool background)
- Make it **visible from the entrance** -- the first thing the player sees
- Place it at the **back** of the store to draw players through the full space

```tsx
{/* A tall neon "NEW RELEASES" sign at the back wall -- the store's weenie */}
<group position={[0, 3, -12]}>
  <Text
    fontSize={0.8}
    color="#ff1493"
    anchorX="center"
    anchorY="middle"
  >
    NEW RELEASES
  </Text>
  {/* Glow backdrop */}
  <mesh position={[0, 0, -0.1]}>
    <planeGeometry args={[6, 1.5]} />
    <meshBasicMaterial color="#1a0020" />
  </mesh>
  {/* Pink light wash */}
  <pointLight color="#ff1493" intensity={0.6} distance={8} />
</group>
```

### Real-World Scale Reference

**What to do:** Establish a unit scale (1 unit = 1 meter) and stick to it. Measure everything against human proportions.

**Why it works:** Scale errors are one of the most common reasons scenes feel "off." The human brain is extremely sensitive to whether a doorway feels walkable, whether a shelf is reachable, and whether a counter is the right height.

**Key measurements (in meters / Three.js units):**

| Object | Height | Width | Depth |
|--------|--------|-------|-------|
| Player eye height | 1.6 | - | - |
| Standard doorway | 2.1 | 0.9 | 0.15 |
| Retail shelf unit | 1.8 | 0.9 | 0.4 |
| Checkout counter | 0.9 | 1.5 | 0.6 |
| Ceiling height (retail) | 3.0-3.5 | - | - |
| Aisle width (comfortable) | - | 1.5-2.0 | - |
| Aisle width (minimum) | - | 1.0 | - |
| DVD/VHS case | 0.19 | 0.13 | 0.02 |
| Standard poster | 0.68 | 1.02 | - |
| Floor tile | - | 0.3 | 0.3 |

### Eye-Level Decoration Priority

**What to do:** Put 70% of your detail budget at eye level (1.2-1.8m), 20% at floor level, 10% at ceiling level.

**Why it works:** In a first-person game, the player naturally looks straight ahead. Eye-level is where movie posters, shelf labels, neon signs, and interesting props should live. Floor and ceiling can be simpler because they are in peripheral vision.

**Practical application:**
- **Eye level (1.2-1.8m):** Movie posters, shelf labels, VHS/DVD boxes with visible art, character cutouts, "Staff Picks" signs
- **Floor level (0-0.5m):** Carpet/tile pattern, baseboard molding, dropped popcorn/candy (character)
- **Above eye (1.8-3.0m):** Genre section signs, security cameras, fluorescent light fixtures
- **Ceiling (3.0m+):** Simple flat color or basic tile pattern -- do not waste polygons here

### Avoiding the Empty Room Problem

**What to do:** Use the "large-medium-small" prop clustering technique. Every area needs at least one large anchor (shelf unit), 2-3 medium props (stacked VHS, posters, signs), and a scattering of small detail (labels, stickers, price tags).

**Why it works:** Empty space reads as unfinished, not as intentional minimalism (in a retail environment). Real video stores were absolutely packed with visual information. But you do not need to model every item -- clusters of detail trick the brain into perceiving a full environment.

**Prop density by zone:**
- **Perimeter walls:** High density -- shelves fully stocked, every wall covered
- **Center aisles:** Medium density -- free-standing shelf units with visible movie boxes
- **Open areas (near entrance/counter):** Lower density but with focal objects -- the counter, a standee, a TV playing a movie
- **Transitions:** Use floor material changes (carpet to tile) or overhead banners to mark zone boundaries

**The "five things" rule:** Stand at any point in the store and look in any direction. The player should be able to see at least five distinct visual elements (a shelf, a poster, a sign, a light fixture, and a floor pattern change). If they see bare walls or empty floor, add props.

### Flow and Sightlines

**What to do:** Create a natural circulation path that flows from entrance -> browsing aisles -> back wall (new releases) -> checkout counter -> exit. Use shelving angles and floor patterns to guide this flow.

**Why it works:** Real retail stores are meticulously designed to control customer flow. The back wall always has the most desirable items (forcing customers to walk past everything). End caps (shelf ends facing aisles) are premium display space.

**Layout principles:**
- **Entrance decompression zone:** 1.5-2m of open space right inside the door -- do not put anything here
- **Power wall:** The first wall the customer sees to the right (in Western stores) -- put high-impact displays here
- **Racetrack layout:** A main aisle that forms a loop around the perimeter, with cross-aisles
- **Back wall draw:** New releases, special features, or interactive elements at the farthest point

---

## 4. Color Theory for 3D Environments

### Warm Foreground, Cool Background (Atmospheric Perspective)

**What to do:** Objects closer to the camera should be warmer (more orange/yellow). Objects farther away should be cooler (more blue/gray). This applies even in an interior.

**Why it works:** This mimics how the atmosphere in real life scatters light -- distant mountains look blue. Even in a small interior, this subtle shift (warmer shelves near you, slightly cooler walls in the back) creates a sense of depth without any geometry tricks.

**R3F implementation:**

```tsx
{/* Use fog to naturally push distant objects toward a cool color */}
<fog attach="fog" args={["#2a2040", 8, 25]} />

{/* Near shelves: warm wood tones */}
<meshToonMaterial color="#8B6F47" gradientMap={toonGradient} />

{/* Far wall: cooler, slightly desaturated version */}
<meshToonMaterial color="#6B6577" gradientMap={toonGradient} />
```

### How Pixar Uses Color for Mood

**What to do:** Assign a dominant color to each emotional state or area of the scene. Limit each zone to 2-3 dominant hues plus a neutral.

**Key lessons from Pixar:**
- **Up:** Vibrant, saturated colors during joy; desaturated and muted during grief
- **Soul:** Physical world = warm oranges, yellows, earthy browns (life). Soul world = cool blues, teals, purples (abstract)
- **Inside Out:** Each emotion has a single signature color -- this is extremely effective for zone identification

**Application to Cinema Chat:**
- **Action section:** Warm reds and oranges (`#c0392b`, `#e67e22`)
- **Comedy section:** Bright yellows and teals (`#f1c40f`, `#1abc9c`)
- **Horror section:** Deep purples and sickly greens (`#4a0e4e`, `#2ecc71` desaturated)
- **Romance section:** Soft pinks and warm whites (`#e8a0bf`, `#fdf2e9`)
- **Sci-Fi section:** Cool blues and silver-grays (`#2980b9`, `#95a5a6`)

### The 60-30-10 Color Rule

**What to do:** In any given view, 60% should be a dominant neutral, 30% should be a secondary color, and 10% should be an accent.

**Why it works:** Interior designers use this rule because it creates visual balance. Too many competing colors creates chaos. In a video store:
- **60% dominant:** Neutral walls, ceiling, floor (`#2c2c3e`, `#3d3d5c`, `#4a4a6a`)
- **30% secondary:** Shelf units, counter surfaces (`#5c4033`, `#6b4226`)
- **10% accent:** Neon signs, highlighted movie boxes, genre labels (`#ff1493`, `#00d4ff`, `#ffd700`)

### Specific Hex Palettes for a 90s Video Store

**Core Store Palette:**

```
Background/Walls:    #2c2c3e  (dark blue-gray, like late-night retail)
Ceiling:             #1a1a2e  (darker, recedes)
Floor/Carpet:        #4a3728  (warm brown, commercial carpet)
Floor Alt/Tile:      #5c5c6e  (cool gray, near entrance)
```

**Furniture/Fixtures:**

```
Wood Shelving:       #6b4226  (warm medium brown)
Metal Shelf Rails:   #8a8a8a  (neutral gray)
Checkout Counter:    #3d2b1f  (dark walnut)
Counter Top:         #b8956a  (lighter laminate)
```

**Accent/Neon:**

```
Blockbuster Blue:    #004e98  (the actual Blockbuster brand blue)
Blockbuster Yellow:  #ffd700  (ticket stub yellow)
Neon Pink:           #ff1493  (hot pink neon tubing)
Neon Blue:           #00d4ff  (electric blue neon)
Neon Green:          #39ff14  (open sign green)
```

**Genre Section Accents:**

```
Action Red:          #c0392b
Comedy Gold:         #f39c12
Horror Purple:       #6c3483
Romance Pink:        #e8a0bf
Sci-Fi Cyan:         #00bcd4
Drama Navy:          #1a5276
Kids Yellow:         #f7dc6f
Classic B&W:         #aaaaaa
```

---

## 5. Common Mistakes in Procedural Scene Building

### Z-Fighting

**What it is:** Two surfaces at exactly the same position flicker between each other because the depth buffer cannot determine which is in front.

**How to prevent it:**
- Offset overlapping surfaces by at least 0.001-0.01 units
- For decals (posters on walls, labels on shelves), offset by 0.005 in the normal direction
- Use `polygonOffset` on materials when stacking flat surfaces

```tsx
{/* Poster on a wall -- offset 0.005 forward to prevent z-fighting */}
<mesh position={[-5.995, 1.5, -3]}> {/* Wall is at x=-6 */}
  <planeGeometry args={[0.68, 1.02]} />
  <meshToonMaterial
    color="#ffffff"
    polygonOffset
    polygonOffsetFactor={-1}
    polygonOffsetUnits={-1}
  />
</mesh>
```

### Why Ambient-Only Lighting Looks Flat

**What it is:** Using only `<ambientLight>` makes every surface the same brightness, killing all sense of depth and form.

**What to do instead:** Always pair ambient light with at least one directional or point light. The ambient should be low intensity (0.15-0.3) and serve only as shadow fill. The directional/point light does the actual work of revealing form.

```tsx
{/* BAD: flat, lifeless */}
<ambientLight intensity={0.8} />

{/* GOOD: ambient as fill, point light reveals form */}
<ambientLight intensity={0.2} color="#e8d5c4" />
<pointLight position={[0, 4, 2]} intensity={1.0} color="#fff5ee" />
```

### Scale Errors

**What it is:** Objects that are the wrong size relative to the player make the scene feel like a dollhouse or a warehouse. This is the single most impactful mistake in procedural 3D.

**How to check:**
1. Place a reference "human" (a capsule or box that is 1.8m tall, 0.4m wide) in the scene
2. Walk it up to every object -- does the door look like it fits? Can the human reach the top shelf?
3. Sit the human at the counter -- is the counter at waist height?
4. Common error: Making shelves 3m tall (real shelves are 1.5-2.0m)
5. Common error: Making aisles 4m wide (real aisles are 1.2-1.8m)

```tsx
{/* Debug reference human -- toggle on during development */}
<mesh position={[0, 0.9, 0]}>
  <capsuleGeometry args={[0.2, 1.4, 4, 8]} /> {/* total height ~1.8m */}
  <meshBasicMaterial color="red" wireframe />
</mesh>
```

### The "Programmer Art" Trap

**What makes geometry look like programmer art:**
1. **All right angles, no chamfers.** Real furniture has rounded edges. Use `RoundedBox` from drei or add small bevels.
2. **Uniform color across an entire object.** A shelf unit should have slightly different shades for the sides, top, and shelves. Even a 5% value shift makes a difference.
3. **Perfect alignment.** Real objects are slightly rotated, offset, or uneven. Add `rotation={[0, Math.random() * 0.02 - 0.01, 0]}` to props.
4. **No surface variation.** Even flat-colored objects should have subtle shade differences. The top of a box catches more light than the side.
5. **Missing trim and edge detail.** Add thin strips of contrasting color at edges -- baseboard molding, shelf edge trim, counter lip.

**Quick fixes:**
```tsx
{/* Instead of a perfect box for a shelf unit: */}

{/* Add a thin top cap with slightly different color */}
<mesh position={[0, 1.82, 0]}>
  <boxGeometry args={[0.92, 0.02, 0.42]} />
  <meshToonMaterial color="#5a3820" gradientMap={toonGradient} />
</mesh>

{/* Add edge trim on the front */}
<mesh position={[0, 0.9, 0.21]}>
  <boxGeometry args={[0.92, 1.8, 0.02]} />
  <meshToonMaterial color="#4a2810" gradientMap={toonGradient} />
</mesh>

{/* Slight imperfection */}
<group rotation={[0, 0.005, 0]}>
  {/* ... shelf contents ... */}
</group>
```

### How to Evaluate Your Own Scene Objectively

**The screenshot test:** Take a screenshot. Desaturate it (convert to grayscale). If everything blends together into one value, you do not have enough contrast. Good scenes have a clear range of darks, midtones, and highlights even in grayscale.

**The squint test:** Squint at the scene. The overall shapes and color blocks should still read clearly. If everything merges into a muddy blur, your value separation is poor.

**The "5 second" test:** Show someone the scene for 5 seconds and ask them what they saw. If they can identify the setting (a store), the focal point (the counter/sign), and the mood (warm/retro) in 5 seconds, your scene is readable.

**The silhouette test:** With just black silhouettes against a white background, can you tell what each object is? If a VHS shelf looks the same as a counter, the shapes are not distinct enough.

---

## 6. Reference Games and Their Techniques

### Untitled Goose Game

**The look:** Clean, textureless, flat-colored low-poly meshes with soft shadows.

**How they achieved it:**
- Low-poly 3D models with zero textures -- all color comes from vertex colors or per-face solid colors
- Diffuse colors stored directly on vertices, with split polygons for sharp color transitions
- A single directional light (sun) with shadow mapping for self-shadowing
- SSAO (Screen Space Ambient Occlusion) for soft contact shadows (visible around feet and object bases)
- Muted pastel palette: soft greens, warm browns, subtle reds/yellows for props

**What to steal:**
- Solid-color materials can look professional if the palette is considered
- A single directional light + SSAO gives more depth than complex multi-light setups
- The charm is in the animation and interaction, not the rendering -- simple visuals free you to invest in gameplay
- Color variety comes from MANY objects each with their own hue, not from textures on individual objects

**R3F implementation of the style:**

```tsx
{/* Untitled Goose Game style: flat color + single directional + SSAO */}
<directionalLight
  position={[5, 8, 3]}
  intensity={1.2}
  castShadow
  shadow-mapSize={[1024, 1024]}
/>
<ambientLight intensity={0.4} color="#d4e6f1" />

{/* Use react-postprocessing for SSAO */}
<EffectComposer>
  <SSAO radius={0.4} intensity={15} luminanceInfluence={0.6} />
</EffectComposer>
```

### A Short Hike

**The look:** Pixelated low-poly 3D with a warm autumn color palette and soft outlines.

**How they achieved it:**
- The entire scene renders to a low-resolution RenderTexture, then is scaled up to the display size
- Flat, unlit shading (no complex lighting -- colors are baked into the models)
- Soft outline effect on objects for readability at low resolution
- Color palette sampled from real-world photographs of the Canadian Shield in autumn
- The pixelation is a deliberate aesthetic choice, not a limitation -- it lets the player's imagination fill in detail

**What to steal:**
- Rendering at a lower resolution and upscaling is cheap and creates a strong aesthetic identity
- Sampling colors from real photographs produces more natural palettes than picking colors manually
- Unlit/basic materials with considered colors can look better than poorly-lit standard materials
- Outlines dramatically improve object readability, especially at a distance

**R3F implementation hints:**

```tsx
{/* Low-res render target for A Short Hike style */}
import { Pixelation } from "@react-three/postprocessing";

<EffectComposer>
  <Pixelation granularity={5} />
</EffectComposer>

{/* Outline effect from drei */}
import { Outline } from "@react-three/postprocessing";

<EffectComposer>
  <Outline
    blur
    edgeStrength={3}
    pulseSpeed={0}
    visibleEdgeColor="#2c1810"
    hiddenEdgeColor="#2c1810"
  />
</EffectComposer>
```

### Firewatch

**The look:** Rich color-graded environments with multi-colored distance fog and silhouetted layers.

**How they achieved it:**
- Custom fog system where fog color changes with distance -- near fog might be warm amber, mid-range fog is orange, distant fog is deep purple
- Dynamic color grading that shifts with time of day
- Distant mountains are flat silhouettes with minimal detail, rendered as simple shapes with a color ramp
- Art direction inspired by vintage National Park Service posters -- limited color palettes with strong value contrast
- Cel-shading + bold flat colors rather than realistic textures

**What to steal:**
- Colored fog is one of the highest-impact, lowest-cost atmospheric effects you can add
- Silhouettes at distance are more evocative than detailed geometry -- a simple mountain shape in a dark color says "mountain" better than a textured 3D model far away
- Limiting your palette to what a poster artist would use forces better color choices

**R3F implementation (simple colored fog):**

```tsx
{/* Basic distance fog -- gives depth to any interior */}
<fog attach="fog" args={["#1a1025", 10, 30]} />

{/* For more control, use a custom shader fog or post-processing */}
{/* This simple version still adds tremendous depth to a store interior */}
```

### Animal Crossing (Interior Design Lessons)

**The look:** Charming, cozy room interiors that feel lived-in despite being grid-based.

**How they achieved it:**
- Everything snaps to a tile grid, but the grid is hidden -- no visible grid lines
- Rooms feel full because of layered decoration: floor items, wall items, and table-top items on multiple vertical levels
- "Zones" created with rugs and furniture groupings (reading corner, TV area, etc.)
- Items are never pushed entirely against walls -- some furniture sits at angles or in the middle of the room
- Small decorative items on top of furniture (books on shelves, items on tables) add life without floor space

**What to steal:**
- **Do not push all furniture against the walls** -- it looks unnatural and wastes the center of the room
- **Create zones** with color, rugs, or furniture groupings rather than physical dividers
- **Stack vertically** -- items on shelves, items on counters, items on top of other items -- this fills space without consuming floor area
- **Know when to stop** -- negative space (intentionally empty areas) is critical for readability. Not every surface needs a prop
- **Vary item heights** -- all same-height objects create a monotonous horizon line

---

## 7. Neon Signs and Glow Effects

### Making Neon Signs Look Good Without Bloom

**What to do:** Use multiple layered techniques: an emissive material for the sign itself, a semi-transparent glow sprite behind it, and a matching point light for environmental illumination.

**Why it works:** True bloom post-processing is expensive and affects the entire scene. By faking the glow with a transparent sprite/plane, you get a targeted glow effect at minimal cost.

**R3F implementation:**

```tsx
function NeonSign({ text, color, position }: { text: string; color: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Layer 1: The actual text (bright, emissive) */}
      <Text
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={color}
      >
        {text}
        <meshBasicMaterial color={color} toneMapped={false} />
      </Text>

      {/* Layer 2: Glow halo (slightly larger, transparent, blurred) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[text.length * 0.4, 1.0]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </mesh>

      {/* Layer 3: Larger, even more transparent outer glow */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[text.length * 0.5, 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          toneMapped={false}
        />
      </mesh>

      {/* Layer 4: Point light to cast color on nearby surfaces */}
      <pointLight color={color} intensity={0.5} distance={5} decay={2} />
    </group>
  );
}
```

### Neon Without Bloom -- the `toneMapped={false}` Trick

**What to do:** Set `toneMapped={false}` on materials that should appear to "glow." This lets color values exceed the normal 0-1 range and appear unnaturally bright without any post-processing.

**Why it works:** Three.js tone mapping compresses bright values to fit the display range. Disabling it for specific materials lets them appear brighter than the rest of the scene, creating a natural contrast that reads as "glowing."

```tsx
{/* This appears to glow relative to the tone-mapped rest of the scene */}
<meshBasicMaterial color="#ff1493" toneMapped={false} />
```

### Selective Bloom (When You Can Afford It)

If performance allows, selective bloom is the gold standard for neon. Only objects with emissive intensity above a threshold glow.

```tsx
import { EffectComposer, Bloom } from "@react-three/postprocessing";

{/* In your Canvas: */}
<EffectComposer>
  <Bloom
    luminanceThreshold={1}  {/* Only things brighter than 1 glow */}
    luminanceSmoothing={0.9}
    intensity={0.5}
    mipmapBlur
  />
</EffectComposer>

{/* On the neon sign material -- note color channels > 1 */}
<meshBasicMaterial color={[2, 0.2, 1.5]} toneMapped={false} />

{/* Regular objects stay under threshold and are unaffected */}
<meshToonMaterial color="#6b4226" />
```

---

## 8. Post-Processing in R3F

### Essential Effects for a Stylized Store

```tsx
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SSAO,
} from "@react-three/postprocessing";

<EffectComposer multisampling={4}>
  {/* SSAO: soft contact shadows, makes objects feel grounded */}
  <SSAO
    radius={0.3}
    intensity={20}
    luminanceInfluence={0.5}
  />

  {/* Bloom: makes neon signs glow */}
  <Bloom
    luminanceThreshold={1}
    luminanceSmoothing={0.9}
    intensity={0.4}
    mipmapBlur
  />

  {/* Vignette: darkens edges, focuses attention on center */}
  <Vignette eskil={false} offset={0.2} darkness={0.6} />

  {/* Chromatic Aberration: subtle VHS/retro feel */}
  <ChromaticAberration
    offset={[0.0005, 0.0005]}
    radialModulation={false}
    modulationOffset={0}
  />
</EffectComposer>
```

### Performance Budget

- **SSAO** is the most expensive effect (~2-4ms per frame). Lower `radius` and increase `ringCount` if needed. Consider skipping on mobile.
- **Bloom** with `mipmapBlur` is relatively cheap. The `luminanceThreshold` of 1.0 means it does very little work most of the time.
- **Vignette** is nearly free (a single full-screen quad).
- **ChromaticAberration** is cheap but creates a noticeable retro feel.
- Set `multisampling={0}` on EffectComposer to disable anti-aliasing for performance (or keep at 4-8 for quality).

---

## 9. 90s Retail Color Palettes

### Blockbuster Video Inspired

The actual Blockbuster stores had a specific feel: blue and yellow branding, commercial gray carpet, fluorescent overhead lighting, bright genre section signs, and walls of colorful movie box art providing most of the visual interest.

**Full Palette:**

```
BRAND COLORS
  Blockbuster Blue:      #004e98
  Blockbuster Yellow:    #ffd700
  Ticket Stub Gold:      #daa520

ENVIRONMENTAL
  Fluorescent White:     #f5f0e8  (slightly warm white)
  Ceiling Tile:          #d4d0c8
  Commercial Carpet:     #5a4e42  (warm gray-brown)
  Tile Floor:            #8c857b  (lighter gray)
  Wall Paint:            #e8e0d4  (off-white)
  Wall Shadow:           #c4baa8  (darker where shelves cast shadows)

FIXTURES
  Metal Shelving:        #7a7a7a  (neutral gray)
  Wood Laminate:         #8b6914  (cheap 90s wood look)
  Counter Laminate:      #5c4033
  Baseboard:             #3d3d3d
  Plastic Dividers:      #b0b0b0

SIGNAGE & NEON
  Hot Neon Pink:         #ff1493
  Electric Blue Neon:    #00d4ff
  Neon Green (OPEN):     #39ff14
  Red Sale Sign:         #ff2222
  Genre Header BG:       #1a1a3a  (dark navy)

GENRE SECTIONS (sign backgrounds / shelf accent strips)
  Action:                #cc3300
  Comedy:                #ff9900
  Horror:                #330033
  Drama:                 #003366
  Romance:               #cc6699
  Sci-Fi:                #006699
  Kids/Family:           #ffcc00
  New Releases:          #990066
  Classics:              #666633

90s NOSTALGIA ACCENTS
  VHS Tape Black:        #1a1a1a
  VHS Label White:       #f0ece4
  Popcorn Yellow:        #fff176
  Candy Red:             #e53935
  Receipt Paper:         #f5f0e0
```

### Vaporwave / Mallwave Extension

If you want to push the aesthetic more toward stylized 90s nostalgia (less realistic, more vibes):

```
Mallwave Pink:         #ff9ecd
Mallwave Purple:       #b967ff
Mallwave Cyan:         #01cdfe
Mallwave Green:        #05ffa1
Deep Mall Navy:        #1b1b3a
Sunset Orange:         #ff6b35
VHS Glitch Magenta:    #ff7ac7
```

---

## Quick-Reference Cheat Sheet

### Before Building a New Area, Check:

1. **Scale:** Is everything measured against the 1.8m human reference?
2. **Lighting:** Do I have at least ambient + one point/directional? No ambient-only.
3. **Colors:** Are my colors desaturated 30-50%? No pure `#ff0000`.
4. **Weenie:** Is there a focal landmark visible from the entrance?
5. **Z-fighting:** Are overlapping surfaces offset by at least 0.005?
6. **Density:** Can I see 5 distinct visual elements from any viewpoint?
7. **Depth:** Is the foreground warmer and the background cooler?
8. **Imperfection:** Are objects slightly varied in rotation/position?
9. **Trim:** Do objects have edge detail (molding, caps, lips)?
10. **Value range:** Does a grayscale screenshot still have contrast?

### The Minimum Viable Store Lighting Setup

```tsx
<ambientLight intensity={0.2} color="#ffe4c4" />
<hemisphereLight skyColor="#fff5e6" groundColor="#4a6b8a" intensity={0.35} />
<pointLight position={[0, 3.5, 0]} intensity={1.0} color="#fff0e0" distance={15} />
<pointLight position={[-3, 3, 5]} color="#ffb347" intensity={0.5} distance={8} />
<pointLight position={[3, 3, -6]} color="#7eb8da" intensity={0.4} distance={8} />
<fog attach="fog" args={["#1a1025", 12, 28]} />
```

### Material Decision Tree

```
Is it a neon sign or screen?
  YES -> meshBasicMaterial with toneMapped={false}
  NO  -> continue

Is this mobile?
  YES -> meshBasicMaterial (with emissive color if needed)
  NO  -> continue

Does it need to look realistic (metal, glass)?
  YES -> meshStandardMaterial
  NO  -> meshToonMaterial with 3-4 step gradient
```
