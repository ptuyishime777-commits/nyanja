import { motion } from 'framer-motion'
import { type TouchEvent, useRef, useState } from 'react'
import type { Product } from '../models/product'
import { ProductImage } from './ProductImage'

/** Gallery state is isolated so `key={product.id}` on the parent resets index without effects. */
export function ProductGallery({ product }: { product: Product }) {
  const [imgIndex, setImgIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const onGalleryTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onGalleryTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null || product.images.length < 2) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -48) {
      setImgIndex((i) => Math.min(product.images.length - 1, i + 1))
    } else if (dx > 48) {
      setImgIndex((i) => Math.max(0, i - 1))
    }
  }

  const galleryStep = (delta: number) => {
    setImgIndex((i) =>
      Math.min(product.images.length - 1, Math.max(0, i + delta)),
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <motion.div
          key={imgIndex}
          initial={{ opacity: 0.9, scale: 0.995 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="nyanja-card nyanja-card--flush relative"
          onTouchStart={onGalleryTouchStart}
          onTouchEnd={onGalleryTouchEnd}
        >
          <ProductImage
            src={product.images[imgIndex]}
            alt={`${product.name} — photo ${imgIndex + 1} of ${product.images.length}`}
            aspectRatio="4/5"
            sizes="(max-width: 1024px) 92vw, (max-width: 1536px) 45vw, 36rem"
            priority={imgIndex === 0}
          />
        </motion.div>

        {product.images.length > 1 && (
          <>
            <p className="mt-2 text-center text-[11px] font-medium text-muted lg:hidden dark:text-dark-muted">
              Swipe sideways for more photos
            </p>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => galleryStep(-1)}
              disabled={imgIndex === 0}
              className="absolute left-2 top-1/2 z-[2] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-surface/90 text-lg text-ink shadow-md backdrop-blur-md transition hover:bg-cream disabled:opacity-30 dark:border-cream/15 dark:bg-dark-bg/85 dark:text-cream lg:flex"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => galleryStep(1)}
              disabled={imgIndex === product.images.length - 1}
              className="absolute right-2 top-1/2 z-[2] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-surface/90 text-lg text-ink shadow-md backdrop-blur-md transition hover:bg-cream disabled:opacity-30 dark:border-cream/15 dark:bg-dark-bg/85 dark:text-cream lg:flex"
            >
              ›
            </button>
          </>
        )}
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {product.images.map((src, i) => (
            <button
              key={`${product.id}-${i}-${src}`}
              type="button"
              onClick={() => setImgIndex(i)}
              className={`relative h-[4.25rem] w-[3.5rem] shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === imgIndex
                  ? 'ring-ink dark:ring-cream'
                  : 'ring-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <ProductImage
                fill
                src={src}
                alt={`${product.name}, thumbnail ${i + 1}`}
                sizes="64px"
                priority={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
