import { ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import Button from "./ui/Button";
import GlowBackground from "./ui/GlowBackground";

function AboutPreview() {
  const { content } = useSiteContent("about-preview", {
    badge_text: "ABOUT US",
    heading_line1: "From a Two-Person IT Desk",
    heading_line2: "to a Full Software House",
    paragraph: "We started as a two-person IT support desk fixing broken networks for small offices in Karachi. Today we're a full-service software house that stays on long after launch.",
    cta_text: "Read Our Full Story",
  });

  return (
    <Section className="bg-[#0B1220] text-white" decoration={<GlowBackground />}>
      <div className="mx-auto max-w-3xl text-center" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {content.badge_text}
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          {content.heading_line1}
          <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {content.heading_line2}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">{content.paragraph}</p>

        <div className="mt-8 flex justify-center">
          <Button to="/about" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
            {content.cta_text}
          </Button>
        </div>
      </div>
    </Section>
  );
}

export default AboutPreview;