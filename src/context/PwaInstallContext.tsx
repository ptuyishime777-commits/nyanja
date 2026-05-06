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

interface BeforeInstallPromptEventPwa extends Event {
  readonly platforms: string[]
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
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
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventPwa | null>(
    null,
  )
  const [iosGuide, setIosGuide] = useState(false)
  const [dismissTick, setDismissTick] = useState(0)

  useEffect(() => {
    if (runningAsInstalledPwa()) {
      setReady(true)
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEventPwa)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    setIosGuide(iosNeedsAddToHomescreen())
    setReady(true)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
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
    setDeferred(null)
    setIosGuide(false)
    setDismissTick((n) => n + 1)
  }, [])

  const runInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }, [deferred, dismiss])

  const tapInstall = useCallback(() => {
    if (deferred) {
      void runInstall()
      return
    }
    if (iosGuide) {
      window.alert(
        'To add Nyanja Gift Hub to your home screen (Safari on iPhone/iPad):\n\n1. Tap Share (square with arrow).\n2. Scroll down and tap “Add to Home Screen”.\n3. Tap Add.',
      )
      return
    }
    window.alert(
      'To install this site as an app:\n\n• Chrome / Edge (Android or desktop): Menu (⋮ or ⋯) → “Install app” or look for the install icon in the address bar.\n\n• Safari (iPhone/iPad): Share → Add to Home Screen.',
    )
  }, [deferred, iosGuide, runInstall])

  const value = useMemo((): PwaInstallContextValue => {
    void dismissTick
    const standalone = ready && runningAsInstalledPwa()
    const dismissed = ready && pwaInstallDismissed()
    const showInstallButton = ready && !standalone && !dismissed
    return {
      ready,
      standalone,
      showInstallButton,
      deferredReady: deferred != null,
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
