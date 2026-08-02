import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code,
  Code2,
  ExternalLink,
  FolderOpen,
  Globe,
  Heart,
  Layers,
  LifeBuoy,
  MessageSquare,
  MonitorCheck,
  PenTool,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { fetchActiveProjects } from "../lib/projects";
import type { Project } from "../lib/projects";
import { fetchActiveIndustries } from "../lib/industries";
import type { Industry } from "../lib/industries";
import { getIndustryIcon } from "../lib/industryIcons";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import SEO from "./seo/SEO";
import { BackgroundDecorations } from "./background";

// ============================================================
// Assets
// ============================================================

// Main project illustrations live in src/assets/projects. Every section on
// this page resolves its visual through this map — the page never falls back
// to Services assets or shared section imagery.
const projectImageModules = import.meta.glob(
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

const PROJECT_IMAGE_MAP: Record<string, string> = {};
for (const [path, url] of Object.entries(projectImageModules)) {
  const fileName = path.split("/").pop() ?? "";
  const key = assetKey(fileName);
  if (key) PROJECT_IMAGE_MAP[key] = url;
}

// Approved placements for the new project posters (all files live in
// src/assets/projects, natural 3:2 aspect ratio):
//   Hero -> projects-hero            Slider -> featured-project-banner-1/2/3
//   Intro -> portfolio-overview      Capabilities -> project-capabilities
//   Process -> project-process       Industries -> project-industries
//   Results -> project-results       FAQ -> project-faq
//   Final CTA -> project-consultation  Card fallback -> project-placeholder
// The card fallback file is saved as "project-placeholde" (sic) on disk, so
// the "project-placeholder" key resolves through this alias.
const PROJECT_IMAGE_ALIASES: Record<string, string> = {
  "project-placeholder": "project-placeholde",
};

function resolveProjectImage(imageKey: string): string | null {
  const key = assetKey(imageKey);
  if (PROJECT_IMAGE_MAP[key]) return PROJECT_IMAGE_MAP[key];
  const alias = PROJECT_IMAGE_ALIASES[imageKey];
  if (alias) {
    const aliasKey = assetKey(alias);
    if (PROJECT_IMAGE_MAP[aliasKey]) return PROJECT_IMAGE_MAP[aliasKey];
  }
  return null;
}

// ============================================================
// Helpers
// ============================================================

function isValidUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^(https?:\/\/)/i.test(value.trim());
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function scrollToProjectGallery() {
  const target = document.getElementById("project-gallery");
  if (!target) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
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

// Main section visuals keep their natural aspect ratio. They are never
// stretched to fill a column: width is 100%, height is auto, and object-fit
// stays "contain" so the natural proportions are always preserved. Callers cap
// the rendered size with a max-width + mx-auto (main sections ~640px wide,
// hero ~720px) so posters render 400-520px tall instead of dwarfing the column.
function ProjectSectionVisual({
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
  const src = resolveProjectImage(imageKey);
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

// Mirrors the categories available in the admin projects manager, plus "All".
const PROJECT_CATEGORIES: string[] = [
  "All",
  "Web Development",
  "Mobile App",
  "Software Solution",
  "Digital Marketing",
  "Automation",
  "IT Consulting",
  "E-Commerce",
  "SaaS",
  "Other",
];

const HERO_STATS: Array<{ value: string; label: string }> = [
  { value: "40+", label: "Projects Delivered" },
  { value: "20+", label: "Industries Served" },
  { value: "98%", label: "Client Satisfaction" },
];

const HERO_SUPPORT: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Layers, title: "Custom Software" },
  { icon: MonitorCheck, title: "Web & Mobile Apps" },
  { icon: Rocket, title: "Cloud & IT Support" },
];

const INTRO_POINTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: CheckCircle2, title: "Custom Web & Mobile Apps" },
  { icon: CheckCircle2, title: "Internal Tools & Automation" },
  { icon: CheckCircle2, title: "E-Commerce & Digital Growth" },
  { icon: CheckCircle2, title: "Long-Term Support Included" },
];

const CAPABILITIES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Target,
    title: "Business-Focused Planning",
    description:
      "We start with your goals and constraints, then design a solution around them — not the other way around.",
  },
  {
    icon: PenTool,
    title: "Modern UI/UX Design",
    description:
      "Clean, conversion-focused interfaces designed with your customers and tested with real users.",
  },
  {
    icon: Code2,
    title: "Robust Development",
    description:
      "Clean, secure code built on proven, maintainable technologies that your team can own.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description:
      "Automated and manual testing covers functionality, speed, and security before anything goes live.",
  },
  {
    icon: Rocket,
    title: "Secure Deployment",
    description:
      "Reliable hosting, performance tuning, and safe go-lives with minimal disruption to your business.",
  },
  {
    icon: LifeBuoy,
    title: "Ongoing Support",
    description:
      "Monitoring, maintenance, and updates that keep your system healthy long after launch.",
  },
];

