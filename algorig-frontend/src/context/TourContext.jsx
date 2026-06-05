import { createContext, useCallback, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Shepherd from 'shepherd.js'
import buildTour from '../hooks/useTour'

const TourContext = createContext({ startTour: () => {} })

export function TourProvider({ children }) {
  const navigate = useNavigate()
  const tourRef  = useRef(null)

  const startTour = useCallback(() => {
    // Cancel any currently active tour before rebuilding
    if (Shepherd.activeTour) {
      Shepherd.activeTour.cancel()
    }
    tourRef.current = buildTour(navigate)
    tourRef.current.start()
  }, [navigate])

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  return useContext(TourContext)
}
