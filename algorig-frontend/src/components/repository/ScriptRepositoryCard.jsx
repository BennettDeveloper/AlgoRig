import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const TIER_CONFIG = [
  { key: 'TIER_1', color: '#a1a5b4', short: 'T1' },
  { key: 'TIER_2', color: '#22c55e', short: 'T2' },
  { key: 'TIER_3', color: '#3b82f6', short: 'T3' },
  { key: 'TIER_4', color: '#7c3aed', short: 'T4' },
  { key: 'TIER_5', color: '#facc15', short: 'T5' },
]

const DIFFICULTY = {
  'Unranked':     { color: '#555577', bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.08)' },
  'Beginner':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)'  },
  'Intermediate': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)'  },
  'Advanced':     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)'  },
  'Elite':        { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)'    },
}

export default function ScriptRepositoryCard({ script }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const stats    = script.stats ?? {}
  const diff     = DIFFICULTY[stats.difficultyLabel] ?? DIFFICULTY['Unranked']
  const initial  = script.ownerUsername?.charAt(0).toUpperCase() ?? '?'
  const winRate  = stats.totalBattles > 0 ? `${stats.winRate}%` : '—'
  const winPct   = stats.totalBattles > 0 ? Math.min(stats.winRate ?? 0, 100) : 0

  function handleCopy() {
    showToast('success', '📋 Copy Coming Soon', 'Script copying will be available soon!')
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        gap: '12px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'
        e.currentTarget.style.boxShadow  = '0 0 20px rgba(249,115,22,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.boxShadow  = 'none'
      }}
    >
      {/* Top row: difficulty badge + use count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700, letterSpacing: '0.06em',
          color: diff.color, background: diff.bg,
          border: `1px solid ${diff.border}`,
          borderRadius: 4, padding: '2px 8px', flexShrink: 0,
        }}>
          {stats.difficultyLabel ?? 'Unranked'}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
          {stats.timesUsed ?? 0} battles
        </span>
      </div>

      {/* Tier requirements row */}
      {script.requiredTiers?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#666' }}>Requires:</span>
          {script.requiredTiers.map(tierKey => {
            const cfg = TIER_CONFIG.find(c => c.key === tierKey)
            if (!cfg) return null
            return (
              <span key={tierKey} style={{
                background: `${cfg.color}26`,
                border: `1px solid ${cfg.color}`,
                color: cfg.color,
                padding: '2px 8px', borderRadius: 4,
                fontSize: 11, fontWeight: 600,
              }}>
                {cfg.short}
              </span>
            )
          })}
        </div>
      )}

      {/* Script name */}
      <div style={{
        fontSize: '1.1rem', fontWeight: 'bold', color: '#f0f0ff', lineHeight: 1.3,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {script.name}
      </div>

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff',
        }}>
          {script.ownerAvatarUrl
            ? <img src={script.ownerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial}
        </div>
        {script.ownerUsername
          ? (
            <Link
              to={`/profile/${script.ownerUsername}`}
              style={{ fontSize: 12, color: '#8888aa', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.color = '#8888aa'}
            >
              @{script.ownerUsername}
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: '#555577' }}>unknown</span>
          )}
      </div>

      {/* Content preview */}
      <pre style={{
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, padding: '8px 10px', margin: 0,
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
        color: '#8888aa', lineHeight: '1.4',
        maxHeight: '80px', overflow: 'hidden',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {script.contentPreview || '(empty)'}
      </pre>

      {/* Stats bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: winPct > 50 ? '#22c55e' : winPct > 0 ? '#f59e0b' : '#555577' }}>
            {winRate}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
            {stats.wins ?? 0}W {stats.losses ?? 0}L {stats.draws ?? 0}D
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${winPct}%`,
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            borderRadius: 3, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #222' }}>
        <button
          onClick={isAuthenticated ? handleCopy : undefined}
          disabled={!isAuthenticated}
          title={!isAuthenticated ? 'Log in to Copy' : undefined}
          style={{
            flex: 1, padding: '7px 0',
            background: 'none',
            border: `1px solid ${isAuthenticated ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 8, fontFamily: 'inherit',
            color: isAuthenticated ? '#f97316' : '#444466',
            fontSize: 12, fontWeight: 600,
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (isAuthenticated) e.currentTarget.style.background = 'rgba(249,115,22,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          📋 Copy
        </button>
        <button
          onClick={() => navigate(`/repository/${script.id}`)}
          style={{
            flex: 2, padding: '7px 0',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, fontFamily: 'inherit',
            color: '#f97316', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          View Details →
        </button>
      </div>
    </div>
  )
}
