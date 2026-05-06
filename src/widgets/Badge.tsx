import type { ReactNode } from 'react'

export function Badge({
  children,
  tone = 'rose',
  className = '',
}: {
  children: ReactNode
  tone?: 'rose' | 'ink' | 'outline'
  className?: string
}) {
  const tones = {
    rose: 'bg-rose/35 text-ink dark:bg-rose/25 dark:text-cream',
    ink: 'bg-ink text-cream dark:bg-cream dark:text-ink',
    outline: 'border border-ink/15 text-ink dark:border-cream/25 dark:text-cream',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
