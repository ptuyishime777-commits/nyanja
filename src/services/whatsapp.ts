/** Business WhatsApp (E.164 without +) */
export const WHATSAPP_E164 = '250786390104'

export const WHATSAPP_DISPLAY = '+250 786 390 104'

/** Tap-to-call link (RW mobile; opens dialer / can deep-link from some apps). */
export const WHATSAPP_TEL_HREF = 'tel:+250786390104'

export function whatsappOrderLink(message: string): string {
  const text = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_E164}?text=${text}`
}
