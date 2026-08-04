import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Mail, Search, Wifi, X } from "lucide-react";

import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import { supabase } from "../supabase/client";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import ReplyModal from "../components/dashboard/ReplyModal";
import ReplyHistory from "../components/dashboard/ReplyHistory";
import ResponsiveSelect from "../components/ui/ResponsiveSelect";
import AdminPageHeader from "./components/AdminPageHeader";
import TableCard from "./components/TableCard";
import TableScroller from "./components/TableScroller";
import StickyTableScrollbar from "./components/StickyTableScrollbar";
import {
  fetchMessageReplies,
  retryFailedReply,
} from "../lib/contactMessageReplyService";
import type { ContactMessageReply } from "../lib/contactMessageReplies";
import { showConfirm } from "../lib/confirm";

type MessageStatus =
  | "New"
  | "Read"
  | "Archived"
  | "Spam"
  | "Replied"
  | "Resolved"
  | "In Progress";

type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: MessageStatus;
};

interface RawMessage {
  id?: unknown;
  full_name?: unknown;
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  created_at?: unknown;
  status?: unknown;
}

const STATUS_OPTIONS: MessageStatus[] = [
  "New",
  "Read",
  "Archived",
  "Spam",
  "Replied",
  "Resolved",
  "In Progress",
];

// Maps raw database values (lowercase workflow statuses, legacy values,
// and any other casing) to the display labels used by the UI.
const STATUS_LABELS: Record<string, MessageStatus> = {
  new: "New",
  read: "Read",
  archived: "Archived",
  spam: "Spam",
  replied: "Replied",
  resolved: "Resolved",
  in_progress: "In Progress",
};

function normalizeStatus(value: unknown): MessageStatus {
  if (typeof value !== "string") {
    return "New";
  }

  const key = value.trim().toLowerCase().replace(/\s+/g, "_");

  return STATUS_LABELS[key] ?? "New";
}

function generateMessageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Converts a row returned by the database (or pushed through realtime) into a
// fully-normalized ContactMessage. Every field is guaranteed to be a non-null
// string, so callers can safely call .toLowerCase() / render directly.
function normalizeMessage(raw: RawMessage): ContactMessage {
  const fullName = [raw.full_name, raw.name]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : generateMessageId(),
    full_name: fullName ?? "Unknown sender",
    email: typeof raw.email === "string" ? raw.email.trim() : "",
    subject:
      typeof raw.subject === "string" && raw.subject.trim()
        ? raw.subject.trim()
        : "(No subject)",
    message: typeof raw.message === "string" ? raw.message : "",
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    status: normalizeStatus(raw.status),
  };
}

function statusBadgeClasses(
  status: MessageStatus,
  isDarkTheme: boolean,
): string {
  const light: Record<MessageStatus, string> = {
    New: "bg-violet-100 text-violet-700",
    Read: "bg-slate-200 text-slate-600",
    Archived: "bg-amber-100 text-amber-700",
    Spam: "bg-rose-100 text-rose-700",
    Replied: "bg-sky-100 text-sky-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-amber-100 text-amber-700",
  };
  const dark: Record<MessageStatus, string> = {
    New: "bg-violet-500/15 text-violet-300",
    Read: "bg-slate-500/15 text-slate-300",
    Archived: "bg-amber-500/15 text-amber-300",
    Spam: "bg-rose-500/15 text-rose-300",
    Replied: "bg-sky-500/15 text-sky-300",
    Resolved: "bg-emerald-500/15 text-emerald-300",
    "In Progress": "bg-amber-500/15 text-amber-300",
  };

  return isDarkTheme ? dark[status] : light[status];
}

