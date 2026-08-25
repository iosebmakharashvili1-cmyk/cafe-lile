import { forwardRef } from "react";
import { motion } from "motion/react";
import type { MenuCategory, MenuItem } from "@cafe-lile/contracts";
import { formatPrice } from "../lib/format";

interface MenuListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  currencyCode: string;
  quantitiesByItemId: Map<string, number>;
  onItemTap: (item: MenuItem) => void;
  categoryRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export function MenuList({ categories, items, currencyCode, quantitiesByItemId, onItemTap, categoryRefs }: MenuListProps) {
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
      style={{ display: "flex", flexDirection: "column", gap: 36 }}
    >
      {categories.map((category) => {
        const categoryItems = itemsByCategory.get(category.id) ?? [];
        if (categoryItems.length === 0) return null;

        return (
          <section
            key={category.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(category.id, el);
            }}
            style={{ scrollMarginTop: 64 }}
          >
            <h2 style={{ fontSize: 21, marginBottom: 14, padding: "0 20px" }}>{category.name}</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {categoryItems.map((item) => {
                const qty = quantitiesByItemId.get(item.id) ?? 0;
                return (
                  <motion.button
                    key={item.id}
                    variants={rowVariants}
                    onClick={() => onItemTap(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--color-line)",
                      border: "none",
                      borderBottomWidth: 1,
                      borderBottomStyle: "solid",
                      borderBottomColor: "var(--color-line)",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                      {item.description && (
                        <div
                          style={{
                            color: "var(--color-ink-soft)",
                            fontSize: 13,
                            marginTop: 3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                      <div style={{ fontSize: 14, marginTop: 6, color: "var(--color-yellow-deep)", fontWeight: 600 }}>
                        {formatPrice(item.priceMinor, currencyCode)}
                      </div>
                    </div>

                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          style={{
                            width: 84,
                            height: 84,
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-yellow-tint)",
                          }}
                        />
                      )}
                      {qty > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -6,
                            right: -6,
                            background: "var(--color-yellow)",
                            color: "var(--color-ink)",
                            borderRadius: "50%",
                            width: 26,
                            height: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            border: "2px solid var(--color-bg)",
                          }}
                        >
                          {qty}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        );
      })}
    </motion.div>
  );
}
