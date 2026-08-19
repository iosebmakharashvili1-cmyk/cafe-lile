export function MenuSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }} aria-busy="true" aria-label="Loading menu">
      {[0, 1].map((section) => (
        <section key={section} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="skeleton" style={{ width: 140, height: 22 }} />
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 4px",
                borderBottom: "1px solid var(--color-line)",
              }}
            >
              <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "var(--radius-md)", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ width: "45%", height: 16 }} />
                <div className="skeleton" style={{ width: "70%", height: 12 }} />
              </div>
              <div className="skeleton" style={{ width: 48, height: 16, flexShrink: 0 }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
