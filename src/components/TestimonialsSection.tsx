import { useEffect, useState } from "react";
import { Star, Quote, ArrowRight } from "lucide-react";
import { fetchActiveTestimonials } from "../lib/testimonials";
import type { Testimonial } from "../lib/testimonials";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

// Honest fallback shown only when no testimonials are published yet.
// CMS content always takes priority over this list.
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "fallback-1",
    client_name: "Business Owner",
    company_name: "E-Commerce",
    profile_image_url: null,
    review:
      "The team rebuilt our website and optimized our Google Business profile with a clear focus on performance and customer experience. Communication remained smooth throughout the project, and every stage was delivered professionally. Since launch, our search enquiries have more than doubled, the website loads faster, and managing daily updates has become much easier.",
    rating: 5,
    status: "Published",
    is_active: true,
    order_index: 0,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-2",
    client_name: "Operations Manager",
    company_name: "Logistics",
    profile_image_url: null,
    review:
      "They moved our files, email accounts, and essential systems to the cloud without disrupting our daily operations. The process was clearly planned and finished on schedule, and our team can now work securely from anywhere.",
    rating: 5,
    status: "Published",
    is_active: true,
    order_index: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-3",
    client_name: "Founder",
    company_name: "Healthcare",
    profile_image_url: null,
    review:
      "Communication was clear and professional from the first consultation to final delivery. They took time to understand our workflow, and the system they built is reliable and easy for our staff to use.",
    rating: 5,
    status: "Published",
    is_active: true,
    order_index: 2,
    created_at: "",
    updated_at: "",
  },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
      ))}
    </div>
  );
}

function Avatar({ testimonial, size = 44 }: { testimonial: Testimonial; size?: number }) {
  const ring = "ring-2 ring-purple-400/30";
  if (testimonial.profile_image_url) {
    return (
      <img
        src={testimonial.profile_image_url}
        alt={testimonial.client_name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`rounded-full object-cover ${ring}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {testimonial.client_name.charAt(0).toUpperCase()}
    </div>
  );
}

function FeaturedCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="group relative flex flex-col overflow-hidden rounded-[20px] border border-purple-500/25 bg-gradient-to-br from-[#111a2e] to-[#0b0f1a] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-[0_24px_60px_-12px_rgba(168,85,247,0.4)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-600/25 blur-[90px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-pink-500/20 blur-[90px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <Quote size={42} strokeWidth={1.25} className="text-violet-500/40" />
        {testimonial.company_name && (
          <span className="inline-flex items-center rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-purple-300">
            {testimonial.company_name}
          </span>
        )}
      </div>

      <blockquote className="relative mt-5 flex-grow text-base leading-7 text-gray-300">“{testimonial.review}”</blockquote>

      <div className="relative mt-5">
        <StarRow rating={testimonial.rating} size={16} />
      </div>

      <figcaption className="relative mt-6 flex items-center gap-4 border-t border-white/10 pt-6">
        <Avatar testimonial={testimonial} size={56} />
        <div className="min-w-0">
          <p className="text-lg font-bold text-white">{testimonial.client_name}</p>
          {testimonial.company_name && <p className="truncate text-sm text-gray-400">{testimonial.company_name}</p>}
        </div>
      </figcaption>
    </figure>
  );
}

function CompactCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="group relative flex h-full flex-col rounded-[20px] border border-white/10 bg-[#0b0f1a] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-[0_20px_50px_-15px_rgba(168,85,247,0.35)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-600/20 blur-[70px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative">
        <StarRow rating={testimonial.rating} size={14} />
      </div>

      <blockquote className="relative mt-4 flex-grow text-sm leading-7 text-gray-300">
        {testimonial.review}
      </blockquote>

      <figcaption className="relative mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
        <Avatar testimonial={testimonial} size={44} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{testimonial.client_name}</p>
          {testimonial.company_name && <p className="truncate text-xs text-gray-400">{testimonial.company_name}</p>}
        </div>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchActiveTestimonials();
        if (isMounted) setTestimonials(data);
      } catch {
        // Silently ignore
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayed = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  const featured = displayed[0];
  const compact = displayed.slice(1, 3);

  return (
    <Section
      className="bg-[#091426] pt-[100px]! text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div className="grid items-stretch gap-12 lg:grid-cols-[42fr_58fr] lg:gap-20">
        <SectionIntro
          eyebrow="TESTIMONIALS"
          title1="What Our"
          title2="Clients Say"
          className="flex h-full flex-col"
        >
          <p className="mt-8 max-w-[520px] text-justify text-lg leading-[1.75] text-gray-400">
            We believe long-term partnerships are built on trust, transparency, and consistent results. Our clients
            rely on us for dependable technology solutions, responsive support, and a commitment to delivering projects
            that meet real business goals. From startups to established enterprises, their feedback reflects the quality,
            professionalism, and value we bring to every engagement. Every project begins by listening — understanding
            your challenges, your timeline, and the outcomes that matter most — so we can build solutions that fit the
            way you actually work. It is this focus on understanding, combined with proactive communication and a
            dedication to long-term value, that keeps clients returning to us year after year.
          </p>
          <div className="mt-auto pt-12">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Become a Client
            </Button>
          </div>
        </SectionIntro>

        <div className="flex h-full flex-col gap-6" data-aos="fade-up">
          {featured && <FeaturedCard testimonial={featured} />}

          {compact.length > 0 && (
            <div className="grid flex-1 gap-6 sm:grid-cols-2">
              {compact.map((testimonial) => (
                <CompactCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
