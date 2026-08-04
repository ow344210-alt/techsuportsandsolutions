import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  Archive,
  ArrowRight,
  Bug,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  FileSpreadsheet,
  Frown,
  Globe,
  Headphones,
  Layers,
  Layout,
  LifeBuoy,
  Lightbulb,
  Map as MapIcon,
  MessageSquare,
  MonitorCheck,
  Palette,
  RefreshCw,
  Rocket,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Unplug,
  Users,
  type LucideIcon,
} from "lucide-react";
import { fetchActiveServices } from "../lib/services";
import type { Service } from "../lib/services";
import { fetchActiveIndustries } from "../lib/industries";
import type { Industry } from "../lib/industries";
import { fetchActiveTech } from "../lib/techStack";
import type { TechItem } from "../lib/techStack";
import { getIndustryIcon } from "../lib/industryIcons";
import { useSiteContent } from "../hooks/useSiteContent";
import { useProcessSteps } from "../hooks/useProcessSteps";
import type { ProcessStep } from "../lib/processSteps";
import Section from "./ui/Section";
import SectionIntro from "./ui/SectionIntro";
import Button from "./ui/Button";
import SEO from "./seo/SEO";
import { BackgroundDecorations } from "./background";

// Import all service card images from src/assets using Vite's import.meta.glob.
// This resolves assets at build time and provides hashed URLs for production.
const serviceImageModules = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;

// Section illustrations live in src/assets/services. Both resolve at build time
// via glob. When a named file is not present, sections gracefully fall back to
// a branded gradient panel so the page never shows a broken image.
const sectionImageModules = import.meta.glob(
  "../assets/services/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;

// Normalize a string for matching: lowercase, remove spaces, hyphens, ampersands, punctuation.
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[&\s-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Build a mapping from normalized service title to the imported asset URL.
// Keys are derived from the asset filenames (without extension).
const serviceImageMap: Record<string, string> = {};
for (const [path, url] of Object.entries(serviceImageModules)) {
  const fileName = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const key = normalizeKey(fileName);
  if (key) serviceImageMap[key] = url;
}

// Additional explicit mappings for filenames that don't directly match service titles.
const EXPLICIT_SERVICE_IMAGE_MAP: Record<string, string> = {
  // "App development" -> Mobile App Development
  appdevelopment: serviceImageMap["appdevelopment"] ?? "",
  // "react native" -> Mobile App Development
  reactnative: serviceImageMap["reactnative"] ?? "",
  flutter: serviceImageMap["flutter"] ?? "",
  // "software Development" -> Software Development
  softwaredevelopment: serviceImageMap["softwaredevelopment"] ?? "",
  // "Digital marketing" -> Digital Marketing
  digitalmarketing: serviceImageMap["digitalmarketing"] ?? "",
  // "uiux" -> UI/UX Design
  uiux: serviceImageMap["uiux"] ?? "",
  // "web development" -> Web Development
  webdevelopment: serviceImageMap["webdevelopment"] ?? "",
  // "branding" -> Branding
  branding: serviceImageMap["branding"] ?? "",
  // "google" -> Google Business Optimization
  google: serviceImageMap["google"] ?? "",
  // "cloud" -> Cloud and IT Services
  cloud: serviceImageMap["cloud"] ?? "",
  // "aws" -> Cloud and IT Services (alternative)
  aws: serviceImageMap["aws"] ?? "",
  // "azure" -> Cloud and IT Services (alternative)
  azure: serviceImageMap["azure"] ?? "",
  // "docker" -> Cloud and IT Services (alternative)
  docker: serviceImageMap["docker"] ?? "",
  // "firebase" -> Cloud and IT Services (alternative)
  firebase: serviceImageMap["firebase"] ?? "",
  // "maintenance" -> Maintenance and IT Support
  maintenance: serviceImageMap["maintenance"] ?? "",
  // "itdesk" -> Maintenance and IT Support (alternative)
  itdesk: serviceImageMap["itdesk"] ?? "",
};

function getServiceImage(title: string): string | null {
  const normalized = normalizeKey(title);
  // Try direct match first
  if (serviceImageMap[normalized]) return serviceImageMap[normalized];
  // Try explicit mapping
  if (EXPLICIT_SERVICE_IMAGE_MAP[normalized]) return EXPLICIT_SERVICE_IMAGE_MAP[normalized];
  // Try partial matches for common variations
  if (normalized.includes("mobile") || normalized.includes("app")) {
    return (
      serviceImageMap["appdevelopment"] ??
      serviceImageMap["reactnative"] ??
      serviceImageMap["flutter"] ??
      null
    );
  }
  if (normalized.includes("web")) {
    return serviceImageMap["webdevelopment"] ?? null;
  }
  if (normalized.includes("software")) {
    return serviceImageMap["softwaredevelopment"] ?? null;
  }
  if (normalized.includes("digital") || normalized.includes("marketing")) {
    return serviceImageMap["digitalmarketing"] ?? null;
  }
  if (normalized.includes("ui") || normalized.includes("ux")) {
    return serviceImageMap["uiux"] ?? null;
  }
  if (normalized.includes("brand")) {
    return serviceImageMap["branding"] ?? null;
  }
  if (normalized.includes("google")) {
    return serviceImageMap["google"] ?? null;
  }
  if (normalized.includes("cloud") || normalized.includes("aws") || normalized.includes("azure") || normalized.includes("docker") || normalized.includes("firebase")) {
    return (
      serviceImageMap["cloud"] ??
      serviceImageMap["aws"] ??
      serviceImageMap["azure"] ??
      serviceImageMap["docker"] ??
      serviceImageMap["firebase"] ??
      null
    );
  }
  if (normalized.includes("maintenance") || normalized.includes("support") || normalized.includes("itdesk")) {
    return serviceImageMap["maintenance"] ?? serviceImageMap["itdesk"] ?? null;
  }
  return null;
}

// Asset key derived from a filename: strips the extension and every
// non-alphanumeric character. This makes lookups tolerant of naming quirks
// such as "managed-it-suppor.png" vs "managed-it-support.png" and the
// double-dot "circuit-pattern..png".
function assetKey(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Normalized lookup maps built from the glob results above.
const SERVICES_IMAGE_MAP: Record<string, string> = {};
for (const [path, url] of Object.entries(sectionImageModules)) {
  const fileName = path.split("/").pop() ?? "";
  const key = assetKey(fileName);
  if (key) SERVICES_IMAGE_MAP[key] = url;
}

// Alternate spellings that map to the same logical asset. The supplied asset
// list uses "managed-it-suppor.png" (missing the trailing "t"); the canonical
// name used across the page is "managed-it-support". Both resolve.
const SERVICE_IMAGE_ALIASES: Record<string, string[]> = {
  manageditsupport: ["manageditsuppor"],
};


// Resolve a service illustration by its section key, falling back to the
// alternate spelling when the primary file is absent.
function resolveServiceImage(imageKey: string): string | null {
  const key = assetKey(imageKey);
  if (SERVICES_IMAGE_MAP[key]) return SERVICES_IMAGE_MAP[key];
  for (const alias of SERVICE_IMAGE_ALIASES[key] ?? []) {
    if (SERVICES_IMAGE_MAP[alias]) return SERVICES_IMAGE_MAP[alias];
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

// Main section visuals keep their natural aspect ratio (every service
// illustration is 1536x1024). They are never stretched to fill a column:
// width is 100%, height is auto, and object-fit stays "contain" so the
// natural proportions are always preserved.
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
  const src = resolveServiceImage(imageKey);
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
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className={`h-auto w-full rounded-3xl object-contain ${className}`}
    />
  );
}

// ============================================================
// Data
// ============================================================

const CHALLENGES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Archive,
    title: "Outdated Systems",
    description:
      "Legacy tools become harder to maintain, slower to use, and more expensive as the business grows.",
  },
  {
    icon: FileSpreadsheet,
    title: "Repetitive Manual Work",
    description:
      "Teams lose valuable time copying data, managing spreadsheets, and repeating tasks that can be automated.",
  },
  {
    icon: Frown,
    title: "Poor Customer Experience",
    description:
      "Slow websites, confusing interfaces, and inconsistent communication reduce trust and conversions.",
  },
  {
    icon: Unplug,
    title: "Disconnected Business Tools",
    description:
      "Separate platforms create duplicate work, reporting gaps, and limited visibility across operations.",
  },
  {
    icon: ShieldAlert,
    title: "Security and Data Risk",
    description:
      "Weak access controls, outdated software, and poor monitoring expose businesses to avoidable threats.",
  },
  {
    icon: Headphones,
    title: "Limited Technical Support",
    description:
      "Without reliable support, small issues become expensive interruptions and long-term performance problems.",
  },
];

const APPROACH_PRINCIPLES: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Target, title: "Business Before Technology" },
  { icon: MessageSquare, title: "Clear Recommendations" },
  { icon: Users, title: "Transparent Communication" },
  { icon: TrendingUp, title: "Long-Term Thinking" },
];

