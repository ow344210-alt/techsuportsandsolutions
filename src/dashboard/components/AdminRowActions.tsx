// Shared action-button cluster used in every admin list row: reorder
// up/down, enable/disable toggle, edit, delete. Consolidates the identical
// buttons previously duplicated in FaqManager, CardsManager,
// FooterLinksManager, ServicesManager, and HeroSliderManager.
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.types";

interface AdminRowActionsProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reordering?: boolean;
  isActive?: boolean;
  onToggleActive?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export default function AdminRowActions({
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  reordering = false,
  isActive,
  onToggleActive,
  onEdit,
  onDelete,
  deleting = false,
}: AdminRowActionsProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const neutralBtn = isDarkTheme
    ? "bg-white/5 text-slate-200 hover:bg-white/10"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
      {(onMoveUp || onMoveDown) && (
        <>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp || reordering}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${neutralBtn}`}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown || reordering}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${neutralBtn}`}
          >
            <ArrowDown size={16} />
          </button>
        </>
      )}

      {onToggleActive && (
        <button
          type="button"
          onClick={onToggleActive}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            isActive
              ? isDarkTheme
                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : isDarkTheme
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          {isActive ? "Enabled" : "Disabled"}
        </button>
      )}

      {onEdit && (
        <button type="button" onClick={onEdit} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${neutralBtn}`}>
          <Pencil size={14} className="mr-1 inline" />
          Edit
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
        }`}
      >
        <Trash2 size={14} className="mr-1 inline" />
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
