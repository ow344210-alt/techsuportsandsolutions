import type { ContactMessageReply } from "../../lib/contactMessageReplies";
import Button from "../ui/Button";
import {
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Pencil,
  FilePlus2,
} from "lucide-react";

interface ReplyHistoryProps {
  replies: ContactMessageReply[];
  onRetry?: (replyId: string) => void;
  onEdit?: (reply: ContactMessageReply) => void;
  onEditAsNew?: (reply: ContactMessageReply) => void;
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
  onEdit,
  onEditAsNew,
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
        const canEdit =
          (reply.delivery_status === "pending" ||
            reply.delivery_status === "failed") &&
          typeof onEdit === "function";
        const canRetry =
          reply.delivery_status === "failed" &&
          typeof onRetry === "function";
        const canEditAsNew =
          reply.delivery_status === "sent" &&
          typeof onEditAsNew === "function";

        return (
          <div
            key={reply.id}
            className="w-full min-w-0 rounded-xl border border-white/10 bg-slate-950 p-4 sm:p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <StatusIcon status={reply.delivery_status} />
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-white">
                  {reply.subject}
                </span>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
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
            </div>

            <div className="mt-1 text-xs text-slate-400">
              <span>From: {reply.admin_email || "Admin"}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {reply.sent_at ? (
                <span>Sent: {new Date(reply.sent_at).toLocaleString()}</span>
              ) : (
                <span>Created: {new Date(reply.created_at).toLocaleString()}</span>
              )}
            </div>

            {reply.error_message && (
              <p className="mt-1 break-words text-xs text-rose-400">
                {reply.error_message}
              </p>
            )}

            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-300">
              {reply.message}
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(reply)}
                  className="w-full sm:w-auto"
                >
                  <Pencil size={14} />
                  Edit
                </Button>
              )}

              {canRetry && (
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

              {canEditAsNew && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAsNew(reply)}
                  className="w-full sm:w-auto"
                >
                  <FilePlus2 size={14} />
                  Edit as New Reply
                </Button>
              )}

              {reply.delivery_status === "processing" && (
                <span className="text-xs text-yellow-400">
                  This reply is currently being sent and cannot be edited.
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
