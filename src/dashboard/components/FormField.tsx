import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext.types";

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className={`mt-1.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>{hint}</p>}
    </div>
  );
}


