import { ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

function CTABanner() {
  const { content } = useSiteContent("cta-banner", {
    heading: "Ready to Get Started?",
    subheading: "Let's discuss your project and build a technology solution that helps your business grow.",
    btn_text: "Start Your Project",
  });

  return (
    <Section
      spacing="tight"
      className="bg-[#07101D] text-white pb-10! md:pb-12!"
      decoration={<BackgroundDecorations preset="cta" />}
    >
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900 to-pink-500/20 p-10 text-center backdrop-blur-xl sm:p-16"
        data-aos="zoom-in"
      >
        <div className="relative">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">{content.heading}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-300">{content.subheading}</p>
          <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />} className="mt-10">
            {content.btn_text}
          </Button>
        </div>
      </div>
    </Section>
  );
}

export default CTABanner;