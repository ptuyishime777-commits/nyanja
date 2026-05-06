import type { CartLine } from '../models/cart'
import type {
  DeliveryOption,
  PaymentMethod,
  PlacedOrder,
} from '../models/order'
import { getProductById } from './productQueries'
import { deliveryFeeRwf } from './currency'

export interface CheckoutOrderInput {
  userId: string
  name: string
  phone: string
  address: string
  notes?: string
  delivery: DeliveryOption
  payment: PaymentMethod
  discountRwf?: number
}

export function buildPlacedOrder(
  cart: CartLine[],
  input: CheckoutOrderInput,
): PlacedOrder {
  const items = cart.map((line) => {
    const p = getProductById(line.productId)
    return {
      productId: line.productId,
      name: p?.name ?? 'Item',
      quantity: line.quantity,
      unitPriceRwf: p?.priceRwf ?? 0,
      image: p?.images[0] ?? '',
    }
  })
  const subtotal = items.reduce((sum, i) => sum + i.unitPriceRwf * i.quantity, 0)
  const fee = deliveryFeeRwf(input.delivery)
  const discount = Math.max(0, input.discountRwf ?? 0)
  const totalRwf = Math.max(0, subtotal + fee - discount)
  const notes = input.notes?.trim()

  return {
    id: `NG-${Date.now().toString().slice(-5)}`,
    userId: input.userId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    totalRwf,
    items,
    deliveryOption: input.delivery,
    paymentMethod: input.payment,
    customerName: input.name,
    customerPhone: input.phone,
    customerAddress: input.address,
    ...(notes ? { notes } : {}),
  }
}
