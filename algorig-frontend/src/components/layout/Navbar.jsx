import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/robots', label: 'Robots' },
  { to: '/scripts', label: 'Scripts' },
  { to: '/battles/new', label: 'Battles' },
]

export default function Navbar() {
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
        {navLinks.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            textDecoration: 'none',
            color: isActive ? '#f97316' : '#8888aa',
            background: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(249,115,22,0.2)' : 'transparent'}`,
            transition: 'all 0.2s ease',
          })}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
