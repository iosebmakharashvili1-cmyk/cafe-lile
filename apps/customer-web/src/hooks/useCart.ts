import { useCallback, useMemo, useState } from "react";
import type { MenuItem } from "@cafe-lile/contracts";

export interface CartLine {
  menuItemId: string;
  /** Ingredients the customer asked to leave out of this dish. */
  excludedIngredients: string[];
  quantity: number;
}

/**
 * Two lines with the same dish but different exclusions are different cart
 * entries ("Khinkali without cilantro" vs plain Khinkali).
 */
export function cartLineKey(menuItemId: string, excludedIngredients: string[]): string {
  return `${menuItemId}::${[...excludedIngredients].sort().join("|")}`;
}

// Cart lives in memory only (React state), not localStorage/sessionStorage.
// This is intentional: a hard reload should give the customer a clean cart,
// while normal in-app navigation (menu <-> checkout) keeps it since the
// React app never unmounts during that.
export function useCart(menuItemsById: Map<string, MenuItem>) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((menuItemId: string, excludedIngredients: string[] = []) => {
    const key = cartLineKey(menuItemId, excludedIngredients);
    setLines((prev) => {
      const existing = prev.find((l) => cartLineKey(l.menuItemId, l.excludedIngredients) === key);
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: Math.min(20, l.quantity + 1) } : l
        );
      }
      return [...prev, { menuItemId, excludedIngredients, quantity: 1 }];
    });
  }, []);

  const decrementItem = useCallback((menuItemId: string, excludedIngredients: string[] = []) => {
    const key = cartLineKey(menuItemId, excludedIngredients);
    setLines((prev) => {
      const index = prev.findIndex((l) => cartLineKey(l.menuItemId, l.excludedIngredients) === key);
      if (index === -1) return prev;
      const line = prev[index];
      if (line.quantity <= 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((l, i) => (i === index ? { ...l, quantity: l.quantity - 1 } : l));
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const getQuantity = useCallback(
    (menuItemId: string, excludedIngredients: string[] = []) => {
      const key = cartLineKey(menuItemId, excludedIngredients);
      return lines.find((l) => cartLineKey(l.menuItemId, l.excludedIngredients) === key)?.quantity ?? 0;
    },
    [lines]
  );

  const enrichedLines = useMemo(
    () =>
      lines
        .map((line) => {
          const item = menuItemsById.get(line.menuItemId);
          if (!item) return null;
          return { ...line, item };
        })
        .filter((l): l is CartLine & { item: MenuItem } => l !== null),
    [lines, menuItemsById]
  );

  const subtotalMinor = useMemo(
    () => enrichedLines.reduce((sum, l) => sum + l.item.priceMinor * l.quantity, 0),
    [enrichedLines]
  );

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return {
    lines,
    enrichedLines,
    subtotalMinor,
    itemCount,
    addItem,
    decrementItem,
    removeItem,
    clearCart,
    getQuantity,
  };
}

/**
 * One idempotency key per checkout attempt, held in memory for the lifetime
 * of the current checkout flow. Not persisted — a hard reload starting a
 * fresh cart also means a fresh checkout attempt, which is the correct
 * pairing (an old key tied to an abandoned cart should not be reused).
 */
let currentIdempotencyKey: string | null = null;

export function getOrCreateIdempotencyKey(): string {
  if (!currentIdempotencyKey) {
    currentIdempotencyKey = crypto.randomUUID();
  }
  return currentIdempotencyKey;
}

export function clearIdempotencyKey(): void {
  currentIdempotencyKey = null;
}
