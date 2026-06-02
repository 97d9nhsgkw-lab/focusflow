import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useTimer } from '../../hooks/useTimer'
import { formatTimerDisplay } from '../../utils'
import { POMODORO_PRESETS } from '../../types'
import type { PomodoroPreset } from '../../types'

type Phase = 'work' | 'shortBreak' | 'longBreak'

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const PHASE_COLORS: Record<Phase, string> = {
  work: '#0ea5e9',
  shortBreak: '#10b981',
  longBreak: '#8b5cf6',
}

const PomodoroTimer = () => {
  const { settings, todayCompleted, updateSettings, incrementSession } =
    usePomodoroStore()

  const [phase, setPhase] = useState<Phase>('work')
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0])
  const [sessionsUntilLong, setSessionsUntilLong] = useState(0)

  const notificationRef = useRef<Notification | null>(null)

  const getPhaseDuration = useCallback(
    (p: Phase): number => {
      switch (p) {
        case 'work':
          return settings.workDuration * 60
        case 'shortBreak':
          return settings.shortBreakDuration * 60
        case 'longBreak':
          return settings.longBreakDuration * 60
      }
    },
    [settings]
  )

  const timerRef = useRef<{ start: () => void; reset: (t?: number) => void }>({ start: () => {}, reset: () => {} })

  const handleSessionComplete = useCallback(() => {
    const { start: timerStart, reset: timerReset } = timerRef.current
    if (phase === 'work') {
      incrementSession()
      setSessionsUntilLong((prev) => prev + 1)

      if (sessionsUntilLong + 1 >= settings.sessionsBeforeLongBreak) {
        setPhase('longBreak')
        setSessionsUntilLong(0)
        timerReset(getPhaseDuration('longBreak'))
        if (settings.autoStartBreaks) timerStart()
      } else {
        setPhase('shortBreak')
        timerReset(getPhaseDuration('shortBreak'))
        if (settings.autoStartBreaks) timerStart()
      }
    } else {
      setPhase('work')
      timerReset(getPhaseDuration('work'))
      if (settings.autoStartPomodoros) timerStart()
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = phase === 'work' ? 'Work session complete!' : 'Break is over!'
      const body = phase === 'work' ? 'Time for a break.' : 'Ready to focus?'
      notificationRef.current = new Notification(title, { body })
    }
  }, [phase, sessionsUntilLong, settings, incrementSession, getPhaseDuration])

  const { timeLeft, isRunning, start, pause, reset, progress } = useTimer(
    getPhaseDuration(phase),
    handleSessionComplete
  )

  useEffect(() => {
    timerRef.current = { start, reset }
  }, [start, reset])

  const handleReset = useCallback(() => {
    reset(getPhaseDuration(phase))
  }, [reset, phase, getPhaseDuration])

  const handlePresetChange = useCallback(
    (preset: PomodoroPreset) => {
      setSelectedPreset(preset)
      updateSettings({
        workDuration: preset.work,
        shortBreakDuration: preset.shortBreak,
        longBreakDuration: preset.longBreak,
      })
      setPhase('work')
      setSessionsUntilLong(0)
      reset(preset.work * 60)
    },
    [updateSettings, reset]
  )

  const toggleAutoStartBreaks = useCallback(() => {
    updateSettings({ autoStartBreaks: !settings.autoStartBreaks })
  }, [settings.autoStartBreaks, updateSettings])

  const toggleAutoStartPomodoros = useCallback(() => {
    updateSettings({ autoStartPomodoros: !settings.autoStartPomodoros })
  }, [settings.autoStartPomodoros, updateSettings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isRunning) {
          pause()
        } else {
          start()
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, start, pause, handleReset])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const circumference = 2 * Math.PI * 90
  const dashOffset = circumference - (progress / 100) * circumference
  const dailyProgress = settings.dailyGoal > 0 ? (todayCompleted / settings.dailyGoal) * 100 : 0

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Timer className="h-6 w-6" />
        Pomodoro Timer
      </h1>

      <div className="flex flex-wrap justify-center gap-2">
        {POMODORO_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetChange(preset)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPreset.name === preset.name
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {preset.name} {preset.work}/{preset.shortBreak}
          </button>
        ))}
      </div>

      <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: PHASE_COLORS[phase] }}>
        {PHASE_LABELS[phase]}
      </div>

      <div className="relative w-64 h-64">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={PHASE_COLORS[phase]}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
            {formatTimerDisplay(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => (isRunning ? pause() : start())}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Sessions today</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayCompleted}</p>
      </div>

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span>Daily Goal</span>
          <span>
            {todayCompleted}/{settings.dailyGoal}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(dailyProgress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoStartBreaks}
            onChange={toggleAutoStartBreaks}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Auto-start breaks</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoStartPomodoros}
            onChange={toggleAutoStartPomodoros}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Auto-start pomodoros</span>
        </label>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Space</kbd> to
        start/pause · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">R</kbd> to
        reset
      </div>
    </div>
  )
}

export default PomodoroTimer
