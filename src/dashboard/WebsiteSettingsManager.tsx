import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import {
  deleteSetting,
  fetchAllWebsiteSettings,
  upsertSetting,
} from "../lib/websiteSettings";
import type { WebsiteSetting } from "../lib/websiteSettings";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import ConfirmDialog from "../components/common/ConfirmDialog";
const WEBSITE_SECTIONS = [
  "hero",
  "stats",
  "services",
  "why-choose-us",
  "about",
  "about-preview",
  "achievements",
  "core-values",
  "leadership",
  "why-started",
  "company-culture",
  "future-goals",
  "why-clients-trust",
  "mission-vision",
  "timeline",
  "process",
  "contact",
  "contact-info",
  "faq",
  "contact-faq",
  "cta-banner",
  "footer",
  "navbar",
  "projects",
  "testimonials",
  "portfolio",
] as const;
type Section = typeof WEBSITE_SECTIONS[number];
export default function WebsiteSettingsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteSetting | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSection, setNewSection] = useState<Section>("hero");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    void loadSettings();
  }, []);
  async function loadSettings() {
    setLoading(true);
    try {
      const data = await fetchAllWebsiteSettings();
      setSettings(data);
      const map: Record<string, string> = {};
      data.forEach((f) => {
        map[f.id] = f.field_value;
      });
      setDrafts(map);
    } catch {
      toast.error("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }
  const groupedBySection = useMemo(() => {
    const groups: Record<string, WebsiteSetting[]> = {};
    settings.forEach((field) => {
      if (!groups[field.section]) groups[field.section] = [];
      groups[field.section].push(field);
    });
    return groups;
  }, [settings]);
  async function handleSave(setting: WebsiteSetting) {
    const newVal = drafts[setting.id] ?? setting.field_value;
    if (newVal === setting.field_value) return;
    setSavingId(setting.id);
    try {
      const updated = await upsertSetting(setting.section, setting.field_key, newVal, setting.field_type);
      setSettings((current) => current.map((f) => (f.id === setting.id ? updated : f)));
      toast.success(`"${setting.field_key}" updated.`);
      await loadSettings();
    } catch {
      toast.error("Unable to save this field.");
    } finally {
      setSavingId(null);
    }
  }
  async function handleDelete(setting: WebsiteSetting) {
    setDeleteTarget(setting);
    setDeleteConfirmOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteConfirmOpen(false);
    setDeletingId(deleteTarget.id);
    try {
      await deleteSetting(deleteTarget.id);
      setSettings((current) => current.filter((f) => f.id !== deleteTarget.id));
      toast.success("Field deleted.");
      await loadSettings();
    } catch {
      toast.error("Unable to delete this field.");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }
  async function handleAddField(event: React.FormEvent) {
    event.preventDefault();
    if (!newKey.trim() || !newValue.trim()) {
      toast.error("Field key and value are required.");
      return;
    }
    setAdding(true);
    try {
      const created = await upsertSetting(newSection, newKey.trim(), newValue.trim(), newFieldType);
      setSettings((current) => [...current, created]);
      setDrafts((current) => ({ ...current, [created.id]: created.field_value }));
      toast.success("Field added.");
      await loadSettings();
      setNewKey("");
      setNewValue("");
      setIsAdding(false);
    } catch {
      toast.error("Unable to add this field.");
    } finally {
      setAdding(false);
    }
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Website Settings" subtitle="Manage global website content, headlines, and section text." actionLabel="Add Field" onAction={() => setIsAdding(true)} />
      {loading ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>Loading settings...</div>
      ) : Object.keys(groupedBySection).length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>No settings yet. Click "Add Field" to create your first editable field.</div>
      ) : (
        Object.entries(groupedBySection).map(([section, sectionFields]) => (
          <div key={section} className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <div className={`border-b px-5 py-3 ${isDarkTheme ? "border-white/10" : "border-slate-200"}`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-violet-500">{section}</h2>
            </div>
            <div className="divide-y divide-white/5">
              {sectionFields.map((field) => {
                const currentValue = drafts[field.id] ?? "";
                return (
                  <div key={field.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-start md:gap-4">
                    <div className="w-full md:w-40">
                      <p className={`text-sm font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{field.field_key}</p>
                      <p className={`mt-0.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>{field.field_type}</p>
                    </div>
                    <div className="w-full flex-1">
                      <textarea value={currentValue} onChange={(event) => setDrafts((current) => ({ ...current, [field.id]: event.target.value }))} rows={field.field_value.length > 80 ? 3 : 1} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`} />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => void handleSave(field)} disabled={savingId === field.id || drafts[field.id] === field.field_value} className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`} title="Save"><Save size={16} /></button>
                      <button type="button" onClick={() => void handleDelete(field)} disabled={deletingId === field.id} className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
      {isAdding && (
        <AdminFormModal
          title="Add Content Field"
          onClose={() => setIsAdding(false)}
          onSubmit={handleAddField}
          saving={adding}
          submitLabel="Add Field"
        >
          <FormField label="Section">
            <select value={newSection} onChange={(e) => setNewSection(e.target.value as Section)} className={inputClass(isDarkTheme)}>
              {WEBSITE_SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Field Key">
            <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. heading, subheading, phone" required className={inputClass(isDarkTheme)} />
          </FormField>
          <FormField label="Field Type">
            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className={inputClass(isDarkTheme)}>
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="url">URL</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
          </FormField>
          <FormField label="Value">
            <textarea value={newValue} onChange={(e) => setNewValue(e.target.value)} required rows={3} className={inputClass(isDarkTheme)} />
          </FormField>
        </AdminFormModal>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete field"
        description={deleteTarget ? `Delete "${deleteTarget.field_key}" from ${deleteTarget.section}?` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deletingId === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

