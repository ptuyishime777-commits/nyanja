import type { ReactNode } from 'react'
import type { PlacedOrder } from '../models/order'
import { formatRwf } from '../services/currency'
import { OrderStatusBadge } from './OrderStatusBadge'

function captionForStatus(order: PlacedOrder): string {
  switch (order.status) {
    case 'pending':
      return "We've received your order — standby for fulfillment."
    case 'processing':
      return 'Your items are in process.'
    case 'shipped':
      return 'Your parcel is on the way.'
    case 'delivered':
      return 'Delivered — enjoy your gift.'
    case 'cancelled':
      return 'This order was cancelled.'
    default:
      return ''
  }
}

type Props = {
  order: PlacedOrder
  /** Extra blocks after total (e.g. delivery contact, confirm delivery) */
  extras?: ReactNode
  /** Extra block after extras (e.g. lifecycle stepper on dashboard) */
  footer?: ReactNode
}

export function CustomerOrderCard({
  order,
  extras,
  footer,
}: Props) {
  return (
    <li className="nyanja-card list-none">
      <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
        <span className="font-mono text-sm font-bold text-ink dark:text-cream">
          {order.id}
        </span>
        <OrderStatusBadge
          status={order.status}
          deliveredReviewed={
            order.status === 'delivered' && order.orderReviewAvg != null
          }
        />
      </div>
      <p className="mt-3 text-xs text-muted dark:text-dark-muted">
        {new Date(order.createdAt).toLocaleDateString(undefined, {
          dateStyle: 'medium',
        })}
        {' · '}
        {captionForStatus(order)}
      </p>
      <p className="mt-3 text-[13px] text-ink/90 dark:text-cream/90">
        <span className="font-medium text-ink dark:text-cream">{order.customerName}</span>
        {' · '}
        <span className="text-muted dark:text-dark-muted">{order.customerPhone}</span>
      </p>
      <p className="mt-2 text-[13px] leading-snug text-muted dark:text-dark-muted">
        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
      </p>
      {order.notes ? (
        <p className="mt-3 rounded-xl border border-ink/[0.08] bg-cream/40 px-3 py-2 text-xs text-ink dark:border-cream/10 dark:bg-dark-elevated/50 dark:text-cream">
          Note: {order.notes}
        </p>
      ) : null}
      <p className="mt-4 font-display text-xl font-semibold tabular-nums tracking-tight text-ink dark:text-cream md:text-[1.35rem]">
        {formatRwf(order.totalRwf)}
      </p>
      {extras ? <div className="mt-1">{extras}</div> : null}
      {footer ? <div className="mt-4 border-t border-[#f0ece8]/80 pt-4 dark:border-cream/10">{footer}</div> : null}
    </li>
  )
}
