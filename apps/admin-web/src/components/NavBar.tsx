import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

interface NavBarProps {
  displayName: string;
  activeTab: "board" | "menu" | "settings";
  onTabChange: (tab: "board" | "menu" | "settings") => void;
  onLogout: () => void;
}

const TABS: { id: "board" | "menu" | "settings"; label: string }[] = [
  { id: "board", label: "შეკვეთები" },
  { id: "menu", label: "მენიუ" },
  { id: "settings", label: "პარამეტრები" },
];

export function NavBar({ displayName, activeTab, onTabChange, onLogout }: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleMobileTab(tab: "board" | "menu" | "settings") {
    setMobileMenuOpen(false);
    onTabChange(tab);
  }

  return (
    <>
      <header
        className="admin-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-line)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-yellow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              CL
            </div>
            <h1 style={{ fontSize: 17 }}>კაფე ლილეს ადმინი</h1>
          </div>

          {/* Desktop tabs */}
          <nav className="nav-desktop-tabs" aria-label="განყოფილებები">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </nav>
        </div>

        <div className="nav-desktop-user" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13.5, color: "var(--color-ink-soft)" }}>{displayName}</span>
          <button
            onClick={onLogout}
            className="pressable"
            style={{
              border: "1.5px solid var(--color-line)",
              background: "transparent",
              borderRadius: "var(--radius-sm)",
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--color-ink)",
            }}
          >
            გასვლა
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "მენიუს დახურვა" : "მენიუს გახსნა"}
          style={{
            display: "none",
            width: 44,
            height: 44,
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--color-line)",
            background: "transparent",
            cursor: "pointer",
            fontSize: 17,
            color: "var(--color-ink)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            className="nav-mobile-sheet"
            aria-label="განყოფილებები"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "fixed",
              top: 61,
              left: 0,
              right: 0,
              zIndex: 19,
              background: "var(--color-surface)",
              borderBottom: "1px solid var(--color-line)",
              boxShadow: "var(--shadow-card)",
              padding: "8px 16px 12px",
              display: "none",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleMobileTab(tab.id)}
                className="menu-row"
                style={{
                  textAlign: "left",
                  border: "none",
                  background: activeTab === tab.id ? "var(--color-yellow-tint)" : "transparent",
                  color: "var(--color-ink)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 14px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="menu-row"
              style={{
                textAlign: "left",
                border: "none",
                background: "transparent",
                color: "var(--color-cancelled)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              გასვლა ({displayName})
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pressable"
      style={{
        border: "none",
        background: active ? "var(--color-yellow-tint)" : "transparent",
        color: "var(--color-ink)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 14px",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
