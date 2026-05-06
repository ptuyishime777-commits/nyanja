import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'

const variants: Record<
  Variant,
  string
> = {
  primary:
    'bg-ink text-cream shadow-premium hover:bg-ink/90 active:scale-[0.97] dark:bg-cream dark:text-ink dark:hover:bg-cream/90',
  secondary:
    'bg-rose text-ink shadow-premium hover:bg-rose-deep/90 active:scale-[0.97]',
  ghost:
    'bg-transparent text-ink hover:bg-rose/25 active:scale-[0.98] dark:text-cream dark:hover:bg-dark-elevated',
  outline:
    'border border-ink/15 bg-transparent text-ink hover:border-rose hover:bg-rose/15 active:scale-[0.98] dark:border-cream/20 dark:text-cream',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl px-6 text-[15px] font-medium tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
