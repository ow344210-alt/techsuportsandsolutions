import {
  ArrowRight,
  CheckCircle2,
  Code2,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  Map,
  MessageSquare,
  Palette,
  Rocket,
  Route,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import type { ProcessStep } from "../lib/processSteps";
import Section from "./ui/Section";
import Button from "./ui/Button";
import SEO from "./seo/SEO";
import { BackgroundDecorations } from "./background";

// ============================================================
// Assets
// ============================================================

// Each process step has a dedicated poster in src/assets/process. The hero and
// final CTA reuse clearly matching posters from src/assets/projects. Every
// visual resolves at build time via glob; missing files fall back to a branded
// gradient panel so the page never shows a broken image.
const processImageModules = import.meta.glob(
  "../assets/process/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;
const auxImageModules = import.meta.glob(
  "../assets/projects/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;

// Asset key derived from a filename: strips the extension and every
// non-alphanumeric character so lookups are tolerant of naming quirks.
function assetKey(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Normalize arbitrary text for loose matching (used to merge CMS steps).
function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const PROCESS_IMAGE_MAP: Record<string, string> = {};
for (const [path, url] of Object.entries(processImageModules)) {
  const fileName = path.split("/").pop() ?? "";
  const key = assetKey(fileName);
  if (key) PROCESS_IMAGE_MAP[key] = url;
}

const AUX_IMAGE_MAP: Record<string, string> = {};
for (const [path, url] of Object.entries(auxImageModules)) {
  const fileName = path.split("/").pop() ?? "";
  const key = assetKey(fileName);
  if (key) AUX_IMAGE_MAP[key] = url;
}

// Canonical step keys -> actual filenames in src/assets/process. The last file
// is saved on disk with a space ("growth and support.png"), so its canonical
// key resolves through this alias; the rest map one-to-one.
const PROCESS_IMAGE_ALIASES: Record<string, string> = {
  discovery: "discovery",
  research: "research",
  planning: "planning",
  wireframing: "wireframing",
  design: "design",
  development: "development",
  testing: "testing",
  deployment: "deployment",
  maintenance: "maintenance",
  "growth-support": "growth and support",
};

// Auxiliary posters reused from src/assets/projects because their content
// genuinely matches the sections they serve:
//   Hero -> "Our step-by-step project delivery process" poster
//   Final CTA -> "Starting a new project with us" (consultation) poster
const AUX_IMAGE_ALIASES: Record<string, string> = {
  "process-hero": "project-process",
  "process-cta": "project-consultation",
};

function resolveProcessImage(imageKey: string): string | null {
  const alias = PROCESS_IMAGE_ALIASES[imageKey];
  if (alias) {
    const key = assetKey(alias);
    if (PROCESS_IMAGE_MAP[key]) return PROCESS_IMAGE_MAP[key];
  }
  return null;
}

function resolveAuxImage(imageKey: string): string | null {
  const alias = AUX_IMAGE_ALIASES[imageKey];
  if (alias) {
    const key = assetKey(alias);
    if (AUX_IMAGE_MAP[key]) return AUX_IMAGE_MAP[key];
  }
  return null;
}

function scrollToProcessSteps() {
  const target = document.getElementById("process-steps");
  if (!target) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

// Match a canonical step against admin-controlled CMS steps so published copy
// still wins where a matching step exists, while canonical copy fills the rest.
function findCmsStep(cmsSteps: ProcessStep[], title: string): ProcessStep | undefined {
  const canon = normalizeKey(title);
  return cmsSteps.find((step) => {
    const value = normalizeKey(step.title);
    return value === canon || value.includes(canon) || canon.includes(value);
  });
}

// ============================================================
// Shared primitives
// ============================================================

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
      {children}
    </span>
  );
}

function SectionHeading({ title1, title2 }: { title1: string; title2: string }) {
  return (
    <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
      {title1}
      {title2 && (
        <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          {title2}
        </span>
      )}
    </h2>
  );
}

// Decorative background layer removed; sections now use the shared
// BackgroundDecorations system.

// Main section visuals keep their natural 3:2 aspect ratio. They are never
// stretched to fill a column: width is 100%, height is auto, and object-fit
// stays "contain" so proportions are always preserved. Callers cap the size
// with a max-width + mx-auto (steps ~640px, hero ~720px, CTA ~560px).
function VisualFrame({
  src,
  alt,
  fallbackIcon,
  fallbackLabel,
  eager = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  eager?: boolean;
  className?: string;
}) {
  const FallbackIcon = fallbackIcon;

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={`relative flex aspect-[3/2] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1627] via-[#111A2E] to-[#0B1220] ${className}`}
      >
        <div className="absolute -left-14 -top-14 h-52 w-52 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-pink-600/20 blur-3xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-purple-600 to-pink-500 shadow-[0_20px_60px_rgba(168,85,247,0.45)]">
          <FallbackIcon size={32} className="text-white" />
        </div>
        <span className="text-sm font-semibold uppercase tracking-[3px] text-gray-500">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={`h-auto w-full rounded-3xl object-contain ${className}`}
    />
  );
}

function SectionVisual({
  imageKey,
  alt,
  fallbackIcon,
  fallbackLabel,
  eager = false,
  className = "",
}: {
  imageKey: string;
  alt: string;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <VisualFrame
      src={resolveProcessImage(imageKey)}
      alt={alt}
      fallbackIcon={fallbackIcon}
      fallbackLabel={fallbackLabel}
      eager={eager}
      className={className}
    />
  );
}

function AuxSectionVisual({
  imageKey,
  alt,
  fallbackIcon,
  fallbackLabel,
  eager = false,
  className = "",
}: {
  imageKey: string;
  alt: string;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <VisualFrame
      src={resolveAuxImage(imageKey)}
      alt={alt}
      fallbackIcon={fallbackIcon}
      fallbackLabel={fallbackLabel}
      eager={eager}
      className={className}
    />
  );
}

// Compact supporting chips placed under main images so split sections keep
// balanced visual weight without stretching the illustration.
function SupportingChips({
  items,
  columns = "sm:grid-cols-3",
}: {
  items: Array<{ icon: LucideIcon; title: string }>;
  columns?: string;
}) {
  return (
    <div className={`mt-6 grid grid-cols-1 gap-3 ${columns}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
          >
            <Icon size={18} className="shrink-0 text-purple-300" />
            <span className="text-xs font-semibold text-gray-200">{item.title}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Data
// ============================================================

const HERO_CHIPS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Workflow, title: "Structured Workflow" },
  { icon: ListChecks, title: "Clear Milestones" },
  { icon: ShieldCheck, title: "Quality Checked" },
];

const INTRO_POINTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: ListChecks, title: "Clear Milestones" },
  { icon: MessageSquare, title: "Regular Communication" },
  { icon: Lightbulb, title: "Practical Decision-Making" },
  { icon: ShieldCheck, title: "Quality Checks at Every Stage" },
  { icon: Target, title: "Agreed Scope & Goals" },
  { icon: TrendingUp, title: "Transparent Progress Tracking" },
];

interface ProcessStepDefinition {
  key: string;
  number: string;
  eyebrow: string;
  icon: LucideIcon;
  title1: string;
  title2: string;
  description: string;
  bullets: string[];
  support: string;
  cta?: { to: string; label: string; variant: "primary" | "outline" };
}

// The ten canonical process steps, each mapped to its matching poster in
// src/assets/process. CMS descriptions are merged in where a step title
// matches; otherwise this professional copy is used.
const PROCESS_STEPS: ProcessStepDefinition[] = [
  {
    key: "discovery",
    number: "01",
    eyebrow: "DISCOVERY",
    icon: Search,
    title1: "Understanding the Business",
    title2: "Before Defining the Solution",
    description:
      "We begin by understanding your goals, users, current challenges, existing systems, and the outcome you want the project to achieve. This creates a shared direction before technical decisions begin.",
    bullets: [
      "Business goals and priorities",
      "User needs and expectations",
      "Current workflow review",
      "Initial project requirements",
    ],
    support:
      "The result is a short shared brief both sides agree on before any technical work begins.",
    cta: { to: "/contact", label: "Start Your Project", variant: "primary" },
  },
  {
    key: "research",
    number: "02",
    eyebrow: "RESEARCH",
    icon: Target,
    title1: "Turning Assumptions",
    title2: "Into Informed Decisions",
    description:
      "We examine the market, technical possibilities, user expectations, and existing constraints so that the project moves forward with stronger information and fewer avoidable risks.",
    bullets: [
      "Competitor and market review",
      "Technical feasibility",
      "User expectations",
      "Risk and constraint analysis",
    ],
    support: "Better information up front means fewer surprises further along.",
  },
  {
    key: "planning",
    number: "03",
    eyebrow: "PLANNING",
    icon: Map,
    title1: "Creating a Clear Roadmap",
    title2: "For the Work Ahead",
    description:
      "Once the direction is clear, we define the project scope, priorities, architecture, milestones, and delivery plan. This keeps expectations realistic and progress measurable.",
    bullets: [
      "Scope and feature priorities",
      "Technical architecture",
      "Project milestones",
      "Resource and delivery planning",
    ],
    support: "A fixed plan keeps scope realistic and progress easy to track.",
  },
  {
    key: "wireframing",
    number: "04",
    eyebrow: "WIREFRAMING",
    icon: Route,
    title1: "Shaping the Experience",
    title2: "Before Visual Design Begins",
    description:
      "Wireframes turn requirements into clear page structures, user flows, and screen layouts. This allows important usability decisions to be reviewed before detailed design work begins.",
    bullets: [
      "Page and screen structure",
      "User flow planning",
      "Content hierarchy",
      "Early usability review",
    ],
    support: "Catching usability issues at this stage is far cheaper than after launch.",
  },
  {
    key: "design",
    number: "05",
    eyebrow: "DESIGN",
    icon: Palette,
    title1: "Creating a Visual Experience",
    title2: "That Supports the User",
    description:
      "The design phase transforms approved wireframes into polished, responsive interfaces that reflect the brand and guide users toward the right actions.",
    bullets: [
      "UI design",
      "Responsive behavior",
      "Brand consistency",
      "Interaction patterns",
    ],
    support: "Every screen is designed for the way real users actually work.",
  },
  {
    key: "development",
    number: "06",
    eyebrow: "DEVELOPMENT",
    icon: Code2,
    title1: "Building the Approved Solution",
    title2: "With Maintainable Technology",
    description:
      "Our developers turn the approved designs and requirements into a functional digital product using technologies selected for performance, security, maintainability, and future growth.",
    bullets: [
      "Frontend and backend development",
      "Database and API integration",
      "Admin-controlled functionality",
      "Clean and maintainable code",
    ],
    support: "You see working software regularly instead of waiting for one big reveal.",
  },
  {
    key: "testing",
    number: "07",
    eyebrow: "TESTING",
    icon: ShieldCheck,
    title1: "Checking Quality",
    title2: "Before the Product Goes Live",
    description:
      "We test the product across devices, browsers, workflows, and real usage scenarios to identify issues before they affect users or business operations.",
    bullets: [
      "Functional testing",
      "Responsive testing",
      "Performance checks",
      "Usability and compatibility review",
    ],
    support: "We test the way a real user would, not just the way a developer would.",
  },
  {
    key: "deployment",
    number: "08",
    eyebrow: "DEPLOYMENT",
    icon: Rocket,
    title1: "Launching Carefully",
    title2: "Without Disrupting the Business",
    description:
      "Deployment is planned and monitored to ensure the product is released safely, configured correctly, and ready for real users.",
    bullets: [
      "Production setup",
      "Environment configuration",
      "Final launch checks",
      "Post-launch verification",
    ],
    support: "A careful launch protects your business during the transition.",
  },
  {
    key: "maintenance",
    number: "09",
    eyebrow: "MAINTENANCE",
    icon: LifeBuoy,
    title1: "Keeping the Product",
    title2: "Reliable After Launch",
    description:
      "After launch, ongoing maintenance helps keep the system stable, secure, compatible, and aligned with changing technical requirements.",
    bullets: [
      "Bug fixes",
      "Security updates",
      "Compatibility updates",
      "Performance monitoring",
    ],
    support: "Small, consistent upkeep prevents bigger problems later on.",
  },
  {
    key: "growth-support",
    number: "10",
    eyebrow: "GROWTH SUPPORT",
    icon: TrendingUp,
    title1: "Improving the Product",
    title2: "As the Business Evolves",
    description:
      "As the business grows, the product may require new features, integrations, performance improvements, and workflow changes. We provide continued support to help it evolve.",
    bullets: [
      "Feature expansion",
      "New integrations",
      "Performance improvements",
      "Long-term technical guidance",
    ],
    support: "Your product keeps improving as your business changes.",
  },
];

// ============================================================
// Section 1 — Process Hero
// ============================================================

function ProcessHero() {
  const { content } = useSiteContent("process", {
    badge_text: "HOW IT WORKS",
    heading_line1: "How a Project Moves",
    heading_line2: "From Idea to Everyday Use",
    subheading:
      "A successful digital product requires more than development alone. Our process brings strategy, design, technology, testing, and long-term support into one structured workflow — scaled to match the size and complexity of each project.",
  });

  return (
    <Section
      className="bg-[#07101D] pt-20 pb-12 text-white md:pt-24 md:pb-16 lg:pt-28"
      decoration={<BackgroundDecorations preset="hero" density="rich" />}
    >
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>{content.badge_text}</Eyebrow>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {content.heading_line1}
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              {content.heading_line2}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.subheading}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Start Your Project
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToProcessSteps}>
              Explore the Process
            </Button>
          </div>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <AuxSectionVisual
            imageKey="process-hero"
            alt="A structured workflow that turns an idea into a delivered product"
            fallbackIcon={Workflow}
            fallbackLabel="Our Process"
            className="mx-auto max-w-[min(100%,720px)]"
            eager
          />
          <SupportingChips items={HERO_CHIPS} />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 2 — Process Introduction
// ============================================================

function ProcessIntroduction() {
  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitLeft" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>A CLEAR DELIVERY FRAMEWORK</Eyebrow>
          <SectionHeading
            title1="Structured Enough for Clarity"
            title2="Flexible Enough for Real Projects"
          />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Every project has different requirements, but each one benefits from clear decisions,
            visible progress, and regular communication. Our process creates that structure while
            remaining flexible enough to adapt when new information or priorities emerge.
          </p>
        </div>

        <div data-aos="fade-left" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {INTRO_POINTS.map(({ icon: Icon, title }) => (
            <div key={title} className="glass-card flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-500/20 text-purple-300">
                <Icon size={20} />
              </div>
              <span className="text-sm font-semibold text-gray-200">{title}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Sections 3-12 — The Ten Process Steps
// ============================================================

function ProcessStepSection({
  step,
  cmsSteps,
  isFirst,
  tone,
}: {
  step: ProcessStepDefinition;
  cmsSteps: ProcessStep[];
  isFirst: boolean;
  tone: "dark" | "lighter";
}) {
  const cms = findCmsStep(cmsSteps, step.eyebrow);
  const description = cms?.purpose?.trim() ? cms.purpose : step.description;
  // Odd steps: content left, image right. Even steps: image left, content
  // right. The image is reordered on large screens only, so the DOM always
  // keeps content before the image (content-first on mobile, accessible order).
  const flip = parseInt(step.number, 10) % 2 === 0;

  return (
    <Section
      id={isFirst ? "process-steps" : undefined}
      className={`${
        tone === "dark" ? "bg-[#07101D]" : "bg-[#091426]"
      } py-12! text-white md:py-16!`}
      decoration={<BackgroundDecorations preset="process" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div
          data-aos={flip ? "fade-left" : "fade-right"}
          className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-sm font-black text-purple-300">
              {step.number}
            </span>
            <span className="text-xs font-bold uppercase tracking-[3px] text-purple-400">
              {step.eyebrow}
            </span>
          </div>
          <h3 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
            {step.title1}
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              {step.title2}
            </span>
          </h3>
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {description}
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {step.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-purple-300" />
                <span className="text-sm font-semibold text-gray-200">{bullet}</span>
              </div>
            ))}
          </div>

          {step.support && (
            <p className="mt-6 text-sm leading-6 text-gray-500">{step.support}</p>
          )}

          {step.cta && (
            <div className="mt-8">
              <Button to={step.cta.to} variant={step.cta.variant} icon={<ArrowRight size={15} />}>
                {step.cta.label}
              </Button>
            </div>
          )}
        </div>

        <div data-aos={flip ? "fade-right" : "fade-left"} className={flip ? "lg:order-first" : ""}>
          <SectionVisual
            imageKey={step.key}
            alt={`${step.eyebrow} — ${step.title1} ${step.title2}`}
            fallbackIcon={step.icon}
            fallbackLabel={step.eyebrow}
            className="mx-auto max-w-[min(100%,640px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Final CTA
// ============================================================

function FinalCta() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cta" />}
    >
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900 to-pink-500/20"
        data-aos="zoom-in"
      >
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-0">
          <div className="p-8 sm:p-12 lg:p-14">
            <Eyebrow>READY TO MOVE FORWARD?</Eyebrow>
            <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">
              Let's Turn Your Idea
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Into a Clear Project Plan
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
              Whether you already have a detailed brief or only an early idea, we can help you
              clarify the requirements, identify the right next step, and build a practical path
              toward delivery.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                Start Your Project
              </Button>
              <Button to="/services" variant="outline" size="lg">
                Explore Our Services
              </Button>
            </div>
          </div>

          <div
            data-aos="fade-left"
            className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-0"
          >
            <AuxSectionVisual
              imageKey="process-cta"
              alt="A consultation that turns an idea into a clear project plan"
              fallbackIcon={Target}
              fallbackLabel="Project Kickoff"
              className="absolute inset-0 h-full w-full !object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Full Process page
// ============================================================

function Process() {
  const { steps } = useProcessSteps();

  return (
    <>
      <SEO
        title="Process"
        description="See how we take a project from idea to everyday use — discovery, research, planning, design, development, testing, deployment, and long-term support."
        canonicalPath="/process"
      />
      <ProcessHero />
      <ProcessIntroduction />
      {PROCESS_STEPS.map((step, index) => (
        <ProcessStepSection
          key={step.key}
          step={step}
          cmsSteps={steps}
          isFirst={index === 0}
          tone={index % 2 === 0 ? "dark" : "lighter"}
        />
      ))}
      <FinalCta />
    </>
  );
}

export default Process;
