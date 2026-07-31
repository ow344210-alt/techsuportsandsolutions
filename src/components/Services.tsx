import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { fetchActiveServices } from "../lib/services";
import type { Service } from "../lib/services";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import Button from "./ui/Button";
import SEO from "./seo/SEO";

// Professional fallback shown only when no services are published yet in the
// admin panel. CMS content always takes priority over this list.
const FALLBACK_SERVICES: Array<{ title: string; description: string }> = [
  {
    title: "Web Development",
    description:
      "Fast, secure and responsive websites — from marketing pages to complete web platforms — built to work and built to convert.",
  },
  {
    title: "Mobile App Development",
    description:
      "Native and cross-platform apps for iOS and Android, designed around how your customers actually use your product.",
  },
  {
    title: "Software Development",
    description:
      "Custom systems that replace spreadsheets and manual work with software shaped around your exact workflow.",
  },
  {
    title: "UI/UX Design",
    description:
      "Clean interfaces, clear flows and intuitive experiences that make your product easy to use and easy to trust.",
  },
  {
    title: "Digital Marketing",
    description:
      "Practical campaigns that put your business in front of the right audience and turn attention into enquiries.",
  },
  {
    title: "Branding",
    description:
      "Identity and messaging that make your business look as professional online as it is in person.",
  },
  {
    title: "Google Business Optimization",
    description:
      "A properly built and maintained Google Business profile so local customers can find, trust and contact you.",
  },
  {
    title: "Cloud and IT Services",
    description:
      "Cloud migration, hosting and infrastructure that keep your systems fast, available and secure.",
  },
  {
    title: "Maintenance and IT Support",
    description:
      "Ongoing maintenance, monitoring and responsive support that keep your technology running without surprises.",
  },
  {
    title: "Technology Consulting",
    description:
      "Honest, vendor-neutral advice on tools, architecture and technology decisions — before you spend money on the wrong thing.",
  },
];

type ServiceItem = Service | { title: string; description: string };

// Import all service images from src/assets using Vite's import.meta.glob
// This resolves assets at build time and provides hashed URLs for production.
const serviceImageModules = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;

