export function inputClass(isDarkTheme: boolean): string {
  return `w-full rounded-xl border px-3 py-2.5 outline-none transition ${
    isDarkTheme
      ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
  }`;
}