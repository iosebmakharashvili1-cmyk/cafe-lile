import { useState } from "react";
import { motion } from "motion/react";
import type { FulfillmentMethod, PaymentMethod } from "@cafe-lile/contracts";
import { PAYMENT_METHOD_LABELS } from "@cafe-lile/contracts";
import { resolveDeliveryZone } from "@cafe-lile/contracts";
import { Banknote, CreditCard } from "lucide-react";
import { formatPrice } from "../lib/format";
import { DeliveryMapPicker, type PickedLocation } from "./DeliveryMapPicker";

interface CheckoutFormProps {
  subtotalMinor: number;
  currencyCode: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    customerNote?: string;
    fulfillmentMethod: FulfillmentMethod;
    paymentMethod: PaymentMethod;
    deliveryLocation?: { address: string; latitude: number; longitude: number };
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState<PickedLocation | null>(null);
  const [touched, setTouched] = useState<{ name: boolean; phone: boolean }>({ name: false, phone: false });

  // Mirror of the server's zone resolution — the API recomputes this on submit,
  // so the customer always sees the exact fee they will be charged.
  const zoneInfo =
    method === "delivery" && pin ? resolveDeliveryZone(pin.latitude, pin.longitude) : null;
  const deliveryFeeMinor = method === "delivery" && zoneInfo ? zoneInfo.feeMinor : 0;
  const totalMinor = subtotalMinor + deliveryFeeMinor;

  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length >= 4 &&
    (method === "pickup" || (address.trim().length > 0 && pin !== null));

  // Inline field errors appear only once a field has been touched.
  const nameError = touched.name && name.trim().length === 0 ? "გთხოვთ მიუთითოთ თქვენი სახელი." : null;
  const phoneError = touched.phone && phone.trim().length < 4 ? "მიუთითეთ ტელეფონის ნომერი დასაკავშირებლად." : null;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "none", color: "var(--color-ink-soft)", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        ← მენიუში დაბრუნება
      </button>

      <h2 style={{ fontSize: 24, marginBottom: 20 }}>შეკვეთის გაფორმება</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <MethodTab label="აღება" active={method === "pickup"} onClick={() => setMethod("pickup")} />
        <MethodTab label="მიტანა" active={method === "delivery"} onClick={() => setMethod("delivery")} />
      </div>

      <Field label="თქვენი სახელი" error={nameError}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="სრული სახელი"
          maxLength={80}
          aria-invalid={nameError ? true : undefined}
          style={{ ...inputStyle, ...(nameError ? inputErrorStyle : null) }}
        />
      </Field>

      <Field label="ტელეფონის ნომერი" error={phoneError}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          placeholder="სავალდებულოა — შეკვეთის შესახებ დასაკავშირებლად"
          maxLength={30}
          style={inputStyle}
          type="tel"
          aria-invalid={phoneError ? true : undefined}
        />
      </Field>

      {method === "delivery" && (
        <>
          <Field label="მიტანის მისამართი">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ქუჩა, კორპუსი, ბინა"
              maxLength={240}
              style={inputStyle}
            />
          </Field>
          <Field label="მონიშნეთ თქვენი მდებარეობა">
            <DeliveryMapPicker value={pin} onChange={setPin} />
            {zoneInfo && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: zoneInfo.zone ? "var(--color-yellow-deep)" : "var(--color-cancelled)",
                }}
              >
                {zoneInfo.zone
                  ? `მიტანა: ${zoneInfo.zone.name} — ${formatPrice(zoneInfo.feeMinor, currencyCode)}`
                  : `ჩვენი სოფლების გარეთ — ${formatPrice(zoneInfo.feeMinor, currencyCode)} (დავუკავშირდებით ტელეფონით)`}
              </div>
            )}
          </Field>
        </>
      )}

      <Field label="შენიშვნა (არასავალდებულო)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="რაც სამზარეულომ უნდა იცოდეს"
          maxLength={280}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </Field>

      <Field label="გადახდის მეთოდი">
        <div style={{ display: "flex", gap: 8 }}>
          <PaymentMethodTab
            label={PAYMENT_METHOD_LABELS.cash}
            icon={<Banknote size={16} />}
            active={paymentMethod === "cash"}
            onClick={() => setPaymentMethod("cash")}
          />
          <PaymentMethodTab
            label={PAYMENT_METHOD_LABELS.card}
            icon={<CreditCard size={16} />}
            active={paymentMethod === "card"}
            onClick={() => setPaymentMethod("card")}
          />
        </div>
        {paymentMethod === "card" && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-sm)",
            }}>
            <span style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginRight: 4 }}>მივიღებთ:</span>
            <BogLogo />
            <TbcLogo />
          </div>
        )}
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
          <span>ჯამი (პროდუქტები)</span>
          <span>{formatPrice(subtotalMinor, currencyCode)}</span>
        </div>
        {method === "delivery" && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
            <span>მიტანის საფასური{zoneInfo?.zone ? ` (${zoneInfo.zone.name})` : ""}</span>
            <span>{zoneInfo ? formatPrice(deliveryFeeMinor, currencyCode) : "აირჩიეთ მდებარეობა"}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 15,
            fontWeight: 700,
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(33,28,18,0.1)",
          }}
        >
          <span>სულ ჯამი</span>
          <span>{formatPrice(totalMinor, currencyCode)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          {paymentMethod === "card" ? (
            <><CreditCard size={14} /> გადახდა ბარათით, {method === "pickup" ? "აღებისას" : "მიტანისას"}.</>
          ) : (
            <><Banknote size={14} /> გადახდა ნაღდი ფულით, {method === "pickup" ? "აღებისას" : "მიტანისას"}.</>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            background: "var(--color-cancelled-tint)",
            color: "var(--color-cancelled)",
            borderRadius: "var(--radius-sm)",
            padding: "12px 14px",
            fontSize: 13.5,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!canSubmit || isSubmitting}
        className="pressable"
        aria-live="polite"
        onClick={() =>
          onSubmit({
            customerName: name.trim(),
            customerPhone: phone.trim(),
            customerNote: note.trim() || undefined,
            fulfillmentMethod: method,
            paymentMethod,
            deliveryLocation:
              method === "delivery" && pin
                ? { address: address.trim(), latitude: pin.latitude, longitude: pin.longitude }
                : undefined,
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
        {isSubmitting ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span className="spinner" aria-hidden="true" /> შეკვეთის გაფორმება…
          </span>
        ) : (
          "შეკვეთის განთავსება"
        )}
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

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-ink-soft)" }}>
        {label}
      </label>
      {children}
      {error && (
        <div role="alert" style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600, color: "var(--color-cancelled)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

const inputErrorStyle: React.CSSProperties = {
  borderColor: "var(--color-cancelled)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--color-line)",
  // 16px minimum avoids iOS Safari auto-zooming the page on focus.
  fontSize: 16,
  background: "var(--color-surface)",
  color: "var(--color-ink)",
};

function PaymentMethodTab({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
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
        fontSize: 13,
        cursor: "pointer",
        color: "var(--color-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/** Bank of Georgia logo */
function BogLogo() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="20" rx="3" fill="#333940" />
      <text x="7" y="14" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11" fill="#E8A600" letterSpacing="0.5">
        BOG
      </text>
    </svg>
  );
}

/** TBC Bank logo */
function TbcLogo() {
  return (
    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="20" rx="3" fill="#E31E24" />
      <text x="7" y="14" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11" fill="#fff" letterSpacing="0.5">
        TBC
      </text>
    </svg>
  );
}
