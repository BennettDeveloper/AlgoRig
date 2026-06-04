import { useState, useEffect, useRef, useCallback } from 'react'

export default function useReplayEngine(log) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [countdownActive, setCountdownActive] = useState(false)
  const [battleEnded, setBattleEnded] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)
  const endTimerRef = useRef(null)

  const totalEvents = log.length

  // Start countdown once log is loaded
  useEffect(() => {
    if (log.length === 0) return
    setCountdownActive(true)
  }, [log.length])

  useEffect(() => {
    if (!countdownActive || log.length === 0) return
    const steps = [3, 2, 1, 'FIGHT!']
    let i = 0
    setCountdown(steps[0])
    countdownRef.current = setInterval(() => {
      i++
      if (i < steps.length) {
        setCountdown(steps[i])
      } else {
        clearInterval(countdownRef.current)
        setCountdown(null)
        setCountdownActive(false)
        setIsPlaying(true)
      }
    }, 900)
    return () => clearInterval(countdownRef.current)
  }, [countdownActive])

  // Playback interval
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev + 1 >= totalEvents) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, Math.round(1200 / speed))
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, totalEvents, speed])

  const play = useCallback(() => {
    if (currentIndex >= totalEvents - 1) setCurrentIndex(-1)
    setIsPlaying(true)
  }, [currentIndex, totalEvents])

  const pause = useCallback(() => setIsPlaying(false), [])

  const stepForward = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex(prev => Math.min(prev + 1, totalEvents - 1))
  }, [totalEvents])

  const stepBack = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex(prev => Math.max(prev - 1, -1))
  }, [])

  const seek = useCallback((index) => {
    setIsPlaying(false)
    setCurrentIndex(Math.max(-1, Math.min(index, totalEvents - 1)))
  }, [totalEvents])

  const rewatch = useCallback(() => {
    setBattleEnded(false)
    setIsPlaying(false)
    setCurrentIndex(0)
  }, [])

  // Show victory screen 2.5s after reaching the last entry
  useEffect(() => {
    if (currentIndex === totalEvents - 1 && totalEvents > 0) {
      setIsPlaying(false)
      endTimerRef.current = setTimeout(() => setBattleEnded(true), 2500)
    } else {
      clearTimeout(endTimerRef.current)
      setBattleEnded(false)
    }
    return () => clearTimeout(endTimerRef.current)
  }, [currentIndex, totalEvents])

  // Reconstruct HP and battery state at a given log index
  const getHpState = useCallback((upToIndex) => {
    if (upToIndex < 0 || log.length === 0) {
      return { hpA: null, hpB: null, batteryA: null, batteryB: null }
    }
    let hpA = null, hpB = null, batteryA = null, batteryB = null

    for (let i = 0; i <= upToIndex && i < log.length; i++) {
      const e = log[i]
      if (!e || e.entryType === 'CONDITION_CHECK') continue

      if (e.entryType === 'BATTERY_DRAIN') {
        if (e.actor === 'A') batteryA = e.attackerBatteryAfter
        else batteryB = e.attackerBatteryAfter
        continue
      }

      if (e.actor === 'A') {
        hpA = e.attackerHpAfter
        batteryA = e.attackerBatteryAfter
        if (e.defenderHpAfter !== undefined) hpB = e.defenderHpAfter
      } else {
        hpB = e.attackerHpAfter
        batteryB = e.attackerBatteryAfter
        if (e.defenderHpAfter !== undefined) hpA = e.defenderHpAfter
      }
    }

    return { hpA, hpB, batteryA, batteryB }
  }, [log])

  const currentEvent = currentIndex >= 0 && currentIndex < log.length ? log[currentIndex] : null

  return {
    currentIndex,
    currentEvent,
    totalEvents,
    isPlaying,
    countdown,
    battleEnded,
    speed,
    setSpeed,
    play,
    pause,
    stepForward,
    stepBack,
    seek,
    rewatch,
    getHpState,
  }
}
