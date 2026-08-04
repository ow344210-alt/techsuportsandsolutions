// Shared card wrapper for every admin data table. The card itself never
// grows beyond its parent: `w-full max-w-full min-w-0` keeps it inside the
// dashboard main area, and `overflow-hidden` clips rounded corners without
// creating a competing scroll container (scrolling happens only in the
// dedicated TableScroller around the actual table).
import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext.types";

interface TableCardProps {
  children: ReactNode;
  className?: string;
}

export default function TableCard({ children, className = "" }: TableCardProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div
      className={`w-full max-w-full min-w-0 overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
        isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
      } ${className}`}
    >
      {children}
    </div>
  );
}
