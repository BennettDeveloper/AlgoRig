import { useState, useEffect, useRef } from 'react'

export default function ArenaBackground({ currentEntry }) {
  const [flashColor, setFlashColor] = useState(null)
  const [flashKey, setFlashKey] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!currentEntry || currentEntry.entryType !== 'ACTION') return
    if (currentEntry.stalledDueToInsufficientBattery) return

    const isDefenderA = currentEntry.actor === 'B'
    let color = null
    if (['HARD_STRIKE', 'HEAVY_ATTACK'].includes(currentEntry.actionTaken)) {
      color = isDefenderA ? 'rgba(249,115,22,0.08)' : 'rgba(239,68,68,0.08)'
    } else if (currentEntry.actionTaken === 'POWER_SURGE') {
      color = 'rgba(168,85,247,0.08)'
    } else if (currentEntry.actionTaken === 'VIRUS_UPLOAD') {
      color = 'rgba(168,85,247,0.06)'
    } else if (currentEntry.actionTaken === 'PATCH') {
      color = 'rgba(34,197,94,0.06)'
    }

    if (!color) return
    setFlashColor(color)
    setFlashKey(k => k + 1)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFlashColor(null), 500)
    return () => clearTimeout(timerRef.current)
  }, [currentEntry])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>

      {/* Base background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, #0d1520 0%, #080810 60%, #050508 100%)',
      }} />

      {/* Perspective grid floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        backgroundImage: `
          linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        transform: 'perspective(400px) rotateX(55deg)',
        transformOrigin: 'bottom center',
        animation: 'gridScroll 8s linear infinite',
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 30%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 30%, black 100%)',
      }} />

      {/* Horizon glow line */}
      <div style={{
        position: 'absolute', bottom: '44%', left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), rgba(249,115,22,0.3), transparent)',
        boxShadow: '0 0 20px rgba(56,189,248,0.2), 0 0 40px rgba(249,115,22,0.1)',
      }} />

      {/* Robot A side glow (cyan) */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 200,
        background: 'radial-gradient(ellipse at left center, rgba(56,189,248,0.08) 0%, transparent 70%)',
      }} />

      {/* Robot B side glow (red) */}
      <div style={{
        position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 200,
        background: 'radial-gradient(ellipse at right center, rgba(239,68,68,0.08) 0%, transparent 70%)',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Damage flash */}
      {flashColor && (
        <div key={flashKey} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: flashColor,
          animation: 'flashFade 500ms ease-out forwards',
        }} />
      )}

      {/* Floating particles */}
      <FloatingParticles />
    </div>
  )
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 7.9) % 90}%`,
  top: `${10 + (i * 6.3) % 80}%`,
  size: 1 + (i % 3) * 0.7,
  duration: 4 + (i % 4) * 1.5,
  delay: (i * 0.4) % 4,
  color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#ef4444' : '#f97316',
}))

function FloatingParticles() {
  return (
    <>
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: '50%', background: p.color, opacity: 0.3,
          animation: `particleDrift ${p.duration}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </>
  )
}
