"use client";

import React from "react";
import { Mat } from "./store-materials";
import { getPreset, type MaterialPreset } from "@/lib/material-presets";

/**
 * Drop-in material using named presets from material-presets.ts.
 * Usage: <PresetMat preset="brick" />
 * Override any preset value with extra props: <PresetMat preset="brick" color="#ff0000" />
 */
export function PresetMat({
  preset,
  ...overrides
}: { preset: MaterialPreset } & Record<string, unknown>) {
  const base = getPreset(preset);
  return <Mat {...base} {...overrides} />;
}
