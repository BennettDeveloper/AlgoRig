import { useEffect, useRef, useState } from 'react'

export default function FlashingStatBar({ label, value, max, colorOverride }) {
  const [flash, setFlash] = useState(null)
  const prevRef = useRef(value)
  const timerRef = useRef(null)

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = value
    if (prev == null || value == null || value === prev) return
    const type = value < prev ? 'damage' : 'heal'
    setFlash(type)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFlash(null), 400)
    return () => clearTimeout(timerRef.current)
  }, [value])

  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const color = colorOverride || (pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444')

  const barContainerAnim = flash === 'damage'
    ? { animation: 'hpFlashDamage 400ms ease-out forwards' }
    : flash === 'heal'
    ? { animation: 'hpFlashHeal 400ms ease-out forwards' }
    : {}

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: '#e0e0ff', fontFamily: 'JetBrains Mono, monospace' }}>
          {value}/{max}
        </span>
      </div>
      <div style={{ height: 8, background: '#1a1a2e', borderRadius: 4, overflow: 'hidden', ...barContainerAnim }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.4s ease, background 0.4s ease',
          boxShadow: `0 0 6px ${color}88`,
        }} />
      </div>
    </div>
  )
}
