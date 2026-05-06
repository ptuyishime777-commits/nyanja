import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import type { Product, ProductCategory } from '../../models/product'
import { CATEGORY_LABELS } from '../../models/product'
import { formatRwf } from '../../services/currency'
import { ensureUniqueSlug, slugifyFromName } from '../../services/slugify'
import { normalizeImageUploadFile } from '../../services/normalizeUploadedImage'
import { recompressJpegBlob } from '../../services/imageCropExport'
import {
  collectManagedPaths,
  removeProductImageObjects,
  uploadProductImageJpeg,
} from '../../services/storage/productImageStorage'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { ProductImageCropDialog } from '../../components/admin/ProductImageCropDialog'
import { useCatalogStore } from '../../store/useCatalogStore'
import { Button } from '../../widgets/Button'
import { Input } from '../../widgets/Input'
import { ProductImage } from '../../widgets/ProductImage'
import { TextArea } from '../../widgets/TextArea'
import { Toggle } from '../../widgets/Toggle'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

function newProductDraft(): Product {
  return {
    id: '',
    slug: '',
    name: '',
    category: 'gift-packages',
    priceRwf: 10_000,
    compareAtRwf: undefined,
    images: [],
    description: '',
    bundleItems: undefined,
    rating: 4.5,
    reviewCount: 0,
    popularity: 50,
    stockQuantity: 25,
    featured: false,
    trending: false,
    reviews: undefined,
  }
}

