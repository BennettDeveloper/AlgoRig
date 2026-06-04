import { useState, useEffect, useRef } from 'react'

const EFFECT_DURATION_BASE = 600

export default function ArenaEffects({ currentEntry, speed = 1 }) {
  const [activeEffect, setActiveEffect] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!currentEntry) return
    if (currentEntry.entryType === 'ACTION') {
      triggerEffect(currentEntry.actionTaken, currentEntry.actor, currentEntry.damageDealt ?? 0)
    } else if (currentEntry.entryType === 'BATTERY_DRAIN') {
      triggerEffect('BATTERY_DRAIN', currentEntry.actor, 0)
    }
  }, [currentEntry])

  function triggerEffect(action, actor, damage) {
    clearTimeout(timerRef.current)
    const duration = Math.round(EFFECT_DURATION_BASE / speed)
    setActiveEffect({ action, actor, damage, duration, key: Date.now() })
    timerRef.current = setTimeout(() => setActiveEffect(null), duration + 150)
  }

  if (!activeEffect) return null

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 20, overflow: 'hidden',
    }}>
      <EffectRenderer
        key={activeEffect.key}
        action={activeEffect.action}
        isActorA={activeEffect.actor === 'A'}
        damage={activeEffect.damage}
        duration={activeEffect.duration}
      />
    </div>
  )
}

// ── Spark burst helper ────────────────────────────────────────────────────────

function SparkBurst({ cx, cy, count, colors, size, d, spread = 60 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => {
        const angle = (i / count) * 360 + (Math.random() * 20 - 10)
        const dist = spread * (0.6 + Math.random() * 0.8)
        const rad = (angle * Math.PI) / 180
        const sx = Math.round(Math.cos(rad) * dist)
        const sy = Math.round(Math.sin(rad) * dist)
        const color = colors[i % colors.length]
        const delay = `${Math.round(i * 18)}ms`
        const w = size * (0.7 + Math.random() * 0.6)
        return (
          <div key={i} style={{
            position: 'absolute',
            left: cx, top: cy,
            width: w, height: w,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 4px ${color}`,
            '--sx': `${sx}px`,
            '--sy': `${sy}px`,
            animation: `sparkFlyOut ${d} ease-out forwards`,
            animationDelay: delay,
            opacity: 0,
          }} />
        )
      })}
    </>
  )
}

// ── Screen flash ──────────────────────────────────────────────────────────────

function ScreenFlash({ color, half, isActorA, d }) {
  if (half) {
    return (
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: isActorA ? '50%' : 0, right: isActorA ? 0 : '50%',
        background: color,
        animation: `flashFade ${d} ease-out forwards`,
      }} />
    )
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: color,
      animation: `flashFade ${d} ease-out forwards`,
    }} />
  )
}

// ── Impact burst ──────────────────────────────────────────────────────────────

function ImpactBurst({ cx, cy, color, size, d }) {
  return (
    <div style={{
      position: 'absolute', left: cx, top: cy,
      transform: 'translate(-50%, -50%)',
      width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      borderRadius: '50%',
      animation: `impactBurst ${d} ease-out forwards`,
    }} />
  )
}

// ── Effect renderers ──────────────────────────────────────────────────────────

function EffectRenderer({ action, isActorA, damage, duration }) {
  const attackerSide = isActorA ? '25%' : '75%'
  const defenderSide = isActorA ? '75%' : '25%'
  const d = `${duration}ms`

  switch (action) {
    case 'HARD_STRIKE':          return <HardStrikeEffect         defenderSide={defenderSide} isActorA={isActorA} damage={damage} d={d} />
    case 'HEAVY_ATTACK':         return <HeavyAttackEffect        defenderSide={defenderSide} isActorA={isActorA} damage={damage} d={d} />
    case 'POWER_SURGE':          return <PowerSurgeEffect         attackerSide={attackerSide} defenderSide={defenderSide} isActorA={isActorA} d={d} />
    case 'STACK_OVERFLOW':       return <StackOverflowEffect      attackerSide={attackerSide} defenderSide={defenderSide} isActorA={isActorA} damage={damage} d={d} />
    case 'BATTERY_EQUALIZATION': return <BatteryEqualizationEffect attackerSide={attackerSide} defenderSide={defenderSide} d={d} />
    case 'PATCH':                return <PatchEffect              attackerSide={attackerSide} d={d} />
    case 'FIREWALL':             return <FirewallEffect           attackerSide={attackerSide} d={d} />
    case 'ARMOR_PLATE':          return <ArmorPlateEffect         attackerSide={attackerSide} d={d} />
    case 'VIRUS_UPLOAD':         return <VirusUploadEffect        defenderSide={defenderSide} isActorA={isActorA} d={d} />
    case 'SYSTEM_SCAN':          return <SystemScanEffect         attackerSide={attackerSide} d={d} />
    case 'CPU_STALL':            return <CpuStallEffect           attackerSide={attackerSide} d={d} />
    case 'BATTERY_DRAIN':        return <BatteryDrainEffect       d={d} />
    default:                     return null
  }
}

function HardStrikeEffect({ defenderSide, isActorA, damage, d }) {
  const sparkCount = Math.min(14, 8 + Math.round(damage / 8))
  return (
    <>
      <ScreenFlash color="rgba(249,115,22,0.18)" half isActorA={isActorA} d={d} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={isActorA ? '52%' : '48%'} y1="28%" x2={isActorA ? '82%' : '18%'} y2="72%"
          stroke="#f97316" strokeWidth="4" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards` }} />
        <line x1={isActorA ? '58%' : '42%'} y1="22%" x2={isActorA ? '87%' : '13%'} y2="66%"
          stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards`, animationDelay: '40ms' }} />
        <line x1={isActorA ? '47%' : '53%'} y1="33%" x2={isActorA ? '77%' : '23%'} y2="77%"
          stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards`, animationDelay: '90ms' }} />
      </svg>
      <ImpactBurst cx={defenderSide} cy="48%" color="rgba(249,115,22,0.85)" size={80} d={d} />
      <SparkBurst
        cx={defenderSide} cy="48%"
        count={sparkCount}
        colors={['#f97316', '#fb923c', '#fbbf24', '#fde68a', '#fff']}
        size={6} d={d} spread={72}
      />
    </>
  )
}

