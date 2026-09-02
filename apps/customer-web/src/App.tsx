import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicMenuResponse, CreateOrderResponse, FulfillmentMethod, MenuItem } from "@cafe-lile/contracts";
import { fetchMenu, submitOrder, ApiError } from "./lib/api";
import { captureAttribution, attributionNoteSuffix } from "./lib/utm";
import { ScrollProgress } from "./components/ScrollProgress";
import { BackToTop } from "./components/BackToTop";
import { CookieBanner } from "./components/CookieBanner";
import { FloatingContact } from "./components/FloatingContact";
import { FaqSection } from "./components/FaqSection";
import { useCart, getOrCreateIdempotencyKey, clearIdempotencyKey } from "./hooks/useCart";
import { usePageTitle } from "./hooks/usePageTitle";
import { HeroBanner } from "./components/HeroBanner";
import { ThemeToggle } from "./components/ThemeToggle";
import { SiteFooter } from "./components/SiteFooter";
import { CategoryNav } from "./components/CategoryNav";
import { MenuList } from "./components/MenuList";
import { MenuSkeleton } from "./components/MenuSkeleton";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CartBar } from "./components/CartBar";
import { CheckoutForm } from "./components/CheckoutForm";
import { Confirmation } from "./components/Confirmation";

type Screen = "menu" | "checkout" | "confirmation";

export default function App() {
  const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");
  usePageTitle(screen);
  const [isCartOpen, setCartOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreateOrderResponse["order"] | null>(null);

  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [menuLoadedAt, setMenuLoadedAt] = useState<Date | null>(null);

  // Remember marketing attribution (utm_*) for this session.
  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    fetchMenu()
      .then((res) => {
        setMenu(res);
        setMenuLoadedAt(new Date());
        if (res.categories.length > 0) setActiveCategoryId(res.categories[0].id);
      })
      .catch(() => setLoadError("Couldn't load the menu. Check your connection and try again."));
  }, []);

  const menuItemsById = useMemo(() => {
    const map = new Map();
    for (const item of menu?.items ?? []) map.set(item.id, item);
    return map;
  }, [menu]);

  const cart = useCart(menuItemsById);
  // Total per dish across all exclusion variants, for the menu badge.
  const quantitiesByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart.lines) {
      map.set(line.menuItemId, (map.get(line.menuItemId) ?? 0) + line.quantity);
    }
    return map;
  }, [cart.lines]);

  function handleCategorySelect(categoryId: string) {
    setActiveCategoryId(categoryId);
    categoryRefs.current.get(categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
      // Append marketing attribution to the note so the cafe sees where orders come from.
      const baseNote = data.customerNote ?? "";
      const suffix = attributionNoteSuffix(baseNote.length);
      const customerNote = suffix ? `${baseNote}${baseNote ? " " : ""}${suffix}` : baseNote || undefined;
      const result = await submitOrder(
        {
          ...data,
          customerNote,
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
          fetchMenu().then(setMenu).catch(() => {});
        }
      } else {
        setSubmitError("დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ თავიდან.");
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
      <HeroBanner
        restaurantName={menu?.settings.restaurantName ?? "Cafe Lile"}
        acceptingOrders={menu?.settings.acceptingOrders ?? true}
      />

      {menu && (
        <CategoryNav
          categories={menu.categories}
          activeCategoryId={activeCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "20px 0 120px" }}>
        {!menu ? (
          <MenuSkeleton />
        ) : (
          <>
            <MenuList
              categories={menu.categories}
              items={menu.items}
              currencyCode={menu.settings.currencyCode}
              quantitiesByItemId={quantitiesByItemId}
              onItemTap={setActiveItem}
              categoryRefs={categoryRefs}
            />
            <div style={{ height: 40 }} />
            <FaqSection prepMinutes={menu.settings.defaultPrepMinutes} />
            <SiteFooter menuUpdatedAt={menuLoadedAt} />
          </>
        )}
      </main>

      <ScrollProgress />
      <BackToTop liftedForCartBar={cart.itemCount > 0} />
      <ThemeToggle />
      <FloatingContact liftedForCartBar={cart.itemCount > 0} />
      <CookieBanner />

      <ItemDetailModal
        item={activeItem}
        currencyCode={menu?.settings.currencyCode ?? "GEL"}
        getQuantity={cart.getQuantity}
        onClose={() => setActiveItem(null)}
        onAdd={cart.addItem}
        onDecrement={cart.decrementItem}
      />

      <CartBar
        itemCount={cart.itemCount}
        subtotalMinor={cart.subtotalMinor}
        currencyCode={menu?.settings.currencyCode ?? "GEL"}
        onOpenCart={() => setCartOpen(true)}
      />

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
