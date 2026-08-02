// Base <img> used by every decorative layer. It is always non-interactive,
// invisible to assistive tech, and never draggable.
import type { CSSProperties } from "react";
import { resolveDecorationAsset } from "./decorationAssets";
import type {
  DecorationAssetName,
  DecorationMobileBehavior,
  DecorationMotion,
} from "./decorationTypes";

const MOTION_CLASSES: Record<DecorationMotion, string> = {
  none: "",
  float: "decoration-float",
  drift: "decoration-drift",
  pulse: "decoration-pulse",
};

const MOBILE_CLASSES: Record<DecorationMobileBehavior, string> = {
  keep: "",
  hide: "hidden md:block",
  subtle: "decoration-subtle-mobile",
};

interface DecorationAssetProps {
  asset: DecorationAssetName;
  className?: string;
  opacity?: number;
  motion?: DecorationMotion;
  mobile?: DecorationMobileBehavior;
  eager?: boolean;
}

export default function DecorationAsset({
  asset,
  className = "",
  opacity = 0.1,
  motion = "none",
  mobile = "keep",
  eager = false,
}: DecorationAssetProps) {
  const src = resolveDecorationAsset(asset);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={`pointer-events-none select-none ${MOBILE_CLASSES[mobile]} ${MOTION_CLASSES[motion]} ${className}`}
      style={{ opacity, "--decoration-opacity": opacity } as CSSProperties}
    />
  );
}
