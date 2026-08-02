import { ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

const FALLBACK_STEPS = [
  {
    title: "Discover",
    purpose:
      "We start with your goals, audience, and constraints to define the right scope before any build work.",
  },
  {
    title: "Design",
    purpose:
      "UX flows, architecture, and a clear plan — agreed with you before we begin development.",
  },
  {
    title: "Build",
    purpose:
      "Transparent, iterative development with regular checkpoints and working demos.",
  },
  {
    title: "Launch & Support",
    purpose:
      "Deployment, training, and ongoing support so your solution keeps delivering results.",
  },
] as const;

function ProcessPreview() {
  const { content } = useSiteContent("process", {
    badge_text: "HOW IT WORKS",
    heading_line1: "From Idea to",
    heading_line2: "Launch in Four Phases",
    subheading:
      "A proven, collaborative process that scales to fit every project. We work in clear phases with visible checkpoints, so you always know what's being built, why, and what comes next.",
  });

  const { steps } = useProcessSteps();

  const displayedSteps = steps.length > 0
    ? steps.slice(0, FALLBACK_STEPS.length).map((step) => ({ title: step.title, purpose: step.purpose }))
    : [...FALLBACK_STEPS];

  return (
    <Section
      id="process-preview"
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="timeline" />}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionIntro
          eyebrow={content.badge_text}
          title1={content.heading_line1}
          title2={content.heading_line2}
          description={content.subheading}
        >
          <Button to="/process" variant="outline" size="md" icon={<ArrowRight size={16} />} className="mt-10">
            See the Full Process
          </Button>
        </SectionIntro>

        <ol className="relative space-y-8 border-l border-purple-500/25 pl-8 sm:pl-10">
          {displayedSteps.map((step, index) => (
            <li key={step.title} data-aos="fade-up">
              <div className="flex items-start gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 font-bold text-white shadow-lg shadow-purple-500/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-400">{step.purpose}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

export default ProcessPreview;
