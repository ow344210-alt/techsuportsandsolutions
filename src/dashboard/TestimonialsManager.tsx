import { useEffect, useMemo, useState } from "react";
import { Star, Plus, User } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import {
  createTestimonial,
  deleteTestimonial,
  fetchAllTestimonials,
  swapTestimonialOrder,
  updateTestimonial,
  uploadTestimonialImage,
} from "../lib/testimonials";
import type { Testimonial, TestimonialPayload } from "../lib/testimonials";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import ConfirmDialog from "../components/common/ConfirmDialog";

const EMPTY_FORM: TestimonialPayload = {
  client_name: "",
  company_name: null,
  profile_image_url: null,
  review: "",
  rating: 5,
  status: "Draft",
  is_active: true,
};
export default function TestimonialsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllTestimonials();
        if (mounted) setTestimonials(data);
      } catch {
        if (mounted) toast.error("Unable to load testimonials.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingTestimonial(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(testimonial: Testimonial) {
    setEditingTestimonial(testimonial);
    setForm({
      client_name: testimonial.client_name,
      company_name: testimonial.company_name,
      profile_image_url: testimonial.profile_image_url,
      review: testimonial.review,
      rating: testimonial.rating,
      status: testimonial.status,
      is_active: testimonial.is_active,
    });
    setIsFormOpen(true);
  }
  function closeForm() {
    setIsFormOpen(false);
    setEditingTestimonial(null);
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
      const url = await uploadTestimonialImage(file);
      setForm((current) => ({ ...current, profile_image_url: url }));
      toast.success("Image uploaded.");
    } catch {
      toast.error("Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.client_name.trim() || !form.review.trim()) {
      toast.error("Client name and review are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingTestimonial) {
        const updated = await updateTestimonial(editingTestimonial.id, form);
        setTestimonials((current) => current.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Testimonial updated successfully.");
      } else {
        const nextOrderIndex = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.order_index)) + 1 : 0;
        const created = await createTestimonial(form, nextOrderIndex);
        setTestimonials((current) => [...current, created]);
        toast.success("Testimonial added successfully.");
      }
      closeForm();
    } catch {
      toast.error("Unable to save this testimonial.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id: string) {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTargetId) return;
    setDeleteConfirmOpen(false);
    setDeletingId(deleteTargetId);
    try {
      await deleteTestimonial(deleteTargetId);
      setTestimonials((current) => current.filter((t) => t.id !== deleteTargetId));
      toast.success("Testimonial deleted successfully.");
    } catch {
      toast.error("Unable to delete this testimonial.");
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;
    const current = testimonials[index];
    const target = testimonials[targetIndex];
    setReorderingId(current.id);
    try {
      await swapTestimonialOrder(current, target);
      const reordered = [...testimonials];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setTestimonials(reordered);
    } catch {
      toast.error("Unable to reorder testimonials.");
    } finally {
      setReorderingId(null);
    }
  }
  async function toggleStatus(testimonial: Testimonial) {
    const nextStatus: "Published" | "Draft" = testimonial.status === "Published" ? "Draft" : "Published";
    try {
      const updated = await updateTestimonial(testimonial.id, { ...form, status: nextStatus });
      setTestimonials((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(nextStatus === "Published" ? "Testimonial published." : "Moved to draft.");
    } catch {
      toast.error("Unable to update status.");
    }
  }
  const filteredTestimonials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return testimonials.filter((t) => {
      return !normalizedQuery ||
        t.client_name.toLowerCase().includes(normalizedQuery) ||
        (t.company_name && t.company_name.toLowerCase().includes(normalizedQuery)) ||
        t.review.toLowerCase().includes(normalizedQuery);
    });
  }, [testimonials, query]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Testimonials"
        subtitle="Manage client testimonials shown on the website."
        actionLabel="Add Testimonial"
        onAction={openAddForm}
      />
      <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-colors duration-300 md:flex-row md:items-center ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search testimonials..." className={`${inputClass(isDarkTheme)} md:max-w-xs`} />
      </div>
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading testimonials...</div>
        ) : filteredTestimonials.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No testimonials found.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredTestimonials.map((testimonial, index) => (
              <li key={testimonial.id} className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div className="flex items-center gap-4">
                  {testimonial.profile_image_url ? (
                    <img src={testimonial.profile_image_url} alt={testimonial.client_name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isDarkTheme ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"}`}>
                      <User size={20} />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{testimonial.client_name}</p>
                      {testimonial.company_name && (
                        <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>at {testimonial.company_name}</span>
                      )}
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={12} className={i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
                        ))}
                      </span>
                      <button type="button" onClick={() => void toggleStatus(testimonial)} className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition ${testimonial.status === "Published" ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" : "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25"}`}>{testimonial.status}</button>
                      {!testimonial.is_active && <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>Hidden</span>}
                    </div>
                    <p className={`mt-1 max-w-xl text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{testimonial.review}</p>
                  </div>
                </div>
                <AdminRowActions canMoveUp={index !== 0} canMoveDown={index !== testimonials.length - 1} reordering={reorderingId === testimonial.id} onMoveUp={() => void handleReorder(index, "up")} onMoveDown={() => void handleReorder(index, "down")} isActive={testimonial.is_active} onToggleActive={() => { void toggleStatus(testimonial); }} onEdit={() => openEditForm(testimonial)} onDelete={() => void handleDelete(testimonial.id)} deleting={deletingId === testimonial.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingTestimonial ? "Edit Testimonial" : "Add Testimonial"} onClose={closeForm} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Client Name">
            <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Company Name">
            <input type="text" value={form.company_name || ""} onChange={(e) => setForm({ ...form, company_name: e.target.value || null })} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Rating">
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={inputClass(isDarkTheme)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Review">
            <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} required rows={4} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Profile Image">
            <div className="flex items-center gap-3">
              {form.profile_image_url && <img src={form.profile_image_url} alt="Profile" className="h-14 w-14 rounded-full object-cover" />}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                <Plus size={16} />
                {uploadingImage ? "Uploading..." : form.profile_image_url ? "Change Image" : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadingImage} className="hidden" />
              </label>
            </div>
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Published" | "Draft" })} className={inputClass(isDarkTheme)}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </FormField>
            <FormField label="Visibility">
              <label className="flex items-center gap-2 text-sm font-medium pt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Visible on website
              </label>
            </FormField>
          </div>
        </AdminFormModal>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete testimonial"
        description={deleteTargetId ? `Are you sure you want to delete this testimonial?` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deletingId === deleteTargetId}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}

