import { Navigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAppContext()
  const location = useLocation()
  if (authLoading) return <div className="px-6 py-32 text-center text-sm text-charcoal/55">Loading your Misty account…</div>
  return user ? children : <Navigate to="/login" replace state={{ from: location, intent: location.state?.intent }} />
}

export default ProtectedRoute
