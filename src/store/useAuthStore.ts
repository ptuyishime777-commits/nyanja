import { create } from 'zustand'
import type { OrderStatus } from '../models/order'
import type { AuthUser, UserBucket, UserRole } from '../models/user'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import {
  buildBucketsFromRemote,
  fetchProfilesAndOrders,
  insertOrderRemote,
  persistHubToProfile,
  profileRowToAuthUser,
  updateOrderPayloadRemote,
  updateProfileFlagsRemote,
} from '../services/supabase/sync'
import {
  buildPlacedOrder,
  type CheckoutOrderInput,
} from '../services/buildPlacedOrder'
import { useHubStore } from './useHubStore'
import { useCatalogStore } from './useCatalogStore'

const emptyBucket = (): UserBucket => ({
  cart: [],
  wishlistIds: [],
  orders: [],
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function mapAuthMessage(msg: string): string {
  if (msg.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  return msg
}

interface AuthState {
  sessionUserId: string | null
  users: AuthUser[]
  buckets: Record<string, UserBucket>

  authLoading: boolean
  authError: string | null

  remoteLoading: boolean
  remoteError: string | null

  orderMutationError: string | null
  profileMutationError: string | null

  /**
   * Auth session + profiles/orders from Supabase. Call after login or on boot.
   */
  refreshRemoteState: () => Promise<void>
  /** Loads catalog and remote auth-related rows when Supabase is configured. */
  ensureSeeded: () => Promise<void>
  syncHubFromSession: () => void
  saveActiveBucketFromHub: () => Promise<void>

  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ ok: true; userId: string } | { ok: false; error: string }>

  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>

  logout: () => void

  placeOrder: (
    input: Omit<CheckoutOrderInput, 'userId'>,
  ) => Promise<{ ok: true } | { ok: false; error: string }>

  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>

  updateOrderDeliveryInfo: (
    orderId: string,
    deliveryPersonName: string,
    deliveryPersonPhone: string,
  ) => Promise<void>

  /** Customer post-delivery: append reviews to catalog and record avg on the order */
  submitOrderProductReviews: (
    orderId: string,
    entries: { productId: string; rating: number; text: string }[],
  ) => Promise<void>

  setUserDisabled: (userId: string, disabled: boolean) => Promise<boolean>

  setUserRole: (userId: string, role: UserRole) => Promise<boolean>
}

export function getSessionUser(state: AuthState): AuthUser | null {
  const id = state.sessionUserId
  if (!id) return null
  return state.users.find((u) => u.id === id) ?? null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionUserId: null,
  users: [],
  buckets: {},

  authLoading: false,
  authError: null,

  remoteLoading: false,
  remoteError: null,

  orderMutationError: null,
  profileMutationError: null,

  refreshRemoteState: async () => {
    if (!isSupabaseConfigured()) {
      set({ users: [], buckets: {}, remoteError: null, remoteLoading: false })
      return
    }
    set({ remoteLoading: true, remoteError: null })
    const res = await fetchProfilesAndOrders()
    if (!res.ok) {
      set({
        remoteLoading: false,
        remoteError: res.error,
        users: [],
        buckets: {},
      })
      return
    }
    const users = res.profiles.map(profileRowToAuthUser)
    const buckets = buildBucketsFromRemote({
      profiles: res.profiles,
      orders: res.orders,
    })
    set({ users, buckets, remoteLoading: false, remoteError: null })
  },

  ensureSeeded: async () => {
    if (!isSupabaseConfigured()) {
      await useCatalogStore.getState().fetchProducts()
      return
    }
    await Promise.all([
      useCatalogStore.getState().fetchProducts(),
      get().refreshRemoteState(),
    ])
  },

  syncHubFromSession: () => {
    const uid = get().sessionUserId
    if (!uid) return
    const bucket = get().buckets[uid]
    if (!bucket) return
    useHubStore.setState({
      cart: bucket.cart.map((c) => ({ ...c })),
      wishlistIds: [...bucket.wishlistIds],
    })
  },

  saveActiveBucketFromHub: async () => {
    const uid = get().sessionUserId
    if (!uid) return
    const { cart, wishlistIds } = useHubStore.getState()
    if (!isSupabaseConfigured()) return
    const { error } = await persistHubToProfile(
      uid,
      cart.map((c) => ({ ...c })),
      [...wishlistIds],
    )
    if (error) {
      set({ profileMutationError: error.message })
      return
    }
    set((s) => ({
      buckets: {
        ...s.buckets,
        [uid]: {
          ...(s.buckets[uid] ?? emptyBucket()),
          cart: cart.map((c) => ({ ...c })),
          wishlistIds: [...wishlistIds],
        },
      },
      profileMutationError: null,
    }))
  },

  register: async (email, password, displayName) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }
    const e = normalizeEmail(email)
    if (!e.includes('@')) {
      return { ok: false, error: 'Enter a valid email address.' }
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' }
    }
    const name = displayName.trim()
    if (name.length < 2) {
      return { ok: false, error: 'Please enter your name.' }
    }

    set({ authLoading: true, authError: null })
    const { data, error } = await supabase.auth.signUp({
      email: e,
      password,
      options: {
        data: { display_name: name },
      },
    })
    if (error) {
      const err =
        error.message.includes('already registered') || error.message.includes('User already')
          ? 'An account with this email already exists.'
          : mapAuthMessage(error.message)
      set({ authLoading: false, authError: err })
      return { ok: false, error: err }
    }

    const session = data.session
    const user = data.user
    const uid = session?.user.id ?? user?.id
    if (!uid) {
      set({
        authLoading: false,
        authError: null,
      })
      return {
        ok: false,
        error:
          'Account created. Check your email to confirm before signing in, or try signing in now if confirmation is disabled.',
      }
    }

    set({ sessionUserId: uid, authLoading: false, remoteLoading: true })
    const hub = useHubStore.getState()
    const { error: hubErr } = await persistHubToProfile(uid, hub.cart, hub.wishlistIds)
    if (hubErr) {
      set({ profileMutationError: hubErr.message })
    }
    return { ok: true, userId: uid }
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }
    const e = normalizeEmail(email)
    const prior = get().sessionUserId
    if (prior) {
      await Promise.race([
        get().saveActiveBucketFromHub(),
        new Promise<void>((r) => setTimeout(r, 4_000)),
      ])
    }

    set({ authLoading: true, authError: null })
    const { data, error } = await supabase.auth.signInWithPassword({
      email: e,
      password,
    })
    if (error) {
      const err = mapAuthMessage(error.message)
      if (error.message.toLowerCase().includes('email not confirmed')) {
        set({ authLoading: false, authError: 'Please confirm your email before signing in.' })
        return { ok: false, error: 'Please confirm your email before signing in.' }
      }
      set({ authLoading: false, authError: err })
      return { ok: false, error: err }
    }

    const uid = data.session?.user.id ?? data.user?.id
    if (!uid) {
      set({ authLoading: false, authError: 'No session returned.' })
      return { ok: false, error: 'No session returned.' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('disabled')
      .eq('id', uid)
      .maybeSingle()

    if (profileError) {
      await supabase.auth.signOut()
      set({ authLoading: false, authError: profileError.message })
      return { ok: false, error: profileError.message }
    }

    if (profile?.disabled) {
      await supabase.auth.signOut()
      set({ authLoading: false, sessionUserId: null })
      return {
        ok: false,
        error: 'This account is disabled. Contact support.',
      }
    }

    set({ sessionUserId: uid, authLoading: false, remoteLoading: true })
    return { ok: true }
  },

  logout: () => {
    void (async () => {
      await get().saveActiveBucketFromHub()
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut()
      }
      set({
        sessionUserId: null,
        users: [],
        buckets: {},
        authError: null,
        remoteError: null,
        orderMutationError: null,
        profileMutationError: null,
      })
      useHubStore.setState({ cart: [], wishlistIds: [] })
    })()
  },

  placeOrder: async (input) => {
    const uid = get().sessionUserId
    if (!uid) return { ok: false, error: 'You must be signed in.' }
    if (!isSupabaseConfigured()) {
      set({ orderMutationError: 'Supabase is not configured.' })
      return { ok: false, error: 'Checkout is unavailable (Supabase not configured).' }
    }
    const cart = useHubStore.getState().cart
    if (cart.length === 0)
      return { ok: false, error: 'Your bag is empty.' }

    const stock = useCatalogStore.getState().validateCartStock(cart)
    if (!stock.ok) {
      set({ orderMutationError: stock.error })
      return { ok: false, error: stock.error }
    }

    const cartSnapshot = cart.map((c) => ({ ...c }))
    const order = buildPlacedOrder(cartSnapshot, { ...input, userId: uid })
    const prevBuckets = get().buckets
    set((s) => {
      const prev = s.buckets[uid] ?? emptyBucket()
      return {
        buckets: {
          ...s.buckets,
          [uid]: {
            ...prev,
            orders: [order, ...prev.orders],
            cart: [],
          },
        },
        orderMutationError: null,
      }
    })
    useHubStore.getState().clearCart()

    const { error } = await insertOrderRemote(order)
    if (error) {
      set({
        buckets: prevBuckets,
        orderMutationError: error.message,
      })
      useHubStore.setState({
        cart: cartSnapshot.map((c) => ({ ...c })),
      })
      return { ok: false, error: error.message }
    }

    const consumed = await useCatalogStore
      .getState()
      .consumeStockForOrder(cartSnapshot)
    if (!consumed.ok) {
      set({
        orderMutationError:
          consumed.error ??
          'Order was placed but inventory could not be updated. Please contact support.',
      })
      await useCatalogStore.getState().fetchProducts({ silent: true })
    }

    const { error: pErr } = await persistHubToProfile(
      uid,
      [],
      useHubStore.getState().wishlistIds,
    )
    if (pErr) set({ profileMutationError: pErr.message })
    await get().refreshRemoteState()
    get().syncHubFromSession()
    return { ok: true }
  },

  updateOrderStatus: async (orderId, status) => {
    if (!isSupabaseConfigured()) return
    const prevBuckets = get().buckets
    let target: { uid: string; orderIndex: number } | null = null

    for (const uid of Object.keys(prevBuckets)) {
      const b = prevBuckets[uid]!
      const idx = b.orders.findIndex((o) => o.id === orderId)
      if (idx !== -1) {
        target = { uid, orderIndex: idx }
        break
      }
    }
    if (!target) return

    const b = prevBuckets[target.uid]!
    const cur = b.orders[target.orderIndex]!
    const nextOrder = { ...cur, status }

    set((s) => {
      const nb = { ...s.buckets }
      const bucket = nb[target!.uid]!
      const orders = [...bucket.orders]
      orders[target!.orderIndex] = nextOrder
      nb[target!.uid] = { ...bucket, orders }
      return { buckets: nb, orderMutationError: null }
    })

    const { error } = await updateOrderPayloadRemote(orderId, nextOrder)
    if (error) {
      set({ buckets: prevBuckets, orderMutationError: error.message })
    }
  },

  updateOrderDeliveryInfo: async (orderId, deliveryPersonName, deliveryPersonPhone) => {
    if (!isSupabaseConfigured()) return
    const name = deliveryPersonName.trim()
    const phone = deliveryPersonPhone.trim()
    const prevBuckets = get().buckets

    let target: { uid: string; orderIndex: number } | null = null
    for (const uid of Object.keys(prevBuckets)) {
      const b = prevBuckets[uid]!
      const idx = b.orders.findIndex((o) => o.id === orderId)
      if (idx !== -1) {
        target = { uid, orderIndex: idx }
        break
      }
    }
    if (!target) return

    const b = prevBuckets[target.uid]!
    const cur = b.orders[target.orderIndex]!
    const nextOrder = {
      ...cur,
      ...(name ? { deliveryPersonName: name } : { deliveryPersonName: undefined }),
      ...(phone ? { deliveryPersonPhone: phone } : { deliveryPersonPhone: undefined }),
    }

    set((s) => {
      const nb = { ...s.buckets }
      const bucket = nb[target!.uid]!
      const orders = [...bucket.orders]
      orders[target!.orderIndex] = nextOrder
      nb[target!.uid] = { ...bucket, orders }
      return { buckets: nb, orderMutationError: null }
    })

    const { error } = await updateOrderPayloadRemote(orderId, nextOrder)
    if (error) {
      set({ buckets: prevBuckets, orderMutationError: error.message })
    }
  },

  submitOrderProductReviews: async (orderId, entries) => {
    const uid = get().sessionUserId
    if (!uid || !isSupabaseConfigured()) return
    const bucket = get().buckets[uid]
    const order = bucket?.orders.find((o) => o.id === orderId)
    if (!order || order.userId !== uid) return
    if (order.orderReviewAvg != null) return
    if (order.status !== 'delivered') return

    const valid = entries.filter(
      (e) => e.rating >= 1 && e.rating <= 5 && e.productId,
    )
    if (valid.length === 0) return

    const user = get().users.find((u) => u.id === uid)
    const author = user?.displayName?.trim() || 'Customer'
    const append = useCatalogStore.getState().appendProductReview

    let sum = 0
    for (const e of valid) {
      await append(e.productId, {
        author,
        rating: e.rating,
        text: e.text,
      })
      sum += Math.min(5, Math.max(1, Math.round(Number(e.rating))))
    }
    const avg = Math.round((sum / valid.length) * 10) / 10

    const prevBuckets = get().buckets
    const nextOrder = { ...order, orderReviewAvg: avg }

    set((s) => {
      const b = s.buckets[uid]
      if (!b) return s
      const idx = b.orders.findIndex((o) => o.id === orderId)
      if (idx === -1) return s
      const orders = [...b.orders]
      orders[idx] = { ...orders[idx]!, orderReviewAvg: avg }
      return {
        buckets: { ...s.buckets, [uid]: { ...b, orders } },
        orderMutationError: null,
      }
    })

    const { error } = await updateOrderPayloadRemote(orderId, nextOrder)
    if (error) {
      set({ buckets: prevBuckets, orderMutationError: error.message })
    }
  },

  setUserDisabled: async (userId, disabled) => {
    if (!isSupabaseConfigured()) return false
    const { users } = get()
    const target = users.find((u) => u.id === userId)
    if (
      disabled &&
      target?.role === 'admin' &&
      users.filter((u) => u.role === 'admin' && !u.disabled).length <= 1
    ) {
      return false
    }
    const { error } = await updateProfileFlagsRemote(userId, { disabled })
    if (error) {
      set({ profileMutationError: error.message })
      return false
    }
    await get().refreshRemoteState()
    if (disabled && get().sessionUserId === userId) {
      get().logout()
    }
    return true
  },

  setUserRole: async (userId, role) => {
    if (!isSupabaseConfigured()) return false
    const { users } = get()
    const target = users.find((u) => u.id === userId)
    if (
      target?.role === 'admin' &&
      role !== 'admin' &&
      users.filter((u) => u.role === 'admin' && !u.disabled).length <= 1
    ) {
      return false
    }
    const { error } = await updateProfileFlagsRemote(userId, { role })
    if (error) {
      set({ profileMutationError: error.message })
      return false
    }
    await get().refreshRemoteState()
    return true
  },
}))

export function isAdminUser(user: AuthUser | null) {
  return user?.role === 'admin' && !user.disabled
}
