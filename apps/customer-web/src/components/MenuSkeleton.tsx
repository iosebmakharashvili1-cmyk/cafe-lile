export function MenuSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }} aria-busy="true" aria-label="მენიუს ჩატვირთვა">
      <div style={{ padding: "0 20px" }}>
        <div className="skeleton" style={{ width: "100%", height: 160, borderRadius: "var(--radius-md)" }} />
      </div>
      {[0, 1].map((section) => (
        <section key={section}>
          <div className="skeleton" style={{ width: 140, height: 20, margin: "0 20px 14px" }} />
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                borderBottom: "1px solid var(--color-line)",
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ width: "55%", height: 16 }} />
                <div className="skeleton" style={{ width: "80%", height: 12 }} />
                <div className="skeleton" style={{ width: "30%", height: 14 }} />
              </div>
              <div className="skeleton" style={{ width: 84, height: 84, borderRadius: "var(--radius-md)", flexShrink: 0 }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
