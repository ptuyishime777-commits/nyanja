import {
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import { AppShellSkeleton } from './AppShellSkeleton'
import { useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { applyThemeClass, useHubStore } from '../store/useHubStore'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Survives React Strict Mode double-mount: only the first successful INITIAL_SESSION
 * runs the expensive remote catalog + profiles fetch.
 */
let initialRemoteCatalogUsersSynced = false

export function PersistenceGate({ children }: { children: ReactNode }) {
  const [hubHydrated, setHubHydrated] = useState(false)

  // 1) Zustand persist (cart, theme) from localStorage first — fast, no network.
  useLayoutEffect(() => {
    let alive = true
    void (async () => {
      await useHubStore.persist.rehydrate()
      if (!alive) return
      applyThemeClass(useHubStore.getState().theme)
      setHubHydrated(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  // 2) Offline / no Supabase → local seed catalog only
  useEffect(() => {
    if (!hubHydrated || isSupabaseConfigured()) return
    void useCatalogStore.getState().fetchProducts()
  }, [hubHydrated])

  // 3) Supabase — session comes from this single listener (includes INITIAL_SESSION).
  //    No separate getSession() on boot; sign-in/out handled here too.
  useEffect(() => {
    if (!hubHydrated || !isSupabaseConfigured()) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null
      useAuthStore.setState({ sessionUserId: uid })

      if (event === 'INITIAL_SESSION') {
        if (!initialRemoteCatalogUsersSynced) {
          initialRemoteCatalogUsersSynced = true
          try {
            await useAuthStore.getState().ensureSeeded()
          } catch (e) {
            console.error('[Nyanja] Initial catalog / users sync failed', e)
          }
        }
        useAuthStore.getState().syncHubFromSession()
        return
      }

      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          users: [],
          buckets: {},
          remoteError: null,
        })
        return
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        try {
          await useAuthStore.getState().refreshRemoteState()
        } catch (e) {
          console.error('[Nyanja] refreshRemoteState failed', e)
        }
        useAuthStore.getState().syncHubFromSession()
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        useAuthStore.getState().syncHubFromSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [hubHydrated])

  useEffect(() => {
    return useHubStore.subscribe((state, prev) => {
      if (
        state.cart === prev.cart &&
        state.wishlistIds === prev.wishlistIds
      ) {
        return
      }
      if (!useAuthStore.getState().sessionUserId) return
      void useAuthStore.getState().saveActiveBucketFromHub()
    })
  }, [])

  if (!hubHydrated) {
    return <AppShellSkeleton />
  }

  return children
}
