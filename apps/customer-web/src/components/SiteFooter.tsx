interface SiteFooterProps {
  menuUpdatedAt: Date | null;
}

// Kept in sync with FloatingContact.tsx's placeholder number.
const CONTACT_PHONE_DISPLAY = "+995 555 12 34 56";
const CONTACT_PHONE_TEL = "+995555123456";
const WHATSAPP_NUMBER = "995555123456";

export function SiteFooter({ menuUpdatedAt }: SiteFooterProps) {
  return (
    <footer
      data-print-hide
      style={{
        borderTop: "1px solid var(--color-line)",
        marginTop: 40,
        padding: "28px 20px 24px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px 32px",
            marginBottom: 20,
          }}
        >
          <FooterColumn title="Contact">
            <FooterLink href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE_DISPLAY}</FooterLink>
            <FooterLink href={`https://wa.me/${WHATSAPP_NUMBER}`} external>
              WhatsApp
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="We deliver to">
            <span style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
              Mukhrani, Ksovrisi, Dzalisi, Iltoza, Odzisi
            </span>
          </FooterColumn>

          <FooterColumn title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-line)",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 12,
            color: "var(--color-ink-soft)",
          }}
        >
          <span>© {new Date().getFullYear()} Cafe Lile, Mukhrani</span>
          {menuUpdatedAt && (
            <span>
              Menu updated {menuUpdatedAt.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--color-ink-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      style={{
        fontSize: 13,
        color: "var(--color-ink)",
        textDecoration: "none",
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  );
}
