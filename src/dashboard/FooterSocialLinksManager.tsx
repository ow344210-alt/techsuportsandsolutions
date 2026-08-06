import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../context/ThemeContext.types";
import {
  createFooterSocialLink,
  deleteFooterSocialLink,
  fetchFooterSocialLinksForAdmin,
  isPlatformDuplicate,
  swapFooterSocialLinkOrder,
  updateFooterSocialLink,
  validateFooterSocialLink,
  getFooterSocialIcon,
  FOOTER_SOCIAL_PLATFORMS,
  FOOTER_SOCIAL_ICON_OPTIONS,
} from "../lib/footerSocialLinks";
import type {
  FooterSocialLink,
  FooterSocialLinkPayload,
} from "../lib/footerSocialLinks";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import AdminFormModal from "./components/AdminFormModal";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";

const EMPTY_FORM: FooterSocialLinkPayload = {
  platform_key: "instagram",
  label: "",
  url: "",
  link_type: "social",
  icon_key: "instagram",
  is_enabled: true,
  open_in_new_tab: true,
};

export default function FooterSocialLinksManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [links, setLinks] = useState<FooterSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterSocialLink | null>(null);
  const [form, setForm] = useState<FooterSocialLinkPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchFooterSocialLinksForAdmin();
        if (mounted) setLinks(data);
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function openAddForm() {
    setEditingLink(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(link: FooterSocialLink) {
    setEditingLink(link);
    setForm({
      platform_key: link.platform_key,
      label: link.label,
      url: link.url,
      link_type: link.link_type,
      icon_key: link.icon_key,
      is_enabled: link.is_enabled,
      open_in_new_tab: link.open_in_new_tab,
    });
    setIsFormOpen(true);
  }

  function handlePlatformChange(platformKey: string) {
    const platform = FOOTER_SOCIAL_PLATFORMS.find((p) => p.key === platformKey);
    if (!platform) return;
    setForm((current) => ({
      ...current,
      platform_key: platform.key,
      icon_key: platform.iconKey,
      label: current.label.trim() ? current.label : platform.label,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateFooterSocialLink(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (
      form.is_enabled &&
      isPlatformDuplicate(links, form.platform_key, editingLink?.id ?? null)
    ) {
      toast.error(
        "An enabled link for this platform already exists. Disable it first or edit that link.",
      );
      return;
    }
    setSaving(true);
    try {
      if (editingLink) {
        const updated = await updateFooterSocialLink(editingLink.id, form);
        setLinks((current) =>
          current.map((l) => (l.id === updated.id ? updated : l)),
        );
        toast.success("Social link updated successfully.");
      } else {
        const nextSortOrder =
          links.length > 0
            ? Math.max(...links.map((l) => l.sort_order)) + 1
            : 0;
        const created = await createFooterSocialLink(form, nextSortOrder);
        setLinks((current) => [...current, created]);
        toast.success("Social link added successfully.");
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
      title: "Delete Social Link",
      text: "This will permanently remove this social link from the footer.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteFooterSocialLink(id);
      setLinks((current) => current.filter((l) => l.id !== id));
      toast.success("Social link deleted successfully.");
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
      await swapFooterSocialLinkOrder(current, target);
      const reordered = [...links];
      reordered[index] = { ...current, sort_order: target.sort_order };
      reordered[targetIndex] = { ...target, sort_order: current.sort_order };
      reordered.sort((a, b) => a.sort_order - b.sort_order);
      setLinks(reordered);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  async function toggleActive(link: FooterSocialLink) {
    const nextEnabled = !link.is_enabled;
    if (nextEnabled && isPlatformDuplicate(links, link.platform_key, link.id)) {
      toast.error(
        "An enabled link for this platform already exists. Disable it first or edit that link.",
      );
      return;
    }
    try {
      const updated = await updateFooterSocialLink(link.id, {
        platform_key: link.platform_key,
        label: link.label,
        url: link.url,
        link_type: link.link_type,
        icon_key: link.icon_key,
        is_enabled: nextEnabled,
        open_in_new_tab: link.open_in_new_tab,
      });
      setLinks((current) =>
        current.map((l) => (l.id === updated.id ? updated : l)),
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Social Links"
        subtitle='Manage the social-media strip shown at the top of the website footer.'
        actionLabel="Add Link"
        onAction={openAddForm}
      />
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme
            ? "border-white/10 bg-slate-900/70"
            : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div
            className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            Loading social links...
          </div>
        ) : links.length === 0 ? (
          <div
            className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            No social links yet.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {links.map((link, index) => {
              const Icon = getFooterSocialIcon(link.icon_key);
              const platform = FOOTER_SOCIAL_PLATFORMS.find(
                (p) => p.key === link.platform_key,
              );
              return (
                <li
                  key={link.id}
                  className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDarkTheme ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"}`}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                      >
                        {link.label}
                      </p>
                      <p
                        className={`truncate text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {link.url}
                      </p>
                      <p
                        className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {platform?.label ?? link.platform_key}
                      </p>
                    </div>
                  </div>
                  <AdminRowActions
                    canMoveUp={index !== 0}
                    canMoveDown={index !== links.length - 1}
                    reordering={reorderingId === link.id}
                    onMoveUp={() => void handleReorder(index, "up")}
                    onMoveDown={() => void handleReorder(index, "down")}
                    isActive={link.is_enabled}
                    onToggleActive={() => void toggleActive(link)}
                    onEdit={() => openEditForm(link)}
                    onDelete={() => void handleDelete(link.id)}
                    deleting={deletingId === link.id}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {isFormOpen && (
        <AdminFormModal
          title={editingLink ? "Edit Social Link" : "Add Social Link"}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          saving={saving}
        >
          <FormField label="Platform">
            <select
              value={form.platform_key}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className={inputClass(isDarkTheme)}
            >
              {FOOTER_SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform.key} value={platform.key}>
                  {platform.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Label">
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Instagram"
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>
          <FormField label="URL" hint="Must be a valid http(s) link.">
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>
          <FormField label="Icon">
            <select
              value={form.icon_key}
              onChange={(e) =>
                setForm({ ...form, icon_key: e.target.value })
              }
              className={inputClass(isDarkTheme)}
            >
              {FOOTER_SOCIAL_ICON_OPTIONS.map((icon) => (
                <option key={icon.key} value={icon.key}>
                  {icon.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Link type">
            <select
              value={form.link_type}
              onChange={(e) =>
                setForm({ ...form, link_type: e.target.value })
              }
              className={inputClass(isDarkTheme)}
            >
              <option value="social">Social</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_enabled}
              onChange={(e) =>
                setForm({ ...form, is_enabled: e.target.checked })
              }
            />
            Visible on website
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.open_in_new_tab}
              onChange={(e) =>
                setForm({ ...form, open_in_new_tab: e.target.checked })
              }
            />
            Open in a new tab
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}
