import {
  ArrowRight,
  Award,
  Banknote,
  Building2,
  CheckCircle2,
  Code2,
  Compass,
  Contact,
  Eye,
  Globe,
  Handshake,
  Headset,
  HeartHandshake,
  LifeBuoy,
  Lightbulb,
  Lock,
  Map,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import Button from "./ui/Button";
import DynamicPageSections from "./DynamicPageSections";
import SEO from "./seo/SEO";
import { BackgroundDecorations } from "./background";

// ============================================================
// Assets
// ============================================================

// Every About section has a dedicated 1536x1024 poster in src/assets/about.
// All posters are present today except team-collaboration (still missing), so
// the team section renders a responsive card grid instead of an image. The
// other posters appear automatically — no static imports, no broken images.
const aboutImageModules = import.meta.glob(
  "../assets/about/*.{png,jpg,jpeg,webp,avif,svg}",
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

const ABOUT_IMAGE_MAP: Record<string, string> = {};
for (const [path, url] of Object.entries(aboutImageModules)) {
  const fileName = path.split("/").pop() ?? "";
  const key = assetKey(fileName);
  if (key) ABOUT_IMAGE_MAP[key] = url;
}

// Canonical section keys -> filenames in src/assets/about.
const ABOUT_IMAGE_ALIASES: Record<string, string> = {
  hero: "about-hero",
  "company-story": "company-story",
  "core-values": "core-values",
  "why-we-started": "why-we-started",
  "leadership-philosophy": "leadership-philosophy",
  "mission-vision": "mission-vision",
  "company-journey": "company-journey",
  "company-culture": "company-culture",
  "future-growth": "future-growth",
  "client-trust": "client-trust",
  "team-collaboration": "team-collaboration",
  "final-cta": "about-final-cta",
};

function resolveAboutImage(imageKey: string): string | null {
  const alias = ABOUT_IMAGE_ALIASES[imageKey];
  if (alias) {
    const key = assetKey(alias);
    if (ABOUT_IMAGE_MAP[key]) return ABOUT_IMAGE_MAP[key];
  }
  return null;
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

// The CMS may store the full two-line phrase in the first heading field, which
// would render a duplicated subtitle (e.g. "Small Enough to Know Every Client
// by Name" / "Every Client by Name"). Strip any matching suffix so titles
// always read as two distinct lines.
function trimDuplicateSuffix(title: string, subtitle: string): string {
  return subtitle && title.endsWith(subtitle) ? title.slice(0, -subtitle.length).trim() : title;
}

// Section visuals keep their natural 3:2 aspect ratio. They are never
// stretched to fill a column: width is 100%, height is auto, object-fit stays
// "contain" so proportions are always preserved. Missing posters render as a
// premium gradient panel with the section icon so the slot never looks empty.
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

function AboutSectionVisual({
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
      src={resolveAboutImage(imageKey)}
      alt={alt}
      fallbackIcon={fallbackIcon}
      fallbackLabel={fallbackLabel}
      eager={eager}
      className={className}
    />
  );
}

// Premium icon + title card used for culture principles and trust points.
function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  const Icon = icon;
  return (
    <div
      className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.07] hover:shadow-[0_20px_45px_-18px_rgba(168,85,247,0.45)] ${className}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-purple-600/25 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-500/20 text-purple-300 ring-1 ring-purple-500/20 transition-all duration-300 group-hover:from-purple-600 group-hover:to-pink-500 group-hover:text-white group-hover:shadow-[0_10px_28px_-8px_rgba(168,85,247,0.65)]">
        <Icon size={20} />
      </div>
      <div className="relative">
        <h3 className="text-sm font-bold text-white transition-colors duration-300 group-hover:text-purple-200">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm leading-6 text-gray-400 transition-colors duration-300 group-hover:text-gray-300">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Data
// ============================================================

const achievementIcons = [Award, Users, Globe, TrendingUp];

const CULTURE_PRINCIPLES: Array<{ icon: LucideIcon; title: string }> = [
  { icon: MessageSquare, title: "Direct Communication" },
  { icon: ShieldCheck, title: "Technical Ownership" },
  { icon: Users, title: "Small Focused Teams" },
  { icon: Handshake, title: "Client Continuity" },
];

const TRUST_POINTS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: UserCheck,
    title: "Clear Project Ownership",
    description: "One accountable owner from the first call to long after launch.",
  },
  {
    icon: Contact,
    title: "Stable Technical Contacts",
    description: "The same people who build your system stay on to support it.",
  },
  {
    icon: Banknote,
    title: "Transparent Pricing and Scope",
    description: "Fixed quotes before we start and no surprise invoices.",
  },
  {
    icon: LifeBuoy,
    title: "Support Beyond Launch",
    description: "Reliable help whenever the system needs attention.",
  },
];

const TEAM_PRINCIPLES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Users,
    title: "Cross-Functional Teams",
    description: "Engineers, designers, and support specialists working toward one goal.",
  },
  {
    icon: UserCheck,
    title: "Direct Ownership",
    description: "The people you talk to are the people doing the work.",
  },
  {
    icon: Lightbulb,
    title: "Practical Problem-Solving",
    description: "Simple, maintainable solutions chosen over clever complexity.",
  },
  {
    icon: TrendingUp,
    title: "Long-Term Support",
    description: "The same team stays available after launch.",
  },
  {
    icon: MessageSquare,
    title: "Open Communication",
    description: "Clear updates and honest answers at every step.",
  },
  {
    icon: HeartHandshake,
    title: "Craft & Care",
    description: "Work shipped with attention to detail and quality.",
  },
];

