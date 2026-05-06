import { type FormEvent, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { DeliveryOption, PaymentMethod } from '../models/order'
import { getProductById } from '../services/productQueries'
import { deliveryFeeRwf, formatRwf } from '../services/currency'
import { useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { useHubStore } from '../store/useHubStore'
import { Button } from '../widgets/Button'
import { CheckoutProgress } from '../widgets/CheckoutProgress'
import { Input } from '../widgets/Input'
import { TextArea } from '../widgets/TextArea'
import { ProductImage } from '../widgets/ProductImage'

type CheckoutLocationState = { discountRwf?: number }

export function CheckoutScreen() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const discountRwf = (state as CheckoutLocationState | null)?.discountRwf ?? 0

  const cart = useHubStore((s) => s.cart)
  const placeOrder = useAuthStore((s) => s.placeOrder)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [delivery, setDelivery] = useState<DeliveryOption>('standard')
  const [payment, setPayment] = useState<PaymentMethod>('cod')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const productsSnap = useCatalogStore((s) => s.products)
  const validateCartStock = useCatalogStore((s) => s.validateCartStock)
  const stockPreCheck = useMemo(
    () => validateCartStock(cart),
    [validateCartStock, cart, productsSnap],
  )

  const { subtotal, items } = useMemo(() => {
    const items = cart.map((line) => {
      const p = getProductById(line.productId)
      return { line, product: p }
    })
    const subtotal = items.reduce(
      (s, { line, product }) => s + (product?.priceRwf ?? 0) * line.quantity,
      0,
    )
    return { subtotal, items }
  }, [cart])

  const fee = deliveryFeeRwf(delivery)
  const total = Math.max(0, subtotal + fee - discountRwf)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setCheckoutError(null)
    if (!name.trim() || !phone.trim() || !address.trim()) return
    const res = await placeOrder({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
      delivery,
      payment,
      discountRwf,
    })
    if (!res.ok) {
      setCheckoutError(res.error)
      return
    }
    navigate('/profile', { replace: true, state: { justOrdered: true } })
  }

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted dark:text-dark-muted">Your bag is empty.</p>
        <Button variant="secondary" className="mt-6" onClick={() => navigate('/shop')}>
          Browse shop
        </Button>
      </div>
    )
  }

  const deliveryOpts: { id: DeliveryOption; label: string; hint: string }[] = [
    { id: 'pickup', label: 'Pickup — Kigali showroom', hint: 'No delivery fee' },
    { id: 'standard', label: 'Standard delivery', hint: formatRwf(deliveryFeeRwf('standard')) },
    { id: 'express', label: 'Express delivery', hint: formatRwf(deliveryFeeRwf('express')) },
  ]

  const payOpts: { id: PaymentMethod; label: string }[] = [
    { id: 'cod', label: 'Cash on delivery' },
    { id: 'mtn', label: 'MTN Mobile Money' },
    { id: 'airtel', label: 'Airtel Money' },
  ]

  return (
    <div>
      <CheckoutProgress step={2} />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <form onSubmit={submit} className="space-y-7">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl dark:text-cream">
              Checkout
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted dark:text-dark-muted">
              Almost there — your details are encrypted in transit and never shared.
            </p>
          </div>

          {checkoutError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/45 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-100"
            >
              {checkoutError}
            </div>
          )}
          {!stockPreCheck.ok && (
            <div
              role="status"
              className="rounded-xl border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
            >
              {(stockPreCheck as { ok: false; error: string }).error}{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => navigate('/cart')}
              >
                Back to bag
              </button>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink dark:text-cream">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink dark:text-cream">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="+250 …"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink dark:text-cream">Delivery address</label>
            <TextArea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder="District, street, landmarks…"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink dark:text-cream">Order notes (optional)</label>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-ink dark:text-cream">Delivery</legend>
            <div className="space-y-2">
              {deliveryOpts.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 text-sm transition nyanja-card !px-4 !py-3.5 ${
                    delivery === o.id
                      ? '!border-rose border-2 bg-rose/20 shadow-sm dark:border-rose dark:bg-rose/15'
                      : 'hover:border-rose/45'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === o.id}
                      onChange={() => setDelivery(o.id)}
                      className="accent-rose"
                    />
                    <span className="font-medium text-ink dark:text-cream">{o.label}</span>
                  </span>
                  <span className="text-xs text-muted dark:text-dark-muted">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-ink dark:text-cream">Payment</legend>
            <div className="space-y-2">
              {payOpts.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-3 text-sm transition nyanja-card !px-4 !py-3.5 ${
                    payment === o.id
                      ? '!border-rose border-2 bg-rose/20 shadow-sm dark:border-rose dark:bg-rose/15'
                      : 'hover:border-rose/45'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === o.id}
                    onChange={() => setPayment(o.id)}
                    className="accent-rose"
                  />
                  <span className="font-medium text-ink dark:text-cream">{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button
            type="submit"
            variant="primary"
            className="w-full !min-h-[3.5rem] !text-[15px] font-semibold shadow-lg disabled:opacity-50"
            disabled={!stockPreCheck.ok}
          >
            Place order · {formatRwf(total)}
          </Button>
        </form>

        <aside className="nyanja-card lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-cream">
            Order summary
          </h2>
          <ul className="mt-5 space-y-4">
            {items.map(({ line, product }) => {
              if (!product) return null
              return (
                <li key={line.productId} className="flex gap-3 text-sm">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-ink/8 dark:bg-dark-elevated dark:ring-cream/10">
                    <ProductImage
                      fill
                      src={product.images[0]}
                      alt={product.name}
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink dark:text-cream">{product.name}</p>
                    <p className="text-muted dark:text-dark-muted">
                      ×{line.quantity} · {formatRwf(product.priceRwf * line.quantity)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 rounded-xl border border-ink/8 bg-cream/40 px-4 py-3 text-xs leading-relaxed text-muted dark:border-cream/10 dark:bg-dark-elevated/60 dark:text-dark-muted">
            We&apos;ll text you when your order ships. Questions? Reply to your confirmation or WhatsApp us from the home screen.
          </p>

          <div className="mt-6 space-y-2 border-t border-ink/10 pt-6 text-sm dark:border-cream/10">
            <div className="flex justify-between text-muted dark:text-dark-muted">
              <span>Subtotal</span>
              <span>{formatRwf(subtotal)}</span>
            </div>
            {discountRwf > 0 && (
              <div className="flex justify-between text-rose-deep dark:text-rose">
                <span>Promo</span>
                <span>−{formatRwf(discountRwf)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted dark:text-dark-muted">
              <span>Delivery</span>
              <span>{formatRwf(fee)}</span>
            </div>
          </div>

          <div className="nyanja-card !bg-gradient-to-br from-rose/25 via-cream/35 to-white/90 dark:!from-rose/15 dark:!via-dark-elevated dark:!to-dark-surface">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted dark:text-dark-muted">
              Order total
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink dark:text-cream">
              {formatRwf(total)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
