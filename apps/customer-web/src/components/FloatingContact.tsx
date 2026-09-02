import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Phone, MessageCircle, X } from "lucide-react";

// TODO: replace with the cafe's real phone number before launch.
const CONTACT_PHONE_DISPLAY = "+995 568 00 40 40";
const CONTACT_PHONE_TEL = "+995568004040";
const WHATSAPP_NUMBER = "995568004040"; // same digits, no "+" — used by wa.me

interface FloatingContactProps {
  liftedForCartBar?: boolean;
}

/** Floating contact bubble: expands to call / WhatsApp options. */
export function FloatingContact({ liftedForCartBar = false }: FloatingContactProps) {
  const [open, setOpen] = useState(false);
  const bottomOffset = liftedForCartBar ? 86 : 16;

  return (
    <motion.div
      data-print-hide
      animate={{ bottom: bottomOffset }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      style={{ position: "fixed", right: 16, zIndex: 33 }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "absolute",
              bottom: 52,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="pressable"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                borderRadius: "999px",
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "var(--shadow-card)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Phone size={14} /> {CONTACT_PHONE_DISPLAY}</span>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="pressable"
              style={{
                background: "var(--color-ready)",
                color: "#fff",
                borderRadius: "999px",
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "var(--shadow-card)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MessageCircle size={14} /> WhatsApp us</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "კონტაქტის ვარიანტების დახურვა" : "დაგვიკავშირდით"}
        className="pressable"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "var(--color-yellow)",
          color: "var(--color-ink)",
          fontSize: 20,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(33, 28, 18, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </motion.div>
  );
}
