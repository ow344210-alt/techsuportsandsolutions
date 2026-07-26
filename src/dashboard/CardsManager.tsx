import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
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

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadGroups() {
    setLoadingGroups(true);
    try {
      const data = await fetchGroupsForPage(page, true);
      setGroups(data);
    } catch {
      toast.error("Unable to load sections.");
    } finally {
      setLoadingGroups(false);
    }
  }

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
      <div
        className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
          isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">Page Cards</h1>
          <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Create image card sections on any page — no code changes needed.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={openAddGroup}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            <Plus size={18} />
            New Section
          </button>
        </div>
      </div>

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

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => void handleReorderGroup(index, "up")}
                    disabled={index === 0 || reorderingGroupId === group.id}
                    className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorderGroup(index, "down")}
                    disabled={index === groups.length - 1 || reorderingGroupId === group.id}
                    className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditGroup(group)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <Pencil size={14} className="mr-1 inline" />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteGroup(group.id)}
                    disabled={deletingGroupId === group.id}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}
                  >
                    <Trash2 size={14} className="mr-1 inline" />
                    Delete
                  </button>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form
            onSubmit={handleGroupSubmit}
            className={`w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl ${
              isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingGroup ? "Rename Section" : "New Section"}</h2>
              <button type="button" onClick={() => setIsGroupFormOpen(false)} className={`rounded-full p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Section Title</label>
              <input
                type="text"
                value={groupTitleInput}
                onChange={(event) => setGroupTitleInput(event.target.value)}
                placeholder="e.g. Our Team, Portfolio, Client Reviews"
                required
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"}`}
              />
              <p className={`mt-1.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                This title shows as the section heading on the "{page}" page.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={groupActiveInput} onChange={(event) => setGroupActiveInput(event.target.checked)} />
              Visible on website
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsGroupFormOpen(false)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Cancel
              </button>
              <button type="submit" disabled={savingGroup} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"}`}>
                {savingGroup ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
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
    void loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function loadCards() {
    setLoading(true);
    try {
      const data = await fetchCardsForGroup(groupId, true);
      setCards(data);
    } catch {
      toast.error("Unable to load cards.");
    } finally {
      setLoading(false);
    }
  }

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

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button type="button" onClick={() => void handleReorder(index, "up")} disabled={index === 0 || reorderingId === card.id} className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-white text-slate-700 hover:bg-slate-200"}`}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => void handleReorder(index, "down")} disabled={index === cards.length - 1 || reorderingId === card.id} className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-white text-slate-700 hover:bg-slate-200"}`}>
                  <ArrowDown size={14} />
                </button>
                <button type="button" onClick={() => openEditForm(card)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-white text-slate-700 hover:bg-slate-200"}`}>
                  <Pencil size={12} className="mr-1 inline" />
                  Edit
                </button>
                <button type="button" onClick={() => void handleDelete(card.id)} disabled={deletingId === card.id} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}>
                  <Trash2 size={12} className="mr-1 inline" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <form
            onSubmit={handleSubmit}
            className={`w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl ${isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingCard ? "Edit Card" : "Add Card"}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className={`rounded-full p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Image</label>
              <div className="flex items-center gap-3">
                {form.image_url && <img src={form.image_url} alt="Card" className="h-16 w-24 rounded-xl object-cover" />}
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  <ImagePlus size={16} />
                  {uploadingImage ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                  <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadingImage} className="hidden" />
                </label>
              </div>
              <p className={`mt-1.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                Recommended: 800×450px (16:9) or larger, under 5MB.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Link (optional)</label>
              <input
                type="text"
                value={form.link_url ?? ""}
                onChange={(event) => setForm({ ...form, link_url: event.target.value || null })}
                placeholder="https://... or #contact"
                className={`w-full rounded-xl border px-3 py-2.5 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"}`}
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              Visible on website
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Cancel
              </button>
              <button type="submit" disabled={saving || uploadingImage} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"}`}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}