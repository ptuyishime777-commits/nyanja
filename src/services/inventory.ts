import type { CartLine } from '../models/cart'
import type { Product } from '../models/product'

/** Non-negative integer stock; missing/invalid payloads default for legacy rows. */
export function coerceStockQuantity(raw: unknown, fallback = 100): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw))
    return Math.max(0, Math.round(fallback))
  return Math.max(0, Math.round(raw))
}

export function mergeProductStockFromPayload(p: Product): Product {
  return {
    ...p,
    stockQuantity: coerceStockQuantity(p.stockQuantity, 100),
  }
}

export function validateCartAgainstStock(
  cart: CartLine[],
  products: Product[],
): { ok: true } | { ok: false; error: string } {
  const byId = new Map(products.map((p) => [p.id, p]))
  for (const line of cart) {
    const p = byId.get(line.productId)
    const stock = p?.stockQuantity ?? 0
    if (!p) {
      return {
        ok: false,
        error:
          'One item in your bag is no longer available. Remove it and try again.',
      }
    }
    if (line.quantity > stock) {
      return {
        ok: false,
        error: `Not enough stock for “${p.name}”. Only ${stock} left (you have ${line.quantity} in your bag).`,
      }
    }
  }
  return { ok: true }
}

/** Max units of this product the user can add on top of what's already in the cart. */
export function maxAddableQuantity(
  product: Product,
  quantityAlreadyInCart: number,
): number {
  return Math.max(0, product.stockQuantity - quantityAlreadyInCart)
}
