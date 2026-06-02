import { useState, useCallback, useRef, useEffect } from 'react'

interface UseTimerReturn {
  timeLeft: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: (newTime?: number) => void
  progress: number
}

export const useTimer = (
  initialTime: number,
  onComplete?: () => void
): UseTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const totalTimeRef = useRef(initialTime)
  const intervalRef = useRef<number | null>(null)

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimerInterval()
  }, [clearTimerInterval])

  const start = useCallback(() => {
    setIsRunning(true)
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimerInterval()
          setIsRunning(false)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onComplete, clearTimerInterval])

  const pause = useCallback(() => {
    clearTimerInterval()
    setIsRunning(false)
  }, [clearTimerInterval])

  const reset = useCallback(
    (newTime?: number) => {
      clearTimerInterval()
      const time = newTime ?? initialTime
      setTimeLeft(time)
      totalTimeRef.current = time
      setIsRunning(false)
    },
    [initialTime, clearTimerInterval]
  )

  const progress = totalTimeRef.current > 0
    ? ((totalTimeRef.current - timeLeft) / totalTimeRef.current) * 100
    : 0

  return { timeLeft, isRunning, start, pause, reset, progress }
}
