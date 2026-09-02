import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

interface FaqSectionProps {
  /** Restaurant's default prep time, shown in the "how long" answer. */
  prepMinutes?: number;
}

function buildFaqItems(prepMinutes: number) {
  return [
    {
      q: "რამდენ ხანში მზადდება შეკვეთა?",
      a: `უმეტესი შეკვეთა მზად არის დაახლოებით ${prepMinutes} წუთში. დატვირთულ საათებში შეიძლება ცოტა მეტი დასჭირდეს — შეფერხების შემთხვევაში დაგირეკავთ.`,
    },
    {
      q: "როგორ ხდება გადახდა?",
      a: "გადახდა ხდება ნაღდი ფულით ან ბარათით — აღებისას ან მიტანისას, თქვენთვის მოსახერხებელი ვარიანტით.",
    },
    {
      q: "სად მიგაქვთ შეკვეთები?",
      a: "ჩვენ ვმიტანთ მუხრანსა და მიმდებარე სოფლებში (ქსოვრისი, ძალისი, ვაზიანი, ვარდისუბანი, ილტოზა, ოძისი). შეკვეთის გაფორმებისას მონიშნეთ თქვენი მდებარეობა და დავადასტურებთ მიტანის საფასურს შეკვეთამდე.",
    },
    {
      q: "შემიძლია ინგრედიენტების მოხსნა?",
      a: "დიახ — შეეხეთ ნებისმიერ კერძს და აირჩიეთ ინგრედიენტები, რომლებიც არ გსურთ. სამზარეულო ხედავს თქვენს არჩევანს შეკვეთის ტიკეტზე.",
    },
    {
      q: "როგორ გავიგებ, რომ შეკვეთა მზადაა?",
      a: "შეინახეთ თქვენი შეკვეთის ნომერი (შეგიძლიათ დააკოპიროთ ან დაბეჭდოთ შეკვეთის შემდეგ). ცვლილების შემთხვევაში დაგირეკავთ თქვენს მიერ მითითებულ ნომერზე.",
    },
  ];
}

/** Expandable FAQ accordion shown under the menu. One item open at a time. */
export function FaqSection({ prepMinutes = 20 }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqItems = buildFaqItems(prepMinutes);

  return (
    <section style={{ padding: "0 20px", maxWidth: 640, margin: "0 auto" }} aria-label="ხშირად დასმული კითხვები">
      <h2 style={{ fontSize: 21, marginBottom: 14 }}>სასარგებლო ინფორმაცია</h2>
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
                  <Plus size={17} />
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
