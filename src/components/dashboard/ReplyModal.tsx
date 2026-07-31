import { useState, useEffect, useRef, useCallback } from "react";
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
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        subjectRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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

        toast.success(
          `Reply sent successfully to ${recipientEmail}.`,
        );

        setSubject("");
        setMessage("");
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
<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 sm:items-center">
  <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Reply by Email</h2>
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

<div className="rounded-xl border border-white/10 bg-slate-950 sm:px-3 sm:py-2 px-4 py-3">
  <p className="text-xs font-semibold uppercase text-slate-400">To</p>
  <p className="mt-1 break-words text-sm text-white">{recipientEmail}</p>
</div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            ref={subjectRef as React.Ref<HTMLInputElement>}
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
  ref={messageRef}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder="Type your reply message..."
  rows={5}
  required
  disabled={loading}
  className="w-full min-h-[80px] sm:min-h-[100px] resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500/40 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-60"
/>
          </div>

{error && (
  <div
    className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 sm:px-3 sm:py-2 px-4 py-3 text-sm text-rose-300"
    role="alert"
  >
    <AlertCircle size={14} className="mt-0.5 shrink-0" />
    <span>{error}</span>
  </div>
)}

<div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
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
  >
    {loading ? "Sending..." : "Send Reply"}
  </Button>
</div>
        </form>
      </div>
    </div>
  );
}