const SUPPORT_BENEFITS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: MonitorCheck, title: "Performance Monitoring" },
  { icon: ShieldCheck, title: "Security Updates" },
  { icon: Bug, title: "Bug Fixes" },
  { icon: Headphones, title: "Technical Assistance" },
  { icon: RefreshCw, title: "Ongoing Improvements" },
  { icon: TrendingUp, title: "Growth Planning" },
];

// Compact supporting content placed under main images so each split section
// keeps balanced visual weight without stretching the illustration.
const HERO_SERVICES: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Layout, title: "Custom Software" },
  { icon: Smartphone, title: "Web & Mobile Apps" },
  { icon: Cloud, title: "Cloud & IT Support" },
];

const CHALLENGE_IMPACTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: TrendingUp, title: "Lost Time and Efficiency" },
  { icon: Frown, title: "Weakened Customer Trust" },
  { icon: ShieldAlert, title: "Avoidable Security Risk" },
];

const TECH_POINTS: Array<{ icon: LucideIcon; title: string }> = [
  { icon: ShieldCheck, title: "Security-First Selection" },
  { icon: Layers, title: "Maintainable Architecture" },
  { icon: RefreshCw, title: "Easy to Extend and Upgrade" },
  { icon: TrendingUp, title: "Scalable as You Grow" },
];

const INDUSTRY_INSIGHTS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Target,
    title: "Workflows That Fit",
    text: "Solutions shaped around how your industry actually operates.",
  },
  {
    icon: TrendingUp,
    title: "Reporting That Matters",
    text: "Dashboards built around the metrics your industry tracks.",
  },
];

