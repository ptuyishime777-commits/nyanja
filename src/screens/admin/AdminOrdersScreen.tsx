import { Fragment, useEffect, useMemo, useState } from 'react'
import type {
  DeliveryOption,
  OrderLine,
  OrderStatus,
  PaymentMethod,
} from '../../models/order'
import { formatRwf } from '../../services/currency'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../../widgets/Button'
import { Input } from '../../widgets/Input'

const STATUSES_ALL: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const STATUS_DISPLAY: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending:
    'border border-amber-400/65 bg-amber-100 text-amber-950 hover:bg-amber-200/95 dark:border-amber-500/55 dark:bg-amber-950/45 dark:text-amber-50 dark:hover:bg-amber-950/70',
  processing:
    'border border-blue-400/65 bg-blue-100 text-blue-950 hover:bg-blue-200/95 dark:border-blue-500/50 dark:bg-blue-950/50 dark:text-blue-50 dark:hover:bg-blue-950/65',
  shipped:
    'border border-rose-deep/45 bg-[#f8e1e6] text-[#432b30] hover:bg-[#f0cdd5] dark:border-rose/40 dark:bg-rose/25 dark:text-cream dark:hover:bg-rose/35',
  delivered:
    'border border-emerald-500/55 bg-emerald-100 text-emerald-950 hover:bg-emerald-200/90 dark:border-emerald-500/45 dark:bg-emerald-950/55 dark:text-emerald-50 dark:hover:bg-emerald-950/70',
  cancelled:
    'border border-red-500/55 bg-red-100 text-red-950 hover:bg-red-200/90 dark:border-red-500/50 dark:bg-red-950/55 dark:text-red-50 dark:hover:bg-red-950/72',
}

const PAYMENT_PILLS: Record<
  PaymentMethod,
  { label: string; className: string }
> = {
  mtn: {
    label: 'MTN',
    className:
      'border border-yellow-700/55 bg-yellow-400 text-stone-900 dark:bg-amber-400 dark:border-amber-600/60 dark:text-stone-950',
  },
  airtel: {
    label: 'AIRTEL',
    className:
      'border border-red-700/65 bg-red-600 text-white dark:bg-red-700 dark:border-red-500',
  },
  cod: {
    label: 'COD',
    className:
      'border border-neutral-400/65 bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-50',
  },
}

type PillFilter = 'all' | 'pending' | 'shipped' | 'delivered'

type Row = {
  rowKey: string
  orderId: string
  userId: string
  userEmail: string
  createdAt: string
  status: OrderStatus
  totalRwf: number
  deliveryOption: DeliveryOption
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerAddress: string
  notes?: string
  items: OrderLine[]
  deliveryPersonName?: string
  deliveryPersonPhone?: string
  orderReviewAvg?: number
}

