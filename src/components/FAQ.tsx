import { useState } from "react";
import { Plus } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useFaqs } from "../hooks/useFaqs";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  section: string;
  page?: string;
}

// Honest fallback shown only when no FAQs are published yet.
// CMS content always takes priority over this list.
const FALLBACK_FAQS: FAQItem[] = [
  {
    id: "fallback-1",
    question: "How do I get a quote for my project?",
    answer:
      "Start with the contact form and tell us what you're trying to achieve. We'll set up a short call, review your requirements and send back a fixed quote before any work begins — no obligation.",
  },
  {
    id: "fallback-2",
    question: "How long does a typical project take?",
    answer:
      "It depends on scope. A landing page can ship in 2–4 weeks, while a full web or mobile application is usually planned in phases of 4–8 weeks each. You'll get a realistic timeline in your proposal.",
  },
  {
    id: "fallback-3",
    question: "What do you charge for ongoing support?",
    answer:
      "Support plans are agreed after launch and scale with your needs — from ad-hoc maintenance to fully managed care including monitoring, updates, backups and priority response. We'll recommend the right fit and give you a clear price.",
  },
  {
    id: "fallback-4",
    question: "Can you help with an existing website or system?",
    answer:
      "Yes. We regularly take over and improve existing websites, applications and IT setups. We start with a review, tell you honestly what's working, and fix what isn't.",
  },
  {
    id: "fallback-5",
    question: "Do you offer IT support outside of development projects?",
    answer:
      "We do. IT support is where we started. If you need help with networks, security, backups, devices or troubleshooting, get in touch and we'll set up a support plan that fits your business.",
  },
];

function FAQ({ section, page }: FAQProps) {
  const { content } = useSiteContent(section, {
    badge_text: "FAQ",
    heading_line1: "Frequently Asked",
    heading_line2: "Questions",
    subheading: "Answers to the questions we hear most often from clients.",
  });

  const { faqs, loading } = useFaqs(page ?? section);
  const [openId, setOpenId] = useState<string | null>(null);

  const displayedFaqs = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <Section className="bg-[#08101D] text-white" maxWidth="text" decoration={<GlowBackground />}>
      <div className="mb-12 text-center" data-aos="fade-up">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          {content.badge_text}
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          {content.heading_line1}
          <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {content.heading_line2}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">{content.subheading}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-aos="fade-up">
          {displayedFaqs.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors duration-300 ${
                  isOpen ? "border-purple-500/40 bg-white/[0.07]" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-lg font-semibold">{item.question}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Plus size={16} />
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 leading-7 text-gray-400">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

export default FAQ;