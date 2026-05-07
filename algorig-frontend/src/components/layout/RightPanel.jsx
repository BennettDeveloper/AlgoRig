import { useState, useEffect, useRef } from 'react'

const tips = [
  {
    category: 'CODE BLOCKS',
    title: 'IF blocks check once',
    body: "When your robot enters an IF block, the condition is evaluated once on entry. It won't re-check mid-branch — plan accordingly!"
  },
  {
    category: 'CODE BLOCKS',
    title: 'Scripts loop automatically',
    body: 'When your robot reaches the last action in its script, it loops back to the top. Design your script as a repeating cycle.'
  },
  {
    category: 'ACTIONS',
    title: 'Battery management wins fights',
    body: 'Every action costs battery. If you run out, your robot CPU_STALLs and wastes a turn. Keep your wattage high to stay in the fight.'
  },
  {
    category: 'ACTIONS',
    title: 'HEAVY_ATTACK hits hard but costs more',
    body: 'HEAVY_ATTACK deals 1.5x physical damage but costs 30 battery. Save it for when you know the enemy is vulnerable.'
  },
  {
    category: 'ROBOTS',
    title: 'Clock Speed determines turn order',
    body: 'The robot with higher clockSpeed acts first each round. A speed advantage can be the difference between a kill and a near-miss.'
  },
  {
    category: 'ROBOTS',
    title: 'Wattage is underrated',
    body: 'High wattage means you regenerate battery fast. Robots with high wattage can spam expensive actions repeatedly.'
  },
  {
    category: 'STRATEGY',
    title: "Use PATCH before you're critical",
    body: "Don't wait until 0 HP to heal. Set your IF condition to trigger PATCH at 40-50% HP so you survive long enough to turn the fight."
  },
  {
    category: 'STRATEGY',
    title: 'VIRUS_UPLOAD weakens defenses',
    body: 'VIRUS_UPLOAD reduces enemy firewall over time. Stack it early so your POWER_SURGE hits harder in later turns.'
  },
]

const quickRef = [
  { label: 'Actions', value: '9 total' },
  { label: 'Variables', value: '13 available' },
  { label: 'Max Script Turns', value: '200' },
  { label: 'Min Actions', value: '3 required' },
  { label: 'Min IF Blocks', value: '1 required' },
]

function SectionHeader({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{
        fontSize: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.2em',
        color: '#f97316',
        textTransform: 'uppercase',
        fontWeight: '600',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(249,115,22,0.3), transparent)' }} />
    </div>
  )
}

export default function RightPanel() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState('left')
  const intervalRef = useRef(null)

  const resetInterval = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setDirection('left')
      setCurrent(c => (c + 1) % tips.length)
    }, 6000)
  }

  useEffect(() => {
    resetInterval()
    return () => clearInterval(intervalRef.current)
  }, [])

  const prev = () => {
    setDirection('right')
    setCurrent(c => (c - 1 + tips.length) % tips.length)
    resetInterval()
  }

  const next = () => {
    setDirection('left')
    setCurrent(c => (c + 1) % tips.length)
    resetInterval()
  }

  const goTo = (i) => {
    setDirection(i > current ? 'left' : 'right')
    setCurrent(i)
    resetInterval()
  }

  const tip = tips[current]
  const animClass = direction === 'left' ? 'animate-tip-left' : 'animate-tip-right'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 14px', width: '280px', minWidth: '280px', maxWidth: '280px' }}>

      {/* Tips & Tricks */}
      <div>
        <SectionHeader>Tips &amp; Tricks</SectionHeader>

        <div style={{
          background: 'rgba(15,15,26,0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '160px',
          position: 'relative',
        }}>
          {/* Orange accent bar at top */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #f97316, rgba(168,85,247,0.6), transparent)',
          }} />

          <div style={{ padding: '16px' }}>
            {/* Animated tip content */}
            <div key={`${current}-${direction}`} className={animClass}>
              {/* Category badge */}
              <div style={{
                display: 'inline-block',
                background: 'rgba(249,115,22,0.12)',
                border: '1px solid rgba(249,115,22,0.25)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#f97316',
                letterSpacing: '0.1em',
                marginBottom: '10px',
              }}>{tip.category}</div>

              <p style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#f0f0ff',
                marginBottom: '8px',
                lineHeight: '1.4',
              }}>{tip.title}</p>

              <p style={{
                fontSize: '12px',
                color: '#777799',
                lineHeight: '1.65',
                height: '60px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}>{tip.body}</p>
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
            }}>
              <button
                onClick={prev}
                aria-label="Previous tip"
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#f97316',
                  fontSize: '14px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >‹</button>

              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {tips.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Tip ${i + 1}`}
                    style={{
                      width: i === current ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: i === current ? '#f97316' : '#222240',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: i === current ? '0 0 6px rgba(249,115,22,0.5)' : 'none',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next tip"
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#f97316',
                  fontSize: '14px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >›</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div>
        <SectionHeader>Quick Reference</SectionHeader>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '14px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
        }}>
          {quickRef.map(({ label, value }, i) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: i === 0 ? 0 : '8px',
              marginTop: i === 0 ? 0 : '8px',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ color: '#555577' }}>{label}</span>
              <span style={{ color: '#f97316', fontWeight: '600' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
