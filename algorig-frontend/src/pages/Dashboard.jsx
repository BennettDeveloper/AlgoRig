import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

function SectionHeader({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{
        fontSize: '11px',
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

function StatCard({ value, label, stagger }) {
  return (
    <div
      className={`animate-fade-in-up stagger-${stagger}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #f97316, transparent)',
      }} />
      <div style={{
        fontSize: '36px',
        fontWeight: '800',
        color: '#f97316',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: '11px',
        color: '#555577',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop: '8px',
      }}>{label}</div>
    </div>
  )
}

const howItWorks = [
  { step: '1', title: 'WRITE',  description: "Script your robot's logic" },
  { step: '2', title: 'ASSIGN', description: 'Pick your robot chassis' },
  { step: '3', title: 'BATTLE', description: 'Watch your robot fight' },
]

export default function Dashboard() {
  const [battleCount, setBattleCount] = useState(null)
  const [robotCount, setRobotCount] = useState(null)

  useEffect(() => {
    client.get('/battles')
      .then(res => setBattleCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setBattleCount(0))

    client.get('/robots')
      .then(res => setRobotCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setRobotCount(0))
  }, [])

  const fmt = val => val === null ? '...' : val

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* Stats Row */}
      <section>
        <SectionHeader>Arena Stats</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard value={fmt(battleCount)} label="Total Battles" stagger={1} />
          <StatCard value={fmt(robotCount)}  label="Active Robots"  stagger={2} />
          <StatCard value="1"                label="Scripts Saved"  stagger={3} />
          <StatCard value="—"                label="Win Rate"        stagger={4} />
        </div>
      </section>

      {/* Recent Battles */}
      <section className="animate-fade-in-up stagger-2">
        <SectionHeader>Recent Battles</SectionHeader>
        <div style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '48px', lineHeight: 1, marginBottom: '4px' }}>⚔️</span>
          <p style={{ color: '#444466', fontSize: '14px' }}>No battles recorded yet.</p>
          <Link
            to="/battles/new"
            style={{
              display: 'inline-block',
              background: '#f97316',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              padding: '10px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              marginTop: '4px',
              boxShadow: '0 0 20px rgba(249,115,22,0.3)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fb923c'}
            onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
          >
            Start First Battle
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="animate-fade-in-up stagger-3">
        <SectionHeader>How It Works</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {howItWorks.map(({ step, title, description }) => (
            <div
              key={step}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '24px',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              <div style={{
                fontSize: '32px',
                fontWeight: '900',
                color: 'rgba(249,115,22,0.4)',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1,
              }}>{step}.</div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                color: '#f0f0ff',
                margin: '10px 0 6px',
              }}>{title}</div>
              <div style={{ fontSize: '13px', color: '#555577' }}>{description}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
