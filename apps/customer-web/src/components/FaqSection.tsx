import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface FaqSectionProps {
  /** Restaurant's default prep time, shown in the "how long" answer. */
  prepMinutes?: number;
}

function buildFaqItems(prepMinutes: number) {
  return [
    {
      q: "How long does an order take?",
      a: `Most orders are ready in about ${prepMinutes} minutes. During busy hours it can take a little longer — we'll call you if there's a delay.`,
    },
    {
      q: "How do I pay?",
      a: "Payment is cash, due at pickup or when your order is delivered — whatever is easiest for you.",
    },
    {
      q: "Where do you deliver?",
      a: "We deliver around Mukhrani and the nearby villages (Ksovrisi, Dzalisi, Vaziani, Vardisubani, Iltoza, Odzisi). Pin your location at checkout and we'll confirm the delivery fee before you order.",
    },
    {
      q: "Can I remove ingredients?",
      a: "Yes — tap any dish, then tap the ingredients you'd like left out. The kitchen sees your choices on the ticket.",
    },
    {
      q: "How will I know my order is ready?",
      a: "Keep your order reference (you can copy or print it after ordering). If anything changes we'll call the phone number you gave us.",
    },
  ];
}

/** Expandable FAQ accordion shown under the menu. One item open at a time. */
export function FaqSection({ prepMinutes = 20 }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqItems = buildFaqItems(prepMinutes);

  return (
    <section style={{ padding: "0 20px", maxWidth: 640, margin: "0 auto" }} aria-label="Frequently asked questions">
      <h2 style={{ fontSize: 21, marginBottom: 14 }}>Good to know</h2>
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-line)",
          overflow: "hidden",
        }}
      >
        {faqItems.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} style={{ borderBottom: i < faqItems.length - 1 ? "1px solid var(--color-line)" : undefined }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="menu-row"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 18px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                }}
              >
                {item.q}
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    transition: "transform 200ms ease",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    color: "var(--color-yellow-deep)",
                    fontSize: 17,
                  }}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      style={{
                        margin: 0,
                        padding: "0 18px 16px",
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        color: "var(--color-ink-soft)",
                      }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
