import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import { createFaq, deleteFaq, fetchFaqsForAdmin, swapFaqOrder, updateFaq } from "../lib/faqs";
import type { Faq, FaqPayload } from "../lib/faqs";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
const PAGES = ["home", "contact-faq"];
const EMPTY_FORM: FaqPayload = { question: "", answer: "", is_active: true };
export default function FaqManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [page, setPage] = useState(PAGES[0]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [form, setForm] = useState<FaqPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchFaqsForAdmin(page);
        if (mounted) setFaqs(data);
      } catch {
        if (mounted) toast.error("Unable to load FAQs.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page]);
  function openAddForm() {
    setEditingFaq(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(faq: Faq) {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, is_active: faq.is_active });
    setIsFormOpen(true);
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingFaq) {
        const updated = await updateFaq(editingFaq.id, form);
        setFaqs((current) => current.map((f) => (f.id === updated.id ? updated : f)));
        toast.success("FAQ updated.");
      } else {
        const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order_index)) + 1 : 0;
        const created = await createFaq(page, form, nextOrder);
        setFaqs((current) => [...current, created]);
        toast.success("FAQ added.");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Unable to save this FAQ.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id: string) {
    if (!window.confirm("Delete this FAQ?")) return;
    setDeletingId(id);
    try {
      await deleteFaq(id);
      setFaqs((current) => current.filter((f) => f.id !== id));
      toast.success("FAQ deleted.");
    } catch {
      toast.error("Unable to delete this FAQ.");
    } finally {
      setDeletingId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    const current = faqs[index];
    const target = faqs[targetIndex];
    setReorderingId(current.id);
    try {
      await swapFaqOrder(current, target);
      const reordered = [...faqs];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setFaqs(reordered);
    } catch {
      toast.error("Unable to reorder FAQs.");
    } finally {
      setReorderingId(null);
    }
  }
  async function toggleActive(faq: Faq) {
    try {
      const updated = await updateFaq(faq.id, { question: faq.question, answer: faq.answer, is_active: !faq.is_active });
      setFaqs((current) => current.map((f) => (f.id === updated.id ? updated : f)));
    } catch {
      toast.error("Unable to update this FAQ.");
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQs"
        subtitle="Manage unlimited frequently asked questions per page."
        actionLabel="Add FAQ"
        onAction={openAddForm}
        extra={
          <select
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition ${
              isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
            }`}
          >
            {PAGES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        }
      />
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            No FAQs yet for "{page}". Click "Add FAQ" to create one.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {faqs.map((faq, index) => (
              <li key={faq.id} className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{faq.question}</p>
                  <p className={`mt-1 line-clamp-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{faq.answer}</p>
                </div>
                <AdminRowActions
                  canMoveUp={index !== 0}
                  canMoveDown={index !== faqs.length - 1}
                  reordering={reorderingId === faq.id}
                  onMoveUp={() => void handleReorder(index, "up")}
                  onMoveDown={() => void handleReorder(index, "down")}
                  isActive={faq.is_active}
                  onToggleActive={() => void toggleActive(faq)}
                  onEdit={() => openEditForm(faq)}
                  onDelete={() => void handleDelete(faq.id)}
                  deleting={deletingId === faq.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingFaq ? "Edit FAQ" : "Add FAQ"} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Question">
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>
          <FormField label="Answer">
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
              rows={4}
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

