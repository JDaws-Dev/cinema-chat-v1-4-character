/**
 * Material Presets — named material configurations for consistent look across the project.
 *
 * New components should use `<PresetMat preset="brick" />` or `getPreset("brick")`
 * instead of hardcoding color/roughness values.
 */

export const MATERIALS = {
  // Building exteriors
  brick: { color: '#A0826A', roughness: 0.85 },
  concrete: { color: '#9a9080', roughness: 0.9 },
  stucco: { color: '#D4C4AA', roughness: 0.95 },

  // Interior surfaces
  drywall: { color: '#F5E6CC', roughness: 0.95 },
  hardwood: { color: '#8B6914', roughness: 0.7 },
  linoleum: { color: '#4a5a4a', roughness: 0.6 },
  carpet: { color: '#3a3a3a', roughness: 0.95 },

  // Furniture
  woodDark: { color: '#6B4226', roughness: 0.7 },
  woodLight: { color: '#B8956A', roughness: 0.65 },
  fabric: { color: '#8B6B4A', roughness: 0.9 },
  leather: { color: '#5C3A1E', roughness: 0.5 },

  // Metal
  steel: { color: '#888888', roughness: 0.3, metalness: 0.7 },
  aluminum: { color: '#556677', roughness: 0.3, metalness: 0.6 },
  chrome: { color: '#cccccc', roughness: 0.1, metalness: 0.9 },

  // Blockbuster brand
  blockbusterBlue: { color: '#1a3a6a', roughness: 0.85 },
  blockbusterGold: { color: '#ffd700', roughness: 0.4 },

  // Glass
  glass: { color: '#a0c0e0', transparent: true, opacity: 0.18, roughness: 0.02, metalness: 0.4 },

  // Signage
  neon: { color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 0.3 },
} as const;

export type MaterialPreset = keyof typeof MATERIALS;

export function getPreset(name: MaterialPreset) {
  return MATERIALS[name];
}
