import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { useSiteContentContext } from "../contexts/SiteContentContext";

import {
  deleteContentField,
  fetchAllContent,
  upsertContentField,
} from "../lib/siteContent";
import type { ContentField } from "../lib/siteContent";

const KNOWN_SECTIONS = ["hero", "about", "process", "contact", "footer", "navbar", "services"];

// Recommended max length per field type — based on where it's rendered in the design.
// Short fields (headings, badges, buttons) break layout if too long; paragraph
// fields have flexible wrapping and can hold more text safely.
function getRecommendedLimit(fieldKey: string): number {
  const key = fieldKey.toLowerCase();

  if (key.includes("badge") || key.includes("label") || key.includes("number")) return 25;
  if (key.includes("btn") || key.includes("button")) return 25;
  if (key.includes("heading") && !key.includes("sub")) return 45;
  if (key.includes("stat") && key.includes("value")) return 10;
  if (key.includes("title")) return 45;
  if (key.includes("subheading")) return 140;
  if (key.includes("paragraph") || key.includes("desc") || key.includes("message") || key.includes("note")) return 300;
  if (key.includes("email") || key.includes("phone") || key.includes("location") || key.includes("url") || key.includes("handle")) return 80;

  return 100;
}

export default function ContentManager() {
  const { refetch } = useSiteContentContext();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [fields, setFields] = useState<ContentField[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [isAdding, setIsAdding] = useState(false);
  const [newSection, setNewSection] = useState(KNOWN_SECTIONS[0]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    try {
      const data = await fetchAllContent();
      setFields(data);
      const map: Record<string, string> = {};
      data.forEach((f) => {
        map[f.id] = f.field_value;
      });
      setDrafts(map);
    } catch {
      toast.error("Unable to load content.");
    } finally {
      setLoading(false);
    }
  }

  const groupedBySection = useMemo(() => {
    const groups: Record<string, ContentField[]> = {};
    fields.forEach((field) => {
      if (!groups[field.section]) groups[field.section] = [];
      groups[field.section].push(field);
    });
    return groups;
  }, [fields]);

  async function handleSave(field: ContentField) {
    const newVal = drafts[field.id] ?? field.field_value;
    if (newVal === field.field_value) return;

    setSavingKey(field.id);
    try {
      const updated = await upsertContentField(field.section, field.field_key, newVal, field.field_type);
      setFields((current) => current.map((f) => (f.id === field.id ? updated : f)));
      toast.success(`"${field.field_key}" updated.`);
      await refetch();
    } catch {
      toast.error("Unable to save this field.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDelete(field: ContentField) {
    const confirmed = window.confirm(`Delete "${field.field_key}" from ${field.section}?`);
    if (!confirmed) return;

    setDeletingId(field.id);
    try {
      await deleteContentField(field.id);
      setFields((current) => current.filter((f) => f.id !== field.id));
      toast.success("Field deleted.");
      await refetch();
    } catch {
      toast.error("Unable to delete this field.");
    } finally {
      setDeletingId(null);
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
      const created = await upsertContentField(newSection, newKey.trim(), newValue.trim());
      setFields((current) => [...current, created]);
      setDrafts((current) => ({ ...current, [created.id]: created.field_value }));
      toast.success("Field added.");
      await refetch();
      setNewKey("");
      setNewValue("");
      setIsAdding(false);
    } catch {
      toast.error("Unable to add this field. It may already exist for this section.");
    } finally {
      setAdding(false);
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
          <h1 className="text-2xl font-bold">Website Content</h1>
          <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Edit text used across Hero, About, Process, Contact, Footer and other sections.
          </p>
          <p className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
            The number under each field shows the recommended length — going over it may break the layout on smaller screens.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          <Plus size={18} />
          Add Field
        </button>
      </div>

      {loading ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
          Loading content...
        </div>
      ) : Object.keys(groupedBySection).length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
          No content fields yet. Click "Add Field" to create your first editable section.
        </div>
      ) : (
        Object.entries(groupedBySection).map(([section, sectionFields]) => (
          <div
            key={section}
            className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
              isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`border-b px-5 py-3 ${isDarkTheme ? "border-white/10" : "border-slate-200"}`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-violet-500">{section}</h2>
            </div>

            <div className="divide-y divide-white/5">
              {sectionFields.map((field) => {
                const limit = getRecommendedLimit(field.field_key);
                const currentValue = drafts[field.id] ?? "";
                const currentLength = currentValue.length;
                const isOverLimit = currentLength > limit;
                const isNearLimit = !isOverLimit && currentLength > limit * 0.85;

                return (
                  <div key={field.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-start md:gap-4">
                    <div className="w-full md:w-40">
                      <p className={`text-sm font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                        {field.field_key}
                      </p>
                      <p className={`mt-0.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                        Recommended: ~{limit} chars
                      </p>
                    </div>

                    <div className="w-full flex-1">
                      <textarea
                        value={currentValue}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [field.id]: event.target.value }))
                        }
                        rows={field.field_value.length > 80 ? 3 : 1}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                          isOverLimit
                            ? isDarkTheme
                              ? "border-rose-500/60 bg-slate-950 text-white focus:border-rose-400"
                              : "border-rose-400 bg-rose-50 text-slate-900 focus:border-rose-500"
                            : isDarkTheme
                              ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
                              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
                        }`}
                      />
                      <p
                        className={`mt-1 text-xs font-medium ${
                          isOverLimit
                            ? "text-rose-500"
                            : isNearLimit
                              ? "text-amber-500"
                              : isDarkTheme
                                ? "text-slate-500"
                                : "text-slate-400"
                        }`}
                      >
                        {currentLength} / {limit} characters
                        {isOverLimit && " — this may overflow or wrap oddly on mobile"}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSave(field)}
                        disabled={savingKey === field.id || drafts[field.id] === field.field_value}
                        className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isDarkTheme ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                        title="Save"
                      >
                        <Save size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(field)}
                        disabled={deletingId === field.id}
                        className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form
            onSubmit={handleAddField}
            className={`w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl ${
              isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Content Field</h2>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={`rounded-full p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Section</label>
              <select
                value={newSection}
                onChange={(event) => setNewSection(event.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
                }`}
              >
                {KNOWN_SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Field Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder="e.g. heading, subheading, phone"
                required
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
                }`}
              />
              <p className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                Tip: keys containing "heading", "badge" or "btn" get a shorter recommended limit; "paragraph" or "desc" get a longer one.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Value</label>
              <textarea
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                required
                rows={3}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${
                  isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
                }`}
              />
              {newKey.trim() && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    newValue.length > getRecommendedLimit(newKey)
                      ? "text-rose-500"
                      : isDarkTheme
                        ? "text-slate-500"
                        : "text-slate-400"
                  }`}
                >
                  {newValue.length} / {getRecommendedLimit(newKey)} characters recommended
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"}`}
              >
                {adding ? "Adding..." : "Add Field"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}