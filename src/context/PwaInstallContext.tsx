import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const DISMISS_KEY = 'nyanja-pwa-install-dismissed'

/** Chromium’s deferred install prompt (not in every TypeScript DOM lib). */
interface BeforeInstallPromptEventChromium extends Event {
  readonly platforms: string[]
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Read Chromium’s one-shot deferred install prompt (stored by inline script in index.html). */
function windowDeferredPrompt(): BeforeInstallPromptEventChromium | null {
  if (typeof window === 'undefined') return null
  const e = window.__NYANJA_BIP__
  return e &&
    typeof (e as BeforeInstallPromptEventChromium).prompt === 'function' &&
    typeof (e as BeforeInstallPromptEventChromium).userChoice !== 'undefined'
    ? (e as BeforeInstallPromptEventChromium)
    : null
}

export function runningAsInstalledPwa(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches
  )
}

/** iPadOS 13+ often reports as Mac — treat large touch Safari as needing the same hint. */
export function iosNeedsAddToHomescreen(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  if (/iphone|ipod/i.test(ua)) return true
  if (/ipad/i.test(ua)) return true
  return (
    window.navigator.platform === 'MacIntel' &&
    window.navigator.maxTouchPoints > 1
  )
}

function pwaInstallDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const until = Number.parseInt(raw, 10)
    return Number.isFinite(until) && until > Date.now()
  } catch {
    return false
  }
}

export type PwaInstallContextValue = {
  ready: boolean
  standalone: boolean
  showInstallButton: boolean
  deferredReady: boolean
  dismiss: () => void
  tapInstall: () => void
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventChromium | null>(() =>
    windowDeferredPrompt(),
  )
  const [dismissTick, setDismissTick] = useState(0)

  useEffect(() => {
    if (runningAsInstalledPwa()) {
      setReady(true)
      return
    }

    const syncFromWindow = () => {
      setDeferred(windowDeferredPrompt())
    }

    syncFromWindow()
    window.addEventListener('nyanja:bip', syncFromWindow)
    window.addEventListener('nyanja:installed', syncFromWindow)
    setReady(true)

    return () => {
      window.removeEventListener('nyanja:bip', syncFromWindow)
      window.removeEventListener('nyanja:installed', syncFromWindow)
    }
  }, [])

  const consumeDeferredPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.__NYANJA_BIP__ = null
    }
    setDeferred(null)
  }, [])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + 7 * 24 * 60 * 60 * 1000),
      )
    } catch {
      /* quota */
    }
    consumeDeferredPrompt()
    setDismissTick((n) => n + 1)
  }, [consumeDeferredPrompt])

  const runInstall = useCallback(async () => {
    const d = deferred
    if (!d) return
    try {
      await d.prompt()
      await d.userChoice
    } catch {
      /* prompt may throw if disallowed */
    } finally {
      consumeDeferredPrompt()
    }
  }, [deferred, consumeDeferredPrompt])

  const tapInstall = useCallback(() => {
    if (deferred) {
      void runInstall()
      return
    }
    if (iosNeedsAddToHomescreen()) {
      window.alert(
        'To add Nyanja Gift Hub to your home screen (Safari on iPhone/iPad):\n\n1. Tap Share (square with arrow).\n2. Scroll down and tap “Add to Home Screen”.\n3. Tap Add.',
      )
    }
  }, [deferred, runInstall])

  const value = useMemo((): PwaInstallContextValue => {
    void dismissTick
    const standalone = ready && runningAsInstalledPwa()
    const dismissed = ready && pwaInstallDismissed()
    const canChromiumPrompt = deferred != null
    const showIosManual = iosNeedsAddToHomescreen()
    const showInstallButton =
      ready &&
      !standalone &&
      !dismissed &&
      (canChromiumPrompt || showIosManual)

    return {
      ready,
      standalone,
      showInstallButton,
      deferredReady: canChromiumPrompt,
      dismiss,
      tapInstall,
    }
  }, [ready, deferred, dismiss, tapInstall, dismissTick])

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  )
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext)
  if (!ctx) {
    throw new Error('usePwaInstall must be used inside PwaInstallProvider')
  }
  return ctx
}
