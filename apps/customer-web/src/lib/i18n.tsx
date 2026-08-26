import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "ka" | "en";

const STORAGE_KEY = "cl_lang";

// Georgian is the default: first-time visitors see the site in ka.
function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ka" || saved === "en") return saved;
  } catch {
    // Storage unavailable (private mode) â€” fall through to the default.
  }
  return "ka";
}

// Template-valued entries (functions) live alongside plain strings; the `t`
// helper types them by key, so we expose both shapes: strings via t(), and
// template helpers as exported functions below.

const enStrings = {
  // Hero / shell
  hero_open: "Open for orders",
  hero_closed: "Not accepting orders right now",

  // Cart
  cart_title: "Your order",
  cart_empty: "Your cart is empty. Add something from the menu to get started.",
  cart_each: "each",
  cart_without: "without",
  cart_estimated_total: "Estimated total",
  cart_checkout: "Checkout",
  cart_view_cart: "View cart",

  // Checkout
  checkout_back: "â† Back to menu",
  checkout_title: "Checkout",
  checkout_pickup: "Pickup",
  checkout_delivery: "Delivery",
  field_your_name: "Your name",
  field_name_placeholder: "Full name",
  error_name_required: "Please tell us your name.",
  field_phone: "Phone number",
  field_phone_placeholder: "Required â€” for order updates",
  error_phone_required: "Enter a phone number we can reach you on.",
  field_address: "Delivery address",
  field_address_placeholder: "Street, building, apartment",
  field_pin_location: "Pin your location",
  field_note_optional: "Note (optional)",
  field_note_placeholder: "Anything the kitchen should know",
  summary_subtotal: "Subtotal",
  summary_total: "Total",
  payment_label: "Payment method",
  payment_cash: "Cash",
  payment_card: "Card on delivery",
  submit_place_order: "Place order",
  item_ingredients: "Ingredients",
  item_excluded_prefix: "No",
  item_add_to_cart: "Add to cart",

  // FAQ
  faq_heading: "Good to know",

  // Footer
  footer_contact: "Contact",
  footer_deliver_to: "We deliver to",
  footer_legal: "Legal",
  footer_privacy: "Privacy",
  footer_terms: "Terms",

  // Misc floating UI
  cookie_text: "We use cookies to remember your cart and preferences.",
  cookie_ok: "OK",
  top_label: "top",

  // Theme + language toggles
  theme_switch_light: "Switch to light mode",
  theme_switch_dark: "Switch to dark mode",
  lang_toggle_title: "Switch language / áƒ”áƒœáƒ˜áƒ¡ áƒ¨áƒ”áƒªáƒ•áƒšáƒ",
  lang_toggle_label: "áƒ¥áƒáƒ  / EN",

  // Errors & page titles
  load_error: "Couldn't load the menu. Check your connection and try again.",
  reload: "Reload",
  generic_error: "Something went wrong. Please try again.",
};

