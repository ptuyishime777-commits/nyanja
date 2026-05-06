import type { TextareaHTMLAttributes } from 'react'

export function TextArea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-28 w-full resize-y rounded-2xl border-2 border-ink/25 bg-white/90 px-4 py-3 text-[15px] text-ink shadow-sm outline-none ring-rose/40 transition placeholder:text-muted focus:border-rose-deep focus:ring-2 focus:ring-offset-0 dark:border-cream/35 dark:bg-dark-elevated dark:text-cream dark:shadow-none dark:placeholder:text-dark-muted dark:focus:border-rose ${className}`}
      {...props}
    />
  )
}
