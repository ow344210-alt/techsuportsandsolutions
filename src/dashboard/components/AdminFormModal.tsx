// Shared modal shell (overlay, card, close button, footer buttons) for every
// admin add/edit form. Each manager only supplies its own field inputs as
// children — removes the duplicated modal wrapper markup.
import type { ReactNode, FormEvent } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface AdminFormModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  children: ReactNode;
}

export default function AdminFormModal({ title, onClose, onSubmit, saving, children }: AdminFormModalProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">
      <form
        onSubmit={onSubmit}
        className={`w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl ${
          isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <X size={18} />
          </button>
        </div>

        {children}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDarkTheme ? "bg-violet-500 hover:bg-violet-400" : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}