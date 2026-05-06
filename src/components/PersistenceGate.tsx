import { useEffect, useState, type ReactNode } from 'react'
import { SEED_PRODUCTS } from '../data/products'
import { useAuthStore } from '../store/useAuthStore'
import { useCatalogStore } from '../store/useCatalogStore'
import { applyThemeClass, useHubStore } from '../store/useHubStore'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const BOOT_TIMEOUT_MS = 15_000

function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([
    promise.then((v) => v),
    new Promise<'timeout'>((resolve) =>
      window.setTimeout(() => resolve('timeout'), ms),
    ),
  ])
}

export function PersistenceGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let ignore = false

    const runBoot = async () => {
      try {
        const rehydrateMaybe = useHubStore.persist.rehydrate()
        const reh = await raceWithTimeout(
          Promise.resolve(rehydrateMaybe as Promise<void> | void),
          BOOT_TIMEOUT_MS,
        )
        if (reh === 'timeout') {
          console.warn('[Nyanja] Hub rehydrate timed out; continuing with defaults.')
        }
        if (ignore) return

        if (isSupabaseConfigured()) {
          const sessResult = await raceWithTimeout(
            supabase.auth.getSession(),
            BOOT_TIMEOUT_MS,
          )
          if (sessResult !== 'timeout') {
            const {
              data: { session },
            } = sessResult as Awaited<ReturnType<typeof supabase.auth.getSession>>
            useAuthStore.setState({
              sessionUserId: session?.user.id ?? null,
            })
          } else {
            console.warn('[Nyanja] getSession timed out during bootstrap.')
          }
        }

        const seed = raceWithTimeout(
          useAuthStore.getState().ensureSeeded(),
          BOOT_TIMEOUT_MS,
        )
        const seeded = await seed
        if (seeded === 'timeout') {
          console.warn('[Nyanja] ensureSeeded timed out; unlocking UI.')
          if (useCatalogStore.getState().products.length === 0) {
            useCatalogStore.setState({
              products: structuredClone(SEED_PRODUCTS),
              catalogLoading: false,
              catalogError:
                'Catalog is taking too long, showing bundled products until sync completes.',
            })
          }
        }

        if (ignore) return
        useAuthStore.getState().syncHubFromSession()
        applyThemeClass(useHubStore.getState().theme)
        setReady(true)
      } catch (e) {
        console.error('Persistence bootstrap failed', e)
        if (!ignore) {
          applyThemeClass(useHubStore.getState().theme)
          setReady(true)
        }
      }
    }

    void runBoot()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        useAuthStore.setState({ sessionUserId: session?.user.id ?? null })
        await useAuthStore.getState().refreshRemoteState()
        useAuthStore.getState().syncHubFromSession()
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  if (!ready) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-surface text-sm text-muted dark:bg-dark-bg dark:text-dark-muted"
        style={{
          minHeight: '100dvh',
          color: '#5c5256',
          backgroundColor: '#fdf8f9',
        }}
      >
        Loading…
      </div>
    )
  }

  return children
}
