import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBattle } from '../api/battles'
import { RobotSVGA, RobotSVGB } from '../components/replay/RobotSVG'
import StatBar from '../components/replay/StatBar'
import useReplayEngine from '../components/replay/useReplayEngine'

const ACTION_COLORS = {
  HARD_STRIKE: '#ff6b35',
  QUICK_STRIKE: '#ffd700',
  SHIELD_BASH: '#00c8ff',
  RECHARGE: '#22c55e',
  HEAL: '#22c55e',
  OVERCLOCK: '#c084fc',
  DEFENSIVE_STANCE: '#00c8ff',
}

function ActionTag({ action }) {
  const color = ACTION_COLORS[action] || '#8888aa'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      background: color + '22',
      border: `1px solid ${color}55`,
      color,
      fontSize: 11,
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: 1,
    }}>
      {action?.replace(/_/g, ' ')}
    </span>
  )
}

export default function BattleReplay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [battle, setBattle] = useState(null)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logRef = useRef(null)

  const {
    currentIndex,
    currentEvent,
    totalEvents,
    isPlaying,
    countdown,
    play,
    pause,
    stepForward,
    stepBack,
    seek,
    getHpState,
  } = useReplayEngine(log)

  useEffect(() => {
    getBattle(id)
      .then(res => {
        const data = res.data
        setBattle(data)
        try {
          const parsed = typeof data.battleLog === 'string'
            ? JSON.parse(data.battleLog)
            : data.battleLog
          setLog(Array.isArray(parsed) ? parsed : [])
        } catch {
          setLog([])
        }
      })
      .catch(() => setError('Failed to load battle.'))
      .finally(() => setLoading(false))
  }, [id])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current && currentIndex >= 0) {
      const items = logRef.current.querySelectorAll('[data-log-index]')
      const el = items[currentIndex]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentIndex])

  const { hpA, hpB, battA } = getHpState(currentIndex)
  const maxHp = battle ? Math.max(battle.robotA?.maxHp || 100, 100) : 100
  const maxBatt = 100

  const displayHpA = hpA !== null ? hpA : (battle?.robotA?.maxHp || 100)
  const displayHpB = hpB !== null ? hpB : (battle?.robotB?.maxHp || 100)
  const displayBattA = battA !== null ? battA : 100

  const isOver = battle?.winner != null
  const winnerIsA = battle?.winner === 'A'
  const showWinner = isOver && currentIndex >= totalEvents - 1

  const actingA = currentEvent?.actor === 'A'
  const actingB = currentEvent?.actor === 'B'
  const deadA = displayHpA <= 0
  const deadB = displayHpB <= 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>
      Loading battle...
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace' }}>
      {error}
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d1a', overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* Countdown overlay */}
      {countdown !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{
            fontSize: countdown === 'FIGHT!' ? 72 : 96,
            fontWeight: 900,
            color: countdown === 'FIGHT!' ? '#ff6b35' : '#00c8ff',
            textShadow: `0 0 40px ${countdown === 'FIGHT!' ? '#ff6b35' : '#00c8ff'}`,
            letterSpacing: 4,
            animation: 'countdownPop 0.35s ease-out',
          }}>
            {countdown}
          </span>
        </div>
      )}

      {/* Winner banner */}
      {showWinner && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{ fontSize: 18, color: '#8888aa', letterSpacing: 3, marginBottom: 16 }}>WINNER</div>
          <div style={{
            fontSize: 56,
            fontWeight: 900,
            color: winnerIsA ? '#00c8ff' : '#ff3c3c',
            textShadow: `0 0 40px ${winnerIsA ? '#00c8ff' : '#ff3c3c'}`,
            marginBottom: 8,
          }}>
            {winnerIsA ? (battle?.robotA?.name || 'Robot A') : (battle?.robotB?.name || 'Robot B')}
          </div>
          <div style={{ fontSize: 14, color: '#666688', marginBottom: 32 }}>
            {winnerIsA ? 'TEAM A' : 'TEAM B'} WINS
          </div>
          <button
            onClick={() => navigate('/battles/new')}
            style={{
              padding: '10px 28px', borderRadius: 6,
              background: '#1a1a2e', border: '1px solid #3a3a5c',
              color: '#c0c0e0', fontSize: 13, cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            ← New Battle
          </button>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: '1px solid #1e1e3a',
        background: '#0a0a16', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/battles/new')}
          style={{ background: 'none', border: 'none', color: '#8888aa', cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: '#4a4a6a' }}>
          BATTLE #{id} &nbsp;·&nbsp; TURN {Math.ceil((currentIndex + 1) / 2)} / {Math.ceil(totalEvents / 2)}
        </div>
        <div style={{ fontSize: 11, color: '#3a3a5a' }}>
          {battle?.winner ? (battle.winner === 'A' ? (battle.robotA?.name || 'A') : (battle.robotB?.name || 'B')) + ' won' : 'in progress'}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

        {/* Left — Robot A stats */}
        <div style={{
          width: 240, flexShrink: 0, padding: '20px 16px',
          borderRight: '1px solid #1e1e3a', background: '#080814',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 13, color: '#00c8ff', marginBottom: 4, letterSpacing: 2 }}>
            {battle?.robotA?.name || 'ROBOT A'}
          </div>
          <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 12 }}>
            TIER {battle?.robotA?.tier || '?'} · {battle?.robotA?.specialization || ''}
          </div>
          <StatBar label="HP" value={displayHpA} max={battle?.robotA?.maxHp || 100} />
          <StatBar label="Battery" value={displayBattA} max={maxBatt} colorOverride="#00c8ff" />
          <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d0d1e', borderRadius: 6, border: '1px solid #1a1a30' }}>
            <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 6, letterSpacing: 1 }}>COMBAT STATS</div>
            {[
              ['ATK', battle?.robotA?.attackPower],
              ['SPD', battle?.robotA?.speed],
              ['DEF', battle?.robotA?.defense],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8888aa', marginBottom: 3 }}>
                <span>{k}</span><span style={{ color: '#c0c0e0' }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Arena */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Arena visual */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '20px 40px', position: 'relative', minHeight: 0,
          }}>
            {/* Arena glow floor */}
            <div style={{
              position: 'absolute', bottom: 60, left: '10%', right: '10%', height: 2,
              background: 'linear-gradient(90deg, transparent, #1e3a4a, #1e2a3a, transparent)',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RobotSVGA size={130} isActing={actingA} isDead={deadA} />
              <div style={{ fontSize: 11, color: actingA ? '#00c8ff' : '#3a3a5a', letterSpacing: 2, transition: 'color 0.3s' }}>
                {actingA ? '▶ ACTING' : 'IDLE'}
              </div>
            </div>

            {/* VS / event card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 180 }}>
              {currentEvent ? (
                <div style={{
                  background: '#10101e', border: '1px solid #2a2a4a', borderRadius: 10,
                  padding: '14px 18px', textAlign: 'center', minWidth: 160,
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 8, letterSpacing: 2 }}>
                    TURN {currentEvent.turn} · {currentEvent.actor === 'A' ? (battle?.robotA?.name || 'A') : (battle?.robotB?.name || 'B')}
                  </div>
                  <ActionTag action={currentEvent.actionTaken} />
                  {currentEvent.stalledDueToInsufficientBattery && (
                    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 6 }}>⚡ STALLED — low battery</div>
                  )}
                  {currentEvent.damageDealt > 0 && (
                    <div style={{ fontSize: 13, color: '#ff6b35', marginTop: 8, fontWeight: 700 }}>
                      -{currentEvent.damageDealt} HP
                    </div>
                  )}
                  {currentEvent.healingDone > 0 && (
                    <div style={{ fontSize: 13, color: '#22c55e', marginTop: 8, fontWeight: 700 }}>
                      +{currentEvent.healingDone} HP
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#555577', marginTop: 8 }}>
                    ⚡ -{currentEvent.batterySpent}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2a2a4a', letterSpacing: 6 }}>VS</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RobotSVGB size={130} isActing={actingB} isDead={deadB} />
              <div style={{ fontSize: 11, color: actingB ? '#ff3c3c' : '#3a3a5a', letterSpacing: 2, transition: 'color 0.3s' }}>
                {actingB ? '▶ ACTING' : 'IDLE'}
              </div>
            </div>
          </div>

          {/* Battle log */}
          <div style={{
            height: 200, borderTop: '1px solid #1e1e3a', overflowY: 'auto', padding: '8px 0',
            background: '#07070f',
          }} ref={logRef}>
            {log.map((entry, i) => {
              const isActive = i === currentIndex
              const isPast = i < currentIndex
              return (
                <div
                  key={i}
                  data-log-index={i}
                  style={{
                    padding: '5px 16px',
                    background: isActive ? '#1a1a30' : 'transparent',
                    borderLeft: isActive ? '3px solid #00c8ff' : '3px solid transparent',
                    opacity: isPast ? 0.45 : isActive ? 1 : 0.25,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => seek(i)}
                >
                  <span style={{ fontSize: 10, color: '#4a4a6a', marginRight: 10 }}>T{entry.turn}</span>
                  <span style={{ fontSize: 10, color: entry.actor === 'A' ? '#00c8ff' : '#ff3c3c', marginRight: 8 }}>
                    [{entry.actor === 'A' ? (battle?.robotA?.name || 'A') : (battle?.robotB?.name || 'B')}]
                  </span>
                  <span style={{ fontSize: 11, color: '#c0c0e0' }}>{entry.description}</span>
                </div>
              )
            })}
          </div>

          {/* Playback controls */}
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #1e1e3a',
            background: '#0a0a16', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
          }}>
            {/* Scrubber */}
            <input
              type="range"
              min={-1}
              max={totalEvents - 1}
              value={currentIndex}
              onChange={e => seek(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00c8ff', cursor: 'pointer' }}
            />
            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ControlBtn onClick={stepBack} title="Step back" disabled={currentIndex <= -1}>⏮</ControlBtn>
              {isPlaying
                ? <ControlBtn onClick={pause} primary>⏸ Pause</ControlBtn>
                : <ControlBtn onClick={play} primary>▶ Play</ControlBtn>
              }
              <ControlBtn onClick={stepForward} title="Step forward" disabled={currentIndex >= totalEvents - 1}>⏭</ControlBtn>
            </div>
          </div>
        </div>

        {/* Right — Robot B stats */}
        <div style={{
          width: 240, flexShrink: 0, padding: '20px 16px',
          borderLeft: '1px solid #1e1e3a', background: '#080814',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 13, color: '#ff3c3c', marginBottom: 4, letterSpacing: 2 }}>
            {battle?.robotB?.name || 'ROBOT B'}
          </div>
          <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 12 }}>
            TIER {battle?.robotB?.tier || '?'} · {battle?.robotB?.specialization || ''}
          </div>
          <StatBar label="HP" value={displayHpB} max={battle?.robotB?.maxHp || 100} />
          <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d0d1e', borderRadius: 6, border: '1px solid #1a1a30' }}>
            <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 6, letterSpacing: 1 }}>COMBAT STATS</div>
            {[
              ['ATK', battle?.robotB?.attackPower],
              ['SPD', battle?.robotB?.speed],
              ['DEF', battle?.robotB?.defense],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8888aa', marginBottom: 3 }}>
                <span>{k}</span><span style={{ color: '#c0c0e0' }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes countdownPop {
          from { transform: scale(1.4); opacity: 0.6; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ControlBtn({ onClick, children, primary, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: primary ? '8px 24px' : '6px 14px',
        borderRadius: 6,
        background: primary ? '#1a2a3a' : '#10101e',
        border: `1px solid ${primary ? '#00c8ff55' : '#2a2a3a'}`,
        color: disabled ? '#3a3a5a' : primary ? '#00c8ff' : '#8888aa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
