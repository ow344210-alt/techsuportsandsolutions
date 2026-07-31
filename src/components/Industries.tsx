// src/components/Industries.tsx
import { useEffect, useState } from "react";
import { fetchActiveIndustries } from "../lib/industries";
import type { Industry } from "../lib/industries";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

// Honest fallback shown only when no industries are published yet.
// CMS content always takes priority over this list.
const FALLBACK_INDUSTRIES: string[] = [
  "Retail & E-Commerce",
  "Healthcare",
  "Real Estate",
  "Education",
  "Logistics & Transport",
  "Finance & Accounting",
  "Manufacturing",
  "Hospitality",
];

function Industries() {
  const [items, setItems] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchActiveIndustries()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch(() => {
        // Silently ignore
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayed = items.length > 0 ? items.map((item) => item.name) : FALLBACK_INDUSTRIES;

  return (
    <Section className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
      <div className="mb-12 max-w-3xl" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          WHO WE WORK WITH
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          Industries <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">We Serve</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-aos="fade-up">
          {displayed.map((name, index) => (
            <div
              key={index}
              className="glass-card flex items-center justify-center p-5 text-center text-sm font-semibold text-gray-300 transition hover:-translate-y-1 hover:text-white"
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Industries;