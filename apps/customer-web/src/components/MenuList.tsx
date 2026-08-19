import { motion } from "motion/react";
import type { MenuCategory, MenuItem } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";

interface MenuListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  currencyCode: string;
  quantitiesByItemId: Map<string, number>;
  onAdd: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export function MenuList({ categories, items, currencyCode, quantitiesByItemId, onAdd, onDecrement }: MenuListProps) {
  const itemsByCategory = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listVariants}
      style={{ display: "flex", flexDirection: "column", gap: 32 }}
    >
      {categories.map((category) => {
        const categoryItems = itemsByCategory.get(category.id) ?? [];
        if (categoryItems.length === 0) return null;

        return (
          <section key={category.id} id={`category-${category.id}`}>
            <h2 style={{ fontSize: 22, marginBottom: 12, color: "var(--color-ink)" }}>{category.name}</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {categoryItems.map((item) => {
                const qty = quantitiesByItemId.get(item.id) ?? 0;
                return (
                  <motion.div
                    key={item.id}
                    variants={rowVariants}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 4px",
                      borderBottom: "1px solid var(--color-line)",
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: "var(--radius-md)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15.5 }}>{item.name}</div>
                      {item.description && (
                        <div
                          style={{
                            color: "var(--color-ink-soft)",
                            fontSize: 13.5,
                            marginTop: 3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                      <div style={{ fontSize: 14, marginTop: 4, color: "var(--color-yellow-deep)", fontWeight: 600 }}>
                        {formatPrice(item.priceMinor, currencyCode)}
                      </div>
                    </div>

                    {qty === 0 ? (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onAdd(item.id)}
                        style={{
                          flexShrink: 0,
                          background: "var(--color-yellow)",
                          color: "var(--color-ink)",
                          border: "none",
                          borderRadius: "var(--radius-sm)",
                          padding: "9px 18px",
                          fontWeight: 600,
                          fontSize: 13.5,
                          cursor: "pointer",
                        }}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        Add
                      </motion.button>
                    ) : (
                      <div
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "var(--color-yellow-tint)",
                          borderRadius: "var(--radius-sm)",
                          padding: "4px 6px",
                        }}
                      >
                        <StepperButton label={`Remove one ${item.name}`} onClick={() => onDecrement(item.id)}>
                          −
                        </StepperButton>
                        <span style={{ fontWeight: 600, minWidth: 14, textAlign: "center" }}>{qty}</span>
                        <StepperButton label={`Add one more ${item.name}`} onClick={() => onAdd(item.id)}>
                          +
                        </StepperButton>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </motion.div>
  );
}

function StepperButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      aria-label={label}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "var(--color-surface)",
        color: "var(--color-ink)",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {children}
    </motion.button>
  );
}