const PROCESS_INSIGHTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: MessageSquare, title: "Weekly Progress Updates" },
  { icon: BadgeCheck, title: "Transparent Fixed Pricing" },
  { icon: LifeBuoy, title: "Post-Launch Support Included" },
];

const DELIVERY_PHASES: Array<{ number: number; title: string; description: string }> = [
  {
    number: 1,
    title: "Discovery",
    description:
      "We learn your business, your users, and the exact problem we're solving before any design starts.",
  },
  {
    number: 2,
    title: "Planning",
    description:
      "Clear scope, timeline, and fixed pricing agreed up front — no surprises later on.",
  },
  {
    number: 3,
    title: "Design",
    description:
      "Wireframes and prototypes you can react to before a single line of production code is written.",
  },
  {
    number: 4,
    title: "Development",
    description:
      "Regular demos so you see progress every week instead of waiting until the very end.",
  },
  {
    number: 5,
    title: "Testing",
    description:
      "Rigorous checks for functionality, speed, security, and device compatibility.",
  },
  {
    number: 6,
    title: "Launch",
    description:
      "A smooth go-live with training and documentation your team can actually use.",
  },
  {
    number: 7,
    title: "Support & Growth",
    description:
      "Monitoring, updates, and iteration as your business evolves — the partnership doesn't end at launch.",
  },
];

const INDUSTRY_INSIGHTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: CheckCircle2, title: "20+ Industries Served" },
  { icon: Settings, title: "Tailored to Your Workflow" },
];

// Honest fallback list shown only when no industries are configured in the CMS.
const FALLBACK_INDUSTRIES: string[] = [
  "Retail & E-Commerce",
  "Healthcare",
  "Education",
  "Real Estate",
  "Finance",
  "Hospitality",
  "Logistics",
  "Professional Services",
];

const VALUE_ITEMS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Heart,
    title: "Better Customer Experience",
    description:
      "Interfaces and workflows designed around how your customers actually behave.",
  },
  {
    icon: Timer,
    title: "Faster Internal Workflows",
    description:
      "Automation and streamlined tools that cut hours out of every single week.",
  },
  {
    icon: ShieldCheck,
    title: "More Reliable Systems",
    description:
      "Fewer outages, cleaner code, and backups that actually work when you need them.",
  },
  {
    icon: BarChart3,
    title: "Clearer Business Visibility",
    description:
      "Dashboards and reporting that show what's happening in your business in real time.",
  },
  {
    icon: Globe,
    title: "Stronger Digital Presence",
    description:
      "Websites and marketing assets that turn online searches into real enquiries.",
  },
  {
    icon: TrendingUp,
    title: "Easier Future Expansion",
    description:
      "Modular builds that grow with you instead of holding you back later.",
  },
];

// ============================================================
// Project card & link helpers
// ============================================================

