import { Search, PenTool, Code2, Rocket, ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import Button from "./ui/Button";

const FALLBACK_STEPS = [
  {
    icon: Search,
    title: "Discover",
    purpose:
      "We start with your goals, audience, and constraints to define the right scope before any build work.",
  },
  {
    icon: PenTool,
    title: "Design",
    purpose:
      "UX flows, architecture, and a clear plan — agreed with you before we begin development.",
  },
  {
    icon: Code2,
    title: "Build",
    purpose:
      "Transparent, iterative development with regular checkpoints and working demos.",
  },
  {
    icon: Rocket,
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
      "A proven, collaborative process — scaled to fit every project, never skipped.",
  });

  const { steps, loading } = useProcessSteps();

  const displayedSteps = steps.length > 0
    ? steps.map((step, index) => ({
        icon: FALLBACK_STEPS[index % FALLBACK_STEPS.length].icon,
        title: step.title,
        purpose: step.purpose,
      }))
    : FALLBACK_STEPS;

  return (
    <Section id="process-preview" className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
      <div className="mb-12 max-w-3xl" data-aos="fade-up">
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

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayedSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                data-aos="fade-up"
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141C2D] to-[#0E1627] p-7 shadow-[0_10px_40px_rgba(0,0,0,.35)] transition-all duration-500 hover:border-purple-500/50"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/30">
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-xs font-bold tracking-[3px] text-purple-400">STEP {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-400">{step.purpose}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 text-center" data-aos="fade-up">
        <Button to="/process" variant="ghost" size="lg" icon={<ArrowRight size={20} />}>
          See the Full Process
        </Button>
      </div>
    </Section>
  );
}

export default ProcessPreview;
