import type { Product, ProductCategory } from '../models/product'
import { useCatalogStore } from '../store/useCatalogStore'

export function getProducts(): Product[] {
  return useCatalogStore.getState().products
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id)
}

export type SortKey = 'popular' | 'price-asc' | 'price-desc'

export function filterProducts(
  list: Product[],
  opts: {
    q: string
    category: ProductCategory | 'all'
    maxPrice: number
    sort: SortKey
  },
): Product[] {
  let out = [...list]
  const q = opts.q.trim().toLowerCase()
  if (q) {
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }
  if (opts.category !== 'all') {
    out = out.filter((p) => p.category === opts.category)
  }
  out = out.filter((p) => p.priceRwf <= opts.maxPrice)
  switch (opts.sort) {
    case 'price-asc':
      out.sort((a, b) => a.priceRwf - b.priceRwf)
      break
    case 'price-desc':
      out.sort((a, b) => b.priceRwf - a.priceRwf)
      break
    default:
      out.sort((a, b) => b.popularity - a.popularity)
  }
  return out
}
