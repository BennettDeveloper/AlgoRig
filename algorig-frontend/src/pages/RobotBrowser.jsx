import { useState, useEffect } from 'react'
import client from '../api/client'
import RobotCard from '../components/robots/RobotCard'
import RobotDetailModal from '../components/robots/RobotDetailModal'

export default function RobotBrowser() {
  const [robots, setRobots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState(0)
  const [selectedRobot, setSelectedRobot] = useState(null)
  const [sortBy, setSortBy] = useState('tier')

  useEffect(() => {
    client.get('/robots').then(res => setRobots(res.data)).finally(() => setLoading(false))
  }, [])

  const filtered = robots
    .filter(r => selectedTier === 0 || r.tier === selectedTier)
    .sort((a, b) => {
      if (sortBy === 'tier') return a.tier - b.tier
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'hp') return b.systemIntegrity - a.systemIntegrity
      if (sortBy === 'speed') return b.clockSpeed - a.clockSpeed
      return 0
    })

  if (loading) {
    return (
      <div style={{ padding: '32px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 280, height: 36,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8, marginBottom: 8,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: 160, height: 20,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: 20,
                height: 200,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 28,
            fontWeight: 700,
            color: '#f97316',
            letterSpacing: '0.15em',
            textShadow: '0 0 30px rgba(249,115,22,0.4)',
            marginBottom: 4,
          }}>
            ROBOT BROWSER
          </div>
          <div style={{ fontSize: 13, color: '#555577' }}>
            {filtered.length} robot{filtered.length !== 1 ? 's' : ''} available
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            color: '#444466',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.1em',
          }}>
            SORT BY
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '7px 12px',
              color: '#d0d0e8',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="tier"  style={{ background: '#0f0f1a' }}>Tier</option>
            <option value="name"  style={{ background: '#0f0f1a' }}>Name</option>
            <option value="hp"    style={{ background: '#0f0f1a' }}>HP</option>
            <option value="speed" style={{ background: '#0f0f1a' }}>Speed</option>
          </select>
        </div>
      </div>

      {/* Tier filter bar */}
      <div data-tour="tier-filter" style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map(tier => {
          const active = selectedTier === tier
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#f97316' : '#8888aa',
              }}
            >
              {tier === 0 ? 'ALL' : `TIER ${tier}`}
            </button>
          )
        })}
      </div>

      {/* Robot grid */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          color: '#333355',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
        }}>
          No robots found for this tier.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {filtered.map((robot, index) => index === 0 ? (
            <div key={robot.id} data-tour="robot-card-first">
              <RobotCard robot={robot} onClick={() => setSelectedRobot(robot)} />
            </div>
          ) : (
            <RobotCard key={robot.id} robot={robot} onClick={() => setSelectedRobot(robot)} />
          ))}
        </div>
      )}

      {selectedRobot && (
        <RobotDetailModal
          robot={selectedRobot}
          onClose={() => setSelectedRobot(null)}
        />
      )}
    </div>
  )
}
