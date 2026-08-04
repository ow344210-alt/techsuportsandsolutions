// src/dashboard/TechStackManager.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../context/ThemeContext.types";
import { createTech, deleteTech, fetchTechForAdmin, swapTechOrder, updateTech } from "../lib/techStack";
import type { TechItem, TechItemPayload } from "../lib/techStack";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";
const EMPTY_FORM: TechItemPayload = { name: "", category: "General", is_active: true };
export default function TechStackManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [items, setItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TechItem | null>(null);
  const [form, setForm] = useState<TechItemPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchTechForAdmin();
        if (mounted) setItems(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(item: TechItem) {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, is_active: item.is_active });
    setIsFormOpen(true);
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateTech(editingItem.id, form);
        setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;
        const created = await createTech(form, nextOrder);
        setItems((current) => [...current, created]);
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id: string) {
   const result = await showConfirm({
     title: "Delete Item",
     text: "This will permanently delete this tech stack item.",
     icon: "warning",
     confirmButtonText: "Delete",
     cancelButtonText: "Cancel",
     variant: "danger",
   });
   if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteTech(id);
      setItems((current) => current.filter((i) => i.id !== id));
      toast.success("Tech stack item deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const current = items[index];
    const target = items[targetIndex];
    setReorderingId(current.id);
    try {
      await swapTechOrder(current, target);
      const reordered = [...items];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setItems(reordered);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }
  async function toggleActive(item: TechItem) {
    try {
      const updated = await updateTech(item.id, { name: item.name, category: item.category, is_active: !item.is_active });
      setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Tech Stack" subtitle="Manage the technology badges shown on the homepage." actionLabel="Add Technology" onAction={openAddForm} />
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No technologies yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item, index) => (
              <li key={item.id} className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div>
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{item.name}</p>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{item.category}</p>
                </div>
                <AdminRowActions
                  canMoveUp={index !== 0}
                  canMoveDown={index !== items.length - 1}
                  reordering={reorderingId === item.id}
                  onMoveUp={() => void handleReorder(index, "up")}
                  onMoveDown={() => void handleReorder(index, "down")}
                  isActive={item.is_active}
                  onToggleActive={() => void toggleActive(item)}
                  onEdit={() => openEditForm(item)}
                  onDelete={() => void handleDelete(item.id)}
                  deleting={deletingId === item.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingItem ? "Edit Technology" : "Add Technology"} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Name">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Category" hint="e.g. Frontend, Backend, Mobile, Data, Infrastructure">
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass(isDarkTheme)} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Visible on website
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}