export function AdminProductsScreen() {
  const products = useCatalogStore((s) => s.products)
  const upsertProduct = useCatalogStore((s) => s.upsertProduct)
  const deleteProductById = useCatalogStore((s) => s.deleteProductById)
  const resetToSeed = useCatalogStore((s) => s.resetToSeed)

  const [searchQ, setSearchQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all')

  const filteredSorted = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    return [...products]
      .filter((p) => {
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
        if (q && !p.name.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchQ, categoryFilter])

  const [panelOpen, setPanelOpen] = useState(false)
  const [draft, setDraft] = useState<Product>(newProductDraft())
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [cropBatchTotal, setCropBatchTotal] = useState(0)
  /** 0–100 during XHR upload to Supabase Storage; null when idle */
  const [cropUploadPercent, setCropUploadPercent] = useState<number | null>(null)

  /** Avoid stale closures while HEIC conversion awaits (async picker). */
  const draftRef = useRef(draft)
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const cropQueueRef = useRef(cropQueue)
  useEffect(() => {
    cropQueueRef.current = cropQueue
  }, [cropQueue])

  useEffect(() => {
    if (cropQueue.length === 0) setCropBatchTotal(0)
  }, [cropQueue.length])

  const [draggingImageIdx, setDraggingImageIdx] = useState<number | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const isNew = draft.id === ''

  const openAdd = () => {
    setDraft(newProductDraft())
    setCropQueue([])
    setCropBatchTotal(0)
    setCropUploadPercent(null)
    setPanelOpen(true)
  }

  const openEdit = (p: Product) => {
    setCropQueue([])
    setCropBatchTotal(0)
    setCropUploadPercent(null)
    setDraft({
      ...p,
      images: [...p.images],
      bundleItems: p.bundleItems ? [...p.bundleItems] : [],
    })
    setPanelOpen(true)
  }

  const removeImageAt = (idx: number) => {
    const url = draftRef.current.images[idx]?.trim()
    if (url) {
      const paths = collectManagedPaths([url])
      if (paths.length > 0) {
        void removeProductImageObjects(paths).then(({ error }) => {
          if (error)
            console.warn('[admin] could not delete image from storage', error.message)
        })
      }
    }
    setDraft((d) => ({
      ...d,
      images: d.images.filter((_, i) => i !== idx),
    }))
  }

  const makeCoverAt = (idx: number) => {
    setDraft((d) => {
      if (idx <= 0 || idx >= d.images.length) return d
      const copy = [...d.images]
      const [picked] = copy.splice(idx, 1)
      if (!picked) return d
      return { ...d, images: [picked, ...copy] }
    })
  }

  const reorderDraftImages = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    setDraft((d) => {
      const arr = [...d.images]
      if (
        fromIdx < 0 ||
        fromIdx >= arr.length ||
        toIdx < 0 ||
        toIdx >= arr.length
      ) {
        return d
      }
      const [picked] = arr.splice(fromIdx, 1)
      if (!picked) return d
      arr.splice(toIdx, 0, picked)
      return { ...d, images: arr }
    })
  }

  const pickGalleryPhotos = () => {
    galleryInputRef.current?.click()
  }

  async function consumeGalleryPick(input: HTMLInputElement) {
    const list = input.files
    if (!list?.length) {
      input.value = ''
      return
    }

    const likelyImage = (f: File) => {
      if (f.type.startsWith('image/')) return true
      return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(f.name)
    }

    const rawPick = Array.from(list).filter(likelyImage)
    if (rawPick.length === 0) {
      window.alert(
        'No usable images selected. Pick JPG / PNG / WebP / GIF / HEIC from your gallery (or camera).',
      )
      input.value = ''
      return
    }

    const trimmed = draftRef.current.images.map((x) => x.trim()).filter(Boolean)
    const queued = cropQueueRef.current.length
    const allowedAdd = Math.max(0, 12 - trimmed.length - queued)
    if (allowedAdd === 0) {
      window.alert('Maximum 12 photos (including queued crops) — remove or finish cropping first.')
      input.value = ''
      return
    }

    let normalized: File[] = []
    for (const f of rawPick.slice(0, allowedAdd)) {
      try {
        const out = await normalizeImageUploadFile(f)
        normalized.push(out)
      } catch {
        window.alert(
          `Couldn't process "${f.name}". Try exporting as JPG or PNG from Photos.`,
        )
      }
    }

    if (normalized.length === 0) {
      input.value = ''
      return
    }

    const capSlice = normalized.slice(0, allowedAdd)

    setCropQueue((prev) => {
      const merged = [...prev, ...capSlice]
      queueMicrotask(() => setCropBatchTotal(merged.length))
      return merged
    })

    input.value = ''
  }

  function handleGalleryInputChange(e: ChangeEvent<HTMLInputElement>) {
    void consumeGalleryPick(e.currentTarget)
  }

  const cropEffectiveTotal =
    cropBatchTotal > 0 ? cropBatchTotal : Math.max(cropQueue.length, 1)
  const cropProgressStep =
    cropQueue.length > 0
      ? Math.max(1, cropEffectiveTotal - cropQueue.length + 1)
      : 1

  const finishCrop = async (jpegBlob: Blob) => {
    if (!isSupabaseConfigured()) {
      window.alert(
        'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to upload photos.',
      )
      return
    }
    try {
      const body = await recompressJpegBlob(jpegBlob)
      const productKey = draftRef.current.id?.trim() || 'pending'
      const { publicUrl } = await uploadProductImageJpeg(body, productKey, (p) =>
        setCropUploadPercent(p),
      )
      const hardCap = 12
      setDraft((d) => {
        const trimmed = d.images.map((x) => x.trim()).filter(Boolean)
        const merged = [publicUrl, ...trimmed].slice(0, hardCap)
        return { ...d, images: merged }
      })
      setCropQueue((q) => q.slice(1))
    } catch (e) {
      window.alert(
        e instanceof Error
          ? e.message
          : 'Upload failed. Check your connection and that you are signed in as an admin.',
      )
    } finally {
      setCropUploadPercent(null)
    }
  }

  const skipCrop = () => {
    setCropQueue((q) => q.slice(1))
  }

  const tryCloseProductPanel = () => {
    if (cropQueue.length > 0) {
      window.alert(
        `Finish cropping or discard ${cropQueue.length === 1 ? 'this photo' : `all ${cropQueue.length} queued photos`} before closing.`,
      )
      return
    }
    setPanelOpen(false)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()

    if (cropQueue.length > 0) {
      window.alert(
        'Finish cropping each photo you queued (confirm or discard). You cannot save until every new image has been processed.',
      )
      return
    }

    const imageUrls = draft.images
      .map((s) => s.trim())
      .filter(Boolean)

    if (imageUrls.some((u) => u.startsWith('data:'))) {
      window.alert(
        'Embedded (data:) images are not allowed. Remove those lines or use photo upload / normal https URLs.',
      )
      return
    }

    if (imageUrls.length === 0) {
      window.alert(
        'Add at least one photo using “Add photos”, or paste an image URL under Advanced.',
      )
      return
    }

    const bundleItems =
      draft.bundleItems
        ?.map((l) => l.trim())
        .filter(Boolean) ?? []

    const slugBase = slugifyFromName(draft.slug || draft.name)

    let id = draft.id
    if (!id || !id.trim()) {
      id = `p-${Date.now().toString(36)}`
    }

    const slug = ensureUniqueSlug(
      slugBase || `item-${id}`,
      products,
      isNew ? undefined : id,
    )

    const payload: Product = {
      id,
      slug,
      name: draft.name.trim(),
      category: draft.category,
      priceRwf: Math.max(0, Math.round(draft.priceRwf)),
      description: draft.description.trim(),
      images: imageUrls,
      stockQuantity: Math.max(0, Math.round(Number(draft.stockQuantity) || 0)),
      rating: Math.min(5, Math.max(0, Number(draft.rating) || 0)),
      reviewCount: Math.max(0, Math.round(Number(draft.reviewCount)) || 0),
      popularity: Math.max(
        0,
        Math.min(100, Math.round(Number(draft.popularity)) || 0),
      ),
      featured: !!draft.featured,
      trending: !!draft.trending,
      bundleItems:
        bundleItems.length > 0 ? bundleItems : undefined,
      reviews:
        draft.reviews && draft.reviews.length > 0 ? draft.reviews : undefined,
    }

    const cap = draft.compareAtRwf
    if (
      typeof cap === 'number' &&
      !Number.isNaN(cap) &&
      cap > payload.priceRwf
    ) {
      payload.compareAtRwf = Math.round(cap)
    }

    if (!isNew) {
      const prevRow = products.find((p) => p.id === id)
      if (prevRow) {
        const removed = prevRow.images.filter((u) => !imageUrls.includes(u))
        const paths = collectManagedPaths(removed)
        if (paths.length > 0) {
          const { error: stErr } = await removeProductImageObjects(paths)
          if (stErr)
            console.warn(
              '[admin] could not remove replaced images from storage',
              stErr.message,
            )
        }
      }
    }

    await upsertProduct(payload)
    setPanelOpen(false)
  }

  const removeOne = (p: Product) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`Delete "${p.name}" from the storefront? Orders keep line items but this product disappears from browse.`)
    ) {
      deleteProductById(p.id)
      if (draft.id === p.id) setPanelOpen(false)
    }
  }

  const resetSeed = () => {
    if (
      window.confirm(
        'Replace the entire catalog with the original seeded products? Current catalog will be discarded.',
      )
    ) {
      resetToSeed()
      setPanelOpen(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Catalog
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted dark:text-dark-muted">
            Add, edit, or remove listings. Product data syncs to Supabase; photos upload to Storage
            (compressed JPEG) and are stored as URLs only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" className="!min-h-11" onClick={openAdd}>
            Add product
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search products by name…"
          aria-label="Search catalog by name"
          className="shadow-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', ...CATEGORIES] as const).map((c) => {
            const active = categoryFilter === c
            const label =
              c === 'all' ? 'All' : CATEGORY_LABELS[c].label
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                    : 'border border-ink/12 bg-cream/50 text-ink hover:border-rose/35 hover:bg-rose/20 dark:border-cream/15 dark:bg-dark-elevated dark:text-cream dark:hover:bg-rose/15'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-ink/8 bg-white/60 dark:border-cream/10 dark:bg-dark-surface/70">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-[11px] font-semibold uppercase tracking-wider text-muted dark:border-cream/10 dark:text-dark-muted">
              <th className="w-16 px-3 py-4" />
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Price</th>
              <th className="px-4 py-4 w-24">Stock</th>
              <th className="px-4 py-4">Rating</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted dark:text-dark-muted"
                >
                  No products match your filters. Try another search or category.
                </td>
              </tr>
            ) : (
              filteredSorted.map((p) => {
                const slugPath = `/product/${p.slug}`
                return (
                  <tr
                    key={p.id}
                    className="border-b border-ink/6 last:border-0 dark:border-cream/10"
                  >
                    <td className="px-3 py-4 align-middle">
                      <div className="relative h-12 w-12 overflow-hidden rounded-[8px] ring-1 ring-ink/10 dark:ring-cream/10">
                        <ProductImage fill src={p.images[0] ?? ''} alt={p.name} sizes="48px" />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <p className="font-medium text-ink dark:text-cream">{p.name}</p>
                      <p
                        className="mt-0.5 font-mono text-xs text-muted dark:text-dark-muted"
                        title={`Store URL: ${slugPath}`}
                      >
                        #{p.id}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle text-muted dark:text-dark-muted">
                      {CATEGORY_LABELS[p.category].label}
                    </td>
                    <td className="px-4 py-4 align-middle font-medium [font-variant-numeric:tabular-nums]">
                      {formatRwf(p.priceRwf)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
                          p.stockQuantity <= 0
                            ? 'border border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200'
                            : p.stockQuantity < 5
                              ? 'border border-amber-500/45 bg-amber-100/90 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100'
                              : 'border border-ink/10 bg-cream/50 text-ink dark:border-cream/15 dark:bg-dark-elevated dark:text-cream'
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <p className="font-display text-sm font-semibold text-ink tabular-nums dark:text-cream">
                        ★ {p.rating.toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted dark:text-dark-muted">
                        {p.reviewCount} review{p.reviewCount === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="!min-h-9 !px-3 text-xs"
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="!min-h-9 !border-red-600/55 !px-3 text-xs !font-semibold !text-red-600 hover:!border-red-600 hover:!bg-red-500/[0.07] dark:!border-red-500/50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                          onClick={() => removeOne(p)}
                        >
                          Delete
                        </Button>
                        <Link
                          to={slugPath}
                          className="inline-flex items-center rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-rose-deep underline-offset-2 hover:underline dark:text-rose"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-ink/[0.08] border-l-[3px] border-l-red-700/35 bg-cream/25 px-4 py-4 dark:border-cream/[0.1] dark:border-l-red-500/40 dark:bg-dark-elevated/50">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
          Danger zone
        </p>
        <p className="mt-1.5 max-w-lg text-xs text-muted dark:text-dark-muted">
          Restoring the seed catalog replaces remote products with the bundled starter
          catalog from this app. Custom listings in the database are removed.
        </p>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-red-700 underline-offset-2 hover:underline dark:text-red-400"
          onClick={resetSeed}
        >
          Restore seed catalog
        </button>
      </div>

      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center dark:bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-title"
        >
          <div className="max-h-[min(92vh,760px)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-ink/10 bg-surface shadow-lift dark:border-cream/15 dark:bg-dark-surface md:max-h-[85vh]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink/8 bg-surface px-6 py-4 dark:border-cream/10 dark:bg-dark-surface">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
                  Catalog
                </p>
                <h2
                  id="admin-product-title"
                  className="font-display text-xl font-semibold text-ink dark:text-cream"
                >
                  {isNew ? 'Add product' : 'Edit product'}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="!min-h-9 shrink-0"
                onClick={tryCloseProductPanel}
              >
                Close
              </Button>
            </div>

            <form onSubmit={save} className="space-y-4 px-6 py-5">
              {cropQueue.length > 0 ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose/45 bg-rose/15 px-4 py-3 text-sm font-medium text-ink dark:bg-rose/10 dark:text-cream"
                >
                  {cropQueue.length === 1
                    ? 'Crop and confirm the queued photo (or discard it) before you can save.'
                    : `${cropQueue.length} photos queued — confirm or discard each one before saving.`}
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink dark:text-cream">Name</label>
                <Input
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink dark:text-cream">Slug</label>
                <Input
                  placeholder="auto from name"
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, slug: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="!min-h-10 text-xs"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        slug: slugifyFromName(d.name),
                      }))
                    }
                  >
                    Generate from name
                  </Button>
                </div>
                <p className="text-xs text-muted dark:text-dark-muted">
                  URL segment: <span className="font-mono">/product/</span>{' '}
                  {ensureUniqueSlug(
                    slugifyFromName(draft.slug || draft.name) || 'product',
                    products,
                    isNew ? undefined : draft.id,
                  )}
                </p>
              </div>

              {!isNew && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">ID</label>
                  <Input
                    value={draft.id}
                    readOnly
                    className="opacity-75"
                  />
                  <p className="text-xs text-muted dark:text-dark-muted">
                    Stable id for carts and orders; cannot change once created.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink dark:text-cream">Category</label>
                <select
                  aria-label="Category"
                  value={draft.category}
                  className="min-h-12 w-full rounded-2xl border-2 border-ink/25 bg-white/90 px-4 py-3 text-[15px] font-medium text-ink shadow-sm outline-none transition focus:border-rose-deep focus:ring-2 focus:ring-rose/35 dark:border-cream/35 dark:bg-dark-elevated dark:text-cream dark:shadow-none"
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">
                    Price (RWF)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    required
                    min={0}
                    value={draft.priceRwf || ''}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        priceRwf: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">
                    Compare-at (optional)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. was price"
                    value={draft.compareAtRwf ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setDraft((d) => ({
                        ...d,
                        compareAtRwf: v === '' ? undefined : Number(v),
                      }))
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">
                    Stock quantity
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    required
                    min={0}
                    value={draft.stockQuantity}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        stockQuantity: Math.max(0, Math.round(Number(e.target.value) || 0)),
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted dark:text-dark-muted">
                    0 = out of stock. You&apos;ll see a low-stock highlight in the catalog when below 5.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-ink dark:text-cream">
                    Photos
                  </label>
                  <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                    Upload from gallery or camera (HEIC from iPhones is converted automatically), crop each shot, drag to reorder. Max 12 images; uploads go to Supabase Storage.
                  </p>
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Choose product photos"
                  onChange={handleGalleryInputChange}
                />

                {draft.images.filter((x) => x.trim()).length === 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      pickGalleryPhotos()
                    }}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/[0.16] bg-cream/[0.35] px-6 py-12 text-center transition hover:border-rose-deep/55 hover:bg-rose/[0.08] dark:border-cream/[0.18] dark:bg-dark-elevated/55 dark:hover:border-rose/40 dark:hover:bg-rose/10"
                  >
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-ink/10 dark:bg-dark-surface dark:ring-cream/15">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted dark:text-dark-muted" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="13" r="3.75" />
                      </svg>
                    </span>
                    <span className="font-semibold text-ink dark:text-cream">
                      Add up to 12 photos
                    </span>
                    <span className="mt-1 max-w-[16rem] text-xs text-muted dark:text-dark-muted">
                      Tap here or use &quot;Add more&quot; once you&apos;ve started listing images.
                    </span>
                  </button>
                ) : null}

                {draft.images.filter((x) => x.trim()).length > 0 ? (
                  <>
                    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {draft.images
                        .map((src, idx) => ({ src, idx }))
                        .filter(({ src }) => src.trim())
                        .map(({ src, idx }, order) => (
                          <li
                            key={`thumb-${idx}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', String(idx))
                              setDraggingImageIdx(idx)
                            }}
                            onDragEnd={() => setDraggingImageIdx(null)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const from = draggingImageIdx
                              if (from === null || from === idx) return
                              reorderDraftImages(from, idx)
                              setDraggingImageIdx(null)
                            }}
                            className={`relative shrink-0 select-none rounded-xl outline-none ring-2 ring-transparent transition hover:ring-rose/35 ${draggingImageIdx === idx ? 'opacity-50' : 'opacity-100'} cursor-grab active:cursor-grabbing`}
                          >
                            {order === 0 ? (
                              <span
                                className="absolute left-1 top-1 z-[2] flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white shadow-md"
                                title="Cover image"
                                aria-label="Cover image"
                              >
                                ★
                              </span>
                            ) : null}
                            <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-ink/20 dark:border-cream/25">
                              <ProductImage
                                fill
                                sizes="120px"
                                src={src}
                                alt={`Product photo ${order + 1}`}
                              />
                            </div>
                            <button
                              type="button"
                              className="absolute -right-1 -top-1 z-[3] flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-ink px-2 text-[15px] font-bold leading-none text-cream shadow dark:bg-cream dark:text-ink"
                              aria-label={`Remove photo ${order + 1}`}
                              onClick={(evt) => {
                                evt.preventDefault()
                                evt.stopPropagation()
                                removeImageAt(idx)
                              }}
                            >
                              ×
                            </button>
                            {order !== 0 ? (
                              <button
                                type="button"
                                className="mt-2 w-full text-center text-[10px] font-semibold uppercase tracking-wide text-muted underline-offset-2 hover:text-rose-deep hover:underline dark:text-dark-muted dark:hover:text-rose"
                                onClick={() => makeCoverAt(idx)}
                              >
                                Make cover
                              </button>
                            ) : (
                              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-rose-deep dark:text-rose">
                                Cover photo
                              </p>
                            )}
                          </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="!min-h-11"
                        onClick={(e) => {
                          e.preventDefault()
                          pickGalleryPhotos()
                        }}
                      >
                        Add more photos
                      </Button>
                    </div>
                  </>
                ) : null}

                <div className="relative py-5">
                  <div className="absolute inset-x-0 top-1/2 border-t border-ink/[0.1] dark:border-cream/[0.12]" aria-hidden />
                  <p className="relative mx-auto w-fit rounded-full bg-surface px-5 py-1 text-center text-[11px] font-medium text-muted italic dark:bg-dark-surface dark:text-dark-muted">
                    — or paste image URLs —
                  </p>
                </div>

                <details className="rounded-xl border border-ink/10 bg-cream/30 px-4 py-3 dark:border-cream/10 dark:bg-dark-elevated/50">
                  <summary className="cursor-pointer text-sm font-semibold text-ink dark:text-cream">
                    Advanced · manual URL entry (secondary)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <TextArea
                      rows={3}
                      className="font-mono text-xs"
                      value={draft.images.join('\n')}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          images: e.target.value.split(/\n/).map((x) => x.trim()),
                        }))
                      }
                      placeholder="/nyanja-images/img-01.jpg"
                    />
                    <p className="text-[11px] text-muted dark:text-dark-muted">
                      Secondary option: one URL per line. Mixing uploads and URLs merges at save time according to array order below.
                    </p>
                  </div>
                </details>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink dark:text-cream">
                  Description
                </label>
                <TextArea
                  required
                  rows={4}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink dark:text-cream">
                  Bundle contents (optional)
                </label>
                <TextArea
                  rows={3}
                  className="text-sm"
                  value={draft.bundleItems?.join('\n') ?? ''}
                  placeholder="One line per bullet"
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      bundleItems: e.target.value.split('\n'),
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">Rating</label>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={draft.rating}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        rating: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">Reviews #</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.reviewCount}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        reviewCount: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-cream">Popularity</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={draft.popularity}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        popularity: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-ink/8 px-4 py-3 dark:border-cream/10">
                <Toggle
                  checked={!!draft.featured}
                  onChange={(v) => setDraft((d) => ({ ...d, featured: v }))}
                  label="Featured on home"
                />
                <Toggle
                  checked={!!draft.trending}
                  onChange={(v) => setDraft((d) => ({ ...d, trending: v }))}
                  label="Trending"
                />
              </div>

              <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-ink/8 bg-surface pb-3 pt-4 dark:border-cream/10 dark:bg-dark-surface">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 !min-h-12"
                  disabled={cropQueue.length > 0}
                >
                  {isNew ? 'Create product' : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" className="!min-h-12" onClick={tryCloseProductPanel}>
                  Cancel
                </Button>
                {!isNew && (
                  <Button
                    type="button"
                    variant="outline"
                    className="!min-h-12 !border-red-600/55 !font-semibold !text-red-600 hover:!border-red-600 hover:!bg-red-500/[0.07] dark:!border-red-500/50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                    onClick={() => removeOne(draft)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {cropQueue.length > 0 && (
        <ProductImageCropDialog
          key={`${cropQueue[0].lastModified}_${cropQueue[0].size}_${cropQueue[0].name}`}
          file={cropQueue[0]}
          progress={{ current: cropProgressStep, total: cropEffectiveTotal }}
          uploadProgressPct={cropUploadPercent}
          onCancel={skipCrop}
          onComplete={finishCrop}
        />
      )}
    </div>
  )
}
