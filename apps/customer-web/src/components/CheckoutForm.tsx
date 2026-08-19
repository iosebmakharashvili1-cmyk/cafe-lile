import { useState } from "react";
import { motion } from "motion/react";
import type { FulfillmentMethod } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";

interface CheckoutFormProps {
  subtotalMinor: number;
  currencyCode: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: {
    customerName: string;
    customerPhone?: string;
    customerNote?: string;
    fulfillmentMethod: FulfillmentMethod;
    deliveryAddress?: string;
  }) => void;
  onBack: () => void;
}

export function CheckoutForm({
  subtotalMinor,
  currencyCode,
  isSubmitting,
  errorMessage,
  onSubmit,
  onBack,
}: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [address, setAddress] = useState("");

  const canSubmit = name.trim().length > 0 && (method === "pickup" || address.trim().length > 0);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "none", color: "var(--color-ink-soft)", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        ← Back to menu
      </button>

      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Checkout</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <MethodTab label="Pickup" active={method === "pickup"} onClick={() => setMethod("pickup")} />
        <MethodTab label="Delivery" active={method === "delivery"} onClick={() => setMethod("delivery")} />
      </div>

      <Field label="Your name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          maxLength={80}
          style={inputStyle}
        />
      </Field>

      <Field label="Phone (optional)">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="For order updates"
          maxLength={30}
          style={inputStyle}
          type="tel"
        />
      </Field>

      {method === "delivery" && (
        <Field label="Delivery address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, building, apartment"
            maxLength={240}
            style={inputStyle}
          />
        </Field>
      )}

      <Field label="Note (optional)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything the kitchen should know"
          maxLength={280}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </Field>

      <div
        style={{
          background: "var(--color-yellow-tint)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
          <span>Estimated total</span>
          <span style={{ fontWeight: 700 }}>{formatPrice(subtotalMinor, currencyCode)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)" }}>
          Payment is cash, due at {method === "pickup" ? "pickup" : "delivery"}.
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: "var(--color-cancelled-tint)",
            color: "var(--color-cancelled)",
            borderRadius: "var(--radius-sm)",
            padding: "12px 14px",
            fontSize: 13.5,
            marginBottom: 16,
          }}
        >
          {errorMessage}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!canSubmit || isSubmitting}
        onClick={() =>
          onSubmit({
            customerName: name.trim(),
            customerPhone: phone.trim() || undefined,
            customerNote: note.trim() || undefined,
            fulfillmentMethod: method,
            deliveryAddress: method === "delivery" ? address.trim() : undefined,
          })
        }
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: !canSubmit || isSubmitting ? "var(--color-line)" : "var(--color-yellow)",
          color: "var(--color-ink)",
          fontWeight: 700,
          fontSize: 15,
          cursor: !canSubmit || isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Placing order…" : "Place order"}
      </motion.button>
    </div>
  );
}

function MethodTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px",
        borderRadius: "var(--radius-sm)",
        border: active ? "1.5px solid var(--color-yellow-deep)" : "1.5px solid var(--color-line)",
        background: active ? "var(--color-yellow-tint)" : "var(--color-surface)",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        color: "var(--color-ink)",
      }}
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-ink-soft)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--color-line)",
  fontSize: 14.5,
  background: "var(--color-surface)",
  color: "var(--color-ink)",
};
