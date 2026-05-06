/** Digits only, for `tel:` and `wa.me` paths (include country code). */
export function phoneToDigits(phone: string): string {
  const d = phone.replace(/\D/g, '')
  return d
}

export function telHrefFromDisplay(phone: string): string {
  const d = phoneToDigits(phone)
  if (!d) return '#'
  return `tel:+${d.startsWith('250') ? d : d}`
}

/** `https://wa.me/2507…` — no + in path */
export function whatsAppHref(digits: string, text: string): string {
  const d = phoneToDigits(digits)
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}
