import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { HeaderBar } from './HeaderBar'
import { BottomNav } from './BottomNav'
import { AnimatedOutlet } from './AnimatedOutlet'
import { WhatsAppFab } from '../WhatsAppFab'
import { useCatalogStore } from '../../store/useCatalogStore'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export function AppLayout() {
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/checkout')

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const storefront =
      pathname === '/' ||
      pathname.startsWith('/shop') ||
      pathname.startsWith('/product') ||
      pathname === '/cart'
    if (!storefront) return
    void useCatalogStore.getState().fetchProducts({ silent: true })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderBar />
      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-3 pt-[calc(var(--header-bar-height)+1rem)] sm:px-5 md:px-8 md:pt-[calc(var(--header-bar-height)+1.5rem)] md:pb-12 ${
          hideNav ? 'pb-12' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        <AnimatedOutlet />
      </main>
      {!hideNav && <BottomNav />}
      <WhatsAppFab />
    </div>
  )
}
