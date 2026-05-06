import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../models/product'
import { Button } from './Button'
import { PriceDisplay } from './PriceDisplay'
import { ProductImage } from './ProductImage'

const INTERVAL_MS = 5500

export function FeaturedSpotlight({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const safe = products.length ? products : []
  const current = safe[index % safe.length]

  useEffect(() => {
    if (safe.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safe.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [safe.length])

  if (!current) return null

  return (
    <div className="nyanja-card nyanja-card--flush nyanja-card-interactive relative">
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[21/9] sm:min-h-[min(22rem,42vw)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <ProductImage
              fill
              src={current.images[0]}
              alt={current.name}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 72rem"
              imgClassName="sm:object-[center_22%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10 dark:from-dark-bg/92 dark:via-dark-bg/45 dark:to-ink/20" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cream/25 via-transparent to-rose/20 opacity-90 dark:from-rose/10 dark:to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8 md:p-10">
          <div className="pointer-events-auto w-full sm:w-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cream/90">
                  Featured
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-cream sm:text-4xl md:text-5xl">
                  {current.name}
                </h3>
                <div className="mt-4">
                  <PriceDisplay
                    priceRwf={current.priceRwf}
                    compareAtRwf={current.compareAtRwf}
                    size="lg"
                    tone="onDark"
                  />
                </div>
                <Link to={`/product/${current.slug}`} className="mt-6 inline-block">
                  <Button variant="secondary" className="!min-h-12 !px-8 shadow-lg">
                    View piece
                  </Button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {safe.length > 1 && (
            <div className="pointer-events-auto mt-6 flex justify-center gap-2 sm:mt-0 sm:flex-col sm:justify-end">
              {safe.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Show ${p.name}`}
                  aria-current={i === index % safe.length}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all sm:h-10 sm:w-2 sm:rounded-full ${
                    i === index % safe.length
                      ? 'w-8 bg-cream sm:h-10 sm:w-2'
                      : 'w-2 bg-cream/35 hover:bg-cream/60 sm:w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
