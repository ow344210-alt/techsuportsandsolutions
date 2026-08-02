// Wraps every public-facing section with consistent spacing and container
// width. `decoration` renders full-bleed background elements (glow blurs,
// grid patterns) outside the max-width container; `children` renders inside it.
import type { ReactNode } from "react";

type SectionSpacing = "default" | "tight" | "compact";
type SectionWidth = "wide" | "text" | "form";

const MAX_WIDTH_CLASSES: Record<SectionWidth, string> = {
  wide: "max-w-7xl",
  text: "max-w-4xl",
  form: "max-w-7xl",
};

interface SectionProps {
  id?: string;
  children: ReactNode;
  decoration?: ReactNode;
  className?: string;
  spacing?: SectionSpacing;
  maxWidth?: SectionWidth;
}

export default function Section({
  id,
  children,
  decoration,
  className = "",
  spacing = "default",
  maxWidth = "wide",
}: SectionProps) {
  const paddingClass =
    spacing === "tight"
      ? "py-14 md:py-16"
      : spacing === "compact"
        ? "py-10 md:py-12 lg:py-14"
        : "py-16 md:py-20";

  return (
    <section id={id} className={`relative isolate overflow-hidden ${paddingClass} ${className}`}>
      {decoration}
      <div className={`relative z-10 mx-auto ${MAX_WIDTH_CLASSES[maxWidth]} px-6`}>{children}</div>
    </section>
  );
}