const enTemplates = {
  zone_delivering: (zone: string, fee: string) => `Delivering to ${zone} â€” ${fee}`,
  zone_outside: (fee: string) => `Outside our usual villages â€” ${fee} (we'll confirm by phone)`,
  summary_delivery_fee: (zone?: string) => (zone ? `Delivery fee (${zone})` : "Delivery fee"),
  payment_cash_hint: () => "Pay cash when you receive your order.",
  payment_card_hint_delivery: () => "The courier brings a BOG/TBC card terminal â€” tap, insert or swipe on arrival.",
  payment_card_hint_pickup: () => "Pay by card at the counter â€” BOG/TBC terminal available.",
  payment_due_cash: () => "Payment is cash, due at handover.",
  payment_due_card: () => "You'll pay by card on the BOG/TBC terminal at handover.",
  submit_placing: () => "Placing orderâ€¦",
  map_adjust_pin: () => "Tap the map to adjust the pin",
  map_drop_pin: () => "Tap the map to drop a pin at your delivery location",
  map_locating: () => "Locatingâ€¦",
  map_use_my_location: () => "Use my location",
  map_street_view: () => "Street view",
  map_satellite_view: () => "Satellite view",
  confirm_pickup_body: () => "We'll have it ready for pickup.",
  confirm_delivery_body: () => "We're preparing it for delivery.",
  confirm_reference_label: () => "Order reference",
  confirm_copy_reference: () => "Copy reference",
  confirm_cash_on_pickup: () => "Total (cash on pickup)",
  confirm_cash_on_delivery: () => "Total (cash on delivery)",
  confirm_print_receipt: () => "ðŸ–¨ Print receipt",
  confirm_order_again: () => "Order again",
  faq_q_time: () => "How long does an order take?",
  faq_a_time: (minutes: number) =>
    `Most orders are ready in about ${minutes} minutes. During busy hours it can take a little longer â€” we'll call you if there's a delay.`,
  faq_q_payment: () => "How do I pay?",
  faq_a_payment: () =>
    "Pay in cash, or by card on our BOG/TBC terminal â€” either when you pick up your order or when we deliver it to you.",
  faq_q_delivery_area: () => "Where do you deliver?",
  faq_a_delivery_area: () =>
    "We deliver around Mukhrani and the nearby villages (Ksovrisi, Dzalisi, Vaziani, Vardisubani, Iltoza, Odzisi). Pin your location at checkout and we'll confirm the delivery fee before you order.",
  faq_q_ingredients: () => "Can I remove ingredients?",
  faq_a_ingredients: () =>
    "Yes â€” tap any dish, then tap the ingredients you'd like left out. The kitchen sees your choices on the ticket.",
  faq_q_ready_how: () => "How will I know my order is ready?",
  faq_a_ready_how: () =>
    "Keep your order reference (you can copy or print it after ordering). If anything changes we'll call the phone number you gave us.",
  footer_menu_updated: (date: string) => `Menu updated ${date}`,
  item_exclude_hint: () => "Tap any ingredient you don't want in your food",
  item_remove_one: () => "Remove one",
  item_add_one_more: () => "Add one more",
  contact_whatsapp: () => "WhatsApp us",
  back_to_top: () => "Back to top",
  title_menu: () => "Cafe Lile â€” Order pickup or delivery in Mukhrani",
  title_checkout: () => "Checkout â€” Cafe Lile",
  title_confirmation: () => "Order placed â€” Cafe Lile",
};

const en = { ...enStrings, ...enTemplates };

