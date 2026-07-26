// src/components/Industries.tsx
import { useEffect, useState } from "react";
import { fetchActiveIndustries } from "../lib/industries";
import type { Industry } from "../lib/industries";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

function Industries() {
  const [items, setItems] = useState<Industry[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchActiveIndustries().then((data) => {
      if (isMounted) setItems(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <Section className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
      <div className="mb-12 max-w-3xl" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          WHO WE WORK WITH
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">Industries We Serve</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-aos="fade-up">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-card flex items-center justify-center p-5 text-center text-sm font-semibold text-gray-300 transition hover:-translate-y-1 hover:text-white"
          >
            {item.name}
          </div>
        ))}
      </div>
    </Section>
  );
}

export default Industries;