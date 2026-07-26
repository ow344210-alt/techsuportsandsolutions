import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  KeyRound,
  LogOut,
  PencilLine,
  Mail,
  CircleDot,
  BookCheck,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";

type RecentMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  created_at: string;
  status: "New" | "Read";
};

const statCardConfig = [
  {
    title: "Total Messages",
    icon: Mail,
  },
  {
    title: "New Messages",
    icon: CircleDot,
  },
  {
    title: "Read Messages",
    icon: BookCheck,
  },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentMessagesLoading, setRecentMessagesLoading] = useState(true);
  const [messageStats, setMessageStats] = useState({ total: 0, new: 0, read: 0 });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name || "Admin";
  const currentDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const greeting = (() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  async function loadMessageStats() {
    const { data, error } = await supabase.from("contact_messages").select("status");

    if (!error && data) {
      const stats = data as Array<{ status: string }>;

      setMessageStats({
        total: stats.length,
        new: stats.filter((item) => item.status === "New").length,
        read: stats.filter((item) => item.status === "Read").length,
      });
    }

    setStatsLoading(false);
  }

  async function loadRecentMessages() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, full_name, email, subject, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentMessages(data as RecentMessage[]);
    }

    setRecentMessagesLoading(false);
  }

  useEffect(() => {
    void loadMessageStats();
    void loadRecentMessages();

    // Realtime subscription: any insert/update/delete on contact_messages
    // refreshes stats and the recent messages list instantly.
    const channel = supabase
      .channel("dashboard_contact_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => {
          void loadMessageStats();
          void loadRecentMessages();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    {
      ...statCardConfig[0],
      value: statsLoading ? "" : String(messageStats.total),
    },
    {
      ...statCardConfig[1],
      value: statsLoading ? "" : String(messageStats.new),
    },
    {
      ...statCardConfig[2],
      value: statsLoading ? "" : String(messageStats.read),
    },
  ];

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  function initialsFor(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  }

  return (
    <div className="max-w-7xl space-y-6 overflow-hidden">

      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_20px_60px_rgba(76,29,149,.16)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_20px_60px_rgba(76,29,149,.28)] md:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-purple-500/20 blur-[100px] dark:bg-purple-600/25" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-pink-500/15 blur-[100px] dark:bg-pink-500/20" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold tracking-[3px] text-violet-700 dark:text-violet-200">
              DASHBOARD HOME
            </span>

            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {fullName}
              </span>
            </h1>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {greeting} — here's what's happening today.
            </p>
            <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">{currentDate}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-900 dark:text-violet-100">
              System status: <span className="font-semibold text-slate-900 dark:text-white">Stable</span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                isLive
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-slate-300/40 bg-slate-500/10 text-slate-500 dark:text-slate-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? "animate-pulse bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {isLive ? "Live" : "Connecting..."}
            </div>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="group rounded-[24px] border border-slate-200 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-400/40 hover:shadow-[0_20px_60px_rgba(168,85,247,.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_40px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_10px_30px_rgba(168,85,247,.35)]"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                >
                  <Icon size={24} />
                </div>

                {statsLoading ? (
                  <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
                ) : (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent">
                    {card.value}
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{card.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live message summary</p>
            </article>
          );
        })}
      </section>

      {/* Recent Messages + Quick Actions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_16px_50px_rgba(15,23,42,0.4)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/15 p-2 text-violet-700 dark:text-violet-200">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Messages</h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/messages")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:gap-2.5 hover:text-pink-500 dark:text-violet-300"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {recentMessagesLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300">
                Loading recent messages...
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300">
                No messages found.
              </div>
            ) : (
              recentMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-violet-400/30 hover:bg-violet-500/10 dark:border-white/10 dark:bg-slate-950/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                    >
                      {initialsFor(message.full_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{message.full_name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{message.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              message.status === "New"
                                ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            }`}
                          >
                            {message.status}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-200">{message.subject}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_16px_50px_rgba(15,23,42,0.4)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-2 text-violet-700 dark:text-violet-200">
              <PencilLine size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/profile")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,.3)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(168,85,247,.4)]"
              style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
            >
              <PencilLine size={18} />
              Edit Profile
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard/settings")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3.5 text-sm font-semibold text-violet-900 transition hover:border-violet-400/50 hover:bg-violet-500/20 dark:text-violet-100"
            >
              <KeyRound size={18} />
              Change Password
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3.5 text-sm font-semibold text-rose-900 transition hover:border-rose-400/50 hover:bg-rose-500/20 dark:text-rose-100"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}