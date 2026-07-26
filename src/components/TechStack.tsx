// src/components/TechStack.tsx
import { useEffect, useState } from "react";
import { fetchActiveTech } from "../lib/techStack";
import type { TechItem } from "../lib/techStack";
import Section from "./ui/Section";

function TechStack() {
  const [items, setItems] = useState<TechItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchActiveTech().then((data) => {
      if (isMounted) setItems(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <Section spacing="tight" className="bg-[#0B1220] text-white">
      <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[3px] text-purple-300">
        Technology We Build With
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3" data-aos="fade-up">
        {items.map((item) => (
          <span
            key={item.id}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-300 transition hover:border-purple-500/40 hover:text-white"
          >
            {item.name}
          </span>
        ))}
      </div>
    </Section>
  );
}

export default TechStack;