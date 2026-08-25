import { useEffect, useState } from "react";
import { applyTheme, getInitialTheme, saveTheme, type Theme } from "../lib/theme";

/** Light/dark toggle. Persists the choice and defaults to the OS preference. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Apply once on mount (also covers a pre-hydration flash).
  useEffect(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
    setTheme(next);
  }

  return (
    <button
      data-print-hide
      onClick={toggle}
      className="icon-btn"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 62,
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        fontSize: 17,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-ink)",
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 1px 6px rgba(33, 28, 18, 0.15)",
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
