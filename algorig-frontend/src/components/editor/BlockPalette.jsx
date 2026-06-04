import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTooltip } from './TooltipContext'
import { BLOCK_TOOLTIPS, VARIABLE_DESCRIPTIONS } from './blockTooltips'

const BATTLE_VARIABLES = [
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber',
]

// Actions grouped by sub-type
const ACTION_GROUPS = [
  {
    label: 'Physical',
    blocks: [
      { type: 'action', action: 'HardStrike',  label: 'Hard Strike',  color: '#f97316' },
      { type: 'action', action: 'HeavyAttack', label: 'Heavy Attack', color: '#f97316' },
    ],
  },
  {
    label: 'Software',
    blocks: [
      { type: 'action', action: 'PowerSurge',  label: 'Power Surge',  color: '#a855f7' },
      { type: 'action', action: 'VirusUpload', label: 'Virus Upload', color: '#a855f7' },
    ],
  },
  {
    label: 'Support',
    blocks: [
      { type: 'action', action: 'Patch',               label: 'Patch',                color: '#22c55e' },
      { type: 'action', action: 'BatteryEqualization', label: 'Battery Equalization', color: '#22d3ee' },
    ],
  },
  {
    label: 'Defense',
    blocks: [
      { type: 'action', action: 'Firewall',    label: 'Firewall',     color: '#3b82f6' },
      { type: 'action', action: 'ArmorPlate',  label: 'Armor Plate',  color: '#3b82f6' },
    ],
  },
  {
    label: 'Special',
    blocks: [
      { type: 'action', action: 'StackOverflow', label: 'Stack Overflow', color: '#d946ef', badge: '2-TURN' },
      { type: 'action', action: 'SystemScan',    label: 'System Scan',    color: '#8888aa' },
      { type: 'action', action: 'CpuStall',      label: 'CPU Stall',      color: '#444466' },
    ],
  },
]

const CONTROL_BLOCKS = [
  { type: 'if',     label: 'IF block',       color: '#f59e0b' },
  { type: 'ifelse', label: 'IF / ELSE block', color: '#f59e0b' },
  { type: 'repeat', label: 'REPEAT block',    color: '#f59e0b' },
]

const MEMORY_BLOCKS = [
  { type: 'set',    label: 'SET variable',    color: '#22d3ee', variableName: '', expression: '0' },
  { type: 'update', label: 'UPDATE variable', color: '#22d3ee', variableName: '', operator: '+=', expression: '1' },
]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '249, 115, 22'
}

