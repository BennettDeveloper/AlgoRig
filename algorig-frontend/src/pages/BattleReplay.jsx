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

  const { hpA, hpB, batteryA, batteryB } = getHpState(currentIndex)
  const maxHpA = battle?.robotA?.systemIntegrity || 100
  const maxHpB = battle?.robotB?.systemIntegrity || 100
  const maxBatt = battle?.robotA?.battery || 100

  const displayHpA = hpA !== null ? hpA : maxHpA
  const displayHpB = hpB !== null ? hpB : maxHpB
  const displayBattA = batteryA !== null ? batteryA : (battle?.robotA?.battery ?? 100)
  const displayBattB = batteryB !== null ? batteryB : (battle?.robotB?.battery ?? 100)

  const isOver = battle?.winnerId != null
  const winnerIsA = battle?.winnerId === 'A'
  const showWinner = isOver && currentIndex >= totalEvents - 1
  const lastEntry = log.length > 0 ? log[log.length - 1] : null
  const winByPowerDepletion = lastEntry?.entryType === 'BATTERY_DRAIN' && lastEntry?.batterySpent > 0 && lastEntry?.attackerBatteryAfter === 0

  const actingA = currentEvent?.actor === 'A'
  const actingB = currentEvent?.actor === 'B'
  const deadA = displayHpA <= 0
  const deadB = displayHpB <= 0

  function renderEventCard(entry, battleData) {
    const actorColor = entry.actor === 'A' ? '#38bdf8' : '#ef4444'
    const robotName = entry.actor === 'A' ? battleData?.robotA?.name : battleData?.robotB?.name
    const cardBase = {
      background: 'rgba(0,0,0,0.5)',
      borderRadius: 12, padding: '16px 20px', textAlign: 'center', minWidth: 180,
      boxShadow: '0 0 20px rgba(0,0,0,0.5)', transition: 'all 0.3s ease',
    }
    const header = (
      <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 10, color: actorColor, fontFamily: 'JetBrains Mono, monospace' }}>
        TURN {entry.turn} — {robotName || entry.actor}
      </div>
    )

    if (entry.entryType === 'BATTERY_DRAIN') {
      const isCritical = entry.attackerBatteryAfter <= 0
      const isDangerous = entry.attackerBatteryAfter <= 10
      const drainColor = isCritical ? '#ef4444' : isDangerous ? '#f59e0b' : '#8888aa'
      const drainIcon = isCritical ? '💀' : isDangerous ? '⚠️' : '🔋'
      return (
        <div style={{ ...cardBase, border: `1px solid ${drainColor}44` }}>
          {header}
          <div style={{ fontSize: 28, marginBottom: 8 }}>{drainIcon}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: drainColor, marginBottom: 8 }}>
            {isCritical ? 'POWER DEPLETED' : isDangerous ? 'CRITICAL LOW POWER' : 'BATTERY DRAIN'}
          </div>
          <div style={{ fontSize: 12, color: drainColor + 'aa', marginBottom: 8 }}>
            -{entry.batterySpent} battery
          </div>
          <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>
            {entry.description}
          </div>
        </div>
      )
    }

    if (entry.entryType === 'SCAN_TICK') {
      return (
        <div style={{ ...cardBase, border: '1px solid rgba(56,189,248,0.3)' }}>
          {header}
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>
            SYSTEM SCAN IN PROGRESS
          </div>
          <div style={{ fontSize: 12, color: '#7dd3fc', fontStyle: 'italic', marginBottom: 10 }}>
            {entry.description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: (entry.scanTurnsRemaining || 0) + 1 }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#38bdf8',
                opacity: i === 0 ? 1 : 0.3,
                animation: i === 0 ? 'pulse 1s ease-in-out infinite' : 'none',
              }} />
            ))}
          </div>
        </div>
      )
    }

    if (entry.entryType === 'SCAN_COMPLETE') {
      return (
        <div style={{ ...cardBase, border: '1px solid rgba(34,197,94,0.3)' }}>
          {header}
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
            SCAN COMPLETE
          </div>
          <div style={{ fontSize: 12, color: '#86efac', marginBottom: 8 }}>
            {entry.description}
          </div>
          {entry.debuffsRemoved?.map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
              ↑ {d}
            </div>
          ))}
        </div>
      )
    }

    if (entry.entryType === 'CONDITION_CHECK') {
      return (
        <div style={{
          ...cardBase,
          border: `1px solid ${entry.conditionResult ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        }}>
          {header}
          <div style={{ fontSize: 10, color: '#555577', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 6 }}>
            IF CONDITION CHECK
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            {entry.conditionChecked}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 20,
            background: entry.conditionResult ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${entry.conditionResult ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
            color: entry.conditionResult ? '#22c55e' : '#ef4444',
          }}>
            {entry.conditionResult ? '✓ PASSED' : '✗ FAILED'}
          </div>
          <div style={{ fontSize: 11, color: '#555577', marginTop: 8 }}>
            {entry.conditionResult ? 'Entering IF branch...' : 'Skipping IF branch...'}
          </div>
        </div>
      )
    }

    return (
      <div style={{ ...cardBase, border: `1px solid ${entry.actor === 'A' ? '#38bdf840' : '#ef444440'}` }}>
        {header}
        <ActionTag action={entry.actionTaken} />
        {entry.stalledDueToInsufficientBattery && (
          <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 6 }}>⚡ STALLED — low battery</div>
        )}
        {entry.damageDealt > 0 && (
          <div style={{ fontSize: 13, color: '#ff6b35', marginTop: 8, fontWeight: 700 }}>
            -{entry.damageDealt} HP
          </div>
        )}
        {entry.healingDone > 0 && (
          <div style={{ fontSize: 13, color: '#22c55e', marginTop: 8, fontWeight: 700 }}>
            +{entry.healingDone}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#555577', marginTop: 8 }}>
          ⚡ -{entry.batterySpent}
        </div>
        {entry.description && (
          <div style={{ fontSize: 11, color: '#7a7a9a', marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>
            {entry.description}
          </div>
        )}
      </div>
    )
  }

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
            {winByPowerDepletion ? 'POWER DEPLETION' : winnerIsA ? 'TEAM A' : 'TEAM B'} WINS
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
          {battle?.winnerId ? (battle.winnerId === 'A' ? (battle.robotA?.name || 'A') : (battle.robotB?.name || 'B')) + ' won' : 'in progress'}
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
            TIER {battle?.robotA?.tier || '?'}
          </div>
          <StatBar label="HP" value={displayHpA} max={maxHpA} />
          <StatBar label="Battery" value={displayBattA} max={maxBatt} colorOverride="#00c8ff" />
          <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d0d1e', borderRadius: 6, border: '1px solid #1a1a30' }}>
            <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 6, letterSpacing: 1 }}>COMBAT STATS</div>
            {[
              ['ATK', battle?.robotA?.coreImpact],
              ['SPD', battle?.robotA?.clockSpeed],
              ['DEF', battle?.robotA?.chassisArmor],
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 200 }}>
              {currentEvent ? renderEventCard(currentEvent, battle) : (
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
            {log.slice(0, currentIndex + 1).map((entry, i) => {
              const isActive = i === currentIndex
              const actorColor = entry.actor === 'A' ? '#38bdf8' : '#ef4444'
              const pastOpacity = isActive ? 1 : 0.45

              if (entry.entryType === 'CONDITION_CHECK') {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive
                      ? `rgba(${entry.conditionResult ? '34,197,94' : '239,68,68'}, 0.06)`
                      : 'transparent',
                    borderLeft: `2px solid ${isActive
                      ? entry.conditionResult ? '#22c55e' : '#ef4444'
                      : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ color: isActive ? '#f59e0b' : '#2a2a44' }}>IF</span>
                    <span style={{ color: isActive ? '#c084fc' : '#2a2a44' }}>{entry.conditionChecked}</span>
                    <span style={{ color: '#555577' }}>→</span>
                    <span style={{
                      color: isActive ? (entry.conditionResult ? '#22c55e' : '#ef4444') : '#2a2a44',
                      fontWeight: 700,
                    }}>
                      {entry.conditionResult ? '✓ PASSED' : '✗ FAILED'}
                    </span>
                  </div>
                )
              }

              if (entry.entryType === 'BATTERY_DRAIN') {
                const isCritical = entry.attackerBatteryAfter <= 0
                const isDangerous = entry.attackerBatteryAfter <= 10
                const drainColor = isCritical ? '#ef4444' : isDangerous ? '#f59e0b' : '#555577'
                const drainIcon = isCritical ? '💀' : isDangerous ? '⚠️' : '🔋'
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? `rgba(${isCritical ? '239,68,68' : isDangerous ? '245,158,11' : '85,85,119'}, 0.06)` : 'transparent',
                    borderLeft: `2px solid ${isActive ? drainColor : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 13 }}>{drainIcon}</span>
                    <span style={{ color: isActive ? drainColor : '#2a2a44' }}>
                      -{entry.batterySpent} BAT
                      {isCritical ? ' — POWER DEPLETED' : ` → ${entry.attackerBatteryAfter}`}
                    </span>
                  </div>
                )
              }

              if (entry.entryType === 'SCAN_TICK') {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '5px 8px 5px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(56,189,248,0.06)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#38bdf8' : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontStyle: 'italic',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{entry.actor}</span>
                    <span style={{ color: isActive ? '#38bdf8' : '#2a2a44', fontSize: 14 }}>🔍</span>
                    <span style={{ color: isActive ? '#7dd3fc' : '#2a2a44' }}>{entry.description}</span>
                  </div>
                )
              }

              if (entry.entryType === 'SCAN_COMPLETE') {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '6px 8px 6px 20px', borderRadius: 6, cursor: 'pointer',
                    background: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#22c55e' : 'transparent'}`,
                    opacity: pastOpacity,
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{
                      color: isActive ? '#22c55e' : '#2a2a44', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{entry.actor}</span>
                      <span>✅</span>
                      <span>{entry.description}</span>
                    </div>
                    {isActive && entry.debuffsRemoved?.length > 0 && (
                      <div style={{ marginTop: 4, paddingLeft: 20 }}>
                        {entry.debuffsRemoved.map((d, di) => (
                          <div key={di} style={{ fontSize: 11, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', opacity: 0.8 }}>
                            ↑ {d}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                  fontSize: 12, padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                  background: isActive
                    ? `rgba(${entry.actor === 'A' ? '56,189,248' : '239,68,68'}, 0.08)`
                    : 'transparent',
                  borderLeft: `2px solid ${isActive ? actorColor : 'transparent'}`,
                  opacity: pastOpacity,
                  display: 'flex', gap: 8, alignItems: 'baseline',
                  transition: 'all 0.2s ease',
                }}>
                  <span style={{
                    color: isActive ? actorColor : '#2a2a44',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, flexShrink: 0,
                  }}>
                    T{entry.turn} {entry.actor}
                  </span>
                  <span style={{ color: isActive ? '#f0f0ff' : '#333355', lineHeight: 1.5 }}>
                    {entry.description}
                  </span>
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
            TIER {battle?.robotB?.tier || '?'}
          </div>
          <StatBar label="HP" value={displayHpB} max={maxHpB} />
          <StatBar label="Battery" value={displayBattB} max={battle?.robotB?.battery || 100} colorOverride="#ff3c3c" />
          <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d0d1e', borderRadius: 6, border: '1px solid #1a1a30' }}>
            <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 6, letterSpacing: 1 }}>COMBAT STATS</div>
            {[
              ['ATK', battle?.robotB?.coreImpact],
              ['SPD', battle?.robotB?.clockSpeed],
              ['DEF', battle?.robotB?.chassisArmor],
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