const kaStrings: typeof enStrings = {
  // Hero / shell
  hero_open: "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ”áƒ‘áƒ¡ áƒ•áƒ¦áƒ”áƒ‘áƒ£áƒšáƒáƒ‘áƒ—",
  hero_closed: "áƒáƒ›áƒŸáƒáƒ›áƒáƒ“ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ”áƒ‘áƒ¡ áƒáƒ  áƒ•áƒ¦áƒ”áƒ‘áƒ£áƒšáƒáƒ‘áƒ—",

  // Cart
  cart_title: "áƒ—áƒ¥áƒ•áƒ”áƒœáƒ˜ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ",
  cart_empty: "áƒ™áƒáƒšáƒáƒ—áƒ áƒªáƒáƒ áƒ˜áƒ”áƒšáƒ˜áƒ. áƒ“áƒáƒáƒ›áƒáƒ¢áƒ”áƒ— áƒ áƒáƒ˜áƒ›áƒ” áƒ›áƒ”áƒœáƒ˜áƒ£áƒ“áƒáƒœ.",
  cart_each: "áƒ—áƒ˜áƒ—áƒ",
  cart_without: "-áƒ˜áƒ¡ áƒ’áƒáƒ áƒ”áƒ¨áƒ”",
  cart_estimated_total: "áƒ¡áƒáƒ•áƒáƒ áƒáƒ£áƒ“áƒ áƒ¯áƒáƒ›áƒ˜",
  cart_checkout: "áƒ’áƒáƒ’áƒ áƒ«áƒ”áƒšáƒ”áƒ‘áƒ",
  cart_view_cart: "áƒ™áƒáƒšáƒáƒ—áƒ˜áƒ¡ áƒœáƒáƒ®áƒ•áƒ",

  // Checkout
  checkout_back: "â† áƒ›áƒ”áƒœáƒ˜áƒ£áƒ–áƒ” áƒ“áƒáƒ‘áƒ áƒ£áƒœáƒ”áƒ‘áƒ",
  checkout_title: "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ",
  checkout_pickup: "áƒ’áƒáƒ¢áƒáƒœáƒ",
  checkout_delivery: "áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ",
  field_your_name: "áƒ—áƒ¥áƒ•áƒ”áƒœáƒ˜ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜",
  field_name_placeholder: "áƒ¡áƒ áƒ£áƒšáƒ˜ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜",
  error_name_required: "áƒ’áƒ—áƒ®áƒáƒ•áƒ—, áƒ›áƒ˜áƒ£áƒ—áƒ˜áƒ—áƒ”áƒ— áƒ—áƒ¥áƒ•áƒ”áƒœáƒ˜ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜.",
  field_phone: "áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜",
  field_phone_placeholder: "áƒáƒ£áƒªáƒ˜áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ â€” áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ¡áƒ¢áƒáƒ¢áƒ£áƒ¡áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡",
  error_phone_required: "áƒ¨áƒ”áƒ˜áƒ§áƒ•áƒáƒœáƒ”áƒ— áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜, áƒ áƒáƒ›áƒ”áƒšáƒ–áƒ”áƒª áƒ“áƒáƒ’áƒ˜áƒ™áƒáƒ•áƒ¨áƒ˜áƒ áƒ“áƒ”áƒ‘áƒ˜áƒ—.",
  field_address: "áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡ áƒ›áƒ˜áƒ¡áƒáƒ›áƒáƒ áƒ—áƒ˜",
  field_address_placeholder: "áƒ¥áƒ£áƒ©áƒ, áƒ¨áƒ”áƒœáƒáƒ‘áƒ, áƒ‘áƒ˜áƒœáƒ",
  field_pin_location: "áƒ›áƒáƒ˜áƒœáƒ˜áƒ¨áƒœáƒ”áƒ— áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ",
  field_note_optional: "áƒ¨áƒ”áƒœáƒ˜áƒ¨áƒ•áƒœáƒ (áƒáƒ áƒáƒ¡áƒáƒ•áƒáƒšáƒ“áƒ”áƒ‘áƒ£áƒšáƒ)",
  field_note_placeholder: "áƒ áƒáƒ›áƒ”, áƒ áƒáƒª áƒ¡áƒáƒ›áƒ–áƒáƒ áƒ”áƒ£áƒšáƒáƒ› áƒ£áƒœáƒ“áƒ áƒ˜áƒªáƒáƒ“áƒ”áƒ¡",
  summary_subtotal: "áƒ¯áƒáƒ›áƒ˜",
  summary_total: "áƒ¡áƒ£áƒš",
  payment_label: "áƒ’áƒáƒ“áƒáƒ®áƒ“áƒ˜áƒ¡ áƒ›áƒ”áƒ—áƒáƒ“áƒ˜",
  payment_cash: "áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜",
  payment_card: "áƒ‘áƒáƒ áƒáƒ—áƒ˜áƒ— áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡",
  submit_place_order: "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ’áƒáƒœáƒ—áƒáƒ•áƒ¡áƒ”áƒ‘áƒ",
  item_ingredients: "áƒ˜áƒœáƒ’áƒ áƒ”áƒ“áƒ˜áƒ”áƒœáƒ¢áƒ”áƒ‘áƒ˜",
  item_excluded_prefix: "without",
  item_add_to_cart: "áƒ™áƒáƒšáƒáƒ—áƒáƒ¨áƒ˜ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ",

  // FAQ
  faq_heading: "áƒ¡áƒáƒ¡áƒáƒ áƒ’áƒ”áƒ‘áƒšáƒáƒ áƒ¡áƒáƒ—áƒ¥áƒ›áƒ”áƒšáƒ˜",

  // Footer
  footer_contact: "áƒ™áƒáƒœáƒ¢áƒáƒ¥áƒ¢áƒ˜",
  footer_deliver_to: "áƒ•áƒáƒ¬áƒ•áƒ“áƒ˜áƒ—",
  footer_legal: "áƒ˜áƒ£áƒ áƒ˜áƒ“áƒ˜áƒ£áƒšáƒ˜",
  footer_privacy: "áƒ™áƒáƒœáƒ¤áƒ˜áƒ“áƒ”áƒœáƒªáƒ˜áƒáƒšáƒ£áƒ áƒáƒ‘áƒ",
  footer_terms: "áƒ¬áƒ”áƒ¡áƒ”áƒ‘áƒ˜ áƒ“áƒ áƒžáƒ˜áƒ áƒáƒ‘áƒ”áƒ‘áƒ˜",

  // Misc floating UI
  cookie_text: "áƒ•áƒ˜áƒ§áƒ”áƒœáƒ”áƒ‘áƒ— cookies-áƒ¡ áƒ™áƒáƒšáƒáƒ—áƒ˜áƒ¡áƒ áƒ“áƒ áƒžáƒáƒ áƒáƒ›áƒ”áƒ¢áƒ áƒ”áƒ‘áƒ˜áƒ¡ áƒ“áƒáƒ¡áƒáƒ›áƒáƒ®áƒ¡áƒáƒ•áƒ áƒ”áƒ‘áƒšáƒáƒ“.",
  cookie_ok: "áƒ™áƒáƒ áƒ’áƒ˜",
  top_label: "áƒ–áƒ”áƒ›áƒáƒ—",

  // Theme + language toggles
  theme_switch_light: "áƒœáƒáƒ—áƒ”áƒš áƒ áƒ”áƒŸáƒ˜áƒ›áƒ–áƒ” áƒ’áƒáƒ“áƒáƒ áƒ—áƒ•áƒ",
  theme_switch_dark: "áƒ‘áƒœáƒ”áƒš áƒ áƒ”áƒŸáƒ˜áƒ›áƒ–áƒ” áƒ’áƒáƒ“áƒáƒ áƒ—áƒ•áƒ",
  lang_toggle_title: "Switch language / áƒ”áƒœáƒ˜áƒ¡ áƒ¨áƒ”áƒªáƒ•áƒšáƒ",
  lang_toggle_label: "EN / áƒ¥áƒáƒ ",

  // Errors & page titles
  load_error: "áƒ›áƒ”áƒœáƒ˜áƒ£ áƒ•áƒ”áƒ  áƒ©áƒáƒ˜áƒ¢áƒ•áƒ˜áƒ áƒ—áƒ. áƒ¨áƒ”áƒáƒ›áƒáƒ¬áƒ›áƒ”áƒ— áƒ˜áƒœáƒ¢áƒ”áƒ áƒœáƒ”áƒ¢áƒ˜ áƒ“áƒ áƒ¡áƒªáƒáƒ“áƒ”áƒ— áƒ®áƒ”áƒšáƒáƒ®áƒšáƒ.",
  reload: "áƒ®áƒ”áƒšáƒáƒ®áƒšáƒ áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ",
  generic_error: "áƒ áƒáƒ¦áƒáƒª áƒ¨áƒ”áƒªáƒ“áƒáƒ›áƒáƒ. áƒ’áƒ—áƒ®áƒáƒ•áƒ—, áƒ¡áƒªáƒáƒ“áƒáƒ— áƒ®áƒ”áƒšáƒáƒ®áƒšáƒ.",
};

