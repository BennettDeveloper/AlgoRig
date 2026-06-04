import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f97316',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
