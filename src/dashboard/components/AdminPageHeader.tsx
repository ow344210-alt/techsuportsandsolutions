// Shared header for every admin manager page: title, subtitle, and one
// primary action button. Removes the identical header JSX that was
// duplicated across FaqManager, CardsManager, ContentManager, etc.
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.types";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string | ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
}

export default function AdminPageHeader({ title, subtitle, actionLabel, onAction, extra }: AdminPageHeaderProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
        isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{subtitle}</p>
      </div>

      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {extra}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
              isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            <Plus size={18} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
