import { Activity } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useTheme } from "../../context/ThemeContext.types";
import type { DailyCount } from "../../lib/dashboardStats";

interface MessagesChartProps {
  data: DailyCount[];
  loading: boolean;
}

export default function MessagesChart({ data, loading }: MessagesChartProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isDarkTheme ? "border-white/10 bg-[#12182B]" : "border-slate-100 bg-white"
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${isDarkTheme ? "bg-violet-500/25" : "bg-violet-100"}`}>
          <Activity size={18} className={isDarkTheme ? "text-violet-300" : "text-violet-600"} />
        </div>
        <div>
          <h2 className={`text-base font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Messages This Week
          </h2>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Daily volume, last 7 days</p>
        </div>
      </div>

      {loading ? (
        <div className={`h-56 animate-pulse rounded-xl ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-100"}`} />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDarkTheme ? "#94a3b8" : "#64748b", fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: isDarkTheme ? "rgba(167, 139, 250, 0.08)" : "rgba(124, 58, 237, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: isDarkTheme ? "#1e293b" : "#1e1b3a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
                labelStyle={{ color: "#c4b5fd", marginBottom: 4 }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={32}>
                {data.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={
                      entry.count === maxCount
                        ? isDarkTheme
                          ? "#a78bfa"
                          : "#7c3aed"
                        : isDarkTheme
                          ? "#4c3d7a"
                          : "#ddd6fe"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
