import type { CartLine } from '../../models/cart'
import type { PlacedOrder } from '../../models/order'
import type { Product } from '../../models/product'
import { SEED_PRODUCTS } from '../../data/products'
import { mergeProductStockFromPayload } from '../inventory'
import type { AuthUser, UserBucket } from '../../models/user'
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'

export type ProfileRow = {
  id: string
  email: string
  display_name: string
  role: 'customer' | 'admin'
  disabled: boolean
  created_at: string
  cart_json: unknown
  wishlist_ids: unknown
}

export type OrderRow = {
  id: string
  user_id: string
  payload: unknown
  created_at: string
}

const seedById = new Map(SEED_PRODUCTS.map((p) => [p.id, p]))
const seedBySlug = new Map(SEED_PRODUCTS.map((p) => [p.slug, p]))

function normalizeOrdersPayloadError(error: { message: string } | null) {
  if (!error) return null
  const msg = error.message.toLowerCase()
  if (
    msg.includes("could not find the 'payload' column of 'orders'") ||
    (msg.includes('orders') && msg.includes('payload') && msg.includes('schema cache'))
  ) {
    return new Error(
      "Database schema is outdated: missing 'orders.payload'. Run the latest Supabase migrations, then retry checkout.",
    )
  }
  return error
}

function isCartLineArray(v: unknown): v is CartLine[] {
  return Array.isArray(v) && v.every(
    (x) =>
      x &&
      typeof x === 'object' &&
      typeof (x as CartLine).productId === 'string' &&
      typeof (x as CartLine).quantity === 'number',
  )
}

function isWishlistIds(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

export function mapPayloadToProduct(row: { id: string; payload: unknown }): Product | null {
  const p = row.payload
  if (!p || typeof p !== 'object') return null
  const o = p as Product
  if (typeof o.id !== 'string' || typeof o.slug !== 'string') return null
  const fallback =
    seedById.get(o.id) ??
    seedBySlug.get(o.slug)
  const images =
    Array.isArray(o.images) && o.images.some((x) => typeof x === 'string' && x.trim() !== '')
      ? o.images
      : (fallback?.images ?? [])
  return mergeProductStockFromPayload({ ...o, images })
}

export function profileRowToAuthUser(row: {
  id: string
  email: string
  display_name: string
  role: 'customer' | 'admin'
  disabled: boolean
  created_at: string
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    disabled: row.disabled,
    createdAt: row.created_at,
  }
}

export async function fetchProductsFromSupabase(): Promise<{
  ok: boolean
  products: Product[]
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, products: [], error: 'Supabase is not configured.' }
  }
  const { data, error } = await supabase
    .from('products')
    .select('id,payload')
    .order('id')

  if (error) return { ok: false, products: [], error: error.message }

  const products: Product[] = []
  for (const row of data ?? []) {
    const p = mapPayloadToProduct(row as { id: string; payload: unknown })
    if (p) products.push(p)
  }
  return { ok: true, products, error: null }
}

export async function upsertProductRemote(product: Product) {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured.') }
  }
  return supabase.from('products').upsert(
    {
      id: product.id,
      payload: product as unknown as Record<string, unknown>,
    },
    { onConflict: 'id' },
  )
}

export async function deleteProductRemote(id: string) {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured.') }
  }
  return supabase.from('products').delete().eq('id', id)
}

export async function truncateProductsRemote() {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured.') }
  }
  // delete all rows (admin RLS)
  const { data: rows, error: selErr } = await supabase.from('products').select('id')
  if (selErr) return { error: selErr }
  const ids = (rows ?? []).map((r) => (r as { id: string }).id)
  for (const id of ids) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return { error }
  }
  return { error: null as null }
}

export async function fetchProfilesAndOrders(): Promise<{
  ok: boolean
  profiles: ProfileRow[]
  orders: OrderRow[]
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      profiles: [],
      orders: [],
      error: 'Supabase is not configured.',
    }
  }

  const [{ data: pRows, error: pErr }, { data: oRows, error: oErr }] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ])

  if (pErr) return { ok: false, profiles: [], orders: [], error: pErr.message }
  if (oErr) return { ok: false, profiles: [], orders: [], error: oErr.message }

  return {
    ok: true,
    profiles: (pRows ?? []) as ProfileRow[],
    orders: (oRows ?? []) as OrderRow[],
    error: null,
  }
}

export function buildBucketsFromRemote(args: {
  profiles: ProfileRow[]
  orders: OrderRow[]
}): Record<string, UserBucket> {
  const { profiles, orders } = args
  const buckets: Record<string, UserBucket> = {}

  for (const pr of profiles) {
    const cart = isCartLineArray(pr.cart_json) ? pr.cart_json : []
    const wishlistIds = isWishlistIds(pr.wishlist_ids) ? pr.wishlist_ids : []
    buckets[pr.id] = { cart, wishlistIds, orders: [] }
  }

  for (const orow of orders) {
    const payload = orow.payload as PlacedOrder | null
    if (!payload || typeof payload !== 'object') continue
    const uid = orow.user_id
    if (!buckets[uid]) {
      buckets[uid] = { cart: [], wishlistIds: [], orders: [] }
    }
    buckets[uid].orders.push(payload)
  }

  for (const uid of Object.keys(buckets)) {
    buckets[uid].orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  return buckets
}

export async function persistHubToProfile(userId: string, cart: CartLine[], wishlistIds: string[]) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') }
  return supabase
    .from('profiles')
    .update({
      cart_json: cart as unknown as Record<string, unknown>[],
      wishlist_ids: wishlistIds,
    })
    .eq('id', userId)
}

export async function insertOrderRemote(order: PlacedOrder) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') }
  const { error } = await supabase.from('orders').insert({
    id: order.id,
    user_id: order.userId,
    payload: order as unknown as Record<string, unknown>,
  })
  return { error: normalizeOrdersPayloadError(error) }
}

export async function updateOrderPayloadRemote(orderId: string, payload: PlacedOrder) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') }
  const { error } = await supabase
    .from('orders')
    .update({ payload: payload as unknown as Record<string, unknown> })
    .eq('id', orderId)
  return { error: normalizeOrdersPayloadError(error) }
}

export async function updateProfileFlagsRemote(
  userId: string,
  patch: { disabled?: boolean; role?: 'customer' | 'admin' },
) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') }
  return supabase.from('profiles').update(patch).eq('id', userId)
}
