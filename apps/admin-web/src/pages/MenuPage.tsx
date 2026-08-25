import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  getAdminMenu,
  createCategory,
  createMenuItem,
  updateMenuItem,
  uploadMenuImage,
  type AdminMenuCategory,
  type AdminMenuItem,
} from "../lib/api";
import { formatPrice } from "../lib/format";

export function MenuPage() {
  const [categories, setCategories] = useState<AdminMenuCategory[] | null>(null);
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [isAddingCategory, setAddingCategory] = useState(false);
  const [addingItemToCategory, setAddingItemToCategory] = useState<string | null>(null);

  async function refresh() {
    const res = await getAdminMenu();
    setCategories(res.categories);
    setItems(res.items);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddCategory(name: string) {
    await createCategory({ name });
    setAddingCategory(false);
    await refresh();
  }

  async function handleAddItem(
    categoryId: string,
    data: { name: string; priceMinor: number; description?: string; imageUrl?: string }
  ) {
    await createMenuItem({ categoryId, ...data });
    setAddingItemToCategory(null);
    await refresh();
  }

  async function handleToggleAvailable(item: AdminMenuItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)));
    await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  }

  async function handleArchive(item: AdminMenuItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await updateMenuItem(item.id, { isArchived: true });
  }

  if (!categories) {
    return (
      <div style={{ padding: "20px 24px" }}>
        <div className="skeleton" style={{ width: 160, height: 24, marginBottom: 20 }} />
        {[0, 1].map((i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 120, height: 18, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: "100%", height: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "100%", height: 60 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20 }}>Menu</h2>
        {!isAddingCategory && (
          <button onClick={() => setAddingCategory(true)} style={secondaryButtonStyle}>
            + Add category
          </button>
        )}
      </div>

      {isAddingCategory && (
        <QuickAddCategory onSubmit={handleAddCategory} onCancel={() => setAddingCategory(false)} />
      )}

      {categories.length === 0 && !isAddingCategory && (
        <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
          No categories yet. Add your first category to start building the menu.
        </p>
      )}

      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.categoryId === category.id && !i.isArchived);
        return (
          <section key={category.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 16, fontFamily: "var(--font-display)" }}>{category.name}</h3>
              {addingItemToCategory !== category.id && (
                <button
                  onClick={() => setAddingItemToCategory(category.id)}
                  style={{ ...secondaryButtonStyle, padding: "6px 12px", fontSize: 12.5 }}
                >
                  + Add item
                </button>
              )}
            </div>

            {addingItemToCategory === category.id && (
              <QuickAddItem
                onSubmit={(data) => handleAddItem(category.id, data)}
                onCancel={() => setAddingItemToCategory(null)}
              />
            )}

            {categoryItems.length === 0 ? (
              <p style={{ color: "var(--color-ink-soft)", fontSize: 13, padding: "4px 0" }}>No items yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 4px",
                      borderBottom: "1px solid var(--color-line)",
                      opacity: item.isAvailable ? 1 : 0.55,
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--color-yellow-tint)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{item.name}</div>
                      {item.description && (
                        <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", marginTop: 2 }}>
                          {item.description}
                        </div>
                      )}
                      {item.ingredients.length > 0 && (
                        <div style={{ fontSize: 11.5, color: "var(--color-yellow-deep)", marginTop: 3 }}>
                          {item.ingredients.join(" · ")}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                      {formatPrice(item.priceMinor, "GEL")}
                    </div>
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      style={{
                        ...secondaryButtonStyle,
                        padding: "6px 12px",
                        fontSize: 12,
                        flexShrink: 0,
                        background: item.isAvailable ? "var(--color-yellow-tint)" : "var(--color-line)",
                      }}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                    <button
                      onClick={() => handleArchive(item)}
                      aria-label={`Remove ${item.name}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--color-ink-soft)",
                        cursor: "pointer",
                        fontSize: 13,
                        flexShrink: 0,
                        padding: "6px 4px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function QuickAddCategory({ onSubmit, onCancel }: { onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        background: "var(--color-yellow-tint)",
        padding: 12,
        borderRadius: "var(--radius-md)",
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name (e.g. Coffee)"
        style={{ ...inputStyle, flex: 1 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={() => name.trim() && onSubmit(name.trim())}
        disabled={!name.trim()}
        style={primaryButtonStyle}
      >
        Add
      </button>
      <button onClick={onCancel} style={secondaryButtonStyle}>
        Cancel
      </button>
    </motion.div>
  );
}

function QuickAddItem({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    name: string;
    priceMinor: number;
    description?: string;
    ingredients?: string[];
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const priceMinor = Math.round(parseFloat(price || "0") * 100);
  const canSubmit = name.trim().length > 0 && priceMinor > 0 && !isUploading;

  function addIngredient() {
    const value = ingredientInput.trim();
    if (!value) return;
    setIngredients((prev) =>
      prev.some((i) => i.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]
    );
    setIngredientInput("");
  }

  function removeIngredient(value: string) {
    setIngredients((prev) => prev.filter((i) => i !== value));
  }

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      priceMinor,
      description: description.trim() || undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      imageUrl: imageUrl ?? undefined,
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadMenuImage(file);
      setImageUrl(result.imageUrl);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{
        background: "var(--color-yellow-tint)",
        padding: 12,
        borderRadius: "var(--radius-md)",
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <ImageUploadSlot imageUrl={imageUrl} isUploading={isUploading} onFileSelect={handleFileSelect} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              style={{ ...inputStyle, flex: 2 }}
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (GEL)"
              type="number"
              step="0.01"
              min="0"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              placeholder="Add an ingredient (e.g. tomato)"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addIngredient();
                }
                if (e.key === "Escape") onCancel();
              }}
            />
            <button onClick={addIngredient} disabled={!ingredientInput.trim()} style={secondaryButtonStyle}>
              + Add ingredient
            </button>
          </div>
          {ingredients.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ingredients.map((ing) => (
                <span
                  key={ing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12.5,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-yellow-deep)",
                    color: "var(--color-ink)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {ing}
                  <button
                    onClick={() => removeIngredient(ing)}
                    aria-label={`Remove ${ing}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--color-cancelled)",
                      cursor: "pointer",
                      fontSize: 13,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div style={{ color: "var(--color-cancelled)", fontSize: 12.5 }}>{uploadError}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} disabled={!canSubmit} style={primaryButtonStyle}>
          Add item
        </button>
        <button onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

function ImageUploadSlot({
  imageUrl,
  isUploading,
  onFileSelect,
}: {
  imageUrl: string | null;
  isUploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      style={{
        width: 64,
        height: 64,
        borderRadius: "var(--radius-md)",
        border: "1.5px dashed var(--color-yellow-deep)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: isUploading ? "wait" : "pointer",
        overflow: "hidden",
        background: imageUrl ? "transparent" : "var(--color-surface)",
        position: "relative",
      }}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileSelect}
        disabled={isUploading}
        style={{ display: "none" }}
      />
      {isUploading ? (
        <span style={{ fontSize: 10, color: "var(--color-ink-soft)" }}>...</span>
      ) : imageUrl ? (
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: 20, color: "var(--color-yellow-deep)" }}>+</span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--color-line)",
  fontSize: 13.5,
  background: "var(--color-surface)",
  color: "var(--color-ink)",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  background: "var(--color-yellow)",
  color: "var(--color-ink)",
  borderRadius: "var(--radius-sm)",
  padding: "9px 16px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1.5px solid var(--color-line)",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  borderRadius: "var(--radius-sm)",
  padding: "9px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
