import { Link, useLocation } from 'react-router-dom'

const primaryActions = [
  { icon: '⚔️', label: 'Start Battle', to: '/battles/new' },
  { icon: '</>', label: 'Script Editor', to: '/scripts/new', mono: true },
  { icon: '🤖', label: 'RoboBuilder', to: '/robots' },
]

const secondaryActions = [
  { icon: '👁️', label: 'Watch a Battle', to: '/battles' },
  { icon: '📋', label: 'Browse Scripts', to: '/scripts' },
  { icon: '📊', label: 'Leaderboard', to: '/leaderboard' },
]

function SidebarButton({ icon, label, to, primary, mono }) {
  const location = useLocation()
  const isActive = location.pathname === to

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    borderRadius: '10px',
    background: isActive
      ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))'
      : primary ? 'rgba(255,255,255,0.03)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(249,115,22,0.35)' : primary ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
    color: isActive ? '#f97316' : primary ? '#d0d0e8' : '#666688',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 0 16px rgba(249,115,22,0.15)' : 'none',
  }

  return (
    <Link to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
      <div
        style={baseStyle}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = primary
              ? 'rgba(249,115,22,0.08)'
              : 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = primary ? '#f97316' : '#9090bb'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = primary
              ? 'rgba(255,255,255,0.03)'
              : 'transparent'
            e.currentTarget.style.color = primary ? '#d0d0e8' : '#666688'
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  )
}

function Divider() {
  return (
    <div style={{
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.2), transparent)',
      margin: '14px 0',
    }} />
  )
}

export default function LeftPanel() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '240px',
      minWidth: '240px',
      maxWidth: '240px',
      padding: '24px 12px',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 8px', marginBottom: '24px' }} className="animate-slide-in-left">
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px',
          fontWeight: '700',
          color: '#f97316',
          textShadow: '0 0 30px rgba(249,115,22,0.5)',
          lineHeight: 1,
        }}>[A]</div>
        <div style={{
          fontSize: '18px',
          fontWeight: '800',
          letterSpacing: '0.2em',
          color: '#f0f0ff',
          marginTop: '4px',
        }}>ALGORIG</div>
        <div style={{
          fontSize: '11px',
          color: '#444466',
          letterSpacing: '0.1em',
          marginTop: '4px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>ARENA v0.1</div>
      </div>

      {/* Tier selector */}
      <div style={{ padding: '0 8px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '10px',
          color: '#444466',
          letterSpacing: '0.15em',
          marginBottom: '6px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>ROBOT TIER</div>
        <select style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#d0d0e8',
          fontSize: '13px',
          outline: 'none',
          cursor: 'pointer',
        }}>
          {['All Tiers', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'].map(t => (
            <option key={t} value={t} style={{ background: '#0f0f1a' }}>{t}</option>
          ))}
        </select>
      </div>

      <Divider />

      {/* Primary actions */}
      <div>
        {primaryActions.map((a, i) => (
          <div key={a.to} className={`animate-fade-in-up stagger-${i + 1}`}>
            <SidebarButton {...a} primary />
          </div>
        ))}
      </div>

      <Divider />

      {/* Secondary actions */}
      <div>
        {secondaryActions.map(a => (
          <SidebarButton key={a.to} {...a} />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Version tag */}
      <div style={{
        padding: '8px',
        fontSize: '10px',
        color: '#333355',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.1em',
      }}>
        AlgoRig MVP · v0.1.0
      </div>
    </div>
  )
}
