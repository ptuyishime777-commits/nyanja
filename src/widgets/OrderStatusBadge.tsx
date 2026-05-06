import type { OrderStatus } from '../models/order'

const base =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]'

export function OrderStatusBadge({
  status,
  deliveredReviewed,
}: {
  status: OrderStatus
  deliveredReviewed?: boolean
}) {
  switch (status) {
    case 'shipped':
      return (
        <span
          className={`${base} bg-[#f5e6e9] text-[#5c3d45] dark:bg-rose/25 dark:text-rose`}
        >
          Shipping
        </span>
      )
    case 'delivered':
      return (
        <span
          className={`${base} bg-[#e3f3e8] text-[#1f4d32] dark:bg-emerald-950/55 dark:text-emerald-300`}
        >
          {deliveredReviewed ? 'Delivered ✓' : 'Delivered'}
        </span>
      )
    case 'processing':
      return (
        <span
          className={`${base} bg-[#fff4d6] text-[#7a4d0a] dark:bg-amber-950/40 dark:text-amber-200`}
        >
          Processing
        </span>
      )
    case 'pending':
      return (
        <span
          className={`${base} bg-[#fff4d6] text-[#7a4d0a] dark:bg-amber-950/40 dark:text-amber-200`}
        >
          Pending
        </span>
      )
    case 'cancelled':
      return (
        <span className={`${base} bg-neutral-100 text-neutral-600 dark:bg-dark-elevated dark:text-dark-muted`}>
          Cancelled
        </span>
      )
    default:
      return null
  }
}
