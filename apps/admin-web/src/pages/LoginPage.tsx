import { useState } from "react";
import { motion } from "motion/react";
import { login, ApiError } from "../lib/api";

interface LoginPageProps {
  onLoggedIn: (displayName: string) => void;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await login({ username, password });
      onLoggedIn(session.displayName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: 20,
      }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "var(--color-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          CL
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Staff sign in</h1>
        <p style={{ color: "var(--color-ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Cafe Lile order management
        </p>

        <label style={labelStyle}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          autoComplete="username"
          autoFocus
        />

        <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 44 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink-soft)",
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              background: "var(--color-cancelled-tint)",
              color: "var(--color-cancelled)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 13.5,
            }}
          >
            {error}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting || !username || !password}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "13px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: isSubmitting || !username || !password ? "var(--color-line)" : "var(--color-yellow)",
            color: "var(--color-ink)",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: isSubmitting || !username || !password ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span className="spinner" aria-hidden="true" /> Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "var(--color-ink-soft)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--color-line)",
  // 16px minimum avoids iOS Safari auto-zooming the page on focus.
  fontSize: 16,
  background: "var(--color-bg)",
  color: "var(--color-ink)",
};
