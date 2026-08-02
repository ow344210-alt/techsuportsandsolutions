import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import { BackgroundDecorations } from "./background";

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
    milestone3_year: "Ongoing",
    milestone3_title: "Support-First Service",
    milestone3_desc: "Built a service model where the team that builds a system also stays on to support it after launch.",
    milestone4_year: "Next",
    milestone4_title: "Custom Software Development",
    milestone4_desc: "Growing our dedicated custom software development division for web, mobile and internal systems.",
  });

  const milestones = [
    { year: content.milestone1_year, title: content.milestone1_title, desc: content.milestone1_desc },
    { year: content.milestone2_year, title: content.milestone2_title, desc: content.milestone2_desc },
    { year: content.milestone3_year, title: content.milestone3_title, desc: content.milestone3_desc },
    { year: content.milestone4_year, title: content.milestone4_title, desc: content.milestone4_desc },
  ];

  return (
    <Section
      className="bg-[#07101D] text-white"
      maxWidth="text"
      decoration={<BackgroundDecorations preset="timeline" />}
    >
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
          <div key={index} data-aos="fade-up" className="relative">
            <div className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 ring-4 ring-[#07101D]" />
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