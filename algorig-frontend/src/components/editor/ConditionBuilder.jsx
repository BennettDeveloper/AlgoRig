import { useState, useEffect } from 'react'

const OPERATORS = ['<', '>', '<=', '>=', '==', '!=']

const VARIABLES = [
  'myHP', 'enemyHP', 'myBattery', 'enemyBattery',
  'myArmor', 'enemyArmor', 'myFirewall', 'enemyFirewall',
  'myHeat', 'enemyHeat', 'turnNumber', 'lastMyAction', 'lastEnemyAction',
]

const DEFAULT_CLAUSE = { not: false, left: '', op: '<', right: '' }

function parseCompoundCondition(str) {
  if (!str || !str.trim()) {
    return { clauses: [{ ...DEFAULT_CLAUSE }], connectors: [] }
  }

  // Split on AND/OR boundaries, preserving which connector was used
  const tokens = str.split(/\s+(AND|OR)\s+/)
  // tokens alternates: [expr, 'AND'|'OR', expr, 'AND'|'OR', expr, ...]

  const clauses = []
  const connectors = []

  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) {
      const trimmed = tokens[i].trim()
      let not = false
      let expr = trimmed

      if (trimmed.startsWith('NOT ')) {
        not = true
        expr = trimmed.substring(4).trim()
      }

      let parsed = { not, left: expr, op: '<', right: '' }
      for (const op of ['<=', '>=', '==', '!=', '<', '>']) {
        const idx = expr.indexOf(op)
        if (idx !== -1) {
          parsed = {
            not,
            left: expr.substring(0, idx).trim(),
            op,
            right: expr.substring(idx + op.length).trim(),
          }
          break
        }
      }
      clauses.push(parsed)
    } else {
      connectors.push(tokens[i]) // 'AND' or 'OR'
    }
  }

  return { clauses, connectors }
}

function serializeCompoundCondition({ clauses, connectors }) {
  const parts = clauses
    .filter(c => c.left)
    .map(c => {
      const expr = `${c.left} ${c.op} ${c.right}`.trim()
      return c.not ? `NOT ${expr}` : expr
    })

  if (parts.length === 0) return ''

  return parts.reduce((acc, part, i) => {
    if (i === 0) return part
    const conn = connectors[i - 1] || 'AND'
    return `${acc} ${conn} ${part}`
  }, '')
}

function SlotButton({ value, placeholder, isVariable, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${isVariable ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.12)'}`,
        background: isVariable ? 'rgba(168,85,247,0.1)' : 'rgba(0,0,0,0.3)',
        color: isVariable ? '#c084fc' : value ? '#f0f0ff' : '#444466',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        cursor: 'pointer',
        minWidth: 70,
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!isVariable) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
      }}
      onMouseLeave={e => {
        if (!isVariable) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
      }}
    >
      {value ? value : <span style={{ opacity: 0.4 }}>{placeholder}</span>}
      <span style={{ opacity: 0.4, fontSize: 10 }}>▾</span>
    </div>
  )
}

function OperatorButton({ op, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid rgba(245,158,11,0.4)',
        background: 'rgba(245,158,11,0.08)',
        color: '#f59e0b',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        minWidth: 44,
        textAlign: 'center',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
    >
      {op}
    </div>
  )
}

