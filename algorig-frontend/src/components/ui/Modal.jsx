import { useEffect } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = '480px',
  showCloseButton = true,
}) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f1a',
          borderTop: '3px solid #f97316',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          width,
          maxWidth: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff' }}>
            {title}
          </span>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#555577',
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                padding: '0 4px',
                flexShrink: 0,
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
              onMouseLeave={e => e.currentTarget.style.color = '#555577'}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}
