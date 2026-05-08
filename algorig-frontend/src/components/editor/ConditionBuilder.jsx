import { useState, useEffect } from 'react'

const OPERATORS = ['<', '>', '<=', '>=', '==', '!=']

const VARIABLES = [
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber', 'lastMyAction', 'lastEnemyAction',
]

function parseCondition(str) {
  if (!str) return { left: '', op: '<', right: '' }
  for (const op of ['<=', '>=', '==', '!=', '<', '>']) {
    const idx = str.indexOf(op)
    if (idx !== -1) {
      return {
        left: str.slice(0, idx).trim(),
        op,
        right: str.slice(idx + op.length).trim(),
      }
    }
  }
  return { left: str.trim(), op: '<', right: '' }
}

function serializeCondition({ left, op, right }) {
  if (!left && !right) return ''
  return `${left} ${op} ${right}`.trim()
}

function Slot({ value, placeholder, onClick, isVariable, onClear }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 10px',
        borderRadius: 6,
        border: `1px solid ${isVariable ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.12)'}`,
        background: isVariable ? 'rgba(168,85,247,0.1)' : 'rgba(0,0,0,0.3)',
        color: isVariable ? '#c084fc' : value ? '#f0f0ff' : '#444466',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        cursor: 'pointer',
        minWidth: 80,
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isVariable
          ? 'rgba(168,85,247,0.4)'
          : 'rgba(255,255,255,0.12)'
      }}
    >
      {value
        ? <>
            {value}
            <span
              style={{ opacity: 0.5, fontSize: 10, marginLeft: 2 }}
              onClick={e => { e.stopPropagation(); onClear() }}
            >
              ▾
            </span>
          </>
        : <span style={{ opacity: 0.4 }}>{placeholder}</span>
      }
    </div>
  )
}

function VariablePicker({ onSelect, onClose, includeNumbers }) {
  const [numInput, setNumInput] = useState('')

  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 200,
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: 8,
        marginTop: 4,
        minWidth: 160,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {includeNumbers && (
        <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: '#555577', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            NUMBER
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={numInput}
              onChange={e => setNumInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '4px 8px',
                color: '#f0f0ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                outline: 'none',
                width: 80,
              }}
            />
            <button
              onClick={() => numInput && onSelect(numInput)}
              style={{
                padding: '4px 10px',
                background: 'rgba(249,115,22,0.15)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 6,
                color: '#f97316',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Set
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: '#555577', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
        VARIABLES
      </div>
      {VARIABLES.map(v => (
        <div
          key={v}
          onClick={() => onSelect(v)}
          style={{
            padding: '7px 10px',
            borderRadius: 6,
            color: '#c084fc',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {v}
        </div>
      ))}
    </div>
  )
}

function OperatorPicker({ current, onSelect, onClose }) {
  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: 6,
        marginTop: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {OPERATORS.map(op => (
        <div
          key={op}
          onClick={() => onSelect(op)}
          style={{
            padding: '7px 16px',
            borderRadius: 6,
            color: op === current ? '#f97316' : '#f0f0ff',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            background: op === current ? 'rgba(249,115,22,0.1)' : 'transparent',
            textAlign: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => {
            if (op !== current) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          }}
          onMouseLeave={e => {
            if (op !== current) e.currentTarget.style.background = 'transparent'
          }}
        >
          {op}
        </div>
      ))}
    </div>
  )
}

export default function ConditionBuilder({ condition, onChange }) {
  const [parsed, setParsed] = useState(() => parseCondition(condition))
  const [showLeftPicker, setShowLeftPicker] = useState(false)
  const [showRightPicker, setShowRightPicker] = useState(false)
  const [showOpPicker, setShowOpPicker] = useState(false)

  const update = (patch) => {
    const next = { ...parsed, ...patch }
    setParsed(next)
    onChange(serializeCondition(next))
  }

  const isVariable = (val) => VARIABLES.includes(val)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>

      {/* Left slot */}
      <div style={{ position: 'relative' }}>
        <Slot
          value={parsed.left}
          placeholder="variable"
          onClick={() => { setShowLeftPicker(p => !p); setShowRightPicker(false); setShowOpPicker(false) }}
          isVariable={isVariable(parsed.left)}
          onClear={() => update({ left: '' })}
        />
        {showLeftPicker && (
          <VariablePicker
            onSelect={val => { update({ left: val }); setShowLeftPicker(false) }}
            onClose={() => setShowLeftPicker(false)}
            includeNumbers={false}
          />
        )}
      </div>

      {/* Operator slot */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => { setShowOpPicker(p => !p); setShowLeftPicker(false); setShowRightPicker(false) }}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(245,158,11,0.4)',
            background: 'rgba(245,158,11,0.08)',
            color: '#f59e0b',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            minWidth: 48,
            textAlign: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
        >
          {parsed.op}
        </div>
        {showOpPicker && (
          <OperatorPicker
            current={parsed.op}
            onSelect={op => { update({ op }); setShowOpPicker(false) }}
            onClose={() => setShowOpPicker(false)}
          />
        )}
      </div>

      {/* Right slot */}
      <div style={{ position: 'relative' }}>
        <Slot
          value={parsed.right}
          placeholder="value"
          onClick={() => { setShowRightPicker(p => !p); setShowLeftPicker(false); setShowOpPicker(false) }}
          isVariable={isVariable(parsed.right)}
          onClear={() => update({ right: '' })}
        />
        {showRightPicker && (
          <VariablePicker
            onSelect={val => { update({ right: val }); setShowRightPicker(false) }}
            onClose={() => setShowRightPicker(false)}
            includeNumbers={true}
          />
        )}
      </div>

      {/* Clear button */}
      {(parsed.left || parsed.right) && (
        <button
          onClick={() => {
            const reset = { left: '', op: '<', right: '' }
            setParsed(reset)
            onChange('')
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#333355',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#333355'}
        >
          ✕
        </button>
      )}
    </div>
  )
}
