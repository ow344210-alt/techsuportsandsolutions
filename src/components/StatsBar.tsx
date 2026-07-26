import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";

function StatsBar() {
  const { content } = useSiteContent("stats", {
    stat1_value: "10+",
    stat1_label: "Years Experience",
    stat2_value: "100+",
    stat2_label: "Happy Clients",
    stat3_value: "24/7",
    stat3_label: "Support Available",
    stat4_value: "50+",
    stat4_label: "Projects Delivered",
  });

  const stats = [
    { value: content.stat1_value, label: content.stat1_label },
    { value: content.stat2_value, label: content.stat2_label },
    { value: content.stat3_value, label: content.stat3_label },
    { value: content.stat4_value, label: content.stat4_label },
  ];

  return (
    <Section spacing="tight" className="bg-[#0B1220] text-white">
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