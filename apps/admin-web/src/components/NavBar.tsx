interface NavBarProps {
  displayName: string;
  activeTab: "board" | "settings";
  onTabChange: (tab: "board" | "settings") => void;
  onLogout: () => void;
}

export function NavBar({ displayName, activeTab, onTabChange, onLogout }: NavBarProps) {
  return (
    <header
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
          <h1 style={{ fontSize: 17 }}>Cafe Lile Admin</h1>
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          <TabButton label="Orders" active={activeTab === "board"} onClick={() => onTabChange("board")} />
          <TabButton label="Settings" active={activeTab === "settings"} onClick={() => onTabChange("settings")} />
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 13.5, color: "var(--color-ink-soft)" }}>{displayName}</span>
        <button
          onClick={onLogout}
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
          Sign out
        </button>
      </div>
    </header>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
