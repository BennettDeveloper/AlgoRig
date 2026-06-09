import { useState, useRef, useEffect } from 'react'
import RobotScene from '../three/RobotScene'
import PickerRobotView from '../three/PickerRobotView'

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

// ── Passive ability data ──────────────────────────────────────────────────────

const PASSIVE_COLORS = {
  physical: '#f97316',
  software: '#a855f7',
  defense:  '#3b82f6',
  healing:  '#22c55e',
  utility:  '#22d3ee',
}

const PASSIVE_DATA = {
  QUICK_REFLEXES:      { type: 'utility',  icon: '⚡', shortDesc: '+10% battery regen efficiency',                             detail: 'Speeds up energy recovery each turn' },
  DEBUG_PROTOCOL:      { type: 'software', icon: '🔬', shortDesc: 'Software attacks cost 15% less battery',                    detail: 'Reduces ability costs for all software actions' },
  SELF_REPAIR:         { type: 'healing',  icon: '🩹', shortDesc: '+3 HP automatically every turn',                            detail: 'Constant self-healing without spending a turn' },
  IRON_WILL:           { type: 'defense',  icon: '🧱', shortDesc: 'Debuff duration reduced by 1 turn',                         detail: 'Less time affected by negative status effects' },
  RESILIENT_FRAME:     { type: 'defense',  icon: '🛡️', shortDesc: 'Reduce all damage taken by 5%',                            detail: 'Passive damage reduction on every hit received' },
  ADAPTIVE_COMBAT:     { type: 'physical', icon: '🎯', shortDesc: '+2% damage for each different action used',                  detail: 'Rewards varying your move selection each battle' },
  FORTIFIED_STRUCTURE: { type: 'defense',  icon: '🏰', shortDesc: 'Armor and firewall restore 15% more per action',            detail: 'Defense actions are significantly more effective' },
  VITAL_SYSTEMS:       { type: 'healing',  icon: '💊', shortDesc: 'Patch heals 20% more and removes 1 debuff',                 detail: 'Enhanced healing with built-in cleansing' },
  CASCADING_OVERFLOW:  { type: 'software', icon: '📈', shortDesc: '+5% software power each passing turn',                      detail: 'Software attacks get progressively stronger over time' },
  MOMENTUM:            { type: 'physical', icon: '💨', shortDesc: '+3% speed per physical attack (max +15%)',                   detail: 'Builds momentum with consecutive physical strikes' },
  UNBREAKABLE:         { type: 'defense',  icon: '💪', shortDesc: 'Gain 20% damage reduction after taking 40+ damage',         detail: 'Gets significantly tougher the harder it is hit' },
  COMBAT_RHYTHM:       { type: 'physical', icon: '🥊', shortDesc: '+8% damage when alternating physical and software',          detail: 'Rewards switching between attack types each turn' },
  PHASE_SHIFT:         { type: 'defense',  icon: '🌀', shortDesc: '+25% damage reduction for the first 3 turns',               detail: 'Strong early-game protection while getting into position' },
  PERMAFROST:          { type: 'utility',  icon: '❄️', shortDesc: "Enemy's next action costs +20% more battery",               detail: "Continuously drains the opponent's resources" },
  EMERGENCY_PROTOCOL:  { type: 'healing',  icon: '🚨', shortDesc: 'Healing boosted by 15% when below 30% HP',                  detail: 'Gets more resilient when on the edge of defeat' },
  OVERCHARGE:          { type: 'utility',  icon: '🔌', shortDesc: '+1 battery regen per 10% battery missing',                  detail: 'Recovers energy faster when running low' },
  INFECTION:           { type: 'software', icon: '🦠', shortDesc: 'Virus Upload applies double debuff duration',                detail: 'Infections last twice as long — brutal sustained pressure' },
  NETWORK_SHIELD:      { type: 'utility',  icon: '🔒', shortDesc: 'Block the first status effect applied each turn',           detail: 'Prevents one incoming debuff per turn automatically' },
  LETHAL_EDGE:         { type: 'physical', icon: '⚔️', shortDesc: '+15% physical damage, +30% vs targets below 30% HP',        detail: 'Executes weakened enemies with brutal efficiency' },
  SILENT_EXECUTION:    { type: 'software', icon: '🕵️', shortDesc: 'Software attacks bypass 20% of enemy firewall',             detail: 'Cuts through defenses that others cannot penetrate' },
  LIFE_PULSE:          { type: 'healing',  icon: '💓', shortDesc: 'Auto-restore 15% max HP every 3 turns',                     detail: 'Significant periodic healing without spending any turns' },
  TEMPEST:             { type: 'utility',  icon: '🌪️', shortDesc: '+1% damage per turn (stacks to +50%)',                      detail: 'Damage ramps up dramatically over a long battle' },
  REINFORCED:          { type: 'defense',  icon: '🔩', shortDesc: 'Reduce all damage by 10%, armor extends duration',          detail: 'Multiple stacking layers of protection per hit' },
  PERFECT_FORM:        { type: 'defense',  icon: '✨', shortDesc: '+10% resistance to all damage types',                       detail: 'Universal damage reduction against every attack type' },
  HYPERDRIVE:          { type: 'utility',  icon: '🚀', shortDesc: '+5% damage stacks each turn with no cap',                   detail: 'Damage accelerates without limit — snowballs hard' },
  ZERO_DAY:            { type: 'software', icon: '💣', shortDesc: 'First software hit ignores 50% firewall, Virus triple duration', detail: 'Opening exploit that tears open defenses on entry' },
  INFINITE_LOOP:       { type: 'utility',  icon: '♾️', shortDesc: '+50% battery regen, never stalls from low battery',         detail: 'Endless energy — this robot never runs out of power' },
  PHASE_OUT:           { type: 'utility',  icon: '👻', shortDesc: 'Automatically dodge the first attack each turn',            detail: 'Immune to one hit per turn — no action required' },
}

