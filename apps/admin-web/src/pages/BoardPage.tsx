import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { OrderStatus } from "@cafe-lile/contracts";
import { useOrderPolling } from "../hooks/useOrderPolling";
import { useKitchenSound } from "../hooks/useKitchenSound";
import { useTabTitleAlert } from "../hooks/useTabTitleAlert";
import { updateOrderStatus } from "../lib/api";
import { OrderCard } from "../components/OrderCard";
import { BoardSkeleton } from "../components/BoardSkeleton";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "accepted", label: "Accepted" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
];

interface BoardPageProps {
  onSessionExpired: () => void;
}

export function BoardPage({ onSessionExpired }: BoardPageProps) {
  const { orders, isLoading, connectionLost, sessionExpired, newOrderIds, acknowledgeNewOrder, refreshNow } =
    useOrderPolling();
  const { soundState, enableSound, playChime } = useKitchenSound();

  useTabTitleAlert(newOrderIds.length);

  useEffect(() => {
    if (sessionExpired) onSessionExpired();
  }, [sessionExpired, onSessionExpired]);

  useEffect(() => {
    if (newOrderIds.length > 0 && soundState === "armed") {
      playChime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrderIds.length]);

  async function handleAdvance(orderId: string, nextStatus: OrderStatus) {
    try {
      await updateOrderStatus(orderId, nextStatus);
      refreshNow();
    } catch {
      refreshNow(); // reconcile with server state even on failure (e.g. 409 conflict)
    }
  }

  if (isLoading) return <BoardSkeleton />;

  return (
    <div style={{ padding: "20px 24px" }}>
      {soundState !== "armed" && soundState !== "disabled" && (
        <div
          style={{
            background: soundState === "blocked" ? "var(--color-cancelled-tint)" : "var(--color-yellow-tint)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: soundState === "blocked" ? "var(--color-cancelled)" : "var(--color-ink)" }}>
            {soundState === "blocked"
              ? "Sound disabled — click Enable sound"
              : "Enable kitchen sound to hear new-order alerts"}
          </span>
          <button
            onClick={enableSound}
            style={{
              border: "none",
              background: "var(--color-yellow)",
              color: "var(--color-ink)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Enable kitchen sound
          </button>
        </div>
      )}

      <AnimatePresence>
        {connectionLost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "var(--color-cancelled-tint)",
              color: "var(--color-cancelled)",
              borderRadius: "var(--radius-md)",
              padding: "10px 16px",
              marginBottom: 16,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Connection lost — showing last known orders, retrying…
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: 20,
        }}
      >
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16 }}>{col.label}</h2>
                <span
                  style={{
                    background: "var(--color-yellow-tint)",
                    color: "var(--color-yellow-deep)",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {columnOrders.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <AnimatePresence>
                  {columnOrders.length === 0 ? (
                    <div style={{ color: "var(--color-ink-soft)", fontSize: 13, padding: "8px 2px" }}>
                      No orders
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isNew={newOrderIds.includes(order.id)}
                        onAdvance={handleAdvance}
                        onAcknowledge={acknowledgeNewOrder}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
