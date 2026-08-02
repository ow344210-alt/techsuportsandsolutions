// Renders a single preset layer configuration as a DecorationAsset.
import DecorationAsset from "./DecorationAsset";
import type { DecorationLayer } from "./decorationTypes";

export default function DecorationLayer({ layer }: { layer: DecorationLayer }) {
  return (
    <DecorationAsset
      asset={layer.asset}
      className={layer.className}
      opacity={layer.opacity}
      motion={layer.motion}
      mobile={layer.mobile}
      eager={layer.eager}
    />
  );
}