function VariablePicker({ onSelect, onClose, includeNumbers, userVars = [] }) {
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

      {userVars.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: '#22d3ee', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            MY VARIABLES
          </div>
          {userVars.map(v => (
            <div
              key={v}
              onClick={() => onSelect(v)}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                color: '#67e8f9',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {v}
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 6px' }} />
        </>
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

export default function ConditionBuilder({ condition, onChange, userVars = [] }) {
  const [state, setState] = useState(() => parseCompoundCondition(condition))
  const [openPicker, setOpenPicker] = useState(null)

  function updateClause(index, patch) {
    const next = {
      ...state,
      clauses: state.clauses.map((c, i) => i === index ? { ...c, ...patch } : c),
    }
    setState(next)
    onChange(serializeCompoundCondition(next))
  }

  function addClause() {
    const next = {
      clauses: [...state.clauses, { ...DEFAULT_CLAUSE }],
      connectors: [...state.connectors, 'AND'],
    }
    setState(next)
    onChange(serializeCompoundCondition(next))
  }

  function removeClause(index) {
    if (state.clauses.length <= 1) return
    const connIndex = index === 0 ? 0 : index - 1
    const next = {
      clauses: state.clauses.filter((_, i) => i !== index),
      connectors: state.connectors.filter((_, i) => i !== connIndex),
    }
    setState(next)
    onChange(serializeCompoundCondition(next))
  }

  function toggleConnector(connectorIndex) {
    const newConnectors = state.connectors.map((c, i) =>
      i === connectorIndex ? (c === 'AND' ? 'OR' : 'AND') : c
    )
    const next = { ...state, connectors: newConnectors }
    setState(next)
    onChange(serializeCompoundCondition(next))
  }

  function isOpen(clauseIndex, slot) {
    return openPicker?.clauseIndex === clauseIndex && openPicker?.slot === slot
  }

  function togglePicker(clauseIndex, slot) {
    setOpenPicker(isOpen(clauseIndex, slot) ? null : { clauseIndex, slot })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {state.clauses.map((clause, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Connector pill between clauses */}
          {i > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
              <button
                onClick={() => toggleConnector(i - 1)}
                style={{
                  padding: '3px 12px',
                  borderRadius: 12,
                  border: `1px solid ${state.connectors[i - 1] === 'AND' ? 'rgba(249,115,22,0.4)' : 'rgba(168,85,247,0.4)'}`,
                  background: state.connectors[i - 1] === 'AND' ? 'rgba(249,115,22,0.1)' : 'rgba(168,85,247,0.1)',
                  color: state.connectors[i - 1] === 'AND' ? '#f97316' : '#a855f7',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Click to toggle AND/OR"
              >
                {state.connectors[i - 1]}
              </button>
              <div style={{
                flex: 1,
                height: 1,
                background: state.connectors[i - 1] === 'AND' ? 'rgba(249,115,22,0.15)' : 'rgba(168,85,247,0.15)',
              }} />
            </div>
          )}

          {/* Clause row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

            {/* NOT toggle */}
            <button
              onClick={() => updateClause(i, { not: !clause.not })}
              style={clause.not ? {
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(239,68,68,0.5)',
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.05em',
                boxShadow: '0 0 8px rgba(239,68,68,0.2)',
              } : {
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'transparent',
                color: '#333355',
                fontSize: 10,
                fontWeight: 500,
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.05em',
                opacity: 0.5,
              }}
              title={clause.not ? 'NOT active — click to disable' : 'Click to add NOT'}
              onMouseEnter={e => {
                if (!clause.not) {
                  e.currentTarget.style.color = '#9ca3af'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.opacity = '1'
                }
              }}
              onMouseLeave={e => {
                if (!clause.not) {
                  e.currentTarget.style.color = '#333355'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.opacity = '0.5'
                }
              }}
            >
              NOT
            </button>

            {/* LEFT slot */}
            <div style={{ position: 'relative' }}>
              <SlotButton
                value={clause.left}
                placeholder="variable"
                isVariable={VARIABLES.includes(clause.left)}
                onClick={() => togglePicker(i, 'left')}
              />
              {isOpen(i, 'left') && (
                <VariablePicker
                  includeNumbers={false}
                  onSelect={val => { updateClause(i, { left: val }); setOpenPicker(null) }}
                  onClose={() => setOpenPicker(null)}
                  userVars={userVars}
                />
              )}
            </div>

            {/* OPERATOR slot */}
            <div style={{ position: 'relative' }}>
              <OperatorButton
                op={clause.op}
                onClick={() => togglePicker(i, 'op')}
              />
              {isOpen(i, 'op') && (
                <OperatorPicker
                  current={clause.op}
                  onSelect={op => { updateClause(i, { op }); setOpenPicker(null) }}
                  onClose={() => setOpenPicker(null)}
                />
              )}
            </div>

            {/* RIGHT slot */}
            <div style={{ position: 'relative' }}>
              <SlotButton
                value={clause.right}
                placeholder="value"
                isVariable={VARIABLES.includes(clause.right)}
                onClick={() => togglePicker(i, 'right')}
              />
              {isOpen(i, 'right') && (
                <VariablePicker
                  includeNumbers={true}
                  onSelect={val => { updateClause(i, { right: val }); setOpenPicker(null) }}
                  onClose={() => setOpenPicker(null)}
                  userVars={userVars}
                />
              )}
            </div>

            {/* Remove clause — only when 2+ clauses */}
            {state.clauses.length > 1 && (
              <button
                onClick={() => removeClause(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333355',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 4px',
                  transition: 'color 0.15s',
                  lineHeight: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#333355'}
                title="Remove clause"
              >
                ✕
              </button>
            )}

            {/* Clear single clause */}
            {state.clauses.length === 1 && (clause.left || clause.right) && (
              <button
                onClick={() => {
                  const next = { clauses: [{ ...DEFAULT_CLAUSE }], connectors: [] }
                  setState(next)
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
        </div>
      ))}

      {/* Add clause button — max 4 clauses */}
      {state.clauses.length < 4 && (
        <button
          onClick={addClause}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px dashed rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#444466',
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f97316'
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#444466'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        >
          + Add condition
        </button>
      )}
    </div>
  )
}
