// Consistent label+input styling for every admin form field.
import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

interface FormFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, hint, children }: FormFieldProps) {
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

export function inputClass(isDarkTheme: boolean) {
  return `w-full rounded-xl border px-3 py-2.5 outline-none transition ${
    isDarkTheme
      ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
  }`;
}