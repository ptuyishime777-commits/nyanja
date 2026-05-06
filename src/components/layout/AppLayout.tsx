import { useLocation } from 'react-router-dom'
import { HeaderBar } from './HeaderBar'
import { BottomNav } from './BottomNav'
import { AnimatedOutlet } from './AnimatedOutlet'
import { WhatsAppFab } from '../WhatsAppFab'

export function AppLayout() {
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/checkout')

  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderBar />
      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 pt-[calc(var(--header-bar-height)+1.5rem)] md:px-8 md:pb-12 ${
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
