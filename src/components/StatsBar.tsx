import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";

function StatsBar() {
  const { content } = useSiteContent("stats", {
    stat1_value: "Full-Service",
    stat1_label: "Web, mobile & software",
    stat2_value: "One Team",
    stat2_label: "Builds plus ongoing support",
    stat3_value: "Ongoing",
    stat3_label: "Support after launch",
    stat4_value: "Transparent",
    stat4_label: "Fixed quotes & updates",
  });

  const stats = [
    { value: content.stat1_value, label: content.stat1_label },
    { value: content.stat2_value, label: content.stat2_label },
    { value: content.stat3_value, label: content.stat3_label },
    { value: content.stat4_value, label: content.stat4_label },
  ];

  return (
    <Section spacing="compact" className="bg-[#091426] text-white">
      <div
        className="grid grid-cols-2 gap-x-6 gap-y-10 min-[1200px]:grid-cols-4 min-[1200px]:gap-x-8"
        data-aos="fade-up"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 flex-col items-center justify-start text-center"
          >
            <div className="min-h-[58px] text-5xl font-bold leading-none gradient-text">
              {stat.value}
            </div>
            <p className="mt-3 min-h-[24px] text-center text-base leading-6 text-gray-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default StatsBar;