import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, MouseEvent, Ref } from "react";
import { createPortal } from "react-dom";
import { Send, X, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  createContactMessageReply,
  sendReplyEmail,
  updateContactMessageReply,
} from "../../lib/contactMessageReplyService";
import type { ContactMessageReply, ReplyFormData } from "../../lib/contactMessageReplies";
import FormField from "../forms/FormField";
import Button from "../ui/Button";

export type ReplyModalMode = "create" | "edit" | "copy";

interface ReplyModalProps {
  mode: ReplyModalMode;
  open: boolean;
  onClose: () => void;
  /** Fired after a reply is actually sent (parent should refresh + mark Replied). */
  onReplySent: () => void;
  /** Fired after an edit is saved without sending (parent should refresh only). */
  onReplySaved?: () => void;
  // Required for "create" and "copy" (the record does not exist yet).
  contactMessageId?: string;
  recipientEmail?: string;
  originalSubject?: string;
  // Required for "edit" and "copy" (the source reply).
  reply?: ContactMessageReply | null;
}

const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 5000;

const MODE_TITLES: Record<ReplyModalMode, string> = {
  create: "Reply by Email",
  edit: "Edit Reply",
  copy: "Edit as New Reply",
};

function statusLabel(status: string): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "processing":
      return "Processing";
    case "pending":
    default:
      return "Pending";
  }
}

