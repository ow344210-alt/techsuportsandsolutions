// Admin page for managing homepage Hero Slider slides — create, edit, delete,
// reorder, enable/disable, and upload background image/video per slide.
import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { useFormDraft } from "../hooks/useFormDraft";
import AdminFormModal from "./components/AdminFormModal";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import ResponsiveSelect from "../components/ui/ResponsiveSelect";
import {
  createSlide,
  deleteSlide,
  fetchSlidesForAdmin,
  swapSlideOrder,
  updateSlide,
  uploadSlideMedia,
} from "../lib/heroSlides";
import type { HeroSlide, HeroSlidePayload } from "../lib/heroSlides";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";

const EMPTY_FORM: HeroSlidePayload = {
  title: "",
  subtitle: "",
  description: "",
  button_text: "",
  button_link: "#contact",
  media_type: "image",
  media_url: null,
  overlay_opacity: 0.6,
  animation_type: "fade",
  is_active: true,
};

export default function HeroSliderManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<HeroSlidePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { restored: draftRestored, isConflict: draftConflict, clear: clearDraft } = useFormDraft<HeroSlidePayload>({
    formName: "hero-slide",
    id: editingSlide?.id ?? null,
    values: form,
    active: isFormOpen,
    recordUpdatedAt: editingSlide?.updated_at ?? null,
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
        const data = await fetchSlidesForAdmin();
        if (mounted) setSlides(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function openAddForm() {
    setEditingSlide(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(slide: HeroSlide) {
    setEditingSlide(slide);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      button_text: slide.button_text,
      button_link: slide.button_link,
      media_type: slide.media_type,
      media_url: slide.media_url,
      overlay_opacity: slide.overlay_opacity,
      animation_type: slide.animation_type,
      is_active: slide.is_active,
    });
    setIsFormOpen(true);
  }

  async function handleMediaSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      return;
    }

    if (isVideo && file.size > 30 * 1024 * 1024) {
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploadingMedia(true);
    try {
      const url = await uploadSlideMedia(file);
      setForm((current) => ({
        ...current,
        media_url: url,
        media_type: isVideo ? "video" : "image",
      }));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    setSaving(true);
    try {
      if (editingSlide) {
        const updated = await updateSlide(editingSlide.id, form);
        setSlides((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order_index)) + 1 : 0;
        const created = await createSlide(form, nextOrder);
        setSlides((current) => [...current, created]);
      }
      clearDraft();
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await showConfirm({
      title: "Delete Slide",
      text: "This will permanently delete this hero slide.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      await deleteSlide(id);
      setSlides((current) => current.filter((s) => s.id !== id));
      toast.success("Hero slide deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const current = slides[index];
    const target = slides[targetIndex];
    setReorderingId(current.id);

    try {
      await swapSlideOrder(current, target);
      const reordered = [...slides];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setSlides(reordered);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  async function toggleActive(slide: HeroSlide) {
    try {
      const updated = await updateSlide(slide.id, {
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        button_text: slide.button_text,
        button_link: slide.button_link,
        media_type: slide.media_type,
        media_url: slide.media_url,
        overlay_opacity: slide.overlay_opacity,
        animation_type: slide.animation_type,
        is_active: !slide.is_active,
      });
      setSlides((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hero Slider"
        subtitle="Manage homepage slides. If no slides exist, the default static hero is shown instead."
        actionLabel="Add Slide"
        onAction={openAddForm}
      />

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Loading slides...
          </div>
        ) : slides.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            No slides yet — the homepage is showing the default static hero.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {slides.map((slide, index) => (
              <li
                key={slide.id}
                className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                  isDarkTheme ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  {slide.media_url ? (
                    slide.media_type === "video" ? (
                      <video src={slide.media_url} className="h-14 w-24 shrink-0 rounded-xl object-cover" muted />
                    ) : (
                      <img src={slide.media_url} alt={slide.title} className="h-14 w-24 shrink-0 rounded-xl object-cover" />
                    )
                  ) : (
                    <div className={`flex h-14 w-24 shrink-0 items-center justify-center rounded-xl text-xs ${isDarkTheme ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                      No media
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{slide.title}</p>
                      {!slide.is_active && (
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 line-clamp-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {slide.subtitle || "No subtitle"}
                    </p>
                  </div>
                </div>

                <AdminRowActions
                  onMoveUp={() => void handleReorder(index, "up")}
                  onMoveDown={() => void handleReorder(index, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < slides.length - 1}
                  reordering={reorderingId === slide.id}
                  isActive={slide.is_active}
                  onToggleActive={() => void toggleActive(slide)}
                  onEdit={() => openEditForm(slide)}
                  onDelete={() => void handleDelete(slide.id)}
                  deleting={deletingId === slide.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isFormOpen && (
        <AdminFormModal
          title={editingSlide ? "Edit Slide" : "Add Slide"}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          saving={saving}
          submitDisabled={uploadingMedia}
        >
          <FormField label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <FormField label="Subtitle (small badge text)">
            <input
              type="text"
              value={form.subtitle}
              onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Button Text">
              <input
                type="text"
                value={form.button_text}
                onChange={(event) => setForm({ ...form, button_text: event.target.value })}
                placeholder="e.g. Get Started"
                className={inputClass(isDarkTheme)}
              />
            </FormField>
            <FormField label="Button Link">
              <input
                type="text"
                value={form.button_link}
                onChange={(event) => setForm({ ...form, button_link: event.target.value })}
                placeholder="#contact"
                className={inputClass(isDarkTheme)}
              />
            </FormField>
          </div>

          <FormField label="Background Media (Image or Video)" hint="Images: under 5MB. Videos: under 30MB, muted autoplay loop recommended.">
            <div className="flex flex-wrap items-center gap-3">
              {form.media_url && (
                form.media_type === "video" ? (
                  <video src={form.media_url} className="h-16 w-28 rounded-xl object-cover" muted />
                ) : (
                  <img src={form.media_url} alt="Slide" className="h-16 w-28 rounded-xl object-cover" />
                )
              )}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                <ImagePlus size={16} />
                {uploadingMedia ? "Uploading..." : form.media_url ? "Change Media" : "Upload Media"}
                <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} disabled={uploadingMedia} className="hidden" />
              </label>
            </div>
          </FormField>

          <FormField label={`Overlay Darkness (${Math.round(form.overlay_opacity * 100)}%)`} hint="Higher = darker overlay, better text readability on bright images.">
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={form.overlay_opacity}
              onChange={(event) => setForm({ ...form, overlay_opacity: parseFloat(event.target.value) })}
              className="w-full accent-violet-500"
            />
          </FormField>

          <FormField label="Animation">
            <ResponsiveSelect
              value={form.animation_type}
              onChange={(value) => setForm({ ...form, animation_type: value as "fade" | "slide" })}
              options={[
                { value: "fade", label: "Fade" },
                { value: "slide", label: "Slide" },
              ]}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Visible on website
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}
