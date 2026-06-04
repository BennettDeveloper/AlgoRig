import { useToast } from '../../context/ToastContext'

const BORDER = {
  success:     '#22c55e',
  error:       '#ef4444',
  achievement: '#f97316',
}
const ICON = {
  success:     '✓',
  error:       '✗',
  achievement: '🏆',
}

function ToastItem({ toast, onRemove }) {
  const border = BORDER[toast.type] ?? '#f97316'
  const icon   = ICON[toast.type]  ?? '🏆'

  return (
    <div style={{
      background: '#0f0f1e',
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: `3px solid ${border}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      animation: 'toastSlideIn 0.25s ease-out',
      minWidth: 280,
      maxWidth: 340,
      pointerEvents: 'all',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#f0f0ff',
          marginBottom: toast.message ? 3 : 0,
          fontFamily: 'inherit',
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: 12, color: '#8888aa', lineHeight: 1.4 }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#444466',
          cursor: 'pointer',
          fontSize: 13,
          padding: '1px 3px',
          lineHeight: 1,
          flexShrink: 0,
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#8888aa'}
        onMouseLeave={e => e.currentTarget.style.color = '#444466'}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
