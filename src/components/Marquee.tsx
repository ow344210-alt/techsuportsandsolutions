// Public marquee strips driven by public.marquee_items. Two rows (left/right)
// reuse the site's existing marquee animation classes and theme. The strip
// renders nothing while loading, when empty, or on error so it never flashes
// stale content or breaks page spacing.
import { useMemo } from "react";
import { usePublicMarqueeItems } from "../hooks/useMarqueeItems";
import type { MarqueeItem } from "../lib/marqueeItems";

function MarqueePill({ item }: { item: MarqueeItem }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-xl sm:px-6 sm:py-3">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400"
        aria-hidden="true"
      />
      <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-gray-200 sm:text-base">
        {item.label}
      </span>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: MarqueeItem[];
  direction: "left" | "right";
}) {
  const trackClass =
    direction === "left" ? "marquee-track-left" : "marquee-track-right";

  return (
    <div className="marquee-hover marquee-viewport">
      <div className={trackClass}>
        <div className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5">
          {items.map((item) => (
            <MarqueePill key={item.id} item={item} />
          ))}
        </div>
        <div
          className="marquee-copy flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
          aria-hidden="true"
          inert
        >
          {items.map((item) => (
            <MarqueePill key={`copy-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Marquee() {
  const { items, loading } = usePublicMarqueeItems();

  const leftItems = useMemo(
    () => items.filter((item) => item.row === "left"),
    [items]
  );
  const rightItems = useMemo(
    () => items.filter((item) => item.row !== "left"),
    [items]
  );

  if (loading || items.length === 0) return null;

  const showLeft = leftItems.length > 0;
  const showRight = rightItems.length > 0;
  if (!showLeft && !showRight) return null;

  return (
    <div
      aria-label="Highlights"
      className="relative overflow-hidden border-y border-white/5 bg-[#07101D] py-6 text-white sm:py-8"
    >
      {showLeft && <MarqueeRow items={leftItems} direction="left" />}
      {showLeft && showRight && <div className="mt-6 sm:mt-7" />}
      {showRight && <MarqueeRow items={rightItems} direction="right" />}
    </div>
  );
}

export default Marquee;
