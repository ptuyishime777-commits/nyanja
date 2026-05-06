import type { ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.25" />
      <rect x="14" y="3" width="7" height="7" rx="1.25" />
      <rect x="3" y="14" width="7" height="7" rx="1.25" />
      <rect x="14" y="14" width="7" height="7" rx="1.25" />
    </svg>
  )
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M7 4h11a2 2 0 012 2v14l-2.5-1.5L15 18l-2.5-1.5L10 18l-2.5-1.5L5 18V6a2 2 0 012-2z"
        strokeLinejoin="round"
      />
      <path d="M9 9h8M9 13h8" strokeLinecap="round" />
    </svg>
  )
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" strokeLinecap="round" />
    </svg>
  )
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 12.5V5a1 1 0 011-1h7.5L20 11.35a1.75 1.75 0 010 2.45l-6.6 6.6a2 2 0 01-2.83 0L4 12.94" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="7.75" r="1.15" fill="currentColor" />
    </svg>
  )
}

const links: {
  to: string
  end: boolean
  label: string
  Icon: ComponentType<{ className?: string }>
}[] = [
  { to: '/admin', end: true, label: 'Overview', Icon: IconGrid },
  { to: '/admin/orders', end: false, label: 'Orders', Icon: IconReceipt },
  { to: '/admin/users', end: false, label: 'Users', Icon: IconPerson },
  { to: '/admin/products', end: false, label: 'Catalog', Icon: IconTag },
]

function navItemClass(active: boolean) {
  const base =
    'relative flex min-h-[44px] items-center gap-3 rounded-r-xl py-2.5 pr-3 pl-[13px] text-sm font-medium transition-[border-color,background-color,color] duration-200 border-l-[3px]'
  return active
    ? `${base} border-l-rose-deep bg-rose/25 text-ink shadow-[2px_0_12px_rgba(219,169,173,0.15)] dark:border-l-rose dark:bg-rose/18 dark:text-cream`
    : `${base} border-l-transparent text-muted hover:border-l-rose/55 hover:bg-rose/22 hover:text-ink dark:text-dark-muted dark:hover:border-l-rose/45 dark:hover:bg-rose/12 dark:hover:text-cream`
}

export function AdminLayout() {
  return (
    <div className="min-h-dvh bg-surface text-ink dark:bg-dark-bg dark:text-cream">
      <header className="sticky top-0 z-20 border-b border-ink/8 bg-surface/95 backdrop-blur-xl dark:border-cream/10 dark:bg-dark-bg/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink to="/admin" className="font-display text-xl font-semibold tracking-tight">
            Nyanja <span className="text-sm font-sans font-medium text-muted dark:text-dark-muted">Admin</span>
          </NavLink>
          <NavLink
            to="/"
            className="text-sm font-semibold text-rose-deep underline-offset-4 hover:underline dark:text-rose"
          >
            ← Back to store
          </NavLink>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-ink/6 px-2 py-2 scrollbar-none dark:border-cream/10 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                    : 'text-muted hover:bg-rose/30 hover:text-ink dark:text-dark-muted dark:hover:bg-rose/15 dark:hover:text-cream'
                }`
              }
            >
              <l.Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-[3.25rem] hidden h-[calc(100dvh-3.25rem)] w-52 shrink-0 border-r border-ink/8 py-6 pr-2 pl-0 dark:border-cream/10 md:block lg:w-[14.5rem]">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            Menu
          </p>
          <ul className="space-y-0.5">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={({ isActive }) => navItemClass(isActive)}>
                  <l.Icon className="h-5 w-5 shrink-0 opacity-90" />
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>
        <main className="min-h-[calc(100dvh-7rem)] flex-1 p-4 pb-12 md:min-h-[calc(100dvh-4rem)] md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
