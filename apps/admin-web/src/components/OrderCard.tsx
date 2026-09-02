import { motion } from "motion/react";
import type { OrderStatus } from "@cafe-lile/contracts";
import { ORDER_STATUS_LABELS, ALLOWED_TRANSITIONS, PAYMENT_METHOD_LABELS } from "@cafe-lile/contracts";
import { MapPin, X } from "lucide-react";
import type { AdminOrderRow } from "../lib/api";
import { formatPrice } from "../lib/format";
import { timeAgo } from "../lib/time";

interface OrderCardProps {
  order: AdminOrderRow;
  isNew: boolean;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  onAcknowledge: (orderId: string) => void;
}

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: "მიღება",
  preparing: "მომზადება დაწყებულია",
  ready: "მზადაა",
  completed: "დასრულებულია",
};

export function OrderCard({ order, isNew, onAdvance, onAcknowledge }: OrderCardProps) {
  const nextStatuses = ALLOWED_TRANSITIONS[order.status].filter((s) => s !== "cancelled");
  const primaryNext = nextStatuses[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => isNew && onAcknowledge(order.id)}
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        boxShadow: isNew ? "0 0 0 2px var(--color-yellow)" : "var(--shadow-card)",
        cursor: isNew ? "pointer" : "default",
      }}
    >
      {isNew && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          style={{
            display: "inline-block",
            background: "var(--color-yellow)",
            color: "var(--color-ink)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 5,
            marginBottom: 8,
            letterSpacing: "0.02em",
          }}
        >
          ახალი შეკვეთა
        </motion.div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
          {order.reference}
        </span>
        <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>{timeAgo(order.placedAt)}</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{order.customerName}</div>
      {order.customerPhone && (
        <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginBottom: 4 }}>{order.customerPhone}</div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 5,
            background: order.fulfillmentMethod === "delivery" ? "var(--color-yellow-tint)" : "var(--color-line)",
            color: order.fulfillmentMethod === "delivery" ? "var(--color-yellow-deep)" : "var(--color-ink-soft)",
          }}
        >
          {order.fulfillmentMethod === "delivery" ? "მიტანა" : "აღება"}
        </span>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 5,
            background: order.paymentMethod === "card" ? "var(--color-yellow-tint)" : "var(--color-line)",
            color: order.paymentMethod === "card" ? "var(--color-yellow-deep)" : "var(--color-ink-soft)",
          }}
        >
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </span>
      </div>

      {order.fulfillmentMethod === "delivery" && order.deliveryAddress && (
        <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {order.deliveryAddress}</span>
          {order.deliveryLatitude !== null && order.deliveryLongitude !== null && (
            <>
              {" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${order.deliveryLatitude}&mlon=${order.deliveryLongitude}#map=17/${order.deliveryLatitude}/${order.deliveryLongitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--color-yellow-deep)", fontWeight: 600 }}
              >
                რუკაზე ნახვა
              </a>
            </>
          )}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--color-line)", margin: "10px 0", paddingTop: 10 }}>
        {order.items.map((item) => (
          <div key={item.id} style={{ marginBottom: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>
                {item.quantity}× {item.itemNameSnapshot}
              </span>
              <span style={{ color: "var(--color-ink-soft)" }}>{formatPrice(item.lineTotalMinor, order.currencyCode)}</span>
            </div>
            {(item.excludedIngredients ?? []).length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-cancelled)",
                  marginTop: 1,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><X size={12} /> გარეშე: {item.excludedIngredients.join(", ")}</span>
              </div>
            )}
          </div>
        ))}
        {order.deliveryFeeMinor > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
            <span>მიტანის საფასური</span>
            <span style={{ color: "var(--color-ink-soft)" }}>{formatPrice(order.deliveryFeeMinor, order.currencyCode)}</span>
          </div>
        )}
      </div>

      {order.customerNote && (
        <div
          style={{
            fontSize: 12.5,
            fontStyle: "italic",
            color: "var(--color-ink-soft)",
            marginBottom: 8,
            background: "var(--color-yellow-tint)",
            padding: "6px 10px",
            borderRadius: 6,
          }}
        >
          "{order.customerNote}"
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{formatPrice(order.totalMinor, order.currencyCode)}</span>
        {primaryNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(order.id, primaryNext);
            }}
            style={{
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
            {ADVANCE_LABEL[primaryNext]}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export { ORDER_STATUS_LABELS };
