// Dedicated horizontal scroll container for admin tables. It is the ONLY
// element that scrolls sideways, so the rest of the page never develops a
// browser-level horizontal scrollbar. On mount it resets to the first column
// so tables always open at the left edge. `scrollRef` lets callers share the
// same element (e.g. with a sticky scrollbar that mirrors its position).
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

interface TableScrollerProps {
  children: ReactNode;
  className?: string;
  scrollRef?: RefObject<HTMLDivElement | null>;
}

export default function TableScroller({
  children,
  className = "",
  scrollRef,
}: TableScrollerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? internalRef;

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollLeft = 0;
    }
  }, [ref]);

  return (
    <div ref={ref} className={`w-full max-w-full overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}
