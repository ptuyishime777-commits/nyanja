import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PlacedOrder } from '../models/order'
import {
  phoneToDigits,
  telHrefFromDisplay,
  whatsAppHref,
} from '../services/phoneLinks'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from './Button'

type Props = {
  order: PlacedOrder
}

type RatingRow = { productId: string; name: string; stars: number; text: string }

export function OrderCustomerExtras({ order }: Props) {
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const updateOrderStatus = useAuthStore((s) => s.updateOrderStatus)
  const submitOrderProductReviews = useAuthStore((s) => s.submitOrderProductReviews)

  const [dialog, setDialog] = useState<null | 'confirm' | 'rate'>(null)
  const [ratingRows, setRatingRows] = useState<RatingRow[]>([])

  const owned = order.userId === sessionUserId

  const uniqueLines = useMemo(() => {
    const seen = new Set<string>()
    const out: { productId: string; name: string }[] = []
    for (const line of order.items) {
      if (seen.has(line.productId)) continue
      seen.add(line.productId)
      out.push({ productId: line.productId, name: line.name })
    }
    return out
  }, [order.items])

  useEffect(() => {
    if (dialog === 'rate') {
      setRatingRows(
        uniqueLines.map((l) => ({
          productId: l.productId,
          name: l.name,
          stars: 5,
          text: '',
        })),
      )
    }
  }, [dialog, uniqueLines])

  if (!owned) return null

  const showCourier =
    order.status === 'shipped' &&
    !!(order.deliveryPersonName?.trim() || order.deliveryPersonPhone?.trim())

  const courierTel =
    order.deliveryPersonPhone?.trim()
      ? telHrefFromDisplay(order.deliveryPersonPhone)
      : '#'
  const courierDigits = order.deliveryPersonPhone
    ? phoneToDigits(order.deliveryPersonPhone)
    : ''
  const waCourier =
    courierDigits.length >= 9
      ? whatsAppHref(
          courierDigits,
          `Hello, I have a question about my order ${order.id}`,
        )
      : '#'

  const showReceivedBtn = order.status === 'shipped' && order.orderReviewAvg == null

  const showThanks =
    order.status === 'delivered' && order.orderReviewAvg != null

  const showRateLater =
    order.status === 'delivered' && order.orderReviewAvg == null

  const onConfirmDelivery = async () => {
    await updateOrderStatus(order.id, 'delivered')
    setDialog('rate')
  }

  const onSubmitReviews = async () => {
    await submitOrderProductReviews(
      order.id,
      ratingRows.map((r) => ({
        productId: r.productId,
        rating: r.stars,
        text: r.text,
      })),
    )
    setDialog(null)
  }

  const modalHost =
    typeof document !== 'undefined' && document.body ? document.body : null

  const renderDialog = () => {
    if (!dialog || !modalHost) return null

    if (dialog === 'confirm') {
      return createPortal(
        <div
          className="fixed inset-0 z-[10001] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center dark:bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delivery-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialog(null)
          }}
        >
          <div className="w-full max-w-sm rounded-[1.25rem] border border-ink/10 bg-surface p-6 shadow-lift dark:border-cream/15 dark:bg-dark-surface">
            <h2
              id="confirm-delivery-title"
              className="font-display text-lg font-semibold text-ink dark:text-cream"
            >
              Confirm delivery
            </h2>
            <p className="mt-3 text-sm text-muted dark:text-dark-muted">
              Did you receive all your items in good condition?
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 !min-h-11"
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 !min-h-11"
                onClick={onConfirmDelivery}
              >
                Yes, confirm
              </Button>
            </div>
          </div>
        </div>,
        modalHost,
      )
    }

    return createPortal(
      <div
        className="fixed inset-0 z-[10001] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center dark:bg-black/55"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-order-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(null)
        }}
      >
        <div className="max-h-[min(88vh,620px)] w-full max-w-md overflow-y-auto rounded-[1.25rem] border border-ink/10 bg-surface p-6 shadow-lift dark:border-cream/15 dark:bg-dark-surface">
          <h2
            id="rate-order-title"
            className="font-display text-lg font-semibold text-ink dark:text-cream"
          >
            Rate your items
          </h2>
          <p className="mt-2 text-sm text-muted dark:text-dark-muted">
            One rating per product, optional note with each star rating.
          </p>
          <div className="mt-5 space-y-5">
            {ratingRows.map((row, idx) => (
              <div
                key={row.productId}
                className="rounded-xl border border-[#f0ece8] bg-cream/30 px-4 py-3 dark:border-cream/10 dark:bg-dark-elevated/40"
              >
                <p className="font-medium text-ink dark:text-cream">{row.name}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} stars`}
                      className={`rounded-lg px-2 py-1 text-lg transition ${
                        row.stars >= n
                          ? 'bg-rose/45 text-ink dark:bg-rose/25 dark:text-cream'
                          : 'bg-white/60 text-muted opacity-60 dark:bg-dark-surface dark:text-dark-muted'
                      }`}
                      onClick={() => {
                        setRatingRows((prev) => {
                          const next = [...prev]
                          const cur = next[idx]
                          if (!cur) return prev
                          next[idx] = { ...cur, stars: n }
                          return next
                        })
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                  Note (optional)
                  <textarea
                    value={row.text}
                    onChange={(e) => {
                      const v = e.target.value
                      setRatingRows((prev) => {
                        const next = [...prev]
                        const cur = next[idx]
                        if (!cur) return prev
                        next[idx] = { ...cur, text: v }
                        return next
                      })
                    }}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-xl border border-ink/12 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rose-deep dark:border-cream/15 dark:bg-dark-surface dark:text-cream"
                    placeholder="Short feedback…"
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              className="w-full !min-h-11 sm:flex-1"
              onClick={() => setDialog(null)}
            >
              Skip for now
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full !min-h-11 sm:flex-1"
              onClick={onSubmitReviews}
            >
              Send review
            </Button>
          </div>
        </div>
      </div>,
      modalHost,
    )
  }

  return (
    <>
      {showCourier ? (
        <div
          className="mt-4 rounded-xl border border-[#f0ece8] border-l-4 border-l-[#2a2826] bg-rose/25 px-4 py-3.5 dark:border-cream/12 dark:border-l-cream/55 dark:bg-rose/15"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 dark:text-cream/90">
            🛵 Your delivery person
          </p>
          {order.deliveryPersonName?.trim() ? (
            <p className="mt-1 font-medium text-ink dark:text-cream">
              {order.deliveryPersonName.trim()}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {order.deliveryPersonPhone?.trim() ? (
              <span className="tabular-nums text-muted dark:text-dark-muted">
                {order.deliveryPersonPhone.trim()}
              </span>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {order.deliveryPersonPhone?.trim() ? (
                <a
                  href={courierTel === '#' ? undefined : courierTel}
                  className="inline-flex min-h-9 items-center rounded-full border border-ink/15 bg-white/80 px-3 text-xs font-semibold text-ink transition hover:bg-cream/60 dark:border-cream/20 dark:bg-dark-elevated dark:text-cream dark:hover:bg-dark-surface"
                >
                  Call
                </a>
              ) : null}
              {courierDigits.length >= 9 ? (
                <a
                  href={waCourier}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center rounded-full border border-[#128C7E]/40 bg-white/80 px-3 text-xs font-semibold text-[#0d6e5c] transition hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-dark-elevated dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showReceivedBtn ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full !min-h-12"
          onClick={() => setDialog('confirm')}
        >
          I received my order
        </Button>
      ) : null}

      {showRateLater ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full !min-h-11"
          onClick={() => setDialog('rate')}
        >
          Rate your items
        </Button>
      ) : null}

      {showThanks ? (
        <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Thanks for your review!
        </p>
      ) : null}

      {renderDialog()}
    </>
  )
}
