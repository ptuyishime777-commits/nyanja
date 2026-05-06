import { Outlet } from 'react-router-dom'

/** Plain outlet — avoids Framer Motion + AnimatePresence `mode="wait"` leaving the tree at opacity 0 on first paint. */
export function AnimatedOutlet() {
  return (
    <div className="flex-1">
      <Outlet />
    </div>
  )
}
