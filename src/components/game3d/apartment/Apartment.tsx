"use client";

import React from "react";
import { ApartmentInterior, APT_X, APT_Y, APT_Z } from "./ApartmentInterior";
import { ApartmentFurniture } from "./ApartmentFurniture";
import { BuildingExterior } from "./BuildingExterior";

/**
 * Main Apartment component — thin wrapper composing:
 *   - ApartmentInterior (walls, floor, ceiling, window, door, interior lighting)
 *   - ApartmentFurniture (TV, couch, coffee table, kitchen, trophy shelf, decor)
 *   - BuildingExterior (facade, roof, stairs, porch light)
 */
export function Apartment() {
  return (
    <group position={[APT_X, APT_Y, APT_Z]}>
      {/* Building exterior (facade, roof, stairs, porch light) */}
      <BuildingExterior />

      {/* Interior structure + lighting */}
      <ApartmentInterior />

      {/* Furniture + decor */}
      <ApartmentFurniture />
    </group>
  );
}
