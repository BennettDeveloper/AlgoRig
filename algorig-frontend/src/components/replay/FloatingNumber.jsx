export default function FloatingNumber({ value, type }) {
  const isHeal = type === 'heal'
  const isBattery = type === 'battery'
  const color = isHeal ? '#22c55e' : isBattery ? '#f59e0b' : '#ef4444'
  const mag = Math.abs(value)
  const fontSize = mag >= 30 ? 22 : mag >= 15 ? 17 : 13

  return (
    <div style={{
      whiteSpace: 'nowrap',
      textAlign: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize,
      fontWeight: 900,
      color,
      textShadow: `0 0 10px ${color}, 0 1px 3px rgba(0,0,0,0.8)`,
      letterSpacing: 1,
      pointerEvents: 'none',
      animation: `${isHeal ? 'healFloat' : 'damageFloat'} 1200ms ease-out forwards`,
    }}>
      {isHeal ? '+' : '-'}{mag}{isBattery ? ' BAT' : ' HP'}
    </div>
  )
}
