import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, MouseEvent, Ref } from "react";
import { Send, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createContactMessageReply, sendReplyEmail } from "../../lib/contactMessageReplyService";
import FormField from "../forms/FormField";
import Button from "../ui/Button";

interface ReplyModalProps {
  contactMessageId: string;
  recipientEmail: string;
  originalSubject: string;
  open: boolean;
  onClose: () => void;
  onReplySent: () => void;
}

export default function ReplyModal({
  contactMessageId,
  recipientEmail,
  originalSubject,
  open,
  onClose,
  onReplySent,
}: ReplyModalProps) {
  const [subject, setSubject] = useState(() => `Re: ${originalSubject}`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

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

  // Lock body scroll while open, close on Escape, and restore focus to the
  // element that opened the dialog when it unmounts.
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
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const handleBackdropMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !loading) {
        onClose();
      }
    },
    [loading, onClose],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!contactMessageId) {
        setError("No contact message selected.");
        return;
      }

      if (!recipientEmail) {
        setError("Recipient email is missing.");
        return;
      }

      const trimmedSubject = subject.trim();
      const trimmedMessage = message.trim();

      if (!trimmedSubject) {
        setError("Please enter a subject.");
        return;
      }

      if (!trimmedMessage) {
        setError("Please enter a reply message.");
        return;
      }

      if (loading) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const createResult = await createContactMessageReply(
          contactMessageId,
          recipientEmail,
          {
            subject: trimmedSubject,
            message: trimmedMessage,
          },
        );

        if (!createResult.success) {
          setError(createResult.error || "Failed to create reply record.");
          setLoading(false);
          return;
        }

        const replyId = createResult.replyId;

        if (!replyId) {
          setError("Reply record created but no ID returned.");
          setLoading(false);
          return;
        }

        const sendResult = await sendReplyEmail(replyId);

        if (!sendResult.success) {
          setError(
            sendResult.error || "Reply record created but email sending failed.",
          );
          setLoading(false);
          return;
        }

        setSubject("");
        setMessage("");
        toast.success(`Reply sent successfully to ${recipientEmail}.`);
        onReplySent();
        onClose();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [contactMessageId, recipientEmail, subject, message, loading, onClose, onReplySent],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-modal-title"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#111827] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <h2 id="reply-modal-title" className="text-lg font-semibold text-white">
            Reply by Email
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close reply dialog"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">To</p>
            <p className="mt-1 break-words text-sm text-white">{recipientEmail}</p>
          </div>

          <form id="reply-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField
              ref={subjectRef as Ref<HTMLInputElement>}
              label="Subject"
              name="reply-subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: Original subject"
              disabled={loading}
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
                rows={5}
                required
                disabled={loading}
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

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            fullWidth
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            loading={loading}
            loadingText="Sending..."
            icon={loading ? undefined : <Send size={18} />}
            iconPosition="right"
            fullWidth
            className="sm:w-auto"
            form="reply-form"
          >
            {loading ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
