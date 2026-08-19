export function BoardSkeleton() {
  return (
    <div style={{ padding: "20px 24px" }} aria-busy="true" aria-label="Loading orders">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {[0, 1, 2, 3].map((col) => (
          <div key={col}>
            <div className="skeleton" style={{ width: 90, height: 18, marginBottom: 14 }} />
            {[0, 1].map((card) => (
              <div
                key={card}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  marginBottom: 12,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="skeleton" style={{ width: "50%", height: 20, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: "90%", height: 12, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "80%", height: 12 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
