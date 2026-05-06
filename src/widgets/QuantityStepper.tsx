import { Button } from './Button'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-ink/10 bg-surface-2/80 p-1 dark:border-cream/15 dark:bg-dark-elevated">
      <Button
        variant="ghost"
        className="!min-h-10 !px-3 text-lg"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span className="min-w-10 text-center text-[15px] font-semibold tabular-nums text-ink dark:text-cream">
        {value}
      </span>
      <Button
        variant="ghost"
        className="!min-h-10 !px-3 text-lg"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </Button>
    </div>
  )
}
