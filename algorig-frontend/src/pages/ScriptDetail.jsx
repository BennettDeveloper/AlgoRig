import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScriptBattles, getScriptDetail } from '../api/scripts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/ui/Modal'

const ACTION_NAMES = new Set([
  'HardStrike', 'HeavyAttack', 'PowerSurge', 'Patch', 'Firewall',
  'ArmorPlate', 'VirusUpload', 'SystemScan', 'CpuStall',
])

const DIFFICULTY = {
  'Unranked':     { color: '#555577', bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.08)' },
  'Beginner':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)'  },
  'Intermediate': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)'  },
  'Advanced':     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)'  },
  'Elite':        { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)'    },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatChip({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '10px 14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? '#f97316', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#555577', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
        {label}
      </div>
    </div>
  )
}

function SyntaxLine({ line, idx }) {
  const trimmed = line.trim()
  let color = '#e0e0ff'
  if (trimmed === 'ELSE' || trimmed === 'END IF')                         color = '#f59e0b'
  else if (trimmed.startsWith('REPEAT ') || trimmed === 'END REPEAT')     color = '#22d3ee'
  else if (ACTION_NAMES.has(trimmed))                                      color = '#f97316'

  if (trimmed.startsWith('IF ') || trimmed === 'IF') {
    const parts = line.split(/\b(AND|OR|NOT)\b/)
    return (
      <div key={idx}>
        {parts.map((p, pi) => (
          <span key={pi} style={{
            color: ['AND', 'OR', 'NOT'].includes(p) ? '#f97316'
                 : p.trim().startsWith('IF') ? '#f59e0b'
                 : '#c084fc',
          }}>{p}</span>
        ))}
      </div>
    )
  }
  return <div key={idx} style={{ color }}>{line || ' '}</div>
}

function getScriptResult(battle, scriptId) {
  const id = Number(scriptId)
  if (battle.winnerId === 'DRAW') return 'DRAW'
  const inA = battle.scriptAId === id
  if (inA) return battle.winnerId === 'A' ? 'WIN' : 'LOSS'
  return battle.winnerId === 'B' ? 'WIN' : 'LOSS'
}

