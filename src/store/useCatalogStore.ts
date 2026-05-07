import { create } from 'zustand'
import { SEED_PRODUCTS } from '../data/products'
import type { CartLine } from '../models/cart'
import type { Product, ProductReview } from '../models/product'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import {
  deleteProductRemote,
  fetchProductsFromSupabase,
  truncateProductsRemote,
  upsertProductRemote,
} from '../services/supabase/sync'
import {
  collectManagedPaths,
  removeProductImageObjects,
} from '../services/storage/productImageStorage'
import { validateCartAgainstStock } from '../services/inventory'
import { logDevOnly } from '../utils/userFacingMessage'

export type FetchProductsOpts = {
  /** No loading skeleton; empty API rows do not revert to bundled seed (keeps optimistic list). */
  silent?: boolean
}

interface CatalogState {
  products: Product[]
  catalogLoading: boolean
  catalogError: string | null
  catalogMutationError: string | null

  fetchProducts: (opts?: FetchProductsOpts) => Promise<void>

  validateCartStock: (
    cart: CartLine[],
  ) => { ok: true } | { ok: false; error: string }

  /** Call only after an order is persisted — updates stock locally and remotely. */
  consumeStockForOrder: (
    lines: CartLine[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>

  clearCatalogMutationError: () => void

  upsertProduct: (
    product: Product,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  /**
   * Appends a customer review and recomputes aggregate rating / count.
   * Optimistic local update; persists full product row to Supabase.
   */
  appendProductReview: (
    productId: string,
    review: Pick<ProductReview, 'author' | 'rating' | 'text'>,
  ) => Promise<void>
  /** Returns false if id not found */
  deleteProductById: (id: string) => Promise<boolean>
  /** Admin: clears remote catalog and uploads bundled seed products. */
  resetToSeed: () => Promise<void>
}

function cloneSeed(): Product[] {
  return structuredClone(SEED_PRODUCTS)
}

function logUpsertRemoteFailure(productId: string, err: unknown) {
  const o = err as {
    message?: string
    code?: string
    details?: string | null
    hint?: string | null
  }
  console.warn('[Nyanja][admin-catalog] upsert:remote_failed', {
    productId,
    message: o?.message ?? String(err),
    code: o?.code,
    details: o?.details,
    hint: o?.hint,
  })
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  catalogLoading: false,
  catalogError: null,
  catalogMutationError: null,

  clearCatalogMutationError: () =>
    set({ catalogMutationError: null }),

  validateCartStock: (cart) =>
    validateCartAgainstStock(cart, get().products),

  consumeStockForOrder: async (lines) => {
    if (lines.length === 0) return { ok: true }

    const prev = get().products
    const gate = validateCartAgainstStock(lines, prev)
    if (!gate.ok) return { ok: false, error: gate.error }

    const deltas = new Map<string, number>()
    for (const line of lines) {
      deltas.set(
        line.productId,
        (deltas.get(line.productId) ?? 0) + line.quantity,
      )
    }

    const nextProducts = prev.map((p) => {
      const dq = deltas.get(p.id)
      if (!dq) return p
      return { ...p, stockQuantity: Math.max(0, p.stockQuantity - dq) }
    })

    set({ products: nextProducts, catalogMutationError: null })

    if (!isSupabaseConfigured()) {
      return { ok: true }
    }

    try {
      for (const pid of deltas.keys()) {
        const product = nextProducts.find((x) => x.id === pid)
        if (!product) continue
        const { error } = await upsertProductRemote(product)
        if (error) throw new Error(error.message)
      }
    } catch (e) {
      set({ products: prev })
      await get().fetchProducts({ silent: true })
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : 'Could not sync inventory after order.',
      }
    }

    return { ok: true }
  },

  fetchProducts: async (opts) => {
    const silent = opts?.silent ?? false
    if (!isSupabaseConfigured()) {
      logDevOnly('Supabase env missing — using bundled catalog', null)
      set({
        products: cloneSeed(),
        catalogLoading: false,
        catalogError: null,
      })
      return
    }
    if (!silent) {
      set((s) => ({
        catalogLoading: true,
        catalogError: null,
        products: s.products.length > 0 ? s.products : cloneSeed(),
      }))
    }

    const res = await fetchProductsFromSupabase()

    if (!res.ok) {
      logDevOnly('Catalog fetch failed', res.error)
      if (!silent) {
        set({
          products:
            get().products.length > 0 ? get().products : cloneSeed(),
          catalogLoading: false,
          catalogError: null,
        })
      }
      return
    }

    if (res.products.length === 0) {
      if (import.meta.env.DEV && !silent) {
        console.warn(
          '[Nyanja] Supabase returned no product rows; showing bundled sample catalog.',
        )
      }
      if (!silent) {
        set({
          products: cloneSeed(),
          catalogLoading: false,
          catalogError: null,
        })
      }
      return
    }

    set({
      products: res.products,
      catalogLoading: false,
      catalogError: null,
    })
  },

  upsertProduct: async (product) => {
    if (!isSupabaseConfigured()) {
      const msg =
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      set({ catalogMutationError: msg })
      console.warn('[Nyanja][admin-catalog] upsert:blocked', { reason: msg })
      return { ok: false as const, error: msg }
    }
    const prev = get().products
    set((s) => {
      const i = s.products.findIndex((p) => p.id === product.id)
      if (i === -1) {
        return { products: [...s.products, product], catalogMutationError: null }
      }
      const next = [...s.products]
      next[i] = product
      return { products: next, catalogMutationError: null }
    })
    console.info('[Nyanja][admin-catalog] upsert:start', {
      id: product.id,
      slug: product.slug,
      name: product.name,
      imageCount: product.images?.length ?? 0,
      isNewInList: !prev.some((p) => p.id === product.id),
    })
    const { error } = await upsertProductRemote(product)
    if (error) {
      logUpsertRemoteFailure(product.id, error)
      const message = error.message ?? 'Product could not be saved.'
      set({ products: prev, catalogMutationError: message })
      return { ok: false as const, error: message }
    }
    console.info('[Nyanja][admin-catalog] upsert:remote_ok', {
      id: product.id,
    })
    await get().fetchProducts({ silent: true })
    console.info('[Nyanja][admin-catalog] upsert:after_silent_refetch', {
      productCount: get().products.length,
    })
    set({ catalogMutationError: null })
    return { ok: true as const }
  },

  appendProductReview: async (productId, review) => {
    if (!isSupabaseConfigured()) {
      set({
        catalogMutationError:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      })
      return
    }
    let updated: Product | null = null
    const prev = get().products
    set((s) => {
      const i = s.products.findIndex((p) => p.id === productId)
      if (i === -1) return s
      const p = s.products[i]!
      const clamped = Math.min(5, Math.max(1, Math.round(review.rating)))
      const entry: ProductReview = {
        id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        author: review.author,
        rating: clamped,
        text: review.text.trim(),
        date: new Date().toISOString(),
      }
      const reviews = [...(p.reviews ?? []), entry]
      const reviewCount = reviews.length
      const rating =
        Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
        ) / 10
      const next = [...s.products]
      next[i] = { ...p, reviews, reviewCount, rating }
      updated = next[i]!
      return { products: next, catalogMutationError: null }
    })
    if (!updated) return
    const { error } = await upsertProductRemote(updated)
    if (error) {
      set({ products: prev, catalogMutationError: error.message })
      return
    }
    await get().fetchProducts({ silent: true })
  },

  deleteProductById: async (id) => {
    if (!isSupabaseConfigured()) {
      set({
        catalogMutationError:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      })
      return false
    }
    const prev = get().products
    const deletedProduct = prev.find((p) => p.id === id)
    const had = prev.some((p) => p.id === id)
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
      catalogMutationError: null,
    }))
    const { error } = await deleteProductRemote(id)
    if (error) {
      set({ products: prev, catalogMutationError: error.message })
      return false
    }
    const storagePaths = deletedProduct
      ? collectManagedPaths(deletedProduct.images)
      : []
    if (storagePaths.length > 0) {
      const { error: stErr } = await removeProductImageObjects(storagePaths)
      if (stErr) {
        console.warn('[catalog] could not delete product images from storage', stErr.message)
      }
    }
    await get().fetchProducts({ silent: true })
    return had
  },

  resetToSeed: async () => {
    if (!isSupabaseConfigured()) {
      set({
        catalogMutationError:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      })
      return
    }
    const seed = cloneSeed()
    const prev = get().products
    set({ products: seed, catalogMutationError: null })
    const { error: truncErr } = await truncateProductsRemote()
    if (truncErr) {
      set({ products: prev, catalogMutationError: truncErr.message })
      return
    }
    for (const p of seed) {
      const { error } = await upsertProductRemote(p)
      if (error) {
        set({ products: prev, catalogMutationError: error.message })
        await get().fetchProducts()
        return
      }
    }
    await get().fetchProducts()
  },
}))
