import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { getMyRobots, getPublicRobots } from '../api/customRobotApi'
import RobotCard from '../components/robots/RobotCard'
import RobotDetailModal from '../components/robots/RobotDetailModal'
import { useAuth } from '../context/AuthContext'
import { TIER_COLORS, tierNumToKey, getPassiveName } from '../constants/robotConstants'

function normalizeCustomRobot(cr) {
  const tierNum = parseInt(cr.tier.replace('TIER_', ''), 10)
  return {
    ...cr,
    tier: tierNum,
    systemIntegrity: cr.hp,
    passiveAbility: cr.passiveAbility,
    passiveDisplayName: getPassiveName(cr.passiveAbility),
    isCustom: true,
    _tierKey: cr.tier,
    partsConfig: cr.partsConfig,
  }
}

export default function RobotBrowser() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [robots, setRobots]                   = useState([])
  const [myRobots, setMyRobots]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [myRobotsLoading, setMyRobotsLoading] = useState(false)
  const [showMyRobots, setShowMyRobots]       = useState(false)
  const [selectedTier, setSelectedTier]       = useState(0)
  const [selectedRobot, setSelectedRobot]     = useState(null)
  const [sortBy, setSortBy]                   = useState('tier')

  // Fetch preset robots once on mount
  useEffect(() => {
    client.get('/robots').then(res => setRobots(res.data)).finally(() => setLoading(false))
  }, [])

  // Fetch custom robots on mount when authenticated (so they appear in All/tier tabs immediately)
