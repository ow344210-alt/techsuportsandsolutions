import { useState } from "react";
import { Plus } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useFaqs } from "../hooks/useFaqs";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

interface FAQProps {
  section: string;
  page?: string;
}

function FAQ({ section, page }: FAQProps) {
  const { content } = useSiteContent(section, {
    badge_text: "FAQ",
    heading_line1: "Frequently Asked",
    heading_line2: "Questions",
    subheading: "Answers to the questions we hear most often from clients.",
  });

  const { faqs, loading } = useFaqs(page ?? section);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!loading && faqs.length === 0) {
    return null;
  }

  return (
    <Section className="bg-[#08101D] text-white" maxWidth="text" decoration={<GlowBackground />}>
      <div className="mb-16 text-center" data-aos="fade-up">
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
          {faqs.map((item) => {
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 transition-transform duration-300 ${
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