function HeavyAttackEffect({ defenderSide, isActorA, damage, d }) {
  const sparkCount = Math.min(16, 10 + Math.round(damage / 6))
  return (
    <>
      <ScreenFlash color="rgba(239,68,68,0.22)" d={d} isActorA={isActorA} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={isActorA ? '42%' : '58%'} y1="12%" x2={isActorA ? '92%' : '8%'} y2="88%"
          stroke="#ef4444" strokeWidth="7" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards` }} />
        <line x1={isActorA ? '52%' : '48%'} y1="8%" x2={isActorA ? '95%' : '5%'} y2="82%"
          stroke="#f97316" strokeWidth="4" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards`, animationDelay: '30ms' }} />
        <line x1={isActorA ? '36%' : '64%'} y1="18%" x2={isActorA ? '86%' : '14%'} y2="78%"
          stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"
          style={{ animation: `slashAppear ${d} ease-out forwards`, animationDelay: '70ms' }} />
        <circle cx={defenderSide} cy="50%" r="12" fill="none" stroke="#f97316" strokeWidth="4"
          style={{ animation: `shockwave ${d} ease-out forwards` }} />
        <circle cx={defenderSide} cy="50%" r="12" fill="none" stroke="#ef4444" strokeWidth="2"
          style={{ animation: `shockwave ${d} ease-out forwards`, animationDelay: '70ms' }} />
        <circle cx={defenderSide} cy="50%" r="12" fill="none" stroke="#fca5a5" strokeWidth="1"
          style={{ animation: `shockwave ${d} ease-out forwards`, animationDelay: '140ms' }} />
      </svg>
      <ImpactBurst cx={defenderSide} cy="48%" color="rgba(239,68,68,0.95)" size={120} d={d} />
      <SparkBurst
        cx={defenderSide} cy="48%"
        count={sparkCount}
        colors={['#ef4444', '#f97316', '#fbbf24', '#fb923c', '#fff']}
        size={7} d={d} spread={95}
      />
    </>
  )
}

