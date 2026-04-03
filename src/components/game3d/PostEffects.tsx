"use client";

import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, Scanline, N8AO, Pixelation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

const CHROMA_OFFSET = new Vector2(0.0006, 0.0006);

export function PostEffects({ mobile = false, retroMode = false }: { mobile?: boolean; retroMode?: boolean }) {
  // Lighter effects on mobile for performance
  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.2}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette darkness={0.45} offset={0.3} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <N8AO
        aoRadius={0.5}
        distanceFalloff={0.5}
        intensity={1.5}
        quality="low"
        halfRes
      />
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <Vignette darkness={0.5} offset={0.25} />
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.03}
      />
      <ChromaticAberration
        offset={CHROMA_OFFSET}
        radialModulation={false}
        modulationOffset={0}
      />
      <Scanline
        blendFunction={BlendFunction.OVERLAY}
        density={1.25}
        opacity={0.06}
      />
      {retroMode ? <Pixelation granularity={3} /> : <></>}
    </EffectComposer>
  );
}
