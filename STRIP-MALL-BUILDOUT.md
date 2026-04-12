# Strip Mall Full Architectural Buildout

## Real-World Reference: 1990s Small Strip Mall

A typical 3-tenant strip mall with a 2nd-floor apartment. Based on real building codes and common US strip mall construction.

## Overall Site Plan (Top-Down)

```
                    BACK ALLEY (5m wide, one-way)
     ┌─────────────────────────────────────────────────────┐
     │ DUMPSTER │    SERVICE DOORS    │ DUMPSTER │ UTILITY │
     │          │                     │          │  METERS │
     ├──────────┼─────────────────────┼──────────┼─────────┤
     │          │                     │          │         │
     │ PIZZA    │   FRIDAY NIGHT      │ LAUNDRO- │  STAIR  │
     │ PALACE   │   VIDEO             │   MAT    │  WELL   │
     │          │                     │          │         │
     │ Kitchen  │   Employee Area     │ Utility  │         │
     │ + Bath   │   + Bath + Storage  │  + Bath  │         │
     │          │                     │          │         │
     │ Dining   │   Store Floor       │ Customer │         │
     │ Area     │                     │  Area    │         │
     │          │                     │          │         │
     ├──────────┴─────────────────────┴──────────┴─────────┤
     │              SIDEWALK (1.5m wide)                    │
     ├──────────────────────────────────────────────────────┤
     │              PARKING LOT (14m deep)                  │
     │    [car] [car] [car] [car] [car] [car] [car]         │
     ├──────────────────────────────────────────────────────┤
     │              STREET (6m wide, 2 lanes)               │
     └──────────────────────────────────────────────────────┘
```

## Dimensions (meters, matching existing game scale)

### Overall Building
- **Total width**: 36m (existing: Pizza 6m + Video Store 20m + Laundromat 6m + Stairs 1.5m + walls)
- **Total depth**: 14m (existing ROOM_D)
- **Commercial ceiling**: 3.5m (existing ROOM_H)
- **Wall thickness**: 0.2m interior, 0.3m exterior (existing)

### Video Store (center tenant) — EXISTING, no changes
- Width: 20m (x: -10 to +10)
- Depth: 14m (z: -7 to +7)
- **ADD: Employee room** behind back wall (z: -7 to -9, 2m deep)
  - Contains: desk, small bathroom (1.5m x 1.5m), storage shelves, safe
  - Access: employee door on left wall (already exists at z=-5.19)
- **ADD: Bathroom** customer accessible (near returns counter)
  - 2m x 1.5m, single stall + sink
  - Access: door near counter area

### Pizza Palace (left tenant)
- Width: 6m (x: -16 to -10)
- Depth: 8m from storefront (z: -0.2 to +7)
- **EXISTING: Dining area** (front, customer-facing)
- **ADD: Kitchen** (back 3m, z: -0.2 to +2.8)
  - Counter/prep area, pizza oven, fridge
  - Staff bathroom (1.2m x 1.2m)
  - Back door to alley (for deliveries)
- **ADD: Pass-through window** between kitchen and dining

### Laundromat (right tenant)
- Width: 6m (x: +10 to +16)
- Depth: 8m from storefront (z: 0.25 to +7.75)
- **EXISTING: Customer area** (washers, dryers, folding tables)
- **ADD: Utility room** (back 2m, z: 0.25 to +2.25)
  - Water heater, supply storage, cleaning supplies
  - Staff bathroom (1.2m x 1.2m)
  - Back door to alley

### Apartment (2nd floor above laundromat) — EXISTING, minor fixes
- 6m x 5m at y=3.7
- **EXISTING: Living room, kitchen, bedroom area**
- **FIX: Bathroom** needs proper enclosure (currently open)
- **FIX: Kitchen** counter/cabinets need definition

### Back Alley
- **NEW: Full-width service road** behind all three stores
- Width: 5m (enough for delivery truck)
- z: -7 to -12 (behind building)
- Contains:
  - Dumpsters (one near pizza, one near laundromat)
  - Loading area
  - Utility meters (electric, gas, water)
  - Back doors for each tenant
  - Security light
  - Chain link fence at ends

### Exterior Stairs — EXISTING, needs fixes
- Right side of building (x: 16.2 to 17.6)
- 20 steps, ground to apartment level
- Landing at top with door 2A
- **FIX: All wall connections must be solid**

## Build Order

1. **Back alley ground plane + back walls** (close the back of all three stores)
2. **Service doors** on back wall (one per tenant)
3. **Video Store employee room** behind back wall
4. **Pizza kitchen** behind dining area
5. **Laundromat utility room** behind customer area
6. **Customer bathroom** in video store
7. **Back alley details** (dumpsters, utility meters, security light)
8. **Verify all connections** with geometry-check.mjs + visual-qa.mjs

## Key Architecture Rules
- Every room has 4 walls, a floor, and a ceiling — NO gaps
- Doors connect rooms — every door has a frame, handle, and connects TWO spaces
- Back alley is fully enclosed by building back wall + fencing at sides
- All exterior walls are 0.3m thick, interior walls 0.2m
- Every tenant space has a bathroom (building code)
- Every tenant has back door access to service alley (fire code)
