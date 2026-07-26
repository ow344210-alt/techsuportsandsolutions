import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";

function Process() {
  const { content } = useSiteContent("process", {
    badge_text: "HOW IT WORKS",
    heading_line1: "How a Project Moves From Idea",
    heading_line2: "to Something You're Running Every Day",
    subheading: "The same process for a landing page and a full ERP system — scaled to fit, never skipped.",
  });

  const { steps, loading } = useProcessSteps();

  return (
    <Section id="process" className="bg-[#08101D] text-white" maxWidth="text" decoration={<GlowBackground />}>
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

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="relative space-y-6 border-l-2 border-white/10 pl-8 md:pl-10">
          {steps.map((step, index) => (
            <div
              key={step.id}
              data-aos="fade-up"
              data-aos-delay={Math.min(index * 80, 400)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141C2D] to-[#0E1627] p-6 shadow-[0_10px_40px_rgba(0,0,0,.35)] backdrop-blur-xl transition-all duration-500 hover:border-purple-500/50 sm:p-8"
            >
              <div className="absolute -left-[49px] top-8 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-bold shadow-lg shadow-purple-500/30 md:-left-[57px]">
                {index + 1}
              </div>

              <h3 className="text-2xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 leading-7 text-gray-400">{step.purpose}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">Activities</p>
                  <p className="mt-1.5 text-sm leading-6 text-gray-400">{step.activities}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">Deliverables</p>
                  <p className="mt-1.5 text-sm leading-6 text-gray-400">{step.deliverables}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">Timeline</p>
                  <p className="mt-1.5 text-sm leading-6 text-gray-400">{step.timeline}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">Client Involvement</p>
                  <p className="mt-1.5 text-sm leading-6 text-gray-400">{step.client_involvement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Process;