// ── Tooltip component ─────────────────────────────────────────────────────────

function PassiveTooltip({ passive, displayName, x, y }) {
  const data = PASSIVE_DATA[passive]
  if (!data) return null

  const color = PASSIVE_COLORS[data.type] || '#8888aa'
  const typeLabel = data.type.toUpperCase()

  const left = Math.min(x + 16, window.innerWidth - 300)
  const top  = Math.max(8, Math.min(y - 8, window.innerHeight - 200))

  return (
    <div style={{
      position: 'fixed',
      left, top,
      width: 280,
      zIndex: 1000,
      background: 'rgba(6,6,18,0.96)',
      border: `2px solid ${color}55`,
      borderRadius: 8,
      padding: '12px 16px',
      boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
      pointerEvents: 'none',
      fontFamily: 'JetBrains Mono, monospace',
      animation: 'tooltipFadeIn 0.15s ease-out',
    }}>
      <div style={{
        fontSize: 9, color: '#555577', letterSpacing: '0.2em',
        textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          background: `${color}18`, border: `1px solid ${color}35`,
          borderRadius: 3, padding: '1px 6px', color: color + 'cc',
          fontSize: 8, letterSpacing: '0.15em',
        }}>
          {typeLabel}
        </span>
        PASSIVE ABILITY
      </div>

      <div style={{
        fontSize: 16, fontWeight: 700, color: '#f0f0ff',
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
        textShadow: `0 0 16px ${color}50`,
      }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{data.icon}</span>
        <span style={{ color }}>{displayName}</span>
      </div>

      <div style={{ fontSize: 13, color: '#c0c0d8', lineHeight: 1.45, marginBottom: 8 }}>
        {data.shortDesc}
      </div>

      <div style={{
        fontSize: 11, color: '#666688', fontStyle: 'italic', lineHeight: 1.4,
        borderTop: `1px solid ${color}18`, paddingTop: 7,
      }}>
        {data.detail}
      </div>
    </div>
  )
}

// ── RobotCard ─────────────────────────────────────────────────────────────────

export default function RobotCard({ robot, onClick, disabled = false, selected = false, disabledReason = null, pickerMode = false }) {
  const [hovered, setHovered] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const timerRef = useRef(null)
  const tierColor = tierColors[robot.tier] || '#6b7280'
  const spec = getSpecialization(robot)
  const passiveKey   = robot.passiveAbility
  const passiveData  = passiveKey ? PASSIVE_DATA[passiveKey] : null
  const passiveColor = passiveData ? PASSIVE_COLORS[passiveData.type] : '#555577'

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // robot.tier is numeric (1–5) in both preset and normalised custom robots
  const sceneRobot = {
    name:             robot.name,
    tier:             `TIER_${robot.tier}`,
    hp:               robot.systemIntegrity || 100,
    coreImpact:       robot.coreImpact       || 0,
    exploitPower:     robot.exploitPower     || 0,
    clockSpeed:       robot.clockSpeed       || 0,
    chassisArmor:     robot.chassisArmor     || 0,
    firewallStrength: robot.firewallStrength  || 0,
    battery:          robot.battery          || 0,
    partsConfig:      robot.partsConfig      || null,
  }

  function handleMouseEnter(e) {
    setHovered(true)
    setMousePos({ x: e.clientX, y: e.clientY })
    if (passiveKey) {
      timerRef.current = setTimeout(() => setTooltipVisible(true), 220)
    }
  }

  function handleMouseMove(e) {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  function handleMouseLeave() {
    setHovered(false)
    clearTimeout(timerRef.current)
    setTooltipVisible(false)
  }

  return (
    <>
      <div
        onClick={disabled ? undefined : onClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        title={disabledReason || undefined}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: selected
            ? '2px solid #f97316'
            : `1px solid ${hovered ? `${tierColor}40` : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 14,
          padding: 20,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: selected
            ? `0 0 0 2px #f97316${hovered ? `, 0 4px 24px ${tierColor}15` : ''}`
            : (hovered ? `0 4px 24px ${tierColor}15` : 'none'),
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          opacity: disabled ? 0.35 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        {selected && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 16, height: 16, borderRadius: '50%',
            background: '#f97316',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            zIndex: 2,
          }}>
            ✓
          </div>
        )}

        {/* Robot 3D preview — full-bleed hero zone */}
        <div
          style={{
            margin: '-20px -20px 0 -20px',
            height: pickerMode ? 130 : 160,
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'rgba(0,0,0,0.25)',
            flexShrink: 0,
            ...(pickerMode && { display: 'flex', alignItems: 'center', justifyContent: 'center' }),
          }}
        >
          {pickerMode ? (
            <PickerRobotView
              robot={sceneRobot}
              width={120}
              height={130}
            />
          ) : (
            <RobotScene
              robot={sceneRobot}
              animationState="idle"
              side="left"
              width="100%"
              height={160}
              interactive={false}
            />
          )}
        </div>

        {/* Name + tier + spec row */}
        <div style={{ marginTop: 14, marginBottom: 18 }}>
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
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
            {robot.isCustom && (
              <span style={{
                background: 'rgba(249,115,22,0.15)',
                border: '1px solid rgba(249,115,22,0.4)',
                borderRadius: 4,
                padding: '2px 7px',
                color: '#f97316',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}>
                CUSTOM
              </span>
            )}
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

        {/* Stat columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
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

        {/* Passive indicator footer */}
        {passiveKey && robot.passiveDisplayName && (
          <div style={{
            borderTop: `1px solid ${hovered ? passiveColor + '28' : 'rgba(255,255,255,0.05)'}`,
            paddingTop: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'border-color 0.2s ease',
          }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>
              {passiveData?.icon || '⚡'}
            </span>
            <span style={{
              fontSize: 10,
              color: hovered ? passiveColor : '#444466',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              letterSpacing: '0.05em',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {robot.passiveDisplayName}
            </span>
            {hovered && (
              <span style={{
                marginLeft: 'auto', fontSize: 9,
                color: passiveColor + '88',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em', flexShrink: 0,
              }}>
                PASSIVE
              </span>
            )}
          </div>
        )}
      </div>

      {tooltipVisible && passiveKey && robot.passiveDisplayName && (
        <PassiveTooltip
          passive={passiveKey}
          displayName={robot.passiveDisplayName}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </>
  )
}
