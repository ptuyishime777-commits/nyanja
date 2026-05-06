import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../context/PwaInstallContext'
import { getSessionUser, useAuthStore } from '../../store/useAuthStore'
import { useHubStore } from '../../store/useHubStore'
import { initialsForUser } from '../../utils/userInitials'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/cart', label: 'Cart' },
] as const

function navLinkClass(active: boolean, isShop: boolean): string {
  const base =
    'relative pb-1 text-sm transition-colors after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:origin-left after:transition-transform after:duration-300 after:ease-out'
  const shop = isShop ? ' font-semibold' : ' font-medium'
  if (active) {
    return `${base}${shop} text-ink after:scale-x-100 after:bg-rose-deep dark:text-cream dark:after:bg-rose`
  }
  return `${base}${shop} text-muted after:scale-x-0 after:bg-ink/55 hover:text-ink dark:text-dark-muted dark:after:bg-cream/70 dark:hover:text-cream hover:after:scale-x-100`
}

function ProfileMenuPanel({
  accountEmail,
  onLogout,
}: {
  accountEmail: string
  onLogout: () => void
}) {
  return (
    <div
      className="absolute right-0 top-full z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#1c1c1c] py-2 text-left text-cream shadow-[0_8px_32px_rgba(0,0,0,0.2)] md:w-56"
      role="menu"
    >
      <p className="border-b border-white/10 px-3 pb-2 pt-1 text-[11px] font-normal uppercase tracking-[0.12em] text-cream/50">
        Signed in
      </p>
      <p
        className="max-w-full truncate px-3 py-2 text-sm font-normal text-cream/90"
        title={accountEmail}
      >
        {accountEmail}
      </p>
      <button
        type="button"
        role="menuitem"
        className="mx-2 mt-1 w-[calc(100%-1rem)] rounded-xl px-2 py-2.5 text-left text-sm font-medium text-cream/95 transition hover:bg-white/10"
        onClick={onLogout}
      >
        Log out
      </button>
    </div>
  )
}

