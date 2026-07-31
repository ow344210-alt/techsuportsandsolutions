import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Wallet,
  MessageSquare,
  ShieldCheck,
  Flag,
  UserPlus,
  CheckCircle2,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import FormField from "../../components/forms/FormField";
import FormSelect from "../../components/forms/FormSelect";
import FormTextarea from "../../components/forms/FormTextarea";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type {
  ContactMessage,
  ContactMessageStatus,
  ContactMessagePriority,
  ContactMessageActivity,
} from "../../types";
import {
  updateContactMessageStatus,
  updateContactMessagePriority,
  assignContactMessage,
  updateContactMessageNotes,
  markContactMessageReplied,
  deleteContactMessage,
  getContactMessageActivity,
} from "../../lib/contactMessages";

interface ContactMessageDrawerProps {
  open: boolean;
  message: ContactMessage | null;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "replied", label: "Replied" },
  { value: "resolved", label: "Resolved" },
  { value: "spam", label: "Spam" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

export default function ContactMessageDrawer({
  open,
  message,
  onClose,
  onDeleted,
  onUpdated,
}: ContactMessageDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [status, setStatus] = useState<ContactMessageStatus>(() => message?.status ?? "new");
  const [priority, setPriority] = useState<ContactMessagePriority>(() => message?.priority ?? "normal");
  const [assignedTo, setAssignedTo] = useState(() => message?.assigned_to ?? "");
  const [adminNotes, setAdminNotes] = useState(() => message?.admin_notes ?? "");
  const [activities, setActivities] = useState<ContactMessageActivity[]>([]);
  const [notesDraft, setNotesDraft] = useState(() => message?.admin_notes ?? "");

  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open || !message) return;
    const msgId = message.id;

    let mounted = true;
    async function loadActivity() {
      setActivityLoading(true);
      const result = await getContactMessageActivity(msgId);
      if (mounted && result.success && result.data) {
        setActivities(result.data);
      }
      if (mounted) setActivityLoading(false);
    }
    loadActivity();
    return () => { mounted = false; };
  }, [open, message]);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!statusLoading && !priorityLoading && !assignLoading && !notesLoading && !replyLoading && !deleteLoading) {
          setIsClosing(true);
          setTimeout(() => {
            onClose();
            setIsClosing(false);
          }, 200);
        }
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open, statusLoading, priorityLoading, assignLoading, notesLoading, replyLoading, deleteLoading, onClose]);

  const handleClose = useCallback(() => {
    if (statusLoading || priorityLoading || assignLoading || notesLoading || replyLoading || deleteLoading) {
      return;
    }
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [statusLoading, priorityLoading, assignLoading, notesLoading, replyLoading, deleteLoading, onClose]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ContactMessageStatus;
    if (!message || newStatus === status) return;

    setStatusLoading(true);
    try {
      const result = await updateContactMessageStatus(message.id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        toast.success("Status updated");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as ContactMessagePriority;
    if (!message || newPriority === priority) return;

    setPriorityLoading(true);
    try {
      const result = await updateContactMessagePriority(message.id, newPriority);
      if (result.success) {
        setPriority(newPriority);
        toast.success("Priority updated");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to update priority");
      }
    } catch {
      toast.error("Failed to update priority");
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!message || !assignedTo.trim()) return;

    setAssignLoading(true);
    try {
      const result = await assignContactMessage(message.id, assignedTo.trim());
      if (result.success) {
        toast.success("Message assigned");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to assign message");
      }
    } catch {
      toast.error("Failed to assign message");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!message || notesDraft === adminNotes) return;

    setNotesLoading(true);
    try {
      const result = await updateContactMessageNotes(message.id, notesDraft);
      if (result.success) {
        setAdminNotes(notesDraft);
        toast.success("Notes saved");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to save notes");
      }
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleMarkReplied = async () => {
    if (!message) return;

    setReplyLoading(true);
    try {
      const result = await markContactMessageReplied(message.id);
      if (result.success) {
        setStatus("replied");
        toast.success("Marked as replied");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to mark as replied");
      }
    } catch {
      toast.error("Failed to mark as replied");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text) {
      toast.error(`${label} is not available`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleOpenMailClient = () => {
    if (!message?.email) {
      toast.error("Email address is not available");
      return;
    }
    window.open(`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`, "_blank");
  };

  const handleDelete = async () => {
    if (!message) return;

    setDeleteLoading(true);
    try {
      const result = await deleteContactMessage(message.id);
      if (result.success) {
        toast.success("Message deleted");
        setShowDeleteConfirm(false);
        onDeleted?.();
        handleClose();
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!open || !message) return null;

  const isAnyActionLoading =
    statusLoading ||
    priorityLoading ||
    assignLoading ||
    notesLoading ||
    replyLoading ||
    deleteLoading;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#111827] shadow-2xl transition-transform duration-200 ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="drawer-title" className="text-lg font-semibold text-white">
            Contact Message
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isAnyActionLoading}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Sender Information</h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Name" value={message.full_name} icon={<UserPlus size={14} />} />
              <InfoRow label="Email" value={message.email} icon={<Mail size={14} />} />
              {message.phone && <InfoRow label="Phone" value={message.phone} icon={<Phone size={14} />} />}
              {message.company && <InfoRow label="Company" value={message.company} icon={<Building2 size={14} />} />}
              {message.service && <InfoRow label="Service" value={message.service} icon={<Briefcase size={14} />} />}
              {message.budget && <InfoRow label="Budget" value={message.budget} icon={<Wallet size={14} />} />}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Message</h3>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare size={14} />
                {message.subject}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{message.message}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Details</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <ShieldCheck size={14} />
                  Status
                </span>
                <div className="flex items-center gap-2">
                  {statusLoading && <Loader2 size={14} className="animate-spin text-violet-400" />}
                  <FormSelect
                    name="status"
                    value={status}
                    onChange={handleStatusChange}
                    options={STATUS_OPTIONS}
                    className="h-9 w-40 rounded-lg border-white/10 bg-slate-900 text-sm text-white"
                    disabled={statusLoading}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <Flag size={14} />
                  Priority
                </span>
                <div className="flex items-center gap-2">
                  {priorityLoading && <Loader2 size={14} className="animate-spin text-violet-400" />}
                  <FormSelect
                    name="priority"
                    value={priority}
                    onChange={handlePriorityChange}
                    options={PRIORITY_OPTIONS}
                    className="h-9 w-40 rounded-lg border-white/10 bg-slate-900 text-sm text-white"
                    disabled={priorityLoading}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <UserPlus size={14} />
                  Assigned To
                </span>
                <div className="flex items-center gap-2">
                  {assignLoading && <Loader2 size={14} className="animate-spin text-violet-400" />}
                  <FormField
                    name="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Admin ID"
                    className="h-9 w-40 rounded-lg border-white/10 bg-slate-900 text-sm text-white"
                    disabled={assignLoading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAssign}
                    disabled={assignLoading || !assignedTo.trim()}
                    loading={assignLoading}
                    loadingText="Assigning"
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Internal Notes</h3>
            <div className="space-y-2">
              <FormTextarea
                name="adminNotes"
                value={notesDraft}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesDraft(e.target.value)}
                placeholder="Add internal notes..."
                rows={4}
                className="rounded-xl border border-white/10 bg-slate-950 text-sm text-white"
                disabled={notesLoading}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={notesLoading || notesDraft === adminNotes}
                  loading={notesLoading}
                  loadingText="Saving"
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Timestamps</h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Received" value={formatDate(message.created_at)} icon={<Clock size={14} />} />
              <InfoRow label="Updated" value={formatDate(message.updated_at)} icon={<ArrowUpRight size={14} />} />
              {message.replied_at && <InfoRow label="Replied" value={formatDate(message.replied_at)} icon={<CheckCircle2 size={14} />} />}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Activity Timeline</h3>
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-violet-400" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{activity.action}</span>
                      <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                    </div>
                    {activity.note && (
                      <p className="mt-1 text-sm text-slate-300">{activity.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleCopy(message.email, "Email")}
            icon={<Copy size={14} />}
            iconPosition="left"
          >
            Copy Email
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleCopy(message.phone ?? "", "Phone")}
            icon={<Copy size={14} />}
            iconPosition="left"
          >
            Copy Phone
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleOpenMailClient}
            icon={<ExternalLink size={14} />}
            iconPosition="left"
          >
            Open Mail
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleMarkReplied}
            disabled={replyLoading || status === "replied"}
            loading={replyLoading}
            loadingText="Marking"
            icon={<CheckCircle2 size={14} />}
            iconPosition="left"
          >
            Mark Replied
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
            icon={<Trash2 size={14} />}
            iconPosition="left"
          >
            Delete
          </Button>
        </div>

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete message"
          description="This action cannot be undone. Are you sure you want to delete this contact message?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>,
    document.body
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
        {icon}
        {label}
      </span>
      <span className="max-w-[60%] truncate text-sm text-white" title={value}>
        {value}
      </span>
    </div>
  );
}