const FALLBACK_PROCESS_STEPS: Array<{ title: string; purpose: string }> = [
  { title: "Discovery", purpose: "Understand goals, users, challenges, and existing systems." },
  { title: "Research", purpose: "Validate requirements, technical options, and project constraints." },
  { title: "Planning", purpose: "Define scope, milestones, architecture, and delivery priorities." },
  { title: "Design", purpose: "Create wireframes, user flows, and polished interfaces." },
  { title: "Development", purpose: "Build the approved solution using maintainable technologies." },
  { title: "Testing", purpose: "Verify usability, performance, compatibility, and reliability." },
  { title: "Deployment", purpose: "Launch safely and confirm the system works in production." },
  { title: "Ongoing Support", purpose: "Monitor, maintain, improve, and scale the solution over time." },
];

const TECH_GROUP_META: Array<{ title: string; icon: LucideIcon; test: RegExp }> = [
  { title: "Frontend", icon: Layout, test: /front/i },
  { title: "Backend", icon: Server, test: /back/i },
  { title: "Mobile", icon: Smartphone, test: /mobile/i },
  { title: "Database", icon: Database, test: /database|db/i },
  { title: "Cloud & DevOps", icon: Cloud, test: /cloud|devops|infra|hosting/i },
  { title: "Design & Collaboration", icon: Palette, test: /design|collab/i },
];

const FALLBACK_TECH_GROUPS: Array<{ title: string; items: string[] }> = [
  { title: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { title: "Backend", items: ["Node.js", "Laravel", "Django", "NestJS"] },
  { title: "Mobile", items: ["Flutter", "React Native"] },
  { title: "Database", items: ["PostgreSQL", "MySQL", "MongoDB", "Supabase"] },
  { title: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "Vercel"] },
  { title: "Design & Collaboration", items: ["Figma", "Notion", "Jira"] },
];

function groupTechItems(items: TechItem[]): Array<{ title: string; items: string[] }> {
  const grouped = new Map<string, string[]>();
  for (const item of items) {
    const meta = TECH_GROUP_META.find((group) => group.test.test(item.category));
    const title = meta ? meta.title : item.category.trim() || "Other";
    const list = grouped.get(title) ?? [];
    list.push(item.name);
    grouped.set(title, list);
  }

  const ordered: Array<{ title: string; items: string[] }> = [];
  for (const meta of TECH_GROUP_META) {
    const list = grouped.get(meta.title);
    if (list) {
      ordered.push({ title: meta.title, items: list });
      grouped.delete(meta.title);
    }
  }
  for (const [title, items] of grouped) {
    ordered.push({ title, items });
  }
  return ordered;
}

const FALLBACK_INDUSTRIES: string[] = [
  "Retail & Ecommerce",
  "Healthcare",
  "Real Estate",
  "Education",
  "Logistics",
  "Finance",
  "Manufacturing",
  "Restaurants",
];

// ============================================================
// Premium service cards + opposing two-row carousel
// ============================================================

const CAROUSEL_MS = 800;
const CAROUSEL_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const AUTOPLAY_MS = 5000;

