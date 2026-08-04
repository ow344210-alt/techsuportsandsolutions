import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../context/ThemeContext.types";
import {
  createStep,
  deleteStep,
  fetchStepsForAdmin,
  swapStepOrder,
  updateStep,
} from "../lib/processSteps";
import type { ProcessStep, ProcessStepPayload } from "../lib/processSteps";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";
const EMPTY_FORM: ProcessStepPayload = {
  title: "",
  purpose: "",
  activities: "",
  deliverables: "",
  timeline: "",
  client_involvement: "",
  is_active: true,
};
export default function ProcessStepsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [form, setForm] = useState<ProcessStepPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchStepsForAdmin();
        if (mounted) setSteps(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  function openAddForm() {
    setEditingStep(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }
  function openEditForm(step: ProcessStep) {
    setEditingStep(step);
    setForm({
      title: step.title,
      purpose: step.purpose,
      activities: step.activities,
      deliverables: step.deliverables,
      timeline: step.timeline,
      client_involvement: step.client_involvement,
      is_active: step.is_active,
    });
    setIsFormOpen(true);
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editingStep) {
        const updated = await updateStep(editingStep.id, form);
        setSteps((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.order_index)) + 1 : 0;
        const created = await createStep(form, nextOrder);
        setSteps((current) => [...current, created]);
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
     title: "Delete Step",
     text: "This will permanently delete this process step.",
     icon: "warning",
     confirmButtonText: "Delete",
     cancelButtonText: "Cancel",
     variant: "danger",
   });
   if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteStep(id);
      setSteps((current) => current.filter((s) => s.id !== id));
      toast.success("Process step deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }
  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const current = steps[index];
    const target = steps[targetIndex];
    setReorderingId(current.id);
    try {
      await swapStepOrder(current, target);
      const reordered = [...steps];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setSteps(reordered);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }
  async function toggleActive(step: ProcessStep) {
    try {
      const updated = await updateStep(step.id, {
        title: step.title,
        purpose: step.purpose,
        activities: step.activities,
        deliverables: step.deliverables,
        timeline: step.timeline,
        client_involvement: step.client_involvement,
        is_active: !step.is_active,
      });
      setSteps((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Process Steps"
        subtitle="Manage the unlimited step-by-step process shown on the Process page."
        actionLabel="Add Step"
        onAction={openAddForm}
      />
      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading steps...</div>
        ) : steps.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No steps yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {steps.map((step, index) => (
              <li key={step.id} className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {index + 1}. {step.title}
                  </p>
                  <p className={`mt-1 line-clamp-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{step.purpose}</p>
                </div>
                <AdminRowActions
                  canMoveUp={index !== 0}
                  canMoveDown={index !== steps.length - 1}
                  reordering={reorderingId === step.id}
                  onMoveUp={() => void handleReorder(index, "up")}
                  onMoveDown={() => void handleReorder(index, "down")}
                  isActive={step.is_active}
                  onToggleActive={() => void toggleActive(step)}
                  onEdit={() => openEditForm(step)}
                  onDelete={() => void handleDelete(step.id)}
                  deleting={deletingId === step.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal title={editingStep ? "Edit Step" : "Add Step"} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} saving={saving}>
          <FormField label="Title">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Purpose">
            <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Activities">
            <textarea value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} rows={2} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Deliverables">
            <textarea value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} rows={2} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Timeline">
            <input type="text" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Client Involvement">
            <textarea value={form.client_involvement} onChange={(e) => setForm({ ...form, client_involvement: e.target.value })} rows={2} className={inputClass(isDarkTheme)} />
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

