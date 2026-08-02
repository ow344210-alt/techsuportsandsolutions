import { ShieldCheck, Clock, Award, Headset, ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

const icons = [ShieldCheck, Clock, Award, Headset];

function WhyChooseUs() {
  const { content } = useSiteContent("why-choose-us", {
    badge_text: "WHY CHOOSE US",
    heading_line1: "Reasons Businesses",
    heading_line2: "Trust Our Team",
    subheading:
      "Businesses choose Tech Supports Solutions because we focus on delivering reliable results, clear communication, and long-term value. From the first consultation to ongoing support, our team is committed to building solutions that are secure, scalable, and tailored to each client's goals. We combine technical expertise with responsive service, ensuring every project is completed with quality, transparency, and a commitment to your success.",
    reason1_title: "Reliable & Secure",
    reason1_desc: "Every solution is built with security and stability as the foundation, not an afterthought.",
    reason2_title: "On-Time Delivery",
    reason2_desc: "We respect deadlines and keep you updated at every step of the project.",
    reason3_title: "Proven Expertise",
    reason3_desc: "Years of hands-on experience across IT consulting, security, and software development.",
    reason4_title: "Always Available",
    reason4_desc: "Our support team is just a message away, whenever you need us.",
    cta_text: "Talk to Our Team",
  });

  const reasons = [
    { icon: icons[0], title: content.reason1_title, desc: content.reason1_desc },
    { icon: icons[1], title: content.reason2_title, desc: content.reason2_desc },
    { icon: icons[2], title: content.reason3_title, desc: content.reason3_desc },
    { icon: icons[3], title: content.reason4_title, desc: content.reason4_desc },
  ];

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionIntro
            eyebrow={content.badge_text}
            title1={content.heading_line1}
            title2={content.heading_line2}
            description={content.subheading}
            className="[&>p]:text-justify"
          />
          <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />} className="mt-10">
            {content.cta_text}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                data-aos="fade-up"
                className="glass-card group flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="icon-box mb-6">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold">{reason.title}</h3>
                <p className="mt-3 flex-grow text-sm leading-7 text-gray-400">{reason.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export default WhyChooseUs;
