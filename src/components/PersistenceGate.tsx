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

  // 3) With Supabase — load the shop catalog as soon as the hub is ready (does not depend on auth).
  useEffect(() => {
    if (!hubHydrated || !isSupabaseConfigured()) return
    void useCatalogStore.getState().fetchProducts()
  }, [hubHydrated])

  // 3b) Tab visible again — quietly resync catalog (admin edits, other tabs).
  useEffect(() => {
    if (!hubHydrated || !isSupabaseConfigured()) return
    let debounce: ReturnType<typeof setTimeout> | undefined
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        void useCatalogStore.getState().fetchProducts({ silent: true })
      }, 400)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearTimeout(debounce)
    }
  }, [hubHydrated])

  // 4) Session + profiles/orders: single listener, no getSession() on boot.
  //    Defer async work off the auth callback — awaiting inside the listener can stall
  //    signIn and block INITIAL_SESSION / SIGNED_IN from finishing (Supabase gotrue lock).
  useEffect(() => {
    if (!hubHydrated || !isSupabaseConfigured()) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null
      useAuthStore.setState({ sessionUserId: uid })

      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          users: [],
          buckets: {},
          remoteError: null,
          remoteLoading: false,
        })
        return
      }

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED'
      ) {
        useAuthStore.setState({ remoteLoading: true, remoteError: null })
      }

      if (event === 'TOKEN_REFRESHED') {
        setTimeout(() => {
          useAuthStore.getState().syncHubFromSession()
        }, 0)
        return
      }

      const run = () => {
        void (async () => {
          if (event === 'INITIAL_SESSION') {
            try {
              await useAuthStore.getState().refreshRemoteState()
            } catch (e) {
              console.error('[Nyanja] INITIAL_SESSION refreshRemoteState failed', e)
            }
            useAuthStore.getState().syncHubFromSession()
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
        })()
      }

      setTimeout(run, 0)
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
