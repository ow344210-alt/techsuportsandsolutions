// Shared intro block for public sections: optional eyebrow badge, a two-line
// heading (second line highlighted), and an optional description. Left-aligned
// by default so section content leads the layout instead of centering.
import type { ReactNode } from "react";

interface SectionIntroProps {
  eyebrow?: string;
  title1?: string;
  title2?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  align?: "left" | "center";
  /** Set to false when a section must not depend on AOS to become visible. */
  animated?: boolean;
}

export default function SectionIntro({
  eyebrow,
  title1,
  title2,
  description,
  children,
  className = "",
  align = "left",
  animated = true,
}: SectionIntroProps) {
  return (
    <div className={className} data-aos={animated ? "fade-up" : undefined}>
      {eyebrow && (
        <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {eyebrow}
        </span>
      )}

      {(title1 || title2) && (
        <h2
          className={`mt-8 text-4xl font-bold leading-tight md:text-5xl ${
            align === "center" ? "text-center" : ""
          }`}
        >
          {title1}
          {title2 && (
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              {title2}
            </span>
          )}
        </h2>
      )}

      {description && (
        <p
          className={`mt-6 text-lg leading-8 text-gray-400 ${
            align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      )}

      {children}
    </div>
  );
}
