import { NavLink } from 'react-router-dom'
import { useHubStore } from '../../store/useHubStore'

const tabs = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/shop', label: 'Explore', icon: '◎' },
  { to: '/cart', label: 'Cart', icon: '◫' },
  { to: '/profile', label: 'You', icon: '☺' },
]

export function BottomNav() {
  const cartCount = useHubStore((s) =>
    s.cart.reduce((n, l) => n + l.quantity, 0),
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink/8 bg-surface/95 backdrop-blur-xl dark:border-cream/10 dark:bg-dark-bg/95 md:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-medium transition ${
                isActive
                  ? 'text-ink dark:text-cream'
                  : 'text-muted dark:text-dark-muted'
              }`
            }
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
            {t.to === '/cart' && cartCount > 0 && (
              <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-ink">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
