import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { deleteNewsletterSubscriber, fetchNewsletterSubscribers } from "../lib/newsletter";
import type { NewsletterSubscriber } from "../lib/newsletter";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRowActions from "./components/AdminRowActions";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";

export default function NewsletterManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchNewsletterSubscribers();
        if (mounted) setSubscribers(data);
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id: string) {
    const result = await showConfirm({
      title: "Delete Subscriber",
      text: "This will permanently delete this newsletter subscriber.",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      await deleteNewsletterSubscriber(id);
      setSubscribers((current) => current.filter((s) => s.id !== id));
      toast.success("Subscriber deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Newsletter Subscribers" subtitle={`${subscribers.length} total subscribers`} />

      <div
        className={`flex items-center gap-3 rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDarkTheme ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"
          }`}
        >
          <Users size={24} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{subscribers.length}</p>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Total Subscribers</p>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No subscribers yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className={`flex items-center justify-between p-4 ${
                  isDarkTheme ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <div className="min-w-0">
                  <p className={`break-all font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{subscriber.email}</p>
                  <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                    Subscribed on {new Date(subscriber.subscribed_at).toLocaleDateString()} at{" "}
                    {new Date(subscriber.subscribed_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="shrink-0">
                  <AdminRowActions onDelete={() => void handleDelete(subscriber.id)} deleting={deletingId === subscriber.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
