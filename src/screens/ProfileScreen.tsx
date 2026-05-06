import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isAdminUser, useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { useHubStore } from '../store/useHubStore'
import { initialsForUser } from '../utils/userInitials'
import { Button } from '../widgets/Button'
import { CustomerOrderCard } from '../widgets/CustomerOrderCard'
import { OrderCustomerExtras } from '../widgets/OrderCustomerExtras'
import { CheckoutProgress } from '../widgets/CheckoutProgress'
import { ProductCard } from '../widgets/ProductCard'
import { SectionHeader } from '../widgets/SectionHeader'
import { Toggle } from '../widgets/Toggle'

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function IconShoppingBagOutline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 10h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10zm3-6a3 3 0 016 0v4H9V4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProfileScreen() {
  const location = useLocation()
  const justOrdered = (location.state as { justOrdered?: boolean } | null)?.justOrdered

  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const buckets = useAuthStore((s) => s.buckets)
  const logout = useAuthStore((s) => s.logout)

  const user = useAuthStore((s) =>
    s.sessionUserId
      ? s.users.find((u) => u.id === s.sessionUserId) ?? null
      : null,
  )

  const orders = useMemo(() => {
    if (!sessionUserId) return []
    return buckets[sessionUserId]?.orders ?? []
  }, [buckets, sessionUserId])

  const wishlistIds = useHubStore((s) => s.wishlistIds)
  const theme = useHubStore((s) => s.theme)
  const setTheme = useHubStore((s) => s.setTheme)
  const notificationsEnabled = useHubStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useHubStore((s) => s.setNotificationsEnabled)

  const products = useCatalogStore((s) => s.products)
  const saved = products.filter((p) => wishlistIds.includes(p.id))

  const userInitials = user ? initialsForUser(user.displayName, user.email) : ''

  return (
    <div className="space-y-14">
      {justOrdered && <CheckoutProgress step={3} />}
      {justOrdered && (
        <div className="rounded-[1.25rem] border border-rose/40 bg-rose/20 px-4 py-3 text-center text-sm font-medium text-ink dark:text-cream">
          Thank you, your order is being prepared with care.
        </div>
      )}

      <SectionHeader eyebrow="Account" title="Your Nyanja world" />

      {user && (
        <div className="-mt-6 nyanja-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1c1c1c] font-display text-lg font-semibold tracking-tight text-cream md:h-[5.25rem] md:w-[5.25rem] md:text-xl dark:bg-black dark:text-cream"
                aria-hidden
              >
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-semibold text-ink md:text-xl dark:text-cream">
                  {user.displayName}
                </p>
                <p className="mt-1 truncate text-sm text-muted dark:text-dark-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex justify-end sm:shrink-0 sm:self-center">
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border-[1.5px] border-[#1a1a1a] bg-transparent px-5 py-2.5 text-[13px] font-semibold tracking-tight text-[#1a1a1a] transition hover:bg-black/[0.03] active:scale-[0.98] dark:border-cream dark:text-cream dark:hover:bg-cream/[0.06]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/dashboard"
          className="inline-flex min-h-[2.875rem] items-center gap-2.5 rounded-2xl border border-ink/10 bg-white/70 px-8 py-3 text-[15px] font-medium tracking-tight text-ink shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition hover:border-transparent hover:bg-rose/35 hover:text-ink active:scale-[0.985] dark:border-cream/15 dark:bg-dark-surface/60 dark:text-cream dark:shadow-none dark:hover:bg-rose/20"
        >
          My dashboard{' '}
          <span aria-hidden className="text-lg font-semibold leading-none">
            →
          </span>
        </Link>
        {isAdminUser(user) && (
          <Link to="/admin">
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 !min-h-10 !px-5 !text-[14px]"
            >
              Admin portal <IconArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </Link>
        )}
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-cream">
          Order history
        </h2>
        {orders.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {orders.map((o) => (
              <CustomerOrderCard
                key={o.id}
                order={o}
                extras={<OrderCustomerExtras order={o} />}
              />
            ))}
          </ul>
        ) : (
          <div className="nyanja-card mt-6 py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-ink/10 bg-[#faf8f6] text-ink/35 dark:border-cream/15 dark:bg-dark-elevated/80 dark:text-cream/40">
              <IconShoppingBagOutline className="h-8 w-8" />
            </div>
            <p className="font-display text-base font-semibold text-ink dark:text-cream">No orders yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted dark:text-dark-muted">
              When you place your first gift order, your receipts will appear here.
            </p>
            <Link to="/shop" className="mt-6 inline-flex">
              <Button
                variant="primary"
                className="inline-flex items-center gap-2 !min-h-11 !px-8 dark:!border dark:!border-cream/20"
              >
                Start shopping <IconArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Saved & wishlist"
          action={
            <Link to="/shop" className="text-sm font-semibold text-rose-deep dark:text-rose">
              Discover more
            </Link>
          }
        />
        {saved.length === 0 ? (
          <p className="text-sm text-muted dark:text-dark-muted">
            Tap the heart on any product to keep it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {saved.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-cream">
          Settings
        </h2>
        <div className="mt-4 space-y-4">
          <Toggle
            checked={theme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
            label="Dark mode"
            description="Warm charcoal tones, easy on the eyes at night."
          />

          <Toggle
            checked={notificationsEnabled}
            onChange={setNotificationsEnabled}
            label="Order updates"
            description="SMS and email when your gift is on the way."
          />
        </div>
      </section>
    </div>
  )
}
