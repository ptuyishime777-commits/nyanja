import { type FormEvent, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../widgets/Button'
import { Input } from '../widgets/Input'

type RegState = { from?: string; checkoutDiscount?: number }

export function RegisterScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const st = location.state as RegState | null

  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const remoteLoading = useAuthStore((s) => s.remoteLoading)
  const allowed = useAuthStore((s) => {
    if (!s.sessionUserId) return false
    const u = s.users.find((x) => x.id === s.sessionUserId)
    return !!(u && !u.disabled)
  })
  const register = useAuthStore((s) => s.register)

  const remoteError = useAuthStore((s) => s.remoteError)
  const hasProfile = useAuthStore((s) =>
    s.sessionUserId
      ? s.users.some((u) => u.id === s.sessionUserId)
      : false,
  )

  const from = useMemo(() => {
    const raw = st?.from
    return raw && raw !== '/login' && raw !== '/register' ? raw : '/'
  }, [st?.from])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sessionUserId && remoteLoading) {
    return (
      <div className="mx-auto max-w-md py-24 text-center text-sm text-muted dark:text-dark-muted">
        Restoring your session…
      </div>
    )
  }

  if (sessionUserId && !remoteLoading && !hasProfile) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-sm text-ink dark:text-cream">
          Could not load your account data.
          {remoteError ? ` ${remoteError}` : ' Check RLS policies or try again.'}
        </p>
        <Button
          type="button"
          variant="primary"
          className="mx-auto"
          onClick={() => useAuthStore.getState().logout()}
        >
          Sign out
        </Button>
      </div>
    )
  }

  if (sessionUserId && !remoteLoading && !hasProfile) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-sm text-ink dark:text-cream">
          Could not load your account data.
          {remoteError ? ` ${remoteError}` : ' Check RLS policies or try again.'}
        </p>
        <Button
          type="button"
          variant="primary"
          className="mx-auto"
          onClick={() => useAuthStore.getState().logout()}
        >
          Sign out
        </Button>
      </div>
    )
  }

  if (sessionUserId && allowed) {
    return <Navigate to={from} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await register(email, password, name)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }

    navigate(from, {
      replace: true,
      state:
        from === '/checkout' && typeof st?.checkoutDiscount === 'number'
          ? { discountRwf: st.checkoutDiscount }
          : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep dark:text-rose">
          Join us
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight dark:text-cream">
          Register
        </h1>
        <p className="mt-3 text-sm text-muted dark:text-dark-muted">
          Track each order through processing and shipping. Your bag moves with
          you when you register.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink dark:text-cream">
            Full name
          </label>
          <Input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink dark:text-cream">
            Email
          </label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink dark:text-cream">
            Password (min 6 characters)
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && (
          <p className="rounded-2xl border border-rose/50 bg-rose/15 px-4 py-2 text-sm text-ink dark:text-cream">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full !min-h-12"
          disabled={busy}
        >
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted dark:text-dark-muted">
        Already have an account?{' '}
        <Link
          className="font-semibold text-rose-deep underline-offset-4 hover:underline dark:text-rose"
          to="/login"
          state={location.state}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
