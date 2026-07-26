import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { fetchActiveServices } from "../lib/services";
import type { Service } from "../lib/services";
import { getServiceIcon } from "../lib/serviceIcons";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import Button from "./ui/Button";

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const { content } = useSiteContent("services", {
    badge_text: "OUR SERVICES",
    heading_line1: "Technology Solutions",
    heading_line2: "Built For Growth",
    subheading: "From IT consulting to cybersecurity, cloud infrastructure and custom software, we help businesses work faster, stay secure and grow with confidence through reliable technology solutions.",
    learn_more_text: "Learn More",
    cta_heading: "Need a Custom IT Solution?",
    cta_paragraph: "Every business has unique requirements. Let's discuss your goals and create a customized technology solution that helps your business succeed.",
    cta_btn_text: "Start Your Project",
    empty_state_text: "Services will appear here soon.",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const data = await fetchActiveServices();
        if (isMounted) setServices(data);
      } catch {
        // Ignore errors on public page
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Section id="services" className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
      <div className="mb-20 max-w-3xl" data-aos="fade-up">
        <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {content.badge_text}
        </span>
        <h2 className="section-title mt-8">
          {content.heading_line1}
          <span className="block">{content.heading_line2}</span>
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-400">{content.subheading}</p>
      </div>

      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="glass-card animate-pulse p-8">
              <div className="mb-8 h-14 w-14 rounded-xl bg-white/5" />
              <div className="h-6 w-2/3 rounded bg-white/5" />
              <div className="mt-4 h-4 w-full rounded bg-white/5" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-400">{content.empty_state_text}</p>
      ) : (
        <div className="grid items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <div
                key={service.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="glass-card group flex h-full flex-col p-8"
              >
                <div className="icon-box mb-8">
                  <Icon size={30} />
                </div>
                <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                <p className="mt-5 flex-grow leading-8 text-gray-400">{service.description}</p>

                <Button
                  href="#contact"
                  variant="ghost"
                  size="sm"
                  icon={<ArrowUpRight size={18} />}
                  className="mt-8 !px-0 !py-0 justify-start hover:gap-3"
                >
                  {content.learn_more_text}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="mt-24 rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl"
        data-aos="zoom-in"
      >
        <h3 className="text-3xl font-bold">{content.cta_heading}</h3>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">{content.cta_paragraph}</p>
        <Button href="#contact" variant="primary" size="lg" className="mt-10">
          {content.cta_btn_text}
        </Button>
      </div>
    </Section>
  );
}

export default Services;