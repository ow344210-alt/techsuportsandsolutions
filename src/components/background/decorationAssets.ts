// Static import map for every decoration asset in src/assets/decorations.
// All on-disk files are imported explicitly (no eager glob, no global preload
// beyond what presets actually render). Exact on-disk filenames are used;
// nothing is renamed.
import type { DecorationAssetName } from "./decorationTypes";
import abstractLines from "../../assets/decorations/abstract-lines.webp";
import abstractTechCluster from "../../assets/decorations/abstract-tech-cluster.webp";
import auroraBottomRight from "../../assets/decorations/aurora-bottom-right.webp";
import auroraTopLeft from "../../assets/decorations/aurora-top-left.webp";
import blueCyanBloom from "../../assets/decorations/blue-cyan-bloom.webp";
import circuitPattern from "../../assets/decorations/circuit-pattern.webp";
import curvedLightWave from "../../assets/decorations/curved-light-wave.webp";
import dataStreamLines from "../../assets/decorations/data-stream-lines.webp";
import diagonalLightStreaks from "../../assets/decorations/diagonal-light-streaks.webp";
import dottedGrid from "../../assets/decorations/dotted-grid.webp";
import floatingShapes from "../../assets/decorations/floating-shapes.webp";
import glassOrbLarge from "../../assets/decorations/glass-orb-large.webp";
import glassOrbSmall from "../../assets/decorations/glass-orb-small.webp";
import glowCircle from "../../assets/decorations/glow-circle.webp";
import gradientOrb from "../../assets/decorations/gradient-orb.webp";
import gradientRing from "../../assets/decorations/gradient-ring.webp";
import gradientRingAccent from "../../assets/decorations/gradient-ring (2).webp";
import magentaEdgeGlow from "../../assets/decorations/magenta-edge-glow.webp";
import meshBackground from "../../assets/decorations/mesh-background.webp";
import meshGradient from "../../assets/decorations/mesh-gradient.webp";
import neonGrid from "../../assets/decorations/neon-grid.webp";
import noiseTexture from "../../assets/decorations/noise-texture.webp";
import perspectiveGrid from "../../assets/decorations/perspective-grid.webp";
import purpleGlow from "../../assets/decorations/purple-glow.webp";
import radialPurpleBloom from "../../assets/decorations/radial-purple-bloom.webp";
import sectionDividerWave from "../../assets/decorations/section-divider-wave.webp";
import softVignette from "../../assets/decorations/soft-vignette.webp";

const ASSETS: Partial<Record<DecorationAssetName, string>> = {
  "abstract-lines": abstractLines,
  "abstract-tech-cluster": abstractTechCluster,
  "aurora-bottom-right": auroraBottomRight,
  "aurora-top-left": auroraTopLeft,
  "blue-cyan-bloom": blueCyanBloom,
  "circuit-pattern": circuitPattern,
  "curved-light-wave": curvedLightWave,
  "data-stream-lines": dataStreamLines,
  "diagonal-light-streaks": diagonalLightStreaks,
  "dotted-grid": dottedGrid,
  "floating-shapes": floatingShapes,
  "glass-orb-large": glassOrbLarge,
  "glass-orb-small": glassOrbSmall,
  "glow-circle": glowCircle,
  "gradient-orb": gradientOrb,
  "gradient-ring": gradientRing,
  "gradient-ring-accent": gradientRingAccent,
  "magenta-edge-glow": magentaEdgeGlow,
  "mesh-background": meshBackground,
  "mesh-gradient": meshGradient,
  "neon-grid": neonGrid,
  "noise-texture": noiseTexture,
  "perspective-grid": perspectiveGrid,
  "purple-glow": purpleGlow,
  "radial-purple-bloom": radialPurpleBloom,
  "section-divider-wave": sectionDividerWave,
  "soft-vignette": softVignette,
};

/** Resolve a decoration asset URL. Returns undefined when the named file is
 *  not part of the preset asset map, so layers degrade gracefully. */
export function resolveDecorationAsset(name: DecorationAssetName): string | undefined {
  return ASSETS[name];
}
