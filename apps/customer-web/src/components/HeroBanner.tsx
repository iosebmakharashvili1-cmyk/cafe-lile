import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface HeroBannerProps {
  restaurantName: string;
  acceptingOrders: boolean;
}

export function HeroBanner({ restaurantName, acceptingOrders }: HeroBannerProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      animate(titleRef.current, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 600,
        ease: "outCubic",
      });
    }
    if (subtitleRef.current) {
      animate(subtitleRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        delay: 150,
        ease: "outCubic",
      });
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: 200,
        background: "linear-gradient(135deg, #F5B700 0%, #E8A700 55%, #C98A00 100%)",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
      }}
    >
      {/* Subtle decorative pattern, evokes a coffee/pastry motif without needing real imagery */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #211C12 0, #211C12 2px, transparent 2px), radial-gradient(circle at 70% 60%, #211C12 0, #211C12 2px, transparent 2px), radial-gradient(circle at 45% 80%, #211C12 0, #211C12 2px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div style={{ position: "relative", padding: "0 20px 24px", width: "100%" }}>
        <h1
          ref={titleRef}
          style={{
            fontSize: 34,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-ink)",
            margin: 0,
            opacity: 0,
          }}
        >
          {restaurantName}
        </h1>
        <div
          ref={subtitleRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            opacity: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: acceptingOrders ? "var(--color-ready)" : "var(--color-cancelled)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(33,28,18,0.75)" }}>
            {acceptingOrders ? "Open for orders" : "Not accepting orders right now"}
          </span>
        </div>
      </div>
    </div>
  );
}
