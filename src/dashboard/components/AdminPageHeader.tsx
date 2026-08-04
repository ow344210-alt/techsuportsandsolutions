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
  badge?: ReactNode;
}

export default function AdminPageHeader({ title, subtitle, actionLabel, onAction, extra, badge }: AdminPageHeaderProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
        isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{subtitle}</p>
      </div>

      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {extra}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold transition sm:w-auto sm:min-w-[120px] ${
              isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            <Plus size={18} className="shrink-0" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
