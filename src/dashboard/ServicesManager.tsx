import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Star } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { useFormDraft } from "../hooks/useFormDraft";
import AdminFormModal from "./components/AdminFormModal";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import ResponsiveSelect from "../components/ui/ResponsiveSelect";
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
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";

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

  const { restored: draftRestored, isConflict: draftConflict, clear: clearDraft } = useFormDraft<ServicePayload>({
    formName: "service",
    id: editingService?.id ?? null,
    values: form,
    active: isFormOpen,
    recordUpdatedAt: editingService?.updated_at ?? null,
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
        const data = await fetchAllServices();
        if (mounted) setServices(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadServiceImage(file);
      setForm((current) => ({ ...current, image_url: url }));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      return;
    }

    setSaving(true);

    try {
      if (editingService) {
        const updated = await updateService(editingService.id, form);
        setServices((current) =>
          current.map((service) => (service.id === updated.id ? updated : service)),
        );
      } else {
        const nextOrderIndex =
          services.length > 0 ? Math.max(...services.map((s) => s.order_index)) + 1 : 0;
        const created = await createService(form, nextOrderIndex);
        setServices((current) => [...current, created]);
      }

      clearDraft();
      closeForm();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await showConfirm({
      title: "Delete Service",
      text: "This will permanently delete this service.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;

    setDeletingId(id);

    try {
      await deleteService(id);
      setServices((current) => current.filter((service) => service.id !== id));
      toast.success("Service deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
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
      toast.error("Something went wrong. Please try again.");
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
    } catch {
      toast.error("Something went wrong. Please try again.");
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
      <AdminPageHeader
        title="Services"
        subtitle="Manage the services shown on the public website."
        actionLabel="Add Service"
        onAction={openAddForm}
      />

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
          className={`${inputClass(isDarkTheme)} md:max-w-xs`}
        />

        <ResponsiveSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: "All", label: "All Categories" },
            ...SERVICE_CATEGORIES.map((category) => ({ value: category, label: category })),
          ]}
          className="md:w-48"
        />

        <ResponsiveSelect
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as "All" | ServiceStatus)}
          options={[
            { value: "All", label: "All Status" },
            { value: "Published", label: "Published" },
            { value: "Draft", label: "Draft" },
          ]}
          className="md:w-40"
        />
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
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-500">
                            <Star size={12} className="fill-amber-500" />
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            isDarkTheme ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {service.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => void toggleStatus(service)}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
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
                            className={`rounded-lg px-2 py-1 text-xs font-semibold ${
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

                  <AdminRowActions
                    onMoveUp={() => void handleReorder(index, "up")}
                    onMoveDown={() => void handleReorder(index, "down")}
                    canMoveUp={index > 0}
                    canMoveDown={index < services.length - 1}
                    reordering={reorderingId === service.id}
                    onEdit={() => openEditForm(service)}
                    onDelete={() => void handleDelete(service.id)}
                    deleting={deletingId === service.id}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isFormOpen && (
        <AdminFormModal
          title={editingService ? "Edit Service" : "Add Service"}
          onClose={closeForm}
          onSubmit={handleSubmit}
          saving={saving}
          submitDisabled={uploadingImage}
        >
          <FormField label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Cyber Security"
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Short description shown on the service card"
              required
              rows={3}
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Icon">
              <ResponsiveSelect
                value={form.icon}
                onChange={(value) => setForm({ ...form, icon: value as ServiceIcon })}
                options={SERVICE_ICONS.map((icon) => ({ value: icon, label: icon }))}
                maxHeight={260}
              />
            </FormField>

            <FormField label="Category">
              <ResponsiveSelect
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={SERVICE_CATEGORIES.map((category) => ({ value: category, label: category }))}
              />
            </FormField>
          </div>

          <FormField label="Image">
            <div className="flex flex-wrap items-center gap-3">
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
          </FormField>

          <FormField label="Status">
            <ResponsiveSelect
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value as ServiceStatus })}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "Published", label: "Published" },
              ]}
            />
          </FormField>

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
        </AdminFormModal>
      )}
    </div>
  );
}
