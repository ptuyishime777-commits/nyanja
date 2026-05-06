export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type DeliveryOption = 'pickup' | 'standard' | 'express'

export type PaymentMethod = 'cod' | 'mtn' | 'airtel'

export interface OrderLine {
  productId: string
  name: string
  quantity: number
  unitPriceRwf: number
  image: string
}

export interface PlacedOrder {
  id: string
  /** Owner account — used by admin to see who placed the order */
  userId: string
  createdAt: string
  status: OrderStatus
  totalRwf: number
  items: OrderLine[]
  deliveryOption: DeliveryOption
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerAddress: string
  notes?: string
  /** Courier — shown to customer only when status is `shipped`. */
  deliveryPersonName?: string
  deliveryPersonPhone?: string
  /** Average rating after customer submits the post-delivery review. */
  orderReviewAvg?: number
}