function ProjectLinks({ project, size = "sm" }: { project: Project; size?: "sm" | "md" }) {
  const liveUrl = isValidUrl(project.live_url) ? project.live_url : null;
  const sourceUrl = isValidUrl(project.github_url) ? project.github_url : null;

  if (!liveUrl && !sourceUrl) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {liveUrl && (
        <Button
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          size={size}
          variant="primary"
          icon={<ExternalLink size={size === "sm" ? 13 : 15} />}
          iconPosition="left"
        >
          Live Demo
        </Button>
      )}
      {sourceUrl && (
        <Button
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          size={size}
          variant="secondary"
          icon={<Code size={size === "sm" ? 13 : 15} />}
          iconPosition="left"
        >
          View Source
        </Button>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const imageSrc = isValidUrl(project.image_url) ? project.image_url : null;
  const placeholderSrc = resolveProjectImage("project-placeholder");

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1a] transition-all duration-500 hover:-translate-y-1 hover:border-purple-500/40"
      data-aos="fade-up"
    >
      <div className="relative overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={project.title}
            className="aspect-[16/10] w-full bg-[#0b0f1a] object-contain transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#0b0f1a]">
            {placeholderSrc ? (
              <img
                src={placeholderSrc}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center">
                <Layers size={26} className="text-purple-400/50" />
              </div>
            )}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            {project.category}
          </span>
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {project.technologies.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        <h3 className="mt-4 text-xl font-bold text-white">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-gray-400 line-clamp-3">{project.description}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <ProjectLinks project={project} />
          <Button to="/contact" variant="ghost" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
            Request Similar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Section 2 — Featured Projects Banner Slider
// ============================================================

function FeaturedSlide({
  project,
  bannerKey,
  eager,
}: {
  project: Project;
  bannerKey: string;
  eager: boolean;
}) {
  const liveUrl = isValidUrl(project.live_url) ? project.live_url : null;
  const sourceUrl = isValidUrl(project.github_url) ? project.github_url : null;
  const hasAdminImage = isValidUrl(project.image_url);
  const bannerSrc = hasAdminImage ? project.image_url : resolveProjectImage(bannerKey);

  return (
    <div className="grid lg:grid-cols-[2fr_3fr]">
      <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[2px] text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
          Featured Project
        </span>
        <h3 className="mt-6 text-2xl font-bold leading-tight text-white md:text-3xl">
          {project.title}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 line-clamp-3 md:text-base">
          {project.description}
        </p>
        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.technologies.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {liveUrl && (
            <Button
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLink size={15} />}
              iconPosition="left"
            >
              Live Demo
            </Button>
          )}
          {sourceUrl && (
            <Button
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              icon={<Code size={15} />}
              iconPosition="left"
            >
              View Source
            </Button>
          )}
          <Button to="/contact" variant="ghost" icon={<ArrowRight size={15} />} iconPosition="right">
            Request Similar
          </Button>
        </div>
      </div>

      <div className="relative flex items-center justify-center border-t border-white/10 bg-[#0b0f1a]/60 p-8 lg:border-l lg:border-t-0 lg:p-10">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt={`${project.title} preview`}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            className="h-auto max-h-[420px] w-full object-contain"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1627] via-[#111A2E] to-[#0B1220]">
            <Layers size={56} className="text-purple-400/50" />
          </div>
        )}
        <span className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
          {project.category}
        </span>
      </div>
    </div>
  );
}