function ScriptBattleCard({ battle, scriptId }) {
  const isSelfBattle = battle.scriptAId === battle.scriptBId
  const result      = isSelfBattle ? 'SELF' : getScriptResult(battle, scriptId)
  const isWin       = result === 'WIN'
  const isLoss      = result === 'LOSS'
  const borderColor = isSelfBattle ? '#555' : isWin ? '#22c55e' : isLoss ? '#ef4444' : '#444466'
  const resultColor = isSelfBattle ? '#888' : isWin ? '#22c55e' : isLoss ? '#ef4444' : '#8888aa'
  const robotAName  = battle.robotA?.name ?? `Robot #${battle.robotAId}`
  const robotBName  = battle.robotB?.name ?? `Robot #${battle.robotBId}`
  const ownerInit   = battle.ownerUsername?.charAt(0).toUpperCase() ?? '?'

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
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
      {/* Result */}
      <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: resultColor, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
          {result}
        </div>
      </div>
      {/* VS */}
      <div style={{ fontSize: 10, fontWeight: 900, color: '#333355', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        VS
      </div>
      {/* Robots */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#f0f0ff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {robotAName} vs {robotBName}
        </div>
        {isSelfBattle && (
          <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', marginTop: 1 }}>
            (self-battle)
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#fff',
          }}>
            {battle.ownerAvatarUrl
              ? <img src={battle.ownerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ownerInit}
          </div>
          <span style={{ fontSize: 11, color: '#555577' }}>{battle.ownerUsername ?? 'Unknown'}</span>
        </div>
      </div>
      {/* Meta */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
            {battle.totalTurns} turns
          </span>
          <span style={{ fontSize: 10, color: '#444466' }}>{formatDate(battle.foughtAt)}</span>
        </div>
        <Link to={`/battles/${battle.id}`}
              style={{
                padding: '4px 12px',
                background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                borderRadius: 6, color: '#f97316', fontSize: 10, fontWeight: 600,
                textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace',
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

function PaginationBar({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
      <button onClick={onPrev} disabled={page === 0}
        style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
                 background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                 color: page === 0 ? '#333355' : '#8888aa', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
        ← Previous
      </button>
      <span style={{ fontSize: 12, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
        Page {page + 1} of {totalPages}
      </span>
      <button onClick={onNext} disabled={page >= totalPages - 1}
        style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
                 background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                 color: page >= totalPages - 1 ? '#333355' : '#8888aa', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
        Next →
      </button>
    </div>
  )
}

const ROBOT_TIER_COLORS = {
  1: '#6b7280',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#7c3aed',
  5: '#facc15',
}

function RobotStatsPanel({ robot }) {
  const statRows = [
    { label: 'Tier',                     value: robot.tier },
    { label: 'System Integrity (HP)',    value: robot.systemIntegrity },
    { label: 'Core Impact (ATK)',        value: robot.coreImpact },
    { label: 'Chassis Armor (DEF)',      value: robot.chassisArmor },
    { label: 'Clock Speed (SPD)',        value: robot.clockSpeed },
    { label: 'Battery',                  value: robot.battery },
    { label: 'Wattage (Regen)',          value: robot.wattage },
    { label: 'Cooling',                  value: robot.cooling },
    { label: 'Exploit Power',            value: robot.exploitPower },
    { label: 'Firewall Strength',        value: robot.firewallStrength },
    { label: 'Memory',                   value: robot.memory },
    { label: 'Stability',               value: robot.stability },
    { label: 'Recovery',                 value: robot.recovery },
  ]
  const hasPassive = robot.passiveDisplayName || robot.passiveAbility
  return (
    <div>
      {hasPassive && (
        <>
          <div style={{ color: '#f97316', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {robot.passiveDisplayName || robot.passiveAbility}
          </div>
          {robot.passiveDescription && (
            <div style={{ color: '#8888aa', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
              {robot.passiveDescription}
            </div>
          )}
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {statRows.map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4, fontSize: 11,
          }}>
            <span style={{ color: '#555577' }}>{label}</span>
            <span style={{ color: '#f0f0ff', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RobotChip({ robot }) {
  const [showModal, setShowModal] = useState(false)
  const color = ROBOT_TIER_COLORS[robot.tier] || '#6b7280'
  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        title="Click for robot details"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          border: `1px solid ${color}50`,
          color, background: `${color}12`,
          fontSize: 12, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}22`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
      >
        🤖 {robot.name}
        <span style={{ opacity: 0.6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          T{robot.tier}
        </span>
      </div>
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={robot.name}
        width="460px"
      >
        <RobotStatsPanel robot={robot} />
      </Modal>
    </>
  )
}

export default function ScriptDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [script, setScript]           = useState(null)
  const [battles, setBattles]         = useState([])
  const [battlePagination, setBPag]   = useState({ page: 0, totalPages: 0, totalElements: 0 })
  const [isLoading, setIsLoading]     = useState(true)
  const [battlesLoading, setBLoading] = useState(false)
  const [battlePage, setBattlePage]   = useState(0)
  const [error, setError]             = useState(null)
  const isFirstBattleLoad             = useRef(true)

  // Initial load: script + first battle page in parallel
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setScript(null)
    setBattlePage(0)
    isFirstBattleLoad.current = true
    Promise.all([
      getScriptDetail(id),
      getScriptBattles(id, 0, 10),
    ]).then(([s, b]) => {
      setScript(s)
      setBattles(b.content)
      setBPag({ page: b.number, totalPages: b.totalPages, totalElements: b.totalElements })
    }).catch(err => {
      const status = err?.response?.status
      setError(status === 404 ? 'Script not found' : status === 403 ? 'This script is not public' : 'Failed to load script')
    }).finally(() => setIsLoading(false))
  }, [id])

  // Battle page navigation (skip on initial mount — handled by Promise.all)
  useEffect(() => {
    if (isFirstBattleLoad.current) { isFirstBattleLoad.current = false; return }
    setBLoading(true)
    getScriptBattles(id, battlePage, 10).then(b => {
      setBattles(b.content)
      setBPag({ page: b.number, totalPages: b.totalPages, totalElements: b.totalElements })
    }).catch(() => {}).finally(() => setBLoading(false))
  }, [battlePage, id])

  function handleUseInBattle() {
    if (!isAuthenticated) { navigate('/login'); return }
    sessionStorage.setItem(
      'challenge_script',
      JSON.stringify({
        id: script.id,
        name: script.name,
        content: script.content,
        ownerUsername: script.ownerUsername,
        requiredRobotIds: script.requiredRobotIds || [],
      })
    )
    navigate('/battles/new')
  }

  function handleCopy() {
    showToast('success', '📋 Copy Coming Soon', 'Script copying will be available soon!')
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
        Loading script…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ fontSize: 48 }}>📋</div>
        <div style={{ color: '#ff6b6b', fontSize: 16 }}>{error}</div>
        <Link to="/repository" style={{ color: '#f97316', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Repository
        </Link>
      </div>
    )
  }

  const stats    = script.stats ?? {}
  const diff     = DIFFICULTY[stats.difficultyLabel] ?? DIFFICULTY['Unranked']
  const lines    = (script.content ?? '').split('\n')
  const ownerInit = script.ownerUsername?.charAt(0).toUpperCase() ?? '?'

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, padding: '4px 0 40px' }}>

      {/* Back link */}
      <Link to="/repository" style={{ fontSize: 13, color: '#8888aa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
            onMouseLeave={e => e.currentTarget.style.color = '#8888aa'}>
        ← Back to Repository
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0ff', margin: 0, marginBottom: 10 }}>
            {script.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Author avatar */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>
              {script.ownerAvatarUrl
                ? <img src={script.ownerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : ownerInit}
            </div>
            {script.ownerUsername && (
              <Link to={`/profile/${script.ownerUsername}`}
                    style={{ fontSize: 13, color: '#8888aa', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8888aa'}>
                @{script.ownerUsername}
              </Link>
            )}
            <span style={{ color: '#333355' }}>•</span>
            <span style={{ fontSize: 12, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
              v{script.version}
            </span>
            <span style={{ color: '#333355' }}>•</span>
            <span style={{ fontSize: 12, color: '#555577' }}>{formatDate(script.updatedAt)}</span>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700, letterSpacing: '0.06em',
          color: diff.color, background: diff.bg,
          border: `1px solid ${diff.border}`,
          borderRadius: 6, padding: '4px 10px', alignSelf: 'flex-start',
        }}>
          {stats.difficultyLabel ?? 'Unranked'}
        </span>
      </div>

      {/* Required robots */}
      {script.hasRequirements && script.requiredRobots?.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.15em', color: '#f97316', fontWeight: 700,
            marginBottom: 10,
          }}>
            REQUIRED ROBOTS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {script.requiredRobots.map(robot => (
              <RobotChip key={robot.id} robot={robot} />
            ))}
          </div>
        </div>
      )}

      {/* Code block */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '8px 14px', background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: '#444466', fontFamily: 'JetBrains Mono, monospace' }}>
            {script.name}.algorig
          </span>
        </div>
        <div style={{
          padding: '16px 20px', maxHeight: 380, overflowY: 'auto',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: '1.8',
        }}>
          {lines.map((line, i) => <SyntaxLine key={i} line={line} idx={i} />)}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        <StatChip label="Wins"    value={stats.wins ?? 0}        color="#22c55e" />
        <StatChip label="Losses"  value={stats.losses ?? 0}      color="#ef4444" />
        <StatChip label="Draws"   value={stats.draws ?? 0}       color="#8888aa" />
        <StatChip label="Win Rate" value={stats.totalBattles > 0 ? `${stats.winRate}%` : '—'} color="#f97316" />
        <StatChip label="Used"    value={`${stats.timesUsed ?? 0}x`} color="#a855f7" />
      </div>
      {stats.lastBattledAt && (
        <div style={{ fontSize: 12, color: '#444466', marginTop: -16 }}>
          Last battle: {formatDate(stats.lastBattledAt)}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleCopy}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'none', border: '1px solid rgba(249,115,22,0.35)',
            color: '#f97316', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          📋 Copy Script
        </button>
        <button
          onClick={handleUseInBattle}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none', color: '#fff', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(249,115,22,0.3)', transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.5)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.3)'}
        >
          ⚔️ Challenge Script
        </button>
      </div>

      {/* Version history */}
      <div>
        <div style={{
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.15em', color: '#f97316', fontWeight: 700,
          marginBottom: 12, textTransform: 'uppercase',
        }}>
          Version History
        </div>
        {script.versionHistory?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {script.versionHistory.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  fontWeight: 700, color: '#f97316',
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: 4, padding: '1px 7px',
                }}>
                  v{h.version}
                </span>
                <span style={{ fontSize: 12, color: '#555577' }}>—</span>
                <span style={{ fontSize: 12, color: '#555577' }}>{formatDate(h.savedAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#444466', fontStyle: 'italic' }}>
            No version history available
          </div>
        )}
      </div>

      {/* Battle history */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.15em', color: '#f97316', fontWeight: 700, textTransform: 'uppercase',
          }}>
            Battle History
          </span>
          {battlePagination.totalElements > 0 && (
            <span style={{ fontSize: 11, color: '#444466', fontFamily: 'JetBrains Mono, monospace' }}>
              {battlePagination.totalElements} total
            </span>
          )}
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(249,115,22,0.3), transparent)' }} />
        </div>

        {battlesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                height: 70, background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        ) : battles.length === 0 ? (
          <div style={{ fontSize: 13, color: '#444466', fontStyle: 'italic', padding: '16px 0' }}>
            No battles recorded for this script yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {battles.map(battle => (
              <ScriptBattleCard key={battle.id} battle={battle} scriptId={id} />
            ))}
          </div>
        )}

        <PaginationBar
          page={battlePagination.page}
          totalPages={battlePagination.totalPages}
          onPrev={() => setBattlePage(p => p - 1)}
          onNext={() => setBattlePage(p => p + 1)}
        />
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
