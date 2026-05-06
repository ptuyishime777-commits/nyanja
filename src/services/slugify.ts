/** URL-safe slug for product routes */
export function slugifyFromName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ensureUniqueSlug(
  baseSlug: string,
  products: { id: string; slug: string }[],
  excludeId?: string,
) {
  let slug = baseSlug || 'product'
  if (!products.some((p) => p.slug === slug && p.id !== excludeId)) {
    return slug
  }
  let n = 2
  while (products.some((p) => p.slug === `${slug}-${n}` && p.id !== excludeId)) {
    n += 1
  }
  return `${slug}-${n}`
}
