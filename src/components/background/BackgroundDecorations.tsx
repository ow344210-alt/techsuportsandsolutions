// Reusable premium background decoration system. Place inside a relatively
// positioned, overflow-hidden section (ideally with `isolate`) and keep real
// content in a sibling that is `relative z-10` so decorations always stay
// behind content. Renders nothing when the preset/density resolves to zero
// layers or when a named asset is absent.
import { getPresetLayers } from "./decorationPresets";
import DecorationLayer from "./DecorationLayer";
import type { DecorationDensity, DecorationMotion, DecorationPreset } from "./decorationTypes";

interface BackgroundDecorationsProps {
  preset?: DecorationPreset;
  density?: DecorationDensity;
  /** Default motion applied to layers without an explicit motion. */
  motion?: DecorationMotion;
  className?: string;
}

export default function BackgroundDecorations({
  preset = "minimal",
  density = "normal",
  motion = "none",
  className = "",
}: BackgroundDecorationsProps) {
  const layers = getPresetLayers(preset, density);
  if (layers.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {layers.map((layer, index) => (
        <DecorationLayer key={index} layer={{ ...layer, motion: layer.motion ?? motion }} />
      ))}
    </div>
  );
}
