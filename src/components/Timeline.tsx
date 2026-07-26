import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

function Timeline() {
  const { content } = useSiteContent("timeline", {
    badge_text: "OUR JOURNEY",
    heading_line1: "Milestones That",
    heading_line2: "Shaped Us",
    milestone1_year: "2019",
    milestone1_title: "Company Founded",
    milestone1_desc: "Started with a small team focused on IT support for local businesses.",
    milestone2_year: "2021",
    milestone2_title: "Expanded Services",
    milestone2_desc: "Added cybersecurity and cloud solutions to our service offering.",
    milestone3_year: "2023",
    milestone3_title: "50+ Clients Served",
    milestone3_desc: "Reached a major milestone of serving over 50 businesses across industries.",
    milestone4_year: "2025",
    milestone4_title: "Software Development Launch",
    milestone4_desc: "Launched a dedicated custom software development division.",
  });

  const milestones = [
    { year: content.milestone1_year, title: content.milestone1_title, desc: content.milestone1_desc },
    { year: content.milestone2_year, title: content.milestone2_title, desc: content.milestone2_desc },
    { year: content.milestone3_year, title: content.milestone3_title, desc: content.milestone3_desc },
    { year: content.milestone4_year, title: content.milestone4_title, desc: content.milestone4_desc },
  ];

  return (
    <Section className="bg-[#08101D] text-white" maxWidth="text" decoration={<GlowBackground />}>
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

      <div className="relative space-y-10 border-l-2 border-white/10 pl-8">
        {milestones.map((item, index) => (
          <div key={index} data-aos="fade-up" data-aos-delay={index * 100} className="relative">
            <div className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 ring-4 ring-[#08101D]" />
            <span className="text-sm font-semibold text-purple-400">{item.year}</span>
            <h3 className="mt-1 text-xl font-bold">{item.title}</h3>
            <p className="mt-2 leading-7 text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default Timeline;