import { useEffect } from "react";

const TITLES: Record<string, string> = {
  menu: "Cafe Lile — Order pickup or delivery in Mukhrani",
  checkout: "Checkout — Cafe Lile",
  confirmation: "Order placed — Cafe Lile",
};

/** Keeps the browser tab title in sync with the current screen. */
export function usePageTitle(screen: string) {
  useEffect(() => {
    document.title = TITLES[screen] ?? TITLES.menu;
  }, [screen]);
}
