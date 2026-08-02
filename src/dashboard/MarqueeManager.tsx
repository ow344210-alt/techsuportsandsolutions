// src/dashboard/MarqueeManager.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import {
  createMarqueeItem,
  deleteMarqueeItem,
  getAdminMarqueeItems,
  reorderMarqueeItems,
  updateMarqueeItem,
} from "../lib/marqueeItems";
import type {
  MarqueeItem,
  MarqueeItemPayload,
  MarqueeRow,
} from "../lib/marqueeItems";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";

const EMPTY_FORM: MarqueeItemPayload = {
  label: "",
  row: "left",
  is_active: true,
};

// Keeps every row's order_index as a clean 0..n sequence so ordering never
// drifts after swaps or deletes.
function normalizeOrder(items: MarqueeItem[]): MarqueeItem[] {
  const rows: MarqueeRow[] = ["left", "right"];
  const normalized: MarqueeItem[] = [];
  for (const row of rows) {
    const rowItems = items
      .filter((item) => item.row === row)
      .sort(
        (a, b) =>
          a.order_index - b.order_index ||
          a.created_at.localeCompare(b.created_at)
      );
    rowItems.forEach((item, index) => normalized.push({ ...item, order_index: index }));
  }
  return normalized;
}

export default function MarqueeManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarqueeItem | null>(null);
  const [form, setForm] = useState<MarqueeItemPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getAdminMarqueeItems();
        if (mounted) setItems(normalizeOrder(data));
      } catch {
        if (mounted) toast.error("Unable to load marquee items.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function openAddForm() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(item: MarqueeItem) {
    setEditingItem(item);
    setForm({ label: item.label, row: item.row, is_active: item.is_active });
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.label.trim()) {
      toast.error("Label is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateMarqueeItem(editingItem.id, form);
        setItems((current) =>
          normalizeOrder(current.map((i) => (i.id === updated.id ? updated : i)))
        );
        toast.success("Updated.");
      } else {
        const rowItems = items.filter((i) => i.row === form.row);
        const nextOrder =
          rowItems.length > 0
            ? Math.max(...rowItems.map((i) => i.order_index)) + 1
            : 0;
        const created = await createMarqueeItem(form, nextOrder);
        setItems((current) => normalizeOrder([...current, created]));
        toast.success("Added.");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this marquee item?")) return;
    setDeletingId(id);
    try {
      await deleteMarqueeItem(id);
      setItems((current) => normalizeOrder(current.filter((i) => i.id !== id)));
      toast.success("Deleted.");
    } catch {
      toast.error("Unable to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    const current = items[index];
    const step = direction === "up" ? -1 : 1;
    let targetIndex = -1;
    for (let i = index + step; i >= 0 && i < items.length; i += step) {
      if (items[i].row === current.row) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex === -1) return;

    const reordered = [...items];
    const target = reordered[targetIndex];
    reordered[index] = { ...target, order_index: target.order_index };
    reordered[targetIndex] = { ...current, order_index: current.order_index };
    const normalized = normalizeOrder(reordered);

    setReorderingId(current.id);
    try {
      await reorderMarqueeItems(
        normalized.map((item) => ({ id: item.id, order_index: item.order_index }))
      );
      setItems(normalized);
    } catch {
      toast.error("Unable to reorder.");
    } finally {
      setReorderingId(null);
    }
  }

  async function toggleActive(item: MarqueeItem) {
    try {
      const updated = await updateMarqueeItem(item.id, {
        label: item.label,
        row: item.row,
        is_active: !item.is_active,
      });
      setItems((current) =>
        current.map((i) => (i.id === updated.id ? updated : i))
      );
    } catch {
      toast.error("Unable to update.");
    }
  }

  function canMove(index: number, direction: "up" | "down"): boolean {
    const current = items[index];
    const step = direction === "up" ? -1 : 1;
    for (let i = index + step; i >= 0 && i < items.length; i += step) {
      if (items[i].row === current.row) return true;
    }
    return false;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Marquee"
        subtitle="Manage the scrolling highlight strips on the public site. Changes appear immediately via Supabase Realtime."
        actionLabel="Add Item"
        onAction={openAddForm}
      />
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div
            className={`px-4 py-10 text-center text-sm ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div
            className={`px-4 py-10 text-center text-sm ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          >
            No marquee items yet. Add your first highlight to see it on the website.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                  isDarkTheme ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-semibold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.label}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.row === "left"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-pink-500/15 text-pink-300"
                      }`}
                    >
                      {item.row === "left" ? "Left row" : "Right row"}
                    </span>
                  </div>
                </div>
                <AdminRowActions
                  canMoveUp={canMove(index, "up")}
                  canMoveDown={canMove(index, "down")}
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
        <AdminFormModal
          title={editingItem ? "Edit Marquee Item" : "Add Marquee Item"}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          saving={saving}
        >
          <FormField label="Label" hint="Text shown on the scrolling strip.">
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>
          <FormField label="Row" hint="Which scrolling strip this item belongs to.">
            <select
              value={form.row}
              onChange={(e) => setForm({ ...form, row: e.target.value as MarqueeRow })}
              className={inputClass(isDarkTheme)}
            >
              <option value="left">Left row</option>
              <option value="right">Right row</option>
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Visible on website
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}
