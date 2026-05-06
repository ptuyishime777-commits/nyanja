import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatRwf } from '../services/currency'
import { maxAddableQuantity } from '../services/inventory'
import { useHubStore } from '../store/useHubStore'
import { Badge } from '../widgets/Badge'
import { Button } from '../widgets/Button'
import { PriceDisplay } from '../widgets/PriceDisplay'
import { QuantityStepper } from '../widgets/QuantityStepper'
import { TextArea } from '../widgets/TextArea'
import { Toggle } from '../widgets/Toggle'
import { ProductGallery } from '../widgets/ProductGallery'
import { useCatalogStore } from '../store/useCatalogStore'

export function ProductScreen() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const products = useCatalogStore((s) => s.products)
  const cart = useHubStore((s) => s.cart)

  const product = useMemo(
    () => (slug ? products.find((p) => p.slug === slug) : undefined),
    [slug, products],
  )

  const addToCart = useHubStore((s) => s.addToCart)
  const clearCart = useHubStore((s) => s.clearCart)

  const [qty, setQty] = useState(1)
  const [sendGift, setSendGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [addedHint, setAddedHint] = useState(false)

  const inCartQty = useMemo(
    () =>
      product
        ? (cart.find((c) => c.productId === product.id)?.quantity ?? 0)
        : 0,
    [cart, product],
  )

  const remaining = product
    ? maxAddableQuantity(product, inCartQty)
    : 0
  const out = product ? product.stockQuantity <= 0 : true
  const low =
    !!product &&
    !out &&
    product.stockQuantity > 0 &&
    product.stockQuantity < 5

  useEffect(() => {
    if (!product) return
    if (remaining <= 0) return
    setQty((q) => Math.min(Math.max(1, q), remaining))
  }, [remaining, product?.id])

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted dark:text-dark-muted">Product not found.</p>
        <Link to="/shop" className="mt-4 inline-block font-semibold text-rose-deep dark:text-rose">
          Back to shop
        </Link>
      </div>
    )
  }

  const reviews = product.reviews ?? []
  const hasDiscount =
    product.compareAtRwf != null && product.compareAtRwf > product.priceRwf

  const qtyToAdd = out ? 0 : Math.min(qty, remaining)

  const handleAdd = () => {
    if (qtyToAdd < 1) return
    addToCart({
      productId: product.id,
      quantity: qtyToAdd,
      sendAsGift: sendGift,
      giftMessage: sendGift ? giftMessage : '',
    })
    setAddedHint(true)
    window.setTimeout(() => setAddedHint(false), 2400)
  }

  const handleBuyNow = () => {
    if (out) return
    const cap = product.stockQuantity
    if (cap < 1) return
    const take = Math.min(qty, cap)
    clearCart()
    addToCart({
      productId: product.id,
      quantity: take,
      sendAsGift: sendGift,
      giftMessage: sendGift ? giftMessage : '',
    })
    navigate('/checkout')
  }

  const trustPills = [
    { t: 'Secure checkout' },
    { t: 'Gift-ready packaging' },
    { t: 'Packed with care' },
  ]

  return (
    <div className="pb-[7.5rem] lg:pb-0">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-10">
        <ProductGallery key={product.id} product={product} />

        <div className="space-y-8 lg:max-w-xl lg:justify-self-end">
          <div className="flex flex-wrap items-center gap-2">
            {hasDiscount && <Badge tone="ink">Limited offer</Badge>}
            {product.trending && <Badge tone="rose">Trending</Badge>}
            {out ? (
              <Badge tone="ink">Out of stock</Badge>
            ) : low ? (
              <Badge tone="rose">Low stock · {product.stockQuantity} left</Badge>
            ) : null}
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-[2.75rem] dark:text-cream">
              {product.name}
            </h1>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
              <PriceDisplay
                priceRwf={product.priceRwf}
                compareAtRwf={product.compareAtRwf}
                size="lg"
              />
              <div className="flex items-center gap-2">
                <div className="flex text-rose-deep dark:text-rose" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-base ${i < Math.round(product.rating) ? 'opacity-100' : 'opacity-25'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium text-ink dark:text-cream">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted dark:text-dark-muted">
                  · {product.reviewCount} reviews
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {trustPills.map((p) => (
                <span
                  key={p.t}
                  className="inline-flex items-center rounded-full border border-ink/10 bg-cream/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/80 dark:border-cream/15 dark:bg-dark-elevated/80 dark:text-cream/90"
                >
                  {p.t}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[15px] leading-[1.75] text-muted dark:text-dark-muted">
            {product.description}
          </p>

          {product.bundleItems && (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink dark:text-cream">
                What&apos;s inside
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.bundleItems.map((item) => (
                  <li key={item}>
                    <span className="inline-flex rounded-full border border-rose/35 bg-rose/20 px-3.5 py-2 text-[13px] font-medium leading-snug text-ink dark:border-rose/25 dark:bg-rose/15 dark:text-cream">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink dark:text-cream">Quantity</p>
            {out ? (
              <p className="text-sm text-muted dark:text-dark-muted">
                This item is currently unavailable. Check back soon or browse similar gifts in the shop.
              </p>
            ) : remaining < 1 ? (
              <p className="text-sm text-muted dark:text-dark-muted">
                You already have the maximum available in your bag ({product.stockQuantity} in stock).
              </p>
            ) : (
              <QuantityStepper
                value={qty}
                min={1}
                max={remaining}
                onChange={setQty}
              />
            )}
          </div>

          <div className="space-y-3">
            <Toggle
              checked={sendGift}
              onChange={setSendGift}
              label="Send as gift"
              description="We can include your note on a premium card."
            />
            {sendGift && (
              <TextArea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write a short message for your recipient…"
                maxLength={280}
              />
            )}
          </div>

          <div className="hidden flex-col gap-3 pt-2 lg:flex lg:flex-row">
            <Button
              variant="secondary"
              className="flex-1 !min-h-[3.35rem]"
              onClick={handleAdd}
              disabled={out || remaining < 1 || qtyToAdd < 1}
            >
              Add to cart
            </Button>
            <Button
              variant="primary"
              className="flex-1 !min-h-[3.35rem]"
              onClick={handleBuyNow}
              disabled={out || qtyToAdd < 1}
            >
              Buy now
            </Button>
          </div>

          <AnimatePresence>
            {addedHint && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className="text-center text-sm font-medium text-rose-deep dark:text-rose lg:text-left"
              >
                Added to your bag.
              </motion.p>
            )}
          </AnimatePresence>

          <section className="border-t border-ink/8 pt-12 dark:border-cream/10">
            <h2 className="font-display text-2xl font-semibold text-ink dark:text-cream">
              Reviews
            </h2>
            {reviews.length > 0 ? (
              <ul className="mt-8 space-y-8">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink dark:text-cream">{r.author}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">{r.date}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-rose-deep dark:text-rose">
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted dark:text-dark-muted">
                      {r.text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-sm leading-relaxed text-muted dark:text-dark-muted">
                No reviews yet. After your order arrives, you can leave one from your dashboard.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Mobile sticky commerce bar */}
      <div className="fixed inset-x-0 bottom-[calc(4.35rem+env(safe-area-inset-bottom,0px))] z-[42] border-t border-ink/10 bg-surface/90 px-4 py-3 shadow-[0_-12px_40px_-12px_rgba(26,26,26,0.12)] backdrop-blur-xl dark:border-cream/10 dark:bg-dark-bg/92 dark:shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
              Total · Qty {out ? 0 : qtyToAdd}
            </p>
            <p className="truncate font-display text-lg font-semibold text-ink dark:text-cream">
              {formatRwf(product.priceRwf * (out ? 0 : qtyToAdd))}
            </p>
          </div>
          <Button
            variant="secondary"
            className="!min-h-11 shrink-0 !px-4 !text-[13px]"
            onClick={handleAdd}
            disabled={out || remaining < 1 || qtyToAdd < 1}
          >
            Cart
          </Button>
          <Button
            variant="primary"
            className="!min-h-11 shrink-0 !px-4 !text-[13px]"
            onClick={handleBuyNow}
            disabled={out || qtyToAdd < 1}
          >
            Buy
          </Button>
        </div>
      </div>
    </div>
  )
}
