// A floating horizontal scrollbar pinned to the bottom of the dashboard
// viewport. It appears only while the real table scroller's own scrollbar is
// scrolled out of view (its bottom edge is below the viewport), so there is
// never more than one visible scrollbar at a time. Dragging the sticky bar
// scrolls the real scroller, and scrolling the real scroller moves the thumb.
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";

interface StickyTableScrollbarProps {
  scrollerRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

export default function StickyTableScrollbar({
  scrollerRef,
  className = "",
}: StickyTableScrollbarProps) {
  const [visible, setVisible] = useState(false);
  const [thumbPct, setThumbPct] = useState(0);
  const [thumbOffsetPct, setThumbOffsetPct] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hasOverflow = scroller.scrollWidth > scroller.clientWidth + 1;
        const rect = scroller.getBoundingClientRect();
        const viewportBottom = window.innerHeight;
        const ownScrollbarHidden = rect.bottom > viewportBottom;
        const inView = rect.top < viewportBottom && rect.bottom > 0;

        setVisible(Boolean(hasOverflow && ownScrollbarHidden && inView));

        if (hasOverflow) {
          setThumbPct((scroller.clientWidth / scroller.scrollWidth) * 100);
          const maxScroll = scroller.scrollWidth - scroller.clientWidth;
          const ratio =
            maxScroll > 0 ? scroller.scrollLeft / maxScroll : 0;
          setThumbOffsetPct(ratio * 100);
        }
      });
    };

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(scroller);
    if (scroller.firstElementChild) {
      resizeObserver.observe(scroller.firstElementChild);
    }

    scroller.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    update();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [scrollerRef]);

  const moveThumbTo = (clientX: number) => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    if (trackRect.width === 0) {
      return;
    }

    const ratio = (clientX - trackRect.left) / trackRect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    scroller.scrollLeft =
      clamped * (scroller.scrollWidth - scroller.clientWidth);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    event.preventDefault();
    draggingRef.current = true;
    if (typeof track.setPointerCapture === "function") {
      track.setPointerCapture(event.pointerId);
    }
    moveThumbTo(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    moveThumbTo(event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (trackRef.current && typeof trackRef.current.releasePointerCapture === "function") {
      trackRef.current.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`sticky bottom-0 z-30 mt-2 hidden lg:block ${className}`}
      style={visible ? undefined : { display: "none" }}
      aria-hidden="true"
      data-testid="sticky-scrollbar"
    >
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="mx-auto flex h-2.5 w-full max-w-full cursor-grab items-center rounded-full border border-white/10 bg-black/40 px-1.5 backdrop-blur-sm active:cursor-grabbing"
        data-testid="sticky-scrollbar-track"
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-violet-500/80"
            data-testid="sticky-scrollbar-thumb"
            style={{
              width: `${thumbPct}%`,
              marginLeft: `${thumbOffsetPct * (1 - thumbPct / 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
