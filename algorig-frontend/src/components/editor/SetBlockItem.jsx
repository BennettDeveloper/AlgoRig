import { useState } from 'react'

const BATTLE_VARIABLES = [
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber',
]

const READ_ONLY_VARS = new Set([
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber', 'lastMyAction', 'lastEnemyAction',
])

const RESERVED_KEYWORDS = new Set([
  'IF', 'ELSE', 'END', 'REPEAT', 'SET', 'UPDATE',
  'AND', 'OR', 'NOT', 'TRUE', 'FALSE',
])

const MAX_VAR_NAME_LENGTH = 20

function validateVarName(name) {
  if (!name) return null
  if (/^\d/.test(name)) return 'Variable name cannot start with a number'
  if (name.startsWith('_')) return 'Variable name cannot start with underscore'
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return 'Only letters, numbers, and underscores allowed'
  if (name.length > MAX_VAR_NAME_LENGTH) return `Name too long (max ${MAX_VAR_NAME_LENGTH} characters)`
  if (READ_ONLY_VARS.has(name)) return `'${name}' is a read-only battle variable — choose a different name`
  if (RESERVED_KEYWORDS.has(name.toUpperCase())) return `'${name}' is a reserved keyword — choose a different name`
  return null
}

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

export default function SetBlockItem({ block, onDelete, onUpdate, dragHandleProps, userVars = [], parentColor }) {
  const [rightMode, setRightMode] = useState(() => {
    const allVars = [...BATTLE_VARIABLES, ...userVars]
    return allVars.includes(block.expression) ? 'variable' : 'number'
  })
  const [varNameError, setVarNameError] = useState(() => validateVarName(block.variableName))

  const cyan = '#22d3ee'

  function handleVarNameChange(e) {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').substring(0, MAX_VAR_NAME_LENGTH)
    onUpdate(block.id, { variableName: val })
    setVarNameError(validateVarName(val))
  }

  function handleModeChange(newMode) {
    setRightMode(newMode)
    onUpdate(block.id, { expression: newMode === 'variable' ? 'myHP' : '0' })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: 'rgba(34,211,238,0.06)',
      border: '1px solid rgba(34,211,238,0.2)',
      borderLeft: `4px solid ${parentColor || '#22d3ee'}`,
      borderRadius: 10,
      flexWrap: 'wrap',
      position: 'relative',
    }}>
      <span style={{ cursor: 'grab', color: '#444466', fontSize: 16, userSelect: 'none' }}
        {...dragHandleProps}>⠿</span>

      <span style={{
        color: cyan,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.05em',
        minWidth: 32,
      }}>
        SET
      </span>

      {/* Variable name input with validation */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <input
          value={block.variableName || ''}
          onChange={handleVarNameChange}
          placeholder="varName"
          maxLength={MAX_VAR_NAME_LENGTH}
          style={{
            background: varNameError ? 'rgba(239,68,68,0.08)' : 'rgba(34,211,238,0.08)',
            border: `1px solid ${varNameError ? 'rgba(239,68,68,0.4)' : 'rgba(34,211,238,0.3)'}`,
            borderRadius: 6,
            padding: '5px 10px',
            color: varNameError ? '#fca5a5' : cyan,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            width: 110,
            outline: 'none',
            transition: 'all 0.15s',
          }}
          onFocus={e => { if (!varNameError) e.target.style.borderColor = 'rgba(34,211,238,0.6)' }}
          onBlur={e => { if (!varNameError) e.target.style.borderColor = 'rgba(34,211,238,0.3)' }}
        />

        {(block.variableName?.length || 0) > 15 && (
          <div style={{
            position: 'absolute',
            right: 6,
            bottom: -16,
            fontSize: 9,
            color: (block.variableName?.length || 0) >= MAX_VAR_NAME_LENGTH ? '#ef4444' : '#555577',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {block.variableName?.length || 0}/{MAX_VAR_NAME_LENGTH}
          </div>
        )}

        {varNameError && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#1a0808',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: '#fca5a5',
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}>
            ⚠ {varNameError}
          </div>
        )}
      </div>

      <span style={{
        color: '#f59e0b',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        fontWeight: 700,
      }}>
        =
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {rightMode === 'number' ? (
          <input
            type="number"
            value={block.expression || '0'}
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
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
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
