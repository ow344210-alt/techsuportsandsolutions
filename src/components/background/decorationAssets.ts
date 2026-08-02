// Static import map for every decoration asset in src/assets/decorations.
// All on-disk files are imported explicitly (no eager glob, no global preload
// beyond what presets actually render). Exact on-disk filenames are used;
// nothing is renamed.
import type { DecorationAssetName } from "./decorationTypes";
import abstractLines from "../../assets/decorations/abstract-lines.png";
import abstractTechCluster from "../../assets/decorations/abstract-tech-cluster.png";
import auroraBottomRight from "../../assets/decorations/aurora-bottom-right.png";
import auroraTopLeft from "../../assets/decorations/aurora-top-left.png";
import blueCyanBloom from "../../assets/decorations/blue-cyan-bloom.png";
import circuitPattern from "../../assets/decorations/circuit-pattern.png";
import curvedLightWave from "../../assets/decorations/curved-light-wave.png";
import dataStreamLines from "../../assets/decorations/data-stream-lines.png";
import diagonalLightStreaks from "../../assets/decorations/diagonal-light-streaks.png";
import dottedGrid from "../../assets/decorations/dotted-grid.png";
import floatingShapes from "../../assets/decorations/floating-shapes.png";
import glassOrbLarge from "../../assets/decorations/glass-orb-large.png";
import glassOrbSmall from "../../assets/decorations/glass-orb-small.png";
import glowCircle from "../../assets/decorations/glow-circle.png";
import gradientOrb from "../../assets/decorations/gradient-orb.png";
import gradientRing from "../../assets/decorations/gradient-ring.png";
import gradientRingAccent from "../../assets/decorations/gradient-ring (2).png";
import magentaEdgeGlow from "../../assets/decorations/magenta-edge-glow.png";
import meshBackground from "../../assets/decorations/mesh-background.png";
import meshGradient from "../../assets/decorations/mesh-gradient.png";
import neonGrid from "../../assets/decorations/neon-grid.png";
import noiseTexture from "../../assets/decorations/noise-texture.png";
import perspectiveGrid from "../../assets/decorations/perspective-grid.png";
import purpleGlow from "../../assets/decorations/purple-glow.png";
import radialPurpleBloom from "../../assets/decorations/radial-purple-bloom.png";
import sectionDividerWave from "../../assets/decorations/section-divider-wave.png";
import softVignette from "../../assets/decorations/soft-vignette.png";

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
