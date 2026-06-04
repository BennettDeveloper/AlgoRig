import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getScripts } from '../api/scripts'
import { getUserBattles } from '../api/battles'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VisibilityBadge({ isPublic }) {
  return (
    <span style={{
      fontSize: 10,
      fontFamily: 'JetBrains Mono, monospace',
      color: isPublic ? '#22c55e' : '#555577',
      background: isPublic ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isPublic ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      {isPublic ? 'Public' : 'Private'}
    </span>
  )
}

function RecentBattleCard({ battle }) {
  const robotAName = battle.robotA?.name ?? `Robot #${battle.robotAId}`
  const robotBName = battle.robotB?.name ?? `Robot #${battle.robotBId}`
  const isWin  = battle.winnerId === 'A'
  const isLoss = battle.winnerId === 'B'
  const isDraw = battle.winnerId === 'DRAW'

  const borderColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : '#444466'
  const resultLabel = isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'
  const resultColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : '#8888aa'

  const ownerInitial = battle.ownerUsername?.charAt(0).toUpperCase() ?? '?'

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'border-top-color 0.2s, border-right-color 0.2s, border-bottom-color 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderTopColor    = 'rgba(249,115,22,0.2)'
        e.currentTarget.style.borderRightColor  = 'rgba(249,115,22,0.2)'
        e.currentTarget.style.borderBottomColor = 'rgba(249,115,22,0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderTopColor    = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.borderRightColor  = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.07)'
      }}
    >
      {/* Result badge + your robot */}
      <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 900, color: resultColor,
          letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace',
        }}>
          {resultLabel}
        </div>
        <div style={{
          fontSize: 11, color: '#8888aa', marginTop: 5,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80,
        }}>
          {robotAName}
        </div>
      </div>

      {/* VS */}
      <div style={{
        color: '#333355', fontWeight: 900, fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, letterSpacing: '0.1em',
      }}>
        VS
      </div>

      {/* Opponent + their robot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          border: '1px solid rgba(249,115,22,0.3)',
        }}>
          {battle.ownerAvatarUrl ? (
            <img src={battle.ownerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : ownerInitial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#f0f0ff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {battle.ownerUsername ?? 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>{robotBName}</div>
        </div>
      </div>

      {/* Meta + action */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VisibilityBadge isPublic={battle.isPublic} />
          <span style={{ fontSize: 11, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
            {battle.totalTurns} turn{battle.totalTurns !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 11, color: '#444466' }}>{formatDate(battle.foughtAt)}</span>
        </div>
        <Link
          to={`/battles/${battle.id}`}
          style={{
            padding: '6px 14px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 8, color: '#f97316', fontSize: 11, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
        >
          Watch Replay →
        </Link>
      </div>
    </div>
  )
}

function SectionHeader({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.2em',
        color: '#f97316',
        textTransform: 'uppercase',
        fontWeight: '600',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(249,115,22,0.3), transparent)' }} />
    </div>
  )
}

function StatCard({ value, label, stagger }) {
  return (
    <div
      className={`animate-fade-in-up stagger-${stagger}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #f97316, transparent)',
      }} />
      <div style={{
        fontSize: '36px',
        fontWeight: '800',
        color: '#f97316',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: '11px',
        color: '#555577',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop: '8px',
      }}>{label}</div>
    </div>
  )
}

const howItWorks = [
  { step: '1', title: 'WRITE',  description: "Script your robot's logic" },
  { step: '2', title: 'ASSIGN', description: 'Pick your robot chassis' },
  { step: '3', title: 'BATTLE', description: 'Watch your robot fight' },
]

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth()
  const [robotCount,    setRobotCount]    = useState(null)
  const [battleCount,   setBattleCount]   = useState(null)
  const [scriptCount,   setScriptCount]   = useState(null)
  const [winCount,      setWinCount]      = useState(null)
  const [recentBattles, setRecentBattles] = useState([])

  useEffect(() => {
    client.get('/robots')
      .then(res => setRobotCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setRobotCount(0))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setBattleCount(null)
      setScriptCount(null)
      setWinCount(null)
      setRecentBattles([])
      return
    }

    getUserBattles()
      .then(battles => {
        setBattleCount(battles.length)
        setWinCount(battles.filter(b => b.winnerId === 'A').length)
        setRecentBattles(battles.slice(0, 3))
      })
      .catch(() => { setBattleCount(0); setWinCount(0); setRecentBattles([]) })

    getScripts()
      .then(scripts => setScriptCount(scripts.length))
      .catch(() => setScriptCount(0))
  }, [isAuthenticated])

  const fmt = val => val === null ? '—' : val

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* Welcome banner — authenticated only */}
      {isAuthenticated && user && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(168,85,247,0.04))',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '14px',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#f0f0ff',
              marginBottom: '4px',
            }}>
              Welcome back,{' '}
              <span style={{ color: '#f97316' }}>{user.username || user.email}</span>!
            </div>
            <div style={{ fontSize: '13px', color: '#555577', marginBottom: '6px' }}>
              Ready to script your next battle?
            </div>
            {user.username && (
              <Link
                to={`/profile/${user.username}`}
                style={{ fontSize: '12px', color: '#f97316', textDecoration: 'none', opacity: 0.8 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
              >
                View Profile →
              </Link>
            )}
          </div>
          <Link
            to="/battles/new"
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.3)'}
          >
            ⚔️ New Battle
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <section>
        <SectionHeader>
          {isAuthenticated ? 'My Stats' : 'Arena Stats'}
        </SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard value={fmt(battleCount)} label="My Battles"    stagger={1} />
          <StatCard value={fmt(scriptCount)} label="My Scripts"    stagger={2} />
          <StatCard value={fmt(winCount)}    label="My Wins"        stagger={3} />
          <StatCard value={fmt(robotCount)}  label="Active Robots"  stagger={4} />
        </div>
      </section>

      {/* Recent Battles */}
      <section className="animate-fade-in-up stagger-2">
        <SectionHeader>Recent Battles</SectionHeader>

        {/* Unauthenticated */}
        {!isAuthenticated && (
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '48px', lineHeight: 1, marginBottom: '4px' }}>⚔️</span>
            <p style={{ color: '#444466', fontSize: '14px' }}>Sign in to start battling.</p>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                background: '#f97316',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                marginTop: '4px',
                boxShadow: '0 0 20px rgba(249,115,22,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fb923c'}
              onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
            >
              Create Account
            </Link>
          </div>
        )}

        {/* Authenticated — no battles yet */}
        {isAuthenticated && recentBattles.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '48px', lineHeight: 1, marginBottom: '4px' }}>⚔️</span>
            <p style={{ color: '#444466', fontSize: '14px' }}>No battles recorded yet.</p>
            <Link
              to="/battles/new"
              style={{
                display: 'inline-block',
                background: '#f97316',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                marginTop: '4px',
                boxShadow: '0 0 20px rgba(249,115,22,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fb923c'}
              onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
            >
              Start First Battle
            </Link>
          </div>
        )}

        {/* Authenticated — has battles */}
        {isAuthenticated && recentBattles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentBattles.map(battle => (
              <RecentBattleCard key={battle.id} battle={battle} />
            ))}
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link
                to="/battles"
                style={{
                  fontSize: '12px',
                  color: '#f97316',
                  textDecoration: 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.05em',
                  opacity: 0.8,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
              >
                View All Battles →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="animate-fade-in-up stagger-3">
        <SectionHeader>How It Works</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {howItWorks.map(({ step, title, description }) => (
            <div
              key={step}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '24px',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              <div style={{
                fontSize: '32px',
                fontWeight: '900',
                color: 'rgba(249,115,22,0.4)',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1,
              }}>{step}.</div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                color: '#f0f0ff',
                margin: '10px 0 6px',
              }}>{title}</div>
              <div style={{ fontSize: '13px', color: '#555577' }}>{description}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
