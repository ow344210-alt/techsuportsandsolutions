// Dedicated editor for the "contact-info" section of site_content. These are
// the exact keys the public Contact page, Footer and ContactInfoCard read, so
// this page is the single source of truth for how the business wants to be
// reached. Each field is saved individually and the shared SiteContentContext
// is refetched so the public site updates immediately.
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import { useSiteContentContext } from "../contexts/SiteContentContext.types";
import AdminPageHeader from "./components/AdminPageHeader";
import { inputClass } from "./components/FormField.utils";
import {
  fetchSectionContent,
  upsertContentField,
} from "../lib/siteContent";
import type { ContentField } from "../lib/siteContent";

interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "textarea" | "tel" | "email" | "url";
}

const FIELD_DEFS: FieldDef[] = [
  { key: "phone", label: "Primary Phone", hint: 'Shown in the footer, Contact page "Call Us" card, and the tel: link.', type: "tel" },
  { key: "emergency_phone", label: "Emergency Phone", hint: 'Shown under "Emergency Support" on the Contact page card.', type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "address", label: "Address", hint: "Used by the Contact page card and the Google Maps embed.", type: "text" },
  { key: "working_days", label: "Working Days", type: "text" },
  { key: "working_hours", label: "Working Hours", type: "text" },
  { key: "weekend_days", label: "Weekend Days", type: "text" },
  { key: "weekend_hours", label: "Weekend Hours", type: "text" },
  { key: "sunday_status", label: "Sunday Status", type: "text" },
  { key: "emergency_note", label: "Emergency Note", type: "textarea" },
  { key: "response_time", label: "Response Time", type: "text" },
  { key: "facebook_url", label: "Facebook URL", type: "url" },
  { key: "instagram_url", label: "Instagram URL", type: "url" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { key: "twitter_url", label: "Twitter URL", type: "url" },
];

export default function ContactSettingsManager() {
  const { refetch } = useSiteContentContext();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [fields, setFields] = useState<ContentField[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSectionContent("contact-info");
        if (mounted) {
          setFields(data);
          const map: Record<string, string> = {};
          data.forEach((f) => {
            map[f.field_key] = f.field_value;
          });
          setDrafts(map);
        }
      } catch {
        toast.error("Unable to load contact settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fieldMap = useMemo(() => {
    const map: Record<string, ContentField> = {};
    fields.forEach((f) => {
      map[f.field_key] = f;
    });
    return map;
  }, [fields]);

  async function handleSave(def: FieldDef) {
    const existing = fieldMap[def.key];
    const currentValue = drafts[def.key] ?? "";
    if (existing && currentValue === existing.field_value) return;

    setSavingKey(def.key);
    try {
      const updated = await upsertContentField(
        "contact-info",
        def.key,
        currentValue,
        existing?.field_type ?? "text",
      );
      setFields((current) => {
        const idx = current.findIndex((f) => f.field_key === def.key);
        if (idx === -1) return [...current, updated];
        const next = [...current];
        next[idx] = updated;
        return next;
      });
      await refetch();
      toast.success(`${def.label} saved.`);
    } catch {
      toast.error("Unable to save. Please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Settings"
        subtitle={
          <>
            Edit how visitors can reach you. These fields power the Contact page,
            footer, and the contact card — save any field and it updates the
            public site immediately.
          </>
        }
      />

      {loading ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
          Loading contact settings...
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {FIELD_DEFS.map((def) => {
            const currentValue = drafts[def.key] ?? "";
            const isSaved = fieldMap[def.key]?.field_value === currentValue;
            return (
              <div
                key={def.key}
                className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
                  isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}
              >
                <label
                  className={`block text-sm font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  {def.label}
                </label>
                {def.hint && (
                  <p className={`mt-0.5 mb-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {def.hint}
                  </p>
                )}
                <div className="flex items-start gap-2">
                  {def.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={currentValue}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [def.key]: event.target.value }))
                      }
                      className={inputClass(isDarkTheme)}
                    />
                  ) : (
                    <input
                      type={def.type ?? "text"}
                      value={currentValue}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [def.key]: event.target.value }))
                      }
                      className={inputClass(isDarkTheme)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSave(def)}
                    disabled={savingKey === def.key || isSaved}
                    className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isDarkTheme
                        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                    title="Save"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
