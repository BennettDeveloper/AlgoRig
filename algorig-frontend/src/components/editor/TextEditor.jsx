import { useRef, useEffect } from 'react'

const PLACEHOLDER = `IF myHP < 50
    Patch
    Firewall
ELSE
    HardStrike
    HeavyAttack
END IF
PowerSurge`

export default function TextEditor({ value, onChange }) {
  const textareaRef = useRef(null)
  const linesRef = useRef(null)

  const lineCount = Math.max((value || '').split('\n').length, 1)
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  const syncScroll = () => {
    if (textareaRef.current && linesRef.current) {
      linesRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  useEffect(() => {
    syncScroll()
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newValue = value.substring(0, start) + '    ' + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        e.target.selectionStart = start + 4
        e.target.selectionEnd = start + 4
      })
    }
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      display: 'flex',
      overflow: 'hidden',
      flex: 1,
    }}>
      <div
        ref={linesRef}
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 12px',
          color: '#333355',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          lineHeight: 1.8,
          minWidth: 48,
          textAlign: 'right',
          userSelect: 'none',
          overflowY: 'hidden',
          flexShrink: 0,
        }}
      >
        {lineNumbers.map(n => (
          <div key={n}>{n}</div>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          lineHeight: 1.8,
          color: '#e0e0ff',
          width: '100%',
          minHeight: 500,
          padding: '20px 16px',
          caretColor: '#f97316',
        }}
      />
    </div>
  )
}