function AdminDeliveryEditor({
  orderId,
  userId,
}: {
  orderId: string
  userId: string
}) {
  const live = useAuthStore((s) =>
    s.buckets[userId]?.orders.find((o) => o.id === orderId),
  )
  const updateOrderDeliveryInfo = useAuthStore(
    (s) => s.updateOrderDeliveryInfo,
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    setName(live?.deliveryPersonName?.trim() ?? '')
    setPhone(live?.deliveryPersonPhone?.trim() ?? '')
  }, [live?.deliveryPersonName, live?.deliveryPersonPhone, orderId])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[10rem] flex-1">
        <label
          className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted"
          htmlFor={`dname-${orderId}`}
        >
          Delivery person — name
        </label>
        <Input
          id={`dname-${orderId}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jean Pierre"
          className="mt-1"
        />
      </div>
      <div className="min-w-[10rem] flex-1">
        <label
          className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted"
          htmlFor={`dphone-${orderId}`}
        >
          Phone
        </label>
        <Input
          id={`dphone-${orderId}`}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+250 788 123 456"
          className="mt-1"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="!min-h-10 shrink-0"
                        onClick={() => void updateOrderDeliveryInfo(orderId, name, phone)}
      >
        Save delivery info
      </Button>
    </div>
  )
}

function stripTime(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

export function AdminOrdersScreen() {
  const users = useAuthStore((s) => s.users)
  const buckets = useAuthStore((s) => s.buckets)
  const updateOrderStatus = useAuthStore((s) => s.updateOrderStatus)

  const [pill, setPill] = useState<PillFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQ, setSearchQ] = useState('')

  const [detailRow, setDetailRow] = useState<Row | null>(null)
  const [statusMenuKey, setStatusMenuKey] = useState<string | null>(null)

  const detailLive = useAuthStore((s) =>
    detailRow
      ? s.buckets[detailRow.userId]?.orders.find((o) => o.id === detailRow.orderId)
      : undefined,
  )

  useEffect(() => {
    if (!statusMenuKey) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusMenuKey(null)
    }
    const onPointerDown = () => setStatusMenuKey(null)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('click', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('click', onPointerDown)
    }
  }, [statusMenuKey])

  const rows = useMemo(() => {
    const list: Row[] = []
    for (const uid of Object.keys(buckets)) {
      const b = buckets[uid]!
      const email =
        users.find((u) => u.id === uid)?.email ?? `(unknown ${uid.slice(0, 6)}…)`
      for (const o of b.orders) {
        list.push({
          rowKey: `${uid}:${o.id}`,
          orderId: o.id,
          userId: uid,
          userEmail: email,
          createdAt: o.createdAt,
          status: o.status,
          totalRwf: o.totalRwf,
          deliveryOption: o.deliveryOption,
          paymentMethod: o.paymentMethod,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAddress: o.customerAddress,
          notes: o.notes,
          items: o.items,
          deliveryPersonName: o.deliveryPersonName,
          deliveryPersonPhone: o.deliveryPersonPhone,
          orderReviewAvg: o.orderReviewAvg,
        })
      }
    }
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [buckets, users])

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase()

    let fromMs: number | null = null
    let toMs: number | null = null
    if (dateFrom) fromMs = stripTime(new Date(dateFrom))
    if (dateTo) toMs = stripTime(new Date(dateTo))

    return rows.filter((r) => {
      if (pill !== 'all') {
        if (pill === 'pending') {
          if (r.status !== 'pending' && r.status !== 'processing') return false
        }
        if (pill === 'shipped' && r.status !== 'shipped') return false
        if (pill === 'delivered' && r.status !== 'delivered') return false
      }

      const created = new Date(r.createdAt).getTime()
      if (fromMs !== null && created < fromMs) return false
      if (toMs !== null && created > toMs + 86400000 - 1) return false

      if (q) {
        const hit =
          r.orderId.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [rows, pill, dateFrom, dateTo, searchQ])

  const pills: { key: PillFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    {
      key: 'pending',
      label: 'Pending',
    },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Orders
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-dark-muted">
          Fulfillment status for every account. Updates appear instantly on each
          customer&apos;s dashboard and order history.
        </p>
      </div>

      <div className="flex flex-col gap-4 nyanja-card md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => {
            const active = pill === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPill(p.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                    : 'border border-ink/12 bg-cream/50 text-ink hover:border-rose/35 hover:bg-rose/20 dark:border-cream/15 dark:bg-dark-elevated dark:text-cream dark:hover:bg-rose/15'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 md:ml-auto md:justify-end">
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-10 rounded-xl border border-ink/15 bg-surface px-3 text-sm font-medium text-ink outline-none transition focus:border-rose-deep dark:border-cream/20 dark:bg-dark-elevated dark:text-cream"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-10 rounded-xl border border-ink/15 bg-surface px-3 text-sm font-medium text-ink outline-none transition focus:border-rose-deep dark:border-cream/20 dark:bg-dark-elevated dark:text-cream"
            />
          </label>
        </div>

        <div className="w-full md:max-w-xs md:flex-1">
          <label className="sr-only" htmlFor="admin-order-search">
            Search orders
          </label>
          <Input
            id="admin-order-search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search order # or customer…"
            className="shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-ink/8 bg-white/60 dark:border-cream/10 dark:bg-dark-surface/70">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-[11px] font-semibold uppercase tracking-wider text-muted dark:border-cream/10 dark:text-dark-muted">
              <th className="px-4 py-4">Order</th>
              <th className="max-w-[14rem] px-4 py-4">Customer</th>
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Items</th>
              <th className="px-4 py-4">Total</th>
              <th className="px-4 py-4">Delivery</th>
              <th className="px-4 py-4">Payment</th>
              <th className="px-4 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-muted dark:text-dark-muted"
                >
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const pm = PAYMENT_PILLS[r.paymentMethod]
                const itemCount = r.items.reduce((n, l) => n + l.quantity, 0)
                return (
                  <Fragment key={r.rowKey}>
                    <tr className="border-b border-ink/6 transition-colors hover:bg-[#faf8f6] dark:border-cream/10 dark:hover:bg-dark-elevated/45">
                    <td className="px-4 py-4 align-middle">
                      <button
                        type="button"
                        className="font-mono text-sm font-semibold text-rose-deep underline-offset-4 transition hover:text-rose-deep hover:underline dark:text-rose"
                        onClick={() => setDetailRow(r)}
                      >
                        {r.orderId}
                      </button>
                    </td>
                    <td className="max-w-[14rem] px-4 py-4 align-middle">
                      <p className="font-medium text-ink dark:text-cream">{r.customerName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted dark:text-dark-muted">
                        {r.userEmail}
                      </p>
                      <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">{r.customerPhone}</p>
                    </td>
                    <td className="px-4 py-4 align-middle text-muted dark:text-dark-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="group relative px-4 py-4 align-middle">
                      <span
                        className="inline-block cursor-default border-b border-dotted border-muted/60 text-ink transition group-hover:border-rose-deep/50 dark:border-dark-muted dark:text-cream dark:group-hover:border-rose/50"
                        title={r.items.map((ln) => `${ln.name} ×${ln.quantity}`).join('; ')}
                      >
                        {itemCount === 1 ? '1 item' : `${itemCount} items`}
                      </span>
                      <div className="pointer-events-none invisible absolute left-0 top-[calc(100%-2px)] z-30 rounded-xl border border-ink/10 bg-surface px-4 pb-3 pt-2 text-xs opacity-0 shadow-[0_12px_48px_rgba(0,0,0,0.12)] transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 dark:border-cream/15 dark:bg-dark-elevated">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-dark-muted">
                          Line items
                        </p>
                        <ul className="space-y-1 text-ink dark:text-cream">
                          {r.items.map((ln, idx) => (
                            <li key={`${ln.productId}:${idx}:${ln.name}`}>
                              <span className="font-medium">{ln.name}</span>
                              {' · '}
                              <span className="text-muted dark:text-dark-muted">×{ln.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle font-medium [font-variant-numeric:tabular-nums]">
                      {formatRwf(r.totalRwf)}
                    </td>
                    <td className="px-4 py-4 align-middle capitalize text-muted dark:text-dark-muted whitespace-nowrap">
                      {r.deliveryOption}
                    </td>
                    <td className="px-4 py-4 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm ${pm.className}`}
                      >
                        {pm.label}
                      </span>
                    </td>
                    <td className="relative px-4 py-4 align-middle">
                      <button
                        type="button"
                        aria-expanded={statusMenuKey === r.rowKey}
                        aria-haspopup="listbox"
                        className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition ${STATUS_CLASSES[r.status]}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatusMenuKey((prev) =>
                            prev === r.rowKey ? null : r.rowKey,
                          )
                        }}
                      >
                        {STATUS_DISPLAY[r.status]}
                      </button>

                      {statusMenuKey === r.rowKey ? (
                        <div
                          role="listbox"
                          className="absolute right-4 top-[calc(100%-0.25rem)] z-40 mt-2 min-w-[11rem] rounded-xl border border-ink/10 bg-surface p-1.5 shadow-[0_12px_44px_rgba(0,0,0,0.14)] dark:border-cream/15 dark:bg-dark-elevated"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STATUSES_ALL.map((st) => (
                            <button
                              key={st}
                              type="button"
                              role="option"
                              aria-selected={st === r.status}
                              className={`flex w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition first:rounded-t-lg last:rounded-b-lg hover:bg-cream/60 dark:hover:bg-dark-surface ${st === r.status ? 'text-rose-deep dark:text-rose' : 'text-ink dark:text-cream'}`}
                              onClick={() => {
                                void updateOrderStatus(r.orderId, st)
                                setStatusMenuKey(null)
                              }}
                            >
                              {STATUS_DISPLAY[st]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-1.5">
                        {r.deliveryPersonName?.trim() || r.deliveryPersonPhone?.trim() ? (
                          <p className="max-w-[13rem] text-[10px] leading-snug text-ink dark:text-cream">
                            🛵 {r.deliveryPersonName?.trim()}
                            {r.deliveryPersonName?.trim() && r.deliveryPersonPhone?.trim()
                              ? ' · '
                              : ' '}
                            {r.deliveryPersonPhone?.trim()}
                          </p>
                        ) : null}
                        {r.orderReviewAvg != null ? (
                          <span className="inline-flex rounded-full border border-emerald-200/90 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/55 dark:text-emerald-200">
                            Rated ★ {r.orderReviewAvg}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-ink/6 bg-[#faf8f6] dark:border-cream/10 dark:bg-dark-elevated/25">
                    <td colSpan={8} className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                        Delivery person
                      </p>
                      <div className="mt-2">
                        <AdminDeliveryEditor
                          orderId={r.orderId}
                          userId={r.userId}
                        />
                      </div>
                    </td>
                  </tr>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {detailRow ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center dark:bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailRow(null)
          }}
        >
          <div className="max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-[1.25rem] border border-ink/10 bg-surface shadow-lift dark:border-cream/15 dark:bg-dark-surface">
            <div className="flex items-start justify-between gap-4 border-b border-ink/8 px-6 py-4 dark:border-cream/10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                  Order
                </p>
                <p
                  id="order-detail-title"
                  className="mt-1 font-mono text-lg font-semibold text-rose-deep dark:text-rose"
                >
                  {detailRow.orderId}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="!min-h-9 shrink-0"
                onClick={() => setDetailRow(null)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm">
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                  Customer
                </h3>
                <p className="mt-2 font-semibold text-ink dark:text-cream">
                  {detailRow.customerName}
                </p>
                <p className="mt-1 text-muted dark:text-dark-muted">{detailRow.userEmail}</p>
                <p className="mt-2 text-muted dark:text-dark-muted">{detailRow.customerPhone}</p>
              </section>

              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                  Address & delivery
                </h3>
                <p className="mt-2 text-ink dark:text-cream">{detailRow.customerAddress}</p>
                <p className="mt-1 capitalize text-muted dark:text-dark-muted">
                  Delivery: <span className="font-medium">{detailRow.deliveryOption}</span>
                </p>
              </section>

              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                  Items
                </h3>
                <ul className="mt-2 space-y-2">
                  {detailRow.items.map((ln, i) => (
                    <li key={`${detailRow.rowKey}:${i}:${ln.productId}`} className="text-ink dark:text-cream">
                      <span className="font-medium">{ln.name}</span>{' '}
                      <span className="text-muted dark:text-dark-muted">× {ln.quantity}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">
                        {' · '}
                        {formatRwf(ln.unitPriceRwf)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-display text-xl font-semibold [font-variant-numeric:tabular-nums]">
                  {formatRwf(detailRow.totalRwf)}
                </p>
              </section>

              <section className="rounded-xl border border-[#f0ece8] bg-cream/30 px-4 py-4 dark:border-cream/12 dark:bg-dark-elevated/45">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                  Delivery person
                </h3>
                <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                  Shown to the customer only when status is Shipping (and after), never while pending.
                </p>
                <div className="mt-3">
                  <AdminDeliveryEditor
                    orderId={detailRow.orderId}
                    userId={detailRow.userId}
                  />
                </div>
                {detailLive?.deliveryPersonName?.trim() ||
                detailLive?.deliveryPersonPhone?.trim() ? (
                  <p className="mt-3 text-xs font-medium leading-relaxed text-ink dark:text-cream">
                    🛵 {detailLive?.deliveryPersonName?.trim()}
                    {detailLive?.deliveryPersonName?.trim() &&
                    detailLive?.deliveryPersonPhone?.trim()
                      ? ' · '
                      : ' '}
                    {detailLive?.deliveryPersonPhone?.trim()}
                  </p>
                ) : null}
                {detailLive?.orderReviewAvg != null ? (
                  <p className="mt-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Customer rated ★ {detailLive.orderReviewAvg}
                  </p>
                ) : null}
              </section>

              <section className="flex flex-wrap gap-4">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                    Payment
                  </h3>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm ${PAYMENT_PILLS[detailRow.paymentMethod].className}`}
                  >
                    {PAYMENT_PILLS[detailRow.paymentMethod].label}
                  </span>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                    Status
                  </h3>
                  <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${STATUS_CLASSES[detailRow.status]}`}>
                    {STATUS_DISPLAY[detailRow.status]}
                  </p>
                </div>
              </section>

              {detailRow.notes ? (
                <section className="rounded-xl border border-ink/8 bg-cream/30 px-3 py-3 dark:border-cream/10 dark:bg-dark-elevated/50">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                    Notes
                  </h3>
                  <p className="mt-2 text-xs text-ink dark:text-cream">{detailRow.notes}</p>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
