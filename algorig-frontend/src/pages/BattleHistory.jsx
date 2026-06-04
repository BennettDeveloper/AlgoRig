import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserBattles } from '../api/battles'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
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

function BattleCard({ battle }) {
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
          fontSize: 14,
          fontWeight: 900,
          color: resultColor,
          letterSpacing: '0.08em',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {resultLabel}
        </div>
        <div style={{
          fontSize: 11,
          color: '#8888aa',
          marginTop: 5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 80,
        }}>
          {robotAName}
        </div>
      </div>

      {/* VS */}
      <div style={{
        color: '#333355',
        fontWeight: 900,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        flexShrink: 0,
        letterSpacing: '0.1em',
      }}>
        VS
      </div>

      {/* Opponent (owner) + their robot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          border: '1px solid rgba(249,115,22,0.3)',
        }}>
          {battle.ownerAvatarUrl ? (
            <img
              src={battle.ownerAvatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : ownerInitial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#f0f0ff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {battle.ownerUsername ?? 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>
            {robotBName}
          </div>
        </div>
      </div>

      {/* Meta + action */}
      <div style={{
        flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VisibilityBadge isPublic={battle.isPublic} />
          <span style={{
            fontSize: 11, color: '#555577',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {battle.totalTurns} turn{battle.totalTurns !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 11, color: '#444466' }}>
            {formatDate(battle.foughtAt)}
          </span>
        </div>
        <Link
          to={`/battles/${battle.battleCode}`}
          style={{
            padding: '6px 14px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 8,
            color: '#f97316',
            fontSize: 11,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
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

export default function BattleHistory() {
  const navigate = useNavigate()
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserBattles()
      .then(data => setBattles(data))
      .catch(() => setBattles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.2em',
            color: '#f97316',
            textTransform: 'uppercase',
            fontWeight: '600',
          }}>
            My Battles
          </span>
          <div style={{ height: '1px', width: 60, background: 'linear-gradient(90deg, rgba(249,115,22,0.3), transparent)' }} />
        </div>
        <button
          onClick={() => navigate('/battles/new')}
          style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.5)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.3)'}
        >
          ⚔️ New Battle
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 86,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 14,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && battles.length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '56px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 48, lineHeight: 1 }}>⚔️</span>
          <p style={{ color: '#555577', fontSize: 14, maxWidth: 320 }}>
            No battles yet. Launch your first battle to see your history!
          </p>
          <button
            onClick={() => navigate('/battles/new')}
            style={{
              marginTop: 4,
              padding: '10px 24px',
              background: '#f97316',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(249,115,22,0.3)',
              fontFamily: 'inherit',
            }}
          >
            Launch First Battle
          </button>
        </div>
      )}

      {/* Battle cards */}
      {!loading && battles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ color: '#444466', fontSize: 12, marginBottom: 4 }}>
            {battles.length} battle{battles.length !== 1 ? 's' : ''} total
          </p>
          {battles.map(battle => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </div>
  )
}
