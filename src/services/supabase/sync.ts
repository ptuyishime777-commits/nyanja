import type { CartLine } from '../../models/cart'
import type { PlacedOrder } from '../../models/order'
import type { Product, ProductCategory } from '../../models/product'
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

const VALID_CATEGORIES = new Set<ProductCategory>([
  'gift-packages',
  'clothes',
  'shoes',
  'accessories',
])

function coerceNullableString(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v
  return String(v)
}

export function mapPayloadToProduct(row: {
  id: unknown
  payload: unknown
}): Product | null {
  const tableId = coerceNullableString(row.id)?.trim() ?? ''
  const raw =
    row.payload != null && typeof row.payload === 'object'
      ? (row.payload as Record<string, unknown>)
      : {}

  const idRaw = coerceNullableString(raw.id)?.trim()
  const id = idRaw || tableId
  if (!id) return null

  const slugCandidate = coerceNullableString(raw.slug)?.trim() ?? ''

  const fallback =
    seedById.get(id) ??
    seedBySlug.get(slugCandidate) ??
    (tableId !== id ? seedById.get(tableId) : undefined)

  const slug =
    slugCandidate ||
    fallback?.slug ||
    (id.startsWith('p-') ? `item-${id}` : id)

  const rawName = coerceNullableString(raw.name)?.trim() ?? ''
  const name =
    rawName.length > 0 ? rawName : fallback?.name ?? 'Product'

  const categoryRaw = raw.category ?? fallback?.category
  const category =
    typeof categoryRaw === 'string' && VALID_CATEGORIES.has(categoryRaw as ProductCategory)
      ? (categoryRaw as ProductCategory)
      : fallback?.category ?? 'gift-packages'

  const priceRaw =
    raw.priceRwf ?? raw.price_rwf ?? fallback?.priceRwf ?? 0
  const priceNum =
    typeof priceRaw === 'number' && Number.isFinite(priceRaw)
      ? priceRaw
      : Number(priceRaw)
  const priceRwf = Math.max(0, Math.round(Number.isFinite(priceNum) ? priceNum : 0))

  const description =
    coerceNullableString(raw.description) ?? fallback?.description ?? ''

  const imagesFromPayload: string[] = Array.isArray(raw.images)
    ? raw.images.filter(
        (x): x is string => typeof x === 'string' && x.trim() !== '',
      )
    : []
  const images =
    imagesFromPayload.length > 0
      ? imagesFromPayload
      : (fallback?.images ?? [])

  const stockRaw =
    raw.stockQuantity ?? raw.stock_qty ?? fallback?.stockQuantity ?? 100
  const stockNum =
    typeof stockRaw === 'number' && Number.isFinite(stockRaw)
      ? stockRaw
      : Number(stockRaw)
  const stockQuantity = Math.max(
    0,
    Math.round(Number.isFinite(stockNum) ? stockNum : 0),
  )

  const ratingRaw = raw.rating ?? fallback?.rating ?? 0
  const ratingNum =
    typeof ratingRaw === 'number' && Number.isFinite(ratingRaw)
      ? ratingRaw
      : Number(ratingRaw)
  const rating = Math.min(
    5,
    Math.max(0, Number.isFinite(ratingNum) ? ratingNum : 0),
  )

  const reviewCountRaw = raw.reviewCount ?? raw.review_count ?? fallback?.reviewCount ?? 0
  const reviewNum =
    typeof reviewCountRaw === 'number' && Number.isFinite(reviewCountRaw)
      ? reviewCountRaw
      : Number(reviewCountRaw)
  const reviewCount = Math.max(
    0,
    Math.round(Number.isFinite(reviewNum) ? reviewNum : 0),
  )

  const popularityRaw = raw.popularity ?? fallback?.popularity ?? 50
  const popNum =
    typeof popularityRaw === 'number' && Number.isFinite(popularityRaw)
      ? popularityRaw
      : Number(popularityRaw)
  const popularity = Math.min(
    100,
    Math.max(0, Math.round(Number.isFinite(popNum) ? popNum : 50)),
  )

  const next: Product = {
    id,
    slug,
    name,
    category,
    priceRwf,
    description,
    images,
    rating,
    reviewCount,
    popularity,
    stockQuantity,
  }

  const compareRaw = raw.compareAtRwf ?? raw.compare_at_rwf
  if (typeof compareRaw === 'number' && Number.isFinite(compareRaw) && compareRaw > priceRwf) {
    next.compareAtRwf = Math.round(compareRaw)
  } else if (
    fallback?.compareAtRwf != null &&
    fallback.compareAtRwf > priceRwf
  ) {
    next.compareAtRwf = fallback.compareAtRwf
  }

  if (raw.featured === true || fallback?.featured) next.featured = true
  if (raw.trending === true || fallback?.trending) next.trending = true

  if (Array.isArray(raw.bundleItems) && raw.bundleItems.length > 0) {
    const lines = raw.bundleItems.filter(
      (x): x is string => typeof x === 'string' && x.trim() !== '',
    )
    if (lines.length > 0) next.bundleItems = lines
  } else if (fallback?.bundleItems?.length) {
    next.bundleItems = fallback.bundleItems
  }

  return mergeProductStockFromPayload(next)
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

  const rows = data ?? []
  const products: Product[] = []
  for (const row of rows) {
    const p = mapPayloadToProduct(row as { id: unknown; payload: unknown })
    if (p) products.push(p)
  }

  if (rows.length > 0 && products.length === 0) {
    return {
      ok: false,
      products: [],
      error:
        `${rows.length} product row(s) exist but none could be parsed. Ensure each row has a jsonb payload with id, slug, name, category, images, stockQuantity/stock_qty, etc., or recreate rows from Admin → Restore seed.`,
    }
  }

  return { ok: true, products, error: null }
}

function denormalisedProductSlug(product: Product): string {
  const s = product.slug.trim()
  if (s) return s
  const id = product.id.trim()
  if (id.startsWith('p-')) return `item-${id}`
  return id || 'product'
}

export async function upsertProductRemote(product: Product) {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured.') }
  }
  return supabase.from('products').upsert(
    {
      id: product.id,
      /** Denormalised columns on customized DBs (NOT NULL, no default). Source of truth: `payload`. */
      name: product.name.trim() || 'Product',
      slug: denormalisedProductSlug(product),
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
