// Admin page for managing homepage Hero Slider slides — create, edit, delete,
// reorder, enable/disable, and upload background image/video per slide.
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  createSlide,
  deleteSlide,
  fetchSlidesForAdmin,
  swapSlideOrder,
  updateSlide,
  uploadSlideMedia,
} from "../lib/heroSlides";
import type { HeroSlide, HeroSlidePayload } from "../lib/heroSlides";

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

  useEffect(() => {
    void loadSlides();
  }, []);

  async function loadSlides() {
    setLoading(true);
    try {
      const data = await fetchSlidesForAdmin();
      setSlides(data);
    } catch {
      toast.error("Unable to load slides.");
    } finally {
      setLoading(false);
    }
  }

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
      toast.error("Please select an image or video file.");
      return;
    }

    if (isVideo && file.size > 30 * 1024 * 1024) {
      toast.error("Video must be under 30MB.");
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
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
      toast.success("Media uploaded.");
    } catch {
      toast.error("Unable to upload media.");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingSlide) {
        const updated = await updateSlide(editingSlide.id, form);
        setSlides((current) => current.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Slide updated.");
      } else {
        const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order_index)) + 1 : 0;
        const created = await createSlide(form, nextOrder);
        setSlides((current) => [...current, created]);
        toast.success("Slide added.");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Unable to save this slide.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this slide?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteSlide(id);
      setSlides((current) => current.filter((s) => s.id !== id));
      toast.success("Slide deleted.");
    } catch {
      toast.error("Unable to delete this slide.");
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
      toast.error("Unable to reorder slides.");
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
      toast.error("Unable to update this slide.");
    }
  }

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
          isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">Hero Slider</h1>
          <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Manage homepage slides. If no slides exist, the default static hero is shown instead.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          <Plus size={18} />
          Add Slide
        </button>
      </div>

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
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 line-clamp-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {slide.subtitle || "No subtitle"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, "up")}
                    disabled={index === 0 || reorderingId === slide.id}
                    className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, "down")}
                    disabled={index === slides.length - 1 || reorderingId === slide.id}
                    className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(slide)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      slide.is_active
                        ? isDarkTheme ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : isDarkTheme ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {slide.is_active ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(slide)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <Pencil size={14} className="mr-1 inline" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(slide.id)}
                    disabled={deletingId === slide.id}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}
                  >
                    <Trash2 size={14} className="mr-1 inline" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <form
            onSubmit={handleSubmit}
            className={`w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl ${
              isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingSlide ? "Edit Slide" : "Add Slide"}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className={`rounded-full p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Subtitle (small badge text)</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Button Text</label>
                <input
                  type="text"
                  value={form.button_text}
                  onChange={(event) => setForm({ ...form, button_text: event.target.value })}
                  placeholder="e.g. Get Started"
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Button Link</label>
                <input
                  type="text"
                  value={form.button_link}
                  onChange={(event) => setForm({ ...form, button_link: event.target.value })}
                  placeholder="#contact"
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Background Media (Image or Video)</label>
              <div className="flex items-center gap-3">
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
              <p className={`mt-1.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                Images: under 5MB. Videos: under 30MB, muted autoplay loop recommended.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Overlay Darkness ({Math.round(form.overlay_opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={form.overlay_opacity}
                onChange={(event) => setForm({ ...form, overlay_opacity: parseFloat(event.target.value) })}
                className="w-full accent-violet-500"
              />
              <p className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                Higher = darker overlay, better text readability on bright images.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Animation</label>
              <select
                value={form.animation_type}
                onChange={(event) => setForm({ ...form, animation_type: event.target.value as "fade" | "slide" })}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              Visible on website
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Cancel
              </button>
              <button type="submit" disabled={saving || uploadingMedia} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"}`}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}