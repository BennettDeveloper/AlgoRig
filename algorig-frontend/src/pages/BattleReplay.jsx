import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBattle } from '../api/battles'
import Modal from '../components/ui/Modal'
import { useToast } from '../context/ToastContext'
import { RobotSVGA, RobotSVGB } from '../components/replay/RobotSVG'
import FlashingStatBar from '../components/replay/FlashingStatBar'
import FloatingNumber from '../components/replay/FloatingNumber'
import ArenaEffects from '../components/replay/ArenaEffects'
import ArenaBackground from '../components/replay/ArenaBackground'
import useReplayEngine from '../components/replay/useReplayEngine'
import useRobotAnimation from '../components/replay/useRobotAnimation'

const PHYSICAL_ACTIONS  = new Set(['HARD_STRIKE', 'HEAVY_ATTACK'])
const SOFTWARE_ACTIONS  = new Set(['POWER_SURGE', 'VIRUS_UPLOAD'])
const DEFENSE_ACTIONS   = new Set(['FIREWALL', 'ARMOR_PLATE'])
const HEALING_ACTIONS   = new Set(['PATCH'])
const SUPPORT_ACTIONS   = new Set(['BATTERY_EQUALIZATION'])
const MEGA_ACTIONS      = new Set(['STACK_OVERFLOW'])

function actionColor(action) {
  if (!action) return '#8888aa'
  if (MEGA_ACTIONS.has(action))      return '#d946ef'
  if (PHYSICAL_ACTIONS.has(action))  return '#f97316'
  if (SOFTWARE_ACTIONS.has(action))  return '#a855f7'
  if (DEFENSE_ACTIONS.has(action))   return '#3b82f6'
  if (HEALING_ACTIONS.has(action))   return '#22c55e'
  if (SUPPORT_ACTIONS.has(action))   return '#22d3ee'
  return '#38bdf8'
}

