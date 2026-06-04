import { useEffect } from 'react'

const TIPS = [
  'Check script syntax — IF/ELSE blocks must be properly formed',
  'Simplify nested conditions to reduce complexity',
  'Reduce the battle turn limit',
  'Ensure every script branch eventually reaches an action',
  'Reload the page if the problem persists',
]

export default function ErrorModal({ message, onClose, onRetry }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'tooltipFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#0d0d1a',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.15)',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(249,115,22,0.12))',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 15, fontWeight: 700, letterSpacing: '0.08em',
            color: '#fca5a5',
          }}>
            BATTLE START FAILED
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: '#555577', fontSize: 18, cursor: 'pointer', lineHeight: 1,
              padding: '2px 6px', borderRadius: 4, transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#555577'}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#9090bb', margin: '0 0 12px', lineHeight: 1.5 }}>
            We encountered an error trying to start your battle:
          </p>

          {/* Error message box */}
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '12px 14px',
            marginBottom: 20,
            maxHeight: 100, overflowY: 'auto',
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, color: '#fca5a5', lineHeight: 1.55,
            }}>
              {message}
            </span>
          </div>

          {/* Tips */}
          <div style={{ fontSize: 12, color: '#555577', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 10 }}>
            TROUBLESHOOTING TIPS
          </div>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TIPS.map((tip, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#7070a0', lineHeight: 1.4 }}>
                <span style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }}>•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8888aa', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            Close
          </button>
          <button
            onClick={onRetry}
            style={{
              padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', letterSpacing: '0.05em', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', color: '#fff',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Retry Battle
          </button>
        </div>
      </div>
    </div>
  )
}
