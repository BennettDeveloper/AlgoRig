import { useState, useEffect } from 'react'
import { getRobots } from '../../api/robots'
import RobotCard from './RobotCard'

const TIERS = [0, 1, 2, 3, 4, 5]

const tierBtnStyle = (active) => ({
  padding: '5px 12px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: '0.06em',
  cursor: 'pointer',
  border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
  background: active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
  color: active ? '#f97316' : '#8888aa',
  transition: 'all 0.15s',
})

export default function RobotMultiSelectPicker({
  selectedRobotIds = [],
  onChange,
  maxSelections,
}) {
  const [robots, setRobots]       = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState(0)

  useEffect(() => {
    getRobots()
      .then(data => setRobots(data))
      .catch(() => setRobots([]))
      .finally(() => setIsLoading(false))
  }, [])

  function toggleRobot(robotId) {
    const isSelected = selectedRobotIds.includes(robotId)
    if (isSelected) {
      onChange(selectedRobotIds.filter(id => id !== robotId))
    } else {
      if (maxSelections != null && selectedRobotIds.length >= maxSelections) return
      onChange([...selectedRobotIds, robotId])
    }
  }

  const filteredRobots = tierFilter === 0
    ? robots
    : robots.filter(r => r.tier === tierFilter)

  const selectedCount = selectedRobotIds.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
      {/* Header: count + clear */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          color: selectedCount > 0 ? '#f97316' : '#555577',
        }}>
          {selectedCount} robot{selectedCount !== 1 ? 's' : ''} selected
        </span>
        {selectedCount > 0 && (
          <button
            onClick={() => onChange([])}
            style={{
              background: 'none', border: 'none',
              color: '#8888aa', fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              textDecoration: 'underline', padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#8888aa'}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TIERS.map(tier => (
          <button
            key={tier}
            onClick={() => setTierFilter(tier)}
            style={tierBtnStyle(tierFilter === tier)}
          >
            {tier === 0 ? 'All' : `Tier ${tier}`}
          </button>
        ))}
      </div>

      {/* Robot grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 180,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 14,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      ) : filteredRobots.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          color: '#444466', fontSize: 13,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          No robots at this tier.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filteredRobots.map(robot => (
            <RobotCard
              key={robot.id}
              robot={robot}
              onClick={() => toggleRobot(robot.id)}
              selected={selectedRobotIds.includes(robot.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
