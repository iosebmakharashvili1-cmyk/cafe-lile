import { useCallback, useEffect, useState } from "react";
import { getSession, logout, ApiError } from "./lib/api";
import { LoginPage } from "./pages/LoginPage";
import { BoardPage } from "./pages/BoardPage";
import { MenuPage } from "./pages/MenuPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NavBar } from "./components/NavBar";
import { ConfirmDialog } from "./components/ConfirmDialog";

type AuthState =
  | { status: "checking" }
  | { status: "signed_out" }
  | { status: "signed_in"; displayName: string };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [activeTab, setActiveTab] = useState<"board" | "menu" | "settings">("board");
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    getSession()
      .then((session) => setAuth({ status: "signed_in", displayName: session.displayName }))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setAuth({ status: "signed_out" });
        } else {
          // Network or server error on initial check — still show login rather than a blank screen.
          setAuth({ status: "signed_out" });
        }
      });
  }, []);

  const handleSessionExpired = useCallback(() => {
    setAuth({ status: "signed_out" });
  }, []);

  // Called by the NavBar button — opens the confirmation modal first.
  function requestLogout() {
    setLogoutOpen(true);
  }

  async function handleLogout() {
    setLogoutOpen(false);
    await logout().catch(() => {});
    setAuth({ status: "signed_out" });
  }

  if (auth.status === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 40, borderRadius: "var(--radius-md)" }} />
      </div>
    );
  }

  if (auth.status === "signed_out") {
    return <LoginPage onLoggedIn={(displayName) => setAuth({ status: "signed_in", displayName })} />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar
        displayName={auth.displayName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={requestLogout}
      />
      <ConfirmDialog
        isOpen={isLogoutOpen}
        title="გასვლა?"
        body="ამ მოწყობილობაზე შეწყდება ახალი შეკვეთების შესახებ შეტყობინებები, სანამ ხელახლა არ შეხვალთ."
        confirmLabel="გასვლა"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
      {activeTab === "board" ? (
        <BoardPage onSessionExpired={handleSessionExpired} />
      ) : activeTab === "menu" ? (
        <MenuPage />
      ) : (
        <SettingsPage />
      )}
    </div>
  );
}
