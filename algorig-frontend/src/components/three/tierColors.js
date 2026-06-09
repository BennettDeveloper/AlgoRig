const TIER_WIRE_COLORS = {
  TIER_1: { primary: '#a1a5b4', secondary: '#6b7280', glow: '#c8ccd8' },
  TIER_2: { primary: '#22c55e', secondary: '#166534', glow: '#4ade80' },
  TIER_3: { primary: '#3b82f6', secondary: '#1e40af', glow: '#60a5fa' },
  TIER_4: { primary: '#7c3aed', secondary: '#5b21b6', glow: '#a78bfa' },
  TIER_5: { primary: '#facc15', secondary: '#a16207', glow: '#fde047' },
}

export default TIER_WIRE_COLORS

export function getTierColors(tierKey) {
  return TIER_WIRE_COLORS[tierKey] || TIER_WIRE_COLORS['TIER_1']
}
