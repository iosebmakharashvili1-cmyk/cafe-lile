import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { animate, stagger } from "animejs";
import type { MenuCategory } from "@cafe-lile/contracts";

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategoryNav({ categories, activeCategoryId, onSelect }: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || categories.length === 0 || !containerRef.current) return;
    hasAnimated.current = true;
    const chips = containerRef.current.querySelectorAll<HTMLElement>("[data-chip]");
    animate(chips, {
      opacity: [0, 1],
      translateX: [12, 0],
      duration: 400,
      delay: stagger(45),
      ease: "outQuad",
    });
  }, [categories.length]);

  if (categories.length === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-line)",
        padding: "12px 0",
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "0 20px",
          scrollbarWidth: "none",
        }}
      >
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <motion.button
              key={category.id}
              data-chip
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(category.id)}
              style={{
                flexShrink: 0,
                border: "none",
                borderRadius: "999px",
                padding: "9px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                background: isActive ? "var(--color-yellow)" : "var(--color-yellow-tint)",
                color: "var(--color-ink)",
                opacity: 0,
                whiteSpace: "nowrap",
              }}
            >
              {category.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
