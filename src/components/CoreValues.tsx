// src/components/CoreValues.tsx
import { CheckCircle2, MessageSquare, Lock, TrendingUp, Headset } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

const icons = [CheckCircle2, MessageSquare, Lock, TrendingUp, Headset];

function CoreValues() {
  const { content } = useSiteContent("core-values", {
    badge_text: "WHAT DRIVES US",
    heading_line1: "The Values That",
    heading_line2: "Shape Every Project",
    value1_title: "Ownership",
    value1_desc: "One accountable project owner for every engagement — the person you talk to is the person responsible for delivery.",
    value2_title: "Plain Communication",
    value2_desc: "No jargon, no surprises. You always know where the project stands and what happens next.",
    value3_title: "Fixed Commitments",
    value3_desc: "A fixed quote before we start and honest timelines we actually hit.",
    value4_title: "Long-Term Thinking",
    value4_desc: "Systems built to be maintained, improved and supported for years — not patched until launch.",
    value5_title: "Accessibility",
    value5_desc: "Help that's easy to reach, whether it's a quick question or a full project.",
  });

  const values = [1, 2, 3, 4, 5].map((n) => ({
    icon: icons[n - 1],
    title: content[`value${n}_title`],
    desc: content[`value${n}_desc`],
  }));

  return (
    <Section className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
      <div className="mb-16 max-w-3xl" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {content.badge_text}
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          {content.heading_line1}
          <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {content.heading_line2}
          </span>
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <div
              key={index}
              data-aos="fade-up"
              className="glass-card flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="icon-box mb-5">
                <Icon size={24} />
              </div>
              <h3 className="text-base font-bold">{value.title}</h3>
              <p className="mt-2 flex-grow text-sm leading-6 text-gray-400">{value.desc}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export default CoreValues;