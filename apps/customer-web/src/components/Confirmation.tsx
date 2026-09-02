import { motion } from "motion/react";
import type { CreateOrderResponse } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";
import { CopyButton } from "./CopyButton";

interface ConfirmationProps {
  order: CreateOrderResponse["order"];
  onDone: () => void;
}

export function Confirmation({ order, onDone }: ConfirmationProps) {
  return (
    <div className="print-receipt" style={{ padding: "48px 20px", maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--color-yellow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 28,
        }}
      >
        ✓
      </motion.div>

      <h2 style={{ fontSize: 24, marginBottom: 8 }}>შეკვეთა განთავსებულია</h2>
      <p style={{ color: "var(--color-ink-soft)", marginBottom: 28, fontSize: 14.5 }}>
        {order.fulfillmentMethod === "pickup"
          ? "We'll have it ready for pickup."
          : "We're preparing it for delivery."}
      </p>

      <div
        className="print-receipt-box"
        style={{
          background: "var(--color-yellow-tint)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 4 }}>Order reference</div>
        <div style={{ fontSize: 32, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.02em" }}>
          {order.reference}
        </div>
        <CopyButton value={order.reference} label="ნომრის კოპირება" />
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(33,28,18,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span>Total (cash on {order.fulfillmentMethod})</span>
            <span style={{ fontWeight: 700 }}>{formatPrice(order.totalMinor, order.currencyCode)}</span>
          </div>
        </div>
      </div>

      {order.fulfillmentMethod === "pickup" && (
        <p style={{ fontSize: 13.5, color: "var(--color-ink-soft)", marginBottom: 28 }}>
          {order.pickupInstructions}
        </p>
      )}

      <div
        data-print-hide
        style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}
      >
        <button
          onClick={() => window.print()}
          className="pressable"
          style={{
            border: "1.5px solid var(--color-line)",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-sm)",
            padding: "13px 22px",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: "pointer",
          }}
        >
          🖨 Print receipt
        </button>
        <button
          onClick={onDone}
          className="pressable"
          style={{
            border: "none",
            background: "var(--color-yellow)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-sm)",
            padding: "13px 28px",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: "pointer",
          }}
        >
          Order again
        </button>
      </div>
    </div>
  );
}