// ============================================================
// Section 1 — About Hero
// ============================================================

function AboutHero() {
  const { content } = useSiteContent("about", {
    badge_text: "ABOUT US",
    heading_line1: "We Started With a Toolbox,",
    heading_line2: "Not a Pitch Deck",
    paragraph1:
      "We started as a small IT support team solving practical technology problems for local businesses — and kept growing as they needed more.",
    paragraph2:
      "Today we combine software development, managed IT services, design, cloud, and consulting under one accountable team.",
    primary_btn_text: "Start a Conversation",
    secondary_btn_text: "Explore Our Services",
  });

  const { content: achievements } = useSiteContent("achievements", {
    stat1_value: "End-to-end",
    stat1_label: "Web, mobile & software",
    stat2_value: "One Team",
    stat2_label: "Builds plus ongoing support",
    stat3_value: "Security",
    stat3_label: "Considered in every project",
    stat4_value: "Transparent",
    stat4_label: "Fixed quotes & regular updates",
  });

  const achievementItems = [1, 2, 3, 4].map((n) => ({
    icon: achievementIcons[n - 1],
    value: achievements[`stat${n}_value`],
    label: achievements[`stat${n}_label`],
  }));

  return (
    <Section
      id="about"
      className="bg-[#07101D] pt-20 pb-12 text-white md:pt-24 md:pb-16 lg:pt-28"
      decoration={<BackgroundDecorations preset="hero" density="rich" />}
    >
      <div className="grid items-center gap-14 lg:grid-cols-[7fr_8fr] lg:gap-12">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>{content.badge_text}</Eyebrow>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl">
            {content.heading_line1}
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              {content.heading_line2}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph1}
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph2}
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              {content.primary_btn_text}
            </Button>
            <Button to="/services" variant="outline" size="lg">
              {content.secondary_btn_text}
            </Button>
          </div>
        </div>

        <div data-aos="fade-left">
          <AboutSectionVisual
            imageKey="hero"
            alt="The Tech Supports & Solutions team"
            fallbackIcon={Building2}
            fallbackLabel="About Us"
            className="mx-auto max-w-[min(100%,800px)]"
            eager
          />
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {achievementItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              data-aos="fade-up"
              className="glass-card flex items-center gap-4 p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-500/20 text-purple-300">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="mt-0.5 text-sm text-gray-400">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ============================================================
// Section 2 — Company Story
// ============================================================

function CompanyStory() {
  const { content } = useSiteContent("company-story", {
    eyebrow: "OUR STORY",
    heading1: "Built From Real Problems,",
    heading2: "Not Abstract Ideas",
    paragraph1:
      "The company grew because clients repeatedly asked for help beyond basic support. A broken workflow needed custom software. A manual process needed automation. A business without a digital presence needed a website that could grow with it.",
    paragraph2:
      "We expanded by solving the next practical problem in front of us—while keeping the same support-first mindset that shaped the business from the beginning.",
    cta_text: "Discuss Your Technology Needs",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div data-aos="fade-left" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={content.heading1} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph1}
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph2}
          </p>
          <div className="mt-8">
            <Button to="/contact" variant="primary" icon={<ArrowRight size={15} />}>
              {content.cta_text}
            </Button>
          </div>
        </div>

        <div data-aos="fade-right" className="lg:order-first">
          <AboutSectionVisual
            imageKey="company-story"
            alt="Solving a practical business problem with custom software"
            fallbackIcon={Code2}
            fallbackLabel="Our Story"
            className="mx-auto max-w-[min(100%,760px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 3 — Core Values
// ============================================================

function CoreValues() {
  const { content } = useSiteContent("core-values", {
    badge_text: "WHAT DRIVES US",
    heading_line1: "The Values That",
    heading_line2: "Shape Every Project",
    intro:
      "A small set of principles keeps every engagement accountable, clear, and built to last — whether it is a single support ticket or a full product build.",
    intro2:
      "These principles are not decorative. They are the standards every estimate, project plan, and support call is held against.",
    value1_title: "Ownership",
    value1_desc:
      "One accountable project owner for every engagement — the person you talk to is the person responsible for delivery.",
    value2_title: "Plain Communication",
    value2_desc: "No jargon, no surprises. You always know where the project stands and what happens next.",
    value3_title: "Fixed Commitments",
    value3_desc: "A fixed quote before we start and honest timelines we actually hit.",
    value4_title: "Long-Term Thinking",
    value4_desc: "Systems built to be maintained, improved and supported for years — not patched until launch.",
    value5_title: "Accessibility",
    value5_desc: "Help that's easy to reach, whether it's a quick question or a full project.",
  });

  const valueIcons = [CheckCircle2, MessageSquare, Lock, TrendingUp, Headset];

  const values = [1, 2, 3, 4, 5].map((n) => ({
    icon: valueIcons[n - 1],
    title: content[`value${n}_title`],
    desc: content[`value${n}_desc`],
  }));

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="splitLeft" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>{content.badge_text}</Eyebrow>
          <SectionHeading title1={content.heading_line1} title2={content.heading_line2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.intro}
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.intro2}
          </p>
        </div>

        <div data-aos="fade-left">
          <AboutSectionVisual
            imageKey="core-values"
            alt="The values that shape every project"
            fallbackIcon={HeartHandshake}
            fallbackLabel="Our Values"
            className="mx-auto max-w-[min(100%,760px)]"
          />
        </div>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <div
              key={index}
              data-aos="fade-up"
              className="glass-card flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="icon-box mb-5">
                <Icon size={24} />
              </div>
              <h3 className="text-base font-bold">{value.title}</h3>
              <p className="mt-2 flex-grow text-sm leading-6 text-gray-400">{value.desc}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ============================================================
// Section 4 — Why We Started
// ============================================================

function WhyWeStarted() {
  const { content } = useSiteContent("why-started", {
    eyebrow: "WHY WE STARTED",
    heading: "The Gap Wasn't Skill—",
    heading2: "It Was Access",
    paragraph:
      "Small and mid-sized businesses could find either cheap temporary help or expensive agencies, but very little dependable support in between.",
    paragraph2:
      "We built the middle path — an accountable technical team small enough to know your systems and structured enough to deliver real projects on time.",
    cta_text: "Talk to Our Team",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitLeft" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={content.heading} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph}
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph2}
          </p>
          <div className="mt-8">
            <Button to="/contact" variant="primary" icon={<ArrowRight size={15} />}>
              {content.cta_text}
            </Button>
          </div>
        </div>

        <div data-aos="fade-left">
          <AboutSectionVisual
            imageKey="why-we-started"
            alt="Bridging the gap for small and mid-sized businesses"
            fallbackIcon={Lightbulb}
            fallbackLabel="Why We Started"
            className="mx-auto max-w-[min(100%,760px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 5 — Leadership Philosophy
// ============================================================

function LeadershipPhilosophy() {
  const { content } = useSiteContent("leadership", {
    eyebrow: "LEADERSHIP PHILOSOPHY",
    heading: "Decisions Happen",
    heading2: "Closest to the Problem",
    paragraph:
      "Technical decisions are strongest when the people making them understand the real system, client, workflow, and consequences. We keep leadership close to delivery so responsibility does not become separated from the work.",
    paragraph2:
      "Team members are empowered to raise concerns early, propose fixes, and own their decisions. The result is faster problem-solving, fewer handoffs, and a team that treats your system as its own.",
  });

  // The CMS may store the full two-line phrase in `heading`; trim the
  // duplicate suffix so the title never renders as "Decisions Happen
  // Closest to the Problem / Closest to the Problem".
  const title1 = trimDuplicateSuffix(content.heading, content.heading2);

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div data-aos="fade-left" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={title1} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph}
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph2}
          </p>
        </div>

        <div data-aos="fade-right" className="lg:order-first">
          <AboutSectionVisual
            imageKey="leadership-philosophy"
            alt="Leaders working close to the problem"
            fallbackIcon={Compass}
            fallbackLabel="Leadership"
            className="mx-auto max-w-[min(100%,760px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 6 — Mission and Vision
// ============================================================

function MissionVision() {
  const { content } = useSiteContent("mission-vision", {
    eyebrow: "MISSION & VISION",
    heading_line1: "A Clear Mission,",
    heading_line2: "A Shared Vision",
    mission_title: "Our Mission",
    mission_text:
      "We build and maintain the software that lets businesses spend less time managing technology and more time running their business — with pricing and communication that never requires a translator.",
    vision_title: "Our Vision",
    vision_text:
      "To be the technology partner growing businesses call first — not the vendor they replace after the invoice clears.",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="grid" />}
    >
      <div data-aos="fade-up" className="mx-auto max-w-3xl text-center">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <SectionHeading title1={content.heading_line1} title2={content.heading_line2} />
      </div>

      <div data-aos="fade-up" className="mt-12 flex justify-center">
        <AboutSectionVisual
          imageKey="mission-vision"
          alt="Mission and vision guiding our work"
          fallbackIcon={Target}
          fallbackLabel="Mission & Vision"
          className="mx-auto max-w-[min(100%,640px)]"
        />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div data-aos="fade-right" className="glass-card flex h-full flex-col p-8 sm:p-10">
          <div className="icon-box mb-6">
            <Target size={30} />
          </div>
          <h3 className="text-2xl font-bold">{content.mission_title}</h3>
          <p className="mt-4 flex-grow leading-8 text-gray-400">{content.mission_text}</p>
        </div>

        <div data-aos="fade-left" className="glass-card flex h-full flex-col p-8 sm:p-10">
          <div className="icon-box mb-6">
            <Eye size={30} />
          </div>
          <h3 className="text-2xl font-bold">{content.vision_title}</h3>
          <p className="mt-4 flex-grow leading-8 text-gray-400">{content.vision_text}</p>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 7 — Company Journey
// ============================================================

function CompanyJourney() {
  const { content } = useSiteContent("timeline", {
    badge_text: "OUR JOURNEY",
    heading_line1: "Milestones That",
    heading_line2: "Shaped Us",
    milestone1_year: "Year 1",
    milestone1_title: "Founded as an IT Support Service",
    milestone1_desc: "Started fixing networks and troubleshooting software for small Karachi offices.",
    milestone2_year: "Year 2",
    milestone2_title: "First Websites & Ecommerce Builds",
    milestone2_desc: "Grew into a five-person team building client websites and stores.",
    milestone3_year: "Year 3",
    milestone3_title: "Custom Software Division Launched",
    milestone3_desc: "Began building CRM, POS, and ERP systems for growing clients.",
    milestone4_year: "Today",
    milestone4_title: "Full-Service Software House",
    milestone4_desc: "Active clients across Pakistan, the UAE, the UK, and the US.",
  });

  const milestones = [1, 2, 3, 4].map((n) => ({
    year: content[`milestone${n}_year`],
    title: content[`milestone${n}_title`],
    desc: content[`milestone${n}_desc`],
  }));

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="timeline" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[5fr_8fr] lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col">
          <Eyebrow>{content.badge_text}</Eyebrow>
          <SectionHeading title1={content.heading_line1} title2={content.heading_line2} />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {milestones.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="text-xs font-bold uppercase tracking-[2px] text-purple-400">
                  {item.year}
                </span>
                <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <AboutSectionVisual
            imageKey="company-journey"
            alt="Key milestones in our journey"
            fallbackIcon={Map}
            fallbackLabel="Our Journey"
            className="mx-auto max-w-[min(100%,800px)]"
          />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[2px] text-purple-300">
              <Globe size={16} /> Serving Clients Across
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Pakistan", "UAE", "UK", "US"].map((country) => (
                <span
                  key={country}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-semibold text-gray-200"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 8 — Company Culture
// ============================================================

function CompanyCulture() {
  const { content } = useSiteContent("company-culture", {
    eyebrow: "OUR CULTURE",
    heading: "Small Enough to Know",
    heading2: "Every Client by Name",
    paragraph:
      "We intentionally maintain a close, accountable working style. The person who understands the system remains connected to the client, which keeps communication clear, decisions practical, and support faster.",
  });

  const title1 = trimDuplicateSuffix(content.heading, content.heading2);

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-left" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={title1} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph}
          </p>
        </div>

        <div data-aos="fade-right">
          <AboutSectionVisual
            imageKey="company-culture"
            alt="A close, accountable team"
            fallbackIcon={HeartHandshake}
            fallbackLabel="Our Culture"
            className="mx-auto max-w-[min(100%,800px)]"
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CULTURE_PRINCIPLES.map(({ icon: Icon, title }) => (
          <div
            key={title}
            data-aos="fade-up"
            className="glass-card flex h-full flex-col items-center p-6 text-center"
          >
            <div className="icon-box mb-5">
              <Icon size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================
// Section 9 — Future Direction
// ============================================================

function FutureDirection() {
  const { content } = useSiteContent("future-goals", {
    eyebrow: "WHERE WE'RE HEADED",
    heading: "Growing Without Losing",
    heading2: "What Got Us Here",
    paragraph:
      "Our goal is to expand our managed support, custom software, cloud, healthcare, logistics, and automation capabilities while preserving the responsiveness, honesty, and technical involvement clients value today.",
    cta_text: "Explore Our Services",
  });

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="heroMinimal" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={content.heading} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph}
          </p>
          <div className="mt-8">
            <Button to="/services" variant="outline" icon={<ArrowRight size={15} />}>
              {content.cta_text}
            </Button>
          </div>
        </div>

        <div data-aos="fade-left">
          <AboutSectionVisual
            imageKey="future-growth"
            alt="Growing together with our clients"
            fallbackIcon={Rocket}
            fallbackLabel="Where We're Headed"
            className="mx-auto max-w-[min(100%,760px)]"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 10 — Why Clients Trust Us
// ============================================================

function ClientTrust() {
  const { content } = useSiteContent("why-clients-trust", {
    eyebrow: "WHY CLIENTS TRUST US",
    heading: "The Same Engineer,",
    heading2: "A Year Later",
    paragraph:
      "Clients should not have to explain their system again every time they need help. We value continuity, transparent commitments, direct communication, and long-term responsibility for the technology we deliver.",
    cta_text: "Start a Conversation",
  });

  return (
    <Section
      className="bg-[#091426] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-left" className="flex flex-col justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <SectionHeading title1={content.heading} title2={content.heading2} />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            {content.paragraph}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TRUST_POINTS.map(({ icon, title, description }) => (
              <FeatureCard key={title} icon={icon} title={title} description={description} />
            ))}
          </div>
          <div className="mt-8">
            <Button to="/contact" variant="primary" icon={<ArrowRight size={15} />}>
              {content.cta_text}
            </Button>
          </div>
        </div>

        <div
          data-aos="fade-right"
          className="relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1627] via-[#111A2E] to-[#0B1220] sm:min-h-[360px] lg:order-first lg:min-h-0"
        >
          <AboutSectionVisual
            imageKey="client-trust"
            alt="Building long-term trust with clients"
            fallbackIcon={ShieldCheck}
            fallbackLabel="Why Clients Trust Us"
            className="absolute inset-0 h-full w-full !object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 11 — Meet Our Team
// ============================================================

function TeamIntro() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="team" />}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>OUR PEOPLE</Eyebrow>
          <SectionHeading title1="Meet the Team" title2="Behind the Work" />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            Our team brings together software engineering, UI/UX design, cloud infrastructure,
            technical support, project planning, and business technology consulting.
          </p>
          <p className="mt-5 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            We stay deliberately small per project so everyone working on your system knows its
            history, its users, and what happens next.
          </p>
          <div className="mt-8">
            <Button to="/contact" variant="primary" icon={<ArrowRight size={15} />}>
              Work With Our Team
            </Button>
          </div>
        </div>

        <div data-aos="fade-left" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEAM_PRINCIPLES.map(({ icon, title, description }) => (
            <FeatureCard key={title} icon={icon} title={title} description={description} className="h-full" />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 12 — Final CTA
// ============================================================

function FinalCta() {
  const { content } = useSiteContent("about-final-cta", {
    eyebrow: "LET'S WORK TOGETHER",
    heading1: "Ready to Build",
    heading2: "Something Useful?",
    paragraph:
      "Whether you need a new digital product, a better internal system, or reliable long-term technology support, our team can help you identify the right next step.",
    primary_text: "Start Your Project",
    secondary_text: "Explore Our Services",
  });

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cta" />}
    >
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900 to-pink-500/20"
        data-aos="zoom-in"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[11fr_10fr] lg:gap-12">
          <div className="p-8 sm:p-12 lg:p-14">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">
              {content.heading1}
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                {content.heading2}
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
              {content.paragraph}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                {content.primary_text}
              </Button>
              <Button to="/services" variant="outline" size="lg">
                {content.secondary_text}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-12 lg:p-14">
            <AboutSectionVisual
              imageKey="final-cta"
              alt="Starting a new project with us"
              fallbackIcon={Rocket}
              fallbackLabel="Let's Work Together"
              className="mx-auto max-w-[min(100%,680px)]"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Full About page
// ============================================================

function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="We started as a small IT support team and grew into a full-service software house — building and supporting the technology your business relies on."
        canonicalPath="/about"
      />
      <AboutHero />
      <CompanyStory />
      <CoreValues />
      <WhyWeStarted />
      <LeadershipPhilosophy />
      <MissionVision />
      <CompanyJourney />
      <CompanyCulture />
      <FutureDirection />
      <ClientTrust />
      <TeamIntro />
      <DynamicPageSections page="about" />
      <FinalCta />
    </>
  );
}

export default About;
