import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CATEGORY_LABELS,
  type ProductCategory,
} from '../models/product'
import {
  filterProducts,
  type SortKey,
} from '../services/productQueries'
import { useCatalogStore } from '../store/useCatalogStore'
import { Input } from '../widgets/Input'
import { ProductCard } from '../widgets/ProductCard'
import { SectionHeader } from '../widgets/SectionHeader'

/** Upper bound for the price slider (Rwf). Default filter must include premium items. */
const PRICE_SLIDER_MAX = 10_000_000

const FILTER_TABS: readonly (ProductCategory | 'all')[] = [
  'all',
  ...(Object.keys(CATEGORY_LABELS) as ProductCategory[]),
]

export function ShopScreen() {
  const [params, setParams] = useSearchParams()
  const products = useCatalogStore((s) => s.products)
  const catalogLoading = useCatalogStore((s) => s.catalogLoading)
  const catParam = params.get('category')
  const category: ProductCategory | 'all' =
    catParam && catParam in CATEGORY_LABELS
      ? (catParam as ProductCategory)
      : 'all'

  const setCategory = (c: ProductCategory | 'all') => {
    const next = new URLSearchParams(params)
    if (c === 'all') next.delete('category')
    else next.set('category', c)
    setParams(next, { replace: true })
  }

  const [q, setQ] = useState('')
  const [maxPrice, setMaxPrice] = useState(PRICE_SLIDER_MAX)
  const [sort, setSort] = useState<SortKey>('popular')

  const filtered = useMemo(
    () =>
      filterProducts(products, {
        q,
        category,
        maxPrice,
        sort,
      }),
    [products, q, category, maxPrice, sort],
  )

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Explore"
        title="Discover pieces with soul"
      />
      {catalogLoading && (
        <p className="text-xs text-ink/55 dark:text-cream/50" role="status">
          Updating catalog…
        </p>
      )}

      <div className="sticky top-[var(--header-bar-height)] z-20 -mx-4 border-b border-ink/6 bg-surface/90 px-4 py-3 backdrop-blur-md dark:border-cream/8 dark:bg-dark-bg/90 md:static md:z-0 md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search gifts, fashion, accessories…"
          aria-label="Search products"
          className="shadow-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTER_TABS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                category === c
                  ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                  : 'bg-cream/80 text-ink hover:bg-rose/40 dark:bg-dark-surface dark:text-cream dark:hover:bg-dark-elevated'
              }`}
            >
              {c === 'all'
                ? 'All'
                : CATEGORY_LABELS[c].label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-1 items-center gap-3 text-sm text-muted dark:text-dark-muted">
            <span className="shrink-0 font-medium text-ink dark:text-cream">Max price</span>
            <input
              type="range"
              min={5000}
              max={PRICE_SLIDER_MAX}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="h-1.5 w-full max-w-xs accent-rose"
            />
            <span className="tabular-nums text-ink dark:text-cream">
              {(maxPrice / 1000).toFixed(0)}K
            </span>
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-11 rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-medium text-ink dark:border-cream/15 dark:bg-dark-elevated dark:text-cream"
          >
            <option value="popular">Popularity</option>
            <option value="price-asc">Price · low to high</option>
            <option value="price-desc">Price · high to low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted dark:text-dark-muted">
          No pieces match your filters. Try widening your search.
        </p>
      ) : (
        <div className="masonry-grid">
          {filtered.map((p, i) => (
            <div key={p.id} className="masonry-item">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
