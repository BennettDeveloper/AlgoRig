import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const INPUT_STYLE = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f0f0ff',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
}

function OAuthButton({ icon, label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: '10px 14px',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: '#c0c0d0',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#c0c0d0">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError('All fields are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      const res = await client.post('/auth/register', { username, email, password })
      login(res.data)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = import.meta.env.VITE_BACKEND_URL + '/oauth2/authorize/google'
  }

  const handleGitHub = () => {
    window.location.href = import.meta.env.VITE_BACKEND_URL + '/oauth2/authorize/github'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(10,10,20,0.95)',
        border: '1px solid rgba(249,115,22,0.2)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '20px',
              fontWeight: '600',
              color: '#f97316',
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
            }}>[A]</div>
            <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '0.15em', color: '#f0f0ff' }}>
              ALGORIG
            </span>
          </div>
          <p style={{ color: '#555577', fontSize: '14px', marginTop: '8px' }}>
            Create your account
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={INPUT_STYLE}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={INPUT_STYLE}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={INPUT_STYLE}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <p style={{ color: '#444466', fontSize: '11px', marginTop: '5px', marginLeft: '2px' }}>
              Minimum 8 characters
            </p>
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={INPUT_STYLE}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '13px',
            marginBottom: '16px',
            padding: '10px 12px',
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: '8px',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '13px',
            background: isLoading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            marginBottom: '24px',
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.5)' }}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.3)'}
        >
          {isLoading ? 'Creating account…' : 'Create Account'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: '#444466', fontSize: '12px', whiteSpace: 'nowrap' }}>or sign up with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* OAuth */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <OAuthButton icon={<GoogleIcon />} label="Google" onClick={handleGoogle} />
          <OAuthButton icon={<GitHubIcon />} label="GitHub" onClick={handleGitHub} />
        </div>

        {/* Log in link */}
        <p style={{ textAlign: 'center', color: '#444466', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: '500' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
