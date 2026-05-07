import { SEED_PRODUCTS } from '../data/products'
import type { Product } from '../models/product'

const STORAGE_KEY = 'nyanja.catalogBundledDeletionSuppress.v1'

/** Bundled-catalog product ids shipped with the app (used to avoid ghost-revival for removed presets). */
export const BUNDLED_CATALOG_IDS = new Set(SEED_PRODUCTS.map((p) => p.id))

function cloneSeedSubset(): Product[] {
  return structuredClone(SEED_PRODUCTS)
}

function readSuppressIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(
      Array.isArray(arr)
        ? arr.filter((x): x is string => typeof x === 'string')
        : [],
    )
  } catch {
    return new Set()
  }
}

function writeSuppressIds(ids: Set<string>) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Caller should run after a bundled preset was intentionally removed remotely (seed id only). */
export function recordBundledCatalogDeletion(productId: string): void {
  if (!BUNDLED_CATALOG_IDS.has(productId)) return
  const next = readSuppressIds()
  next.add(productId)
  writeSuppressIds(next)
}

/** Admin “restore seed”: allow bundled rows to supplement the catalog again. */
export function clearBundledDeletionSuppressIds(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Keeps storefront presets visible while Supabase is partial: remote rows stay authoritative;
 * bundled seed fills any missing preset ids unless the shopper/admin removed them.
 */
export function mergeRemoteCatalogWithBundled(remote: Product[]): Product[] {
  const suppressed = readSuppressIds()
  const presentIds = new Set(remote.map((p) => p.id))
  const out: Product[] = [...remote]

  for (const p of cloneSeedSubset()) {
    if (suppressed.has(p.id) || presentIds.has(p.id)) continue
    presentIds.add(p.id)
    out.push(p)
  }

  return out
}