export default function ReplyModal({
  mode,
  open,
  onClose,
  onReplySent,
  onReplySaved,
  contactMessageId,
  recipientEmail,
  originalSubject,
  reply,
}: ReplyModalProps) {
  // The parent remounts this component (via `key`) for every open session, so
  // these initializers are the source of truth for the form content and a
  // reply-history refresh can never clobber in-progress typing.
  const [subject, setSubject] = useState(() =>
    mode === "create" ? `Re: ${originalSubject ?? ""}` : (reply?.subject ?? ""),
  );
  const [message, setMessage] = useState(() =>
    mode === "create" ? "" : (reply?.message ?? ""),
  );
  const [action, setAction] = useState<"save" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isProcessing =
    mode === "edit" && reply?.delivery_status === "processing";
  const isBusy = action !== null;
  const isLocked = isBusy || isProcessing;

  // Focus the subject field shortly after the dialog opens.
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      subjectRef.current?.focus();
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  // Lock body scroll while open, handle Escape + focus trap, and restore focus
  // to the element that opened the dialog when it unmounts.
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (action === null) {
          onClose();
        }
        return;
      }

      if (event.key === "Tab") {
        const panel = panelRef.current;

        if (!panel) {
          return;
        }

        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusables.length === 0) {
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, action, onClose]);

  const handleBackdropMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && action === null) {
        onClose();
      }
    },
    [action, onClose],
  );

  const validate = useCallback((): ReplyFormData | null => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setError("Please enter a subject.");
      return null;
    }

    if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
      setError(`Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.`);
      return null;
    }

    if (!trimmedMessage) {
      setError("Please enter a reply message.");
      return null;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      return null;
    }

    return { subject: trimmedSubject, message: trimmedMessage };
  }, [subject, message]);

  // Create a new reply record and send it (create + copy modes).
  const handleSendReply = useCallback(
    async () => {
      if (action !== null) {
        return;
      }

      const formData = validate();

      if (!formData) {
        return;
      }

      if (!contactMessageId) {
        setError("No contact message selected.");
        return;
      }

      if (!recipientEmail) {
        setError("Recipient email is missing.");
        return;
      }

      setAction("send");
      setError(null);

      try {
        const createResult = await createContactMessageReply(
          contactMessageId,
          recipientEmail,
          formData,
        );

        if (!createResult.success || !createResult.replyId) {
          setError(createResult.error || "Failed to create reply record.");
          return;
        }

        const sendResult = await sendReplyEmail(createResult.replyId);

        if (!sendResult.success) {
          setError(
            sendResult.error || "Reply record created but email sending failed.",
          );
          return;
        }

        toast.success(`Reply sent successfully to ${recipientEmail}.`);
        onReplySent();
        onClose();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setAction(null);
      }
    },
    [action, contactMessageId, recipientEmail, validate, onClose, onReplySent],
  );

  // Edit an existing reply without sending it.
  const handleSaveChanges = useCallback(
    async () => {
      if (action !== null) {
        if (!reply) {
          setError("Reply record is missing.");
        }
        return;
      }

      if (!reply) {
        setError("Reply record is missing.");
        return;
      }

      const formData = validate();

      if (!formData) {
        return;
      }

      setAction("save");
      setError(null);

      try {
        const updateResult = await updateContactMessageReply(reply.id, formData);

        if (!updateResult.success || updateResult.replyId !== reply.id) {
          setError(updateResult.error || "Failed to update the reply.");
          return;
        }

        toast.success("Reply updated.");
        onReplySaved?.();
        onClose();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setAction(null);
      }
    },
    [action, reply, validate, onClose, onReplySaved],
  );

  // Edit an existing reply, then send it (single action, invoked once).
  const handleSaveAndSend = useCallback(
    async () => {
      if (action !== null) {
        if (!reply) {
          setError("Reply record is missing.");
        }
        return;
      }

      if (!reply) {
        setError("Reply record is missing.");
        return;
      }

      const formData = validate();

      if (!formData) {
        return;
      }

      setAction("send");
      setError(null);

      try {
        // Update first. The RPC only allows pending/failed replies, resets a
        // failed reply to pending, and clears the error/provider fields. The
        // returned id confirms we edited the exact same record we send.
        const updateResult = await updateContactMessageReply(reply.id, formData);

        if (!updateResult.success || updateResult.replyId !== reply.id) {
          setError(updateResult.error || "Failed to update the reply.");
          return;
        }

        const sendResult = await sendReplyEmail(reply.id);

        if (!sendResult.success) {
          setError(sendResult.error || "Reply updated but email sending failed.");
          return;
        }

        toast.success(
          `Reply sent successfully to ${reply.recipient_email ?? "the recipient"}.`,
        );
        onReplySent();
        onClose();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setAction(null);
      }
    },
    [action, reply, validate, onClose, onReplySent],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (action !== null) {
      return;
    }

    if (mode === "edit") {
      void handleSaveAndSend();
    } else {
      void handleSendReply();
    }
  };

  if (!open) {
    return null;
  }

  const toEmail = reply?.recipient_email ?? recipientEmail ?? "";
  const title = MODE_TITLES[mode];
  const submitLabel = mode === "edit" ? "Save & Send" : "Send Reply";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-modal-title"
        className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#111827] shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <h2 id="reply-modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-1.5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close reply dialog"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)] sm:px-6 sm:py-6">
          {isProcessing && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300"
            >
              <Clock size={14} className="mt-0.5 shrink-0" />
              <span>This reply is currently being sent and cannot be edited.</span>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">To</p>
            <p className="mt-1 break-words text-sm text-white">{toEmail}</p>
          </div>

          {mode === "edit" && reply && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                  reply.delivery_status === "failed"
                    ? "bg-rose-500/15 text-rose-300"
                    : "bg-slate-500/15 text-slate-300"
                }`}
              >
                {statusLabel(reply.delivery_status)}
              </span>
              {reply.error_message && (
                <span className="break-words text-xs text-rose-400">
                  {reply.error_message}
                </span>
              )}
            </div>
          )}

          <form id="reply-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField
              ref={subjectRef as Ref<HTMLInputElement>}
              label="Subject"
              name="reply-subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: Original subject"
              maxLength={MAX_SUBJECT_LENGTH}
              disabled={isLocked}
              aria-invalid={Boolean(error)}
              className="bg-slate-950"
            />

            <div>
              <label
                htmlFor="reply-message"
                className="mb-2 block text-sm font-semibold uppercase text-slate-200"
              >
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="reply-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply message..."
                rows={6}
                required
                disabled={isLocked}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-invalid={Boolean(error)}
                className="w-full min-h-[80px] resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500/40 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[100px]"
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
                role="alert"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-4 py-4 pb-[env(safe-area-inset-bottom)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isBusy}
            fullWidth
            className="sm:w-auto"
          >
            Cancel
          </Button>

          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void handleSaveChanges()}
              disabled={isLocked}
              loading={action === "save"}
              loadingText="Saving..."
              fullWidth
              className="sm:w-auto"
            >
              Save Changes
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLocked}
            loading={action === "send"}
            loadingText="Sending..."
            icon={action === null ? <Send size={18} /> : undefined}
            iconPosition="right"
            fullWidth
            className="sm:w-auto"
            form="reply-form"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
