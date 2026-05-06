import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'

export const PRODUCT_IMAGE_PLACEHOLDER = '/nyanja-images/placeholder.svg'

function publicAssetUrl(path: string): string {
  if (!path || /^https?:\/\//i.test(path)) return path
  const base = import.meta.env.BASE_URL
  const rel = path.startsWith('/') ? path.slice(1) : path
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${rel}`
}

const ASPECT_CLASS: Record<string, string> = {
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
  '3/4': 'aspect-[3/4]',
  '21/9': 'aspect-[21/9]',
}

export type ProductImageAspect = keyof typeof ASPECT_CLASS

type Props = {
  src: string
  alt: string
  /** Default `1/1`. Ignored when `fill` is true. */
  aspectRatio?: ProductImageAspect | (string & {})
  className?: string
  /** Applied to the motion `img` (e.g. hover zoom). */
  imgClassName?: string
  sizes?: string
  priority?: boolean
  /**
   * Fill a positioned parent (`relative` + explicit size). Uses `object-cover` / `object-center`.
   * Use for thumbnails and cart rows — avoids nested aspect-ratio conflicts.
   */
  fill?: boolean
}

export function ProductImage({
  src,
  alt,
  aspectRatio = '1/1',
  className = '',
  imgClassName = '',
  sizes = '(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24rem',
  priority = false,
  fill = false,
}: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const resolvedSrc = publicAssetUrl(failed ? PRODUCT_IMAGE_PLACEHOLDER : src)
  const aspectCls =
    !fill && (ASPECT_CLASS[aspectRatio as ProductImageAspect] ?? ASPECT_CLASS['1/1'])

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setFailed(true)
    setLoaded(true)
  }, [])

  const shell = fill
    ? `absolute inset-0 overflow-hidden ${className}`
    : `relative isolate overflow-hidden bg-cream/40 dark:bg-dark-elevated/80 ${aspectCls} ${className}`

  return (
    <div className={shell}>
      {!loaded && (
        <div
          className="absolute inset-0 z-10 bg-gradient-to-br from-cream via-rose/25 to-cream dark:from-dark-elevated dark:via-dark-surface dark:to-dark-bg"
          aria-hidden
        >
          <div className="img-shimmer absolute inset-0 opacity-70" />
        </div>
      )}

      <motion.img
        src={resolvedSrc}
        alt={alt}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        sizes={sizes}
        width={960}
        height={1200}
        onLoad={handleLoad}
        onError={handleError}
        initial={false}
        animate={{
          opacity: loaded ? 1 : 0,
          scale: loaded ? 1 : 1.02,
          filter: loaded ? 'blur(0px)' : 'blur(12px)',
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-0 h-full w-full object-cover object-center will-change-[opacity,filter] ${imgClassName}`}
      />
    </div>
  )
}
