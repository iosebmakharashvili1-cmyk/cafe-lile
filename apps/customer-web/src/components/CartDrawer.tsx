import { AnimatePresence, motion } from "motion/react";
import type { MenuItem } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";
import { cartLineKey, type CartLine } from "../hooks/useCart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enrichedLines: (CartLine & { item: MenuItem })[];
  subtotalMinor: number;
  currencyCode: string;
  onAdd: (id: string, excludedIngredients?: string[]) => void;
  onDecrement: (id: string, excludedIngredients?: string[]) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  enrichedLines,
  subtotalMinor,
  currencyCode,
  onAdd,
  onDecrement,
  onCheckout,
}: CartDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(33, 28, 18, 0.35)",
              zIndex: 40,
            }}
          />
          <motion.div
            role="dialog"
            aria-label="Your order"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(420px, 100vw)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-drawer)",
              zIndex: 41,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Signature fill line: grows with subtotal as a subtle progress cue */}
            <div style={{ height: 3, background: "var(--color-line)" }}>
              <motion.div
                initial={false}
                animate={{ width: `${Math.min(100, (subtotalMinor / 5000) * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: "var(--color-yellow)" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-line)",
              }}
            >
              <h2 style={{ fontSize: 20 }}>Your order</h2>
              <button
                onClick={onClose}
                aria-label="Close cart"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--color-ink-soft)",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px" }}>
              {enrichedLines.length === 0 ? (
                <p style={{ color: "var(--color-ink-soft)", marginTop: 40, textAlign: "center" }}>
                  Your cart is empty. Add something from the menu to get started.
                </p>
              ) : (
                enrichedLines.map(({ item, menuItemId, quantity, excludedIngredients }) => (
                  <div
                    key={cartLineKey(menuItemId, excludedIngredients)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 0",
                      borderBottom: "1px solid var(--color-line)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{item.name}</div>
                      {excludedIngredients.length > 0 && (
                        <div style={{ fontSize: 12, color: "var(--color-cancelled)", marginTop: 2 }}>
                          without {excludedIngredients.map((i) => i.toLowerCase()).join(", ")}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 2 }}>
                        {formatPrice(item.priceMinor, currencyCode)} each
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--color-yellow-tint)",
                        borderRadius: "var(--radius-sm)",
                        padding: "3px 6px",
                      }}
                    >
                      <button
                        onClick={() => onDecrement(menuItemId, excludedIngredients)}
                        aria-label={`Remove one ${item.name}`}
                        style={miniStepperStyle}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 600, minWidth: 14, textAlign: "center", fontSize: 13.5 }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => onAdd(menuItemId, excludedIngredients)}
                        aria-label={`Add one more ${item.name}`}
                        style={miniStepperStyle}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, minWidth: 56, textAlign: "right" }}>
                      {formatPrice(item.priceMinor * quantity, currencyCode)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
                <span style={{ color: "var(--color-ink-soft)" }}>Estimated total</span>
                <span style={{ fontWeight: 700 }}>{formatPrice(subtotalMinor, currencyCode)}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={enrichedLines.length === 0}
                onClick={onCheckout}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: enrichedLines.length === 0 ? "var(--color-line)" : "var(--color-yellow)",
                  color: "var(--color-ink)",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: enrichedLines.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Checkout
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const miniStepperStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 5,
  border: "none",
  background: "var(--color-surface)",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
};
