import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { OrderStatus } from '../models/order'
import { formatRwf } from '../services/currency'
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_TEL_HREF,
  whatsappOrderLink,
} from '../services/whatsapp'
import { useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { useHubStore } from '../store/useHubStore'
import { CustomerOrderCard } from '../widgets/CustomerOrderCard'
import { OrderCustomerExtras } from '../widgets/OrderCustomerExtras'

const FLOW_STEPS = ['In process', 'Shipping', 'Delivered'] as const

function flowActiveIndex(status: OrderStatus | undefined): number | null {
  if (!status || status === 'cancelled') return null
  if (status === 'pending' || status === 'processing') return 0
  if (status === 'shipped') return 1
  if (status === 'delivered') return 2
  return null
}

function DashboardFlowStepper({ activeIndex }: { activeIndex: number | null }) {
  return (
    <div
      className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2"
      aria-label="Typical order lifecycle"
    >
      {FLOW_STEPS.map((label, i) => (
        <span key={label} className="flex items-center gap-x-3">
          {i > 0 ? (
            <span aria-hidden className="text-xs font-medium text-muted dark:text-dark-muted">
              →
            </span>
          ) : null}
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
              activeIndex === i
                ? 'bg-rose/55 text-ink ring-1 ring-rose-deep/20 dark:bg-rose/25 dark:text-cream dark:ring-rose/30'
                : 'bg-cream/50 text-muted opacity-80 ring-1 ring-[#f0ece8] dark:bg-dark-elevated/80 dark:text-dark-muted dark:ring-cream/10'
            }`}
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  )
}

function OrderLifecycleInline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
        Tracking unavailable — order cancelled.
      </p>
    )
  }

  const active = flowActiveIndex(status)

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
      aria-label="Shipment progress for this order"
    >
      {FLOW_STEPS.map((label, i) => (
        <span key={label} className="contents">
          {i > 0 ? (
            <span aria-hidden className="mx-0.5 text-muted opacity-60 dark:text-dark-muted">
              →
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 ${
              active === i
                ? 'bg-rose/50 text-ink dark:bg-rose/20 dark:text-cream'
                : 'text-muted opacity-65 dark:text-dark-muted'
            }`}
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  )
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 7h6m-6 4h6m-6 4h4M7 3H5a2 2 0 00-2 2v16l3-1 3 1 3-1 3 1V5a2 2 0 00-2-2h-2"
      />
    </svg>
  )
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-6.716-4.38-9-8.5C.75 9.5 2 6 5.5 6 8 6 10 8 12 10.5 14 8 16 6 18.5 6 22 6 23.25 9.5 21 12.5 12 21z"
      />
    </svg>
  )
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 10V6a4 4 0 00-8 0v4M4 10h16l-1 10H5L4 10z"
      />
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const ctaH = 'inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-2xl px-6 text-[15px] font-medium tracking-tight transition active:scale-[0.98]'

export function UserDashboardScreen() {
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const buckets = useAuthStore((s) => s.buckets)
  const products = useCatalogStore((s) => s.products)
  const orders = useMemo(() => {
    if (!sessionUserId) return []
    return buckets[sessionUserId]?.orders ?? []
  }, [buckets, sessionUserId])

  const wishlistIds = useHubStore((s) => s.wishlistIds)
  const cart = useHubStore((s) => s.cart)

  const cartCount = cart.reduce((n, l) => n + l.quantity, 0)
  const cartValue = useMemo(() => {
    return cart.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId)
      return sum + (p?.priceRwf ?? 0) * line.quantity
    }, 0)
  }, [cart, products])

  const recent = orders.slice(0, 6)
  const waHelp = whatsappOrderLink('Muraho! I need help with my Nyanja Gift Hub order.')
  const headlineFlowStep = flowActiveIndex(recent[0]?.status)

  const statCardBg =
    'nyanja-card relative flex h-full flex-col min-h-[10rem]'

  return (
    <div className="space-y-10 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep dark:text-rose">
          Your space
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl dark:text-cream">
          Dashboard
        </h1>
        <DashboardFlowStepper activeIndex={headlineFlowStep} />
        <p className="mt-4 max-w-lg text-sm text-muted dark:text-dark-muted">
          Need help? Tap{' '}
          <a
            href={WHATSAPP_TEL_HREF}
            className="font-semibold text-rose-deep underline decoration-rose-deep/40 underline-offset-2 hover:text-ink dark:text-rose dark:hover:text-cream"
          >
            {WHATSAPP_DISPLAY}
          </a>{' '}
          to call — or use WhatsApp below.
        </p>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-3">
        <div className={statCardBg}>
          <IconReceipt className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-rose-deep/45 dark:text-rose/50" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            Orders
          </p>
          <p className="mt-2 font-display text-[2.5rem] font-semibold leading-none tabular-nums text-ink dark:text-cream">
            {orders.length}
          </p>
          <Link
            to="/profile"
            className="mt-auto inline-block pt-4 text-xs font-semibold text-rose-deep hover:underline dark:text-rose"
          >
            Full history →
          </Link>
        </div>
        <div className={statCardBg}>
          <IconHeart className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-rose-deep/45 dark:text-rose/50" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            Saved
          </p>
          <p className="mt-2 font-display text-[2.5rem] font-semibold leading-none tabular-nums text-ink dark:text-cream">
            {wishlistIds.length}
          </p>
          <Link
            to="/profile"
            className="mt-auto inline-block pt-4 text-xs font-semibold text-rose-deep hover:underline dark:text-rose"
          >
            Wishlist →
          </Link>
        </div>
        <div className={statCardBg}>
          <IconBag className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-rose-deep/45 dark:text-rose/50" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            Bag
          </p>
          <p className="mt-2 font-display text-[2.5rem] font-semibold leading-none tabular-nums text-ink dark:text-cream">
            {cartCount}
          </p>
          <p className="mt-auto pt-4 text-xs text-muted dark:text-dark-muted">
            {cartCount ? formatRwf(cartValue) + ' subtotal' : 'Empty'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/shop"
          className={`${ctaH} bg-rose text-ink shadow-premium hover:bg-rose-deep/90 dark:hover:bg-rose/80`}
        >
          Continue shopping
        </Link>
        <Link
          to="/cart"
          className={`${ctaH} bg-ink text-cream shadow-premium hover:bg-ink/90 dark:bg-cream dark:text-ink dark:hover:bg-cream/90`}
        >
          View bag
        </Link>
        <a href={waHelp} target="_blank" rel="noreferrer" className={`${ctaH} border-[1.5px] border-ink/25 bg-transparent text-ink hover:border-rose-deep/50 hover:bg-rose/15 dark:border-cream/25 dark:text-cream dark:hover:bg-rose/10`}>
          <IconWhatsApp className="h-5 w-5 shrink-0 text-[#128C7E]" />
          WhatsApp us
        </a>
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-cream">
          Your orders &amp; shipping
        </h2>
        <p className="mt-1 text-sm text-muted dark:text-dark-muted">
          Staff update these stages in the admin portal — your view refreshes automatically.
        </p>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted dark:text-dark-muted">
            No orders yet — your first gift is a tap away.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {recent.map((o) => (
              <CustomerOrderCard
                key={o.id}
                order={o}
                extras={<OrderCustomerExtras order={o} />}
                footer={<OrderLifecycleInline status={o.status} />}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
