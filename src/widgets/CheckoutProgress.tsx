import { motion } from 'framer-motion'

type Step = 1 | 2 | 3

function StepCell({
  n,
  label,
  step,
}: {
  n: Step
  label: string
  step: Step
}) {
  const done = step > n
  const active = step === n
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <motion.span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
          done
            ? 'bg-rose text-ink dark:bg-rose/85 dark:text-ink'
            : active
              ? 'bg-ink text-cream ring-2 ring-rose/45 dark:bg-cream dark:text-ink'
              : 'bg-cream/90 text-muted dark:bg-dark-elevated dark:text-dark-muted'
        }`}
        initial={false}
        animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {done ? '✓' : n}
      </motion.span>
      <span
        className={`text-center text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${
          active ? 'text-ink dark:text-cream' : 'text-muted dark:text-dark-muted'
        }`}
      >
        {label}
      </span>
    </li>
  )
}

function Connector({ filled }: { filled: boolean }) {
  return (
    <li
      aria-hidden
      className={`mx-1 h-0.5 w-6 shrink-0 rounded-full sm:mx-2 sm:w-14 ${filled ? 'bg-rose/55' : 'bg-ink/12 dark:bg-cream/12'}`}
    />
  )
}

export function CheckoutProgress({ step }: { step: Step }) {
  return (
    <nav
      aria-label="Checkout progress"
      className="nyanja-card mb-8"
    >
      <ol className="flex items-center justify-center">
        <StepCell n={1} label="Cart" step={step} />
        <Connector filled={step > 1} />
        <StepCell n={2} label="Checkout" step={step} />
        <Connector filled={step > 2} />
        <StepCell n={3} label="Done" step={step} />
      </ol>
    </nav>
  )
}
