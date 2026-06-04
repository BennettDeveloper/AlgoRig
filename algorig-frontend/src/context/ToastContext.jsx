import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((type, title, message) => {
    const id = ++nextId
    setToasts(prev => {
      const next = [...prev, { id, type, title, message }]
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const showAchievement = useCallback((achievement) => {
    showToast(
      'achievement',
      `${achievement.icon} ${achievement.displayName}`,
      achievement.description
    )
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, showAchievement, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext
