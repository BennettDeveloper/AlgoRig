import { useEffect } from 'react'

const tierColors = {
  1: '#6b7280',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f97316',
}

const statGroups = [
  {
    label: 'COMBAT',
    stats: [
      { label: 'System Integrity', key: 'systemIntegrity', max: 200 },
      { label: 'Core Impact',      key: 'coreImpact',      max: 70  },
      { label: 'Chassis Armor',    key: 'chassisArmor',    max: 70  },
      { label: 'Clock Speed',      key: 'clockSpeed',      max: 80  },
    ],
  },
  {
    label: 'POWER',
    stats: [
      { label: 'Battery',  key: 'battery',  max: 100 },
      { label: 'Wattage',  key: 'wattage',  max: 50  },
      { label: 'Cooling',  key: 'cooling',  max: 50  },
      { label: 'Recovery', key: 'recovery', max: 50  },
    ],
  },
  {
    label: 'SOFTWARE',
    stats: [
      { label: 'Exploit Power',     key: 'exploitPower',     max: 70  },
      { label: 'Firewall Strength', key: 'firewallStrength', max: 70  },
      { label: 'Memory',            key: 'memory',           max: 100 },
      { label: 'Stability',         key: 'stability',        max: 100 },
    ],
  },
]

function getSpecialization(robot) {
  const stats = {
    'ATTACKER':  robot.coreImpact,
    'DEFENDER':  robot.chassisArmor,
    'SPEEDSTER': robot.clockSpeed,
    'HACKER':    robot.exploitPower,
    'HEALER':    robot.recovery,
  }
  return Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0]
}

function StatRow({ label, value, max, color }) {
  const pct = Math.min(((value ?? 0) / max) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ff' }}>
          {value ?? '—'}
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export default function RobotDetailModal({ robot, onClose }) {
  const tierColor = tierColors[robot.tier] || '#6b7280'
  const spec = getSpecialization(robot)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 32,
        width: 600,
        maxWidth: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)`,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div style={{
            fontSize: 48,
            lineHeight: 1,
            filter: `drop-shadow(0 0 16px ${tierColor}80)`,
            flexShrink: 0,
          }}>
            🤖
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f0f0ff', marginBottom: 8 }}>
              {robot.name}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                background: `${tierColor}20`,
                border: `1px solid ${tierColor}50`,
                borderRadius: 4,
                padding: '3px 10px',
                color: tierColor,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}>
                TIER {robot.tier}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '3px 10px',
                color: '#8888aa',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.08em',
              }}>
                {spec}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#8888aa',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              padding: '6px 10px',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#f0f0ff'
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#8888aa'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

        {/* Stat groups */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {statGroups.map(group => (
            <div key={group.label}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.2em',
                  color: tierColor,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {group.label}
                </span>
                <div style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(90deg, ${tierColor}40, transparent)`,
                }} />
              </div>
              {group.stats.map(({ label, key, max }) => (
                <StatRow
                  key={key}
                  label={label}
                  value={robot[key]}
                  max={max}
                  color={tierColor}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