function PowerSurgeEffect({ attackerSide, defenderSide, isActorA, d }) {
  return (
    <>
      <ScreenFlash color="rgba(168,85,247,0.14)" d={d} isActorA={isActorA} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polyline
          points={isActorA
            ? '28%,42% 43%,36% 39%,51% 54%,46% 50%,61% 66%,56% 72%,50%'
            : '72%,42% 57%,36% 61%,51% 46%,46% 50%,61% 34%,56% 28%,50%'}
          fill="none" stroke="#a855f7" strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: `lightningArc ${d} ease-out forwards` }} />
        <polyline
          points={isActorA
            ? '30%,46% 41%,41% 37%,53% 51%,49% 47%,63% 62%,59% 68%,53%'
            : '70%,46% 59%,41% 63%,53% 49%,49% 53%,63% 38%,59% 32%,53%'}
          fill="none" stroke="#c084fc" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: `lightningArc ${d} ease-out forwards`, animationDelay: '50ms' }} />
        <polyline
          points={isActorA
            ? '32%,39% 44%,33% 41%,48% 56%,43% 52%,58% 67%,53% 73%,47%'
            : '68%,39% 56%,33% 59%,48% 44%,43% 48%,58% 33%,53% 27%,47%'}
          fill="none" stroke="#e879f9" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: `lightningArc ${d} ease-out forwards`, animationDelay: '100ms' }} />
      </svg>
      <ImpactBurst cx={defenderSide} cy="48%" color="rgba(168,85,247,0.9)" size={100} d={d} />
      <SparkBurst
        cx={defenderSide} cy="48%"
        count={12}
        colors={['#a855f7', '#c084fc', '#e879f9', '#38bdf8', '#fff']}
        size={5} d={d} spread={80}
      />
      {/* Attacker glow aura */}
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 90, height: 90,
        background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
        borderRadius: '50%', animation: `impactBurst ${d} ease-out forwards`,
      }} />
    </>
  )
}

function PatchEffect({ attackerSide, d }) {
  return (
    <>
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 140, height: 140,
        background: 'radial-gradient(circle, rgba(34,197,94,0.32) 0%, transparent 70%)',
        borderRadius: '50%', animation: `impactBurst ${d} ease-out forwards`,
      }} />
      <SparkBurst
        cx={attackerSide} cy="48%"
        count={10}
        colors={['#22c55e', '#4ade80', '#86efac', '#bbf7d0']}
        size={5} d={d} spread={55}
      />
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(${attackerSide} + ${(i - 2) * 18}px)`,
          top: `${44 + (i % 2) * 8}%`,
          color: '#22c55e', fontSize: 13 + (i % 3) * 4, fontWeight: 900,
          fontFamily: 'JetBrains Mono, monospace',
          animation: `floatUp ${d} ease-out forwards`,
          animationDelay: `${i * 55}ms`, opacity: 0,
        }}>+</div>
      ))}
    </>
  )
}

function FirewallEffect({ attackerSide, d }) {
  return (
    <>
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 100, height: 100,
        border: '3px solid #3b82f6', borderRadius: 10,
        background: 'rgba(59,130,246,0.12)',
        boxShadow: '0 0 28px rgba(59,130,246,0.6)',
        animation: `shieldPulse ${d} ease-out forwards`,
      }} />
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)',
        animation: `shieldPulse ${d} ease-out forwards`,
        fontSize: 34, lineHeight: 1,
      }}>🛡</div>
      <SparkBurst
        cx={attackerSide} cy="48%"
        count={8}
        colors={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']}
        size={5} d={d} spread={50}
      />
    </>
  )
}

function ArmorPlateEffect({ attackerSide, d }) {
  return (
    <>
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 90, height: 90,
        background: 'rgba(249,115,22,0.18)', border: '2px solid #f97316', borderRadius: 6,
        boxShadow: '0 0 20px rgba(249,115,22,0.5)',
        animation: `armorSlide ${d} ease-out forwards`,
      }} />
      <SparkBurst
        cx={attackerSide} cy="48%"
        count={8}
        colors={['#f97316', '#fb923c', '#fbbf24', '#f59e0b']}
        size={5} d={d} spread={48}
      />
    </>
  )
}

function VirusUploadEffect({ defenderSide, isActorA, d }) {
  return (
    <>
      <ScreenFlash color="rgba(168,85,247,0.10)" half isActorA={isActorA} d={d} />
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(${defenderSide} + ${(i % 2 === 0 ? 1 : -1) * (4 + i * 6)}px)`,
          top: `${8 + i * 9}%`,
          width: 22 + (i % 3) * 20, height: 2 + (i % 4) * 2,
          background: i % 2 === 0 ? 'rgba(168,85,247,0.7)' : 'rgba(34,197,94,0.5)',
          animation: `glitchFlash ${d} ease-out forwards`,
          animationDelay: `${i * 25}ms`,
        }} />
      ))}
      <SparkBurst
        cx={defenderSide} cy="48%"
        count={10}
        colors={['#a855f7', '#c084fc', '#22c55e', '#4ade80']}
        size={4} d={d} spread={60}
      />
      <div style={{
        position: 'absolute', left: defenderSide, top: '33%',
        transform: 'translate(-50%, -50%)',
        fontSize: 26,
        animation: `floatUp ${d} ease-out forwards`, opacity: 0,
      }}>☠️</div>
    </>
  )
}

