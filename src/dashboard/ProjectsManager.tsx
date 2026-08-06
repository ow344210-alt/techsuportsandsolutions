import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Code } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { useFormDraft } from "../hooks/useFormDraft";
import {
  createProject,
  deleteProject,
  deleteProjectImage,
  fetchAllProjects,
  swapProjectOrder,
  updateProject,
  uploadProjectImage,
} from "../lib/projects";
import type { Project, ProjectPayload } from "../lib/projects";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import ResponsiveSelect from "../components/ui/ResponsiveSelect";
import { showConfirm } from "../lib/confirm";
import toast from "react-hot-toast";
import { normalizeErrorMessage } from "../lib/utils";
const EMPTY_FORM: ProjectPayload = {
  title: "",
  description: "",
  category: "Web Development",
  technologies: [],
  image_url: null,
  live_url: null,
  github_url: null,
  status: "Draft",
  is_active: true,
};
const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile App",
  "Software Solution",
  "Digital Marketing",
  "Automation",
  "IT Consulting",
  "E-Commerce",
  "SaaS",
  "Other",
] as const;
export default function ProjectsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { restored: draftRestored, isConflict: draftConflict, clear: clearDraft } = useFormDraft<ProjectPayload>({
    formName: "project",
    id: editingProject?.id ?? null,
    values: form,
    active: isFormOpen,
    recordUpdatedAt: editingProject?.updated_at ?? null,
    onRestore: (restoredValues) => {
      setForm(restoredValues);
      toast.success("Unsaved draft restored.");
    },
  });
  useEffect(() => {
    if (draftRestored && draftConflict) {
      toast.error("This record was changed elsewhere after your draft was saved. Review before saving.");
    }
  }, [draftRestored, draftConflict]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllProjects();
        if (mounted) setProjects(data);
      }  finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(project: Project) {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      category: project.category,
      technologies: [...(project.technologies || [])],
      image_url: project.image_url,
      live_url: project.live_url,
      github_url: project.github_url,
      status: project.status,
      is_active: project.is_active,
    });
    setPreviousImageUrl(project.image_url);
    setIsFormOpen(true);
  }
  function closeForm() {
    setIsFormOpen(false);
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setPreviousImageUrl(null);
  }
  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

     setUploadingImage(true);
     try {
       const url = await uploadProjectImage(file);

      if (editingProject && previousImageUrl && previousImageUrl !== url) {
        void deleteProjectImage(previousImageUrl);
      }

       setForm((current) => ({ ...current, image_url: url }));
       setPreviousImageUrl(null);
      }  finally {
      setUploadingImage(false);
    }
  }
  function handleImageUrlChange(value: string) {
    setForm((current) => ({ ...current, image_url: value || null }));
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, form);
        setProjects((current) => current.map((p) => (p.id === updated.id ? updated : p)));
        if (previousImageUrl && previousImageUrl !== form.image_url) {
          void deleteProjectImage(previousImageUrl);
        }
      } else {
        const nextOrderIndex = projects.length > 0 ? Math.max(...projects.map((p) => p.order_index)) + 1 : 0;
        const created = await createProject(form, nextOrderIndex);
        setProjects((current) => [...current, created]);
      }
      clearDraft();
      closeForm();
    }  finally {
      setSaving(false);
    }
  }
  async function handleDelete(id: string) {
    const result = await showConfirm({
      title: "Delete Project",
      text: "This will permanently delete this project.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      const project = projects.find((p) => p.id === id);
      await deleteProject(id, project?.image_url ?? null);
      setProjects((current) => current.filter((p) => p.id !== id));
      toast.success("Project deleted successfully.");
    } catch (error) {
      toast.error(normalizeErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;
    const current = projects[index];
    const target = projects[targetIndex];
    setReorderingId(current.id);
    try {
      await swapProjectOrder(current, target);
      const reordered = [...projects];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
       setProjects(reordered);
     } finally {
       setReorderingId(null);
     }
   }
   async function toggleStatus(project: Project) {
     const nextStatus: "Published" | "Draft" = project.status === "Published" ? "Draft" : "Published";
     const updated = await updateProject(project.id, { ...form, status: nextStatus });
     setProjects((current) => current.map((p) => (p.id === updated.id ? updated : p)));
   }
   const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !normalizedQuery ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryFilter === "All" || project.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [projects, query, categoryFilter]);
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Projects" subtitle="Manage portfolio projects shown on the website." actionLabel="Add Project" onAction={openAddForm} />
      <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-colors duration-300 md:flex-row md:items-center ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." className={`w-full rounded-xl border px-3 py-2.5 outline-none transition md:max-w-xs ${isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"}`} />
        <ResponsiveSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: "All", label: "All Categories" },
            ...PROJECT_CATEGORIES.map((category) => ({ value: category, label: category })),
          ]}
          className="md:w-48"
        />
      </div>
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No projects found.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredProjects.map((project, index) => (
              <li key={project.id} className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div className="flex items-center gap-4">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.title} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDarkTheme ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"}`}>
                      <Code size={20} />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{project.title}</p>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${isDarkTheme ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{project.category}</span>
                      <button type="button" onClick={() => void toggleStatus(project)} className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition ${project.status === "Published" ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" : "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25"}`}>{project.status}</button>
                      {!project.is_active && <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>Hidden</span>}
                    </div>
                    <p className={`mt-1 max-w-xl text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{project.description}</p>
                  </div>
                </div>
                <AdminRowActions canMoveUp={index !== 0} canMoveDown={index !== projects.length - 1} reordering={reorderingId === project.id} onMoveUp={() => void handleReorder(index, "up")} onMoveDown={() => void handleReorder(index, "down")} isActive={project.is_active} onToggleActive={() => { void toggleStatus(project); }} onEdit={() => openEditForm(project)} onDelete={() => void handleDelete(project.id)} deleting={deletingId === project.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingProject ? "Edit Project" : "Add Project"} onClose={closeForm} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Title">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Category">
            <ResponsiveSelect
              value={form.category}
              onChange={(value) => setForm({ ...form, category: value })}
              options={PROJECT_CATEGORIES.map((category) => ({ value: category, label: category }))}
            />
          </FormField>
          <FormField label="Technologies (comma-separated)">
            <input type="text" value={(form.technologies || []).join(", ")} onChange={(e) => setForm({ ...form, technologies: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Live URL">
            <input type="url" value={form.live_url || ""} onChange={(e) => setForm({ ...form, live_url: e.target.value || null })} placeholder="https://" className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="GitHub URL">
            <input type="url" value={form.github_url || ""} onChange={(e) => setForm({ ...form, github_url: e.target.value || null })} placeholder="https://" className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Image">
            <div className="flex items-center gap-3">
              {form.image_url && <img src={form.image_url} alt="Project" className="h-14 w-14 rounded-xl object-cover" />}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                <ImagePlus size={16} />
                {uploadingImage ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                 <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImageSelect} disabled={uploadingImage} className="hidden" />
              </label>
            </div>
            <input
              type="url"
              value={form.image_url || ""}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="Or paste image URL"
              className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"}`}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Status">
              <ResponsiveSelect
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value as "Published" | "Draft" })}
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "Published", label: "Published" },
                ]}
              />
            </FormField>
            <FormField label="Visibility">
              <label className="flex items-center gap-2 text-sm font-medium pt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Visible on website
              </label>
            </FormField>
          </div>
        </AdminFormModal>
      )      }
    </div>
  );
}

