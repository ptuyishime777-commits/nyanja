import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, type ProductCategory } from '../models/product'
import { useCatalogStore } from '../store/useCatalogStore'
import { Button } from '../widgets/Button'
import { FeaturedSpotlight } from '../widgets/FeaturedSpotlight'
import { ProductCard } from '../widgets/ProductCard'
import { SectionHeader } from '../widgets/SectionHeader'

const categoryKeys = Object.keys(CATEGORY_LABELS) as ProductCategory[]

function IconGiftPackages({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 7h9v4H3V7h9M12 7V5a2 2 0 114 0v2M12 7V5a2 2 0 10-4 0v2M5 11v10a1 1 0 001 1h12a1 1 0 001-1V11M12 11v11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClothes({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 4h3l1.5 2h3L15 4h3l3 3v4l-2 1v11H5V12L3 11V7l3-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconShoes({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 16c0-1.5 1.5-3 5-3.5l10-1.5 2 4.5v2H4v-1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 12.5l2-6h4.5l2.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconAccessories({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="14"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 9.5V4M9 6.5l3-2.5 3 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconAllProducts({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

const CATEGORY_ICONS: Record<
  ProductCategory,
  ComponentType<{ className?: string }>
> = {
  'gift-packages': IconGiftPackages,
  clothes: IconClothes,
  shoes: IconShoes,
  accessories: IconAccessories,
}

const homeCategoryTiles: {
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
}[] = [
  ...categoryKeys.map((key) => ({
    href: `/shop?category=${key}`,
    label: CATEGORY_LABELS[key].label,
    Icon: CATEGORY_ICONS[key],
  })),
  {
    href: '/shop',
    label: 'All products',
    Icon: IconAllProducts,
  },
]

export function HomeScreen() {
  const products = useCatalogStore((s) => s.products)
  const featured = products.filter((p) => p.featured)
  const trending = products.filter((p) => p.trending)

  return (
    <div>
      <section className="relative min-h-[min(78svh,40rem)] overflow-hidden rounded-[1.75rem] shadow-premium ring-1 ring-ink/8 dark:ring-cream/10 md:min-h-[min(82svh,44rem)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-rose/50 to-rose-deep/35 dark:from-dark-surface dark:via-dark-elevated dark:to-dark-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_70%_-20%,rgba(255,255,255,0.45),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_70%_at_80%_0%,rgba(232,180,184,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/15 via-transparent to-cream/25 dark:from-dark-bg/70 dark:via-transparent dark:to-rose/5" />
        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-[1.75rem] [box-shadow:inset_0_0_140px_rgba(45,45,45,0.065),inset_0_0_56px_rgba(45,45,45,0.035)] dark:[box-shadow:inset_0_0_160px_rgba(0,0,0,0.28)]"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex min-h-[min(78svh,40rem)] flex-col items-center justify-center px-6 py-16 text-center md:min-h-[min(82svh,44rem)] md:px-12 md:py-20"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink/55 dark:text-rose/90">
            Kigali
          </p>
          <h1 className="mt-5 max-w-[14ch] font-display text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.65px] text-ink sm:text-5xl md:max-w-none md:text-6xl lg:text-[4.25rem] dark:text-cream">
            Gifts they&apos;ll remember.
          </h1>
          <p className="mx-auto mt-6 max-w-sm text-pretty text-sm leading-relaxed text-muted md:text-base dark:text-dark-muted">
            Curated packages &amp; fashion — delivered with care across Rwanda.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/shop">
              <Button variant="primary" className="!min-h-[3.35rem] !px-10 !text-[15px]">
                Shop the edit
              </Button>
            </Link>
            <Link to="/shop?category=gift-packages">
              <Button
                variant="outline"
                className="!min-h-[3.35rem] !border-2 !border-[#2d2d2d] !bg-white/55 !px-8 !font-semibold !text-[#2d2d2d] !shadow-none backdrop-blur-sm hover:!border-[#2d2d2d] hover:!bg-white/72 hover:!text-[#1f1f1f] dark:!border-neutral-600 dark:!text-cream dark:hover:!border-neutral-500 dark:hover:!text-cream"
              >
                Gift boxes
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-rose/45 blur-3xl dark:bg-rose/15" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[24rem] w-[24rem] rounded-full bg-cream/70 blur-3xl dark:bg-rose-deep/10" />
      </section>

      <section className="mt-8 md:mt-10">
        <SectionHeader
          eyebrow="Browse"
          title="By category"
          subtitle="Find the perfect gift for every occasion"
          align="center"
        />
        <div className="mx-auto grid max-w-5xl grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
          {homeCategoryTiles.map(({ href, label, Icon }) => (
            <Link
              key={href + label}
              to={href}
              className="nyanja-card nyanja-card-interactive group flex min-h-[120px] w-full max-w-[200px] flex-col items-center justify-center text-center sm:max-w-none"
            >
              <Icon className="mb-2.5 h-8 w-8 shrink-0 text-ink/50 transition group-hover:text-rose-deep dark:text-cream/55 dark:group-hover:text-rose" />
              <span className="text-[13px] font-medium leading-tight text-ink dark:text-cream">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-14 space-y-14 md:mt-16 md:space-y-16">
        <section className="space-y-5">
          <SectionHeader
            eyebrow="Handpicked"
            title="Featured spotlight"
            action={
              <Link
                to="/shop"
                className="text-sm font-semibold text-rose-deep underline-offset-4 transition hover:underline dark:text-rose"
              >
                View all
              </Link>
            }
          />
          <FeaturedSpotlight products={featured} />
        </section>

        <section>
          <SectionHeader eyebrow="Most loved" title="Trending now" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {trending.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
