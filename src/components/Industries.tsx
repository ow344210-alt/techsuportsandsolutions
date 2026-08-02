// src/components/Industries.tsx
import { createElement, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getIndustryIcon } from "../lib/industryIcons";
import { fetchActiveIndustries } from "../lib/industries";
import type { Industry } from "../lib/industries";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

// Honest fallback shown only when no industries are published yet.
// CMS content always takes priority over this list.
const FALLBACK_INDUSTRIES: string[] = [
  "Retail & Ecommerce",
  "Healthcare",
  "Real Estate",
  "Education",
  "Logistics",
  "Finance",
  "Manufacturing",
  "Restaurants",
];

function IndustryCard({ name, index }: { name: string; index: number }) {
  return (
    <div
      key={index}
      data-aos="fade-up"
      data-aos-delay={index * 40}
      className="group flex h-[86px] items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_-18px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/50 hover:bg-white/[0.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_26px_-8px_rgba(168,85,247,0.45)] lg:px-5"
    >
      {createElement(getIndustryIcon(name), {
        className: "size-5 shrink-0 text-purple-300/70 transition-colors duration-300 group-hover:text-purple-300",
      })}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-200 transition-colors duration-300 group-hover:text-white">
        {name}
      </span>
      <ArrowRight className="size-4 shrink-0 text-gray-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-300" />
    </div>
  );
}

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
    <Section
      className="bg-[#07101D] text-white lg:[&>div:last-child]:!max-w-[1400px]"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-x-20">
        <div className="lg:col-span-5">
          <SectionIntro
            eyebrow="WHO WE WORK WITH"
            title1="Industries"
            title2="We Serve"
            description="We partner with businesses across diverse industries to build technology that supports real operational needs. From healthcare, retail, and finance to logistics, education, manufacturing, hospitality, and construction, our team delivers secure, scalable, and practical digital solutions tailored to each industry's unique challenges. By understanding your workflows, compliance requirements, and business goals, we create technology that improves efficiency, streamlines operations, enhances customer experiences, and supports sustainable long-term growth."
            className="[&>p]:max-w-[540px]"
          />
          <Button
            to="/contact"
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} />}
            className="mt-8"
          >
            Work With Us
          </Button>
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loading ? (
              [...Array(7)].map((_, i) => (
                <div key={i} className="h-[86px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))
            ) : (
              displayed.map((name, index) => <IndustryCard key={index} name={name} index={index} />)
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

export default Industries;
