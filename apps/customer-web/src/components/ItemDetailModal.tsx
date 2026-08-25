import { AnimatePresence, motion } from "motion/react";
import type { MenuItem } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";

interface ItemDetailModalProps {
  item: MenuItem | null;
  currencyCode: string;
  quantity: number;
  onClose: () => void;
  onAdd: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
}

export function ItemDetailModal({ item, currencyCode, quantity, onClose, onAdd, onDecrement }: ItemDetailModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(33,28,18,0.4)", zIndex: 50 }}
          />
          <motion.div
            role="dialog"
            aria-label={item.name}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "88vh",
              overflowY: "auto",
              background: "var(--color-surface)",
              borderRadius: "24px 24px 0 0",
              zIndex: 51,
              boxShadow: "0 -8px 32px rgba(33,28,18,0.18)",
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: 80 }} />
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.9)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              ✕
            </button>

            <div style={{ padding: "20px 24px 28px" }}>
              <h2 style={{ fontSize: 22, fontFamily: "var(--font-display)", marginBottom: 6 }}>{item.name}</h2>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-yellow-deep)", marginBottom: 12 }}>
                {formatPrice(item.priceMinor, currencyCode)}
              </div>

              {item.description && (
                <p style={{ fontSize: 14, color: "var(--color-ink-soft)", lineHeight: 1.5, marginBottom: 16 }}>
                  {item.description}
                </p>
              )}

              {item.ingredients.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--color-ink-soft)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 8,
                    }}
                  >
                    Ingredients
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.ingredients.map((ing) => (
                      <span
                        key={ing}
                        style={{
                          fontSize: 12.5,
                          background: "var(--color-yellow-tint)",
                          color: "var(--color-ink)",
                          padding: "5px 11px",
                          borderRadius: "999px",
                        }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {quantity === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAdd(item.id)}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "var(--color-yellow)",
                    color: "var(--color-ink)",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  Add to cart
                </motion.button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    background: "var(--color-yellow-tint)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px",
                  }}
                >
                  <button
                    onClick={() => onDecrement(item.id)}
                    aria-label="Remove one"
                    style={quantityButtonStyle}
                  >
                    −
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 17, minWidth: 20, textAlign: "center" }}>{quantity}</span>
                  <button onClick={() => onAdd(item.id)} aria-label="Add one more" style={quantityButtonStyle}>
                    +
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const quantityButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "var(--color-surface)",
  fontWeight: 700,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