function FeaturedSlider({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = projects.length;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [count, paused, reducedMotion]);

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured projects"
      >
        <div
          className={`flex ${reducedMotion ? "" : "transition-transform duration-700 ease-out"}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="w-full shrink-0"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${count}`}
            >
              <FeaturedSlide
                project={project}
                bannerKey={`featured-project-banner-${i + 1}`}
                eager={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose featured project">
          {projects.map((project, i) => (
            <button
              key={project.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to ${project.title}`}
              aria-pressed={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous featured project"
            disabled={count <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 transition hover:border-purple-500/40 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next featured project"
            disabled={count <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 transition hover:border-purple-500/40 hover:text-white disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedSection({ featured }: { featured: Project[] }) {
  if (featured.length === 0) return null;

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="heroMinimal" />}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionIntro
          eyebrow="FEATURED WORK"
          title1="Projects That Make"
          title2="an Impact"
          description="A curated look at recent work we're proud of — each one built to solve a real business problem."
          className="max-w-3xl"
        />
      </div>

      <div className="mt-12" data-aos="fade-up">
        {featured.length > 1 ? (
          <FeaturedSlider projects={featured} />
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <FeaturedSlide project={featured[0]} bannerKey="featured-project-banner-1" eager />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ============================================================
// Section 1 — Projects Hero
// ============================================================

function ProjectsHero() {
  return (
    <Section
      className="bg-[#07101D] pt-20 pb-12 text-white md:pt-24 md:pb-16 lg:pt-28"
      decoration={<BackgroundDecorations preset="hero" density="rich" />}
    >
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>OUR PORTFOLIO</Eyebrow>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Work We're Proud Of
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Across Every Industry
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            Explore real projects we've designed and built for businesses like yours — from
            marketing websites and mobile apps to custom systems and automation that keep teams
            moving.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button onClick={scrollToProjectGallery} variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Explore Our Projects
            </Button>
            <Button to="/contact" variant="outline" size="lg">
              Start Your Project
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-2xl font-extrabold text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[2px] text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <ProjectSectionVisual
            imageKey="projects-hero"
            alt="A selection of projects we have delivered for clients"
            fallbackIcon={Layers}
            fallbackLabel="Our Work"
            className="mx-auto max-w-[min(100%,720px)]"
            eager
          />
          <SupportingChips items={HERO_SUPPORT} />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 3 — Portfolio Introduction
// ============================================================

function PortfolioIntroduction() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>WHAT WE DO</Eyebrow>
          <SectionHeading title1="A Complete Portfolio" title2="of Digital Solutions" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Every project starts with the same question: what does your business need to achieve?
            From marketing websites and e-commerce stores to custom internal systems and automation,
            we design, build, and support solutions that deliver measurable results.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {INTRO_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <span
                  key={point.title}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200"
                >
                  <Icon size={14} className="text-purple-300" />
                  {point.title}
                </span>
              );
            })}
          </div>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Discuss Your Project
          </Button>
        </div>

        <div data-aos="fade-left">
          <ProjectSectionVisual
            imageKey="portfolio-overview"
            alt="An overview of the solutions we build for clients"
            fallbackIcon={FolderOpen}
            fallbackLabel="Our Portfolio"
            className="mx-auto max-w-[min(100%,640px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 4 & 5 — Category Filter & Projects Grid
// ============================================================

function ProjectGallerySection({
  projects,
  loading,
  error,
  onRetry,
}: {
  projects: Project[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);
  const isSingle = filteredProjects.length === 1;

  return (
    <Section
      id="project-gallery"
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="grid" />}
    >
      <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
        <Eyebrow>OUR WORK</Eyebrow>
        <SectionHeading title1="Explore Our Recent" title2="Projects" />
        <p className="mt-6 text-lg leading-8 text-gray-400">
          Browse a selection of projects across web, mobile, software, automation, and digital
          marketing. Filter by category to see work that matches your needs.
        </p>
      </div>

      <div
        className="mt-12 flex flex-wrap items-center gap-2.5"
        role="group"
        aria-label="Filter projects by category"
      >
        {PROJECT_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              aria-pressed={isActive}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                  : "border border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="mt-10" aria-live="polite">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="aspect-[16/10] w-full bg-white/5" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-2/3 rounded bg-white/5" />
                  <div className="h-4 w-full rounded bg-white/5" />
                  <div className="h-4 w-4/5 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error && projects.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 px-8 py-14 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-purple-500/10">
              <FolderOpen size={28} className="text-purple-300" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Projects are temporarily unavailable</h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              We could not load our portfolio right now. Please check back shortly.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={onRetry} variant="secondary" icon={<RefreshIcon />} iconPosition="left">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-purple-500/10">
              <FolderOpen size={28} className="text-purple-300" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">
              {activeCategory === "All"
                ? "No projects published yet"
                : `No ${activeCategory} projects yet`}
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              {activeCategory === "All"
                ? "We're adding new projects to this section. Check back soon or tell us about your idea."
                : `We haven't published a ${activeCategory} project yet, but we'd love to talk about yours.`}
            </p>
            <div className="mt-7 flex justify-center">
              <Button to="/contact" icon={<ArrowRight size={15} />} iconPosition="right">
                Request a Similar Project
              </Button>
            </div>
          </div>
        ) : isSingle ? (
          <div className="mx-auto max-w-2xl">
            <ProjectCard project={filteredProjects[0]} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function RefreshIcon() {
  return <RefreshCw size={15} />;
}

// ============================================================
// Section 6 — Project Capabilities
// ============================================================

function ProjectCapabilities() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>CAPABILITIES</Eyebrow>
          <SectionHeading title1="Everything Your" title2="Project Needs" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            One team handles every stage of your project — from the first discovery call to
            long-term support after launch — so you never have to coordinate multiple vendors.
          </p>
        </div>

        <div data-aos="fade-left">
          <ProjectSectionVisual
            imageKey="project-capabilities"
            alt="Everything your project needs, under one roof"
            fallbackIcon={Target}
            fallbackLabel="Capabilities"
            className="mx-auto max-w-[min(100%,640px)]"
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="glass-card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-500/20 text-purple-300">
              <Icon size={22} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================
// Section 7 — Project Delivery Approach
// ============================================================

function ProjectDeliveryApproach() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="timeline" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>OUR PROCESS</Eyebrow>
          <SectionHeading title1="A Clear, Proven" title2="Delivery Process" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            We keep you informed at every stage — with weekly demos, honest timelines, and fixed
            pricing agreed before any work begins.
          </p>
        </div>

        <div data-aos="fade-left">
          <ProjectSectionVisual
            imageKey="project-process"
            alt="Our step-by-step project delivery process"
            fallbackIcon={Target}
            fallbackLabel="Delivery Process"
            className="mx-auto max-w-[min(100%,640px)]"
          />
          <SupportingChips items={PROCESS_INSIGHTS} />
        </div>
      </div>

      <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERY_PHASES.map((phase, index) => (
          <li key={phase.title} className={index === DELIVERY_PHASES.length - 1 ? "sm:col-span-2" : ""}>
            <div className="glass-card h-full p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-sm font-bold text-purple-300">
                {phase.number}
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{phase.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{phase.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ============================================================
// Section 8 — Industries / Project Types
// ============================================================

function ProjectIndustries({
  industries,
  loading,
}: {
  industries: Industry[];
  loading: boolean;
}) {
  const displayed =
    industries.length > 0
      ? industries
      : FALLBACK_INDUSTRIES.map((name, i) => ({
          id: `fallback-${i}`,
          name,
          order_index: i,
          is_active: true,
          created_at: "",
        }));

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="heroMinimal" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>INDUSTRIES</Eyebrow>
          <SectionHeading title1="Solutions for" title2="Every Industry" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Our clients span a wide range of industries, and every project is tailored to the way
            that business actually works.
          </p>
        </div>

        <div data-aos="fade-left">
          <ProjectSectionVisual
            imageKey="project-industries"
            alt="Industries we design and build software for"
            fallbackIcon={Globe}
            fallbackLabel="Industries We Serve"
            className="mx-auto max-w-[min(100%,640px)]"
          />
          <SupportingChips items={INDUSTRY_INSIGHTS} columns="sm:grid-cols-2" />
        </div>
      </div>

      {loading ? (
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayed.map((industry) => {
            const Icon = getIndustryIcon(industry.name);
            return (
              <li key={industry.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <Icon size={18} className="shrink-0 text-purple-300" />
                  <span className="text-sm font-semibold text-gray-200">{industry.name}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ============================================================
// Section 9 — Results and Value
// ============================================================

function ProjectResults() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>RESULTS</Eyebrow>
          <SectionHeading title1="What Our Clients" title2="Value Most" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            We measure success by the results the system delivers — faster workflows, happier
            customers, and technology that keeps up with the business.
          </p>
        </div>

        <div data-aos="fade-left">
          <ProjectSectionVisual
            imageKey="project-results"
            alt="The results our clients value most"
            fallbackIcon={TrendingUp}
            fallbackLabel="Real Results"
            className="mx-auto max-w-[min(100%,640px)]"
          />
        </div>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="glass-card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-500/20 text-purple-300">
              <Icon size={22} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================
// Section 10 — Final Project CTA
// ============================================================

function FinalProjectCta() {
  return (
    <Section className="bg-[#07101D] text-white" decoration={<BackgroundDecorations preset="cta" />}>
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900 to-pink-500/20 p-8 backdrop-blur-xl sm:p-12 lg:p-16"
        data-aos="zoom-in"
      >
        <div className="mx-auto max-w-3xl text-center">
          <ProjectSectionVisual
            imageKey="project-consultation"
            alt="Starting a new project with us"
            fallbackIcon={Code2}
            fallbackLabel="Project Consultation"
            className="mx-auto max-w-[min(100%,640px)]"
            eager
          />
          <Eyebrow>LET'S BUILD SOMETHING GREAT</Eyebrow>
          <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">
            Ready to Start
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Your Next Project?
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-400">
            Tell us what you're trying to achieve. We'll give you honest advice on the best way to
            get there — whether that's with us or not.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Start Your Project
            </Button>
            <Button to="/services" variant="outline" size="lg">
              Explore Our Services
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Full Projects page
// ============================================================

function ProjectsPageContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveProjects();
        if (isMounted) setProjects(data);
      } catch {
        if (isMounted) setProjectsError(true);
      } finally {
        if (isMounted) setProjectsLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let isMounted = true;

    fetchActiveIndustries()
      .then((data) => {
        if (isMounted) setIndustries(data);
      })
      .catch(() => {
        // Silently ignore
      })
      .finally(() => {
        if (isMounted) setIndustriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = () => {
    setProjectsLoading(true);
    setProjectsError(false);
    setReloadKey((key) => key + 1);
  };

  // Featured selection: first three active projects (already ordered by
  // order_index inside fetchActiveProjects). No featured flag exists in the
  // schema, so this is the deterministic, schema-safe rule.
  const featured = projects.slice(0, 3);

  return (
    <>
      <ProjectsHero />
      <FeaturedSection featured={featured} />
      <PortfolioIntroduction />
      <ProjectGallerySection
        projects={projects}
        loading={projectsLoading}
        error={projectsError}
        onRetry={handleRetry}
      />
      <ProjectCapabilities />
      <ProjectDeliveryApproach />
      <ProjectIndustries industries={industries} loading={industriesLoading} />
      <ProjectResults />
      <FinalProjectCta />
    </>
  );
}

export default function Projects() {
  return (
    <>
      <SEO
        title="Projects"
        description="Explore our portfolio of web, mobile, SaaS, e-commerce, and automation projects delivered for clients across various industries."
        canonicalPath="/projects"
      />
      <ProjectsPageContent />
    </>
  );
}
