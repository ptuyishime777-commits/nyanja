import { formatRwf } from '../services/currency'

export function PriceDisplay({
  priceRwf,
  compareAtRwf,
  size = 'md',
  tone = 'default',
}: {
  priceRwf: number
  compareAtRwf?: number
  size?: 'sm' | 'md' | 'lg'
  /** Light text for use on dark imagery / overlays */
  tone?: 'default' | 'onDark'
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl sm:text-3xl',
  }
  const hasDiscount = compareAtRwf != null && compareAtRwf > priceRwf
  const main =
    tone === 'onDark'
      ? 'text-cream'
      : 'text-ink dark:text-cream'
  const strike =
    tone === 'onDark'
      ? 'text-cream/55 line-through'
      : 'text-muted line-through dark:text-dark-muted'
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-display font-semibold tracking-tight ${main} ${sizes[size]}`}>
        {formatRwf(priceRwf)}
      </span>
      {hasDiscount && (
        <span className={`text-sm ${strike}`}>
          {formatRwf(compareAtRwf!)}
        </span>
      )}
    </div>
  )
}
