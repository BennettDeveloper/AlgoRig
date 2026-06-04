import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const publicLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/robots', label: 'Robots' },
  { to: '/repository', label: 'Repository' },
]

const authedLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/robots', label: 'Robots' },
  { to: '/repository', label: 'Repository' },
  { to: '/scripts', label: 'Scripts' },
  { to: '/battles', label: 'Battles' },
]

const navLinkStyle = ({ isActive }) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  color: isActive ? '#f97316' : '#8888aa',
  background: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
  border: `1px solid ${isActive ? 'rgba(249,115,22,0.2)' : 'transparent'}`,
  transition: 'all 0.2s ease',
})

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const links = isAuthenticated ? authedLinks : publicLinks

  const initial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <nav style={{
      background: 'rgba(8,8,16,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 1px 0 rgba(249,115,22,0.08)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '18px',
          fontWeight: '600',
          color: '#f97316',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: '8px',
          padding: '4px 10px',
          letterSpacing: '0.05em',
        }}>[A]</div>
        <span style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '0.15em', color: '#f0f0ff' }}>
          ALGORIG
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={navLinkStyle}>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side: auth controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuthenticated ? (
          <>
            {/* Avatar circle — links to own profile if username available */}
            {user?.username ? (
              <Link
                to={`/profile/${user.username}`}
                title={user.username}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(249,115,22,0.3)',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 18px rgba(249,115,22,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(249,115,22,0.3)'}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : initial}
              </Link>
            ) : (
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: '#fff',
                cursor: 'default',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(249,115,22,0.3)',
                overflow: 'hidden',
              }}
                title={user?.email}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : initial}
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              style={{
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#8888aa',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'
                e.currentTarget.style.color = '#ff6b6b'
                e.currentTarget.style.background = 'rgba(255,107,107,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#8888aa'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '7px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#8888aa',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.color = '#f0f0ff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#8888aa'
              }}
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '7px 16px',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.08))',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: '8px',
                color: '#f97316',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.08))'}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
