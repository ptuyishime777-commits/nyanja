import { AnimatePresence, motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../models/product'
import { maxAddableQuantity } from '../services/inventory'
import { useHubStore } from '../store/useHubStore'
import { Button } from './Button'
import { PriceDisplay } from './PriceDisplay'
import { ProductImage } from './ProductImage'

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product
  index?: number
}) {
  const toggleWishlist = useHubStore((s) => s.toggleWishlist)
  const isWishlisted = useHubStore((s) => s.isWishlisted(product.id))
  const addToCart = useHubStore((s) => s.addToCart)
  const inCartQty = useHubStore(
    (s) => s.cart.find((c) => c.productId === product.id)?.quantity ?? 0,
  )

  const out = product.stockQuantity <= 0
  const low = !out && product.stockQuantity > 0 && product.stockQuantity < 5
  const canQuickAdd = maxAddableQuantity(product, inCartQty) > 0

  const quickAdd = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canQuickAdd) return
    addToCart({
      productId: product.id,
      quantity: 1,
      sendAsGift: false,
      giftMessage: '',
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index * 0.04, 0.28),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.99 }}
      className="nyanja-card nyanja-card--flush nyanja-card-interactive group/card relative"
    >
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            aspectRatio="4/5"
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 18rem"
            priority={index === 0}
            imgClassName="transition-[transform] duration-[650ms] ease-out group-hover/card:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent opacity-90 dark:from-dark-bg/70 dark:via-transparent" />
          <div className="pointer-events-none absolute left-3 top-3 z-[1] flex max-w-[calc(100%-1.5rem)] flex-col gap-1.5">
            {out && (
              <span className="inline-flex w-fit rounded-full bg-ink/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cream shadow-sm backdrop-blur-sm dark:bg-dark-bg/90">
                Out of stock
              </span>
            )}
            {low && (
              <span className="inline-flex w-fit rounded-full border border-amber-500/55 bg-amber-100/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/80 dark:text-amber-100">
                Low stock · {product.stockQuantity} left
              </span>
            )}
            {product.compareAtRwf && product.compareAtRwf > product.priceRwf && (
              <span className="inline-flex w-fit rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm backdrop-blur-sm dark:bg-dark-elevated/95 dark:text-cream">
                Sale
              </span>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] p-3 pt-10 opacity-100 transition duration-300 md:pointer-events-none md:opacity-0 md:group-hover/card:pointer-events-auto md:group-hover/card:opacity-100">
          <div className="pointer-events-auto translate-y-0 transition duration-300 md:translate-y-2 md:group-hover/card:translate-y-0">
            <Button
              type="button"
              variant="secondary"
              className="w-full !min-h-11 !rounded-xl !text-[13px] font-semibold shadow-lg"
              onClick={quickAdd}
              disabled={!canQuickAdd}
              aria-disabled={!canQuickAdd}
            >
              {out ? 'Unavailable' : canQuickAdd ? 'Quick add' : 'Max in bag'}
            </Button>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          whileTap={{ scale: 0.88 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id)
          }}
          className="absolute right-3 top-3 z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/25 text-lg shadow-md backdrop-blur-md transition hover:bg-white/40 dark:border-cream/20 dark:bg-dark-elevated/40 dark:hover:bg-dark-elevated/60"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isWishlisted ? 'on' : 'off'}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className={isWishlisted ? 'text-rose-deep dark:text-rose' : 'text-ink/55 dark:text-cream/60'}
            >
              {isWishlisted ? '♥' : '♡'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <Link to={`/product/${product.slug}`} className="block p-4 pt-3">
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink dark:text-cream">
          {product.name}
        </h3>
        <div className="mt-2">
          <PriceDisplay priceRwf={product.priceRwf} compareAtRwf={product.compareAtRwf} size="sm" />
        </div>
      </Link>
    </motion.article>
  )
}
