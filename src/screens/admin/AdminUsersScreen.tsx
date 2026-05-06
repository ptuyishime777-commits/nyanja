import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UserRole } from '../../models/user'
import { useAuthStore } from '../../store/useAuthStore'
import { initialsForUser } from '../../utils/userInitials'

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex rounded-full bg-[#1a1a1a] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white dark:bg-black dark:text-cream">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-[#f0cfd4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2d2624] ring-1 ring-rose-deep/25 dark:bg-rose/30 dark:text-ink dark:ring-rose/40">
      Customer
    </span>
  )
}

export function AdminUsersScreen() {
  const users = useAuthStore((s) => s.users)
  const buckets = useAuthStore((s) => s.buckets)
  const setUserDisabled = useAuthStore((s) => s.setUserDisabled)
  const setUserRole = useAuthStore((s) => s.setUserRole)
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const logout = useAuthStore((s) => s.logout)

  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      [...users].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [users],
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Users
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-dark-muted">
          Enable or disable storefront access. You cannot remove the last active admin.
        </p>
      </div>

      {toast && (
        <p className="rounded-2xl border border-rose/40 bg-rose/15 px-4 py-2 text-sm text-ink dark:text-cream">
          {toast}
        </p>
      )}

      <div className="overflow-x-auto rounded-[1.25rem] border border-ink/8 bg-white/60 dark:border-cream/10 dark:bg-dark-surface/70">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-[11px] font-semibold uppercase tracking-wider text-muted dark:border-cream/10 dark:text-dark-muted">
              <th className="w-px px-4 py-4 whitespace-nowrap" aria-label="Avatar" />
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Orders</th>
              <th className="px-4 py-4">Joined</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const orders = buckets[u.id]?.orders.length ?? 0
              const isSelf = u.id === sessionUserId
              const initials = initialsForUser(u.displayName, u.email)
              return (
                <tr
                  key={u.id}
                  className={`border-b border-ink/6 last:border-0 dark:border-cream/10 ${u.disabled ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={
                        u.role === 'admin'
                          ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] font-display text-[11px] font-semibold tracking-tight text-cream shadow-sm ring-1 ring-black/15 dark:bg-black dark:text-cream dark:ring-cream/10'
                          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eab4bc] font-display text-[11px] font-semibold tracking-tight text-[#2a2422] shadow-sm ring-1 ring-rose-deep/25 dark:bg-rose-deep/85 dark:text-ink dark:ring-rose/50'
                      }
                      aria-hidden
                    >
                      {initials}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle font-medium">
                    {u.displayName}
                    {isSelf ? (
                      <span className="ml-2 text-xs font-normal text-muted dark:text-dark-muted">
                        (you)
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-4 align-middle text-muted md:max-w-none dark:text-dark-muted">
                    {u.email}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-4 align-middle font-mono text-xs [font-variant-numeric:tabular-nums]">{orders}</td>
                  <td className="px-4 py-4 align-middle text-muted dark:text-dark-muted">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-semibold tracking-tight transition active:scale-[0.98] ${
                          u.disabled
                            ? 'border-ink/[0.2] bg-transparent text-ink hover:border-rose/40 hover:bg-rose/15 dark:border-cream/25 dark:text-cream dark:hover:bg-rose/10'
                            : 'border-red-700/38 bg-transparent text-red-800 hover:border-red-700/58 hover:bg-red-500/[0.08] dark:border-red-500/45 dark:text-red-200 dark:hover:bg-red-500/15'
                        }`}
                        onClick={async () => {
                          const next = !u.disabled
                          const ok = await setUserDisabled(u.id, next)
                          if (!ok) {
                            setToast('Cannot disable the only admin account.')
                          } else {
                            setToast(null)
                          }
                        }}
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>
                      <select
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        disabled={u.disabled}
                        onChange={async (e) => {
                          const next = e.target.value as UserRole
                          const ok = await setUserRole(u.id, next)
                          if (!ok) {
                            setToast(
                              'There must always be one active administrator.',
                            )
                          } else {
                            setToast(null)
                          }
                        }}
                        className="min-h-9 rounded-lg border border-ink/15 bg-surface px-2 text-xs font-medium dark:border-cream/15 dark:bg-dark-elevated"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-ink/[0.08] border-l-[3px] border-l-rose-deep/45 bg-[#faf8f6]/92 px-4 py-3.5 text-xs leading-relaxed text-muted shadow-sm dark:border-cream/[0.1] dark:border-l-rose/50 dark:bg-dark-elevated/60 dark:text-dark-muted">
        <p>
          For your own session, use{' '}
          <button
            type="button"
            className="font-semibold text-rose-deep underline-offset-2 hover:underline dark:text-rose"
            onClick={() => logout()}
          >
            sign out
          </button>{' '}
          from the storefront account page, or{' '}
          <Link
            to="/"
            className="font-semibold text-rose-deep underline-offset-2 hover:underline dark:text-rose"
          >
            return to the shop
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
