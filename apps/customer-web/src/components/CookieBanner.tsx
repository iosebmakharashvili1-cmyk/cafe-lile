import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const STORAGE_KEY = "cl_cookie_consent";

/** Simple cookie notice. One "Accept" click stores consent and never shows again. */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "accepted";
    } catch {
      // Storage unavailable — show the banner but don't loop forever after accept.
    }
    if (!dismissed) {
      // Small delay so it doesn't compete with the page entrance animation.
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Ignore — banner just reappears next visit.
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-print-hide
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          role="region"
          aria-label="Cookie notice"
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 45,
            maxWidth: 520,
            margin: "0 auto",
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "var(--shadow-drawer)",
          }}
        >
          <span style={{ fontSize: 13.5, color: "var(--color-ink-soft)", lineHeight: 1.45, flex: 1 }}>
            We use cookies to remember your cart and preferences.
          </span>
          <button
            onClick={accept}
            className="pressable"
            style={{
              flexShrink: 0,
              border: "none",
              background: "var(--color-yellow)",
              color: "var(--color-ink)",
              borderRadius: "var(--radius-sm)",
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
