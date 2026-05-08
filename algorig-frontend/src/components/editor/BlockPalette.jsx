import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTooltip } from './TooltipContext'
import { BLOCK_TOOLTIPS } from './blockTooltips'

const palette = [
  {
    category: 'ACTIONS',
    color: '#f97316',
    icon: '⚔️',
    blocks: [
      { type: 'action', action: 'HardStrike', label: 'Hard Strike', color: '#f97316' },
      { type: 'action', action: 'HeavyAttack', label: 'Heavy Attack', color: '#f97316' },
      { type: 'action', action: 'PowerSurge', label: 'Power Surge', color: '#a855f7' },
      { type: 'action', action: 'Patch', label: 'Patch', color: '#22c55e' },
      { type: 'action', action: 'Firewall', label: 'Firewall', color: '#3b82f6' },
      { type: 'action', action: 'ArmorPlate', label: 'Armor Plate', color: '#3b82f6' },
      { type: 'action', action: 'VirusUpload', label: 'Virus Upload', color: '#a855f7' },
      { type: 'action', action: 'SystemScan', label: 'System Scan', color: '#8888aa' },
      { type: 'action', action: 'CpuStall', label: 'CPU Stall', color: '#444466' },
    ]
  },
  {
    category: 'CONTROL',
    color: '#f59e0b',
    icon: '🔀',
    blocks: [
      { type: 'if', label: 'IF block', color: '#f59e0b' },
      { type: 'ifelse', label: 'IF / ELSE block', color: '#f59e0b' },
    ]
  },
  {
    category: 'VARIABLES',
    color: '#8888aa',
    icon: '📊',
    blocks: [
      { type: 'variable', label: 'myHP' },
      { type: 'variable', label: 'enemyHP' },
      { type: 'variable', label: 'myBattery' },
      { type: 'variable', label: 'enemyBattery' },
      { type: 'variable', label: 'myArmor' },
      { type: 'variable', label: 'enemyArmor' },
      { type: 'variable', label: 'myFirewall' },
      { type: 'variable', label: 'enemyFirewall' },
      { type: 'variable', label: 'turnNumber' },
    ]
  }
]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '249, 115, 22'
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
        marginBottom: 6,
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
      {item.label}
    </div>
  )
}

function VariableChip({ label }) {
  const [tooltip, setTooltip] = useState(false)

  const handleClick = () => {
    navigator.clipboard.writeText(label)
    setTooltip(true)
    setTimeout(() => setTooltip(false), 1200)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: 6, marginBottom: 6 }}>
      <button
        onClick={handleClick}
        style={{
          background: 'rgba(136,136,170,0.08)',
          border: '1px solid rgba(136,136,170,0.15)',
          borderRadius: 6,
          padding: '3px 8px',
          color: '#8888aa',
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(136,136,170,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(136,136,170,0.08)'}
      >
        {label}
      </button>
      {tooltip && (
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
        }}>
          Copied!
        </div>
      )}
    </div>
  )
}

export default function BlockPalette({ onAddBlock }) {
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
      gap: 20,
    }}>
      {palette.map(group => (
        <div key={group.category}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            color: group.color,
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            <span>{group.icon}</span>
            <span>{group.category}</span>
          </div>

          {group.category === 'VARIABLES' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {group.blocks.map(b => (
                <VariableChip key={b.label} label={b.label} />
              ))}
            </div>
          ) : (
            group.blocks.map(b => (
              <DraggablePaletteBlock
                key={b.action || b.type}
                item={b}
                onAddBlock={onAddBlock}
              />
            ))
          )}
        </div>
      ))}
    </div>
  )
}
