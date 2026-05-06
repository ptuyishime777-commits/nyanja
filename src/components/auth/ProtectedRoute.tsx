import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const allowed = useAuthStore((s) => {
    if (!s.sessionUserId) return false
    const u = s.users.find((x) => x.id === s.sessionUserId)
    return !!(u && !u.disabled)
  })

  if (!allowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
