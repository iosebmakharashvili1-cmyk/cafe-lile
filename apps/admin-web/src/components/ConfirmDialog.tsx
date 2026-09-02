import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button in the cancelled-red tone. */
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation modal for destructive or hard-to-undo actions.
 * Escape and backdrop click both cancel.
 */
export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel = "დადასტურება",
  cancelLabel = "გაუქმება",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Escape closes the dialog while it is open.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(33, 28, 18, 0.4)",
              zIndex: 90,
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 91,
              width: "min(380px, calc(100vw - 32px))",
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              boxShadow: "0 12px 40px rgba(33, 28, 18, 0.25)",
            }}
          >
            <h2 style={{ fontSize: 17, marginBottom: 8 }}>{title}</h2>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--color-ink-soft)" }}>
              {body}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={onCancel}
                className="pressable"
                autoFocus
                style={{
                  border: "1.5px solid var(--color-line)",
                  background: "transparent",
                  color: "var(--color-ink)",
                  borderRadius: "var(--radius-sm)",
                  padding: "9px 16px",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="pressable"
                style={{
                  border: "none",
                  background: tone === "danger" ? "var(--color-cancelled)" : "var(--color-yellow)",
                  color: tone === "danger" ? "#fff" : "var(--color-ink)",
                  borderRadius: "var(--radius-sm)",
                  padding: "9px 16px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
