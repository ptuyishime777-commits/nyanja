import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const sessionUserId = useAuthStore((s) => s.sessionUserId)

  const canAdmin = useAuthStore((s) => {
    if (!s.sessionUserId) return false
    const u = s.users.find((x) => x.id === s.sessionUserId)
    return !!(u && !u.disabled && u.role === 'admin')
  })

  if (!sessionUserId) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, admin: true }}
      />
    )
  }

  if (!canAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
