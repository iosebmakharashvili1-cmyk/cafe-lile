import { useEffect, useState } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
}

/** Small copy-to-clipboard button with a transient success state. */
export function CopyButton({ value, label = "კოპირება", copiedLabel = "დაკოპირდა ✓" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Reset back so the button can be used again after a moment.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked (e.g. insecure context) — silently keep the label.
    }
  }

  return (
    <button
      data-print-hide
      onClick={handleCopy}
      aria-live="polite"
      className="pressable"
      style={{
        marginTop: 12,
        border: "none",
        background: copied ? "var(--color-ready)" : "rgba(33, 28, 18, 0.08)",
        color: copied ? "#fff" : "var(--color-ink)",
        borderRadius: "999px",
        padding: "7px 14px",
        fontWeight: 600,
        fontSize: 12.5,
        cursor: "pointer",
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      {copied ? copiedLabel : `${label}`}
    </button>
  );
}
