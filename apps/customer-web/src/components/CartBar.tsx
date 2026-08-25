import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { animate } from "animejs";
import { formatPrice } from "../lib/format";

interface CartBarProps {
  itemCount: number;
  subtotalMinor: number;
  currencyCode: string;
  onOpenCart: () => void;
}

export function CartBar({ itemCount, subtotalMinor, currencyCode, onOpenCart }: CartBarProps) {
  const barRef = useRef<HTMLButtonElement>(null);
  const prevCount = useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevCount.current && barRef.current) {
      animate(barRef.current, {
        scale: [1, 1.035, 1],
        duration: 320,
        ease: "outQuad",
      });
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 35,
          }}
        >
          <button
            ref={barRef}
            onClick={onOpenCart}
            style={{
              width: "100%",
              border: "none",
              background: "var(--color-yellow)",
              color: "var(--color-ink)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(33,28,18,0.25)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: "rgba(33,28,18,0.15)",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                {itemCount}
              </span>
              View cart
            </span>
            <span>{formatPrice(subtotalMinor, currencyCode)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
