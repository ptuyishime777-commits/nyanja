import { type FormEvent, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  getSessionUser,
  isAdminUser,
  useAuthStore,
} from '../store/useAuthStore'
import { Button } from '../widgets/Button'
import { Input } from '../widgets/Input'

type LoginState = {
  from?: string
  admin?: boolean
  checkoutDiscount?: number
}

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const st = location.state as LoginState | null

  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const login = useAuthStore((s) => s.login)

  const allowed = useAuthStore((s) => {
    if (!s.sessionUserId) return false
    const u = s.users.find((x) => x.id === s.sessionUserId)
    return !!(u && !u.disabled)
  })

  const from = useMemo(() => {
    const raw = st?.from
    return raw && raw !== '/login' && raw !== '/register' ? raw : '/dashboard'
  }, [st?.from])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sessionUserId && allowed) {
    const u = getSessionUser(useAuthStore.getState())
    if (st?.admin && isAdminUser(u)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to={from} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await login(email, password)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }

    const u = getSessionUser(useAuthStore.getState())
    const wantAdmin = Boolean(st?.admin)
    if (wantAdmin && isAdminUser(u)) {
      navigate('/admin', { replace: true })
      return
    }
    if (wantAdmin && !isAdminUser(u)) {
      setError('This account cannot open the admin portal.')
      useAuthStore.getState().logout()
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
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight dark:text-cream">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-muted dark:text-dark-muted">
          Use your email and password to see your orders and delivery status on
          your dashboard.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
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
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink dark:text-cream">
            Password
          </label>
          <Input
            type="password"
            autoComplete="current-password"
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
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted dark:text-dark-muted">
        New here?{' '}
        <Link
          className="font-semibold text-rose-deep underline-offset-4 hover:underline dark:text-rose"
          to="/register"
          state={location.state}
        >
          Create an account
        </Link>
      </p>

      <div className="nyanja-card text-xs leading-relaxed text-muted dark:text-dark-muted">
        <p className="font-semibold text-ink dark:text-cream">Demo accounts</p>
        <p className="mt-1 font-mono text-[11px]">
          Customer · demo@nyanja.rw / DemoGift2026
        </p>
        <p className="mt-0.5 font-mono text-[11px]">
          Admin · admin@nyanja.rw / NyanjaAdmin2026
        </p>
        <p className="mt-2 text-[10px]">
          Stored only in your browser — add a backend for production.
        </p>
      </div>
    </div>
  )
}
