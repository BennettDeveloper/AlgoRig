import { createContext, useContext, useState, useCallback, useRef } from 'react'

const TooltipContext = createContext(null)

export function TooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState(null)
  const timerRef = useRef(null)

  const showTooltip = useCallback((e, content) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setTooltip({ x: e.clientX + 16, y: e.clientY + 8, content })
    }, 400)
  }, [])

  const moveTooltip = useCallback((e) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX + 16, y: e.clientY + 8 } : null)
  }, [])

  const hideTooltip = useCallback(() => {
    clearTimeout(timerRef.current)
    setTooltip(null)
  }, [])

  return (
    <TooltipContext.Provider value={{ showTooltip, moveTooltip, hideTooltip }}>
      {children}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 9999,
            pointerEvents: 'none',
            maxWidth: 280,
            animation: 'fadeInUp 0.15s ease',
          }}
        >
          <div style={{
            background: '#0a0a14',
            border: `1px solid ${(tooltip.content.color || 'rgba(255,255,255,0.12)') + '40'}`,
            borderTop: `3px solid ${tooltip.content.color || '#f97316'}`,
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{tooltip.content.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff' }}>
                {tooltip.content.label}
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: `${tooltip.content.color}20`,
                border: `1px solid ${tooltip.content.color}40`,
                color: tooltip.content.color,
                fontFamily: 'JetBrains Mono, monospace',
                marginLeft: 'auto',
              }}>
                {tooltip.content.category}
              </span>
            </div>

            <div style={{
              fontSize: 12,
              color: '#9090bb',
              lineHeight: 1.6,
              marginBottom: 10,
            }}>
              {tooltip.content.description}
            </div>

            {tooltip.content.cost && (
              <div style={{
                display: 'flex',
                gap: 12,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                marginBottom: 8,
              }}>
                <div style={{ fontSize: 11, color: '#555577' }}>
                  ⚡ COST{' '}
                  <span style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                    {tooltip.content.cost}
                  </span>
                </div>
                {tooltip.content.effect && (
                  <div style={{ fontSize: 11, color: '#555577' }}>
                    {tooltip.content.effectIcon} EFFECT{' '}
                    <span style={{ color: tooltip.content.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {tooltip.content.effect}
                    </span>
                  </div>
                )}
              </div>
            )}

            {tooltip.content.tip && (
              <div style={{
                fontSize: 11,
                color: '#666688',
                fontStyle: 'italic',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 8,
                display: 'flex',
                gap: 6,
              }}>
                <span>💡</span>
                <span>{tooltip.content.tip}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </TooltipContext.Provider>
  )
}

export const useTooltip = () => useContext(TooltipContext)
