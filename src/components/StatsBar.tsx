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
    <Section spacing="tight" className="bg-[#091426] text-white pb-10! md:pb-12!">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4" data-aos="fade-up">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <h3 className="text-4xl font-bold gradient-text md:text-5xl">{stat.value}</h3>
            <p className="mt-2 text-sm text-gray-400 md:text-base">{stat.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default StatsBar;