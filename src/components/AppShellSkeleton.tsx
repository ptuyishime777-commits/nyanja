/** Shown only while Zustand persist (hub/cart) rehydrates — typically under 50ms. */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface dark:bg-dark-bg">
      <header
        className="h-14 shrink-0 animate-pulse border-b border-ink/10 bg-cream/80 dark:border-cream/10 dark:bg-dark-surface/80"
        aria-hidden
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        <div className="mx-auto h-9 w-48 max-w-full animate-pulse rounded-lg bg-ink/[0.06] dark:bg-cream/[0.08]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className="animate-pulse rounded-2xl border border-ink/[0.06] bg-cream/50 p-4 dark:border-cream/10 dark:bg-dark-elevated/50"
            >
              <div className="aspect-[4/5] rounded-xl bg-ink/[0.06] dark:bg-cream/[0.08]" />
              <div className="mt-4 h-4 w-3/4 rounded bg-ink/[0.08] dark:bg-cream/[0.1]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-ink/[0.05] dark:bg-cream/[0.07]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