// Normalize a string for matching: lowercase, remove spaces, hyphens, ampersands, punctuation.
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[&\s-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Build a mapping from normalized service title to the imported asset URL.
// Keys are derived from the asset filenames (without extension).
const serviceImageMap: Record<string, string> = {};
for (const [path, url] of Object.entries(serviceImageModules)) {
  const fileName = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const key = normalizeKey(fileName);
  if (key) serviceImageMap[key] = url;
}

// Additional explicit mappings for filenames that don't directly match service titles.
const EXPLICIT_SERVICE_IMAGE_MAP: Record<string, string> = {
  // "App development" -> Mobile App Development
  appdevelopment: serviceImageMap["appdevelopment"] ?? "",
  // "react native" -> Mobile App Development
  reactnative: serviceImageMap["reactnative"] ?? "",
  flutter: serviceImageMap["flutter"] ?? "",
  // "software Development" -> Software Development
  softwaredevelopment: serviceImageMap["softwaredevelopment"] ?? "",
  // "Digital marketing" -> Digital Marketing
  digitalmarketing: serviceImageMap["digitalmarketing"] ?? "",
  // "uiux" -> UI/UX Design
  uiux: serviceImageMap["uiux"] ?? "",
  // "web development" -> Web Development
  webdevelopment: serviceImageMap["webdevelopment"] ?? "",
  // "branding" -> Branding
  branding: serviceImageMap["branding"] ?? "",
  // "google" -> Google Business Optimization
  google: serviceImageMap["google"] ?? "",
  // "cloud" -> Cloud and IT Services
  cloud: serviceImageMap["cloud"] ?? "",
  // "aws" -> Cloud and IT Services (alternative)
  aws: serviceImageMap["aws"] ?? "",
  // "azure" -> Cloud and IT Services (alternative)
  azure: serviceImageMap["azure"] ?? "",
  // "docker" -> Cloud and IT Services (alternative)
  docker: serviceImageMap["docker"] ?? "",
  // "firebase" -> Cloud and IT Services (alternative)
  firebase: serviceImageMap["firebase"] ?? "",
  // "maintenance" -> Maintenance and IT Support
  maintenance: serviceImageMap["maintenance"] ?? "",
  // "itdesk" -> Maintenance and IT Support (alternative)
  itdesk: serviceImageMap["itdesk"] ?? "",
};

function getServiceImage(title: string): string | null {
  const normalized = normalizeKey(title);
  // Try direct match first
  if (serviceImageMap[normalized]) return serviceImageMap[normalized];
  // Try explicit mapping
  if (EXPLICIT_SERVICE_IMAGE_MAP[normalized]) return EXPLICIT_SERVICE_IMAGE_MAP[normalized];
  // Try partial matches for common variations
  if (normalized.includes("mobile") || normalized.includes("app")) {
    return (
      serviceImageMap["appdevelopment"] ??
      serviceImageMap["reactnative"] ??
      serviceImageMap["flutter"] ??
      null
    );
  }
  if (normalized.includes("web")) {
    return serviceImageMap["webdevelopment"] ?? null;
  }
  if (normalized.includes("software")) {
    return serviceImageMap["softwaredevelopment"] ?? null;
  }
  if (normalized.includes("digital") || normalized.includes("marketing")) {
    return serviceImageMap["digitalmarketing"] ?? null;
  }
  if (normalized.includes("ui") || normalized.includes("ux")) {
    return serviceImageMap["uiux"] ?? null;
  }
  if (normalized.includes("brand")) {
    return serviceImageMap["branding"] ?? null;
  }
  if (normalized.includes("google")) {
    return serviceImageMap["google"] ?? null;
  }
  if (normalized.includes("cloud") || normalized.includes("aws") || normalized.includes("azure") || normalized.includes("docker") || normalized.includes("firebase")) {
    return (
      serviceImageMap["cloud"] ??
      serviceImageMap["aws"] ??
      serviceImageMap["azure"] ??
      serviceImageMap["docker"] ??
      serviceImageMap["firebase"] ??
      null
    );
  }
  if (normalized.includes("maintenance") || normalized.includes("support") || normalized.includes("itdesk")) {
    return serviceImageMap["maintenance"] ?? serviceImageMap["itdesk"] ?? null;
  }
  return null;
}

function ServiceCard({
  item,
  learnMoreText,
}: {
  item: ServiceItem;
  learnMoreText: string;
}) {
  const hasImageUrl = "image_url" in item && item.image_url?.trim();
  const cmsImageUrl = hasImageUrl ? item.image_url : null;
  const localImageUrl = getServiceImage(item.title);
  const imageUrl = cmsImageUrl ?? localImageUrl;

  return (
    <div className="group relative w-[320px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 transition-colors duration-500 hover:border-purple-500/40 sm:w-[360px]">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-500 group-hover:blur-[4px] group-hover:brightness-50"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-600/40 to-pink-600/40 transition-all duration-500 group-hover:blur-[4px] group-hover:brightness-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122] via-transparent to-transparent" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white">{item.title}</h3>
        <Button
          to="/contact"
          variant="primary"
          size="md"
          icon={<ArrowUpRight size={18} />}
          className="mt-4 justify-start hover:gap-3 group-hover:opacity-0"
        >
          {learnMoreText}
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-3 bg-[#0a1122]/85 p-6 opacity-0 backdrop-blur-md transition-opacity duration-500 group-hover:pointer-events-auto group-hover:opacity-100">
        <h3 className="text-xl font-bold text-white pb-2 border-b border-purple-500/50">{item.title}</h3>
        <p className="text-sm leading-6 text-gray-300">{item.description}</p>
      </div>
    </div>
  );
}

function Services({ standalone = true }: { standalone?: boolean }) {
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
    <Section
      id="services"
      className={`bg-[#08101D] text-white ${standalone ? "pt-28 md:pt-40" : ""}`}
      decoration={<GlowBackground />}
    >
      {standalone && (
        <SEO
          title="Services"
          description="Explore our technology solutions — custom web development, mobile apps, cloud infrastructure, cybersecurity, and IT consulting for growing businesses."
          canonicalPath="/services"
        />
      )}
      <div className="mb-12 max-w-3xl" data-aos="fade-up">
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
      ) : (
        <div className="space-y-6">
          <div className="marquee-hover marquee-viewport" data-aos="fade-up">
            <div className="marquee-track-right">
              <div className="flex shrink-0 gap-6 pr-6">
                {(services.length > 0 ? services : FALLBACK_SERVICES).map((service, index) => (
                  <ServiceCard
                    key={"id" in service ? String(service.id) : `fallback-${index}`}
                    item={service}
                    learnMoreText={content.learn_more_text}
                  />
                ))}
              </div>
              <div className="marquee-copy flex shrink-0 gap-6 pr-6" aria-hidden="true">
                {(services.length > 0 ? services : FALLBACK_SERVICES).map((service, index) => (
                  <ServiceCard
                    key={`copy-${"id" in service ? String(service.id) : `fallback-${index}`}`}
                    item={service}
                    learnMoreText={content.learn_more_text}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="marquee-hover marquee-viewport" data-aos="fade-up">
            <div className="marquee-track-left">
              <div className="flex shrink-0 gap-6 pr-6">
                {(services.length > 0 ? services : FALLBACK_SERVICES).map((service, index) => (
                  <ServiceCard
                    key={`row2-${"id" in service ? String(service.id) : `fallback-${index}`}`}
                    item={service}
                    learnMoreText={content.learn_more_text}
                  />
                ))}
              </div>
              <div className="marquee-copy flex shrink-0 gap-6 pr-6" aria-hidden="true">
                {(services.length > 0 ? services : FALLBACK_SERVICES).map((service, index) => (
                  <ServiceCard
                    key={`row2-copy-${"id" in service ? String(service.id) : `fallback-${index}`}`}
                    item={service}
                    learnMoreText={content.learn_more_text}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="mt-24 rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl"
        data-aos="zoom-in"
      >
        <h3 className="text-3xl font-bold">{content.cta_heading}</h3>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">{content.cta_paragraph}</p>
        <Button to="/contact" variant="primary" size="lg" className="mt-10">
          {content.cta_btn_text}
        </Button>
      </div>
    </Section>
  );
}

export default Services;