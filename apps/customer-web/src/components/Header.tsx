import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  restaurantName: string;
  acceptingOrders: boolean;
  itemCount: number;
  onCartClick: () => void;
}

export function Header({ restaurantName, acceptingOrders, itemCount, onCartClick }: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-line)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22 }}>{restaurantName}</h1>
        {!acceptingOrders && (
          <div style={{ fontSize: 12.5, color: "var(--color-cancelled)", marginTop: 2, fontWeight: 600 }}>
            Not accepting orders right now
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={onCartClick}
        aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        style={{
          position: "relative",
          border: "none",
          background: "var(--color-yellow-tint)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 16px",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          color: "var(--color-ink)",
        }}
      >
        Cart
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "var(--color-yellow)",
                color: "var(--color-ink)",
                borderRadius: "999px",
                minWidth: 20,
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </header>
  );
}
