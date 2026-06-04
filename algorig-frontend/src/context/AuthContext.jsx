import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem('algorig_token')
    const storedUser = localStorage.getItem('algorig_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('algorig_token')
        localStorage.removeItem('algorig_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((authResponse) => {
    const { token: newToken, userId, username, email, avatarUrl } = authResponse
    const userObj = { userId, username, email, avatarUrl }
    localStorage.setItem('algorig_token', newToken)
    localStorage.setItem('algorig_user', JSON.stringify(userObj))
    setToken(newToken)
    setUser(userObj)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('algorig_token')
    localStorage.removeItem('algorig_user')
    setToken(null)
    setUser(null)
    navigate('/login')
  }, [navigate])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('algorig_user', JSON.stringify(updatedUser))
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (ctx === null) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