function SectionHeader({ icon, label, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
      color,
      fontSize: 10,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function SubGroupLabel({ label, color }) {
  return (
    <div style={{
      fontSize: 9,
      color,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginTop: 10,
      marginBottom: 4,
      opacity: 0.7,
      paddingLeft: 2,
    }}>
      {label}
    </div>
  )
}

function DraggablePaletteBlock({ item, onAddBlock }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.action || item.type}`,
    data: {
      type: item.type,
      action: item.action,
      label: item.label,
      color: item.color,
    },
  })
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip()

  const color = item.color || '#8888aa'
  const rgb = hexToRgb(color)
  const tooltipKey = item.action || item.label

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onAddBlock(item)}
      style={{
        padding: '9px 14px',
        marginBottom: 5,
        background: `rgba(${rgb}, 0.1)`,
        border: `1px solid rgba(${rgb}, 0.25)`,
        borderRadius: 8,
        color,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.15s ease',
        userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
      onMouseEnter={e => {
        if (!isDragging) e.currentTarget.style.background = `rgba(${rgb}, 0.2)`
        const tooltipData = BLOCK_TOOLTIPS[tooltipKey]
        if (tooltipData) showTooltip(e, tooltipData)
      }}
      onMouseMove={moveTooltip}
      onMouseLeave={e => {
        e.currentTarget.style.background = `rgba(${rgb}, 0.1)`
        hideTooltip()
      }}
    >
      <span>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em',
          background: `rgba(${rgb}, 0.25)`, color, border: `1px solid rgba(${rgb}, 0.4)`,
        }}>
          {item.badge}
        </span>
      )}
    </div>
  )
}

function VariableChip({ label, color = '#8888aa', varColor }) {
  const [copied, setCopied] = useState(false)
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip()
  const varInfo = VARIABLE_DESCRIPTIONS[label]
  const chipColor = varColor || color
  const rgb = hexToRgb(chipColor)

  function handleClick() {
    navigator.clipboard.writeText(label).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: 5, marginBottom: 5 }}>
      <button
        onClick={handleClick}
        onMouseEnter={e => {
          e.currentTarget.style.background = `rgba(${rgb}, 0.18)`
          if (varInfo) showTooltip(e, {
            label,
            icon: '📊',
            category: 'BATTLE VARIABLE',
            color: chipColor,
            description: varInfo.description,
            tip: `Range: ${varInfo.range}. Click to copy.`,
          })
        }}
        onMouseMove={moveTooltip}
        onMouseLeave={e => {
          e.currentTarget.style.background = `rgba(${rgb}, 0.08)`
          hideTooltip()
        }}
        style={{
          background: `rgba(${rgb}, 0.08)`,
          border: `1px solid rgba(${rgb}, 0.2)`,
          borderRadius: 6,
          padding: '3px 8px',
          color: chipColor,
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {label}
      </button>
      {copied && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#161625',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          padding: '3px 8px',
          fontSize: 11,
          color: '#22c55e',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 200,
        }}>
          Copied!
        </div>
      )}
    </div>
  )
}

function UserVarChip({ name }) {
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip()
  const [copied, setCopied] = useState(false)

  function handleClick() {
    navigator.clipboard.writeText(name).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={e => showTooltip(e, {
        label: name,
        icon: '💾',
        category: 'MY VARIABLE',
        color: '#22d3ee',
        description: `User-defined variable. Click to copy "${name}" to clipboard, then paste it into a SET expression or IF condition.`,
        tip: 'Created with a SET block. Updates each time SET runs.',
      })}
      onMouseMove={moveTooltip}
      onMouseLeave={hideTooltip}
      style={{
        padding: '4px 10px',
        marginRight: 5,
        marginBottom: 5,
        borderRadius: 6,
        background: copied ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.08)',
        border: `1px solid ${copied ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.2)'}`,
        color: copied ? '#f0f0ff' : '#67e8f9',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {copied ? '✓' : '💾'} {name}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' }} />
}

export default function BlockPalette({ onAddBlock, userVars = [] }) {
  return (
    <div style={{
      width: 220,
      minWidth: 220,
      background: 'rgba(0,0,0,0.3)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: 16,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── ACTIONS ── */}
      <SectionHeader icon="⚔️" label="Actions" color="#f97316" />
      {ACTION_GROUPS.map(group => (
        <div key={group.label}>
          <SubGroupLabel label={group.label} color={group.blocks[0].color} />
          {group.blocks.map(b => (
            <DraggablePaletteBlock key={b.action} item={b} onAddBlock={onAddBlock} />
          ))}
        </div>
      ))}

      <Divider />

      {/* ── CONTROL ── */}
      <SectionHeader icon="⚙️" label="Control" color="#f59e0b" />
      {CONTROL_BLOCKS.map(b => (
        <DraggablePaletteBlock key={b.type} item={b} onAddBlock={onAddBlock} />
      ))}

      <Divider />

      {/* ── MEMORY ── */}
      <SectionHeader icon="💾" label="Memory" color="#22d3ee" />
      {MEMORY_BLOCKS.map(b => (
        <DraggablePaletteBlock key={b.type} item={b} onAddBlock={onAddBlock} />
      ))}

      <Divider />

      {/* ── VARIABLES ── */}
      <SectionHeader icon="📊" label="Variables" color="#a855f7" />
      <div style={{
        fontSize: 10,
        color: '#333355',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 10,
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}>
        Use in IF conditions and SET/UPDATE expressions.
      </div>

      {userVars.length > 0 && (
        <>
          <div style={{
            fontSize: 9,
            color: '#22d3ee',
            letterSpacing: '0.15em',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: 6,
            opacity: 0.7,
            textTransform: 'uppercase',
          }}>
            My Variables
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
            {userVars.map(v => <UserVarChip key={v} name={v} />)}
          </div>
          <div style={{ height: 1, background: 'rgba(168,85,247,0.1)', marginBottom: 10 }} />
        </>
      )}

      <div style={{
        fontSize: 9,
        color: '#a855f7',
        letterSpacing: '0.15em',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 6,
        opacity: 0.7,
        textTransform: 'uppercase',
      }}>
        Battle Variables
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {BATTLE_VARIABLES.map(v => (
          <VariableChip key={v} label={v} varColor="#a855f7" />
        ))}
      </div>

    </div>
  )
}
