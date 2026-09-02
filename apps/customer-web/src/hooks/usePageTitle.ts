import { useEffect } from "react";

const TITLES: Record<string, string> = {
  menu: "კაფე ლილე — შეკვეთა მუხრანში, აღება ან მიტანა",
  checkout: "შეკვეთის გაფორმება — კაფე ლილე",
  confirmation: "შეკვეთა განთავსებულია — კაფე ლილე",
};

/** Keeps the browser tab title in sync with the current screen. */
export function usePageTitle(screen: string) {
  useEffect(() => {
    document.title = TITLES[screen] ?? TITLES.menu;
  }, [screen]);
}
