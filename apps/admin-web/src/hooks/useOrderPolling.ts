import { useCallback, useEffect, useRef, useState } from "react";
import { getActiveOrders, ApiError, type AdminOrderRow } from "../lib/api";

const POLL_INTERVAL_MS = 5000;

export function useOrderPolling() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);

  const knownIdsRef = useRef<Set<string> | null>(null); // null = not yet initialized
  const backoffRef = useRef(POLL_INTERVAL_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const acknowledgeNewOrder = useCallback((orderId: string) => {
    setNewOrderIds((prev) => prev.filter((id) => id !== orderId));
  }, []);

  const poll = useCallback(async () => {
    try {
      const { orders: fetched } = await getActiveOrders();
      setConnectionLost(false);
      backoffRef.current = POLL_INTERVAL_MS;

      const fetchedIds = new Set(fetched.map((o) => o.id));

      if (knownIdsRef.current !== null) {
        // Compare against the previous snapshot to find orders unseen before.
        const freshlyArrived = fetched.filter(
          (o) => o.status === "new" && !knownIdsRef.current!.has(o.id)
        );
        if (freshlyArrived.length > 0) {
          setNewOrderIds((prev) => [...prev, ...freshlyArrived.map((o) => o.id)]);
        }
      }

      knownIdsRef.current = fetchedIds;
      setOrders(fetched);
      setLoading(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === "session_invalid")) {
        setSessionExpired(true);
        stoppedRef.current = true;
        return;
      }
      // Network failure: keep last known board, surface a connection warning, back off.
      setConnectionLost(true);
      backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
    }

    if (!stoppedRef.current) {
      timerRef.current = setTimeout(poll, backoffRef.current);
    }
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    poll();
    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll]);

  const refreshNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    backoffRef.current = POLL_INTERVAL_MS;
    poll();
  }, [poll]);

  return { orders, isLoading, connectionLost, sessionExpired, newOrderIds, acknowledgeNewOrder, refreshNow };
}
