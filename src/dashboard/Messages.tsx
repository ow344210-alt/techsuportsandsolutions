import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Wifi, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase/client";
import { useDebouncedValue } from "../hooks/useDebouncedValue";


type MessageStatus = "New" | "Read";

type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: MessageStatus;
};

export default function Messages() {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [statusFilter, setStatusFilter] = useState<"All" | MessageStatus>(
    "All",
  );
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(
    null,
  );

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);

      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, full_name, email, subject, message, created_at, status")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMessages(data as ContactMessage[]);
      }

      setLoading(false);
    }

    void fetchMessages();
  }, []);

  // Realtime subscription: dashboard updates instantly on new/updated/deleted messages
  useEffect(() => {
    const channel = supabase
      .channel("contact_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_messages" },
        (payload) => {
          const newMessage = payload.new as ContactMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === newMessage.id)) {
              return current;
            }
            return [newMessage, ...current];
          });

          toast.success(`New message from ${newMessage.full_name}`);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contact_messages" },
        (payload) => {
          const updatedMessage = payload.new as ContactMessage;

          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id
                ? { ...message, ...updatedMessage }
                : message,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "contact_messages" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;

          setMessages((current) =>
            current.filter((message) => message.id !== deletedId),
          );
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function markAsRead(id: string) {
    if (updatingId) {
      return;
    }

    setUpdatingId(id);

    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "Read" })
      .eq("id", id);

    if (error) {
      toast.error("Unable to mark this message as read.");
      setUpdatingId(null);
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === id ? { ...message, status: "Read" } : message,
      ),
    );

    setViewingMessage((current) =>
      current && current.id === id ? { ...current, status: "Read" } : current,
    );

    toast.success("Message marked as read.");
    setUpdatingId(null);
  }

  async function deleteMessage(id: string) {
    if (deletingId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this message?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Unable to delete this message.");
      setDeletingId(null);
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.filter((message) => message.id !== id),
    );
    setViewingMessage((current) =>
      current && current.id === id ? null : current,
    );
    toast.success("Message deleted successfully.");
    setDeletingId(null);
  }

  function openMessage(message: ContactMessage) {
    setViewingMessage(message);

    if (message.status === "New") {
      void markAsRead(message.id);
    }
  }

  const filteredMessages = useMemo(() => {
  const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesQuery =
        message.full_name.toLowerCase().includes(normalizedQuery) ||
        message.email.toLowerCase().includes(normalizedQuery) ||
        message.subject.toLowerCase().includes(normalizedQuery) ||
        message.message.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "All" || message.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [messages, debouncedQuery, statusFilter]);

  function exportMessagesAsCsv() {
    if (filteredMessages.length === 0) {
      toast.error("No messages available to export.");
      return;
    }

    const headers = [
      "Full Name",
      "Email",
      "Subject",
      "Message",
      "Date",
      "Status",
    ];
    const csvRows = filteredMessages.map((message) => [
      message.full_name,
      message.email,
      message.subject,
      message.message,
      new Date(message.created_at).toLocaleDateString(),
      message.status,
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "contact-messages.csv";
    anchor.click();

    URL.revokeObjectURL(url);
    toast.success("Messages exported successfully.");
  }

  const isDarkTheme = theme === "dark";

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
          isDarkTheme
            ? "border-white/10 bg-slate-900/70 text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      ></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Contact Messages</h1>
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isLive
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-slate-300/40 bg-slate-500/10 text-slate-500 dark:text-slate-400"
              }`}
            >
              <Wifi size={12} className={isLive ? "animate-pulse" : ""} />
              {isLive ? "Live" : "Connecting..."}
            </div>
          </div>
          <p
            className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            Review incoming customer requests and track their status.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto md:max-w-2xl md:flex-nowrap md:items-center">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px] md:max-w-sm">
            <Search
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkTheme ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or subject"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3 outline-none transition ${
                isDarkTheme
                  ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500"
                  : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"
              }`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "All" | MessageStatus)
            }
            className={`w-full rounded-xl border px-3 py-2.5 outline-none transition sm:w-auto sm:min-w-[130px] md:w-40 ${
              isDarkTheme
                ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
                : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"
            }`}
          >
            <option value="All">All</option>
            <option value="New">New</option>
            <option value="Read">Read</option>
            <option value="Archived">Archived</option>
            <option value="Spam">Spam</option>
          </select>

          <button
            type="button"
            onClick={exportMessagesAsCsv}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
              isDarkTheme
                ? "bg-violet-500 text-white hover:bg-violet-400"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme
            ? "border-white/10 bg-slate-900/70"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div
              className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
            >
              Loading messages...
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead
                className={
                  isDarkTheme
                    ? "bg-slate-950/80 text-slate-300"
                    : "bg-slate-50 text-slate-700"
                }
              >
                <tr>
                  <th className="px-4 py-3 font-semibold">Full Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr
                    key={message.id}
                    className={`border-t ${
                      isDarkTheme
                        ? "border-white/10 text-slate-200"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {message.full_name}
                    </td>
                    <td className="px-4 py-3">{message.email}</td>
                    <td className="px-4 py-3">{message.subject}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openMessage(message)}
                        className={`max-w-xs truncate text-left underline-offset-2 hover:underline ${
                          isDarkTheme ? "text-slate-300" : "text-slate-600"
                        }`}
                        title="Click to view full message"
                      >
                        {message.message}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          message.status === "New"
                            ? isDarkTheme
                              ? "bg-violet-500/15 text-violet-300"
                              : "bg-violet-100 text-violet-700"
                            : isDarkTheme
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {message.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <button
                          type="button"
                          onClick={() => openMessage(message)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            isDarkTheme
                              ? "bg-white/5 text-slate-200 hover:bg-white/10"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteMessage(message.id)}
                          disabled={deletingId === message.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            deletingId === message.id
                              ? "cursor-not-allowed opacity-60"
                              : isDarkTheme
                                ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                                : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          }`}
                        >
                          {deletingId === message.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredMessages.length === 0 && (
          <div
            className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            No messages found.
          </div>
        )}
      </div>

      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className={`w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl ${
              isDarkTheme
                ? "border-white/10 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{viewingMessage.subject}</h2>
                <p
                  className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                >
                  From {viewingMessage.full_name} &lt;{viewingMessage.email}&gt;
                </p>
                <p
                  className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                >
                  {new Date(viewingMessage.created_at).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingMessage(null)}
                className={`rounded-full p-1.5 transition ${
                  isDarkTheme
                    ? "text-slate-400 hover:bg-white/10"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className={`whitespace-pre-wrap rounded-xl border p-4 text-sm ${
                isDarkTheme
                  ? "border-white/10 bg-slate-950 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {viewingMessage.message}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void deleteMessage(viewingMessage.id)}
                disabled={deletingId === viewingMessage.id}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDarkTheme
                    ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
              >
                {deletingId === viewingMessage.id ? "Deleting..." : "Delete"}
              </button>

              <button
                type="button"
                onClick={() => setViewingMessage(null)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isDarkTheme
                    ? "bg-violet-500 text-white hover:bg-violet-400"
                    : "bg-violet-600 text-white hover:bg-violet-500"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
