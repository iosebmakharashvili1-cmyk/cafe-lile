import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getSettings, updateSettings, type AdminSettings } from "../lib/api";

export function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    getSettings().then((res) => setSettings(res.settings));
  }, []);

  async function handleToggleAccepting() {
    if (!settings) return;
    const next = !settings.acceptingOrders;
    setSettings({ ...settings, acceptingOrders: next ? 1 : 0 });
    setSaving(true);
    await updateSettings({ acceptingOrders: next });
    setSaving(false);
    setSavedAt(Date.now());
  }

  async function handleFieldSave(field: "pickupInstructions" | "defaultPrepMinutes", value: string | number) {
    if (!settings) return;
    setSaving(true);
    await updateSettings({ [field]: value } as any);
    setSaving(false);
    setSavedAt(Date.now());
  }

  if (!settings) {
    return (
      <div style={{ padding: "20px 24px" }}>
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: "100%", maxWidth: 480, height: 80 }} />
      </div>
    );
  }

  const accepting = Boolean(settings.acceptingOrders);

  return (
    <div style={{ padding: "20px 24px", maxWidth: 520 }}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>Settings</h2>

      {/* Accepting orders is deliberately the first control — an unmistakable pause switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: accepting ? "var(--color-yellow-tint)" : "var(--color-cancelled-tint)",
          borderRadius: "var(--radius-md)",
          padding: 18,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Accepting orders</div>
          <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 2 }}>
            {accepting ? "Customers can place orders now." : "Ordering is paused for customers."}
          </div>
        </div>
        <ToggleSwitch checked={accepting} onChange={handleToggleAccepting} />
      </div>

      <Field label="Pickup / delivery instructions">
        <textarea
          defaultValue={settings.pickupInstructions}
          onBlur={(e) => handleFieldSave("pickupInstructions", e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </Field>

      <Field label="Default prep time (minutes)">
        <input
          type="number"
          min={1}
          defaultValue={settings.defaultPrepMinutes}
          onBlur={(e) => handleFieldSave("defaultPrepMinutes", Number(e.target.value))}
          style={{ ...inputStyle, maxWidth: 120 }}
        />
      </Field>

      <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginTop: 8 }}>
        {isSaving ? "Saving…" : savedAt ? "Saved" : ""}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: "none",
        background: checked ? "var(--color-yellow)" : "var(--color-line)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute",
          top: 2,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--color-surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
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
