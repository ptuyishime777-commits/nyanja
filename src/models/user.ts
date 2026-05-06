import type { CartLine } from './cart'
import type { PlacedOrder } from './order'

export type UserRole = 'customer' | 'admin'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  /** Set only for legacy/local-auth builds; empty with Supabase Auth. */
  passwordHash?: string
  role: UserRole
  disabled: boolean
  createdAt: string
}

/** Per-account shopping data persisted with the account */
export interface UserBucket {
  cart: CartLine[]
  wishlistIds: string[]
  orders: PlacedOrder[]
}
