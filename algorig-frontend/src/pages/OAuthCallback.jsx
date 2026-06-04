import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export default function OAuthCallback() {
  const { login, updateUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('OAuth login failed. No token received.')
      return
    }

    const payload = decodeJwtPayload(token)
    if (!payload) {
      setError('OAuth login failed. Invalid token.')
      return
    }

    const userObj = {
      userId: parseInt(payload.sub, 10),
      email: payload.email || '',
      username: payload.username || '',
      avatarUrl: null,
    }

    login({ token, ...userObj })

    // Fetch full profile to populate avatarUrl
    client.get('/auth/me')
      .then(res => {
        const me = res.data
        updateUser({
          userId: me.id,
          username: me.username,
          email: me.email,
          avatarUrl: me.avatarUrl,
        })
      })
      .catch(() => { /* avatarUrl stays null — non-critical */ })
      .finally(() => {
        navigate('/', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <p style={{ color: '#ff6b6b', fontSize: '15px', textAlign: 'center' }}>{error}</p>
        <Link
          to="/login"
          style={{
            color: '#f97316',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            padding: '10px 24px',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '8px',
          }}
        >
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f97316',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '14px',
      gap: '12px',
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid rgba(249,115,22,0.2)',
        borderTopColor: '#f97316',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Signing you in…
    </div>
  )
}
