import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const focusable = cancelRef.current || confirmRef.current;
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!loading) {
          setIsClosing(true);
          setTimeout(() => {
            onCancel();
            setIsClosing(false);
          }, 0);
        }
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = dialogContainer?.current?.querySelectorAll<HTMLElement>(
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open, loading, onCancel]);

  const handleConfirm = async () => {
    await onConfirm();
  };

  const dialogContainer = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            setIsClosing(true);
            setTimeout(() => {
              onCancel();
              setIsClosing(false);
            }, 0);
          }
        }}
      />

      <div
        ref={dialogContainer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl transition-transform duration-200 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div className="mb-5">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm text-gray-400">{description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            ref={cancelRef}
            variant="secondary"
            size="md"
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                onCancel();
                setIsClosing(false);
              }, 0);
            }}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={danger ? "danger" : "primary"}
            size="md"
            onClick={handleConfirm}
            loading={loading}
            loadingText={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
