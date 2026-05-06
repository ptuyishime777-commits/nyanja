import type { ReactNode } from 'react'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
  className = '',
}: {
  eyebrow?: string
  title: string
  /** Muted serif line under the title (editorial layouts) */
  subtitle?: string
  align?: 'left' | 'center'
  action?: ReactNode
  /** e.g. margin below header */
  className?: string
}) {
  const centered = align === 'center'
  return (
    <div
      className={`mb-5 flex gap-4 md:mb-6 ${centered ? 'flex-col items-center text-center' : 'items-end justify-between'} ${className}`}
    >
      <div className={centered ? 'max-w-lg' : ''}>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep dark:text-rose">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl dark:text-cream">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2.5 font-display text-[0.9375rem] font-normal italic leading-snug text-muted md:text-[1.025rem] dark:text-dark-muted">
            {subtitle}
          </p>
        )}
      </div>
      {centered ? (
        action ? <div className="mt-4 w-full">{action}</div> : null
      ) : (
        action ?? null
      )}
    </div>
  )
}
