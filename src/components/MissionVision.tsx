import { Target, Eye } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import { BackgroundDecorations } from "./background";

function MissionVision() {
  const { content } = useSiteContent("mission-vision", {
    mission_title: "Our Mission",
    mission_text: "To simplify technology for businesses by delivering reliable, secure, and scalable IT solutions that drive real growth.",
    vision_title: "Our Vision",
    vision_text: "To be the trusted technology partner businesses turn to first, known for honesty, quality, and long-term relationships.",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="grid" density="subtle" />}
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div data-aos="fade-right" className="glass-card flex flex-col p-8 sm:p-10">
          <div className="icon-box mb-6">
            <Target size={30} />
          </div>
          <h3 className="text-2xl font-bold">{content.mission_title}</h3>
          <p className="mt-4 leading-8 text-gray-400">{content.mission_text}</p>
        </div>

        <div data-aos="fade-left" className="glass-card flex flex-col p-8 sm:p-10">
          <div className="icon-box mb-6">
            <Eye size={30} />
          </div>
          <h3 className="text-2xl font-bold">{content.vision_title}</h3>
          <p className="mt-4 leading-8 text-gray-400">{content.vision_text}</p>
        </div>
      </div>
    </Section>
  );
}

export default MissionVision;