// NEW:
useEffect(() => {
  getPublicRobots()
    .then(data => setMyRobots(data.map(normalizeCustomRobot)))
    .catch(() => {
      // fallback to own robots if public endpoint fails
      if (isAuthenticated) {
        getMyRobots()
          .then(data => setMyRobots(data.map(normalizeCustomRobot)))
          .catch(() => setMyRobots([]))
      }
    })
}, [isAuthenticated])

  // Refresh custom robots when switching to the My Robots tab
  useEffect(() => {
    if (!showMyRobots || !isAuthenticated) return
    setMyRobotsLoading(true)
    getMyRobots()
      .then(data => setMyRobots(data.map(normalizeCustomRobot)))
      .catch(() => setMyRobots([]))
      .finally(() => setMyRobotsLoading(false))
  }, [showMyRobots])

  // ── Derived counts for tab badges ─────────────────────────────────────────

  const customCountByTierNum = {}
  for (const cr of myRobots) {
    customCountByTierNum[cr.tier] = (customCountByTierNum[cr.tier] || 0) + 1
  }
  const totalCustom = myRobots.length

  function tabLabel(tier) {
    if (tier === 0) {
      return totalCustom > 0 ? `ALL (${totalCustom})` : 'ALL'
    }
    const count = customCountByTierNum[tier] || 0
    return count > 0 ? `TIER ${tier} (${count})` : `TIER ${tier}`
  }

  const myRobotsLabel = `MY ROBOTS (${totalCustom})`

  // ── Build displayRobots ───────────────────────────────────────────────────

  let displayRobots
  if (showMyRobots) {
    displayRobots = myRobots
  } else {
    const presetFiltered  = robots.filter(r => selectedTier === 0 || r.tier === selectedTier)
    const customFiltered  = myRobots.filter(r => selectedTier === 0 || r.tier === selectedTier)

    if (customFiltered.length === 0) {
      // No custom robots to merge — use existing sort dropdown behaviour
      displayRobots = [...presetFiltered].sort((a, b) => {
        if (sortBy === 'tier') return a.tier - b.tier
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'hp')   return b.systemIntegrity - a.systemIntegrity
        if (sortBy === 'speed') return b.clockSpeed - a.clockSpeed
        return 0
      })
    } else {
      // Merge presets + custom, sort by tier then name
      const combined = [...presetFiltered, ...customFiltered]
      if (selectedTier === 0) {
        displayRobots = combined.sort((a, b) =>
          a.tier !== b.tier ? a.tier - b.tier : a.name.localeCompare(b.name)
        )
      } else {
        // Same tier — sort alphabetically
        displayRobots = combined.sort((a, b) => a.name.localeCompare(b.name))
      }
    }
  }

  const displayCount = displayRobots.length

  // ── Loading skeleton ──────────────────────────────────────────────────────

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
                borderRadius: 14, padding: 20, height: 200,
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

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 28, fontWeight: 700, color: '#f97316',
            letterSpacing: '0.15em',
            textShadow: '0 0 30px rgba(249,115,22,0.4)',
            marginBottom: 4,
          }}>
            ROBOT BROWSER
          </div>
          <div style={{ fontSize: 13, color: '#555577' }}>
            {showMyRobots
              ? `${displayCount} custom robot${displayCount !== 1 ? 's' : ''}`
              : `${displayCount} robot${displayCount !== 1 ? 's' : ''} available`}
          </div>
        </div>

        {showMyRobots ? (
          /* Build New Robot button — only shown on My Robots tab */
          <button
            onClick={() => navigate('/robot-builder')}
            style={{
              padding: '8px 18px',
              background: 'transparent',
              border: '1px solid #f97316',
              borderRadius: 8,
              color: '#f97316',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f97316'
              e.currentTarget.style.color = '#000'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#f97316'
            }}
          >
            + Build New Robot
          </button>
        ) : (
          /* Sort dropdown — shown in preset / combined tabs */
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, color: '#444466',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
            }}>
              SORT BY
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '7px 12px',
                color: '#d0d0e8', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="tier"  style={{ background: '#0f0f1a' }}>Tier</option>
              <option value="name"  style={{ background: '#0f0f1a' }}>Name</option>
              <option value="hp"    style={{ background: '#0f0f1a' }}>HP</option>
              <option value="speed" style={{ background: '#0f0f1a' }}>Speed</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Filter / tab bar ─────────────────────────────────────────────── */}
      <div data-tour="tier-filter" style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map(tier => {
          const active = !showMyRobots && selectedTier === tier
          return (
            <button
              key={tier}
              onClick={() => { setShowMyRobots(false); setSelectedTier(tier) }}
              style={{
                padding: '7px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.15s',
                background: active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#f97316' : '#8888aa',
              }}
            >
              {tabLabel(tier)}
            </button>
          )
        })}

        {/* My Robots tab — visible only when authenticated */}
        {isAuthenticated && (
          <button
            onClick={() => setShowMyRobots(true)}
            style={{
              padding: '7px 16px', borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
              cursor: 'pointer', transition: 'all 0.15s',
              background: showMyRobots ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
              border: showMyRobots ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: showMyRobots ? '#f97316' : '#8888aa',
            }}
          >
            {myRobotsLabel}
          </button>
        )}
      </div>

      {/* ── Robot grid ───────────────────────────────────────────────────── */}
      {showMyRobots && myRobotsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, height: 200,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : displayRobots.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          color: '#333355', fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
        }}>
          {showMyRobots
            ? <>No custom robots yet.{' '}
                <button
                  onClick={() => navigate('/robot-builder')}
                  style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, padding: 0 }}
                >
                  Build your first one →
                </button>
              </>
            : 'No robots found for this tier.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {displayRobots.map((robot, index) => {
            const isFirst  = index === 0
            const robotKey = robot.isCustom ? `custom-${robot.id}` : `preset-${robot.id}`
            const tierKey  = robot.isCustom ? robot._tierKey : tierNumToKey(robot.tier)
            const tc       = TIER_COLORS[tierKey] || '#6b7280'

            const cardEl = (
              <RobotCard
                robot={robot}
                onClick={() => setSelectedRobot(robot)}
              />
            )

            if (robot.isCustom) {
              return (
                <div
                  key={robotKey}
                  style={{ position: 'relative' }}
                  {...(isFirst ? { 'data-tour': 'robot-card-first' } : {})}
                >
                  {cardEl}
                  {/* Custom badge overlay */}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: `${tc}33`,
                    border: `1px solid ${tc}`,
                    borderRadius: 12,
                    padding: '2px 8px',
                    color: tc,
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}>
                    CUSTOM
                  </div>
                </div>
              )
            }

            return isFirst ? (
              <div key={robotKey} data-tour="robot-card-first">
                {cardEl}
              </div>
            ) : (
              <RobotCard key={robotKey} robot={robot} onClick={() => setSelectedRobot(robot)} />
            )
          })}
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
