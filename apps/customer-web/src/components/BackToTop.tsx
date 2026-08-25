import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Floating "^ top" button that appears after scrolling down a page-ish distance. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          data-print-hide
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="pressable"
          style={{
            position: "fixed",
            right: 16,
            bottom: 76,
            zIndex: 34,
            border: "none",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            borderRadius: "999px",
            padding: "10px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span aria-hidden="true">↑</span> top
        </motion.button>
      )}
    </AnimatePresence>
  );
}