function SystemScanEffect({ attackerSide, d }) {
  return (
    <>
      <div style={{
        position: 'absolute',
        left: `calc(${attackerSide} - 44px)`,
        top: '10%', width: 88, height: 2,
        background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
        boxShadow: '0 0 10px #38bdf8',
        animation: `scanSweep ${d} linear forwards`,
      }} />
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 110, height: 110,
        background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)',
        borderRadius: '50%', animation: `impactBurst ${d} ease-out forwards`,
      }} />
      <div style={{
        position: 'absolute', left: attackerSide, top: '72%',
        transform: 'translateX(-50%)',
        color: '#38bdf8', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em',
        animation: `floatUp ${d} ease-out forwards`, opacity: 0, whiteSpace: 'nowrap',
      }}>SCANNING...</div>
    </>
  )
}

function CpuStallEffect({ attackerSide, d }) {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(${attackerSide} + ${(i % 2 === 0 ? 1 : -1) * (i * 4)}px)`,
          top: `${20 + i * 6}%`,
          width: 4 + (i % 3) * 3, height: 2 + (i % 2) * 2,
          background: `rgba(${130 + i * 8}, ${130 + i * 8}, ${130 + i * 8}, 0.6)`,
          animation: `glitchFlash ${d} ease-out forwards`,
          animationDelay: `${i * 25}ms`,
        }} />
      ))}
      {['Z', 'Z', 'Z'].map((z, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(${attackerSide} + ${(i - 1) * 16}px)`,
          top: `${50 - i * 13}%`,
          color: '#6b7280', fontSize: 10 + i * 4, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          animation: `floatUp ${d} ease-out forwards`,
          animationDelay: `${i * 100}ms`, opacity: 0,
        }}>{z}</div>
      ))}
    </>
  )
}

