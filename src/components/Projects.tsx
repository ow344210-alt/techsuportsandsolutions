import { useEffect, useState } from "react";
import { Code, ExternalLink } from "lucide-react";
import { fetchActiveProjects } from "../lib/projects";
import type { Project } from "../lib/projects";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import SEO from "./seo/SEO";

const CATEGORIES = ["All", "Web Development", "Mobile App", "Software Solution", "Digital Marketing", "Automation", "IT Consulting", "E-Commerce", "SaaS", "Other"] as const;

// Honest fallback shown only when no projects are published yet.
// CMS content always takes priority over this list.
const FALLBACK_PROJECTS: Project[] = [
  {
    id: "fallback-1",
    title: "Business Website with Local SEO",
    description:
      "A fast, conversion-focused marketing website paired with a fully optimised Google Business profile, built to turn local searches into enquiries.",
    category: "Web Development",
    technologies: ["React", "Tailwind", "SEO"],
    image_url: null,
    live_url: null,
    github_url: null,
    status: "Published",
    is_active: true,
    order_index: 0,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-2",
    title: "Mobile App for Service Booking",
    description:
      "A cross-platform booking app with customer profiles, scheduling and payment — designed around how customers actually use the service.",
    category: "Mobile App",
    technologies: ["React Native", "Supabase"],
    image_url: null,
    live_url: null,
    github_url: null,
    status: "Published",
    is_active: true,
    order_index: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-3",
    title: "Custom CRM & Inventory System",
    description:
      "A custom system that replaced scattered spreadsheets with one clear workflow for clients, orders and stock — with role-based access for the whole team.",
    category: "Software Solution",
    technologies: ["React", "TypeScript", "PostgreSQL"],
    image_url: null,
    live_url: null,
    github_url: null,
    status: "Published",
    is_active: true,
    order_index: 2,
    created_at: "",
    updated_at: "",
  },
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1a] transition-all duration-500 hover:border-purple-500/40 hover:-translate-y-1" data-aos="fade-up">
      <div className="relative">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="aspect-[16/10] w-full object-contain bg-[#0b0f1a] transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="aspect-[16/10] w-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-pink-500/10">
            <Code size={48} className="text-white/30" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-block border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">{project.category}</span>
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {project.technologies.slice(0, 3).map((tech) => (
                <span key={tech} className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-300">{tech}</span>
              ))}
            </div>
          )}
        </div>

        <h3 className="mt-4 text-xl font-bold text-white">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-gray-400 line-clamp-3">{project.description}</p>

          <div className="mt-5 flex gap-2">
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500">
                <ExternalLink size={12} /> Live Demo
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20">
                <Code size={12} /> Source
              </a>
            )}
          </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchActiveProjects();
        setProjects(data);
      } catch {
        // Silently ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const sourceProjects = projects.length > 0 ? projects : FALLBACK_PROJECTS;
  const filteredProjects = activeCategory === "All" ? sourceProjects : sourceProjects.filter((p) => p.category === activeCategory);

  return (
    <Section className="bg-[#08101D] pt-28 text-white md:pt-40" decoration={<GlowBackground />}>
      <SEO
        title="Projects"
        description="Browse our portfolio of web, mobile, SaaS, e-commerce, and automation projects delivered for clients across various industries."
        canonicalPath="/projects"
      />
      <div className="mb-16 max-w-3xl" data-aos="fade-up">
        <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">PORTFOLIO</span>
        <h1 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          Our Recent <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Projects</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">Explore a selection of projects we have built for clients across various industries and technologies.</p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2" data-aos="fade-up">
        {CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)} aria-label={`Filter projects by ${cat}`} className={`px-4 py-2 text-sm font-semibold transition ${activeCategory === cat ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="aspect-[16/10] w-full bg-white/5" />
              <div className="p-6"><div className="h-4 w-2/3 rounded bg-white/5" /><div className="mt-4 h-4 w-full rounded bg-white/5" /><div className="mt-2 h-4 w-4/5 rounded bg-white/5" /></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <p className="text-center text-gray-400">No projects found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Section>
  );
}