import { useEffect } from "react";

const BASE_TITLE = "Cafe Lile · Restaurant Admin";

export function useTabTitleAlert(newOrderCount: number) {
  useEffect(() => {
    document.title = newOrderCount > 0 ? `(${newOrderCount}) New orders · Restaurant Admin` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [newOrderCount]);
}
