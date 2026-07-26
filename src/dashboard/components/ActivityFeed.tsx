import { useEffect, useState } from "react";
import { Activity, Mail, RefreshCw, Trash2, Layers } from "lucide-react";
import { fetchRecentActivity } from "../../lib/activityLogs";
import type { ActivityLog } from "../../lib/activityLogs";
import { supabase } from "../../supabase/client";
import { useTheme } from "../../context/ThemeContext";

function getActivityMeta(action: string) {
  if (action === "message_received")
    return { icon: Mail, bgLight: "bg-sky-100", textLight: "text-sky-600", bgDark: "bg-sky-500/25", textDark: "text-sky-300" };
  if (action === "message_status_changed")
    return { icon: RefreshCw, bgLight: "bg-amber-100", textLight: "text-amber-600", bgDark: "bg-amber-500/25", textDark: "text-amber-300" };
  if (action === "message_deleted")
    return { icon: Trash2, bgLight: "bg-rose-100", textLight: "text-rose-600", bgDark: "bg-rose-500/25", textDark: "text-rose-300" };
  if (action.startsWith("service_"))
    return { icon: Layers, bgLight: "bg-violet-100", textLight: "text-violet-600", bgDark: "bg-violet-500/25", textDark: "text-violet-300" };
  return { icon: Activity, bgLight: "bg-slate-100", textLight: "text-slate-600", bgDark: "bg-slate-500/25", textDark: "text-slate-300" };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityFeed() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRecentActivity(8);
        setLogs(data);
      } catch {
        // Silently fail; not critical to dashboard function
      } finally {
        setLoading(false);
      }
    }

    void load();

    const channel = supabase
      .channel("activity_logs_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          setLogs((current) => [newLog, ...current].slice(0, 8));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isDarkTheme ? "border-white/10 bg-[#12182B]" : "border-slate-100 bg-white"
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${isDarkTheme ? "bg-pink-500/25" : "bg-pink-100"}`}>
          <Activity size={18} className={isDarkTheme ? "text-pink-300" : "text-pink-600"} />
        </div>
        <h2 className={`text-base font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Recent Activity</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-12 animate-pulse rounded-xl ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-100"}`} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>No recent activity yet.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const meta = getActivityMeta(log.action);
            const Icon = meta.icon;
            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 rounded-xl px-2 py-2.5 transition ${
                  isDarkTheme ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
              >
                <div className={`mt-0.5 rounded-lg p-2 ${isDarkTheme ? meta.bgDark : meta.bgLight}`}>
                  <Icon size={14} className={isDarkTheme ? meta.textDark : meta.textLight} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                    {log.description}
                  </p>
                  <p className={`mt-0.5 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {formatRelativeTime(log.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}