function StackOverflowEffect({ attackerSide, defenderSide, isActorA, damage, d }) {
  const sparkCount = Math.min(28, 18 + Math.round(damage / 5))
  return (
    <>
      {/* Full-screen purple flash */}
      <ScreenFlash color="rgba(217,70,239,0.32)" d={d} isActorA={isActorA} />

      {/* Charging aura around attacker */}
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)',
        width: 130, height: 130,
        background: 'radial-gradient(circle, rgba(217,70,239,0.5) 0%, rgba(168,85,247,0.2) 55%, transparent 70%)',
        borderRadius: '50%',
        boxShadow: '0 0 50px rgba(217,70,239,0.7)',
        animation: `impactBurst ${d} ease-out forwards`,
      }} />

      {/* Outer beam glow */}
      <div style={{
        position: 'absolute',
        left: '23%', width: '54%', height: 32,
        top: 'calc(47% - 16px)',
        background: isActorA
          ? 'linear-gradient(90deg, rgba(217,70,239,0.6), rgba(168,85,247,0.5), rgba(56,189,248,0.6))'
          : 'linear-gradient(270deg, rgba(217,70,239,0.6), rgba(168,85,247,0.5), rgba(56,189,248,0.6))',
        borderRadius: 16,
        boxShadow: '0 0 30px rgba(217,70,239,0.6)',
        transformOrigin: isActorA ? 'left center' : 'right center',
        animation: `beamTravel ${d} ease-out forwards`,
      }} />

      {/* Core beam */}
      <div style={{
        position: 'absolute',
        left: '23%', width: '54%', height: 10,
        top: 'calc(48% - 5px)',
        background: isActorA
          ? 'linear-gradient(90deg, #d946ef, #a855f7, #38bdf8)'
          : 'linear-gradient(270deg, #d946ef, #a855f7, #38bdf8)',
        borderRadius: 5,
        boxShadow: '0 0 16px #d946ef, 0 0 8px #fff',
        transformOrigin: isActorA ? 'left center' : 'right center',
        animation: `beamTravel ${d} ease-out forwards`,
      }} />

      {/* Core white thread */}
      <div style={{
        position: 'absolute',
        left: '23%', width: '54%', height: 3,
        top: 'calc(48% - 1.5px)',
        background: '#ffffff',
        borderRadius: 2,
        boxShadow: '0 0 8px #fff',
        transformOrigin: isActorA ? 'left center' : 'right center',
        animation: `beamTravel ${d} ease-out forwards`,
      }} />

      {/* Shockwave rings at impact */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <circle cx={defenderSide} cy="48%" r="15" fill="none" stroke="#d946ef" strokeWidth="6"
          style={{ animation: `shockwave ${d} ease-out forwards` }} />
        <circle cx={defenderSide} cy="48%" r="15" fill="none" stroke="#a855f7" strokeWidth="3"
          style={{ animation: `shockwave ${d} ease-out forwards`, animationDelay: '55ms' }} />
        <circle cx={defenderSide} cy="48%" r="15" fill="none" stroke="#38bdf8" strokeWidth="1.5"
          style={{ animation: `shockwave ${d} ease-out forwards`, animationDelay: '110ms' }} />
      </svg>

      {/* Massive impact burst at defender */}
      <ImpactBurst cx={defenderSide} cy="48%" color="rgba(217,70,239,0.95)" size={160} d={d} />

      {/* Massive spark burst */}
      <SparkBurst
        cx={defenderSide} cy="48%"
        count={sparkCount}
        colors={['#d946ef', '#a855f7', '#e879f9', '#c084fc', '#38bdf8', '#fff']}
        size={8} d={d} spread={130}
      />
    </>
  )
}

function BatteryEqualizationEffect({ attackerSide, defenderSide, d }) {
  return (
    <>
      {/* Energy flow beam */}
      <div style={{
        position: 'absolute',
        left: '23%', width: '54%', height: 4,
        top: 'calc(48% - 2px)',
        background: 'linear-gradient(90deg, rgba(34,211,238,0.9), rgba(56,189,248,0.6), rgba(34,211,238,0.9))',
        boxShadow: '0 0 12px rgba(34,211,238,0.6)',
        borderRadius: 2,
        animation: `flashFade ${d} ease-out forwards`,
      }} />
      {/* Aura on both sides */}
      <div style={{
        position: 'absolute', left: attackerSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 90, height: 90,
        background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)',
        borderRadius: '50%', animation: `impactBurst ${d} ease-out forwards`,
      }} />
      <div style={{
        position: 'absolute', left: defenderSide, top: '48%',
        transform: 'translate(-50%, -50%)', width: 90, height: 90,
        background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)',
        borderRadius: '50%', animation: `impactBurst ${d} ease-out forwards`,
      }} />
      <SparkBurst cx={attackerSide} cy="48%" count={8} colors={['#22d3ee', '#38bdf8', '#67e8f9']} size={5} d={d} spread={50} />
      <SparkBurst cx={defenderSide} cy="48%" count={8} colors={['#22d3ee', '#38bdf8', '#67e8f9']} size={5} d={d} spread={50} />
    </>
  )
}

function BatteryDrainEffect({ d }) {
  return (
    <>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${12 + i * 12}%`,
          top: `${22 + (i % 3) * 20}%`,
          width: 5, height: 5, background: '#f59e0b', borderRadius: '50%',
          animation: `sparkle ${d} ease-out forwards`,
          animationDelay: `${i * 35}ms`,
        }} />
      ))}
    </>
  )
}
