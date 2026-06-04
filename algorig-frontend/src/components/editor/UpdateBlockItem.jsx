import { useState } from 'react'

const BATTLE_VARIABLES = [
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber',
]

const OPERATORS = [
  { value: '+=', label: '+= (add)',       color: '#22c55e' },
  { value: '-=', label: '-= (subtract)',  color: '#ef4444' },
  { value: '*=', label: '*= (multiply)',  color: '#f97316' },
  { value: '/=', label: '/= (divide)',    color: '#3b82f6' },
  { value: '%=', label: '%= (remainder)', color: '#a855f7' },
]

function ModePills({ mode, onChange }) {
  return (
    <div style={{
      display: 'flex',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => onChange('number')}
        style={{
          padding: '5px 10px',
          background: mode === 'number' ? 'rgba(245,158,11,0.2)' : 'transparent',
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          color: mode === 'number' ? '#f59e0b' : '#444466',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: mode === 'number' ? 700 : 400,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          letterSpacing: '0.05em',
        }}
      >
        123
      </button>
      <button
        onClick={() => onChange('variable')}
        style={{
          padding: '5px 10px',
          background: mode === 'variable' ? 'rgba(168,85,247,0.2)' : 'transparent',
          border: 'none',
          color: mode === 'variable' ? '#c084fc' : '#444466',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: mode === 'variable' ? 700 : 400,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          letterSpacing: '0.05em',
        }}
      >
        x
      </button>
    </div>
  )
}

export default function UpdateBlockItem({ block, onDelete, onUpdate, dragHandleProps, userVars = [], parentColor }) {
  const [rightMode, setRightMode] = useState(
    BATTLE_VARIABLES.includes(block.expression) || userVars.includes(block.expression)
      ? 'variable'
      : 'number'
  )

  const currentOp = OPERATORS.find(o => o.value === (block.operator || '+=')) || OPERATORS[0]
  const cyan = '#22d3ee'
  const isUninitialized = block.variableName && block.variableName.length > 0 && !userVars.includes(block.variableName)

  function handleModeChange(newMode) {
    setRightMode(newMode)
    onUpdate(block.id, { expression: newMode === 'variable' ? 'myHP' : '1' })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: isUninitialized ? 'rgba(239,68,68,0.06)' : 'rgba(34,211,238,0.06)',
      border: `1px solid ${isUninitialized ? 'rgba(239,68,68,0.25)' : 'rgba(34,211,238,0.2)'}`,
      borderLeft: `4px solid ${isUninitialized ? '#ef4444' : (parentColor || '#22d3ee')}`,
      borderRadius: 10,
      flexWrap: 'wrap',
      position: 'relative',
    }}>
      <span style={{ cursor: 'grab', color: '#444466', fontSize: 16, userSelect: 'none' }}
        {...dragHandleProps}>⠿</span>

      <span style={{
        color: isUninitialized ? '#ef4444' : cyan,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.05em',
        minWidth: 52,
      }}>
        UPDATE
      </span>

      <select
        value={block.variableName || ''}
        onChange={e => onUpdate(block.id, { variableName: e.target.value })}
        style={{
          background: '#0f0f1a',
          border: `1px solid ${isUninitialized ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.3)'}`,
          borderRadius: 6,
          padding: '5px 10px',
          color: isUninitialized ? '#fca5a5' : '#67e8f9',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          width: 140,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {userVars.length === 0 ? (
          <option value="" style={{ background: '#0f0f1a', color: '#555577' }}>-- add a SET block first --</option>
        ) : (
          <>
            <option value="" style={{ background: '#0f0f1a', color: '#555577' }}>-- pick variable --</option>
            {userVars.map(v => (
              <option key={v} value={v} style={{ background: '#0f0f1a', color: '#67e8f9' }}>{v}</option>
            ))}
          </>
        )}
      </select>

      <select
        value={block.operator || '+='}
        onChange={e => onUpdate(block.id, { operator: e.target.value })}
        style={{
          background: '#0f0f1a',
          border: `1px solid ${currentOp.color}40`,
          borderRadius: 6,
          padding: '5px 10px',
          color: currentOp.color,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          fontWeight: 700,
          width: 140,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {OPERATORS.map(op => (
          <option key={op.value} value={op.value} style={{ background: '#0f0f1a' }}>
            {op.label}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {rightMode === 'number' ? (
          <input
            type="number"
            value={block.expression || '1'}
            onChange={e => onUpdate(block.id, { expression: e.target.value })}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#f0f0ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              width: 80,
              outline: 'none',
            }}
          />
        ) : (
          <select
            value={block.expression || 'myHP'}
            onChange={e => onUpdate(block.id, { expression: e.target.value })}
            style={{
              background: '#0f0f1a',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#c084fc',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              width: 130,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {userVars.length > 0 && (
              <optgroup label="MY VARIABLES">
                {userVars.map(v => (
                  <option key={v} value={v} style={{ background: '#0f0f1a', color: '#67e8f9' }}>{v}</option>
                ))}
              </optgroup>
            )}
            <optgroup label="BATTLE VARIABLES">
              {BATTLE_VARIABLES.map(v => (
                <option key={v} value={v} style={{ background: '#0f0f1a' }}>{v}</option>
              ))}
            </optgroup>
          </select>
        )}

        <ModePills mode={rightMode} onChange={handleModeChange} />
      </div>

      {isUninitialized && block.variableName && (
        <div style={{
          width: '100%',
          marginTop: 6,
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6,
          fontSize: 11,
          color: '#fca5a5',
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.6,
        }}>
          ⚠ <strong>Variable not initialized.</strong><br />
          You need to SET <span style={{ color: '#67e8f9' }}>'{block.variableName}'</span> before you can UPDATE it.<br />
          <span style={{ color: '#555577' }}>Add: SET {block.variableName} = 0 above this block.</span>
        </div>
      )}

      <button
        onClick={() => onDelete(block.id)}
        style={{
          background: 'none', border: 'none', color: '#444466',
          cursor: 'pointer', fontSize: 14, marginLeft: 'auto',
          padding: '0 4px', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff4455'}
        onMouseLeave={e => e.currentTarget.style.color = '#444466'}
      >
        ✕
      </button>
    </div>
  )
}
