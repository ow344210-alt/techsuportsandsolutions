import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import AdminFormModal from "./components/AdminFormModal";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import {
  PAGES,
  createCard,
  createGroup,
  deleteCard,
  deleteGroup,
  fetchCardsForGroup,
  fetchGroupsForPage,
  swapCardOrder,
  swapGroupOrder,
  updateCard,
  updateGroup,
  uploadCardImage,
} from "../lib/contentCards";
import type { CardGroup, ContentCard, ContentCardPayload } from "../lib/contentCards";

const EMPTY_CARD_FORM: ContentCardPayload = {
  title: "",
  description: "",
  image_url: null,
  link_url: null,
  is_active: true,
};

export default function CardsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [page, setPage] = useState<string>(PAGES[0]);
  const [groups, setGroups] = useState<CardGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CardGroup | null>(null);
  const [groupTitleInput, setGroupTitleInput] = useState("");
  const [groupActiveInput, setGroupActiveInput] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [reorderingGroupId, setReorderingGroupId] = useState<string | null>(null);

  // Initialize groups from server on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingGroups(true);
      try {
        const data = await fetchGroupsForPage(page, true);
        if (mounted) setGroups(data);
      } catch {
        if (mounted) toast.error("Unable to load sections.");
      } finally {
        if (mounted) setLoadingGroups(false);
      }
    })();
    return () => { mounted = false; };
  }, [page]);

  function openAddGroup() {
    setEditingGroup(null);
    setGroupTitleInput("");
    setGroupActiveInput(true);
    setIsGroupFormOpen(true);
  }

  function openEditGroup(group: CardGroup) {
    setEditingGroup(group);
    setGroupTitleInput(group.group_title);
    setGroupActiveInput(group.is_active);
    setIsGroupFormOpen(true);
  }

  async function handleGroupSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!groupTitleInput.trim()) {
      toast.error("Section title is required.");
      return;
    }

    setSavingGroup(true);
    try {
      if (editingGroup) {
        const updated = await updateGroup(editingGroup.id, groupTitleInput.trim(), groupActiveInput);
        setGroups((current) => current.map((g) => (g.id === updated.id ? updated : g)));
        toast.success("Section updated.");
      } else {
        const nextOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.group_order)) + 1 : 0;
        const created = await createGroup(page, groupTitleInput.trim(), nextOrder);
        setGroups((current) => [...current, created]);
        toast.success("Section created.");
      }
      setIsGroupFormOpen(false);
    } catch {
      toast.error("Unable to save this section.");
    } finally {
      setSavingGroup(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    const confirmed = window.confirm(
      "Delete this section? All cards inside it will be deleted too.",
    );
    if (!confirmed) return;

    setDeletingGroupId(id);
    try {
      await deleteGroup(id);
      setGroups((current) => current.filter((g) => g.id !== id));
      if (expandedGroupId === id) setExpandedGroupId(null);
      toast.success("Section deleted.");
    } catch {
      toast.error("Unable to delete this section.");
    } finally {
      setDeletingGroupId(null);
    }
  }

  async function handleReorderGroup(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    const current = groups[index];
    const target = groups[targetIndex];
    setReorderingGroupId(current.id);

    try {
      await swapGroupOrder(current, target);
      const reordered = [...groups];
      reordered[index] = { ...current, group_order: target.group_order };
      reordered[targetIndex] = { ...target, group_order: current.group_order };
      reordered.sort((a, b) => a.group_order - b.group_order);
      setGroups(reordered);
    } catch {
      toast.error("Unable to reorder sections.");
    } finally {
      setReorderingGroupId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Page Cards"
        subtitle="Create image card sections on any page — no code changes needed."
        actionLabel="New Section"
        onAction={openAddGroup}
        extra={
          <select
            value={page}
            onChange={(event) => setPage(event.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition ${
              isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
            }`}
          >
            {PAGES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)} page
              </option>
            ))}
          </select>
        }
      />

      {loadingGroups ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
          Loading sections...
        </div>
      ) : groups.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkTheme ? "border-white/10 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
          No sections on the "{page}" page yet. Click "New Section" to create one (e.g. "Our Team", "Portfolio").
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
                isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  {expandedGroupId === group.id ? (
                    <ChevronUp size={18} className="text-violet-500" />
                  ) : (
                    <ChevronDown size={18} className="text-violet-500" />
                  )}
                  <div>
                    <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {group.group_title}
                    </p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      {group.is_active ? "Visible on website" : "Hidden"}
                    </p>
                  </div>
                </button>

                <AdminRowActions
                  onMoveUp={() => void handleReorderGroup(index, "up")}
                  onMoveDown={() => void handleReorderGroup(index, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < groups.length - 1}
                  reordering={reorderingGroupId === group.id}
                  onEdit={() => openEditGroup(group)}
                  onDelete={() => void handleDeleteGroup(group.id)}
                  deleting={deletingGroupId === group.id}
                />
              </div>

              {expandedGroupId === group.id && (
                <div className={`border-t p-4 ${isDarkTheme ? "border-white/10" : "border-slate-200"}`}>
                  <GroupCardsPanel groupId={group.id} isDarkTheme={isDarkTheme} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isGroupFormOpen && (
        <AdminFormModal
          title={editingGroup ? "Rename Section" : "New Section"}
          onClose={() => setIsGroupFormOpen(false)}
          onSubmit={handleGroupSubmit}
          saving={savingGroup}
        >
          <FormField label="Section Title" hint={`This title shows as the section heading on the "${page}" page.`}>
            <input
              type="text"
              value={groupTitleInput}
              onChange={(event) => setGroupTitleInput(event.target.value)}
              placeholder="e.g. Our Team, Portfolio, Client Reviews"
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={groupActiveInput} onChange={(event) => setGroupActiveInput(event.target.checked)} />
            Visible on website
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}

function GroupCardsPanel({ groupId, isDarkTheme }: { groupId: string; isDarkTheme: boolean }) {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ContentCard | null>(null);
  const [form, setForm] = useState<ContentCardPayload>(EMPTY_CARD_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCardsForGroup(groupId, true);
        if (mounted) setCards(data);
      } catch {
        if (mounted) toast.error("Unable to load cards.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId]);

  function openAddForm() {
    setEditingCard(null);
    setForm(EMPTY_CARD_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(card: ContentCard) {
    setEditingCard(card);
    setForm({
      title: card.title,
      description: card.description,
      image_url: card.image_url,
      link_url: card.link_url,
      is_active: card.is_active,
    });
    setIsFormOpen(true);
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadCardImage(file);
      setForm((current) => ({ ...current, image_url: url }));
      toast.success("Image uploaded.");
    } catch {
      toast.error("Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingCard) {
        const updated = await updateCard(editingCard.id, form);
        setCards((current) => current.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Card updated.");
      } else {
        const nextOrderIndex = cards.length > 0 ? Math.max(...cards.map((c) => c.order_index)) + 1 : 0;
        const created = await createCard(groupId, form, nextOrderIndex);
        setCards((current) => [...current, created]);
        toast.success("Card added.");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Unable to save this card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteCard(id);
      setCards((current) => current.filter((c) => c.id !== id));
      toast.success("Card deleted.");
    } catch {
      toast.error("Unable to delete this card.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const current = cards[index];
    const target = cards[targetIndex];
    setReorderingId(current.id);

    try {
      await swapCardOrder(current, target);
      const reordered = [...cards];
      reordered[index] = { ...current, order_index: target.order_index };
      reordered[targetIndex] = { ...target, order_index: current.order_index };
      reordered.sort((a, b) => a.order_index - b.order_index);
      setCards(reordered);
    } catch {
      toast.error("Unable to reorder cards.");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
          Cards in this section
        </p>
        <button
          type="button"
          onClick={openAddForm}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"}`}
        >
          <Plus size={14} />
          Add Card
        </button>
      </div>

      {loading ? (
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading cards...</p>
      ) : cards.length === 0 ? (
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No cards yet.</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${isDarkTheme ? "border-white/10 bg-slate-950/40" : "border-slate-200 bg-slate-50"}`}
            >
              <div className="flex items-center gap-3">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className={`flex h-12 w-16 shrink-0 items-center justify-center rounded-lg text-xs ${isDarkTheme ? "bg-white/5 text-slate-500" : "bg-slate-200 text-slate-400"}`}>
                    No image
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className={`line-clamp-1 text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {card.description || "No description"}
                  </p>
                </div>
              </div>

              <AdminRowActions
                onMoveUp={() => void handleReorder(index, "up")}
                onMoveDown={() => void handleReorder(index, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < cards.length - 1}
                reordering={reorderingId === card.id}
                onEdit={() => openEditForm(card)}
                onDelete={() => void handleDelete(card.id)}
                deleting={deletingId === card.id}
              />
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <AdminFormModal
          title={editingCard ? "Edit Card" : "Add Card"}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          saving={saving}
          submitDisabled={uploadingImage}
        >
          <FormField label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <FormField label="Image" hint="Recommended: 800×450px (16:9) or larger, under 5MB.">
            <div className="flex flex-wrap items-center gap-3">
              {form.image_url && <img src={form.image_url} alt="Card" className="h-16 w-24 rounded-xl object-cover" />}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                <ImagePlus size={16} />
                {uploadingImage ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadingImage} className="hidden" />
              </label>
            </div>
          </FormField>

          <FormField label="Link (optional)">
            <input
              type="text"
              value={form.link_url ?? ""}
              onChange={(event) => setForm({ ...form, link_url: event.target.value || null })}
              placeholder="https://... or #contact"
              className={inputClass(isDarkTheme)}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Visible on website
          </label>
        </AdminFormModal>
      )}
    </div>
  );
}
