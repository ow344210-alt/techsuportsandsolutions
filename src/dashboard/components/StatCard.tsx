import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext.types";
import type { DailyCount } from "../../lib/dashboardStats";
import { memo } from "react";

type ColorKey = "violet" | "sky" | "emerald";

const COLOR_MAP: Record < 
ColorKey,
  {
    badgeBgLight: string;
    badgeTextLight: string;
    badgeBgDark: string;
    badgeTextDark: string;
    lineLight: string;
    lineDark: string;
  }
> = {
  violet: {
    badgeBgLight: "bg-violet-100",
    badgeTextLight: "text-violet-600",
    badgeBgDark: "bg-violet-500/25",
    badgeTextDark: "text-violet-300",
    lineLight: "#7c3aed",
    lineDark: "#a78bfa",
  },
  sky: {
    badgeBgLight: "bg-sky-100",
    badgeTextLight: "text-sky-600",
    badgeBgDark: "bg-sky-500/25",
    badgeTextDark: "text-sky-300",
    lineLight: "#0ea5e9",
    lineDark: "#38bdf8",
  },
  emerald: {
    badgeBgLight: "bg-emerald-100",
    badgeTextLight: "text-emerald-600",
    badgeBgDark: "bg-emerald-500/25",
    badgeTextDark: "text-emerald-300",
    lineLight: "#10b981",
    lineDark: "#34d399",
  },
};

interface StatCardProps {
  title: string;
  value: string;
  loading: boolean;
  icon: LucideIcon;
  colorKey: ColorKey;
  trendPercent: number;
  sparklineData: DailyCount[];
}

const StatCard = memo(function StatCard({
  title,
  value,
  loading,
  icon: Icon,
  colorKey,
  trendPercent,
  sparklineData,
}: StatCardProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const isPositive = trendPercent >= 0;
  const colors = COLOR_MAP[colorKey];

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
        isDarkTheme ? "border-white/10 bg-[#12182B]" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isDarkTheme ? colors.badgeBgDark : colors.badgeBgLight
          }`}
        >
          <Icon size={20} className={isDarkTheme ? colors.badgeTextDark : colors.badgeTextLight} strokeWidth={2.2} />
        </div>

        {loading ? (
          <div className={`h-6 w-16 animate-pulse rounded-lg ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`} />
        ) : (
          <span
            className={`inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              isPositive
                ? isDarkTheme
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
                : isDarkTheme
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trendPercent).toFixed(0)}%
          </span>
        )}
      </div>

      <p className={`mt-4 text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
        {title}
      </p>

      {loading ? (
        <div className={`mt-1.5 h-9 w-20 animate-pulse rounded ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`} />
      ) : (
        <p className={`mt-0.5 text-3xl font-bold tracking-tight ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          {value}
        </p>
      )}

      <div className="mt-3 h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="count"
              stroke={isDarkTheme ? colors.lineDark : colors.lineLight}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
});
export default memo(StatCard);
