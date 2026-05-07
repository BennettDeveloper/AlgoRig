import { useState } from 'react'

const tierColors = {
  1: '#6b7280',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f97316',
}

const cardStats = [
  { icon: '❤️', label: 'HP',  key: 'systemIntegrity', max: 200 },
  { icon: '⚔️', label: 'ATK', key: 'coreImpact',       max: 70  },
  { icon: '🛡️', label: 'DEF', key: 'chassisArmor',     max: 70  },
  { icon: '⚡', label: 'SPD', key: 'clockSpeed',        max: 80  },
  { icon: '🔋', label: 'BAT', key: 'battery',           max: 100 },
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

export default function RobotCard({ robot, onClick }) {
  const [hovered, setHovered] = useState(false)
  const tierColor = tierColors[robot.tier] || '#6b7280'
  const spec = getSpecialization(robot)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: `1px solid ${hovered ? `${tierColor}40` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 4px 24px ${tierColor}15` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div style={{
          fontSize: 32,
          lineHeight: 1,
          filter: `drop-shadow(0 0 10px ${tierColor}80)`,
          flexShrink: 0,
        }}>
          🤖
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#f0f0ff',
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {robot.name}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
              background: `${tierColor}20`,
              border: `1px solid ${tierColor}50`,
              borderRadius: 4,
              padding: '2px 7px',
              color: tierColor,
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}>
              TIER {robot.tier}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '2px 7px',
              color: '#8888aa',
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em',
            }}>
              {spec}
            </span>
          </div>
        </div>
      </div>

      {/* Stat columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {cardStats.map(({ icon, label, key, max }) => (
          <div key={key}>
            <div style={{
              fontSize: 10,
              color: '#444466',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: 3,
              whiteSpace: 'nowrap',
            }}>
              {icon} {label}
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#f0f0ff',
              marginBottom: 5,
            }}>
              {robot[key] ?? '—'}
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${Math.min(((robot[key] ?? 0) / max) * 100, 100)}%`,
                background: tierColor,
                borderRadius: 2,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