// Fallback description derived from the service title only, so a missing
// description never empties the card or invents unsupported claims.
function getCardDescription(item: Service): string {
  const trimmed = item.description?.trim();
  if (trimmed) return trimmed;
  const label = item.title.trim().toLowerCase() || "technology";
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} services delivered by our team.`;
}

function ServiceCard({
  item,
  ctaTo,
  ctaLabel,
}: {
  item: Service;
  ctaTo: string;
  ctaLabel: string;
}) {
  const cmsImageUrl = item.image_url?.trim() ? item.image_url : null;
  const localImageUrl = getServiceImage(item.title);
  const imageUrl = cmsImageUrl ?? localImageUrl;

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_10px_40px_-24px_rgba(2,6,23,0.9)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-purple-500/40 hover:shadow-[0_24px_48px_-24px_rgba(168,85,247,0.45)]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-600/40 to-pink-600/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122]/90 via-[#0a1122]/10 to-transparent" />
        {item.category ? (
          <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-200 backdrop-blur-sm">
            {item.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6 pt-5">
        <h3 className="text-lg font-bold leading-snug text-white">{item.title}</h3>
        <span
          aria-hidden="true"
          className="h-[3px] w-12 shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <p className="line-clamp-4 text-sm leading-6 text-gray-300">{getCardDescription(item)}</p>
        <Button
          to={ctaTo}
          variant="primary"
          size="sm"
          fullWidth
          icon={<ArrowRight size={16} />}
          className="mt-auto"
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  );
}

type Direction = 1 | -1;

interface CarouselBreakpoint {
  visible: number;
  gap: number;
}

function getCarouselBreakpoint(width: number): CarouselBreakpoint {
  if (width >= 1280) return { visible: 4, gap: 24 };
  if (width >= 768) return { visible: 2, gap: 16 };
  return { visible: 1, gap: 12 };
}

// Measures the shared container so both rows use identical card widths and
// translate distances. Card width is derived from the viewport width, the
// visible-card count, and the gap — never hardcoded.
function useCarouselMeasure(): {
  containerRef: (el: HTMLDivElement | null) => void;
  breakpoint: CarouselBreakpoint;
  cardWidth: number;
  unit: number;
} {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  const breakpoint = getCarouselBreakpoint(width);
  const cardWidth =
    width > 0 ? (width - breakpoint.gap * (breakpoint.visible - 1)) / breakpoint.visible : 0;
  const unit = cardWidth + breakpoint.gap;

  return { containerRef: setNode, breakpoint, cardWidth, unit };
}

// Distribute services between the two rows (even indexes to the first row,
// odd indexes to the second), then rebalance so no row is starved.
function distributeServices(services: Service[]): { first: Service[]; second: Service[] } {
  const first: Service[] = [];
  const second: Service[] = [];
  services.forEach((service, index) => {
    (index % 2 === 0 ? first : second).push(service);
  });
  while (first.length > second.length + 1 && second.length > 0) {
    second.push(first.pop() as Service);
  }
  while (second.length > first.length + 1 && first.length > 0) {
    first.push(second.pop() as Service);
  }
  return { first, second };
}

type TrackEntry = { item: Service; id: string; clone: boolean };

// Clone-reset track: leading clones, the real cards, then trailing clones.
// Track positions are periodic with period N (a card and its Nth successor
// show the same service), so snapping at the wrap point is visually seamless.
function buildTrack(services: Service[], visible: number): TrackEntry[] {
  const leading = services.slice(-visible).map((service) => ({
    item: service,
    id: `lead-${service.id}`,
    clone: true,
  }));
  const real = services.map((service) => ({ item: service, id: service.id, clone: false }));
  const trailing = services.slice(0, visible).map((service) => ({
    item: service,
    id: `trail-${service.id}`,
    clone: true,
  }));
  return [...leading, ...real, ...trailing];
}

// Advance one row by one card width. The window position `w` is a track index.
// Forward (dir 1) walks w upward until the trailing clones match the leading
// window; reverse (dir -1) walks w downward until the leading clones match the
// real window. Snap points land on visually identical states, so disabling the
// transition there is invisible.
function stepPosition(
  position: { w: number; animate: boolean },
  dir: Direction,
  count: number,
  visible: number,
): { w: number; animate: boolean } {
  if (dir === 1) {
    const snap = position.w === visible + count;
    return { w: snap ? visible : position.w + 1, animate: !snap };
  }
  const snap = position.w === 0;
  return { w: snap ? count : position.w - 1, animate: !snap };
}

function ServicesCarouselRow({
  services,
  ctaTo,
  ctaLabel,
  breakpoint,
  cardWidth,
  unit,
  position,
  label,
}: {
  services: Service[];
  ctaTo: string;
  ctaLabel: string;
  breakpoint: CarouselBreakpoint;
  cardWidth: number;
  unit: number;
  position: { w: number; animate: boolean };
  label: string;
}) {
  const track = useMemo(
    () => buildTrack(services, breakpoint.visible),
    [services, breakpoint.visible],
  );

  return (
    <div className="relative" role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="overflow-x-clip px-2 pt-6 pb-10">
        <div
          className="flex"
          style={{
            gap: breakpoint.gap,
            transform: `translate3d(${-position.w * unit}px, 0, 0)`,
            transition: position.animate
              ? `transform ${CAROUSEL_MS}ms ${CAROUSEL_EASING}`
              : "none",
            willChange: "transform",
          }}
        >
          {track.map((entry) => (
            <div
              key={entry.id}
              id={entry.clone ? undefined : `service-${entry.item.id}`}
              className="flex-none"
              style={{ width: cardWidth }}
              aria-hidden={entry.clone || undefined}
              inert={entry.clone || undefined}
            >
              <ServiceCard item={entry.item} ctaTo={ctaTo} ctaLabel={ctaLabel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesStaticGrid({
  services,
  ctaTo,
  ctaLabel,
}: {
  services: Service[];
  ctaTo: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {services.map((service) => (
        <div
          key={service.id}
          id={`service-${service.id}`}
          className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)]"
        >
          <ServiceCard item={service} ctaTo={ctaTo} ctaLabel={ctaLabel} />
        </div>
      ))}
    </div>
  );
}

// Two opposing carousel rows driven by a single synchronized 5s timer.
// Row A moves right-to-left (forward); row B moves left-to-right (reverse).
function CarouselSlider({
  first,
  second,
  ctaTo,
  ctaLabel,
  breakpoint,
  cardWidth,
  unit,
  paused,
  focusId,
}: {
  first: Service[];
  second: Service[];
  ctaTo: string;
  ctaLabel: string;
  breakpoint: CarouselBreakpoint;
  cardWidth: number;
  unit: number;
  paused: boolean;
  focusId?: string;
}) {
  const [rows, setRows] = useState<{
    a: { w: number; animate: boolean };
    b: { w: number; animate: boolean };
  }>({
    a: { w: breakpoint.visible, animate: false },
    b: { w: breakpoint.visible, animate: false },
  });
  const [resetKey, setResetKey] = useState(0);

  const advance = useCallback(
    (dir: Direction) => {
      setRows((prev) => ({
        a: stepPosition(prev.a, dir, first.length, breakpoint.visible),
        b: stepPosition(prev.b, dir === 1 ? -1 : 1, second.length, breakpoint.visible),
      }));
    },
    [first.length, second.length, breakpoint.visible],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => advance(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, resetKey, advance]);

  const go = useCallback(
    (dir: Direction) => {
      setResetKey((key) => key + 1);
      advance(dir);
    },
    [advance],
  );

  const lastFocusIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!focusId) return;
    if (lastFocusIdRef.current === focusId) return;
    const targetInFirst = first.findIndex((s) => `service-${s.id}` === focusId);
    const targetInSecond = second.findIndex((s) => `service-${s.id}` === focusId);
    if (targetInFirst === -1 && targetInSecond === -1) return;

    lastFocusIdRef.current = focusId;

    setTimeout(() => {
      setRows((prev) => {
        const next = { ...prev };
        if (targetInFirst !== -1) {
          const snapW = breakpoint.visible + targetInFirst;
          if (next.a.w !== snapW) {
            next.a = { w: snapW, animate: false };
          }
        }
        if (targetInSecond !== -1) {
          const snapW = breakpoint.visible + targetInSecond;
          if (next.b.w !== snapW) {
            next.b = { w: snapW, animate: false };
          }
        }
        return next;
      });

      const el = document.getElementById(focusId);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }, 0);
  }, [focusId, first, second, breakpoint.visible]);

  return (
    <div className="relative space-y-10">
      <ServicesCarouselRow
        services={first}
        ctaTo={ctaTo}
        ctaLabel={ctaLabel}
        breakpoint={breakpoint}
        cardWidth={cardWidth}
        unit={unit}
        position={rows.a}
        label="Services carousel moving right to left"
      />
      <ServicesCarouselRow
        services={second}
        ctaTo={ctaTo}
        ctaLabel={ctaLabel}
        breakpoint={breakpoint}
        cardWidth={cardWidth}
        unit={unit}
        position={rows.b}
        label="Services carousel moving left to right"
      />

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous services"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 transition hover:border-purple-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next services"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 transition hover:border-purple-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function ServicesOpposingSlider({
  services,
  ctaTo,
  ctaLabel,
  focusId,
}: {
  services: Service[];
  ctaTo: string;
  ctaLabel: string;
  focusId?: string;
}) {
  const { containerRef, breakpoint, cardWidth, unit } = useCarouselMeasure();
  const { first, second } = useMemo(() => distributeServices(services), [services]);

  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const paused = reducedMotion || hovering || focused || touching || tabHidden;

  if (reducedMotion || services.length <= 4) {
    return <ServicesStaticGrid services={services} ctaTo={ctaTo} ctaLabel={ctaLabel} />;
  }

  const dataKey = `${first.map((service) => service.id).join("|")}::${second
    .map((service) => service.id)
    .join("|")}::${breakpoint.visible}`;

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={() => setTouching(false)}
    >
      {cardWidth > 0 ? (
        <CarouselSlider
          key={dataKey}
          first={first}
          second={second}
          ctaTo={ctaTo}
          ctaLabel={ctaLabel}
          breakpoint={breakpoint}
          cardWidth={cardWidth}
          unit={unit}
          paused={paused}
          focusId={focusId}
        />
      ) : (
        <div className="py-4" />
      )}
    </div>
  );
}

function ServicesCtaCard({ content }: { content: Record<string, string> }) {
  return (
    <div
      className="mt-16 flex flex-col gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
      data-aos="fade-up"
    >
      <div>
        <h3 className="text-2xl font-bold sm:text-3xl">{content.cta_heading}</h3>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">{content.cta_paragraph}</p>
      </div>
      <Button
        to="/contact"
        variant="primary"
        size="lg"
        icon={<ArrowRight size={18} />}
        className="shrink-0 self-start lg:self-auto"
      >
        {content.cta_btn_text}
      </Button>
    </div>
  );
}

// ============================================================
// Section 1 — Services Hero
// ============================================================

function scrollToServicesList() {
  const target = document.getElementById("services-list");
  if (!target) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

function ServicesHero() {
  return (
    <Section className="bg-[#07101D] pt-20 pb-12 text-white md:pt-24 md:pb-16 lg:pt-28" decoration={<BackgroundDecorations preset="hero" density="rich" />}>
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>OUR EXPERTISE</Eyebrow>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Technology That Solves
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Real Business Problems
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            Every growing business eventually reaches a point where outdated tools, disconnected
            systems, or manual processes begin to slow progress. We design practical digital
            solutions that simplify operations, improve customer experiences, and give teams the
            technology they need to scale with confidence.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Discuss Your Project
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToServicesList}>
              Explore Our Services
            </Button>
          </div>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <SectionVisual
            imageKey="hero-business-technology"
            alt="Business technology solutions that help enterprises scale"
            fallbackIcon={Rocket}
            fallbackLabel="Business Technology"
            eager
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HERO_SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 sm:flex-col sm:gap-2 sm:px-3 sm:py-4 sm:text-center"
                >
                  <Icon size={18} className="shrink-0 text-purple-300" />
                  <span className="text-xs font-semibold text-gray-200">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 2 — Services Introduction
// ============================================================

function ServicesIntroduction() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>WHY TECHNOLOGY MATTERS</Eyebrow>
          <SectionHeading title1="Technology Should Create" title2="Opportunities, Not Obstacles" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Many businesses lose time and revenue because their tools do not work together and
            important tasks still depend on manual effort. We replace that friction with technology
            that is easier to manage, easier to use, and aligned with how your business already
            works.
          </p>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Talk to a Technology Consultant
          </Button>
        </div>

        <div data-aos="fade-left">
          <SectionVisual
            imageKey="digital-transformation"
            alt="Digital transformation improving how businesses operate"
            fallbackIcon={Sparkles}
            fallbackLabel="Digital Transformation"
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 3 — Existing Service Cards
// ============================================================

function ServicesCardsSection({
  services,
  loading,
  error,
  content,
  focusId,
}: {
  services: Service[];
  loading: boolean;
  error: boolean;
  content: Record<string, string>;
  focusId?: string;
}) {
  return (
    <Section
      id="services-list"
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="heroMinimal" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div data-aos="fade-up" className="flex flex-col justify-center">
          <Eyebrow>WHAT WE BUILD</Eyebrow>
          <SectionHeading
            title1="Complete Technology Services"
            title2="Under One Trusted Partner"
          />
          <p className="mt-6 max-w-2xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            From customer-facing websites and mobile applications to internal software, branding,
            digital growth, and managed IT support, our services are designed to work together as
            your business evolves.
          </p>
        </div>

        <div className="hidden lg:block" data-aos="fade-up">
          <SectionVisual
            imageKey="complete-solutions"
            alt="A complete set of technology services delivered by one partner"
            fallbackIcon={Layers}
            fallbackLabel="Complete Solutions"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="glass-card animate-pulse p-8">
              <div className="mb-8 h-14 w-14 rounded-xl bg-white/5" />
              <div className="h-6 w-2/3 rounded bg-white/5" />
              <div className="mt-4 h-4 w-full rounded bg-white/5" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="mt-12 mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 px-8 py-14 text-center backdrop-blur-xl">
          <p className="text-xl font-bold text-white">
            {error ? "Services are temporarily unavailable." : "No services available yet."}
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {error
              ? "We could not load our services right now. Please check back shortly."
              : "Services published from the admin panel will appear here."}
          </p>
        </div>
      ) : (
        <div className="mt-12">
          <ServicesOpposingSlider services={services} ctaTo="/contact" ctaLabel="Request This Service" focusId={focusId} />
        </div>
      )}

      <ServicesCtaCard content={content} />
    </Section>
  );
}

// ============================================================
// Section 4 — Business Challenges
// ============================================================

function BusinessChallenges() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="grid" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>THE PROBLEMS WE SOLVE</Eyebrow>
          <SectionHeading
            title1="Common Technology Challenges"
            title2="That Hold Businesses Back"
          />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            Technology problems rarely remain isolated. A slow website affects trust, disconnected
            systems waste employee time, poor security increases risk, and unreliable support
            interrupts daily operations. We help businesses identify these issues and replace them
            with practical, scalable solutions.
          </p>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Discuss Your Current Challenges
          </Button>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <SectionVisual
            imageKey="business-challenges"
            alt="Common technology problems that slow businesses down"
            fallbackIcon={ShieldAlert}
            fallbackLabel="Business Challenges"
          />
          <div className="grid gap-3">
            {CHALLENGE_IMPACTS.map((impact) => {
              const Icon = impact.icon;
              return (
                <div
                  key={impact.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-gray-100">{impact.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map((challenge) => {
          const Icon = challenge.icon;
          return (
            <div
              key={challenge.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-purple-400/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{challenge.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{challenge.description}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ============================================================
// Section 5 — Our Approach
// ============================================================

function OurApproach() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="heroMinimal" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>HOW WE WORK</Eyebrow>
          <SectionHeading
            title1="Every Solution Starts"
            title2="With Understanding Your Business"
          />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Before recommending technology, we learn how your business operates, where your team is
            losing time, what your customers expect, and which outcomes matter most.
          </p>
          <p className="mt-5 text-left leading-7 text-gray-400 md:text-justify">
            This allows us to build a solution around real workflows and priorities instead of
            forcing your business into a generic system.
          </p>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Start a Discovery Conversation
          </Button>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <SectionVisual
            imageKey="technology-consultation"
            alt="Technology consultants learning how a business operates"
            fallbackIcon={Lightbulb}
            fallbackLabel="Technology Consultation"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {APPROACH_PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <div
                  key={principle.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-gray-100">{principle.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 6 — Development Process
// ============================================================

function DevelopmentProcess({
  steps,
  stepsLoading,
}: {
  steps: ProcessStep[];
  stepsLoading: boolean;
}) {
  const displayed =
    steps.length > 0
      ? steps.slice(0, FALLBACK_PROCESS_STEPS.length).map((step) => ({
          title: step.title,
          purpose: step.purpose,
        }))
      : FALLBACK_PROCESS_STEPS;

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="grid" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>OUR PROCESS</Eyebrow>
          <SectionHeading title1="A Structured Path" title2="From Idea to Launch" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            A clear process reduces risk, improves communication, and keeps every project focused on
            the intended business outcome. Each phase builds on the previous one, so decisions are
            made with better information and fewer surprises.
          </p>
          <Button to="/process" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            View Our Full Process
          </Button>
        </div>

        <div data-aos="fade-left">
          <SectionVisual
            imageKey="development-workflow"
            alt="A structured development workflow from idea to launch"
            fallbackIcon={MapIcon}
            fallbackLabel="Development Workflow"
          />
        </div>
      </div>

      {stepsLoading ? (
        <div className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <ol className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {displayed.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 text-xs font-bold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-gray-400">{step.purpose}</p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

// ============================================================
// Section 7 — Technology Stack
// ============================================================

function TechnologyStackSection({
  techItems,
  techLoading,
}: {
  techItems: TechItem[];
  techLoading: boolean;
}) {
  const groups =
    techLoading || techItems.length === 0 ? FALLBACK_TECH_GROUPS : groupTechItems(techItems);

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="grid" />}
    >
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>TECHNOLOGY WITH PURPOSE</Eyebrow>
          <SectionHeading title1="Modern Tools Selected" title2="For Reliability and Growth" />
          <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
            We choose technologies according to the project's actual needs, not short-term trends.
            Every choice is documented and evaluated for security, maintainability, and scalability.
          </p>
          <p className="mt-5 text-left leading-7 text-gray-400 md:text-justify">
            The result is a system that is practical to operate, easy to extend, and positioned to
            grow with your business rather than lock it into an older stack.
          </p>
          <p className="mt-5 text-left leading-7 text-gray-400 md:text-justify">
            Every technology we adopt is backed by an active community, long-term support, and a
            clear upgrade path. This means fewer surprises in production, faster onboarding for your
            team, and reduced risk when your platform needs to evolve.
          </p>
          <p className="mt-5 text-left leading-7 text-gray-400 md:text-justify">
            Whether you are launching a new product or modernizing an existing system, we select the
            tools and architecture that match your budget, your team's skills, and your long-term
            goals — so your investment keeps working for you well beyond launch day.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {TECH_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                    <Icon size={17} />
                  </span>
                  <span className="text-sm font-semibold text-gray-100">{point.title}</span>
                </div>
              );
            })}
          </div>

          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Discuss Your Technology Needs
          </Button>
        </div>

        <div data-aos="fade-left">
          <SectionVisual
            imageKey="technology-ecosystem"
            alt="An ecosystem of modern, reliable technologies"
            fallbackIcon={Layers}
            fallbackLabel="Technology Ecosystem"
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {groups.map((group) => {
              const meta = TECH_GROUP_META.find((item) => item.title === group.title);
              const Icon = meta?.icon ?? Layers;
              return (
                <div
                  key={group.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                      <Icon size={17} />
                    </span>
                    <h3 className="text-sm font-bold text-white">{group.title}</h3>
                  </div>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {group.items.map((name) => (
                      <span
                        key={name}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-gray-300"
                      >
                        {name}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Section 8 — Industries
// ============================================================

function IndustriesSection({
  industries,
  industriesLoading,
}: {
  industries: Industry[];
  industriesLoading: boolean;
}) {
  const displayed = industriesLoading
    ? null
    : industries.length > 0
      ? industries.map((industry) => industry.name)
      : FALLBACK_INDUSTRIES;

  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="splitRight" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>INDUSTRY EXPERIENCE</Eyebrow>
          <SectionHeading
            title1="Solutions Designed Around"
            title2="How Your Industry Operates"
          />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Different industries require different workflows, customer experiences, reporting needs,
            and levels of technical support. We adapt our solutions to the way each business
            operates instead of applying the same model everywhere.
          </p>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Find the Right Solution
          </Button>
        </div>

        <div data-aos="fade-left" className="flex flex-col gap-6">
          <SectionVisual
            imageKey="industries-solutions"
            alt="Solutions designed around how each industry operates"
            fallbackIcon={Globe}
            fallbackLabel="Industry Solutions"
          />
          <div className="grid gap-4">
            {INDUSTRY_INSIGHTS.map((insight) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-bold text-white">{insight.title}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {displayed ? (
        <div className="mt-16 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {displayed.map((name, index) => (
            <div
              key={`${name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                {createElement(getIndustryIcon(name), { size: 16 })}
              </span>
              <span className="text-sm font-semibold text-gray-200">{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/5" />
          ))}
        </div>
      )}
    </Section>
  );
}

