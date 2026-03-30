# o3 Visual Review — Friday Night Video (2026-03-29)

> 10 security camera screenshots evaluated by OpenAI o3 with vision.
> Overall score: **6/10**

## Pass 1: 55 Bug Report (Camera-by-Camera)

### CAM: overhead
- Thick yellow bounding box and grid lines visible (debug left on)
- Ceiling perimeter open to black void
- Movie posters projected on floor in front-right corner (UV issue)
- Center aisles shifted left, not symmetrical to entrance mat
- Yellow dashed aisle lines float above carpet (shadow gap visible)
- Back wall sign hovers off the wall
- Ceiling lights are flat emissive quads, no fixture depth
- Blue rental box overlaps wall trim in upper-left

### CAM: entrance
- Push bar clips through vertical mullion
- Glass doors 3cm thick but mullions 20cm wide (proportion off)
- Floor mat text flipped/backwards to entering customers
- NPC arm penetrates returns counter by ~15cm
- Beyond glass is pure black (no parking lot visible)
- Door canopy underside is pitch black (no bounce light)

### CAM: back_wall
- Yellow category banner Z-fights with ceiling grid
- Category order on banner inconsistent with shelf labels below
- Kid NPC feet hover ~3cm above carpet
- Ceiling grid tiles jump half a tile at center seam
- Specials monitor brighter than ceiling but casts zero light

### CAM: left_wall
- Giant black rectangle center-frame (missing ceiling geometry)
- Shelf top edges clip into black ceiling chunk
- NPC shoe disappears through floor ~5cm
- Horror poster has front face only (invisible from side)
- Fluorescent fixture gap (10cm) between segments
- Shelf wood grain tiled every 64px (too obviously repeating)

### CAM: right_wall
- First ceiling tube rotated 12 degrees off parallel
- Cyan cube in center aisle (dev marker left in)
- Outside of storefront glass shows nothing
- Yellow dashed lines look like road paint not carpet
- Rightmost gondola lighter wood tint than others

### CAM: counter
- Cash register is just two cubes
- "RETURNS" text hovers off mesh and flickers
- Vinny head pokes through transparent panel
- Neon OPEN backwards from customer side
- Star Wars poster too dark (emissive at 0)
- Coffee mug sinks into counter top

### CAM: ceiling_front
- 20cm gap at top lets you see through to black void
- Banner cord passes through category sign (no hook attachment)
- Shelf top intersects bottom of banner by 3cm
- Kid NPC head same size as adult (broken scale)
- One poster twice emissive intensity of neighbors

### CAM: ceiling_back
- Camera collision with grey rod
- Banner slices through rod instead of attaching
- Two light quads stacked causing flicker
- Zero ambient occlusion under shelf tops
- Purple NPC still floating above carpet

### CAM: exterior
- Facade sign is zero-thickness plane (pops when moving)
- White lines around glass doors (un-welded verts)
- Parking lot sign spawns through sidewalk mesh
- Neon glow spills through wall edges
- Counter visible poking through window plane from outside
- Glass is pure black (no reflection, no Fresnel)

### CAM: side_elev
- Giant black cube center-frame (missing texture proxy)
- Red outline debug rectangle visible
- Rightmost shelf untextured (solid brown)
- Yellow ceiling stripe 25cm tall (should be <5cm)
- Three floating posters, no shadows
- Fluorescent fixtures not centered on grid
- Yellow dashes stop abruptly
- No depth fog (inconsistent with other views)

---

## Pass 2: Nostalgia Authenticity — 6/10

### What's RIGHT (keep):
- Long low gondola shelves with face-out boxes
- Dark carpet and drop ceiling with fluorescent troffers
- Yellow-on-blue category placards
- "Be Kind, Rewind" sign
- Front counter with Returns slot and neon OPEN
- Glass double doors and exterior channel-letter sign

### What BREAKS the illusion:
- Modern movie art (Avatar, Avengers) — need pre-1992 films only
- Floor "road stripes" — never existed in real stores
- Store too small (real Blockbuster ~5000 sqft with 10-12 gondolas)
- No snack wall, no game section, no Coming Attractions TV
- Counter has no CRT, receipt printer, or empty VHS case stack
- Too dim — Blockbusters were brightly lit, almost sterile
- No cardboard standees, hanging mobiles, or Disney clamshells

---

## Pass 3: Proportion & Scale (NPC = 1.7m)

| Element | Current | Should Be | Verdict |
|---------|---------|-----------|---------|
| Shelf height | ~1.4-1.5m | ~1.5m | OK |
| Counter height | ~1.3-1.4m | ~1.0m | TOO TALL |
| Door | ~2m × 2.3m | OK | OK |
| Aisle width | ~1.2m | ~1.6-1.8m | TOO NARROW |
| Ceiling | ~2.5m total | ~3.0m | TOO LOW |
| Sign text | ~80mm | ~125mm | TOO SMALL |
| Wall posters | ~0.6×0.9m | 0.69×1.02m | SLIGHTLY SMALL |

---

## Pass 4: 20 Missing Items Every 90s Store Had

1. TV/VCR combo near ceiling looping trailers
2. Nintendo 64 / PlayStation demo kiosk
3. Wire rack of microwave popcorn, Red Vines, Milk Duds
4. Glass-front cooler with Pepsi/Coke
5. After-hours exterior drop box
6. Cardboard standee for week's hot release
7. Disney clamshell wall in Family section
8. "Guaranteed In Stock" vinyl banner
9. Staff picks with handwritten recommendation cards
10. Blank VHS tapes and head-cleaner rack
11. Laminated A-Z dividers on every shelf row
12. Multiple checkout CRT monitors + barcode scanners + receipt printers
13. Membership forms and plastic cards
14. Gift-card spinner or pizza partner coupons
15. Plastic shopping baskets with logo
16. Security pedestals (EAS) flanking doors
17. Quarter candy / gumball machine by exit
18. Convex security mirrors in ceiling corners
19. End-cap pegboard with VCR rewinders for sale
20. Wall calendar poster of "Coming Attractions" by month

---

## Pass 5: Top 15 Fixes by Impact/Effort

| # | Fix | Effort | Why |
|---|-----|--------|-----|
| 1 | Fill ceiling void (black hole) | MEDIUM | First thing players see looking up |
| 2 | Brighten side walls | EASY | Shelves/posters invisible |
| 3 | Remove debug placeholder on right wall | EASY | Red outline screams "bug" |
| 4 | Lower aisle signs below ceiling | EASY | Clipping geometry |
| 5 | Fix NPC feet (-0.05m) | EASY | Floating people = ghosts |
| 6 | Fix OPEN neon double-sided | EASY | Reads "NEPO" from inside |
| 7 | Fix rug text orientation | EASY | First text is backwards |
| 8 | Fix door handle alignment | EASY | Handles float in air |
| 9 | Center aisle dash lines | EASY | Crooked = "something's wrong" feeling |
| 10 | Make genre signs readable | EASY | Black on navy = invisible |
| 11 | Replace colored blocks on New Releases | MEDIUM | Lego-looking temp art |
| 12 | Add CRT monitor to counter | MEDIUM | Cashier types on air |
| 13 | Center RETURNS label | EASY | Sloppy alignment |
| 14 | Light the exterior/parking lot | EASY | Windows = black void |
| 15 | Standardize ceiling light lengths | EASY | Random sizes draw eye up |
