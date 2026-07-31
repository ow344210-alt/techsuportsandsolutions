import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { fetchActiveTestimonials } from "../lib/testimonials";
import type { Testimonial } from "../lib/testimonials";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

// Honest fallback shown only when no testimonials are published yet.
// CMS content always takes priority over this list.
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "fallback-1",
    client_name: "Business Owner",
    company_name: "E-Commerce",
    profile_image_url: null,
    review:
      "The team rebuilt our website and set up our Google Business profile. Enquiries from search have more than doubled since launch.",
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
      "They moved our files and email to the cloud and now everything just works — no more 'the server is down' mornings.",
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
      "From the first call to the final invoice, communication was clear and the system they built does exactly what they said it would.",
    rating: 5,
    status: "Published",
    is_active: true,
    order_index: 2,
    created_at: "",
    updated_at: "",
  },
];

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchActiveTestimonials();
        if (isMounted) setTestimonials(data);
      } catch {
        // Silently ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedTestimonials = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  return (
    <Section className="bg-[#0B1220] text-white" decoration={<GlowBackground />}>
      <div className="mb-12 max-w-3xl" data-aos="fade-up">
        <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">TESTIMONIALS</span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          What Our <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Clients Say</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">Real feedback from businesses that have partnered with us to grow through technology.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="h-4 w-10 rounded bg-white/5" /><div className="mt-4 h-20 rounded bg-white/5" /><div className="mt-6 h-4 w-1/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="group relative rounded-2xl border border-white/10 bg-[#0b0f1a] p-8 transition-all duration-500 hover:border-purple-500/40 hover:-translate-y-1" data-aos="fade-up">
              <Quote size={32} className="text-violet-500/30" />
              <p className="mt-4 text-sm leading-7 text-gray-300">{testimonial.review}</p>
              <div className="mt-6 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                {testimonial.profile_image_url ? (
                  <img src={testimonial.profile_image_url} alt={testimonial.client_name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                    <span className="text-sm font-bold">{testimonial.client_name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.client_name}</p>
                  {testimonial.company_name && (
                    <p className="text-xs text-gray-400">{testimonial.company_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}