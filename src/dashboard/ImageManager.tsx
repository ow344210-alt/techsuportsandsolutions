import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import AdminFormModal from "./components/AdminFormModal";
import {
  createManagedImage,
  deleteManagedImage,
  fetchAllManagedImages,
  updateManagedImage,
  uploadManagedImage,
} from "../lib/managedImages";
import type { ManagedImage, ManagedImagePayload } from "../lib/managedImages";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";
export default function ImageManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ManagedImage | null>(null);
  const [form, setForm] = useState<ManagedImagePayload>({
    name: "",
    description: null,
    image_url: "",
    alt_text: null,
    section: null,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllManagedImages();
        if (mounted) setImages(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingImage(null);
    setForm({ name: "", description: null, image_url: "", alt_text: null, section: null, is_active: true });
    setIsFormOpen(true);
  }
  function openEditForm(image: ManagedImage) {
    setEditingImage(image);
    setForm({
      name: image.name,
      description: image.description,
      image_url: image.image_url,
      alt_text: image.alt_text,
      section: image.section,
      is_active: image.is_active,
    });
    setIsFormOpen(true);
  }
  function closeForm() {
    setIsFormOpen(false);
    setEditingImage(null);
    setForm({ name: "", description: null, image_url: "", alt_text: null, section: null, is_active: true });
  }
  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    setUploading(true);
    try {
      const url = await uploadManagedImage(file);
      setForm((current) => ({ ...current, image_url: url }));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.image_url.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editingImage) {
        const updated = await updateManagedImage(editingImage.id, form);
        setImages((current) => current.map((img) => (img.id === updated.id ? updated : img)));
      } else {
        const created = await createManagedImage(form);
        setImages((current) => [created, ...current]);
      }
      closeForm();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id: string) {
    const result = await showConfirm({
      title: "Delete Image",
      text: "This will permanently delete this image.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteManagedImage(id);
      setImages((current) => current.filter((img) => img.id !== id));
      toast.success("Image deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Managed Images" subtitle="Replace website images without touching code." actionLabel="Add Image" onAction={openAddForm} />
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading images...</div>
        ) : images.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No images yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className={`rounded-xl border p-4 transition ${isDarkTheme ? "border-white/10 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <img src={image.image_url} alt={image.name} className="h-32 w-full rounded-lg object-cover" />
                <div className="mt-3 min-w-0">
                  <p className={`truncate text-sm font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{image.name}</p>
                  {image.description && <p className={`line-clamp-2 break-words text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{image.description}</p>}
                  {image.alt_text && <p className={`truncate text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>Alt: {image.alt_text}</p>}
                  {image.section && <span className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-[10px] font-semibold ${isDarkTheme ? "bg-white/5 text-slate-300" : "bg-slate-200 text-slate-600"}`}>{image.section}</span>}
                </div>
                <div className="mt-3">
                  <AdminRowActions onEdit={() => void openEditForm(image)} onDelete={() => void handleDelete(image.id)} deleting={deletingId === image.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal
          title={editingImage ? "Edit Image" : "Add Image"}
          onClose={closeForm}
          onSubmit={handleSubmit}
          saving={saving}
          submitDisabled={uploading}
        >
          <FormField label="Name">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Description">
            <input type="text" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value || null })} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Alt Text">
            <input type="text" value={form.alt_text || ""} onChange={(e) => setForm({ ...form, alt_text: e.target.value || null })} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Section">
            <input type="text" value={form.section || ""} onChange={(e) => setForm({ ...form, section: e.target.value || null })} placeholder="e.g. hero, about, services" className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Image URL">
            <div className="flex flex-wrap items-center gap-3">
              {form.image_url && <img src={form.image_url} alt="Preview" className="h-14 w-14 rounded-xl object-cover" />}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                <ImagePlus size={16} />
                {uploading ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} className="hidden" />
              </label>
            </div>
            <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL" className={`mt-2 ${inputClass(isDarkTheme)}`} />
          </FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <label className="text-sm font-medium">Active</label>
          </div>
        </AdminFormModal>
      )}
               
      </div>
  );
}