// ============================================================
// Section 9 — Long-Term Support
// ============================================================

function LongTermSupport() {
  return (
    <Section
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <Eyebrow>BEYOND THE LAUNCH</Eyebrow>
          <SectionHeading title1="Technology Support" title2="That Continues After Delivery" />
          <p className="mt-6 text-left text-lg leading-8 text-gray-400 md:text-justify">
            Launching a website or application is only the beginning. Systems require updates,
            monitoring, maintenance, security improvements, and ongoing adjustments as the business
            changes.
          </p>
          <p className="mt-5 text-left leading-7 text-gray-400 md:text-justify">
            Our support services keep your technology reliable, secure, and useful long after the
            initial project is complete.
          </p>
          <Button to="/contact" variant="primary" size="md" icon={<ArrowRight size={18} />} className="mt-8">
            Explore Ongoing Support
          </Button>
        </div>

        <div data-aos="fade-left">
          <SectionVisual
            imageKey="managed-it-support"
            alt="Managed IT support keeping systems reliable after launch"
            fallbackIcon={LifeBuoy}
            fallbackLabel="Managed IT Support"
          />
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20">
                <Icon size={18} className="text-white" />
              </span>
              <span className="text-sm font-semibold text-gray-100">{benefit.title}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ============================================================
// Section 10 — Final CTA
// ============================================================

function FinalCta() {
  return (
    <Section className="bg-[#07101D] text-white" decoration={<BackgroundDecorations preset="cta" />}>
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900 to-pink-500/20 p-8 backdrop-blur-xl sm:p-12 lg:p-16"
        data-aos="zoom-in"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <Eyebrow>LET'S MOVE FORWARD</Eyebrow>
            <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">
              Ready to Build Technology
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                That Works for Your Business?
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-left text-lg leading-8 text-gray-400 md:text-justify">
              Whether you are starting a new project, improving an existing system, or looking for
              reliable ongoing support, our team is ready to help you identify the right next step.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                Start Your Project
              </Button>
              <Button to="/process" variant="outline" size="lg">
                View Our Process
              </Button>
            </div>
          </div>

          <div className="hidden sm:block">
            <SectionVisual
              imageKey="project-consultation"
              alt="Consultation on starting a new technology project"
              fallbackIcon={Code2}
              fallbackLabel="Project Consultation"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// Full Services page (standalone)
// ============================================================

function ServicesPageContent({
  services,
  loading,
  error,
  content,
  focusId,
}: {
  services: Service[];
  loading: boolean;
  error: boolean;
  content: Record<string, string>;
  focusId?: string;
}) {
  const { steps, loading: stepsLoading } = useProcessSteps();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [techItems, setTechItems] = useState<TechItem[]>([]);
  const [techLoading, setTechLoading] = useState(true);

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

    fetchActiveTech()
      .then((data) => {
        if (isMounted) setTechItems(data);
      })
      .catch(() => {
        // Silently ignore
      })
      .finally(() => {
        if (isMounted) setTechLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="Services"
        description="Explore our technology solutions — custom web development, mobile apps, cloud infrastructure, cybersecurity, and IT consulting for growing businesses."
        canonicalPath="/services"
      />
      <ServicesHero />
      <ServicesIntroduction />
      <ServicesCardsSection services={services} loading={loading} error={error} content={content} focusId={focusId} />
      <BusinessChallenges />
      <OurApproach />
      <DevelopmentProcess steps={steps} stepsLoading={stepsLoading} />
      <TechnologyStackSection techItems={techItems} techLoading={techLoading} />
      <IndustriesSection industries={industries} industriesLoading={industriesLoading} />
      <LongTermSupport />
      <FinalCta />
    </>
  );
}

// ============================================================
// Root component — used as a preview section on Home and as the
// full Services page (standalone) rendered with Navbar + Footer.
// ============================================================

function Services({ standalone = true }: { standalone?: boolean }) {
  const location = useLocation();
  const focusId = location.hash.startsWith("#service-") ? location.hash.slice(1) : undefined;
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { content } = useSiteContent("services", {
    badge_text: "OUR SERVICES",
    heading_line1: "Technology Solutions",
    heading_line2: "Built For Growth",
    subheading: "From IT consulting to cybersecurity, cloud infrastructure and custom software, we help businesses work faster, stay secure and grow with confidence through reliable technology solutions.",
    learn_more_text: "Learn More",
    cta_heading: "Need a Custom IT Solution?",
    cta_paragraph: "Every business has unique requirements. Let's discuss your goals and create a customized technology solution that helps your business succeed.",
    cta_btn_text: "Start Your Project",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const data = await fetchActiveServices();
        if (isMounted) {
          setServices(data);
          setError(false);
        }
      } catch (fetchError) {
        if (isMounted) setError(true);
        if (import.meta.env.DEV) {
          console.error("Failed to load services from Supabase:", fetchError);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  if (standalone) {
    return <ServicesPageContent services={services} loading={loading} error={error} content={content} focusId={focusId} />;
  }

  return (
    <Section
      id="services"
      className="bg-[#07101D] text-white"
      decoration={<BackgroundDecorations preset="cards" />}
    >
      <div
        className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
      >
        <SectionIntro
          eyebrow={content.badge_text}
          title1={content.heading_line1}
          title2={content.heading_line2}
          description={content.subheading}
          className="max-w-3xl"
        />
        {!standalone && (
          <Button
            to="/services"
            variant="outline"
            size="md"
            icon={<ArrowRight size={18} />}
            className="shrink-0 self-start lg:self-auto"
          >
            View All Services
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="glass-card animate-pulse p-8">
              <div className="mb-8 h-14 w-14 rounded-xl bg-white/5" />
              <div className="h-6 w-2/3 rounded bg-white/5" />
              <div className="mt-4 h-4 w-full rounded bg-white/5" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 px-8 py-14 text-center backdrop-blur-xl">
          <p className="text-xl font-bold text-white">
            {error ? "Services are temporarily unavailable." : "No services available yet."}
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {error
              ? "We could not load our services right now. Please check back shortly."
              : "Services published from the admin panel will appear here."}
          </p>
        </div>
      ) : (
        <ServicesOpposingSlider services={services} ctaTo="/services" ctaLabel={content.learn_more_text} />
      )}

      <ServicesCtaCard content={content} />
    </Section>
  );
}

export default Services;
