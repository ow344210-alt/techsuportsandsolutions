import { Search, Map, Palette, Code2, ShieldCheck, Rocket, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import type { ProcessStep } from "../lib/processSteps";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import CTABanner from "./CTABanner";
import SEO from "./seo/SEO";

// Professional fallback shown only when no process steps are published yet.
// CMS content always takes priority over this list.
const FALLBACK_STEPS: ProcessStep[] = [
  {
    id: "fallback-discovery",
    title: "Discovery",
    purpose: "We start with your goals, users and constraints so we build the right thing the first time.",
    activities: "Business goals workshop; stakeholder interviews; current systems review; success metrics",
    deliverables: "Requirements summary; scope document; success criteria",
    timeline: "1–2 weeks",
    client_involvement: "Owner or stakeholder interview; access to current systems",
    order_index: 0,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-planning",
    title: "Planning",
    purpose: "We turn discovery into a clear plan — architecture, timeline and budget agreed before any build work.",
    activities: "Solution architecture; sprint planning; technology selection; estimate and schedule",
    deliverables: "Project plan; technical approach; fixed quote",
    timeline: "3–5 days",
    client_involvement: "Approve scope and quote; confirm priorities",
    order_index: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-design",
    title: "Design",
    purpose: "UX flows and visual design that are reviewed with you before development begins.",
    activities: "Wireframes; UI design; user flows; clickable prototype",
    deliverables: "Design files; prototype; style guide",
    timeline: "1–3 weeks",
    client_involvement: "Design review calls; feedback rounds",
    order_index: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-development",
    title: "Development",
    purpose: "Transparent, iterative builds with regular demos so you always know where the project stands.",
    activities: "Sprint-based development; staging deployments; regular demos; weekly updates",
    deliverables: "Working software; staging link; changelog",
    timeline: "Ongoing per plan",
    client_involvement: "Sprint reviews; timely feedback",
    order_index: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-testing",
    title: "Testing",
    purpose: "Your system is tested on real devices and edge cases before anyone else touches it.",
    activities: "Functionality testing; cross-browser checks; performance review; security review; user acceptance testing",
    deliverables: "Test report; fixes; release checklist",
    timeline: "1 week (scaled to scope)",
    client_involvement: "User acceptance testing",
    order_index: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-launch",
    title: "Launch",
    purpose: "A controlled go-live with a rollback plan, migration and handover so launch day stays calm.",
    activities: "Deployment; data migration; documentation; training; go-live support",
    deliverables: "Live system; admin guides; training session",
    timeline: "Launch window",
    client_involvement: "Final sign-off; launch attendance",
    order_index: 5,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-support",
    title: "Ongoing Support",
    purpose: "We stay on after launch with maintenance, monitoring and responsive support.",
    activities: "Monitoring; updates and patches; backups; support tickets; improvement requests",
    deliverables: "Support agreement; service levels; periodic reports",
    timeline: "Ongoing",
    client_involvement: "Priority support channel; quarterly review",
    order_index: 6,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

// Icons used for the visual step panels — matched to each phase, cycling
// safely with the modulo when the CMS contains more steps than icons.
const STEP_ICONS: LucideIcon[] = [Search, Map, Palette, Code2, ShieldCheck, Rocket, Headphones];

function StepImage({ index, icon }: { index: number; icon: LucideIcon }) {
  const Icon = icon;
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0E1627] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="absolute -left-14 -top-14 h-52 w-52 rounded-full bg-purple-600/30 blur-3xl" />
      <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-pink-600/20 blur-3xl" />
      <span className="absolute right-5 top-4 select-none text-6xl font-black leading-none text-white/5">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-purple-600 to-pink-500 shadow-[0_20px_60px_rgba(168,85,247,0.45)] transition-transform duration-500 hover:scale-110">
          <Icon size={32} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function StepDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[2px] text-purple-400">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-gray-400">{value}</p>
    </div>
  );
}

function Process() {
  const { content } = useSiteContent("process", {
    badge_text: "HOW IT WORKS",
    heading_line1: "How a Project Moves From Idea",
    heading_line2: "to Something You're Running Every Day",
    subheading: "The same process for a landing page and a full ERP system — scaled to fit, never skipped.",
  });

  const { steps, loading } = useProcessSteps();

  const displayedSteps = steps.length > 0 ? steps : FALLBACK_STEPS;

  return (
    <Section id="process" className="bg-[#08101D] pt-28 text-white md:pt-40" decoration={<GlowBackground />}>
      <SEO
        title="Process"
        description="Learn how we take a project from idea to launch — the same process for a landing page and a full ERP system, scaled to fit and never skipped."
        canonicalPath="/process"
      />
      <div className="mx-auto mb-20 max-w-3xl text-center" data-aos="fade-up">
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
        <div className="space-y-16 md:space-y-24">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="aspect-[16/10] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="space-y-4">
                <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                <div className="h-9 w-2/3 animate-pulse rounded bg-white/5" />
                <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-16 md:space-y-24">
          {displayedSteps.map((step, index) => (
            <div key={step.id} data-aos="fade-up" className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
              <StepImage index={index} icon={STEP_ICONS[index % STEP_ICONS.length]} />

              <div className={index % 2 === 1 ? "md:order-first" : ""}>
                <span className="text-xs font-bold tracking-[3px] text-purple-400">
                  STEP {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="relative mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                  {step.title}
                  <span className="heading-accent-bar" aria-hidden="true">
                    <span className="heading-accent-shine" />
                  </span>
                </h3>
                <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400">{step.purpose}</p>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <StepDetail label="Activities" value={step.activities} />
                  <StepDetail label="Deliverables" value={step.deliverables} />
                  <StepDetail label="Timeline" value={step.timeline} />
                  <StepDetail label="Client Involvement" value={step.client_involvement} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16">
        <CTABanner />
      </div>
    </Section>
  );
}

export default Process;
