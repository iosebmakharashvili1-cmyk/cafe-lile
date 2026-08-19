import { useCallback, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@cafe-lile/contracts";

export interface CartLine {
  menuItemId: string;
  quantity: number;
}

const CART_STORAGE_KEY = "cafe-lile-cart";
const IDEMPOTENCY_STORAGE_KEY = "cafe-lile-idempotency-key";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useCart(menuItemsById: Map<string, MenuItem>) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

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
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
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

/** One idempotency key per checkout attempt; persists across retries until success. */
export function getOrCreateIdempotencyKey(): string {
  let key = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, key);
  }
  return key;
}

export function clearIdempotencyKey(): void {
  localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
}
