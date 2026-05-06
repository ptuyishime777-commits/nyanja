import type { PlacedOrder } from '../models/order'

/** Demo customer id — must match `DEMO_USER_ID` in auth store seed */
export const DEMO_CUSTOMER_ID = 'user_demo'

export const SEED_ORDERS: PlacedOrder[] = [
  {
    id: 'NG-24089',
    userId: DEMO_CUSTOMER_ID,
    customerName: 'Demo Customer',
    customerPhone: '+250 788 000 000',
    customerAddress: 'Kigali — demo address',
    createdAt: '2026-03-18T10:00:00',
    status: 'delivered',
    totalRwf: 43_000,
    deliveryOption: 'standard',
    paymentMethod: 'mtn',
    items: [
      {
        productId: '2',
        name: 'Kigali Birthday Luxe Box',
        quantity: 1,
        unitPriceRwf: 40_000,
        image: '',
      },
    ],
  },
  {
    id: 'NG-24102',
    userId: DEMO_CUSTOMER_ID,
    customerName: 'Demo Customer',
    customerPhone: '+250 788 000 000',
    customerAddress: 'Kigali — demo address',
    createdAt: '2026-04-22T14:30:00',
    status: 'shipped',
    totalRwf: 46_000,
    deliveryOption: 'express',
    paymentMethod: 'cod',
    deliveryPersonName: 'Jean Pierre',
    deliveryPersonPhone: '+250 788 123 456',
    items: [
      {
        productId: '8',
        name: 'Minimal Leather Sneakers',
        quantity: 1,
        unitPriceRwf: 38_000,
        image: '',
      },
    ],
  },
  {
    id: 'NG-24118',
    userId: DEMO_CUSTOMER_ID,
    customerName: 'Demo Customer',
    customerPhone: '+250 788 000 000',
    customerAddress: 'Kigali — demo address',
    createdAt: '2026-04-28T09:15:00',
    status: 'pending',
    totalRwf: 35_000,
    deliveryOption: 'pickup',
    paymentMethod: 'airtel',
    items: [
      {
        productId: '1',
        name: 'Rose Luxury Perfume Set',
        quantity: 1,
        unitPriceRwf: 35_000,
        image: '',
      },
    ],
  },
  {
    id: 'NG-24190',
    userId: DEMO_CUSTOMER_ID,
    customerName: 'Demo Customer',
    customerPhone: '+250 788 000 000',
    customerAddress: 'Kigali — demo address',
    createdAt: '2026-04-02T16:45:00',
    status: 'cancelled',
    totalRwf: 22_500,
    deliveryOption: 'standard',
    paymentMethod: 'mtn',
    items: [
      {
        productId: '3',
        name: 'Tea & Biscuits Pairing',
        quantity: 1,
        unitPriceRwf: 22_500,
        image: '',
      },
    ],
  },
]
