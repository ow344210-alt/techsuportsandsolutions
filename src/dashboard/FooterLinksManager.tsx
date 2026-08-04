import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../context/ThemeContext.types";
import {
  createFooterLink,
  deleteFooterLink,
  fetchFooterLinksForAdmin,
  swapFooterLinkOrder,
  updateFooterLink,
} from "../lib/footerLinks";
import type { FooterLink, FooterLinkPayload } from "../lib/footerLinks";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";
const EMPTY_FORM: FooterLinkPayload = { label: "", url: "", is_active: true };
export default function FooterLinksManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [form, setForm] = useState<FooterLinkPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchFooterLinksForAdmin();
        if (mounted) setLinks(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingLink(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(link: FooterLink) {
    setEditingLink(link);
    setForm({ label: link.label, url: link.url, is_active: link.is_active });
    setIsFormOpen(true);
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.label.trim() || !form.url.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editingLink) {
        const updated = await updateFooterLink(editingLink.id, form);
        setLinks((current) => current.map((l) => (l.id === updated.id ? updated : l)));
      } else {
        const nextOrder = links.length > 0 ? Math.max(...links.map((l) => l.order_index)) + 1 : 0;
        const created = await createFooterLink(form, nextOrder);
        setLinks((current) => [...current, created]);
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
     title: "Delete Link",
     text: "This will permanently delete this footer link.",
     icon: "warning",
     confirmButtonText: "Delete",
     cancelButtonText: "Cancel",
     variant: "danger",
   });
   if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteFooterLink(id);
      setLinks((current) => current.filter((l) => l.id !== id));
      toast.success("Footer link deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const current = links[index];
    const target = links[targetIndex];
    setReorderingId(current.id);
    try {
      await swapFooterLinkOrder(current, target);
      const reordered = [...links];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setLinks(reordered);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }
  async function toggleActive(link: FooterLink) {
    try {
      const updated = await updateFooterLink(link.id, { label: link.label, url: link.url, is_active: !link.is_active });
      setLinks((current) => current.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Footer Links"
        subtitle='Manage the "Quick Links" column shown in the website footer.'
        actionLabel="Add Link"
        onAction={openAddForm}
      />
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading links...</div>
        ) : links.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No footer links yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {links.map((link, index) => (
              <li key={link.id} className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div>
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{link.label}</p>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{link.url}</p>
                </div>
                <AdminRowActions
                  canMoveUp={index !== 0}
                  canMoveDown={index !== links.length - 1}
                  reordering={reorderingId === link.id}
                  onMoveUp={() => void handleReorder(index, "up")}
                  onMoveDown={() => void handleReorder(index, "down")}
                  isActive={link.is_active}
                  onToggleActive={() => void toggleActive(link)}
                  onEdit={() => openEditForm(link)}
                  onDelete={() => void handleDelete(link.id)}
                  deleting={deletingId === link.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingLink ? "Edit Link" : "Add Link"} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Label">
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Home, Blog, Careers"
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>
          <FormField label="URL" hint='Internal pages: start with "/" (e.g. /about). External sites: full URL.'>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="/about or https://..."
              required
              className={inputClass(isDarkTheme)}
            />
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

