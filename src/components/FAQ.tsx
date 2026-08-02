import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useFaqs } from "../hooks/useFaqs";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  section: string;
  page?: string;
  pages?: string[];
  preview?: boolean;
  id?: string;
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

const MAX_CMS_FAQ_PAIRS = 10;

const FAQ_DEFAULTS: Record<string, string> = {
  badge_text: "FAQ",
  heading_line1: "Frequently Asked",
  heading_line2: "Questions",
  subheading:
    "We know choosing the right technology partner comes with important questions. Explore answers to the topics our clients ask about most, including project timelines, pricing, ongoing support, and existing systems. If you need further assistance, our team is always available to provide clear guidance and tailored recommendations for your business.",
};

for (let i = 1; i <= MAX_CMS_FAQ_PAIRS; i += 1) {
  FAQ_DEFAULTS[`q${i}`] = "";
  FAQ_DEFAULTS[`a${i}`] = "";
}

function FAQ({ section, page, pages, preview = false, id }: FAQProps) {
  const { content } = useSiteContent(section, FAQ_DEFAULTS);

  const { faqs, error, retry } = useFaqs(pages ?? page ?? section);
  const [openId, setOpenId] = useState<string | null>(null);

  const cmsFaqs: FAQItem[] = [];
  for (let i = 1; i <= MAX_CMS_FAQ_PAIRS; i += 1) {
    const question = content[`q${i}`]?.trim();
    const answer = content[`a${i}`]?.trim();
    if (question && answer) {
      cmsFaqs.push({ id: `cms-${i}`, question, answer });
    }
  }

  const allFaqs = faqs.length > 0 ? faqs : cmsFaqs.length > 0 ? cmsFaqs : FALLBACK_FAQS;
  const displayedFaqs = preview ? allFaqs.slice(0, 4) : allFaqs;

  const intro = (
    <SectionIntro
      eyebrow={content.badge_text}
      title1={content.heading_line1}
      title2={content.heading_line2}
      description={content.subheading}
      align={preview ? "left" : "center"}
      animated={false}
    >
      {preview && (
        <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />} className="mt-10">
          Still Have Questions?
        </Button>
      )}
    </SectionIntro>
  );

  const accordion = (
    <div className="space-y-4">
      {displayedFaqs.map((item) => {
        const isOpen = openId === item.id;
        const buttonId = `faq-button-${item.id}`;
        const panelId = `faq-panel-${item.id}`;
        return (
          <div
            key={item.id}
            className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors duration-300 ${
              isOpen ? "border-purple-500/40 bg-white/[0.07]" : "border-white/10 bg-white/5"
            }`}
          >
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
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
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
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
  );

  const errorBlock = (
    <div
      className="rounded-2xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center"
      role="alert"
    >
      <p className="text-base leading-7 text-slate-300">
        We couldn't load the frequently asked questions right now. Please try again.
      </p>
      <Button variant="outline" size="md" className="mt-5" onClick={retry}>
        Try Again
      </Button>
    </div>
  );

  if (preview) {
    return (
      <Section
        className="bg-[#07101D] text-white"
        decoration={<BackgroundDecorations preset="faq" />}
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">{intro}</div>
          <div>
            {error ? (
              errorBlock
            ) : (
              accordion
            )}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id={id}
      className="bg-[#07101D] text-white"
      spacing="compact"
      maxWidth="text"
      decoration={<BackgroundDecorations preset="faq" />}
    >
      <div className="mb-10 text-center md:mb-12">{intro}</div>
      {error ? (
        errorBlock
      ) : (
        accordion
      )}
    </Section>
  );
}

export default FAQ;
