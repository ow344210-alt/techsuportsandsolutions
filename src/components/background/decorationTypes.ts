// Shared types for the reusable premium background decoration system.
// All decorative layers are purely presentational: they never affect layout,
// document flow, or accessibility, and they always render behind real content.

export type DecorationDensity = "none" | "subtle" | "normal" | "rich";

export type DecorationMotion = "none" | "float" | "drift" | "pulse";

// The complete set of decoration files in src/assets/decorations. Only the
// files actually referenced by presets are imported; names kept in the union
// but missing from the import map simply resolve to nothing (graceful fallback).
export type DecorationAssetName =
  | "abstract-lines"
  | "abstract-tech-cluster"
  | "aurora-bottom-right"
  | "aurora-top-left"
  | "blue-cyan-bloom"
  | "circuit-pattern"
  | "curved-light-wave"
  | "data-stream-lines"
  | "diagonal-light-streaks"
  | "dotted-grid"
  | "floating-shapes"
  | "glass-orb-large"
  | "glass-orb-small"
  | "glow-circle"
  | "gradient-orb"
  | "gradient-ring"
  | "gradient-ring-accent"
  | "magenta-edge-glow"
  | "mesh-background"
  | "mesh-gradient"
  | "neon-grid"
  | "noise-texture"
  | "perspective-grid"
  | "purple-glow"
  | "radial-purple-bloom"
  | "section-divider-wave"
  | "soft-vignette";

export type DecorationPreset =
  | "hero"
  | "heroMinimal"
  | "splitLeft"
  | "splitRight"
  | "cards"
  | "grid"
  | "timeline"
  | "process"
  | "faq"
  | "team"
  | "story"
  | "trust"
  | "cta"
  | "footer"
  | "minimal"
  | "none";

export type DecorationMobileBehavior = "keep" | "hide" | "subtle";

export interface DecorationLayer {
  /** Which asset to render for this layer. */
  asset: DecorationAssetName;
  /** Positioning + sizing classes (e.g. "absolute -left-20 top-0 w-96"). */
  className: string;
  /** Opacity 0..1. Defaults are enforced per layer in the presets file. */
  opacity?: number;
  /** Motion animation. Falls back to the parent BackgroundDecorations motion. */
  motion?: DecorationMotion;
  /** How the layer behaves on small screens. */
  mobile?: DecorationMobileBehavior;
  /** Load eagerly (hero layers). Defaults to lazy. */
  eager?: boolean;
}
