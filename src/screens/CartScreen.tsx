import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProductById } from '../services/productQueries'
import { formatRwf } from '../services/currency'
import { useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { useHubStore } from '../store/useHubStore'
import { Button } from '../widgets/Button'
import { CheckoutProgress } from '../widgets/CheckoutProgress'
import { Input } from '../widgets/Input'
import { QuantityStepper } from '../widgets/QuantityStepper'
import { SectionHeader } from '../widgets/SectionHeader'
import { ProductImage } from '../widgets/ProductImage'

const PROMO_CODE = 'NYANJA5'

export function CartScreen() {
  const navigate = useNavigate()
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const products = useCatalogStore((s) => s.products)
  const validateCartStock = useCatalogStore((s) => s.validateCartStock)
  const cart = useHubStore((s) => s.cart)
  const setCartQty = useHubStore((s) => s.setCartQty)
  const removeFromCart = useHubStore((s) => s.removeFromCart)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const lines = useMemo(
    () =>
      cart.map((line) => {
        const p = getProductById(line.productId)
        return { line, product: p }
      }),
    [cart, products],
  )

  const stockCheck = useMemo(
    () => validateCartStock(cart),
    [cart, validateCartStock, products],
  )

  useEffect(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    const toRemove: string[] = []
    const toClamp: { productId: string; q: number }[] = []

    for (const line of cart) {
      const p = byId.get(line.productId)
      if (!p || p.stockQuantity <= 0) {
        toRemove.push(line.productId)
        continue
      }
      if (line.quantity > p.stockQuantity) {
        toClamp.push({ productId: line.productId, q: p.stockQuantity })
      }
    }

    for (const id of toRemove) removeFromCart(id)
    for (const { productId, q } of toClamp) setCartQty(productId, q)
  }, [products, cart, removeFromCart, setCartQty])

  const subtotal = lines.reduce(
    (s, { line, product }) => s + (product?.priceRwf ?? 0) * line.quantity,
    0,
  )

  const discountRwf =
    promoApplied && subtotal > 0 ? Math.round(subtotal * 0.05) : 0
  const afterDiscount = Math.max(0, subtotal - discountRwf)

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === PROMO_CODE) {
      setPromoApplied(true)
    }
  }

  const goCheckout = () => {
    if (!stockCheck.ok) return
    if (!sessionUserId) {
      navigate('/login', {
        state: { from: '/checkout', checkoutDiscount: discountRwf },
      })
      return
    }
    navigate('/checkout', { state: { discountRwf } })
  }

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center">
        <SectionHeader title="Your bag is resting" />
        <p className="mt-2 text-muted dark:text-dark-muted">
          Add something beautiful — we&apos;ll keep it safe here.
        </p>
        <Link to="/shop" className="mt-8 inline-block">
          <Button variant="secondary">Continue shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <CheckoutProgress step={1} />

      <div className="grid gap-12 lg:grid-cols-5 lg:gap-14">
        <div className="space-y-5 lg:col-span-3">
          <SectionHeader eyebrow="Bag" title="Your selection" />
          <ul className="space-y-5">
            {lines.map(({ line, product }) => {
              if (!product) return null
              return (
                <motion.li
                  key={line.productId}
                  initial={{ opacity: 0.96 }}
                  animate={{ opacity: 1 }}
                  className="nyanja-card flex gap-4"
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-ink/8 dark:bg-dark-elevated dark:ring-cream/10"
                  >
                    <ProductImage
                      fill
                      src={product.images[0]}
                      alt={product.name}
                      sizes="96px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-display text-xl font-semibold text-ink dark:text-cream"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted dark:text-dark-muted">
                      {formatRwf(product.priceRwf)} each
                    </p>
                    {line.sendAsGift && (
                      <p className="mt-3 rounded-xl bg-rose/25 px-3 py-2 text-xs leading-snug text-ink dark:text-cream">
                        Gift ·{' '}
                        {line.giftMessage
                          ? `“${line.giftMessage.slice(0, 80)}${line.giftMessage.length > 80 ? '…' : ''}”`
                          : 'No message'}
                      </p>
                    )}
                    {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                      <p className="mt-2 text-xs font-medium text-amber-900/90 dark:text-amber-200/95">
                        Low stock — only {product.stockQuantity} left in our
                        boutique.
                      </p>
                    )}
                    {product.stockQuantity > 0 &&
                      line.quantity >= product.stockQuantity && (
                        <p className="mt-2 text-xs text-muted dark:text-dark-muted">
                          You have the remaining stock for this item in your bag.
                        </p>
                      )}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        max={Math.max(1, product.stockQuantity)}
                        onChange={(n) =>
                          setCartQty(
                            line.productId,
                            Math.min(n, product.stockQuantity),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.productId)}
                        className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline dark:text-dark-muted dark:hover:text-cream"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>

        <aside className="lg:col-span-2">
          <div className="nyanja-card sticky top-28 space-y-6">
            <h2 className="font-display text-xl font-semibold text-ink dark:text-cream">
              Summary
            </h2>

            <p className="rounded-xl border border-rose/25 bg-rose/15 px-4 py-3 text-xs leading-relaxed text-ink/90 dark:border-rose/20 dark:bg-rose/10 dark:text-cream/95">
              Every order is packed by hand. You&apos;ll receive a confirmation message before delivery — typically same-week in Kigali.
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted dark:text-dark-muted">
                <span>Subtotal</span>
                <span className="tabular-nums text-ink dark:text-cream">{formatRwf(subtotal)}</span>
              </div>
              {promoApplied && discountRwf > 0 && (
                <div className="flex justify-between text-rose-deep dark:text-rose">
                  <span>Promo ({PROMO_CODE})</span>
                  <span className="tabular-nums">−{formatRwf(discountRwf)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted dark:text-dark-muted">
                <span>Delivery</span>
                <span className="max-w-[11rem] text-right text-xs leading-snug">
                  Confirmed at checkout · from {formatRwf(0)} pickup
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                disabled={promoApplied}
                className="!min-h-11 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="!min-h-11 shrink-0 !px-4"
                disabled={promoApplied}
                onClick={applyPromo}
              >
                Apply
              </Button>
            </div>
            {promoApplied && (
              <p className="text-xs font-medium text-rose-deep dark:text-rose">
                5% off applied to your subtotal.
              </p>
            )}

            <div className="nyanja-card !bg-gradient-to-br from-rose/25 via-cream/40 to-white/80 dark:!from-rose/15 dark:!via-dark-elevated/80 dark:!to-dark-surface/90">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                Due today
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink dark:text-cream">
                {formatRwf(afterDiscount)}
              </p>
            </div>

            {!stockCheck.ok && (
              <p
                role="alert"
                className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-50/95"
              >
                {stockCheck.error} Adjust quantities in your bag or return to the
                shop.
              </p>
            )}

            <Button
              variant="primary"
              className="w-full !min-h-[3.5rem] !text-[15px] font-semibold shadow-lg"
              disabled={!stockCheck.ok}
              onClick={goCheckout}
            >
              {sessionUserId ? 'Continue to checkout' : 'Sign in to checkout'}
            </Button>
            <Link
              to="/shop"
              className="block text-center text-sm font-medium text-muted hover:text-ink dark:text-dark-muted dark:hover:text-cream"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
