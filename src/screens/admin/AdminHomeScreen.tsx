import type { ComponentType } from 'react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatRwf } from '../../services/currency'
import { WHATSAPP_DISPLAY } from '../../services/whatsapp'
import { useAuthStore } from '../../store/useAuthStore'
import { useCatalogStore } from '../../store/useCatalogStore'

function IconOrders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M9 5H5a2 2 0 00-2 2v4M15 5h4a2 2 0 012 2v4M9 19H5a2 2 0 01-2-2v-4M15 19h4a2 2 0 002-2v-4" strokeLinecap="round" />
      <path d="M9 12h6" strokeLinecap="round" />
    </svg>
  )
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 19V5M4 19h16M8 15v3M12 10v8M16 6v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSku({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 12.5V5a1 1 0 011-1h7.5L20 11.35a1.75 1.75 0 010 2.45l-6.6 6.6a2 2 0 01-2.83 0L4 12.94" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="7.75" r="1.15" fill="currentColor" />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="9" cy="8" r="2.75" />
      <path d="M3 20a6 6 0 0112 0" strokeLinecap="round" />
      <path d="M17 10.5a3 3 0 013 3M15 20a5.5 5.5 0 013.2-5" strokeLinecap="round" />
    </svg>
  )
}

function IconCartReview({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 10h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10zm3-6a3 3 0 016 0v4H9V4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStore({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10V8a2 2 0 012-2h12a2 2 0 012 2v2M4 10h16M6 10v10a1 1 0 001 1h10a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  )
}

function IconArrowLink({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WhatsAppBrandIcon({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] shadow-sm ${className ?? ''}`}
      aria-hidden
    >
      <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.123 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </span>
  )
}

type StatCardSpec = {
  label: string
  value: string
  hint: string
  topBorder: string
  Icon: ComponentType<{ className?: string }>
}

export function AdminHomeScreen() {
  const buckets = useAuthStore((s) => s.buckets)
  const products = useCatalogStore((s) => s.products)
  const orders = useMemo(
    () =>
      Object.values(buckets)
        .flatMap((b) => b.orders)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [buckets],
  )

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + o.totalRwf, 0)
    const awaiting = orders.filter(
      (o) => o.status === 'processing' || o.status === 'pending',
    ).length
    return {
      orderCount: orders.length,
      revenue,
      pending: awaiting,
      skuCount: products.length,
    }
  }, [orders, products.length])

  const cards: StatCardSpec[] = [
    {
      label: 'Total orders',
      value: String(stats.orderCount),
      hint: 'All time',
      topBorder: 'border-t-rose-deep',
      Icon: IconOrders,
    },
    {
      label: 'Revenue (stored)',
      value: formatRwf(stats.revenue),
      hint: 'Sum of order totals',
      topBorder: 'border-t-ink dark:border-t-cream/80',
      Icon: IconChart,
    },
    {
      label: 'Pending fulfilment',
      value: String(stats.pending),
      hint: 'Pending & in process',
      topBorder: 'border-t-amber-600/85 dark:border-t-amber-500/75',
      Icon: IconClock,
    },
    {
      label: 'SKU in catalog',
      value: String(stats.skuCount),
      hint: 'Local product list',
      topBorder: 'border-t-[#d4a5a9] dark:border-t-rose/75',
      Icon: IconSku,
    },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Overview
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted dark:text-dark-muted">
          Snapshot of your shop data on this device. Connect a backend later for live inventory and payouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden nyanja-card pb-5 pl-5 pr-14 pt-[1.15rem] border-t-[3px] ${c.topBorder}`}
          >
            <c.Icon className="absolute right-4 top-[1.125rem] h-9 w-9 text-muted/45 dark:text-cream/30" aria-hidden />
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-dark-muted">
              {c.label}
            </p>
            <p className="mt-2.5 font-display text-[1.625rem] font-semibold tracking-tight [font-variant-numeric:tabular-nums]">
              {c.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted dark:text-dark-muted">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="nyanja-card !bg-cream/40 dark:!bg-dark-surface/65">
          <div className="border-b border-ink/[0.08] pb-5 dark:border-cream/[0.1]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
              Shortcuts
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink dark:text-cream">
              Quick actions
            </h2>
          </div>
          <ul className="mt-6 space-y-4 text-[15px]">
            <li>
              <Link
                className="group inline-flex w-full items-center gap-3 font-semibold text-rose-deep transition hover:text-rose-deep/85 dark:text-rose dark:hover:text-rose/90"
                to="/admin/users"
              >
                <IconUsers className="h-5 w-5 shrink-0 text-ink/50 transition group-hover:text-rose-deep dark:text-cream/45 dark:group-hover:text-rose" />
                <span className="border-b border-transparent pb-px transition group-hover:border-rose-deep/70 dark:group-hover:border-rose/60">
                  Manage users
                </span>
                <IconArrowLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                className="group inline-flex w-full items-center gap-3 font-semibold text-rose-deep transition hover:text-rose-deep/85 dark:text-rose dark:hover:text-rose/90"
                to="/admin/orders"
              >
                <IconCartReview className="h-5 w-5 shrink-0 text-ink/50 transition group-hover:text-rose-deep dark:text-cream/45 dark:group-hover:text-rose" />
                <span className="border-b border-transparent pb-px transition group-hover:border-rose-deep/70 dark:group-hover:border-rose/60">
                  Review orders
                </span>
                <IconArrowLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                className="group inline-flex w-full items-center gap-3 font-semibold text-rose-deep transition hover:text-rose-deep/85 dark:text-rose dark:hover:text-rose/90"
                to="/admin/products"
              >
                <IconSku className="h-5 w-5 shrink-0 text-ink/50 transition group-hover:text-rose-deep dark:text-cream/45 dark:group-hover:text-rose" />
                <span className="border-b border-transparent pb-px transition group-hover:border-rose-deep/70 dark:group-hover:border-rose/60">
                  View catalog
                </span>
                <IconArrowLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                className="group inline-flex w-full items-center gap-3 font-semibold text-rose-deep transition hover:text-rose-deep/85 dark:text-rose dark:hover:text-rose/90"
                to="/"
              >
                <IconStore className="h-5 w-5 shrink-0 text-ink/50 transition group-hover:text-rose-deep dark:text-cream/45 dark:group-hover:text-rose" />
                <span className="border-b border-transparent pb-px transition group-hover:border-rose-deep/70 dark:group-hover:border-rose/60">
                  Open storefront
                </span>
                <IconArrowLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
              </Link>
            </li>
          </ul>
        </div>

        <div className="nyanja-card relative overflow-hidden !border-l-[3px] !border-l-emerald-600/55 dark:!border-l-emerald-500/45">
          <div className="flex flex-wrap items-start gap-4">
            <WhatsAppBrandIcon />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-cream">
                WhatsApp orders
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted dark:text-dark-muted">
                Customer chat routes to your business line. The floating button on the storefront opens a prefilled
                message on this number.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-ink/[0.08] bg-[#faf8f6]/95 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-cream/15 dark:bg-dark-elevated/90">
                <span className="font-mono text-sm font-semibold tracking-wide text-ink [font-variant-numeric:tabular-nums] dark:text-cream">
                  {WHATSAPP_DISPLAY}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