export default function Messages() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
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
  const [replyOpen, setReplyOpen] = useState(false);
  const [replies, setReplies] = useState<ContactMessageReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
  const viewedMessageIdRef = useRef<string | null>(null);
  const tableScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function fetchMessages() {
      setLoading(true);

      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, full_name, email, subject, message, created_at, status")
        .order("created_at", { ascending: false });

      if (!error && data) {
        if (active) {
          setMessages((data as RawMessage[]).map(normalizeMessage));
        }
      } else if (error) {
        if (active) {
          toast.error("Unable to load messages.");
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    void fetchMessages();

    return () => {
      active = false;
    };
  }, []);

  // Realtime subscription: dashboard updates instantly on new/updated/deleted messages
  useEffect(() => {
    const channel = supabase
      .channel("contact_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_messages" },
        (payload) => {
          const newMessage = normalizeMessage(payload.new as RawMessage);

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
          const updatedMessage = normalizeMessage(payload.new as RawMessage);

          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id
                ? { ...message, ...updatedMessage }
                : message,
            ),
          );

          setViewingMessage((current) =>
            current && current.id === updatedMessage.id
              ? { ...current, ...updatedMessage }
              : current,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "contact_messages" },
        (payload) => {
          const oldRow = payload.old as { id?: unknown } | null;
          const deletedId =
            typeof oldRow?.id === "string" ? oldRow.id : "";

          if (!deletedId) {
            return;
          }

          setMessages((current) =>
            current.filter((message) => message.id !== deletedId),
          );

          if (viewedMessageIdRef.current === deletedId) {
            setViewingMessage(null);
            setReplies([]);
            setReplyOpen(false);
          }
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load reply history whenever a message is opened in the details modal.
  useEffect(() => {
    const messageId = viewingMessage?.id;

    if (!messageId) {
      return;
    }

    let active = true;

    void fetchMessageReplies(messageId)
      .then((rows) => {
        if (active) {
          setReplies(rows);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Unable to load reply history.");
        }
      })
      .finally(() => {
        if (active) {
          setRepliesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [viewingMessage?.id]);

  // Keep a stable reference to the message currently open in the details modal
  // so the realtime DELETE handler can reset the modal state.
  useEffect(() => {
    viewedMessageIdRef.current = viewingMessage?.id ?? null;
  }, [viewingMessage?.id]);

  async function markAsRead(id: string) {
    if (updatingId) {
      return;
    }

    setUpdatingId(id);

    // The database stores lowercase workflow statuses only. The "read" value
    // is allowed by the contact_messages_status_check constraint on the
    // remote database (previously "in_progress" was written, which violated
    // the constraint and surfaced as error 23514).
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Mark-as-read failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      toast.error("Unable to mark this message as read.");
      setUpdatingId(null);
      return;
    }

    if (!data || data.length === 0) {
      console.error("Mark-as-read failed", {
        code: "no_rows",
        message: "The update returned no rows; the message may have been deleted.",
      });
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

    const result = await showConfirm({
      title: "Delete Message",
      text: "Are you sure you want to delete this message?",
      icon: "warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;

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

    if (viewedMessageIdRef.current === id) {
      closeMessageDetails();
    }

    toast.success("Message deleted successfully.");
    setDeletingId(null);
  }

  function closeMessageDetails() {
    setViewingMessage(null);
    setReplies([]);
    setReplyOpen(false);
  }

  function openMessage(message: ContactMessage) {
    setReplyOpen(false);
    setRepliesLoading(true);
    setViewingMessage(message);

    if (message.status === "New") {
      void markAsRead(message.id);
    }
  }

  async function refreshReplies(messageId: string) {
    try {
      const rows = await fetchMessageReplies(messageId);
      setReplies(rows);
    } catch {
      toast.error("Unable to refresh reply history.");
    }
  }

  async function handleReplySent() {
    if (!viewingMessage) {
      return;
    }

    const messageId = viewingMessage.id;
    await refreshReplies(messageId);

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, status: "Replied" } : message,
      ),
    );
    setViewingMessage((current) =>
      current && current.id === messageId
        ? { ...current, status: "Replied" }
        : current,
    );
  }

  async function handleRetryReply(replyId: string) {
    if (!viewingMessage) {
      return;
    }

    setRetryLoadingId(replyId);

    try {
      const result = await retryFailedReply(replyId);

      if (!result.success) {
        toast.error(result.error || "Unable to retry this reply.");
        return;
      }

      toast.success("Reply resent successfully.");
      await refreshReplies(viewingMessage.id);
    } catch {
      toast.error("Unable to retry this reply.");
    } finally {
      setRetryLoadingId(null);
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Messages"
        subtitle="Review incoming customer requests and track their status."
        extra={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap">
            <div
              className={`flex w-fit shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${
                isLive
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600"
                  : "border-slate-300/40 bg-slate-500/10 text-slate-500"
              }`}
            >
              <Wifi size={12} className={isLive ? "animate-pulse" : ""} />
              {isLive ? "Live" : "Connecting..."}
            </div>

            <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[220px] lg:w-[280px] lg:flex-none">
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

            <div className="w-full sm:w-auto sm:min-w-[130px] lg:w-40">
              <ResponsiveSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as "All" | MessageStatus)}
                options={[
                  { value: "All", label: "All" },
                  ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                ]}
              />
            </div>

            <button
              type="button"
              onClick={exportMessagesAsCsv}
              className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:w-auto sm:min-w-[120px] ${
                isDarkTheme
                  ? "bg-violet-500 text-white hover:bg-violet-400"
                  : "bg-violet-600 text-white hover:bg-violet-500"
              }`}
            >
              Export CSV
            </button>
          </div>
        }
      />

       <TableCard>
         {loading ? (
           <div
             className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
           >
             Loading messages...
           </div>
         ) : (
           <>
             <TableScroller className="hidden lg:block" scrollRef={tableScrollerRef}>
             <table className="w-full text-left text-sm">
              <thead
                className={
                  isDarkTheme
                    ? "bg-slate-950/80 text-slate-300"
                    : "bg-slate-50 text-slate-700"
                }
              >
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Full Name</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Email</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Subject</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Message</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Date</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>
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
                      <div className="max-w-[160px] truncate" title={message.full_name}>
                        {message.full_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[220px] truncate" title={message.email}>
                        {message.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[240px] truncate" title={message.subject}>
                        {message.subject}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openMessage(message)}
                        className={`block max-w-[300px] truncate text-left underline-offset-2 hover:underline ${
                          isDarkTheme ? "text-slate-300" : "text-slate-600"
                        }`}
                        title="Click to view full message"
                      >
                        {message.message}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(message.status, isDarkTheme)}`}
                      >
                        {message.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
                          {deletingId === message.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
               </table>
             </TableScroller>

             <div
              className={`divide-y lg:hidden ${isDarkTheme ? "divide-white/10" : "divide-slate-200"}`}
            >
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-3 p-4 ${
                    isDarkTheme ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className="min-w-0 flex-1 truncate text-left font-semibold hover:underline"
                      title="Click to view full message"
                    >
                      {message.subject}
                    </button>
                    <span
                      className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(message.status, isDarkTheme)}`}
                    >
                      {message.status}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {message.full_name}
                    </p>
                    <p
                      className={`truncate text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {message.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMessage(message)}
                    className={`line-clamp-2 text-left text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
                    title="Click to view full message"
                  >
                    {message.message}
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filteredMessages.length === 0 && (
          <div
            className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            No messages found.
          </div>
        )}
      </TableCard>

      <StickyTableScrollbar scrollerRef={tableScrollerRef} />

      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 sm:items-center">
          <div
            className={`max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-6 ${
              isDarkTheme
                ? "border-white/10 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold">
                  {viewingMessage.subject}
                </h2>
                <p
                  className={`mt-1 break-words text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
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
                onClick={closeMessageDetails}
                className={`rounded-xl p-1.5 transition ${
                  isDarkTheme
                    ? "text-slate-400 hover:bg-white/10"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className={`whitespace-pre-wrap break-words rounded-xl border p-4 text-sm ${
                isDarkTheme
                  ? "border-white/10 bg-slate-950 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {viewingMessage.message}
            </div>

            {repliesLoading ? (
              <div
                className={`rounded-xl border border-white/10 bg-slate-950/50 p-4 text-center text-sm ${
                  isDarkTheme ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Loading reply history...
              </div>
            ) : (
              <ReplyHistory
                replies={replies}
                onRetry={handleRetryReply}
                retryLoading={retryLoadingId}
              />
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void deleteMessage(viewingMessage.id)}
                disabled={deletingId === viewingMessage.id}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                  isDarkTheme
                    ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
              >
                {deletingId === viewingMessage.id ? "Deleting..." : "Delete"}
              </button>

              <button
                type="button"
                onClick={() => setReplyOpen(true)}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
                  isDarkTheme
                    ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                <Mail size={16} />
                Reply
              </button>

              <button
                type="button"
                onClick={closeMessageDetails}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
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

      {viewingMessage && (
        <ReplyModal
          contactMessageId={viewingMessage.id}
          recipientEmail={viewingMessage.email}
          originalSubject={viewingMessage.subject}
          open={replyOpen}
          onClose={() => setReplyOpen(false)}
          onReplySent={() => void handleReplySent()}
        />
      )}
    </div>
  );
}
