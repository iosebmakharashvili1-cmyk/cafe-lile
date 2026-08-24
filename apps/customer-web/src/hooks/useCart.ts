import { useCallback, useMemo, useState } from "react";
import type { MenuItem } from "@cafe-lile/contracts";

export interface CartLine {
  menuItemId: string;
  quantity: number;
}

// Cart lives in memory only (React state), not localStorage/sessionStorage.
// This is intentional: a hard reload should give the customer a clean cart,
// while normal in-app navigation (menu <-> checkout) keeps it since the
// React app never unmounts during that.
export function useCart(menuItemsById: Map<string, MenuItem>) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((menuItemId: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === menuItemId);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === menuItemId ? { ...l, quantity: Math.min(20, l.quantity + 1) } : l
        );
      }
      return [...prev, { menuItemId, quantity: 1 }];
    });
  }, []);

  const decrementItem = useCallback((menuItemId: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((l) => l.menuItemId !== menuItemId);
      }
      return prev.map((l) =>
        l.menuItemId === menuItemId ? { ...l, quantity: l.quantity - 1 } : l
      );
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

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

  return { lines, enrichedLines, subtotalMinor, itemCount, addItem, decrementItem, removeItem, clearCart };
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
