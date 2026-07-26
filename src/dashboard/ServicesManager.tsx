import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  SERVICE_CATEGORIES,
  SERVICE_ICONS,
  createService,
  deleteService,
  fetchAllServices,
  swapServiceOrder,
  updateService,
  uploadServiceImage,
} from "../lib/services";
import type { Service, ServiceIcon, ServicePayload, ServiceStatus } from "../lib/services";
import { getServiceIcon } from "../lib/serviceIcons";

const EMPTY_FORM: ServicePayload = {
  title: "",
  description: "",
  icon: "Monitor",
  category: "General",
  featured: false,
  image_url: null,
  status: "Draft",
  is_active: true,
};

export default function ServicesManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServicePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ServiceStatus>("All");

  useEffect(() => {
    void loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      const data = await fetchAllServices();
      setServices(data);
    } catch {
      toast.error("Unable to load services.");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(service: Service) {
    setEditingService(service);
    setForm({
      title: service.title,
      description: service.description,
      icon: service.icon,
      category: service.category,
      featured: service.featured,
      image_url: service.image_url,
      status: service.status,
      is_active: service.is_active,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadServiceImage(file);
      setForm((current) => ({ ...current, image_url: url }));
      toast.success("Image uploaded.");
    } catch {
      toast.error("Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingService) {
        const updated = await updateService(editingService.id, form);
        setServices((current) =>
          current.map((service) => (service.id === updated.id ? updated : service)),
        );
        toast.success("Service updated successfully.");
      } else {
        const nextOrderIndex =
          services.length > 0 ? Math.max(...services.map((s) => s.order_index)) + 1 : 0;
        const created = await createService(form, nextOrderIndex);
        setServices((current) => [...current, created]);
        toast.success("Service added successfully.");
      }

      closeForm();
    } catch {
      toast.error("Unable to save this service.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this service?");

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteService(id);
      setServices((current) => current.filter((service) => service.id !== id));
      toast.success("Service deleted successfully.");
    } catch {
      toast.error("Unable to delete this service.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= services.length) {
      return;
    }

    const current = services[index];
    const target = services[targetIndex];

    setReorderingId(current.id);

    try {
      await swapServiceOrder(current, target);
      const reordered = [...services];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setServices(reordered);
    } catch {
      toast.error("Unable to reorder services.");
    } finally {
      setReorderingId(null);
    }
  }

  async function toggleStatus(service: Service) {
    const nextStatus: ServiceStatus = service.status === "Published" ? "Draft" : "Published";

    try {
      const payload: ServicePayload = {
        title: service.title,
        description: service.description,
        icon: service.icon,
        category: service.category,
        featured: service.featured,
        image_url: service.image_url,
        status: nextStatus,
        is_active: service.is_active,
      };
      const updated = await updateService(service.id, payload);
      setServices((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(nextStatus === "Published" ? "Service published." : "Moved to draft.");
    } catch {
      toast.error("Unable to update status.");
    }
  }

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !normalizedQuery ||
        service.title.toLowerCase().includes(normalizedQuery) ||
        service.description.toLowerCase().includes(normalizedQuery);

      const matchesCategory = categoryFilter === "All" || service.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || service.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, query, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
          isDarkTheme
            ? "border-white/10 bg-slate-900/70 text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Manage the services shown on the public website.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isDarkTheme
              ? "bg-violet-500 text-white hover:bg-violet-400"
              : "bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      <div
        className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-colors duration-300 md:flex-row md:items-center ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search services..."
          className={`w-full rounded-xl border px-3 py-2.5 outline-none transition md:max-w-xs ${
            isDarkTheme
              ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
              : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
          }`}
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={`w-full rounded-xl border px-3 py-2.5 outline-none transition md:w-48 ${
            isDarkTheme
              ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
          }`}
        >
          <option value="All">All Categories</option>
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "All" | ServiceStatus)}
          className={`w-full rounded-xl border px-3 py-2.5 outline-none transition md:w-40 ${
            isDarkTheme
              ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
          }`}
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            No services found.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredServices.map((service) => {
              const Icon = getServiceIcon(service.icon);
              const index = services.findIndex((s) => s.id === service.id);

              return (
                <li
                  key={service.id}
                  className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                    isDarkTheme ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isDarkTheme ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{service.title}</p>

                        {service.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-500">
                            <Star size={12} className="fill-amber-500" />
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isDarkTheme ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {service.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => void toggleStatus(service)}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                            service.status === "Published"
                              ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                              : "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25"
                          }`}
                          title="Click to toggle Published/Draft"
                        >
                          {service.status}
                        </button>

                        {!service.is_active && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 max-w-xl text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => void handleReorder(index, "up")}
                      disabled={index === 0 || reorderingId === service.id}
                      title="Move up"
                      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleReorder(index, "down")}
                      disabled={index === services.length - 1 || reorderingId === service.id}
                      title="Move down"
                      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(service)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Pencil size={14} className="mr-1 inline" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(service.id)}
                      disabled={deletingId === service.id}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      }`}
                    >
                      <Trash2 size={14} className="mr-1 inline" />
                      {deletingId === service.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className={`w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl ${
              isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingService ? "Edit Service" : "Add Service"}</h2>
              <button
                type="button"
                onClick={closeForm}
                className={`rounded-full p-1.5 transition ${
                  isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Cyber Security"
                required
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme
                    ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
                }`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Short description shown on the service card"
                required
                rows={3}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme
                    ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Icon</label>
                <select
                  value={form.icon}
                  onChange={(event) => setForm({ ...form, icon: event.target.value as ServiceIcon })}
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                    isDarkTheme
                      ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
                  }`}
                >
                  {SERVICE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                    isDarkTheme
                      ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
                  }`}
                >
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Image</label>
              <div className="flex items-center gap-3">
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Service"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                )}
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    isDarkTheme
                      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <ImagePlus size={16} />
                  {uploadingImage ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as ServiceStatus })}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme
                    ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                />
                Visible on website
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                />
                Featured
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}