export function HeaderBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)
  const desktopProfileRef = useRef<HTMLDivElement>(null)
  const mobileProfileRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mdUp, setMdUp] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches,
  )

  const cartCount = useHubStore((s) =>
    s.cart.reduce((n, l) => n + l.quantity, 0),
  )

  const sessionUser = useAuthStore((s) => getSessionUser(s))
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const logout = useAuthStore((s) => s.logout)
  const { showInstallButton, tapInstall, dismiss: dismissPwaInstall } =
    usePwaInstall()

  const accountEmail = sessionUser?.email ?? null

  const accountPath = sessionUserId ? '/profile' : '/login'

  const measureBar = useCallback(() => {
    const el = headerRef.current
    if (!el) return
    const h = Math.round(el.getBoundingClientRect().height)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--header-bar-height', `${h}px`)
    }
  }, [])

  useLayoutEffect(() => {
    measureBar()
    const el = headerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measureBar())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measureBar])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const syncMd = () => setMdUp(mq.matches)
    syncMd()
    mq.addEventListener('change', syncMd)
    return () => mq.removeEventListener('change', syncMd)
  }, [])

  useEffect(() => setMenuOpen(false), [mdUp])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (desktopProfileRef.current?.contains(target)) return
      if (mobileProfileRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  const initials =
    sessionUser && accountEmail
      ? initialsForUser(sessionUser.displayName, accountEmail)
      : ''

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/', { replace: true })
  }

  const avatarButtonClass = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/[0.2] bg-ink text-[11px] font-semibold tracking-tight text-cream shadow-sm transition hover:bg-ink/90 dark:border-cream/[0.2] dark:bg-[#171717] dark:hover:bg-black/95 ${menuOpen ? 'ring-2 ring-rose-deep/55 ring-offset-2 ring-offset-surface dark:ring-rose/50 dark:ring-offset-dark-bg' : ''}`

  const profileLoggedIn =
    sessionUserId && accountEmail ? (
      <>
        <span
          className="mx-2 hidden h-5 w-px shrink-0 bg-ink/[0.14] md:block dark:bg-cream/[0.18]"
          aria-hidden
        />
        <div className="relative hidden md:block" ref={desktopProfileRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={avatarButtonClass}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Account menu"
          >
            <span aria-hidden>{initials}</span>
          </button>
          {menuOpen && mdUp ? (
            <ProfileMenuPanel
              accountEmail={accountEmail}
              onLogout={handleLogout}
            />
          ) : null}
        </div>
      </>
    ) : null

  const profileMobile =
    sessionUserId && accountEmail ? (
      <div className="relative md:hidden" ref={mobileProfileRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={avatarButtonClass}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="Account menu"
        >
          <span aria-hidden>{initials}</span>
        </button>
        {menuOpen && !mdUp ? (
          <ProfileMenuPanel
            accountEmail={accountEmail}
            onLogout={handleLogout}
          />
        ) : null}
      </div>
    ) : null

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 right-0 left-0 z-50 w-full shrink-0 border-b border-[#e8e2dc] transition-all duration-200 ease-[ease] dark:border-cream/[0.14] ${
          scrolled
            ? 'bg-[rgba(255,255,255,0.85)] [box-shadow:0_2px_16px_rgba(0,0,0,0.10)] backdrop-blur-[12px] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] dark:bg-[rgba(26,26,26,0.88)] dark:[box-shadow:0_2px_16px_rgba(0,0,0,0.5)]'
            : 'bg-surface/80 backdrop-blur-md dark:bg-dark-bg/85'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="group flex shrink-0 items-baseline gap-1">
            <span className="font-display text-[1.44rem] leading-none font-semibold tracking-tight text-ink md:text-[1.73rem] dark:text-cream">
              Nyanja
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
              Gift Hub RW
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-0 md:flex">
            <div className="flex items-center gap-6 lg:gap-10 xl:gap-12">
              {showInstallButton && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-rose-deep/40 bg-rose/25 pl-3 pr-1 py-1 dark:border-rose/35 dark:bg-rose/15">
                  <button
                    type="button"
                    onClick={() => tapInstall()}
                    className="text-xs font-semibold text-ink dark:text-cream"
                  >
                    Install app
                  </button>
                  <button
                    type="button"
                    aria-label="Hide install prompt for one week"
                    onClick={dismissPwaInstall}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-ink/55 transition hover:bg-black/5 hover:text-ink dark:text-cream/55 dark:hover:bg-white/10 dark:hover:text-cream"
                  >
                    ×
                  </button>
                </span>
              )}
              {links.map((l) => {
                const active =
                  location.pathname === l.to ||
                  (l.to === '/shop' &&
                    location.pathname.startsWith('/product'))
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={navLinkClass(active, l.to === '/shop')}
                  >
                    {l.label}
                    {l.to === '/cart' && cartCount > 0
                      ? ` (${cartCount})`
                      : ''}
                  </Link>
                )
              })}
              <Link
                to={accountPath}
                state={
                  sessionUserId ? undefined : { from: location.pathname }
                }
                className={navLinkClass(
                  location.pathname === '/profile' ||
                    location.pathname === '/login',
                  false,
                )}
              >
                {sessionUserId ? 'Account' : 'Sign in'}
              </Link>
            </div>
            {profileLoggedIn}
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {showInstallButton && (
              <button
                type="button"
                onClick={() => tapInstall()}
                className="shrink-0 rounded-full border border-rose-deep/45 bg-rose/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-deep dark:border-rose/40 dark:bg-rose/20 dark:text-rose"
              >
                Install
              </button>
            )}
            {profileMobile}
            <Link
              to="/cart"
              className="relative rounded-full px-3 py-2 text-sm font-medium text-ink dark:text-cream"
            >
              Bag
              {cartCount > 0 && (
                <span className="absolute top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-ink">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