const kaTemplates: typeof enTemplates = {
  zone_delivering: (zone: string, fee: string) => `áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ: ${zone} â€” ${fee}`,
  zone_outside: (fee: string) => `áƒ©áƒ•áƒ”áƒ£áƒšáƒ”áƒ‘áƒ áƒ˜áƒ•áƒ˜ áƒ¡áƒáƒ¤áƒšáƒ”áƒ‘áƒ˜áƒ¡ áƒ¤áƒáƒ áƒ’áƒšáƒ”áƒ‘áƒ¡ áƒ’áƒáƒ áƒ”áƒ— â€” ${fee} (áƒ“áƒáƒ•áƒáƒ“áƒáƒ¡áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ— áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ—)`,
  summary_delivery_fee: (zone?: string) => (zone ? `áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡ áƒ¡áƒáƒ¤áƒáƒ¡áƒ£áƒ áƒ˜ (${zone})` : "áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡ áƒ¡áƒáƒ¤áƒáƒ¡áƒ£áƒ áƒ˜"),
  payment_cash_hint: () => "áƒ’áƒáƒ“áƒáƒ˜áƒ®áƒáƒ“áƒ”áƒ— áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜áƒ— áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ©áƒáƒ‘áƒáƒ áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡.",
  payment_card_hint_delivery: () => "áƒ™áƒ£áƒ áƒ˜áƒ”áƒ áƒ—áƒáƒœ áƒáƒ áƒ˜áƒ¡ BOG/TBC-áƒ˜áƒ¡ áƒ¢áƒ”áƒ áƒ›áƒ˜áƒœáƒáƒšáƒ˜ â€” áƒ›áƒ˜áƒ˜áƒ¢áƒáƒœáƒ”áƒ—, áƒ©áƒáƒ“áƒ”áƒ— áƒáƒœ áƒ’áƒáƒáƒ¢áƒáƒ áƒ”áƒ— áƒ‘áƒáƒ áƒáƒ—áƒ˜.",
  payment_card_hint_pickup: () => "áƒ’áƒáƒ“áƒáƒ˜áƒ®áƒáƒ“áƒ”áƒ— áƒ‘áƒáƒ áƒáƒ—áƒ˜áƒ— áƒ›áƒáƒªáƒ®áƒáƒ•áƒ áƒ”áƒ‘áƒ”áƒšáƒ—áƒáƒœ â€” BOG/TBC-áƒ˜áƒ¡ áƒ¢áƒ”áƒ áƒ›áƒ˜áƒœáƒáƒšáƒ˜ áƒ›áƒ–áƒáƒ“áƒáƒ.",
  payment_due_cash: () => "áƒ’áƒáƒ“áƒáƒ®áƒ“áƒ áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜áƒ—, áƒ©áƒáƒ‘áƒáƒ áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡.",
  payment_due_card: () => "áƒ’áƒáƒ“áƒáƒ˜áƒ®áƒ“áƒ˜áƒ— áƒ‘áƒáƒ áƒáƒ—áƒ˜áƒ— BOG/TBC-áƒ˜áƒ¡ áƒ¢áƒ”áƒ áƒ›áƒ˜áƒœáƒáƒšáƒ–áƒ” áƒ©áƒáƒ‘áƒáƒ áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡.",
  submit_placing: () => "áƒ˜áƒ’áƒ–áƒáƒ•áƒœáƒ”áƒ‘áƒâ€¦",
  map_adjust_pin: () => "áƒ¨áƒ”áƒ”áƒ®áƒ”áƒ— áƒ áƒ£áƒ™áƒáƒ¡ áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ˜áƒ¡ áƒ¨áƒ”áƒ¡áƒáƒ¡áƒ¬áƒáƒ áƒ”áƒ‘áƒšáƒáƒ“",
  map_drop_pin: () => "áƒ¨áƒ”áƒ”áƒ®áƒ”áƒ— áƒ áƒ£áƒ™áƒáƒ¡ áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡ áƒáƒ“áƒ’áƒ˜áƒšáƒ˜áƒ¡ áƒ›áƒáƒ¡áƒáƒœáƒ˜áƒ¨áƒœáƒáƒ“",
  map_locating: () => "áƒ•áƒ”áƒ«áƒ”áƒ‘â€¦",
  map_use_my_location: () => "áƒ©áƒ”áƒ›áƒ˜ áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ",
  map_street_view: () => "áƒ¥áƒ£áƒ©áƒ˜áƒ¡ áƒ®áƒ”áƒ“áƒ˜",
  map_satellite_view: () => "áƒ¡áƒáƒ¢áƒ”áƒšáƒ˜áƒ¢áƒ£áƒ áƒ˜ áƒ®áƒ”áƒ“áƒ˜",
  confirm_pickup_body: () => "áƒ›áƒ–áƒáƒ“ áƒ˜áƒ¥áƒœáƒ”áƒ‘áƒ áƒ’áƒáƒ¡áƒáƒ¢áƒáƒœáƒáƒ“.",
  confirm_delivery_body: () => "áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡ áƒ•áƒáƒ›áƒ–áƒáƒ“áƒ”áƒ‘áƒ—.",
  confirm_reference_label: () => "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ™áƒáƒ“áƒ˜",
  confirm_copy_reference: () => "áƒ™áƒáƒžáƒ˜áƒ áƒ”áƒ‘áƒ",
  confirm_cash_on_pickup: () => "áƒ¡áƒ£áƒš (áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜, áƒ’áƒáƒ¢áƒáƒœáƒ˜áƒ¡áƒáƒ¡)",
  confirm_cash_on_delivery: () => "áƒ¡áƒ£áƒš (áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜, áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡)",
  confirm_print_receipt: () => "ðŸ–¨ áƒ©áƒ”áƒ™áƒ˜áƒ¡ áƒ‘áƒ”áƒ­áƒ“áƒ•áƒ",
  confirm_order_again: () => "áƒ®áƒ”áƒšáƒáƒ®áƒšáƒ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ",
  faq_q_time: () => "áƒ áƒáƒ’áƒáƒ  áƒ“áƒ˜áƒ“áƒ®áƒáƒœáƒ¡ áƒ˜áƒ¦áƒ”áƒ‘áƒ¡ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ?",
  faq_a_time: (minutes: number) =>
    `áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ”áƒ‘áƒ˜áƒ¡ áƒ£áƒ›áƒ”áƒ¢áƒ”áƒ¡áƒáƒ‘áƒ áƒ“áƒáƒáƒ®áƒšáƒáƒ”áƒ‘áƒ˜áƒ— ${minutes} áƒ¬áƒ£áƒ—áƒ¨áƒ˜ áƒ›áƒ–áƒáƒ“áƒ“áƒ”áƒ‘áƒ. áƒ“áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ£áƒš áƒ¡áƒáƒáƒ—áƒ”áƒ‘áƒ¨áƒ˜ áƒáƒ“áƒœáƒáƒ• áƒ›áƒ”áƒ¢áƒ˜ áƒ¨áƒ”áƒ˜áƒ«áƒšáƒ”áƒ‘áƒ áƒ“áƒáƒ’áƒ•áƒ­áƒ˜áƒ áƒ“áƒ”áƒ¡ â€” áƒ“áƒáƒ’áƒ˜áƒ áƒ”áƒ™áƒáƒ•áƒ—, áƒ—áƒ£ áƒ“áƒáƒ’áƒ•áƒáƒ’áƒ•áƒ˜áƒáƒœáƒ“áƒ”áƒ‘áƒ.`,
  faq_q_payment: () => "áƒ áƒáƒ’áƒáƒ  áƒ¨áƒ”áƒ˜áƒ«áƒšáƒ”áƒ‘áƒ áƒ’áƒáƒ“áƒáƒ®áƒ“áƒ?",
  faq_a_payment: () => "áƒ’áƒáƒ“áƒáƒ˜áƒ®áƒáƒ“áƒ”áƒ— áƒœáƒáƒ¦áƒ“áƒ˜ áƒ¤áƒ£áƒšáƒ˜áƒ— áƒáƒœ áƒ‘áƒáƒ áƒáƒ—áƒ˜áƒ— áƒ©áƒ•áƒ”áƒœáƒ¡ BOG/TBC áƒ¢áƒ”áƒ áƒ›áƒ˜áƒœáƒáƒšáƒ–áƒ” â€” áƒ áƒáƒ’áƒáƒ áƒª áƒ’áƒáƒ¢áƒáƒœáƒ˜áƒ¡, áƒ˜áƒ¡áƒ” áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡áƒáƒ¡.",
  faq_q_delivery_area: () => "áƒ¡áƒáƒ“ áƒáƒ¬áƒ•áƒ“áƒ˜áƒ—?",
  faq_a_delivery_area: () =>
    "áƒ•áƒáƒ¬áƒ•áƒ“áƒ˜áƒ— áƒ›áƒ£áƒ®áƒ áƒáƒœáƒ¡áƒ áƒ“áƒ áƒ›áƒ˜áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ” áƒ¡áƒáƒ¤áƒšáƒ”áƒ‘áƒ¨áƒ˜ (áƒ®áƒ¡áƒáƒ•áƒ áƒ˜áƒ¡áƒ˜, áƒ«áƒáƒšáƒ˜áƒ¡áƒ˜, áƒ•áƒáƒ–áƒ˜áƒáƒœáƒ˜, áƒ•áƒáƒ áƒ“áƒ˜áƒ¡áƒ£áƒ‘áƒáƒœáƒ˜, áƒ˜áƒšáƒ—áƒáƒ–áƒ, áƒáƒ«áƒ˜áƒ¡áƒ˜). áƒ›áƒáƒ˜áƒœáƒ˜áƒ¨áƒœáƒ”áƒ— áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡áƒáƒ¡ áƒ“áƒ áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ¡ áƒ¡áƒáƒ¤áƒáƒ¡áƒ£áƒ áƒ¡ áƒ¬áƒ˜áƒœáƒáƒ¡áƒ¬áƒáƒ  áƒ“áƒáƒ•áƒáƒ“áƒáƒ¡áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ—.",
  faq_q_ingredients: () => "áƒ¨áƒ”áƒ˜áƒ«áƒšáƒ”áƒ‘áƒ áƒ˜áƒœáƒ’áƒ áƒ”áƒ“áƒ˜áƒ”áƒœáƒ¢áƒ”áƒ‘áƒ˜áƒ¡ áƒ›áƒáƒ®áƒ¡áƒœáƒ?",
  faq_a_ingredients: () =>
    "áƒ“áƒ˜áƒáƒ® â€” áƒ¨áƒ”áƒ”áƒ®áƒ”áƒ— áƒœáƒ”áƒ‘áƒ˜áƒ¡áƒ›áƒ˜áƒ”áƒ  áƒ™áƒ”áƒ áƒ«áƒ¡ áƒ“áƒ áƒáƒ˜áƒ áƒ©áƒ˜áƒ”áƒ— áƒ˜áƒ¡ áƒ˜áƒœáƒ’áƒ áƒ”áƒ“áƒ˜áƒ”áƒœáƒ¢áƒ”áƒ‘áƒ˜, áƒ áƒáƒ›áƒšáƒ”áƒ‘áƒ˜áƒª áƒáƒ  áƒ’áƒ˜áƒœáƒ“áƒáƒ—. áƒ¡áƒáƒ›áƒ–áƒáƒ áƒ”áƒ£áƒšáƒ áƒ—áƒ¥áƒ•áƒ”áƒœáƒ¡ áƒáƒ áƒ©áƒ”áƒ•áƒáƒœáƒ¡ áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒáƒ–áƒ” áƒ“áƒáƒ˜áƒœáƒáƒ®áƒáƒ•áƒ¡.",
  faq_q_ready_how: () => "áƒ áƒáƒ’áƒáƒ  áƒ’áƒáƒ•áƒ˜áƒ’áƒ”áƒ‘, áƒ áƒáƒ› áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ áƒ›áƒ–áƒáƒ“áƒáƒ?",
  faq_a_ready_how: () =>
    "áƒ¨áƒ”áƒ˜áƒœáƒáƒ®áƒ”áƒ— áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ™áƒáƒ“áƒ˜ (áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒ“áƒ”áƒ’ áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒáƒ— áƒ›áƒ˜áƒ¡áƒ˜ áƒ™áƒáƒžáƒ˜áƒ áƒ”áƒ‘áƒ áƒáƒœ áƒ‘áƒ”áƒ­áƒ“áƒ•áƒ). áƒªáƒ•áƒšáƒ˜áƒšáƒ”áƒ‘áƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒ—áƒ®áƒ•áƒ”áƒ•áƒáƒ¨áƒ˜ áƒ“áƒáƒ’áƒ˜áƒ áƒ”áƒ™áƒáƒ•áƒ— áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒš áƒœáƒáƒ›áƒ”áƒ áƒ–áƒ”.",
  footer_menu_updated: (date: string) => `áƒ›áƒ”áƒœáƒ˜áƒ£ áƒ’áƒáƒœáƒáƒ®áƒšáƒ“áƒ ${date}`,
  item_exclude_hint: () => "áƒ¨áƒ”áƒ”áƒ®áƒ”áƒ— áƒ˜áƒ› áƒ˜áƒœáƒ’áƒ áƒ”áƒ“áƒ˜áƒ”áƒœáƒ¢áƒ¡, áƒ áƒáƒ›áƒ”áƒšáƒ˜áƒª áƒáƒ  áƒ’áƒ˜áƒœáƒ“áƒáƒ—",
  item_remove_one: () => "áƒ”áƒ áƒ—áƒ˜áƒ¡ áƒ›áƒáƒ®áƒ¡áƒœáƒ",
  item_add_one_more: () => "áƒ™áƒ˜áƒ“áƒ”áƒ• áƒ”áƒ áƒ—áƒ˜áƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ",
  contact_whatsapp: () => "áƒ›áƒáƒ’áƒ•áƒ¬áƒ”áƒ áƒ”áƒ— WhatsApp-áƒ–áƒ”",
  back_to_top: () => "áƒ–áƒ”áƒ›áƒáƒ— áƒ“áƒáƒ‘áƒ áƒ£áƒœáƒ”áƒ‘áƒ",
  title_menu: () => "Cafe Lile â€” áƒ¨áƒ”áƒ£áƒ™áƒ•áƒ”áƒ—áƒ”áƒ— áƒ’áƒáƒ¢áƒáƒœáƒ˜áƒ— áƒáƒœ áƒ›áƒ˜áƒ¬áƒáƒ“áƒ”áƒ‘áƒ˜áƒ— áƒ›áƒ£áƒ®áƒ áƒáƒœáƒ¨áƒ˜",
  title_checkout: () => "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ â€” Cafe Lile",
  title_confirmation: () => "áƒ¨áƒ”áƒ™áƒ•áƒ”áƒ—áƒ áƒ’áƒáƒœáƒ—áƒáƒ•áƒ¡áƒ“áƒ â€” Cafe Lile",
};

const ka = { ...kaStrings, ...kaTemplates };

export interface Translations extends typeof en {}

type Dict = Translations;

const dictionaries: Record<Language, Dict> = { en, ka };

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Translate a key; falls back to English if missing in the active dict. */
  t: <K extends keyof Dict>(key: K) => Dict[K];
}

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext<LanguageContextValue>({
  lang: "ka",
  setLang: () => {},
  t: ((key: string) => dictionaries.ka[key]) as LanguageContextValue["t"],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal â€” the toggle still works for this page view.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (<K extends keyof Dict>(key: K) => dictionaries[lang][key] ?? en[key]) as LanguageContextValue["t"],
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Convenience hook returning just the translate function. */
// eslint-disable-next-line react-refresh/only-export-components
export function useT(): LanguageContextValue["t"] {
  return useContext(LanguageContext).t;
}

export function useLanguage(): { lang: Language; setLang: (lang: Language) => void } {
  return useContext(LanguageContext);
}