function TurnHeader({ entry, robotA, robotB }) {
  if (!entry || entry.entryType === 'BATTERY_DRAIN') return null

  const isA      = entry.actor === 'A'
  const robot    = isA ? robotA : robotB
  const name     = robot?.name || (isA ? 'ROBOT A' : 'ROBOT B')
  const accentA  = '#00c8ff'
  const accentB  = '#ff3c3c'
  const accent   = isA ? accentA : accentB
  const bgA      = 'linear-gradient(90deg, rgba(0,40,60,0.95) 0%, rgba(0,20,35,0.85) 100%)'
  const bgB      = 'linear-gradient(90deg, rgba(60,10,10,0.95) 0%, rgba(35,0,0,0.85) 100%)'

  const action   = entry.entryType === 'ACTION' ? entry.actionTaken : null
  const aColor   = actionColor(action)
  const isCond   = entry.entryType === 'CONDITION_CHECK'
  const isPassive = entry.entryType === 'PASSIVE_EFFECT'
  const isRepeat = entry.entryType?.startsWith('REPEAT_')

  let actionLabel = null
  if (action && !entry.stalledDueToInsufficientBattery && !entry.stalledDueToOverload) {
    actionLabel = action.replace(/_/g, ' ')
  } else if (entry.stalledDueToOverload) {
    actionLabel = 'SYSTEM OVERLOAD'
  } else if (entry.stalledDueToInsufficientBattery) {
    actionLabel = 'CPU STALL'
  } else if (isCond) {
    actionLabel = 'IF CONDITION'
  } else if (isPassive) {
    actionLabel = entry.passiveTriggered || 'PASSIVE'
  } else if (isRepeat) {
    actionLabel = 'REPEAT'
  } else if (entry.entryType === 'SCAN_TICK' || entry.entryType === 'SCAN_COMPLETE') {
    actionLabel = 'SYSTEM SCAN'
  }

  const actionLabelColor = isCond ? '#f59e0b' : isPassive ? '#c084fc' : isRepeat ? '#22d3ee' : aColor

  return (
    <div style={{
      flexShrink: 0,
      background: isA ? bgA : bgB,
      borderBottom: `2px solid ${accent}44`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 20,
      animation: 'turnHeaderSlide 0.25s ease-out',
    }}>
      {/* Turn number badge */}
      <div style={{
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: `${accent}18`,
        border: `1px solid ${accent}40`,
        borderRadius: 8, padding: '4px 12px',
        minWidth: 52,
      }}>
        <div style={{ fontSize: 9, color: accent + 'aa', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>TURN</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>
          {entry.turn}
        </div>
      </div>

      {/* Name + action */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 20, fontWeight: 900, color: '#fff',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: 2, textTransform: 'uppercase',
          textShadow: `0 0 20px ${accent}66`,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
        {actionLabel && (
          <div style={{
            fontSize: 13, fontWeight: 700, color: actionLabelColor,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: 2, textTransform: 'uppercase',
            textShadow: `0 0 10px ${actionLabelColor}88`,
            animation: 'actionPulse 0.3s ease-out',
          }}>
            {actionLabel}
          </div>
        )}
      </div>

      {/* Damage / heal / equalize badge */}
      {entry.entryType === 'ACTION' && !entry.stalledDueToInsufficientBattery && !entry.stalledDueToOverload && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
          {entry.damageDealt > 0 && (
            <div style={{
              background: entry.actionTaken === 'STACK_OVERFLOW' ? 'rgba(217,70,239,0.18)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${entry.actionTaken === 'STACK_OVERFLOW' ? 'rgba(217,70,239,0.5)' : 'rgba(239,68,68,0.35)'}`,
              borderRadius: 6, padding: '3px 10px',
              fontSize: 14, fontWeight: 900,
              color: entry.actionTaken === 'STACK_OVERFLOW' ? '#e879f9' : '#f87171',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              -{entry.damageDealt} HP
            </div>
          )}
          {entry.healingDone > 0 && entry.actionTaken !== 'BATTERY_EQUALIZATION' && (
            <div style={{
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
              borderRadius: 6, padding: '3px 10px',
              fontSize: 14, fontWeight: 900, color: '#4ade80',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              +{entry.healingDone} HP
            </div>
          )}
          {entry.actionTaken === 'BATTERY_EQUALIZATION' && entry.batteryEqualized > 0 && (
            <div style={{
              background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)',
              borderRadius: 6, padding: '3px 10px',
              fontSize: 14, fontWeight: 900, color: '#22d3ee',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              ⚖ {entry.batteryEqualized} BAT
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BattleReplay() {
  const { battleCode } = useParams()
  const navigate = useNavigate()
  const { showAchievement } = useToast()
  const [battle, setBattle] = useState(null)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const logRef = useRef(null)
  const toastedRef = useRef(false)

  const {
    currentIndex,
    currentEvent,
    totalEvents,
    isPlaying,
    countdown,
    battleEnded,
    speed,
    setSpeed,
    play,
    pause,
    stepForward,
    stepBack,
    seek,
    rewatch,
    getHpState,
  } = useReplayEngine(log)

  useEffect(() => {
    toastedRef.current = false
    getBattle(battleCode)
      .then(battle => {
        setBattle(battle)
        try {
          const parsed = typeof battle.battleLog === 'string'
            ? JSON.parse(battle.battleLog)
            : battle.battleLog
          setLog(Array.isArray(parsed) ? parsed : [])
        } catch {
          setLog([])
        }
      })
      .catch(err => {
        const status = err.response?.status
        if (status === 403) setError('private')
        else if (status === 404) setError('notfound')
        else setError('generic')
      })
      .finally(() => setLoading(false))
  }, [battleCode])

  // Fire achievement toasts once when battle first loads
  useEffect(() => {
    if (!battle || toastedRef.current) return
    toastedRef.current = true
    if (Array.isArray(battle.newAchievements) && battle.newAchievements.length > 0) {
      battle.newAchievements.forEach(a => showAchievement(a))
    }
  }, [battle, showAchievement])

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

  const winnerIsA = battle?.winnerId === 'A'
  const lastEntry = log.length > 0 ? log[log.length - 1] : null
  const winByPowerDepletion = lastEntry?.entryType === 'BATTERY_DRAIN' && lastEntry?.attackerBatteryAfter === 0
  const healthPctA = battle?.robotA ? Math.max(0, Math.round((displayHpA / maxHpA) * 100)) : 100
  const healthPctB = battle?.robotB ? Math.max(0, Math.round((displayHpB / maxHpB) * 100)) : 100

  const actingA = currentEvent?.actor === 'A'
  const actingB = currentEvent?.actor === 'B'
  const deadA = displayHpA <= 0
  const deadB = displayHpB <= 0

  const { attackerStyle, defenderStyle } = useRobotAnimation(currentEvent, speed)
  const robotAAnimStyle = actingA ? attackerStyle : actingB ? defenderStyle : {}
  const robotBAnimStyle = actingB ? attackerStyle : actingA ? defenderStyle : {}

  // Screen shake on heavy physical hits and Stack Overflow
  const [shakeKey, setShakeKey] = useState(null)
  useEffect(() => {
    if (!currentEvent || currentEvent.entryType !== 'ACTION') return
    const isHeavy = currentEvent.actionTaken === 'HEAVY_ATTACK' ||
      currentEvent.actionTaken === 'STACK_OVERFLOW' ||
      (currentEvent.actionTaken === 'HARD_STRIKE' && (currentEvent.damageDealt ?? 0) >= 15)
    if (isHeavy && !currentEvent.stalledDueToInsufficientBattery && !currentEvent.stalledDueToOverload) {
      setShakeKey(Date.now())
    }
  }, [currentEvent])

  // Floating number visibility
  const isAction = currentEvent?.entryType === 'ACTION' && !currentEvent?.stalledDueToInsufficientBattery
  const isBattDrain = currentEvent?.entryType === 'BATTERY_DRAIN'
  const showDmgOnA = isAction && actingB && (currentEvent?.damageDealt > 0)
  const showDmgOnB = isAction && actingA && (currentEvent?.damageDealt > 0)
  const showHealOnA = isAction && actingA && (currentEvent?.healingDone > 0)
  const showHealOnB = isAction && actingB && (currentEvent?.healingDone > 0)
  const showBattOnA = isBattDrain && actingA && (currentEvent?.batterySpent > 0)
  const showBattOnB = isBattDrain && actingB && (currentEvent?.batterySpent > 0)


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>
      Loading battle...
    </div>
  )

  if (error) {
    const messages = {
      private:  'This battle is private.',
      notfound: 'Battle not found.',
      generic:  'Failed to load battle.',
    }
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: 16,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div style={{ fontSize: 48 }}>{error === 'private' ? '🔒' : error === 'notfound' ? '🔍' : '⚠️'}</div>
        <div style={{ color: '#ff6b6b', fontSize: 16 }}>{messages[error] ?? messages.generic}</div>
        <a
          href="/battles"
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 8,
            border: '1px solid rgba(249,115,22,0.3)',
            color: '#f97316', textDecoration: 'none', fontSize: 13,
          }}
        >
          ← Back to Battles
        </a>
      </div>
    )
  }

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
      {battleEnded && battle?.winnerId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.5s ease',
        }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {battle.winnerId === 'DRAW' ? '🤝' : '🏆'}
            </div>
            <div style={{ fontSize: 14, letterSpacing: '0.3em', color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
              WINNER
            </div>
            <div style={{
              fontSize: 56, fontWeight: 900,
              color: battle.winnerId === 'A' ? '#38bdf8' : battle.winnerId === 'DRAW' ? '#c084fc' : '#ef4444',
              fontFamily: 'JetBrains Mono, monospace',
              textShadow: `0 0 60px ${battle.winnerId === 'A' ? '#38bdf8' : battle.winnerId === 'DRAW' ? '#c084fc' : '#ef4444'}`,
              marginBottom: 8,
            }}>
              {battle.winnerId === 'DRAW'
                ? 'DRAW'
                : winnerIsA ? (battle.robotA?.name || 'Robot A') : (battle.robotB?.name || 'Robot B')}
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#555577', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
              {battle.winnerId === 'DRAW'
                ? 'BOTH ROBOTS FOUGHT TO A STANDSTILL'
                : `TEAM ${battle.winnerId} WINS`}
            </div>
            <div style={{ fontSize: 12, color: '#444466', fontFamily: 'JetBrains Mono, monospace', marginBottom: 32, letterSpacing: '0.1em' }}>
              {winByPowerDepletion ? '⚡ WIN BY POWER DEPLETION' : '💀 WIN BY SYSTEM DESTRUCTION'}
              {battle.totalTurns > 0 && ` · ${battle.totalTurns} TURNS`}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={rewatch}
                style={{
                  padding: '14px 28px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#d0d0e8', fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.1em', cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              >
                ↺ Rewatch
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                style={{
                  padding: '14px 28px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#d0d0e8', fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.1em', cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              >
                🔗 Share
              </button>
              <button
                onClick={() => navigate('/battles/new')}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.1em', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(249,115,22,0.4)',
                  fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 32px rgba(249,115,22,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.4)' }}
              >
                ← New Battle
              </button>
            </div>
          </div>
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
          {battle?.battleCode || battleCode} &nbsp;·&nbsp; TURN {Math.ceil((currentIndex + 1) / 2)} / {Math.ceil(totalEvents / 2)}
        </div>
        <div style={{ fontSize: 11, color: '#3a3a5a', display: 'flex', alignItems: 'center', gap: 6 }}>
          {battle?.ownerAvatarUrl ? (
            <img src={battle.ownerAvatarUrl} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : battle?.ownerUsername ? (
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: '#fff',
            }}>
              {battle.ownerUsername.charAt(0).toUpperCase()}
            </div>
          ) : null}
          <span>
            {battle?.winnerId
              ? (battle.winnerId === 'A' ? (battle.robotA?.name || 'A') : (battle.robotB?.name || 'B')) + ' won'
              : 'in progress'}
          </span>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

        {/* Left — Robot A stats */}
        <div style={{
          width: 240, flexShrink: 0, padding: '20px 16px',
          borderRight: '1px solid #1e1e3a', background: '#080814',
          display: 'flex', flexDirection: 'column', gap: 8,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 13, color: '#00c8ff', marginBottom: 4, letterSpacing: 2 }}>
            {battle?.robotA?.name || 'ROBOT A'}
          </div>
          <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 12 }}>
            TIER {battle?.robotA?.tier || '?'}
          </div>
          <FlashingStatBar label="HP" value={displayHpA} max={maxHpA} />
          <FlashingStatBar label="Battery" value={displayBattA} max={maxBatt} colorOverride="#00c8ff" />
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
          <VariablePanel log={log} currentIndex={currentIndex} actor="A" accentColor="#00c8ff" />
        </div>

        {/* Center — Arena */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <TurnHeader entry={currentEvent} robotA={battle?.robotA} robotB={battle?.robotB} />

          {/* Arena visual */}
          <div
            key={shakeKey}
            style={{
              flex: '0 0 310px', position: 'relative', overflow: 'hidden',
              animation: shakeKey ? `screenShake 220ms ease-out` : 'none',
            }}
          >

            <ArenaBackground currentEntry={currentEvent} />

            {/* Robot A — left */}
            <div style={{
              position: 'absolute', left: '12%', top: '50%',
              transform: 'translateY(-60%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div key={`a-${currentIndex}`} style={robotAAnimStyle}>
                <RobotSVGA
                  size={120}
                  isActing={actingA && currentEvent?.entryType === 'ACTION'}
                  isDead={deadA}
                  healthPercent={healthPctA}
                  suppressHealthAnim={!!robotAAnimStyle.animation}
                />
              </div>
              <div style={{
                fontSize: 11, letterSpacing: '0.2em', fontFamily: 'JetBrains Mono, monospace',
                color: actingA && currentEvent?.entryType === 'ACTION' ? '#38bdf8' : '#334455',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.3s ease',
              }}>
                {actingA && currentEvent?.entryType === 'ACTION' && (
                  <span style={{ color: '#38bdf8' }}>►</span>
                )}
                {actingA && currentEvent?.entryType === 'ACTION' ? 'ACTING' : 'IDLE'}
              </div>
            </div>

            {/* Robot B — right */}
            <div style={{
              position: 'absolute', right: '12%', top: '50%',
              transform: 'translateY(-60%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div key={`b-${currentIndex}`} style={robotBAnimStyle}>
                <RobotSVGB
                  size={120}
                  isActing={actingB && currentEvent?.entryType === 'ACTION'}
                  isDead={deadB}
                  healthPercent={healthPctB}
                  suppressHealthAnim={!!robotBAnimStyle.animation}
                />
              </div>
              <div style={{
                fontSize: 11, letterSpacing: '0.2em', fontFamily: 'JetBrains Mono, monospace',
                color: actingB && currentEvent?.entryType === 'ACTION' ? '#ef4444' : '#443333',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.3s ease',
              }}>
                {actingB && currentEvent?.entryType === 'ACTION' && (
                  <span style={{ color: '#ef4444' }}>►</span>
                )}
                {actingB && currentEvent?.entryType === 'ACTION' ? 'ACTING' : 'IDLE'}
              </div>
            </div>

            {/* Floating numbers — Robot A side */}
            <div style={{ position: 'absolute', left: '12%', top: '22%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 30 }}>
              {showDmgOnA && <FloatingNumber key={`dmg-a-${currentIndex}`} value={currentEvent.damageDealt} type="damage" />}
              {showHealOnA && <FloatingNumber key={`heal-a-${currentIndex}`} value={currentEvent.healingDone} type="heal" />}
              {showBattOnA && <FloatingNumber key={`batt-a-${currentIndex}`} value={currentEvent.batterySpent} type="battery" />}
            </div>

            {/* Floating numbers — Robot B side */}
            <div style={{ position: 'absolute', right: '12%', top: '22%', transform: 'translateX(50%)', pointerEvents: 'none', zIndex: 30 }}>
              {showDmgOnB && <FloatingNumber key={`dmg-b-${currentIndex}`} value={currentEvent.damageDealt} type="damage" />}
              {showHealOnB && <FloatingNumber key={`heal-b-${currentIndex}`} value={currentEvent.healingDone} type="heal" />}
              {showBattOnB && <FloatingNumber key={`batt-b-${currentIndex}`} value={currentEvent.batterySpent} type="battery" />}
            </div>

            {/* Event card — center */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 320, maxHeight: 200, overflowY: 'auto', zIndex: 10,
            }}>
              {currentEvent
                ? <EventCard entry={currentEvent} robotA={battle?.robotA} robotB={battle?.robotB} log={log} currentIndex={currentIndex} />
                : <div style={{ fontSize: 22, fontWeight: 900, color: '#2a2a4a', letterSpacing: 6, textAlign: 'center' }}>VS</div>
              }
            </div>

            <ArenaEffects
              currentEntry={currentEvent}
              speed={speed}
              robotAName={battle?.robotA?.name}
              robotBName={battle?.robotB?.name}
            />
          </div>

          {/* Battle log */}
          <div style={{
            flex: 1, minHeight: 120, borderTop: '1px solid #1e1e3a', overflowY: 'auto', padding: '8px 0',
            background: '#07070f',
          }} ref={logRef}>
            {log.slice(0, currentIndex + 1).map((entry, i) => {
              const isActive = i === currentIndex
              const actorColor = entry.actor === 'A' ? '#38bdf8' : '#ef4444'
              const pastOpacity = isActive ? 1 : 0.45

              if (entry.entryType === 'CONDITION_CHECK') {
                const isElseIf = i > 0 &&
                  log[i - 1]?.entryType === 'CONDITION_CHECK' &&
                  log[i - 1]?.actor === entry.actor &&
                  log[i - 1]?.turn === entry.turn
                const nextIsCondCheck =
                  log[i + 1]?.entryType === 'CONDITION_CHECK' &&
                  log[i + 1]?.actor === entry.actor &&
                  log[i + 1]?.turn === entry.turn
                const keyword = isElseIf ? 'ELSE IF' : 'IF'
                let resultText, resultColor
                if (entry.conditionResult) {
                  resultText = '✓'
                  resultColor = '#22c55e'
                } else if (nextIsCondCheck) {
                  resultText = '✗'
                  resultColor = '#ef4444'
                } else if (entry.hasElseBranch) {
                  resultText = '✗ → ELSE'
                  resultColor = '#c084fc'
                } else {
                  resultText = '✗'
                  resultColor = '#ef4444'
                }
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: `4px 8px 4px ${isElseIf ? 32 : 20}px`, borderRadius: 4, cursor: 'pointer',
                    background: isActive
                      ? `rgba(${entry.conditionResult ? '34,197,94' : '239,68,68'}, 0.06)`
                      : 'transparent',
                    borderLeft: `2px solid ${isActive
                      ? (entry.conditionResult ? '#22c55e' : '#ef4444')
                      : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    {!isElseIf && (
                      <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    )}
                    <span style={{ color: isActive ? '#f59e0b' : '#2a2a44', fontWeight: 700 }}>{keyword}</span>
                    <span style={{ color: isActive ? '#c084fc' : '#2a2a44' }}>{entry.conditionChecked}</span>
                    <span style={{ color: '#555577' }}>→</span>
                    <span style={{ color: isActive ? resultColor : '#2a2a44', fontWeight: 700 }}>
                      {resultText}
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

              if (['REPEAT_START', 'REPEAT_LOOP', 'REPEAT_END'].includes(entry.entryType)) {
                const isStart = entry.entryType === 'REPEAT_START'
                const isEnd   = entry.entryType === 'REPEAT_END'
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: isStart || isEnd ? '5px 8px 5px 20px' : '4px 8px 4px 28px',
                    borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#22d3ee' : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: isEnd || isStart ? 12 : 11,
                    fontStyle: !isStart && !isEnd ? 'italic' : 'normal',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 13 }}>{isEnd ? '✓' : isStart ? '🔁' : '↺'}</span>
                    <span style={{ flex: 1, color: isActive ? '#67e8f9' : '#2a2a44' }}>{entry.description}</span>
                    <span style={{
                      fontSize: 10,
                      color: isActive ? '#22d3ee' : '#2a2a44',
                      background: isActive ? 'rgba(34,211,238,0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                      borderRadius: 4, padding: '1px 6px', flexShrink: 0,
                    }}>
                      {entry.repeatIteration}/{entry.repeatTotal}{isEnd ? ' ✓' : ''}
                    </span>
                  </div>
                )
              }

              if (entry.entryType === 'PASSIVE_EFFECT') {
                const pColor = isActive ? '#c084fc' : '#2a2a44'
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '3px 8px 3px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(192,132,252,0.07)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#c084fc' : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 11 }}>⚡</span>
                    <span style={{ color: pColor, fontWeight: 600 }}>{entry.passiveTriggered}</span>
                    <span style={{ color: '#555577', fontSize: 10 }}>→</span>
                    <span style={{ color: isActive ? '#d4bbff' : '#2a2a44' }}>{entry.passiveEffect}</span>
                  </div>
                )
              }

              if (entry.entryType === 'MEMORY_UPDATE') {
                const isIncrease = entry.memoryVarNewValue > entry.memoryVarOldValue
                const isDecrease = entry.memoryVarNewValue < entry.memoryVarOldValue
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(34,197,94,0.06)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#22c55e' : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span>🔄</span>
                    <span style={{ color: isActive ? '#22d3ee' : '#2a2a44' }}>{entry.memoryVarName}</span>
                    <span style={{ color: '#555577' }}>→</span>
                    <span style={{
                      color: isActive
                        ? isIncrease ? '#4ade80' : isDecrease ? '#f87171' : '#f0f0ff'
                        : '#2a2a44',
                      fontWeight: 700,
                    }}>
                      {entry.memoryVarNewValue}
                    </span>
                    {isActive && (
                      <span style={{ color: '#444466', fontSize: 10 }}>
                        ({entry.memoryVarOldValue} → {entry.memoryVarNewValue})
                      </span>
                    )}
                  </div>
                )
              }

              if (entry.entryType === 'MEMORY_SET') {
                const isIncrease = entry.memoryVarNewValue > entry.memoryVarOldValue
                const isDecrease = entry.memoryVarNewValue < entry.memoryVarOldValue
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(34,211,238,0.06)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#22d3ee' : 'transparent'}`,
                    opacity: pastOpacity,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span>💾</span>
                    <span style={{ color: isActive ? '#22d3ee' : '#2a2a44' }}>{entry.memoryVarName}</span>
                    <span style={{ color: '#555577' }}>←</span>
                    <span style={{
                      color: isActive
                        ? isIncrease ? '#4ade80' : isDecrease ? '#f87171' : '#f0f0ff'
                        : '#2a2a44',
                      fontWeight: 700,
                    }}>
                      {entry.memoryVarNewValue}
                    </span>
                    {isActive && entry.memoryVarOldValue !== entry.memoryVarNewValue && (
                      <span style={{ color: '#444466', fontSize: 10 }}>(was {entry.memoryVarOldValue})</span>
                    )}
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

              // BATTERY_EQUALIZATION log entry
              if (entry.entryType === 'ACTION' && entry.actionTaken === 'BATTERY_EQUALIZATION' && !entry.stalledDueToInsufficientBattery) {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#22d3ee' : 'transparent'}`,
                    opacity: pastOpacity, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 12 }}>⚖️</span>
                    <span style={{ color: isActive ? '#22d3ee' : '#2a2a44', fontWeight: 600 }}>BATTERY EQ</span>
                    {entry.batteryEqualized > 0 && (
                      <span style={{ color: isActive ? '#67e8f9' : '#2a2a44' }}>→ {entry.batteryEqualized} BAT</span>
                    )}
                  </div>
                )
              }

              // STACK_OVERFLOW log entry (damage turn)
              if (entry.entryType === 'ACTION' && entry.actionTaken === 'STACK_OVERFLOW' && !entry.stalledDueToInsufficientBattery) {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(217,70,239,0.1)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#d946ef' : 'transparent'}`,
                    opacity: pastOpacity, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 12 }}>☠️</span>
                    <span style={{ color: isActive ? '#e879f9' : '#2a2a44', fontWeight: 700 }}>STACK OVERFLOW</span>
                    {entry.damageDealt > 0 && (
                      <span style={{ color: isActive ? '#f0abfc' : '#2a2a44', fontWeight: 700 }}>-{entry.damageDealt} HP</span>
                    )}
                    {isActive && <span style={{ color: '#774466', fontSize: 10 }}>⚠ OVERLOAD</span>}
                  </div>
                )
              }

              // SYSTEM OVERLOAD recovery stall
              if (entry.entryType === 'ACTION' && entry.stalledDueToOverload) {
                return (
                  <div key={i} data-log-index={i} onClick={() => seek(i)} style={{
                    padding: '4px 8px 4px 20px', borderRadius: 4, cursor: 'pointer',
                    background: isActive ? 'rgba(217,70,239,0.06)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#a855f7' : 'transparent'}`,
                    opacity: pastOpacity, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ color: isActive ? actorColor : '#2a2a44', fontSize: 10 }}>{entry.actor}</span>
                    <span style={{ fontSize: 12 }}>🔄</span>
                    <span style={{ color: isActive ? '#c084fc' : '#2a2a44', fontWeight: 600 }}>SYSTEM OVERLOAD</span>
                    <span style={{ color: isActive ? '#774488' : '#2a2a44', fontSize: 10 }}>recovering…</span>
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
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                {[0.5, 1, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)} style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    background: speed === s ? '#1a2a3a' : '#10101e',
                    border: `1px solid ${speed === s ? '#00c8ff88' : '#2a2a3a'}`,
                    color: speed === s ? '#00c8ff' : '#555577',
                    transition: 'all 0.15s',
                  }}>{s}x</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — Robot B stats */}
        <div style={{
          width: 240, flexShrink: 0, padding: '20px 16px',
          borderLeft: '1px solid #1e1e3a', background: '#080814',
          display: 'flex', flexDirection: 'column', gap: 8,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 13, color: '#ff3c3c', marginBottom: 4, letterSpacing: 2 }}>
            {battle?.robotB?.name || 'ROBOT B'}
          </div>
          <div style={{ fontSize: 10, color: '#4a4a6a', marginBottom: 12 }}>
            TIER {battle?.robotB?.tier || '?'}
          </div>
          <FlashingStatBar label="HP" value={displayHpB} max={maxHpB} />
          <FlashingStatBar label="Battery" value={displayBattB} max={battle?.robotB?.battery || 100} colorOverride="#ff3c3c" />
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
          <VariablePanel log={log} currentIndex={currentIndex} actor="B" accentColor="#ff3c3c" />
        </div>
      </div>

      <Modal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setCopied(false) }}
        title="Share Battle"
        width="480px"
      >
        <p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>
          Share this battle replay with anyone:
        </p>
        <div style={{
          color: '#f97316',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          {battle?.battleCode}
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: '#111',
          borderRadius: '6px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}>
          <span style={{
            flex: 1,
            color: '#ccc',
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {window.location.origin}/battles/{battle?.battleCode}
          </span>
          <button
            onClick={() => {
              const url = `${window.location.origin}/battles/${battle?.battleCode}`
              navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            style={{
              background: copied ? '#22c55e' : '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
        </div>
      </Modal>

      <style>{`
        @keyframes countdownPop {
          from { transform: scale(1.4); opacity: 0.6; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes varPulse {
          0%   { color: #4ade80; text-shadow: 0 0 8px rgba(74,222,128,0.8); }
          60%  { color: #4ade80; text-shadow: 0 0 4px rgba(74,222,128,0.4); }
          100% { color: #8888aa; text-shadow: none; }
        }
      `}</style>
    </div>
  )
}

function VariablePanel({ log, currentIndex, actor, accentColor }) {
  const [collapsed, setCollapsed] = useState(false)

  const vars = useMemo(() => {
    const order = []
    const values = {}
    for (let i = 0; i <= currentIndex && i < log.length; i++) {
      const e = log[i]
      if (e.actor !== actor) continue
      if (e.entryType !== 'MEMORY_SET' && e.entryType !== 'MEMORY_UPDATE') continue
      if (!(e.memoryVarName in values)) order.push(e.memoryVarName)
      values[e.memoryVarName] = e.memoryVarNewValue
    }
    return order.map(name => ({ name, value: values[name] }))
  }, [log, currentIndex, actor])

  const current = currentIndex >= 0 && currentIndex < log.length ? log[currentIndex] : null
  const justChangedName = (
    current?.actor === actor &&
    (current?.entryType === 'MEMORY_SET' || current?.entryType === 'MEMORY_UPDATE')
  ) ? current.memoryVarName : null

  if (vars.length === 0) return null

  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: accentColor, opacity: 0.7,
          fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
          fontFamily: 'JetBrains Mono, monospace',
          padding: '4px 2px', marginBottom: collapsed ? 0 : 4,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
      >
        <span>{collapsed ? '▶' : '▼'}</span>
        Variables ({vars.length})
      </button>
      {!collapsed && (
        <div style={{
          padding: '7px 10px',
          background: '#0d0d1e',
          borderRadius: 6,
          border: '1px solid #1a1a30',
        }}>
          {vars.map(({ name, value }) => {
            const isActive = name === justChangedName
            return (
              <div
                key={name}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '3px 4px', borderRadius: 4, marginBottom: 2,
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                  transition: 'background 0.4s ease',
                }}
              >
                <span style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                  color: isActive ? '#67e8f9' : '#4a4a6a',
                }}>
                  {name}
                </span>
                <span style={{
                  fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700, color: isActive ? '#4ade80' : '#8888aa',
                  animation: isActive ? 'varPulse 0.5s ease' : 'none',
                }}>
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      )}
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

function EventCard({ entry, robotA, robotB, log = [], currentIndex = 0 }) {
  const actorColor = entry.actor === 'A' ? '#38bdf8' : '#ef4444'
  const robotName = entry.actor === 'A' ? robotA?.name : robotB?.name
  const cardBase = {
    background: 'rgba(0,0,0,0.5)',
    borderRadius: 12, padding: '16px 20px', textAlign: 'center',
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
        <div style={{ fontSize: 12, color: drainColor + 'aa', marginBottom: 8 }}>-{entry.batterySpent} battery</div>
        <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  if (entry.entryType === 'SCAN_TICK') {
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(56,189,248,0.3)' }}>
        {header}
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>SYSTEM SCAN IN PROGRESS</div>
        <div style={{ fontSize: 12, color: '#7dd3fc', fontStyle: 'italic', marginBottom: 10 }}>{entry.description}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: (entry.scanTurnsRemaining || 0) + 1 }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#38bdf8',
              opacity: i === 0 ? 1 : 0.3, animation: i === 0 ? 'pulse 1s ease-in-out infinite' : 'none',
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>SCAN COMPLETE</div>
        <div style={{ fontSize: 12, color: '#86efac', marginBottom: 8 }}>{entry.description}</div>
        {entry.debuffsRemoved?.map((d, i) => (
          <div key={i} style={{ fontSize: 11, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>↑ {d}</div>
        ))}
      </div>
    )
  }

  if (['REPEAT_START', 'REPEAT_LOOP', 'REPEAT_END'].includes(entry.entryType)) {
    const isEnd   = entry.entryType === 'REPEAT_END'
    const isStart = entry.entryType === 'REPEAT_START'
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(34,211,238,0.3)', maxWidth: 420, margin: '0 auto' }}>
        {header}
        <div style={{ fontSize: 28, marginBottom: 8 }}>{isEnd ? '✅' : isStart ? '🔁' : '↺'}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
          {isEnd ? 'LOOP COMPLETE' : isStart ? 'LOOP START' : 'LOOP ITERATION'}
        </div>
        <div style={{ fontSize: 12, color: '#67e8f9', marginBottom: 12, fontStyle: 'italic', lineHeight: 1.4 }}>
          {entry.description}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: entry.repeatTotal }).map((_, idx) => (
            <div key={idx} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: idx < entry.repeatIteration ? '#22d3ee' : 'rgba(34,211,238,0.2)',
              border: '1px solid rgba(34,211,238,0.4)',
              transition: 'background 0.2s ease',
              boxShadow: idx < entry.repeatIteration ? '0 0 6px rgba(34,211,238,0.6)' : 'none',
            }} />
          ))}
        </div>
      </div>
    )
  }

  if (entry.entryType === 'MEMORY_SET') {
    const isIncrease = entry.memoryVarNewValue > entry.memoryVarOldValue
    const isDecrease = entry.memoryVarNewValue < entry.memoryVarOldValue
    const valColor = isIncrease ? '#4ade80' : isDecrease ? '#f87171' : '#f0f0ff'
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(34,211,238,0.25)' }}>
        {header}
        <div style={{ fontSize: 24, marginBottom: 8 }}>💾</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
          MEMORY SET
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#22d3ee' }}>{entry.memoryVarName}</span>
          <span style={{ color: '#555577', margin: '0 6px' }}>←</span>
          <span style={{ color: valColor, fontWeight: 700 }}>{entry.memoryVarNewValue}</span>
          {entry.memoryVarOldValue !== entry.memoryVarNewValue && (
            <span style={{ color: '#444466', fontSize: 11, marginLeft: 8 }}>
              (was {entry.memoryVarOldValue})
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  if (entry.entryType === 'MEMORY_UPDATE') {
    const isIncrease = entry.memoryVarNewValue > entry.memoryVarOldValue
    const isDecrease = entry.memoryVarNewValue < entry.memoryVarOldValue
    const valColor = isIncrease ? '#4ade80' : isDecrease ? '#f87171' : '#f0f0ff'
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(34,197,94,0.25)' }}>
        {header}
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
          MEMORY UPDATE
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#22d3ee' }}>{entry.memoryVarName}</span>
          <span style={{ color: '#555577', margin: '0 6px' }}>→</span>
          <span style={{ color: valColor, fontWeight: 700 }}>{entry.memoryVarNewValue}</span>
          {entry.memoryVarOldValue !== entry.memoryVarNewValue && (
            <span style={{ color: '#444466', fontSize: 11, marginLeft: 8 }}>
              (was {entry.memoryVarOldValue})
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  if (entry.entryType === 'CONDITION_CHECK') {
    // Walk back to find the first CONDITION_CHECK in this chain (same actor + turn)
    let chainStart = currentIndex
    while (
      chainStart > 0 &&
      log[chainStart - 1]?.entryType === 'CONDITION_CHECK' &&
      log[chainStart - 1]?.actor === entry.actor &&
      log[chainStart - 1]?.turn === entry.turn
    ) chainStart--

    // Collect all chain entries up to and including currentIndex
    const chainEntries = []
    for (let ci = chainStart; ci <= currentIndex; ci++) {
      if (
        log[ci]?.entryType === 'CONDITION_CHECK' &&
        log[ci]?.actor === entry.actor &&
        log[ci]?.turn === entry.turn
      ) chainEntries.push({ ...log[ci], logIndex: ci })
    }

    const lastEntry = chainEntries[chainEntries.length - 1]
    const anyPassed = chainEntries.some(e => e.conditionResult)
    const isChainComplete = anyPassed ||
      !(log[currentIndex + 1]?.entryType === 'CONDITION_CHECK' &&
        log[currentIndex + 1]?.actor === entry.actor &&
        log[currentIndex + 1]?.turn === entry.turn)

    let footerText = ''
    if (isChainComplete) {
      if (anyPassed) footerText = 'Executing matched branch...'
      else if (lastEntry?.hasElseBranch) footerText = 'Routing to ELSE branch...'
      else footerText = '→ No match — skipped to next block'
    }

    const overallBorderColor = anyPassed
      ? 'rgba(34,197,94,0.4)'
      : lastEntry?.hasElseBranch
        ? 'rgba(168,85,247,0.4)'
        : 'rgba(239,68,68,0.35)'

    return (
      <div style={{ ...cardBase, border: `1px solid ${overallBorderColor}`, textAlign: 'left' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 10, color: actorColor, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
          TURN {entry.turn} — {robotName || entry.actor}
        </div>
        <div style={{ fontSize: 10, color: '#555577', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
          CONDITION EVALUATION
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chainEntries.map((ce, idx) => {
            const keyword = idx === 0 ? 'IF' : 'ELSE IF'
            const isCurrent = ce.logIndex === currentIndex
            const passed = ce.conditionResult
            const rowBg = isCurrent
              ? passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)'
              : 'rgba(255,255,255,0.02)'
            const rowBorder = isCurrent
              ? passed ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.25)'
              : 'rgba(255,255,255,0.05)'
            return (
              <div key={ce.logIndex} style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: rowBg,
                border: `1px solid ${rowBorder}`,
                borderLeft: `3px solid ${passed ? '#22c55e' : isCurrent ? '#ef4444' : '#333355'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    letterSpacing: '0.1em', color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                    padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(245,158,11,0.25)',
                  }}>
                    {keyword}
                  </span>
                  <span style={{ fontSize: 12, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {ce.conditionChecked}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    color: passed ? '#22c55e' : '#ef4444',
                  }}>
                    {passed ? '✓ TRUE' : '✗ FALSE'}
                  </span>
                  {isCurrent && passed && (
                    <span style={{ fontSize: 10, color: '#22c55e', fontStyle: 'italic' }}>← executing</span>
                  )}
                </div>
              </div>
            )
          })}

          {isChainComplete && !anyPassed && lastEntry?.hasElseBranch && (
            <div style={{
              padding: '7px 10px', borderRadius: 8,
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.25)',
              borderLeft: '3px solid #a855f7',
              fontSize: 11, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            }}>
              ELSE ← executing
            </div>
          )}
        </div>

        {isChainComplete && footerText && (
          <div style={{ fontSize: 11, color: '#555577', marginTop: 10, textAlign: 'center', fontStyle: 'italic' }}>
            {footerText}
          </div>
        )}
      </div>
    )
  }

  if (entry.actionTaken === 'BATTERY_EQUALIZATION' && !entry.stalledDueToInsufficientBattery) {
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(34,211,238,0.35)' }}>
        {header}
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', marginBottom: 10, letterSpacing: 1 }}>
          BATTERY EQUALIZATION
        </div>
        {entry.batteryEqualized > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a4a6a', marginBottom: 2 }}>EQUALIZED TO</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#22d3ee' }}>{entry.batteryEqualized}</div>
              <div style={{ fontSize: 9, color: '#4a4a6a' }}>BATTERY</div>
            </div>
          </div>
        )}
        <div style={{ fontSize: 10, color: '#555577', marginBottom: 6 }}>⚡ -{entry.batterySpent} cost</div>
        <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  if (entry.actionTaken === 'STACK_OVERFLOW' && !entry.stalledDueToInsufficientBattery) {
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(217,70,239,0.45)', boxShadow: '0 0 30px rgba(217,70,239,0.2)' }}>
        {header}
        <div style={{ fontSize: 28, marginBottom: 8 }}>☠️</div>
        <div style={{
          fontSize: 15, fontWeight: 900, color: '#e879f9', marginBottom: 10, letterSpacing: 2,
          textShadow: '0 0 20px rgba(217,70,239,0.7)',
        }}>
          STACK OVERFLOW
        </div>
        {entry.damageDealt > 0 && (
          <div style={{
            fontSize: 26, fontWeight: 900, color: '#f0abfc', marginBottom: 6,
            textShadow: '0 0 16px rgba(217,70,239,0.6)',
          }}>
            -{entry.damageDealt} HP
          </div>
        )}
        <div style={{
          fontSize: 10, color: '#a855f7', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace',
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 4, padding: '3px 8px', display: 'inline-block',
        }}>
          ⚠ SYSTEM OVERLOAD — stalls next turn
        </div>
        <div style={{ fontSize: 10, color: '#555577', marginTop: 6 }}>⚡ -{entry.batterySpent}</div>
        <div style={{ fontSize: 11, color: '#7a7a9a', marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  if (entry.stalledDueToOverload) {
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(168,85,247,0.3)' }}>
        {header}
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#c084fc', marginBottom: 8, letterSpacing: 1 }}>
          SYSTEM OVERLOAD
        </div>
        <div style={{ fontSize: 12, color: '#a855f7', marginBottom: 8 }}>Recovering from Stack Overflow…</div>
        <div style={{ fontSize: 11, color: '#7a7a9a', fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      </div>
    )
  }

  return (
    <div style={{ ...cardBase, border: `1px solid ${entry.actor === 'A' ? '#38bdf840' : '#ef444440'}` }}>
      {header}
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        background: actionColor(entry.actionTaken) + '22',
        border: `1px solid ${actionColor(entry.actionTaken)}55`,
        color: actionColor(entry.actionTaken),
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1,
      }}>
        {entry.actionTaken?.replace(/_/g, ' ')}
      </span>
      {entry.stalledDueToInsufficientBattery && (
        <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 6 }}>⚡ STALLED — low battery</div>
      )}
      {entry.damageDealt > 0 && (
        <div style={{ fontSize: 13, color: '#ff6b35', marginTop: 8, fontWeight: 700 }}>-{entry.damageDealt} HP</div>
      )}
      {entry.healingDone > 0 && (
        <div style={{ fontSize: 13, color: '#22c55e', marginTop: 8, fontWeight: 700 }}>+{entry.healingDone}</div>
      )}
      <div style={{ fontSize: 10, color: '#555577', marginTop: 8 }}>⚡ -{entry.batterySpent}</div>
      {entry.description && (
        <div style={{ fontSize: 11, color: '#7a7a9a', marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>{entry.description}</div>
      )}
    </div>
  )
}
