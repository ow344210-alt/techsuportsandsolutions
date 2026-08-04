import { ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";
import founderJpg from "../assets/founder bbilal.jpg";

function AboutPreview() {
  const { content } = useSiteContent("about-preview", {
    badge_text: "ABOUT US",
    heading_line1: "From a Two-Person IT Desk",
    heading_line2: "to a Full Software House",
    paragraph:
      "We started as a two-person IT support desk fixing broken networks for small offices in Karachi. Today we're a full-service software house that stays on long after launch.",
    paragraph2:
      "From web and mobile development to cloud infrastructure, cybersecurity, and everyday IT support, we keep your technology working so you can focus on your business.",
    cta_text: "Read Our Full Story",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitLeft" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionIntro
          eyebrow={content.badge_text}
          title1={content.heading_line1}
          title2={content.heading_line2}
          description={content.paragraph}
          className="lg:order-2"
        >
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">{content.paragraph2}</p>
          <Button to="/about" variant="primary" size="lg" icon={<ArrowRight size={18} />} className="mt-10">
            {content.cta_text}
          </Button>
        </SectionIntro>

        <div data-aos="fade-right" className="lg:order-1">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10">
            <img
              src={founderJpg}
              alt="Tech Supports & Solutions founder"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#091426]/70 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </Section>
  );
}

export default AboutPreview;

