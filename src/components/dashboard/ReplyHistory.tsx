import type { ContactMessageReply } from "../../lib/contactMessageReplies";
import Button from "../ui/Button";
import { RefreshCcw, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

interface ReplyHistoryProps {
  replies: ContactMessageReply[];
  onRetry?: (replyId: string) => void;
  retryLoading?: string | null;
}

function formatStatus(status: string): { label: string; color: string } {
  switch (status) {
    case "sent":
      return { label: "Sent", color: "text-emerald-400" };
    case "failed":
      return { label: "Failed", color: "text-rose-400" };
    case "processing":
      return { label: "Processing", color: "text-yellow-400" };
    case "pending":
    default:
      return { label: "Pending", color: "text-slate-400" };
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    case "failed":
      return <XCircle size={14} className="text-rose-400" />;
    case "processing":
      return <Loader2 size={14} className="animate-spin text-yellow-400" />;
    case "pending":
    default:
      return <Clock size={14} className="text-slate-400" />;
  }
}

export default function ReplyHistory({
  replies,
  onRetry,
  retryLoading,
}: ReplyHistoryProps) {
  if (replies.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-center">
        <p className="text-sm text-slate-400">No replies yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase text-slate-400">
        Reply History
      </h3>

      {replies.map((reply) => {
        const status = formatStatus(reply.delivery_status);
        const isRetrying = retryLoading === reply.id;

        return (
<div
  key={reply.id}
  className="rounded-xl border border-white/10 bg-slate-950 sm:p-3 p-4"
>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusIcon status={reply.delivery_status} />
                  <span className="text-sm font-medium text-white">
                    {reply.subject}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {reply.admin_email && (
                    <span>From: {reply.admin_email}</span>
                  )}
                  {reply.admin_email && reply.sent_at && <span> • </span>}
                  {reply.sent_at && (
                    <span>
                      Sent:{" "}
                      {new Date(reply.sent_at).toLocaleString()}
                    </span>
                  )}
                  {!reply.sent_at && (
                    <span>
                      Created:{" "}
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  )}
                </p>

                {reply.error_message && (
                  <p className="mt-1 text-xs text-rose-400">
                    {reply.error_message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:w-full sm:justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                    reply.delivery_status === "sent"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : reply.delivery_status === "failed"
                        ? "bg-rose-500/15 text-rose-300"
                        : reply.delivery_status === "processing"
                          ? "bg-yellow-500/15 text-yellow-300"
                          : "bg-slate-500/15 text-slate-300"
                  }`}
                >
                  {status.label}
                </span>

{reply.delivery_status === "failed" && onRetry && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onRetry(reply.id)}
    loading={isRetrying}
    loadingText="Retrying..."
    disabled={isRetrying}
    className="w-full sm:w-auto"
  >
    <RefreshCcw size={14} />
    Retry
  </Button>
)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}