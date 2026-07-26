import { ShieldCheck, Clock, Award, Headset } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

const icons = [ShieldCheck, Clock, Award, Headset];

function WhyChooseUs() {
  const { content } = useSiteContent("why-choose-us", {
    badge_text: "WHY CHOOSE US",
    heading_line1: "Reasons Businesses",
    heading_line2: "Trust Our Team",
    subheading: "We combine technical expertise with genuine care for your business outcomes.",
    reason1_title: "Reliable & Secure",
    reason1_desc: "Every solution is built with security and stability as the foundation, not an afterthought.",
    reason2_title: "On-Time Delivery",
    reason2_desc: "We respect deadlines and keep you updated at every step of the project.",
    reason3_title: "Proven Expertise",
    reason3_desc: "Years of hands-on experience across IT consulting, security, and software development.",
    reason4_title: "Always Available",
    reason4_desc: "Our support team is just a message away, whenever you need us.",
  });

  const reasons = [
    { icon: icons[0], title: content.reason1_title, desc: content.reason1_desc },
    { icon: icons[1], title: content.reason2_title, desc: content.reason2_desc },
    { icon: icons[2], title: content.reason3_title, desc: content.reason3_desc },
    { icon: icons[3], title: content.reason4_title, desc: content.reason4_desc },
  ];

  return (
    <Section className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
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
        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">{content.subheading}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
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
    </Section>
  );
}

export default WhyChooseUs;