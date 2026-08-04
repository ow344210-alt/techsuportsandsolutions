// Dedicated horizontal scroll container for admin tables. It is the ONLY
// element that scrolls sideways, so the rest of the page never develops a
// browser-level horizontal scrollbar. On mount it resets to the first column
// so tables always open at the left edge.
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface TableScrollerProps {
  children: ReactNode;
  className?: string;
}

export default function TableScroller({ children, className = "" }: TableScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  return (
    <div ref={scrollRef} className={`w-full max-w-full overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}
