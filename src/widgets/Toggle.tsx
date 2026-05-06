type Props = {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-4 rounded-2xl border border-ink/8 bg-white/50 p-4 text-left transition hover:border-rose/40 dark:border-cream/10 dark:bg-dark-surface/80"
    >
      <span
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-rose' : 'bg-ink/15 dark:bg-cream/20'}`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-cream shadow transition-transform dark:bg-ink ${checked ? 'translate-x-5' : ''}`}
        />
      </span>
      <span>
        <span className="block font-medium text-ink dark:text-cream">{label}</span>
        {description && (
          <span className="mt-1 block text-sm text-muted dark:text-dark-muted">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
