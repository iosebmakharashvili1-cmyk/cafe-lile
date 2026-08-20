import { useEffect, useMemo, useState } from "react";
import type { PublicMenuResponse, CreateOrderResponse, FulfillmentMethod } from "@cafe-lile/contracts";
import { fetchMenu, submitOrder, ApiError } from "./lib/api";
import { useCart, getOrCreateIdempotencyKey, clearIdempotencyKey } from "./hooks/useCart";
import { Header } from "./components/Header";
import { MenuList } from "./components/MenuList";
import { MenuSkeleton } from "./components/MenuSkeleton";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutForm } from "./components/CheckoutForm";
import { Confirmation } from "./components/Confirmation";

type Screen = "menu" | "checkout" | "confirmation";

export default function App() {
  const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreateOrderResponse["order"] | null>(null);

  useEffect(() => {
    fetchMenu()
      .then(setMenu)
      .catch(() => setLoadError("Couldn't load the menu. Check your connection and try again."));
  }, []);

  const menuItemsById = useMemo(() => {
    const map = new Map();
    for (const item of menu?.items ?? []) map.set(item.id, item);
    return map;
  }, [menu]);

  const cart = useCart(menuItemsById);
  const quantitiesByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart.lines) map.set(line.menuItemId, line.quantity);
    return map;
  }, [cart.lines]);

  async function handleCheckoutSubmit(data: {
    customerName: string;
    customerPhone: string;
    customerNote?: string;
    fulfillmentMethod: FulfillmentMethod;
    deliveryLocation?: { address: string; latitude: number; longitude: number };
  }) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const idempotencyKey = getOrCreateIdempotencyKey();
      const result = await submitOrder(
        {
          ...data,
          lines: cart.lines,
        },
        idempotencyKey
      );
      setConfirmedOrder(result.order);
      setScreen("confirmation");
      cart.clearCart();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        if (err.code === "item_unavailable" || err.code === "unknown_item") {
          // Refresh menu so stale availability doesn't cause repeat failures.
          fetchMenu().then(setMenu).catch(() => {});
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleOrderAgain() {
    clearIdempotencyKey();
    setConfirmedOrder(null);
    setSubmitError(null);
    setScreen("menu");
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-ink-soft)" }}>
        <p>{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16,
            border: "none",
            background: "var(--color-yellow)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 20px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  if (screen === "confirmation" && confirmedOrder) {
    return <Confirmation order={confirmedOrder} onDone={handleOrderAgain} />;
  }

  if (screen === "checkout") {
    return (
      <CheckoutForm
        subtotalMinor={cart.subtotalMinor}
        currencyCode={menu?.settings.currencyCode ?? "GEL"}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
        onSubmit={handleCheckoutSubmit}
        onBack={() => setScreen("menu")}
      />
    );
  }

  return (
    <>
      <Header
        restaurantName={menu?.settings.restaurantName ?? "Cafe Lile"}
        acceptingOrders={menu?.settings.acceptingOrders ?? true}
        itemCount={cart.itemCount}
        onCartClick={() => setCartOpen(true)}
      />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 100px" }}>
        {!menu ? (
          <MenuSkeleton />
        ) : (
          <MenuList
            categories={menu.categories}
            items={menu.items}
            currencyCode={menu.settings.currencyCode}
            quantitiesByItemId={quantitiesByItemId}
            onAdd={cart.addItem}
            onDecrement={cart.decrementItem}
          />
        )}
      </main>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        enrichedLines={cart.enrichedLines}
        subtotalMinor={cart.subtotalMinor}
        currencyCode={menu?.settings.currencyCode ?? "GEL"}
        onAdd={cart.addItem}
        onDecrement={cart.decrementItem}
        onCheckout={() => {
          if (menu && !menu.settings.acceptingOrders) return;
          setCartOpen(false);
          setScreen("checkout");
        }}
      />
    </>
  );
}
