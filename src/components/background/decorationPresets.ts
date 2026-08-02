// Preset definitions: each maps a named scene to an ordered list of layers.
// Layer count per preset is capped at 3 ("rich" is only for heroes/final CTAs).
// Opacity follows the spec ranges: aurora/bloom 8-20%, mesh 8-22%,
// grid/circuit/dotted 3-8%, lines/waves/streams 4-10%, orbs/rings/shapes
// 10-24%, noise 2-4%, vignette 6-14%.
import type { DecorationDensity, DecorationLayer, DecorationPreset } from "./decorationTypes";

export const DECORATION_PRESETS: Record<DecorationPreset, DecorationLayer[]> = {
  hero: [
    {
      asset: "aurora-top-left",
      className: "absolute -left-24 -top-16 w-[28rem] max-w-none",
      opacity: 0.16,
      mobile: "subtle",
      eager: true,
    },
    {
      asset: "blue-cyan-bloom",
      className: "absolute -bottom-32 -right-24 w-[36rem] max-w-none",
      opacity: 0.14,
      mobile: "subtle",
    },
    {
      asset: "perspective-grid",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.05,
    },
    {
      asset: "glass-orb-large",
      className: "absolute -right-10 bottom-10 w-80 max-w-none",
      opacity: 0.18,
      motion: "drift",
      mobile: "hide",
    },
  ],

  heroMinimal: [
    {
      asset: "radial-purple-bloom",
      className: "absolute -top-32 left-1/2 w-[42rem] max-w-none -translate-x-1/2",
      opacity: 0.14,
      eager: true,
    },
    {
      asset: "dotted-grid",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.04,
    },
  ],

  splitLeft: [
    {
      asset: "aurora-top-left",
      className: "absolute -left-24 -top-16 w-96 max-w-none",
      opacity: 0.15,
      mobile: "subtle",
    },
    {
      asset: "abstract-lines",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.08,
    },
    {
      asset: "glass-orb-small",
      className: "absolute -right-10 top-16 w-56 max-w-none",
      opacity: 0.16,
      motion: "drift",
      mobile: "hide",
    },
  ],

  splitRight: [
    {
      asset: "aurora-bottom-right",
      className: "absolute -bottom-20 -right-24 w-[30rem] max-w-none",
      opacity: 0.15,
      mobile: "subtle",
    },
    {
      asset: "curved-light-wave",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.07,
    },
  ],

  cards: [
    {
      asset: "dotted-grid",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.05,
    },
    {
      asset: "radial-purple-bloom",
      className: "absolute -right-32 -top-40 w-[34rem] max-w-none",
      opacity: 0.13,
      mobile: "subtle",
    },
    {
      asset: "glow-circle",
      className: "absolute -left-24 top-1/3 w-64 max-w-none",
      opacity: 0.12,
      motion: "float",
      mobile: "hide",
    },
  ],

  grid: [
    {
      asset: "neon-grid",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.05,
    },
    {
      asset: "circuit-pattern",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.06,
    },
    {
      asset: "gradient-orb",
      className: "absolute -left-20 bottom-1/3 w-64 max-w-none",
      opacity: 0.12,
      motion: "drift",
      mobile: "hide",
    },
  ],

  timeline: [
    {
      asset: "section-divider-wave",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.08,
    },
    {
      asset: "gradient-ring",
      className: "absolute -right-16 top-10 w-72 max-w-none",
      opacity: 0.12,
      motion: "drift",
      mobile: "hide",
    },
  ],

  process: [
    {
      asset: "diagonal-light-streaks",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.06,
    },
    {
      asset: "abstract-tech-cluster",
      className: "absolute -right-32 -bottom-40 w-[30rem] max-w-none",
      opacity: 0.1,
      mobile: "hide",
    },
  ],

  faq: [
    {
      asset: "blue-cyan-bloom",
      className: "absolute -left-24 -top-32 w-[32rem] max-w-none",
      opacity: 0.12,
      mobile: "subtle",
    },
    {
      asset: "curved-light-wave",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.07,
    },
    {
      asset: "magenta-edge-glow",
      className: "absolute -bottom-24 -right-24 w-[28rem] max-w-none",
      opacity: 0.12,
      mobile: "subtle",
    },
  ],

  team: [
    {
      asset: "dotted-grid",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.04,
    },
    {
      asset: "floating-shapes",
      className: "absolute -right-10 top-16 w-72 max-w-none",
      opacity: 0.14,
      motion: "float",
      mobile: "hide",
    },
    {
      asset: "purple-glow",
      className: "absolute -left-24 top-1/2 w-80 max-w-none",
      opacity: 0.13,
      mobile: "subtle",
    },
  ],

  story: [
    {
      asset: "data-stream-lines",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.06,
    },
    {
      asset: "aurora-bottom-right",
      className: "absolute -bottom-20 -right-24 w-[28rem] max-w-none",
      opacity: 0.14,
      mobile: "subtle",
    },
  ],

  trust: [
    {
      asset: "circuit-pattern",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.06,
    },
    {
      asset: "radial-purple-bloom",
      className: "absolute -bottom-40 -left-32 w-[34rem] max-w-none",
      opacity: 0.13,
      mobile: "subtle",
    },
  ],

  cta: [
    {
      asset: "mesh-gradient",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.14,
    },
    {
      asset: "radial-purple-bloom",
      className: "absolute -right-24 -top-32 w-[32rem] max-w-none",
      opacity: 0.13,
      mobile: "subtle",
    },
    {
      asset: "gradient-ring-accent",
      className: "absolute -bottom-24 -right-16 w-[26rem] max-w-none",
      opacity: 0.18,
      motion: "drift",
      mobile: "hide",
    },
  ],

  footer: [
    {
      asset: "mesh-background",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.08,
    },
    {
      asset: "noise-texture",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.03,
    },
    {
      asset: "soft-vignette",
      className: "absolute inset-0 h-full w-full object-cover",
      opacity: 0.1,
    },
  ],

  minimal: [
    {
      asset: "radial-purple-bloom",
      className: "absolute -top-32 left-1/2 w-[40rem] max-w-none -translate-x-1/2",
      opacity: 0.12,
    },
  ],

  none: [],
};

const MAX_LAYERS = 3;
const MAX_LAYERS_RICH = 4;

/** Resolve the layer list for a preset + density combination. */
export function getPresetLayers(preset: DecorationPreset, density: DecorationDensity): DecorationLayer[] {
  if (density === "none") return [];
  const layers = DECORATION_PRESETS[preset];
  if (density === "subtle") {
    const first = layers[0];
    if (!first) return [];
    return [{ ...first, opacity: (first.opacity ?? 1) * 0.6 }];
  }
  // "rich" is reserved for heroes and final CTAs, where up to four layers
  // (including a floating orb accent) render without feeling crowded.
  return layers.slice(0, density === "rich" ? MAX_LAYERS_RICH : MAX_LAYERS);
}
